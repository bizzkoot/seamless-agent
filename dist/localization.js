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
exports.l10n = void 0;
exports.localize = localize;
const vscode = __importStar(require("vscode"));
// Load localized strings
const bundle = JSON.parse(JSON.stringify(require('../package.nls.json')));
// Try to load locale-specific bundle
try {
    const locale = vscode.env.language;
    if (locale && locale !== 'en') {
        const localizedBundle = require(`../package.nls.${locale}.json`);
        Object.assign(bundle, localizedBundle);
    }
}
catch {
    // Use default bundle if locale-specific not found
}
/**
 * Get a localized string by key
 * @param key The key from package.nls.json
 * @param args Optional arguments to replace {0}, {1}, etc.
 */
function localize(key, ...args) {
    let message = bundle[key] || key;
    // Replace placeholders {0}, {1}, etc.
    args.forEach((arg, index) => {
        message = message.replace(`{${index}}`, String(arg));
    });
    return message;
}
// Export common strings as constants for convenience
exports.l10n = {
    get confirmationRequired() { return localize('notification.confirmationRequired'); },
    get clickToRespond() { return localize('notification.clickToRespond'); },
    get youCancelledPleaseRespond() { return localize('notification.youCancelledPleaseRespond'); },
    get cancelledPreviousDialog() { return localize('notification.cancelledPreviousDialog'); },
    get respond() { return localize('button.respond'); },
    get respondRequired() { return localize('button.respondRequired'); },
    get inputPlaceholder() { return localize('input.placeholder'); },
    get serverStopped() { return localize('server.stopped'); },
    get serverAlreadyRunning() { return localize('server.alreadyRunning'); },
    get openSettings() { return localize('openSettings'); },
    serverStarted: (port) => localize('server.started', port),
    serverPortInUse: (port) => localize('server.portInUse', port),
    serverError: (msg) => localize('server.error', msg),
    serverFailedToStart: (msg) => localize('server.failedToStart', msg),
    statusBarRunning: (port) => localize('statusBar.running', port),
    get statusBarStopped() { return localize('statusBar.stopped'); }
};
//# sourceMappingURL=localization.js.map