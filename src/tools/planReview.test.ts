import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const nodeRequire = createRequire(__filename);
const localRequire = createRequire(__filename);
const Module = nodeRequire('node:module') as typeof import('node:module') & {
    _load: (request: string, parent: unknown, isMain: boolean) => unknown;
};

describe('planReview', () => {
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

        // Ensure we reload the module so our patched Module._load is used.
        delete (require as any).cache[localRequire.resolve('./planReview.ts')];
        planReview = localRequire('./planReview.ts').planReview;
    });

    afterEach(() => {
        Module._load = originalLoad;
    });

    it('should handle cancellation before starting', async () => {
        mockToken.isCancellationRequested = true;
        const result = await planReview({ plan: 'test', title: 't', mode: 'review' }, extensionContext, mockProvider, mockToken);
        assert.deepEqual(result, { status: 'cancelled', requiredRevisions: [], reviewId: '' });
    });

    it('should save interaction, show panel, update status, and return approved', async () => {
        const result = await planReview({ plan: 'test', title: 't', mode: 'review' }, extensionContext, mockProvider, mockToken);
        assert.equal(result.status, 'approved');
        assert.equal(result.reviewId, 'mockId');
        assert.deepEqual(result.requiredRevisions, []);
    });

    it('should handle error in panel and mark as closed', async () => {
        mockPanel.showWithOptions = async () => { throw new Error('fail'); };
        const result = await planReview({ plan: 'test', title: 't', mode: 'review' }, extensionContext, mockProvider, mockToken);
        assert.equal(result.status, 'cancelled');
        assert.equal(result.reviewId, '');
        assert.deepEqual(result.requiredRevisions, []);
    });

    it('should clean up cancellation listener', async () => {
        let disposed = false;
        mockToken.onCancellationRequested = () => ({ dispose: () => { disposed = true; } });
        await planReview({ plan: 'test', title: 't', mode: 'review' }, extensionContext, mockProvider, mockToken);
        assert.equal(disposed, true);
    });
});
