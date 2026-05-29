// =============================================================================
// ui.js
// Utilitaires DOM purs: états des boutons, indicateurs lumineux, info-bulles,
// modérateurs, insigne de connectivité et message d'état vide de la barre de snapshots.
// =============================================================================

// Aides aux boutons

/**
 * Active ou désactive un bouton de la barre latérale en basculant les classes CSS
 * qui contrôlent son apparence et son interactivité.
 *
 * @param {HTMLElement} btn
 * @param {boolean}     enabled
 */
function setButtonEnabled(btn, enabled) {
    btn.classList.toggle('enabled',  enabled);
    btn.classList.toggle('disabled', !enabled);
}

// Indicateurs (zoom, sauvegarde, chargement)

/**
 * Affiche brièvement un élément indicateur flottant, puis le fait s'estomper.
 * Utilise une minuterie par fonction stockée sur l'objet fonction pour annuler les appels rapides.
 *
 * @param {string} elementId  - ID DOM de l'élément indicateur.
 * @param {number} [duration] - Durée (ms) de visibilité de l'indicateur. Par défaut 1500.
 */
function flashIndicator(elementId, duration = 1500) {
    const el = document.getElementById(elementId);
    if (!el) return;
    el.style.opacity = 1;
    clearTimeout(flashIndicator._timers?.[elementId]);
    flashIndicator._timers = flashIndicator._timers ?? {};
    flashIndicator._timers[elementId] = setTimeout(() => { el.style.opacity = 0; }, duration);
}

/**
 * Met à jour le texte de l'indicateur de zoom et l'affiche brièvement.
 *
 * @param {number} zoom - Niveau de zoom courant (1 = 100 %).
 */
function updateZoomIndicator(zoom) {
    const el = document.getElementById('zoom-indicator');
    if (el) el.innerText = Math.floor(zoom * 100) + '%';
    flashIndicator('zoom-indicator');
}


/**
 * Met à jour l'indicateur de connexité dans la sidebar en fonction de l'état de la snapshot actuelle
 */
function updateConnexityIndicator() {
    const dot  = document.getElementById('connexityDot');
    const text = document.getElementById('connexityText');
    const connected = snapshot.isConnected();
    dot.className   = connected ? 'connected'  : 'disconnected';
    text.textContent = connected ? 'Connected' : 'Not Connected';
}

// ---------------------------------------------------------------------------
// Modérateurs
// ---------------------------------------------------------------------------

/**
 * Retourne true si une modale est actuellement ouverte
 * @returns {boolean}
 */
function isModalOpen() {
    return ['helpOverlay', 'snapshotOverlay', 'resetOverlay']
        .some(id => !document.getElementById(id).classList.contains('hidden'));
}

/** Ouvre la superposition d'aide. */
function openHelp() { document.getElementById('helpOverlay').classList.remove('hidden'); }
/** Ferme la superposition d'aide. */
function closeHelp()    { document.getElementById('helpOverlay').classList.add('hidden'); }

/** Ouvre la superposition snapshot (arbres intéressants). */
function openSnapshotOverlay()  { document.getElementById('snapshotOverlay').classList.remove('hidden'); }
/** Ferme la superposition snapshot. */
function closeSnapshotOverlay() { document.getElementById('snapshotOverlay').classList.add('hidden'); }

/** Ouvre la superposition de confirmation de réinitialisation. */
function openResetOverlay()  { document.getElementById('resetOverlay').classList.remove('hidden'); }
/** Ferme la superposition de réinitialisation. */
function closeResetOverlay() { document.getElementById('resetOverlay').classList.add('hidden'); }

/**
 * Ferme chaque superposition ouverte
 */
function closeAllModals() {
    closeHelp();
    closeSnapshotOverlay();
    closeResetOverlay();
}

// ---------------------------------------------------------------------------
// Message d'état vide de la barre de snapshots
// ---------------------------------------------------------------------------

/**
 * Met à jour le message affiché dans la barre de snapshots lorsque celle-ci est vide
 */
function updateEmptyMessage() {
    const msg = document.getElementById('emptyMessage');
    if (msg) msg.style.display = lattice.snapshots.length <= 1 ? 'flex' : 'none';
}

// tooltips

/**
 * Câble des tooltips dynamiques pour chaque bouton de la barre latérale qui a un attribut
 * `data-tooltip`.
 */
function initTooltips() {
    document.querySelectorAll('.sidebar button[data-tooltip]').forEach(btn => {
        btn.addEventListener('mouseenter', () => {
            const rect        = btn.getBoundingClientRect();
            const sidebarWidth = document.querySelector('.sidebar').offsetWidth;

            const tip = document.createElement('div');
            tip.id = 'dynamic-tooltip';
            tip.textContent = btn.dataset.tooltip;
            document.body.appendChild(tip);

            tip.style.cssText = `
                position:      fixed;
                left:          ${sidebarWidth + 10}px;
                top:           ${rect.top + rect.height / 2}px;
                background:    rgba(0,0,0,0.8);
                color:         white;
                padding:       6px 10px;
                border-radius: 6px;
                font-size:     13px;
                white-space:   nowrap;
                z-index:       1000;
                pointer-events:none;
                transform:     translateY(-50%);
            `;

            // Clamp to viewport bottom
            const tipRect = tip.getBoundingClientRect();
            if (tipRect.bottom > window.innerHeight - 8) {
                tip.style.top       = 'auto';
                tip.style.bottom    = '8px';
                tip.style.transform = 'none';
            }
        });

        btn.addEventListener('mouseleave', () => {
            document.getElementById('dynamic-tooltip')?.remove();
        });
    });
}

// Raccourcis clavier

/**
 * Enregistre les raccourcis clavier globaux pour toutes les actions principales.
 */
function initKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
        const ctrl  = e.ctrlKey || e.metaKey;
        const shift = e.shiftKey;
        const key   = e.key.toLowerCase();

        if (ctrl && shift && key === 'a') { e.preventDefault(); handleAdd();      return; }
        if (ctrl && !shift && key === 'z') { e.preventDefault(); handleBack();    return; }
        if (ctrl && shift && key === 's') { e.preventDefault(); saveSession();    return; }
        if (ctrl && shift && key === 'o') { e.preventDefault(); loadSession();    return; }
        if (ctrl && shift && key === 'r') { e.preventDefault(); handleReset();    return; }
        if (e.key === 'Escape')           { closeAllModals();                      return; }
    });
}