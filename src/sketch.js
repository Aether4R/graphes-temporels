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

    addBtn.onclick  = handleAdd;
    backBtn.onclick = handleBack;

    addBtn.classList.add("disabled");
    backBtn.classList.add("disabled");

    // La snapshotBar gère son propre scroll, indépendamment de p5
    document.getElementById('snapshotBar').addEventListener('wheel', (e) => {
        e.stopPropagation();
        e.preventDefault();
        document.getElementById('snapshotBar').scrollLeft += e.deltaY || e.deltaX;
    }, { passive: false });
}

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

function initSimulation() {
    S = 1 << (N - 1);

    for (let inst of snapshotP5Instances) inst.remove();
    snapshotP5Instances = [];
    document.getElementById('snapshotBar').innerHTML = '';

    lattice = new Lattice(0, 0, 0.9 * width, 0.9 * height, 0.1 * height);
    // Créer le buffer pour cacher le lattice
    latticeBuffer = createGraphics(lattice.w, lattice.h);
    lastDrawnTableIndex = -1;
    let d = 0.05 * width;

    snapshot = new Graph(width - d, 75, 0.9 * d);
    lattice.addSnapshot(snapshot);

    sidebarGraph = new Graph(75, 75, 0.8 * d);

    display();
}

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
}

function mouseDragged() {
    // Vérifier que la souris est sur le canvas principal
    if (mouseY > height || mouseY < 0 || mouseX < 0 || mouseX > width) {
        return;
    }

    let dx = mouseX - lastMouseX;
    let dy = mouseY - lastMouseY;

    if (abs(dx) + abs(dy) < 2) return;

    panX += dx;
    panY += dy;

    lastMouseX = mouseX;
    lastMouseY = mouseY;

    display();
}

function mouseReleased() {
    isPanning = false;
}

function mouseWheel(event) {
    if (mouseY > height || mouseY < 0 || mouseX < 0 || mouseX > width) {
        return;
    }

    let zoomFactor = event.delta > 0 ? 0.9 : 1.1;
    panX = mouseX - zoomFactor * (mouseX - panX);
    panY = mouseY - zoomFactor * (mouseY - panY);
    zoomLevel *= zoomFactor;

    display();
    return false; // bloquer le scroll page seulement dans le canvas
}

function display() {
    // Redessiner le lattice sur le buffer seulement si la table active a changé
    let currentTableIndex = lattice.tables.length - 1;
    if (currentTableIndex !== lastDrawnTableIndex) {
        latticeBuffer.background(255);
        latticeBuffer.push();
        // Appeler la méthode display du lattice sur le buffer
        lattice.tables[currentTableIndex].display(latticeBuffer);
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

function rebuildSnapshotBar() {
    for (let inst of snapshotP5Instances) inst.remove();
    snapshotP5Instances = [];
    document.getElementById('snapshotBar').innerHTML = '';

    let count = lattice.snapshots.length - 1;
    for (let t = 0; t < count; t++) {
        addSnapshotSlot(lattice.snapshots[t], t + 1);
    }
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

    addSnapshotSlot(lattice.snapshots[lattice.snapshots.length - 2], lattice.snapshots.length - 1);
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

document.addEventListener("keydown", (event) => {
    if (event.ctrlKey && event.shiftKey && event.key.toLowerCase() === "a") {
        event.preventDefault();
        handleAdd();
    }
    if (event.ctrlKey && event.key.toLowerCase() === "z") {
        event.preventDefault();
        handleBack();
    }
});