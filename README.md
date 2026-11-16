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
          ./chemlab-3d.js

link:     ./chemlab.css

attribute: Bildungsenthalpien und Entropien aus den
           [CODATA Key Values for Thermodynamics](https://www.codata.info/resources/databases/key1.html)
           (Cox, Wagman, Medvedev, 1989).
           Gleichgewichtskonstanten und Reaktionsenthalpien aus den Datenbanken phreeqc.dat, minteq.v4.dat und llnl.dat von
           [PHREEQC Version 3](https://www.usgs.gov/software/phreeqc-version-3)
           des U.S. Geological Survey (Parkhurst und Appelo); einzeln entnommen, umgeschrieben und zum Teil umgerechnet.
           Die Einträge in chemlab-data.js nennen jeweils die Zeile der Datenbank.

@ChemLab.sim: @ChemLab.sim_(@uid,```@0```,ChemLab)

@ChemLab.lab: @ChemLab.sim_(@uid,```@1```,@0)

@ChemLab.sim_
<div class="lia-chemlab" id="lia-chemlab-@0"></div>
<script modify="false" output="@2" style="display:none">
var link = { name: "@2", publish: function (state) { send.lia(state); } };
send.register("ChemLab:@2", function (cmd) {
  var el = document.getElementById("lia-chemlab-@0");
  if (el && el._cl && el._cl.command) el._cl.command(cmd);
});
(function wait(tries) {
  var el = document.getElementById("lia-chemlab-@0"), C = window.LiaChemLab;
  if (el && C && C.mount && C.loaded()) return C.mount(el, `@'1`, false, link);
  if (el && tries === 50) {
    if (C && C.mount) C.mount(el, `@'1`, false, link);
    else el.innerHTML = '<p class="cl-error" role="alert">' + (/^de/i.test(document.documentElement.lang)
      ? "ChemLab lädt noch oder konnte nicht geladen werden (chemlab-ui.js)."
      : "ChemLab is still loading or could not be loaded (chemlab-ui.js).") + "</p>";
  }
  if (tries < 300) setTimeout(function () { wait(tries + 1); }, tries < 50 ? 100 : 500);
})(0);
"LIA: wait"
</script>
@end

@ChemLab.show: <div class="lia-chemlab lia-chemlab-slot" data-chemlab="@0" data-show="@1"></div>

@ChemLab.value: <span class="lia-chemlab-slot lia-chemlab-value" data-chemlab="@0" data-value="@1">–</span>

@ChemLab.take: <script input="submit" default="@2" modify="false">send.dispatch("ChemLab:@0", { take: `@'1` }); `@'2`</script>

@ChemLab.data: @ChemLab.data_(@uid,```@0```)

@ChemLab.data_
<div class="lia-chemlab-note" id="lia-chemlab-data-@0"></div>
<script modify="false">
(function wait(tries) {
  var el = document.getElementById("lia-chemlab-data-@0"), C = window.LiaChemLab;
  if (el && C && C.useData && C.loaded()) return C.useData(el, `@'1`);
  if (tries < 300) setTimeout(function () { wait(tries + 1); }, tries < 50 ? 100 : 500);
})(0);
""
</script>
@end

@ChemLab.pack: @ChemLab.pack_(@uid,@0)

@ChemLab.pack_
<div class="lia-chemlab-note" id="lia-chemlab-pack-@0"></div>
<script modify="false">
(function wait(tries) {
  var el = document.getElementById("lia-chemlab-pack-@0"), C = window.LiaChemLab;
  if (el && C && C.usePack && C.loaded()) return C.usePack(el, `@'1`);
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

> **Stand:** Meilenstein 6 von 7. Es gibt Reagenzglas, Becherglas, Abdampfschale, Bürette, Brenner, Wasserbad, Thermometer, pH-Meter, Leitfähigkeitsmessgerät, Fotometer, Kolbenprober, Gasableitungsrohr und Waage; Elektroden aus sechs Materialien, Netzgerät, Strom- und Spannungsmesser, Lämpchen und Salzbrücke; dazu Holzspan, Glimmspan und Magnesiastäbchen für die Nachweise, Säuren, Laugen, Kalkwasser, rund vierzig Lösungen, vier Indikatoren, Stärke, Iodlösung und zehn Feststoffe. Gerechnet werden Säure-Base-Gleichgewichte, Puffer, Fällungen, Komplexe, Gase über der Lösung, Sieden und Eindampfen, Verbrennungen, die Knallgasreaktion, Redoxreaktionen an Metallen und einige in Lösung (Redoxtitration), Elektrolyse und galvanische Zellen, Reaktionen mit Geschwindigkeitsgesetz und Katalysator und Gleichgewichte, die sich mit Konzentration, Säure und Temperatur verschieben. Eine Teilchenlupe zeigt, was in der Lösung vorliegt. Gleichgewichte rechnen ideal mit Konzentrationen oder, auf Wunsch, real mit Aktivitäten. Für den Unterricht gibt es Aufgaben mit Selbstkontrolle, unbekannte Proben mit zufälliger Füllung, Indikatorpapier für den Gasraum, gesperrte Aufbauten, eine Messwerttabelle und „Aufbau kopieren“; ein Labor mit Namen spricht mit dem Lehrtext seiner Folie (Stoffe zum Anklicken, Messwerte, Gleichungen und Diagramme im Text, eigene Skripte); Erweiterungspakete bringen weitere Stoffe, darunter ein Paket zur Organik mit Veresterung und Destillation (Rundkolben und Liebigkühler). Die Veröffentlichung folgt im letzten Meilenstein.

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

- Das **Reagenzglas antippen**: Darunter öffnet sich seine Karte. Unter **Zugeben** stehen die Stoffe aus dem Regal, unter **Geräte** Thermometer, Brenner, Proben und alles, was an diesem Gefäß wirkt, unter **Inhalt** die Teilchen, die Teilchenlupe, Umgießen, Ausleeren und Wegräumen.
- Das Magnesiumband wählen, die Menge einstellen und **zugeben**: Das Band fällt hinein, Gasblasen steigen auf, das Thermometer klettert.
- Der Stoff bleibt in der Hand, oben links über der Fläche. Noch einmal zugeben oder ein Gefäß antippen gibt noch einmal dieselbe Menge zu, gestrichelt umrandet sind die Gefäße, die ihn nehmen. Das Kreuz legt ihn zurück.
- Wer lieber vom Regal aus arbeitet, klappt es oben mit **Regal** auf: Die Fächer stehen als Reiter darüber, ein Fach als Zeile, die sich seitlich schieben lässt. Ein Stoff aus dem Regal kommt ebenso in die Hand.
- Die **Bedienleiste** unter der Fläche hält die Zeit an, spielt sie rückwärts ab oder springt an Anfang und Ende. Über dem Schieber stehen **Marken**: eine Raute für jeden Eingriff, ein Punkt für jede Beobachtung. Eine Marke antippen springt dorthin, gleich hinter das Ereignis.
- Darunter, in Reitern: die **Gleichungen** dessen, was gerade abläuft, die **Diagramme** und das **Protokoll** der Beobachtungen. Ton, „Aufbau kopieren“ und „Zurücksetzen“ stehen im Menü „⋯“ oben rechts.

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

Der Baustein braucht hier kräftigeren Überschuss als das Labor, im idealen wie im realen Modell: Mit Ammoniak von 1 mol/L bleibt ein Teil des Niederschlags liegen, mit 5 mol/L löst er sich ganz. Wie viel liegen bleibt, hängt an der Konstante für den vierten Ammoniak am Kupfer, und die ist unsicherer als die übrigen: Der Baustein rechnet mit der Stufenkonstante 10^2,13, gemessen in Ammoniumnitrat-Lösung. Der kritisch ausgewertete Wert für unendliche Verdünnung ist kleiner (10^1,48), Lehrbücher nennen für die Gesamtkonstante oft Werte um 10^13 aus konzentrierten Salzlösungen.

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

## Ammonium nachweisen

Feuchtes **Indikatorpapier** zeigt, was als Gas über einer Lösung steht. In beide Gläser Natronlauge geben und das Papier an die Öffnung halten, ohne die Lösung zu berühren. Über dem Ammoniumchlorid färbt es sich blauviolett: Die Lauge setzt Ammoniak frei, und Ammoniak macht den Wasserfilm des Papiers alkalisch. Über der Kochsalzlösung bleibt es grün. Sie ist die **Blindprobe**: Sie zeigt, dass die Natronlauge allein das Papier nicht färbt.

```json @ChemLab.sim
{"bench":[
  {"type":"testtube","id":"ammonium","contains":[{"reagent":"NH4Cl 1M","ml":5}]},
  {"type":"testtube","id":"blindprobe","contains":[{"reagent":"NaCl 1M","ml":5}]}
 ],
 "shelf":["NaOH 1M","paper","burner"],
 "show":{"charts":false}}
```

Über Salzsäure mit Marmor färbt sich das Papier rot: Kohlenstoffdioxid macht den Wasserfilm sauer.

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

## Kalkwasserprobe

Das **Gasableitungsrohr** steckt mit einem Stopfen im linken Reagenzglas und führt in das Kalkwasser im rechten. Marmor in die Salzsäure geben: Zuerst perlt die Luft aus dem Glas hindurch, dann das Kohlenstoffdioxid, und das Kalkwasser wird milchig trüb. Es fällt Calciumcarbonat aus. Mit noch mehr Gas löst sich ein Teil davon wieder, als Calciumhydrogencarbonat.

```json @ChemLab.sim
{"bench":[
  {"type":"testtube","id":"entwickler","contains":[{"reagent":"HCl 0.5M","ml":5}]},
  {"type":"tube","in":"entwickler","to":"kalkwasser"},
  {"type":"testtube","id":"kalkwasser","contains":[{"reagent":"limewater","ml":10}]}
 ],
 "shelf":["marble","Na2CO3 1M","limewater","tube","testtube"],
 "show":{"charts":false}}
```

Kohlenstoffdioxid ist schwerer als Luft und lässt sich in einem leeren Glas auffangen. Marmor in die Salzsäure geben und nach einer halben Minute den brennenden Span in das rechte Glas halten: Er erlischt. Ein Gas, das sich nicht in Wasser löst, wie Wasserstoff aus Zink und Salzsäure, perlt durch Wasser einfach hindurch und sammelt sich darüber.

```json @ChemLab.sim
{"bench":[
  {"type":"testtube","id":"entwickler","contains":[{"reagent":"HCl 1M","ml":8}]},
  {"type":"tube","in":"entwickler","to":"auffangglas"},
  {"type":"testtube","id":"auffangglas"}
 ],
 "shelf":["marble","Zn granules","H2O","splint","glowsplint","tube","testtube"],
 "show":{"charts":false}}
```

## Massenerhaltung

Beide Bechergläser stehen auf einer **Waage**. In beide Gläser je 0,3 g Marmor geben. Links entweicht das Kohlenstoffdioxid, und die Waage zeigt immer weniger an. Rechts fängt der Kolbenprober das Gas auf, und die Masse bleibt gleich. Bei der Reaktion geht keine Masse verloren; aus dem offenen Glas entweicht nur ein Teil der Stoffe. Mit mehr als etwa 0,4 g Marmor wird der Kolbenprober voll, und was darüber hinaus entsteht, entweicht auch rechts.

Die Waage antippen und „Tara“ wählen: Sie zeigt dann null und von da an nur, was hinzukommt oder fehlt. Das Diagramm zeigt, wie sich die Masse auf jeder Waage ändert.

```json @ChemLab.sim
{"bench":[
  {"type":"beaker","id":"offen","contains":[{"reagent":"HCl 1M","ml":20}]},
  {"type":"balance","under":"offen"},
  {"type":"beaker","id":"verschlossen","contains":[{"reagent":"HCl 1M","ml":20}]},
  {"type":"balance","under":"verschlossen"},
  {"type":"syringe","in":"verschlossen"}
 ],
 "shelf":["marble","marble powder","Na2CO3 1M","balance","syringe","beaker"],
 "show":{"charts":["m"]}}
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

## Ideale und reale Lösung

Der Baustein kennt zwei Rechenmodelle. In der Vorgabe rechnet er **ideal**, mit Konzentrationen: Salzsäure mit 0,1 mol/L hat dann den pH-Wert 1,00, und am Halbäquivalenzpunkt einer schwachen Säure gilt pH = pKs, wie es im Lehrbuch steht. Mit `"model": "real"` rechnet er mit **Aktivitäten**: Ionen schirmen einander ab und wirken deshalb schwächer, als ihre Konzentration erwarten lässt. Dann zeigt das pH-Meter, was man im Labor misst, bei derselben Salzsäure 1,08.

Beide Gläser enthalten dieselbe Mischung aus Natriumhydrogencarbonat und Natriumcarbonat, je 0,025 mol/L. Sie dient als Eichlösung für pH-Meter und hat bei 25 °C den pH-Wert 10,01. Das ideale Modell zeigt 10,32, das reale 10,01. Kochsalzlösung zugeben: Im idealen Modell ändert sich fast nichts. Im realen sinkt der pH-Wert auf etwa 9,8, obwohl Kochsalz weder Säure noch Base ist. Das Feld des Glases nennt dort auch die Ionenstärke, von der die Aktivitätskoeffizienten abhängen.

Ideal, mit Konzentrationen:

```json @ChemLab.sim
{"room":25,
 "bench":[
  {"type":"beaker","contains":[{"reagent":"NaHCO3 0.05M","ml":20},{"reagent":"Na2CO3 0.05M","ml":20}]},
  {"type":"phmeter","in":"beaker1"}
 ],
 "shelf":["NaCl 2M","HCl 0.1M","H2O"],
 "show":{"charts":["pH"]}}
```

Real, mit Aktivitäten:

```json @ChemLab.sim
{"room":25,
 "model":"real",
 "bench":[
  {"type":"beaker","contains":[{"reagent":"NaHCO3 0.05M","ml":20},{"reagent":"Na2CO3 0.05M","ml":20}]},
  {"type":"phmeter","in":"beaker1"}
 ],
 "shelf":["NaCl 2M","HCl 0.1M","H2O"],
 "show":{"charts":["pH"]}}
```

Das reale Modell passt, wenn Messwerte aus dem Labor verglichen werden: bei Puffern, bei der Löslichkeit in Salzlösungen, bei Zellspannungen. Es gilt bis zu einer Ionenstärke von etwa 1 mol/L; was darüber hinausgeht, steht unter „So rechnet der Baustein“.

## Aufgaben mit Selbstkontrolle

Zu einem Aufbau kann eine **Aufgabe** gehören. Sie steht über der Fläche, darunter ihre Ziele. Ein Ziel bekommt sein Häkchen, sobald es erfüllt ist; sind alle erfüllt, erscheint „Geschafft!“ und bleibt stehen. Wer zurückspult, sieht an den Häkchen, was zu diesem Zeitpunkt erfüllt war.

Ein Ziel kann eine **Beobachtung** sein: Hier soll ein Niederschlag ausfallen und sich danach wieder lösen.

```json @ChemLab.sim
{"task":{"text":"Fälle aus der Kochsalzlösung Silberchlorid aus und bringe den Niederschlag mit Ammoniaklösung wieder in Lösung.",
  "goals":[{"seen":"solid","species":"AgCl(s)"},
           {"seen":"dissolved","species":"AgCl(s)","label":"Der Niederschlag löst sich wieder"}]},
 "bench":[{"type":"testtube","contains":[{"reagent":"NaCl 0.1M","ml":2}]}],
 "shelf":["AgNO3 0.1M","NH3 2M","H2O"]}
```

Ein Ziel kann auch ein **Messwert** sein. Dieser Aufbau ist dazu **gesperrt**: Der Brenner lässt sich anzünden und abdrehen, wegräumen lässt sich nichts.

```json @ChemLab.sim
{"lock":true,
 "task":{"text":"Erwärme das Wasser auf 60 bis 70 °C und halte es dort.",
  "goals":[{"measure":"T","min":60,"max":70}]},
 "bench":[
  {"type":"beaker","id":"becher","contains":[{"reagent":"H2O","ml":50}]},
  {"type":"burner","under":"becher"},
  {"type":"thermometer","in":"becher"}
 ],
 "shelf":[]}
```

## Unbekannte Proben

In **Probe A** ist eine von drei Lösungen: Natriumchlorid, Kaliumbromid oder Kaliumiodid. Welche, wird beim Laden der Seite für jede und jeden neu gezogen. Was im Glas ist, zeigt weder das Feld des Gefäßes noch die Teilchenlupe, die Gleichungen oder das Protokoll; zu sehen sind nur die Beobachtungen. Im Feld der Probe steht „Das ist: …“: Die richtige Antwort erfüllt das Ziel der Aufgabe. Die Antwort gehört nicht zum Versuch: Sie hält die Uhr nicht an, und Zurückspulen nimmt sie nicht zurück.

Silbernitrat fällt Chlorid weiß, Bromid blassgelb und Iodid gelb. Daneben stehen die drei bekannten Lösungen zum Vergleich.

```json @ChemLab.sim
{"bench":[
  {"type":"testtube","id":"probe","unknown":"A","oneOf":[
    {"name":"Natriumchlorid","contains":[{"reagent":"NaCl 0.1M","ml":5}]},
    {"name":"Kaliumbromid","contains":[{"reagent":"KBr 0.1M","ml":5}]},
    {"name":"Kaliumiodid","contains":[{"reagent":"KI 0.1M","ml":5}]}]},
  {"type":"testtube","contains":[{"reagent":"NaCl 0.1M","ml":5}]},
  {"type":"testtube","contains":[{"reagent":"KBr 0.1M","ml":5}]},
  {"type":"testtube","contains":[{"reagent":"KI 0.1M","ml":5}]}
 ],
 "shelf":["AgNO3 0.1M","NaCl 0.1M","KBr 0.1M","KI 0.1M","testtube"],
 "task":{"text":"Bestimme, was in Probe A ist.","goals":[{"identify":"A"}]},
 "show":{"charts":false}}
```

Mit `"show":{"volumes":false}` stehen unter den Gefäßen keine Milliliter, und die Bürette nennt nicht, wie viel sie abgegeben hat: Dann wird an der Skala abgelesen.

## Sperren und Messwerttabelle

In einem **gesperrten** Aufbau bleiben die Geräte, wo sie stehen. Stoffe zugeben, umgießen, ausleeren, den Hahn der Bürette und die Regler bedienen und Proben mit Span und Stäbchen gehen weiter; das Regal bietet nur Stoffe und Proben an.

**Messwerttabelle:** „Messwerte notieren“ schreibt die Anzeigen aller Messgeräte als Zeile in eine Tabelle, dazu die Zeit und was jede Bürette abgegeben hat. So entsteht eine Titrationskurve von Hand: Hahn auf „langsam“, nach jeweils etwa 2 mL zudrehen und notieren. „Tabelle kopieren“ gibt die Werte mit Tabulatoren getrennt weiter, so dass sie sich in eine Tabellenkalkulation einfügen lassen. Die Tabelle bleibt beim Zurücksetzen stehen; „Tabelle leeren“ beginnt eine neue.

```json @ChemLab.sim
{"lock":true,
 "table":true,
 "bench":[
  {"type":"beaker","id":"becher","contains":[{"reagent":"CH3COOH 0.1M","ml":20}]},
  {"type":"burette","over":"becher","contains":[{"reagent":"NaOH 0.1M","ml":40}]},
  {"type":"phmeter","in":"becher"}
 ],
 "shelf":["PP"],
 "show":{"charts":["titration"]}}
```

## Aufbau als Text kopieren

„Aufbau kopieren“ schreibt den Aufbau als Text in die Zwischenablage, im selben Format wie die Beschreibung unter jeder Fläche; falls der Browser das nicht erlaubt, steht der Text zum Markieren unter der Fläche. In einen Kurs eingefügt, ergibt er denselben Tisch. So lässt sich ein Versuch durch Antippen aufbauen statt von Hand beschreiben.

Der Text nennt die Geräte, wie sie gerade stehen, und was in jedes Gefäß gegeben wurde. Beim Umgießen geht der entsprechende Anteil der Flüssigkeiten mit, Feststoffe bleiben zurück. Was aus einer Bürette getropft ist, steht weiter in der Bürette, und Reaktionen laufen nach dem Einfügen von vorn: Es ist der Aufbau, nicht der Zwischenstand eines Versuchs. Regal, Aufgabe, eigene Daten und alle anderen Angaben bleiben, wie sie in der Beschreibung standen.

```json @ChemLab.sim
{"bench":[
  {"type":"beaker","contains":[{"reagent":"H2O","ml":40}]}
 ],
 "shelf":["CuSO4 0.1M","NaOH 1M","Zn granules","testtube","thermometer","burner"]}
```

## Labor im Lehrtext

Im Becherglas liegen 20 mL Salzsäure mit ein paar Tropfen Bromthymolblau. Das pH-Meter zeigt @ChemLab.value(labor,phmeter1), die Lösung ist also <script>
const lab = @input(`labor`), ph = lab.values.phmeter1
ph < 6.5 ? "sauer" : ph > 7.5 ? "alkalisch" : "neutral"
</script>.

```json @ChemLab.lab(labor)
{"bench":[
  {"type":"beaker","id":"becher","contains":[{"reagent":"HCl 0.1M","ml":20},{"reagent":"BTB","drops":3}]},
  {"type":"phmeter","in":"becher"}
 ],
 "shelf":["NaOH 0.1M","HCl 0.1M","H2O"],
 "show":{"charts":["pH"]}}
```

Nimm die @ChemLab.take(labor,NaOH 0.1M,Natronlauge) in die Hand und tippe das Becherglas an, oder gib sie gleich zu: <script input="submit" default="5 mL Natronlauge zugeben" modify="false">
send.dispatch("ChemLab:labor", { add: "NaOH 0.1M", to: "becher", ml: 5 });
"5 mL Natronlauge zugeben"
</script>

Was dabei im Becherglas abläuft:

@ChemLab.show(labor,equations)

So ändert sich der pH-Wert. Nach 20 mL Natronlauge ist alle Säure verbraucht:

@ChemLab.show(labor,pH)

Im Becherglas sind jetzt <script>
const lab = @input(`labor`)
lab.vessels.becher.ml.toLocaleString("de-DE") + " mL"
</script>.

### So hängen Labor und Text zusammen

Ein Labor mit Namen spricht mit dem Text auf seiner Folie. Statt `@ChemLab.sim` steht dann `@ChemLab.lab(name)` am Block:

````
```json @ChemLab.lab(labor)
{ … }
```
````

| Im Text | Wirkung |
|---|---|
| `@ChemLab.value(labor,phmeter1)` | der Messwert eines Geräts im Satz, mit Einheit, laufend aktuell |
| `@ChemLab.show(labor,equations)` | die Gleichungen; ebenso `log` (Protokoll) und `table` (Messwerttabelle) |
| `@ChemLab.show(labor,pH)` | ein Diagramm, jede Art aus `show.charts`: `T`, `n`, `pH`, `titration`, `V`, `I`, `U`, `A`, `spectrum`, `IU`, `m`, `kappa` |
| `@ChemLab.take(labor,NaOH 0.1M,Natronlauge)` | ein Knopf im Text: legt den Stoff oder das Gerät in die Hand, wie ein Griff ins Regal |

Was im Text steht, fehlt unter dem Labor. Die Geräte heißen wie im Aufbau: mit `id` oder `thermometer1`, `phmeter1` … Stehen mehrere Labore auf einer Folie, braucht jedes einen eigenen Namen.

**Befehle aus eigenen Skripten.** Jedes Skript der Folie kann dem Labor mit `send.dispatch("ChemLab:labor", befehl)` etwas auftragen. Es wirkt wie die Bedienung, steht im Protokoll und lässt sich zurückspulen:

| Befehl | Wirkung |
|---|---|
| `{ take: "NaOH 0.1M" }` | in die Hand nehmen |
| `{ add: "NaOH 0.1M", to: "becher", ml: 5 }` | zugeben, mit `ml`, `drops` oder `g` |
| `{ set: "bath1", temp: 60 }` | einstellen: `temp` (Wasserbad), `volts` (Netzgerät), `nm` (Fotometer), `flame` (Brenner: 0, 1, 2) |

Ein Regler im Text, der das Wasserbad stellt. Er schickt beim Laden seinen Startwert; steht das Bad schon darauf, geschieht nichts:

``` html
<script input="range" min="0" max="95" value="20" aria-label="Wasserbad in °C" modify="false">
send.dispatch("ChemLab:labor", { set: "bath1", temp: @input });
"@input °C"
</script>
```

**Rechnen mit dem Zustand.** Das Labor gibt seinen Zustand unter seinem Namen aus. Ein Skript, das `` @input(`labor`) `` enthält, läuft bei jeder Änderung neu, auch beim Zurückspulen. Der Zustand ist ein Objekt mit vier geltenden Ziffern:

``` json
{"t": 12.5,
 "values": {"phmeter1": 7.02, "thermometer1": 21.3},
 "vessels": {"becher": {"ml": 45, "T": 21.3, "n": {"Na+(aq)": 0.005},
                        "equations": ["H+(aq) + OH-(aq) → H2O(l)"]}},
 "seen": ["added", "color"]}
```

`values` sind die Anzeigen der Geräte (beim Netzgerät die eingestellte Spannung), `n` die Stoffmengen in mol mit den Kennzeichen aus den Zielen einer Aufgabe, `seen` die Schlüssel der Einträge im Protokoll (Eingriffe wie `added` und Beobachtungen wie `gas` oder `color`). Das Objekt zuerst einer Variablen geben – am Anfang einer Zeile liest JavaScript `{` sonst als Block:

``` html
<script>
const lab = @input(`labor`)
lab.seen.includes("gas") ? "Es sprudelt." : "Noch kein Gas."
</script>
```

## Erweiterungspakete

Ein **Paket** ist eine JSON-Datei im selben Format wie das Feld `data` (siehe „Eigene Stoffe und Reaktionen“). Zum Baustein gehören das Paket `packs/organic.json` mit Ethanol, Eisessig, Ethylacetat und Wein, der Veresterung und den Angaben für die Destillation, und das Paket `packs/alkali.json` mit Lithium, Natrium und Kalium. Ein Paket kommt auf drei Wegen in einen Kurs:

- `@[ChemLab.pack](Adresse)` auf einer Folie lädt das Paket; von da an kennen es alle Flächen des Kurses. Flächen auf derselben Folie warten, bis es geladen ist, oder bauen sich dann neu auf. Antwortet der Server nicht, gilt es nach 30 Sekunden als gescheitert; wird die Folie wieder gezeigt, versucht der Baustein es erneut. Eine Adresse relativ zum Kurs geht, LiaScript macht sie vollständig.
- `"packs":["https://…/organic.json"]` in der Beschreibung einer Fläche lädt das Paket, bevor die Fläche aufgebaut wird. So geht es auch, wenn jemand den Kurs auf dieser Folie öffnet und die Folie mit `@[ChemLab.pack]` nie gesehen hat. Hier muss die Adresse vollständig sein.
- `@ChemLab.data` an einem JSON-Block trägt eigene Daten ein, wie ein Paket, nur ohne eigene Datei.

Diese Folie lädt das Paket des Bausteins:

@[ChemLab.pack](packs/organic.json)

Und so sieht ein Block mit eigenen Daten aus: Er trägt Methanol ein, ab jetzt für jede Fläche dieses Kurses.

```json @ChemLab.data
{"species":{
  "CH3OH(aq)":{"name":{"de":"Methanol","en":"methanol"},"Hf":null,"Vm":40.73,"Tb":64.7,"Hvap":37.34,
   "src":"PubChem, Hazardous Substances Data Bank: Dichte 0,7866 g/cm³ bei 25 °C, Siedepunkt 64,7 °C, Verdampfungsenthalpie 37,34 kJ/mol bei 25 °C"}},
 "reagents":{
  "methanol":{"name":{"de":"Methanol","en":"methanol"},"solution":{"CH3OH(aq)":24.5},"group":"other"}}}
```

## Alkalimetalle und Wasser

@[ChemLab.pack](packs/alkali.json)

Das Paket `packs/alkali.json` bringt Lithium, Natrium und Kalium. Je ein Stückchen in das Wasser mit Phenolphthalein geben: Alle drei schwimmen, denn sie sind leichter als Wasser. Lithium sprudelt ruhig etwa eine Minute lang und bleibt fest. Natrium schmilzt durch die Reaktionswärme zur glänzenden Kugel, flitzt auf dem Wasser umher und ist in gut zehn Sekunden verbraucht. Kalium wird so heiß, dass es glüht und der Wasserstoff sich entzündet: Er brennt mit violetter Flamme, der Farbe des Kaliums. Es entsteht Wasserstoff (Knallgasprobe), und die Lösung wird alkalisch und färbt sich rotviolett. Die Flammenfärbung mit dem Magnesiastäbchen zeigt danach, welches Metall es war: Lithium rot, Natrium gelb, Kalium violett.

```json @ChemLab.sim
{"bench":[
  {"type":"beaker","ml":250,"contains":[{"reagent":"H2O","ml":50},{"reagent":"PP","drops":3}]},
  {"type":"beaker","ml":250,"contains":[{"reagent":"H2O","ml":50},{"reagent":"PP","drops":3}]},
  {"type":"beaker","ml":250,"contains":[{"reagent":"H2O","ml":50},{"reagent":"PP","drops":3}]}
 ],
 "shelf":["Li piece","Na piece","K piece","splint","rod","burner"],
 "show":{"charts":["T"]}}
```

## Veresterung

@[ChemLab.pack](packs/organic.json)

Ethanol und Eisessig reagieren zu Ethylacetat und Wasser, einem Ester mit fruchtigem Geruch. Ohne Katalysator geht das sehr langsam. Ein paar Tropfen konzentrierte Schwefelsäure beschleunigen die Reaktion, Wärme noch mehr: Im Wasserbad von 70 °C riecht es nach Sekunden, ohne Wasserbad nach einigen Minuten, ganz ohne Säure in einer halben Stunde nicht. Die Reaktion ist ein Gleichgewicht: Aus gleichen Teilen Säure und Alkohol entstehen höchstens zwei Drittel Ester.

```json @ChemLab.sim
{"task":{"text":"Stelle den Ester her, bis es fruchtig riecht.",
  "goals":[{"seen":"smell","species":"CH3COOC2H5(aq)","label":"Es riecht fruchtig nach Ethylacetat"}]},
 "bench":[
  {"type":"testtube","id":"rg","contains":[{"reagent":"ethanol","ml":4},{"reagent":"glacial acetic acid","ml":4}]},
  {"type":"bath","under":"rg"},
  {"type":"thermometer","in":"rg"}
 ],
 "shelf":["sulfuric acid conc","H2O"],
 "room":20,
 "show":{"charts":["T","n"]}}
```

Schneller geht es beim Sieden. Damit dabei nichts verdampft, steckt im Kolben ein **Rückflusskühler**: Der Dampf wird darin wieder flüssig und läuft zurück. Das Gemisch siedet bei gut 80 °C, und nach etwa zehn Minuten sind gut sechzig Prozent des Ethanols verestert; mehr wird es nicht, denn dann ist das Gleichgewicht erreicht.

```json @ChemLab.sim
{"bench":[
  {"type":"flask","id":"kolben","contains":[{"reagent":"ethanol","ml":20},{"reagent":"glacial acetic acid","ml":20},{"reagent":"sulfuric acid conc","drops":10}]},
  {"type":"burner","under":"kolben"},
  {"type":"reflux","in":"kolben"},
  {"type":"thermometer","in":"kolben"}
 ],
 "shelf":["reflux","condenser","beaker"],
 "show":{"charts":["T","n"]}}
```

## Destillation

@[ChemLab.pack](packs/organic.json)

Wein im Rundkolben, darüber der Liebigkühler, der den Dampf in das Becherglas leitet. Den Brenner anzünden: Bei gut 90 °C beginnt der Wein zu sieden, unter dem Siedepunkt des Wassers, und aus dem Kühler tropft das Destillat. Der Dampf ist reicher an Alkohol als die Flüssigkeit, aus der er kommt: Das erste Destillat ist etwa zur Hälfte Alkohol. Im Kolben bleibt immer weniger davon, die Siedetemperatur steigt auf 100 °C, und zuletzt kommt fast nur noch Wasser. Wer die Vorlage zwischendurch tauscht, bekommt Destillate verschiedener Stärke. Den Kühler setzt man aus dem Regal: erst den Kolben antippen, dann die Vorlage.

```json @ChemLab.sim
{"table":true,
 "bench":[
  {"type":"flask","id":"kolben","contains":[{"reagent":"wine","ml":60}]},
  {"type":"burner","under":"kolben"},
  {"type":"thermometer","in":"kolben"},
  {"type":"condenser","in":"kolben","to":"vorlage"},
  {"type":"beaker","id":"vorlage","ml":50}
 ],
 "shelf":["beaker","condenser","wine"],
 "show":{"charts":["T","n"]}}
```

## 3D-Ansicht

Der Knopf **3D** neben „Ton“ zeigt die Arbeitsfläche räumlich; noch einmal antippen schaltet zurück. Der Versuch läuft dabei weiter. In 3D dreht Ziehen die Ansicht, das Mausrad oder zwei Finger zoomen, Antippen wirkt wie in 2D. Mit der Tab-Taste kommt man von Gerät zu Gerät, Enter tippt es an.

Die Szene bestimmt, wie Raum und Geräte aussehen; die Rechnung ist in jeder Szene dieselbe. Im **Labor um 1880** stehen Messingbrenner, Bechergläser ohne Skala, eine Bürette nach Mohr mit Quetschhahn, Messgeräte im Holzgehäuse mit Papierskala, eine Kupferwanne als Wasserbad und eine Kohlefadenlampe vor einer Ziegelwand:

```json @ChemLab.sim
{"bench":[
  {"type":"beaker","id":"glas","ml":250,"contains":[{"reagent":"H2O","ml":150}]},
  {"type":"thermometer","in":"glas"},
  {"type":"burner","under":"glas","flame":2}
 ],
 "view":"3d",
 "scene":"1880",
 "show":{"charts":["T"]}}
```

Titration um 1880: den Quetschhahn der Bürette öffnen, bis der Indikator umschlägt.

```json @ChemLab.sim
{"bench":[
  {"type":"beaker","id":"vorlage","ml":100,"contains":[{"reagent":"HCl 0.1M","ml":20},{"reagent":"PP","drops":3}]},
  {"type":"burette","over":"vorlage","contains":[{"reagent":"NaOH 0.1M","ml":50}]}
 ],
 "view":"3d",
 "scene":"1880",
 "show":{"charts":["titration"]}}
```

In der **Küche** wird auf dem Gaskartuschenkocher erhitzt, das Wasserbad ist ein Glastopf auf der Kochplatte, das Thermometer ein Einstechthermometer, das Becherglas ein Messbecher:

```json @ChemLab.sim
{"bench":[
  {"type":"beaker","id":"becher","ml":600,"contains":[{"reagent":"H2O","ml":400}]},
  {"type":"thermometer","in":"becher"},
  {"type":"burner","under":"becher","flame":2},
  {"type":"testtube","id":"glas","contains":[{"reagent":"H2O","ml":10}]},
  {"type":"bath","under":"glas","temp":60}
 ],
 "view":"3d",
 "scene":"kitchen",
 "show":{"charts":["T"]}}
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

## Sprachen

ChemLab spricht die Sprache des Kurses (`language:` im Kopf) und kennt alle Sprachen von [lia-localization](https://github.com/LiaScript/lia-localization). Englisch steht in `chemlab-parts.js` und `chemlab-data.js` und ist immer da. Alle anderen Sprachen, auch Deutsch, liegen als `lang/<code>.json` daneben. Geladen wird nur die Sprache, die gebraucht wird. Für eine Sprache ohne Tabelle zeigt ChemLab Englisch.

Schaltet jemand Google Translate ein, über das Menü von LiaScript oder im Browser, setzt der Übersetzer `<html lang>` auf die Zielsprache. ChemLab baut sich dann in dieser Sprache neu auf, mit den eigenen Fachbegriffen und dem passenden Dezimalzeichen. Der Versuch läuft dabei weiter. Für Google ist die Fläche gesperrt (`translate="no"`), nur die Texte des Autors (Aufgabe, eigene Ziele) übersetzt Google weiter mit. Nur wenn es keine Tabelle gibt, darf Google auch die englischen Texte übersetzen. Arabisch, Persisch und Urdu laufen von rechts nach links. Arbeitsfläche, Zeitleiste und Diagramme bleiben dabei, wie sie sind.

Eine Sprache ergänzen oder verbessern: `lang/<code>.json` hat zwei Teile. `strings` enthält dieselben Schlüssel wie die englische Tabelle in `chemlab-parts.js`, mit denselben Platzhaltern `{…}`. `names` enthält die Namen der Stoffe und Vorratsflaschen nach ihrer id. Ist ein neuer Code dabei, kommt er in die Liste `LANGS` in `chemlab-parts.js`. `node --test check.mjs` meldet, was in welcher Sprache fehlt. Die Übersetzungen außer Deutsch und Englisch sind maschinell erstellt und noch nicht von Fachleuten gegengelesen.

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
  - `unknown` – macht das Gefäß zu einer unbekannten Probe mit diesem Namen (bis zu 12 Zeichen, etwa `"A"`): Es heißt dann „Probe A“, trägt den Buchstaben als Nummer, und sein Inhalt bleibt verborgen; zu sehen sind nur Beobachtungen. Auch ein Gefäß, in das etwas aus der Probe gegossen, getropft oder geleitet wird, bleibt von da an verborgen.
  - `oneOf` – statt `contains`: mehrere mögliche Füllungen, je mit `name` und `contains`. Beim Laden der Seite wird eine davon gezogen; sie bleibt beim Zurücksetzen und Zurückspulen. „Aufbau kopieren“ schreibt alle Möglichkeiten, nicht die gezogene.
  - `in` – bei einem Messgerät oder Kolbenprober der Name des Gefäßes, in dem es steckt oder an das er angeschlossen ist.
  - `over` – bei einer Bürette der Name des Gefäßes, über dem sie hängt.
  - `under` – bei einem Brenner oder Wasserbad der Name des Gefäßes, unter dem es steht; ohne Angabe steht es für sich auf dem Tisch. Unter einem Gefäß steht entweder ein Brenner oder ein Wasserbad. `flame` – die Flamme des Brenners: 0 aus (Vorgabe), 1 leuchtend, 2 rauschend. `temp` – die Temperatur des Wasserbads in °C, 0 bis 95; ohne Angabe die des Raums.
  - `nm` – beim Fotometer die Wellenlänge in nm, 380 bis 730; Vorgabe 525.
  - `in` – bei einer Elektrode das Becherglas, in das sie taucht: die erste steht links, die zweite rechts, und dort bleibt jede, auch wenn die andere ersetzt wird. Bei Netzgerät, Strommesser, Spannungsmesser und Lämpchen das Becherglas, an dessen Elektroden sie angeschlossen sind; sie stehen daneben.
  - `volts`, `flip` – beim Netzgerät die Spannung in V (0 bis 12, Vorgabe 0 = aus) und ob es umgepolt ist. Ohne `flip` liegt der Pluspol an der linken Elektrode.
  - `to` – bei der Salzbrücke das zweite Gefäß; das erste steht in `in`. An jedem Gefäß hängt höchstens ein Ende einer Salzbrücke.
  - `g` – bei einer Elektrode ihre Masse in g, falls sie von der Vorgabe abweichen soll.

- `shelf` – was das Regal anbietet: Stoffe und Geräte; ohne Angabe alles, nach Fächern geordnet.
- `show` – was unter der Fläche erscheint. `numbers: false` blendet alle Zahlen aus; `equations`, `log` und `charts` schalten Gleichungen, Protokoll und Diagramme. `shelf: true` klappt die Regalleiste von Anfang an auf (sonst ist sie zu, außer auf einem Tisch ohne Gefäß). Diagramme: `"T"` Temperatur, `"n"` Stoffmengen, `"pH"` pH-Wert über der Zeit, `"titration"` pH-Wert, Leitfähigkeit oder Extinktion über dem Volumen aus der Bürette (je nachdem, welches Messgerät im Gefäß darunter steckt), `"V"` Gasvolumen im Kolbenprober, `"I"` Stromstärke, `"U"` Spannung, `"A"` Extinktion am Fotometer über der Zeit, `"spectrum"` Extinktion über der Wellenlänge, `"IU"` Stromstärke über der Spannung des Netzgeräts, `"m"` Massenänderung der Elektroden und auf den Waagen, `"kappa"` Leitfähigkeit; `false` für keines. Jedes Diagramm erscheint nur, wenn das Messgerät dazu angeschlossen ist. `"titration"` zeigt mit einem Leitfähigkeitsmessgerät unter der Bürette die Leitfähigkeit über dem Volumen.
  `particles: false` nimmt die Teilchenlupe aus dem Feld der Gefäße, für Kurse ohne Teilchenmodell. `volumes: false` blendet die Milliliter unter den Gefäßen und das Abgegebene der Bürette aus (auch in der Messwerttabelle).
- `task` – eine Aufgabe: `text` und eine Liste von Zielen (`goals`), siehe unten. Ein bloßer Text ist eine Aufgabe ohne Ziele.
- `lock` – `true`: Die Geräte bleiben, wo sie stehen; das Regal bietet nur Stoffe und Proben an.
- `table` – `true`: mit Messwerttabelle; nur, solange Zahlen gezeigt werden.
- `room` – die Raumtemperatur in °C, Vorgabe 20.
- `view` – womit die Fläche beginnt: `"2d"` (Vorgabe) oder `"3d"`. Der Knopf **3D** schaltet jederzeit um.
- `scene` – wie die Fläche in 3D aussieht: `"lab"` (Labor, Vorgabe), `"kitchen"` (Küche) oder `"1880"` (Labor um 1880). Ausführlich als Objekt: `{"base":"kitchen","gear":{"burner":"lab"},"quality":"low"}` – `gear` nimmt für einzelne Geräte das Aussehen einer anderen Szene, `quality` ist `"auto"` (Vorgabe), `"high"` oder `"low"` (ohne Schatten und Raumlicht-Bild, mit weniger Bildpunkten; „auto“ wählt das am Handy und auf schmalen Flächen). An der Rechnung ändert die Szene nichts.
- `model` – womit die Gleichgewichte rechnen: `"ideal"` mit Konzentrationen (Vorgabe) oder `"real"` mit Aktivitäten, siehe „Ideale und reale Lösung“.
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
| `balance` | Waage unter einem Gefäß: zeigt Glas und Inhalt auf 0,01 g; „Tara“ setzt die Anzeige auf null. Unter einem Gefäß steht entweder eine Waage, ein Brenner oder ein Wasserbad | `under` |
| `bath` | Wasserbad mit Thermostat, 0 °C (Eiswasser) bis 95 °C; das Gefäß darin nimmt seine Temperatur an | `under`, `temp` |
| `syringe` | Kolbenprober, 100 mL; verschließt das Gefäß und misst das Gasvolumen | `in` |
| `tube` | Gasableitungsrohr mit Stopfen: verschließt das Gefäß `in` und leitet das Gas, das dort entsteht, in das Gefäß `to`; dort perlt es durch die Flüssigkeit, oder es sammelt sich im leeren Gefäß. In einem Stopfen steckt entweder ein Rohr oder ein Kolbenprober | `in`, `to` |
| `photometer` | Fotometer mit Tauchsonde: Extinktion bei einer Wellenlänge über 1 cm, bis 3 | `in`, `nm` |
| `conductometer` | Leitfähigkeitsmessgerät, zeigt mS/cm oder µS/cm | `in` |
| `electrode-C`, `electrode-Pt` | Elektrode aus Graphit (5 g) oder Platin (10 g); sie lösen sich nicht auf. Elektroden stehen nur in Bechergläsern | `in`, `g` |
| `electrode-Cu`, `electrode-Zn`, `electrode-Fe`, `electrode-Ag` | Elektrode aus Kupfer, Zink, Eisen oder Silber, 10 g | `in`, `g` |
| `supply` | Netzgerät, 0 bis 12 V, begrenzt den Strom auf 3 A; bei 0 V ist es aus | `in`, `volts`, `flip` |
| `ammeter`, `voltmeter` | Strommesser (im Stromkreis), Spannungsmesser (zwischen den beiden Elektroden) | `in` |
| `lamp` | Glühlämpchen 3,8 V / 0,07 A, im Stromkreis | `in` |
| `bridge` | Salzbrücke mit Kaliumnitrat zwischen zwei Gefäßen | `in`, `to` |
| `flask` | Rundkolben, 100 mL, auf dem Korkring oder über Brenner und Wasserbad | `contains` |
| `condenser` | Liebigkühler: führt den Dampf aus dem Gefäß `in` in die Vorlage `to` und kühlt ihn auf Raumtemperatur | `in`, `to` |
| `reflux` | Rückflusskühler: steht aufrecht im Gefäß; was verdampft, läuft zurück | `in` |
| `splint`, `glowsplint`, `rod`, `paper` | brennender Holzspan, Glimmspan, Magnesiastäbchen, feuchtes Indikatorpapier: nur im Regal (`shelf`), sie werden an ein Gefäß gehalten | – |

**Ziele einer Aufgabe** – jedes mit wahlweise `in` (nur dieses Gefäß, mit seinem Namen) und `label` (eigener Text statt des erzeugten):

| Ziel | erfüllt, wenn | Beispiel |
|---|---|---|
| `measure` mit `min` und/oder `max` | ein Messgerät zeigt einen Wert in diesem Bereich: `T` (°C), `pH`, `kappa` (mS/cm), `A` (Extinktion), `V` (Gasvolumen im Kolbenprober, mL), `I` (Stromstärke, A), `U` (Spannung, V) oder `m` (Waage, g); Strom und Spannung als Betrag | `{"measure":"pH","min":6.5,"max":7.5,"in":"becher"}` |
| `has` mit `min` und/oder `max` in mol | von dem Stoff liegt so viel vor, gelöst, fest oder im Gasraum; ohne Angabe mindestens 1 µmol | `{"has":"Cu(s)"}`, `{"has":"Mg(s)","max":0}` |
| `identify` | die unbekannte Probe mit diesem Namen (`unknown`, mit `oneOf`) ist richtig benannt; im Feld der Probe wählt man „Das ist: …“, die letzte Wahl zählt | `{"identify":"A"}` |
| `seen` | die Beobachtung steht im Protokoll: `gas`, `pop` (Knallgasprobe), `relight` (Glimmspan flammt auf), `out` (Span erlischt), `paper` (Indikatorpapier an der Öffnung, mit `name` eine bestimmte Farbe), `solid` (Niederschlag), `dissolved` (ein Niederschlag verschwindet), `color` (Farbumschlag, mit `name` eine bestimmte Farbe: `yellow`, `orange`, `red`, `pink`, `violet`, `blue`, `cyan`, `green`, `brown`, `grey`, `black`, `colorless`), `boil`, `smell`, `ignite`, `flame` (Flammenfärbung), `plated` (Metall scheidet sich ab), `lamp`, `broken`; bei Stoffen wahlweise mit `species` | `{"seen":"solid","species":"AgCl(s)"}` |

Bei Lösungen steht die Konzentration im Namen: die Zahl vor `M` in mol/L, zum Beispiel `HCl 0.1M` oder `AgNO3 0.05M`. Ohne Zahl sind es 1 mol/L.

| `reagent` | Stoff | Menge |
|---|---|---|
| `H2O` | destilliertes Wasser | `ml` |
| `HCl`, `H2SO4`, `CH3COOH` | Salzsäure, Schwefelsäure, Essigsäure | `ml` |
| `NaOH`, `NH3` | Natronlauge, Ammoniaklösung | `ml` |
| `limewater` | Kalkwasser: Calciumhydroxid-Lösung mit 0,011 mol/L (ohne Konzentration im Namen) | `ml` |
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
| `name` | Name je Sprache, etwa `de` und `en`; mindestens einer |
| `Hf` | Standard-Bildungsenthalpie in kJ/mol; `null`, wenn unbekannt (dann rechnet der Stoff ohne Wärme) |
| `S` | Standard-Entropie in J/(mol K) |
| `Tm` | Schmelzpunkt eines Feststoffs in °C: Ist ein Stück aus dem Regal heißer, ist es geschmolzen |
| `cp`, `rho` | molare Wärmekapazität in J/(mol K) und Dichte in g/cm³; ohne Angabe übliche Näherungen |
| `color` | Farbe eines Feststoffs in der Schreibweise `"#b9bdc6"`; auch die Farbe seines Niederschlags |
| `settle` | Zeit in s, in der sich ein Niederschlag absetzt; Vorgabe 25 |
| `flame`, `shine` | Farbe, die das Teilchen einer Flamme gibt (`"#ffd21f"`), und wie stark es färbt; Vorgabe 1, Natrium 30 |
| `smell` | `true`: das Gas riecht stechend, das Protokoll meldet es. `"fruity"`: riecht fruchtig; bei einem flüchtigen gelösten Stoff zählt sein Dampfdruck über der Lösung |
| `colloid` | `true`: entsteht der Feststoff in einer Lösung, bleibt er fein verteilt in der Schwebe und setzt sich nicht ab (Schwefel aus Thiosulfat) |
| `D` | Diffusionskoeffizient eines gelösten Teilchens in 10⁻⁹ m²/s; aus ihm folgen die Leitfähigkeit und wie schnell das Teilchen an eine Oberfläche nachkommt. Ohne Angabe gilt 1 |
| `Vm` | Eigenvolumen eines gelösten Stoffs in mL/mol (molare Masse durch Dichte). Er zählt dann zum Volumen, und eine Vorratslösung enthält nur so viel Wasser, wie daneben Platz hat: reines Ethanol fast keines, Wein 88 %. Ohne Angabe ist ein gelöster Stoff verdünnt und nimmt keinen Platz ein |
| `Tb`, `Hvap` | Siedepunkt in °C und Verdampfungsenthalpie in kJ/mol eines flüchtigen gelösten Stoffs. Mit ihnen siedet eine Mischung nach dem Raoultschen Gesetz, und der Dampf ist reicher am Flüchtigeren |
| `mix` | Für einen flüchtigen Stoff: die Konstanten der Van-Laar-Gleichung mit Wasser, `[A Stoff, A Wasser]`, für Mischungen, die sich nicht ideal verhalten (Ethanol: `[1.6798, 0.9227]`) |
| `gamma` | Für das reale Modell: `[å, b]`, die Ionengröße in Å und das Zusatzglied der Gleichung von Truesdell und Jones für den Aktivitätskoeffizienten eines gelösten Teilchens (in den Dateien von PHREEQC die Zeile `-gamma`); å von 0 bis 20, b zwischen −1 und 1. Bei einem ungeladenen Teilchen zählt nur b: lg γ = b · I. Ohne Angabe rechnet ein Ion nach Davies, ein ungeladenes Teilchen mit lg γ = 0,1 · I |
| `at` | bei einem gelösten Teilchen mit `color` statt `bands`: die Konzentration in mol/L, bei der die Lösung diese Farbe hat |
| `symbol` | Kurzzeichen für große Moleküle, zum Beispiel `"HInd"` für einen Indikator; ersetzt die Formel in der Anzeige |
| `bands` | Farbe eines gelösten Teilchens als Absorptionsbanden: je Bande Wellenlänge des Maximums in nm, Halbwertsbreite in nm, molarer Absorptionskoeffizient in L/(mol cm) |
| `src` | Quelle der Werte – Pflicht im Grundpaket |

**Gleichgewichte** (`equilibria`) in der Lösung stellen sich sofort ein: `{"eq":"H2O(l) <=> H+(aq) + OH-(aq)","logK":-14}`. `logK` gilt bei 25 °C; wie sich das Gleichgewicht mit der Temperatur verschiebt, folgt aus der Reaktionsenthalpie. Sie wird aus den Bildungsenthalpien berechnet; fehlt eine davon, gilt die Angabe `dH` in kJ/mol am Eintrag, und ohne beides rechnet der Vorgang ohne Wärme. Mit `"model":"real"` gilt ein Gleichgewicht in der Lösung nur im realen Modell (bei Feststoffen und Gasen ist die Angabe ein Fehler); so sind die schwachen Ionenpaare eingetragen, etwa `{"eq":"Na+(aq) + SO4^2-(aq) <=> NaSO4-(aq)","logK":0.94,"model":"real"}`.

Steht in der Gleichung ein Feststoff, ist es ein **Löslichkeitsgleichgewicht**: `{"eq":"AgCl(s) <=> Ag+(aq) + Cl-(aq)","logK":-9.75}`. Mehr braucht es für eine Fällung nicht. Der Feststoff fällt aus, sobald die Lösung übersättigt ist, und löst sich, wenn etwas anderes seine Ionen bindet. Mit `rate` (`k` in mol/(s cm²) je (mol/L) hoch Ordnung, `Ea`, `order`) folgt die Auflösung eines Stücks aus dem Regal einem Geschwindigkeitsgesetz: Wohin es geht, sagt weiter das Gleichgewicht, wie schnell, die Oberfläche und die Lösung. So ist Marmor eingetragen, mit `"order":{"H+(aq)":1}`.

Steht in der Gleichung ein Gas, ist es die **Löslichkeit eines Gases**: `{"eq":"CO2(g) <=> CO2(aq)","logK":-1.468}`; `logK` ist die gelöste Konzentration in mol/L bei 1 bar. Ist mehr gelöst, perlt das Gas aus; beim Sieden geht es mit dem Dampf fort, beim Eindampfen entweicht es ganz.

**Redoxpaare** (`couples`): die oxidierte Form mit ihren Elektronen und die reduzierte Form, dazu das Standardpotential `E0` in V: `{"eq":"Cu^2+(aq) + 2 e- <=> Cu(s)","E0":0.3386}`. Ein Metall kann mehrere Paare haben, wenn es auf verschiedenen Wegen in dieselbe Oxidationsstufe übergeht: Zink zu Zink-Ionen oder in Lauge zu Zinkat, Silber zu Silber-Ionen oder mit Chlorid zu Silberchlorid, das dann als Belag auf der Elektrode sitzt. Solche Paare gelten als ein System; ihre Potentiale müssen zueinander passen (umgerechnet mit der Konstante des Komplexes oder dem Löslichkeitsprodukt). Aus den Redoxpaaren leitet der Baustein her, was an einem Metallstück und an einer Elektrode geschieht: welches Metall welches verdrängt, was sich bei der Elektrolyse abscheidet, welche Spannung eine Zelle liefert. `over` ist die Überspannung in V bei 1 mA/cm², mit der der Vorgang an einer Oberfläche in Gang kommt: eine Zahl für jede Oberfläche oder je Material, zum Beispiel `{"default":0.6,"Pt(s)":0.09,"Zn(s)":0.36}` für Wasserstoff. Ohne `over` läuft der Vorgang ungehemmt. Eine eingetragene Reaktion (`reactions`) mit derselben Gleichung geht der hergeleiteten vor.

Eine eigene Elektrode ist ein Gerät mit dem Material als Angabe: `LiaChemLab.registerPart("electrode-Sn", Object.assign({ kind: "tool", electrode: "Sn(s)", g: 10, unit: "g", lag: 0 }, LiaChemLab.electrodeLook))`. Sie heißt nach ihrem Stoff („Zinn-Elektrode“); ein eigener Name steht in `name` mit `de` und `en`. Im Regal erscheint sie nur dort, wo ihr Stoff eingetragen ist.

**Reaktionen** (`reactions`) laufen mit Geschwindigkeit ab. `rate.k` ist die Geschwindigkeitskonstante bei 25 °C, `rate.Ea` die Aktivierungsenergie in kJ/mol, `rate.order` die Ordnung je gelöstem Teilchen; auch Wasser darf dort stehen, mit seiner Konzentration in mol/L. Ein Gleichgewicht, das sich mit Geschwindigkeit einstellt, sind zwei Reaktionen, hin und zurück, wie die Veresterung im Paket `packs/organic.json`. Mit `rate.surface` wächst die Geschwindigkeit mit der Oberfläche eines Feststoffs; `k` hat dann die Einheit mol/(s cm²) je (mol/L) hoch Ordnung.

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

**Vorratsflaschen** (`reagents`): eine Lösung (`solution`: Teilchen und ihre Konzentration in mol/L; mit `"molar":true` gilt der Eintrag für 1 mol/L und die Konzentration steht im Namen), eine reine Flüssigkeit (`liquid`) oder ein Feststoff (`solid` mit `area`, der Oberfläche in cm² je Gramm). `"drops":true` gibt den Stoff tropfenweise zu; `group` nennt das Fach im Regal (`acid`, `salt`, `other`, `indicator`, `solid`). Für Feststoffe außerdem: `shape` (0 für ein Band, dessen Oberfläche beim Auflösen gleich bleibt; Vorgabe sind Körner), `tau` (Zeit in s, in der sich ein Stück löst, wenn ein Löslichkeitsgleichgewicht es verlangt und dieses kein eigenes Geschwindigkeitsgesetz hat; Vorgabe 15), `form: "powder"` (als Pulver gezeichnet) und `piece` (Menge je Stück mit Namen der Einheit, wie beim Magnesiumband in cm). `start` ist die Menge, die beim Greifen eingestellt ist, in der Einheit des Stoffs, etwa `"start": 1` für ein einzelnes Stück. Sie muss eine der Stufen sein (mL: 1, 2, 5, 10, 20, 50, 100; Tropfen: 1, 2, 3, 5, 10; g: 0,1, 0,2, 0,5, 1, 2, 5; Stück: 1, 2, 5, 10, 20), sonst gilt die dritte.

Jede Gleichung wird beim Laden geprüft. Geht die Bilanz der Atome oder der Ladung nicht auf, erscheint statt der Fläche ein Hinweis, der sagt, was fehlt.

**Stoffe aus offenen Datenbanken:** `node tools/import.mjs <Name oder CAS-Nummer>` füllt einen Eintrag vor. Das Werkzeug fragt PubChem nach Formel und molarer Masse und nimmt aus der dortigen Hazardous Substances Data Bank (gemeinfrei) Siedepunkt, Schmelzpunkt, Dichte und Verdampfungsenthalpie; die Namen kommen aus Wikidata (CC0). Mit `--phreeqc datei.dat …` listet es außerdem die Zeilen dieser PHREEQC-Dateien, die den Stoff nennen, mit `log_k` und `delta_h`. Heraus kommt ein Eintrag im Format der Pakete, mit Quellen, und eine Liste dessen, was noch fehlt: Die Bildungsenthalpie, das Kennzeichen des Stoffs (aus der Summenformel, etwa `C2H6O(aq)`) und die Gleichgewichte prüft und trägt man von Hand ein.

Was es schon gibt, lässt sich über `data` nicht ändern: Ein Eintrag für einen vorhandenen Stoff, eine vorhandene Reaktion oder Vorratsflasche wird nur angenommen, wenn er dem vorhandenen gleicht. So verändert der Aufbau einer Folie nie die Stoffe, mit denen eine andere gerade rechnet. Was aus der Formel folgt – molare Masse, Ladung, Zustand – lässt sich gar nicht überschreiben.

## Eigene Szenen in 3D

Szenen und das Aussehen der Geräte in 3D lassen sich nachtragen, wie Stoffe. Sie stehen in einem eigenen Skript des Kurses:

```
<!--
import: <Pfad>/README.md
script: ./werkstatt.js
-->
```

LiaScript führt dieses Skript aus, bevor der Baustein geladen ist. Darum stellt es sich an; seine Funktion läuft, sobald der Baustein da ist. Das gilt auch für eigene Geräte mit `registerPart`:

```js
(window.LiaChemLabReady = window.LiaChemLabReady || []).push(function (LiaChemLab) {
  LiaChemLab.registerScene("werkstatt", { … });
  LiaChemLab.registerLook("beaker", "werkstatt", { … });
});
```

In diese Funktion gehören die folgenden Beispiele.

Eine **Szene** hat einen Namen, einen Stil für die Geräte und baut den Raum. `LiaChemLab.fx3d.room` legt Wand, Tischplatte, Unterschrank, Boden und Licht an; Farben stehen als Zahl (`0x9aa3ab`), Bilder als `{ map, normal, repeat, rough }` mit einer Adresse. `build` läuft erst, wenn jemand auf 3D schaltet; dann sind Three.js (`kit.THREE`) und die Helfer in `LiaChemLab.fx3d` da.

```js
LiaChemLab.registerScene("werkstatt", {
  style: { metal: "brass", wood: 0x6a4a2a, device: 0x3a3f45, marks: 0xffd040 },
  gear: { burner: "1880" },           // der Brenner sieht aus wie um 1880
  build: function (kit) {
    LiaChemLab.fx3d.room(kit, {
      top: { map: "https://example.org/werkbank.jpg", repeat: [9, 0.75] },
      cabinet: 0x555a60, wall: 0x9aa3ab, floor: 0x5a5f66,
      light: 0xffffff, lightPower: 2, exposure: 0.9
    });
    var THREE = kit.THREE, box = new THREE.Mesh(new THREE.BoxGeometry(30, 12, 18), LiaChemLab.fx3d.matte(0xb03020, 0.5));
    box.position.set(-45, 6, -30);                // Werkzeugkiste hinten links
    kit.root.add(box);
  }
});
```

Im Aufbau gilt sie dann mit `"scene":"werkstatt"`. Maße sind in cm; die Tischplatte liegt bei y = 0, die Geräte stehen nebeneinander bei z = 0, vorne ist +z. Ein Bild darf auch ein Raumlicht sein: `kit.environment("https://…/raum.hdr")` (ein HDR-Bild, etwa von Poly Haven).

| Stil | Bedeutung | Vorgabe |
|---|---|---|
| `glass`, `glassOpacity` | Farbe und Deckkraft des Glases | weiß, 0,2 |
| `metal` | `"steel"` oder `"brass"`: Stative, Brenner, Klemmen | `"steel"` |
| `wood` | Ständer und Halter | hellbraun |
| `device` | Gehäuse der Messgeräte | hellgrau |
| `display` | `"lcd"` oder `"paper"` (Zeigerskala) | `"lcd"` |
| `marks` | Farbe der Skala auf Gläsern; `null` ohne Skala | weiß |
| `hose` | Gasschlauch | rot |
| `tank` | Wasserbad: `"glass"` oder `"copper"` | `"glass"` |

Mit `gear` übernimmt die Szene für einzelne Geräte das Aussehen einer anderen Szene. Was sie nicht nennt, sieht aus wie im Labor, in ihrem Stil.

Ein **Look** ist das Aussehen eines Geräts in einer Szene: `build(kit, d)` gibt ein Three.js-Objekt zurück, `update(obj, d, kit)` passt es bei jedem Bild an. Am einfachsten nimmt man den Look des Labors und ändert etwas daran, hier ein Becherglas mit einem Etikett:

```js
LiaChemLab.registerLook("beaker", "werkstatt", {
  build: function (kit, d) {
    var obj = LiaChemLab.looks3d.beaker.lab.build(kit, d), THREE = kit.THREE;
    var etikett = new THREE.Mesh(new THREE.PlaneGeometry(2, 1.2), LiaChemLab.fx3d.matte(0xf4ecd0));
    obj.add(etikett);
    obj.userData.etikett = etikett;       // eigener Name: tag, shape, body … nutzt der Look des Labors
    return obj;
  },
  update: function (obj, d, kit) {
    LiaChemLab.looks3d.beaker.lab.update(obj, d, kit);
    var shape = obj.userData.shape;               // Form des Glases: floor, rim, inner(y) in cm
    obj.userData.etikett.position.set(0, shape.rim * 0.4, shape.inner(shape.rim * 0.4) + 0.05);
  }
});
```

`d` ist der Datensatz des Geräts, derselbe wie in 2D: `d.data` die Füllung (`ml`, `color`, `cloud`, `steam`, …) oder der Messwert, `d.label` der Text für Vorleser, `d.place` wo ein Messgerät steckt, `d.ctx.t` die Zeit des Versuchs und `d.ctx.still` bei „weniger Bewegung“ (dann nichts bewegen). Was Auswahlrahmen und Tastatur umfassen, steht in `obj.userData.body`; Anschlüsse für Leitungen in `obj.userData.terminals`. Ein Gerät ohne Look erscheint als Kasten mit seinem Namen. Eine eigene Elektrode (`registerPart`) sieht aus wie die anderen. Wie die Szenen des Bausteins gebaut sind, zeigen `3d/scenes.js`, `3d/looks-kitchen.js` und `3d/looks-1880.js`.

## So rechnet der Baustein

- **Stoffmengen:** Jedes Gefäß kennt die Stoffmenge jeder Teilchenart. Reaktionen setzen sie nach ihrer Gleichung um; Masse und Ladung bleiben dabei erhalten.
- **Gleichgewichte in der Lösung** (Säuren, Basen, Indikatoren, Komplexe) stellen sich nach jedem Schritt ein. Gerechnet wird mit dem Newton-Verfahren über die Stoffbilanzen. Der pH-Wert ist der negative Logarithmus der Konzentration der Wasserstoff-Ionen, im realen Modell ihrer Aktivität.
- **Reales Modell:** Mit `"model": "real"` gilt das Massenwirkungsgesetz für Aktivitäten, also Konzentration mal Aktivitätskoeffizient γ. Die Koeffizienten hängen nur von der Ionenstärke I ab (der halben Summe aus Konzentration mal Ladung im Quadrat) und von der Temperatur. Gerechnet wird nach Truesdell und Jones, lg γ = −A z² √I / (1 + B å √I) + b I, mit Ionengröße å und Zusatzglied b aus der Datenbank phreeqc.dat; ein Ion ohne diese Angaben rechnet nach Davies (bis 0,5 mol/L Ionenstärke, darüber bleibt sein Koeffizient stehen), ein ungeladenes Teilchen mit lg γ = 0,1 · I. Über 6 mol/L Ionenstärke bleiben alle Koeffizienten stehen, und für die Temperatur gilt der Bereich von 0 bis 100 °C. Bei gegebener Ionenstärke sind die Koeffizienten feste Zahlen, die sich in die Konstanten ziehen lassen; der Löser sucht dann die Ionenstärke, die zu ihrem eigenen Ergebnis passt, und schachtelt sie dazu ein. Auch gelöste Gase, die Potentiale an Elektroden und das Gleichgewicht der sofortigen Reaktionen (`logK`) folgen den Aktivitäten, die Geschwindigkeitsgesetze nicht: Sie rechnen in beiden Modellen mit Konzentrationen. Die schwachen Ionenpaare der Alkali- und Erdalkalimetalle (Natrium-, Kalium-, Calcium- und Magnesiumsulfat, die Hydroxo-Ionen von Calcium und Magnesium, die Carbonat- und Hydrogencarbonat-Paare von Calcium, Magnesium, Strontium und Barium) gibt es nur im realen Modell: Zu dessen Parametern gehören sie, und ohne Aktivitätskoeffizienten wären sie weit überschätzt. Im idealen Modell zerfallen diese Salze vollständig. Ebenfalls nur im realen Modell bildet Silber mit Chlorid die Komplexe AgCl(aq), AgCl₂⁻ und AgCl₃²⁻; mit ihnen löst sich Silberchlorid in starker Salzsäure merklich, während es im idealen Modell mit jedem Chlorid-Überschuss schwerer löslich wird. Die Sulfat-Ionenpaare von Kupfer, Zink und Eisen(II) rechnen dagegen in beiden Modellen mit; im idealen sind sie überschätzt (siehe Grenzen). Von den Tabellenwerten bei 25 °C weichen die mittleren Aktivitätskoeffizienten von 19 Salzen, Säuren und Laugen bis 0,1 mol/L im Mittel um 2 % ab, bei 0,5 mol/L um 8 % und bei 1 mol/L um 15 %; im idealen Modell sind es 38, 79 und 90 %. Die pH-Werte von Salzsäure, Natronlauge, Acetatpuffer und der Carbonat-Eichlösung trifft das reale Modell auf 0,01.
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
- **Sieden von Gemischen:** Gelöste Stoffe mit Siedepunkt (`Tb`) sind flüchtig. Die Siedetemperatur einer Mischung ist die Temperatur, bei der die Dampfdrücke von Wasser und den flüchtigen Stoffen zusammen den Luftdruck erreichen: jeder nach dem Raoultschen Gesetz mit seinem Stoffmengenanteil und seinem Dampfdruck nach Clausius-Clapeyron, für Ethanol und Wasser mit Aktivitätskoeffizienten nach Van Laar. Der Dampf hat die Zusammensetzung, die zu diesen Dampfdrücken gehört, und ist deshalb reicher am leichter Flüchtigen. Ein Liebigkühler leitet ihn in die Vorlage, wo er bei Raumtemperatur wieder flüssig wird; ohne Kühler entweicht er. Ein flüchtiger Stoff mit Geruch riecht, sobald sein Dampfdruck über der Lösung 5 mbar erreicht.
- **Gase über der Lösung:** Kohlenstoffdioxid, Ammoniak und Chlorwasserstoff stehen mit ihrer Lösung im Gleichgewicht. Ist mehr gelöst, als sich bei Luftdruck halten kann, perlt der Überschuss in ein bis zwei Sekunden aus. Deshalb sprudelt Soda mit Salzsäure von 1 mol/L, mit stark verdünnter aber nicht. Beim Sieden nimmt der Dampf gelöste Gase mit. Ein stechender Geruch wird gemeldet, sobald der Druck eines solchen Gases 5 mbar erreicht.
- **Gasraum:** Entstandenes Gas steht zuerst über der Flüssigkeit. Was dort keinen Platz hat, wird verdrängt; aus dem offenen Gefäß verfliegt der Rest: Wasserstoff in etwa 8 s, Sauerstoff in 40 s, Kohlenstoffdioxid in 90 s. Im Diagramm der Stoffmengen zählt das entwichene Gas weiter mit.
- **Indikatorpapier:** Sein Wasserfilm steht mit jedem Gas im Gleichgewicht, das ein Lösungsgleichgewicht hat (Ammoniak, Chlorwasserstoff, Kohlenstoffdioxid, Schwefeldioxid): mit dem Teildruck im Gasraum oder, wenn er höher ist, mit dem Druck, den das Gas über der Lösung hätte. Unter 10 ppm (1·10⁻⁵ bar) erreicht ein Gas das Papier nicht merklich; so färbt verdünnte Salzsäure es nicht, konzentrierte schon, und über Ammoniumchlorid ohne Lauge bleibt es grün. Gerechnet wird wie in 10 mL Wasser mit drei Tropfen Universalindikator bei Raumtemperatur; von dort kommen pH-Wert und Farbe. Die Nachweisgrenze ist geschätzt.
- **Alkalimetalle** (Paket): Sie reagieren mit Wasser nach einem Geschwindigkeitsgesetz mit ihrer Oberfläche, wie Magnesium in Säure. Die Konstanten sind geschätzt, nach der Zeit, in der ein Stückchen im Schulversuch verbraucht ist; die Wärme folgt aus den Bildungsenthalpien.
- **Heiße Stellen:** Jedes Stück aus dem Regal hat seine eigene Temperatur. Die Reaktionen an seiner Oberfläche heizen es; es gibt die Wärme an das Wasser ab (0,35 W/(cm² K)) oder, trocken, an die Luft (0,002 W/(cm² K)) und durch Strahlung (Emissionsgrad 0,8). Beide Übergangszahlen sind geschätzt; die im Wasser ist so gewählt, dass Lithium (132 °C) fest bleibt, Natrium (gut 350 °C) schmilzt und Kalium (gut 600 °C) den Wasserstoff zündet. Ein Stück mit Schmelzpunkt (`Tm`) darunter ist geschmolzen; eines, das leichter ist als Wasser (`rho`), schwimmt. Ab 525 °C glüht es in der Farbe, die das Plancksche Strahlungsgesetz für seine Temperatur ergibt. Ab 560 °C, der Zündtemperatur von Wasserstoff in Luft, verbrennt der Wasserstoff, den ein schwimmendes Stück freisetzt, mit Sauerstoff aus der Luft, in der Flammenfarbe des Metall-Ions. Geschmolzenes Metall, das mehr als 30 W/cm² freisetzt, spritzt. Die Wärme selbst bleibt beim Gefäß, wie bisher.
- **Span und Glimmspan** prüfen den Gasraum. Zwischen 4 und 75 Volumenprozent Wasserstoff verpufft das Gemisch, sofern genug Luft dabei ist; aus der freigesetzten Energie folgt, ob es „plopp“ macht, pfeifend knallt oder laut. Über 800 J zerspringt das Gefäß. Fast reiner Wasserstoff brennt ruhig an der Öffnung ab. Eine Brennerflamme unter dem Gefäß zündet ein solches Gemisch ebenfalls: einmal mit einer Verpuffung, danach brennt an der Öffnung ab, was nachkommt. Über 30 % Sauerstoff flammt der Glimmspan auf, unter 15 % erlischt der brennende Span. An ein Gefäß mit Stopfen lässt sich kein Span halten.
- **Kolbenprober:** Er verschließt das Gefäß und zählt alles Gas, das entsteht, als Volumen bei Raumtemperatur und Luftdruck, bis 100 mL. Wird das Gefäß ausgeleert, zählt er von vorn.
- **Waage:** Sie zeigt die Masse des Glases und von allem, was darin ist: gelöst, fest und im Gasraum darüber. Das Glas wiegt so viel, wie seine Wärmekapazität bei 0,84 J/(g K) ergibt: ein Reagenzglas 20,2 g, ein Becherglas mit 100 mL 35,7 g. Was aus dem offenen Gefäß entweicht, fehlt; ein Kolbenprober hält es im System, bis er voll ist. Die Anzeige folgt mit einer halben Sekunde Verzögerung. „Tara“ zieht ab, was in diesem Augenblick darauf steht.
- **Gasableitungsrohr:** Es verschließt das Gefäß wie der Kolbenprober. So viel Gas, wie dort entsteht, schiebt es aus dem Gasraum in das zweite Gefäß, im Verhältnis seiner Zusammensetzung: zuerst vor allem Luft, die nicht gerechnet wird, dann zunehmend das Gas selbst. Steht im zweiten Gefäß Flüssigkeit, perlt das Gas hindurch. Ein Gas mit Lösungsgleichgewicht (Kohlenstoffdioxid, Ammoniak, Chlorwasserstoff, Schwefeldioxid) geht in Lösung und reagiert dort; was über die Sättigung bei Luftdruck hinausgeht, perlt wieder aus. Andere Gase steigen durch und stehen im Gasraum darüber. Ein leeres Gefäß fängt das Gas auf. Dampf aus einem siedenden Gefäß schlägt sich im zweiten nieder wie in der Vorlage eines Kühlers. Fehlt das zweite Gefäß, geht das Gas ins Freie.
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
- In der Vorgabe rechnen Lösungen ideal, mit Konzentrationen statt Aktivitäten. Schon ab etwa 0,01 mol/L weichen pH-Werte von Puffern und Löslichkeiten dann von Messwerten ab, und Niederschläge lösen sich in Komplexbildnern etwas schwerer als im Labor.
- Das reale Modell gilt bis zu einer Ionenstärke von etwa 1 mol/L. Darüber trifft es Kochsalz noch gut (bis 5 mol/L auf 4 %), konzentrierte Säuren aber nicht: Für Salzsäure mit 6 mol/L ist der Koeffizient um 80 % zu klein. Ein Modell, das auch dort stimmt (Pitzer), braucht Wechselwirkungsparameter für jedes Ionenpaar, und die gibt es in den verwendeten Quellen nur für etwa die Hälfte der Ionen dieses Bausteins.
- Mit seinen Ionenpaaren trifft das reale Modell den mittleren Aktivitätskoeffizienten von Natriumsulfat bis 0,5 mol/L auf 7 %; bei 1 mol/L ist er um ein Viertel zu groß. Gips und Calciumhydroxid lösen sich auf 3 % wie gemessen (im idealen Modell 67 und 42 % zu wenig), Silbersulfat um 9 % zu wenig.
- Silberchlorid löst sich im realen Modell in Chlorid-Lösung von 1 mol/L mit 0,06 mmol/L (im Labor sind es etwa 0,1 mmol/L), in konzentrierter Salzsäure mit 5 mmol/L (im Labor etwa 30 mmol/L). Dort fehlt der vierte Chlorokomplex AgCl₄³⁻: Für das dreifach geladene Ion nennen die Datenbanken keine Parameter des Aktivitätskoeffizienten, und mit der Ersatzformel gerechnet wäre die Löslichkeit drei- bis zehnmal zu groß.
- Einige Ionenpaare der Datenbanken sind mit Absicht nicht eingetragen, weil das Modell mit ihnen schlechter zu den Messwerten passt: die Chlorokomplexe des Kupfers(II) (der mittlere Aktivitätskoeffizient von Kupferchlorid bei 1 mol/L läge um 38 % statt um 10 % unter dem Tabellenwert) und die Hydrogencarbonat-Paare von Natrium und Kalium (der pH-Wert der Carbonat-Eichlösung läge um 0,01 daneben). Dass konzentrierte Kupferchlorid-Lösung grün wird, zeigt der Baustein deshalb nicht. Auch die Carbonat-Komplexe des Kupfers fehlen.
- Werte, die an Beobachtungen angepasst sind, wurden am idealen Modell angepasst: die Geschwindigkeit des Thiosulfat-Zerfalls (im realen Modell dauert der Versuch etwa 1,7-mal so lange) und das Gleichgewicht des Cobaltchlorids. Für solche Versuche ist das ideale Modell gedacht.
- Beide Modelle rechnen mit mol/L, wo Tabellen mol/kg Wasser meinen. Bis 1 mol/L macht das wenige Prozent aus; gesättigte Kochsalzlösung hat hier 6,2 mol/L (im realen Modell 6,3) statt 5,4 mol/L.
- Redoxreaktionen laufen an Metallen und Elektroden ab. Zwischen gelösten Teilchen laufen nur die eigens eingetragenen: Peroxodisulfat mit Iodid, Iod mit Thiosulfat, Permanganat mit Eisen(II) und mit Wasserstoffperoxid, Kupfer(II) und Eisen(III) mit Iodid. Andere bleiben ohne Wirkung, etwa Permanganat mit Oxalsäure oder mit Iodid und Dichromat mit Eisen(II). Auch Metalle reduzieren Permanganat nicht, weil dafür kein Redoxpaar eingetragen ist.
- Permanganat reagiert in der Schreibweise für saure Lösung, zu farblosem Mangan(II). Ohne Säure entstünde im Labor Braunstein; hier läuft dieselbe Reaktion, soweit Wasserstoff-Ionen nachkommen. Kupfer(I)-iodid bleibt, wie es ausfällt: Kupfer(I) in Lösung gibt es nicht.
- Gelöster Luftsauerstoff wird nicht gerechnet. Eisen rostet nicht, und Kupfer löst sich in Säure auch an der Luft nicht. Zink und Kupfer in derselben Säure (Volta-Element) zeigen deshalb etwa 0,5 V statt der 0,9 V im Versuch. Überhaupt sagt die Spannung nur dort etwas, wo jede Elektrode in einer Lösung ihrer eigenen Ionen steht (oder Gas an ihr entsteht): Kupfer in reinem Wasser oder Graphit in Kochsalzlösung haben kein festes Potential, der Spannungsmesser zeigt dann einen Wert ohne Bedeutung.
- Chlor entweicht als Gas und löst sich nicht in der Lösung: Bei der Elektrolyse von Kochsalzlösung bleibt Natronlauge zurück, Bleichlauge entsteht nicht, und Indikatoren werden nicht gebleicht.
- Ein Belag auf einer Elektrode hemmt den Strom nicht. Das Silberchlorid, mit dem sich eine Silber-Elektrode am Pluspol in Kochsalzlösung überzieht, wächst deshalb beliebig weiter; im Labor wird die Schicht dicht, und der Strom geht zurück.
- Zink löst sich in Natronlauge nur langsam und nur als Pulver sichtbar, in der Wärme deutlich schneller. Wie schnell genau, ist geschätzt.
- Weil jedes Gefäß durchmischt ist, zeigt ein Indikator bei der Elektrolyse nur das Ergebnis für die ganze Lösung, nicht die Zonen an den Elektroden. Wasserstoff und Sauerstoff bleiben nicht an den Elektroden haften: Nach dem Abschalten zeigt der Spannungsmesser keine Polarisationsspannung.
- Die Leitfähigkeit gilt für unendliche Verdünnung. In konzentrierten Lösungen ist sie zu hoch; mehrwertige Salze wie Kupfersulfat leiten im idealen Modell dagegen schlechter als im Labor, weil die ideale Rechnung zu viele Ionenpaare bildet. Im realen Modell zerfallen die Ionenpaare weiter: Kupfersulfat mit 0,5 mol/L leitet dann gut viermal so gut wie im idealen Modell und etwa doppelt so gut wie im Labor, und bei der Elektrolyse fließt entsprechend mehr Strom.
- Überspannungen und der Stoffübergang an Oberflächen sind geschätzt. Das Zink ist als technisches Zink eingestellt, das in Salzsäure sichtbar Wasserstoff entwickelt; reines Zink reagiert viel träger. Im Volta-Element entsteht deshalb der größere Teil des Wasserstoffs am Zink selbst und nur der Teil am Kupfer, der dem Strom entspricht. Die Hemmung von Magnesium und Eisen steht für ihre Oxidschichten.
- Elektroden passen nur in Bechergläser, zwei je Glas; nur dort lassen sich Netzgerät, Messgeräte und Lämpchen anschließen. Zu einem Glas (oder einem Paar mit Salzbrücke) gehört ein Stromkreis; frei verdrahten lässt sich nichts. An jedem Glas hängt höchstens eine Salzbrücke, und sie erschöpft sich nicht.
- Das Gasableitungsrohr gibt ein lösliches Gas vollständig an die Lösung ab, soweit sie es aufnehmen kann; im Labor steigt ein Teil der Blasen ungelöst hindurch. Kalkwasser klärt sich deshalb schneller wieder als im Versuch. Beim Abkühlen steigt keine Flüssigkeit zurück, und Überdruck entsteht nicht.
- Die Waage rechnet ohne Auftrieb in der Luft, und Elektroden, Messfühler und Kolbenprober zählen nicht mit: Sie hängen am Stativ. Ein Gefäß auf der Waage lässt sich nicht zugleich heizen.
- Heiße Stellen gibt es nur an Stücken aus dem Regal, nicht an einem Niederschlag. Das Flitzen eines geschmolzenen Stücks ist gezeichnet, nicht gerechnet, und in der 3D-Ansicht spritzt es nicht. Indikatorpapier wird nur über die Öffnung gehalten, nicht eingetaucht, und Chlor bleicht es nicht, weil sich Chlor hier nicht löst.
- Kalkwasser hat hier 0,011 mol/L statt der rund 0,02 mol/L einer im Labor gesättigten Lösung, denn das ideale Modell rechnet Calciumhydroxid schon bei 0,0117 mol/L als gesättigt.
- Wasser verdunstet nur beim Sieden; unterhalb von 100 °C verliert ein Gefäß nichts. Gelöste Gase entweichen nur, wenn sie ausperlen oder mit dem Dampf fortgehen.
- Die Löslichkeit von Kupfersulfat ist auf den gemessenen Wert von 1,4 mol/L eingestellt, weil die ideale Rechnung mit der Konstante der Datenbank zu wenig ergäbe. Solche Werte sind in den Daten als „adjusted“ (angepasst) gekennzeichnet.
- Das Geschwindigkeitsgesetz für Marmor gilt für eine bewegte Lösung. Ruhende Körner, an denen Gasblasen haften, reagieren im Labor langsamer. Andere Feststoffe aus dem Regal (Kupfersulfat, Iod) lösen sich weiter mit einer festen Zeitkonstante.
- Beim Sieden zählen nur Wasser und die gelösten Stoffe mit Siedepunkt: Salze erhöhen den Siedepunkt nicht, und Essigsäure verdampft nicht mit. Aktivitätskoeffizienten gibt es nur für Paare mit Wasser. Ethylacetat mischt sich hier vollständig mit Wasser (im Labor nur zu etwa 8 %) und bildet mit Wasser und Ethanol nicht das Gemisch, das schon bei 70 °C siedet. Das Thermometer im Kolben misst die Flüssigkeit, nicht den Dampf am Ansatz des Kühlers.
- Die Veresterung rechnet ohne Reaktionswärme: Für Ethanol und Ethylacetat fehlen Bildungsenthalpien aus einer Quelle, die das Grundpaket verwenden darf.
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
- Die Geschwindigkeiten (Magnesium in Säure, Zerfall von Wasserstoffperoxid an Braunstein, Thiosulfat in Säure, Entwässern) sind an die übliche Dauer des Schulversuchs angepasst, nicht gemessen. Solche Werte sind in den Daten als „estimated“ (geschätzt) gekennzeichnet.
- Die Simulation ersetzt keine Sicherheitsunterweisung. Was hier gefahrlos geht, braucht im Labor Schutzbrille und Aufsicht.

Geprüft wird der Baustein mit `node --test check.mjs`.

## Lizenz

ChemLab steht unter [CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/deed.de) (Namensnennung, nicht kommerziell, Weitergabe unter gleichen Bedingungen), © Andre Dietrich. Der vollständige Text liegt in der Datei `LICENSE`. Die Lizenz gilt für den Rechenkern, die Daten, die Pakete, die Übersetzungen und diese Folien.

Frei nutzen dürfen den Baustein Schulen, Hochschulen und alle, die offene Bildungsmaterialien (OER) erstellen. Wer ChemLab verändert und weitergibt, stellt seine Fassung wieder unter dieselbe Lizenz. Ein Kurs, der ChemLab nur mit `import:` einbindet, kann eine eigene Lizenz haben. Für eine kommerzielle Nutzung bitte anfragen.

Ausgenommen sind die Teile anderer Urheber, für die ihre eigene Lizenz gilt:

- [three.js](https://threejs.org) im Ordner `vendor/three`: MIT-Lizenz, siehe `vendor/three/LICENSE`.
- Texturen und Raumlichter im Ordner `assets/3d`: [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/) von Poly Haven, siehe `assets/3d/QUELLEN.md`.
- Die Stoffdaten aus PHREEQC sind als Werk des U.S. Geological Survey gemeinfrei; die Quellen stehen im Kopf dieser Datei und bei jedem Eintrag in `chemlab-data.js`.
