---
type: Design
title: Entwurf „ChemLab Laborlook“
description: Design-Leinwand mit sechs Artboards – Normen, Zeichensprache, Gerätetafel, Laborplatz 2D, 3D-Leitlinien und Abgleich mit den Normtexten.
resource: https://claude.ai/artifact/LBhYZpzZt6NPUsb3njWzfu
tags: [entwurf, design, laborlook]
status: draft
generated: { by: claude-code/claude-opus-5-5, at: 2026-11-18T13:40:00Z }
sources:
  - id: leinwand
    resource: https://claude.ai/artifact/LBhYZpzZt6NPUsb3njWzfu
    title: Design-Leinwand ChemLab Laborlook (privat, Version 7)
    author: claude-code/claude-opus-5-5
    last_modified: 2026-11-18T11:05:00Z
---

# Überblick

Entwurf vom 18.11.2026 auf einer privaten Design-Leinwand.[^leinwand]

# Stand der Umsetzung

Zeichnungen in 2D und 3D umgesetzt am 18.11.2026 auf dem Branch `laborlook` (Arbeitsordner
`../Lia-ChemLab-laborlook`), noch nicht in `master`:

- Skalen nach [ISO 384](/normen/iso-384-messgeraete.md) über `L.graduation` (gemeinsam für 2D und 3D), in 2D mit gröberer Teilung, wo der Platz fehlt.
- Bürette: Schellbachstreifen mit Spitzen am Meniskus, Aufdruck „50 mL · AS / Ex · 20 °C“, Doppelmuffen; in 3D Teilung 0,1 mL.
- Messzylinder „A · In · 20 °C“, Messkolben mit Ringmarke ganz herum und Aufdruck, Kegelschliff am Rundkolben.
- Gashahn mit gelbem Griff, Fliesenwand (10 cm), Glaswand 2,5 px zu Sichtkanten 1,25 px.
- 3D: Schilder in fester Bildschirmgröße, Startansicht 15° erhöht von vorn, Sonne höher (kürzere Schatten).
- Teil 2 (Commit ecf3f17): Thermometer mit Emaillestreifen, Ausdehnungskammer und Ring ([ISO 386](/normen/iso-386-thermometer.md)),
  Kolbenprober mit gestufter Skala, Trichter mit 60° ([ISO 4798](/normen/iso-4798-trichter.md)), Scheidetrichter „100 mL“
  ([ISO 4800](/normen/iso-4800-scheidetrichter.md)), Reagenzglas „boro 3.3“ ([ISO 4142](/normen/iso-4142-reagenzglas.md)), Schliff am Rundkolben in 3D.

- Teil 3 (Commit 3efd960, nach dem [Vergleich](/gestaltung/vergleich-simulatoren.md)): Messkolben birnenförmig, Hahngriff rechts,
  Bürettenklemme mit Backen, Schriftfeld auf dem Becherglas.

- Commit af23e4c: Stative in 3D hinter der Reihe, Platte in Richtung des Arms; Trichter mit Glasrand und tragendem Ring.
- Commit 7ec1fd2: **Erlenmeyerkolben** als Gefäß (100 und 250 mL, [ISO 1773](/normen/iso-1773-kolben.md)), beide Titrationen der README
  nutzen ihn; die aufgezogene **Vollpipette** steht sichtbar im Gefäß, mit Farbring nach [ISO 1769](/normen/iso-1769-pipetten-farbcode.md) (nur 2D).

Nicht umgesetzt: die Schalter „Entdecken/Labor“ und „Beschriften“, die Lupe, die aufgezogene Pipette in 3D; Kühler ohne Normdetails (ISO 4799 nicht lesbar); Aufdrucke in 3D
(Messzylinder, Messkolben, Scheidetrichter, Reagenzglas) und Schliff am Scheidetrichter.

# Artboards

| Artboard | Inhalt |
|---|---|
| Normen und Konventionen | was genormt ist und was nur Praxis; sechs Folgerungen |
| Zeichensprache | Linien, Stoffe, Farben, Beschriftung, drei Detailstufen am Messzylinder |
| Gerätetafel | zwölf Geräte neu gezeichnet, je ein Satz für Kinder und eine Labordaten-Zeile |
| Laborplatz 2D | Titration, Schalter „Entdecken/Labor“ und „Beschriften“ funktionieren; Lupe am Meniskus |
| 3D-Leitlinien | Heute → Vorschlag, Kameravorgaben |
| Abgleich mit den Normtexten | 24 Angaben: 11 bestätigt, 9 korrigiert, 2 ergänzt, 2 offen |

# Look

- Grund #FBFAF7, Tinte #1E2933, Akzent Türkis #136F70, „in der Hand“ Bernstein #B45309.
- Schriften: Space Grotesk (Überschriften), Inter (Text), IBM Plex Mono (Messwerte, Normangaben).
- Kein Designsystem; die Farben Türkis und Bernstein gibt es in `chemlab.css` schon.

# Umgesetzte Geräte (Branch `laborlook`)

Stand 18.11.2026, Commit ae60d86, nicht in master:

- Stehkolben (ISO 1773) 100/250 mL; im Hals Tropftrichter links, Gasableitungsrohr Mitte, Thermometer rechts. Platz im Hals ist getestet.
- Tropftrichter (ISO 4800), Hahngriff rechts.
- Saugflasche mit Büchnertrichter (Lochplatte, Rundfilter), etwa zehnmal schneller als der Trichter.
- Porzellantiegel im Tondreieck, direkt in der Flamme.
- Pneumatische Wanne mit umgestülptem Standzylinder; sie fängt unlösliches Gas und die verdrängte Luft auf.
- Erlenmeyerkolben, aufgezogene Vollpipette mit Farbring (ISO 1769) in 2D und 3D.

Noch offen: Schalter „Entdecken/Labor“ und „Beschriften“, Lupe am Meniskus.

# Siehe auch

- [Zeichensprache](/gestaltung/zeichensprache.md)
- [Detailstufen](/gestaltung/detailstufen.md)
- [3D-Leitlinien](/gestaltung/3d-leitlinien.md)
- [Ist-Zustand im November 2026](/gestaltung/ist-zustand-2026-11.md)
- [Quellenlage der Normen](/normen/quellenlage.md)

[^leinwand]: Design-Leinwand ChemLab Laborlook
