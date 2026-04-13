const CLICK_TRESHOLD = 10;

class Graph {
    constructor(xc, yc, r) {
        this.adj = Array.from({ length: N }, () => Array(N).fill(false));
        this.v = Array(N);

        this.setPos(xc, yc, r);

        this.xc = xc;
        this.yc = yc;
        this.r = r;

        this.displayMissing = true;
  }

    setPos(xc, yc, r) {
        this.xc = xc;
        this.yc = yc;
        this.r = r;

        for (let i = 0; i < N; i++) {
            this.v[i] = createVector(xc + r * cos(i * TWO_PI / N), yc + r * sin(i * TWO_PI / N));
        }
    }

    display() {
        fill(0);
        ellipseMode(CENTER);
        for (let i = 0; i < N; i++) {
            for (let j = i + 1; j < N; j++) {
                stroke(this.adj[i][j] ? 0 : 191);
                if (this.adj[i][j] || this.displayMissing) {
                    line(this.v[i].x, this.v[i].y, this.v[j].x, this.v[j].y);
                }
                noStroke();
            }
            circle(this.v[i].x, this.v[i].y, 0.1 * this.r);
        }
    }

    updateEdges(click) {
        let updated = false;
        for (let i = 0; i < N; i++) {
            for (let j = i + 1; j < N; j++) {
                if (distSegPoint(this.v[i], this.v[j], click) < CLICK_TRESHOLD) {
                    this.adj[i][j] = !this.adj[i][j];
                    this.adj[j][i] = this.adj[j][i];
                    updated = true;
                }
            }
        }
        return updated;
    }

    isConnected() {
        let visited = Array(N).fill(false);
        this.dfs(0, visited);
        for (let v = 0; v < N; v++) {
            if (!visited[v]) {
                return false;
            }
        }
        return true;
    }

    dfs(u, visited) {
        visited[u] = true;
        for (let v = 0; v < N; v++){
            if (this.adj[u][v] && !visited[v]){
                this.dfs(v, visited);
            }
        }
    }
}