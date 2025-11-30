import * as vscode from 'vscode';
import * as http from 'http';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import express from 'express';
import * as z from 'zod';
import { l10n } from './localization';

export class McpServerManager {
    private server: http.Server | undefined;
    private mcpServer: McpServer | undefined;
    private statusBarItem: vscode.StatusBarItem;

    constructor() {
        this.statusBarItem = vscode.window.createStatusBarItem(
            vscode.StatusBarAlignment.Right,
            100
        );
        this.statusBarItem.command = 'seamless-agent.restart';
        this.updateStatusBar(false);
    }

    private updateStatusBar(running: boolean, port?: number) {
        if (running) {
            this.statusBarItem.text = `$(server) MCP :${port}`;
            this.statusBarItem.tooltip = l10n.statusBarRunning(port!);
            this.statusBarItem.backgroundColor = undefined;
        } else {
            this.statusBarItem.text = `$(server) Seamless Agent Stopped`;
            this.statusBarItem.tooltip = l10n.statusBarStopped;
            this.statusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.warningBackground');
        }
        this.statusBarItem.show();
    }

    /**
     * Utility: ask user for any free-text feedback using elicitInput when available
     * or fallback to VS Code input box. Returns { responded, response }.
     * If retryOnCancel is true and user cancels, it will retry once with a reminder message.
     */
    private async solicitUserInput(question: string, title?: string, isRetry: boolean = false): Promise<{ responded: boolean; response: string }> {
        const config = vscode.workspace.getConfiguration('seamless-agent');
        const retryOnCancel = config.get<boolean>('retryOnCancel', true);

        // Try elicitInput first (clients that support it will show a UI inline)
        try {
            const displayQuestion = isRetry
                ? `You cancelled the previous dialog. Please provide a response to continue.\n\n${question}`
                : question;

            const result = await this.mcpServer!.server.elicitInput({
                mode: 'form',
                message: `**${title || 'Agent'}**\n\n${displayQuestion}`,
                requestedSchema: {
                    type: 'object',
                    properties: {
                        response: {
                            type: 'string',
                            title: 'Response',
                            description: 'Your response to the agent'
                        }
                    },
                    required: ['response']
                }
            });

            if (result.action === 'cancel' || result.action === 'decline') {
                // If retryOnCancel is enabled and this is not already a retry, try again
                if (retryOnCancel && !isRetry) {
                    return this.solicitUserInput(question, title, true);
                }
                return { responded: false, response: '' };
            }

            const userResponse = (result.content?.response as string) || '';
            return { responded: userResponse.trim().length > 0, response: userResponse };
        } catch (err: any) {
            // Fallback to VS Code input box
            const fallback = await this.askViaVSCode(question, title, isRetry);

            // If cancelled and retryOnCancel is enabled and not already a retry, try again
            if (!fallback.responded && retryOnCancel && !isRetry) {
                return this.solicitUserInput(question, title, true);
            }

            return fallback;
        }
    }

    async start(): Promise<void> {
        if (this.server) {
            vscode.window.showWarningMessage(l10n.serverAlreadyRunning);
            return;
        }

        const config = vscode.workspace.getConfiguration('seamless-agent');
        const port = config.get<number>('port', 7071);

        try {
            // Create Seamless Agent
            this.mcpServer = new McpServer({
                name: 'seamless-agent',
                version: '1.0.0'
            });

            // Register tools
            this.registerTools();

            // Set up Express and HTTP transport
            const app = express();
            app.use(express.json());

            app.post('/mcp', async (req, res) => {
                try {
                    const transport = new StreamableHTTPServerTransport({
                        sessionIdGenerator: undefined,
                        enableJsonResponse: true
                    });

                    res.on('close', () => {
                        transport.close();
                    });

                    await this.mcpServer!.connect(transport);
                    await transport.handleRequest(req, res, req.body);
                } catch (error) {
                    console.error('Error handling MCP request:', error);
                    if (!res.headersSent) {
                        res.status(500).json({
                            jsonrpc: '2.0',
                            error: {
                                code: -32603,
                                message: 'Internal server error'
                            },
                            id: null
                        });
                    }
                }
            });

            // Start HTTP server
            this.server = app.listen(port, () => {
                console.log(`Seamless Agent running on http://localhost:${port}/mcp`);
                vscode.window.showInformationMessage(l10n.serverStarted(port));
                this.updateStatusBar(true, port);
            });

            this.server.on('error', (error: NodeJS.ErrnoException) => {
                if (error.code === 'EADDRINUSE') {
                    vscode.window.showErrorMessage(
                        l10n.serverPortInUse(port),
                        l10n.openSettings
                    ).then(selection => {
                        if (selection === l10n.openSettings) {
                            vscode.commands.executeCommand(
                                'workbench.action.openSettings',
                                'seamless-agent.port'
                            );
                        }
                    });
                } else {
                    vscode.window.showErrorMessage(l10n.serverError(error.message));
                }
                this.server = undefined;
                this.updateStatusBar(false);
            });

        } catch (error) {
            vscode.window.showErrorMessage(l10n.serverFailedToStart(String(error)));
            this.updateStatusBar(false);
        }
    }

