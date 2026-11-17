# Offene Punkte

Stand: 17.11.2026. Die 13 Erweiterungen aus der Recherche vom 16.11. sind fertig und in master (lokal, nicht gepusht).

## Größere Schritte

- [x] **Gasgesetze** (17.11.2026): Der Kolbenprober folgt der Temperatur (Gay-Lussac), lässt sich halten (Boyle) und hat ein Manometer.
  - Offen: Druck im Diagramm, Aufgabenziel `measure: p` mit dem Kolbenprober, `hold` im Aufbau (`bench`), Wasserdampf im Kolbenprober.
- [x] **Strömung im Gefäß** (17.11.2026, Branch `stroemung`): Temperatur, Wirbel und Druck als Bild in der Flüssigkeit (2D). Der Löser folgt Stam, „Stable Fluids“, mit Auftrieb aus der Dichte. Das Bild ist nur in eine Richtung gekoppelt: Der Rechenkern bleibt gut durchmischt.
  - Offen: 3D (dasselbe Feld als Textur auf einer senkrechten Schnittebene), Zellmaske für schräge Wände, Rührer und Strömung beim Eingießen, eigene Dichten für andere Flüssigkeiten.
  - Zähigkeit (17.11.2026): je Stoff bei 25 und 50 °C (`eta`), Glycerin 99,5 % und Zuckersirup 60 % im Organik-Paket. Offen: Wechselwirkungsglied für Glycerin-Wasser (die einfache Regel macht 85 % halb so zäh), Ausdehnung und Wärmeleitung je Flüssigkeit (bisher die des Wassers), Temperaturgang der Zuckerlösung gemessen statt geschätzt.
  - Schlieren (17.11.2026): Dichte und Zähigkeit je Zelle, Zugegossenes kommt unter dem Strahl an und sinkt oder steigt nach seiner Dichte. Offen: das Bild der Schlieren als Linien (wie im Schlierenspiegel) statt Flächen; Lösewärme dort, wo sich Schwefelsäure mischt, statt dort, wo sie ankommt.
  - Danach möglich: Öl und Wasser als Phasenfeld, sobald es die „Zweite flüssige Phase“ gibt.
- [ ] **Chromatographie** (mittel bis groß, eigenes Teilmodell)
  - Papierstreifen im Becherglas, Laufmittelfront steigt mit der Zeit, Flecken wandern nach ihrem Rf-Wert.
  - Daten je Farbstoff (etwa Filzstiftfarben, die sich auftrennen), Zeichnung in 2D und 3D.
- [ ] **Korrosion** (groß, riskant)
  - Gelöster Luftsauerstoff mit Austausch zur Luft, seine Reduktion an Metallen, Rost, langsame Geschwindigkeiten.
  - Gewinn: Das Volta-Element zeigt 0,9 V statt 0,5 V.
  - Preis: Jeder Versuch mit Metall in Wasser ändert sich ein wenig; viele Tests müssen neu kalibriert werden.
- [ ] **Zweite flüssige Phase** (Plan: ~/.claude/plans/2026-11-17-zweite-fluessige-phase.md, Branch `zweite-phase`)
  - [x] 3a (17.11.2026): Ölschicht `v.org` neben der wässrigen Lösung, Stoffdaten `oil`, Hexan und Olivenöl, Abgießen oben, Pipette und Hahn unten, gemeinsames Sieden (Wasserdampfdestillation), Zeichnung in 2D.
  - [ ] 3b Verteilen und Ausschütteln (`kd`, Knopf „Schütteln“, Reaktionen in der Ölschicht, Hexen und Bromwasser); 3c Scheidetrichter; 3d Phasenfeld im Strömungsbild; 3e 3D.
  - Offen aus 3a: Ethylacetat als Schicht (braucht eine Regel für Mitlöser wie Ethanol).
  - Schichten mit eigener Zusammensetzung, Verteilung zwischen den Phasen, Ausschütteln, nur die obere Schicht abgießen, Zeichnung der Schichten.
  - Dann schwimmen Hexan und Hexen obenauf; Iod in Hexan (violett), Brom ausschütteln.

## Kleinere Punkte

Erledigt am 17.11.2026: Stand-Zeile der README, Standzylinder (Knallgas-Folie nutzt ihn), stark gefärbte Lösungen in 3D geprüft (sie bleiben kräftig), Tollens-Reste zur Lehrkraft, Sulfit erst oxidieren, pH-Regel der CLP für Ammoniak.

## Bekannte Grenzen, die man später angehen könnte

- Bleiakku: Ganz entladen zeigt er ohne Last etwa 1 V statt knapp 2 V; er fasst immer gleich viel (kein Formieren).
- Zentrifuge: kein Gegengewicht, nur eine Drehzahl.
- Keine Siedepunkterhöhung: Gesättigte Kochsalzlösung siedet bei 100 °C statt bei etwa 108 °C, denn gelöste Salze zählen beim Sieden nicht mit.
- Organische Nachweise: Bromwasser wird nicht von Aldehyden und Glucose entfärbt; Kupfer(I)-oxid zerfällt in Säure nicht; Fehling wird nicht erst grün und gelb.
- Silberchlorid auf einer Silber-Elektrode wächst beliebig weiter (nur Bleibeläge decken ab).

## Veröffentlichung

- [x] Meilenstein 7: veröffentlicht am 17.11.2026 als [LiaTemplates/Lia-ChemLab](https://github.com/LiaTemplates/Lia-ChemLab), Version 0.0.1. Neue Fassungen: `version:` im Kopf erhöhen (unter 1.0.0 bleiben) und ein Tag mit derselben Nummer pushen.
