# Seamless Agent MCP Server

[![VS Code Extension](https://img.shields.io/badge/VS%20Code-Extension-blue?logo=visualstudiocode)](https://code.visualstudio.com/)

`seamless-agent` is a VS Code extension that hosts a Model Context Protocol (MCP) server, providing interactive user confirmation tools for AI coding agents. It enables non-blocking user interactions without interrupting the agent's flow.

## [Configuration](#configuration) | [Tool Reference](#tools) | [Troubleshooting](#troubleshooting)

## Key Features

- **Non-blocking confirmations**: Uses MCP's `elicitInput` with VS Code UI fallback for seamless user interaction.
- **Retry on cancel**: Automatically retries once when user cancels a dialog (configurable).
- **VS Code native UI**: Falls back to VS Code's `showInputBox` when MCP clients don't support `elicitInput`.
- **Configurable settings**: Customize port, auto-start behavior, and retry settings.
- **Output only mode**: Display messages without waiting for user input.

## Disclaimer

`seamless-agent` exposes a confirmation dialog to MCP clients, allowing them to prompt users for input. The tool only returns what the user types—no automatic interpretation is performed.

## Requirements

- [VS Code](https://code.visualstudio.com/) version 1.106.0 or newer.
- [Node.js](https://nodejs.org/) v18 or newer.
- [npm](https://www.npmjs.com/).

## Getting Started

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/seamless-agent.git
   cd seamless-agent
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Compile the extension:
   ```bash
   npm run compile
   ```

4. Press `F5` in VS Code to run the extension in debug mode.

### MCP Client Configuration

Add the following config to your MCP client:

```json
{
  "mcpServers": {
    "seamless-agent": {
      "url": "http://127.0.0.1:7071/mcp"
    }
  }
}
```

> [!NOTE]
> The default port is `7071`. You can change it in VS Code settings under `mcp-server.port`.

<details>
  <summary>Copilot / VS Code</summary>
  
  Follow the MCP install [guide](https://code.visualstudio.com/docs/copilot/chat/mcp-servers#_add-an-mcp-server).
  
  Add the following to your `settings.json`:
  ```json
  {
    "mcp": {
      "servers": {
        "seamless-agent": {
          "url": "http://127.0.0.1:7071/mcp"
        }
      }
    }
  }
  ```
</details>

<details>
  <summary>Claude Desktop</summary>
  
  Add the following to your Claude Desktop config:
  ```json
  {
    "mcpServers": {
      "seamless-agent": {
        "url": "http://127.0.0.1:7071/mcp"
      }
    }
  }
  ```
</details>

<details>
  <summary>Other MCP Clients</summary>
  
  Use the standard HTTP transport configuration with the endpoint `http://127.0.0.1:7071/mcp`.
</details>

### Your First Prompt

Enter the following prompt in your MCP Client to check if everything is working:

```
Ask me if I want to continue with the current task.
```

Your MCP client should display a confirmation dialog and wait for your response.

## Tools

<!-- BEGIN TOOL REFERENCE -->

- **User Interaction** (1 tool)
  - [`ask_user_confirmation`](#ask_user_confirmation)

### ask_user_confirmation

Ask the user to confirm an action or decision. Use this tool whenever you need explicit user approval before proceeding with a task or checking if the current request was fulfilled.

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `question` | string | Yes | The question or prompt to display to the user for confirmation |
| `title` | string | No | Optional custom title for the confirmation dialog (default: "Confirmation Required") |
| `outputOnly` | boolean | No | If true, just display the message and continue without waiting for user input. Useful for status updates or final reports. |

**Returns:**

```typescript
{
  responded: boolean;  // true if user typed anything (always true when outputOnly=true)
  response: string;    // the exact user response (empty string if cancelled or outputOnly=true)
}
```

**Example - With user input:**

```typescript
const result = await callTool("ask_user_confirmation", {
  question: "Do you want to proceed with this action?",
  title: "Action Confirmation"
});

// result.responded will be true if user typed anything
// result.response contains the exact user response
// The LLM interprets if the response is positive/negative
```

**Example - Output only (no wait):**

```typescript
const result = await callTool("ask_user_confirmation", {
  question: "Task completed successfully! Files updated: 3",
  title: "Status Update",
  outputOnly: true
});

// result.responded will be true
// result.response will be empty
// Message is displayed and flow continues immediately
```

<!-- END TOOL REFERENCE -->

## Configuration

The Seamless Agent MCP server supports the following configuration options:

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `mcp-server.port` | number | `7071` | Port number for the MCP server |
| `mcp-server.autoStart` | boolean | `true` | Automatically start the MCP server when VS Code opens |
| `mcp-server.retryOnCancel` | boolean | `true` | If enabled, when the user cancels a dialog, the tool will retry once more before allowing the agent to end |

### Changing Settings

You can change these settings in VS Code:

1. Open VS Code Settings (`Ctrl+,` or `Cmd+,`)
2. Search for "mcp-server"
3. Modify the desired settings

Or add to your `settings.json`:

```json
{
  "mcp-server.port": 7071,
  "mcp-server.autoStart": true,
  "mcp-server.retryOnCancel": true
}
```

## Commands

The extension provides the following commands:

| Command | Description |
|---------|-------------|
| `MCP Server: Start Server` | Start the MCP server |
| `MCP Server: Stop Server` | Stop the MCP server |
| `MCP Server: Restart Server` | Restart the MCP server |

Access commands via the Command Palette (`Ctrl+Shift+P` or `Cmd+Shift+P`).

## Status Bar

When the server is running, a status bar item shows:
- **🔌 MCP: Running** - Server is active on the configured port
- **🔌 MCP: Stopped** - Server is not running

Click the status bar item to toggle the server on/off.

## Troubleshooting

### Server won't start

1. Check if the port is already in use:
   ```bash
   netstat -an | findstr 7071
   ```
2. Try a different port in settings
3. Check the Output panel for errors (View > Output > select "MCP Server")

### Dialog not appearing

1. Make sure VS Code is focused
2. Look for the input box at the top of VS Code
3. Check for a warning message prompting you to respond

### MCP client can't connect

1. Verify the server is running (check status bar)
2. Ensure the URL is correct: `http://127.0.0.1:7071/mcp`
3. Check firewall settings if connecting from another machine

### Retry on cancel not working

1. Verify `mcp-server.retryOnCancel` is set to `true` in settings
2. The retry only happens once per dialog to prevent infinite loops

### Disabling Tool Confirmation

By default, VS Code Copilot asks for confirmation before processing tool responses. To disable this:

**Option 1: Approve permanently (recommended)**

When the confirmation dialog appears, click the dropdown "Allow" → "Always Allow" or "Allow for this workspace". The tool will be auto-approved in future calls.

**Option 2: Global auto-approve (⚠️ security risk)**

Add to your VS Code settings:

```json
{
  "chat.tools.global.autoApprove": true
}
```

> [!WARNING]
> This disables confirmation for ALL MCP tools, not just this one. Only use if you trust all installed MCP servers.

## Development

### Build Commands

```bash
# Install dependencies
npm install

# Compile TypeScript
npm run compile

# Watch for changes
npm run watch

# Run extension in debug mode
Press F5 in VS Code
```

### Project Structure

```
seamless-agent/
├── src/
│   ├── extension.ts    # VS Code extension entry point
│   ├── mcpServer.ts    # MCP server with tools
│   └── server.ts       # Express HTTP server
├── package.json        # Extension manifest
├── tsconfig.json       # TypeScript configuration
└── README.md           # This file
```

## Architecture

- **Extension Entry**: `src/extension.ts` - VS Code extension activation
- **MCP Server**: `src/mcpServer.ts` - MCP server with tools and VS Code integration
- **Transport**: Uses `StreamableHTTPServerTransport` for HTTP-based MCP communication
- **Endpoint**: Single POST endpoint at `/mcp` for all MCP interactions

## License

MIT
