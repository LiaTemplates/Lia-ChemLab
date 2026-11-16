#!/usr/bin/env node
// ChemLab – füllt einen Stoffeintrag aus offenen Datenbanken vor.
//
//   node tools/import.mjs <Name oder CAS-Nummer> [--phreeqc datei.dat …]
//
// Fragt PubChem (Formel, molare Masse und aus der Hazardous Substances Data Bank Siedepunkt, Dichte, Verdampfungsenthalpie;
// gemeinfrei) und Wikidata (Namen, CC0) und sucht in PHREEQC-Dateien nach Zeilen, die den Stoff nennen. Heraus kommt ein
// Eintrag im Format der Pakete, mit Quellen, und eine Liste dessen, was noch fehlt oder von Hand zu prüfen ist.
// Der Eintrag ist ein Vorschlag: Das Kennzeichen des Stoffs ist die Summenformel mit (aq) und lässt sich umbenennen,
// Bildungsenthalpie und Gleichgewichte trägt niemand ungeprüft ein.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const AGENT = "ChemLab-import (LiaScript-Baustein)";
const HEADINGS = ["Boiling Point", "Melting Point", "Density", "Heat of Vaporization"];
const HSDB = /Hazardous Substances Data Bank/;
const PATTERN = {
  "°C": /(-?\d+(?:\.\d+)?)\s*°C/,
  density: /(\d+(?:\.\d+)?)\s*g\/(?:cu ?cm|cm3|cm³|mL)/,
  kJ: /(\d+(?:\.\d+)?)\s*kJ\/mole?/
};

// Die erste Angabe der Hazardous Substances Data Bank zu einer Überschrift, die eine Zahl in der gesuchten Einheit enthält
export function hsdb(view, unit) {
  const record = view && view.Record;
  if (!record) return null;
  const sources = {};
  (record.Reference || []).forEach((r) => { sources[r.ReferenceNumber] = r.SourceName || ""; });
  const found = [];
  (function walk(node) {
    if (Array.isArray(node)) return node.forEach(walk);
    if (!node || typeof node !== "object") return;
    if (node.Value && HSDB.test(sources[node.ReferenceNumber] || "")) {
      const text = (node.Value.StringWithMarkup || []).map((m) => m.String).join(" ");
      const match = PATTERN[unit].exec(text);
      if (match) found.push({ value: +match[1], text });
    }
    Object.values(node).forEach(walk);
  })(record);
  return found[0] || null;
}

function phreeqcNotes(files, names) {
  const notes = [], wanted = names.filter(Boolean).map((n) => n.toLowerCase());
  files.forEach(({ file, text }) => {
    const lines = text.split(/\r?\n/);
    lines.forEach((line, i) => {
      if (!/=/.test(line) || /^\s*-/.test(line)) return;
      const tokens = line.toLowerCase().split(/[\s=+]+/);
      if (!wanted.some((w) => tokens.includes(w))) return;
      const extra = [];
      for (let k = i + 1; k < lines.length && k < i + 8 && !/=/.test(lines[k]); k++)
        if (/^\s*-?(log_k|delta_h|gamma)/i.test(lines[k])) extra.push(lines[k].trim());
      notes.push(`${path.basename(file)}: ${line.trim()}${extra.length ? " (" + extra.join("; ") + ")" : ""}`);
    });
  });
  return notes;
}

