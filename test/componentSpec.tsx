import { expect } from 'chai';
import React from 'react';
import { render, cleanup } from '@testing-library/react';
import { MosaicContext } from '../src/contextTypes';
import { MosaicKey, MosaicNode } from '../src/types';
import { MosaicZeroState } from '../src/MosaicZeroState';
import { Separator } from '../src/buttons/Separator';
import { DefaultToolbarButton } from '../src/buttons/MosaicButton';
import { MosaicWithoutDragDropContext } from '../src/Mosaic';

// Helper: create a mock MosaicContext value
function createMockMosaicContext(overrides: Partial<MosaicContext<string>> = {}): MosaicContext<string> {
  return {
    mosaicActions: {
      updateTree: () => void 0,
      remove: () => void 0,
      expand: () => void 0,
      hide: () => void 0,
      replaceWith: () => void 0,
      getRoot: () => null,
    },
    mosaicId: 'test-mosaic-id',
    blueprintNamespace: 'bp4',
    ...overrides,
  };
}

// Helper to render within MosaicContext
function renderWithMosaicContext(ui: React.ReactElement, contextValue?: MosaicContext<string>) {
  const ctx = contextValue || createMockMosaicContext();
  return render(
    React.createElement(MosaicContext.Provider, { value: ctx as any }, ui),
  );
}

afterEach(() => {
  cleanup();
});

