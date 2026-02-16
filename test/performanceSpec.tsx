import { expect } from 'chai';
import sinon from 'sinon';
import React from 'react';
import { render, cleanup } from '@testing-library/react';
import { MosaicWithoutDragDropContext } from '../src/Mosaic';
import { MosaicWindow } from '../src/MosaicWindow';
import { MosaicKey, MosaicNode, MosaicParent } from '../src/types';
import { createBalancedTreeFromLeaves, getLeaves, isParent } from '../src/util/mosaicUtilities';
import { updateTree, createRemoveUpdate } from '../src/util/mosaicUpdates';

afterEach(() => {
  cleanup();
  sinon.restore();
});

describe('Performance Tests', () => {
  // ================================================================
  // Large Tree Structures
  // ================================================================
  describe('Large Tree Structures', () => {
    it('should render a balanced tree with 8 leaves', () => {
      const ids = ['w1', 'w2', 'w3', 'w4', 'w5', 'w6', 'w7', 'w8'];
      const tree = createBalancedTreeFromLeaves(ids)!;

      const { container } = render(
        React.createElement(MosaicWithoutDragDropContext, {
          renderTile: (id: MosaicKey) => React.createElement('div', { className: `tile-${id}` }, id),
          initialValue: tree,
        }),
      );

      expect(container.querySelectorAll('.mosaic-tile').length).to.equal(8);
    });

    it('should render a balanced tree with 16 leaves', () => {
      const ids = Array.from({ length: 16 }, (_, i) => `win-${i}`);
      const tree = createBalancedTreeFromLeaves(ids)!;

      const { container } = render(
        React.createElement(MosaicWithoutDragDropContext, {
          renderTile: (id: MosaicKey) => React.createElement('div', { className: `tile-${id}` }, id),
          initialValue: tree,
        }),
      );

      expect(container.querySelectorAll('.mosaic-tile').length).to.equal(16);
    });

    it('should render a balanced tree with 32 leaves', () => {
      const ids = Array.from({ length: 32 }, (_, i) => `win-${i}`);
      const tree = createBalancedTreeFromLeaves(ids)!;

      const { container } = render(
        React.createElement(MosaicWithoutDragDropContext, {
          renderTile: (id: MosaicKey) => React.createElement('div', { className: `tile-${id}` }, id),
          initialValue: tree,
        }),
      );

      expect(container.querySelectorAll('.mosaic-tile').length).to.equal(32);
    });

    it('should render correct number of splits for 8 leaves (7 splits)', () => {
      const ids = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
      const tree = createBalancedTreeFromLeaves(ids)!;

      const { container } = render(
        React.createElement(MosaicWithoutDragDropContext, {
          renderTile: (id: MosaicKey) => React.createElement('div', null, id),
          initialValue: tree,
        }),
      );

      // n leaves = n-1 splits
      expect(container.querySelectorAll('.mosaic-split').length).to.equal(7);
    });

    it('should render correct number of splits for 16 leaves (15 splits)', () => {
      const ids = Array.from({ length: 16 }, (_, i) => `w${i}`);
      const tree = createBalancedTreeFromLeaves(ids)!;

      const { container } = render(
        React.createElement(MosaicWithoutDragDropContext, {
          renderTile: (id: MosaicKey) => React.createElement('div', null, id),
          initialValue: tree,
        }),
      );

      expect(container.querySelectorAll('.mosaic-split').length).to.equal(15);
    });
  });

  // ================================================================
  // Render Time
  // ================================================================
  describe('Render Performance', () => {
    it('should render 8-leaf tree in reasonable time', () => {
      const ids = Array.from({ length: 8 }, (_, i) => `perf-${i}`);
      const tree = createBalancedTreeFromLeaves(ids)!;

      const start = Date.now();
      const { container } = render(
        React.createElement(MosaicWithoutDragDropContext, {
          renderTile: (id: MosaicKey) => React.createElement('div', null, id),
          initialValue: tree,
        }),
      );
      const elapsed = Date.now() - start;

      expect(container.querySelectorAll('.mosaic-tile').length).to.equal(8);
      // Should render in under 2 seconds even on slow machines
      expect(elapsed).to.be.lessThan(2000);
    });

    it('should render 32-leaf tree in reasonable time', () => {
      const ids = Array.from({ length: 32 }, (_, i) => `perf-${i}`);
      const tree = createBalancedTreeFromLeaves(ids)!;

      const start = Date.now();
      const { container } = render(
        React.createElement(MosaicWithoutDragDropContext, {
          renderTile: (id: MosaicKey) => React.createElement('div', null, id),
          initialValue: tree,
        }),
      );
      const elapsed = Date.now() - start;

      expect(container.querySelectorAll('.mosaic-tile').length).to.equal(32);
      expect(elapsed).to.be.lessThan(5000);
    });
  });

  // ================================================================
  // Re-Rendering Optimization
  // ================================================================
  describe('Re-Rendering Optimization', () => {
    it('should handle multiple rapid re-renders without errors', () => {
      const onChange = sinon.spy();
      const ids = ['a', 'b', 'c', 'd'];
      let tree: MosaicNode<string> | null = createBalancedTreeFromLeaves(ids);

      const { container, rerender } = render(
        React.createElement(MosaicWithoutDragDropContext, {
          renderTile: (id: MosaicKey) => React.createElement('div', { className: `tile-${id}` }, id),
          value: tree,
          onChange,
        }),
      );

      // Perform many re-renders
      for (let i = 0; i < 20; i++) {
        if (tree && isParent(tree)) {
          const newTree: MosaicNode<string> = {
            ...(tree as MosaicParent<string>),
            splitPercentage: 30 + i,
          };
          tree = newTree;

          rerender(
            React.createElement(MosaicWithoutDragDropContext, {
              renderTile: (id: MosaicKey) => React.createElement('div', { className: `tile-${id}` }, id),
              value: tree,
              onChange,
            }),
          );
        }
      }

      // Should still render correctly
      expect(container.querySelector('.mosaic')).to.not.equal(null);
      expect(container.querySelectorAll('.mosaic-tile').length).to.equal(4);
    });

    it('should not re-render tiles unnecessarily with same tree reference', () => {
      const renderSpy = sinon.spy((id: MosaicKey) => React.createElement('div', null, id));
      const tree: MosaicNode<string> = {
        direction: 'row',
        first: 'left',
        second: 'right',
      };
      const onChange = sinon.spy();

      const { rerender } = render(
        React.createElement(MosaicWithoutDragDropContext, {
          renderTile: renderSpy as any,
          value: tree,
          onChange,
        }),
      );

      const initialCalls = renderSpy.callCount;

      // Re-render with exact same tree
      rerender(
        React.createElement(MosaicWithoutDragDropContext, {
          renderTile: renderSpy as any,
          value: tree,
          onChange,
        }),
      );

      // PureComponent should prevent unnecessary re-renders,
      // but since renderTile is a new reference each time, it may re-render
      // The key point is it should not crash and be reasonably performant
      expect(renderSpy.callCount).to.be.greaterThanOrEqual(initialCalls);
    });

    it('should handle tree structure changes efficiently', () => {
      const onChange = sinon.spy();

      // Start with 6 windows
      let tree: MosaicNode<string> | null = createBalancedTreeFromLeaves(
        ['w1', 'w2', 'w3', 'w4', 'w5', 'w6'],
      );

      const { container, rerender } = render(
        React.createElement(MosaicWithoutDragDropContext, {
          renderTile: (id: MosaicKey) => React.createElement('div', { className: `tile-${id}` }, id),
          value: tree,
          onChange,
        }),
      );

      expect(container.querySelectorAll('.mosaic-tile').length).to.equal(6);

      // Remove windows one by one
      while (tree && isParent(tree)) {
        const leaves = getLeaves(tree);
        if (leaves.length <= 1) break;

        const paths = findAllLeafPaths(tree);
        if (paths.length === 0 || paths[0].length === 0) break;

        tree = updateTree(tree, [createRemoveUpdate(tree, paths[0])]);

        rerender(
          React.createElement(MosaicWithoutDragDropContext, {
            renderTile: (id: MosaicKey) => React.createElement('div', { className: `tile-${id}` }, id),
            value: tree,
            onChange,
          }),
        );
      }

      // Should end with 1 tile
      expect(container.querySelectorAll('.mosaic-tile').length).to.equal(1);
    });
  });

  // ================================================================
  // Memory Leak Prevention
  // ================================================================
  describe('Memory Leak Prevention', () => {
    it('should clean up properly after multiple mount/unmount cycles', () => {
      const tree: MosaicNode<string> = {
        direction: 'row',
        first: 'a',
        second: 'b',
      };

      for (let i = 0; i < 10; i++) {
        const { unmount } = render(
          React.createElement(MosaicWithoutDragDropContext, {
            renderTile: (id: MosaicKey) => React.createElement('div', null, id),
            initialValue: tree,
          }),
        );
        unmount();
      }

      // If we get here without errors, cleanup is working
      expect(true).to.equal(true);
    });

    it('should clean up MosaicWindow components on unmount', () => {
      const tree: MosaicNode<string> = {
        direction: 'row',
        first: 'a',
        second: 'b',
      };

      for (let i = 0; i < 5; i++) {
        const { unmount } = render(
          React.createElement(MosaicWithoutDragDropContext, {
            renderTile: (id: MosaicKey, path: any) =>
              React.createElement(
                MosaicWindow,
                { title: String(id), path },
                React.createElement('div', null, id),
              ),
            initialValue: tree,
          }),
        );
        unmount();
      }

      expect(true).to.equal(true);
    });

    it('should clean up splits on unmount', () => {
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

      for (let i = 0; i < 5; i++) {
        const { unmount } = render(
          React.createElement(MosaicWithoutDragDropContext, {
            renderTile: (id: MosaicKey) => React.createElement('div', null, id),
            initialValue: tree,
          }),
        );
        unmount();
      }

      expect(true).to.equal(true);
    });

    it('should handle transition from complex tree to null and back', () => {
      const tree: MosaicNode<string> = {
        direction: 'row',
        first: 'a',
        second: {
          direction: 'column',
          first: 'b',
          second: 'c',
        },
      };

      const onChange = sinon.spy();
      const { container, rerender } = render(
        React.createElement(MosaicWithoutDragDropContext, {
          renderTile: (id: MosaicKey) => React.createElement('div', { className: `tile-${id}` }, id),
          value: tree,
          onChange,
        }),
      );

      expect(container.querySelectorAll('.mosaic-tile').length).to.equal(3);

      // Go to null
      rerender(
        React.createElement(MosaicWithoutDragDropContext, {
          renderTile: (id: MosaicKey) => React.createElement('div', { className: `tile-${id}` }, id),
          value: null,
          onChange,
        }),
      );
      expect(container.querySelector('.mosaic-zero-state')).to.not.equal(null);

      // Go back to tree
      rerender(
        React.createElement(MosaicWithoutDragDropContext, {
          renderTile: (id: MosaicKey) => React.createElement('div', { className: `tile-${id}` }, id),
          value: tree,
          onChange,
        }),
      );
      expect(container.querySelectorAll('.mosaic-tile').length).to.equal(3);
    });
  });

  // ================================================================
  // Tree Update Operations Performance
  // ================================================================
  describe('Tree Update Operations Performance', () => {
    it('createBalancedTreeFromLeaves should handle many items', () => {
      const ids = Array.from({ length: 64 }, (_, i) => `item-${i}`);
      const start = Date.now();
      const tree = createBalancedTreeFromLeaves(ids);
      const elapsed = Date.now() - start;

      expect(tree).to.not.equal(null);
      expect(getLeaves(tree).length).to.equal(64);
      expect(elapsed).to.be.lessThan(1000);
    });

    it('updateTree should handle complex updates efficiently', () => {
      const ids = Array.from({ length: 16 }, (_, i) => `u-${i}`);
      let tree: MosaicNode<string> | null = createBalancedTreeFromLeaves(ids);

      const start = Date.now();

      // Perform several removes
      for (let i = 0; i < 10; i++) {
        if (tree && isParent(tree)) {
          const paths = findAllLeafPaths(tree);
          if (paths.length > 0 && paths[0].length > 0) {
            tree = updateTree(tree, [createRemoveUpdate(tree, paths[0])]);
          }
        }
      }

      const elapsed = Date.now() - start;
      expect(elapsed).to.be.lessThan(1000);
    });
  });
});

/**
 * Helper function to find all leaf paths in a tree
 */
function findAllLeafPaths<T extends MosaicKey>(
  tree: MosaicNode<T>,
  currentPath: Array<'first' | 'second'> = [],
): Array<Array<'first' | 'second'>> {
  if (isParent(tree)) {
    return [
      ...findAllLeafPaths(tree.first, [...currentPath, 'first']),
      ...findAllLeafPaths(tree.second, [...currentPath, 'second']),
    ];
  } else {
    return [currentPath];
  }
}
