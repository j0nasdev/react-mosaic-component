import { expect } from 'chai';
import sinon from 'sinon';
import React from 'react';
import { render, cleanup, fireEvent } from '@testing-library/react';
import { MosaicWithoutDragDropContext } from '../src/Mosaic';
import { MosaicWindow } from '../src/MosaicWindow';
import { MosaicContext, MosaicRootActions } from '../src/contextTypes';
import { MosaicKey, MosaicNode } from '../src/types';
import { MosaicZeroState } from '../src/MosaicZeroState';
import { createRemoveUpdate } from '../src/util/mosaicUpdates';
import { getLeaves, isParent } from '../src/util/mosaicUtilities';

// ---- Helpers ----

function createMockMosaicActions(overrides: Partial<MosaicRootActions<string>> = {}): MosaicRootActions<string> {
  return {
    updateTree: sinon.stub(),
    remove: sinon.stub(),
    expand: sinon.stub(),
    hide: sinon.stub(),
    replaceWith: sinon.stub(),
    getRoot: sinon.stub().returns(null),
    ...overrides,
  };
}

function createMockMosaicContext(overrides: Partial<any> = {}) {
  return {
    mosaicActions: createMockMosaicActions(overrides.mosaicActions),
    mosaicId: overrides.mosaicId || 'test-mosaic',
    blueprintNamespace: overrides.blueprintNamespace || 'bp4',
  };
}

function renderWithMosaicContext(ui: React.ReactElement, ctx?: any) {
  const context = ctx || createMockMosaicContext();
  return render(
    React.createElement(MosaicContext.Provider, { value: context as any }, ui),
  );
}

afterEach(() => {
  cleanup();
  sinon.restore();
});

