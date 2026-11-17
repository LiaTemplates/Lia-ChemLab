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

Einbinden im Kopf eines Kurses, mit fester Version oder immer der neuesten:

`import: https://raw.githubusercontent.com/LiaTemplates/Lia-ChemLab/0.0.1/README.md`

`import: https://raw.githubusercontent.com/LiaTemplates/Lia-ChemLab/master/README.md`

Diesen Kurs in LiaScript öffnen: [ChemLab auf liascript.github.io](https://liascript.github.io/course/?https://raw.githubusercontent.com/LiaTemplates/Lia-ChemLab/master/README.md). Quelltext: [github.com/LiaTemplates/Lia-ChemLab](https://github.com/LiaTemplates/Lia-ChemLab).

> **Stand:** Version 0.0.1, veröffentlicht. Es gibt Reagenzglas, Becherglas, Kalorimeter, Messzylinder, Standzylinder, Vollpipetten, Abdampfschale, Bürette, Trichter mit Filterpapier, Rundkolben, Liebig- und Rückflusskühler, Brenner, Wasserbad, Zentrifuge, Thermometer, pH-Meter, Leitfähigkeitsmessgerät, Fotometer, Manometer, Kolbenprober mit Manometer, Gasableitungsrohr, Gummistopfen und Waage; Elektroden aus sieben Materialien (mit Blei für den Bleiakku), Netzgerät, Strom- und Spannungsmesser, Lämpchen und Salzbrücke; dazu Holzspan, Glimmspan und Magnesiastäbchen für die Nachweise, Säuren, Laugen, Kalkwasser, rund vierzig Lösungen, vier Indikatoren, Stärke, Iodlösung und dreizehn Feststoffe. Gerechnet werden Säure-Base-Gleichgewichte, Puffer, Fällungen, Komplexe, Gase über der Lösung, Sieden und Eindampfen, Verbrennungen, die Knallgasreaktion, Redoxreaktionen an Metallen und einige in Lösung (Redoxtitration), Elektrolyse und galvanische Zellen mit Bleiakku und Brennstoffzelle, Wärmetönung im Kalorimeter, die Gasgesetze von Boyle und Gay-Lussac, Filtrieren und Zentrifugieren, Reaktionen mit Geschwindigkeitsgesetz und Katalysator und Gleichgewichte, die sich mit Konzentration, Säure und Temperatur verschieben. Eine Teilchenlupe zeigt, was in der Lösung vorliegt. Gleichgewichte rechnen ideal mit Konzentrationen oder, auf Wunsch, real mit Aktivitäten. Für den Unterricht gibt es Aufgaben mit Selbstkontrolle, unbekannte Proben mit zufälliger Füllung, Indikatorpapier für den Gasraum, gesperrte Aufbauten, eine Messwerttabelle und „Aufbau kopieren“; ein Labor mit Namen spricht mit dem Lehrtext seiner Folie (Stoffe zum Anklicken, Messwerte, Gleichungen und Diagramme im Text, eigene Skripte); Erweiterungspakete bringen weitere Stoffe: ein Paket zur Organik mit Veresterung, Destillation und den Nachweisen nach Fehling, Tollens (Silberspiegel) und mit Bromwasser, ein Paket mit den Alkalimetallen. Messwerte können wie bei echten Geräten streuen, Flaschen tragen ihre Gefahrstoff-Piktogramme, Reste kommen in den richtigen Behälter, das Protokoll lässt sich kopieren, und ab Kursversion 1.0.0 bleibt ein Versuch gespeichert und lässt sich im Klassenraum teilen.

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

- Das **Reagenzglas antippen**: Darunter öffnet sich seine Karte. Unter **Zugeben** stehen die Stoffe aus dem Regal, unter **Geräte** Thermometer, Brenner, Proben und alles, was an diesem Gefäß wirkt, unter **Inhalt** die Teilchen, die Teilchenlupe, Umgießen, Entsorgen und Wegräumen.
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

## Genau abmessen

Dreimal sollen 20 mL Wasser aus dem Vorrat (Becherglas 1) in ein Becherglas, jedes Mal auf anderem Weg:

- **Becherglas 2:** einfach umgießen (in der Karte des Vorrats „Umgießen in“, 20 mL).
- **Becherglas 3:** erst bis zur Marke 20 in den **Messzylinder** gießen, dann den Zylinder ganz in Becherglas 3 ausleeren (dafür mehr eintragen, als darin ist, etwa 50 mL).
- **Becherglas 4:** mit der **Vollpipette** 20 mL: aus dem Vorrat aufziehen, in Becherglas 4 abgeben.

Vergleiche die Mengen unter den Gläsern. Hier streuen die Geräte wie echte (`"scatter": true`): Umgießen nach Augenmaß trifft auf etwa 5 % genau, der 25-mL-Messzylinder auf ±0,5 mL, die Vollpipette auf 0,2 %. Lies am Messzylinder den tiefsten Punkt des Meniskus ab. Und nimm immer den kleinsten Zylinder, der reicht: 5 mL misst der 10-mL-Zylinder auf ±0,2 mL, der 100-mL-Zylinder nur auf ±1 mL.

```json @ChemLab.sim
{"scatter":true,
 "bench":[
  {"type":"beaker","id":"vorrat","ml":250,"contains":[{"reagent":"H2O","ml":150}]},
  {"type":"cylinder","id":"zylinder","ml":25},
  {"type":"beaker","id":"a"},
  {"type":"beaker","id":"b"},
  {"type":"beaker","id":"c"}
 ],
 "shelf":["pipette20","pipette5","pipette10","pipette25","cylinder"],
 "show":{"charts":false}}
```

## Filtrieren

Ein **Trichter mit Filterpapier** hängt im Stativring über dem rechten Becherglas. Gib 10 mL Natronlauge (zweimal 5 mL) zur Kupfersulfat-Lösung: Blaues Kupferhydroxid fällt aus. Gieß dann alles in den Trichter; wer das ganze Glas ausgießt, schwenkt auf und spült auch den Bodensatz mit hinein. Das Filtrat tropft von selbst ins Becherglas darunter, etwa ein halber Milliliter je Sekunde: Es ist klar und farblos, der blaue Niederschlag bleibt auf dem Papier. Den Rückstand kannst du dir in der Karte des Trichters ansehen und dort entsorgen.

Fein verteilter Schwefel (aus Natriumthiosulfat und Salzsäure) läuft dagegen durch das Filter: Das Filtrat bleibt trüb. Für diesen zweiten Versuch stehen ein weiterer Trichter und ein Becherglas im Regal.

```json @ChemLab.sim
{"bench":[
  {"type":"beaker","id":"loesung","contains":[{"reagent":"CuSO4 0.5M","ml":10}]},
  {"type":"beaker","id":"filtrat"},
  {"type":"funnel","id":"trichter","over":"filtrat"}
 ],
 "shelf":["NaOH 1M","Na2S2O3 1M","HCl 2M","beaker","funnel"],
 "show":{"charts":false}}
```

## Zentrifugieren

In beiden Reagenzgläsern ist Kupfersulfat-Lösung. Gib in jedes 5 mL Natronlauge: Blaues Kupferhydroxid fällt aus. Das rechte Glas steckt in der **Zentrifuge**: Tipp sie an und schalte sie ein („läuft“). Nach etwa 20 Sekunden liegt der Niederschlag fest am Boden, die Lösung darüber ist klar; im linken Glas dauert das gut fünf Minuten. Solange die Zentrifuge läuft, ist ihr Deckel zu: Nichts kommt in das Glas hinein oder heraus. Schalte sie aus und gieß den klaren Überstand ab (in der Karte des Glases „Umgießen in“, 8 mL): Der Bodensatz bleibt im Glas.

Auch fein verteilter Schwefel, der durch das Filter läuft, setzt sich in der Zentrifuge ab, nur langsamer: Nach einigen Minuten liegt das meiste unten. Entsorge dazu den Inhalt des rechten Glases (in seiner Karte), gib dort je 5 mL Natriumthiosulfat-Lösung und Salzsäure hinein, warte, bis es trüb wird, und schalte die Zentrifuge wieder ein: Der gelbe Bodensatz wächst, doch die Lösung darüber wird nicht klar, weil darin weiter Schwefel entsteht.

```json @ChemLab.sim
{"bench":[
  {"type":"testtube","id":"links","contains":[{"reagent":"CuSO4 0.5M","ml":5}]},
  {"type":"testtube","id":"rechts","contains":[{"reagent":"CuSO4 0.5M","ml":5}]},
  {"type":"centrifuge","id":"zentrifuge","under":"rechts"},
  {"type":"beaker","id":"ueberstand"}
 ],
 "shelf":["NaOH 1M","Na2S2O3 1M","HCl 2M"],
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

## Knallgas: nur in kleinen Mengen

Wasserstoff prüft man nur in kleinen Mengen im Reagenzglas, die Öffnung von sich weg. Warum, zeigt der große Standzylinder: Darin reagieren 0,3 g Magnesium mit Salzsäure, und ein Gummistopfen hält den Wasserstoff zurück, knapp 300 mL. Warte, bis keine Blasen mehr aufsteigen, knapp eine Minute. Nimm dann den Stopfen weg (antippen, „Wegräumen“) und halte sofort den brennenden Span an die Öffnung: Das Gemisch aus Wasserstoff und Luft explodiert mit lautem Knall, und das Glas zerspringt. Wartest du nach dem Öffnen länger als einige Sekunden, ist schon so viel Wasserstoff entwichen, dass es nur noch knallt.

Zum Vergleich das Reagenzglas: Gib ein Stückchen Magnesium in die Salzsäure und halte den Span daran. Es gibt nur ein „Plopp“, die Knallgasprobe.

```json @ChemLab.sim
{"bench":[
  {"type":"testtube","id":"klein","contains":[{"reagent":"HCl 1M","ml":8}]},
  {"type":"jar","id":"gross","ml":1000,"contains":[{"reagent":"HCl 2M","ml":30},{"reagent":"Mg ribbon","g":0.3}]},
  {"type":"stopper","in":"gross"}
 ],
 "shelf":["splint","Mg ribbon"],
 "room":20,
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

## Überdruck und Zurücksteigen

Ein **Gummistopfen** verschließt ein Glas ganz. Im linken Glas Magnesium in die Salzsäure geben: Der Wasserstoff hat keinen Platz, der Druck steigt, und der Stopfen fliegt heraus. Im mittleren Glas wird Wasser erhitzt, ein **Manometer** verschließt es und zeigt den Druck: Die Luft dehnt sich aus, Wasserdampf kommt hinzu, der Zeiger steigt, und lange bevor das Wasser siedet, fliegt bei 1,5 bar auch das Manometer heraus. Deshalb wird ein Gefäß nie verschlossen erhitzt.

```json @ChemLab.sim
{"bench":[
  {"type":"testtube","id":"saeure","contains":[{"reagent":"HCl 1M","ml":10}]},
  {"type":"stopper","in":"saeure"},
  {"type":"testtube","id":"erhitzt","contains":[{"reagent":"H2O","ml":5}]},
  {"type":"manometer","in":"erhitzt"},
  {"type":"burner","under":"erhitzt","flame":2}
 ],
 "shelf":["Mg ribbon","stopper","manometer","testtube"],
 "show":{"charts":["T"]}}
```

Hier siedet Wasser, und der Dampf geht durch das Rohr ins Kalkwasser. Den Brenner ausschalten, solange das Rohr noch im Kalkwasser steckt: Das Glas kühlt ab, der Dampf darin wird wieder zu Wasser, und das Kalkwasser steigt durch das Rohr zurück. Ist das Glas dabei heißer als etwa 200 °C, etwa weil darin etwas trocken erhitzt wurde, zerspringt es. Deshalb nimmt man zuerst das Rohr aus der Flüssigkeit und löscht dann den Brenner.

```json @ChemLab.sim
{"bench":[
  {"type":"testtube","id":"siedeglas","contains":[{"reagent":"H2O","ml":4}]},
  {"type":"burner","under":"siedeglas","flame":2},
  {"type":"tube","in":"siedeglas","to":"kalkwasser"},
  {"type":"testtube","id":"kalkwasser","contains":[{"reagent":"limewater","ml":10}]}
 ],
 "shelf":["tube","testtube","burner"],
 "show":{"charts":["T"]}}
```

## Gasgesetze

Der Kolbenprober hat ein **Manometer**: Er zeigt Volumen und Druck. Der Rundkolben enthält nur Luft und steht im **Wasserbad**. Das Bad auf 80 °C stellen: Die Luft dehnt sich aus, und der Kolben wandert um etwa 20 mL hinaus, beim Abkühlen wieder zurück. Der Druck bleibt bei 1 bar, das Volumen wächst mit der absoluten Temperatur (Gay-Lussac).

```json @ChemLab.sim
{"bench":[
  {"type":"flask","id":"kolben"},
  {"type":"syringe","in":"kolben"},
  {"type":"thermometer","in":"kolben"},
  {"type":"bath","under":"kolben"}
 ],
 "show":{"charts":["T","V"]}}
```

Im Kolbenprober am Reagenzglas sind schon 60 mL Luft. Den Kolbenprober antippen und den Kolben am Schieber „Kolben“ hineinschieben und halten: Der Druck steigt, und Druck mal Volumen (mit den 20 mL im Glas) bleibt gleich (Boyle). Bei 30 mL sind es 1,6 bar, und der Kolbenprober fliegt heraus. „Loslassen“ gibt den Kolben wieder frei. „Messwerte notieren“ hält Volumen und Druck als Paar in der Tabelle fest.

```json @ChemLab.sim
{"bench":[
  {"type":"testtube","id":"glas"},
  {"type":"syringe","in":"glas","fill":60}
 ],
 "table":true,
 "show":{"charts":false}}
```

## Erst das Wasser, dann die Säure

Konzentrierte Schwefelsäure setzt beim Verdünnen viel Wärme frei. Links stehen 20 mL Säure: 5 mL Wasser hineingeben. Das Wasser ist leichter und bleibt oben, die Wärme bleibt in der dünnen Schicht, wo beide sich treffen, und dort siedet es: Es spritzt, und ein Teil der Säure fliegt aus dem Glas. Rechts stehen 50 mL Wasser: 5 mL Säure hineingeben. Die Säure ist schwerer, sinkt durch und mischt sich mit viel Wasser; das Glas wird heiß, aber es spritzt nicht. Deshalb gilt: erst das Wasser, dann die Säure.

```json @ChemLab.sim
{"bench":[
  {"type":"beaker","id":"saeure","contains":[{"reagent":"H2SO4 conc","ml":20}]},
  {"type":"thermometer","in":"saeure"},
  {"type":"beaker","id":"wasser","contains":[{"reagent":"H2O","ml":50}]},
  {"type":"thermometer","in":"wasser"}
 ],
 "shelf":["H2O","H2SO4 conc","beaker"],
 "show":{"charts":["T"]}}
```

## Gefahrstoffe kennzeichnen

Jede Flasche im Regal trägt ihre **Gefahrenpiktogramme** nach GHS; wer eine Flasche in die Hand nimmt, sieht dazu das Signalwort, „Gefahr“ oder „Achtung“. Die Kennzeichnung hängt von der Konzentration ab, wie auf echten Etiketten:

- Salzsäure mit 0,01 mol/L hat kein Piktogramm. Mit 2 mol/L trägt sie das Ätzsymbol mit „Achtung“: Sie greift Metalle an. Konzentriert ist sie ätzend, mit „Gefahr“.
- Natronlauge ist schon mit 1 mol/L ätzend („Gefahr“), mit 0,1 mol/L greift sie nur Metalle an.
- Kupfersulfat-Lösung mit 1 mol/L reizt Haut und Augen und ist umweltgefährlich, Kaliumdichromat schon in kleiner Konzentration krebserzeugend (Gesundheitsgefahr).

Vergleiche die Flaschen im Regal: Welche würdest du ohne Schutzbrille nicht anfassen?

```json @ChemLab.sim
{"bench":[
  {"type":"beaker","id":"becher","contains":[{"reagent":"H2O","ml":50}]}
 ],
 "shelf":["HCl 0.01M","HCl 2M","HCl 12M","NaOH 0.1M","NaOH 1M","CuSO4 1M","K2Cr2O7 0.1M","PP","Mg ribbon","NH4NO3 salt"],
 "show":{"charts":false,"shelf":true}}
```

## Richtig entsorgen

Was nach einem Versuch im Glas ist, gehört nicht einfach in den Ausguss. In der Karte jedes Gefäßes stehen fünf Behälter: **Ausguss**, **Säuren und Laugen**, **Schwermetallsalze**, **organische Lösungsmittel** und **Feststoffe**. Das Protokoll sagt, ob der gewählte passt, und wenn nicht, welcher besser wäre und warum.

Entsorge die vier Gläser: Kupfersulfat-Lösung, Salzsäure, Kochsalzlösung und Wasser mit Marmorstückchen. Neutralisiere die Salzsäure vorher mit Natronlauge, bis der Indikator grün ist (genau 20 mL; schon ein Tropfen zu viel macht sie wieder alkalisch), dann darf sie in den Ausguss. Wer eine harmlose Lösung in einen Sammelbehälter gibt, macht nichts falsch; das Protokoll sagt nur, dass der Ausguss genügt hätte.

```json @ChemLab.sim
{"bench":[
  {"type":"beaker","id":"kupfer","contains":[{"reagent":"CuSO4 0.1M","ml":30}]},
  {"type":"beaker","id":"saeure","contains":[{"reagent":"HCl 1M","ml":20},{"reagent":"UI","drops":3}]},
  {"type":"beaker","id":"salz","contains":[{"reagent":"NaCl 0.1M","ml":30}]},
  {"type":"beaker","id":"marmor","contains":[{"reagent":"H2O","ml":20},{"reagent":"marble","g":1}]}
 ],
 "shelf":["NaOH 1M"],
 "task":{"text":"Entsorge alle vier Gläser richtig.","goals":[{"disposed":true,"in":"kupfer"},{"disposed":true,"in":"saeure"},{"disposed":true,"in":"salz"},{"disposed":true,"in":"marmor"}]},
 "show":{"charts":false}}
```

## Kalorimetrie

Im **Kalorimeter**, zwei ineinandergesteckten Styroporbechern mit Deckel, bleibt die Wärme fast ganz im Inhalt; die Becher selbst nehmen nur 10 J/K auf. Im linken stehen 50 mL Salzsäure von 1 mol/L. 50 mL Natronlauge von 1 mol/L zugeben und die höchste Temperatur ablesen. Aus der Erwärmung ΔT folgt die Neutralisationswärme:

ΔH = −(m · c + C) · ΔT / n

mit m = 100 g Lösung, c = 4,18 J/(g·K), C = 10 J/K für das Kalorimeter und n = 0,05 mol Wasser, die entstehen. Die Lösung wird etwa 6,5 °C wärmer; das ergibt rund −56 kJ/mol (in Tabellen stehen um −57 kJ/mol).

Im rechten steht Wasser. Darin 2 g eines Salzes lösen: Ammoniumnitrat kühlt, wie in einem Kältekissen; Natriumhydroxid und Calciumchlorid wärmen. Für jedes Salz ein neues Kalorimeter mit 50 mL Wasser nehmen.

```json @ChemLab.sim
{"bench":[
  {"type":"calorimeter","id":"neutral","contains":[{"reagent":"HCl 1M","ml":50}]},
  {"type":"thermometer","in":"neutral"},
  {"type":"calorimeter","id":"salz","contains":[{"reagent":"H2O","ml":50}]},
  {"type":"thermometer","in":"salz"}
 ],
 "shelf":["NaOH 1M","NH4NO3 salt","NaOH pellets","CaCl2 anhydrous","H2O","calorimeter","thermometer"],
 "show":{"charts":["T"]}}
```

## Massenerhaltung

Beide Bechergläser stehen auf einer **Waage**. In beide Gläser je 0,3 g Marmor geben. Links entweicht das Kohlenstoffdioxid, und die Waage zeigt immer weniger an. Rechts fängt der Kolbenprober das Gas auf, und die Masse bleibt gleich. Bei der Reaktion geht keine Masse verloren; aus dem offenen Glas entweicht nur ein Teil der Stoffe. Mit mehr als etwa 0,4 g Marmor wird der Kolbenprober voll, und sein Kolben springt heraus: Dann entweicht auch rechts das Gas, auch das, was schon im Kolbenprober war.

Die Waage antippen und „Tara“ wählen: Sie zeigt dann null und von da an nur, was hinzukommt oder fehlt. Das Diagramm zeigt, wie sich die Masse auf jeder Waage ändert.

Eisenwolle wird beim Verbrennen dagegen schwerer: Den brennenden Holzspan an die Schale halten, die Wolle glüht durch, und die Waage zeigt mehr an. Der Sauerstoff aus der Luft steckt nun im schwarzen Eisenoxid.

```json @ChemLab.sim
{"bench":[
  {"type":"dish","id":"schale","contains":[{"reagent":"Fe wool","g":1}]},
  {"type":"balance","under":"schale"}
 ],
 "shelf":["splint","Fe wool","balance","dish"],
 "show":{"charts":["m"]}}
```

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

## Bleichen und Chlor

**Bleichlauge** (Natriumhypochlorit, wie in Chlorreinigern) entfärbt Farbstoffe. In beide Gläser mit Indikator etwas Bleichlauge geben: Die Farbe verschwindet nach und nach. Im rechten Glas Salzsäure zu Bleichlauge geben: Es entsteht Chlor, und es riecht stechend. Feuchtes Indikatorpapier über der Öffnung wird weiß, es ist gebleicht – das ist der Nachweis für Chlor. Bleichlauge enthält auch Kochsalz; schon Essig im Überschuss setzt daraus Chlor frei. Deshalb dürfen Chlorreiniger und saure Reiniger nie zusammenkommen.

```json @ChemLab.sim
{"bench":[
  {"type":"beaker","id":"pp","contains":[{"reagent":"NaOH 0.1M","ml":20},{"reagent":"PP","drops":3}]},
  {"type":"beaker","id":"ui","contains":[{"reagent":"HCl 0.1M","ml":20},{"reagent":"UI","drops":3}]},
  {"type":"beaker","id":"reiniger","contains":[{"reagent":"NaOCl 1M","ml":10}]}
 ],
 "shelf":["NaOCl 1M","HCl 2M","paper"],
 "show":{"charts":false}}
```

Bei der Elektrolyse von Kochsalzlösung löst sich ein Teil des Chlors in der Lauge, die an der anderen Elektrode entsteht: Es bildet sich Bleichlauge, und ein Indikator verblasst mit der Zeit.

## Elektrolyse

Kupferchlorid-Lösung zwischen zwei Graphit-Elektroden. Das Netzgerät antippen und die Spannung einstellen: Am Minuspol scheidet sich Kupfer ab, am Pluspol steigt Chlor auf, man riecht es. Unter der Fläche stehen die Vorgänge an den beiden Elektroden, mit Elektronen geschrieben. „Umpolen“ vertauscht die Pole: Das Kupfer löst sich wieder und wandert auf die andere Elektrode.

Aus dem Regal lassen sich weitere Zellen aufbauen. Zinkiodid-Lösung gibt Zink und braunes Iod; Kochsalzlösung mit Phenolphthalein gibt Wasserstoff, Chlor und Natronlauge. Lässt man sie einige Minuten laufen, verblasst das Pink wieder: Das Chlor löst sich in der Lauge zu Bleichlauge, und die bleicht den Indikator.

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

## Brennstoffzelle

Zerlege zuerst Wasser: Das Netzgerät steht auf 3 V. Lass es etwa zwei Minuten laufen. An den Platin-Elektroden steigen Wasserstoff und Sauerstoff auf, und ein Teil bleibt in feinen Bläschen an ihnen haften. Tipp dann das Netzgerät an und stell es auf 0 V: Der Spannungsmesser zeigt nun gut 1 V. Die Zelle ist zur Brennstoffzelle geworden, mit dem Pluspol dort, wo der Sauerstoff haftet. Schließ den Strommesser aus dem Regal an: Es fließt Strom, nun in der Gegenrichtung. Die Gleichungen unter der Fläche zeigen, warum: Am Minuspol wird der Wasserstoff wieder zu Wasserstoff-Ionen, am Pluspol der Sauerstoff zu Wasser. Der Strom nimmt ab, bis das Gas verbraucht ist. Ohne Verbraucher verliert sich das Gas nach und nach, und die Spannung fällt über eine Viertelstunde ab.

```json @ChemLab.sim
{"bench":[
  {"type":"beaker","id":"zelle","contains":[{"reagent":"H2SO4 0.5M","ml":80}]},
  {"type":"electrode-Pt","in":"zelle"},
  {"type":"electrode-Pt","in":"zelle"},
  {"type":"supply","in":"zelle","volts":3},
  {"type":"voltmeter","in":"zelle"}
 ],
 "shelf":["ammeter","electrode-C"],
 "show":{"charts":["U","I"]}}
```

## Bleiakku

Zwei Bleiplatten in Schwefelsäure. Das Netzgerät lädt den Akku mit 3 V: Am Pluspol wird das Blei zuerst zu weißem Bleisulfat und dann zu braunem Bleidioxid, am Minuspol perlt Wasserstoff. Nach etwa einer Minute ist der Akku voll; was danach fließt, zerlegt nur noch Wasser. Stell das Netzgerät auf 0 V: Der Spannungsmesser zeigt knapp 2 V. Schließ das Lämpchen aus dem Regal an: Es glimmt schwach, gut zwei Minuten lang. Dabei überziehen sich beide Platten mit Bleisulfat, bis das Bleidioxid verbraucht ist und der Strom versiegt. Nimm das Lämpchen weg und stell das Netzgerät wieder auf 3 V: Der Akku lässt sich wieder laden.

```json @ChemLab.sim
{"bench":[
  {"type":"beaker","id":"akku","contains":[{"reagent":"H2SO4 2M","ml":80}]},
  {"type":"electrode-Pb","in":"akku"},
  {"type":"electrode-Pb","in":"akku"},
  {"type":"supply","in":"akku","volts":3},
  {"type":"voltmeter","in":"akku"}
 ],
 "shelf":["lamp","ammeter"],
 "show":{"charts":["U","I","m"]}}
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

In einem **gesperrten** Aufbau bleiben die Geräte, wo sie stehen. Stoffe zugeben, umgießen, entsorgen, den Hahn der Bürette und die Regler bedienen und Proben mit Span und Stäbchen gehen weiter; das Regal bietet nur Stoffe und Proben an.

**Messwerttabelle:** „Messwerte notieren“ schreibt die Anzeigen aller Messgeräte als Zeile in eine Tabelle, dazu die Zeit und was jede Bürette abgegeben hat; vom Kolbenprober Volumen und Druck. So entsteht eine Titrationskurve von Hand: Hahn auf „langsam“, nach jeweils etwa 2 mL zudrehen und notieren. „Tabelle kopieren“ gibt die Werte mit Tabulatoren getrennt weiter, so dass sie sich in eine Tabellenkalkulation einfügen lassen. Die Tabelle bleibt beim Zurücksetzen stehen; „Tabelle leeren“ beginnt eine neue.

**Protokoll kopieren:** Der Knopf unter den Beobachtungen schreibt das ganze Protokoll bis zur Zeit des Zeigers in die Zwischenablage, eine Zeile je Eintrag mit Uhrzeit, so wie es unter der Fläche steht (dort sind es höchstens die letzten 60), etwa für ein Versuchsprotokoll. Unbekannte Proben bleiben darin verborgen. Erlaubt der Browser das Kopieren nicht, steht der Text zum Markieren unter der Fläche.

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

## Streuung der Messwerte

Echte Messgeräte zeigen nicht genau den wahren Wert. Mit `"scatter": true` hat hier jedes Messgerät eine eigene feste Abweichung, für jede und jeden neu ausgelost, und die letzte Stelle wackelt ein wenig.

Das Wasser links hat Raumtemperatur, 20,0 °C; die Salzsäure rechts hat pH 2,00. Was zeigen deine Geräte? Notiere die Werte in der Tabelle und vergleicht sie in der Klasse: Die Einzelwerte streuen um den wahren Wert, und der Mittelwert vieler Gruppen liegt näher daran als die meisten Einzelwerte.

Gib dann Natronlauge in kleinen Portionen zur Säure. Solange sich etwas tut, wackelt die letzte Stelle der Anzeige; notiere nach jeder Portion. Das Wackeln mittelt sich über viele Messungen heraus, die feste Abweichung eines Geräts nicht.

```json @ChemLab.sim
{"scatter":true,
 "table":true,
 "bench":[
  {"type":"beaker","id":"wasser","contains":[{"reagent":"H2O","ml":50}]},
  {"type":"thermometer","in":"wasser"},
  {"type":"beaker","id":"saeure","contains":[{"reagent":"HCl 0.01M","ml":50}]},
  {"type":"phmeter","in":"saeure"}
 ],
 "shelf":["NaOH 0.1M"],
 "show":{"charts":["pH"]}}
```

## Aufbau als Text kopieren

„Aufbau kopieren“ schreibt den Aufbau als Text in die Zwischenablage, im selben Format wie die Beschreibung unter jeder Fläche; falls der Browser das nicht erlaubt, steht der Text zum Markieren unter der Fläche. In einen Kurs eingefügt, ergibt er denselben Tisch. So lässt sich ein Versuch durch Antippen aufbauen statt von Hand beschreiben.

Der Text nennt die Geräte, wie sie gerade stehen, und was in jedes Gefäß gegeben wurde. Beim Umgießen geht der entsprechende Anteil der Flüssigkeiten mit, Feststoffe bleiben zurück. Was aus einer Bürette getropft oder durch einen Trichter gelaufen ist, steht weiter in der Bürette oder im Trichter, und Reaktionen laufen nach dem Einfügen von vorn: Es ist der Aufbau, nicht der Zwischenstand eines Versuchs. Regal, Aufgabe, eigene Daten und alle anderen Angaben bleiben, wie sie in der Beschreibung standen.

```json @ChemLab.sim
{"bench":[
  {"type":"beaker","contains":[{"reagent":"H2O","ml":40}]}
 ],
 "shelf":["CuSO4 0.1M","NaOH 1M","Zn granules","testtube","thermometer","burner"]}
```

## Versuche speichern und teilen

In einem Kurs mit `version: 1.0.0` oder höher speichert LiaScript den Stand jeder Fläche im Browser. Nach einem Neuladen der Seite steht der Versuch wieder auf dem Tisch, mit Protokoll, gezogener Probe und abgegebener Antwort. „Zurücksetzen“ löscht ihn. Die Vorlage selbst trägt eine Version unter 1.0.0 und speichert deshalb nichts; zum Ausprobieren braucht es einen eigenen Kurs, der sie mit `import:` einbindet.

Im Klassenraum von LiaScript wandert der gespeicherte Versuch mit. Wer ihn sehen darf, legt die Person fest, die den Raum betreibt, wie bei Quiz und Umfragen:

| Modus | Im Menü unter „Versuche der anderen“ |
|---|---|
| Shared | alle sehen die Versuche aller |
| Summary, Details | nur die Lehrkraft sieht die Versuche der anderen |
| ohne Klassenraum | nichts, nur der eigene Versuch wird gespeichert |

Ein Klick zeigt den fremden Versuch auf der eigenen Fläche, mit Protokoll, Messwerten und Zielen; man kann ihn weiterlaufen lassen und spulen, gespeichert wird davon nichts. „Zurück zu meinem Versuch“ holt den eigenen wieder. Für Aufgaben mit unbekannten Proben passt Summary oder Details: Im Modus Shared stecken die gezogene Probe und die Antwort der anderen in den geteilten Daten.

Gespeichert wird je Fläche, also unter dem `@uid` ihres Makros. Ändert sich die Beschreibung der Fläche, gilt der alte Stand nicht mehr, und die Fläche beginnt leer.

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
| `{ set: "bath1", temp: 60 }` | einstellen: `temp` (Wasserbad), `volts` (Netzgerät), `nm` (Fotometer), `hold` (Kolbenprober: Kolben in mL halten; allein Luft aufziehen), `flame` (Brenner: 0, 1, 2), `spin` (Zentrifuge: 0 aus, 1 an) |

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

Ein **Paket** ist eine JSON-Datei im selben Format wie das Feld `data` (siehe „Eigene Stoffe und Reaktionen“). Zum Baustein gehören das Paket `packs/organic.json` mit Ethanol, Eisessig, Ethylacetat und Wein, der Veresterung und den Angaben für die Destillation, dazu den Nachweisen mit Fehling, Tollens und Bromwasser (Ethanal, Glucose, Aceton, Hexen, Hexan), und das Paket `packs/alkali.json` mit Lithium, Natrium und Kalium. Ein Paket kommt auf drei Wegen in einen Kurs:

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

Das Paket `packs/alkali.json` bringt Lithium, Natrium und Kalium. Je ein Stückchen in das Wasser mit Phenolphthalein geben: Alle drei schwimmen, denn sie sind leichter als Wasser. Lithium sprudelt ruhig etwa eine Minute lang und bleibt fest. Natrium schmilzt durch die Reaktionswärme zur glänzenden Kugel, flitzt auf dem Wasser umher und ist in gut zehn Sekunden verbraucht. Kalium wird so heiß, dass es glüht und der Wasserstoff sich entzündet: Er brennt mit violetter Flamme, der Farbe des Kaliums. Es entsteht Wasserstoff, bei Lithium und Natrium mit der Knallgasprobe nachzuweisen; beim Kalium verbrennt er gleich. Die Lösung wird alkalisch und färbt sich rotviolett. Die Flammenfärbung mit dem Magnesiastäbchen zeigt danach, welches Metall es war: Lithium rot, Natrium gelb, Kalium violett.

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

## Organische Nachweise

@[ChemLab.pack](packs/organic.json)

Drei Reagenzgläser mit den klassischen Nachweisen. Gib in jedes 1 mL einer Probe aus dem Regal, und vergleiche Ethanal, Glucose, Aceton, Hexen und Hexan:

- **Fehling-Probe** (Fehling I und II gemischt, tiefblau, im Wasserbad bei 80 °C): Ein Aldehyd und Glucose reduzieren das Kupfer, in etwa einer Minute fällt ziegelrotes Kupfer(I)-oxid aus. Aceton, ein Keton, tut das nicht. Ohne Wasserbad dauert es sehr viel länger.
- **Tollens-Probe** (ammoniakalische Silbernitrat-Lösung, im Wasserbad bei 60 °C): Ein Aldehyd und Glucose scheiden Silber ab, und das legt sich als glänzender **Silberspiegel** an die Glaswand, mit Ethanal in etwa einer Minute, mit Glucose in einigen Minuten. Er bleibt am Glas, auch wenn du die Lösung ausgießt.
- **Bromwasser** (gelbbraun): Hexen entfärbt es sofort, denn das Brom lagert sich an die Doppelbindung an. Hexan nicht.

```json @ChemLab.sim
{"bench":[
  {"type":"testtube","id":"fehling","contains":[{"reagent":"Fehling I","ml":3},{"reagent":"Fehling II","ml":3}]},
  {"type":"bath","under":"fehling","temp":80},
  {"type":"testtube","id":"tollens","contains":[{"reagent":"Tollens","ml":5}]},
  {"type":"bath","under":"tollens","temp":60},
  {"type":"testtube","id":"brom","contains":[{"reagent":"bromine water","ml":5}]}
 ],
 "shelf":["ethanal","glucose","acetone","hexene","hexane","Fehling I","Fehling II","Tollens","bromine water","testtube","bath"],
 "show":{"charts":false}}
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
  - `fill` – beim Kolbenprober: so viel Luft in mL (0 bis 100) ist schon aufgezogen, bevor er angeschlossen wird.
  - `over` – bei einer Bürette der Name des Gefäßes, über dem sie hängt.
  - `under` – bei Brenner, Wasserbad, Waage und Zentrifuge der Name des Gefäßes, unter dem es steht; ohne Angabe steht es für sich auf dem Tisch. Unter einem Gefäß steht nur eines davon. `flame` – die Flamme des Brenners: 0 aus (Vorgabe), 1 leuchtend, 2 rauschend. `spin` – ob die Zentrifuge läuft: 0 (Vorgabe) oder 1; laufen kann sie nur, wenn außer einem Stopfen nichts im Reagenzglas steckt und nichts darüber hängt oder hineinführt. `temp` – die Temperatur des Wasserbads in °C, 0 bis 95; ohne Angabe die des Raums.
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
- `scatter` – die Anzeigen der Messgeräte streuen wie bei echten Geräten: `true` lost für jede und jeden neu aus, auch bei jedem Neuladen der Seite; eine Zahl gibt allen dieselbe Auslosung (etwa für eine Aufgabe mit fester Lösung). Vorgabe: keine Streuung. Siehe „Streuung der Messwerte“. Mit Streuung trifft auch Umgießen nur ungefähr (bis 5 %), Zugeben aus dem Regal bleibt genau. Ziele mit `measure` oder Mengen (`has`) brauchen dann Spielraum: Grenzen enger als die Streuung sind für manche Auslosungen nicht erreichbar.
- `view` – womit die Fläche beginnt: `"2d"` (Vorgabe) oder `"3d"`. Der Knopf **3D** schaltet jederzeit um.
- `scene` – wie die Fläche in 3D aussieht: `"lab"` (Labor, Vorgabe), `"kitchen"` (Küche) oder `"1880"` (Labor um 1880). Ausführlich als Objekt: `{"base":"kitchen","gear":{"burner":"lab"},"quality":"low"}` – `gear` nimmt für einzelne Geräte das Aussehen einer anderen Szene, `quality` ist `"auto"` (Vorgabe), `"high"` oder `"low"` (ohne Schatten und Raumlicht-Bild, mit weniger Bildpunkten; „auto“ wählt das am Handy und auf schmalen Flächen). An der Rechnung ändert die Szene nichts.
- `model` – womit die Gleichgewichte rechnen: `"ideal"` mit Konzentrationen (Vorgabe) oder `"real"` mit Aktivitäten, siehe „Ideale und reale Lösung“.
- `data` – eigene Stoffe und Reaktionen, siehe nächster Abschnitt.

| `type` | Gerät | Angaben |
|---|---|---|
| `testtube` | Reagenzglas, 20 mL | `contains` |
| `beaker` | Becherglas | `ml` Größe: 50, 100 (Vorgabe), 250 oder 600; `contains` |
| `calorimeter` | Kalorimeter: zwei Styroporbecher mit Deckel, 250 mL, 7 g; hält die Wärme. Es kommt nicht auf Brenner oder Wasserbad, und Elektroden passen nicht hinein | `contains` |
| `cylinder` | Messzylinder mit feiner Skala und Fuß; kommt nicht auf Brenner oder Wasserbad, Elektroden passen nicht hinein | `ml` Größe: 10, 25, 50 oder 100 (Vorgabe); `contains` |
| `jar` | Standzylinder ohne Skala, zum Auffangen von Gasen (mit Gummistopfen verschließen); kommt nicht auf Brenner oder Wasserbad | `ml` Größe: 250, 500 (Vorgabe) oder 1000; `contains` |
| `pipette5`, `pipette10`, `pipette20`, `pipette25` | Vollpipette mit 5, 10, 20 oder 25 mL, nur im Regal (`shelf`): erst das Gefäß antippen, aus dem sie aufzieht, dann das Ziel; nicht aus Bürette oder Trichter, nicht durch einen Stopfen | – |
| `funnel` | Trichter mit Filterpapier im Stativring, 60 mL; hängt über einem Gefäß (`over`) und läuft von selbst ab. Feststoffe und Niederschläge bleiben im Filter, Kolloide laufen durch | `over`, `contains` |
| `burette` | Bürette, 50 mL, mit Hahn | `over`, `contains` |
| `dish` | Abdampfschale aus Porzellan, 50 mL | `contains` |
| `thermometer` | Thermometer, −10 °C bis 110 °C; ist es heißer, zeigt es „> 110 °C“ | `in` |
| `phmeter` | pH-Meter | `in` |
| `burner` | Brenner; unter Becherglas und Schale mit Dreifuß, unter dem Reagenzglas mit Stativklemme | `under`, `flame` |
| `balance` | Waage unter einem Gefäß: zeigt Glas und Inhalt auf 0,01 g; „Tara“ setzt die Anzeige auf null. Unter einem Gefäß steht nur eines: Waage, Brenner, Wasserbad oder Zentrifuge | `under` |
| `centrifuge` | Tischzentrifuge unter einem Reagenzglas (andere Gefäße passen nicht hinein, und darunter steht dann nichts anderes); an- und ausschalten in ihrer Karte. Solange sie läuft, setzt sich ein Niederschlag 20-mal so schnell ab, und auch ein Kolloid setzt sich ab, langsamer (Zeitkonstante etwa eine Minute); das Glas ist dann zu. Anlaufen kann sie nur mit einem Glas, wenn nichts mehr hinein- oder herausfließt, außer einem Stopfen nichts im Glas steckt und nichts darüber hängt oder hineinführt (Rohr, Kühler, Salzbrücke) | `under`, `spin` |
| `bath` | Wasserbad mit Thermostat, 0 °C (Eiswasser) bis 95 °C; das Gefäß darin nimmt seine Temperatur an | `under`, `temp` |
| `syringe` | Kolbenprober, 100 mL, mit Manometer; verschließt das Gefäß und misst Gasvolumen und Druck | `in` |
| `manometer` | Manometer: ein Stopfen mit Druckanzeige in bar; fliegt bei 1,5 bar heraus wie ein Gummistopfen und zeigt dann den Luftdruck | `in` |
| `stopper` | Gummistopfen: verschließt das Gefäß `in` ganz. Steigt der Druck darin über 1,5 bar, fliegt er heraus und liegt dann frei auf dem Tisch | `in` |
| `tube` | Gasableitungsrohr mit Stopfen: verschließt das Gefäß `in` und leitet das Gas, das dort entsteht, in das Gefäß `to`; dort perlt es durch die Flüssigkeit, oder es sammelt sich im leeren Gefäß. In einem Stopfen steckt entweder ein Rohr oder ein Kolbenprober | `in`, `to` |
| `photometer` | Fotometer mit Tauchsonde: Extinktion bei einer Wellenlänge über 1 cm, bis 3 | `in`, `nm` |
| `conductometer` | Leitfähigkeitsmessgerät, zeigt mS/cm oder µS/cm | `in` |
| `electrode-C`, `electrode-Pt` | Elektrode aus Graphit (5 g) oder Platin (10 g); sie lösen sich nicht auf. Elektroden stehen nur in Bechergläsern | `in`, `g` |
| `electrode-Cu`, `electrode-Zn`, `electrode-Fe`, `electrode-Ag`, `electrode-Pb` | Elektrode aus Kupfer, Zink, Eisen, Silber oder Blei, 10 g | `in`, `g` |
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
| `measure` mit `min` und/oder `max` | ein Messgerät zeigt einen Wert in diesem Bereich: `T` (°C), `pH`, `kappa` (mS/cm), `A` (Extinktion), `V` (Gasvolumen im Kolbenprober, mL), `I` (Stromstärke, A), `U` (Spannung, V), `m` (Waage, g) oder `p` (Manometer, bar); Strom und Spannung als Betrag | `{"measure":"pH","min":6.5,"max":7.5,"in":"becher"}` |
| `has` mit `min` und/oder `max` in mol | von dem Stoff liegt so viel vor, gelöst, fest oder im Gasraum; ohne Angabe mindestens 1 µmol | `{"has":"Cu(s)"}`, `{"has":"Mg(s)","max":0}` |
| `disposed` | richtig entsorgt: mindestens einmal und jedes Mal in den passenden Behälter; mit `in` nur dieses Gefäß | `{"disposed":true,"in":"b"}` |
| `identify` | die unbekannte Probe mit diesem Namen (`unknown`, mit `oneOf`) ist richtig benannt; im Feld der Probe wählt man „Das ist: …“, die letzte Wahl zählt | `{"identify":"A"}` |
| `seen` | die Beobachtung steht im Protokoll: `gas`, `pop` (Knallgasprobe), `relight` (Glimmspan flammt auf), `out` (Span erlischt), `paper` (Indikatorpapier an der Öffnung, mit `name` eine bestimmte Farbe), `solid` (Niederschlag), `dissolved` (ein Niederschlag verschwindet), `color` (Farbumschlag, mit `name` eine bestimmte Farbe: `yellow`, `orange`, `red`, `pink`, `violet`, `blue`, `cyan`, `green`, `brown`, `grey`, `black`, `colorless`), `boil`, `smell`, `ignite`, `flame` (Flammenfärbung), `plated` (ein Belag scheidet sich an einer Elektrode ab: ein Metall, Silberchlorid, Bleisulfat oder Bleidioxid), `lamp`, `broken`; bei Stoffen wahlweise mit `species` | `{"seen":"solid","species":"AgCl(s)"}` |

Bei Lösungen steht die Konzentration im Namen: die Zahl vor `M` in mol/L, zum Beispiel `HCl 0.1M` oder `AgNO3 0.05M`. Ohne Zahl sind es 1 mol/L.

| `reagent` | Stoff | Menge |
|---|---|---|
| `H2O` | destilliertes Wasser | `ml` |
| `HCl`, `H2SO4`, `CH3COOH` | Salzsäure, Schwefelsäure, Essigsäure | `ml` |
| `H2SO4 conc` | konzentrierte Schwefelsäure, als reiner Stoff `H2SO4(l)`: Mit Wasser löst sie sich sofort zu H⁺ und HSO₄⁻ und setzt dabei etwa 73 kJ/mol frei; je Mol braucht sie dafür drei Mol Wasser, so dass sich mit wenig Wasser nur ein Teil löst | `ml` |
| `NaOH`, `NH3` | Natronlauge, Ammoniaklösung | `ml` |
| `limewater` | Kalkwasser: Calciumhydroxid-Lösung mit 0,011 mol/L (ohne Konzentration im Namen) | `ml` |
| `NaCl`, `KBr`, `KI` | Natriumchlorid, Kaliumbromid, Kaliumiodid | `ml` |
| `Na2SO4`, `CH3COONa`, `NH4Cl`, `KSCN` | Natriumsulfat, Natriumacetat, Ammoniumchlorid, Kaliumthiocyanat | `ml` |
| `AgNO3`, `BaCl2`, `CuSO4`, `FeCl3` | Silbernitrat, Bariumchlorid, Kupfersulfat, Eisen(III)-chlorid | `ml` |
| `Na2CO3`, `NaHCO3` | Natriumcarbonat (Soda), Natriumhydrogencarbonat (Natron) | `ml` |
| `CaCl2`, `SrCl2`, `LiCl` | Calciumchlorid, Strontiumchlorid, Lithiumchlorid | `ml` |
| `ZnSO4`, `ZnI2`, `CuCl2`, `FeSO4`, `KNO3` | Zinksulfat, Zinkiodid, Kupferchlorid, Eisen(II)-sulfat, Kaliumnitrat | `ml` |
| `Na2S2O3`, `Na2SO3`, `K2S2O8` | Natriumthiosulfat, Natriumsulfit, Kaliumperoxodisulfat | `ml` |
| `NaOCl` | Natriumhypochlorit-Lösung (Bleichlauge) mit gleich viel Kochsalz und etwas Natronlauge | `ml` |
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
| `NH4NO3 salt`, `NaOH pellets`, `CaCl2 anhydrous` | Ammoniumnitrat, Natriumhydroxid-Plätzchen, wasserfreies Calciumchlorid; lösen sich in Wasser mit Lösungswärme | `g` |

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
| `solvent` | `true`: ein organisches Lösungsmittel, das nach seinem Volumen (`Vm`) zu den organischen Abfällen zählt, auch wenn es im Modell nicht verdampft (Hexan, Aceton). Ein flüchtiger Stoff mit `Tb` zählt ohnehin |
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
| `rate.needs` | Nur mit `rate.fast`: Stoffe, die da sein müssen, ohne verbraucht zu werden, mit der Menge je Formelumsatz, etwa `{"H2O(l)":3}`: Schwefelsäure löst sich nur, soweit Wasser sie aufnimmt. Was schon umgesetzt ist, hat seinen Anteil gebunden; gezählt wird es an den Produkten der Gleichung (dem kleinsten Anteil) oder, mit `rate.bound`, an der Summe der dort genannten Teilchen, etwa `["HSO4-(aq)","SO4^2-(aq)"]`. Ein Stoff in `needs` darf nicht in der Gleichung stehen. |
| `logK` | Nur mit `rate.fast`: Die Reaktion läuft bis zu diesem Gleichgewicht (mit Konzentrationen in mol/L; Feststoffe, Wasser und Gase zählen 1) und nicht weiter. Der Wert gilt bei jeder Temperatur. Ohne die Angabe läuft sie vollständig ab. Die Rückreaktion wird nicht gerechnet. |
| `mirror` | `true`: Was diese Reaktion als Feststoff bildet, legt sich als Spiegel an das Glas, so hoch, wie die Flüssigkeit gerade steht (Silberspiegel der Tollens-Probe). Er trübt nicht, liegt nicht am Boden und bleibt beim Umgießen im Gefäß; ab 0,5 µmol je cm² benetzter Wand ist er dicht. |
| `spark` | Zündgrenzen eines Gasgemischs als Anteile am Gasraum, zum Beispiel `[0.04, 0.75]` für Wasserstoff. Eine solche Reaktion braucht keine Geschwindigkeit: Sie läuft, wenn ein Span oder eine Brennerflamme sie zündet. |
| `dH` | Reaktionsenthalpie in kJ/mol, falls eine Bildungsenthalpie fehlt |

**Vorratsflaschen** (`reagents`): eine Lösung (`solution`: Teilchen und ihre Konzentration in mol/L; mit `"molar":true` gilt der Eintrag für 1 mol/L und die Konzentration steht im Namen), eine reine Flüssigkeit (`liquid`) oder ein Feststoff (`solid` mit `area`, der Oberfläche in cm² je Gramm). `"drops":true` gibt den Stoff tropfenweise zu; `group` nennt das Fach im Regal (`acid`, `salt`, `other`, `indicator`, `solid`). Für Feststoffe außerdem: `shape` (0 für ein Band, dessen Oberfläche beim Auflösen gleich bleibt; Vorgabe sind Körner), `tau` (Zeit in s, in der sich ein Stück löst, wenn ein Löslichkeitsgleichgewicht es verlangt und dieses kein eigenes Geschwindigkeitsgesetz hat; Vorgabe 15), `form: "powder"` (als Pulver gezeichnet) und `piece` (Menge je Stück mit Namen der Einheit, wie beim Magnesiumband in cm). `start` ist die Menge, die beim Greifen eingestellt ist, in der Einheit des Stoffs, etwa `"start": 1` für ein einzelnes Stück. Sie muss eine der Stufen sein (mL: 1, 2, 5, 10, 20, 50, 100; Tropfen: 1, 2, 3, 5, 10; g: 0,1, 0,2, 0,5, 1, 2, 5; Stück: 1, 2, 5, 10, 20), sonst gilt die dritte.

**Gefahrstoffkennzeichnung** (`ghs`): die Einstufung des reinen Stoffs, aus der das Labor die Piktogramme jeder Konzentration nach den Gemisch-Regeln der CLP-Verordnung rechnet; Grenzen in Massenprozent. `corr`: hautätzend, hautreizend, augenschädigend und augenreizend ab (allgemein `[5, 1, 3, 1]`; `null` als erster Wert für einen Stoff, der nur die Augen schädigt); `irrit`: reizend (Kategorie 2) ab, allgemein 10; `ate`: Schätzwert der akuten Toxizität oral in mg/kg, `inh` derselbe beim Einatmen als Nebel in mg/L; `cmr`: `[Kategorie, ab]` für krebserzeugend, erbgutverändernd oder fortpflanzungsgefährdend; `stot`: `[Kategorie, ab]` für Organschäden (Kategorie 3: Reizung der Atemwege), auch als Liste mehrerer solcher Einträge; `sens` und `resp`: haut- und atemwegssensibilisierend ab; `aq`: `{"acute": M, "chronic": [Kategorie, M]}` für die Umwelt; `met`: korrosiv gegenüber Metallen ab; `xph: true` für eine Säure oder Base ohne eigene Grenze für Hautätzung: ab 1 % hautätzend, wenn die Lösung pH ≤ 2 oder ≥ 11,5 hat (CLP Anhang I, Tabelle 3.2.4; den pH rechnet das Labor); `high`: `[[ab, Piktogramm, true]]` für Gefahren erst der konzentrierten Lösung (brandfördernd, entzündbar; `true` für „Gefahr“); `vm`: scheinbares Molvolumen des Stoffs in mL/mol, damit der Massenanteil konzentrierter Lösungen stimmt; `pure`: Piktogramme nur des reinen Stoffs, etwa `["GHS02"]` für entzündbar, mit `"pureDanger": true` für „Gefahr“; `per`: `{"species": "OCl-(aq)", "M": 74.44}`, wenn nur einer der gelösten Stoffe eingestuft ist. Eine Fertiglösung bekommt stattdessen ihr Etikett: `{"fixed": ["GHS02", "GHS07"], "signal": "danger"}`. `src` nennt die Quelle. Angaben in falscher Form fallen beim Laden auf, wie eine falsche Gleichung.

Jede Gleichung wird beim Laden geprüft. Geht die Bilanz der Atome oder der Ladung nicht auf, erscheint statt der Fläche ein Hinweis, der sagt, was fehlt.

**Stoffe aus offenen Datenbanken:** `node tools/import.mjs <Name oder CAS-Nummer>` füllt einen Eintrag vor. Das Werkzeug fragt PubChem nach Formel und molarer Masse und nimmt aus der dortigen Hazardous Substances Data Bank (gemeinfrei) Siedepunkt, Schmelzpunkt, Dichte und Verdampfungsenthalpie; die Namen kommen aus Wikidata (CC0). Mit `--phreeqc datei.dat …` listet es außerdem die Zeilen dieser PHREEQC-Dateien, die den Stoff nennen, mit `log_k` und `delta_h`. Heraus kommt ein Eintrag im Format der Pakete, mit Quellen, und eine Liste dessen, was noch fehlt: Die Bildungsenthalpie, das Kennzeichen des Stoffs (aus der Summenformel, etwa `C2H6O(aq)`) und die Gleichgewichte prüft und trägt man von Hand ein.

Was es schon gibt, lässt sich über `data` nicht ändern: Ein Eintrag für einen vorhandenen Stoff, eine vorhandene Reaktion oder Vorratsflasche wird nur angenommen, wenn er dem vorhandenen gleicht. So verändert der Aufbau einer Folie nie die Stoffe, mit denen eine andere gerade rechnet. Was aus der Formel folgt – molare Masse, Ladung, Zustand – lässt sich gar nicht überschreiben.

## Eigene Szenen in 3D

Szenen und das Aussehen der Geräte in 3D lassen sich nachtragen, wie Stoffe. Sie stehen in einem eigenen Skript des Kurses:

```
<!--
import: https://raw.githubusercontent.com/LiaTemplates/Lia-ChemLab/0.0.1/README.md
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
- **Thiosulfat und Säure:** In Säure liegt ein Teil des Thiosulfats als Hydrogenthiosulfat vor, und dieses zerfällt zu Schwefel und Schwefeldioxid. Deshalb wächst die Geschwindigkeit mit der Thiosulfat-Konzentration und nur schwach mit der Säure. Der Schwefel bleibt als Kolloid in der Schwebe (nur in der Zentrifuge setzt er sich ab); ab 6,9 mmol/L sieht man nicht mehr hindurch.
- **Redoxreaktionen in Lösung:** Permanganat mit Eisen(II) und mit Wasserstoffperoxid, Kupfer(II) und Eisen(III) mit Iodid sind als sofortige Reaktionen eingetragen. Sie setzen in jedem Rechenschritt um, was an freien Teilchen da ist; was in Ionenpaaren oder Komplexen steckt, kommt über das Gleichgewicht nach, so dass ein Tropfen Permanganat in ein bis zwei Sekunden entfärbt ist. Die beiden Reaktionen mit Iodid laufen nur bis zu ihrem Gleichgewicht, das aus den Standardpotentialen folgt (`logK`): mit Iodid im Überschuss praktisch vollständig, neben schwerlöslichem Silberiodid gar nicht. Eine sofortige Reaktion, der ein Ausgangsstoff bis auf Spuren fehlt (Permanganat und Eisen(II) ohne Säure im Alkalischen), läuft unmerklich langsam und hält die Uhr nicht an.
- **Ioduhr:** Peroxodisulfat oxidiert Iodid langsam (erste Ordnung in beiden), Iod und Thiosulfat reagieren sofort: Eine solche Reaktion kommt in jedem Rechenschritt nach den langsamen an die Reihe und setzt um, was da ist. Solange Thiosulfat da ist, bleibt kein Iod stehen. Stärke bindet Iod zu einem blauen Komplex, der in der Wärme zerfällt.
- **Marmor:** Körner und Pulver lösen sich nach dem Geschwindigkeitsgesetz für Calcit aus der Datenbank von PHREEQC: proportional zur Oberfläche und zur Konzentration der Wasserstoff-Ionen, mit kleiner Aktivierungsenergie (8,5 kJ/mol), weil der Nachschub an Säure die Geschwindigkeit bestimmt. Wie weit, sagt das Löslichkeitsgleichgewicht. Löst sich ein Stück so langsam, dass weder Blasen aufsteigen noch das Stück sichtbar kleiner wird, lässt der Baustein es liegen. Liegen mehrere solche Feststoffe im Glas, folgt jeder seinem eigenen Gesetz; ein Niederschlag desselben Stoffs daneben löst sich wie jeder frische Niederschlag in wenigen Sekunden.
- **Wasserbad:** Das Gefäß tauscht mit dem Bad 25-mal so gut Wärme wie mit einer Flamme: Ein Reagenzglas mit 5 mL hat nach einer Minute die Temperatur des Bades, ein Becherglas mit 50 mL nach drei bis vier Minuten. Was das Bad erwärmt, meldet das Protokoll nicht als Reaktionswärme.
- **Fotometer:** Die Extinktion ist die Summe über alle gelösten Teilchen aus Absorptionskoeffizient bei der gewählten Wellenlänge, Konzentration und 1 cm Schichtdicke; dazu kommt die Trübung durch alles, was schwebt, bei jeder Wellenlänge gleich. Die Anzeige folgt mit einer halben Sekunde Verzögerung und endet bei 3. Von einem Stoff, von dem nur die Farbe eingetragen ist, kennt das Fotometer drei breite Bereiche (blau, grün, rot).
- **Teilchenlupe:** Je 20 mmol/L eines gelösten Teilchens ein Punkt, gerundet; was darunter liegt, erscheint nicht. Über 2,4 mol/L gelöster Teilchen wird der Maßstab gröber, damit es höchstens 120 Punkte sind. Feststoffe erscheinen als bis zu zwölf Bausteine, nach ihrem Anteil. Der Ort jedes Teilchens folgt aus seiner Nummer und dem Weg, den es schon hinter sich hat; je wärmer, desto schneller kommt es voran, mit der Wurzel der absoluten Temperatur.
- **Wärme:** Die Reaktionswärme folgt nach dem Satz von Hess aus den Bildungsenthalpien, etwa −55,8 kJ/mol für die Neutralisation und −467 kJ/mol für Magnesium in Säure. Wo eine Bildungsenthalpie fehlt, gilt die Reaktionsenthalpie aus der Datenbank; wo auch die fehlt, rechnet der Vorgang ohne Wärme. Sie erwärmt Lösung und Glas; das Gefäß gibt Wärme an den Raum ab und kühlt wieder aus.
- **Kalorimeter:** Es nimmt 10 J/K auf und gibt 0,012 W/K an den Raum ab, ein Zwanzigstel des Becherglases mit 250 mL (0,25 W/K); beides ist für zwei Styroporbecher mit Deckel geschätzt. Neutralisiert man darin je 50 mL Säure und Lauge von 1 mol/L, verliert es in fünf Minuten weniger als 0,3 °C. Die höchste Temperatur steht im Protokoll, sobald es merklich abkühlt (0,3 °C) oder 20 s lang nicht mehr wärmer wird.
- **Lösungswärme:** Ammoniumnitrat, Natriumhydroxid und Calciumchlorid lösen sich nach ihrem Löslichkeitsgleichgewicht, so schnell, wie ihre Oberfläche es erlaubt (etwa eine halbe Minute für 2 g in 50 mL). Die Wärme folgt aus den Bildungsenthalpien: +25,5, −44,8 und −81,4 kJ/mol; die Konstanten der Gleichgewichte sind aus denselben Tabellenwerten gerechnet.
- **Streuung** (mit `scatter`): Jedes Messgerät weicht fest um einen ausgelosten Betrag ab und rauscht dazu; das Rauschen wechselt jede Sekunde, und die Trägheit des Geräts glättet es. Die größten Abweichungen (fest / Rauschen, geschätzt nach Schulgeräten): Thermometer 0,3 / 0,05 °C, pH-Meter 0,05 / 0,01, Leitfähigkeit 2 % / 0,5 %, Fotometer 0,005 + 1 % / 0,002, Manometer 0,01 / 0,002 bar, Strom- und Spannungsmesser 1 % / 0,5 mA bzw. 2 mV (ohne Strom zeigt der Strommesser 0), Kolbenprober 2 % ohne Rauschen und höchstens 100 mL, Waage 0,02 % / 0,005 g (Tara stellt sie genau auf null). Das Rauschen liegt auf der Anzeige, nach der Trägheit des Fühlers. Am Ende seiner Skala zeigt ein Gerät das Ende. Die Chemie rechnet weiter mit den wahren Werten, nur das Umgießen trifft dann ungefähr (siehe „Abmessen“); Aufgaben, Diagramme, Tabelle und die höchste Temperatur im Protokoll sehen die Anzeige. Die Auslosung bleibt beim Zurückspulen und Zurücksetzen dieselbe. Im Ruhezustand steht die Uhr und mit ihr das Rauschen.
- **Gefahrstoffkennzeichnung:** Aus der Einstufung des reinen Stoffs folgt die der Lösung nach den Gemisch-Regeln der CLP-Verordnung (Anhang I): spezifische Konzentrationsgrenzen, wo es sie gibt, sonst die allgemeinen; die akute Toxizität beim Verschlucken und beim Einatmen über den Schätzwert des Gemischs (Schätzwert durch Massenanteil); die Umweltgefahren über die M-Faktoren (chronisch 2 allein: Piktogramm ohne Signalwort). Danach die Vorrangregeln für Piktogramme und Signalwort. Der Massenanteil folgt aus der Zusammensetzung der Flasche. Grundlage sind die harmonisierten Einstufungen (CLP Anhang VI, bis zur 22. Anpassung), sonst die üblichen der Lieferanten.
- **Entsorgen:** Der passende Behälter folgt aus dem Inhalt, in dieser Rangfolge: Reste von Alkalimetallen gehören in keinen Behälter, sondern zurück zur Lehrkraft, ebenso ammoniakalische Silberlösung (Tollens-Reagenz), die beim Stehen explosives Silbernitrid bildet; Ionen oder Verbindungen von Schwermetallen (Kupfer, Zink, Silber, Barium, Chrom, Cobalt, Mangan, Nickel, Blei, Cadmium, Quecksilber, Zinn, Arsen, Antimon, Thallium, Selen, Vanadium, Molybdän, Bismut, Uran), gelöst oder als Niederschlag, zu den Schwermetallsalzen; Bleichlauge, Chlor, Brom und Iod (ab 10 µmol) erst mit Natriumthiosulfat reduzieren; Sulfit (ab 10 µmol, auch als Hydrogensulfit oder gelöstes Schwefeldioxid) erst mit Wasserstoffperoxid zu Sulfat oxidieren, weil es mit Säuren Schwefeldioxid freisetzt; organische Lösungsmittel ab 15 % des Volumens zu den organischen Lösungsmitteln; eine Flüssigkeit mit pH unter 6 oder über 9 zu den Säuren und Laugen (oder vorher neutralisieren), auch wenn noch Feststoffreste darin liegen; Stücke aus dem Regal (ab 10 mg) und ein trockener Rückstand zu den Feststoffen; alles andere darf in den Ausguss. Lässt sich kein pH-Wert rechnen (konzentrierte Säure, Brei), entscheidet der Überschuss an Säure oder Lauge. Eine harmlose Lösung in einem Sammelbehälter gilt als richtig, mit dem Hinweis, dass der Ausguss genügt hätte. Bei unbekannten Proben sagt das Protokoll nur, ob der Behälter passte. Angelehnt an die Regeln der Schulen (DGUV Regel 113-018).
- **Abmessen:** Ohne Streuung gießt das Labor genau die eingestellte Menge um. Mit `scatter` trifft Umgießen nur ungefähr: nach Augenmaß auf 5 % genau; ist ein Messzylinder beteiligt (bis zur Marke füllen oder ablesen), mit seiner Fehlergrenze nach DIN ISO 4788, Klasse B: 10 mL ±0,2, 25 mL ±0,5, 50 und 100 mL ±1 mL; mit der Vollpipette auf 0,2 %. Ausgelost je Quelle, Ziel und Zeitpunkt, gleichverteilt im Fehlerband. Alles auszugießen gelingt immer genau, und wer nur einen Teil abgießt, lässt immer einen Rest im Glas. Das Protokoll nennt die eingestellte Menge, unter dem Glas steht die tatsächliche. Zugeben aus dem Regal bleibt genau. Ein Messzylinder wird nicht erhitzt.
- **Filtrieren:** Der Trichter läuft von selbst mit 0,5 mL/s ins Gefäß darunter (geschätzt für einen Rundfilter), solange darin Flüssigkeit ist und darunter Platz. Durch das Filter geht nur die Lösung und, was kolloid verteilt ist (Schwefel); alles andere bleibt als Rückstand im Filter. Wird ein Glas ganz in den Trichter ausgegossen, kommen auch der Bodensatz und die Stücke aus dem Regal mit (aufgeschwemmt); wer nur einen Teil abgießt, lässt den Bodensatz im Glas.
- **Zentrifugieren:** Ein Niederschlag setzt sich mit einer Zeitkonstante ab: 25 s, flockige Hydroxide 60 s, Metallpulver 4 s (geschätzt). In der laufenden Zentrifuge ist sie 20-mal kürzer, so dass Kupferhydroxid nach etwa 20 Sekunden fest am Boden liegt. Schon die Zeiten ohne Zentrifuge sind verkürzt, damit man nicht lange warten muss (ein flockiger Niederschlag braucht im Labor viele Minuten); der Faktor 20 ist deshalb nicht die echte Zentrifugalbeschleunigung, sondern so gewählt, dass die Zentrifuge etwa so lange braucht wie eine Schulzentrifuge, eine halbe bis eine Minute. Ein Kolloid, das sich sonst nie absetzt, setzt sich in ihr mit einer Zeitkonstante von 60 s ab (geschätzt): Nach einer Minute liegt etwa ein Drittel unten, nach fünf Minuten fast alles, wenn kein neues entsteht. Solange sie läuft, kommt nichts in das Glas hinein oder heraus, und die Uhr läuft.
- **Thermometer:** Es folgt der Temperatur mit einer Verzögerung von etwa drei Sekunden und reicht bis 110 °C; darüber zeigt es das Ende seiner Skala. Die Temperaturkurve im Diagramm ist das, was das Thermometer zeigt; ohne Thermometer gibt es keine Kurve.
- **Zugießen** dauert je nach Menge eine halbe bis vier Sekunden, ein Tropfen eine Viertelsekunde. Deshalb schlägt der Indikator mitten im Zugießen um.
- **Farbe:** Lambert-Beer für jede Wellenlänge des sichtbaren Lichts, danach Umrechnung in eine Bildschirmfarbe. Die Schichtdicke ist die Weite des Gefäßes: 1,4 cm im Reagenzglas, 5 cm im Becherglas für 100 mL.
- **Brenner:** Die Flamme gibt Wärme ab, die mit dem Abstand zur Flammentemperatur sinkt: 600 °C leuchtend, 1150 °C rauschend. In 100 mL Wasser im Becherglas kommen rund 220 W an; es siedet nach etwa drei Minuten. Ein leeres Gefäß wird mehrere hundert Grad heiß.
- **Sieden und Eindampfen:** Bei 100 °C verdampft Wasser, und die Temperatur bleibt stehen; gerechnet wird nie mit einer Lösung über 100 °C. Dabei wird die Lösung konzentrierter, bis Salze auskristallisieren. Oberhalb von 25 mol/L gelösten Teilchen gilt der Rest als Brei: Er verdampft weiter, aber mit ihm wird nicht mehr gerechnet. Ist das Wasser fort, zerfallen Komplexe, was ein Salz bilden kann, kristallisiert, die Ionen schwacher Säuren und Basen treten wieder zum Molekül zusammen, Flüchtiges (Chlorwasserstoff, Ammoniak, Essigsäure) entweicht, und der Rest bleibt als Rückstand am Glas. Er löst sich in neuem Wasser wieder; ein einzelner Tropfen reicht dafür nicht.
- **Sieden von Gemischen:** Gelöste Stoffe mit Siedepunkt (`Tb`) sind flüchtig. Die Siedetemperatur einer Mischung ist die Temperatur, bei der die Dampfdrücke von Wasser und den flüchtigen Stoffen zusammen den Luftdruck erreichen: jeder nach dem Raoultschen Gesetz mit seinem Stoffmengenanteil und seinem Dampfdruck nach Clausius-Clapeyron, für Ethanol und Wasser mit Aktivitätskoeffizienten nach Van Laar. Der Dampf hat die Zusammensetzung, die zu diesen Dampfdrücken gehört, und ist deshalb reicher am leichter Flüchtigen. Ein Liebigkühler leitet ihn in die Vorlage, wo er bei Raumtemperatur wieder flüssig wird; ohne Kühler entweicht er. Ein flüchtiger Stoff mit Geruch riecht, sobald sein Dampfdruck über der Lösung 5 mbar erreicht.
- **Gase über der Lösung:** Kohlenstoffdioxid, Ammoniak und Chlorwasserstoff stehen mit ihrer Lösung im Gleichgewicht. Ist mehr gelöst, als sich bei Luftdruck halten kann, perlt der Überschuss in ein bis zwei Sekunden aus. Deshalb sprudelt Soda mit Salzsäure von 1 mol/L, mit stark verdünnter aber nicht. Beim Sieden nimmt der Dampf gelöste Gase mit. Ein stechender Geruch wird gemeldet, sobald der Druck eines solchen Gases 5 mbar erreicht.
- **Gasraum:** Entstandenes Gas steht zuerst über der Flüssigkeit. Was dort keinen Platz hat, wird verdrängt; aus dem offenen Gefäß verfliegt der Rest: Wasserstoff in etwa 8 s, Sauerstoff in 40 s, Kohlenstoffdioxid in 90 s. Im Diagramm der Stoffmengen zählt das entwichene Gas weiter mit.
- **Indikatorpapier:** Sein Wasserfilm steht mit jedem Gas im Gleichgewicht, das ein Lösungsgleichgewicht hat (Ammoniak, Chlorwasserstoff, Kohlenstoffdioxid, Schwefeldioxid, Chlor): mit dem Teildruck im Gasraum oder, wenn er höher ist, mit dem Druck, den das Gas über der Lösung hätte. Unter 10 ppm (1·10⁻⁵ bar) erreicht ein Gas das Papier nicht merklich; so färbt verdünnte Salzsäure es nicht, konzentrierte schon, und über Ammoniumchlorid ohne Lauge bleibt es grün. Gerechnet wird wie in 10 mL Wasser mit drei Tropfen Universalindikator bei Raumtemperatur, zwei Sekunden lang, so lange man das Papier hinhält; von dort kommen pH-Wert und Farbe. In dieser Zeit bleicht Chlor den Farbstoff. Die Nachweisgrenze ist geschätzt.
- **Alkalimetalle** (Paket): Sie reagieren mit Wasser nach einem Geschwindigkeitsgesetz mit ihrer Oberfläche, wie Magnesium in Säure. Die Konstanten sind geschätzt, nach der Zeit, in der ein Stückchen im Schulversuch verbraucht ist; die Wärme folgt aus den Bildungsenthalpien.
- **Chlor:** Gelöstes Chlor steht mit Chlorgas im Gleichgewicht (Henry-Konstante nach Sander 2015) und reagiert mit Wasser zu hypochloriger Säure (Wang und Margerum 1994), deren pKs 7,53 ist. Chlor, das an einer Elektrode entsteht, perlt durch die Lösung und gibt dabei einen Teil ab wie eine Blase aus dem Gasableitungsrohr, also gut 90 %, in Lauge mehr. Dieser Anteil ist aus dem Rohr übernommen, nicht für Elektroden gemessen; er macht die Lösung bei der Elektrolyse von Kochsalzlösung nach einigen Minuten weniger alkalisch als ohne ihn. So entsteht bei der Elektrolyse von Kochsalzlösung Bleichlauge.
- **Mischwärme beim Zugeben:** Was aus dem Regal zugegeben, umgegossen oder aus der Bürette getropft wird, mischt sich zuerst nur mit einem Teil des Inhalts: so viel, wie es selbst ist, oder, wenn es schwerer ist und durchsinkt, mit zehnmal so viel. Für diese Mischzone rechnet der Baustein Gleichgewichte und sofortige Reaktionen für sich. Wird sie mehr als 5 K heißer als der Siedepunkt des Wassers, spritzt es, und ein Teil der Flüssigkeit fliegt aus dem Gefäß, umso mehr, je heißer. Die Wärme selbst bucht wie immer das ganze Gefäß. Der Faktor zehn ist geschätzt.
- **Heiße Stellen:** Jedes Stück aus dem Regal hat seine eigene Temperatur. Die Reaktionen an seiner Oberfläche heizen es; es gibt die Wärme an das Wasser ab (0,35 W/(cm² K)) oder, trocken, an die Luft (0,002 W/(cm² K)) und durch Strahlung (Emissionsgrad 0,8). Beide Übergangszahlen sind geschätzt; die im Wasser ist so gewählt, dass Lithium (132 °C) fest bleibt, Natrium (gut 350 °C) schmilzt und Kalium (gut 600 °C) den Wasserstoff zündet. Ein Stück mit Schmelzpunkt (`Tm`) darunter ist geschmolzen; eines, das leichter ist als Wasser (`rho`), schwimmt. Ab 525 °C glüht es in der Farbe, die das Plancksche Strahlungsgesetz für seine Temperatur ergibt. Ab 560 °C, der Zündtemperatur von Wasserstoff in Luft, verbrennt der Wasserstoff, den ein schwimmendes Stück freisetzt, mit Sauerstoff aus der Luft, in der Flammenfarbe des Metall-Ions. Geschmolzenes Metall, das mehr als 30 W/cm² freisetzt, spritzt. Die Wärme selbst bleibt beim Gefäß, wie bisher. Die Wärme an der Oberfläche folgt aus dem Geschwindigkeitsgesetz je cm²; sie hängt deshalb nicht davon ab, wie groß das Stück noch ist, und ein Stück wird zum Schluss nicht heißer. Heißer als 1500 °C wird ein Stück im Wasser nicht. Was selbst brennt (Holzkohle, Schwefel, Magnesium), zeigt sein eigenes Feuer; seine Verbrennungswärme heizt das Stück nicht zusätzlich.
- **Span und Glimmspan** prüfen den Gasraum. Zwischen 4 und 75 Volumenprozent Wasserstoff verpufft das Gemisch, sofern genug Luft dabei ist; aus der freigesetzten Energie folgt, ob es „plopp“ macht, pfeifend knallt oder laut. Über 800 J zerspringt das Gefäß. Fast reiner Wasserstoff brennt ruhig an der Öffnung ab. Eine Brennerflamme unter dem Gefäß zündet ein solches Gemisch ebenfalls: einmal mit einer Verpuffung, danach brennt an der Öffnung ab, was nachkommt. Über 30 % Sauerstoff flammt der Glimmspan auf, unter 15 % erlischt der brennende Span. An ein Gefäß mit Stopfen lässt sich kein Span halten.
- **Kolbenprober:** Er verschließt das Gefäß. Eingeschlossen sind die Luft im Gasraum (samt der Luft, die man vorher aufgezogen hat) und alles Gas, das entsteht; ihr Volumen folgt dem Gasgesetz bei der Temperatur des Inhalts. Frei steht der Kolben so, dass Luftdruck herrscht; über dem Anfangsvolumen zeigt er an, was hinzukam, bis 100 mL, dann springt der Kolben heraus (siehe Druck). Kühlt das Gefäß unter die Anfangstemperatur ab, steht er am Anschlag, und es herrscht Unterdruck. Hält man den Kolben fest, bleibt das Volumen, und der Druck ändert sich (Boyle); über 1,5 bar fliegt der Kolbenprober heraus wie ein Stopfen. Luft vorher aufziehen: im Aufbau mit `fill` oder allein am Schieber. Wasserdampf zählt nicht mit, er schlägt sich im Zylinder nieder. Wird das Gefäß ausgeleert, zählt er von vorn.
- **Waage:** Sie zeigt die Masse des Glases und von allem, was darin ist: gelöst, fest und im Gasraum darüber. Das Glas wiegt so viel, wie seine Wärmekapazität bei 0,84 J/(g K) ergibt: ein Reagenzglas 20,2 g, ein Becherglas mit 100 mL 35,7 g. Was aus dem offenen Gefäß entweicht, fehlt; ein Kolbenprober hält es im System, bis er voll ist. Die Anzeige folgt mit einer halben Sekunde Verzögerung. „Tara“ zieht ab, was in diesem Augenblick darauf steht.
- **Druck:** In einem verschlossenen Gefäß stehen im Gasraum die Luft, die beim Verschließen darin war, die entstandenen Gase und der Wasserdampf mit seinem Dampfdruck (Clausius-Clapeyron); der Druck folgt aus dem Gasgesetz für die Temperatur des Inhalts. Ein Gummistopfen hält bis 1,5 bar, dann fliegt er heraus, und das Gas entweicht; ein Manometer ist ein solcher Stopfen, der den Druck anzeigt. Mit einem Gasableitungsrohr gleicht sich der Druck aus: Darüber geht mit dem Gas auch Luft hinaus; darunter steigt Flüssigkeit aus dem zweiten Gefäß zurück, so viel, wie zum Ausgleich fehlt, oder, ist es leer, Luft. Trifft zurückgestiegene Flüssigkeit auf ein Glas, das heißer ist als 200 °C, zerspringt es. Ein Kolbenprober hält den Luftdruck; ist er voll und es entsteht weiter Gas, springt der Kolben heraus, er löst sich vom Gefäß und behält seine Anzeige. Die 1,5 bar und die 200 °C sind geschätzt.
- **Gasableitungsrohr:** Es verschließt das Gefäß wie der Kolbenprober. So viel Gas, wie dort entsteht, schiebt es aus dem Gasraum in das zweite Gefäß, im Verhältnis seiner Zusammensetzung: zuerst vor allem Luft, die nicht gerechnet wird, dann zunehmend das Gas selbst. Steht im zweiten Gefäß Flüssigkeit, perlt das Gas hindurch. Ein Gas mit Lösungsgleichgewicht (Kohlenstoffdioxid, Ammoniak, Chlorwasserstoff, Schwefeldioxid) geht in Lösung und reagiert dort; was über die Sättigung bei Luftdruck hinausgeht, perlt wieder aus. Andere Gase steigen durch und stehen im Gasraum darüber. Ein leeres Gefäß fängt das Gas auf. Dampf aus einem siedenden Gefäß schlägt sich im zweiten nieder wie in der Vorlage eines Kühlers. Fehlt das zweite Gefäß, geht das Gas ins Freie.
- **Verbrennung:** Ein Feststoff entzündet sich bei seiner Zündtemperatur und brennt dann von selbst weiter, mit Sauerstoff aus der Luft. Seine Oberfläche bestimmt, wie schnell. Der größte Teil der Wärme geht mit Licht und heißen Gasen fort; das Gefäß erwärmt die Flamme wie ein Brenner, es wird also nie heißer als sie. Unter Wasser und im verschlossenen Gefäß brennt nichts.
- **Flammenfärbung:** Jedes Teilchen mit einer Flammenfarbe trägt nach Konzentration und Leuchtkraft bei; die Farben mischen sich. Zu sehen ist sie nur in der rauschenden Flamme und vergeht nach vier Sekunden.
- **Leitfähigkeit:** Jedes Ion trägt mit seiner Konzentration, dem Quadrat seiner Ladung und seinem Diffusionskoeffizienten bei (Nernst-Einstein); je Grad wärmer leitet die Lösung 2 % besser. Reines Wasser kommt so auf 0,055 µS/cm, Salzsäure mit 0,01 mol/L auf 4,3 mS/cm.
- **Metalle in Lösungen:** Jedes Stück Metall ist eine Oberfläche, an der Oxidation und Reduktion zugleich ablaufen. Für jedes Redoxpaar wächst der Strom exponentiell mit dem Abstand des Potentials von seinem Standardpotential (Butler-Volmer), gehemmt durch die Überspannung und begrenzt durch den Nachschub aus der Lösung. Das Potential stellt sich so ein, dass sich beide Richtungen die Waage halten. So verdrängt Zink das Kupfer so schnell, wie Kupfer-Ionen nachkommen; in Säure entwickelt es Wasserstoff, in Wasser praktisch nichts, in Natronlauge langsam (es geht als Zinkat in Lösung). Zum Nachschub zählt auch, was im Gleichgewicht gebunden ist und dort wieder frei wird: Kupfer aus dem Ammin-Komplex, Wasserstoff-Ionen aus der schwachen Säure. Was langsamer abliefe als 0,1 nmol Elektronen je Sekunde, findet nicht statt.
- **Elektroden** sind Platten von 2 cm Breite, die bis 0,5 cm über den Boden des Becherglases tauchen; ihre Fläche folgt aus der Füllhöhe. Was sich auf ihnen abscheidet, bleibt als Belag und zählt zu ihrer Masse. Ein dichter Belag bestimmt, wie sich die Oberfläche verhält.
- **Stromkreis:** Zwei Elektroden im selben Glas (oder je eine in zwei Gläsern mit Salzbrücke) bilden mit den angeschlossenen Geräten einen Stromkreis. Netzgerät, Lämpchen und Strommesser liegen in Reihe, der Spannungsmesser zwischen den Elektroden. Geschlossen ist der Kreis, sobald eines der drei ersten angeschlossen ist; ein Netzgerät, das auf 0 V steht, gilt als ausgeschaltet und schließt ihn nicht. Gesucht wird der Strom, bei dem die Spannung des Netzgeräts gerade für die Potentiale der beiden Elektroden, den Widerstand der Lösung (aus Leitfähigkeit und Eintauchtiefe), das Lämpchen (54 Ω) und die Leitungen (0,5 Ω) reicht. Unterhalb der Zersetzungsspannung fließt deshalb fast nichts.
- **Elektrolyse:** Der Strom setzt an jeder Elektrode nach Faraday um: 96 485 C je Mol Elektronen. Laufen mehrere Vorgänge an einer Elektrode, teilen sie sich den Strom nach Potential, Überspannung und Nachschub; an Graphit entsteht deshalb aus Chlorid-Lösung Chlor und kaum Sauerstoff, und Zink scheidet sich ab, bevor Wasserstoff entsteht. Silber am Pluspol überzieht sich in Chlorid-Lösung mit Silberchlorid; umgepolt wird der Belag wieder zu Silber. Die Lösung erwärmt sich um das, was an Spannung über die Reaktionsenthalpie hinaus anliegt. In der Liste der Gleichungen steht ein Nebenvorgang erst, wenn er mindestens ein Zehntausendstel des Hauptvorgangs an derselben Elektrode ausmacht; gebucht wird er immer.
- **Galvanische Zelle:** Ohne Verbraucher zeigt der Spannungsmesser die Differenz der Potentiale; sie folgt der Nernst-Gleichung. Unter Last sinkt die Spannung um den Abfall am Innenwiderstand; die Salzbrücke hat 30 Ω. Sie gibt Kalium-Ionen dorthin ab, wo reduziert wird, und Nitrat-Ionen dorthin, wo oxidiert wird, so dass beide Lösungen neutral bleiben.
- **Bleiakku:** Bleisulfat und Bleidioxid decken als Belag die Bleiplatte ab, sobald sie 2 µmol je cm² eingetauchter Fläche erreichen (etwa 1 µm, geschätzt). Dann reagiert das Blei darunter nicht mehr, nur noch der Belag selbst; ist er ein Nichtleiter (Bleisulfat), läuft an ihm alles andere nur als Hauch (0,1 µA je cm²), Bleidioxid leitet. So wird Blei am Pluspol in Schwefelsäure zuerst zu Bleisulfat und dieses zu Bleidioxid (+1,69 V); am Minuspol wird Bleisulfat zu Blei (−0,36 V). Was an der Platte als Blei-Ion in Lösung ginge, fiele dort gleich als Bleisulfat aus; deshalb gibt es das Paar Pb²⁺/Pb nicht. Beim Entladen läuft alles zurück, bis das Bleidioxid verbraucht oder der Minuspol ganz mit Bleisulfat bedeckt ist. Wasserstoff ist an Blei stark gehemmt (Überspannung 0,95 V), Sauerstoff an Bleidioxid (0,80 V, beides geschätzt): Deshalb wird der Akku geladen, bevor Wasser zerlegt wird, und er entlädt sich kaum von selbst. In 2 mol/L Schwefelsäure zeigt er knapp 2 V.
- **Brennstoffzelle:** Von Wasserstoff und Sauerstoff, die an einer blanken Elektrode aus Platin oder Graphit entstehen (ohne Belag), bleibt ein Fünftel an ihrer Oberfläche haften, bis 1 µmol je cm² eingetauchter Fläche (geschätzt); der Rest perlt auf. Das haftende Gas steht dort als Ausgangsstoff bereit. Als Druck in bar zählt sein Anteil an dieser Höchstmenge hoch 4: Je leerer die Elektrode, desto fester hält sie den Rest, und so fällt die Spannung nach und nach. Umgesetzt wird es höchstens so schnell, dass es in 20 s verbraucht wäre. So stellt sich nach der Zerlegung von Wasser an jeder Elektrode das Potential ihres Gases ein, der Spannungsmesser zeigt die Differenz (in Säure gut 1 V), und ein geschlossener Kreis zieht einen abnehmenden Strom, bis das Gas verbraucht ist. Zugleich verliert es sich immer, auch während der Zerlegung, mit einer Zeitkonstante von zwei Minuten in den Gasraum über der Lösung (alles geschätzt); unter einem Zehntausendstel der Höchstmenge hält es kein Potential mehr und ist fort. Solange Gas haftet, läuft die Uhr. Ziele mit `has` zählen das haftende Gas mit.
- **Lämpchen:** Seine Helligkeit ist der Anteil an seiner Nennleistung. Ab 5 % davon gilt es als leuchtend.
- **Klang:** Brenner, Sieden, Sprudeln und Feuer sind gefiltertes Rauschen, dessen Lautstärke dem Geschehen folgt; Verpuffung und Knall sind kurze Rauschstöße, der laute Knall ist der lauteste; ein Begrenzer fängt seine Spitzen ab, damit nichts übersteuert. Töne gibt es nur, solange die Uhr vorwärts läuft. Der Knopf „Ton“ schaltet sie ab.
- **Zeit:** Gerechnet wird in Schritten von 0,05 s. Die Uhr läuft nur, solange sich etwas ändert, ein Brenner brennt oder Strom etwas umsetzt; danach hält sie an. Als Änderung zählt, was schneller als 1 nmol/s abläuft; von da an zeigt die Fläche bei einer Gasentwicklung auch Blasen. Auch eine Lösung, deren Extinktion sich in den letzten zehn Sekunden um mehr als ein Tausendstel geändert hat (verfolgt an fünf Stellen des Spektrums, bis zur Extinktion 4; darüber kommt kein Licht mehr durch), gilt als in Bewegung: So läuft die Uhr weiter, während ein Farbstoff verblasst, von dem nur Mikromol im Glas sind. Steht die Uhr, lässt ein zweiter Druck auf „Abspielen“ sie trotzdem zehn Minuten weiterlaufen; das hilft bei allem, was unmerklich langsam weitergeht. Gasblasen meldet das Protokoll, wenn sie eine Fünftelsekunde anhalten. Ein Eingriff an einem früheren Zeitpunkt setzt dort neu an, die spätere Aufzeichnung wird verworfen. Ganz am Anfang der Zeitleiste steht der Aufbau vor dem ersten Eingriff. Aufgezeichnet wird alle 0,1 s; bei langen Versuchen wird die Aufzeichnung gleichmäßig gröber, nach anderthalb Stunden sind es 1,6 s.

**Grenzen:**

- Jedes Gefäß gilt als durchmischt; Schlieren und Schichten gibt es nicht.
- Ein gespeicherter Versuch beginnt nach dem Laden bei seinem letzten Stand: Zurückspulen geht nur bis dorthin, nicht bis zum Anfang des Versuchs.
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
- Chlor löst sich nach dem Henry-Gesetz und bildet mit Wasser hypochlorige Säure; gelöstes Chlor, hypochlorige Säure und das Hypochlorit-Ion bleichen die Indikatorfarbstoffe und Kristallviolett zu einem farblosen Stoff, der vereinfacht ein Sauerstoffatom mehr trägt. Die Geschwindigkeit des Bleichens ist geschätzt. Andere Farbstoffe (Iod-Stärke, Metallkomplexe) bleicht es nicht, und Chlor oxidiert Iodid oder Bromid hier nicht.
- Ein Belag auf einer Elektrode hemmt den Strom nicht, außer Bleisulfat und Bleidioxid. Das Silberchlorid, mit dem sich eine Silber-Elektrode am Pluspol in Kochsalzlösung überzieht, wächst deshalb beliebig weiter; im Labor wird die Schicht dicht, und der Strom geht zurück. Die Bleibeläge decken die Platte dagegen ab einer festen Dicke ganz ab (geschätzt 1 µm), bezogen auf die eingetauchte Fläche: Wer nachfüllt, legt wieder Blei frei. Ein Bleiakku fasst deshalb immer gleich viel; dass er mit jedem Laden mehr fasst (Formieren), fehlt. Ganz entladen zeigt er ohne Last etwa 1 V statt knapp 2 V, weil das Blei unter dem dichten Bleisulfat im Modell kein festes Potential mehr hat.
- Zink löst sich in Natronlauge nur langsam und nur als Pulver sichtbar, in der Wärme deutlich schneller. Wie schnell genau, ist geschätzt.
- Weil jedes Gefäß durchmischt ist, zeigt ein Indikator bei der Elektrolyse nur das Ergebnis für die ganze Lösung, nicht die Zonen an den Elektroden. Wie viel Gas an Platin und Graphit haftet und wie schnell es sich verliert, ist geschätzt; an anderen Metallen und unter einem Belag haftet keines, und Chlor haftet nie. Gelöster Wasserstoff und Sauerstoff wandern nicht zur anderen Elektrode.
- Die Leitfähigkeit gilt für unendliche Verdünnung. In konzentrierten Lösungen ist sie zu hoch; mehrwertige Salze wie Kupfersulfat leiten im idealen Modell dagegen schlechter als im Labor, weil die ideale Rechnung zu viele Ionenpaare bildet. Im realen Modell zerfallen die Ionenpaare weiter: Kupfersulfat mit 0,5 mol/L leitet dann gut viermal so gut wie im idealen Modell und etwa doppelt so gut wie im Labor, und bei der Elektrolyse fließt entsprechend mehr Strom.
- Überspannungen und der Stoffübergang an Oberflächen sind geschätzt. Das Zink ist als technisches Zink eingestellt, das in Salzsäure sichtbar Wasserstoff entwickelt; reines Zink reagiert viel träger. Im Volta-Element entsteht deshalb der größere Teil des Wasserstoffs am Zink selbst und nur der Teil am Kupfer, der dem Strom entspricht. Die Hemmung von Magnesium und Eisen steht für ihre Oxidschichten.
- Elektroden passen nur in Bechergläser, zwei je Glas; nur dort lassen sich Netzgerät, Messgeräte und Lämpchen anschließen. Zu einem Glas (oder einem Paar mit Salzbrücke) gehört ein Stromkreis; frei verdrahten lässt sich nichts. An jedem Glas hängt höchstens eine Salzbrücke, und sie erschöpft sich nicht.
- Das Gasableitungsrohr gibt ein lösliches Gas vollständig an die Lösung ab, soweit sie es aufnehmen kann; im Labor steigt ein Teil der Blasen ungelöst hindurch. Deshalb gibt jede Blase nur einen Teil ab, je nach Löslichkeit: den Anteil 1 − e^(−K·R·T) mit der Henry-Konstante K des Gases (Kohlenstoffdioxid gut die Hälfte, Ammoniak und Chlorwasserstoff praktisch alles); der Rest steigt durch. Lauge bindet ein Gas schon unterwegs: Die wirksame Löslichkeit wächst um den Faktor 1 + 50 L/mol · [OH⁻] (geschätzt); so schluckt Natronlauge von 1 mol/L das Kohlenstoffdioxid fast ganz, Kalkwasser gut vier Fünftel. Wie tief die Flüssigkeit ist, zählt nicht.
- Die Waage rechnet ohne Auftrieb in der Luft, und Elektroden, Messfühler und Kolbenprober zählen nicht mit: Sie hängen am Stativ. Ein Gefäß auf der Waage lässt sich nicht zugleich heizen.
- Heiße Stellen gibt es nur an Stücken aus dem Regal, nicht an einem Niederschlag. Das Flitzen eines geschmolzenen Stücks ist gezeichnet, nicht gerechnet; brennen dort mehrere Stücke in einem Glas, zeigt sie nur eine Flamme. Der brennende Wasserstoff steht nicht in den Gleichungen, und seine Wärme geht mit der Flamme fort. Indikatorpapier wird nur über die Öffnung gehalten, nicht eingetaucht.
- Konzentrierte Schwefelsäure löst sich je Mol mit drei Mol Wasser; das ist so geschätzt, dass die Wärme beim Verdünnen mit wenig Wasser ungefähr der gemessenen entspricht (Wasser in viel Säure). Gelöste Schwefelsäure liegt als Hydrogensulfat vor und nimmt 35 mL/mol ein (partielles Molvolumen, ungefähr nach Millero), weniger als die 53,6 mL/mol der reinen Säure; die übrigen Ionen nehmen keinen Platz ein. Mischt man 5 mL Wasser in 20 mL Säure, stehen danach etwa 22 mL im Glas statt fast 25; 20 mL Säure in 50 mL Wasser ergeben etwa 59 mL statt gut 68. Die Säure im Organik-Paket (`sulfuric acid conc`) ist dagegen schon als Ionen eingetragen und gibt beim Verdünnen keine Wärme ab; sie dient dort nur als Katalysator.
- Die Mischwärme gilt beim Zugeben aus dem Regal, beim Umgießen und beim Tropfen aus der Bürette. Schlieren und Schichten, die sich dabei bilden, gibt es nicht; die Mischzone ist eine Abschätzung für den Augenblick des Zugebens.
- Ein Glas platzt nie allein durch Überdruck, denn der Stopfen gibt vorher nach; ein Unterdruck ohne Rohr bleibt ohne Wirkung. Den Druck zeigt nur ein Manometer, und nur in einem verschlossenen Gefäß.
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
- Organische Nachweise (Paket Organik): Hexen und Hexan mischen sich im Labor nicht mit Wasser, sie schwimmen als eigene Schicht obenauf; der Baustein rechnet sie gelöst, weil er keine zweite flüssige Phase kennt. Ethanal siedet schon bei 20 °C und riecht stechend; hier bleibt es in der Lösung und riecht nicht. Der Kupfer-Tartrat-Komplex der Fehling-Lösung ist vereinfacht und seine Konstante geschätzt, ebenso die Geschwindigkeiten der Nachweise; Fehling färbt sich nicht erst grün und gelb, bevor das Rot erscheint. Ein Silberspiegel bleibt im Glas, bis es geleert wird oder ein Oxidationsmittel wie Eisen(III)-chlorid ihn auflöst; Salpetersäure, mit der man ihn im Labor ablöst, gibt es nicht. Beim Kopieren des Aufbaus entsteht er von vorn, in dem Glas, in dem die Lösung dann steht. In Bürette und Trichter bildet sich kein Spiegel, das Silber fällt dort als Niederschlag aus. Bromwasser wird im Labor auch von Aldehyden und Glucose langsam entfärbt, und Kupfer(I)-oxid zerfällt in Säure; beides fehlt.
- Was langsamer als 1 nmol/s abläuft und die Farbe nicht merklich ändert, lässt die Uhr anhalten, auch wenn es nach langer Zeit sichtbar würde (eine stark verdünnte Ioduhr). Der zweite Druck auf „Abspielen“ lässt sie dann weiterlaufen.
- Stärke ist als Zahl von Plätzen für Iod gerechnet, je 18 Glucose-Einheiten einer; die Konstante des Komplexes und seine Wärmetönung sind geschätzt.
- Im idealen Modell ist Ammoniumnitrat schon bei 3,6 mol/L gesättigt; im Labor lösen sich in 100 g Wasser fast 200 g. Kaliumnitrat gibt es aus demselben Grund nicht als Feststoff: Die ideale Rechnung sättigte es schon bei 0,75 mol/L statt gut 3 mol/L. Ammoniumnitrat zersetzt sich beim Erhitzen nicht, auch trocken nicht. Natriumhydroxid löst sich nur in Wasser: In konzentrierter Schwefelsäure oder in Ethanol bleiben die Plätzchen liegen, und es wird nicht warm. Gerührt wird nicht eigens, jedes Gefäß gilt als durchmischt; Calciumchlorid ist das wasserfreie Salz, nicht das Hexahydrat, das sich unter Abkühlung löst.
- Gekennzeichnet werden nur die Flaschen aus dem Regal, nicht die Gemische, die in einem Glas entstehen. H- und P-Sätze fehlen. „Korrosiv gegenüber Metallen“ hat keine Gemisch-Regel; die Grenzen (Salzsäure, Schwefelsäure, Natronlauge ab etwa 0,05 bis 0,1 mol/L) folgen den Etiketten der Lieferanten. Indikatorlösungen tragen das Etikett der üblichen Schulprodukte in Ethanol, obwohl das Labor sie als wässrige Lösung rechnet. Entwürfe späterer Anpassungen (Kaliumbromid und Lithiumchlorid als fortpflanzungsgefährdend) und abweichende Angaben einzelner Lieferanten (Silbernitrat, Kaliumiodid) sind nicht oder nur in einer Fassung berücksichtigt; maßgeblich ist das Sicherheitsdatenblatt der echten Flasche. Die akute Toxizität bei Hautkontakt fehlt. Die Regel für starke Säuren und Basen (pH unter 2 oder über 11,5 ab 1 % ätzend) gilt nur, wo sie eingetragen ist (`xph`, bisher Ammoniak); Stoffe mit eigener Grenze bleiben bei ihr. Unsicher, weil Lieferanten sie verschieden einstufen: Zinkiodid (umweltgefährlich?), Eisen(III)-chlorid (korrosiv gegenüber Metallen, sensibilisierend?), Kupfer(II)-chlorid (giftig?), Kaliumiodid (Organschäden, nur bei einem Teil der Lieferanten) und der Schätzwert für Kaliumdichromat (oral 90,5 mg/kg; in der Literatur auch um 25).
- Beim Entsorgen gibt es je Inhalt genau einen richtigen Behälter; das pH-Fenster für den Ausguss (6 bis 9) ist streng. Wie man Sulfit oxidiert oder Silberlösung unschädlich macht, zeigt das Labor nicht vor, und beim Reduzieren von Bleichlauge entsteht Säure, die man danach neutralisiert. Viele Schulen sammeln anders (eigene Kanister für Chromate, Silber oder halogenhaltige Lösungsmittel, Neutralisieren statt Sammeln von Säuren und Laugen); Spuren unter 0,1 µmol zählen nicht, und ein Metallstück ist Feststoff, kein Schwermetallsalz.
- Die Zentrifuge braucht kein Gegengewicht: Ein echtes Gerät läuft unwuchtig und kann Schaden nehmen, wenn dem Glas gegenüber kein gleich schweres steckt; hier steckt in der Zentrifuge immer nur ein Glas. Sie hat nur eine Drehzahl, läuft ohne Anlauf und Auslauf, und die Reibung erwärmt nichts. Eine Zentrifuge, die für sich auf dem Tisch steht, lässt sich nicht nachträglich unter ein Glas stellen; man nimmt eine neue aus dem Regal.
- Das Filter hält jeden Niederschlag ganz zurück und lässt jedes Kolloid ganz durch; es läuft immer gleich schnell, auch wenn ein dicker Rückstand darin liegt. Auswaschen und Trocknen des Rückstands, Falten- und Rundfilter und das Absaugen fehlen. Hängt der Trichter über keinem Gefäß, hält er seine Flüssigkeit, wie eine Bürette mit geschlossenem Hahn.
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