// Baut aus den Antworten der Datenbanken den Eintrag. data: { cid, formula, M, title, views: { Überschrift: Antwort },
// wikidata: Antwort der SPARQL-Abfrage oder null, phreeqc: [{ file, text }], query }
export function entry(data) {
  const notes = [], src = [`PubChem CID ${data.cid}`];
  const row = data.wikidata && data.wikidata.results && data.wikidata.results.bindings[0];
  const name = { de: row && row.de ? row.de.value : data.title, en: row && row.en ? row.en.value : data.title };
  if (!row || !row.de) notes.push("Deutscher Name fehlt in Wikidata: von Hand eintragen.");
  const tb = hsdb(data.views["Boiling Point"], "°C"), mp = hsdb(data.views["Melting Point"], "°C");
  const rho = hsdb(data.views["Density"], "density"), heat = hsdb(data.views["Heat of Vaporization"], "kJ");
  const solid = !!(mp && mp.value > 25), id = data.formula + (solid ? "(s)" : "(aq)");
  const species = { name, Hf: null };
  const facts = [];
  if (solid) {                                                   // fest: als Stück aus dem Regal; Eigenvolumen und Sieden gelten nur Gelöstem
    src.push(`Hazardous Substances Data Bank (gemeinfrei): Schmelzpunkt ${mp.text}`);
    if (row) src.push(`Namen: Wikidata ${row.item.value.split("/").pop()} (CC0)`);
    species.src = src.join("; ");
    notes.push("Bildungsenthalpie (Hf) und Entropie (S) fehlen: aus CODATA oder einer anderen Quelle, die das Paket verwenden darf.");
    notes.push("area (Oberfläche in cm² je g) ist geschätzt: 10 für Körner, mehr für Pulver.");
    return { species: { [id]: species }, reagents: { [/^\d+-\d+-\d$/.test(data.query) ? name.en.toLowerCase() : data.query]: { name, solid: id, area: 10, group: "solid" } },
      notes: notes.concat(phreeqcNotes(data.phreeqc || [], [data.title, data.formula])) };
  }
  if (rho) { species.Vm = +(data.M / rho.value).toFixed(2); facts.push(`Dichte ${rho.text} (Vm = ${data.M}/${rho.value})`); }
  else notes.push("Dichte fehlt: ohne Vm nimmt der Stoff keinen Platz ein.");
  if (tb && heat) { species.Tb = tb.value; species.Hvap = heat.value; facts.push(`Siedepunkt ${tb.text}`, `Verdampfungsenthalpie ${heat.text}`); }
  else notes.push("Siedepunkt oder Verdampfungsenthalpie fehlt: der Stoff verdampft nicht mit.");
  notes.push("Bildungsenthalpie (Hf) fehlt: aus CODATA oder einer anderen Quelle, die das Paket verwenden darf; ohne sie rechnen Reaktionen ohne Wärme.");
  notes.push(`Kennzeichen ${id} aus der Summenformel: wenn nötig umbenennen (etwa C2H5OH(aq)) und Gleichungen danach schreiben.`);
  if (facts.length) src.push("Hazardous Substances Data Bank (gemeinfrei): " + facts.join(", "));
  if (row) src.push(`Namen: Wikidata ${row.item.value.split("/").pop()} (CC0)`);
  species.src = src.join("; ");
  const reagents = {};
  if (rho && !(mp && mp.value > 20)) {
    reagents[/^\d+-\d+-\d$/.test(data.query) ? data.title.toLowerCase() : data.query] = { name, solution: { [id]: +(rho.value * 1000 / data.M).toFixed(2) }, group: "other" };
    if (!mp) notes.push("Schmelzpunkt unbekannt: prüfen, ob der Stoff bei Raumtemperatur flüssig ist (die Vorratsflasche nimmt das an).");
  }
  return { species: { [id]: species }, reagents, notes: notes.concat(phreeqcNotes(data.phreeqc || [], [data.title, data.formula])) };
}

async function json(url) {
  const response = await fetch(url, { headers: { "User-Agent": AGENT, Accept: "application/json" } });
  if (!response.ok) throw new Error(`${url}: HTTP ${response.status}`);
  return response.json();
}

async function main(args) {
  const files = [], words = [];
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--phreeqc") { while (args[i + 1] && !args[i + 1].startsWith("--")) files.push(args[++i]); }
    else words.push(args[i]);
  }
  const query = words.join(" ");
  if (!query) { console.error("Aufruf: node tools/import.mjs <Name oder CAS-Nummer> [--phreeqc datei.dat …]"); process.exit(2); }
  const pug = "https://pubchem.ncbi.nlm.nih.gov/rest/pug";
  const cid = (await json(`${pug}/compound/name/${encodeURIComponent(query)}/cids/JSON`)).IdentifierList.CID[0];
  const p = (await json(`${pug}/compound/cid/${cid}/property/MolecularFormula,MolecularWeight,Title/JSON`)).PropertyTable.Properties[0];
  const views = {};
  for (const heading of HEADINGS) {
    views[heading] = await json(`https://pubchem.ncbi.nlm.nih.gov/rest/pug_view/data/compound/${cid}/JSON?heading=${encodeURIComponent(heading)}`).catch(() => null);
  }
  const sparql = `SELECT ?item ?de ?en WHERE { ?item wdt:P662 "${cid}". OPTIONAL { ?item rdfs:label ?de FILTER(LANG(?de) = "de") } OPTIONAL { ?item rdfs:label ?en FILTER(LANG(?en) = "en") } } LIMIT 1`;
  const wikidata = await json("https://query.wikidata.org/sparql?format=json&query=" + encodeURIComponent(sparql)).catch(() => null);
  const phreeqc = files.map((file) => ({ file, text: fs.readFileSync(file, "utf8") }));
  const out = entry({ cid, formula: p.MolecularFormula, M: +(+p.MolecularWeight).toFixed(2), title: p.Title, views, wikidata, phreeqc, query });
  console.log(JSON.stringify({ species: out.species, reagents: out.reagents }, null, 2));
  console.error("\nHinweise:\n" + out.notes.map((n) => "- " + n).join("\n"));
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  main(process.argv.slice(2)).catch((error) => { console.error(String(error.message || error)); process.exit(1); });
}
