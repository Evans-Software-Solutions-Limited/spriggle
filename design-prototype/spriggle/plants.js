/* Spriggle — plant icon generators for the 3 visual directions.
   Each function returns an inline <svg> string (viewBox 0 0 100 100).
   Plant identities: watermelon, flower, aubergine, tomato, pumpkin.
   Differentiated by SILHOUETTE + COLOUR + PATTERN (accessibility). */

const PLANTS = ['watermelon', 'flower', 'aubergine', 'tomato', 'pumpkin'];

/* ---------- shared silhouette path data ---------- */
function petals(cx, cy, rx, ry, fill, stroke) {
  let p = '';
  for (let i = 0; i < 6; i++) {
    const a = i * 60;
    p += `<ellipse cx="${cx}" cy="${cy - 22}" rx="${rx}" ry="${ry}" fill="${fill}" ${stroke ? `stroke="${stroke}" stroke-width="2"` : ''} transform="rotate(${a} ${cx} ${cy})"/>`;
  }
  return p;
}

/* ============================================================
   DIRECTION 1 — HEIRLOOM  (flat, illustrated, soft inked edges)
   ============================================================ */
function heirloom(type) {
  const ink = '#3a2f23';
  switch (type) {
    case 'watermelon':
      return `<svg viewBox="0 0 100 100">
        <path d="M16,72 Q50,14 84,72 Z" fill="#2f7d4f" stroke="${ink}" stroke-width="3" stroke-linejoin="round"/>
        <path d="M24,71 Q50,26 76,71 Z" fill="#bfe3a8"/>
        <path d="M30,70 Q50,33 70,70 Z" fill="#e1604f"/>
        <g fill="${ink}"><ellipse cx="44" cy="56" rx="2.2" ry="3.4"/><ellipse cx="56" cy="56" rx="2.2" ry="3.4"/><ellipse cx="50" cy="48" rx="2.2" ry="3.4"/><ellipse cx="38" cy="64" rx="2.2" ry="3.4"/><ellipse cx="62" cy="64" rx="2.2" ry="3.4"/></g>
      </svg>`;
    case 'flower':
      return `<svg viewBox="0 0 100 100">
        ${petals(50, 50, 9.5, 17, '#f2b23e', ink)}
        <circle cx="50" cy="50" r="12.5" fill="#8a5a2b" stroke="${ink}" stroke-width="3"/>
        <g fill="#f2d9a0"><circle cx="46" cy="47" r="2"/><circle cx="54" cy="47" r="2"/><circle cx="50" cy="53" r="2"/><circle cx="45" cy="53" r="2"/><circle cx="55" cy="53" r="2"/></g>
      </svg>`;
    case 'aubergine':
      return `<svg viewBox="0 0 100 100">
        <path d="M62,34 C50,28 33,40 33,58 C33,76 47,86 58,82 C72,77 74,58 70,46 C68,40 66,36 62,34 Z" fill="#6b4396" stroke="${ink}" stroke-width="3" stroke-linejoin="round"/>
        <path d="M44,46 C40,52 40,62 44,70" fill="none" stroke="#a273d6" stroke-width="4" stroke-linecap="round"/>
        <path d="M64,30 C58,24 50,24 46,30 C52,32 54,36 54,40 C60,38 64,36 66,32 Z" fill="#3f7d3f" stroke="${ink}" stroke-width="3" stroke-linejoin="round"/>
        <path d="M58,32 L62,22" stroke="${ink}" stroke-width="3" stroke-linecap="round"/>
      </svg>`;
    case 'tomato':
      return `<svg viewBox="0 0 100 100">
        <ellipse cx="50" cy="58" rx="30" ry="27" fill="#d8463a" stroke="${ink}" stroke-width="3"/>
        <path d="M38,42 Q50,50 62,42" fill="none" stroke="#b5362c" stroke-width="3" stroke-linecap="round"/>
        <path d="M50,36 l6,-7 l3,7 l8,-3 l-5,8 l8,2 l-8,4 q-6,-7 -12,-7 q-6,0 -12,7 l-8,-4 l8,-2 l-5,-8 l8,3 l3,-7 Z" fill="#4a8a3c" stroke="${ink}" stroke-width="2.5" stroke-linejoin="round"/>
      </svg>`;
    case 'pumpkin':
      return `<svg viewBox="0 0 100 100">
        <ellipse cx="32" cy="60" rx="18" ry="24" fill="#e08a36" stroke="${ink}" stroke-width="3"/>
        <ellipse cx="68" cy="60" rx="18" ry="24" fill="#e08a36" stroke="${ink}" stroke-width="3"/>
        <ellipse cx="50" cy="60" rx="26" ry="26" fill="#ef9b3e" stroke="${ink}" stroke-width="3"/>
        <path d="M40,40 C36,52 36,68 40,80 M60,40 C64,52 64,68 60,80" fill="none" stroke="#c9742a" stroke-width="3" stroke-linecap="round"/>
        <path d="M50,36 C49,28 53,24 57,23" fill="none" stroke="#5a7a2e" stroke-width="5" stroke-linecap="round"/>
      </svg>`;
  }
}

