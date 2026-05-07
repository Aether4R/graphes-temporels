let N = 5;
let S = 1 << (N - 1);

let snapshot;
let lattice;
let sidebarGraph;
let addBtn, backBtn, saveBtn, loadBtn;
let inputN;
let zoomLevel = 1;
let panX = 0, panY = 0;
let isPanning = false;
let lastMouseX = 0;
let lastMouseY = 0;
let dragOnEdge = false;

let snapshotP5Instances = [];
let snapshotP5;

/**
 * Retourne les dimensions réelles du canvasContainer depuis le DOM
 * @returns {{ w: number, h: number }} - La largeur et la hauteur du container
 */
function getCanvasSize() {
    const container = document.getElementById('canvasContainer');
    return { w: container.offsetWidth, h: container.offsetHeight };
}

/**
 * Sketch p5 pour le graphe temporal (sidebar, lecture seule)
 * Affiche sidebarGraph avec les étiquettes de temps sur les arêtes
 */
let sidebarSketch = (p) => {
    p.setup = function () {
        let container = document.getElementById('graphContainer');
        let canvas = p.createCanvas(container.offsetWidth - 4, container.offsetHeight - 4);
        canvas.parent('graphContainer');

        new ResizeObserver(() => {
            if (container.offsetWidth > 0) {
                p.resizeCanvas(container.offsetWidth - 4, container.offsetHeight - 4);
            }
        }).observe(container);

    };

    p.draw = function () {
        p.background(255);
        if (sidebarGraph) {
            let cx = p.width / 2;
            let cy = p.height / 2;
            let r = 0.38 * Math.min(p.width, p.height);
            if (sidebarGraph.xc !== cx || sidebarGraph.yc !== cy || sidebarGraph.r !== r) {
                sidebarGraph.setPos(cx, cy, r);
            }
            sidebarGraph.display(p);
        }
    };

    p.windowResized = function () {
        let container = document.getElementById('graphContainer');
        if (container && container.offsetWidth > 0) {
            p.resizeCanvas(container.offsetWidth - 4, container.offsetHeight - 4);
        }
    };
};

/**
 * Sketch p5 pour le snapshot éditable (div dédiée dans la sidebar)
 * Gère l'affichage et les interactions souris du graphe snapshot courant
 */
let snapshotSketch = (p) => {
    p.setup = function () {
        let container = document.getElementById('snapshotGraphContainer');
        let canvas = p.createCanvas(container.offsetWidth - 4, container.offsetHeight - 4);
        canvas.parent('snapshotGraphContainer');

        new ResizeObserver(() => {
            if (container.offsetWidth > 0) {
                p.resizeCanvas(container.offsetWidth - 4, container.offsetHeight - 4);
            }
        }).observe(container);
    };

    p.draw = function () {
        p.background(255);
        if (snapshot) {
            let cx = p.width / 2;
            let cy = p.height / 2;
            let r = 0.38 * Math.min(p.width, p.height);
            if (snapshot.xc !== cx || snapshot.yc !== cy || snapshot.r !== r) {
                snapshot.setPos(cx, cy, r);
            }
            snapshot.display(p);
        }
    };

    p.mousePressed = function () {
        if (!snapshot) return;
        let changed = snapshot.updateEdges(p.createVector(p.mouseX, p.mouseY));
        if (changed) {
            lattice.update();
            lastDrawnTableIndex = -1;
            if (snapshot.isConnected()) {
                addBtn.classList.remove("disabled");
                addBtn.classList.add("enabled");
            } else {
                addBtn.classList.add("disabled");
                addBtn.classList.remove("enabled");
            }
            display();
            updateConnexityIndicator();
        }
    };

    p.mouseMoved = function () {
        if (!snapshot) return;
        if (snapshot.hoveredEdges.length > 0) p.cursor('pointer');
        else p.cursor('default');
        if (snapshot.updateHover(p.createVector(p.mouseX, p.mouseY))) {
            p.redraw();
        }
    };

    p.windowResized = function () {
        let container = document.getElementById('snapshotGraphContainer');
        if (container && container.offsetWidth > 0) {
            p.resizeCanvas(container.offsetWidth - 4, container.offsetHeight - 4);
        }
    };
};

/**
 * Centre le snapshot dans son canvas dédié (snapshotSketch)
 * @param {p5} p - L'instance p5 du sketch snapshot
 */
function repositionSnapshot(p) {
    if (!snapshot) return;
    let cx = p.width / 2;
    let cy = p.height / 2;
    let r = 0.38 * Math.min(p.width, p.height);
    snapshot.setPos(cx, cy, r);
}

