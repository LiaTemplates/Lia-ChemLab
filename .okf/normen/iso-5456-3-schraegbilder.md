---
type: Standard
title: ISO 5456-3 – Axonometrische Darstellungen (Schrägbilder)
description: Die genormten Schrägbilder für technische Zeichnungen – isometrisch, dimetrisch, schiefwinklig (Kavalier, Kabinett); die einzige Norm, die eine räumliche Darstellung regelt.
resource: https://www.iso.org/standard/11503.html
tags: [norm, 3d, projektion, schraegbild]
status: stable
generated: { by: claude-code/claude-opus-5-5, at: 2026-11-18T12:00:00Z }
sources:
  - id: is-15021-3
    resource: https://law.resource.org/pub/in/bis/S01/is.15021.3.2001.pdf
    title: IS 15021 (Part 3):2001, indische Übernahme von ISO 5456-3:1996, vollständig
    author: process:bis
  - id: iso-5456-3-sample
    resource: https://cdn.standards.iteh.ai/samples/11503/006c88f9e0b040618800ce7a590d049f/ISO-5456-3-1996.pdf
    title: ISO 5456-3:1996, Leseprobe
    author: process:iso-tc10
---

# Befund

Für die räumliche Darstellung von Laborgeräten gibt es keine eigene Norm. Für technische Zeichnungen
regelt ISO 5456-3 die Schrägbilder (2025 bestätigt).[^is-15021-3]

# Regeln

| Art | Regel | Abschnitt |
|---|---|---|
| allgemein | die Z-Achse senkrecht; das Objekt mit den Hauptflächen parallel zu den Koordinatenebenen, so ausgerichtet, dass die Hauptansicht zu sehen ist | 4.1, 4.2 |
| allgemein | verdeckte Kanten möglichst weglassen; Schraffur von Schnitten unter 45° | 4.4, 4.5 |
| isometrisch | alle drei Achsen gleich verkürzt (0,816), Achsen 120° auseinander; in der Praxis Maßstab 1 | 5.1 |
| dimetrisch | **wenn eine Ansicht die Hauptrolle spielt**; Maßstäbe 1/2 : 1 : 1, Achswinkel 7° und 42° | 5.2 |
| Kavalier | Vorderansicht unverzerrt, dritte Achse unter 45° im Maßstab 1 | 5.3.1 |
| Kabinett | wie Kavalier, die dritte Achse auf die Hälfte verkürzt; „bessere Proportionen“ | 5.3.2 |

# Folge für ChemLab

ChemLab hat eine perspektivische Kamera, kein Schrägbild. Übernommen wird die Absicht der dimetrischen
Darstellung: Die Vorderansicht bleibt die Hauptansicht. Die Startansicht in 3D steht deshalb vorn und nur
15° erhöht (`3d/stage.js`, `frame()`), so dass sie an die 2D-Skizze anschließt; siehe
[3D-Leitlinien](/gestaltung/3d-leitlinien.md). Das Kabinett-Schrägbild ist das, was in der Schule im
Mathematikunterricht gezeichnet wird.

[^is-15021-3]: IS 15021 (Part 3):2001 = ISO 5456-3:1996, Abschnitte 4 und 5
