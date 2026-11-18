# ChemLab: Was ist gerechnet, was geschätzt, was nur gezeigt?

Stand: Branch `benchmarks`, ausgehend von `249db01` (Version 0.3.0). Prüfen: `node --test check.mjs` (alte Tests) und `node benchmarks/run.mjs` (wissenschaftliche Fälle B01–B25, Status je Fall).

## Klassen

| Klasse | Bedeutung | Beispiele im Code |
|---|---|---|
| **physikalisch** | aus Erhaltungssätzen oder Gesetzen ohne freie Parameter | Stoff- und Ladungsbilanz, ideales Gasgesetz im Gasraum, Faraday, Nernst, Diffusion in `chemlab-spatial.js` |
| **empirisch** | Gesetz mit Literaturparametern (Quelle steht als `src` im Datensatz) | Gleichgewichtskonstanten (phreeqc.dat, LLNL), Henry-Konstanten, Bildungsenthalpien, Aktivitätskoeffizienten (Davies/Truesdell-Jones) |
| **heuristisch** | Größenordnung geschätzt, im Code mit „geschätzt“ markiert | `AERATE` (k_L an der Oberfläche), `POP`, `CRACK`, `SHUT`, `FILM`, Absetzzeiten, Überspannungen |
| **rein visuell** | ändert keinen chemischen Zustand | Strömungsansicht (`show.flow`, Feldmittel an v.T gebunden, Kopplung nur Engine → Bild), Blasen, Schlieren, Scherben, 3D-Looks |

## Ist/Soll

| Bereich | Ist (Code) | Lücke laut Entwicklungsplan |
|---|---|---|
| Gasinventar | `v.air` (mol je Gas im Gasraum), `v.out` (entwichen), `v.taken` (aus der Luft genommen); Druck im verschlossenen Gefäß über `v.seal` (eingeschlossene Luft, mol) und Dampfdruck | Sauerstoff der eingeschlossenen Luft war nicht begrenzt (shortcut in `aerate`, `airborne`) → Schritt 2 |
| O₂-Aufnahme | `aerate`: Henry + k_L·A/V an ruhiger Oberfläche, k_L·a beim Schütteln; nur wo O₂(aq) schon da ist oder verbraucht werden kann | N₂ und CO₂ aus der Luft fehlen (CO₂ würde reines Wasser auf pH 5,6 bringen: nur als Option, sonst ändern sich alle Bestandsversuche) |
| offen/geschlossen | `stopper`/`manometer` dicht, `tube` mit Druckausgleich, Kolbenprober | – |
| Oberflächen | Feststoffstücke mit Fläche (`area`), Elektroden mit Fläche und Belag | – |
| Korrosion | `corrode`: Mischpotential, Butler-Volmer mit halbem Durchtrittsfaktor, Grenzstrom aus Nachschub (`processes`, `reach`) | Passivschicht als eigener Zustand fehlt (nur „dichter Belag“ an Elektroden, `SHUT`) |
| Kristallisation | Gleichgewichtsfällung (`saturation`, `balance`), Eindampfen (`dry`) | keine Übersättigung/Keimbildungsverzögerung, keine Größenklassen |
| Strömung | nur Darstellung (siehe oben) | gekoppelter Transport: `chemlab-spatial.js` (noch nicht an Gefäße gebunden) |
| 3D | Three.js lazy (`chemlab-3d.js`, `registerScene`, `registerLook`), WebGL2-Prüfung | Feldtextur für r,z-Felder |
| Historie | `createRun`/`record`: Abbilder (JSON-Snapshots) mit Zeit; `saveRun`/`loadRun` | räumliche Felder speicherbewusst mitschreiben |
| Zufall | `jitter(seed, …)` für Messrauschen, Seed im Experiment | – |

## Räumlicher Transport (`chemlab-spatial.js`)

- Konservatives Finite-Volumen-Verfahren, explizit, Zeitschritt automatisch 0,45 × Stabilitätsgrenze (`D·Σg·dt ≤ V` je Zelle). Masse bleibt bis auf Rundung (10⁻¹⁵) erhalten.
- Gitter: `line` (1D), `cylinder` (achsensymmetrisch r,z, Ringvolumina, Mantelflächen mit 2πr; an der Achse keine Fläche, also kein Fluss).
- Ränder: ohne Fluss (Vorgabe), feste Konzentration (`edge: {cell, g, c}`), fester Fluss (`edge: {cell, flux}`).
- Gültig: Fick-Diffusion ungeladener Teilchen in ruhender Flüssigkeit, konstantes D. **Nicht** gültig für Ionen ohne Elektroneutralität (Nernst-Planck fehlt), Strömung, steife lokale Chemie.
- Physikalische Zeit: D ≈ 10⁻⁹ m²/s braucht für 1 cm rund 10⁵ s. Eine schnelle sichtbare Front wäre beschleunigte Zeit und muss so gekennzeichnet werden.
- Rechenaufwand explizit: Schritte ∝ 1/Δr². 128×256 Zellen über 900 s: etwa 1 s in Node.

## Benchmarks: was ein PASS bedeutet

- **A (analytisch)** prüft den Algorithmus, nicht die Chemie.
- **C (Messwert)**: B04 vergleicht die O₂-Henry-Konstante der Engine (aus LLNL log K) mit Benson & Krause bei gleichem Partialdruck: Abweichung 2,0 %, Grenze 3 %. Die Engine rechnet mit 0,21 bar trockener Luft, ohne Wasserdampfabzug; bei 25 °C liegt die Sättigung damit etwa 3 % über dem Tabellenwert für 1 atm feuchte Luft.
- NOT_RUN heißt: Referenzdaten fehlen (NIST-Zertifikat, PHREEQC-Lauf, AquaSolDB, ThermoML). Sie werden erst nach Lizenzprüfung eingetragen.