function setup() {
    const { w, h } = getCanvasSize();
    let cnv = createCanvas(w, h);
    cnv.parent('canvasContainer');

    cnv.elt.style.width = '100%';
    cnv.elt.style.height = '100%';

    new p5(sidebarSketch);
    snapshotP5 = new p5(snapshotSketch);

    inputN = createInput(N, 'number');
    inputN.parent('spinboxContainer');
    inputN.attribute('min', 2);
    inputN.attribute('max', 10);
    inputN.input(updateN);

    initSimulation();

    addBtn  = document.getElementById("addBtn");
    backBtn = document.getElementById("backBtn");
    saveBtn = document.getElementById("saveBtn");
    loadBtn = document.getElementById("loadBtn");

    addBtn.onclick  = handleAdd;
    backBtn.onclick = handleBack;
    saveBtn.onclick = saveSession;
    loadBtn.onclick = loadSession;

    addBtn.classList.add("disabled");
    backBtn.classList.add("disabled");
    saveBtn.classList.add("enabled");
    loadBtn.classList.add("enabled");
    helpBtn.classList.add("enabled");

    document.getElementById('btnConfirm').onclick = () => {
        lattice.tables.pop();
        lattice.tables.pop();
        lattice.snapshots.pop();
        lattice.snapshots.pop();
        addSnapshot();
        rebuildSnapshotBar();
        display();
        document.getElementById('modalOverlay').classList.add('hidden');
        updateEmptyMessage();
    };

    document.getElementById('btnCancel').onclick = () => {
        document.getElementById('modalOverlay').classList.add('hidden');
    };

    document.getElementById('helpBtn').onclick = () => {
        document.getElementById('helpOverlay').classList.remove('hidden');
    };

    document.getElementById('helpClose').onclick = () => {
        document.getElementById('helpOverlay').classList.add('hidden');
    };

    document.getElementById('snapshotBar').addEventListener('wheel', (e) => {
        e.stopPropagation();
        e.preventDefault();
        document.getElementById('snapshotBar').scrollLeft += e.deltaY || e.deltaX;
    }, { passive: false });

    ['zoom-indicator', 'save-indicator', 'load-indicator'].forEach(id => {
        let el = document.getElementById(id);
        if (el) el.style.opacity = 0;
    });
}

document.querySelectorAll('.sidebar button[data-tooltip]').forEach(btn => {
    btn.addEventListener('mouseenter', () => {
        const rect = btn.getBoundingClientRect();
        const sidebarWidth = document.querySelector('.sidebar').offsetWidth;
        
        // Crée un tooltip dans le DOM au lieu du ::after
        const tip = document.createElement('div');
        tip.id = 'dynamic-tooltip';
        tip.textContent = btn.dataset.tooltip;
        document.body.appendChild(tip);

        // Positionne verticalement en évitant le débordement
        let top = rect.top + rect.height / 2;
        tip.style.cssText = `
            position: fixed;
            left: ${sidebarWidth + 10}px;
            background: rgba(0,0,0,0.8);
            color: white;
            padding: 6px 10px;
            border-radius: 6px;
            font-size: 13px;
            white-space: nowrap;
            z-index: 1000;
            pointer-events: none;
            transform: translateY(-50%);
            top: ${top}px;
        `;

        // Correction si ça dépasse en bas
        const tipRect = tip.getBoundingClientRect();
        if (tipRect.bottom > window.innerHeight - 8) {
            tip.style.top = 'auto';
            tip.style.bottom = '8px';
            tip.style.transform = 'none';
        }
    });

    btn.addEventListener('mouseleave', () => {
        document.getElementById('dynamic-tooltip')?.remove();
    });
});

/**
 * Redimensionne le canvas et les éléments associés lorsque la fenêtre est redimensionnée
 */
function windowResized() {
    const { w, h } = getCanvasSize();

    resizeCanvas(w, h);

    lattice.w = 0.9 * w;
    lattice.h = 0.9 * h;
    lattice.x0 = 0;
    lattice.y0 = 0;

    rebuildLatticePositions();

    panX = 0;
    panY = 0;
    zoomLevel = 1;

    display();
}

