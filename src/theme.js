// =============================================================================
// theme.js
// Gère le basculement du thème sombre/clair et les utilitaires de couleur CSS.
// =============================================================================

/**
 * Parse une chaîne de couleur CSS hex (par ex. "#f7fafc") en un tableau [r, g, b].
 * Retourne le secours fourni en cas échec de l'analyse.
 *
 * @param {string} cssColor - Une chaîne de couleur CSS (hex uniquement supporté).
 * @param {number[]} fallback - Par défaut [r, g, b] lorsque l'analyse échoue.
 * @returns {number[]} Un tableau [r, g, b] avec des valeurs dans [0, 255].
 */
function cssHexToRGB(cssColor, fallback = [255, 255, 255]) {
    const hex = cssColor.trim();
    if (hex.startsWith('#') && hex.length === 7) {
        return [
            parseInt(hex.substring(1, 3), 16),
            parseInt(hex.substring(3, 5), 16),
            parseInt(hex.substring(5, 7), 16),
        ];
    }
    return fallback;
}

/**
 * Lit la variable CSS courante `--bg-canvas` et la retourne comme [r, g, b].
 *
 * @returns {number[]} [r, g, b]
 */
function getCanvasBgColor() {
    const cssColor = getComputedStyle(document.documentElement)
        .getPropertyValue('--bg-canvas').trim();
    return cssHexToRGB(cssColor, [255, 255, 255]);
}

/**
 * Lit la variable CSS courante `--bg-surface` et la retourne comme [r, g, b].
 *
 * @returns {number[]} [r, g, b]
 */
function getSurfaceBgColor() {
    const cssColor = getComputedStyle(document.documentElement)
        .getPropertyValue('--bg-surface').trim();
    return cssHexToRGB(cssColor, [247, 250, 252]);
}

/**
 * Retourne un objet de palette correspondant au thème actif (clair ou sombre).
 *
 * @returns {{
 *   isDark:    boolean,
 *   text:      number[],
 *   textLight: number[],
 *   accent:    number[],
 *   fresh:     number[],
 *   border:    number[]
 * }}
 */
function getThemeColors() {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    return {
        isDark,
        text:      isDark ? [226, 232, 240] : [0, 0, 0],
        textLight: isDark ? [148, 163, 184] : [191, 191, 191],
        accent:    [59, 130, 246],
        fresh:     [239, 68, 68],
        border:    isDark ? [51, 65, 85]  : [0, 0, 0],
    };
}

/**
 * Applique un thème et persiste le choix dans localStorage.
 *
 * @param {boolean} isDark
 */
function setTheme(isDark) {
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    snapshotP5Instances.forEach(inst => inst.redraw?.());
    display();
}

/**
 * Câble le commutateur de basculement de thème et restaure la préférence dernièrement enregistrée.
 */
function initTheme() {
    const toggle = document.getElementById('themeToggle');

    toggle.addEventListener('change', () => setTheme(toggle.checked));

    const saved = localStorage.getItem('theme');
    if (saved === 'dark') {
        toggle.checked = true;
        setTheme(true);
    } else {
        setTheme(false);
    }
}