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

const spec = (v) => (L.parts[v.type].sizes ? L.parts[v.type].sizes[v.size] : L.parts[v.type]);      // wie spec() in der Engine

export function run(c) {
  if (c.pending) return { id: c.id, status: "NOT_RUN", reason: c.pending };
  if (!c.model) return { id: c.id, status: "NOT_IMPLEMENTED" };
  if (!models[c.model]) return { id: c.id, status: "NOT_IMPLEMENTED", reason: `model ${c.model} fehlt in run.mjs` };
  const start = performance.now();
  try {
    const checks = models[c.model](c.params, c.tolerance);
    return { id: c.id, status: checks.every((x) => x.pass) ? "PASS" : "FAIL", checks, ms: Math.round(performance.now() - start) };
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
      const detail = r.checks ? r.checks.map((x) => `${x.name}=${fmt(x.value)}${x.pass ? "" : ` (Grenze ${fmt(x.limit)})`}`).join("  ") : r.reason || "";
      console.log(md ? `| ${r.id} | ${r.kind} | ${r.status} | ${detail.replace(/\|/g, "/")} |` : `${r.id} ${r.status.padEnd(15)} ${detail}`);
    }
    if (!md) console.log(`\nEngine ${commit}: ${["PASS", "FAIL", "NOT_RUN", "NOT_IMPLEMENTED"].map((s) => `${results.filter((r) => r.status === s).length} ${s}`).join(", ")}`);
  }
  process.exitCode = results.some((r) => r.status === "FAIL") ? 1 : 0;
}