function rebuildLatticePositions() {
    let subsetsTmp = Array(N).fill(null).map(() => []);
    for (let c = 0; c < N; c++) subsetsTmp[c].push(null);
 
    for (let s = 1; s < (1 << N); s += 2) {
        let c = oneCount(s >> 1);
        for (let i = 0; i < N; i++) {
            if (((s >> i) & 1) === 1) {
                subsetsTmp[c].push(new Subset(s, i));
            }
        }
        subsetsTmp[c].push(null);
    }
 
    let maxPerRow = 0;
    for (let l of subsetsTmp) {
        maxPerRow = max(maxPerRow, l.length);
    }
 
    let size = min(lattice.w / maxPerRow, 100);
    let yGap = (lattice.h - N * size) / (N + 1);
 
    let y = lattice.y0 + yGap + size / 2;
 
    let posMap = {};
    for (let c = N - 1; c >= 0; c--) {
        let row = subsetsTmp[c];
        let n = (row.length - 1) / (c + 2);
        let xGap = (lattice.w - n * (c + 1) * size) / (n + 1);
        let x = size / 2;
 
        for (let sub of row) {
            if (sub !== null) {
                sub.x = lattice.x0 + x;
                sub.y = y;
                sub.size = size;
                posMap[sub.current + "_" + (sub.bits >> 1)] = { x: sub.x, y: sub.y, size };
                x += size;
            } else {
                x += xGap;
            }
        }
        y += yGap + size;
    }
 
    for (let table of lattice.tables) {
        for (let v = 0; v < N; v++) {
            for (let s = 0; s < S; s++) {
                let sub = table.subsets[v][s];
                if (sub !== null) {
                    let key = sub.current + "_" + (sub.bits >> 1);
                    if (posMap[key]) {
                        sub.x = posMap[key].x;
                        sub.y = posMap[key].y;
                        sub.size = posMap[key].size;
                    }
                }
            }
        }
    }
}

/**
 * Initialise la simulation en créant le lattice, les graphes et en réinitialisant les variables
 */
function initSimulation() {
    S = 1 << (N - 1);
    zoomLevel = 1;
    panX = 0;
    panY = 0;

    for (let inst of snapshotP5Instances) inst.remove();
    snapshotP5Instances = [];
    document.getElementById('snapshotBar').innerHTML = '<div id="emptyMessage">Aucune snapshot pour le moment.</div>';

    lattice = new Lattice(0, 0, 0.9 * width, 0.9 * height, 0.1 * height);

    snapshot = new Graph(0, 0, 0);
    lattice.addSnapshot(snapshot);

    sidebarGraph = new Graph(0, 0, 0);

    display();
    updateConnexityIndicator();
    updateEmptyMessage();
}

/**
 * Met à jour la valeur de N en fonction de l'entrée utilisateur,
 * avec un délai pour éviter les mises à jour trop fréquentes
 */
function updateN() {
    clearTimeout(updateN._timer);
    updateN._timer = setTimeout(() => {
        let newN = int(inputN.value());
        if (newN >= int(inputN.attribute('min')) && newN <= int(inputN.attribute('max'))) {
            N = newN;
            initSimulation();
        }
    }, 300);
}

/**
 * Gère le clic de souris sur le canvas principal pour initier le pan
 */
function mousePressed() {
    if (mouseY > height || mouseY < 0 || mouseX < 0 || mouseX > width) return;
    dragOnEdge = false;
    isPanning = true;
    lastMouseX = mouseX;
    lastMouseY = mouseY;
}

/**
 * Gère le déplacement de la souris pour faire du pan
 */
function mouseDragged() {
    if (mouseY > height || mouseY < 0 || mouseX < 0 || mouseX > width) return;
    if (!document.getElementById('modalOverlay').classList.contains('hidden')) return;
    if (dragOnEdge) return;

    let dx = mouseX - lastMouseX;
    let dy = mouseY - lastMouseY;
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

    let zoomFactor = event.delta > 0 ? 0.9 : 1.1;
    panX = mouseX - zoomFactor * (mouseX - panX);
    panY = mouseY - zoomFactor * (mouseY - panY);
    zoomLevel *= zoomFactor;

    let el = document.getElementById('zoom-indicator');
    if (el) {
        el.innerText = Math.floor(zoomLevel * 100) + "%";
        el.style.opacity = 1;
        clearTimeout(mouseWheel._timer);
        mouseWheel._timer = setTimeout(() => { el.style.opacity = 0; }, 1500);
    }

    display();
    return false;
}

/**
 * Gère le déplacement de la souris sur le canvas principal
 */
function mouseMoved() {
    if (mouseY > height || mouseY < 0 || mouseX < 0 || mouseX > width) return;
    // Hover géré par snapshotSketch pour le snapshot
}

/**
 * Redessine le canvas principal : lattice sur le buffer, puis affichage avec pan/zoom
 */