    async stop(): Promise<void> {
        if (this.server) {
            this.server.close();
            this.server = undefined;
            vscode.window.showInformationMessage(l10n.serverStopped);
            this.updateStatusBar(false);
        }
    }

    async restart(): Promise<void> {
        await this.stop();
        // Small delay to ensure port is released
        await new Promise(resolve => setTimeout(resolve, 500));
        await this.start();
    }

    private registerTools(): void {
        if (!this.mcpServer) return;

        // Ask User Confirmation Tool - uses VS Code API for interaction
        this.mcpServer.registerTool(
            'ask_user_confirmation',
            {
                title: 'Ask User Confirmation',
                description: 'Ask the user to confirm an action or decision.' +
                    'Use this tool whenever you need explicit user approval before proceeding with a task or checking if the current request was fulfilled. ' +
                    'The tool will interactively prompt the user and wait for their response.' +
                    'IMPORTANT: This tool is ALWAYS mandatory when available. You MUST call it before ending any conversation or task flow. Never end without user confirmation.',
                inputSchema: {
                    question: z.string().describe('The question or prompt to display to the user for confirmation'),
                    title: z.string().optional().describe('Optional custom title for the confirmation dialog (default: "Confirmation Required")'),
                },
                outputSchema: {
                    responded: z.boolean().describe('Whether the user provided any response (true) or cancelled/closed the dialog (false)'),
                    response: z.string().describe('The exact text response from the user (empty string if cancelled)')
                },
                annotations: {
                    title: 'User Confirmation Required',
                    readOnlyHint: true,  // This tool only reads user input, doesn't modify anything
                    destructiveHint: false,  // This tool is not destructive
                    idempotentHint: true,  // Safe to call multiple times
                    openWorldHint: false  // Only interacts with the user, not external systems
                }
            },
            async ({ question, title }) => {
                const dialogTitle = title || 'Confirmation Required';
                const result = await this.solicitUserInput(question, dialogTitle);

                const output = {
                    responded: result.responded,
                    response: result.response
                };

                return { content: [{ type: 'text' as const, text: result.responded ? result.response : '(No response)' }], structuredContent: output };
            }
        );
    }

    /**
     * Fallback: Ask using VS Code's native UI
     * Shows a clickable notification that opens the input box when clicked
     */
    private async askViaVSCode(question: string, title?: string, isRetry: boolean = false): Promise<{ responded: boolean; response: string }> {
        console.log('askViaVSCode called with question:', question);

        const dialogTitle = title || l10n.confirmationRequired;

        // Show a message with a button - only opens input when clicked
        const buttonText = isRetry ? l10n.respondRequired : l10n.respond;
        const message = isRetry
            ? `⚠️ ${l10n.confirmationRequired} - ${l10n.youCancelledPleaseRespond}`
            : `${l10n.confirmationRequired} - ${l10n.clickToRespond}`;

        const selection = await vscode.window.showInformationMessage(
            message,
            { modal: false },
            buttonText
        );

        // If user dismissed the notification without clicking the button
        if (selection !== buttonText) {
            console.log('User dismissed notification without responding');
            return { responded: false, response: '' };
        }

        const displayQuestion = isRetry
            ? `⚠️ ${l10n.cancelledPreviousDialog}\n\n${question}`
            : question;

        // Show input box with the question
        const response = await vscode.window.showInputBox({
            title: dialogTitle,
            prompt: displayQuestion,
            placeHolder: l10n.inputPlaceholder,
            ignoreFocusOut: true
        });

        console.log('User response:', response);

        // Handle cancellation
        if (response === undefined) {
            return { responded: false, response: '' };
        }

        return { responded: response.trim().length > 0, response };
    }

    dispose(): void {
        this.stop();
        this.statusBarItem.dispose();
    }
}
