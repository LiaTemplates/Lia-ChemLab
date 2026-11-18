// Wissenschaftliche Benchmarks für ChemLab. Aufruf:
//   node benchmarks/run.mjs                 alle, als Tabelle
//   node benchmarks/run.mjs --id B08        nur einen
//   node benchmarks/run.mjs --format json   maschinenlesbar (auch: markdown)
// Fälle stehen als Daten in cases.json; was sie prüfen, steht hier als feste Funktion je "model" (keine ausgewerteten Formeln).
// Zustände: PASS / FAIL (gerechnet), NOT_RUN (Referenzdaten fehlen), NOT_IMPLEMENTED (kein Modell dafür).
import fs from "node:fs";
import { execSync } from "node:child_process";
import "../chemlab-engine.js";
import "../chemlab-data.js";
import "../chemlab-spatial.js";

const L = globalThis.LiaChemLab, S = L.spatial;
const here = new URL(".", import.meta.url);
export const cases = JSON.parse(fs.readFileSync(new URL("cases.json", here), "utf8"));

const lab = (bench, room = 25) => L.createLab(L.normalize({ bench, room }));
const rel = (a, b) => Math.abs(a - b) / Math.abs(b);
const check = (name, value, limit) => ({ name, value, limit, pass: value <= limit });

// Atome und Ladung in allem, was ein Labor enthält oder abgegeben hat (taken: aus der Luft genommen)
function inventory(l) {
  const out = { charge: 0 };
  for (const v of l.vessels)
    for (const [store, sign] of [[v.n, 1], [v.org || {}, 1], [v.out, 1], [v.air || {}, 1], [v.caught || {}, 1], [v.taken || {}, -1]])
      for (const [id, n] of Object.entries(store)) {
        if (id === "air") continue;                                    // Luft in der pneumatischen Wanne: keine Stoffformel
        const sp = L.species(id);
        out.charge += sign * n * sp.charge;
        for (const [el, k] of Object.entries(L.parse(id).atoms)) out[el] = (out[el] || 0) + sign * n * k;
      }
  return out;
}

function moments1d(G, n) {
  let m = 0, x1 = 0, x2 = 0;
  for (let i = 0; i < G.n; i++) { const x = G.x(i); m += n[i]; x1 += n[i] * x; x2 += n[i] * x * x; }
  return { m, var: x2 / m - (x1 / m) ** 2 };
}

const gauss = (x, mu, s2) => Math.exp(-((x - mu) ** 2) / (2 * s2));
// Fehlerfunktion nach Abramowitz & Stegun 7.1.26 (|Fehler| < 1.5e-7)
function erf(x) {
  const s = Math.sign(x), t = 1 / (1 + 0.3275911 * Math.abs(x));
  return s * (1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x));
}

