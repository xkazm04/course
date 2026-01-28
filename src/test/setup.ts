/**
 * Vitest Setup File
 *
 * Global test configuration and mocks.
 */

import { vi, beforeAll, afterEach } from 'vitest';
import '@testing-library/jest-dom/vitest';

// Mock ResizeObserver with callback execution
class MockResizeObserver {
    callback: ResizeObserverCallback;

    constructor(callback: ResizeObserverCallback) {
        this.callback = callback;
    }

    observe = vi.fn((target: Element) => {
        // Immediately call the callback with mocked dimensions
        setTimeout(() => {
            this.callback([{
                target,
                contentRect: { width: 800, height: 600 } as DOMRectReadOnly,
                borderBoxSize: [{ blockSize: 600, inlineSize: 800 }],
                contentBoxSize: [{ blockSize: 600, inlineSize: 800 }],
                devicePixelContentBoxSize: [{ blockSize: 600, inlineSize: 800 }],
            }], this as unknown as ResizeObserver);
        }, 0);
    });
    unobserve = vi.fn();
    disconnect = vi.fn();
}

// Mock canvas context
const createMockCanvasContext = () => ({
    canvas: { width: 800, height: 600 },
    fillStyle: '',
    strokeStyle: '',
    lineWidth: 1,
    font: '',
    textAlign: 'left',
    textBaseline: 'top',
    shadowBlur: 0,
    shadowColor: '',
    globalAlpha: 1,
    save: vi.fn(),
    restore: vi.fn(),
    setTransform: vi.fn(),
    translate: vi.fn(),
    scale: vi.fn(),
    rotate: vi.fn(),
    clearRect: vi.fn(),
    fillRect: vi.fn(),
    strokeRect: vi.fn(),
    beginPath: vi.fn(),
    closePath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    arc: vi.fn(),
    ellipse: vi.fn(),
    roundRect: vi.fn(),
    fill: vi.fn(),
    stroke: vi.fn(),
    fillText: vi.fn(),
    strokeText: vi.fn(),
    measureText: vi.fn(() => ({ width: 100 })),
    createRadialGradient: vi.fn(() => ({
        addColorStop: vi.fn(),
    })),
    createLinearGradient: vi.fn(() => ({
        addColorStop: vi.fn(),
    })),
    getImageData: vi.fn(() => ({ data: new Uint8ClampedArray(4) })),
    putImageData: vi.fn(),
    drawImage: vi.fn(),
});

beforeAll(() => {
    // Mock ResizeObserver
    global.ResizeObserver = MockResizeObserver as unknown as typeof ResizeObserver;

    // Mock requestAnimationFrame
    global.requestAnimationFrame = vi.fn((cb) => {
        setTimeout(cb, 16);
        return 1;
    });
    global.cancelAnimationFrame = vi.fn();

    // Mock canvas getContext
    HTMLCanvasElement.prototype.getContext = vi.fn(function(this: HTMLCanvasElement, contextId: string) {
        if (contextId === '2d') {
            return createMockCanvasContext() as unknown as CanvasRenderingContext2D;
        }
        return null;
    }) as typeof HTMLCanvasElement.prototype.getContext;

    // Mock devicePixelRatio
    Object.defineProperty(window, 'devicePixelRatio', {
        value: 1,
        writable: true,
    });

    // Mock getBoundingClientRect
    Element.prototype.getBoundingClientRect = vi.fn(() => ({
        width: 800,
        height: 600,
        top: 0,
        left: 0,
        bottom: 600,
        right: 800,
        x: 0,
        y: 0,
        toJSON: () => {},
    }));

    // Mock clientWidth/clientHeight for containers
    Object.defineProperty(HTMLElement.prototype, 'clientWidth', {
        configurable: true,
        get: function() { return 800; }
    });
    Object.defineProperty(HTMLElement.prototype, 'clientHeight', {
        configurable: true,
        get: function() { return 600; }
    });
});

afterEach(() => {
    vi.clearAllMocks();
});
