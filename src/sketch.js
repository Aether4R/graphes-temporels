let N = 5;
let S = 1 << (N - 1);

let snapshot;
let lattice;
let sidebarGraph;
let addBtn, backBtn;
let inputN; // Input pour le nombre de sommets
let zoomLevel = 1;
let panX = 0, panY = 0;
let isPanning = false;

let snapshotP5Instances = []; // Pour stocker les instances p5 des snapshots dans la barre

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

    addBtn = document.getElementById("addBtn");
    backBtn = document.getElementById("backBtn");

    addBtn.onclick = handleAdd;
    backBtn.onclick = handleBack;

    addBtn.classList.add("disabled");
    backBtn.classList.add("disabled");
}

function windowResized() {
    resizeCanvas(windowWidth - 190, windowHeight - 170);

    lattice.w = 0.9 * width;
    lattice.h = 0.9 * height;

    let d = 0.05 * width;

    snapshot.setPos(width - d, 75, 0.9 * d);
    sidebarGraph.setPos(75, 75, 0.8 * d);

    display();
}

function initSimulation() {
    S = 1 << (N - 1);

    // Détruire les instances p5 des snapshots existants
    for (let inst of snapshotP5Instances) inst.remove();
    snapshotP5Instances = [];
    document.getElementById('snapshotBar').innerHTML = '';

    lattice = new Lattice(0, 0, 0.9 * width, 0.9 * height, 0.1 * height);
    let d = 0.05 * width;

    snapshot = new Graph(width - d, 75, 0.9 * d);
    lattice.addSnapshot(snapshot);

    sidebarGraph = new Graph(75, 75, 0.8 * d);

    display();
}

function updateN() {
    let newN = int(inputN.value());

    if (newN >= int(inputN.attribute('min')) && newN <= int(inputN.attribute('max'))) {
        N = newN;
        initSimulation();
    }
}

function mousePressed() {
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
}

function mouseWheel(event) {
    let zoomFactor = event.delta > 0 ? 0.9 : 1.1;
    
    // Zoom centré sur la position de la souris
    panX = mouseX - zoomFactor * (mouseX - panX);
    panY = mouseY - zoomFactor * (mouseY - panY);
    zoomLevel *= zoomFactor;
    
    display();
    return false; // empêche le scroll de la page
}

function display() {
    background(255);
    
    push();
    translate(panX, panY);
    scale(zoomLevel);
    lattice.display(); // le lattice est zoomé/panné
    pop();
    
    snapshot.display(); // le snapshot en haut à droite reste fixe
    updateSidebarGraph();
}

function updateSidebarGraph() {
    for (let i = 0; i < N; i++) {
        for (let j = 0; j < N; j++) {
            sidebarGraph.edgeTimes[i][j] = [];
        }
    }

    for (let t = 0; t < lattice.snapshots.length; t++) {
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

// Reconstruire la barre de snapshots après chaque ajout ou suppression pour refléter les changements
function rebuildSnapshotBar() {
    // Détruire les instances p5 existantes
    for (let inst of snapshotP5Instances) inst.remove();
    snapshotP5Instances = [];

    const bar = document.getElementById('snapshotBar');
    bar.innerHTML = '';

    // Tous les snapshots sauf le dernier (en cours d'édition)
    let count = lattice.snapshots.length - 1;
    for (let t = 0; t < count; t++) {
        let snap = lattice.snapshots[t];

        const slot = document.createElement('div');
        slot.className = 'snapshot-slot';

        const label = document.createElement('div');
        label.className = 'snapshot-label';
        label.textContent = 'Temps ' + (t + 1);
        slot.appendChild(label);
        bar.appendChild(slot);

        let inst = new p5((p) => {
            p.setup = function() {
                let c = p.createCanvas(140, 130);
                c.parent(slot);
                snap.setPos(70, 65, 45);
            };
            p.draw = function() {
                p.background(255);
                snap.display(p);
            };
        });
        snapshotP5Instances.push(inst);
    }

    // Scroll automatique vers le dernier slot
    setTimeout(() => { bar.scrollLeft = bar.scrollWidth; }, 50);
}

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

    rebuildSnapshotBar();
}

function handleAdd() {
    if (!addBtn.classList.contains("disabled")) {
        addSnapshot();
        display();
    }
}

function handleBack() {
    if (!backBtn.classList.contains("disabled")) {
        lattice.tables.pop();
        lattice.tables.pop();
        lattice.snapshots.pop();
        lattice.snapshots.pop();
        addSnapshot();
        display();
    }
}

// Raccourcis clavier
document.addEventListener("keydown", (event) => {
    // Ctrl + Shift + A pour ajouter un snapshot
    if (event.ctrlKey && event.shiftKey && event.key.toLowerCase() === "a") {
        event.preventDefault();
        handleAdd();
    }

    // Ctrl + Z pour revenir en arrière
    if (event.ctrlKey && event.key.toLowerCase() === "z") {
        event.preventDefault();
        handleBack();
    }
});