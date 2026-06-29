/* Spriggle — reusable soil-patch board renderer.
   Depends on plants.js (PLANTS + juicy()).
   renderPatch(board, opts) -> HTML string for a <div class="patch">.
     board   : 2D array; value 0..4 = plant index, -1 = empty dug hole, null = locked/no-cell
     opts.highlight : Set of "r-c" keys to glow (pre-dig preview)
     opts.gap       : grid gap in px (default 6)
     opts.overlay   : HTML injected inside .patch (e.g. a +points popup)
*/

function grassTuft(scale = 1, flip = false) {
  return `<svg class="tuft" width="${64*scale}" height="${44*scale}" viewBox="0 0 64 44" style="${flip?'transform:scaleX(-1);':''}" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <g fill="var(--grass)" stroke="var(--grass-deep)" stroke-width="1.6" stroke-linejoin="round">
      <path d="M18 44 C 10 30 8 18 12 6 C 18 16 20 30 24 44 Z"/>
      <path d="M32 44 C 28 26 28 12 33 2 C 38 14 38 30 38 44 Z"/>
      <path d="M46 44 C 54 30 56 20 52 9 C 46 18 44 30 40 44 Z"/>
      <path d="M26 44 C 22 32 22 22 25 14 C 30 24 30 34 31 44 Z" fill="var(--grass-2)"/>
      <path d="M40 44 C 44 33 44 24 42 16 C 37 25 36 34 35 44 Z" fill="var(--grass-2)"/>
    </g>
  </svg>`;
}

function renderPatch(board, opts = {}) {
  const hl = opts.highlight || new Set();
  const gap = opts.gap != null ? opts.gap : 6;
  const cols = board[0].length;
  const rows = board.length;

  let cells = '';
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const v = board[r][c];
      if (v === null || v === undefined) { cells += `<div class="cell" style="visibility:hidden"></div>`; continue; }
      if (v < 0) { cells += `<div class="cell empty"></div>`; continue; }
      const hlc = hl.has(r + '-' + c) ? ' hl' : '';
      cells += `<div class="cell${hlc}">${juicy(PLANTS[v], v)}</div>`;
    }
  }

  // grass tufts overlapping the soil edges for the "patch" feel
  const tufts = `
    <div class="tuft" style="top:-14px;left:6%;">${grassTuft(0.95)}</div>
    <div class="tuft" style="top:-18px;left:34%;">${grassTuft(1.15)}</div>
    <div class="tuft" style="top:-13px;right:10%;">${grassTuft(0.9, true)}</div>
    <div class="tuft" style="bottom:-12px;left:14%;">${grassTuft(0.82, true)}</div>
    <div class="tuft" style="bottom:-15px;right:20%;">${grassTuft(1.0)}</div>`;

  return `<div class="patch">
    ${tufts}
    ${opts.overlay || ''}
    <div class="soil">
      <div class="grid" style="grid-template-columns:repeat(${cols},1fr);gap:${gap}px;">${cells}</div>
    </div>
  </div>`;
}

/* convenience: an all-empty board of given size */
function emptyBoard(n = 8) {
  return Array.from({ length: n }, () => Array.from({ length: n }, () => -1));
}
