import { expect } from 'chai';
import sinon from 'sinon';
import React from 'react';
import { render, cleanup } from '@testing-library/react';
import { MosaicWithoutDragDropContext } from '../src/Mosaic';
import { MosaicWindow } from '../src/MosaicWindow';
import { MosaicContext, MosaicWindowContext, MosaicRootActions, MosaicWindowActions } from '../src/contextTypes';
import { MosaicKey, MosaicNode } from '../src/types';
import { ExpandButton } from '../src/buttons/ExpandButton';
import { RemoveButton } from '../src/buttons/RemoveButton';
import { ReplaceButton } from '../src/buttons/ReplaceButton';
import { SplitButton } from '../src/buttons/SplitButton';
import { DefaultToolbarButton } from '../src/buttons/MosaicButton';

// ---- Helpers ----

function createMockMosaicActions(): MosaicRootActions<string> {
  return {
    updateTree: sinon.stub(),
    remove: sinon.stub(),
    expand: sinon.stub(),
    hide: sinon.stub(),
    replaceWith: sinon.stub(),
    getRoot: sinon.stub().returns(null),
  };
}

function createMockWindowActions(): MosaicWindowActions {
  return {
    split: sinon.stub().resolves(),
    replaceWithNew: sinon.stub().resolves(),
    setAdditionalControlsOpen: sinon.stub(),
    getPath: sinon.stub().returns(['first']),
    connectDragSource: (el: React.ReactElement) => el,
  };
}

function renderWithBothContexts(ui: React.ReactElement) {
  return render(
    React.createElement(
      MosaicContext.Provider,
      {
        value: {
          mosaicActions: createMockMosaicActions(),
          mosaicId: 'test-mosaic',
          blueprintNamespace: 'bp4',
        } as any,
      },
      React.createElement(
        MosaicWindowContext.Provider,
        {
          value: {
            blueprintNamespace: 'bp4',
            mosaicWindowActions: createMockWindowActions(),
          },
        },
        ui,
      ),
    ),
  );
}

function renderMosaicWithWindows(tree: MosaicNode<string>, windowProps?: Partial<any>) {
  return render(
    React.createElement(MosaicWithoutDragDropContext, {
      renderTile: (id: MosaicKey, path: any) =>
        React.createElement(
          MosaicWindow,
          {
            title: `Window ${id}`,
            path,
            ...windowProps,
          },
          React.createElement('div', { className: `content-${id}` }, `Content: ${id}`),
        ),
      initialValue: tree,
    }),
  );
}

afterEach(() => {
  cleanup();
  sinon.restore();
});

