---
type: Design Rule
title: Zeichensprache für Geräte in 2D und 3D
description: Wie ChemLab Geräte, Stoffe, Farben, Skalen und Beschriftungen zeichnet – Seitenansicht im Schnitt nach Versuchsskizze, Details nach Norm.
tags: [design, 2d, 3d, zeichnung, skala]
status: draft
generated: { by: claude-code/claude-opus-5-5, at: 2026-11-18T11:25:00Z }
---

# Grundsatz

Gezeichnet wie eine [Versuchsskizze](/normen/versuchsskizze.md), gebaut wie das echte Gerät:
Seitenansicht im Schnitt, ohne Perspektive. Was im Gefäß ist, sieht man immer
([Entscheidung](/entscheidungen/glas-durchsichtig.md)).

# Linien

| Stärke | Wofür | Grund |
|---|---|---|
| 2,5 px | Glaswand im Schnitt, offene Öffnung, runde Ecken | ≥ 2 × Sichtkante, [ISO 6414](/normen/iso-6414-glaszeichnung.md) Abschnitt 7 |
| 1,25 px | Sichtkanten: Hahn, Stopfen, Ringmarke, Ausguss | |
| 0,4–0,9 px | Skalenstriche (kurz, mittel, lang) | |
| 1 px mit Punkt | Bezugslinie der Beschriftung | |
| 3 px Bernstein | Umriss dessen, was man gerade anfasst | wie heute in ChemLab |

# Stoffe

- Flüssigkeit: Fläche in Stofffarbe, Meniskus nach unten (Wasser); Quecksilber nach oben, oben abgelesen ([ISO 384](/normen/iso-384-messgeraete.md) 5.4).
- Feststoff: Körnchen am Boden. Gas: Blasen und gestrichelter Pfeil. Wärme: Flamme und Wellenlinie.
- Glanzlicht: eine weiße Linie links auf dem Glas, damit Kinder Glas als Glas erkennen.

# Skalen nach ISO 384

- Teilung 1 (0,1 …): jeder 10. Strich lang, mittlerer in der Mitte, vier kurze dazwischen.
- Ziffern nur an Langstrichen, direkt darüber und etwas rechts der kurzen; jeder Langstrich beziffert.
- Wo der Platz nicht reicht (Bürette in der Übersicht): nur Langstriche, Ziffern außen; die Lupe zeigt die volle Teilung.

# Farben

| Rolle | Farbe |
|---|---|
| Glas | #2F4356, Glasfläche #E4EDF3 |
| Metall | #7C8794 · Gummi #9C3D24 |
| Labortisch | #D8CDBA · Fliesenwand #F2EFE8 |
| Akzent | #136F70 · in der Hand #B45309 |

Genormte Farben nur dort, wo eine Norm sie vorsieht; siehe [Entscheidung](/entscheidungen/genormte-farben.md).

# Beschriftung

Wie im Protokoll: Namen außen, waagerecht, links und rechts gesammelt, Bezugslinien kreuzen sich nicht.
In „Labor“ kommen Klasse, Aufdruck und Toleranz dazu ([Detailstufen](/gestaltung/detailstufen.md)).

# Gerätedetails, die ein echter Chemiker erwartet

- Bürette mit Schellbachstreifen hinten, 0 oben, Aufdruck „AS · Ex · 20 °C“ ([ISO 385](/normen/iso-385-buerette.md)).
- Messkolben mit Ringmarke ganz herum im unteren Halsdrittel ([ISO 1042](/normen/iso-1042-messkolben.md)).
- Messzylinder mit Ausguss und Sechseckfuß, Aufdruck „In“ ([ISO 4788](/normen/iso-4788-messzylinder.md)).
- Becherglas mit Ausguss, Skala nur ungefähr ([ISO 3819](/normen/iso-3819-becherglas.md)).
- Erlenmeyer mit kurzem Hals ([ISO 1773](/normen/iso-1773-kolben.md)); Rundkolben mit Schliff „NS 29/32“.
- Vollpipette 10 mL mit rotem Ring ([ISO 1769](/normen/iso-1769-pipetten-farbcode.md)).
- Stativ mit Muffe und Klemme, Gashahn mit gelbem Griff ([EN 13792](/normen/en-13792-armaturen.md)).
