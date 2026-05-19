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
        this.edgeTimes = Array.from({ length: N }, () => Array.from({ length: N }, () => []));
        
        this.hoveredEdges = []; // Liste des arêtes actuellement survolées
    }

    /**
     * Définit la position et le rayon du graphe
     * @param {number} xc - La coordonnée x du centre
     * @param {number} yc - La coordonnée y du centre
     * @param {number} r - Le rayon
     */
    setPos(xc, yc, r) {
        this.xc = xc;
        this.yc = yc;
        this.r = r;

        for (let i = 0; i < N; i++) {
            this.v[i] = createVector(xc + r * cos(i * TWO_PI / N), yc + r * sin(i * TWO_PI / N));
        }
    }

    display(p = window) {
        const colors = getThemeColors();
        p.ellipseMode(p.CENTER);
        p.textAlign(p.CENTER, p.CENTER);
        p.textSize(10);
    
        for (let i = 0; i < N; i++) {
            for (let j = i + 1; j < N; j++) {
                let isHovered = this.hoveredEdges.some(e => e[0] === i && e[1] === j);
                if (isHovered) {
                    p.stroke(140, 140, 140);
                    p.strokeWeight(1.5);
                } else {
                    p.stroke(...(this.adj[i][j] ? colors.text : colors.textLight));
                    p.strokeWeight(1);
                }

                if (this.adj[i][j] || this.displayMissing) {
                    p.line(this.v[i].x, this.v[i].y, this.v[j].x, this.v[j].y);
                
                    if (this.edgeTimes[i][j] && this.edgeTimes[i][j].length > 0) {
                        let midX = (this.v[i].x + this.v[j].x) / 2;
                        let midY = (this.v[i].y + this.v[j].y) / 2;

                        // Décalage perpendiculaire à l'arête pour éviter les superpositions
                        let dx = this.v[j].x - this.v[i].x;
                        let dy = this.v[j].y - this.v[i].y;
                        let len = Math.sqrt(dx * dx + dy * dy) || 1;
                        // Perpendiculaire normalisée, toujours côté "gauche" de l'arête i→j
                        let perpX = -dy / len;
                        let perpY =  dx / len;
                        // Si le vecteur perpendiculaire pointe vers le bas, on l'inverse
                        // pour que le label soit toujours au-dessus visuellement
                        if (perpY > 0) { perpX = -perpX; perpY = -perpY; }

                        let offset = 10;
                        let timeStr = this.edgeTimes[i][j].join(',');
                        p.fill(...colors.fresh);
                        p.noStroke();
                        p.text(timeStr, midX + perpX * offset, midY + perpY * offset);
                    }
                }
                p.noStroke();
                p.strokeWeight(1);
            }
            p.fill(...colors.text);
            p.circle(this.v[i].x, this.v[i].y, 0.1 * this.r);
        }
    }

    /**
    * Met à jour l'état de survol des arêtes
    * @param {p5.Vector} mouse - La position de la souris
    * @returns {boolean} - true si l'état a changé, false sinon
    */
    updateHover(mouse) {
        let newHovered = [];
        // Vérifier pour chaque arête si elle est survolée
        for (let i = 0; i < N; i++) {
            for (let j = i + 1; j < N; j++) {
                if (distSegPoint(this.v[i], this.v[j], mouse) < CLICK_TRESHOLD) {
                    newHovered.push([i, j]);
                }
            }
        }
        // Vérifier si la liste des arêtes survolées a changé
        let sameLength = newHovered.length === this.hoveredEdges.length;
        let sameEdges = sameLength && newHovered.every((e, k) => e[0] === this.hoveredEdges[k][0] && e[1] === this.hoveredEdges[k][1]);
        let changed = !sameLength || !sameEdges;
        this.hoveredEdges = newHovered;
        return changed;
    }

    /**
     * Met à jour les arêtes du graphe
     * @param {p5.Vector} click - La position du clic
     * @returns {boolean} - true si le graphe a été mis à jour, false sinon
     */
    updateEdges(click) {
        let updated = false;
        for (let i = 0; i < N; i++) {
            for (let j = i + 1; j < N; j++) {
                if (distSegPoint(this.v[i], this.v[j], click) < CLICK_TRESHOLD) {
                    this.adj[i][j] = !this.adj[i][j];
                    this.adj[j][i] = this.adj[i][j];
                    updated = true;
                }
            }
        }
        return updated;
    }

    /**
     * Vérifie si le graphe est connexe
     * @returns {boolean} - true si le graphe est connexe, false sinon
     */
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

    /**
     * Effectue une recherche en profondeur à partir d'un sommet donné
     * @param {number} u - Le sommet de départ
     * @param {boolean[]} visited - Le tableau des sommets visités
     */
    dfs(u, visited) {
        visited[u] = true;
        for (let v = 0; v < N; v++){
            if (this.adj[u][v] && !visited[v]){
                this.dfs(v, visited);
            }
        }
    }
}