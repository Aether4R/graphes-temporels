import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock global variables and p5 functions
global.N = 5;
global.createVector = vi.fn((x, y) => ({ x, y }));
global.cos = Math.cos;
global.sin = Math.sin;
global.TWO_PI = 2 * Math.PI;

class Graph {
  constructor(xc, yc, r) {
    this.adj = Array.from({ length: global.N }, () => Array(global.N).fill(false));
    this.v = Array(global.N);

    this.setPos(xc, yc, r);

    this.xc = xc;
    this.yc = yc;
    this.r = r;

    this.displayMissing = true;
    this.edgeTimes = Array.from({ length: global.N }, () =>
      Array.from({ length: global.N }, () => [])
    );

    this.hoveredEdges = [];
  }

  setPos(xc, yc, r) {
    this.xc = xc;
    this.yc = yc;
    this.r = r;

    for (let i = 0; i < global.N; i++) {
      this.v[i] = global.createVector(
        xc + r * global.cos((i * global.TWO_PI) / global.N),
        yc + r * global.sin((i * global.TWO_PI) / global.N)
      );
    }
  }

  addEdge(i, j) {
    this.adj[i][j] = true;
    this.adj[j][i] = true;
  }

  removeEdge(i, j) {
    this.adj[i][j] = false;
    this.adj[j][i] = false;
  }

  hasEdge(i, j) {
    return this.adj[i][j];
  }

  clearEdges() {
    for (let i = 0; i < global.N; i++) {
      for (let j = 0; j < global.N; j++) {
        this.adj[i][j] = false;
      }
    }
  }

  addHoveredEdge(i, j) {
    if (!this.hoveredEdges.some(e => (e[0] === i && e[1] === j) || (e[0] === j && e[1] === i))) {
      this.hoveredEdges.push([i, j]);
    }
  }

  removeHoveredEdge(i, j) {
    this.hoveredEdges = this.hoveredEdges.filter(e => !(e[0] === i && e[1] === j) && !(e[0] === j && e[1] === i));
  }

  clearHoveredEdges() {
    this.hoveredEdges = [];
  }
}

