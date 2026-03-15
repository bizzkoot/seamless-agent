export const WHITEBOARD_SUPPORTED_FABRIC_TYPES = new Set<string>([
    'rect', 'ellipse', 'triangle', 'line', 'path', 'i-text',
    'textbox', 'circle', 'image', 'group', 'activeSelection', 'polygon', 'polyline',
]);

export function normalizeWhiteboardFabricObjectType(type: string): string {
    const normalized = type.trim();
    const lower = normalized.toLowerCase();

    switch (lower) {
        case 'rect':
        case 'ellipse':
        case 'triangle':
        case 'line':
        case 'path':
        case 'textbox':
        case 'circle':
        case 'image':
        case 'group':
        case 'polygon':
        case 'polyline':
            return lower;
        case 'itext':
        case 'i-text':
            return 'i-text';
        case 'activeselection':
        case 'active-selection':
            return 'activeSelection';
        default:
            return normalized;
    }
}

let whiteboardFabricRegistryInitialized = false;

export function ensureWhiteboardFabricRegistry(): void {
    if (whiteboardFabricRegistryInitialized) {
        return;
    }

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const fabric = require('fabric') as {
        ActiveSelection: unknown; Circle: unknown; Ellipse: unknown; FabricImage: unknown;
        Group: unknown; IText: unknown; Line: unknown; Path: unknown; Polygon: unknown;
        Polyline: unknown; Rect: unknown; Textbox: unknown; Triangle: unknown;
        classRegistry: { setClass(ctor: unknown, type: string): void };
    };

    const registrations: Array<[unknown, string]> = [
        [fabric.Rect, 'rect'],
        [fabric.Ellipse, 'ellipse'],
        [fabric.Triangle, 'triangle'],
        [fabric.Line, 'line'],
        [fabric.Path, 'path'],
        [fabric.IText, 'i-text'],
        [fabric.Textbox, 'textbox'],
        [fabric.Circle, 'circle'],
        [fabric.FabricImage, 'image'],
        [fabric.Group, 'group'],
        [fabric.ActiveSelection, 'activeSelection'],
        [fabric.Polygon, 'polygon'],
        [fabric.Polyline, 'polyline'],
    ];

    for (const [constructor, type] of registrations) {
        fabric.classRegistry.setClass(constructor, type);
    }

    whiteboardFabricRegistryInitialized = true;
}

export function assertWhiteboardFabricObjectTypeSupported(type: string): void {
    const normalizedType = normalizeWhiteboardFabricObjectType(type);

    // WHITEBOARD_SUPPORTED_FABRIC_TYPES is the authoritative set of supported Fabric types.
    // Validating against this set is sufficient; loading fabric here would pull in a
    // browser-only dependency into the extension-host validation path and break testability.
    if (!WHITEBOARD_SUPPORTED_FABRIC_TYPES.has(normalizedType)) {
        throw new Error(`Canvas fabricState contains unsupported Fabric object type "${type}"`);
    }
}

export function assertWhiteboardFabricObjectsSupported(objects: unknown[]): void {
    for (const object of objects) {
        if (!object || typeof object !== 'object' || Array.isArray(object)) {
            throw new Error('Canvas fabricState objects must be valid Fabric.js object records');
        }

        const serializedObject = object as Record<string, unknown>;
        const type = typeof serializedObject.type === 'string' ? serializedObject.type : undefined;
        if (!type) {
            throw new Error('Canvas fabricState objects must include a Fabric object type');
        }

        assertWhiteboardFabricObjectTypeSupported(type);

        if (Array.isArray(serializedObject.objects)) {
            assertWhiteboardFabricObjectsSupported(serializedObject.objects);
        }
    }
}