/* ============================================================
   DIRECTION 2 — JUICY  (glossy soft-3D gems on dark soil)
   ============================================================ */
function juicy(type, idx) {
  const gid = 'jg' + type;
  const gloss = `<ellipse cx="40" cy="34" rx="14" ry="9" fill="#ffffff" opacity="0.45" transform="rotate(-25 40 34)"/>`;
  const shadow = `<ellipse cx="50" cy="88" rx="24" ry="5" fill="#000" opacity="0.28"/>`;
  switch (type) {
    case 'watermelon':
      return `<svg viewBox="0 0 100 100">${shadow}
        <defs><radialGradient id="${gid}" cx="38%" cy="30%" r="80%"><stop offset="0%" stop-color="#ff8a6b"/><stop offset="60%" stop-color="#f2483c"/><stop offset="100%" stop-color="#c92f28"/></radialGradient></defs>
        <path d="M14,70 Q50,10 86,70 Z" fill="#1f7a44"/>
        <path d="M22,69 Q50,22 78,69 Z" fill="#7ee08a"/>
        <path d="M28,68 Q50,30 72,68 Z" fill="url(#${gid})"/>
        <g fill="#3a2f23"><ellipse cx="44" cy="55" rx="2.4" ry="3.6"/><ellipse cx="56" cy="55" rx="2.4" ry="3.6"/><ellipse cx="50" cy="47" rx="2.4" ry="3.6"/><ellipse cx="38" cy="62" rx="2.4" ry="3.6"/><ellipse cx="62" cy="62" rx="2.4" ry="3.6"/></g>
        <path d="M34,40 Q50,32 66,40" stroke="#fff" stroke-width="3" fill="none" opacity="0.4" stroke-linecap="round"/>
      </svg>`;
    case 'flower':
      return `<svg viewBox="0 0 100 100">${shadow}
        <defs><radialGradient id="${gid}" cx="40%" cy="32%" r="75%"><stop offset="0%" stop-color="#ffe08a"/><stop offset="70%" stop-color="#ffc23d"/><stop offset="100%" stop-color="#e89412"/></radialGradient></defs>
        ${(() => { let p=''; for(let i=0;i<7;i++){const a=i*(360/7); p+=`<ellipse cx="50" cy="27" rx="9" ry="16" fill="url(#${gid})" transform="rotate(${a} 50 50)"/>`;} return p;})()}
        <circle cx="50" cy="50" r="13" fill="#8a4a1e"/>
        <circle cx="50" cy="50" r="13" fill="url(#${gid})" opacity="0.0"/>
        <circle cx="46" cy="46" r="5" fill="#a55f2a"/>
        ${gloss}
      </svg>`;
    case 'aubergine':
      return `<svg viewBox="0 0 100 100">${shadow}
        <defs><radialGradient id="${gid}" cx="38%" cy="30%" r="80%"><stop offset="0%" stop-color="#b07ee0"/><stop offset="55%" stop-color="#7a3fb8"/><stop offset="100%" stop-color="#4e2380"/></radialGradient></defs>
        <path d="M64,34 C50,26 31,40 31,60 C31,79 47,88 60,83 C75,77 77,56 72,44 C70,38 68,37 64,34 Z" fill="url(#${gid})"/>
        <path d="M66,30 C59,22 49,22 44,29 C51,31 54,36 54,41 C61,39 66,36 68,31 Z" fill="#46a04a"/>
        <path d="M58,30 L63,20" stroke="#2f7a33" stroke-width="4" stroke-linecap="round"/>
        <ellipse cx="44" cy="42" rx="8" ry="14" fill="#fff" opacity="0.35" transform="rotate(-20 44 42)"/>
      </svg>`;
    case 'tomato':
      return `<svg viewBox="0 0 100 100">${shadow}
        <defs><radialGradient id="${gid}" cx="38%" cy="30%" r="78%"><stop offset="0%" stop-color="#ff8a5c"/><stop offset="55%" stop-color="#f0392f"/><stop offset="100%" stop-color="#c4241c"/></radialGradient></defs>
        <ellipse cx="50" cy="59" rx="31" ry="28" fill="url(#${gid})"/>
        <path d="M50,35 l6,-7 l3,7 l8,-3 l-5,8 l8,2 l-8,4 q-6,-7 -12,-7 q-6,0 -12,7 l-8,-4 l8,-2 l-5,-8 l8,3 l3,-7 Z" fill="#3fa047"/>
        <ellipse cx="40" cy="46" rx="9" ry="6" fill="#fff" opacity="0.5" transform="rotate(-22 40 46)"/>
      </svg>`;
    case 'pumpkin':
      return `<svg viewBox="0 0 100 100">${shadow}
        <defs><radialGradient id="${gid}" cx="40%" cy="32%" r="80%"><stop offset="0%" stop-color="#ffb35c"/><stop offset="60%" stop-color="#f2852a"/><stop offset="100%" stop-color="#cc5f18"/></radialGradient></defs>
        <ellipse cx="32" cy="61" rx="18" ry="24" fill="url(#${gid})"/>
        <ellipse cx="68" cy="61" rx="18" ry="24" fill="url(#${gid})"/>
        <ellipse cx="50" cy="61" rx="27" ry="27" fill="url(#${gid})"/>
        <path d="M40,42 C36,54 36,68 40,80 M60,42 C64,54 64,68 60,80" fill="none" stroke="#c25e16" stroke-width="2.5" stroke-linecap="round" opacity="0.7"/>
        <path d="M50,37 C49,28 54,24 58,23" fill="none" stroke="#4e7a2e" stroke-width="5" stroke-linecap="round"/>
        <ellipse cx="42" cy="48" rx="7" ry="10" fill="#fff" opacity="0.35" transform="rotate(-15 42 48)"/>
      </svg>`;
  }
}

