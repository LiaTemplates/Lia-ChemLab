---
type: Standard
title: ISO 385 – Büretten
description: Klassen A, AS und B, Toleranzen, Maße, Schellbachstreifen und Justierung auf Ablauf bei Büretten.
resource: https://www.iso.org/standard/38678.html
tags: [norm, buerette, titration]
status: stable
generated: { by: claude-code/claude-opus-5-5, at: 2026-11-18T11:20:00Z }
stale_after: 2027-11-18T00:00:00Z
sources:
  - id: iso-385-2005
    resource: https://cdn.standards.iteh.ai/samples/38678/9915a76ac17641f191eb0364b59daed6/ISO-385-2005.pdf
    title: ISO 385:2005, Leseprobe (Abschnitte 1–8.6, Tabellen 1 und 2)
    author: process:iso-tc48
---

# Kerndaten

- Justiert auf Ablauf („Ex“) vom Nullstrich bis zu jedem Strich; Bezugstemperatur 20 °C (Tropen 27 °C).[^iso-385-2005]
- Klassen: A und AS (höhere Genauigkeit), B (niedrigere). **AS heißt: 30 s warten**, bevor der Meniskus endgültig eingestellt wird.
- Schellbachrohr: Der farbige Streifen liegt **auf der Rückseite**, dauerhaft, höchstens 40 % des Umfangs (7).
- Hähne aus Glas mit Kegel 1:10 oder aus inertem Kunststoff/Keramik; Dichtheit: bei A/AS höchstens ein Teilstrich in 20 min.

# Tabelle 1 – Teilung und Fehlergrenzen

| Nennvolumen mL | Teilung mL | A und AS ± mL | B ± mL |
|---|---|---|---|
| 10 | 0,02 | 0,02 | 0,05 |
| 25 | 0,05 | 0,03 | 0,05 |
| 25 | 0,10 | 0,05 | 0,10 |
| 50 | 0,10 | 0,05 | 0,10 |
| 100 | 0,20 | 0,10 | 0,20 |

# Tabelle 2 – Maße (Auszug)

| Nennvolumen mL | Teilung mL | Skalenlänge mm | Gesamtlänge max. mm |
|---|---|---|---|
| 50 | 0,10 | 500–600 | 820 |
| 25 | 0,05 | 480–600 | 820 |

# Folge für ChemLab

Die 50-mL-Bürette in ChemLab: Teilung 0,1 mL, Langstrich jeden Milliliter
(nach [ISO 384](/normen/iso-384-messgeraete.md)), Aufdruck „AS · Ex · 20 °C · ± 0,05 mL“,
Schellbachstreifen hinten. Verwendet im [Laborplatz](/gestaltung/laborlook-entwurf.md).

[^iso-385-2005]: ISO 385:2005, Abschnitte 4, 5, 7 und Tabelle 1
