/* =====================================================================
   SPRIGGLE — interactive onboarding. Screens.onboarding(host, opts)
   3 guided beats: Dig a group · Swap to set up · Dig the big patch.
   Skippable. Depends on plants.js, board.js, mascot.js, global App.
   ===================================================================== */
window.Screens = window.Screens || {};

Screens.onboarding = function (host, opts = {}) {
  // mini board: swapping (0,2)&(0,3) connects a 0-group into 5
  const BASE = [
    [2, 3, 3, 0, 2, 1],
    [1, 0, 0, 3, 4, 4],
    [4, 0, 0, 1, 2, 3],
    [2, 1, 4, 2, 1, 3],
    [3, 4, 2, 1, 3, 2],
  ];
  // pre-made diggable group of tomatoes for beat 1
  const DIG1 = [
    [1, 1, 3, 4, 2, 0],
    [2, 3, 3, 3, 4, 1],
    [0, 4, 3, 1, 2, 4],
    [1, 2, 3, 4, 1, 2],
    [4, 0, 1, 2, 3, 0],
  ];
  const DIG_GROUP = [
    [0, 2],
    [1, 1],
    [1, 2],
    [1, 3],
    [2, 2],
  ]; // 3s in DIG1
  const SWAP_PAIR = [
    [0, 2],
    [0, 3],
  ];
  let G,
    step = 0,
    swapFirst = null,
    busy = false;

  const STEPS = [
    {
      t: "dig",
      tool: "dig",
      say: `Tap a patch of <b>5 or more</b> of the same plant to <b>dig</b> it.`,
      hint: "Tap any glowing tile",
    },
    {
      t: "swap",
      tool: "swap",
      say: `Only got four? <b>Swap</b> two neighbours to line up a bigger patch.`,
      hint: "Swap the two ringed tiles",
    },
    {
      t: "digbig",
      tool: "dig",
      say: `Now there are five — <b>dig your big patch!</b>`,
      hint: "Tap the glowing patch",
    },
  ];

  host.innerHTML = `
    <div class="screen" style="gap:30px">
      <div style="flex:0 0 38%;display:flex;flex-direction:column;justify-content:center;gap:18px">
        <div style="display:flex;gap:6px">${STEPS.map((_, i) => `<span class="stepdot" style="width:34px;height:6px;border-radius:3px;background:var(--surface-line)"></span>`).join("")}</div>
        <div id="om" style="height:170px"></div>
        <div class="speech" id="say" style="position:static;max-width:none;font-size:17px;border-radius:16px;padding:14px 16px;line-height:1.45"></div>
        <div id="hint" style="font-weight:800;color:var(--accent-700);font-size:13px;display:flex;align-items:center;gap:8px"></div>
        <button class="btn btn-ghost btn-md" id="skip" style="align-self:flex-start;margin-top:6px">Skip tutorial</button>
      </div>
      <div style="flex:1;display:flex;align-items:center;justify-content:center">
        <div id="ob" style="width:min(100%,560px)"></div>
      </div>
    </div>`;

  const ob = host.querySelector("#ob"),
    sayEl = host.querySelector("#say"),
    hintEl = host.querySelector("#hint"),
    mEl = host.querySelector("#om");
  host.querySelector("#skip").onclick = () => done();

  function setStep(i) {
    step = i;
    swapFirst = null;
    const s = STEPS[i];
    G = i === 0 ? DIG1.map((r) => r.slice()) : G;
    if (i === 0) G = DIG1.map((r) => r.slice());
    if (i === 1) G = BASE.map((r) => r.slice());
    sayEl.innerHTML = s.say;
    hintEl.innerHTML = `👆 ${s.hint}`;
    mEl.innerHTML = mascot(s.tool, { size: 150 });
    host
      .querySelectorAll(".stepdot")
      .forEach(
        (d, k) =>
          (d.style.background =
            k <= i ? "var(--primary)" : "var(--surface-line)"),
      );
    paint();
  }

  function allowed() {
    if (step === 0) return new Set(DIG_GROUP.map((p) => p.join("-")));
    if (step === 1) return new Set(SWAP_PAIR.map((p) => p.join("-")));
    if (step === 2) return new Set(DIG_GROUP_BIG.map((p) => p.join("-")));
    return new Set();
  }
  let DIG_GROUP_BIG = [];

  function highlight() {
    if (step === 0) return DIG_GROUP;
    if (step === 1) return SWAP_PAIR;
    if (step === 2) return DIG_GROUP_BIG;
    return [];
  }

  function paint() {
    const hl = new Set(highlight().map((p) => p.join("-")));
    ob.innerHTML = renderPatch(G, {
      highlight: step === 1 ? new Set() : hl,
      overlay: `<div id="ov" style="position:absolute;inset:0;pointer-events:none;z-index:7"></div>`,
    });
    const T = ob.querySelector(".patch");
    T.style.width = "100%";
    const els = [...ob.querySelectorAll(".grid .cell")],
      cols = G[0].length;
    // swap-pair rings
    if (step === 1)
      SWAP_PAIR.forEach(([r, c]) => els[r * cols + c].classList.add("sel"));
    els.forEach((el, i) => {
      const r = Math.floor(i / cols),
        c = i % cols;
      el.style.touchAction = "manipulation";
      el.onclick = () => onTap(r, c, els, cols);
    });
  }

  function onTap(r, c, els, cols) {
    if (busy) return;
    const ok = allowed().has(r + "-" + c);
    if (!ok) {
      els[r * cols + c].classList.add("shake");
      setTimeout(() => els[r * cols + c].classList.remove("shake"), 420);
      App.haptic("warning");
      return;
    }
    App.haptic("light");
    if (step === 0) digGroup(DIG_GROUP, els, cols, () => setStep(1));
    else if (step === 1) {
      if (!swapFirst) {
        swapFirst = [r, c];
        return;
      }
      const [fr, fc] = swapFirst;
      if (fr === r && fc === c) return;
      busy = true;
      const a = G[fr][fc],
        b = G[r][c];
      G[fr][fc] = b;
      G[r][c] = a;
      els[fr * cols + fc].classList.remove("sel");
      els[r * cols + c].classList.remove("sel");
      els[fr * cols + fc].innerHTML = juicy(PLANTS[b], b);
      els[r * cols + c].innerHTML = juicy(PLANTS[a], a);
      els[fr * cols + fc].classList.add("spawned");
      els[r * cols + c].classList.add("spawned");
      App.haptic("medium");
      // formed group = 0s now connected
      DIG_GROUP_BIG = [
        [0, 2],
        [1, 1],
        [1, 2],
        [2, 1],
        [2, 2],
      ];
      setTimeout(() => {
        busy = false;
        setStep(2);
      }, 520);
    } else if (step === 2) digGroup(DIG_GROUP_BIG, els, cols, () => done());
  }

  function digGroup(grp, els, cols, after) {
    busy = true;
    App.haptic("success");
    let sx = 0,
      sy = 0;
    grp.forEach(([r, c]) => {
      const e = els[r * cols + c];
      sx += e.offsetLeft + e.offsetWidth / 2;
      sy += e.offsetTop;
    });
    const pop = document.createElement("div");
    pop.className = "score-pop";
    pop.style.left = sx / grp.length + "px";
    pop.style.top = sy / grp.length + "px";
    pop.innerHTML = `<span class="g">+${grp.length * 15}</span> 🌟`;
    ob.querySelector(".soil").appendChild(pop);
    grp.forEach(([r, c]) => els[r * cols + c].classList.add("clearing"));
    setTimeout(() => {
      grp.forEach(([r, c]) => {
        G[r][c] = -1;
      });
      busy = false;
      after();
    }, 480);
  }

  function done() {
    App.state.onboarded = true;
    App.save();
    if (opts.from === "game") App.back();
    else App.go("game");
  }

  setStep(0);
};
