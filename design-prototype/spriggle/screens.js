/* =====================================================================
   SPRIGGLE — screens: splash, signin, home, leaderboard, settings,
   gameover.  Each is Screens.name(host, opts) and renders into host.
   Depends on global App + glyphs from game.js.
   ===================================================================== */
window.Screens = window.Screens || {};

const ICON = {
  play: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>`,
  map: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><path d="M9 4 4 6v14l5-2 6 2 5-2V4l-5 2-6-2z"/><path d="M9 4v14M15 6v14"/></svg>`,
  trophy: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><path d="M6 4h12v4a6 6 0 0 1-12 0z"/><path d="M6 6H3v2a3 3 0 0 0 3 3M18 6h3v2a3 3 0 0 1-3 3M9 18h6M10 18v-3M14 18v-3M8 22h8"/></svg>`,
  cart: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="20" r="1.4"/><circle cx="18" cy="20" r="1.4"/><path d="M2 3h3l2.6 12.5a1.6 1.6 0 0 0 1.6 1.3h8.2a1.6 1.6 0 0 0 1.6-1.3L22 7H6"/></svg>`,
  gear: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3.2"/><path d="M19 12a7 7 0 0 0-.1-1.3l2-1.5-2-3.4-2.3 1a7 7 0 0 0-2.2-1.3L14 2h-4l-.4 2.2a7 7 0 0 0-2.2 1.3l-2.3-1-2 3.4 2 1.5A7 7 0 0 0 5 12a7 7 0 0 0 .1 1.3l-2 1.5 2 3.4 2.3-1a7 7 0 0 0 2.2 1.3L10 22h4l.4-2.2a7 7 0 0 0 2.2-1.3l2.3 1 2-3.4-2-1.5A7 7 0 0 0 19 12z"/></svg>`,
  back: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M15 5l-7 7 7 7"/></svg>`,
  sound: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9v6h4l5 4V5L8 9z"/><path d="M17 8a5 5 0 0 1 0 8M19.5 5.5a8.5 8.5 0 0 1 0 13"/></svg>`,
  music: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18V5l11-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="17" cy="16" r="3"/></svg>`,
  haptic: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><rect x="8" y="3" width="8" height="18" rx="2"/><path d="M4 8v8M20 8v8"/></svg>`,
  restore: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 3-6.7M3 4v4h4"/></svg>`,
  account: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></svg>`,
  noads: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="2.5"/><path d="M4 4l16 16"/></svg>`,
  shield: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/></svg>`,
  info: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/></svg>`,
  gc: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M8 12h3M9.5 10.5v3M14.5 11h.01M16.5 13h.01"/></svg>`,
};

/* ---------------- SPLASH ---------------- */
Screens.splash = function (host) {
  host.innerHTML = `
    <div class="screen center-col" style="gap:26px">
      <div id="sm" style="animation:popIn .6s var(--ease-bounce) both"></div>
      <div class="logo-lockup" style="animation:scrIn .5s .15s both">
        <div class="wm">Spriggle</div>
        <div class="tagline">Dig · Swap · Grow</div>
      </div>
      <div style="display:flex;gap:7px;margin-top:6px">
        ${[0, 1, 2].map((i) => `<span style="width:9px;height:9px;border-radius:50%;background:var(--primary-300);animation:loadDot 1s ${i * 0.15}s infinite"></span>`).join("")}
      </div>
    </div>
    <style>@keyframes popIn{from{transform:scale(0) rotate(-12deg);opacity:0}to{transform:none;opacity:1}}
    @keyframes loadDot{0%,100%{opacity:.3;transform:translateY(0)}50%{opacity:1;transform:translateY(-5px)}}</style>`;
  host.querySelector("#sm").innerHTML = mascot("idle", { size: 150 });
  const next = () => (App.state.onboarded ? App.go("home") : App.go("signin"));
  const t = setTimeout(next, 1900);
  host.querySelector(".screen").onclick = () => {
    clearTimeout(t);
    next();
  };
};