describe('Edge Cases & Error Handling Tests', () => {
  // ================================================================
  // Invalid / Unusual Props
  // ================================================================
  describe('Invalid Props', () => {
    it('should render with undefined initialValue as zero state', () => {
      const { container } = render(
        React.createElement(MosaicWithoutDragDropContext, {
          renderTile: (id: MosaicKey) => React.createElement('div', null, id),
          initialValue: null,
        }),
      );

      expect(container.querySelector('.mosaic-zero-state')).to.not.equal(null);
    });

    it('should render with a single string leaf', () => {
      const { container } = render(
        React.createElement(MosaicWithoutDragDropContext, {
          renderTile: (id: MosaicKey) => React.createElement('div', { className: 'tile' }, id),
          initialValue: 'single',
        }),
      );

      expect(container.querySelectorAll('.mosaic-tile').length).to.equal(1);
    });

    it('should render with empty string leaf', () => {
      const { container } = render(
        React.createElement(MosaicWithoutDragDropContext, {
          renderTile: (id: MosaicKey) => React.createElement('div', { className: 'tile' }, String(id)),
          initialValue: '' as any,
        }),
      );

      // Empty string is a valid leaf key, should render a tile
      expect(container.querySelectorAll('.mosaic-tile').length).to.equal(1);
    });

    it('should render with numeric key (0)', () => {
      const { container } = render(
        React.createElement(MosaicWithoutDragDropContext, {
          renderTile: (id: MosaicKey) => React.createElement('div', { className: `tile-${id}` }, String(id)),
          initialValue: 0 as any,
        }),
      );

      // 0 is a valid leaf key, should render a tile
      expect(container.querySelectorAll('.mosaic-tile').length).to.equal(1);
    });

    it('should render with numeric key (1)', () => {
      const { container } = render(
        React.createElement(MosaicWithoutDragDropContext, {
          renderTile: (id: MosaicKey) => React.createElement('div', { className: `tile-${id}` }, String(id)),
          initialValue: 1 as any,
        }),
      );

      expect(container.querySelectorAll('.mosaic-tile').length).to.equal(1);
    });

    it('should handle node with 100% splitPercentage', () => {
      const tree: MosaicNode<string> = {
        direction: 'row',
        first: 'left',
        second: 'right',
        splitPercentage: 100,
      };

      const { container } = render(
        React.createElement(MosaicWithoutDragDropContext, {
          renderTile: (id: MosaicKey) => React.createElement('div', null, id),
          initialValue: tree,
        }),
      );

      expect(container.querySelectorAll('.mosaic-tile').length).to.equal(2);
    });

    it('should handle node with 0% splitPercentage', () => {
      const tree: MosaicNode<string> = {
        direction: 'row',
        first: 'left',
        second: 'right',
        splitPercentage: 0,
      };

      const { container } = render(
        React.createElement(MosaicWithoutDragDropContext, {
          renderTile: (id: MosaicKey) => React.createElement('div', null, id),
          initialValue: tree,
        }),
      );

      expect(container.querySelectorAll('.mosaic-tile').length).to.equal(2);
    });

    it('should handle deeply nested trees without stack overflow', () => {
      // Create a very deep tree: a -> (b -> (c -> (d -> (e, f))))
      const deep: MosaicNode<string> = {
        direction: 'row',
        first: 'a',
        second: {
          direction: 'column',
          first: 'b',
          second: {
            direction: 'row',
            first: 'c',
            second: {
              direction: 'column',
              first: 'd',
              second: {
                direction: 'row',
                first: 'e',
                second: 'f',
              },
            },
          },
        },
      };

      const { container } = render(
        React.createElement(MosaicWithoutDragDropContext, {
          renderTile: (id: MosaicKey) => React.createElement('div', { className: `tile-${id}` }, id),
          initialValue: deep,
        }),
      );

      expect(container.querySelectorAll('.mosaic-tile').length).to.equal(6);
    });
  });

  // ================================================================
  // Duplicate IDs
  // ================================================================
  describe('Duplicate IDs', () => {
    it('should throw an error for duplicate leaf IDs', () => {
      const duplicateTree: MosaicNode<string> = {
        direction: 'row',
        first: 'same-id',
        second: 'same-id',
      };

      expect(() => {
        render(
          React.createElement(MosaicWithoutDragDropContext, {
            renderTile: (id: MosaicKey) => React.createElement('div', null, id),
            initialValue: duplicateTree,
          }),
        );
      }).to.throw(/Duplicate IDs/);
    });
  });

  // ================================================================
  // Controlled vs Uncontrolled
  // ================================================================
  describe('Controlled vs Uncontrolled State', () => {
    it('should not call onChange on initial render in controlled mode', () => {
      const onChange = sinon.spy();
      render(
        React.createElement(MosaicWithoutDragDropContext, {
          renderTile: (id: MosaicKey) => React.createElement('div', null, id),
          value: 'test',
          onChange,
        }),
      );

      expect(onChange.callCount).to.equal(0);
    });

    it('should not call onRelease on initial render', () => {
      const onRelease = sinon.spy();
      render(
        React.createElement(MosaicWithoutDragDropContext, {
          renderTile: (id: MosaicKey) => React.createElement('div', null, id),
          value: 'test',
          onChange: () => void 0,
          onRelease,
        }),
      );

      expect(onRelease.callCount).to.equal(0);
    });

    it('should reflect value changes in controlled mode', () => {
      const onChange = sinon.spy();

      const { container, rerender } = render(
        React.createElement(MosaicWithoutDragDropContext, {
          renderTile: (id: MosaicKey) => React.createElement('div', { className: `tile-${id}` }, id),
          value: 'window-a',
          onChange,
        }),
      );

      expect(container.querySelector('.tile-window-a')).to.not.equal(null);

      rerender(
        React.createElement(MosaicWithoutDragDropContext, {
          renderTile: (id: MosaicKey) => React.createElement('div', { className: `tile-${id}` }, id),
          value: 'window-b',
          onChange,
        }),
      );

      expect(container.querySelector('.tile-window-b')).to.not.equal(null);
      expect(container.querySelector('.tile-window-a')).to.equal(null);
    });

    it('should transition from tree to null in controlled mode', () => {
      const onChange = sinon.spy();
      const tree: MosaicNode<string> = {
        direction: 'row',
        first: 'a',
        second: 'b',
      };

      const { container, rerender } = render(
        React.createElement(MosaicWithoutDragDropContext, {
          renderTile: (id: MosaicKey) => React.createElement('div', null, id),
          value: tree,
          onChange,
        }),
      );

      expect(container.querySelectorAll('.mosaic-tile').length).to.equal(2);

      rerender(
        React.createElement(MosaicWithoutDragDropContext, {
          renderTile: (id: MosaicKey) => React.createElement('div', null, id),
          value: null,
          onChange,
        }),
      );

      expect(container.querySelector('.mosaic-zero-state')).to.not.equal(null);
    });

    it('should transition from null to tree in controlled mode', () => {
      const onChange = sinon.spy();
      const tree: MosaicNode<string> = {
        direction: 'row',
        first: 'x',
        second: 'y',
      };

      const { container, rerender } = render(
        React.createElement(MosaicWithoutDragDropContext, {
          renderTile: (id: MosaicKey) => React.createElement('div', { className: `tile-${id}` }, id),
          value: null,
          onChange,
        }),
      );

      expect(container.querySelector('.mosaic-zero-state')).to.not.equal(null);

      rerender(
        React.createElement(MosaicWithoutDragDropContext, {
          renderTile: (id: MosaicKey) => React.createElement('div', { className: `tile-${id}` }, id),
          value: tree,
          onChange,
        }),
      );

      expect(container.querySelector('.tile-x')).to.not.equal(null);
      expect(container.querySelector('.tile-y')).to.not.equal(null);
    });
  });

  // ================================================================
  // ZeroState Edge Cases
  // ================================================================
  describe('ZeroState Edge Cases', () => {
    it('should render default zero state when no zeroStateView is provided', () => {
      const { container } = render(
        React.createElement(MosaicWithoutDragDropContext, {
          renderTile: (id: MosaicKey) => React.createElement('div', null, id),
          initialValue: null,
        }),
      );

      expect(container.querySelector('.mosaic-zero-state')).to.not.equal(null);
      expect(container.querySelector('h4')!.textContent).to.equal('No Windows Present');
    });

    it('should render custom zero state view', () => {
      const customZero = React.createElement('div', { className: 'custom-empty' }, 'Nothing here');

      const { container } = render(
        React.createElement(MosaicWithoutDragDropContext, {
          renderTile: (id: MosaicKey) => React.createElement('div', null, id),
          initialValue: null,
          zeroStateView: customZero,
        }),
      );

      expect(container.querySelector('.custom-empty')).to.not.equal(null);
      expect(container.querySelector('.custom-empty')!.textContent).to.equal('Nothing here');
    });

    it('should show add button when createNode is provided in zero state', () => {
      const { container } = renderWithMosaicContext(
        React.createElement(MosaicZeroState, { createNode: () => 'new' }),
      );

      const button = container.querySelector('button');
      expect(button).to.not.equal(null);
      expect(button!.textContent).to.include('Add New Window');
    });

    it('should not show add button when createNode is not provided in zero state', () => {
      const { container } = renderWithMosaicContext(
        React.createElement(MosaicZeroState, {}),
      );

      expect(container.querySelector('button')).to.equal(null);
    });

    it('ZeroState add button should call replaceWith on mosaic actions', async () => {
      const replaceWithStub = sinon.stub();
      const ctx = createMockMosaicContext({ mosaicActions: { replaceWith: replaceWithStub } });

      const { container } = renderWithMosaicContext(
        React.createElement(MosaicZeroState, { createNode: () => 'new-window' }),
        ctx,
      );

      const button = container.querySelector('button')!;
      fireEvent.click(button);

      // Wait for the Promise.resolve chain
      await new Promise((resolve) => setTimeout(resolve, 10));
      expect(replaceWithStub.calledOnce).to.equal(true);
      expect(replaceWithStub.firstCall.args[0]).to.deep.equal([]);
      expect(replaceWithStub.firstCall.args[1]).to.equal('new-window');
    });

    it('ZeroState add button should handle async createNode', async () => {
      const replaceWithStub = sinon.stub();
      const ctx = createMockMosaicContext({ mosaicActions: { replaceWith: replaceWithStub } });

      const { container } = renderWithMosaicContext(
        React.createElement(MosaicZeroState, {
          createNode: () => Promise.resolve('async-window'),
        }),
        ctx,
      );

      fireEvent.click(container.querySelector('button')!);

      await new Promise((resolve) => setTimeout(resolve, 50));
      expect(replaceWithStub.calledOnce).to.equal(true);
      expect(replaceWithStub.firstCall.args[1]).to.equal('async-window');
    });

    it('ZeroState should swallow rejection from createNode', async () => {
      const ctx = createMockMosaicContext();

      const { container } = renderWithMosaicContext(
        React.createElement(MosaicZeroState, {
          createNode: () => Promise.reject(new Error('User cancelled')),
        }),
        ctx,
      );

      // Should not throw
      expect(() => fireEvent.click(container.querySelector('button')!)).to.not.throw();
      await new Promise((resolve) => setTimeout(resolve, 50));
    });
  });

  // ================================================================
  // Tree Utility Edge Cases
  // ================================================================
  describe('Tree Utility Edge Cases', () => {
    it('getLeaves should return empty array for null', () => {
      const leaves = getLeaves(null);
      expect(leaves).to.deep.equal([]);
    });

    it('getLeaves should return single leaf for string node', () => {
      const leaves = getLeaves('only');
      expect(leaves).to.deep.equal(['only']);
    });

    it('getLeaves should return all leaves for complex tree', () => {
      const tree: MosaicNode<string> = {
        direction: 'row',
        first: 'a',
        second: {
          direction: 'column',
          first: 'b',
          second: 'c',
        },
      };
      const leaves = getLeaves(tree);
      expect(leaves.sort()).to.deep.equal(['a', 'b', 'c']);
    });

    it('isParent should return true for parent nodes', () => {
      const parent: MosaicNode<string> = {
        direction: 'row',
        first: 'a',
        second: 'b',
      };
      expect(isParent(parent)).to.equal(true);
    });

    it('isParent should return false for leaf nodes', () => {
      expect(isParent('leaf')).to.equal(false);
    });

    it('isParent should return false for numeric leaf', () => {
      expect(isParent(42)).to.equal(false);
    });

    it('createRemoveUpdate should throw for non-existent path', () => {
      const tree: MosaicNode<string> = {
        direction: 'row',
        first: 'a',
        second: 'b',
      };
      // Path ['first', 'first'] tries to go into a leaf
      expect(() => createRemoveUpdate(tree, ['first', 'first'])).to.throw();
    });
  });

  // ================================================================
  // Unmounting / Cleanup
  // ================================================================
  describe('Component Cleanup', () => {
    it('should unmount without errors', () => {
      const tree: MosaicNode<string> = {
        direction: 'row',
        first: 'a',
        second: 'b',
      };

      const { unmount } = render(
        React.createElement(MosaicWithoutDragDropContext, {
          renderTile: (id: MosaicKey) => React.createElement('div', null, id),
          initialValue: tree,
        }),
      );

      expect(() => unmount()).to.not.throw();
    });

    it('should unmount zero state without errors', () => {
      const { unmount } = render(
        React.createElement(MosaicWithoutDragDropContext, {
          renderTile: (id: MosaicKey) => React.createElement('div', null, id),
          initialValue: null,
        }),
      );

      expect(() => unmount()).to.not.throw();
    });

    it('should unmount complex tree without errors', () => {
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

      const { unmount } = render(
        React.createElement(MosaicWithoutDragDropContext, {
          renderTile: (id: MosaicKey) =>
            React.createElement(MosaicWindow, { title: id as string, path: [] },
              React.createElement('div', null, id),
            ),
          initialValue: tree,
        }),
      );

      expect(() => unmount()).to.not.throw();
    });
  });

  // ================================================================
  // Re-renders with Same Value
  // ================================================================
  describe('Idempotent Re-renders', () => {
    it('should handle re-render with same value without issues', () => {
      const tree: MosaicNode<string> = {
        direction: 'row',
        first: 'a',
        second: 'b',
      };
      const onChange = sinon.spy();

      const { container, rerender } = render(
        React.createElement(MosaicWithoutDragDropContext, {
          renderTile: (id: MosaicKey) => React.createElement('div', { className: `tile-${id}` }, id),
          value: tree,
          onChange,
        }),
      );

      // Re-render with exact same tree reference
      rerender(
        React.createElement(MosaicWithoutDragDropContext, {
          renderTile: (id: MosaicKey) => React.createElement('div', { className: `tile-${id}` }, id),
          value: tree,
          onChange,
        }),
      );

      expect(container.querySelectorAll('.mosaic-tile').length).to.equal(2);
    });

    it('should handle rapid re-renders', () => {
      const onChange = sinon.spy();
      const trees: Array<MosaicNode<string>> = [
        'single',
        {
          direction: 'row',
          first: 'a',
          second: 'b',
        },
        {
          direction: 'column',
          first: 'x',
          second: 'y',
        },
        'another-single',
      ];

      const { container, rerender } = render(
        React.createElement(MosaicWithoutDragDropContext, {
          renderTile: (id: MosaicKey) => React.createElement('div', { className: `tile-${id}` }, id),
          value: trees[0],
          onChange,
        }),
      );

      for (let i = 1; i < trees.length; i++) {
        rerender(
          React.createElement(MosaicWithoutDragDropContext, {
            renderTile: (id: MosaicKey) => React.createElement('div', { className: `tile-${id}` }, id),
            value: trees[i],
            onChange,
          }),
        );
      }

      // Last tree is 'another-single'
      expect(container.querySelectorAll('.mosaic-tile').length).to.equal(1);
    });
  });
});
