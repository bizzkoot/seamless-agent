"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __glob = (map) => (path) => {
  var fn = map[path];
  if (fn) return fn();
  throw new Error("Module not found in bundle: " + path);
};
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// package.nls.pt-br.json
var require_package_nls_pt_br = __commonJS({
  "package.nls.pt-br.json"(exports2, module2) {
    module2.exports = {
      "notification.confirmationRequired": "Confirma\xE7\xE3o Necess\xE1ria",
      "notification.agentRequiresInput": "O agente precisa da sua entrada",
      "notification.openConsole": "Abrir Console",
      "button.respond": "Responder",
      "button.submit": "Enviar",
      "button.cancel": "Cancelar",
      "input.placeholder": "Digite sua resposta aqui...",
      "console.title": "Seamless Agent",
      "console.noPendingRequests": "Nenhuma solicita\xE7\xE3o pendente.",
      "console.yourResponse": "Sua resposta:",
      "badge.inputRequired": "Entrada Necess\xE1ria"
    };
  }
});

// package.nls.pt.json
var require_package_nls_pt = __commonJS({
  "package.nls.pt.json"(exports2, module2) {
    module2.exports = {
      "notification.confirmationRequired": "Confirma\xE7\xE3o Necess\xE1ria",
      "notification.agentRequiresInput": "O agente necessita da sua resposta",
      "notification.openConsole": "Abrir Consola",
      "button.respond": "Responder",
      "button.submit": "Submeter",
      "button.cancel": "Cancelar",
      "input.placeholder": "Escreva a sua resposta aqui...",
      "console.title": "Seamless Agent",
      "console.noPendingRequests": "Sem pedidos pendentes.",
      "console.yourResponse": "A sua resposta:",
      "badge.inputRequired": "Resposta Necess\xE1ria"
    };
  }
});

// package.nls.json
var require_package_nls = __commonJS({
  "package.nls.json"(exports2, module2) {
    module2.exports = {
      "notification.confirmationRequired": "Confirmation Required",
      "notification.agentRequiresInput": "Agent requires your input",
      "notification.openConsole": "Open Console",
      "button.respond": "Respond",
      "button.submit": "Submit",
      "button.cancel": "Cancel",
      "input.placeholder": "Type your response here...",
      "console.title": "Seamless Agent",
      "console.noPendingRequests": "No pending requests.",
      "console.yourResponse": "Your response:",
      "badge.inputRequired": "Input Required"
    };
  }
});

// src/extension.ts
var extension_exports = {};
__export(extension_exports, {
  activate: () => activate,
  deactivate: () => deactivate
});
module.exports = __toCommonJS(extension_exports);
var vscode4 = __toESM(require("vscode"));

// src/tools.ts
var vscode2 = __toESM(require("vscode"));

// src/localization.ts
var vscode = __toESM(require("vscode"));

// require("../package.nls.*.json") in src/localization.ts
var globRequire_package_nls_json = __glob({
  "../package.nls.pt-br.json": () => require_package_nls_pt_br(),
  "../package.nls.pt.json": () => require_package_nls_pt()
});

// src/localization.ts
var bundle = JSON.parse(
  JSON.stringify(require_package_nls())
);
try {
  const locale = vscode.env.language;
  if (locale && locale !== "en") {
    const localizedBundle = globRequire_package_nls_json(`../package.nls.${locale}.json`);
    Object.assign(bundle, localizedBundle);
  }
} catch {
}
function localize(key, ...args) {
  let message = bundle[key] || key;
  args.forEach((arg, index) => {
    message = message.replace(`{${index}}`, String(arg));
  });
  return message;
}
var strings = {
  get confirmationRequired() {
    return localize("notification.confirmationRequired");
  },
  get agentRequiresInput() {
    return localize("notification.agentRequiresInput");
  },
  get openConsole() {
    return localize("notification.openConsole");
  },
  get respond() {
    return localize("button.respond");
  },
  get submit() {
    return localize("button.submit");
  },
  get cancel() {
    return localize("button.cancel");
  },
  get inputPlaceholder() {
    return localize("input.placeholder");
  },
  get consoleTitle() {
    return localize("console.title");
  },
  get noPendingRequests() {
    return localize("console.noPendingRequests");
  },
  get yourResponse() {
    return localize("console.yourResponse");
  },
  get inputRequired() {
    return localize("badge.inputRequired");
  }
};

