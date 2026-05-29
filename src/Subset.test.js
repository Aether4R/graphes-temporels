import { describe, it, expect, beforeEach } from 'vitest';

const INF = Number.MAX_SAFE_INTEGER;

class Subset {
  constructor(bits = 0, current = 0) {
    this.bits = bits;
    this.current = current;
    this.hops = INF;
    this.x = 0;
    this.y = 0;
    this.size = 0;
    this.parent = null;
    this.fresh = false;
  }

  copy(s) {
    this.bits = s.bits;
    this.current = s.current;
    this.hops = s.hops;
    this.x = s.x;
    this.y = s.y;
    this.size = s.size;
    this.parent = s.parent;
    this.fresh = s.fresh;
  }
}

describe('Subset', () => {
  let subset;

  beforeEach(() => {
    subset = new Subset();
  });

  describe('constructor', () => {
    it('should initialize with default values', () => {
      expect(subset.bits).toBe(0);
      expect(subset.current).toBe(0);
      expect(subset.hops).toBe(INF);
      expect(subset.x).toBe(0);
      expect(subset.y).toBe(0);
      expect(subset.size).toBe(0);
      expect(subset.parent).toBe(null);
      expect(subset.fresh).toBe(false);
    });

    it('should initialize with provided bits and current values', () => {
      const sub = new Subset(5, 2);
      expect(sub.bits).toBe(5);
      expect(sub.current).toBe(2);
    });
  });

  describe('copy', () => {
    it('should copy all properties from another subset', () => {
      const source = new Subset(15, 3);
      source.hops = 5;
      source.x = 100;
      source.y = 200;
      source.size = 50;
      source.fresh = true;

      const target = new Subset();
      target.copy(source);

      expect(target.bits).toBe(15);
      expect(target.current).toBe(3);
      expect(target.hops).toBe(5);
      expect(target.x).toBe(100);
      expect(target.y).toBe(200);
      expect(target.size).toBe(50);
      expect(target.fresh).toBe(true);
    });

    it('should preserve parent reference after copy', () => {
      const parent = new Subset();
      const source = new Subset(7, 1);
      source.parent = parent;

      const target = new Subset();
      target.copy(source);

      expect(target.parent).toBe(parent);
    });

    it('should create independent copies', () => {
      const source = new Subset(3, 1);
      source.hops = 10;

      const target = new Subset();
      target.copy(source);

      source.hops = 20;
      expect(target.hops).toBe(10);
    });

    it('should handle copying zero values', () => {
      const source = new Subset(0, 0);
      source.hops = 0;

      const target = new Subset(255, 5);
      target.copy(source);

      expect(target.bits).toBe(0);
      expect(target.current).toBe(0);
      expect(target.hops).toBe(0);
    });
  });

  describe('bit operations', () => {
    it('should store and retrieve bit values', () => {
      const sub = new Subset(0b1011, 2); // bits: 1011
      expect(sub.bits).toBe(11);
      expect(sub.bits & (1 << 0)).not.toBe(0); // bit 0 set
      expect(sub.bits & (1 << 1)).not.toBe(0); // bit 1 set
      expect(sub.bits & (1 << 2)).toBe(0); // bit 2 not set
      expect(sub.bits & (1 << 3)).not.toBe(0); // bit 3 set
    });

    it('should allow setting individual bits', () => {
      const sub = new Subset(0, 0);
      sub.bits |= (1 << 0); // set bit 0
      expect(sub.bits).toBe(1);

      sub.bits |= (1 << 2); // set bit 2
      expect(sub.bits).toBe(5);
    });
  });

  describe('positioning', () => {
    it('should allow setting position properties', () => {
      subset.x = 150;
      subset.y = 200;
      subset.size = 75;

      expect(subset.x).toBe(150);
      expect(subset.y).toBe(200);
      expect(subset.size).toBe(75);
    });

    it('should allow updating hops value', () => {
      subset.hops = 3;
      expect(subset.hops).toBe(3);

      subset.hops = INF;
      expect(subset.hops).toBe(INF);
    });
  });

  describe('state management', () => {
    it('should toggle fresh state', () => {
      expect(subset.fresh).toBe(false);
      subset.fresh = true;
      expect(subset.fresh).toBe(true);
    });

    it('should handle parent assignment', () => {
      const parentSub = new Subset(7, 1);
      subset.parent = parentSub;
      expect(subset.parent).toBe(parentSub);
    });
  });
});
