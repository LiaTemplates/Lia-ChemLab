---
type: Finding
title: Vergleich mit Wikipedia, Wikimedia Commons und anderen Simulatoren
description: Wie Wikipedia-Zeichnungen, ChemCollective und Chemix Laborgeräte darstellen, verglichen mit den Normen und mit ChemLab (Stand 18.11.2026).
tags: [vergleich, wikipedia, simulator, design]
status: stable
generated: { by: claude-code/claude-opus-5-5, at: 2026-11-18T13:40:00Z }
stale_after: 2027-11-18T00:00:00Z
sources:
  - id: de-messzylinder
    resource: https://de.wikipedia.org/wiki/Messzylinder
    title: Wikipedia, Messzylinder (mit Graduated_Cylinder_tall_form_250ml.svg)
  - id: de-messkolben
    resource: https://de.wikipedia.org/wiki/Messkolben
    title: Wikipedia, Messkolben
  - id: de-buerette
    resource: https://de.wikipedia.org/wiki/Bürette
    title: Wikipedia, Bürette (mit Burette_vertical.svg, Schelbach_burette_e17.png)
  - id: en-burette
    resource: https://en.wikipedia.org/wiki/Burette
    title: Wikipedia (en), Burette
  - id: en-volflask
    resource: https://en.wikipedia.org/wiki/Volumetric_flask
    title: Wikipedia (en), Volumetric flask
  - id: chemcollective
    resource: https://chemcollective.org/vlab/vlab.php
    title: ChemCollective Virtual Lab (HTML5), Carnegie Mellon, CC BY-NC-ND
  - id: chemix
    resource: https://chemix.org/
    title: Chemix, Editor für Versuchsskizzen
---

# Wikipedia und Commons

| Quelle | Was sie zeigt | Bezug zur Norm |
|---|---|---|
| Messzylinder (de) | Zeichnung 250 mL mit Aufdruck „250 : 2 / ml In 20 °C“, Sechseckfuß, Ausguss, Ziffern alle 20 mL links der Striche[^de-messzylinder] | nennt DIN EN ISO 4788 und „In“ richtig |
| Messkolben (de) | Ringmarke „ganz um den Hals gezogen“, Klasse A, Einguss[^de-messkolben] | nennt DIN EN ISO 1042 und DIN 12664-2 |
| Bürette (de) | Zeichnung mit Aufdruck „ml / Ex 20 °C / AS“, Hahngriff rechts; Bild des Schellbachstreifens mit Spitzen am Meniskus[^de-buerette] | keine Normnummer |
| Burette (en) | Klasse A/B, Ablesen in Augenhöhe, „black strip“ statt Schellbach[^en-burette] | nur ASTM E287 |
| Volumetric flask (en) | „TC“ oder „IN“ bei 20 °C, Klasse A mit Seriennummer[^en-volflask] | ISO 1042, ASTM E288 |
| Stativ.svg (Commons) | Bürette in einer Bürettenklemme mit zwei Armen an einer Muffe | – |

# Simulatoren

- **ChemCollective**:[^chemcollective] Feine Teilung an der Bürette, Hahn mit Rändelmutter links und Griff rechts, kein Schellbachstreifen. Messzylinder mit Sechseckfuß und Ausguss, ohne Aufdruck. **Messkolben birnenförmig** mit Ringmarke als Ellipse und Stopfen. Vollpipette mit Pipettierhilfe. Erlenmeyer mit **weißem Schriftfeld**. Leicht räumlich (Ellipsen oben und unten), sonst flach. Zwei Modi: „realistisch“ (Genauigkeit wie im Labor) und „genau“.
- **Chemix**:[^chemix] Klassische Schulskizze: flache 2D-Schnitte, dicke Umrisse, hellblaue Flüssigkeit, Beschriftung mit Bezugslinien. Eigene Teile „Burette Holder“ (Doppelklemme) und „Burette Clamp“. Keine Aufdrucke oder Normdetails.
- **Beyond Labz (Virtual ChemLab)**: Die automatische Anzeige der Bürette lässt sich abschalten, dann muss man selbst ablesen (laut Hilfeseite).
- **Labster**: lehrt das Ablesen in Augenhöhe und den Parallaxenfehler ausdrücklich (Blog, nicht selbst angesehen).

# Was ChemLab daraus lernen kann

1. **Messkolben birnenförmig** statt kugelig: ISO 1042:1981, 8.3 empfiehlt die Birnenform, ChemCollective zeichnet sie.
2. **Bürettenklemme** mit zwei Armen an der Muffe statt eines geraden Arms (Commons, Chemix).
3. **Hahngriff rechts** an Bürette und Scheidetrichter (ISO 4800, Commons, ChemCollective).
4. **Weißes Schriftfeld** auf Becherglas und Erlenmeyer (ChemCollective, echtes Laborglas).
5. **Ablesen ohne Anzeige** als Übung: ChemLab kann die Zahlen schon abschalten (`numbers`); die Lupe aus dem [Entwurf](/gestaltung/laborlook-entwurf.md) passt dazu.

Umgesetzt am 18.11.2026 (Branch `laborlook`, Commit 3efd960): Punkte 1 bis 4 in 2D und 3D. Punkt 5 bleibt bei der Bedienung.

ChemLab ist bei Normdetails schon weiter als die verglichenen Simulatoren: Schellbachstreifen, Aufdrucke und Skalenfolge nach [ISO 384](/normen/iso-384-messgeraete.md) zeigt keiner von ihnen.

[^de-messzylinder]: Wikipedia, Messzylinder
[^de-messkolben]: Wikipedia, Messkolben
[^de-buerette]: Wikipedia, Bürette
[^en-burette]: Wikipedia (en), Burette
[^en-volflask]: Wikipedia (en), Volumetric flask
[^chemcollective]: ChemCollective Virtual Lab
[^chemix]: Chemix