/* ---------------- SIGN-IN (first run) ---------------- */
Screens.signin = function (host) {
  host.innerHTML = `
    <div class="screen" style="padding:0">
      <div style="flex:1;display:flex;align-items:center;justify-content:center;background:linear-gradient(160deg,var(--primary),var(--primary-700));position:relative;overflow:hidden">
        <div style="position:absolute;inset:0;background:radial-gradient(circle at 30% 20%,rgba(255,255,255,.12),transparent 50%)"></div>
        <div class="center-col" style="gap:18px;z-index:1">
          <div id="wm"></div>
          <div class="logo-lockup"><div class="wm" style="color:var(--on-primary)">Spriggle</div><div class="tagline" style="color:color-mix(in srgb,var(--on-primary) 80%,transparent)">Dig · Swap · Grow</div></div>
        </div>
      </div>
      <div style="flex:1;display:flex;flex-direction:column;justify-content:center;gap:14px;padding:0 64px">
        <div><div style="font-family:var(--font-d);font-weight:700;font-size:32px;color:var(--ink)">Welcome to the garden</div>
        <div style="font-weight:700;color:var(--ink-soft);font-size:15px;margin-top:4px;line-height:1.5">Jump straight in — no account needed. Sign in only if you want to own your leaderboard name across devices.</div></div>
        <button class="btn btn-primary btn-lg" id="guest" style="margin-top:8px">Continue as guest</button>
        <div style="display:flex;align-items:center;gap:12px;color:var(--ink-faint);font-weight:800;font-size:12px;letter-spacing:.1em"><span style="flex:1;height:2px;background:var(--surface-line)"></span>OR<span style="flex:1;height:2px;background:var(--surface-line)"></span></div>
        <button class="btn btn-ghost btn-md" id="gc">${ICON.gc}<span>Sign in with Game Center</span></button>
        <button class="btn btn-ghost btn-md" id="gp">${ICON.account}<span>Sign in with Google Play Games</span></button>
        <div style="text-align:center;color:var(--ink-faint);font-weight:700;font-size:11.5px;margin-top:4px">Plays fully offline · scores sync when you’re back online</div>
      </div>
    </div>`;
  host.querySelector("#wm").innerHTML = mascot("idle", { size: 150 });
  const finish = (signed, name) => {
    App.state.signedIn = signed;
    if (name) App.state.name = name;
    App.state.onboarded = true;
    App.save();
    App.go("onboarding", { first: true });
  };
  host.querySelector("#guest").onclick = () => finish(false, "You");
  host.querySelector("#gc").onclick = () => finish(true, "Sprout_92");
  host.querySelector("#gp").onclick = () => finish(true, "Sprout_92");
};

/* ---------------- HOME / HUB ---------------- */
Screens.home = function (host) {
  const idName = App.state.signedIn ? App.state.name : "Guest gardener";
  const idSub = App.state.signedIn ? "Game Center" : "Tap to sign in";
  host.innerHTML = `
    <div class="screen" style="gap:30px">
      <!-- left identity panel -->
      <div style="flex:0 0 38%;display:flex;flex-direction:column">
        <div class="logo-lockup" style="align-items:flex-start;gap:2px">
          <div class="wm" style="font-size:58px">Spriggle</div>
          <div class="tagline">Dig · Swap · Grow</div>
        </div>
        <div style="flex:1;position:relative;display:flex;align-items:flex-end;justify-content:center">
          <div style="position:absolute;bottom:26px;width:230px;height:46px;border-radius:50%;background:radial-gradient(ellipse,var(--grass) 30%,transparent 70%);opacity:.55"></div>
          <div id="hm" style="position:relative;z-index:1"></div>
        </div>
        <div style="display:flex;gap:10px;align-items:center">
          <button class="id-chip" id="idChip"><span class="av">${ICON.account}</span><span>${idName}<br><span class="sub">${idSub}</span></span></button>
          <div class="coin-chip" style="margin-left:auto"><span class="c">¢</span><span class="cv" id="coin">${App.fmt(App.state.coins)}</span></div>
        </div>
      </div>
      <!-- right menu -->
      <div style="flex:1;display:flex;flex-direction:column;gap:16px">
        <button class="menu-card primary" id="mPlay" style="flex:1.3;flex-direction:row;align-items:center;gap:20px">
          <div style="flex:1"><div class="mc-ico" style="background:var(--accent)">${wrap(ICON.play, "var(--on-accent)", 26)}</div>
            <div class="mc-title" style="font-size:30px">Play Classic</div>
            <div class="mc-sub">Endless · chase your best of ${App.fmt(App.state.best)}</div></div>
          <div id="playThumb" style="flex:0 0 150px;height:130px"></div>
        </button>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;flex:1.4">
          <button class="menu-card" id="mLevels"><span class="badge">Soon</span><div class="mc-ico" style="background:var(--paper-2)">${wrap(ICON.map, "var(--primary)", 24)}</div><div class="mc-title">Levels</div><div class="mc-sub">Campaign &amp; objectives</div></button>
          <button class="menu-card" id="mLead"><div class="mc-ico" style="background:var(--paper-2)">${wrap(ICON.trophy, "var(--gold-deep)", 24)}</div><div class="mc-title">Leaderboard</div><div class="mc-sub">Where do you rank?</div></button>
          <button class="menu-card" id="mShop"><span class="badge">Soon</span><div class="mc-ico" style="background:var(--paper-2)">${wrap(ICON.cart, "var(--accent)", 24)}</div><div class="mc-title">Shop</div><div class="mc-sub">Coins, power-ups, themes</div></button>
          <button class="menu-card" id="mSet"><div class="mc-ico" style="background:var(--paper-2)">${wrap(ICON.gear, "var(--ink-soft)", 24)}</div><div class="mc-title">Settings</div><div class="mc-sub">Sound, account, more</div></button>
        </div>
      </div>
    </div>`;
  host.querySelector("#hm").innerHTML = mascot("dig", { size: 210 });
  // tiny board thumbnail
  const tb = [
    [0, 0, 3, 1],
    [0, 3, 3, 1],
    [2, 3, 1, 4],
    [2, 2, 4, 4],
  ];
  host.querySelector("#playThumb").innerHTML = renderPatch(tb, { gap: 4 });
  const T = host.querySelector("#playThumb .patch");
  if (T) {
    T.style.width = "100%";
    T.style.height = "100%";
    T.querySelectorAll(".tuft").forEach((e) => (e.style.display = "none"));
  }
  host.querySelector("#mPlay").onclick = () => App.go("game");
  host.querySelector("#mLead").onclick = () => App.go("leaderboard");
  host.querySelector("#mSet").onclick = () => App.go("settings");
  host.querySelector("#mLevels").onclick = () =>
    App.toast("Levels arrive in the campaign update 🗺️");
  host.querySelector("#mShop").onclick = () =>
    App.toast("The Shop is coming soon 🛒");
  host.querySelector("#idChip").onclick = () =>
    App.state.signedIn ? App.go("settings") : App.go("signin");
};

