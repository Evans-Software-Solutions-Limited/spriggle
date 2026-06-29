/* Spriggle mascot — a sprout sprite that picks up different tools.
   mascot(tool, opts) -> inline <svg> string.  tool: 'dig' | 'swap' | 'idle'
   Built so the same character reads at 80px (button) and 200px (hero). */

function mascot(tool = "dig", opts = {}) {
  const s = opts.size || 220; // square viewBox is 0 0 220 240
  const cls = opts.cls ? ` class="${opts.cls}"` : "";

  // shared palette
  const bodyTop = "#9fd36a",
    bodyBot = "#6fb33f",
    bodyEdge = "#4f8f2c";
  const cheek = "#e8915a";
  const ink = "#2f4a22";

  // sprout on the head
  const sprout = `
    <path d="M110 70 C110 54 108 44 110 36" fill="none" stroke="${bodyEdge}" stroke-width="6" stroke-linecap="round"/>
    <path d="M110 48 C96 44 86 32 90 22 C104 22 116 34 113 48 Z" fill="${bodyTop}" stroke="${bodyEdge}" stroke-width="3" stroke-linejoin="round"/>
    <path d="M111 44 C124 38 136 40 140 30 C128 22 114 28 110 42 Z" fill="${bodyTop}" stroke="${bodyEdge}" stroke-width="3" stroke-linejoin="round"/>
    <circle cx="110" cy="30" r="5" fill="#e8c33a" stroke="${bodyEdge}" stroke-width="2.5"/>`;

  // body + face (no ground shadow)
  const face = `
    <ellipse cx="92" cy="202" rx="13" ry="9" fill="${bodyBot}" stroke="${bodyEdge}" stroke-width="3"/>
    <ellipse cx="128" cy="202" rx="13" ry="9" fill="${bodyBot}" stroke="${bodyEdge}" stroke-width="3"/>
    <defs>
      <linearGradient id="mbody" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="${bodyTop}"/><stop offset="100%" stop-color="${bodyBot}"/>
      </linearGradient>
    </defs>
    <path d="M110 70
      C 154 70 174 104 174 142
      C 174 184 146 204 110 204
      C 74 204 46 184 46 142
      C 46 104 66 70 110 70 Z"
      fill="url(#mbody)" stroke="${bodyEdge}" stroke-width="4"/>
    <path d="M70 120 C 62 150 70 178 92 190" fill="none" stroke="#bde08a" stroke-width="6" stroke-linecap="round" opacity="0.6"/>
    <circle cx="93" cy="138" r="9.5" fill="${ink}"/>
    <circle cx="129" cy="138" r="9.5" fill="${ink}"/>
    <circle cx="96" cy="135" r="3" fill="#fff"/>
    <circle cx="132" cy="135" r="3" fill="#fff"/>
    <path d="M101 158 Q111 168 121 158" fill="none" stroke="${ink}" stroke-width="4" stroke-linecap="round"/>
    <ellipse cx="78" cy="156" rx="8" ry="5.5" fill="${cheek}" opacity="0.55"/>
    <ellipse cx="144" cy="156" rx="8" ry="5.5" fill="${cheek}" opacity="0.55"/>`;

  // left arm (down, resting)
  const leftArm = `<path d="M58 150 C 44 158 40 172 46 184" fill="none" stroke="${bodyBot}" stroke-width="11" stroke-linecap="round"/>`;

  let rightArm, toolArt;

  if (tool === "swap") {
    // both arms raised symmetrically, a small plant cradled in each hand,
    // swap arrows arcing between them — all kept well inside the viewBox
    rightArm = `
      <path d="M150 138 C 166 130 176 138 176 152" fill="none" stroke="${bodyBot}" stroke-width="11" stroke-linecap="round"/>
      <path d="M70 138 C 54 130 44 138 44 152" fill="none" stroke="${bodyBot}" stroke-width="11" stroke-linecap="round"/>`;
    toolArt = `
      <g transform="translate(32,128)"><circle cx="12" cy="16" r="13" fill="#e23b2f"/><circle cx="12" cy="16" r="13" fill="none" stroke="${ink}" stroke-width="2.5"/><path d="M12 5 l3 -5 l2 5 l5 -2 l-3 5 Z" fill="#3fa047"/><ellipse cx="8" cy="12" rx="3.6" ry="2.8" fill="#fff" opacity="0.5"/></g>
      <g transform="translate(152,128)"><path d="M11 4 C2 4 0 24 11 30 C22 24 20 4 11 4 Z" fill="#7a3fb8" stroke="${ink}" stroke-width="2.5"/><path d="M11 6 C6 1 16 0 18 4 C14 5 13 8 12 10 Z" fill="#46a04a"/></g>
      <g stroke="${ink}" stroke-width="4" fill="none" stroke-linecap="round">
        <path d="M88 104 C 100 96 120 96 132 104"/><path d="M132 104 l-6 -6 M132 104 l-1 -8"/>
        <path d="M132 120 C 120 128 100 128 88 120"/><path d="M88 120 l6 6 M88 120 l1 8"/>
      </g>`;
  } else {
    // dig: right arm raised holding a trowel
    rightArm = `<path d="M158 138 C 178 130 192 138 196 156" fill="none" stroke="${bodyBot}" stroke-width="11" stroke-linecap="round"/>`;
    toolArt = `
      <g transform="rotate(28 196 150)">
        <rect x="188" y="92" width="16" height="44" rx="8" fill="#c8693f" stroke="${ink}" stroke-width="2.5"/>
        <rect x="186" y="130" width="20" height="10" rx="3" fill="#b6bcc2" stroke="${ink}" stroke-width="2.5"/>
        <path d="M178 140 C 178 176 214 176 214 140 C 214 150 206 158 196 158 C 186 158 178 150 178 140 Z" fill="#cfd5db" stroke="${ink}" stroke-width="2.5" stroke-linejoin="round"/>
        <path d="M186 144 C 188 156 204 156 206 144" fill="none" stroke="#9aa1a8" stroke-width="2"/>
      </g>`;
  }

  return `<svg viewBox="0 0 220 240" width="${s}" height="${(s * 240) / 220}"${cls} xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    ${sprout}${face}${leftArm}${rightArm}${toolArt}
  </svg>`;
}

/* tool glyphs for the labelled selector buttons (always-visible, explicit) */
function toolGlyph(tool, color, size = 26) {
  if (tool === "swap") {
    return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9h13l-3-3"/><path d="M20 15H7l3 3"/></svg>`;
  }
  // dig = trowel
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 3.5l6 6-2.2 2.2-6-6z"/><path d="M11.6 6.4l-6.4 6.4a4 4 0 0 0 0 5.6 4 4 0 0 0 5.6 0l6.4-6.4"/></svg>`;
}
