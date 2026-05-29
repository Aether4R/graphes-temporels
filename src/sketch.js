// =============================================================================
// sketch.js
// Point d'entrée p5.js.
// =============================================================================

// État de simulation global

let N = 5;
let S = 1 << (N-1);

let snapshot;
let sidebarGraph;
let lattice;
let inputN;
let addBtn, backBtn, saveBtn, loadBtn, resetBtn;

// État panoramique / zoom

let zoomLevel = 1;
let panX = 0, panY = 0;
let isPanning  = false;
let lastMouseX = 0;
let lastMouseY = 0;

let dragOnEdge = false;

// État de la barre de snapshots

let snapshotP5Instances = [];
let snapshotP5;
let lastSelectedSnapshotDiv = null;

// Aides

/**
 * Retourne les dimensions réelles du canvasContainer depuis le DOM
 * @returns {{ w: number, h: number }} - La largeur et la hauteur du container
 */
function getCanvasSize() {
    const container = document.getElementById('canvasContainer');
    return { w: container.offsetWidth, h: container.offsetHeight };
}

// Croquis p5 de la barre latérale

/**
 * Sketch p5 pour le graphe temporal (sidebar, lecture seule)
 * Affiche sidebarGraph avec les étiquettes de temps sur les arêtes
 */
const sidebarSketch = (p) => {
    p.setup = function () {
        const container = document.getElementById('graphContainer');
        const canvas    = p.createCanvas(container.offsetWidth - 4, container.offsetHeight - 4);
        canvas.parent('graphContainer');

        new ResizeObserver(() => {
            if (container.offsetWidth > 0)
                p.resizeCanvas(container.offsetWidth - 4, container.offsetHeight - 4);
        }).observe(container);
    };

    p.draw = function () {
        const [r, g, b] = getSurfaceBgColor();
        p.background(r, g, b);

        if (!sidebarGraph) return;

        const cx = p.width  / 2;
        const cy = p.height / 2;
        const r2 = 0.38 * Math.min(p.width, p.height);

        if (sidebarGraph.xc !== cx || sidebarGraph.yc !== cy || sidebarGraph.r !== r2)
            sidebarGraph.setPos(cx, cy, r2);

        sidebarGraph.display(p);
    };

    p.windowResized = function () {
        const container = document.getElementById('graphContainer');
        if (container?.offsetWidth > 0)
            p.resizeCanvas(container.offsetWidth - 4, container.offsetHeight - 4);
    };
};

/**
 * Sketch p5 pour le snapshot éditable (div dédiée dans la sidebar)
 * Gère l'affichage et les interactions souris du graphe snapshot courant
 */
const snapshotSketch = (p) => {
    p.setup = function () {
        const container = document.getElementById('snapshotGraphContainer');
        const canvas    = p.createCanvas(container.offsetWidth - 4, container.offsetHeight - 4);
        canvas.parent('snapshotGraphContainer');

        new ResizeObserver(() => {
            if (container.offsetWidth > 0)
                p.resizeCanvas(container.offsetWidth - 4, container.offsetHeight - 4);
        }).observe(container);
    };

    p.draw = function () {
        const [r, g, b] = getSurfaceBgColor();
        p.background(r, g, b);

        if (!snapshot) return;

        const cx = p.width  / 2;
        const cy = p.height / 2;
        const r2 = 0.38 * Math.min(p.width, p.height);

        if (snapshot.xc !== cx || snapshot.yc !== cy || snapshot.r !== r2)
            snapshot.setPos(cx, cy, r2);

        snapshot.display(p);
    };

    p.mousePressed = function () {
        if (!snapshot) return;
        const changed = snapshot.updateEdges(p.createVector(p.mouseX, p.mouseY));
        if (changed) {
            lattice.update();
            setButtonEnabled(addBtn, snapshot.isConnected());
            display();
            updateConnexityIndicator();
        }
    };

    p.mouseMoved = function () {
        if (!snapshot) return;
        p.cursor(snapshot.hoveredEdges.length > 0 ? 'pointer' : 'default');
        if (snapshot.updateHover(p.createVector(p.mouseX, p.mouseY)))
            p.redraw();
    };

    p.windowResized = function () {
        const container = document.getElementById('snapshotGraphContainer');
        if (container?.offsetWidth > 0)
            p.resizeCanvas(container.offsetWidth - 4, container.offsetHeight - 4);
    };
};

// Configuration p5

