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
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = __importStar(require("vscode"));
const mcpServer_1 = require("./mcpServer");
let serverManager;
function activate(context) {
    console.log('Seamless Agent extension is now active');
    // Create server manager
    serverManager = new mcpServer_1.McpServerManager();
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
    if (config.get('autoStart', true)) {
        serverManager.start();
    }
    // Watch for configuration changes
    context.subscriptions.push(vscode.workspace.onDidChangeConfiguration(e => {
        if (e.affectsConfiguration('mcp-server.port')) {
            vscode.window.showInformationMessage('MCP Server port changed. Restart the server to apply changes.', 'Restart Now').then(selection => {
                if (selection === 'Restart Now') {
                    serverManager?.restart();
                }
            });
        }
    }));
}
function deactivate() {
    serverManager?.stop();
}
//# sourceMappingURL=extension.js.map