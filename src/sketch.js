let N = 5;
let S = 1 << (N - 1);

let snapshot;
let lattice;
let sidebarGraph;
let addBtn, backBtn;
let inputN;
let zoomLevel = 1;
let panX = 0, panY = 0;
let isPanning = false;
let lastMouseX = 0;
let lastMouseY = 0;
let latticeBuffer;
let lastDrawnTableIndex = -1;

let snapshotP5Instances = [];

let sidebarSketch = (p) => {
    p.setup = function() {
        let container = document.getElementById('graphContainer');
        let canvas = p.createCanvas(container.offsetWidth - 4, container.offsetHeight - 4);
        canvas.parent('graphContainer');
    };

    p.draw = function() {
        p.background(255);
        if (sidebarGraph) {
            sidebarGraph.display(p);
        }
    };

    p.windowResized = function() {
        let container = document.getElementById('graphContainer');
        if (container && container.offsetWidth > 0) {
            p.resizeCanvas(container.offsetWidth - 4, container.offsetHeight - 4);
        }
    };
};

function setup() {
    let cnv = createCanvas(windowWidth - 190, windowHeight - 170);
    cnv.parent('canvasContainer');

    new p5(sidebarSketch);

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

    // La snapshotBar gère son propre scroll, indépendamment de p5
    document.getElementById('snapshotBar').addEventListener('wheel', (e) => {
        e.stopPropagation();
        e.preventDefault();
        document.getElementById('snapshotBar').scrollLeft += e.deltaY || e.deltaX;
    }, { passive: false });

    let el = document.getElementById('zoom-indicator');
    if (el) {
        el.style.opacity = 0;
    }

    let saveEl = document.getElementById('save-indicator');
    if (saveEl) {
        saveEl.style.opacity = 0;
    }

    let loadEl = document.getElementById('load-indicator');
    if (loadEl) {
        loadEl.style.opacity = 0;
    }
}

/**
 * Redimensionne le canvas et les éléments associés lorsque la fenêtre est redimensionnée
 */
