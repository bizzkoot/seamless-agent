export const DEFAULT_WHITEBOARD_CANVAS_WIDTH = 1600;
export const DEFAULT_WHITEBOARD_CANVAS_HEIGHT = 900;
export const DEFAULT_WHITEBOARD_CANVAS_BACKGROUND = '#ffffff';
export const DEFAULT_WHITEBOARD_CANVAS_NAME = 'Canvas 1';

export interface BlankFabricCanvasState {
    version: string;
    width: number;
    height: number;
    backgroundColor: string;
    objects: [];
    [key: string]: unknown;
}

function getFabricVersion(): string {
    try {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        return (require('fabric') as { version: string }).version;
    } catch {
        return 'unknown';
    }
}

export function createBlankFabricCanvasState(): BlankFabricCanvasState {
    return {
        version: getFabricVersion(),
        width: DEFAULT_WHITEBOARD_CANVAS_WIDTH,
        height: DEFAULT_WHITEBOARD_CANVAS_HEIGHT,
        backgroundColor: DEFAULT_WHITEBOARD_CANVAS_BACKGROUND,
        objects: [],
    };
}

export function serializeBlankFabricCanvasState(): string {
    return JSON.stringify(createBlankFabricCanvasState());
}
