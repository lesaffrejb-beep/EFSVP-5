/**
 * DESIGN TOKENS - COLOR SYSTEM v2.0 (JS handoff)
 * Generated automatically from RAW_COLORS to keep parity with CSS tokens.
 */

/** @type {const} */
export const RAW_COLORS = {
  emeraldGreen: { hex: '#317039', rgb: [49, 112, 57], name: 'Vert Émeraude' },
  maximumYellow: { hex: '#F1BE49', rgb: [241, 190, 73], name: 'Jaune Vif' },
  antiqueWhite: { hex: '#FBEDD9', rgb: [248, 237, 217], name: 'Blanc Antique' },
  darkPastelRed: { hex: '#CC4B24', rgb: [204, 75, 36], name: 'Rouge Brique' },
  papayaWhip: { hex: '#FFF1D4', rgb: [255, 241, 212], name: 'Papaye' },
  cosmicLatte: { hex: '#FFFBEB', rgb: [255, 251, 235], name: 'Crème Cosmique' },
  customBlue: { hex: '#1D4ED8', rgb: [29, 78, 216], name: 'Bleu Info' },
  neutral: { hex: '#111827', rgb: [17, 24, 39], name: 'Neutre Profond' }
};

const lightStops = {
  50: 12,
  100: 18,
  200: 26,
  300: 34,
  400: 42
};

const darkStops = {
  600: 85,
  700: 75,
  800: 65,
  900: 55
};

/**
 * Builds a full shade ramp (50-900) using OKLCH color-mix so the browser computes exact values.
 * @param {string} hex base hex color string (e.g. #317039)
 */
export const generateShades = (hex) => {
  const shades = {};
  Object.entries(lightStops).forEach(([key, percent]) => {
    shades[key] = `color-mix(in oklch, ${hex} ${percent}%, white)`;
  });
  shades[500] = `oklch(from ${hex} l c h)`;
  Object.entries(darkStops).forEach(([key, percent]) => {
    shades[key] = `color-mix(in oklch, ${hex} ${percent}%, black)`;
  });
  return shades;
};

/**
 * Creates opacity variants (10-90) for a given base CSS color reference.
 * @param {string} cssColor CSS variable or color literal
 */
export const generateAlphaLayers = (cssColor) => {
  const alpha = {};
  for (let step = 10; step <= 90; step += 10) {
    alpha[step] = `color-mix(in oklch, ${cssColor} ${step}%, transparent)`;
  }
  return alpha;
};

const buildFoundation = () =>
  Object.fromEntries(
    Object.entries(RAW_COLORS).map(([key, value]) => [
      key,
      {
        ...value,
        shades: generateShades(value.hex),
        alpha: generateAlphaLayers(`oklch(from ${value.hex} l c h)`)
      }
    ])
  );

/** Converts a hex color to an sRGB array. */
const hexToRGB = (hex) => {
  const parsed = hex.replace('#', '');
  return [
    parseInt(parsed.slice(0, 2), 16),
    parseInt(parsed.slice(2, 4), 16),
    parseInt(parsed.slice(4, 6), 16)
  ];
};

const linearize = (channel) => {
  const c = channel / 255;
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
};

const relativeLuminance = (hex) => {
  const [r, g, b] = hexToRGB(hex);
  const l = 0.2126 * linearize(r) + 0.7152 * linearize(g) + 0.0722 * linearize(b);
  return l;
};

/**
 * Computes WCAG 2.1 contrast ratio.
 * @param {string} color1 hex color string
 * @param {string} color2 hex color string
 * @returns {number} ratio
 */
export const getContrastRatio = (color1, color2) => {
  const l1 = relativeLuminance(color1);
  const l2 = relativeLuminance(color2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return Number(((lighter + 0.05) / (darker + 0.05)).toFixed(3));
};

/**
 * Lightweight APCA approximation (suitable for automated regression checks).
 * @param {string} textColor hex
 * @param {string} bgColor hex
 */
export const getAPCA = (textColor, bgColor) => {
  const txt = relativeLuminance(textColor);
  const bg = relativeLuminance(bgColor);
  const polarity = txt > bg ? 1 : -1;
  const contrast = (Math.pow(Math.abs(txt - bg), 0.56) * 1.14) * 100;
  return polarity * Number(contrast.toFixed(2));
};

/**
 * Maps semantic intent to the foundation ramp.
 */
export const SEMANTIC_MAPPING = {
  primary: {
    light: { base: 'emeraldGreen-600', hover: 'emeraldGreen-700' },
    dark: { base: 'emeraldGreen-400', hover: 'emeraldGreen-300' }
  },
  success: { base: 'emeraldGreen-500', subtle: 'emeraldGreen-50' },
  warning: { base: 'maximumYellow-500', subtle: 'maximumYellow-50' },
  error: { base: 'darkPastelRed-500', subtle: 'darkPastelRed-50' },
  info: { base: 'customBlue-500', subtle: 'customBlue-50' },
  surface: {
    primary: { light: 'cosmicLatte-50', dark: 'neutral-900' },
    secondary: { light: 'antiqueWhite-100', dark: 'neutral-800' }
  }
};

export const themes = {
  light: {
    background: 'cosmicLatte-50',
    surface: 'antiqueWhite-100',
    primary: 'emeraldGreen-600',
    text: 'neutral-900'
  },
  dark: {
    background: 'neutral-900',
    surface: 'neutral-800',
    primary: 'emeraldGreen-400',
    text: 'cosmicLatte-50'
  },
  highContrast: {
    background: 'neutral-900',
    surface: 'neutral-50',
    primary: 'emeraldGreen-800',
    text: 'cosmicLatte-50',
    emphasis: 'darkPastelRed-500'
  },
  dyslexia: {
    background: 'cosmicLatte-100',
    surface: 'papayaWhip-200',
    primary: 'customBlue-600',
    text: 'neutral-900'
  }
};

export const gradients = {
  emeraldSunset: 'var(--gradient-emerald-sunset)',
  calmSea: 'var(--gradient-calm-sea)'
};

export const shadows = {
  emerald: 'var(--shadow-emerald)',
  emeraldStrong: 'var(--shadow-emerald-strong)',
  focus: 'var(--shadow-primary-focus)'
};

/**
 * Evaluates AAA/AA compliance for a text/background pair.
 * @param {string} textColor hex string
 * @param {string} bgColor hex string
 */
export const validateContrast = (textColor, bgColor) => {
  const ratio = getContrastRatio(textColor, bgColor);
  const apca = getAPCA(textColor, bgColor);
  const level = ratio >= 7 ? 'AAA' : ratio >= 4.5 ? 'AA' : 'FAIL';
  return { ratio, apca, level };
};

export const colors = {
  foundation: buildFoundation(),
  semantic: SEMANTIC_MAPPING,
  themes,
  gradients,
  shadows,
  utils: {
    getContrastRatio,
    getAPCA,
    validateContrast,
    generateShades,
    generateAlphaLayers
  }
};

export default colors;