function setup() {
    const { w, h } = getCanvasSize();
    const cnv = createCanvas(w, h);
    cnv.parent('canvasContainer');
    cnv.elt.style.width  = '100%';
    cnv.elt.style.height = '100%';

    // Instancier les deux croquis de la barre latérale
    new p5(sidebarSketch);
    snapshotP5 = new p5(snapshotSketch);

    // Spinbox N
    inputN = createInput(N, 'number');
    inputN.parent('spinboxContainer');
    inputN.attribute('min', 2);
    inputN.attribute('max', 10);
    inputN.input(updateN);

    initSimulation();

    addBtn   = document.getElementById('addBtn');
    backBtn  = document.getElementById('backBtn');
    saveBtn  = document.getElementById('saveBtn');
    loadBtn  = document.getElementById('loadBtn');
    resetBtn = document.getElementById('resetBtn');

    addBtn.onclick   = handleAdd;
    backBtn.onclick  = handleBack;
    saveBtn.onclick  = saveSession;
    loadBtn.onclick  = loadSession;
    resetBtn.onclick = handleReset;

    setButtonEnabled(addBtn,   false);
    setButtonEnabled(backBtn,  false);
    setButtonEnabled(saveBtn,  true);
    setButtonEnabled(loadBtn,  true);
    setButtonEnabled(document.getElementById('helpBtn'),     true);
    setButtonEnabled(document.getElementById('snapshotBtn'), true);
    setButtonEnabled(resetBtn, true);

    document.getElementById('helpBtn').onclick     = openHelp;
    document.getElementById('helpClose').onclick   = closeHelp;
    document.getElementById('snapshotBtn').onclick = () => {
        showInterestingGraphs();
        openSnapshotOverlay();
    };
    document.getElementById('snapshotClose').onclick = closeSnapshotOverlay;
    document.getElementById('confirmResetBtn').onclick = confirmReset;
    document.getElementById('cancelResetBtn').onclick  = closeResetOverlay;

    document.getElementById('snapshotBar').addEventListener('wheel', (e) => {
        e.stopPropagation();
        e.preventDefault();
        document.getElementById('snapshotBar').scrollLeft += e.deltaY || e.deltaX;
    }, { passive: false });

    // Double-clic sur canvas réinitialise le panoramique/zoom
    document.addEventListener('dblclick', () => {
        if (mouseY > height || mouseY < 0 || mouseX < 0 || mouseX > width) return;
        if (isModalOpen()) return;
        zoomLevel = 1;
        panX = 0;
        panY = 0;
        display();
    });

    // Masquer tous les indicateurs au démarrage
    ['zoom-indicator', 'save-indicator', 'load-indicator'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.opacity = 0;
    });

    initTheme();
    initTooltips();
    initKeyboardShortcuts();
}

// Initialisation de la simulation

/**
 * Initialise la simulation en créant le lattice, les graphes et en réinitialisant les variables
 */
function initSimulation() {
    S         = 1 << (N - 1);
    zoomLevel = 1;
    panX      = 0;
    panY      = 0;

    for (const inst of snapshotP5Instances) inst.remove();
    snapshotP5Instances = [];
    document.getElementById('snapshotBar').innerHTML =
        '<div id="emptyMessage">No snapshot available at the moment.</div>';

    lattice      = new Lattice(0, 0, 0.9 * width, 0.9 * height, 0.1 * height);
    snapshot     = new Graph(0, 0, 0);
    sidebarGraph = new Graph(0, 0, 0);

    lattice.addSnapshot(snapshot);

    display();
    updateConnexityIndicator();
    updateEmptyMessage();
}

// Gestionnaire d'entrée N

/**
 * Met à jour la valeur de N en fonction de l'entrée utilisateur,
 * avec un délai pour éviter les mises à jour trop fréquentes
 */
function updateN() {
    clearTimeout(updateN._timer);
    updateN._timer = setTimeout(() => {
        const newN = int(inputN.value());
        const min  = int(inputN.attribute('min'));
        const max  = int(inputN.attribute('max'));
        if (newN >= min && newN <= max) {
            N = newN;
            initSimulation();
            setButtonEnabled(backBtn, false);
        }
    }, 300);
}

// Panoramique / zoom (canvas principal)

/**
 * Gère le clic de souris sur le canvas principal pour initier le pan
 */
function mousePressed() {
    if (mouseY > height || mouseY < 0 || mouseX < 0 || mouseX > width) return;
    if (isModalOpen()) return;
    dragOnEdge = false;
    isPanning  = true;
    lastMouseX = mouseX;
    lastMouseY = mouseY;
}

/**
 * Gère le déplacement de la souris pour faire du pan
 */
