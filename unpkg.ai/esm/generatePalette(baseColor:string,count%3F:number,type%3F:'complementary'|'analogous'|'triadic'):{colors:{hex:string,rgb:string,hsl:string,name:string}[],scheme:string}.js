export function generatePalette(baseColor, count = 5, type = 'analogous') {
  // Helpers
  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

  const hexFromRgb = (r, g, b) =>
    '#' +
    [r, g, b]
      .map((x) => {
        const s = x.toString(16);
        return s.length === 1 ? '0' + s : s;
      })
      .join('');

  const rgbToHex = (r, g, b) => hexFromRgb(r, g, b);

  const rgbToString = (r, g, b) => `rgb(${r}, ${g}, ${b})`;

  const rgbToHsl = (r, g, b) => {
    // r,g,b in [0,255]
    r /= 255;
    g /= 255;
    b /= 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0;
    let s = 0;
    const l = (max + min) / 2;

    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r:
          h = (g - b) / d + (g < b ? 6 : 0);
          break;
        case g:
          h = (b - r) / d + 2;
          break;
        case b:
          h = (r - g) / d + 4;
          break;
      }
      h *= 60;
    }
    return { h: (h + 360) % 360, s, l };
  };

  const hueToRgb = (p, q, t) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };

  const hslToRgb = (h, s, l) => {
    // h in [0,360), s,l in [0,1]
    const hue = h / 360;
    let r, g, b;
    if (s === 0) {
      r = g = b = l; // achromatic
    } else {
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      r = hueToRgb(p, q, hue + 1 / 3);
      g = hueToRgb(p, q, hue);
      b = hueToRgb(p, q, hue - 1 / 3);
    }
    return {
      r: Math.round(r * 255),
      g: Math.round(g * 255),
      b: Math.round(b * 255),
    };
  };

  const colorNameFromRgb = (r, g, b) => {
    const NAMED = {
      black: [0, 0, 0],
      white: [255, 255, 255],
      red: [255, 0, 0],
      lime: [0, 255, 0],
      blue: [0, 0, 255],
      yellow: [255, 255, 0],
      cyan: [0, 255, 255],
      magenta: [255, 0, 255],
      silver: [192, 192, 192],
      gray: [128, 128, 128],
      maroon: [128, 0, 0],
      olive: [128, 128, 0],
      purple: [128, 0, 128],
      teal: [0, 128, 128],
      navy: [0, 0, 128],
      orange: [255, 165, 0],
      gold: [255, 215, 0],
      pink: [255, 192, 203],
      brown: [165, 42, 42],
      coral: [255, 127, 80],
      salmon: [250, 128, 114],
      khaki: [240, 230, 140],
    };
    let best = null;
    let bestDist = Infinity;
    for (const [name, vals] of Object.entries(NAMED)) {
      const dr = r - vals[0];
      const dg = g - vals[1];
      const db = b - vals[2];
      const dist = Math.sqrt(dr * dr + dg * dg + db * db);
      if (dist < bestDist) {
        bestDist = dist;
        best = name;
      }
    }
    if (bestDist < 60 && best) {
      // Capitalize
      return best.charAt(0).toUpperCase() + best.slice(1);
    }
    return 'Custom';
  };

  // Parse base color to RGB
  const parseColor = (input) => {
    if (typeof input !== 'string') return null;
    const s = input.trim().toLowerCase();

    // Hex formats
    if (s.startsWith('#')) {
      let hex = s.slice(1);
      if (hex.length === 3) {
        hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
      } else if (hex.length !== 6) {
        return null;
      }
      const r = parseInt(hex.substring(0, 2), 16);
      const g = parseInt(hex.substring(2, 4), 16);
      const b = parseInt(hex.substring(4, 6), 16);
      if ([r, g, b].some((v) => Number.isNaN(v))) return null;
      return { r, g, b };
    }

    // rgb(...) format
    const rgbMatch = s.match(/^rgb\s*\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)$/);
    if (rgbMatch) {
      const r = parseInt(rgbMatch[1], 10);
      const g = parseInt(rgbMatch[2], 10);
      const b = parseInt(rgbMatch[3], 10);
      if (
        [r, g, b].some((v) => Number.isNaN(v)) ||
        r < 0 ||
        r > 255 ||
        g < 0 ||
        g > 255 ||
        b < 0 ||
        b > 255
      ) {
        return null;
      }
      return { r, g, b };
    }

    // Named colors
    const NAMED = {
      black: [0, 0, 0],
      white: [255, 255, 255],
      red: [255, 0, 0],
      lime: [0, 255, 0],
      blue: [0, 0, 255],
      yellow: [255, 255, 0],
      cyan: [0, 255, 255],
      magenta: [255, 0, 255],
      silver: [192, 192, 192],
      gray: [128, 128, 128],
      maroon: [128, 0, 0],
      olive: [128, 128, 0],
      purple: [128, 0, 128],
      teal: [0, 128, 128],
      navy: [0, 0, 128],
      orange: [255, 165, 0],
      gold: [255, 215, 0],
      pink: [255, 192, 203],
      brown: [165, 42, 42],
      coral: [255, 127, 80],
      salmon: [250, 128, 114],
      khaki: [240, 230, 140],
    };
    if (typeof NAMED[s] !== 'undefined') {
      const [r, g, b] = NAMED[s];
      return { r, g, b };
    }

    // Fallback: not parseable
    return null;
  };

  // Normalize inputs
  const cnt = Math.max(1, Math.min(20, Number(count) || 5));
  const t = (type || 'analogous').toLowerCase();
  const parsed = parseColor(baseColor);
  let baseH = 0;
  let baseS = 0.65;
  let baseL = 0.5;
  if (parsed) {
    const hsl = rgbToHsl(parsed.r, parsed.g, parsed.b);
    baseH = hsl.h;
    baseS = clamp(hsl.s, 0, 1);
    baseL = clamp(hsl.l, 0, 1);
  }

  // Generate hue list based on type
  let hues = [];
  if (t === 'analogous') {
    if (cnt === 1) {
      hues = [baseH];
    } else {
      const range = 60; // +/- range
      const start = baseH - range;
      const step = (2 * range) / (cnt - 1);
      for (let i = 0; i < cnt; i++) {
        const hue = ((start + i * step) % 360 + 360) % 360;
        hues.push(hue);
      }
    }
  } else if (t === 'complementary') {
    if (cnt === 1) {
      hues = [baseH];
    } else {
      const step = 180 / (cnt - 1);
      for (let i = 0; i < cnt; i++) {
        const hue = ((baseH + i * step) % 360 + 360) % 360;
        hues.push(hue);
      }
    }
  } else if (t === 'triadic') {
    if (cnt === 1) {
      hues = [baseH];
    } else {
      // Use triadic anchors and distribute additional colors around them
      const anchors = [0, 120, 240];
      for (let i = 0; i < cnt; i++) {
        const anchor = anchors[i % 3];
        const extraGroups = Math.floor(i / 3);
        const hue = ((baseH + anchor + extraGroups * 20) % 360 + 360) % 360;
        hues.push(hue);
      }
    }
  } else {
    // Fallback to analogous
    const range = 60;
    const start = baseH - range;
    const step = cnt > 1 ? (2 * range) / (cnt - 1) : 0;
    for (let i = 0; i < cnt; i++) {
      const hue = ((start + i * step) % 360 + 360) % 360;
      hues.push(hue);
    }
  }

  // Build color list
  const colors = [];
  for (let i = 0; i < cnt; i++) {
    const h = hues[i];
    // Slight variation per color for visual diversity
    const tNorm = cnt > 1 ? i / (cnt - 1) : 0;
    const s = clamp(baseS * (0.9 + tNorm * 0.25), 0, 1);
    const l = clamp(baseL * (0.85 + tNorm * 0.3), 0, 1);

    const rgb = hslToRgb(h, s, l);
    const hex = rgbToHex(rgb.r, rgb.g, rgb.b);
    const rgbStr = rgbToString(rgb.r, rgb.g, rgb.b);
    const hslStr =
      'hsl(' +
      Math.round((h + 360) % 360) +
      ', ' +
      Math.round(s * 100) +
      '%, ' +
      Math.round(l * 100) +
      '%)';

    const name = colorNameFromRgb(rgb.r, rgb.g, rgb.b);

    colors.push({ hex, rgb: rgbStr, hsl: hslStr, name });
  }

  const scheme =
    `${t.charAt(0).toUpperCase() + t.slice(1)} palette around base hue ${Math.round(baseH)}Â° with ${cnt} color${cnt === 1 ? '' : 's'}`;

  return { colors, scheme };
}
