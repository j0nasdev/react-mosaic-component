import { expect } from 'chai';
import { getNodeAtPath, MosaicNode, MosaicParent } from '../src/index';
import { MosaicDropTargetPosition } from '../src/internalTypes';
import { MosaicPath } from '../src/types';
import {
  buildSpecFromUpdate,
  createDragToUpdates,
  createExpandUpdate,
  createHideUpdate,
  createRemoveUpdate,
  updateTree,
} from '../src/util/mosaicUpdates';

const SIMPLE_TREE: MosaicNode<number> = {
  direction: 'row',
  first: 1,
  second: 2,
};

const MEDIUM_TREE: MosaicNode<number> = {
  direction: 'row',
  first: 1,
  second: {
    direction: 'column',
    first: {
      direction: 'column',
      first: 2,
      second: 3,
    },
    second: 4,
  },
};

const DEEP_TREE: MosaicNode<number> = {
  direction: 'row',
  first: {
    direction: 'column',
    first: 1,
    second: 2,
  },
  second: {
    direction: 'column',
    first: {
      direction: 'row',
      first: 3,
      second: 4,
    },
    second: 5,
  },
};

const TREE_WITH_PERCENTAGES: MosaicNode<number> = {
  direction: 'row',
  first: 1,
  second: 2,
  splitPercentage: 30,
};

