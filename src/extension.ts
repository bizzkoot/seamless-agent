import * as vscode from 'vscode';
import { McpServerManager } from './mcpServer';

let serverManager: McpServerManager | undefined;

export function activate(context: vscode.ExtensionContext) {
    console.log('Seamless Agent extension is now active');

    // Create server manager
    serverManager = new McpServerManager();

    // Register commands
    const startCommand = vscode.commands.registerCommand('seamless-agent.start', async () => {
        await serverManager?.start();
    });

    const stopCommand = vscode.commands.registerCommand('seamless-agent.stop', async () => {
        await serverManager?.stop();
    });

    const restartCommand = vscode.commands.registerCommand('seamless-agent.restart', async () => {
        await serverManager?.restart();
    });

    context.subscriptions.push(startCommand, stopCommand, restartCommand);

    // Auto-start if configured
    const config = vscode.workspace.getConfiguration('seamless-agent');
    if (config.get<boolean>('autoStart', true)) {
        serverManager.start();
    }

    // Watch for configuration changes
    context.subscriptions.push(
        vscode.workspace.onDidChangeConfiguration(e => {
            if (e.affectsConfiguration('mcp-server.port')) {
                vscode.window.showInformationMessage(
                    'MCP Server port changed. Restart the server to apply changes.',
                    'Restart Now'
                ).then(selection => {
                    if (selection === 'Restart Now') {
                        serverManager?.restart();
                    }
                });
            }
        })
    );
}

export function deactivate() {
    serverManager?.stop();
}
