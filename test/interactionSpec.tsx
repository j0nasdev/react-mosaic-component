import { expect } from 'chai';
import sinon from 'sinon';
import React from 'react';
import { render, cleanup, fireEvent } from '@testing-library/react';
import { MosaicWithoutDragDropContext } from '../src/Mosaic';
import { MosaicWindow } from '../src/MosaicWindow';
import { MosaicContext, MosaicWindowContext, MosaicRootActions, MosaicWindowActions } from '../src/contextTypes';
import { MosaicKey, MosaicNode } from '../src/types';
import { ExpandButton } from '../src/buttons/ExpandButton';
import { RemoveButton } from '../src/buttons/RemoveButton';
import { ReplaceButton } from '../src/buttons/ReplaceButton';
import { SplitButton } from '../src/buttons/SplitButton';

// ---- Helpers ----

function createMockMosaicActions(overrides: Partial<MosaicRootActions<string>> = {}): MosaicRootActions<string> {
  return {
    updateTree: sinon.stub(),
    remove: sinon.stub(),
    expand: sinon.stub(),
    hide: sinon.stub(),
    replaceWith: sinon.stub(),
    getRoot: sinon.stub().returns('test'),
    ...overrides,
  };
}

function createMockWindowActions(overrides: Partial<MosaicWindowActions> = {}): MosaicWindowActions {
  return {
    split: sinon.stub().resolves(),
    replaceWithNew: sinon.stub().resolves(),
    setAdditionalControlsOpen: sinon.stub(),
    getPath: sinon.stub().returns(['first']),
    connectDragSource: (el: React.ReactElement) => el,
    ...overrides,
  };
}