// src/tools.ts
function registerNativeTools(context, provider) {
  const confirmationTool = vscode2.lm.registerTool("ask_user", {
    async invoke(options, token) {
      const params = options.input;
      const question = params.question;
      const title = params.title || strings.confirmationRequired;
      const result = await askViaWebview(provider, question, title);
      return new vscode2.LanguageModelToolResult([
        new vscode2.LanguageModelTextPart(
          JSON.stringify({
            responded: result.responded,
            response: result.response
          })
        )
      ]);
    }
  });
  context.subscriptions.push(confirmationTool);
}
async function askViaWebview(provider, question, title) {
  const result = await provider.waitForUserResponse(question, title);
  if (!result.responded && result.response === "Agent Console view is not available.") {
    return askViaVSCode(question, title);
  }
  return result;
}
async function askViaVSCode(question, title) {
  const buttonText = strings.respond;
  await vscode2.commands.executeCommand("workbench.action.focusActiveEditorGroup");
  const selection = await vscode2.window.showWarningMessage(
    `${strings.confirmationRequired}: ${question}`,
    { modal: false },
    buttonText
  );
  if (selection !== buttonText) {
    return { responded: false, response: "" };
  }
  const response = await vscode2.window.showInputBox({
    title,
    prompt: question,
    placeHolder: strings.inputPlaceholder,
    ignoreFocusOut: true
  });
  if (response === void 0) {
    return { responded: false, response: "" };
  }
  return { responded: response.trim().length > 0, response };
}

// src/webviewProvider.ts
var vscode3 = __toESM(require("vscode"));
var AgentInteractionProvider = class {
  constructor(_extensionUri) {
    this._extensionUri = _extensionUri;
  }
  static viewType = "seamlessAgentView";
  _view;
  // Pending request state for promise-based handling
  _pendingRequest = null;
  resolveWebviewView(webviewView, context, token) {
    this._view = webviewView;
    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [
        vscode3.Uri.joinPath(this._extensionUri, "media"),
        vscode3.Uri.joinPath(this._extensionUri, "dist")
      ]
    };
    webviewView.webview.html = this._getHtmlContent(webviewView.webview);
    webviewView.webview.onDidReceiveMessage(
      (message) => {
        this._handleWebviewMessage(message);
      },
      void 0,
      []
    );
    webviewView.onDidDispose(() => {
      this._resolvePendingRequest({ responded: false, response: "View was closed" });
    });
  }
  /**
   * Wait for a user response to a question.
   * Returns a promise that resolves when the user submits or cancels.
   */
  async waitForUserResponse(question, title) {
    if (this._pendingRequest) {
      return { responded: false, response: "Another request is already pending." };
    }
    if (!this._view) {
      return { responded: false, response: "Agent Console view is not available." };
    }
    return new Promise((resolve) => {
      this._pendingRequest = { resolve };
      this.showQuestion(question, title || strings.confirmationRequired);
      this._setBadge(1);
      this._view?.show(true);
      this._showNotification();
    });
  }
  /**
   * Send a question to the webview for display
   */
  showQuestion(question, title) {
    const message = { type: "showQuestion", question, title };
    this._view?.webview.postMessage(message);
  }
  /**
   * Clear the current question from the webview
   */
  clear() {
    const message = { type: "clear" };
    this._view?.webview.postMessage(message);
  }
  /**
   * Handle messages received from the webview
   */
  _handleWebviewMessage(message) {
    switch (message.type) {
      case "submit":
        console.log("[AgentInteractionProvider] Submit received:", message.response);
        this._resolvePendingRequest({ responded: true, response: message.response });
        break;
      case "cancel":
        console.log("[AgentInteractionProvider] Cancel received");
        this._resolvePendingRequest({ responded: false, response: "" });
        break;
    }
  }
  /**
   * Resolve the pending request and clean up state
   */
  _resolvePendingRequest(result) {
    if (this._pendingRequest) {
      this._pendingRequest.resolve(result);
      this._pendingRequest = null;
      this._setBadge(0);
    }
  }
  /**
   * Set the badge count on the view
   */
  _setBadge(count) {
    if (this._view) {
      this._view.badge = count > 0 ? { value: count, tooltip: strings.inputRequired } : void 0;
    }
  }
  /**
   * Show a notification to alert the user of a pending request
   */
  _showNotification() {
    vscode3.window.showInformationMessage(
      strings.agentRequiresInput,
      strings.openConsole
    ).then((selection) => {
      if (selection === strings.openConsole) {
        vscode3.commands.executeCommand("seamlessAgentView.focus");
      }
    });
  }
  _getHtmlContent(webview) {
    const styleUri = webview.asWebviewUri(
      vscode3.Uri.joinPath(this._extensionUri, "media", "main.css")
    );
    const highlightStyleUri = webview.asWebviewUri(
      vscode3.Uri.joinPath(this._extensionUri, "media", "highlight.css")
    );
    const scriptUri = webview.asWebviewUri(
      vscode3.Uri.joinPath(this._extensionUri, "dist", "webview.js")
    );
    const nonce = this._getNonce();
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}';">
    <link href="${styleUri}" rel="stylesheet">
    <link href="${highlightStyleUri}" rel="stylesheet">
    <title>${strings.consoleTitle}</title>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>${strings.consoleTitle}</h1>
        </div>
        
        <!-- Empty state - shown when no request pending -->
        <div id="empty-state">
            <p class="placeholder">${strings.noPendingRequests}</p>
        </div>
        
        <!-- Request form - hidden until a question arrives -->
        <div id="request-form" class="hidden">
            <div class="question-section">
                <div class="question-title" id="question-title">${strings.confirmationRequired}</div>
                <div class="question-content" id="question-content"></div>
            </div>
            
            <div class="response-section">
                <label class="response-label" for="response-input">${strings.yourResponse}</label>
                <textarea 
                    id="response-input" 
                    placeholder="${strings.inputPlaceholder}"
                    rows="5"
                ></textarea>
            </div>
            
            <div class="button-group">
                <button type="button" id="submit-btn" class="btn-primary">${strings.submit}</button>
                <button type="button" id="cancel-btn" class="btn-secondary">${strings.cancel}</button>
            </div>
        </div>
    </div>
    
    <script nonce="${nonce}" src="${scriptUri}"></script>
