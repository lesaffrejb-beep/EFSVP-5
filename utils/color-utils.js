/**
 * Utility helpers for working with the color system at runtime.
 */

const linearize = (channel) => {
  const c = channel / 255;
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
};

const hexToRGB = (hex) => {
  const normalized = hex.replace('#', '');
  return [
    parseInt(normalized.slice(0, 2), 16),
    parseInt(normalized.slice(2, 4), 16),
    parseInt(normalized.slice(4, 6), 16)
  ];
};

const luminance = (hex) => {
  const [r, g, b] = hexToRGB(hex);
  return 0.2126 * linearize(r) + 0.7152 * linearize(g) + 0.0722 * linearize(b);
};

const contrastRatio = (foreground, background) => {
  const l1 = luminance(foreground);
  const l2 = luminance(background);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
};

/**
 * Lightens a color using CSS OKLCH mixing.
 * @param {string} color CSS color or variable
 * @param {number} percent amount of white to mix in
 */
export const lighten = (color, percent) => `color-mix(in oklch, ${color} ${100 - percent}%, white ${percent}%)`;

/**
 * Darkens a color using CSS OKLCH mixing.
 * @param {string} color CSS color or variable
 * @param {number} percent amount of black to mix in
 */
export const darken = (color, percent) => `color-mix(in oklch, ${color} ${100 - percent}%, black ${percent}%)`;

/**
 * Adds alpha to an OKLCH color while preserving hue and chroma.
 * @param {string} color CSS color or variable
 * @param {number} opacity decimal between 0 and 1
 */
export const alpha = (color, opacity) => `oklch(from ${color} l c h / ${opacity})`;

/**
 * Returns the most accessible text color (black or white) for a given background.
 * Favors AAA (>=7) then AA (>=4.5), and returns the best available match.
 * @param {string} bgColor hex background color
 */
export const getAccessibleTextColor = (bgColor) => {
  const whiteContrast = contrastRatio('#FFFFFF', bgColor);
  const blackContrast = contrastRatio('#000000', bgColor);
  if (whiteContrast >= 7 || blackContrast >= 7) {
    return whiteContrast >= blackContrast ? '#FFFFFF' : '#000000';
  }
  if (whiteContrast >= 4.5 || blackContrast >= 4.5) {
    return whiteContrast >= blackContrast ? '#FFFFFF' : '#000000';
  }
  // Neither meets AA; return the better of the two so callers can show a warning.
  return whiteContrast >= blackContrast ? '#FFFFFF' : '#000000';
};

export const Color = { lighten, darken, alpha, getAccessibleTextColor };

export default Color;