function display() {
    background(255);

    let offsetX = (width - lattice.w) / 2 + panX;
    let offsetY = (height - lattice.h) / 2 + panY;

    lattice.display(offsetX, offsetY, zoomLevel);

    updateSidebarGraph();
}

/**
 * Met à jour le graphe de la sidebar en fonction des snapshots du lattice
 */
function updateSidebarGraph() {
    for (let i = 0; i < N; i++) {
        for (let j = 0; j < N; j++) {
            sidebarGraph.edgeTimes[i][j] = [];
        }
    }

    for (let t = 0; t < lattice.snapshots.length - 1; t++) {
        let snap = lattice.snapshots[t];
        for (let i = 0; i < N; i++) {
            for (let j = i + 1; j < N; j++) {
                if (snap.adj[i][j]) {
                    sidebarGraph.edgeTimes[i][j].push(t + 1);
                    sidebarGraph.edgeTimes[j][i].push(t + 1);
                    sidebarGraph.adj[i][j] = true;
                    sidebarGraph.adj[j][i] = true;
                }
            }
        }
    }
}

/**
 * Ajoute une nouvelle snapshot à la barre de snapshots, avec un label indiquant le temps
 * @param {Graph} snap - La snapshot à afficher
 * @param {number} t - Le temps associé à la snapshot
 */
function addSnapshotSlot(snap, t) {
    const bar = document.getElementById('snapshotBar');

    const slot = document.createElement('div');
    slot.className = 'snapshot-slot';

    const label = document.createElement('div');
    label.className = 'snapshot-label';
    label.textContent = 'Temps ' + t;
    slot.appendChild(label);
    bar.appendChild(slot);

    let inst = new p5((p) => {
        p.setup = function () {
            let c = p.createCanvas(140, 130);
            c.parent(slot);
            snap.setPos(70, 65, 45);
            p.noLoop();
        };
        p.draw = function () {
            p.background(255);
            snap.display(p);
        };
    });
    snapshotP5Instances.push(inst);

    setTimeout(() => { bar.scrollLeft = bar.scrollWidth; }, 50);
}

/**
 * Recrée toute la barre de snapshots à partir des snapshots du lattice, en cas de changement de N
 */
function rebuildSnapshotBar() {
    for (let inst of snapshotP5Instances) inst.remove();
    snapshotP5Instances = [];
    document.getElementById('snapshotBar').innerHTML = '<div id="emptyMessage">Aucune snapshot pour le moment.</div>';

    let count = lattice.snapshots.length - 1;
    for (let t = 0; t < count; t++) {
        addSnapshotSlot(lattice.snapshots[t], t + 1);
    }
}

/**
 * Ajoute une nouvelle snapshot au lattice et à la barre de snapshots, et met à jour les boutons
 */
function addSnapshot() {
    snapshot = new Graph(0, 0, 0);
    lattice.addSnapshot(snapshot);

    addBtn.classList.add("disabled");
    addBtn.classList.remove("enabled");

    if (lattice.snapshots.length < 2) {
        backBtn.classList.add("disabled");
        backBtn.classList.remove("enabled");
    } else {
        backBtn.classList.remove("disabled");
        backBtn.classList.add("enabled");
    }

    addSnapshotSlot(lattice.snapshots[lattice.snapshots.length - 2], lattice.snapshots.length - 1);
    updateConnexityIndicator();
    updateEmptyMessage();
}

/**
 * Met à jour le message affiché dans la barre de snapshots lorsque celle-ci est vide
 */
function updateEmptyMessage() {
    const msg = document.getElementById('emptyMessage');
    if (msg) msg.style.display = lattice.snapshots.length <= 1 ? 'flex' : 'none';
}

/**
 * Gère le clic sur le bouton "Ajouter" pour ajouter une nouvelle snapshot,
 * si le bouton n'est pas désactivé
 */
function handleAdd() {
    if (!addBtn.classList.contains("disabled")) {
        addSnapshot();
        display();
    }
}

/**
 * Gère le clic sur le bouton "Retour" pour revenir à la snapshot précédente,
 * en affichant une confirmation, si le bouton n'est pas désactivé
 */
function handleBack() {
    if (!backBtn.classList.contains("disabled")) {
        document.getElementById('modalOverlay').classList.remove('hidden');
    }
}

/**
 * Sauvegarde la session actuelle (N et les snapshots) dans un fichier JSON téléchargeable
 */
