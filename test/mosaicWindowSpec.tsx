import { expect } from 'chai';
import sinon from 'sinon';
import React from 'react';
import { render, cleanup, fireEvent } from '@testing-library/react';
import { MosaicWithoutDragDropContext } from '../src/Mosaic';
import { MosaicKey, MosaicNode } from '../src/types';
import { MosaicWindow } from '../src/MosaicWindow';


// Renders MosaicWindow within MosaicWithoutDragDropContext using renderTile
function renderMosaicWithWindows(
  tree: MosaicNode<string>,
  windowProps?: Partial<any>,
  mosaicProps?: Partial<any>,
) {
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
          React.createElement('div', { className: `content-${id}` }, `Content of ${id}`),
        ),
      initialValue: tree,
      ...mosaicProps,
    }),
  );
}

afterEach(() => {
  cleanup();
  sinon.restore();
});

describe('MosaicWindow Tests', () => {
  describe('Basic Rendering', () => {
    it('should render a mosaic window', () => {
      const { container } = renderMosaicWithWindows('test-tile');
      expect(container.querySelector('.mosaic-window')).to.not.equal(null);
    });

    it('should render window body', () => {
      const { container } = renderMosaicWithWindows('test-tile');
      expect(container.querySelector('.mosaic-window-body')).to.not.equal(null);
    });

    it('should render children inside window body', () => {
      const { container } = renderMosaicWithWindows('test-tile');
      expect(container.querySelector('.content-test-tile')).to.not.equal(null);
    });

    it('should render toolbar', () => {
      const { container } = renderMosaicWithWindows('test-tile');
      expect(container.querySelector('.mosaic-window-toolbar')).to.not.equal(null);
    });

    it('should render window title', () => {
      const { container } = renderMosaicWithWindows('my-window');
      const title = container.querySelector('.mosaic-window-title');
      expect(title).to.not.equal(null);
      expect(title!.textContent).to.equal('Window my-window');
    });

    it('should render window controls', () => {
      const { container } = renderMosaicWithWindows('test-tile');
      expect(container.querySelector('.mosaic-window-controls')).to.not.equal(null);
    });

    it('should render two windows in a split layout', () => {
      const tree: MosaicNode<string> = {
        direction: 'row',
        first: 'left',
        second: 'right',
      };
      const { container } = renderMosaicWithWindows(tree);
      const windows = container.querySelectorAll('.mosaic-window');
      expect(windows.length).to.equal(2);
    });

    it('should render content for each window in split layout', () => {
      const tree: MosaicNode<string> = {
        direction: 'row',
        first: 'left',
        second: 'right',
      };
      const { container } = renderMosaicWithWindows(tree);
      expect(container.querySelector('.content-left')).to.not.equal(null);
      expect(container.querySelector('.content-right')).to.not.equal(null);
    });
  });

  describe('Custom className', () => {
    it('should apply custom className to window', () => {
      const { container } = renderMosaicWithWindows('test-tile', { className: 'my-custom-window' });
      const window = container.querySelector('.mosaic-window');
      expect(window!.classList.contains('my-custom-window')).to.equal(true);
    });
  });

  describe('Toolbar Controls', () => {
    it('should render default controls without creation when no createNode provided', () => {
      const { container } = renderMosaicWithWindows({
        direction: 'row',
        first: 'left',
        second: 'right',
      });
      // DEFAULT_CONTROLS_WITHOUT_CREATION has ExpandButton and RemoveButton
      const controls = container.querySelectorAll('.mosaic-window-controls button');
      // Should have at least expand + remove = 2
      expect(controls.length).to.be.greaterThanOrEqual(2);
    });

    it('should render default controls with creation when createNode is provided', () => {
      const { container } = renderMosaicWithWindows(
        {
          direction: 'row',
          first: 'left',
          second: 'right',
        },
        { createNode: () => 'new-window' },
      );
      // DEFAULT_CONTROLS_WITH_CREATION has Replace, Split, Expand, Remove = 4
      const controls = container.querySelectorAll('.mosaic-window-controls button');
      expect(controls.length).to.be.greaterThanOrEqual(4);
    });

    it('should render custom toolbar controls when provided', () => {
      const customControls = React.createElement('button', { className: 'custom-ctrl' }, 'Custom');
      const { container } = renderMosaicWithWindows('test', {
        toolbarControls: customControls,
      });
      expect(container.querySelector('.custom-ctrl')).to.not.equal(null);
    });

    it('should render expand button in default controls', () => {
      const { container } = renderMosaicWithWindows({
        direction: 'row',
        first: 'a',
        second: 'b',
      });
      expect(container.querySelector('.expand-button')).to.not.equal(null);
    });

    it('should render close button in default controls', () => {
      const { container } = renderMosaicWithWindows({
        direction: 'row',
        first: 'a',
        second: 'b',
      });
      expect(container.querySelector('.close-button')).to.not.equal(null);
    });
  });

  describe('Custom Toolbar Rendering', () => {
    it('should use renderToolbar when provided', () => {
      const renderToolbar = (_props: any, _draggable: any) =>
        React.createElement('div', { className: 'custom-toolbar-content' }, 'Custom Toolbar');

      const { container } = renderMosaicWithWindows('test', { renderToolbar });
      expect(container.querySelector('.custom-toolbar-content')).to.not.equal(null);
    });
  });

  describe('Additional Controls', () => {
    it('should render additional controls button when additionalControls is provided', () => {
      const additionalControls = React.createElement('div', { className: 'extra-controls' }, 'Extra');
      const { container } = renderMosaicWithWindows('test', { additionalControls });
      // There should be a "More" button
      const moreButton = Array.from(container.querySelectorAll('button')).find(
        (btn) => btn.textContent && btn.textContent.includes('More'),
      );
      expect(moreButton).to.not.equal(undefined);
    });

    it('should render additionalControlButtonText', () => {
      const additionalControls = React.createElement('div', null, 'Extra');
      const { container } = renderMosaicWithWindows('test', {
        additionalControls,
        additionalControlButtonText: 'Options',
      });
      const moreButton = Array.from(container.querySelectorAll('button')).find(
        (btn) => btn.textContent && btn.textContent.includes('Options'),
      );
      expect(moreButton).to.not.equal(undefined);
    });

    it('should render additional controls bar', () => {
      const additionalControls = React.createElement('div', { className: 'my-extra' }, 'Extra');
      const { container } = renderMosaicWithWindows('test', { additionalControls });
      expect(container.querySelector('.mosaic-window-additional-actions-bar')).to.not.equal(null);
      expect(container.querySelector('.my-extra')).to.not.equal(null);
    });

    it('should toggle additional controls open on button click', () => {
      const additionalControls = React.createElement('div', { className: 'extra' }, 'Extra!');
      const { container } = renderMosaicWithWindows('test', { additionalControls });

      const moreButton = Array.from(container.querySelectorAll('button')).find(
        (btn) => btn.textContent && btn.textContent.includes('More'),
      )!;

      // Click to open
      fireEvent.click(moreButton);
      expect(container.querySelector('.additional-controls-open')).to.not.equal(null);

      // Click to close
      fireEvent.click(moreButton);
      expect(container.querySelector('.additional-controls-open')).to.equal(null);
    });

    it('should call onAdditionalControlsToggle callback', () => {
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
      expect(toggleSpy.calledOnce).to.equal(true);
      expect(toggleSpy.firstCall.args[0]).to.equal(true);
    });

    it('should render separator between additional controls toggle and toolbar controls', () => {
      const additionalControls = React.createElement('div', null, 'Extra');
      const { container } = renderMosaicWithWindows('test', { additionalControls });
      expect(container.querySelector('.separator')).to.not.equal(null);
    });

    it('should not render separator when no additional controls', () => {
      const { container } = renderMosaicWithWindows('test');
      const controlsArea = container.querySelector('.mosaic-window-controls');
      // no "More" button, no separator
      const sep = controlsArea?.querySelector('.separator');
      expect(sep).to.equal(null);
    });
  });

  describe('Body Overlay', () => {
    it('should render body overlay by default for additional controls', () => {
      const additionalControls = React.createElement('div', null, 'Extra');
      const { container } = renderMosaicWithWindows('test', { additionalControls });
      expect(container.querySelector('.mosaic-window-body-overlay')).to.not.equal(null);
    });

    it('should not render body overlay when disableAdditionalControlsOverlay is true', () => {
      const additionalControls = React.createElement('div', null, 'Extra');
      const { container } = renderMosaicWithWindows('test', {
        additionalControls,
        disableAdditionalControlsOverlay: true,
      });
      expect(container.querySelector('.mosaic-window-body-overlay')).to.equal(null);
    });

    it('should close additional controls when overlay is clicked', () => {
      const additionalControls = React.createElement('div', null, 'Extra');
      const { container } = renderMosaicWithWindows('test', { additionalControls });

      // Open additional controls
      const moreButton = Array.from(container.querySelectorAll('button')).find(
        (btn) => btn.textContent && btn.textContent.includes('More'),
      )!;
      fireEvent.click(moreButton);
      expect(container.querySelector('.additional-controls-open')).to.not.equal(null);

      // Click overlay to close
      const overlay = container.querySelector('.mosaic-window-body-overlay')!;
      fireEvent.click(overlay);
      expect(container.querySelector('.additional-controls-open')).to.equal(null);
    });
  });

  describe('Draggable', () => {
    it('should have draggable class on toolbar when path is non-empty', () => {
      const tree: MosaicNode<string> = {
        direction: 'row',
        first: 'left',
        second: 'right',
      };
      const { container } = renderMosaicWithWindows(tree);
      const toolbar = container.querySelector('.mosaic-window-toolbar');
      expect(toolbar!.classList.contains('draggable')).to.equal(true);
    });

    it('should not have draggable class on toolbar when draggable is false', () => {
      const tree: MosaicNode<string> = {
        direction: 'row',
        first: 'left',
        second: 'right',
      };
      const { container } = renderMosaicWithWindows(tree, { draggable: false });
      const toolbars = container.querySelectorAll('.mosaic-window-toolbar');
      toolbars.forEach((toolbar) => {
        expect(toolbar.classList.contains('draggable')).to.equal(false);
      });
    });

    it('should not have draggable class when path is root (single tile)', () => {
      const { container } = renderMosaicWithWindows('only-tile');
      const toolbar = container.querySelector('.mosaic-window-toolbar');
      expect(toolbar!.classList.contains('draggable')).to.equal(false);
    });
  });

  describe('Preview', () => {
    it('should render default preview', () => {
      const { container } = renderMosaicWithWindows('test');
      expect(container.querySelector('.mosaic-preview')).to.not.equal(null);
    });

    it('should render custom preview when renderPreview is provided', () => {
      const renderPreview = (_props: any) =>
        React.createElement('div', { className: 'custom-preview' }, 'Custom Preview');

      const { container } = renderMosaicWithWindows('test', { renderPreview });
      expect(container.querySelector('.custom-preview')).to.not.equal(null);
    });
  });

  describe('Drop Targets', () => {
    it('should render drop target container', () => {
      const { container } = renderMosaicWithWindows('test');
      expect(container.querySelector('.drop-target-container')).to.not.equal(null);
    });

    it('should render 4 drop targets (top, bottom, left, right)', () => {
      const { container } = renderMosaicWithWindows('test');
      const dropTargets = container.querySelectorAll('.drop-target');
      // Each window has 4 drop targets, plus the root drop targets
      expect(dropTargets.length).to.be.greaterThanOrEqual(4);
    });

    it('should render drop targets with position classes', () => {
      const { container } = renderMosaicWithWindows('test');
      expect(container.querySelector('.drop-target.top')).to.not.equal(null);
      expect(container.querySelector('.drop-target.bottom')).to.not.equal(null);
      expect(container.querySelector('.drop-target.left')).to.not.equal(null);
      expect(container.querySelector('.drop-target.right')).to.not.equal(null);
    });
  });

  describe('Multiple Windows', () => {
    it('should render 3 windows for 3-pane layout', () => {
      const tree: MosaicNode<string> = {
        direction: 'row',
        first: 'a',
        second: {
          direction: 'column',
          first: 'b',
          second: 'c',
        },
      };
      const { container } = renderMosaicWithWindows(tree);
      const windows = container.querySelectorAll('.mosaic-window');
      expect(windows.length).to.equal(3);
    });

    it('should render unique titles for each window', () => {
      const tree: MosaicNode<string> = {
        direction: 'row',
        first: 'alpha',
        second: 'beta',
      };
      const { container } = renderMosaicWithWindows(tree);
      const titles = container.querySelectorAll('.mosaic-window-title');
      // Each window renders a title in toolbar + preview = 4 total
      expect(titles.length).to.be.greaterThanOrEqual(2);
      const titleTexts = Array.from(titles).map((t) => t.textContent);
      expect(titleTexts).to.include('Window alpha');
      expect(titleTexts).to.include('Window beta');
    });
  });
});
