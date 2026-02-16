import { expect } from 'chai';
import { BoundingBox } from '../src/util/BoundingBox';

function expectBoundingBoxCloseTo(a: BoundingBox, b: BoundingBox, delta: number = 0.000001) {
  expect(a.top).to.be.closeTo(b.top, delta);
  expect(a.right).to.be.closeTo(b.right, delta);
  expect(a.bottom).to.be.closeTo(b.bottom, delta);
  expect(a.left).to.be.closeTo(b.left, delta);
}

describe('BoundingBox (extended)', () => {
  describe('empty', () => {
    it('should create a zero bounding box', () => {
      const empty = BoundingBox.empty();
      expect(empty.top).to.equal(0);
      expect(empty.right).to.equal(0);
      expect(empty.bottom).to.equal(0);
      expect(empty.left).to.equal(0);
    });
  });

  describe('asStyles', () => {
    it('should convert to percentage strings', () => {
      const styles = BoundingBox.asStyles({ top: 10, right: 20, bottom: 30, left: 40 });
      expect(styles.top).to.equal('10%');
      expect(styles.right).to.equal('20%');
      expect(styles.bottom).to.equal('30%');
      expect(styles.left).to.equal('40%');
    });

    it('should handle zero values', () => {
      const styles = BoundingBox.asStyles(BoundingBox.empty());
      expect(styles.top).to.equal('0%');
      expect(styles.right).to.equal('0%');
      expect(styles.bottom).to.equal('0%');
      expect(styles.left).to.equal('0%');
    });

    it('should handle decimal values', () => {
      const styles = BoundingBox.asStyles({ top: 33.333, right: 0, bottom: 0, left: 0 });
      expect(styles.top).to.equal('33.333%');
    });
  });

  describe('getAbsoluteSplitPercentage', () => {
    it('should return percentage directly for empty bounding box (column)', () => {
      const result = BoundingBox.getAbsoluteSplitPercentage(BoundingBox.empty(), 50, 'column');
      expect(result).to.be.closeTo(50, 0.000001);
    });

    it('should return percentage directly for empty bounding box (row)', () => {
      const result = BoundingBox.getAbsoluteSplitPercentage(BoundingBox.empty(), 50, 'row');
      expect(result).to.be.closeTo(50, 0.000001);
    });

    it('should calculate correctly for offset bounding box (column)', () => {
      const bbox: BoundingBox = { top: 25, right: 0, bottom: 25, left: 0 };
      // height = 100 - 25 - 25 = 50, split at 50%: (50 * 50 / 100) + 25 = 50
      const result = BoundingBox.getAbsoluteSplitPercentage(bbox, 50, 'column');
      expect(result).to.be.closeTo(50, 0.000001);
    });

    it('should calculate correctly for offset bounding box (row)', () => {
      const bbox: BoundingBox = { top: 0, right: 25, bottom: 0, left: 25 };
      // width = 100 - 25 - 25 = 50, split at 50%: (50 * 50 / 100) + 25 = 50
      const result = BoundingBox.getAbsoluteSplitPercentage(bbox, 50, 'row');
      expect(result).to.be.closeTo(50, 0.000001);
    });

    it('should handle extreme split percentages', () => {
      const result0 = BoundingBox.getAbsoluteSplitPercentage(BoundingBox.empty(), 0, 'column');
      expect(result0).to.be.closeTo(0, 0.000001);

      const result100 = BoundingBox.getAbsoluteSplitPercentage(BoundingBox.empty(), 100, 'column');
      expect(result100).to.be.closeTo(100, 0.000001);
    });
  });

  describe('getRelativeSplitPercentage', () => {
    it('should return percentage directly for empty bounding box (column)', () => {
      const result = BoundingBox.getRelativeSplitPercentage(BoundingBox.empty(), 50, 'column');
      expect(result).to.be.closeTo(50, 0.000001);
    });

    it('should return percentage directly for empty bounding box (row)', () => {
      const result = BoundingBox.getRelativeSplitPercentage(BoundingBox.empty(), 50, 'row');
      expect(result).to.be.closeTo(50, 0.000001);
    });

    it('should be inverse of getAbsoluteSplitPercentage (column)', () => {
      const bbox: BoundingBox = { top: 20, right: 0, bottom: 30, left: 0 };
      const relative = 60;
      const absolute = BoundingBox.getAbsoluteSplitPercentage(bbox, relative, 'column');
      const backToRelative = BoundingBox.getRelativeSplitPercentage(bbox, absolute, 'column');
      expect(backToRelative).to.be.closeTo(relative, 0.000001);
    });

    it('should be inverse of getAbsoluteSplitPercentage (row)', () => {
      const bbox: BoundingBox = { top: 0, right: 15, bottom: 0, left: 10 };
      const relative = 40;
      const absolute = BoundingBox.getAbsoluteSplitPercentage(bbox, relative, 'row');
      const backToRelative = BoundingBox.getRelativeSplitPercentage(bbox, absolute, 'row');
      expect(backToRelative).to.be.closeTo(relative, 0.000001);
    });
  });

  describe('split (extended)', () => {
    it('should split at 50% column', () => {
      const { first, second } = BoundingBox.split(BoundingBox.empty(), 50, 'column');
      expectBoundingBoxCloseTo(first, { top: 0, right: 0, bottom: 50, left: 0 });
      expectBoundingBoxCloseTo(second, { top: 50, right: 0, bottom: 0, left: 0 });
    });

    it('should split at 50% row', () => {
      const { first, second } = BoundingBox.split(BoundingBox.empty(), 50, 'row');
      expectBoundingBoxCloseTo(first, { top: 0, right: 50, bottom: 0, left: 0 });
      expectBoundingBoxCloseTo(second, { top: 0, right: 0, bottom: 0, left: 50 });
    });

    it('should handle nested splits correctly', () => {
      // First split: row at 50%
      const level1 = BoundingBox.split(BoundingBox.empty(), 50, 'row');
      // Second split: column at 50% of the first half
      const level2 = BoundingBox.split(level1.first, 50, 'column');

      expectBoundingBoxCloseTo(level2.first, { top: 0, right: 50, bottom: 50, left: 0 });
      expectBoundingBoxCloseTo(level2.second, { top: 50, right: 50, bottom: 0, left: 0 });
    });

    it('should produce non-overlapping areas', () => {
      const bbox: BoundingBox = { top: 10, right: 10, bottom: 10, left: 10 };
      const { first, second } = BoundingBox.split(bbox, 50, 'row');

      // First should end where second begins (in the left dimension)
      const absoluteSplit = BoundingBox.getAbsoluteSplitPercentage(bbox, 50, 'row');
      expect(first.right).to.be.closeTo(100 - absoluteSplit, 0.000001);
      expect(second.left).to.be.closeTo(absoluteSplit, 0.000001);
    });

    it('should handle 0% split', () => {
      const { first, second } = BoundingBox.split(BoundingBox.empty(), 0, 'column');
      expectBoundingBoxCloseTo(first, { top: 0, right: 0, bottom: 100, left: 0 });
      expectBoundingBoxCloseTo(second, { top: 0, right: 0, bottom: 0, left: 0 });
    });

    it('should handle 100% split', () => {
      const { first, second } = BoundingBox.split(BoundingBox.empty(), 100, 'column');
      expectBoundingBoxCloseTo(first, { top: 0, right: 0, bottom: 0, left: 0 });
      expectBoundingBoxCloseTo(second, { top: 100, right: 0, bottom: 0, left: 0 });
    });
  });
});