function saveSession() {
    const data = {
        N,
        snapshots: lattice.snapshots.slice(0, -1).map(snap => snap.adj)
    };
    saveJSON(data, 'session.json');
    let el = document.getElementById('save-indicator');
    if (el) {
        el.style.opacity = 1;
        clearTimeout(saveSession._timer);
        saveSession._timer = setTimeout(() => { el.style.opacity = 0; }, 1500);
    }
}

/**
 * Ouvre un dialogue de sélection de fichier pour charger une session à partir d'un fichier JSON,
 * puis applique les données chargées à la simulation
 */
function loadSession() {
    const fileInput = document.getElementById('fileInput');
    fileInput.click();

    fileInput.onchange = (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                if (!isValid(data)) return;
                applySession(data);
            } catch (err) {
                alert("Erreur lors du chargement du fichier : " + err.message);
            }
        };
        reader.readAsText(file);

        let el = document.getElementById('load-indicator');
        if (el) {
            el.style.opacity = 1;
            clearTimeout(loadSession._timer);
            loadSession._timer = setTimeout(() => { el.style.opacity = 0; }, 1500);
        }
    };
}

/**
 * Applique les données d'une session chargée à la simulation,
 * en réinitialisant le lattice et en recréant les snapshots
 * @param {Object} data - Les données de la session, contenant N et les snapshots
 */
function applySession(data) {
    if (data.N && data.snapshots) {
        N = data.N;
        inputN.value(data.N);
        S = 1 << (N - 1);

        for (let inst of snapshotP5Instances) inst.remove();
        snapshotP5Instances = [];
        document.getElementById('snapshotBar').innerHTML = '<div id="emptyMessage">Aucune snapshot pour le moment.</div>';

        lattice = new Lattice(0, 0, 0.9 * width, 0.9 * height, 0.1 * height);

        for (let adj of data.snapshots) {
            let snap = new Graph(0, 0, 0);
            snap.adj = adj;
            lattice.addSnapshot(snap);
            addSnapshotSlot(snap, lattice.snapshots.length);
        }

        snapshot = new Graph(0, 0, 0);
        lattice.addSnapshot(snapshot);

        sidebarGraph = new Graph(0, 0, 0);
        updateSidebarGraph();

        display();
        updateConnexityIndicator();
        updateEmptyMessage();
    }
}

/**
 * Teste la validité d'une session chargée en vérifiant que les snapshots ont une structure correcte
 * @param {Object} data - Les données de la session à tester
 * @returns {boolean} - true si la session est valide, false sinon
 */
function isValid(data) {
    const { N, snapshots } = data;
    if (typeof N !== 'number' || N < 2 || N > inputN.attribute('max')) {
        alert("Le champ N doit être un nombre supérieur ou égal à 2.");
        return false;
    }
    if (!Array.isArray(snapshots)) {
        alert("Le champ snapshots doit être un tableau.");
        return false;
    }
    if (snapshots.every(snapshot =>
        snapshot.length === N &&
        snapshot.every(row =>
            row.length === N &&
            row.every(cell => typeof cell === 'boolean')
        ))) {
        return true;
    } else {
        alert("Chaque snapshot doit être une matrice carrée de taille N x N contenant des valeurs booléennes.");
        return false;
    }
}

/**
 * Met à jour l'indicateur de connexité dans la sidebar en fonction de l'état de la snapshot actuelle
 */
function updateConnexityIndicator() {
    const dot  = document.getElementById('connexityDot');
    const text = document.getElementById('connexityText');
    if (snapshot.isConnected()) {
        dot.className = 'connected';
        text.textContent = 'Connexe';
    } else {
        dot.className = 'disconnected';
        text.textContent = 'Non connexe';
    }
}

document.addEventListener("keydown", (event) => {
    if (event.ctrlKey && event.shiftKey && event.key.toLowerCase() === "a") {
        event.preventDefault();
        handleAdd();
    }
    if (event.ctrlKey && !event.shiftKey && event.key.toLowerCase() === "z") {
        event.preventDefault();
        handleBack();
    }
    if (event.ctrlKey && event.shiftKey && event.key.toLowerCase() === "s") {
        event.preventDefault();
        saveSession();
    }
    if (event.ctrlKey && event.shiftKey && event.key.toLowerCase() === "o") {
        event.preventDefault();
        loadSession();
    }
    if (event.key === "Escape") {
        if (!document.getElementById('modalOverlay').classList.contains('hidden')) {
            document.getElementById('modalOverlay').classList.add('hidden');
        }
    }
});

document.addEventListener("dblclick", (event) => {
    if (mouseY > height || mouseY < 0 || mouseX < 0 || mouseX > width) return;
    zoomLevel = 1;
    panX = 0;
    panY = 0;
    display();
});