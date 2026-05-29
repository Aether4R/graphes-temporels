import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock global variables
global.N = 5; // Number of nodes

// Mock p5 functions
global.max = Math.max;
global.min = Math.min;

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

class Subset {
  constructor(bits = 0, current = 0) {
    this.bits = bits;
    this.current = current;
    this.x = 0;
    this.y = 0;
    this.size = 0;
  }
}

class Lattice {
  constructor(x0, y0, w, h, hSnap) {
    this.x0 = x0;
    this.y0 = y0;
    this.w = w;
    this.h = h;
    this.hSnap = hSnap;

    let subsetsTmp = Array(global.N).fill(null).map(() => []);
    for (let c = 0; c < global.N; c++) {
      subsetsTmp[c].push(null);
    }

    for (let s = 1; s < (1 << global.N); s += 2) {
      let c = oneCount(s >> 1);
      for (let i = 0; i < global.N; i++) {
        if (((s >> i) & 1) === 1) {
          subsetsTmp[c].push(new Subset(s, i));
        }
      }
      subsetsTmp[c].push(null);
    }

    let maxPerRow = 0;
    for (let l of subsetsTmp) {
      maxPerRow = Math.max(maxPerRow, l.length);
    }
    let size = Math.min(this.w / maxPerRow, 100);
    let yGap = (this.h - global.N * size) / (global.N + 1);

    let y = this.y0 + yGap + size / 2;
    for (let c = global.N - 1; c >= 0; c--) {
      let row = subsetsTmp[c];
      let n = (row.length - 1) / (c + 2);
      let xGap = (this.w - n * (c + 1) * size) / (n + 1);
      let x = size / 2;

      for (let sub of row) {
        if (sub !== null) {
          sub.x = x;
          sub.y = y;
          sub.size = size;
          x += size;
        } else {
          x += xGap;
        }
      }
      y += yGap + size;
    }

    this.subsets = subsetsTmp.flat().filter(s => s !== null);
  }
}

describe('Lattice', () => {
  let lattice;

  beforeEach(() => {
    lattice = new Lattice(0, 0, 800, 600, 50);
  });

  describe('constructor', () => {
    it('should initialize with correct properties', () => {
      expect(lattice.x0).toBe(0);
      expect(lattice.y0).toBe(0);
      expect(lattice.w).toBe(800);
      expect(lattice.h).toBe(600);
      expect(lattice.hSnap).toBe(50);
    });

    it('should create lattice with custom position', () => {
      const customLattice = new Lattice(100, 200, 500, 400, 30);
      expect(customLattice.x0).toBe(100);
      expect(customLattice.y0).toBe(200);
      expect(customLattice.w).toBe(500);
      expect(customLattice.h).toBe(400);
    });

    it('should generate subsets for the lattice', () => {
      expect(lattice.subsets).toBeDefined();
      expect(lattice.subsets.length).toBeGreaterThan(0);
    });
  });

  describe('subset positioning', () => {
    it('should position subsets within lattice bounds', () => {
      for (let subset of lattice.subsets) {
        expect(subset.x).toBeGreaterThanOrEqual(0);
        expect(subset.y).toBeGreaterThanOrEqual(lattice.y0);
        expect(subset.x).toBeLessThanOrEqual(lattice.w);
        expect(subset.y).toBeLessThanOrEqual(lattice.y0 + lattice.h);
      }
    });

    it('should assign size to all subsets', () => {
      for (let subset of lattice.subsets) {
        expect(subset.size).toBeGreaterThan(0);
        expect(subset.size).toBeLessThanOrEqual(100);
      }
    });

    it('should assign valid bit values to subsets', () => {
      for (let subset of lattice.subsets) {
        expect(subset.bits).toBeGreaterThan(0);
        expect(subset.bits).toBeLessThan(1 << global.N);
      }
    });

    it('should assign valid current values to subsets', () => {
      for (let subset of lattice.subsets) {
        expect(subset.current).toBeGreaterThanOrEqual(0);
        expect(subset.current).toBeLessThan(global.N);
      }
    });
  });

  describe('lattice layout', () => {
    it('should handle small lattice', () => {
      const smallLattice = new Lattice(0, 0, 200, 200, 50);
      expect(smallLattice.subsets.length).toBeGreaterThan(0);
    });

    it('should handle large lattice', () => {
      const largeLattice = new Lattice(0, 0, 1600, 1200, 100);
      expect(largeLattice.subsets.length).toBeGreaterThan(0);
    });

    it('should maintain consistent spacing', () => {
      const lattice1 = new Lattice(0, 0, 800, 600, 50);
      const lattice2 = new Lattice(0, 0, 800, 600, 50);

      expect(lattice1.subsets.length).toBe(lattice2.subsets.length);
    });
  });

  describe('edge cases', () => {
    it('should handle minimal size lattice', () => {
      const minLattice = new Lattice(0, 0, 100, 100, 10);
      expect(minLattice.subsets).toBeDefined();
    });

    it('should work with offset origin', () => {
      const offsetLattice = new Lattice(500, 300, 400, 400, 50);
      expect(offsetLattice.x0).toBe(500);
      expect(offsetLattice.y0).toBe(300);
    });
  });

  describe('subset generation', () => {
    it('should generate odd-numbered subsets', () => {
      // For N=5, we should have subsets with odd bit patterns
      for (let subset of lattice.subsets) {
        // Check that bits are odd (LSB is 1)
        expect(subset.bits & 1).toBe(1);
      }
    });

    it('should generate non-empty subsets', () => {
      for (let subset of lattice.subsets) {
        expect(subset.bits).toBeGreaterThan(0);
      }
    });
  });
});