describe('mosaicUpdates (extended)', () => {
  describe('buildSpecFromUpdate', () => {
    it('should build empty path spec', () => {
      const spec = buildSpecFromUpdate({ path: [], spec: { $set: 42 } });
      expect(spec).to.deep.equal({ $set: 42 });
    });

    it('should build single-level path spec', () => {
      const spec = buildSpecFromUpdate({ path: ['first'], spec: { $set: 42 } });
      expect(spec).to.have.nested.property('first.$set', 42);
    });

    it('should build deep path spec', () => {
      const spec = buildSpecFromUpdate({
        path: ['second', 'first', 'second'],
        spec: { $set: 99 },
      });
      expect(spec).to.have.nested.property('second.first.second.$set', 99);
    });
  });

  describe('createHideUpdate', () => {
    it('should hide first child by setting splitPercentage to 0', () => {
      const hideUpdate = createHideUpdate(['first']);
      const updatedTree = updateTree(SIMPLE_TREE, [hideUpdate]);
      expect((updatedTree as MosaicParent<number>).splitPercentage).to.equal(0);
    });

    it('should hide second child by setting splitPercentage to 100', () => {
      const hideUpdate = createHideUpdate(['second']);
      const updatedTree = updateTree(SIMPLE_TREE, [hideUpdate]);
      expect((updatedTree as MosaicParent<number>).splitPercentage).to.equal(100);
    });

    it('should hide deeply nested first child', () => {
      const hideUpdate = createHideUpdate(['second', 'first']);
      const updatedTree = updateTree(MEDIUM_TREE, [hideUpdate]);
      const parent = getNodeAtPath(updatedTree, ['second']) as MosaicParent<number>;
      expect(parent.splitPercentage).to.equal(0);
    });

    it('should hide deeply nested second child', () => {
      const hideUpdate = createHideUpdate(['second', 'second']);
      const updatedTree = updateTree(MEDIUM_TREE, [hideUpdate]);
      const parent = getNodeAtPath(updatedTree, ['second']) as MosaicParent<number>;
      expect(parent.splitPercentage).to.equal(100);
    });
  });

  describe('createExpandUpdate', () => {
    it('should expand node at root level first', () => {
      const expandUpdate = createExpandUpdate(['first'], 70);
      const updatedTree = updateTree(SIMPLE_TREE, [expandUpdate]);
      expect((updatedTree as MosaicParent<number>).splitPercentage).to.equal(70);
    });

    it('should expand node at root level second', () => {
      const expandUpdate = createExpandUpdate(['second'], 70);
      const updatedTree = updateTree(SIMPLE_TREE, [expandUpdate]);
      expect((updatedTree as MosaicParent<number>).splitPercentage).to.equal(30);
    });

    it('should expand deeply nested node', () => {
      const expandUpdate = createExpandUpdate(['second', 'first', 'first'], 80);
      const updatedTree = updateTree(MEDIUM_TREE, [expandUpdate]);
      const root = updatedTree as MosaicParent<number>;
      // second branch should get 100 - 80 = 20
      expect(root.splitPercentage).to.equal(20);
      const secondNode = root.second as MosaicParent<number>;
      expect(secondNode.splitPercentage).to.equal(80);
      const innerNode = secondNode.first as MosaicParent<number>;
      expect(innerNode.splitPercentage).to.equal(80);
    });

    it('should handle empty path gracefully', () => {
      const expandUpdate = createExpandUpdate([], 70);
      const updatedTree = updateTree(SIMPLE_TREE, [expandUpdate]);
      // With empty path, no splitPercentage changes occur in the spec
      expect(updatedTree).to.deep.equal(SIMPLE_TREE);
    });
  });

  describe('updateTree with multiple updates', () => {
    it('should apply multiple updates sequentially', () => {
      const updates = [
        { path: ['first'] as MosaicPath, spec: { $set: 10 as any } },
        { path: ['second', 'second'] as MosaicPath, spec: { $set: 20 as any } },
      ];
      const updatedTree = updateTree(MEDIUM_TREE, updates);
      expect(getNodeAtPath(updatedTree, ['first'])).to.equal(10);
      expect(getNodeAtPath(updatedTree, ['second', 'second'])).to.equal(20);
    });

    it('should handle splitPercentage update', () => {
      const updates = [
        {
          path: [] as MosaicPath,
          spec: { splitPercentage: { $set: 40 } },
        },
      ];
      const updatedTree = updateTree(SIMPLE_TREE, updates);
      expect((updatedTree as MosaicParent<number>).splitPercentage).to.equal(40);
    });

    it('should preserve existing splitPercentage when updating other props', () => {
      const updates = [
        { path: ['first'] as MosaicPath, spec: { $set: 99 as any } },
      ];
      const updatedTree = updateTree(TREE_WITH_PERCENTAGES, updates);
      expect((updatedTree as MosaicParent<number>).splitPercentage).to.equal(30);
      expect(getNodeAtPath(updatedTree, ['first'])).to.equal(99);
    });
  });

  describe('createRemoveUpdate (extended)', () => {
    it('should remove first child and promote second', () => {
      const updatedTree = updateTree(SIMPLE_TREE, [createRemoveUpdate(SIMPLE_TREE, ['first'])]);
      expect(updatedTree).to.equal(2);
    });

    it('should remove second child and promote first', () => {
      const updatedTree = updateTree(SIMPLE_TREE, [createRemoveUpdate(SIMPLE_TREE, ['second'])]);
      expect(updatedTree).to.equal(1);
    });

    it('should remove deeply nested node and promote sibling subtree', () => {
      const updatedTree = updateTree(MEDIUM_TREE, [createRemoveUpdate(MEDIUM_TREE, ['second', 'first', 'first'])]);
      // second.first was { column, first: 2, second: 3 }, removing first=2 should promote second=3
      expect(getNodeAtPath(updatedTree, ['second', 'first'])).to.equal(3);
    });

    it('should maintain tree structure after removal', () => {
      const updatedTree = updateTree(DEEP_TREE, [createRemoveUpdate(DEEP_TREE, ['second', 'first', 'second'])]);
      // second.first was { row, first: 3, second: 4 }, removing second=4 promotes first=3
      expect(getNodeAtPath(updatedTree, ['second', 'first'])).to.equal(3);
      // Rest of tree should be unchanged
      expect(getNodeAtPath(updatedTree, ['first', 'first'])).to.equal(1);
      expect(getNodeAtPath(updatedTree, ['first', 'second'])).to.equal(2);
      expect(getNodeAtPath(updatedTree, ['second', 'second'])).to.equal(5);
    });
  });

  describe('createDragToUpdates (extended)', () => {
    it('should handle LEFT drop position', () => {
      const updatedTree = updateTree(
        MEDIUM_TREE,
        createDragToUpdates(MEDIUM_TREE, ['second', 'second'], ['first'], MosaicDropTargetPosition.LEFT),
      );
      const firstNode = getNodeAtPath(updatedTree, ['first']) as MosaicParent<number>;
      expect(firstNode.direction).to.equal('row');
      expect(firstNode.first).to.equal(4); // source moved to the left
      expect(firstNode.second).to.equal(1); // original destination
    });

    it('should handle TOP drop position', () => {
      const updatedTree = updateTree(
        MEDIUM_TREE,
        createDragToUpdates(MEDIUM_TREE, ['second', 'second'], ['first'], MosaicDropTargetPosition.TOP),
      );
      const firstNode = getNodeAtPath(updatedTree, ['first']) as MosaicParent<number>;
      expect(firstNode.direction).to.equal('column');
      expect(firstNode.first).to.equal(4); // source was dragged to top
    });

    it('should handle BOTTOM drop position', () => {
      const updatedTree = updateTree(
        MEDIUM_TREE,
        createDragToUpdates(MEDIUM_TREE, ['second', 'second'], ['first'], MosaicDropTargetPosition.BOTTOM),
      );
      const firstNode = getNodeAtPath(updatedTree, ['first']) as MosaicParent<number>;
      expect(firstNode.direction).to.equal('column');
      expect(firstNode.second).to.equal(4); // source was dragged to bottom
    });

    it('should handle destination being parent of source', () => {
      // Drag second.first.second (=3) to second (parent)
      const updatedTree = updateTree(
        MEDIUM_TREE,
        createDragToUpdates(
          MEDIUM_TREE,
          ['second', 'first', 'second'],
          ['second'],
          MosaicDropTargetPosition.RIGHT,
        ),
      );
      // Verify the tree is still valid
      expect(updatedTree).to.not.equal(null);
    });

    it('should handle drag within same level', () => {
      const updatedTree = updateTree(
        DEEP_TREE,
        createDragToUpdates(
          DEEP_TREE,
          ['first', 'first'],
          ['first', 'second'],
          MosaicDropTargetPosition.RIGHT,
        ),
      );
      // After dragging first.first(=1) to first.second(=2) RIGHT
      const firstNode = getNodeAtPath(updatedTree, ['first']) as MosaicParent<number>;
      expect(firstNode.first).to.equal(2);
      expect((firstNode.second as any)).to.not.equal(undefined);
    });

    it('should set correct direction for LEFT/RIGHT positions', () => {
      const updatedTree = updateTree(
        MEDIUM_TREE,
        createDragToUpdates(MEDIUM_TREE, ['second', 'second'], ['first'], MosaicDropTargetPosition.RIGHT),
      );
      const firstNode = getNodeAtPath(updatedTree, ['first']) as MosaicParent<number>;
      expect(firstNode.direction).to.equal('row');
    });

    it('should set correct direction for TOP/BOTTOM positions', () => {
      const updatedTree = updateTree(
        MEDIUM_TREE,
        createDragToUpdates(MEDIUM_TREE, ['second', 'second'], ['first'], MosaicDropTargetPosition.BOTTOM),
      );
      const firstNode = getNodeAtPath(updatedTree, ['first']) as MosaicParent<number>;
      expect(firstNode.direction).to.equal('column');
    });
  });
});