/* ---------------- LEADERBOARD ---------------- */
Screens.leaderboard = function (host) {
  const me = {
    name: App.state.signedIn ? App.state.name : "You (Guest)",
    score: Math.max(App.state.best, 0),
  };
  const base = [
    ["Marigold", 48230],
    ["Basil_b", 41980],
    ["PeaShoot", 39110],
    ["Clover22", 35400],
    ["Fennel", 31220],
    ["DigDug", 28760],
    ["Sorrel", 25030],
    ["Thyme", 22410],
    ["Nettle", 19980],
    ["Borage", 17640],
  ];
  let scope = "all";
  host.innerHTML = `
    <div class="screen" style="flex-direction:column;gap:18px">
      <div style="display:flex;align-items:center;gap:14px">
        <button class="icon-btn" id="bk">${ICON.back}</button>
        <div style="font-family:var(--font-d);font-weight:700;font-size:32px;color:var(--ink)">Leaderboard</div>
        <div class="seg" id="seg" style="margin-left:auto">
          <button data-s="all" class="on">All-time</button>
          <button data-s="week">This week</button>
          <button data-s="friends">Friends</button>
        </div>
      </div>
      <div id="lbList" style="flex:1;overflow:hidden;display:flex;flex-direction:column;gap:8px"></div>
    </div>`;
  host.querySelector("#bk").onclick = () => App.back();
  const list = host.querySelector("#lbList");

  function loading() {
    list.innerHTML = Array.from(
      { length: 7 },
      () =>
        `<div class="lb-row shimmer" style="height:64px;border:none"></div>`,
    ).join("");
  }
  function render() {
    if (scope === "friends" && !App.state.signedIn) {
      list.innerHTML = `<div class="center-col" style="flex:1;gap:14px;text-align:center">
        <div style="width:90px;height:90px">${mascot("idle", { size: 90 })}</div>
        <div style="font-family:var(--font-d);font-weight:700;font-size:22px;color:var(--ink)">No friends yet</div>
        <div style="font-weight:700;color:var(--ink-soft);max-width:340px">Sign in with Game Center or Play Games to see how you stack up against friends.</div>
        <button class="btn btn-primary btn-md" id="si">Sign in</button></div>`;
      list.querySelector("#si").onclick = () => App.go("signin");
      return;
    }
    let rows = base.map(([n, s]) => ({
      name: n,
      score: scope === "week" ? Math.round(s * 0.42) : s,
    }));
    rows.push({ name: me.name, score: me.score, me: true });
    rows.sort((a, b) => b.score - a.score);
    list.innerHTML = rows
      .slice(0, 9)
      .map(
        (r, i) => `
      <div class="lb-row ${r.me ? "me" : ""} ${i === 0 ? "top1" : ""}">
        <div class="rank">${i === 0 ? "🏆" : i + 1}</div>
        <div class="av">${r.name[0].toUpperCase()}</div>
        <div class="nm">${r.name}${r.me ? " · you" : ""}</div>
        <div class="sc">${App.fmt(r.score)}</div>
      </div>`,
      )
      .join("");
  }
  host.querySelectorAll("#seg button").forEach(
    (b) =>
      (b.onclick = () => {
        host
          .querySelectorAll("#seg button")
          .forEach((x) => x.classList.toggle("on", x === b));
        scope = b.dataset.s;
        loading();
        setTimeout(render, 480);
      }),
  );
  loading();
  setTimeout(render, 600);
};

