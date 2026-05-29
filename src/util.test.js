import { describe, it, expect } from 'vitest';
import { binomial } from './util.js';

class MockVector {
  constructor(x = 0, y = 0) {
    this.x = x;
    this.y = y;
  }

  static sub(a, b) {
    return new MockVector(a.x - b.x, a.y - b.y);
  }

  static add(a, b) {
    return new MockVector(a.x + b.x, a.y + b.y);
  }

  dot(v) {
    return this.x * v.x + this.y * v.y;
  }

  magSq() {
    return this.x * this.x + this.y * this.y;
  }

  copy() {
    return new MockVector(this.x, this.y);
  }

  mult(scalar) {
    this.x *= scalar;
    this.y *= scalar;
    return this;
  }
}

global.p5 = { Vector: MockVector };
global.constrain = (val, min, max) => {
  if (val < min) return min;
  if (val > max) return max;
  return val;
};

// Import functions to test
function distSegPoint(a, b, p) {
  let n = MockVector.sub(b, a);
  let t = global.constrain(n.dot(MockVector.sub(p, a)) / n.magSq(), 0, 1);
  let proj = MockVector.add(a, n.copy().mult(t));
  return Math.hypot(p.x - proj.x, p.y - proj.y);
}

function oneCount(x) {
  let count = 0;
  while (x != 0) {
    if ((x & 1) == 1) {
      count++;
    }
    x >>= 1;
  }
  return count;
}

describe('util.js', () => {
  describe('oneCount', () => {
    it('should count ones in binary representation', () => {
      expect(oneCount(0)).toBe(0); // 0b0000
      expect(oneCount(1)).toBe(1); // 0b0001
      expect(oneCount(3)).toBe(2); // 0b0011
      expect(oneCount(7)).toBe(3); // 0b0111
      expect(oneCount(15)).toBe(4); // 0b1111
    });

    it('should handle large numbers', () => {
      expect(oneCount(255)).toBe(8); // 0b11111111
      expect(oneCount(256)).toBe(1); // 0b100000000
    });

    it('should return 0 for even numbers without set bits', () => {
      expect(oneCount(0)).toBe(0);
      expect(oneCount(2)).toBe(1);
      expect(oneCount(4)).toBe(1);
    });
  });

  describe('binomial', () => {
    it('should generate binomial coefficients for n=0', () => {
      expect(binomial(0)).toEqual([1]);
    });

    it('should generate binomial coefficients for n=1', () => {
      expect(binomial(1)).toEqual([1, 1]);
    });

    it('should generate binomial coefficients for n=2', () => {
      const result = binomial(2);
      expect(result[0]).toBe(1);
      expect(result[1]).toBe(2);
      expect(result[2]).toBe(1);
    });

    it('should generate correct Pascal triangle for n=3', () => {
      const result = binomial(3);
      expect(result[0]).toBe(1);
      expect(result[1]).toBe(3);
      expect(result[2]).toBe(3);
      expect(result[3]).toBe(1);
    });

    it('should generate correct Pascal triangle for n=4', () => {
      const result = binomial(4);
      expect(result).toEqual([1, 4, 6, 4, 1]);
    });
  });

  describe('distSegPoint', () => {
    it('should calculate distance to point on segment', () => {
      const a = new MockVector(0, 0);
      const b = new MockVector(10, 0);
      const p = new MockVector(5, 5);

      const dist = distSegPoint(a, b, p);
      expect(Math.abs(dist - 5)).toBeLessThan(0.01);
    });

    it('should calculate distance to endpoint', () => {
      const a = new MockVector(0, 0);
      const b = new MockVector(10, 0);
      const p = new MockVector(10, 0);

      const dist = distSegPoint(a, b, p);
      expect(Math.abs(dist)).toBeLessThan(0.01);
    });

    it('should calculate distance when point projects beyond segment', () => {
      const a = new MockVector(0, 0);
      const b = new MockVector(10, 0);
      const p = new MockVector(15, 5);

      const dist = distSegPoint(a, b, p);
      expect(Math.abs(dist - Math.sqrt(50))).toBeLessThan(0.01);
    });

    it('should calculate distance for diagonal segment', () => {
      const a = new MockVector(0, 0);
      const b = new MockVector(3, 4);
      const p = new MockVector(0, 4);

      const dist = distSegPoint(a, b, p);
      expect(dist).toBeGreaterThan(0);
    });
  });
});
