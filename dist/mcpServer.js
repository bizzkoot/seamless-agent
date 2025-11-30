"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.McpServerManager = void 0;
const vscode = __importStar(require("vscode"));
const mcp_js_1 = require("@modelcontextprotocol/sdk/server/mcp.js");
const streamableHttp_js_1 = require("@modelcontextprotocol/sdk/server/streamableHttp.js");
const express_1 = __importDefault(require("express"));
const z = __importStar(require("zod"));
const localization_1 = require("./localization");
class McpServerManager {
    server;
    mcpServer;
    statusBarItem;
    constructor() {
        this.statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
        this.statusBarItem.command = 'seamless-agent.restart';
        this.updateStatusBar(false);
    }
    updateStatusBar(running, port) {
        if (running) {
            this.statusBarItem.text = `$(server) MCP :${port}`;
            this.statusBarItem.tooltip = localization_1.l10n.statusBarRunning(port);
            this.statusBarItem.backgroundColor = undefined;
        }
        else {
            this.statusBarItem.text = `$(server) Seamless Agent Stopped`;
            this.statusBarItem.tooltip = localization_1.l10n.statusBarStopped;
            this.statusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.warningBackground');
        }
        this.statusBarItem.show();
    }
    /**
     * Utility: ask user for any free-text feedback using elicitInput when available
     * or fallback to VS Code input box. Returns { responded, response }.
     * If retryOnCancel is true and user cancels, it will retry once with a reminder message.
     */
    async solicitUserInput(question, title, isRetry = false) {
        const config = vscode.workspace.getConfiguration('seamless-agent');
        const retryOnCancel = config.get('retryOnCancel', true);
        // Try elicitInput first (clients that support it will show a UI inline)
        try {
            const displayQuestion = isRetry
                ? `You cancelled the previous dialog. Please provide a response to continue.\n\n${question}`
                : question;
            const result = await this.mcpServer.server.elicitInput({
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
            const userResponse = result.content?.response || '';
            return { responded: userResponse.trim().length > 0, response: userResponse };
        }
        catch (err) {
            // Fallback to VS Code input box
            const fallback = await this.askViaVSCode(question, title, isRetry);
            // If cancelled and retryOnCancel is enabled and not already a retry, try again
            if (!fallback.responded && retryOnCancel && !isRetry) {
                return this.solicitUserInput(question, title, true);
            }
            return fallback;
        }
    }
    async start() {
        if (this.server) {
            vscode.window.showWarningMessage(localization_1.l10n.serverAlreadyRunning);
            return;
        }
        const config = vscode.workspace.getConfiguration('seamless-agent');
        const port = config.get('port', 7071);
        try {
            // Create Seamless Agent
            this.mcpServer = new mcp_js_1.McpServer({
                name: 'seamless-agent',
                version: '1.0.0'
            });
            // Register tools
            this.registerTools();
            // Set up Express and HTTP transport
            const app = (0, express_1.default)();
            app.use(express_1.default.json());
            app.post('/mcp', async (req, res) => {
                try {
                    const transport = new streamableHttp_js_1.StreamableHTTPServerTransport({
                        sessionIdGenerator: undefined,
                        enableJsonResponse: true
                    });
                    res.on('close', () => {
                        transport.close();
                    });
                    await this.mcpServer.connect(transport);
                    await transport.handleRequest(req, res, req.body);
                }
                catch (error) {
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
                vscode.window.showInformationMessage(localization_1.l10n.serverStarted(port));
                this.updateStatusBar(true, port);
            });
            this.server.on('error', (error) => {
                if (error.code === 'EADDRINUSE') {
                    vscode.window.showErrorMessage(localization_1.l10n.serverPortInUse(port), localization_1.l10n.openSettings).then(selection => {
                        if (selection === localization_1.l10n.openSettings) {
                            vscode.commands.executeCommand('workbench.action.openSettings', 'seamless-agent.port');
                        }
                    });
                }
                else {
                    vscode.window.showErrorMessage(localization_1.l10n.serverError(error.message));
                }
                this.server = undefined;
                this.updateStatusBar(false);
            });
        }
        catch (error) {
            vscode.window.showErrorMessage(localization_1.l10n.serverFailedToStart(String(error)));
            this.updateStatusBar(false);
        }
    }
    async stop() {
        if (this.server) {
            this.server.close();
            this.server = undefined;
            vscode.window.showInformationMessage(localization_1.l10n.serverStopped);
            this.updateStatusBar(false);
        }
    }
    async restart() {
        await this.stop();
        // Small delay to ensure port is released
        await new Promise(resolve => setTimeout(resolve, 500));
        await this.start();
    }
    registerTools() {
        if (!this.mcpServer)
            return;
        // Ask User Confirmation Tool - uses VS Code API for interaction
        this.mcpServer.registerTool('ask_user_confirmation', {
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
                readOnlyHint: true, // This tool only reads user input, doesn't modify anything
                destructiveHint: false, // This tool is not destructive
                idempotentHint: true, // Safe to call multiple times
                openWorldHint: false // Only interacts with the user, not external systems
            }
        }, async ({ question, title }) => {
            const dialogTitle = title || 'Confirmation Required';
            const result = await this.solicitUserInput(question, dialogTitle);
            const output = {
                responded: result.responded,
                response: result.response
            };
            return { content: [{ type: 'text', text: result.responded ? result.response : '(No response)' }], structuredContent: output };
        });
    }
    /**
     * Fallback: Ask using VS Code's native UI
     * Shows a clickable notification that opens the input box when clicked
     */
    async askViaVSCode(question, title, isRetry = false) {
        console.log('askViaVSCode called with question:', question);
        const dialogTitle = title || localization_1.l10n.confirmationRequired;
        // Show a message with a button - only opens input when clicked
        const buttonText = isRetry ? localization_1.l10n.respondRequired : localization_1.l10n.respond;
        const message = isRetry
            ? `⚠️ ${localization_1.l10n.confirmationRequired} - ${localization_1.l10n.youCancelledPleaseRespond}`
            : `${localization_1.l10n.confirmationRequired} - ${localization_1.l10n.clickToRespond}`;
        const selection = await vscode.window.showInformationMessage(message, { modal: false }, buttonText);
        // If user dismissed the notification without clicking the button
        if (selection !== buttonText) {
            console.log('User dismissed notification without responding');
            return { responded: false, response: '' };
        }
        const displayQuestion = isRetry
            ? `⚠️ ${localization_1.l10n.cancelledPreviousDialog}\n\n${question}`
            : question;
        // Show input box with the question
        const response = await vscode.window.showInputBox({
            title: dialogTitle,
            prompt: displayQuestion,
            placeHolder: localization_1.l10n.inputPlaceholder,
            ignoreFocusOut: true
        });
        console.log('User response:', response);
        // Handle cancellation
        if (response === undefined) {
            return { responded: false, response: '' };
        }
        return { responded: response.trim().length > 0, response };
    }
    dispose() {
        this.stop();
        this.statusBarItem.dispose();
    }
}
exports.McpServerManager = McpServerManager;
//# sourceMappingURL=mcpServer.js.map