function windowResized() {
    resizeCanvas(windowWidth - 190, windowHeight - 170);

    lattice.w = 0.9 * width;
    lattice.h = 0.9 * height;
    // Redimensionner le buffer
    latticeBuffer = createGraphics(lattice.w, lattice.h);
    lastDrawnTableIndex = -1; // Forcer le redessinage

    let d = 0.05 * width;
    snapshot.setPos(width - d, 75, 0.9 * d);
    sidebarGraph.setPos(75, 75, 0.8 * d);

    display();
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
    document.getElementById('snapshotBar').innerHTML = '';
    document.getElementById('snapshotBar').innerHTML = '<div id="emptyMessage">Aucune snapshot pour le moment.</div>';

    lattice = new Lattice(0, 0, 0.9 * width, 0.9 * height, 0.1 * height);
    // Créer le buffer pour cacher le lattice
    latticeBuffer = createGraphics(lattice.w, lattice.h);
    lastDrawnTableIndex = -1;
    let d = 0.05 * width;

    snapshot = new Graph(width - d, 75, 0.9 * d);
    lattice.addSnapshot(snapshot);

    sidebarGraph = new Graph(75, 75, 0.8 * d);

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
 * Gère le clic de souris pour ajouter/supprimer des arêtes ou pour faire du pan
 */
function mousePressed() {
    // Vérifier que la souris est sur le canvas principal
    if (mouseY > height || mouseY < 0 || mouseX < 0 || mouseX > width) {
        return;
    }

    isPanning = true;
    lastMouseX = mouseX;
    lastMouseY = mouseY;

    if (snapshot.updateEdges(createVector(mouseX, mouseY))) {
        lattice.update();

        if (snapshot.isConnected()) {
            addBtn.classList.remove("disabled");
            addBtn.classList.add("enabled");
        } else {
            addBtn.classList.add("disabled");
            addBtn.classList.remove("enabled");
        }
    }

    display();
    updateConnexityIndicator();
}

/**
 * Gère le déplacement de la souris pour faire du pan
 */
function mouseDragged() {
    // Vérifier que la souris est sur le canvas principal
    if (mouseY > height || mouseY < 0 || mouseX < 0 || mouseX > width) {
        return;
    }

    // Vérifier que la modale n'est pas ouverte
    if (!document.getElementById('modalOverlay').classList.contains('hidden')) {
        return;
    }

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
}

/**
 * Gère le zoom avec la molette de la souris, en centrant le zoom sur la position de la souris
 */
function mouseWheel(event) {
    if (mouseY > height || mouseY < 0 || mouseX < 0 || mouseX > width) {
        return;
    }

    let zoomFactor = event.delta > 0 ? 0.9 : 1.1;
    panX = mouseX - zoomFactor * (mouseX - panX);
    panY = mouseY - zoomFactor * (mouseY - panY);
    zoomLevel *= zoomFactor;

    let el = document.getElementById('zoom-indicator');
    if (el) {
        el.innerText = Math.floor(zoomLevel * 100) + "%";
        el.style.opacity = 1;

        clearTimeout(mouseWheel._timer);
        mouseWheel._timer = setTimeout(() => {
            el.style.opacity = 0;
        }, 1500);
    }

    display();
    return false; // bloquer le scroll page seulement dans le canvas
}

/**
 * Gère le déplacement de la souris pour mettre en évidence les arêtes survolées
 */
function mouseMoved() {
    if (mouseY > height || mouseY < 0 || mouseX < 0 || mouseX > width) {
        return;
    }

    if (snapshot.hoveredEdges.length > 0) {
        cursor('pointer');
    } else {
        cursor('default');
    }

    if (snapshot.updateHover(createVector(mouseX, mouseY))) {
        display();
    }
}

function display() {
    // Redessiner le lattice sur le buffer seulement si la table active a changé
    let currentTableIndex = lattice.tables.length - 1;
    if (currentTableIndex !== lastDrawnTableIndex) {
        latticeBuffer.background(255);
        latticeBuffer.push();
        // Appeler la méthode display du lattice sur le buffer
        lattice.display(latticeBuffer);
        latticeBuffer.pop();
        lastDrawnTableIndex = currentTableIndex;
    }

    // Afficher le canvas principal
    background(255);
    push();
    translate(panX, panY);
    scale(zoomLevel);
    image(latticeBuffer, lattice.x0, lattice.y0);
    pop();

    snapshot.display();
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
        p.setup = function() {
            let c = p.createCanvas(140, 130);
            c.parent(slot);
            snap.setPos(70, 65, 45);
            p.noLoop();
        };
        p.draw = function() {
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
    document.getElementById('snapshotBar').innerHTML = '';
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
    let d = 0.05 * width;

    snapshot = new Graph(width - d, 75, 0.9 * d);
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
    msg.style.display = lattice.snapshots.length <= 1 ? 'flex' : 'none';
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

        clearTimeout(mouseWheel._timer);
        mouseWheel._timer = setTimeout(() => {
            el.style.opacity = 0;
        }, 1500);
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

                if (!isValid(data)) {
                    return;
                }
                applySession(data);
            } catch (err) {
                alert("Erreur lors du chargement du fichier : " + err.message);
            }
        };
        reader.readAsText(file);
        let el = document.getElementById('load-indicator');
        if (el) {
            el.style.opacity = 1;

            clearTimeout(mouseWheel._timer);
            mouseWheel._timer = setTimeout(() => {
                el.style.opacity = 0;
            }, 1500);
        }
    }
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

        // Nettoyer les instances p5 des snapshots précédentes et la barre de snapshots
        for (let inst of snapshotP5Instances) inst.remove();
        snapshotP5Instances = [];
        document.getElementById('snapshotBar').innerHTML = '';
        document.getElementById('snapshotBar').innerHTML = '<div id="emptyMessage">Aucune snapshot pour le moment.</div>';

        // Recréer le lattice et les graphes
        lattice = new Lattice(0, 0, 0.9 * width, 0.9 * height, 0.1 * height);
        latticeBuffer = createGraphics(lattice.w, lattice.h);
        lastDrawnTableIndex = -1;

        for (let adj of data.snapshots) {
            let snap = new Graph(0, 0, 0);
            snap.adj = adj;
            lattice.addSnapshot(snap);
            addSnapshotSlot(snap, lattice.snapshots.length);
        }

        let d = 0.05 * width;
        snapshot = new Graph(width - d, 75, 0.9 * d);
        lattice.addSnapshot(snapshot); 
        
        sidebarGraph = new Graph(75, 75, 0.8 * d);
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
function isValid(data){
    const { N, snapshots } = data;
    if (typeof N !== 'number' || N < 2 || N > inputN.attribute('max')) {
        alert("Le champ N doit être un nombre supérieur ou égal à 2.");
        return false;
    }
    if (!Array.isArray(snapshots)) {
        alert("Le champ snapshots doit être un tableau.")
        return false
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
    const dot = document.getElementById('connexityDot');
    const text = document.getElementById('connexityText');
    if (snapshot.isConnected()) {
        dot.className = 'connected';
        text.textContent = 'Connexe';
    } else {
        dot.className = 'disconnected';
        text.textContent = 'Non connexe';
    }
}

// Gérer les raccourcis clavier
document.addEventListener("keydown", (event) => {
    // Ctrl + Shift + A pour ajouter une snapshot
    if (event.ctrlKey && event.shiftKey && event.key.toLowerCase() === "a") {
        event.preventDefault();
        handleAdd();
    }
    // Ctrl + Z pour revenir à la snapshot précédente
    if (event.ctrlKey && event.key.toLowerCase() === "z") {
        event.preventDefault();
        handleBack();
    }
    // Ctrl + Shift + S pour sauvegarder la session    
    if (event.ctrlKey && event.shiftKey && event.key.toLowerCase() === "s") {
        event.preventDefault();
        saveSession();
    }
    // Ctrl + Shift + O pour charger une session
    if (event.ctrlKey && event.shiftKey && event.key.toLowerCase() === "o") {
        event.preventDefault();
        loadSession();
    }
    // Echap pour fermer la modale de confirmation
    if (event.key === "Escape") {
        if (!document.getElementById('modalOverlay').classList.contains('hidden')) {
            document.getElementById('modalOverlay').classList.add('hidden');
        }
    }
});

document.addEventListener("dblclick", (event) => {
    if (mouseY > height || mouseY < 0 || mouseX < 0 || mouseX > width) {
        return;
    }
    // Réinitialiser le zoom et le pan sur un double-clic
    zoomLevel = 1;
    panX = 0;
    panY = 0;
    display();
});