const models = {
  // B01: zwei Lösungen werden zusammengegossen, CO2 entweicht; Elemente und Ladung bleiben erhalten (Abgegebenes mitgezählt)
  mixBalance({ a, b, seconds }, tol) {
    const l = lab([{ type: "beaker", id: "a", contains: a }, { type: "beaker", id: "b", contains: b }]);
    const before = inventory(l);
    L.pour(l, "b", "a", b.reduce((s, x) => s + x.ml, 0));
    L.step(l, seconds);
    const after = inventory(l);
    const worst = Math.max(...Object.keys(before).filter((k) => k !== "charge").map((k) => rel(after[k], before[k])));
    return [check("element_error", worst, tol.relative), check("charge_error", Math.abs(after.charge - before.charge), 1e-12)];
  },

  // B03: verschlossener leerer Kolben im Wasserbad, Manometer: p2/p1 = T2/T1 (V konstant, n konstant)
  isochore({ from, to }, tol) {
    const l = lab([{ type: "flask", id: "k" }, { type: "manometer", id: "m", in: "k" }, { type: "bath", id: "wb", under: "k", temp: from }], from);
    L.step(l, 5);
    const p1 = L.vessel(l, "k").p;
    L.setTemp(l, "wb", to);
    L.step(l, 900);
    const v = L.vessel(l, "k");
    return [check("pressure_ratio_error", rel(v.p / p1, (v.T + 273.15) / (from + 273.15)), tol.relative),
      check("temperature_reached", Math.abs(v.T - to), 0.05)];
  },

  // B02: verschlossenes Reagenzglas, Wasser ohne O2 (angeimpft), geschüttelt, dann im Bad erwärmt (O2 perlt zurück in den Gasraum):
  // der Sauerstoff im Glas (eingeschlossene Luft + gelöst) bleibt gleich, und was die Bilanz als aus der Luft genommen zählt, fehlt dort
  sealedOxygen({ ml, shakes, warm }, tol) {
    const l = lab([{ type: "testtube", id: "t", contains: [{ reagent: "H2O", ml }] }, { type: "stopper", id: "s", in: "t" }, { type: "bath", id: "wb", under: "t", temp: 25 }]);
    const v = L.vessel(l, "t");
    v.n["O2(aq)"] = 1e-12;
    L.step(l, 0.05);
    const o2 = () => v.o2 + (v.n["O2(aq)"] || 0) + ((v.air || {})["O2(g)"] || 0), drawn = () => (v.taken["O2(g)"] || 0) - (v.out["O2(g)"] || 0);
    const start = o2(), d0 = drawn(), seal0 = v.o2;
    for (let i = 0; i < shakes; i++) { L.shake(l, "t", "shake"); L.step(l, 10); }
    const dissolved = v.n["O2(aq)"];
    L.setTemp(l, "wb", warm);
    L.step(l, 1800);
    return [check("o2_error", rel(o2(), start), tol.relative), check("ledger_error", Math.abs((seal0 - v.o2) - (drawn() - d0)) / seal0, tol.relative),
      check("released_when_warm", v.n["O2(aq)"] < dissolved ? 0 : 1, 0)];
  },

  // B06: so lange geschüttelt, bis Gasraum und Lösung im Gleichgewicht sind. Analytisch: n = p·Vh/(RT) + K_H·p·V_l
  sealedHenry({ ml, shakes }, tol) {
    const l = lab([{ type: "testtube", id: "t", contains: [{ reagent: "H2O", ml }] }, { type: "stopper", id: "s", in: "t" }]);
    const v = L.vessel(l, "t");
    v.n["O2(aq)"] = 1e-12;
    L.step(l, 0.05);
    const total = v.o2 + v.n["O2(aq)"];
    for (let i = 0; i < shakes; i++) { L.shake(l, "t", "shake"); L.step(l, 10); }
    const Vl = L.volume(v), Vh = (spec(v).cap - Vl * 1000) / 1000, RT = 8.314462618 / 100 * (v.T + 273.15), KH = 10 ** -2.8983;
    const p = total / (Vh / RT + KH * Vl);
    return [check("dissolved_error", rel(v.n["O2(aq)"] / Vl, KH * p), tol.relative), check("headspace_error", rel(v.o2 * RT / Vh, p), tol.relative)];
  },

  // B07: Blaue Flasche im verschlossenen Reagenzglas mit Manometer: jedes Schütteln löst O2, Glucose verbraucht es über den Farbstoff.
  // Am Ende ist aller Sauerstoff der eingeschlossenen Luft verbraucht: p = p_Dampf + (1 − 0,21)·(p_beim_Verschließen − p_Dampf),
  // die Lösung bleibt auch geschüttelt farblos, und es kam kein O2 von außen
  sealedConsumption({ shakes }, tol) {
    if (!L.db.species["C16H18N3S+(aq)"]) L.register(JSON.parse(fs.readFileSync(new URL("../packs/organic.json", here), "utf8")));
    const l = lab([{ type: "testtube", id: "t", contains: [{ reagent: "glucose", ml: 14 }, { reagent: "NaOH 1M", ml: 2 }] }, { type: "manometer", id: "m", in: "t" }]);
    L.add(l, "t", "methylene blue", { drops: 3 });
    const v = L.vessel(l, "t");
    L.step(l, 60);
    const vap = () => Math.exp(-40650 / 8.314462618 * (1 / (v.T + 273.15) - 1 / 373.15));      // wie pressure() in der Engine: Dampfdruck reinen Wassers
    const room = () => (spec(v).cap - L.volume(v) * 1000) / (v.T + 273.15);                      // Vh/T: Stoffmenge ∝ p·Vh/T
    const dry0 = (v.p - vap()) * room(), seal0 = v.o2, drawn = () => (v.taken["O2(g)"] || 0) - (v.out["O2(g)"] || 0), d0 = drawn();
    for (let i = 0; i < shakes; i++) { L.shake(l, "t", "shake"); L.step(l, 60); }
    L.shake(l, "t", "shake");
    L.step(l, 10);
    return [check("pressure_error", rel(v.p, vap() + 0.79 * dry0 / room()), tol.pressure_relative),
      check("ledger_error", Math.abs((seal0 - v.o2) - (drawn() - d0)) / seal0, tol.balance_relative),
      check("stays_colorless", L.view(l, v).color.name === "colorless" ? 0 : 1, 0)];
  },

  // B17: Elektrolyse mit zwei Kupferelektroden: die Anode verliert Q·M/(2F), Q aus dem Strom des Stromkreises aufsummiert
  faraday({ volts, seconds }, tol) {
    const l = lab([{ type: "beaker", id: "b", contains: [{ reagent: "CuSO4 0.5M", ml: 80 }] },
      { type: "electrode-Cu", id: "e1", in: "b" }, { type: "electrode-Cu", id: "e2", in: "b" }, { type: "supply", id: "n", in: "b", volts }]);
    const g0 = L.reading(l, "e1").g;
    let q = 0;
    for (let i = 0; i < seconds * 20; i++) { L.step(l, 0.05); q += L.circuit(l, "b").I * 0.05; }
    return [check("anode_loss_error", rel(g0 - L.reading(l, "e1").g, q / (2 * L.FARADAY) * L.species("Cu(s)").M), tol.relative)];
  },

  // B19: Eisenwolle in luftgesättigter Kochsalzlösung (oxygen: true): Eisen geht mit dem doppelten O2-Grenzfluss in Lösung,
  // O2-Fluss = A · k_Film · D^(2/3) · c(O2), mit A der Fläche der Stücke (wie area() in der Engine)
  oxygenLimit({ g, ml }, tol) {
    const l = L.createLab(L.normalize({ oxygen: true, room: 25, bench: [{ type: "beaker", id: "b", contains: [{ reagent: "NaCl 0.5M", ml }, { reagent: "Fe wool", g }] }] }));
    const v = L.vessel(l, "b"), area = () => v.lumps.filter((x) => x.id === "Fe(s)" && x.n > 0).reduce((s, x) => s + x.a0 * (x.n / x.n0) ** x.p, 0);
    L.shake(l, "b", "shake");
    L.step(l, 30);
    const fe = v.n["Fe(s)"], c0 = v.n["O2(aq)"] / L.volume(v), a = area();
    L.step(l, 1);
    const c = (c0 + v.n["O2(aq)"] / L.volume(v)) / 2, flux = a * 1.2e-3 * L.species("O2(aq)").D ** (2 / 3) * c / 1000;
    return [check("rate_error", rel(fe - v.n["Fe(s)"], 2 * flux), tol.relative)];
  },

  // B21: 14 g KNO3 in 20 mL bei 60 °C gelöst, dann im Bad abgekühlt. Auf 40 °C: übersättigt unter der Schwelle, es bleibt klar.
  // Auf 30 °C: ab Q/K ≥ S zählt die Wartezeit, der Feststoff erscheint nach t (auf einen Rechenschritt genau); K und N bleiben erhalten
  nucleation({ g, ml, metastable, labile }, tol) {
    const make = () => {
      const l = lab([{ type: "beaker", id: "b", contains: [{ reagent: "H2O", ml }, { reagent: "KNO3 salt", g }] }, { type: "bath", id: "wb", under: "b", temp: 60 }], 20);
      L.step(l, 600);
      return l;
    };
    const e = L.db.equilibria.find((q) => q.solid === "KNO3(s)"), S = e.nucleate.S, t = e.nucleate.t;
    const omega = (v) => { const vol = L.volume(v); return (v.n["K+(aq)"] / vol) * (v.n["NO3-(aq)"] / vol) / 10 ** (e.ideal[0] - e.ideal[1] * 1000 / (8.314462618 * Math.LN10) * (1 / (v.T + 273.15) - 1 / 298.15)); };
    const a = make(), va = L.vessel(a, "b"), clear = va.n["KNO3(s)"] || 0, before = inventory(a);
    L.setTemp(a, "wb", metastable);
    L.step(a, 900);
    const w = omega(va);
    const b = make(), vb = L.vessel(b, "b");
    L.setTemp(b, "wb", labile);
    let over = null, seen = null;
    for (let i = 0; i < 20 * 120 && seen == null; i++) {
      L.step(b, 0.05);
      if (over == null && omega(vb) >= S) over = b.t;
      if (vb.n["KNO3(s)"] > 0) seen = b.t;
    }
    const after = inventory(b);
    return [check("dissolved_at_60", clear, 0), check("metastable_solid", va.n["KNO3(s)"] || 0, 0),
      { name: "metastable_omega", value: w, limit: S, pass: w > 1 && w < S },
      check("delay_error", over == null || seen == null ? Infinity : Math.abs(seen - over - t), tol.delay_absolute),
      check("balance_error", Math.max(rel(after.K, before.K), rel(after.N, before.N)), tol.balance_relative)];
  },

  // B22: ein Korn KNO3 in viel Wasser: die Fläche schrumpft wie bei einer Kugel (p = 2/3), n(t) = n0·(1 − t/(3τ))³ mit τ = 15 s (pace)
  shrinkingGrain({ g, ml, times, until }, tol) {
    const l = lab([{ type: "beaker", id: "b", contains: [{ reagent: "H2O", ml }] }]);
    L.add(l, "b", "KNO3 salt", { g });
    const v = L.vessel(l, "b"), n0 = g / L.species("KNO3(s)").M, start = l.t;
    let worst = 0, scheme = 0, n = n0;
    for (const t of times) {
      L.step(l, start + t - l.t);
      worst = Math.max(worst, rel(v.n["KNO3(s)"], n0 * (1 - t / 45) ** 3));
    }
    // das diskrete Verfahren: je Schritt n · exp(−DT/τ(n)), τ(n) = 15 s · (n/n0)^(1/3)
    const m = lab([{ type: "beaker", id: "b", contains: [{ reagent: "H2O", ml }] }]);
    L.add(m, "b", "KNO3 salt", { g });
    for (let k = 1; k <= until * 20; k++) {
      L.step(m, 0.05);
      n *= Math.exp(-0.05 / (15 * Math.max(0.01, (n / n0) ** (1 / 3))));
      scheme = Math.max(scheme, rel(L.vessel(m, "b").n["KNO3(s)"], n));
    }
    return [check("curve_error", worst, tol.relative), check("scheme_error", scheme, tol.scheme_relative)];
  },

  // B20: Aluminiumfolie (Ionen-Paket). Wasser, belüftet: höchstens der Reststrom i·A, kein Lochfraß. Schwefelsäure 1 M (ohne Chlorid, sonst
  // setzt sofort Lochfraß ein, und ohne Luftsauerstoff, der den Wasserstoff verbrennen könnte): die Schicht wird linear dünner (1 − t/off),
  // bis dahin geht nichts in Lösung, danach schon; 3 Elektronen je Al, 2 je H2. Kochsalzlösung, belüftet: Lochfraß
  passiveFilm({ g, ml }, tol) {
    if (!L.db.species["Al(s)"]) L.register(JSON.parse(fs.readFileSync(new URL("../packs/ionen.json", here), "utf8")));
    const pv = L.db.species["Al(s)"].passive, make = (sol, oxygen) => L.createLab(L.normalize({ room: 25, oxygen, bench: [{ type: "testtube", id: "t", contains: [{ reagent: sol, ml }, { reagent: "Al foil", g }] }] }));
    const water = make("H2O", true), w = L.vessel(water, "t"), n0 = w.n["Al(s)"], A = L.reagent("Al foil").area * g;
    L.step(water, 300);
    const passive = (n0 - w.n["Al(s)"]) / 300 - pv.i * A / (3 * L.FARADAY);
    const acid = make("H2SO4 1M", false), a = L.vessel(acid, "t");
    let film = 0, early = 0;
    for (let k = 1; k * 0.05 < pv.off - 1e-9; k++) {
      L.step(acid, 0.05);
      film = Math.max(film, Math.abs(a.film["Al(s)"] - Math.max(0, 1 - acid.t / pv.off)));
      early = Math.max(early, n0 - a.n["Al(s)"]);
    }
    L.step(acid, 30);
    const lost = n0 - (a.n["Al(s)"] || 0), h2 = (a.out["H2(g)"] || 0) + (a.air["H2(g)"] || 0) + (a.n["H2(g)"] || 0);
    const salt = make("NaCl 0.5M", true), sv = L.vessel(salt, "t");
    L.step(salt, 120);
    return [check("passive_excess", Math.max(0, passive), 0), check("film_error", film, tol.film_absolute), check("early_loss", early, 0),
      { name: "active_loss", value: lost, limit: 0, pass: lost > 0 }, check("balance_error", rel(3 * lost, 2 * h2), tol.balance_relative),
      check("pits_without_chloride", w.pit && w.pit["Al(s)"] ? 1 : 0, 0), { name: "pits_with_chloride", value: sv.pit && sv.pit["Al(s)"] ? 1 : 0, limit: 1, pass: !!(sv.pit && sv.pit["Al(s)"]) }];
  },

  // B16, B25: dieselben Lösungen in ChemLab (reales Modell) und in PHREEQC (references/phreeqc.json). Verglichen werden der pH und lg c
  // der genannten Teilchen (ChemLab mol/L, PHREEQC mol/kg Wasser: bis 0,1 M wenige Promille)
  // B26: dieselben Fälle (from) gegen phreeqc.dat
  phreeqc(params, tol) {
    const file = new URL("references/phreeqc.json", here);
    if (!fs.existsSync(file)) throw new Error("references/phreeqc.json fehlt: node benchmarks/phreeqc.mjs");
    const ref = JSON.parse(fs.readFileSync(file, "utf8")), out = [];
    const sets = params.from ? params.from.map((id) => [id, cases.find((c) => c.id === id).params.cases]) : [[cases.find((c) => c.params === params).id, params.cases]];
    for (const [id, list] of sets) for (const item of list) {
      const { l, v } = phreeqcLab(item), vol = L.volume(v), pH = L.view(l, v).pH;
      for (const which of Object.keys(tol)) {
        const r = ref.cases[`${id}/${item.name}/${which}`];
        if (!r) throw new Error(`Vergleich fehlt: ${id}/${item.name}/${which}`);
        out.push(check(`${item.name}/${which}/pH`, Math.abs(pH - r.pH), tol[which].pH));
        const worst = Math.max(...item.species.map((s) => Math.abs(Math.log10((v.n[s] || 1e-300) / vol) - Math.log10(r.m[s] || 1e-300))));
        out.push(check(`${item.name}/${which}/lg`, worst, tol[which].lg));
      }
    }
    return out;
  },

  // B18: (1) Eisen und Zink, über den Strommesser verbunden, in belüfteter Kochsalzlösung: Am Mischpotential geben die Oxidationen so viele
  // Elektronen ab, wie die Reduktionen aufnehmen; sonst entstünde in der Lösung Ladung. Zink löst sich mindestens mit dem Strom I/(2F).
  // (2) Aluminiumfolie in 0,01 M NaCl, belüftet: Mischpotential der Folie gegen das gemessene Ruhepotential, und dort noch kein Lochfraß
  mixedPotential({ seconds, aluminium }, tol) {
    if (!L.db.species["Al(s)"]) L.register(JSON.parse(fs.readFileSync(new URL("../packs/ionen.json", here), "utf8")));
    const l = L.createLab(L.normalize({ room: 25, oxygen: true, bench: [{ type: "beaker", id: "b", contains: [{ reagent: "NaCl 0.5M", ml: 80 }] },
      { type: "electrode-Fe", id: "fe", in: "b" }, { type: "electrode-Zn", id: "zn", in: "b" }, { type: "ammeter", id: "a", in: "b" }] }));
    L.shake(l, "b", "shake");
    const zn0 = L.reading(l, "zn").g;
    let q = 0, worst = 0;
    for (let i = 0; i < seconds * 20; i++) { L.step(l, 0.05); q += Math.abs(L.circuit(l, "b").I) * 0.05; worst = Math.max(worst, Math.abs(inventory(l).charge)); }
    const zinc = (zn0 - L.reading(l, "zn").g) / L.species("Zn(s)").M;
    const al = L.createLab(L.normalize({ room: 25, oxygen: true, bench: [{ type: "beaker", id: "b", contains: [{ reagent: `NaCl ${aluminium.nacl}M`, ml: 50 }, { reagent: "Al foil", g: 0.05 }] }] }));
    L.shake(al, "b", "shake");
    L.step(al, 1800);
    const phi = al.warm["b/Al(s)"], measured = aluminium.measured_V_SCE + aluminium.SCE_V_SHE, pit = L.vessel(al, "b").pit || {};
    return [check("charge_in_solution", worst, tol.charge_absolute), { name: "zinc_at_least_current", value: zinc * 2 * L.FARADAY / q, limit: 1, pass: q > 0 && zinc * 2 * L.FARADAY >= q * (1 - 1e-9) },
      check("aluminium_potential_error_V", Math.abs(phi - measured), tol.potential_V), check("aluminium_pitting_at_rest", pit["Al(s)"] ? 1 : 0, 0)];
  },

  // B04: Wasser, mit einer Spur O2 angeimpft (sonst rechnet die Engine keine Aufnahme), geschüttelt bis gesättigt; Vergleich
  // der Henry-Konstante mit dem Messwert bei gleichem O2-Partialdruck (die Engine rechnet mit 0,21 bar trockener Luft)
  henryO2({ reference_mg_per_L, reference_pO2_atm }, tol) {
    const l = lab([{ type: "beaker", id: "b", contains: [{ reagent: "H2O", ml: 100 }] }]);
    L.vessel(l, "b").n["O2(aq)"] = 1e-12;
    for (let i = 0; i < 12; i++) { L.shake(l, "b", "shake"); L.step(l, 10); }
    const c = L.vessel(l, "b").n["O2(aq)"] / (L.volume(L.vessel(l, "b")));
    const kModel = c / 0.21, kRef = reference_mg_per_L / 1000 / 31.998 / (reference_pO2_atm * 1.01325);      // mol/(L·bar)
    return [check("henry_relative_error", rel(kModel, kRef), tol.relative)];
  },

  // B05: ruhige Oberfläche, c(t) = c*·(1 − exp(−k t)) mit k = kL·A/V; geprüft bei t = 1/k
  aerationRelaxation({ ml }, tol) {
    const l = lab([{ type: "beaker", id: "b", contains: [{ reagent: "H2O", ml }] }]);
    const v = L.vessel(l, "b");
    v.n["O2(aq)"] = 1e-15;
    L.step(l, 0.05);
    const kRef = 1e-4 * Math.PI * spec(v).d ** 2 / 4 / ml;      // kL = 1e-4 cm/s (AERATE.still), A = πd²/4 in cm², V in cm³
    const sat = 10 ** -2.8983 * 0.21;
    const t = 1 / kRef;
    L.step(l, t - 0.05);
    const c = v.n["O2(aq)"] / L.volume(v);
    return [check("relaxation_error", rel(c, sat * (1 - Math.exp(-kRef * l.t))), tol.relative)];
  },

  // B08: Gauß-Profil, Varianz wächst genau um 2Dt; Masse bleibt; Fehler zur Analytik fällt mit 2. Ordnung
  gauss1d({ D, sigma0, length, seconds, grids }, tol) {
    const errors = [], out = [];
    for (const cells of grids) {
      const G = S.line(cells, length, 1), n = new Float64Array(cells);
      for (let i = 0; i < cells; i++) n[i] = gauss(G.x(i), length / 2, sigma0 ** 2) * G.dx;
      const m0 = moments1d(G, n);
      S.diffuse(G, n, D, seconds);
      const m1 = moments1d(G, n), s2 = sigma0 ** 2 + 2 * D * seconds, peak = 1 / Math.sqrt(2 * Math.PI * s2);
      let e = 0;
      for (let i = 0; i < cells; i++) e = Math.max(e, Math.abs(n[i] / G.dx / m1.m - gauss(G.x(i), length / 2, s2) * peak));
      errors.push(e / peak);
      if (cells === grids[grids.length - 1]) {
        out.push(check("variance_error", rel(m1.var - m0.var, 2 * D * seconds), tol.variance_relative));
        out.push(check("mass_error", rel(m1.m, m0.m), tol.mass_relative));
        out.push(check("negative_cells", n.filter((x) => x < 0).length, 0));
      }
    }
    const order = Math.log2(errors[errors.length - 2] / errors[errors.length - 1]);
    out.push({ name: "grid_order", value: order, limit: tol.order_min, pass: order >= tol.order_min });
    return out;
  },

  // B09: alles im linken Zehntel, Wände ohne Fluss: am Ende gleich verteilt, Masse unverändert
  walls1d({ D, length, cells, seconds }, tol) {
    const G = S.line(cells, length, 1), n = new Float64Array(cells);
    for (let i = 0; i < cells / 10; i++) n[i] = 1;
    const m0 = S.total(n);
    S.diffuse(G, n, D, seconds);
    const mean = S.total(n) / cells;
    return [check("uniform_error", Math.max(...n.map((x) => Math.abs(x - mean))) / mean, tol.uniform_relative),
      check("mass_error", rel(S.total(n), m0), tol.mass_relative)];
  },

  // B10: halbunendlich, c(0) = c0 fest: c = c0·erfc(x / 2√(Dt)); hereingekommen 2·c0·√(Dt/π) je m²
  dirichlet1d({ D, length, cells, seconds }, tol) {
    const G = S.line(cells, length, 1), n = new Float64Array(cells);
    G.edge = [{ cell: 0, g: 1 / (G.dx / 2), c: 1 }];
    const r = S.diffuse(G, n, D, seconds);
    let e = 0;
    for (let i = 0; i < cells; i++) e = Math.max(e, Math.abs(n[i] / G.dx - (1 - erf(G.x(i) / (2 * Math.sqrt(D * seconds))))));
    return [check("profile_error", e, tol.profile_absolute),
      check("inflow_error", rel(S.total(n), 2 * Math.sqrt(D * seconds / Math.PI)), tol.inflow_relative),
      check("balance_error", rel(S.total(n), r.inflow), 1e-12)];
  },

  // B11: flache Scheibe, radiales Gauß-Profil um die Achse: in 2D wächst <r²> um 4Dt (ein kartesischer Fehler gäbe 2Dt)
  radialMoment({ D, radius, height, nr, sigma0, seconds }, tol) {
    const G = S.cylinder(nr, 1, radius, height), n = new Float64Array(G.n);
    for (let k = 0; k < G.n; k++) n[k] = gauss(G.r(k), 0, sigma0 ** 2) * G.vol[k];
    const r2 = () => { let s = 0; for (let k = 0; k < G.n; k++) s += n[k] * G.r(k) ** 2; return s / S.total(n); };
    const m0 = S.total(n), before = r2();
    S.diffuse(G, n, D, seconds);
    return [check("moment_error", rel(r2() - before, 4 * D * seconds), tol.moment_relative), check("mass_error", rel(S.total(n), m0), tol.mass_relative)];
  },

  // B12: gleichmäßig gefüllt bleibt gleichmäßig: an der Achse entsteht nichts
  uniformRZ({ D, radius, height, nr, nz, seconds }, tol) {
    const G = S.cylinder(nr, nz, radius, height), n = S.spread(G, 1), c0 = S.mean(G, n);
    S.diffuse(G, n, D, seconds);
    let worst = 0;
    for (let k = 0; k < G.n; k++) worst = Math.max(worst, Math.abs(n[k] / G.vol[k] - c0) / c0);
    return [check("deviation", worst, tol.relative)];
  },

  // B13: 3D-Gauß um einen Punkt auf der Achse, gerechnet in r,z; Fehler zur Analytik auf drei Gittern
  convergenceRZ({ D, radius, height, sigma0, seconds, grids }, tol) {
    const errors = [], out = [], s2 = sigma0 ** 2 + 2 * D * seconds, z0 = height / 2;
    const exact = (r, z, s) => Math.exp(-(r * r + (z - z0) ** 2) / (2 * s)) / (2 * Math.PI * s) ** 1.5;
    let mass = 0;
    for (const [nr, nz] of grids) {
      const G = S.cylinder(nr, nz, radius, height), n = new Float64Array(G.n);
      for (let k = 0; k < G.n; k++) n[k] = exact(G.r(k), G.z(k), sigma0 ** 2) * G.vol[k];
      const m0 = S.total(n);
      S.diffuse(G, n, D, seconds);
      mass = Math.max(mass, rel(S.total(n), m0));
      let e = 0;
      for (let k = 0; k < G.n; k++) e = Math.max(e, Math.abs(n[k] / G.vol[k] - exact(G.r(k), G.z(k), s2)));
      errors.push(e / exact(0, z0, s2));
    }
    const orders = errors.slice(1).map((e, i) => Math.log2(errors[i] / e));
    out.push({ name: "grid_order", value: Math.min(...orders), limit: tol.order_min, pass: Math.min(...orders) >= tol.order_min, detail: errors });
    out.push(check("mass_error", mass, tol.mass_relative));
    return out;
  },

  // B14: Säureüberschuss ohne Transport: pH = −lg(Überschuss / Gesamtvolumen) (ideales Modell, 25 °C)
  neutralization({ acid, base }, tol) {
    const l = lab([{ type: "beaker", id: "b", contains: [acid, base] }]);
    L.step(l, 5);
    const conc = (r) => parseFloat(r.reagent.split(" ")[1]);
    const excess = (conc(acid) * acid.ml - conc(base) * base.ml) / (acid.ml + base.ml);
    return [check("pH_error", Math.abs(L.view(l, L.vessel(l, "b")).pH + Math.log10(excess)), tol.pH_absolute)];
  },
};