function mouseDragged() {
    if (mouseY > height || mouseY < 0 || mouseX < 0 || mouseX > width) return;
    if (isModalOpen() || dragOnEdge) return;

    const dx = mouseX - lastMouseX;
    const dy = mouseY - lastMouseY;
    if (abs(dx) + abs(dy) < 2) return;

    panX += dx;
    panY += dy;
    lastMouseX = mouseX;
    lastMouseY = mouseY;

    cursor('grabbing');
    display();
}

/**
 * Gère la fin du déplacement de la souris pour arrêter le pan
 */
function mouseReleased() {
    isPanning = false;
    cursor('default');
}

/**
 * Gère le zoom avec la molette de la souris, en centrant le zoom sur la position de la souris
 */
function mouseWheel(event) {
    if (mouseY > height || mouseY < 0 || mouseX < 0 || mouseX > width) return;
    // Laisser la superposition snapshot gérer son propre défilement
    if (isModalOpen()) return true;

    const factor = event.delta > 0 ? 0.9 : 1.1;
    panX       = mouseX - factor * (mouseX - panX);
    panY       = mouseY - factor * (mouseY - panY);
    zoomLevel *= factor;

    updateZoomIndicator(zoomLevel);
    display();
    return false;
}

// Rendu

/**
 * Redessine le canvas principal
 */
function display() {
    const [r, g, b] = getCanvasBgColor();
    background(r, g, b);

    const offsetX = (width  - lattice.w) / 2 + panX;
    const offsetY = (height - lattice.h) / 2 + panY;

    lattice.display(offsetX, offsetY, zoomLevel);
    updateSidebarGraph();
}

/**
 * Met à jour le graphe de la sidebar en fonction des snapshots du lattice
 */
function updateSidebarGraph() {
    // Réinitialiser les données du graphe de la sidebar
    for (let i = 0; i < N; i++)
        for (let j = 0; j < N; j++)
            sidebarGraph.edgeTimes[i][j] = [];

    // Parcourir chaque snapshot confirmé (sauf le brouillon actuel) et enregistrer les temps d'apparition de chaque arête
    for (let t = 0; t < lattice.snapshots.length - 1; t++) {
        const snap = lattice.snapshots[t];
        for (let i = 0; i < N; i++) {
            for (let j = i + 1; j < N; j++) {
                if (!snap.adj[i][j]) continue;
                const time = t + 1;
                if (!sidebarGraph.edgeTimes[i][j].includes(time)) {
                    sidebarGraph.edgeTimes[i][j].push(time);
                    sidebarGraph.edgeTimes[j][i].push(time);
                }
                sidebarGraph.adj[i][j] = true;
                sidebarGraph.adj[j][i] = true;
            }
        }
    }
}

// Gestion des snapshots

/**
 * Ajoute une nouvelle snapshot à la barre de snapshots, avec un label indiquant le temps
 * @param {Graph} snap - La snapshot à afficher
 * @param {number} t - Le temps associé à la snapshot
 */
function addSnapshotSlot(snap, t) {
    const bar  = document.getElementById('snapshotBar');
    const slot = document.createElement('div');
    slot.className = 'snapshot-slot';

    const label = document.createElement('div');
    label.className   = 'snapshot-label';
    label.textContent = 'Time ' + t;
    slot.appendChild(label);
    bar.appendChild(slot);

    const inst = new p5((p) => {
        p.setup = function () {
            const c = p.createCanvas(140, 130);
            c.parent(slot);
            snap.setPos(70, 65, 45);
            p.noLoop();
        };
        p.draw = function () {
            snap.display(p);
        };
    });
    snapshotP5Instances.push(inst);

    // Faire défiler la barre vers la droite pour montrer la nouvelle snapshot
    setTimeout(() => { bar.scrollLeft = bar.scrollWidth; }, 50);
}

/**
 * Recrée toute la barre de snapshots à partir des snapshots du lattice, en cas de changement de N
 */
function rebuildSnapshotBar() {
    for (const inst of snapshotP5Instances) inst.remove();
    snapshotP5Instances = [];
    document.getElementById('snapshotBar').innerHTML =
        '<div id="emptyMessage">No snapshot available at the moment.</div>';

    const count = lattice.snapshots.length - 1;
    for (let t = 0; t < count; t++)
        addSnapshotSlot(lattice.snapshots[t], t + 1);
}

/**
 * Ajoute une nouvelle snapshot au lattice et à la barre de snapshots, et met à jour les boutons
 */
