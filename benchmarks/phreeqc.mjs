// Vergleichsdaten aus PHREEQC für B16 und B25 erzeugen. Aufruf (PHREEQC muss installiert sein):
//   node benchmarks/phreeqc.mjs [Pfad zu phreeqc.dat] [Versionsangabe]
// Je Fall zwei Läufe: "chemlab" mit einer Datenbank aus ChemLabs eigenen Konstanten und Aktivitätsparametern (prüft Löser und
// Aktivitätsmodell), "phreeqc.dat" mit der Standarddatenbank (zeigt, wie weit ChemLabs Datenauswahl abweicht). Das Ergebnis steht in
// references/phreeqc.json; run.mjs vergleicht dagegen, ohne PHREEQC zu brauchen.
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { cases, phreeqcLab } from "./run.mjs";

const L = globalThis.LiaChemLab;
const here = new URL(".", import.meta.url);
const database = process.argv[2] || path.join(os.homedir(), ".local/share/doc/phreeqc/database/phreeqc.dat");
const version = process.argv[3] || "3.8.6-17100";
const WATER = "H2O(l)";

// ChemLab-Name → PHREEQC-Name: "CO3^2-(aq)" → "CO3-2", "H2O(l)" → "H2O"
const pq = (id) => (id === WATER ? "H2O" : id.replace(/\((aq|l)\)$/, "").replace(/\^(\d)([+-])$/, "$2$1"));
const MASTER = { Na: "Na+(aq)", K: "K+(aq)", Ca: "Ca^2+(aq)", Mg: "Mg^2+(aq)", Cl: "Cl-(aq)", C: "CO3^2-(aq)", S: "SO4^2-(aq)", P: "PO4^3-(aq)", F: "F-(aq)" };
const ELEMENT = { C: "C(4)", S: "S(6)" };       // in phreeqc.dat mit Oxidationsstufe, damit nichts reduziert wird
const gfw = (id) => L.species(id).M.toFixed(4);

function gamma(id) {
  const g = L.db.species[id].gamma;
  return g ? `\n  -gamma ${g[0]} ${g[1]}` : "";
}

// Datenbank aus den Gleichgewichten, die im Gefäß wirken: jede Art wird durch die Reaktion eingeführt, in der sie als einzige neu ist
function ownDatabase(v) {
  const present = new Set(Object.keys(v.n).filter((id) => v.n[id] > 0).concat([WATER, "H+(aq)", "OH-(aq)"]));
  const eqs = L.db.equilibria.filter((e) => (!e.model || e.model === "real") && Object.keys(e.nu).every((id) => present.has(id)));
  const elements = new Set();
  for (const id of present) for (const el of Object.keys(L.parse(id).atoms)) if (el !== "H" && el !== "O") elements.add(el);
  const master = {};
  for (const el of elements) {
    if (!MASTER[el] || !L.db.species[MASTER[el]]) throw new Error("keine Leitart für " + el);
    master[el] = MASTER[el];
  }
  const defined = new Set([WATER, "H+(aq)", ...Object.values(master)]);
  let text = `SOLUTION_MASTER_SPECIES\nH H+ -1.0 H 1.008\nH(1) H+ -1.0 0\nE e- 0.0 0.0 0.0\nO H2O 0.0 O 16.00\nO(-2) H2O 0.0 0\n`;
  for (const el of elements) text += `${el} ${pq(master[el])} 0.0 ${gfw(master[el])} ${L.species(master[el]).M.toFixed(4)}\n`;
  // H2 und O2 verlangt PHREEQC für die Redoxrechnung; Werte aus phreeqc.dat, hier ohne Einfluss (pe bleibt bei 4)
  text += `SOLUTION_SPECIES\nH+ = H+${gamma("H+(aq)")}\ne- = e-\nH2O = H2O\n2 H+ + 2 e- = H2\n  log_k -3.15\n2 H2O = O2 + 4 H+ + 4 e-\n  log_k -86.08\n`;
  for (const el of elements) text += `${pq(master[el])} = ${pq(master[el])}${gamma(master[el])}\n`;
  const aq = eqs.filter((e) => e.aq), solids = eqs.filter((e) => e.solid);
  for (let progress = true; progress;) {
    progress = false;
    for (const e of aq) {
      if (e.done) continue;
      const fresh = Object.keys(e.nu).filter((id) => !defined.has(id));
      if (fresh.length > 1) continue;
      e.done = true;
      if (!fresh.length) continue;                          // ergibt sich aus den anderen
      const s = fresh[0], scale = 1 / e.nu[s], left = [], right = [`${pq(s)}`];
      for (const [id, n] of Object.entries(e.nu)) {
        if (id === s) continue;
        const c = n * scale;
        (c < 0 ? left : right).push(`${+Math.abs(c).toFixed(6)} ${pq(id)}`);
      }
      text += `${left.join(" + ")} = ${right.join(" + ")}\n  log_k ${(e.logK * scale).toFixed(6)}${gamma(s)}\n`;
      defined.add(s);
      progress = true;
    }
  }
  for (const e of aq) delete e.done;
  text += "PHASES\n";
  solids.forEach((e, k) => {
    const products = Object.entries(e.nu).filter(([id]) => id !== e.solid).map(([id, n]) => `${+(n * e.f).toFixed(6)} ${pq(id)}`);
    text += `Solid${k}\n  ${e.solid.replace("(s)", "").replace("*", ":")} = ${products.join(" + ")}\n  log_k ${(e.logK * e.f).toFixed(6)}\n`;
  });
  return { text, solids: solids.map((e, k) => ({ id: e.solid, phase: `Solid${k}` })) };
}