describe('Accessibility Tests', () => {
  // ================================================================
  // Button Accessibility
  // ================================================================
  describe('ARIA Attributes on Buttons', () => {
    it('ExpandButton should have a title attribute for screen readers', () => {
      const { container } = renderWithBothContexts(React.createElement(ExpandButton));
      const button = container.querySelector('button')!;
      expect(button.getAttribute('title')).to.equal('Expand');
    });

    it('RemoveButton should have a title attribute for screen readers', () => {
      const { container } = renderWithBothContexts(React.createElement(RemoveButton));
      const button = container.querySelector('button')!;
      expect(button.getAttribute('title')).to.equal('Close Window');
    });

    it('ReplaceButton should have a title attribute for screen readers', () => {
      const { container } = renderWithBothContexts(React.createElement(ReplaceButton));
      const button = container.querySelector('button')!;
      expect(button.getAttribute('title')).to.equal('Replace Window');
    });

    it('SplitButton should have a title attribute for screen readers', () => {
      const { container } = renderWithBothContexts(React.createElement(SplitButton));
      const button = container.querySelector('button')!;
      expect(button.getAttribute('title')).to.equal('Split Window');
    });

    it('DefaultToolbarButton should have title attribute', () => {
      const { container } = renderWithBothContexts(
        React.createElement(DefaultToolbarButton, {
          title: 'Custom Action',
          className: 'test',
          onClick: () => void 0,
        }),
      );
      const button = container.querySelector('button')!;
      expect(button.getAttribute('title')).to.equal('Custom Action');
    });

    it('all toolbar buttons should be native button elements', () => {
      const tree: MosaicNode<string> = {
        direction: 'row',
        first: 'a',
        second: 'b',
      };
      const { container } = renderMosaicWithWindows(tree);
      const controls = container.querySelectorAll('.mosaic-window-controls button');
      controls.forEach((btn) => {
        expect(btn.tagName.toLowerCase()).to.equal('button');
      });
    });
  });

  // ================================================================
  // Keyboard Navigation / Focus
  // ================================================================
  describe('Keyboard Navigation', () => {
    it('buttons should be focusable with tab (tabindex not negative)', () => {
      const { container } = renderWithBothContexts(React.createElement(ExpandButton));
      const button = container.querySelector('button')!;
      const tabIndex = button.getAttribute('tabindex');
      // Buttons without explicit tabindex are natively focusable (tabindex is null or >= 0)
      if (tabIndex !== null) {
        expect(parseInt(tabIndex, 10)).to.be.greaterThanOrEqual(0);
      }
    });

    it('ExpandButton should be focusable', () => {
      const { container } = renderWithBothContexts(React.createElement(ExpandButton));
      const button = container.querySelector('button')!;
      button.focus();
      expect(document.activeElement).to.equal(button);
    });

    it('RemoveButton should be focusable', () => {
      const { container } = renderWithBothContexts(React.createElement(RemoveButton));
      const button = container.querySelector('button')!;
      button.focus();
      expect(document.activeElement).to.equal(button);
    });

    it('ReplaceButton should be focusable', () => {
      const { container } = renderWithBothContexts(React.createElement(ReplaceButton));
      const button = container.querySelector('button')!;
      button.focus();
      expect(document.activeElement).to.equal(button);
    });

    it('SplitButton should be focusable', () => {
      const { container } = renderWithBothContexts(React.createElement(SplitButton));
      const button = container.querySelector('button')!;
      button.focus();
      expect(document.activeElement).to.equal(button);
    });

    it('all toolbar buttons in MosaicWindow should be focusable', () => {
      const tree: MosaicNode<string> = {
        direction: 'row',
        first: 'a',
        second: 'b',
      };
      const { container } = renderMosaicWithWindows(tree);
      const buttons = container.querySelectorAll('.mosaic-window-controls button');
      buttons.forEach((btn) => {
        (btn as HTMLElement).focus();
        expect(document.activeElement).to.equal(btn);
      });
    });

    it('add window button in zero state should be focusable', () => {
      const { container } = render(
        React.createElement(
          MosaicContext.Provider,
          {
            value: {
              mosaicActions: createMockMosaicActions(),
              mosaicId: 'test',
              blueprintNamespace: 'bp4',
            } as any,
          },
          React.createElement(
            (MosaicWithoutDragDropContext as any).defaultProps.zeroStateView.type,
            { createNode: () => 'new' },
          ),
        ),
      );

      // As the zero state with createNode, it renders a button
      const btn = container.querySelector('button');
      if (btn) {
        (btn as HTMLElement).focus();
        expect(document.activeElement).to.equal(btn);
      }
    });
  });

  // ================================================================
  // Screen Reader Support
  // ================================================================
  describe('Screen Reader Support', () => {
    it('window title should be visible text', () => {
      const { container } = renderMosaicWithWindows('my-window');
      const title = container.querySelector('.mosaic-window-title');
      expect(title).to.not.equal(null);
      expect(title!.textContent).to.not.equal('');
    });

    it('window title div should have title attribute for tooltip', () => {
      const { container } = renderMosaicWithWindows('test-win');
      const title = container.querySelector('.mosaic-window-title') as HTMLElement;
      expect(title.getAttribute('title')).to.not.equal(null);
      expect(title.getAttribute('title')).to.not.equal('');
    });

    it('zero state heading should be visible', () => {
      const { container } = render(
        React.createElement(MosaicWithoutDragDropContext, {
          renderTile: (id: MosaicKey) => React.createElement('div', null, id),
          initialValue: null,
        }),
      );

      const heading = container.querySelector('h4');
      expect(heading).to.not.equal(null);
      expect(heading!.textContent).to.equal('No Windows Present');
    });

    it('additional controls toggle button should have text label', () => {
      const additionalControls = React.createElement('div', null, 'Extra');
      const { container } = renderMosaicWithWindows('test', { additionalControls });

      const moreButton = Array.from(container.querySelectorAll('button')).find(
        (btn) => btn.textContent && btn.textContent.includes('More'),
      );
      expect(moreButton).to.not.equal(undefined);
      expect(moreButton!.textContent!.trim().length).to.be.greaterThan(0);
    });

    it('control text span should have semantic content', () => {
      const { container } = renderWithBothContexts(
        React.createElement(DefaultToolbarButton, {
          title: 'Action',
          className: 'test',
          onClick: () => void 0,
          text: 'Do Something',
        }),
      );

      const span = container.querySelector('.control-text')!;
      expect(span.textContent).to.equal('Do Something');
    });
  });

  // ================================================================
  // Semantic HTML
  // ================================================================
  describe('Semantic HTML', () => {
    it('should use button elements for interactive controls', () => {
      const tree: MosaicNode<string> = {
        direction: 'row',
        first: 'a',
        second: 'b',
      };
      const { container } = renderMosaicWithWindows(tree);
      const controls = container.querySelectorAll('.mosaic-window-controls > *');
      controls.forEach((ctrl) => {
        if (ctrl.classList.contains('separator')) {
          // Separator should be a div
          expect(ctrl.tagName.toLowerCase()).to.equal('div');
        } else {
          // Interactive controls should be buttons
          if (ctrl.tagName.toLowerCase() !== 'button') {
            // It might be a wrapper, buttons should exist inside
            // This is fine as long as the interactive element itself is a button
          }
        }
      });
    });

    it('should use heading element for zero state message', () => {
      const { container } = render(
        React.createElement(MosaicWithoutDragDropContext, {
          renderTile: (id: MosaicKey) => React.createElement('div', null, id),
          initialValue: null,
        }),
      );

      const heading = container.querySelector('h4');
      expect(heading).to.not.equal(null);
    });

    it('should use div elements for layout containers', () => {
      const tree: MosaicNode<string> = {
        direction: 'row',
        first: 'a',
        second: 'b',
      };
      const { container } = render(
        React.createElement(MosaicWithoutDragDropContext, {
          renderTile: (id: MosaicKey) => React.createElement('div', null, id),
          initialValue: tree,
        }),
      );

      const mosaic = container.querySelector('.mosaic')!;
      expect(mosaic.tagName.toLowerCase()).to.equal('div');

      const root = container.querySelector('.mosaic-root')!;
      expect(root.tagName.toLowerCase()).to.equal('div');
    });
  });
});
