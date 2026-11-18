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
      "part.testtube": "test tube", "part.beaker": "beaker", "part.calorimeter": "calorimeter", "part.funnel": "funnel with filter paper", "part.cylinder": "measuring cylinder", "part.jar": "gas jar", "part.pipette": "volumetric pipette {ml} mL",
      "hint.pipette1": "Now tap the vessel the pipette should draw from.", "hint.pipette2": "Now tap the vessel it should deliver into.",
      "say.pipetted": "{ml} mL transferred with the pipette from {from} into {vessel}", "pipetteShort": "There is not enough in it for the pipette.", "pipetteFull": "There is no room for it in that vessel.", "pipetteDrawn": "Drawn up from {vessel}.",
      "noHeat": "Measuring cylinders, gas jars and volumetric flasks are not heated.", "pipetteSame": "The pipette delivers into another vessel.", "hint.funnel": "Now tap the vessel the funnel should hang over.", "notHere.funnel": "That does not work on a funnel.", "part.thermometer": "thermometer", "part.flask": "round-bottom flask", "part.condenser": "Liebig condenser", "part.reflux": "reflux condenser",
      "hint.still1": "Now tap the vessel to distil from.", "hint.still2": "Now tap the receiver for the distillate.",
      "sameStill": "The condenser leads into another vessel.",
      "part.tube": "gas delivery tube", "hint.tube1": "Now tap the vessel the gas comes from.", "hint.tube2": "Now tap the vessel to lead the gas into.",
      "sameTube": "The tube leads into another vessel.",
      "part.centrifuge": "centrifuge", "spin": "Rotor", "spin.0": "off", "spin.1": "running",
      "say.spinOn": "{part}: switched on", "say.spinOff": "{part}: switched off",
      "spinning": "The centrifuge is running – switch it off first.", "tubesOnly": "Only test tubes fit into the centrifuge.",
      "spinFree": "Take everything out of the test tube first; nothing may hang over it or lead into it, only a stopper may stay.",
      "spinFlow": "Something is still flowing – wait first.", "spinEmpty": "Put a test tube in first.",
      "hint.centrifuge": "Now tap the test tube that should go into the centrifuge – or the bench.",
      "part.balance": "balance", "hint.scale": "Now tap the vessel to put on the balance – or the bench.", "tare": "Tare",
      "say.tare": "{part}: set to zero", "chart.mass": "Mass",
      "eq.catalyst": "catalyst",
      "restMore": "Press play once more to let it run for another ten minutes anyway.",
      "lens.paste": "Too little liquid for so much solute: a paste the particle view cannot look into.",
      "lens.residue": "No liquid in the vessel; a residue from evaporation lies at the bottom.",
      "flow": "Currents", "flow.temp": "temperature", "flow.diff": "temperature differences", "flow3d": "3D", "flow3d.cut": "cross-section", "flow3d.particles": "particles", "flow.mix": "streaks", "flow.vortex": "eddies", "flow.pressure": "pressure",
      "lens": "Particle view", "lens.scale": "1 dot stands for {c} mmol/L.", "lens.water": "Water is only hinted at.", "lens.dry": "No liquid in the vessel.",
      "lens.none": "So little is dissolved that this small sample would show none of it.", "lens.hang": "suspended", "lens.solid": "solid",
      "part.bath": "water bath", "part.photometer": "photometer", "part.volflask": "volumetric flask", "toMark": "Fill to the mark", "say.toMark": "{vessel}: filled up to the mark with distilled water.", "part.uvlamp": "UV lamp", "part.geiger": "Geiger counter", "unit.cpm": "counts/min", "dark": "Lights off", "temp": "Temperature", "wave": "Wavelength", "transmission": "transmittance",
      "say.temp": "{part}: set to {temp} °C", "say.tempSet": "{part}: temperature changed",
      "hold": "Plunger", "release": "Let go", "say.hold": "{part}: plunger held at {ml} mL", "say.holdSet": "{part}: plunger moved", "say.release": "{part}: plunger let go",
      "say.wave": "{part}: set to {nm} nm", "say.waveSet": "{part}: wavelength changed", "unit.E": "A",
      "chart.A": "Absorbance", "chart.spectrum": "Spectrum: absorbance against wavelength", "chart.wave": "Wavelength in nm", "chart.photo": "Photometric titration",
      "part.phmeter": "pH meter", "part.burette": "burette", "part.separator": "separatory funnel",
      "part.dish": "evaporating dish", "part.burner": "burner", "part.syringe": "gas syringe",
      "part.splint": "Burning splint", "part.glowsplint": "Glowing splint", "part.rod": "Flame test rod",
      "part.conductometer": "conductivity meter", "part.supply": "power supply", "part.ammeter": "ammeter",
      "part.voltmeter": "voltmeter", "part.lamp": "lamp", "part.bridge": "salt bridge",
      "part.electrode-C": "graphite electrode", "part.electrode-Pt": "platinum electrode", "part.electrode-Cu": "copper electrode",
      "part.electrode-Zn": "zinc electrode", "part.electrode-Fe": "iron electrode", "part.electrode-Ag": "silver electrode", "part.electrode-Pb": "lead electrode", "part.electrode-Ni": "nickel electrode",
      "group.water": "", "group.acid": "Acids and bases", "group.salt": "Salt solutions", "group.indicator": "Indicators",
      "group.solid": "Solids", "group.gear": "Equipment", "group.other": "Other solutions", "group.electric": "Electricity",
      "hint.electrode": "Now tap the beaker it should dip into.",
      "hint.circuit": "Now tap the vessel whose electrodes it is connected to.",
      "hint.bridge1": "Now tap the first vessel.", "hint.bridge2": "Now tap the second vessel.",
      "twoOnly": "This vessel already holds two electrodes.", "tooNarrow": "Electrodes only fit into a beaker.", "insulated": "The calorimeter is insulated: it does not go on a burner or water bath.",
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
      "hint.test": "Now tap the vessel whose mouth it is held to.", "hint.paper": "Now tap the vessel whose mouth it is held over – without touching the liquid.",
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
      "say.smell": "{vessel}: There is a pungent smell of {name}.", "say.smellFruity": "{vessel}: There is a fruity smell of {name}.", "say.smellRotten": "{vessel}: It smells of rotten eggs: {name}.",
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
      "aria.under": "under {vessel}", "aria.at": "connected to {vessel}", "aria.flame": "flame {state}", "aria.boiling": "boiling", "shake": "Shake", "mix": "Hand blender", "say.layerOut": "{vessel}: the lower layer has run out – close the tap now", "say.shake": "{vessel}: shaken for ten seconds", "say.mix": "{vessel}: mixed with a hand blender for ten seconds",
      "aria.oilTop": "on top a layer of {name}", "aria.oilBottom": "at the bottom a layer of {name}",
      "aria.residue": "residue", "aria.broken": "shattered", "aria.burning": "on fire",
      "amount": "Amount", "less": "less", "more": "more",
      "ghs.GHS01": "explosive", "ghs.GHS02": "flammable", "ghs.GHS03": "oxidising", "ghs.GHS04": "gas under pressure", "ghs.GHS05": "corrosive",
      "ghs.GHS06": "acutely toxic", "ghs.GHS07": "harmful or irritant", "ghs.GHS08": "serious health hazard", "ghs.GHS09": "hazardous to the environment",
      "ghs.danger": "Danger", "ghs.warning": "Warning",
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
      "panel.pour": "Pour into", "panel.pourGo": "Pour", "panel.dispose": "Dispose of:", "panel.remove": "Put away",
      "bin.sink": "sink", "bin.acid": "acids and bases", "bin.heavy": "heavy metal salts", "bin.organic": "organic solvents", "bin.solid": "solids", "bin.reduce": "reduce with sodium thiosulfate first", "bin.teacher": "back to the teacher", "bin.oxidize": "oxidise to sulfate with hydrogen peroxide first",
      "say.disposed": "{vessel}: disposed of – {bin}. Correct.", "say.disposedWrong": "{vessel}: disposed of – {bin}. Better: {want}. {why}",
      "say.disposedSpare": "{vessel}: disposed of – {bin}. Fine, but the sink would have done.", "say.disposedHidden": "{vessel}: disposed of – {bin}. That was not the right container.",
      "why.reduce": "Oxidising agents such as bleach or iodine would release chlorine with acids or harm the waste water.",
      "why.teacher": "Remains of alkali metals go back under paraffin oil; the teacher destroys them.",
      "why.oxidize": "Sulfite releases sulfur dioxide with acids.",
      "why.silver": "Ammoniacal silver solution forms explosive silver nitride on standing; the teacher destroys it right away.",
      "why.sink": "Neutral solutions without heavy metals may go down the sink with plenty of water.",
      "why.acid": "Neutralise acidic and alkaline solutions first (pH 6 to 9) or collect them with the acids and bases.",
      "why.heavy": "Heavy metal ions must not get into the waste water.", "why.organic": "Organic solvents are collected separately.",
      "why.solid": "Solids block the sink and are collected separately.", "goal.disposed": "dispose of everything correctly", "goal.disposedIn": "dispose of {name} correctly",
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
      "say.haze": "{vessel}: The liquid turns cloudy: finely divided {name}.", "say.mirror": "{vessel}: A mirror of {name} forms on the wall of the vessel.", "hidden.mirror": "{vessel}: A mirror forms on the wall of the vessel.", "say.opaque": "{vessel}: You can no longer see through the liquid.", "say.foam": "{vessel}: Foam forms.", "say.foamOver": "{vessel}: The foam swells over the rim.", "say.shine": "{vessel}: The solution glows {color}.", "say.shineEnd": "{vessel}: The glow fades.",
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
      "err.view": "There is no such view (2d or 3d)", "err.scatter": "scatter is true, false or a number", "err.scene": "This scene setting does not fit",
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
      "others": "Experiments of others", "others.anon": "no name", "others.viewing": "You are looking at the experiment of {name}.", "others.back": "Back to my experiment",
      "log.copy": "Copy the log", "log.manual": "The log as text – select and copy:",
      "table.copy": "Copy the table", "table.manual": "The readings, separated by tabs – select and copy:",
      "table.note": "Note the readings", "table.clear": "Clear the table", "table.title": "Readings", "table.no": "No.",
      "table.given": "delivered", "table.noMeter": "No meter on the bench: there is nothing to note.",
      "task": "Task", "task.done": "Well done!", "goal.met": "met", "goal.open": "still open",
      "goal.min": "at least", "goal.max": "at most", "goal.from": "from", "goal.to": "to", "goal.in": "in {name}",
      "goal.has": "{name} is present", "goal.identify": "identify {name}", "sample": "sample {name}",
      "unknown.contents": "The contents are unknown.", "identify": "This is:", "identify.pick": "– choose –",
      "hidden.smell": "{vessel}: It smells pungent.", "hidden.fruity": "{vessel}: It smells fruity.", "hidden.rotten": "{vessel}: It smells of rotten eggs.", "hidden.haze": "{vessel}: The liquid turns finely cloudy.",
      "hidden.ignite": "{vessel}: Something catches fire.", "hidden.gone": "{vessel}: A substance is used up.", "hidden.plated": "{vessel}: A deposit forms.", "goal.gone": "{name}: no longer present",
      "measure.T": "Temperature", "measure.pH": "pH", "measure.kappa": "Conductivity", "measure.A": "Absorbance", "measure.V": "Gas volume", "measure.m": "Mass",
      "measure.I": "Current", "measure.U": "Voltage",
      "seen.gas": "Gas evolves", "seen.pop": "Hydrogen test: it pops", "seen.relight": "Glowing splint: it flares up", "seen.out": "Burning splint: it goes out",
      "seen.solid": "Precipitate", "seen.dissolved": "A solid dissolves", "seen.shine": "The solution glows", "seen.color": "Colour change", "seen.colorOf": "The solution turns {color}",
      "seen.paper": "Indicator paper held to the opening", "seen.paperOf": "Indicator paper turns {color}", "seen.paperWhite": "Indicator paper is bleached", "part.paper": "indicator paper",
      "say.paper": "{vessel}: The moist indicator paper turns {color}.", "say.paperWhite": "{vessel}: The moist indicator paper is bleached.",
      "part.stopper": "rubber stopper", "part.manometer": "manometer", "measure.p": "Pressure", "hint.stopper": "Now tap the vessel that should be closed.", "say.plugged": "{vessel} closed with {part}",
      "say.popped": "{vessel}: The stopper pops out!", "say.plungerOut": "{part}: The plunger pops out.", "say.suckBack": "{vessel}: Liquid is sucked back through the tube.", "say.spatter": "{vessel}: It spatters!", "seen.spatter": "It spatters",
      "seen.popped": "The stopper pops out", "seen.suckBack": "Liquid is sucked back", "seen.plungerOut": "The plunger pops out",
      "seen.boil": "The liquid boils", "seen.smell": "Smell", "seen.ignite": "Something burns", "seen.flame": "Flame colour",
      "seen.plated": "A coating forms on an electrode", "seen.lamp": "The lamp lights up", "seen.broken": "The glass breaks",
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
    if (def.label) key = "part." + def.label;                 // eine Reihe gleicher Geräte in mehreren Größen (Vollpipetten)
    if (key in L.strings.en) return text(key, lang, { ml: def.ml });
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
    else if (goal.disposed) return goal.in != null ? text("goal.disposedIn", lang, { name: (names && names[goal.in]) || goal.in }) : text("goal.disposed", lang);
    else if (goal.seen === "paper" && goal.name === "colorless") out = text("seen.paperWhite", lang);
    else if (goal.seen === "paper" && goal.name) out = text("seen.paperOf", lang, { color: colorWord(goal.name, false, lang) });
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
    if (r.unit === "cpm") return (v == null ? "–" : num(v, 0, lang)) + " " + text("unit.cpm", lang);
    if (v == null) return "– " + r.unit;
    if (r.unit === "A") return v < 0.9995 ? num(v * 1000, 1, lang) + " mA" : num(v, 2, lang) + " A";
    if (r.unit === "V") return num(v, 2, lang) + " V";
    if (r.unit === "mS/cm") return v >= 0.1 ? trim(v, lang) + " mS/cm" : trim(v * 1000, lang) + " µS/cm";
    if (r.unit === "bar") return num(v, 2, lang) + " bar";
    if (def.sense === "V") return num(v, 1, lang) + " mL · " + num(r.p == null ? 1 : r.p, 2, lang) + " bar";      // Kolbenprober mit Manometer
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
    var veiled = event.hidden || !!(ctx.hidden && ctx.hidden[event.vessel]);
    if (veiled) switch (event.key) {
      case "plated": case "gone": case "ignite": return text("hidden." + event.key, lang, vars);
      case "smell": return text(L.species(event.species).smell === "fruity" ? "hidden.fruity" : L.species(event.species).smell === "rotten" ? "hidden.rotten" : "hidden.smell", lang, vars);
      case "solid": if (event.colloid) return text("hidden.haze", lang, vars); if (event.mirror) return text("hidden.mirror", lang, vars);
    }
    switch (event.key) {
      case "disposed":                                           // in welchen Behälter, und ob er passte
        vars.bin = text("bin." + event.bin, lang);
        if (event.spare) return text("say.disposedSpare", lang, vars);
        if (event.right) return text("say.disposed", lang, vars);
        if (veiled) return text("say.disposedHidden", lang, vars);      // eine Probe verrät ihren Inhalt nicht
        vars.want = text("bin." + event.want, lang);
        vars.why = text("why." + (event.why || event.want), lang);
        return text("say.disposedWrong", lang, vars);
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
      case "hold":
        if (!ctx.numbers) return text("say.holdSet", lang, vars);
        vars.ml = num(event.hold, 0, lang);
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
      case "pipetted": vars.ml = trim(event.ml, lang); break;
      case "gone": vars.name = nameOf(L.species(event.species), lang); break;
      case "solid":
        if (event.colloid) { vars.name = nameOf(L.species(event.species), lang); return text("say.haze", lang, vars); }
        if (event.mirror) { vars.name = nameOf(L.species(event.species), lang); return text("say.mirror", lang, vars); }
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
      case "spin": return text(event.level ? "say.spinOn" : "say.spinOff", lang, vars);
      case "flame":
        if (!(event.level > 0)) return text("say.flameOff", lang, vars);
        vars.state = text("flame." + event.level, lang);
        break;
      case "dry": return text(event.left ? "say.dry" : "say.dryNone", lang, vars);
      case "smell":
        vars.name = nameOf(L.species(event.species), lang);
        if (L.species(event.species).smell === "fruity") return text("say.smellFruity", lang, vars);
        if (L.species(event.species).smell === "rotten") return text("say.smellRotten", lang, vars);
        break;
      case "ignite": vars.name = nameOf(L.species(event.species), lang); break;
      case "splint":
        if (event.kind === "paper" && event.name === "colorless") return text("say.paperWhite", lang, vars);
        if (event.kind === "paper") { vars.color = colorWord(event.name, event.pale, lang); return text("say.paper", lang, vars); }
        vars.splint = text(event.kind === "glow" ? "part.glowsplint" : "part.splint", lang);
        vars.result = text("splint." + event.result + (event.result === "pop" ? event.level : ""), lang);
        break;
      case "pop": return text("say.pop" + (event.level || 0), lang, vars);
      case "shine": vars.color = text("color." + event.name, lang); break;
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

  // Feststoffe am Boden. box: { x0, x1, bottom } – der Platz am Gefäßboden; tall: schmales Gefäß; surface: der Spiegel, wenn Flüssigkeit da ist
  function solids(w, box, tall, ctx, surface) {
    var out = "", width = box.x1 - box.x0, mid = (box.x0 + box.x1) / 2, t = ctx && !ctx.still ? ctx.t || 0 : 0;
    w.solids.forEach(function (s, index) {
      var color = L.species(s.id).color || "#9aa0a8", i, points = [], count, r, x, y;
      if (s.float && surface != null) {
        // schwimmt: ein Stück an der Oberfläche; geschmolzen eine Kugel, die vom Gas getrieben hin und her flitzt
        r = 2.4 + 3 * Math.pow(s.part, 1 / 3);
        x = mid + (s.molten && (s.spatter || s.flame) ? Math.sin(t * 2.3 + index) * 0.5 + Math.sin(t * 3.7 + 2 * index) * 0.35 : 0.2 * (pseudo(index + 1, 0) - 0.5)) * Math.max(0, width - 2 * r) * 0.5;
        y = surface - (s.molten ? r * 0.4 : r * 0.2);
        out += glowAt(s, x, y, r);
        out += '<circle class="cl-solid' + (s.molten ? " cl-molten" : "") + '" cx="' + f(x) + '" cy="' + f(y) + '" r="' + f(r) + '" fill="' + esc(hotFill(s, color)) + '" stroke-width="0.5"/>';
        if (s.spatter) for (i = 0; i < 4; i++) {                // Spritzer: kleine Tropfen, die vom Metall aufsteigen und zurückfallen
          var q = (t * 1.7 + pseudo(index + 3, i)) % 1, dx = (pseudo(index + 5, i) - 0.5) * 16;
          out += '<circle class="cl-spatter" cx="' + f(x + dx * q) + '" cy="' + f(y - 14 * Math.sin(Math.PI * q)) + '" r="1.1"/>';
        }
        if (s.flame && L.fx) out += L.fx.fire(x - 6, x + 6, y + 2, [{ rate: 1, color: s.flame.color, glare: 0 }], t, index + 1, !!(ctx && ctx.still));
        return;
      }
      if (s.molten) {                                          // geschmolzen am Boden: eine flache Lache
        out += glowAt(s, mid, box.bottom - 2, width * 0.3);
        out += '<ellipse class="cl-solid cl-molten" cx="' + f(mid) + '" cy="' + f(box.bottom - 2) + '" rx="' + f(width * 0.3 * Math.sqrt(s.part)) + '" ry="2.5" fill="' + esc(hotFill(s, color)) + '"/>';
        return;
      }
      out += glowAt(s, mid, box.bottom - 4, width * 0.3);
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

  // Farbe eines Stücks: seine eigene, mit wachsender Glut zunehmend in der Glühfarbe
  function hotFill(s, color) {
    var own = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(color), k = s.glow ? 0.15 + 0.85 * s.glow.level : 0;
    if (!s.glow || !own) return s.glow ? css(s.glow.rgb) : color;
    return css([1, 2, 3].map(function (i, j) { return Math.round(parseInt(own[i], 16) * (1 - k) + s.glow.rgb[j] * k); }));
  }

  // Schein um ein glühendes Stück: in seiner Glühfarbe, umso deutlicher, je heißer es ist
  function glowAt(s, x, y, r) {
    if (!s.glow || !(s.glow.level > 0)) return "";
    return '<ellipse class="cl-glow" cx="' + f(x) + '" cy="' + f(y) + '" rx="' + f(r * 1.8 + 4) + '" ry="' + f(r * 1.4 + 3) + '" fill="' + css(s.glow.rgb) + '" fill-opacity="' + (0.25 + 0.5 * s.glow.level).toFixed(2) + '"/>';
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

  // Schaum über der Flüssigkeit, in einem blassen Ton ihrer Farbe; was nicht ins Gefäß passt, quillt oben heraus und läuft außen herab
  function froth(w, ctx, shape) {
    var part = L.parts[w.type], level = shape.level || (part.surface && function (ml) { return part.surface(Object.assign({}, w, { ml: ml })); });
    var rgb = w.color.rgb.map(function (c) { return Math.round(c + (255 - c) * 0.75); }), fill = css(rgb), out = "", over, top, k, x, y, r, h;
    if (!level) return "";
    top = Math.max(shape.rim, level(Math.min(w.cap, w.ml + w.foam)));
    out += '<path class="cl-froth" d="' + shape.fill(top) + '" fill="' + fill + '"/>';
    for (k = 0; k < 14; k++) {                                // Bläschen im Schaum
      y = top + (shape.top - top) * pseudo(17, k);
      if (shape.top - top < 3) break;
      out += '<circle class="cl-froth-bubble" cx="' + f(shape.x0 + (shape.x1 - shape.x0) * pseudo(19, k)) + '" cy="' + f(y) + '" r="' + f(1 + 1.5 * pseudo(23, k)) + '"/>';
    }
    over = w.ml + w.foam - w.cap;
    if (over > 0) {                                           // über den Rand: eine Haube und Zungen, die außen herablaufen
      h = Math.min(60, 6 + 12 * Math.log(1 + over / 10));
      for (k = 0; k < 9; k++) {
        x = shape.x0 - 4 + (shape.x1 - shape.x0 + 8) * k / 8; r = 5 + 4 * pseudo(29, k) + h * 0.25;
        out += '<circle class="cl-froth" cx="' + f(x) + '" cy="' + f(shape.rim - h * 0.45 * (1 - Math.abs(k - 4) / 5)) + '" r="' + f(r) + '" fill="' + fill + '"/>';
      }
      [shape.x0 - 6, shape.x1 + 6].forEach(function (side, i) {
        var run = Math.min(shape.bottom - shape.rim, h * 2.5 + 10 * pseudo(31, i));
        out += '<rect class="cl-froth" x="' + f(side - 4) + '" y="' + f(shape.rim - 2) + '" width="8" height="' + f(run) + '" rx="4" fill="' + fill + '"/>';
      });
    }
    return out;
  }

  // Inhalt eines Gefäßes: Flüssigkeit, Feststoff, Blasen, Zulauf. shape: { path, x0, x1, top, bottom, rim, tall }
  function contents(w, ctx, shape) {
    var out = "", clip = "cl-" + ctx.uid + "-" + w.id + "-clip", box = { x0: shape.x0, x1: shape.x1, top: shape.top, bottom: shape.bottom };
    var layer, dim;
    // farbiges Gas (NO2) im Gasraum: vom Rand bis zur Flüssigkeit, so deckend, wie es dunkel ist
    if (w.fog && shape.fill && !w.broken) {
      dim = Math.min(0.85, (255 - Math.min.apply(null, w.fog.rgb)) / 255);
      if (dim > 0.03) out += '<path class="cl-fog" d="' + shape.fill(shape.rim) + '" fill="' + css(w.fog.rgb) + '" fill-opacity="' + dim.toFixed(2) + '"/>';
    }
    if (w.ml > 0.005) {
      out += '<clipPath id="' + esc(clip) + '"><path d="' + shape.path + '"/></clipPath>' +
        '<path class="cl-liquid" d="' + shape.path + '" fill="' + liquidColor((w.oil && w.oil.top ? w.oil.color : w.color).rgb) + '"/>';
      // zwei Schichten: die obere füllt alles, die untere bis zu ihrer eigenen Höhe, dazwischen die Grenze
      if (w.oil && (shape.level || L.parts[w.type].surface)) {
        layer = w.oil.top ? w.ml - w.oil.ml : w.oil.ml;
        if (layer > 0.005) {
          // shape.level: die Höhe einer Füllung, wenn die Form sie selbst kennt (ein hängendes Gerät)
          layer = Math.min(shape.bottom, shape.level ? shape.level(layer) : L.parts[w.type].surface(Object.assign({}, w, { ml: layer })));
          out += '<path class="cl-liquid" d="' + shape.fill(layer) + '" fill="' + liquidColor((w.oil.top ? w.color : w.oil.color).rgb) + '"/>' +
            '<line class="cl-boundary" clip-path="url(#' + esc(clip) + ')" x1="' + f(shape.x0 - 30) + '" x2="' + f(shape.x1 + 30) + '" y1="' + f(layer) + '" y2="' + f(layer) + '"/>';
        }
      }
      // Niederschlag: was schwebt, trübt die Flüssigkeit in seiner Farbe; was sich abgesetzt hat, liegt als Schicht am Boden
      if (w.cloud && w.cloud.alpha > 0.02) {
        // etwas abgedunkelt, damit auch ein weißer Niederschlag vor der hellen Wand als milchige Trübung zu sehen ist
        out += '<path class="cl-cloud" d="' + shape.path + '" fill="' + css(shade(w.cloud.rgb, 0.93)) + '" fill-opacity="' + (w.cloud.alpha * 0.92).toFixed(2) + '"/>';
      }
      // die Lösung leuchtet (Luminol, unter der UV-Lampe): in ihrer Farbe, mit einem Schein ums Glas; bleibt im dunklen Raum hell
      if (w.shine) {
        out += '<ellipse class="cl-glowing cl-halo" cx="' + f((shape.x0 + shape.x1) / 2) + '" cy="' + f((shape.top + shape.bottom) / 2) + '" rx="' + f((shape.x1 - shape.x0) / 2 + 10) +
          '" ry="' + f((shape.bottom - shape.top) / 2 + 10) + '" fill="' + css(w.shine.rgb) + '" fill-opacity="' + (0.4 * w.shine.level).toFixed(2) + '"/>' +
          '<path class="cl-glowing" d="' + shape.path + '" fill="' + css(w.shine.rgb) + '" fill-opacity="' + (0.15 + 0.8 * w.shine.level).toFixed(2) + '"/>';
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
    out += solids(w, box, shape.tall, ctx, w.ml > 0.005 ? shape.top : null);
    if (w.foam > 0.3 && w.ml > 0.005) out += froth(w, ctx, shape);
    // ein Spiegel am Glas (Silberspiegel): bis zur Höhe, bei der er entstand, je dichter, desto deckender; mit einem Lichtstreif
    if (w.mirror && w.mirror.share > 0.02 && L.parts[w.type] && L.parts[w.type].surface) {
      layer = Math.min(shape.bottom - 2, L.parts[w.type].surface(Object.assign({}, w, { ml: w.mirror.ml })));
      out += '<path class="cl-mirror" d="' + shape.fill(layer) + '" fill="' + css(w.mirror.rgb) + '" fill-opacity="' + Math.min(0.95, w.mirror.share).toFixed(2) + '"/>' +
        '<line class="cl-mirror-shine" x1="' + f(shape.x0 + (shape.x1 - shape.x0) * 0.25) + '" x2="' + f(shape.x0 + (shape.x1 - shape.x0) * 0.25) + '" y1="' + f(layer + 3) + '" y2="' + f(shape.bottom - 4) +
        '" stroke-opacity="' + (0.7 * Math.min(1, w.mirror.share)).toFixed(2) + '"/>';
    }
    if (w.ml > 0.005) {
      // Öltropfen: nur im noch trüben Teil der wässrigen Schicht, der beim Aufrahmen von unten (oder oben) her klar wird
      if (w.oil && w.oil.drops > 0 && L.fx && (shape.level || L.parts[w.type].surface)) {
        var edge = w.oil.top ? w.ml - w.oil.all : w.oil.all, line = edge > 0.005 ? Math.min(shape.bottom, shape.level ? shape.level(edge) : L.parts[w.type].surface(Object.assign({}, w, { ml: edge }))) : shape.bottom;
        var water = w.oil.top ? { top: line, bottom: shape.bottom } : { top: shape.top, bottom: line }, deep = (water.bottom - water.top) * Math.min(1, w.oil.drops);
        out += '<g clip-path="url(#' + esc(clip) + ')">' + L.fx.droplets({ x0: shape.x0, x1: shape.x1, top: w.oil.top ? water.top : water.bottom - deep, bottom: w.oil.top ? water.top + deep : water.bottom },
          w.oil.drops, w.oil.r, ctx.t, ctx.seed || 1, ctx.still, w.oil.color.rgb, w.oil.top) + "</g>";
      }
      // Strömung: Temperatur, Wirbel oder Druck im Querschnitt, über der Flüssigkeit und unter den Blasen
      if (ctx.flow && w.heat && L.fx) out += '<g clip-path="url(#' + esc(clip) + ')">' + L.fx.flow(box, w, ctx.t, esc(clip), ctx.flow, ctx.still) + "</g>";
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
        if (mark.key === "spatter" && mark.age < 1) {         // es spritzt: Tropfen fliegen aus der Mischzone über den Rand hinaus
          var rise = (w.ml > 0.005 ? shape.top : shape.bottom) - shape.rim + 30;
          for (var k = 0; k < 7; k++) {
            var q = (ctx.still ? 0.4 : mark.age) + 0.12 * pseudo(9, k), dx = (pseudo(11, k) - 0.5) * 70;
            if (q < 1) out += '<circle class="cl-spatter" cx="' + f(dx * q) + '" cy="' + f((w.ml > 0.005 ? shape.top : shape.bottom) - rise * 4 * q * (1 - q) - 10 * q) + '" r="' + f(1.3 + pseudo(13, k)) + '"/>';
          }
        }
        if (mark.key === "popped" && mark.age < 0.8) {        // der Stopfen fliegt heraus: hinauf und zur Seite, sich drehend
          out += '<g transform="translate(' + f(mark.age * 50) + "," + f(-mark.age * 160 + mark.age * mark.age * 120) + ") rotate(" + f(mark.age * 400) + " 0 " + f(shape.rim) + ')">' +
            plugShape(0, shape.rim, shape.tall ? 26 : 30) + "</g>" + L.fx.flash(0, shape.rim - 6, mark.age, 1);
        }
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
      if (type === "syringe" || type === "stopper" || type === "manometer") return { x: 0, rim: TUBE.top, w: 26 };        // Stopfen in der Öffnung
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
      if (type === "syringe" || type === "stopper" || type === "manometer") return { x: 0, rim: -s[1], w: s[0] - 2 };
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

  // ------------------------------------------------------------------ Kalorimeter

  // Styroporbecher mit Deckel, im Schnitt: dicke Wände, man sieht hinein. Maße wie das Becherglas mit 250 mL.
  var beakerPart = L.parts.beaker, LID = 0.62;      // LID: Öffnung im Deckel als Anteil der inneren Weite (wie in 3D)
  L.registerPart("calorimeter", {
    width: function (v) { return beakerSize(v)[0] + 64; }, bounds: function (v) { var s = beakerSize(v); return { x0: -s[0] / 2 - 13, x1: s[0] / 2 + 13, top: -s[1] - 10 }; }, surface: beakerPart.surface, foot: beakerPart.foot, mount: beakerPart.mount,
    // Stopfen, Kolbenprober, Manometer und Rohr sitzen in der Öffnung des Deckels
    probe: function (v, type, slot) {
      var p = beakerPart.probe(v, type, slot);
      return p && /^(syringe|stopper|manometer|tube)$/.test(type) ? Object.assign({}, p, { w: Math.round(beakerSize(v)[0] * LID) - 2 }) : p;
    },
    draw: function (w, ctx) {
      var s = beakerSize(w), a = s[0] / 2, h = s[1], y = beakerSurface(w), t = 7;
      var fill = function (level) {
        return "M" + (-a + 2) + "," + f(level) + "L" + (-a + 2) + ",-2L" + (a - 2) + ",-2L" + (a - 2) + "," + f(level) + "Z";
      };
      if (w.broken) return shards(a, ctx);
      return contents(w, ctx, { path: fill(y), fill: fill, x0: -a + 2, x1: a - 2, top: y, bottom: -2, rim: -h, tall: false }) +
        // Becherform: die Wand ist oben dick und läuft nach unten schmal zu; innen bleibt der Raum der Flüssigkeit gerade
        '<path class="cl-foam" d="M' + (-a - t - 3) + "," + (-h) + "L" + (-a) + "," + (-h) + "L" + (-a) + ",-2L" + a + ",-2L" + a + "," + (-h) + "L" + (a + t + 3) + "," + (-h) + "L" + (a + 3) + ",0L" + (-a - 3) + ',0Z"/>' +
        // Deckel mit einer Öffnung in der Mitte, durch die Thermometer und Zugaben gehen
        '<rect class="cl-foam" x="' + (-a - t - 3) + '" y="' + (-h - 5) + '" width="' + f(a + t + 3 - LID * a) + '" height="5" rx="1.5"/>' +
        '<rect class="cl-foam" x="' + f(LID * a) + '" y="' + (-h - 5) + '" width="' + f(a + t + 3 - LID * a) + '" height="5" rx="1.5"/>' +
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
      if (type === "syringe" || type === "stopper" || type === "manometer") return { x: 0, rim: -DISH.h - 4, w: 2 * DISH.a - 4 };
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
        '<path class="cl-hose" d="M4.5,-10L13,-10Q22,-10 22,1"/><rect class="cl-grommet" x="17.5" y="-1.2" width="9" height="2.4" rx="1"/>';      // durch eine Tülle in den Tisch
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

  // ------------------------------------------------------------------ Zentrifuge

  var ROTOR = { lift: 22, h: 30 };       // das Reagenzglas steckt oben im Deckel, sein Boden bleibt zu sehen; vorn dreht sich die Scheibe, solange sie läuft

  // place: { lift, half } aus stand(), wie bei der Waage; das Glas bleibt ganz zu sehen, damit man den Bodensatz sieht
  L.registerPart("centrifuge", {
    width: function () { return 84; },
    bounds: function (t, place) { var a = place ? place.half : 34; return { x0: -a - 4, x1: a + 24, top: -ROTOR.h - 2 }; },
    stand: function (host) { var b = L.parts[host.type].bounds(host); return { lift: ROTOR.lift, half: Math.max(34, (b.x1 - b.x0) / 2), clamp: false }; },
    span: function (host) { return 2 * (this.stand(host).half + 24); },
    draw: function (w, ctx, place) {
      var a = place ? place.half : 34, turn = w.spin ? (ctx.still ? 30 : ((ctx.t || 0) * 300) % 360) : 0;
      return '<g class="cl-centrifuge"><rect class="cl-device" x="' + (-a) + '" y="' + (-ROTOR.h) + '" width="' + 2 * a + '" height="' + ROTOR.h + '" rx="6"/>' +
        '<rect class="cl-knob" x="' + (-a + 4) + '" y="' + (-ROTOR.h + 1) + '" width="' + (2 * a - 8) + '" height="5" rx="2"/>' +      // der Deckel
        '<ellipse class="cl-slot" cx="0" cy="' + (-ROTOR.h + 1) + '" rx="15" ry="2.5"/>' +
        '<g transform="translate(' + (-a + 15) + ",-14) rotate(" + f(turn) + ')"><circle class="cl-knob" r="8"/><path class="cl-knob-mark" d="M0,-6L0,6M-6,0L6,0"/></g>' +
        '<circle class="cl-led' + (w.spin ? " cl-on" : "") + '" cx="' + (a - 10) + '" cy="-20" r="2.5"/></g>' + badge(place ? a + 14 : 0, 14, ctx.no);
    }
  });

  // ------------------------------------------------------------------ Gummistopfen

  // place: { x, rim, w } aus probe() des Gefäßes, wie beim Kolbenprober; für sich liegt er auf dem Tisch
  function plugShape(x, y, w) {
    return '<path class="cl-stopper" d="M' + f(x - w / 2) + "," + f(y - 4) + "L" + f(x + w / 2) + "," + f(y - 4) + "L" + f(x + w / 2 - 2) + "," + f(y + 7) + "L" + f(x - w / 2 + 2) + "," + f(y + 7) + 'Z"/>';
  }
  L.registerPart("stopper", {
    width: function () { return 40; },
    bounds: function (t, place) { return place ? { x0: place.x - place.w / 2 - 2, x1: place.x + place.w / 2 + 2, top: place.rim - 8, bottom: place.rim + 8 } : { x0: -14, x1: 14, top: -14 }; },
    draw: function (w, ctx, place) {
      return place ? plugShape(place.x, place.rim, place.w) : plugShape(0, -7, 22) + badge(0, 14, ctx.no);
    }
  });

  // ------------------------------------------------------------------ Manometer

  // Stopfen mit Steigrohr und rundem Zifferblatt darüber; der Zeiger von 0 bis 2 bar über einen Dreiviertelkreis
  L.registerPart("manometer", {
    width: function () { return 56; },
    bounds: function (t, place) { var x = place ? place.x : 0, y = place ? place.rim - 46 : -40; return { x0: x - 20, x1: x + 20, top: y - 20, bottom: place ? place.rim + 8 : 0 }; },
    draw: function (w, ctx, place) {
      var x = place ? place.x : 0, rim = place ? place.rim : -10, y = rim - 46, value = Math.max(0, Math.min(2, w.value == null ? 1 : w.value));
      var a = (-135 + 270 * value / 2) * Math.PI / 180, out = place ? plugShape(x, rim, place.w) : plugShape(x, rim, 20);
      out += '<line class="cl-rod" x1="' + f(x) + '" y1="' + f(rim - 4) + '" x2="' + f(x) + '" y2="' + f(y + 16) + '"/>' +
        '<circle class="cl-device" cx="' + f(x) + '" cy="' + f(y) + '" r="16"/>' +
        '<line class="cl-mark" x1="' + f(x) + '" y1="' + f(y) + '" x2="' + f(x + 12 * Math.sin(a)) + '" y2="' + f(y - 12 * Math.cos(a)) + '" stroke-width="1.6"/>';
      if (ctx.numbers && w.value != null) out += '<g class="cl-tag"><rect x="' + f(x + 18) + '" y="' + f(y - 9) + '" width="52" height="17" rx="4"/><text x="' + f(x + 44) + '" y="' + f(y + 3) + '" text-anchor="middle">' + num(w.value, 2, ctx.lang) + " bar</text></g>";
      return out + (place ? "" : badge(0, 14, ctx.no));
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
      return place ? { x0: place.x + off - 6, x1: place.x + off + 130, top: place.rim - 56, bottom: place.rim - 10 } : { x0: -62, x1: 70, top: -46 };
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
        out += '<g class="cl-tag"><rect x="' + (x0 - 6) + '" y="' + (y - 30) + '" width="102" height="17" rx="4"/>' +
          '<text x="' + (x0 + 45) + '" y="' + (y - 18) + '" text-anchor="middle">' + shown(Object.assign({}, w, { value: value }), ctx.lang) + "</text></g>";
      }
      return out + (place ? "" : badge(0, 14, ctx.no));
    }
  });

  // ------------------------------------------------------------------ UV-Lampe

  // Handlampe über dem Gefäß, ihr violettes Licht fällt hinein; place wie beim Thermometer, ohne Gefäß liegt sie auf dem Tisch
  L.registerPart("uvlamp", {
    width: function () { return 48; },
    bounds: function () { return { x0: -20, x1: 20, top: -22 }; },
    draw: function (w, ctx, place) {
      if (!place) return '<rect class="cl-uvlamp" x="-18" y="-16" width="36" height="12" rx="3"/><rect class="cl-uvglass" x="-14" y="-6" width="28" height="3"/>' + badge(0, 14, ctx.no);
      var x = place.x, y = place.top - 8;
      return '<path class="cl-glowing cl-uvbeam" d="M' + f(x - 12) + "," + f(y + 10) + "L" + f(x + 12) + "," + f(y + 10) + "L" + f(x + 22) + "," + f(place.bottom) + "L" + f(x - 22) + "," + f(place.bottom) + 'Z"/>' +
        '<rect class="cl-uvlamp" x="' + f(x - 18) + '" y="' + f(y - 4) + '" width="36" height="12" rx="3"/><rect class="cl-glowing cl-uvglass" x="' + f(x - 14) + '" y="' + f(y + 6) + '" width="28" height="3"/>';
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

  // Geigerzähler: das Zählrohr über der Probe, daneben die Anzeige in Impulsen je Minute
  L.registerPart("geiger", {
    width: function () { return 96; },
    bounds: function () { return { x0: -14, x1: 70, top: -138 }; },
    draw: function (w, ctx, place) {
      // das Zählrohr taucht nicht ein: es endet etwa am Rand des Gefäßes
      var held = place ? Object.assign({}, place, { bottom: place.top + 0.45 * (place.bottom - place.top) }) : place;
      return gauge(ctx, held, ctx.numbers ? shown(w, ctx.lang) : text("unit.cpm", ctx.lang), 80);
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
      // Gas, das an der Elektrode haftet: feine Bläschen auf dem eingetauchten Teil, je mehr, desto dichter
      for (var k = 0, n = wet && w.held > 0.02 ? Math.round(3 + 15 * Math.min(1, w.held)) : 0; k < n; k++) {
        out += '<circle class="cl-film" cx="' + f(x + (k % 2 ? 4.6 : -4.6)) + '" cy="' + f(place.surface + 2 + pseudo(7, k) * Math.max(0, p.bottom - place.surface - 3)) + '" r="' + f(0.9 + 0.6 * pseudo(3, k)) + '"/>';
      }
      out += '<circle class="cl-terminal" cx="' + f(x) + '" cy="' + (p.top + 6) + '" r="4"/>';
      // der Pol steht neben dem Anschluss, auf der Seite der Gefäßwand: darüber laufen die Leitungen
      if (w.pole) out += '<text class="cl-pole" x="' + f(x + (x < 0 ? -11 : 11)) + '" y="' + (p.top + 11) + '" text-anchor="middle">' + (w.pole === "+" ? "+" : "−") + "</text>";
      return out + (place ? "" : badge(0, 14, ctx.no));
    }
  };
  Object.keys(L.parts).forEach(function (type) { if (L.parts[type].electrode) L.registerPart(type, electrode); });
  L.electrodeLook = electrode;          // für eigene Elektroden: L.registerPart("electrode-Sn", Object.assign({ kind: "tool", electrode: "Sn(s)", g: 10, unit: "g", lag: 0 }, L.electrodeLook))

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
      if (type === "syringe" || type === "stopper" || type === "manometer") return { x: 0, rim: FLASK.rim, w: 2 * FLASK.neck + 4 };
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

  // ------------------------------------------------------------------ Messkolben

  // Kugel mit langem, engem Hals; in der Kugel steht bulb (Anteil) der Marke, der Rest bis zum Eichstrich steht im Hals
  var VF = { R: 30, neck: 4.5, rim: -150, mark: -105, bulb: 0.92 };
  var VF_CY = -4 - VF.R, VF_MEET = VF_CY - Math.sqrt(VF.R * VF.R - VF.neck * VF.neck);
  function vfMark(w) { return w.mark || w.cap / 1.1; }
  function vfSurface(w) {
    var R = VF.R - 1, bulb = VF.bulb * vfMark(w), share = Math.min(1, w.ml / bulb), lo = 0, hi = 2 * R, h, i;
    if (w.ml > bulb) return Math.max(VF.rim, VF_MEET - (w.ml - bulb) / ((1 - VF.bulb) * vfMark(w) / (VF_MEET - VF.mark)));
    for (i = 0; i < 30; i++) { h = (lo + hi) / 2; if (h * h * (3 * R - h) / (4 * R * R * R) < share) lo = h; else hi = h; }
    return VF_CY + R - (lo + hi) / 2;
  }
  function vfFill(y) {                    // Umriss der Flüssigkeit bis zur Höhe y: in der Kugel ein Kreisabschnitt, darüber die volle Kugel und der Hals
    var R = VF.R - 1, n = VF.neck - 1, half;
    if (y < VF_MEET) return "M0," + f(VF_CY - R) + "A" + R + "," + R + " 0 1 0 0.01," + f(VF_CY - R) + "Z" +
      "M" + f(-n) + "," + f(VF_MEET + 2) + "L" + f(-n) + "," + f(y) + "L" + f(n) + "," + f(y) + "L" + f(n) + "," + f(VF_MEET + 2) + "Z";
    if (y <= VF_CY - R + 0.5) return "M0," + f(VF_CY - R) + "A" + R + "," + R + " 0 1 0 0.01," + f(VF_CY - R) + "Z";
    half = Math.sqrt(Math.max(0, R * R - (y - VF_CY) * (y - VF_CY)));
    return "M" + f(-half) + "," + f(y) + "A" + R + "," + R + " 0 " + (y < VF_CY ? 1 : 0) + " 0 " + f(half) + "," + f(y) + "Z";
  }

  L.registerPart("volflask", {
    width: function () { return 2 * VF.R + 30; },
    bounds: function () { return { x0: -VF.R - 6, x1: VF.R + 6, top: VF.rim - 6 }; },
    surface: vfSurface,
    foot: function () { return 14; },
    probe: function (v, type) {
      if (type === "syringe" || type === "stopper" || type === "manometer") return { x: 0, rim: VF.rim, w: 2 * VF.neck + 4 };
      if (type === "tube") return { x: 0, rim: VF.rim, w: 2 * VF.neck + 4, top: VF.rim - PIPE_RISE };
      if (type === "bridge") return { x: 0, rim: VF.rim };
      if (type === "conductometer" || type === "photometer") return { x: 1, bottom: VF_CY + 14, top: VF.rim - 40, box: -70 };
      return type === "phmeter" ? { x: 2, bottom: VF_CY + 14, top: VF.rim - 20, box: -62 } : { x: -2, bottom: VF_CY + 14, top: VF.rim - 40, tag: -62 };
    },
    mount: function (w) { return { x: 0, rim: VF.rim, surface: w.ml > 0.005 ? vfSurface(w) : VF_CY + VF.R, edge: VF.R + 6 }; },
    draw: function (w, ctx) {
      var R = VF.R, n = VF.neck, y = vfSurface(w), half;
      if (w.broken) return shards(R, ctx);
      half = y < VF_MEET ? n - 1 : Math.sqrt(Math.max(0, (R - 1) * (R - 1) - (y - VF_CY) * (y - VF_CY)));
      return (ctx.lift ? "" : '<path class="cl-wood" d="M-16,-4L16,-4L13,0L-13,0Z"/>') +
        contents(w, ctx, { path: vfFill(y), fill: vfFill, x0: -half, x1: half, top: y, bottom: VF_CY + R - 1, rim: VF.rim, tall: true }) +
        '<path class="cl-glass" d="M' + -n + "," + VF.rim + "L" + -n + "," + f(VF_MEET) + "A" + R + "," + R + " 0 1 0 " + n + "," + f(VF_MEET) + "L" + n + "," + VF.rim + '"/>' +
        '<line class="cl-mark" x1="' + (-n - 3) + '" x2="' + (n + 3) + '" y1="' + VF.mark + '" y2="' + VF.mark + '"/>' +
        '<line class="cl-shine" x1="-14" y1="' + (VF_CY - 16) + '" x2="-19" y2="' + (VF_CY + 4) + '"/>' +
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

  // ------------------------------------------------------------------ Scheidetrichter

  // Ein Kegel, unten spitz, oben mit Stopfen; darunter Hahn und Auslauf. Volumen wie im Kegel: Höhe ∝ (ml / cap)^(1/3).
  var SEP = { high: 120, wide: 30, neck: 3, cap: 100 };

  function separatorAt(mount) {
    var m = mount || { x: 0, rim: -70, surface: -2 }, tip = m.rim - 8, cock = tip - 16, bottom = cock - 10;
    return { x: m.x, rim: m.rim, tip: tip, cock: cock, bottom: bottom, top: bottom - SEP.high, surface: m.surface, rod: Math.max(m.x + 40, (m.edge || 0) + 14) };
  }

  function separatorLevel(g, ml) { return g.bottom - SEP.high * Math.pow(Math.max(0, Math.min(1, ml / SEP.cap)), 1 / 3); }

  function separatorFill(g, y) {         // die Flüssigkeit bis zur Höhe y
    var a = SEP.neck + (SEP.wide - SEP.neck) * (g.bottom - y) / SEP.high;
    return "M" + f(g.x - SEP.neck) + "," + g.bottom + "L" + f(g.x - a) + "," + f(y) + "L" + f(g.x + a) + "," + f(y) + "L" + f(g.x + SEP.neck) + "," + g.bottom + "Z";
  }

  L.registerPart("separator", {
    width: function () { return 100; },
    surface: function (w, mount) { return separatorLevel(separatorAt(mount), w.ml); },
    reach: function (mount) { return -separatorAt(mount).top + 26; },
    bounds: function (v, mount) { var g = separatorAt(mount); return { x0: g.x - SEP.wide - 4, x1: g.x + SEP.wide + 4, top: g.top - 14, bottom: g.rim - 2 }; },
    draw: function (w, ctx, mount) {
      var g = separatorAt(mount), x = g.x, rod = g.rod, open = w.tap > 0, y = separatorLevel(g, w.ml), out;
      out = '<rect class="cl-stand" x="' + (rod - 10) + '" y="-5" width="46" height="5" rx="2"/>' +
        '<line class="cl-rod" x1="' + rod + '" x2="' + rod + '" y1="-5" y2="' + (g.top - 10) + '"/>' +
        '<path class="cl-rod" fill="none" d="M' + rod + "," + (g.top + 40) + "L" + (x + SEP.wide * 0.75) + "," + (g.top + 40) + '"/>';
      if (w.ml > 0.005) out += contents(w, ctx, { path: separatorFill(g, y), fill: function (h) { return separatorFill(g, h); }, level: function (ml) { return separatorLevel(g, ml); },
        x0: x - SEP.wide * 0.6, x1: x + SEP.wide * 0.6, top: y, bottom: g.bottom, rim: g.top, tall: true });
      out += '<path class="cl-glass" d="M' + (x - SEP.neck) + "," + g.bottom + "L" + (x - SEP.wide) + "," + g.top + "Q" + x + "," + (g.top - 16) + " " + (x + SEP.wide) + "," + g.top +
        "L" + (x + SEP.neck) + "," + g.bottom + '"/>' +
        '<path class="cl-stopper" d="M' + (x - 5) + "," + (g.top - 18) + "L" + (x + 5) + "," + (g.top - 18) + "L" + (x + 4) + "," + (g.top - 8) + "L" + (x - 4) + "," + (g.top - 8) + 'Z"/>' +
        '<path class="cl-glass" d="M' + (x - 2) + "," + g.bottom + "L" + (x - 2) + "," + (g.tip - 3) + "L" + x + "," + g.tip + "L" + (x + 2) + "," + (g.tip - 3) + "L" + (x + 2) + "," + g.bottom + '"/>' +
        '<rect class="cl-cock" x="' + (x - 4) + '" y="' + (g.cock - 4) + '" width="8" height="8" rx="2"/>' +
        (open ? '<line class="cl-cock-grip" x1="' + x + '" x2="' + x + '" y1="' + (g.cock - 7) + '" y2="' + (g.cock + 7) + '"/>'
          : '<line class="cl-cock-grip" x1="' + (x - 9) + '" x2="' + (x + 9) + '" y1="' + g.cock + '" y2="' + g.cock + '"/>');
      if (open && w.ml > 0.001 && mount && L.fx) out += w.tap >= 0.3 ? L.fx.stream(x, g.tip, g.surface, ctx.t, ctx.still) : L.fx.drops(x, g.tip, g.surface, ctx.t, ctx.still);
      return out + (mount ? "" : badge(0, 14, ctx.no));
    }
  });

  // ------------------------------------------------------------------ Messzylinder

  // Breite und Höhe der Röhre in Bildpunkten, Teilung (klein, mit Zahl) in mL
  // Messzylinder: [Breite, Höhe, kleiner Strich, großer Strich]; Standzylinder (250, 500) ohne Skala
  var CYL = { 10: [16, 150, 0.5, 2], 25: [22, 165, 1, 5], 50: [28, 180, 1, 10], 100: [36, 200, 2, 20], 250: [56, 175], 500: [68, 205], 1000: [84, 235] }, CYL_FOOT = 8;

  function cylSize(w) { return CYL[w.size || w.cap] || CYL[100]; }
  // die Skala reicht vom Boden der Röhre bis 12 Bildpunkte unter den Rand
  function cylSurface(w) { var s = cylSize(w); return -CYL_FOOT - 2 - Math.min(1.05, w.ml / w.cap) * (s[1] - 14); }

  var cylinderPart = {
    width: function (v) { return cylSize(v)[0] + 60; },
    bounds: function (v) { var s = cylSize(v); return { x0: -s[0] / 2 - 14, x1: s[0] / 2 + 14, top: -s[1] - CYL_FOOT - 6 }; },
    surface: cylSurface,
    probe: function (v, type, slot) {
      var s = cylSize(v), rim = -s[1] - CYL_FOOT;
      if (type === "syringe" || type === "stopper" || type === "manometer") return { x: 0, rim: rim, w: s[0] + 2 };
      if (type === "tube") return { x: 0, rim: rim, w: s[0] + 2, top: rim - PIPE_RISE };
      if (type === "bridge" || type === "condenser") return { x: (slot || 0) * (s[0] / 2 - 2), rim: rim };
      if (type === "reflux") return { x: 0, rim: rim, top: rim - REFLUX };
      // nebeneinander, mit der Anzeige links: rechts stehen die Zahlen der Skala
      if (type === "phmeter") return { x: s[0] / 4, bottom: -CYL_FOOT - 6, top: rim - 50, box: -40 };
      if (type === "conductometer") return { x: -1, bottom: -CYL_FOOT - 6, top: rim - 76, box: -40 };
      if (type === "photometer") return { x: 1, bottom: -CYL_FOOT - 6, top: rim - 92, box: -68 };
      return { x: -s[0] / 4, bottom: -CYL_FOOT - 6, top: rim - 70, tag: -62 };
    },
    mount: function (w) { var s = cylSize(w); return { x: 0, rim: -s[1] - CYL_FOOT, surface: w.ml > 0.005 ? cylSurface(w) : -CYL_FOOT - 2, edge: s[0] / 2 + 14 }; },
    draw: function (w, ctx) {
      var s = cylSize(w), a = s[0] / 2, h = s[1], rim = -h - CYL_FOOT, y = cylSurface(w), ml, my, marks = "", major;
      // oben der Meniskus: am Rand hochgezogen, abgelesen wird der tiefste Punkt (level)
      var fill = function (level) { return "M" + (-a + 2) + "," + f(level - 2.5) + "L" + (-a + 2) + "," + (-CYL_FOOT - 2) + "L" + (a - 2) + "," + (-CYL_FOOT - 2) + "L" + (a - 2) + "," + f(level - 2.5) + "Q0," + f(level + 2.5) + " " + (-a + 2) + "," + f(level - 2.5) + "Z"; };
      if (w.broken) return shards(a + 4, ctx);
      for (ml = s[2]; s[2] && ml <= w.cap + 1e-9; ml += s[2]) {
        major = Math.abs(ml / s[3] - Math.round(ml / s[3])) < 1e-6;
        my = -CYL_FOOT - 2 - ml / w.cap * (h - 14);
        marks += '<line class="cl-mark" x1="' + (a - (major ? 9 : 5)) + '" x2="' + a + '" y1="' + f(my) + '" y2="' + f(my) + '"/>';
        if (ctx.numbers && major) marks += '<text class="cl-mark-text" x="' + (a + 3) + '" y="' + f(my + 2.5) + '">' + trim(ml, ctx.lang) + "</text>";
      }
      return contents(w, ctx, { path: fill(y), fill: fill, x0: -a + 2, x1: a - 2, top: y, bottom: -CYL_FOOT - 2, rim: rim, tall: true }) +
        // der Meniskus: Wasser steigt am Rand hoch, abgelesen wird der tiefste Punkt
        (w.ml > 0.005 ? '<path class="cl-surface" d="M' + (-a + 2) + "," + f(y - 2.5) + "Q0," + f(y + 2) + " " + (a - 2) + "," + f(y - 2.5) + '" fill="none"/>' : "") +
        marks +
        '<path class="cl-glass" d="M' + (-a - 4) + "," + (rim - 3) + "L" + (-a) + "," + rim + "L" + (-a) + "," + (-CYL_FOOT) + "M" + a + "," + (-CYL_FOOT) + "L" + a + "," + rim + "L" + (a + 1) + "," + (rim - 1) + '"/>' +
        '<path class="cl-glass" d="M' + (-a - 10) + ",0L" + (-a) + "," + (-CYL_FOOT) + "L" + a + "," + (-CYL_FOOT) + "L" + (a + 10) + ',0Z"/>' +
        badge(0, 14 + (ctx.lift || 0), ctx.no) + volumeLabel(w, ctx, 38);
    }
  };
  L.registerPart("cylinder", cylinderPart);
  L.registerPart("jar", cylinderPart);                         // der Standzylinder: dieselbe Form, ohne Skala

  // ------------------------------------------------------------------ Trichter mit Filterpapier

  var FUNNEL = { a: 28, h: 40, stem: 34, cap: 60 };     // halbe Weite oben, Höhe des Kegels, Länge des Rohrs, Fassungsvermögen in mL

  // mount: über welchem Gefäß er hängt; das Rohr reicht in dessen Öffnung
  function funnelAt(mount) {
    var m = mount || { x: 0, rim: -70, surface: -2 }, tip = m.rim + 12, apex = tip - FUNNEL.stem;
    return { x: m.x, rim: m.rim, tip: tip, apex: apex, top: apex - FUNNEL.h, surface: m.surface, rod: Math.max(m.x + FUNNEL.a + 12, (m.edge || 0) + 14) };
  }

  // Höhe der Flüssigkeit im Kegel: das Volumen wächst mit der dritten Potenz der Höhe
  function funnelSurface(w, mount) {
    var g = funnelAt(mount);
    return g.apex - FUNNEL.h * Math.pow(Math.min(1, w.ml / FUNNEL.cap), 1 / 3);
  }

  L.registerPart("funnel", {
    width: function () { return 90; },
    surface: funnelSurface,
    reach: function (mount) { return -funnelAt(mount).top + 16; },
    bounds: function (v, mount) { var g = funnelAt(mount); return { x0: g.x - FUNNEL.a - 4, x1: g.x + FUNNEL.a + 4, top: g.top - 8, bottom: g.tip }; },
    draw: function (w, ctx, mount) {
      var g = funnelAt(mount), x = g.x, a = FUNNEL.a, y, half, out, sed = w.sediment, rest;
      var cone = function (top) { var r = a * (g.apex - top) / FUNNEL.h; return "M" + f(x - r) + "," + f(top) + "L" + f(x + r) + "," + f(top) + "L" + x + "," + g.apex + "Z"; };
      out = '<rect class="cl-stand" x="' + (g.rod - 10) + '" y="-5" width="46" height="5" rx="2"/>' +
        '<line class="cl-rod" x1="' + g.rod + '" x2="' + g.rod + '" y1="-5" y2="' + (g.top - 16) + '"/>' +
        '<line class="cl-rod" x1="' + g.rod + '" x2="' + (x + a - 4) + '" y1="' + (g.top + 8) + '" y2="' + (g.top + 8) + '"/>' +
        // Filterpapier; ein Rückstand färbt es in seiner Farbe
        '<path class="cl-filter" d="' + cone(g.top + 3) + '"' + (sed && sed.ml > 0.002 ? ' style="fill:' + css(sed.rgb.map(function (c) { return Math.round(c + (255 - c) * 0.55); })) + '"' : "") + "/>";
      if (w.ml > 0.005) out += '<path class="cl-liquid" d="' + cone(funnelSurface(w, mount)) + '" fill="' + liquidColor(w.color.rgb) + '"/>';
      if (sed && sed.ml > 0.002) {                                                                 // der Rückstand im Filter, in seiner Farbe
        rest = g.apex - Math.max(10, FUNNEL.h * 0.7 * Math.pow(Math.min(1, sed.ml / FUNNEL.cap * 8), 1 / 3));
        out += '<path class="cl-sediment" d="' + cone(rest) + '" fill="' + css(shade(sed.rgb, 0.88)) + '"/>';
      }
      out += '<path class="cl-glass" d="M' + (x - a - 3) + "," + (g.top - 2) + "L" + (x - 3) + "," + (g.apex + 2) + "L" + (x - 3) + "," + g.tip +
        "M" + (x + 3) + "," + g.tip + "L" + (x + 3) + "," + (g.apex + 2) + "L" + (x + a + 3) + "," + (g.top - 2) + '"/>';
      if (w.ml > 0.001 && mount && !w.blocked && L.fx) out += L.fx.drops(x, g.tip, g.surface, ctx.t, ctx.still);      // das Filtrat tropft
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

  // GHS-Piktogramme: die amtlichen Vorlagen der UNECE (GHS Anhang 3), als SVG von Wikimedia Commons (GHS-pictogram-explos.svg,
  // -flamme, -rondflam, -bottle, -acid, -skull, -exclam, -silhouette, -pollu; gemeinfrei, da nicht urheberrechtsfähig). Je Piktogramm
  // [viewBox, Inhalt]; eingebaut statt verlinkt, damit sie auch im importierten Template und im Export erscheinen
  var GHS = {
    GHS01: ["0 0 579 579", '<path d="M 25.301165,289.67172 289.32987,553.70044 553.40261,289.6277 C 465.35022,201.6757 377.47182,113.54942 289.3739,25.643024 L 25.301165,289.67172 z" style="fill:#ffffff;stroke:none" /><path d="M 147.65941,148.01233 6,289.67173 147.66886,431.34059 289.32827,573 431.01602,431.31224 572.70378,289.62449 431.06327,147.98398 C 353.16571,70.086424 289.40386,6.34347 289.37551,6.34347 c -0.0284,0 -63.79965,63.752403 -141.7161,141.66886 z M 408.62189,170.42535 527.82103,289.62449 408.5652,408.88032 289.31882,528.1267 170.12913,408.87087 50.939444,289.61504 170.13858,170.41591 C 235.69574,104.85874 289.34716,51.22622 289.37551,51.22622 c 0.0283,0 53.68922,53.64197 119.24638,119.19913 z" style="fill:#ff0000;stroke:none" /><path d="m 393.5,171.5625 c -0.0875,0.0111 -0.14788,0.10408 -0.21875,0.28125 -0.0591,0.17718 -11.33782,32.32626 -25.0625,71.46875 -13.72467,39.14249 -24.984,71.22219 -25.03125,71.28125 -0.14174,0.14173 -1.1368,-0.21728 -1.125,-0.40625 0.0118,-0.12993 29.32971,-91.35309 29.625,-92.15625 0.0354,-0.0945 -0.8415,-0.68699 -2.625,-1.75 -2.65754,-1.58271 -2.96875,-1.75148 -2.96875,-1.5625 0,0.16536 -24.4215,95.359 -24.46875,95.40625 -0.0236,0.0354 -0.68921,-0.11934 -1.46875,-0.34375 -1.86619,-0.53151 -5.0386,-1.17766 -7.09375,-1.4375 -2.3032,-0.28348 -7.54622,-0.29529 -9.625,0 -9.70885,1.35829 -17.57516,5.37438 -24.4375,12.4375 -4.81899,4.96073 -8.65598,11.39408 -10.6875,17.9375 -0.24804,0.77955 -0.484,1.45275 -0.53125,1.5 -0.0473,0.0472 -3.77699,-2.68029 -8.3125,-6.09375 -4.53553,-3.41345 -8.28888,-6.19169 -8.3125,-6.15625 -0.0236,0.0236 0.43306,0.95986 1,2.09375 l 1.03125,2.0625 7.125,4.78125 c 6.88596,4.6182 7.0903,4.78665 7.03125,5.09375 -0.0591,0.29528 0.17196,0.58091 2.15625,2.71875 1.21656,1.32286 2.55536,2.75047 2.96875,3.1875 l 0.78125,0.78125 2.09375,-0.125 2.09375,-0.125 3.9375,2.625 c 2.16146,1.42916 3.79454,2.47786 3.59375,2.3125 -0.18899,-0.16535 -1.75612,-1.36883 -3.46875,-2.65625 -1.70082,-1.27561 -3.02017,-2.33194 -2.9375,-2.34375 0.0827,-0.0118 2.8144,-0.16659 6.0625,-0.34375 l 5.90625,-0.3125 8.5,4.28125 c 4.70089,2.33863 8.58956,4.25 8.625,4.25 0.0354,0 2.17096,-2.5457 4.78125,-5.6875 2.61029,-3.12997 4.82358,-5.78051 4.90625,-5.875 0.12993,-0.15355 -0.21233,-1.04715 -2.03125,-5.5 -1.19294,-2.91737 -2.14863,-5.32013 -2.125,-5.34375 0.0236,-0.0118 2.99894,0.29773 6.625,0.6875 3.62605,0.38977 6.60901,0.69169 6.65625,0.65625 0.0354,-0.0472 0.51156,-1.85035 1.03125,-4 l 0.96875,-3.9375 2.9375,-0.0312 c 1.61815,-0.0118 3.39,0.0153 3.96875,0.0625 l 1.0625,0.0937 -10.0625,11 c -5.55129,6.03555 -10.18257,11.11589 -10.3125,11.28125 -0.44882,0.5315 3.55174,-3.47669 12.90625,-12.9375 l 9.21875,-9.34375 3.4375,-0.0625 3.40625,-0.0625 -0.59375,-0.875 c -0.34253,-0.48426 -0.98868,-1.33169 -1.4375,-1.875 -0.44882,-0.54331 -0.79306,-1.01525 -0.78125,-1.0625 0.0236,-0.0473 1.30829,-1.38604 2.84375,-2.96875 l 2.78125,-2.84375 0.3125,0.65625 c 0.16535,0.37796 0.28125,0.72219 0.28125,0.78125 0,0.18897 0.15469,0.13021 4.84375,-2.03125 2.42131,-1.11026 4.45275,-1.9653 4.5,-1.90625 0.0473,0.0473 0.49213,1.56025 1,3.34375 0.49608,1.7835 0.95275,3.2965 1,3.34375 0.0827,0.0945 14.36785,-11.44144 14.78125,-11.9375 0.0945,-0.12992 1.87052,-3.36065 3.9375,-7.1875 2.06696,-3.83865 3.89715,-7.18529 4.0625,-7.46875 0.16536,-0.28348 0.23892,-0.52362 0.15625,-0.5 -0.0709,0.0236 -3.0115,2.45761 -6.53125,5.375 l -6.40625,5.28125 -4.59375,0.125 c -2.53941,0.0591 -4.79921,0.0861 -5,0.0625 -0.34252,-0.0354 2.19631,-2.61905 42.96875,-43.78125 23.82329,-24.04771 43.34375,-43.76526 43.34375,-43.8125 0,-0.0472 -1.1299,-1.2042 -2.5,-2.5625 -2.33862,-2.33862 -2.49852,-2.4508 -2.6875,-2.25 -0.1063,0.1063 -19.9245,21.68109 -44.03125,47.9375 l -43.8125,47.75 -3.46875,2.4375 c -1.90161,1.33466 -3.52287,2.49164 -3.59375,2.5625 -0.0827,0.0827 0.01,0.38581 0.28125,1 0.33071,0.77954 0.36049,0.91659 0.21875,1.09375 -0.12992,0.16536 -4.68846,5.19191 -5.5625,6.125 -0.2126,0.22442 -0.22242,0.2109 -1.25,-0.78125 -1.9961,-1.97248 -3.8843,-3.4916 -6.1875,-5.0625 l -1.125,-0.78125 L 374.5,282.125 c 17.12631,-29.42181 21.68061,-37.3312 21.5625,-37.4375 -0.0709,-0.0827 -1.19314,-0.78296 -2.46875,-1.5625 l -2.34375,-1.4375 -0.40625,0.71875 c -0.2126,0.40157 -9.01505,17.78995 -19.5625,38.625 -10.87816,21.5201 -19.21801,37.875 -19.3125,37.875 -0.11811,0 -0.10285,-0.14074 0.0625,-0.625 0.12992,-0.33071 11.65229,-32.46456 25.625,-71.40625 13.98452,-38.94169 25.39863,-70.83537 25.375,-70.90625 -0.0472,-0.1063 -8.53984,-4.07552 -9.4375,-4.40625 -0.0354,-0.0118 -0.0646,-0.004 -0.0937,0 z m -43.09375,54.53125 -1.21875,3.03125 -1.1875,3.0625 -2.3125,-0.90625 c -1.28743,-0.50789 -2.37081,-0.89099 -2.40625,-0.84375 -0.0354,0.0472 -0.58094,2.60476 -1.21875,5.6875 -0.62599,3.08274 -1.15207,5.7062 -1.1875,5.8125 -0.0354,0.14174 0.4852,0.42665 2.375,1.3125 1.3583,0.6378 2.50344,1.20275 2.5625,1.25 0.0472,0.0472 0.62744,2.13282 1.3125,4.625 0.67324,2.48036 1.25762,4.53889 1.28125,4.5625 0.0236,0.0236 0.98694,-1.34986 2.15625,-3.0625 2.22053,-3.24809 2.21467,-3.2373 9.21875,-10.84375 l 0.375,-0.40625 -2.03125,-6.5625 -2.03125,-6.5625 -0.875,-0.0625 c -0.48426,-0.0472 -1.75711,-0.0819 -2.84375,-0.0937 l -1.96875,0 z M 511.46875,255.25 c -0.0472,0 -0.12082,0.13951 -0.15625,0.28125 -0.36615,1.21655 -4.10901,12.7965 -4.15625,12.84375 -0.0236,0.0354 -2.55407,0.17077 -5.625,0.3125 l -5.59375,0.25 -1.59375,1.1875 c -0.87403,0.67324 -1.60138,1.2382 -1.625,1.25 -0.0354,0.0354 -1.52362,9.55832 -1.5,9.59375 0.0472,0.0354 8.71456,5 8.75,5 0.0236,0 1.59839,-1.6754 3.5,-3.71875 1.91342,-2.04334 3.49581,-3.73056 3.53125,-3.71875 0.0354,0 3.16553,2.13209 6.96875,4.71875 l 6.90625,4.6875 0.0312,-1.71875 c 0.0118,-0.9449 0.008,-4.7989 -0.0625,-8.53125 l -0.125,-6.78125 -4.59375,-7.84375 c -2.52761,-4.2993 -4.609,-7.8125 -4.65625,-7.8125 z m -117.53125,4.78125 -0.21875,0.28125 c -0.11811,0.15355 -0.82603,1.17517 -1.59375,2.25 l -1.375,1.9375 -0.875,4.375 c -0.47245,2.40949 -0.875,4.49509 -0.875,4.625 0.0118,0.16536 1.00316,1.09913 3.09375,2.90625 1.70083,1.4646 3.11662,2.65625 3.1875,2.65625 0.0591,0 1.12719,-1.21109 2.34375,-2.6875 l 2.21875,-2.71875 0.5,-2.4375 c 0.27166,-1.33468 0.55413,-2.73523 0.625,-3.125 l 0.125,-0.71875 -1.34375,-3.625 c -0.7323,-1.98429 -1.37081,-3.64025 -1.40625,-3.6875 -0.0473,-0.0472 -0.54624,0.44832 -1.125,1.0625 l -1.03125,1.125 -1.125,-1.125 -1.125,-1.09375 z M 466.15625,266.5 c -0.0591,0 -26.09855,18.33224 -57.90625,40.75 -31.8077,22.42956 -57.83612,40.78888 -57.8125,40.8125 0.0118,0.0236 26.09438,-16.11477 57.9375,-35.875 l 57.875,-35.9375 0,-4.90625 c 0,-2.68116 -0.0465,-4.85556 -0.0937,-4.84375 z M 454.71875,298.375 452.375,301 450,303.59375 448.875,306.625 c -0.62599,1.66539 -1.13681,3.03888 -1.125,3.0625 0.0472,0.0473 20.64026,2.516 20.6875,2.46875 0.0236,-0.0118 -3.06415,-3.13846 -6.84375,-6.90625 l -6.875,-6.875 z m 94.96875,1.8125 c -0.0591,-0.0118 -45.92855,11.84716 -101.9375,26.375 -56.00895,14.52784 -101.83612,26.44512 -101.8125,26.46875 0.0354,0.0354 206.54233,-46.74164 206.625,-46.8125 0.0709,-0.0473 -2.78051,-6.00764 -2.875,-6.03125 z m -120,14 c -0.0591,0.0118 -15.32297,7.20063 -33.9375,16 -18.61453,8.79939 -33.93676,16.05414 -34.03125,16.125 -0.12993,0.0945 -0.0876,0.10211 0.125,0.0312 0.4134,-0.14174 68.4257,-26.38263 68.4375,-26.40625 0.0118,0 -0.077,-1.2923 -0.21875,-2.875 -0.14172,-1.73626 -0.29232,-2.875 -0.375,-2.875 z m 147.5625,7.09375 c -0.15354,0.0118 -50.48012,8.55124 -111.875,18.96875 -61.38307,10.40571 -111.77214,18.9375 -111.9375,18.9375 -0.20079,0.0118 -0.71554,-0.34201 -1.625,-1.0625 l -1.375,-1.09375 -0.0625,4.53125 -0.0625,4.53125 -3.53125,2.40625 c -1.94886,1.31105 -3.60482,2.36319 -3.6875,2.375 -0.0827,0 -1.57625,-0.998 -3.3125,-2.25 -4.60639,-3.33078 -4.67504,-3.3197 -0.28125,0.0937 1.65358,1.28744 3.07775,2.359 3.125,2.40625 0.11811,0.1063 -5.55339,3.93406 -5.71875,3.875 -0.0827,-0.0236 -14.01986,-11.89856 -17.46875,-14.875 l -0.78125,-0.6875 -6.46875,5.59375 c -3.55517,3.08274 -6.51525,5.625 -6.5625,5.625 -0.0591,0 -3.71941,-0.95569 -8.125,-2.125 l -8,-2.125 2.25,0.0625 c 1.24018,0.0354 3.11267,0.0583 4.1875,0.0937 1.85436,0.0473 -3.43099,-0.34841 -9.75,-0.75 -1.16931,-0.0827 -7.50726,-0.5123 -14.0625,-0.9375 l -11.9375,-0.78125 -0.0312,-0.34375 c -0.0709,-0.40157 -0.0231,-0.38559 -1.0625,-0.0312 -0.74411,0.24804 -0.85306,0.23549 -3.15625,0.0937 -1.29924,-0.0709 -2.64566,-0.15208 -3,-0.1875 l -0.65625,-0.0937 -0.5625,-1.03125 -0.5625,-1 -4.03125,-0.21875 c -2.22051,-0.11811 -4.32554,-0.1875 -4.65625,-0.1875 l -0.59375,0 -0.53125,0.84375 -0.5,0.875 L 240.25,362.75 c -0.33073,-0.0118 -12.69288,-0.80091 -27.46875,-1.78125 -14.77588,-0.96853 -27.06446,-1.76181 -27.3125,-1.75 l -0.4375,0.0312 1.375,1.46875 c 1.19294,1.29924 1.4151,1.49581 1.78125,1.53125 0.23623,0.0236 11.92518,0.49556 25.96875,1.0625 14.04358,0.56694 25.58956,1.05831 25.625,1.09375 0.0354,0.0354 -0.52951,1.02581 -1.25,2.21875 -0.70868,1.18113 -1.2778,2.22219 -1.21875,2.28125 0.0472,0.0472 1.76154,1.26596 3.78125,2.71875 l 3.65625,2.65625 4.03125,0.65625 c 2.2087,0.37795 4.10481,0.66044 4.1875,0.625 0.0827,-0.0236 0.68995,-0.95225 1.375,-2.0625 l 1.25,-2.03125 2.5625,0 2.5625,0 0,-0.4375 c 0,-0.24804 -0.0888,-1.65277 -0.21875,-3.09375 -0.12993,-1.45279 -0.22294,-2.65207 -0.1875,-2.6875 0.0709,-0.0709 25.50664,0.90551 26.15625,1 0.3071,0.0473 0.375,0.0839 0.375,0.34375 0,0.43703 0.6213,3.18254 1.09375,4.8125 0.40158,1.3701 0.40429,1.37845 0.15625,1.4375 -0.12991,0.0236 -31.42816,3.6104 -69.53125,7.96875 -38.10309,4.37016 -69.26944,7.96875 -69.28125,7.96875 -0.0354,0.0236 -0.28544,3.05833 -0.25,3.09375 0.0236,0.0118 31.31005,-4.21349 69.53125,-9.375 38.2212,-5.16152 69.5812,-9.375 69.6875,-9.375 0.12993,0 0.29159,0.25392 0.46875,0.75 0.15355,0.41339 0.50196,1.25663 0.75,1.90625 0.24804,0.6378 0.42988,1.1757 0.40625,1.1875 -0.0236,0.0118 -23.41678,5.19279 -52,11.5 -28.58322,6.30721 -52.05759,11.5347 -52.1875,11.59375 -0.2008,0.0827 -0.32209,0.38753 -0.59375,1.78125 -0.18897,0.92127 -0.28544,1.71456 -0.25,1.75 0.0591,0.0473 104.77755,-25.74853 105.25,-25.9375 0.0709,-0.0236 0.29921,0.30535 0.5,0.71875 0.25985,0.51969 0.31325,0.77706 0.21875,0.8125 -0.0827,0.0236 -7.97176,2.15571 -17.5625,4.71875 l -17.46875,4.625 -0.21875,1.78125 c -0.12992,0.98032 -0.23056,1.80069 -0.21875,1.8125 0.0118,0.0118 8.16049,-2.65397 18.09375,-5.9375 18.11845,-5.9765 18.23819,-6.01551 18.25,-5.53125 0,0.0709 -12.72584,6.99664 -28.28125,15.40625 l -28.3125,15.28125 0.0937,1.125 c 0.0472,0.61419 0.0778,1.31446 0.125,1.5625 l 0.0937,0.4375 L 263.5,397.9375 c 15.46092,-9.09466 28.2062,-16.609 28.3125,-16.65625 0.15355,-0.0945 0.37671,0.19313 1.15625,1.46875 0.88585,1.46459 2.08413,3.17149 3.3125,4.71875 0.47245,0.61419 0.50149,0.70202 0.3125,0.84375 -0.1063,0.0709 -14.99892,11.96109 -33.09375,26.40625 L 230.625,441 l 2.3125,2.28125 c 1.28743,1.252 2.43676,2.31595 2.53125,2.375 0.14174,0.0827 4.53785,-3.92665 19.65625,-17.78125 10.72461,-9.83876 19.50763,-17.85555 19.53125,-17.84375 0.0236,0.0236 -0.14296,0.37966 -0.34375,0.78125 -0.20079,0.38978 -0.34375,0.75345 -0.34375,0.8125 0,0.0827 3.24409,3.7517 4,4.53125 0.20079,0.20079 0.30656,0.17201 2.5625,-0.84375 l 2.34375,-1.0625 1.1875,1.1875 1.1875,1.15625 2.34375,-1.40625 2.375,-1.4375 0.90625,-3.03125 c 0.50789,-1.6772 0.89444,-3.12426 0.90625,-3.21875 0,-0.1063 -0.89244,-0.7399 -2.15625,-1.53125 l -2.125,-1.34375 -3.4375,-0.0625 -3.40625,-0.0625 8.40625,-7.71875 c 4.6182,-4.22843 8.41388,-7.6875 8.4375,-7.6875 0.0118,0 0.95988,0.90918 2.09375,2.03125 1.13388,1.12206 2.60037,2.48031 3.25,3 7.8781,6.30721 16.83076,9.36541 26.46875,9.09375 7.571,-0.2126 14.30524,-2.35006 20.71875,-6.53125 2.64573,-1.72444 4.30925,-3.07525 6.71875,-5.4375 l 1.5,-1.4375 22.46875,18.09375 c 12.37819,9.9687 22.50764,18.10556 22.53125,18.09375 0.0118,-0.0236 -0.57602,-1.42419 -1.34375,-3.125 l -1.375,-3.09375 -20.875,-15.3125 -20.875,-15.28125 0.40625,-0.5 c 0.22442,-0.25984 0.82824,-1.01844 1.3125,-1.65625 0.49608,-0.62599 0.95275,-1.13681 1,-1.125 0.0591,0.0236 12.65719,9.85533 28,21.84375 15.34281,11.98841 28.0839,21.93601 28.34375,22.125 l 0.46875,0.34375 1.34375,-1.34375 c 0.74411,-0.74411 1.35556,-1.39025 1.34375,-1.4375 -0.0236,-0.0354 -13.16726,-9.57704 -29.21875,-21.1875 -16.03969,-11.61045 -29.2687,-21.17495 -29.375,-21.28125 -0.18897,-0.17717 -0.1538,-0.26893 0.53125,-1.34375 0.46064,-0.72049 0.78051,-1.12919 0.875,-1.09375 0.0827,0.0354 12.0076,7.30545 26.5,16.1875 14.48059,8.87025 26.37082,16.08613 26.40625,16.0625 0.0236,-0.0354 -0.60307,-1.38186 -1.40625,-3 l -1.46875,-2.9375 -24.8125,-13.625 -24.8125,-13.625 0.84375,-1.65625 c 0.47245,-0.90946 1.05684,-2.06643 1.28125,-2.5625 l 0.40625,-0.90625 15.375,3.96875 c 8.45686,2.18509 15.39025,4.01525 15.4375,4.0625 0.0945,0.0945 -1.08464,1.75 -1.25,1.75 -0.0591,0 -2.14883,-0.39493 -4.59375,-0.84375 -2.45674,-0.46064 -4.53051,-0.8125 -4.625,-0.8125 -0.12993,0 -0.64959,0.82772 -1.5,2.375 l -1.3125,2.40625 3.09375,2.28125 c 1.70081,1.2638 3.84816,2.8462 4.78125,3.53125 l 1.6875,1.25 12.5625,2.15625 c 6.89776,1.18113 12.57012,2.11736 12.59375,2.09375 0.0354,-0.0354 0.25689,-3.23372 0.375,-5.3125 l 0.0312,-0.71875 -2.0625,-2.375 -2.0625,-2.34375 -2.5625,-1.09375 c -1.41735,-0.60237 -2.54306,-1.1132 -2.53125,-1.125 0.0118,-0.0118 8.04041,2.03489 17.84375,4.5625 9.80334,2.5276 17.90551,4.59375 18,4.59375 0.0827,0 0.125,-0.0347 0.125,-0.0937 0,-0.0473 0.35604,-2.4618 0.78125,-5.34375 0.4252,-2.88195 0.76181,-5.22639 0.75,-5.25 -0.0236,-0.0118 -18.0734,-2.57351 -40.125,-5.65625 -22.03979,-3.08274 -40.10139,-5.63263 -40.125,-5.65625 -0.0236,-0.0236 0.21235,-0.84397 0.53125,-1.8125 0.33071,-0.96851 0.59375,-1.8312 0.59375,-1.9375 0,-0.12992 -0.86142,-0.47809 -3.09375,-1.28125 L 362.375,368.75 361.75,367.65625 c -0.34252,-0.57875 -0.59794,-1.08958 -0.5625,-1.125 0.0236,-0.0354 17.3655,0.77729 38.53125,1.78125 l 38.46875,1.8125 0.3125,0.3125 0.3125,0.34375 6.96875,0.46875 6.9375,0.46875 0.40625,-0.4375 0.40625,-0.4375 49.1875,2.34375 c 27.05957,1.27561 49.20694,2.29306 49.21875,2.28125 0.0236,-0.0236 -0.90919,-0.73154 -2.03125,-1.59375 l -2.03125,-1.59375 -46.34375,-1.4375 c -25.48868,-0.81498 -46.40551,-1.48819 -46.5,-1.5 -0.0945,-0.0236 1.3004,-1.70443 3.34375,-4.03125 1.93704,-2.19689 3.49238,-4.01944 3.46875,-4.03125 -0.0118,-0.0236 -5.58352,-2.49994 -12.375,-5.5 -6.79146,-3.00006 -12.359,-5.49583 -12.40625,-5.53125 -0.0472,-0.0236 -1.58731,1.38875 -3.40625,3.125 l -3.3125,3.15625 -4.6875,1.5625 c -2.56305,0.86223 -4.69513,1.58956 -4.71875,1.625 -0.0354,0.0236 0.42888,1.935 1.03125,4.25 0.60237,2.31501 1.03544,4.26526 1,4.3125 -0.0472,0.0354 -13.96472,-0.39419 -30.9375,-0.9375 -16.96095,-0.53151 -30.89025,-0.94931 -30.9375,-0.9375 -0.0472,0 -0.31791,-0.42963 -0.625,-0.9375 -0.53151,-0.87404 -0.65471,-1.00365 -3.84375,-3.53125 l -3.3125,-2.59375 0.625,-0.0937 c 0.34253,-0.0473 50.77393,-6.89181 112.0625,-15.21875 l 111.4375,-15.125 0.0625,-3.8125 0,-3.8125 -0.25,0 z m -314.375,18.375 c -0.004,0.0253 0.0135,0.0689 0.0312,0.125 0.0472,0.12993 0.25614,0.70669 0.46875,1.25 L 263.78125,342 282.25,350.90625 c 10.14586,4.88986 18.47639,8.85556 18.5,8.84375 0.0118,-0.0236 -8.22569,-4.43075 -18.3125,-9.78125 -10.07499,-5.3505 -18.61441,-9.87351 -18.96875,-10.0625 -0.43406,-0.24803 -0.58323,-0.32585 -0.59375,-0.25 z m -16.21875,10.8125 c -0.0354,0 -0.82454,0.67321 -1.78125,1.5 -0.95671,0.82679 -1.70349,1.52706 -1.65625,1.5625 0.11811,0.0945 55.05412,8.66462 55.125,8.59375 0.0472,-0.0354 -51.48671,-11.66806 -51.6875,-11.65625 z m 52.0625,11.6875 c -0.12991,-0.0118 -0.2035,0.0271 -0.15625,0.0625 0.0354,0.0354 0.13608,0.0354 0.21875,0 0.0945,-0.0354 0.0674,-0.0625 -0.0625,-0.0625 z m -45.6875,2.6875 0.8125,0.0625 c 0.43703,0.0472 0.96726,0.0819 1.15625,0.0937 0.29527,0 0.25861,0.0568 -0.34375,0.28125 -1.22837,0.47245 -1.17003,0.47245 -1.40625,0 l -0.21875,-0.4375 z m 181.625,1.5625 c 0.0709,0 0.63581,0.52606 1.25,1.1875 L 437,368.8125 l -2,-0.0937 c -1.11026,-0.0472 -3.28467,-0.10901 -4.84375,-0.15625 -1.55909,-0.0354 -2.75074,-0.12081 -2.65625,-0.15625 0.30709,-0.1063 7.03814,-1.98819 7.15625,-2 z m -136.3125,0.25 c -0.0281,0.0118 -0.0236,0.0448 0,0.0625 0.0354,0.0354 0.13608,0.0354 0.21875,0 0.0945,-0.0354 0.0362,-0.0625 -0.0937,-0.0625 -0.065,-0.006 -0.0969,-0.0118 -0.125,0 z m -90.03125,3.5625 c -0.0472,-0.0118 -1.70321,1.19929 -3.6875,2.6875 L 201.03125,375.5625 201,377 c -0.0354,1.40554 -0.0411,1.45275 0.21875,1.5 0.43701,0.0945 19.70964,1.84794 19.875,1.8125 0.11811,-0.0354 -12.54503,-10.0347 -12.78125,-10.09375 z M 232.28125,393.25 c 0,0.1063 7.22564,7.0625 7.34375,7.0625 0.0709,0 1.27434,-0.47613 2.65625,-1.03125 l 2.5,-1 0,-2.1875 0,-2.1875 -0.3125,0 c -0.4134,0 -10.53566,-0.55412 -11.46875,-0.625 -0.4134,-0.0354 -0.71875,-0.0549 -0.71875,-0.0312 z M 205.75,411.625 c -0.0354,0 -0.10139,0.0854 -0.125,0.15625 -0.0354,0.0827 -0.5962,1.97461 -1.28125,4.21875 l -1.25,4.09375 0.375,0.53125 c 2.04335,2.84651 7.11664,9.75763 7.1875,9.78125 0.0472,0.0118 0.28321,-0.55314 0.53125,-1.25 0.24804,-0.70867 0.76647,-2.16336 1.15625,-3.25 l 0.6875,-1.96875 0.4375,-0.0625 c 0.24804,-0.0354 1.25786,-0.10901 2.25,-0.15625 l 1.78125,-0.0625 1.40625,-1.53125 1.40625,-1.5 0.75,-2.28125 c 0.40159,-1.24018 0.67987,-2.25762 0.65625,-2.28125 -0.0709,-0.0709 -6.65133,-2.53125 -6.78125,-2.53125 -0.0709,0 -0.55043,0.5455 -1.09375,1.21875 -0.54331,0.68505 -1.07357,1.21113 -1.15625,1.1875 -0.0709,-0.0236 -1.64563,-0.98694 -3.5,-2.15625 -1.85436,-1.18112 -3.40208,-2.15625 -3.4375,-2.15625 z" transform="scale(0.8,0.8)" style="fill:#000000;stroke:none" />'],
    GHS02: ["0 0 579 579", '<path d="m25 290 264 264 264-264L289 26 25 290z" fill="#fff"/><path d="M148 148 6 290l142 141 141 142 142-142 142-141-142-142L289 6 148 148zm261 22 119 120-119 119-120 119-119-119L51 290l119-120L289 51l120 119z" fill="red"/><path d="M290 121c-18 34 3 53-20 102-13-10-6-47-30-48 3 12 1 16 0 20-3 17-8 31 3 52-17-8-18-23-32-33 3 16-4 49 15 81-17-2-23-8-41-26 19 100 34 103 105 109-6-1-42-7-55-48 0-10-1 9 34 10-22-35-16-28-14-48 10 13 2 15 27 25-8-26 13-43 8-73 6 13 26 11 25 73 17-19 18-6 26-26 1 11 6 25-17 49 6 2 16 3 31-8-15 18-1 18-40 46 49 1 81-30 80-97-2 6-3 18-29 21 16-16 25-49 12-75-5 4-12 24-29 29 8-14 6-32 6-32s3-25-12-45c-4 30-4 46-23 50 3-17 4-26-6-46-10-21-22-42-24-62zm-81 274v18h171v-18H209z"/>'],
    GHS03: ["0 0 579 579", '<path d="M 25.301165,289.67172 289.32987,553.70044 553.40261,289.6277 C 465.35022,201.6757 377.47182,113.54942 289.3739,25.643024 L 25.301165,289.67172 z" style="fill:#ffffff;stroke:none" /><path d="M 147.65941,148.01233 6,289.67173 147.66886,431.34059 289.32827,573 431.01602,431.31224 572.70378,289.62449 431.06327,147.98398 C 353.16571,70.086424 289.40386,6.34347 289.37551,6.34347 c -0.0284,0 -63.79965,63.752403 -141.7161,141.66886 z M 408.62189,170.42535 527.82103,289.62449 408.5652,408.88032 289.31882,528.1267 170.12913,408.87087 50.939444,289.61504 170.13858,170.41591 C 235.69574,104.85874 289.34716,51.22622 289.37551,51.22622 c 0.0283,0 53.68922,53.64197 119.24638,119.19913 z" style="fill:#ff0000;stroke:none" /><path d="m 358.6875,105.6875 c -11.0423,11.95104 -0.0346,61.12295 -22.84375,107.21875 -11.82513,-12.61346 -16.56692,-36.26863 -29.96875,-48.09375 7.07046,18.13186 -12.62633,16.55766 -5.53125,79.625 -10.70725,-2.67681 -11.03725,-7.08846 -34.6875,-35.46875 4.40353,27.52204 1.60663,44.94217 7.125,75.6875 0,0 -5.70036,-1.20109 -33.125,-21.3125 8.90084,29.98175 -6.64874,93.11169 28.78125,137.75 L 268.3125,401 c 2.72662,40.394 31.19994,73.76178 69.125,83.84375 l -68.53125,0 0,29.03125 191.125,0 0,-29.03125 -74.53125,0 c 34.31242,-9.12298 60.86623,-37.31555 67.625,-72.53125 l 0,-0.0312 c 9.39301,-15.01304 51.40412,-63.61206 19.09375,-141.8125 0,0 -9.4793,17.37784 -26.8125,22.0625 0,0 22.20763,-37.01824 3.9375,-67 0,0 -5.35488,21.90682 -23.625,22.84375 0,0 8.89287,-46.72414 -15,-76.46875 -8.67176,19.70855 5.19251,27.87556 -23.65625,44.15625 -3.94686,-60.72292 -16.54987,-70.95791 -28.375,-110.375 z M 352.375,238.125 c 11.01517,6.77856 18.93899,18.4373 21.34375,40.3125 1.05774,9.62189 4.65443,15.13583 7.28125,24.90625 -6.29922,-1.34256 -12.83332,-2.0625 -19.53125,-2.0625 -8.18497,0 -16.11998,1.04974 -23.6875,3.03125 -1.67751,-31.86822 15.00282,-24.87128 14.59375,-66.1875 z M 312.1875,261 c 0,0 4.40898,27.77921 15.65625,46.53125 -7.92479,3.0634 -15.31997,7.1944 -22.03125,12.1875 -3.69493,-28.7985 4.67257,-35.31053 6.375,-58.71875 z m 97.75,14.1875 c 0,0 4.12977,27.81515 9.75,46.46875 -8.90612,-7.11682 -19.14913,-12.63435 -30.28125,-16.125 4.69142,-9.60066 11.90829,-22.24339 20.53125,-30.34375 z m -141.125,30.75 c 0,0 8.37007,8.44267 30.25,19.28125 -7.67749,6.90282 -14.19535,15.07005 -19.25,24.15625 -3.41197,-11.17507 -8.20021,-28.03871 -11,-43.4375 z m 185.28125,10.25 c 0.73429,10.28004 0.74714,35.28952 -3.9375,48.875 l 0.0312,0.46875 c -4.13898,-12.61932 -10.89159,-24.04796 -19.625,-33.65625 5.63339,-4.50221 15.21199,-11.68192 23.53125,-15.6875 z m -93.4375,10.90625 c 36.83069,10e-6 66.71875,29.91931 66.71875,66.75 0,36.83069 -29.88806,66.71875 -66.71875,66.71875 -36.83068,0 -66.71875,-29.88806 -66.71875,-66.71875 0,-36.83068 29.88806,-66.75 66.71875,-66.75 z" transform="scale(0.8,0.8)" style="fill:#000000;stroke:none" />'],
    GHS04: ["0 0 579 579", '<path d="M 25.301165,289.67172 289.32987,553.70044 553.40261,289.6277 C 465.35022,201.6757 377.47182,113.54942 289.3739,25.643024 L 25.301165,289.67172 z" style="fill:#ffffff;stroke:none" /><path d="M 147.65941,148.01233 6,289.67173 147.66886,431.34059 289.32827,573 431.01602,431.31224 572.70378,289.62449 431.06327,147.98398 C 353.16571,70.086424 289.40386,6.34347 289.37551,6.34347 c -0.0284,0 -63.79965,63.752403 -141.7161,141.66886 z M 408.62189,170.42535 527.82103,289.62449 408.57465,408.87087 289.31882,528.1267 170.12913,408.87087 50.948893,289.60559 170.13858,170.41591 C 235.69574,104.85874 289.34716,51.22622 289.37551,51.22622 c 0.0283,0 53.68922,53.64197 119.24638,119.19913 z" style="fill:#ff0000;stroke:none" /><path d="m 437.625,288 c -0.96852,-0.003 -1.94831,0.044 -2.5625,0.15625 -1.19294,0.22442 -231.26696,61.9936 -232.09375,62.3125 -6.51981,2.56304 -10.8959,9.67009 -12.21875,19.875 -0.27166,2.06698 -0.39936,5.8405 -0.28125,8.25 0.18898,3.90952 0.69954,7.2391 1.65625,11.125 3.89771,15.82707 13.74562,28.26275 24.28125,30.625 1.22837,0.27166 4.11537,0.34941 5.34375,0.125 1.03939,-0.17716 229.02875,-61.31076 231.34375,-62.03125 4.4056,-1.3701 7.72314,-4.44552 10.15625,-9.40625 1.3583,-2.75203 2.17814,-5.41479 2.875,-9.3125 0.55513,-3.07092 1.0327,-4.39071 2.34375,-6.375 1.59453,-2.42131 4.35697,-4.48571 7.15625,-5.3125 0.46064,-0.12992 11.84004,-3.17881 25.28125,-6.78125 13.4412,-3.61424 24.7276,-6.70964 25.09375,-6.875 5.43318,-2.49216 7.41122,-10.42801 4.28125,-17.125 -1.72444,-3.67329 -4.8491,-6.38508 -8.15625,-7.09375 -1.12207,-0.23623 -2.83488,-0.20916 -3.96875,0.0625 -0.5197,0.12992 -11.71309,3.12469 -24.90625,6.65625 -13.18136,3.54337 -24.27066,6.51108 -24.625,6.59375 -0.4252,0.1063 -1.36045,0.15625 -2.71875,0.15625 -2.26776,-0.0118 -3.138,-0.16214 -4.96875,-0.90625 -2.29139,-0.9449 -3.73567,-2.09591 -6.0625,-4.8125 -3.48431,-4.06308 -6.62887,-6.62768 -10.125,-8.28125 -1.50002,-0.69686 -3.1139,-1.22071 -4.53125,-1.46875 -0.64962,-0.11221 -1.62523,-0.1533 -2.59375,-0.15625 z" transform="scale(0.8,0.8)" style="fill:#000000;stroke:none" />'],
    GHS05: ["0 0 735 735", '<path d="m367.5 727.4l360-360-360-360-360 360z" fill="#f00"/><path d="m367.5 670.3-302.8-302.8l302.8-302.8 302.8 302.8z" fill="#fff"/><path d="m233.3 384.1c-11.1 0-17.9-3.85-21.1-10.13h-79.98v36.56h199.3v-36.56h-72.5c-4.93 6.32-14.54 10.13-25.76 10.13"/><path d="m251.7 370.5c3.25 0 7.91-1.57 11.67-9.1.86-1.71 1.03-3.89 1.22-6.2.1-1.2.26-3.13.54-3.87.36-.25 1.19-.61 1.78-.87 2.21-.97 5.24-2.29 6.83-5.47.89-1.78 1.15-3.54 1.15-5.22 0-1.26-.15-2.47-.29-3.62-.15-1.21-.28-2.37-.28-3.57 0-.41.001-.82.05-1.24.18-2.1 3.87-6.65 7.19-9.58l-5.07-5.77c-1.54 1.35-9.23 8.4-9.78 14.69-.21 2.47.04 4.56.26 6.4.26 2.19.39 3.48-.11 4.48-.35.69-1.77 1.32-3.04 1.87-1.96.86-4.17 1.82-5.4 4.07-1.08 1.99-1.29 4.58-1.5 7.09-.09 1.15-.23 2.9-.45 3.42-.66 1.31-1.35 2.37-2.06 3.16-.48 1.32-1.31 3.21-2.73 5.25v4.08"/><path d="m241.7 365.7l4.39 6.3c2.51-1.75 4.31-3.73 5.61-5.59 1.42-2.03 2.24-3.92 2.73-5.25.18-.5.32-.92.42-1.23.69-2.15.18-4.19-.27-5.98-.47-1.88-.74-3.09-.22-4.23.6-1.34 1.62-2.14 2.91-3.15 1.47-1.15 3.3-2.59 4.44-5 1.42-2.98.59-6.27-.21-9.44-.56-2.23-1.14-4.54-.83-6.3l-7.56-1.34c-.15.82-.21 1.63-.21 2.44 0 2.51.6 4.91 1.16 7.09.31 1.23.76 3 .76 3.9 0 .16-.001.29-.04.39-.34.72-1.04 1.29-2.24 2.24-1.69 1.33-3.79 2.98-5.16 6-.71 1.58-.95 3.11-.95 4.51 0 1.84.41 3.47.73 4.74.15.6.37 1.48.38 1.84-.79 2.42-2.17 5.5-5.81 8"/><path d="m208 350c.51.95.84 1.84 1.06 2.68.76.49 1.88 1.22 2.1 1.58.34.9.02 3.43-.2 5.11-.07.55-.14 1.08-.19 1.6 1.83 1.83 4.71 3.95 6.26 4.73l-2.89 5.79c1.43 2.04 3.1 4.08 4.62 5.75l5.68-5.17c-3.27-3.6-5.57-7.1-6.12-8.64-.001-.07-.001-.14-.001-.24 0-.67.16-1.95.28-2.84.19-1.51.4-3.12.4-4.71 0-1.44-.17-2.87-.67-4.18-1.01-2.64-3.38-4.15-5.27-5.36-1.12-.71-2.65-1.69-2.73-2.31-.02-.16-.03-.31-.03-.47 0-.77.24-1.56.67-2.9.63-1.95 1.46-4.53 1.46-8.3 0-.51-.02-1.04-.05-1.59l-7.67.46c.19 3.2-.42 5.08-1.06 7.1-.6 1.87-1.29 4-.96 6.67.02.13.04.25.06.38 1.78.94 3.86 2.29 5.25 4.87"/><path d="m191.8 334.1c.13 1.5-.11 2.56-.38 3.8-.47 2.11-1.05 4.73.69 8.19 1.55 3.09 4.21 4.42 6.15 5.38 1.57.78 2.48 1.27 2.99 2.19.63 1.16.56 1.96.44 3.29-.14 1.62-.34 3.85 1.07 6.25 2.3 3.92 8.29 8.11 10.84 9.38l.54-1.08 2.89-5.79c-1.56-.78-4.44-2.89-6.26-4.73-.61-.61-1.1-1.19-1.39-1.68-.14-.23-.15-.52-.04-1.67.11-1.24.25-2.94-.28-4.94-.22-.84-.55-1.74-1.06-2.68-1.4-2.58-3.47-3.93-5.26-4.87-.37-.19-.73-.38-1.07-.55-1.64-.81-2.34-1.21-2.7-1.94-.5-1-.44-1.39-.06-3.1.32-1.46.77-3.45.54-6.12-.44-5.07-4.36-9.32-7.52-12.73l-2.33-2.61-5.94 4.86 2.63 2.96c2.36 2.55 5.29 5.73 5.51 8.18"/><path d="m225.8 339.3c0 5.9 1.42 13.83 8.34 13.83 6.91 0 8.74-8.94 8.74-12.6 0-3.23-4.91-16.91-6.1-29.3-1.53-.02-2.81-.46-3.88-1.16-1.07 13.9-7.15 23.86-7.15 29.2"/><path d="m334.1 227.5c-15.1 2.4-84.1 14.8-90.7 16.1-9.81 1.88-12.1-7-16.56-9.12 0 0 6.61 38.83 7 41.72 1.38 10.38-5.72 15.72-5.72 23.48 0 2.81 1.22 8 4.79 10.35 1.07.7 2.35 1.13 3.88 1.16.05 0 .09 0 .14 0 6.72 0 8.16-6.72 8.16-11.84 0-7.92-3.84-12.48-3.84-14.4s1.6-4.16 7.68-5.12c6.08-.96 82.1-14.16 94.1-16.1s20.88-11.76 18.96-21.84c-1.92-10.1-12.72-16.8-27.84-14.4m5.2 28.32c-10.24.64-99.7 9.28-99.7 9.28l-1.92-12.64s88.5-15.36 98.9-17.1c10.4-1.76 17.76 2.4 17.76 8.96 0 6.56-4.8 10.88-15 11.52"/><path d="m498.8 306.2c-2.07 10.68-6.52 20.93-6.52 23.74 0 3.66 1.09 12.8 8 12.8s9.1-8.13 9.1-14c0-4.66-4.08-12.2-5.79-23.1-1 .44-2.14.7-3.45.7-.47 0-.9-.05-1.32-.13"/><path d="m387.7 261.5c12 1.92 96.1 15.93 102.2 16.9 3.47.55 6.31 2.84 6.31 3.79s-3.71 4.5-3.71 10.73c0 4.76.74 12.26 6.26 13.29.41.08.85.13 1.32.13 1.31 0 2.45-.25 3.45-.7 4.14-1.83 5.78-6.99 5.78-11.69 0-10.97-5.7-8.81-4.33-19.2.38-2.88 5.92-40.54 5.92-40.54-4.48 2.08-5.67 9.82-15.48 7.94-6.67-1.28-83.8-15.51-98.9-17.91s-25.36 5.46-27.3 15.54 6.48 19.79 18.48 21.71m9-29.75c10.41 1.71 104.1 18.1 104.1 18.1l-1.92 12.64s-96.9-8.48-107.1-9.12c-10.24-.64-14.88-4.16-14.88-10.72s8.16-12.8 19.84-10.88"/><path d="m532.7 318.2c.05 1.08.08 1.67-.51 3-1.12 2.48-3.07 5.57-6 6.27l1.75 7.48c3.33-.78 7.99-3.25 11.3-10.6 1.36-3 1.25-5.1 1.18-6.54-.06-1.2-.09-1.7.93-3.31.73-1.14.93-1.19 1.8-1.42 1.97-.52 4.23-1.37 6.18-5 2.22-4.14 1.5-7.58.98-10.1-.28-1.38-.51-2.46-.33-3.59.27-1.72 1.48-3.04 3.79-5.41 1.25-1.29 2.67-2.75 4.11-4.58l-6-4.75c-1.18 1.51-2.4 2.76-3.58 3.97-2.56 2.63-5.2 5.35-5.87 9.56-.4 2.51.04 4.64.4 6.35.46 2.24.63 3.29-.23 4.9-.52.98-.54.98-1.36 1.2-1.93.51-4.18 1.33-6.34 4.74-2.15 3.39-2.23 5.63-2.12 7.81"/><path d="m519.6 331.2c3.68-3.24 4.82-4.41 6.5-9.81 1.09-3.51.84-5.83.64-7.69-.16-1.48-.27-2.55.23-4.46.26-.98.35-1.02 1.42-1.6 1.64-.88 4.38-2.35 5.59-7.11 1.11-4.37-.15-7.12-1.07-9.13-.72-1.56-1.15-2.51-.77-4.56l-7.56-1.38c-.8 4.43.44 7.15 1.35 9.13.72 1.57 1.05 2.29.61 4-.38 1.49-.65 1.63-1.78 2.24-1.53.82-4.1 2.2-5.22 6.39-.88 3.29-.64 5.49-.45 7.26.17 1.56.28 2.6-.34 4.58-1.11 3.57-1.23 3.68-4.24 6.32l-1.79 1.59 5.14 5.71 1.72-1.53"/><path d="m462.7 305.6c.87 3.85 3.61 5.54 5.61 6.78 1.82 1.13 2.44 1.59 2.69 2.8.4 1.88.22 2.42-.05 3.22-.54 1.6-.95 3.28-.13 6.18 1.44 5.1 2.98 6.76 8.1 11.87l5.43-5.43c-4.85-4.85-5.25-5.41-6.15-8.55-.24-.84-.22-.9.02-1.63.56-1.68 1.05-3.63.28-7.26-.96-4.52-4.1-6.45-6.17-7.73-1.57-.97-2-1.32-2.15-1.93-.27-1.22.02-2.15.67-3.98.78-2.22 1.76-4.98 1.3-8.93l-7.63.9c.26 2.17-.26 3.63-.91 5.47-.75 2.13-1.69 4.8-.92 8.23"/><path d="m457.5 303.6c0-1.37-.21-2.96-.85-4.86-1.78-5.23-3.63-7.25-5.77-9.58l-2.15-2.44-5.91 4.9 2.41 2.73c1.93 2.1 2.9 3.16 4.16 6.86.66 1.95.46 2.97.17 4.51-.38 1.98-.91 4.69.79 8.52 1.88 4.22 4.69 5.26 6.56 5.95 1.24.46 1.46.54 1.9 1.47.74 1.6.65 2.06.47 2.89-.23 1.1-.62 2.94.45 5.35 1.37 3.12 5.24 10.48 11.51 11.4l1.12-7.6c-1.54-.23-4-3.25-5.6-6.89l-.06-.18.1-.51c.16-.76.3-1.57.3-2.49 0-1.39-.31-3.04-1.31-5.21-1.77-3.81-4.44-4.8-6.21-5.45-1.32-.49-1.63-.6-2.19-1.86-.38-.86-.52-1.47-.52-2.09 0-.55.11-1.1.25-1.85.19-.99.42-2.16.42-3.58"/><path d="m507.7 348.4c-7.53 6.09-24.39 6.56-33.3-1.56l-1.88-1.71-2.31 1.07c-3.43 1.59-8 1.72-11.67 1.82-4.67.13-8.36.24-10.25 3.19-1.37 2.14-1.24 5.1.37 7.99.26.48.57.96.91 1.44h16.75c-6.23 0-9.5-2.94-10.71-4.8.98-.07 2.15-.12 3.15-.14 3.68-.11 8.11-.31 12.31-1.69 4.58 3.49 10.17 5.49 15.87 6.25 4.13-4.86 11.1-6.64 15.18-6.64v5.75c3.18-.83 6.11-2.06 8.56-3.65 4.08 1.76 9.8 5.23 13.78 7.64 3.46 2.1 5.17 3.13 6.31 3.56 3.48 1.34 18 2.53 26.99 2.53v-7.68c-10.16 0-22.32-1.34-24.2-2.02-.61-.25-3.09-1.75-5.07-2.96-5.17-3.14-12.25-7.44-17.1-9.1l-1.99-.66-1.63 1.32"/><path d="m466.3 360.6h-28.65c-12.9 0-14.28 7.9-14.28 10.67 0 .77.09 1.75.36 2.8h11.64c-3.42 0-4.51-1.34-4.51-2.77s1.31-3 6.79-3h45.99c.25-3.12 1.36-5.66 2.96-7.68h-20.3"/><path d="m491.4 368.3h1.1l22.96-5.36-13.1-2.32h-.24v.66c-.1 0-9.61.43-10.73 7"/><path d="m419.3 374.1c-7.4 0-12.38 5.81-12.38 11.24 0 5.18 4.6 11.43 12.76 11.43h2.39c.55-2.95 2.9-7.15 11.65-7.63v-.05h-14c-2.88 0-5-2.82-5.08-3.76 0-1 1.4-3.55 4.7-3.55h49.89v-7.68h-49.89"/><path d="m422 396.7c-.12.63-.15 1.19-.15 1.66 0 6.3 5.55 11.43 15 11.43h.18c1.44-4.26 6.69-7.26 13.67-7.64v-.05h-13.85c-4.76 0-7.36-2.48-7.36-3.75 0-1.09 2.94-1.66 5.84-1.66h33.77v-7.68h-33.77c-.6 0-1.16.02-1.71.05-8.75.48-11.1 4.68-11.65 7.63"/><path d="m437.1 409.8c-.26.77-.41 1.58-.41 2.42 0 4.82 4.32 10 13.96 10.85 6.98.58 37.1 1.53 42.62 1.53 4.5 0 23.36-.61 33.52-3.57 3-.88 5.55-2.06 8-3.2 5.28-2.46 10.74-5 22.6-5v-7.68c-13.57 0-20.1 3.04-25.84 5.71-2.29 1.06-4.45 2.07-6.91 2.79-8.53 2.49-25.98 3.26-31.37 3.26-5.1 0-35.2-.94-41.99-1.5-4.88-.41-6.91-2.28-6.91-3.19.17-.47 2.52-2.42 7.92-2.42h30.92l-7.4-7.68h-23.52c-.51 0-1.02.02-1.52.05-6.99.38-12.23 3.37-13.67 7.63"/><path d="m486.9 360.2c-.11.13-.22.25-.32.38-1.6 2.02-2.71 4.56-2.96 7.68-.03.43-.06.86-.06 1.31 0 7.14 3.76 19.6 28.96 22.79l.96-7.62c-8.31-1.05-22.2-4.42-22.2-15.17 0-.46.04-.9.11-1.31 1.13-6.59 10.63-7 10.73-7v-7.68c-4.07 0-11.1 1.78-15.18 6.63"/>'],
    GHS06: ["0 0 735 735", '<path d="m367.5 727.4l360-360-360-360-360 360z" fill="#f00"/><path d="m367.5 670.3-302.8-302.8l302.8-302.8 302.8 302.8z" fill="#fff"/><path d="m361.6 364.2c8.23 0 5.45-3.33 12.48-3.33 5.73 0 3.79 3.24 11.56 3.24 7.21 0 8.97-5.45 8.97-7.67 0-3.42-3.88-5.62-5.64-10.26-1.76-4.62-5.18-21.72-15.62-21.72-3.84 0-6.1 1.57-8.97 4.99-4.71 5.55-5.09 14.87-8 18.49-2.87 3.51-3.98 7.28-3.98 9.25 0 2.13 1.02 7 9.25 7m-80.55 58.51-7.9 3.74c-7.91 3.81-17.78 11.77-19.83 28.1-.34 2.68-6.39 9.79-12.59 9.79-3.81 0-8.32-2.52-8.94-6.27-1.08-6.44-5.95-29.55-6.16-30.53-.6-2.85-3.4-4.68-6.26-4.07s-4.68 3.4-4.07 6.26c.001.06.76 3.65.76 3.65-9.18-4.38-9.56-5.17-9.56-8.33 0-3.9 9-8.87 16.1-8.87 5.97 0 10.54 1.71 14.97 3.36 4 1.5 8.13 3.04 12.8 3.04 6.72 0 8.64-.68 11.73-2.35l2.6-1.27c4.07-1.71 35.64-16.78 49.55-23.43 1.94 2.78 4.26 5.57 6.94 8.25m-3.3-52c12.29 7.63 12.1 7.29 12.16 12.1-.15 1.3-.2 3.44-.2 7.41 0 13.1 25.5 24.1 41.52 24.1 17.77 0 41.3-12 41.3-24.49v-6.74c0-5.32.56-5.81 10.83-11.84v24.99c0 6.99-9.58 21.91-26.89 30.62l-.56.28c-8.38 4.21-18.8 9-23.1 9-3.97 0-17.41-3.92-28.1-9.31-17.32-8.7-26.89-23.63-26.89-30.62zm-108-40.9c-.02.0010-.04.03-.07.04.02-.0010.04-.03.07-.04m310.9-9.9c2.33 0 3.34.76 3.9 1.34 3.4 3.51 3.07 13.78 2.84 21.28l-.13 5.95c-.06 2.92 2.25 5.21 5.16 5.28 2.91.06 5.33-2.36 5.4-5.28l.05-2.13c.3.81.44 1.5.44 1.95v10.16c0 2.88-.84 6.32-4.82 6.32-3.27 0-7.46-2.04-11.5-4-4.66-2.27-9.1-4.42-13.57-4.42l-.76-.03c-2.63-.13-8.11-.38-15.83 3.23l-.15.07-57.75 29.3v-14.68c8.54-3.9 41.3-18.92 49.4-23.1 9.13-4.7 16.1-14.75 20.2-20.76l1.59-2.27c2.75-3.78 8.47-8.19 15.56-8.19zm-266.4 39.7-.08-.03c-7.72-3.62-13.2-3.36-15.83-3.23l-.76.03c-4.5 0-8.91 2.15-13.57 4.42-4 1.97-8.22 4-11.5 4-3.99 0-4.82-3.43-4.82-6.32v-10.16c0-.45.14-1.14.44-1.95l.05 2.12c.06 2.92 2.48 5.34 5.4 5.28 2.91-.06 5.23-2.36 5.16-5.28l-.13-5.95c-.24-7.5-.56-17.77 2.83-21.28.56-.57 1.57-1.34 3.9-1.34 7.09 0 12.82 4.41 15.57 8.19l1.59 2.27c4.14 6 11.1 16.1 20.2 20.76 7.08 3.65 32.3 15.23 44.58 20.87v14.45zm117.1-164.8c29.36 0 43.62 12.25 61.7 28.68l9.58 8.59 3.57 3.1c11.48 9.95 22.33 19.35 22.33 24.92 0 6.9-2.41 13.78-5.68 20.2.38-2.35.4-3.9.4-6.89 0-11.37-3.14-16.27-14.75-28.41l-7.63 7.3c10.88 11.37 11.82 13.79 11.82 21.1 0 4.55 0 4.55-2.31 14.8l-3.06 13.74.35 1.25c.04.13 3.59 13.18 3.59 25.7 0 13.1-8 17.98-18.1 24.2l-3.18 1.96-10.89 6.56c-11.5 6.75-17.23 9.73-17.23 21.52v6.74c0 3.91-14.78 13.93-30.53 13.93-14.46 0-30.38-10-30.96-13.64 0-4.83.21-6.92.21-6.92 0-11.56-5.6-14.81-16.77-21.29-3.11-1.8-6.97-4.05-11.52-6.9l-3.18-1.96c-10.14-6.2-17.38-9.72-17.38-24.2 0-15.23 3.63-20.67 3.63-25.37s-5.07-23-5.07-25.87c0-.37.04-3.46.04-3.46 0-6.85.87-12.57 11.46-21.98.86-.76 2.17-3.09 1.12-4.38s-1.47-1.83-2.69-3.27c-.61-.72-1.72-1-2.79-1.01-1.07 0-2.11.28-2.58.7-12.53 11.13-15.1 19.56-15.1 29.94 0 0-.04 3.09-.04 3.55 0 2.82-.12 1.4 1.33 7.33-4.52-7.66-8.32-16.28-8.32-24.95 0-5.39 10.33-14.75 21.27-24.65l4.78-4.34c3.78-3.45 7.1-6.67 10.24-9.79 7.24-7.11 12.95-12.72 19.6-16.1 14.99-7.6 28.6-10.4 42.82-10.4m-62.3 210.5c-18.32 8.76-45.1 21.53-48.57 22.98l-3.52 1.71c-1.53.83-2 1.07-6.71 1.07-2.75 0-5.69-1.1-9.1-2.37-4.81-1.8-10.79-4-18.67-4-10.86 0-26.64 7.57-26.64 19.43 0 10.56 6.77 13.73 17.98 19l4.82 2.29c1.13 5.54 2.21 10.95 2.63 13.48 1.57 9.44 11.1 15.1 19.36 15.1 11.8 0 22.1-11.55 23.1-19 1.19-9.47 5.74-15.99 13.92-19.92l7.79-3.69 44.5-20.95c3.05 2.19 6.36 4.23 9.92 6 8.71 4.38 25.2 10.86 32.88 10.86 6.82 0 17-5.14 28.1-10.72 4.76-2.39 8.84-5 12.49-7.87l54.78 26.35c8.18 3.94 12.73 10.45 13.92 19.92.94 7.49 11.27 19 23.1 19 8.28 0 17.78-5.64 19.36-15.1.42-2.53 1.5-7.94 2.63-13.48l-.47.22.47-.22 4.83-2.29c11.21-5.27 17.98-8.45 17.98-19 0-11.86-15.77-19.43-26.64-19.43-7.88 0-13.86 2.24-18.67 4-3.4 1.27-6.34 2.37-9.1 2.37-4.71 0-5.18-.25-6.71-1.07l-3.52-1.71c-3.71-1.56-34.54-16.26-52.66-24.93.25-.76.46-1.51.63-2.25 12.41-6.28 62.8-31.81 63-31.91 5.34-2.49 8.64-2.34 10.83-2.24l1.26.04c2.06 0 5.56 1.7 8.94 3.35 4.88 2.38 10.42 5.08 16.1 5.08 9.1 0 15.38-6.94 15.38-16.88v-10.16c0-5.52-3.81-13.21-10.9-17.51-.39-6.56-1.77-12.71-5.82-16.89-2.93-3-6.79-4.55-11.48-4.55-11.1 0-19.69 6.48-24.1 12.54l-1.74 2.49c-3.35 4.85-9.57 13.88-16.34 17.36-4.87 2.51-19.21 9.18-31.45 14.82 7.95-5.8 14.75-13.59 14.75-27.7 0-8.82-1.51-17.6-2.67-23l1.9-2.82c7.61-10.99 18-26 18-42.93 0-10.39-10.9-19.83-25.98-32.9l-3.55-3.08-9.4-8.43c-18.2-16.54-35.3-32.2-68.78-32.2-15.72 0-31.3 4-47.59 12.28-8.11 4.11-14.65 10.54-22.2 17.98-3.11 3.05-6.32 6.21-9.96 9.53l-4.75 4.32c-14.36 13-24.74 22.4-24.74 32.48 0 16.89 10.42 31.94 18 42.93l1.35 2c-1.08 7.73-2.2 17.94-2.2 25.1 0 9.85 4.54 16.79 10.47 22.2-9.49-4.41-18.58-8.68-22.28-10.58-6.77-3.48-12.99-12.51-16.34-17.36l-1.74-2.49c-4.41-6.1-13.1-12.54-24.1-12.54-4.69 0-8.56 1.53-11.48 4.55-4.05 4.18-5.44 10.33-5.82 16.9.02-.0010.04-.02.07-.04-.02.0010-.04.02-.07.04-7.09 4.3-10.91 11.99-10.91 17.51v10.16c0 9.94 6.33 16.88 15.39 16.88 5.71 0 11.24-2.7 16.1-5.08 3.38-1.65 6.87-3.35 8.94-3.35l1.26-.04c2.19-.1 5.49-.26 10.83 2.24.19.09 40.2 20.38 57.73 29.2m120.8 14.4c10.77 5.15 48.79 23.32 53.2 25.2l2.6 1.27c3.08 1.67 5 2.35 11.73 2.35 4.66 0 8.8-1.55 12.8-3.04 4.42-1.65 9-3.36 14.97-3.36 7.1 0 16.1 4.97 16.1 8.87 0 3.16-.38 3.95-9.56 8.33.46-2.18.75-3.59.77-3.64.6-2.85-1.22-5.65-4.08-6.26-2.85-.6-5.65 1.22-6.25 4.07-.21.98-5.08 24.1-6.16 30.53-.63 3.75-5.13 6.26-8.94 6.26-6.2 0-12.25-7.11-12.59-9.79-2.05-16.36-11.91-24.32-19.82-28.1l-51-24.53c2.45-2.66 4.55-5.4 6.29-8.1m-13.8-73.1c17.6 0 25-22.1 25-27.79s-4.5-8.1-7.15-8.1h-33.48c-3.57 0-12.17 2.91-12.17 8.47 0 2.08 1.56 6.66 4.92 11.1 5.8 7.68 10.83 16.28 22.87 16.28m-87.49.04c12 0 17.1-8.6 22.87-16.28 3.36-4.45 4.92-9 4.92-11.1 0-5.56-8.6-8.47-12.17-8.47h-33.48c-2.65 0-7.14 2.38-7.14 8.1 0 5.69 7.41 27.79 25 27.79m-9.1 21.76h-7.84c3.76 1.73 6.61 3 7.84 3.59v-3.59m-10.4 36.7c.25 2.14.86 4.46 1.81 6.88z"/>'],
    GHS07: ["0 0 5790 5790", '<path d="m253 2897 2640 2640 2641-2640c-880-880-1760-1762-2640-2640L253 2897" fill="#fff"/><path d="m60 2897 2833 2833 2834-2834L2894 63 60 2897zm5218 0L2893 5280 510 2896 2894 512l2384 2384" fill="red"/><path d="M2892 1428h-20a475 475 0 0 0-301 121 229 229 0 0 0-64 113c-3 11-3 14-3 35s0 25 3 37c2 14 195 1314 197 1336a213 213 0 0 0 239 182 213 213 0 0 0 180-182c3-27 195-1324 198-1337 2-12 2-16 2-35 0-23 0-31-5-47a234 234 0 0 0-106-138 496 496 0 0 0-291-85h-30zm20 2011h-12a302 302 0 0 0-243 141 338 338 0 0 0-55 232 343 343 0 0 0 114 218 310 310 0 0 0 199 74 316 316 0 0 0 258-141 341 341 0 0 0 54-234 390 390 0 0 0-32-110 317 317 0 0 0-281-180"/>'],
    GHS08: ["0 0 919 919", '<path fill="#f00" d="m459.5 909.3l449.8-449.8-449.8-449.8-449.8 449.8z"/><path fill="#fff" d="m459.5 838-378.5-378.5 378.5-378.6 378.5 378.6z"/><path d="m461.6 170.1c-53 0-96 46.3-96 103.4 0 37.1 13.88 89.2 40.94 121.1l-3.31 33.86-72.6 26.3c1.16 5.67 6.18 9.93 12.18 9.93 1.06 0 2.09-.15 3.07-.4 1.38 5.36 6.23 9.31 12 9.31.61 0 1.21-.05 1.8-.14 1.42 5.3 6.24 9.21 12 9.21 1.69 0 3.3-.34 4.77-.95.39 3.98 3.76 7.1 7.85 7.1.8 0 1.58-.12 2.31-.35 1 5.85 6.1 10.31 12.24 10.31 4.78 0 8.93-2.7 11-6.65 2.09 1.59 4.69 2.54 7.51 2.54 1.83 0 3.57-.41 5.13-1.12 1.62 3.44 4.63 6.09 8.29 7.23-.14.45-.25.93-.25 1.43 0 2.53 2.05 4.57 4.57 4.57s4.57-2.04 4.57-4.57c0-.56-.11-1.09-.3-1.59 5.33-1.87 9.16-6.93 9.16-12.9 0-2.73-.81-5.27-2.19-7.4 2.24-.3 3.96-2.19 3.96-4.51 0-1.97-1.25-3.64-3-4.27 1.9-2.19 3.07-5 3.07-8.17 0-.59-.06-1.18-.14-1.75 4.69-1.78 8-6.31 8-11.62 0-3.32-1.32-6.32-3.44-8.55.39.11.79.19 1.21.19 2.52 0 4.56-2.05 4.56-4.57 0-2.53-2.04-4.57-4.56-4.57-1 0-1.92.33-2.68.88-.91-1.7-2.56-2.93-4.52-3.25 1.54-2.52 2.44-5.46 2.44-8.63 0-2.05-.39-4-1.07-5.82 4.71-1.76 8.1-6.3 8.1-11.62 0-3.11-1.14-5.94-3-8.12 3.45-1.14 5.94-4.39 5.94-8.23 0-3.15-1.69-5.9-4.2-7.42 1.18-1.48 1.88-3.34 1.88-5.38 0-.52-.05-1.03-.14-1.52 1.8-.09 3.46-.7 4.82-1.72-.11.54-.16 1.08-.16 1.64 0 3.08 1.6 5.78 4 7.32-.48 1.32-.75 2.74-.75 4.22 0 5.07 3 9.41 7.36 11.35-.4 1.42-.63 2.92-.63 4.46 0 5.26 2.48 9.94 6.33 12.94-3.37 1.47-5.73 4.83-5.73 8.74s2.35 7.26 5.71 8.74c-.67 1.16-1.06 2.51-1.06 3.95 0 3.16 1.85 5.87 4.53 7.13-.77 1.91-1.2 3.99-1.2 6.17 0 2.62.63 5.1 1.73 7.3-.53.6-1 1.22-1.45 1.89-.83-.84-1.98-1.36-3.25-1.36-2.52 0-4.57 2.04-4.57 4.57 0 2.52 2.05 4.56 4.57 4.56.22 0 .42-.03.63-.06-.03.42-.06.84-.06 1.27 0 3.17.91 6.11 2.46 8.62-1.33 2.52-2.09 5.39-2.09 8.44 0 4.68 1.78 8.92 4.67 12.14-.8 1.3-1.27 2.82-1.27 4.46 0 4.67 3.78 8.46 8.46 8.46 4.16 0 7.61-3 8.32-6.96 2.29-.25 4.44-.92 6.39-1.93 1 2.17 3.2 3.69 5.75 3.69 3.51 0 6.35-2.84 6.35-6.35 0-2.65-1.64-4.92-3.95-5.87.64-1.38 1.1-2.87 1.38-4.41 1.37.37 2.8.58 4.29.58.18 0 .37-.02.56-.02 1.11 2.86 3.89 4.88 7.15 4.88 2.5 0 4.72-1.2 6.12-3.06.79 2.88 3.42 5 6.56 5 2.37 0 4.46-1.22 5.68-3.07 1.32.81 2.86 1.29 4.53 1.29 4.79 0 8.67-3.89 8.67-8.68 0-1.6-.44-3.09-1.2-4.38.66.22 1.37.33 2.09.33 3.76 0 6.81-3.04 6.81-6.8 0-.32-.03-.63-.08-.94 1.45 2.79 4.35 4.69 7.71 4.69 4.73 0 8.57-3.78 8.66-8.49 2.26-1.4 3.84-3.81 4.09-6.6.44.15.9.24 1.39.24 2.52 0 4.57-2.04 4.57-4.57 0-.52-.09-1.03-.26-1.5l-6.94-2.23-72.5-23.34-.29-30.95c11-11.84 19.59-27.1 25.81-43.69 11.78-31.4 18.1-64.6 18.1-81.98 0-45-43-103.4-96-103.4zm-148.6 291.9c-1.25 0-2.42.36-3.41.97-17.25 6.61-31.57 12.1-37 14.3-12.17 4.86-21.2 17.87-21.2 30.76v41.54l67.3 68.3c.68.15 1.4.22 2.13.22 3.73 0 6.99-2.03 8.73-5 1.35.51 2.82.8 4.35.8 6.87 0 12.44-5.57 12.44-12.44 0-.49-.04-.98-.09-1.45 1.84 2.28 4.66 3.74 7.83 3.74 5.56 0 10.1-4.51 10.1-10.1 0-1.51-.34-2.93-.93-4.21 2-.71 3.74-2.04 4.94-3.76 1.28 1.31 3.06 2.12 5 2.12 3.89 0 7.1-3.16 7.1-7 0-2.03-.86-3.85-2.23-5.14 2.58-1.25 4.54-3.57 5.31-6.39 1.62 1.78 3.87 2.98 6.39 3.24-1 1.23-1.63 2.8-1.63 4.52 0 3.89 3.16 7 7.1 7s7.1-3.16 7.1-7c0-3.19-2.12-5.88-5-6.75 2.24-1.85 3.67-4.65 3.67-7.78 0-.93-.13-1.81-.37-2.66.31.02.62.04.93.04 1.42 0 2.77-.29 3.99-.82.11 2.71 2.32 4.88 5.06 4.88 2.8 0 5.08-2.28 5.08-5.08 0-2.74-2.17-4.95-4.89-5.06.53-1.22.83-2.57.83-3.99 0-.87-.13-1.7-.34-2.5 2.53 0 4.58-2.04 4.58-4.57 0-2.52-2.05-4.56-4.58-4.56-.13 0-.25.02-.38.03-.26-3.8-2.22-7.13-5.13-9.23.001-.29.04-.58.04-.88 0-6.87-5.57-12.43-12.44-12.43-2.39 0-4.62.68-6.51 1.86.27-.72.42-1.5.42-2.31 0-3.6-2.91-6.52-6.51-6.52-.65 0-1.26.1-1.85.27.09-.58.14-1.18.14-1.78 0-6.87-5.56-12.44-12.43-12.44-2.13 0-4.13.53-5.88 1.47-1.57-2.56-4-4.5-6.97-5.39.37-.82.59-1.74.59-2.7 0-3.6-2.92-6.52-6.52-6.52-.85 0-1.65.17-2.39.46-.05-6.83-5.59-12.35-12.43-12.35-1.11 0-2.17.16-3.19.43-.99-2.33-3.3-3.97-6-3.97-1.59 0-3.04.57-4.17 1.52-.44-3.18-3.15-5.63-6.45-5.63m304.3 1.46c-3.06.24-5.55 2.49-6.14 5.44-.93-.48-1.98-.75-3.1-.75-3.76 0-6.8 3.04-6.8 6.8 0 .37.03.73.09 1.08-2.07-1.54-4.63-2.46-7.41-2.46-6.87 0-12.44 5.56-12.44 12.43v.06c-1.26-.3-2.57-.49-3.93-.49-9.1 0-16.41 7.35-16.41 16.42 0 .85.08 1.68.21 2.5-.97-.43-2.04-.67-3.16-.67-2.59 0-4.88 1.26-6.32 3.18-1.49-.49-3.07-.76-4.72-.76-8.09 0-14.67 6.39-15 14.4-.52-.11-1.05-.16-1.6-.16-4.35 0-7.88 3.53-7.88 7.88 0 1.33.33 2.57.9 3.67-1.25-.71-2.7-1.12-4.24-1.12-4.79 0-8.68 3.89-8.68 8.68 0 2.5 1.07 4.75 2.76 6.33v.08c-2 .2-3.68 1.55-4.32 3.39-.26.57-.4 1.2-.4 1.86 0 1.6.83 3 2.08 3.83.87.67 1.94 1.08 3.12 1.08 2.18 0 4-1.37 4.76-3.29 1.18.64 2.53 1 3.97 1 .65 0 1.28-.08 1.89-.22-.05.52-.08 1.05-.08 1.59 0 1.98.39 3.87 1.09 5.61-2.8.66-4.89 3.16-4.89 6.16 0 .93.2 1.8.56 2.59.9 2.29 3.12 3.92 5.73 3.92 2.17 0 4.06-1.12 5.16-2.8.41-.58.74-1.21.95-1.9 1.95.93 4.13 1.46 6.44 1.46.72 0 1.41-.07 2.1-.16-.41 1.09-.64 2.27-.64 3.51 0 1.63.4 3.16 1.09 4.52-.32-.06-.65-.1-.99-.1-2.8 0-5.08 2.27-5.08 5.08 0 2.8 2.28 5.08 5.08 5.08 2.53 0 4.61-1.86 4.99-4.28 1.37 5.38 6.24 9.36 12 9.36 2.61 0 5-.8 7-2.17.6 4.99 4.85 8.86 10 8.86 2.62 0 5-1 6.8-2.66-.02.3-.05.61-.05.92 0 6.86 5.57 12.43 12.44 12.43 2.35 0 4.54-.66 6.42-1.8-.94 1.28-1.5 2.86-1.5 4.57 0 4.29 3.47 7.76 7.75 7.76 2.59 0 4.88-1.28 6.29-3.22l67.3-61.99v-45.4c0-13.77-14.82-30.98-32.74-37.1-4-1.37-30.56-10-30.56-10m-153.4 6c-3.51 0-6.35 2.84-6.35 6.35 0 2.42 1.37 4.5 3.37 5.57-1.91.55-3.31 2.29-3.31 4.37 0 2.53 2.05 4.57 4.57 4.57s4.57-2.04 4.57-4.57c0-1.52-.75-2.86-1.9-3.69 3.05-.46 5.39-3.07 5.39-6.25 0-3.51-2.84-6.35-6.34-6.35m-22.7 5.89l-.03.27-.32-.17c.12-.03.24-.07.35-.1m13.78 21.61c-2.53 0-4.57 2.05-4.57 4.57s2.04 4.57 4.57 4.57c2.52 0 4.57-2.05 4.57-4.57s-2.05-4.57-4.57-4.57m-42.1 4.86c-3.6 0-6.52 2.92-6.52 6.52s2.92 6.51 6.52 6.51 6.52-2.91 6.52-6.51-2.92-6.52-6.52-6.52m73.86 11.58c-2.81 0-5.1 2.29-5.1 5.1 0 2.82 2.29 5.11 5.1 5.11.41 0 .81-.06 1.18-.16.19 3.6 3.15 6.46 6.79 6.46.5 0 .98-.06 1.45-.16 3.16-.36 5.62-3 5.62-6.27 0-1.16-.33-2.23-.87-3.17-1.07-2.36-3.44-4-6.2-4-1.12 0-2.17.27-3.1.75-.63-2.1-2.56-3.65-4.87-3.65m-70.85 11.67c-2.53 0-4.57 2.05-4.57 4.57 0 2.53 2.04 4.57 4.57 4.57.96 0 1.86-.3 2.6-.82.17 3.36 2.91 6 6.31 6 3.51 0 6.35-2.84 6.35-6.35 0-3.5-2.84-6.34-6.35-6.34-1.75 0-3.33.71-4.48 1.85-.48-2-2.28-3.51-4.43-3.51m89 32.51c-3.76 0-6.8 3.04-6.8 6.8 0 .86.16 1.68.45 2.44-2.46.34-4.37 2.44-4.37 5 0 .72.16 1.4.43 2 .71 1.79 2.45 3.07 4.5 3.07h.13c2.82 0 5.1-2.28 5.1-5.08 0-.23-.04-.45-.07-.67.21.02.42.03.63.03 3.76 0 6.8-3.04 6.8-6.8s-3.04-6.8-6.8-6.8m-53.3 8.58c-3.51 0-6.35 2.85-6.35 6.35 0 3.51 2.84 6.35 6.35 6.35 3.5 0 6.34-2.84 6.34-6.35 0-3.5-2.84-6.35-6.34-6.35m-37 .93c-2.8 0-5.08 2.27-5.08 5.08 0 2.8 2.28 5.07 5.08 5.07s5.07-2.27 5.07-5.07c0-2.81-2.27-5.08-5.07-5.08m7.44 13.78c-3.89 0-7.1 3.16-7.1 7 0 3.54 2.61 6.46 6 6.97-.02.26-.05.52-.05.79-2.16-1.78-4.92-2.86-7.94-2.86-4.52 0-8.47 2.43-10.65 6-1.84-2.03-4.49-3.31-7.45-3.31-4.7 0-8.64 3.22-9.75 7.58-1.62-1.11-3.57-1.75-5.68-1.75-5.56 0-10.1 4.5-10.1 10.1 0 .78.09 1.53.26 2.26-2.67-2.43-6.21-3.93-10.1-3.93-6.21 0-11.53 3.76-13.83 9.12-1.62-1.1-3.57-1.75-5.68-1.75-5.56 0-10.1 4.5-10.1 10.1 0 .81.1 1.6.28 2.35l122.2 124.1c1.6-.67 2.72-2.25 2.72-4.09 0-1.74-1.02-3.23-2.48-3.96 1.73-.61 2.98-2.23 2.98-4.17 0-1.83-1.11-3.4-2.69-4.08 1.57-1.03 2.6-2.8 2.6-4.81 0-2.75-1.92-5-4.49-5.62 5.11-3.53 8.47-9.42 8.47-16.1 0-4.13-1.28-7.95-3.46-11.1 3.52-2.2 5.86-6.1 5.86-10.55 0-5-2.98-9.35-7.27-11.31 1.69-1.29 2.78-3.31 2.78-5.6 0-2.39-1.19-4.5-3-5.78 1.03-1.22 1.64-2.79 1.64-4.51 0-3.89-3.16-7-7.1-7-.59 0-1.15.08-1.7.21.79-1.63 1.25-3.46 1.25-5.4 0-1.81-.4-3.53-1.1-5.08 3.66-.26 6.54-3.3 6.54-7 0-3-1.92-5.61-4.61-6.6 2.63-2.28 4.31-5.64 4.31-9.4 0-4.3-2.18-8.09-5.5-10.32 1.92-2.19 3.1-5.06 3.1-8.2 0-2.75-.9-5.28-2.42-7.34 1.96-.7 3.37-2.56 3.37-4.76 0-2.8-2.27-5.08-5.08-5.08-1.71 0-3.22.86-4.14 2.16-2.27-2.81-5.75-4.61-9.65-4.61-1.83 0-3.55.4-5.11 1.1-1.19-2.21-3.53-3.72-6.22-3.72zm69.1 2.03c-4.67 0-8.46 3.79-8.46 8.46 0 1.44.37 2.8 1 3.98-1.22-1-2.78-1.61-4.48-1.61-3.9 0-7.1 3.15-7.1 7 0 3.35 2.34 6.15 5.48 6.86-.92 1.74-1.45 3.71-1.45 5.81 0 4 1.93 7.61 4.91 9.88-1.14 2.12-1.79 4.54-1.79 7.11 0 3.99 1.56 7.61 4.1 10.3-.83 1.87-1.3 3.93-1.3 6.1 0 .84.09 1.66.22 2.46-1.02-.7-2.23-1.16-3.54-1.25.86-1.17 1.38-2.61 1.38-4.17 0-3.9-3.16-7-7.1-7-3.9 0-7.1 3.15-7.1 7 0 1.87.72 3.56 1.91 4.82-2.95.84-5.12 3.56-5.12 6.78 0 3.89 3.16 7 7.1 7 .22 0 .43-.04.65-.06-1.3 2.22-2.06 4.81-2.06 7.57 0 5.25 2.69 9.86 6.76 12.55-5.38 2.29-9.16 7.63-9.16 13.85 0 4.51 1.99 8.55 5.14 11.31-3.26 2.24-5.4 5.99-5.4 10.24 0 1.74.36 3.39 1 4.89-.91 1.51-1.44 3.27-1.44 5.16 0 2.18.71 4.2 1.89 5.85-1.02.81-1.69 2.05-1.69 3.46 0 1.52.77 2.87 1.94 3.67-1.22.79-2 2.15-2 3.71 0 .28.03.56.08.83-1 .81-1.68 2.04-1.68 3.45 0 1.84 1.12 3.41 2.71 4.09l131.7-121.6c.26-.74.41-1.53.41-2.36 0-3.9-3.16-7-7-7-1.21 0-2.35.31-3.34.84-1.22-4.19-5.09-7.25-9.67-7.25-1.98 0-3.81.58-5.37 1.56.02-.26.04-.51.04-.77 0-6.87-5.57-12.44-12.44-12.44-1.61 0-3.14.32-4.55.88-.18-3.74-3.25-6.72-7-6.72-3.9 0-7 3.16-7 7.1 0 .3.02.6.06.89-1.77-2.88-4.95-4.81-8.58-4.81-.58 0-1.14.06-1.69.15-.08-6.8-5.61-12.29-12.43-12.29-.7 0-1.37.07-2.04.18-.33-3.58-3.35-6.38-7-6.38-3.04 0-5.62 1.92-6.62 4.61-.31-.02-.62-.04-.94-.04-1.42 0-2.79.21-4.09.57-1.21-3.19-4.29-5.47-7.91-5.47zm-28.2 27.73c-2.81 0-5.08 2.28-5.08 5.08 0 1.52.68 2.86 1.73 3.79-1.36 1.28-2.21 3.1-2.21 5.12 0 3.89 3.16 7 7.1 7 3.9 0 7.1-3.16 7.1-7 0-2.86-1.7-5.31-4.15-6.42.42-.74.68-1.58.68-2.49 0-2.8-2.27-5.08-5.07-5.08"/>'],
    GHS09: ["0 0 735 735", '<path d="m367.5 727.4l360-360-360-360-360 360z" fill="#f00"/><path d="m367.5 670.3-302.8-302.8l302.8-302.8 302.8 302.8z" fill="#fff"/><g stroke="#000" stroke-width="5"><path d="m223.7 367.2h281.2"/><path stroke-width="4" d="m462.7 418 32.98 23.79-31.36 15.1 42.2 3.79-11.36 15.1h23.3l.54 16.76-294.2-1.605s49.2-14.58 57.3-8.635c10.82-4.87 89.8-38.4 89.8-36.2m-75.72-25.98 1.62-85.4-42.72-23.2s-6.49-4.33-15.68-1.62c-3.25 1.08-7.57 2.16-7.57 2.16s23.3-19.47 27.58-17.84c4.33 1.62 34.61 16.22 34.61 16.22s-3.25-22.71-11.36-29.2-39.47-31.36-39.47-31.36v-5.95l42.72 25.96s1.62-24.87-7-39.47c-8.65-14.6-15.1-27.58-15.1-27.58l2.7-2.16 21.1 32.44 7-22.2 4.33-1.08s-5.41 31.36-1.62 41.1c3.79 9.73 17.84 62.73 17.84 62.73l21.1-30.3s.54-12.44-.54-21.1c-1.08-8.65-2.7-48.67-2.7-48.67h3.79l5.95 43.8 34.1-39.47v4.33s-33.51 42.2-31.89 51.4c1.62 9.19 3.24 14.6-2.7 27.58s-9.73 22.2-9.73 22.2 17.84-21.1 25.96-22.71c8.11-.54 18.91.54 26.48-5.95s25.96-27 25.96-27l-28.66 44.3s-13.51.54-18.91 6.49c-5.41 5.95-27.58 31.36-27.58 31.36v58.4l36.76 18.38-44.87 6.49-10.82 15.68-14.6-12.44-40.62 3.735z"/><path fill="#fff" d="m355.2 445.1c10.29-4.29 27-11.36 36.76-25.42 10.1-14.54 45.96-75.7 95.2-70.8-2.7 6.49-11.36 20.55-11.36 20.55l35.1-10.82s.54 46.5-65.97 76.2c-30.82 10.82-37.3 11.36-40 15.1-2.7 3.79-15.1 22.71-15.1 22.71l-55.14-24.3s14.06-.515 20.51-3.215z"/></g><ellipse cy="385.8" cx="484.3" rx="5.95" ry="5.13"/>']
  };

  function ghsIcon(code) {
    var g = GHS[code];
    return g ? '<svg class="cl-ghs" viewBox="' + g[0] + '" aria-hidden="true" focusable="false">' + g[1] + "</svg>" : "";
  }

  // Die Kennzeichnung eines Stoffs aus dem Regal als HTML: Piktogramme, beim Wort „signal“ auch das Signalwort. Ohne Gefahr: leer
  function ghsLabel(id, lang, signal) {
    var h, words;
    try { h = L.hazards(id); } catch (e) { return ""; }
    if (!h.pictograms.length && !h.signal) return "";
    words = (h.signal ? text("ghs." + h.signal, lang) + ": " : "") + h.pictograms.map(function (code) { return text("ghs." + code, lang); }).join(", ");
    return '<span class="cl-ghs-row" role="img" aria-label="' + esc(words) + '" title="' + esc(words) + '">' + h.pictograms.map(ghsIcon).join("") +
      (signal && h.signal ? '<span class="cl-signal" aria-hidden="true">' + esc(text("ghs." + h.signal, lang)) + "</span>" : "") + "</span>";
  }

  // Symbol eines Entsorgungsbehälters: der Ausguss, sonst ein Kanister mit dem passenden GHS-Piktogramm
  var BIN_GHS = { acid: "GHS05", heavy: "GHS09", organic: "GHS02" };
  function binIcon(bin) {
    var g = BIN_GHS[bin] && GHS[BIN_GHS[bin]];
    if (bin === "sink") return '<svg class="cl-icon" viewBox="0 0 28 28" aria-hidden="true"><path class="cl-glass" d="M3,15L25,15L22,24L6,24Z"/><path class="cl-rod" d="M18,15L18,6L11,6L11,9" fill="none"/></svg>';
    return '<svg class="cl-icon" viewBox="0 0 28 28" aria-hidden="true"><path class="cl-glass" d="M6,8L22,8L23,26L5,26Z"/><path class="cl-rod" d="M10,8L10,4L18,4L18,8" fill="none"/>' +
      (g ? '<svg x="8" y="12" width="12" height="12" viewBox="' + g[0] + '">' + g[1] + "</svg>"
        : '<circle cx="11" cy="22" r="1.6" class="cl-glass"/><circle cx="15" cy="23" r="1.4" class="cl-glass"/><circle cx="17.5" cy="20.5" r="1.3" class="cl-glass"/>') + "</svg>";
  }

  function icon(id) {
    var def = L.parts[id], r, rgb, body;
    if (def) {
      body = id === "testtube" ? '<path class="cl-glass" d="M9,3L9,22A5,5 0 0 0 19,22L19,3"/>'
        : id === "calorimeter" ? '<path class="cl-foam" d="M3,7L6,27L22,27L25,7L21,7L19,23L9,23L7,7Z"/><path class="cl-foam" d="M2,4L26,4L26,7L2,7Z"/>'
        : id === "jar" ? '<path class="cl-glass" d="M8,3L8,24M20,24L20,3M5,27L8,24L20,24L23,27Z"/>'
        : id === "cylinder" ? '<path class="cl-glass" d="M10,3L10,24M18,24L18,3M6,27L10,24L18,24L22,27Z"/><line class="cl-mark" x1="14" x2="18" y1="9" y2="9"/><line class="cl-mark" x1="14" x2="18" y1="15" y2="15"/>'
        : L.parts[id] && L.parts[id].probe === "pipette" ? '<path class="cl-glass" d="M14,2L14,9M12,9Q8,14 12,19L14,19L14,27M14,19L16,19Q20,14 16,9Z"/><line class="cl-mark" x1="12" x2="16" y1="5" y2="5"/>'
        : id === "funnel" ? '<path class="cl-filter" d="M7,7L21,7L14,16Z"/><path class="cl-glass" d="M3,5L12,17L12,27M16,27L16,17L25,5"/>'
        : id === "beaker" ? '<path class="cl-glass" d="M5,6L5,24Q5,27 8,27L20,27Q23,27 23,24L23,6"/>'
        : id === "dish" ? '<path class="cl-porcelain-edge" d="M3,11Q5,25 11,25L17,25Q23,25 25,11"/>'
        : id === "burner" ? '<rect class="cl-burner" x="7" y="25" width="14" height="3" rx="1"/><rect class="cl-burner" x="12.5" y="13" width="3" height="12"/><path class="cl-flame cl-roaring" d="M10.5,13Q10.5,6 14,2Q17.5,6 17.5,13Z"/>'
        : id === "syringe" ? '<rect class="cl-glass" x="2" y="11" width="17" height="8" rx="1"/><rect class="cl-plunger" x="10" y="12" width="2" height="6"/><line class="cl-rod" x1="12" x2="26" y1="15" y2="15"/><line class="cl-rod" x1="26" x2="26" y1="11" y2="19"/>'
        : id === "splint" ? '<line class="cl-splint" x1="4" y1="27" x2="19" y2="11"/><path class="cl-splint-flame" d="M16,11Q16,5 19.5,1Q23,5 23,11Z"/>'
        : id === "glowsplint" ? '<line class="cl-splint" x1="4" y1="27" x2="20" y2="9"/><circle class="cl-splint-glow" cx="20" cy="9" r="3"/>'
        : id === "paper" ? '<path class="cl-paper" d="M5,26L9,22L24,5L20,9Z"/><path d="M5,26L9,22L14,16L10,20Z" style="fill:#4f7ee0"/>'
        : id === "rod" ? '<line class="cl-rodlet" x1="4" y1="27" x2="23" y2="4"/>'
        : def.electrode ? '<rect class="cl-electrode" x="11" y="5" width="6" height="23" rx="1" fill="' + esc((L.db.species[def.electrode] || {}).color || "#888888") + '"/><circle class="cl-terminal" cx="14" cy="4" r="3"/>'
        : id === "supply" ? '<rect class="cl-device" x="3" y="9" width="22" height="18" rx="2"/><g class="cl-meter"><rect x="6" y="12" width="16" height="7" rx="1"/></g><circle class="cl-terminal cl-plus" cx="9" cy="7" r="2.5"/><circle class="cl-terminal cl-minus" cx="19" cy="7" r="2.5"/>'
        : id === "ammeter" || id === "voltmeter" ? '<rect class="cl-device" x="4" y="7" width="20" height="20" rx="2"/><circle class="cl-knob" cx="14" cy="17" r="7"/><text class="cl-letter" x="14" y="20.5" text-anchor="middle">' + (id === "ammeter" ? "A" : "V") + "</text>"
        : id === "lamp" ? '<circle class="cl-bulb" cx="14" cy="11" r="8" style="fill:#ffe98a"/><rect class="cl-device" x="10" y="18" width="8" height="5"/><rect class="cl-device" x="6" y="23" width="16" height="5" rx="1"/>'
        : id === "bridge" ? '<path class="cl-bridge" d="M7,26L7,12Q7,6 13,6L15,6Q21,6 21,12L21,26"/>'
        : id === "flask" ? '<path class="cl-glass" d="M11.5,2L11.5,10A8,8 0 1 0 16.5,10L16.5,2"/>'
        : id === "reflux" ? '<rect class="cl-jacket" x="9" y="5" width="10" height="16"/><path class="cl-glass" d="M12,1L12,27M16,1L16,27"/>'
        : id === "manometer" ? '<path class="cl-stopper" d="M9,22L19,22L18,28L10,28Z"/><line class="cl-rod" x1="14" y1="22" x2="14" y2="15"/><circle class="cl-device" cx="14" cy="9" r="7"/><line class="cl-mark" x1="14" y1="9" x2="18" y2="6"/>'
        : id === "stopper" ? '<path class="cl-stopper" d="M7,10L21,10L19,22L9,22Z"/>'
        : id === "centrifuge" ? '<rect class="cl-device" x="2" y="15" width="24" height="12" rx="3"/><path class="cl-glass" d="M12,15L12,3L16,3L16,15"/><circle class="cl-knob" cx="8" cy="21" r="3.5"/>'
        : id === "balance" ? '<rect class="cl-scale" x="2" y="16" width="24" height="10" rx="2"/><rect class="cl-scale-pan" x="5" y="13" width="18" height="2.5"/><g class="cl-meter"><rect x="8" y="18" width="12" height="6" rx="1"/></g>'
        : id === "tube" ? '<path class="cl-stopper" d="M2,13L10,13L9,18L3,18Z"/><path class="cl-glass" d="M6,13L6,5Q6,3 8,3L20,3Q22,3 22,5L22,27"/>'
        : id === "condenser" ? '<path class="cl-jacket" d="M6,7L22,15L19.5,20L3.5,12Z"/><path class="cl-glass" d="M2,6L25,18L25,27"/>'
        : id === "conductometer" ? '<rect class="cl-probe" x="5" y="8" width="4" height="19" rx="2"/><g class="cl-meter"><rect x="11" y="4" width="16" height="11" rx="2"/><text x="19" y="12.5" text-anchor="middle" style="font-size:6px">mS</text></g>'
        : id === "bath" ? '<rect class="cl-bath-water" x="4" y="15" width="20" height="11"/><path class="cl-glass" d="M3,9L3,25Q3,27 5,27L23,27Q25,27 25,25L25,9"/><path class="cl-glass" d="M11,3L11,19A3,3 0 0 0 17,19L17,3"/>'
        : id === "photometer" ? '<rect class="cl-probe" x="5" y="8" width="4" height="19" rx="2"/><circle class="cl-light" cx="7" cy="25" r="2.6" fill="rgb(70, 220, 90)"/><g class="cl-meter"><rect x="11" y="4" width="16" height="11" rx="2"/><text x="19" y="12.5" text-anchor="middle" style="font-size:8px">λ</text></g>'
        : id === "burette" ? '<rect class="cl-glass" x="11.5" y="2" width="5" height="19" rx="1"/><rect class="cl-cock" x="10" y="21" width="8" height="4" rx="1"/><path class="cl-glass" d="M14,25L14,29"/>'
        : id === "separator" ? '<path class="cl-glass" d="M13,20L5,5Q14,1 23,5L15,20Z"/><rect class="cl-cock" x="10" y="20" width="8" height="4" rx="1"/><path class="cl-glass" d="M14,24L14,29"/>'
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
  L.ghsIcon = ghsIcon;
  L.binIcon = binIcon;
  L.ghsLabel = ghsLabel;
  L.liquidColor = liquidColor;
  // Maße der Zeichnungen in Bildpunkten, für die 3D-Ansicht: dort sind 16 Bildpunkte 1 cm
  L.shapes = { tube: TUBE, beaker: BEAKER, dish: DISH, dishHalf: dishHalf, burette: BURETTE, buretteAt: buretteAt, separator: SEP, separatorAt: separatorAt, cylinder: CYL, cylFoot: CYL_FOOT, funnel: FUNNEL, funnelAt: funnelAt, flask: FLASK, volflask: VF, reflux: REFLUX, pipeRise: PIPE_RISE };
})(typeof globalThis !== "undefined" ? globalThis : this);
