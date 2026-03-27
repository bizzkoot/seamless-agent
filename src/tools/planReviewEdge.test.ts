import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const localRequire = createRequire(__filename);
const Module = localRequire('node:module') as typeof import('node:module') & {
    _load: (request: string, parent: unknown, isMain: boolean) => unknown;
};

describe('planReview edge cases and dependency mocks', () => {
    let originalLoad: typeof Module._load;
    let mockStorage: any;
    let mockPanel: any;
    let mockProvider: any;
    let mockLogger: any;
    let mockToken: any;
    let extensionContext: any;
    let planReview: any;

    beforeEach(() => {
        originalLoad = Module._load;
        mockStorage = {
            savePlanReviewInteraction: async () => 'mockId',
            updateInteraction: async () => undefined,
        };
        mockPanel = {
            showWithOptions: async () => ({ action: 'approved', requiredRevisions: [] }),
            closeIfOpen: () => undefined,
        };
        mockProvider = {
            refreshHome: () => undefined,
        };
        mockLogger = {
            log: () => undefined,
            error: () => undefined,
        };
        mockToken = {
            isCancellationRequested: false,
            onCancellationRequested: (cb: () => void) => ({ dispose: () => undefined }),
        };
        extensionContext = { extensionUri: { fsPath: '/mock' } };

        Module._load = function patchedLoad(request: string, parent: unknown, isMain: boolean) {
            if (request.endsWith('/chatHistoryStorage')) {
                return { getChatHistoryStorage: () => mockStorage };
            }
            if (request.endsWith('/planReviewPanel')) {
                return { PlanReviewPanel: mockPanel };
            }
            if (request.endsWith('/webviewProvider')) {
                return { AgentInteractionProvider: class {} };
            }
            if (request.endsWith('/logging')) {
                return { Logger: mockLogger };
            }
            // Delegate all other requests to originalLoad to avoid recursion
            return originalLoad(request, parent, isMain);
        };

        // Clear require cache to ensure mocks are applied
        const planReviewPath = require.resolve('./planReview.ts');
        delete require.cache[planReviewPath];

        planReview = localRequire('./planReview.ts').planReview;
    });

    afterEach(() => {
        Module._load = originalLoad;
    });

    it('should handle storage update throwing error gracefully', async () => {
        let errorLogged = false;
        mockStorage.updateInteraction = async () => { throw new Error('storage fail'); };
        mockLogger.error = () => { errorLogged = true; };
        mockPanel.showWithOptions = async () => ({ action: 'approved', requiredRevisions: [] });
        const result = await planReview({ plan: 'test', title: 't', mode: 'review' }, extensionContext, mockProvider, mockToken);
        assert.equal(result.status, 'approved');
        assert.equal(errorLogged, true);
    });

    it('should handle cancellation during panel display', async () => {
        let cancelled = false;
        mockToken.onCancellationRequested = (cb: () => void) => {
            cancelled = true;
            cb();
            return { dispose: () => undefined };
        };
        mockPanel.showWithOptions = async () => ({ action: 'approved', requiredRevisions: [] });
        const result = await planReview({ plan: 'test', title: 't', mode: 'review' }, extensionContext, mockProvider, mockToken);
        assert.equal(result.status, 'approved');
        assert.equal(cancelled, true);
    });
});
