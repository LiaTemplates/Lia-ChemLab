---
type: Standard
title: ISO 918 – Destillationsapparatur
description: Aufbau zur Bestimmung der Destillationskennwerte; das Thermometer sitzt mit der Kugel am Seitenrohr, der Kühler hängt an einem Stativ.
resource: https://standards.iteh.ai/catalog/standards/sist/afa9d797-9d11-432b-8714-5e2ffdb5bcab/iso-918-1983
tags: [norm, destillation, thermometer, kuehler]
status: stable
generated: { by: claude-code/claude-opus-5-5, at: 2026-11-18T15:30:00Z }
sources:
  - id: iso-918
    resource: https://cdn.standards.iteh.ai/samples/5328/0f8859862266478e8d0a63435e202fea/ISO-918-1983.pdf
    title: ISO 918:1983, Leseprobe (Abschnitte 1–11, Bilder 1–3)
    author: process:iteh
  - id: tcu
    resource: https://personal.tcu.edu/jmontchamp/F2019%20files%20for%20lab/LAB2%20DISTILLATION%20handout.pdf
    title: TCU, Praktikumsanleitung Destillation
---

# Inhalt

- **Thermometer (5.2.1):** Ein Stopfen im Hals hält das Thermometer. Der Übergang von Kapillare und Kugel liegt auf Höhe der Unterkante des Seitenrohrs am Hals.[^iso-918] Praktikumsanleitungen sagen dasselbe: Sitzt die Kugel höher, zeigt es zu wenig, sitzt sie tiefer, zu viel.[^tcu]
- **Destillierkolben (Bild 2):** 100 mL, Hals innen 16 mm, Seitenrohr 75° zum Hals und 100 mm lang.
- **Kühler (5.1.4, Bild 1):** Liebig-West-Kühler, schräg abfallend, an einem eigenen Stativ geklemmt.
- **Siedesteine (7.2):** einige Stückchen poröser Ton in den Kolben.
- **Siedebeginn (3.1):** die Temperatur, wenn der erste Tropfen von der Spitze des Kühlers fällt.

# Folge für ChemLab

- Mit Liebigkühler ist der Rundkolben ein Destillierkolben mit Seitenrohr. Ein Thermometer darin steckt in einem Stopfen und misst den Dampf: Bis Dampf kommt, zeigt es die Raumtemperatur, dann springt es auf die Siedetemperatur (`head`, `atHead` in chemlab-engine.js).
- Kolben und Kühler hängen je an einem Stativ, in 2D und 3D.
- Drei Siedesteine liegen im Destillierkolben, sobald ein Kühler daran hängt (nur gezeichnet, das Sieden rechnet ohne Siedeverzug).
- Blaue Pfeile zeigen am Kühler, wo das Wasser hinein- und wo es herausfließt, wie in der Wikimedia-Zeichnung Simple_distillation_apparatus.svg.

[^iso-918]: ISO 918:1983, Abschnitte 3.1, 5.1, 5.2.1, 7.2; Bilder 1 und 2
[^tcu]: TCU, Praktikumsanleitung Destillation
