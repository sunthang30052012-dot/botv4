export const MC_COLORS: Record<string, string> = {
  '0': '#000000', // Black
  '1': '#0000AA', // Dark Blue
  '2': '#00AA00', // Dark Green
  '3': '#00AAAA', // Dark Aqua
  '4': '#AA0000', // Dark Red
  '5': '#AA00AA', // Dark Purple
  '6': '#FFAA00', // Gold
  '7': '#AAAAAA', // Gray
  '8': '#555555', // Dark Gray
  '9': '#5555FF', // Blue
  'a': '#55FF55', // Green
  'b': '#55FFFF', // Aqua
  'c': '#FF5555', // Red
  'd': '#FF55FF', // Light Purple
  'e': '#FFFF55', // Yellow
  'f': '#FFFFFF', // White
};

export interface FormattedSpan {
  text: string;
  color?: string;
  bold?: boolean;
  italic?: boolean;
}

export function parseMinecraftText(input: string): FormattedSpan[] {
  if (!input) return [];

  // Match either § or & color codes
  const parts = input.split(/(?:§|&)([0-9a-fk-or])/gi);
  const spans: FormattedSpan[] = [];

  let currentColor: string = '#E2E8F0';
  let isBold = false;
  let isItalic = false;

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    if (i % 2 === 1) {
      const code = part.toLowerCase();
      if (MC_COLORS[code]) {
        currentColor = MC_COLORS[code];
        isBold = false;
        isItalic = false;
      } else if (code === 'l') {
        isBold = true;
      } else if (code === 'o') {
        isItalic = true;
      } else if (code === 'r') {
        currentColor = '#E2E8F0';
        isBold = false;
        isItalic = false;
      }
    } else if (part) {
      spans.push({
        text: part,
        color: currentColor,
        bold: isBold,
        italic: isItalic,
      });
    }
  }

  return spans.length > 0 ? spans : [{ text: input, color: '#E2E8F0' }];
}