// Aufbau eines PHREEQC-Vergleichs: ein Becherglas im realen Modell bei 25 °C, bis zum Gleichgewicht
export function phreeqcLab(item) {
  const l = L.createLab(L.normalize({ room: 25, model: "real", bench: [{ type: "beaker", id: "b", contains: item.contains }] }));
  L.step(l, 120);
  return { l, v: L.vessel(l, "b") };
}

const spec = (v) => (L.parts[v.type].sizes ? L.parts[v.type].sizes[v.size] : L.parts[v.type]);      // wie spec() in der Engine

export function run(c) {
  if (c.pending) return { id: c.id, status: "NOT_RUN", reason: c.pending };
  if (!c.model) return { id: c.id, status: "NOT_IMPLEMENTED" };
  if (!models[c.model]) return { id: c.id, status: "NOT_IMPLEMENTED", reason: `model ${c.model} fehlt in run.mjs` };
  const start = performance.now();
  try {
    const checks = models[c.model](c.params, c.tolerance);
    const ok = checks.every((x) => x.pass);
    return { id: c.id, status: ok ? "PASS" : "FAIL", checks, known: ok ? undefined : c.known, ms: Math.round(performance.now() - start) };
  } catch (error) {
    return { id: c.id, status: "FAIL", reason: String(error && error.stack || error), ms: Math.round(performance.now() - start) };
  }
}

