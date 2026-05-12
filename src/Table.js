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
                        this.subsets[v][s] = new Subset();
                        this.subsets[v][s].copy(t.subsets[v][s]);
                    }
                }
            }
        }
    }

    display(offsetX = 0, offsetY = 0, zoom = 1, p = window) {
        this.displayLinks(offsetX, offsetY, zoom, p);

        for (let v = 0; v < N; v++) {
            for (let s = 0; s < S; s++) {
                if (this.subsets[v][s] != null) {
                    this.subsets[v][s].display(offsetX, offsetY, zoom, p);
                }
            }
        }
    }

    /**
     * Affiche les liens entre les subsets
     * @param {number} offsetX - L'offset en X pour l'affichage
     * @param {number} offsetY - L'offset en Y pour l'affichage
     * @param {number} zoom - Le niveau de zoom pour l'affichage
     * @param {object} p - Le contexte de dessin (par défaut, le contexte global)
     */
    displayLinks(offsetX = 0, offsetY = 0, zoom = 1, p = window) {

        const ctx = p;

        for (let v = 0; v < N; v++) {
            for (let s = 0; s < S; s++) {

                let child = this.subsets[v][s];

                if (child != null && child.parent != null) {

                    let parent = child.parent;

                    let x1 = parent.x * zoom + offsetX;
                    let y1 = parent.y * zoom + offsetY;

                    let x2 = child.x * zoom + offsetX;
                    let y2 = child.y * zoom + offsetY;

                    let size1 = parent.size * zoom;
                    let size2 = child.size * zoom;

                    ctx.stroke(child.fresh ? 'red' : 'black');
                    ctx.noFill();

                    if (child.y !== parent.y) {
                        ctx.line(
                            x1,
                            y1 - size1 / 2,
                            x2,
                            y2 + size2 / 2
                        );
                    } else {
                        let d = abs(x2 - x1) / 2;
                        let h = d / 2;

                        if (h < 1) h = 1;

                        let r = (d * d + h * h) / (2 * h);

                        let alpha = atan2(d, r - h);

                        let cx = (x1 + x2) / 2;
                        let cy = y1 - r + h + size1 / 2;

                        ctx.arc(
                            cx,
                            cy,
                            2 * r,
                            2 * r,
                            HALF_PI - alpha,
                            HALF_PI + alpha
                        );
                    }
                }
            }
        }
    }

    /**
     * Met à jour les subsets du tableau en fonction d'une snapshot donnée
     * @param {Graph} snapshot - La snapshot à partir de laquelle mettre à jour les subsets
     * @param {Table} next - Le tableau dans lequel stocker les subsets mis à jour
     */
    updateNext(snapshot, next) {
        for (let v = 0; v < N; v++) {
            for (let s = 0; s < S; s++) {
                if (this.subsets[v][s] != null) {
                    next.subsets[v][s].copy(this.subsets[v][s]);
                    next.subsets[v][s].fresh = false;
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

    /**
     * Calcule la fonction phi du tableau, qui est la somme des minimums entre le nombre de hops de chaque subset et 2N-2
     * @returns {number} - La valeur de phi
     */
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

    visitedRows() {
        let rows = Array(N).fill(false);

        for (let v = 0; v < N; v++) {
            for (let s = 0; s < S; s++) {
                let sub = this.subsets[v][s];

                if (sub && sub.hops < INF) {
                    let c = oneCount(sub.bits >> 1);
                    rows[c] = true;
                }
            }
        }

        return rows;
    }
}