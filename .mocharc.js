require('jsdom-global/register');
require('ts-node').register({
  transpileOnly: true,
});

const React = require('react');

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

module.exports = {
  spec: ['test/*.ts', 'test/*.tsx'],
  timeout: 10000,
};
