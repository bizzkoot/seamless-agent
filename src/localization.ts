import * as vscode from 'vscode';

// Load localized strings
const bundle = JSON.parse(
    JSON.stringify(require('../package.nls.json'))
);

// Try to load locale-specific bundle
try {
    const locale = vscode.env.language;
    if (locale && locale !== 'en') {
        const localizedBundle = require(`../package.nls.${locale}.json`);
        Object.assign(bundle, localizedBundle);
    }
} catch {
    // Use default bundle if locale-specific not found
}

/**
 * Get a localized string by key
 * @param key The key from package.nls.json
 * @param args Optional arguments to replace {0}, {1}, etc.
 */
export function localize(key: string, ...args: (string | number)[]): string {
    let message = bundle[key] || key;

    // Replace placeholders {0}, {1}, etc.
    args.forEach((arg, index) => {
        message = message.replace(`{${index}}`, String(arg));
    });

    return message;
}

// Export common strings as constants for convenience
export const l10n = {
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
    serverStarted: (port: number) => localize('server.started', port),
    serverPortInUse: (port: number) => localize('server.portInUse', port),
    serverError: (msg: string) => localize('server.error', msg),
    serverFailedToStart: (msg: string) => localize('server.failedToStart', msg),
    statusBarRunning: (port: number) => localize('statusBar.running', port),
    get statusBarStopped() { return localize('statusBar.stopped'); }
};
