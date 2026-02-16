const { JSDOM } = require('jsdom');

// Set up jsdom environment manually (jsdom-global v3 doesn't work well with jsdom 25+)
const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
  url: 'http://localhost',
  pretendToBeVisual: true,
});

// Copy critical globals from jsdom window to global scope
global.window = dom.window;
global.document = dom.window.document;
global.navigator = dom.window.navigator;
global.HTMLElement = dom.window.HTMLElement;
global.HTMLDivElement = dom.window.HTMLDivElement;
global.HTMLSpanElement = dom.window.HTMLSpanElement;
global.HTMLButtonElement = dom.window.HTMLButtonElement;
global.HTMLInputElement = dom.window.HTMLInputElement;
global.Element = dom.window.Element;
global.Node = dom.window.Node;
global.NodeList = dom.window.NodeList;
global.DocumentFragment = dom.window.DocumentFragment;
global.Event = dom.window.Event;
global.MouseEvent = dom.window.MouseEvent;
global.KeyboardEvent = dom.window.KeyboardEvent;
global.CustomEvent = dom.window.CustomEvent;
global.MutationObserver = dom.window.MutationObserver;
global.getComputedStyle = dom.window.getComputedStyle;
global.requestAnimationFrame = dom.window.requestAnimationFrame || ((cb) => setTimeout(cb, 0));
global.cancelAnimationFrame = dom.window.cancelAnimationFrame || clearTimeout;
global.DOMParser = dom.window.DOMParser;
global.XMLSerializer = dom.window.XMLSerializer;
global.Text = dom.window.Text;
global.Comment = dom.window.Comment;
global.SVGElement = dom.window.SVGElement;
global.Range = dom.window.Range;

// Copy any remaining window properties that aren't already on global
Object.getOwnPropertyNames(dom.window).forEach((property) => {
  if (typeof global[property] === 'undefined') {
    try {
      const descriptor = Object.getOwnPropertyDescriptor(dom.window, property);
      if (descriptor) {
        Object.defineProperty(global, property, descriptor);
      }
    } catch (e) {
      // Some properties can't be copied, ignore
    }
  }
});

const mock = require('mock-require');

// Identity function for DnD connectors
const identity = (x) => x;

mock('rdndmb-html5-to-touch', { HTML5toTouch: {} });

mock('react-dnd', {
  useDrag: () => [{}, identity, identity],
  useDrop: () => [{ isOver: false, draggedMosaicId: undefined }, identity],
  DndProvider: ({ children }) => children,
});

mock('react-dnd-html5-backend', { HTML5Backend: {} });
mock('react-dnd-touch-backend', { TouchBackend: {} });
mock('react-dnd-multi-backend', { MultiBackend: {} });

// Suppress React 18 warnings in test environment
const originalConsoleError = console.error;
console.error = (...args) => {
  if (typeof args[0] === 'string' && args[0].includes('ReactDOM.render is no longer supported')) {
    return;
  }
  originalConsoleError.apply(console, args);
};
