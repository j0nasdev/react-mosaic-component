import { expect } from 'chai';
import sinon from 'sinon';
import React from 'react';
import { render, cleanup } from '@testing-library/react';
import { MosaicContext } from '../src/contextTypes';
import { MosaicKey, MosaicNode } from '../src/types';
import { MosaicRoot } from '../src/MosaicRoot';

// ---- Helpers ----

function createMockMosaicContext(overrides: Partial<any> = {}) {
  return {
    mosaicActions: {
      updateTree: sinon.stub(),
      remove: sinon.stub(),
      expand: sinon.stub(),
      hide: sinon.stub(),
      replaceWith: sinon.stub(),
      getRoot: sinon.stub().returns(null),
      ...(overrides.mosaicActions || {}),
    },
    mosaicId: 'test-mosaic',
    blueprintNamespace: 'bp4',
    ...overrides,
  };
}

function renderMosaicRoot(root: MosaicNode<string>, resize?: any) {
  const ctx = createMockMosaicContext();
  return {
    ...render(
      React.createElement(
        MosaicContext.Provider,
        { value: ctx as any },
        React.createElement(MosaicRoot, {
          root,
          renderTile: (id: MosaicKey, path: any) =>
            React.createElement('div', { className: `tile-${id}`, 'data-path': path.join(',') }, id),
          resize,
        }),
      ),
    ),
    ctx,
  };
}

afterEach(() => {
  cleanup();
  sinon.restore();
});

