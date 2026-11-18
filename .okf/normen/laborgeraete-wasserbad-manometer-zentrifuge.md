---
type: Finding
title: Wasserbad, Manometer und Zentrifuge – was sich belegen lässt
description: DIN 12876-1, EN 837-1 und EN 12547 sind nicht frei lesbar; die Darstellung folgt Herstellerunterlagen und Wikipedia.
tags: [norm, wasserbad, manometer, zentrifuge]
status: stable
generated: { by: claude-code/claude-opus-5-5, at: 2026-11-18T15:30:00Z }
stale_after: 2027-11-18T00:00:00Z
sources:
  - id: din-12876
    resource: https://www.dinmedia.de/en/standard/din-12876-1/41925158
    title: DIN 12876-1, Laborthermostate und Laborbäder, Begriffe und Einteilung
  - id: lauda-transparent
    resource: https://www.lauda.de/en/products/accessories/details/A001734
    title: LAUDA, Transparentbad aus Polycarbonat
  - id: wika
    resource: https://kz.wika.com/upload/DS_IN0002_en_co_1372.pdf
    title: WIKA, Datenblatt IN 00.02 zu EN 837-1
  - id: armano
    resource: https://www.manometer-thermometer.de/fileadmin/mediamanager/ARMANO/Downloads/Uebersichten_Kataloge/englisch/2000_ARMANO_eng.pdf
    title: ARMANO, Katalog (Zifferblatt nach DIN EN 837-1)
  - id: wiki-zentrifuge
    resource: https://de.wikipedia.org/wiki/Laborzentrifuge
    title: Wikipedia, Laborzentrifuge
---

# Wasserbad

- DIN 12876-1 legt Begriffe und Klassen für Laborthermostate und -bäder fest; den Text gibt es nur gegen Geld.[^din-12876]
- Es gibt durchsichtige Wannen aus Polycarbonat bis 100 °C, damit man die Proben sieht; der Einhängethermostat hängt am Rand oder auf einer Brücke.[^lauda-transparent]
- **Folge:** ChemLab zeichnet eine durchsichtige Wanne mit Einhängethermostat am rechten Rand, Heizung und Pumpe im Wasser.

# Manometer

- EN 837-1 regelt Rohrfedermanometer; die Skala richtet sich nach Messbereich, Nenngröße und Klasse.[^wika] Übliche Zifferblätter sind weiß mit schwarzer Beschriftung.[^armano] Eine Marke ▼ zeigt die Grenze für ruhende Last.[^wika]
- **Folge:** Zifferblatt 0 bis 2,5 bar mit Teilung 0,1 bar, Ziffern an ganzen und halben bar, „bar“, rote Grenzmarke ab 1,5 bar (dort fliegt der Stopfen). Die rote Marke ist Herstellerpraxis, nicht aus dem Normtext belegt.

# Zentrifuge

- Ein Sicherheitsschalter am Deckel verhindert, dass der Rotor bei offenem Gehäuse läuft; Zentrifugenröhrchen sind dickwandiger als Reagenzgläser; man belädt symmetrisch. Wikipedia nennt EN 12547.[^wiki-zentrifuge]
- DIN 58970-2 (Zentrifugengläser) ist seit 2021 zurückgezogen.
- **Folge:** Solange sie läuft, ist ein durchsichtiger Deckel zu; sonst ist er hochgeklappt. Auf der Scheibe ein Drehpfeil statt des roten Kreuzes (ein rotes Kreuz liest man als Erste Hilfe; die ist nach ISO 7010 weiß auf grün).
- Offen: kein Gegengewicht im Rotor, das Glas ist ein Reagenzglas.

[^din-12876]: DIN 12876-1:2001, Inhaltsangabe
[^lauda-transparent]: LAUDA, Transparentbad
[^wika]: WIKA, Datenblatt IN 00.02
[^armano]: ARMANO, Katalog
[^wiki-zentrifuge]: Wikipedia, Laborzentrifuge
