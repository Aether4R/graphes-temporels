const N = 5;
const S = 1 << (N - 1);

let snapshot;
let lattice;
let add, back;

function setup() {
    createCanvas(1000, 550);

    lattice = new Lattice(0, 0, 0.9 * width, 0.9 * height, 0.1 * height);
    let d = 0.05 * width;
    snapshot = new Graph(width - d, d, 0.9 * d);
    lattice.addSnapshot(snapshot);
    add = new Button(width - d, 3 * d, 1.5 * d, d, "ADD");
    back = new Button(width - d, height - d, 1.5 * d, d, "BACK");
    display();
}

function draw() {
}

function mousePressed() {
    if (snapshot.updateEdges(createVector(mouseX, mouseY))) {
        lattice.update();
        add.disabled = !snapshot.isConnected();
    }
    
    if (add.click()) {
        addSnapshot();
    }
    
    if (back.click()) {
        lattice.tables.pop();
        lattice.tables.pop();
        lattice.snapshots.pop();
        lattice.snapshots.pop();
        addSnapshot();
    }
    
    display();
}

function display() {
    background(255);
    lattice.display();
    snapshot.display();
    add.display();
    back.display();
}

function addSnapshot() {
    let d = 0.05 * width;
    snapshot = new Graph(width - d, d, 0.9 * d);
    lattice.addSnapshot(snapshot);
    add.disabled = true;
    back.disabled = lattice.snapshots.length < 2;
}