describe('Component Tests', () => {
  describe('MosaicWithoutDragDropContext', () => {
    it('should render with a simple tree', () => {
      const tree: MosaicNode<string> = {
        direction: 'row',
        first: 'left',
        second: 'right',
      };

      const { container } = render(
        React.createElement(MosaicWithoutDragDropContext, {
          renderTile: (id: MosaicKey) => React.createElement('div', { 'data-testid': `tile-${id}` }, id),
          initialValue: tree,
        }),
      );

      expect(container.querySelector('.mosaic')).to.not.equal(null);
      expect(container.querySelector('.mosaic-root')).to.not.equal(null);
    });

    it('should render tiles from tree', () => {
      const tree: MosaicNode<string> = {
        direction: 'row',
        first: 'left',
        second: 'right',
      };

      const { container } = render(
        React.createElement(MosaicWithoutDragDropContext, {
          renderTile: (id: MosaicKey) =>
            React.createElement('div', { className: `tile-${id}` }, `Content: ${id}`),
          initialValue: tree,
        }),
      );

      expect(container.querySelector('.tile-left')).to.not.equal(null);
      expect(container.querySelector('.tile-right')).to.not.equal(null);
    });

    it('should render correct number of tiles', () => {
      const tree: MosaicNode<string> = {
        direction: 'row',
        first: 'a',
        second: {
          direction: 'column',
          first: 'b',
          second: 'c',
        },
      };

      const { container } = render(
        React.createElement(MosaicWithoutDragDropContext, {
          renderTile: (id: MosaicKey) => React.createElement('div', { className: 'test-tile' }, id),
          initialValue: tree,
        }),
      );

      const tiles = container.querySelectorAll('.mosaic-tile');
      expect(tiles.length).to.equal(3);
    });

    it('should render split lines between tiles', () => {
      const tree: MosaicNode<string> = {
        direction: 'row',
        first: 'left',
        second: 'right',
      };

      const { container } = render(
        React.createElement(MosaicWithoutDragDropContext, {
          renderTile: (id: MosaicKey) => React.createElement('div', null, id),
          initialValue: tree,
        }),
      );

      const splits = container.querySelectorAll('.mosaic-split');
      expect(splits.length).to.be.greaterThan(0);
    });

    it('should render zero state when value is null', () => {
      const { container } = render(
        React.createElement(MosaicWithoutDragDropContext, {
          renderTile: (id: MosaicKey) => React.createElement('div', null, id),
          initialValue: null,
        }),
      );

      expect(container.querySelector('.mosaic-zero-state')).to.not.equal(null);
    });

    it('should apply custom className', () => {
      const { container } = render(
        React.createElement(MosaicWithoutDragDropContext, {
          renderTile: (id: MosaicKey) => React.createElement('div', null, id),
          initialValue: null,
          className: 'my-custom-class',
        }),
      );

      expect(container.querySelector('.my-custom-class')).to.not.equal(null);
    });

    it('should apply default mosaic-blueprint-theme class', () => {
      const { container } = render(
        React.createElement(MosaicWithoutDragDropContext, {
          renderTile: (id: MosaicKey) => React.createElement('div', null, id),
          initialValue: null,
        }),
      );

      expect(container.querySelector('.mosaic-blueprint-theme')).to.not.equal(null);
    });

    it('should render custom zero state view', () => {
      const customZeroState = React.createElement('div', { className: 'custom-zero' }, 'No windows');

      const { container } = render(
        React.createElement(MosaicWithoutDragDropContext, {
          renderTile: (id: MosaicKey) => React.createElement('div', null, id),
          initialValue: null,
          zeroStateView: customZeroState,
        }),
      );

      expect(container.querySelector('.custom-zero')).to.not.equal(null);
    });

    it('should render split with correct direction class (row)', () => {
      const tree: MosaicNode<string> = {
        direction: 'row',
        first: 'left',
        second: 'right',
      };

      const { container } = render(
        React.createElement(MosaicWithoutDragDropContext, {
          renderTile: (id: MosaicKey) => React.createElement('div', null, id),
          initialValue: tree,
        }),
      );

      expect(container.querySelector('.mosaic-split.-row')).to.not.equal(null);
    });

    it('should render split with correct direction class (column)', () => {
      const tree: MosaicNode<string> = {
        direction: 'column',
        first: 'top',
        second: 'bottom',
      };

      const { container } = render(
        React.createElement(MosaicWithoutDragDropContext, {
          renderTile: (id: MosaicKey) => React.createElement('div', null, id),
          initialValue: tree,
        }),
      );

      expect(container.querySelector('.mosaic-split.-column')).to.not.equal(null);
    });

    it('should not render splits when resize is DISABLED', () => {
      const tree: MosaicNode<string> = {
        direction: 'row',
        first: 'left',
        second: 'right',
      };

      const { container } = render(
        React.createElement(MosaicWithoutDragDropContext, {
          renderTile: (id: MosaicKey) => React.createElement('div', null, id),
          initialValue: tree,
          resize: 'DISABLED',
        }),
      );

      expect(container.querySelector('.mosaic-split')).to.equal(null);
    });
  });

  describe('MosaicZeroState', () => {
    it('should render zero state text', () => {
      const { container } = renderWithMosaicContext(
        React.createElement(MosaicZeroState, {}),
      );
      expect(container.querySelector('.mosaic-zero-state')).to.not.equal(null);
    });

    it('should show "No Windows Present" heading', () => {
      const { container } = renderWithMosaicContext(
        React.createElement(MosaicZeroState, {}),
      );
      const heading = container.querySelector('h4');
      expect(heading).to.not.equal(null);
      expect(heading!.textContent).to.equal('No Windows Present');
    });

    it('should show add button when createNode is provided', () => {
      const { container } = renderWithMosaicContext(
        React.createElement(MosaicZeroState, {
          createNode: () => 'new-window',
        }),
      );
      const button = container.querySelector('button');
      expect(button).to.not.equal(null);
      expect(button!.textContent).to.include('Add New Window');
    });

    it('should not show add button when createNode is not provided', () => {
      const { container } = renderWithMosaicContext(
        React.createElement(MosaicZeroState, {}),
      );
      const button = container.querySelector('button');
      expect(button).to.equal(null);
    });
  });

  describe('Separator', () => {
    it('should render a separator div', () => {
      const { container } = render(React.createElement(Separator));
      expect(container.querySelector('.separator')).to.not.equal(null);
    });
  });

  describe('DefaultToolbarButton', () => {
    it('should render a button with title', () => {
      const { container } = renderWithMosaicContext(
        React.createElement(DefaultToolbarButton, {
          title: 'Test Button',
          className: 'test-btn',
          onClick: () => void 0,
        }),
      );

      const button = container.querySelector('button');
      expect(button).to.not.equal(null);
      expect(button!.getAttribute('title')).to.equal('Test Button');
    });

    it('should have correct CSS classes', () => {
      const { container } = renderWithMosaicContext(
        React.createElement(DefaultToolbarButton, {
          title: 'Test',
          className: 'my-class',
          onClick: () => void 0,
        }),
      );

      const button = container.querySelector('button');
      expect(button!.classList.contains('mosaic-default-control')).to.equal(true);
      expect(button!.classList.contains('my-class')).to.equal(true);
    });

    it('should render text when provided', () => {
      const { container } = renderWithMosaicContext(
        React.createElement(DefaultToolbarButton, {
          title: 'Test',
          className: 'test-btn',
          onClick: () => void 0,
          text: 'Click me',
        }),
      );

      const span = container.querySelector('.control-text');
      expect(span).to.not.equal(null);
      expect(span!.textContent).to.equal('Click me');
    });

    it('should not render text span when text is not provided', () => {
      const { container } = renderWithMosaicContext(
        React.createElement(DefaultToolbarButton, {
          title: 'Test',
          className: 'test-btn',
          onClick: () => void 0,
        }),
      );

      const span = container.querySelector('.control-text');
      expect(span).to.equal(null);
    });
  });

  describe('MosaicWithoutDragDropContext - Tree structure rendering', () => {
    it('should render a 4-pane layout correctly', () => {
      const tree: MosaicNode<string> = {
        direction: 'row',
        first: {
          direction: 'column',
          first: 'a',
          second: 'b',
        },
        second: {
          direction: 'column',
          first: 'c',
          second: 'd',
        },
      };

      const { container } = render(
        React.createElement(MosaicWithoutDragDropContext, {
          renderTile: (id: MosaicKey) =>
            React.createElement('div', { className: `tile tile-${id}` }, id),
          initialValue: tree,
        }),
      );

      const tiles = container.querySelectorAll('.mosaic-tile');
      expect(tiles.length).to.equal(4);
      expect(container.querySelector('.tile-a')).to.not.equal(null);
      expect(container.querySelector('.tile-b')).to.not.equal(null);
      expect(container.querySelector('.tile-c')).to.not.equal(null);
      expect(container.querySelector('.tile-d')).to.not.equal(null);
    });

    it('should render single-pane layout', () => {
      const { container } = render(
        React.createElement(MosaicWithoutDragDropContext, {
          renderTile: (id: MosaicKey) => React.createElement('div', { className: 'single-tile' }, id),
          initialValue: 'only',
        }),
      );

      const tiles = container.querySelectorAll('.mosaic-tile');
      expect(tiles.length).to.equal(1);
      expect(container.querySelector('.single-tile')).to.not.equal(null);
    });

    it('should render tiles with correct positioning styles', () => {
      const tree: MosaicNode<string> = {
        direction: 'row',
        first: 'left',
        second: 'right',
        splitPercentage: 30,
      };

      const { container } = render(
        React.createElement(MosaicWithoutDragDropContext, {
          renderTile: (id: MosaicKey) => React.createElement('div', null, id),
          initialValue: tree,
        }),
      );

      const tiles = container.querySelectorAll('.mosaic-tile');
      expect(tiles.length).to.equal(2);

      // Check that tiles have positioning styles
      const firstTile = tiles[0] as HTMLElement;
      expect(firstTile.style.right).to.equal('70%'); // 100 - 30
      const secondTile = tiles[1] as HTMLElement;
      expect(secondTile.style.left).to.equal('30%');
    });
  });
});

