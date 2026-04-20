class Table {
    constructor(t) {
        this.subsets = [];
        
        for (let v = 0; v < N; v++) {
            this.subsets[v] = [];
            for (let s = 0; s < S; s++) {
                this.subsets[v][s] = null;
            }
        }
        
        if (t) {
            for (let v = 0; v < N; v++) {
                for (let s = 0; s < S; s++) {
                    if (t.subsets[v][s] != null) {
                        this.subsets[v][s] = new Subset(t.subsets[v][s]);
                    }
                }
            }
        }
    }

    display(p = null) {
        this.displayLinks(p);
        for (let v = 0; v < N; v++) {
            for (let s = 0; s < S; s++) {
                if (this.subsets[v][s] != null) {
                    this.subsets[v][s].display(p);
                }
            }
        }
    }

    displayLinks(p = null) {
        const ctx = p || window;
        for (let v = 0; v < N; v++){
            for (let s = 0; s < S; s++){
                let child = this.subsets[v][s];
                if (child != null){
                    ctx.stroke(child.fresh ? ctx.color(255, 0, 0) : ctx.color(128));
                    let parent = child.parent;
                    if (parent != null){
                        if (child.y != parent.y) {
                            ctx.line(parent.x, parent.y - parent.size / 2, child.x, child.y + child.size / 2);
                        } else {
                            let d = abs(parent.x - child.x) / 2;
                            let h = d / 2;
                            let r = (d * d + h * h) / 2 / h;
                            let alpha = atan2(d, r - h);
                            ctx.ellipseMode(RADIUS);
                            ctx.noFill();
                            ctx.arc((parent.x + child.x) / 2, child.y - r + h + child.size / 2, r, r, HALF_PI - alpha, HALF_PI + alpha);
                        }
                    }
                }
            }
        }
    }

    updateNext(snapshot, next) {
        for (let v = 0; v < N; v++) {
            for (let s = 0; s < S; s++) {
                if (this.subsets[v][s] != null) {
                    next.subsets[v][s].copy(this.subsets[v][s]);
                }
            }
        }

        for (let u = 0; u < N; u++) {
            for (let s = 0; s < S; s++) {
                if (this.subsets[u][s] != null) {
                    let cur = this.subsets[u][s].hops;
                    if (cur < INF){
                        for (let v = 0; v < N; v++) {
                            if (snapshot.adj[u][v]) {
                                let nextS = ((s << 1) | (1 << v)) >> 1;
                                if (next.subsets[v][nextS].hops > cur + 1) {
                                    next.subsets[v][nextS].hops = cur + 1;
                                    next.subsets[v][nextS].parent = this.subsets[u][s];
                                    next.subsets[v][nextS].fresh = true;
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    phi() {
        let sum = 0;
        for (let v = 0; v < N; v++) {
            for (let s = 0; s < S; s++) {
                if (this.subsets[v][s] != null) {
                    sum += min(this.subsets[v][s].hops, 2 * N - 2);
                }
            }
        }
        return sum;
    }
}