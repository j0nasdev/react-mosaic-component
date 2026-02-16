import { expect } from 'chai';
import sinon from 'sinon';
import React from 'react';
import { render, cleanup, fireEvent } from '@testing-library/react';
import { MosaicContext, MosaicWindowContext, MosaicRootActions, MosaicWindowActions } from '../src/contextTypes';
import { ExpandButton } from '../src/buttons/ExpandButton';
import { RemoveButton } from '../src/buttons/RemoveButton';
import { ReplaceButton } from '../src/buttons/ReplaceButton';
import { SplitButton } from '../src/buttons/SplitButton';
import { Separator } from '../src/buttons/Separator';
import { DefaultToolbarButton } from '../src/buttons/MosaicButton';
import { DEFAULT_CONTROLS_WITH_CREATION, DEFAULT_CONTROLS_WITHOUT_CREATION } from '../src/buttons/defaultToolbarControls';

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

afterEach(() => {
  cleanup();
  sinon.restore();
});

describe('Button Component Tests', () => {
  // ================================================================
  // ExpandButton
  // ================================================================
  describe('ExpandButton', () => {
    it('should render a button element', () => {
      const { container } = renderWithBothContexts(React.createElement(ExpandButton));
      const button = container.querySelector('button');
      expect(button).to.not.equal(null);
    });

    it('should have title "Expand"', () => {
      const { container } = renderWithBothContexts(React.createElement(ExpandButton));
      const button = container.querySelector('button')!;
      expect(button.getAttribute('title')).to.equal('Expand');
    });

    it('should have expand-button CSS class', () => {
      const { container } = renderWithBothContexts(React.createElement(ExpandButton));
      const button = container.querySelector('button')!;
      expect(button.classList.contains('expand-button')).to.equal(true);
    });

    it('should have mosaic-default-control CSS class', () => {
      const { container } = renderWithBothContexts(React.createElement(ExpandButton));
      const button = container.querySelector('button')!;
      expect(button.classList.contains('mosaic-default-control')).to.equal(true);
    });

    it('should call mosaicActions.expand on click', () => {
      const expandStub = sinon.stub();
      const mActions = createMockMosaicActions({ expand: expandStub });
      const wActions = createMockWindowActions({ getPath: sinon.stub().returns(['second']) });

      const { container } = renderWithBothContexts(React.createElement(ExpandButton), mActions, wActions);
      const button = container.querySelector('button')!;
      fireEvent.click(button);

      expect(expandStub.calledOnce).to.equal(true);
      expect(expandStub.firstCall.args[0]).to.deep.equal(['second']);
    });

    it('should call onClick prop after expanding', () => {
      const onClickSpy = sinon.spy();
      const expandStub = sinon.stub();
      const mActions = createMockMosaicActions({ expand: expandStub });

      const { container } = renderWithBothContexts(
        React.createElement(ExpandButton, { onClick: onClickSpy }),
        mActions,
      );
      const button = container.querySelector('button')!;
      fireEvent.click(button);

      expect(onClickSpy.calledOnce).to.equal(true);
    });

    it('should not throw when onClick is not provided', () => {
      const expandStub = sinon.stub();
      const mActions = createMockMosaicActions({ expand: expandStub });

      const { container } = renderWithBothContexts(React.createElement(ExpandButton), mActions);
      const button = container.querySelector('button')!;

      expect(() => fireEvent.click(button)).to.not.throw();
    });

    it('should use the path from window context', () => {
      const expandStub = sinon.stub();
      const mActions = createMockMosaicActions({ expand: expandStub });
      const wActions = createMockWindowActions({ getPath: sinon.stub().returns(['first', 'second']) });

      const { container } = renderWithBothContexts(React.createElement(ExpandButton), mActions, wActions);
      fireEvent.click(container.querySelector('button')!);

      expect(expandStub.firstCall.args[0]).to.deep.equal(['first', 'second']);
    });
  });

  // ================================================================
  // RemoveButton
  // ================================================================
  describe('RemoveButton', () => {
    it('should render a button element', () => {
      const { container } = renderWithBothContexts(React.createElement(RemoveButton));
      const button = container.querySelector('button');
      expect(button).to.not.equal(null);
    });

    it('should have title "Close Window"', () => {
      const { container } = renderWithBothContexts(React.createElement(RemoveButton));
      const button = container.querySelector('button')!;
      expect(button.getAttribute('title')).to.equal('Close Window');
    });

    it('should have close-button CSS class', () => {
      const { container } = renderWithBothContexts(React.createElement(RemoveButton));
      const button = container.querySelector('button')!;
      expect(button.classList.contains('close-button')).to.equal(true);
    });

    it('should have mosaic-default-control CSS class', () => {
      const { container } = renderWithBothContexts(React.createElement(RemoveButton));
      const button = container.querySelector('button')!;
      expect(button.classList.contains('mosaic-default-control')).to.equal(true);
    });

    it('should call mosaicActions.remove on click', () => {
      const removeStub = sinon.stub();
      const mActions = createMockMosaicActions({ remove: removeStub });
      const wActions = createMockWindowActions({ getPath: sinon.stub().returns(['first']) });

      const { container } = renderWithBothContexts(React.createElement(RemoveButton), mActions, wActions);
      fireEvent.click(container.querySelector('button')!);

      expect(removeStub.calledOnce).to.equal(true);
      expect(removeStub.firstCall.args[0]).to.deep.equal(['first']);
    });

    it('should call onClick prop after removing', () => {
      const onClickSpy = sinon.spy();
      const removeStub = sinon.stub();
      const mActions = createMockMosaicActions({ remove: removeStub });

      const { container } = renderWithBothContexts(
        React.createElement(RemoveButton, { onClick: onClickSpy }),
        mActions,
      );
      fireEvent.click(container.querySelector('button')!);

      expect(onClickSpy.calledOnce).to.equal(true);
    });

    it('should not throw when onClick is not provided', () => {
      const removeStub = sinon.stub();
      const mActions = createMockMosaicActions({ remove: removeStub });

      const { container } = renderWithBothContexts(React.createElement(RemoveButton), mActions);

      expect(() => fireEvent.click(container.querySelector('button')!)).to.not.throw();
    });

    it('should use the path from window context', () => {
      const removeStub = sinon.stub();
      const mActions = createMockMosaicActions({ remove: removeStub });
      const wActions = createMockWindowActions({ getPath: sinon.stub().returns(['second', 'first']) });

      const { container } = renderWithBothContexts(React.createElement(RemoveButton), mActions, wActions);
      fireEvent.click(container.querySelector('button')!);

      expect(removeStub.firstCall.args[0]).to.deep.equal(['second', 'first']);
    });
  });

  // ================================================================
  // ReplaceButton
  // ================================================================
  describe('ReplaceButton', () => {
    it('should render a button element', () => {
      const { container } = renderWithBothContexts(React.createElement(ReplaceButton));
      const button = container.querySelector('button');
      expect(button).to.not.equal(null);
    });

    it('should have title "Replace Window"', () => {
      const { container } = renderWithBothContexts(React.createElement(ReplaceButton));
      const button = container.querySelector('button')!;
      expect(button.getAttribute('title')).to.equal('Replace Window');
    });

    it('should have replace-button CSS class', () => {
      const { container } = renderWithBothContexts(React.createElement(ReplaceButton));
      const button = container.querySelector('button')!;
      expect(button.classList.contains('replace-button')).to.equal(true);
    });

    it('should have mosaic-default-control CSS class', () => {
      const { container } = renderWithBothContexts(React.createElement(ReplaceButton));
      const button = container.querySelector('button')!;
      expect(button.classList.contains('mosaic-default-control')).to.equal(true);
    });

    it('should call mosaicWindowActions.replaceWithNew on click', () => {
      const replaceStub = sinon.stub().resolves();
      const wActions = createMockWindowActions({ replaceWithNew: replaceStub });

      const { container } = renderWithBothContexts(React.createElement(ReplaceButton), undefined, wActions);
      fireEvent.click(container.querySelector('button')!);

      expect(replaceStub.calledOnce).to.equal(true);
    });

    it('should call onClick prop after replaceWithNew resolves', async () => {
      const onClickSpy = sinon.spy();
      const replaceStub = sinon.stub().resolves();
      const wActions = createMockWindowActions({ replaceWithNew: replaceStub });

      const { container } = renderWithBothContexts(
        React.createElement(ReplaceButton, { onClick: onClickSpy }),
        undefined,
        wActions,
      );
      fireEvent.click(container.querySelector('button')!);

      // Wait for promise to resolve
      await new Promise((resolve) => setTimeout(resolve, 10));
      expect(onClickSpy.calledOnce).to.equal(true);
    });

    it('should swallow rejection from replaceWithNew', async () => {
      const replaceStub = sinon.stub().rejects(new Error('User cancelled'));
      const wActions = createMockWindowActions({ replaceWithNew: replaceStub });

      const { container } = renderWithBothContexts(React.createElement(ReplaceButton), undefined, wActions);

      // Should not throw
      expect(() => fireEvent.click(container.querySelector('button')!)).to.not.throw();
      await new Promise((resolve) => setTimeout(resolve, 10));
    });
  });

  // ================================================================
  // SplitButton
  // ================================================================
  describe('SplitButton', () => {
    it('should render a button element', () => {
      const { container } = renderWithBothContexts(React.createElement(SplitButton));
      const button = container.querySelector('button');
      expect(button).to.not.equal(null);
    });

    it('should have title "Split Window"', () => {
      const { container } = renderWithBothContexts(React.createElement(SplitButton));
      const button = container.querySelector('button')!;
      expect(button.getAttribute('title')).to.equal('Split Window');
    });

    it('should have split-button CSS class', () => {
      const { container } = renderWithBothContexts(React.createElement(SplitButton));
      const button = container.querySelector('button')!;
      expect(button.classList.contains('split-button')).to.equal(true);
    });

    it('should have mosaic-default-control CSS class', () => {
      const { container } = renderWithBothContexts(React.createElement(SplitButton));
      const button = container.querySelector('button')!;
      expect(button.classList.contains('mosaic-default-control')).to.equal(true);
    });

    it('should call mosaicWindowActions.split on click', () => {
      const splitStub = sinon.stub().resolves();
      const wActions = createMockWindowActions({ split: splitStub });

      const { container } = renderWithBothContexts(React.createElement(SplitButton), undefined, wActions);
      fireEvent.click(container.querySelector('button')!);

      expect(splitStub.calledOnce).to.equal(true);
    });

    it('should call onClick prop after split resolves', async () => {
      const onClickSpy = sinon.spy();
      const splitStub = sinon.stub().resolves();
      const wActions = createMockWindowActions({ split: splitStub });

      const { container } = renderWithBothContexts(
        React.createElement(SplitButton, { onClick: onClickSpy }),
        undefined,
        wActions,
      );
      fireEvent.click(container.querySelector('button')!);

      await new Promise((resolve) => setTimeout(resolve, 10));
      expect(onClickSpy.calledOnce).to.equal(true);
    });

    it('should swallow rejection from split', async () => {
      const splitStub = sinon.stub().rejects(new Error('User cancelled'));
      const wActions = createMockWindowActions({ split: splitStub });

      const { container } = renderWithBothContexts(React.createElement(SplitButton), undefined, wActions);

      expect(() => fireEvent.click(container.querySelector('button')!)).to.not.throw();
      await new Promise((resolve) => setTimeout(resolve, 10));
    });
  });

  // ================================================================
  // Separator
  // ================================================================
  describe('Separator', () => {
    it('should render a div with separator class', () => {
      const { container } = render(React.createElement(Separator));
      const sep = container.querySelector('.separator');
      expect(sep).to.not.equal(null);
    });

    it('should render as a div element', () => {
      const { container } = render(React.createElement(Separator));
      const sep = container.querySelector('.separator')!;
      expect(sep.tagName.toLowerCase()).to.equal('div');
    });

    it('should render no children', () => {
      const { container } = render(React.createElement(Separator));
      const sep = container.querySelector('.separator')!;
      expect(sep.childNodes.length).to.equal(0);
    });
  });

  // ================================================================
  // DefaultToolbarButton
  // ================================================================
  describe('DefaultToolbarButton', () => {
    it('should render a button with given title', () => {
      const { container } = renderWithBothContexts(
        React.createElement(DefaultToolbarButton, {
          title: 'My Title',
          className: 'test-class',
          onClick: sinon.stub(),
        }),
      );
      const button = container.querySelector('button')!;
      expect(button.getAttribute('title')).to.equal('My Title');
    });

    it('should have mosaic-default-control class', () => {
      const { container } = renderWithBothContexts(
        React.createElement(DefaultToolbarButton, {
          title: 'Test',
          className: 'custom-cls',
          onClick: sinon.stub(),
        }),
      );
      expect(container.querySelector('button')!.classList.contains('mosaic-default-control')).to.equal(true);
    });

    it('should have custom class', () => {
      const { container } = renderWithBothContexts(
        React.createElement(DefaultToolbarButton, {
          title: 'Test',
          className: 'my-custom-btn',
          onClick: sinon.stub(),
        }),
      );
      expect(container.querySelector('button')!.classList.contains('my-custom-btn')).to.equal(true);
    });

    it('should call onClick when clicked', () => {
      const clickSpy = sinon.spy();
      const { container } = renderWithBothContexts(
        React.createElement(DefaultToolbarButton, {
          title: 'Test',
          className: 'cls',
          onClick: clickSpy,
        }),
      );
      fireEvent.click(container.querySelector('button')!);
      expect(clickSpy.calledOnce).to.equal(true);
    });

    it('should render text when provided', () => {
      const { container } = renderWithBothContexts(
        React.createElement(DefaultToolbarButton, {
          title: 'Test',
          className: 'cls',
          onClick: sinon.stub(),
          text: 'Click Me',
        }),
      );
      const span = container.querySelector('.control-text');
      expect(span).to.not.equal(null);
      expect(span!.textContent).to.equal('Click Me');
    });

    it('should not render text span when text is undefined', () => {
      const { container } = renderWithBothContexts(
        React.createElement(DefaultToolbarButton, {
          title: 'Test',
          className: 'cls',
          onClick: sinon.stub(),
        }),
      );
      expect(container.querySelector('.control-text')).to.equal(null);
    });

    it('should not render text span when text is empty string', () => {
      const { container } = renderWithBothContexts(
        React.createElement(DefaultToolbarButton, {
          title: 'Test',
          className: 'cls',
          onClick: sinon.stub(),
          text: '',
        }),
      );
      // Empty string is falsy so no span
      expect(container.querySelector('.control-text')).to.equal(null);
    });

    it('should pass click event to onClick handler', () => {
      const clickSpy = sinon.spy();
      const { container } = renderWithBothContexts(
        React.createElement(DefaultToolbarButton, {
          title: 'Test',
          className: 'cls',
          onClick: clickSpy,
        }),
      );
      fireEvent.click(container.querySelector('button')!);
      expect(clickSpy.firstCall.args[0]).to.have.property('type', 'click');
    });
  });

  // ================================================================
  // defaultToolbarControls
  // ================================================================
  describe('defaultToolbarControls', () => {
    it('DEFAULT_CONTROLS_WITH_CREATION should contain 4 controls', () => {
      expect(DEFAULT_CONTROLS_WITH_CREATION.length).to.equal(4);
    });

    it('DEFAULT_CONTROLS_WITHOUT_CREATION should contain 2 controls', () => {
      expect(DEFAULT_CONTROLS_WITHOUT_CREATION.length).to.equal(2);
    });

    it('DEFAULT_CONTROLS_WITH_CREATION should be an array of React elements', () => {
      DEFAULT_CONTROLS_WITH_CREATION.forEach((ctrl: any) => {
        expect(React.isValidElement(ctrl)).to.equal(true);
      });
    });

    it('DEFAULT_CONTROLS_WITHOUT_CREATION should be an array of React elements', () => {
      DEFAULT_CONTROLS_WITHOUT_CREATION.forEach((ctrl: any) => {
        expect(React.isValidElement(ctrl)).to.equal(true);
      });
    });
  });
});