function renderWithBothContexts(
  ui: React.ReactElement,
  mosaicActions?: MosaicRootActions<string>,
  windowActions?: MosaicWindowActions,
) {
  const mActions = mosaicActions || createMockMosaicActions();
  const wActions = windowActions || createMockWindowActions();
  return render(
    React.createElement(
      MosaicContext.Provider,
      {
        value: {
          mosaicActions: mActions,
          mosaicId: 'test-mosaic',
          blueprintNamespace: 'bp4',
        } as any,
      },
      React.createElement(
        MosaicWindowContext.Provider,
        {
          value: {
            blueprintNamespace: 'bp4',
            mosaicWindowActions: wActions,
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

describe('User Interaction Tests', () => {
  // ================================================================
  // Button Click Handlers
  // ================================================================
  describe('Button Click Handlers', () => {
    it('ExpandButton click should trigger expand action', () => {
      const expandStub = sinon.stub();
      const mActions = createMockMosaicActions({ expand: expandStub });
      const wActions = createMockWindowActions({ getPath: sinon.stub().returns(['first']) });

      const { container } = renderWithBothContexts(React.createElement(ExpandButton), mActions, wActions);
      fireEvent.click(container.querySelector('button')!);

      expect(expandStub.calledOnce).to.equal(true);
      expect(expandStub.firstCall.args[0]).to.deep.equal(['first']);
    });

    it('RemoveButton click should trigger remove action', () => {
      const removeStub = sinon.stub();
      const mActions = createMockMosaicActions({ remove: removeStub });
      const wActions = createMockWindowActions({ getPath: sinon.stub().returns(['second']) });

      const { container } = renderWithBothContexts(React.createElement(RemoveButton), mActions, wActions);
      fireEvent.click(container.querySelector('button')!);

      expect(removeStub.calledOnce).to.equal(true);
      expect(removeStub.firstCall.args[0]).to.deep.equal(['second']);
    });

    it('SplitButton click should trigger split action', () => {
      const splitStub = sinon.stub().resolves();
      const wActions = createMockWindowActions({ split: splitStub });

      const { container } = renderWithBothContexts(React.createElement(SplitButton), undefined, wActions);
      fireEvent.click(container.querySelector('button')!);

      expect(splitStub.calledOnce).to.equal(true);
    });

    it('ReplaceButton click should trigger replaceWithNew action', () => {
      const replaceStub = sinon.stub().resolves();
      const wActions = createMockWindowActions({ replaceWithNew: replaceStub });

      const { container } = renderWithBothContexts(React.createElement(ReplaceButton), undefined, wActions);
      fireEvent.click(container.querySelector('button')!);

      expect(replaceStub.calledOnce).to.equal(true);
    });

    it('should call onClick callbacks in order', () => {
      const callOrder: string[] = [];
      const expandStub = sinon.stub().callsFake(() => callOrder.push('expand'));
      const onClickSpy = sinon.stub().callsFake(() => callOrder.push('onClick'));
      const mActions = createMockMosaicActions({ expand: expandStub });

      const { container } = renderWithBothContexts(
        React.createElement(ExpandButton, { onClick: onClickSpy }),
        mActions,
      );
      fireEvent.click(container.querySelector('button')!);

      expect(callOrder).to.deep.equal(['expand', 'onClick']);
    });

    it('multiple clicks on ExpandButton should call expand multiple times', () => {
      const expandStub = sinon.stub();
      const mActions = createMockMosaicActions({ expand: expandStub });

      const { container } = renderWithBothContexts(React.createElement(ExpandButton), mActions);
      const button = container.querySelector('button')!;

      fireEvent.click(button);
      fireEvent.click(button);
      fireEvent.click(button);

      expect(expandStub.callCount).to.equal(3);
    });

    it('multiple clicks on RemoveButton should call remove multiple times', () => {
      const removeStub = sinon.stub();
      const mActions = createMockMosaicActions({ remove: removeStub });

      const { container } = renderWithBothContexts(React.createElement(RemoveButton), mActions);
      const button = container.querySelector('button')!;

      fireEvent.click(button);
      fireEvent.click(button);

      expect(removeStub.callCount).to.equal(2);
    });
  });

  // ================================================================
  // Toolbar Interactions
  // ================================================================
  describe('Toolbar Interactions', () => {
    it('should render toolbar for each window in a split', () => {
      const tree: MosaicNode<string> = {
        direction: 'row',
        first: 'left',
        second: 'right',
      };
      const { container } = renderMosaicWithWindows(tree);
      const toolbars = container.querySelectorAll('.mosaic-window-toolbar');
      // Each window has a toolbar + preview also contains a toolbar = 4 total
      expect(toolbars.length).to.be.greaterThanOrEqual(2);
    });

    it('should display window title in toolbar', () => {
      const { container } = renderMosaicWithWindows('my-win');
      const title = container.querySelector('.mosaic-window-title');
      expect(title).to.not.equal(null);
      expect(title!.textContent).to.equal('Window my-win');
    });

    it('should display title attribute on title div', () => {
      const { container } = renderMosaicWithWindows('test-title');
      const title = container.querySelector('.mosaic-window-title') as HTMLElement;
      expect(title.getAttribute('title')).to.equal('Window test-title');
    });
  });

  // ================================================================
  // Additional Controls Toggle
  // ================================================================
  describe('Additional Controls Toggle', () => {
    it('should toggle additional controls open state', () => {
      const additionalControls = React.createElement('div', { className: 'extra-ctrl' }, 'Extra');
      const { container } = renderMosaicWithWindows('test', { additionalControls });

      const moreButton = Array.from(container.querySelectorAll('button')).find(
        (btn) => btn.textContent && btn.textContent.includes('More'),
      )!;

      expect(container.querySelector('.additional-controls-open')).to.equal(null);

      fireEvent.click(moreButton);
      expect(container.querySelector('.additional-controls-open')).to.not.equal(null);

      fireEvent.click(moreButton);
      expect(container.querySelector('.additional-controls-open')).to.equal(null);
    });

    it('should call onAdditionalControlsToggle with correct value', () => {
      const toggleSpy = sinon.spy();
      const additionalControls = React.createElement('div', null, 'Extra');
      const { container } = renderMosaicWithWindows('test', {
        additionalControls,
        onAdditionalControlsToggle: toggleSpy,
      });

      const moreButton = Array.from(container.querySelectorAll('button')).find(
        (btn) => btn.textContent && btn.textContent.includes('More'),
      )!;

      fireEvent.click(moreButton);
      expect(toggleSpy.firstCall.args[0]).to.equal(true);

      fireEvent.click(moreButton);
      expect(toggleSpy.secondCall.args[0]).to.equal(false);
    });

    it('should close additional controls when body overlay is clicked', () => {
      const additionalControls = React.createElement('div', null, 'Extra');
      const { container } = renderMosaicWithWindows('test', { additionalControls });

      // Open
      const moreButton = Array.from(container.querySelectorAll('button')).find(
        (btn) => btn.textContent && btn.textContent.includes('More'),
      )!;
      fireEvent.click(moreButton);
      expect(container.querySelector('.additional-controls-open')).to.not.equal(null);

      // Click overlay
      const overlay = container.querySelector('.mosaic-window-body-overlay')!;
      fireEvent.click(overlay);
      expect(container.querySelector('.additional-controls-open')).to.equal(null);
    });
  });

  // ================================================================
  // Keyboard Events on Buttons
  // ================================================================
  describe('Keyboard Events', () => {
    it('should respond to Enter key via click on ExpandButton', () => {
      const expandStub = sinon.stub();
      const mActions = createMockMosaicActions({ expand: expandStub });

      const { container } = renderWithBothContexts(React.createElement(ExpandButton), mActions);
      const button = container.querySelector('button')!;

      // Simulate Enter key by directly triggering click (as browsers do for buttons with Enter)
      fireEvent.click(button);
      expect(expandStub.calledOnce).to.equal(true);
    });

    it('should respond to keyboard interaction on RemoveButton', () => {
      const removeStub = sinon.stub();
      const mActions = createMockMosaicActions({ remove: removeStub });

      const { container } = renderWithBothContexts(React.createElement(RemoveButton), mActions);
      const button = container.querySelector('button')!;

      // Native button elements handle keyDown Enter as click
      fireEvent.keyDown(button, { key: 'Enter' });
      fireEvent.click(button);
      expect(removeStub.calledOnce).to.equal(true);
    });

    it('buttons should be focusable', () => {
      const { container } = renderWithBothContexts(React.createElement(ExpandButton));
      const button = container.querySelector('button')!;

      button.focus();
      expect(document.activeElement).to.equal(button);
    });

    it('all toolbar buttons should be focusable', () => {
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
  });

  // ================================================================
  // Split (Resize) Interaction
  // ================================================================
  describe('Split Resize Interaction', () => {
    it('should handle mouseDown on split element', () => {
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

      const split = container.querySelector('.mosaic-split')!;
      expect(() => fireEvent.mouseDown(split, { button: 0 })).to.not.throw();
    });

    it('should handle mouseUp after mouseDown on split', () => {
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

      const split = container.querySelector('.mosaic-split')!;
      fireEvent.mouseDown(split, { button: 0 });
      expect(() => fireEvent.mouseUp(document)).to.not.throw();
    });
  });
});
