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
| Gasinventar | `v.air` (mol je Gas im Gasraum), `v.out` (entwichen), `v.taken` (aus der Luft genommen); Druck im verschlossenen Gefäß über `v.seal` (eingeschlossene Luft, mol) und Dampfdruck. **Neu:** `v.o2`, der Sauerstoff der eingeschlossenen Luft; dicht verschlossen (Stopfen, Manometer, Rohr) nehmen `aerate`, `airborne` und die Kinetik nur noch ihn (B02, B06, B07) | Kolbenprober am Gefäß: Sauerstoff weiter unbegrenzt (eigene Luftrechnung `t.air`) |
| O₂-Aufnahme | `aerate`: Henry + k_L·A/V an ruhiger Oberfläche, k_L·a beim Schütteln; nur wo O₂(aq) schon da ist oder verbraucht werden kann. **Neu:** Laborschalter `"oxygen": true`: jede wässrige Lösung nimmt Luftsauerstoff auf | N₂ und CO₂ aus der Luft fehlen (CO₂ würde reines Wasser auf pH 5,6 bringen: nur als Option, sonst ändern sich alle Bestandsversuche) |
| offen/geschlossen | `stopper`/`manometer` dicht, `tube` mit Druckausgleich, Kolbenprober | – |
| Oberflächen | Feststoffstücke mit Fläche (`area`), Elektroden mit Fläche und Belag | – |
| Korrosion | `corrode`: Mischpotential, Butler-Volmer mit halbem Durchtrittsfaktor, Grenzstrom aus Nachschub (`processes`, `reach`). **Neu:** Ein Gas als Ausgangsstoff (O₂-Reduktion) steht an Metallstücken und Elektroden gelöst bereit, mit Henry-Druck aus O₂(aq) und dessen Nachschub (`solved`, B19); Fe–Zn über den Strommesser schützt das Eisen | **Neu:** Passivschicht `passive` (Aluminium im Ionen-Paket, B20): Dicke als Zustand, pH-Bereich, Reststrom, Lochfraß über E_pit(Cl⁻), Werte aus docs/literature.md; Zeiten geschätzt, nur an Stücken; kein Chlorid-Effekt; k_Film geschätzt, Raten nur qualitativ |
| Kristallisation | Gleichgewichtsfällung (`saturation`, `balance`), Eindampfen (`dry`); Auflösen eines Stücks mit schrumpfender Fläche (`pace`, B22). **Neu:** `nucleate: {S, t, grow}` an einem Löslichkeitsgleichgewicht: ohne Keim metastabil bis Q/K ≥ S, dann nach t s Keim, Wachstum mit grow; Impfkristall = Feststoff im Gefäß (B21); bisher nur KNO3, Werte illustrativ | keine Keimbildungsrate nach klassischer Theorie, kein Zufall, keine Größenklassen; τ des Auflösens (15 s) geschätzt |
| Strömung | nur Darstellung (siehe oben) | gekoppelter Transport: `chemlab-spatial.js` (noch nicht an Gefäße gebunden) |
| Feld im Gefäß | **Neu:** `"spatial": true` am Becherglas: 10×20 Zellen r,z, Diffusion der Ladung starker Ionen (ein D = 2·10⁻⁹ m²/s, Zeitraffer ×600), pH und Farbe je Zelle aus dem Gleichgewicht der Gefäßlösung mit dem lokalen Überschuss (Tabelle über 25 Punkte), pH-Meter misst an seiner Spitze; im Verlauf gespeichert | keine gerechnete Strömung (eine schwerere Zugabe sinkt in einer angenommenen Mischzone, ZONE_SINK × ihr Volumen, entlang der Achse bis zum Boden), schwache Säuren/Puffer/Indikator/Fällungen gleichmäßig, kein Nernst-Planck, nur Becherglas, in 3D als Schnittebene oder Teilchen wie die Strömung (hat Vorrang vor ihr); Zugabe mischt sich beim Auftreffen mit 1 mL (geschätzt). **Fällung im Feld:** Feststoffe aus starken Ionen (AgCl, AgBr, AgI): Ionen wandern je für sich, je Zelle sofort ins Löslichkeitsgleichgewicht (ideal, 1:1 geschlossen gelöst), Niederschlag bleibt liegen; Trübung je Zelle; ohne Absetzen, ohne Komplexe, ohne Wartezeit der Keimbildung je Zelle |
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
- **B (Referenzsoftware)**: B16 und B25 rechnen dieselben Lösungen (Gips, Fluorit, Hydrogencarbonat, Phosphatpuffer, Natriumsulfat; reales Modell, 25 °C) in PHREEQC 3.8.6 mit einer Datenbank aus ChemLabs eigenen Konstanten: höchstens 0,002 Abweichung im pH und 0,009 in lg c. Löser und Aktivitätsmodell rechnen also wie PHREEQC. B26 vergleicht dieselben Fälle mit der Standarddatenbank `phreeqc.dat` 3.8.6 und schlägt bekannt fehl: Das Ionenpaar NaSO₄⁻ ist dort neuer eingetragen (log K 1,21 statt 0,94, andere γ-Parameter), CaSO₄(aq) mit 2,25 statt 2,36; Gips und Natriumsulfat weichen um 0,24 bzw. 0,17 in lg c ab, die übrigen Fälle um höchstens 0,05 (pH) bzw. 0,03 (lg c). Neu erzeugen: `node benchmarks/phreeqc.mjs` (braucht PHREEQC); die Ergebnisse liegen in `benchmarks/references/phreeqc.json`, damit die Prüfung ohne PHREEQC läuft.
- Ein FAIL mit `known` ist eine dokumentierte Abweichung; der Test in `check.mjs` lässt nur solche zu.
- **C (Messwert) B18**: Eisen–Zink verliert keine Ladung am Mischpotential. Aluminium in 0,01 M NaCl verfehlt das gemessene Ruhepotential um 1 V und bildet fälschlich Lochfraß: Das Passivmodell legt das Potential der bedeckten Folie nicht fest (siehe B18, `known`). Die Korrosion von Aluminium in Kochsalzlösung ist deshalb nur qualitativ, in Wasser, Säure und Lauge betrifft es das Verhalten nicht.
- NOT_RUN heißt: Referenzdaten fehlen (NIST-Zertifikat, AquaSolDB, ThermoML). Sie werden erst nach Lizenzprüfung eingetragen.