describe('MosaicRoot Tests', () => {
  describe('Basic Rendering', () => {
    it('should render mosaic-root container', () => {
      const { container } = renderMosaicRoot('single-tile');
      expect(container.querySelector('.mosaic-root')).to.not.equal(null);
    });

    it('should render a single tile', () => {
      const { container } = renderMosaicRoot('only-tile');
      const tiles = container.querySelectorAll('.mosaic-tile');
      expect(tiles.length).to.equal(1);
    });

    it('should render tile content with renderTile callback', () => {
      const { container } = renderMosaicRoot('my-tile');
      expect(container.querySelector('.tile-my-tile')).to.not.equal(null);
      expect(container.querySelector('.tile-my-tile')!.textContent).to.equal('my-tile');
    });

    it('should render two tiles for a split', () => {
      const tree: MosaicNode<string> = {
        direction: 'row',
        first: 'left',
        second: 'right',
      };
      const { container } = renderMosaicRoot(tree);
      const tiles = container.querySelectorAll('.mosaic-tile');
      expect(tiles.length).to.equal(2);
    });

    it('should render 3 tiles for nested split', () => {
      const tree: MosaicNode<string> = {
        direction: 'row',
        first: 'a',
        second: {
          direction: 'column',
          first: 'b',
          second: 'c',
        },
      };
      const { container } = renderMosaicRoot(tree);
      expect(container.querySelectorAll('.mosaic-tile').length).to.equal(3);
    });

    it('should render 4 tiles for quad layout', () => {
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
      const { container } = renderMosaicRoot(tree);
      expect(container.querySelectorAll('.mosaic-tile').length).to.equal(4);
    });
  });

  describe('Split Lines', () => {
    it('should render split elements between tiles', () => {
      const tree: MosaicNode<string> = {
        direction: 'row',
        first: 'left',
        second: 'right',
      };
      const { container } = renderMosaicRoot(tree);
      const splits = container.querySelectorAll('.mosaic-split');
      expect(splits.length).to.equal(1);
    });

    it('should render 2 splits for 3-tile layout', () => {
      const tree: MosaicNode<string> = {
        direction: 'row',
        first: 'a',
        second: {
          direction: 'column',
          first: 'b',
          second: 'c',
        },
      };
      const { container } = renderMosaicRoot(tree);
      expect(container.querySelectorAll('.mosaic-split').length).to.equal(2);
    });

    it('should render 3 splits for quad layout', () => {
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
      const { container } = renderMosaicRoot(tree);
      expect(container.querySelectorAll('.mosaic-split').length).to.equal(3);
    });

    it('should not render splits when resize is DISABLED', () => {
      const tree: MosaicNode<string> = {
        direction: 'row',
        first: 'left',
        second: 'right',
      };
      const { container } = renderMosaicRoot(tree, 'DISABLED');
      expect(container.querySelectorAll('.mosaic-split').length).to.equal(0);
    });

    it('should render splits with row direction class', () => {
      const tree: MosaicNode<string> = {
        direction: 'row',
        first: 'left',
        second: 'right',
      };
      const { container } = renderMosaicRoot(tree);
      expect(container.querySelector('.mosaic-split.-row')).to.not.equal(null);
    });

    it('should render splits with column direction class', () => {
      const tree: MosaicNode<string> = {
        direction: 'column',
        first: 'top',
        second: 'bottom',
      };
      const { container } = renderMosaicRoot(tree);
      expect(container.querySelector('.mosaic-split.-column')).to.not.equal(null);
    });
  });

  describe('Tile Positioning', () => {
    it('should apply position styles to tiles', () => {
      const tree: MosaicNode<string> = {
        direction: 'row',
        first: 'left',
        second: 'right',
        splitPercentage: 40,
      };
      const { container } = renderMosaicRoot(tree);
      const tiles = container.querySelectorAll('.mosaic-tile');
      const firstTile = tiles[0] as HTMLElement;
      const secondTile = tiles[1] as HTMLElement;

      // First tile: right = 100 - 40 = 60%
      expect(firstTile.style.right).to.equal('60%');
      // Second tile: left = 40%
      expect(secondTile.style.left).to.equal('40%');
    });

    it('should default splitPercentage to 50 when not specified', () => {
      const tree: MosaicNode<string> = {
        direction: 'row',
        first: 'left',
        second: 'right',
      };
      const { container } = renderMosaicRoot(tree);
      const tiles = container.querySelectorAll('.mosaic-tile');
      const firstTile = tiles[0] as HTMLElement;
      expect(firstTile.style.right).to.equal('50%');
    });

    it('should apply column-direction positioning', () => {
      const tree: MosaicNode<string> = {
        direction: 'column',
        first: 'top',
        second: 'bottom',
        splitPercentage: 30,
      };
      const { container } = renderMosaicRoot(tree);
      const tiles = container.querySelectorAll('.mosaic-tile');
      const firstTile = tiles[0] as HTMLElement;
      const secondTile = tiles[1] as HTMLElement;

      // First tile: bottom = 100-30 = 70%
      expect(firstTile.style.bottom).to.equal('70%');
      // Second tile: top = 30%
      expect(secondTile.style.top).to.equal('30%');
    });
  });

  describe('With Numeric Keys', () => {
    it('should render tiles with numeric keys', () => {
      const tree: MosaicNode<number> = {
        direction: 'row',
        first: 1,
        second: 2,
      };

      const ctx = createMockMosaicContext();
      const { container } = render(
        React.createElement(
          MosaicContext.Provider,
          { value: ctx as any },
          React.createElement(MosaicRoot, {
            root: tree,
            renderTile: (id: MosaicKey) => React.createElement('div', { className: `tile-${id}` }, String(id)),
          }),
        ),
      );

      expect(container.querySelector('.tile-1')).to.not.equal(null);
      expect(container.querySelector('.tile-2')).to.not.equal(null);
    });
  });

  describe('Path Passing', () => {
    it('should pass correct path to renderTile for root leaf', () => {
      const renderSpy = sinon.spy((id: MosaicKey, _path: any) =>
        React.createElement('div', null, id),
      );

      const ctx = createMockMosaicContext();
      render(
        React.createElement(
          MosaicContext.Provider,
          { value: ctx as any },
          React.createElement(MosaicRoot, {
            root: 'only',
            renderTile: renderSpy as any,
          }),
        ),
      );

      expect(renderSpy.calledOnce).to.equal(true);
      expect(renderSpy.firstCall.args[1]).to.deep.equal([]);
    });

    it('should pass correct paths for split children', () => {
      const renderSpy = sinon.spy((id: MosaicKey, _path: any) =>
        React.createElement('div', null, id),
      );

      const tree: MosaicNode<string> = {
        direction: 'row',
        first: 'left',
        second: 'right',
      };

      const ctx = createMockMosaicContext();
      render(
        React.createElement(
          MosaicContext.Provider,
          { value: ctx as any },
          React.createElement(MosaicRoot, {
            root: tree,
            renderTile: renderSpy as any,
          }),
        ),
      );

      expect(renderSpy.calledTwice).to.equal(true);
      const paths = renderSpy.getCalls().map((call) => call.args[1]);
      expect(paths).to.deep.include(['first']);
      expect(paths).to.deep.include(['second']);
    });

    it('should pass nested paths for deeper tree', () => {
      const renderSpy = sinon.spy((id: MosaicKey, _path: any) =>
        React.createElement('div', null, id),
      );

      const tree: MosaicNode<string> = {
        direction: 'row',
        first: 'a',
        second: {
          direction: 'column',
          first: 'b',
          second: 'c',
        },
      };

      const ctx = createMockMosaicContext();
      render(
        React.createElement(
          MosaicContext.Provider,
          { value: ctx as any },
          React.createElement(MosaicRoot, {
            root: tree,
            renderTile: renderSpy as any,
          }),
        ),
      );

      expect(renderSpy.calledThrice).to.equal(true);
      const paths = renderSpy.getCalls().map((call) => call.args[1]);
      expect(paths).to.deep.include(['first']);
      expect(paths).to.deep.include(['second', 'first']);
      expect(paths).to.deep.include(['second', 'second']);
    });
  });
});
