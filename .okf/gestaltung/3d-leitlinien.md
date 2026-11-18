---
type: Design Rule
title: 3D-Leitlinien
description: Wie die 3D-Ansicht an die 2D-Skizze anschließt – Startansicht von vorn, Kontaktschatten, Glasrand, HTML-Schilder, Kennfarben, Abschalten auf schwachen Geräten.
tags: [design, 3d]
status: draft
generated: { by: claude-code/claude-opus-5-5, at: 2026-11-18T12:05:00Z }
---

# Grundsatz

3D beginnt dort, wo die Skizze aufhört: Beim Umschalten dreht die Kamera aus genau der
Vorderansicht der 2D-Skizze in den Raum. Geräte, Farben und Beschriftung bleiben dieselben
([Zeichensprache](/gestaltung/zeichensprache.md)).

# Heute → Vorschlag

| Heute (siehe [Ist-Zustand](/gestaltung/ist-zustand-2026-11.md)) | Vorschlag |
|---|---|
| Becherglas wirkt wie eine weiße Scheibe | dunkler Glasrand (Fresnel), Flüssigkeit in Stofffarbe mit Meniskus-Ring |
| Schilder winzig und unscharf | Schilder als HTML über der Szene, so groß wie in 2D, mit Bezugslinie |
| grauer, leerer Raum | Fliesenwand, Labortisch, Abzug angedeutet und unscharf |
| startet schräg von oben | startet von vorn, dreht dann sanft |
| lange, weiche Schatten | kurzer Kontaktschatten, Licht von oben links |
| Skala dunkel wie in 2D | weiße Emaille-Skala, Langstriche ganz herum, kurze nur vorne ([ISO 384](/normen/iso-384-messgeraete.md) 9.2) |

# Normen für 3D

Für die räumliche Darstellung von Laborgeräten gibt es keine eigene Norm. Zwei Normen tragen bei:
[ISO 5456-3](/normen/iso-5456-3-schraegbilder.md) (bei einer Hauptansicht dimetrisch: die Vorderansicht
bleibt führend) und [glTF 2.0](/normen/gltf-materialien.md) (Materialien für Glas und Flüssigkeit).

# Weitere Regeln

- Kameravorgaben: „Vorne wie die Skizze“, „Augenhöhe zum Ablesen“ (öffnet dieselbe Lupe wie 2D), „Schräg von oben“, „Frei drehen“.
- Zeigen und Anfassen: bernsteinfarbener Umriss wie in 2D.
- Armaturen in Kennfarbe nach [EN 13792](/normen/en-13792-armaturen.md).
- Auf schwachen Geräten (KaiOS, alte Tablets) bleibt 3D aus; 2D zeigt alles Wichtige.