/* ---------------- SETTINGS ---------------- */
Screens.settings = function (host) {
  const tg = (k) => (App.state[k] ? "on" : "");
  host.innerHTML = `
    <div class="screen" style="flex-direction:column;gap:18px">
      <div style="display:flex;align-items:center;gap:14px">
        <button class="icon-btn" id="bk">${ICON.back}</button>
        <div style="font-family:var(--font-d);font-weight:700;font-size:32px;color:var(--ink)">Settings</div>
      </div>
      <div style="flex:1;display:grid;grid-template-columns:1fr 1fr;gap:20px;align-content:start">
        <div style="display:flex;flex-direction:column;gap:16px">
          <div class="row-list">
            <div class="set-row"><span class="si">${ICON.sound}</span><div><div class="st">Sound effects</div><div class="ss">Digs, pops &amp; UI</div></div><div class="right"><button class="toggle ${tg("sound")}" data-k="sound"></button></div></div>
            <div class="set-row"><span class="si">${ICON.music}</span><div><div class="st">Music</div><div class="ss">Garden ambience</div></div><div class="right"><button class="toggle ${tg("music")}" data-k="music"></button></div></div>
            <div class="set-row"><span class="si">${ICON.haptic}</span><div><div class="st">Haptics</div><div class="ss">Feedback on every move</div></div><div class="right"><button class="toggle ${tg("haptics")}" data-k="haptics"></button></div></div>
          </div>
          <div class="row-list">
            <div class="set-row tappable" id="restore"><span class="si">${ICON.restore}</span><div><div class="st">Restore purchases</div><div class="ss">Bring back what you’ve bought</div></div><div class="right"><span style="transform:scaleX(-1)">${ICON.back}</span></div></div>
            <div class="set-row tappable" id="noads"><span class="si">${ICON.noads}</span><div><div class="st">Remove ads</div><div class="ss">One-off · keeps rewarded ads</div></div><div class="right"><span style="color:var(--accent);font-family:var(--font-d)">£4.99</span></div></div>
          </div>
          <div class="row-list">
            <div class="set-row"><span class="si">${ICON.shield}</span><div style="flex:1"><div class="st">Appearance</div><div class="ss">Cosmetic theme · sold in the Shop</div></div></div>
            <div class="set-row" style="gap:12px">
              <button class="theme-sw" data-t="garden"><span class="sw-prev" style="background:linear-gradient(135deg,#3c5a3a,#c8693f)"></span>Garden</button>
              <button class="theme-sw" data-t="moonlit"><span class="sw-prev" style="background:linear-gradient(135deg,#5fd3a3,#ff9e57)"></span>Moonlit</button>
            </div>
          </div>
        </div>
        <div style="display:flex;flex-direction:column;gap:16px">
          <div class="row-list">
            <div class="set-row tappable" id="account"><span class="si">${ICON.account}</span><div><div class="st">${App.state.signedIn ? App.state.name : "Account"}</div><div class="ss">${App.state.signedIn ? "Signed in · Game Center" : "Playing as guest"}</div></div><div class="right">${App.state.signedIn ? "Sign out" : "Sign in"}<span style="transform:scaleX(-1)">${ICON.back}</span></div></div>
            <div class="set-row tappable" id="privacy"><span class="si">${ICON.shield}</span><div><div class="st">Privacy &amp; data</div><div class="ss">What we store &amp; why</div></div><div class="right"><span style="transform:scaleX(-1)">${ICON.back}</span></div></div>
          </div>
          <div class="row-list">
            <div class="set-row"><span class="si">${ICON.info}</span><div><div class="st">About Spriggle</div><div class="ss" id="credits">Coded by Bradley · Graphics by Nicole · Tested by Libby</div></div><div class="right" style="font-family:var(--font-d)">v1.0</div></div>
          </div>
          <div style="text-align:center;color:var(--ink-faint);font-weight:700;font-size:11.5px;line-height:1.6">Made with 🌱 in the Spriggle garden</div>
        </div>
      </div>
    </div>`;
  host.querySelector("#bk").onclick = () => App.back();
  host.querySelectorAll(".toggle").forEach(
    (t) =>
      (t.onclick = () => {
        const k = t.dataset.k;
        App.state[k] = !App.state[k];
        t.classList.toggle("on", App.state[k]);
        App.save();
        App.haptic("light");
      }),
  );
  host.querySelector("#restore").onclick = () =>
    App.toast("Nothing to restore yet", "ok");
  host.querySelector("#noads").onclick = () =>
    App.toast("Remove ads ships with the Shop");
  host.querySelector("#privacy").onclick = () =>
    App.toast("Privacy policy — opens in browser");
  host.querySelector("#account").onclick = () => {
    if (App.state.signedIn) {
      App.state.signedIn = false;
      App.state.name = "You";
      App.save();
      App.go("settings");
      App.toast("Signed out", "ok");
    } else App.go("signin");
  };
  host.querySelectorAll(".theme-sw").forEach((b) => {
    b.classList.toggle("on", App.state.theme === b.dataset.t);
    b.onclick = () => {
      App.setTheme(b.dataset.t);
      host
        .querySelectorAll(".theme-sw")
        .forEach((x) => x.classList.toggle("on", x === b));
      App.haptic("light");
    };
  });
};

