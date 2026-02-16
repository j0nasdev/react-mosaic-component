import { expect } from 'chai';
import sinon from 'sinon';
import React from 'react';
import { render, cleanup, fireEvent } from '@testing-library/react';
import { MosaicWithoutDragDropContext } from '../src/Mosaic';
import { MosaicKey, MosaicNode } from '../src/types';
import { Split } from '../src/Split';
import { BoundingBox } from '../src/util/BoundingBox';

afterEach(() => {
  cleanup();
  sinon.restore();
});

describe('Split Tests', () => {
  describe('Basic Rendering', () => {
    it('should render a split element', () => {
      const { container } = render(
        React.createElement(Split, {
          direction: 'row',
          boundingBox: BoundingBox.empty(),
          splitPercentage: 50,
        }),
      );
      expect(container.querySelector('.mosaic-split')).to.not.equal(null);
    });

    it('should render split line', () => {
      const { container } = render(
        React.createElement(Split, {
          direction: 'row',
          boundingBox: BoundingBox.empty(),
          splitPercentage: 50,
        }),
      );
      expect(container.querySelector('.mosaic-split-line')).to.not.equal(null);
    });

    it('should have -row class for row direction', () => {
      const { container } = render(
        React.createElement(Split, {
          direction: 'row',
          boundingBox: BoundingBox.empty(),
          splitPercentage: 50,
        }),
      );
      expect(container.querySelector('.mosaic-split.-row')).to.not.equal(null);
    });

    it('should have -column class for column direction', () => {
      const { container } = render(
        React.createElement(Split, {
          direction: 'column',
          boundingBox: BoundingBox.empty(),
          splitPercentage: 50,
        }),
      );
      expect(container.querySelector('.mosaic-split.-column')).to.not.equal(null);
    });

    it('should not have both direction classes', () => {
      const { container } = render(
        React.createElement(Split, {
          direction: 'row',
          boundingBox: BoundingBox.empty(),
          splitPercentage: 50,
        }),
      );
      const split = container.querySelector('.mosaic-split')!;
      expect(split.classList.contains('-row')).to.equal(true);
      expect(split.classList.contains('-column')).to.equal(false);
    });
  });

  describe('Style Computation', () => {
    it('should compute left style for row direction', () => {
      const { container } = render(
        React.createElement(Split, {
          direction: 'row',
          boundingBox: BoundingBox.empty(),
          splitPercentage: 50,
        }),
      );
      const split = container.querySelector('.mosaic-split') as HTMLElement;
      expect(split.style.left).to.equal('50%');
    });

    it('should compute top style for column direction', () => {
      const { container } = render(
        React.createElement(Split, {
          direction: 'column',
          boundingBox: BoundingBox.empty(),
          splitPercentage: 50,
        }),
      );
      const split = container.querySelector('.mosaic-split') as HTMLElement;
      expect(split.style.top).to.equal('50%');
    });

    it('should reflect different split percentages in position (row)', () => {
      const { container } = render(
        React.createElement(Split, {
          direction: 'row',
          boundingBox: BoundingBox.empty(),
          splitPercentage: 30,
        }),
      );
      const split = container.querySelector('.mosaic-split') as HTMLElement;
      expect(split.style.left).to.equal('30%');
    });

    it('should reflect different split percentages in position (column)', () => {
      const { container } = render(
        React.createElement(Split, {
          direction: 'column',
          boundingBox: BoundingBox.empty(),
          splitPercentage: 70,
        }),
      );
      const split = container.querySelector('.mosaic-split') as HTMLElement;
      expect(split.style.top).to.equal('70%');
    });
  });

  describe('Mouse Events', () => {
    it('should handle mouseDown without errors', () => {
      const { container } = render(
        React.createElement(Split, {
          direction: 'row',
          boundingBox: BoundingBox.empty(),
          splitPercentage: 50,
        }),
      );
      const split = container.querySelector('.mosaic-split')!;
      expect(() => fireEvent.mouseDown(split, { button: 0 })).to.not.throw();
    });

    it('should ignore non-left-button mouseDown', () => {
      const onChangeSpy = sinon.spy();
      const { container } = render(
        React.createElement(Split, {
          direction: 'row',
          boundingBox: BoundingBox.empty(),
          splitPercentage: 50,
          onChange: onChangeSpy,
        }),
      );
      const split = container.querySelector('.mosaic-split')!;

      // Right-click (button=2) should be ignored
      fireEvent.mouseDown(split, { button: 2 });
      // No change should happen
      expect(onChangeSpy.called).to.equal(false);
    });
  });

  describe('Integration with MosaicRoot', () => {
    it('should render splits in a mosaic layout', () => {
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

      expect(container.querySelectorAll('.mosaic-split').length).to.equal(1);
    });

    it('should render multiple splits for complex layouts', () => {
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
          renderTile: (id: MosaicKey) => React.createElement('div', null, id),
          initialValue: tree,
        }),
      );

      expect(container.querySelectorAll('.mosaic-split').length).to.equal(3);
    });

    it('should not render splits when resize is DISABLED in Mosaic', () => {
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

      expect(container.querySelectorAll('.mosaic-split').length).to.equal(0);
    });
  });

  describe('Cleanup', () => {
    it('should clean up event listeners on unmount', () => {
      const { container, unmount } = render(
        React.createElement(Split, {
          direction: 'row',
          boundingBox: BoundingBox.empty(),
          splitPercentage: 50,
        }),
      );

      const split = container.querySelector('.mosaic-split')!;
      fireEvent.mouseDown(split, { button: 0 });

      // Should not throw on unmount
      expect(() => unmount()).to.not.throw();
    });

    it('should clean up without errors even without mouse interaction', () => {
      const { unmount } = render(
        React.createElement(Split, {
          direction: 'row',
          boundingBox: BoundingBox.empty(),
          splitPercentage: 50,
        }),
      );

      expect(() => unmount()).to.not.throw();
    });
  });
});