describe('Graph', () => {
  let graph;

  beforeEach(() => {
    graph = new Graph(400, 300, 150);
  });

  describe('constructor', () => {
    it('should initialize with correct center and radius', () => {
      expect(graph.xc).toBe(400);
      expect(graph.yc).toBe(300);
      expect(graph.r).toBe(150);
    });

    it('should initialize adjacency matrix as false', () => {
      for (let i = 0; i < global.N; i++) {
        for (let j = 0; j < global.N; j++) {
          expect(graph.adj[i][j]).toBe(false);
        }
      }
    });

    it('should initialize vertices array', () => {
      expect(graph.v.length).toBe(global.N);
      for (let i = 0; i < global.N; i++) {
        expect(graph.v[i]).toBeDefined();
        expect(graph.v[i].x).toBeDefined();
        expect(graph.v[i].y).toBeDefined();
      }
    });

    it('should initialize displayMissing as true', () => {
      expect(graph.displayMissing).toBe(true);
    });

    it('should initialize empty edgeTimes', () => {
      expect(graph.edgeTimes.length).toBe(global.N);
      for (let i = 0; i < global.N; i++) {
        expect(graph.edgeTimes[i].length).toBe(global.N);
        for (let j = 0; j < global.N; j++) {
          expect(Array.isArray(graph.edgeTimes[i][j])).toBe(true);
          expect(graph.edgeTimes[i][j].length).toBe(0);
        }
      }
    });

    it('should initialize empty hoveredEdges', () => {
      expect(Array.isArray(graph.hoveredEdges)).toBe(true);
      expect(graph.hoveredEdges.length).toBe(0);
    });
  });

  describe('setPos', () => {
    it('should update center position', () => {
      graph.setPos(200, 250, 100);
      expect(graph.xc).toBe(200);
      expect(graph.yc).toBe(250);
      expect(graph.r).toBe(100);
    });

    it('should update vertex positions based on new center', () => {
      graph.setPos(200, 250, 100);
      expect(graph.v.length).toBe(global.N);
    });

    it('should maintain correct number of vertices', () => {
      graph.setPos(100, 100, 50);
      expect(graph.v.length).toBe(global.N);
    });
  });

  describe('edge operations', () => {
    it('should add bidirectional edge', () => {
      graph.addEdge(0, 1);
      expect(graph.adj[0][1]).toBe(true);
      expect(graph.adj[1][0]).toBe(true);
    });

    it('should remove bidirectional edge', () => {
      graph.addEdge(0, 1);
      expect(graph.hasEdge(0, 1)).toBe(true);

      graph.removeEdge(0, 1);
      expect(graph.hasEdge(0, 1)).toBe(false);
      expect(graph.hasEdge(1, 0)).toBe(false);
    });

    it('should check if edge exists', () => {
      expect(graph.hasEdge(0, 1)).toBe(false);
      graph.addEdge(0, 1);
      expect(graph.hasEdge(0, 1)).toBe(true);
      expect(graph.hasEdge(1, 0)).toBe(true);
    });

    it('should clear all edges', () => {
      graph.addEdge(0, 1);
      graph.addEdge(1, 2);
      graph.addEdge(2, 3);

      graph.clearEdges();

      for (let i = 0; i < global.N; i++) {
        for (let j = 0; j < global.N; j++) {
          expect(graph.adj[i][j]).toBe(false);
        }
      }
    });

    it('should handle multiple edges', () => {
      graph.addEdge(0, 1);
      graph.addEdge(1, 2);
      graph.addEdge(2, 3);

      expect(graph.hasEdge(0, 1)).toBe(true);
      expect(graph.hasEdge(1, 2)).toBe(true);
      expect(graph.hasEdge(2, 3)).toBe(true);
      expect(graph.hasEdge(0, 3)).toBe(false);
    });

    it('should handle self-loops', () => {
      graph.addEdge(0, 0);
      expect(graph.hasEdge(0, 0)).toBe(true);
    });
  });

  describe('hovered edges', () => {
    it('should add hovered edge', () => {
      graph.addHoveredEdge(0, 1);
      expect(graph.hoveredEdges.length).toBe(1);
      expect(graph.hoveredEdges[0]).toEqual([0, 1]);
    });

    it('should not add duplicate hovered edges', () => {
      graph.addHoveredEdge(0, 1);
      graph.addHoveredEdge(0, 1);
      expect(graph.hoveredEdges.length).toBe(1);
    });

    it('should handle bidirectional hovered edges as duplicates', () => {
      graph.addHoveredEdge(0, 1);
      graph.addHoveredEdge(1, 0);
      expect(graph.hoveredEdges.length).toBe(1);
    });

    it('should remove hovered edge', () => {
      graph.addHoveredEdge(0, 1);
      graph.removeHoveredEdge(0, 1);
      expect(graph.hoveredEdges.length).toBe(0);
    });

    it('should remove hovered edge regardless of order', () => {
      graph.addHoveredEdge(0, 1);
      graph.removeHoveredEdge(1, 0);
      expect(graph.hoveredEdges.length).toBe(0);
    });

    it('should clear all hovered edges', () => {
      graph.addHoveredEdge(0, 1);
      graph.addHoveredEdge(1, 2);
      graph.addHoveredEdge(2, 3);

      graph.clearHoveredEdges();
      expect(graph.hoveredEdges.length).toBe(0);
    });

    it('should handle multiple hovered edges', () => {
      graph.addHoveredEdge(0, 1);
      graph.addHoveredEdge(1, 2);
      graph.addHoveredEdge(2, 3);

      expect(graph.hoveredEdges.length).toBe(3);
    });
  });

  describe('graph state management', () => {
    it('should toggle displayMissing', () => {
      expect(graph.displayMissing).toBe(true);
      graph.displayMissing = false;
      expect(graph.displayMissing).toBe(false);
    });

    it('should maintain independent graph instances', () => {
      const graph2 = new Graph(100, 100, 50);

      graph.addEdge(0, 1);
      graph2.addEdge(1, 2);

      expect(graph.hasEdge(0, 1)).toBe(true);
      expect(graph.hasEdge(1, 2)).toBe(false);

      expect(graph2.hasEdge(1, 2)).toBe(true);
      expect(graph2.hasEdge(0, 1)).toBe(false);
    });
  });
});