// Gesamtmengen je Element in mol/L der Lösung (gelöst und fest), wie ChemLab sie im Gefäß hat
function totals(v) {
  const vol = L.volume(v), out = {};
  for (const [id, n] of Object.entries(v.n)) {
    if (id === WATER || !(n > 0)) continue;
    for (const [el, k] of Object.entries(L.parse(id).atoms)) if (el !== "H" && el !== "O") out[el] = (out[el] || 0) + n * k / vol;
  }
  return out;
}

function run(input, db) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "chemlab-phreeqc-"));
  fs.writeFileSync(path.join(dir, "in.pqi"), input);
  try { execFileSync("phreeqc", ["in.pqi", "out.pqo", db], { cwd: dir, stdio: "ignore" }); } catch (error) {
    const said = fs.existsSync(path.join(dir, "out.pqo")) ? fs.readFileSync(path.join(dir, "out.pqo"), "utf8").split("\n").filter((x) => /ERROR/.test(x)).join("\n") : "";
    throw new Error(`PHREEQC scheiterte (${dir}):\n${said}`);
  }
  const lines = fs.readFileSync(path.join(dir, "out.sel"), "utf8").trim().split("\n").map((l) => l.trim().split(/\s+/));
  fs.rmSync(dir, { recursive: true });
  return Object.fromEntries(lines[0].map((h, i) => [h, +lines[lines.length - 1][i]]));      // die letzte Zeile: nach den Phasen
}

const out = { phreeqc: version, database: path.basename(database), date: new Date().toISOString().slice(0, 10), cases: {} };
for (const c of cases.filter((x) => x.model === "phreeqc" && x.params.cases)) {      // B26 rechnet mit den Fällen von B16 und B25
  for (const item of c.params.cases) {
    const { v } = phreeqcLab(item), own = ownDatabase(v), tot = totals(v);
    const species = item.species.map(pq);
    for (const which of ["chemlab", "phreeqc.dat"]) {
      const named = (el) => (which === "phreeqc.dat" && ELEMENT[el] ? ELEMENT[el] : el);
      const phases = which === "chemlab" ? own.solids.map((s) => s.phase) : item.phases || [];
      const input = `SOLUTION 1\n  temp 25\n  units mol/l\n  density 1\n  pH 7 charge\n` +
        Object.entries(tot).map(([el, m]) => `  ${named(el)} ${m.toPrecision(10)}\n`).join("") +
        (phases.length ? `EQUILIBRIUM_PHASES 1\n${phases.map((p) => `  ${p} 0 0\n`).join("")}` : "") +
        `SELECTED_OUTPUT 1\n  -file out.sel\n  -reset false\n  -pH true\n  -molalities ${species.join(" ")}\nEND\n`;
      let db = database;
      if (which === "chemlab") { db = path.join(os.tmpdir(), "chemlab-own.dat"); fs.writeFileSync(db, own.text); }
      const result = run(input, db);
      out.cases[`${c.id}/${item.name}/${which}`] = { input, database: which === "chemlab" ? own.text : path.basename(database), pH: result.pH,
        m: Object.fromEntries(item.species.map((id) => [id, result["m_" + pq(id)]])) };
      console.log(c.id, item.name, which.padEnd(11), "pH", result.pH, item.species.map((id) => `${id} ${result["m_" + pq(id)]}`).join("  "));
    }
  }
}
fs.mkdirSync(new URL("references/", here), { recursive: true });
fs.writeFileSync(new URL("references/phreeqc.json", here), JSON.stringify(out, null, 1) + "\n");