/* ---------------- GAME OVER ---------------- */
Screens.gameover = function (host, opts = {}) {
  const isBest = opts.isBest,
    score = opts.score || 0;
  host.innerHTML = `
    <div class="screen center-col" style="gap:0">
      <div class="scrim" style="position:static;background:none;backdrop-filter:none">
        <div class="sheet" style="width:min(560px,86%)">
          <div class="center-col" style="margin-bottom:10px"><div id="gom"></div></div>
          ${isBest ? `<div style="text-align:center;font-family:var(--font-d);font-weight:700;color:var(--gold);letter-spacing:.12em;font-size:14px;text-transform:uppercase;margin-bottom:2px">🌟 New best! 🌟</div>` : ""}
          <h2>${isBest ? "A record harvest" : "Run complete"}</h2>
          <div class="sub">${isBest ? "Your patch has never grown bigger." : `Best so far · ${App.fmt(App.state.best)}`}</div>
          <div style="background:var(--surface);border:2px solid var(--surface-line);border-radius:var(--r-md);padding:18px;text-align:center;margin-bottom:18px">
            <div style="font-size:11px;font-weight:800;letter-spacing:.16em;text-transform:uppercase;color:var(--accent-700)">Final score</div>
            <div style="font-family:var(--font-d);font-weight:700;font-size:56px;color:var(--ink);line-height:1">${App.fmt(score)}</div>
          </div>
          ${
            isBest && !App.state.signedIn
              ? `<div style="margin-bottom:14px"><div style="font-weight:800;font-size:13px;color:var(--ink-soft);margin-bottom:6px">Name for the leaderboard</div>
            <input id="nameIn" value="${App.state.name || "Gardener"}" maxlength="14" style="width:100%;font-family:var(--font-u);font-weight:800;font-size:18px;padding:12px 14px;border-radius:var(--r-md);border:2px solid var(--surface-line);background:var(--paper);color:var(--ink)"></div>`
              : ""
          }
          <div class="actions">
            <button class="btn btn-accent btn-lg" id="cont">${wrap(ICON.play, "var(--on-accent)", 20)} Watch ad — keep digging</button>
            <div style="display:flex;gap:10px"><button class="btn btn-primary btn-md" id="replay" style="flex:1">Replay</button><button class="btn btn-ghost btn-md" id="home" style="flex:1">Garden</button></div>
          </div>
        </div>
      </div>
    </div>`;
  host.querySelector("#gom").innerHTML = mascot(isBest ? "swap" : "idle", {
    size: 120,
  });
  const saveName = () => {
    const i = host.querySelector("#nameIn");
    if (i && i.value.trim()) {
      App.state.name = i.value.trim();
      App.save();
    }
  };
  host.querySelector("#replay").onclick = () => {
    saveName();
    App.go("game");
  };
  host.querySelector("#home").onclick = () => {
    saveName();
    App.go("home");
  };
  host.querySelector("#cont").onclick = () => {
    saveName();
    App.rewardedAd(() => App.go("game"));
  };
};

/* helpers */
function wrap(svg, color, size) {
  return `<span style="display:inline-flex;width:${size}px;height:${size}px;color:${color}">${svg}</span>`;
}
