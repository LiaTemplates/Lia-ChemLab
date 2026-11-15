<!--
author:   LiaTemplates
version:  0.0.1
language: de
narrator: Deutsch Female
comment:  Chemie-Labor zum freien Experimentieren: Stoffe zugeben, messen, die Reaktion vor- und zurückspulen – gerechnet aus Stoffdaten, gezeichnet in SVG.

script:   ./chemlab-engine.js
          ./chemlab-data.js
          ./chemlab-parts.js
          ./chemlab-fx.js
          ./chemlab-ui.js

link:     ./chemlab.css

attribute: Bildungsenthalpien und Entropien aus den
           [CODATA Key Values for Thermodynamics](https://www.codata.info/resources/databases/key1.html)
           (Cox, Wagman, Medvedev, 1989).
           Gleichgewichtskonstanten und Reaktionsenthalpien aus den Datenbanken phreeqc.dat, minteq.v4.dat und llnl.dat von
           [PHREEQC Version 3](https://www.usgs.gov/software/phreeqc-version-3)
           des U.S. Geological Survey (Parkhurst und Appelo); einzeln entnommen, umgeschrieben und zum Teil umgerechnet.
           Die Einträge in chemlab-data.js nennen jeweils die Zeile der Datenbank.

@ChemLab.sim: @ChemLab.sim_(@uid,```@0```)

@ChemLab.sim_
<div class="lia-chemlab" id="lia-chemlab-@0"></div>
<script modify="false">
(function wait(tries) {
  var el = document.getElementById("lia-chemlab-@0"), C = window.LiaChemLab;
  if (el && C && C.mount && C.loaded()) return C.mount(el, `@'1`);
  if (el && tries === 50) {
    if (C && C.mount) C.mount(el, `@'1`);
    else el.innerHTML = '<p class="cl-error" role="alert">' + (/^de/i.test(document.documentElement.lang)
      ? "ChemLab lädt noch oder konnte nicht geladen werden (chemlab-ui.js)."
      : "ChemLab is still loading or could not be loaded (chemlab-ui.js).") + "</p>";
  }
  if (tries < 300) setTimeout(function () { wait(tries + 1); }, tries < 50 ? 100 : 500);
})(0);
""
</script>
@end
-->

# ChemLab – Chemie zum Ausprobieren

Mit diesem Baustein experimentieren Lernende an einem Labortisch: Gefäße aufstellen, Stoffe zugeben, messen und zusehen, was passiert. Nichts davon ist ein Film. Ein Rechenkern führt Buch über Stoffmengen, Wärme und Ladung, und alles Sichtbare folgt daraus: die Farbe der Lösung, die Gasblasen, die Temperatur am Thermometer, die Kurven im Diagramm.

Weil der Zustand laufend aufgezeichnet wird, lässt sich jeder Versuch **anhalten, zurückspulen und rückwärts abspielen**.

Einbinden im Kopf eines Kurses, mit dem Pfad oder der Adresse dieser Datei:

`import: <Pfad>/README.md`

> **Stand:** Meilenstein 5 von 7. Es gibt Reagenzglas, Becherglas, Abdampfschale, Bürette, Brenner, Wasserbad, Thermometer, pH-Meter, Leitfähigkeitsmessgerät, Fotometer und Kolbenprober; Elektroden aus sechs Materialien, Netzgerät, Strom- und Spannungsmesser, Lämpchen und Salzbrücke; dazu Holzspan, Glimmspan und Magnesiastäbchen für die Nachweise, Säuren, Laugen, rund vierzig Lösungen, vier Indikatoren, Stärke, Iodlösung und zehn Feststoffe. Gerechnet werden Säure-Base-Gleichgewichte, Puffer, Fällungen, Komplexe, Gase über der Lösung, Sieden und Eindampfen, Verbrennungen, die Knallgasreaktion, Redoxreaktionen an Metallen und einige in Lösung (Redoxtitration), Elektrolyse und galvanische Zellen, Reaktionen mit Geschwindigkeitsgesetz und Katalysator und Gleichgewichte, die sich mit Konzentration, Säure und Temperatur verschieben. Eine Teilchenlupe zeigt, was in der Lösung vorliegt. Aufgaben mit Selbstkontrolle und Erweiterungspakete folgen in den nächsten Meilensteinen.

## `@ChemLab.sim`

Der Befehl steht an einem Textblock, der den Aufbau beschreibt. Er zeigt ihn als Arbeitsfläche.

```json @ChemLab.sim
{"bench":[
  {"type":"testtube","contains":[{"reagent":"HCl 1M","ml":8}]},
  {"type":"thermometer","in":"testtube1"}
 ],
 "shelf":["Mg ribbon","HCl 1M","H2O","testtube","thermometer"]}
```

**So geht es:**

- Im **Regal** das Magnesiumband antippen, die Menge einstellen und dann das **Reagenzglas antippen**: Das Band fällt hinein, Gasblasen steigen auf, das Thermometer klettert.
- Der Stoff bleibt in der Hand: Noch einmal antippen gibt noch einmal dieselbe Menge zu. Den Stoff im Regal erneut antippen legt ihn zurück.
- Ein Gefäß antippen, ohne etwas in der Hand zu haben, wählt es aus. Darunter steht dann, was es enthält; von dort lässt sich umgießen, ausleeren und wegräumen.
- Die **Bedienleiste** unter der Fläche hält die Zeit an, spielt sie rückwärts ab oder springt an Anfang und Ende. Der Schieber führt zu jedem Zeitpunkt des Versuchs.
- Unter der Fläche stehen die **Reaktionsgleichungen** dessen, was gerade abläuft, die **Diagramme** und das **Protokoll** der Beobachtungen.

## Neutralisation mit Indikator

Bromthymolblau ist in saurer Lösung gelb und in alkalischer blau, dazwischen grün. Hier liegen 5 mL Salzsäure im Reagenzglas. Natronlauge in kleinen Portionen zugeben: Nach 5 mL schlägt die Farbe um.

```json @ChemLab.sim
{"bench":[
  {"type":"testtube","contains":[{"reagent":"HCl 0.1M","ml":5},{"reagent":"BTB","drops":3}]}
 ],
 "shelf":["NaOH 0.1M","HCl 0.1M","BTB","H2O"],
 "show":{"charts":["n"]}}
```

Die Farbe ist gerechnet: Jede der beiden Formen des Indikators schluckt einen Teil des Lichts, und was übrig bleibt, ergibt die Farbe. Mehr Tropfen färben kräftiger, ein dickeres Gefäß auch.

Bei der Neutralisation wird **Wärme** frei. Mit Lösungen von 1 mol/L ist das gut zu messen: 50 mL Salzsäure und 50 mL Natronlauge erwärmen sich um knapp 6 °C. Ein Teil der Wärme geht in das Glas.

```json @ChemLab.sim
{"bench":[
  {"type":"beaker","ml":250,"contains":[{"reagent":"HCl 1M","ml":50},{"reagent":"BTB","drops":5}]},
  {"type":"thermometer","in":"beaker1"}
 ],
 "shelf":["NaOH 1M","HCl 1M"],
 "show":{"charts":["T"]}}
```

## Magnesium und Salzsäure

Magnesium löst sich in Salzsäure, Wasserstoff entweicht, und das Reagenzglas wird deutlich warm. Im Diagramm der Stoffmengen sieht man, wie Magnesium und Wasserstoff-Ionen verschwinden, während Magnesium-Ionen und Wasserstoff entstehen: auf zwei Wasserstoff-Ionen kommt ein Molekül Wasserstoff.

```json @ChemLab.sim
{"bench":[
  {"type":"testtube","contains":[{"reagent":"HCl 1M","ml":8}]},
  {"type":"thermometer","in":"testtube1"}
 ],
 "shelf":["Mg ribbon"]}
```

**Wie schnell?** In verdünnter Säure dauert es länger, in konzentrierter geht es schneller. In beide Gläser gleich viel Magnesium geben und vergleichen. Das Tempo der Uhr lässt sich an der Bedienleiste erhöhen.

```json @ChemLab.sim
{"bench":[
  {"type":"testtube","contains":[{"reagent":"HCl 0.5M","ml":10}]},
  {"type":"testtube","contains":[{"reagent":"HCl 2M","ml":10}]},
  {"type":"thermometer","in":"testtube1"},
  {"type":"thermometer","in":"testtube2"}
 ],
 "shelf":["Mg ribbon"]}
```

## Titration

Die **Bürette** hängt über dem Becherglas, das **pH-Meter** steckt darin. Die Bürette antippen: Darunter erscheinen die Stellungen des Hahns – zu, tropfen, langsam, schnell – und was sie bisher abgegeben hat. Den Hahn öffnen und zusehen, wie der pH-Wert erst kaum steigt und am Äquivalenzpunkt springt. Bromthymolblau schlägt dort von Gelb über Grün nach Blau um.

Die **Titrationskurve** zeigt den pH-Wert über dem zugegebenen Volumen. Wer den Sprung verpasst hat, spult zurück und tropft das letzte Stück langsam zu.

```json @ChemLab.sim
{"bench":[
  {"type":"beaker","ml":250,"contains":[{"reagent":"HCl 0.1M","ml":20},{"reagent":"BTB","drops":5}]},
  {"type":"phmeter","in":"beaker1"},
  {"type":"burette","over":"beaker1","contains":[{"reagent":"NaOH 0.1M","ml":50}]}
 ],
 "shelf":["NaOH 0.1M","HCl 0.1M"],
 "show":{"charts":["pH","titration"]}}
```

**Schwache Säure:** Essigsäure beginnt bei höherem pH-Wert, läuft flach durch den Pufferbereich – bei der halben Menge Lauge ist der pH-Wert gleich dem pKs-Wert 4,76 – und hat ihren Äquivalenzpunkt im Basischen. Deshalb passt hier Phenolphthalein: farblos bis zum Äquivalenzpunkt, danach rosa.

```json @ChemLab.sim
{"bench":[
  {"type":"beaker","ml":250,"contains":[{"reagent":"CH3COOH 0.1M","ml":20},{"reagent":"PP","drops":3}]},
  {"type":"phmeter","in":"beaker1"},
  {"type":"burette","over":"beaker1","contains":[{"reagent":"NaOH 0.1M","ml":50}]}
 ],
 "shelf":["NaOH 0.1M","CH3COOH 0.1M","MO"],
 "show":{"charts":["titration"]}}
```

## Indikatoren und Puffer

Der **Universalindikator** ist eine Mischung aus vier Farbstoffen. Von links nach rechts: Salzsäure, Essigsäure, Wasser, Ammoniaklösung, Natronlauge. In jedes Glas drei Tropfen geben.

```json @ChemLab.sim
{"bench":[
  {"type":"testtube","contains":[{"reagent":"HCl 0.1M","ml":8}]},
  {"type":"testtube","contains":[{"reagent":"CH3COOH 0.1M","ml":8}]},
  {"type":"testtube","contains":[{"reagent":"H2O","ml":8}]},
  {"type":"testtube","contains":[{"reagent":"NH3 0.1M","ml":8}]},
  {"type":"testtube","contains":[{"reagent":"NaOH 0.1M","ml":8}]}
 ],
 "shelf":["UI","HCl 0.1M","NaOH 0.1M"],
 "show":{"charts":false}}
```

Ein **Puffer** hält den pH-Wert fest. Links stehen Essigsäure und Natriumacetat zu gleichen Teilen, rechts reines Wasser. In beide Gläser je 1 mL Salzsäure geben und die pH-Meter vergleichen.

```json @ChemLab.sim
{"bench":[
  {"type":"beaker","contains":[{"reagent":"CH3COOH 0.1M","ml":20},{"reagent":"CH3COONa 0.1M","ml":20}]},
  {"type":"beaker","contains":[{"reagent":"H2O","ml":40}]},
  {"type":"phmeter","in":"beaker1"},
  {"type":"phmeter","in":"beaker2"}
 ],
 "shelf":["HCl 0.1M","NaOH 0.1M","NH4Cl 0.1M","NH3 0.1M"],
 "show":{"charts":["pH"]}}
```

## Fällungen und Ionennachweise

**Halogenide mit Silbernitrat:** In den Gläsern liegen Chlorid, Bromid und Iodid vor. Silbernitrat-Lösung zugeben: Es fällt weißes Silberchlorid, gelbliches Silberbromid, gelbes Silberiodid. Der Niederschlag trübt erst die ganze Lösung und setzt sich dann ab.

Danach Ammoniaklösung zugeben: Silberchlorid löst sich als Diamminsilber-Komplex, Silberbromid nur zum Teil, Silberiodid gar nicht. Das steht nirgends als Regel im Baustein; es folgt aus den drei Löslichkeitsprodukten und der Bildungskonstante des Komplexes.

Oder statt Ammoniak Kaliumiodid zum weißen Silberchlorid geben: Der Niederschlag wandelt sich in gelbes Silberiodid um, weil es noch viel schwerer löslich ist.

```json @ChemLab.sim
{"bench":[
  {"type":"testtube","contains":[{"reagent":"NaCl 0.1M","ml":5}]},
  {"type":"testtube","contains":[{"reagent":"KBr 0.1M","ml":5}]},
  {"type":"testtube","contains":[{"reagent":"KI 0.1M","ml":5}]}
 ],
 "shelf":["AgNO3 0.1M","NH3 2M","KI 0.1M"],
 "show":{"charts":false}}
```

**Sulfat mit Bariumchlorid, Eisen(III) mit Thiocyanat und mit Lauge:** Bariumsulfat fällt weiß aus. Eisen(III)-Ionen färben sich mit Thiocyanat blutrot, ohne Niederschlag; mit Natronlauge fällt rostbraunes Eisen(III)-hydroxid.

```json @ChemLab.sim
{"bench":[
  {"type":"testtube","contains":[{"reagent":"Na2SO4 0.1M","ml":5}]},
  {"type":"testtube","contains":[{"reagent":"FeCl3 0.1M","ml":5}]},
  {"type":"testtube","contains":[{"reagent":"FeCl3 0.1M","ml":5}]}
 ],
 "shelf":["BaCl2 0.1M","KSCN 0.1M","NaOH 1M","HCl 1M"],
 "show":{"charts":false}}
```

## Kupfer und Ammoniak

Zur hellblauen Kupfersulfat-Lösung wenig Ammoniaklösung geben: Es fällt hellblaues Kupferhydroxid. Mit viel Ammoniak löst sich der Niederschlag, und die Lösung wird tiefblau – das Tetraamminkupfer-Ion. Salzsäure macht alles rückgängig.

```json @ChemLab.sim
{"bench":[
  {"type":"beaker","contains":[{"reagent":"CuSO4 0.1M","ml":10}]}
 ],
 "shelf":["NH3 1M","NH3 5M","HCl 1M","H2SO4 1M"],
 "show":{"charts":false}}
```

Der Baustein rechnet mit Konzentrationen, nicht mit Aktivitäten. Deshalb braucht es hier kräftigeren Überschuss als im Labor: Mit Ammoniak von 1 mol/L bleibt ein Teil des Niederschlags liegen, mit 5 mol/L löst er sich ganz.

## Erhitzen und Sieden

Den Brenner antippen und die Flamme wählen: leuchtend oder rauschend. Die rauschende Flamme heizt fast doppelt so stark. Das Thermometer steigt, bis das Wasser siedet, und bleibt dann bei 100 °C stehen – alle Wärme steckt nun im Dampf. Solange ein Brenner brennt, läuft die Uhr.

```json @ChemLab.sim
{"bench":[
  {"type":"beaker","id":"glas","contains":[{"reagent":"H2O","ml":60}]},
  {"type":"thermometer","in":"glas"},
  {"type":"burner","under":"glas"}
 ],
 "shelf":["burner","beaker","thermometer","H2O"],
 "show":{"charts":["T"]}}
```

## Eindampfen

Aus der Kochsalzlösung verdampft das Wasser, zurück bleiben Salzkristalle. Aus der Kupfersulfat-Lösung wachsen blaue Kristalle; erhitzt man sie weiter, geben sie ihr Kristallwasser ab und werden weiß. Ein paar Milliliter Wasser darauf, und sie werden wieder blau und warm. Die zwei Tropfen Schwefelsäure halten die Kupfersulfat-Lösung beim Erhitzen klar, wie im Labor üblich.

```json @ChemLab.sim
{"bench":[
  {"type":"dish","id":"salz","contains":[{"reagent":"NaCl 1M","ml":10}]},
  {"type":"burner","under":"salz"},
  {"type":"dish","id":"kupfer","contains":[{"reagent":"CuSO4 1M","ml":10},{"reagent":"H2SO4 1M","drops":2}]},
  {"type":"burner","under":"kupfer"}
 ],
 "shelf":["H2O","dish","burner"],
 "show":{"charts":false}}
```

## Gase und ihre Nachweise

Drei Gase, drei Nachweise. Magnesiumband in die Salzsäure geben und den brennenden Holzspan an die Öffnung halten: Wasserstoff verpufft mit einem Knall (Knallgasprobe). Braunstein in das Wasserstoffperoxid geben und den Glimmspan anhalten: In Sauerstoff flammt er auf. Marmor oder Soda in die Salzsäure im Becherglas geben: Kohlenstoffdioxid löscht den brennenden Span.

Der Span zeigt, was gerade im Gasraum über der Lösung steht. Wasserstoff ist leicht und verfliegt in Sekunden, Kohlenstoffdioxid ist schwer und bleibt im Becherglas liegen.

```json @ChemLab.sim
{"bench":[
  {"type":"testtube","id":"wasserstoff","contains":[{"reagent":"HCl 1M","ml":8}]},
  {"type":"testtube","id":"sauerstoff","contains":[{"reagent":"H2O2 1M","ml":5}]},
  {"type":"beaker","id":"kohlenstoffdioxid","ml":50,"contains":[{"reagent":"HCl 1M","ml":20}]}
 ],
 "shelf":["Mg ribbon","MnO2","marble","Na2CO3 1M","NaHCO3 1M","Na2SO3 1M","splint","glowsplint"],
 "show":{"charts":false}}
```

## Gasvolumen messen

Der Kolbenprober fängt das Gas auf und zeigt sein Volumen. Aus 5 cm Magnesiumband (0,052 g, also 2,1 mmol) entstehen rund 52 mL Wasserstoff: 1 mol Gas nimmt bei Raumtemperatur etwa 24 L ein.

```json @ChemLab.sim
{"bench":[
  {"type":"testtube","id":"rg","contains":[{"reagent":"HCl 1M","ml":8}]},
  {"type":"syringe","in":"rg"}
 ],
 "shelf":["Mg ribbon","syringe"],
 "show":{"charts":["V","n"]}}
```

## Verbrennung

Die rauschende Flamme anstellen und warten: Bei etwa 470 °C entzündet sich das Magnesium und verbrennt mit grellweißem Licht und weißem Rauch zu Magnesiumoxid. Danach die Flamme löschen, abkühlen lassen, Wasser und Phenolphthalein dazugeben: Die Lösung färbt sich rotviolett, denn Magnesiumoxid bildet mit Wasser eine Lauge.

Schwefel brennt mit blauer Flamme zu stechend riechendem Schwefeldioxid und lässt sich schon mit dem brennenden Span entzünden; Holzkohle glüht.

```json @ChemLab.sim
{"bench":[
  {"type":"dish","id":"schale","contains":[{"reagent":"Mg ribbon","g":0.104}]},
  {"type":"burner","under":"schale"}
 ],
 "shelf":["dish","burner","Mg ribbon","sulfur","charcoal","splint","H2O","PP"],
 "show":{"charts":["n"]}}
```

## Flammenfärbung

Das Magnesiastäbchen wählen und ein Reagenzglas antippen: Das Stäbchen wird in die Lösung getaucht und in die rauschende Flamme gehalten. Natrium färbt sie gelb, Kalium violett, Lithium und Strontium rot, Calcium orangerot, Barium und Kupfer grün. Schon wenig Natrium überstrahlt alles andere.

```json @ChemLab.sim
{"bench":[
  {"type":"burner","flame":2},
  {"type":"testtube","id":"a","contains":[{"reagent":"NaCl 0.1M","ml":5}]},
  {"type":"testtube","id":"b","contains":[{"reagent":"KBr 0.1M","ml":5}]},
  {"type":"testtube","id":"c","contains":[{"reagent":"LiCl 0.1M","ml":5}]},
  {"type":"testtube","id":"d","contains":[{"reagent":"CaCl2 0.1M","ml":5}]},
  {"type":"testtube","id":"e","contains":[{"reagent":"SrCl2 0.1M","ml":5}]},
  {"type":"testtube","id":"f","contains":[{"reagent":"BaCl2 0.1M","ml":5}]},
  {"type":"testtube","id":"g","contains":[{"reagent":"CuSO4 0.1M","ml":5}]}
 ],
 "shelf":["rod"],
 "show":{"charts":false,"equations":false}}
```

## Metalle und Salzlösungen

Ein unedles Metall verdrängt ein edleres aus dessen Lösung. Zinkpulver in die Kupfersulfat-Lösung geben: Kupfer scheidet sich ab, die Lösung verliert ihre Farbe und wird warm. Kupferblech in Silbernitrat-Lösung überzieht sich mit Silber, und die Lösung färbt sich nach und nach blassblau. Kupfer in Zinksulfat-Lösung: nichts. In Salzsäure entwickelt Zink Wasserstoff, Kupfer nicht.

Keine dieser Reaktionen ist eingetragen. Sie folgen aus den Standardpotentialen der Metalle, ihre Wärme aus den Bildungsenthalpien.

```json @ChemLab.sim
{"bench":[
  {"type":"testtube","id":"a","contains":[{"reagent":"CuSO4 0.1M","ml":10}]},
  {"type":"thermometer","in":"a"},
  {"type":"testtube","id":"b","contains":[{"reagent":"AgNO3 0.1M","ml":10}]},
  {"type":"testtube","id":"c","contains":[{"reagent":"ZnSO4 0.1M","ml":10}]},
  {"type":"testtube","id":"d","contains":[{"reagent":"HCl 1M","ml":10}]}
 ],
 "shelf":["Zn powder","Zn granules","Fe wool","Cu sheet","Mg ribbon","FeSO4 0.1M","testtube"],
 "show":{"charts":["T","n"]}}
```

## Leitfähigkeit

Leitet die Flüssigkeit den Strom, leuchtet das Lämpchen. Destilliertes Wasser leitet fast nicht. Kochsalzlösung zugeben: Das Lämpchen leuchtet auf, und das Messgerät zeigt die Leitfähigkeit. Zuckerlösung ändert nichts, denn Zucker bildet keine Ionen. Salzsäure leitet viel besser als Essigsäure gleicher Konzentration.

Wo Strom fließt, steigen an den Elektroden Gasblasen auf: Der Strom zerlegt die Lösung.

```json @ChemLab.sim
{"bench":[
  {"type":"beaker","id":"glas","ml":250,"contains":[{"reagent":"H2O","ml":100}]},
  {"type":"electrode-C","in":"glas"},
  {"type":"electrode-C","in":"glas"},
  {"type":"supply","in":"glas","volts":6},
  {"type":"lamp","in":"glas"},
  {"type":"conductometer","in":"glas"}
 ],
 "shelf":["NaCl 1M","sugar 1M","HCl 0.1M","CH3COOH 0.1M","KNO3 1M","H2O","beaker"],
 "show":{"charts":["kappa"]}}
```

## Leitfähigkeitstitration

Der Äquivalenzpunkt lässt sich auch ohne Indikator finden. Die Lauge ersetzt die schnellen Wasserstoff-Ionen der Säure durch langsamere Natrium-Ionen: Die Leitfähigkeit fällt. Ist die Säure verbraucht, bringt jede weitere Zugabe neue Ionen, und die Leitfähigkeit steigt wieder. Der Knick der Kurve liegt am Äquivalenzpunkt.

```json @ChemLab.sim
{"bench":[
  {"type":"beaker","id":"probe","contains":[{"reagent":"HCl 0.1M","ml":20},{"reagent":"H2O","ml":30}]},
  {"type":"conductometer","in":"probe"},
  {"type":"burette","over":"probe","contains":[{"reagent":"NaOH 0.1M","ml":40}]}
 ],
 "shelf":[],
 "show":{"charts":["titration"],"equations":false}}
```

## Elektrolyse

Kupferchlorid-Lösung zwischen zwei Graphit-Elektroden. Das Netzgerät antippen und die Spannung einstellen: Am Minuspol scheidet sich Kupfer ab, am Pluspol steigt Chlor auf, man riecht es. Unter der Fläche stehen die Vorgänge an den beiden Elektroden, mit Elektronen geschrieben. „Umpolen“ vertauscht die Pole: Das Kupfer löst sich wieder und wandert auf die andere Elektrode.

Aus dem Regal lassen sich weitere Zellen aufbauen. Zinkiodid-Lösung gibt Zink und braunes Iod; Kochsalzlösung mit Phenolphthalein gibt Wasserstoff, Chlor und Natronlauge.

```json @ChemLab.sim
{"bench":[
  {"type":"beaker","id":"zelle","contains":[{"reagent":"CuCl2 0.5M","ml":80}]},
  {"type":"electrode-C","in":"zelle"},
  {"type":"electrode-C","in":"zelle"},
  {"type":"supply","in":"zelle"},
  {"type":"ammeter","in":"zelle"}
 ],
 "shelf":["beaker","electrode-C","supply","ammeter","ZnI2 0.5M","NaCl 1M","PP","splint"],
 "show":{"charts":["I","m"]}}
```

## Wasser zerlegen

Verdünnte Schwefelsäure zwischen Platin-Elektroden. Die Spannung in kleinen Schritten erhöhen: Bis etwa 1,7 V fließt fast kein Strom, darüber wächst er mit der Spannung. Das Diagramm „Stromstärke über der Spannung“ zeigt diese Zersetzungsspannung. Am Minuspol steigt doppelt so viel Gas auf wie am Pluspol: Wasserstoff und Sauerstoff. Bei genügend Strom gibt der brennende Span die Knallgasprobe; der Kolbenprober misst das Volumen beider Gase zusammen.

```json @ChemLab.sim
{"bench":[
  {"type":"beaker","id":"zelle","contains":[{"reagent":"H2SO4 0.5M","ml":80}]},
  {"type":"electrode-Pt","in":"zelle"},
  {"type":"electrode-Pt","in":"zelle"},
  {"type":"supply","in":"zelle"},
  {"type":"ammeter","in":"zelle"},
  {"type":"voltmeter","in":"zelle"}
 ],
 "shelf":["splint","glowsplint","syringe"],
 "show":{"charts":["IU","I","V"]}}
```

## Kupfer abscheiden

Zwei Kupfer-Elektroden in Kupfersulfat-Lösung: Am Pluspol geht Kupfer in Lösung, am Minuspol scheidet sich ebenso viel ab, und die Lösung bleibt, wie sie ist. Eine Elektrode antippen: Unter der Fläche steht ihre Masse. Die Änderung folgt dem Gesetz von Faraday. 1 A scheidet in einer Minute 19,8 mg Kupfer ab.

```json @ChemLab.sim
{"bench":[
  {"type":"beaker","id":"zelle","contains":[{"reagent":"CuSO4 0.5M","ml":80}]},
  {"type":"electrode-Cu","in":"zelle"},
  {"type":"electrode-Cu","in":"zelle"},
  {"type":"supply","in":"zelle","volts":3},
  {"type":"ammeter","in":"zelle"}
 ],
 "shelf":[],
 "show":{"charts":["m","I"]}}
```

## Galvanische Zelle

Zink in Zinksulfat-Lösung, Kupfer in Kupfersulfat-Lösung, dazwischen eine Salzbrücke: das Daniell-Element. Der Spannungsmesser zeigt 1,10 V; Kupfer ist der Pluspol. Solange kein Verbraucher angeschlossen ist, geschieht nichts. Den Strommesser aus dem Regal an eines der Gläser anschließen: Nun fließt Strom, Zink geht in Lösung, Kupfer scheidet sich ab, und die Salzbrücke gleicht die Ladung aus. Für das Lämpchen reicht der Strom nicht.

Mit den anderen Elektroden und Lösungen aus dem Regal entstehen weitere Zellen. Ihre Spannung folgt aus den Standardpotentialen und den Konzentrationen.

```json @ChemLab.sim
{"bench":[
  {"type":"beaker","id":"links","contains":[{"reagent":"ZnSO4 1M","ml":80}]},
  {"type":"electrode-Zn","in":"links"},
  {"type":"beaker","id":"rechts","contains":[{"reagent":"CuSO4 1M","ml":80}]},
  {"type":"electrode-Cu","in":"rechts"},
  {"type":"bridge","in":"links","to":"rechts"},
  {"type":"voltmeter","in":"rechts"}
 ],
 "shelf":["ammeter","lamp","bridge","beaker","electrode-Ag","electrode-Fe","electrode-Zn","electrode-Cu","AgNO3 0.1M","FeSO4 0.1M","ZnSO4 0.1M","CuSO4 0.1M","H2O"],
 "show":{"charts":["U","I","m"]}}
```

## Reaktionsgeschwindigkeit: Konzentration

Natriumthiosulfat zerfällt in Säure: Fein verteilter Schwefel trübt die Lösung, bis man nicht mehr hindurchsieht. In beide Gläser je 5 mL Salzsäure geben und im Protokoll die Zeit vom Zugeben bis zur Meldung „Durch die Flüssigkeit sieht man nicht mehr hindurch“ ablesen: Mit der halben Konzentration dauert es etwa doppelt so lang. Mit Wasser und Thiosulfat-Lösung aus dem Regal lassen sich weitere Verdünnungen ansetzen.

Wer genauer messen will, steckt das Fotometer in ein Glas: Die Extinktion wächst mit der Trübung, und das Diagramm zeigt ihren Verlauf.

```json @ChemLab.sim
{"bench":[
  {"type":"beaker","id":"voll","contains":[{"reagent":"Na2S2O3 0.16M","ml":50}]},
  {"type":"beaker","id":"halb","contains":[{"reagent":"Na2S2O3 0.08M","ml":50}]}
 ],
 "shelf":["HCl 2M","Na2S2O3 0.16M","H2O","beaker","photometer"],
 "show":{"charts":["A","n"]}}
```

## Reaktionsgeschwindigkeit: Temperatur

Derselbe Versuch im Wasserbad. Das Wasserbad antippen und die Temperatur einstellen, warten, bis das Thermometer sie zeigt, dann 5 mL Salzsäure zugeben. Zehn Grad mehr halbieren die Zeit ungefähr; im Eiswasser dauert es Minuten.

```json @ChemLab.sim
{"bench":[
  {"type":"beaker","id":"glas","contains":[{"reagent":"Na2S2O3 0.16M","ml":50}]},
  {"type":"bath","under":"glas","temp":35},
  {"type":"thermometer","in":"glas"}
 ],
 "shelf":["HCl 2M","Na2S2O3 0.16M","beaker","bath","thermometer"],
 "show":{"charts":["T"]}}
```

## Reaktionsgeschwindigkeit: Zerteilungsgrad

Marmor in Salzsäure, einmal als Körner und einmal als Pulver. In jedes Glas 0,5 g geben; die Kolbenprober messen das Kohlenstoffdioxid. Das Pulver hat die zehnfache Oberfläche und reagiert zehnmal so schnell, am Ende steht in beiden Kolbenprobern gleich viel Gas. Ein Teil des Kohlenstoffdioxids bleibt in der Lösung; deshalb steigen bei den Körnern erst nach einigen Sekunden Blasen auf. Mit der Säure aus dem Regal lässt sich auch die Konzentration ändern: Die Geschwindigkeit wächst mit ihr.

```json @ChemLab.sim
{"bench":[
  {"type":"beaker","id":"links","contains":[{"reagent":"HCl 1M","ml":40}]},
  {"type":"syringe","in":"links"},
  {"type":"beaker","id":"rechts","contains":[{"reagent":"HCl 1M","ml":40}]},
  {"type":"syringe","in":"rechts"}
 ],
 "shelf":["marble","marble powder","HCl 0.5M","HCl 2M","H2O","beaker","syringe"],
 "show":{"charts":["V"]}}
```

## Katalysator

Wasserstoffperoxid zerfällt von selbst nicht merklich. Eine Spatelspitze Braunstein in das eine Glas, etwas Kaliumiodid-Lösung in das andere: In beiden entsteht Sauerstoff, mit Braunstein viel schneller. Der Glimmspan flammt auf. Bei der Gleichung steht der Katalysator, und das Feld des Gefäßes zeigt, dass von ihm nichts verbraucht wird.

```json @ChemLab.sim
{"bench":[
  {"type":"testtube","id":"links","contains":[{"reagent":"H2O2 1M","ml":10}]},
  {"type":"testtube","id":"rechts","contains":[{"reagent":"H2O2 1M","ml":10}]}
 ],
 "shelf":["MnO2","KI 1M","glowsplint","H2O2 1M","syringe","thermometer","testtube"],
 "show":{"charts":["n","V","T"]}}
```

## Ioduhr

Im Glas stehen Kaliumiodid, etwas Natriumthiosulfat und 1 mL Stärkelösung (20 Tropfen). 20 mL Peroxodisulfat-Lösung dazugeben: Es entsteht langsam Iod, aber das Thiosulfat fängt es sofort wieder ab. Erst wenn das Thiosulfat verbraucht ist, bleibt Iod übrig und färbt die Stärke schlagartig blau, nach knapp einer Minute. Mit der verdünnten Lösung dauert es doppelt so lang, mit mehr Thiosulfat auch, im warmen Wasserbad geht es schneller.

Mit nur wenigen Tropfen Stärke reicht sie nicht für alles Iod, das weiter entsteht: Die Lösung wird dann grün und schließlich braun.

Stärke und Iodlösung stehen auch im Regal. Ein Reagenzglas mit 10 mL Wasser, 20 Tropfen Stärke und einem Tropfen Iodlösung ist tiefblau; im Wasserbad von 95 °C verblasst die Farbe zu einem blassen Gelbgrün, und beim Abkühlen kommt das Blau wieder.

```json @ChemLab.sim
{"bench":[
  {"type":"beaker","contains":[{"reagent":"KI 0.2M","ml":20},{"reagent":"Na2S2O3 0.005M","ml":10},{"reagent":"starch","drops":20}]}
 ],
 "shelf":["K2S2O8 0.1M","K2S2O8 0.05M","Na2S2O3 0.005M","KI 0.2M","starch","Lugol","H2O","bath","thermometer","beaker","testtube"],
 "show":{"charts":["n","T"]}}
```

## Fotometer: Farbe messen

Das Fotometer schickt Licht einer Wellenlänge durch 1 cm Lösung und zeigt die Extinktion: wie viel davon fehlt. Sie ist der Konzentration proportional (Lambert-Beer). 50 mL Wasser zugeben: Die Extinktion halbiert sich. Das Fotometer antippen und die Wellenlänge verstellen: Das Spektrum zeigt, wo Permanganat am stärksten absorbiert, nämlich im Grünen; deshalb sieht die Lösung rosa bis violett aus.

```json @ChemLab.sim
{"bench":[
  {"type":"beaker","id":"probe","ml":250,"contains":[{"reagent":"KMnO4 0.0002M","ml":50}]},
  {"type":"photometer","in":"probe","nm":525}
 ],
 "shelf":["H2O","KMnO4 0.0002M","CuSO4 0.1M","K2CrO4 0.001M","beaker","photometer"],
 "show":{"charts":["spectrum","A"]}}
```

## Fotometer: eine Reaktion verfolgen

Kristallviolett verblasst in Natronlauge. 10 mL Lauge zugeben und der Extinktion zusehen: Sie fällt in gleichen Zeiten immer auf denselben Bruchteil, mit der Lauge von 0,1 mol/L etwa alle dreieinhalb Minuten auf die Hälfte. Das ist eine Reaktion erster Ordnung im Farbstoff. Mit der doppelt so starken Lauge geht es doppelt so schnell.

```json @ChemLab.sim
{"bench":[
  {"type":"beaker","id":"probe","contains":[{"reagent":"crystal violet","ml":10}]},
  {"type":"photometer","in":"probe","nm":590}
 ],
 "shelf":["NaOH 0.1M","NaOH 0.2M","crystal violet","H2O","beaker","photometer","bath"],
 "show":{"charts":["A","spectrum"]}}
```

## Redoxtitration

Im Becherglas steht angesäuerte Eisen(II)-sulfat-Lösung, in der Bürette Kaliumpermanganat. Die Bürette antippen und den Hahn öffnen: Jeder Tropfen entfärbt sich sofort, denn Permanganat oxidiert Eisen(II) zu Eisen(III) und wird selbst zu farblosem Mangan(II). Ist alles Eisen(II) verbraucht, bleibt die Farbe stehen: rosa vom Permanganat, mit dem Gelb des Eisen(III) zusammen eher rot. Das Fotometer zeigt den Endpunkt als Knick: Bis dahin bleibt die Extinktion bei null, danach wächst sie mit jedem Tropfen. 1 mmol Eisen(II) braucht 0,2 mmol Permanganat, hier also 10 mL.

Im Regal stehen weitere Paare. Wasserstoffperoxid entfärbt saures Permanganat unter Sauerstoffentwicklung. Kupfersulfat gibt mit Kaliumiodid weißes Kupfer(I)-iodid und braunes Iod; das Iod lässt sich mit Thiosulfat titrieren, und Stärke zeigt dabei den Endpunkt.

```json @ChemLab.sim
{"bench":[
  {"type":"beaker","id":"probe","ml":250,"contains":[{"reagent":"FeSO4 0.1M","ml":10},{"reagent":"H2SO4 1M","ml":10},{"reagent":"H2O","ml":30}]},
  {"type":"burette","over":"probe","contains":[{"reagent":"KMnO4 0.02M","ml":25}]},
  {"type":"photometer","in":"probe","nm":525}
 ],
 "shelf":["KMnO4 0.02M","FeSO4 0.1M","H2SO4 1M","H2O2 0.1M","CuSO4 0.1M","KI 1M","Na2S2O3 0.1M","starch","H2O","beaker","burette"],
 "show":{"charts":["titration","A"]}}
```

## Gleichgewicht verschieben: Konzentration

Eisen(III)-Ionen und Thiocyanat-Ionen stehen mit ihrem roten Komplex im Gleichgewicht. Mehr Eisen(III)-chlorid oder mehr Kaliumthiocyanat: Die Farbe wird tiefer. Wasser: Sie wird heller, und zwar stärker, als es der Verdünnung entspricht. Silbernitrat fällt Thiocyanat aus, und die Farbe verblasst. Das Fotometer misst mit.

```json @ChemLab.sim
{"bench":[
  {"type":"beaker","id":"probe","ml":250,"contains":[{"reagent":"FeCl3 0.001M","ml":25},{"reagent":"HCl 0.1M","ml":25},{"reagent":"KSCN 0.001M","ml":50}]},
  {"type":"photometer","in":"probe","nm":460}
 ],
 "shelf":["FeCl3 0.1M","KSCN 0.1M","H2O","AgNO3 0.1M","beaker"],
 "show":{"charts":["A","n"]}}
```

## Gleichgewicht verschieben: Säure und Lauge

Gelbes Chromat und orangefarbenes Dichromat stehen über die Säure im Gleichgewicht. Salzsäure färbt die Lösung orange, Natronlauge wieder gelb. Bariumchlorid fällt auch aus der orangefarbenen Lösung gelbes Bariumchromat: Das Gleichgewicht liefert Chromat nach.

```json @ChemLab.sim
{"bench":[
  {"type":"beaker","contains":[{"reagent":"K2CrO4 0.05M","ml":20}]},
  {"type":"phmeter","in":"beaker1"}
 ],
 "shelf":["HCl 1M","NaOH 1M","BaCl2 0.1M","K2Cr2O7 0.025M","K2CrO4 0.05M","beaker"],
 "show":{"charts":["pH","n"]}}
```

## Gleichgewicht verschieben: Temperatur

Cobaltchlorid in starker Salzsäure: rosa Cobalt-Ionen und der blaue Chlorokomplex. Die Bildung des blauen Komplexes braucht Wärme. Das Wasserbad auf 80 °C stellen: Die Lösung wird blau. Auf 5 °C: Sie wird wieder rosa. Wasser verschiebt nach rosa, weil das Chlorid verdünnt wird.

```json @ChemLab.sim
{"bench":[
  {"type":"testtube","id":"glas","contains":[{"reagent":"CoCl2 0.5M","ml":4},{"reagent":"HCl 12M","ml":6}]},
  {"type":"bath","under":"glas","temp":20},
  {"type":"thermometer","in":"glas"}
 ],
 "shelf":["H2O","CoCl2 0.5M","HCl 12M","testtube","bath"],
 "show":{"charts":["T","n"]}}
```

## Teilchenlupe

Das Glas antippen und „Teilchenlupe“ wählen: Sie zeigt, was in einem winzigen Ausschnitt der Lösung zu sehen wäre. Jeder Punkt steht für 20 mmol/L eines gelösten Teilchens, das Wasser ist nur angedeutet. Natronlauge zugeben: Wasserstoff-Ionen verschwinden, Natrium-Ionen kommen dazu. Mit Silbernitrat entsteht Silberchlorid als Feststoff. Die Teilchen bewegen sich, solange die Uhr läuft, und im warmen Wasserbad schneller.

```json @ChemLab.sim
{"bench":[
  {"type":"beaker","contains":[{"reagent":"HCl 1M","ml":20},{"reagent":"BTB","drops":3}]}
 ],
 "shelf":["NaOH 1M","AgNO3 1M","H2O","bath"],
 "show":{"charts":["n"]}}
```

## Ohne Zahlen

Für Jüngere lassen sich alle Zahlen ausblenden. Es bleiben die Beobachtungen: Farbe, Gasblasen, das steigende Thermometer und die Reaktionsgleichung. Auch Diagramme, Gleichungen und Protokoll lassen sich einzeln abschalten.

```json @ChemLab.sim
{"bench":[
  {"type":"testtube","contains":[{"reagent":"HCl 1M","ml":8},{"reagent":"BTB","drops":3}]},
  {"type":"thermometer","in":"testtube1"}
 ],
 "shelf":["Mg ribbon","NaOH 1M"],
 "show":{"numbers":false,"charts":false}}
```

## Leere Arbeitsfläche

Ein leerer Block ergibt einen leeren Tisch und ein Regal mit allem, was der Baustein kennt.

```json @ChemLab.sim
{}
```

## Die Beschreibung des Aufbaus

Die Beschreibung ist ein kurzer Text im JSON-Format.

``` json
{"bench":[
  {"type":"beaker","id":"becher","ml":250,"contains":[{"reagent":"HCl 0.5M","ml":40}]},
  {"type":"thermometer","in":"becher"}
 ],
 "shelf":["NaOH 1M","Mg ribbon","testtube"],
 "show":{"numbers":true,"equations":true,"charts":["T","n","pH","titration"],"log":true},
 "room":20}
```

- `bench` – was am Anfang auf dem Tisch steht, von links nach rechts.

  - `type` – das Gerät, siehe Tabelle.
  - `id` – ein eigener Name aus Buchstaben, Ziffern, Punkt, Binde- und Unterstrich; ohne Angabe heißen die Geräte `testtube1`, `testtube2`, `beaker1` …
  - `contains` – der Inhalt eines Gefäßes: je Stoff `reagent` und die Menge als `ml`, `drops` (Tropfen zu 0,05 mL) oder `g`. Flüssigkeiten stehen in `ml` oder `drops`, Feststoffe in `g`; eine falsche Einheit oder mehr, als das Gefäß fasst, ergibt einen Hinweis statt der Fläche.
  - `in` – bei einem Messgerät oder Kolbenprober der Name des Gefäßes, in dem es steckt oder an das er angeschlossen ist.
  - `over` – bei einer Bürette der Name des Gefäßes, über dem sie hängt.
  - `under` – bei einem Brenner oder Wasserbad der Name des Gefäßes, unter dem es steht; ohne Angabe steht es für sich auf dem Tisch. Unter einem Gefäß steht entweder ein Brenner oder ein Wasserbad. `flame` – die Flamme des Brenners: 0 aus (Vorgabe), 1 leuchtend, 2 rauschend. `temp` – die Temperatur des Wasserbads in °C, 0 bis 95; ohne Angabe die des Raums.
  - `nm` – beim Fotometer die Wellenlänge in nm, 380 bis 730; Vorgabe 525.
  - `in` – bei einer Elektrode das Becherglas, in das sie taucht: die erste steht links, die zweite rechts, und dort bleibt jede, auch wenn die andere ersetzt wird. Bei Netzgerät, Strommesser, Spannungsmesser und Lämpchen das Becherglas, an dessen Elektroden sie angeschlossen sind; sie stehen daneben.
  - `volts`, `flip` – beim Netzgerät die Spannung in V (0 bis 12, Vorgabe 0 = aus) und ob es umgepolt ist. Ohne `flip` liegt der Pluspol an der linken Elektrode.
  - `to` – bei der Salzbrücke das zweite Gefäß; das erste steht in `in`. An jedem Gefäß hängt höchstens ein Ende einer Salzbrücke.
  - `g` – bei einer Elektrode ihre Masse in g, falls sie von der Vorgabe abweichen soll.

- `shelf` – was das Regal anbietet: Stoffe und Geräte; ohne Angabe alles, nach Fächern geordnet.
- `show` – was unter der Fläche erscheint. `numbers: false` blendet alle Zahlen aus; `equations`, `log` und `charts` schalten Gleichungen, Protokoll und Diagramme. Diagramme: `"T"` Temperatur, `"n"` Stoffmengen, `"pH"` pH-Wert über der Zeit, `"titration"` pH-Wert, Leitfähigkeit oder Extinktion über dem Volumen aus der Bürette (je nachdem, welches Messgerät im Gefäß darunter steckt), `"V"` Gasvolumen im Kolbenprober, `"I"` Stromstärke, `"U"` Spannung, `"A"` Extinktion am Fotometer über der Zeit, `"spectrum"` Extinktion über der Wellenlänge, `"IU"` Stromstärke über der Spannung des Netzgeräts, `"m"` Massenänderung der Elektroden, `"kappa"` Leitfähigkeit; `false` für keines. Jedes Diagramm erscheint nur, wenn das Messgerät dazu angeschlossen ist. `"titration"` zeigt mit einem Leitfähigkeitsmessgerät unter der Bürette die Leitfähigkeit über dem Volumen.
  `particles: false` nimmt die Teilchenlupe aus dem Feld der Gefäße, für Kurse ohne Teilchenmodell.
- `room` – die Raumtemperatur in °C, Vorgabe 20.
- `data` – eigene Stoffe und Reaktionen, siehe nächster Abschnitt.

| `type` | Gerät | Angaben |
|---|---|---|
| `testtube` | Reagenzglas, 20 mL | `contains` |
| `beaker` | Becherglas | `ml` Größe: 50, 100 (Vorgabe), 250 oder 600; `contains` |
| `burette` | Bürette, 50 mL, mit Hahn | `over`, `contains` |
| `dish` | Abdampfschale aus Porzellan, 50 mL | `contains` |
| `thermometer` | Thermometer, −10 °C bis 110 °C; ist es heißer, zeigt es „> 110 °C“ | `in` |
| `phmeter` | pH-Meter | `in` |
| `burner` | Brenner; unter Becherglas und Schale mit Dreifuß, unter dem Reagenzglas mit Stativklemme | `under`, `flame` |
| `bath` | Wasserbad mit Thermostat, 0 °C (Eiswasser) bis 95 °C; das Gefäß darin nimmt seine Temperatur an | `under`, `temp` |
| `syringe` | Kolbenprober, 100 mL; verschließt das Gefäß und misst das Gasvolumen | `in` |
| `photometer` | Fotometer mit Tauchsonde: Extinktion bei einer Wellenlänge über 1 cm, bis 3 | `in`, `nm` |
| `conductometer` | Leitfähigkeitsmessgerät, zeigt mS/cm oder µS/cm | `in` |
| `electrode-C`, `electrode-Pt` | Elektrode aus Graphit (5 g) oder Platin (10 g); sie lösen sich nicht auf. Elektroden stehen nur in Bechergläsern | `in`, `g` |
| `electrode-Cu`, `electrode-Zn`, `electrode-Fe`, `electrode-Ag` | Elektrode aus Kupfer, Zink, Eisen oder Silber, 10 g | `in`, `g` |
| `supply` | Netzgerät, 0 bis 12 V, begrenzt den Strom auf 3 A; bei 0 V ist es aus | `in`, `volts`, `flip` |
| `ammeter`, `voltmeter` | Strommesser (im Stromkreis), Spannungsmesser (zwischen den beiden Elektroden) | `in` |
| `lamp` | Glühlämpchen 3,8 V / 0,07 A, im Stromkreis | `in` |
| `bridge` | Salzbrücke mit Kaliumnitrat zwischen zwei Gefäßen | `in`, `to` |
| `splint`, `glowsplint`, `rod` | brennender Holzspan, Glimmspan, Magnesiastäbchen: nur im Regal (`shelf`), sie werden an ein Gefäß gehalten | – |

Bei Lösungen steht die Konzentration im Namen: die Zahl vor `M` in mol/L, zum Beispiel `HCl 0.1M` oder `AgNO3 0.05M`. Ohne Zahl sind es 1 mol/L.

| `reagent` | Stoff | Menge |
|---|---|---|
| `H2O` | destilliertes Wasser | `ml` |
| `HCl`, `H2SO4`, `CH3COOH` | Salzsäure, Schwefelsäure, Essigsäure | `ml` |
| `NaOH`, `NH3` | Natronlauge, Ammoniaklösung | `ml` |
| `NaCl`, `KBr`, `KI` | Natriumchlorid, Kaliumbromid, Kaliumiodid | `ml` |
| `Na2SO4`, `CH3COONa`, `NH4Cl`, `KSCN` | Natriumsulfat, Natriumacetat, Ammoniumchlorid, Kaliumthiocyanat | `ml` |
| `AgNO3`, `BaCl2`, `CuSO4`, `FeCl3` | Silbernitrat, Bariumchlorid, Kupfersulfat, Eisen(III)-chlorid | `ml` |
| `Na2CO3`, `NaHCO3` | Natriumcarbonat (Soda), Natriumhydrogencarbonat (Natron) | `ml` |
| `CaCl2`, `SrCl2`, `LiCl` | Calciumchlorid, Strontiumchlorid, Lithiumchlorid | `ml` |
| `ZnSO4`, `ZnI2`, `CuCl2`, `FeSO4`, `KNO3` | Zinksulfat, Zinkiodid, Kupferchlorid, Eisen(II)-sulfat, Kaliumnitrat | `ml` |
| `Na2S2O3`, `Na2SO3`, `K2S2O8` | Natriumthiosulfat, Natriumsulfit, Kaliumperoxodisulfat | `ml` |
| `K2CrO4`, `K2Cr2O7`, `CoCl2`, `KMnO4` | Kaliumchromat, Kaliumdichromat, Cobalt(II)-chlorid, Kaliumpermanganat | `ml` |
| `crystal violet` | Kristallviolett-Lösung, 25 µmol/L (ohne Konzentration im Namen) | `ml` |
| `H2O2`, `sugar` | Wasserstoffperoxid, Zuckerlösung | `ml` |
| `BTB`, `PP`, `MO`, `UI` | Bromthymolblau, Phenolphthalein, Methylorange, Universalindikator | `drops` |
| `starch`, `Lugol` | Stärkelösung 1 %, Iod-Kaliumiodid-Lösung mit 0,01 mol/L Iod | `drops` |
| `Mg ribbon` | Magnesiumband; 1 cm wiegt 0,0104 g | `g` |
| `marble`, `marble powder` | Marmor (Calciumcarbonat) als Körner und als Pulver mit der zehnfachen Oberfläche | `g` |
| `MnO2` | Braunstein (Mangandioxid), Pulver | `g` |
| `sulfur`, `charcoal` | Schwefelpulver, Holzkohle | `g` |
| `Zn granules`, `Zn powder` | Zink als Granalien und als Pulver | `g` |
| `Fe wool`, `Cu sheet` | Eisenwolle, Kupferblech in Streifen | `g` |

## Eigene Stoffe und Reaktionen

Der Baustein ist zum Erweitern gebaut. Ein Stoff ist ein Dateneintrag; was er tut, folgt aus seinen Daten. Im Feld `data` lassen sich Stoffe, Gleichgewichte, Reaktionen und Vorratsflaschen nachtragen, im selben Format wie das Grundpaket in `chemlab-data.js`.

Hier kommt Zinn dazu: das Metall, sein Ion und das Redoxpaar mit seinem Standardpotential. Mehr braucht es nicht. Dass Zinn Kupfer aus der Kupfersulfat-Lösung verdrängt, Zink aber nicht aus der Zinksulfat-Lösung, und dass es sich in verdünnter Salzsäure kaum löst, folgt aus den Potentialen. Die Reaktionswärme wird aus den Bildungsenthalpien berechnet.

```json @ChemLab.sim
{"data":{
  "species":{
    "Sn(s)":{"name":{"de":"Zinn","en":"tin"},"Hf":0,"S":51.18,"color":"#c9ccd1","src":"CODATA Key Values"},
    "Sn^2+(aq)":{"name":{"de":"Zinn(II)-Ion","en":"tin(II) ion"},"Hf":-8.9,"S":-16.7,"src":"CODATA Key Values"}
  },
  "couples":[
    {"eq":"Sn^2+(aq) + 2 e- <=> Sn(s)","E0":-0.1438,
     "src":"llnl.dat (USGS): Sn + 2 H+ + 0.5 O2 = H2O + Sn+2, log_k 47.8615"}
  ],
  "reagents":{
    "Sn granules":{"name":{"de":"Zinn (Granalien)","en":"tin granules"},"solid":"Sn(s)","area":6}
  }
 },
 "bench":[
  {"type":"testtube","contains":[{"reagent":"CuSO4 0.1M","ml":10}]},
  {"type":"testtube","contains":[{"reagent":"ZnSO4 0.1M","ml":10}]},
  {"type":"testtube","contains":[{"reagent":"HCl 1M","ml":10}]}
 ],
 "shelf":["Sn granules","Zn granules"]}
```

**Teilchen** (`species`) heißen nach ihrer Formel mit Zustand: `H2O(l)`, `Mg(s)`, `H2(g)`, `Cl-(aq)`. Eine einfache Ladung steht als `+` oder `-` am Ende, eine mehrfache mit Dach: `Mg^2+(aq)`, `SO4^2-(aq)`. Klammern und Kristallwasser gehen auch: `Ca(OH)2(s)`, `CuSO4*5H2O(s)`. Die molare Masse wird aus der Formel berechnet.

| Angabe | Bedeutung |
|---|---|
| `name` | Name, `de` und `en` |
| `Hf` | Standard-Bildungsenthalpie in kJ/mol; `null`, wenn unbekannt (dann rechnet der Stoff ohne Wärme) |
| `S` | Standard-Entropie in J/(mol K) |
| `cp`, `rho` | molare Wärmekapazität in J/(mol K) und Dichte in g/cm³; ohne Angabe übliche Näherungen |
| `color` | Farbe eines Feststoffs in der Schreibweise `"#b9bdc6"`; auch die Farbe seines Niederschlags |
| `settle` | Zeit in s, in der sich ein Niederschlag absetzt; Vorgabe 25 |
| `flame`, `shine` | Farbe, die das Teilchen einer Flamme gibt (`"#ffd21f"`), und wie stark es färbt; Vorgabe 1, Natrium 30 |
| `smell` | `true`: das Gas riecht stechend, das Protokoll meldet es |
| `colloid` | `true`: entsteht der Feststoff in einer Lösung, bleibt er fein verteilt in der Schwebe und setzt sich nicht ab (Schwefel aus Thiosulfat) |
| `D` | Diffusionskoeffizient eines gelösten Teilchens in 10⁻⁹ m²/s; aus ihm folgen die Leitfähigkeit und wie schnell das Teilchen an eine Oberfläche nachkommt. Ohne Angabe gilt 1 |
| `at` | bei einem gelösten Teilchen mit `color` statt `bands`: die Konzentration in mol/L, bei der die Lösung diese Farbe hat |
| `symbol` | Kurzzeichen für große Moleküle, zum Beispiel `"HInd"` für einen Indikator; ersetzt die Formel in der Anzeige |
| `bands` | Farbe eines gelösten Teilchens als Absorptionsbanden: je Bande Wellenlänge des Maximums in nm, Halbwertsbreite in nm, molarer Absorptionskoeffizient in L/(mol cm) |
| `src` | Quelle der Werte – Pflicht im Grundpaket |

**Gleichgewichte** (`equilibria`) in der Lösung stellen sich sofort ein: `{"eq":"H2O(l) <=> H+(aq) + OH-(aq)","logK":-14}`. `logK` gilt bei 25 °C; wie sich das Gleichgewicht mit der Temperatur verschiebt, folgt aus der Reaktionsenthalpie. Sie wird aus den Bildungsenthalpien berechnet; fehlt eine davon, gilt die Angabe `dH` in kJ/mol am Eintrag, und ohne beides rechnet der Vorgang ohne Wärme.

Steht in der Gleichung ein Feststoff, ist es ein **Löslichkeitsgleichgewicht**: `{"eq":"AgCl(s) <=> Ag+(aq) + Cl-(aq)","logK":-9.75}`. Mehr braucht es für eine Fällung nicht. Der Feststoff fällt aus, sobald die Lösung übersättigt ist, und löst sich, wenn etwas anderes seine Ionen bindet. Mit `rate` (`k` in mol/(s cm²) je (mol/L) hoch Ordnung, `Ea`, `order`) folgt die Auflösung eines Stücks aus dem Regal einem Geschwindigkeitsgesetz: Wohin es geht, sagt weiter das Gleichgewicht, wie schnell, die Oberfläche und die Lösung. So ist Marmor eingetragen, mit `"order":{"H+(aq)":1}`.

Steht in der Gleichung ein Gas, ist es die **Löslichkeit eines Gases**: `{"eq":"CO2(g) <=> CO2(aq)","logK":-1.468}`; `logK` ist die gelöste Konzentration in mol/L bei 1 bar. Ist mehr gelöst, perlt das Gas aus; beim Sieden geht es mit dem Dampf fort, beim Eindampfen entweicht es ganz.

**Redoxpaare** (`couples`): die oxidierte Form mit ihren Elektronen und die reduzierte Form, dazu das Standardpotential `E0` in V: `{"eq":"Cu^2+(aq) + 2 e- <=> Cu(s)","E0":0.3386}`. Ein Metall kann mehrere Paare haben, wenn es auf verschiedenen Wegen in dieselbe Oxidationsstufe übergeht: Zink zu Zink-Ionen oder in Lauge zu Zinkat, Silber zu Silber-Ionen oder mit Chlorid zu Silberchlorid, das dann als Belag auf der Elektrode sitzt. Solche Paare gelten als ein System; ihre Potentiale müssen zueinander passen (umgerechnet mit der Konstante des Komplexes oder dem Löslichkeitsprodukt). Aus den Redoxpaaren leitet der Baustein her, was an einem Metallstück und an einer Elektrode geschieht: welches Metall welches verdrängt, was sich bei der Elektrolyse abscheidet, welche Spannung eine Zelle liefert. `over` ist die Überspannung in V bei 1 mA/cm², mit der der Vorgang an einer Oberfläche in Gang kommt: eine Zahl für jede Oberfläche oder je Material, zum Beispiel `{"default":0.6,"Pt(s)":0.09,"Zn(s)":0.36}` für Wasserstoff. Ohne `over` läuft der Vorgang ungehemmt. Eine eingetragene Reaktion (`reactions`) mit derselben Gleichung geht der hergeleiteten vor.

Eine eigene Elektrode ist ein Gerät mit dem Material als Angabe: `LiaChemLab.registerPart("electrode-Sn", Object.assign({ kind: "tool", electrode: "Sn(s)", g: 10, unit: "g", lag: 0 }, LiaChemLab.electrodeLook))`. Sie heißt nach ihrem Stoff („Zinn-Elektrode“); ein eigener Name steht in `name` mit `de` und `en`. Im Regal erscheint sie nur dort, wo ihr Stoff eingetragen ist.

**Reaktionen** (`reactions`) laufen mit Geschwindigkeit ab. `rate.k` ist die Geschwindigkeitskonstante bei 25 °C, `rate.Ea` die Aktivierungsenergie in kJ/mol, `rate.order` die Ordnung je gelöstem Teilchen. Mit `rate.surface` wächst die Geschwindigkeit mit der Oberfläche eines Feststoffs; `k` hat dann die Einheit mol/(s cm²) je (mol/L) hoch Ordnung.

Ein **Katalysator** ist ein Stoff, der in `rate.order` oder `rate.surface` steht, in der Gleichung aber nicht vorkommt. Dieselbe Gleichung darf mit verschiedenen Katalysatoren mehrfach eingetragen sein: Jeder Weg läuft für sich, und bei der Gleichung steht, wer ihn beschleunigt. So lässt sich auch zu einer vorhandenen Reaktion ein weiterer Katalysator nachtragen. Das gilt auch für Redoxreaktionen, die der Baustein aus den Redoxpaaren herleitet (Zink in Säure): Ein Eintrag mit Katalysator läuft zusätzlich zur hergeleiteten Reaktion, ein Eintrag ohne Katalysator ersetzt sie.

| Angabe einer Reaktion | Bedeutung |
|---|---|
| `rate.ignite` | Zündtemperatur in °C: Die Reaktion ist eine Verbrennung. Sie beginnt bei dieser Temperatur und hält sich dann selbst in Gang, mit Sauerstoff aus der Luft (`O2(g)` in der Gleichung). Unter Wasser und im verschlossenen Gefäß brennt nichts. |
| `fire` | Aussehen des Feuers: `color` Farbe der Flamme, `glare` wie grell (0 bis 1), `smoke` Farbe des Rauchs, `glow: true` für Glut statt Flamme, `T` Flammentemperatur in °C (Vorgabe 800) |
| `rate.dry` | `true`: läuft nur ohne Flüssigkeit, zum Beispiel das Entwässern eines Kristallhydrats |
| `rate.fast` | `true`: läuft in Lösung sofort ab, bis einer der Ausgangsstoffe verbraucht ist, zum Beispiel Iod mit Thiosulfat. Braucht kein `k`. |
| `logK` | Nur mit `rate.fast`: Die Reaktion läuft bis zu diesem Gleichgewicht (mit Konzentrationen in mol/L; Feststoffe, Wasser und Gase zählen 1) und nicht weiter. Der Wert gilt bei jeder Temperatur. Ohne die Angabe läuft sie vollständig ab. Die Rückreaktion wird nicht gerechnet. |
| `spark` | Zündgrenzen eines Gasgemischs als Anteile am Gasraum, zum Beispiel `[0.04, 0.75]` für Wasserstoff. Eine solche Reaktion braucht keine Geschwindigkeit: Sie läuft, wenn ein Span oder eine Brennerflamme sie zündet. |
| `dH` | Reaktionsenthalpie in kJ/mol, falls eine Bildungsenthalpie fehlt |

**Vorratsflaschen** (`reagents`): eine Lösung (`solution`: Teilchen und ihre Konzentration in mol/L; mit `"molar":true` gilt der Eintrag für 1 mol/L und die Konzentration steht im Namen), eine reine Flüssigkeit (`liquid`) oder ein Feststoff (`solid` mit `area`, der Oberfläche in cm² je Gramm). `"drops":true` gibt den Stoff tropfenweise zu; `group` nennt das Fach im Regal (`acid`, `salt`, `other`, `indicator`, `solid`). Für Feststoffe außerdem: `shape` (0 für ein Band, dessen Oberfläche beim Auflösen gleich bleibt; Vorgabe sind Körner), `tau` (Zeit in s, in der sich ein Stück löst, wenn ein Löslichkeitsgleichgewicht es verlangt und dieses kein eigenes Geschwindigkeitsgesetz hat; Vorgabe 15), `form: "powder"` (als Pulver gezeichnet) und `piece` (Menge je Stück mit Namen der Einheit, wie beim Magnesiumband in cm).

Jede Gleichung wird beim Laden geprüft. Geht die Bilanz der Atome oder der Ladung nicht auf, erscheint statt der Fläche ein Hinweis, der sagt, was fehlt.

Was es schon gibt, lässt sich über `data` nicht ändern: Ein Eintrag für einen vorhandenen Stoff, eine vorhandene Reaktion oder Vorratsflasche wird nur angenommen, wenn er dem vorhandenen gleicht. So verändert der Aufbau einer Folie nie die Stoffe, mit denen eine andere gerade rechnet. Was aus der Formel folgt – molare Masse, Ladung, Zustand – lässt sich gar nicht überschreiben.

## So rechnet der Baustein

- **Stoffmengen:** Jedes Gefäß kennt die Stoffmenge jeder Teilchenart. Reaktionen setzen sie nach ihrer Gleichung um; Masse und Ladung bleiben dabei erhalten.
- **Gleichgewichte in der Lösung** (Säuren, Basen, Indikatoren, Komplexe) stellen sich nach jedem Schritt ein. Gerechnet wird mit dem Newton-Verfahren über die Stoffbilanzen. Der pH-Wert ist der negative Logarithmus der Konzentration der Wasserstoff-Ionen.
- **Fällungen:** Der Baustein rechnet aus, wie viel von jedem Feststoff im Gleichgewicht vorläge, und nähert sich dem an: Ein Niederschlag wächst in etwa einer Sekunde, ein frischer löst sich in wenigen Sekunden wieder. Dabei kann sich ein Niederschlag in einen schwerer löslichen umwandeln. Er trübt zuerst die Lösung in seiner Farbe und setzt sich dann in einer halben bis ganzen Minute ab. Beim Umgießen wandert mit, was noch schwebt; der Bodensatz bleibt zurück.
- **Bürette:** Der Hahn gibt einen Tropfen je Sekunde (0,05 mL), 0,5 mL oder 2 mL je Sekunde ab. Ist das Gefäß darunter voll, schließt er. Die Bürette zählt mit, wie viel sie abgegeben hat; daraus entsteht die Titrationskurve. Sie beginnt mit dem ersten Tropfen und für jede Probe neu: Wird das Gefäß ausgeleert, zählt die Bürette wieder von null.
- **pH-Meter:** Es folgt dem pH-Wert mit einer Verzögerung von etwa einer Sekunde. Ohne Flüssigkeit zeigt es nichts.
- **Geschwindigkeit:** Jede eingetragene Reaktion läuft mit k · Konzentrationen hoch ihre Ordnung, bei Feststoffen mal der Oberfläche; k wächst mit der Temperatur nach Arrhenius. Magnesium löst sich deshalb umso schneller, je größer seine Oberfläche, je konzentrierter die Säure und je höher die Temperatur ist. Das Band wird dabei dünner, seine Oberfläche bleibt bis zuletzt fast gleich.
- **Katalysator:** Wasserstoffperoxid zerfällt an der Oberfläche von Braunstein und, langsamer, mit gelöstem Iodid (0,0115 L/(mol s) bei 25 °C). Beide Wege laufen nebeneinander; der Katalysator steht nicht in der Gleichung und bleibt erhalten.
- **Thiosulfat und Säure:** In Säure liegt ein Teil des Thiosulfats als Hydrogenthiosulfat vor, und dieses zerfällt zu Schwefel und Schwefeldioxid. Deshalb wächst die Geschwindigkeit mit der Thiosulfat-Konzentration und nur schwach mit der Säure. Der Schwefel bleibt als Kolloid in der Schwebe; ab 6,9 mmol/L sieht man nicht mehr hindurch.
- **Redoxreaktionen in Lösung:** Permanganat mit Eisen(II) und mit Wasserstoffperoxid, Kupfer(II) und Eisen(III) mit Iodid sind als sofortige Reaktionen eingetragen. Sie setzen in jedem Rechenschritt um, was an freien Teilchen da ist; was in Ionenpaaren oder Komplexen steckt, kommt über das Gleichgewicht nach, so dass ein Tropfen Permanganat in ein bis zwei Sekunden entfärbt ist. Die beiden Reaktionen mit Iodid laufen nur bis zu ihrem Gleichgewicht, das aus den Standardpotentialen folgt (`logK`): mit Iodid im Überschuss praktisch vollständig, neben schwerlöslichem Silberiodid gar nicht. Eine sofortige Reaktion, der ein Ausgangsstoff bis auf Spuren fehlt (Permanganat und Eisen(II) ohne Säure im Alkalischen), läuft unmerklich langsam und hält die Uhr nicht an.
- **Ioduhr:** Peroxodisulfat oxidiert Iodid langsam (erste Ordnung in beiden), Iod und Thiosulfat reagieren sofort: Eine solche Reaktion kommt in jedem Rechenschritt nach den langsamen an die Reihe und setzt um, was da ist. Solange Thiosulfat da ist, bleibt kein Iod stehen. Stärke bindet Iod zu einem blauen Komplex, der in der Wärme zerfällt.
- **Marmor:** Körner und Pulver lösen sich nach dem Geschwindigkeitsgesetz für Calcit aus der Datenbank von PHREEQC: proportional zur Oberfläche und zur Konzentration der Wasserstoff-Ionen, mit kleiner Aktivierungsenergie (8,5 kJ/mol), weil der Nachschub an Säure die Geschwindigkeit bestimmt. Wie weit, sagt das Löslichkeitsgleichgewicht. Löst sich ein Stück so langsam, dass weder Blasen aufsteigen noch das Stück sichtbar kleiner wird, lässt der Baustein es liegen. Liegen mehrere solche Feststoffe im Glas, folgt jeder seinem eigenen Gesetz; ein Niederschlag desselben Stoffs daneben löst sich wie jeder frische Niederschlag in wenigen Sekunden.
- **Wasserbad:** Das Gefäß tauscht mit dem Bad 25-mal so gut Wärme wie mit einer Flamme: Ein Reagenzglas mit 5 mL hat nach einer Minute die Temperatur des Bades, ein Becherglas mit 50 mL nach drei bis vier Minuten. Was das Bad erwärmt, meldet das Protokoll nicht als Reaktionswärme.
- **Fotometer:** Die Extinktion ist die Summe über alle gelösten Teilchen aus Absorptionskoeffizient bei der gewählten Wellenlänge, Konzentration und 1 cm Schichtdicke; dazu kommt die Trübung durch alles, was schwebt, bei jeder Wellenlänge gleich. Die Anzeige folgt mit einer halben Sekunde Verzögerung und endet bei 3. Von einem Stoff, von dem nur die Farbe eingetragen ist, kennt das Fotometer drei breite Bereiche (blau, grün, rot).
- **Teilchenlupe:** Je 20 mmol/L eines gelösten Teilchens ein Punkt, gerundet; was darunter liegt, erscheint nicht. Über 2,4 mol/L gelöster Teilchen wird der Maßstab gröber, damit es höchstens 120 Punkte sind. Feststoffe erscheinen als bis zu zwölf Bausteine, nach ihrem Anteil. Der Ort jedes Teilchens folgt aus seiner Nummer und dem Weg, den es schon hinter sich hat; je wärmer, desto schneller kommt es voran, mit der Wurzel der absoluten Temperatur.
- **Wärme:** Die Reaktionswärme folgt nach dem Satz von Hess aus den Bildungsenthalpien, etwa −55,8 kJ/mol für die Neutralisation und −467 kJ/mol für Magnesium in Säure. Wo eine Bildungsenthalpie fehlt, gilt die Reaktionsenthalpie aus der Datenbank; wo auch die fehlt, rechnet der Vorgang ohne Wärme. Sie erwärmt Lösung und Glas; das Gefäß gibt Wärme an den Raum ab und kühlt wieder aus.
- **Thermometer:** Es folgt der Temperatur mit einer Verzögerung von etwa drei Sekunden und reicht bis 110 °C; darüber zeigt es das Ende seiner Skala. Die Temperaturkurve im Diagramm ist das, was das Thermometer zeigt; ohne Thermometer gibt es keine Kurve.
- **Zugießen** dauert je nach Menge eine halbe bis vier Sekunden, ein Tropfen eine Viertelsekunde. Deshalb schlägt der Indikator mitten im Zugießen um.
- **Farbe:** Lambert-Beer für jede Wellenlänge des sichtbaren Lichts, danach Umrechnung in eine Bildschirmfarbe. Die Schichtdicke ist die Weite des Gefäßes: 1,4 cm im Reagenzglas, 5 cm im Becherglas für 100 mL.
- **Brenner:** Die Flamme gibt Wärme ab, die mit dem Abstand zur Flammentemperatur sinkt: 600 °C leuchtend, 1150 °C rauschend. In 100 mL Wasser im Becherglas kommen rund 220 W an; es siedet nach etwa drei Minuten. Ein leeres Gefäß wird mehrere hundert Grad heiß.
- **Sieden und Eindampfen:** Bei 100 °C verdampft Wasser, und die Temperatur bleibt stehen; gerechnet wird nie mit einer Lösung über 100 °C. Dabei wird die Lösung konzentrierter, bis Salze auskristallisieren. Oberhalb von 25 mol/L gelösten Teilchen gilt der Rest als Brei: Er verdampft weiter, aber mit ihm wird nicht mehr gerechnet. Ist das Wasser fort, zerfallen Komplexe, was ein Salz bilden kann, kristallisiert, die Ionen schwacher Säuren und Basen treten wieder zum Molekül zusammen, Flüchtiges (Chlorwasserstoff, Ammoniak, Essigsäure) entweicht, und der Rest bleibt als Rückstand am Glas. Er löst sich in neuem Wasser wieder; ein einzelner Tropfen reicht dafür nicht.
- **Gase über der Lösung:** Kohlenstoffdioxid, Ammoniak und Chlorwasserstoff stehen mit ihrer Lösung im Gleichgewicht. Ist mehr gelöst, als sich bei Luftdruck halten kann, perlt der Überschuss in ein bis zwei Sekunden aus. Deshalb sprudelt Soda mit Salzsäure von 1 mol/L, mit stark verdünnter aber nicht. Beim Sieden nimmt der Dampf gelöste Gase mit. Ein stechender Geruch wird gemeldet, sobald der Druck eines solchen Gases 5 mbar erreicht.
- **Gasraum:** Entstandenes Gas steht zuerst über der Flüssigkeit. Was dort keinen Platz hat, wird verdrängt; aus dem offenen Gefäß verfliegt der Rest: Wasserstoff in etwa 8 s, Sauerstoff in 40 s, Kohlenstoffdioxid in 90 s. Im Diagramm der Stoffmengen zählt das entwichene Gas weiter mit.
- **Span und Glimmspan** prüfen den Gasraum. Zwischen 4 und 75 Volumenprozent Wasserstoff verpufft das Gemisch, sofern genug Luft dabei ist; aus der freigesetzten Energie folgt, ob es „plopp“ macht, pfeifend knallt oder laut. Über 800 J zerspringt das Gefäß. Fast reiner Wasserstoff brennt ruhig an der Öffnung ab. Eine Brennerflamme unter dem Gefäß zündet ein solches Gemisch ebenfalls: einmal mit einer Verpuffung, danach brennt an der Öffnung ab, was nachkommt. Über 30 % Sauerstoff flammt der Glimmspan auf, unter 15 % erlischt der brennende Span. An ein Gefäß mit Stopfen lässt sich kein Span halten.
- **Kolbenprober:** Er verschließt das Gefäß und zählt alles Gas, das entsteht, als Volumen bei Raumtemperatur und Luftdruck, bis 100 mL. Wird das Gefäß ausgeleert, zählt er von vorn.
- **Verbrennung:** Ein Feststoff entzündet sich bei seiner Zündtemperatur und brennt dann von selbst weiter, mit Sauerstoff aus der Luft. Seine Oberfläche bestimmt, wie schnell. Der größte Teil der Wärme geht mit Licht und heißen Gasen fort; das Gefäß erwärmt die Flamme wie ein Brenner, es wird also nie heißer als sie. Unter Wasser und im verschlossenen Gefäß brennt nichts.
- **Flammenfärbung:** Jedes Teilchen mit einer Flammenfarbe trägt nach Konzentration und Leuchtkraft bei; die Farben mischen sich. Zu sehen ist sie nur in der rauschenden Flamme und vergeht nach vier Sekunden.
- **Leitfähigkeit:** Jedes Ion trägt mit seiner Konzentration, dem Quadrat seiner Ladung und seinem Diffusionskoeffizienten bei (Nernst-Einstein); je Grad wärmer leitet die Lösung 2 % besser. Reines Wasser kommt so auf 0,055 µS/cm, Salzsäure mit 0,01 mol/L auf 4,3 mS/cm.
- **Metalle in Lösungen:** Jedes Stück Metall ist eine Oberfläche, an der Oxidation und Reduktion zugleich ablaufen. Für jedes Redoxpaar wächst der Strom exponentiell mit dem Abstand des Potentials von seinem Standardpotential (Butler-Volmer), gehemmt durch die Überspannung und begrenzt durch den Nachschub aus der Lösung. Das Potential stellt sich so ein, dass sich beide Richtungen die Waage halten. So verdrängt Zink das Kupfer so schnell, wie Kupfer-Ionen nachkommen; in Säure entwickelt es Wasserstoff, in Wasser praktisch nichts, in Natronlauge langsam (es geht als Zinkat in Lösung). Zum Nachschub zählt auch, was im Gleichgewicht gebunden ist und dort wieder frei wird: Kupfer aus dem Ammin-Komplex, Wasserstoff-Ionen aus der schwachen Säure. Was langsamer abliefe als 0,1 nmol Elektronen je Sekunde, findet nicht statt.
- **Elektroden** sind Platten von 2 cm Breite, die bis 0,5 cm über den Boden des Becherglases tauchen; ihre Fläche folgt aus der Füllhöhe. Was sich auf ihnen abscheidet, bleibt als Belag und zählt zu ihrer Masse. Ein dichter Belag bestimmt, wie sich die Oberfläche verhält.
- **Stromkreis:** Zwei Elektroden im selben Glas (oder je eine in zwei Gläsern mit Salzbrücke) bilden mit den angeschlossenen Geräten einen Stromkreis. Netzgerät, Lämpchen und Strommesser liegen in Reihe, der Spannungsmesser zwischen den Elektroden. Geschlossen ist der Kreis, sobald eines der drei ersten angeschlossen ist; ein Netzgerät, das auf 0 V steht, gilt als ausgeschaltet und schließt ihn nicht. Gesucht wird der Strom, bei dem die Spannung des Netzgeräts gerade für die Potentiale der beiden Elektroden, den Widerstand der Lösung (aus Leitfähigkeit und Eintauchtiefe), das Lämpchen (54 Ω) und die Leitungen (0,5 Ω) reicht. Unterhalb der Zersetzungsspannung fließt deshalb fast nichts.
- **Elektrolyse:** Der Strom setzt an jeder Elektrode nach Faraday um: 96 485 C je Mol Elektronen. Laufen mehrere Vorgänge an einer Elektrode, teilen sie sich den Strom nach Potential, Überspannung und Nachschub; an Graphit entsteht deshalb aus Chlorid-Lösung Chlor und kaum Sauerstoff, und Zink scheidet sich ab, bevor Wasserstoff entsteht. Silber am Pluspol überzieht sich in Chlorid-Lösung mit Silberchlorid; umgepolt wird der Belag wieder zu Silber. Die Lösung erwärmt sich um das, was an Spannung über die Reaktionsenthalpie hinaus anliegt. In der Liste der Gleichungen steht ein Nebenvorgang erst, wenn er mindestens ein Zehntausendstel des Hauptvorgangs an derselben Elektrode ausmacht; gebucht wird er immer.
- **Galvanische Zelle:** Ohne Verbraucher zeigt der Spannungsmesser die Differenz der Potentiale; sie folgt der Nernst-Gleichung. Unter Last sinkt die Spannung um den Abfall am Innenwiderstand; die Salzbrücke hat 30 Ω. Sie gibt Kalium-Ionen dorthin ab, wo reduziert wird, und Nitrat-Ionen dorthin, wo oxidiert wird, so dass beide Lösungen neutral bleiben.
- **Lämpchen:** Seine Helligkeit ist der Anteil an seiner Nennleistung. Ab 5 % davon gilt es als leuchtend.
- **Klang:** Brenner, Sieden, Sprudeln und Feuer sind gefiltertes Rauschen, dessen Lautstärke dem Geschehen folgt; Verpuffung und Knall sind kurze Rauschstöße, der laute Knall ist der lauteste; ein Begrenzer fängt seine Spitzen ab, damit nichts übersteuert. Töne gibt es nur, solange die Uhr vorwärts läuft. Der Knopf „Ton“ schaltet sie ab.
- **Zeit:** Gerechnet wird in Schritten von 0,05 s. Die Uhr läuft nur, solange sich etwas ändert, ein Brenner brennt oder Strom etwas umsetzt; danach hält sie an. Als Änderung zählt, was schneller als 1 nmol/s abläuft; von da an zeigt die Fläche bei einer Gasentwicklung auch Blasen. Auch eine Lösung, deren Extinktion sich in den letzten zehn Sekunden um mehr als ein Tausendstel geändert hat (verfolgt an fünf Stellen des Spektrums, bis zur Extinktion 4; darüber kommt kein Licht mehr durch), gilt als in Bewegung: So läuft die Uhr weiter, während ein Farbstoff verblasst, von dem nur Mikromol im Glas sind. Steht die Uhr, lässt ein zweiter Druck auf „Abspielen“ sie trotzdem zehn Minuten weiterlaufen; das hilft bei allem, was unmerklich langsam weitergeht. Gasblasen meldet das Protokoll, wenn sie eine Fünftelsekunde anhalten. Ein Eingriff an einem früheren Zeitpunkt setzt dort neu an, die spätere Aufzeichnung wird verworfen. Ganz am Anfang der Zeitleiste steht der Aufbau vor dem ersten Eingriff. Aufgezeichnet wird alle 0,1 s; bei langen Versuchen wird die Aufzeichnung gleichmäßig gröber, nach anderthalb Stunden sind es 1,6 s.

**Grenzen:**

- Jedes Gefäß gilt als durchmischt; Schlieren und Schichten gibt es nicht.
- Lösungen rechnen ideal, mit Konzentrationen statt Aktivitäten. Bei sehr konzentrierten Lösungen weichen die Werte ab, und Niederschläge lösen sich in Komplexbildnern etwas schwerer als im Labor.
- Redoxreaktionen laufen an Metallen und Elektroden ab. Zwischen gelösten Teilchen laufen nur die eigens eingetragenen: Peroxodisulfat mit Iodid, Iod mit Thiosulfat, Permanganat mit Eisen(II) und mit Wasserstoffperoxid, Kupfer(II) und Eisen(III) mit Iodid. Andere bleiben ohne Wirkung, etwa Permanganat mit Oxalsäure oder mit Iodid und Dichromat mit Eisen(II). Auch Metalle reduzieren Permanganat nicht, weil dafür kein Redoxpaar eingetragen ist.
- Permanganat reagiert in der Schreibweise für saure Lösung, zu farblosem Mangan(II). Ohne Säure entstünde im Labor Braunstein; hier läuft dieselbe Reaktion, soweit Wasserstoff-Ionen nachkommen. Kupfer(I)-iodid bleibt, wie es ausfällt: Kupfer(I) in Lösung gibt es nicht.
- Gelöster Luftsauerstoff wird nicht gerechnet. Eisen rostet nicht, und Kupfer löst sich in Säure auch an der Luft nicht. Zink und Kupfer in derselben Säure (Volta-Element) zeigen deshalb etwa 0,5 V statt der 0,9 V im Versuch. Überhaupt sagt die Spannung nur dort etwas, wo jede Elektrode in einer Lösung ihrer eigenen Ionen steht (oder Gas an ihr entsteht): Kupfer in reinem Wasser oder Graphit in Kochsalzlösung haben kein festes Potential, der Spannungsmesser zeigt dann einen Wert ohne Bedeutung.
- Chlor entweicht als Gas und löst sich nicht in der Lösung: Bei der Elektrolyse von Kochsalzlösung bleibt Natronlauge zurück, Bleichlauge entsteht nicht, und Indikatoren werden nicht gebleicht.
- Ein Belag auf einer Elektrode hemmt den Strom nicht. Das Silberchlorid, mit dem sich eine Silber-Elektrode am Pluspol in Kochsalzlösung überzieht, wächst deshalb beliebig weiter; im Labor wird die Schicht dicht, und der Strom geht zurück.
- Zink löst sich in Natronlauge nur langsam und nur als Pulver sichtbar, in der Wärme deutlich schneller. Wie schnell genau, ist geschätzt.
- Weil jedes Gefäß durchmischt ist, zeigt ein Indikator bei der Elektrolyse nur das Ergebnis für die ganze Lösung, nicht die Zonen an den Elektroden. Wasserstoff und Sauerstoff bleiben nicht an den Elektroden haften: Nach dem Abschalten zeigt der Spannungsmesser keine Polarisationsspannung.
- Die Leitfähigkeit gilt für unendliche Verdünnung. In konzentrierten Lösungen ist sie zu hoch; mehrwertige Salze wie Kupfersulfat leiten dagegen schlechter als im Labor, weil die ideale Rechnung zu viele Ionenpaare bildet.
- Überspannungen und der Stoffübergang an Oberflächen sind geschätzt. Das Zink ist als technisches Zink eingestellt, das in Salzsäure sichtbar Wasserstoff entwickelt; reines Zink reagiert viel träger. Im Volta-Element entsteht deshalb der größere Teil des Wasserstoffs am Zink selbst und nur der Teil am Kupfer, der dem Strom entspricht. Die Hemmung von Magnesium und Eisen steht für ihre Oxidschichten.
- Elektroden passen nur in Bechergläser, zwei je Glas; nur dort lassen sich Netzgerät, Messgeräte und Lämpchen anschließen. Zu einem Glas (oder einem Paar mit Salzbrücke) gehört ein Stromkreis; frei verdrahten lässt sich nichts. An jedem Glas hängt höchstens eine Salzbrücke, und sie erschöpft sich nicht.
- Wasser verdunstet nur beim Sieden; unterhalb von 100 °C verliert ein Gefäß nichts. Gelöste Gase entweichen nur, wenn sie ausperlen oder mit dem Dampf fortgehen.
- Die Löslichkeit von Kupfersulfat ist auf den gemessenen Wert von 1,4 mol/L eingestellt, weil die ideale Rechnung mit der Konstante der Datenbank zu wenig ergäbe. Solche Werte sind in den Daten als „angepasst“ gekennzeichnet.
- Das Geschwindigkeitsgesetz für Marmor gilt für eine bewegte Lösung. Ruhende Körner, an denen Gasblasen haften, reagieren im Labor langsamer. Andere Feststoffe aus dem Regal (Kupfersulfat, Iod) lösen sich weiter mit einer festen Zeitkonstante.
- Das Gleichgewicht zwischen rosa Cobalt-Ionen und dem blauen Chlorokomplex ist auf die Beobachtung eingestellt (bei Raumtemperatur violett in Salzsäure von etwa 7 mol/L), weil die ideale Rechnung in so konzentrierten Lösungen nicht trägt. Die Zwischenstufen mit ein bis drei Chlorid fehlen.
- Gleichgewichte in der Gasphase gibt es nicht, also auch keine Versuche zum Einfluss des Drucks (Stickstoffdioxid im Kolbenprober).
- Der Zerfall von Thiosulfat ist als ein Schritt mit einer angepassten Konstante gerechnet; im Labor vergeht bis zur ersten Trübung eine kurze Anlaufzeit. Wann man „nicht mehr hindurchsieht“, hängt dort von Schichtdicke und Auge ab.
- Die Geschwindigkeitskonstanten von Ioduhr und Kristallviolett sind Praktikumswerte. Der Einfluss anderer Salze auf die Geschwindigkeit (Ionenstärke) fehlt.
- Iod gibt es als Lösung in Kaliumiodid, nicht als Kristalle: Festes Iod, das bei einer Elektrolyse ausfällt, reagiert nur, soweit Iodid es wieder löst.
- Was langsamer als 1 nmol/s abläuft und die Farbe nicht merklich ändert, lässt die Uhr anhalten, auch wenn es nach langer Zeit sichtbar würde (eine stark verdünnte Ioduhr). Der zweite Druck auf „Abspielen“ lässt sie dann weiterlaufen.
- Stärke ist als Zahl von Plätzen für Iod gerechnet, je 18 Glucose-Einheiten einer; die Konstante des Komplexes und seine Wärmetönung sind geschätzt.
- Das Wasserbad hat seine Temperatur sofort; aufheizen und abkühlen muss nur das Gefäß darin. Über 95 °C und unter 0 °C geht es nicht.
- Die Teilchenlupe zeigt Mengenverhältnisse, keine Größen, Formen oder Abstände der Teilchen, und ihre Wege sind erfunden. Stöße und Reaktionen einzelner Teilchen sieht man nicht.
- Der Gasraum ist ein einziger durchmischter Raum mit festen Zeiten für das Verfliegen. Gase lassen sich noch nicht in ein anderes Gefäß leiten. Im verschlossenen Gefäß brennt gar nichts, auch nicht mit dem Sauerstoff, der noch darin wäre.
- Wie flüchtig Essigsäure und Wasserstoffperoxid sind, steht mit Lehrbuchwerten in den Daten, nicht mit Werten aus den offenen Datenbanken. Wasserstoffperoxid verdampft beim Eindampfen, statt zu zerfallen.
- Zündtemperaturen, Brenndauern, Flammenfarben und die Schwellen der Verpuffung sind geschätzt. Wer den Brenner unter ein Gefäß mit Wasserstoff stellt, sieht eine Verpuffung; wie heftig sie im Labor wäre, hängt von mehr ab, als hier gerechnet wird.
- Die Farben der Lösungen sind aus geschätzten Absorptionsbanden gerechnet und treffen das übliche Aussehen, nicht ein gemessenes Spektrum.
- Die Geschwindigkeiten (Magnesium in Säure, Zerfall von Wasserstoffperoxid an Braunstein, Thiosulfat in Säure, Entwässern) sind an die übliche Dauer des Schulversuchs angepasst, nicht gemessen. Solche Werte sind in den Daten als „geschätzt“ gekennzeichnet.
- Die Simulation ersetzt keine Sicherheitsunterweisung. Was hier gefahrlos geht, braucht im Labor Schutzbrille und Aufsicht.

Geprüft wird der Baustein mit `node --test check.mjs`.
