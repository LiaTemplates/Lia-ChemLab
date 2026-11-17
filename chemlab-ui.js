/* ChemLab – Oberfläche: mount(), Regal, Arbeitsfläche, Zeitleiste, Gleichungen, Diagramme, Protokoll.
   Der Zustand einer Fläche liegt in LiaChemLab.store[el.id] und übersteht so den Folienwechsel:
   LiaScript baut das DOM beim Zurückkehren neu auf, die id bleibt dieselbe. */
(function (global) {
  "use strict";

  var L = (global.LiaChemLab = global.LiaChemLab || {});
  L.store = L.store || {};

  var SPEEDS = [0.25, 0.5, 1, 2, 5, 20, 60];
  var BUDGET = 400;               // Rechenschritte je Bild höchstens (20 simulierte Sekunden)
  var BENCH = 300, FRONT = 48;    // Tischkante (mindestens) und Höhe der Tischfront in Bildpunkten
  var GROUPS = ["water", "acid", "salt", "other", "indicator", "solid"];
  var SHOWN = 2;                  // s: so lange bleibt eine Probe (Span, Blitz) an der Öffnung zu sehen
  var DASH = ["", "7 3", "2 3", "9 3 2 3", "1 4", "12 4"];
  var STEPS = { ml: [1, 2, 5, 10, 20, 50, 100], drops: [1, 2, 3, 5, 10], g: [0.1, 0.2, 0.5, 1, 2, 5], pieces: [1, 2, 5, 10, 20] };
  var ICON = {
    start: "M4,4h2.5v12H4zM17,4v12l-9-6z", back: "M16,4v12L5,10z", play: "M5,4v12l11-6z",
    pause: "M5,4h3.5v12H5zM11.5,4H15v12h-3.5z", end: "M13.5,4H16v12h-2.5zM3,4l9,6l-9,6z"
  };

  var SHELF_ICON = '<svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round">' +
    '<path d="M2.5 6.5h15M2.5 13.5h15M3.5 3v15M16.5 3v15"/><path d="M6 6.5V4.5h2v2M11 6.5V3.5h2.5v3M6.5 13.5v-3h2.5v3M12 13.5v-2h2v2"/></svg>';
  var MORE_ICON = '<svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true"><circle cx="4" cy="10" r="1.7"/><circle cx="10" cy="10" r="1.7"/><circle cx="16" cy="10" r="1.7"/></svg>';
  var CLOSE_ICON = '<svg viewBox="0 0 20 20" width="16" height="16" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M5 5l10 10M15 5L5 15"/></svg>';
  // Eingriffe der Lernenden: auf der Zeitleiste als Raute, alles andere (Beobachtungen) als Punkt
  var ACTS = { placed: 1, added: 1, poured: 1, pipetted: 1, emptied: 1, disposed: 1, removed: 1, hung: 1, under: 1, joined: 1, probe: 1, bridged: 1,
    flame: 1, spin: 1, flip: 1, tare: 1, plugged: 1, tap: 1, volts: 1, temp: 1, wave: 1, splint: 1, flameTest: 1 };

  function glyph(name) {
    return '<svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true"><path d="' + ICON[name] + '"/></svg>';
  }

  // Welche Datei fehlt noch? Eine, die auf den Rechenkern wartet, ist angekommen.
  function missing() {
    return [["chemlab-engine.js", L.normalize], ["chemlab-data.js", L.core], ["chemlab-parts.js", L.text && L.icon], ["chemlab-fx.js", L.fx]]
      .filter(function (file) { return !file[1] && !(L.pending && L.pending[file[0]]); }).map(function (file) { return file[0]; });
  }

  // Flächen, die mit einem Fehler stehen, weil ihnen Daten fehlten: Sie bauen sich neu auf, sobald ein Paket geladen ist
  // (eine Fläche, die auf ihrer Folie über dem Paket-Makro steht, ist vor ihm dran)
  var stranded = [];
  L.packDone = function () {
    var list = stranded;
    stranded = [];
    list.forEach(function (w) {
      var st = L.store[w.el.id];
      if (w.el.isConnected !== false && st && st.error && st.source === w.text) mount(w.el, w.source);
    });
  };

  // settled: die Pakete der Fläche wurden eben geladen (oder sind gescheitert); kein neuer Versuch
  // link: { name, publish } verbindet die Fläche mit dem Text ihrer Folie; ein neuer Aufbau ohne link behält den bisherigen
  function mount(el, source, settled, link) {
    var doc = global.document;
    link = el._clLink = link || el._clLink || {};
    var lang = L.langOf ? L.langOf(doc) : "en";
    var esc = L.escape;
    function T(key, vars) { return L.text(key, lang, vars); }

    // Fehlt eine der Dateien, sagt die Fläche das, statt leer zu bleiben oder mit einem Folgefehler zu enden.
    var gone = missing();
    if (gone.length) {
      el.innerHTML = '<p class="cl-error" role="alert">' + (lang === "de" ? "ChemLab ist nicht vollständig geladen. Es fehlt: " : "ChemLab is not completely loaded. Missing: ") +
        gone.join(", ") + "</p>";
      return;
    }

    if (el._cl) el._cl.stop();
    if (!L.strings[lang]) {         // die Sprachdatei kommt noch
      el._cl = null;
      el.innerHTML = '<p class="cl-hint" role="status">…</p>';
      loadLang(lang).then(function () { if (el.isConnected !== false && !el._cl) mount(el, source, settled); });
      return;
    }
    // Eigene Texte gibt es in dieser Sprache: Google soll sie nicht noch einmal übersetzen. Sonst (Englisch als Ersatz) darf es.
    var own = lang !== "en" || /^en\b/i.test((doc && doc.documentElement && doc.documentElement.lang) || "");
    function fence(box) {           // auch für die Platzhalter im Text der Folie
      if (own) box.setAttribute("translate", "no"); else box.removeAttribute("translate");
      box.setAttribute("dir", L.RTL.test(lang) ? "rtl" : "ltr");
    }
    if (el.setAttribute) fence(el);

    var text = typeof source === "string" ? source : JSON.stringify(source);
    var st = L.store[el.id];
    // geänderte Beschreibung: neuer Aufbau. Ein Fehler bleibt nicht stehen: vielleicht sind die fehlenden Daten inzwischen da.
    if (st && (st.source !== text || st.error)) st = null;
    // Pakete der Fläche, und solche, die ein Makro gerade lädt: erst laden, dann den Aufbau lesen
    var wanted = st ? [] : packsOf(text), open = wanted.filter(function (url) { var p = L.packState(url); return !p || p.state === "loading" || (p.state === "error" && !settled); });
    if (!st && (open.length || L.loadingPacks())) {
      el.innerHTML = '<p class="cl-hint" role="status">' + esc(T("packs.loading")) + "</p>";
      Promise.all(wanted.map(L.loadPack).concat([L.packsLoaded()])).then(function () { if (el.isConnected !== false) mount(el, source, true); });
      return;
    }
    var broken = wanted.map(L.packState).filter(function (p) { return p.state === "error"; })[0];
    if (broken) { el.innerHTML = packError(broken, lang); return; }
    if (!st) {
      st = L.store[el.id] = { source: text, hand: null, sel: null, play: 0, speed: 1, names: {}, counts: {}, error: null, mute: false, cols: [], rows: [] };
      try {
        st.config = L.normalize(source);
        st.run = L.createRun(st.config);
      } catch (error) {
        st.error = { code: error.code || "other", detail: error.detail || (error.code ? "" : error.message) || "" };
      }
    }
    if (st.error) {
      var key = { json: "err.json", part: "err.part", reagent: "err.reagent", place: "err.place", sample: "err.sample", data: "err.data",
        amount: "err.amount", size: "err.size", model: "err.model", task: "err.task", pack: "err.pack", view: "err.view", scene: "err.scene", scatter: "err.scatter" }[st.error.code] || "err.other";
      el.innerHTML = '<p class="cl-error" role="alert">' + esc(T(key)) + (st.error.detail ? ": " + esc(L.explain(st.error.detail, lang)) : "") + "</p>";
      stranded = stranded.filter(function (w) { return w.el !== el && w.el.isConnected !== false; }).concat([{ el: el, source: source, text: text }]);
      return;
    }

    var show = st.config.show;
    var FLOWS = ["", "temp", "vortex", "pressure"];      // Ansichten der Strömung im Gefäß, die erste ist aus
    if (st.flow == null) st.flow = Math.max(0, FLOWS.indexOf(show.flow));
    if (!st.view) st.view = st.config.view;       // die Wahl der Lernenden bleibt, wenn die Folie wiederkommt
    var still = !!(global.matchMedia && global.matchMedia("(prefers-reduced-motion: reduce)").matches);
    var sound = L.fx.sound ? L.fx.sound(global) : null, heard = 0;      // heard: so viele Zeilen des Protokolls sind schon verklungen
    if (sound) sound.mute(st.mute);

    // Oben eine schmale Leiste: das Regal zum Aufklappen, 3D und ein Menü für das Seltene.
    // Was man mit einem Gefäß tun kann, steht in der Karte unter der Fläche, sobald man es antippt.
    el.innerHTML =
      '<div class="cl-task" hidden><p class="cl-task-text"></p><ul class="cl-goals"></ul><p class="cl-done" role="status" aria-live="polite"></p></div>' +
      '<div class="cl-top"><button type="button" class="cl-btn cl-barbtn" data-act="bar" aria-pressed="false">' + SHELF_ICON + "<span>" + esc(T("shelf")) + "</span></button>" +
      '<span class="cl-fill"></span><div class="cl-side">' +
      (L.stage3d ? '<button type="button" class="cl-btn" data-act="view" aria-pressed="false">' + esc(T("view")) + "</button>" : "") +
      '<details class="cl-more"><summary class="cl-btn cl-round" title="' + esc(T("menu")) + '" aria-label="' + esc(T("menu")) + '">' + MORE_ICON + "</summary>" +
      '<div class="cl-menu">' +
      (sound ? '<button type="button" class="cl-btn cl-sound" data-act="sound" aria-pressed="' + (st.mute ? "false" : "true") + '">' + esc(T("sound")) + "</button>" : "") +
      '<button type="button" class="cl-btn" data-act="copy">' + esc(T("copy")) + "</button> " +
      '<button type="button" class="cl-btn" data-act="reset">' + esc(T("reset")) + "</button>" +
      '<div class="cl-others" hidden><span class="cl-hint">' + esc(T("others")) + '</span><div class="cl-otherlist"></div></div></div></details></div></div>' +
      '<p class="cl-viewing" role="status" hidden><span></span> <button type="button" class="cl-btn" data-act="mine">' + esc(T("others.back")) + "</button></p>" +
      '<div class="cl-bar" hidden><div class="cl-tabs" role="tablist" aria-label="' + esc(T("shelf.tabs")) + '" hidden></div>' +
      '<div class="cl-shelf" role="toolbar" aria-label="' + esc(T("shelf")) + '"></div></div>' +
      '<div class="cl-stage"><svg class="cl-svg" role="group" aria-label="' + esc(T("stage")) + '" xmlns="http://www.w3.org/2000/svg"></svg>' +
      '<div class="cl-three" role="group" aria-label="' + esc(T("stage")) + '" hidden></div>' +
      '<div class="cl-hand" role="group" aria-label="' + esc(T("hand")) + '" hidden></div></div>' +
      '<div class="cl-panel"></div>' +
      '<div class="cl-time"></div>' +
      '<p class="cl-status" role="status" aria-live="polite"></p>' +
      '<div class="cl-readings" hidden></div>' +
      '<div class="cl-out"><div class="cl-outtabs" role="tablist" aria-label="' + esc(T("out.tabs")) + '" hidden></div>' +
      '<div class="cl-eq"></div>' +
      '<div class="cl-charts"></div>' +
      '<div class="cl-log"><h4>' + esc(T("log.title")) + '</h4><p class="cl-hint cl-none">' + esc(T("log.none")) + "</p>" +
      '<ol class="cl-events" aria-live="polite"></ol><p><button type="button" class="cl-btn" data-act="copyLog" disabled>' + esc(T("log.copy")) + "</button></p></div></div>";

    var room = global.LIA && global.LIA.classroom, layer = room && room.layer ? room.layer("ChemLab:" + el.id) : null;
    var unlisten = null, saveTimer = 0, savedKey = null;
    var ui = {};
    ["task", "shelf", "hand", "stage", "svg", "three", "time", "status", "readings", "panel", "eq", "charts", "log", "bar", "tabs", "out", "outtabs", "others", "otherlist", "viewing"].forEach(function (name) {
      ui[name] = el.querySelector(".cl-" + name);
    });
    ui.barbtn = el.querySelector(".cl-barbtn");
    ui.more = el.querySelector(".cl-more");
    ui.sound = sound ? el.querySelector(".cl-sound") : null;
    ui.view = L.stage3d ? el.querySelector('[data-act="view"]') : null;
    ui.events = ui.log.querySelector(".cl-events");
    ui.copyLog = ui.log.querySelector('[data-act="copyLog"]');
    ui.goals = ui.task.querySelector(".cl-goals");
    ui.done = ui.task.querySelector(".cl-done");
    // Texte des Kursautors übersetzt Google weiter mit
    if (st.config.task) ui.task.querySelector(".cl-task-text").innerHTML = esc(T("task")) + ': <span translate="yes">' + esc(st.config.task.text) + "</span>";
    ui.none = ui.log.querySelector(".cl-none");
    // Platzhalter im Text der Folie (@ChemLab.show, @ChemLab.value): Gleichungen, Protokoll und Tabelle ziehen dorthin um,
    // ein Diagramm wird dort gezeichnet, ein Messwert dort eingesetzt. Was im Text steht, fehlt unter der Fläche.
    var slots = !link.name || !doc ? [] : Array.prototype.filter.call(doc.querySelectorAll(".lia-chemlab-slot"), function (s) { return s.getAttribute("data-chemlab") === link.name; });
    var moved = { equations: ui.eq, log: ui.log, table: ui.readings }, inText = {}, chartSlots = [], valueSlots = [], published = null;
    slots.forEach(function (s) {
      var what = s.getAttribute("data-show");
      fence(s);
      if (s.hasAttribute("data-value")) valueSlots.push(s);
      else if (moved[what]) { s.innerHTML = ""; s.appendChild(moved[what]); inText[what] = true; }
      else if (what) chartSlots.push({ kind: what, box: s });
      s.addEventListener("click", onClick);                     // Knöpfe im Umgezogenen (Messwert notieren, Sprung zur Beobachtung)
    });
    var ownCharts = show.charts.filter(function (k) { return !chartSlots.some(function (c) { return c.kind === k; }); });
    ui.eq.hidden = !(show.equations || inText.equations);
    ui.charts.hidden = !ownCharts.length;
    ui.log.hidden = !(show.log || inText.log);
    if (st.bar == null) st.bar = show.shelf || !st.run.lab.vessels.length;      // die Regalleiste: offen, wenn der Kurs es will oder der Tisch leer ist

    // Gleichungen, Diagramme und Protokoll als Reiter; ist nur eines eingeschaltet, steht es ohne Reiter da
    var outs = [["eq", show.equations && !inText.equations], ["charts", ownCharts.length > 0], ["log", show.log && !inText.log]].filter(function (k) { return k[1]; }).map(function (k) { return k[0]; });
    if (outs.indexOf(st.out) < 0) st.out = outs[0] || "";
    ui.out.hidden = !outs.length;
    ui.outtabs.hidden = outs.length < 2;
    ui.outtabs.innerHTML = outs.length < 2 ? "" : outs.map(function (k) {
      return '<button type="button" role="tab" class="cl-tab" data-act="out" data-id="' + k + '" aria-selected="' + (st.out === k ? "true" : "false") + '">' + esc(T("out." + k)) +
        (k === "log" ? ' <span class="cl-n cl-count"></span>' : "") + "</button>";
    }).join("");
    ui.count = ui.outtabs.querySelector(".cl-count");
    ui.out.setAttribute("data-tab", outs.length < 2 ? "" : st.out);

    function setOut(k) {
      st.out = k;
      ui.out.setAttribute("data-tab", k);
      if (ui.outtabs.querySelectorAll) Array.prototype.forEach.call(ui.outtabs.querySelectorAll(".cl-tab"), function (b) {
        b.setAttribute("aria-selected", b.getAttribute("data-id") === k ? "true" : "false");
      });
    }

    var planWidth = 0;              // Breite der Fläche in ihren eigenen Einheiten: für den Pfeil der Karte
    var pinKey = "";                // wofür die Marken auf der Zeitleiste zuletzt gezeichnet wurden
    var bench = BENCH, items = [], nodes = {}, shape = null, raf = 0, last = 0, slowAt = 0, pending = 0, playFrom = 0, stopped = false, down = null;
    var dragging = null;            // ein Schieber (Spannung, Temperatur, Wellenlänge) wird gerade bewegt: der Wert, auf dem er steht
    var insist = null;              // die Zeit, zu der in Ruhe schon einmal „Abspielen“ gedrückt wurde
    function flowLabel() { return T("flow") + (st.flow ? ": " + T("flow." + FLOWS[st.flow]) : ""); }
    var lensKey = null, lensColors = {};      // was die Legende der Teilchenlupe gerade zeigt, und die Farben ihrer Teilchen
    var shown = [];                 // die Beobachtungen, die gerade in der Liste stehen
    var three = null;               // die 3D-Bühne, solange sie gezeigt wird; sonst zeichnet das SVG

    // ---------------------------------------------------------------- Namen

    // "Reagenzglas 1": bleibt einem Gerät, auch wenn andere weggeräumt werden
    // Wechselt die Sprache, bekommt jedes Gerät seinen Namen neu, mit derselben Nummer
    // Die unbekannte Probe in einem Gefäß aus der Beschreibung („A“), sonst null
    function sampleOf(id) {
      var item = st.config.bench.filter(function (o) { return o.id === id; })[0];
      return item && item.unknown ? item.unknown : null;
    }
    // Verborgen ist eine Probe und jedes Gefäß, das etwas aus ihr bekommen hat
    function veiled(id) { var v = L.vessel(st.run.lab, id); return !!(v && v.veiled); }
    function hidden() {
      var out = {};
      st.run.lab.vessels.forEach(function (v) { if (v.veiled) out[v.id] = true; });
      return out;
    }

    function names() {
      var lab = st.run.lab, id;
      st.types = st.types || {};
      if (st.lang !== lang) for (id in st.names) if (st.types[id]) st.names[id] = sampleOf(id) ? T("sample", { name: sampleOf(id) }) : L.partName(st.types[id], lang) + " " + ordinal(id);
      st.lang = lang;
      lab.vessels.concat(lab.tools).forEach(function (p) {
        if (st.names[p.id]) return;
        if (sampleOf(p.id)) { st.types[p.id] = p.type; st.names[p.id] = T("sample", { name: sampleOf(p.id) }); return; }
        st.counts[p.type] = (st.counts[p.type] || 0) + 1;
        st.types[p.id] = p.type;
        st.names[p.id] = L.partName(p.type, lang) + " " + st.counts[p.type];
      });
      return st.names;
    }

    function ordinal(id) { return sampleOf(id) || +(/(\d+)$/.exec(st.names[id] || "") || [0, 0])[1]; }      // eine Probe trägt ihren Buchstaben

    function status(text) { ui.status.textContent = text || ""; }

    // ---------------------------------------------------------------- Regal und Hand

    // Gesperrt bleiben die Geräte, wo sie stehen: Im Regal gibt es dann nur Stoffe und die Proben, die man an ein Gefäß hält
    function allowed(id) { return !st.config.lock || !L.parts[id] || L.parts[id].kind === "test"; }

    // Was im Regal steht, in Fächern: die Auswahl des Kurses (Stoffe und Geräte getrennt), sonst alles, nach Art geordnet.
    // Ein Fach ohne Namen (Wasser, Lösungen ohne eigene Gruppe) kommt zum vorigen Fach, ganz vorn zum nächsten.
    function shelfGroups() {
      var list, out = [];
      if (st.config.shelf) {
        list = st.config.shelf.filter(allowed);
        return [{ title: T("group.stuff"), ids: list.filter(function (id) { return !L.parts[id]; }) },
          { title: T("group.parts"), ids: list.filter(function (id) { return !!L.parts[id]; }) }].filter(function (g) { return g.ids.length; });
      }
      var all = Object.keys(L.db.reagents), rest = all.filter(function (id) { return GROUPS.indexOf(L.db.reagents[id].group) < 0; });
      GROUPS.map(function (group) {
        // Salzlösungen stehen mit 0,1 mol/L bereit, Säuren und Laugen mit 1 mol/L
        return { title: T("group." + group), ids: all.filter(function (id) { return L.db.reagents[id].group === group; })
          .map(function (id) { return group === "salt" && L.db.reagents[id].molar ? id + " 0.1M" : id; }) };
      }).concat([{ title: "", ids: rest },
        { title: T("group.gear"), ids: Object.keys(L.parts).filter(function (id) { return !electric(L.parts[id]) && allowed(id); }) },
        // eine eigene Elektrode steht nur da, wenn ihr Stoff eingetragen ist
        { title: T("group.electric"), ids: Object.keys(L.parts).filter(function (id) { return electric(L.parts[id]) && allowed(id) && (!L.parts[id].electrode || L.db.species[L.parts[id].electrode]); }) }
      ]).filter(function (g) { return g.ids.length; }).forEach(function (g, k, groups) {
        var next = groups.slice(k + 1).filter(function (o) { return o.title; })[0];
        if (g.title) out.push({ title: g.title, ids: (g.lead || []).concat(g.ids) });
        else if (out.length) out[out.length - 1].ids = out[out.length - 1].ids.concat(g.ids);
        else if (next) next.lead = (next.lead || []).concat(g.ids);
        else out.push({ title: T("shelf"), ids: g.ids });
      });
      return out;
    }

    function electric(def) { return !!(def.electrode || def.circuit || def.bridge); }

    function shelfIds() { return shelfGroups().reduce(function (all, g) { return all.concat(g.ids); }, []); }

    function nameOfPick(id) { return L.parts[id] ? L.partName(id, lang) : L.nameOf(L.reagent(id), lang); }

    // Das Regal entsteht einmal; welcher Stoff gewählt ist, wird danach an den Knöpfen selbst vermerkt.
    // So behält der Knopf den Fokus, und Vorleseprogramme hören nur die Änderung.
    // Die Regalleiste zeigt ein Fach auf einmal, in einer Zeile, die sich seitlich schieben lässt.
    function renderShelf() {
      var ids = [], groups = shelfGroups();
      ui.shelf.innerHTML = groups.map(function (group, g) {
        return group.ids.map(function (id) {
          ids.push({ id: id, g: g });
          return '<button type="button" class="cl-pick" data-act="hand" data-id="' + esc(id) + '" data-n="' + (ids.length - 1) + '" aria-pressed="false" data-g="' + g + '" title="' + esc(nameOfPick(id)) + '">' +
            L.icon(id) + "<span>" + esc(nameOfPick(id)) + "</span>" + (L.parts[id] ? "" : L.ghsLabel(id, lang)) + "</button>";
        }).join("");
      }).join("");
      ui.picks = ids.map(function (pick, n) { return { id: pick.id, g: pick.g, node: ui.shelf.querySelector('[data-n="' + n + '"]') }; });
      ui.groups = groups;
      if (!(st.group < groups.length)) st.group = 0;
      ui.tabs.hidden = groups.length < 2;
      ui.tabs.innerHTML = groups.length < 2 ? "" : groups.map(function (group, g) {
        return '<button type="button" role="tab" class="cl-tab" data-act="group" data-id="' + g + '" aria-selected="false">' + esc(group.title) +
          ' <span class="cl-n">' + group.ids.length + "</span></button>";
      }).join("");
      ui.barbtn.hidden = ui.shelf.hidden = !ids.length;
      syncShelf();
      syncBar();
    }

    function syncShelf() {
      var tabs = ui.groups && ui.groups.length > 1;
      ui.picks.forEach(function (pick) {
        pick.node.setAttribute("aria-pressed", st.hand && st.hand.id === pick.id ? "true" : "false");
        pick.node.hidden = tabs && pick.g !== st.group;
      });
      if (tabs && ui.tabs.querySelectorAll) Array.prototype.forEach.call(ui.tabs.querySelectorAll(".cl-tab"), function (tab) {
        tab.setAttribute("aria-selected", +tab.getAttribute("data-id") === st.group ? "true" : "false");
      });
      syncCard();
    }

    // Die Regalleiste ist zu, bis man sie aufklappt; offen von Anfang an, wenn der Kurs es will oder noch kein Gefäß auf dem Tisch steht
    function syncBar() {
      ui.bar.hidden = !st.bar || !ui.picks.length;
      ui.barbtn.setAttribute("aria-pressed", st.bar ? "true" : "false");
    }

    // Die Stufe, die beim Greifen eingestellt ist: start, wenn es eine der Stufen ist, sonst die dritte
    function startOf(r) { var k = STEPS[unitOf(r)].indexOf(r.start); return k < 0 ? 2 : k; }
    function unitOf(r) { return r.solid ? (r.piece ? "pieces" : "g") : r.drops ? "drops" : "ml"; }

    // Was gerade in der Hand liegt: Menge für den Rechenkern, für das Protokoll und als Text
    function portion() {
      var r = L.reagent(st.hand.id), unit = unitOf(r), n = STEPS[unit][st.hand.i];
      if (unit === "pieces") return { give: { g: n * r.piece.g }, text: n + " " + L.nameOf(r.piece, lang) + " (" + L.trim(n * r.piece.g, lang) + " g)" };
      if (unit === "g") return { give: { g: n }, text: L.trim(n, lang) + " g" };
      if (unit === "drops") return { give: { drops: n }, ml: n * L.DROP, text: n + " " + T("unit.drop") };
      return { give: { ml: n }, ml: n, text: n + " mL" };
    }

    // Was in der Hand liegt, schwebt oben links über der Fläche: Name, Menge und ein Knopf, der es zurücklegt
    function renderHand() {
      var h = st.hand, name, drop = '<button type="button" class="cl-btn cl-round cl-x" data-act="drop" title="' + esc(T("hand.drop")) + '" aria-label="' + esc(T("hand.drop")) + '">' + CLOSE_ICON + "</button>";
      ui.hand.hidden = !h;
      if (el.setAttribute) el.setAttribute("data-hand", !h ? "" : h.tool || h.test ? "tool" : "stuff");      // die Gefäße zeigen dann, dass sie Ziel sind
      if (!h) { ui.hand.innerHTML = ""; return; }
      if (h.tool || h.test) {
        name = L.parts[h.id];
        ui.hand.innerHTML = L.icon(h.id) + "<strong>" + esc(L.partName(h.id, lang)) + '</strong> <span class="cl-hint">' +
          esc(T(h.test ? (name.probe === "pipette" ? (h.from ? "hint.pipette2" : "hint.pipette1") : name.probe === "rod" ? "hint.rod" : name.probe === "paper" ? "hint.paper" : "hint.test") : name.fits ? "hint.centrifuge" : name.filter ? "hint.funnel" : name.dispenser ? "hint.over" : name.scale ? "hint.scale" : name.plug ? "hint.stopper" : name.under ? "hint.under" : name.sense === "V" ? "hint.join"
            : name.electrode ? "hint.electrode" : name.circuit ? "hint.circuit" : name.bridge ? (h.from ? "hint.bridge2" : "hint.bridge1")
            : name.pipe ? (h.from ? "hint.tube2" : "hint.tube1") : name.condenser ? (h.from ? "hint.still2" : "hint.still1") : "hint.tool")) + "</span>" +
          // der Brenner darf für sich stehen: dafür ein Knopf, damit es auch mit der Tastatur geht
          (name.under ? ' <button type="button" class="cl-btn" data-act="bench">' + esc(T("hand.bench")) + "</button>" : "") + drop;
        return;
      }
      name = L.nameOf(L.reagent(h.id), lang);
      ui.hand.innerHTML = L.icon(h.id) + "<strong>" + esc(name) + "</strong> " + L.ghsLabel(h.id, lang, true) + stepper("cl-amount") +
        ' <span class="cl-hint">' + esc(T("hint.hand")) + "</span>" + drop;
      syncAmount();
    }

    function stepper(cls) {
      return '<span class="cl-stepper"><span class="cl-sr">' + esc(T("amount")) + ":</span>" +
        '<button type="button" class="cl-btn cl-round" data-act="less" aria-label="' + esc(T("less")) + '">−</button>' +
        '<output class="' + cls + '">' + esc(portion().text) + "</output>" +
        '<button type="button" class="cl-btn cl-round" data-act="more" aria-label="' + esc(T("more")) + '">+</button></span>';
    }

    function syncAmount() {         // nach „weniger“ oder „mehr“ ändert sich nur die Zahl, die Knöpfe bleiben stehen
      if (!st.hand || st.hand.tool || st.hand.test) return;
      ui.hand.querySelector(".cl-amount").textContent = portion().text;
      syncGive();
    }

    function setHand(hand) {
      st.hand = hand;
      syncShelf();
      renderHand();
      renderGive();
    }

    function pick(id) {
      var def = L.parts[id], type = id;
      status("");
      if (!allowed(id)) return;
      if (def && def.kind === "vessel" && !def.dispenser) {     // ein Gefäß kommt gleich auf den Tisch
        setHand(null);
        change(function (lab) { return L.place(lab, { type: type }); }, function (made) { return { key: "placed", part: made }; });
        return;
      }
      setHand(st.hand && st.hand.id === id ? null : def ? (def.kind === "test" ? { id: id, test: true } : { id: id, tool: true }) : { id: id, i: startOf(L.reagent(id)) });
    }

    // Aus der Karte eines Gefäßes: ein Stoff kommt in die Hand (zugegeben wird mit dem Knopf darunter oder durch Antippen des Gefäßes),
    // ein Gerät oder eine Probe wirkt gleich an diesem Gefäß. Salzbrücke und Kühler warten danach auf das zweite Gefäß.
    function use(id) {
      var def = L.parts[id], target = st.sel;
      if (!def) { pick(id); return; }
      if (!L.vessel(st.run.lab, target) || !allowed(id)) return;
      status("");
      setHand(def.kind === "test" ? { id: id, test: true } : { id: id, tool: true });
      give(target);
      if (st.hand && st.hand.tool && !st.hand.from) setHand(null);      // ging es nicht, bleibt das Gerät nicht in der Hand liegen
    }

    // ---------------------------------------------------------------- Eingriffe

    // Jeder Eingriff läuft über die Aufzeichnung: in der Vergangenheit schneidet er die Zukunft ab
    function change(work, mark) {
      var run = st.run, cut = L.inPast(run);
      var result = L.act(run, work, mark);
      pending = 0;
      playFrom = run.time;
      st.play = 1;
      status(cut ? T("cut") : "");
      refresh();
      kick();
      return result;
    }

    // ob ein Gefäß in der laufenden Zentrifuge steckt; dann sagt die Statuszeile, warum nichts geht
    function spun(id) {
      if (!st.run.lab.tools.some(function (t) { return t.in === id && t.spin; })) return false;
      status(T("spinning"));
      return true;
    }

    function give(id) {
      var lab = st.run.lab, h = st.hand, p, def, over, kind;
      if (L.vessel(lab, id).broken) { status(T("brokenGlass")); return; }
      if (spun(id) || (h.from && spun(h.from))) return;
      if (h.test && L.parts[h.id].probe === "pipette") {       // Vollpipette: erst aufziehen, dann abgeben
        p = L.parts[h.id].ml;
        if (L.parts[L.vessel(lab, id).type].dispenser && !h.from) { status(T(L.parts[L.vessel(lab, id).type].filter ? "notHere.funnel" : "notHere")); return; }
        if (lab.tools.some(function (t) { return t.in === id && L.parts[t.type].stopper; })) { status(T("closed")); return; }
        if (!h.from) {
          if (L.pourable(lab, id) < p - 1e-9) { status(T("pipetteShort")); return; }
          st.hand = { id: h.id, test: true, from: id };
          renderHand();
          status(T("pipetteDrawn", { vessel: names()[id] || id }));      // die Hand ist keine Live-Region: die Statuszeile sagt es an
          return;
        }
        if (h.from === id) { status(T("pipetteSame")); return; }
        if (L.pourable(lab, h.from) < p - 1e-9) { status(T("pipetteShort")); return; }
        if (L.free(lab, L.vessel(lab, id)) < p - 1e-9) { status(T("pipetteFull")); return; }
        kind = h.from;
        st.hand = { id: h.id, test: true };
        renderHand();
        change(function (l) { return L.pipette(l, kind, id, p); }, { key: "pipetted", from: kind, vessel: id, ml: p, part: h.id });
        return;
      }
      if (h.test) {                                             // Span an die Öffnung, Stäbchen in die Lösung und dann in die Flamme
        kind = L.parts[h.id].probe;
        if (L.parts[L.vessel(lab, id).type].dispenser) { status(T(L.parts[L.vessel(lab, id).type].filter ? "notHere.funnel" : "notHere")); return; }
        if (kind === "rod" && !lab.tools.some(function (t) { return t.flame === 2; })) { status(T("noFlame")); return; }
        if (kind !== "rod" && lab.tools.some(function (t) { return t.in === id && L.parts[t.type].stopper; })) { status(T("closed")); return; }
        change(function (l, emit) { return kind === "rod" ? L.flameTest(l, id, emit) : L.probe(l, id, kind, emit); });
        return;
      }
      if (h.tool) {                                             // Messgerät hinein, Bürette darüber, Brenner darunter
        def = L.parts[h.id]; over = !!def.dispenser;
        if (L.parts[L.vessel(lab, id).type].dispenser) { status(T(L.parts[L.vessel(lab, id).type].filter ? "notHere.funnel" : "notHere")); return; }
        if (def.electrode) {                                    // zwei Elektroden je Becherglas
          if (!L.parts[L.vessel(lab, id).type].electrodes) { status(T("tooNarrow")); return; }
          if (lab.tools.filter(function (t) { return t.in === id && L.parts[t.type].electrode; }).length >= 2) { status(T("twoOnly")); return; }
        } else if (def.circuit && !L.parts[L.vessel(lab, id).type].electrodes) { status(T("noCircuit")); return; }
        else if ((def.flames || def.bath) && L.parts[L.vessel(lab, id).type].insulated) { status(T("insulated")); return; }
        else if ((def.flames || def.bath) && L.parts[L.vessel(lab, id).type].noHeat) { status(T("noHeat")); return; }
        else if (def.fits && L.vessel(lab, id).type !== def.fits) { status(T("tubesOnly")); return; }
        else if (def.bridge && lab.tools.some(function (t) { return L.parts[t.type].bridge && (t.in === id || t.to === id); })) { status(T("occupied")); return; }      // an jedem Gefäß hängt nur ein Ende
        // Kühler und Rohr: aus jedem Gefäß führt einer, in jedes zweite Gefäß einer; in einem Stopfen steckt nur ein Gerät
        else if (def.duct && lab.tools.some(function (t) { return L.parts[t.type].duct && (h.from ? t.to : t.in) === id; })) { status(T("occupied")); return; }
        else if (def.stopper && !h.from && lab.tools.some(function (t) { return L.parts[t.type].stopper && t.in === id; })) { status(T("occupied")); return; }
        else if ((def.bridge || def.duct) && !h.from) {         // Salzbrücke, Kühler und Rohr brauchen zwei Gefäße: das erste merken
          st.hand = { id: h.id, tool: true, from: id };
          status("");
          renderHand();
          return;
        } else if ((def.bridge || def.duct) && h.from === id) { status(T(def.pipe ? "sameTube" : def.condenser ? "sameStill" : "sameVessel")); return; }
        else if (over ? lab.vessels.some(function (v) { return v.over === id; })
          : lab.tools.some(function (t) { return t.in === id && (def.under ? L.parts[t.type].under : t.type === h.id); })) { status(T("occupied")); return; }      // unter einem Gefäß steht ein Brenner oder ein Wasserbad
        setHand(null);
        if (def.bridge || def.duct) {
          change(function (l) { return L.place(l, { type: h.id, in: h.from, to: id }); }, function (made) { return { key: "bridged", part: made, vessel: h.from, to: id }; });
          return;
        }
        change(function (l) { return L.place(l, over ? { type: h.id, over: id } : { type: h.id, in: id }); },
          function (made) { return { key: over ? "hung" : def.under ? "under" : def.plug ? "plugged" : def.sense === "V" || def.circuit ? "joined" : "probe", part: made, vessel: id }; });
        return;
      }
      p = portion();
      if (p.ml && p.ml > L.free(lab, L.vessel(lab, id)) + 1e-9) { status(T("full")); return; }
      change(function (l) { return L.add(l, id, h.id, p.give); }, Object.assign({ key: "added", vessel: id, reagent: h.id }, p.give));
    }

    function select(id) {
      if (st.sel === id && st.copyText == null) return;
      if (st.sel !== id) st.tab = null;         // ein anderes Gefäß beginnt wieder beim ersten Reiter seiner Karte
      st.sel = id;
      st.copyText = null;
      renderPanel();
      paint();
      slow();
    }

    function tap(id) {
      var lab = st.run.lab, t = L.tool(lab, id);
      if (!id) {
        if (st.hand && st.hand.tool && L.parts[st.hand.id].under) alone();      // ein Brenner darf auch für sich auf dem Tisch stehen
        else select(null);
        return;
      }
      // mit etwas in der Hand ist das Gefäß gemeint; nur der Brenner darunter bleibt wählbar, damit man ihn anzünden kann
      if (st.hand && t && !L.parts[t.type].under && !L.parts[t.type].circuit && L.vessel(lab, t.in)) id = t.in;
      if (st.hand && L.vessel(lab, id)) give(id);
      else select(st.sel === id ? null : id);
    }

    function alone() {              // das Gerät aus der Hand für sich auf den Tisch
      var type = st.hand.id;
      setHand(null);
      change(function (l) { return L.place(l, { type: type }); }, function (made) { return { key: "placed", part: made }; });
    }

    function pourOut() {
      var lab = st.run.lab, from = L.vessel(lab, st.sel), toId = ui.panel.querySelector(".cl-pour-to").value;
      var to = L.vessel(lab, toId), ml = parseFloat(String(ui.panel.querySelector(".cl-pour-ml").value).replace(",", "."));
      if (!from || !to || spun(from.id) || spun(toId)) return;
      if (!(ml > 0) || !isFinite(ml)) { status(T("badAmount")); return; }
      if (!(L.pourable(lab, from.id) > 1e-6)) { status(T("nothing")); return; }
      ml = Math.min(ml, L.pourable(lab, from.id), L.free(lab, to));
      if (!(ml > 1e-6)) { status(T("full")); return; }
      change(function (l) { return L.pour(l, from.id, toId, ml); }, { key: "poured", from: from.id, vessel: toId, ml: ml });
    }

    // Zentrifuge an- oder ausschalten; anlaufen kann sie nur mit einem freien Reagenzglas (ein Stopfen darf bleiben)
    function spin(id, on) {
      var t = L.tool(st.run.lab, id);
      if (!t || t.spin === on) return;
      if (on && !L.spinFree(st.run.lab, id)) {                  // warum nicht: kein Glas, es fließt noch, oder etwas steckt darin, hängt darüber, führt hinein
        status(T(!L.vessel(st.run.lab, t.in) ? "spinEmpty" : st.run.lab.flows.some(function (f) { return f.to === t.in || f.from === t.in; }) ? "spinFlow" : "spinFree"));
        return;
      }
      change(function (l) { return L.setSpin(l, id, on); }, { key: "spin", part: id, level: on });
    }

    // Spannung einstellen. Wer den Regler in kleinen Schritten dreht (Pfeiltasten), stellt in Wahrheit einmal ein:
    // Folgt eine Einstellung auf die vorige, ohne dass die Uhr dazwischen weiterlief und ohne dass etwas anderes
    // im Protokoll steht, ersetzt sie deren Zeile. Lief die Uhr, hat die vorige Spannung eine Weile gegolten: Ihre Zeile bleibt.
    var dialed = null;
    // Ein Schieber wurde losgelassen: Spannung des Netzgeräts ("volts"), Temperatur des Wasserbads ("temp"), Wellenlänge des
    // Fotometers ("wave", im Protokoll "nm") oder Kolben des Kolbenprobers ("hold"). Wer im selben Augenblick weiterdreht, bekommt eine Zeile im Protokoll, nicht viele.
    function setDial(id, key, value) {
      var run = st.run, def = L.parts[L.tool(run.lab, id).type], field = key === "wave" ? "nm" : key, mark = { key: key, part: id }, again;
      var set = key === "volts" ? L.setVolts : key === "temp" ? L.setTemp : key === "hold" ? L.setHold : L.setWave;
      var limits = key === "volts" ? [0, def.max] : key === "temp" ? def.range : key === "hold" ? [0, def.cap] : def.waves;
      value = Math.max(limits[0], Math.min(limits[1], value));
      value = key === "volts" ? Math.round(value * 10) / 10 : Math.round(value);
      mark[field] = value;
      again = !!dialed && dialed.part === id && dialed.key === key && !L.inPast(run) && run.log[run.log.length - 1] === dialed && run.lab.t === dialed.t;
      change(function (l) { return set(l, id, value); }, again ? null : mark);
      if (again) {
        run.log[run.log.length - 1] = Object.assign({}, dialed, mark);       // ein neues Objekt: so baut das Protokoll die Zeile neu
        renderLog();
      }
      dialed = run.log[run.log.length - 1];
    }

    function reset() {                                           // in einem fremden Versuch: nur die Ansicht, der eigene bleibt
      useRun({ run: L.createRun(st.config) });
      save();
    }

    // Einen Lauf mit seinen Gerätenamen zeigen: neu, gespeichert, fremd oder wieder der eigene
    function useRun(b) {
      st.run = b.run;
      st.names = b.names || {}; st.counts = b.counts || {}; st.types = b.types || {}; st.lang = b.lang;
      st.sel = null;
      st.copyText = null;                                        // ein kopierter Text gehört zum alten Versuch
      st.play = 0; st.solved = false;
      pending = 0;
      status("");
      shape = null;
      setHand(null);
      renderPanel();
      renderOthers();
      refresh();
    }

    // ---------------------------------------------------------------- Speichern und Teilen
    // Ein Layer von LiaScript je Fläche: gespeichert ab Kursversion 1.0.0, im Klassenraum abgeglichen.
    // Wer fremde Versuche sieht, regelt der Modus des Klassenraums (Shared: alle, Summary/Details: die Lehrkraft).
    function keyOf() { return st.run.log.length + "|" + st.run.end + "|" + JSON.stringify(st.run.lab.samples); }
    function fresh(run) { return !run.log.length && !run.end && !Object.keys(run.lab.samples).some(function (k) { return run.lab.samples[k].said != null; }); }
    function save() {
      if (saveTimer) global.clearTimeout(saveTimer);
      saveTimer = 0;
      if (!layer || st.own || keyOf() === savedKey) return;     // einen fremden Versuch speichert niemand als eigenen
      savedKey = keyOf();
      layer.set(fresh(st.run) ? [] : [{ src: text, run: L.saveRun(st.run), names: st.names, counts: st.counts, types: st.types, lang: st.lang }])
        .catch(function (error) { if (global.console) global.console.warn("ChemLab:", error); });
    }
    function saveSoon() { if (layer && !saveTimer && !st.own && keyOf() !== savedKey) saveTimer = global.setTimeout(save, 2000); }
    function loaded(v) {            // null, wenn sich der gespeicherte Stand nicht lesen lässt (etwa aus einer anderen Fassung)
      try {
        var c = JSON.parse(JSON.stringify(v));                   // LiaScript reicht gefrorene Werte
        return { run: L.loadRun(st.config, c.run), names: c.names, counts: c.counts, types: c.types, lang: c.lang };
      } catch (error) {
        if (global.console) global.console.warn("ChemLab:", error);
        return null;
      }
    }
    function renderOthers() {
      var list = st.others || [];
      ui.others.hidden = !list.length;
      ui.otherlist.innerHTML = list.map(function (l) {
        return '<button type="button" class="cl-btn" data-act="other" data-id="' + esc(l.id) + '">' + esc((l.symbol ? l.symbol + " " : "") + (l.name || T("others.anon"))) + "</button>";
      }).join("");
      ui.viewing.hidden = !st.own;
      ui.viewing.querySelector("span").textContent = st.own ? T("others.viewing", { name: st.viewing }) : "";
    }
    function view(id) {
      var l = (st.others || []).filter(function (x) { return x.id === id; })[0], b = l && loaded(l.values[0]);
      if (!b) return;
      save();                                                    // der eigene Stand ist gesichert, bevor ein fremder kommt
      if (!st.own) st.own = { run: st.run, names: st.names, counts: st.counts, types: st.types, lang: st.lang };
      st.viewing = l.name || T("others.anon");
      useRun(b);
    }
    function mine() {
      var own = st.own;
      if (!own) return;
      st.own = null;
      useRun(own);
    }

    // ---------------------------------------------------------------- Arbeitsfläche

    function layout() {
      var lab = st.run.lab, list = [], width = 0, x, free = [], reach = 0;
      var lifts = {}, room = {}, wide = {};
      lab.tools.forEach(function (t) {                    // was an einem Gefäß hängt, bestimmt dessen Höhe und Platzbedarf
        var host = L.vessel(lab, t.in), def = L.parts[t.type];
        if (!host) return;
        if (def.under) lifts[host.id] = def.stand(host).lift;
        if (def.under && def.span) wide[host.id] = def.span(host);          // ein Wasserbad ist breiter als das Gefäß darin
        if (def.room) room[host.id] = def.room + (lab.vessels.some(function (o) { return o.over === host.id; }) ? 60 : 0);      // an einer Bürette vorbei braucht er mehr Platz
      });
      lab.vessels.forEach(function (v) {
        var host = L.vessel(lab, v.over), def = L.parts[v.type], up = lifts[host ? host.id : v.id] || 0;
        if (def.reach) reach = Math.max(reach, def.reach(host ? L.parts[host.type].mount(L.view(lab, host)) : null) + up);
        if (up) reach = Math.max(reach, up - def.bounds(v).top + 8);
        if (host) free.push({ id: v.id, type: v.type, vessel: true, host: v.over });
        else {
          list.push({ id: v.id, type: v.type, vessel: true, w: Math.max(def.width(v), wide[v.id] || 0), lift: up, extra: room[v.id] ? Math.max(0, room[v.id] - def.width(v) / 2 + 30) : 0 });
          lab.tools.forEach(function (t) {                // Netzgerät, Messgeräte und Lämpchen stehen gleich neben ihrem Gefäß
            if (t.in === v.id && L.parts[t.type].circuit) list.push({ id: t.id, type: t.type, w: L.parts[t.type].width(t), beside: v.id });
          });
        }
      });
      lab.tools.forEach(function (t) {
        var host = L.vessel(lab, t.in), def = L.parts[t.type], place, far;
        if (host && def.circuit) return;
        if (host && (def.electrode || def.bridge)) reach = Math.max(reach, (lifts[host.id] || 0) - L.parts[host.type].bounds(host).top + 96);      // Platz für die Leitungen
        if (host) {
          free.push({ id: t.id, type: t.type, host: t.in, under: !!def.under });
          if (!def.under && !def.electrode && !def.bridge && !def.condenser) {      // Messgeräte ragen über das Gefäß hinaus, erst recht über ein gehobenes
            place = L.parts[host.type].probe(host, t.type);
            reach = Math.max(reach, (lifts[host.id] || 0) - (place.top != null ? place.top : place.rim - 60) + 44);
            far = def.pipe && L.vessel(lab, t.to);              // das Rohr steigt auch über ein erhöhtes zweites Gefäß
            if (far) reach = Math.max(reach, (lifts[far.id] || 0) - L.parts[far.type].probe(far, "tube").top + 44);
          }
        } else list.push({ id: t.id, type: t.type, w: def.width(t) });
      });
      list.forEach(function (item) { width += item.w + (item.extra || 0); });
      // Die Fläche hat eine feste Höhe; ihre Breite in Bildpunkten folgt dem Platz auf der Seite,
      // damit die Geräte ihre Größe behalten und der Tisch über die ganze Breite reicht.
      bench = Math.max(BENCH, Math.ceil(reach) + 16);
      if (ui.svg.style) ui.svg.style.height = (26 * (bench + FRONT) / (BENCH + FRONT)).toFixed(1) + "em";     // höher, wenn eine Bürette Platz braucht
      var box = ui.svg.getBoundingClientRect ? ui.svg.getBoundingClientRect() : null;
      var total = Math.max(width + 40, box && box.height > 0 ? Math.round((bench + FRONT) * box.width / box.height) : 600);
      x = (total - width) / 2;
      list.forEach(function (item) { item.x = x + item.w / 2; x += item.w + (item.extra || 0); });
      // Stecken mehrere Messgeräte in einem Gefäß, kommt die längste Sonde zuerst: Was später gezeichnet wird, liegt obenauf,
      // und so steht kein Stab vor der Anzeige einer kürzeren Sonde.
      free.forEach(function (item) {
        var def = L.parts[item.type], host = L.vessel(lab, item.host);
        item.reach = !item.vessel && !item.under && def.sense && def.sense !== "V" && host ? L.parts[host.type].probe(host, item.type).top : null;
      });
      free = free.filter(function (item) { return item.reach == null; }).concat(free.filter(function (item) { return item.reach != null; }).sort(function (a, b) {
        return a.host === b.host ? a.reach - b.reach : a.host < b.host ? -1 : 1;
      }));
      free.forEach(function (item) {                      // Messgeräte und Büretten stehen am Platz ihres Gefäßes, darüber gezeichnet
        var host = list.filter(function (other) { return other.id === item.host; })[0];
        item.x = host.x;
        item.lift = item.under ? 0 : host.lift || 0;      // der Brenner bleibt auf dem Tisch, alles andere geht mit dem Gefäß nach oben
        list.push(item);
      });
      return { list: list, width: total };
    }

    function renderStage() {
      var plan = layout();
      items = plan.list;
      planWidth = plan.width;
      ui.svg.setAttribute("viewBox", "0 0 " + plan.width + " " + (bench + FRONT));
      ui.svg.setAttribute("preserveAspectRatio", "xMidYMax meet");
      ui.svg.innerHTML =
        '<rect class="cl-wall" x="0" y="0" width="' + plan.width + '" height="' + bench + '"/>' +
        '<rect class="cl-bench" x="0" y="' + bench + '" width="' + plan.width + '" height="' + FRONT + '"/>' +
        '<line class="cl-edge" x1="0" x2="' + plan.width + '" y1="' + bench + '" y2="' + bench + '"/>' +
        items.map(function (item) {
          return '<g class="cl-item" data-id="' + esc(item.id) + '"' + (item.vessel && !item.host ? ' data-kind="vessel"' : "") + ' transform="translate(' + item.x + "," + (bench - (item.lift || 0)) + ')" tabindex="0" role="button"></g>';
        }).join("") + '<g class="cl-wires"></g>';
      nodes = {};
      items.forEach(function (item) { nodes[item.id] = ui.svg.querySelector('[data-id="' + item.id + '"]'); });
      ui.wires = ui.svg.querySelector(".cl-wires");
      if (three) three.build(items, plan.width, st.run.lab);
    }

    // Die Trefferfläche eines Geräts. Nur sie nimmt Zeiger-Ereignisse an (siehe chemlab.css).
    function frameBox(b, selected) {
      return '<rect class="cl-hit' + (selected ? " cl-sel" : "") + '" x="' + b.x0 + '" y="' + b.top + '" width="' + (b.x1 - b.x0) +
        '" height="' + ((b.bottom == null ? 2 : b.bottom) - b.top) + '" rx="6"/>';
    }

    function shownValue(r) {        // Anzeige eines Messgeräts als Text: „20,0 °C“, „pH 7,00“
      if (r.unit === "pH") return "pH " + (r.value == null ? "–" : L.num(r.value, 2, lang));
      if (r.over && r.unit !== "E") return "> " + L.num(r.value, 0, lang) + " " + r.unit;      // am Ende der Skala
      if (r.flame != null) return T("aria.flame", { state: T("flame." + r.flame) });
      return L.shown(r, lang);
    }

    // Wo eine Elektrode im Gefäß steht: die erste links, die zweite rechts; eine einzelne im rechten Glas einer Salzbrücke rechts
    function slotOf(lab, t) {
      var list = lab.tools.filter(function (o) { return o.in === t.in && L.parts[o.type].electrode; }), far = false;
      if (list.length === 1) lab.tools.forEach(function (o) {
        var ends;
        if (!L.parts[o.type].bridge || (o.in !== t.in && o.to !== t.in)) return;
        ends = lab.vessels.filter(function (v) { return v.id === o.in || v.id === o.to; });
        if (ends.length === 2 && ends[1].id === t.in) far = true;
      });
      return far ? 1 : list.indexOf(t);
    }

    function at(id) { return items.filter(function (item) { return item.id === id; })[0]; }

    // Die Salzbrücke reicht vom Gefäß, an dem sie hängt, zum anderen: Stellen in den Koordinaten ihres eigenen Platzes
    function span(lab, t) {
      var host = L.vessel(lab, t.in), far = L.vessel(lab, t.to), a = at(t.in), b = far && at(t.to), dir, pa, pb, up;
      if (!host || !a) return null;
      dir = b && b.x < a.x ? -1 : 1;
      pa = L.parts[host.type].probe(host, "bridge", dir);
      // beide Enden tauchen ein Stück unter den Flüssigkeitsspiegel, wenn Flüssigkeit da ist
      function end(vessel, p) {
        var w = L.view(lab, vessel), top = w.ml > 0.005 ? L.parts[vessel.type].surface(w) : p.rim + 30;
        return Math.min(-6, Math.max(p.rim + 30, top + 16));
      }
      if (!b) return { x1: pa.x, y1: pa.rim, s1: end(host, pa), x2: pa.x + 30 * dir, y2: pa.rim, s2: pa.rim + 12 };       // das andere Ende hängt frei
      pb = L.parts[far.type].probe(far, "bridge", -dir);
      up = (a.lift || 0) - (b.lift || 0);
      return { x1: pa.x, y1: pa.rim, s1: end(host, pa), x2: b.x - a.x + pb.x, y2: pb.rim + up, s2: end(far, pb) + up };
    }

    // Der Kühler führt vom Ansatzrohr des Gefäßes, an dem er steckt, zur Öffnung der Vorlage: Stellen in den Koordinaten seines Platzes
    function duct(lab, t) {
      var host = L.vessel(lab, t.in), far = L.vessel(lab, t.to), a = at(t.in), b = far && at(t.to), dir, pa, pb, up, w;
      if (!host || !a) return null;
      dir = b && b.x < a.x ? -1 : 1;
      pa = L.parts[host.type].probe(host, "condenser", dir);
      if (!b) return { x1: pa.x, y1: pa.rim, x2: pa.x + 70 * dir, y2: pa.rim + 30, s2: pa.rim + 60, up: 0 };       // das andere Ende hängt frei
      pb = L.parts[far.type].probe(far, "bridge", -dir);
      up = (a.lift || 0) - (b.lift || 0);
      w = L.view(lab, far);
      // up: so viel tiefer steht die Vorlage (Hub); die 3D-Ansicht streckt den Hub und braucht ihn deshalb getrennt
      return { x1: pa.x, y1: pa.rim, x2: b.x - a.x + pb.x, y2: pb.rim + up, s2: (w.ml > 0.005 ? L.parts[far.type].surface(w) : -4) + up, up: up };
    }

    // Das Gasableitungsrohr: vom Stopfen im ersten Gefäß zum zweiten, dort bis unter den Spiegel oder, ist es leer, fast bis zum Boden.
    // Stellen in den Koordinaten seines Platzes; up wie beim Kühler
    function pipeline(lab, t) {
      var host = L.vessel(lab, t.in), far = L.vessel(lab, t.to), a = at(t.in), b = far && !far.broken && at(t.to), pa, pb, up, w, s2;
      if (!host || !a) return null;
      pa = L.parts[host.type].probe(host, "tube");
      if (!b) return { x1: pa.x, y1: pa.rim, w: pa.w, x2: pa.x + 60, y2: pa.rim, end: pa.rim + 30, up: 0 };       // das andere Ende hängt frei
      pb = L.parts[far.type].probe(far, "tube");
      up = (a.lift || 0) - (b.lift || 0);
      w = L.view(lab, far);
      s2 = w.ml > 0.005 ? L.parts[far.type].surface(w) : null;
      return { x1: pa.x, y1: pa.rim, w: pa.w, x2: b.x - a.x + pb.x - 4, y2: pb.rim + up, s2: s2 == null ? null : s2 + up,
        end: (s2 == null ? L.parts[far.type].probe(far, "thermometer").bottom : Math.min(s2 + 22, L.parts[far.type].probe(far, "thermometer").bottom)) + up, up: up };
    }

    // Leitungen der Stromkreise: von der linken Elektrode über Netzgerät, Lämpchen und Strommesser zur rechten; der Spannungsmesser hängt an beiden.
    // Jede Leitung verbindet zwei Anschlüsse [Gerät, Nummer]; cls: Pol (" cl-plus", " cl-minus" oder ""), circuit: Nummer des Stromkreises.
    // Gilt für 2D und 3D; ends sagt nur, welche Geräte Anschlüsse haben.
    function links(lab, ends) {
      var out = [];
      L.circuits(lab).forEach(function (c, circuit) {
        var a = L.tool(lab, c.a), b = L.tool(lab, c.b), from = [c.a, 0], sign = "";
        var parts = lab.tools.filter(function (t) { return L.parts[t.type].circuit && ends[t.id] && (t.in === a.in || t.in === b.in); });
        function link(p, q, cls) { out.push({ a: p, b: q, cls: cls, circuit: circuit }); }
        if (!ends[c.a] || !ends[c.b]) return;
        ["supply", "load", "ammeter"].forEach(function (kind) {
          parts.forEach(function (t) {
            var r = L.reading(lab, t.id);
            if (L.parts[t.type].circuit !== kind) return;
            link(from, [t.id, 0], kind === "supply" ? (r.flip ? " cl-minus" : " cl-plus") : sign);
            sign = kind === "supply" ? (r.flip ? " cl-plus" : " cl-minus") : sign;
            from = [t.id, 1];
          });
        });
        if (from[0] !== c.a) link(from, [c.b, 0], sign);
        parts.forEach(function (t) {
          if (L.parts[t.type].circuit !== "voltmeter") return;
          link([c.a, 0], [t.id, 0], "");
          link([t.id, 1], [c.b, 0], "");
        });
      });
      return out;
    }

    // In 2D: rechtwinklig über eine Schiene oberhalb der Anschlüsse; jede weitere Leitung eines Kreises eine Stufe höher
    function wiring(lab, ends) {
      var out = "", n = 0, circuit = -1;
      links(lab, ends).forEach(function (k) {
        var p = ends[k.a[0]][k.a[1]], q = ends[k.b[0]][k.b[1]], rail;
        if (k.circuit !== circuit) { circuit = k.circuit; n = 0; }
        rail = Math.min(p.y, q.y) - 12 - 7 * n++;
        out += '<path class="cl-wire' + k.cls + '" d="M' + p.x + "," + p.y + "L" + p.x + "," + rail + "L" + q.x + "," + rail + "L" + q.x + "," + q.y + '"/>';
      });
      return out;
    }

    // Zeichnet jedes Gerät neu aus dem Zustand zur Zeit des Zeigers
    function paint() {
      var lab = st.run.lab, now = st.run.time + pending, label = names(), marks = {}, ends = {};
      var sign = lab.vessels.map(function (v) { return v.id + ">" + v.over + (v.broken ? "!" : ""); }).concat(lab.tools.map(function (t) { return t.id + ">" + t.in + ">" + (t.to || ""); })).join("|");
      // was eben geschah und kurz zu sehen bleibt: der Span an der Öffnung, der Blitz einer Verpuffung
      st.run.log.slice(Math.max(0, st.run.frames[st.run.cursor].n - 8), st.run.frames[st.run.cursor].n).forEach(function (event) {
        if ((event.key !== "splint" && event.key !== "pop" && event.key !== "popped" && event.key !== "spatter") || !(now - event.t < SHOWN) || now < event.t) return;
        (marks[event.vessel] = marks[event.vessel] || []).push(Object.assign({ age: now - event.t }, event));
      });
      if (sign !== shape) {
        shape = sign;
        if (st.sel && !L.vessel(lab, st.sel) && !L.tool(lab, st.sel)) st.sel = null;
        renderStage();
        renderPanel();
      }
      items.forEach(function (item, index) {
        var g = nodes[item.id], def = L.parts[item.type];
        var ctx = { lang: lang, numbers: show.numbers, volumes: show.volumes, uid: el.id, t: now, still: still, seed: index + 1, flow: FLOWS[st.flow || 0], no: ordinal(item.id), lift: item.lift || 0, marks: marks[item.id],
          // der Dampf geht in einen Kühler und steigt nicht aus der Öffnung
          sealed: lab.tools.some(function (t) { return t.in === item.id && L.parts[t.type].duct && L.vessel(lab, t.to) && !L.vessel(lab, t.to).broken; }) };
        var v, w, r, host, place, b, content, hang, aria;
        if (item.vessel) {
          v = L.vessel(lab, item.id);
          w = L.view(lab, v);
          host = L.vessel(lab, v.over);
          hang = host ? L.parts[host.type].mount(L.view(lab, host)) : null;      // nur für Büretten: wo sie hängt
          content = w.broken ? T("aria.broken") : w.ml > 0.005
            ? (show.numbers && show.volumes ? T("aria.liquid", { ml: L.trim(Math.round(w.ml * 10) / 10, lang), color: L.colorWord(w.color.name, w.color.pale, lang) })
              : L.colorWord(w.color.name, w.color.pale, lang)) + (w.cloud.alpha > 0.3 ? ", " + T("aria.cloudy") : "") + (w.steam > 0 ? ", " + T("aria.boiling") : "")
            : T(w.sediment.ml > 0.002 ? "aria.sediment" : w.residue > 1e-7 ? "aria.residue" : "aria.empty");
          if (w.fire.length || w.torch) content += ", " + T("aria.burning");
          if (def.dispenser && !def.filter) {
            content += ", " + T("aria.tap", { state: T("tap." + L.tapKey(w.tap)) }) +
              (show.numbers && show.volumes && w.given > 0 ? ", " + T("aria.given", { ml: L.num(w.given, 1, lang) }) : "");
          }
          b = def.bounds(v, hang);
          aria = T("aria.vessel", { name: label[item.id] + (host ? " " + T("aria.over", { vessel: label[host.id] }) : ""), content: content });
          if (three) three.item({ id: item.id, type: item.type, vessel: true, data: w, hang: hang, box: b, host: host ? host.id : null, x: item.x, lift: item.lift || 0, label: aria, name: label[item.id], selected: st.sel === item.id, ctx: ctx });
          else g.innerHTML = frameBox(b, st.sel === item.id) + def.draw(w, ctx, hang);
          g.setAttribute("aria-label", aria);
        } else {
          r = L.reading(lab, item.id);
          host = L.vessel(lab, r.in);
          place = !host || def.circuit ? null : def.bridge ? span(lab, L.tool(lab, item.id)) : def.pipe ? pipeline(lab, L.tool(lab, item.id)) : def.condenser ? duct(lab, L.tool(lab, item.id)) : def.under ? def.stand(host)
            : L.parts[host.type].probe(host, item.type, def.electrode ? slotOf(lab, L.tool(lab, item.id)) : 0);
          if (def.sense === "V" && place && lab.vessels.some(function (o) { return o.over === host.id; })) {
            // hängt über dem Gefäß eine Bürette, beginnt der Zylinder des Kolbenprobers erst rechts von ihr und ihrem Stativ
            w = L.parts[host.type].mount(L.view(lab, host));
            // das Stativ der Bürette oder des Trichters
            place.off = Math.max(20, (lab.vessels.some(function (o) { return o.over === host.id && L.parts[o.type].filter; }) ? L.shapes.funnelAt(w).rod
              : Math.max(w.x + 26, (w.edge || 0) + 14)) + 10 - place.x);
          }
          if (def.electrode && place) {                          // wie hoch die Flüssigkeit steht, in der sie taucht
            w = L.view(lab, host);
            place.surface = w.ml > 0.005 ? L.parts[host.type].surface(w) : null;
          }
          // im Gefäß ist nur antippbar, was über dessen Rand hinausragt; das Gefäß selbst bleibt frei
          b = def.under || def.sense === "V" || def.plug || def.circuit || def.bridge || def.duct || def.reflux ? def.bounds(r, place)
            : place ? { x0: place.x - (def.electrode ? 9 : 14), x1: place.x + (def.electrode ? 9 : 14), top: place.top - (def.electrode ? 16 : 4), bottom: L.parts[host.type].bounds(host).top } : def.bounds();
          if (!three) g.innerHTML = frameBox(b, st.sel === item.id) + def.draw(r, ctx, place);
          // Anschlüsse in den Koordinaten der Fläche, für die Leitungen
          if (def.electrode && host) { w = def.terminal(place); ends[item.id] = [{ x: item.x + w.x, y: bench - (item.lift || 0) + w.y }]; }
          else if (def.circuit) ends[item.id] = def.terminals.map(function (p) { return { x: item.x + p.x, y: bench + p.y }; });
          content = def.flames ? T("aria.flame", { state: T("flame." + r.flame) }) : def.spin ? T("spin." + (r.spin ? 1 : 0))
            : def.bridge || def.duct || def.reflux ? "" : def.circuit === "load" || show.numbers ? shownValue(r) : "";
          if (def.electrode && r.pole) content += (content ? ", " : "") + T("pole." + r.pole);
          if (def.electrode && r.coat.length && !veiled(r.in)) content += (content ? ", " : "") + T("coat") + ": " + r.coat.map(function (c) { return L.nameOf(L.species(c.id), lang); }).join(", ");
          aria = label[item.id] + (def.bridge || def.duct ? (host && L.vessel(lab, r.to) ? " " + T("aria.between", { vessel: label[host.id], to: label[r.to] }) : "")
            : host ? " " + T(def.under ? "aria.under" : def.plug || def.sense === "V" || def.circuit ? "aria.at" : "aria.in", { vessel: label[host.id] }) : "") + (content ? ": " + content : "");
          g.setAttribute("aria-label", aria);
          if (three) three.item({ id: item.id, type: item.type, vessel: false, data: r, place: place, box: b, host: host ? host.id : null, x: item.x, lift: item.lift || 0, label: aria, name: label[item.id], selected: st.sel === item.id, ctx: ctx });
        }
      });
      if (three) three.end(lab, links(lab, ends));
      else if (ui.wires) ui.wires.innerHTML = wiring(lab, ends);
      if (st.lens) lensView();
    }

    // ---------------------------------------------------------------- Zeitleiste

    function renderTime() {
      ui.time.innerHTML =
        '<button type="button" class="cl-btn cl-round" data-act="start" title="' + esc(T("time.start")) + '" aria-label="' + esc(T("time.start")) + '">' + glyph("start") + "</button>" +
        '<button type="button" class="cl-btn cl-round" data-act="back" title="' + esc(T("time.back")) + '" aria-label="' + esc(T("time.back")) + '" aria-pressed="false">' + glyph("back") + "</button>" +
        '<button type="button" class="cl-btn cl-round" data-act="play" title="' + esc(T("time.play")) + '" aria-label="' + esc(T("time.play")) + '" aria-pressed="false">' + glyph("play") + "</button>" +
        '<button type="button" class="cl-btn cl-round" data-act="end" title="' + esc(T("time.end")) + '" aria-label="' + esc(T("time.end")) + '">' + glyph("end") + "</button>" +
        '<label class="cl-speed">' + esc(T("time.speed")) + ' <select data-act="speed">' + SPEEDS.map(function (s) {
          return '<option value="' + s + '"' + (s === st.speed ? " selected" : "") + ">" + L.trim(s, lang) + "×</option>";
        }).join("") + "</select></label>" +
        // über dem Schieber die Marken: jeder Eingriff und jede Beobachtung, antippen springt dorthin
        '<div class="cl-track"><div class="cl-pins"></div>' +
        '<input class="cl-seek" type="range" role="slider" data-act="seek" min="0" max="0" step="0.05" value="0" aria-label="' + esc(T("time.slider")) + '"></div>' +
        '<span class="cl-clock"></span>';
      ui.pins = ui.time.querySelector(".cl-pins");
      pinKey = "";
      ui.play = ui.time.querySelector('[data-act="play"]');
      ui.back = ui.time.querySelector('[data-act="back"]');
      ui.seek = ui.time.querySelector(".cl-seek");
      ui.clock = ui.time.querySelector(".cl-clock");
    }

    function syncTime() {
      var run = st.run, icon = st.play > 0 ? "pause" : "play";
      // Das Symbol nur tauschen, wenn es sich ändert: Ein Knopf, dessen Inhalt zwischen Drücken und Loslassen ersetzt wird,
      // bekommt vom Browser keinen Klick – „Anhalten“ ginge dann nur mit einem sehr kurzen Druck.
      if (ui.playIcon !== icon) { ui.playIcon = icon; ui.play.innerHTML = glyph(icon); }
      ui.play.setAttribute("aria-pressed", st.play > 0 ? "true" : "false");
      ui.play.setAttribute("aria-label", T(st.play > 0 ? "time.pause" : "time.play"));
      ui.play.setAttribute("title", T(st.play > 0 ? "time.pause" : "time.play"));
      ui.back.setAttribute("aria-pressed", st.play < 0 ? "true" : "false");
      ui.seek.setAttribute("max", String(run.end));
      ui.seek.max = String(run.end);
      ui.seek.value = String(run.time);
      ui.seek.setAttribute("aria-valuetext", L.clock(run.time));
      ui.clock.textContent = L.clock(run.time) + " / " + L.clock(run.end);
    }

    // Marken auf der Zeitleiste: Eingriffe als Raute (mit der Tastatur erreichbar), Beobachtungen als Punkt.
    // Was hinter dem Zeiger liegt, ist schon aufgezeichnet und erscheint blasser.
    function renderPins() {
      var run = st.run, end = run.end, n = run.frames[run.cursor].n, key = run.log.length + "|" + end + "|" + n, ctx, list;
      if (key === pinKey) return;
      pinKey = key;
      if (!(end > 0)) { ui.pins.innerHTML = ""; return; }
      ctx = { lang: lang, numbers: show.numbers, names: names(), hidden: hidden() };
      list = run.log.map(function (event, i) { return { event: event, i: i }; }).filter(function (x) { return x.event.t != null; }).slice(-80);
      ui.pins.innerHTML = list.map(function (x) {
        var act = !!ACTS[x.event.key], text = L.clock(x.event.t) + " – " + L.say(x.event, ctx);
        return '<button type="button" class="cl-pin' + (act ? " cl-act" : "") + (x.i >= n ? " cl-later" : "") + '" data-act="jumpto" data-id="' + x.event.t +
          '" style="left:' + (100 * Math.min(1, x.event.t / end)).toFixed(2) + '%"' + (act ? "" : ' tabindex="-1"') +
          ' title="' + esc(text) + '" aria-label="' + esc(text) + '"></button>';
      }).join("");
    }

    function setPlay(direction) {
      var run = st.run;
      status("");
      st.force = null;
      if (direction > 0 && !L.inPast(run) && L.atRest(run.lab)) {
        // In Ruhe steht die Uhr. Wer gleich noch einmal drückt, lässt sie trotzdem zehn Minuten laufen: für alles, was unmerklich
        // langsam weitergeht (eine stark verdünnte Ioduhr braucht eine halbe Stunde bis zum Umschlag).
        if (insist === run.time) st.force = run.time + 600;
        else { direction = 0; insist = run.time; status(T("rest") + " " + T("restMore")); }
      }
      if (direction < 0 && run.cursor === 0) direction = 0;
      st.play = direction;
      pending = 0;
      playFrom = run.time;
      syncTime();
      hear();
      if (st.play) kick();
    }

    function jump(t) {
      st.play = 0;
      pending = 0;
      if (t >= st.run.end - 1e-9) L.toEnd(st.run); else L.seek(st.run, t);    // t = 0 ist der Aufbau vor dem ersten Eingriff
      status("");
      refresh();
    }

    // ---------------------------------------------------------------- Inhalt des gewählten Geräts

    // Die Karte des gewählten Geräts. Bei einem Gefäß in Reitern: Zugeben (Stoffe aus dem Regal), Geräte (Messgeräte, Brenner,
    // Proben …, die an diesem Gefäß wirken) und Inhalt. Ein kleiner Pfeil zeigt auf das Gerät.
    function renderPanel() {
      var lab = st.run.lab, v = L.vessel(lab, st.sel), t = L.tool(lab, st.sel), label = names(), others, html, tabs = "", stuff, gear;
      ui.panel.setAttribute("data-tab", "");
      if (v && v.broken) {
        html = head(v.id) + "<p>" + esc(T("brokenGlass")) + '</p><div class="cl-actions">' + removal() + "</div>";
      } else if (v) {
        others = lab.vessels.filter(function (o) { return o.id !== v.id && !o.broken; });
        stuff = shelfIds().filter(function (id) { return !L.parts[id]; });
        // was an einem Gefäß wirken kann: alle Geräte außer den Gefäßen, die für sich auf den Tisch kommen
        gear = shelfIds().filter(function (id) { return L.parts[id] && !(L.parts[id].kind === "vessel" && !L.parts[id].dispenser); });
        if (st.tab === "add" && !stuff.length || st.tab === "gear" && !gear.length) st.tab = null;
        if (!st.tab) st.tab = stuff.length && !L.parts[v.type].dispenser ? "add" : "info";
        if (stuff.length || gear.length) {
          tabs = '<div class="cl-cardtabs" role="tablist" aria-label="' + esc(label[v.id]) + '">' +
            [["add", stuff.length], ["gear", gear.length], ["info", 1]].filter(function (k) { return k[1]; }).map(function (k) {
              return '<button type="button" role="tab" class="cl-tab" data-act="card" data-id="' + k[0] + '" aria-selected="' + (st.tab === k[0] ? "true" : "false") + '">' + esc(T("card." + k[0])) + "</button>";
            }).join("") + "</div>";
          ui.panel.setAttribute("data-tab", st.tab);
        }
        html = head(v.id) + tabs +
          (stuff.length ? '<div class="cl-sec" data-sec="add">' + (stuff.length > 12 ? '<input class="cl-find" type="search" data-act="find" placeholder="' + esc(T("card.find")) +
            '" aria-label="' + esc(T("card.find")) + '" value="' + esc(st.find || "") + '">' : "") +
            '<div class="cl-uses">' + stuff.map(useButton).join("") + '</div><p class="cl-hint cl-nomatch" hidden>' + esc(T("card.none")) + "</p>" +
            '<div class="cl-giverow"></div></div>' : "") +
          (gear.length ? '<div class="cl-sec" data-sec="gear"><div class="cl-uses">' + gear.map(useButton).join("") + "</div></div>" : "") +
          '<div class="cl-sec" data-sec="info">' +
          (L.parts[v.type].dispenser && !L.parts[v.type].filter ? '<div class="cl-tap" role="group" aria-label="' + esc(T("tap")) + '"><span>' + esc(T("tap")) + ":</span> " +
            L.TAPS.map(function (rate) {
              return '<button type="button" class="cl-btn" data-act="tap" data-id="' + rate + '" aria-pressed="false">' + esc(T("tap." + L.tapKey(rate))) + "</button>";
            }).join(" ") + (show.numbers && show.volumes ? ' <span class="cl-read">' + esc(T("panel.given")) + ' <output class="cl-given"></output></span>' : "") + "</div>" : "") +
          '<div class="cl-contents"></div><div class="cl-lens"></div><div class="cl-actions">' +
          (sampleOf(v.id) && lab.samples[sampleOf(v.id)].names.length ? '<label class="cl-guess">' + esc(T("identify")) + ' <select data-act="guess"><option value="">' + esc(T("identify.pick")) + "</option>" +
            lab.samples[sampleOf(v.id)].names.map(function (n) { return '<option value="' + esc(n) + '"' + (lab.samples[sampleOf(v.id)].said === n ? " selected" : "") + ">" + esc(n) + "</option>"; }).join("") + "</select></label> " : "") +
          '<button type="button" class="cl-btn" data-act="flow" aria-pressed="' + (st.flow ? "true" : "false") + '">' + esc(flowLabel()) + "</button> " +
          (show.particles && !v.veiled ? '<button type="button" class="cl-btn" data-act="lens" aria-pressed="' + (st.lens ? "true" : "false") + '">' + esc(T("lens")) + "</button> " : "") +
          (others.length ? "<label>" + esc(T("panel.pour")) + ' <select class="cl-pour-to">' + others.map(function (o) {
            return '<option value="' + esc(o.id) + '">' + esc(label[o.id]) + "</option>";
          }).join("") + '</select></label> <input class="cl-pour-ml" type="text" inputmode="decimal" size="4" value="5" aria-label="mL"> mL ' +
            '<button type="button" class="cl-btn" data-act="pour">' + esc(T("panel.pourGo")) + "</button> " : "") +
          '<div class="cl-dispose" role="group" aria-label="' + esc(T("panel.dispose").replace(/\s*[:：፦]\s*$/, "")) + '"><span>' + esc(T("panel.dispose")) + "</span> " + L.BINS.map(function (bin) {
            return '<button type="button" class="cl-btn cl-bin" data-act="dispose" data-id="' + bin + '">' + L.binIcon(bin) + "<span>" + esc(T("bin." + bin)) + "</span></button>";
          }).join(" ") + "</div> " + removal() + "</div></div>";
      } else if (t) {
        html = head(t.id) +
          (L.parts[t.type].flames ? '<div class="cl-tap" role="group" aria-label="' + esc(T("flame")) + '"><span>' + esc(T("flame")) + ":</span> " +
            [0, 1, 2].map(function (level) {
              return '<button type="button" class="cl-btn" data-act="flame" data-id="' + level + '" aria-pressed="false">' + esc(T("flame." + level)) + "</button>";
            }).join(" ") + "</div>" : "") +
          (L.parts[t.type].spin ? '<div class="cl-tap" role="group" aria-label="' + esc(T("spin")) + '"><span>' + esc(T("spin")) + ":</span> " +
            [0, 1].map(function (level) {
              return '<button type="button" class="cl-btn" data-act="spin" data-id="' + level + '" aria-pressed="' + (level === t.spin ? "true" : "false") + '">' + esc(T("spin." + level)) + "</button>";
            }).join(" ") + "</div>" : "") +
          // Netzgerät: die Spannung an einem Schieber (übernommen wird sie beim Loslassen), dazu ein Knopf zum Umpolen
          (L.parts[t.type].circuit === "supply" ? '<div class="cl-tap"><label>' + esc(T("volts")) + ' <input class="cl-volts" type="range" role="slider" data-act="volts" min="0" max="' +
            L.parts[t.type].max + '" step="0.1" value="' + t.volts + '"></label> <output class="cl-volts-shown"></output> ' +
            '<button type="button" class="cl-btn" data-act="flip" aria-pressed="false">' + esc(T("flip")) + "</button></div>" : "") +
          // Wasserbad und Fotometer: Temperatur oder Wellenlänge an einem Schieber, übernommen beim Loslassen
          (L.parts[t.type].bath ? dial("temp", L.parts[t.type].range, 1, t.temp) : "") +
          (L.parts[t.type].scale ? '<div class="cl-tap"><button type="button" class="cl-btn" data-act="tare">' + esc(T("tare")) + "</button></div>" : "") +
          (L.parts[t.type].sense === "A" ? dial("wave", L.parts[t.type].waves, 5, t.nm) : "") +
          // Kolbenprober: den Kolben an einem Schieber halten (allein: Luft aufziehen) und wieder loslassen
          (L.parts[t.type].sense === "V" ? dial("hold", [0, L.parts[t.type].cap], 1, Math.round(t.value || 0)).replace("</div>",
            ' <button type="button" class="cl-btn" data-act="release">' + esc(T("release")) + "</button></div>") : "") +
          '<div class="cl-contents"></div><div class="cl-actions">' + removal() + "</div>";
      } else if (st.copyText != null) {
        html = '<p class="cl-hint">' + esc(T(st.copyHint)) + '</p><textarea class="cl-copy" readonly rows="8" aria-label="' + esc(T(st.copyHint)) + '">' + esc(st.copyText) + "</textarea>";
      } else {
        // nichts gewählt: der Hinweis, und die Gefäße aus dem Regal, die man gleich hinstellen kann
        others = st.config.lock ? [] : shelfIds().filter(function (id) { return L.parts[id] && L.parts[id].kind === "vessel" && !L.parts[id].dispenser; });
        html = '<p class="cl-hint">' + esc(T("panel.none")) + "</p>" + (others.length ? '<div class="cl-actions cl-place"><span>' + esc(T("card.place")) + "</span>" + others.map(function (id) {
          return '<button type="button" class="cl-btn cl-use" data-act="hand" data-id="' + esc(id) + '">' + L.icon(id) + "<span>" + esc(nameOfPick(id)) + "</span></button>";
        }).join("") + "</div>" : "");
      }
      ui.panel.innerHTML = html;
      ui.panel.setAttribute("data-card", v || t ? "open" : "");
      lensKey = null;
      renderGive();
      syncCard();
      filterCard();
      renderContents();
      aim();
    }

    // Kopf der Karte: Name, eine Zeile mit dem Wichtigsten (wird laufend nachgeführt) und Schließen
    function head(id) {
      return '<div class="cl-head"><h4>' + esc(names()[id]) + '</h4><span class="cl-sum"></span>' +
        '<button type="button" class="cl-btn cl-round cl-x" data-act="close" title="' + esc(T("card.close")) + '" aria-label="' + esc(T("card.close")) + '">' + CLOSE_ICON + "</button></div>";
    }

    function useButton(id) {
      return '<button type="button" class="cl-use" data-act="use" data-id="' + esc(id) + '" aria-pressed="false" title="' + esc(nameOfPick(id)) + '">' +
        L.icon(id) + "<span>" + esc(nameOfPick(id)) + "</span>" + (L.parts[id] ? "" : L.ghsLabel(id, lang)) + "</button>";
    }

    // Unter den Stoffen: die Menge und der Knopf, der sie in dieses Gefäß gibt
    function renderGive() {
      var row = ui.panel.querySelector && ui.panel.querySelector(".cl-giverow"), h = st.hand;
      if (!row || !L.vessel(st.run.lab, st.sel)) return;
      row.innerHTML = h && !h.tool && !h.test
        ? stepper("cl-amount2") + ' <button type="button" class="cl-btn cl-give" data-act="give"></button> <span class="cl-hint">' + esc(T("card.again")) + "</span>"
        : '<span class="cl-hint">' + esc(T("card.pick")) + "</span>";
      syncGive();
    }

    function syncGive() {
      var row = ui.panel.querySelector && ui.panel.querySelector(".cl-giverow"), h = st.hand, b;
      if (!row || !h || h.tool || h.test) return;
      b = row.querySelector(".cl-give");
      if (b) b.textContent = T("card.give", { amount: portion().text });
      b = row.querySelector(".cl-amount2");
      if (b) b.textContent = portion().text;
    }

    // welcher Stoff der Karte gerade in der Hand liegt
    function syncCard() {
      if (!ui.panel.querySelectorAll) return;
      Array.prototype.forEach.call(ui.panel.querySelectorAll('.cl-use[data-act="use"]'), function (b) {
        b.setAttribute("aria-pressed", st.hand && st.hand.id === b.getAttribute("data-id") ? "true" : "false");
      });
      Array.prototype.forEach.call(ui.panel.querySelectorAll('.cl-cardtabs .cl-tab'), function (b) {
        b.setAttribute("aria-selected", b.getAttribute("data-id") === st.tab ? "true" : "false");
      });
    }

    // Suche unter den Stoffen der Karte: nach Name und Kürzel, Groß- und Kleinschreibung gleich
    function filterCard() {
      var q = String(st.find || "").trim().toLowerCase(), seen = 0, none;
      if (!ui.panel.querySelectorAll) return;
      Array.prototype.forEach.call(ui.panel.querySelectorAll('[data-sec="add"] .cl-use'), function (b) {
        var hit = !q || (b.getAttribute("title") + " " + b.getAttribute("data-id")).toLowerCase().indexOf(q) >= 0;
        b.hidden = !hit;
        if (hit) seen++;
      });
      none = ui.panel.querySelector(".cl-nomatch");
      if (none) none.hidden = seen > 0;
    }

    // Der Pfeil der Karte zeigt auf das gewählte Gerät (in 3D gibt es keinen festen Ort, dann ohne Pfeil)
    function aim() {
      var item = st.sel && at(st.sel), style = ui.panel.style, box, card, scale, h;
      if (!style || !style.setProperty) return;
      box = ui.svg.getBoundingClientRect ? ui.svg.getBoundingClientRect() : null;
      card = ui.panel.getBoundingClientRect ? ui.panel.getBoundingClientRect() : null;
      if (!item || three || !box || !card || !(box.width > 0) || !(planWidth > 0)) { style.removeProperty("--cl-at"); ui.panel.removeAttribute("data-aim"); return; }
      h = bench + FRONT;
      scale = Math.min(box.width / planWidth, box.height / h);
      style.setProperty("--cl-at", Math.round(box.left - card.left + (box.width - planWidth * scale) / 2 + item.x * scale) + "px");
      ui.panel.setAttribute("data-aim", "");
    }

    function removal() { return st.config.lock ? "" : '<button type="button" class="cl-btn" data-act="remove">' + esc(T("panel.remove")) + "</button>"; }

    function dial(act, range, step, value) {
      return '<div class="cl-tap"><label>' + esc(T(act)) + ' <input class="cl-dial" type="range" role="slider" data-act="' + act + '" min="' + range[0] + '" max="' + range[1] +
        '" step="' + step + '" value="' + value + '"></label> <output class="cl-dial-shown"></output></div>';
    }

    // Teilchenlupe im Feld des gewählten Gefäßes: das Bild (in jedem Bild neu) und darunter die Legende (nur wenn sich etwas ändert)
    function lensView() {
      var v = L.vessel(st.run.lab, st.sel), box = v && !v.broken && !v.veiled && st.lens && show.particles ? ui.panel.querySelector(".cl-lens-view") : null;
      if (box) box.innerHTML = L.fx.lens(L.particles(st.run.lab, v.id), pending, 3, still, function (id) { return lensColors[id] || "#9aa7b4"; });
    }

    function renderLens() {
      var lab = st.run.lab, v = L.vessel(lab, st.sel), box = ui.panel.querySelector(".cl-lens"), data, rows, key;
      if (!box) return;
      if (!v || v.broken || v.veiled || !st.lens || !show.particles) { if (lensKey !== "") { box.innerHTML = ""; lensKey = ""; } return; }
      data = L.particles(lab, v.id);
      rows = data.dots.map(function (d) { return { id: d.id, n: d.n, dot: true }; }).concat(data.solids.map(function (s) { return { id: s.id, n: s.n, hang: s.hang > 0.5 }; }));
      key = v.id + "|" + data.per + "|" + data.wet + data.paste + data.residue + "|" + rows.map(function (r) { return r.id + ":" + r.n + (r.hang ? "~" : ""); }).join(",");
      if (key !== lensKey) {                                    // die Legende entsteht nur neu, wenn sich die Zusammensetzung geändert hat
        lensKey = key;
        lensColors = L.dotColors(rows.map(function (r) { return r.id; }));
        box.innerHTML = '<svg class="cl-lens-view" viewBox="-74 -74 148 148" role="img" aria-label="' + esc(T("lens") + ": " + (rows.length ? rows.map(function (r) {
          return (show.numbers ? r.n + " " : "") + L.nameOf(L.species(r.id), lang);
        }).join(", ") : T(data.paste ? "lens.paste" : data.wet ? "lens.none" : data.residue ? "lens.residue" : "lens.dry"))) + '"></svg><ul class="cl-lens-legend">' + rows.map(function (r) {
          return '<li><span class="cl-swatch' + (r.dot ? "" : " cl-square") + '" style="background:' + esc(lensColors[r.id]) + '"></span> ' + L.formulaHtml(r.id, true) + " – " +
            esc(L.nameOf(L.species(r.id), lang)) + (r.dot ? "" : " (" + esc(T(r.hang ? "lens.hang" : "lens.solid")) + ")") + (show.numbers ? ": " + r.n : "") + "</li>";
        }).join("") + '</ul><p class="cl-hint">' + (!data.wet ? esc(T(data.residue ? "lens.residue" : "lens.dry")) : data.paste ? esc(T("lens.paste")) : (rows.some(function (r) { return r.dot; }) ? "" : esc(T("lens.none")) + " ") +
          (show.numbers ? esc(T("lens.scale", { c: L.trim(Math.round(data.per * 10000) / 10, lang) })) + " " : "") + esc(T("lens.water"))) + "</p>";
      }
      lensView();
    }

    // „40 mL · pH 9,80 · hellblau, trüb“: im Kopf der Karte, damit man das Wichtigste auch im Reiter „Zugeben“ sieht
    function summary(w) {
      var box = ui.panel.querySelector(".cl-sum"), parts = [], text;
      if (!box) return;
      if (w.ml > 0.005) {
        if (show.numbers && show.volumes) parts.push(L.num(w.ml, 1, lang) + " mL");
        if (show.numbers && w.pH != null && !veiled(st.sel)) parts.push("pH " + L.num(w.pH, 2, lang));
        parts.push(L.colorWord(w.color.name, w.color.pale, lang) + (w.cloud.alpha > 0.3 ? ", " + T("aria.cloudy") : ""));
      } else parts.push(T(w.sediment.ml > 0.002 ? "aria.sediment" : w.residue > 1e-7 ? "aria.residue" : "aria.empty"));
      text = parts.join(" · ");
      if (box.textContent !== text) box.textContent = text;
    }

    function renderContents() {
      var lab = st.run.lab, v = L.vessel(lab, st.sel), t = L.tool(lab, st.sel), box, w, rows;
      renderLens();
      if (!v && !t) return;
      if (v && v.broken) return;
      box = ui.panel.querySelector(".cl-contents");
      if (!box) return;
      if (t) {
        if (L.parts[t.type].bath || L.parts[t.type].sense === "A") {      // Temperatur oder Wellenlänge an Ort und Stelle nachführen
          w = ui.panel.querySelector(".cl-dial");
          rows = dragging == null ? (L.parts[t.type].bath ? t.temp : t.nm) : dragging;      // beim Ziehen folgt die Anzeige dem Schieber
          if (dragging == null) w.value = String(rows);
          if (L.parts[t.type].bath) {
            w.setAttribute("aria-valuetext", show.numbers ? rows + " °C" : Math.round(rows / L.parts[t.type].range[1] * 100) + " %");
            ui.panel.querySelector(".cl-dial-shown").textContent = show.numbers ? rows + " °C" : "";
            box.innerHTML = "";
          } else {
            w.setAttribute("aria-valuetext", show.numbers ? rows + " nm" : Math.round((rows - L.parts[t.type].waves[0]) / (L.parts[t.type].waves[1] - L.parts[t.type].waves[0]) * 100) + " %");
            ui.panel.querySelector(".cl-dial-shown").textContent = show.numbers ? rows + " nm" : "";
            w = L.reading(lab, t.id);
            // die Farbe des Lichts, die Extinktion und der Anteil des Lichts, der durchkommt
            box.innerHTML = '<p><span class="cl-swatch" style="background:rgb(' + L.waveRgb(rows).join(",") + ')"></span> ' +
              (show.numbers ? esc(T("panel.shows")) + " " + esc(shownValue(w)) +
                (w.value == null ? "" : " · " + esc(T("transmission")) + " " + (w.over ? "< " + L.num(0.1, 1, lang) : L.num(100 * Math.pow(10, -w.value), 1, lang)) + " %") : "") + "</p>";
          }
        } else if (L.parts[t.type].sense === "V") {             // Stellung des Kolbens an Ort und Stelle nachführen
          w = ui.panel.querySelector(".cl-dial");
          rows = dragging == null ? Math.round(t.value || 0) : dragging;
          if (dragging == null) w.value = String(rows);
          w.setAttribute("aria-valuetext", show.numbers ? rows + " mL" : Math.round(rows / L.parts[t.type].cap * 100) + " %");
          ui.panel.querySelector(".cl-dial-shown").textContent = show.numbers ? rows + " mL" : "";
          ui.panel.querySelector('[data-act="release"]').disabled = t.hold == null;
          box.innerHTML = show.numbers ? "<p>" + esc(T("panel.shows")) + " " + esc(shownValue(L.reading(lab, t.id))) + "</p>" : "";
        } else if (L.parts[t.type].spin) {                      // ob sie läuft, an den Knöpfen vermerken
          [0, 1].forEach(function (level) {
            ui.panel.querySelector('[data-act="spin"][data-id="' + level + '"]').setAttribute("aria-pressed", level === t.spin ? "true" : "false");
          });
          box.innerHTML = "";
        } else if (L.parts[t.type].flames) {                    // die gewählte Flamme an den Knöpfen vermerken
          [0, 1, 2].forEach(function (level) {
            ui.panel.querySelector('[data-act="flame"][data-id="' + level + '"]').setAttribute("aria-pressed", level === t.flame ? "true" : "false");
          });
          box.innerHTML = "";
        } else if (L.parts[t.type].circuit === "supply") {      // Spannung und Polung an Ort und Stelle nachführen
          w = ui.panel.querySelector(".cl-volts");
          if (dragging == null) w.value = String(t.volts);
          rows = dragging == null ? t.volts : dragging;         // beim Ziehen folgt die Anzeige dem Schieber
          w.setAttribute("aria-valuetext", show.numbers ? L.num(rows, 1, lang) + " V" : Math.round(rows / L.parts[t.type].max * 100) + " %");
          ui.panel.querySelector(".cl-volts-shown").textContent = show.numbers ? L.num(rows, 1, lang) + " V" : "";
          ui.panel.querySelector('[data-act="flip"]').setAttribute("aria-pressed", t.flip ? "true" : "false");
          box.innerHTML = "";
        } else if (L.parts[t.type].electrode) {                 // woraus die Elektrode besteht, was sie wiegt und was sich auf ihr abgeschieden hat
          w = L.reading(lab, t.id);
          box.innerHTML = "<p>" + esc(T("made")) + " " + L.formulaHtml(w.material, true) + " – " + esc(L.nameOf(L.species(w.material), lang)) + "</p>" +
            (show.numbers ? "<p>" + esc(T("mass")) + " " + L.num(w.g, 3, lang) + " g (" + esc(T("massChange")) + " " + (w.g - w.g0 >= 0 ? "+" : "") + L.num(w.g - w.g0, 3, lang) + " g)</p>" : "") +
            (w.coat.length && !veiled(t.in) ? "<p>" + esc(T("coat")) + ": " + w.coat.map(function (c) {
              return esc(L.nameOf(L.species(c.id), lang)) + (show.numbers ? " " + L.amount(c.n, lang) : "");
            }).join(", ") + "</p>" : "");
        } else if (L.parts[t.type].bridge || L.parts[t.type].duct || L.parts[t.type].reflux) box.innerHTML = "";
        else if (L.parts[t.type].circuit === "load") {         // das Lämpchen zeigt nichts an: es leuchtet oder nicht
          w = shownValue(L.reading(lab, t.id));
          box.innerHTML = "<p>" + esc(w.charAt(0).toUpperCase() + w.slice(1)) + ".</p>";
        } else box.innerHTML = show.numbers ? "<p>" + esc(T("panel.shows")) + " " + esc(shownValue(L.reading(lab, t.id))) + "</p>" : "";
        return;
      }
      w = L.view(lab, v);
      summary(w);
      if (L.parts[v.type].dispenser && !L.parts[v.type].filter) {      // Hahnstellung und Ablesung an Ort und Stelle nachführen (ein Trichter hat keinen Hahn)
        L.TAPS.forEach(function (rate) {
          ui.panel.querySelector('[data-act="tap"][data-id="' + rate + '"]').setAttribute("aria-pressed", L.tapKey(rate) === L.tapKey(w.tap) ? "true" : "false");
        });
        if (show.numbers && show.volumes) ui.panel.querySelector(".cl-given").textContent = L.num(w.given, 1, lang) + " mL";
      }
      if (v.veiled) { box.innerHTML = "<p>" + esc(T("unknown.contents")) + "</p>"; return; }
      rows = w.species.filter(function (s) { return s.n > 1e-12; });
      if (!rows.length) { box.innerHTML = "<p>" + esc(T("panel.empty")) + "</p>"; return; }
      if (!show.numbers) {
        box.innerHTML = '<ul class="cl-list">' + rows.map(function (s) {
          return "<li>" + L.formulaHtml(s.id, true) + " – " + esc(L.nameOf(L.species(s.id), lang)) + "</li>";
        }).join("") + "</ul>";
        return;
      }
      // im realen Modell auch die Ionenstärke, von der die Aktivitätskoeffizienten abhängen
      w.head = [show.volumes ? esc(T("panel.volume")) + " " + L.num(w.ml, 1, lang) + " mL" : "", w.pH == null ? "" : "pH " + L.num(w.pH, 2, lang),
        w.strength == null ? "" : esc(T("panel.strength")) + " " + L.num(w.strength, w.strength < 0.0995 ? 3 : 2, lang) + " mol/L"].filter(Boolean).join(" · ");
      box.innerHTML = (w.head ? "<p>" + w.head + "</p>" : "") +
        '<table class="cl-table"><caption>' + esc(T("panel.contents")) + '</caption><thead><tr><th scope="col" colspan="2">' + esc(T("col.particle")) +
        '</th><th scope="col">' + esc(T("col.amount")) + '</th><th scope="col">' + esc(T("col.conc")) + "</th></tr></thead><tbody>" +
        rows.map(function (s) {
          return "<tr><td>" + L.formulaHtml(s.id, true) + "</td><td>" + esc(L.nameOf(L.species(s.id), lang)) + "</td><td>" + L.amount(s.n, lang) +
            "</td><td>" + (s.c == null ? "–" : L.amount(s.c, lang) + "/L") + "</td></tr>";
        }).join("") + "</tbody></table>";
    }

    // ---------------------------------------------------------------- Gleichungen

    function side(terms) {
      return terms.map(function (t) { return (t.n === 1 ? "" : L.trim(t.n, lang) + " ") + L.formulaHtml(t.id, true); }).join(" + ");
    }

    // Auf welches Gefäß sich Gleichungen und Stoffmengen beziehen: das gewählte; bei einer Bürette das, in das sie tropft
    // (in einem Trichter laufen eigene Reaktionen: dort bleibt es der Trichter)
    function focus() {
      var lab = st.run.lab, v = L.vessel(lab, st.sel);
      return v ? (L.vessel(lab, v.over) && !L.parts[v.type].filter ? v.over : v.id) : null;
    }

    function renderEq() {
      var lab = st.run.lab, label = names(), groups = [], only = focus(), html;
      if (!show.equations && !inText.equations) return;
      lab.vessels.forEach(function (v) {
        var list = only && only !== v.id || v.veiled ? [] : L.reactions(lab, v.id);
        if (list.length) groups.push({ id: v.id, list: list });
      });
      html = "<h4>" + esc(T("eq.title")) + "</h4>";
      if (!groups.length) html += '<p class="cl-hint">' + esc(T("eq.none")) + "</p>";
      groups.forEach(function (group) {
        if (lab.vessels.length > 1) html += '<p class="cl-where">' + esc(label[group.id]) + "</p>";
        html += '<ul class="cl-list">' + group.list.map(function (r) {
          var meta = [];
          if (r.catalysts.length) meta.push(esc(T("eq.catalyst")) + ": " + r.catalysts.map(function (id) { return esc(L.nameOf(L.species(id), lang)); }).join(", "));
          if (show.numbers && r.dH != null) meta.push("ΔH = " + L.num(r.dH, Math.abs(r.dH) < 100 ? 1 : 0, lang) + " kJ/mol");
          if (show.numbers) meta.push(esc(T("eq.extent")) + " " + L.amount(r.extent, lang));
          if (r.rate > 0) meta.push('<span class="cl-running">' + esc(T("eq.running")) + "</span>");
          return "<li>" + (r.at ? '<span class="cl-pole-at">' + esc(T(r.kind === "ox" ? "eq.ox" : "eq.red", { part: label[r.at] || r.at })) + ":</span> " : "") +
            '<span class="cl-formula">' + side(r.left) + (r.complete ? " → " : " ⇌ ") + side(r.right) + "</span>" +
            (meta.length ? ' <span class="cl-meta">' + meta.join(" · ") + "</span>" : "") + "</li>";
        }).join("") + "</ul>";
      });
      ui.eq.innerHTML = html;
    }

    // ---------------------------------------------------------------- Diagramme

    // lines: [{ label (HTML), points: [[x, Wert], …] }]
    // axis: { span: größter x-Wert, label: Beschriftung, cursor: wo der Zeiger steht }, floor: unterer Rand der Werte
    function chart(title, lines, hint, axis, floor) {
      var X0 = 46, X1 = 312, Y0 = 12, Y1 = 128, lo = Infinity, hi = -Infinity, span = axis.span, from = axis.from || 0, out, i, y, value;      // from: wo die Achse beginnt
      lines = lines.filter(function (line) { return line.points.length; });      // eine Kurve ohne Messwert zählt nicht
      if (!lines.length && !hint) return "";
      if (!lines.length) return '<figure class="cl-chart"><figcaption>' + title + '</figcaption><p class="cl-hint">' + esc(hint) + "</p></figure>";
      lines.forEach(function (line) { line.points.forEach(function (p) { lo = Math.min(lo, p[1]); hi = Math.max(hi, p[1]); }); });
      if (floor != null) lo = Math.min(lo, floor);
      if (!(hi - lo > 1e-9)) { hi += 0.5; lo -= floor != null ? 0 : 0.5; }
      hi += (hi - lo) * 0.06;
      if (floor == null) lo -= (hi - lo) * 0.06;
      function px(t) { return (X0 + Math.max(0, Math.min(1, (t - from) / span)) * (X1 - X0)).toFixed(1); }
      function py(v) { return (Y1 - (v - lo) / (hi - lo) * (Y1 - Y0)).toFixed(1); }
      out = '<svg viewBox="0 0 320 150" role="img" aria-label="' + esc(title.replace(/<[^>]+>/g, "")) + '">';
      for (i = 0; i <= 2; i++) {
        value = lo + (hi - lo) * i / 2; y = py(value);
        out += '<line class="cl-grid" x1="' + X0 + '" x2="' + X1 + '" y1="' + y + '" y2="' + y + '"/>';
        if (show.numbers) out += '<text class="cl-tick" x="' + (X0 - 4) + '" y="' + (+y + 3) + '" text-anchor="end">' + L.trim(value, lang) + "</text>";
      }
      out += '<line class="cl-axis" x1="' + X0 + '" x2="' + X0 + '" y1="' + Y0 + '" y2="' + Y1 + '"/><line class="cl-axis" x1="' + X0 + '" x2="' + X1 + '" y1="' + Y1 + '" y2="' + Y1 + '"/>' +
        '<text class="cl-tick" x="' + X0 + '" y="' + (Y1 + 12) + '">' + L.trim(from, lang) + '</text><text class="cl-tick" x="' + X1 + '" y="' + (Y1 + 12) + '" text-anchor="end">' + L.trim(Math.round((from + span) * 10) / 10, lang) + "</text>" +
        '<text class="cl-tick" x="' + (X0 + X1) / 2 + '" y="' + (Y1 + 20) + '" text-anchor="middle">' + esc(axis.label) + "</text>";
      lines.forEach(function (line, k) {
        out += '<polyline class="cl-line cl-s' + k % 6 + '" stroke-dasharray="' + DASH[k % 6] + '" points="' +
          line.points.map(function (p) { return px(p[0]) + "," + py(p[1]); }).join(" ") + '"/>';
      });
      out += '<line class="cl-cursor" x1="' + px(axis.cursor) + '" x2="' + px(axis.cursor) + '" y1="' + Y0 + '" y2="' + Y1 + '"/></svg>';
      return '<figure class="cl-chart"><figcaption>' + title + "</figcaption>" + out + '<ul class="cl-legend">' + lines.map(function (line, k) {
        return '<li><svg viewBox="0 0 26 8" width="26" height="8" aria-hidden="true"><line class="cl-line cl-s' + k % 6 + '" stroke-dasharray="' + DASH[k % 6] +
          '" x1="1" x2="25" y1="4" y2="4"/></svg> <span>' + line.label + "</span></li>";
      }).join("") + "</ul></figure>";
    }

    function renderCharts(kinds, box) {
      var run = st.run, lab = run.lab, label = names(), html = "", lines, vessel = null, ids, top = 0, unit, i, most = 0, at = 0;
      var time = { span: Math.max(run.end, 10), label: T("chart.time"), cursor: run.time };
      function where(t) { return esc(label[t.id] + " " + T(L.parts[t.type].under ? "aria.under" : "aria.in", { vessel: label[t.in] })); }
      function probes(unitName) { return lab.tools.filter(function (t) { return L.parts[t.type].unit === unitName && L.parts[t.type].sense && L.vessel(lab, t.in); }); }
      if (!kinds.length) return;
      if (kinds.indexOf("T") >= 0) {
        lines = probes("°C").map(function (t) { return { label: where(t), points: L.series(run, { tool: t.id }) }; });
        html += chart(esc(T("chart.T")) + (show.numbers ? " in °C" : ""), lines, T("chart.noTool"), time);
      }
      if (kinds.indexOf("n") >= 0) {
        vessel = focus();
        if (vessel && veiled(vessel)) vessel = null;
        for (i = 0; i < lab.vessels.length && !vessel; i++) if (!lab.vessels[i].veiled && L.changed(run, lab.vessels[i].id).length) vessel = lab.vessels[i].id;
        ids = vessel ? L.changed(run, vessel).sort() : [];
        // höchstens sechs Kurven: die Teilchen, deren Menge sich am meisten geändert hat
        lines = ids.map(function (id) {
          var points = L.series(run, { vessel: vessel, species: id }), lo = Infinity, hi = -Infinity;
          points.forEach(function (p) { lo = Math.min(lo, p[1]); hi = Math.max(hi, p[1]); });
          return { id: id, label: L.formulaHtml(id, true), points: points, swing: hi - lo };
        }).sort(function (a, b) { return b.swing - a.swing; }).slice(0, 6).sort(function (a, b) { return a.id < b.id ? -1 : 1; });
        lines.forEach(function (line) { line.points.forEach(function (p) { top = Math.max(top, p[1]); }); });
        unit = top >= 1 ? [1, "mol"] : top >= 1e-3 ? [1e3, "mmol"] : [1e6, "µmol"];
        lines.forEach(function (line) { line.points = line.points.map(function (p) { return [p[0], p[1] * unit[0]]; }); });
        html += chart(esc(T("chart.n")) + (show.numbers ? " in " + unit[1] : "") + (vessel && lab.vessels.length > 1 ? " – " + esc(label[vessel]) : ""),
          lines, T("chart.noChange"), time, 0);
      }
      if (kinds.indexOf("V") >= 0 && probes("mL").length) {         // Gasvolumen: nur mit einem Kolbenprober
        lines = probes("mL").map(function (t) { return { label: esc(label[t.id] + " " + T("aria.at", { vessel: label[t.in] })), points: L.series(run, { tool: t.id }) }; });
        html += chart(esc(T("chart.V")) + (show.numbers ? " in mL" : ""), lines, "", time, 0);
      }
      // pH über der Zeit und über dem zugegebenen Volumen: nur, wenn ein pH-Meter in einem Gefäß steckt
      if (kinds.indexOf("pH") >= 0 && probes("pH").length) {
        lines = probes("pH").map(function (t) { return { label: where(t), points: L.series(run, { tool: t.id }) }; });
        html += chart(esc(T("chart.pH")), lines, "", time);
      }
      if (kinds.indexOf("kappa") >= 0 && probes("mS/cm").length) {
        lines = probes("mS/cm").map(function (t) { return { label: where(t), points: L.series(run, { tool: t.id }) }; });
        html += chart(esc(T("chart.kappa")) + (show.numbers ? " in mS/cm" : ""), lines, "", time, 0);
      }
      // Fotometer: die Extinktion über der Zeit, und das Spektrum der Lösung mit der eingestellten Wellenlänge als Marke
      if (kinds.indexOf("A") >= 0 && probes("E").length) {
        lines = probes("E").map(function (t) { return { label: where(t) + (show.numbers ? " (" + t.nm + " nm)" : ""), points: L.series(run, { tool: t.id }) }; });
        html += chart(esc(T("chart.A")), lines, "", time, 0);
      }
      if (kinds.indexOf("spectrum") >= 0 && probes("E").length) {
        lines = probes("E").map(function (t) { at = t.nm; return { label: where(t), points: L.spectrum(lab, t.in, L.parts[t.type].d) }; });
        html += chart(esc(T("chart.spectrum")), lines, "", { from: 380, span: 350, label: T("chart.wave"), cursor: at }, 0);
      }
      if (kinds.indexOf("titration") >= 0) {
        [["pH", "chart.titration"], ["mS/cm", "chart.conduct"], ["E", "chart.photo"]].forEach(function (kind) {      // mit dem pH-Meter, dem Leitfähigkeitsmessgerät oder dem Fotometer
          lines = []; most = 0;
          lab.vessels.forEach(function (v) {
            if (!L.vessel(lab, v.over) || L.parts[v.type].filter) return;      // eine Titrationskurve nur über eine Bürette
            probes(kind[0]).forEach(function (t) {
              var points;
              if (t.in !== v.over) return;
              points = L.curve(run, { burette: v.id, tool: t.id });
              points.forEach(function (p) { most = Math.max(most, p[0]); });
              at = v.given;
              lines.push({ label: esc(label[t.id] + " · " + label[v.id]), points: points });
            });
          });
          if (lines.length) html += chart(esc(T(kind[1])), lines, "", { span: Math.max(most, 10), label: T("chart.volume"), cursor: at }, kind[0] === "pH" ? undefined : 0);
        });
      }
      // Stromkreise: Stromstärke und Spannung über der Zeit, die Kennlinie (Stromstärke über der Spannung des Netzgeräts), die Masse der Elektroden
      function wired(kind) { return lab.tools.filter(function (t) { return L.parts[t.type].circuit === kind && L.vessel(lab, t.in); }); }
      function beside(t) { return esc(label[t.id] + " " + T("aria.at", { vessel: label[t.in] })); }
      if (kinds.indexOf("I") >= 0 && wired("ammeter").length) {
        top = 0;
        lines = wired("ammeter").map(function (t) {
          var points = L.series(run, { tool: t.id });
          points.forEach(function (p) { top = Math.max(top, p[1]); });
          return { label: beside(t), points: points };
        });
        unit = top >= 1 ? [1, "A"] : [1e3, "mA"];
        lines.forEach(function (line) { line.points = line.points.map(function (p) { return [p[0], p[1] * unit[0]]; }); });
        html += chart(esc(T("chart.I")) + (show.numbers ? " in " + unit[1] : ""), lines, "", time, 0);
      }
      if (kinds.indexOf("U") >= 0 && wired("voltmeter").length) {
        lines = wired("voltmeter").map(function (t) { return { label: beside(t), points: L.series(run, { tool: t.id }) }; });
        html += chart(esc(T("chart.U")) + (show.numbers ? " in V" : ""), lines, "", time, 0);
      }
      if (kinds.indexOf("IU") >= 0) {
        lines = []; most = 0; at = 0; top = 0;
        wired("supply").forEach(function (s) {
          wired("ammeter").forEach(function (t) {
            var cell = L.circuit(lab, s.in), points;
            if (!cell || cell !== L.circuit(lab, t.in)) return;          // beide am selben Stromkreis
            points = L.curve(run, { x: s.id, tool: t.id });
            points.forEach(function (p) { most = Math.max(most, p[0]); top = Math.max(top, p[1]); });
            at = s.volts;
            lines.push({ label: esc(label[t.id] + " · " + label[s.id]), points: points });
          });
        });
        unit = top >= 1 ? [1, "A"] : [1e3, "mA"];
        lines.forEach(function (line) { line.points = line.points.map(function (p) { return [p[0], p[1] * unit[0]]; }); });
        if (lines.length && most > 0) html += chart(esc(T("chart.IU")) + (show.numbers ? " (" + unit[1] + ")" : ""), lines, "", { span: Math.max(most, 1), label: T("chart.volts"), cursor: at }, 0);
      }
      if (kinds.indexOf("m") >= 0) {
        top = 0;
        lines = lab.tools.filter(function (t) { return (L.parts[t.type].electrode || L.parts[t.type].scale) && L.vessel(lab, t.in); }).map(function (t) {
          var points = L.series(run, { tool: t.id }), first = points.length ? points[0][1] : 0;
          points = points.map(function (p) { top = Math.max(top, Math.abs(p[1] - first)); return [p[0], p[1] - first]; });
          return { label: where(t), points: points };
        });
        unit = top >= 1 ? [1, "g"] : [1e3, "mg"];
        lines.forEach(function (line) { line.points = line.points.map(function (p) { return [p[0], p[1] * unit[0]]; }); });
        if (top > 1e-6) html += chart(esc(T(lab.tools.some(function (t) { return L.parts[t.type].scale && L.vessel(lab, t.in); }) ? "chart.mass" : "chart.m")) + (show.numbers ? ": " + esc(T("chart.mUnit")) + " in " + unit[1] : ""), lines, "", time);
      }
      box.innerHTML = html;
    }

    // ---------------------------------------------------------------- Messwerttabelle

    // Was die Messgeräte gerade anzeigen, als Zahl ohne Einheit; die Einheit steht im Kopf der Spalte.
    // Dazu, was jede Bürette abgegeben hat, und die eingestellte Spannung eines Netzgeräts.
    var COLUMN = { "°C": ["°C", 1, 1], pH: ["pH", 2, 1], "mS/cm": ["mS/cm", 0, 1], E: ["E", 3, 1], mL: ["mL", 1, 1], A: ["mA", 1, 1000], V: ["V", 2, 1], g: ["g", 3, 1], bar: ["bar", 2, 1] };
    function readings() {
      var lab = st.run.lab, label = names(), out = [];
      lab.tools.forEach(function (t) {
        var def = L.parts[t.type], unit = def.circuit === "supply" ? "V" : def.sense || def.circuit === "ammeter" || def.circuit === "voltmeter" || def.electrode ? def.unit : null, c, value;
        if (!unit || !COLUMN[unit]) return;
        c = def.scale ? ["g", 2, 1] : COLUMN[unit];             // die Waage zeigt zwei Stellen; drei hat nur die Masse einer Elektrode
        value = def.circuit === "supply" ? t.volts : t.value;
        out.push({ key: t.id, unit: unit === "E" || unit === "pH" ? "" : c[0], label: label[t.id] + " (" + (unit === "E" ? T("unit.E") : c[0]) + ")",
          text: value == null ? "–" : c[1] ? L.num(value * c[2], c[1], lang) : L.trim(value * c[2], lang) });
        if (def.sense === "V") out.push({ key: t.id + ":p", unit: "bar", label: label[t.id] + " (bar)", text: L.num(L.reading(lab, t.id).p, 2, lang) });      // sein Manometer
      });
      lab.vessels.forEach(function (v) {
        if (L.parts[v.type].dispenser && !L.parts[v.type].filter && show.volumes) out.push({ key: v.id, unit: "mL", label: label[v.id] + ": " + T("table.given") + " (mL)", text: L.num(v.given, 1, lang) });
      });
      return out;
    }

    // Text in die Zwischenablage; dazu steht er im Feld unter der Fläche, falls der Browser das Kopieren nicht erlaubt
    function copyOut(text, hint) {
      var nav = global.navigator, area;
      st.sel = null;
      st.copyText = text;
      st.copyHint = hint;
      renderPanel();
      paint();
      area = ui.panel.querySelector(".cl-copy");
      if (area && area.select) { area.focus(); area.select(); }
      status("");
      if (nav && nav.clipboard && nav.clipboard.writeText) nav.clipboard.writeText(text).then(function () { status(T("copy.done")); }, function () { /* dann von Hand */ });
    }

    // das ganze Protokoll bis zur Zeit des Zeigers, eine Zeile je Eintrag, wie es unter der Fläche steht
    function logText() {
      var ctx = { lang: lang, numbers: show.numbers, names: names(), hidden: hidden() };
      return L.logAt(st.run).map(function (event) { return L.clock(event.t) + " " + L.say(event, ctx); }).join("\n");
    }

    function setupText() {
      var raw = {};
      try { raw = JSON.parse(st.source.replace(/^[\s`]+|[\s`]+$/g, "") || "{}"); } catch (error) { /* der Aufbau ließ sich lesen; ohne Zusatzangaben weiter */ }
      return L.describe(st.run, raw);
    }

    function tableText() {
      return [[T("table.no"), "t (s)"].concat(st.cols.map(function (c) { return c.label; }))].concat(st.rows.map(function (row, n) {
        return [String(n + 1), row.t].concat(st.cols.map(function (c) { return row[c.key] || "–"; }));
      })).map(function (cells) { return cells.join("\t"); }).join("\n");
    }

    function noteRow() {
      var cells = readings(), row = { t: L.num(st.run.time, 1, lang) };
      if (!cells.length) { status(T("table.noMeter")); return; }
      cells.forEach(function (c) {
        if (!st.cols.some(function (col) { return col.key === c.key; })) st.cols.push({ key: c.key, label: c.label });
        row[c.key] = c.text;
      });
      st.rows.push(row);
      status("");
      renderReadings();
    }

    function renderReadings() {
      var html;
      ui.readings.hidden = !((st.config.table || inText.table) && show.numbers);
      if (ui.readings.hidden) return;
      html = '<div class="cl-actions"><button type="button" class="cl-btn" data-act="note">' + esc(T("table.note")) + "</button> " +
        '<button type="button" class="cl-btn" data-act="clear"' + (st.rows.length ? "" : " disabled") + ">" + esc(T("table.clear")) + "</button> " +
        '<button type="button" class="cl-btn" data-act="copyTable"' + (st.rows.length ? "" : " disabled") + ">" + esc(T("table.copy")) + "</button></div>";
      if (st.rows.length) html += '<table class="cl-table"><caption>' + esc(T("table.title")) + '</caption><thead><tr><th scope="col">' + esc(T("table.no")) +
        '</th><th scope="col">t (s)</th>' + st.cols.map(function (c) { return '<th scope="col">' + esc(c.label) + "</th>"; }).join("") + "</tr></thead><tbody>" +
        st.rows.map(function (row, n) {
          return "<tr><td>" + (n + 1) + "</td><td>" + row.t + "</td>" + st.cols.map(function (c) { return "<td>" + esc(row[c.key] || "–") + "</td>"; }).join("") + "</tr>";
        }).join("") + "</tbody></table>";
      ui.readings.innerHTML = html;
    }

    // ---------------------------------------------------------------- Aufgabe

    // Die Aufgabe über der Fläche: ihr Text, je Ziel ein Häkchen (für den Zustand am Zeiger) und „Geschafft!“, sobald einmal alle erfüllt waren
    function renderTask() {
      var task = st.config.task, check, label, html, done;
      ui.task.hidden = !task;
      if (!task) return;
      check = L.checkTask(task, st.run.lab, L.logAt(st.run));
      if (check.done) st.solved = true;
      label = names();
      html = task.goals.map(function (goal, k) {
        var met = check.goals[k];
        return '<li class="cl-goal' + (met ? " cl-met" : "") + '"><span class="cl-check" aria-hidden="true">' + (met ? "✓" : "○") + "</span> " +
          (goal.label ? '<span translate="yes">' + esc(goal.label) + "</span>" : esc(L.goalText(goal, lang, label))) + '<span class="cl-sr"> – ' + esc(T(met ? "goal.met" : "goal.open")) + "</span></li>";
      }).join("");
      if (ui.goals.innerHTML !== html) ui.goals.innerHTML = html;
      done = st.solved ? T("task.done") : "";
      if (ui.done.textContent !== done) ui.done.textContent = done;
    }

    // ---------------------------------------------------------------- Protokoll

    function logItems(events, ctx) {
      return events.map(function (event) {
        return "<li><time>" + L.clock(event.t) + "</time> " + esc(L.say(event, ctx)) + "</li>";
      }).join("");
    }

    // Die Liste bleibt stehen und wächst nur um neue Zeilen: so sagt ein Vorleseprogramm genau das Neue an.
    // Neu aufgebaut wird sie erst, wenn Zeilen wegfallen (zurückgespult, zurückgesetzt).
    function renderLog() {
      var ctx = { lang: lang, numbers: show.numbers, names: names(), hidden: hidden() }, seen, grown, i;
      if (!show.log && !inText.log) return;
      seen = L.logAt(st.run).slice(-60);
      grown = seen.length >= shown.length;
      for (i = 0; grown && i < shown.length; i++) grown = shown[i] === seen[i];
      if (!grown) ui.events.innerHTML = logItems(seen, ctx);
      else if (seen.length > shown.length) {
        if (ui.events.insertAdjacentHTML) ui.events.insertAdjacentHTML("beforeend", logItems(seen.slice(shown.length), ctx));
        else ui.events.innerHTML += logItems(seen.slice(shown.length), ctx);
        if (ui.events.scrollHeight) ui.events.scrollTop = ui.events.scrollHeight;
      }
      shown = seen;
      ui.none.hidden = seen.length > 0;
      if (ui.copyLog) ui.copyLog.disabled = !seen.length;
      if (ui.count) ui.count.textContent = seen.length ? String(st.run.frames[st.run.cursor].n) : "";
    }

    // ---------------------------------------------------------------- Schleife

    // Klang: Dauergeräusche aus dem Zustand, solange die Uhr vorwärts läuft; einzelne Klänge für das, was neu im Protokoll steht
    function hear() {
      var run = st.run, n = run.frames[run.cursor].n;
      if (!sound) return;
      sound.set(st.play > 0 ? L.fx.levels(run.lab) : {});
      if (n > heard && st.play > 0) run.log.slice(heard, n).forEach(function (event) {
        if (event.key === "pop" || (event.key === "splint" && (event.result === "pop" || event.result === "burn"))) sound.shot("pop", event.level);
        else if (event.key === "splint") sound.shot(event.result === "out" ? "hiss" : event.result === "relight" || event.result === "flare" ? "whoosh" : "", 0);
        else if (event.key === "ignite") sound.shot("whoosh", 0);
        else if (event.key === "broken") sound.shot("crash", 0);
        else if (event.key === "popped" || event.key === "plungerOut") sound.shot("pop", 1);
        else if (event.key === "spatter") sound.shot("hiss", 0);
      });
      heard = n;
    }

    function slow() {               // alles, was nicht in jedem Bild neu entstehen muss
      var lab = st.run.lab;
      if ((lab.failed || 0) > (lab.told || 0)) {                // der Rechenkern kam an einer Stelle nicht zum Ergebnis: das sagen
        lab.told = lab.failed;
        status(T("failed"));
      }
      syncTime();
      renderPins();
      renderContents();
      renderEq();
      renderCharts(ownCharts, ui.charts);
      chartSlots.forEach(function (c) { renderCharts([c.kind], c.box); });
      renderLog();
      renderTask();
      hear();
      renderText();
    }

    // Messwerte im Satz und der Zustand für die Skripte der Folie (@input), nur wenn er sich geändert hat
    function renderText() {
      var now, list = valueSlots.length ? readings() : [];
      valueSlots.forEach(function (s) {
        var r = list.filter(function (x) { return x.key === s.getAttribute("data-value"); })[0];
        s.textContent = !r || !show.numbers ? "–" : r.text + (r.unit ? " " + r.unit : "");
      });
      saveSoon();
      if (!link.publish) return;
      now = JSON.stringify(L.snapshot(st.run));
      if (now !== published) { published = now; link.publish(now); }
    }

    // Befehle aus dem Text (send.dispatch): wirken wie die Bedienung, mit Protokoll und Aufzeichnung
    function known(id) {
      try { return !!(L.parts[id] || L.reagent(id)); } catch (error) { status(T("err.reagent") + ": " + id); return false; }
    }
    function command(cmd) {
      var lab = st.run.lab, v, t, amount, ml;
      if (!cmd || typeof cmd !== "object") return;
      if (cmd.take) {
        if (known(cmd.take) && !(st.hand && st.hand.id === cmd.take)) pick(cmd.take);
      } else if (cmd.add) {
        v = L.vessel(lab, cmd.to);
        if (!v || !known(cmd.add)) return;
        if (v.broken) { status(T("brokenGlass")); return; }
        if (spun(cmd.to)) return;
        amount = cmd.ml != null ? { ml: +cmd.ml } : cmd.drops != null ? { drops: +cmd.drops } : { g: +cmd.g };
        ml = amount.ml != null ? amount.ml : amount.drops != null ? amount.drops * L.DROP : 0;
        if (ml > L.free(lab, v) + 1e-9) { status(T("full")); return; }
        change(function (l) { return L.add(l, cmd.to, cmd.add, amount); }, Object.assign({ key: "added", vessel: cmd.to, reagent: cmd.add }, amount));
      } else if (cmd.set) {
        t = L.tool(lab, cmd.set);
        if (!t) return;
        // nur was das Gerät kennt und was sich ändert: ein Regler, der beim Laden seinen Startwert schickt, hinterlässt nichts
        [["volts", "volts"], ["temp", "temp"], ["nm", "wave"], ["hold", "hold"]].forEach(function (k) {
          if (cmd[k[0]] != null && t[k[0]] !== undefined && +cmd[k[0]] !== t[k[0]]) setDial(cmd.set, k[1], +cmd[k[0]]);
        });
        if (cmd.flame != null && t.flame !== undefined && +cmd.flame !== t.flame) {
          change(function (l) { return L.setFlame(l, cmd.set, +cmd.flame); }, { key: "flame", part: cmd.set, level: +cmd.flame });
        }
        if (cmd.spin != null && t.spin !== undefined) spin(cmd.set, +cmd.spin === 1 || cmd.spin === true ? 1 : 0);
      }
    }

    function refresh() {
      paint();
      slow();
    }

    function move(dt) {
      var run = st.run, step = dt * st.speed, n, forced;
      if (st.play > 0) {
        if (L.inPast(run)) {                             // in der Aufzeichnung: abspielen
          L.advance(run, Math.min(step, Math.max(0, run.end - run.time)));
          pending = 0;
        } else {                                         // am Ende: weiterrechnen, in ganzen Rechenschritten
          forced = st.force != null && run.time < st.force - 1e-9;      // die Uhr soll trotz Ruhe laufen
          if (forced || !L.atRest(run.lab)) {            // in Ruhe wird nichts angehängt, auch nicht beim Abspielen bis zum Ende
            pending += step;
            n = Math.floor(pending * 20 + 1e-9);
            if (n > BUDGET) { n = BUDGET; pending = n / 20; }
            if (forced) n = Math.min(n, Math.round((st.force - run.time) * 20));
            if (n > 0) { L.advance(run, n / 20); pending -= n / 20; }
          }
          if (L.atRest(run.lab) && !(st.force != null && run.time < st.force - 1e-9)) {
            st.play = 0; pending = 0; st.force = null;
            if (run.time > playFrom + 1e-9) status(T("rest"));
          }
        }
      } else if (st.play < 0) {
        L.seek(run, run.time - step);
        if (run.cursor === 0) st.play = 0;
      }
    }

    function frame(now) {
      raf = 0;
      if (stopped || !el.isConnected) { if (!stopped) stop(); return; }       // die Folie ist weg: Schleife und Ton enden
      var dt = last ? Math.min(0.1, (now - last) / 1000) : 0;
      last = now;
      move(dt);
      paint();
      if (!st.play || now - slowAt >= 200) { slowAt = now; slow(); } else hear();
      if (st.play) raf = global.requestAnimationFrame(frame);
    }

    function kick() {
      if (raf || stopped || !st.play) return;
      last = 0;
      raf = global.requestAnimationFrame(frame);
    }

    // ---------------------------------------------------------------- 2D oder 3D

    // Nur die Fläche wechselt; Zeit, Hand, Auswahl und alles darunter bleiben. Bis die 3D-Bühne geladen ist, bleibt 2D zu sehen.
    var asked = 0;                  // zählt die Wünsche: eine Bühne, die zu spät fertig wird, kommt nicht mehr zum Zug
    function setView(view) {
      var mine = ++asked;
      st.view = view;
      if (ui.view) ui.view.setAttribute("aria-pressed", view === "3d" ? "true" : "false");
      if (view === "2d" || !L.stage3d) { show3d(null); return; }
      if (three) return;
      status(T("view.loading"));
      L.stage3d(ui.three, { scene: st.config.scene, lang: lang, still: still, tap: tap, escape: function () { setHand(null); select(null); } })
        .then(function (stage) {
          if (stopped || mine !== asked) { stage.stop(); return; }
          status("");
          show3d(stage);
        }, function (error) {
          if (stopped || mine !== asked) return;
          st.view = "2d";
          if (ui.view) ui.view.setAttribute("aria-pressed", "false");
          status(T(error && error.code === "scene" ? "view.scene" : "view.failed") + (error && error.message ? ": " + error.message : ""));
        });
    }

    function show3d(stage) {
      if (three && three !== stage) three.stop();
      three = stage;
      ui.three.hidden = !stage;
      ui.stage.setAttribute("data-view", stage ? "3d" : "2d");
      shape = null;                 // neu einteilen: die Bühne baut ihre Geräte auf
      paint();
    }

    // ---------------------------------------------------------------- Ereignisse

    function onClick(ev) {
      var b = ev.target && ev.target.closest && ev.target.closest("[data-act]"), act, id, r, lab = st.run.lab;
      // ein Tipp irgendwo sonst in der Fläche schließt das Menü
      if (ui.more && ui.more.open && ev.target && ev.target.closest && !ev.target.closest(".cl-more")) ui.more.removeAttribute("open");
      if (!b) return;
      act = b.getAttribute("data-act"); id = b.getAttribute("data-id");
      if (sound) sound.wake();                                  // Ton gibt der Browser erst nach einer Bedienung frei
      if (ui.more && ui.more.removeAttribute && b.closest(".cl-menu")) ui.more.removeAttribute("open");      // das Menü schließt nach der Wahl
      if (act === "hand") pick(id);
      else if (act === "use") use(id);
      else if (act === "give") { if (st.hand && !st.hand.tool && !st.hand.test && L.vessel(lab, st.sel)) give(st.sel); }
      else if (act === "drop") { setHand(null); status(""); }
      else if (act === "close") select(null);
      else if (act === "bar") { st.bar = !st.bar; syncBar(); }
      else if (act === "group") { st.group = parseInt(id, 10) || 0; syncShelf(); }
      else if (act === "card") {                               // Reiter der Karte: nur umschalten, die Karte bleibt stehen
        st.tab = id;
        ui.panel.setAttribute("data-tab", id);
        syncCard();
      }
      else if (act === "out") setOut(id);
      else if (act === "jumpto") jump(Math.max(parseFloat(id) || 0, 1e-6));      // gleich nach dem Ereignis; t = 0 allein wäre der Aufbau davor
      else if (act === "bench") { if (st.hand && st.hand.tool) alone(); }
      else if (act === "flow") {                               // Strömung: aus, Temperatur, Wirbel, Druck, wieder aus
        st.flow = ((st.flow || 0) + 1) % FLOWS.length;
        b = ui.panel.querySelector('[data-act="flow"]');         // der Knopf bleibt stehen und behält den Fokus
        b.setAttribute("aria-pressed", st.flow ? "true" : "false");
        b.textContent = flowLabel();
        paint();
      }
      else if (act === "lens") {                               // Teilchenlupe auf und zu
        st.lens = !st.lens;
        ui.panel.querySelector('[data-act="lens"]').setAttribute("aria-pressed", st.lens ? "true" : "false");      // der Knopf bleibt stehen und behält den Fokus
        renderLens();
      }
      else if (act === "view") setView(st.view === "3d" ? "2d" : "3d");
      else if (act === "sound") {
        st.mute = !st.mute;
        sound.mute(st.mute);
        ui.sound.setAttribute("aria-pressed", st.mute ? "false" : "true");
        hear();
      } else if (act === "flame" && L.tool(lab, st.sel)) {
        r = parseInt(id, 10);
        id = st.sel;
        change(function (l) { return L.setFlame(l, id, r); }, { key: "flame", part: id, level: r });
      }
      else if (act === "spin" && L.tool(lab, st.sel)) spin(st.sel, id === "1" ? 1 : 0);
      else if (act === "tare" && L.tool(lab, st.sel)) {
        id = st.sel;
        change(function (l) { return L.tare(l, id); }, { key: "tare", part: id });
      }
      else if (act === "release" && L.tool(lab, st.sel) && L.tool(lab, st.sel).hold != null) {
        id = st.sel;
        change(function (l) { return L.setHold(l, id, null); }, { key: "release", part: id });
      }
      else if (act === "flip" && L.tool(lab, st.sel)) {
        id = st.sel;
        r = !L.tool(lab, id).flip;
        change(function (l) { return L.setPole(l, id, r); }, { key: "flip", part: id });
      }
      else if (act === "less" || act === "more") {
        if (!st.hand || st.hand.tool || st.hand.test) return;
        r = STEPS[unitOf(L.reagent(st.hand.id))];
        st.hand.i = Math.max(0, Math.min(r.length - 1, st.hand.i + (act === "more" ? 1 : -1)));
        syncAmount();
        syncGive();
      } else if (act === "play") setPlay(st.play > 0 ? 0 : 1);
      else if (act === "back") setPlay(st.play < 0 ? 0 : -1);
      else if (act === "start") jump(0);
      else if (act === "end") jump(st.run.end);
      else if (act === "reset") reset();
      else if (act === "other") view(id);
      else if (act === "mine") mine();
      else if (act === "note") noteRow();
      else if (act === "copy") copyOut(setupText(), "copy.manual");
      else if (act === "copyTable" && st.rows.length) copyOut(tableText(), "table.manual");
      else if (act === "copyLog" && L.logAt(st.run).length) copyOut(logText(), "log.manual");
      else if (act === "clear") { st.rows = []; st.cols = []; renderReadings(); }
      else if (act === "tap" && L.vessel(lab, st.sel)) {
        r = parseFloat(id);
        id = st.sel;
        change(function (l) { return L.setTap(l, id, r); }, { key: "tap", vessel: id, rate: r });
      }
      else if (act === "pour") pourOut();
      else if (act === "dispose" && L.vessel(lab, st.sel) && L.BINS.indexOf(id) >= 0) {
        r = st.sel;
        if (spun(r)) return;
        if (!(L.waste(lab, r) || {}).bin) { status(T("panel.empty")); return; }      // ein leeres Glas: nichts zu entsorgen
        change(function (l) { return L.dispose(l, r, id); }, function (out) { return Object.assign({ key: "disposed" }, out); });
      } else if (act === "remove" && st.sel && !st.config.lock) {
        id = st.sel;
        if (spun(id) || (L.tool(lab, id) || {}).spin || ((L.tool(lab, id) || {}).in && spun(L.tool(lab, id).in))) { status(T("spinning")); return; }      // die laufende Zentrifuge, ihr Glas und sein Stopfen bleiben
        st.sel = null;
        change(function (l) { return L.remove(l, id); }, { key: "removed", part: id, label: names()[id] });
      }
    }

    function onInput(ev) {
      var t = ev.target, act = t && t.getAttribute && t.getAttribute("data-act");
      if (act === "seek") jump(parseFloat(t.value) || 0);
      else if (act === "find") { st.find = t.value; filterCard(); }
      else if (act === "speed") { st.speed = parseFloat(t.value) || 1; pending = 0; }
      else if (act === "guess" && ev.type === "change" && sampleOf(st.sel) && t.value) {      // eine Antwort, kein Eingriff: die Uhr und die Aufzeichnung bleiben
        L.guess(st.run.lab, sampleOf(st.sel), t.value);
        refresh();
      }
      else if ((act === "volts" || act === "temp" || act === "wave" || act === "hold") && L.tool(st.run.lab, st.sel)) {
        // beim Ziehen folgt nur die Anzeige; erst beim Loslassen wird eingestellt (ein Eingriff, eine Zeile im Protokoll)
        dragging = ev.type !== "change" ? parseFloat(String(t.value).replace(",", ".")) || 0 : null;
        if (dragging != null) { renderContents(); return; }
        setDial(st.sel, act, parseFloat(String(t.value).replace(",", ".")) || 0);
      }
    }

    // Der Schieber wurde losgelassen oder verlassen, ohne dass sich sein Wert geändert hat: die Anzeige gilt wieder der eingestellten Spannung
    function onLeave(ev) {
      if (dragging == null || !ev.target || !ev.target.getAttribute || ["volts", "temp", "wave", "hold"].indexOf(ev.target.getAttribute("data-act")) < 0) return;
      dragging = null;
      renderContents();
    }

    function onTouch(ev) {          // Wischen auf der Fläche soll nicht die Folie wechseln
      // auch nicht das Schieben der Regalleiste, der Stoffe in der Karte und der Zeitleiste
      if (ev.target && ev.target.closest && [".cl-stage", ".cl-bar", ".cl-uses", ".cl-track"].some(function (sel) { return ev.target.closest(sel); })) ev.stopPropagation();
    }

    // Ändert sich der Platz auf der Seite, wird die Fläche neu eingeteilt
    var size = "";
    function onResize() {
      if (stopped || !el.isConnected) { stop(); return; }           // die Folie ist weg: nichts mehr festhalten
      var box = ui.svg.getBoundingClientRect ? ui.svg.getBoundingClientRect() : null;
      var now = box ? Math.round(box.width) + "x" + Math.round(box.height) : "";
      if (now === size) return;
      size = now;
      shape = null;
      paint();
    }
    var watcher = global.ResizeObserver ? new global.ResizeObserver(onResize) : null;
    if (watcher) watcher.observe(ui.svg);

    var TOUCH = ["touchstart", "touchmove", "touchend", "touchcancel"];
    if (global.addEventListener) global.addEventListener("resize", onResize);
    el.addEventListener("click", onClick);
    el.addEventListener("input", onInput);
    el.addEventListener("change", onInput);
    el.addEventListener("focusout", onLeave);
    TOUCH.forEach(function (type) { el.addEventListener(type, onTouch, { passive: true }); });

    function itemOf(ev) {
      var g = ev.target && ev.target.closest && ev.target.closest(".cl-item");
      return g ? g.getAttribute("data-id") : null;
    }
    // Antippen über Zeiger-Ereignisse: der Inhalt eines Geräts wird in jedem Bild neu gezeichnet,
    // ein "click" fände deshalb oft kein gemeinsames Ziel von Drücken und Loslassen.
    ui.svg.addEventListener("pointerdown", function (ev) {
      if (sound) sound.wake();
      down = ev.button ? null : { id: itemOf(ev), x: ev.clientX, y: ev.clientY };      // nur die linke Taste, der Finger oder der Stift
    });
    ui.svg.addEventListener("pointerup", function (ev) {
      var d = down;
      down = null;
      if (d && Math.abs(ev.clientX - d.x) + Math.abs(ev.clientY - d.y) < 10) tap(d.id);
    });
    ui.svg.addEventListener("pointercancel", function () { down = null; });
    ui.svg.addEventListener("keydown", function (ev) {
      var id = itemOf(ev);
      if (ev.key === "Escape") { setHand(null); select(null); return; }
      if (!id || (ev.key !== "Enter" && ev.key !== " ")) return;
      ev.preventDefault();
      tap(id);
    });

    function stop() {
      stopped = true;
      save();                                                    // was in den letzten zwei Sekunden geschah
      if (unlisten) unlisten();
      if (global.removeEventListener) global.removeEventListener("pagehide", save);
      if (three) three.stop();
      if (raf && global.cancelAnimationFrame) global.cancelAnimationFrame(raf);
      if (global.removeEventListener) global.removeEventListener("resize", onResize);
      if (watcher) watcher.disconnect();
      if (sound) sound.close();
      el.removeEventListener("click", onClick);
      el.removeEventListener("input", onInput);
      el.removeEventListener("change", onInput);
      el.removeEventListener("focusout", onLeave);
      TOUCH.forEach(function (type) { el.removeEventListener(type, onTouch); });
      slots.forEach(function (s) { s.removeEventListener("click", onClick); });
    }
    el._cl = { stop: stop, command: command, stage: function () { return three; } };       // stage: die 3D-Bühne, für Prüfungen im Browser

    renderShelf();
    renderHand();
    renderTime();
    renderReadings();
    savedKey = keyOf();             // der Stand beim Aufbau ist schon gespeichert (oder leer): nicht gleich überschreiben
    renderOthers();
    refresh();
    if (st.view === "3d") setView("3d");
    kick();
    if (layer) {
      if (global.addEventListener) global.addEventListener("pagehide", save);
      unlisten = layer.on(function (layers) {
        var own = layers.filter(function (l) { return l.me; })[0], v = own && own.values[0];
        var b = v && v.src === text && !st.own && fresh(st.run) && loaded(v);
        if (b) { useRun(b); savedKey = keyOf(); }
        st.others = layers.filter(function (l) { return !l.me && l.values[0] && l.values[0].src === text; });
        renderOthers();
      });
    }
  }

  // Die Adressen der Pakete einer Beschreibung; was sich nicht lesen lässt, meldet später normalize
  function packsOf(text) {
    try {
      var d = JSON.parse(text.replace(/^[\s`]+|[\s`]+$/g, "") || "{}");
      return d && Array.isArray(d.packs) ? d.packs.filter(function (url) { return typeof url === "string" && /^https?:\/\//.test(url); }) : [];
    } catch (error) { return []; }
  }

  function langOf() { return L.langOf(global.document); }

  // Sprachdatei lang/<code>.json laden, je Sprache einmal. Kommt sie nicht, bleibt es bei Englisch (text() fällt darauf zurück).
  var langs = {};
  function loadLang(code) {
    langs[code] = langs[code] || (L.fetchFile ? L.fetchFile("lang/" + code + ".json").then(JSON.parse) : Promise.reject(new Error("chemlab-3d.js")))
      .catch(function (error) { if (global.console) global.console.warn("ChemLab: lang/" + code + ".json", error); return {}; });
    return langs[code].then(function (t) { L.strings[code] = t.strings || {}; L.names[code] = t.names || {}; });
  }

  // Wechselt die Seite die Sprache (Google Translate an oder aus), bauen sich alle Flächen in der neuen Sprache auf.
  // Ihr Zustand bleibt: er liegt in L.store, wie beim Folienwechsel.
  if (global.document && global.MutationObserver) new global.MutationObserver(function () {
    Array.prototype.forEach.call(global.document.querySelectorAll(".lia-chemlab"), function (el) {
      var st = el._cl && L.store[el.id];
      if (st) mount(el, st.source);
    });
  }).observe(global.document.documentElement, { attributes: true, attributeFilter: ["lang"] });

  function packError(entry, lang) {
    var e = entry.error, why = e.code === "http" ? e.detail : e.code === "data" ? L.text("err.data", lang) + ": " + L.explain(e.detail, lang) : L.text("pack." + e.code, lang);
    return '<p class="cl-error" role="alert">' + L.escape(L.text("err.pack", lang) + ": " + entry.url + " (" + why + ")") + "</p>";
  }

  // "2 Stoffe, 1 Redoxpaar, 1 Vorrat": was ein Paket einträgt
  function counted(pack, lang) {
    return ["species", "equilibria", "reactions", "couples", "reagents"].map(function (key) {
      var part = pack && pack[key], n = !part ? 0 : Array.isArray(part) ? part.length : Object.keys(part).length;
      return n ? L.text("count." + key + (n === 1 ? "" : ".n"), lang, { n: n }) : "";
    }).filter(Boolean).join(", ");
  }

  // @ChemLab.data: eigene Daten aus einem JSON-Block, gültig für alle Flächen, die danach entstehen
  function useData(el, source) {
    var lang = langOf(), data;
    try { data = JSON.parse(String(source).replace(/^[\s`]+|[\s`]+$/g, "") || "{}"); } catch (error) {
      el.innerHTML = '<p class="cl-error" role="alert">' + L.escape(L.text("err.dataJson", lang) + ": " + error.message) + "</p>";
      return;
    }
    try { L.register(data); } catch (error) {
      el.innerHTML = '<p class="cl-error" role="alert">' + L.escape(L.text("err.data", lang) + ": " + L.explain(error.detail || error.message, lang)) + "</p>";
      return;
    }
    el.innerHTML = '<p class="cl-hint">' + L.escape(L.text("data.done", lang) + ": " + counted(data, lang)) + "</p>";
  }

  // @[ChemLab.pack](url): ein Paket laden; Flächen warten, solange es lädt (L.loaded)
  function usePack(el, url) {
    var lang = langOf();
    url = String(url).trim();
    el.innerHTML = '<p class="cl-hint" role="status">' + L.escape(L.text("pack.loading", lang, { url: url })) + "</p>";
    return L.loadPack(url).then(function (entry) {
      el.innerHTML = entry.state === "done"
        ? '<p class="cl-hint">' + L.escape(L.text("pack.done", lang) + ": " + (typeof entry.pack.about === "string" ? entry.pack.about + " – " : "") + counted(entry.pack, lang)) + "</p>"
        : packError(entry, lang);
    });
  }

  L.mount = mount;
  L.useData = useData;
  L.usePack = usePack;
  L.missing = missing;
  L.loaded = function () { return !missing().length && !L.loadingPacks(); };
})(typeof globalThis !== "undefined" ? globalThis : this);