function addSnapshot() {
    snapshot = new Graph(0, 0, 0);
    lattice.addSnapshot(snapshot);

    setButtonEnabled(addBtn,  false);
    setButtonEnabled(backBtn, lattice.snapshots.length >= 2);

    addSnapshotSlot(lattice.snapshots[lattice.snapshots.length - 2], lattice.snapshots.length - 1);
    updateConnexityIndicator();
    updateEmptyMessage();
}

// Gestionnaires d'action

/**
 * Gère le clic sur le bouton "Ajouter" pour ajouter une nouvelle snapshot,
 * si le bouton n'est pas désactivé
 */
function handleAdd() {
    if (addBtn.classList.contains('disabled')) return;
    addSnapshot();
    display();
}

/**
 * Gère le clic sur le bouton "Retour" pour revenir à la snapshot précédente,
 * en affichant une confirmation, si le bouton n'est pas désactivé
 */
function handleBack() {
    if (backBtn.classList.contains('disabled')) return;

    // Supprimer la dernière snapshot du lattice et de la barre de snapshots
    lattice.tables.pop();
    lattice.tables.pop();
    lattice.snapshots.pop();
    lattice.snapshots.pop();

    addSnapshot();
    rebuildSnapshotBar();
    display();
}

/**
 * Affiche une confirmation avant de réinitialiser la simulation, pour éviter les pertes de données accidentelles
 */
function handleReset() {
    openResetOverlay();
}

/**
 * Confirme la réinitialisation de la simulation en cachant la modale et en réinitialisant les données
 */
function confirmReset() {
    closeResetOverlay();
    initSimulation();
    display();
}

/**
 * Affiche les graphes intéressants (arbres couvrants connectés de K_N qui ne créent pas de nouvelle ligne dans la table de subsets) dans la superposition snapshot, 
 * et gère les interactions pour appliquer une snapshot sélectionnée
 */
function showInterestingGraphs() {
    const container = document.getElementById('snapshotContent');
    container.innerHTML = '';

    const filtered = generateConnectedGraphs().filter(g => !createsNewRow(g));

    if (filtered.length === 0) {
        container.innerHTML = '<div id="emptySnapshotMessage">No tree found</div>';
        return;
    }

    for (const g of filtered) {
        const div = document.createElement('div');
        div.className = 'snapshot-slot';
        container.appendChild(div);

        div.addEventListener('click', () => {
            if (lastSelectedSnapshotDiv)
                lastSelectedSnapshotDiv.style.cssText = '';

            div.style.cssText = 'border: 2px solid var(--graph-border);';
            lastSelectedSnapshotDiv = div;

            // Copier les données du graphe sélectionné dans la snapshot de travail
            for (let i = 0; i < N; i++)
                for (let j = 0; j < N; j++)
                    snapshot.adj[i][j] = g.adj[i][j];

            lattice.update();
            display();
            updateConnexityIndicator();
            setButtonEnabled(addBtn, true);
        });

        new p5((p) => {
            p.setup = function () {
                const c = p.createCanvas(160, 140);
                c.parent(div);
                g.setPos(80, 70, 50);
                p.noLoop();
            };
            p.draw = function () {
                const [r, bg, b] = cssHexToRGB(
                    getComputedStyle(document.documentElement)
                        .getPropertyValue('--bg-canvas').trim(),
                    [255, 255, 255]
                );
                p.background(r, bg, b);
                g.display(p);
            };
        });
    }
}

/**
 * Génère tous les graphes connexes à N-1 arêtes
 */
function generateConnectedGraphs() {
    const graphs = [];
    const edges  = [];

    for (let i = 0; i < N; i++)
        for (let j = i + 1; j < N; j++)
            edges.push([i, j]);

    function backtrack(start, chosen) {
        if (chosen.length === N - 1) {
            const g = new Graph(0, 0, 0);
            for (const [u, v] of chosen) {
                g.adj[u][v] = true;
                g.adj[v][u] = true;
            }
            if (g.isConnected()) graphs.push(g);
            return;
        }
        for (let i = start; i < edges.length; i++) {
            chosen.push(edges[i]);
            backtrack(i + 1, chosen);
            chosen.pop();
        }
    }

    backtrack(0, []);
    return graphs;
}

/**
 * Vérifie si appliquer ce graphe visite une nouvelle rangée
 * 
 * @param {Graph} graph - Le graphe à tester
 * @returns {boolean} - true si le graphe crée une nouvelle ligne, false sinon
 */
function createsNewRow(graph) {
    const current = lattice.tables[lattice.tables.length - 1];
    const before  = current.visitedRows();
    const next    = new Table(current);

    current.updateNext(graph, next);

    const after = next.visitedRows();
    return after.some((visited, i) => !before[i] && visited);
}