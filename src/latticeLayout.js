// =============================================================================
// latticeLayout.js
// Calcule et applique les positions (x, y, size) pour tous les objets Subset
// chaque fois que la taille du canvas change.
// =============================================================================

/**
 * Recalcule les positions en pixels pour chaque Subset dans chaque Table du
 * treillis courant afin qu'ils remplissent les nouvelles dimensions du canvas.
 */
function rebuildLatticePositions() {
    // Étape 1 – construire une disposition temporaire avec des instances Subset factices
    const subsetsTmp = Array.from({ length: N }, () => [null]);

    for (let s = 1; s < (1 << N); s += 2) {
        const c = oneCount(s >> 1);
        for (let i = 0; i < N; i++) {
            if (((s >> i) & 1) === 1) {
                subsetsTmp[c].push(new Subset(s, i));
            }
        }
        subsetsTmp[c].push(null);
    }

    // Étape 2 – calculer la taille de la cellule et l'espacement vertical
    let maxPerRow = 0;
    for (const row of subsetsTmp) maxPerRow = max(maxPerRow, row.length);

    const size  = min(lattice.w / maxPerRow, 100);
    const yGap  = (lattice.h - N * size) / (N + 1);

    // Étape 3 – assigner (x, y) à chaque Subset factice et construire une table de correspondance
    const posMap = {};
    let y = lattice.y0 + yGap + size / 2;

    for (let c = N - 1; c >= 0; c--) {
        const row  = subsetsTmp[c];
        const n    = (row.length - 1) / (c + 2);
        const xGap = (lattice.w - n * (c + 1) * size) / (n + 1);
        let x = lattice.x0 + size / 2;

        for (const sub of row) {
            if (sub !== null) {
                sub.x    = x;
                sub.y    = y;
                sub.size = size;
                posMap[`${sub.current}_${sub.bits >> 1}`] = { x: sub.x, y: sub.y, size };
                x += size;
            } else {
                x += xGap;
            }
        }
        y += yGap + size;
    }

    // Étape 4 – appliquer les positions à chaque Subset actif dans chaque Table
    for (const table of lattice.tables) {
        for (let v = 0; v < N; v++) {
            for (let s = 0; s < S; s++) {
                const sub = table.subsets[v][s];
                if (sub === null) continue;
                const pos = posMap[`${sub.current}_${sub.bits >> 1}`];
                if (pos) {
                    sub.x    = pos.x;
                    sub.y    = pos.y;
                    sub.size = pos.size;
                }
            }
        }
    }
}

/**
 * Redimensionne le canvas et les éléments associés lorsque la fenêtre est redimensionnée
 */
function windowResized() {
    const { w, h } = getCanvasSize();

    resizeCanvas(w, h);

    lattice.w  = 0.9 * w;
    lattice.h  = 0.9 * h;
    lattice.x0 = 0;
    lattice.y0 = 0;

    rebuildLatticePositions();

    panX      = 0;
    panY      = 0;
    zoomLevel = 1;

    display();
}