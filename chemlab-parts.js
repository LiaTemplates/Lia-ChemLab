/* ChemLab – Geräte, Texte und Zahlen.
   Jedes Gerät ist ein Eintrag in LiaChemLab.parts: die Physik steht in chemlab-engine.js,
   hier kommen Zeichnung (SVG als Text) und Maße dazu. Nichts hier fasst das DOM an.
   Koordinaten einer Zeichnung: Ursprung unten in der Mitte des Geräts auf der Tischkante, y nach oben negativ. */
(function start(global) {
  "use strict";

  var L = (global.LiaChemLab = global.LiaChemLab || {});
  if (!L.registerPart) { (L.pending = L.pending || {})["chemlab-parts.js"] = start; return; }      // der Rechenkern kommt noch und ruft diese Datei dann auf

  // ------------------------------------------------------------------ Texte

  L.strings = {
    en: {
      "shelf": "Shelf", "stage": "Bench", "reset": "Reset",
      "menu": "More functions", "shelf.tabs": "Compartments", "group.stuff": "Substances", "group.parts": "Equipment",
      "card.add": "Add", "card.gear": "Equipment", "card.info": "Contents", "card.close": "Close", "card.find": "Find a substance",
      "card.give": "Add {amount}", "card.pick": "Choose a substance, then add it.", "card.again": "Or tap the vessel once more.",
      "card.place": "Put on the bench:", "card.none": "No substance matches the search.", "hand.drop": "Back to the shelf", "hand": "In hand",
      "out.tabs": "Results", "out.eq": "Equations", "out.charts": "Charts", "out.log": "Log",
      "part.testtube": "test tube", "part.beaker": "beaker", "part.thermometer": "thermometer", "part.flask": "round-bottom flask", "part.condenser": "Liebig condenser", "part.reflux": "reflux condenser",
      "hint.still1": "Now tap the vessel to distil from.", "hint.still2": "Now tap the receiver for the distillate.",
      "sameStill": "The condenser leads into another vessel.",
      "part.tube": "gas delivery tube", "hint.tube1": "Now tap the vessel the gas comes from.", "hint.tube2": "Now tap the vessel to lead the gas into.",
      "sameTube": "The tube leads into another vessel.",
      "part.balance": "balance", "hint.scale": "Now tap the vessel to put on the balance – or the bench.", "tare": "Tare",
      "say.tare": "{part}: set to zero", "chart.mass": "Mass",
      "eq.catalyst": "catalyst",
      "restMore": "Press play once more to let it run for another ten minutes anyway.",
      "lens.paste": "Too little liquid for so much solute: a paste the particle view cannot look into.",
      "lens.residue": "No liquid in the vessel; a residue from evaporation lies at the bottom.",
      "lens": "Particle view", "lens.scale": "1 dot stands for {c} mmol/L.", "lens.water": "Water is only hinted at.", "lens.dry": "No liquid in the vessel.",
      "lens.none": "So little is dissolved that this small sample would show none of it.", "lens.hang": "suspended", "lens.solid": "solid",
      "part.bath": "water bath", "part.photometer": "photometer", "temp": "Temperature", "wave": "Wavelength", "transmission": "transmittance",
      "say.temp": "{part}: set to {temp} °C", "say.tempSet": "{part}: temperature changed",
      "say.wave": "{part}: set to {nm} nm", "say.waveSet": "{part}: wavelength changed", "unit.E": "A",
      "chart.A": "Absorbance", "chart.spectrum": "Spectrum: absorbance against wavelength", "chart.wave": "Wavelength in nm", "chart.photo": "Photometric titration",
      "part.phmeter": "pH meter", "part.burette": "burette",
      "part.dish": "evaporating dish", "part.burner": "burner", "part.syringe": "gas syringe",
      "part.splint": "Burning splint", "part.glowsplint": "Glowing splint", "part.rod": "Flame test rod",
      "part.conductometer": "conductivity meter", "part.supply": "power supply", "part.ammeter": "ammeter",
      "part.voltmeter": "voltmeter", "part.lamp": "lamp", "part.bridge": "salt bridge",
      "part.electrode-C": "graphite electrode", "part.electrode-Pt": "platinum electrode", "part.electrode-Cu": "copper electrode",
      "part.electrode-Zn": "zinc electrode", "part.electrode-Fe": "iron electrode", "part.electrode-Ag": "silver electrode",
      "group.water": "", "group.acid": "Acids and bases", "group.salt": "Salt solutions", "group.indicator": "Indicators",
      "group.solid": "Solids", "group.gear": "Equipment", "group.other": "Other solutions", "group.electric": "Electricity",
      "hint.electrode": "Now tap the beaker it should dip into.",
      "hint.circuit": "Now tap the vessel whose electrodes it is connected to.",
      "hint.bridge1": "Now tap the first vessel.", "hint.bridge2": "Now tap the second vessel.",
      "twoOnly": "This vessel already holds two electrodes.", "tooNarrow": "Electrodes only fit into a beaker.",
      "sameVessel": "The salt bridge needs two different vessels.",
      "noCircuit": "A circuit needs electrodes: this only works at a beaker.",
      "electrodeOf": "{name} electrode", "say.voltsSet": "{part}: voltage set",
      "volts": "Voltage", "flip": "Reverse polarity", "mass": "Mass", "massChange": "change", "coat": "deposit", "made": "made of",
      "lamp.bright": "shines brightly", "lamp.dim": "glows dimly", "lamp.dark": "dark",
      "pole.+": "positive pole", "pole.-": "negative pole",
      "say.plated": "{Name} deposits on {part}.", "say.platedOn": "{vessel}: {Name} deposits on the {metal}.",
      "say.bubbles": "Gas bubbles rise at {part}.", "say.spent": "{part} has dissolved.",
      "say.lampOn": "{part} lights up.", "say.lampOff": "{part} has gone out.",
      "say.volts": "{part}: set to {volts} V", "say.voltsOff": "{part}: switched off", "say.flip": "{part}: polarity reversed",
      "say.bridged": "{part} placed between {vessel} and {to}",
      "aria.between": "between {vessel} and {to}",
      "eq.ox": "Oxidation at {part}", "eq.red": "Reduction at {part}",
      "chart.I": "Current", "chart.U": "Voltage", "chart.IU": "Current against voltage", "chart.volts": "Voltage in V",
      "chart.m": "Mass of the electrodes", "chart.mUnit": "change", "chart.kappa": "Conductivity", "chart.conduct": "Conductometric titration",
      "hint.under": "Now tap the vessel it should stand under – or the bench.",
      "hint.join": "Now tap the vessel it should be connected to.",
      "hint.test": "Now tap the vessel whose mouth it is held to.",
      "hint.rod": "Now tap the vessel it is dipped into; then it goes into the flame.",
      "flame": "Flame", "flame.0": "off", "flame.1": "luminous", "flame.2": "roaring", "sound": "Sound",
      "noFlame": "This needs a burner with a roaring flame.",
      "closed": "This vessel is closed with a stopper.", "hand.bench": "Put on the bench",
      "brokenGlass": "This vessel is shattered.",
      "chart.V": "Gas volume",
      "say.flame": "{part}: flame set to “{state}”", "say.flameOff": "{part}: flame put out",
      "say.under": "{part} placed under {vessel}", "say.joined": "{part} connected to {vessel}",
      "say.boil": "{vessel}: The liquid boils.", "say.boilEnd": "{vessel}: The boiling stops.",
      "say.dry": "{vessel}: The liquid has evaporated, a solid residue remains.",
      "say.dryNone": "{vessel}: The liquid has evaporated completely.",
      "say.smell": "{vessel}: There is a pungent smell of {name}.", "say.smellFruity": "{vessel}: There is a fruity smell of {name}.",
      "say.ignite": "{vessel}: {name} catches fire.", "say.fireEnd": "{vessel}: The fire has gone out.",
      "say.splint": "{splint} held to {vessel}: {result}.",
      "splint.pop1": "a soft pop (hydrogen test positive)", "splint.pop2": "a squeaky pop (hydrogen test positive)",
      "splint.pop3": "a loud bang", "splint.burn": "the gas burns quietly",
      "splint.flare": "it burns brighter (oxygen)", "splint.relight": "it relights (oxygen)", "splint.out": "it goes out",
      "splint.calm": "it keeps burning quietly", "splint.glow": "it keeps glowing",
      "say.pop0": "{vessel}: The gas burns quietly at the mouth.",
      "say.pop1": "{vessel}: A soft pop: the gas in the vessel has ignited.",
      "say.pop2": "{vessel}: A squeaky pop! The gas in the vessel has ignited.",
      "say.pop3": "{vessel}: A loud bang! The gas in the vessel has exploded.",
      "say.flameTest": "Rod from {vessel} held in the flame: it glows {color}.",
      "say.flameNone": "Rod from {vessel} held in the flame: no colour.",
      "say.broken": "{vessel} is shattered!", "say.syringeFull": "{part} is full.",
      "aria.under": "under {vessel}", "aria.at": "connected to {vessel}", "aria.flame": "flame {state}", "aria.boiling": "boiling",
      "aria.residue": "residue", "aria.broken": "shattered", "aria.burning": "on fire",
      "amount": "Amount", "less": "less", "more": "more",
      "hint.hand": "Now tap a vessel.", "hint.tool": "Now tap the vessel it should go into.",
      "hint.over": "Now tap the vessel it should hang above.",
      "tap": "Tap", "tap.off": "closed", "tap.drop": "dropwise", "tap.slow": "slow", "tap.fast": "fast",
      "unit.ml": "mL", "unit.drop": "drops", "unit.g": "g",
      "full": "There is no room for that in this vessel.",
      "badAmount": "Please enter an amount in mL that is greater than zero.",
      "why.balance": "not balanced", "why.species": "unknown substance", "why.element": "unknown element",
      "why.phase": "the state (s, l, g, aq) is missing", "why.formula": "formula not readable", "why.equation": "equation not readable",
      "why.logK": "logK is missing", "why.rate": "rate data are missing or do not fit",
      "why.reagent": "reagent incomplete", "why.exists": "already entered differently",
      "why.color": "colour not written as #rrggbb", "why.charge": "solution not electrically neutral",
      "occupied": "This vessel already has such a piece of equipment.",
      "notHere": "That does not work with a burette.",
      "nothing": "There is nothing to pour from this vessel.",
      "time.start": "To the start", "time.back": "Play backwards", "time.play": "Play", "time.pause": "Pause",
      "time.end": "To the end", "time.speed": "Speed", "time.slider": "Point in time",
      "rest": "Nothing changes any more, the clock has stopped.",
      "cut": "From here on it starts anew. What was recorded after this point is discarded.",
      "panel.contents": "Contents", "panel.empty": "empty", "panel.volume": "Liquid", "panel.strength": "ionic strength", "panel.shows": "shows",
      "panel.given": "delivered:",
      "panel.pour": "Pour into", "panel.pourGo": "Pour", "panel.emptyOut": "Empty", "panel.remove": "Put away",
      "panel.none": "Tap a vessel to see what you can do with it.",
      "col.particle": "Particle", "col.amount": "Amount", "col.conc": "Concentration",
      "eq.title": "Reaction equations", "eq.none": "No reaction has taken place yet.",
      "eq.running": "running", "eq.extent": "Turnover",
      "chart.T": "Temperature", "chart.n": "Amounts of substance", "chart.time": "Time in s",
      "chart.pH": "pH value", "chart.titration": "Titration curve", "chart.volume": "Volume added in mL",
      "chart.noTool": "This curve needs a thermometer in a vessel.",
      "chart.noChange": "No amount of substance has changed yet.",
      "log.title": "Observations", "log.none": "Nothing observed yet.",
      "say.added": "{amount} {reagent} added to {vessel}",
      "say.poured": "{amount} poured from {from} into {vessel}",
      "say.placed": "{part} set up", "say.removed": "{part} put away", "say.emptied": "{vessel} emptied",
      "say.probe": "{part} placed in {vessel}", "say.hung": "{part} hung above {vessel}",
      "say.tap": "{vessel}: tap set to “{state}”", "say.tapOff": "{vessel}: tap closed",
      "say.tapFull": "{vessel}: The vessel below is full, the tap closes.",
      "say.solid": "{vessel}: A {color} precipitate forms.", "say.dissolved": "{vessel}: The precipitate dissolves.",
      "say.haze": "{vessel}: The liquid turns cloudy: finely divided {name}.", "say.opaque": "{vessel}: You can no longer see through the liquid.",
      "say.crystals": "{vessel}: {color} crystals separate out.",
      "say.dissolvedOne": "{vessel}: The {color} precipitate dissolves.",
      "the.white": "white", "the.yellow": "yellow", "the.orange": "orange", "the.red": "red",
      "the.pink": "pink", "the.violet": "violet", "the.blue": "blue", "the.cyan": "turquoise",
      "the.green": "green", "the.brown": "brown", "the.grey": "grey", "the.black": "black",
      "solid.white": "white", "solid.yellow": "yellow", "solid.orange": "orange", "solid.red": "red",
      "solid.pink": "pink", "solid.violet": "violet", "solid.blue": "blue", "solid.cyan": "turquoise",
      "solid.green": "green", "solid.brown": "brown", "solid.grey": "grey", "solid.black": "black",
      "say.gas": "{vessel}: Gas bubbles rise.", "say.gasEnd": "{vessel}: No more bubbles rise.",
      "say.gone": "{vessel}: {name} is used up.",
      "say.color": "{vessel}: The solution turns {color}.",
      "say.tempMax": "{vessel}: Highest temperature {T} °C, now it cools down.",
      "say.warm": "{vessel}: It got warm and now cools down.",
      "aria.vessel": "{name}: {content}", "aria.liquid": "{ml} mL, {color}", "aria.empty": "empty", "aria.in": "in {vessel}",
      "aria.over": "above {vessel}", "aria.cloudy": "cloudy", "aria.tap": "tap {state}", "aria.given": "{ml} mL delivered",
      "aria.sediment": "sediment",
      "failed": "The simulation could not calculate an equilibrium here. What is shown may be off.",
      "pale": "pale ",
      "color.colorless": "colourless", "color.yellow": "yellow", "color.orange": "orange", "color.red": "red", "color.pink": "pink",
      "color.violet": "violet", "color.blue": "blue", "color.cyan": "turquoise", "color.green": "green", "color.brown": "brown",
      "color.grey": "grey", "color.black": "black",
      "err.json": "The description of the setup is not valid JSON",
      "err.part": "There is no such piece of equipment",
      "err.reagent": "There is no such substance in stock",
      "err.place": "This name is used twice or does not belong to a vessel",
      "err.sample": "The unknown sample is not described correctly (unknown, oneOf with name and contains, only on a vessel)",
      "err.amount": "The amount is missing, does not fit the substance (solid in g, liquid in ml or drops) or is too large for the vessel",
      "err.size": "The vessel does not come in this size",
      "err.model": "There is no such calculation model (ideal or real)",
      "err.view": "There is no such view (2d or 3d)", "err.scene": "This scene setting does not fit",
      "view": "3D", "view.loading": "Loading the 3D view …", "view.failed": "The 3D view could not be shown, the bench stays 2D",
      "view.scene": "There is no such scene",
      "err.data": "Error in the custom substance data",
      "err.task": "The task cannot be read",
      "err.pack": "The pack could not be loaded", "err.dataJson": "The custom data are not valid JSON",
      "pack.json": "not valid JSON", "pack.net": "no connection", "pack.wait": "no answer", "pack.loading": "Loading pack: {url}", "packs.loading": "Loading packs …",
      "pack.done": "Pack loaded", "data.done": "Custom data added",
      "count.species": "{n} substance", "count.species.n": "{n} substances", "count.equilibria": "{n} equilibrium", "count.equilibria.n": "{n} equilibria",
      "count.reactions": "{n} reaction", "count.reactions.n": "{n} reactions", "count.couples": "{n} redox couple", "count.couples.n": "{n} redox couples",
      "count.reagents": "{n} stock bottle", "count.reagents.n": "{n} stock bottles",
      "copy": "Copy setup", "copy.manual": "The setup as text – select and copy:", "copy.done": "The text is on the clipboard.",
      "table.copy": "Copy the table", "table.manual": "The readings, separated by tabs – select and copy:",
      "table.note": "Note the readings", "table.clear": "Clear the table", "table.title": "Readings", "table.no": "No.",
      "table.given": "delivered", "table.noMeter": "No meter on the bench: there is nothing to note.",
      "task": "Task", "task.done": "Well done!", "goal.met": "met", "goal.open": "still open",
      "goal.min": "at least", "goal.max": "at most", "goal.from": "from", "goal.to": "to", "goal.in": "in {name}",
      "goal.has": "{name} is present", "goal.identify": "identify {name}", "sample": "sample {name}",
      "unknown.contents": "The contents are unknown.", "identify": "This is:", "identify.pick": "– choose –",
      "hidden.smell": "{vessel}: It smells pungent.", "hidden.fruity": "{vessel}: It smells fruity.", "hidden.haze": "{vessel}: The liquid turns finely cloudy.",
      "hidden.ignite": "{vessel}: Something catches fire.", "hidden.gone": "{vessel}: A substance is used up.", "hidden.plated": "{vessel}: A deposit forms.", "goal.gone": "{name}: no longer present",
      "measure.T": "Temperature", "measure.pH": "pH", "measure.kappa": "Conductivity", "measure.A": "Absorbance", "measure.V": "Gas volume", "measure.m": "Mass",
      "measure.I": "Current", "measure.U": "Voltage",
      "seen.gas": "Gas evolves", "seen.pop": "Hydrogen test: it pops", "seen.relight": "Glowing splint: it flares up", "seen.out": "Burning splint: it goes out",
      "seen.solid": "Precipitate", "seen.dissolved": "A solid dissolves", "seen.color": "Colour change", "seen.colorOf": "The solution turns {color}",
      "seen.boil": "The liquid boils", "seen.smell": "Smell", "seen.ignite": "Something burns", "seen.flame": "Flame colour",
      "seen.plated": "A metal is deposited", "seen.lamp": "The lamp lights up", "seen.broken": "The glass breaks",
      "err.other": "The setup cannot be shown"
    }
  };

  function text(key, lang, vars) {
    var table = L.strings[lang] || L.strings.en;
    var value = key in table ? table[key] : key in L.strings.en ? L.strings.en[key] : key;
    return vars ? value.replace(/\{(\w+)\}/g, function (all, name) { return name in vars ? vars[name] : all; }) : value;
  }

  // ------------------------------------------------------------------ Zahlen

  var commas = {};      // Sprache -> schreibt sie das Dezimalkomma?
  var RTL = /^(ar|fa|ur)$/;
  function localize(string, lang) {
    if (!(lang in commas)) try { commas[lang] = (1.5).toLocaleString(lang).indexOf(",") >= 0; } catch (error) { commas[lang] = false; }
    // in einem Text von rechts nach links bleibt die Zahl mit dem Zeichen davor bei ihrer Einheit ("5.1 mL")
    return (RTL.test(lang) ? "‎" : "") + (commas[lang] ? string.replace(".", ",") : string).replace("-", "−");
  }

  function num(value, digits, lang) {
    var fixed = value.toFixed(digits);
    return localize(/^-0(\.0+)?$/.test(fixed) ? fixed.slice(1) : fixed, lang);
  }

  // Stoffmenge mit drei geltenden Ziffern: mol, mmol oder µmol
  function amount(n, lang) {
    var size = Math.abs(n);
    if (!(size > 0)) return "0 mol";
    var step = size >= 1 ? [1, "mol"] : size >= 1e-3 ? [1e3, "mmol"] : [1e6, "µmol"];
    return localize((n * step[0]).toPrecision(3), lang) + " " + step[1];
  }

  function trim(value, lang) {      // "5", "2,5", "0,05" – ohne überflüssige Nullen
    return localize(String(+value.toPrecision(3)), lang);
  }

  function clock(seconds) {
    var s = Math.floor(seconds + 1e-9);
    return Math.floor(s / 60) + ":" + (s % 60 < 10 ? "0" : "") + (s % 60);
  }

  // Fehlertext aus dem Rechenkern: die Kennwörter in den Klammern in der Sprache des Kurses
  function explain(detail, lang) {
    return String(detail).replace(/\((\w+)(: |\))/g, function (all, code, tail) {
      var key = "why." + code, known = key in L.strings.en;
      return known ? "(" + text(key, lang) + tail : all;
    });
  }

  function colorWord(name, pale, lang) {
    return (pale ? text("pale", lang) : "") + text("color." + name, lang);
  }

  // Namen aus einer Sprachdatei (L.names[lang], nach id) gehen vor; eine Vorratsflasche mit Konzentration (of, c) heißt wie ihr Stoff
  function nameOf(entry, lang) {
    var own = L.names[lang] && L.names[lang][entry.of || entry.id];
    if (own) return entry.of ? own + " " + trim(entry.c, lang) + " mol/L" : own;
    return (entry.name && (entry.name[lang] || entry.name.en || entry.name.de)) || entry.id;
  }

  // Sprache der Seite. Google Translate, auch aus dem Menü von LiaScript, setzt <html lang> auf die Zielsprache.
  // Gilt, wenn es eine Tabelle gibt: en hier, alle übrigen als lang/<code>.json (LANGS); sonst Englisch.
  var LANGS = "am ar bg bn ca cs da de el es et eu fa fi fr ga hi hr hu hy it ja ka ko lt lv ms nb nl pa pl pt ro ru sk sl sq sv sw tr tw uk ur zh".split(" ");
  var ALIAS = { ak: "tw", no: "nb" };       // Codes von Google, die lia-localization anders schreibt
  function langOf(doc) {
    var tag = String((doc && doc.documentElement && doc.documentElement.lang) || "").toLowerCase().split(/[-_]/)[0];
    tag = ALIAS[tag] || tag;
    return L.strings[tag] || LANGS.indexOf(tag) >= 0 ? tag : "en";
  }

  // Name eines Geräts: aus der Texttabelle; bei einem eigenen Gerät seine Angabe name, bei einer eigenen Elektrode sonst der Name ihres Stoffs
  function partName(type, lang) {
    var key = "part." + type, def = L.parts[type] || {}, sp = def.electrode && L.db.species[def.electrode];
    if (key in L.strings.en) return text(key, lang);
    if (def.name) return def.name[lang] || def.name.en || def.name.de;
    return sp ? text("electrodeOf", lang, { name: nameOf(sp, lang) }) : type;
  }

  // Ziel einer Aufgabe als Text: "pH-Wert von 6 bis 8 in Becherglas 1"; names: Namen der Geräte nach ihrer id
  function goalText(goal, lang, names) {
    var out, unit, name;
    function value(x) { return trim(x, lang) + (unit ? " " + unit : ""); }
    if (goal.measure) {
      unit = L.MEASURES[goal.measure];
      out = text("measure." + goal.measure, lang) + " " + (goal.min != null && goal.max != null
        ? text("goal.from", lang) + " " + trim(goal.min, lang) + " " + text("goal.to", lang) + " " + value(goal.max)
        : goal.min != null ? text("goal.min", lang) + " " + value(goal.min) : text("goal.max", lang) + " " + value(goal.max));
    } else if (goal.has) {
      name = nameOf(L.species(goal.has), lang);
      if (goal.max != null && goal.max <= 1e-9 && goal.min == null) out = text("goal.gone", lang, { name: name });
      else if (goal.max == null && goal.min === 1e-6) out = text("goal.has", lang, { name: name });
      else out = name + ": " + (goal.min != null && goal.max != null
        ? text("goal.from", lang) + " " + amount(goal.min, lang) + " " + text("goal.to", lang) + " " + amount(goal.max, lang)
        : goal.min != null ? text("goal.min", lang) + " " + amount(goal.min, lang) : text("goal.max", lang) + " " + amount(goal.max, lang));
    } else if (goal.identify) out = text("goal.identify", lang, { name: text("sample", lang, { name: goal.identify }) });
    else if (goal.seen === "color" && goal.name) out = text("seen.colorOf", lang, { color: colorWord(goal.name, false, lang) });
    else out = text("seen." + goal.seen, lang) + (goal.species ? ": " + nameOf(L.species(goal.species), lang) : "");
    return out + (goal.in != null ? " " + text("goal.in", lang, { name: (names && names[goal.in]) || goal.in }) : "");
  }

  // Menge einer Zugabe als Text: "5 mL", "3 Tropfen", "5 cm", "0,5 g"
  function portionText(mark, lang) {
    var r = L.reagent(mark.reagent);
    if (mark.drops) return mark.drops + " " + text("unit.drop", lang);
    if (mark.ml != null) return trim(mark.ml, lang) + " " + text("unit.ml", lang);
    if (r.piece) return Math.round(mark.g / r.piece.g) + " " + nameOf(r.piece, lang);
    return trim(mark.g, lang) + " " + text("unit.g", lang);
  }

  // Was ein Gerät anzeigt, als Text: „74,0 mA“, „1,10 V“, „12,6 mS/cm“, „10,118 g“, „leuchtet hell“
  function shown(r, lang) {
    var v = r.value, def = L.parts[r.type] || {};
    if (def.circuit === "load") return text(v > 0.5 ? "lamp.bright" : v > 0.05 ? "lamp.dim" : "lamp.dark", lang);
    if (def.circuit === "supply") return num(r.volts, 1, lang) + " V";
    if (def.bath) return num(r.temp, 0, lang) + " °C";
    // Extinktion: im Deutschen E, im Englischen A (absorbance); am Ende der Skala „> 3“
    if (r.unit === "E") return text("unit.E", lang) + (v == null ? " –" : r.over ? " > " + trim(def.range[1], lang) : " " + num(v, 3, lang));
    if (v == null) return "– " + r.unit;
    if (r.unit === "A") return v < 0.9995 ? num(v * 1000, 1, lang) + " mA" : num(v, 2, lang) + " A";
    if (r.unit === "V") return num(v, 2, lang) + " V";
    if (r.unit === "mS/cm") return v >= 0.1 ? trim(v, lang) + " mS/cm" : trim(v * 1000, lang) + " µS/cm";
    if (def.scale) return num(Math.abs(v) < 0.005 ? 0 : v, 2, lang) + " g";      // Waage: auf 0,01 g, ohne „−0,00“
    if (r.unit === "g") return num(v, 3, lang) + " g";
    return num(v, 1, lang) + " " + r.unit;
  }

  var TAPS = [0, 0.05, 0.5, 2];   // Stellungen des Bürettenhahns in mL/s: zu, ein Tropfen je Sekunde, langsam, schnell

  function tapKey(rate) { return !(rate > 0) ? "off" : rate < 0.2 ? "drop" : rate < 1 ? "slow" : "fast"; }

  // Eine Beobachtung oder ein Eingriff als Satz. ctx: { lang, numbers, names: { id: "Reagenzglas 1" } }
  function say(event, ctx) {
    var lang = ctx.lang, name = function (id) { return (ctx.names && ctx.names[id]) || id; };
    var vars = { vessel: name(event.vessel), from: name(event.from), part: event.label || name(event.part), to: name(event.to) };
    // eine unbekannte Probe: Beobachtungen ja, Stoffnamen nein
    if (ctx.hidden && ctx.hidden[event.vessel]) switch (event.key) {
      case "plated": case "gone": case "ignite": return text("hidden." + event.key, lang, vars);
      case "smell": return text(L.species(event.species).smell === "fruity" ? "hidden.fruity" : "hidden.smell", lang, vars);
      case "solid": if (event.colloid) return text("hidden.haze", lang, vars);
    }
    switch (event.key) {
      case "plated":
        vars.name = nameOf(L.species(event.species), lang);
        vars.Name = vars.name.charAt(0).toUpperCase() + vars.name.slice(1);      // am Satzanfang (englisch: "Copper deposits …")
        if (!event.on) break;
        vars.metal = nameOf(L.species(event.on), lang);
        return text("say.platedOn", lang, vars);
      case "volts":
        if (!(event.volts > 0)) return text("say.voltsOff", lang, vars);
        if (!ctx.numbers) return text("say.voltsSet", lang, vars);
        vars.volts = num(event.volts, 1, lang);
        break;
      case "temp":
        if (!ctx.numbers) return text("say.tempSet", lang, vars);
        vars.temp = num(event.temp, 0, lang);
        break;
      case "wave":
        if (!ctx.numbers) return text("say.waveSet", lang, vars);
        vars.nm = String(event.nm);
        break;
      case "added":
        vars.amount = portionText(event, lang);
        vars.reagent = nameOf(L.reagent(event.reagent), lang);
        break;
      case "poured": vars.amount = trim(event.ml, lang) + " " + text("unit.ml", lang); break;
      case "gone": vars.name = nameOf(L.species(event.species), lang); break;
      case "solid":
        if (event.colloid) { vars.name = nameOf(L.species(event.species), lang); return text("say.haze", lang, vars); }
        if (event.grown) { vars.color = text("the." + event.color, lang); return text("say.crystals", lang, vars); }
        vars.color = text("solid." + event.color, lang);
        break;
      case "dissolved":
        if (!event.color) break;
        vars.color = text("the." + event.color, lang);
        return text("say.dissolvedOne", lang, vars);
      case "tap":
        if (!(event.rate > 0)) return text("say.tapOff", lang, vars);
        vars.state = text("tap." + tapKey(event.rate), lang);
        break;
      case "color": vars.color = colorWord(event.name, event.pale, lang); break;
      case "flame":
        if (!(event.level > 0)) return text("say.flameOff", lang, vars);
        vars.state = text("flame." + event.level, lang);
        break;
      case "dry": return text(event.left ? "say.dry" : "say.dryNone", lang, vars);
      case "smell":
        vars.name = nameOf(L.species(event.species), lang);
        if (L.species(event.species).smell === "fruity") return text("say.smellFruity", lang, vars);
        break;
      case "ignite": vars.name = nameOf(L.species(event.species), lang); break;
      case "splint":
        vars.splint = text(event.kind === "glow" ? "part.glowsplint" : "part.splint", lang);
        vars.result = text("splint." + event.result + (event.result === "pop" ? event.level : ""), lang);
        break;
      case "pop": return text("say.pop" + (event.level || 0), lang, vars);
      case "flameTest":
        if (!event.name) return text("say.flameNone", lang, vars);
        vars.color = text("color." + event.name, lang);
        break;
      case "tempMax":
        if (!ctx.numbers) return text("say.warm", lang, vars);
        vars.T = num(event.T, 1, lang);
        break;
    }
    return text("say." + event.key, lang, vars);
  }

  // ------------------------------------------------------------------ Zeichenhilfen

  function esc(value) {
    return String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  function f(value) { return (Math.round(value * 10) / 10).toString(); }

  function css(rgb) { return "rgb(" + rgb[0] + "," + rgb[1] + "," + rgb[2] + ")"; }

  function shade(rgb, factor) { return rgb.map(function (c) { return Math.round(c * factor); }); }

  // Farbe der Flüssigkeit im Glas: die gerechnete Farbe, bei klaren Lösungen mit dem leichten Blau von Wasser im Glas
  function liquidColor(rgb) {
    var clear = Math.min(rgb[0], rgb[1], rgb[2]) / 255, tint = [222, 238, 250];
    return css(rgb.map(function (c, i) { return Math.round(c - clear * clear * (255 - tint[i])); }));
  }

  function pseudo(seed, i) {        // feste „Zufallszahl“ zwischen 0 und 1
    var x = Math.sin(seed * 12.9898 + i * 78.233) * 43758.5453;
    return x - Math.floor(x);
  }

  // Feststoffe am Boden. box: { x0, x1, bottom } – der Platz am Gefäßboden; tall: schmales Gefäß
  function solids(w, box, tall) {
    var out = "", width = box.x1 - box.x0, mid = (box.x0 + box.x1) / 2;
    w.solids.forEach(function (s, index) {
      var color = L.species(s.id).color || "#9aa0a8", i, points = [], count, r, x, y;
      if (s.form === "strip") {
        // Band als Zickzack: so viele Stücke, wie es lang ist; es wird dünner, nicht kürzer
        count = Math.max(2, Math.min(14, Math.round(s.g0 / 0.0104)));
        for (i = 0; i <= count; i++) {
          if (tall) points.push(f(mid + (i % 2 ? 1 : -1) * width * 0.3) + "," + f(box.bottom - 3 - i * 7));
          else points.push(f(mid + (i - count / 2) * Math.min(9, width * 0.8 / count)) + "," + f(box.bottom - 3 - (i % 2) * 6));
        }
        // die Farbe steht im style: das Stylesheet gibt Feststoffen eine Randfarbe, und die ginge einem Attribut vor
        // darunter ein dunkler Rand, damit auch ein helles Metall vor der hellen Wand zu sehen ist
        out += '<polyline class="cl-solid-edge" points="' + points.join(" ") + '" fill="none" stroke-width="' + f(2 + 3.2 * s.part) + '" stroke-linejoin="round" stroke-linecap="round"/>' +
          '<polyline class="cl-solid" points="' + points.join(" ") + '" fill="none" style="stroke:' + esc(color) +
          '" stroke-width="' + f(0.8 + 3.2 * s.part) + '" stroke-linejoin="round" stroke-linecap="round"/>';
      } else {
        count = s.form === "powder" ? 9 : Math.max(3, Math.min(9, Math.round(3 + s.g0 * 4)));
        r = s.form === "powder" ? 1.6 : 2 + 2.5 * Math.pow(s.part, 1 / 3);
        for (i = 0; i < count; i++) {
          x = box.x0 + r + pseudo(index + 1, i) * Math.max(0, width - 2 * r);
          y = box.bottom - r - pseudo(index + 7, i) * (tall ? 10 : 3);
          out += '<circle class="cl-solid" cx="' + f(x) + '" cy="' + f(y) + '" r="' + f(r) + '" fill="' + esc(color) + '" stroke-width="0.5"/>';
        }
      }
    });
    return out;
  }

  // Scherben eines zersprungenen Gefäßes, auf dem Tisch verstreut
  function shards(half, ctx) {
    var out = "", i, x, w, down = ctx.lift || 0;
    for (i = 0; i < 7; i++) {
      x = (pseudo(3, i) * 2 - 1) * (half + 14); w = 5 + 9 * pseudo(5, i);
      out += '<path class="cl-shard" d="M' + f(x) + "," + f(down - 1) + "L" + f(x + w * 0.4) + "," + f(down - 4 - 10 * pseudo(7, i)) + "L" + f(x + w) + "," + f(down - 1) + 'Z"/>';
    }
    (ctx.marks || []).forEach(function (mark) {                // der Knall, der das Gefäß zerstört hat, blitzt dort, wo es stand
      if (L.fx && mark.level > 0 && (mark.key === "pop" || mark.result === "pop")) out += L.fx.flash(0, down - 50, mark.age, mark.level + 1);
    });
    return out + badge(0, 14 + down, ctx.no);
  }

  function badge(x, y, no) {
    return no ? '<circle class="cl-badge" cx="' + x + '" cy="' + y + '" r="8"/><text class="cl-badge-text" x="' + x + '" y="' + (y + 3.5) +
      '" text-anchor="middle">' + no + "</text>" : "";
  }

  function volumeLabel(w, ctx, y) {
    y += ctx.lift || 0;                                         // steht das Gefäß über einem Brenner, bleibt die Angabe am Tisch
    return ctx.numbers && ctx.volumes !== false && w.ml > 0.005
      ? '<text class="cl-label" x="0" y="' + y + '" text-anchor="middle">' + num(w.ml, w.ml < 99.95 ? 1 : 0, ctx.lang) + " mL</text>" : "";
  }

  // Inhalt eines Gefäßes: Flüssigkeit, Feststoff, Blasen, Zulauf. shape: { path, x0, x1, top, bottom, rim, tall }
  function contents(w, ctx, shape) {
    var out = "", clip = "cl-" + ctx.uid + "-" + w.id + "-clip", box = { x0: shape.x0, x1: shape.x1, top: shape.top, bottom: shape.bottom };
    var layer;
    if (w.ml > 0.005) {
      out += '<clipPath id="' + esc(clip) + '"><path d="' + shape.path + '"/></clipPath>' +
        '<path class="cl-liquid" d="' + shape.path + '" fill="' + liquidColor(w.color.rgb) + '"/>';
      // Niederschlag: was schwebt, trübt die Flüssigkeit in seiner Farbe; was sich abgesetzt hat, liegt als Schicht am Boden
      if (w.cloud && w.cloud.alpha > 0.02) {
        // etwas abgedunkelt, damit auch ein weißer Niederschlag vor der hellen Wand als milchige Trübung zu sehen ist
        out += '<path class="cl-cloud" d="' + shape.path + '" fill="' + css(shade(w.cloud.rgb, 0.93)) + '" fill-opacity="' + (w.cloud.alpha * 0.92).toFixed(2) + '"/>';
      }
      if (w.sediment && w.sediment.ml > 0.002) {
        layer = Math.min((shape.bottom - shape.top) * 0.45, 3 + 9 * Math.sqrt(w.sediment.ml) * (shape.tall ? 1 : 0.5));
        out += '<rect class="cl-sediment" clip-path="url(#' + esc(clip) + ')" x="' + f(shape.x0 - 2) + '" y="' + f(shape.bottom - layer) +
          '" width="' + f(shape.x1 - shape.x0 + 4) + '" height="' + f(layer + 2) + '" fill="' + css(shade(w.sediment.rgb, 0.88)) + '"/>';
      }
    }
    else if (w.sediment && w.sediment.ml > 0.002) {          // abgegossen: der Bodensatz liegt trocken im Gefäß
      layer = Math.min(30, 3 + 9 * Math.sqrt(w.sediment.ml) * (shape.tall ? 1 : 0.5));
      out += '<clipPath id="' + esc(clip) + '"><path d="' + shape.fill(shape.bottom - layer) + '"/></clipPath>' +
        '<rect class="cl-sediment" clip-path="url(#' + esc(clip) + ')" x="-90" y="' + f(shape.bottom - layer) +
        '" width="180" height="' + f(layer + 2) + '" fill="' + css(shade(w.sediment.rgb, 0.88)) + '"/>';
    }
    if (w.residue > 1e-7) {                                    // eingedampft: eine helle Kruste am Boden, auch unter einem Tropfen Flüssigkeit
      layer = Math.min(14, 2.5 + 30 * Math.sqrt(w.residue));
      out += '<path class="cl-crust" d="' + shape.fill(shape.bottom - layer) + '"/>';
    }
    out += solids(w, box, shape.tall);
    if (w.ml > 0.005) {
      // Blasen: Gas, das entsteht, und beim Sieden der Dampf
      if ((w.gas > 0 || w.steam > 0) && L.fx) out += '<g clip-path="url(#' + esc(clip) + ')">' + L.fx.bubbles(box, Math.max(w.gas, w.steam), ctx.t, ctx.seed || 1, ctx.still) + "</g>";
      out += '<line class="cl-surface" x1="' + f(shape.x0) + '" x2="' + f(shape.x1) + '" y1="' + f(shape.top) + '" y2="' + f(shape.top) + '"/>';
    }
    if (w.inflow && L.fx) out += L.fx.stream(shape.tall ? -4 : -10, shape.rim - 46, w.ml > 0.005 ? shape.top : shape.bottom, ctx.t, ctx.still);
    if (L.fx) {
      if (w.steam > 0 && !ctx.sealed) out += L.fx.steam(shape.tall ? -6 : shape.x0 * 0.6, shape.tall ? 6 : shape.x1 * 0.6, shape.rim - 2, w.steam, ctx.t, ctx.seed || 1, ctx.still);
      if (w.fire && w.fire.length) out += L.fx.fire(box.x0, box.x1, shape.bottom, w.fire, ctx.t, ctx.seed || 1, ctx.still);
      // Gas, das an der Öffnung abbrennt: eine kleine, blasse Flamme
      if (w.torch) out += '<g class="cl-torch">' + L.fx.fire(-6, 6, shape.rim + 2, [{ rate: 1, color: "#a9c2ff", glare: 0 }], ctx.t, ctx.seed || 1, ctx.still) + "</g>";
      (ctx.marks || []).forEach(function (mark) {              // Proben an der Öffnung: der Span, und der Blitz einer Verpuffung
        if (mark.key === "splint" && mark.age < 2) out += L.fx.splint(shape.tall ? 4 : shape.x1 * 0.5, shape.rim - 4, mark, ctx.t, ctx.still);
        if ((mark.key === "pop" || (mark.key === "splint" && mark.result === "pop")) && mark.level > 0) out += L.fx.flash(0, shape.rim - 6, mark.age, mark.level);
      });
    }
    return out;
  }

  // ------------------------------------------------------------------ Reagenzglas

  var PIPE_RISE = 34;                   // so weit steigt das Gasableitungsrohr über den höheren der beiden Ränder
  var TUBE = { r: 12, floor: -9, top: -196, rise: 175 };   // Innenradius, tiefster Punkt, Rand, Höhe für 20 mL

  function tubeSurface(w) { return TUBE.floor - Math.min(1, w.ml / w.cap) * TUBE.rise; }

  function tubeLiquid(y) {
    var r = TUBE.r, center = TUBE.floor - r, half;
    if (y <= center) return "M" + -r + "," + f(y) + "L" + -r + "," + center + "A" + r + "," + r + " 0 0 0 " + r + "," + center + "L" + r + "," + f(y) + "Z";
    half = Math.sqrt(Math.max(0, r * r - (y - center) * (y - center)));
    return "M" + f(-half) + "," + f(y) + "A" + r + "," + r + " 0 0 0 " + f(half) + "," + f(y) + "Z";
  }

  L.registerPart("testtube", {
    width: function () { return 76; },
    bounds: function () { return { x0: -32, x1: 32, top: -204 }; },
    surface: tubeSurface,
    // wo ein Messgerät steckt: das Thermometer rechts, die Elektrode des pH-Meters links
    // tag und box: wo neben dem Gerät seine Anzeige steht, damit sich zwei Anzeigen nicht verdecken
    probe: function (v, type, slot) {
      if (type === "syringe") return { x: 0, rim: TUBE.top, w: 26 };        // Stopfen in der Öffnung
      if (type === "tube") return { x: 0, rim: TUBE.top, w: 26, top: TUBE.top - PIPE_RISE };
      if (type === "bridge" || type === "condenser") return { x: 6 * slot, rim: TUBE.top };
      if (type === "reflux") return { x: 0, rim: TUBE.top, top: TUBE.top - REFLUX };
      if (type === "conductometer") return { x: -1, bottom: -14, top: -276, box: -74 };
      if (type === "photometer") return { x: 1, bottom: -14, top: -292, box: 8 };
      return type === "phmeter" ? { x: -5, bottom: -14, top: -236, box: -62 } : { x: 5, bottom: -14, top: -262, tag: 8 };
    },
    // wo eine Bürette darüber hängt: Abstand von der Mitte, Rand des Gefäßes, Spiegel der Flüssigkeit, halbe Breite samt Halter
    mount: function (w) { return { x: 0, rim: TUBE.top, surface: w.ml > 0.005 ? tubeSurface(w) : TUBE.floor, edge: 34 }; },
    draw: function (w, ctx) {
      var y = tubeSurface(w), R = TUBE.r + 1, center = TUBE.floor - TUBE.r;
      var half = y <= center ? TUBE.r : Math.sqrt(Math.max(0, TUBE.r * TUBE.r - (y - center) * (y - center)));
      if (w.broken) return shards(16, ctx);
      // über dem Brenner hält eine Klemme das Glas (sie gehört zur Zeichnung des Brenners), sonst steht es im Ständer
      return (ctx.lift ? "" : '<rect class="cl-wood" x="-30" y="-112" width="60" height="7" rx="2"/>' +
        '<rect class="cl-wood" x="-30" y="-106" width="5" height="100"/><rect class="cl-wood" x="25" y="-106" width="5" height="100"/>') +
        contents(w, ctx, { path: tubeLiquid(y), fill: tubeLiquid, x0: -half, x1: half, top: y, bottom: TUBE.floor, rim: TUBE.top, tall: true }) +
        '<path class="cl-glass" d="M-16,' + TUBE.top + "L" + -R + "," + (TUBE.top + 3) + "L" + -R + "," + center + "A" + R + "," + R + " 0 0 0 " + R + "," + center +
        "L" + R + "," + (TUBE.top + 3) + "L16," + TUBE.top + '"/>' +
        '<line class="cl-shine" x1="-8" y1="' + (TUBE.top + 14) + '" x2="-8" y2="' + (center - 6) + '"/>' +
        (ctx.lift ? "" : '<rect class="cl-wood" x="-32" y="-8" width="64" height="8" rx="2"/>') +
        badge(0, 14 + (ctx.lift || 0), ctx.no) + volumeLabel(w, ctx, 38);
    }
  });

  // ------------------------------------------------------------------ Becherglas

  var BEAKER = { 50: [64, 74], 100: [84, 96], 250: [112, 128], 600: [150, 170] };   // Breite und Höhe in Bildpunkten

  function beakerSize(w) { return BEAKER[w.size || w.cap] || BEAKER[100]; }

  function beakerSurface(w) { return -3 - Math.min(1, w.ml / w.cap) * (beakerSize(w)[1] - 16); }

  L.registerPart("beaker", {
    width: function (v) { return beakerSize(v)[0] + 40; },
    bounds: function (v) { var s = beakerSize(v); return { x0: -s[0] / 2 - 8, x1: s[0] / 2 + 8, top: -s[1] - 8 }; },
    surface: beakerSurface,
    foot: function (v) { return beakerSize(v)[0] / 2 - 4; },     // halbe Standfläche, für den Dreifuß
    // slot: bei Elektroden 0 links und 1 rechts; bei der Salzbrücke die Seite, auf der das andere Gefäß steht (−1 oder 1)
    probe: function (v, type, slot) {
      var s = beakerSize(v);
      if (type === "syringe") return { x: 0, rim: -s[1], w: s[0] - 2 };
      if (type === "tube") return { x: 0, rim: -s[1], w: s[0] - 2, top: -s[1] - PIPE_RISE };
      // Die Elektrode endet so weit über dem Boden wie in der Rechnung: bei der Füllhöhe, die dem Abstand L.PLATE.gap entspricht
      if (L.parts[type] && L.parts[type].electrode) {
        var size = L.parts.beaker.sizes[v.size || v.cap] || L.parts.beaker.sizes[100];
        var gap = L.PLATE.gap * Math.PI * size.d * size.d / 4 / size.cap;         // als Anteil am Fassungsvermögen
        return { x: (slot ? 1 : -1) * (s[0] / 2 - 10), bottom: -3 - gap * (s[1] - 16), top: -s[1] - 30, rim: -s[1] };
      }
      if (type === "bridge" || type === "condenser") return { x: slot * (s[0] / 2 - 21), rim: -s[1] };
      if (type === "reflux") return { x: 0, rim: -s[1], top: -s[1] - REFLUX };
      if (type === "conductometer") return { x: -s[0] / 16, bottom: -8, top: -s[1] - 76, box: -40 };
      if (type === "photometer") return { x: s[0] / 8, bottom: -8, top: -s[1] - 100, box: -68 };      // Anzeige links der Sonde: rechts hängt die Bürette
      // von links nach rechts: Thermometer mit Anzeige links davon, Elektrode mit Anzeige darüber, rechts bleibt Platz für die Bürette.
      // Im schmalen Glas rückt das Schild des Thermometers so weit nach links, dass es neben der Anzeige des pH-Meters Platz hat.
      return type === "phmeter" ? { x: s[0] / 16, bottom: -8, top: -s[1] - 44, box: -38 }
        : { x: -s[0] / 4, bottom: -8, top: -s[1] - 70, tag: Math.min(-62, Math.round(s[0] * 5 / 16) - 94) };
    },
    mount: function (w) {
      var s = beakerSize(w);
      return { x: s[0] * 0.3, rim: -s[1], surface: w.ml > 0.005 ? beakerSurface(w) : -2, edge: s[0] / 2 + 6 };
    },
    draw: function (w, ctx) {
      var s = beakerSize(w), a = s[0] / 2, h = s[1], y = beakerSurface(w), i, marks = "", my;
      var fill = function (level) {     // Umriss der Flüssigkeit bis zur Höhe level
        return "M" + (-a + 2) + "," + f(level) + "L" + (-a + 2) + ",-8Q" + (-a + 2) + ",-2 " + (-a + 8) + ",-2L" + (a - 8) + ",-2Q" + (a - 2) + ",-2 " + (a - 2) + ",-8L" + (a - 2) + "," + f(level) + "Z";
      };
      var liquid = fill(y);
      if (w.broken) return shards(a, ctx);
      for (i = 1; i <= 4; i++) {
        my = -3 - i / 4 * (h - 16);
        marks += '<line class="cl-mark" x1="' + (a - 14) + '" x2="' + (a - 4) + '" y1="' + f(my) + '" y2="' + f(my) + '"/>';
        if (ctx.numbers && i % 2 === 0) marks += '<text class="cl-mark-text" x="' + (a - 16) + '" y="' + f(my + 3) + '" text-anchor="end">' + w.cap * i / 4 + "</text>";
      }
      return contents(w, ctx, { path: liquid, fill: fill, x0: -a + 2, x1: a - 2, top: y, bottom: -2, rim: -h, tall: false }) +
        marks +
        '<path class="cl-glass" d="M' + (-a - 6) + "," + (-h - 2) + "Q" + (-a) + "," + (-h) + " " + (-a) + "," + (-h + 8) + "L" + (-a) + ",-8Q" + (-a) + ",0 " + (-a + 8) + ",0L" +
        (a - 8) + ",0Q" + a + ",0 " + a + ",-8L" + a + "," + (-h + 2) + "L" + (a + 3) + "," + (-h - 2) + '"/>' +
        '<line class="cl-shine" x1="' + (-a + 8) + '" y1="' + (-h + 14) + '" x2="' + (-a + 8) + '" y2="-16"/>' +
        badge(0, 14 + (ctx.lift || 0), ctx.no) + volumeLabel(w, ctx, 38);
    }
  });

  // ------------------------------------------------------------------ Abdampfschale

  var DISH = { a: 46, h: 30 };          // halbe Breite am Rand, Tiefe

  function dishHalf(y) {                // halbe Innenbreite in der Höhe y
    return 12 + (DISH.a - 14) * Math.sqrt(Math.max(0, Math.min(1, (-2 - y) / DISH.h)));
  }

  function dishSide(level, grow) {      // Punkte der rechten Wand von der Höhe level bis zum Boden
    var points = [], i, y;
    for (i = 0; i <= 8; i++) { y = level + (-2 - level) * i / 8; points.push([dishHalf(y) + grow, y]); }
    return points;
  }

  function dishFill(level) {            // Umriss der Flüssigkeit bis zur Höhe level
    var right = dishSide(level, 0);
    return "M" + right.map(function (p) { return f(p[0]) + "," + f(p[1]); }).join("L") + "L" +
      right.slice().reverse().map(function (p) { return f(-p[0]) + "," + f(p[1]); }).join("L") + "Z";
  }

  function dishSurface(w) { return -2 - DISH.h * 0.92 * Math.pow(Math.min(1, w.ml / w.cap), 0.6); }

  L.registerPart("dish", {
    width: function () { return 128; },
    bounds: function () { return { x0: -54, x1: 54, top: -44 }; },
    surface: dishSurface,
    foot: function () { return 24; },
    probe: function (v, type, slot) {
      if (type === "syringe") return { x: 0, rim: -DISH.h - 4, w: 2 * DISH.a - 4 };
      if (type === "tube") return { x: 0, rim: -DISH.h - 4, w: 2 * DISH.a - 4, top: -DISH.h - 4 - PIPE_RISE };
      if (type === "bridge" || type === "condenser") return { x: 30 * slot, rim: -DISH.h - 4 };
      if (type === "reflux") return { x: 0, rim: -DISH.h - 4, top: -DISH.h - 4 - REFLUX };
      if (type === "conductometer") return { x: 0, bottom: -6, top: -152, box: -37 };      // seine Anzeige steht über dem Schild des Thermometers
      if (type === "photometer") return { x: 5, bottom: -6, top: -180, box: -70 };
      return type === "phmeter" ? { x: 12, bottom: -6, top: -104, box: 8 } : { x: -12, bottom: -6, top: -150, tag: -62 };
    },
    mount: function (w) { return { x: 24, rim: -DISH.h - 6, surface: w.ml > 0.005 ? dishSurface(w) : -2, edge: 52 }; },
    draw: function (w, ctx) {
      var y = dishSurface(w), wall = dishSide(-DISH.h - 4, 2), half = dishHalf(y);
      if (w.broken) return shards(DISH.a, ctx);
      var outline = "M" + wall.slice().reverse().map(function (p) { return f(-p[0]) + "," + f(p[1] + 2); }).join("L") + "L" +
        wall.map(function (p) { return f(p[0]) + "," + f(p[1] + 2); }).join("L");
      return contents(w, ctx, { path: dishFill(y), fill: dishFill, x0: -half, x1: half, top: y, bottom: -2, rim: -DISH.h - 4, tall: false }) +
        '<path class="cl-porcelain" d="' + outline + '"/><path class="cl-porcelain-edge" d="' + outline + '"/>' +
        badge(0, 14 + (ctx.lift || 0), ctx.no) + volumeLabel(w, ctx, 38);
    }
  });

  // ------------------------------------------------------------------ Brenner

  var NOZZLE = -50;                     // Höhe der Düse über dem Tisch

  // place: { lift, foot, clamp } aus stand(), wenn er unter einem Gefäß steht
  L.registerPart("burner", {
    width: function () { return 64; },
    bounds: function (t, place) { return { x0: -20, x1: 20, top: place ? -place.lift + 8 : -100 }; },
    // Wie ein Gefäß über dem Brenner steht: lift Höhe des Bodens, foot halbe Standfläche; ohne Standfläche hält es eine Klemme
    stand: function (host) {
      var def = L.parts[host.type];
      return { lift: def.foot ? 104 : 92, foot: def.foot ? def.foot(host) : 0, clamp: !def.foot };
    },
    draw: function (w, ctx, place) {
      var out = "", a, top;
      if (place && place.clamp) {                              // Stativ mit Klemme für das Reagenzglas
        top = -place.lift - 150;
        out += '<rect class="cl-stand" x="30" y="-5" width="46" height="5" rx="2"/>' +
          '<line class="cl-rod" x1="54" x2="54" y1="-5" y2="' + top + '"/>' +
          '<path class="cl-clamp" d="M54,' + (top + 30) + "L17," + (top + 30) + "M17," + (top + 22) + "L17," + (top + 38) + "M-17," + (top + 22) + "L-17," + (top + 38) + '"/>';
      } else if (place) {                                      // Dreifuß mit Drahtnetz
        a = place.foot + 10;
        out += '<path class="cl-tripod" d="M' + -a + "," + -place.lift + "L" + (-a - 8) + ",0M" + a + "," + -place.lift + "L" + (a + 8) + ",0M" + (-a - 2) + "," + -place.lift + "L" + (a + 2) + "," + -place.lift + '"/>' +
          '<rect class="cl-gauze" x="' + (-a + 2) + '" y="' + (-place.lift - 2.5) + '" width="' + (2 * a - 4) + '" height="2.5"/>';
      }
      out += '<rect class="cl-burner" x="-16" y="-6" width="32" height="6" rx="2"/>' +
        '<rect class="cl-burner" x="-4.5" y="' + NOZZLE + '" width="9" height="' + (-NOZZLE - 6) + '"/>' +
        '<rect class="cl-burner" x="-6.5" y="-20" width="13" height="6" rx="1"/>' +
        '<path class="cl-hose" d="M4.5,-10L13,-10Q22,-10 22,0"/>';
      if (L.fx) out += L.fx.flame(0, NOZZLE, w.flame, ctx.t || 0, ctx.seed || 1, ctx.still, w.tint && w.tint.rgb);
      return out + badge(place ? (place.clamp ? -30 : 30) : 0, 14, ctx.no);      // unter einem Gefäß steht die Nummer neben dessen Nummer
    }
  });

  // ------------------------------------------------------------------ Waage

  var SCALE = { lift: 24, h: 20 };       // Höhe der Waagschale über dem Tisch, Höhe des Gehäuses

  // place: { lift, half } aus stand(), wenn ein Gefäß darauf steht
  L.registerPart("balance", {
    width: function () { return 96; },
    bounds: function (t, place) { var a = place ? place.half : 40; return { x0: -a - 4, x1: a + 24, top: -SCALE.lift - 2 }; },      // rechts mit der Nummer
    stand: function (host) { var b = L.parts[host.type].bounds(host); return { lift: SCALE.lift, half: Math.max(40, (b.x1 - b.x0) / 2), clamp: false }; },
    span: function (host) { return 2 * (this.stand(host).half + 24); },     // so breit samt Nummer
    draw: function (w, ctx, place) {
      var a = place ? place.half : 40;
      return '<rect class="cl-scale" x="' + (-a) + '" y="' + (-SCALE.h) + '" width="' + 2 * a + '" height="' + SCALE.h + '" rx="3"/>' +
        '<rect class="cl-scale-pan" x="' + (-a + 6) + '" y="' + (-SCALE.lift) + '" width="' + (2 * a - 12) + '" height="4" rx="1"/>' +
        '<g class="cl-meter"><rect x="-26" y="-16" width="52" height="13" rx="2"/><text x="0" y="-6" text-anchor="middle">' +
        (ctx.numbers ? shown(w, ctx.lang) : "") + "</text></g>" + badge(place ? a + 14 : 0, 14, ctx.no);
    }
  });

  // ------------------------------------------------------------------ Kolbenprober

  var BARREL = 90;                      // Länge des Zylinders in Bildpunkten für 100 mL

  // place: { x, rim, w } aus probe() des Gefäßes: ein Stopfen der Breite w in der Öffnung, darüber der Kolbenprober
  L.registerPart("syringe", {
    width: function () { return 150; },
    room: 118,                          // so viel Platz braucht er rechts neben der Mitte des Gefäßes
    bounds: function (t, place) {
      var off = place ? place.off || 20 : 0;                       // off: so weit rechts vom Stopfen beginnt der Zylinder (an einer Bürette vorbei)
      return place ? { x0: place.x + off - 6, x1: place.x + off + 130, top: place.rim - 56, bottom: place.rim - 10 } : { x0: -62, x1: 70, top: -34 };
    },
    draw: function (w, ctx, place) {
      var x0 = place ? place.x + (place.off || 20) : -56, y = place ? place.rim - 26 : -14, value = Math.max(0, Math.min(100, w.value || 0));
      var px = x0 + 6 + (BARREL - 14) * value / 100, out = "", ml;
      if (place) {
        out += '<path class="cl-stopper" d="M' + f(place.x - place.w / 2) + "," + (place.rim - 4) + "L" + f(place.x + place.w / 2) + "," + (place.rim - 4) + "L" +
          f(place.x + place.w / 2 - 2) + "," + (place.rim + 7) + "L" + f(place.x - place.w / 2 + 2) + "," + (place.rim + 7) + 'Z"/>' +
          '<path class="cl-hose" d="M' + place.x + "," + (place.rim + 4) + "L" + place.x + "," + y + "L" + x0 + "," + y + '"/>';
      }
      out += '<rect class="cl-gasroom" x="' + x0 + '" y="' + (y - 7) + '" width="' + f(px - x0) + '" height="14"/>' +
        '<rect class="cl-glass" x="' + x0 + '" y="' + (y - 8) + '" width="' + BARREL + '" height="16" rx="2"/>' +
        '<rect class="cl-plunger" x="' + f(px) + '" y="' + (y - 6.5) + '" width="4" height="13"/>' +
        '<line class="cl-rod" x1="' + f(px + 4) + '" x2="' + f(px + 34) + '" y1="' + y + '" y2="' + y + '"/>' +
        '<line class="cl-rod" x1="' + f(px + 34) + '" x2="' + f(px + 34) + '" y1="' + (y - 7) + '" y2="' + (y + 7) + '"/>';
      for (ml = 0; ml <= 100; ml += 20) {
        out += '<line class="cl-mark" x1="' + f(x0 + 6 + (BARREL - 14) * ml / 100) + '" x2="' + f(x0 + 6 + (BARREL - 14) * ml / 100) + '" y1="' + (y - 8) + '" y2="' + (y - 4) + '"/>';
      }
      if (ctx.numbers) {
        out += '<g class="cl-tag"><rect x="' + (x0 + 14) + '" y="' + (y - 30) + '" width="62" height="17" rx="4"/>' +
          '<text x="' + (x0 + 45) + '" y="' + (y - 18) + '" text-anchor="middle">' + num(value, 1, ctx.lang) + " mL</text></g>";
      }
      return out + (place ? "" : badge(0, 14, ctx.no));
    }
  });

  // ------------------------------------------------------------------ Thermometer

  // place: { x, bottom, top } im Gefäß; ohne Gefäß steht es in einem Halter
  L.registerPart("thermometer", {
    width: function () { return 48; },
    bounds: function () { return { x0: -12, x1: 12, top: -208 }; },
    draw: function (w, ctx, place) {
      var p = place || { x: 0, bottom: -10, top: -200 }, x = p.x, len = p.bottom - p.top;
      var zero = p.bottom - 16, span = len - 30;                    // Skala von −10 °C bis 110 °C
      var at = function (T) { return zero - (Math.max(-10, Math.min(110, T)) + 10) / 120 * span; };
      var out = "", T, y = at(w.value);
      if (!place) out += '<rect class="cl-wood" x="-14" y="-8" width="28" height="8" rx="2"/>';
      out += '<rect class="cl-thermo" x="' + (x - 3.5) + '" y="' + p.top + '" width="7" height="' + (len - 4) + '" rx="3.5"/>' +
        '<circle class="cl-thermo" cx="' + x + '" cy="' + (p.bottom - 5) + '" r="5"/>' +
        '<circle class="cl-mercury" cx="' + x + '" cy="' + (p.bottom - 5) + '" r="3.4"/>' +
        '<rect class="cl-mercury" x="' + (x - 1.2) + '" y="' + f(y) + '" width="2.4" height="' + f(p.bottom - 6 - y) + '"/>';
      for (T = 0; T <= 100; T += 10) {
        out += '<line class="cl-mark" x1="' + (x + 3.5) + '" x2="' + (x + (T % 50 ? 6.5 : 9)) + '" y1="' + f(at(T)) + '" y2="' + f(at(T)) + '"/>';
        if (ctx.numbers && T % 50 === 0) out += '<text class="cl-mark-text" x="' + (x + 11) + '" y="' + f(at(T) + 2.5) + '">' + T + "</text>";
      }
      if (ctx.numbers) {
        var tag = x + (p.tag == null ? 8 : p.tag);
        out += '<g class="cl-tag"><rect x="' + tag + '" y="' + (p.top - 4) + '" width="50" height="17" rx="4"/>' +
          '<text x="' + (tag + 25) + '" y="' + (p.top + 8) + '" text-anchor="middle">' + (w.over ? "&gt; " + num(w.value, 0, ctx.lang) : num(w.value, 1, ctx.lang)) + " °C</text></g>";
      }
      return out + (place ? "" : badge(0, 14, ctx.no));
    }
  });

  // ------------------------------------------------------------------ pH-Meter

  // Elektrode im Gefäß, darüber die Anzeige. place wie beim Thermometer.
  // Messfühler im Gefäß mit einer Anzeige der Breite wide darüber, die den Text label zeigt
  function gauge(ctx, place, label, wide) {
    var p = place || { x: 0, bottom: -10, top: -110 }, x = p.x;
    var out = place ? "" : '<rect class="cl-wood" x="-14" y="-8" width="28" height="8" rx="2"/>';
    var box = x + (p.box == null ? 4 : p.box);
    return out +
      '<rect class="cl-probe" x="' + (x - 3) + '" y="' + (p.top + 10) + '" width="6" height="' + (p.bottom - p.top - 16) + '" rx="2"/>' +
      '<circle class="cl-thermo" cx="' + x + '" cy="' + (p.bottom - 5) + '" r="4.5"/>' +
      '<rect class="cl-cap" x="' + (x - 4.5) + '" y="' + p.top + '" width="9" height="12" rx="2"/>' +
      '<path class="cl-cable" d="M' + x + "," + p.top + "C" + x + "," + (p.top - 10) + " " + (box + wide / 2) + "," + (p.top - 4) + " " + (box + wide / 2) + "," + (p.top - 14) + '"/>' +
      '<g class="cl-meter"><rect x="' + box + '" y="' + (p.top - 34) + '" width="' + wide + '" height="20" rx="4"/>' +
      '<text x="' + (box + wide / 2) + '" y="' + (p.top - 20) + '" text-anchor="middle">' + label + "</text></g>" +
      (place ? "" : badge(0, 14, ctx.no));
  }

  L.registerPart("phmeter", {
    width: function () { return 70; },
    bounds: function () { return { x0: -14, x1: 44, top: -138 }; },
    draw: function (w, ctx, place) {
      return gauge(ctx, place, "pH" + (w.value == null ? " –" : ctx.numbers ? " " + num(w.value, 2, ctx.lang) : ""), 50);
    }
  });

  L.registerPart("conductometer", {
    width: function () { return 96; },
    bounds: function () { return { x0: -14, x1: 70, top: -138 }; },
    draw: function (w, ctx, place) { return gauge(ctx, place, ctx.numbers ? shown(w, ctx.lang) : "mS/cm", 74); }
  });

  // Fotometer mit Tauchsonde: an der Spitze leuchtet das Licht der eingestellten Wellenlänge
  L.registerPart("photometer", {
    width: function () { return 96; },
    bounds: function () { return { x0: -14, x1: 70, top: -138 }; },
    draw: function (w, ctx, place) {
      var p = place || { x: 0, bottom: -10, top: -110 };
      return gauge(ctx, place, ctx.numbers ? shown(w, ctx.lang) : text("unit.E", ctx.lang), 64) +
        '<circle class="cl-light" cx="' + p.x + '" cy="' + (p.bottom - 5) + '" r="3.2" fill="rgb(' + L.waveRgb(w.nm).join(", ") + ')"/>';
    }
  });

  // ------------------------------------------------------------------ Wasserbad

  var BATH = { lift: 30, depth: 50, rim: 12 };        // Höhe des Rosts über dem Tisch, höchster Wasserstand darüber, Rand der Wanne über dem Wasser

  // place: { lift, half, clamp, depth } aus stand(), wenn ein Gefäß darin steht: half ist die halbe Breite der Wanne,
  // depth der Wasserstand über dem Rost (eine flache Schale steht nicht unter Wasser)
  L.registerPart("bath", {
    width: function () { return 180; },
    // im Bad ist nur der Streifen unter dem Gefäß antippbar, bis unter die Tischkante zu seiner Nummer; das Gefäß selbst bleibt frei
    bounds: function (t, place) {
      var a = place ? place.half : 50;
      return { x0: -a - 2, x1: a + 40, top: place ? -BATH.lift + 3 : -BATH.lift - BATH.depth - BATH.rim - 4, bottom: 24 };
    },
    stand: function (host) {
      var def = L.parts[host.type], b = def.bounds(host);
      return { lift: BATH.lift, half: Math.max(44, (b.x1 - b.x0) / 2 + 12), clamp: !def.foot, depth: Math.max(18, Math.min(BATH.depth, Math.round(-b.top / 2))) };
    },
    // so breit braucht das Gefäß samt Bad Platz: links das Stativ, rechts der Thermostat
    span: function (host) { return 2 * (this.stand(host).half + 42); },
    draw: function (w, ctx, place) {
      var a = place ? place.half : 50, depth = place ? place.depth : BATH.depth, level = -BATH.lift - depth, top = level - BATH.rim, out = "", i, x, grip;
      if (place && place.clamp) {                              // Stativ mit Klemme für das Reagenzglas
        grip = -BATH.lift - 120;
        out += '<rect class="cl-stand" x="' + (-a - 38) + '" y="-5" width="34" height="5" rx="2"/>' +
          '<line class="cl-rod" x1="' + (-a - 20) + '" x2="' + (-a - 20) + '" y1="-5" y2="' + (grip - 30) + '"/>' +
          '<path class="cl-clamp" d="M' + (-a - 20) + "," + grip + "L17," + grip + "M17," + (grip - 8) + "L17," + (grip + 8) + "M-17," + (grip - 8) + "L-17," + (grip + 8) + '"/>';
      }
      out += '<path class="cl-bath-water' + (w.temp <= 4 ? " cl-cold" : w.temp >= 60 ? " cl-hot" : "") + '" d="M' + (-a + 2) + "," + level + "L" + (a - 2) + "," + level + "L" + (a - 2) +
        ",-4Q" + (a - 2) + ",-2 " + (a - 4) + ",-2L" + (-a + 4) + ",-2Q" + (-a + 2) + ",-2 " + (-a + 2) + ',-4Z"/>' +
        '<path class="cl-tripod" d="M' + (-a + 9) + "," + -BATH.lift + "L" + (-a + 9) + ",-2M" + (a - 9) + "," + -BATH.lift + "L" + (a - 9) + ',-2"/>' +
        '<rect class="cl-gauze" x="' + (-a + 4) + '" y="' + (-BATH.lift - 1) + '" width="' + (2 * a - 8) + '" height="2.5"/>';
      if (w.temp <= 4) {                                       // Eiswasser: Eisstücke an der Oberfläche
        for (i = 0; i < 5; i++) {
          x = -a + 9 + i * (2 * a - 26) / 4;
          out += '<rect class="cl-ice" x="' + f(x) + '" y="' + (level - 4 + (i % 2)) + '" width="9" height="8" rx="2" transform="rotate(' + (i * 37 % 50 - 25) + " " + f(x + 4.5) + " " + level + ')"/>';
        }
      }
      out += '<path class="cl-glass" d="M' + -a + "," + top + "L" + -a + ",-4Q" + -a + ",0 " + (-a + 4) + ",0L" + (a - 4) + ",0Q" + a + ",0 " + a + ",-4L" + a + "," + top + '"/>' +
        // Thermostat neben der Wanne auf dem Tisch (dort ist er mit dem Bad antippbar): Gehäuse mit Anzeige, Heizstab über den Rand ins Wasser
        '<path class="cl-heater" d="M' + (a + 14) + ",-24L" + (a + 14) + "," + (top - 6) + "L" + (a - 9) + "," + (top - 6) + "L" + (a - 9) + "," + f(level + depth * 0.6) + '"/>' +
        '<rect class="cl-device" x="' + (a + 4) + '" y="-25" width="35" height="25" rx="3"/>' +
        (ctx.numbers ? '<g class="cl-meter"><rect x="' + (a + 7) + '" y="-21" width="29" height="14" rx="2"/><text x="' + (a + 21.5) + '" y="-10.5' +
          '" text-anchor="middle" style="font-size:8.5px">' + num(w.temp, 0, ctx.lang) + " °C</text></g>" : "") +
        '<circle class="cl-knob" cx="' + (a + 21.5) + '" cy="-3.5" r="1.8"/>';
      return out + badge(place ? a + 21.5 : 0, 14, ctx.no);
    }
  });

  // ------------------------------------------------------------------ Elektroden

  // place: { x, top, bottom, surface } im Becherglas; surface: Höhe des Flüssigkeitsspiegels. Ohne Gefäß steht sie in einem Halter.
  var electrode = {
    width: function () { return 44; },
    bounds: function () { return { x0: -12, x1: 12, top: -168 }; },
    terminal: function (place) { var p = place || { x: 0, top: -160 }; return { x: p.x, y: p.top + 6 }; },
    draw: function (w, ctx, place) {
      var p = place || { x: 0, bottom: -8, top: -160 }, x = p.x, wet = place && place.surface != null && place.surface < p.bottom, out = "", coat = w.coat && w.coat[0];
      if (!place) out += '<rect class="cl-wood" x="-14" y="-8" width="28" height="8" rx="2"/>';
      else out += '<line class="cl-clip" x1="' + f(x) + '" x2="' + f(x + (x < 0 ? -11 : 11)) + '" y1="' + (p.rim - 4) + '" y2="' + (p.rim - 4) + '"/>';
      out += '<rect class="cl-electrode" x="' + f(x - 3.5) + '" y="' + (p.top + 8) + '" width="7" height="' + (p.bottom - p.top - 8) + '" rx="1" fill="' +
        esc(L.species(w.material).color || "#888888") + '"/>';
      // Belag: auf dem eingetauchten Teil, in der Farbe des Metalls; je mehr sich abgeschieden hat, desto dichter
      if (coat && wet) {
        out += '<rect class="cl-coat" x="' + f(x - 4.5) + '" y="' + f(place.surface) + '" width="9" height="' + f(p.bottom - place.surface + 1) + '" rx="2" fill="' +
          esc(L.species(coat.id).color || "#888888") + '" fill-opacity="' + Math.min(0.95, 0.4 + coat.n / 1e-4 * 0.55).toFixed(2) + '"/>';
      }
      if (w.bub > 1e-9 && wet && L.fx) out += L.fx.bubbles({ x0: x - 9, x1: x + 9, top: place.surface, bottom: p.bottom }, w.bub, ctx.t || 0, ctx.seed || 1, ctx.still);
      out += '<circle class="cl-terminal" cx="' + f(x) + '" cy="' + (p.top + 6) + '" r="4"/>';
      // der Pol steht neben dem Anschluss, auf der Seite der Gefäßwand: darüber laufen die Leitungen
      if (w.pole) out += '<text class="cl-pole" x="' + f(x + (x < 0 ? -11 : 11)) + '" y="' + (p.top + 11) + '" text-anchor="middle">' + (w.pole === "+" ? "+" : "−") + "</text>";
      return out + (place ? "" : badge(0, 14, ctx.no));
    }
  };
  Object.keys(L.parts).forEach(function (type) { if (L.parts[type].electrode) L.registerPart(type, electrode); });
  L.electrodeLook = electrode;          // für eigene Elektroden: L.registerPart("electrode-Pb", Object.assign({ kind: "tool", electrode: "Pb(s)", g: 10, unit: "g", lag: 0 }, L.electrodeLook))

  // ------------------------------------------------------------------ Netzgerät, Strommesser, Spannungsmesser, Lämpchen

  function post(x, y, cls) { return '<circle class="cl-terminal' + (cls || "") + '" cx="' + x + '" cy="' + y + '" r="4"/>'; }

  // terminals: die beiden Anschlüsse, links und rechts. Am Netzgerät ist der linke der Pluspol, solange es nicht umgepolt ist.
  L.registerPart("supply", {
    width: function () { return 100; },
    bounds: function () { return { x0: -42, x1: 42, top: -62 }; },
    terminals: [{ x: -24, y: -56 }, { x: 24, y: -56 }],
    draw: function (w, ctx) {
      var plus = w.flip ? 24 : -24;
      return '<rect class="cl-device" x="-40" y="-52" width="80" height="52" rx="5"/>' +
        '<g class="cl-meter"><rect x="-30" y="-44" width="60" height="20" rx="3"/><text x="0" y="-30" text-anchor="middle">' +
        (ctx.numbers ? shown(w, ctx.lang) : w.volts > 0 ? "V" : "–") + "</text></g>" +
        '<circle class="cl-knob" cx="0" cy="-11" r="7"/><line class="cl-knob-mark" x1="0" y1="-11" x2="' + f(6 * Math.sin(w.volts / 12 * 4.4 - 2.2)) + '" y2="' + f(-11 - 6 * Math.cos(w.volts / 12 * 4.4 - 2.2)) + '"/>' +
        post(plus, -56, " cl-plus") + post(-plus, -56, " cl-minus") +
        '<text class="cl-sign" x="' + (plus < 0 ? plus - 10 : plus + 10) + '" y="-53" text-anchor="middle">+</text>' +
        '<text class="cl-sign" x="' + (plus < 0 ? -plus + 10 : -plus - 10) + '" y="-53" text-anchor="middle">−</text>' +
        badge(0, 14, ctx.no);
    }
  });

  function dial(letter) {
    return {
      width: function () { return 84; },
      bounds: function () { return { x0: -34, x1: 34, top: -56 }; },
      terminals: [{ x: -20, y: -50 }, { x: 20, y: -50 }],
      draw: function (w, ctx) {
        return '<rect class="cl-device" x="-32" y="-46" width="64" height="46" rx="5"/>' +
          '<g class="cl-meter"><rect x="-27" y="-40" width="54" height="20" rx="3"/><text x="0" y="-26" text-anchor="middle">' +
          (ctx.numbers ? shown(w, ctx.lang) : letter) + "</text></g>" +
          '<circle class="cl-knob" cx="0" cy="-9" r="6.5"/><text class="cl-letter" x="0" y="-5.5" text-anchor="middle">' + letter + "</text>" +
          post(-20, -50) + post(20, -50) + badge(0, 14, ctx.no);
      }
    };
  }
  L.registerPart("ammeter", dial("A"));
  L.registerPart("voltmeter", dial("V"));

  L.registerPart("lamp", {
    width: function () { return 64; },
    bounds: function () { return { x0: -24, x1: 24, top: -60 }; },
    terminals: [{ x: -14, y: -18 }, { x: 14, y: -18 }],
    draw: function (w, ctx) {
      var glow = Math.max(0, Math.min(1, w.value || 0)), out = "", i, a;
      if (glow > 0.02) {
        out += '<circle class="cl-glow" cx="0" cy="-38" r="' + f(13 + 9 * glow) + '" fill-opacity="' + (0.25 + 0.75 * glow).toFixed(2) + '"/>';
        if (glow > 0.5) for (i = 0; i < 8; i++) {
          a = i / 8 * 2 * Math.PI;
          out += '<line class="cl-glare-ray" x1="' + f(Math.cos(a) * 24) + '" y1="' + f(-38 + Math.sin(a) * 24) + '" x2="' + f(Math.cos(a) * 30) + '" y2="' + f(-38 + Math.sin(a) * 30) + '"/>';
        }
      }
      return out + '<circle class="cl-bulb" cx="0" cy="-38" r="11"' + (glow > 0.02 ? ' style="fill:#ffe98a"' : "") + "/>" +
        '<path class="cl-filament" d="M-4,-27L-4,-36L0,-40L4,-36L4,-27"/>' +
        '<rect class="cl-device" x="-7" y="-28" width="14" height="10" rx="1"/><rect class="cl-device" x="-20" y="-14" width="40" height="14" rx="3"/>' +
        post(-14, -18) + post(14, -18) + badge(0, 14, ctx.no);
    }
  });

  // ------------------------------------------------------------------ Salzbrücke

  // place: { x1, y1, s1, x2, y2, s2 }: an beiden Enden die Stelle, der Rand des Gefäßes und wie tief sie eintaucht.
  function bridgePath(place) {
    var top = Math.min(place.y1, place.y2) - 24, dir = place.x2 > place.x1 ? 1 : -1;
    return "M" + f(place.x1) + "," + f(place.s1) + "L" + f(place.x1) + "," + (top + 10) + "Q" + f(place.x1) + "," + top + " " + f(place.x1 + 10 * dir) + "," + top +
      "L" + f(place.x2 - 10 * dir) + "," + top + "Q" + f(place.x2) + "," + top + " " + f(place.x2) + "," + (top + 10) + "L" + f(place.x2) + "," + f(place.s2);
  }

  L.registerPart("bridge", {
    width: function () { return 70; },
    bounds: function (t, place) {
      var top;
      if (!place) return { x0: -26, x1: 26, top: -48 };
      top = Math.min(place.y1, place.y2) - 24;
      return { x0: Math.min(place.x1, place.x2) - 5, x1: Math.max(place.x1, place.x2) + 5, top: top - 6, bottom: top + 14 };
    },
    draw: function (w, ctx, place) {
      var d = bridgePath(place || { x1: -20, y1: -18, s1: -4, x2: 20, y2: -18, s2: -4 });
      return '<path class="cl-bridge" d="' + d + '"/><path class="cl-bridge-core" d="' + d + '"/>' + (place ? "" : badge(0, 14, ctx.no));
    }
  });

  // ------------------------------------------------------------------ Rundkolben

  // Kugel mit dem Radius R auf einem Korkring, darüber der Hals; rechts am Hals das Ansatzrohr für den Kühler
  var FLASK = { R: 30, neck: 7, rim: -128, arm: -112 };
  var FLASK_CY = -4 - FLASK.R;

  function flaskSurface(w) {
    var R = FLASK.R - 1, share = Math.min(1, w.ml / w.cap), lo = 0, hi = 2 * R, h, i;
    for (i = 0; i < 30; i++) { h = (lo + hi) / 2; if (h * h * (3 * R - h) / (4 * R * R * R) < share) lo = h; else hi = h; }
    return FLASK_CY + R - (lo + hi) / 2;
  }

  function flaskFill(y) {                // Umriss der Flüssigkeit bis zur Höhe y
    var R = FLASK.R - 1, half;
    if (y <= FLASK_CY - R + 0.5) return "M0," + f(FLASK_CY - R) + "A" + R + "," + R + " 0 1 0 0.01," + f(FLASK_CY - R) + "Z";
    half = Math.sqrt(Math.max(0, R * R - (y - FLASK_CY) * (y - FLASK_CY)));
    return "M" + f(-half) + "," + f(y) + "A" + R + "," + R + " 0 " + (y < FLASK_CY ? 1 : 0) + " 0 " + f(half) + "," + f(y) + "Z";
  }

  L.registerPart("flask", {
    width: function () { return 2 * FLASK.R + 46; },
    bounds: function () { return { x0: -FLASK.R - 6, x1: FLASK.R + 6, top: FLASK.rim - 6 }; },
    surface: flaskSurface,
    foot: function () { return 14; },
    // slot beim Kühler: die Seite, auf der die Vorlage steht (−1 oder 1); dorthin zeigt das Ansatzrohr
    probe: function (v, type, slot) {
      if (type === "syringe") return { x: 0, rim: FLASK.rim, w: 2 * FLASK.neck + 4 };
      if (type === "tube") return { x: 0, rim: FLASK.rim, w: 2 * FLASK.neck + 4, top: FLASK.rim - PIPE_RISE };
      if (type === "condenser") return { x: (slot < 0 ? -1 : 1) * (FLASK.neck + 12), rim: FLASK.arm + 4 };
      if (type === "bridge") return { x: 0, rim: FLASK.rim };
      if (type === "reflux") return { x: FLASK.neck + 14, rim: FLASK.arm - 2, top: FLASK.arm - 2 - REFLUX, lean: 18 };      // auf dem Ansatzrohr: der Hals bleibt frei
      if (type === "conductometer" || type === "photometer") return { x: 1, bottom: FLASK_CY + 14, top: FLASK.rim - 76, box: -70 };
      return type === "phmeter" ? { x: 2, bottom: FLASK_CY + 14, top: FLASK.rim - 46, box: -62 } : { x: -2, bottom: FLASK_CY + 14, top: FLASK.rim - 70, tag: -62 };
    },
    mount: function (w) { return { x: 0, rim: FLASK.rim, surface: w.ml > 0.005 ? flaskSurface(w) : FLASK_CY + FLASK.R, edge: FLASK.R + 6 }; },
    draw: function (w, ctx) {
      var R = FLASK.R, n = FLASK.neck, y = flaskSurface(w), meet = FLASK_CY - Math.sqrt(R * R - n * n), half;
      if (w.broken) return shards(R, ctx);
      half = Math.sqrt(Math.max(0, (R - 1) * (R - 1) - (y - FLASK_CY) * (y - FLASK_CY)));
      return (ctx.lift ? "" : '<path class="cl-wood" d="M-16,-4L16,-4L13,0L-13,0Z"/>') +
        contents(w, ctx, { path: flaskFill(y), fill: flaskFill, x0: -half, x1: half, top: y, bottom: FLASK_CY + R - 1, rim: FLASK.rim, tall: true }) +
        '<path class="cl-glass" d="M' + -n + "," + FLASK.rim + "L" + -n + "," + f(meet) + "A" + R + "," + R + " 0 1 0 " + n + "," + f(meet) + "L" + n + "," + FLASK.rim + '"/>' +
        '<path class="cl-glass" d="M' + n + "," + (FLASK.arm - 3) + "L" + (n + 12) + "," + (FLASK.arm + 1) + "M" + n + "," + (FLASK.arm + 3) + "L" + (n + 12) + "," + (FLASK.arm + 7) + '"/>' +
        '<line class="cl-shine" x1="-14" y1="' + (FLASK_CY - 16) + '" x2="-19" y2="' + (FLASK_CY + 4) + '"/>' +
        badge(0, 14 + (ctx.lift || 0), ctx.no) + volumeLabel(w, ctx, 38);
    }
  });

  // ------------------------------------------------------------------ Liebigkühler

  // place: { x1, y1 } Ende des Ansatzrohrs, { x2, y2 } Öffnung der Vorlage, s2 ihr Flüssigkeitsspiegel. Das Rohr fällt zur Vorlage hin ab.
  function ductAt(place) {
    var p = place || { x1: -30, y1: -40, x2: 30, y2: -20, s2: -4 }, low = Math.max(p.y1 + 24, p.y2 - 22);
    return { x1: p.x1, y1: p.y1, x3: p.x2, y3: low, y4: p.y2 + 10, s2: p.s2 };
  }

  L.registerPart("condenser", {
    width: function () { return 90; },
    room: 120,                                                  // Platz bis zur Vorlage
    bounds: function (t, place) {
      var d = ductAt(place);
      return { x0: Math.min(d.x1, d.x3) - 8, x1: Math.max(d.x1, d.x3) + 8, top: Math.min(d.y1, d.y3) - 12, bottom: Math.max(d.y3, d.y4) + 4 };
    },
    draw: function (w, ctx, place) {
      var d = ductAt(place), dx = d.x3 - d.x1, dy = d.y3 - d.y1, a = { x: d.x1 + dx * 0.15, y: d.y1 + dy * 0.15 }, b = { x: d.x1 + dx * 0.8, y: d.y1 + dy * 0.8 };
      var len = Math.sqrt(dx * dx + dy * dy) || 1, nx = -dy / len * 7, ny = dx / len * 7, out;
      out = '<path class="cl-jacket" d="M' + f(a.x + nx) + "," + f(a.y + ny) + "L" + f(b.x + nx) + "," + f(b.y + ny) + "L" + f(b.x - nx) + "," + f(b.y - ny) + "L" + f(a.x - nx) + "," + f(a.y - ny) + 'Z"/>' +
        // Kühlwasser: unten hinein, oben heraus
        '<path class="cl-hose" d="M' + f(b.x + nx) + "," + f(b.y + ny) + "l0,10M" + f(a.x - nx) + "," + f(a.y - ny) + 'l0,-10"/>' +
        '<path class="cl-glass" d="M' + f(d.x1) + "," + f(d.y1) + "L" + f(d.x3) + "," + f(d.y3) + "L" + f(d.x3) + "," + f(d.y4) + '"/>';
      if (w.drip && place && L.fx) out += L.fx.drops(d.x3, d.y4, d.s2, ctx.t || 0, ctx.still);
      return out + (place ? "" : badge(0, 14, ctx.no));
    }
  });

  // ------------------------------------------------------------------ Gasableitungsrohr

  // place: { x1, y1, w } Stopfen im ersten Gefäß (Mitte, Rand, Breite); { x2, y2 } Öffnung des zweiten, end: wo das Rohr dort endet
  // (unter dem Spiegel oder nahe am Boden eines leeren Gefäßes). Das Rohr steigt über beide Ränder, läuft hinüber und taucht ein.
  // Die Blasen zeichnet das zweite Gefäß selbst (wie in 3D).
  function pipeAt(place) {
    var p = place || { x1: -24, y1: -30, w: 16, x2: 24, y2: -30, end: -6 };
    return { x1: p.x1, y1: p.y1, w: p.w, x2: p.x2, top: Math.min(p.y1, p.y2) - PIPE_RISE, end: Math.max(p.end, p.y2 + 8) };
  }

  L.registerPart("tube", {
    width: function () { return 70; },
    room: 110,                                                  // Platz bis zum zweiten Gefäß
    bounds: function (t, place) {
      var d = pipeAt(place);
      return { x0: Math.min(d.x1, d.x2) - 8, x1: Math.max(d.x1, d.x2) + 8, top: d.top - 6, bottom: place ? d.y1 + 8 : d.end + 4 };
    },
    draw: function (w, ctx, place) {
      var d = pipeAt(place), r = 6, dir = d.x2 >= d.x1 ? 1 : -1, out = "";
      out += '<path class="cl-stopper" d="M' + f(d.x1 - d.w / 2) + "," + (d.y1 - 4) + "L" + f(d.x1 + d.w / 2) + "," + (d.y1 - 4) + "L" +
        f(d.x1 + d.w / 2 - 2) + "," + (d.y1 + 7) + "L" + f(d.x1 - d.w / 2 + 2) + "," + (d.y1 + 7) + 'Z"/>';
      // Glasrohr mit zwei gerundeten Knien
      out += '<path class="cl-glass cl-pipe" d="M' + f(d.x1) + "," + (d.y1 + 6) + "L" + f(d.x1) + "," + f(d.top + r) + "Q" + f(d.x1) + "," + f(d.top) + " " + f(d.x1 + dir * r) + "," + f(d.top) +
        "L" + f(d.x2 - dir * r) + "," + f(d.top) + "Q" + f(d.x2) + "," + f(d.top) + " " + f(d.x2) + "," + f(d.top + r) + "L" + f(d.x2) + "," + f(d.end) + '"/>';
      return out + (place ? "" : badge(0, 14, ctx.no));
    }
  });

  // ------------------------------------------------------------------ Rückflusskühler

  var REFLUX = 110;                     // so weit ragt er über die Öffnung

  // place: { x, rim, top } aus probe() des Gefäßes: aufrecht über dessen Öffnung
  L.registerPart("reflux", {
    width: function () { return 40; },
    bounds: function (t, place) {
      var p = place || { x: 0, rim: 0, top: -REFLUX }, reach = (p.lean || 0) * Math.PI / 180, h = p.rim - p.top;
      return { x0: p.x - 14, x1: p.x + 14 + h * Math.sin(reach), top: p.rim - h * Math.cos(reach) - 6, bottom: p.rim };
    },
    draw: function (w, ctx, place) {
      var p = place || { x: 0, rim: 0, top: -REFLUX }, x = p.x, low = p.rim - 14, high = p.top + 14;
      // lean: schräg gestellt (Grad), um den Fuß gedreht
      return (p.lean ? '<g transform="rotate(' + p.lean + " " + x + " " + p.rim + ')">' : "") + '<path class="cl-jacket" d="M' + (x - 8) + "," + low + "L" + (x - 8) + "," + high + "L" + (x + 8) + "," + high + "L" + (x + 8) + "," + low + 'Z"/>' +
        '<path class="cl-hose" d="M' + (x + 8) + "," + (low - 6) + "l10,0M" + (x - 8) + "," + (high + 6) + 'l-10,0"/>' +
        '<path class="cl-glass" d="M' + (x - 3) + "," + (p.rim + 6) + "L" + (x - 3) + "," + p.top + "M" + (x + 3) + "," + (p.rim + 6) + "L" + (x + 3) + "," + p.top + '"/>' +
        (p.lean ? "</g>" : "") + (place ? "" : badge(0, 14, ctx.no));
    }
  });

  // ------------------------------------------------------------------ Bürette

  var BURETTE = { length: 230, cap: 50 };     // Länge der Skala in Bildpunkten für 50 mL

  // mount: wo sie hängt (aus dem Gefäß darunter), sonst steht sie für sich
  function buretteAt(mount) {
    var m = mount || { x: 0, rim: -70, surface: -2 }, tip = m.rim - 8;
    return { x: m.x, rim: m.rim, tip: tip, low: tip - 18, high: tip - 18 - BURETTE.length, surface: m.surface, rod: Math.max(m.x + 26, (m.edge || 0) + 14) };
  }

  function buretteSurface(w, mount) {
    var g = buretteAt(mount);
    return g.low - Math.min(1, w.ml / BURETTE.cap) * BURETTE.length;
  }

  L.registerPart("burette", {
    width: function () { return 80; },
    surface: buretteSurface,
    reach: function (mount) { return -buretteAt(mount).high + 16; },        // so hoch reicht sie über den Tisch
    bounds: function (v, mount) { var g = buretteAt(mount); return { x0: g.x - 14, x1: g.x + 14, top: g.high - 8, bottom: g.rim - 2 }; },
    draw: function (w, ctx, mount) {
      var g = buretteAt(mount), x = g.x, rod = g.rod, level = buretteSurface(w, mount), out, ml, y, open = w.tap > 0;
      out = '<rect class="cl-stand" x="' + (rod - 10) + '" y="-5" width="46" height="5" rx="2"/>' +
        '<line class="cl-rod" x1="' + rod + '" x2="' + rod + '" y1="-5" y2="' + (g.high + 24) + '"/>' +
        '<line class="cl-rod" x1="' + rod + '" x2="' + (x + 6) + '" y1="' + (g.high + 60) + '" y2="' + (g.high + 60) + '"/>' +
        '<line class="cl-rod" x1="' + rod + '" x2="' + (x + 6) + '" y1="' + (g.low - 30) + '" y2="' + (g.low - 30) + '"/>';
      if (w.ml > 0.005) {
        out += '<rect class="cl-liquid" x="' + (x - 5) + '" y="' + f(level) + '" width="10" height="' + f(g.low - level) + '" fill="' + liquidColor(w.color.rgb) + '"/>' +
          '<rect class="cl-liquid" x="' + (x - 1.5) + '" y="' + g.low + '" width="3" height="' + (g.tip - g.low) + '" fill="' + liquidColor(w.color.rgb) + '"/>';
      }
      out += '<rect class="cl-glass" x="' + (x - 6) + '" y="' + (g.high - 10) + '" width="12" height="' + (g.low - g.high + 10) + '" rx="2"/>' +
        '<path class="cl-glass" d="M' + (x - 2.5) + "," + g.low + "L" + (x - 2.5) + "," + (g.tip - 3) + "L" + x + "," + g.tip + "L" + (x + 2.5) + "," + (g.tip - 3) + "L" + (x + 2.5) + "," + g.low + '"/>';
      for (ml = 0; ml <= BURETTE.cap; ml += 5) {
        y = g.high + ml / BURETTE.cap * BURETTE.length;
        out += '<line class="cl-mark" x1="' + (x + 6) + '" x2="' + (x + (ml % 10 ? 9 : 12)) + '" y1="' + f(y) + '" y2="' + f(y) + '"/>';
        if (ctx.numbers && ml % 10 === 0) out += '<text class="cl-mark-text" x="' + (x - 9) + '" y="' + f(y + 2.5) + '" text-anchor="end">' + ml + "</text>";
      }
      // Hahn: quer heißt zu, längs heißt offen
      out += '<rect class="cl-cock" x="' + (x - 4) + '" y="' + (g.low + 4) + '" width="8" height="8" rx="2"/>' +
        (open ? '<line class="cl-cock-grip" x1="' + x + '" x2="' + x + '" y1="' + (g.low + 1) + '" y2="' + (g.low + 15) + '"/>'
          : '<line class="cl-cock-grip" x1="' + (x - 9) + '" x2="' + (x + 9) + '" y1="' + (g.low + 8) + '" y2="' + (g.low + 8) + '"/>');
      if (open && w.ml > 0.001 && mount && L.fx) {
        out += w.tap >= 0.3 ? L.fx.stream(x, g.tip, g.surface, ctx.t, ctx.still) : L.fx.drops(x, g.tip, g.surface, ctx.t, ctx.still);
      }
      return out + (mount ? "" : badge(0, 14, ctx.no));
    }
  });

  // Farben der Teilchenlupe. Ein Teilchen trägt die Farbe, die es der Lösung gibt (ein Feststoff seine eigene); farblose bekommen
  // einen blassen Ton, Kationen einen warmen, Anionen einen kühlen, ungeladene einen grauen. ids: alle Teilchen, die gerade zu sehen
  // sind – so bekommen zwei farblose nie denselben Ton, solange die Palette reicht. Zurück: { id: Farbe }
  var PALE = {
    plus: ["#f6c3ae", "#f8dc9c", "#f4b4c6", "#f0cfa0", "#f9c9e3", "#e9b79a"],
    minus: ["#aecdf6", "#b3ead6", "#c9c3f6", "#a9e3f2", "#a8f0c4", "#b9d3c4"],
    none: ["#d7dbe0", "#e6dfcf", "#cfe0d9", "#e3d6e6"]
  };
  function dotColors(ids) {
    var out = {}, used = {};
    ids.slice().sort().forEach(function (id) {
      var s = L.species(id), conc = {}, top = 0, rgb, list, start, i, h = 7;
      if (s.phase === "s") { out[id] = s.color || "#c9ced6"; return; }
      if (s.bands) {
        s.bands.forEach(function (band) { top = Math.max(top, band[2]); });
        conc[id] = 1.5 / top;
        rgb = L.tint(conc, 1).rgb;
        if (Math.min(rgb[0], rgb[1], rgb[2]) < 215) { out[id] = css(rgb); return; }      // eine Bande im Ultravioletten färbt nicht
      } else if (s.color) { out[id] = s.color; return; }
      list = PALE[s.charge > 0 ? "plus" : s.charge < 0 ? "minus" : "none"];
      for (i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) % 9973;
      start = h % list.length;
      for (i = 0; i < list.length && used[list[(start + i) % list.length]]; i++);
      out[id] = list[(start + i) % list.length];
      used[out[id]] = true;
    });
    return out;
  }

  // ------------------------------------------------------------------ Bildchen für das Regal

  function icon(id) {
    var def = L.parts[id], r, rgb, body;
    if (def) {
      body = id === "testtube" ? '<path class="cl-glass" d="M9,3L9,22A5,5 0 0 0 19,22L19,3"/>'
        : id === "beaker" ? '<path class="cl-glass" d="M5,6L5,24Q5,27 8,27L20,27Q23,27 23,24L23,6"/>'
        : id === "dish" ? '<path class="cl-porcelain-edge" d="M3,11Q5,25 11,25L17,25Q23,25 25,11"/>'
        : id === "burner" ? '<rect class="cl-burner" x="7" y="25" width="14" height="3" rx="1"/><rect class="cl-burner" x="12.5" y="13" width="3" height="12"/><path class="cl-flame cl-roaring" d="M10.5,13Q10.5,6 14,2Q17.5,6 17.5,13Z"/>'
        : id === "syringe" ? '<rect class="cl-glass" x="2" y="11" width="17" height="8" rx="1"/><rect class="cl-plunger" x="10" y="12" width="2" height="6"/><line class="cl-rod" x1="12" x2="26" y1="15" y2="15"/><line class="cl-rod" x1="26" x2="26" y1="11" y2="19"/>'
        : id === "splint" ? '<line class="cl-splint" x1="4" y1="27" x2="19" y2="11"/><path class="cl-splint-flame" d="M16,11Q16,5 19.5,1Q23,5 23,11Z"/>'
        : id === "glowsplint" ? '<line class="cl-splint" x1="4" y1="27" x2="20" y2="9"/><circle class="cl-splint-glow" cx="20" cy="9" r="3"/>'
        : id === "rod" ? '<line class="cl-rodlet" x1="4" y1="27" x2="23" y2="4"/>'
        : def.electrode ? '<rect class="cl-electrode" x="11" y="5" width="6" height="23" rx="1" fill="' + esc((L.db.species[def.electrode] || {}).color || "#888888") + '"/><circle class="cl-terminal" cx="14" cy="4" r="3"/>'
        : id === "supply" ? '<rect class="cl-device" x="3" y="9" width="22" height="18" rx="2"/><g class="cl-meter"><rect x="6" y="12" width="16" height="7" rx="1"/></g><circle class="cl-terminal cl-plus" cx="9" cy="7" r="2.5"/><circle class="cl-terminal cl-minus" cx="19" cy="7" r="2.5"/>'
        : id === "ammeter" || id === "voltmeter" ? '<rect class="cl-device" x="4" y="7" width="20" height="20" rx="2"/><circle class="cl-knob" cx="14" cy="17" r="7"/><text class="cl-letter" x="14" y="20.5" text-anchor="middle">' + (id === "ammeter" ? "A" : "V") + "</text>"
        : id === "lamp" ? '<circle class="cl-bulb" cx="14" cy="11" r="8" style="fill:#ffe98a"/><rect class="cl-device" x="10" y="18" width="8" height="5"/><rect class="cl-device" x="6" y="23" width="16" height="5" rx="1"/>'
        : id === "bridge" ? '<path class="cl-bridge" d="M7,26L7,12Q7,6 13,6L15,6Q21,6 21,12L21,26"/>'
        : id === "flask" ? '<path class="cl-glass" d="M11.5,2L11.5,10A8,8 0 1 0 16.5,10L16.5,2"/>'
        : id === "reflux" ? '<rect class="cl-jacket" x="9" y="5" width="10" height="16"/><path class="cl-glass" d="M12,1L12,27M16,1L16,27"/>'
        : id === "balance" ? '<rect class="cl-scale" x="2" y="16" width="24" height="10" rx="2"/><rect class="cl-scale-pan" x="5" y="13" width="18" height="2.5"/><g class="cl-meter"><rect x="8" y="18" width="12" height="6" rx="1"/></g>'
        : id === "tube" ? '<path class="cl-stopper" d="M2,13L10,13L9,18L3,18Z"/><path class="cl-glass" d="M6,13L6,5Q6,3 8,3L20,3Q22,3 22,5L22,27"/>'
        : id === "condenser" ? '<path class="cl-jacket" d="M6,7L22,15L19.5,20L3.5,12Z"/><path class="cl-glass" d="M2,6L25,18L25,27"/>'
        : id === "conductometer" ? '<rect class="cl-probe" x="5" y="8" width="4" height="19" rx="2"/><g class="cl-meter"><rect x="11" y="4" width="16" height="11" rx="2"/><text x="19" y="12.5" text-anchor="middle" style="font-size:6px">mS</text></g>'
        : id === "bath" ? '<rect class="cl-bath-water" x="4" y="15" width="20" height="11"/><path class="cl-glass" d="M3,9L3,25Q3,27 5,27L23,27Q25,27 25,25L25,9"/><path class="cl-glass" d="M11,3L11,19A3,3 0 0 0 17,19L17,3"/>'
        : id === "photometer" ? '<rect class="cl-probe" x="5" y="8" width="4" height="19" rx="2"/><circle class="cl-light" cx="7" cy="25" r="2.6" fill="rgb(70, 220, 90)"/><g class="cl-meter"><rect x="11" y="4" width="16" height="11" rx="2"/><text x="19" y="12.5" text-anchor="middle" style="font-size:8px">λ</text></g>'
        : id === "burette" ? '<rect class="cl-glass" x="11.5" y="2" width="5" height="19" rx="1"/><rect class="cl-cock" x="10" y="21" width="8" height="4" rx="1"/><path class="cl-glass" d="M14,25L14,29"/>'
        : id === "phmeter" ? '<rect class="cl-probe" x="5" y="8" width="4" height="19" rx="2"/><g class="cl-meter"><rect x="11" y="4" width="16" height="11" rx="2"/><text x="19" y="12.5" text-anchor="middle" style="font-size:7px">pH</text></g>'
        : '<rect class="cl-thermo" x="12" y="2" width="4" height="22" rx="2"/><circle class="cl-mercury" cx="14" cy="25" r="3.5"/><rect class="cl-mercury" x="13.2" y="12" width="1.6" height="12"/>';
      return '<svg viewBox="0 0 28 30" width="28" height="30" aria-hidden="true">' + body + "</svg>";
    }
    r = L.reagent(id);
    if (r.solid) {
      body = '<rect class="cl-glass" x="5" y="9" width="18" height="19" rx="3"/><rect class="cl-cap" x="6" y="4" width="16" height="5" rx="1.5"/>' +
        '<path d="M7,26L7,19Q14,15 21,19L21,26Z" fill="' + esc(L.species(r.solid).color || "#9aa0a8") + '"/>';
    } else {
      rgb = L.sample(id) || [255, 255, 255];
      body = '<path d="M7,14L21,14L21,26L7,26Z" fill="' + liquidColor(rgb) + '"/>' +
        '<path class="cl-glass" d="M11,3L11,8Q5,10 5,15L5,25Q5,28 8,28L20,28Q23,28 23,25L23,15Q23,10 17,8L17,3"/>' +
        '<rect class="cl-cap" x="10" y="1" width="8" height="3" rx="1"/>';
    }
    return '<svg viewBox="0 0 28 30" width="28" height="30" aria-hidden="true">' + body + "</svg>";
  }

  L.shown = shown;
  L.dotColors = dotColors;
  L.partName = partName;
  L.TAPS = TAPS;
  L.tapKey = tapKey;
  L.text = text;
  L.num = num;
  L.amount = amount;
  L.trim = trim;
  L.clock = clock;
  L.colorWord = colorWord;
  L.nameOf = nameOf;
  L.names = L.names || {};
  L.LANGS = LANGS;
  L.langOf = langOf;
  L.RTL = RTL;
  L.portionText = portionText;
  L.goalText = goalText;
  L.say = say;
  L.explain = explain;
  L.escape = esc;
  L.icon = icon;
  L.liquidColor = liquidColor;
  // Maße der Zeichnungen in Bildpunkten, für die 3D-Ansicht: dort sind 16 Bildpunkte 1 cm
  L.shapes = { tube: TUBE, beaker: BEAKER, dish: DISH, dishHalf: dishHalf, burette: BURETTE, buretteAt: buretteAt, flask: FLASK, reflux: REFLUX, pipeRise: PIPE_RISE };
})(typeof globalThis !== "undefined" ? globalThis : this);