const fmt = (x) => (typeof x !== "number" ? String(x) : x === 0 ? "0" : x.toPrecision(3));

if (import.meta.url === `file://${process.argv[1]}`) {
  const arg = (name) => { const i = process.argv.indexOf(name); return i > 0 ? process.argv[i + 1] : null; };
  const only = arg("--id"), format = arg("--format") || "text";
  const results = cases.filter((c) => !only || c.id === only).map((c) => Object.assign({ title: c.title, kind: c.kind }, run(c)));
  let commit = "unknown";
  try { commit = execSync("git rev-parse --short HEAD", { cwd: here, stdio: ["ignore", "pipe", "ignore"] }).toString().trim(); } catch {}
  if (format === "json") console.log(JSON.stringify({ commit, node: process.version, date: new Date().toISOString(), results }, null, 2));
  else {
    const md = format === "markdown";
    if (md) console.log(`| ID | Art | Status | Prüfungen |\n|---|---|---|---|`);
    for (const r of results) {
      const detail = (r.checks ? r.checks.filter((x) => !md || !x.pass || r.checks.length < 9).map((x) => `${x.name}=${fmt(x.value)}${x.pass ? "" : ` (Grenze ${fmt(x.limit)})`}`).join("  ") : r.reason || "") +
        (r.known ? `  [bekannt: ${r.known}]` : "");
      console.log(md ? `| ${r.id} | ${r.kind} | ${r.status} | ${detail.replace(/\|/g, "/")} |` : `${r.id} ${r.status.padEnd(15)} ${detail}`);
    }
    if (!md) console.log(`\nEngine ${commit}: ${["PASS", "FAIL", "NOT_RUN", "NOT_IMPLEMENTED"].map((s) => `${results.filter((r) => r.status === s).length} ${s}`).join(", ")}`);
  }
  process.exitCode = results.some((r) => r.status === "FAIL") ? 1 : 0;
}
