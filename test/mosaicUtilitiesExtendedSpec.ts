import { expect } from 'chai';
import { MosaicNode } from '../src/index';
import {
  Corner,
  createBalancedTreeFromLeaves,
  getAndAssertNodeAtPathExists,
  getLeaves,
  getNodeAtPath,
  getOtherBranch,
  getOtherDirection,
  getPathToCorner,
  isParent,
} from '../src/util/mosaicUtilities';
import { MosaicParent } from '../src/types';

const SINGLE_NODE: MosaicNode<string> = 'only';

const STRING_TREE: MosaicNode<string> = {
  direction: 'row',
  first: 'left',
  second: {
    direction: 'column',
    first: 'top-right',
    second: 'bottom-right',
  },
};

const DEEP_TREE: MosaicNode<number> = {
  direction: 'row',
  first: {
    direction: 'column',
    first: 1,
    second: {
      direction: 'row',
      first: 2,
      second: 3,
    },
  },
  second: {
    direction: 'column',
    first: 4,
    second: 5,
  },
};

describe('mosaicUtilities (extended)', () => {
  describe('isParent', () => {
    it('should return true for a parent node', () => {
      expect(isParent(STRING_TREE)).to.equal(true);
    });

    it('should return false for a string leaf', () => {
      expect(isParent('leaf')).to.equal(false);
    });

    it('should return false for a number leaf', () => {
      expect(isParent(42)).to.equal(false);
    });

    it('should return false for zero', () => {
      expect(isParent(0)).to.equal(false);
    });

    it('should return false for empty string', () => {
      expect(isParent('')).to.equal(false);
    });

    it('should return true for nested parent', () => {
      expect(isParent(STRING_TREE.second)).to.equal(true);
    });
  });

  describe('getOtherBranch', () => {
    it('should return second for first', () => {
      expect(getOtherBranch('first')).to.equal('second');
    });

    it('should return first for second', () => {
      expect(getOtherBranch('second')).to.equal('first');
    });

    it('should throw for invalid branch', () => {
      expect(() => getOtherBranch('invalid' as any)).to.throw(Error);
    });
  });

  describe('getOtherDirection', () => {
    it('should return column for row', () => {
      expect(getOtherDirection('row')).to.equal('column');
    });

    it('should return row for column', () => {
      expect(getOtherDirection('column')).to.equal('row');
    });
  });

  describe('getLeaves (extended)', () => {
    it('should get single leaf', () => {
      expect(getLeaves(SINGLE_NODE)).to.deep.equal(['only']);
    });

    it('should get all string leaves', () => {
      const leaves = getLeaves(STRING_TREE);
      expect(leaves).to.include('left');
      expect(leaves).to.include('top-right');
      expect(leaves).to.include('bottom-right');
      expect(leaves).to.have.length(3);
    });

    it('should get all leaves from deep tree', () => {
      const leaves = getLeaves(DEEP_TREE);
      expect(leaves.sort()).to.deep.equal([1, 2, 3, 4, 5]);
    });

    it('should return empty array for undefined', () => {
      expect(getLeaves(undefined as any)).to.deep.equal([]);
    });
  });

  describe('createBalancedTreeFromLeaves (extended)', () => {
    it('should create single node from one leaf', () => {
      const tree = createBalancedTreeFromLeaves(['a']);
      expect(tree).to.equal('a');
    });

    it('should create tree from two leaves', () => {
      const tree = createBalancedTreeFromLeaves(['a', 'b']);
      expect(isParent(tree!)).to.equal(true);
      const parent = tree as MosaicParent<string>;
      expect(parent.first).to.equal('a');
      expect(parent.second).to.equal('b');
    });

    it('should create tree from three leaves', () => {
      const tree = createBalancedTreeFromLeaves([1, 2, 3]);
      expect(tree).to.not.equal(null);
      const leaves = getLeaves(tree!);
      expect(leaves.sort()).to.deep.equal([1, 2, 3]);
    });

    it('should alternate directions starting with column', () => {
      const tree = createBalancedTreeFromLeaves([1, 2, 3, 4], 'column');
      expect((tree as MosaicParent<number>).direction).to.equal('column');
    });

    it('should alternate directions starting with row', () => {
      const tree = createBalancedTreeFromLeaves([1, 2, 3, 4], 'row');
      expect((tree as MosaicParent<number>).direction).to.equal('row');
    });

    it('should handle numeric leaves', () => {
      const tree = createBalancedTreeFromLeaves([1, 2, 3, 4, 5]);
      const leaves = getLeaves(tree!);
      expect(leaves.sort()).to.deep.equal([1, 2, 3, 4, 5]);
    });
  });

  describe('getNodeAtPath (extended)', () => {
    it('should get root of single node', () => {
      expect(getNodeAtPath(SINGLE_NODE, [])).to.equal('only');
    });

    it('should return null for path beyond leaf', () => {
      expect(getNodeAtPath(SINGLE_NODE, ['first'])).to.equal(null);
    });

    it('should navigate deep path', () => {
      expect(getNodeAtPath(DEEP_TREE, ['first', 'second', 'first'])).to.equal(2);
      expect(getNodeAtPath(DEEP_TREE, ['first', 'second', 'second'])).to.equal(3);
    });

    it('should handle string keys', () => {
      expect(getNodeAtPath(STRING_TREE, ['second', 'first'])).to.equal('top-right');
      expect(getNodeAtPath(STRING_TREE, ['second', 'second'])).to.equal('bottom-right');
    });
  });

  describe('getAndAssertNodeAtPathExists (extended)', () => {
    it('should return node for valid deep path', () => {
      expect(getAndAssertNodeAtPathExists(DEEP_TREE, ['first', 'second', 'first'])).to.equal(2);
    });

    it('should throw for path beyond leaf', () => {
      expect(() => getAndAssertNodeAtPathExists(SINGLE_NODE, ['first'])).to.throw(Error);
    });

    it('should work with string tree', () => {
      expect(getAndAssertNodeAtPathExists(STRING_TREE, ['first'])).to.equal('left');
    });
  });

  describe('getPathToCorner (extended)', () => {
    it('should handle single node tree', () => {
      const path = getPathToCorner(SINGLE_NODE, Corner.TOP_LEFT);
      expect(path).to.deep.equal([]);
    });

    it('should find top-left in deep tree', () => {
      const path = getPathToCorner(DEEP_TREE, Corner.TOP_LEFT);
      expect(getNodeAtPath(DEEP_TREE, path)).to.equal(1);
    });

    it('should find top-right in deep tree', () => {
      const path = getPathToCorner(DEEP_TREE, Corner.TOP_RIGHT);
      expect(getNodeAtPath(DEEP_TREE, path)).to.equal(4);
    });

    it('should find bottom-left in deep tree', () => {
      const path = getPathToCorner(DEEP_TREE, Corner.BOTTOM_LEFT);
      expect(getNodeAtPath(DEEP_TREE, path)).to.equal(2);
    });

    it('should find bottom-right in deep tree', () => {
      const path = getPathToCorner(DEEP_TREE, Corner.BOTTOM_RIGHT);
      expect(getNodeAtPath(DEEP_TREE, path)).to.equal(5);
    });

    it('should work with string keys', () => {
      const path = getPathToCorner(STRING_TREE, Corner.TOP_LEFT);
      expect(getNodeAtPath(STRING_TREE, path)).to.equal('left');
    });

    it('should find top-right in string tree', () => {
      const path = getPathToCorner(STRING_TREE, Corner.TOP_RIGHT);
      expect(getNodeAtPath(STRING_TREE, path)).to.equal('top-right');
    });

    it('should find bottom-right in string tree', () => {
      const path = getPathToCorner(STRING_TREE, Corner.BOTTOM_RIGHT);
      expect(getNodeAtPath(STRING_TREE, path)).to.equal('bottom-right');
    });
  });
});
