import { expect } from 'chai';
import sinon from 'sinon';
import React from 'react';
import { render, cleanup } from '@testing-library/react';
import { MosaicWithoutDragDropContext } from '../src/Mosaic';
import { MosaicContext } from '../src/contextTypes';
import { MosaicKey, MosaicNode, MosaicPath } from '../src/types';
import { MosaicDropTarget } from '../src/MosaicDropTarget';
import { MosaicDropTargetPosition } from '../src/internalTypes';

// ---- Helper ----

function createMockMosaicContext() {
  return {
    mosaicActions: {
      updateTree: sinon.stub(),
      remove: sinon.stub(),
      expand: sinon.stub(),
      hide: sinon.stub(),
      replaceWith: sinon.stub(),
      getRoot: sinon.stub().returns(null),
    },
    mosaicId: 'test-mosaic',
    blueprintNamespace: 'bp4',
  };
}

function renderDropTarget(position: MosaicDropTargetPosition, path: MosaicPath = []) {
  const ctx = createMockMosaicContext();
  return render(
    React.createElement(
      MosaicContext.Provider,
      { value: ctx as any },
      React.createElement(MosaicDropTarget, { position, path }),
    ),
  );
}

afterEach(() => {
  cleanup();
  sinon.restore();
});

describe('MosaicDropTarget Tests', () => {
  describe('Rendering', () => {
    it('should render a drop target div', () => {
      const { container } = renderDropTarget(MosaicDropTargetPosition.TOP);
      expect(container.querySelector('.drop-target')).to.not.equal(null);
    });

    it('should render with TOP position class', () => {
      const { container } = renderDropTarget(MosaicDropTargetPosition.TOP);
      expect(container.querySelector('.drop-target.top')).to.not.equal(null);
    });

    it('should render with BOTTOM position class', () => {
      const { container } = renderDropTarget(MosaicDropTargetPosition.BOTTOM);
      expect(container.querySelector('.drop-target.bottom')).to.not.equal(null);
    });

    it('should render with LEFT position class', () => {
      const { container } = renderDropTarget(MosaicDropTargetPosition.LEFT);
      expect(container.querySelector('.drop-target.left')).to.not.equal(null);
    });

    it('should render with RIGHT position class', () => {
      const { container } = renderDropTarget(MosaicDropTargetPosition.RIGHT);
      expect(container.querySelector('.drop-target.right')).to.not.equal(null);
    });

    it('should render as a div element', () => {
      const { container } = renderDropTarget(MosaicDropTargetPosition.TOP);
      const target = container.querySelector('.drop-target')!;
      expect(target.tagName.toLowerCase()).to.equal('div');
    });

    it('should not have drop-target-hover by default', () => {
      const { container } = renderDropTarget(MosaicDropTargetPosition.TOP);
      expect(container.querySelector('.drop-target-hover')).to.equal(null);
    });
  });

  describe('Integration with MosaicWithoutDragDropContext', () => {
    it('should render drop targets within mosaic window tiles', () => {
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

      // Root drop targets should exist
      const dropTargets = container.querySelectorAll('.drop-target');
      expect(dropTargets.length).to.be.greaterThanOrEqual(4);
    });
  });
});

describe('RootDropTargets Tests', () => {
  describe('Rendering within Mosaic', () => {
    it('should render root drop target container', () => {
      const { container } = render(
        React.createElement(MosaicWithoutDragDropContext, {
          renderTile: (id: MosaicKey) => React.createElement('div', null, id),
          initialValue: 'test',
        }),
      );

      const dropContainers = container.querySelectorAll('.drop-target-container');
      expect(dropContainers.length).to.be.greaterThanOrEqual(1);
    });

    it('should render all 4 position drop targets in root', () => {
      const { container } = render(
        React.createElement(MosaicWithoutDragDropContext, {
          renderTile: (id: MosaicKey) => React.createElement('div', null, id),
          initialValue: 'test',
        }),
      );

      expect(container.querySelector('.drop-target.top')).to.not.equal(null);
      expect(container.querySelector('.drop-target.bottom')).to.not.equal(null);
      expect(container.querySelector('.drop-target.left')).to.not.equal(null);
      expect(container.querySelector('.drop-target.right')).to.not.equal(null);
    });

    it('should render root drop targets for split layout', () => {
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

      const dropContainers = container.querySelectorAll('.drop-target-container');
      expect(dropContainers.length).to.be.greaterThanOrEqual(1);
    });

    it('should not show dragging class when not dragging', () => {
      const { container } = render(
        React.createElement(MosaicWithoutDragDropContext, {
          renderTile: (id: MosaicKey) => React.createElement('div', null, id),
          initialValue: 'test',
        }),
      );

      // The root drop-target-container should not have -dragging class
      const rootContainer = container.querySelector('.mosaic > .drop-target-container');
      if (rootContainer) {
        expect(rootContainer.classList.contains('-dragging')).to.equal(false);
      }
    });
  });

  describe('With Null Value', () => {
    it('should still render root drop targets when value is null', () => {
      const { container } = render(
        React.createElement(MosaicWithoutDragDropContext, {
          renderTile: (id: MosaicKey) => React.createElement('div', null, id),
          initialValue: null,
        }),
      );

      const dropContainers = container.querySelectorAll('.drop-target-container');
      expect(dropContainers.length).to.be.greaterThanOrEqual(1);
    });
  });
});
