/* =====================================================================
   SPRIGGLE — Classic game engine + screen.  Screens.game(host, opts)
   Real loop: tap-Dig clears a connected group of 5+, Swap trades two
   adjacent plants. Board refills (+3 per dig, +6 per swap). Endless
   highscore chase; lose when the patch fills with no group to dig.
   Depends on: plants.js, board.js, mascot.js, global App.
   ===================================================================== */
window.Screens = window.Screens || {};

Screens.game = function (host, opts = {}) {
  const N = 8;
  let G = []; // grid
  let score = 0,
    coinsEarned = 0,
    tool = "dig",
    swapSel = null,
    busy = false,
    ended = false;

  /* ---------- model ---------- */
  const rnd = () => Math.floor(Math.random() * 5);
  function fresh() {
    // start from an EMPTY patch — seed only a sparse scattering that fills
    // through play (one guaranteed diggable cluster so the first move works)
    G = Array.from({ length: N }, () => Array.from({ length: N }, () => -1));
    const t = rnd();
    let r = 2 + Math.floor(Math.random() * (N - 4)),
      c = 2 + Math.floor(Math.random() * (N - 4));
    const dirs = [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ];
    const blob = [[r, c]];
    G[r][c] = t;
    let guard = 0;
    while (blob.length < 5 && guard++ < 200) {
      const [br, bc] = blob[Math.floor(Math.random() * blob.length)];
      const [dy, dx] = dirs[Math.floor(Math.random() * 4)];
      const ny = br + dy,
        nx = bc + dx;
      if (inB(ny, nx) && G[ny][nx] < 0) {
        G[ny][nx] = t;
        blob.push([ny, nx]);
      }
    }
    // scatter a handful of singles around the empty soil
    let scatter = 16,
      g2 = 0;
    while (scatter > 0 && g2++ < 500) {
      const ry = Math.floor(Math.random() * N),
        rx = Math.floor(Math.random() * N);
      if (G[ry][rx] < 0) {
        G[ry][rx] = rnd();
        scatter--;
      }
    }
  }
  function inB(r, c) {
    return r >= 0 && c >= 0 && r < N && c < N;
  }
  function group(r, c) {
    const t = G[r][c];
    if (t < 0) return [];
    const seen = new Set([r + "-" + c]),
      st = [[r, c]],
      out = [];
    while (st.length) {
      const [y, x] = st.pop();
      out.push([y, x]);
      [
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1],
      ].forEach(([dy, dx]) => {
        const ny = y + dy,
          nx = x + dx,
          k = ny + "-" + nx;
        if (inB(ny, nx) && G[ny][nx] === t && !seen.has(k)) {
          seen.add(k);
          st.push([ny, nx]);
        }
      });
    }
    return out;
  }
  function anyDiggable() {
    const seen = new Set();
    for (let r = 0; r < N; r++)
      for (let c = 0; c < N; c++) {
        if (G[r][c] < 0 || seen.has(r + "-" + c)) continue;
        const g = group(r, c);
        g.forEach(([y, x]) => seen.add(y + "-" + x));
        if (g.length >= 5) return true;
      }
    return false;
  }
  const isFull = () => G.every((row) => row.every((v) => v >= 0));
  function emptyCells() {
    const e = [];
    for (let r = 0; r < N; r++)
      for (let c = 0; c < N; c++) if (G[r][c] < 0) e.push([r, c]);
    return e;
  }
  function pts(n) {
    return Math.round((n * 15 + (n - 5) * (n - 5) * 5) / 5) * 5;
  }

  /* ---------- DOM ---------- */
  host.innerHTML = `
    <div class="screen enter" style="gap:26px;">
      <div class="board-col"><div id="boardHost"></div></div>
      <div class="rail">
        <div class="rail-top">
          <div class="brand" style="font-size:30px"><span class="seed">${SEED_SVG}</span>Spriggle</div>
          <button class="icon-btn" id="pauseBtn" title="Pause">${PAUSE_SVG}</button>
        </div>
        <div class="card score-card">
          <div><div class="lab">Score</div><div class="val" id="scoreVal">0</div></div>
          <div class="best"><div class="bl">Best</div><div class="bv" id="bestVal">0</div></div>
        </div>
        <div class="card tool-mod">
          <div class="mascot-stage"><div class="speech" id="speech">Dig a patch of <b>5 or more</b>!</div><div id="mascot"></div></div>
          <div class="spawn">
            <div class="pill on" id="spawnDig"><span class="n">+3</span> seeds <span class="sd">per dig</span></div>
            <div class="pill off" id="spawnSwap"><span class="n">+6</span> seeds <span class="sd">per swap</span></div>
          </div>
          <div class="selector">
            <button class="tool-btn active" id="btnDig"><span class="kbd">1</span><span class="ico" id="icoDig"></span><span class="row"><span class="tn">Dig</span></span><span class="ts">Clear a group of 5+</span></button>
            <button class="tool-btn" id="btnSwap"><span class="kbd">2</span><span class="ico" id="icoSwap"></span><span class="row"><span class="tn">Swap</span></span><span class="ts">Trade any two to set up</span></button>
          </div>
        </div>
        <div class="rail-bottom">
          <div class="coin-chip"><span class="c">¢</span><span class="cv" id="coinVal">${App.state.coins}</span><span class="plus">+</span></div>
          <button class="icon-btn" id="puBtn" title="Power-ups">${BOLT_SVG}</button>
        </div>
      </div>
    </div>`;

  const boardHost = host.querySelector("#boardHost");
  const $ = (s) => host.querySelector(s);
  const scoreVal = $("#scoreVal"),
    bestVal = $("#bestVal"),
    coinVal = $("#coinVal"),
    speech = $("#speech");
  bestVal.textContent = App.fmt(App.state.best);

  fresh();
  plantIntro();
  renderMascot();
  $("#icoDig").innerHTML = toolGlyph("dig", "var(--on-primary)", 22);
  $("#icoSwap").innerHTML = toolGlyph("swap", "var(--ink)", 22);

  function paintBoard() {
    boardHost.innerHTML = renderPatch(G, {
      overlay: `<div id="boardOv" style="position:absolute;inset:0;pointer-events:none;z-index:7"></div>`,
    });
    bindCells();
  }
  // open a run from an empty patch, then grow the plants in diagonally
  function plantIntro() {
    busy = true;
    boardHost.innerHTML = renderPatch(emptyBoard(N), {
      overlay: `<div id="boardOv" style="position:absolute;inset:0;pointer-events:none;z-index:7"></div>`,
    });
    bindCells();
    const els = cellEls();
    const order = [];
    for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) order.push([r, c]);
    order.sort((a, b) => a[0] + a[1] - (b[0] + b[1]));
    order.forEach(([r, c], i) =>
      setTimeout(() => setCellDom(els[r * N + c], G[r][c], true), 160 + i * 12),
    );
    setTimeout(
      () => {
        busy = false;
      },
      160 + order.length * 12 + 260,
    );
  }
  function cellEls() {
    return [...boardHost.querySelectorAll(".grid .cell")];
  }
  function cellAt(r, c) {
    return cellEls()[r * N + c];
  }
  function soil() {
    return boardHost.querySelector(".soil");
  }

  function setCellDom(el, v, spawn) {
    el.className = "cell" + (v < 0 ? " empty" : "") + (spawn ? " spawned" : "");
    el.innerHTML = v < 0 ? "" : juicy(PLANTS[v], v);
  }

  /* ---------- interaction ---------- */
  function bindCells() {
    const els = cellEls();
    els.forEach((el, i) => {
      const r = Math.floor(i / N),
        c = i % N;
      el.style.touchAction = "manipulation";
      el.onpointerdown = () => preview(r, c);
      el.onpointerenter = (e) => {
        if (e.pressure || e.buttons) preview(r, c);
      };
      el.onpointerleave = clearPreview;
      el.onclick = () => act(r, c);
    });
  }
  function clearPreview() {
    boardHost
      .querySelectorAll(".cell.hl")
      .forEach((e) => e.classList.remove("hl"));
    boardHost.querySelectorAll(".predig-pop").forEach((e) => e.remove());
  }
  function preview(r, c) {
    if (busy || ended || tool !== "dig" || G[r][c] < 0) return;
    clearPreview();
    const g = group(r, c);
    if (g.length < 5) return;
    const els = cellEls();
    g.forEach(([y, x]) => els[y * N + x].classList.add("hl"));
    // popup above group
    let minTop = 1e9,
      sx = 0;
    g.forEach(([y, x]) => {
      const e = els[y * N + x];
      minTop = Math.min(minTop, e.offsetTop);
      sx += e.offsetLeft + e.offsetWidth / 2;
    });
    const cx = sx / g.length;
    const pop = document.createElement("div");
    pop.className = "predig-pop";
    pop.style.cssText = `position:absolute;left:${cx}px;top:${minTop - 6}px;transform:translate(-50%,-100%);z-index:9;background:var(--ink);color:#fff;border-radius:12px;padding:7px 12px;text-align:center;box-shadow:var(--e-pop);pointer-events:none;`;
    pop.innerHTML = `<div style="font-family:var(--font-d);font-weight:700;font-size:20px;color:var(--gold);line-height:1">+${pts(g.length)}</div><div style="font-size:10px;font-weight:800;letter-spacing:.04em;opacity:.85">DIG · ${g.length} ${PLANT_LABELS[G[r][c]]}</div>`;
    soil().appendChild(pop);
  }

  function act(r, c) {
    if (busy || ended) return;
    if (G[r][c] < 0 && tool === "dig") return;
    if (tool === "dig") doDig(r, c);
    else doSwap(r, c);
  }

  function doDig(r, c) {
    const g = group(r, c);
    if (g.length < 5) {
      clearPreview();
      cellAt(r, c).classList.add("shake");
      setTimeout(() => cellAt(r, c).classList.remove("shake"), 420);
      App.haptic("warning");
      App.toast(`Need 5+ — that patch has ${g.length}`, "err");
      return;
    }
    busy = true;
    clearPreview();
    const gained = pts(g.length),
      els = cellEls();
    App.haptic("success");
    // score popup at centroid
    let sx = 0,
      sy = 0;
    g.forEach(([y, x]) => {
      const e = els[y * N + x];
      sx += e.offsetLeft + e.offsetWidth / 2;
      sy += e.offsetTop;
    });
    floatScore(sx / g.length, sy / g.length, gained, g.length >= 7);
    g.forEach(([y, x]) => els[y * N + x].classList.add("clearing"));
    if (g.length >= 8) coinsEarned += 1;
    setTimeout(() => {
      g.forEach(([y, x]) => {
        G[y][x] = -1;
        setCellDom(els[y * N + x], -1, false);
      });
      addScore(gained);
      spawn(3, () => {
        busy = false;
        afterMove();
      });
    }, 320);
  }

  function doSwap(r, c) {
    if (G[r][c] < 0) return;
    if (!swapSel) {
      swapSel = [r, c];
      cellAt(r, c).classList.add("sel");
      App.haptic("light");
      return;
    }
    const [sr, sc] = swapSel;
    if (sr === r && sc === c) {
      swapSel = null;
      cellAt(r, c).classList.remove("sel");
      return;
    }
    if (G[sr][sc] === G[r][c]) {
      cellAt(r, c).classList.add("shake");
      setTimeout(() => cellAt(r, c).classList.remove("shake"), 420);
      App.haptic("warning");
      App.toast("Pick two different plants", "err");
      cellAt(sr, sc).classList.remove("sel");
      swapSel = null;
      return;
    }
    busy = true;
    const a = G[sr][sc],
      b = G[r][c];
    G[sr][sc] = b;
    G[r][c] = a;
    cellAt(sr, sc).classList.remove("sel");
    setCellDom(cellAt(sr, sc), b, true);
    setCellDom(cellAt(r, c), a, true);
    App.haptic("medium");
    swapSel = null;
    spawn(6, () => {
      busy = false;
      afterMove();
    });
  }

  function spawn(n, done) {
    const empties = emptyCells();
    for (let i = empties.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [empties[i], empties[j]] = [empties[j], empties[i]];
    }
    const pick = empties.slice(0, Math.min(n, empties.length));
    pick.forEach(([r, c], i) => {
      setTimeout(
        () => {
          G[r][c] = rnd();
          setCellDom(cellAt(r, c), G[r][c], true);
        },
        60 + i * 45,
      );
    });
    setTimeout(done, 80 + pick.length * 45 + 220);
  }

  function afterMove() {
    coinVal.textContent = App.fmt(App.state.coins + coinsEarned);
    if (isFull() && !anyDiggable()) endRun();
  }

  /* ---------- score ---------- */
  function addScore(n) {
    const from = score;
    score += n;
    const t0 = performance.now();
    (function step(t) {
      const k = Math.min(1, (t - t0) / 420);
      scoreVal.textContent = App.fmt(Math.round(from + (score - from) * k));
      if (k < 1) requestAnimationFrame(step);
    })(t0);
  }
  function floatScore(x, y, n, big) {
    const p = document.createElement("div");
    p.className = "score-pop";
    p.style.left = x + "px";
    p.style.top = y + "px";
    p.innerHTML = `<span class="g">+${App.fmt(n)}</span>${big ? " 🌟" : ""}`;
    if (big) p.style.fontSize = "24px";
    soil().appendChild(p);
    setTimeout(() => p.remove(), 1000);
  }

  /* ---------- tools ---------- */
  function renderMascot() {
    $("#mascot").innerHTML = mascot(tool, {});
  }
  function setTool(t) {
    if (t === tool) return;
    tool = t;
    swapSel && cellEls().forEach((e) => e.classList.remove("sel"));
    swapSel = null;
    $("#btnDig").classList.toggle("active", t === "dig");
    $("#btnSwap").classList.toggle("active", t === "swap");
    $("#icoDig").innerHTML = toolGlyph(
      "dig",
      t === "dig" ? "var(--on-primary)" : "var(--ink)",
      22,
    );
    $("#icoSwap").innerHTML = toolGlyph(
      "swap",
      t === "swap" ? "var(--on-primary)" : "var(--ink)",
      22,
    );
    $("#spawnDig").className = "pill " + (t === "dig" ? "on" : "off");
    $("#spawnSwap").className = "pill " + (t === "swap" ? "on" : "off");
    speech.innerHTML =
      t === "dig"
        ? "Dig a patch of <b>5 or more</b>!"
        : "Swap two to build a <b>bigger</b> patch.";
    renderMascot();
    App.haptic("light");
  }
  $("#btnDig").onclick = () => setTool("dig");
  $("#btnSwap").onclick = () => setTool("swap");
  $("#pauseBtn").onclick = openPause;
  $("#puBtn").onclick = () => App.toast("Power-ups arrive with the Shop 🌱");

  function onKey(e) {
    if (e.key === "1") setTool("dig");
    else if (e.key === "2") setTool("swap");
    else if (e.key === "Escape") openPause();
  }
  window.addEventListener("keydown", onKey);

  /* ---------- pause ---------- */
  function openPause() {
    App.sheet(
      `
      <h2>Paused</h2>
      <div class="sub">Your patch is safe — take your time.</div>
      <div class="actions">
        <button class="btn btn-primary btn-lg" data-act="resume">Resume</button>
        <button class="btn btn-ghost btn-md" data-act="restart">Restart run</button>
        <button class="btn btn-ghost btn-md" data-act="how">How to play</button>
        <button class="btn btn-ghost btn-md" data-act="settings">Settings</button>
        <button class="btn btn-ghost btn-md" data-act="home" style="color:var(--err)">Quit to garden</button>
      </div>`,
      (act, close) => {
        if (act === "resume") close();
        else if (act === "restart") {
          close();
          restart();
        } else if (act === "how") {
          close();
          App.go("onboarding", { from: "game" });
        } else if (act === "settings") {
          close();
          App.go("settings", { from: "game" });
        } else if (act === "home") {
          close();
          commitCoins();
          App.go("home");
        }
      },
    );
  }
  function restart() {
    score = 0;
    coinsEarned = 0;
    ended = false;
    busy = false;
    tool = "dig";
    setTool("dig");
    scoreVal.textContent = "0";
    fresh();
    plantIntro();
  }

  function commitCoins() {
    if (coinsEarned) {
      App.state.coins += coinsEarned;
      coinsEarned = 0;
      App.save();
    }
  }

  /* ---------- game over ---------- */
  function endRun() {
    ended = true;
    commitCoins();
    const isBest = score > App.state.best;
    if (isBest) {
      App.state.best = score;
      App.save();
    }
    setTimeout(
      () =>
        App.go("gameover", {
          score,
          isBest,
          coins: 0,
          replay: () => App.go("game"),
        }),
      600,
    );
  }

  return function cleanup() {
    window.removeEventListener("keydown", onKey);
  };
};

/* shared inline glyphs */
const SEED_SVG = `<svg viewBox="0 0 24 24" fill="none"><path d="M12 21c-5-3-7-8-7-12 4 0 7 3 7 7" stroke="var(--primary)" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/><path d="M12 16c0-4 3-7 7-7 0 4-2 9-7 12" stroke="var(--primary-300)" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const PAUSE_SVG = `<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="5" width="4" height="14" rx="1.5"/><rect x="14" y="5" width="4" height="14" rx="1.5"/></svg>`;
const BOLT_SVG = `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2L3 14h7l-1 8 10-12h-7z"/></svg>`;
const PLANT_LABELS = ["melon", "blooms", "auber", "tomato", "pumpkin"];
