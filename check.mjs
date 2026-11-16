// Prüfungen für ChemLab. Aufruf: node --test check.mjs
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

import "./chemlab-engine.js";
import "./chemlab-data.js";

const L = globalThis.LiaChemLab;
const here = new URL(".", import.meta.url);

const near = (actual, expected, tolerance, label) =>
  assert.ok(Math.abs(actual - expected) <= tolerance, `${label || "Wert"}: ${actual} statt ${expected} ± ${tolerance}`);

const lab = (bench, more) => L.createLab(L.normalize(Object.assign({ bench }, more)));
const beaker = (contains, more) => lab([{ type: "beaker", id: "b", contains }], more);
const look = (l, id) => L.view(l, L.vessel(l, id || "b"));
const amount = (l, species, id) => L.vessel(l, id || "b").n[species] || 0;

// Masse und Ladung aller Stoffe, die in einem Labor stecken oder daraus entwichen sind
const totals = (l) => {
  let mass = 0, charge = 0;
  for (const v of l.vessels)
    for (const [store, sign] of [[v.n, 1], [v.out, 1], [v.air || {}, 1], [v.taken || {}, -1]])      // taken: was aus der Luft kam
      for (const [id, n] of Object.entries(store)) {
        mass += sign * n * L.species(id).M;
        charge += sign * n * L.species(id).charge;
      }
  return { mass, charge };
};

// ---------------------------------------------------------------- Formeln

test("Formel: Atome, Ladung, Phase und molare Masse", () => {
  const water = L.parse("H2O(l)");
  assert.deepEqual(water.atoms, { H: 2, O: 1 });
  assert.equal(water.phase, "l");
  assert.equal(water.charge, 0);
  near(water.M, 18.015, 0.001, "M(H2O)");

  assert.equal(L.parse("Mg^2+(aq)").charge, 2);
  assert.equal(L.parse("SO4^2-(aq)").charge, -2);
  assert.deepEqual(L.parse("SO4^2-(aq)").atoms, { S: 1, O: 4 });
  assert.equal(L.parse("NH4+(aq)").charge, 1);
  assert.deepEqual(L.parse("NH4+(aq)").atoms, { N: 1, H: 4 });
  assert.equal(L.parse("OH-(aq)").charge, -1);
  assert.equal(L.parse("Mg+2(aq)").charge, 2, "Schreibweise von PHREEQC");
});

test("Formel: Klammern und Kristallwasser", () => {
  assert.deepEqual(L.parse("Ca(OH)2(s)").atoms, { Ca: 1, O: 2, H: 2 });
  near(L.parse("Ca(OH)2(s)").M, 74.09, 0.01, "M(Ca(OH)2)");
  assert.deepEqual(L.parse("CuSO4*5H2O(s)").atoms, { Cu: 1, S: 1, O: 9, H: 10 });
  near(L.parse("CuSO4*5H2O(s)").M, 249.68, 0.02, "M(CuSO4·5H2O)");
});

test("Formel: Fehler nennen die Ursache", () => {
  assert.throws(() => L.parse("H2O"), (e) => e.code === "phase");
  assert.throws(() => L.parse("Xx2(s)"), (e) => e.code === "element" && e.detail === "Xx");
  assert.throws(() => L.parse("Ca(OH2(s)"), (e) => e.code === "formula");
});

test("Formel: Anzeige mit Tief- und Hochstellung", () => {
  assert.equal(L.formulaText("H2O(l)"), "H₂O");
  assert.equal(L.formulaText("SO4^2-(aq)"), "SO₄²⁻");
  assert.equal(L.formulaText("NH4+(aq)"), "NH₄⁺");
  assert.equal(L.formulaText("CuSO4*5H2O(s)"), "CuSO₄·5H₂O");
  assert.equal(L.formulaHtml("Mg^2+(aq)"), "Mg<sup>2+</sup>");
  assert.equal(L.formulaHtml("H2O(l)", true), "H<sub>2</sub>O<small>(l)</small>");
});

test("Formel: große Moleküle dürfen ein Kurzzeichen tragen", () => {
  assert.equal(L.formulaHtml("C27H27Br2O5S-(aq)", true), "Btb<sup>−</sup><small>(aq)</small>");
  assert.equal(L.formulaText("C27H28Br2O5S(aq)"), "HBtb");
  near(L.species("C27H28Br2O5S(aq)").M, 624.4, 0.1, "die molare Masse folgt weiter aus der Formel");
});

// ---------------------------------------------------------------- Gleichungen

test("Gleichung: Koeffizienten und Richtung", () => {
  const eq = L.equation("Mg(s) + 2 H+(aq) -> Mg^2+(aq) + H2(g)");
  assert.deepEqual(eq.nu, { "Mg(s)": -1, "H+(aq)": -2, "Mg^2+(aq)": 1, "H2(g)": 1 });
  assert.equal(eq.reversible, false);
  assert.equal(L.equation("H2O(l) <=> H+(aq) + OH-(aq)").reversible, true);
  assert.deepEqual(L.equation("2H2(g) + O2(g) -> 2H2O(l)").nu, { "H2(g)": -2, "O2(g)": -1, "H2O(l)": 2 });
});

test("Gleichung: fehlende Atom- oder Ladungsbilanz wird gemeldet", () => {
  assert.throws(() => L.equation("H2(g) + O2(g) -> H2O(l)"), (e) => e.code === "balance" && /O/.test(e.detail));
  assert.throws(() => L.equation("Mg(s) + H+(aq) -> Mg^2+(aq) + H2(g)"), (e) => e.code === "balance");
  assert.throws(() => L.equation("Mg(s) + 2 H+(aq)"), (e) => e.code === "equation");
});

test("Gleichung: Reaktionsenthalpie nach Hess aus den Stoffdaten", () => {
  near(L.enthalpy("H+(aq) + OH-(aq) -> H2O(l)"), -55.8, 0.1, "Neutralisation in kJ/mol");
  near(L.enthalpy("Mg(s) + 2 H+(aq) -> Mg^2+(aq) + H2(g)"), -467.0, 0.1, "Magnesium + Säure in kJ/mol");
});

// ---------------------------------------------------------------- Daten

test("Daten: das Grundpaket ist vollständig und jeder Wert hat eine Quelle", () => {
  assert.deepEqual(L.lint(L.core), []);
  assert.ok(Object.keys(L.db.species).length >= 8);
});

test("Daten: ein Paket mit Fehlern wird abgelehnt und nennt sie", () => {
  const before = Object.keys(L.db.species).length;
  assert.throws(
    () => L.register({ species: { "Zz(s)": {} } }),
    (e) => e.code === "data" && /Zz/.test(e.detail));
  assert.throws(
    () => L.register({ reactions: [{ eq: "Ni(s) + 2 H+(aq) -> Ni^2+(aq) + H2(g)", rate: { k: 1 } }] }),
    (e) => e.code === "data" && /Ni/.test(e.detail), "unbekannte Stoffe");
  assert.throws(
    () => L.register({ equilibria: [{ eq: "H2O(l) <=> H+(aq) + 2 OH-(aq)", logK: -14 }] }),
    (e) => e.code === "data", "nicht ausgeglichen");
  assert.equal(Object.keys(L.db.species).length, before, "nichts davon wurde übernommen");
});

test("Daten: ein eigener Stoff mit Reaktion lässt sich nachtragen", () => {
  L.register({
    species: {
      "Ni(s)": { name: { de: "Nickel" }, Hf: 0, src: "Test" },
      "Ni^2+(aq)": { name: { de: "Nickel(II)-Ion" }, Hf: -54.0, src: "Test" }
    },
    reactions: [{ eq: "Ni(s) + 2 H+(aq) -> Ni^2+(aq) + H2(g)", rate: { k: 1e-6, surface: "Ni(s)", order: { "H+(aq)": 1 } }, src: "Test" }],
    reagents: { "Ni filings": { name: { de: "Nickelspäne" }, solid: "Ni(s)", area: 5 } }
  });
  const l = beaker([{ reagent: "HCl 1M", ml: 20 }]);
  L.add(l, "b", "Ni filings", { g: 0.5 });
  L.step(l, 60);
  assert.ok(amount(l, "Ni^2+(aq)") > 0, "Nickel geht in Lösung");
  near(L.enthalpy("Ni(s) + 2 H+(aq) -> Ni^2+(aq) + H2(g)"), -54.0, 0.01);
});

test("Daten: Konzentration steht im Namen der Vorratsflasche", () => {
  const half = L.reagent("HCl 0.5M");
  assert.equal(half.solution["H+(aq)"], 0.5);
  assert.match(half.name.de, /0,5 mol\/L/);
  assert.equal(L.reagent("HCl").solution["H+(aq)"], 1);
  assert.throws(() => L.reagent("Xyz 1M"), (e) => e.code === "reagent");
});

// ---------------------------------------------------------------- Eingabe

test("Eingabe: Text des Makros, leerer Block und Fehler", () => {
  assert.deepEqual(L.normalize("``` ```").bench, []);
  assert.equal(L.normalize('```{"bench":[{"type":"testtube"}]}```').bench[0].type, "testtube");
  assert.throws(() => L.normalize("{"), (e) => e.code === "json");
  assert.throws(() => L.normalize({ bench: [{ type: "kettle" }] }), (e) => e.code === "part" && e.detail === "kettle");
  assert.throws(() => L.normalize({ bench: [{ type: "beaker", contains: [{ reagent: "Nope", ml: 1 }] }] }), (e) => e.code === "reagent");
  assert.throws(() => L.normalize({ bench: [{ type: "thermometer", in: "x" }] }), (e) => e.code === "place");
  assert.throws(() => L.normalize({ bench: [{ type: "beaker", id: "a" }, { type: "beaker", id: "a" }] }), (e) => e.code === "place", "doppelter Name");
  assert.throws(() => L.normalize({ bench: [{ type: "beaker", id: 'a"b' }] }), (e) => e.code === "place", "Name mit Sonderzeichen");
});

test("Eingabe: Vorgaben, Namen und Anzeige", () => {
  const c = L.normalize({ bench: [{ type: "testtube" }, { type: "testtube" }, { type: "thermometer", in: "testtube2" }], show: { numbers: false } });
  assert.deepEqual(c.bench.map((p) => p.id), ["testtube1", "testtube2", "thermometer1"]);
  assert.equal(c.show.numbers, false);
  assert.equal(c.show.equations, true);
  assert.deepEqual(c.show.charts, ["T", "n", "pH", "titration", "V", "I", "U", "IU", "m", "kappa", "A", "spectrum"]);
  assert.equal(c.room, 20);
});

// ---------------------------------------------------------------- Gleichgewichte

test("pH: reines Wasser ist neutral, bei 50 °C liegt der Neutralpunkt tiefer", () => {
  near(look(beaker([{ reagent: "H2O", ml: 50 }], { room: 25 })).pH, 7.0, 0.01, "pH bei 25 °C");
  near(look(beaker([{ reagent: "H2O", ml: 50 }], { room: 50 })).pH, 6.63, 0.03, "pH bei 50 °C");
});

test("pH: starke Säure und starke Base", () => {
  near(look(beaker([{ reagent: "HCl 0.1M", ml: 50 }], { room: 25 })).pH, 1.0, 0.01, "Salzsäure 0,1 mol/L");
  near(look(beaker([{ reagent: "NaOH 0.01M", ml: 50 }], { room: 25 })).pH, 12.0, 0.01, "Natronlauge 0,01 mol/L");
});

test("Neutralisation: pH 7 und die Temperatur steigt um Q/C", () => {
  const l = beaker([{ reagent: "HCl 1M", ml: 50 }], { room: 25 });
  const v = L.vessel(l, "b");
  assert.equal(L.add(l, "b", "NaOH 1M", { ml: 50 }), true);
  L.step(l, 6);
  near(look(l).pH, 7.0, 0.2, "pH nach der Neutralisation");
  const expected = 0.05 * 55815 / L.heatCapacity(v);
  near(look(l).T - 25, expected, expected * 0.04, "Temperaturanstieg");
  assert.ok(expected > 6 && expected < 7, `rund 6,5 K wie im Schulversuch, gerechnet ${expected}`);
  // Aus den Ionen entsteht Wasser: 0,05 mol sind 0,9 mL mehr. (Gemessen dehnt sich die Lösung um etwa 1,1 mL aus.)
  near(look(l).ml, 100.9, 0.1, "Volumen");
});

test("Zugabe: Flüssigkeit fließt über etwa zwei Sekunden zu", () => {
  const l = beaker([]);
  L.add(l, "b", "H2O", { ml: 6 });
  L.step(l, 0.5);
  const early = look(l).ml;
  assert.ok(early > 0.5 && early < 5, `nach 0,5 s erst ein Teil: ${early} mL`);
  L.step(l, 3);
  near(look(l).ml, 6, 0.01, "nach 3,5 s alles");
});

test("Zugabe: ein volles Gefäß nimmt nichts mehr an", () => {
  const l = lab([{ type: "testtube", id: "b", contains: [{ reagent: "H2O", ml: 18 }] }]);
  assert.equal(L.add(l, "b", "H2O", { ml: 5 }), false);
  assert.equal(L.add(l, "b", "H2O", { ml: 2 }), true);
  assert.equal(L.add(l, "b", "H2O", { ml: 1 }), false, "auch was schon unterwegs ist, zählt");
});

test("Umgießen: Stoffe und Volumen wandern mit", () => {
  const l = lab([
    { type: "beaker", id: "a", contains: [{ reagent: "HCl 1M", ml: 40 }] },
    { type: "beaker", id: "b" }
  ]);
  L.pour(l, "a", "b", 10);
  L.step(l, 5);
  near(look(l, "a").ml, 30, 0.01, "Rest");
  near(look(l, "b").ml, 10, 0.01, "umgegossen");
  near(amount(l, "Cl-(aq)", "b"), 0.010, 1e-6, "Chlorid");
});

// ---------------------------------------------------------------- Reaktionen mit Geschwindigkeit

test("Magnesium in Salzsäure: Stoffmengen nach der Gleichung", () => {
  const l = beaker([{ reagent: "HCl 1M", ml: 10 }]);
  const before = totals(l);
  L.add(l, "b", "Mg ribbon", { g: 0.05 });
  const mg = 0.05 / 24.305;
  L.step(l, 600);
  near(amount(l, "Mg(s)"), 0, 1e-9, "Magnesium verbraucht");
  near(amount(l, "Mg^2+(aq)"), mg, mg * 0.001, "Magnesium-Ionen");
  near(L.vessel(l, "b").out["H2(g)"], mg, mg * 0.001, "Wasserstoff entwichen");
  near(amount(l, "H+(aq)"), 0.010 - 2 * mg, 1e-5, "restliche Säure");
  const after = totals(l);
  near(after.mass, before.mass + 0.05, 1e-6, "Masse bleibt erhalten");
  near(after.charge, 0, 1e-9, "Ladung bleibt null");
});

test("Magnesium in Salzsäure: die Säure kann der begrenzende Stoff sein", () => {
  const l = beaker([{ reagent: "HCl 1M", ml: 5 }]);
  L.add(l, "b", "Mg ribbon", { g: 0.1 });
  L.step(l, 3600);
  near(amount(l, "Mg(s)"), 0.1 / 24.305 - 0.0025, 3e-5, "übriges Magnesium");
  assert.ok(look(l).pH > 4, `Säure verbraucht, pH ${look(l).pH}`);
});

test("Magnesium in Salzsäure: es wird warm und kühlt wieder ab", () => {
  const l = lab([{ type: "testtube", id: "b", contains: [{ reagent: "HCl 1M", ml: 5 }] }]);
  L.add(l, "b", "Mg ribbon", { g: 0.05 });
  let top = 0;
  for (let i = 0; i < 300; i++) { L.step(l, 1); top = Math.max(top, look(l).T); }
  assert.ok(top > 35 && top < 70, `Höchsttemperatur ${top} °C`);
  assert.ok(look(l).T < top - 2, "danach kühlt es ab");
  L.step(l, 3 * 3600);
  near(look(l).T, 20, 0.1, "nach Stunden wieder Raumtemperatur");
});

test("Geschwindigkeit: konzentrierter und wärmer geht schneller", () => {
  const time = (reagent, room) => {
    const l = beaker([{ reagent, ml: 50 }], { room: room || 20 });
    L.add(l, "b", "Mg ribbon", { g: 0.02 });
    let t = 0;
    while (amount(l, "Mg(s)") > 0 && t < 3600) { L.step(l, 1); t++; }
    return t;
  };
  const slow = time("HCl 0.5M"), normal = time("HCl 1M"), fast = time("HCl 2M");
  assert.ok(slow > normal * 1.6 && normal > fast * 1.6, `Dauer ${slow} s, ${normal} s, ${fast} s`);
  assert.ok(normal > 30 && normal < 180, `in 1 mol/L dauert es ${normal} s`);
  assert.ok(time("HCl 1M", 50) < normal * 0.8, "bei 50 °C schneller");
});

// ---------------------------------------------------------------- Farbe

test("Farbe: klares Wasser ist farblos", () => {
  const v = look(beaker([{ reagent: "H2O", ml: 50 }]));
  assert.equal(v.color.name, "colorless");
  assert.deepEqual(v.color.rgb, [255, 255, 255]);
});

test("Farbe: Bromthymolblau ist in Säure gelb, in Lauge blau, dazwischen grün", () => {
  const drops = { reagent: "BTB", drops: 3 };
  assert.equal(look(lab([{ type: "testtube", id: "b", contains: [{ reagent: "HCl 0.1M", ml: 5 }, drops] }])).color.name, "yellow");
  assert.equal(look(lab([{ type: "testtube", id: "b", contains: [{ reagent: "NaOH 0.1M", ml: 5 }, drops] }])).color.name, "blue");
  const half = { "C27H28Br2O5S(aq)": 1e-5, "C27H27Br2O5S-(aq)": 0.6e-5 };
  assert.equal(L.tint(half, 1.4).name, "green");
});

test("Farbe: mehr Stoff oder dickere Schicht färbt kräftiger", () => {
  const blue = (c, d) => L.tint({ "C27H27Br2O5S-(aq)": c }, d).rgb;
  assert.ok(blue(1e-5, 1.4)[0] > blue(4e-5, 1.4)[0], "konzentrierter schluckt mehr Rot");
  assert.deepEqual(blue(1e-5, 2.8), blue(2e-5, 1.4), "Konzentration mal Schichtdicke zählt");
});

// ---------------------------------------------------------------- Messgeräte

test("Thermometer: zeigt die Temperatur seines Gefäßes mit etwas Trägheit", () => {
  const l = lab([
    { type: "beaker", id: "b", contains: [{ reagent: "HCl 1M", ml: 50 }] },
    { type: "thermometer", id: "th", in: "b" }
  ]);
  near(L.reading(l, "th").value, 20, 0.01, "am Anfang Raumtemperatur");
  L.add(l, "b", "NaOH 1M", { ml: 50 });
  L.step(l, 4.5);
  assert.ok(L.reading(l, "th").value < look(l).T - 0.3, "hinkt kurz nach");
  L.step(l, 30);
  near(L.reading(l, "th").value, look(l).T, 0.1, "holt auf");
  assert.equal(L.reading(l, "th").unit, "°C");
});

// ---------------------------------------------------------------- Beobachtungen

test("Beobachtungen: Gasentwicklung, verbrauchter Feststoff, Höchsttemperatur", () => {
  const l = lab([{ type: "testtube", id: "b", contains: [{ reagent: "HCl 1M", ml: 8 }] }]);
  const seen = [];
  const emit = (e) => seen.push(e);
  L.add(l, "b", "Mg ribbon", { g: 0.03 }, emit);
  L.step(l, 900, emit);
  const keys = seen.map((e) => e.key);
  assert.deepEqual(keys.filter((k) => k !== "color"), ["gas", "gone", "gasEnd", "tempMax"]);
  assert.deepEqual(seen.find((e) => e.key === "gas").species, ["H2(g)"]);
  assert.equal(seen.find((e) => e.key === "gone").species, "Mg(s)");
  assert.ok(seen.find((e) => e.key === "tempMax").T > 25);
});

test("Beobachtungen: Farbumschlag des Indikators", () => {
  const l = lab([{ type: "testtube", id: "b", contains: [{ reagent: "HCl 0.1M", ml: 5 }, { reagent: "BTB", drops: 3 }] }]);
  const seen = [];
  L.add(l, "b", "NaOH 0.1M", { ml: 6 }, (e) => seen.push(e));
  L.step(l, 5, (e) => seen.push(e));
  const colors = seen.filter((e) => e.key === "color").map((e) => e.name);
  assert.equal(colors[colors.length - 1], "blue");
});

test("Ruhe: erkannt, wenn nichts mehr fließt, reagiert oder abkühlt", () => {
  const l = beaker([{ reagent: "HCl 1M", ml: 20 }]);
  assert.equal(L.atRest(l), true);
  L.add(l, "b", "Mg ribbon", { g: 0.02 });
  L.step(l, 1);
  assert.equal(L.atRest(l), false);
  L.step(l, 4 * 3600);
  assert.equal(L.atRest(l), true);
});

// ---------------------------------------------------------------- Aufzeichnung

const magnesium = () => L.normalize({ bench: [{ type: "testtube", id: "b", contains: [{ reagent: "HCl 1M", ml: 8 }] }] });

test("Aufzeichnung: Zurückspulen liefert denselben Zustand wie beim ersten Durchlauf", () => {
  const run = L.createRun(magnesium());
  L.act(run, (l, emit) => L.add(l, "b", "Mg ribbon", { g: 0.05 }, emit), { key: "added", vessel: "b", reagent: "Mg ribbon" });
  L.advance(run, 20);
  const at20 = JSON.stringify(run.lab.vessels);
  L.advance(run, 40);
  near(run.time, 60, 1e-9, "Zeit");
  assert.notEqual(JSON.stringify(run.lab.vessels), at20);
  L.seek(run, 20);
  assert.equal(JSON.stringify(run.lab.vessels), at20);
  near(run.time, 20, 1e-9, "Zeiger");
  near(run.end, 60, 1e-9, "die Aufzeichnung bleibt");
});

test("Aufzeichnung: Vorspulen innerhalb der Aufzeichnung rechnet nicht neu", () => {
  const run = L.createRun(magnesium());
  L.act(run, (l) => L.add(l, "b", "Mg ribbon", { g: 0.05 }));
  L.advance(run, 60);
  const end = JSON.stringify(run.lab.vessels), frames = run.frames.length;
  L.seek(run, 10);
  L.advance(run, 50);
  assert.equal(JSON.stringify(run.lab.vessels), end);
  assert.equal(run.frames.length, frames);
  L.advance(run, 5);
  near(run.end, 65, 1e-9, "am Ende geht die Rechnung weiter");
});

test("Aufzeichnung: ein Eingriff in der Vergangenheit schneidet die Zukunft ab", () => {
  const run = L.createRun(magnesium());
  L.act(run, (l, emit) => L.add(l, "b", "Mg ribbon", { g: 0.05 }, emit), { key: "added" });
  L.advance(run, 60);
  assert.ok(run.log.some((e) => e.key === "gas"));
  L.seek(run, 0);
  assert.equal(amount(run.lab, "Mg(s)"), 0, "ganz am Anfang ist das Glas noch ohne Band");
  assert.deepEqual(L.logAt(run), [], "und das Protokoll leer");
  L.seek(run, 30);
  L.act(run, (l) => L.add(l, "b", "H2O", { ml: 2 }), { key: "added" });
  near(run.end, 30, 1e-9, "Ende");
  assert.ok(run.log.every((e) => e.t <= 30), "spätere Beobachtungen sind weg");
  assert.equal(L.inPast(run), false);
  assert.equal(run.log.filter((e) => e.key === "added").length, 2);
  L.advance(run, 5);
  near(look(run.lab).ml, 10, 0.01, "die neue Zugabe wirkt");
});

test("Aufzeichnung: Messreihen für die Diagramme", () => {
  const run = L.createRun(L.normalize({ bench: [
    { type: "testtube", id: "b", contains: [{ reagent: "HCl 1M", ml: 8 }] },
    { type: "thermometer", id: "th", in: "b" }] }));
  L.act(run, (l) => L.add(l, "b", "Mg ribbon", { g: 0.05 }));
  L.advance(run, 120);
  const temperature = L.series(run, { tool: "th" });
  assert.ok(temperature.length > 50 && temperature.length <= 400, `${temperature.length} Punkte`);
  assert.deepEqual(temperature[0], [0, 20]);
  assert.ok(Math.max(...temperature.map((p) => p[1])) > 30);
  const hydrogen = L.series(run, { vessel: "b", species: "H2(g)" });
  near(hydrogen[hydrogen.length - 1][1], 0.05 / 24.305, 1e-5, "gebildeter Wasserstoff, auch der entwichene");
  const changed = L.changed(run, "b");
  assert.deepEqual(changed.sort(), ["H+(aq)", "H2(g)", "Mg(s)", "Mg^2+(aq)"]);
});

test("Aufzeichnung: lange Läufe werden gleichmäßig ausgedünnt, der Anfang bleibt erhalten", () => {
  const run = L.createRun(L.normalize({ bench: [
    { type: "testtube", id: "b", contains: [{ reagent: "HCl 1M", ml: 8 }] },
    { type: "thermometer", id: "th", in: "b" }] }));
  L.act(run, (l) => L.add(l, "b", "Mg ribbon", { g: 0.052 }));
  let top = 0;
  for (let i = 0; i < 90 * 6; i++) { L.advance(run, 10); top = Math.max(top, L.reading(run.lab, "th").value); }   // anderthalb Stunden
  assert.ok(run.frames.length <= 6000, `${run.frames.length} Abbilder`);
  const early = run.frames.filter((f) => f.t <= 120).length;
  assert.ok(early >= 40, `der Anfang ist noch aufgelöst: ${early} Abbilder in den ersten zwei Minuten`);
  near(Math.max(...L.series(run, { tool: "th" }).map((p) => p[1])), top, 0.5, "die Kurve zeigt noch die Höchsttemperatur");
  L.seek(run, 60);
  near(run.lab.t, 60, 2, "der Schieber bei 1:00 zeigt den Zustand von damals");
  assert.ok(amount(run.lab, "Mg(s)") > 0, "da war noch Magnesium im Glas");
});

test("Aufzeichnung: auch Schritt für Schritt entsteht nur jedes zweite Abbild", () => {
  const run = L.createRun(magnesium());
  L.act(run, (l) => L.add(l, "b", "Mg ribbon", { g: 0.05 }));
  for (let i = 0; i < 200; i++) L.advance(run, 0.05);
  near(run.end, 10, 1e-9, "Ende");
  near(run.time, 10, 1e-9, "Zeiger");
  assert.ok(run.frames.length <= 105, `${run.frames.length} Abbilder für 200 Rechenschritte`);
  const live = JSON.stringify(run.lab.vessels);
  L.seek(run, 3);
  L.advance(run, 7);
  assert.equal(JSON.stringify(run.lab.vessels), live, "das Ende der Aufzeichnung ist genau der letzte gerechnete Zustand");
});

test("Aufzeichnung: ein Eingriff ganz am Anfang ersetzt alles Spätere, auch das Protokoll", () => {
  const run = L.createRun(magnesium());
  L.act(run, (l, emit) => L.add(l, "b", "Mg ribbon", { g: 0.05 }, emit), { key: "added", reagent: "Mg ribbon" });
  L.act(run, (l) => L.add(l, "b", "H2O", { ml: 1 }), { key: "added", reagent: "H2O" });
  assert.equal(run.frames.length, 3, "Ausgangszustand und zwei Eingriffe zur Zeit 0");
  L.toStart(run);
  assert.equal(L.inPast(run), true);
  assert.equal(amount(run.lab, "Mg(s)"), 0);
  L.act(run, (l) => L.add(l, "b", "NaOH 1M", { ml: 2 }), { key: "added", reagent: "NaOH 1M" });
  assert.equal(run.frames.length, 2);
  assert.deepEqual(run.log.map((e) => e.reagent), ["NaOH 1M"]);
  L.advance(run, 3);
  assert.equal(amount(run.lab, "Mg(s)"), 0, "das Band von vorher gibt es nicht mehr");
  L.toStart(run);
  L.toEnd(run);
  near(run.time, 3, 1e-9, "zum Ende");
  assert.equal(L.inPast(run), false);
});

// ---------------------------------------------------------------- Reaktionsliste

test("Gleichungen: was im Gefäß abgelaufen ist, mit Umsatz und Enthalpie", () => {
  const l = beaker([{ reagent: "HCl 1M", ml: 10 }]);
  L.add(l, "b", "Mg ribbon", { g: 0.05 });
  L.step(l, 30);
  let list = L.reactions(l, "b");
  assert.equal(list.length, 1);
  assert.equal(list[0].eq, "Mg(s) + 2 H+(aq) -> Mg^2+(aq) + H2(g)");
  assert.ok(list[0].rate > 0, "läuft gerade");
  near(list[0].dH, -467.0, 0.1);
  L.step(l, 600);
  list = L.reactions(l, "b");
  near(list[0].extent, 0.05 / 24.305, 1e-6, "Umsatz");
  assert.equal(list[0].rate, 0, "ist zu Ende");

  const n = beaker([{ reagent: "HCl 1M", ml: 10 }]);
  L.add(n, "b", "NaOH 1M", { ml: 5 });
  L.step(n, 5);
  const neutral = L.reactions(n, "b");
  assert.equal(neutral.length, 1);
  assert.equal(neutral[0].eq, "H+(aq) + OH-(aq) -> H2O(l)", "in der Richtung geschrieben, in der es ablief");
  near(neutral[0].extent, 0.005, 1e-5);
  near(neutral[0].dH, -55.8, 0.1);
});

// ================================================================ Geräte, Effekte, Texte

await import("./chemlab-parts.js");
await import("./chemlab-fx.js");

const ctx = (more) => Object.assign({ lang: "de", numbers: true, uid: "t", t: 0, still: false, no: 1 }, more);
const clean = (svg, label) => {
  assert.equal(typeof svg, "string", label);
  assert.ok(svg.length > 20, `${label}: leer`);
  assert.doesNotMatch(svg, /NaN|undefined|Infinity|\[object/, label);
  assert.doesNotMatch(svg, /<canvas|<img/, label);
};

test("Texte: deutsch und englisch haben dieselben Schlüssel", () => {
  assert.deepEqual(Object.keys(L.strings.en).sort(), Object.keys(L.strings.de).sort());
  assert.equal(L.text("part.testtube", "de"), "Reagenzglas");
  assert.equal(L.text("part.testtube", "fr"), "test tube", "unbekannte Sprache: englisch");
  assert.equal(L.text("say.color", "de", { vessel: "Becherglas 1", color: "blau" }), "Becherglas 1: Die Lösung wird blau.");
});

test("Zahlen: Dezimalkomma, Stoffmengen mit Vorsatz, Uhr", () => {
  assert.equal(L.num(41.83, 1, "de"), "41,8");
  assert.equal(L.num(41.83, 1, "en"), "41.8");
  assert.equal(L.num(-467, 0, "de"), "−467");
  assert.equal(L.amount(0.00206, "de"), "2,06 mmol");
  assert.equal(L.amount(1.5, "de"), "1,50 mol");
  assert.equal(L.amount(9.6e-8, "en"), "0.0960 µmol");
  assert.equal(L.amount(0, "de"), "0 mol");
  assert.equal(L.clock(83.4), "1:23");
  assert.equal(L.clock(3725), "62:05");
});

test("Zeichnung: jedes Gerät, leer und gefüllt, ohne Fehler im SVG", () => {
  const l = lab([
    { type: "testtube", id: "a" },
    { type: "testtube", id: "b", contains: [{ reagent: "HCl 1M", ml: 8 }, { reagent: "BTB", drops: 3 }] },
    { type: "beaker", id: "c", ml: 250, contains: [{ reagent: "NaOH 1M", ml: 120 }] },
    { type: "thermometer", id: "th", in: "b" },
    { type: "thermometer", id: "free" }
  ]);
  L.add(l, "b", "Mg ribbon", { g: 0.05 });
  L.add(l, "c", "HCl 1M", { ml: 20 });
  L.step(l, 1);
  for (const v of l.vessels) {
    for (const numbers of [true, false]) clean(L.parts[v.type].draw(L.view(l, v), ctx({ numbers })), v.id);
    assert.ok(L.parts[v.type].width(v) > 40, "Platzbedarf");
  }
  for (const t of l.tools) {
    const host = L.vessel(l, t.in);
    clean(L.parts.thermometer.draw(L.reading(l, t.id), ctx(), host ? L.parts[host.type].probe(host) : null), t.id);
  }
  const big = L.vessel(l, "c");
  assert.ok(L.parts.beaker.probe(big).x < 0, "das Thermometer steht links, die Skala des Becherglases rechts");
});

test("Zeichnung: der Spiegel steigt mit dem Volumen und trägt die Farbe der Lösung", () => {
  const level = (ml) => {
    const l = lab([{ type: "testtube", id: "b", contains: [{ reagent: "NaOH 0.1M", ml }, { reagent: "BTB", drops: 3 }] }]);
    const w = L.view(l, L.vessel(l, "b"));
    return { y: L.parts.testtube.surface(w), svg: L.parts.testtube.draw(w, ctx()), rgb: w.color.rgb };
  };
  const low = level(4), high = level(12);
  assert.ok(high.y < low.y - 40, `höherer Spiegel liegt weiter oben: ${low.y} → ${high.y}`);
  assert.match(low.svg, /class="cl-liquid"[^>]*fill="rgb\(\d+,\d+,\d+\)"/);
  const fill = /class="cl-liquid"[^>]*fill="rgb\((\d+),(\d+),(\d+)\)"/.exec(low.svg).slice(1).map(Number);
  assert.ok(fill[2] > fill[0] + 60, `blaue Lösung: ${fill}`);
  assert.doesNotMatch(L.parts.testtube.draw(look(lab([{ type: "testtube", id: "b" }])), ctx()), /cl-liquid/, "leeres Glas ohne Flüssigkeit");
  assert.match(low.svg, />4,2 mL</, "4 mL und drei Tropfen, mit einer Nachkommastelle");
  assert.match(high.svg, />12,2 mL</, "auch ab 10 mL");
});

test("Zeichnung: Magnesiumband wird dünner, Zahlen lassen sich ausblenden", () => {
  const l = lab([{ type: "testtube", id: "b", contains: [{ reagent: "HCl 1M", ml: 8 }] }, { type: "thermometer", id: "th", in: "b" }]);
  L.add(l, "b", "Mg ribbon", { g: 0.05 });
  const width = () => +/class="cl-solid"[^>]*stroke-width="([\d.]+)"/.exec(L.parts.testtube.draw(look(l), ctx()))[1];
  const start = width();
  L.step(l, 60);
  assert.ok(width() < start * 0.8, "dünner nach einer Minute");
  const place = L.parts.testtube.probe(L.vessel(l, "b"));
  assert.match(L.parts.thermometer.draw(L.reading(l, "th"), ctx(), place), /cl-tag/);
  assert.match(L.parts.thermometer.draw(L.reading(l, "th"), ctx(), place), /°C/);
  assert.doesNotMatch(L.parts.thermometer.draw(L.reading(l, "th"), ctx({ numbers: false }), place), /cl-tag/);
});

test("Blasen: Zahl nach der Gasmenge, Ort nach der Zeit, rückwärts wie vorwärts", () => {
  const box = { x0: -10, x1: 10, top: -100, bottom: -10 };
  const count = (svg) => (svg.match(/<circle/g) || []).length;
  assert.equal(L.fx.bubbles(box, 0, 3, 1), "");
  const few = L.fx.bubbles(box, 2e-6, 3, 1), many = L.fx.bubbles(box, 2e-4, 3, 1);
  assert.ok(count(few) >= 2 && count(many) > count(few) && count(many) <= 16, `${count(few)} und ${count(many)} Blasen`);
  clean(many, "Blasen");
  assert.equal(L.fx.bubbles(box, 2e-5, 3, 1), L.fx.bubbles(box, 2e-5, 3, 1), "gleiche Zeit, gleiches Bild");
  assert.notEqual(L.fx.bubbles(box, 2e-5, 3.2, 1), L.fx.bubbles(box, 2e-5, 3, 1), "andere Zeit, anderes Bild");
  assert.notEqual(L.fx.bubbles(box, 2e-5, 3, 2), L.fx.bubbles(box, 2e-5, 3, 1), "jedes Gefäß mit eigenem Muster");
  const ys = (svg) => [...svg.matchAll(/cy="(-?[\d.]+)"/g)].map((m) => +m[1]);
  assert.ok(ys(many).every((y) => y <= box.bottom && y >= box.top), "bleiben in der Flüssigkeit");
  // eine Blase steigt: kurz danach liegt sie höher (kleineres y), sofern sie nicht gerade oben angekommen ist
  const a = ys(L.fx.bubbles(box, 2e-5, 3, 1)), b = ys(L.fx.bubbles(box, 2e-5, 3.05, 1));
  assert.ok(a.filter((y, i) => b[i] < y).length >= a.length - 2, "Blasen steigen");
  assert.equal(L.fx.bubbles(box, 2e-5, 3, 1, true), L.fx.bubbles(box, 2e-5, 9, 1, true), "ohne Bewegung: stehendes Bild");
});

test("Beobachtungen: als Satz in der Sprache des Kurses", () => {
  const say = (event, more) => L.say(event, Object.assign({ lang: "de", numbers: true, names: { b: "Reagenzglas 1", c: "Becherglas 1" } }, more));
  assert.equal(say({ key: "gas", vessel: "b", species: ["H2(g)"] }), "Reagenzglas 1: Gasblasen steigen auf.");
  assert.equal(say({ key: "gone", vessel: "b", species: "Mg(s)" }), "Reagenzglas 1: Magnesium ist verbraucht.");
  assert.equal(say({ key: "color", vessel: "b", name: "yellow", pale: true }), "Reagenzglas 1: Die Lösung wird blassgelb.");
  assert.equal(say({ key: "tempMax", vessel: "b", T: 41.73 }), "Reagenzglas 1: Höchste Temperatur 41,7 °C, nun kühlt es ab.");
  assert.equal(say({ key: "tempMax", vessel: "b", T: 41.73 }, { numbers: false }), "Reagenzglas 1: Es ist warm geworden und kühlt nun ab.");
  assert.equal(say({ key: "added", vessel: "b", reagent: "HCl 0.5M", ml: 5 }), "5 mL Salzsäure 0,5 mol/L in Reagenzglas 1 gegeben");
  assert.equal(say({ key: "added", vessel: "b", reagent: "BTB", drops: 3 }), "3 Tropfen Bromthymolblau in Reagenzglas 1 gegeben");
  assert.equal(say({ key: "added", vessel: "b", reagent: "Mg ribbon", g: 0.052 }), "5 cm Magnesiumband in Reagenzglas 1 gegeben");
  assert.equal(say({ key: "poured", from: "b", vessel: "c", ml: 2.5 }), "2,5 mL aus Reagenzglas 1 in Becherglas 1 gegossen");
  assert.equal(say({ key: "color", vessel: "b", name: "blue" }, { lang: "en" }), "Reagenzglas 1: The solution turns blue.");
});

// ================================================================ Oberfläche
// Kein Browser: ein nachgebautes Mini-DOM, das sich Inhalte, Attribute und Lauscher merkt.
// Ob Antippen und Zeichnung im Browser stimmen, zeigt erst die Probe im Browser.

function node() {
  return {
    innerHTML: "", textContent: "", value: "", hidden: false, isConnected: true, attributes: {}, listeners: {}, kids: {},
    setAttribute(k, v) { this.attributes[k] = String(v); },
    getAttribute(k) { return k in this.attributes ? this.attributes[k] : null; },
    removeAttribute(k) { delete this.attributes[k]; },
    addEventListener(type, fn) { this.listeners[type] = fn; },
    removeEventListener(type) { delete this.listeners[type]; },
    querySelector(sel) { return (this.kids[sel] ||= node()); },
    insertAdjacentHTML(where, html) { this.added = (this.added || 0) + 1; this.innerHTML += html; },
    setPointerCapture() {}, releasePointerCapture() {}, focus() {}, closest() { return null; }
  };
}

globalThis.document = { documentElement: { lang: "de" } };
const queue = [];
let now = 0;
globalThis.requestAnimationFrame = (fn) => { queue.push(fn); return queue.length; };
globalThis.cancelAnimationFrame = () => {};
await import("./chemlab-ui.js");

// lässt die Bilder laufen: 20 je Sekunde, wie ein Browser mit 50 ms je Bild
const frames = (seconds) => { for (let i = 0; i < Math.round(seconds * 20); i++) { now += 50; queue.splice(0).forEach((fn) => fn(now)); } };
let serial = 0;
// Jede Probe beginnt ohne die Bilder früherer Proben: deren Flächen gibt es im Browser dann nicht mehr.
const mount = (source, id, keep) => { if (!keep) queue.length = 0; const el = node(); el.id = id || "lab" + ++serial; L.mount(el, source); return el; };
const state = (el) => L.store[el.id];
const part = (el, sel) => el.querySelector(sel);
const item = (el, id) => part(el, ".cl-svg").querySelector(`[data-id="${id}"]`);
const control = (attrs, value) => ({ getAttribute: (k) => (k in attrs ? attrs[k] : null), value, closest(sel) { return /data-act/.test(sel) ? this : null; } });
const press = (el, act, id) => el.listeners.click({ target: control({ "data-act": act, "data-id": id }), preventDefault() {} });
const enter = (el, type, act, value) => el.listeners[type]({ type, target: control({ "data-act": act }, value) });
const tap = (el, id) => {
  const svg = part(el, ".cl-svg");
  const ev = { target: { closest: (sel) => (sel === ".cl-item" && id ? { getAttribute: () => id } : null) }, clientX: 10, clientY: 10, pointerId: 1, preventDefault() {} };
  svg.listeners.pointerdown(ev);
  svg.listeners.pointerup(ev);
};

// ob ein Stoff im Regal als gewählt gilt, die Menge in der Hand, die Zeilen des Protokolls
const pressed = (el, id) => {
  const n = new RegExp(`data-id="${id}" data-n="(\\d+)"`).exec(part(el, ".cl-shelf").innerHTML)[1];
  return part(el, ".cl-shelf").querySelector(`[data-n="${n}"]`).attributes["aria-pressed"];
};
const inHand = (el) => part(el, ".cl-hand").querySelector(".cl-amount").textContent;
const logOf = (el) => part(el, ".cl-log").querySelector(".cl-events").innerHTML;
// zählt, wie oft ein Stück der Seite neu aufgebaut wird
const watch = (n) => {
  let html = n.innerHTML, writes = 0;
  Object.defineProperty(n, "innerHTML", { get: () => html, set: (v) => { html = v; writes++; }, configurable: true });
  return () => writes;
};

const tube = { bench: [{ type: "testtube", id: "rg", contains: [{ reagent: "HCl 1M", ml: 8 }] }], shelf: ["HCl 1M", "NaOH 1M", "H2O", "BTB", "Mg ribbon", "testtube", "beaker", "thermometer"] };

test("Oberfläche: Regal, Arbeitsfläche und Bedienleiste erscheinen", () => {
  const el = mount(JSON.stringify(tube));
  for (const cls of ["cl-shelf", "cl-svg", "cl-time", "cl-status", "cl-panel", "cl-eq", "cl-charts", "cl-log"]) assert.match(el.innerHTML, new RegExp(`class="${cls}`), cls);
  const shelf = part(el, ".cl-shelf").innerHTML;
  assert.match(shelf, /data-act="hand" data-id="HCl 1M"/);
  assert.match(shelf, /Salzsäure 1 mol\/L/);
  assert.match(shelf, /Magnesiumband/);
  assert.match(shelf, /data-id="thermometer"/);
  assert.equal((shelf.match(/<button/g) || []).length, 8);
  assert.match(part(el, ".cl-svg").innerHTML, /class="cl-item[^"]*" data-id="rg"/);
  assert.match(part(el, ".cl-svg").attributes.viewBox, /^0 0 \d+ \d+$/);
  clean(item(el, "rg").innerHTML, "Reagenzglas");
  assert.match(item(el, "rg").innerHTML, /cl-glass/);
  assert.equal(item(el, "rg").attributes["aria-label"], "Reagenzglas 1: 8 mL, farblos");
  assert.match(part(el, ".cl-time").innerHTML, /data-act="play"/);
  assert.equal(state(el).play, 0, "am Anfang steht die Uhr");
});

test("Oberfläche: auch der leere Tisch wird gezeichnet", () => {
  const el = mount("{}");
  assert.match(part(el, ".cl-svg").innerHTML, /class="cl-bench"/);
  assert.match(part(el, ".cl-svg").attributes.viewBox || "", /^0 0 \d+ \d+$/);
});

test("Oberfläche: ohne Angabe zeigt das Regal alle Stoffe und Geräte", () => {
  const shelf = part(mount({ bench: [] }), ".cl-shelf").innerHTML;
  for (const id of ["HCl", "NaOH", "H2O", "BTB", "Mg ribbon", "testtube", "beaker", "thermometer"]) assert.ok(shelf.includes(`data-id="${id}"`), id);
});

test("Oberfläche: eine fehlerhafte Beschreibung ergibt einen Hinweis statt der Fläche", () => {
  const broken = mount('{"bench": [');
  assert.match(broken.innerHTML, /role="alert"/);
  assert.match(broken.innerHTML, /kein gültiges JSON/);
  assert.match(mount({ bench: [{ type: "kettle" }] }).innerHTML, /Dieses Gerät gibt es nicht: kettle/);
  assert.doesNotMatch(mount({ bench: [{ type: "<b>" }] }).innerHTML, /<b>/, "Text aus der Beschreibung wird maskiert");
});

test("Zugabe: Stoff im Regal wählen, dann das Gefäß antippen", () => {
  const el = mount(tube);
  press(el, "hand", "Mg ribbon");
  assert.equal(pressed(el, "Mg ribbon"), "true");
  assert.equal(pressed(el, "HCl 1M"), "false");
  assert.match(part(el, ".cl-hand").innerHTML, /5 cm/);
  assert.match(part(el, ".cl-hand").innerHTML, /Nun ein Gefäß antippen/);
  tap(el, "rg");
  near(L.vessel(state(el).run.lab, "rg").n["Mg(s)"], 5 * 0.0104 / 24.305, 1e-9, "Magnesium im Glas");
  assert.equal(state(el).play, 1, "die Uhr läuft los");
  frames(5);
  near(state(el).run.time, 5, 0.2, "Zeit läuft im Takt der Bilder");
  assert.match(item(el, "rg").innerHTML, /cl-bubble/);
  assert.match(item(el, "rg").innerHTML, /cl-solid/);
  assert.match(logOf(el), /5 cm Magnesiumband in Reagenzglas 1 gegeben/);
  assert.match(logOf(el), /Gasblasen steigen auf/);
  tap(el, "rg");
  near(L.vessel(state(el).run.lab, "rg").n["Mg(s)"], 2 * 5 * 0.0104 / 24.305, 2e-4, "der Stoff bleibt in der Hand: noch einmal");
});

test("Zugabe: Menge einstellen, Flüssigkeit in mL, Indikator in Tropfen", () => {
  const el = mount(tube);
  press(el, "hand", "NaOH 1M");
  assert.match(part(el, ".cl-hand").innerHTML, /5 mL/);
  press(el, "less");
  assert.equal(inHand(el), "2 mL");
  tap(el, "rg");
  frames(3);
  near(look(state(el).run.lab, "rg").ml, 10, 0.1, "2 mL dazu");
  press(el, "hand", "BTB");
  assert.match(part(el, ".cl-hand").innerHTML, /3 Tropfen/);
  press(el, "more");
  assert.equal(inHand(el), "5 Tropfen");
  press(el, "hand", "BTB");
  assert.equal(state(el).hand, null, "noch einmal antippen legt den Stoff zurück");
});

test("Zugabe: ein volles Gefäß meldet sich, und nichts wird verworfen", () => {
  const el = mount({ bench: [{ type: "testtube", id: "rg", contains: [{ reagent: "H2O", ml: 18 }] }] });
  press(el, "hand", "H2O");
  tap(el, "rg");
  assert.equal(part(el, ".cl-status").textContent, "Dafür ist in diesem Gefäß kein Platz mehr.");
  assert.equal(state(el).run.frames.length, 1);
});

test("Zeit: anhalten, rückwärts, zum Anfang, zum Ende, Schieber und Tempo", () => {
  const el = mount(tube);
  press(el, "hand", "Mg ribbon");
  tap(el, "rg");
  frames(6.5);
  press(el, "play");
  const stopped = state(el).run.time;
  frames(1);
  assert.equal(state(el).run.time, stopped, "angehalten");
  assert.equal(queue.length, 0, "ohne Bewegung auch keine Bilder");
  press(el, "back");
  frames(2);
  near(state(el).run.time, stopped - 2, 0.2, "rückwärts");
  assert.ok(L.vessel(state(el).run.lab, "rg").n["Mg(s)"] > 0, "der Zustand von damals");
  press(el, "start");
  assert.equal(state(el).run.time, 0);
  assert.equal(state(el).play, 0);
  enter(el, "input", "seek", "2.5");
  near(state(el).run.time, 2.5, 1e-9, "Schieber");
  assert.equal(part(el, ".cl-time").querySelector(".cl-clock").textContent, "0:02 / 0:06");
  press(el, "end");
  near(state(el).run.time, state(el).run.end, 1e-9, "Ende");
  enter(el, "change", "speed", "5");
  press(el, "play");
  frames(2);
  near(state(el).run.time, stopped + 10, 1, "fünffaches Tempo");
  press(el, "back");
  frames(100);
  assert.equal(state(el).run.time, 0, "rückwärts endet am Anfang");
  assert.equal(state(el).play, 0);
});

test("Zeit: in Ruhe hält die Uhr an, ein Eingriff startet sie", () => {
  const el = mount({ bench: [{ type: "beaker", id: "b", contains: [{ reagent: "H2O", ml: 20 }] }] });
  press(el, "hand", "H2O");
  tap(el, "b");
  assert.equal(state(el).play, 1);
  frames(8);
  assert.equal(state(el).play, 0);
  assert.ok(state(el).run.time < 4, `nach dem Zugießen steht die Uhr: ${state(el).run.time} s`);
  assert.equal(part(el, ".cl-status").textContent, "Es ändert sich nichts mehr, die Uhr steht.");
  assert.equal(queue.length, 0);
});

test("Zeit: ein Eingriff in der Vergangenheit setzt dort neu an", () => {
  const el = mount(tube);
  press(el, "hand", "Mg ribbon");
  tap(el, "rg");
  frames(10);
  enter(el, "input", "seek", "4");
  press(el, "hand", "H2O");
  tap(el, "rg");
  near(state(el).run.end, 4, 0.06, "Ende der Aufzeichnung");
  assert.match(part(el, ".cl-status").textContent, /verworfen/);
});

test("Geräte: ein neues Gefäß aus dem Regal, ein Thermometer in ein Gefäß", () => {
  const el = mount(tube);
  press(el, "hand", "beaker");
  assert.deepEqual(state(el).run.lab.vessels.map((v) => v.id), ["rg", "beaker1"]);
  assert.match(part(el, ".cl-svg").innerHTML, /data-id="beaker1"/);
  press(el, "hand", "thermometer");
  assert.match(part(el, ".cl-hand").innerHTML, /Nun das Gefäß antippen, in das es soll/);
  tap(el, "rg");
  assert.deepEqual(state(el).run.lab.tools.map((t) => [t.type, t.in]), [["thermometer", "rg"]]);
  assert.equal(state(el).hand, null);
  assert.match(item(el, "thermometer1").innerHTML, /cl-mercury/);
  assert.equal(item(el, "thermometer1").attributes["aria-label"], "Thermometer 1 in Reagenzglas 1: 20,0 °C");
  press(el, "hand", "thermometer");
  tap(el, "rg");
  assert.equal(part(el, ".cl-status").textContent, "Dieses Gefäß hat schon ein solches Gerät.");
  assert.equal(state(el).run.lab.tools.length, 1);
});

test("Geräte: ein Thermometer im Glas steht der Zugabe nicht im Weg", () => {
  const el = mount({ bench: [{ type: "testtube", id: "rg", contains: [{ reagent: "HCl 1M", ml: 8 }] }, { type: "thermometer", id: "th", in: "rg" }] });
  // antippbar ist nur, was über den Rand des Glases hinausragt; das Glas selbst bleibt frei
  const hit = /<rect class="cl-hit[^"]*" x="(-?[\d.]+)" y="(-?[\d.]+)" width="([\d.]+)" height="([\d.]+)"/.exec(item(el, "th").innerHTML).slice(1).map(Number);
  const rim = L.parts.testtube.bounds().top;
  assert.ok(hit[1] + hit[3] <= rim, `Trefferfläche endet am Rand des Glases: ${hit[1] + hit[3]} ≤ ${rim}`);
  assert.ok(hit[2] >= 24 && hit[3] >= 40, `groß genug für einen Finger: ${hit[2]} × ${hit[3]}`);
  assert.match(fs.readFileSync(new URL("chemlab.css", here), "utf8"), /\.cl-item > :not\(\.cl-hit\)\s*\{\s*pointer-events:\s*none/);
  // und wer mit einem Stoff in der Hand doch das Thermometer trifft, meint das Glas
  press(el, "hand", "Mg ribbon");
  tap(el, "th");
  assert.ok(L.vessel(state(el).run.lab, "rg").n["Mg(s)"] > 0, "Magnesium ist im Glas");
  assert.equal(state(el).sel, null);
  press(el, "hand", "Mg ribbon");
  tap(el, "th");
  assert.equal(state(el).sel, "th", "ohne Stoff in der Hand wird das Thermometer gewählt");
});

test("Auswahl: Inhalt ansehen, umgießen, ausleeren, wegräumen", () => {
  const el = mount({ bench: [{ type: "testtube", id: "rg", contains: [{ reagent: "HCl 1M", ml: 8 }] }, { type: "beaker", id: "b" }] });
  tap(el, "rg");
  assert.equal(state(el).sel, "rg");
  const panel = part(el, ".cl-panel");
  assert.match(panel.innerHTML, /Reagenzglas 1/);
  const contents = panel.querySelector(".cl-contents").innerHTML;
  assert.match(contents, /H<sup>\+<\/sup>/);
  assert.match(contents, /8,00 mmol/);
  assert.match(contents, /1,00 mol\/L/);
  assert.match(contents, /pH 0,00/);
  assert.match(panel.innerHTML, /<option value="b">Becherglas 1<\/option>/);
  panel.querySelector(".cl-pour-to").value = "b";
  panel.querySelector(".cl-pour-ml").value = "2,5";
  press(el, "pour");
  frames(4);
  near(look(state(el).run.lab, "b").ml, 2.5, 0.01, "umgegossen");
  assert.match(logOf(el), /2,5 mL aus Reagenzglas 1 in Becherglas 1 gegossen/);
  press(el, "empty");
  assert.equal(look(state(el).run.lab, "rg").ml, 0);
  press(el, "remove");
  assert.deepEqual(state(el).run.lab.vessels.map((v) => v.id), ["b"]);
  assert.equal(state(el).sel, null);
  tap(el, null);
  assert.match(part(el, ".cl-panel").innerHTML, /Ein Gefäß antippen/);
});

test("Gleichungen, Protokoll und Diagramme füllen sich beim Versuch", () => {
  const el = mount({ bench: [{ type: "testtube", id: "rg", contains: [{ reagent: "HCl 1M", ml: 8 }] }, { type: "thermometer", in: "rg" }] });
  assert.match(part(el, ".cl-eq").innerHTML, /Noch ist keine Reaktion abgelaufen/);
  assert.match(part(el, ".cl-charts").innerHTML, /Noch hat sich keine Stoffmenge geändert/);
  press(el, "hand", "Mg ribbon");
  tap(el, "rg");
  enter(el, "change", "speed", "20");
  frames(12);
  const eq = part(el, ".cl-eq").innerHTML;
  assert.match(eq, /Mg<small>\(s\)<\/small> \+ 2 H<sup>\+<\/sup><small>\(aq\)<\/small> → Mg<sup>2\+<\/sup><small>\(aq\)<\/small> \+ H<sub>2<\/sub><small>\(g\)<\/small>/);
  assert.match(eq, /ΔH = −467 kJ\/mol/);
  assert.match(eq, /Umsatz 2,14 mmol/);
  const charts = part(el, ".cl-charts").innerHTML;
  assert.equal((charts.match(/<svg/g) || []).length >= 2, true);
  assert.ok((charts.match(/<polyline/g) || []).length >= 5, "eine Temperaturkurve und vier Stoffmengen");
  assert.match(charts, /Temperatur/);
  assert.match(charts, /<span>Mg<sup>2\+<\/sup>/, "die Formel in der Legende steht in einem Stück");
  clean(charts, "Diagramme");
  const log = logOf(el);
  assert.match(log, /Magnesium ist verbraucht/);
  assert.match(log, /Höchste Temperatur \d\d,\d °C/);
});

test("Zahlen ausblenden: es bleiben Beobachtungen und Gleichungen ohne Werte", () => {
  const el = mount({ bench: [{ type: "testtube", id: "rg", contains: [{ reagent: "HCl 1M", ml: 8 }] }, { type: "thermometer", in: "rg" }], show: { numbers: false } });
  press(el, "hand", "Mg ribbon");
  tap(el, "rg");
  enter(el, "change", "speed", "20");
  frames(12);
  assert.doesNotMatch(item(el, "rg").innerHTML, /mL/);
  assert.doesNotMatch(item(el, "thermometer1").innerHTML, /cl-tag/);
  assert.equal(item(el, "thermometer1").attributes["aria-label"], "Thermometer 1 in Reagenzglas 1");
  assert.doesNotMatch(part(el, ".cl-eq").innerHTML, /kJ|mmol/);
  assert.match(part(el, ".cl-eq").innerHTML, /→/);
  assert.match(logOf(el), /Es ist warm geworden/);
  tap(el, "rg");
  assert.doesNotMatch(part(el, ".cl-panel").querySelector(".cl-contents").innerHTML, /mmol|pH/);
});

test("Anzeige: Diagramme, Gleichungen und Protokoll lassen sich abschalten", () => {
  const el = mount({ bench: [{ type: "testtube" }], show: { charts: false, equations: false, log: false } });
  assert.equal(part(el, ".cl-charts").hidden, true);
  assert.equal(part(el, ".cl-eq").hidden, true);
  assert.equal(part(el, ".cl-log").hidden, true);
});

test("Folienwechsel: dieselbe Fläche kommt mit ihrem Stand zurück", () => {
  const el = mount(tube, "wieder");
  press(el, "hand", "Mg ribbon");
  tap(el, "rg");
  frames(3);
  const time = state(el).run.time;
  el.isConnected = false;
  frames(1);
  assert.equal(queue.length, 0, "die Schleife endet, wenn die Folie weg ist");
  const again = mount(tube, "wieder");
  assert.equal(state(again).run.time, time);
  assert.match(logOf(again), /Magnesiumband/);
  assert.match(item(again, "rg").innerHTML, /cl-solid/);
});

test("Zwei Flächen auf einer Folie sind unabhängig", () => {
  const a = mount(tube), b = mount(tube, null, true);
  press(a, "hand", "Mg ribbon");
  tap(a, "rg");
  frames(2);
  assert.ok(state(a).run.time > 1);
  assert.equal(state(b).run.time, 0);
  assert.equal(state(b).hand, null);
  assert.notEqual(/id="(cl-[^"]+-clip)"/.exec(item(a, "rg").innerHTML)[1], /id="(cl-[^"]+-clip)"/.exec(item(b, "rg").innerHTML)[1], "eigene Namen für Ausschnitte");
});

test("Zurücksetzen stellt den Aufbau vom Anfang wieder her", () => {
  const el = mount(tube);
  press(el, "hand", "Mg ribbon");
  tap(el, "rg");
  frames(3);
  press(el, "reset");
  assert.equal(state(el).run.time, 0);
  assert.equal(state(el).run.frames.length, 1);
  assert.equal(L.vessel(state(el).run.lab, "rg").n["Mg(s)"], undefined);
  assert.equal(state(el).hand, null);
  assert.equal(logOf(el), "");
  assert.equal(part(el, ".cl-log").querySelector(".cl-none").hidden, false, "„Noch nichts beobachtet“ steht wieder da");
});

test("Tastatur und Berührung", () => {
  const el = mount(tube);
  let prevented = false;
  part(el, ".cl-svg").listeners.keydown({ key: "Enter", target: { closest: (sel) => (sel === ".cl-item" ? { getAttribute: () => "rg" } : null) }, preventDefault() { prevented = true; } });
  assert.equal(state(el).sel, "rg", "Eingabetaste wirkt wie Antippen");
  assert.equal(prevented, true);
  let stopped = 0;
  el.listeners.touchmove({ target: { closest: (sel) => (sel === ".cl-stage" ? {} : null) }, stopPropagation() { stopped++; } });
  el.listeners.touchmove({ target: { closest: () => null }, stopPropagation() { stopped++; } });
  assert.equal(stopped, 1, "Wischen auf der Fläche wechselt nicht die Folie, daneben schon");
  assert.match(part(el, ".cl-time").innerHTML, /role="slider"/, "Pfeiltasten am Schieber gehören dem Schieber");
});

test("Erneutes Einhängen derselben Stelle beendet die alte Schleife", () => {
  const el = mount(tube);
  press(el, "hand", "Mg ribbon");
  tap(el, "rg");
  L.mount(el, tube);
  frames(1);
  assert.equal(state(el).play, 1, "der Versuch läuft weiter");
  assert.equal(queue.length, 1, "genau eine Schleife");
});

// ---------------------------------------------------------------- Befunde der Durchsicht, Oberfläche

test("Hand: nach dem Aufstellen eines Geräts ist sie auch sichtbar leer", () => {
  const el = mount(tube);
  press(el, "hand", "HCl 1M");
  press(el, "hand", "testtube");
  assert.equal(state(el).hand, null);
  assert.equal(part(el, ".cl-hand").hidden, true);
  assert.equal(pressed(el, "HCl 1M"), "false");
  assert.doesNotThrow(() => press(el, "more"), "ein Mengenknopf ohne Stoff in der Hand tut nichts");
  press(el, "hand", "thermometer");
  assert.equal(pressed(el, "thermometer"), "true");
  tap(el, "rg");
  assert.equal(part(el, ".cl-hand").hidden, true);
  assert.equal(pressed(el, "thermometer"), "false");
});

test("Bedienung: Regal, Mengenknöpfe und Protokoll bleiben stehen, statt ständig neu zu entstehen", () => {
  const el = mount(tube);
  const shelf = watch(part(el, ".cl-shelf")), hand = watch(part(el, ".cl-hand"));
  press(el, "hand", "NaOH 1M");
  assert.equal(shelf(), 0, "das Regal bleibt, also auch der Fokus auf dem gewählten Stoff");
  const once = hand();
  press(el, "more");
  press(el, "less");
  press(el, "less");
  assert.equal(hand(), once, "die Knöpfe für die Menge bleiben");
  assert.equal(inHand(el), "2 mL");
  assert.match(el.innerHTML, /class="cl-events" aria-live="polite"/, "eine bleibende Liste, die Neues ansagt");
  press(el, "hand", "Mg ribbon");
  tap(el, "rg");
  frames(1);
  const events = part(el, ".cl-log").querySelector(".cl-events");
  assert.ok(events.added >= 1, "neue Beobachtungen werden angehängt");
  const list = watch(events);
  frames(2);
  assert.equal(list(), 0, "ohne neue Beobachtung wird die Liste nicht angefasst");
  assert.equal(part(el, ".cl-log").querySelector(".cl-none").hidden, true);
});

test("Zeit: Zum Anfang zeigt den Aufbau vor dem ersten Eingriff", () => {
  const el = mount(tube);
  press(el, "hand", "Mg ribbon");
  tap(el, "rg");
  frames(3);
  press(el, "start");
  assert.doesNotMatch(item(el, "rg").innerHTML, /cl-solid/);
  assert.equal(logOf(el), "");
  press(el, "play");
  frames(1);
  assert.match(item(el, "rg").innerHTML, /cl-solid/);
  assert.match(logOf(el), /Magnesiumband/);
  press(el, "start");
  press(el, "hand", "Mg ribbon");
  press(el, "hand", "H2O");
  tap(el, "rg");
  assert.match(part(el, ".cl-status").textContent, /verworfen/);
  assert.doesNotMatch(logOf(el), /Magnesiumband/, "der frühere Eingriff ist auch aus dem Protokoll");
});

test("Aufräumen: eine verlassene Fläche hängt nicht weiter am Fenster", () => {
  const before = [globalThis.addEventListener, globalThis.removeEventListener], listeners = new Set();
  globalThis.addEventListener = (type, fn) => { if (type === "resize") listeners.add(fn); };
  globalThis.removeEventListener = (type, fn) => { listeners.delete(fn); };
  try {
    const el = mount(tube);
    assert.equal(listeners.size, 1);
    el.isConnected = false;
    [...listeners].forEach((fn) => fn());
    assert.equal(listeners.size, 0);
  } finally {
    [globalThis.addEventListener, globalThis.removeEventListener] = before;
  }
});

test("Geänderte Beschreibung: dieselbe Stelle zeigt den neuen Aufbau, ein behobener Fehler verschwindet", () => {
  const first = mount(tube, "neu");
  press(first, "hand", "Mg ribbon");
  tap(first, "rg");
  const other = mount({ bench: [{ type: "beaker", id: "bg" }] }, "neu");
  assert.deepEqual(state(other).run.lab.vessels.map((v) => v.id), ["bg"]);
  assert.match(mount('{"bench": [', "kaputt").innerHTML, /role="alert"/);
  assert.doesNotMatch(mount('{"bench": []}', "kaputt").innerHTML, /role="alert"/);
});

test("Hinweise: falsche Menge und unbekannte Größe nennen die Stelle", () => {
  assert.match(mount({ bench: [{ type: "beaker", ml: 300 }] }).innerHTML, /Diese Größe gibt es für das Gefäß nicht: 300/);
  assert.match(mount({ bench: [{ type: "testtube", contains: [{ reagent: "Mg ribbon", ml: 5 }] }] }).innerHTML, /Die Menge fehlt, passt nicht zum Stoff[^<]*: Mg ribbon/);
});

// ================================================================ Dateien

test("Aussehen: Farben folgen dem Thema, Wischen bleibt möglich", () => {
  const sheet = fs.readFileSync(new URL("chemlab.css", here), "utf8");
  assert.match(sheet, /var\(--color-text/);
  assert.match(sheet, /lia-variant-dark/);
  assert.match(sheet, /touch-action:\s*pan-y/);
  assert.doesNotMatch(sheet, /\d+rem\b/, "em statt rem: die Schriftgröße folgt dem Kurs");
});

test("README: jeder Beispielblock lädt, und alle Geräte und Stoffe kommen vor", () => {
  const readme = fs.readFileSync(new URL("README.md", here), "utf8");
  const blocks = [...readme.matchAll(/```+ *json +@ChemLab\.sim\n([\s\S]*?)\n```+/g)].map((m) => m[1]);
  assert.ok(blocks.length >= 14, `${blocks.length} Beispiele`);
  // was die Folien mit @[ChemLab.pack] und @ChemLab.data eintragen
  for (const m of readme.matchAll(/^@\[ChemLab\.pack\]\((.*?)\)$/gm)) L.register(JSON.parse(fs.readFileSync(new URL(m[1], here), "utf8")));
  for (const m of readme.matchAll(/```+ *json +@ChemLab\.data\n([\s\S]*?)\n```+/g)) L.register(JSON.parse(m[1]));
  const types = new Set(), reagents = new Set();
  for (const block of blocks) {
    const config = L.normalize(block);
    const l = L.createLab(config);
    L.step(l, 2);
    assert.equal(l.failed || 0, 0, block);
    config.bench.forEach((p) => { types.add(p.type); (p.contains || []).forEach((c) => reagents.add(c.reagent.split(" ")[0])); });
    (config.shelf || []).forEach((id) => (L.parts[id] ? types : reagents).add(id.split(" ")[0]));
  }
  for (const type of Object.keys(L.parts)) assert.ok(types.has(type), type);
  for (const id of Object.keys(L.core.reagents)) assert.ok(reagents.has(id.split(" ")[0]), id);
  for (const id of Object.keys(L.core.reagents)) assert.ok(readme.includes("`" + id), `${id} steht in der Tabelle der Stoffe`);
  assert.match(readme, /^version:\s+0\.\d+\.\d+$/m, "Version unter 1.0.0");
  for (const file of ["chemlab-engine.js", "chemlab-data.js", "chemlab-parts.js", "chemlab-fx.js", "chemlab-ui.js", "chemlab.css"]) assert.ok(readme.includes("./" + file), file);
});

test("Ohne Build-Schritt: der Ordner enthält genau die Dateien des Bausteins", () => {
  const files = fs.readdirSync(here).filter((name) => !name.startsWith(".")).sort();
  assert.deepEqual(files, ["README.md", "check.mjs", "chemlab-data.js", "chemlab-engine.js", "chemlab-fx.js", "chemlab-parts.js", "chemlab-ui.js", "chemlab.css", "packs", "tools"]);
  assert.deepEqual(fs.readdirSync(new URL("packs/", here)).sort(), ["organic.json"], "Erweiterungspakete");
  assert.deepEqual(fs.readdirSync(new URL("tools/", here)).sort(), ["import.mjs"], "Werkzeuge");
});

// ================================================================ Befunde der Durchsicht

test("Feststoff in mehreren Stücken: es entsteht nichts aus dem Nichts", () => {
  const l = beaker([{ reagent: "HCl 1M", ml: 80 }]);
  const before = totals(l);
  L.add(l, "b", "Mg ribbon", { g: 0.0104 });
  L.step(l, 25);                                   // das erste Stück ist schon halb gelöst, wenn das zweite kommt
  L.add(l, "b", "Mg ribbon", { g: 0.208 });
  L.step(l, 1800);
  const mg = (0.0104 + 0.208) / 24.305;
  near(amount(l, "Mg(s)"), 0, 1e-12, "alles gelöst");
  near(amount(l, "Mg^2+(aq)"), mg, mg * 1e-6, "so viele Ionen, wie Band hineinkam");
  near(totals(l).mass, before.mass + 0.2184, 1e-7, "Masse");
});

test("Ruhe: auch mit Magnesium im Überschuss kommt der Versuch zum Stehen", () => {
  const l = lab([{ type: "testtube", id: "b", contains: [{ reagent: "HCl 1M", ml: 8 }] }]);
  L.add(l, "b", "Mg ribbon", { g: 0.052 });
  L.add(l, "b", "Mg ribbon", { g: 0.052 });
  L.step(l, 6 * 3600);
  assert.ok(amount(l, "Mg(s)") > 1e-4, "es ist Magnesium übrig");
  assert.equal(L.atRest(l), true);
});

test("Gleichgewicht: beim Abkühlen stellt es sich nach", () => {
  const l = beaker([{ reagent: "HCl 1M", ml: 40 }]);
  L.add(l, "b", "NaOH 1M", { ml: 50 });
  L.step(l, 6);
  const warm = look(l);
  L.step(l, 4 * 3600);
  const cold = look(l);
  assert.ok(warm.T > 24 && cold.T < 20.1, `${warm.T} °C, dann ${cold.T} °C`);
  near(cold.pH - warm.pH, 0.033 * (warm.T - cold.T), 0.03, "pKw steigt beim Abkühlen um etwa 0,033 je Grad");
});

test("Diagramm: auch ein Gefäß aus dem Regal bekommt seine Stoffmengen", () => {
  const run = L.createRun(L.normalize({}));
  let id;
  L.act(run, (l) => { id = L.place(l, { type: "testtube" }); });
  L.act(run, (l) => L.add(l, id, "HCl 1M", { ml: 8 }));
  L.advance(run, 4);
  L.act(run, (l) => L.add(l, id, "Mg ribbon", { g: 0.052 }));
  L.advance(run, 30);
  const ids = L.changed(run, id);
  for (const s of ["H+(aq)", "H2(g)", "Mg(s)", "Mg^2+(aq)"]) assert.ok(ids.includes(s), `${s} fehlt in ${ids}`);
  assert.deepEqual(L.series(run, { vessel: id, species: "H2(g)" })[0], [0, 0]);
});

test("Geräte: ein Name wird in einem Versuch nicht zweimal vergeben", () => {
  const l = lab([{ type: "testtube" }, { type: "thermometer", in: "testtube1" }]);
  L.remove(l, "testtube1");
  assert.equal(L.place(l, { type: "testtube" }), "testtube2");
  L.remove(l, "thermometer1");
  assert.equal(L.place(l, { type: "thermometer" }), "thermometer2");
  const run = L.createRun(L.normalize({ bench: [{ type: "beaker" }] }));
  L.act(run, (x) => L.remove(x, "beaker1"));
  L.advance(run, 1);
  let id;
  L.act(run, (x) => { id = L.place(x, { type: "beaker" }); });
  assert.equal(id, "beaker2", "auch über die Aufzeichnung hinweg");
});

test("Eigene Daten: nichts Vorhandenes wird stillschweigend überschrieben", () => {
  const water = L.species("H2O(l)").rho, count = L.db.reactions.length;
  assert.throws(() => L.register({ species: { "H2O(l)": { name: { de: "Wasser" }, Hf: -285.83, src: "x" } } }),
    (e) => e.code === "data" && /H2O\(l\)/.test(e.detail), "anderer Eintrag für Wasser");
  assert.equal(L.species("H2O(l)").rho, water);
  assert.throws(() => L.register({ reactions: [{ eq: "Mg(s) + 2 H+(aq) → Mg^2+(aq) + H2(g)", rate: { k: 1e-3 }, src: "x" }] }),
    (e) => e.code === "data", "dieselbe Reaktion, nur anders geschrieben");
  assert.equal(L.db.reactions.length, count);
  assert.throws(() => L.register({ reagents: { HCl: { name: { de: "x" }, solution: { "H+(aq)": 2, "Cl-(aq)": 2 } } } }), (e) => e.code === "data");
  L.register(L.core);
  assert.equal(L.db.reactions.length, count, "dasselbe Paket noch einmal ist erlaubt und ändert nichts");
});

test("Eigene Daten: abgeleitete Angaben lassen sich nicht überschreiben", () => {
  L.register({ species: { "Xe(g)": { name: { de: "Xenon" }, Hf: 0, M: 1, charge: 3, phase: "aq", src: "Test" } } });
  near(L.species("Xe(g)").M, 131.29, 0.01);
  assert.equal(L.species("Xe(g)").charge, 0);
  assert.equal(L.species("Xe(g)").phase, "g");
});

test("Eigene Daten: scheitert der Aufbau, bleibt auch von seinen Daten nichts zurück", () => {
  const data = { species: { "Kr(g)": { name: { de: "Krypton" }, Hf: 0, src: "Test" } } };
  assert.throws(() => L.normalize({ data, bench: [{ type: "kettle" }] }), (e) => e.code === "part");
  assert.throws(() => L.species("Kr(g)"), (e) => e.code === "species");
  L.normalize({ data, bench: [] });
  assert.equal(L.species("Kr(g)").phase, "g");
});

test("Eingabe: falsche Einheit, zu viel Inhalt und unbekannte Größe werden gemeldet", () => {
  const tubeWith = (c) => () => L.normalize({ bench: [{ type: "testtube", id: "rg", contains: [c] }] });
  assert.throws(tubeWith({ reagent: "Mg ribbon", ml: 5 }), (e) => e.code === "amount" && /Mg ribbon/.test(e.detail));
  assert.throws(tubeWith({ reagent: "HCl 1M", g: 1 }), (e) => e.code === "amount");
  assert.throws(tubeWith({ reagent: "HCl 1M" }), (e) => e.code === "amount");
  assert.throws(tubeWith({ reagent: "HCl 1M", ml: 500 }), (e) => e.code === "amount" && /rg/.test(e.detail));
  assert.throws(() => L.normalize({ bench: [{ type: "beaker", ml: 300 }] }), (e) => e.code === "size" && /300/.test(e.detail));
  assert.equal(L.normalize({ bench: [{ type: "testtube", contains: [{ reagent: "BTB", drops: 2 }, { reagent: "Mg ribbon", g: 0.01 }] }] }).bench[0].contains.length, 2);
  assert.equal(L.text("err.amount", "de").length > 10 && L.text("err.size", "de").length > 10, true);
});

// ================================================================ Meilenstein 2: Gleichgewichte, Fällungen, Titration

const tubeOf = (contains, more) => lab([{ type: "testtube", id: "b", contains }], Object.assign({ room: 25 }, more));
const settleDown = (l, seconds) => L.step(l, seconds || 30);
const solid = (l, id, vessel) => amount(l, id, vessel);

test("Reaktionswärme: nach Hess, wo die Bildungsenthalpien bekannt sind, sonst aus dem Eintrag", () => {
  near(L.heatOf("AgCl(s) <=> Ag+(aq) + Cl-(aq)"), 65.72, 0.05, "Silberchlorid, nach Hess aus CODATA");
  near(L.heatOf("CH3COOH(aq) <=> H+(aq) + CH3COO-(aq)"), -0.41, 0.01, "Essigsäure, aus dem Eintrag");
  near(L.heatOf("BaSO4(s) <=> Ba^2+(aq) + SO4^2-(aq)"), 23, 0.01, "Bariumsulfat, aus dem Eintrag");
  near(L.heatOf("H+(aq) + OH-(aq) -> H2O(l)"), -55.8, 0.1, "nicht eingetragen: nach Hess");
});

test("Reaktionswärme: Teilchen ohne Bildungsenthalpie erzeugen keine Scheinwärme", () => {
  const l = tubeOf([{ reagent: "BaCl2 0.1M", ml: 5 }]);
  L.add(l, "b", "Na2SO4 0.1M", { ml: 5 });
  L.step(l, 10);
  assert.ok(solid(l, "BaSO4(s)") > 4.9e-4, "Bariumsulfat ist ausgefallen");
  const rise = look(l).T - 25;
  assert.ok(rise > 0 && rise < 0.5, `die Fällung wärmt nur wenig: ${rise} K`);
});

test("Schwache Säure, schwache Base, Puffer, Schwefelsäure", () => {
  near(look(tubeOf([{ reagent: "CH3COOH 0.1M", ml: 10 }])).pH, 2.88, 0.02, "Essigsäure 0,1 mol/L");
  near(look(tubeOf([{ reagent: "NH3 0.1M", ml: 10 }])).pH, 11.12, 0.02, "Ammoniak 0,1 mol/L");
  near(look(tubeOf([{ reagent: "H2SO4 0.05M", ml: 10 }])).pH, 1.24, 0.03, "Schwefelsäure 0,05 mol/L");
  const buffer = tubeOf([{ reagent: "CH3COOH 0.1M", ml: 5 }, { reagent: "CH3COONa 0.1M", ml: 5 }]);
  near(look(buffer).pH, 4.76, 0.02, "Acetatpuffer 1:1");
  L.add(buffer, "b", "HCl 0.1M", { ml: 0.5 });
  L.step(buffer, 3);
  assert.ok(look(buffer).pH > 4.55, `der Puffer hält: pH ${look(buffer).pH}`);
  const water = tubeOf([{ reagent: "H2O", ml: 10 }]);
  L.add(water, "b", "HCl 0.1M", { ml: 0.5 });
  L.step(water, 3);
  assert.ok(look(water).pH < 2.5, "Wasser hält nicht");
});

test("pH-Meter: zeigt den pH-Wert seines Gefäßes, mit kurzer Verzögerung, und nichts ohne Flüssigkeit", () => {
  const l = lab([
    { type: "beaker", id: "b", contains: [{ reagent: "HCl 0.01M", ml: 50 }] },
    { type: "beaker", id: "leer" },
    { type: "phmeter", id: "ph", in: "b" },
    { type: "phmeter", id: "trocken", in: "leer" }
  ], { room: 25 });
  near(L.reading(l, "ph").value, 2.0, 0.01, "am Anfang");
  assert.equal(L.reading(l, "ph").unit, "pH");
  assert.equal(L.reading(l, "trocken").value, null);
  L.add(l, "b", "NaOH 0.1M", { ml: 10 });
  L.step(l, 3.6);
  assert.ok(L.reading(l, "ph").value < look(l).pH - 0.05, "hinkt kurz nach");
  L.step(l, 15);
  near(L.reading(l, "ph").value, look(l).pH, 0.01, "holt auf");
  assert.equal(L.atRest(l), false, "die Lösung ist noch warm");
});

const titration = (acid, more) => lab([
  { type: "beaker", id: "b", ml: 250, contains: [{ reagent: acid, ml: 20 }].concat(more || []) },
  { type: "phmeter", id: "ph", in: "b" },
  { type: "burette", id: "bu", over: "b", contains: [{ reagent: "NaOH 0.1M", ml: 50 }] }
], { room: 25 });
// lässt aus der Bürette ml zulaufen und wartet, bis das pH-Meter steht
const run = (l, ml) => { L.setTap(l, "bu", 2); L.step(l, ml / 2); L.setTap(l, "bu", 0); L.step(l, 12); };

test("Bürette: gibt bei offenem Hahn gleichmäßig ab und zählt mit", () => {
  const l = titration("HCl 0.1M");
  assert.equal(look(l, "bu").given, 0);
  near(look(l, "bu").ml, 50, 1e-9, "gefüllt");
  L.setTap(l, "bu", 0.05);
  L.step(l, 20);
  near(look(l, "bu").given, 1, 1e-9, "ein Tropfen je Sekunde: 1 mL in 20 s");
  near(look(l, "b").ml, 21, 0.05, "angekommen");
  L.setTap(l, "bu", 0);
  L.step(l, 5);
  near(look(l, "bu").given, 1, 1e-9, "Hahn zu");
  assert.equal(look(l, "bu").tap, 0);
  assert.equal(look(l, "bu").over, "b");
});

test("Bürette: leer ist leer, und ohne Gefäß darunter fließt nichts", () => {
  const l = lab([
    { type: "beaker", id: "b", ml: 250 },
    { type: "burette", id: "bu", over: "b", contains: [{ reagent: "H2O", ml: 3 }] },
    { type: "burette", id: "frei", contains: [{ reagent: "H2O", ml: 3 }] }
  ]);
  L.setTap(l, "bu", 2);
  L.setTap(l, "frei", 2);
  L.step(l, 10);
  near(look(l, "bu").given, 3, 1e-6);
  near(look(l, "b").ml, 3, 1e-6);
  assert.ok(look(l, "bu").ml < 1e-6, "die Bürette ist leer");
  assert.equal(look(l, "frei").given, 0);
  L.remove(l, "b");
  assert.equal(look(l, "bu").over, null);
  assert.throws(() => L.normalize({ bench: [{ type: "burette", over: "x" }] }), (e) => e.code === "place");
  assert.throws(() => L.normalize({ bench: [{ type: "burette", id: "a" }, { type: "burette", over: "a" }] }), (e) => e.code === "place", "nicht über einer Bürette");
});

test("Titration einer starken Säure: pH vor, am und nach dem Äquivalenzpunkt", () => {
  const l = titration("HCl 0.1M");
  near(look(l, "b").pH, 1.0, 0.01, "Start");
  run(l, 10);
  near(L.reading(l, "ph").value, 1.48, 0.02, "nach 10 mL");
  run(l, 10);
  near(L.reading(l, "ph").value, 7.0, 0.3, "nach 20 mL");
  run(l, 5);
  near(L.reading(l, "ph").value, 12.05, 0.03, "nach 25 mL");
  near(look(l, "bu").given, 25, 1e-6, "abgelesen");
});

test("Titration einer schwachen Säure: Halbäquivalenzpunkt beim pKs, Äquivalenzpunkt im Basischen, Phenolphthalein schlägt um", () => {
  const plain = titration("CH3COOH 0.1M");
  near(look(plain, "b").pH, 2.88, 0.02, "Start");
  run(plain, 10);
  near(L.reading(plain, "ph").value, 4.76, 0.03, "nach 10 mL: pH = pKs");
  run(plain, 10);
  near(L.reading(plain, "ph").value, 8.73, 0.04, "nach 20 mL");
  // mit Indikator: farblos bis zum Äquivalenzpunkt, ein Milliliter darüber rosa
  const l = titration("CH3COOH 0.1M", [{ reagent: "PP", drops: 3 }]);
  assert.equal(look(l, "b").color.name, "colorless");
  run(l, 10);
  assert.equal(look(l, "b").color.name, "colorless");
  run(l, 9);
  assert.equal(look(l, "b").color.name, "colorless", "kurz vor dem Äquivalenzpunkt noch farblos");
  run(l, 2);
  assert.ok(["pink", "red", "violet"].includes(look(l, "b").color.name), `Phenolphthalein: ${look(l, "b").color.name}`);
});

test("Titrationskurve: pH gegen zugegebenes Volumen aus der Aufzeichnung", () => {
  const r = L.createRun(L.normalize({ room: 25, bench: [
    { type: "beaker", id: "b", ml: 250, contains: [{ reagent: "HCl 0.1M", ml: 20 }] },
    { type: "phmeter", id: "ph", in: "b" },
    { type: "burette", id: "bu", over: "b", contains: [{ reagent: "NaOH 0.1M", ml: 50 }] }] }));
  L.act(r, (l) => L.setTap(l, "bu", 0.5));
  L.advance(r, 60);
  const curve = L.curve(r, { burette: "bu", tool: "ph" });
  assert.ok(curve.length > 50 && curve.length <= 400, `${curve.length} Punkte`);
  assert.equal(curve[0][0], 0);
  near(curve[0][1], 1, 1e-9, "Start bei pH 1");
  near(curve[curve.length - 1][0], 30, 0.01, "30 mL zugegeben");
  assert.ok(curve.every((p, i) => i === 0 || p[0] >= curve[i - 1][0]), "das Volumen wächst nur");
  const at = (ml) => curve.filter((p) => p[0] <= ml).pop()[1];
  assert.ok(at(19) < 3 && at(21.5) > 10.5, `Sprung um den Äquivalenzpunkt: ${at(19)} → ${at(21.5)}`);
  near(L.series(r, { tool: "ph" }).pop()[1], at(30), 0.01, "dieselben Werte wie die Messreihe über der Zeit");
});

test("Fällung: Silberchlorid fällt aus, bis das Löslichkeitsprodukt erreicht ist", () => {
  const l = tubeOf([{ reagent: "AgNO3 0.1M", ml: 5 }]);
  const before = totals(l), seen = [];
  L.add(l, "b", "NaCl 0.1M", { ml: 5 });
  L.step(l, 0.6, (e) => seen.push(e));
  const early = solid(l, "AgCl(s)");
  assert.ok(early > 1e-6 && early < 2.5e-4, `nach 0,6 s erst ein Teil: ${early} mol`);
  L.step(l, 12, (e) => seen.push(e));
  near(solid(l, "AgCl(s)"), 5e-4, 1e-6, "fast alles Silber ist gefällt");
  near(amount(l, "Ag+(aq)") / L.volume(L.vessel(l, "b")), Math.sqrt(Math.pow(10, -9.75)), 3e-6, "c(Ag+) = Wurzel aus dem Löslichkeitsprodukt");
  const after = totals(l);
  near(after.mass, before.mass + 5 * 0.997 + 5e-4 * 58.44, 2e-3, "Masse");
  near(after.charge, 0, 1e-9, "Ladung");
  const first = seen.find((e) => e.key === "solid");
  assert.ok(first && first.species === "AgCl(s)" && first.color === "white", JSON.stringify(first));
  assert.equal(L.reactions(l, "b")[0].eq, "Ag+(aq) + Cl-(aq) -> AgCl(s)");
  near(L.reactions(l, "b")[0].dH, -65.72, 0.05);
});

test("Fällung: erst trüb, dann setzt sich der Niederschlag ab", () => {
  const l = tubeOf([{ reagent: "AgNO3 0.1M", ml: 5 }]);
  L.add(l, "b", "NaCl 0.1M", { ml: 5 });
  L.step(l, 4);
  const fresh = look(l);
  assert.ok(fresh.cloud.alpha > 0.6, `trüb: ${fresh.cloud.alpha}`);
  assert.equal(L.atRest(l), false);
  L.step(l, 300);
  const late = look(l);
  assert.ok(late.cloud.alpha < 0.05, `klar: ${late.cloud.alpha}`);
  assert.ok(late.sediment.ml > 0.05, `Bodensatz: ${late.sediment.ml} mL`);
  assert.deepEqual(late.sediment.rgb.map((c) => c > 230), [true, true, true], "weiß");
  L.step(l, 3600);
  assert.equal(L.atRest(l), true, "abgesetzt und abgekühlt");
});

test("Ionennachweis mit Ammoniak: Silberchlorid löst sich, Silberiodid nicht", () => {
  const halide = (salt) => {
    const l = lab([{ type: "beaker", id: "b", contains: [{ reagent: "AgNO3 0.1M", ml: 5 }, { reagent: salt, ml: 5 }] }], { room: 25 });
    return l;
  };
  const chloride = halide("NaCl 0.1M"), iodide = halide("KI 0.1M");
  near(solid(chloride, "AgCl(s)"), 5e-4, 1e-6, "liegt als Niederschlag vor");
  near(solid(iodide, "AgI(s)"), 5e-4, 1e-6);
  const seen = [];
  L.add(chloride, "b", "NH3 2M", { ml: 10 });
  L.add(iodide, "b", "NH3 2M", { ml: 10 });
  L.step(chloride, 60, (e) => seen.push(e));
  L.step(iodide, 60);
  near(solid(chloride, "AgCl(s)"), 0, 1e-9, "Silberchlorid ist gelöst");
  assert.ok(amount(chloride, "Ag(NH3)2+(aq)") > 4.9e-4, "als Diamminsilber-Komplex");
  assert.ok(seen.some((e) => e.key === "dissolved" && e.species === "AgCl(s)"));
  assert.ok(solid(iodide, "AgI(s)") > 4.9e-4, "Silberiodid bleibt");
});

test("Hydroxide: fallen mit Lauge aus und lösen sich in Säure", () => {
  const l = tubeOf([{ reagent: "CuSO4 0.1M", ml: 5 }]);
  assert.equal(look(l).color.name, "blue");
  const seen = [];
  L.add(l, "b", "NaOH 0.1M", { ml: 10 });
  L.step(l, 20, (e) => seen.push(e));
  near(solid(l, "Cu(OH)2(s)"), 5e-4, 5e-6, "Kupferhydroxid");
  assert.equal(seen.find((e) => e.key === "solid").color, "blue");
  L.add(l, "b", "HCl 1M", { ml: 2 });
  L.step(l, 30);
  near(solid(l, "Cu(OH)2(s)"), 0, 1e-9, "in Säure wieder gelöst");
  near(amount(l, "Cu^2+(aq)") + amount(l, "CuSO4(aq)") + amount(l, "CuOH+(aq)"), 5e-4, 1e-6, "alles Kupfer ist wieder gelöst, frei oder als Ionenpaar mit Sulfat");
  const iron = tubeOf([{ reagent: "FeCl3 0.1M", ml: 5 }]);
  const brown = [];
  L.add(iron, "b", "NaOH 1M", { ml: 2 });
  L.step(iron, 20, (e) => brown.push(e));
  near(solid(iron, "Fe(OH)3(s)"), 5e-4, 5e-6, "Eisen(III)-hydroxid");
  assert.ok(["brown", "orange", "red"].includes(brown.find((e) => e.key === "solid").color));
});

test("Kupfer und Ammoniak: erst Niederschlag, im Überschuss tiefblaue Lösung", () => {
  const l = lab([{ type: "beaker", id: "b", contains: [{ reagent: "CuSO4 0.1M", ml: 10 }] }], { room: 25 });
  const pale = look(l).color.rgb;
  L.add(l, "b", "NH3 1M", { ml: 1 });
  L.step(l, 20);
  assert.ok(solid(l, "Cu(OH)2(s)") > 1e-4, `mit wenig Ammoniak fällt Hydroxid: ${solid(l, "Cu(OH)2(s)")} mol`);
  // Ideal gerechnet braucht es dafür kräftigen Überschuss: verdünntes Ammoniak löst den Niederschlag nur zum Teil.
  L.add(l, "b", "NH3 5M", { ml: 20 });
  L.step(l, 60);
  near(solid(l, "Cu(OH)2(s)"), 0, 1e-9, "im Überschuss gelöst");
  assert.ok(amount(l, "Cu(NH3)4^2+(aq)") > 6e-4, "überwiegend als Tetraammin-Komplex");
  const deep = look(l).color;
  assert.ok(["blue", "violet"].includes(deep.name), deep.name);
  assert.ok(deep.rgb[0] < pale[0] - 60, `kräftiger als die Kupfersulfat-Lösung: ${pale} → ${deep.rgb}`);
});

test("Eisen(III) und Thiocyanat: blutrote Lösung, kein Niederschlag", () => {
  const l = tubeOf([{ reagent: "FeCl3 0.1M", ml: 5 }]);
  L.add(l, "b", "KSCN 0.1M", { ml: 5 });
  L.step(l, 5);
  assert.ok(amount(l, "FeSCN^2+(aq)") > 5e-6);
  assert.ok(["red", "orange"].includes(look(l).color.name), look(l).color.name);
  assert.equal(L.vessel(l, "b").lumps.length, 0);
});

test("Weitere Fällungen: Bariumsulfat weiß, Silberoxid braun, Silberbromid und -iodid gelblich", () => {
  const first = (a, b, more) => {
    const l = tubeOf([{ reagent: a, ml: 5 }]), seen = [];
    L.add(l, "b", b, { ml: more || 5 });
    L.step(l, 15, (e) => seen.push(e));
    return seen.find((e) => e.key === "solid") || {};
  };
  assert.deepEqual([first("BaCl2 0.1M", "Na2SO4 0.1M").species, first("BaCl2 0.1M", "Na2SO4 0.1M").color], ["BaSO4(s)", "white"]);
  assert.deepEqual([first("AgNO3 0.1M", "NaOH 0.1M").species, first("AgNO3 0.1M", "NaOH 0.1M").color], ["Ag2O(s)", "brown"]);
  assert.equal(first("AgNO3 0.1M", "KBr 0.1M").species, "AgBr(s)");
  assert.equal(first("AgNO3 0.1M", "KI 0.1M").color, "yellow");
  assert.equal(first("AgNO3 0.1M", "KSCN 0.1M").species, "AgSCN(s)");
  assert.equal(first("NaCl 0.1M", "Na2SO4 0.1M").species, undefined, "was löslich ist, bleibt gelöst");
});

test("Umgießen: was noch schwebt, wandert mit, der Bodensatz bleibt", () => {
  const fresh = lab([{ type: "beaker", id: "a", contains: [{ reagent: "AgNO3 0.1M", ml: 20 }] }, { type: "beaker", id: "b" }], { room: 25 });
  L.add(fresh, "a", "NaCl 0.1M", { ml: 20 });
  L.step(fresh, 6);
  L.pour(fresh, "a", "b", 20);
  L.step(fresh, 6);
  assert.ok(solid(fresh, "AgCl(s)", "b") > 5e-4, `mit der trüben Flüssigkeit: ${solid(fresh, "AgCl(s)", "b")} mol`);
  const old = lab([{ type: "beaker", id: "a", contains: [{ reagent: "AgNO3 0.1M", ml: 20 }, { reagent: "NaCl 0.1M", ml: 20 }] }, { type: "beaker", id: "b" }], { room: 25 });
  near(solid(old, "AgCl(s)", "a"), 2e-3, 1e-5, "vorbereitete Mischung: schon gefällt und abgesetzt");
  L.pour(old, "a", "b", 20);
  L.step(old, 6);
  assert.ok(solid(old, "AgCl(s)", "b") < 1e-6, "abgesetzt bleibt er zurück");
});

test("Universalindikator: von Rot über Gelb und Grün nach Blau und Violett", () => {
  const color = (contains) => look(tubeOf(contains.concat([{ reagent: "UI", drops: 3 }]))).color.name;
  assert.equal(color([{ reagent: "HCl 0.1M", ml: 5 }]), "red");
  assert.equal(color([{ reagent: "CH3COOH 0.1M", ml: 2.5 }, { reagent: "CH3COONa 0.1M", ml: 2.5 }]), "orange");
  assert.ok(["blue", "cyan"].includes(color([{ reagent: "NH3 0.1M", ml: 2.5 }, { reagent: "NH4Cl 0.1M", ml: 2.5 }])), "Ammoniakpuffer");
  assert.equal(color([{ reagent: "NaOH 0.1M", ml: 5 }]), "violet");
  const mo = (r) => look(tubeOf([{ reagent: r, ml: 5 }, { reagent: "MO", drops: 2 }])).color.name;
  assert.equal(mo("HCl 0.1M"), "red", "Methylorange in Säure");
  assert.ok(["yellow", "orange"].includes(mo("NaOH 0.1M")), "Methylorange in Lauge");
  const pure = (r) => look(tubeOf([{ reagent: "H2O", ml: 5 }, { reagent: r, drops: 3 }])).color.name;
  assert.equal(pure("UI"), "green", "in reinem Wasser grün");
});

test("Aufzeichnung: auch Niederschlag und Bürette kommen beim Zurückspulen wieder", () => {
  const r = L.createRun(L.normalize({ room: 25, bench: [
    { type: "beaker", id: "b", contains: [{ reagent: "AgNO3 0.1M", ml: 10 }] },
    { type: "burette", id: "bu", over: "b", contains: [{ reagent: "NaCl 0.1M", ml: 20 }] }] }));
  L.act(r, (l) => L.setTap(l, "bu", 0.5));
  L.advance(r, 10);
  const at10 = JSON.stringify(r.lab.vessels);
  L.advance(r, 20);
  L.seek(r, 10);
  assert.equal(JSON.stringify(r.lab.vessels), at10);
  near(look(r.lab, "bu").given, 5, 1e-9);
  assert.ok(solid(r.lab, "AgCl(s)") > 3e-4);
});

test("Daten: das Grundpaket bleibt vollständig, und was geschätzt ist, steht dabei", () => {
  assert.deepEqual(L.lint(L.core), []);
  const guessed = Object.entries(L.core.species).filter(([, d]) => d.bands).filter(([, d]) => !/geschätzt/.test(d.src));
  assert.deepEqual(guessed.map(([id]) => id), [], "Absorptionsbanden sind als geschätzt gekennzeichnet");
  assert.ok(Object.keys(L.core.reagents).length >= 20);
});

// ================================================================ Meilenstein 2: Zeichnung, Texte, Oberfläche

test("Zeichnung: Trübung und Bodensatz eines Niederschlags", () => {
  const l = tubeOf([{ reagent: "AgNO3 0.1M", ml: 5 }]);
  L.add(l, "b", "NaCl 0.1M", { ml: 5 });
  L.step(l, 4);
  const fresh = L.parts.testtube.draw(look(l), ctx());
  clean(fresh, "trüb");
  assert.ok(+/class="cl-cloud"[^>]*fill-opacity="([\d.]+)"/.exec(fresh)[1] > 0.6, "die Flüssigkeit ist milchig");
  L.step(l, 400);
  const late = L.parts.testtube.draw(look(l), ctx());
  clean(late, "abgesetzt");
  assert.doesNotMatch(late, /cl-cloud/, "wieder klar");
  assert.match(late, /class="cl-sediment"[^>]*fill="rgb\(2\d\d,2\d\d,2\d\d\)"/, "weißer Bodensatz");
  const big = lab([{ type: "beaker", id: "b", contains: [{ reagent: "CuSO4 0.1M", ml: 20 }, { reagent: "NaOH 0.1M", ml: 40 }] }]);
  assert.match(L.parts.beaker.draw(look(big), ctx()), /class="cl-sediment"/, "auch im Becherglas");
});

test("Zeichnung: Bürette mit Hahn, Tropfen und Strahl", () => {
  const l = titration("HCl 0.1M");
  const mountOf = () => L.parts.beaker.mount(look(l, "b"));
  const draw = (more) => L.parts.burette.draw(look(l, "bu"), ctx(more), mountOf());
  clean(draw(), "Bürette");
  clean(draw({ numbers: false }), "Bürette ohne Zahlen");
  clean(L.parts.burette.draw(look(l, "bu"), ctx(), null), "Bürette ohne Gefäß darunter");
  assert.doesNotMatch(draw(), /cl-stream|cl-drop/, "Hahn zu");
  assert.match(draw(), />50</, "Skala");
  assert.doesNotMatch(draw({ numbers: false }), />50</);
  const full = L.parts.burette.surface(look(l, "bu"), mountOf());
  L.setTap(l, "bu", 0.05);
  L.step(l, 1);
  assert.match(draw(), /cl-drop/, "Tropfen");
  L.setTap(l, "bu", 2);
  L.step(l, 5);
  assert.match(draw(), /cl-stream/, "Strahl");
  assert.ok(L.parts.burette.surface(look(l, "bu"), mountOf()) > full + 30, "der Spiegel sinkt");
  assert.ok(L.parts.burette.reach(mountOf()) > 350, "sie braucht Platz nach oben");
  const b = L.parts.burette.bounds(L.vessel(l, "bu"), mountOf());
  assert.ok(b.bottom <= mountOf().rim, "antippbar ist sie über dem Rand des Becherglases");
});

test("Zeichnung: pH-Meter neben dem Thermometer", () => {
  const l = titration("HCl 0.1M");
  const v = L.vessel(l, "b"), place = L.parts.beaker.probe(v, "phmeter");
  assert.notEqual(place.x, L.parts.beaker.probe(v, "thermometer").x);
  assert.equal(L.parts.beaker.probe(v).x, L.parts.beaker.probe(v, "thermometer").x);
  const meter = L.parts.phmeter.draw(L.reading(l, "ph"), ctx(), place);
  clean(meter, "pH-Meter");
  assert.match(meter, /pH 1,00/);
  assert.doesNotMatch(L.parts.phmeter.draw(L.reading(l, "ph"), ctx({ numbers: false }), place), /1,00/);
  assert.match(L.parts.phmeter.draw({ value: null, unit: "pH" }, ctx(), place), /pH –/, "ohne Flüssigkeit");
  clean(L.parts.phmeter.draw({ value: 7, unit: "pH" }, ctx(), null), "frei stehend");
  clean(L.parts.phmeter.draw(L.reading(l, "ph"), ctx(), L.parts.testtube.probe(null, "phmeter")), "im Reagenzglas");
  for (const id of ["burette", "phmeter"]) clean(L.icon(id), id);
  // Anzeigen stehen nebeneinander, nicht übereinander: im Becherglas das Thermometer links, das pH-Meter in der Mitte, die Bürette rechts
  const span = (svg, cls) => { const m = new RegExp('<g class="' + cls + '"><rect x="(-?[\\d.]+)" y="(-?[\\d.]+)" width="([\\d.]+)" height="([\\d.]+)"').exec(svg).slice(1).map(Number); return { x0: m[0], x1: m[0] + m[2], y0: m[1], y1: m[1] + m[3] }; };
  const apart = (a, b) => a.x1 <= b.x0 || b.x1 <= a.x0 || a.y1 <= b.y0 || b.y1 <= a.y0;
  for (const host of [v, null]) {
    const type = host ? "beaker" : "testtube";
    const tag = span(L.parts.thermometer.draw({ value: 20, unit: "°C" }, ctx(), L.parts[type].probe(host, "thermometer")), "cl-tag");
    const box = span(L.parts.phmeter.draw({ value: 7, unit: "pH" }, ctx(), L.parts[type].probe(host, "phmeter")), "cl-meter");
    assert.ok(apart(tag, box), `${type}: Anzeige des Thermometers ${JSON.stringify(tag)} und des pH-Meters ${JSON.stringify(box)}`);
    if (host) {
      const hang = L.parts.beaker.mount(look(l, "b")), tube = L.parts.burette.bounds(L.vessel(l, "bu"), hang);
      assert.ok(box.x1 <= tube.x0 + 4, "das pH-Meter verdeckt die Bürette nicht");
      assert.ok(hang.edge > 40, "der Fuß des Stativs steht neben dem Becherglas");
    }
  }
});

test("Texte: Niederschlag, Hahn und neue Geräte als Satz", () => {
  const say = (event, lang) => L.say(event, { lang: lang || "de", numbers: true, names: { b: "Reagenzglas 1", bu: "Bürette 1", ph: "pH-Meter 1" } });
  assert.equal(say({ key: "solid", vessel: "b", species: "AgCl(s)", color: "white" }), "Reagenzglas 1: Ein weißer Niederschlag fällt aus.");
  assert.equal(say({ key: "solid", vessel: "b", species: "Fe(OH)3(s)", color: "brown" }), "Reagenzglas 1: Ein brauner Niederschlag fällt aus.");
  assert.equal(say({ key: "solid", vessel: "b", species: "Cu(OH)2(s)", color: "blue" }, "en"), "Reagenzglas 1: A blue precipitate forms.");
  assert.equal(say({ key: "dissolved", vessel: "b", species: "AgCl(s)" }), "Reagenzglas 1: Der Niederschlag löst sich auf.");
  assert.equal(say({ key: "dissolved", vessel: "b", species: "AgCl(s)", color: "white" }), "Reagenzglas 1: Der weiße Niederschlag löst sich auf.");
  assert.equal(say({ key: "dissolved", vessel: "b", species: "AgCl(s)", color: "white" }, "en"), "Reagenzglas 1: The white precipitate dissolves.");
  assert.equal(say({ key: "tap", vessel: "bu", rate: 0.05 }), "Bürette 1: Hahn auf „tropfen“ gestellt");
  assert.equal(say({ key: "tap", vessel: "bu", rate: 0 }), "Bürette 1: Hahn geschlossen");
  assert.equal(say({ key: "hung", part: "bu", vessel: "b" }), "Bürette 1 über Reagenzglas 1 gehängt");
  assert.equal(say({ key: "probe", part: "ph", vessel: "b" }), "pH-Meter 1 in Reagenzglas 1 gestellt");
});

test("Titration an der Fläche: Geräte aus dem Regal, Bürette füllen, Hahn öffnen, Kurven", () => {
  const el = mount({ room: 25, bench: [{ type: "beaker", id: "b", ml: 250, contains: [{ reagent: "HCl 0.1M", ml: 20 }] }], shelf: ["NaOH 0.1M", "burette", "phmeter"] });
  const plain = +part(el, ".cl-svg").attributes.viewBox.split(" ")[3];
  press(el, "hand", "phmeter");
  tap(el, "b");
  press(el, "hand", "burette");
  assert.match(part(el, ".cl-hand").innerHTML, /über dem sie hängen soll/);
  tap(el, "b");
  const lab = () => state(el).run.lab;
  assert.deepEqual(lab().vessels.map((v) => [v.id, v.over]), [["b", null], ["burette1", "b"]]);
  assert.deepEqual(lab().tools.map((t) => [t.id, t.in]), [["phmeter1", "b"]]);
  assert.equal(item(el, "burette1").attributes["aria-label"], "Bürette 1 über Becherglas 1: leer, Hahn zu");
  assert.equal(item(el, "phmeter1").attributes["aria-label"], "pH-Meter 1 in Becherglas 1: pH 1,00");
  assert.ok(+part(el, ".cl-svg").attributes.viewBox.split(" ")[3] > plain + 100, "die Fläche wird höher");
  press(el, "hand", "burette");
  tap(el, "b");
  assert.equal(part(el, ".cl-status").textContent, "Dieses Gefäß hat schon ein solches Gerät.");
  press(el, "hand", "burette");

  press(el, "hand", "NaOH 0.1M");
  press(el, "more"); press(el, "more"); press(el, "more");
  assert.equal(inHand(el), "50 mL");
  tap(el, "burette1");
  frames(5);
  near(look(lab(), "burette1").ml, 50, 0.01, "Bürette gefüllt");
  press(el, "hand", "NaOH 0.1M");
  tap(el, "burette1");
  assert.equal(state(el).sel, "burette1");
  const panel = part(el, ".cl-panel");
  assert.match(panel.innerHTML, /data-act="tap" data-id="0\.05"/);
  press(el, "tap", "2");
  assert.equal(panel.querySelector('[data-act="tap"][data-id="2"]').attributes["aria-pressed"], "true");
  frames(6);
  press(el, "tap", "0");
  assert.equal(panel.querySelector('[data-act="tap"][data-id="2"]').attributes["aria-pressed"], "false");
  frames(1);
  const given = look(lab(), "burette1").given;
  assert.ok(given > 10 && given < 13, `rund 12 mL abgegeben: ${given}`);
  assert.match(panel.querySelector(".cl-given").textContent, /^1\d,\d mL$/);
  assert.match(item(el, "burette1").attributes["aria-label"], /^Bürette 1 über Becherglas 1: 3\d(,\d)? mL, farblos, Hahn zu, 1\d,\d mL abgegeben$/);
  const charts = part(el, ".cl-charts").innerHTML;
  assert.match(charts, /pH-Wert/);
  assert.match(charts, /Titrationskurve/);
  assert.match(charts, /Zugabe in mL/);
  assert.ok((charts.match(/<polyline/g) || []).length >= 2);
  clean(charts, "Diagramme");
  assert.match(logOf(el), /Bürette 1 über Becherglas 1 gehängt/);
  assert.match(logOf(el), /Bürette 1: Hahn geschlossen/);
  // die Bürette ist gewählt: Gleichungen und Stoffmengen gelten dem Gefäß, in das sie tropft
  assert.match(part(el, ".cl-eq").innerHTML, /H<sup>\+<\/sup><small>\(aq\)<\/small> \+ OH<sup>−<\/sup><small>\(aq\)<\/small> → H<sub>2<\/sub>O/);
  assert.match(charts, /Stoffmengen[^<]*Becherglas 1/);
});

test("Fällung an der Fläche: Trübung in der Zeichnung, Niederschlag im Protokoll und in den Gleichungen", () => {
  const el = mount({ room: 25, bench: [{ type: "testtube", id: "rg", contains: [{ reagent: "AgNO3 0.1M", ml: 5 }] }], shelf: ["NaCl 0.1M"] });
  press(el, "hand", "NaCl 0.1M");
  tap(el, "rg");
  frames(5);
  assert.match(item(el, "rg").innerHTML, /cl-cloud/);
  assert.match(logOf(el), /Reagenzglas 1: Ein weißer Niederschlag fällt aus\./);
  assert.match(part(el, ".cl-eq").innerHTML, /Ag<sup>\+<\/sup><small>\(aq\)<\/small> \+ Cl<sup>−<\/sup><small>\(aq\)<\/small> → AgCl<small>\(s\)<\/small>/);
  assert.match(item(el, "rg").attributes["aria-label"], /trüb/);
});

test("Regal: ohne Angabe nach Fächern geordnet", () => {
  const shelf = part(mount({}), ".cl-shelf").innerHTML;
  const order = ["Säuren und Laugen", "Salzlösungen", "Indikatoren", "Feststoffe", "Geräte"].map((title) => shelf.indexOf(">" + title + "<"));
  assert.ok(order.every((at, i) => at >= 0 && (i === 0 || at > order[i - 1])), `Fächer in Reihenfolge: ${order}`);
  const silver = shelf.indexOf('data-id="AgNO3 0.1M"');
  assert.ok(silver > order[1] && silver < order[2], "Salzlösungen stehen mit 0,1 mol/L im Regal");
  assert.match(shelf, /Silbernitrat-Lösung 0,1 mol\/L/);
  assert.match(shelf, /data-id="HCl"/, "Säuren und Laugen mit 1 mol/L");
  assert.doesNotMatch(part(mount(tube), ".cl-shelf").innerHTML, /cl-group/, "mit eigener Auswahl ohne Fächer");
});

test("Regal: die Flasche zeigt die Farbe ihrer Lösung", () => {
  assert.deepEqual(L.sample("HCl"), [255, 255, 255], "Salzsäure ist farblos");
  const iron = L.sample("FeCl3 0.1M"), copper = L.sample("CuSO4"), dye = L.sample("UI");
  assert.ok(iron[0] > 200 && iron[2] < 150, `Eisen(III)-chlorid ist gelb: ${iron}`);
  assert.ok(copper[2] > copper[0] + 80, `Kupfersulfat ist blau: ${copper}`);
  assert.ok(dye[1] > 80 && dye[1] > dye[0] && dye[1] > dye[2], `der Universalindikator in der Tropfflasche ist dunkelgrün, nicht schwarz: ${dye}`);
  assert.equal(L.sample("Mg ribbon"), null, "ein Feststoff hat keine Lösungsfarbe");
  assert.match(L.icon("FeCl3 0.1M"), new RegExp("fill=\"" + L.liquidColor(iron).replace(/[()]/g, "\\$&") + "\""));
});

// ================================================================ Befunde der zweiten Durchsicht

const decanted = () => {
  const l = lab([
    { type: "testtube", id: "a", contains: [{ reagent: "AgNO3 0.1M", ml: 5 }, { reagent: "NaCl 0.1M", ml: 6 }] },
    { type: "beaker", id: "b" }], { room: 25 });
  L.pour(l, "a", "b", 11);
  L.step(l, 6);
  return l;
};

test("Niederschlag wandelt sich um: aus Silberchlorid wird mit Iodid Silberiodid", () => {
  const l = tubeOf([{ reagent: "AgNO3 0.1M", ml: 5 }, { reagent: "NaCl 0.1M", ml: 5 }]);
  const seen = [];
  L.add(l, "b", "KI 0.1M", { ml: 5 });
  L.step(l, 60, (e) => seen.push(e));
  near(solid(l, "AgI(s)"), 5e-4, 1e-6, "Silberiodid");
  near(solid(l, "AgCl(s)"), 0, 1e-9, "Silberchlorid ist verschwunden");
  assert.ok(seen.some((e) => e.key === "solid" && e.species === "AgI(s)"), "im Protokoll");
  assert.deepEqual(seen.filter((e) => e.key === "dissolved").map((e) => [e.species, e.color]), [["AgCl(s)", "white"]], "welcher Niederschlag verschwindet, steht dabei");
  assert.equal(l.failed || 0, 0);
  const oxide = tubeOf([{ reagent: "AgNO3 0.1M", ml: 5 }, { reagent: "NaOH 0.1M", ml: 5 }]);
  L.add(oxide, "b", "HCl 0.1M", { ml: 8 });
  L.step(oxide, 60);
  near(solid(oxide, "Ag2O(s)"), 0, 1e-9, "Silberoxid löst sich in Salzsäure");
  near(solid(oxide, "AgCl(s)"), 5e-4, 2e-6, "und fällt als Silberchlorid wieder aus");
  assert.ok(look(oxide).pH < 2, "die übrige Säure bleibt");
});

test("Abgegossener Niederschlag: das Glas rechnet weiter, der Bodensatz löst sich in Ammoniak", () => {
  const l = decanted();
  assert.equal(look(l, "a").ml, 0, "es bleibt kein Flüssigkeitsfilm zurück");
  assert.equal(look(l, "a").pH, null);
  assert.ok(look(l, "a").sediment.ml > 0.05, "der Bodensatz liegt trocken im Glas");
  L.add(l, "a", "NH3 2M", { ml: 5 });
  L.step(l, 60);
  // 5 mL lösen höchstens 0,49 mmol (K = Ksp · β2 = 2,9·10⁻³): ein Rest bleibt, mit weiteren 5 mL löst sich alles
  const rest = solid(l, "AgCl(s)", "a");
  assert.ok(rest > 2e-6 && rest < 5e-5, `in 5 mL Ammoniak bis auf einen kleinen Rest gelöst: ${rest} mol`);
  L.add(l, "a", "NH3 2M", { ml: 5 });
  L.step(l, 60);
  near(solid(l, "AgCl(s)", "a"), 0, 1e-9, "in 10 mL Ammoniak ganz gelöst");
  assert.ok(look(l, "a").pH > 10 && look(l, "a").pH < 13, `pH ${look(l, "a").pH}`);
  assert.equal(l.failed || 0, 0);
  const water = decanted();
  L.add(water, "a", "H2O", { ml: 5 });
  L.step(water, 30);
  near(look(water, "a").pH, 7, 0.1, "in Wasser bleibt es neutral");
  assert.ok(solid(water, "AgCl(s)", "a") > 4.9e-4, "und fast alles liegt weiter am Boden");
  assert.equal(water.failed || 0, 0);
});

test("Niederschläge nebeneinander: ein fertiger blockiert den nächsten nicht", () => {
  const l = beaker([{ reagent: "FeCl3 0.1M", ml: 5 }], { room: 25 });
  L.add(l, "b", "NaOH 1M", { ml: 3 });
  L.step(l, 60);
  near(solid(l, "Fe(OH)3(s)"), 5e-4, 1e-8, "Eisen(III)-hydroxid, vollständig");
  L.add(l, "b", "CuSO4 0.1M", { ml: 5 });
  L.step(l, 60);
  near(solid(l, "Cu(OH)2(s)"), 5e-4, 5e-6, "auch Kupferhydroxid fällt");
  assert.equal(l.failed || 0, 0);
});

test("Eigene Daten: die Farbe eines Feststoffs muss als #rrggbb angegeben sein", () => {
  for (const color of ["white", "#fff"]) {
    assert.throws(() => L.register({ species: { "Ne(s)": { name: { de: "x" }, Hf: null, color, src: "Test" } } }),
      (e) => e.code === "data" && /color/.test(e.detail), color);
  }
});

test("Bürette über einem vollen Gefäß: der Hahn schließt, und der Versuch kommt zur Ruhe", () => {
  const l = lab([
    { type: "testtube", id: "b", contains: [{ reagent: "H2O", ml: 15 }] },
    { type: "burette", id: "bu", over: "b", contains: [{ reagent: "H2O", ml: 50 }] }]);
  const seen = [];
  L.setTap(l, "bu", 2);
  L.step(l, 10, (e) => seen.push(e));
  near(look(l, "bu").given, 5, 0.02, "bis das Glas voll ist");
  assert.equal(look(l, "bu").tap, 0, "der Hahn ist zu");
  assert.ok(seen.some((e) => e.key === "tapFull" && e.vessel === "bu"));
  assert.equal(L.atRest(l), true);
});

test("Kupfersulfat-Lösung bleibt klar, auch konzentriert", () => {
  // mehr als 1,4 mol/L lösen sich bei 25 °C nicht: aus einer Lösung, die mehr enthalten soll, liegen blaue Kristalle am Boden
  const over = tubeOf([{ reagent: "CuSO4 2M", ml: 5 }]);
  near((0.01 - amount(over, "CuSO4*5H2O(s)")) / L.volume(L.vessel(over, "b")), 1.4, 0.1, "Löslichkeit in mol/L");
  for (const reagent of ["CuSO4 0.1M", "CuSO4 1M"]) {
    const l = tubeOf([{ reagent, ml: 5 }]);
    assert.equal(L.vessel(l, "b").lumps.length, 0, `${reagent}: kein Niederschlag`);
    assert.ok(look(l).pH > 3 && look(l).pH < 5.5, `${reagent}: schwach sauer, pH ${look(l).pH}`);
    assert.equal(look(l).color.name, "blue", reagent);
  }
});

test("Kupfer- und Silber-Ammin-Komplexe: jede Stufe trägt ihre Wärme", () => {
  const steps = L.core.equilibria.filter((e) => /NH3\(aq\) <=> (Cu|Ag)/.test(e.eq));
  assert.equal(steps.length, 5);
  assert.ok(steps.every((e) => typeof e.dH === "number" && e.dH < 0), "alle exotherm");
  near(L.heatOf("Cu^2+(aq) + 4 NH3(aq) <=> Cu(NH3)4^2+(aq)"), -90, 0.01);
  // Kupferhydroxid in Ammoniak lösen: das gibt Wärme ab, es nimmt keine auf
  const l = lab([{ type: "beaker", id: "b", contains: [{ reagent: "CuSO4 0.1M", ml: 20 }, { reagent: "NaOH 0.1M", ml: 40 }] }], { room: 25 });
  L.add(l, "b", "NH3 5M", { ml: 30 });
  L.step(l, 8);
  assert.ok(look(l).T > 25, `wärmer als vorher: ${look(l).T} °C`);
});

test("Eingabe: ein Messgerät gehört nicht in eine Bürette, und über einem Gefäß hängt nur eine", () => {
  assert.throws(() => L.normalize({ bench: [{ type: "beaker", id: "b" }, { type: "burette", id: "u", over: "b" }, { type: "phmeter", in: "u" }] }), (e) => e.code === "place");
  assert.throws(() => L.normalize({ bench: [{ type: "beaker", id: "b" }, { type: "burette", over: "b" }, { type: "burette", over: "b" }] }), (e) => e.code === "place");
  const l = lab([{ type: "beaker", id: "b" }, { type: "burette", id: "u", over: "b" }, { type: "thermometer", id: "t" }]);
  assert.equal(L.attach(l, "t", "u"), false);
  assert.equal(L.tool(l, L.place(l, { type: "phmeter", in: "u" })).in, null, "bleibt neben der Bürette stehen");
  assert.equal(L.vessel(l, L.place(l, { type: "burette", over: "b" })).over, null, "die zweite hängt nicht mit darüber");
});

test("Titrationskurve: beginnt mit dem ersten Tropfen und für jede Probe neu", () => {
  const r = L.createRun(L.normalize({ room: 25, bench: [
    { type: "beaker", id: "b", ml: 250, contains: [{ reagent: "HCl 0.1M", ml: 20 }] },
    { type: "phmeter", id: "ph", in: "b" },
    { type: "burette", id: "bu", over: "b", contains: [{ reagent: "NaOH 0.1M", ml: 50 }] }] }));
  L.act(r, (l) => L.add(l, "b", "H2O", { ml: 20 }));              // vor der Titration ändert sich der pH-Wert schon
  L.advance(r, 10);
  L.act(r, (l) => L.setTap(l, "bu", 2));
  L.advance(r, 4);
  L.act(r, (l) => L.setTap(l, "bu", 0));
  L.advance(r, 10);
  let curve = L.curve(r, { burette: "bu", tool: "ph" });
  assert.equal(curve.filter((p) => p[0] === 0).length, 1, "ein Punkt am Anfang, kein senkrechter Strich");
  near(curve[0][1], 1.30, 0.02, "der pH-Wert der verdünnten Säure, wie er beim Öffnen stand");
  assert.equal(curve.filter((p) => Math.abs(p[0] - 8) < 1e-6).length, 1, "auch beim Warten mit geschlossenem Hahn nur ein Punkt");
  L.act(r, (l) => L.empty(l, "b"));
  L.act(r, (l) => L.add(l, "b", "HCl 0.1M", { ml: 20 }));
  L.advance(r, 6);
  L.act(r, (l) => L.setTap(l, "bu", 2));
  L.advance(r, 2);
  curve = L.curve(r, { burette: "bu", tool: "ph" });
  assert.equal(curve[0][0], 0, "die neue Probe beginnt wieder bei null");
  near(curve[curve.length - 1][0], 4, 0.01);
  assert.ok(curve.every((p, i) => i === 0 || p[0] > curve[i - 1][0]), "das Volumen steigt streng");
});

test("Protokoll: „löst sich auf“ steht da, sobald man es sieht, und nicht für Spuren", () => {
  const l = tubeOf([{ reagent: "AgNO3 0.1M", ml: 5 }, { reagent: "NaCl 0.1M", ml: 5 }]);
  const seen = [];
  L.add(l, "b", "NH3 2M", { ml: 10 });
  L.step(l, 60, (e) => seen.push(Object.assign({ t: l.t }, e)));
  const gone = seen.filter((e) => e.key === "dissolved");
  assert.equal(gone.length, 1);
  assert.ok(gone[0].t > 3 && gone[0].t < 14, `nach ${gone[0].t} s`);
  const trace = lab([{ type: "beaker", id: "b", contains: [{ reagent: "AgNO3 1M", ml: 5 }] }], { room: 25 }), quiet = [];
  L.add(trace, "b", "H2O", { ml: 40 });
  L.step(trace, 30, (e) => quiet.push(e));
  assert.deepEqual(quiet.filter((e) => e.key === "dissolved" || e.key === "solid"), [], "eine Spur wird weder gemeldet noch abgemeldet");
});

test("Der Zähler für nicht berechnete Gleichgewichte hängt nicht am Namen eines Gefäßes", () => {
  const l = lab([{ type: "beaker", id: "failed", contains: [{ reagent: "HCl 0.1M", ml: 10 }] }], { room: 25 });
  L.add(l, "failed", "NaOH 0.1M", { ml: 5 });
  L.step(l, 5);
  assert.equal(l.failed || 0, 0);
  assert.ok(look(l, "failed").pH > 1.4);
});

test("Zeichnung und Texte: trockener Bodensatz, voller Hahn", () => {
  const l = decanted();
  const dry = L.parts.testtube.draw(look(l, "a"), ctx());
  clean(dry, "trockener Bodensatz");
  assert.match(dry, /class="cl-sediment"/);
  assert.doesNotMatch(dry, /cl-liquid/);
  assert.equal(L.say({ key: "tapFull", vessel: "bu" }, { lang: "de", names: { bu: "Bürette 1" } }), "Bürette 1: Das Gefäß darunter ist voll, der Hahn schließt.");
});

test("Oberfläche: leere Kurven, ausgeblendete Zahlen, trockener Bodensatz, Hinweis auf Rechenfehler", () => {
  const empty = mount({ bench: [{ type: "beaker", id: "b" }, { type: "phmeter", in: "b" }, { type: "burette", id: "bu", over: "b" }] });
  assert.doesNotMatch(part(empty, ".cl-charts").innerHTML, /NaN/);
  assert.doesNotMatch(item(empty, "phmeter1").innerHTML, /NaN/);
  const plain = mount({ bench: [{ type: "beaker", id: "b" }, { type: "burette", id: "bu", over: "b", contains: [{ reagent: "H2O", ml: 20 }] }], show: { numbers: false } });
  tap(plain, "bu");
  press(plain, "tap", "2");
  frames(3);
  assert.doesNotMatch(part(plain, ".cl-panel").innerHTML, /cl-given/, "ohne Zahlen auch keine Ablesung");
  const dry = mount({ room: 25, bench: [{ type: "testtube", id: "a", contains: [{ reagent: "AgNO3 0.1M", ml: 5 }, { reagent: "NaCl 0.1M", ml: 6 }] }, { type: "beaker", id: "b" }] });
  tap(dry, "a");
  part(dry, ".cl-panel").querySelector(".cl-pour-to").value = "b";
  part(dry, ".cl-panel").querySelector(".cl-pour-ml").value = "11";
  press(dry, "pour");
  frames(6);
  assert.equal(item(dry, "a").attributes["aria-label"], "Reagenzglas 1: Bodensatz");
  assert.match(item(dry, "a").innerHTML, /cl-sediment/);
  state(dry).run.lab.failed = 1;
  press(dry, "hand", "H2O");
  tap(dry, "a");
  frames(1);
  assert.match(part(dry, ".cl-status").textContent, /nicht berechnen/);
});

// ================================================================ Belastung

const stress = (model, seeds) => {
  const ids = ["t1", "t2", "b1", "b2", "bu"], names = Object.keys(L.core.reagents);
  const massOf = (l) => totals(l).mass;
  for (const seed of seeds) {
    let s = seed * 7919;
    const rnd = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
    const pick = (list) => list[Math.floor(rnd() * list.length)];
    const l = lab([{ type: "testtube", id: "t1" }, { type: "testtube", id: "t2" }, { type: "beaker", id: "b1" }, { type: "beaker", id: "b2", ml: 250 },
      { type: "burette", id: "bu", over: "b2" }, { type: "thermometer", in: "b1" }, { type: "phmeter", in: "b2" }], { room: 22, model });
    const trail = [];
    for (let i = 0; i < 40; i++) {
      const kind = rnd(), before = massOf(l);
      let added = 0, emptied = false;
      if (kind < 0.65) {
        const base = pick(names), r0 = L.core.reagents[base], id = r0.molar ? base + pick(["", " 0.01M", " 0.1M", " 2M"]) : base, r = L.reagent(id), to = pick(ids);
        const give = r.solid ? { g: +(0.01 + rnd() * 0.08).toFixed(3) } : r.drops ? { drops: 1 + Math.floor(rnd() * 5) } : { ml: +(0.5 + rnd() * 9).toFixed(1) };
        if (L.add(l, to, id, give)) {
          const ml = give.ml != null ? give.ml : (give.drops || 0) * 0.05;
          // Wasser nur so viel, wie neben den gelösten Stoffen Platz hat (Eigenvolumen Vm)
          const water = 1 - Object.entries(r.solution || {}).reduce((sum, [sp, c]) => sum + c * (L.species(sp).Vm || 0) / 1000, 0);
          added = r.solid ? give.g : ml * water * 0.997 + Object.entries(r.solution || {}).reduce((sum, [sp, c]) => sum + c * ml / 1000 * L.species(sp).M, 0);
        }
        trail.push(`${id} ${JSON.stringify(give)} → ${to}`);
      } else if (kind < 0.85) { const from = pick(ids), to = pick(ids), ml = +(rnd() * 25).toFixed(1); L.pour(l, from, to, ml); trail.push(`gieße ${ml} mL ${from} → ${to}`); }
      else if (kind < 0.93) { const rate = pick([0, 0.05, 0.5, 2]); L.setTap(l, "bu", rate); trail.push(`Hahn ${rate}`); }
      else { const id = pick(ids); L.empty(l, id); emptied = true; trail.push(`leere ${id}`); }
      L.step(l, 6 + Math.floor(rnd() * 14));
      const where = `Folge ${seed}: … ${trail.slice(-3).join("; ")}`;
      assert.equal(l.failed || 0, 0, `jedes Gleichgewicht ließ sich berechnen (${where})`);
      if (!emptied) near(massOf(l), before + added, 2e-6, `Masse (${where})`);
      for (const v of l.vessels) {
        let charge = 0;
        const lumps = {};
        for (const [id, n] of Object.entries(v.n)) { assert.ok(n > 0 && Number.isFinite(n), `${id} = ${n} (${where})`); charge += n * L.species(id).charge; }
        near(charge, 0, 1e-9, `Ladung in ${v.id} (${where})`);
        for (const piece of v.lumps) lumps[piece.id] = (lumps[piece.id] || 0) + piece.n;
        for (const [id, n] of Object.entries(lumps)) near(n, v.n[id] || 0, 1e-12 + 1e-9 * n, `Feststoff ${id} in ${v.id} (${where})`);
        assert.ok(v.T >= 0 && v.T <= 100.001, `Temperatur ${v.T} (${where})`);
        const pH = L.view(l, v).pH;
        assert.ok(pH == null || (pH > -1.5 && pH < 15.5), `pH ${pH} in ${v.id} (${where})`);
      }
    }
    // in Ruhe: nichts ist übersättigt, und kein Niederschlag liegt in einer Lösung, die ihn lösen müsste
    L.setTap(l, "bu", 0);
    L.step(l, 1500);
    for (const v of l.vessels) {
      const vol = L.volume(v), T = v.T + 273.15;
      if (!(vol > 1e-9)) continue;
      for (const e of L.db.equilibria.filter((x) => x.solid)) {
        const ions = Object.entries(e.d), here = ions.every(([id]) => v.n[id] > 0);
        // mit Aktivitäten; im idealen Modell ist jeder Koeffizient 1
        const logQ = here ? ions.reduce((sum, [id, nu]) => sum + nu * Math.log10(v.n[id] / vol * L.gamma(l, v.id, id)), 0) : -Infinity;
        const h = L.heatOf(e.text), logK = e.logK * e.f - (h == null ? 0 : h * e.f * 1000 / (8.314462618 * Math.LN10) * (1 / T - 1 / 298.15));
        assert.ok(logQ - logK < 0.01, `${e.solid} in ${v.id} ist um 10^${(logQ - logK).toFixed(2)} übersättigt (Folge ${seed})`);
        // (ein Stück mit eigenem Geschwindigkeitsgesetz darf liegen bleiben, wenn es sich unmerklich langsam löst: Marmor in Wasser)
        if (v.n[e.solid] > 0 && !e.rate) assert.ok(logQ - logK > -0.01, `${e.solid} in ${v.id} bleibt liegen, obwohl die Lösung es lösen müsste (Folge ${seed})`);
      }
    }
  }
};

test("Belastung: zufällige Mischungen aller Stoffe verletzen weder Erhaltungssätze noch Gleichgewichte", () => stress("ideal", [3, 11]));

test("Belastung im realen Modell: dieselben Mischungen mit Aktivitäten", () => stress("real", [3, 11]));

// ================================================================ Kleinere Befunde der ersten Durchsicht

test("Umgießen: nach dem vollständigen Umgießen ist das Glas leer, und zwei Güsse teilen sich nicht denselben Inhalt", () => {
  const l = lab([{ type: "testtube", id: "a", contains: [{ reagent: "HCl 1M", ml: 8 }] }, { type: "beaker", id: "b" }, { type: "beaker", id: "c" }]);
  assert.equal(L.pour(l, "a", "b", 8), true);
  assert.equal(L.pour(l, "a", "c", 8), false, "was schon unterwegs ist, lässt sich nicht noch einmal ausgießen");
  near(L.pourable(l, "a"), 0, 1e-9, "nichts mehr auszugießen");
  L.step(l, 5);
  assert.equal(look(l, "a").ml, 0, "kein Rest");
  near(look(l, "b").ml, 8, 1e-6);
  assert.equal(look(l, "c").ml, 0);
  assert.equal(L.pour(l, "a", "b", 5), false, "aus dem leeren Glas kommt nichts");
  const half = lab([{ type: "testtube", id: "a", contains: [{ reagent: "HCl 1M", ml: 8 }] }, { type: "beaker", id: "b" }, { type: "beaker", id: "c" }]);
  L.pour(half, "a", "b", 5);
  assert.equal(L.pour(half, "a", "c", 8), true, "der Rest lässt sich ausgießen");
  L.step(half, 5);
  near(look(half, "b").ml, 5, 1e-6);
  near(look(half, "c").ml, 3, 1e-6, "aber nur der Rest");
});

test("Umgießen an der Fläche: leeres Glas und unsinnige Menge werden als solche gemeldet", () => {
  const el = mount({ bench: [{ type: "testtube", id: "a", contains: [{ reagent: "HCl 1M", ml: 8 }] }, { type: "beaker", id: "b" }] });
  tap(el, "a");
  const panel = part(el, ".cl-panel"), status = () => part(el, ".cl-status").textContent;
  const pourIt = (value) => { panel.querySelector(".cl-pour-to").value = "b"; panel.querySelector(".cl-pour-ml").value = value; press(el, "pour"); };
  for (const bad of ["abc", "0", "-3", ""]) {
    pourIt(bad);
    assert.equal(status(), "Bitte eine Menge in mL eingeben, die größer als null ist.", `Eingabe „${bad}“`);
  }
  assert.equal(state(el).run.lab.flows.length, 0);
  pourIt("8");
  frames(5);
  const lines = (logOf(el).match(/<li>/g) || []).length;
  pourIt("5");
  assert.equal(status(), "Aus diesem Gefäß lässt sich nichts umgießen.");
  assert.equal((logOf(el).match(/<li>/g) || []).length, lines, "kein weiterer Eintrag im Protokoll");
});

test("Antippen: nur die linke Maustaste gibt Stoff zu", () => {
  const el = mount(tube);
  press(el, "hand", "Mg ribbon");
  const click = (button) => {
    const svg = part(el, ".cl-svg");
    const ev = { button, target: { closest: (sel) => (sel === ".cl-item" ? { getAttribute: () => "rg" } : null) }, clientX: 10, clientY: 10, pointerId: 1, preventDefault() {} };
    svg.listeners.pointerdown(ev);
    svg.listeners.pointerup(ev);
  };
  click(2);
  click(1);
  assert.equal(L.vessel(state(el).run.lab, "rg").n["Mg(s)"], undefined, "Rechts- und Mittelklick tun nichts");
  click(0);
  assert.ok(L.vessel(state(el).run.lab, "rg").n["Mg(s)"] > 0, "der Linksklick schon");
});

test("Fehlende Datei: die Fläche sagt, was fehlt, statt leer zu bleiben", () => {
  const saved = { fx: L.fx, core: L.core, icon: L.icon };
  try {
    delete L.fx;
    assert.match(mount(tube).innerHTML, /role="alert">ChemLab ist nicht vollständig geladen\. Es fehlt: chemlab-fx\.js</);
    L.fx = saved.fx;
    delete L.core;
    delete L.icon;
    const html = mount(tube).innerHTML;
    assert.match(html, /chemlab-data\.js, chemlab-parts\.js/);
  } finally { Object.assign(L, saved); }
  assert.doesNotMatch(mount(tube).innerHTML, /role="alert"/, "mit allen Dateien wieder die Fläche");
  const readme = fs.readFileSync(new URL("README.md", here), "utf8");
  const macro = readme.slice(readme.indexOf("@ChemLab.sim_\n"), readme.indexOf("-->"));
  assert.match(macro, /role="alert"/, "auch das Makro meldet sich, wenn chemlab-ui.js nicht kommt");
  assert.match(macro, /chemlab-ui\.js/);
});

test("Fehler in eigenen Daten: die Ursache steht in der Sprache des Kurses da", () => {
  const html = (data) => mount({ data, bench: [] }).innerHTML;
  assert.match(html({ reactions: [{ eq: "H2(g) + O2(g) -> H2O(l)", rate: { k: 1 } }] }), /Fehler in den eigenen Stoffdaten: .*nicht ausgeglichen: .*O 2 ≠ 1/);
  assert.match(html({ reactions: [{ eq: "Li(s) + H+(aq) -> Li+(aq) + H(g)", rate: { k: 1 } }] }), /unbekannter Stoff: Li\(s\)/);
  assert.match(html({ species: { "Qq(s)": {} } }), /unbekanntes Element: Qq/);
  assert.match(html({ species: { "H2O(l)": { name: { de: "x" }, Hf: 1, src: "x" } } }), /schon anders eingetragen/);
  assert.equal(L.explain("X (balance: a – H 2 ≠ 4); Y (species: Fe(s)); Z (logK)", "en"), "X (not balanced: a – H 2 ≠ 4); Y (unknown substance: Fe(s)); Z (logK is missing)");
  assert.equal(L.explain("keine Klammer mit Code (hallo)", "de"), "keine Klammer mit Code (hallo)");
});

test("Eigene Daten: eine Vorratslösung muss elektrisch neutral sein, die Ordnung gilt gelösten Teilchen", () => {
  assert.throws(() => L.register({ reagents: { "CuCl": { name: { de: "x" }, solution: { "Cu^2+(aq)": 1, "Cl-(aq)": 1 } } } }),
    (e) => e.code === "data" && /charge/.test(e.detail), "Kupfer zweifach, Chlorid einfach");
  assert.throws(() => L.register({ reactions: [{ eq: "Mg(s) + 2 H2O(l) -> Mg^2+(aq) + 2 OH-(aq) + H2(g)", rate: { k: 1, order: { "Mg(s)": 1 } }, src: "x" }] }),
    (e) => e.code === "data" && /rate/.test(e.detail), "Ordnung an einem Feststoff");
  assert.throws(() => L.register({ reactions: [{ eq: "Mg(s) + 2 H2O(l) -> Mg^2+(aq) + 2 OH-(aq) + H2(g)", rate: { k: 1, order: { "OH-(aq)": "eins" } }, src: "x" }] }),
    (e) => e.code === "data" && /rate/.test(e.detail), "Ordnung als Text");
  assert.deepEqual(L.lint(L.core), [], "das Grundpaket selbst ist in Ordnung");
});

test("Zeit: wer eine ruhende Aufzeichnung bis zum Ende abspielt, verlängert sie nicht", () => {
  const el = mount({ bench: [{ type: "beaker", id: "b", contains: [{ reagent: "H2O", ml: 20 }] }] });
  press(el, "hand", "H2O");
  tap(el, "b");
  frames(8);
  assert.equal(state(el).play, 0, "in Ruhe");
  const end = state(el).run.end, count = state(el).run.frames.length;
  for (const speed of ["60", "1"]) {
    enter(el, "input", "seek", String(end - 1));
    enter(el, "change", "speed", speed);
    press(el, "play");
    frames(3);
    assert.equal(state(el).play, 0, "hält am Ende an");
    assert.equal(state(el).run.end, end, `Tempo ${speed}: das Ende bleibt, wo es war`);
    assert.equal(state(el).run.frames.length, count);
    assert.equal(part(el, ".cl-status").textContent, "Es ändert sich nichts mehr, die Uhr steht.");
  }
});

// ================================================================ Meilenstein 3: Hitze und Gase

const heated = (vessel, more, flame) => lab([Object.assign({ id: "b" }, vessel), { type: "burner", id: "br", under: "b", flame: flame == null ? 2 : flame }], Object.assign({ room: 20 }, more));
const collect = (l, seconds) => { const seen = []; L.step(l, seconds, (e) => seen.push(e)); return seen; };
const keys = (events) => events.map((e) => e.key);
const gasOf = (l, id, vessel) => { const v = L.vessel(l, vessel || "b"); return (v.air[id] || 0) + (v.out[id] || 0); };
// rechnet sekundenweise weiter, bis die Bedingung gilt; gibt die Zeit zurück und sammelt die Ereignisse in seen
const until = (l, test, limit, seen) => { let t = 0; while (!test() && t < limit) { L.step(l, 1, (e) => seen && seen.push(e)); t++; } return t; };

test("Brenner: ein Becherglas Wasser siedet nach wenigen Minuten und bleibt bei 100 °C", () => {
  const l = heated({ type: "beaker", contains: [{ reagent: "H2O", ml: 100 }] });
  const seen = collect(l, 60);
  assert.ok(look(l).T > 40 && look(l).T < 75, `nach einer Minute ${look(l).T} °C`);
  const t = 60 + until(l, () => look(l).T >= 99.99, 600, seen);
  assert.ok(t > 110 && t < 260, `siedet nach ${t} s`);
  const water = amount(l, "H2O(l)"), before = totals(l).mass;
  seen.push(...collect(l, 60));
  near(look(l).T, 100, 0.01, "Siedetemperatur");
  assert.ok(look(l).steam > 1e-4, "es entsteht Dampf");
  // rund 220 W gehen in das Wasser, 40,65 kJ/mol kostet das Verdampfen
  near((water - amount(l, "H2O(l)")) * 40650 / 60, 0.2 * (1150 - 100) - 0.15 * 80, 15, "Leistung, die im Dampf steckt");
  near(totals(l).mass, before, 1e-9, "Masse");
  assert.ok(keys(seen).includes("boil"), "das Sieden steht im Protokoll");
  L.setFlame(l, "br", 0);
  seen.length = 0; seen.push(...collect(l, 30));
  assert.ok(look(l).T < 100 && look(l).steam === 0 && keys(seen).includes("boilEnd"));
});

test("Brenner: aus, leuchtend, rauschend – die leuchtende Flamme heizt schwächer, ohne Gefäß heizt er nichts", () => {
  const rise = (flame) => { const l = heated({ type: "beaker", contains: [{ reagent: "H2O", ml: 100 }] }, {}, flame); L.step(l, 30); return look(l).T - 20; };
  assert.equal(rise(0), 0);
  assert.ok(rise(1) > 3 && rise(2) > 1.6 * rise(1), `${rise(1)} K und ${rise(2)} K`);
  const l = lab([{ type: "beaker", id: "b", contains: [{ reagent: "H2O", ml: 50 }] }, { type: "burner", id: "br" }], { room: 20 });
  assert.equal(L.setFlame(l, "br", 2), true);
  assert.equal(L.setFlame(l, "b", 2), false, "ein Becherglas hat keine Flamme");
  L.step(l, 30);
  assert.equal(look(l).T, 20);
  assert.equal(L.reading(l, "br").flame, 2);
  assert.equal(L.atRest(l), false, "solange ein Brenner brennt, läuft die Uhr");
  L.setFlame(l, "br", 0);
  assert.equal(L.atRest(l), true);
  assert.equal(L.setFlame(l, "br", 7), true);
  assert.equal(L.reading(l, "br").flame, 2, "mehr als rauschend gibt es nicht");
});

test("Trocken erhitzt: das Glas wird weit heißer als 100 °C, Wasser darauf verdampft schlagartig", () => {
  const l = heated({ type: "testtube" });
  L.step(l, 400);
  assert.ok(look(l).T > 450 && look(l).T < 900, `${look(l).T} °C`);
  L.setFlame(l, "br", 0);
  L.add(l, "b", "H2O", { ml: 5 });
  const seen = collect(l, 3);
  assert.ok(look(l).T <= 100.001, `${look(l).T} °C`);
  assert.ok(L.vessel(l, "b").out["H2O(g)"] > 0.02, "ein Teil des Wassers ist verdampft");
  assert.ok(keys(seen).includes("boil"));
});

test("Eindampfen: aus Kochsalzlösung bleiben Salzkristalle, Masse und Ladung bleiben erhalten", () => {
  const l = heated({ type: "dish", contains: [{ reagent: "NaCl 1M", ml: 10 }] });
  const before = totals(l), seen = collect(l, 400);
  assert.equal(amount(l, "H2O(l)"), 0, "das Wasser ist verdampft");
  near(amount(l, "NaCl(s)"), 0.01, 1e-4, "Kochsalz");
  assert.ok(look(l).T > 150, `ohne Wasser steigt die Temperatur: ${look(l).T} °C`);
  near(totals(l).mass, before.mass, 1e-9, "Masse");
  near(totals(l).charge, 0, 1e-11, "Ladung");
  assert.equal(l.failed || 0, 0);
  assert.ok(keys(seen).includes("solid") && keys(seen).includes("dry"), keys(seen).join());
  assert.equal(keys(seen).filter((k) => k === "dry").length, 1, "„eingedampft“ steht einmal im Protokoll");
  assert.ok(keys(seen).indexOf("solid") < keys(seen).indexOf("dry"), "die Kristalle erscheinen, bevor alles trocken ist");
  assert.ok(look(l).sediment.ml > 0.1, "sie liegen in der Schale");
  assert.deepEqual(Object.keys(L.vessel(l, "b").n), ["NaCl(s)"], "sonst bleibt nichts zurück");
  assert.equal(seen.find((e) => e.key === "solid").grown, true, "beim Eindampfen wachsen Kristalle");
  assert.ok(!keys(seen).includes("color"), "ohne Flüssigkeit gibt es keinen Farbwechsel zu melden");
  assert.equal(L.say(seen.find((e) => e.key === "solid"), { lang: "de", names: { b: "Abdampfschale 1" } }), "Abdampfschale 1: Es scheiden sich weiße Kristalle ab.");
  L.setFlame(l, "br", 0);
  L.step(l, 900);
  L.add(l, "b", "H2O", { ml: 10 });
  L.step(l, 60);
  near(amount(l, "Na+(aq)"), 0.01, 1e-5, "in Wasser löst sich das Salz wieder");
  assert.equal(amount(l, "NaCl(s)"), 0);
});

test("Eindampfen: Flüchtiges entweicht, was kein Salz bildet, bleibt als Rückstand", () => {
  const acid = heated({ type: "testtube", contains: [{ reagent: "HCl 1M", ml: 5 }] });
  const before = totals(acid).mass, seen = collect(acid, 300);
  near(gasOf(acid, "HCl(g)"), 0.005, 1e-5, "Chlorwasserstoff ist entwichen");
  assert.deepEqual(Object.keys(L.vessel(acid, "b").n), [], "das Glas ist leer");
  assert.ok(seen.some((e) => e.key === "smell" && e.species === "HCl(g)"), "es riecht stechend");
  near(totals(acid).mass, before, 1e-9, "Masse");
  assert.equal(acid.failed || 0, 0);

  const base = heated({ type: "testtube", contains: [{ reagent: "NaOH 1M", ml: 5 }] });
  const events = collect(base, 300);
  assert.equal(amount(base, "H2O(l)"), 0);
  near(amount(base, "Na+(aq)"), 0.005, 1e-6, "das Natriumhydroxid bleibt im Glas");
  assert.ok(look(base).residue > 0.009, "als Rückstand");
  assert.ok(keys(events).includes("dry"));
  assert.equal(base.failed || 0, 0);
  L.setFlame(base, "br", 0);
  L.step(base, 2500);
  L.add(base, "b", "H2O", { ml: 5 });
  L.step(base, 30);
  assert.equal(look(base).residue, 0);
  near(look(base).pH, 14.17, 0.1, "wieder gelöst: Natronlauge mit 1 mol/L, bei 20 °C");
});

test("Eindampfen: aus Kupfersulfat-Lösung wachsen blaue Kristalle", () => {
  const l = heated({ type: "dish", contains: [{ reagent: "CuSO4 1M", ml: 10 }] });
  // ein Tropfen Schwefelsäure hält die Lösung beim Erhitzen klar, wie im Labor üblich
  L.add(l, "b", "H2SO4 1M", { drops: 2 });
  const seen = [];
  until(l, () => look(l).ml === 0, 300, seen);
  const solids = seen.filter((e) => e.key === "solid");
  assert.deepEqual(solids.map((e) => [e.species, e.color]), [["CuSO4*5H2O(s)", "blue"]]);
  assert.ok(amount(l, "CuSO4*5H2O(s)") > 0.009, `${amount(l, "CuSO4*5H2O(s)")} mol blaue Kristalle`);
  near(amount(l, "CuSO4*5H2O(s)") + amount(l, "CuSO4(s)"), 0.01, 1.5e-4, "bis auf den Rest, den die zugesetzte Säure hält, liegt alles Kupfersulfat als Salz in der Schale");
  // stärker erhitzt, gibt das blaue Salz sein Kristallwasser ab und wird weiß
  L.step(l, 200);
  near(amount(l, "CuSO4(s)"), 0.01, 1.5e-4, "wasserfreies Kupfersulfat");
  assert.equal(amount(l, "CuSO4*5H2O(s)"), 0);
  assert.equal(L.species("CuSO4(s)").color, "#eceeea");
  // mit Wasser wird es wieder blau und warm
  L.setFlame(l, "br", 0);
  L.step(l, 2500);
  L.add(l, "b", "H2O", { ml: 10 });
  L.step(l, 6);
  assert.ok(look(l).T > 24, `beim Lösen wird es warm: ${look(l).T} °C`);
  assert.equal(look(l).color.name, "blue");
  assert.equal(l.failed || 0, 0);
});

test("Carbonat: Soda ist alkalisch, Natron schwach alkalisch; mit Säure sprudelt Kohlenstoffdioxid heraus", () => {
  near(look(beaker([{ reagent: "Na2CO3 0.1M", ml: 20 }], { room: 25 })).pH, 11.65, 0.1, "Soda 0,1 mol/L");
  near(look(beaker([{ reagent: "NaHCO3 0.1M", ml: 20 }], { room: 25 })).pH, 8.34, 0.1, "Natron 0,1 mol/L");
  const l = beaker([{ reagent: "Na2CO3 1M", ml: 20 }], { room: 25 });
  const before = totals(l).mass;
  L.add(l, "b", "HCl 1M", { ml: 45 });
  const seen = collect(l, 60);
  const v = L.vessel(l, "b"), vol = L.volume(v), limit = Math.pow(10, -1.468);
  assert.ok(keys(seen).includes("gas"), "Gasblasen");
  near(amount(l, "CO2(aq)") / vol, limit, 0.2 * limit, "gelöst bleibt, was sich bei 1 bar löst");
  near(gasOf(l, "CO2(g)") + amount(l, "CO2(aq)") + amount(l, "HCO3-(aq)"), 0.02, 1e-6, "alles Carbonat ist Kohlenstoffdioxid geworden");
  assert.ok(look(l).pH < 2, "die Säure ist im Überschuss");
  near(totals(l).mass, before + 45 * 0.997 + 0.045 * 36.458, 1e-6, "Masse");
  // verdünnt bleibt das Gas gelöst
  const thin = beaker([{ reagent: "Na2CO3 0.01M", ml: 20 }], { room: 25 });
  L.add(thin, "b", "HCl 0.1M", { ml: 10 });
  assert.ok(!keys(collect(thin, 60)).includes("gas"), "verdünnt sprudelt nichts");
  assert.equal(gasOf(thin, "CO2(g)"), 0);
});

test("Natron zerfällt beim Kochen: Kohlenstoffdioxid entweicht, die Lösung wird alkalischer", () => {
  const l = heated({ type: "beaker", contains: [{ reagent: "NaHCO3 1M", ml: 50 }] });
  const pH = look(l).pH;
  L.step(l, 30);
  assert.equal(gasOf(l, "CO2(g)"), 0, "kalt bleibt sie, wie sie ist");
  L.step(l, 400);
  assert.ok(gasOf(l, "CO2(g)") > 0.004, `${gasOf(l, "CO2(g)")} mol`);
  L.setFlame(l, "br", 0);
  L.step(l, 1500);
  assert.ok(look(l).pH > pH + 0.5, `pH ${pH} → ${look(l).pH}`);
  assert.equal(l.failed || 0, 0);
});

test("Marmor in Salzsäure: löst sich unter Gasentwicklung, Kohlenstoffdioxid löscht den brennenden Span", () => {
  const l = beaker([{ reagent: "HCl 1M", ml: 20 }], { room: 25 });
  L.add(l, "b", "marble", { g: 0.5 });
  const seen = collect(l, 40);
  assert.ok(keys(seen).includes("gas"));
  assert.ok(look(l).air["CO2(g)"] > 0.3, `Anteil im Gasraum ${look(l).air["CO2(g)"]}`);
  const test = L.probe(l, "b", "flame");
  assert.equal(test.result, "out", "der brennende Span erlischt");
  seen.push(...collect(l, 400));
  assert.ok(seen.some((e) => e.key === "gone" && e.species === "CaCO3(s)"), "der Marmor ist verbraucht");
  near(amount(l, "Ca^2+(aq)"), 0.5 / 100.086, 1e-6, "Calcium in Lösung");
  assert.equal(l.failed || 0, 0);
});

test("Ammoniak: riecht stechend und entweicht beim Kochen", () => {
  const l = heated({ type: "beaker", contains: [{ reagent: "NH3 1M", ml: 50 }] }, {}, 0);
  const seen = collect(l, 5);
  assert.ok(seen.some((e) => e.key === "smell" && e.species === "NH3(g)"), keys(seen).join());
  assert.equal(gasOf(l, "NH3(g)"), 0, "kalt bleibt es in Lösung");
  assert.ok(!collect(beaker([{ reagent: "NH3 0.01M", ml: 50 }]), 5).some((e) => e.key === "smell"), "stark verdünnt riecht man nichts");
  L.setFlame(l, "br", 2);
  L.step(l, 600);
  assert.ok(gasOf(l, "NH3(g)") > 0.02, `${gasOf(l, "NH3(g)")} mol sind mit dem Dampf entwichen`);
});

const hydrogen = (more) => lab([{ type: "testtube", id: "b", contains: [{ reagent: "HCl 1M", ml: 8 }, { reagent: "Mg ribbon", g: 0.052 }] }].concat(more || []), { room: 25 });

test("Gasraum: Wasserstoff steht über der Lösung, solange er entsteht, und verfliegt dann", () => {
  const l = hydrogen();
  L.step(l, 12);
  const share = look(l).air["H2(g)"];
  assert.ok(share > 0.04 && share < 0.75, `Anteil ${share}`);
  L.step(l, 400);
  assert.ok(!(look(l).air["H2(g)"] > 0.001), "später ist er verflogen");
  near(gasOf(l, "H2(g)"), 0.052 / 24.305, 1e-9, "nichts geht verloren");
});

test("Knallgasprobe: es knallt, solange Wasserstoff im Glas steht; danach brennt der Span ruhig weiter", () => {
  const l = hydrogen(), seen = [];
  L.step(l, 12);
  const before = totals(l).mass, had = L.vessel(l, "b").air["H2(g)"];
  const test = L.probe(l, "b", "flame", (e) => seen.push(e));
  assert.equal(test.result, "pop");
  assert.ok(test.level >= 1 && test.level <= 2, `Stärke ${test.level}`);
  assert.ok((L.vessel(l, "b").air["H2(g)"] || 0) < 0.1 * had, "der Wasserstoff ist verbrannt");
  assert.ok(L.vessel(l, "b").out["H2O(g)"] > 0.8 * had, "zu Wasser");
  near(L.vessel(l, "b").taken["O2(g)"], had / 2, 0.1 * had, "mit Sauerstoff aus der Luft");
  near(totals(l).mass, before, 1e-12, "Masse, den Sauerstoff aus der Luft mitgezählt");
  assert.deepEqual(keys(seen), ["splint"]);
  assert.equal(seen[0].result, "pop");
  L.step(l, 400);
  assert.equal(L.probe(l, "b", "flame").result, "calm");
  assert.equal(L.probe(l, "b", "glow").result, "glow", "ein Glimmspan glimmt in Luft nur weiter");
  assert.equal(L.probe(l, "nichts", "flame"), null);
});

test("Glimmspanprobe: Wasserstoffperoxid gibt mit Braunstein Sauerstoff, der Span flammt auf", () => {
  const l = lab([{ type: "testtube", id: "b", contains: [{ reagent: "H2O2 1M", ml: 5 }] }], { room: 25 });
  L.step(l, 30);
  assert.equal(gasOf(l, "O2(g)"), 0, "ohne Katalysator geschieht nichts");
  assert.equal(L.probe(l, "b", "glow").result, "glow");
  L.add(l, "b", "MnO2", { g: 0.1 });
  const seen = collect(l, 20);
  assert.ok(keys(seen).includes("gas"));
  assert.ok(look(l).air["O2(g)"] > 0.5, `Sauerstoff im Gasraum ${look(l).air["O2(g)"]}`);
  assert.equal(L.probe(l, "b", "glow").result, "relight");
  assert.equal(L.probe(l, "b", "flame").result, "flare", "ein brennender Span brennt heller");
  L.step(l, 300);
  near(gasOf(l, "O2(g)"), 0.0025, 5e-5, "aus 5 mmol Wasserstoffperoxid 2,5 mmol Sauerstoff");
  near(amount(l, "MnO2(s)"), 0.1 / 86.936, 1e-9, "der Braunstein ist unverändert");
  assert.ok(look(l).T > 25, "es wird warm");
});

test("Kolbenprober: misst das Gasvolumen – 1 mmol Wasserstoff sind knapp 25 mL", () => {
  const config = L.normalize({ room: 25, bench: [{ type: "testtube", id: "b", contains: [{ reagent: "HCl 1M", ml: 8 }, { reagent: "Mg ribbon", g: 0.0243 }] }, { type: "syringe", id: "kp", in: "b" }] });
  const run = L.createRun(config);
  assert.equal(L.reading(run.lab, "kp").value, 0);
  L.advance(run, 400);
  near(L.reading(run.lab, "kp").value, 24.79 * 0.0243 / 24.305 * 1000, 0.05, "Volumen in mL");
  assert.equal(L.reading(run.lab, "kp").unit, "mL");
  const points = L.series(run, { tool: "kp" });
  assert.ok(points[0][1] === 0 && points[points.length - 1][1] > 24, "die Kurve für das Diagramm");
  // mehr als 100 mL fasst er nicht
  const big = lab([{ type: "beaker", id: "b", contains: [{ reagent: "HCl 2M", ml: 50 }, { reagent: "Mg ribbon", g: 0.2 }] }, { type: "syringe", id: "kp", in: "b" }], { room: 25 });
  const seen = collect(big, 600);
  assert.equal(L.reading(big, "kp").value, 100);
  assert.ok(keys(seen).includes("syringeFull"));
});

const burning = (reagent, g, flame) => heated({ type: "dish", contains: [{ reagent, g }] }, {}, flame);

test("Magnesium verbrennt: es entzündet sich erst in der Hitze und brennt dann von selbst weiter", () => {
  const l = burning("Mg ribbon", 0.104), n = 0.104 / 24.305, before = totals(l).mass;
  L.step(l, 20);
  assert.equal(amount(l, "MgO(s)"), 0, "kalt geschieht nichts");
  const seen = [];
  const t = until(l, () => keys(seen).includes("ignite"), 400, seen);
  assert.ok(t < 300, "es entzündet sich");
  assert.ok(look(l).T > 450, `bei ${look(l).T} °C`);
  L.setFlame(l, "br", 0);
  L.step(l, 1);
  const fire = look(l).fire;
  assert.ok(fire.length === 1 && fire[0].rate > 0 && fire[0].glare > 0 && /^#/.test(fire[0].color), JSON.stringify(fire));
  seen.push(...collect(l, 60));
  near(amount(l, "MgO(s)"), n, 1e-9, "Magnesiumoxid");
  assert.equal(amount(l, "Mg(s)"), 0);
  near(L.vessel(l, "b").taken["O2(g)"], n / 2, 1e-9, "Sauerstoff aus der Luft");
  near(totals(l).mass, before, 1e-9, "Masse");
  assert.equal(look(l).fire.length, 0, "das Feuer ist aus");
  assert.ok(keys(seen).includes("fireEnd"));
  // Magnesiumoxid mit Wasser: die Lösung wird alkalisch
  L.step(l, 1500);
  L.add(l, "b", "H2O", { ml: 10 });
  L.step(l, 200);
  assert.ok(look(l).pH > 9.5, `pH ${look(l).pH}`);
  assert.equal(l.failed || 0, 0);
});

test("Verbrennung: Schwefel brennt zu Schwefeldioxid, Holzkohle zu Kohlenstoffdioxid; unter Wasser brennt nichts", () => {
  const s = burning("sulfur", 0.32), seen = collect(s, 600);
  near(gasOf(s, "SO2(g)"), 0.32 / 32.06, 1e-9, "Schwefeldioxid");
  assert.ok(seen.some((e) => e.key === "smell" && e.species === "SO2(g)"), "es riecht stechend");
  assert.ok(!keys(seen).includes("gas"), "ohne Flüssigkeit steigen keine Blasen");
  const c = burning("charcoal", 0.12);
  L.step(c, 900);
  near(gasOf(c, "CO2(g)"), 0.12 / 12.011, 1e-9, "Kohlenstoffdioxid");
  // ein brennender Span entzündet Schwefel, aber kein Magnesium
  const cold = burning("sulfur", 0.32, 0);
  assert.equal(L.probe(cold, "b", "flame").result, "calm");
  L.step(cold, 300);
  near(gasOf(cold, "SO2(g)"), 0.32 / 32.06, 1e-9, "vom Span entzündet");
  const mg = burning("Mg ribbon", 0.104, 0);
  L.probe(mg, "b", "flame");
  L.step(mg, 60);
  assert.equal(amount(mg, "MgO(s)"), 0);
  const wet = heated({ type: "dish", contains: [{ reagent: "H2O", ml: 20 }, { reagent: "sulfur", g: 0.32 }] });
  L.step(wet, 60);
  L.probe(wet, "b", "flame");
  L.step(wet, 10);
  assert.equal(gasOf(wet, "SO2(g)"), 0);
});

test("Flammenfärbung: Natrium gelb, Kalium violett, Lithium und Strontium rot, Calcium orange, Barium und Kupfer grün", () => {
  const salts = { "NaCl 0.1M": "yellow", "KBr 0.1M": "violet", "LiCl 0.1M": "red", "SrCl2 0.1M": "red", "CaCl2 0.1M": "orange", "BaCl2 0.1M": "green", "CuSO4 0.1M": "green", "HCl 0.1M": null };
  const bench = Object.keys(salts).map((reagent, i) => ({ type: "testtube", id: "t" + i, contains: [{ reagent, ml: 5 }] }));
  const l = lab(bench.concat([{ type: "burner", id: "br", flame: 2 }]), { room: 20 });
  Object.values(salts).forEach((color, i) => {
    const seen = [], out = L.flameTest(l, "t" + i, (e) => seen.push(e));
    assert.equal(out.name, color, Object.keys(salts)[i]);
    assert.equal(out.burner, "br");
    assert.deepEqual(keys(seen), ["flameTest"]);
    assert.equal(L.reading(l, "br").tint == null, color == null, "die Flamme trägt die Farbe");
    L.step(l, 6);
    assert.equal(L.reading(l, "br").tint, null, "nach einigen Sekunden ist die Färbung vorbei");
  });
  // Natrium überstrahlt Kalium
  L.add(l, "t1", "NaCl 0.1M", { ml: 5 });
  L.step(l, 5);
  assert.equal(L.flameTest(l, "t1").name, "yellow");
  // ohne rauschende Flamme sieht man nichts
  L.setFlame(l, "br", 1);
  assert.equal(L.flameTest(l, "t0"), null);
  L.setFlame(l, "br", 0);
  assert.equal(L.flameTest(l, "t0"), null);
});

test("Explosion: viel Knallgas zerstört das Glas, und sein Inhalt ist verschüttet", () => {
  const l = lab([{ type: "beaker", id: "b", ml: 600, contains: [{ reagent: "HCl 1M", ml: 100 }] }, { type: "thermometer", id: "th", in: "b" },
    { type: "beaker", id: "c", contains: [{ reagent: "H2O", ml: 20 }] }], { room: 20 });
  const v = L.vessel(l, "b"), before = totals(l).mass + 0.006 * 2.016, seen = [];
  v.air["H2(g)"] = 0.006;                                      // rund 30 % des Gasraums
  const test = L.probe(l, "b", "flame", (e) => seen.push(e));
  assert.equal(test.result, "pop");
  assert.equal(test.level, 3);
  assert.equal(look(l).broken, true);
  assert.deepEqual(Object.keys(v.n), [], "nichts ist mehr im Glas");
  near(totals(l).mass, before, 1e-9, "Masse");
  assert.deepEqual(keys(seen), ["splint", "broken"], "erst der Knall, dann die Scherben");
  assert.equal(L.tool(l, "th").in, null, "das Thermometer steht wieder für sich");
  assert.equal(L.add(l, "b", "H2O", { ml: 5 }), false, "in Scherben gießt man nichts");
  assert.equal(L.pour(l, "c", "b", 1), false, "auch nicht aus einem anderen Gefäß");
  assert.equal(L.pour(l, "b", "c", 1), false);
  assert.equal(L.pour(l, "c", "c", 1), false);
  // ein Brenner unter einem Glas voll Knallgas zündet es
  const lit = lab([{ type: "beaker", id: "b", contains: [{ reagent: "H2O", ml: 20 }] }, { type: "burner", id: "br", under: "b", flame: 0 }], { room: 20 });
  L.vessel(lit, "b").air["H2(g)"] = 0.0008;
  L.setFlame(lit, "br", 2);
  const events = collect(lit, 1);
  assert.ok(events.some((e) => e.key === "pop" && e.level >= 1), keys(events).join());
  assert.equal(look(lit).broken, false);
});

test("Fällungen mit Carbonat und Calcium: Kalk, Bariumcarbonat, Gips", () => {
  const mix = (a, b) => { const l = tubeOf([{ reagent: a, ml: 5 }]); L.add(l, "b", b, { ml: 5 }); const seen = collect(l, 60); return { l, seen }; };
  const lime = mix("CaCl2 0.1M", "Na2CO3 0.1M");
  near(solid(lime.l, "CaCO3(s)"), 5e-4, 2e-5, "Calciumcarbonat");
  assert.ok(lime.seen.some((e) => e.key === "solid" && e.color === "white"));
  assert.ok(solid(mix("BaCl2 0.1M", "Na2CO3 0.1M").l, "BaCO3(s)") > 4.5e-4);
  assert.ok(solid(mix("SrCl2 0.1M", "Na2SO4 0.1M").l, "SrSO4(s)") > 4e-4);
  assert.ok(solid(mix("CaCl2 1M", "Na2SO4 1M").l, "CaSO4*2H2O(s)") > 1e-3, "Gips fällt aus konzentrierter Lösung");
  assert.equal(solid(mix("CaCl2 0.005M", "Na2SO4 0.005M").l, "CaSO4*2H2O(s)"), 0, "aus verdünnter nicht");
  assert.ok(solid(mix("CaCl2 1M", "NaOH 1M").l, "Ca(OH)2(s)") > 1e-3, "Calciumhydroxid");
  // Kalk löst sich in Säure unter Gasentwicklung
  L.add(lime.l, "b", "HCl 1M", { ml: 5 });
  L.step(lime.l, 60);
  assert.equal(solid(lime.l, "CaCO3(s)"), 0);
  assert.equal(lime.l.failed || 0, 0);
});

test("Eingabe: Brenner unter ein Gefäß, höchstens einer; Span und Stäbchen gehören ins Regal", () => {
  const ok = L.normalize({ bench: [{ type: "dish", id: "s" }, { type: "burner", under: "s", flame: 1 }, { type: "burner" }, { type: "syringe", in: "s" }], shelf: ["splint", "glowsplint", "rod", "burner", "dish", "syringe"], show: { charts: ["V", "T"] } });
  assert.deepEqual(ok.bench.map((p) => [p.type, p.in == null ? null : p.in, p.flame == null ? null : p.flame]),
    [["dish", null, null], ["burner", "s", 1], ["burner", null, 0], ["syringe", "s", null]]);
  assert.deepEqual(ok.show.charts, ["V", "T"]);
  const bad = (bench, code) => assert.throws(() => L.normalize({ bench }), (e) => e.code === code, JSON.stringify(bench));
  bad([{ type: "beaker", id: "b" }, { type: "burner", under: "b" }, { type: "burner", under: "b" }], "place");
  bad([{ type: "beaker", id: "b" }, { type: "burette", id: "bu", over: "b" }, { type: "burner", under: "bu" }], "place");
  bad([{ type: "burner", under: "nichts" }], "place");
  bad([{ type: "splint" }], "part");
  bad([{ type: "beaker", id: "b" }, { type: "syringe", in: "b" }, { type: "syringe", in: "b" }], "place");
  // auf dem Tisch: ein Brenner aus dem Regal kommt unter ein Gefäß, ein zweiter nicht mehr
  const l = lab([{ type: "beaker", id: "b" }]);
  const id = L.place(l, { type: "burner", under: "b" });
  assert.equal(L.tool(l, id).in, "b");
  assert.equal(L.tool(l, L.place(l, { type: "burner", under: "b" })).in, null);
});

test("Aufzeichnung: Brenner, Gasraum und Feuer kommen beim Zurückspulen wieder", () => {
  const run = L.createRun(L.normalize({ room: 20, bench: [{ type: "dish", id: "b", contains: [{ reagent: "Mg ribbon", g: 0.104 }] }, { type: "burner", id: "br", under: "b" }] }));
  L.act(run, (l) => L.setFlame(l, "br", 2), { key: "flame", part: "br", level: 2 });
  L.advance(run, 240);
  const end = JSON.stringify(run.lab.vessels) + JSON.stringify(run.lab.tools), log = run.log.length;
  assert.ok(keys(run.log).includes("ignite"));
  L.seek(run, 1);
  assert.equal(L.reading(run.lab, "br").flame, 2);
  assert.equal(L.vessel(run.lab, "b").n["MgO(s)"], undefined);
  assert.ok(!keys(L.logAt(run)).includes("ignite"));
  L.toEnd(run);
  assert.equal(JSON.stringify(run.lab.vessels) + JSON.stringify(run.lab.tools), end);
  assert.equal(run.log.length, log);
});

// ================================================================ Meilenstein 3: Zeichnung, Effekte, Klang, Oberfläche

test("Zeichnung: Abdampfschale, Brenner und Kolbenprober, frei und am Gefäß", () => {
  const l = lab([
    { type: "dish", id: "s", contains: [{ reagent: "CuSO4 1M", ml: 20 }] },
    { type: "dish", id: "leer" },
    { type: "beaker", id: "b", contains: [{ reagent: "H2O", ml: 50 }] },
    { type: "testtube", id: "t", contains: [{ reagent: "HCl 1M", ml: 5 }] },
    { type: "burner", id: "b1", under: "s", flame: 2 }, { type: "burner", id: "b2", under: "t", flame: 1 }, { type: "burner", id: "b3" },
    { type: "syringe", id: "kp", in: "t" }, { type: "syringe", id: "kp2" }, { type: "thermometer", id: "th", in: "s" }, { type: "phmeter", id: "ph", in: "s" }
  ], { room: 20 });
  L.step(l, 2);
  for (const v of l.vessels) for (const numbers of [true, false]) clean(L.parts[v.type].draw(L.view(l, v), ctx({ numbers, lift: 104 })), v.id);
  assert.match(L.parts.dish.draw(look(l, "s"), ctx()), /cl-porcelain/);
  for (const t of l.tools) {
    const host = L.vessel(l, t.in), def = L.parts[t.type];
    const place = host ? (def.under ? def.stand(host) : L.parts[host.type].probe(host, t.type)) : null;
    clean(def.draw(L.reading(l, t.id), ctx(), place), t.id);
    assert.ok(def.width(t) > 30, t.id);
  }
  // Flamme: aus, leuchtend, rauschend
  const flame = (level) => L.parts.burner.draw({ flame: level, tint: null }, ctx());
  assert.doesNotMatch(flame(0), /cl-flame/);
  assert.match(flame(1), /cl-flame cl-luminous/);
  assert.match(flame(2), /cl-flame cl-roaring/);
  assert.match(L.parts.burner.draw({ flame: 2, tint: { rgb: [255, 210, 31] } }, ctx()), /style="fill:rgb\(255,210,31\)/, "Flammenfärbung: als style, denn das Stylesheet färbt die Flamme sonst blau");
  // unter Becherglas und Schale steht ein Dreifuß, das Reagenzglas hält eine Klemme; das Gefäß steht entsprechend höher
  assert.match(L.parts.burner.draw(L.reading(l, "b1"), ctx(), L.parts.burner.stand(L.vessel(l, "s"))), /cl-tripod/);
  assert.match(L.parts.burner.draw(L.reading(l, "b2"), ctx(), L.parts.burner.stand(L.vessel(l, "t"))), /cl-clamp/);
  assert.ok(L.parts.burner.stand(L.vessel(l, "s")).lift > 80);
  assert.doesNotMatch(L.parts.testtube.draw(look(l, "t"), ctx({ lift: 92 })), /cl-wood/, "kein Reagenzglasständer in der Luft");
  // der Kolben wandert mit dem Volumen
  const body = (value) => L.parts.syringe.draw({ value, unit: "mL" }, ctx(), L.parts.testtube.probe(L.vessel(l, "t"), "syringe"));
  const plunger = (svg) => +/class="cl-plunger" x="([\d.-]+)"/.exec(svg)[1];
  assert.ok(plunger(body(60)) > plunger(body(10)) + 20);
  assert.match(body(24.8), /24,8 mL/);
  assert.match(body(24.8), /cl-stopper/, "ein Stopfen verschließt das Gefäß");
  assert.doesNotMatch(L.parts.syringe.draw({ value: 24.8, unit: "mL" }, ctx({ numbers: false }), null), /24,8/);
});

test("Zeichnung: Dampf, Rückstand, Feuer, Scherben und der Span an der Öffnung", () => {
  const boil = heated({ type: "beaker", contains: [{ reagent: "H2O", ml: 50 }] });
  L.step(boil, 120);
  const hot = L.parts.beaker.draw(look(boil), ctx({ t: 3 }));
  assert.match(hot, /cl-steam/);
  assert.match(hot, /cl-bubble/);
  clean(hot, "siedendes Wasser");
  const dry = heated({ type: "testtube", contains: [{ reagent: "NaOH 1M", ml: 2 }] });
  L.step(dry, 200);
  assert.match(L.parts.testtube.draw(look(dry), ctx()), /cl-crust/, "Rückstand am Glas");
  const mg = burning("Mg ribbon", 0.104);
  until(mg, () => look(mg).fire.length > 0, 300);
  L.step(mg, 1);
  const fire = L.parts.dish.draw(look(mg), ctx({ t: 1 }));
  assert.match(fire, /cl-fire/);
  assert.match(fire, /cl-glare/);
  assert.match(fire, /cl-smoke" [^>]*style="fill:#f2f2ee"/, "weißer Rauch");
  assert.match(fire, /cl-glare-ray/, "Strahlen, damit das grelle Licht auch vor heller Wand zu sehen ist");
  clean(fire, "brennendes Magnesium");
  const s = burning("sulfur", 0.32);
  until(s, () => look(s).fire.length > 0, 300);
  L.step(s, 1);
  assert.doesNotMatch(L.parts.dish.draw(look(s), ctx({ t: 1 })), /cl-glare/, "Schwefel brennt ohne grelles Licht");
  // Proben erscheinen kurz an der Öffnung
  const marks = (list) => L.parts.testtube.draw(look(hydrogen()), ctx({ marks: list }));
  assert.match(marks([{ key: "splint", kind: "flame", result: "pop", level: 2, age: 0.1 }]), /cl-splint[\s\S]*cl-flash/);
  assert.doesNotMatch(marks([{ key: "splint", kind: "flame", result: "pop", level: 2, age: 1.2 }]), /cl-flash/, "der Blitz ist kurz");
  assert.match(marks([{ key: "splint", kind: "glow", result: "relight", level: 0, age: 0.5 }]), /cl-splint-flame/);
  assert.doesNotMatch(marks([{ key: "splint", kind: "flame", result: "out", level: 0, age: 0.5 }]), /cl-splint-flame/);
  assert.doesNotMatch(marks([]), /cl-splint/);
  // zersprungen
  const l = lab([{ type: "beaker", id: "b", ml: 600, contains: [{ reagent: "HCl 1M", ml: 100 }] }]);
  L.vessel(l, "b").air["H2(g)"] = 0.006;
  L.probe(l, "b", "flame");
  const broken = L.parts.beaker.draw(look(l), ctx());
  assert.match(broken, /cl-shard/);
  assert.doesNotMatch(broken, /cl-liquid/);
  // gerade der Knall, der das Glas zerstört, muss zu sehen sein (im Browser fehlte der Blitz über den Scherben)
  assert.match(L.parts.beaker.draw(look(l), ctx({ marks: [{ key: "splint", kind: "flame", result: "pop", level: 3, age: 0.1 }] })), /cl-flash/);
  assert.doesNotMatch(broken, /cl-flash/);
});

test("Effekte: Flamme, Dampf, Rauch und Feuer folgen der Uhr und halten bei „weniger Bewegung“ still", () => {
  const fx = L.fx;
  for (const [name, make] of Object.entries({
    flame: (t, still) => fx.flame(0, -50, 2, t, 1, still),
    steam: (t, still) => fx.steam(-30, 30, -90, 0.004, t, 1, still),
    smoke: (t, still) => fx.smoke(0, -20, 1, t, 1, still, "#f2f2ee"),
    fire: (t, still) => fx.fire(-30, 30, -2, [{ rate: 1e-4, color: "#ffffff", glare: 1, smoke: "#f2f2ee" }], t, 1, still)
  })) {
    clean(make(1.3, false), name);
    assert.equal(make(1.3, false), make(1.3, false), `${name}: gleiche Zeit, gleiches Bild`);
    assert.notEqual(make(1.3, false), make(1.4, false), `${name}: bewegt sich`);
    assert.equal(make(1.3, true), make(7.9, true), `${name}: steht still`);
  }
  assert.equal(fx.flame(0, -50, 0, 1, 1, false), "");
  assert.equal(fx.steam(-30, 30, -90, 0, 1, 1, false), "");
  assert.ok(fx.steam(-30, 30, -90, 0.01, 1, 1).split("<circle").length > fx.steam(-30, 30, -90, 0.0002, 1, 1).split("<circle").length, "mehr Dampf, mehr Schwaden");
  assert.equal(fx.flash(0, -100, 0.9, 2), "", "nach einer halben Sekunde ist der Blitz vorbei");
  assert.ok(fx.flash(0, -100, 0.1, 3).length > fx.flash(0, -100, 0.1, 1).length, "ein lauter Knall blitzt stärker");
});

// Nachgebautes Web Audio: merkt sich, was erzeugt und eingestellt wird
function audio() {
  const made = { ctx: 0, sources: 0, gains: [], closed: 0, resumed: 0 };
  const param = () => ({ value: 0, setTargetAtTime(v) { this.value = v; }, setValueAtTime(v) { this.value = v; }, linearRampToValueAtTime(v) { this.value = v; }, exponentialRampToValueAtTime(v) { this.value = v; } });
  const nodeOf = (more) => Object.assign({ connect(to) { return to; }, disconnect() {}, start() {}, stop() {} }, more);
  class Fake {
    constructor() { made.ctx++; this.currentTime = 0; this.sampleRate = 8000; this.state = "suspended"; this.destination = nodeOf(); }
    resume() { made.resumed++; this.state = "running"; }
    close() { made.closed++; }
    createBuffer(c, n) { return { getChannelData: () => new Float32Array(n) }; }
    createBufferSource() { made.sources++; return nodeOf({ buffer: null, loop: false, playbackRate: param() }); }
    createGain() { const g = nodeOf({ gain: param() }); made.gains.push(g); return g; }
    createBiquadFilter() { return nodeOf({ type: "", frequency: param(), Q: param() }); }
    createOscillator() { made.sources++; return nodeOf({ type: "", frequency: param() }); }
  }
  return { made, Fake };
}

test("Klang: Stimmen folgen dem Geschehen, Stumm schaltet sie ab, ohne Web Audio geht es auch", () => {
  assert.equal(L.fx.sound({}), null, "kein Web Audio: kein Klang, kein Fehler");
  const { made, Fake } = audio(), sound = L.fx.sound({ AudioContext: Fake });
  sound.set({ burner: 1, boil: 0, fizz: 0, fire: 0 });
  sound.shot("pop", 2);
  assert.equal(made.ctx, 0, "vor der ersten Bedienung entsteht nichts");
  sound.wake();
  assert.equal(made.ctx, 1);
  assert.equal(made.resumed, 1);
  sound.set({ burner: 1, boil: 0.5, fizz: 0, fire: 0 });
  assert.equal(made.sources, 2, "eine Stimme je Geräusch, das zu hören ist");
  assert.equal(made.gains.slice(1).filter((g) => g.gain.value > 0).length, 2);
  const before = made.sources;
  sound.shot("pop", 2);
  assert.ok(made.sources > before, "ein Knall ist ein eigener kurzer Klang");
  for (const name of ["pop", "hiss", "whoosh", "crash"]) for (const level of [0, 1, 2, 3]) sound.shot(name, level);
  sound.mute(true);
  sound.set({ burner: 1, boil: 1, fizz: 1, fire: 1 });
  const quiet = made.sources;
  sound.shot("pop", 3);
  assert.equal(made.sources, quiet, "stumm knallt nichts");
  sound.set({ burner: 1, boil: 1, fizz: 1, fire: 1 });
  sound.mute(false);
  sound.set({ burner: 0, boil: 0, fizz: 0, fire: 0 });
  sound.close();
  assert.equal(made.closed, 1);
  // was zu hören sein soll, folgt aus dem Zustand
  const l = heated({ type: "beaker", contains: [{ reagent: "H2O", ml: 20 }] });
  assert.deepEqual(L.fx.levels(l), { burner: 1, boil: 0, fizz: 0, fire: 0 });
  L.step(l, 60);
  assert.ok(L.fx.levels(l).boil > 0.2, JSON.stringify(L.fx.levels(l)));
  L.setFlame(l, "br", 1);
  assert.ok(L.fx.levels(l).burner > 0 && L.fx.levels(l).burner < 1, "die leuchtende Flamme ist leiser");
  const fizz = hydrogen();
  L.step(fizz, 5);
  assert.ok(L.fx.levels(fizz).fizz > 0.2);
  assert.deepEqual(L.fx.levels(lab([{ type: "beaker", id: "b" }])), { burner: 0, boil: 0, fizz: 0, fire: 0 });
});

test("Texte: Sieden, Eindampfen, Geruch, Feuer, Proben und Flammenfärbung als Satz", () => {
  const c = { lang: "de", numbers: true, names: { b: "Becherglas 1", br: "Brenner 1", kp: "Kolbenprober 1" } };
  const say = (e) => L.say(e, c);
  assert.equal(say({ key: "flame", part: "br", level: 2 }), "Brenner 1: Flamme auf „rauschend“ gestellt");
  assert.equal(say({ key: "flame", part: "br", level: 0 }), "Brenner 1: Flamme gelöscht");
  assert.equal(say({ key: "under", part: "br", vessel: "b" }), "Brenner 1 unter Becherglas 1 gestellt");
  assert.equal(say({ key: "joined", part: "kp", vessel: "b" }), "Kolbenprober 1 an Becherglas 1 angeschlossen");
  assert.equal(say({ key: "boil", vessel: "b" }), "Becherglas 1: Die Flüssigkeit siedet.");
  assert.equal(say({ key: "dry", vessel: "b", left: true }), "Becherglas 1: Die Flüssigkeit ist verdampft, ein fester Rückstand bleibt.");
  assert.equal(say({ key: "dry", vessel: "b", left: false }), "Becherglas 1: Die Flüssigkeit ist vollständig verdampft.");
  assert.equal(say({ key: "smell", vessel: "b", species: "NH3(g)" }), "Becherglas 1: Es riecht stechend nach Ammoniak.");
  assert.equal(say({ key: "ignite", vessel: "b", species: "Mg(s)" }), "Becherglas 1: Magnesium entzündet sich.");
  assert.equal(say({ key: "fireEnd", vessel: "b" }), "Becherglas 1: Das Feuer ist erloschen.");
  assert.equal(say({ key: "splint", vessel: "b", kind: "flame", result: "pop", level: 2 }), "Brennender Holzspan an Becherglas 1 gehalten: ein pfeifender Knall (Knallgasprobe positiv).");
  assert.equal(say({ key: "splint", vessel: "b", kind: "glow", result: "relight", level: 0 }), "Glimmspan an Becherglas 1 gehalten: er flammt auf (Sauerstoff).");
  assert.equal(say({ key: "splint", vessel: "b", kind: "flame", result: "out", level: 0 }), "Brennender Holzspan an Becherglas 1 gehalten: er erlischt.");
  assert.equal(say({ key: "pop", vessel: "b", level: 3 }), "Becherglas 1: Ein lauter Knall! Das Gas im Gefäß ist explodiert.");
  assert.equal(say({ key: "flameTest", vessel: "b", part: "br", name: "yellow" }), "Magnesiastäbchen aus Becherglas 1 in die Flamme gehalten: Sie leuchtet gelb.");
  assert.equal(say({ key: "flameTest", vessel: "b", part: "br", name: null }), "Magnesiastäbchen aus Becherglas 1 in die Flamme gehalten: keine Färbung.");
  assert.equal(say({ key: "broken", vessel: "b" }), "Becherglas 1 ist zersprungen!");
  assert.equal(say({ key: "syringeFull", part: "kp", vessel: "b" }), "Kolbenprober 1 ist voll.");
  assert.match(L.say({ key: "smell", vessel: "b", species: "NH3(g)" }, { lang: "en", names: c.names }), /pungent smell of ammonia/);
});

const hot = { room: 20, bench: [{ type: "beaker", id: "b", contains: [{ reagent: "H2O", ml: 50 }] }, { type: "thermometer", id: "th", in: "b" }],
  shelf: ["burner", "splint", "glowsplint", "rod", "syringe", "dish", "NaCl 0.1M", "Mg ribbon", "HCl 1M"] };

test("Brenner an der Fläche: unter ein Gefäß stellen, Flamme wählen, das Wasser siedet", () => {
  const el = mount(hot);
  const bench = () => state(el).run.lab;
  press(el, "hand", "burner");
  assert.match(part(el, ".cl-hand").innerHTML, /unter dem er stehen soll/);
  tap(el, "b");
  assert.deepEqual(bench().tools.filter((t) => t.type === "burner").map((t) => [t.in, t.flame]), [["b", 0]]);
  assert.match(logOf(el), /Brenner 1 unter Becherglas 1 gestellt/);
  assert.match(item(el, "burner1").innerHTML, /cl-tripod/);
  // die Nummern von Glas und Brenner stehen nebeneinander, nicht übereinander
  const badgeAt = (id) => /class="cl-badge" cx="(-?[\d.]+)"/.exec(item(el, id).innerHTML)[1];
  assert.notEqual(badgeAt("b"), badgeAt("burner1"));
  // das Becherglas steht nun höher, das Thermometer mit ihm
  const height = (id) => +/translate\([\d.]+,([\d.]+)\)/.exec(part(el, ".cl-svg").innerHTML.split(`data-id="${id}"`)[1])[1];
  assert.ok(height("b") < height("burner1") - 80, "das Gefäß steht über dem Brenner");
  assert.equal(height("th"), height("b"));
  tap(el, "burner1");
  assert.match(part(el, ".cl-panel").innerHTML, /data-act="flame" data-id="2"/);
  press(el, "flame", "2");
  assert.equal(L.reading(bench(), "burner1").flame, 2);
  assert.match(logOf(el), /Flamme auf „rauschend“ gestellt/);
  assert.match(item(el, "burner1").innerHTML, /cl-roaring/);
  assert.equal(item(el, "burner1").attributes["aria-label"], "Brenner 1 unter Becherglas 1: Flamme rauschend");
  assert.equal(part(el, ".cl-panel").querySelector('[data-act="flame"][data-id="2"]').attributes["aria-pressed"], "true");
  enter(el, "change", "speed", "20");
  frames(8);
  assert.ok(L.view(bench(), L.vessel(bench(), "b")).T > 99.9, "nach gut zwei Minuten siedet es");
  assert.match(logOf(el), /Die Flüssigkeit siedet/);
  assert.match(item(el, "b").innerHTML, /cl-steam/);
  assert.match(item(el, "b").attributes["aria-label"], /siedet/);
  assert.equal(state(el).play, 1, "solange der Brenner brennt, läuft die Uhr");
  press(el, "flame", "0");
  assert.match(logOf(el), /Flamme gelöscht/);
  // ein zweiter Brenner passt nicht unter dasselbe Glas, aber auf den Tisch
  press(el, "hand", "burner");
  tap(el, "b");
  assert.equal(part(el, ".cl-status").textContent, "Dieses Gefäß hat schon ein solches Gerät.");
  tap(el, null);
  assert.deepEqual(bench().tools.filter((t) => t.type === "burner").map((t) => t.in), ["b", null]);
  assert.equal(state(el).hand, null);
});

test("Proben an der Fläche: Span an die Öffnung, Stäbchen in die Flamme", () => {
  const el = mount({ room: 25, bench: [{ type: "testtube", id: "h", contains: [{ reagent: "HCl 1M", ml: 8 }, { reagent: "Mg ribbon", g: 0.052 }] },
    { type: "testtube", id: "na", contains: [{ reagent: "NaCl 0.1M", ml: 5 }] }, { type: "burner", id: "br" }], shelf: ["splint", "glowsplint", "rod"] });
  press(el, "play");
  frames(12);
  press(el, "hand", "splint");
  assert.match(part(el, ".cl-hand").innerHTML, /an dessen Öffnung/);
  tap(el, "h");
  assert.match(logOf(el), /Brennender Holzspan an Reagenzglas 1 gehalten: (es macht „plopp“|ein pfeifender Knall) \(Knallgasprobe positiv\)\./);
  assert.match(item(el, "h").innerHTML, /cl-splint/);
  assert.match(item(el, "h").innerHTML, /cl-flash/);
  assert.equal(state(el).hand.id, "splint", "der Span bleibt in der Hand");
  frames(3);
  assert.doesNotMatch(item(el, "h").innerHTML, /cl-splint/, "nach kurzer Zeit ist er wieder weg");
  // Flammenfärbung braucht die rauschende Flamme
  press(el, "hand", "rod");
  tap(el, "na");
  assert.equal(part(el, ".cl-status").textContent, "Dafür muss ein Brenner mit rauschender Flamme brennen.");
  tap(el, "br");
  press(el, "flame", "2");
  tap(el, "na");
  assert.match(logOf(el), /Magnesiastäbchen aus Reagenzglas 2 in die Flamme gehalten: Sie leuchtet gelb\./);
  assert.match(item(el, "br").innerHTML, /style="fill:rgb\(255,210,31\)/);
  frames(6);
  assert.doesNotMatch(item(el, "br").innerHTML, /rgb\(255,210,31\)/, "die Färbung vergeht");
});

test("Kolbenprober an der Fläche: Anzeige am Gerät und Kurve des Gasvolumens", () => {
  const el = mount({ room: 25, bench: [{ type: "testtube", id: "h", contains: [{ reagent: "HCl 1M", ml: 8 }] }], shelf: ["syringe", "Mg ribbon"] });
  press(el, "hand", "syringe");
  tap(el, "h");
  assert.match(logOf(el), /Kolbenprober 1 an Reagenzglas 1 angeschlossen/);
  press(el, "hand", "Mg ribbon");
  tap(el, "h");
  enter(el, "change", "speed", "20");
  frames(10);
  const value = L.reading(state(el).run.lab, "syringe1").value;
  assert.ok(value > 5, `${value} mL`);
  assert.match(item(el, "syringe1").attributes["aria-label"], /^Kolbenprober 1 an Reagenzglas 1: \d+,\d mL$/);
  assert.match(part(el, ".cl-charts").innerHTML, /Gasvolumen in mL/);
  assert.match(item(el, "syringe1").innerHTML, /cl-stopper/);
});

test("Ton an der Fläche: beginnt mit der ersten Bedienung, folgt dem Versuch, lässt sich stumm schalten", () => {
  const { made, Fake } = audio();
  globalThis.AudioContext = Fake;
  try {
    const el = mount(hot);
    assert.match(el.innerHTML, /data-act="sound"/);
    assert.equal(made.ctx, 0, "vor der ersten Bedienung kein Ton");
    press(el, "hand", "burner");
    tap(el, "b");
    tap(el, "burner1");
    press(el, "flame", "2");
    assert.equal(made.ctx, 1);
    frames(1);
    const voices = () => made.gains.slice(1).filter((g) => g.gain.value > 0).length;
    assert.ok(voices() >= 1, "der Brenner rauscht");
    press(el, "play");
    assert.equal(state(el).play, 0);
    assert.equal(voices(), 0, "angehalten ist es still");
    press(el, "play");
    frames(1);
    assert.ok(voices() >= 1);
    press(el, "sound");
    assert.equal(state(el).mute, true);
    frames(1);
    assert.equal(voices(), 0, "stumm");
    assert.equal(part(el, ".cl-sound").attributes["aria-pressed"], "false");
    press(el, "sound");
    frames(1);
    assert.ok(voices() >= 1, "wieder an");
    el.isConnected = false;                                   // die Folie ist weg
    frames(1);
    assert.equal(made.closed, 1, "verlässt man die Folie, endet der Ton");
  } finally { delete globalThis.AudioContext; }
  assert.doesNotMatch(mount(hot).innerHTML, /data-act="sound"/, "ohne Web Audio gibt es keinen Knopf");
});

test("Zersprungenes Glas an der Fläche: Scherben, Hinweis beim Zugeben, nur noch wegräumen", () => {
  const el = mount({ bench: [{ type: "beaker", id: "b", ml: 600, contains: [{ reagent: "HCl 1M", ml: 100 }] }], shelf: ["splint", "H2O"] });
  state(el).run.lab.vessels[0].air["H2(g)"] = 0.006;
  press(el, "hand", "splint");
  tap(el, "b");
  assert.match(logOf(el), /ein lauter Knall/);
  assert.match(logOf(el), /Becherglas 1 ist zersprungen!/);
  assert.match(item(el, "b").innerHTML, /cl-shard/);
  assert.match(item(el, "b").attributes["aria-label"], /zersprungen/);
  press(el, "hand", "H2O");
  tap(el, "b");
  assert.equal(part(el, ".cl-status").textContent, "Dieses Gefäß ist zersprungen.");
  press(el, "hand", "H2O");
  tap(el, "b");
  assert.doesNotMatch(part(el, ".cl-panel").innerHTML, /data-act="empty"|data-act="pour"/);
  assert.match(part(el, ".cl-panel").innerHTML, /data-act="remove"/);
});

// ================================================================ Befunde des Belastungstests, Meilenstein 3

// kein Feststoff ist übersättigt, und keiner liegt in einer Lösung, die ihn lösen müsste
const settled = (l, id) => {
  const v = L.vessel(l, id || "b"), vol = L.volume(v), T = v.T + 273.15, off = [];
  for (const e of L.db.equilibria.filter((x) => x.solid)) {
    const ions = Object.entries(e.d), here = ions.every(([sp]) => v.n[sp] > 0);
    const logQ = here ? ions.reduce((sum, [sp, nu]) => sum + nu * Math.log10(v.n[sp] / vol * L.gamma(l, v.id, sp)), 0) : -Infinity;
    const h = L.heatOf(e.text), logK = e.logK * e.f - (h == null ? 0 : h * e.f * 1000 / (8.314462618 * Math.LN10) * (1 / T - 1 / 298.15));
    if (logQ - logK > 0.01) off.push(`${e.solid} übersättigt um 10^${(logQ - logK).toFixed(2)}`);
    if (v.n[e.solid] > 0 && logQ - logK < -0.01) off.push(`${e.solid} bleibt liegen`);
  }
  return off;
};

test("Viele Niederschläge zugleich: auch wenn nicht alle nebeneinander bestehen können, findet der Löser ein Gleichgewicht", () => {
  // Calcium und Kupfer, Hydroxid und Carbonat: vier Feststoffe aus drei Bausteinen können nicht alle gesättigt sein
  const l = tubeOf([{ reagent: "CaCl2 1M", ml: 3 }, { reagent: "CuSO4 1M", ml: 1 }]);
  L.add(l, "b", "Na2CO3 1M", { ml: 2 });
  L.add(l, "b", "NaOH 1M", { ml: 4 });
  L.step(l, 300);
  assert.equal(l.failed || 0, 0, "jedes Gleichgewicht ließ sich berechnen");
  assert.deepEqual(settled(l), []);
  near(totals(l).charge, 0, 1e-9, "Ladung");
  // dasselbe in wenig Flüssigkeit über Feststoffen aus dem Regal und einem eingedampften Rest
  const d = lab([{ type: "dish", id: "b", contains: [{ reagent: "marble", g: 0.06 }, { reagent: "Mg ribbon", g: 0.07 }] }], { room: 26 });
  for (const [reagent, ml] of [["CaCl2 0.1M", 0.2], ["NaOH 1M", 0.05], ["CuSO4 0.01M", 0.1], ["Na2CO3 0.01M", 0.1], ["CH3COOH 0.1M", 0.2], ["Na2SO4 0.1M", 0.1]]) {
    L.add(d, "b", reagent, { ml });
    L.step(d, 20);
  }
  L.step(d, 600);
  assert.equal(d.failed || 0, 0, "auch dort");
});

test("Ruhe: ein Rest gelösten Gases und ein Hauch von Reaktion halten die Uhr nicht stundenlang am Laufen", () => {
  // Kohlenstoffdioxid perlt aus, kühlt dabei die Lösung, und beim Aufwärmen perlt wieder etwas aus: das klingt ab
  const l = beaker([{ reagent: "Na2CO3 1M", ml: 10 }], { room: 25 });
  L.add(l, "b", "HCl 1M", { ml: 25 });
  let t = 0;
  while (!L.atRest(l) && t < 3000) { L.step(l, 10); t += 10; }
  assert.ok(t < 3000, "nach dem Sprudeln kommt der Versuch zur Ruhe");
  // Magnesium in einem Puffer: es löst sich so langsam, dass nichts mehr zu sehen ist
  const mg = beaker([{ reagent: "CH3COOH 0.1M", ml: 20 }, { reagent: "CH3COONa 1M", ml: 20 }, { reagent: "Mg ribbon", g: 0.05 }], { room: 25 });
  L.step(mg, 3000);
  assert.ok(look(mg).gas < 1e-9, "keine sichtbare Gasentwicklung");
  assert.equal(L.atRest(mg), true);
});

test("Spuren: ein Stoff, der bis auf einen unmessbaren Rest zerfallen ist, bringt die Rechnung nicht zum Scheitern", () => {
  // Wasserstoffperoxid zerfällt am Braunstein exponentiell: nach langer Zeit bleibt weniger als ein Molekül
  const l = lab([{ type: "testtube", id: "b", contains: [{ reagent: "H2O2 0.01M", ml: 5 }, { reagent: "NaCl 0.1M", ml: 2 }] }], { room: 25 });
  L.add(l, "b", "MnO2", { g: 0.5 });
  L.step(l, 4000);
  assert.equal(l.failed || 0, 0, "jedes Gleichgewicht ließ sich berechnen");
  assert.equal(amount(l, "H2O2(aq)"), 0, "der Rest ist verschwunden, statt ewig weiterzuzerfallen");
  near(gasOf(l, "O2(g)"), 2.5e-5, 1e-9, "aller Sauerstoff ist entstanden");
  assert.equal(L.atRest(l), true);
});

test("Viele Niederschläge zugleich: auch zwei solche Abhängigkeiten auf einmal lassen sich auflösen", () => {
  // aus dem Belastungstest: sieben Feststoffe in wenig Wasser, zwischen denen zwei Abhängigkeiten zugleich bestehen
  const mud = lab([{ type: "beaker", id: "b", ml: 250 }], { room: 28 }), glass = L.vessel(mud, "b");
  glass.n = { "Cu(OH)2(s)": 4.42e-13, "CaCO3(s)": 0.00101, "CaSO4*2H2O(s)": 0.0000753, "Ca(OH)2(s)": 7.36e-12, "CuCO3(s)": 3.67e-15, "H2O(l)": 0.0609, "BaSO4(s)": 0.00000875, "BaCO3(s)": 9.17e-7 };
  glass.lumps = Object.keys(glass.n).filter((id) => /\(s\)$/.test(id)).map((id) => ({ id, n: glass.n[id], n0: glass.n[id], a0: 1, p: 2 / 3, made: true, settled: 1 }));
  glass.dirty = true;
  L.step(mud, 600);
  assert.equal(mud.failed || 0, 0, "jedes Gleichgewicht ließ sich berechnen");
  assert.deepEqual(settled(mud), []);
  // Calcium, Kupfer und Barium mit Hydroxid, Carbonat und Sulfat: mehr mögliche Feststoffe, als nebeneinander bestehen können
  const l = beaker([{ reagent: "CaCl2 1M", ml: 4 }, { reagent: "CuSO4 0.1M", ml: 4 }, { reagent: "BaCl2 0.1M", ml: 4 }, { reagent: "FeCl3 0.1M", ml: 1 }, { reagent: "AgNO3 0.1M", ml: 1 }], { room: 28 });
  for (const [reagent, ml] of [["Na2CO3 1M", 3], ["NaOH 1M", 3], ["Na2SO4 1M", 2], ["NH3 1M", 1], ["NaHCO3 1M", 3], ["HCl 1M", 4], ["Na2CO3 1M", 2], ["KSCN 0.1M", 2]]) {
    L.add(l, "b", reagent, { ml });
    L.step(l, 15);
    assert.equal(l.failed || 0, 0, `nach ${reagent}`);
  }
  L.step(l, 2000);
  assert.equal(l.failed || 0, 0);
  assert.deepEqual(settled(l), []);
});

// ================================================================ Befunde der Durchsicht, Meilenstein 3

test("Brenner unter einem Gefäß mit Wasserstoff: eine Verpuffung, danach brennt das Gas ruhig an der Öffnung ab", () => {
  const l = hydrogen([{ type: "burner", id: "br", under: "b", flame: 2 }]), before = totals(l).mass, seen = [];
  L.step(l, 20, (e) => seen.push(e));
  assert.equal(look(l).torch, true, "an der Öffnung brennt eine Flamme");
  L.step(l, 100, (e) => seen.push(e));
  assert.equal(seen.filter((e) => e.key === "pop").length, 1, "es knallt einmal, nicht jede Sekunde");
  assert.ok(gasOf(l, "H2(g)") < 0.2 * 0.052 / 24.305, "der Wasserstoff ist verbrannt");
  assert.equal(look(l).torch, false, "ohne Gas erlischt sie");
  near(totals(l).mass, before, 1e-9, "Masse");
  assert.match(L.parts.testtube.draw(Object.assign(look(l), { torch: true }), ctx({ lift: 92 })), /cl-torch/);
});

test("Flüssigkeit in ein glühend heißes Gefäß: sie verdampft, gerechnet wird aber nie mit einer Lösung über 100 °C", () => {
  const l = heated({ type: "beaker" });
  L.step(l, 600);
  L.setFlame(l, "br", 0);
  L.add(l, "b", "NaCl 1M", { ml: 20 });
  const seen = collect(l, 60);
  assert.ok(!seen.some((e) => e.key === "smell"), "aus Kochsalzlösung entweicht kein Chlorwasserstoff");
  assert.equal(gasOf(l, "HCl(g)"), 0);
  assert.ok(keys(seen).filter((k) => k === "dry").length <= 1, "höchstens einmal „eingedampft“");
  L.add(l, "b", "H2O", { ml: 20 });
  L.step(l, 60);
  near(amount(l, "H+(aq)") / amount(l, "OH-(aq)"), 1, 0.01, "die Kochsalzlösung ist neutral geblieben");
  assert.equal(l.failed || 0, 0);
});

test("Verbrennung: das Gefäß wird nicht heißer als die Flamme, auch mit viel Brennstoff", () => {
  for (const [reagent, g] of [["charcoal", 5], ["sulfur", 5], ["Mg ribbon", 5]]) {
    const l = heated({ type: "testtube", contains: [{ reagent, g }] });
    let top = 0;
    for (let t = 0; t < 900; t += 5) { L.step(l, 5); top = Math.max(top, look(l).T); }
    assert.ok(top > 400 && top < 1200, `${reagent}: höchstens ${top.toFixed(0)} °C`);
  }
});

test("Ein Tropfen auf einen Rückstand: zu wenig Flüssigkeit löst ihn nicht, und die Rechnung scheitert nicht", () => {
  const l = heated({ type: "dish", contains: [{ reagent: "NaOH 1M", ml: 20 }] }), seen = [];
  const t = until(l, () => keys(seen).includes("dry"), 900, seen);
  // die Wärme zum Verdampfen wird bis zum letzten Rest aufgebracht: 1,1 mol Wasser brauchen 45 kJ, die Flamme gibt höchstens 203 W
  assert.ok(t > 250 && t < 600, `trocken nach ${t} s`);
  L.setFlame(l, "br", 0);
  L.step(l, 2500);
  L.add(l, "b", "PP", { drops: 1 });
  L.step(l, 30);
  assert.equal(l.failed || 0, 0, "jedes Gleichgewicht ließ sich berechnen");
  assert.equal(look(l).pH, null, "in dem Brei gibt es keinen pH-Wert zu messen");
  assert.ok(look(l).residue > 0.03, "der Rückstand ist noch da");
  assert.equal(L.atRest(l), true);
  L.add(l, "b", "H2O", { ml: 20 });
  L.step(l, 30);
  near(look(l).pH, 14.17, 0.1, "mit genug Wasser wieder Natronlauge");
  assert.equal(look(l).residue, 0);
  assert.equal(l.failed || 0, 0);
});

test("Probe in Ruhe: die Uhr läuft für die Dauer der Probe, dann steht sie wieder und der Span ist fort", () => {
  const l = beaker([{ reagent: "H2O", ml: 50 }]);
  assert.equal(L.atRest(l), true);
  assert.equal(L.probe(l, "b", "glow").result, "glow");
  assert.equal(L.atRest(l), false);
  L.step(l, 2.5);
  assert.equal(L.atRest(l), true);
  const el = mount({ bench: [{ type: "beaker", id: "b", contains: [{ reagent: "H2O", ml: 50 }] }], shelf: ["glowsplint"] });
  press(el, "hand", "glowsplint");
  tap(el, "b");
  assert.match(item(el, "b").innerHTML, /cl-splint/);
  frames(4);
  assert.doesNotMatch(item(el, "b").innerHTML, /cl-splint/, "er bleibt nicht im Bild stehen");
  assert.equal(state(el).play, 0);
});

test("Langsame Gasentwicklung: solange die Uhr deshalb läuft, sind auch Blasen zu sehen", () => {
  const l = tubeOf([{ reagent: "CH3COOH 0.1M", ml: 8 }]);
  L.add(l, "b", "Mg ribbon", { g: 0.052 });
  const seen = collect(l, 600);
  assert.equal(L.atRest(l), false);
  assert.ok(look(l).gas > 2e-9 && look(l).gas < 1e-7, `Gas ${look(l).gas} mol/s`);
  assert.ok(keys(seen).includes("gas"), "die Blasen stehen im Protokoll");
  assert.ok(L.fx.count(look(l).gas) >= 1, "und im Bild");
  assert.equal(L.fx.count(5e-10), 0, "darunter nicht");
});

test("Kolbenprober: beginnt nach dem Ausleeren bei null, verschließt das Gefäß, und ohne Luft brennt darin nichts", () => {
  const l = lab([{ type: "testtube", id: "b", contains: [{ reagent: "HCl 1M", ml: 8 }, { reagent: "Mg ribbon", g: 0.0243 }] }, { type: "syringe", id: "kp", in: "b" }], { room: 25 });
  L.step(l, 300);
  assert.ok(L.reading(l, "kp").value > 24);
  L.empty(l, "b");
  L.step(l, 1);
  assert.equal(L.reading(l, "kp").value, 0, "eine neue Probe: er zählt von vorn");
  assert.equal(L.probe(l, "b", "flame"), null, "an ein verschlossenes Gefäß lässt sich kein Span halten");
  L.remove(l, "kp");
  assert.equal(L.probe(l, "b", "flame").result, "calm");
  const c = lab([{ type: "testtube", id: "b", contains: [{ reagent: "charcoal", g: 0.1 }] }, { type: "burner", id: "br", under: "b", flame: 2 }, { type: "syringe", id: "kp", in: "b" }], { room: 25 });
  L.step(c, 600);
  assert.equal(gasOf(c, "CO2(g)"), 0, "verschlossen fehlt die Luft");
  assert.equal(L.reading(c, "kp").value, 0);
  L.remove(c, "kp");
  L.step(c, 600);
  near(gasOf(c, "CO2(g)"), 0.1 / 12.011, 1e-9, "offen verbrennt die Kohle");
});

test("Eindampfen: Ammoniak, Essigsäure und Wasserstoffperoxid verdampfen ohne Rückstand", () => {
  for (const [reagent, gas] of [["NH3 1M", "NH3(g)"], ["CH3COOH 1M", "CH3COOH(g)"], ["H2O2 1M", null]]) {
    const l = heated({ type: "testtube", contains: [{ reagent, ml: 5 }] }), seen = collect(l, 300);
    const dry = seen.find((e) => e.key === "dry");
    assert.ok(dry && dry.left === false, `${reagent}: kein fester Rückstand`);
    assert.deepEqual(Object.keys(L.vessel(l, "b").n), [], reagent);
    if (gas) near(gasOf(l, gas), 0.005, 1e-4, reagent);
    assert.equal(l.failed || 0, 0);
  }
});

test("Knallgasprobe braucht Luft: Wasserstoff in Kohlenstoffdioxid knallt nicht", () => {
  const l = beaker([{ reagent: "H2O", ml: 20 }]), v = L.vessel(l, "b"), room = L.headroom(l, v);
  v.air = { "H2(g)": 0.1 * room, "CO2(g)": 0.9 * room };
  assert.equal(L.probe(l, "b", "flame").result, "out", "ohne Sauerstoff erlischt der Span");
  v.air = { "H2(g)": 0.9 * room };
  assert.equal(L.probe(l, "b", "flame").result, "burn", "fast reiner Wasserstoff brennt ruhig an der Öffnung ab");
});

test("Thermometer: über 110 °C zeigt es das Ende seiner Skala", () => {
  const l = lab([{ type: "testtube", id: "b" }, { type: "thermometer", id: "th", in: "b" }, { type: "burner", id: "br", under: "b", flame: 2 }], { room: 20 });
  L.step(l, 300);
  assert.ok(look(l).T > 400);
  assert.equal(L.reading(l, "th").value, 110);
  assert.match(L.parts.thermometer.draw(L.reading(l, "th"), ctx(), L.parts.testtube.probe(L.vessel(l, "b"), "thermometer")), /&gt; 110 °C/);
  const el = mount({ room: 20, bench: [{ type: "testtube", id: "b" }, { type: "thermometer", id: "th", in: "b" }, { type: "burner", id: "br", under: "b", flame: 2 }] });
  press(el, "play");
  enter(el, "change", "speed", "20");
  frames(15);
  assert.equal(item(el, "th").attributes["aria-label"], "Thermometer 1 in Reagenzglas 1: > 110 °C");
});

test("Aufzeichnung: Gasraum, Flammenfärbung, Kolbenprober und Scherben beim Zurückspulen; ein Eingriff in der Vergangenheit setzt dort neu an", () => {
  const run = L.createRun(L.normalize({ room: 25, bench: [
    { type: "beaker", id: "b", ml: 600, contains: [{ reagent: "HCl 2M", ml: 100 }] }, { type: "testtube", id: "t", contains: [{ reagent: "HCl 1M", ml: 8 }] },
    { type: "syringe", id: "kp", in: "t" }, { type: "testtube", id: "na", contains: [{ reagent: "NaCl 0.1M", ml: 5 }] }, { type: "burner", id: "br", flame: 2 }] }));
  const glass = () => L.vessel(run.lab, "b");
  L.act(run, (l) => L.add(l, "t", "Mg ribbon", { g: 0.052 }));
  L.act(run, (l) => L.add(l, "b", "Mg ribbon", { g: 0.8 }));
  L.advance(run, 10);
  const mid = { h2: glass().air["H2(g)"], kp: L.reading(run.lab, "kp").value };
  assert.ok(mid.h2 > 0 && mid.kp > 0);
  L.act(run, (l, emit) => L.flameTest(l, "na", emit));
  L.advance(run, 10);
  assert.equal(L.reading(run.lab, "br").tint, null);
  L.act(run, (l, emit) => L.probe(l, "b", "flame", emit));
  assert.equal(glass().broken, true, "so viel Knallgas zerstört das Glas");
  L.advance(run, 5);
  L.seek(run, 10);
  assert.equal(glass().broken, false);
  near(glass().air["H2(g)"], mid.h2, 1e-12, "Gasraum");
  near(L.reading(run.lab, "kp").value, mid.kp, 1e-9, "Kolbenprober");
  L.seek(run, 11);
  assert.deepEqual(L.reading(run.lab, "br").tint.rgb, [255, 210, 31], "die Flamme ist wieder gelb");
  L.seek(run, 23);
  assert.equal(glass().broken, true);
  assert.deepEqual(Object.keys(glass().n), []);
  // bei 10 s den Kolbenprober wegnehmen: das Spätere, auch der Knall, ist verworfen
  L.seek(run, 10);
  L.act(run, (l) => L.remove(l, "kp"));
  assert.equal(run.end, 10);
  assert.ok(!keys(run.log).includes("broken") && !keys(run.log).includes("splint"));
  L.advance(run, 12);
  assert.equal(glass().broken, false);
  assert.equal(L.tool(run.lab, "kp"), null);
});

test("Oberfläche nach dem Knall: das Feld zeigt die Scherben, und beim Zurückspulen wieder das ganze Glas", () => {
  const el = mount({ bench: [{ type: "beaker", id: "b", ml: 600, contains: [{ reagent: "HCl 1M", ml: 100 }] }], shelf: ["splint"] });
  tap(el, "b");
  assert.match(part(el, ".cl-panel").innerHTML, /data-act="empty"/);
  state(el).run.lab.vessels[0].air["H2(g)"] = 0.006;
  press(el, "hand", "splint");
  tap(el, "b");
  assert.equal(L.view(state(el).run.lab, state(el).run.lab.vessels[0]).broken, true);
  assert.doesNotMatch(part(el, ".cl-panel").innerHTML, /data-act="empty"/, "nach dem Knall gibt es nichts mehr auszuleeren");
  frames(2);
  enter(el, "input", "seek", "0");
  assert.match(part(el, ".cl-panel").innerHTML, /data-act="empty"/, "zurückgespult ist das Glas wieder ganz");
  assert.match(item(el, "b").innerHTML, /cl-liquid/);
});

test("Bedienung des Brenners: mit der Tastatur auf den Tisch, und mit dem Stäbchen in der Hand lässt er sich anzünden", () => {
  const el = mount({ bench: [{ type: "beaker", id: "b", contains: [{ reagent: "NaCl 0.1M", ml: 20 }] }, { type: "burner", id: "br", under: "b" }], shelf: ["burner", "rod"] });
  press(el, "hand", "burner");
  assert.match(part(el, ".cl-hand").innerHTML, /data-act="bench"/, "ein Knopf stellt ihn auf den Tisch, auch ohne Zeiger");
  press(el, "bench");
  assert.deepEqual(state(el).run.lab.tools.map((t) => t.in), ["b", null]);
  assert.equal(state(el).hand, null);
  press(el, "hand", "rod");
  tap(el, "br");
  assert.equal(state(el).sel, "br", "der Brenner unter dem Glas lässt sich auswählen");
  press(el, "flame", "2");
  tap(el, "b");
  assert.match(logOf(el), /Sie leuchtet gelb/);
});

test("Eindampfen: auch mit Spuren im Rückstand bleibt elektrisch neutral, was im Gefäß liegt", () => {
  // eine Spur Kaliumbromid in viel Kaliumthiocyanat: geht das Bromid mit dem Dampf fort, dann mit seinem Gegenion
  const l = heated({ type: "dish", contains: [{ reagent: "KSCN 2M", ml: 20 }, { reagent: "KBr 0.001M", drops: 1 }] }), seen = [];
  until(l, () => keys(seen).includes("dry"), 900, seen);
  assert.ok(keys(seen).includes("dry"));
  let charge = 0;
  for (const [id, n] of Object.entries(L.vessel(l, "b").n)) charge += n * L.species(id).charge;
  near(charge, 0, 1e-12, "Ladung im Gefäß");
  near(totals(l).charge, 0, 1e-12, "Ladung insgesamt");
  assert.equal(amount(l, "Br-(aq)"), 0, "die Spur ist fort");
  near(amount(l, "K+(aq)"), amount(l, "SCN-(aq)"), 1e-12, "zurück bleibt Kaliumthiocyanat");
});

// ================================================================ Meilenstein 4: Elektrochemie

const couple = (text) => L.db.couples.find((c) => c.text === text);

test("Redoxpaare: Elektronenzahl, oxidierte und reduzierte Seite, Standardpotential", () => {
  const cu = couple("Cu^2+(aq) + 2 e- <=> Cu(s)");
  assert.equal(cu.n, 2);
  assert.deepEqual(cu.ox, [{ id: "Cu^2+(aq)", n: 1 }]);
  assert.deepEqual(cu.red, [{ id: "Cu(s)", n: 1 }]);
  near(cu.E0, 0.340, 0.003, "Kupfer");
  near(couple("Zn^2+(aq) + 2 e- <=> Zn(s)").E0, -0.763, 0.002, "Zink");
  near(couple("Ag+(aq) + e- <=> Ag(s)").E0, 0.799, 0.002, "Silber");
  assert.equal(couple("2 H+(aq) + 2 e- <=> H2(g)").E0, 0, "Wasserstoff ist der Bezugspunkt");
  near(couple("O2(g) + 4 H+(aq) + 4 e- <=> 2 H2O(l)").E0, 1.229, 0.002, "Sauerstoff");
  // dieselben Vorgänge, in Lauge geschrieben: um 14 · 0,0592 V verschoben
  near(couple("2 H2O(l) + 2 e- <=> H2(g) + 2 OH-(aq)").E0, -0.828, 0.002);
  near(couple("O2(g) + 2 H2O(l) + 4 e- <=> 4 OH-(aq)").E0, 0.401, 0.002);
  assert.deepEqual(couple("O2(g) + 4 H+(aq) + 4 e- <=> 2 H2O(l)").ox.map((t) => t.id), ["O2(g)", "H+(aq)"], "die Elektronen zählen nicht zu den Stoffen");
});

test("Redoxpaare: die Spannungsreihe der Metalle steht in der bekannten Reihenfolge", () => {
  const row = ["Mg^2+(aq) + 2 e- <=> Mg(s)", "Zn^2+(aq) + 2 e- <=> Zn(s)", "Fe^2+(aq) + 2 e- <=> Fe(s)", "2 H+(aq) + 2 e- <=> H2(g)",
    "Cu^2+(aq) + 2 e- <=> Cu(s)", "Ag+(aq) + e- <=> Ag(s)"].map((text) => couple(text).E0);
  assert.deepEqual(row.slice().sort((a, b) => a - b), row);
});

test("Redoxpaare: Fehler in eigenen Daten werden genannt, und nichts davon wird übernommen", () => {
  const bad = (pack, pattern, label) => assert.throws(() => L.register(pack), (e) => e.code === "data" && pattern.test(e.detail), label);
  const lead = { "Pb(s)": { name: { de: "Blei" }, Hf: 0, src: "Test" }, "Pb^2+(aq)": { name: { de: "Blei(II)-Ion" }, Hf: 0.92, src: "Test" } };
  bad({ species: lead, couples: [{ eq: "Pb^2+(aq) + 2 e- <=> Pb(s)", src: "x" }] }, /E0/, "ohne Standardpotential");
  bad({ species: lead, couples: [{ eq: "Pb^2+(aq) + e- <=> Pb(s)", E0: -0.126, src: "x" }] }, /balance/, "die Ladung geht nicht auf");
  bad({ species: lead, couples: [{ eq: "Pb^2+(aq) + 2 OH-(aq) <=> Pb(s) + H2O(l) + O2(g)", E0: -0.126, src: "x" }] }, /balance|couple/, "ohne Elektronen");
  bad({ couples: [{ eq: "Pb^2+(aq) + 2 e- <=> Pb(s)", E0: -0.126, src: "x" }] }, /species/, "unbekannte Stoffe");
  bad({ species: lead, couples: [{ eq: "Pb^2+(aq) + 2 e- <=> Pb(s)", E0: -0.126, over: "viel", src: "x" }] }, /over/, "Überspannung als Text");
  assert.equal(L.db.species["Pb(s)"], undefined);
  assert.ok(L.lint({ couples: [{ eq: "Pb^2+(aq) + 2 e- <=> Pb(s)", E0: -0.126 }] }).some((x) => /src/.test(x)), "ohne Quelle");
});

test("Redoxpaare: als Oxidation geschrieben ist es dasselbe Paar", () => {
  assert.throws(() => L.register({ couples: [{ eq: "Cu(s) <=> Cu^2+(aq) + 2 e-", E0: 0.5, src: "x" }] }),
    (e) => e.code === "data" && /exists/.test(e.detail), "ein anderer Wert für ein Paar, das es schon gibt");
  L.register({ couples: [L.core.couples.find((c) => /^Cu\^2\+\(aq\) \+ 2 e-/.test(c.eq))] });      // derselbe Eintrag noch einmal: in Ordnung
});

test("Redoxpaare: die Reaktionswärme einer Redoxreaktion folgt nach Hess aus den Stoffdaten", () => {
  near(L.heatOf("Zn(s) + Cu^2+(aq) -> Zn^2+(aq) + Cu(s)"), -218.3, 0.1, "Zink in Kupfersulfat, kJ/mol");
  near(L.heatOf("Zn(s) + 2 H+(aq) -> Zn^2+(aq) + H2(g)"), -153.4, 0.1, "Zink in Säure");
  near(L.heatOf("Cu(s) + 2 Ag+(aq) -> Cu^2+(aq) + 2 Ag(s)"), -146.7, 0.1, "Kupfer in Silbernitrat");
});

// Leitfähigkeit einer Lösung im Becherglas in mS/cm
const kappa = (contains, more) => L.conductivity(beaker(contains, Object.assign({ room: 25 }, more)), "b");

test("Leitfähigkeit: folgt aus den Ionen, ihrer Ladung und ihrer Beweglichkeit", () => {
  near(kappa([{ reagent: "HCl 0.01M", ml: 50 }]), 4.26, 0.03, "Salzsäure 0,01 mol/L");
  near(kappa([{ reagent: "NaCl 0.01M", ml: 50 }]), 1.263, 0.01, "Kochsalzlösung");
  near(kappa([{ reagent: "NaOH 0.01M", ml: 50 }]), 2.479, 0.02, "Natronlauge");
  near(kappa([{ reagent: "NaCl 0.1M", ml: 50 }]) / kappa([{ reagent: "NaCl 0.01M", ml: 50 }]), 10, 0.01, "zehnfache Konzentration, zehnfache Leitfähigkeit");
});

test("Leitfähigkeit: reines Wasser und Zuckerlösung leiten fast nicht, eine schwache Säure schlechter als eine starke", () => {
  near(kappa([{ reagent: "H2O", ml: 50 }]) * 1000, 0.055, 0.002, "reines Wasser bei 25 °C in µS/cm");
  near(kappa([{ reagent: "sugar 0.5M", ml: 50 }]) * 1000, 0.055, 0.002, "Zucker bildet keine Ionen");
  near(kappa([{ reagent: "CH3COOH 0.1M", ml: 50 }]), 0.513, 0.01, "Essigsäure 0,1 mol/L");
  assert.ok(kappa([{ reagent: "HCl 0.1M", ml: 50 }]) > 50 * kappa([{ reagent: "CH3COOH 0.1M", ml: 50 }]));
  assert.ok(kappa([{ reagent: "NaCl 0.01M", ml: 50 }], { room: 35 }) > 1.15 * kappa([{ reagent: "NaCl 0.01M", ml: 50 }]), "warm leitet besser");
});

test("Leitfähigkeitsmessgerät: zeigt mS/cm und folgt beim Verdünnen", () => {
  const l = lab([{ type: "beaker", id: "b", contains: [{ reagent: "NaCl 0.1M", ml: 40 }] }, { type: "conductometer", id: "k", in: "b" }, { type: "conductometer", id: "frei" }], { room: 25 });
  near(L.reading(l, "k").value, 12.63, 0.1);
  assert.equal(L.reading(l, "k").unit, "mS/cm");
  assert.equal(L.reading(l, "frei").value, null, "an der Luft misst es nichts");
  L.add(l, "b", "H2O", { ml: 40 });
  L.step(l, 15);
  near(L.reading(l, "k").value, 6.31, 0.06, "halbe Konzentration, halbe Leitfähigkeit");
  assert.ok(L.atRest(l));
});

test("Leitfähigkeitstitration: bis zum Äquivalenzpunkt fällt die Leitfähigkeit, danach steigt sie", () => {
  const l = lab([{ type: "beaker", id: "b", contains: [{ reagent: "HCl 0.1M", ml: 20 }] }, { type: "conductometer", id: "k", in: "b" },
    { type: "burette", id: "bu", over: "b", contains: [{ reagent: "NaOH 0.1M", ml: 40 }] }], { room: 25 });
  const at = (ml) => { L.setTap(l, "bu", 2); while (L.vessel(l, "bu").given < ml - 1e-9) L.step(l, 0.05); L.setTap(l, "bu", 0); L.step(l, 8); return L.reading(l, "k").value; };
  const start = L.reading(l, "k").value, half = at(10), end = at(20), over = at(30);
  assert.ok(start > half && half > end, `${start} > ${half} > ${end}`);
  assert.ok(over > end * 1.3, "über den Äquivalenzpunkt hinaus bringt die Lauge neue Ionen");
  near(end, 12.63 / 2, 0.15, "am Äquivalenzpunkt: Kochsalzlösung mit 0,05 mol/L");
});

// ---------------------------------------------------------------- Metalle in Lösungen: hergeleitet aus den Redoxpaaren

// ein Metall in 10 mL Lösung im Reagenzglas "b"
const metal = (solution, reagent, g, more) => lab([{ type: "testtube", id: "b", contains: [{ reagent: solution, ml: 10 }, { reagent, g }] }], Object.assign({ room: 25 }, more));
const equations = (l, id) => L.reactions(l, id || "b").map((r) => r.eq);
// alles Gelöste, das ein Element enthält, in mol dieses Elements
const dissolved = (l, element, id) => Object.entries(L.vessel(l, id || "b").n)
  .reduce((sum, [sp, n]) => sum + (L.species(sp).phase === "aq" ? n * (L.species(sp).atoms[element] || 0) : 0), 0);

test("Zink in Salzsäure: Wasserstoff entsteht, Zink geht in Lösung, es wird warm", () => {
  const l = metal("HCl 1M", "Zn granules", 2), before = totals(l);
  assert.equal(L.atRest(l), false, "was reagieren wird, ruht nicht");
  const seen = collect(l, 60);
  assert.ok(keys(seen).includes("gas"), "Gasblasen");
  const h2 = gasOf(l, "H2(g)");
  assert.ok(h2 > 6e-5 && h2 < 3e-4, `in einer Minute ${h2} mol Wasserstoff`);
  near(dissolved(l, "Zn"), h2, 1e-9, "je Wasserstoff-Molekül ein Zink-Ion");
  assert.ok(L.vessel(l, "b").T > 25.1, "die Reaktion gibt Wärme ab");
  const r = L.reactions(l, "b").find((x) => x.eq === "Zn(s) + 2 H+(aq) -> Zn^2+(aq) + H2(g)");
  assert.ok(r && r.rate > 5e-7, "die Gleichung steht in der Liste und läuft");
  near(r.dH, -153.4, 0.1, "Reaktionswärme nach Hess");
  near(r.extent, h2, 1e-9);
  near(totals(l).mass, before.mass, 1e-9, "Masse");
  near(totals(l).charge, before.charge, 1e-12, "Ladung");
});

test("Kupfer in Salzsäure: es geschieht nichts", () => {
  const l = metal("HCl 1M", "Cu sheet", 1);
  assert.ok(L.atRest(l), "nichts steht bereit");
  const seen = collect(l, 120);
  assert.deepEqual(keys(seen), []);
  assert.equal(dissolved(l, "Cu"), 0, "kein Kupfer geht in Lösung");
  assert.equal(gasOf(l, "H2(g)"), 0);
  assert.deepEqual(equations(l).filter((eq) => /Cu/.test(eq)), []);
});

test("Zink in Essigsäure reagiert viel langsamer als in Salzsäure gleicher Konzentration", () => {
  const strong = metal("HCl 1M", "Zn granules", 2), weak = metal("CH3COOH 1M", "Zn granules", 2);
  L.step(strong, 60); L.step(weak, 60);
  assert.ok(gasOf(weak, "H2(g)") > 0, "auch hier entsteht Wasserstoff");
  assert.ok(gasOf(strong, "H2(g)") > 5 * gasOf(weak, "H2(g)"));
});

test("Zink in Kupfersulfat: Kupfer scheidet sich ab, die Lösung entfärbt sich und wird warm", () => {
  const l = metal("CuSO4 0.1M", "Zn powder", 0.5), before = totals(l), seen = [];
  assert.equal(look(l).color.name, "blue");
  let top = 25;
  until(l, () => { top = Math.max(top, L.vessel(l, "b").T); return dissolved(l, "Cu") < 1e-5; }, 900, seen);
  assert.ok(dissolved(l, "Cu") < 1e-5, "das Kupfer ist aus der Lösung");
  near(solid(l, "Cu(s)"), 1e-3, 2e-5, "und liegt als Metall im Glas");
  // die Lösung ist schwach sauer: nebenher entsteht eine Spur Wasserstoff, auch dafür geht Zink in Lösung
  near(dissolved(l, "Zn"), solid(l, "Cu(s)") + gasOf(l, "H2(g)"), 1e-9, "für jedes Kupfer-Ion und jedes Wasserstoff-Molekül ein Zink-Ion");
  assert.ok(gasOf(l, "H2(g)") < 0.01 * solid(l, "Cu(s)"), "der Wasserstoff bleibt eine Spur");
  assert.equal(look(l).color.name, "colorless");
  assert.ok(top > 27, `höchste Temperatur ${top} °C`);
  const plated = seen.find((e) => e.key === "plated");
  assert.deepEqual([plated.species, plated.on], ["Cu(s)", "Zn(s)"], "gemeldet wird, was sich worauf abscheidet");
  const r = L.reactions(l, "b").find((x) => x.eq === "Zn(s) + Cu^2+(aq) -> Zn^2+(aq) + Cu(s)");
  near(r.dH, -218.3, 0.1);
  near(totals(l).mass, before.mass, 1e-9, "Masse");
  near(totals(l).charge, before.charge, 1e-12, "Ladung");
});

test("Kupfer in Silbernitrat: Silber scheidet sich ab, die Lösung wird blau", () => {
  const l = metal("AgNO3 0.1M", "Cu sheet", 0.5);
  assert.equal(look(l).color.name, "colorless");
  L.step(l, 1800);
  assert.ok(solid(l, "Ag(s)") > 8e-4, `${solid(l, "Ag(s)")} mol Silber`);
  near(solid(l, "Ag(s)"), 2 * dissolved(l, "Cu"), 1e-9, "zwei Silber-Atome je Kupfer-Ion");
  const rgb = look(l).color.rgb;
  assert.ok(rgb[2] > rgb[0] + 4, `bläulich: ${rgb}`);
  assert.ok(equations(l).includes("Cu(s) + 2 Ag+(aq) -> Cu^2+(aq) + 2 Ag(s)"));
});

test("Eisen in Kupfersulfat: Kupfer auf dem Eisen, Eisen(II) in der Lösung", () => {
  const l = metal("CuSO4 0.1M", "Fe wool", 0.5);
  L.step(l, 1500);
  assert.ok(solid(l, "Cu(s)") > 8e-4);
  near(dissolved(l, "Fe"), solid(l, "Cu(s)") + gasOf(l, "H2(g)"), 1e-9);
  assert.ok(equations(l).includes("Fe(s) + Cu^2+(aq) -> Fe^2+(aq) + Cu(s)"));
});

test("Spannungsreihe: das edlere Metall fällt das unedlere nicht", () => {
  for (const [solution, reagent, g] of [["ZnSO4 0.1M", "Cu sheet", 1], ["FeSO4 0.1M", "Cu sheet", 1], ["ZnSO4 0.1M", "Fe wool", 0.5]]) {
    const l = metal(solution, reagent, g);
    assert.ok(L.atRest(l), solution + " + " + reagent);
    assert.deepEqual(keys(collect(l, 300)), [], solution + " + " + reagent);
    assert.equal(solid(l, "Zn(s)") + (reagent === "Cu sheet" ? solid(l, "Fe(s)") : 0), 0);
  }
});

test("Magnesium in Salzsäure: die eingetragene Reaktion gilt, die hergeleitete kommt nicht dazu", () => {
  const l = hydrogen();
  L.step(l, 0.05);
  const list = L.reactions(l, "b").filter((r) => /Mg\(s\)/.test(r.eq));
  assert.equal(list.length, 1);
  const area = 57.5 * 0.052, acid = amount(l, "H+(aq)") / L.volume(L.vessel(l, "b"));
  near(list[0].rate, 8e-6 * area * acid, 0.02 * 8e-6 * area, "Geschwindigkeit wie eingetragen");
  assert.ok(!L.db.derived.some((r) => r.text === "Mg(s) + 2 H+(aq) -> Mg^2+(aq) + H2(g)"));
  L.step(l, 10);
  near(gasOf(l, "H2(g)"), 8e-6 * area * acid * 10, 0.06 * 8e-6 * area * acid * 10, "nach zehn Sekunden so viel Wasserstoff, wie die eingetragene Reaktion allein liefert");
});

test("Magnesium, Zink und Eisen in Wasser und in Kochsalzlösung: nichts Sichtbares geschieht", () => {
  for (const [reagent, g] of [["Mg ribbon", 0.104], ["Zn granules", 2], ["Zn powder", 2], ["Fe wool", 1]]) {
    for (const solution of ["H2O", "NaCl 1M"]) {
      const l = metal(solution, reagent, g);
      assert.ok(L.atRest(l), reagent + " in " + solution);
      assert.deepEqual(keys(collect(l, 600)), [], reagent + " in " + solution);
      assert.ok(gasOf(l, "H2(g)") < 1e-8, reagent + " in " + solution);
    }
  }
});

test("Magnesium in Kupfersulfat: Kupfer scheidet sich ab", () => {
  const l = metal("CuSO4 0.1M", "Mg ribbon", 0.104);
  L.step(l, 300);
  assert.ok(solid(l, "Cu(s)") > 1e-4, `${solid(l, "Cu(s)")} mol Kupfer`);
  assert.ok(equations(l).includes("Mg(s) + Cu^2+(aq) -> Mg^2+(aq) + Cu(s)"));
});

test("Zink in wenig Säure: ist sie verbraucht, kommt das Glas zur Ruhe", () => {
  const l = lab([{ type: "testtube", id: "b", contains: [{ reagent: "HCl 0.05M", ml: 5 }, { reagent: "Zn powder", g: 0.3 }] }], { room: 25 });
  const t = until(l, () => L.atRest(l), 3000);
  assert.ok(t < 3000, "nach " + t + " s");
  assert.ok(look(l).pH > 4.5, "pH " + look(l).pH);
  near(gasOf(l, "H2(g)"), 1.25e-4, 5e-6, "aus 0,25 mmol Säure wird die halbe Menge Wasserstoff");
  assert.ok(solid(l, "Zn(s)") > 0, "Zink bleibt übrig");
});

// ---------------------------------------------------------------- Elektrolyse

// Becherglas "b" mit zwei Elektroden: "e1" links am Pluspol, "e2" rechts am Minuspol; Netzgerät "n", Strommesser "a", Spannungsmesser "u"
const cell = (contains, left, right, volts, extra) => lab([
  { type: "beaker", id: "b", contains },
  { type: "electrode-" + left, id: "e1", in: "b" }, { type: "electrode-" + right, id: "e2", in: "b" },
  { type: "supply", id: "n", in: "b", volts }, { type: "ammeter", id: "a", in: "b" }, { type: "voltmeter", id: "u", in: "b" }
].concat(extra || []), { room: 25 });
const amps = (l, id) => L.reading(l, id || "a").value;
// Masse und Ladung wie totals(), dazu das Metall der Elektroden und ihrer Beläge
const totalsE = (l) => {
  const sum = totals(l);
  for (const t of l.tools) {
    const r = L.reading(l, t.id);
    if (r.material) for (const [id, n] of [[r.material, r.n]].concat(r.coat.map((c) => [c.id, c.n]))) sum.mass += n * L.species(id).M;
  }
  return sum;
};
// rechnet weiter und zählt die Ladung, die geflossen ist, in Coulomb
const charge = (l, seconds, id) => { let q = 0; for (let i = 0; i < seconds * 20; i++) { L.step(l, 0.05); q += L.circuit(l, id || "b").I * 0.05; } return q; };
const halves = (l, id) => L.reactions(l, id || "b").filter((r) => r.at).map((r) => r.at + ": " + r.eq);

test("Elektroden: zwei je Becherglas, mit Material und Masse; die Beschreibung prüft den Aufbau", () => {
  const l = cell([{ reagent: "CuSO4 0.5M", ml: 80 }], "Cu", "C", 0);
  assert.deepEqual([L.reading(l, "e1").material, L.reading(l, "e2").material], ["Cu(s)", "C(s)"]);
  near(L.reading(l, "e1").g, 10, 1e-9, "eine Kupferelektrode wiegt 10 g");
  assert.deepEqual(L.reading(l, "e1").coat, []);
  const third = () => L.normalize({ bench: [{ type: "beaker", id: "b" }, { type: "electrode-C", in: "b" }, { type: "electrode-Cu", in: "b" }, { type: "electrode-Zn", in: "b" }] });
  assert.throws(third, (e) => e.code === "place", "eine dritte Elektrode hat keinen Platz");
  assert.throws(() => L.normalize({ bench: [{ type: "testtube", id: "t" }, { type: "electrode-C", in: "t" }] }), (e) => e.code === "place", "ein Reagenzglas ist zu eng");
  assert.throws(() => L.normalize({ bench: [{ type: "beaker", id: "b" }, { type: "supply", in: "b" }, { type: "supply", in: "b" }] }), (e) => e.code === "place", "nur ein Netzgerät je Gefäß");
  assert.equal(L.normalize({ bench: [{ type: "supply", volts: 99 }] }).bench[0].volts, 12, "höchstens 12 V");
  assert.equal(L.normalize({ bench: [{ type: "supply", volts: -3 }] }).bench[0].volts, 0);
  assert.equal(L.normalize({ bench: [{ type: "electrode-Cu", g: 2.5 }] }).bench[0].g, 2.5, "die Masse lässt sich angeben");
  assert.throws(() => L.normalize({ bench: [{ type: "electrode-Cu", g: -1 }] }), (e) => e.code === "amount");
});

test("Stromkreis: ohne Spannung, ohne Flüssigkeit und ohne zweite Elektrode fließt kein Strom", () => {
  const off = cell([{ reagent: "CuSO4 0.5M", ml: 80 }], "C", "C", 0);
  assert.ok(L.atRest(off));
  L.step(off, 5);
  assert.equal(amps(off), 0);
  assert.equal(L.circuit(off, "b").I, 0);
  const dry = cell([], "C", "C", 6);
  L.step(dry, 5);
  assert.equal(amps(dry), 0, "leeres Glas");
  assert.equal(L.reading(dry, "u").value, null);
  assert.ok(L.atRest(dry));
  const single = lab([{ type: "beaker", id: "b", contains: [{ reagent: "NaCl 1M", ml: 80 }] }, { type: "electrode-C", id: "e1", in: "b" },
    { type: "supply", id: "n", in: "b", volts: 6 }, { type: "ammeter", id: "a", in: "b" }]);
  L.step(single, 5);
  assert.equal(amps(single), 0, "nur eine Elektrode");
  assert.equal(L.circuit(single, "b"), null);
});

test("Kupfer abscheiden: die Masse folgt dem Gesetz von Faraday", () => {
  const l = cell([{ reagent: "CuSO4 0.5M", ml: 80 }], "Cu", "Cu", 2), before = totalsE(l), copper = dissolved(l, "Cu");
  assert.equal(L.atRest(l), false, "es fließt Strom");
  const q = charge(l, 300), I = amps(l), M = L.species("Cu(s)").M;
  assert.ok(I > 0.05 && I < 1.5, `Stromstärke ${I} A`);
  near(I, L.circuit(l, "b").I, 0.002 * I, "der Strommesser zeigt den Strom des Stromkreises");
  const gain = L.reading(l, "e2").g - 10, loss = 10 - L.reading(l, "e1").g;
  near(gain, q / (2 * L.FARADAY) * M, 2e-6, "Zunahme der Kathode in g");
  near(loss, gain, 2e-6, "die Anode verliert, was die Kathode gewinnt");
  near(dissolved(l, "Cu"), copper, 1e-9, "die Lösung bleibt, wie sie war");
  assert.ok(gasOf(l, "H2(g)") + gasOf(l, "O2(g)") < 1e-10, "kein Gas, das man sehen oder messen könnte");
  near(L.reading(l, "u").value, 2 - 0.5 * I, 0.01, "Spannung an den Elektroden: die des Netzgeräts ohne den Abfall in den Leitungen");
  assert.deepEqual([L.reading(l, "e1").pole, L.reading(l, "e2").pole], ["+", "-"]);
  assert.deepEqual(halves(l).sort(), ["e1: Cu(s) -> Cu^2+(aq) + 2 e-", "e2: Cu^2+(aq) + 2 e- -> Cu(s)"]);
  near(totalsE(l).mass, before.mass, 1e-9, "Masse");
  near(totalsE(l).charge, before.charge, 1e-12, "Ladung");
});

test("Kupferchlorid mit Graphit: Kupfer am Minuspol, Chlor am Pluspol", () => {
  const l = cell([{ reagent: "CuCl2 0.5M", ml: 80 }], "C", "C", 3), before = totalsE(l);
  const seen = collect(l, 120);
  const plated = seen.find((e) => e.key === "plated");
  assert.deepEqual([plated.part, plated.species], ["e2", "Cu(s)"], "Kupferbelag auf der rechten Elektrode");
  assert.ok(seen.some((e) => e.key === "bubbles" && e.part === "e1"), "Gasblasen an der linken");
  assert.ok(seen.some((e) => e.key === "smell" && e.species === "Cl2(g)"), "es riecht nach Chlor");
  const copper = L.reading(l, "e2").coat.find((c) => c.id === "Cu(s)").n, chlorine = gasOf(l, "Cl2(g)");
  assert.ok(copper > 1e-5, `${copper} mol Kupfer`);
  assert.ok(chlorine > 0.9 * copper && chlorine <= copper * (1 + 1e-9), "fast aller Strom macht am Pluspol Chlor, ein Rest Sauerstoff");
  near(2 * chlorine + 4 * gasOf(l, "O2(g)"), 2 * copper + 2 * gasOf(l, "H2(g)"), 1e-9, "an beiden Elektroden gleich viele Elektronen");
  assert.ok(L.reading(l, "e2").g > 5, "die Masse zählt den Belag mit");
  assert.ok(halves(l).includes("e1: 2 Cl-(aq) -> Cl2(g) + 2 e-") && halves(l).includes("e2: Cu^2+(aq) + 2 e- -> Cu(s)"));
  near(totalsE(l).mass, before.mass, 1e-9, "Masse");
  near(totalsE(l).charge, before.charge, 1e-12, "Ladung");
});

test("Wasser zerlegen: verdünnte Schwefelsäure an Platin gibt Wasserstoff und Sauerstoff im Verhältnis 2 : 1", () => {
  const l = cell([{ reagent: "H2SO4 0.5M", ml: 80 }], "Pt", "Pt", 3), before = totalsE(l);
  const q = charge(l, 60);
  near(gasOf(l, "H2(g)"), q / (2 * L.FARADAY), 1e-9, "Wasserstoff nach Faraday");
  near(gasOf(l, "O2(g)"), gasOf(l, "H2(g)") / 2, 1e-9, "halb so viel Sauerstoff");
  assert.ok(gasOf(l, "H2(g)") > 5e-5);
  assert.ok(L.reading(l, "e1").bub > 0 && L.reading(l, "e2").bub > 1.9 * L.reading(l, "e1").bub, "am Minuspol steigen doppelt so viele Blasen auf");
  assert.equal(look(l).gas, 0, "die Blasen gehören zu den Elektroden, nicht zur ganzen Lösung");
  assert.ok(look(l).T > 25, "der Strom wärmt die Lösung");
  assert.equal(L.probe(l, "b", "flame").result, "calm", "aus dem offenen Glas verfliegt der Wasserstoff: bei kleinem Strom zündet nichts");
  L.setVolts(l, "n", 6);
  L.step(l, 20);
  assert.equal(L.probe(l, "b", "flame").result, "pop", "bei größerem Strom steht genug Knallgas über der Lösung");
  near(totalsE(l).mass, before.mass, 1e-9, "Masse");
});

test("Zersetzungsspannung: darunter fließt fast kein Strom, darüber wächst er mit der Spannung", () => {
  const l = cell([{ reagent: "H2SO4 0.5M", ml: 80 }], "Pt", "Pt", 0), at = {};
  for (const volts of [1.0, 1.4, 2.2, 2.6, 3.0]) { L.setVolts(l, "n", volts); L.step(l, 3); at[volts] = L.circuit(l, "b").I; }
  assert.ok(at[1.0] < 2e-5 && at[1.4] < 2e-3, `bei 1,0 V ${at[1.0]} A, bei 1,4 V ${at[1.4]} A`);
  assert.ok(at[2.2] > 0.05, `bei 2,2 V ${at[2.2]} A`);
  const slope = (at[3.0] - at[2.6]) / 0.4, cut = 3.0 - at[3.0] / slope;
  near((at[2.6] - at[2.2]) / 0.4, slope, 0.2 * slope, "oberhalb fast eine Gerade");
  assert.ok(cut > 1.6 && cut < 2.1, `Zersetzungsspannung aus der Geraden: ${cut} V`);
  L.setVolts(l, "n", 0);
  L.step(l, 10);
  assert.ok(L.atRest(l), "ohne Spannung kommt alles zur Ruhe");
});

test("Zinkiodid: Zink am Minuspol, Iod färbt die Lösung braun", () => {
  const l = cell([{ reagent: "ZnI2 0.5M", ml: 80 }], "C", "C", 3);
  assert.equal(look(l).color.name, "colorless");
  const seen = collect(l, 120);
  assert.deepEqual(seen.filter((e) => e.key === "plated").map((e) => [e.part, e.species]), [["e2", "Zn(s)"]]);
  assert.ok(amount(l, "I3-(aq)") > 1e-5);
  near(L.reading(l, "e2").coat[0].n + gasOf(l, "H2(g)"), amount(l, "I3-(aq)") + solid(l, "I2(s)"), 1e-9, "je Zink-Atom (und je Wasserstoff-Molekül) ein Iod-Molekül");
  assert.ok(["yellow", "orange", "brown", "red"].includes(look(l).color.name), look(l).color.name);
  assert.ok(gasOf(l, "H2(g)") < 0.02 * L.reading(l, "e2").coat[0].n, "kaum Wasserstoff: an Zink entsteht er nur gehemmt");
  assert.ok(halves(l).includes("e1: 3 I-(aq) -> I3-(aq) + 2 e-"));
});

test("Kochsalzlösung mit Graphit: Wasserstoff und Chlor, und die Lösung wird zur Lauge", () => {
  const l = cell([{ reagent: "NaCl 1M", ml: 80 }, { reagent: "PP", drops: 3 }], "C", "C", 6);
  assert.equal(look(l).color.name, "colorless");
  const seen = collect(l, 120);
  assert.ok(look(l).pH > 10.5, "pH " + look(l).pH);
  assert.ok(["pink", "violet"].includes(look(l).color.name), "Phenolphthalein schlägt um: " + look(l).color.name);
  assert.ok(gasOf(l, "Cl2(g)") > 0.85 * gasOf(l, "H2(g)"), "am Pluspol vor allem Chlor");
  assert.ok(seen.some((e) => e.key === "smell" && e.species === "Cl2(g)"));
  assert.ok(halves(l).includes("e2: 2 H2O(l) + 2 e- -> H2(g) + 2 OH-(aq)"), "am Minuspol wird Wasser zerlegt");
});

test("Umpolen: der Kupferbelag löst sich wieder und scheidet sich an der anderen Elektrode ab", () => {
  const l = cell([{ reagent: "CuSO4 0.5M", ml: 80 }], "C", "C", 3);
  L.step(l, 60);
  const first = L.reading(l, "e2").coat[0].n;
  assert.ok(first > 1e-5);
  assert.equal(L.setPole(l, "n", true), true);
  L.step(l, 30);
  assert.deepEqual([L.reading(l, "e1").pole, L.reading(l, "e2").pole], ["-", "+"]);
  assert.ok(L.reading(l, "e2").coat[0].n < first, "rechts wird es weniger");
  assert.ok(L.reading(l, "e1").coat[0].n > 0, "links scheidet sich Kupfer ab");
  assert.ok(halves(l).includes("e2: Cu(s) -> Cu^2+(aq) + 2 e-"));
});

test("Lämpchen: leuchtet in der Salzlösung, nicht in Zuckerlösung oder destilliertem Wasser", () => {
  const shine = (reagent) => {
    const l = lab([{ type: "beaker", id: "b", contains: [{ reagent, ml: 80 }] }, { type: "electrode-C", id: "e1", in: "b" }, { type: "electrode-C", id: "e2", in: "b" },
      { type: "supply", id: "n", in: "b", volts: 6 }, { type: "lamp", id: "la", in: "b" }], { room: 25 });
    const seen = collect(l, 5);
    return { value: L.reading(l, "la").value, on: keys(seen).includes("lampOn"), rest: L.atRest(l) };
  };
  const salt = shine("NaCl 1M"), sugar = shine("sugar 1M"), water = shine("H2O");
  assert.ok(salt.value > 0.3 && salt.on, `Kochsalz: ${salt.value}`);
  assert.ok(sugar.value < 0.01 && !sugar.on && sugar.rest, `Zucker: ${sugar.value}`);
  assert.ok(water.value < 0.01 && water.rest, `Wasser: ${water.value}`);
  assert.ok(shine("HCl 0.1M").value > 3 * shine("CH3COOH 0.1M").value, "die starke Säure leitet besser als die schwache");
});

test("Netzgerät: begrenzt den Strom auf 3 A; die Lösung wird warm", () => {
  const l = cell([{ reagent: "H2SO4 1M", ml: 80 }], "Pt", "Pt", 12);
  L.step(l, 60);
  near(L.circuit(l, "b").I, 3, 1e-6);
  assert.ok(L.reading(l, "u").value < 11, "die Spannung bricht ein");
  assert.ok(look(l).T > 26, `nach einer Minute ${look(l).T} °C`);
});

test("Eine dünne Kupferelektrode am Pluspol löst sich ganz auf: dann ist der Stromkreis offen", () => {
  const l = lab([{ type: "beaker", id: "b", contains: [{ reagent: "CuSO4 0.5M", ml: 80 }] }, { type: "electrode-Cu", id: "e1", in: "b", g: 0.01 }, { type: "electrode-Cu", id: "e2", in: "b" },
    { type: "supply", id: "n", in: "b", volts: 2 }, { type: "ammeter", id: "a", in: "b" }], { room: 25 }), before = totalsE(l), seen = [];
  const t = until(l, () => keys(seen).includes("spent"), 600, seen);
  assert.ok(t < 600, "nach " + t + " s");
  assert.equal(seen.find((e) => e.key === "spent").part, "e1");
  L.step(l, 5);
  assert.equal(amps(l), 0);
  near(L.reading(l, "e2").g, 10.01, 1e-6, "ihr Kupfer sitzt nun auf der anderen Elektrode");
  near(totalsE(l).mass, before.mass, 1e-8, "Masse (über 8000 Rechenschritte summiert sich die Genauigkeit des Gleichgewichtslösers)");
  assert.equal(L.reading(l, "e1").n, 0);
  assert.ok(Object.values(L.vessel(l, "b").rate).every((rate) => rate < 1e-9), "nichts läuft mehr; nur die Lösung kühlt noch ab");
});

test("Elektrode ohne Stromkreis: Zink in Säure löst sich wie ein Stück Zink, Kupfer in Kupfersulfat ruht", () => {
  const zinc = lab([{ type: "beaker", id: "b", contains: [{ reagent: "HCl 1M", ml: 80 }] }, { type: "electrode-Zn", id: "e1", in: "b" }], { room: 25 });
  assert.equal(L.atRest(zinc), false);
  L.step(zinc, 60);
  assert.ok(gasOf(zinc, "H2(g)") > 5e-5);
  assert.ok(L.reading(zinc, "e1").g < 10);
  assert.ok(equations(zinc).includes("Zn(s) + 2 H+(aq) -> Zn^2+(aq) + H2(g)"), "als Gesamtreaktion, nicht als Vorgang an einem Pol");
  const copper = lab([{ type: "beaker", id: "b", contains: [{ reagent: "CuSO4 0.5M", ml: 80 }] }, { type: "electrode-Cu", id: "e1", in: "b" }], { room: 25 });
  assert.ok(L.atRest(copper));
  L.step(copper, 60);
  near(L.reading(copper, "e1").g, 10, 1e-9);
});

test("Aufzeichnung: Belag, Strom und Spannung kommen beim Zurückspulen wieder", () => {
  const run = L.createRun(L.normalize({ room: 25, bench: [{ type: "beaker", id: "b", contains: [{ reagent: "CuSO4 0.5M", ml: 80 }] },
    { type: "electrode-C", id: "e1", in: "b" }, { type: "electrode-C", id: "e2", in: "b" }, { type: "supply", id: "n", in: "b" }, { type: "ammeter", id: "a", in: "b" }] }));
  L.act(run, (l) => L.setVolts(l, "n", 3), { key: "volts", part: "n", volts: 3 });
  L.advance(run, 30);
  const coat = L.reading(run.lab, "e2").coat[0].n, I = amps(run.lab);
  L.advance(run, 30);
  assert.ok(L.reading(run.lab, "e2").coat[0].n > 1.5 * coat);
  L.seek(run, 30);
  near(L.reading(run.lab, "e2").coat[0].n, coat, 1e-12);
  near(amps(run.lab), I, 1e-12);
  L.seek(run, 0);
  assert.deepEqual(L.reading(run.lab, "e2").coat, []);
  assert.equal(L.reading(run.lab, "n").volts, 0);
  const points = L.series(run, { tool: "a" });
  assert.ok(points.length > 5 && points[points.length - 1][1] > 0.01, "die Stromstärke steht für das Diagramm bereit");
  assert.ok(L.series(run, { tool: "e2" }).pop()[1] > 5, "ebenso die Masse der Elektrode");
});

// ---------------------------------------------------------------- Galvanische Zellen

// zwei Bechergläser "l" und "r" mit je einer Elektrode ("e1" links, "e2" rechts), verbunden durch die Salzbrücke "s"; Spannungsmesser "u"
const galvanic = (left, right, extra) => lab([
  { type: "beaker", id: "l", contains: [{ reagent: left[0], ml: 80 }] }, { type: "electrode-" + left[1], id: "e1", in: "l" },
  { type: "beaker", id: "r", contains: [{ reagent: right[0], ml: 80 }] }, { type: "electrode-" + right[1], id: "e2", in: "r" },
  { type: "bridge", id: "s", in: "l", to: "r" }, { type: "voltmeter", id: "u", in: "l" }
].concat(extra || []), { room: 25 });
const volts = (l) => L.reading(l, "u").value;
const poles = (l) => L.reading(l, "e1").pole + L.reading(l, "e2").pole;
const chargeIn = (l, id) => Object.entries(L.vessel(l, id).n).reduce((sum, [sp, n]) => sum + n * L.species(sp).charge, 0);

test("Daniell-Element: zwischen Zink und Kupfer liegen 1,1 V, Kupfer ist der Pluspol; ohne Verbraucher geschieht nichts", () => {
  const l = galvanic(["ZnSO4 1M", "Zn"], ["CuSO4 1M", "Cu"]);
  near(volts(l), 1.10, 0.02, "Spannung in V");
  assert.equal(poles(l), "-+");
  assert.deepEqual([L.circuit(l, "l").closed, L.circuit(l, "r").I], [false, 0]);
  assert.ok(L.atRest(l));
  assert.deepEqual(keys(collect(l, 60)), []);
  near(L.reading(l, "e1").g, 10, 1e-5, "bis auf eine Spur Zink, die die schwach saure Lösung von selbst löst");
});

test("Spannungsreihe: die Spannung einer Zelle folgt aus den Standardpotentialen", () => {
  near(volts(galvanic(["CuSO4 0.1M", "Cu"], ["AgNO3 0.1M", "Ag"])), 0.46, 0.05, "Kupfer gegen Silber");
  near(volts(galvanic(["ZnSO4 0.1M", "Zn"], ["AgNO3 0.1M", "Ag"])), 1.56, 0.05, "Zink gegen Silber");
  near(volts(galvanic(["FeSO4 0.1M", "Fe"], ["CuSO4 0.1M", "Cu"])), 0.81, 0.05, "Eisen gegen Kupfer");
  const turned = galvanic(["CuSO4 1M", "Cu"], ["ZnSO4 1M", "Zn"]);
  near(volts(turned), 1.10, 0.02);
  assert.equal(poles(turned), "+-", "der Pluspol ist das Kupfer, gleich auf welcher Seite");
});

test("Konzentrationszelle: zwei Silberelektroden in verschieden starker Lösung, 0,059 V je Zehnerpotenz (Nernst)", () => {
  const l = galvanic(["AgNO3 0.01M", "Ag"], ["AgNO3 1M", "Ag"]);
  near(volts(l), 2 * 0.05916, 0.002, "zwei Zehnerpotenzen");
  assert.equal(poles(l), "-+", "in der verdünnten Lösung steht der Minuspol");
  const same = galvanic(["AgNO3 0.1M", "Ag"], ["AgNO3 0.1M", "Ag"]);
  near(volts(same), 0, 1e-6);
  assert.equal(poles(same), "");
});

test("Daniell-Element unter Last: Zink geht in Lösung, Kupfer scheidet sich ab, die Salzbrücke gleicht die Ladung aus", () => {
  const l = galvanic(["ZnSO4 1M", "Zn"], ["CuSO4 1M", "Cu"], [{ type: "ammeter", id: "a", in: "r" }]), before = totalsE(l);
  assert.equal(L.atRest(l), false);
  const q = charge(l, 600, "l"), I = amps(l);
  assert.ok(I > 0.02 && I < 0.05, `Stromstärke ${I} A`);
  assert.ok(volts(l) < 0.05, "über den Strommesser kurzgeschlossen bricht die Spannung zusammen");
  const zinc = q / (2 * L.FARADAY) * L.species("Zn(s)").M;
  near(10 - L.reading(l, "e1").g, zinc, 0.003 * zinc, "Zink verliert nach Faraday (und eine Spur durch die Säure der Lösung)");
  assert.ok(10 - L.reading(l, "e1").g >= zinc - 1e-9, "weniger als nach Faraday kann es nicht sein");
  near(L.reading(l, "e2").g - 10, q / (2 * L.FARADAY) * L.species("Cu(s)").M, 2e-6, "Kupfer gewinnt nach Faraday");
  near(amount(l, "NO3-(aq)", "l"), q / L.FARADAY, 1e-9, "Nitrat wandert dorthin, wo Zink-Ionen entstehen");
  near(amount(l, "K+(aq)", "r"), q / L.FARADAY, 1e-9, "Kalium dorthin, wo Kupfer-Ionen verschwinden");
  near(chargeIn(l, "l"), 0, 1e-12, "die linke Lösung bleibt neutral");
  near(chargeIn(l, "r"), 0, 1e-12, "die rechte auch");
  assert.equal(halves(l, "l")[0], "e1: Zn(s) -> Zn^2+(aq) + 2 e-", "der Vorgang mit dem größten Umsatz steht zuerst");
  assert.deepEqual(halves(l, "r"), ["e2: Cu^2+(aq) + 2 e- -> Cu(s)"]);
  near(totalsE(l).mass, before.mass, 1e-8, "Masse");
  near(totalsE(l).charge, before.charge, 1e-12, "Ladung");
});

test("Lämpchen am Daniell-Element: es fließt Strom, aber zum Leuchten reicht er nicht", () => {
  const l = galvanic(["ZnSO4 1M", "Zn"], ["CuSO4 1M", "Cu"], [{ type: "lamp", id: "la", in: "l" }]);
  const seen = collect(l, 10);
  assert.ok(L.circuit(l, "l").I > 0.005, `${L.circuit(l, "l").I} A`);
  assert.ok(L.reading(l, "la").value < 0.05 && !keys(seen).includes("lampOn"), "Helligkeit " + L.reading(l, "la").value);
  assert.ok(volts(l) > 0.4 && volts(l) < 1.0, "unter Last sinkt die Spannung: " + volts(l));
});

test("Salzbrücke: ohne sie gibt es keinen Stromkreis, und sie braucht in jedem Glas genau eine Elektrode", () => {
  const l = galvanic(["ZnSO4 1M", "Zn"], ["CuSO4 1M", "Cu"], [{ type: "ammeter", id: "a", in: "r" }]);
  L.step(l, 5);
  assert.ok(amps(l) > 0.02);
  L.remove(l, "s");
  L.step(l, 5);
  assert.equal(amps(l), 0);
  assert.equal(volts(l), null);
  assert.equal(L.circuit(l, "l"), null);
  assert.ok(L.atRest(l));
  const made = L.place(l, { type: "bridge", in: "l", to: "r" });
  assert.equal(L.reading(l, made).to, "r");
  assert.ok(L.circuit(l, "l").I > 0.02, "wieder eingesetzt fließt sofort Strom");
  assert.equal(L.atRest(l), false);
  assert.throws(() => L.normalize({ bench: [{ type: "beaker", id: "x" }, { type: "bridge", in: "x", to: "x" }] }), (e) => e.code === "place", "beide Enden im selben Glas");
  assert.throws(() => L.normalize({ bench: [{ type: "beaker", id: "x" }, { type: "bridge", in: "x", to: "y" }] }), (e) => e.code === "place", "das andere Glas gibt es nicht");
  const empty = lab([{ type: "beaker", id: "x", contains: [{ reagent: "KNO3 1M", ml: 50 }] }, { type: "beaker", id: "y", contains: [{ reagent: "KNO3 1M", ml: 50 }] },
    { type: "electrode-C", id: "e", in: "x" }, { type: "bridge", in: "x", to: "y" }, { type: "voltmeter", id: "u", in: "x" }]);
  assert.equal(L.circuit(empty, "x"), null, "im zweiten Glas steht keine Elektrode");
});

test("Zink und Kupfer in derselben Säure (Volta-Element): Kupfer ist der Pluspol; fließt Strom, entsteht auch am Kupfer Wasserstoff", () => {
  const open = lab([{ type: "beaker", id: "b", contains: [{ reagent: "H2SO4 0.5M", ml: 80 }] }, { type: "electrode-Zn", id: "e1", in: "b" }, { type: "electrode-Cu", id: "e2", in: "b" },
    { type: "voltmeter", id: "u", in: "b" }], { room: 25 });
  // im Versuch liest man mehr ab (um 0,9 V): dort bestimmt gelöster Luftsauerstoff das Potential des Kupfers, den der Baustein nicht rechnet
  assert.ok(volts(open) > 0.4 && volts(open) < 1.1, "Spannung " + volts(open));
  assert.equal(poles(open), "-+");
  const l = cell([{ reagent: "H2SO4 0.5M", ml: 80 }], "Zn", "Cu", 0);
  L.step(l, 30);
  assert.ok(amps(l) > 0.005, `${amps(l)} A`);
  near(L.reading(l, "e2").bub, L.circuit(l, "b").I / (2 * L.FARADAY), 1e-10, "Gasblasen am Kupfer: der ganze Strom macht dort Wasserstoff");
  // das Zink ist als technisches Zink eingestellt: es entwickelt daneben selbst Wasserstoff, und zwar den größeren Teil
  assert.ok(L.reading(l, "e1").bub > L.reading(l, "e2").bub, "am Zink perlt es stärker als am Kupfer");
  assert.ok(L.reading(l, "e1").g < 10, "das Zink löst sich");
  near(L.reading(l, "e2").g, 10, 1e-9, "das Kupfer bleibt, wie es ist");
  assert.ok(halves(l).includes("e2: 2 H+(aq) + 2 e- -> H2(g)"));
});

test("Aufzeichnung: auch was die Salzbrücke abgegeben hat, kommt beim Zurückspulen wieder", () => {
  const run = L.createRun(L.normalize({ room: 25, bench: [
    { type: "beaker", id: "l", contains: [{ reagent: "ZnSO4 1M", ml: 80 }] }, { type: "electrode-Zn", id: "e1", in: "l" },
    { type: "beaker", id: "r", contains: [{ reagent: "CuSO4 1M", ml: 80 }] }, { type: "electrode-Cu", id: "e2", in: "r" },
    { type: "bridge", id: "s", in: "l", to: "r" }, { type: "voltmeter", id: "u", in: "l" }] }));
  near(L.reading(run.lab, "u").value, 1.10, 0.02, "schon vor dem ersten Rechenschritt zeigt der Spannungsmesser");
  L.act(run, (l) => L.place(l, { type: "ammeter", in: "l" }), (made) => ({ key: "placed", part: made }));
  L.advance(run, 60);
  const nitrate = amount(run.lab, "NO3-(aq)", "l");
  assert.ok(nitrate > 1e-5);
  L.advance(run, 60);
  L.seek(run, 60);
  near(amount(run.lab, "NO3-(aq)", "l"), nitrate, 1e-12);
  L.seek(run, 0);
  assert.equal(amount(run.lab, "NO3-(aq)", "l"), 0);
  near(L.reading(run.lab, "u").value, 1.10, 0.02);
  assert.equal(L.circuit(run.lab, "l").closed, false, "am Anfang war der Stromkreis offen");
});

// ---------------------------------------------------------------- Meilenstein 4: Zeichnung, Texte, Oberfläche

const electro = { room: 25, bench: [{ type: "beaker", id: "b", contains: [{ reagent: "CuCl2 0.5M", ml: 80 }] },
  { type: "electrode-C", id: "e1", in: "b" }, { type: "electrode-C", id: "e2", in: "b" },
  { type: "supply", id: "n", in: "b" }, { type: "ammeter", id: "a", in: "b" }, { type: "voltmeter", id: "u", in: "b" }] };

test("Texte: Elektroden, Stromkreis und Abscheidung als Satz", () => {
  const c = { lang: "de", numbers: true, names: { b: "Becherglas 1", l: "Becherglas 2", e2: "Graphit-Elektrode 2", n: "Netzgerät 1", la: "Lämpchen 1", s: "Salzbrücke 1" } };
  const say = (e) => L.say(e, c);
  assert.equal(say({ key: "plated", vessel: "b", part: "e2", species: "Cu(s)" }), "An Graphit-Elektrode 2 scheidet sich Kupfer ab.");
  assert.equal(say({ key: "plated", vessel: "b", species: "Cu(s)", on: "Zn(s)" }), "Becherglas 1: Auf dem Zink scheidet sich Kupfer ab.");
  assert.equal(say({ key: "bubbles", vessel: "b", part: "e2" }), "An Graphit-Elektrode 2 steigen Gasblasen auf.");
  assert.equal(say({ key: "spent", vessel: "b", part: "e2" }), "Graphit-Elektrode 2 hat sich aufgelöst.");
  assert.equal(say({ key: "lampOn", part: "la" }), "Lämpchen 1 leuchtet.");
  assert.equal(say({ key: "lampOff", part: "la" }), "Lämpchen 1 ist erloschen.");
  assert.equal(say({ key: "volts", part: "n", volts: 4.5 }), "Netzgerät 1: 4,5 V eingestellt");
  assert.equal(say({ key: "volts", part: "n", volts: 0 }), "Netzgerät 1: ausgeschaltet");
  assert.equal(say({ key: "flip", part: "n" }), "Netzgerät 1: umgepolt");
  assert.equal(say({ key: "bridged", part: "s", vessel: "b", to: "l" }), "Salzbrücke 1 zwischen Becherglas 1 und Becherglas 2 gesetzt");
  assert.match(L.say({ key: "plated", vessel: "b", part: "e2", species: "Cu(s)" }, { lang: "en", names: c.names }), /copper deposits on Graphit-Elektrode 2/i);
});

test("Anzeige der Geräte: Stromstärke in mA oder A, Spannung, Leitfähigkeit, Masse, Lämpchen in Worten", () => {
  const shown = (r) => L.shown(r, "de");
  assert.equal(shown({ type: "ammeter", unit: "A", value: 0.074 }), "74,0 mA");
  assert.equal(shown({ type: "ammeter", unit: "A", value: 1.25 }), "1,25 A");
  assert.equal(shown({ type: "voltmeter", unit: "V", value: 1.1 }), "1,10 V");
  assert.equal(shown({ type: "voltmeter", unit: "V", value: null }), "– V");
  assert.equal(shown({ type: "supply", unit: "V", value: 6, volts: 6 }), "6,0 V");
  assert.equal(shown({ type: "conductometer", unit: "mS/cm", value: 12.63 }), "12,6 mS/cm");
  assert.equal(shown({ type: "conductometer", unit: "mS/cm", value: 0.0000548 }), "0,0548 µS/cm");
  assert.equal(shown({ type: "electrode-Cu", unit: "g", value: 10.1184 }), "10,118 g");
  assert.equal(shown({ type: "lamp", value: 0.8 }), "leuchtet hell");
  assert.equal(shown({ type: "lamp", value: 0.2 }), "leuchtet schwach");
  assert.equal(shown({ type: "lamp", value: 0.01 }), "dunkel");
  assert.equal(L.shown({ type: "ammeter", unit: "A", value: 0.074 }, "en"), "74.0 mA");
});

test("Zeichnung: Elektroden mit Belag und Gasblasen, Netzgerät, Messgeräte, Lämpchen, Salzbrücke", () => {
  const l = L.createLab(L.normalize(Object.assign({}, electro, { bench: electro.bench.concat([{ type: "lamp", id: "la", in: "b" }, { type: "conductometer", id: "k", in: "b" },
    { type: "beaker", id: "c" }, { type: "bridge", id: "s", in: "b", to: "c" }, { type: "electrode-Zn", id: "frei" }, { type: "bridge", id: "lose" }]) })));
  L.setVolts(l, "n", 9);
  L.step(l, 30);
  const beakerPart = L.parts.beaker, v = L.vessel(l, "b");
  const at = (slot) => Object.assign(beakerPart.probe(v, "electrode-C", slot), { surface: beakerPart.surface(look(l)) });
  const left = L.parts["electrode-C"].draw(L.reading(l, "e1"), ctx({ t: 1 }), at(0)), right = L.parts["electrode-C"].draw(L.reading(l, "e2"), ctx({ t: 1 }), at(1));
  for (const svg of [left, right]) clean(svg, "Elektrode");
  assert.ok(at(0).x < 0 && at(1).x > 0, "links und rechts im Glas");
  assert.match(right, /class="cl-coat"[^>]*fill="#b5653a"/, "Kupferbelag in der Farbe des Kupfers");
  assert.doesNotMatch(left, /cl-coat/);
  assert.match(left, /cl-bubble/, "Chlor perlt an der linken Elektrode");
  assert.match(left, /class="cl-pole"[^>]*>\+</);
  assert.match(right, /class="cl-pole"[^>]*>−</);
  assert.match(L.parts["electrode-C"].draw(L.reading(l, "e1"), ctx({ numbers: false }), at(0)), /cl-pole/, "die Pole stehen auch ohne Zahlen da");
  clean(L.parts["electrode-Zn"].draw(L.reading(l, "frei"), ctx()), "Elektrode für sich");
  const supply = L.parts.supply.draw(L.reading(l, "n"), ctx());
  clean(supply, "Netzgerät");
  assert.match(supply, />9,0 V</);
  assert.equal(L.parts.supply.terminals.length, 2);
  assert.match(L.parts.ammeter.draw(L.reading(l, "a"), ctx()), />\d+,\d mA<|>\d,\d\d A</);
  assert.doesNotMatch(L.parts.ammeter.draw(L.reading(l, "a"), ctx({ numbers: false })), /\d mA|\d A</, "ohne Zahlen keine Ziffern");
  assert.match(L.parts.voltmeter.draw(L.reading(l, "u"), ctx()), />\d,\d\d V</);
  const lamp = L.parts.lamp.draw(L.reading(l, "la"), ctx());
  clean(lamp, "Lämpchen");
  assert.match(lamp, /class="cl-glow"[^>]*fill-opacity="0\.[1-9]|class="cl-glow"[^>]*fill-opacity="1/, "es leuchtet");
  assert.doesNotMatch(L.parts.lamp.draw({ type: "lamp", value: 0 }, ctx()), /cl-glow/, "ohne Strom dunkel");
  const meter = L.parts.conductometer.draw(L.reading(l, "k"), ctx(), beakerPart.probe(v, "conductometer"));
  clean(meter, "Leitfähigkeitsmessgerät");
  assert.match(meter, /mS\/cm/);
  const bridge = L.parts.bridge.draw(L.reading(l, "s"), ctx(), { x1: 20, y1: -96, s1: -60, x2: 110, y2: -96, s2: -60 });
  clean(bridge, "Salzbrücke");
  assert.match(bridge, /class="cl-bridge"/);
  clean(L.parts.bridge.draw(L.reading(l, "lose"), ctx()), "Salzbrücke für sich");
  for (const type of Object.keys(L.parts)) if (L.parts[type].kind !== "test") assert.equal(typeof L.parts[type].draw, "function", type + " hat eine Zeichnung");
});

test("Regal: Elektroden und Stromkreis stehen in einem eigenen Fach", () => {
  const shelf = part(mount({}), ".cl-shelf").innerHTML;
  const gear = shelf.indexOf(">Geräte<"), electric = shelf.indexOf(">Elektrik<");
  assert.ok(gear >= 0 && electric > gear);
  for (const [id, name] of [["electrode-Cu", "Kupfer-Elektrode"], ["electrode-C", "Graphit-Elektrode"], ["supply", "Netzgerät"], ["ammeter", "Strommesser"], ["voltmeter", "Spannungsmesser"],
    ["lamp", "Lämpchen"], ["bridge", "Salzbrücke"]]) {
    const at = shelf.indexOf(`data-id="${id}"`);
    assert.ok(at > electric, id);
    assert.ok(shelf.indexOf(name, at) > at, name);
  }
  const meter = shelf.indexOf('data-id="conductometer"');
  assert.ok(meter > gear && meter < electric, "das Leitfähigkeitsmessgerät steht bei den Messgeräten");
});

test("Elektroden einsetzen: zwei je Becherglas, keine ins Reagenzglas; Netzgerät und Messgeräte daneben", () => {
  const el = mount({ bench: [{ type: "beaker", id: "b", contains: [{ reagent: "CuSO4 0.5M", ml: 80 }] }, { type: "testtube", id: "t" }],
    shelf: ["electrode-Cu", "electrode-C", "supply", "ammeter"] });
  const tools = () => state(el).run.lab.tools.map((t) => t.type + ">" + t.in);
  press(el, "hand", "electrode-Cu");
  assert.match(part(el, ".cl-hand").innerHTML, /Kupfer-Elektrode/);
  tap(el, "t");
  assert.equal(part(el, ".cl-status").textContent, "Elektroden passen nur in ein Becherglas.");
  tap(el, "b");
  assert.deepEqual(tools(), ["electrode-Cu>b"]);
  assert.equal(state(el).hand, null, "eine Elektrode je Griff");
  press(el, "hand", "electrode-C");
  tap(el, "b");
  press(el, "hand", "electrode-C");
  tap(el, "b");
  assert.equal(part(el, ".cl-status").textContent, "In diesem Gefäß stehen schon zwei Elektroden.");
  assert.deepEqual(tools(), ["electrode-Cu>b", "electrode-C>b"]);
  press(el, "hand", "supply");
  tap(el, "b");
  press(el, "hand", "ammeter");
  tap(el, "b");
  assert.deepEqual(tools().slice(2), ["supply>b", "ammeter>b"]);
  assert.match(logOf(el), /Kupfer-Elektrode 1 in Becherglas 1 gestellt/);
  assert.match(logOf(el), /Netzgerät 1 an Becherglas 1 angeschlossen/);
  assert.equal(item(el, "electrode-Cu1").attributes["aria-label"], "Kupfer-Elektrode 1 in Becherglas 1: 10,000 g");
  assert.equal(item(el, "supply1").attributes["aria-label"], "Netzgerät 1 an Becherglas 1: 0,0 V");
  const order = state(el).run.lab.tools.map((t) => t.id).concat(["b", "t"]).map((id) => +/translate\(([\d.]+)/.exec(part(el, ".cl-svg").innerHTML.split(`data-id="${id}"`)[1])[1]);
  assert.ok(order[2] > order[4] && order[3] > order[2] && order[5] > order[3], "Netzgerät und Strommesser stehen zwischen dem Becherglas und dem nächsten Gefäß");
});

test("Netzgerät bedienen: Spannung einstellen, umpolen; Leitungen zeigen den Stromkreis", () => {
  const el = mount(electro);
  assert.equal(part(el, ".cl-svg").querySelector(".cl-wires").innerHTML.match(/<path/g).length, 5, "Elektrode – Netzgerät – Strommesser – Elektrode, dazu zwei zum Spannungsmesser");
  tap(el, "n");
  assert.match(part(el, ".cl-panel").innerHTML, /data-act="volts"[^>]*max="12"/);
  assert.match(part(el, ".cl-panel").innerHTML, /data-act="flip"/);
  enter(el, "change", "volts", "3");
  assert.equal(state(el).run.lab.tools.find((t) => t.id === "n").volts, 3);
  assert.equal(state(el).play, 1, "die Uhr läuft los");
  assert.match(logOf(el), /Netzgerät 1: 3,0 V eingestellt/);
  frames(20);
  assert.match(item(el, "e2").innerHTML, /cl-coat/, "Kupferbelag");
  assert.match(item(el, "e1").innerHTML, /cl-bubble/, "Gasblasen an der Elektrode");
  assert.match(item(el, "a").attributes["aria-label"], /^Strommesser 1 an Becherglas 1: \d+,\d mA$/);
  assert.match(item(el, "u").attributes["aria-label"], /^Spannungsmesser 1 an Becherglas 1: \d,\d\d V$/);
  assert.match(item(el, "e1").attributes["aria-label"], /Pluspol/);
  assert.match(item(el, "e2").attributes["aria-label"], /Minuspol, Belag: Kupfer/);
  assert.match(part(el, ".cl-svg").querySelector(".cl-wires").innerHTML, /cl-wire cl-plus/, "die Leitung am Pluspol ist rot");
  assert.match(logOf(el), /An Graphit-Elektrode 2 scheidet sich Kupfer ab/);
  assert.match(part(el, ".cl-eq").innerHTML, /Reduktion an Graphit-Elektrode 2/);
  assert.match(part(el, ".cl-eq").innerHTML, /Oxidation an Graphit-Elektrode 1/);
  assert.match(part(el, ".cl-eq").innerHTML, /e<sup>−<\/sup>/, "mit Elektronen geschrieben");
  press(el, "flip");
  assert.equal(state(el).run.lab.tools.find((t) => t.id === "n").flip, true);
  assert.match(logOf(el), /Netzgerät 1: umgepolt/);
  frames(10);
  assert.match(item(el, "e1").attributes["aria-label"], /Minuspol/);
  tap(el, "e2");
  const info = part(el, ".cl-panel").querySelector(".cl-contents").innerHTML;
  assert.match(info, /besteht aus .*Kohlenstoff/);
  assert.match(info, /Masse \d,\d{3} g \(Änderung [+−]\d,\d{3} g\)/);
  assert.match(info, /Belag: Kupfer/, "nach dem Umpolen sitzt noch Kupfer auf der rechten Elektrode");
});

test("Diagramme: Stromstärke, Spannung, Kennlinie und Masse der Elektroden", () => {
  const el = mount(electro);
  tap(el, "n");
  for (const volts of ["1", "2", "3"]) { enter(el, "change", "volts", volts); frames(40); }
  const charts = part(el, ".cl-charts").innerHTML;
  assert.match(charts, /Stromstärke in mA|Stromstärke in A/);
  assert.match(charts, /Spannung in V/);
  assert.match(charts, /Stromstärke über der Spannung/);
  assert.match(charts, /Masse der Elektroden/);
  assert.doesNotMatch(part(mount(tube), ".cl-charts").innerHTML, /Stromstärke|Spannung/, "ohne Messgeräte keine solchen Diagramme");
  const points = L.curve(state(el).run, { x: "n", tool: "a" });
  assert.ok(points.length >= 3 && points[points.length - 1][0] === 3 && points[points.length - 1][1] > points[0][1], "die Kennlinie steigt mit der Spannung");
});

test("Salzbrücke setzen: erst das eine Gefäß antippen, dann das andere", () => {
  const el = mount({ bench: [{ type: "beaker", id: "l", contains: [{ reagent: "ZnSO4 1M", ml: 80 }] }, { type: "electrode-Zn", id: "e1", in: "l" },
    { type: "beaker", id: "r", contains: [{ reagent: "CuSO4 1M", ml: 80 }] }, { type: "electrode-Cu", id: "e2", in: "r" }, { type: "voltmeter", id: "u", in: "r" }], shelf: ["bridge", "lamp"] });
  assert.match(item(el, "u").attributes["aria-label"], /: – V$/, "ohne Salzbrücke keine Spannung");
  press(el, "hand", "bridge");
  assert.match(part(el, ".cl-hand").innerHTML, /erste Gefäß/);
  tap(el, "l");
  assert.match(part(el, ".cl-hand").innerHTML, /zweite Gefäß/);
  tap(el, "l");
  assert.equal(part(el, ".cl-status").textContent, "Die Salzbrücke braucht zwei verschiedene Gefäße.");
  tap(el, "r");
  assert.equal(state(el).hand, null);
  const bridge = state(el).run.lab.tools.find((t) => t.type === "bridge");
  assert.deepEqual([bridge.in, bridge.to], ["l", "r"]);
  assert.match(logOf(el), /Salzbrücke 1 zwischen Becherglas 1 und Becherglas 2 gesetzt/);
  frames(10);
  assert.match(item(el, "u").attributes["aria-label"], /: 1,\d\d V$/);
  assert.equal(item(el, bridge.id).attributes["aria-label"], "Salzbrücke 1 zwischen Becherglas 1 und Becherglas 2");
  assert.match(item(el, bridge.id).innerHTML, /cl-bridge/);
  assert.match(item(el, "e2").attributes["aria-label"], /Pluspol/);
  assert.equal(part(el, ".cl-svg").querySelector(".cl-wires").innerHTML.match(/<path/g).length, 2, "zwei Leitungen zum Spannungsmesser");
});

test("Klang: Gasblasen an Elektroden sprudeln hörbar", () => {
  const l = cell([{ reagent: "H2SO4 0.5M", ml: 80 }], "Pt", "Pt", 0);
  assert.equal(L.fx.levels(l).fizz, 0);
  L.setVolts(l, "n", 6);
  L.step(l, 2);
  assert.ok(L.fx.levels(l).fizz > 0.2);
});

test("Ohne Zahlen: Elektrolyse und Leitfähigkeit bleiben beobachtbar", () => {
  const el = mount(Object.assign({}, electro, { bench: electro.bench.concat([{ type: "lamp", id: "la", in: "b" }]), show: { numbers: false } }));
  tap(el, "n");
  enter(el, "change", "volts", "4.5");
  frames(40);
  assert.equal(item(el, "la").attributes["aria-label"], "Lämpchen 1 an Becherglas 1: leuchtet hell");
  assert.doesNotMatch(item(el, "a").attributes["aria-label"], /\d mA|\d A/);
  assert.match(logOf(el), /Lämpchen 1 leuchtet/);
  assert.match(logOf(el), /scheidet sich Kupfer ab/);
});

test("README: die Versuche der Folien zur Elektrochemie verlaufen wie beschrieben", () => {
  const readme = fs.readFileSync(new URL("README.md", here), "utf8");
  const slide = (title) => {
    const m = new RegExp("\n## " + title + "\n[\\s\\S]*?```+ *json +@ChemLab\\.sim\n([\\s\\S]*?)\n```").exec(readme);
    assert.ok(m, "Folie " + title);
    return L.createLab(L.normalize(m[1]));
  };
  const first = (l, type) => l.tools.find((t) => t.type === type).id;

  let l = slide("Leitfähigkeit");
  L.step(l, 3);
  assert.ok(L.reading(l, first(l, "lamp")).value < 0.01, "in destilliertem Wasser bleibt das Lämpchen dunkel");
  assert.ok(L.reading(l, first(l, "conductometer")).value < 0.001);
  L.add(l, "glas", "NaCl 1M", { ml: 20 });
  const seen = collect(l, 10);
  assert.ok(keys(seen).includes("lampOn") && keys(seen).includes("bubbles"), "mit Kochsalz leuchtet es, und an den Elektroden entsteht Gas");
  assert.ok(L.reading(l, first(l, "conductometer")).value > 10);

  l = slide("Leitfähigkeitstitration");
  const meter = first(l, "conductometer"), burette = l.vessels.find((v) => v.over).id, curve = [];
  L.setTap(l, burette, 0.5);
  while (L.vessel(l, burette).given < 30) { L.step(l, 1); curve.push([L.vessel(l, burette).given, L.reading(l, meter).value]); }
  const low = curve.reduce((a, b) => (b[1] < a[1] ? b : a));
  near(low[0], 20, 1.5, "der Knick liegt am Äquivalenzpunkt bei 20 mL");

  l = slide("Wasser zerlegen");
  const supply = first(l, "supply");
  L.setVolts(l, supply, 1.4); L.step(l, 3);
  assert.ok(L.circuit(l, "zelle").I < 0.002, "unter der Zersetzungsspannung fast kein Strom");
  L.setVolts(l, supply, 3); L.step(l, 3);
  assert.ok(L.circuit(l, "zelle").I > 0.1);
  near(L.reading(l, l.tools[1].id).bub, 2 * L.reading(l, l.tools[0].id).bub, 1e-9, "am Minuspol doppelt so viel Gas");

  l = slide("Kupfer abscheiden");
  const q = charge(l, 60, "zelle");
  near(L.reading(l, l.tools[1].id).g - 10, q / (2 * L.FARADAY) * 63.546, 1e-6);
  near((L.reading(l, l.tools[1].id).g - 10) / q * 60 * 1000, 19.8, 0.05, "1 A scheidet in einer Minute 19,8 mg Kupfer ab: gemessen an Masse und Ladung des Versuchs");

  l = slide("Galvanische Zelle");
  near(L.reading(l, first(l, "voltmeter")).value, 1.10, 0.02);
  assert.ok(L.atRest(l), "ohne Verbraucher geschieht nichts");
  L.place(l, { type: "lamp", in: "links" });
  L.step(l, 5);
  assert.ok(L.circuit(l, "links").I > 0.005 && L.reading(l, first(l, "lamp")).value < 0.05, "für das Lämpchen reicht der Strom nicht");

  l = slide("Elektrolyse");
  L.setVolts(l, first(l, "supply"), 4);
  const events = collect(l, 30);
  assert.ok(events.some((e) => e.key === "plated" && e.species === "Cu(s)") && events.some((e) => e.key === "smell" && e.species === "Cl2(g)"));

  l = slide("Eigene Stoffe und Reaktionen");
  const [copper, zinc, acid] = l.vessels.map((v) => v.id);
  for (const id of [copper, zinc, acid]) L.add(l, id, "Sn granules", { g: 1 });
  const tin = collect(l, 300);
  assert.ok(amount(l, "Cu(s)", copper) > 5e-5, "Zinn verdrängt Kupfer");
  assert.ok(tin.some((e) => e.key === "plated" && e.on === "Sn(s)"));
  assert.equal(amount(l, "Zn(s)", zinc), 0, "aber nicht Zink");
  assert.ok(gasOf(l, "H2(g)", acid) < 1e-7, "in verdünnter Salzsäure löst es sich kaum");
  near(L.heatOf("Sn(s) + Cu^2+(aq) -> Sn^2+(aq) + Cu(s)"), -8.9 - 64.9, 0.01, "die Reaktionswärme folgt aus den Bildungsenthalpien");
});

test("Zeichnung: ein Metallstreifen trägt die Farbe seines Metalls, auch gegen die Vorgabe des Stylesheets", () => {
  const l = metal("ZnSO4 0.1M", "Cu sheet", 0.5);
  const svg = L.parts.testtube.draw(look(l), ctx());
  assert.match(svg, /<polyline class="cl-solid"[^>]*style="stroke:#b5653a"/, "Kupfer ist kupferfarben");
  const sheet = fs.readFileSync(new URL("chemlab.css", here), "utf8");
  assert.match(sheet, /\.cl-solid \{ stroke:/, "das Stylesheet gibt Feststoffen eine Randfarbe: deshalb steht die Farbe des Streifens im style");
});

// ================================================================ Eigene Befunde nach Meilenstein 4

test("Zwei gleiche Elektroden im geschlossenen Stromkreis: es fließt kein Strom, aber Zink löst sich in Säure trotzdem", () => {
  const l = cell([{ reagent: "HCl 1M", ml: 80 }], "Zn", "Zn", 0);
  assert.equal(L.atRest(l), false);
  L.step(l, 30);
  assert.equal(L.circuit(l, "b").I, 0, "zwischen zwei gleichen Elektroden fließt nichts");
  assert.ok(gasOf(l, "H2(g)") > 2e-5, `${gasOf(l, "H2(g)")} mol Wasserstoff`);
  assert.ok(L.reading(l, "e1").g < 10 && L.reading(l, "e2").g < 10, "beide Elektroden verlieren Zink");
  assert.ok(L.reading(l, "e1").bub > 0, "an beiden steigen Blasen auf");
});

test("Spannungsregler mit der Tastatur: viele kleine Schritte hintereinander ergeben eine Zeile im Protokoll, nicht viele", () => {
  const el = mount(electro);
  tap(el, "n");
  for (const volts of ["0.1", "0.2", "0.3", "0.4"]) enter(el, "change", "volts", volts);
  assert.equal(state(el).run.lab.tools.find((t) => t.id === "n").volts, 0.4);
  assert.equal((logOf(el).match(/eingestellt/g) || []).length, 1);
  assert.match(logOf(el), /Netzgerät 1: 0,4 V eingestellt/);
  assert.equal(state(el).run.log.filter((e) => e.key === "volts").length, 1);
  enter(el, "change", "volts", "3");
  assert.equal((logOf(el).match(/eingestellt/g) || []).length, 1, "auch der große Schritt gehört noch zum selben Dreh");
  frames(60);                                                   // nun läuft der Versuch drei Sekunden: die nächste Einstellung zählt für sich
  enter(el, "change", "volts", "3.5");
  assert.equal((logOf(el).match(/eingestellt/g) || []).length, 2);
  assert.match(logOf(el), /Netzgerät 1: 3,0 V eingestellt[\s\S]*Netzgerät 1: 3,5 V eingestellt/);
  L.seek(state(el).run, 0);
  assert.equal(state(el).run.lab.tools.find((t) => t.id === "n").volts, 0, "am Anfang der Aufzeichnung war das Netzgerät aus");
});

test("Bedienfeld: beim Lämpchen steht, ob es leuchtet, auch ohne Zahlen", () => {
  const el = mount(Object.assign({}, electro, { bench: electro.bench.concat([{ type: "lamp", id: "la", in: "b" }]), show: { numbers: false } }));
  tap(el, "la");
  assert.equal(part(el, ".cl-panel").querySelector(".cl-contents").innerHTML, "<p>Dunkel.</p>");
  tap(el, "n");
  enter(el, "change", "volts", "4.5");
  frames(20);
  tap(el, "la");
  assert.equal(part(el, ".cl-panel").querySelector(".cl-contents").innerHTML, "<p>Leuchtet hell.</p>");
});

// ================================================================ Befunde des Belastungstests, Meilenstein 4

test("Ruhe: ein Metall, das sich unterhalb der Sichtbarkeit löst, hält die Uhr nicht am Laufen", () => {
  // Eisenwolle in sehr verdünnter Säure: knapp 1 nmol/s. Blasen zeigt die Fläche erst ab 1 nmol/s; dann darf auch die Uhr stehen.
  const l = metal("HCl 0.001M", "Fe wool", 0.07);
  L.step(l, 5);
  const rate = L.reactions(l, "b").find((r) => r.eq === "Fe(s) + 2 H+(aq) -> Fe^2+(aq) + H2(g)").rate;
  assert.ok(rate > 5e-10 && rate < 1e-9, `Geschwindigkeit ${rate} mol/s`);
  assert.equal(look(l).gas < 1e-9, true);
  assert.ok(L.atRest(l), "nichts Sichtbares geschieht: die Uhr steht");
  const fast = metal("HCl 0.001M", "Fe wool", 0.2);
  L.step(fast, 5);
  assert.equal(L.atRest(fast), false, "mit mehr Eisen sind es über 1 nmol/s: die Uhr läuft");
});

test("Ruhe: ein Niederschlag, der unmerklich langsam nachwächst, hält die Uhr nicht am Laufen", () => {
  L.register({
    species: {
      "CdO(s)": { name: { de: "Cadmiumoxid" }, Hf: null, color: "#3a4a3a", src: "Test" },
      "Cd^2+(aq)": { name: { de: "Cadmium-Ion" }, Hf: null, src: "Test" },
      "Cd(OH)2(s)": { name: { de: "Cadmiumhydroxid" }, Hf: null, color: "#d98aa0", src: "Test" }
    },
    equilibria: [{ eq: "Cd(OH)2(s) <=> Cd^2+(aq) + 2 OH-(aq)", logK: -15, src: "Test" }],
    reactions: [{ eq: "CdO(s) + H2O(l) -> Cd^2+(aq) + 2 OH-(aq)", rate: { k: 1e-11, surface: "CdO(s)" }, src: "Test" }],
    reagents: { "CdO": { name: { de: "Cadmiumoxid" }, solid: "CdO(s)", area: 10 } }
  });
  const l = tubeOf([{ reagent: "NaOH 0.01M", ml: 10 }, { reagent: "CdO", g: 3 }]);
  L.step(l, 60);
  const first = solid(l, "Cd(OH)2(s)");
  L.step(l, 60);
  const grown = solid(l, "Cd(OH)2(s)") - first;
  assert.ok(grown > 6e-9 && grown < 6e-8, `in einer Minute wachsen ${grown} mol Niederschlag nach: unter 1 nmol/s`);
  assert.ok(L.atRest(l), "das sieht niemand: die Uhr steht");
});

// ================================================================ Befunde der Durchsicht, Meilenstein 4

test("Elektrolyse in Soda-Lösung und in Lauge: ein knappes freies Ion bremst den Strom nicht aus", () => {
  // Gebraucht wird mehr H+, als gerade frei vorliegt: es kommt aus dem Hydrogencarbonat nach. Ebenso Zink-Ionen aus dem Zinkat.
  const soda = cell([{ reagent: "Na2CO3 0.5M", ml: 80 }], "C", "C", 6), before = totalsE(soda);
  const first = L.circuit(soda, "b").I;
  L.step(soda, 10);
  const I = L.circuit(soda, "b").I;
  assert.ok(first > 0.3 && I > 0.8 * first, `Strom am Anfang ${first} A, nach 10 s ${I} A`);
  near(L.reading(soda, "u").value, 6 - 0.5 * I, 0.02, "die Spannung an den Elektroden passt zum Strom");
  for (const [id, n] of Object.entries(L.vessel(soda, "b").n)) assert.ok(n > 0, id + " = " + n);
  near(totalsE(soda).mass, before.mass, 1e-9, "Masse");
  near(chargeIn(soda, "b"), 0, 1e-12, "Ladung");
  const zincate = cell([{ reagent: "NaOH 1M", ml: 80 }], "Zn", "Zn", 6);
  L.step(zincate, 20);
  assert.ok(L.circuit(zincate, "b").I > 0.5, `Zink in Natronlauge: ${L.circuit(zincate, "b").I} A`);
  assert.ok(dissolved(zincate, "Zn") > 1e-5, "Zink geht als Zinkat in Lösung");
  const lamp = lab([{ type: "beaker", id: "b", ml: 250, contains: [{ reagent: "H2O", ml: 100 }, { reagent: "Na2CO3 1M", ml: 10 }] }, { type: "electrode-C", in: "b" }, { type: "electrode-C", in: "b" },
    { type: "supply", in: "b", volts: 6 }, { type: "lamp", id: "la", in: "b" }], { room: 25 });
  L.step(lamp, 10);
  assert.ok(L.reading(lamp, "la").value > 0.05, "in Soda-Lösung leuchtet das Lämpchen wie in Kochsalzlösung: " + L.reading(lamp, "la").value);
});

test("Zink in ammoniakalischer Kupfersulfat-Lösung: das Kupfer scheidet sich auch aus dem Komplex ab", () => {
  const l = lab([{ type: "testtube", id: "b", contains: [{ reagent: "CuSO4 0.1M", ml: 5 }, { reagent: "NH3 1M", ml: 5 }, { reagent: "Zn powder", g: 0.5 }] }], { room: 25 });
  const t = until(l, () => solid(l, "Cu(s)") > 4e-4, 900);
  assert.ok(t < 900, `nach ${t} s liegen ${solid(l, "Cu(s)")} mol Kupfer im Glas`);
  for (const [id, n] of Object.entries(L.vessel(l, "b").n)) assert.ok(n > 0, id + " = " + n);
});

test("Elektroden behalten ihre Seite: wird die linke ersetzt, bleibt die rechte rechts und Minuspol", () => {
  const l = cell([{ reagent: "CuSO4 0.5M", ml: 80 }], "C", "C", 3);
  L.step(l, 30);
  assert.deepEqual([L.reading(l, "e1").side, L.reading(l, "e2").side, L.reading(l, "e2").pole], [0, 1, "-"]);
  L.remove(l, "e1");
  const made = L.place(l, { type: "electrode-Cu", in: "b" });
  assert.deepEqual([L.reading(l, made).side, L.reading(l, "e2").side], [0, 1], "die neue nimmt den freien Platz links");
  assert.deepEqual([L.reading(l, made).pole, L.reading(l, "e2").pole], ["+", "-"]);
  assert.equal(L.circuit(l, "b").a, made);
  assert.ok(L.circuit(l, "b").I > 0.05, "der Strom fließt in derselben Richtung weiter");
});

test("Salzbrücke und Stromkreis in der Beschreibung: ein Ende je Gefäß, Geräte des Stromkreises nur am Becherglas", () => {
  const three = [{ type: "beaker", id: "x" }, { type: "beaker", id: "y" }, { type: "beaker", id: "z" }];
  const wrong = (more, label) => assert.throws(() => L.normalize({ bench: three.concat(more) }), (e) => e.code === "place", label);
  wrong([{ type: "bridge", in: "x", to: "y" }, { type: "bridge", in: "x", to: "z" }], "zwei Brücken beginnen im selben Glas");
  wrong([{ type: "bridge", in: "x", to: "y" }, { type: "bridge", in: "z", to: "y" }], "zwei Brücken enden im selben Glas");
  wrong([{ type: "bridge", in: "x", to: "y" }, { type: "bridge", in: "y", to: "z" }], "eine endet, wo die andere beginnt");
  for (const type of ["supply", "ammeter", "voltmeter", "lamp"]) {
    assert.throws(() => L.normalize({ bench: [{ type: "testtube", id: "t" }, { type, in: "t" }] }), (e) => e.code === "place", type + " am Reagenzglas");
    assert.throws(() => L.normalize({ bench: [{ type: "dish", id: "d" }, { type, in: "d" }] }), (e) => e.code === "place", type + " an der Schale");
  }
  const l = lab(three.concat([{ type: "bridge", id: "s", in: "x", to: "y" }]));
  const second = L.place(l, { type: "bridge", in: "x", to: "z" });
  assert.deepEqual([L.reading(l, second).in, L.reading(l, second).to], [null, null], "aus dem Regal dazugestellt bleibt sie für sich liegen");
  const third = L.place(l, { type: "electrode-Zn", in: "x" }), fourth = L.place(l, { type: "electrode-Zn", in: "x" }), fifth = L.place(l, { type: "electrode-Zn", in: "x" });
  assert.deepEqual([third, fourth, fifth].map((id) => L.reading(l, id).in), ["x", "x", null], "eine dritte Elektrode findet im Glas keinen Platz");
});

test("Ruhepotential: es hängt nicht von der Vorgeschichte ab", () => {
  const run = L.createRun(L.normalize({ room: 25, bench: [{ type: "beaker", id: "b", contains: [{ reagent: "NaCl 0.1M", ml: 80 }] },
    { type: "electrode-C", id: "e1", in: "b" }, { type: "electrode-Pt", id: "e2", in: "b" }, { type: "voltmeter", id: "u", in: "b" }] }));
  L.act(run, (l) => L.add(l, "b", "HCl 0.1M", { drops: 1 }));
  L.advance(run, 5);
  const U = L.circuit(run.lab, "b").U;
  L.seek(run, run.end);                                         // zurückgeholt aus der Aufzeichnung: ohne die Zwischenwerte des Lösers
  near(L.circuit(run.lab, "b").U, U, 1e-9, "dieselbe Spannung");
  assert.ok(L.atRest(run.lab), "und nichts, was die Uhr wieder anlaufen ließe");
});

test("Wärme der Elektrolyse: die Lösung erwärmt sich um das, was an Spannung über die Reaktionsenthalpie hinaus anliegt", () => {
  const l = cell([{ reagent: "H2SO4 1M", ml: 80 }], "Pt", "Pt", 12), v = L.vessel(l, "b"), C = L.heatCapacity(v);
  let heat = 0;
  // 1,481 V: bei dieser Spannung deckt die elektrische Arbeit gerade die Enthalpie der Wasserzerlegung (285,83 kJ/mol)
  for (let i = 0; i < 600; i++) { L.step(l, 0.05); const c = L.circuit(l, "b"); heat += (c.U - 1.481) * c.I * 0.05; }
  assert.ok(heat > 200, `${heat} J in 30 s`);
  near(v.T - 25, heat / C, 0.06 * heat / C, "Erwärmung in K");
});

test("Geht einer Elektrode mitten im Rechenschritt das Metall aus, gibt die Salzbrücke nur ab, was wirklich floss", () => {
  const l = lab([{ type: "beaker", id: "l", contains: [{ reagent: "CuSO4 0.1M", ml: 80 }] }, { type: "electrode-Cu", id: "e1", in: "l", g: 0.0005 },
    { type: "beaker", id: "r", contains: [{ reagent: "AgNO3 0.1M", ml: 80 }] }, { type: "electrode-Ag", id: "e2", in: "r" },
    { type: "bridge", id: "s", in: "l", to: "r" }, { type: "ammeter", id: "a", in: "l" }], { room: 25 }), seen = [];
  const copper = 0.0005 / L.species("Cu(s)").M;
  until(l, () => keys(seen).includes("spent"), 900, seen);
  assert.ok(keys(seen).includes("spent"), "die dünne Kupferelektrode ist aufgebraucht");
  L.step(l, 2);
  near(amount(l, "NO3-(aq)", "l"), 2 * copper, 1e-12, "je Kupfer-Ion zwei Nitrat-Ionen aus der Brücke");
  near(chargeIn(l, "l"), 0, 1e-12, "links neutral");
  near(chargeIn(l, "r"), 0, 1e-12, "rechts neutral");
});

test("Ein Belag bestimmt die Oberfläche: eine verzinkte Graphit-Elektrode entwickelt in Säure Wasserstoff wie Zink", () => {
  const l = cell([{ reagent: "ZnSO4 0.5M", ml: 80 }], "C", "C", 5, [{ type: "beaker", id: "h", contains: [{ reagent: "HCl 1M", ml: 80 }] }]);
  until(l, () => (L.reading(l, "e2").coat[0] || { n: 0 }).n > 1e-4, 600);
  assert.ok(L.reading(l, "e2").coat[0].n > 1e-4, "Zink auf dem Graphit");
  L.setVolts(l, "n", 0);
  assert.equal(L.attach(l, "e2", "h"), true, "die Elektrode in die Säure umsetzen");
  L.step(l, 2);
  const zinc = lab([{ type: "beaker", id: "h", contains: [{ reagent: "HCl 1M", ml: 80 }] }, { type: "electrode-Zn", id: "e", in: "h" }], { room: 25 });
  L.step(zinc, 2);
  near(L.reading(l, "e2").bub, L.reading(zinc, "e").bub, 0.1 * L.reading(zinc, "e").bub, "Wasserstoff in mol/s");
});

test("Nach einem Eingriff stimmen Strom und Pole sofort, nicht erst nach dem nächsten Rechenschritt", () => {
  const l = cell([{ reagent: "CuSO4 0.5M", ml: 80 }], "C", "C", 0);
  L.setVolts(l, "n", 3);
  assert.ok(L.circuit(l, "b").I > 0.05);
  assert.deepEqual([L.reading(l, "e1").pole, L.atRest(l)], ["+", false]);
  L.setPole(l, "n", true);
  assert.ok(L.circuit(l, "b").I < -0.05, "umgepolt fließt der Strom anders herum");
  assert.equal(L.reading(l, "e1").pole, "-");
  L.remove(l, "e2");
  assert.equal(L.circuit(l, "b"), null, "ohne die zweite Elektrode gibt es keinen Stromkreis");
  assert.equal(L.reading(l, "e1").pole, "");
  const loose = L.place(l, { type: "electrode-C" });
  assert.equal(L.attach(l, loose, "b"), true);
  assert.ok(L.circuit(l, "b").I < -0.05, "mit der neuen Elektrode fließt er sofort wieder");
  L.step(l, 10);
  assert.ok(halves(l).length > 0);
  L.empty(l, "b");
  assert.deepEqual(halves(l), [], "nach dem Ausleeren beginnt auch die Liste der Elektrodenvorgänge von vorn");
  assert.equal(L.circuit(l, "b").I, 0);
});

test("Aufzeichnung: auch die Spannung am Spannungsmesser kommt beim Zurückspulen wieder", () => {
  const run = L.createRun(L.normalize(electro));
  L.act(run, (l) => L.setVolts(l, "n", 3));
  L.advance(run, 29);
  const U = L.reading(run.lab, "u").value;
  assert.ok(U > 2 && U < 3);
  L.advance(run, 1);
  L.act(run, (l) => L.setVolts(l, "n", 6));
  L.advance(run, 30);
  assert.ok(L.reading(run.lab, "u").value > U + 1);
  L.seek(run, 29);                                              // eine Sekunde vor dem Hochdrehen
  near(L.reading(run.lab, "u").value, U, 1e-12);
  near(L.circuit(run.lab, "b").U, U, 1e-3, "und der Stromkreis rechnet dieselbe Spannung nach");
});

test("Eigene Elektrode: wie in der README eingetragen, hat sie Namen, Bild und Zeichnung; fehlt ihr Stoff, stört sie keine andere Fläche", () => {
  const base = { kind: "tool", g: 10, unit: "g", lag: 0 };
  L.registerPart("electrode-Qq", Object.assign({ electrode: "Qq(s)" }, base, L.electrodeLook));      // ihr Stoff ist nirgends eingetragen
  try {
    assert.doesNotMatch(part(mount({}), ".cl-shelf").innerHTML, /electrode-Qq/, "ohne ihren Stoff steht sie nicht im Regal");
    assert.throws(() => L.normalize({ bench: [{ type: "electrode-Qq" }] }), (e) => e.code === "species" && e.detail === "Qq(s)");
    assert.match(mount({ bench: [{ type: "electrode-Qq" }] }).innerHTML, /role="alert"/);
  } finally { delete L.parts["electrode-Qq"]; }
  const readme = fs.readFileSync(new URL("README.md", here), "utf8");
  L.normalize(/\n## Eigene Stoffe und Reaktionen\n[\s\S]*?```+ *json +@ChemLab\.sim\n([\s\S]*?)\n```/.exec(readme)[1]);       // trägt das Zinn ein
  const line = /`(LiaChemLab\.registerPart\("electrode-Sn",[^`]*)`/.exec(readme);
  assert.ok(line, "die README zeigt, wie eine eigene Elektrode eingetragen wird");
  new Function("LiaChemLab", line[1])(L);                       // genau so, wie es dort steht
  try {
    assert.equal(L.partName("electrode-Sn", "de"), "Zinn-Elektrode");
    assert.equal(L.partName("electrode-Sn", "en"), "tin electrode");
    const el = mount({ bench: [{ type: "beaker", id: "b", contains: [{ reagent: "CuSO4 0.1M", ml: 80 }] }, { type: "electrode-Sn", id: "e", in: "b" }] });
    assert.match(part(el, ".cl-shelf").innerHTML, /data-id="electrode-Sn"[^>]*>.*?<span>Zinn-Elektrode<\/span>/);
    assert.equal(item(el, "e").attributes["aria-label"], "Zinn-Elektrode 1 in Becherglas 1: 10,000 g");
    clean(item(el, "e").innerHTML, "Zinn-Elektrode");
    press(el, "play");
    frames(200);
    assert.match(logOf(el), /An Zinn-Elektrode 1 scheidet sich Kupfer ab/);
    L.registerPart("electrode-Xy", Object.assign({ electrode: "Sn(s)", name: { de: "Lötzinn-Stab", en: "solder rod" } }, base, L.electrodeLook));
    assert.equal(L.partName("electrode-Xy", "de"), "Lötzinn-Stab", "ein eigener Name geht vor");
  } finally { delete L.parts["electrode-Sn"]; delete L.parts["electrode-Xy"]; }
});

test("Kennlinie: wird die Spannung wieder gesenkt, bleibt die Kurve stehen; bei 0 V verschwindet das Diagramm nicht", () => {
  const el = mount(electro);
  tap(el, "n");
  for (const volts of ["1", "2", "3"]) { enter(el, "change", "volts", volts); frames(40); }
  const up = L.curve(state(el).run, { x: "n", tool: "a" }).length;
  enter(el, "change", "volts", "2.5");
  frames(40);
  const points = L.curve(state(el).run, { x: "n", tool: "a" });
  assert.ok(points.length > up, "der Rückweg kommt als weiterer Punkt dazu");
  assert.ok(points.some((p) => p[0] === 3) && points[points.length - 1][0] === 2.5);
  enter(el, "change", "volts", "0");
  frames(40);
  assert.match(part(el, ".cl-charts").innerHTML, /Stromstärke über der Spannung/);
});

test("Liste der Reaktionen: was eine Metalloberfläche nur in Spuren umsetzt, steht nicht darin", () => {
  const l = metal("ZnI2 0.5M", "Zn powder", 0.5);
  L.step(l, 300);
  const list = L.reactions(l, "b").filter((r) => !/<=>/.test(r.eq));
  assert.ok(list.every((r) => r.extent > 1e-9), JSON.stringify(list.map((r) => [r.eq, r.extent])));
  assert.ok(!list.some((r) => /I3-/.test(r.eq)), "Iod entsteht an Zink nicht");
});

test("Pole einer fast kurzgeschlossenen Zelle: sie stehen da, auch wenn kaum Spannung bleibt", () => {
  const l = cell([{ reagent: "CH3COOH 1M", ml: 80 }], "Zn", "Cu", 0);
  L.step(l, 5);
  assert.ok(L.circuit(l, "b").I > 1e-4 && Math.abs(L.circuit(l, "b").U) < 1e-3, `${L.circuit(l, "b").I} A bei ${L.circuit(l, "b").U} V`);
  assert.equal(poles(l), "-+", "Zink gibt die Elektronen ab: Minuspol");
});

test("Zeichnung und Rechnung stimmen überein: eine Elektrode taucht genau dann ein, wenn auch Strom fließen kann", () => {
  for (const [ml, wet] of [[8, false], [12, true]]) {
    const l = cell([{ reagent: "NaCl 1M", ml }], "C", "C", 6), v = L.vessel(l, "b");
    L.step(l, 2);
    assert.equal(L.circuit(l, "b").I > 0, wet, ml + " mL: Strom");
    const at = L.parts.beaker.probe(v, "electrode-C", 0), surface = L.parts.beaker.surface(look(l));
    assert.equal(surface < at.bottom, wet, `${ml} mL: Spiegel bei ${surface}, unteres Ende der Elektrode bei ${at.bottom}`);
  }
});

test("Spannungsregler: Schritte verschmelzen im Protokoll nur, solange die Uhr zwischen ihnen nicht weiterlief", () => {
  const el = mount(electro);
  tap(el, "n");
  enter(el, "change", "volts", "3");
  frames(10);                                                   // eine halbe Sekunde Versuch
  enter(el, "change", "volts", "3.2");
  assert.equal((logOf(el).match(/eingestellt/g) || []).length, 2, "3,0 V galt eine halbe Sekunde lang: das bleibt stehen");
  L.seek(state(el).run, 0.3);
  assert.equal(state(el).run.lab.tools.find((t) => t.id === "n").volts, 3);
  const lines = L.logAt(state(el).run).map((e) => L.say(e, { lang: "de", numbers: true, names: state(el).names }));
  assert.ok(lines.includes("Netzgerät 1: 3,0 V eingestellt") && !lines.some((line) => /3,2 V/.test(line)), lines.join(" | "));
});

test("Spannungsregler: wird das Ziehen abgebrochen, zeigt er wieder die eingestellte Spannung", () => {
  const el = mount(electro);
  tap(el, "n");
  enter(el, "input", "volts", "3");
  const shown = part(el, ".cl-panel").querySelector(".cl-volts-shown");
  assert.equal(shown.textContent, "3,0 V", "beim Ziehen folgt die Anzeige");
  assert.equal(state(el).run.lab.tools.find((t) => t.id === "n").volts, 0, "eingestellt ist noch nichts");
  el.listeners.focusout({ type: "focusout", target: control({ "data-act": "volts" }, "3") });
  assert.equal(shown.textContent, "0,0 V");
});

test("Salzbrücke und Stromkreis an der Fläche: keine zweite Brücke am selben Gefäß, kein Stromkreis an Reagenzglas oder Schale", () => {
  const el = mount({ bench: [{ type: "beaker", id: "l" }, { type: "beaker", id: "r" }, { type: "beaker", id: "z" }, { type: "bridge", id: "s", in: "l", to: "r" }], shelf: ["bridge"] });
  press(el, "hand", "bridge");
  tap(el, "l");
  assert.equal(part(el, ".cl-status").textContent, "Dieses Gefäß hat schon ein solches Gerät.");
  assert.match(part(el, ".cl-hand").innerHTML, /erste Gefäß/, "die Hand wartet weiter auf das erste Gefäß");
  tap(el, "z");
  assert.match(part(el, ".cl-hand").innerHTML, /zweite Gefäß/);
  tap(el, "r");
  assert.equal(part(el, ".cl-status").textContent, "Dieses Gefäß hat schon ein solches Gerät.");
  assert.equal(state(el).run.lab.tools.length, 1, "es bleibt bei der einen Brücke");
  assert.doesNotMatch(logOf(el), /Salzbrücke 2/);
  const small = mount({ bench: [{ type: "testtube", id: "t" }, { type: "dish", id: "d" }], shelf: ["lamp", "supply", "ammeter", "voltmeter"] });
  for (const id of ["lamp", "supply", "ammeter", "voltmeter"]) {
    press(small, "hand", id);
    for (const vessel of ["t", "d"]) {
      tap(small, vessel);
      assert.equal(part(small, ".cl-status").textContent, "Ein Stromkreis braucht Elektroden: Das geht nur an einem Becherglas.", id + " an " + vessel);
    }
    press(small, "hand", id);
  }
  assert.equal(state(small).run.lab.tools.length, 0);
});

test("Ohne Zahlen: auch das Netzgerät nennt keine Spannung", () => {
  const el = mount(Object.assign({}, electro, { show: { numbers: false } }));
  tap(el, "n");
  enter(el, "change", "volts", "4.5");
  assert.match(logOf(el), /Netzgerät 1: Spannung eingestellt/);
  assert.doesNotMatch(logOf(el), /4,5/);
  assert.equal(part(el, ".cl-panel").querySelector(".cl-volts-shown").textContent, "");
  assert.doesNotMatch(part(el, ".cl-panel").querySelector(".cl-volts").attributes["aria-valuetext"], /V$/);
  enter(el, "change", "volts", "0");
  assert.match(logOf(el), /Netzgerät 1: ausgeschaltet/);
});

test("Englische Sätze beginnen groß, auch wenn ein Stoffname vorn steht", () => {
  const c = { lang: "en", numbers: true, names: { b: "beaker 1", e2: "graphite electrode 2" } };
  assert.equal(L.say({ key: "plated", vessel: "b", part: "e2", species: "Cu(s)" }, c), "Copper deposits on graphite electrode 2.");
  assert.equal(L.say({ key: "plated", vessel: "b", species: "Cu(s)", on: "Zn(s)" }, c), "beaker 1: Copper deposits on the zinc.");
  assert.equal(L.say({ key: "probe", part: "ph", vessel: "b" }, { lang: "de", names: { ph: "pH-Meter 1", b: "Becherglas 1" } }), "pH-Meter 1 in Becherglas 1 gestellt", "ein Name, der klein beginnt, bleibt klein");
  assert.equal(L.say({ key: "bubbles", vessel: "b", part: "e2" }, c), "Gas bubbles rise at graphite electrode 2.");
});

test("Verdrängung in warmer Lösung: der Stoff kommt schneller an die Oberfläche, das Kupfer scheidet sich schneller ab", () => {
  const cold = metal("CuSO4 0.1M", "Zn powder", 0.2, { room: 25 }), warm = metal("CuSO4 0.1M", "Zn powder", 0.2, { room: 45 });
  L.step(cold, 20); L.step(warm, 20);
  const ratio = solid(warm, "Cu(s)") / solid(cold, "Cu(s)");
  assert.ok(ratio > 1.3 && ratio < 2, `bei 45 °C ${ratio}-mal so viel wie bei 25 °C`);
});

// ================================================================ Offene Punkte nach Meilenstein 4

test("Zink in Natronlauge: als Pulver entwickelt es langsam Wasserstoff und geht als Zinkat in Lösung; Granalien reagieren kaum", () => {
  const lye = metal("NaOH 2M", "Zn powder", 2), before = totals(lye);
  assert.equal(L.atRest(lye), false, "es steht eine Reaktion bereit");
  const seen = collect(lye, 300), h2 = gasOf(lye, "H2(g)");
  assert.ok(h2 > 1e-6 && h2 < 1e-4, `in fünf Minuten ${h2} mol Wasserstoff`);
  assert.ok(keys(seen).includes("gas"), "Gasblasen");
  near(dissolved(lye, "Zn"), h2, 1e-9, "je Wasserstoff-Molekül ein Zink-Atom in Lösung");
  assert.ok(amount(lye, "Zn(OH)4^2-(aq)") > 0.9 * h2, "als Zinkat");
  assert.ok(equations(lye).includes("Zn(s) + 2 OH-(aq) + 2 H2O(l) -> Zn(OH)4^2-(aq) + H2(g)"), equations(lye).join(" | "));
  near(totals(lye).mass, before.mass, 1e-9, "Masse");
  near(totals(lye).charge, before.charge, 1e-12, "Ladung");
  // Zink geht über das Zinkat in Lösung. Dass es zugleich über Zink-Ionen wieder abgeschieden würde, wäre ein Kreislauf ohne Sinn.
  assert.ok(!keys(seen).includes("plated"), "es scheidet sich kein Zink auf dem Zink ab");
  assert.equal(L.vessel(lye, "b").lumps.filter((x) => x.id === "Zn(s)" && x.made).length, 0);
  const grains = metal("NaOH 1M", "Zn granules", 2);
  assert.ok(L.atRest(grains), "Granalien in verdünnter Lauge: nichts Sichtbares");
  assert.deepEqual(keys(collect(grains, 300)), []);
  assert.ok(gasOf(grains, "H2(g)") < 2e-7);
  near(couple("Zn(OH)4^2-(aq) + 2 e- <=> Zn(s) + 4 OH-(aq)").E0, -1.22, 0.01, "das Potential folgt aus dem Paar Zn²⁺/Zn und der Bildungskonstante des Zinkats");
});

test("Silber am Pluspol in Kochsalzlösung: es überzieht sich mit Silberchlorid und wird schwerer; umgepolt wird der Belag wieder zu Silber", () => {
  const l = cell([{ reagent: "NaCl 1M", ml: 80 }], "Ag", "Ag", 3), before = totalsE(l), seen = [];
  const q = (() => { let sum = 0; for (let i = 0; i < 1200; i++) { L.step(l, 0.05, (e) => seen.push(e)); sum += L.circuit(l, "b").I * 0.05; } return sum; })();
  const coat = L.reading(l, "e1").coat;
  assert.deepEqual(coat.map((c) => c.id), ["AgCl(s)"], "der Belag ist Silberchlorid");
  // bis auf den winzigen Anteil, der als Silber-Ion in Lösung geht und dort ausfällt
  near(coat[0].n, q / L.FARADAY, 1e-4 * q / L.FARADAY, "je Elektron ein Silberchlorid (Faraday)");
  assert.ok(coat[0].n <= q / L.FARADAY);
  assert.ok(seen.some((e) => e.key === "plated" && e.part === "e1" && e.species === "AgCl(s)"));
  near(L.reading(l, "e1").g - 10, q / L.FARADAY * L.species("Cl-(aq)").M, 2e-6, "die Elektrode nimmt um das Chlor zu");
  assert.ok(solid(l, "AgCl(s)") < 1e-7, "kein loser Niederschlag in der Lösung");
  assert.ok(halves(l).includes("e1: Ag(s) + Cl-(aq) -> AgCl(s) + e-"), halves(l).join(" | "));
  near(totalsE(l).mass, before.mass, 1e-9, "Masse");
  near(totalsE(l).charge, before.charge, 1e-12, "Ladung");
  L.setPole(l, "n", true);
  L.step(l, 5);
  assert.ok(L.reading(l, "e1").coat[0].n < coat[0].n, "umgepolt wird der Belag weniger");
  assert.equal(L.reading(l, "e2").coat[0].id, "AgCl(s)", "und die andere Elektrode überzieht sich");
  assert.ok(halves(l).includes("e1: AgCl(s) + e- -> Ag(s) + Cl-(aq)"));
  until(l, () => L.reading(l, "e1").coat.length === 0, 300);
  near(L.reading(l, "e1").g, 10, 1e-6, "am Ende ist sie wieder blankes Silber");
  near(couple("AgCl(s) + e- <=> Ag(s) + Cl-(aq)").E0, 0.222, 0.002, "das Potential folgt aus dem Paar Ag⁺/Ag und dem Löslichkeitsprodukt");
});

test("Bürette und Kolbenprober am selben Gefäß: ihre Antippflächen überlappen nicht", () => {
  for (const type of ["beaker", "dish", "testtube"]) {
    const el = mount({ bench: [{ type, id: "b", contains: [{ reagent: "HCl 0.1M", ml: 5 }] }, { type: "burette", id: "bu", over: "b", contains: [{ reagent: "NaOH 0.1M", ml: 20 }] }, { type: "syringe", id: "kp", in: "b" }] });
    const box = (id) => {
      const m = /class="cl-hit[^"]*" x="([-\d.]+)" y="([-\d.]+)" width="([\d.]+)" height="([\d.]+)"/.exec(item(el, id).innerHTML).slice(1).map(Number);
      return { x0: m[0], y0: m[1], x1: m[0] + m[2], y1: m[1] + m[3] };
    };
    const a = box("bu"), b = box("kp");
    assert.ok(a.x1 <= b.x0 || b.x1 <= a.x0 || a.y1 <= b.y0 || b.y1 <= a.y0, `${type}: Bürette ${JSON.stringify(a)}, Kolbenprober ${JSON.stringify(b)}`);
    clean(item(el, "kp").innerHTML, "Kolbenprober");
  }
});

test("Zinkpulver in viel Salzsäure löst sich restlos auf: am Ende liegt nichts mehr im Glas, und das Protokoll meldet es", () => {
  const l = metal("HCl 1M", "Zn powder", 0.02), seen = [];
  const t = until(l, () => keys(seen).includes("gone"), 1500, seen);
  assert.ok(t < 1500, `nach ${t} s`);
  assert.equal(seen.find((e) => e.key === "gone").species, "Zn(s)");
  assert.equal(solid(l, "Zn(s)"), 0, "kein Rest, auch kein unsichtbar kleiner");
  assert.deepEqual(look(l).solids, [], "und nichts mehr zu zeichnen");
  assert.ok(L.atRest(l) || L.vessel(l, "b").T > 25.05, "danach geschieht nichts mehr (höchstens kühlt es noch ab)");
  near(gasOf(l, "H2(g)"), 0.02 / L.species("Zn(s)").M, 1e-9, "aus jedem Zink-Atom ein Wasserstoff-Molekül");
});

test("Stromdichte: ein Vorgang trägt an einer Oberfläche höchstens 2 A/cm², auch wenn Spannung und Leitfähigkeit mehr hergäben", () => {
  const l = lab([{ type: "beaker", id: "b", contains: [{ reagent: "HCl 2M", ml: 12 }] }, { type: "electrode-Zn", id: "e1", in: "b" }, { type: "electrode-Zn", id: "e2", in: "b" },
    { type: "supply", id: "n", in: "b", volts: 12 }], { room: 25 });
  L.step(l, 1);
  const area = 4 * (12 / (Math.PI * 25 / 4) - 0.5), I = L.circuit(l, "b").I;       // Platte 2 cm breit, beide Seiten, 0,11 cm eingetaucht
  assert.ok(I / area > 1.8 && I / area < 2.05, `${I / area} A/cm² bei ${I} A`);
});

test("Elektrode umsetzen: der Belag wandert mit, in einem leeren Glas geschieht mit ihm nichts", () => {
  const l = cell([{ reagent: "CuSO4 0.5M", ml: 80 }], "C", "C", 3, [{ type: "beaker", id: "leer" }]);
  L.step(l, 60);
  const coat = L.reading(l, "e2").coat[0].n;
  L.setVolts(l, "n", 0);
  assert.equal(L.attach(l, "e2", "leer"), true);
  L.step(l, 30);
  near(L.reading(l, "e2").coat[0].n, coat, 1e-15, "das Kupfer sitzt noch auf der Elektrode");
  assert.equal(L.reading(l, "e2").in, "leer");
  assert.equal(L.circuit(l, "b"), null);
});

test("Klang: der laute Knall ist lauter als der pfeifende, und der lauter als das Plopp", () => {
  const NYQUIST = 22050;
  // Schätzt die Lautstärke eines Knalls aus dem, was an Web Audio eingestellt wird: Rauschen hinter einem Filter trägt mit der
  // Wurzel seiner Bandbreite bei, ein Sinuston voll.
  const loudness = (level) => {
    const parts = [];
    let filter = null, sine = false;
    const param = (first) => ({ value: 0, setValueAtTime(v) { this.value = v; if (first) first(v); }, exponentialRampToValueAtTime() {}, setTargetAtTime(v) { this.value = v; } });
    const nodeOf = (more) => Object.assign({ connect(to) { return to; }, start() {}, stop() {} }, more);
    class Fake {
      constructor() { this.currentTime = 0; this.sampleRate = 2 * NYQUIST; this.state = "running"; this.destination = nodeOf(); }
      createBuffer(c, n) { return { getChannelData: () => new Float32Array(n) }; }
      createBufferSource() { sine = false; filter = null; return nodeOf({ buffer: null }); }
      createOscillator() { sine = true; filter = null; return nodeOf({ frequency: param() }); }
      createBiquadFilter() { filter = nodeOf({ type: "", frequency: param(), Q: param() }); return filter; }
      createGain() {
        const f = filter, tone = sine;
        return nodeOf({ gain: param((peak) => {
          const band = tone || !f ? NYQUIST : f.type === "lowpass" ? f.frequency.value : f.type === "highpass" ? NYQUIST - f.frequency.value : f.frequency.value / (f.Q.value || 1);
          parts.push(peak * Math.sqrt(Math.min(1, band / NYQUIST)));
        }) });
      }
    }
    const sound = L.fx.sound({ AudioContext: Fake });
    sound.wake();
    sound.shot("pop", level);
    return Math.sqrt(parts.reduce((sum, x) => sum + x * x, 0));
  };
  const [plopp, pfiff, knall] = [1, 2, 3].map(loudness);
  assert.ok(plopp > 0 && pfiff > 1.5 * plopp, `Plopp ${plopp}, pfeifender Knall ${pfiff}`);
  assert.ok(knall > 1.5 * pfiff, `pfeifender Knall ${pfiff}, lauter Knall ${knall}`);
});

test("Gleichungen: ein Nebenvorgang, der neben dem Hauptvorgang derselben Elektrode nicht ins Gewicht fällt, steht nicht in der Liste", () => {
  // Am Silber geht neben dem Silberchlorid eine Spur als Silber-Ion in Lösung: ein Hunderttausendstel. Gebucht wird sie, gezeigt nicht.
  const l = cell([{ reagent: "NaCl 1M", ml: 80 }], "Ag", "Ag", 3);
  L.step(l, 120);
  const list = L.reactions(l, "b").filter((r) => r.at);
  assert.deepEqual(list.map((r) => r.at + ": " + r.eq), ["e1: Ag(s) + Cl-(aq) -> AgCl(s) + e-", "e2: 2 H2O(l) + 2 e- -> H2(g) + 2 OH-(aq)"]);
  assert.ok(Object.keys(L.vessel(l, "b").half).some((key) => /^ox e1 .*Ag\+\(aq\)/.test(key) && L.vessel(l, "b").half[key] > 1e-9), "die Spur ist trotzdem gebucht");
  // ein zweiter Vorgang, der wirklich mitläuft, bleibt stehen: Kupfer und Wasserstoff am Minuspol
  const two = cell([{ reagent: "CuSO4 0.01M", ml: 80 }, { reagent: "H2SO4 1M", ml: 10 }], "C", "C", 6);
  L.step(two, 120);
  const minus = L.reactions(two, "b").filter((r) => r.at === "e2").map((r) => r.eq);
  assert.ok(minus.some((eq) => /Cu\(s\)/.test(eq)) && minus.some((eq) => /H2\(g\)/.test(eq)), minus.join(" | "));
});

test("Klang: ein Begrenzer hinter dem Hauptregler fängt die Spitzen des Knalls ab", () => {
  // Rauschen hat zufällige Spitzen: im Browser gemessen erreichte der laute Knall ohne Begrenzer bis zu 0,96 von 1 und übersteuert dann mit Glasbruch.
  const wired = (limiter) => {
    const links = [];
    const param = () => ({ value: 0, setValueAtTime() {}, exponentialRampToValueAtTime() {}, setTargetAtTime() {} });
    const nodeOf = (name, more) => Object.assign({ name, connect(to) { links.push(name + ">" + to.name); return to; }, start() {}, stop() {} }, more);
    const ctx = {
      currentTime: 0, sampleRate: 8000, state: "running", destination: nodeOf("out"),
      createBuffer: (c, n) => ({ getChannelData: () => new Float32Array(n) }),
      createBufferSource: () => nodeOf("noise", { buffer: null }),
      createBiquadFilter: () => nodeOf("filter", { type: "", frequency: param(), Q: param() }),
      createGain: () => nodeOf(links.length || ctx.master ? "gain" : (ctx.master = "master"), { gain: param() })
    };
    if (limiter) ctx.createDynamicsCompressor = () => (ctx.limit = nodeOf("limit", { threshold: param(), knee: param(), ratio: param(), attack: param(), release: param() }));
    const sound = L.fx.sound({ AudioContext: function () { return ctx; } });
    sound.wake();
    sound.shot("pop", 3);
    return { links, limit: ctx.limit };
  };
  const a = wired(true);
  assert.ok(a.links.includes("master>limit") && a.links.includes("limit>out") && !a.links.includes("master>out"), a.links.join(" "));
  assert.ok(a.limit.threshold.value <= -3 && a.limit.ratio.value >= 12 && a.limit.attack.value <= 0.005, "begrenzt hart und schnell");
  assert.ok(a.links.includes("gain>master"), "der Knall läuft über den Hauptregler");
  const b = wired(false);
  assert.ok(b.links.includes("master>out"), "ohne Begrenzer im Browser klingt es wie bisher: " + b.links.join(" "));
});

test("Laden: die fünf Dateien dürfen in jeder Reihenfolge ankommen", () => {
  // Der Browser führt sie nicht verlässlich in der Reihenfolge des Kurskopfs aus: unter Last kam die große Datei des Rechenkerns zuletzt.
  const files = ["chemlab-engine.js", "chemlab-data.js", "chemlab-parts.js", "chemlab-fx.js", "chemlab-ui.js"];
  const code = files.map((file) => fs.readFileSync(new URL(file, here), "utf8"));
  for (const order of [[1, 0, 2, 3, 4], [4, 3, 2, 1, 0], [2, 1, 0, 4, 3], [3, 2, 4, 1, 0], [1, 2, 3, 4, 0], [0, 1, 2, 3, 4]]) {
    const box = vm.createContext({}), label = order.map((i) => files[i]).join(" → "), ready = [];
    for (const i of order) {
      vm.runInContext(code[i], box, { filename: files[i] });
      ready.push(!!(box.LiaChemLab && box.LiaChemLab.loaded && box.LiaChemLab.loaded()));
    }
    const C = box.LiaChemLab;
    assert.deepEqual(ready, [false, false, false, false, true], label + ": vollständig ist der Baustein erst mit der letzten Datei");
    assert.deepEqual(Array.from(C.missing()), [], label);
    assert.ok(C.db.reagents.HCl && C.parts.beaker.draw && C.parts["electrode-Cu"].draw && C.fx.flame && C.mount, label);
    const l = C.createLab(C.normalize({ bench: [{ type: "beaker", id: "b", contains: [{ reagent: "HCl 1M", ml: 20 }] }] }));
    assert.ok(Math.abs(C.view(l, C.vessel(l, "b")).pH) < 0.01, label + ": gerechnet wird wie sonst");
    assert.equal(C.text("part.beaker", "de"), "Becherglas", label);
  }
  const part = vm.createContext({});
  vm.runInContext(code[4], part);
  vm.runInContext(code[1], part);
  assert.deepEqual(Array.from(part.LiaChemLab.missing()), ["chemlab-engine.js", "chemlab-parts.js", "chemlab-fx.js"], "was fehlt, lässt sich benennen");
  const readme = fs.readFileSync(new URL("README.md", here), "utf8");
  assert.match(readme, /C\.loaded\(\)\) return C\.mount\(/, "der Befehl im Kurskopf wartet, bis alles geladen ist");
});

// ---------------------------------------------------------------- Meilenstein 5: Kinetik und Gleichgewicht

const peroxide = "2 H2O2(aq) -> 2 H2O(l) + O2(g)";
const oxygen = (l) => gasOf(l, "O2(g)");

test("Katalysator: Iodid zersetzt Wasserstoffperoxid, erste Ordnung im Peroxid und im Iodid, und bleibt selbst erhalten", () => {
  const start = (iodide) => {
    const l = tubeOf([{ reagent: "H2O2 1M", ml: 5 }, { reagent: "KI " + iodide + "M", ml: 1 }]);
    L.step(l, 1);
    return l;
  };
  const one = start(1), half = start(0.5);
  // k = 0,0115 L/(mol s): Umsatz der Gleichung je Sekunde = k · c(H2O2) · c(I-) · V
  near(oxygen(one), 0.0115 * (5 / 6) * (1 / 6) * 0.006, 0.05 * 9.6e-6, "Sauerstoff in der ersten Sekunde");
  near(oxygen(half) / oxygen(one), 0.5, 0.02, "halb so viel Iodid, halb so schnell");
  near(amount(one, "I-(aq)"), 0.001, 1e-12, "das Iodid wird nicht verbraucht");
  const warm = tubeOf([{ reagent: "H2O2 1M", ml: 5 }, { reagent: "KI 1M", ml: 1 }], { room: 35 });
  L.step(warm, 1);
  near(oxygen(warm) / oxygen(one), Math.exp(56000 / 8.314 * (1 / 298.15 - 1 / 308.15)), 0.1, "10 K wärmer: gut doppelt so schnell (Ea = 56 kJ/mol)");
});

test("Katalysator: zwei Wege derselben Reaktion stehen einzeln in der Liste, jeder mit seinem Katalysator", () => {
  const l = tubeOf([{ reagent: "H2O2 1M", ml: 5 }, { reagent: "KI 1M", ml: 1 }, { reagent: "MnO2", g: 0.02 }]);
  L.step(l, 5);
  const list = L.reactions(l, "b").filter((r) => r.eq === peroxide);
  assert.deepEqual(list.map((r) => r.catalysts.join()).sort(), ["I-(aq)", "MnO2(s)"]);
  assert.ok(list.every((r) => r.extent > 0 && r.rate > 0), "beide laufen");
  assert.notEqual(list[0].key, list[1].key);
  near(list[0].extent + list[1].extent, oxygen(l), 1e-12, "zusammen ergeben sie den Sauerstoff");
  // eine Reaktion ohne Katalysator nennt keinen
  const mg = tubeOf([{ reagent: "HCl 1M", ml: 8 }, { reagent: "Mg ribbon", g: 0.02 }]);
  L.step(mg, 2);
  assert.deepEqual(L.reactions(mg, "b").find((r) => /Mg\(s\)/.test(r.eq)).catalysts, []);
});

test("Katalysator: ein Paket trägt für eine vorhandene Reaktion einen weiteren Weg nach; derselbe Weg zweimal ist ein Fehler", () => {
  const before = L.db;
  try {
    L.register({ reactions: [{ eq: peroxide, rate: { k: 0.002, Ea: 40, order: { "H2O2(aq)": 1, "Fe^3+(aq)": 1 } }, src: "Probe" }] });
    const l = tubeOf([{ reagent: "H2O2 1M", ml: 5 }, { reagent: "FeCl3 0.1M", ml: 1 }]);
    L.step(l, 5);
    assert.ok(oxygen(l) > 1e-7, "der neue Weg läuft");
    assert.deepEqual(L.reactions(l, "b").find((r) => r.eq === peroxide).catalysts, ["Fe^3+(aq)"]);
    assert.throws(() => L.register({ reactions: [{ eq: peroxide, rate: { k: 0.5, order: { "H2O2(aq)": 1, "Fe^3+(aq)": 1 } }, src: "Probe" }] }), (e) => e.code === "data");
  } finally { L.db = before; }
});

// Thiosulfat mit Säure: 50 mL Lösung im Becherglas, dazu 5 mL Salzsäure. Zurück: das Labor und die Sekunden bis „undurchsichtig“
const thio = (conc, room, acid) => {
  const l = beaker([{ reagent: "Na2S2O3 " + conc + "M", ml: 50 }], { room: room == null ? 25 : room }), seen = [];
  if (acid !== false) L.add(l, "b", acid || "HCl 2M", { ml: 5 });
  const t = until(l, () => seen.some((e) => e.key === "opaque"), 900, seen);
  return { l, seen, t };
};

test("Thiosulfat und Säure: Schwefel trübt die Lösung, nach etwa 20 s sieht man nicht mehr hindurch", () => {
  const { l, seen, t } = thio(0.16);
  assert.ok(t >= 16 && t <= 26, `undurchsichtig nach ${t} s`);
  const cloudy = seen.find((e) => e.key === "solid");
  assert.ok(cloudy && cloudy.species === "S(s)" && cloudy.colloid === true, "erst die Trübung: fein verteilter Schwefel");
  assert.ok(seen.indexOf(cloudy) < seen.findIndex((e) => e.key === "opaque"));
  assert.ok(look(l).cloud.alpha >= 0.9, `Trübung ${look(l).cloud.alpha}`);
  near(amount(l, "S(s)"), amount(l, "SO2(aq)") + amount(l, "HSO3-(aq)") + amount(l, "SO3^2-(aq)"), 1e-12, "je Schwefel-Atom ein Schwefeldioxid");
  assert.ok(equations(l).includes("HS2O3-(aq) + H+(aq) -> S(s) + SO2(aq) + H2O(l)"), equations(l).join(" | "));
  const before = totals(l);
  const later = collect(l, 600);
  assert.ok(later.some((e) => e.key === "smell" && e.species === "SO2(g)"), "mit der Zeit riecht es nach Schwefeldioxid");
  near(totals(l).mass, before.mass, 1e-9, "Masse");
  near(totals(l).charge, before.charge, 1e-12, "Ladung");
});

test("Thiosulfat und Säure: halbe Konzentration braucht etwa doppelt so lange, 10 K wärmer etwa halb so lange", () => {
  const full = thio(0.16).t, half = thio(0.08).t, fifth = thio(0.032).t, warm = thio(0.16, 35).t, cold = thio(0.16, 15).t;
  assert.ok(half / full > 1.6 && half / full < 2.3, `0,16 mol/L: ${full} s, 0,08 mol/L: ${half} s`);
  assert.ok(fifth / full > 3.8 && fifth / full < 6, `0,032 mol/L: ${fifth} s`);
  assert.ok(full / warm > 1.7 && full / warm < 2.3, `25 °C: ${full} s, 35 °C: ${warm} s`);
  assert.ok(cold / full > 1.7 && cold / full < 2.4, `15 °C: ${cold} s`);
  const weak = thio(0.16, 25, "HCl 1M").t;
  assert.ok(weak > full && weak < 2 * full, `mit halb so starker Säure etwas langsamer: ${weak} s`);
});

test("Thiosulfat: ohne Säure geschieht nichts; der Schwefel bleibt in der Schwebe, und das Labor kommt trotzdem zur Ruhe", () => {
  const plain = thio(0.16, 25, false);
  assert.equal(plain.t, 900, "keine Trübung");
  // in der neutralen Lösung liegt eine Spur Hydrogenthiosulfat vor: sie zerfällt unmerklich langsam, wie eine Vorratslösung über Wochen
  assert.ok(L.atRest(plain.l) && amount(plain.l, "S(s)") < 1e-7 && plain.seen.length === 0, `${amount(plain.l, "S(s)")} mol Schwefel, ${keys(plain.seen)}`);
  const l = tubeOf([{ reagent: "Na2S2O3 0.05M", ml: 5 }, { reagent: "HCl 1M", ml: 5 }]);
  assert.equal(L.atRest(l), false, "die Reaktion steht bereit");
  const t = until(l, () => L.atRest(l), 4000);
  assert.ok(t < 4000, "kommt zur Ruhe");
  assert.ok(amount(l, "S2O3^2-(aq)") + amount(l, "HS2O3-(aq)") < 1e-6, "das Thiosulfat ist verbraucht");
  const lump = L.vessel(l, "b").lumps.find((x) => x.id === "S(s)");
  assert.equal(lump.settled, 0, "kolloidaler Schwefel setzt sich nicht ab");
  assert.ok(look(l).cloud.alpha > 0.9 && look(l).sediment.ml === 0);
});

// Ioduhr: Iodid, Thiosulfat und Stärke im Becherglas, dazu Peroxodisulfat. Zurück: das Labor, die Meldungen und die Sekunden bis zum Farbumschlag
const clock = (persulfate, room, thioMl) => {
  const l = beaker([{ reagent: "KI 0.2M", ml: 20 }, { reagent: "Na2S2O3 0.005M", ml: thioMl == null ? 10 : thioMl }, { reagent: "starch", drops: 5 }], { room: room == null ? 25 : room }), seen = [];
  L.add(l, "b", "K2S2O8 " + (persulfate || 0.1) + "M", { ml: 20 });
  const t = until(l, () => seen.some((e) => e.key === "color"), 900, seen);
  return { l, seen, t };
};

test("Ioduhr: die Lösung bleibt farblos, bis das Thiosulfat verbraucht ist, und wird dann schlagartig blau", () => {
  const { l, seen, t } = clock();
  // Iod entsteht mit k · c(S2O8) · c(I-) = 0,004 · 0,04 · 0,08 mol/(L s); 1 mmol/L Thiosulfat fängt die Hälfte davon ab: 39 s
  assert.ok(t >= 37 && t <= 45, `Umschlag nach ${t} s`);
  const color = seen.find((e) => e.key === "color");
  assert.ok(["blue", "black"].includes(color.name), color.name);
  assert.ok(amount(l, "S2O3^2-(aq)") < 1e-12, "kein Thiosulfat mehr");
  near(amount(l, "S4O6^2-(aq)"), 2.5e-5, 1e-9, "aus 0,05 mmol Thiosulfat die Hälfte an Tetrathionat");
  assert.ok(amount(l, "C108H180O90I3-(aq)") > 0, "Iod sitzt in der Stärke");
  const early = clock();
  const fresh = beaker([{ reagent: "KI 0.2M", ml: 20 }, { reagent: "Na2S2O3 0.005M", ml: 10 }, { reagent: "starch", drops: 5 }], { room: 25 });
  const before = totals(fresh);
  L.add(fresh, "b", "K2S2O8 0.1M", { ml: 20 });
  L.step(fresh, 20);
  assert.equal(look(fresh).color.name, "colorless", "auf halbem Weg noch farblos");
  assert.ok(amount(fresh, "I3-(aq)") + amount(fresh, "C108H180O90I3-(aq)") < 1e-10, "freies Iod gibt es noch nicht");
  L.step(fresh, 60);
  const after = totals(fresh), added = 0.02 * (2 * 39.098 + 2 * 32.06 + 8 * 15.999) * 0.1 + 0.02 * 55.508 * 18.015;
  near(after.charge, before.charge, 1e-12, "Ladung");
  assert.ok(Math.abs(after.mass - before.mass - added) < 0.01 * added, "Masse: nur das Zugegebene kam dazu");
  assert.equal(early.t, t, "derselbe Versuch, dieselbe Zeit");
});

test("Ioduhr: halb so viel Peroxodisulfat, doppelte Zeit; 10 K wärmer, halbe Zeit; doppelt so viel Thiosulfat, doppelte Zeit", () => {
  const base = clock().t, dilute = clock(0.05).t, warm = clock(0.1, 35).t, more = clock(0.1, 25, 20).t;
  assert.ok(dilute / base > 1.8 && dilute / base < 2.2, `0,1 mol/L: ${base} s, 0,05 mol/L: ${dilute} s`);
  assert.ok(base / warm > 1.75 && base / warm < 2.2, `35 °C: ${warm} s (Ea = 52 kJ/mol)`);
  // 10 mL mehr Lösung verdünnen auch: 60 statt 50 mL
  assert.ok(more / base > 2.2 && more / base < 3.1, `20 mL Thiosulfat: ${more} s`);
});

test("Iod und Thiosulfat: die Reaktion läuft sofort; mit Stärke zeigt der Umschlag nach farblos das Ende der Titration", () => {
  const l = lab([{ type: "beaker", id: "b", contains: [{ reagent: "H2O", ml: 20 }, { reagent: "Lugol", drops: 40 }, { reagent: "starch", drops: 20 }] },
    { type: "burette", id: "bu", over: "b", contains: [{ reagent: "Na2S2O3 0.002M", ml: 40 }] }], { room: 25 });
  L.step(l, 20);
  assert.ok(["blue", "black"].includes(look(l).color.name), "Iod-Stärke: " + look(l).color.name);
  near(amount(l, "I3-(aq)") + amount(l, "C108H180O90I3-(aq)"), 2e-5, 1e-12, "40 Tropfen Iodlösung: 0,02 mmol Iod");
  assert.equal(amount(l, "I2(s)"), 0, "das Iod bleibt als Triiodid gelöst");
  L.setTap(l, "bu", 0.5);
  const seen = [];
  const t = until(l, () => seen.some((e) => e.key === "color" && e.name === "colorless"), 200, seen);
  L.setTap(l, "bu", 0);
  // 0,02 mmol Iod brauchen 0,04 mmol Thiosulfat: 20 mL
  near(look(l, "bu").given, 20, 1.2, "Verbrauch bis zum Umschlag in mL");
  assert.ok(t < 200);
  assert.ok(equations(l).includes("I3-(aq) + 2 S2O3^2-(aq) -> 3 I-(aq) + S4O6^2-(aq)"), equations(l).join(" | "));
});

test("Iod-Stärke: beim Erwärmen verschwindet die blaue Farbe, beim Abkühlen kommt sie wieder", () => {
  const blue = (room) => {
    const l = tubeOf([{ reagent: "H2O", ml: 8 }, { reagent: "Lugol", drops: 1 }, { reagent: "starch", drops: 20 }], { room });
    L.step(l, 60);
    const v = L.vessel(l, "b");
    return { share: amount(l, "C108H180O90I3-(aq)") / (amount(l, "C108H180O90I3-(aq)") + amount(l, "I3-(aq)")), name: look(l).color.name, rgb: look(l).color.rgb, v };
  };
  const cold = blue(20), hot = blue(85);
  assert.ok(cold.share > 0.9, `kalt sitzen ${cold.share} des Iods in der Stärke`);
  assert.ok(hot.share < 0.25, `heiß nur ${hot.share}`);
  assert.ok(["blue", "black"].includes(cold.name), cold.name);
  assert.ok(hot.rgb[0] + hot.rgb[1] + hot.rgb[2] > cold.rgb[0] + cold.rgb[1] + cold.rgb[2] + 150, `heiß viel heller: ${hot.rgb} gegen ${cold.rgb}`);
});

// Marmor in Säure: Calcium, das nach einer Sekunde gelöst ist, als Maß für die Geschwindigkeit am Anfang
const lime = (acid, reagent, g, room) => {
  const l = beaker([{ reagent: acid, ml: 50 }], { room: room == null ? 25 : room });
  L.add(l, "b", reagent || "marble", { g: g || 1 });
  return l;
};
const calcium = (l) => dissolved(l, "Ca");
const speedOf = (acid, reagent, g, room) => { const l = lime(acid, reagent, g, room); L.step(l, 0.2); return calcium(l) / 0.2; };

test("Marmor in Salzsäure: die Geschwindigkeit folgt Oberfläche und Säurekonzentration, die Temperatur wirkt nur schwach", () => {
  const chips = speedOf("HCl 1M");
  // k = 5,1·10⁻⁵ mol/(s cm² mol/L); Körner mit 6 cm²/g
  near(chips, 5.11e-5 * 6 * 1, 0.03 * 3.07e-4, "1 g Körner in Salzsäure 1 mol/L, mol je Sekunde am Anfang");
  near(speedOf("HCl 1M", "marble powder") / chips, 10, 0.5, "Pulver hat die zehnfache Oberfläche");
  near(speedOf("HCl 1M", "marble", 2) / chips, 2, 0.1, "doppelt so viele Körner");
  near(speedOf("HCl 2M") / chips, 2, 0.12, "doppelte Konzentration");
  near(speedOf("HCl 0.5M") / chips, 0.5, 0.03, "halbe Konzentration");
  near(speedOf("HCl 1M", "marble", 1, 35) / chips, Math.exp(8500 / 8.314 * (1 / 298.15 - 1 / 308.15)), 0.02, "10 K wärmer: nur 12 % schneller");
  const weak = speedOf("CH3COOH 1M");
  assert.ok(weak > 0 && weak < chips / 50, `in Essigsäure viel langsamer: ${weak}`);
});

test("Marmor: Pulver ist in Sekunden gelöst, Körner brauchen Minuten; am Ende ist alles Kohlenstoffdioxid entwichen oder gelöst", () => {
  const time = (reagent) => {
    const l = lime("HCl 1M", reagent, 0.5), seen = [], before = totals(l);
    const t = until(l, () => seen.some((e) => e.key === "gone"), 900, seen);
    L.step(l, 60);
    near(calcium(l), 0.5 / 100.086, 1e-9, "alles Calcium gelöst");
    near(totals(l).mass, before.mass, 1e-9, "Masse");
    near(totals(l).charge, before.charge, 1e-12, "Ladung");
    assert.equal(l.failed || 0, 0);
    return t;
  };
  const powder = time("marble powder"), chips = time("marble");
  assert.ok(powder >= 3 && powder <= 25, `Pulver: ${powder} s`);
  assert.ok(chips >= 60 && chips <= 400, `Körner: ${chips} s`);
  assert.ok(chips > 6 * powder);
});

test("Marmor im Überschuss: die Säure wird verbraucht, dann steht die Reaktion; nichts fällt wieder aus", () => {
  const l = lime("HCl 0.1M", "marble powder", 2), seen = [];
  // Die Säure ist nach etwa zwei Minuten verbraucht. Was danach noch unmerklich langsam weiterginge, lässt der Baustein ruhen:
  // die Uhr läuft nur noch, bis das Glas wieder Raumtemperatur hat.
  seen.push(...collect(l, 300));
  const then = calcium(l);
  const t = until(l, () => L.atRest(l), 6000, seen);
  assert.ok(t < 6000, "kommt zur Ruhe");
  near(calcium(l), then, 1e-12, "nach fünf Minuten löst sich nichts mehr");
  near(calcium(l), 0.0025, 1e-4, "5 mmol Säure lösen 2,5 mmol Marmor (und etwas mehr mit dem Kohlenstoffdioxid)");
  assert.ok(look(l).pH > 4.5 && look(l).pH < 7, `pH ${look(l).pH}`);
  assert.ok(!keys(seen).includes("solid"), "kein Niederschlag");
  assert.ok(look(l).cloud.alpha < 0.02);
  assert.equal(L.vessel(l, "b").lumps.filter((x) => x.made).length, 0);
});

test("Marmor in Wasser: nichts zu sehen; liegt er von Anfang an in Säure, beginnt die Reaktion erst mit der Uhr", () => {
  const water = lime("H2O", "marble", 1);
  assert.deepEqual(keys(collect(water, 120)), []);
  assert.ok(L.atRest(water));
  near(amount(water, "CaCO3(s)"), 1 / 100.086, 1e-6, "praktisch nichts gelöst");
  const l = beaker([{ reagent: "HCl 1M", ml: 50 }, { reagent: "marble", g: 1 }], { room: 25 });
  near(amount(l, "CaCO3(s)"), 1 / 100.086, 1e-12, "beim Aufbau ist noch nichts gelöst");
  assert.equal(L.atRest(l), false, "die Reaktion steht bereit");
  L.step(l, 1);
  near(calcium(l), 3.06e-4, 3e-5, "nach einer Sekunde");
  const still = beaker([{ reagent: "H2O", ml: 50 }, { reagent: "marble", g: 1 }], { room: 25 });
  assert.ok(L.atRest(still), "in Wasser steht nichts bereit");
});

test("Marmor löst sich langsam, ein Niederschlag daneben fällt trotzdem sofort aus", () => {
  const l = lime("HCl 0.1M", "marble", 1), seen = [];
  L.step(l, 5);
  L.add(l, "b", "AgNO3 0.1M", { ml: 10 });
  const t = until(l, () => amount(l, "AgCl(s)") > 0.9e-3, 60, seen);
  assert.ok(t <= 8, `Silberchlorid nach ${t} s`);
  assert.ok(amount(l, "CaCO3(s)") > 0.5 / 100.086, "der Marmor löst sich derweil weiter langsam");
});

// ---------------------------------------------------------------- Gleichgewichte verschieben (Le Chatelier)

const share = (l, id, among) => amount(l, id) / among.reduce((sum, x) => sum + amount(l, x[0]) * x[1], 0);
const chromium = [["CrO4^2-(aq)", 1], ["HCrO4-(aq)", 1], ["Cr2O7^2-(aq)", 2]];

test("Chromat und Dichromat: Säure färbt die gelbe Lösung orange, Lauge wieder gelb", () => {
  const l = beaker([{ reagent: "K2CrO4 0.05M", ml: 20 }], { room: 25 }), seen = [];
  assert.equal(look(l).color.name, "yellow");
  assert.ok(share(l, "CrO4^2-(aq)", chromium) > 0.99, "in der neutralen Lösung liegt Chromat vor");
  L.add(l, "b", "HCl 1M", { ml: 5 });
  seen.push(...collect(l, 10));
  assert.equal(look(l).color.name, "orange");
  // bei 0,04 mol/L Chrom liegt gut die Hälfte als Dichromat vor, der Rest als Hydrogenchromat
  assert.ok(2 * share(l, "Cr2O7^2-(aq)", chromium) > 0.5, `Anteil des Chroms im Dichromat ${2 * share(l, "Cr2O7^2-(aq)", chromium)}`);
  assert.ok(share(l, "CrO4^2-(aq)", chromium) < 0.01, "kaum noch Chromat");
  assert.ok(seen.some((e) => e.key === "color" && e.name === "orange"));
  assert.ok(equations(l).includes("2 CrO4^2-(aq) + 2 H+(aq) -> Cr2O7^2-(aq) + H2O(l)") || equations(l).includes("2 CrO4^2-(aq) + 2 H+(aq) <=> Cr2O7^2-(aq) + H2O(l)"), equations(l).join(" | "));
  L.add(l, "b", "NaOH 2M", { ml: 5 });
  seen.push(...collect(l, 10));
  assert.equal(look(l).color.name, "yellow");
  assert.ok(share(l, "CrO4^2-(aq)", chromium) > 0.99);
  // dieselbe Menge Chrom als Dichromat eingewogen: dieselbe Lösung
  const other = beaker([{ reagent: "K2Cr2O7 0.025M", ml: 20 }], { room: 25 });
  assert.equal(look(other).color.name, "orange");
  assert.ok(look(other).pH < 5, `Dichromat-Lösung reagiert sauer: pH ${look(other).pH}`);
});

test("Chromat: Barium fällt aus der Dichromat-Lösung gelbes Bariumchromat, die Lösung wird saurer; Silber fällt rotbraunes Silberchromat", () => {
  const l = beaker([{ reagent: "K2Cr2O7 0.025M", ml: 20 }], { room: 25 }), pH = look(l).pH;
  L.add(l, "b", "BaCl2 0.1M", { ml: 20 });
  const seen = collect(l, 30);
  assert.ok(seen.some((e) => e.key === "solid" && e.species === "BaCrO4(s)" && e.color === "yellow"), keys(seen).join());
  assert.ok(amount(l, "BaCrO4(s)") > 2e-4, `${amount(l, "BaCrO4(s)")} mol Bariumchromat`);
  assert.ok(look(l).pH < pH - 0.5, `das Gleichgewicht liefert Chromat nach und setzt Säure frei: pH ${pH} → ${look(l).pH}`);
  const silver = beaker([{ reagent: "K2CrO4 0.05M", ml: 10 }], { room: 25 });
  L.add(silver, "b", "AgNO3 0.1M", { ml: 10 });
  const red = collect(silver, 30).find((e) => e.key === "solid");
  assert.ok(red && red.species === "Ag2CrO4(s)" && ["red", "brown"].includes(red.color), JSON.stringify(red));
  near(amount(silver, "Ag2CrO4(s)"), 5e-4, 2e-5, "Silberchromat");
});

const cobalt = (room, more) => {
  const l = tubeOf([{ reagent: "CoCl2 0.5M", ml: 4 }, { reagent: "HCl 12M", ml: 6 }].concat(more || []), { room });
  L.step(l, 5);
  return l;
};
const blueShare = (l) => amount(l, "CoCl4^2-(aq)") / (amount(l, "CoCl4^2-(aq)") + amount(l, "Co^2+(aq)"));

test("Cobaltchlorid: kalt rosa, heiß blau; Wasser und Silbernitrat verschieben nach rosa", () => {
  const cold = cobalt(5), room = cobalt(22), hot = cobalt(85);
  assert.ok(["pink", "red"].includes(look(cold).color.name), "kalt: " + look(cold).color.name + " " + look(cold).color.rgb);
  assert.ok(["violet", "pink"].includes(look(room).color.name), "bei Raumtemperatur: " + look(room).color.name + " " + look(room).color.rgb);
  assert.ok(look(room).color.rgb[0] < look(cold).color.rgb[0] - 20, "bei Raumtemperatur schon etwas blauer als in der Kälte");
  assert.equal(look(hot).color.name, "blue", "heiß: " + look(hot).color.rgb);
  assert.ok(blueShare(cold) < blueShare(room) && blueShare(room) < blueShare(hot));
  near(blueShare(hot) / blueShare(room), Math.exp(54000 / 8.314 * (1 / 295.15 - 1 / 358.15)), 8, "Reaktionsenthalpie +54 kJ/mol");
  const diluted = cobalt(85, [{ reagent: "H2O", ml: 10 }]);
  assert.ok(blueShare(diluted) < blueShare(hot) / 8, "verdünnt: weniger Chlorid je Liter");
  assert.ok(look(diluted).color.rgb[0] > look(hot).color.rgb[0] + 60, "und weniger blau: " + look(diluted).color.rgb);
  assert.ok(["pink", "red"].includes(look(cobalt(22, [{ reagent: "H2O", ml: 10 }])).color.name), "bei Raumtemperatur verdünnt: rosa");
  const less = tubeOf([{ reagent: "CoCl2 1M", ml: 2 }, { reagent: "NaCl 4M", ml: 8 }], { room: 85 });
  L.step(less, 5);
  const share = blueShare(less);
  L.add(less, "b", "AgNO3 2M", { ml: 8 });
  L.step(less, 30);
  assert.ok(amount(less, "AgCl(s)") > 0.01 && blueShare(less) < share / 20, "Silber nimmt das Chlorid weg");
});

test("Kaliumpermanganat: verdünnt rosa bis violett, die Farbe folgt der Konzentration", () => {
  const thin = beaker([{ reagent: "KMnO4 0.00002M", ml: 50 }]), mid = beaker([{ reagent: "KMnO4 0.0002M", ml: 50 }]), strong = beaker([{ reagent: "KMnO4 0.02M", ml: 50 }]);
  assert.ok(["pink", "violet"].includes(look(thin).color.name) && look(thin).color.pale, look(thin).color.name);
  assert.ok(["pink", "violet"].includes(look(mid).color.name), look(mid).color.name + " " + look(mid).color.rgb);
  const sum = (c) => c.rgb[0] + c.rgb[1] + c.rgb[2];
  assert.ok(sum(look(thin).color) > sum(look(mid).color) && sum(look(mid).color) > sum(look(strong).color), "je konzentrierter, desto dunkler");
});

// Kristallviolett mit Natronlauge: 10 mL Farbstofflösung und 10 mL Lauge im Becherglas. Zurück: Halbwertszeit in s
const fading = (naoh, room) => {
  const l = beaker([{ reagent: "crystal violet", ml: 10 }], { room: room == null ? 25 : room }), start = amount(l, "C25H30N3+(aq)");
  L.add(l, "b", "NaOH " + naoh + "M", { ml: 10 });
  const t = until(l, () => amount(l, "C25H30N3+(aq)") <= start / 2, 3000);
  return { l, t, start };
};

test("Kristallviolett und Natronlauge: die Farbe verblasst nach erster Ordnung, die Halbwertszeit folgt der Laugenkonzentration und der Temperatur", () => {
  const { l, t, start } = fading(0.1);
  assert.ok(["violet", "blue"].includes(look(beaker([{ reagent: "crystal violet", ml: 10 }])).color.name));
  // k = 0,1 L/(mol s), c(OH-) = 0,05 mol/L: Halbwertszeit ln 2 / (k · c) = 139 s (dazu die Sekunden des Eingießens)
  assert.ok(t >= 136 && t <= 146, `Halbwertszeit ${t} s`);
  L.step(l, 139);
  near(amount(l, "C25H30N3+(aq)") / start, 0.25, 0.012, "nach zwei Halbwertszeiten ein Viertel");
  L.step(l, 139);
  near(amount(l, "C25H30N3+(aq)") / start, 0.125, 0.008, "nach drei ein Achtel");
  near(amount(l, "C25H31N3O(aq)") + amount(l, "C25H30N3+(aq)"), start, 1e-15, "aus dem Farbstoff wird das farblose Carbinol");
  const fast = fading(0.2).t, warm = fading(0.1, 35).t;
  assert.ok(t / fast > 1.85 && t / fast < 2.1, `doppelt so viel Lauge: ${fast} s`);
  assert.ok(t / warm > 1.9 && t / warm < 2.4, `10 K wärmer: ${warm} s`);
  L.step(l, 3000);
  assert.equal(look(l).color.name, "colorless");
});

// ---------------------------------------------------------------- Wasserbad und Fotometer

const bathed = (vessel, temp, room, more) => lab([Object.assign({ id: "b" }, vessel), Object.assign({ type: "bath", id: "wb", under: "b" }, temp == null ? {} : { temp }),
  { type: "thermometer", id: "th", in: "b" }].concat(more || []), { room: room == null ? 20 : room });
const water5 = { type: "testtube", contains: [{ reagent: "H2O", ml: 5 }] };

test("Wasserbad: das Reagenzglas nimmt die eingestellte Temperatur an und hält sie; ein Becherglas braucht länger", () => {
  const l = bathed(water5, 50);
  assert.equal(L.atRest(l), false, "das Glas ist noch kalt");
  const t = until(l, () => look(l).T > 49, 900);
  assert.ok(t >= 20 && t <= 120, `Reagenzglas: ${t} s bis 49 °C`);
  L.step(l, 300);
  near(look(l).T, 50, 0.02, "Temperatur im Bad");
  assert.ok(L.atRest(l), "bei der Temperatur des Bades ruht das Labor");
  near(L.reading(l, "wb").value, 50, 1e-9, "das Bad zeigt, worauf es eingestellt ist");
  assert.equal(L.reading(l, "wb").temp, 50);
  const big = bathed({ type: "beaker", contains: [{ reagent: "H2O", ml: 80 }] }, 50);
  const slow = until(big, () => look(big).T > 49, 3000);
  assert.ok(slow > 2 * t && slow < 1500, `Becherglas: ${slow} s`);
  assert.equal(L.setTemp(l, "wb", 5), true);
  assert.equal(L.atRest(l), false);
  L.step(l, 400);
  near(look(l).T, 5, 0.05, "im kalten Bad");
  L.setTemp(l, "wb", 150);
  assert.equal(L.reading(l, "wb").temp, 95, "heißer als 95 °C wird das Bad nicht");
  L.setTemp(l, "wb", -20);
  assert.equal(L.reading(l, "wb").temp, 0, "und nicht kälter als Eiswasser");
  L.remove(l, "wb");
  L.step(l, 6000);
  near(look(l).T, 20, 0.1, "ohne Bad wieder Raumtemperatur");
  assert.equal(L.setTemp(l, "th", 30), false, "nur ein Wasserbad lässt sich einstellen");
});

test("Wasserbad: unter einem Gefäß steht ein Brenner oder ein Wasserbad, nicht beides; ohne Angabe hat das Bad Raumtemperatur", () => {
  const both = { bench: [{ type: "testtube", id: "b" }, { type: "bath", id: "wb", under: "b" }, { type: "burner", id: "br", under: "b" }] };
  assert.throws(() => L.normalize(both), (e) => e.code === "place");
  assert.throws(() => L.normalize({ bench: [{ type: "testtube", id: "b" }, { type: "bath", under: "b", temp: 120 }] }), (e) => e.code === "amount");
  assert.throws(() => L.normalize({ bench: [{ type: "burette", id: "bu" }, { type: "bath", under: "bu" }] }), (e) => e.code === "place");
  const l = bathed(water5, null, 23);
  assert.equal(L.reading(l, "wb").temp, 23);
  assert.ok(L.atRest(l));
  const id = L.place(l, { type: "burner", under: "b" });
  assert.equal(L.tool(l, id).in, null, "der Brenner bleibt für sich stehen");
  assert.equal(L.attach(l, id, "b"), false, "und lässt sich auch nicht darunterschieben");
  assert.equal(L.setFlame(l, "wb", 2), false, "ein Wasserbad hat keine Flamme");
  const other = L.place(l, { type: "bath", temp: 60 });
  assert.equal(L.tool(l, other).temp, 60);
  assert.equal(L.attach(l, other, "b"), false, "ein zweites Bad passt nicht");
  // umgekehrt: steht schon ein Brenner da, bleibt das Bad für sich
  const hot = heated({ type: "testtube", contains: [{ reagent: "H2O", ml: 5 }] }, {}, 0);
  assert.equal(L.tool(hot, L.place(hot, { type: "bath", under: "b" })).in, null);
});

test("Wasserbad: was das Bad erwärmt, gilt nicht als Wärme der Reaktion; die Reaktion läuft bei der Temperatur des Bades", () => {
  const l = bathed({ type: "beaker", contains: [{ reagent: "Na2S2O3 0.16M", ml: 50 }] }, 35, 25), seen = [];
  L.step(l, 1500, (e) => seen.push(e));
  near(look(l).T, 35, 0.1, "im Bad");
  L.setTemp(l, "wb", 25);
  L.setTemp(l, "wb", 35);
  L.add(l, "b", "HCl 2M", { ml: 5 });
  const t = until(l, () => seen.some((e) => e.key === "opaque"), 900, seen);
  const warm = thio(0.16, 35).t;
  assert.ok(Math.abs(t - warm) <= 3, `im Bad von 35 °C: ${t} s, bei 35 °C im Raum: ${warm} s`);
  L.setTemp(l, "wb", 20);
  L.step(l, 1500, (e) => seen.push(e));
  assert.ok(!keys(seen).includes("tempMax"), "keine Meldung über ein Temperaturmaximum: " + keys(seen).join());
});

const photo = (contains, nm, more) => lab([{ type: "beaker", id: "b", contains }, Object.assign({ type: "photometer", id: "ph", in: "b" }, nm == null ? {} : { nm })].concat(more || []), { room: 25 });
const E = (l) => L.reading(l, "ph").value;

test("Fotometer: die Extinktion folgt Lambert-Beer – proportional zur Konzentration, am größten bei der Wellenlänge der Bande", () => {
  const l = photo([{ reagent: "KMnO4 0.0002M", ml: 50 }], 526);
  near(E(l), 2400 * 2e-4 * 1, 1e-6, "E = ε · c · d mit d = 1 cm");
  near(E(photo([{ reagent: "KMnO4 0.0001M", ml: 50 }], 526)), 0.24, 1e-6, "halbe Konzentration");
  assert.ok(E(photo([{ reagent: "KMnO4 0.0002M", ml: 50 }], 700)) < 0.005, "im Roten nimmt Permanganat kaum etwas weg");
  assert.equal(L.reading(l, "ph").nm, 526);
  const spectrum = L.spectrum(l, "b");
  const top = spectrum.reduce((best, p) => (p[1] > best[1] ? p : best));
  assert.ok(Math.abs(top[0] - 526) <= 5 && Math.abs(top[1] - 0.48) < 0.01, `Maximum des Spektrums bei ${top[0]} nm: ${top[1]}`);
  assert.equal(spectrum[0][0], 380);
  assert.equal(spectrum[spectrum.length - 1][0], 730);
  assert.equal(L.setWave(l, "ph", 600), true);
  assert.equal(L.atRest(l), false, "die Anzeige stellt sich noch ein");
  L.step(l, 10);
  near(E(l), L.absorbance(l, "b", 600), 1e-6, "nach dem Umstellen folgt die Anzeige");
  assert.ok(E(l) < 0.1);
  L.setWave(l, "ph", 9999);
  assert.equal(L.reading(l, "ph").nm, 730, "sichtbares Licht: 380 bis 730 nm");
  L.setWave(l, "ph", 100);
  assert.equal(L.reading(l, "ph").nm, 380);
  assert.equal(L.setWave(l, "b", 500), false);
  assert.equal(L.reading(photo([{ reagent: "H2O", ml: 50 }], 526), "ph").value, 0, "Wasser nimmt nichts weg");
  assert.equal(L.reading(photo([], 526), "ph").value, null, "ohne Flüssigkeit keine Anzeige");
  assert.equal(L.reading(photo([{ reagent: "H2O", ml: 50 }]), "ph").nm, 525, "ohne Angabe steht es auf 525 nm");
  const dark = photo([{ reagent: "KMnO4 0.02M", ml: 50 }], 526);
  assert.equal(E(dark), 3, "mehr als 3 zeigt das Gerät nicht");
  assert.equal(L.reading(dark, "ph").over, true);
  assert.throws(() => L.normalize({ bench: [{ type: "beaker", id: "b" }, { type: "photometer", in: "b", nm: 1200 }] }), (e) => e.code === "amount");
});

test("Fotometer: auch Trübung nimmt Licht weg; wird die Lösung undurchsichtig, ist die Extinktion etwa 1", () => {
  const l = photo([{ reagent: "Na2S2O3 0.16M", ml: 50 }], 650), seen = [];
  assert.equal(E(l), 0);
  L.add(l, "b", "HCl 2M", { ml: 5 });
  until(l, () => seen.some((e) => e.key === "opaque"), 900, seen);
  near(L.absorbance(l, "b", 650), 1, 0.05, "Extinktion der Trübung");
  near(L.absorbance(l, "b", 450), L.absorbance(l, "b", 650), 1e-9, "bei jeder Wellenlänge gleich");
  // ein Farbstoff, von dem nur die Farbe bekannt ist: drei breite Bereiche
  const iron = photo([{ reagent: "FeSO4 0.5M", ml: 50 }], 650);
  assert.ok(L.absorbance(iron, "b", 650) > L.absorbance(iron, "b", 540) && L.absorbance(iron, "b", 540) > 0, "blassgrün: im Roten fehlt am meisten");
});

test("Fotometer: Kristallviolett verblasst – die Extinktion fällt wie die Konzentration, ihr Logarithmus als Gerade", () => {
  const run = L.createRun(L.normalize({ room: 25, bench: [{ type: "beaker", id: "b", contains: [{ reagent: "crystal violet", ml: 10 }] }, { type: "photometer", id: "ph", in: "b", nm: 590 }] }));
  near(L.reading(run.lab, "ph").value, 87000 * 2.5e-5, 1e-6, "E am Anfang");
  L.act(run, (lab) => L.add(lab, "b", "NaOH 0.1M", { ml: 10 }));
  L.advance(run, 400);
  const points = L.series(run, { tool: "ph" }).filter((p) => p[0] > 20 && p[1] > 0.02);
  assert.ok(points.length > 20);
  const slope = (a, b) => (Math.log(b[1]) - Math.log(a[1])) / (b[0] - a[0]);
  const first = slope(points[0], points[Math.floor(points.length / 2)]), second = slope(points[Math.floor(points.length / 2)], points[points.length - 1]);
  near(first, -0.1 * 0.05, 2e-4, "Steigung von ln E: −k · c(OH−)");
  near(second, first, 1e-4, "eine Gerade");
});

// ---------------------------------------------------------------- Meilenstein 5: Zeichnung, Texte, Oberfläche

test("Wasserbad und Fotometer: Namen, Anzeige, Zeichnung und Sätze", () => {
  assert.equal(L.partName("bath", "de"), "Wasserbad");
  assert.equal(L.partName("bath", "en"), "water bath");
  assert.equal(L.partName("photometer", "de"), "Fotometer");
  assert.equal(L.partName("photometer", "en"), "photometer");
  const l = photo([{ reagent: "KMnO4 0.0002M", ml: 50 }], 526);
  assert.equal(L.shown(L.reading(l, "ph"), "de"), "E 0,480");
  assert.equal(L.shown(L.reading(l, "ph"), "en"), "A 0.480");
  assert.equal(L.shown(L.reading(photo([{ reagent: "KMnO4 0.02M", ml: 50 }], 526), "ph"), "de"), "E > 3");
  assert.equal(L.shown(L.reading(photo([], 526), "ph"), "de"), "E –");
  const b = bathed(water5, 50), tube = L.vessel(b, "b");
  assert.equal(L.shown(L.reading(b, "wb"), "de"), "50 °C");
  const stand = L.parts.bath.stand(tube);
  assert.ok(stand.lift >= 20, "das Gefäß steht im Bad etwas über dem Tisch");
  const warm = L.parts.bath.draw(L.reading(b, "wb"), ctx(), stand);
  assert.match(warm, /cl-bath-water/);
  assert.match(warm, />50 °C</);
  assert.match(warm, /cl-clamp/, "ein Reagenzglas hält eine Klemme");
  assert.doesNotMatch(warm, /cl-ice/);
  assert.doesNotMatch(L.parts.bath.draw(L.reading(b, "wb"), ctx({ numbers: false }), stand), /°C/);
  L.setTemp(b, "wb", 0);
  assert.match(L.parts.bath.draw(L.reading(b, "wb"), ctx(), stand), /cl-ice/, "bei 0 °C schwimmt Eis im Bad");
  assert.match(L.parts.bath.draw(L.reading(b, "wb"), ctx(), null), /cl-bath-water/, "auch für sich auf dem Tisch");
  clean(warm, "Wasserbad");
  const probe = L.parts.beaker.probe(L.vessel(l, "b"), "photometer", 0);
  const drawn = L.parts.photometer.draw(L.reading(l, "ph"), ctx(), probe);
  assert.match(drawn, />E 0,480</);
  assert.match(drawn, /class="cl-light" [^>]*fill="rgb\(\d+, ?\d+, ?\d+\)"/, "die Sonde leuchtet in der Farbe des Lichts");
  assert.match(L.parts.photometer.draw(L.reading(l, "ph"), ctx({ numbers: false }), probe), />E</);
  clean(drawn, "Fotometer");
  for (const type of ["testtube", "beaker", "dish"]) {
    const v = { type, size: 100, cap: 100 }, at = L.parts[type].probe(v, "photometer", 0), others = ["thermometer", "phmeter", "conductometer"].map((t) => L.parts[type].probe(v, t, 0));
    assert.ok(others.every((o) => Math.abs(o.top - at.top) >= 12), type + ": die Anzeige steht auf eigener Höhe");
  }
  const [red, green, blue] = [650, 530, 450].map((nm) => L.waveRgb(nm));
  assert.ok(red[0] > 200 && red[1] < 80 && red[2] < 80, "650 nm ist rot: " + red);
  assert.ok(green[1] > 200 && green[0] < 160 && green[2] < 160, "530 nm ist grün: " + green);
  assert.ok(blue[2] > 200 && blue[1] < 120, "450 nm ist blau: " + blue);
  const icons = ["bath", "photometer", "thermometer", "phmeter", "conductometer", "burner"].map((id) => L.icon(id));
  assert.equal(new Set(icons).size, icons.length, "jedes Gerät hat sein eigenes Bildchen");
  const c = { lang: "de", numbers: true, names: { b: "Becherglas 1", wb: "Wasserbad 1", ph: "Fotometer 1" } };
  assert.equal(L.say({ key: "opaque", vessel: "b" }, c), "Becherglas 1: Durch die Flüssigkeit sieht man nicht mehr hindurch.");
  assert.equal(L.say({ key: "solid", vessel: "b", species: "S(s)", color: "yellow", colloid: true }, c), "Becherglas 1: Die Flüssigkeit trübt sich: Schwefel, fein verteilt.");
  assert.equal(L.say({ key: "temp", part: "wb", temp: 60 }, c), "Wasserbad 1: auf 60 °C gestellt");
  assert.equal(L.say({ key: "wave", part: "ph", nm: 590 }, c), "Fotometer 1: auf 590 nm gestellt");
  assert.equal(L.say({ key: "temp", part: "wb", temp: 60 }, { lang: "en", numbers: true, names: c.names }), "Wasserbad 1: set to 60 °C");
  assert.equal(L.say({ key: "temp", part: "wb", temp: 60 }, { lang: "de", numbers: false, names: c.names }), "Wasserbad 1: Temperatur verstellt");
});

const kinetic = { room: 25, bench: [{ type: "beaker", id: "b", contains: [{ reagent: "KMnO4 0.0002M", ml: 50 }] }, { type: "photometer", id: "ph", in: "b", nm: 526 },
  { type: "testtube", id: "t", contains: [{ reagent: "H2O", ml: 5 }] }, { type: "bath", id: "wb", under: "t", temp: 40 }, { type: "thermometer", id: "th", in: "t" }],
  show: { numbers: true, charts: ["A", "spectrum", "T"] } };

test("Wasserbad bedienen: die Temperatur am Schieber einstellen; das Glas steht im Bad und wird warm", () => {
  const el = mount(kinetic);
  assert.equal(item(el, "wb").attributes["aria-label"], "Wasserbad 1 unter Reagenzglas 1: 40 °C");
  assert.match(item(el, "wb").innerHTML, /cl-bath-water/);
  const y = (id) => +/translate\([\d.]+,([\d.]+)\)/.exec(part(el, ".cl-svg").innerHTML.split(`data-id="${id}"`)[1])[1];
  assert.ok(y("t") < y("b") && y("wb") === y("b"), "das Reagenzglas steht im Bad über dem Tisch, das Bad auf dem Tisch");
  tap(el, "wb");
  const panel = part(el, ".cl-panel").innerHTML;
  assert.match(panel, /data-act="temp"[^>]*min="0"[^>]*max="95"/);
  assert.doesNotMatch(panel, /data-act="flame"/, "keine Flamme zu wählen");
  assert.equal(part(el, ".cl-panel").querySelector(".cl-dial-shown").textContent, "40 °C");
  enter(el, "input", "temp", "70");
  assert.equal(part(el, ".cl-panel").querySelector(".cl-dial-shown").textContent, "70 °C", "beim Ziehen folgt die Anzeige");
  assert.equal(state(el).run.lab.tools.find((t) => t.id === "wb").temp, 40, "eingestellt wird erst beim Loslassen");
  enter(el, "change", "temp", "60");
  assert.equal(state(el).run.lab.tools.find((t) => t.id === "wb").temp, 60);
  assert.equal(state(el).play, 1, "die Uhr läuft los");
  assert.match(logOf(el), /Wasserbad 1: auf 60 °C gestellt/);
  enter(el, "change", "temp", "65");
  assert.equal(state(el).run.log.filter((e) => e.key === "temp").length, 1, "im selben Augenblick weitergedreht: eine Zeile");
  assert.match(logOf(el), /Wasserbad 1: auf 65 °C gestellt/);
  frames(60);
  assert.ok(L.view(state(el).run.lab, L.vessel(state(el).run.lab, "t")).T > 45, "das Glas wird warm");
  assert.equal(item(el, "wb").attributes["aria-label"], "Wasserbad 1 unter Reagenzglas 1: 65 °C");
  const quiet = mount(Object.assign({}, kinetic, { show: { numbers: false } }));
  tap(quiet, "wb");
  assert.equal(part(quiet, ".cl-panel").querySelector(".cl-dial-shown").textContent, "");
  assert.equal(item(quiet, "wb").attributes["aria-label"], "Wasserbad 1 unter Reagenzglas 1");
});

test("Fotometer bedienen: Wellenlänge am Schieber, Extinktion und Durchlässigkeit im Feld, Diagramme für Verlauf und Spektrum", () => {
  const el = mount(kinetic);
  assert.equal(item(el, "ph").attributes["aria-label"], "Fotometer 1 in Becherglas 1: E 0,480");
  tap(el, "ph");
  const panel = part(el, ".cl-panel");
  assert.match(panel.innerHTML, /data-act="wave"[^>]*min="380"[^>]*max="730"/);
  assert.equal(panel.querySelector(".cl-dial-shown").textContent, "526 nm");
  assert.match(panel.querySelector(".cl-contents").innerHTML, /E 0,480/);
  assert.match(panel.querySelector(".cl-contents").innerHTML, /Durchlässigkeit 33,1 %/);
  assert.match(part(el, ".cl-charts").innerHTML, /Extinktion/);
  assert.match(part(el, ".cl-charts").innerHTML, /Spektrum/);
  assert.match(part(el, ".cl-charts").innerHTML, /Wellenlänge in nm/);
  assert.match(part(el, ".cl-charts").innerHTML, />380<[\s\S]*>730</, "die Achse des Spektrums reicht von 380 bis 730 nm");
  enter(el, "change", "wave", "600");
  assert.equal(state(el).run.lab.tools.find((t) => t.id === "ph").nm, 600);
  assert.match(logOf(el), /Fotometer 1: auf 600 nm gestellt/);
  frames(60);
  assert.match(item(el, "ph").attributes["aria-label"], /^Fotometer 1 in Becherglas 1: E 0,0\d\d$/);
  assert.equal(panel.querySelector(".cl-dial-shown").textContent, "600 nm");
});

test("Regal: Wasserbad und Fotometer stehen bei den Geräten; das Wasserbad kommt unter ein Gefäß, das Fotometer hinein", () => {
  const el = mount({ bench: [{ type: "testtube", id: "t", contains: [{ reagent: "H2O", ml: 5 }] }] });
  const shelf = part(el, ".cl-shelf").innerHTML;
  assert.match(shelf, /data-id="bath"/);
  assert.match(shelf, /data-id="photometer"/);
  press(el, "hand", "bath");
  tap(el, "t");
  assert.equal(state(el).run.lab.tools[0].in, "t");
  assert.match(logOf(el), /Wasserbad 1 unter Reagenzglas 1 gestellt/);
  press(el, "hand", "burner");
  tap(el, "t");
  assert.equal(state(el).run.lab.tools.length, 1, "ein Brenner passt nicht dazu");
  press(el, "hand", "photometer");
  tap(el, "t");
  assert.equal(state(el).run.lab.tools[1].in, "t");
  assert.match(item(el, "photometer1").attributes["aria-label"], /^Fotometer 1 in Reagenzglas 1: E 0,000$/);
});

// ---------------------------------------------------------------- Teilchenlupe

const dots = (l, id) => Object.fromEntries(L.particles(l, id || "b").dots.map((d) => [d.id, d.n]));

test("Teilchenlupe: ein Punkt steht für 20 mmol/L; verdünnt sind es weniger, sehr konzentriert wird der Maßstab gröber", () => {
  const salt = beaker([{ reagent: "NaCl 0.1M", ml: 50 }]);
  assert.deepEqual(dots(salt), { "Cl-(aq)": 5, "Na+(aq)": 5 });
  assert.equal(L.particles(salt, "b").per, 0.02);
  assert.deepEqual(dots(beaker([{ reagent: "NaCl 0.1M", ml: 20 }, { reagent: "H2O", ml: 30 }])), { "Cl-(aq)": 2, "Na+(aq)": 2 }, "verdünnt auf 40 mmol/L");
  assert.deepEqual(dots(beaker([{ reagent: "H2O", ml: 50 }])), {}, "in reinem Wasser ist von H+ und OH- nichts zu sehen");
  const strong = L.particles(beaker([{ reagent: "HCl 2M", ml: 50 }]), "b");
  assert.equal(strong.dots.reduce((sum, d) => sum + d.n, 0), 120, "höchstens 120 Punkte");
  near(strong.per, 4 / 120, 1e-9, "dann steht ein Punkt für mehr");
  assert.deepEqual(strong.dots.map((d) => [d.id, d.charge]), [["Cl-(aq)", -1], ["H+(aq)", 1]]);
  const neutral = beaker([{ reagent: "HCl 1M", ml: 10 }, { reagent: "NaOH 1M", ml: 10 }]);
  assert.deepEqual(dots(neutral), { "Cl-(aq)": 25, "Na+(aq)": 25 }, "nach der Neutralisation: kein H+ und kein OH- mehr");
  assert.equal(L.particles(neutral, "b").wet, true);
  assert.equal(L.particles(beaker([]), "b").wet, false);
  assert.deepEqual(L.particles(beaker([]), "nirgends"), { per: 0.02, dots: [], solids: [], T: 20, wet: false, walk: 0, paste: false, residue: false });
});

test("Teilchenlupe: Niederschlag und Stücke erscheinen als Feststoff, Schwebendes ist als solches vermerkt", () => {
  const l = beaker([{ reagent: "NaCl 0.2M", ml: 25 }], { room: 25 });
  L.add(l, "b", "AgNO3 0.2M", { ml: 25 });
  L.step(l, 3);
  const fresh = L.particles(l, "b").solids.find((x) => x.id === "AgCl(s)");
  assert.ok(fresh && fresh.n >= 1 && fresh.hang > 0.5, "frisch gefällt schwebt das Silberchlorid: " + JSON.stringify(fresh));
  L.step(l, 300);
  assert.ok(L.particles(l, "b").solids.find((x) => x.id === "AgCl(s)").hang < 0.05, "später liegt es am Boden");
  assert.deepEqual(dots(l), { "NO3-(aq)": 5, "Na+(aq)": 5 }, "in der Lösung bleiben Natrium und Nitrat");
  const chips = beaker([{ reagent: "H2O", ml: 50 }, { reagent: "marble", g: 1 }, { reagent: "Zn granules", g: 2 }]);
  const solids = L.particles(chips, "b").solids;
  assert.deepEqual(solids.map((x) => x.id).sort(), ["CaCO3(s)", "Zn(s)"]);
  assert.ok(solids.every((x) => x.n >= 1 && x.hang === 0) && solids.reduce((sum, x) => sum + x.n, 0) <= 14);
  assert.ok(solids.find((x) => x.id === "Zn(s)").n > solids.find((x) => x.id === "CaCO3(s)").n, "mehr Zink als Marmor");
});

test("Teilchenlupe: gezeichnet wird jedes Teilchen als Punkt im Kreis; die Bewegung folgt der Uhr und der Temperatur", () => {
  const data = L.particles(beaker([{ reagent: "CuSO4 0.5M", ml: 50 }], { room: 25 }), "b");
  const svg = L.fx.lens(data, 3, 1, false);
  const circles = [...svg.matchAll(/<circle class="cl-dot" data-id="([^"]+)" cx="([-\d.]+)" cy="([-\d.]+)"/g)];
  assert.equal(circles.length, data.dots.reduce((sum, d) => sum + d.n, 0));
  assert.ok(circles.every((c) => Math.hypot(+c[2], +c[3]) <= 66), "alle liegen im Kreis");
  assert.match(svg, /cl-lens-glass/);
  assert.match(svg, /cl-water/, "Wasser ist angedeutet");
  assert.match(svg, /<text[^>]*>2\+<\/text>/, "die Ladung steht im Punkt");
  assert.equal(L.fx.lens(data, 3, 1, false), svg, "derselbe Augenblick, dasselbe Bild: beim Zurückspulen laufen die Teilchen zurück");
  assert.notEqual(L.fx.lens(data, 3.5, 1, false), svg, "mit der Zeit bewegen sie sich");
  assert.equal(L.fx.lens(data, 3.5, 1, true), L.fx.lens(data, 9, 1, true), "ohne Bewegung stehen sie still");
  const where = (d, t) => [...L.fx.lens(d, t, 1, false).matchAll(/<circle class="cl-dot" data-id="[^"]+" cx="([-\d.]+)" cy="([-\d.]+)"/g)].map((c) => [+c[1], +c[2]]);
  const hot = Object.assign({}, data, { T: 95 }), cold = Object.assign({}, data, { T: 0 });
  // heiß laufen die Teilchen denselben Weg schneller ab: die Geschwindigkeit wächst mit der Wurzel der Temperatur
  assert.deepEqual(where(hot, 3), where(cold, 3 * Math.sqrt(368.15 / 273.15)));
  assert.notDeepEqual(where(hot, 3), where(cold, 3));
  // Feststoff: Bausteine am Boden, Schwebendes mitten in der Flüssigkeit
  const solid = { per: 0.02, dots: [], solids: [{ id: "AgCl(s)", n: 6, hang: 0 }], T: 25, wet: true };
  const low = [...L.fx.lens(solid, 1, 1, false).matchAll(/<rect class="cl-grain" data-id="AgCl\(s\)" x="([-\d.]+)" y="([-\d.]+)"/g)];
  assert.equal(low.length, 6);
  assert.ok(low.every((r) => +r[2] > 20), "am Boden");
  const high = [...L.fx.lens(Object.assign({}, solid, { solids: [{ id: "AgCl(s)", n: 6, hang: 1 }] }), 1, 1, false).matchAll(/<rect class="cl-grain" data-id="AgCl\(s\)" x="([-\d.]+)" y="([-\d.]+)"/g)];
  assert.ok(high.some((r) => +r[2] < 20), "schwebend");
  assert.match(L.fx.lens({ per: 0.02, dots: [], solids: [], T: 20, wet: false }, 0, 1, false), /cl-lens-glass/);
  assert.doesNotMatch(L.fx.lens({ per: 0.02, dots: [], solids: [], T: 20, wet: false }, 0, 1, false), /cl-water/, "ohne Flüssigkeit kein Wasser");
});

test("Teilchenlupe bedienen: ein Knopf im Feld des Gefäßes öffnet sie; die Legende nennt Teilchen, Anzahl und Maßstab", () => {
  const el = mount({ room: 25, bench: [{ type: "beaker", id: "b", contains: [{ reagent: "CuSO4 0.5M", ml: 50 }] }], shelf: ["NaOH 1M", "H2O"] });
  tap(el, "b");
  const panel = part(el, ".cl-panel");
  assert.match(panel.innerHTML, /data-act="lens"[^>]*aria-pressed="false"[^>]*>Teilchenlupe</);
  assert.equal(panel.querySelector(".cl-lens").innerHTML, "", "anfangs geschlossen");
  press(el, "lens");
  assert.equal(panel.querySelector('[data-act="lens"]').attributes["aria-pressed"], "true");
  const lens = panel.querySelector(".cl-lens").innerHTML;
  assert.match(lens, /<svg[^>]*role="img"[^>]*aria-label="Teilchenlupe: [^"]*Kupfer/);
  assert.match(panel.querySelector(".cl-lens-view").innerHTML, /cl-dot/, "das Bild steht im Kreis");
  const first = panel.querySelector(".cl-lens-view").innerHTML;
  press(el, "play");
  frames(6);
  assert.equal(state(el).play, 0, "in Ruhe läuft die Uhr nicht, die Teilchen stehen");
  assert.equal(panel.querySelector(".cl-lens-view").innerHTML, first);
  assert.match(lens, /Kupfersulfat, gelöst als Ionenpaar/);
  assert.match(lens, /1 Punkt steht für 20 mmol\/L/);
  assert.match(lens, /Wasser ist nur angedeutet/);
  frames(4);
  press(el, "lens");
  assert.equal(panel.querySelector(".cl-lens").innerHTML, "");
  assert.equal(panel.querySelector('[data-act="lens"]').attributes["aria-pressed"], "false");
  const plain = mount({ bench: [{ type: "beaker", id: "b", contains: [{ reagent: "NaCl 1M", ml: 50 }] }], show: { particles: false } });
  tap(plain, "b");
  assert.doesNotMatch(part(plain, ".cl-panel").innerHTML, /data-act="lens"/, "abschaltbar für Kurse ohne Teilchenmodell");
  const quiet = mount({ bench: [{ type: "beaker", id: "b", contains: [{ reagent: "NaCl 1M", ml: 50 }] }], show: { numbers: false } });
  tap(quiet, "b");
  press(quiet, "lens");
  assert.match(part(quiet, ".cl-panel").querySelector(".cl-lens").innerHTML, /Natrium-Ion/);
  assert.doesNotMatch(part(quiet, ".cl-panel").querySelector(".cl-lens").innerHTML, /mmol/, "ohne Zahlen kein Maßstab");
});

test("Gleichungen: bei einer katalysierten Reaktion steht der Katalysator dabei", () => {
  const el = mount({ room: 25, bench: [{ type: "testtube", id: "t", contains: [{ reagent: "H2O2 1M", ml: 5 }, { reagent: "KI 1M", ml: 1 }, { reagent: "MnO2", g: 0.02 }] }] });
  press(el, "play");
  frames(40);
  const eq = part(el, ".cl-eq").innerHTML;
  assert.match(eq, /Katalysator: Mangandioxid \(Braunstein\)/);
  assert.match(eq, /Katalysator: Iodid-Ion/);
  assert.equal(eq.match(/Katalysator:/g).length, 2, "je Weg einmal");
  const plain = mount({ room: 25, bench: [{ type: "testtube", id: "t", contains: [{ reagent: "HCl 1M", ml: 8 }, { reagent: "Mg ribbon", g: 0.02 }] }] });
  press(plain, "play");
  frames(20);
  assert.doesNotMatch(part(plain, ".cl-eq").innerHTML, /Katalysator/);
});

test("README: die Folien zu Kinetik und Gleichgewicht halten, was ihr Text verspricht", () => {
  const readme = fs.readFileSync(new URL("README.md", here), "utf8");
  const slide = (title) => {
    const at = readme.indexOf("\n## " + title + "\n");
    assert.ok(at >= 0, "Folie " + title);
    return L.createLab(L.normalize(/```+ *json +@ChemLab\.sim\n([\s\S]*?)\n```+/.exec(readme.slice(at))[1]));
  };
  const opaque = (l, id) => { const seen = []; L.add(l, id, "HCl 2M", { ml: 5 }); return until(l, () => seen.some((e) => e.key === "opaque" && e.vessel === id), 900, seen); };

  let l = slide("Reaktionsgeschwindigkeit: Konzentration");
  const full = opaque(l, "voll"), half = opaque(l, "halb");
  assert.ok(half / full > 1.6 && half / full < 2.3, `${full} s und ${half} s`);

  l = slide("Reaktionsgeschwindigkeit: Temperatur");
  until(l, () => Math.abs(L.reading(l, "thermometer1").value - 35) < 0.3, 2000);
  const warm = opaque(l, "glas");
  assert.ok(warm >= 8 && warm <= 13, `bei 35 °C: ${warm} s`);

  l = slide("Reaktionsgeschwindigkeit: Zerteilungsgrad");
  L.add(l, "links", "marble", { g: 0.5 });
  L.add(l, "rechts", "marble powder", { g: 0.5 });
  // die ersten Sekunden bleibt das Kohlenstoffdioxid in der Lösung; Gas entsteht, sobald sie gesättigt ist
  L.step(l, 18);
  const [slow, fast] = ["syringe1", "syringe2"].map((id) => L.reading(l, id).value);
  assert.ok(fast > 4 * slow && slow > 0, `nach 18 s: Körner ${slow} mL, Pulver ${fast} mL`);
  L.step(l, 900);
  const [a, b] = ["syringe1", "syringe2"].map((id) => L.reading(l, id).value);
  assert.ok(Math.abs(a - b) < 0.03 * a && a > 60 && a < 99 && !L.reading(l, "syringe1").full, `am Ende ${a} mL und ${b} mL`);

  l = slide("Katalysator");
  L.step(l, 60);
  assert.equal(gasOf(l, "O2(g)", "links") + gasOf(l, "O2(g)", "rechts"), 0, "ohne Katalysator geschieht nichts");
  L.add(l, "links", "MnO2", { g: 0.05 });
  L.add(l, "rechts", "KI 1M", { ml: 2 });
  L.step(l, 30);
  assert.ok(gasOf(l, "O2(g)", "links") > 3 * gasOf(l, "O2(g)", "rechts") && gasOf(l, "O2(g)", "rechts") > 1e-5, "mit Braunstein viel schneller");
  near(amount(l, "I-(aq)", "rechts"), 0.002, 1e-12, "das Iodid bleibt");

  l = slide("Ioduhr");
  const seen = [];
  L.add(l, "beaker1", "K2S2O8 0.1M", { ml: 20 });
  const blue = until(l, () => seen.some((e) => e.key === "color"), 300, seen);
  assert.ok(blue >= 54 && blue <= 64, `bei 20 °C blau nach ${blue} s`);
  // mit 1 mL Stärkelösung bleibt die Lösung danach blau bis blauschwarz; mit zu wenig Stärke färbte das überschüssige Iod sie grün
  for (let i = 0; i < 12; i++) { L.step(l, 10); assert.ok(["blue", "black"].includes(look(l, "beaker1").color.name), `${blue + 10 * (i + 1)} s: ${look(l, "beaker1").color.name}`); }
  assert.ok(!equations(l, "beaker1").some((eq) => /HS2O3/.test(eq)), "eine Spur, die niemand messen könnte, steht nicht bei den Gleichungen");

  l = slide("Fotometer: Farbe messen");
  near(L.reading(l, "photometer1").value, 2400 * 2e-4 * Math.exp(-0.5 * Math.pow(1 / (70 / 2.3548), 2)), 1e-3, "Extinktion bei 525 nm");
  const first = L.reading(l, "photometer1").value;
  L.add(l, "probe", "H2O", { ml: 50 });
  L.step(l, 20);
  near(L.reading(l, "photometer1").value, first / 2, 0.003, "mit 50 mL Wasser die Hälfte");

  l = slide("Fotometer: eine Reaktion verfolgen");
  const start = L.reading(l, "photometer1").value;
  L.add(l, "probe", "NaOH 0.1M", { ml: 10 });
  const t = until(l, () => L.reading(l, "photometer1").value <= start / 4, 900);
  assert.ok(t >= 200 && t <= 222, `nach dem Verdünnen auf die Hälfte noch eine Halbwertszeit, bei 20 °C: ${t} s`);

  l = slide("Gleichgewicht verschieben: Konzentration");
  const pale = L.reading(l, "photometer1").value;
  assert.ok(pale > 0.2 && pale < 0.5 && look(l, "probe").cloud.alpha === 0, `klar und orange: E ${pale}`);
  L.add(l, "probe", "FeCl3 0.1M", { ml: 2 });
  L.step(l, 10);
  const deep = L.reading(l, "photometer1").value;
  assert.ok(deep > 3 * pale, `mit mehr Eisen tiefer: ${deep}`);
  L.add(l, "probe", "H2O", { ml: 100 });
  L.step(l, 15);
  assert.ok(L.reading(l, "photometer1").value < 0.45 * deep, "auf das Doppelte verdünnt: weniger als die Hälfte");

  l = slide("Gleichgewicht verschieben: Säure und Lauge");
  assert.equal(look(l, "beaker1").color.name, "yellow");
  L.add(l, "beaker1", "HCl 1M", { ml: 5 });
  L.step(l, 10);
  assert.equal(look(l, "beaker1").color.name, "orange");
  L.add(l, "beaker1", "BaCl2 0.1M", { ml: 10 });
  L.step(l, 20);
  assert.ok(amount(l, "BaCrO4(s)", "beaker1") > 1e-4, "Bariumchromat aus der orangefarbenen Lösung");

  l = slide("Gleichgewicht verschieben: Temperatur");
  assert.equal(look(l, "glas").color.name, "pink");
  L.setTemp(l, "bath1", 80);
  L.step(l, 300);
  assert.equal(look(l, "glas").color.name, "blue");
  L.setTemp(l, "bath1", 5);
  L.step(l, 300);
  assert.equal(look(l, "glas").color.name, "pink");

  l = slide("Teilchenlupe");
  assert.deepEqual(dots(l, "beaker1"), { "Cl-(aq)": 50, "H+(aq)": 50 });
  L.add(l, "beaker1", "NaOH 1M", { ml: 20 });
  L.step(l, 10);
  assert.deepEqual(dots(l, "beaker1"), { "Cl-(aq)": 25, "Na+(aq)": 25 });
});

test("Teilchenlupe: farblose Teilchen bekommen unterscheidbare Farben, Kationen warme und Anionen kühle; farbige behalten ihre eigene", () => {
  const el = mount({ room: 25, bench: [{ type: "beaker", id: "b", contains: [{ reagent: "NaCl 1M", ml: 20 }, { reagent: "NaOH 1M", ml: 20 }, { reagent: "KNO3 1M", ml: 20 }, { reagent: "KMnO4 0.5M", ml: 20 }] }] });
  tap(el, "b");
  press(el, "lens");
  const legend = part(el, ".cl-panel").querySelector(".cl-lens").innerHTML;
  const colors = Object.fromEntries([...legend.matchAll(/style="background:([^"]+)"><\/span> ([^–]+) –/g)].map((m) => [m[2].replace(/<[^>]+>/g, "").trim(), m[1]]));
  const ids = Object.keys(colors);
  assert.equal(ids.length, 6, ids.join(" "));
  assert.equal(new Set(Object.values(colors)).size, 6, "sechs Teilchen, sechs Farben: " + JSON.stringify(colors));
  const rgb = (text) => (/^#/.test(text) ? [1, 3, 5].map((i) => parseInt(text.slice(i, i + 2), 16)) : text.match(/\d+/g).map(Number));
  const find = (start) => rgb(colors[ids.find((id) => id.startsWith(start))]);
  for (const cation of ["Na", "K"]) assert.ok(find(cation)[0] > find(cation)[2], cation + " in einem warmen Ton");
  for (const anion of ["Cl", "OH", "NO3"]) assert.ok(find(anion)[2] >= find(anion)[0], anion + " in einem kühlen Ton");
  assert.ok(find("MnO4")[1] < 120 && find("MnO4")[0] > 150, "Permanganat violett: " + colors[ids.find((id) => id.startsWith("MnO4"))]);
  const view = part(el, ".cl-panel").querySelector(".cl-lens-view").innerHTML;
  for (const color of Object.values(colors)) assert.ok(view.includes('fill="' + color + '"'), "die Punkte tragen die Farbe der Legende: " + color);
});

test("Kolloid: fein verteilter Schwefel trübt milchig blassgelb, nicht in der kräftigen Farbe des Pulvers", () => {
  const { l } = thio(0.16), cloud = look(l).cloud.rgb, powder = [0xe8, 0xd4, 0x4a];
  assert.ok(cloud.every((c, i) => c > powder[i]) && cloud[2] > 150 && cloud[0] > cloud[2], `Trübung ${cloud}`);
});

// ---------------------------------------------------------------- Befunde des Belastungstests, Meilenstein 5

test("Umgießen: schwebt ein Feststoff, von dem auch ein Stück im Glas liegt, bleibt das Stück beim Abgießen zurück und in der Buchführung", () => {
  // Schwefelpulver aus dem Regal und fein verteilter Schwefel aus dem Thiosulfat: derselbe Stoff, einmal als Stück, einmal als Trübung.
  // Erst wenn die Reaktion zu Ende ist, lässt sich die Flüssigkeit restlos abgießen: Dann zieht die ganze Trübung um.
  const l = lab([{ type: "beaker", id: "b", contains: [{ reagent: "Na2S2O3 0.05M", ml: 20 }, { reagent: "HCl 1M", ml: 20 }] }, { type: "beaker", id: "c" }], { room: 25 });
  L.step(l, 4000);
  assert.ok(amount(l, "S2O3^2-(aq)") + amount(l, "HS2O3-(aq)") < 1e-9, "das Thiosulfat ist verbraucht");
  L.add(l, "b", "sulfur", { g: 0.5 });
  const before = totals(l), powder = 0.5 / L.species("S(s)").M, cloud = amount(l, "S(s)") - powder;
  near(cloud, 1e-3, 1e-6, "1 mmol Schwefel schwebt");
  L.pour(l, "b", "c", 100);
  L.step(l, 10);
  const v = L.vessel(l, "b");
  assert.equal(L.volume(v), 0, "das erste Glas ist leer bis auf das Pulver");
  near(amount(l, "S(s)"), powder, 1e-12, "das Pulver liegt noch im ersten Glas");
  near(v.lumps.filter((x) => x.id === "S(s)").reduce((sum, x) => sum + x.n, 0), amount(l, "S(s)"), 1e-12, "Stücke und Buchführung stimmen überein");
  near(amount(l, "S(s)", "c"), cloud, 1e-9, "die Trübung ist mit umgezogen");
  near(totals(l).mass, before.mass, 1e-9, "Masse");
});

test("Ruhe: solange eine Farbe sichtbar verblasst, läuft die Uhr, auch wenn dabei kaum Stoff umgesetzt wird", () => {
  // Kristallviolett: 0,25 µmol Farbstoff. Der Umsatz liegt unter 1 nmol/s, die Farbe ändert sich trotzdem vor aller Augen.
  const l = beaker([{ reagent: "crystal violet", ml: 10 }], { room: 20 });
  assert.ok(L.atRest(l));
  L.add(l, "b", "NaOH 0.1M", { ml: 10 });
  for (const t of [30, 120, 300]) {
    L.step(l, t === 30 ? 30 : t === 120 ? 90 : 180);
    assert.equal(L.atRest(l), false, `nach ${t} s verblasst die Lösung noch (${look(l).color.rgb})`);
  }
  const rest = until(l, () => L.atRest(l), 6000);
  assert.ok(rest < 6000, "am Ende steht die Uhr");
  assert.ok(amount(l, "C25H30N3+(aq)") < 0.05 * 2.5e-7, "erst wenn kaum noch Farbstoff da ist");
  // ein Farbumschlag durch Zugeben hält die Uhr nur kurz am Laufen
  const buffer = beaker([{ reagent: "CH3COOH 0.1M", ml: 20 }, { reagent: "CH3COONa 0.1M", ml: 20 }], { room: 20 });
  L.add(buffer, "b", "BTB", { drops: 3 });
  const wait = until(buffer, () => L.atRest(buffer), 300);
  assert.ok(wait >= 5 && wait <= 20, `nach dem Zutropfen des Indikators: ${wait} s`);
});

test("Sofortige Reaktion: sie kommt nach den langsamen an die Reihe, gleich in welcher Reihenfolge die Daten sie nennen", () => {
  // Stünde die sofortige Reaktion in der Liste vor der langsamen, bliebe sonst in jedem Schritt eine Spur Iod stehen und färbte die Stärke vorzeitig.
  const order = L.db.reactions.slice();
  try {
    L.db.reactions.reverse();
    const { l, t } = clock();
    assert.ok(t >= 37 && t <= 45, `Umschlag nach ${t} s`);
    const fresh = beaker([{ reagent: "KI 0.2M", ml: 20 }, { reagent: "Na2S2O3 0.005M", ml: 10 }, { reagent: "starch", drops: 5 }], { room: 25 });
    L.add(fresh, "b", "K2S2O8 0.1M", { ml: 20 });
    L.step(fresh, 20);
    assert.ok(amount(fresh, "I3-(aq)") + amount(fresh, "C108H180O90I3-(aq)") < 1e-10, "auf halbem Weg ist kein Iod zu sehen");
    assert.equal(look(fresh).color.name, "colorless");
    assert.equal(l.failed || 0, 0);
  } finally { L.db.reactions.splice(0, order.length, ...order); }
});

test("Ioduhr: bis zum Umschlag bleibt in keinem Rechenschritt Iod stehen, auch mit viel Stärke nicht", () => {
  // Befund im Browser: Die sofortige Reaktion kam nur an die Reihe, wenn zu Beginn eines Schritts schon Iod da war. Sonst blieb
  // das Iod dieses Schritts stehen, die Stärke nahm es auf, und die Lösung flackerte blassblau.
  const l = beaker([{ reagent: "KI 0.2M", ml: 20 }, { reagent: "Na2S2O3 0.005M", ml: 10 }, { reagent: "starch", drops: 20 }], { room: 25 }), seen = [];
  L.add(l, "b", "K2S2O8 0.1M", { ml: 20 });
  let most = 0;
  for (let i = 0; i < 30 * 20; i++) {
    L.step(l, 0.05, (e) => seen.push(e));
    most = Math.max(most, amount(l, "I3-(aq)") + amount(l, "C108H180O90I3-(aq)"));
  }
  assert.ok(most < 1e-12, `höchstens ${most} mol Iod in den ersten 30 s`);
  assert.deepEqual(keys(seen).filter((k) => k === "color"), [], "kein Farbwechsel vor dem Umschlag");
  const t = 30 + until(l, () => seen.some((e) => e.key === "color"), 300, seen);
  assert.ok(t >= 37 && t <= 45, `Umschlag nach ${t} s`);
  L.step(l, 60);
  assert.ok(["blue", "black"].includes(look(l).color.name), "danach bleibt es blau: " + look(l).color.name);
});

test("Wasserbad antippen: die Fläche unter dem Gefäß reicht bis unter die Tischkante, damit sie auch am Telefon zu treffen ist", () => {
  const l = bathed(water5, 50), tube = L.vessel(l, "b"), stand = L.parts.bath.stand(tube), hit = L.parts.bath.bounds(L.reading(l, "wb"), stand), glass = L.parts.testtube.bounds(tube);
  assert.ok(hit.bottom - hit.top >= 40, `Höhe ${hit.bottom - hit.top}`);
  assert.ok(hit.top > -stand.lift, "sie beginnt unter dem Boden des Gefäßes: das Gefäß selbst bleibt frei");
  assert.ok(hit.x0 < glass.x0 && hit.x1 > glass.x1, "und ist breiter als das Gefäß");
});

test("Marmor und frisch gefälltes Calciumcarbonat im selben Glas: der Niederschlag löst sich in Säure sofort, die Körner nach ihrem Gesetz", () => {
  const l = beaker([{ reagent: "CaCl2 0.1M", ml: 20 }, { reagent: "Na2CO3 0.1M", ml: 20 }], { room: 25 });
  L.add(l, "b", "marble", { g: 1 });
  L.step(l, 5);
  const made = () => L.vessel(l, "b").lumps.filter((x) => x.id === "CaCO3(s)" && x.made).reduce((sum, x) => sum + x.n, 0);
  const chips = () => L.vessel(l, "b").lumps.filter((x) => x.id === "CaCO3(s)" && !x.made).reduce((sum, x) => sum + x.n, 0);
  assert.ok(made() > 1.9e-3, `${made()} mol Niederschlag`);
  L.add(l, "b", "HCl 1M", { ml: 10 });
  const t = until(l, () => made() < 1e-5, 120);
  assert.ok(t <= 10, `der Niederschlag ist nach ${t} s gelöst`);
  assert.ok(chips() > 0.8 / 100.086, `von den Körnern ist erst wenig gelöst: ${chips()} mol`);
});

// ---------------------------------------------------------------- Befunde der Durchsicht, Meilenstein 5

const restAfter = (l, limit) => until(l, () => L.atRest(l), limit || 6000);

test("Ruhe: die Uhr läuft, solange sich die Extinktion merklich ändert – auch bei satter Farbe, wenig Lauge oder im kalten Bad", () => {
  // Befund der Durchsicht: Mit 2 mL statt 10 mL Lauge stand die Uhr nach 11 s, obwohl noch 99 % des Farbstoffs da waren.
  const cv = (more) => lab([{ type: "beaker", id: "b", contains: [{ reagent: "crystal violet", ml: 10 }] }, { type: "photometer", id: "ph", in: "b", nm: 590 }].concat(more || []), { room: 20 });
  const left = (l) => amount(l, "C25H30N3+(aq)") / 2.5e-7;
  let l = cv();
  L.add(l, "b", "NaOH 0.1M", { ml: 2 });
  let t = restAfter(l);
  assert.ok(t > 600 && t < 6000 && left(l) < 0.15, `wenig Lauge: Ruhe nach ${t} s bei ${left(l)} des Farbstoffs`);
  l = cv();
  L.add(l, "b", "H2O", { ml: 20 });
  L.add(l, "b", "NaOH 0.1M", { ml: 10 });
  t = restAfter(l);
  assert.ok(t > 300 && left(l) < 0.2, `verdünnt: Ruhe nach ${t} s bei ${left(l)}`);
  l = cv([{ type: "bath", id: "wb", under: "b", temp: 0 }]);
  L.step(l, 400);
  L.add(l, "b", "NaOH 0.1M", { ml: 10 });
  t = restAfter(l, 20000);
  assert.ok(t > 1500 && left(l) < 0.25, `im Eisbad: Ruhe nach ${t} s bei ${left(l)}`);
  // die erste Flüssigkeit in einem leeren Glas ist kein Farbwechsel
  const empty = beaker([], { room: 20 });
  L.add(empty, "b", "H2O", { ml: 50 });
  assert.ok(restAfter(empty, 100) <= 6, "Wasser in ein leeres Glas: die Uhr hält gleich nach dem Eingießen an");
});

test("Uhr: in Ruhe lässt ein zweiter Druck auf „Abspielen“ sie trotzdem zehn Minuten laufen", () => {
  const still = mount({ room: 25, bench: [{ type: "beaker", id: "b", contains: [{ reagent: "H2O", ml: 50 }] }] });
  press(still, "play");
  assert.equal(state(still).play, 0);
  assert.match(part(still, ".cl-status").textContent, /die Uhr steht.*Noch einmal/);
  press(still, "play");
  assert.equal(state(still).play, 1, "beim zweiten Mal läuft sie");
  state(still).speed = 7;                                    // ein Tempo, bei dem kein Bild genau auf zehn Minuten fällt
  frames(50);
  assert.ok(state(still).run.time > 300 && state(still).play === 1, `nach 50 s bei siebenfachem Tempo: ${state(still).run.time} s`);
  frames(40);
  assert.equal(state(still).play, 0, "nach zehn Minuten hält sie wieder an");
  near(state(still).run.time, 600, 0.06, "Zeit");
  assert.match(part(still, ".cl-status").textContent, /die Uhr steht/);
  // Eine stark verdünnte Ioduhr läuft so langsam, dass der Baustein sie ruhen lässt; nach einer halben Stunde ist sie blau.
  const el = mount({ room: 25, bench: [{ type: "beaker", id: "b", contains: [{ reagent: "H2O", ml: 80 }, { reagent: "KI 0.2M", ml: 1 }, { reagent: "starch", drops: 20 }, { reagent: "K2S2O8 0.05M", ml: 1 }] }] });
  state(el).speed = 60;
  press(el, "play");
  assert.equal(state(el).play, 0, "sie ruht, obwohl langsam Iod entsteht");
  for (let i = 0; i < 6 && state(el).run.time < 2400; i++) {
    if (!state(el).play) { press(el, "play"); if (!state(el).play) press(el, "play"); }
    frames(12);
  }
  const color = L.view(state(el).run.lab, L.vessel(state(el).run.lab, "b")).color.name;
  assert.ok(["blue", "black"].includes(color), `nach ${Math.round(state(el).run.time / 60)} Minuten: ${color}`);
});

test("Auflösung nach Gesetz: zwei Feststoffe im selben Glas folgen jeder seinem eigenen; ein träger hält den anderen nicht auf", () => {
  const before = L.db;
  try {
    const alone = lime("HCl 1M", "marble", 1);
    L.step(alone, 10);
    for (const [k, share] of [[5e-9, 0], [5.11e-6, 0.1]]) {
      L.db = before;
      L.register({
        species: { "PbCO3(s)": { name: { de: "Bleicarbonat" }, Hf: null, color: "#e8c8c0", src: "Probe" }, "Pb^2+(aq)": { name: { de: "Blei(II)-Ion" }, Hf: null, src: "Probe" } },
        equilibria: [{ eq: "PbCO3(s) <=> Pb^2+(aq) + CO3^2-(aq)", logK: -10.5, rate: { k, Ea: 20, order: { "H+(aq)": 1 } }, src: "Probe" }],
        reagents: { "cerussite": { name: { de: "Weißbleierz" }, solid: "PbCO3(s)", area: 6 } }
      });
      const l = lime("HCl 1M", "marble", 1);
      L.add(l, "b", "cerussite", { g: 1 });
      L.step(l, 10);
      near(calcium(l), calcium(alone), 0.03 * calcium(alone), `Marmor neben einem Stück mit k = ${k}`);
      near(dissolved(l, "Pb"), share * calcium(alone), 0.02 * calcium(alone), "das andere Stück nach seinem Gesetz (gleiche Oberfläche, ein Zehntel der Konstante)");
      assert.equal(L.atRest(l), false);
      assert.equal(l.failed || 0, 0);
    }
  } finally { L.db = before; }
});

test("Marmor im Überschuss über dem Brenner: das Protokoll meldet Gasblasen nicht im Sekundentakt an und ab", () => {
  const l = lab([{ type: "beaker", id: "b", contains: [{ reagent: "HCl 1M", ml: 50 }, { reagent: "marble", g: 5 }] }, { type: "burner", id: "br", under: "b", flame: 2 }], { room: 20 });
  const seen = collect(l, 600), gas = seen.filter((e) => e.key === "gas" || e.key === "gasEnd");
  assert.ok(gas.length <= 6, `${gas.length} Meldungen über Gasblasen in zehn Minuten`);
  assert.ok(gas.length >= 2, "Anfang und Ende werden gemeldet");
});

test("Iod-Stärke im Reagenzglas: mit einem Tropfen Iodlösung tiefblau, im heißen Wasserbad verblasst die Farbe, kalt kehrt sie zurück", () => {
  // So, wie es die Folie zur Ioduhr beschreibt, mit dem, was ihr Regal anbietet
  const readme = fs.readFileSync(new URL("README.md", here), "utf8"), at = readme.indexOf("\n## Ioduhr\n");
  const config = L.normalize(/```+ *json +@ChemLab\.sim\n([\s\S]*?)\n```+/.exec(readme.slice(at))[1]);
  for (const id of ["Lugol", "starch", "testtube", "bath", "H2O"]) assert.ok(config.shelf.includes(id), id + " steht im Regal der Folie");
  assert.ok(!config.shelf.includes("I2"), "keine Iod-Kristalle: schon die kleinste Portion wäre zu viel");
  const l = lab([{ type: "testtube", id: "b", contains: [{ reagent: "H2O", ml: 10 }, { reagent: "starch", drops: 20 }] }, { type: "bath", id: "wb", under: "b", temp: 20 }], { room: 20 });
  L.add(l, "b", "Lugol", { drops: 1 });
  L.step(l, 20);
  const blue = look(l).color;
  assert.equal(blue.name, "blue", "kalt: " + blue.rgb);
  L.setTemp(l, "wb", 95);
  L.step(l, 200);
  const hot = look(l).color;
  assert.ok(["yellow", "green"].includes(hot.name) && hot.pale && hot.rgb[0] + hot.rgb[1] > blue.rgb[0] + blue.rgb[1] + 200, `heiß blass gelbgrün: ${hot.name} ${hot.rgb}`);
  L.setTemp(l, "wb", 20);
  L.step(l, 300);
  assert.equal(look(l).color.name, "blue", "wieder kalt");
  // Iodlösung ohne Stärke ist gelb bis braun
  assert.ok(["yellow", "orange", "brown"].includes(look(tubeOf([{ reagent: "H2O", ml: 10 }, { reagent: "Lugol", drops: 5 }])).color.name));
});

test("Durchsicht, Meilenstein 5: kleinere Befunde im Rechenkern", () => {
  // Schwefelpulver in neutraler Thiosulfat-Lösung ist keine Trübung
  const powder = beaker([{ reagent: "Na2S2O3 0.16M", ml: 50 }], { room: 25 });
  L.add(powder, "b", "sulfur", { g: 0.5 });
  assert.deepEqual(keys(collect(powder, 30)).filter((k) => k === "solid" || k === "opaque"), []);
  // vor der Säure steht der Zerfall des Thiosulfats nicht bei den Gleichungen
  const calm = beaker([{ reagent: "Na2S2O3 0.16M", ml: 50 }], { room: 25 });
  L.step(calm, 200);
  assert.deepEqual(equations(calm).filter((eq) => /S\(s\)/.test(eq)), []);
  L.add(calm, "b", "HCl 2M", { ml: 5 });
  L.step(calm, 2);
  assert.ok(equations(calm).some((eq) => /S\(s\)/.test(eq)), "mit Säure schon nach zwei Sekunden");
  // ein Niederschlag neben Marmor: er löst sich mit Meldung und fällt mit Meldung wieder aus, ohne Rest
  const both = beaker([{ reagent: "CaCl2 0.1M", ml: 20 }], { room: 25 }), seen = [];
  L.add(both, "b", "marble", { g: 1 });
  L.add(both, "b", "Na2CO3 0.1M", { ml: 20 });
  L.step(both, 10, (e) => seen.push(e.key));
  L.add(both, "b", "HCl 1M", { ml: 10 });
  L.step(both, 20, (e) => seen.push(e.key));
  assert.deepEqual(L.vessel(both, "b").lumps.filter((x) => x.made).map((x) => x.n), [], "kein Rest des Niederschlags");
  L.add(both, "b", "Na2CO3 1M", { ml: 20 });
  L.step(both, 20, (e) => seen.push(e.key));
  assert.deepEqual(seen.filter((k) => k === "solid" || k === "dissolved"), ["solid", "dissolved", "solid"], seen.join());
  // dunkle Iodlösung heißt braun, nicht rot
  for (const drops of [20, 60, 150, 400]) {
    const name = look(beaker([{ reagent: "H2O", ml: 40 }, { reagent: "Lugol", drops }])).color.name;
    assert.ok(["yellow", "orange", "brown", "black"].includes(name), `${drops} Tropfen Iodlösung: ${name}`);
  }
  // Iod mit etwas Iod-Stärke ist so dunkel, dass von der Farbe nur ein tiefes Rot bleibt: das heißt braun
  for (const mix of [{ "I3-(aq)": 0.004, "C108H180O90I3-(aq)": 1e-6 }, { "I3-(aq)": 0.004, "C108H180O90I3-(aq)": 3e-6 }, { "I3-(aq)": 0.006 }])
    assert.equal(L.tint(mix, 5).name, "brown", JSON.stringify(mix) + " " + L.tint(mix, 5).rgb);
  assert.equal(L.tint({ "FeSCN^2+(aq)": 0.003 }, 5).name, "red", "ein kräftiges Rot bleibt rot");
  // mit einem Brei rechnet auch das Fotometer nicht
  const paste = beaker([{ reagent: "KMnO4 15M", ml: 5 }]);
  assert.equal(L.absorbance(paste, "b", 526), 0);
  assert.ok(L.spectrum(paste, "b").every((p) => p[1] === 0));
  assert.equal(L.particles(paste, "b").paste, true);
  // eingedampft: ein Rückstand
  const dry = heated({ type: "dish", contains: [{ reagent: "KNO3 1M", ml: 3 }] });
  L.step(dry, 400);
  assert.equal(L.particles(dry, "b").wet, false);
  assert.equal(L.particles(dry, "b").residue, true);
  // das Wasserbad hat kein Ende der Skala, und seine Temperatur ist eine ganze Zahl
  assert.equal(L.reading(bathed(water5, 95), "wb").over, false);
  assert.equal(L.reading(bathed(water5, null, 22.5), "wb").temp, 23);
  // der Weg der Teilchen wächst stetig, auch wenn sich die Temperatur nach langer Zeit ändert
  const l = bathed(water5, 80);
  L.step(l, 1800);
  const before = L.particles(l, "b").walk;
  near(before, 1800 * Math.sqrt(353.15 / 298.15), 30, "Weg nach einer halben Stunde bei 80 °C");
  L.setTemp(l, "wb", 0);
  let last = before;
  for (let i = 0; i < 200; i++) { L.step(l, 0.05); const now = L.particles(l, "b").walk; assert.ok(now - last > 0.04 && now - last < 0.06, `Schritt ${now - last}`); last = now; }
});

test("Durchsicht, Meilenstein 5: kleinere Befunde an Zeichnung und Oberfläche", () => {
  // das Wasserbad: der Thermostat liegt in der antippbaren Fläche; eine Schale steht nicht unter Wasser
  const l = bathed(water5, 50), stand = L.parts.bath.stand(L.vessel(l, "b")), hit = L.parts.bath.bounds(L.reading(l, "wb"), stand);
  const svg = L.parts.bath.draw(L.reading(l, "wb"), ctx(), stand), box = /class="cl-meter"><rect x="([-\d.]+)" y="([-\d.]+)" width="([\d.]+)" height="([\d.]+)"/.exec(svg).slice(1).map(Number);
  assert.ok(box[0] >= hit.x0 && box[0] + box[2] <= hit.x1 && box[1] >= hit.top && box[1] + box[3] <= hit.bottom, `Anzeige ${box} in der Fläche ${JSON.stringify(hit)}`);
  const dish = L.parts.bath.stand({ type: "dish" });
  assert.ok(dish.depth < 40 && L.parts.bath.stand({ type: "testtube" }).depth === 50, `Wasserstand an der Schale ${dish.depth}`);
  // das Fotometer: seine Anzeige steht links der Sonde, die Bürette hängt rechts
  for (const v of [{ type: "beaker", size: 100, cap: 100, ml: 0 }, { type: "beaker", size: 250, cap: 250, ml: 0 }, { type: "dish", cap: 50, ml: 0 }]) {
    const at = L.parts[v.type].probe(v, "photometer", 0), hang = L.parts[v.type].mount(v);
    assert.ok(at.x + at.box + 64 <= hang.x - 6, `${v.type} ${v.size || ""}: Anzeige bis ${at.x + at.box + 64}, Bürette bei ${hang.x}`);
  }
  assert.match(L.icon("photometer"), />λ</);
  // Schieber: Grenzen der Wellenlänge, und ohne Zahlen keine Nanometer
  const el = mount(kinetic);
  tap(el, "ph");
  enter(el, "change", "wave", "100");
  assert.match(logOf(el), /Fotometer 1: auf 380 nm gestellt/);
  assert.equal(state(el).run.lab.tools.find((t) => t.id === "ph").nm, 380);
  assert.equal(item(el, "wb").attributes["aria-label"], "Wasserbad 1 unter Reagenzglas 1: 40 °C");
  tap(el, "wb");
  enter(el, "change", "temp", "95");
  assert.equal(item(el, "wb").attributes["aria-label"], "Wasserbad 1 unter Reagenzglas 1: 95 °C", "am Ende des Schiebers ohne „>“");
  const quiet = mount(Object.assign({}, kinetic, { show: { numbers: false, charts: ["A"] } }));
  tap(quiet, "ph");
  assert.equal(part(quiet, ".cl-panel").querySelector(".cl-dial-shown").textContent, "");
  assert.doesNotMatch(part(quiet, ".cl-charts").innerHTML, /nm/);
  // Teilchenlupe: Brei und Rückstand werden benannt
  const thick = mount({ bench: [{ type: "beaker", id: "b", contains: [{ reagent: "NaOH 20M", ml: 5 }] }] });
  tap(thick, "b");
  press(thick, "lens");
  assert.match(part(thick, ".cl-panel").querySelector(".cl-lens").innerHTML, /ein Brei/);
  assert.doesNotMatch(part(thick, ".cl-panel").querySelector(".cl-lens").innerHTML, /So wenig gelöst/);
  // Stoffmengen: gezeigt werden die Teilchen mit der größten Änderung, nicht die ersten im Alphabet
  const clockEl = mount({ room: 25, bench: [{ type: "beaker", id: "b", contains: [{ reagent: "KI 0.2M", ml: 20 }, { reagent: "Na2S2O3 0.005M", ml: 10 }, { reagent: "starch", drops: 20 }] }], shelf: ["K2S2O8 0.1M"], show: { charts: ["n"] } });
  press(clockEl, "hand", "K2S2O8 0.1M");
  press(clockEl, "more"); press(clockEl, "more");
  tap(clockEl, "b");
  state(clockEl).speed = 5;
  frames(12);                                                  // bis nach dem Umschlag: nun haben sich auch Stärke und Iod-Stärke geändert
  const legend = part(clockEl, ".cl-charts").innerHTML;
  assert.ok(amount(state(clockEl).run.lab, "C108H180O90I3-(aq)") > 0);
  assert.match(legend, /S<sub>2<\/sub>O<sub>8<\/sub>/, "Peroxodisulfat");
  assert.match(legend, /S<sub>2<\/sub>O<sub>3<\/sub>/, "Thiosulfat");
  assert.doesNotMatch(legend, /Amylose/, "die Spur Stärke gehört nicht zu den sechs größten Änderungen");
  assert.equal(legend.match(/<li>/g).length, 6, "höchstens sechs Kurven");
});

test("Sofortige Reaktion, deren Ausgangsstoff nur aus der Luft kommt: sie läuft nicht ins Unendliche", () => {
  const before = L.db;
  try {
    L.register({ species: { "O3(g)": { name: { de: "Ozon" }, Hf: 142.7, src: "Probe" } }, reactions: [{ eq: "3 O2(g) -> 2 O3(g)", rate: { fast: true }, src: "Probe" }] });
    const l = beaker([{ reagent: "H2O", ml: 20 }], { room: 25 });
    L.step(l, 2);
    const v = L.vessel(l, "b");
    assert.ok(Object.values(v.n).concat(Object.values(v.air), Object.values(v.taken), Object.values(v.out)).every((n) => Number.isFinite(n)), "keine unendlichen Mengen");
    assert.ok(Number.isFinite(v.T));
  } finally { L.db = before; }
});

// ---------------------------------------------------------------- Befunde des zweiten Belastungstests, Meilenstein 5

test("Ruhe: in einer tiefdunklen Lösung zählt eine Änderung der Extinktion nicht, die niemand sehen oder messen könnte", () => {
  // Magnesium in konzentrierter Dichromat-Lösung reagiert unmerklich langsam; die Extinktion liegt bei mehreren Hundert und
  // schwankt dabei um mehr als ein Tausendstel. Die Uhr soll trotzdem anhalten.
  const l = tubeOf([{ reagent: "K2Cr2O7 2M", ml: 5 }, { reagent: "Mg ribbon", g: 0.07 }]);
  assert.ok(L.absorbance(l, "b", 400) > 100, "tiefdunkel bei 400 nm");
  const t = restAfter(l, 4000);
  assert.ok(t < 4000, "kommt zur Ruhe");
  // im messbaren Bereich gilt die Regel weiter
  const cv = beaker([{ reagent: "crystal violet", ml: 10 }], { room: 20 });
  L.add(cv, "b", "NaOH 0.1M", { ml: 2 });
  L.step(cv, 120);
  assert.equal(L.atRest(cv), false);
});

// ---------------------------------------------------------------- Nacharbeiten vor Meilenstein 6

test("Kupfersulfat-Lösung bleibt beim Erwärmen klar: das zweikernige Hydroxo-Ion macht sie in der Wärme saurer", () => {
  for (const conc of ["0.1", "0.5", "1"]) for (const temp of [60, 95]) {
    const l = lab([{ type: "beaker", id: "b", contains: [{ reagent: "CuSO4 " + conc + "M", ml: 40 }] }, { type: "bath", id: "wb", under: "b", temp }], { room: 20 });
    const seen = collect(l, 900);
    assert.deepEqual(keys(seen).filter((k) => k === "solid"), [], `${conc} mol/L bei ${temp} °C: kein Niederschlag`);
    assert.equal(L.vessel(l, "b").lumps.length, 0, `${conc} mol/L bei ${temp} °C: nichts Festes`);
    assert.equal(look(l).color.name, "blue");
    assert.equal(l.failed || 0, 0);
  }
  const cold = beaker([{ reagent: "CuSO4 0.5M", ml: 40 }], { room: 20 }), hot = beaker([{ reagent: "CuSO4 0.5M", ml: 40 }], { room: 80 });
  assert.ok(look(cold).pH > 3.9 && look(cold).pH < 4.75, `pH der kalten Lösung ${look(cold).pH}`);
  assert.ok(look(hot).pH < look(cold).pH - 0.4, `heiß saurer: pH ${look(hot).pH}`);
  assert.ok(amount(hot, "Cu2(OH)2^2+(aq)") > 5 * amount(cold, "Cu2(OH)2^2+(aq)") && amount(cold, "Cu2(OH)2^2+(aq)") > 0, "in der Wärme mehr vom zweikernigen Hydroxo-Ion");
  // mit Lauge fällt Kupferhydroxid weiter aus, und alles Kupfer bleibt Kupfer
  const base = beaker([{ reagent: "CuSO4 0.1M", ml: 20 }], { room: 25 }), before = totals(base);
  L.add(base, "b", "NaOH 1M", { ml: 5 });
  L.step(base, 30);
  near(amount(base, "Cu(OH)2(s)"), 0.002, 2e-5, "Kupferhydroxid mit Natronlauge");
  near(totals(base).charge, before.charge, 1e-12, "Ladung");
});

test("Iodlösung: verdünnt gelb, konzentriert dunkelbraun bis schwarz, aber nie leuchtend rot", () => {
  const iodine = (c, d) => L.tint({ "I3-(aq)": c }, d);
  assert.equal(iodine(1e-5, 5).name, "yellow", "sehr verdünnt");
  assert.ok(iodine(1e-5, 5).rgb[0] > 240 && iodine(1e-5, 5).rgb[1] > 200, "und hell: " + iodine(1e-5, 5).rgb);
  assert.ok(["yellow", "orange"].includes(iodine(2e-4, 5).name), "verdünnt: " + iodine(2e-4, 5).name);
  for (const c of [0.005, 0.01, 0.02, 0.05, 0.1]) {
    const t = iodine(c, 5);
    assert.ok(["brown", "black"].includes(t.name), `${c} mol/L im Becherglas: ${t.name} ${t.rgb}`);
    assert.ok(t.rgb[0] < 170, `${c} mol/L: dunkel (${t.rgb})`);
  }
  // die Tropfflasche mit Iod-Kaliumiodid-Lösung sieht braun aus
  const bottle = L.sample("Lugol");
  assert.ok(bottle[0] > bottle[1] && bottle[1] > bottle[2] && bottle[0] - bottle[2] > 100, "Farbe der Flasche: " + bottle);
  // die Ioduhr, eine Viertelstunde weiterlaufen gelassen: keine Meldung „rot“
  const { l } = clock(), seen = [];
  L.step(l, 900, (e) => seen.push(e));
  const words = seen.filter((e) => e.key === "color").map((e) => e.name);
  assert.ok(!words.includes("red"), "Farbwechsel nach dem Umschlag: " + words.join(", "));
  assert.ok(["brown", "black"].includes(look(l).color.name), "am Ende: " + look(l).color.name);
});

test("Katalysator zu einer hergeleiteten Redoxreaktion: der Weg aus dem Paket läuft zusätzlich; ohne Katalysator ersetzt ein Eintrag die hergeleitete", () => {
  const before = L.db, zinc = "Zn(s) + 2 H+(aq) -> Zn^2+(aq) + H2(g)";
  const run = () => { const l = tubeOf([{ reagent: "HCl 0.1M", ml: 10 }, { reagent: "Na2SO4 0.1M", ml: 2 }, { reagent: "Zn granules", g: 1 }]); L.step(l, 20); return l; };
  try {
    const plain = run(), base = dissolved(plain, "Zn");
    assert.ok(base > 0 && L.reactions(plain, "b").some((r) => r.eq === zinc && !r.catalysts.length), "die hergeleitete Reaktion läuft");
    // ein Weg mit Katalysator: er kommt dazu, die hergeleitete Reaktion bleibt
    L.register({ reactions: [{ eq: zinc, rate: { k: 2e-4, surface: "Zn(s)", order: { "H+(aq)": 1, "SO4^2-(aq)": 1 } }, src: "Probe" }] });
    const both = run(), list = L.reactions(both, "b").filter((r) => r.eq === zinc);
    assert.deepEqual(list.map((r) => r.catalysts.join()).sort(), ["", "SO4^2-(aq)"], "beide Wege stehen in der Liste");
    assert.ok(dissolved(both, "Zn") > 1.5 * base, `mit dem zweiten Weg schneller: ${dissolved(both, "Zn")} statt ${base} mol`);
    near(list.reduce((sum, r) => sum + r.extent, 0), dissolved(both, "Zn"), 1e-9, "zusammen ergeben sie das gelöste Zink");
    // derselbe Eintrag ohne Katalysator: er gilt statt der hergeleiteten Reaktion
    L.db = before;
    L.register({ reactions: [{ eq: zinc, rate: { k: 1e-9, surface: "Zn(s)", order: { "H+(aq)": 1 } }, src: "Probe" }] });
    const slow = run();
    assert.ok(dissolved(slow, "Zn") < 0.01 * base, `der eingetragene, langsame Weg ersetzt den hergeleiteten: ${dissolved(slow, "Zn")} mol`);
  } finally { L.db = before; }
});

test("Anzeigen der Messgeräte: in keinem Gefäß überdeckt eine die andere", () => {
  // Befund aus dem Browser: Im Becherglas lag die Anzeige des pH-Meters auf dem Rand der Thermometer-Anzeige.
  const gauges = ["thermometer", "phmeter", "conductometer", "photometer"];
  const reading = (type) => ({ type, value: type === "thermometer" ? 20 : type === "phmeter" ? 7 : 1, unit: L.parts[type].unit, nm: 525, over: false });
  // das Rechteck der Anzeige, aus der Zeichnung gelesen: beim Thermometer das Schild, sonst das Anzeigefeld
  const display = (type, place) => {
    const svg = L.parts[type].draw(reading(type), ctx(), place);
    const m = new RegExp('<g class="' + (type === "thermometer" ? "cl-tag" : "cl-meter") + '"><rect x="([-\\d.]+)" y="([-\\d.]+)" width="([\\d.]+)" height="([\\d.]+)"').exec(svg);
    assert.ok(m, type + " hat eine Anzeige");
    return { x0: +m[1], y0: +m[2], x1: +m[1] + +m[3], y1: +m[2] + +m[4] };
  };
  const vessels = [{ type: "testtube", cap: 20 }, { type: "dish", cap: 50 }].concat([50, 100, 250, 600].map((size) => ({ type: "beaker", size, cap: size })));
  for (const v of vessels) {
    const boxes = gauges.map((type) => display(type, L.parts[v.type].probe(v, type, 0)));
    for (let i = 0; i < boxes.length; i++) for (let j = i + 1; j < boxes.length; j++) {
      const a = boxes[i], b = boxes[j], apart = a.x1 + 3 <= b.x0 || b.x1 + 3 <= a.x0 || a.y1 + 3 <= b.y0 || b.y1 + 3 <= a.y0;
      assert.ok(apart, `${v.type} ${v.size || ""}: ${gauges[i]} ${JSON.stringify(a)} und ${gauges[j]} ${JSON.stringify(b)} überdecken sich`);
    }
  }
});

// ---------------------------------------------------------------- Redoxreaktionen in Lösung

const iron3 = (l, id) => ["Fe^3+(aq)", "FeOH^2+(aq)", "FeSCN^2+(aq)", "Fe(OH)3(s)"].reduce((sum, sp) => sum + amount(l, sp, id), 0);
const iron2 = (l, id) => ["Fe^2+(aq)", "FeOH+(aq)", "FeSO4(aq)", "Fe(OH)2(s)"].reduce((sum, sp) => sum + amount(l, sp, id), 0);
const iodine = (l, id) => amount(l, "I3-(aq)", id) + amount(l, "C108H180O90I3-(aq)", id) + amount(l, "I2(s)", id);

test("Permanganat und Eisen(II) in saurer Lösung: sofort und vollständig, fünf Eisen je Permanganat", () => {
  const l = beaker([{ reagent: "FeSO4 0.1M", ml: 10 }, { reagent: "H2SO4 1M", ml: 10 }], { room: 25 }), before = totals(l), seen = [];
  L.add(l, "b", "KMnO4 0.02M", { ml: 5 });
  L.step(l, 8, (e) => seen.push(e));
  assert.ok(amount(l, "MnO4-(aq)") < 1e-12, "das Permanganat ist verbraucht");
  near(amount(l, "Mn^2+(aq)"), 1e-4, 1e-9, "0,1 mmol Mangan(II)");
  near(iron3(l), 5e-4, 1e-9, "0,5 mmol Eisen(III)");
  near(iron2(l), 5e-4, 1e-9, "die andere Hälfte des Eisens ist noch Eisen(II)");
  assert.ok(!["pink", "violet"].includes(look(l).color.name), "entfärbt: " + look(l).color.name);
  assert.ok(equations(l).includes("MnO4-(aq) + 5 Fe^2+(aq) + 8 H+(aq) -> Mn^2+(aq) + 5 Fe^3+(aq) + 4 H2O(l)"), equations(l).join(" | "));
  L.add(l, "b", "KMnO4 0.02M", { ml: 6 });
  L.step(l, 8, (e) => seen.push(e));
  near(amount(l, "MnO4-(aq)"), 2e-5, 1e-9, "1 mL mehr als nötig: 0,02 mmol Permanganat bleiben");
  assert.ok(iron2(l) < 1e-10, "kein Eisen(II) mehr");
  // rosa vom Permanganat, mit dem Gelb des Eisen(III) zusammen ein Rot
  assert.ok(["pink", "violet", "red"].includes(look(l).color.name), "die Lösung bleibt gefärbt: " + look(l).color.name);
  assert.ok(L.absorbance(l, "b", 525) > 0.03, "bei 525 nm nimmt das Permanganat Licht weg");
  const added = 11 * (0.997 + 0.02 * (39.098 + 54.938 + 4 * 15.999) / 1000);
  near(totals(l).mass - before.mass, added, 0.02, "Masse: nur das Zugegebene kam dazu");
  near(totals(l).charge, before.charge, 1e-12, "Ladung");
  assert.equal(l.failed || 0, 0);
});

test("Redoxtitration: Eisen(II) mit Permanganat aus der Bürette – der erste bleibende Rosaton zeigt den Endpunkt", () => {
  const l = lab([{ type: "beaker", id: "b", ml: 250, contains: [{ reagent: "FeSO4 0.1M", ml: 10 }, { reagent: "H2SO4 1M", ml: 10 }, { reagent: "H2O", ml: 30 }] },
    { type: "burette", id: "bu", over: "b", contains: [{ reagent: "KMnO4 0.02M", ml: 25 }] }, { type: "photometer", id: "ph", in: "b", nm: 525 }], { room: 25 });
  L.setTap(l, "bu", 0.5);
  L.step(l, 10);
  assert.ok(L.reading(l, "ph").value < 0.02 && look(l).color.name !== "pink", "auf halbem Weg entfärbt sich jeder Tropfen: E " + L.reading(l, "ph").value);
  const seen = [];
  until(l, () => seen.some((e) => e.key === "color"), 100, seen);
  L.setTap(l, "bu", 0);
  // 1 mmol Eisen(II) braucht 0,2 mmol Permanganat: 10 mL. Rosa vom Permanganat und das Gelb des Eisen(III) geben zusammen ein Rot.
  assert.ok(["pink", "violet", "red", "orange"].includes(seen.find((e) => e.key === "color").name), "Farbe am Endpunkt: " + seen.find((e) => e.key === "color").name);
  near(look(l, "bu").given, 10, 0.8, "Verbrauch bis zum bleibenden Farbton in mL");
  L.step(l, 30);
  assert.ok(L.reading(l, "ph").value > 0.01, "das Fotometer zeigt das überschüssige Permanganat");
  assert.ok(L.atRest(l), "danach ruht das Labor");
});

test("Permanganat und Wasserstoffperoxid in saurer Lösung: Sauerstoff entsteht, die Lösung entfärbt sich", () => {
  const l = beaker([{ reagent: "KMnO4 0.02M", ml: 10 }, { reagent: "H2SO4 1M", ml: 5 }], { room: 25 }), seen = [];
  L.add(l, "b", "H2O2 0.1M", { ml: 5 });
  L.step(l, 10, (e) => seen.push(e));
  near(gasOf(l, "O2(g)"), 5e-4, 1e-9, "je Peroxid ein Sauerstoff: 0,5 mmol");
  near(amount(l, "Mn^2+(aq)"), 2e-4, 1e-9, "0,2 mmol Mangan(II)");
  assert.ok(amount(l, "MnO4-(aq)") < 1e-12 && amount(l, "H2O2(aq)") < 1e-12, "beide genau verbraucht");
  assert.ok(keys(seen).includes("gas"), "Gasblasen");
  assert.equal(look(l).color.name, "colorless");
});

test("Kupfer(II) und Iodid: weißes Kupfer(I)-iodid fällt aus, Iod färbt die Lösung braun; mit Thiosulfat lässt sich das Iod titrieren", () => {
  const l = beaker([{ reagent: "CuSO4 0.1M", ml: 10 }], { room: 25 }), before = totals(l), seen = [];
  L.add(l, "b", "KI 1M", { ml: 10 });
  L.step(l, 15, (e) => seen.push(e));
  // bis auf gut ein Tausendstel: so weit reicht das Gleichgewicht, und das Sulfat hält etwas Kupfer(II) als Ionenpaar fest
  near(amount(l, "CuI(s)"), 1e-3, 2e-6, "praktisch alles Kupfer als Kupfer(I)-iodid");
  near(iodine(l), amount(l, "CuI(s)") / 2, 1e-9, "je zwei Kupfer ein Iod");
  assert.ok(seen.some((e) => e.key === "solid" && e.species === "CuI(s)"), keys(seen).join());
  assert.ok(["brown", "orange", "black"].includes(look(l).color.name), "Iod: " + look(l).color.name);
  assert.ok(amount(l, "Cu^2+(aq)") + amount(l, "CuSO4(aq)") < 2e-6, "nur noch ein Rest Kupfer(II) in Lösung");
  near(totals(l).charge, before.charge, 1e-12, "Ladung");
  L.add(l, "b", "Na2S2O3 0.1M", { ml: 10 });
  L.step(l, 15);
  assert.ok(iodine(l) < 1e-10, "1 mmol Thiosulfat nimmt das Iod genau weg");
  assert.equal(look(l).color.name, "colorless", "die Lösung ist entfärbt");
  assert.ok(look(l).cloud.alpha + look(l).sediment.ml > 0, "das Kupfer(I)-iodid bleibt");
});

test("Eisen(III) und Iodid: Iod entsteht, Eisen(II) bleibt zurück", () => {
  const l = beaker([{ reagent: "FeCl3 0.1M", ml: 10 }, { reagent: "HCl 0.1M", ml: 5 }], { room: 25 });
  L.add(l, "b", "KI 0.5M", { ml: 10 });
  L.step(l, 15);
  // mit Iodid im Überschuss praktisch vollständig: das Gleichgewicht lässt weniger als ein Tausendstel Eisen(III) übrig
  near(iron2(l), 1e-3, 1e-6, "praktisch alles Eisen ist Eisen(II)");
  near(iodine(l), iron2(l) / 2, 1e-9, "je zwei Eisen ein Iod");
  assert.ok(iron3(l) > 1e-9 && iron3(l) < 1e-6, `ein kleiner Rest Eisen(III): ${iron3(l)} mol`);
  assert.ok(["brown", "orange", "black"].includes(look(l).color.name), look(l).color.name);
});

test("Permanganat und Eisen(II) ohne Säure: die Reaktion läuft, Eisen(III)-hydroxid fällt aus, nichts geht verloren", () => {
  const l = beaker([{ reagent: "FeSO4 0.1M", ml: 20 }], { room: 25 }), before = totals(l);
  L.add(l, "b", "KMnO4 0.02M", { ml: 10 });
  L.step(l, 60);
  assert.ok(amount(l, "MnO4-(aq)") < 1e-9, `Permanganat verbraucht (${amount(l, "MnO4-(aq)")} mol übrig)`);
  assert.ok(amount(l, "Fe(OH)3(s)") > 1e-4, "braunes Eisen(III)-hydroxid");
  assert.ok(look(l).pH < 5, `die Lösung wird dabei sauer: pH ${look(l).pH}`);
  near(totals(l).charge, before.charge, 1e-12, "Ladung");
  near(iron2(l) + iron3(l), 0.002, 1e-9, "alles Eisen ist noch da");
  assert.equal(l.failed || 0, 0);
});

test("Fotometrische Titration: mit Bürette und Fotometer zeichnet das Diagramm die Extinktion über der Zugabe", () => {
  const el = mount({ room: 25, bench: [{ type: "beaker", id: "b", ml: 250, contains: [{ reagent: "FeSO4 0.1M", ml: 10 }, { reagent: "H2SO4 1M", ml: 10 }, { reagent: "H2O", ml: 30 }] },
    { type: "burette", id: "bu", over: "b", contains: [{ reagent: "KMnO4 0.02M", ml: 25 }] }, { type: "photometer", id: "ph", in: "b", nm: 525 }], show: { charts: ["titration"] } });
  tap(el, "bu");
  press(el, "tap", "0.5");
  state(el).speed = 5;
  frames(6);
  const charts = part(el, ".cl-charts").innerHTML;
  assert.match(charts, /Fotometrische Titration/);
  assert.match(charts, /Zugabe in mL/);
  assert.match(charts, /Fotometer 1 · Bürette 1/);
  const run = state(el).run, curve = L.curve(run, { burette: "bu", tool: "ph" });
  const at = (ml) => curve.reduce((best, p) => (Math.abs(p[0] - ml) < Math.abs(best[0] - ml) ? p : best))[1];
  assert.ok(at(5) < 0.01 && at(9) < 0.01, `vor dem Endpunkt keine Extinktion: ${at(5)}, ${at(9)}`);
  assert.ok(at(12) > 0.05 && at(14) > 1.8 * at(12) - 0.02, `danach wächst sie mit jedem Milliliter: ${at(12)}, ${at(14)}`);
});

test("README: die Folie zur Redoxtitration hält, was ihr Text verspricht", () => {
  const readme = fs.readFileSync(new URL("README.md", here), "utf8"), at = readme.indexOf("\n## Redoxtitration\n");
  assert.ok(at > 0, "Folie Redoxtitration");
  const config = L.normalize(/```+ *json +@ChemLab\.sim\n([\s\S]*?)\n```+/.exec(readme.slice(at))[1]), l = L.createLab(config);
  const beakerId = config.bench.find((p) => p.type === "beaker").id, burette = config.bench.find((p) => p.type === "burette").id, photometer = config.bench.find((p) => p.type === "photometer").id;
  assert.ok(L.atRest(l), "vor dem Öffnen des Hahns geschieht nichts");
  L.setTap(l, burette, 0.5);
  until(l, () => L.reading(l, photometer).value > 0.02, 100);
  L.setTap(l, burette, 0);
  near(look(l, burette).given, 10, 0.8, "Verbrauch bis zum Endpunkt in mL");
  for (const id of ["H2O2 0.1M", "CuSO4 0.1M", "KI 1M", "Na2S2O3 0.1M", "starch"]) assert.ok(config.shelf.includes(id), id + " steht im Regal");
  // die weiteren Paare aus dem Text, mit den Stoffen des Regals
  const other = L.createLab(L.normalize({ room: 20, bench: [{ type: "beaker", id: "b", contains: [{ reagent: "CuSO4 0.1M", ml: 10 }] }] }));
  L.add(other, "b", "KI 1M", { ml: 5 });
  L.add(other, "b", "starch", { drops: 20 });
  L.step(other, 20);
  assert.ok(["blue", "black", "violet"].includes(look(other, "b").color.name), "Iod mit Stärke: " + look(other, "b").color.name);
  L.add(other, "b", "Na2S2O3 0.1M", { ml: 10 });
  L.step(other, 20);
  assert.equal(look(other, "b").color.name, "colorless", "mit Thiosulfat entfärbt");
});

test("Mehrere Messgeräte in einem Glas: die längeren Sonden werden zuerst gezeichnet, damit kein Stab vor einer Anzeige steht", () => {
  const el = mount({ bench: [{ type: "beaker", id: "b", contains: [{ reagent: "NaCl 0.1M", ml: 60 }] }, { type: "phmeter", id: "p", in: "b" }, { type: "thermometer", id: "t", in: "b" },
    { type: "conductometer", id: "k", in: "b" }, { type: "photometer", id: "f", in: "b" }, { type: "beaker", id: "c" }, { type: "phmeter", id: "p2", in: "c" }, { type: "photometer", id: "f2", in: "c" }] });
  const svg = part(el, ".cl-svg").innerHTML, at = (id) => svg.indexOf(`data-id="${id}"`);
  assert.ok(at("f") < at("k") && at("k") < at("t") && at("t") < at("p"), "Fotometer, Leitfähigkeit, Thermometer, pH-Meter: von der längsten Sonde zur kürzesten");
  assert.ok(at("f2") < at("p2"), "auch im zweiten Glas");
  assert.ok(at("b") < at("f") && at("c") < at("f2"), "die Gefäße kommen vor ihren Sonden");
  // auch wenn die Sonden zweier Gläser durcheinander aufgestellt wurden
  const mixed = mount({ bench: [{ type: "beaker", id: "b" }, { type: "beaker", id: "c" }, { type: "phmeter", id: "p", in: "b" }, { type: "phmeter", id: "p2", in: "c" },
    { type: "thermometer", id: "t", in: "b" }, { type: "photometer", id: "f2", in: "c" }, { type: "conductometer", id: "k", in: "b" }, { type: "thermometer", id: "t2", in: "c" }, { type: "photometer", id: "f", in: "b" }] });
  const order = part(mixed, ".cl-svg").innerHTML, pos = (id) => order.indexOf(`data-id="${id}"`);
  assert.ok(pos("f") < pos("k") && pos("k") < pos("t") && pos("t") < pos("p"), "erstes Glas");
  assert.ok(pos("f2") < pos("t2") && pos("t2") < pos("p2"), "zweites Glas");
  // was vor einer Anzeige stehen könnte, ist immer eine längere Sonde: ihr Stab kreuzt die Anzeige der kürzeren
  for (const v of [{ type: "testtube", cap: 20 }, { type: "dish", cap: 50 }, { type: "beaker", size: 100, cap: 100 }]) {
    const places = ["thermometer", "phmeter", "conductometer", "photometer"].map((type) => ({ type, p: L.parts[v.type].probe(v, type, 0) }));
    for (const a of places) for (const b of places) {
      if (a === b || b.type === "thermometer") continue;
      const box = { x0: b.p.x + (b.p.box == null ? 4 : b.p.box), x1: b.p.x + (b.p.box == null ? 4 : b.p.box) + 74, y0: b.p.top - 34, y1: b.p.top - 14 };
      const crosses = a.p.x + 4 > box.x0 && a.p.x - 4 < box.x1 && a.p.top < box.y1;
      if (crosses) assert.ok(a.p.top < b.p.top, `${v.type}: der Stab von ${a.type} kreuzt die Anzeige von ${b.type} und muss deshalb vor ihr gezeichnet sein`);
    }
  }
});

// ---------------------------------------------------------------- Befunde des Belastungstests nach den Redoxreaktionen

test("Sofortige Redoxreaktion hört beim Gleichgewicht auf: Silberiodid bleibt neben Eisen(III) und Kupfer(II) liegen", () => {
  for (const oxidant of ["FeCl3 0.1M", "CuSO4 0.1M"]) {
    const l = beaker([{ reagent: "AgNO3 0.1M", ml: 5 }, { reagent: "KI 0.1M", ml: 5 }], { room: 25 });
    const solid = amount(l, "AgI(s)");
    near(solid, 5e-4, 1e-7, "Silberiodid ist ausgefallen");
    L.add(l, "b", oxidant, { ml: 5 });
    L.step(l, 1200);
    // Iodid gibt es hier nur in Spuren, so viel wie das Silberiodid in Lösung lässt. Dafür reicht das Oxidationsvermögen nicht:
    // das Gleichgewicht liegt bei Spuren von Iod, und das Silberiodid löst sich nicht nach und nach auf.
    near(amount(l, "AgI(s)"), solid, 2e-7, oxidant + ": das Silberiodid ist noch da");
    assert.ok(iodine(l) < 1e-7, `${oxidant}: höchstens eine Spur Iod (${iodine(l)} mol)`);
    assert.ok(L.atRest(l), oxidant + ": das Glas kommt zur Ruhe");
    assert.equal(l.failed || 0, 0);
  }
});

test("Eisen(III) und Iodid im Gleichgewicht: verdünnt und ohne Überschuss bleibt ein Rest, wie es die Standardpotentiale verlangen", () => {
  const l = beaker([{ reagent: "FeCl3 0.01M", ml: 10 }, { reagent: "HCl 0.1M", ml: 5 }], { room: 25 }), before = totals(l);
  L.add(l, "b", "KI 0.01M", { ml: 10 });
  L.step(l, 15);
  const c = (id) => amount(l, id) / (look(l).ml / 1000);
  const logQ = 2 * Math.log10(c("Fe^2+(aq)")) + Math.log10(c("I3-(aq)")) - 2 * Math.log10(c("Fe^3+(aq)")) - 3 * Math.log10(c("I-(aq)"));
  near(logQ, 7.77, 0.05, "Massenwirkungsgesetz: lg K = 2 · (0,770 V − 0,5405 V) / 0,05916 V");
  assert.ok(amount(l, "I-(aq)") > 2e-6 && amount(l, "I-(aq)") < 2e-5, `ein Rest Iodid bleibt: ${amount(l, "I-(aq)")} mol`);
  assert.ok(iodine(l) > 2.5e-5, `das meiste hat reagiert: ${iodine(l)} mol Iod`);
  near(totals(l).charge, before.charge, 1e-12, "Ladung");
  assert.ok(restAfter(l, 600) < 600, "danach kommt das Glas zur Ruhe");
  // Kupfer(II) und Iodid: der Feststoff zählt im Quotienten nicht mit
  const cu = beaker([{ reagent: "CuSO4 0.1M", ml: 10 }], { room: 25 });
  L.add(cu, "b", "KI 0.1M", { ml: 10 });
  L.step(cu, 15);
  const k = (id) => amount(cu, id) / (look(cu).ml / 1000);
  near(Math.log10(k("I3-(aq)")) - 2 * Math.log10(k("Cu^2+(aq)")) - 5 * Math.log10(k("I-(aq)")), 11.17, 0.05, "Kupfer(II) und Iodid: lg K = 11,17");
  assert.ok(amount(cu, "CuI(s)") > 1e-4 && amount(cu, "CuI(s)") < 3.9e-4, `mit zu wenig Iodid bleibt Kupfer(II) übrig: ${amount(cu, "CuI(s)")} mol Kupfer(I)-iodid`);
});

test("Viele Niederschläge zugleich: ein Feststoff, dem zum Auflösen ein Baustein fehlt, bleibt liegen (Iod ohne Iodid)", () => {
  // Iod löst sich hier nur mit Iodid, als Triiodid. Liegt es neben Niederschlägen, die nicht alle nebeneinander bestehen können,
  // muss einer von ihnen weichen – aber nicht das Iod: ohne Iodid kann es nicht in Lösung gehen.
  for (const iodine of [1e-6, 1e-8]) {
    const mud = lab([{ type: "beaker", id: "b", ml: 250 }], { room: 28 }), glass = L.vessel(mud, "b");
    glass.n = { "Cu(OH)2(s)": 2e-5, "CaCO3(s)": 0.00101, "CaSO4*2H2O(s)": 0.0000753, "Ca(OH)2(s)": 3e-5, "CuCO3(s)": 1e-5, "H2O(l)": 0.0609, "BaSO4(s)": 0.00000875, "BaCO3(s)": 4e-6, "I2(s)": iodine };
    glass.lumps = Object.keys(glass.n).filter((id) => /\(s\)$/.test(id)).map((id) => ({ id, n: glass.n[id], n0: glass.n[id], a0: 1, p: 2 / 3, made: true, settled: 1 }));
    glass.dirty = true;
    L.step(mud, 600);
    near(totals(mud).charge, 0, 1e-12, "Ladung entsteht nicht aus dem Nichts");
    near(amount(mud, "I2(s)"), iodine, 1e-12, "das Iod liegt noch da");
    assert.ok(amount(mud, "I3-(aq)") < 1e-12, "kein Triiodid ohne Iodid");
    assert.equal(mud.failed || 0, 0, "jedes Gleichgewicht ließ sich berechnen");
    assert.deepEqual(settled(mud).filter((line) => !line.startsWith("I2(s)")), [], "die übrigen Feststoffe stehen im Gleichgewicht");
  }
});

test("Ruhe: eine sofortige Reaktion, der ein Ausgangsstoff fast fehlt, hält die Uhr nicht an", () => {
  // Permanganat und Eisen(II) brauchen Säure. In Soda-Lösung oder Ammoniak gibt es nur Spuren von H+, die das Wasser nachliefert:
  // der Umsatz bleibt unmerklich klein (weit unter einem Milliardstel Mol je Sekunde).
  for (const base of ["Na2CO3 0.1M", "NH3 0.1M"]) {
    const l = beaker([{ reagent: "KMnO4 0.02M", ml: 10 }, { reagent: base, ml: 10 }], { room: 25 });
    L.add(l, "b", "FeSO4 0.01M", { ml: 2 });
    const t = restAfter(l, 3000);
    assert.ok(t < 3000, base + ": kommt zur Ruhe");
    assert.ok(2e-4 - amount(l, "MnO4-(aq)") < 1e-8, base + ": bis dahin ist kaum Permanganat verbraucht");
    assert.equal(l.failed || 0, 0);
  }
});

test("Daten: logK gibt es nur für sofortige Reaktionen, und nur als Zahl", () => {
  const before = L.db, eq = "2 Fe^3+(aq) + 2 Br-(aq) -> 2 Fe^2+(aq) + Br2(aq)";
  try {
    assert.throws(() => L.register({ reactions: [{ eq, rate: { k: 1, order: { "Fe^3+(aq)": 1 } }, logK: 3, src: "Probe" }] }), (e) => e.code === "data" && /logK/.test(e.message));
    assert.throws(() => L.register({ reactions: [{ eq, rate: { fast: true }, logK: "3", src: "Probe" }] }), (e) => e.code === "data" && /logK/.test(e.message));
    L.register({ reactions: [{ eq, rate: { fast: true }, logK: -10, src: "Probe" }] });
    // lg K = −10: aus je 0,05 mol/L wird nur eine Spur
    const l = beaker([{ reagent: "FeCl3 0.1M", ml: 10 }, { reagent: "KBr 0.1M", ml: 10 }], { room: 25 });
    L.step(l, 5);
    const made = amount(l, "Br2(aq)");
    assert.ok(made > 1e-9 && made < 1e-6, `eine Spur Brom: ${made} mol`);
  } finally { L.db = before; }
});

// ================================================================ Reales Modell: Aktivitäten statt Konzentrationen

const real = (contains, more) => beaker(contains, Object.assign({ room: 25, model: "real" }, more));
// Aktivität eines gelösten Teilchens: Konzentration mal Aktivitätskoeffizient
const act = (l, sp, id) => { const v = L.vessel(l, id || "b"); return (v.n[sp] || 0) / L.volume(v) * L.gamma(l, v.id, sp); };
// mittlerer Aktivitätskoeffizient eines Salzes, wie er in den Tabellen steht: geometrisches Mittel über seine Ionen
const meanGamma = (l, ions) => {
  let lg = 0, n = 0;
  for (const [id, nu] of ions) { lg += nu * Math.log10(L.gamma(l, "b", id)); n += nu; }
  return 10 ** (lg / n);
};

test("Aufbau: das Rechenmodell ist ideal oder real, ohne Angabe ideal", () => {
  assert.equal(L.normalize({ bench: [] }).model, "ideal");
  assert.equal(L.normalize({ bench: [], model: "real" }).model, "real");
  assert.equal(L.normalize({ bench: [], model: "ideal" }).model, "ideal");
  assert.throws(() => L.normalize({ bench: [], model: "echt" }), (e) => e.code === "model" && e.detail === "echt");
  assert.ok(L.text("err.model", "de").length > 10 && L.text("err.model", "en").length > 10);
  assert.match(mount({ bench: [], model: "echt" }).innerHTML, /Rechenmodell.*echt/);
  const l = real([{ reagent: "NaCl 0.1M", ml: 20 }]), ideal = beaker([{ reagent: "NaCl 0.1M", ml: 20 }], { room: 25 });
  assert.equal(l.model, "real");
  assert.equal(ideal.model, "ideal");
  // im idealen Modell ist jeder Aktivitätskoeffizient 1, und eine Ionenstärke wird nicht angegeben
  assert.equal(L.gamma(ideal, "b", "Na+(aq)"), 1);
  // einen Aktivitätskoeffizienten haben nur gelöste Teilchen
  for (const id of ["AgCl(s)", "H2O(l)", "CO2(g)", "gibt es nicht"]) assert.equal(L.gamma(l, "b", id), 1, id);
  assert.equal(L.gamma(l, "fehlt", "Na+(aq)"), 1, "ohne Gefäß");
  assert.equal(look(ideal).strength, null);
  near(look(l).strength, 0.1, 1e-6, "Ionenstärke von Kochsalzlösung 0,1 mol/L");
  near(look(real([{ reagent: "CaCl2 0.1M", ml: 20 }])).strength, 0.3, 1e-6, "zweiwertige Ionen zählen vierfach");
  // das Modell gehört zum Labor: es bleibt beim Zurückspulen erhalten
  const run = L.createRun(L.normalize({ room: 25, model: "real", bench: [{ type: "beaker", id: "b", contains: [{ reagent: "HCl 0.1M", ml: 20 }] }] }));
  L.advance(run, 2);
  L.toStart(run);
  near(L.view(run.lab, L.vessel(run.lab, "b")).pH, 1.083, 0.01, "nach dem Zurückspulen rechnet es weiter real");
});

test("Reales Modell: Aktivitätskoeffizienten wie in den Tabellen", () => {
  const one = [["Na+(aq)", 1], ["Cl-(aq)", 1]];
  near(meanGamma(real([{ reagent: "NaCl 0.001M", ml: 20 }]), one), 0.965, 0.003, "Kochsalz 0,001 mol/L");
  near(meanGamma(real([{ reagent: "NaCl 0.1M", ml: 20 }]), one), 0.778, 0.008, "Kochsalz 0,1 mol/L");
  near(meanGamma(real([{ reagent: "NaCl 1M", ml: 20 }]), one), 0.657, 0.02, "Kochsalz 1 mol/L");
  near(meanGamma(real([{ reagent: "HCl 0.1M", ml: 20 }]), [["H+(aq)", 1], ["Cl-(aq)", 1]]), 0.796, 0.008, "Salzsäure 0,1 mol/L");
  near(meanGamma(real([{ reagent: "CaCl2 0.1M", ml: 20 }]), [["Ca^2+(aq)", 1], ["Cl-(aq)", 2]]), 0.518, 0.008, "Calciumchlorid 0,1 mol/L");
  // ein Ion ohne eigene Parameter rechnet nach Davies: Silbernitrat 0,1 mol/L steht mit 0,734 in den Tabellen
  near(meanGamma(real([{ reagent: "AgNO3 0.1M", ml: 20 }]), [["Ag+(aq)", 1], ["NO3-(aq)", 1]]), 0.734, 0.04, "Silbernitrat 0,1 mol/L");
  // ungeladene Teilchen: lg γ = 0,1 · I
  near(L.gamma(real([{ reagent: "NaCl 2M", ml: 10 }, { reagent: "sugar 0.1M", ml: 10 }]), "b", "C12H22O11(aq)"), 10 ** 0.1, 0.005, "Zucker in Kochsalzlösung 1 mol/L");
  // gelöstes Kohlenstoffdioxid hat ein eigenes Zusatzglied (0,066 statt 0,1)
  near(L.gamma(real([{ reagent: "NaCl 2M", ml: 10 }, { reagent: "H2O", ml: 10 }]), "b", "CO2(aq)"), 10 ** 0.066, 0.003, "Kohlenstoffdioxid in Kochsalzlösung 1 mol/L");
  // die Gleichung von Davies gilt bis 0,5 mol/L; darüber bleibt der Koeffizient eines Ions ohne eigene Parameter stehen
  const half = real([{ reagent: "NaCl 2M", ml: 5 }, { reagent: "H2O", ml: 15 }]), two = real([{ reagent: "NaCl 2M", ml: 20 }]);
  near(look(half).strength, 0.5, 1e-6);
  assert.equal(L.gamma(two, "b", "Ag+(aq)"), L.gamma(half, "b", "Ag+(aq)"), "Silber-Ion nach Davies");
  assert.ok(L.gamma(two, "b", "Na+(aq)") !== L.gamma(half, "b", "Na+(aq)"), "Natrium-Ion mit eigenen Parametern");
  // in der Wärme sinkt die Dielektrizitätszahl des Wassers: die Ionen spüren einander stärker
  const warm = meanGamma(real([{ reagent: "NaCl 0.1M", ml: 20 }], { room: 60 }), one), cold = meanGamma(real([{ reagent: "NaCl 0.1M", ml: 20 }], { room: 5 }), one);
  assert.ok(warm < 0.768 && cold > 0.779, `bei 60 °C ${warm}, bei 5 °C ${cold}`);
  // über 6 mol/L Ionenstärke bleiben die Koeffizienten stehen: so weit reichen die Parameter
  const strong = real([{ reagent: "NaCl 2M", ml: 5 }, { reagent: "HCl 12M", ml: 15 }]), stronger = real([{ reagent: "NaCl 2M", ml: 2 }, { reagent: "HCl 12M", ml: 18 }]);
  assert.ok(look(strong).strength > 9 && look(stronger).strength > look(strong).strength + 1);
  assert.equal(L.gamma(strong, "b", "Na+(aq)"), L.gamma(stronger, "b", "Na+(aq)"));
});

test("Reales Modell: der pH-Wert ist der negative Logarithmus der Aktivität", () => {
  near(look(real([{ reagent: "HCl 0.1M", ml: 20 }])).pH, 1.09, 0.012, "Salzsäure 0,1 mol/L");
  near(look(real([{ reagent: "HCl 0.01M", ml: 20 }])).pH, 2.04, 0.008, "Salzsäure 0,01 mol/L");
  near(look(real([{ reagent: "NaOH 0.1M", ml: 20 }])).pH, 12.88, 0.015, "Natronlauge 0,1 mol/L");
  near(look(real([{ reagent: "H2O", ml: 20 }])).pH, 7, 0.002, "reines Wasser");
  // Eichlösungen: Acetatpuffer 0,1/0,1 mol/L und Carbonatpuffer 0,025/0,025 mol/L (pH 10,012 bei 25 °C)
  near(look(real([{ reagent: "CH3COOH 0.2M", ml: 10 }, { reagent: "CH3COONa 0.2M", ml: 10 }])).pH, 4.65, 0.015, "Acetatpuffer");
  near(look(real([{ reagent: "NaHCO3 0.05M", ml: 10 }, { reagent: "Na2CO3 0.05M", ml: 10 }])).pH, 10.012, 0.01, "Carbonatpuffer");
  // dieselben Lösungen im idealen Modell: die Lehrbuchwerte
  near(look(beaker([{ reagent: "HCl 0.1M", ml: 20 }], { room: 25 })).pH, 1, 1e-6, "ideal: pH 1");
  near(look(beaker([{ reagent: "CH3COOH 0.2M", ml: 10 }, { reagent: "CH3COONa 0.2M", ml: 10 }], { room: 25 })).pH, 4.757, 0.002, "ideal: pH = pKs");
  // das pH-Meter zeigt, was das Gefäß angibt
  const l = lab([{ type: "beaker", id: "b", contains: [{ reagent: "HCl 0.1M", ml: 20 }] }, { type: "phmeter", id: "p", in: "b" }], { room: 25, model: "real" });
  L.step(l, 10);
  near(L.reading(l, "p").value, look(l).pH, 0.005, "pH-Meter");
  near(L.reading(l, "p").value, 1.083, 0.01);
});

test("Reales Modell: das Massenwirkungsgesetz gilt für die Aktivitäten", () => {
  const l = real([{ reagent: "CH3COOH 0.1M", ml: 10 }, { reagent: "NaCl 1M", ml: 10 }]);
  near(Math.log10(act(l, "H+(aq)")) + Math.log10(act(l, "CH3COO-(aq)")) - Math.log10(act(l, "CH3COOH(aq)")), -4.757, 1e-6, "Essigsäure");
  near(Math.log10(act(l, "H+(aq)")) + Math.log10(act(l, "OH-(aq)")), -14, 1e-6, "Wasser");
  // auch in der Wärme: die Konstante bei 60 °C nach van 't Hoff, die Koeffizienten bei 60 °C
  const warm = real([{ reagent: "CH3COOH 0.1M", ml: 10 }, { reagent: "NaCl 1M", ml: 10 }], { room: 60 });
  const acid = L.db.equilibria.find((e) => e.text === "CH3COOH(aq) <=> H+(aq) + CH3COO-(aq)"), h = L.heatOf(acid.text);
  assert.equal(typeof h, "number", "Reaktionsenthalpie der Essigsäure");
  const logK60 = acid.logK - h * 1000 / (8.314462618 * Math.LN10) * (1 / 333.15 - 1 / 298.15);
  near(Math.log10(act(warm, "H+(aq)")) + Math.log10(act(warm, "CH3COO-(aq)")) - Math.log10(act(warm, "CH3COOH(aq)")), logK60, 1e-6, "Essigsäure bei 60 °C");
  // Salz macht die schwache Säure stärker: mit Kochsalz ist mehr von ihr zerfallen als ohne
  const plain = real([{ reagent: "CH3COOH 0.1M", ml: 10 }, { reagent: "H2O", ml: 10 }]);
  assert.ok(amount(l, "H+(aq)") > 1.2 * amount(plain, "H+(aq)"), `${amount(l, "H+(aq)")} gegen ${amount(plain, "H+(aq)")} mol`);
  // im idealen Modell ändert das Salz nichts
  const a = beaker([{ reagent: "CH3COOH 0.1M", ml: 10 }, { reagent: "NaCl 1M", ml: 10 }], { room: 25 }), b = beaker([{ reagent: "CH3COOH 0.1M", ml: 10 }, { reagent: "H2O", ml: 10 }], { room: 25 });
  near(amount(a, "H+(aq)") / amount(b, "H+(aq)"), 1, 0.01, "ideal");
  assert.equal(l.failed || 0, 0);
});

test("Reales Modell: ein fremdes Salz erhöht die Löslichkeit (Silberchlorid in Kaliumnitrat-Lösung)", () => {
  const silver = (model, reagent) => {
    const l = beaker([{ reagent: "AgNO3 0.01M", ml: 10 }, { reagent: "NaCl 0.01M", ml: 10 }, { reagent, ml: 20 }], { room: 25, model });
    L.step(l, 300);
    assert.equal(l.failed || 0, 0);
    return l;
  };
  const salt = silver("real", "KNO3 0.2M"), water = silver("real", "H2O"), c = (l) => amount(l, "Ag+(aq)") / (look(l).ml / 1000);
  near(c(salt), 1.72e-5, 0.05e-5, "in Kaliumnitrat 0,1 mol/L");
  near(c(water), 1.41e-5, 0.03e-5, "fast ohne fremdes Salz");
  near(Math.log10(act(salt, "Ag+(aq)")) + Math.log10(act(salt, "Cl-(aq)")), -9.75, 0.002, "das Produkt der Aktivitäten ist das Löslichkeitsprodukt");
  near(c(silver("ideal", "KNO3 0.2M")), 1.333e-5, 0.01e-5, "ideal: das Salz ändert nichts");
  assert.ok(L.atRest(salt), "danach ruht das Glas");
});

test("Reales Modell: Masse und Ladung bleiben erhalten, und eine Lösung verdampft ohne Rest", () => {
  const l = real([{ reagent: "CuSO4 0.5M", ml: 10 }, { reagent: "CaCl2 1M", ml: 5 }]), before = totals(l);
  L.add(l, "b", "NaOH 1M", { ml: 6 });
  L.add(l, "b", "Na2CO3 1M", { ml: 4 });
  L.step(l, 120);
  const added = 10 * 0.997 + 0.006 * (22.99 + 17.007) + 0.004 * (2 * 22.99 + 60.008);
  near(totals(l).mass - before.mass, added, 0.01, "Masse");
  near(totals(l).charge, before.charge, 1e-12, "Ladung");
  assert.ok(amount(l, "Cu(OH)2(s)") + amount(l, "CuCO3(s)") > 1e-3 && amount(l, "CaCO3(s)") > 1e-3, "Niederschläge");
  assert.equal(l.failed || 0, 0);
  // Ammoniak-Lösung über dem Brenner: bleibt die Ladungsbilanz nicht genau, steht am Ende ein Rest Ammonium ohne Gegenion im Glas
  const tube = heated({ type: "testtube", contains: [{ reagent: "NH3 1M", ml: 5 }] }, { model: "real" }), seen = collect(tube, 300);
  const dry = seen.find((e) => e.key === "dry");
  assert.ok(dry && dry.left === false, "kein fester Rückstand");
  assert.deepEqual(Object.keys(L.vessel(tube, "b").n), []);
  assert.equal(tube.failed || 0, 0);
});

test("Reales Modell: Lösung auf einem heißen Rückstand lässt sich berechnen", () => {
  // Cobaltchlorid, Zinksulfat und Kochsalz eingedampft, dann fließt Kupfersulfat-Lösung darauf. Die ersten Tropfen geben eine
  // Lösung mit sehr kleinen Aktivitätskoeffizienten. Die Probe, ob alle Salze des Rückstands zugleich gesättigt sein können,
  // verlangte Konzentrationen über 1000 mol/L; der Löser nimmt die Salze deshalb einzeln hinzu.
  const l = lab([{ type: "testtube", id: "b", contains: [{ reagent: "CoCl2 2M", ml: 8 }, { reagent: "ZnSO4 1M", ml: 1 }, { reagent: "NaCl 2M", ml: 1 }, { reagent: "NaOH 0.1M", ml: 1 }] },
    { type: "burner", id: "br", under: "b", flame: 2 }, { type: "beaker", id: "c", contains: [{ reagent: "CuSO4 1M", ml: 10 }] }], { room: 22, model: "real" });
  until(l, () => !(amount(l, "H2O(l)") > 0), 900);
  assert.ok(!(amount(l, "H2O(l)") > 0) && amount(l, "NaCl(s)") > 1e-3, "eingedampft, Kochsalz liegt als Rückstand da");
  L.step(l, 30);
  const before = totals(l);
  L.pour(l, "c", "b", 10);
  L.step(l, 30);
  assert.equal(l.failed || 0, 0, "jedes Gleichgewicht ließ sich berechnen");
  near(totals(l).charge, before.charge, 1e-10, "Ladung");
  assert.ok(amount(l, "NaCl(s)") < 1e-9, "das Kochsalz hat sich wieder gelöst");
});

test("Reales Modell: Zellspannung und gelöste Gase folgen den Aktivitäten", () => {
  // Konzentrationszelle: zwei Zehnerpotenzen im Gehalt sind weniger als zwei in der Aktivität
  const cell = (model) => lab([{ type: "beaker", id: "l", contains: [{ reagent: "AgNO3 0.01M", ml: 60 }] }, { type: "beaker", id: "r", contains: [{ reagent: "AgNO3 1M", ml: 60 }] },
    { type: "electrode-Ag", id: "e1", in: "l" }, { type: "electrode-Ag", id: "e2", in: "r" }, { type: "bridge", id: "s", in: "l", to: "r" }, { type: "voltmeter", id: "u", in: "l" }], { room: 25, model });
  const expected = 0.05916 * Math.log10(act(cell("real"), "Ag+(aq)", "r") / act(cell("real"), "Ag+(aq)", "l"));
  near(volts(cell("real")), expected, 0.002, "Nernst mit Aktivitäten");
  assert.ok(expected < 0.116 && expected > 0.105, `${expected} V statt 0,118 V`);
  near(volts(cell("ideal")), 2 * 0.05916, 0.002, "ideal: 0,118 V");
  // Kohlenstoffdioxid löst sich in Salzlösung schlechter: nach dem Ausperlen bleibt weniger gelöst
  const fizzed = (model) => {
    const l = beaker([{ reagent: "NaHCO3 1M", ml: 10 }, { reagent: "NaCl 2M", ml: 20 }], { room: 25, model });
    L.add(l, "b", "HCl 2M", { ml: 10 });
    L.step(l, 900);
    return l;
  };
  const salty = fizzed("real"), plain = fizzed("ideal"), co2 = (l) => amount(l, "CO2(aq)") / (look(l).ml / 1000);
  near(co2(plain) / co2(salty), L.gamma(salty, "b", "CO2(aq)"), 0.03, "um den Aktivitätskoeffizienten weniger");
  assert.ok(L.gamma(salty, "b", "CO2(aq)") > 1.15, "Aussalzen: γ über 1");
});

test("Daten: Parameter für den Aktivitätskoeffizienten sind zwei Zahlen an einem gelösten Teilchen", () => {
  const before = L.db;
  try {
    assert.throws(() => L.register({ species: { "Hg^2+(aq)": { name: { de: "Quecksilber(II)-Ion" }, Hf: null, gamma: [5], src: "Probe" } } }), (e) => e.code === "data" && /gamma/.test(e.message));
    assert.throws(() => L.register({ species: { "Hg^2+(aq)": { name: { de: "Quecksilber(II)-Ion" }, Hf: null, gamma: [5, "0"], src: "Probe" } } }), (e) => e.code === "data" && /gamma/.test(e.message));
    assert.throws(() => L.register({ species: { "HgS(s)": { name: { de: "Quecksilbersulfid" }, Hf: null, gamma: [5, 0], src: "Probe" } } }), (e) => e.code === "data" && /gamma/.test(e.message));
    L.register({ species: { "Hg^2+(aq)": { name: { de: "Quecksilber(II)-Ion" }, Hf: null, gamma: [5, 0], src: "Probe" } }, reagents: { "HgCl2": { name: { de: "Quecksilberchlorid-Lösung" }, solution: { "Hg^2+(aq)": 1, "Cl-(aq)": 2 }, molar: true } } });
    const l = real([{ reagent: "HgCl2 0.1M", ml: 20 }]);
    // Ionengröße 5 Å, kein Zusatzglied: bei I = 0,3 mol/L ist lg γ = −A · 4 · √I / (1 + B · 5 · √I)
    near(Math.log10(L.gamma(l, "b", "Hg^2+(aq)")), -0.5108 * 4 * Math.sqrt(0.3) / (1 + 0.3287 * 5 * Math.sqrt(0.3)), 0.002, "nach Truesdell und Jones");
  } finally { L.db = before; }
  // im Grundpaket: jedes Teilchen mit Parametern ist gelöst, und die Quelle ist genannt
  const withGamma = Object.keys(L.db.species).filter((id) => L.db.species[id].gamma);
  assert.ok(withGamma.length >= 20, `${withGamma.length} Teilchen mit Parametern`);
  for (const id of withGamma) {
    assert.equal(L.db.species[id].phase, "aq", id);
    assert.match(L.db.species[id].src, /phreeqc\.dat/, id + ": Quelle");
  }
  assert.deepEqual(L.db.species["Na+(aq)"].gamma, [4.08, 0.082]);
});

test("Reales Modell an der Fläche: das Feld eines Gefäßes nennt die Ionenstärke", () => {
  const contents = (config) => { const el = mount(config); tap(el, "b"); return part(el, ".cl-panel").querySelector(".cl-contents").innerHTML; };
  const acid = (reagent, more) => Object.assign({ room: 25, bench: [{ type: "beaker", id: "b", contains: [{ reagent, ml: 20 }] }] }, more);
  assert.match(contents(acid("HCl 0.1M", { model: "real" })), /Flüssigkeit 20,0 mL · pH 1,08 · Ionenstärke 0,10 mol\/L/);
  // verdünnt mit einer Stelle mehr
  assert.match(contents(acid("HCl 0.01M", { model: "real" })), /Ionenstärke 0,010 mol\/L/);
  // knapp unter 0,1 mol/L (hier 0,0999) steht gerundet 0,10 da und nicht 0,100
  assert.match(contents(acid("HCl 0.0999M", { model: "real" })), /Ionenstärke 0,10 mol\/L/);
  // im idealen Modell und ohne Zahlen steht davon nichts da
  assert.match(contents(acid("HCl 0.1M")), /Flüssigkeit 20,0 mL · pH 1,00<\/p>/);
  assert.doesNotMatch(contents(acid("HCl 0.1M", { model: "real", show: { numbers: false } })), /Ionenstärke/);
  assert.equal(L.text("panel.strength", "en"), "ionic strength");
});

test("README: die Folie zu idealer und realer Lösung hält, was ihr Text verspricht", () => {
  const readme = fs.readFileSync(new URL("README.md", here), "utf8"), at = readme.indexOf("\n## Ideale und reale Lösung\n");
  assert.ok(at > 0, "Folie Ideale und reale Lösung");
  const end = readme.indexOf("\n## ", at + 5), blocks = [...readme.slice(at, end).matchAll(/```+ *json +@ChemLab\.sim\n([\s\S]*?)\n```+/g)].map((m) => L.normalize(m[1]));
  assert.deepEqual(blocks.map((config) => config.model), ["ideal", "real"], "links ideal, rechts real");
  const [ideal, real] = blocks.map((config) => L.createLab(config)), id = (config) => config.bench.find((p) => p.type === "beaker").id;
  const pH = (l, config) => look(l, id(config)).pH;
  near(pH(ideal, blocks[0]), 10.32, 0.01, "ideal");
  near(pH(real, blocks[1]), 10.01, 0.01, "real: der Wert der Eichlösung");
  for (const config of blocks) assert.ok(config.shelf.includes("NaCl 2M"), "Kochsalzlösung steht im Regal");
  L.add(ideal, id(blocks[0]), "NaCl 2M", { ml: 10 });
  L.add(real, id(blocks[1]), "NaCl 2M", { ml: 10 });
  L.step(ideal, 30);
  L.step(real, 30);
  near(pH(ideal, blocks[0]), 10.32, 0.02, "ideal: Kochsalz ändert fast nichts");
  near(pH(real, blocks[1]), 9.84, 0.03, "real: mit Kochsalz sinkt der pH-Wert");
  near(look(real, id(blocks[1])).strength, 0.48, 0.02, "die Ionenstärke, die das Feld nennt");
  // die Beschreibung des Aufbaus und der Daten nennt die neuen Angaben
  assert.match(readme, /- `model` – /);
  assert.match(readme, /\| `gamma` \| /);
});

test("Reales Modell: die äußere Schleife findet die Stelle, an der ein Ergebnis zu seiner Annahme passt – auch in widerspenstigen Fällen", () => {
  // L.selfConsistent(u, attempt, rootOf) sucht u mit rootOf(attempt(u)) = u; hier mit einfachen Funktionen statt eines Gefäßes
  const run = (F, start, dead) => {
    let count = 0;
    const found = L.selfConsistent(start, (u) => { count++; return dead && dead(u) ? null : { value: F(u) }; }, (out) => out.value);
    return Object.assign(found, { count });
  };
  // gutmütig: jeder Schritt bringt das Ergebnis näher. Die Sekante trifft eine Gerade sofort.
  const tame = run((u) => 0.2 + 0.3 * u, 0);
  near(tame.u, 0.2 / 0.7, 1e-9, "Gerade");
  assert.ok(tame.ok && tame.count <= 4, `${tame.count} Versuche`);
  near(tame.out.value, tame.u, 1e-9, "das Ergebnis gehört zur gefundenen Stelle");
  // schon am Ziel: ein Versuch genügt
  assert.equal(run(() => 0.3, 0.3).count, 1);
  near(run(() => 0.3, 50).u, 0.3, 1e-9, "weit entfernter Start");
  // einfaches Einsetzen spränge hier für immer zwischen zwei Werten hin und her
  const swing = run((u) => 0.9 / (1 + Math.exp(60 * (u - 0.3))), 0);
  near(0.9 / (1 + Math.exp(60 * (swing.u - 0.3))), swing.u, 1e-8, "steil fallend");
  assert.ok(swing.ok && swing.count <= 60, `${swing.count} Versuche`);
  // steil steigend: die mittlere Lösung stößt das Einsetzen ab; gefunden wird eine der drei
  const steep = run((u) => 0.5 + 0.4 * Math.tanh(8 * (u - 0.5)), 0.45);
  near(0.5 + 0.4 * Math.tanh(8 * (steep.u - 0.5)), steep.u, 1e-8, "steil steigend");
  // ein Sprung über die Stelle hinweg: eine Lösung gibt es nicht, aber die Suche endet am Sprung statt zu kreisen
  const jump = run((u) => (u < 0.4 ? 0.8 : 0.1), 0);
  near(jump.u, 0.4, 1e-8, "am Sprung");
  assert.ok(jump.ok && jump.count <= 150, `${jump.count} Versuche`);
  // links vom Sprung fast eben: Sekante und Einsetzen kämen nur in winzigen Schritten voran; erst das Halbieren führt hin
  const crawl = run((u) => (u < 0.5 ? u + 1e-6 * (0.6 - u) : 0.01 * u), 0.1);
  near(crawl.u, 0.5, 1e-8, "am Sprung, trotz flachem Anlauf");
  assert.ok(crawl.ok && crawl.count <= 150, `${crawl.count} Versuche`);
  // scheitert ein Versuch, bleibt es beim letzten gelungenen, und das wird gemeldet
  const broken = run((u) => 0.5 + 0.5 * u, 0, (u) => u > 0.7);
  assert.equal(broken.ok, false);
  assert.ok(broken.out && broken.out.value === 0.5 + 0.5 * broken.u && broken.u <= 0.7, "das letzte gelungene Ergebnis");
  // scheitert schon der erste, gibt es kein Ergebnis
  assert.equal(run(() => 0.3, 0, () => true).out, null);
  // im Gefäß: Meldet die Schleife ein Scheitern, zählt das Labor es als nicht berechnet; das letzte gelungene Ergebnis gilt
  const search = L.selfConsistent;
  try {
    L.selfConsistent = (u, attempt) => ({ u, out: attempt(u, null), ok: false });
    const l = real([{ reagent: "HCl 0.1M", ml: 20 }]);
    assert.ok(l.failed > 0, "als nicht berechnet gezählt");
    near(totals(l).charge, 0, 1e-15, "der Zustand ist trotzdem einer, den es geben kann");
    L.selfConsistent = () => ({ u: 0, out: null, ok: true });
    assert.ok(real([{ reagent: "HCl 0.1M", ml: 20 }]).failed > 0, "ohne Ergebnis ebenso");
  } finally { L.selfConsistent = search; }
  assert.equal(real([{ reagent: "HCl 0.1M", ml: 20 }]).failed || 0, 0);
});

// ---------------------------------------------------------------- Befunde der Durchsicht des realen Modells

test("Reales Modell: auch das Gleichgewicht einer sofortigen Reaktion gilt für die Aktivitäten", () => {
  const quotient = (l, how) => 2 * Math.log10(how(l, "Fe^2+(aq)")) + Math.log10(how(l, "I3-(aq)")) - 2 * Math.log10(how(l, "Fe^3+(aq)")) - 3 * Math.log10(how(l, "I-(aq)"));
  const conc = (l, id) => amount(l, id) / (look(l).ml / 1000);
  const mixed = (model) => { const l = beaker([{ reagent: "FeCl3 0.01M", ml: 10 }, { reagent: "HCl 0.1M", ml: 5 }], { room: 25, model }); L.add(l, "b", "KI 0.01M", { ml: 10 }); L.step(l, 60); return l; };
  const r = mixed("real"), i = mixed("ideal");
  near(quotient(r, act), 7.77, 0.02, "real: der Quotient der Aktivitäten ist K");
  near(quotient(i, conc), 7.77, 0.02, "ideal: der Quotient der Konzentrationen ist K");
  assert.ok(Math.abs(quotient(r, conc) - 7.77) > 0.3, "im realen Modell liegt der Quotient der Konzentrationen daneben");
  near(totals(r).charge, totals(i).charge, 1e-12, "Ladung");
  assert.equal(r.failed || 0, 0);
});

test("Reales Modell: Aktivitätskoeffizienten bleiben auch in einem überhitzten Gefäß Zahlen", () => {
  // Flüssigkeit trifft auf ein heißes, trockenes Gefäß: für einen Augenblick liegt die Temperatur weit über 100 °C
  const l = real([{ reagent: "AgNO3 0.1M", ml: 20 }]), v = L.vessel(l, "b");
  for (const T of [150, 370, 800]) {
    v.T = T;
    const g = L.gamma(l, "b", "Ag+(aq)");
    assert.ok(g > 0.5 && g < 1, `${T} °C: γ = ${g}`);
    assert.ok(Number.isFinite(look(l).pH), `${T} °C: pH ${look(l).pH}`);
  }
  // über 100 °C gilt der Wert für 100 °C, unter 0 °C der für 0 °C
  v.T = 100; const hot = L.gamma(l, "b", "Ag+(aq)");
  v.T = 400; assert.equal(L.gamma(l, "b", "Ag+(aq)"), hot);
  v.T = 0; const cold = L.gamma(l, "b", "Ag+(aq)");
  v.T = -5; assert.equal(L.gamma(l, "b", "Ag+(aq)"), cold);
  assert.ok(cold > hot, "in der Kälte näher an 1");
});

test("Daten: unmögliche Parameter für den Aktivitätskoeffizienten sind ein Fehler in den Daten", () => {
  const before = L.db, ion = (gamma) => ({ species: { "Hg^2+(aq)": { name: { de: "Quecksilber(II)-Ion" }, Hf: null, gamma, src: "Probe" } } });
  try {
    // eine negative Ionengröße gäbe eine Polstelle, ein riesiges Zusatzglied Koeffizienten jenseits aller Zahlen
    for (const gamma of [[-3, 0], [25, 0], [5, 60], [5, -2]]) assert.throws(() => L.register(ion(gamma)), (e) => e.code === "data" && /gamma/.test(e.message), JSON.stringify(gamma));
    L.register(ion([0, 0.4]));
  } finally { L.db = before; }
});

test("Reales Modell: scheitert eine Rechnung mit einer Ausnahme, rechnen die übrigen Flächen unbeirrt weiter", () => {
  const search = L.selfConsistent, ideal = beaker([{ reagent: "CH3COOH 0.1M", ml: 20 }], { room: 25 }), before = look(ideal).pH;
  try {
    L.selfConsistent = (u, attempt) => { attempt(u, null); throw new Error("Probe"); };
    assert.throws(() => real([{ reagent: "HCl 0.1M", ml: 20 }]), /Probe/);
  } finally { L.selfConsistent = search; }
  // die Schalter des realen Modells dürfen danach nicht stehen bleiben: ein ideales Glas rechnet wie zuvor
  L.add(ideal, "b", "NaOH 0.1M", { ml: 10 });
  L.step(ideal, 5);
  assert.equal(ideal.failed || 0, 0);
  near(look(ideal).pH, 4.757, 0.005, "Halbäquivalenzpunkt im idealen Modell");
  assert.ok(before < 3);
  const same = beaker([{ reagent: "CH3COOH 0.1M", ml: 20 }], { room: 25 });
  assert.equal(look(same).pH, before, "bitgleich mit der Rechnung vor der Ausnahme");
});

// ---------------------------------------------------------------- Ältere Befunde aus der Durchsicht

test("Löser: ein unpassender gemerkter Startwert bringt die Rechnung nicht zum Scheitern", () => {
  // Die Bürette enthielt Natronlauge und lief leer. Der gemerkte Startwert (pH 14) passt nicht zur sauren Kupferchlorid-Lösung,
  // die danach hineinkommt: Die erste Matrix des Newton-Verfahrens wäre damit singulär.
  for (const model of ["ideal", "real"]) {
    const l = lab([{ type: "beaker", id: "b2", ml: 250 }, { type: "burette", id: "bu", over: "b2" }], { model, room: 20 });
    L.add(l, "bu", "NaOH 1M", { ml: 2 });
    L.step(l, 3);
    L.setTap(l, "bu", 0.5);
    L.step(l, 10);
    assert.deepEqual(L.vessel(l, "bu").n, {}, "die Bürette ist leergelaufen");
    const before = totals(l);
    L.add(l, "bu", "CuCl2 5M", { ml: 0.5 });
    L.step(l, 10);
    assert.equal(l.failed || 0, 0, model + ": jedes Gleichgewicht ließ sich berechnen");
    near(totals(l).charge, before.charge, 1e-12, model + ": Ladung");
    assert.ok(amount(l, "Cu(OH)2(s)", "b2") > 1e-4, model + ": im Becherglas fällt Kupferhydroxid aus");
    // und in der Bürette selbst, solange die Lösung darin steht
    const still = lab([{ type: "burette", id: "bu" }], { model, room: 20 });
    L.add(still, "bu", "NaOH 1M", { ml: 2 });
    L.step(still, 2);
    L.empty(still, "bu");
    L.add(still, "bu", "CuCl2 5M", { ml: 5 });
    L.step(still, 5);
    assert.equal(still.failed || 0, 0, model + ": stehende Lösung");
    assert.ok(look(still, "bu").pH < 4, `${model}: Kupferchlorid-Lösung reagiert sauer (pH ${look(still, "bu").pH})`);
  }
});

test("Löser: beim Eindampfen bleibt die Ladungsbilanz in beiden Modellen genau", () => {
  // Zinksulfat in starker Natronlauge über dem Brenner: Tausende Rechenschritte, in denen sich die Lösung ständig ändert.
  // Bleibt in jedem ein Fehler knapp unter der Schranke des Newton-Verfahrens stehen, wächst daraus eine Ladung.
  for (const model of ["ideal", "real"]) {
    const l = lab([{ type: "dish", id: "b", contains: [{ reagent: "ZnSO4 1M", ml: 3 }, { reagent: "NaOH 5M", ml: 6 }] }, { type: "burner", id: "br", under: "b", flame: 2 }], { model, room: 22 });
    const charge = () => Object.entries(L.vessel(l, "b").n).reduce((sum, [id, n]) => sum + n * L.species(id).charge, 0);
    let t = 0, worst = 0;
    while (amount(l, "H2O(l)") > 0 && t < 3000) { L.step(l, 5); t += 5; worst = Math.max(worst, Math.abs(charge())); }
    assert.ok(t < 3000, model + ": eingedampft");
    assert.ok(worst < 1e-13, `${model}: größte Ladungssumme unterwegs ${worst.toExponential(2)} mol`);
    assert.equal(l.failed || 0, 0);
  }
});

test("Viele Niederschläge zugleich: neunzehn Feststoffe in wenig Wasser kommen im Gleichgewicht zur Ruhe", () => {
  // Hydroxide, Carbonate, Sulfate und Chloride von sieben Metallen: viel mehr Feststoffe, als nebeneinander bestehen können.
  // Zwischen solchen Feststoffen läuft eine Reaktion, bis einer aufgebraucht ist; welcher, entscheidet die freie Enthalpie.
  const solids = ["Cu(OH)2(s)", "CaCO3(s)", "CaSO4*2H2O(s)", "Ca(OH)2(s)", "CuCO3(s)", "BaSO4(s)", "BaCO3(s)", "SrCO3(s)", "SrSO4(s)", "Mg(OH)2(s)", "MgO(s)", "Zn(OH)2(s)",
    "Fe(OH)2(s)", "Fe(OH)3(s)", "Ag2O(s)", "Ag2CO3(s)", "Ag2SO4(s)", "AgCl(s)", "NaCl(s)"];
  for (const model of ["ideal", "real"]) {
    const mud = lab([{ type: "beaker", id: "b", ml: 250 }], { room: 28, model }), glass = L.vessel(mud, "b");
    glass.n = { "H2O(l)": 0.0609 };
    for (const id of solids) glass.n[id] = 1e-4;
    glass.lumps = solids.map((id) => ({ id, n: 1e-4, n0: 1e-4, a0: 1, p: 2 / 3, made: true, settled: 1 }));
    glass.dirty = true;
    const before = totals(mud);
    const t = restAfter(mud, 4000);
    assert.ok(t < 4000, model + ": kommt zur Ruhe");
    assert.deepEqual(settled(mud), [], model + ": nichts ist übersättigt, und nichts liegt da, was sich lösen müsste");
    assert.equal(mud.failed || 0, 0, model + ": jedes Gleichgewicht ließ sich berechnen");
    near(totals(mud).charge, before.charge, 1e-12, model + ": Ladung");
    near(totals(mud).mass, before.mass, 1e-9, model + ": Masse");
    // das schwerer lösliche Silberchlorid bleibt, das leichter lösliche Silberoxid ist umgewandelt
    assert.ok(amount(mud, "AgCl(s)") > 1e-5 && amount(mud, "BaSO4(s)") > 5e-5, model + ": Silberchlorid und Bariumsulfat liegen da");
  }
});

// ================================================================ Ionenpaare des realen Modells

// ein Feststoff im Überschuss in Wasser, bis nichts mehr geschieht; zurück: das Labor
const soaked = (solid, mol, model) => {
  const l = lab([{ type: "beaker", id: "b", ml: 250 }], { room: 25, model }), glass = L.vessel(l, "b");
  glass.n = { "H2O(l)": 50 * 0.997 / 18.015, [solid]: mol };
  glass.lumps = [{ id: solid, n: mol, n0: mol, a0: 1, p: 2 / 3, made: true, settled: 1 }];
  glass.dirty = true;
  restAfter(l, 6000);
  return l;
};
const inSolution = (l, ids) => ids.reduce((sum, id) => sum + amount(l, id), 0) / (look(l).ml / 1000);

test("Reales Modell: schwache Ionenpaare gibt es nur dort; im idealen Modell zerfallen diese Salze vollständig", () => {
  const sulfate = (model, conc) => beaker([{ reagent: "Na2SO4 " + (conc || 0.5) + "M", ml: 20 }], { room: 25, model });
  // in beiden Reihenfolgen angelegt: Die Zusammenstellung der Gleichgewichte hängt am Modell, nicht nur an den Stoffen
  const first = sulfate("ideal"), r = sulfate("real"), i = sulfate("ideal");
  assert.equal(amount(first, "NaSO4-(aq)"), 0, "ideal: kein Ionenpaar");
  assert.equal(amount(i, "NaSO4-(aq)"), 0, "ideal, nach einem realen Labor mit denselben Stoffen: kein Ionenpaar");
  near(amount(i, "SO4^2-(aq)") + amount(i, "HSO4-(aq)"), 0.01, 1e-12, "ideal: alles Sulfat ist frei (bis auf eine Spur Hydrogensulfat)");
  assert.ok(amount(r, "NaSO4-(aq)") > 1e-3 && amount(r, "NaSO4-(aq)") < 6e-3, `real: ein Teil des Sulfats ist an Natrium gebunden (${amount(r, "NaSO4-(aq)")} mol)`);
  near(amount(r, "NaSO4-(aq)") + amount(r, "SO4^2-(aq)") + amount(r, "HSO4-(aq)"), 0.01, 1e-12, "Sulfat bleibt erhalten");
  near(totals(r).charge, 0, 1e-12, "Ladung");
  // das Massenwirkungsgesetz des Ionenpaars, mit Aktivitäten
  near(Math.log10(act(r, "NaSO4-(aq)")) - Math.log10(act(r, "Na+(aq)")) - Math.log10(act(r, "SO4^2-(aq)")), 0.94, 1e-6, "lg K = 0,94");
  // mittlerer Aktivitätskoeffizient von Natriumsulfat, auf die eingewogene Konzentration bezogen: 0,445 / 0,266 / 0,201 in den Tabellen
  const mean = (conc) => { const l = sulfate("real", conc); return ((act(l, "Na+(aq)") / (2 * conc)) ** 2 * (act(l, "SO4^2-(aq)") / conc)) ** (1 / 3); };
  near(mean(0.1), 0.445, 0.03, "Natriumsulfat 0,1 mol/L");
  near(mean(0.5), 0.266, 0.03, "Natriumsulfat 0,5 mol/L");
  near(mean(1), 0.201, 0.06, "Natriumsulfat 1 mol/L (hier ist das Modell um ein Viertel zu hoch; ohne Ionenpaar wäre es das Doppelte)");
  // Kalium- und Magnesiumsulfat, Calciumsulfat und die Hydroxo-Ionen von Calcium und Magnesium
  const mix = real([{ reagent: "Na2SO4 0.1M", ml: 10 }, { reagent: "KNO3 0.1M", ml: 10 }, { reagent: "CaCl2 0.01M", ml: 10 }, { reagent: "NaOH 0.01M", ml: 10 }]);
  for (const id of ["KSO4-(aq)", "CaSO4(aq)", "CaOH+(aq)"]) assert.ok(amount(mix, id) > 1e-9, id + " liegt vor");
  const same = beaker([{ reagent: "Na2SO4 0.1M", ml: 10 }, { reagent: "KNO3 0.1M", ml: 10 }, { reagent: "CaCl2 0.01M", ml: 10 }, { reagent: "NaOH 0.01M", ml: 10 }], { room: 25 });
  for (const id of ["KSO4-(aq)", "CaSO4(aq)", "CaOH+(aq)", "NaSO4-(aq)"]) assert.equal(amount(same, id), 0, id + " fehlt im idealen Modell");
  assert.equal(r.failed || 0, 0);
});

test("Reales Modell: Gips und Calciumhydroxid lösen sich etwa wie gemessen", () => {
  // Gips: 15,2 mmol/L bei 25 °C; gesättigte Calciumhydroxid-Lösung: 20,3 mmol/L, pH 12,45 (Eichlösung)
  const gypsum = soaked("CaSO4*2H2O(s)", 0.01, "real"), lime = soaked("Ca(OH)2(s)", 0.01, "real");
  near(inSolution(gypsum, ["Ca^2+(aq)", "CaSO4(aq)"]), 0.0152, 0.0008, "Gips");
  near(inSolution(lime, ["Ca^2+(aq)", "CaOH+(aq)"]), 0.0203, 0.001, "Calciumhydroxid");
  near(look(lime).pH, 12.45, 0.03, "pH von Kalkwasser");
  assert.ok(amount(gypsum, "CaSO4*2H2O(s)") > 1e-3 && amount(lime, "Ca(OH)2(s)") > 1e-3, "Bodenkörper bleibt");
  assert.deepEqual(settled(gypsum).concat(settled(lime)), []);
  // im idealen Modell bleibt es bei den alten Werten
  near(inSolution(soaked("CaSO4*2H2O(s)", 0.01, "ideal"), ["Ca^2+(aq)"]), 0.00495, 0.0002, "Gips, ideal");
});

test("Reales Modell: Ionenpaare zerfallen beim Eindampfen und stören das ideale Modell nicht", () => {
  // Flammenfärbung: die freien Natrium-Ionen färben die Flamme wie im idealen Modell
  const flame = lab([{ type: "testtube", id: "a", contains: [{ reagent: "Na2SO4 1M", ml: 5 }] }, { type: "burner", id: "br", flame: 2 }], { room: 20, model: "real" });
  assert.equal(L.flameTest(flame, "a").name, "yellow", "Natriumsulfat");
  // im idealen Modell entsteht auch beim Eindampfen kein Ionenpaar
  const plain = heated({ type: "dish", contains: [{ reagent: "CaCl2 0.1M", ml: 2 }, { reagent: "Na2SO4 0.01M", ml: 2 }] });
  until(plain, () => !(amount(plain, "H2O(l)") > 0), 900);
  for (const id of ["CaSO4(aq)", "NaSO4-(aq)", "CaOH+(aq)"]) assert.equal(amount(plain, id), 0, "ideal, eingedampft: kein " + id);
  // auch nicht aus Ionen, die bis zuletzt gelöst bleiben: Magnesium und Sulfat bleiben im idealen Modell als Ionen im Rückstand
  const salt = heated({ type: "dish", contains: [{ reagent: "H2O", ml: 2 }] }), dish = L.vessel(salt, "b");
  dish.n["Mg^2+(aq)"] = 1e-4; dish.n["SO4^2-(aq)"] = 1e-4; dish.dirty = true;
  until(salt, () => !(amount(salt, "H2O(l)") > 0), 900);
  assert.ok(!(amount(salt, "H2O(l)") > 0), "eingedampft");
  assert.equal(amount(salt, "MgSO4(aq)"), 0, "ideal, eingedampft: kein Magnesiumsulfat-Ionenpaar");
  near(amount(salt, "Mg^2+(aq)"), 1e-4, 1e-7, "Magnesium bleibt als Ion im Rückstand");
  // und im realen Modell ebenso: Beim Eindampfen zerfallen die Ionenpaare, und sie bilden sich im Rückstand nicht neu
  const dryReal = heated({ type: "dish", contains: [{ reagent: "H2O", ml: 2 }] }, { model: "real" }), pan = L.vessel(dryReal, "b");
  pan.n["Mg^2+(aq)"] = 1e-4; pan.n["SO4^2-(aq)"] = 1e-4; pan.dirty = true;
  L.step(dryReal, 2);
  assert.ok(amount(dryReal, "MgSO4(aq)") > 1e-6, "real, in Lösung: Ionenpaar");
  until(dryReal, () => !(amount(dryReal, "H2O(l)") > 0), 900);
  assert.equal(amount(dryReal, "MgSO4(aq)"), 0, "real, eingedampft: kein Ionenpaar im Rückstand");
  near(amount(dryReal, "Mg^2+(aq)"), 1e-4, 1e-7, "real: Magnesium als Ion im Rückstand");
  // eingedampft bleibt Salz zurück, kein Ionenpaar; mit Wasser löst es sich wieder
  const l = heated({ type: "dish", contains: [{ reagent: "Na2SO4 0.5M", ml: 4 }] }, { model: "real" }), before = totals(l);
  until(l, () => !(amount(l, "H2O(l)") > 0), 900);
  assert.ok(!(amount(l, "H2O(l)") > 0), "eingedampft");
  assert.equal(amount(l, "NaSO4-(aq)"), 0, "das Ionenpaar ist zerfallen");
  // (Spuren von Hydroxid gehen mit dem Dampf fort und nehmen ihr Gegenion mit)
  near(amount(l, "Na+(aq)"), 0.004, 1e-7, "Natrium im Rückstand");
  near(amount(l, "SO4^2-(aq)"), 0.002, 1e-7, "Sulfat im Rückstand");
  L.setFlame(l, "br", 0);
  L.step(l, 600);
  L.add(l, "b", "H2O", { ml: 10 });
  L.step(l, 60);
  assert.ok(amount(l, "NaSO4-(aq)") > 1e-5, "wieder gelöst, wieder mit Ionenpaaren");
  near(totals(l).charge, before.charge, 1e-12, "Ladung");
  assert.equal(l.failed || 0, 0);
});

test("Daten: ein Gleichgewicht kann dem realen Modell vorbehalten sein", () => {
  const before = L.db, pair = (model) => ({ species: { "LiSO4-(aq)": { name: { de: "Lithiumsulfat-Ionenpaar" }, Hf: null, src: "Probe" } },
    equilibria: [{ eq: "Li+(aq) + SO4^2-(aq) <=> LiSO4-(aq)", logK: 0.64, model, src: "Probe" }], reagents: { "Li2SO4": { name: { de: "Lithiumsulfat-Lösung" }, solution: { "Li+(aq)": 2, "SO4^2-(aq)": 1 }, molar: true } } });
  try {
    for (const model of ["ideal", "echt", 1]) assert.throws(() => L.register(pair(model)), (e) => e.code === "data" && /model/.test(e.message), String(model));
    // nur für Gleichgewichte in der Lösung: Ein Feststoff oder ein Gas kann nicht einem Modell vorbehalten sein
    assert.throws(() => L.register({ species: { "Li2SO4(s)": { name: { de: "Lithiumsulfat" }, Hf: null, color: "#f5f5f2", src: "Probe" } },
      equilibria: [{ eq: "Li2SO4(s) <=> 2 Li+(aq) + SO4^2-(aq)", logK: 0.5, model: "real", src: "Probe" }] }), (e) => e.code === "data" && /model/.test(e.message), "Feststoff");
    assert.throws(() => L.register({ species: { "HBr(g)": { name: { de: "Bromwasserstoff" }, Hf: null, src: "Probe" } },
      equilibria: [{ eq: "HBr(g) <=> H+(aq) + Br-(aq)", logK: 0.5, model: "real", src: "Probe" }] }), (e) => e.code === "data" && /model/.test(e.message), "Gas");
    L.register(pair("real"));
    assert.equal(amount(beaker([{ reagent: "Li2SO4 0.5M", ml: 10 }], { room: 25 }), "LiSO4-(aq)"), 0, "ideal: nicht dabei");
    assert.ok(amount(real([{ reagent: "Li2SO4 0.5M", ml: 10 }]), "LiSO4-(aq)") > 1e-4, "real: dabei");
  } finally { L.db = before; }
  // im Grundpaket: die Ionenpaare des realen Modells stammen aus phreeqc.dat und minteq.v4.dat
  const six = ["Ca^2+(aq) + H2O(l) <=> CaOH+(aq) + H+(aq)", "Ca^2+(aq) + SO4^2-(aq) <=> CaSO4(aq)", "K+(aq) + SO4^2-(aq) <=> KSO4-(aq)",
    "Mg^2+(aq) + H2O(l) <=> MgOH+(aq) + H+(aq)", "Mg^2+(aq) + SO4^2-(aq) <=> MgSO4(aq)", "Na+(aq) + SO4^2-(aq) <=> NaSO4-(aq)"];
  const pairs = L.db.equilibria.filter((e) => e.model === "real" && six.includes(e.text));
  assert.deepEqual(pairs.map((e) => e.text).sort(), six, "die Sulfat-Paare und die Hydroxo-Ionen");
  for (const e of pairs) assert.match(e.src, /phreeqc\.dat|minteq\.v4\.dat/, e.text);
  // die Werte, wie sie in den Quelldateien stehen
  const logK = Object.fromEntries(pairs.map((e) => [e.solid || Object.keys(e.nu).find((id) => /SO4-\(aq\)|SO4\(aq\)|OH\+\(aq\)/.test(id) && id !== "SO4^2-(aq)"), [e.logK, e.dH == null ? null : e.dH]]));
  assert.deepEqual(logK, { "NaSO4-(aq)": [0.94, 8.23], "KSO4-(aq)": [1.18, 3], "CaSO4(aq)": [2.36, 7.1], "CaOH+(aq)": [-12.697, 64.11], "MgSO4(aq)": [2.42, 19], "MgOH+(aq)": [-11.397, 67.81] });
  assert.deepEqual(["NaSO4-(aq)", "KSO4-(aq)", "CaSO4(aq)", "MgSO4(aq)", "MgOH+(aq)", "CaOH+(aq)"].map((id) => L.db.species[id].gamma || null),
    [[3.5, 0.1072], [5.4, 0.19], [0, 0.0445], [0, 0.2], [6.5, 0], null], "Parameter der Aktivitätskoeffizienten aus phreeqc.dat");
  assert.match(fs.readFileSync(new URL("README.md", here), "utf8"), /"model":"real"` gilt ein Gleichgewicht in der Lösung nur im realen Modell/, "die README beschreibt die Angabe");
});

test("Viele Niederschläge zugleich: Zufallsgemische vieler Feststoffe in wenig Wasser kommen im Gleichgewicht zur Ruhe", () => {
  // Vier bis siebzehn Feststoffe in 0,06 bis 1,8 mL Wasser. Die Folgen sind so gewählt, dass sie zwei Dinge brauchen: Ein Feststoff,
  // der sich lösen muss, löst sich zunächst ganz (2, 10, 17, 24), und von Feststoffen, deren Zusammensetzungen voneinander
  // abhängen, scheidet einer aus (4, 8, 12, 19). In zwei Folgen führt der Weg im realen Modell über einen Zwischenzustand,
  // den nur Konzentrationen weit über 1000 mol/L erfüllen (186, 284).
  const solids = L.db.equilibria.filter((e) => e.solid && !e.rate).map((e) => e.solid);
  for (const model of ["ideal", "real"]) for (const seed of [2, 10, 17, 24, 4, 8, 12, 19].concat(model === "real" ? [186, 284] : [])) {
    let s = (seed * 2654435761) >>> 0;
    const rnd = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
    const n = { "H2O(l)": 10 ** (-2.5 + 1.5 * rnd()) };
    for (let k = 0, m = 4 + Math.floor(rnd() * 14); k < m; k++) n[solids[Math.floor(rnd() * solids.length)]] = 10 ** (-6 + 2.5 * rnd());
    const mud = lab([{ type: "beaker", id: "b", ml: 250 }], { room: 25, model }), glass = L.vessel(mud, "b"), where = `${model}, Folge ${seed}`;
    glass.n = Object.assign({}, n);
    glass.lumps = Object.keys(n).filter((id) => /\(s\)$/.test(id)).map((id) => ({ id, n: n[id], n0: n[id], a0: 1, p: 2 / 3, made: true, settled: 1 }));
    glass.dirty = true;
    const before = totals(mud);
    assert.ok(restAfter(mud, 3000) < 3000, where + ": kommt zur Ruhe");
    assert.equal(mud.failed || 0, 0, where + ": jedes Gleichgewicht ließ sich berechnen");
    near(totals(mud).charge, before.charge, 1e-12, where + ": Ladung");
    near(totals(mud).mass, before.mass, 1e-9, where + ": Masse");
    const paste = Object.entries(glass.n).reduce((sum, [id, x]) => sum + (L.species(id).phase === "aq" ? x : 0), 0) > 25 * L.volume(glass);
    if (!paste) assert.deepEqual(settled(mud), [], where + ": nichts übersättigt, nichts liegt da, was sich lösen müsste");
  }
});

test("Löser: viel Bodensatz in einem Rest von Wasser lässt sich berechnen", () => {
  // Ein fast leer gegossenes Glas: 250 µmol Strontiumsulfat und wenige Nanoliter Lösung. Ganz auflösen lässt sich der Feststoff
  // darin nicht einmal in Gedanken; er bleibt liegen, und die Lösung ist mit ihm gesättigt.
  for (const model of ["ideal", "real"]) {
    const l = lab([{ type: "beaker", id: "b" }], { room: 24, model }), glass = L.vessel(l, "b");
    glass.n = { "Sr^2+(aq)": 3.76e-9, "Cl-(aq)": 7.74e-9, "H2O(l)": 2.36e-7, "Na+(aq)": 2.44e-10, "SrSO4(s)": 2.5e-4 };
    glass.lumps = [{ id: "SrSO4(s)", n: 2.5e-4, n0: 2.5e-4, a0: 1, p: 2 / 3, made: true, settled: 1 }];
    glass.dirty = true;
    const before = totals(l);
    L.step(l, 5);
    assert.equal(l.failed || 0, 0, model + ": jedes Gleichgewicht ließ sich berechnen");
    near(amount(l, "SrSO4(s)"), 2.5e-4, 1e-9, model + ": der Bodensatz liegt noch da");
    near(totals(l).charge, before.charge, 1e-18, model + ": Ladung");
    // Marmor unter einer tropfenden Bürette: die ersten Tropfen treffen auf 20 mmol Feststoff
    const drip = lab([{ type: "beaker", id: "b", contains: [{ reagent: "marble", g: 2 }] }, { type: "burette", id: "bu", over: "b", contains: [{ reagent: "HCl 1M", ml: 20 }] }], { room: 25, model });
    L.setTap(drip, "bu", 0.05);
    L.step(drip, 10);
    assert.equal(drip.failed || 0, 0, model + ": Marmor unter der Bürette");
    assert.ok(amount(drip, "Ca^2+(aq)") > 1e-5, model + ": der Marmor reagiert mit der Säure");
    // eingedampftes Kochsalz und ein Tropfen Indikatorlösung: der Tropfen sättigt sich, der Rest bleibt liegen
    const salt = lab([{ type: "dish", id: "b", contains: [{ reagent: "NaCl 5M", ml: 20 }] }, { type: "burner", id: "br", under: "b", flame: 2 }], { room: 25, model });
    until(salt, () => !(amount(salt, "H2O(l)") > 0), 3000);
    L.setFlame(salt, "br", 0);
    L.step(salt, 900);
    L.add(salt, "b", "PP", { drops: 1 });
    L.step(salt, 30);
    assert.equal(salt.failed || 0, 0, model + ": Tropfen auf dem Salz");
    assert.ok(amount(salt, "Na+(aq)") > 2e-4 && amount(salt, "Na+(aq)") < 5e-4, `${model}: der Tropfen ist mit Kochsalz gesättigt (${amount(salt, "Na+(aq)")} mol)`);
    assert.ok(amount(salt, "NaCl(s)") > 0.09, model + ": das meiste Salz liegt noch da");
  }
});

// ---------------------------------------------------------------- Carbonat-Ionenpaare und Chlorokomplexe des realen Modells

test("Daten: die Ionenpaare der Erdalkalicarbonate und die Chlorokomplexe des Silbers sind dem realen Modell vorbehalten", () => {
  // Gleichung → [lg K, Reaktionsenthalpie in kJ/mol oder null, Quelldatei], wie in den Datenbanken des USGS
  const expected = {
    "Ca^2+(aq) + CO3^2-(aq) <=> CaCO3(aq)": [3.2, 16, "minteq"], "Ca^2+(aq) + H+(aq) + CO3^2-(aq) <=> CaHCO3+(aq)": [11.599, 5.4, "minteq"],
    "Mg^2+(aq) + CO3^2-(aq) <=> MgCO3(aq)": [2.92, 12, "minteq"], "Mg^2+(aq) + H+(aq) + CO3^2-(aq) <=> MgHCO3+(aq)": [11.339, -10.6, "minteq"],
    "Sr^2+(aq) + CO3^2-(aq) <=> SrCO3(aq)": [2.81, 20, "minteq"], "Sr^2+(aq) + H+(aq) + CO3^2-(aq) <=> SrHCO3+(aq)": [11.539, 10.4, "minteq"],
    "Ba^2+(aq) + CO3^2-(aq) <=> BaCO3(aq)": [2.71, 16, "minteq"], "Ba^2+(aq) + H+(aq) + CO3^2-(aq) <=> BaHCO3+(aq)": [11.309, 10.4, "minteq"],
    "Ag+(aq) + Cl-(aq) <=> AgCl(aq)": [3.31, -12, "minteq"], "Ag+(aq) + 2 Cl-(aq) <=> AgCl2-(aq)": [5.25, -16, "minteq"],
    "Ag+(aq) + 3 Cl-(aq) <=> AgCl3^2-(aq)": [5.2, null, "minteq"]
  };
  for (const [text, [logK, dH, file]] of Object.entries(expected)) {
    const e = L.db.equilibria.find((x) => x.text === text);
    assert.ok(e, text + " ist eingetragen");
    assert.equal(e.model, "real", text);
    assert.deepEqual([e.logK, e.dH == null ? null : e.dH], [logK, dH], text);
    assert.match(e.src, new RegExp(file === "minteq" ? "minteq\\.v4\\.dat" : "phreeqc\\.dat"), text);
  }
  assert.equal(L.db.equilibria.filter((e) => e.model === "real").length, 6 + 11, "sechs Sulfat- und Hydroxo-Paare, dazu diese elf");
  // Parameter der Aktivitätskoeffizienten, wo phreeqc.dat welche nennt
  assert.deepEqual(["CaHCO3+(aq)", "MgHCO3+(aq)", "SrHCO3+(aq)", "BaHCO3+(aq)", "AgCl2-(aq)"].map((id) => L.db.species[id].gamma || null), [[6, 0], [4, 0], [5.4, 0], null, null]);
  // bewusst nicht eingetragen, weil die Messung dagegen spricht (siehe die Anmerkungen in den Daten)
  for (const id of ["NaHCO3(aq)", "KHCO3(aq)", "CuCl+(aq)", "CuCl4^2-(aq)", "AgCl4^3-(aq)"]) assert.equal(L.db.species[id], undefined, id);
  // im idealen Modell kommt keines dieser Teilchen vor
  const mix = [{ reagent: "CaCl2 0.1M", ml: 5 }, { reagent: "NaHCO3 0.1M", ml: 5 }, { reagent: "CuCl2 0.5M", ml: 5 }, { reagent: "AgNO3 0.01M", ml: 1 }, { reagent: "KNO3 0.1M", ml: 2 }];
  const ideal = beaker(mix, { room: 25 }), realMix = real(mix), pairs = Object.keys(expected).map((text) => text.split(" <=> ")[1]);
  for (const id of pairs) assert.equal(amount(ideal, id), 0, id + " fehlt im idealen Modell");
  for (const id of ["CaHCO3+(aq)", "CaCO3(aq)", "AgCl(aq)", "AgCl2-(aq)"]) assert.ok(amount(realMix, id) > 1e-12, id + " liegt im realen Modell vor");
  near(totals(realMix).charge, 0, 1e-12, "Ladung");
  assert.equal(realMix.failed || 0, 0);
});

test("Reales Modell: Silberchlorid löst sich in konzentrierter Salzsäure, weil Chlorokomplexe entstehen", () => {
  const silver = (model) => { const l = beaker([{ reagent: "AgNO3 0.01M", ml: 2 }, { reagent: "NaCl 0.01M", ml: 2 }], { room: 25, model }); L.add(l, "b", "HCl 12M", { ml: 20 }); restAfter(l, 3000); return l; };
  const r = silver("real"), i = silver("ideal");
  near(amount(i, "AgCl(s)"), 2e-5, 1e-7, "ideal: der Niederschlag bleibt");
  assert.ok(amount(r, "AgCl(s)") < 1e-9, `real: er hat sich gelöst (${amount(r, "AgCl(s)")} mol übrig)`);
  assert.ok(amount(r, "AgCl3^2-(aq)") + amount(r, "AgCl2-(aq)") > 1.9e-5, "das Silber steckt in den Chlorokomplexen");
  assert.equal(r.failed || 0, 0);
  // Löslichkeit in Chlorid-Lösung von 1 mol/L: im Labor etwa 1e-4 mol/L, hier 6e-5. Mit dem vierten Komplex AgCl4^3- wären es
  // 2,7e-4 und in konzentrierter Salzsäure das Zehnfache des Laborwerts; deshalb ist er nicht eingetragen.
  const brine = real([{ reagent: "NaCl 1M", ml: 20 }, { reagent: "AgNO3 0.01M", ml: 1 }]);
  assert.ok(amount(brine, "AgCl(s)") > 5e-6, "in Kochsalzlösung 1 mol/L bleibt Niederschlag liegen");
  near(inSolution(brine, ["Ag+(aq)", "AgCl(aq)", "AgCl2-(aq)", "AgCl3^2-(aq)"]), 6.2e-5, 0.6e-5, "gelöstes Silber in Kochsalzlösung 1 mol/L");
  // in verdünnter Kochsalzlösung bleibt er liegen; das Massenwirkungsgesetz des Dichloro-Komplexes gilt für die Aktivitäten
  const salt = real([{ reagent: "NaCl 0.1M", ml: 20 }, { reagent: "AgNO3 0.01M", ml: 1 }]);
  assert.ok(amount(salt, "AgCl(s)") > 9.8e-6, `in Kochsalzlösung 0,1 mol/L fällt fast alles aus (${amount(salt, "AgCl(s)")} mol)`);
  near(Math.log10(act(salt, "AgCl2-(aq)")) - Math.log10(act(salt, "Ag+(aq)")) - 2 * Math.log10(act(salt, "Cl-(aq)")), 5.25, 1e-6, "lg β2 = 5,25");
  near(Math.log10(act(salt, "Ag+(aq)")) + Math.log10(act(salt, "Cl-(aq)")), -9.75, 1e-6, "gesättigt");
});

test("Reales Modell: Carbonat-Ionenpaare – Massenwirkungsgesetz, und die Eichlösung stimmt weiter", () => {
  const hard = real([{ reagent: "CaCl2 0.01M", ml: 10 }, { reagent: "NaHCO3 0.01M", ml: 10 }]);
  near(Math.log10(act(hard, "CaHCO3+(aq)")) - Math.log10(act(hard, "Ca^2+(aq)")) - Math.log10(act(hard, "H+(aq)")) - Math.log10(act(hard, "CO3^2-(aq)")), 11.599, 1e-6, "Calciumhydrogencarbonat-Ionenpaar");
  near(Math.log10(act(hard, "CaCO3(aq)")) - Math.log10(act(hard, "Ca^2+(aq)")) - Math.log10(act(hard, "CO3^2-(aq)")), 3.2, 1e-6, "Calciumcarbonat-Ionenpaar");
  // die Carbonat-Eichlösung (pH 10,012 bei 25 °C) bleibt auf 0,005 getroffen: Paare mit Natrium sind nicht eingetragen
  near(look(real([{ reagent: "NaHCO3 0.05M", ml: 10 }, { reagent: "Na2CO3 0.05M", ml: 10 }])).pH, 10.012, 0.005, "Carbonatpuffer");
  assert.equal(hard.failed || 0, 0);
});

// ================================================================ Unterricht: Aufgaben, Sperren, Messwerttabelle, Aufbau als Text

test("Aufgabe: Text und Ziele werden geprüft übernommen", () => {
  const c = L.normalize({ bench: [{ type: "beaker", id: "b" }], lock: true, table: true, task: { text: "Neutralisiere die Säure.", goals: [
    { measure: "pH", min: 6.5, max: 7.5, in: "b", label: "pH-Wert zwischen 6,5 und 7,5" },
    { has: "AgCl(s)" },
    { has: "Mg(s)", max: 0 },
    { seen: "pop" },
    { seen: "color", name: "blue", in: "b" }
  ] } });
  assert.equal(c.lock, true);
  assert.equal(c.table, true);
  assert.equal(c.task.text, "Neutralisiere die Säure.");
  assert.deepEqual(c.task.goals, [
    { measure: "pH", min: 6.5, max: 7.5, in: "b", label: "pH-Wert zwischen 6,5 und 7,5" },
    { has: "AgCl(s)", min: 1e-6 },
    { has: "Mg(s)", max: 0 },
    { seen: "pop" },
    { seen: "color", name: "blue", in: "b" }
  ]);
  const plain = L.normalize({});
  assert.equal(plain.lock, false);
  assert.equal(plain.table, false);
  assert.equal(plain.task, null);
  assert.deepEqual(L.normalize({ task: "Beobachte." }).task, { text: "Beobachte.", goals: [] }, "ein bloßer Text ist eine Aufgabe ohne Ziele");
});

test("Aufgabe: Fehler in den Zielen ergeben einen Hinweis mit dem Grund", () => {
  const bad = (task) => assert.throws(() => L.normalize({ task }), (e) => e.code === "task", JSON.stringify(task));
  bad({ goals: [{ measure: "Druck", min: 1 }] });
  bad({ goals: [{ measure: "pH" }] });
  bad({ goals: [{ measure: "pH", min: "sieben" }] });
  bad({ goals: [{ has: "Gold(s)" }] });
  bad({ goals: [{ has: "AgCl(s)", min: -1 }] });
  bad({ goals: [{ seen: "Wunder" }] });
  bad({ goals: [{ seen: "color", name: "lila" }] });
  bad({ goals: [{ seen: "solid", species: "Gold(s)" }] });
  bad({ goals: [{ measure: "pH", min: 7, in: "<b>" }] });
  bad({ goals: [{}] });
  bad({ goals: "alle" });
  bad(17);
});

test("Aufgabe: Messwert, Stoff und Beobachtung werden am Zustand geprüft", () => {
  const config = L.normalize({ room: 25, bench: [
    { type: "beaker", id: "b", contains: [{ reagent: "HCl 0.1M", ml: 20 }] }, { type: "phmeter", id: "ph", in: "b" },
    { type: "testtube", id: "t", contains: [{ reagent: "HCl 1M", ml: 8 }] }
  ], task: { text: "", goals: [
    { measure: "pH", min: 6, max: 8 }, { measure: "pH", min: 6, max: 8, in: "t" }, { has: "Mg(s)", in: "t" }, { has: "Mg(s)", in: "t", max: 0 }, { seen: "pop" }, { seen: "pop", in: "b" }
  ] } });
  const run = L.createRun(config);
  const check = () => L.checkTask(config.task, run.lab, L.logAt(run));
  assert.deepEqual(check(), { goals: [false, false, false, true, false, false], done: false });
  L.act(run, (l) => L.add(l, "b", "NaOH 0.1M", { ml: 20 }));
  L.act(run, (l) => L.add(l, "t", "Mg ribbon", { g: 0.0104 }));
  L.advance(run, 20);
  assert.deepEqual(check().goals.slice(0, 4), [true, false, true, false], "neutral im Becherglas; Magnesium im Reagenzglas");
  L.act(run, (l, emit) => L.probe(l, "t", "flame", emit));
  assert.deepEqual(check().goals.slice(4), [true, false], "Knallgasprobe im Reagenzglas, nicht im Becherglas");
  L.advance(run, 300);
  assert.equal(check().goals[3], true, "das Magnesium ist aufgebraucht");
  L.seek(run, 0);
  assert.deepEqual(check().goals, [false, false, false, true, false, false], "zurückgespult gilt der Zustand am Zeiger");
});

const neutral = { room: 25, bench: [{ type: "beaker", id: "b", contains: [{ reagent: "HCl 0.1M", ml: 20 }] }, { type: "phmeter", id: "ph", in: "b" }],
  shelf: ["NaOH 0.1M", "H2O"],
  task: { text: "Neutralisiere die Salzsäure mit Natronlauge.", goals: [{ measure: "pH", min: 6, max: 8, in: "b" }, { has: "Na+(aq)", label: "Natrium-Ionen sind in der Lösung" }] } };

test("Oberfläche: die Aufgabe steht über der Fläche, ihre Ziele werden abgehakt", () => {
  const el = mount(neutral), box = part(el, ".cl-task");
  assert.equal(box.hidden, false);
  assert.equal(part(box, ".cl-task-text").textContent, "Aufgabe: Neutralisiere die Salzsäure mit Natronlauge.");
  const goals = () => part(box, ".cl-goals").innerHTML;
  assert.match(goals(), /pH-Wert von 6 bis 8 in Becherglas 1/, "Text aus dem Ziel");
  assert.match(goals(), /Natrium-Ionen sind in der Lösung/, "eigener Text");
  assert.equal((goals().match(/○/g) || []).length, 2);
  assert.match(goals(), /noch offen/, "für Vorleseprogramme");
  assert.equal(part(box, ".cl-done").textContent, "");
  press(el, "hand", "NaOH 0.1M");
  press(el, "more"); press(el, "more");                        // 20 mL
  tap(el, "b");
  frames(30);
  assert.equal((goals().match(/✓/g) || []).length, 2, goals());
  assert.equal(part(box, ".cl-done").textContent, "Geschafft!");
  press(el, "start");
  assert.equal((goals().match(/✓/g) || []).length, 0, "zurückgespult: die Ziele zeigen den Zustand am Zeiger");
  assert.equal(part(box, ".cl-done").textContent, "Geschafft!", "… geschafft bleibt geschafft");
  press(el, "reset");
  assert.equal(part(box, ".cl-done").textContent, "", "Zurücksetzen fängt von vorn an");
});

test("Oberfläche: ohne Aufgabe kein Feld dafür; eine fehlerhafte Aufgabe ergibt einen Hinweis", () => {
  assert.equal(part(mount(tube), ".cl-task").hidden, true);
  const broken = mount({ task: { goals: [{ measure: "Druck", min: 1 }] } });
  assert.match(broken.innerHTML, /role="alert"/);
  assert.match(broken.innerHTML, /Die Aufgabe lässt sich nicht lesen: measure Druck/);
});

test("Aufgabe: Ziele als Text in beiden Sprachen", () => {
  const say = (goal, lang) => L.goalText(goal, lang || "de", { b: "Becherglas 1" });
  assert.equal(say({ measure: "T", min: 40 }), "Temperatur mindestens 40 °C");
  assert.equal(say({ measure: "kappa", max: 0.5, in: "b" }), "Leitfähigkeit höchstens 0,5 mS/cm in Becherglas 1");
  assert.equal(say({ measure: "V", min: 20, max: 30 }), "Gasvolumen von 20 bis 30 mL");
  assert.equal(say({ has: "AgCl(s)", min: 1e-6 }), "Silberchlorid liegt vor");
  assert.equal(say({ has: "Mg(s)", max: 0, in: "b" }), "Magnesium: nicht mehr vorhanden in Becherglas 1");
  assert.equal(say({ has: "Cu(s)", min: 0.001 }), "Kupfer: mindestens 1,00 mmol");
  assert.equal(say({ seen: "pop" }), "Knallgasprobe: Es knallt");
  assert.equal(say({ seen: "solid", species: "AgCl(s)" }), "Niederschlag: Silberchlorid");
  assert.equal(say({ seen: "color", name: "blue", in: "b" }), "Die Lösung wird blau in Becherglas 1");
  assert.equal(say({ seen: "relight" }, "en"), "Glowing splint: it flares up");
  assert.equal(say({ measure: "pH", min: 6, max: 8 }, "en"), "pH from 6 to 8");
  for (const seen of ["gas", "pop", "relight", "out", "solid", "dissolved", "color", "boil", "smell", "ignite", "flame", "plated", "lamp", "broken"])
    for (const lang of ["de", "en"]) assert.doesNotMatch(say({ seen }, lang), /goal\./, seen + " " + lang);
});

test("Oberfläche: gesperrt bleiben die Geräte stehen; Stoffe zugeben und bedienen geht", () => {
  const locked = { lock: true, bench: [{ type: "beaker", id: "b", contains: [{ reagent: "H2O", ml: 50 }] }, { type: "burner", id: "br", under: "b" }, { type: "thermometer", id: "th", in: "b" }],
    shelf: ["HCl 1M", "beaker", "thermometer", "splint", "electrode-Cu"] };
  const el = mount(locked);
  const shelf = part(el, ".cl-shelf").innerHTML;
  assert.match(shelf, /data-id="HCl 1M"/);
  assert.match(shelf, /data-id="splint"/, "Proben bleiben: sie stehen nicht auf dem Tisch");
  for (const id of ["beaker", "thermometer", "electrode-Cu"]) assert.doesNotMatch(shelf, new RegExp(`data-id="${id}"`), id);
  press(el, "hand", "beaker");
  assert.equal(state(el).run.lab.vessels.length, 1, "kein neues Gefäß");
  tap(el, "b");
  assert.doesNotMatch(part(el, ".cl-panel").innerHTML, /data-act="remove"/, "nichts zum Wegräumen");
  assert.match(part(el, ".cl-panel").innerHTML, /data-act="empty"/, "ausleeren geht");
  press(el, "remove");
  assert.ok(L.vessel(state(el).run.lab, "b"), "das Becherglas steht noch");
  tap(el, "br");
  assert.doesNotMatch(part(el, ".cl-panel").innerHTML, /data-act="remove"/);
  press(el, "flame", "2");
  assert.equal(L.tool(state(el).run.lab, "br").flame, 2, "der Brenner lässt sich anzünden");
  press(el, "hand", "HCl 1M");
  tap(el, "b");
  assert.ok(amount(state(el).run.lab, "Cl-(aq)") > 0 || state(el).run.lab.flows.length, "Säure fließt zu");
  // ohne eigene Auswahl zeigt das gesperrte Regal alle Stoffe und die Proben, aber keine Geräte
  const all = part(mount({ lock: true }), ".cl-shelf").innerHTML;
  assert.match(all, /data-id="Mg ribbon"/);
  assert.match(all, /data-id="glowsplint"/);
  for (const id of ["beaker", "burner", "supply", "electrode-C"]) assert.doesNotMatch(all, new RegExp(`data-id="${id}"`), id);
});

const titrated = { room: 25, table: true, bench: [
  { type: "beaker", id: "b", contains: [{ reagent: "HCl 0.1M", ml: 20 }] }, { type: "phmeter", id: "ph", in: "b" }, { type: "thermometer", id: "th", in: "b" },
  { type: "burette", id: "bu", over: "b", contains: [{ reagent: "NaOH 0.1M", ml: 30 }] }] };

test("Oberfläche: Messwerttabelle – „Messwerte notieren“ hängt eine Zeile mit allen Anzeigen an", () => {
  const el = mount(titrated), box = part(el, ".cl-readings");
  assert.equal(box.hidden, false);
  assert.match(box.innerHTML, /data-act="note"/);
  assert.match(box.innerHTML, /data-act="clear"[^>]*disabled/, "leere Tabelle: nichts zu leeren");
  assert.doesNotMatch(box.innerHTML, /<table/);
  press(el, "note");
  const head = /<thead>(.*?)<\/thead>/.exec(box.innerHTML)[1];
  assert.deepEqual([...head.matchAll(/<th scope="col">(.*?)<\/th>/g)].map((m) => m[1]),
    ["Nr.", "t (s)", "pH-Meter 1 (pH)", "Thermometer 1 (°C)", "Bürette 1: abgegeben (mL)"]);
  assert.match(box.innerHTML, /<tr><td>1<\/td><td>0,0<\/td><td>1,00<\/td><td>25,0<\/td><td>0,0<\/td><\/tr>/);
  tap(el, "bu");
  press(el, "tap", "2");                                       // schnell: 2 mL/s
  frames(5);
  press(el, "tap", "0");
  frames(10);
  press(el, "note");
  const second = /<tr><td>2<\/td><td>([\d,]+)<\/td><td>([\d,]+)<\/td><td>[\d,]+<\/td><td>([\d,]+)<\/td><\/tr>/.exec(box.innerHTML);
  assert.ok(second, box.innerHTML);
  near(+second[3].replace(",", "."), 10, 0.3, "abgegeben");
  near(+second[2].replace(",", "."), 1.48, 0.02, "pH nach 10 mL Natronlauge");
  assert.equal(state(el).rows.length, 2);
  press(el, "reset");
  assert.equal(state(el).rows.length, 2, "die Notizen bleiben beim Zurücksetzen");
  press(el, "clear");
  assert.equal(state(el).rows.length, 0);
  assert.doesNotMatch(box.innerHTML, /<table/);
});

test("Oberfläche: Messwerttabelle nur auf Wunsch und nur mit Zahlen; ohne Messgerät ein Hinweis", () => {
  assert.equal(part(mount(tube), ".cl-readings").hidden, true);
  assert.equal(part(mount(Object.assign({}, titrated, { show: { numbers: false } })), ".cl-readings").hidden, true);
  const el = mount({ table: true, bench: [{ type: "beaker", id: "b" }] });
  press(el, "note");
  assert.equal(state(el).rows.length, 0);
  assert.match(part(el, ".cl-status").textContent, /Kein Messgerät/);
});

test("Aufbau als Text: Geräte, wie sie stehen, und was in die Gefäße gegeben wurde", () => {
  const raw = { room: 25, shelf: ["H2O", "BTB"], task: "Beobachte.", bench: [
    { type: "beaker", id: "b", ml: 250, contains: [{ reagent: "HCl 0.1M", ml: 20 }] },
    { type: "burette", id: "bu", over: "b", contains: [{ reagent: "NaOH 0.1M", ml: 30 }] },
    { type: "burner", id: "br", under: "b", flame: 1 }, { type: "phmeter", in: "b" }] };
  const run = L.createRun(L.normalize(raw));
  L.act(run, (l) => L.add(l, "b", "H2O", { ml: 9.85 }), { key: "added", vessel: "b", reagent: "H2O", ml: 9.85 });
  L.act(run, (l) => L.add(l, "b", "BTB", { drops: 3 }), { key: "added", vessel: "b", reagent: "BTB", drops: 3 });
  L.act(run, (l) => L.place(l, { type: "testtube" }));
  L.act(run, (l) => L.place(l, { type: "thermometer", in: "testtube1" }));
  L.act(run, (l) => L.setFlame(l, "br", 2));
  L.act(run, (l) => L.setTap(l, "bu", 2));
  L.advance(run, 3);
  L.act(run, (l) => L.setTap(l, "bu", 0));
  L.advance(run, 5);
  // halb so viel, wie hineingegeben wurde (was aus der Bürette tropfte, zählt nicht dazu)
  L.act(run, (l) => L.pour(l, "b", "testtube1", 15), { key: "poured", from: "b", vessel: "testtube1", ml: 15 });
  const text = L.describe(run, raw), d = JSON.parse(text);
  assert.match(text, /^\{"bench":\[\n  \{/, "ein Gerät je Zeile");
  assert.deepEqual(d.bench, [
    { type: "beaker", id: "b", ml: 250, contains: [{ reagent: "HCl 0.1M", ml: 10 }, { reagent: "H2O", ml: 4.925 }, { reagent: "BTB", drops: 1.5 }] },
    { type: "burette", id: "bu", over: "b", contains: [{ reagent: "NaOH 0.1M", ml: 30 }] },
    { type: "testtube", id: "testtube1", contains: [{ reagent: "HCl 0.1M", ml: 10 }, { reagent: "H2O", ml: 4.925 }, { reagent: "BTB", drops: 1.5 }] },
    { type: "burner", id: "br", under: "b", flame: 2 },
    { type: "phmeter", id: "phmeter1", in: "b" },
    { type: "thermometer", id: "thermometer1", in: "testtube1" }
  ]);
  assert.deepEqual([d.room, d.shelf, d.task], [25, ["H2O", "BTB"], "Beobachte."], "der Rest der Beschreibung bleibt, wie er war");
  const again = L.createLab(L.normalize(text));
  assert.deepEqual(again.vessels.map((v) => v.id), ["b", "bu", "testtube1"]);
  near(L.volume(L.vessel(again, "testtube1")) * 1000, 15, 0.1, "der Text lässt sich wieder einlesen");
});

test("Aufbau als Text: Ausleeren und Wegräumen; ein zersprungenes Glas fehlt", () => {
  const raw = { bench: [{ type: "testtube", id: "a", contains: [{ reagent: "HCl 1M", ml: 5 }] }, { type: "testtube", id: "c", contains: [{ reagent: "NaOH 1M", ml: 5 }] }, { type: "beaker", id: "d" }] };
  const run = L.createRun(L.normalize(raw));
  L.act(run, (l) => L.empty(l, "a"), { key: "emptied", vessel: "a" });
  L.act(run, (l) => L.remove(l, "c"), { key: "removed", part: "c" });
  L.vessel(run.lab, "d").broken = true;
  assert.deepEqual(JSON.parse(L.describe(run, raw)).bench, [{ type: "testtube", id: "a", contains: [] }]);
});

test("Oberfläche: „Aufbau kopieren“ legt den Text in die Zwischenablage und zeigt ihn zum Markieren", () => {
  let copied = null;
  const saved = Object.getOwnPropertyDescriptor(globalThis, "navigator");
  Object.defineProperty(globalThis, "navigator", { value: { clipboard: { writeText: (t) => { copied = t; return Promise.resolve(); } } }, configurable: true });
  try {
    const el = mount(tube);
    assert.match(part(el, ".cl-top").innerHTML || el.innerHTML, /data-act="copy"/);
    press(el, "copy");
    assert.equal(copied, L.describe(state(el).run, tube));
    assert.match(part(el, ".cl-panel").innerHTML, /<textarea class="cl-copy" readonly/);
    assert.match(part(el, ".cl-panel").innerHTML, /&quot;bench&quot;/);
    tap(el, "rg");
    assert.doesNotMatch(part(el, ".cl-panel").innerHTML, /cl-copy/, "wer etwas antippt, sieht wieder dessen Feld");
  } finally { if (saved) Object.defineProperty(globalThis, "navigator", saved); else delete globalThis.navigator; }
});

test("Oberfläche: Messwerttabelle als Text mit Tabulatoren kopieren", () => {
  let copied = null;
  const saved = Object.getOwnPropertyDescriptor(globalThis, "navigator");
  Object.defineProperty(globalThis, "navigator", { value: { clipboard: { writeText: (t) => { copied = t; return Promise.resolve(); } } }, configurable: true });
  try {
    const el = mount(titrated);
    press(el, "note");
    assert.match(part(el, ".cl-readings").innerHTML, /data-act="copyTable"/);
    press(el, "copyTable");
    assert.equal(copied, "Nr.\tt (s)\tpH-Meter 1 (pH)\tThermometer 1 (°C)\tBürette 1: abgegeben (mL)\n1\t0,0\t1,00\t25,0\t0,0");
    assert.match(part(el, ".cl-panel").innerHTML, /Die Messwerte, durch Tabulatoren getrennt/);
  } finally { if (saved) Object.defineProperty(globalThis, "navigator", saved); else delete globalThis.navigator; }
});

const slide = (title) => {
  const readme = fs.readFileSync(new URL("README.md", here), "utf8"), at = readme.indexOf("\n## " + title + "\n");
  assert.ok(at > 0, "Folie " + title);
  const end = readme.indexOf("\n## ", at + 5);
  return [...readme.slice(at, end).matchAll(/```+ *json +@ChemLab\.sim\n([\s\S]*?)\n```+/g)].map((m) => m[1]);
};

test("README: die Aufgaben der Folien lassen sich lösen, so wie ihr Text es sagt", () => {
  const [silver, heat] = slide("Aufgaben mit Selbstkontrolle").map((b) => L.normalize(b));
  const done = (config, run) => L.checkTask(config.task, run.lab, L.logAt(run));
  // Silberchlorid: 5 mL Silbernitrat (die Menge, die das Regal zuerst anbietet), dann 5 mL Ammoniaklösung
  let run = L.createRun(silver), t = silver.bench[0].id;
  for (const reagent of ["AgNO3 0.1M", "NH3 2M"]) {
    assert.ok(silver.shelf.includes(reagent), reagent);
    L.act(run, (l) => L.add(l, t, reagent, { ml: 5 }), { key: "added", vessel: t, reagent, ml: 5 });
    L.advance(run, 30);
  }
  assert.equal(done(silver, run).done, true, JSON.stringify(done(silver, run)));
  // Wasser erhitzen: Brenner an, bei 60 °C aus – es bleibt unter 70 °C
  assert.equal(heat.lock, true);
  run = L.createRun(heat);
  const burner = heat.bench.find((p) => p.type === "burner").id, th = heat.bench.find((p) => p.type === "thermometer").id;
  L.act(run, (l) => L.setFlame(l, burner, 2));
  while (L.reading(run.lab, th).value < 60) L.advance(run, 0.5);
  L.act(run, (l) => L.setFlame(l, burner, 0));
  for (let i = 0; i < 60; i++) { L.advance(run, 1); assert.equal(done(heat, run).done, true, `nach ${i} s: ${L.reading(run.lab, th).value} °C`); }
  // Messwerttabelle: gesperrt, mit Tabelle, Bürette über dem Becherglas mit pH-Meter
  const [table] = slide("Sperren und Messwerttabelle").map((b) => L.normalize(b));
  assert.deepEqual([table.lock, table.table], [true, true]);
  assert.ok(table.bench.some((p) => p.type === "burette" && p.over) && table.bench.some((p) => p.type === "phmeter"));
  assert.equal(slide("Aufbau als Text kopieren").length, 1);
});

test("Oberfläche: ein leeres Regal erscheint gar nicht", () => {
  assert.equal(part(mount({ shelf: [] }), ".cl-shelf").hidden, true);
  assert.equal(part(mount({ lock: true, shelf: ["beaker"] }), ".cl-shelf").hidden, true, "gesperrt bleibt von diesem Regal nichts");
  assert.equal(part(mount(tube), ".cl-shelf").hidden, false);
});

// ================================================================ Pakete und eigene Daten für den ganzen Kurs

const gallium = { species: {
    "Ga(s)": { name: { de: "Gallium", en: "gallium" }, Hf: 0, S: 40.83, src: "CODATA Key Values" },
    "Ga^3+(aq)": { name: { de: "Gallium-Ion", en: "gallium ion" }, Hf: -211.7, S: -331, src: "Test" } },
  couples: [{ eq: "Ga^3+(aq) + 3 e- <=> Ga(s)", E0: -0.549, src: "Test" }],
  reagents: { "Ga granules": { name: { de: "Gallium (Körner)", en: "gallium granules" }, solid: "Ga(s)", area: 6 } } };
const indium = { about: "Testpaket", species: {
    "In(s)": { name: { de: "Indium", en: "indium" }, Hf: 0, S: 57.82, src: "Test" },
    "In^3+(aq)": { name: { de: "Indium-Ion", en: "indium ion" }, Hf: -105, S: -151, src: "Test" } },
  couples: [{ eq: "In^3+(aq) + 3 e- <=> In(s)", E0: -0.338, src: "Test" }],
  reagents: { "In granules": { name: { de: "Indium (Körner)", en: "indium granules" }, solid: "In(s)", area: 6 } } };
const settleAll = async () => { for (let i = 0; i < 5; i++) await new Promise((r) => setTimeout(r, 0)); };
const fakeFetch = (files) => async (url) => (url in files
  ? { ok: true, status: 200, json: async () => { if (typeof files[url] === "string") throw new SyntaxError("Unexpected token"); return files[url]; } }
  : { ok: false, status: 404, json: async () => ({}) });

test("@ChemLab.data: eigene Daten gelten ab ihrer Folie für alle Flächen des Kurses", () => {
  const note = node();
  L.useData(note, "```\n" + JSON.stringify(gallium) + "\n```");
  assert.match(note.innerHTML, /Eigene Daten eingetragen: 2 Stoffe, 1 Redoxpaar, 1 Vorrat/);
  assert.doesNotMatch(note.innerHTML, /role="alert"/);
  const el = mount({ bench: [{ type: "testtube", id: "t", contains: [{ reagent: "HCl 1M", ml: 5 }, { reagent: "Ga granules", g: 0.1 }] }] });
  assert.doesNotMatch(el.innerHTML, /role="alert"/, "eine andere Fläche kennt das Gallium");
  const bad = node();
  L.useData(bad, '{"species":{"Xy(s)":{"Hf":0}}}');
  assert.match(bad.innerHTML, /role="alert"/);
  assert.match(bad.innerHTML, /Fehler in den eigenen Stoffdaten/);
  L.useData(bad, "{kein json");
  assert.match(bad.innerHTML, /kein gültiges JSON/);
});

test("@ChemLab.pack: ein Paket wird geladen; Flächen warten, solange es lädt", async () => {
  const url = "https://example.org/packs/indium.json", saved = globalThis.fetch;
  globalThis.fetch = fakeFetch({ [url]: indium, "https://example.org/kaputt.json": "{" });
  try {
    const note = node();
    L.usePack(note, url);
    assert.match(note.innerHTML, /Paket wird geladen/);
    assert.equal(L.loaded(), false, "solange ein Paket lädt, warten die Flächen");
    await settleAll();
    assert.equal(L.loaded(), true);
    assert.match(note.innerHTML, /Paket geladen: Testpaket – 2 Stoffe, 1 Redoxpaar, 1 Vorrat/);
    assert.ok(L.db.reagents["In granules"]);
    L.usePack(note, url);
    await settleAll();
    assert.match(note.innerHTML, /Paket geladen/, "ein zweites Mal ist kein Fehler");
    for (const [where, why] of [["https://example.org/fehlt.json", /404/], ["https://example.org/kaputt.json", /kein gültiges JSON/]]) {
      L.usePack(note, where);
      await settleAll();
      assert.match(note.innerHTML, /role="alert"/, where);
      assert.match(note.innerHTML, why, where);
      assert.ok(note.innerHTML.includes(where), "die Adresse steht dabei");
      assert.equal(L.loaded(), true, "ein gescheitertes Paket hält niemanden auf");
    }
  } finally { globalThis.fetch = saved; }
});

test("packs: eine Fläche lädt ihre Pakete selbst, bevor sie den Aufbau liest", async () => {
  const url = "https://example.org/packs/bismuth.json", saved = globalThis.fetch;
  const bismuth = { species: { "Bi(s)": { name: { de: "Bismut", en: "bismuth" }, Hf: 0, S: 56.74, src: "Test" } },
    reagents: { "Bi granules": { name: { de: "Bismut (Körner)", en: "bismuth granules" }, solid: "Bi(s)", area: 6 } } };
  globalThis.fetch = fakeFetch({ [url]: bismuth });
  try {
    const source = { packs: [url], bench: [{ type: "beaker", id: "b", contains: [{ reagent: "H2O", ml: 20 }, { reagent: "Bi granules", g: 1 }] }] };
    const el = mount(source);
    assert.match(el.innerHTML, /Pakete werden geladen/);
    await settleAll();
    assert.doesNotMatch(el.innerHTML, /role="alert"/);
    assert.ok(L.vessel(state(el).run.lab, "b").n["Bi(s)"] > 0, "der Aufbau steht, mit dem Stoff aus dem Paket");
    assert.deepEqual(state(el).config.packs, [url]);
    const missing = mount({ packs: ["https://example.org/nichts.json"] });
    await settleAll();
    assert.match(missing.innerHTML, /role="alert"/);
    assert.match(missing.innerHTML, /Das Paket ließ sich nicht laden: https:\/\/example\.org\/nichts\.json/);
    for (const packs of ["https://example.org/a.json", ["packs/organic.json"], [17]])
      assert.throws(() => L.normalize({ packs }), (e) => e.code === "pack", JSON.stringify(packs));
  } finally { globalThis.fetch = saved; }
});

test("README: die Makros @ChemLab.data und @ChemLab.pack sind im Kopf erklärt und rufen den Baustein", () => {
  const readme = fs.readFileSync(new URL("README.md", here), "utf8"), head = readme.slice(0, readme.indexOf("-->"));
  assert.match(head, /^@ChemLab\.data: @ChemLab\.data_\(@uid,```@0```\)$/m);
  assert.match(head, /^@ChemLab\.pack: @ChemLab\.pack_\(@uid,@0\)$/m);
  const body = (name) => head.slice(head.indexOf("\n" + name + "\n"), head.indexOf("\n@end", head.indexOf("\n" + name + "\n")));
  assert.match(body("@ChemLab.data_"), /id="lia-chemlab-data-@0"/);
  assert.match(body("@ChemLab.data_"), /C\.useData\(el, `@'1`\)/);
  assert.match(body("@ChemLab.pack_"), /id="lia-chemlab-pack-@0"/);
  assert.match(body("@ChemLab.pack_"), /C\.usePack\(el, `@'1`\)/);
  for (const name of ["@ChemLab.data_", "@ChemLab.pack_"]) {
    assert.match(body(name), /<script modify="false">/, name);
    assert.match(body(name), /^""$/m, name + ": das Skript gibt nichts aus");
  }
});

// ================================================================ Organik: Stoffe mit Eigenvolumen, Sieden von Gemischen, Kühler, Veresterung

const organic = JSON.parse(fs.readFileSync(new URL("packs/organic.json", here), "utf8"));

test("Paket Organik: lädt ohne Fehler, jeder Eintrag nennt seine Quelle", () => {
  L.register(organic);
  assert.deepEqual(L.lint(organic), []);
  for (const [id, s] of Object.entries(organic.species)) assert.ok(s.src && s.name.de && s.name.en, id);
  for (const r of organic.reactions) assert.ok(r.src, r.eq);
});

test("Eigenvolumen (Vm): ein gelöster Stoff nimmt Platz ein, die Vorratsflasche enthält nur so viel Wasser, wie daneben Platz hat", () => {
  L.register(organic);
  const spirit = beaker([{ reagent: "ethanol", ml: 10 }]);
  near(look(spirit).ml, 10, 0.01, "10 mL Ethanol sind 10 mL");
  near(amount(spirit, "C2H5OH(aq)"), 0.1645, 1e-4);
  near(amount(spirit, "H2O(l)"), 10 * (1 - 16.45 * 58.37 / 1000) * 0.997 / 18.015, 1e-4, "vier Prozent Wasser");
  near(look(beaker([{ reagent: "ethanol", ml: 10 }, { reagent: "H2O", ml: 10 }])).ml, 20, 0.01, "die Volumina addieren sich");
  // Essigsäure hat jetzt ein Eigenvolumen: 1 mol/L enthält entsprechend weniger Wasser, das Volumen bleibt
  const acid = beaker([{ reagent: "CH3COOH 1M", ml: 10 }]);
  near(look(acid).ml, 10, 1e-9, "auch wenn ein Teil dissoziiert: das Acetat-Ion hat dasselbe Eigenvolumen");
  near(amount(acid, "H2O(l)"), 10 * (1 - 57.25 / 1000) * 0.997 / 18.015, 1e-6);
  near(look(beaker([{ reagent: "CH3COOH 0.1M", ml: 20 }])).pH, 2.88, 0.01, "der pH-Wert bleibt");
});

test("Eigene Daten: Vm, Tb, Hvap, mix und smell werden geprüft", () => {
  const bad = (entry) => assert.throws(() => L.register({ species: { "C3H8O(aq)": Object.assign({ name: { de: "x" }, Hf: null, src: "x" }, entry) } }),
    (e) => e.code === "data", JSON.stringify(entry));
  bad({ Vm: -1 });
  bad({ Vm: "viel" });
  bad({ Tb: "heiß" });
  bad({ Tb: 97 });                                             // ohne Hvap
  bad({ Tb: 97, Hvap: 0 });
  bad({ mix: [1, 1] });                                        // ohne Tb
  bad({ Tb: 97, Hvap: 40, mix: [1] });
  bad({ smell: "blumig" });
  assert.throws(() => L.register({ species: { "C3H8O(l)": { name: { de: "x" }, Hf: null, src: "x", Vm: 75 } } }), (e) => e.code === "data", "Vm nur für Gelöstes");
  assert.throws(() => L.register({ reagents: { "zu viel": { name: { de: "x" }, solution: { "C2H5OH(aq)": 20 } } } }), (e) => e.code === "data", "mehr als ein Liter je Liter");
  assert.throws(() => L.register({ reactions: [{ eq: "CH3COOC2H5(aq) + H2O(l) -> CH3COOH(aq) + C2H5OH(aq)", rate: { k: 1, order: { "H2O(g)": 1 } } }] }),
    (e) => e.code === "data", "die Ordnung gilt Gelöstem und Wasser");
});

const still = (contains, more) => lab([{ type: "flask", id: "k", contains }, { type: "burner", id: "br", under: "k", flame: 2 }, { type: "thermometer", id: "th", in: "k" },
  { type: "condenser", id: "c", in: "k", to: "v" }, { type: "beaker", id: "v" }], Object.assign({ room: 20 }, more));
const distillate = (l) => { const v = L.vessel(l, "v"); return { ml: L.volume(v) * 1000, ethanol: (v.n["C2H5OH(aq)"] || 0) * 58.37 / (L.volume(v) * 1000) }; };

test("Destillation: Wein siedet bei gut 91 °C, das erste Destillat hat über 45 % Alkohol", () => {
  L.register(organic);
  const l = still([{ reagent: "wine", ml: 50 }]), seen = [];
  const start = totals(l).mass;
  until(l, () => L.vessel(l, "k").boil > 0, 900, seen);
  near(L.vessel(l, "k").T, 91.5, 1.5, "Siedetemperatur");
  until(l, () => distillate(l).ml >= 3, 900);
  assert.ok(distillate(l).ethanol > 0.45, `erstes Destillat: ${(100 * distillate(l).ethanol).toFixed(0)} % Ethanol`);
  near(totals(l).mass, start, 1e-6, "nichts geht verloren: was verdampft, ist in der Vorlage");
  until(l, () => distillate(l).ml >= 20, 3000);
  assert.ok(L.vessel(l, "k").T > 97, `gegen Ende fast nur noch Wasser: ${L.vessel(l, "k").T.toFixed(1)} °C`);
  assert.ok(seen.some((e) => e.key === "boil"), "das Protokoll meldet das Sieden");
});

test("Destillation: Ethanol 96 % siedet bei 78 °C, reines Wasser weiter bei 100 °C", () => {
  L.register(organic);
  const spirit = still([{ reagent: "ethanol", ml: 30 }]);
  until(spirit, () => L.vessel(spirit, "k").boil > 0, 900);
  near(L.vessel(spirit, "k").T, 78.2, 0.6, "Ethanol 96 %");
  const water = still([{ reagent: "H2O", ml: 30 }]);
  until(water, () => L.vessel(water, "k").boil > 0, 900);
  near(L.vessel(water, "k").T, 100, 0.05, "Wasser");
  until(water, () => distillate(water).ml >= 2, 900);
  assert.deepEqual(Object.entries(L.vessel(water, "v").n).filter(([, n]) => n > 1e-8).map(([id]) => id), ["H2O(l)"], "das Destillat ist Wasser (mit seinen Ionen in Spuren)");
  near(L.vessel(water, "v").T, 20, 3, "der Kühler kühlt das Destillat auf Raumtemperatur");
});

test("Sieden ohne Kühler: der Dampf entweicht, das Ethanol zuerst", () => {
  L.register(organic);
  const l = lab([{ type: "beaker", id: "b", contains: [{ reagent: "wine", ml: 50 }] }, { type: "burner", id: "br", under: "b", flame: 2 }]);
  const before = amount(l, "C2H5OH(aq)");
  until(l, () => L.view(l, L.vessel(l, "b")).ml < 40, 3000);
  assert.ok(amount(l, "C2H5OH(aq)") < 0.5 * before, `ein Fünftel verdampft, mehr als die Hälfte des Alkohols ist fort (${(amount(l, "C2H5OH(aq)") / before).toFixed(2)})`);
});

test("Kühler: Beschreibung mit in und to, Fehler und Aufbau als Text", () => {
  L.register(organic);
  const c = L.normalize({ bench: [{ type: "flask", id: "k" }, { type: "condenser", in: "k", to: "v" }, { type: "beaker", id: "v" }] });
  assert.deepEqual(c.bench[1], { type: "condenser", id: "condenser1", in: "k", to: "v" });
  for (const bench of [
    [{ type: "flask", id: "k" }, { type: "condenser", in: "k", to: "k" }],
    [{ type: "flask", id: "k" }, { type: "condenser", in: "k", to: "x" }],
    [{ type: "flask", id: "k" }, { type: "beaker", id: "v" }, { type: "condenser", in: "k", to: "v" }, { type: "condenser", in: "k", to: "v" }]
  ]) assert.throws(() => L.normalize({ bench }), (e) => e.code === "place", JSON.stringify(bench));
  const run = L.createRun(c);
  assert.match(L.describe(run, {}), /\{"type":"condenser","id":"condenser1","in":"k","to":"v"\}/);
  const placed = L.createLab(L.normalize({ bench: [{ type: "flask", id: "k" }, { type: "beaker", id: "v" }] }));
  const id = L.place(placed, { type: "condenser", in: "k", to: "v" });
  assert.deepEqual([L.tool(placed, id).in, L.tool(placed, id).to], ["k", "v"]);
});

// wie im Messbericht: je 10 mL Ethanol und Eisessig mit 5 Tropfen Schwefelsäure; im Reagenzglas die Hälfte mit 3 Tropfen
const esterMix = (acid, more, bath) => {
  L.register(organic);
  const small = bath != null, ml = small ? 5 : 10;
  const contains = [{ reagent: "ethanol", ml }, { reagent: "glacial acetic acid", ml }].concat(acid ? [{ reagent: "sulfuric acid conc", drops: small ? 3 : 5 }] : []);
  return lab([{ type: small ? "testtube" : "beaker", id: "b", contains }].concat(small ? [{ type: "bath", id: "wb", under: "b", temp: bath }] : []), Object.assign({ room: 25 }, more));
};
const conc = (l, id) => amount(l, id) / L.volume(L.vessel(l, "b"));

test("Veresterung: Anfangsgeschwindigkeit wie gemessen, mit Schwefelsäure etwa zwanzigmal schneller", () => {
  const rate = (l) => { const a = amount(l, "CH3COOC2H5(aq)"); L.step(l, 10); return (amount(l, "CH3COOC2H5(aq)") - a) / 10 / L.volume(L.vessel(l, "b")); };
  const fast = esterMix(true), slow = esterMix(false);
  const kFast = rate(fast) / (conc(fast, "CH3COOH(aq)") * conc(fast, "C2H5OH(aq)")), kSlow = rate(slow) / (conc(slow, "CH3COOH(aq)") * conc(slow, "C2H5OH(aq)"));
  near(kFast, 2.78e-5, 0.1e-5, "k mit 5 Tropfen Schwefelsäure bei 25 °C (Messwert 2,3·10⁻⁵ bei 22 °C)");
  near(kFast / kSlow, 19, 3, "ohne Schwefelsäure katalysiert nur die Essigsäure selbst");
});

test("Veresterung: im Wasserbad von 70 °C stellt sich das Gleichgewicht mit K = 4 ein, und es riecht fruchtig", () => {
  const l = esterMix(true, {}, 70), seen = [];
  L.step(l, 3600, (e) => seen.push(e));
  const K = conc(l, "CH3COOC2H5(aq)") * conc(l, "H2O(l)") / (conc(l, "CH3COOH(aq)") * conc(l, "C2H5OH(aq)"));
  near(K, 4, 0.15, "Gleichgewichtskonstante");
  const ester = amount(l, "CH3COOC2H5(aq)");
  near(ester / 0.08225, 0.62, 0.04, "gut sechzig Prozent des Ethanols sind verestert");
  const smell = seen.find((e) => e.key === "smell" && e.species === "CH3COOC2H5(aq)");
  assert.ok(smell, "Geruch nach dem Ester");
  assert.equal(L.say(smell, { lang: "de", names: { b: "Reagenzglas 1" } }), "Reagenzglas 1: Es riecht fruchtig nach Ethylacetat (Essigsäureethylester).");
  assert.equal(L.say(smell, { lang: "en", names: { b: "test tube 1" } }), "test tube 1: There is a fruity smell of ethyl acetate.");
  assert.ok(!(L.vessel(l, "b").boil > 0), "bei 70 °C siedet die Mischung nicht");
  assert.ok(L.reactions(l, "b").some((r) => /CH3COOC2H5/.test(r.eq) && r.catalysts.includes("H+(aq)")), "die Gleichung nennt den Katalysator");
});

test("Zeichnung: Rundkolben mit Flüssigkeit, Kühler zwischen zwei Gefäßen, mit Tropfen beim Destillieren", () => {
  L.register(organic);
  const l = still([{ reagent: "wine", ml: 50 }]), flask = L.view(l, L.vessel(l, "k"));
  const drawn = L.parts.flask.draw(flask, ctx());
  clean(drawn, "Rundkolben");
  assert.match(drawn, /class="cl-liquid"/);
  assert.match(drawn, /class="cl-glass"/);
  assert.ok(L.parts.flask.surface(flask) < L.parts.flask.surface(L.view(beakerLab = lab([{ type: "flask", id: "k", contains: [{ reagent: "H2O", ml: 10 }] }]), L.vessel(beakerLab, "k"))), "mehr Flüssigkeit steht höher");
  const place = { x1: 9, y1: -112, x2: 150, y2: -96, s2: -10 };
  const off = L.parts.condenser.draw(L.reading(l, "c"), ctx(), place);
  clean(off, "Kühler");
  assert.match(off, /class="cl-jacket"/);
  assert.doesNotMatch(off, /cl-drop/, "noch kein Destillat");
  until(l, () => L.vessel(l, "v").n["C2H5OH(aq)"] > 0, 900);
  assert.equal(L.reading(l, "c").drip, true);
  assert.match(L.parts.condenser.draw(L.reading(l, "c"), ctx(), place), /cl-drop/, "es tropft in die Vorlage");
  clean(L.parts.condenser.draw({ type: "condenser" }, ctx()), "Kühler für sich");
  assert.match(L.icon("flask"), /<svg/);
  assert.match(L.icon("condenser"), /<svg/);
});
let beakerLab;

test("Oberfläche: den Kühler setzen – erst den Kolben, dann die Vorlage antippen", () => {
  L.register(organic);
  const el = mount({ bench: [{ type: "flask", id: "k", contains: [{ reagent: "wine", ml: 40 }] }, { type: "beaker", id: "v" }], shelf: ["condenser"] });
  press(el, "hand", "condenser");
  assert.match(part(el, ".cl-hand").innerHTML, /Nun das Gefäß antippen, aus dem destilliert wird/);
  tap(el, "k");
  assert.match(part(el, ".cl-hand").innerHTML, /Nun die Vorlage antippen/);
  tap(el, "k");
  assert.match(part(el, ".cl-status").textContent, /in ein anderes Gefäß/);
  tap(el, "v");
  const t = state(el).run.lab.tools.find((x) => x.type === "condenser");
  assert.deepEqual([t.in, t.to], ["k", "v"]);
  assert.match(logOf(el), /Liebigkühler 1 zwischen Rundkolben 1 und Becherglas 1 gesetzt/);
  assert.equal(item(el, t.id).attributes["aria-label"], "Liebigkühler 1 zwischen Rundkolben 1 und Becherglas 1");
  assert.match(item(el, t.id).innerHTML, /cl-jacket/);
});

test("README: die Folien zu Veresterung und Destillation halten, was ihr Text verspricht", () => {
  L.register(organic);
  const [ester] = slide("Veresterung").map((b) => L.normalize(b)), [wine] = slide("Destillation").map((b) => L.normalize(b));
  const tube = ester.bench.find((p) => p.type === "testtube").id, bath = ester.bench.find((p) => p.type === "bath").id;
  const smellAfter = (temp, drops) => {
    const run = L.createRun(ester);
    L.act(run, (l) => L.setTemp(l, bath, temp));
    if (drops) L.act(run, (l) => L.add(l, tube, "sulfuric acid conc", { drops }));
    for (let t = 5; t <= 1800; t += 5) { L.advance(run, 5); if (L.checkTask(ester.task, run.lab, L.logAt(run)).done) return t; }
    return Infinity;
  };
  assert.ok(ester.shelf.includes("sulfuric acid conc"));
  assert.ok(smellAfter(70, 3) <= 30, "im Wasserbad von 70 °C nach Sekunden");
  const cold = smellAfter(20, 3);
  assert.ok(cold >= 120 && cold <= 900, `ohne Wasserbad nach einigen Minuten (${cold} s)`);
  assert.equal(smellAfter(20, 0), Infinity, "ohne Säure nicht in einer halben Stunde");
  // Destillation: Brenner an (rauschend)
  const run = L.createRun(wine), k = wine.bench.find((p) => p.type === "flask").id, v = wine.bench.find((p) => p.type === "condenser").to;
  L.act(run, (l) => L.setFlame(l, wine.bench.find((p) => p.type === "burner").id, 2));
  while (!(L.vessel(run.lab, k).boil > 0)) L.advance(run, 1);
  near(L.vessel(run.lab, k).T, 91, 2.5, "bei gut 90 °C beginnt der Wein zu sieden");
  while (L.volume(L.vessel(run.lab, v)) < 0.003) L.advance(run, 1);
  const share = (L.vessel(run.lab, v).n["C2H5OH(aq)"] * 58.37) / (L.volume(L.vessel(run.lab, v)) * 1000);
  near(share, 0.5, 0.1, "das erste Destillat ist etwa zur Hälfte Alkohol");
  while (L.volume(L.vessel(run.lab, v)) < 0.03) L.advance(run, 1);
  assert.ok(L.vessel(run.lab, k).T > 99, "die Siedetemperatur steigt auf 100 °C");
  assert.equal(run.lab.failed || 0, 0);
});

// ================================================================ Import-Werkzeug (ohne Netz: mit nachgebauten Antworten)

const importer = await import("./tools/import.mjs");
const view = (heading, ...values) => ({ Record: {
  Reference: [{ ReferenceNumber: 1, SourceName: "CAMEO Chemicals" }, { ReferenceNumber: 2, SourceName: "Hazardous Substances Data Bank (HSDB)" }],
  Section: [{ TOCHeading: heading, Information: values.map(([ref, text]) => ({ ReferenceNumber: ref, Value: { StringWithMarkup: [{ String: text }] } })) }] } });

test("Import: Zahlen aus der Hazardous Substances Data Bank, andere Quellen zählen nicht", () => {
  assert.deepEqual(importer.hsdb(view("Boiling Point", [1, "173.3 °F at 760 mmHg"], [2, "78.24 °C"]), "°C"), { value: 78.24, text: "78.24 °C" });
  assert.deepEqual(importer.hsdb(view("Density", [2, "0.7893 g/cu cm at 20 °C"]), "density"), { value: 0.7893, text: "0.7893 g/cu cm at 20 °C" });
  assert.deepEqual(importer.hsdb(view("Heat of Vaporization", [2, "42.32 kJ/mol at 25 °C"]), "kJ"), { value: 42.32, text: "42.32 kJ/mol at 25 °C" });
  assert.deepEqual(importer.hsdb(view("Heat of Vaporization", [2, "23.36 at 25 °C; 23.70 kJ/mol at 117.9 °C;"]), "kJ"), { value: 23.7, text: "23.36 at 25 °C; 23.70 kJ/mol at 117.9 °C;" });
  assert.equal(importer.hsdb(view("Boiling Point", [1, "78 °C"]), "°C"), null, "nur HSDB");
  assert.equal(importer.hsdb({}, "°C"), null);
});

test("Import: aus PubChem, Wikidata und PHREEQC wird ein Eintrag mit Quellen und Hinweisen", () => {
  const out = importer.entry({
    cid: 702, formula: "C2H6O", M: 46.07, title: "Ethanol",
    views: { "Boiling Point": view("Boiling Point", [2, "78.24 °C"]), "Density": view("Density", [2, "0.7893 g/cu cm at 20 °C"]),
      "Heat of Vaporization": view("Heat of Vaporization", [2, "42.32 kJ/mol at 25 °C"]) },
    wikidata: { results: { bindings: [{ item: { value: "http://www.wikidata.org/entity/Q153" }, de: { value: "Ethanol" }, en: { value: "ethanol" } }] } },
    phreeqc: [{ file: "llnl.dat", text: "SOLUTION_SPECIES\nCO3-2 + H+ = HCO3-\n  log_k 10.33\nEthanol = Ethanol\n  log_k 0\n" }],
    query: "ethanol"
  });
  const [id] = Object.keys(out.species), s = out.species[id];
  assert.equal(id, "C2H6O(aq)");
  assert.deepEqual(s.name, { de: "Ethanol", en: "ethanol" });
  assert.deepEqual([s.Tb, s.Hvap, s.Hf], [78.24, 42.32, null]);
  near(s.Vm, 58.37, 0.01, "Vm = M / Dichte");
  assert.match(s.src, /PubChem CID 702/);
  assert.match(s.src, /Hazardous Substances Data Bank/);
  assert.match(s.src, /Wikidata Q153 \(CC0\)/);
  assert.deepEqual(out.reagents, { ethanol: { name: { de: "Ethanol", en: "ethanol" }, solution: { "C2H6O(aq)": 17.13 }, group: "other" } });
  assert.ok(out.notes.some((n) => /Bildungsenthalpie/.test(n)), "was fehlt, steht in den Hinweisen");
  assert.ok(out.notes.some((n) => /llnl\.dat: Ethanol = Ethanol/.test(n)), "Zeilen aus PHREEQC als Vorschlag");
  // der Eintrag lässt sich so eintragen (unter eigenem Namen: das Paket Organik hat schon eine Flasche "ethanol")
  const pack = { species: out.species, reagents: { "ethanol (Import)": out.reagents.ethanol } };
  L.register(pack);
  assert.deepEqual(L.lint(pack), []);
  // ohne Dichte und ohne Wikidata: englischer Name aus PubChem, kein Vm, keine Vorratsflasche
  const bare = importer.entry({ cid: 1, formula: "CH4O", M: 32.04, title: "Methanol", views: {}, wikidata: null, phreeqc: [], query: "67-56-1" });
  assert.deepEqual(bare.species["CH4O(aq)"].name, { en: "Methanol", de: "Methanol" });
  assert.equal(bare.species["CH4O(aq)"].Vm, undefined);
  assert.deepEqual(bare.reagents, {});
  assert.ok(bare.notes.some((n) => /Dichte/.test(n)));
});

test("Import: ein Stoff, der bei Raumtemperatur schmilzt erst über 25 °C, wird als Feststoff vorgeschlagen", () => {
  const out = importer.entry({ cid: 5352425, formula: "Pb", M: 207.2, title: "Lead", query: "7439-92-1", phreeqc: [],
    views: { "Melting Point": view("Melting Point", [2, "327.4 °C"]), "Density": view("Density", [2, "11.34 g/cu cm at 20 °C"]) },
    wikidata: { results: { bindings: [{ item: { value: "http://www.wikidata.org/entity/Q708" }, de: { value: "Blei" }, en: { value: "lead" } }] } } });
  assert.deepEqual(Object.keys(out.species), ["Pb(s)"]);
  assert.equal(out.species["Pb(s)"].Vm, undefined, "Eigenvolumen nur für Gelöstes");
  assert.deepEqual(out.reagents, { lead: { name: { de: "Blei", en: "lead" }, solid: "Pb(s)", area: 10, group: "solid" } });
  assert.match(out.species["Pb(s)"].src, /Schmelzpunkt 327\.4 °C/);
});

// ================================================================ Befunde der Durchsicht von Meilenstein 6

test("Befund: eine Fläche, die vor ihrem Paket gebaut werden soll, wartet und zeigt keinen bleibenden Fehler", async () => {
  const url = "https://example.org/packs/slow.json", saved = globalThis.fetch;
  let release;
  const slow = { species: { "Sb(s)": { name: { de: "Antimon", en: "antimony" }, Hf: 0, S: 45.7, src: "Test" } },
    reagents: { "Sb granules": { name: { de: "Antimon (Körner)", en: "antimony granules" }, solid: "Sb(s)", area: 6 } } };
  globalThis.fetch = () => new Promise((resolve) => { release = () => resolve({ ok: true, status: 200, json: async () => slow }); });
  try {
    L.usePack(node(), url);                                     // das Makro hat zu laden begonnen
    const el = mount({ bench: [{ type: "beaker", id: "b", contains: [{ reagent: "Sb granules", g: 1 }] }] });   // die Fläche gibt nach 5 s nicht mehr nach
    assert.doesNotMatch(el.innerHTML, /role="alert"/, "kein Fehler, solange das Paket lädt");
    assert.match(el.innerHTML, /Pakete werden geladen/);
    await settleAll();                                          // fetch kommt erst im nächsten Takt
    release();
    await settleAll();
    assert.doesNotMatch(el.innerHTML, /role="alert"/);
    assert.ok(L.vessel(state(el).run.lab, "b").n["Sb(s)"] > 0);
  } finally { globalThis.fetch = saved; }
  // ein Fehler bleibt nicht im Speicher der Fläche: kommen die Daten später, steht beim nächsten Aufbau der Versuch
  const source = { bench: [{ type: "beaker", id: "b", contains: [{ reagent: "Pd granules", g: 1 }] }] };
  const el = mount(source, "later");
  assert.match(el.innerHTML, /role="alert"/);
  L.register({ species: { "Pd(s)": { name: { de: "Palladium", en: "palladium" }, Hf: 0, S: 37.6, src: "Test" } },
    reagents: { "Pd granules": { name: { de: "Palladium", en: "palladium" }, solid: "Pd(s)", area: 6 } } });
  assert.doesNotMatch(mount(source, "later").innerHTML, /role="alert"/);
});

test("Befund: ein Kühler an Becherglas, Reagenzglas und Schale wird gezeichnet und lässt sich antippen", () => {
  for (const type of ["beaker", "testtube", "dish"]) {
    const el = mount({ bench: [{ type, id: "a", contains: [{ reagent: "H2O", ml: 10 }] }, { type: "condenser", id: "c", in: "a", to: "v" }, { type: "beaker", id: "v" }] });
    assert.doesNotMatch(item(el, "c").innerHTML, /NaN/, type + ": " + item(el, "c").innerHTML.slice(0, 300));
    assert.match(item(el, "c").innerHTML, /cl-jacket/, type);
  }
});

test("Befund: der kopierte Aufbau lässt sich immer wieder einlesen", () => {
  const raw = { bench: [{ type: "beaker", id: "b" }, { type: "burette", id: "bu", over: "b", contains: [{ reagent: "NaOH 0.1M", ml: 40 }] },
    { type: "beaker", id: "x", contains: [{ reagent: "H2O", ml: 20 }] }, { type: "beaker", id: "y", contains: [{ reagent: "H2O", ml: 20 }] },
    { type: "bridge", id: "s", in: "x", to: "y" }, { type: "flask", id: "k" }, { type: "condenser", id: "c", in: "k", to: "y" }] };
  const run = L.createRun(L.normalize(raw));
  L.act(run, (l) => L.setTap(l, "bu", 2)); L.advance(run, 10); L.act(run, (l) => L.setTap(l, "bu", 0));
  L.act(run, (l) => L.add(l, "bu", "NaOH 0.1M", { ml: 20 }), { key: "added", vessel: "bu", reagent: "NaOH 0.1M", ml: 20 });     // nachgefüllt
  L.act(run, (l) => L.remove(l, "x"), { key: "removed", part: "x" });
  L.act(run, (l) => L.remove(l, "k"), { key: "removed", part: "k" });
  const text = L.describe(run, raw), again = L.normalize(text);
  near(again.bench.find((p) => p.id === "bu").contains[0].ml, 50, 1e-9, "die Bürette fasst höchstens 50 mL");
  for (const id of ["s", "c"]) assert.deepEqual(again.bench.find((p) => p.id === id).in, null, id + " liegt für sich");
});

test("Befund: ein has-Ziel zählt auch, was sich auf einer Elektrode abgeschieden hat; eine Aufgabe ohne Ziele ist nie geschafft", () => {
  const l = lab([{ type: "beaker", id: "b", contains: [{ reagent: "CuCl2 0.5M", ml: 80 }] }, { type: "electrode-C", id: "e1", in: "b" }, { type: "electrode-C", id: "e2", in: "b" },
    { type: "supply", id: "n", in: "b", volts: 6 }], { room: 25 });
  L.step(l, 60);
  assert.ok(L.reading(l, "e2").coat.length || L.reading(l, "e1").coat.length, "es hat sich Kupfer abgeschieden");
  assert.deepEqual(L.checkTask({ goals: [{ has: "Cu(s)", min: 1e-6 }, { has: "Cu(s)", min: 1e-6, in: "b" }] }, l, []).goals, [true, true]);
  assert.deepEqual(L.checkTask({ text: "Beobachte.", goals: [] }, l, []).done, false);
  assert.equal(part(mount({ task: "Beobachte." }), ".cl-done").textContent, "");
});

test("Befund: Lämpchen-Ziel mit Gefäß, Geruchsziel ohne „stechend“", () => {
  const l = lab([{ type: "beaker", id: "b", contains: [{ reagent: "CuCl2 0.5M", ml: 80 }] }, { type: "electrode-C", id: "e1", in: "b" }, { type: "electrode-C", id: "e2", in: "b" },
    { type: "supply", id: "n", in: "b", volts: 6 }, { type: "lamp", id: "la", in: "b" }], { room: 25 });
  const seen = []; L.step(l, 5, (e) => seen.push(e));
  assert.ok(seen.some((e) => e.key === "lampOn"));
  assert.equal(L.checkTask({ goals: [{ seen: "lamp", in: "b" }] }, l, seen).done, true);
  L.register(organic);
  assert.equal(L.goalText({ seen: "smell", species: "CH3COOC2H5(aq)" }, "de"), "Geruch: Ethylacetat (Essigsäureethylester)");
  assert.equal(L.goalText({ seen: "smell" }, "en"), "Smell");
});

test("Befund: das Import-Werkzeug liest Bereiche, das Minuszeichen und den Siedepunkt bei Normaldruck", () => {
  assert.equal(importer.hsdb(view("Boiling Point", [2, "140-142 °C"]), "°C").value, 140);
  assert.equal(importer.hsdb(view("Melting Point", [2, "−114.1 °C"]), "°C").value, -114.1);
  assert.equal(importer.hsdb(view("Boiling Point", [2, "56 °C at 10 mm Hg; 180 °C at 760 mm Hg"]), "°C").value, 180);
});

test("Befund: ein Paket, dessen Server nie antwortet, hält nach der Wartezeit niemanden mehr auf", async () => {
  const saved = globalThis.fetch, wait = L.PACK_WAIT;
  globalThis.fetch = () => new Promise(() => {});
  L.PACK_WAIT = 0.05;                                          // s
  try {
    const note = node();
    const done = L.usePack(note, "https://example.org/stumm.json");
    assert.equal(L.loadingPacks(), true);
    await done;
    assert.equal(L.loadingPacks(), false);
    assert.match(note.innerHTML, /Das Paket ließ sich nicht laden: https:\/\/example\.org\/stumm\.json \(keine Antwort\)/);
  } finally { globalThis.fetch = saved; L.PACK_WAIT = wait; }
});
