import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const localRequire = createRequire(__filename);
const Module = localRequire('node:module') as typeof import('node:module') & {
    _load: (request: string, parent: unknown, isMain: boolean) => unknown;
};

describe('planReviewApproval and walkthroughReview', () => {
    let originalLoad: typeof Module._load;
    let mockStorage: any;
    let mockPanel: any;
    let mockProvider: any;
    let mockLogger: any;
    let mockToken: any;
    let extensionContext: any;
    let planReviewApproval: any;
    let walkthroughReview: any;

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
        mockProvider = { refreshHome: () => undefined };
        mockLogger = { log: () => undefined, error: () => undefined };
        mockToken = { isCancellationRequested: false, onCancellationRequested: () => ({ dispose: () => undefined }) };
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

        // Ensure we reload planReview.ts so it uses our patched Module._load.
        delete (require as any).cache[localRequire.resolve('./planReview.ts')];
        planReviewApproval = localRequire('./planReview.ts').planReviewApproval;
        walkthroughReview = localRequire('./planReview.ts').walkthroughReview;
    });

    afterEach(() => {
        Module._load = originalLoad;
    });

    it('planReviewApproval should call planReview with mode "review" and return approved', async () => {
        mockPanel.showWithOptions = async (_uri: any, options: any) => {
            assert.equal(options.mode, 'review');
            return { action: 'approved', requiredRevisions: [] };
        };

        const result = await planReviewApproval({ plan: 'test', title: 't', chatId: 'c' }, extensionContext, mockProvider, mockToken);
        assert.equal(result.status, 'approved');
        assert.equal(result.reviewId, 'mockId');
        assert.deepEqual(result.requiredRevisions, []);
    });

    it('walkthroughReview should call planReview with mode "walkthrough" and return approved', async () => {
        mockPanel.showWithOptions = async (_uri: any, options: any) => {
            assert.equal(options.mode, 'walkthrough');
            return { action: 'approved', requiredRevisions: [] };
        };

        const result = await walkthroughReview({ plan: 'test', title: 't', chatId: 'c' }, extensionContext, mockProvider, mockToken);
        assert.equal(result.status, 'approved');
        assert.equal(result.reviewId, 'mockId');
        assert.deepEqual(result.requiredRevisions, []);
    });
});
