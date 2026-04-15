let N = 5;
let S = 1 << (N - 1);

let snapshot;
let lattice;
let sidebarGraph;
let addBtn, backBtn;
let inputN;

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
    createCanvas(windowWidth - 190, windowHeight);

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
    resizeCanvas(windowWidth - 190, windowHeight);

    lattice.w = 0.9 * width;
    lattice.h = 0.9 * height;

    let d = 0.05 * width;

    snapshot.setPos(width - d, d, 0.9 * d);
    sidebarGraph.setPos(75, 75, 0.9 * d);

    display();
}

function initSimulation() {
    S = 1 << (N - 1);

    lattice = new Lattice(0, 0, 0.9 * width, 0.9 * height, 0.1 * height);
    let d = 0.05 * width;

    snapshot = new Graph(width - d, d, 0.9 * d);
    lattice.addSnapshot(snapshot);
    
    sidebarGraph = new Graph(75, 75, 0.9 * d);

    display();
}

function updateN() {
    let newN = int(inputN.value());

    if (newN >= 2 && newN <= 10) {
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

function display() {
    background(255);
    lattice.display();
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

function addSnapshot() {
    let d = 0.05 * width;

    snapshot = new Graph(width - d, d, 0.9 * d);
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