</body>
</html>`;
  }
  _getNonce() {
    let text = "";
    const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    for (let i = 0; i < 32; i++) {
      text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
  }
};

// src/extension.ts
var PARTICIPANT_ID = "seamless-agent.agent";
function activate(context) {
  console.log("Seamless Agent extension active");
  const provider = new AgentInteractionProvider(context.extensionUri);
  context.subscriptions.push(
    vscode4.window.registerWebviewViewProvider(AgentInteractionProvider.viewType, provider, {
      webviewOptions: { retainContextWhenHidden: true }
    })
  );
  registerNativeTools(context, provider);
  const handler = async (request, chatContext, stream, token) => {
    const askUserTool = vscode4.lm.tools.find((t) => t.name === "ask_user");
    const tools = askUserTool ? [askUserTool] : [];
    const systemPrompt = `You are a helpful assistant. 
IMPORTANT: You have access to an "ask_user" tool. You MUST use this tool before completing any task to confirm with the user that their request was fulfilled correctly.
Never finish a response without first calling the ask_user tool to verify with the user.`;
    const messages = [
      vscode4.LanguageModelChatMessage.User(systemPrompt),
      vscode4.LanguageModelChatMessage.User(request.prompt)
    ];
    let model = request.model;
    const options = {
      tools: tools.map((t) => ({
        name: t.name,
        description: t.description,
        inputSchema: t.inputSchema
      }))
    };
    try {
      const response = await model.sendRequest(messages, options, token);
      for await (const part of response.stream) {
        if (part instanceof vscode4.LanguageModelTextPart) {
          stream.markdown(part.value);
        } else if (part instanceof vscode4.LanguageModelToolCallPart) {
          stream.progress(`Calling ${part.name}...`);
          const toolResult = await vscode4.lm.invokeTool(part.name, {
            input: part.input,
            toolInvocationToken: request.toolInvocationToken
          }, token);
          for (const resultPart of toolResult.content) {
            if (resultPart instanceof vscode4.LanguageModelTextPart) {
              stream.markdown(`

**User Response:** ${resultPart.value}

`);
            }
          }
        }
      }
    } catch (err) {
      if (err instanceof vscode4.LanguageModelError) {
        stream.markdown(`Error: ${err.message}`);
      } else {
        throw err;
      }
    }
    return;
  };
  const participant = vscode4.chat.createChatParticipant(PARTICIPANT_ID, handler);
  participant.iconPath = new vscode4.ThemeIcon("question");
  context.subscriptions.push(participant);
}
function deactivate() {
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  activate,
  deactivate
});
//# sourceMappingURL=extension.js.map
