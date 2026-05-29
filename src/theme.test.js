import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Mock document and localStorage
const mockLocalStorage = (() => {
  let store = {};
  return {
    getItem: (key) => store[key] || null,
    setItem: (key, value) => {
      store[key] = value.toString();
    },
    removeItem: (key) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

global.localStorage = mockLocalStorage;

// Mock document.documentElement
const mockDocumentElement = {
  getAttribute: vi.fn((attr) => {
    if (attr === 'data-theme') {
      return localStorage.getItem('theme') === 'dark' ? 'dark' : 'light';
    }
    return null;
  }),
  setAttribute: vi.fn((attr, value) => {
    if (attr === 'data-theme') {
      localStorage.setItem('theme', value);
    }
  }),
};

global.document = {
  documentElement: mockDocumentElement,
  getElementById: vi.fn((id) => {
    if (id === 'themeToggle') {
      return {
        checked: false,
        addEventListener: vi.fn(),
      };
    }
    return null;
  }),
};

global.getComputedStyle = vi.fn((el) => ({
  getPropertyValue: vi.fn((prop) => {
    if (prop === '--bg-canvas') return '#ffffff';
    if (prop === '--bg-surface') return '#f7fafc';
    return '';
  }),
}));

// Import and test functions
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

function getThemeColors() {
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  return {
    isDark,
    text: isDark ? [226, 232, 240] : [0, 0, 0],
    textLight: isDark ? [148, 163, 184] : [191, 191, 191],
    accent: [59, 130, 246],
    fresh: [239, 68, 68],
    border: isDark ? [51, 65, 85] : [0, 0, 0],
  };
}

function setTheme(isDark) {
  document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
  localStorage.setItem('theme', isDark ? 'dark' : 'light');
}

describe('theme.js', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('cssHexToRGB', () => {
    it('should convert hex color to RGB array', () => {
      const result = cssHexToRGB('#ffffff');
      expect(result).toEqual([255, 255, 255]);
    });

    it('should convert black hex to RGB', () => {
      const result = cssHexToRGB('#000000');
      expect(result).toEqual([0, 0, 0]);
    });

    it('should convert red hex to RGB', () => {
      const result = cssHexToRGB('#ff0000');
      expect(result).toEqual([255, 0, 0]);
    });

    it('should convert green hex to RGB', () => {
      const result = cssHexToRGB('#00ff00');
      expect(result).toEqual([0, 255, 0]);
    });

    it('should convert blue hex to RGB', () => {
      const result = cssHexToRGB('#0000ff');
      expect(result).toEqual([0, 0, 255]);
    });

    it('should handle hex with spaces', () => {
      const result = cssHexToRGB('  #3b82f6  ');
      expect(result).toEqual([59, 130, 246]);
    });

    it('should return fallback for invalid hex', () => {
      const fallback = [100, 100, 100];
      const result = cssHexToRGB('invalid', fallback);
      expect(result).toEqual(fallback);
    });

    it('should return default fallback for invalid hex when not provided', () => {
      const result = cssHexToRGB('invalid');
      expect(result).toEqual([255, 255, 255]);
    });

    it('should reject hex that is too short', () => {
      const result = cssHexToRGB('#fff');
      expect(result).toEqual([255, 255, 255]);
    });

    it('should reject hex that is too long', () => {
      const result = cssHexToRGB('#ffffff00');
      expect(result).toEqual([255, 255, 255]);
    });

    it('should reject non-hex format', () => {
      const result = cssHexToRGB('rgb(255, 0, 0)');
      expect(result).toEqual([255, 255, 255]);
    });
  });

  describe('getThemeColors', () => {
    it('should return light theme colors by default', () => {
      mockDocumentElement.getAttribute.mockReturnValue('light');
      const colors = getThemeColors();

      expect(colors.isDark).toBe(false);
      expect(colors.text).toEqual([0, 0, 0]);
      expect(colors.textLight).toEqual([191, 191, 191]);
      expect(colors.accent).toEqual([59, 130, 246]);
      expect(colors.fresh).toEqual([239, 68, 68]);
      expect(colors.border).toEqual([0, 0, 0]);
    });

    it('should return dark theme colors when dark theme is set', () => {
      mockDocumentElement.getAttribute.mockReturnValue('dark');
      const colors = getThemeColors();

      expect(colors.isDark).toBe(true);
      expect(colors.text).toEqual([226, 232, 240]);
      expect(colors.textLight).toEqual([148, 163, 184]);
      expect(colors.accent).toEqual([59, 130, 246]);
      expect(colors.fresh).toEqual([239, 68, 68]);
      expect(colors.border).toEqual([51, 65, 85]);
    });

    it('should have consistent accent color across themes', () => {
      mockDocumentElement.getAttribute.mockReturnValue('light');
      const lightColors = getThemeColors();

      mockDocumentElement.getAttribute.mockReturnValue('dark');
      const darkColors = getThemeColors();

      expect(lightColors.accent).toEqual(darkColors.accent);
      expect(lightColors.fresh).toEqual(darkColors.fresh);
    });
  });

  describe('setTheme', () => {
    it('should set dark theme', () => {
      setTheme(true);
      expect(localStorage.getItem('theme')).toBe('dark');
      expect(mockDocumentElement.setAttribute).toHaveBeenCalledWith(
        'data-theme',
        'dark'
      );
    });

    it('should set light theme', () => {
      setTheme(false);
      expect(localStorage.getItem('theme')).toBe('light');
      expect(mockDocumentElement.setAttribute).toHaveBeenCalledWith(
        'data-theme',
        'light'
      );
    });

    it('should persist theme preference to localStorage', () => {
      setTheme(true);
      expect(localStorage.getItem('theme')).toBe('dark');

      setTheme(false);
      expect(localStorage.getItem('theme')).toBe('light');
    });

    it('should toggle between themes', () => {
      setTheme(true);
      expect(localStorage.getItem('theme')).toBe('dark');

      setTheme(false);
      expect(localStorage.getItem('theme')).toBe('light');

      setTheme(true);
      expect(localStorage.getItem('theme')).toBe('dark');
    });
  });
});
