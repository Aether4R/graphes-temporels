// =============================================================================
// session.js
// Gére la sérialisation et la désérialisation de la session de travail actuelle.
//
// Une session est un objet JSON simple:
//   { N: number, snapshots: boolean[][][] }
// où chaque snapshot est une matrice d'adjacence N×N de valeurs booléennes.
// =============================================================================

/**
 * Sauvegarde la session actuelle (N et les snapshots) dans un fichier JSON téléchargeable
 */
function saveSession() {
    const data = {
        N,
        snapshots: lattice.snapshots.slice(0, -1).map(snap => snap.adj),
    };
    saveJSON(data, 'session.json');
    flashIndicator('save-indicator');
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
                if (!isValidSession(data)) return;
                applySession(data);
                flashIndicator('load-indicator');
            } catch (err) {
                alert('Error loading file: ' + err.message);
            }
        };
        reader.readAsText(file);
    };
}

/**
 * Teste la validité d'une session chargée en vérifiant que les snapshots ont une structure correcte
 * @param {Object} data - Les données de la session à tester
 * @returns {boolean} - true si la session est valide, false sinon
 */
function isValidSession(data) {
    const maxN = int(document.getElementById('spinboxContainer')
        .querySelector('input')?.max ?? 10);

    if (typeof data.N !== 'number' || data.N < 2 || data.N > maxN) {
        alert(`N must be a number between 2 and ${maxN}.`);
        return false;
    }

    if (!Array.isArray(data.snapshots)) {
        alert('The "snapshots" field must be an array.');
        return false;
    }

    const validMatrix = data.snapshots.every(snap =>
        Array.isArray(snap) &&
        snap.length === data.N &&
        snap.every(row =>
            Array.isArray(row) &&
            row.length === data.N &&
            row.every(cell => typeof cell === 'boolean')
        )
    );

    if (!validMatrix) {
        alert(`Each snapshot must be a ${data.N}×${data.N} boolean matrix.`);
        return false;
    }

    return true;
}

/**
 * Applique les données d'une session chargée à la simulation,
 * en réinitialisant le lattice et en recréant les snapshots
 * @param {Object} data - Les données de la session, contenant N et les snapshots
 */
function applySession(data) {
    // Update global N
    N = data.N;
    inputN.value(data.N);
    S = 1 << (N - 1);

    // Tear down the current snapshot bar
    for (const inst of snapshotP5Instances) inst.remove();
    snapshotP5Instances = [];
    document.getElementById('snapshotBar').innerHTML =
        '<div id="emptyMessage">No snapshot available at the moment.</div>';

    // Rebuild lattice from scratch
    lattice = new Lattice(0, 0, 0.9 * width, 0.9 * height, 0.1 * height);

    // Replay saved snapshots
    for (const adj of data.snapshots) {
        const snap = new Graph(0, 0, 0);
        snap.adj = adj;
        lattice.addSnapshot(snap);
        addSnapshotSlot(snap, lattice.snapshots.length);
    }

    // Create fresh draft snapshot
    snapshot = new Graph(0, 0, 0);
    lattice.addSnapshot(snapshot);

    sidebarGraph = new Graph(0, 0, 0);
    updateSidebarGraph();

    display();
    updateConnexityIndicator();
    updateEmptyMessage();
}