/* ============================================================
   DIRECTION 3 — BOTANICAL MONO (geometric, flat, pattern fills)
   ============================================================ */
function mono(type) {
  const stroke = '#1d2b24';
  const sw = 2.6;
  switch (type) {
    case 'watermelon':
      return `<svg viewBox="0 0 100 100">
        <path d="M20,68 A30,30 0 0 1 80,68 Z" fill="#2c8f63" stroke="${stroke}" stroke-width="${sw}" stroke-linejoin="round"/>
        <path d="M27,67 A23,23 0 0 1 73,67 Z" fill="#fff"/>
        <path d="M27,67 A23,23 0 0 1 73,67 Z" fill="none" stroke="${stroke}" stroke-width="${sw}"/>
        <g stroke="${stroke}" stroke-width="2.2" stroke-linecap="round"><line x1="42" y1="58" x2="42" y2="64"/><line x1="50" y1="54" x2="50" y2="60"/><line x1="58" y1="58" x2="58" y2="64"/></g>
      </svg>`;
    case 'flower':
      return `<svg viewBox="0 0 100 100">
        ${(() => { let p=''; for(let i=0;i<6;i++){const a=i*60; p+=`<circle cx="50" cy="30" r="11" fill="#fff" stroke="${stroke}" stroke-width="${sw}" transform="rotate(${a} 50 50)"/>`;} return p;})()}
        <circle cx="50" cy="50" r="11" fill="#e9b23a" stroke="${stroke}" stroke-width="${sw}"/>
      </svg>`;
    case 'aubergine':
      return `<svg viewBox="0 0 100 100">
        <defs><pattern id="mhatch" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="7" stroke="#7a4ea8" stroke-width="3"/></pattern></defs>
        <path d="M63,35 C50,29 34,41 34,59 C34,77 48,86 59,81 C72,76 74,57 70,46 C68,40 66,38 63,35 Z" fill="#6b4396" stroke="${stroke}" stroke-width="${sw}" stroke-linejoin="round"/>
        <path d="M63,35 C50,29 34,41 34,59 C34,77 48,86 59,81 C72,76 74,57 70,46 C68,40 66,38 63,35 Z" fill="url(#mhatch)" opacity="0.55"/>
        <path d="M64,31 C58,25 50,25 46,31 C52,33 54,37 54,41 C59,39 63,36 65,32 Z" fill="#3f7d3f" stroke="${stroke}" stroke-width="${sw}" stroke-linejoin="round"/>
      </svg>`;
    case 'tomato':
      return `<svg viewBox="0 0 100 100">
        <ellipse cx="50" cy="58" rx="29" ry="26" fill="#d8463a" stroke="${stroke}" stroke-width="${sw}"/>
        <g fill="#fff"><circle cx="42" cy="54" r="2.4"/><circle cx="54" cy="50" r="2.4"/><circle cx="58" cy="62" r="2.4"/><circle cx="44" cy="66" r="2.4"/><circle cx="50" cy="60" r="2.4"/></g>
        <path d="M50,36 l5,-7 l3,7 l7,-2 l-4,7 l7,2 l-7,3 q-5,-6 -11,-6 q-6,0 -11,6 l-7,-3 l7,-2 l-4,-7 l7,2 l3,-7 Z" fill="#4a8a3c" stroke="${stroke}" stroke-width="2.2" stroke-linejoin="round"/>
      </svg>`;
    case 'pumpkin':
      return `<svg viewBox="0 0 100 100">
        <ellipse cx="33" cy="60" rx="16" ry="23" fill="#ef9b3e" stroke="${stroke}" stroke-width="${sw}"/>
        <ellipse cx="67" cy="60" rx="16" ry="23" fill="#ef9b3e" stroke="${stroke}" stroke-width="${sw}"/>
        <ellipse cx="50" cy="60" rx="24" ry="25" fill="#ef9b3e" stroke="${stroke}" stroke-width="${sw}"/>
        <g fill="none" stroke="${stroke}" stroke-width="2.2" stroke-linecap="round"><path d="M42,41 C39,52 39,68 42,79"/><path d="M58,41 C61,52 61,68 58,79"/></g>
        <path d="M50,37 C49,30 53,26 57,25" fill="none" stroke="#5a7a2e" stroke-width="5" stroke-linecap="round"/>
      </svg>`;
  }
}

const RENDERERS = { heirloom, juicy, mono };
