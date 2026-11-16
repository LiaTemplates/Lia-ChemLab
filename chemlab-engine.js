/* ChemLab – Rechenkern.
   Fasst kein DOM an und läuft deshalb im Browser und in Node.
   Einheiten: Stoffmengen in mol, Temperaturen in °C, Flüssigkeit in mL (innen L), Energie in J,
   Bildungsenthalpien in kJ/mol, Zeit in s. */
(function (global) {
  "use strict";

  var L = (global.LiaChemLab = global.LiaChemLab || {});

  var R = 8.314462618;        // J/(mol K)
  var KELVIN = 273.15;
  var T_REF = 25;             // Bezugstemperatur der Stoffdaten in °C
  var TICKS = 20;             // Rechenschritte je simulierter Sekunde
  var DT = 1 / TICKS;
  var DROP = 0.05;            // mL je Tropfen
  var WATER = "H2O(l)";
  var STEAM = "H2O(g)";
  var PROTON = "H+(aq)";
  var HYDROXIDE = "OH-(aq)";
  var BOIL = 100;             // °C
  var VAPOR = 40650;          // J/mol, Verdampfungswärme des Wassers
  var LN10 = Math.LN10;
  var P_AIR = 1;              // bar, Luftdruck
  var AIR = { "O2(g)": 0.21 };   // was die Luft liefert, als Anteil
  // Heiße Stellen an Feststoffen: Wärmeübergang an Wasser und an Luft in W/(cm² K), geschätzt; Abstrahlung mit Emissionsgrad 0,8
  var H_WET = 0.35, H_DRY = 0.002, RADIATE = 0.8 * 5.670e-12;
  var GLOW = 525;                 // °C: ab hier glüht ein Körper sichtbar (Draper-Punkt)
  var H2_IGNITE = 560;            // °C: Zündtemperatur von Wasserstoff in Luft (GESTIS-Stoffdatenbank)
  var SPATTER = 30;               // W/cm²: so viel Reaktionswärme an geschmolzenem Metall, dass es spritzt (geschätzt)
  var POP = 1.5;                  // bar: so viel hält ein Gummistopfen (geschätzt)
  var CRACK = 200;                // °C: trifft kalte Flüssigkeit auf ein heißeres Glas, zerspringt es (geschätzt)
  var HOT_MAX = 1500;             // °C: heißer wird ein Stück im Wasser hier nicht (das Metall verdampft oder zerspritzt vorher)
  var ZONE_SINK = 10;             // eine schwerere Zugabe sinkt durch und mischt sich mit zehnmal so viel vom Inhalt wie eine leichtere (geschätzt)
  var SPLASH_OVER = 5;            // K: so weit über dem Siedepunkt muss die Mischzone sein, damit es spritzt
  var LYE = 50;                   // L/mol: wie stark Lauge (OH⁻) das Aufnehmen eines Gases aus einer Blase beschleunigt (geschätzt)
  var FIZZ = 1.5;             // s: so schnell perlt aus, was über dem Luftdruck gelöst ist
  var CRUST = 25;             // mol/L: dichter wird eine Lösung nicht, dann ist sie eingedampft
  var SMELL = 0.005;          // bar: ab diesem Druck riecht man ein Gas
  var SHATTER = 800;          // J: eine Explosion mit so viel Energie zerstört das Gefäß
  var SPARE = 1e-14;          // mol: mit weniger läuft eine sofortige Reaktion nicht mehr an
  var SLOW = 1e-7;            // mol/s: was langsamer Gas entwickelt, zeigt keine Blasen
  var FADE = 10;              // s: so lange nach der letzten merklichen Änderung der Farbe gilt eine Lösung noch als in Bewegung
  var SHADES = [400, 470, 540, 610, 680];      // nm: an diesen Stellen des Spektrums wird die Farbe dafür verfolgt
  var DRIFT = 0.001;          // um so viel muss sich die Extinktion (über 1 cm) ändern, damit es als Änderung zählt
  var DARK = 4;               // über dieser Extinktion kommt kein Licht mehr durch: was sich dort ändert, sieht und misst niemand
  var REST = 1e-9;            // mol/s: was langsamer abläuft, sieht man nicht (Blasen zeigt die Fläche ab 1e-7); damit gilt ein Gefäß als in Ruhe
  var OVER = 1 + 1e-6;        // um diesen Faktor über dem Luftdruck beginnt ein gelöstes Gas auszuperlen
  var TRACE = 1e-30;          // mol: weniger als ein Teilchen; ein solcher Rest eines Ausgangsstoffs gilt als verbraucht
  var FARADAY = 96485.33212;  // C/mol
  var ELECTRON = "e-";
  // Leitfähigkeit nach Nernst und Einstein: S/cm je (mol/L · Ladung² · Diffusionskoeffizient in 10⁻⁹ m²/s), bei 25 °C
  var LAMBDA = FARADAY * FARADAY / (R * (T_REF + KELVIN)) * 1e-8;

  function fail(code, detail) {
    var error = new Error(code + (detail ? ": " + detail : ""));
    error.code = code;
    error.detail = detail || "";
    return error;
  }

  // ------------------------------------------------------------------ Formeln

  // Standard-Atommassen (IUPAC, gekürzt)
  var MASS = {
    H: 1.008, He: 4.0026, Li: 6.94, Be: 9.0122, B: 10.81, C: 12.011, N: 14.007, O: 15.999, F: 18.998, Ne: 20.180,
    Na: 22.990, Mg: 24.305, Al: 26.982, Si: 28.085, P: 30.974, S: 32.06, Cl: 35.45, Ar: 39.95, K: 39.098, Ca: 40.078,
    Sc: 44.956, Ti: 47.867, V: 50.942, Cr: 51.996, Mn: 54.938, Fe: 55.845, Co: 58.933, Ni: 58.693, Cu: 63.546, Zn: 65.38,
    Ga: 69.723, Ge: 72.630, As: 74.922, Se: 78.971, Br: 79.904, Kr: 83.798, Rb: 85.468, Sr: 87.62, Y: 88.906, Zr: 91.224,
    Nb: 92.906, Mo: 95.95, Ru: 101.07, Rh: 102.91, Pd: 106.42, Ag: 107.87, Cd: 112.41, In: 114.82, Sn: 118.71, Sb: 121.76,
    Te: 127.60, I: 126.90, Xe: 131.29, Cs: 132.91, Ba: 137.33, La: 138.91, Ce: 140.12, W: 183.84, Pt: 195.08, Au: 196.97,
    Hg: 200.59, Pb: 207.2, Bi: 208.98, U: 238.03
  };

  var parsed = {};

  function atomsOf(body, id) {
    var total = {};
    if (!body) throw fail("formula", id);
    body.split(/[*·]/).forEach(function (part, index) {
      var times = 1, lead = index > 0 ? /^\d+/.exec(part) : null, pos = 0;
      if (lead) { times = +lead[0]; part = part.slice(lead[0].length); }
      if (!part) throw fail("formula", id);
      function count() {
        var digits = /^\d+/.exec(part.slice(pos));
        if (!digits) return 1;
        pos += digits[0].length;
        return +digits[0];
      }
      function into(target, source, factor) {
        for (var el in source) target[el] = (target[el] || 0) + source[el] * factor;
      }
      function group(depth) {
        var acc = {}, inner, element;
        while (pos < part.length) {
          if (part[pos] === "(") {
            pos++;
            inner = group(depth + 1);
            if (part[pos] !== ")") throw fail("formula", id);
            pos++;
            into(acc, inner, count());
          } else if (part[pos] === ")") {
            if (!depth) throw fail("formula", id);
            break;
          } else {
            element = /^[A-Z][a-z]?/.exec(part.slice(pos));
            if (!element) throw fail("formula", id);
            if (!MASS[element[0]]) throw fail("element", element[0]);
            pos += element[0].length;
            acc[element[0]] = (acc[element[0]] || 0) + count();
          }
        }
        return acc;
      }
      into(total, group(0), times);
    });
    return total;
  }

  // "Mg^2+(aq)" → Formel, Ladung, Phase, Atome, molare Masse.
  // Ladung: "+" oder "-" am Ende heißt einfach geladen, mehrfach als "^2+" (oder wie bei PHREEQC "+2").
  function parse(id) {
    if (parsed[id]) return parsed[id];
    var text = String(id).trim(), match, body, charge = 0, atoms, M = 0, el;
    if (text === "e-") return (parsed[id] = { id: id, body: "e", phase: "", charge: -1, atoms: {}, M: 0 });
    match = /\((s|l|g|aq)\)$/.exec(text);
    if (!match) throw fail("phase", String(id));
    body = text.slice(0, match.index);
    var phase = match[1];
    if ((match = /\^(\d*)([+-])$/.exec(body))) charge = (match[1] ? +match[1] : 1) * (match[2] === "+" ? 1 : -1);
    else if ((match = /([+-])(\d+)$/.exec(body))) charge = +match[2] * (match[1] === "+" ? 1 : -1);
    else if ((match = /([+-])$/.exec(body))) charge = match[1] === "+" ? 1 : -1;
    if (match) body = body.slice(0, match.index);
    atoms = atomsOf(body, String(id));
    for (el in atoms) M += atoms[el] * MASS[el];
    return (parsed[id] = { id: id, body: body, phase: phase, charge: charge, atoms: atoms, M: M });
  }

  var SUB = "₀₁₂₃₄₅₆₇₈₉", SUP = "⁰¹²³⁴⁵⁶⁷⁸⁹";

  // Zerlegt "CuSO4*5H2O" in Stücke; Ziffern nach einem Element werden tiefgestellt
  function pieces(body) {
    var out = [];
    body.split(/[*·]/).forEach(function (part, index) {
      var lead = index > 0 ? (/^\d+/.exec(part) || [""])[0] : "";
      if (index > 0) out.push({ text: "·" + lead });
      part.slice(lead.length).replace(/(\d+)|(\D+)/g, function (all, digits, other) {
        out.push(digits ? { text: digits, low: true } : { text: other });
        return all;
      });
    });
    return out;
  }

  // Große Moleküle (Indikatoren) dürfen in den Daten ein Kurzzeichen tragen: "symbol": "HInd"
  function shown(p) {
    var s = L.db.species[p.id];
    return s && s.symbol ? [{ text: String(s.symbol).replace(/[<>&"]/g, "") }] : pieces(p.body);
  }

  function formulaText(id) {
    var p = parse(id);
    var text = shown(p).map(function (x) {
      return x.low ? x.text.replace(/\d/g, function (d) { return SUB[d]; }) : x.text;
    }).join("");
    if (p.charge) {
      if (Math.abs(p.charge) > 1) text += String(Math.abs(p.charge)).replace(/\d/g, function (d) { return SUP[d]; });
      text += p.charge > 0 ? "⁺" : "⁻";
    }
    return text;
  }

  function formulaHtml(id, withPhase) {
    var p = parse(id);
    var html = shown(p).map(function (x) { return x.low ? "<sub>" + x.text + "</sub>" : x.text; }).join("");
    if (p.charge) html += "<sup>" + (Math.abs(p.charge) > 1 ? Math.abs(p.charge) : "") + (p.charge > 0 ? "+" : "−") + "</sup>";
    if (withPhase && p.phase) html += "<small>(" + p.phase + ")</small>";
    return html;
  }

  // ------------------------------------------------------------------ Gleichungen

  // "Mg(s) + 2 H+(aq) -> Mg^2+(aq) + H2(g)"; "<=>" für Gleichgewichte.
  // Prüft Atom- und Ladungsbilanz und nennt, was nicht aufgeht.
  function equation(text) {
    var source = String(text).trim();
    var arrow = /\s*(<=>|⇌|->|→)\s*/.exec(source);
    if (!arrow) throw fail("equation", source);
    var sides = [source.slice(0, arrow.index), source.slice(arrow.index + arrow[0].length)].map(function (side) {
      return side.split(/\s+\+\s+/).map(function (term) {
        var match = /^(\d+(?:[.,]\d+)?)?\s*(\S.*)$/.exec(term.trim());
        if (!match) throw fail("equation", source);
        parse(match[2]);
        return { id: match[2], n: match[1] ? parseFloat(match[1].replace(",", ".")) : 1 };
      });
    });
    var nu = {}, sum = [{}, {}], wrong = [], key;
    sides.forEach(function (side, index) {
      side.forEach(function (term) {
        var p = parse(term.id), el;
        nu[term.id] = (nu[term.id] || 0) + (index ? term.n : -term.n);
        for (el in p.atoms) sum[index][el] = (sum[index][el] || 0) + p.atoms[el] * term.n;
        sum[index]["±"] = (sum[index]["±"] || 0) + p.charge * term.n;
      });
    });
    for (key in nu) if (Math.abs(nu[key]) < 1e-12) delete nu[key];
    Object.keys(Object.assign({}, sum[0], sum[1])).forEach(function (el) {
      var a = sum[0][el] || 0, b = sum[1][el] || 0;
      if (Math.abs(a - b) > 1e-9) wrong.push(el + " " + a + " ≠ " + b);
    });
    if (wrong.length) throw fail("balance", source + " – " + wrong.join(", "));
    return { text: source, left: sides[0], right: sides[1], nu: nu, reversible: arrow[1] === "<=>" || arrow[1] === "⇌" };
  }

  function sideText(terms) {
    return terms.map(function (t) { return (t.n === 1 ? "" : t.n + " ") + t.id; }).join(" + ");
  }

  // Reaktionsenthalpie in kJ/mol nach Hess; null, wenn ein Wert fehlt
  function enthalpy(eq) {
    var e = typeof eq === "string" ? equation(eq) : eq, total = 0, id, s;
    for (id in e.nu) {
      s = L.db.species[id];
      if (!s || typeof s.Hf !== "number") return null;
      total += e.nu[id] * s.Hf;
    }
    return total;
  }

  // ------------------------------------------------------------------ Daten

  // couples: Redoxpaare; derived: die Reaktionen, die aus je zwei Redoxpaaren folgen; pairs: dieselben, nach den beiden Paaren abgelegt
  L.db = L.db || { species: {}, equilibria: [], reactions: [], reagents: {}, couples: [], derived: [], pairs: {}, metals: {}, carriers: {}, version: 0 };
  var systems = {};

  var CP = { aq: 0, g: 29, l: 75 };

  function entry(id, data) {
    var p = parse(id), atoms = 0, el;
    for (el in p.atoms) atoms += p.atoms[el];
    // Was aus der Formel folgt (Masse, Ladung, Phase), steht zuletzt und lässt sich in den Daten nicht überschreiben
    return Object.assign({ cp: p.phase === "s" ? 25 * atoms : CP[p.phase], rho: p.phase === "s" ? 2 : 1 }, data, p);
  }

  // Schlüssel einer Gleichung, unabhängig von Schreibweise und Reihenfolge der Stoffe
  function keyOf(eq) {
    return Object.keys(eq.nu).sort().map(function (id) { return id + ":" + eq.nu[id]; }).join("|") + (eq.reversible ? "<=>" : "->");
  }

  // Trägt ein. Was schon da ist, bleibt: derselbe Inhalt noch einmal ist in Ordnung, ein anderer ein Fehler.
  // So kann der Aufbau einer Folie nicht die Stoffe verändern, mit denen eine andere gerade rechnet.
  function put(store, key, item, raw, label) {
    var same = JSON.stringify(raw), old;
    if (Array.isArray(store)) old = store.filter(function (x) { return x.key === key; })[0]; else old = store[key];
    if (old) {
      if (old.raw !== same) throw fail("exists", label);
      return;
    }
    item.raw = same;
    if (Array.isArray(store)) store.push(item); else store[key] = item;
  }

  // Nimmt ein Paket auf: { species, equilibria, reactions, reagents }. Ganz oder gar nicht.
  function register(pack) {
    var db = L.db, problems = [];
    var next = {
      species: Object.assign({}, db.species), equilibria: db.equilibria.slice(),
      reactions: db.reactions.slice(), reagents: Object.assign({}, db.reagents), couples: db.couples.slice(), version: db.version + 1
    };
    function attempt(label, work) {
      try { work(); } catch (error) { problems.push(label + " (" + error.message + ")"); }
    }
    function known(id) { if (!next.species[id]) throw fail("species", id); }

    pack = pack || {};
    Object.keys(pack.species || {}).forEach(function (id) {
      attempt(id, function () {
        ["color", "flame"].forEach(function (key) {           // Farbe des Stoffs, Farbe seiner Flamme
          var color = pack.species[id] && pack.species[id][key];
          if (color != null && !/^#[0-9a-f]{6}$/i.test(color)) throw fail("color", String(color));
        });
        // gamma: Ionengröße in Å und Zusatzglied für den Aktivitätskoeffizienten eines gelösten Teilchens (reales Modell)
        // Vm: Eigenvolumen eines gelösten Stoffs in mL/mol; Tb, Hvap: Siedepunkt in °C und Verdampfungsenthalpie in kJ/mol eines
        // flüchtigen gelösten Stoffs; mix: Van-Laar-Konstanten mit Wasser [A Stoff, A Wasser]; smell: true (stechend) oder "fruity"
        var data = pack.species[id] || {}, phase = parse(id).phase;
        if (data.Vm != null && !(phase === "aq" && typeof data.Vm === "number" && data.Vm > 0 && data.Vm < 1000)) throw fail("species", id + " Vm");
        if ((data.Tb != null || data.Hvap != null) && !(phase === "aq" && typeof data.Tb === "number" && isFinite(data.Tb) && typeof data.Hvap === "number" && data.Hvap > 0))
          throw fail("species", id + " Tb/Hvap");
        if (data.mix != null && !(data.Tb != null && Array.isArray(data.mix) && data.mix.length === 2 &&
          data.mix.every(function (a) { return typeof a === "number" && a >= 0 && a < 20; }))) throw fail("species", id + " mix");
        if (data.smell != null && data.smell !== true && data.smell !== "fruity") throw fail("species", id + " smell");
        var gamma = pack.species[id] && pack.species[id].gamma;
        if (gamma != null && !(parse(id).phase === "aq" && Array.isArray(gamma) && gamma.length === 2 &&
          gamma.every(function (value) { return typeof value === "number" && isFinite(value); }) &&
          gamma[0] >= 0 && gamma[0] <= 20 && Math.abs(gamma[1]) <= 1)) throw fail("gamma", id);       // Größe 0 bis 20 Å, Zusatzglied bis ±1
        put(next.species, id, entry(id, pack.species[id]), pack.species[id], id);
      });
    });
    (pack.equilibria || []).forEach(function (item) {
      attempt(String(item && item.eq), function () {
        var eq = equation(item.eq);
        Object.keys(eq.nu).forEach(known);
        if (typeof item.logK !== "number") throw fail("logK");
        // model: "real" – das Gleichgewicht gilt nur im realen Modell (schwache Ionenpaare, die zu dessen Parametern gehören)
        if (item.model != null && item.model !== "real") throw fail("model", String(item.model));
        var ids = Object.keys(eq.nu), entry = Object.assign({}, item, eq, { key: keyOf(eq), rate: null });
        var solids = ids.filter(function (id) { return next.species[id].phase === "s"; });
        var rest = ids.filter(function (id) { return id !== WATER && next.species[id].phase !== "aq" && next.species[id].phase !== "s"; });
        entry.aq = !solids.length && !rest.length;
        if (item.model != null && !entry.aq) throw fail("model", String(item.eq));      // nur ein Gleichgewicht in der Lösung kann einem Modell vorbehalten sein
        if (solids.length === 1 && !rest.length) {
          // Löslichkeit eines Feststoffs. d: was beim Lösen von 1 mol an gelösten Teilchen entsteht (+) oder verbraucht wird (−);
          // f rechnet den Umsatz der Auflösung in den der eingetragenen Schreibweise um.
          entry.solid = solids[0];
          // rate: Geschwindigkeitsgesetz, nach dem sich ein Stück dieses Feststoffs aus dem Regal löst: k in mol/(s cm²) je (mol/L) hoch
          // Ordnung, Ea in kJ/mol. Ohne Angabe löst es sich mit einer festen Zeitkonstante.
          if (item.rate) {
            if (!(item.rate.k > 0)) throw fail("rate");
            Object.keys(item.rate.order || {}).forEach(function (id) {
              known(id);
              if (next.species[id].phase !== "aq" || typeof item.rate.order[id] !== "number" || !isFinite(item.rate.order[id])) throw fail("rate", id);
            });
            entry.rate = { k: +item.rate.k, Ea: +item.rate.Ea || 0, order: Object.assign({}, item.rate.order) };
          }
          entry.f = -1 / eq.nu[solids[0]];
          entry.d = {};
          ids.forEach(function (id) { if (id !== WATER && id !== solids[0]) entry.d[id] = eq.nu[id] * entry.f; });
        } else if (!solids.length && rest.length === 1 && next.species[rest[0]].phase === "g") {
          // Löslichkeit eines Gases, mit d und f wie beim Feststoff. Gerechnet wird nur, wenn beim Lösen nichts verbraucht wird.
          entry.f = -1 / eq.nu[rest[0]];
          entry.d = {};
          ids.forEach(function (id) { if (id !== WATER && id !== rest[0]) entry.d[id] = eq.nu[id] * entry.f; });
          if (Object.keys(entry.d).every(function (id) { return entry.d[id] > 0; })) entry.gas = rest[0];
        }
        if (item.rate && !entry.rate) throw fail("rate");          // ein Geschwindigkeitsgesetz gibt es nur für die Auflösung eines Feststoffs
        put(next.equilibria, entry.key, entry, item, eq.text);
      });
    });
    (pack.reactions || []).forEach(function (item) {
      attempt(String(item && item.eq), function () {
        var eq = equation(item.eq), rate = item.rate || {};
        Object.keys(eq.nu).forEach(known);
        var fire = item.fire || {};
        // spark: Zündgrenzen eines Gasgemischs; eine solche Reaktion läuft nur, wenn eine Flamme sie zündet
        // fast: die Reaktion läuft sofort ab, bis einer ihrer Ausgangsstoffe verbraucht ist (Iod mit Thiosulfat); sie braucht kein k
        if (item.spark ? !(item.spark[0] >= 0 && item.spark[1] > item.spark[0] && item.spark[1] <= 1) : !(rate.k > 0) && !rate.fast) throw fail("rate");
        // logK: eine sofortige Reaktion läuft nur bis zu ihrem Gleichgewicht (Eisen(III) mit Iodid); ohne die Angabe läuft sie vollständig ab
        if (item.logK != null && (!rate.fast || typeof item.logK !== "number" || !isFinite(item.logK))) throw fail("rate", "logK");
        [fire.color, fire.smoke].forEach(function (color) {
          if (color != null && !/^#[0-9a-f]{6}$/i.test(color)) throw fail("color", String(color));
        });
        Object.keys(rate.order || {}).forEach(function (id) {       // die Ordnung gilt gelösten Teilchen und ist eine Zahl
          known(id);
          if ((next.species[id].phase !== "aq" && id !== WATER) || typeof rate.order[id] !== "number" || !isFinite(rate.order[id])) throw fail("rate", id);
        });
        if (rate.surface) known(rate.surface);
        // needs: was da sein muss, ohne verbraucht zu werden (nur bei sofortigen Reaktionen)
        Object.keys(rate.needs || {}).forEach(function (id) {
          known(id);
          if (!rate.fast || typeof rate.needs[id] !== "number" || !(rate.needs[id] > 0) || id in eq.nu) throw fail("rate", id);
        });
        if (rate.bound != null && (!rate.needs || !Array.isArray(rate.bound))) throw fail("rate", "bound");
        (rate.bound || []).forEach(known);
        // Katalysatoren: was die Geschwindigkeit bestimmt, in der Gleichung aber nicht vorkommt. Dieselbe Gleichung darf mit
        // verschiedenen Katalysatoren mehrfach eingetragen sein; jeder Weg läuft und zählt für sich.
        var cats = Object.keys(rate.order || {}).concat(rate.surface ? [rate.surface] : []).filter(function (id, index, list) {
          return !(id in eq.nu) && list.indexOf(id) === index;
        }).sort();
        var key = keyOf(eq) + (cats.length ? " [" + cats.join(", ") + "]" : "");
        put(next.reactions, key, Object.assign({}, item, eq, {
          key: key, catalysts: cats,
          // ignite: Zündtemperatur in °C, danach brennt es von selbst weiter; dry: läuft nur ohne Flüssigkeit
          rate: {
            k: +rate.k || 0, Ea: +rate.Ea || 0, order: Object.assign({}, rate.order), surface: rate.surface || null,
            ignite: typeof rate.ignite === "number" ? rate.ignite : null, dry: !!rate.dry, fast: !!rate.fast,
            needs: rate.needs ? Object.assign({}, rate.needs) : null, bound: rate.bound ? rate.bound.slice() : null
          }
        }), item, eq.text);
      });
    });
    (pack.couples || []).forEach(function (item) {
      attempt(String(item && item.eq), function () {
        // Redoxpaar: "Cu^2+(aq) + 2 e- <=> Cu(s)". Die Seite mit den Elektronen ist die oxidierte Form; E0 gilt für die Reduktion.
        var eq = equation(item.eq), n = -(eq.nu[ELECTRON] || 0), back = n < 0, nu = {}, over = { default: 0 }, id, ox, red;
        if (!n) throw fail("couple");
        function side(terms) { return terms.filter(function (t) { return t.id !== ELECTRON; }); }
        ox = side(back ? eq.right : eq.left); red = side(back ? eq.left : eq.right);
        ox.concat(red).forEach(function (t) { known(t.id); });
        if (typeof item.E0 !== "number" || !isFinite(item.E0)) throw fail("E0");
        // over: Überspannung in V bei 1 mA/cm², eine Zahl für jede Oberfläche oder { default, "Zn(s)": … } je Material
        if (typeof item.over === "number") over.default = item.over;
        else if (item.over && typeof item.over === "object") {
          for (id in item.over) { if (id !== "default") known(id); over[id] = item.over[id]; }
        } else if (item.over != null) throw fail("over");
        for (id in over) if (typeof over[id] !== "number" || !(over[id] >= 0)) throw fail("over", id);
        for (id in eq.nu) if (id !== ELECTRON) nu[id] = back ? -eq.nu[id] : eq.nu[id];
        n = Math.abs(n);
        // same: Paare, die dasselbe Metall in dieselbe Oxidationsstufe überführen (Zink zu Zn²⁺ oder zu Zinkat, Silber zu Ag⁺ oder zu
        // Silberchlorid), sind ein und dasselbe Redoxsystem auf verschiedenen Wegen
        var metal = red.filter(function (t) { return next.species[t.id].phase === "s"; });
        put(next.couples, keyOf({ nu: nu, reversible: true }), {
          key: keyOf({ nu: nu, reversible: true }), n: n, ox: ox, red: red, E0: item.E0, over: over, src: item.src,
          same: metal.length === 1 ? metal[0].id + " " + n / metal[0].n : null,
          text: sideText(ox) + " + " + (n === 1 ? "" : n + " ") + ELECTRON + " <=> " + sideText(red)
        }, item, eq.text);
      });
    });
    Object.keys(pack.reagents || {}).forEach(function (id) {
      attempt(id, function () {
        var r = pack.reagents[id];
        var ids = r.solution ? Object.keys(r.solution) : [r.solid || r.liquid];
        if (!ids.length || !ids[0]) throw fail("reagent", id);
        ids.forEach(known);
        if (r.solid && next.species[r.solid].phase !== "s") throw fail("reagent", id);
        var charge = 0, size = 0;
        if (r.solution) ids.forEach(function (sp) { charge += r.solution[sp] * next.species[sp].charge; size += Math.abs(r.solution[sp] * next.species[sp].charge); });
        if (Math.abs(charge) > 1e-9 * Math.max(1, size)) throw fail("charge", id);    // eine Lösung ist elektrisch neutral
        if (r.solution && taken(r.solution, next.species) > 1.0001) throw fail("reagent", id + " Vm");         // die gelösten Stoffe passen in die Flasche
        put(next.reagents, id, Object.assign({ id: id }, r), r, id);
      });
    });
    if (problems.length) throw fail("data", problems.join("; "));
    // Aus je zwei Redoxpaaren folgt eine Reaktion: das eine wird oxidiert, das andere reduziert.
    // Steht dieselbe Reaktion mit eigener Geschwindigkeit im Paket, gilt diese (explicit).
    next.derived = []; next.pairs = {};
    next.couples.forEach(function (a) {
      next.couples.forEach(function (c) {
        var times = a.n * c.n / gcd(a.n, c.n), nu = {}, left = [], right = [], id, eq;
        if (a === c) return;
        function add(terms, sign, factor) { terms.forEach(function (t) { nu[t.id] = (nu[t.id] || 0) + sign * t.n * factor; }); }
        add(a.red, -1, times / a.n); add(a.ox, 1, times / a.n); add(c.ox, -1, times / c.n); add(c.red, 1, times / c.n);
        for (id in nu) {
          if (Math.abs(nu[id]) < 1e-12) delete nu[id];
          else (nu[id] < 0 ? left : right).push({ id: id, n: Math.abs(nu[id]) });
        }
        if (!left.length || !right.length) return;
        eq = { nu: nu, left: left, right: right, reversible: false };
        eq.key = keyOf(eq);
        eq.text = sideText(left) + " -> " + sideText(right);
        eq.times = times;                                        // so viele Elektronen gehen je Formelumsatz über
        eq.E = c.E0 - a.E0;                                      // Spannung, die die Reaktion unter Standardbedingungen treibt
        eq.explicit = next.reactions.some(function (r) { return r.key === eq.key; });
        next.pairs[a.key + ">" + c.key] = eq;
        if (!eq.explicit) next.derived.push(eq);
      });
    });
    // Träger: Was an einer Oberfläche verbraucht wird, kommt auch aus Teilchen nach, die es im Gleichgewicht abgeben:
    // Kupfer-Ionen aus dem Ionenpaar und den Komplexen, H+ aus der schwachen Säure. carriers[X] = [{ id, n: mol X je mol Träger }]
    next.carriers = {};
    next.equilibria.forEach(function (e) {
      if (!e.aq) return;
      [[e.left, e.right], [e.right, e.left]].forEach(function (sides) {
        sides[0].forEach(function (x) {
          var atoms = next.species[x.id].atoms, el;
          if (x.id === WATER) return;
          sides[1].forEach(function (y) {
            if (y.id === WATER) return;
            for (el in atoms) if (!next.species[y.id].atoms[el]) return;        // der Träger enthält, was er abgibt
            (next.carriers[x.id] = next.carriers[x.id] || []).push({ id: y.id, n: x.n / y.n });
          });
        });
      });
    });
    // Metalle: Feststoffe, die als reduzierte Form eines Redoxpaars in Lösung gehen können. Jedes Stück davon ist eine Oberfläche,
    // an der Redoxvorgänge ablaufen. skip: Reduktionen, die an diesem Metall schon eine eingetragene Reaktion beschreibt.
    next.metals = {};
    next.couples.forEach(function (a) {
      a.red.forEach(function (t) {
        var metal;
        if (next.species[t.id].phase !== "s") return;
        metal = next.metals[t.id] = next.metals[t.id] || { skip: {} };
        next.couples.forEach(function (c) {
          var pair = next.pairs[a.key + ">" + c.key];
          if (pair && pair.explicit) metal.skip[c.key] = true;
        });
      });
    });
    L.db = next;
    systems = {};
  }

  function gcd(a, b) { return b ? gcd(b, a % b) : a; }

  // Was an einem Paket fehlt: Quelle, Name (in irgendeiner Sprache), Bildungsenthalpie. Für check.mjs.
  function lint(pack) {
    var out = [];
    Object.keys(pack.species || {}).forEach(function (id) {
      var d = pack.species[id];
      if (!d.src) out.push(id + ": src");
      if (!d.name || !Object.keys(d.name).length) out.push(id + ": name");
      if (!("Hf" in d)) out.push(id + ": Hf");
    });
    (pack.equilibria || []).concat(pack.reactions || []).forEach(function (item) {
      if (!item.src) out.push(item.eq + ": src");
      try {
        Object.keys(equation(item.eq).nu).forEach(function (id) { if (!L.db.species[id]) out.push(item.eq + ": " + id); });
      } catch (error) { out.push(item.eq + ": " + error.message); }
    });
    (pack.couples || []).forEach(function (item) { if (!item.src) out.push(item.eq + ": src"); });
    Object.keys(pack.reagents || {}).forEach(function (id) {
      if (!pack.reagents[id].name || !Object.keys(pack.reagents[id].name).length) out.push(id + ": name");
    });
    return out;
  }

  function species(id) {
    var s = L.db.species[id];
    if (!s) throw fail("species", String(id));
    return s;
  }

  // Vorratsflasche. "HCl 0.5M" verdünnt die Lösung "HCl", die für 1 mol/L eingetragen ist.
  // Welchen Anteil am Volumen die gelösten Stoffe einer Vorratslösung einnehmen (mit ihrem Eigenvolumen Vm); der Rest ist Wasser
  function taken(solution, table) {
    var share = 0, key;
    for (key in solution) share += solution[key] * ((table[key] && table[key].Vm) || 0) / 1000;
    return share;
  }

  function reagent(id) {
    var r = L.db.reagents[id], match, c = 1, key, copy;
    if (r && !r.molar) return r;
    if (!r) {
      match = /^(.+?)\s+(\d+(?:[.,]\d+)?)\s*M$/.exec(String(id));
      r = match && L.db.reagents[match[1]];
      if (!r || !r.molar) throw fail("reagent", String(id));
      c = parseFloat(match[2].replace(",", "."));
    }
    copy = Object.assign({}, r, { id: id, of: r.id, solution: {}, name: {}, c: c });
    for (key in r.solution) copy.solution[key] = r.solution[key] * c;
    for (key in r.name) copy.name[key] = r.name[key] + " " + String(c).replace(".", key === "de" ? "," : ".") + " mol/L";
    if (taken(copy.solution, L.db.species) > 1.0001) throw fail("reagent", String(id));            // konzentrierter, als der reine Stoff ist
    return copy;
  }

  // ------------------------------------------------------------------ GHS-Kennzeichnung

  // Massenanteil des gelösten Stoffs in %: ein Liter Lösung aus den gelösten Teilchen und dem Wasser, das neben ihnen Platz hat
  // per: { species, M }: eingestuft ist nur dieser Stoff (Bleichlauge: das Hypochlorit, nicht das Kochsalz darin)
  function massPercent(r) {
    var solute = 0, key, per = r.ghs && r.ghs.per;
    if (!r.solution) return 100;
    for (key in r.solution) if (key !== WATER) solute += r.solution[key] * L.db.species[key].M;
    if (!(solute > 0)) return 0;
    return 100 * (per ? (r.solution[per.species] || 0) * per.M : solute) / (solute + (1 - taken(r.solution, L.db.species)) * 997);
  }

  // Kennzeichnung eines Stoffs aus dem Regal, gerechnet aus der Einstufung des reinen Stoffs (ghs) nach den Gemisch-Regeln der
  // CLP-Verordnung (EG 1272/2008, Anhang I). ghs, Konzentrationen in Massenprozent:
  //   corr: [hautätzend ab, hautreizend ab, augenschädigend ab, augenreizend ab]   (allgemein 5, 1, 3, 1; sonst die spezifischen Grenzen)
  //   irrit: haut- oder augenreizend (Kat. 2) ab (allgemein 10)
  //   ate: Schätzwert der akuten Toxizität oral in mg/kg; das Gemisch hat ate / Anteil
  //   cmr: [Kategorie 1 oder 2, ab]   stot: [Kategorie 1, 2 oder 3, ab]   sens: hautsensibilisierend ab   resp: atemwegssensibilisierend ab
  //   aq: { acute: M-Faktor (akut 1), chronic: [Kategorie, M] }
  //   met: korrosiv gegenüber Metallen ab (H290; dafür gibt es keine Gemisch-Regel, die Grenze folgt der Praxis der Lieferanten): Ätzsymbol mit „Achtung“
  //   pure: Piktogramme nur des reinen Stoffs (entzündbar, brandfördernd …), pureDanger: mit Signalwort „Gefahr“
  //   fixed: die Piktogramme einer Fertiglösung, wie auf ihrem Etikett, signal: "danger" oder "warning"
  // Zurück: { pictograms: ["GHS05", …], signal: "danger" | "warning" | null }
  function hazards(id) {
    var r = reagent(id), g = r.ghs, pct, pics = {}, why = {}, danger = false, any = false, cat, limit, out;
    if (!g) return { pictograms: [], signal: null };
    if (g.fixed) return { pictograms: g.fixed.slice().sort(), signal: g.signal || null };
    pct = massPercent(r);
    function mark(code, serious, reason) {
      pics[code] = true; any = true;
      if (serious) danger = true;
      if (code === "GHS07") why[reason] = true;
    }
    if (g.corr) {                                              // null: der Stoff ist nicht hautätzend, nur augenschädigend
      if (g.corr[0] != null) { if (pct >= g.corr[0]) mark("GHS05", true); else if (pct >= g.corr[1]) mark("GHS07", false, "skin"); }
      if (pct >= g.corr[2]) mark("GHS05", true); else if (pct >= g.corr[3]) mark("GHS07", false, "skin");
    }
    if (g.irrit != null && pct >= g.irrit) mark("GHS07", false, "skin");
    if (g.met != null && pct >= g.met) mark("GHS05", false);
    if (g.ate != null && pct > 0) {
      limit = g.ate / (pct / 100);
      if (limit <= 300) mark("GHS06", true); else if (limit <= 2000) mark("GHS07", false, "tox");
    }
    if (g.cmr && pct >= g.cmr[1]) mark("GHS08", g.cmr[0] === 1);
    if (g.stot) {
      cat = g.stot[0];
      limit = g.stot[1] != null ? g.stot[1] : cat === 3 ? 20 : 10;
      if (cat === 3) { if (pct >= limit) mark("GHS07", false, "stot"); }
      else if (pct >= limit) mark("GHS08", cat === 1);
      else if (cat === 1 && pct >= 1) mark("GHS08", false);                // STOT 1 zwischen 1 und 10 %: Kategorie 2
    }
    if (g.sens != null && pct >= g.sens) mark("GHS07", false, "sens");
    if (g.resp != null && pct >= g.resp) { mark("GHS08", true); why.resp = true; }
    if (g.aq) {
      if (g.aq.acute && g.aq.acute * pct >= 25) mark("GHS09", false);
      if (g.aq.chronic) {
        cat = g.aq.chronic[0]; limit = g.aq.chronic[1] || 1;
        if (cat === 1 && (limit * pct >= 25 || 10 * limit * pct >= 25)) mark("GHS09", false);
        if (cat === 2 && pct >= 25) mark("GHS09", false);
      }
    }
    if (g.pure && !r.solution) g.pure.forEach(function (code) { mark(code, !!g.pureDanger); });
    // Vorrang (Art. 26): neben dem Totenkopf kein Ausrufezeichen; neben dem Ätzsymbol keins für Reizung; neben dem Symbol
    // für Atemwegssensibilisierung keins für Hautsensibilisierung oder Reizung
    if (pics.GHS06) why = {};
    if (pics.GHS05) delete why.skin;
    if (why.resp) { delete why.sens; delete why.skin; delete why.resp; }
    if (!why.skin && !why.tox && !why.stot && !why.sens) delete pics.GHS07;
    out = Object.keys(pics).sort();
    return { pictograms: out, signal: danger ? "danger" : any ? "warning" : null };
  }

  // ------------------------------------------------------------------ Geräte (nur die Physik; die Zeichnung steht in chemlab-parts.js)

  L.parts = L.parts || {};

  function registerPart(type, def) {
    L.parts[type] = Object.assign(L.parts[type] || {}, def);
    return L.parts[type];
  }

  // cap: Fassungsvermögen in mL, d: Schichtdicke in cm, Cv: Wärmekapazität des Glases in J/K, loss: Wärmeabgabe in W/K
  // heat: Wärmeübergang von einer Brennerflamme in W/K
  registerPart("testtube", { kind: "vessel", cap: 20, d: 1.4, Cv: 17, loss: 0.06, heat: 0.10 });
  // electrodes: in diesem Gefäß haben zwei Elektroden Platz
  registerPart("beaker", {
    kind: "vessel", size: 100, electrodes: true,
    sizes: {
      50: { cap: 50, d: 4.2, Cv: 18, loss: 0.10, heat: 0.14 },
      100: { cap: 100, d: 5.0, Cv: 30, loss: 0.15, heat: 0.20 },
      250: { cap: 250, d: 7.0, Cv: 60, loss: 0.25, heat: 0.26 },
      600: { cap: 600, d: 9.0, Cv: 110, loss: 0.40, heat: 0.32 }
    }
  });
  // Kalorimeter: zwei ineinandergesteckte Styroporbecher mit Deckel, 250 mL (geschätzt: Cv der Becher samt Rührer, Wärmeabgabe
  // etwa ein Zwanzigstel des Becherglases). insulated: es kommt nicht auf Brenner oder Wasserbad
  registerPart("calorimeter", { kind: "vessel", cap: 250, d: 7.0, Cv: 10, mass: 7, loss: 0.012, heat: 0.05, insulated: true });
  // Rundkolben für die Destillation; steht wie das Becherglas auf dem Dreifuß
  registerPart("flask", { kind: "vessel", cap: 100, d: 5.8, Cv: 40, loss: 0.13, heat: 0.22 });
  // Liebigkühler: führt den Dampf aus dem Gefäß "in" in das Gefäß "to" und kühlt ihn dabei auf Raumtemperatur
  registerPart("condenser", { kind: "tool", duct: true, condenser: true });
  // Gasableitungsrohr mit Stopfen: verschließt das Gefäß und leitet, was dort an Gas entsteht, in ein zweites
  registerPart("tube", { kind: "tool", duct: true, pipe: true, stopper: true });
  // Gummistopfen: verschließt das Gefäß ganz; steigt der Druck darin über POP, fliegt er heraus
  registerPart("stopper", { kind: "tool", stopper: true, plug: true });
  // Manometer: ein Stopfen mit Druckanzeige; fliegt heraus wie er
  registerPart("manometer", { kind: "tool", stopper: true, plug: true, sense: "p", unit: "bar", lag: 0.3, fine: 0.002, spread: [0.01, 0, 0.002, 0] });
  // Rückflusskühler: steht aufrecht im Gefäß; der Dampf wird darin wieder flüssig und läuft zurück
  registerPart("reflux", { kind: "tool", reflux: true });
  // dispenser: hängt über einem anderen Gefäß und gibt durch einen Hahn ab
  registerPart("burette", { kind: "vessel", dispenser: true, cap: 50, d: 1.1, Cv: 25, loss: 0.08 });
  // lag: Trägheit in s; sense: was es misst
  // range: Anfang und Ende der Skala; darüber zeigt es deren Ende
  // spread: wie weit die Anzeige streut, wenn der Aufbau es will ("scatter"): [fest, fest relativ, Rauschen, Rauschen relativ],
  // je als größte Abweichung; fest gilt für das Gerät die ganze Zeit, das Rauschen wechselt jede Sekunde (geschätzt nach Schulgeräten)
  registerPart("thermometer", { kind: "tool", lag: 3, unit: "°C", sense: "T", range: [-10, 110], spread: [0.3, 0, 0.05, 0] });
  registerPart("phmeter", { kind: "tool", lag: 1, unit: "pH", sense: "pH", spread: [0.05, 0, 0.01, 0] });
  // fine: so genau (als Anteil des Messwerts) muss die Anzeige stehen, damit das Gerät als abgelesen gilt
  registerPart("conductometer", { kind: "tool", lag: 1, unit: "mS/cm", sense: "kappa", fine: 0.002, spread: [0, 0.02, 0, 0.005] });
  registerPart("dish", { kind: "vessel", cap: 50, d: 2.5, Cv: 45, loss: 0.14, heat: 0.18 });      // Abdampfschale aus Porzellan
  // under: steht unter einem Gefäß; flames: Temperatur der Flamme in °C für aus, leuchtend, rauschend
  registerPart("burner", { kind: "tool", under: true, flames: [0, 600, 1150] });
  registerPart("syringe", { kind: "tool", lag: 0, unit: "mL", sense: "V", cap: 100, stopper: true, spread: [0, 0.02, 0, 0] });           // Kolbenprober
  // Wasserbad: steht wie der Brenner unter einem Gefäß und hält es auf der eingestellten Temperatur (range, in °C).
  // gain: so viel besser als eine Flamme überträgt das Wasser die Wärme
  // Waage: steht unter einem Gefäß und zeigt dessen Masse samt Glas; tare zieht ab, was beim Tarieren darauf stand
  registerPart("balance", { kind: "tool", under: true, scale: true, unit: "g", sense: "m", lag: 0.5, fine: 0.01, spread: [0, 0.0002, 0.005, 0] });      // Tara stellt sie genau auf null
  registerPart("bath", { kind: "tool", under: true, bath: true, unit: "°C", lag: 0, range: [0, 95], gain: 25 });
  // Fotometer mit Tauchsonde: misst die Extinktion bei einer Wellenlänge (nm, einstellbar zwischen waves) über die Schichtdicke d in cm
  registerPart("photometer", { kind: "tool", lag: 0.5, unit: "E", sense: "A", fine: 0.002, nm: 525, waves: [380, 730], d: 1, range: [0, 3], spread: [0.005, 0.01, 0.002, 0] });
  // test: liegt nicht auf dem Tisch, sondern wird an ein Gefäß gehalten
  registerPart("splint", { kind: "test", probe: "flame" });        // brennender Holzspan
  registerPart("glowsplint", { kind: "test", probe: "glow" });     // Glimmspan
  registerPart("rod", { kind: "test", probe: "rod" });             // Magnesiastäbchen für die Flammenfärbung
  registerPart("paper", { kind: "test", probe: "paper" });         // feuchtes Universalindikatorpapier für den Gasraum
  // Elektroden: electrode: Material, g: Masse in g. Angezeigt und aufgezeichnet wird ihre Masse.
  ["C", "Pt", "Cu", "Zn", "Fe", "Ag"].forEach(function (el) {
    registerPart("electrode-" + el, { kind: "tool", electrode: el + "(s)", g: el === "C" ? 5 : 10, unit: "g", lag: 0, fine: 1e-7 });
  });
  // circuit: Glied eines Stromkreises. Der Stromkreis gehört zu dem Gefäß, an dem das Gerät steht, und führt über dessen zwei Elektroden.
  // max: höchste Spannung in V, limit: Strombegrenzung in A; ohm: Widerstand; watt: Leistung, bei der das Lämpchen voll leuchtet
  registerPart("supply", { kind: "tool", circuit: "supply", unit: "V", lag: 0, max: 12, limit: 3 });
  registerPart("ammeter", { kind: "tool", circuit: "ammeter", unit: "A", lag: 0.2, fine: 0.002, spread: [0, 0.01, 0.0005, 0] });
  registerPart("voltmeter", { kind: "tool", circuit: "voltmeter", unit: "V", lag: 0.2, fine: 0.002, spread: [0, 0.01, 0.002, 0] });
  registerPart("lamp", { kind: "tool", circuit: "load", lag: 0.1, fine: 0.01, ohm: 54, watt: 0.266 });      // Glühlämpchen 3,8 V / 0,07 A
  // Salzbrücke zwischen zwei Gefäßen ("in" und "to"): salt: das Kation und das Anion, die sie abgibt; ohm: ihr Widerstand
  registerPart("bridge", { kind: "tool", bridge: true, salt: ["K+(aq)", "NO3-(aq)"], ohm: 30 });

  function spec(v) {
    var def = L.parts[v.type];
    return def.sizes ? def.sizes[v.size] : def;
  }

  // ------------------------------------------------------------------ Eingabe

  // Diagramme: Temperatur, Stoffmengen, pH über der Zeit, Messwert über dem Volumen aus der Bürette, Gasvolumen,
  // Stromstärke, Spannung, Stromstärke über der Spannung, Masse der Elektroden, Leitfähigkeit
  var CHARTS = ["T", "n", "pH", "titration", "V", "I", "U", "IU", "m", "kappa", "A", "spectrum"];

  // Aufgaben. Ein Ziel ist
  //   { measure, min, max }   ein Messgerät zeigt einen Wert von min bis max (Strom und Spannung als Betrag)
  //   { has, min, max }       von einem Stoff liegen min bis max mol vor (gelöst, fest oder im Gasraum); Vorgabe: mindestens 1 µmol
  //   { seen }                eine Beobachtung steht im Protokoll; bei "color" wahlweise mit name, bei Stoffen mit species
  // jeweils wahlweise mit in (nur dieses Gefäß) und label (eigener Text).
  var MEASURES = { T: "°C", pH: "", kappa: "mS/cm", A: "", V: "mL", I: "A", U: "V", m: "g", p: "bar" };
  var OBSERVED = ["gas", "pop", "relight", "out", "paper", "popped", "suckBack", "plungerOut", "spatter", "solid", "dissolved", "color", "boil", "smell", "ignite", "flame", "plated", "lamp", "broken"];
  var COLORS = ["colorless", "yellow", "orange", "red", "pink", "violet", "blue", "cyan", "green", "brown", "grey", "black"];

  function readTask(raw, bench) {
    if (typeof raw === "string") raw = { text: raw };
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) throw fail("task", String(raw));
    if (raw.goals != null && !Array.isArray(raw.goals)) throw fail("task", "goals");
    return { text: raw.text == null ? "" : String(raw.text), goals: (raw.goals || []).map(function (g) {
      var goal;
      if (!g || typeof g !== "object" || Array.isArray(g)) throw fail("task", JSON.stringify(g));
      function bounds(target) {
        ["min", "max"].forEach(function (key) {
          if (g[key] == null) return;
          if (typeof g[key] !== "number" || !isFinite(g[key]) || (target.has && g[key] < 0)) throw fail("task", key + " " + JSON.stringify(g[key]));
          target[key] = g[key];
        });
      }
      if (g.measure != null) {
        if (!(g.measure in MEASURES)) throw fail("task", "measure " + String(g.measure));
        goal = { measure: g.measure };
        bounds(goal);
        if (goal.min == null && goal.max == null) throw fail("task", "min/max");
      } else if (g.has != null) {
        if (!L.db.species[g.has]) throw fail("task", "has " + String(g.has));
        goal = { has: String(g.has) };
        bounds(goal);
        if (goal.min == null && goal.max == null) goal.min = 1e-6;
      } else if (g.seen != null) {
        if (OBSERVED.indexOf(g.seen) < 0) throw fail("task", "seen " + String(g.seen));
        goal = { seen: g.seen };
        if (g.name != null) {
          if ((g.seen !== "color" && g.seen !== "paper") || COLORS.indexOf(g.name) < 0) throw fail("task", "name " + String(g.name));
          goal.name = g.name;
        }
        if (g.species != null) {
          if (!L.db.species[g.species]) throw fail("task", "species " + String(g.species));
          goal.species = String(g.species);
        }
      } else if (g.identify != null) {                          // eine unbekannte Probe mit oneOf richtig benennen
        if (!(bench || []).some(function (item) { return item.unknown === g.identify && item.oneOf; })) throw fail("task", "identify " + String(g.identify));
        goal = { identify: g.identify };
      } else throw fail("task", JSON.stringify(g));
      if (g.in != null) {
        if (typeof g.in !== "string" || !/^[\w.-]+$/.test(g.in)) throw fail("task", "in " + String(g.in));
        goal.in = g.in;
      }
      if (g.label != null && g.label !== "") goal.label = String(g.label);
      return goal;
    }) };
  }

  // Welche Ziele einer Aufgabe im Zustand lab erfüllt sind; events: das Protokoll bis zum Zeiger
  function checkTask(task, lab, events) {
    var goals = task.goals.map(function (g) {
      var total = 0;
      if (g.identify) {                                          // die letzte Antwort zu dieser Probe zählt
        var s = lab.samples[g.identify];
        return !!(s && s.said != null && s.said === s.names[s.pick]);
      }
      if (g.measure) return lab.tools.some(function (t) {
        var def = L.parts[t.type], kind = def.circuit === "ammeter" ? "I" : def.circuit === "voltmeter" ? "U" : def.sense, value = t.value;
        if (kind !== g.measure || value == null || (g.in != null && t.in !== g.in)) return false;
        if (kind === "I" || kind === "U") value = Math.abs(value);
        return (g.min == null || value >= g.min) && (g.max == null || value <= g.max);
      });
      if (g.has) {
        lab.vessels.forEach(function (v) { if (g.in == null || v.id === g.in) total += (v.n[g.has] || 0) + (v.air[g.has] || 0); });
        lab.tools.forEach(function (t) { if (t.coat && (g.in == null || t.in === g.in)) total += t.coat[g.has] || 0; });      // abgeschieden auf einer Elektrode
        return (g.min == null || total >= g.min) && (g.max == null || total <= g.max + 1e-10);
      }
      return events.some(function (e) {
        var kind = e.key === "bubbles" ? "gas" : e.key === "splint" ? e.result : e.key === "flameTest" ? "flame" : e.key === "lampOn" ? "lamp" : e.key;
        if (kind !== g.seen || (g.in != null && e.vessel !== g.in) || (g.name && e.name !== g.name)) return false;
        return !g.species || e.species === g.species || (Array.isArray(e.species) && e.species.indexOf(g.species) >= 0);
      });
    });
    return { goals: goals, done: goals.length > 0 && goals.every(Boolean) };
  }

  function voltsOf(def, value) { return Math.round(Math.max(0, Math.min(def.max, +value || 0)) * 100) / 100; }

  function amountOf(r, raw) {
    var value = r.solid ? +raw.g : raw.ml != null ? +raw.ml : (+raw.drops || 0) * DROP;
    if (!(value >= 0) || !isFinite(value)) value = 0;
    return r.solid ? { g: value } : { ml: value };
  }

  // Beschreibung des Aufbaus (Text aus dem Makro oder Objekt) → geprüfte Angaben mit Vorgaben
  function normalize(source) {
    var saved = L.db;
    try { return read(source); } catch (error) {
      if (L.db !== saved) { L.db = saved; systems = {}; }       // scheitert der Aufbau, gelten auch seine eigenen Daten nicht
      throw error;
    }
  }

  function read(source) {
    var d = source, text;
    if (typeof d === "string") {
      text = d.replace(/^[\s`]+|[\s`]+$/g, "");
      if (!text) d = {};
      else { try { d = JSON.parse(text); } catch (error) { throw fail("json", error.message); } }
    }
    if (!d || typeof d !== "object" || Array.isArray(d)) throw fail("json", "");
    // packs: Adressen von Paketen, die die Fläche vor dem Aufbau lädt (das macht die Oberfläche); nur vollständige Adressen
    if (d.packs != null && !(Array.isArray(d.packs) && d.packs.every(function (url) { return typeof url === "string" && /^https?:\/\/\S+$/.test(url); })))
      throw fail("pack", JSON.stringify(d.packs));
    if (d.data) register(d.data);
    if (d.model != null && d.model !== "ideal" && d.model !== "real") throw fail("model", String(d.model));
    if (d.view != null && d.view !== "2d" && d.view !== "3d") throw fail("view", String(d.view));
    if (d.scatter != null && typeof d.scatter !== "boolean" && !(typeof d.scatter === "number" && isFinite(d.scatter))) throw fail("scatter", String(d.scatter));
    var scene = sceneOf(d.scene);

    var count = {}, ids = {}, bench = [], samples = {};
    (Array.isArray(d.bench) ? d.bench : []).forEach(function (raw) {
      var type = raw && raw.type, def = L.parts[type], item;
      if (!def || def.kind === "test") throw fail("part", String(type));
      if (def.electrode && !L.db.species[def.electrode]) throw fail("species", def.electrode);      // eine eigene Elektrode, deren Stoff nicht eingetragen ist
      if (typeof raw.id === "string" && raw.id) item = { type: type, id: raw.id };
      // eine Probe ohne eigene id heißt nach ihrem Namen und nimmt den anderen Gefäßen keine Nummer
      else if (def.kind === "vessel" && typeof raw.unknown === "string" && raw.unknown) item = { type: type, id: "sample" + raw.unknown.replace(/ /g, "-") };
      else { count[type] = (count[type] || 0) + 1; item = { type: type, id: type + count[type] }; }
      if (ids[item.id] || !/^[\w.-]+$/.test(item.id)) throw fail("place", item.id);
      ids[item.id] = item;
      if (def.kind === "vessel") {
        if (def.sizes) {
          if (raw.ml != null && !def.sizes[raw.ml]) throw fail("size", String(raw.ml));
          item.size = raw.ml != null ? +raw.ml : def.size;
        }
        var cap = def.sizes ? def.sizes[item.size].cap : def.cap;
        var fill = function (list) {
          var filled = 0, out = (Array.isArray(list) ? list : []).map(function (c) {
            var r = reagent(c && c.reagent), a = amountOf(r, c);
            // die Einheit muss zum Stoff passen: Feststoff in g, Flüssigkeit in mL oder Tropfen
            if (!((r.solid ? a.g : a.ml) > 0) || (r.solid ? c.ml != null || c.drops != null : c.g != null)) throw fail("amount", String(c.reagent));
            filled += a.ml || 0;
            return Object.assign({ reagent: String(c.reagent) }, a);
          });
          if (filled > cap + 1e-9) throw fail("amount", item.id + ": " + filled + " mL > " + cap + " mL");
          return out;
        };
        // unknown: eine Probe mit verborgenem Inhalt; oneOf: mögliche Füllungen, von denen beim Einlesen eine gezogen wird
        if (raw.unknown != null) {
          if (typeof raw.unknown !== "string" || !/^[\w .-]{1,12}$/.test(raw.unknown) || samples[raw.unknown]) throw fail("sample", String(raw.unknown));
          item.unknown = samples[raw.unknown] = raw.unknown;
        }
        if (raw.oneOf != null) {
          if (raw.contains != null || !Array.isArray(raw.oneOf) || raw.oneOf.length < 2) throw fail("sample", item.id);
          item.oneOf = raw.oneOf.map(function (o) {
            if (!o || typeof o.name !== "string" || !o.name || !Array.isArray(o.contains)) throw fail("sample", item.id);
            return { name: o.name, contains: fill(o.contains) };
          });
          item.pick = Math.floor(Math.random() * item.oneOf.length);
          item.contains = item.oneOf[item.pick].contains;
        } else item.contains = fill(raw.contains);
        if (def.dispenser) item.over = raw.over == null ? null : String(raw.over);
      } else {
        if (raw.unknown != null || raw.oneOf != null) throw fail("sample", item.id);      // nur ein Gefäß kann eine Probe sein
        item.in = raw.in != null ? String(raw.in) : raw.under != null ? String(raw.under) : null;      // der Brenner steht "under"
        if (def.flames) item.flame = flameLevel(raw.flame);
        if (def.bath && raw.temp != null) {
          if (typeof raw.temp !== "number" || !(raw.temp >= def.range[0] && raw.temp <= def.range[1])) throw fail("amount", item.id);
          item.temp = raw.temp;
        }
        if (def.sense === "A" && raw.nm != null) {
          if (typeof raw.nm !== "number" || !(raw.nm >= def.waves[0] && raw.nm <= def.waves[1])) throw fail("amount", item.id);
          item.nm = Math.round(raw.nm);
        }
        if (def.circuit === "supply") { item.volts = voltsOf(def, raw.volts); item.flip = !!raw.flip; }
        if (def.bridge || def.duct) item.to = raw.to != null ? String(raw.to) : null;
        if (def.electrode && raw.g != null) {
          if (!(raw.g > 0) || !(raw.g <= 1000)) throw fail("amount", item.id);
          item.g = +raw.g;
        }
      }
      bench.push(item);
    });
    var hung = {};
    bench.forEach(function (item) {
      var own = L.parts[item.type], slot = (own.electrode ? "electrode" : own.under ? "under" : item.type) + ">" + item.in;     // Brenner und Wasserbad teilen sich den Platz darunter
      if (item.in != null) {                           // von jedem Gerät gehört nur eines an ein Gefäß, von den Elektroden zwei
        // Kolbenprober und Rohr sitzen beide im Stopfen, Kühler und Rohr führen beide hinaus: je Gefäß einer
        [slot].concat(own.stopper ? ["seal>" + item.in] : [], own.duct ? ["duct>" + item.in] : []).forEach(function (key) {
          hung[key] = (hung[key] || 0) + 1;
          if (hung[key] > (own.electrode ? 2 : 1)) throw fail("place", item.in);
        });
      }
      var host = ids[item.in != null ? item.in : item.over], def = host && L.parts[host.type];
      var fits = !!(def && def.kind === "vessel" && !def.dispenser);       // in oder über einem Gefäß, nicht an einer Bürette
      // Elektroden und die Geräte eines Stromkreises gehören an ein Gefäß, in dem Elektroden Platz haben
      if (item.in != null && (!fits || ((own.electrode || own.circuit) && !def.electrodes))) throw fail("place", item.in);
      if (item.in != null && def.insulated && (own.flames || own.bath)) throw fail("place", item.in);
      if (item.to != null) {                                               // das andere Ende der Salzbrücke; an jedem Gefäß hängt nur eines
        def = ids[item.to] && L.parts[ids[item.to].type];
        if (!def || def.kind !== "vessel" || def.dispenser || item.to === item.in || item.in == null) throw fail("place", item.to);
        if (own.duct && looped(bench.filter(function (o) { return o !== item && L.parts[o.type].duct; }), item.in, item.to)) throw fail("place", item.to);
        slot = (own.duct ? "duct<" : "bridge>") + item.to;                    // in eine Vorlage führt nur ein Kühler oder Rohr
        hung[slot] = (hung[slot] || 0) + 1;
        if (hung[slot] > 1) throw fail("place", item.to);
      }
      if (item.over != null) {
        if (!fits || hung[item.over]) throw fail("place", item.over);      // über einem Gefäß hängt nur eine Bürette
        hung[item.over] = true;
      }
    });

    var show = d.show && typeof d.show === "object" ? d.show : {};
    return {
      bench: bench,
      shelf: Array.isArray(d.shelf) ? d.shelf.map(function (id) {
        if (!L.parts[id]) reagent(id);
        return String(id);
      }) : null,
      show: {
        numbers: show.numbers !== false,
        particles: show.particles !== false,                       // ob das Feld eines Gefäßes die Teilchenlupe anbietet
        equations: show.equations !== false,
        volumes: show.volumes !== false,                           // mL unter den Gefäßen und das Abgegebene der Bürette
        log: show.log !== false,
        shelf: show.shelf === true,                                // ob die Regalleiste von Anfang an offen ist
        charts: show.charts === false ? [] : Array.isArray(show.charts)
          ? show.charts.filter(function (c) { return CHARTS.indexOf(c) >= 0; }) : CHARTS.slice()
      },
      room: typeof d.room === "number" && d.room >= 0 && d.room < 100 ? d.room : 20,
      lock: !!d.lock,                                              // gesperrt: Geräte bleiben, wo sie stehen
      // scatter: die Auslosung, nach der die Anzeigen streuen; true lost für jeden Aufbau neu aus, null: sie streuen nicht
      scatter: d.scatter === true ? Math.floor(Math.random() * 1e9) : typeof d.scatter === "number" ? d.scatter : null,
      table: !!d.table,                                            // mit Messwerttabelle
      task: d.task == null ? null : readTask(d.task, bench),
      packs: d.packs || [],
      // model: womit die Gleichgewichte rechnen. "ideal": mit Konzentrationen; "real": mit Aktivitäten
      model: d.model == null ? "ideal" : d.model,
      // view: womit die Fläche beginnt; scene: wie sie in 3D aussieht (Raum und Geräte), an der Rechnung ändert sie nichts
      view: d.view || "2d",
      scene: scene
    };
  }

  // "scene": "1880" oder {"base":"kitchen","gear":{"burner":"lab"},"quality":"low"}.
  // Ob es die Szene gibt, zeigt sich erst beim Umschalten: eigene Szenen kommen mit eigenen Skripten dazu.
  function sceneOf(raw) {
    var name = /^[\w.-]+$/, out = { base: "lab", gear: {}, quality: "auto" };
    if (raw == null) return out;
    if (typeof raw === "string") raw = { base: raw };
    if (typeof raw !== "object" || Array.isArray(raw)) throw fail("scene", String(raw));
    if (raw.base != null) {
      if (!name.test(String(raw.base))) throw fail("scene", String(raw.base));
      out.base = String(raw.base);
    }
    if (raw.quality != null) {
      if (["auto", "high", "low"].indexOf(raw.quality) < 0) throw fail("scene", "quality: " + raw.quality);
      out.quality = raw.quality;
    }
    Object.keys(raw.gear && typeof raw.gear === "object" ? raw.gear : {}).forEach(function (type) {
      if (!L.parts[type] || !name.test(String(raw.gear[type]))) throw fail("scene", "gear: " + type);
      out.gear[type] = String(raw.gear[type]);
    });
    return out;
  }

  // ------------------------------------------------------------------ Gefäße

  function vessel(lab, id) {
    for (var i = 0; i < lab.vessels.length; i++) if (lab.vessels[i].id === id) return lab.vessels[i];
    return null;
  }

  function tool(lab, id) {
    for (var i = 0; i < lab.tools.length; i++) if (lab.tools[i].id === id) return lab.tools[i];
    return null;
  }

  function volume(v) {            // Flüssigkeit in L
    var ml = 0, solute = 0, id, s;
    for (id in v.n) { s = L.db.species[id]; if (s.phase === "l") ml += v.n[id] * s.M / s.rho; else if (s.Vm) solute += v.n[id] * s.Vm; }
    return ml > 0 ? (ml + solute) / 1000 : 0;      // ein trockener Rückstand ist keine Flüssigkeit, auch wenn seine Ionen ein Eigenvolumen haben
  }

  function heatCapacity(v) {      // J/K, mit dem Glas
    var C = spec(v).Cv, id;
    for (id in v.n) C += v.n[id] * L.db.species[id].cp;
    return C;
  }

  function free(lab, v) {         // freier Platz in mL, Zuflüsse schon abgezogen
    var room = spec(v).cap - volume(v) * 1000;
    lab.flows.forEach(function (f) { if (f.to === v.id) room -= f.left; });
    return room;
  }

  // Stoffmengen für eine Portion aus der Vorratsflasche
  function portion(r, a) {
    var out = {}, id, s;
    if (r.solid) out[r.solid] = a.g / species(r.solid).M;
    else {
      if (r.solution) for (id in r.solution) out[id] = r.solution[id] * a.ml / 1000;
      s = species(r.liquid || WATER);
      out[s.id] = (out[s.id] || 0) + a.ml * (r.solution ? Math.max(0, 1 - taken(r.solution, L.db.species)) : 1) * s.rho / s.M;
    }
    return out;
  }

  // Gibt Stoffe der Temperatur T in ein Gefäß; die Mischtemperatur folgt aus den Wärmekapazitäten
  function mixIn(v, amounts, T) {
    var before = heatCapacity(v), after, id;
    for (id in amounts) if (amounts[id] > 0) v.n[id] = (v.n[id] || 0) + amounts[id];
    after = heatCapacity(v);
    if (after > before) v.T = (before * v.T + (after - before) * T) / after;
    v.dirty = true;
  }

  // Zugeben mit örtlicher Mischwärme: Die Portion mischt sich zuerst nur mit einem Teil des Inhalts, so viel wie sie selbst, oder,
  // ist sie schwerer und sinkt durch, mit SINK-mal so viel. Gerechnet wird diese Mischzone für sich: Wird sie heißer als der Siedepunkt,
  // spritzt es, und ein Teil der Flüssigkeit fliegt aus dem Gefäß (nach out). Die Wärme selbst bucht wie immer das ganze Gefäß.
  // Wie groß die Mischzone im Verhältnis zur Portion ist: 1, wenn sie leichter ist und oben bleibt, ZONE_SINK, wenn sie schwerer ist
  function zoneFactor(v, amounts, ml) {
    var vol = volume(v) * 1000, mass = 0, own = 0, id, s;
    for (id in amounts) mass += amounts[id] * L.db.species[id].M;
    for (id in v.n) { s = L.db.species[id]; if (s.phase === "l" || s.phase === "aq") own += v.n[id] * s.M; }
    return vol > 0 && mass / ml > own / vol ? ZONE_SINK : 1;
  }

  // Umgießen oder Tropfen aus der Bürette, mit derselben örtlichen Mischwärme: die Portion hat die Zusammensetzung der Flüssigkeit in from
  function pourInto(lab, from, to, ml, emit) {
    var vol = volume(from) * 1000, amounts = {}, id, s;
    ml = Math.min(ml, vol);                                    // vom letzten Rest zählt nur, was noch da ist
    for (id in from.n) { s = L.db.species[id]; if ((s.phase === "l" || s.phase === "aq") && vol > 0) amounts[id] = from.n[id] * ml / vol; }
    return splash(lab, to, amounts, ml, function () { return transfer(from, to, ml); }, emit, from.T);
  }

  // amounts: was hinzukommt (mol), ml sein Volumen; put gibt es wirklich hinein und sagt, wie viel (mL)
  // T0: die Temperatur der Portion (Vorratsflasche: Raumtemperatur)
  function splash(lab, v, amounts, ml, put, emit, T0) {
    var vol = volume(v) * 1000, id, s, zone, share, tmp, w, C = 0, T, k, done;
    // Mischzone aus dem Inhalt, wie er vor dem Zugeben war
    if (vol > 0.05) {
      zone = Math.min(vol, ml * zoneFactor(v, amounts, ml));
      share = zone / vol;
      tmp = createLab({ room: lab.room, model: lab.model, bench: [{ type: "beaker", id: "z", size: 600, contains: [] }] });
      w = vessel(tmp, "z");
      for (id in v.n) { s = L.db.species[id]; if (s.phase === "l" || s.phase === "aq") w.n[id] = v.n[id] * share; }
      // die Zone beginnt bei der Mischtemperatur aus Inhalt und Portion
      var Cz = 0, Cp = 0;
      for (id in w.n) Cz += w.n[id] * L.db.species[id].cp;
      for (id in amounts) { w.n[id] = (w.n[id] || 0) + amounts[id]; Cp += amounts[id] * L.db.species[id].cp; }
      w.T = Cz + Cp > 0 ? (Cz * v.T + Cp * (T0 == null ? lab.room : T0)) / (Cz + Cp) : v.T;
      w.dirty = true;
    }
    done = put();
    if (!w || !(done > 0)) return done;
    equilibrate(tmp, w);
    kinetics(w, null, false);
    for (id in w.n) C += w.n[id] * L.db.species[id].cp;
    T = w.T + (C > 0 ? w.q / C : 0);
    if (!(T > BOIL + SPLASH_OVER)) return done;
    k = Math.min(1, (T - BOIL) / 100) * 0.1 * (zone + ml) / (volume(v) * 1000);      // so viel der Flüssigkeit fliegt heraus: ein Zehntel der Mischzone (geschätzt)
    for (id in v.n) { s = L.db.species[id]; if ((s.phase === "l" || s.phase === "aq") && v.n[id] > 0) { v.out[id] = (v.out[id] || 0) + v.n[id] * k; v.n[id] *= 1 - k; } }
    v.dirty = true;
    if (!(lab.t - (v.flag.spat == null ? -9 : v.flag.spat) < 1)) {                 // höchstens einmal je Sekunde gemeldet
      v.flag.spat = lab.t;
      if (emit) emit({ key: "spatter", vessel: v.id });
    }
    return done;
  }

  function putReagent(lab, v, r, a) {
    var amounts = portion(r, a), n;
    mixIn(v, amounts, lab.room);
    if (r.solid) {
      n = amounts[r.solid];
      // a0: Oberfläche in cm²; p: wie sie mit der Menge schrumpft (0 = Band, 2/3 = Körner)
      // tau: Zeitkonstante in s, mit der sich das Stück löst; form: wie es gezeichnet wird
      v.lumps.push({ id: r.solid, n: n, n0: n, a0: (r.area || 10) * a.g, p: typeof r.shape === "number" ? r.shape : 2 / 3, tau: r.tau || undefined, form: r.form || undefined });
    }
  }

  function makeVessel(lab, item) {
    return {
      id: item.id, type: item.type, size: item.size, n: {}, out: {}, lumps: [], T: lab.room,
      real: lab.model === "real",                               // rechnet dieses Gefäß mit Aktivitäten?
      ext: {}, rate: {}, gas: 0, q: 0, dirty: true, Teq: lab.room,
      over: item.over || null, tap: 0, given: 0,                // nur für Büretten: Gefäß darunter, Hahn in mL/s, abgegeben in mL
      // air: Gase im Gasraum über der Flüssigkeit, taken: was aus der Luft dazukam, lit: was brennt, boil: Dampf in mol/s
      air: {}, taken: {}, lit: {}, boil: 0, broken: false,
      // half: Umsatz der Vorgänge an den Elektroden, eg: Gas, das in diesem Schritt an Elektroden entstand
      half: {}, eg: 0,
      // seen, tinted: die Extinktion der Flüssigkeit an den Stellen SHADES und wann sie sich zuletzt merklich geändert hat;
      // fizz: seit wie vielen Rechenschritten Gas entsteht
      flag: { gas: false, color: "colorless", next: "", count: 0, heat: 0, base: lab.room, max: lab.room, solid: {}, boil: false, smell: {}, wet: false, torch: null, shown: 0, opaque: false,
        seen: null, tinted: -1000, fizz: 0 },
      walk: 0                                                    // Weg der Teilchen in der Teilchenlupe: die Zeit, gewichtet mit der Wurzel der Temperatur
    };
  }

  // Führen Kühler und Rohre (links: { in, to }) von to aus im Kreis zurück nach from? Aus jedem Gefäß führt höchstens eines.
  function looped(links, from, to) {
    for (var i = 0, at = to; i <= links.length; i++) {
      if (at === from) return true;
      var next = links.filter(function (o) { return o.in === at; })[0];
      if (!next) return false;
      at = next.to;
    }
    return false;
  }
  function ducts(lab, skip) { return lab.tools.filter(function (o) { return o !== skip && L.parts[o.type].duct; }); }

  function flameLevel(value) { return Math.max(0, Math.min(2, Math.round(+value) || 0)); }

  function makeTool(item) {
    var def = L.parts[item.type], t = { id: item.id, type: item.type, in: item.in || null, value: null };
    if (def.flames) { t.flame = item.flame || 0; t.tint = null; }      // tint: Flammenfärbung { rgb, until }
    if (def.bath) t.temp = item.temp == null ? null : item.temp;       // eingestellte Temperatur; null: die des Raums
    if (def.sense === "A") t.nm = item.nm || def.nm;                   // Wellenlänge in nm
    if (def.sense === "V") { t.n = 0; t.full = false; t.held = 0; }   // n: aufgefangenes Gas in mol, held: seine Masse in g (ohne Luft)
    if (def.scale) t.tare = 0;
    if (def.electrode) {
      // n: Stoffmenge des Elektrodenmaterials, coat: was sich darauf abgeschieden hat, seen: Beläge, die schon gemeldet sind,
      // i: Strom in A (positiv: hier wird oxidiert), rate: Umsatz in mol je s, phi: Potential gegen die Lösung in V,
      // bub: Gas in mol/s, pole: "+" oder "-", fizz: ob die Gasblasen schon gemeldet sind
      t.n = t.n0 = (item.g || def.g) / species(def.electrode).M;
      t.coat = {}; t.seen = {}; t.i = 0; t.rate = 0; t.phi = null; t.bub = 0; t.pole = ""; t.fizz = false;
      t.side = 0;                                                // 0: links im Gefäß, 1: rechts
    }
    if (def.circuit === "supply") { t.volts = item.volts || 0; t.flip = !!item.flip; }       // flip: umgepolt
    else if (def.circuit) { t.goal = def.circuit === "voltmeter" ? null : 0; t.lit = false; }     // goal: was das Gerät zeigen soll
    if (def.bridge || def.duct) t.to = item.to || null;
    return t;
  }

  function createLab(config) {
    var lab = { tick: 0, t: 0, room: config.room, model: config.model === "real" ? "real" : "ideal", scatter: config.scatter == null ? null : config.scatter, vessels: [], tools: [], flows: [], used: {}, cache: {}, warm: {}, samples: {} };
    config.bench.forEach(function (item) {                       // unbekannte Proben: welches Gefäß, welche Füllung gezogen wurde, und die möglichen Namen
      if (item.unknown) lab.samples[item.unknown] = { vessel: item.id, pick: item.oneOf ? item.pick : null, names: item.oneOf ? item.oneOf.map(function (o) { return o.name; }) : [] };
    });
    config.bench.forEach(function (item) {
      var v;
      lab.used[item.id] = true;
      if (L.parts[item.type].kind !== "vessel") {
        lab.tools.push((v = makeTool(item)));
        if (L.parts[item.type].bath && v.temp == null) v.temp = tempOf(L.parts[item.type], lab.room);
        seat(lab, v);
        return;
      }
      v = makeVessel(lab, item);
      v.veiled = !!item.unknown;                               // verborgen: eine Probe, und alles, was etwas aus ihr bekommt
      lab.vessels.push(v);
      item.contains.forEach(function (c) { putReagent(lab, v, reagent(c.reagent), c); });
      settle(lab, v);
    });
    survey(lab);
    lab.tools.forEach(function (t) { prime(lab, t); });
    return lab;
  }

  // Ausgangszustand: Gleichgewicht eingestellt, auf Raumtemperatur, ohne Vorgeschichte
  function settle(lab, v) {
    var i;
    L.db.reactions.forEach(function (r) {                       // was sofort reagiert (Schwefelsäure in Wasser), steht schon fertig da
      var x = r.rate.fast ? burst(v, r, volume(v)) : 0, id;
      if (!(x > 0)) return;
      for (id in r.nu) {
        if (L.db.species[id].phase === "s") { if (r.nu[id] > 0) growSolid(v, id, r.nu[id] * x); else takeSolid(v, id, -r.nu[id] * x); }
        else if ((v.n[id] = (v.n[id] || 0) + r.nu[id] * x) < TRACE) delete v.n[id];
      }
    });
    for (i = 0; i < 4000 && equilibrate(lab, v, null, "still"); i++);          // auch Niederschläge sind schon fertig ausgefallen …
    var vol = volume(v);
    v.lumps.forEach(function (l) {                              // … und haben sich abgesetzt
      if (!l.made) return;
      l.settled = L.db.species[l.id].colloid ? 0 : 1;           // ein Kolloid bleibt in der Schwebe
      if (vol > 0 && l.n / vol > SEEN) v.flag.solid[l.id] = true;   // als Niederschlag gilt, was man sieht
    });
    v.T = v.Teq = lab.room;
    v.ext = {}; v.rate = {}; v.q = 0;
    v.dirty = equilibrate(lab, v, null, "probe");               // liegt ein Stück bereit, das sich nach seinem Geschwindigkeitsgesetz löst (Marmor in Säure)?
    v.flag.color = colorOf(v).name;
    v.flag.seen = vol > 0 && !thick(v, vol) ? shades(v) : null;
    v.flag.wet = vol > 0;
  }

  // ------------------------------------------------------------------ Eingriffe

  function duration(ml) { return ml <= 0.5 ? 0.25 : Math.min(4, Math.max(0.5, ml / 3)); }

  // Zugabe aus der Vorratsflasche. Flüssigkeit fließt über kurze Zeit zu, Feststoff fällt sofort hinein.
  function add(lab, vesselId, reagentId, raw) {
    var v = vessel(lab, vesselId), r = reagent(reagentId), a = amountOf(r, raw || {});
    if (!v || v.broken) return false;
    v.seal = null;                                             // zugeben heißt: kurz öffnen; der Druck rechnet danach neu
    if (r.solid) {
      if (!(a.g > 0)) return false;
      putReagent(lab, v, r, a);
      return true;
    }
    if (!(a.ml > 0) || a.ml > free(lab, v) + 1e-9) return false;
    lab.flows.push({ to: vesselId, reagent: reagentId, left: a.ml, rate: a.ml / duration(a.ml) });
    return true;
  }

  // Umgießen: nur die Flüssigkeit mit allem Gelösten, Feststoffe bleiben zurück
  function pourable(lab, id) {    // was sich aus einem Gefäß noch ausgießen lässt, in mL: ohne das, was schon unterwegs ist
    var v = vessel(lab, id), ml = v ? volume(v) * 1000 : 0;
    lab.flows.forEach(function (f) { if (f.from === id) ml -= f.left; });
    return Math.max(0, ml);
  }

  function pour(lab, fromId, toId, ml) {
    var from = vessel(lab, fromId), to = vessel(lab, toId);
    if (!from || !to || from === to || from.broken || to.broken) return false;
    ml = Math.min(+ml || 0, pourable(lab, fromId), free(lab, to));
    if (!(ml > 1e-6)) return false;
    lab.flows.push({ from: fromId, to: toId, left: ml, rate: ml / duration(ml) });
    return true;
  }

  function empty(lab, vesselId) {
    var v = vessel(lab, vesselId);
    if (!v) return false;
    lab.flows = lab.flows.filter(function (f) { return f.to !== vesselId && f.from !== vesselId; });
    v.n = {}; v.out = {}; v.lumps = []; v.ext = {}; v.rate = {}; v.gas = 0; v.T = lab.room; v.tap = 0;
    v.air = {}; v.taken = {}; v.lit = {}; v.boil = 0; v.half = {}; v.eg = 0; v.seal = null;
    v.flag = makeVessel(lab, v).flag;
    v.dirty = true;
    lab.vessels.forEach(function (b) { if (b.over === vesselId) b.given = 0; });   // eine neue Probe: die Bürette zählt von vorn
    lab.tools.forEach(function (t) { if (t.in === vesselId && L.parts[t.type].sense === "V") { t.n = 0; t.full = false; t.held = 0; t.value = 0; if ("smooth" in t) t.smooth = 0; } });   // … und der Kolbenprober
    survey(lab);
    return true;
  }

  // Neues Gerät auf den Tisch; die Angaben wie in "bench"
  function place(lab, raw) {
    var def = L.parts[raw.type], n = 1, id;
    if (!def) throw fail("part", String(raw.type));
    while (lab.used[raw.type + n]) n++;                      // ein Name wird in einem Versuch nicht zweimal vergeben
    id = raw.id || raw.type + n;
    lab.used[id] = true;
    if (def.kind === "test") throw fail("part", String(raw.type));
    var host = vessel(lab, def.kind === "vessel" ? raw.over : raw.in != null ? raw.in : raw.under), made;
    if (host && (L.parts[host.type].dispenser || host.broken)) host = null;      // nichts in und nichts über eine Bürette
    if (host && (def.under || def.circuit || def.bridge) && lab.tools.some(function (t) {
      return (def.under ? L.parts[t.type].under : t.type === raw.type) && t.in === host.id;
    })) host = null;                                           // dort steht schon einer
    if (host && def.electrode && (!L.parts[host.type].electrodes || electrodesIn(lab, host.id).length >= 2)) host = null;      // kein Platz für eine Elektrode
    if (host && def.circuit && !L.parts[host.type].electrodes) host = null;        // ein Stromkreis braucht ein Gefäß für Elektroden
    if (host && L.parts[host.type].insulated && (def.flames || def.bath)) host = null;      // das Kalorimeter kommt nicht auf Brenner oder Wasserbad
    if (host && def.bridge && bridged(lab, host.id)) host = null;                  // dort hängt schon eine Salzbrücke
    if (host && def.duct && toolAt(lab, host, function (d) { return d.duct; })) host = null;      // dort steckt schon ein Kühler oder Rohr
    if (host && def.stopper && toolAt(lab, host, function (d) { return d.stopper; })) host = null;      // dort sitzt schon ein Stopfen
    if (def.kind === "vessel") {
      if (host && lab.vessels.some(function (v) { return v.over === host.id; })) host = null;    // dort hängt schon eine
      lab.vessels.push(makeVessel(lab, {
        id: id, type: raw.type, size: def.sizes ? (def.sizes[raw.ml] ? +raw.ml : def.size) : undefined,
        over: def.dispenser && host ? host.id : null
      }));
    } else {
      var far = (def.bridge || def.duct) && host ? vessel(lab, raw.to) : null;
      if (far && (far === host || far.broken || L.parts[far.type].dispenser || (def.bridge ? bridged(lab, far.id) : lab.tools.some(function (t) { return L.parts[t.type].duct && t.to === far.id; }) || looped(ducts(lab), host.id, far.id)))) far = null;
      if ((def.bridge || def.duct) && raw.to != null && !far) host = null;   // ohne das andere Ende bleibt sie für sich liegen
      lab.tools.push((made = makeTool({
        id: id, type: raw.type, in: host ? host.id : null, flame: flameLevel(raw.flame),
        volts: def.circuit === "supply" ? voltsOf(def, raw.volts) : 0, flip: raw.flip, to: far ? far.id : null, g: raw.g > 0 ? +raw.g : 0,
        temp: def.bath ? tempOf(def, raw.temp == null ? lab.room : raw.temp) : null, nm: def.sense === "A" && raw.nm != null ? waveOf(def, raw.nm) : 0
      })));
      seat(lab, made);
      survey(lab);
      prime(lab, made);
    }
    return id;
  }

  function remove(lab, id) {
    lab.vessels = lab.vessels.filter(function (v) { return v.id !== id; });
    lab.tools = lab.tools.filter(function (t) { return t.id !== id; });
    lab.tools.forEach(function (t) { if (t.in === id) t.in = null; if (t.to === id) t.to = null; });
    lab.vessels.forEach(function (v) { if (v.over === id) { v.over = null; v.tap = 0; } });
    lab.flows = lab.flows.filter(function (f) { return f.to !== id && f.from !== id; });
    survey(lab);
  }

  // Hahn einer Bürette: Durchfluss in mL/s, 0 ist zu
  function setTap(lab, id, rate) {
    var v = vessel(lab, id);
    if (!v || !L.parts[v.type].dispenser) return false;
    v.tap = rate > 0 ? +rate : 0;
    return true;
  }

  // Glas aus seiner Wärmekapazität: 0,84 J/(g K)
  function glassMass(v) { return spec(v).mass != null ? spec(v).mass : spec(v).Cv / 0.84; }      // mass: kein Glas, eigene Masse in g

  // Was die Waage unter v trägt, in g: Glas, Gelöstes, Feststoff, Gas über der Flüssigkeit und das Gas im Kolbenprober
  function weigh(lab, v) {
    var m = glassMass(v), id, meter = toolAt(lab, v, function (def) { return def.sense === "V"; });
    for (id in v.n) m += v.n[id] * L.db.species[id].M;
    for (id in v.air) m += v.air[id] * L.db.species[id].M;
    return m + (meter ? meter.held || 0 : 0);
  }

  function tare(lab, id) {
    var t = tool(lab, id);
    if (!t || !L.parts[t.type].scale) return false;
    t.tare = 0;
    t.tare = sense(lab, t);
    t.value = 0;
    if ("smooth" in t) t.smooth = 0;
    return true;
  }

  // Antwort auf eine unbekannte Probe: einer der Namen aus oneOf. Sie gehört nicht zum Versuch: Zurückspulen nimmt sie nicht zurück,
  // und sie schneidet die Aufzeichnung nicht ab
  function guess(lab, label, name) {
    var s = lab.samples[label];
    if (!s || s.names.indexOf(name) < 0) return false;
    s.said = name;
    return true;
  }

  // Flamme eines Brenners: 0 aus, 1 leuchtend, 2 rauschend
  function setFlame(lab, id, level) {
    var t = tool(lab, id);
    if (!t || !L.parts[t.type].flames) return false;
    t.flame = flameLevel(level);
    if (!t.flame) t.tint = null;
    return true;
  }

  function attach(lab, toolId, vesselId) {
    var t = tool(lab, toolId), v = vessel(lab, vesselId), def = t && L.parts[t.type];
    if (!t || (v && L.parts[v.type].dispenser)) return false;
    if (v && (def.electrode || def.circuit) && !L.parts[v.type].electrodes) return false;
    if (v && def.electrode && electrodesIn(lab, v.id).filter(function (o) { return o !== t; }).length >= 2) return false;
    if (v && def.bridge && (bridged(lab, v.id, t) || t.to === vesselId)) return false;
    if (v && def.under && lab.tools.some(function (o) { return o !== t && o.in === v.id && L.parts[o.type].under; })) return false;      // dort steht schon ein Brenner oder ein Wasserbad
    if (v && def.stopper && lab.tools.some(function (o) { return o !== t && o.in === v.id && L.parts[o.type].stopper; })) return false;      // im Stopfen steckt schon etwas
    if (v && def.duct && (t.to === vesselId || ducts(lab, t).some(function (o) { return o.in === v.id; }) || (t.to && looped(ducts(lab, t), vesselId, t.to)))) return false;
    t.in = v ? vesselId : null;
    if ((def.bridge || def.duct) && !v) t.to = null;
    if (def.sense === "V") { t.held = 0; t.n = 0; t.full = false; t.value = 0; if ("smooth" in t) t.smooth = 0; }      // ein Kolbenprober kommt leer an
    seat(lab, t);
    survey(lab);
    return true;
  }

  function tempOf(def, value) { return Math.max(def.range[0], Math.min(def.range[1], Math.round(+value || 0))); }
  function waveOf(def, value) { return Math.max(def.waves[0], Math.min(def.waves[1], Math.round(+value || 0))); }

  // Temperatur eines Wasserbads in °C
  function setTemp(lab, id, temp) {
    var t = tool(lab, id);
    if (!t || !L.parts[t.type].bath) return false;
    t.temp = tempOf(L.parts[t.type], temp);
    return true;
  }

  // Wellenlänge eines Fotometers in nm
  function setWave(lab, id, nm) {
    var t = tool(lab, id);
    if (!t || L.parts[t.type].sense !== "A") return false;
    t.nm = waveOf(L.parts[t.type], nm);
    return true;
  }

  // Spannung eines Netzgeräts in V; 0 heißt aus
  function setVolts(lab, id, volts) {
    var t = tool(lab, id);
    if (!t || L.parts[t.type].circuit !== "supply") return false;
    t.volts = voltsOf(L.parts[t.type], volts);
    survey(lab);
    return true;
  }

  // Polung eines Netzgeräts: flip = true legt den Pluspol an die rechte Elektrode
  function setPole(lab, id, flip) {
    var t = tool(lab, id);
    if (!t || L.parts[t.type].circuit !== "supply") return false;
    t.flip = !!flip;
    survey(lab);
    return true;
  }

  // ------------------------------------------------------------------ Gleichgewichte

  var GROW = 0.5;                 // s: mit dieser Zeitkonstante wächst ein Niederschlag
  var MELT = 1.2;                 // s: so schnell löst sich ein frischer Niederschlag wieder
  var SINK = 25;                  // s: so schnell setzt er sich ab
  var SEEN = 5e-5;                // mol/L: ab so viel ist ein Niederschlag als Trübung zu sehen
  var HAZE = 0.003;               // mol/L: so viel Schwebendes nimmt der Flüssigkeit 63 % ihrer Durchsicht
  var OPAQUE = 0.9;               // ab dieser Deckkraft sieht man nicht mehr hindurch

  // Reaktionswärme in kJ/mol: nach Hess aus den Bildungsenthalpien; fehlt eine davon, gilt die Angabe dH am Eintrag.
  function heatOf(r) {
    if (r.h === undefined) {
      r.h = enthalpy(r);
      if (r.h == null) r.h = typeof r.dH === "number" ? r.dH : null;
      // eine Redoxreaktion ohne Bildungsenthalpien: stattdessen die freie Enthalpie aus den Standardpotentialen
      if (r.h == null && typeof r.E === "number") r.h = -r.times * FARADAY * r.E / 1000;
    }
    return r.h;
  }

  function heatFor(text) {        // Gleichungstext → kJ/mol; ein eingetragener Vorgang zählt mit seiner eigenen Angabe
    var eq = equation(text), key = keyOf(eq), list = L.db.reactions.concat(L.db.equilibria), i;
    for (i = 0; i < list.length; i++) if (list[i].key === key) return heatOf(list[i]);
    return enthalpy(eq);
  }

  // Stellt zu dem, was im Gefäß ist, das Gleichungssystem auf:
  // alle gelösten Teilchen, die über die eingetragenen Gleichgewichte erreichbar sind, ausgedrückt durch Grundteilchen,
  // und alle Feststoffe, die daraus ausfallen können oder schon da sind.
  function system(aq, solid, real) {
    var key = (real ? "real#" : "") + aq.join("|") + "#" + solid.join("|");
    if (key in systems) return systems[key];
    var set = {}, here = {}, eqs = [], hets = [], grew = true;
    aq.forEach(function (id) { set[id] = true; });
    solid.forEach(function (id) { here[id] = true; });
    function has(term) { return term.id === WATER || set[term.id]; }
    while (grew) {
      grew = false;
      L.db.equilibria.forEach(function (e) {
        var ions;
        if (e.model === "real" && !real) return;                 // dem realen Modell vorbehalten
        if (e.aq) {
          if (eqs.indexOf(e) >= 0 || !(e.left.every(has) || e.right.every(has))) return;
          eqs.push(e);
          Object.keys(e.nu).forEach(function (id) { if (id !== WATER) set[id] = true; });
          grew = true;
        } else if (e.solid && hets.indexOf(e) < 0) {
          ions = Object.keys(e.d);
          // möglich, wenn der Feststoff da ist oder alle Teilchen gelöst sind, aus denen er ausfällt
          if (!here[e.solid] && !ions.every(function (id) { return e.d[id] < 0 || set[id]; })) return;
          hets.push(e);
          ions.forEach(function (id) { set[id] = true; });
          grew = true;
        }
      });
    }
    if (!eqs.length && !hets.length) return (systems[key] = null);

    var ids = Object.keys(set).sort();
    var uses = ids.map(function (id) { return eqs.filter(function (e) { return e.nu[id]; }).length; });
    // Spalten, die zuerst aufgelöst werden: seltene Teilchen; H+ bleibt möglichst Grundteilchen. Bei Gleichstand das schwerere:
    // Das zusammengesetzte Teilchen (Ionenpaar, Säuremolekül, Komplex) wird aus den einfacheren aufgebaut, nicht umgekehrt. So
    // bleibt ein freies Ion Grundteilchen, und ist nichts von ihm da, fällt es mit allem, was es enthält, aus der Rechnung.
    var order = ids.map(function (id, i) { return i; }).sort(function (a, b) {
      return (ids[a] === PROTON) - (ids[b] === PROTON) || uses[a] - uses[b] || L.db.species[ids[b]].M - L.db.species[ids[a]].M || a - b;
    });
    var rows = eqs.map(function (e, j) {
      return { c: ids.map(function (id) { return e.nu[id] || 0; }), mix: eqs.map(function (x, k) { return k === j ? 1 : 0; }) };
    });
    var pivot = [], r = 0;
    order.forEach(function (col) {
      var best = -1, i, k, f, swap;
      if (r >= rows.length) return;
      for (i = r; i < rows.length; i++)
        if (Math.abs(rows[i].c[col]) > 1e-9 && (best < 0 || Math.abs(rows[i].c[col]) > Math.abs(rows[best].c[col]))) best = i;
      if (best < 0) return;
      swap = rows[r]; rows[r] = rows[best]; rows[best] = swap;
      f = rows[r].c[col];
      for (k = 0; k < ids.length; k++) rows[r].c[k] /= f;
      for (k = 0; k < eqs.length; k++) rows[r].mix[k] /= f;
      for (i = 0; i < rows.length; i++) {
        f = rows[i].c[col];
        if (i === r || Math.abs(f) < 1e-12) continue;
        for (k = 0; k < ids.length; k++) rows[i].c[k] -= f * rows[r].c[k];
        for (k = 0; k < eqs.length; k++) rows[i].mix[k] -= f * rows[r].mix[k];
      }
      pivot[r++] = col;
    });
    rows.length = r;

    var basis = ids.map(function (id, i) { return i; }).filter(function (i) { return pivot.indexOf(i) < 0; });
    // a[i][b]: wie viel vom Grundteilchen b in Teilchen i steckt
    var a = ids.map(function (id, i) {
      var row = pivot.indexOf(i);
      return basis.map(function (b) { return row < 0 ? (b === i ? 1 : 0) : -rows[row].c[b]; });
    });
    return (systems[key] = {
      ids: ids, eqs: eqs, rows: rows, pivot: pivot, basis: basis, a: a,
      hydrogen: ids.map(function (id) { return parse(id).atoms.H || 0; }),
      // plain: dieses Grundteilchen steckt in keinem Teilchen mit negativem Anteil; ist nichts davon da, fehlt alles, was es enthält
      plain: basis.map(function (q, b) { return a.every(function (row) { return row[b] >= 0; }); }),
      // comp: Zusammensetzung des Feststoffs aus den Grundteilchen
      solids: hets.map(function (e) {
        var comp = basis.map(function () { return 0; }), id, b, i;
        for (id in e.d) { i = ids.indexOf(id); for (b = 0; b < basis.length; b++) comp[b] += e.d[id] * a[i][b]; }
        return { id: e.solid, eq: e, comp: comp, hydrogen: parse(e.solid).atoms.H || 0 };
      })
    });
  }

  function gauss(A, n) {          // löst A·d = rechte Seite (letzte Spalte); null bei singulärer Matrix
    var p, q, k, m, f, s, d = new Array(n), swap;
    for (p = 0; p < n; p++) {
      m = p;
      for (q = p + 1; q < n; q++) if (Math.abs(A[q][p]) > Math.abs(A[m][p])) m = q;
      if (!(Math.abs(A[m][p]) > 1e-300)) return null;
      swap = A[p]; A[p] = A[m]; A[m] = swap;
      for (q = p + 1; q < n; q++) {
        f = A[q][p] / A[p][p];
        for (k = p; k <= n; k++) A[q][k] -= f * A[p][k];
      }
    }
    for (p = n - 1; p >= 0; p--) {
      s = A[p][n];
      for (k = p + 1; k < n; k++) s -= A[p][k] * d[k];
      d[p] = s / A[p][p];
    }
    return d;
  }

  // Newton-Verfahren über die Stoffbilanzen. Unbekannte: die Logarithmen der Grundteilchen und,
  // für die Feststoffe in "active", deren Menge; für sie gilt zusätzlich: die Lösung ist gerade gesättigt.
  // total: Gesamtmenge je Grundteilchen in mol/L, rhs: Sättigungsbedingung je Feststoff.
  function solve(sys, logB, total, x0, active, rhs, s0) {
    var ids = sys.ids, nb = sys.basis.length, ns = ids.length, np = active.length, free = [];
    var x = x0.slice(), s = s0.slice(), c = new Array(ns);
    var unit = 1e-6, it, i, b, k, r, p, q, sum, worst, A, d, big, damp, comp, nf, n, res, size, ready = false;
    for (b = 0; b < nb; b++) {
      unit = Math.max(unit, Math.abs(total[b]));
      // Ein Grundteilchen, von dem nichts da ist, fällt aus der Rechnung: alles, was es enthält, hat die Konzentration null.
      // Ebenso bei einer Menge, die kleiner ist als alles, was die Rechnung darstellen kann (unter 10^-45 mol/L).
      if (total[b] > 1e-45 || !sys.plain[b] || active.some(function (at) { return sys.solids[at].comp[b] !== 0; })) {
        free.push(b);
        if (x[b] < -60) x[b] = -12;                              // war eben noch ohne Menge: mit einem brauchbaren Wert beginnen
      } else x[b] = -300;
    }
    nf = free.length; n = nf + np; res = new Array(n); size = new Array(nf);
    for (it = 0; it < 300; it++) {
      for (i = 0; i < ns; i++) {
        sum = logB[i];
        for (b = 0; b < nb; b++) sum += sys.a[i][b] * x[b];
        c[i] = Math.pow(10, sum);
      }
      worst = 0;
      for (r = 0; r < nf; r++) {
        b = free[r];
        res[r] = -total[b]; size[r] = Math.abs(total[b]) + 1e-300;
        for (i = 0; i < ns; i++) { res[r] += sys.a[i][b] * c[i]; size[r] += Math.abs(sys.a[i][b]) * c[i]; }
        for (p = 0; p < np; p++) { comp = sys.solids[active[p]].comp[b]; res[r] += comp * s[p]; size[r] += Math.abs(comp * s[p]); }
        worst = Math.max(worst, Math.abs(res[r]) / size[r]);
      }
      for (p = 0; p < np; p++) {
        sum = -rhs[active[p]];
        for (b = 0; b < nb; b++) sum += sys.solids[active[p]].comp[b] * x[b];
        res[nf + p] = sum;
        worst = Math.max(worst, Math.abs(sum) * 1e-3);
      }
      // Bliebe es beim Erreichen der Schranke, stünde jedes Mal ein Fehler knapp darunter in der Stoffbilanz, und über viele
      // Schritte, in denen sich die Lösung ändert (Eindampfen), wüchse daraus eine Ladung. Ein Schritt mehr verdoppelt die Zahl
      // der gültigen Stellen: Der Fehler liegt danach bei der Rechengenauigkeit.
      if (worst < 1e-12) {
        if (ready || worst < 1e-15) return { x: x, c: c, s: s };
        ready = true;
      }
      A = [];
      for (r = 0; r < nf; r++) {
        A.push(new Array(n + 1));
        for (k = 0; k < nf; k++) {
          sum = 0;
          for (i = 0; i < ns; i++) sum += sys.a[i][free[r]] * sys.a[i][free[k]] * c[i];
          A[r][k] = LN10 * sum / size[r];
        }
        for (p = 0; p < np; p++) A[r][nf + p] = sys.solids[active[p]].comp[free[r]] * unit / size[r];
        A[r][n] = -res[r] / size[r];
      }
      for (p = 0; p < np; p++) {
        A.push(new Array(n + 1));
        for (k = 0; k < nf; k++) A[nf + p][k] = sys.solids[active[p]].comp[free[k]];
        for (q = 0; q < np; q++) A[nf + p][nf + q] = 0;
        A[nf + p][n] = -res[nf + p];
      }
      d = gauss(A, n);
      if (!d) return null;
      big = 0;
      for (k = 0; k < nf; k++) big = Math.max(big, Math.abs(d[k]));
      if (!isFinite(big)) return null;
      damp = big > 1 ? 1 / big : 1;                    // höchstens eine Zehnerpotenz je Schritt
      // Die Obergrenze liegt weit über allem, was es gibt: Auf dem Weg zum Gleichgewicht vieler Feststoffe kommen Zwischenzustände
      // vor, die nur mit solchen Konzentrationen aufgehen, bevor der nächste Feststoff dazukommt.
      for (k = 0; k < nf; k++) x[free[k]] = Math.max(-60, Math.min(9, x[free[k]] + damp * d[k]));
      for (p = 0; p < np; p++) s[p] += damp * d[nf + p] * unit;
    }
    return null;
  }

  function saturation(sys, x, rhs, k) {     // > 0: übersättigt, der Feststoff k kann ausfallen
    var sum = -rhs[k], b;
    for (b = 0; b < x.length; b++) sum += sys.solids[k].comp[b] * x[b];
    return sum;
  }

  // Das volle Gleichgewicht mit Feststoffen: welche liegen vor, wie viel davon (s, mol/L), und wie sieht die Lösung dann aus (c, x)?
  // Der Weg dorthin beginnt beim jetzigen Zustand: bei der Lösung, wie sie ist (dissolved, x0), und den Feststoffen, wie sie
  // daliegen (cur). Einer nach dem anderen kommen die Feststoffe dazu, die mit der Lösung nicht im Gleichgewicht stehen: die
  // vorhandenen, die sich lösen oder wachsen müssen, und die fehlenden, die ausfallen müssen. Wer dabei aufgebraucht wird,
  // scheidet aus. Was noch nicht dazugehört, bleibt liegen, wie es ist. So ist jeder Zwischenschritt ein Zustand, den es geben
  // kann, und die Rechnung bleibt in der Nähe dessen, was sie schon kennt.
  function balance(sys, logB, rhs, dissolved, x0, cur) {
    var np = sys.solids.length, active = [], used = {}, state = null, saved = null, found, k, round, worst, at, value, melt, out;
    // used: der Feststoff nimmt an der Stoffbilanz teil (er ist dabei oder aufgebraucht)
    function attempt() {
      var total = dissolved.map(function (sum, b) {
        for (var q = 0; q < np; q++) if (used[q]) sum += sys.solids[q].comp[b] * cur[q];
        return sum;
      });
      return solve(sys, logB, total, state ? state.x : x0, active, rhs, active.map(function (q) { return cur[q]; }));
    }
    // Lässt sich die Zusammensetzung von q aus denen der aktiven Feststoffe zusammensetzen? Dann die Anteile alpha mit
    // comp[q] = Σ alpha[i] · comp[active[i]], sonst null. (Kleinste Quadrate; die aktiven sind voneinander unabhängig.)
    function depends(q) {
      var m = active.length, own = sys.solids[q].comp, nb = own.length, G = [], i, j, b, sum, alpha, rest = 0, size = 0;
      if (!m) return null;
      for (i = 0; i < m; i++) {
        G.push(new Array(m + 1));
        for (j = 0; j <= m; j++) {
          sum = 0;
          for (b = 0; b < nb; b++) sum += sys.solids[active[i]].comp[b] * (j < m ? sys.solids[active[j]].comp[b] : own[b]);
          G[i][j] = sum;
        }
      }
      alpha = gauss(G, m);
      if (!alpha) return null;
      for (b = 0; b < nb; b++) {
        sum = own[b];
        for (i = 0; i < m; i++) sum -= alpha[i] * sys.solids[active[i]].comp[b];
        rest += sum * sum; size += own[b] * own[b];
      }
      return rest <= 1e-18 * size ? alpha : null;
    }
    // Nimmt q unter die Feststoffe auf, mit denen die Lösung gesättigt sein soll: q ist übersättigt, die Lösung mit den aktiven
    // gerade gesättigt. Hängt seine Zusammensetzung von ihnen ab (Oxid und Hydroxid; Hydroxid und Carbonat zweier Metalle),
    // können nicht alle gesättigt sein. Dann entsteht q aus den anderen, ohne dass sich an der Lösung etwas ändert, und das
    // senkt die freie Enthalpie, bis einer von denen, die dabei verbraucht werden, aufgebraucht ist. Der scheidet aus.
    function join(q) {
      var alpha = depends(q), gone = -1, least = Infinity, i;
      used[q] = true;
      if (!alpha) { active.push(q); return; }
      for (i = 0; i < active.length; i++) {
        if (alpha[i] > 1e-9 && state.s[i] / alpha[i] < least) { least = state.s[i] / alpha[i]; gone = i; }
      }
      if (gone >= 0) active[gone] = q;
    }
    for (round = 0; round < 24 + 6 * np; round++) {
      found = attempt();
      if (!found && saved) {
        // Der zuletzt Aufgenommene müsste sich lösen, lässt sich aber nicht sättigen: Das verlangte Konzentrationen, die es nicht
        // gibt, oder seine Zusammensetzung hängt von den anderen ab. Dann löst er sich ganz.
        active = saved;
        found = attempt();
      }
      saved = null;
      if (!found) return null;
      state = found;
      worst = -1e-15; at = -1;                                  // wer aufgebraucht ist, scheidet aus
      for (k = 0; k < active.length; k++) if (state.s[k] < worst) { worst = state.s[k]; at = k; }
      if (at >= 0) { active.splice(at, 1); continue; }
      worst = 1e-9; at = -1; melt = false;                      // wer am weitesten vom Gleichgewicht steht, ist als Nächster dran
      for (k = 0; k < np; k++) {
        if (active.indexOf(k) >= 0) continue;
        value = saturation(sys, state.x, rhs, k);
        if (value > worst) { worst = value; at = k; melt = false; }
        else if (-value > worst && !used[k] && cur[k] > 0) { worst = -value; at = k; melt = true; }      // liegt da und müsste sich lösen
      }
      // Ein Feststoff, der sich lösen müsste, kommt versuchsweise dazu: Meist löst er sich nur zum Teil, und die Lösung ist dann
      // mit ihm gesättigt.
      if (at >= 0 && melt) { used[at] = true; saved = active.slice(); active.push(at); continue; }
      if (at >= 0) { join(at); continue; }
      out = cur.map(function (amount, q) { return used[q] ? 0 : amount; });
      active.forEach(function (q, index) { out[q] = Math.max(0, state.s[index]); });
      return { s: out, c: state.c, x: state.x };
    }
    return null;
  }

  // Zeitkonstante, mit der sich ein Feststoff löst. Ein Stück aus dem Regal löst sich über seine Oberfläche:
  // sie schrumpft mit ihm, und so ist es nach endlicher Zeit verschwunden (Körner nach dem Dreifachen von tau).
  function pace(v, id) {
    var tau = MELT;
    v.lumps.forEach(function (l) { if (l.id === id && !l.made) tau = (l.tau || 15) * Math.max(0.01, Math.pow(l.n / l.n0, 1 - l.p)); });
    return tau;
  }

  function rgbOf(id, key) {       // Farbe eines Feststoffs (oder seiner Flamme) als [r, g, b]
    var m = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(L.db.species[id][key || "color"] || "") || ["", "f2", "f2", "f2"];
    return [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16)];
  }

  function solidColor(id) {       // … und als Wort, für das Protokoll
    var name = colorName(rgbOf(id)).name;
    return name === "colorless" ? "white" : name;
  }

  // Bucht einen Umsatz: für die Liste der Reaktionen und für die Wärme
  function tally(v, entry, xi, cold) {
    if (!xi) return;
    v.ext[entry.key] = (v.ext[entry.key] || 0) + xi;
    if (Math.abs(xi) / DT > 1e-12) v.rate[entry.key] = Math.abs(xi) / DT;
    if (!cold) v.q -= xi * (heatOf(entry) || 0) * 1000;
  }

  // ------------------------------------------------------------------ Aktivitäten (reales Modell)

  // Im realen Modell gilt das Massenwirkungsgesetz für Aktivitäten: Konzentration mal Aktivitätskoeffizient γ. Die Koeffizienten
  // hängen nur von der Ionenstärke I ab. Gerechnet wird nach Truesdell und Jones, lg γ = −A z² √I / (1 + B å √I) + b I, mit der
  // Ionengröße å und dem Zusatzglied b aus den Stoffdaten (gamma); ein Ion ohne diese Angaben nach Davies, ein ungeladenes
  // Teilchen mit lg γ = 0,1 · I (oder seinem b).
  var I_MAX = 6;              // mol/L: darüber bleiben die Koeffizienten stehen; so weit reichen die Parameter
  var I_DAVIES = 0.5;         // mol/L: so weit gilt die Gleichung von Davies
  var U_TOL = 1e-9;           // so genau wird die Wurzel aus der Ionenstärke bestimmt

  // Debye-Hückel-Konstanten A und B (B für å in Å) bei t °C, aus Dichte und Dielektrizitätszahl des Wassers
  function debye(t) {
    t = Math.max(0, Math.min(100, t));                          // die Formeln gelten für flüssiges Wasser; ein überhitztes Gefäß rechnet mit 100 °C
    var rho = 1 - (t - 3.9863) * (t - 3.9863) * (t + 288.9414) / (508929.2 * (t + 68.12963));
    var eps = 87.740 - 0.40008 * t + 9.398e-4 * t * t - 1.410e-6 * t * t * t, T = t + KELVIN;
    return [1.82483e6 * Math.sqrt(rho) / Math.pow(eps * T, 1.5), 50.2916 * Math.sqrt(rho) / Math.sqrt(eps * T)];
  }

  // lg γ eines gelösten Teilchens; u ist die Wurzel aus der Ionenstärke, dh das Paar aus debye()
  function lgGamma(id, u, dh) {
    var sp = L.db.species[id], z = sp.charge, par = sp.gamma, I;
    u = Math.min(u, Math.sqrt(I_MAX)); I = u * u;
    if (!z) return (par ? par[1] : 0.1) * I;
    if (par) return -dh[0] * z * z * u / (1 + dh[1] * par[0] * u) + par[1] * I;
    if (I > I_DAVIES) { I = I_DAVIES; u = Math.sqrt(I); }
    return -dh[0] * z * z * (u / (1 + u) - 0.3 * I);
  }

  function strength(v, vol) {     // Ionenstärke in mol/L: die halbe Summe aus Konzentration mal Ladung im Quadrat
    var sum = 0, id, sp;
    for (id in v.n) { sp = L.db.species[id]; if (sp.phase === "aq" && sp.charge && v.n[id] > 0) sum += sp.charge * sp.charge * v.n[id]; }
    return sum / (2 * vol);
  }

  // Sucht die Stelle u, an der ein Ergebnis zu seiner eigenen Annahme passt: rootOf(attempt(u)) = u. attempt(u, last) rechnet mit
  // der Annahme u (last: das vorige Ergebnis, als Startwert) und gibt null zurück, wenn das scheitert. Zurück kommt { u, out, ok }:
  // out ist das Ergebnis bei u, ok ist false, wenn ein Versuch scheiterte (dann bleibt es beim letzten gelungenen).
  function selfConsistent(u, attempt, rootOf) {
    var out = attempt(u, null), trial, lo = 0, hi = Infinity, prev = null, round, f, g, cand, width = Infinity;
    for (round = 0; out; round++) {
      f = rootOf(out); g = f - u;
      if (Math.abs(g) < U_TOL) break;                            // die Annahme ist die des Ergebnisses
      if (g > 0) lo = Math.max(lo, u); else hi = Math.min(hi, u);
      if (hi - lo < U_TOL) break;
      // Der nächste Versuch: die Sekante durch die letzten beiden Punkte, sonst das Ergebnis selbst. Führt das aus der Klammer
      // [lo, hi] heraus oder schrumpft sie zu langsam, wird sie halbiert: Das kann nicht scheitern.
      cand = prev && g !== prev.g ? u - g * (u - prev.u) / (g - prev.g) : f;
      if (!(cand > lo && cand < hi)) cand = f;
      if (!(cand > lo && cand < hi) || (round % 3 === 2 && hi < Infinity && hi - lo > 0.5 * width)) cand = hi < Infinity ? (lo + hi) / 2 : f;
      if (round % 3 === 2) width = hi - lo;
      prev = { u: u, g: g };
      trial = round < 200 ? attempt(cand, out) : null;
      if (!trial) return { u: u, out: out, ok: false };
      u = cand; out = trial;
    }
    return { u: u, out: out, ok: true };
  }

  // lg γ für die Teilchen eines Gefäßes, so wie es gerade ist: eine Funktion id → lg γ. Im idealen Modell überall 0.
  function gammas(v, vol) {
    var u, dh;
    if (!v.real || !(vol > 0)) return function () { return 0; };
    u = Math.sqrt(strength(v, vol)); dh = debye(v.T);
    return function (id) { return lgGamma(id, u, dh); };
  }

  // Aktivitätskoeffizient eines gelösten Teilchens in einem Gefäß; 1 im idealen Modell und ohne Flüssigkeit
  function gamma(lab, vesselId, id) {
    var v = vessel(lab, vesselId), vol = v ? volume(v) : 0;
    return v && L.db.species[id] && L.db.species[id].phase === "aq" ? Math.pow(10, gammas(v, vol)(id)) : 1;
  }

  // Gleichgewichtskonstante bei der Temperatur T (in K) nach van 't Hoff; h: Reaktionsenthalpie in kJ/mol oder null
  function shift(logK, h, T) {
    return logK - (h == null ? 0 : h * 1000 / (R * LN10) * (1 / T - 1 / (T_REF + KELVIN)));
  }

  // Brei: Es ist mehr gelöst, als sich in so wenig Flüssigkeit lösen kann (ein Tropfen auf einem Rückstand, die letzte Lauge
  // beim Eindampfen). Mit einem Brei wird nicht gerechnet: Er bleibt, wie er ist, bis mehr Flüssigkeit dazukommt oder alles trocken ist.
  function thick(v, vol) {
    var sum = 0, id;
    if (!(vol > 0)) return false;
    for (id in v.n) if (L.db.species[id].phase === "aq") sum += v.n[id];
    return sum > CRUST * vol;
  }

  // Auflösung eines Stücks aus dem Regal nach seinem Geschwindigkeitsgesetz, in mol/s: k(T) · Oberfläche · Konzentrationen
  function dissolving(v, s, conc) {
    var rate = s.eq.rate, k = rate.k * Math.exp(-rate.Ea * 1000 / R * (1 / (v.T + KELVIN) - 1 / (T_REF + KELVIN))), surface = 0, id;
    v.lumps.forEach(function (l) { if (l.id === s.id && !l.made && l.n > 0) surface += l.a0 * Math.pow(l.n / l.n0, l.p); });
    for (id in rate.order) k *= Math.pow(conc(id), rate.order[id]);
    return k * surface;
  }

  // Gleichgewichte einstellen. In der Lösung (Säure-Base, Komplexe) sofort;
  // Niederschläge wachsen und lösen sich mit etwas Zeit auf ihr Gleichgewicht zu.
  // Ein Stück aus dem Regal, dessen Auflösung ein Geschwindigkeitsgesetz hat (Marmor in Säure), nimmt daran erst in einer zweiten
  // Stufe teil: Wohin es geht, sagt das Gleichgewicht, wie schnell, das Gesetz. So hält es einen Niederschlag daneben nicht auf.
  // Gibt true zurück, solange sich dabei noch etwas bewegt.
  // mode: "quick" nur die Lösung für sich, ohne dass ein Niederschlag wächst oder sich löst; "still" ohne die zweite Stufe (Aufbau);
  //       "probe" rechnet nur, ob sich etwas bewegen würde, und ändert nichts
  function equilibrate(lab, v, emit, mode) {
    var vol = volume(v), id, phase, aq = [], sol = [], quick = mode === "quick";
    if (!(vol > 0) || !(v.n[WATER] > 0) || thick(v, vol)) return false;
    for (id in v.n) {
      if (!(v.n[id] > 0)) continue;
      phase = L.db.species[id].phase;
      if (phase === "aq") aq.push(id); else if (phase === "s") sol.push(id);
    }
    var sys = system(aq.sort(), sol.sort(), !!v.real);
    if (!sys) return false;

    var T = v.T + KELVIN, ids = sys.ids, nb = sys.basis.length, ns = ids.length, np = sys.solids.length;
    var i, b, k, j, key;
    function at(logK, h) { return shift(logK, h, T); }
    var logK = sys.eqs.map(function (e) { return at(e.logK, heatOf(e)); });
    var logB = ids.map(function (x, index) {
      var row = sys.pivot.indexOf(index), sum = 0;
      if (row < 0) return 0;
      for (k = 0; k < logK.length; k++) sum += sys.rows[row].mix[k] * logK[k];
      return sum;
    });
    var rhs = sys.solids.map(function (s) {
      var h = heatOf(s.eq), sum = at(s.eq.logK * s.eq.f, h == null ? null : h * s.eq.f);
      for (var ion in s.eq.d) sum -= s.eq.d[ion] * logB[ids.indexOf(ion)];
      return sum;
    });
    var old = ids.map(function (x) { return (v.n[x] || 0) / vol; });
    var cur = sys.solids.map(function (s) { return (v.n[s.id] || 0) / vol; });
    // held: Stücke mit Geschwindigkeitsgesetz, in mol/L; own: was ohne sie an Feststoff da ist
    var held = sys.solids.map(function (s) {
      var sum = 0;
      if (s.eq.rate) v.lumps.forEach(function (l) { if (l.id === s.id && !l.made) sum += l.n; });
      return sum / vol;
    });
    var own = cur.map(function (value, index) { return held[index] > 0 ? Math.max(0, value - held[index]) : value; });
    var staged = held.some(function (value) { return value > 0; });
    var dissolved = new Array(nb), x = new Array(nb), cold = new Array(nb), warm = lab.cache[v.id] || {};
    function sumOf(conc) {          // Gesamtmenge je Grundteilchen in der Lösung: eine Summe, keine Differenz, die sich auslöschen könnte
      return sys.basis.map(function (q, index) {
        var sum = 0;
        for (var j2 = 0; j2 < ns; j2++) sum += sys.a[j2][index] * conc[j2];
        return sum;
      });
    }
    dissolved = sumOf(old);
    for (b = 0; b < nb; b++) {
      id = ids[sys.basis[b]];
      x[b] = id in warm && warm[id] > -60 ? warm[id] : Math.log10(Math.max(old[sys.basis[b]], 1e-12));
      cold[b] = Math.log10(Math.max(old[sys.basis[b]], 1e-12));        // ein Startwert, der nur vom jetzigen Inhalt ausgeht
    }

    // Reales Modell: Bei angenommener Ionenstärke u² sind die Aktivitätskoeffizienten feste Zahlen, die sich in die Konstanten
    // ziehen lassen; dann rechnen die Stufen 1 bis 4 wie im idealen Modell. Gesucht ist die Ionenstärke, die zu ihrem eigenen
    // Ergebnis passt: eine Gleichung mit einer Unbekannten.
    var real = !!v.real, dh = real ? debye(v.T) : null;
    var zz = real ? ids.map(function (q) { var z = L.db.species[q].charge; return z * z; }) : null;
    function attempt(u, x0) {
      var B = logB, right = rhs, fails = 0, lg;
      if (real) {
        lg = ids.map(function (q) { return lgGamma(q, u, dh); });
        B = logB.map(function (value, index) {
          var sum = value - lg[index];
          for (var q = 0; q < nb; q++) sum += sys.a[index][q] * lg[sys.basis[q]];
          return sum;
        });
        right = rhs.map(function (value, index) {
          for (var q = 0; q < nb; q++) value -= sys.solids[index].comp[q] * lg[sys.basis[q]];
          return value;
        });
      }
      // 1. die Lösung für sich, mit den Feststoffen, wie sie gerade sind
      // Der gemerkte Startwert kann unpassend sein (das Gefäß lief leer und bekam etwas ganz anderes): dann noch einmal von vorn
      var state = solve(sys, B, dissolved, x0, [], right, []) || solve(sys, B, dissolved, cold, [], right, []);
      if (!state) return null;
      var next = own.slice(), moving = false, need = false, slow = 0, goal, gap, part, target, again, plain = state, bound = 0, base, all, made = null, shelf = null, j;
      for (k = 0; k < np; k++) if (own[k] > 0 || saturation(sys, state.x, right, k) > 1e-9) need = true;
      if (need && !quick) {
        // 2. wohin es will: das volle Gleichgewicht mit Niederschlägen
        goal = balance(sys, B, right, dissolved, state.x, own);
        if (!goal) fails++;
        else {
          for (k = 0; k < np; k++) {
            gap = goal.s[k] - own[k];
            if (!(Math.abs(gap) > 1e-4 * Math.max(goal.s[k], own[k]) + 1e-12)) continue;
            part = gap > 0 ? GROW : held[k] > 0 ? MELT : pace(v, sys.solids[k].id);
            // Was dabei langsamer überginge, als man sehen kann (REST), gilt als angekommen: sonst hielte ein Niederschlag,
            // dem eine unmerklich langsame Reaktion Stoff nachliefert, das Gefäß für immer in Bewegung.
            if (Math.abs(gap) * vol / part > REST) slow = Math.max(slow, part);
          }
          if (!slow) {                                   // angekommen: der Zustand des Gleichgewichts selbst gilt
            next = goal.s.slice();
            state = goal;
          } else {
            // 3. ein Stück des Wegs, für alle Feststoffe derselbe Bruchteil. So kann sich ein Niederschlag in einen anderen
            //    umwandeln: zwischen dem Zustand jetzt und dem Gleichgewicht ist jede Mischung der beiden möglich.
            part = 1 - Math.exp(-DT / slow);
            target = sumOf(goal.c);
            again = solve(sys, B, dissolved.map(function (value, index) { return value + part * (target[index] - value); }), state.x, [], right, []);
            if (!again) fails++;
            else {
              for (k = 0; k < np; k++) next[k] = own[k] + part * (goal.s[k] - own[k]);
              state = again;
              moving = true;
            }
          }
        }
      }
      if (staged) {
        // 4. die Stücke mit Geschwindigkeitsgesetz, jedes für sich: das Gleichgewicht mit diesem Stück als Ziel, und davon so viel,
        //    wie sein Gesetz in diesem Schritt erlaubt. Was dabei mitgeht (Gips, während sich Marmor in Schwefelsäure löst), geht im
        //    selben Anteil mit. Die anderen Stücke bleiben so lange, wie sie sind: ein träges hält ein flinkes nicht auf.
        made = next.slice();                                     // Niederschlag je Feststoff in mol/L, nach der ersten Stufe
        shelf = held.slice();                                    // was noch in den Stücken steckt
        if (!quick && mode !== "still") {
          for (j = 0; j < np; j++) {
            if (!(held[j] > 0)) continue;
            all = made.map(function (value, index) { return index === j ? value + shelf[j] : value; });
            base = sumOf(state.c);
            goal = balance(sys, B, right, base, state.x, all);
            if (!goal) { fails++; continue; }
            gap = goal.s[j] - all[j];
            if (!(gap < -1e-12)) continue;
            part = dissolving(v, sys.solids[j], function (ion) { return ids.indexOf(ion) < 0 ? 0 : state.c[ids.indexOf(ion)]; });
            bound = shelf[j] * vol;                                // so viel steckt noch in den Stücken
            // Ein Rest von einem Millionstel geht in diesem Schritt ganz auf, wenn die Lösung ihn lösen kann.
            if (goal.s[j] <= 0 && bound < 1e3 * dust(v, sys.solids[j].id)) part = 1;
            // Unmerklich langsam (keine Blasen, und das Stück wird nicht sichtbar kleiner): es bleibt liegen.
            else if (!(part > REST) || (part < SLOW && part < 1e-4 * bound)) continue;
            else part = Math.min(1, part * DT / (-gap * vol));
            target = sumOf(goal.c);
            again = part >= 1 ? goal : solve(sys, B, base.map(function (value, index) { return value + part * (target[index] - value); }), state.x, [], right, []);
            if (!again) { fails++; continue; }
            for (k = 0; k < np; k++) {
              gap = part * (goal.s[k] - all[k]);
              if (k !== j) made[k] = Math.max(0, made[k] + gap);
              else {
                shelf[j] += gap;
                if (shelf[j] < 0) { made[j] = Math.max(0, made[j] + shelf[j]); shelf[j] = 0; }      // mehr, als in den Stücken steckt, kommt vom Niederschlag
              }
            }
            if (part >= 1 && goal.s[j] <= 0) { shelf[j] = 0; made[j] = 0; }
            state = again;
            moving = true;
          }
        }
        next = made.map(function (value, index) {
          return held[index] > 0 && value === own[index] && shelf[index] === held[index] ? cur[index] : value + shelf[index];
        });
        bound = 0;
      }
      return { state: state, next: next, moving: moving, made: made, shelf: shelf, plain: plain, fails: fails };
    }
    function rootOf(found) {      // Wurzel aus der Ionenstärke eines Ergebnisses (zum System gehört jedes gelöste Teilchen des Gefäßes)
      var sum = 0;
      for (var q = 0; q < ns; q++) sum += zz[q] * found.state.c[q];
      return Math.sqrt(sum / 2);
    }
    var out, found;
    if (real) {
      // Start bei der Ionenstärke, die das Gefäß gerade hat: Hat sich nichts geändert, genügt ein Versuch
      found = L.selfConsistent(Math.sqrt(strength(v, vol)), function (at, last) { return attempt(at, last ? last.state.x : x); }, rootOf);
      out = found.out;
      if (out && !found.ok) out.fails++;                         // es bleibt beim letzten Ergebnis; gezählt wird es als nicht berechnet
    } else out = attempt(0, x);
    if (!out) { lab.failed = (lab.failed || 0) + 1; return false; }
    if (out.fails) lab.failed = (lab.failed || 0) + out.fails;
    var state = out.state, next = out.next, moving = out.moving, made = out.made, shelf = out.shelf, plain = out.plain, bound = 0;
    if (mode === "probe") return moving;

    // Feststoffe mit Kristallwasser binden Wasser. Reicht es dafür nicht, bleibt die Lösung in diesem Schritt übersättigt.
    for (k = 0; k < np; k++) bound += (next[k] - cur[k]) * vol * sys.solids[k].hydrogen / 2;
    if (bound > 0.5 * v.n[WATER]) { next = cur.slice(); state = plain; moving = false; made = null; }

    // Ergebnis eintragen; das Wasser nimmt auf oder gibt ab, was an Wasserstoff übrig ist
    var c = state.c, change = new Array(ns), hydrogen = 0, ds, xi, row, e;
    warm = lab.cache[v.id] = {};
    for (b = 0; b < nb; b++) warm[ids[sys.basis[b]]] = state.x[b];
    for (i = 0; i < ns; i++) {
      change[i] = (c[i] - old[i]) * vol;
      hydrogen += change[i] * sys.hydrogen[i];
      if (c[i] * vol > 1e-300) v.n[ids[i]] = c[i] * vol; else delete v.n[ids[i]];
    }
    for (k = 0; k < np; k++) {
      if (next[k] === cur[k]) continue;
      id = sys.solids[k].id; e = sys.solids[k].eq;
      if (made && held[k] > 0) {
        // Stücke mit Geschwindigkeitsgesetz neben einem Niederschlag desselben Stoffs: jeder Teil wird für sich gebucht.
        ds = (made[k] - own[k]) * vol;                         // der Niederschlag: wächst oder löst sich
        xi = (shelf[k] - held[k]) * vol;                       // die Stücke: lösen sich nach ihrem Gesetz
        if (made[k] <= 1e-15) ds = -fresh(v, id);              // alles geht in Lösung: genau das, was da ist, ohne Rest durch Rundung
        if (shelf[k] <= 0) { xi = 0; v.lumps.forEach(function (l) { if (l.id === id && !l.made) xi -= l.n; }); }
        hydrogen += (ds + xi) * sys.solids[k].hydrogen;
        if (ds > 0) growSolid(v, id, ds); else if (ds < 0) takeSolid(v, id, -ds, emit, "made");
        if (xi > 0) growSolid(v, id, xi); else if (xi < 0) takeSolid(v, id, -xi, emit, "shelf");
        if (ds > 0 && !v.flag.solid[id] && made[k] > SEEN) {
          v.flag.solid[id] = true;
          if (emit) emit({ key: "solid", vessel: v.id, species: id, color: solidColor(id), grown: !!v.flag.boil });
        } else if (ds < 0 && v.flag.solid[id] && made[k] < SEEN) {
          delete v.flag.solid[id];
          if (emit) emit({ key: "dissolved", vessel: v.id, species: id, color: solidColor(id) });
        }
        for (key in e.d) change[ids.indexOf(key)] += e.d[key] * (ds + xi);
        tally(v, e, -(ds + xi) * e.f);
        continue;
      }
      ds = next[k] === 0 ? -(v.n[id] || 0) : (next[k] - cur[k]) * vol;     // mol Feststoff mehr (Fällung) oder weniger
      hydrogen += ds * sys.solids[k].hydrogen;
      if (ds > 0) {
        growSolid(v, id, ds);
        if (!v.flag.solid[id] && next[k] > SEEN) {
          v.flag.solid[id] = true;
          // grown: beim Eindampfen entstanden, also Kristalle und kein Niederschlag aus einer Fällung
          if (emit) emit({ key: "solid", vessel: v.id, species: id, color: solidColor(id), grown: !!v.flag.boil });
        }
      } else {
        if (v.flag.solid[id] && next[k] < SEEN) {       // gemeldet wird, was man sieht: hier ist nichts mehr zu sehen
          delete v.flag.solid[id];
          if (emit) emit({ key: "dissolved", vessel: v.id, species: id, color: solidColor(id) });
        }
        takeSolid(v, id, -ds, emit);
      }
      // was dabei in Lösung ging oder sie verließ, zählt nicht zu den Gleichgewichten in der Lösung
      for (key in e.d) change[ids.indexOf(key)] += e.d[key] * ds;
      tally(v, e, -ds * e.f);
    }
    v.n[WATER] -= hydrogen / 2;
    for (j = 0; j < sys.eqs.length; j++) {
      xi = 0;
      for (row = 0; row < sys.rows.length; row++) xi += change[sys.pivot[row]] * sys.rows[row].mix[j];
      tally(v, sys.eqs[j], xi);
    }
    return moving;
  }

  // ------------------------------------------------------------------ Reaktionen mit Geschwindigkeit

  function area(v, id) {          // Oberfläche eines Feststoffs in cm²
    var sum = 0;
    v.lumps.forEach(function (l) { if (l.id === id && l.n > 0) sum += l.a0 * Math.pow(l.n / l.n0, l.p); });
    return sum;
  }

  // only: "made" nimmt nur vom Niederschlag, "shelf" nur von den Stücken aus dem Regal; ohne Angabe von allem
  function takeSolid(v, id, amount, emit, only) {
    var left = amount, round, lumps, whole, total = 0, made = true;
    v.lumps.forEach(function (l) { if (l.id === id && !l.made) made = false; });
    // nach Oberfläche verteilen; was ein Stück nicht mehr hergibt, kommt von den übrigen
    for (round = 0; round < 4 && left > 0; round++) {
      lumps = v.lumps.filter(function (l) { return l.id === id && l.n > 0 && (!only || (only === "made") === !!l.made); });
      if (!lumps.length) break;
      whole = 0;
      lumps.forEach(function (l) { whole += l.a0 * Math.pow(l.n / l.n0, l.p); });
      lumps.map(function (l) {
        return left * (whole > 0 ? l.a0 * Math.pow(l.n / l.n0, l.p) / whole : 1 / lumps.length);
      }).forEach(function (want, i) {
        var part = Math.min(lumps[i].n, want);
        lumps[i].n -= part;
        left -= part;
      });
    }
    v.lumps = v.lumps.filter(function (l) { return l.n > 1e-300; });      // wie überall: darunter ist nichts mehr da
    v.lumps.forEach(function (l) { if (l.id === id) total += l.n; });
    if (total > 0) v.n[id] = total;
    else {
      delete v.n[id];
      delete v.flag.solid[id];
      if (emit && !made) emit({ key: "gone", vessel: v.id, species: id });
    }
  }

  function dust(v, id) {          // so wenig Feststoff gilt als Rest, der im selben Schritt mit aufgeht
    var sum = 0;
    v.lumps.forEach(function (l) { if (l.id === id) sum += l.n0; });
    return sum * 1e-9;
  }

  // Feststoff, der im Gefäß entsteht: ein Niederschlag. settled: der Anteil, der sich schon abgesetzt hat.
  function growSolid(v, id, amount) {
    var lump = null;
    v.lumps.forEach(function (l) { if (l.id === id && l.made) lump = l; });
    if (!lump) v.lumps.push((lump = { id: id, n: 0, n0: 0, a0: 0, p: 2 / 3, made: true, settled: 0 }));
    lump.settled = lump.n + amount > 0 ? lump.settled * lump.n / (lump.n + amount) : 0;     // der neue schwebt noch
    lump.n += amount;
    if (lump.n > lump.n0) { lump.n0 = lump.n; lump.a0 = 100 * lump.n0 * species(id).M; }
    v.n[id] = (v.n[id] || 0) + amount;
  }

  function fresh(v, id) {          // was von einem Feststoff im Gefäß entstanden ist (ohne die Stücke aus dem Regal), in mol
    var sum = 0;
    v.lumps.forEach(function (l) { if (l.id === id && l.made) sum += l.n; });
    return sum;
  }

  // Geschwindigkeit in mol/s: k(T) mal Oberfläche (oder Volumen) mal Konzentrationen
  function speed(v, r, vol) {
    var rate = r.rate, id, s;
    var k = rate.k * Math.exp(-rate.Ea * 1000 / R * (1 / (v.T + KELVIN) - 1 / (T_REF + KELVIN)));
    k *= rate.surface ? area(v, rate.surface) : vol;
    for (id in rate.order) {
      s = L.db.species[id];
      k *= Math.pow((s.phase === "aq" || id === WATER) && vol > 0 ? (v.n[id] || 0) / vol : 0, rate.order[id]);
    }
    return k;
  }

  function limit(v, r) {          // größter möglicher Umsatz in mol
    var most = Infinity, id;
    // needs: was da sein muss, ohne verbraucht zu werden (Schwefelsäure löst sich nur, soweit Wasser sie aufnimmt)
    if (r.rate.needs) {                                        // was schon umgesetzt ist, hat seinen Anteil davon schon gebunden
      var done = Infinity;
      if (r.rate.bound) { done = 0; r.rate.bound.forEach(function (b) { done += v.n[b] || 0; }); }      // woran das schon Umgesetzte zu erkennen ist
      else r.right.forEach(function (t) { done = Math.min(done, (v.n[t.id] || 0) / t.n); });
      for (id in r.rate.needs) most = Math.min(most, Math.max(0, (v.n[id] || 0) / r.rate.needs[id] - (isFinite(done) ? done : 0)));
    }
    r.left.forEach(function (t) {
      if (AIR[t.id] && !(v.n[t.id] > 0)) return;               // kommt aus der Luft und geht nicht aus
      most = Math.min(most, (v.n[t.id] || 0) / t.n);
    });
    return most;
  }

  function fuel(r) { return r.rate.surface || r.left[0].id; }

  // Ob in einem Gefäß etwas bereitsteht, das von selbst loslaufen wird: eine Reaktion oder ein Gas, das ausperlen will
  // Umsatz einer sofortigen Reaktion bis zu ihrem Gleichgewicht: so weit, bis der Quotient der Konzentrationen K erreicht.
  // Ohne logK, oder in einem Brei, läuft sie, bis ein Ausgangsstoff verbraucht ist (most). Die Rückreaktion gibt es nicht.
  function upTo(v, r, vol, most) {
    var lo = 0, hi = most, mid, i, lg;
    if (r.logK == null || !(vol > 0)) return most;
    lg = gammas(v, vol);                                       // im realen Modell zählt die Aktivität
    function over(x) {                                         // läge der Quotient nach dem Umsatz x über K?
      var sum = -r.logK, id, n;
      for (id in r.nu) {
        if (L.db.species[id].phase !== "aq") continue;         // Feststoffe, Wasser und Gase zählen mit 1
        n = (v.n[id] || 0) + r.nu[id] * x;
        sum += r.nu[id] * (Math.log10(n / vol) + lg(id));
      }
      return sum > 0;
    }
    for (i = 0; i < 60; i++) { mid = (lo + hi) / 2; if (over(mid)) hi = mid; else lo = mid; }
    return lo;
  }

  // Was eine sofortige Reaktion in diesem Augenblick umsetzt, in mol
  function burst(v, r, vol) {
    var most = limit(v, r);
    return most > SPARE && isFinite(most) ? upTo(v, r, vol, most) : 0;
  }

  function ready(lab, v, closed) {
    var wet = volume(v) > 0, vol = thick(v, volume(v)) ? 0 : volume(v), liquid = solution(v);
    if (liquid && metalsIn(v).some(function (id) { return corrode(lab, v, liquid, lumpFace(v, id), null, true) > REST; })) return true;
    return L.db.reactions.some(function (r) {
      if (r.spark || !(limit(v, r) > 0) || (r.rate.dry && wet)) return false;
      if (r.rate.ignite != null && (wet || closed || !(v.lit[r.key] || v.T >= r.rate.ignite))) return false;
      // Eine sofortige Reaktion zählt, wenn sie in einem Rechenschritt merklich etwas umsetzt. Fehlt ihr ein Ausgangsstoff bis auf
      // Spuren, die ein Gleichgewicht nachliefert (H+ in neutraler Lösung), läuft sie unmerklich weiter und hält die Uhr nicht an.
      return r.rate.fast ? wet && burst(v, r, vol) > Math.max(SPARE, REST * DT) : speed(v, r, vol) > REST;
    }) || above(v, vol).some(function (g) { return g.p > P_AIR * 1.0001; });
  }

  // closed: das Gefäß ist verschlossen; dann fehlt einer Verbrennung die Luft
  function kinetics(v, emit, closed) {
    var wet = volume(v) > 0, vol = thick(v, volume(v)) ? 0 : volume(v), list = [], fast = [];      // in einem Brei zählt keine Konzentration
    L.db.reactions.forEach(function (r) {
      var can = !r.spark && !(r.rate.dry && wet) && (r.rate.fast ? wet : limit(v, r) > 0);
      if (r.rate.ignite != null) {
        // Verbrennung: beginnt bei der Zündtemperatur und hält sich dann selbst in Gang; unter Wasser und ohne Luft brennt nichts
        if (can && !wet && !closed && (v.lit[r.key] || v.T >= r.rate.ignite)) {
          if (!v.lit[r.key]) { v.lit[r.key] = true; if (emit) emit({ key: "ignite", vessel: v.id, species: fuel(r) }); }
        } else {
          if (v.lit[r.key]) { delete v.lit[r.key]; if (emit) emit({ key: "fireEnd", vessel: v.id, species: fuel(r) }); }
          can = false;
        }
      }
      if (can) (r.rate.fast ? fast : list).push(r);
    });
    // Was sofort abläuft, zählt mit, wenn seine Ausgangsstoffe da sind oder in diesem Schritt entstehen können: Zu Beginn des
    // Schritts ist von dem Iod, das Thiosulfat abfängt, nichts da – es entsteht erst.
    fast = fast.filter(function (r) { return list.length || limit(v, r) > SPARE; });
    if (!list.length && !fast.length) return;
    // Teilschritte so fein, dass je Teilschritt höchstens 5 % eines Ausgangsstoffs umgesetzt werden
    var worst = 0, done = {}, grew = {}, sub, s, made, any = false;
    list.forEach(function (r) {
      var x = speed(v, r, vol) * DT;
      r.left.forEach(function (t) { if (t.id !== WATER && v.n[t.id] > 0) worst = Math.max(worst, x * t.n / v.n[t.id]); });
    });
    // Was sofort abläuft, kommt in jedem Teilschritt nach allem anderen an die Reihe und nimmt, was da ist:
    // so bleibt von dem, was eine langsame Reaktion liefert, nichts stehen.
    list = list.concat(fast);
    sub = Math.min(40, Math.max(1, Math.ceil(worst / 0.05)));
    for (s = 0; s < sub; s++) list.forEach(function (r) {
      var most = limit(v, r), x = r.rate.fast ? burst(v, r, vol) : Math.min(speed(v, r, vol) * DT / sub, most), solid = r.rate.surface, all, id, delta, phase;
      if (!(x > 0)) return;
      any = true;
      if (solid && r.nu[solid] < 0) {
        all = (v.n[solid] || 0) / -r.nu[solid];
        if (all <= most && (all - x) * -r.nu[solid] < dust(v, solid)) x = all;
      }
      for (id in r.nu) {
        delta = r.nu[id] * x; phase = L.db.species[id].phase;
        if (delta < 0 && AIR[id] && !(v.n[id] >= -delta)) v.taken[id] = (v.taken[id] || 0) - delta;     // aus der Luft
        else if (phase === "s" && delta < 0) takeSolid(v, id, -delta, emit);
        else if (phase === "s") { growSolid(v, id, delta); grew[id] = true; }
        else if ((v.n[id] = (v.n[id] || 0) + delta) < TRACE) delete v.n[id];
      }
      done[r.key] = (done[r.key] || 0) + x;
    });
    // Feststoff, der in der Flüssigkeit entsteht, trübt sie: gemeldet wird er, sobald man ihn sieht. colloid: er bleibt in der Schwebe
    if (vol > 0) for (made in grew) {
      if (v.flag.solid[made] || !(fresh(v, made) / vol > SEEN)) continue;        // was als Stück aus dem Regal daliegt, trübt nicht
      v.flag.solid[made] = true;
      if (emit) emit({ key: "solid", vessel: v.id, species: made, color: solidColor(made), grown: false, colloid: !!L.db.species[made].colloid });
    }
    list.forEach(function (r) {
      var x = done[r.key], h;
      if (!x) return;
      if (r.rate.ignite == null) { tally(v, r, x); return; }
      // Verbrennung: Der größte Teil der Wärme geht mit Licht und heißen Gasen fort. Das Gefäß heizt die Flamme wie ein Brenner,
      // mit ihrer Temperatur (fire.T) als Grenze und höchstens mit dem, was die Reaktion freisetzt.
      h = heatOf(r);
      tally(v, r, x, true);
      if (h != null) v.q += Math.min(Math.abs(x * h) * 1000, spec(v).heat * Math.max(0, ((r.fire && +r.fire.T) || 800) - v.T) * DT);
    });
    if (any) v.dirty = true;
  }

  // ------------------------------------------------------------------ Elektrochemie

  var I_REF = 1e-3;           // A/cm²: bei dieser Stromdichte gilt die Überspannung eines Redoxpaars
  var J_MAX = 2;              // A/cm²: mehr trägt keine Oberfläche
  var K_FILM = 1.2e-3;        // cm/s: Stoffübergang aus der Lösung an eine Oberfläche für D = 10⁻⁹ m²/s; er wächst mit D^(2/3) …
  var EA_FILM = 20;           // kJ/mol: … und mit der Temperatur
  var CUT = 1e-10;            // mol Elektronen je s: was langsamer abläuft, findet nicht statt

  // Volumen der Lösung in L, wenn in dem Gefäß eine steht, mit der sich rechnen lässt; sonst 0
  function solution(v) {
    var vol = volume(v);
    return !v.broken && vol > 0 && v.n[WATER] > 0 && !thick(v, vol) ? vol : 0;
  }

  // Die Vorgänge, die an einer Oberfläche ablaufen können: je Redoxpaar die Oxidation (a) und die Reduktion (k), soweit die Ausgangsstoffe da sind.
  // face: { area in cm², top: Material der Oberfläche, has(id): ob dieser Feststoff an ihr vorliegt, skip: Reduktionen, die entfallen }
  // Jede Richtung trägt den Strom i = lim / (1 + exp(−x)) mit x = ±(φ − E0)/b + q. Bei kleinem Antrieb wächst er exponentiell
  // mit dem Potential φ (Butler-Volmer mit halbem Durchtrittsfaktor: b = 2RT/F; Ordnung je Ausgangsstoff: Koeffizient durch Elektronenzahl,
  // so dass im Gleichgewicht die Nernst-Gleichung gilt). Bei großem Antrieb begrenzt ihn der Nachschub aus der Lösung (lim).
  // ghost: Diese Richtung bräuchte einen Feststoff, der an der Oberfläche (noch) nicht vorliegt. Sie zählt nur als Gegenspieler:
  // ein Metall scheidet sich erst ab, wenn die Abscheidung seine eigene Auflösung überwiegt.
  function processes(v, vol, face) {
    var T = v.T + KELVIN, b = 2 * R * T / FARADAY, out = [], lg = gammas(v, vol);
    var feed = FARADAY * face.area * K_FILM * Math.exp(-EA_FILM * 1000 / R * (1 / T - 1 / (T_REF + KELVIN))) / 1000;
    function reach(id) { var sp = L.db.species[id]; return Math.pow(typeof sp.D === "number" ? sp.D : 1, 2 / 3) * (v.n[id] || 0) / vol; }
    L.db.couples.forEach(function (c) {
      var eta = c.over[face.top] != null ? c.over[face.top] : c.over.default, entry = { c: c, E0: c.E0, a: null, k: null, ghost: 0 }, lacks = { a: false, k: false };
      [[c.red, "a", 1], [c.ox, "k", -1]].forEach(function (dir) {
        var q = Math.log(face.area * I_REF) - eta / b, lim = face.area * J_MAX, ok = true, ghost = false;
        if (dir[2] < 0 && face.skip && face.skip[c.key]) return;
        dir[0].forEach(function (t) {
          var sp = L.db.species[t.id], supply;
          if (!ok || t.id === WATER) return;
          if (sp.phase === "s") { if (!face.has(t.id)) ghost = true; return; }
          if (sp.phase !== "aq" || !(v.n[t.id] > 0)) { ok = false; return; }      // ein Gas steht nicht als Ausgangsstoff bereit
          q += t.n / c.n * (Math.log(v.n[t.id] / vol) + LN10 * lg(t.id));       // Nernst: mit der Aktivität
          supply = reach(t.id);
          (L.db.carriers[t.id] || []).forEach(function (y) { supply += y.n * reach(y.id); });
          lim = Math.min(lim, c.n / t.n * feed * supply);
        });
        if (!ok || !(lim > 0)) return;
        entry[dir[1]] = { q: q - Math.log(lim), lim: lim };
        lacks[dir[1]] = ghost;
      });
      // Fehlt beiden Richtungen ihr Feststoff (Silber und Silberchlorid an einem Stück Zink), gibt es den Vorgang hier nicht;
      // fehlt er einer, braucht sie die andere als wirklichen Vorgang, dessen Gegenspieler sie ist.
      if (lacks.a && lacks.k) return;
      if (lacks.a ? !entry.k : lacks.k ? !entry.a : !entry.a && !entry.k) return;
      entry.ghost = lacks.a ? 1 : lacks.k ? -1 : 0;
      out.push(entry);
    });
    out.b = b;
    return out;
  }

  // Strom einer Richtung beim Potential phi
  function branch(side, x) { return side ? side.lim / (1 + Math.exp(-(x + side.q))) : 0; }

  // Strom einer Oberfläche beim Potential phi in A (positiv: die Oxidation überwiegt) und seine Steigung
  function flowAt(list, phi) {
    var sum = 0, slope = 0, n, p, x, a, k;
    for (n = 0; n < list.length; n++) {
      p = list[n];
      x = (phi - p.E0) / list.b;
      a = branch(p.a, x); k = branch(p.k, -x);
      if (p.ghost && (a - k) * p.ghost > 0) continue;
      sum += a - k;
      slope += ((p.a ? a * (1 - a / p.a.lim) : 0) + (p.k ? k * (1 - k / p.k.lim) : 0)) / list.b;
    }
    return [sum, slope];
  }

  // Nullstelle einer steigenden Funktion fn(x) → [Wert, Steigung] zwischen lo und hi.
  // Von einem Schätzwert aus (dem Ergebnis des letzten Schritts) wird eng eingegrenzt, sonst grob halbiert; dann Newton, abgesichert durch Halbieren.
  // Sie hört erst auf, wenn sich die Stelle nicht mehr bewegt (10⁻¹² V), nicht schon bei einem kleinen Strom: so ist das Ergebnis
  // auch dort eindeutig, wo nur winzige Ströme fließen (eine Graphit-Elektrode in Salzlösung), gleich von welchem Schätzwert aus.
  function rootOf(fn, lo, hi, guess) {
    var x, r, next, k, step = 0.01;
    if (guess != null && guess > lo && guess < hi) {
      r = fn(guess);
      next = r[1] > 0 ? guess - r[0] / r[1] : NaN;
      if (Math.abs(next - guess) < 1e-12) return next;           // der Schätzwert stimmt schon
      if (r[0] > 0) {
        hi = guess;
        while (guess - step > lo && fn(guess - step)[0] > 0) { hi = guess - step; step *= 4; }
        if (guess - step > lo) lo = guess - step;
      } else {
        lo = guess;
        while (guess + step < hi && fn(guess + step)[0] <= 0) { lo = guess + step; step *= 4; }
        if (guess + step < hi) hi = guess + step;
      }
    } else for (k = 0; k < 14; k++) { x = (lo + hi) / 2; if (fn(x)[0] > 0) hi = x; else lo = x; }
    x = (lo + hi) / 2;
    for (k = 0; k < 200; k++) {
      r = fn(x);
      if (r[0] > 0) hi = x; else lo = x;
      next = r[1] > 0 ? x - r[0] / r[1] : NaN;
      if (!(next > lo && next < hi)) next = (lo + hi) / 2;
      if (Math.abs(next - x) < 1e-12 || hi - lo < 1e-12) return next;
      x = next;
    }
    return x;
  }

  // Was an einer Oberfläche beim Potential phi je Redoxpaar unter dem Strich abläuft, in mol Elektronen je Rechenschritt:
  // { ox: [{ c, e }], red: [{ c, e }], a: Summe der Oxidationen, k: Summe der Reduktionen }
  // Vorgänge, die neben den übrigen nicht ins Gewicht fallen (weniger als ein Milliardstel), bleiben weg.
  function netOf(list, phi) {
    var out = { ox: [], red: [], a: 0, k: 0 }, top = 0;
    list.forEach(function (p) {
      var x = (phi - p.E0) / list.b, i = branch(p.a, x) - branch(p.k, -x), e = Math.abs(i) * DT / FARADAY;
      if (!(e > 0) || (p.ghost && i * p.ghost > 0)) return;
      (i > 0 ? out.ox : out.red).push({ c: p.c, e: e });
      if (e > top) top = e;
    });
    // Wege desselben Redoxsystems laufen nicht gegeneinander: Was ein Weg oxidiert und ein anderer zugleich reduziert, hebt sich auf.
    // (Sonst ginge Zink in Lauge als Zinkat in Lösung und schiede sich über die Spur freier Zink-Ionen gleich wieder ab.)
    out.ox.forEach(function (a) {
      out.red.forEach(function (k) {
        var less;
        if (!a.c.same || a.c.same !== k.c.same || !(a.e > 0) || !(k.e > 0)) return;
        less = Math.min(a.e, k.e);
        a.e -= less; k.e -= less;
      });
    });
    out.ox = out.ox.filter(function (x) { return x.e > 0 && x.e >= 1e-9 * top; });
    out.red = out.red.filter(function (x) { return x.e > 0 && x.e >= 1e-9 * top; });
    out.ox.forEach(function (x) { out.a += x.e; });
    out.red.forEach(function (x) { out.k += x.e; });
    return out;
  }

  // Setzt Vorgänge um. groups: [{ v: Gefäß, face: Oberfläche, steps: [{ c: Paar, s: +1 Oxidation | −1 Reduktion, e: mol Elektronen }] }].
  // Reicht ein Ausgangsstoff nicht, läuft alles um denselben Bruchteil weniger; so bleibt die Ladung ausgeglichen. Zurück: dieser Bruchteil.
  // Von einem gelösten Teilchen darf mehr verbraucht werden, als gerade frei vorliegt, soweit seine Träger es nachliefern
  // (H+ aus Hydrogencarbonat, Zink-Ionen aus dem Zinkat): das Gleichgewicht der Lösung wird gleich danach neu eingestellt.
  function convert(lab, groups, emit) {
    var need = {}, have = {}, part = 1, key, short = [];
    function stock(v, id) {
      var sum = v.n[id] || 0;
      (L.db.carriers[id] || []).forEach(function (y) { sum += y.n * (v.n[y.id] || 0); });
      return sum;
    }
    groups.forEach(function (g) {
      g.steps.forEach(function (st) {
        (st.s > 0 ? st.c.red : st.c.ox).forEach(function (t) {
          var hard = L.db.species[t.id].phase === "s", k = (hard ? "f " + g.face.id : "v " + g.v.id) + " " + t.id;
          need[k] = (need[k] || 0) + t.n * st.e / st.c.n;
          have[k] = hard ? g.face.amount(t.id) : stock(g.v, t.id);
        });
      });
    });
    for (key in need) if (need[key] > 0) part = Math.min(part, have[key] / need[key]);
    if (!(part > 0)) return 0;
    groups.forEach(function (g) {
      g.steps.forEach(function (st) {
        var xi = part * st.e / st.c.n;
        (st.s > 0 ? st.c.red : st.c.ox).forEach(function (t) {
          if (L.db.species[t.id].phase === "s") { g.face.take(t.id, t.n * xi, emit); return; }
          g.v.n[t.id] = (g.v.n[t.id] || 0) - t.n * xi;
          if (g.v.n[t.id] < 0) { if (short.indexOf(g.v) < 0) short.push(g.v); }      // überzogen: die Träger gleichen es aus
          else if (!(g.v.n[t.id] > 1e-22)) delete g.v.n[t.id];
        });
        (st.s > 0 ? st.c.ox : st.c.red).forEach(function (t) {
          if (L.db.species[t.id].phase === "s") g.face.give(t.id, t.n * xi, emit);
          else g.v.n[t.id] = (g.v.n[t.id] || 0) + t.n * xi;
        });
      });
      g.v.dirty = true;
    });
    short.forEach(function (v) {
      var id;
      equilibrate(lab, v, emit, "quick");
      for (id in v.n) if (!(v.n[id] > 0)) { lab.failed = (lab.failed || 0) + 1; break; }      // darf nicht vorkommen: dann stimmt die Anzeige nicht
    });
    return part;
  }

  function stepsOf(net) {
    return net.ox.map(function (x) { return { c: x.c, s: 1, e: x.e }; }).concat(net.red.map(function (x) { return { c: x.c, s: -1, e: x.e }; }));
  }

  // Metalle, die als Stücke im Gefäß liegen
  function metalsIn(v) {
    var seen = {}, out = [];
    v.lumps.forEach(function (l) { if (l.n > 0 && L.db.metals[l.id] && !seen[l.id]) { seen[l.id] = true; out.push(l.id); } });
    return out;
  }

  // Alle Stücke eines Metalls in einem Gefäß als eine Oberfläche
  function lumpFace(v, id) {
    return {
      id: id, top: id, whole: id, area: area(v, id), skip: L.db.metals[id].skip,
      has: function (x) { return x === id; },
      amount: function (x) { return x === id ? v.n[id] || 0 : 0; },
      take: function (x, n, emit) { takeSolid(v, x, n, emit); },
      give: function (x, n, emit) {                              // was sich abscheidet, liegt als neuer Feststoff im Gefäß
        var vol = volume(v);
        growSolid(v, x, n);
        if (!v.flag.solid[x] && vol > 0 && v.n[x] / vol > SEEN) {
          v.flag.solid[x] = true;
          if (emit) emit({ key: "plated", vessel: v.id, species: x, on: id });
        }
      }
    };
  }

  // Eine Oberfläche ohne Strom nach außen (ein Metallstück): Oxidation und Reduktion halten sich die Waage, es stellt sich
  // das Mischpotential ein. Zurück: der Umsatz in mol je s. dry: nur rechnen, nichts umsetzen.
  function corrode(lab, v, vol, face, emit, dry) {
    var list, key = v.id + "/" + face.id, phi, net, e, steps, part, top = 0, rest, used = 0;
    if (!(face.area > 0)) return 0;
    list = processes(v, vol, face);
    if (!list.some(function (p) { return p.a && p.ghost <= 0; }) || !list.some(function (p) { return p.k && p.ghost >= 0; })) return 0;
    phi = rootOf(function (x) { return flowAt(list, x); }, -30, 30, lab.warm[key]);
    lab.warm[key] = phi;
    net = netOf(list, phi);
    e = Math.min(net.a, net.k);                                  // so viele Elektronen gehen von den Oxidationen an die Reduktionen
    if (face.tool) face.tool.phi = phi;
    // Ein Metallstück, von dem nur noch Staub übrig ist (ein Millionstel), geht in diesem Schritt ganz auf. Sonst bliebe ein
    // unsichtbarer Rest liegen, sobald er zu klein ist, um noch merklich zu reagieren.
    rest = face.whole ? face.amount(face.whole) : 0;
    if (rest > 0 && rest < 1e3 * dust(v, face.whole) && e > 0) {
      net.ox.forEach(function (x) { x.c.red.forEach(function (t) { if (t.id === face.whole) used += t.n * x.e / x.c.n; }); });
      if (used > 0 && used * e / net.a < rest) {
        used = rest / (used * e / net.a);                        // so viel schneller, dass der Rest in diesem Schritt aufgeht
        net.ox.forEach(function (x) { x.e *= used; });
        net.red.forEach(function (x) { x.e *= used; });
        net.a *= used; net.k *= used; e *= used;
      }
      rest = -1;                                                 // gilt auch, wenn es dafür zu langsam wäre
    }
    if (!(e / DT > CUT) && rest >= 0) return 0;
    // Der Umsatz in mol je s, gezählt wie in der Liste der Reaktionen: die schnellste Gesamtreaktion aus einer Oxidation und einer Reduktion.
    net.ox.forEach(function (a) {
      net.red.forEach(function (c) {
        var pair = L.db.pairs[a.c.key + ">" + c.c.key];
        top = Math.max(top, (a.e / net.a) * (c.e / net.k) * e / (pair ? pair.times : 1) / DT);
      });
    });
    if (dry) { if (face.done) face.done(stepsOf(net), 1, top); return top; }
    net.ox.forEach(function (x) { x.e *= e / net.a; });
    net.red.forEach(function (x) { x.e *= e / net.k; });
    net.a = net.k = e;
    steps = stepsOf(net);
    part = convert(lab, [{ v: v, face: face, steps: steps }], emit);
    if (face.done) face.done(steps, part, top);
    // für die Liste der Reaktionen und die Wärme: jede Oxidation mit jeder Reduktion zu einer Gesamtreaktion, nach ihren Anteilen
    net.ox.forEach(function (a) {
      net.red.forEach(function (c) {
        var pair = L.db.pairs[a.c.key + ">" + c.c.key];
        if (pair) tally(v, pair, part * (a.e / net.a) * (c.e / net.k) * e / pair.times);
      });
    });
    return part * top;
  }

  var PLATE = { w: 2, len: 6, gap: 0.5 };     // Elektrode: Breite und Länge der Platte, Abstand zum Gefäßboden, in cm
  var COAT = 5e-7;            // mol/cm²: ab so viel sieht man einen Belag auf einer Elektrode
  var LEADS = 0.5;            // Ω: Leitungen und Innenwiderstand der Geräte eines Stromkreises
  var QUIET = 1e-9;           // A: ein kleinerer Strom gilt als keiner

  // Die Elektroden eines Gefäßes, die linke zuerst
  function electrodesIn(lab, vesselId) {
    return lab.tools.filter(function (t) { return t.in === vesselId && L.parts[t.type].electrode; }).sort(function (a, b) { return a.side - b.side; });
  }

  // Eine Elektrode nimmt den freien Platz in ihrem Gefäß: links, sonst rechts. Dort bleibt sie, auch wenn die andere ersetzt wird.
  function seat(lab, t) {
    if (!L.parts[t.type].electrode) return;
    t.side = lab.tools.some(function (o) { return o !== t && o.in === t.in && L.parts[o.type].electrode && o.side === 0; }) ? 1 : 0;
  }

  // Ob an einem Gefäß schon ein Ende einer Salzbrücke hängt
  function bridged(lab, vesselId, but) {
    return lab.tools.some(function (t) { return t !== but && L.parts[t.type].bridge && (t.in === vesselId || t.to === vesselId); });
  }

  // So tief taucht eine Elektrode ein, in cm: die Füllhöhe ohne den Abstand zum Boden, höchstens die Länge der Platte
  function dip(v) {
    var d = spec(v).d;
    return Math.max(0, Math.min(PLATE.len, volume(v) * 1000 / (Math.PI * d * d / 4) - PLATE.gap));
  }

  function massOf(t) {        // Masse einer Elektrode samt Belag in g
    var g = t.n * L.db.species[L.parts[t.type].electrode].M, id;
    for (id in t.coat) g += t.coat[id] * L.db.species[id].M;
    return g;
  }

  // Die Elektrode t im Gefäß v als Oberfläche: ihr Material und was sich darauf abgeschieden hat
  function electrodeFace(v, t) {
    var body = L.parts[t.type].electrode, size = t.n > 0 ? 2 * PLATE.w * dip(v) : 0, top = body, most = COAT * size, id;
    for (id in t.coat) if (t.coat[id] > most) { most = t.coat[id]; top = id; }     // ein dichter Belag bestimmt, wie sich die Oberfläche verhält
    return {
      id: t.id, tool: t, top: top, area: size, skip: (L.db.metals[body] || {}).skip,
      has: function (x) { return (x === body && t.n > 0) || t.coat[x] > 1e-12; },
      amount: function (x) { return (x === body ? t.n : 0) + (t.coat[x] > 1e-12 ? t.coat[x] : 0); },
      take: function (x, n, emit) {                              // vom Belag, oder von der Elektrode selbst
        if (x !== body) {
          if (!((t.coat[x] -= n) > 1e-18)) { delete t.coat[x]; delete t.seen[x]; }
        } else if (!((t.n -= n) > 1e-15)) {
          t.n = 0;
          if (emit) emit({ key: "spent", part: t.id, vessel: v.id });
        }
      },
      give: function (x, n, emit) {
        if (x === body) { t.n += n; return; }
        t.coat[x] = (t.coat[x] || 0) + n;
        if (!t.seen[x] && t.coat[x] > COAT * size) {
          t.seen[x] = true;
          if (emit) emit({ key: "plated", vessel: v.id, part: t.id, species: x });
        }
      },
      // ohne Stromkreis verhält sich die Elektrode wie ein Stück Metall; für die Anzeige zählt, was an ihr umgesetzt wird
      done: function (steps, part, rate) { t.rate = part * rate; bubbles(v, t, steps, part); }
    };
  }

  // Gas, das an einer Elektrode entsteht: für die Blasen an ihr (bub, mol/s) und für das Gefäß (eg, mol in diesem Schritt)
  function bubbles(v, t, steps, part) {
    var sum = 0;
    steps.forEach(function (st) {
      (st.s > 0 ? st.c.ox : st.c.red).forEach(function (x) {
        var n = x.n * part * st.e / st.c.n;
        if (L.db.species[x.id].phase !== "g") return;
        sum += n;
        v.egas = v.egas || {};
        v.egas[x.id] = (v.egas[x.id] || 0) + n;               // je Gas, damit ein lösliches (Chlor) sich zum Teil löst
      });
    });
    t.bub = sum / DT;
    v.eg += sum;
  }

  // Stromkreise: zwei Elektroden im selben Gefäß, oder je eine in zwei Gefäßen, die eine Salzbrücke verbindet.
  // a ist die linke Elektrode; an ihr liegt der Pluspol eines Netzgeräts, solange es nicht umgepolt ist.
  function cellsOf(lab) {
    var cells = [], busy = {};
    lab.vessels.forEach(function (v) {
      var list = electrodesIn(lab, v.id);
      if (list.length === 2) { cells.push({ a: list[0], b: list[1], va: v, vb: v, bridge: null }); busy[v.id] = true; }
    });
    lab.tools.forEach(function (t) {
      var ends, list;
      if (!L.parts[t.type].bridge) return;
      ends = lab.vessels.filter(function (v) { return v.id === t.in || v.id === t.to; });        // in der Reihenfolge auf dem Tisch
      if (ends.length !== 2 || busy[ends[0].id] || busy[ends[1].id]) return;
      list = [electrodesIn(lab, ends[0].id), electrodesIn(lab, ends[1].id)];
      if (list[0].length !== 1 || list[1].length !== 1) return;
      cells.push({ a: list[0][0], b: list[1][0], va: ends[0], vb: ends[1], bridge: t });
      busy[ends[0].id] = busy[ends[1].id] = true;
    });
    return cells;
  }

  function heatOfCouple(c) {      // Enthalpie der Reduktion in kJ/mol; ohne Bildungsenthalpien stattdessen die freie Enthalpie aus E0
    var sum = 0, known = true;
    if (c.h === undefined) {
      c.red.forEach(function (t) { var hf = L.db.species[t.id].Hf; if (typeof hf === "number") sum += t.n * hf; else known = false; });
      c.ox.forEach(function (t) { var hf = L.db.species[t.id].Hf; if (typeof hf === "number") sum -= t.n * hf; else known = false; });
      c.h = known ? sum : -c.n * FARADAY * c.E0 / 1000;
    }
    return c.h;
  }

  // Ein Stromkreis in diesem Rechenschritt: Potentiale der beiden Elektroden, Strom, und (wenn nicht dry) der Umsatz nach Faraday.
  // Zurück: ob der Stromkreis geschlossen ist. Ist er offen, verhält sich jede Elektrode für sich wie ein Stück Metall.
  function runCell(lab, cell, emit, dry) {
    var va = cell.va, vb = cell.vb, a = cell.a, b = cell.b, same = va === vb;
    var volA = solution(va), volB = same ? volA : solution(vb);
    var fa = volA ? electrodeFace(va, a) : null, fb = volB ? electrodeFace(vb, b) : null;
    var devices = lab.tools.filter(function (t) { return L.parts[t.type].circuit && (t.in === va.id || t.in === vb.id); });
    var U = 0, R = LEADS, closed = false, limit = Infinity, la, lb, ra, rb, Rs, pa, pb, I = 0, V, na, nb, q = 0, part = 1, turn, groups, key;
    var out = { a: a.id, b: b.id, I: 0, U: null, closed: false };
    lab.cells.push(out);
    devices.forEach(function (t) {
      var def = L.parts[t.type];
      if (def.circuit === "supply" && t.volts > 0) { U += t.flip ? -t.volts : t.volts; closed = true; limit = Math.min(limit, def.limit); }
      else if (def.circuit === "load") { R += def.ohm; closed = true; }
      else if (def.circuit === "ammeter") closed = true;
    });
    if (!fa || !fb || !(fa.area > 0) || !(fb.area > 0)) return false;       // eine Elektrode taucht nicht ein: kein Stromkreis
    la = processes(va, volA, fa); lb = processes(vb, volB, fb);
    ra = 1 / (conduct(va, volA) * dip(va)); rb = 1 / (conduct(vb, volB) * dip(vb));
    Rs = same ? Math.max(ra, rb) : L.parts[cell.bridge.type].ohm + (ra + rb) / 2;       // Widerstand der Lösung zwischen den Elektroden
    if (closed) {
      // Unbekannt ist das Potential von a. Aus ihm folgt der Strom an a, daraus über die Widerstände das Potential von b;
      // gesucht ist der Wert, bei dem b genau den Strom aufnimmt, den a abgibt.
      key = "cell " + a.id;
      pa = rootOf(function (x) {
        var one = flowAt(la, x), two = flowAt(lb, x + (R + Rs) * one[0] - U);
        return [one[0] + two[0], one[1] + two[1] * (1 + (R + Rs) * one[1])];
      }, -30, 30, lab.warm[key]);
      lab.warm[key] = pa;
      I = flowAt(la, pa)[0];
      pb = pa + (R + Rs) * I - U;
      if (Math.abs(I) > limit) {                                 // das Netzgerät begrenzt den Strom
        I = I > 0 ? limit : -limit;
        pa = rootOf(function (x) { var one = flowAt(la, x); return [one[0] - I, one[1]]; }, -30, 30, pa);
        pb = rootOf(function (x) { var two = flowAt(lb, x); return [two[0] + I, two[1]]; }, -30, 30, pb);
      }
      if (Math.abs(I) < QUIET) I = 0;
    } else {
      pa = rootOf(function (x) { return flowAt(la, x); }, -30, 30, lab.warm[va.id + "/" + a.id]);
      pb = rootOf(function (x) { return flowAt(lb, x); }, -30, 30, lab.warm[vb.id + "/" + b.id]);
    }
    a.phi = pa; b.phi = pb;
    V = pa - pb + I * Rs;                                        // Spannung zwischen den Elektroden, wie sie ein Spannungsmesser sieht
    out.closed = closed; out.U = V;
    if (closed && I) {
      na = netOf(la, pa); nb = netOf(lb, pb);
      q = na.a - na.k;                                           // mol Elektronen, die in diesem Schritt von a durch den Draht nach b gehen
      // b nimmt genau die Elektronen auf, die a abgibt: der Rest der Rechengenauigkeit wird dort ausgeglichen
      if (q >= 0 && nb.k > 0) { key = (q + nb.a) / nb.k; nb.red.forEach(function (x) { x.e *= key; }); nb.k = q + nb.a; }
      else if (q < 0 && nb.a > 0) { key = (nb.k - q) / nb.a; nb.ox.forEach(function (x) { x.e *= key; }); nb.a = nb.k - q; }
      else q = 0;
      turn = Math.max(Math.abs(q), Math.min(na.a, na.k), Math.min(nb.a, nb.k));
      if (!(turn / DT > CUT)) q = 0;                             // zu wenig, um etwas umzusetzen; angezeigt wird der Strom trotzdem
      else {
        groups = [{ v: va, face: fa, steps: stepsOf(na), t: a, phi: pa, sign: 1, net: na }, { v: vb, face: fb, steps: stepsOf(nb), t: b, phi: pb, sign: -1, net: nb }];
        if (!dry) part = convert(lab, groups, emit);
        I *= part; q *= part;
        groups.forEach(function (g) {
          g.t.i = g.sign * I;
          g.t.rate = 0;                                          // der schnellste Vorgang an dieser Elektrode, in mol je s
          g.steps.forEach(function (st) { g.t.rate = Math.max(g.t.rate, part * st.e / st.c.n / DT); });
          bubbles(g.v, g.t, g.steps, part);
          if (dry) return;
          g.v.q += g.sign * g.phi * q * FARADAY;                 // elektrische Arbeit an dieser Elektrode …
          g.steps.forEach(function (st) {
            var xi = part * st.e / st.c.n, hk = (st.s > 0 ? "ox " : "red ") + g.t.id + " " + st.c.key;
            g.v.half[hk] = (g.v.half[hk] || 0) + xi;
            if (xi / DT > 1e-12) g.v.rate[hk] = xi / DT;
            g.v.q += st.s * xi * heatOfCouple(st.c) * 1000;      // … abzüglich dessen, was als chemische Energie gespeichert wird
          });
        });
        if (!dry) {
          va.q += I * I * (same ? Rs : ra / 2) * DT;             // der Strom wärmt die Lösung
          if (!same) {
            vb.q += I * I * rb / 2 * DT;
            // die Salzbrücke gleicht die Ladung aus: Anionen dorthin, wo oxidiert wird, Kationen dorthin, wo reduziert wird
            [[q > 0 ? va : vb, 1], [q > 0 ? vb : va, 0]].forEach(function (end) {
              var id = L.parts[cell.bridge.type].salt[end[1]], n = Math.abs(q / L.db.species[id].charge);
              end[0].n[id] = (end[0].n[id] || 0) + n;
              end[0].taken[id] = (end[0].taken[id] || 0) + n;
              end[0].dirty = true;
            });
          }
        }
        V = pa - pb + I * Rs;
        out.U = V;
      }
    }
    out.I = I;
    // Pluspol ist die Elektrode mit dem höheren Potential; ist die Zelle fast kurzgeschlossen, die, zu der die Elektronen fließen
    key = Math.abs(V) > 1e-3 ? V : Math.abs(I) >= QUIET ? -I : 0;
    if (key) { a.pole = key > 0 ? "+" : "-"; b.pole = key > 0 ? "-" : "+"; }
    devices.forEach(function (t) {
      var def = L.parts[t.type];
      if (def.circuit === "ammeter") t.goal = Math.abs(I);
      else if (def.circuit === "voltmeter") t.goal = Math.abs(V);
      else if (def.circuit === "load") t.goal = Math.min(1, I * I * def.ohm / def.watt);      // Helligkeit: Anteil an der Nennleistung
    });
    return closed && q !== 0;
  }

  // Redoxvorgänge an allen Metalloberflächen des Labors: Stromkreise, Elektroden ohne Stromkreis, Metallstücke.
  // dry: nur nachsehen, was fließen würde (für die Anzeigen nach einem Eingriff), nichts umsetzen.
  function electro(lab, emit, dry) {
    var busy = {};
    lab.cells = [];
    lab.tools.forEach(function (t) {
      var def = L.parts[t.type];
      if (def.electrode) { t.i = 0; t.rate = 0; t.bub = 0; t.pole = ""; }
      else if (def.circuit && def.circuit !== "supply") t.goal = def.circuit === "voltmeter" ? null : 0;
    });
    cellsOf(lab).forEach(function (cell) { if (runCell(lab, cell, emit, dry)) busy[cell.a.id] = busy[cell.b.id] = true; });
    lab.vessels.forEach(function (v) {
      var vol = solution(v);
      if (!vol) return;
      electrodesIn(lab, v.id).forEach(function (t) { if (!busy[t.id]) corrode(lab, v, vol, electrodeFace(v, t), emit, dry); });
      if (!dry) metalsIn(v).forEach(function (id) { corrode(lab, v, vol, lumpFace(v, id), emit); });
    });
    if (dry) return;
    lab.tools.forEach(function (t) {
      var def = L.parts[t.type];
      if (def.electrode) {                                       // Gasblasen an einer Elektrode: gemeldet, wenn sie beginnen
        if (!t.fizz && t.bub > 2 * REST) { t.fizz = true; if (emit) emit({ key: "bubbles", part: t.id, vessel: t.in }); }
        else if (t.fizz && t.bub < REST) t.fizz = false;
      } else if (def.circuit === "load") {
        if (!t.lit && t.goal > 0.05) { t.lit = true; if (emit) emit({ key: "lampOn", part: t.id, vessel: t.in }); }
        else if (t.lit && t.goal < 0.03) { t.lit = false; if (emit) emit({ key: "lampOff", part: t.id, vessel: t.in }); }
      }
    });
  }

  // Nach einem Eingriff: was die Stromkreise nun tun würden, damit Anzeigen und Ruhezustand stimmen
  function survey(lab) {
    lab.vessels.forEach(function (v) { v.eg = 0; });
    electro(lab, null, true);
    lab.vessels.forEach(function (v) { v.egas = {}; });          // der Trockenlauf hat kein Gas gemacht
  }

  // Der Stromkreis, zu dem ein Gefäß gehört: { a, b: die Elektroden, I: Strom in A (positiv: an a wird oxidiert),
  // U: Spannung von a gegen b in V, closed }; null, wenn es keinen gibt
  function circuit(lab, vesselId) {
    var found = null;
    if (!lab.cells) survey(lab);
    lab.cells.forEach(function (c) {
      var a = tool(lab, c.a), b = tool(lab, c.b);
      if (a && b && (a.in === vesselId || b.in === vesselId)) found = c;
    });
    return found;
  }

  // ------------------------------------------------------------------ Zeitschritt

  // Flüssigkeit von einem Gefäß ins andere: mit allem Gelösten und dem Niederschlag, der noch schwebt
  function transfer(from, to, ml) {
    if (from.veiled) to.veiled = true;
    var vol = volume(from) * 1000, share, moved = {}, id, phase;
    if (!(vol > 1e-9) || !(ml > 0)) return 0;
    ml = vol - ml < 1e-6 ? vol : ml;                           // kein Film bleibt zurück

    share = ml / vol;
    for (id in from.n) {
      phase = L.db.species[id].phase;
      if (phase !== "l" && phase !== "aq") continue;
      moved[id] = from.n[id] * share;
      if ((from.n[id] -= moved[id]) < 1e-300) delete from.n[id];
    }
    from.lumps.forEach(function (l) {
      var part = l.made ? l.n * (1 - l.settled) * share : 0;
      if (!(part > 0)) return;
      l.settled = l.n - part > 0 ? Math.min(1, l.settled * l.n / (l.n - part)) : 1;
      l.n -= part;
      from.n[l.id] -= part;
      growSolid(to, l.id, part);
      to.flag.solid[l.id] = true;
    });
    from.lumps = from.lumps.filter(function (l) {
      if (l.n > 0) return true;
      // ganz umgegossen – es sei denn, vom selben Stoff liegt noch ein Stück im Gefäß (Schwefelpulver neben fein verteiltem Schwefel)
      if (!from.lumps.some(function (o) { return o !== l && o.id === l.id && o.n > 0; })) { delete from.n[l.id]; delete from.flag.solid[l.id]; }
      return false;
    });
    from.dirty = true;
    mixIn(to, moved, from.T);
    return ml;
  }

  function flow(lab, emit) {
    lab.flows = lab.flows.filter(function (f) {
      var to = vessel(lab, f.to), from, dv = Math.min(f.left, f.rate * DT);
      if (!to) return false;
      if (f.from) {
        from = vessel(lab, f.from);
        dv = from ? pourInto(lab, from, to, dv, emit) : 0;
        if (!(dv > 0)) return false;
      } else splash(lab, to, portion(reagent(f.reagent), { ml: dv }), dv, function () { putReagent(lab, to, reagent(f.reagent), { ml: dv }); return dv; }, emit);
      f.left -= dv;
      return f.left > 1e-9;
    });
  }

  function drip(lab, emit) {      // Büretten: bei offenem Hahn läuft es in das Gefäß darunter
    lab.vessels.forEach(function (v) {
      var to = v.tap > 0 ? vessel(lab, v.over) : null, room;
      if (!to) return;
      room = free(lab, to);
      if (room <= 1e-6) {                                      // das Gefäß darunter ist voll: der Hahn schließt
        v.tap = 0;
        if (emit) emit({ key: "tapFull", vessel: v.id });
        return;
      }
      v.given += pourInto(lab, v, to, Math.min(v.tap * DT, room), emit);
    });
  }

  function notice(lab, v, gases, emit, dissolved, bathed) {
    var f = v.flag, name, strong = {}, cap = headroom(lab, v), id, haze = 0, spec, th;
    // gemeldet wird Gas, sobald es die Uhr am Laufen hält (REST); dann zeigt die Fläche auch Blasen. Ein einzelner Rechenschritt mit
    // Gas zählt nicht: gemeldet wird, was eine Fünftelsekunde anhält.
    f.fizz = v.gas > 2 * REST ? (f.fizz || 0) + 1 : 0;
    if (!f.gas && f.fizz >= 4) { f.gas = true; if (emit) emit({ key: "gas", vessel: v.id, species: gases }); }
    else if (f.gas && v.gas < REST) { f.gas = false; if (emit) emit({ key: "gasEnd", vessel: v.id }); }
    if (volume(v) > 5e-5) f.wet = true;                        // hier steht Flüssigkeit: verdampft sie, ist das eine Meldung wert

    if (!f.boil && v.boil > 0) { f.boil = true; if (emit) emit({ key: "boil", vessel: v.id }); }
    else if (f.boil && !(v.boil > 0)) { f.boil = false; if (emit) emit({ key: "boilEnd", vessel: v.id }); }

    // Geruch: ein stechendes Gas über der Lösung oder im Gasraum, sobald sein Druck reicht
    dissolved.forEach(function (g) { if (L.db.species[g.e.gas].smell) strong[g.e.gas] = g.p; });
    for (id in v.air) if (L.db.species[id].smell) strong[id] = Math.max(strong[id] || 0, cap > 0 ? v.air[id] / cap * P_AIR : P_AIR);
    (volatiles(v) || []).forEach(function (c) { if (L.db.species[c.id].smell) strong[c.id] = vapor(c, v.T) * P_AIR; });      // flüchtige gelöste Stoffe: ihr Dampfdruck
    for (id in strong) if (!f.smell[id] && strong[id] >= SMELL) { f.smell[id] = true; if (emit) emit({ key: "smell", vessel: v.id, species: id }); }
    for (id in f.smell) if (!(strong[id] >= SMELL / 5)) delete f.smell[id];

    // Ein Kolloid setzt sich nicht ab: gemeldet wird, wenn man durch die Flüssigkeit nicht mehr hindurchsieht
    v.lumps.forEach(function (l) { if (l.made && L.db.species[l.id].colloid) haze += l.n * (1 - l.settled); });
    haze = volume(v) > 0 ? 1 - Math.exp(-haze / volume(v) / HAZE) : 0;
    if (!f.opaque && haze >= OPAQUE) { f.opaque = true; if (emit) emit({ key: "opaque", vessel: v.id }); }
    else if (f.opaque && haze < OPAQUE - 0.2) f.opaque = false;

    name = volume(v) > 0 && !thick(v, volume(v)) ? colorOf(v) : { name: f.color };      // ohne Flüssigkeit gibt es keine Farbe der Lösung zu melden
    // Ändert sich die Extinktion merklich, ist die Lösung in Bewegung, auch wenn dabei kaum Stoff umgesetzt wird (ein Farbstoff
    // verblasst) oder die Farbe so satt ist, dass der Bildschirm den Unterschied nicht zeigt. Die erste Flüssigkeit im Glas zählt nicht.
    if (name.rgb) {
      spec = shades(v);
      if (!f.seen) f.seen = spec;
      else if (spec.some(function (value, index) { return Math.abs(value - f.seen[index]) > DRIFT; })) { f.seen = spec; f.tinted = lab.t; }
    } else f.seen = null;
    if (name.name === f.color) f.count = 0;
    else if (name.name === f.next) {
      if (++f.count >= 4) { f.color = name.name; f.count = 0; if (emit) emit({ key: "color", vessel: v.id, name: name.name, pale: name.pale }); }
    } else { f.next = name.name; f.count = 1; }

    if (bathed) { f.heat = 0; f.base = v.T; }                  // im Wasserbad kommt die Wärme vom Bad: kein Temperaturmaximum zu melden
    else if (f.heat) {
      if (v.T > f.max) f.max = v.T;
      if (v.T > f.peak + 0.01) { f.peak = v.T; f.since = lab.t; }
      // gemeldet wird, wenn es merklich abkühlt oder 20 s lang nicht mehr wärmer wird (im Kalorimeter kühlt es kaum ab)
      if (v.T < f.max - 0.3 || lab.t - f.since > 20) {
        f.heat = 0; f.base = v.T;
        // mit Streuung nennt das Protokoll, was das Thermometer im Glas dabei zeigte, nicht den wahren Wert
        th = lab.scatter != null ? toolAt(lab, v, function (def) { return def.sense === "T"; }) : null;
        if (emit) emit({ key: "tempMax", vessel: v.id, T: th ? readout(lab, th, f.max, false) : f.max });
      }
    } else if (v.T > f.base + 1.5) { f.heat = 1; f.max = f.peak = v.T; f.since = lab.t; }
    else if (v.T < f.base) f.base = v.T;
  }

  // ------------------------------------------------------------------ Gase, Sieden, Feuer

  function molar(lab) { return R * (lab.room + KELVIN) / 1e5 * 1000; }      // L/mol bei Raumtemperatur und Luftdruck

  // So viel Gas (mol) hat über der Flüssigkeit im Gefäß Platz
  function headroom(lab, v) {
    return Math.max(0, spec(v).cap - volume(v) * 1000) / 1000 / molar(lab);
  }

  function toolAt(lab, v, test) {
    for (var i = 0; i < lab.tools.length; i++) if (lab.tools[i].in === v.id && test(L.parts[lab.tools[i].type], lab.tools[i])) return lab.tools[i];
    return null;
  }

  // Gelöste Gase: bei welchem Druck (bar) stünde jedes im Gleichgewicht mit der Lösung, und wie viel davon (most, mol) kann höchstens entweichen?
  function above(v, vol) {
    var out = [], lg = gammas(v, vol);
    if (!(vol > 0)) return out;
    L.db.equilibria.forEach(function (e) {
      var logQ = 0, most = Infinity, id, h;
      if (!e.gas) return;
      for (id in e.d) {
        if (!(v.n[id] > 0)) return;
        logQ += e.d[id] * (Math.log10(v.n[id] / vol) + lg(id));
        most = Math.min(most, v.n[id] / e.d[id]);
      }
      h = heatOf(e);
      out.push({ e: e, most: most, logK: shift(e.logK * e.f, h == null ? null : h * e.f, v.T + KELVIN), p: 0, logQ: logQ });
      out[out.length - 1].p = Math.pow(10, logQ - out[out.length - 1].logK);
    });
    return out;
  }

  // x mol eines gelösten Gases verlassen die Lösung
  function release(v, g, x) {
    var id;
    if (!(x > 0)) return;
    for (id in g.e.d) if ((v.n[id] -= g.e.d[id] * x) < 1e-300) delete v.n[id];
    v.n[g.e.gas] = (v.n[g.e.gas] || 0) + x;
    tally(v, g.e, -x * g.e.f);
    v.dirty = true;
  }

  // Was über dem Luftdruck gelöst ist, perlt aus, bis die Lösung bei Luftdruck gerade gesättigt ist
  function fizz(v, g, vol) {
    var lo = 0, hi = g.most, mid, i, sum, id, left, lg = gammas(v, vol);
    for (i = 0; i < 40; i++) {
      mid = (lo + hi) / 2; sum = -g.logK - Math.log10(P_AIR);
      for (id in g.e.d) { left = v.n[id] - g.e.d[id] * mid; sum += left > 0 ? g.e.d[id] * (Math.log10(left / vol) + lg(id)) : -Infinity; }
      if (sum > 0) lo = mid; else hi = mid;
    }
    release(v, g, lo * (1 - Math.exp(-DT / FIZZ)));
  }

  // Eingedampft: das Wasser ist fort. Komplexe zerfallen, Salze kristallisieren, Ionen einer schwachen Säure oder Base
  // treten wieder zum Molekül zusammen, Flüchtiges geht als Gas, und was nichts davon kann, bleibt als Rückstand am Glas
  // (gelöste Teilchen ohne Wasser) und löst sich in neuem Wasser wieder.
  function dry(v, emit) {
    var water = v.n[WATER] || 0, sum = 0, id, left = v.lumps.length > 0;
    if (water > 1e-4) return;
    for (id in v.n) if (L.db.species[id].Tb != null && v.n[id] > 1e-4) return;      // es ist noch flüchtige Flüssigkeit da
    for (id in v.n) if (L.db.species[id].phase === "aq") sum += v.n[id];
    if (water > 0) { v.out[STEAM] = (v.out[STEAM] || 0) + water; delete v.n[WATER]; }
    function take(terms, x) {
      terms.forEach(function (t) { if (!((v.n[t.id] -= t.n * x) > 1e-13 * t.n * x)) delete v.n[t.id]; });
    }
    L.db.equilibria.forEach(function (e) {                     // Komplexe und Ionenpaare zerfallen in ihre Teile
      var whole = e.right.length === 1 ? e.right[0] : e.left.length === 1 ? e.left[0] : null, parts, n;
      if (!e.aq || !whole || e.nu[WATER] || e.nu[PROTON] || e.nu[HYDROXIDE] || !(v.n[whole.id] > 0)) return;      // (was nur das reale Modell kennt, liegt im idealen nie vor)
      parts = e.right.length === 1 ? e.left : e.right;
      if (parts.length < 2 && parts[0].n < 2) return;
      n = v.n[whole.id] / whole.n;
      delete v.n[whole.id];
      parts.forEach(function (t) { v.n[t.id] = (v.n[t.id] || 0) + t.n * n; });
      tally(v, e, e.right.length === 1 ? -n : n);
    });
    function settle(solid) {                                   // Salze kristallisieren (solid), Flüchtiges entweicht
      L.db.equilibria.forEach(function (e) {
        var product = solid ? e.solid : e.gas, most = Infinity, key;
        if (!product || e.nu[WATER]) return;
        for (key in e.d) {
          if (!(e.d[key] > 0)) return;
          most = Math.min(most, (v.n[key] || 0) / e.d[key]);
        }
        if (!(most > 1e-15)) return;
        for (key in e.d) if (!((v.n[key] -= e.d[key] * most) > 1e-13 * e.d[key] * most)) delete v.n[key];
        if (solid) { growSolid(v, product, most); v.flag.solid[product] = true; }
        else v.n[product] = (v.n[product] || 0) + most;
        tally(v, e, -most * e.f);
      });
    }
    settle(true);
    L.db.equilibria.forEach(function (e) {                     // Ionen treten zum ungeladenen Molekül zusammen: H+ und OH- zu Wasser,
      if (!e.aq || e.model === "real") return;                 // H+ und Acetat zu Essigsäure, Ammonium und OH- zu Ammoniak; keine Ionenpaare
      [[e.left, e.right, -1], [e.right, e.left, 1]].forEach(function (pair) {
        var molecule = null, water = 0, many = false, x = Infinity;
        pair[0].forEach(function (t) { if (t.id === WATER) water = t.n; else if (molecule) many = true; else molecule = t; });
        if (many || (molecule ? L.db.species[molecule.id].charge !== 0 : !water)) return;
        if (pair[1].length < 2 || pair[1].some(function (t) { return t.id === WATER || L.db.species[t.id].charge === 0; })) return;
        pair[1].forEach(function (t) { x = Math.min(x, (v.n[t.id] || 0) / t.n); });
        if (!(x > 1e-18)) return;
        take(pair[1], x);
        if (molecule) v.n[molecule.id] = (v.n[molecule.id] || 0) + molecule.n * x;
        if (water) v.out[STEAM] = (v.out[STEAM] || 0) + water * x;
        tally(v, e, pair[2] * x);
      });
    });
    settle(false);
    var charge = 0, partner = null;
    for (id in v.n) {
      if (L.db.species[id].phase !== "aq") continue;
      // Spuren gehen mit dem Dampf fort …
      if (v.n[id] < 1e-6 * sum) { charge += v.n[id] * L.db.species[id].charge; v.out[id] = (v.out[id] || 0) + v.n[id]; delete v.n[id]; }
    }
    if (Math.abs(charge) > 0) {                                // … und nehmen ihr Gegenion mit: was im Gefäß bleibt, ist elektrisch neutral
      for (id in v.n) {
        if (L.db.species[id].phase === "aq" && L.db.species[id].charge * charge < 0 && (!partner || v.n[id] > v.n[partner])) partner = id;
      }
      id = partner;
      if (id && v.n[id] * Math.abs(L.db.species[id].charge) >= Math.abs(charge)) {
        sum = Math.abs(charge / L.db.species[id].charge);
        v.out[id] = (v.out[id] || 0) + sum;
        if (!((v.n[id] -= sum) > 0)) delete v.n[id];
      }
    }
    for (id in v.n) if (L.db.species[id].phase !== "g") left = true;
    v.dirty = false;
    if (emit && v.flag.wet) emit({ key: "dry", vessel: v.id, left: left });      // gemeldet wird, wenn vorher Flüssigkeit im Gefäß stand
    v.flag.wet = false;
  }

  // Das Gefäß zerspringt: sein Inhalt ist verschüttet, und was daran hing, steht wieder für sich
  function shatter(lab, v, emit) {
    var id;
    for (id in v.n) v.out[id] = (v.out[id] || 0) + v.n[id];
    for (id in v.air) v.out[id] = (v.out[id] || 0) + v.air[id];
    v.n = {}; v.air = {}; v.lumps = []; v.lit = {}; v.rate = {}; v.gas = 0; v.boil = 0; v.tap = 0; v.dirty = false;
    v.broken = true;
    v.T = lab.room;
    lab.flows = lab.flows.filter(function (f) { return f.to !== v.id && f.from !== v.id; });
    lab.tools.forEach(function (t) { if (t.in === v.id) t.in = null; if (t.to === v.id) t.to = null; });
    lab.vessels.forEach(function (b) { if (b.over === v.id) { b.over = null; b.tap = 0; } });
    if (emit) emit({ key: "broken", vessel: v.id });
  }

  // Zündet, was im Gasraum brennbar ist. steady: es brennt schon an der Öffnung, dann verbrennt ruhig, was nachkommt.
  // Zurück: null, wenn nichts zündet; sonst { level: 0 ruhig, 1 Plopp, 2 pfeifender Knall, 3 lauter Knall, energy in J, shatter }
  function explode(lab, v, steady) {
    var cap = headroom(lab, v), out = null, sum = 0, id, oxygen;
    for (id in v.air) sum += v.air[id];
    oxygen = cap > 0 ? AIR["O2(g)"] * Math.max(0, 1 - sum / cap) + (v.air["O2(g)"] || 0) / cap : AIR["O2(g)"];
    L.db.reactions.forEach(function (r) {
      var gas = null, share, xi, key, delta, energy, level;
      if (!r.spark) return;
      r.left.forEach(function (t) { if (!AIR[t.id]) gas = t; });
      if (!gas || !(v.air[gas.id] > 0)) return;
      share = cap > 0 ? v.air[gas.id] / cap : 1;
      if (!steady && share < r.spark[0]) return;
      // im Gefäß zündet ein Gemisch nur mit genug Sauerstoff; fast reines Gas brennt außen an der Öffnung ab
      if (!steady && share < r.spark[1] && oxygen < 0.05) return;
      xi = v.air[gas.id] / gas.n;                              // alles Brennbare verbrennt; die Luft liefert, was fehlt
      for (key in r.nu) {
        delta = r.nu[key] * xi;
        if (delta > 0) { if (key === STEAM) v.out[key] = (v.out[key] || 0) + delta; else v.air[key] = (v.air[key] || 0) + delta; }
        else if (key === gas.id) delete v.air[key];
        else if (v.air[key] >= -delta) v.air[key] += delta;
        else { v.taken[key] = (v.taken[key] || 0) - delta - (v.air[key] || 0); delete v.air[key]; }
      }
      tally(v, r, xi, true);
      energy = Math.abs(xi * (heatOf(r) || 0)) * 1000;
      level = steady || share >= r.spark[1] ? 0 : energy < 25 ? 1 : energy < 400 ? 2 : 3;
      if (!out || level > out.level) out = { level: level, energy: energy, species: gas.id, shatter: level === 3 && energy >= SHATTER };
    });
    return out;
  }

  function stoppered(lab, v) { return !!toolAt(lab, v, function (def) { return def.stopper; }); }

  // Heiße Stellen: Jedes Stück aus dem Regal hat seine eigene Temperatur. Die Reaktionen an seiner Oberfläche heizen es, und es gibt
  // die Wärme an das Wasser ab oder, trocken, an die Luft und durch Strahlung; gerechnet wird der eingeschwungene Zustand, denn ein
  // kleines Stück folgt in Bruchteilen einer Sekunde. Die Wärme selbst bucht weiter das Gefäß. Ein Stück, leichter als Wasser, schwimmt;
  // ist es heißer als die Zündtemperatur des Wasserstoffs, den es freisetzt, brennt dieser an der Luft, in der Flammenfarbe des Metalls.
  function hotSpots(lab, v, emit) {
    var wet = volume(v) > 0, closed = stoppered(lab, v), vol = thick(v, volume(v)) ? 0 : volume(v), burning = {}, lit = {}, id, key;
    // was selbst brennt (Holzkohle, Schwefel, Magnesium), zeigt sein eigenes Feuer; seine Verbrennungswärme geht mit der Flamme fort
    L.db.reactions.forEach(function (r) { if (r.rate.ignite != null && v.lit[r.key] && r.rate.surface) burning[r.rate.surface] = true; });
    v.lumps.forEach(function (l) {
      var s = L.db.species[l.id], a = l.made ? 0 : l.a0 * Math.pow(l.n / l.n0, l.p), flux = 0, gas = 0, tint = null, x;
      if (!(a > 0) || !(l.n > 0)) { l.T = null; l.heat = 0; l.flame = 0; return; }
      L.db.reactions.forEach(function (r) {
        var h = heatOf(r), whole = area(v, l.id), per, n;
        if (r.rate.surface !== l.id || r.rate.ignite != null || !v.rate[r.key] || !(whole > 0)) return;
        per = speed(v, r, vol) / whole;                          // Umsatz je cm², wie ihn das Geschwindigkeitsgesetz jetzt gibt: unabhängig von der Größe
        if (h != null && h < 0) flux += per * -h * 1000;
        if (r.nu["H2(g)"] > 0) gas += per * r.nu["H2(g)"] * a;
        for (n in r.nu) if (r.nu[n] > 0 && L.db.species[n].flame && !tint) tint = L.db.species[n].flame;
      });
      l.heat = flux;                                             // W/cm²
      l.T = wet ? Math.min(HOT_MAX, v.T + flux / H_WET) : dryTemp(v.T, flux * a, a);
      l.glowOff = !!burning[l.id];
      l.float = wet && s.rho != null && s.rho < 1;
      if (l.float && !closed && l.T >= H2_IGNITE && gas > 0) {
        x = Math.min(gas * DT, v.n["H2(g)"] || 0);                // 2 H2 + O2 -> 2 H2O, mit Sauerstoff aus der Luft
        if (x > 0) {
          v.n["H2(g)"] -= x;
          if (!(v.n["H2(g)"] > TRACE)) delete v.n["H2(g)"];
          v.taken["O2(g)"] = (v.taken["O2(g)"] || 0) + x / 2;
          v.out[STEAM] = (v.out[STEAM] || 0) + x;
          v.pipe = (v.pipe || 0) + x / DT;                     // es sprudelt trotzdem: der Wasserstoff verbrennt erst über dem Wasser
        }
        l.flame = gas; l.tint = tint || "#a9c2ff";
        lit[l.id] = true;
      } else l.flame = 0;
    });
    // je Metall eine Flamme: ihr Anfang und ihr Ende stehen im Protokoll, auch wenn das letzte Stück verbraucht ist
    for (id in lit) if (!v.lit["H2@" + id]) { v.lit["H2@" + id] = true; if (emit) emit({ key: "ignite", vessel: v.id, species: "H2(g)" }); }
    for (key in v.lit) if (key.indexOf("H2@") === 0 && !lit[key.slice(3)]) { delete v.lit[key]; if (emit) emit({ key: "fireEnd", vessel: v.id, species: "H2(g)" }); }
  }

  // Temperatur eines trockenen Stücks, das P Watt auf a cm² abgibt: an die Luft und durch Strahlung, an einer Umgebung von T0 °C
  function dryTemp(T0, P, a) {
    var lo = T0, hi = T0 + 3000, mid, i;
    if (!(P > 0)) return T0;
    for (i = 0; i < 40; i++) {
      mid = (lo + hi) / 2;
      if (a * (H_DRY * (mid - T0) + RADIATE * (Math.pow(mid + KELVIN, 4) - Math.pow(T0 + KELVIN, 4))) < P) lo = mid; else hi = mid;
    }
    return (lo + hi) / 2;
  }

  // Farbe eines glühenden Körpers: Plancks Strahlungsgesetz über die Normspektralwerte, auf die hellste Grundfarbe bezogen.
  // level: wie stark er leuchtet, 0 unter dem Draper-Punkt, 1 ab etwa 1200 °C
  function glowColor(T) {
    var K = T + KELVIN, sum = [0, 0, 0], i, k, lam, B, rgb, top;
    for (i = 0; i < WAVES.length; i++) {
      lam = WAVES[i] * 1e-9;
      B = 1 / (Math.pow(lam, 5) * (Math.exp(1.4388e-2 / (lam * K)) - 1));
      for (k = 0; k < 3; k++) sum[k] += B * CMF[i][k];
    }
    rgb = linear(sum).map(function (value) { return Math.max(0, value); });
    top = Math.max(rgb[0], rgb[1], rgb[2]) || 1;
    rgb = rgb.map(function (value) { var u = value / top; return Math.round(255 * (u <= 0.0031308 ? 12.92 * u : 1.055 * Math.pow(u, 1 / 2.4) - 0.055)); });
    return { rgb: rgb, level: Math.max(0, Math.min(1, (T - GLOW) / 700)) };
  }

  // Gasraum: was keinen Platz hat, wird verdrängt; aus dem offenen Gefäß verfliegt der Rest, leichte Gase schnell, schwere langsam.
  // Steht eine Flamme darunter, zündet ein brennbares Gemisch: einmal mit einer Verpuffung, danach brennt an der Öffnung ruhig ab,
  // was nachkommt.
  // made: so viel Gas (mol) ist in diesem Schritt in den Gasraum gekommen. Steckt ein Rohr im Gefäß, schiebt es ebenso viel
  // vor sich her ins zweite Gefäß: erst vor allem Luft, die nicht gerechnet wird, dann zunehmend das Gas selbst.
  function vent(lab, v, emit, made) {
    var cap = headroom(lab, v), sum = 0, id, part, M, hit, steady, closed = stoppered(lab, v), pipe = toolAt(lab, v, function (def) { return def.pipe; }), into, flow = 0;
    var meter = toolAt(lab, v, function (def) { return def.sense === "V"; }), plug = toolAt(lab, v, function (def) { return def.plug; });
    if (pipe) pipe.flow = 0;
    for (id in v.air) sum += v.air[id];
    if (!(sum > 0)) return;
    if (toolAt(lab, v, function (def, t) { return def.under && t.flame > 0; })) {
      steady = v.flag.torch != null && lab.t - v.flag.torch < 3;
      hit = explode(lab, v, steady);
      if (hit) {
        v.flag.torch = lab.t;
        if (!steady && emit) emit({ key: "pop", vessel: v.id, level: hit.level, species: hit.species });
        if (hit.shatter) { shatter(lab, v, emit); return; }
      }
      sum = 0;
      for (id in v.air) sum += v.air[id];
    } else v.flag.torch = null;
    into = pipe && pipe.to ? vessel(lab, pipe.to) : null;
    if (into && into.broken) into = null;
    for (id in v.air) {
      part = sum > cap && !plug ? v.air[id] * (1 - cap / sum) : 0;      // durch einen Gummistopfen geht nichts hinaus: der Druck steigt
      if (pipe) part = Math.max(part, (made || 0) * v.air[id] / Math.max(sum, cap));
      M = L.db.species[id].M;
      if (!closed) part += (v.air[id] - part) * (1 - Math.exp(-DT / (M < 20 ? 8 : M < 36 ? 40 : 90)));      // ein Stopfen verschließt das Gefäß
      if (v.air[id] - part < 1e-12) part = v.air[id];
      if (into && part > 0) { bubbleInto(lab, into, id, part); flow += part; if (v.veiled) into.veiled = true; }
      else v.out[id] = (v.out[id] || 0) + part;
      if (meter && !meter.full && part > 0) meter.held = (meter.held || 0) + part * M;      // im Kolbenprober; ist er voll, entweicht es
      if ((v.air[id] -= part) <= 0) delete v.air[id];
    }
    if (pipe) pipe.flow = flow / DT;
  }

  // Gas aus einem Rohr kommt ins Gefäß v. Steht Flüssigkeit darin, perlt es hindurch: Was ein Lösungsgleichgewicht hat (CO₂, NH₃, HCl),
  // geht in Lösung, und was zu viel ist, perlt wie sonst wieder aus; anderes steigt durch. Ein leeres Gefäß fängt das Gas auf.
  // Wie viel eine Blase des Gases mit dem Lösungsgleichgewicht e auf ihrem Weg durch die Flüssigkeit in v abgibt (siehe bubbleInto)
  function bubbleShare(v, e) {
    var h = heatOf(e);
    if (Object.keys(e.d).length !== 1) return 1;
    return 1 - Math.exp(-Math.pow(10, shift(e.logK * e.f, h == null ? null : h * e.f, v.T + KELVIN)) * R / 100 * (v.T + KELVIN) *
      (1 + LYE * (v.n["OH-(aq)"] || 0) / volume(v)));
  }

  function bubbleInto(lab, v, id, x) {
    var e = volume(v) > 0 ? L.db.equilibria.filter(function (q) { return q.gas === id; })[0] : null, key, part;
    // steigt durch: als Gas in der Flüssigkeit, so zählt es wie selbst entstandenes (Blasen, Kolbenprober, nächstes Rohr)
    if (!e) { v.n[id] = (v.n[id] || 0) + x; return; }
    // Eine Blase gibt auf ihrem Weg nur einen Teil ab, je nach Löslichkeit (Henry: c/p = K): 1 − e^(−K·R·T).
    // Kohlenstoffdioxid gut die Hälfte, Ammoniak und Chlorwasserstoff praktisch alles.
    part = bubbleShare(v, e);                                  // Lauge bindet ein saures Gas schon unterwegs: Faktor 1 + LYE·[OH⁻]
    if (part < 1) v.n[id] = (v.n[id] || 0) + x * (1 - part);
    x *= part;
    v.pipe = (v.pipe || 0) + x / DT;                           // Blasen am Ende des Rohrs
    for (key in e.d) v.n[key] = (v.n[key] || 0) + e.d[key] * x;
    tally(v, e, x * e.f);
    v.dirty = true;
  }

  // Druck im verschlossenen Gefäß. Im Gasraum (V Liter) stehen die Luft, die beim Verschließen darin war (seal, in mol), die
  // entstandenen Gase und der Wasserdampf mit seinem Dampfdruck. Ein Stopfen fliegt über POP heraus. Mit einem Rohr gleicht sich
  // der Druck aus: Darüber geht mit dem Gas auch Luft hinaus; darunter – das Glas kühlt ab, der Dampf schlägt sich nieder – steigt
  // Flüssigkeit aus dem zweiten Gefäß zurück, und trifft sie auf ein Glas, das heißer ist als CRACK, zerspringt es.
  function pressure(lab, v, emit) {
    var pipe = toolAt(lab, v, function (def) { return def.pipe; }), plug = toolAt(lab, v, function (def) { return def.plug; });
    var V = Math.max(1e-6, (spec(v).cap - volume(v) * 1000) / 1000), T = v.T + KELVIN, RL = R / 100, gas = 0, id, vap, full, total, p, into, ml, hot, room, x;
    v.p = null;
    if (!pipe && !plug) { v.seal = null; return; }
    // während umgegossen wird, ist das Gefäß offen; danach rechnet der Druck neu
    if (lab.flows.some(function (f) { return f.from === v.id || f.to === v.id; })) { v.seal = null; return; }
    for (id in v.air) gas += v.air[id];
    vap = volume(v) > 0 && v.n[WATER] > 0 ? Math.min(1, Math.exp(-VAPOR / R * (1 / T - 1 / (BOIL + KELVIN)))) * P_AIR : 0;
    full = P_AIR * V / (RL * T);                               // so viel Gas fasst der Gasraum bei Luftdruck
    if (v.seal == null) {                                      // eben verschlossen: was über den Luftdruck hinausgeht, ist vorher entwichen
      room = full * (1 - vap / P_AIR);
      if (gas > room) for (id in v.air) { x = v.air[id] * (1 - room / gas); v.out[id] = (v.out[id] || 0) + x; v.air[id] -= x; }
      gas = Math.min(gas, room);
      v.seal = Math.max(0, room - gas);
    }
    total = v.seal + gas + vap * V / (RL * T);
    p = total * RL * T / V;
    v.p = p;
    if (plug) {
      if (p > POP || v.boil > 0) {                             // siedet es unter dem Stopfen, kann der Dampf nirgends hin
        plug.in = null; v.seal = null;
        if (emit) emit({ key: "popped", vessel: v.id, part: plug.id, type: plug.type });
      }
      return;
    }
    if (p >= P_AIR) { v.seal = Math.max(0, v.seal - (total - full) * v.seal / total); v.flag.suck = false; return; }
    into = pipe.to ? vessel(lab, pipe.to) : null;
    ml = (full - total) * RL * T / P_AIR * 1000;
    if (into && !into.broken && volume(into) > 0 && ml > 1e-3) {
      hot = v.T > CRACK;
      ml = transfer(into, v, Math.min(ml, volume(into) * 1000));
      if (ml > 0 && !v.flag.suck) { v.flag.suck = true; if (emit) emit({ key: "suckBack", vessel: v.id, from: into.id }); }
      if (hot && ml > 0.02) shatter(lab, v, emit);
    } else v.seal += full - total;                             // aus einem leeren Gefäß strömt Luft zurück
  }

  // Die flüchtigen Teile einer Flüssigkeit: Wasser und gelöste Stoffe mit Siedepunkt (Tb). x: Stoffmengenanteil unter ihnen,
  // g: Aktivitätskoeffizient nach Van Laar, wo ein Stoff Konstanten mit Wasser hat (mix). Salze und andere gelöste Stoffe zählen
  // nicht mit: Eine Salzlösung siedet hier wie Wasser bei 100 °C. null, wenn nichts Flüchtiges da ist.
  function volatiles(v) {
    var list = [], total = 0, id, s, water = null, lnw = 0;
    for (id in v.n) {
      s = L.db.species[id];
      if (id !== WATER && !(s.Tb != null && s.phase === "aq")) continue;
      list.push({ id: id, n: v.n[id], Tb: id === WATER ? BOIL : s.Tb, H: id === WATER ? VAPOR : s.Hvap * 1000, mix: s.mix, g: 1 });
      total += v.n[id];
    }
    if (!(total > 0)) return null;
    list.forEach(function (c) { c.x = c.n / total; if (c.id === WATER) water = c; });
    if (water) list.forEach(function (c) {
      var a, b, d;
      if (!c.mix) return;
      a = c.mix[0]; b = c.mix[1]; d = a * c.x + b * water.x;
      if (!(d > 0)) return;
      c.g = Math.exp(a * Math.pow(b * water.x / d, 2));
      lnw += b * Math.pow(a * c.x / d, 2);
    });
    if (water) water.g = Math.exp(lnw);
    return list;
  }

  // Dampfdruck eines Teils über der Mischung bei T (°C), als Anteil am Luftdruck: Raoult mit Clausius-Clapeyron
  function vapor(c, T) { return c.g * c.x * Math.exp(-c.H / R * (1 / (T + KELVIN) - 1 / (c.Tb + KELVIN))); }

  // Der Dampf eines siedenden Stoffs: sein Gas, wo eines eingetragen ist (Essigsäure-Dampf riecht), sonst der Stoff selbst
  function vapourOf(id) {
    var e = L.db.equilibria.filter(function (q) { return q.gas && q.d[id] && Object.keys(q.d).length === 1; })[0];
    return e ? e.gas : id;
  }

  // Siedetemperatur: bei ihr ist die Summe der Dampfdrücke gleich dem Luftdruck
  function bubble(list) {
    var lo = Infinity, hi = -Infinity, mid, i;
    if (list.length === 1) return list[0].Tb;
    list.forEach(function (c) { lo = Math.min(lo, c.Tb); hi = Math.max(hi, c.Tb); });
    lo -= 40; hi += 40;
    for (i = 0; i < 50; i++) {
      mid = (lo + hi) / 2;
      if (list.reduce(function (sum, c) { return sum + vapor(c, mid); }, 0) < P_AIR) lo = mid; else hi = mid;
    }
    return (lo + hi) / 2;
  }

  // Sieden: die Temperatur bleibt bei der Siedetemperatur stehen, die Wärme darüber verdampft Flüssigkeit, vom leichter
  // Flüchtigen mehr. Mit einem Kühler (still) geht der Dampf in dessen Vorlage und wird dort wieder flüssig.
  // strip: der Dampf nimmt gelöste Gase mit.
  function boilOff(lab, v, emit, strip) {
    var list = volatiles(v), top, over, heat = 0, boil = Infinity, cool, into = null, cold = {}, kept;
    if (!list || !L.db.species[STEAM] || !(v.T > list.reduce(function (lo, c) { return Math.min(lo, c.Tb); }, Infinity) - 40)) return;
    top = bubble(list);
    if (!(v.T > top)) return;
    over = (v.T - top) * heatCapacity(v);
    list.forEach(function (c) { c.y = vapor(c, top); });
    kept = list.reduce(function (sum, c) { return sum + c.y; }, 0);
    list.forEach(function (c) { c.y /= kept; heat += c.y * c.H; if (c.y > 0) boil = Math.min(boil, c.n / c.y); });
    boil = Math.min(boil, over / heat);                         // in mol Dampf; mehr, als da ist, verdampft nicht
    var back = !!toolAt(lab, v, function (def) { return def.reflux; });      // Rückfluss: was verdampft, läuft wieder zurück
    if (strip && !back) above(v, volume(v)).forEach(function (g) {      // jedes Gas mit seinem Anteil am Druck
      var share = Math.min(0.95, g.p / P_AIR);
      if (list.some(function (c) { return g.e.d[c.id]; })) return;      // was selbst siedet (Essigsäure), geht schon mit seinem Dampfdruck fort
      if (share > 1e-6) release(v, g, Math.min(g.most, boil * share / (1 - share)));       // Spuren bleiben in der Lösung
    });
    if (back) list = [];                                       // unter Rückfluss bleibt alles im Gefäß: es siedet, ohne dass etwas fortgeht
    cool = toolAt(lab, v, function (def) { return def.duct; });      // auch durch ein Rohr: der Dampf schlägt sich im zweiten Gefäß nieder
    if (cool) into = vessel(lab, cool.to);
    if (into && (into.broken || L.parts[into.type].dispenser || free(lab, into) < 1)) into = null;      // die Vorlage läuft nicht über
    list.forEach(function (c) {
      var x = Math.min(c.y * boil, v.n[c.id] || 0);             // nie mehr, als noch da ist
      if (!(x > 0)) return;
      if ((v.n[c.id] -= x) < 1e-300) delete v.n[c.id];
      if (into) cold[c.id] = x;
      else if (c.id === WATER) v.out[STEAM] = (v.out[STEAM] || 0) + x;
      else v.out[vapourOf(c.id)] = (v.out[vapourOf(c.id)] || 0) + x;
    });
    if (into) { mixIn(into, cold, lab.room); if (v.veiled) into.veiled = true; }
    v.T = top + (over - boil * heat) / heatCapacity(v);         // reicht die Flüssigkeit nicht für alle Wärme, bleibt das Gefäß heißer
    v.dirty = true;
    v.boil += boil / DT;
    dry(v, emit);
  }

  function advanceVessel(lab, v, emit) {
    var id, gases = [], gas = 0, moving = false, vol, dissolved, burner, meter, room, bath;
    if (v.broken) return;
    boilOff(lab, v, emit, false);                              // Flüssigkeit in einem heißen Gefäß: gerechnet wird nie mit einer Lösung über ihrem Siedepunkt
    kinetics(v, emit, stoppered(lab, v));
    hotSpots(lab, v, emit);
    if (v.dirty || Math.abs(v.T - v.Teq) > 0.02) {              // auch wenn nur die Temperatur wandert: K hängt von ihr ab
      moving = equilibrate(lab, v, emit);
      v.Teq = v.T;
    }
    v.dirty = moving;
    vol = volume(v);
    dissolved = above(v, vol);
    dissolved.forEach(function (g) { if (g.p > P_AIR * OVER) fizz(v, g, vol); });

    burner = toolAt(lab, v, function (def, t) { return def.under && t.flame > 0; });
    if (burner) v.q += spec(v).heat * (L.parts[burner.type].flames[burner.flame] - v.T) * DT;      // die Flamme heizt
    if (v.q) v.T += v.q / heatCapacity(v);
    v.q = 0;

    boilOff(lab, v, emit, true);

    meter = toolAt(lab, v, function (def) { return def.sense === "V"; });
    if (vol > 0) for (id in v.egas || {}) {                    // Gas von den Elektroden perlt durch die Lösung; ein lösliches löst sich zum Teil
      var eq = L.db.equilibria.filter(function (q) { return q.gas === id; })[0], x, key;
      if (!eq || !(v.n[id] > 0)) continue;
      x = Math.min(v.n[id], v.egas[id]) * bubbleShare(v, eq);
      v.n[id] -= x;
      v.eg -= x;                                               // was sich gelöst hat, perlt nicht mehr an der Elektrode
      for (key in eq.d) v.n[key] = (v.n[key] || 0) + eq.d[key] * x;
      tally(v, eq, x * eq.f);
      v.dirty = true;
    }
    for (id in v.n) {                                          // Gase verlassen die Flüssigkeit und stehen im Gasraum darüber
      if (L.db.species[id].phase !== "g") continue;
      if (id === STEAM) v.out[id] = (v.out[id] || 0) + v.n[id];     // Dampf schlägt sich draußen nieder
      else {
        gas += v.n[id]; gases.push(id);
        v.air[id] = (v.air[id] || 0) + v.n[id];
        if (meter && meter.full) {                             // er ist voll, und es kommt noch Gas: der Kolben springt heraus
          meter.in = null;
          if (emit) emit({ key: "plungerOut", part: meter.id, vessel: v.id });
          meter = null;
        }
        if (meter && !meter.full) {                            // der Kolbenprober zählt mit, bis er voll ist
          room = L.parts[meter.type].cap / 1000 / molar(lab);
          meter.n += v.n[id];
          if (meter.n >= room) { meter.n = room; meter.full = true; if (emit) emit({ key: "syringeFull", part: meter.id, vessel: v.id }); }
        }
      }
      delete v.n[id];
    }
    v.gas = (vol > 0 && gas - v.eg > 1e-15 ? (gas - v.eg) / DT : 0) + (v.pipe || 0);      // Blasen in der Flüssigkeit; was an Elektroden entsteht, perlt dort
    v.pipe = 0;
    vent(lab, v, emit, gas);
    if (v.broken) return;
    pressure(lab, v, emit);
    if (v.broken) return;

    // Wärmeabgabe an den Raum; im Wasserbad an das Bad, und das viel schneller
    bath = toolAt(lab, v, function (def) { return def.bath; });
    room = bath ? bath.temp : lab.room;
    v.T = room + (v.T - room) * Math.exp(-(spec(v).loss + (bath ? spec(v).heat * L.parts[bath.type].gain : 0)) * DT / heatCapacity(v));
    var wet = volume(v) > 0;
    v.lumps.forEach(function (l) {                             // Niederschlag setzt sich ab
      if (!l.made || l.settled >= 1) return;
      if (!wet) { l.settled = 1; return; }
      if (L.db.species[l.id].colloid) return;                  // so fein verteilt, dass es in der Schwebe bleibt
      l.settled += (1 - l.settled) * (1 - Math.exp(-DT / (L.db.species[l.id].settle || SINK)));
      if (l.settled > 0.995) l.settled = 1;
    });
    v.walk = (v.walk || 0) + DT * Math.sqrt((v.T + KELVIN) / (T_REF + KELVIN));      // je wärmer, desto schneller laufen die Teilchen ihren Weg ab
    notice(lab, v, gases, emit, dissolved, !!bath);
  }

  // ------------------------------------------------------------------ Proben

  // Brennender Span ("flame") oder Glimmspan ("glow") an die Öffnung eines Gefäßes gehalten.
  // Zurück: { result, level } mit result "pop" (Knallgas), "burn" (brennt ruhig ab), "flare" (brennt heller),
  // "relight" (flammt auf), "out" (erlischt), "calm" (brennt weiter), "glow" (glimmt weiter)
  function probe(lab, vesselId, kind, emit) {
    var v = vessel(lab, vesselId), cap, sum = 0, id, oxygen, hit, out;
    if (!v || v.broken || stoppered(lab, v) || (kind !== "flame" && kind !== "glow" && kind !== "paper")) return null;      // an ein verschlossenes Gefäß kommt kein Span
    if (kind === "paper") return paper(lab, v, emit);
    hit = explode(lab, v, false);
    if (hit) out = { result: hit.level ? "pop" : "burn", level: hit.level };
    else {
      cap = headroom(lab, v);
      for (id in v.air) sum += v.air[id];
      oxygen = cap > 0 ? AIR["O2(g)"] * Math.max(0, 1 - sum / cap) + (v.air["O2(g)"] || 0) / cap : AIR["O2(g)"];
      out = { result: oxygen > 0.3 ? (kind === "flame" ? "flare" : "relight") : oxygen < 0.15 ? "out" : kind === "flame" ? "calm" : "glow", level: 0 };
    }
    v.flag.shown = lab.t + 2;                                  // so lange dauert die Probe; bis dahin läuft die Uhr
    if (emit) emit({ key: "splint", vessel: v.id, kind: kind, result: out.result, level: out.level });
    if (hit && hit.shatter) { shatter(lab, v, emit); return out; }
    if (kind === "flame" && out.result !== "out" && !(volume(v) > 0)) {
      L.db.reactions.forEach(function (r) {                    // der Span zündet, was sich leicht entzündet
        if (r.spark || r.rate.ignite == null || r.rate.ignite > 400 || v.lit[r.key] || !(limit(v, r) > 0)) return;
        v.lit[r.key] = true;
        if (emit) emit({ key: "ignite", vessel: v.id, species: fuel(r) });
      });
    }
    return out;
  }

  // Feuchtes Universalindikatorpapier an der Öffnung: sein Wasserfilm steht mit jedem Gas im Gleichgewicht, mit dem Teildruck im
  // Gasraum oder, wenn er höher ist, dem über der Lösung. Was darunter bleibt (PAPER_MIN), erreicht das Papier nicht in merklicher
  // Menge. Gerechnet wird wie in einem Becherglas mit 10 mL Wasser und drei Tropfen Universalindikator bei Raumtemperatur; von dort
  // kommen pH-Wert und Farbe.
  var PAPER_MIN = 1e-5;           // bar, 10 ppm: Nachweisgrenze des Papiers (geschätzt)
  function paper(lab, v, emit) {
    var cap = headroom(lab, v), vol = volume(v), press = {}, film, w, id, e, out;
    if (cap > 0) for (id in v.air) press[id] = P_AIR * Math.min(1, v.air[id] / cap);
    above(v, vol).forEach(function (g) { press[g.e.gas] = Math.max(press[g.e.gas] || 0, g.p); });
    film = createLab({ room: lab.room, model: "ideal", bench: [{ type: "beaker", id: "film", size: 100, contains: [{ reagent: "H2O", ml: 10 }, { reagent: "UI", ml: 3 * DROP }] }] });
    w = vessel(film, "film");
    for (id in press) {
      e = L.db.equilibria.filter(function (q) { return q.gas === id; })[0];
      if (!e || !(press[id] >= PAPER_MIN)) continue;
      // Π (ν c)^ν = p · K: jedes gelöste Teilchen mit seinem Anteil ν an derselben Menge c
      var h = heatOf(e), logK = shift(e.logK * e.f, h == null ? null : h * e.f, w.T + KELVIN), sum = 0, base = Math.log10(press[id]) + logK, key, c;
      for (key in e.d) { sum += e.d[key]; base -= e.d[key] * Math.log10(e.d[key]); }
      c = Math.pow(10, base / sum);
      for (key in e.d) w.n[key] = (w.n[key] || 0) + e.d[key] * c * 0.01;
    }
    // so lange man es hinhält, läuft im Film auch, was Zeit braucht: Chlor bleicht den Farbstoff
    for (var i = 0; i < 2 * TICKS; i++) { w.dirty = true; equilibrate(film, w); kinetics(w, null, false); }
    w.dirty = true;
    equilibrate(film, w);
    out = colorOf(w);
    out = { result: "paper", name: out.name, pale: out.pale, rgb: out.rgb, pH: -Math.log10(w.n[PROTON] / volume(w)) };
    v.flag.shown = lab.t + 2;                                  // so lange hält man es hin; bis dahin läuft die Uhr
    if (emit) emit({ key: "splint", vessel: v.id, kind: "paper", result: "paper", name: out.name, pale: out.pale, rgb: out.rgb });
    return out;
  }

  // Flammenfärbung: ein Magnesiastäbchen in den Inhalt des Gefäßes getaucht und in die rauschende Flamme gehalten.
  // Zurück: null ohne rauschende Flamme, sonst { burner, name (Farbwort oder null), rgb, species }
  function flameTest(lab, vesselId, emit) {
    var v = vessel(lab, vesselId), burner = null, vol, sum = [0, 0, 0], weight = 0, top = 0, best = null, id, s, w, rgb, k, out;
    lab.tools.forEach(function (t) { if (!burner && L.parts[t.type].under && t.flame === 2) burner = t; });
    if (!v || v.broken || !burner) return null;
    vol = volume(v);
    for (id in v.n) {
      s = L.db.species[id];
      if (!s.flame) continue;
      // shine: wie stark ein Element die Flamme färbt; Natrium überstrahlt alles andere
      w = (s.phase === "aq" && vol > 0 ? v.n[id] / vol : 1) * (s.shine || 1);
      if (!(w > 1e-5)) continue;
      rgb = rgbOf(id, "flame");
      for (k = 0; k < 3; k++) sum[k] += rgb[k] * w;
      weight += w;
      if (w > top) { top = w; best = id; }
    }
    rgb = weight > 0 ? sum.map(function (c) { return Math.round(c / weight); }) : null;
    out = { burner: burner.id, name: rgb ? colorName(rgb).name : null, rgb: rgb, species: best };
    burner.tint = rgb ? { rgb: rgb, until: lab.t + 4 } : null;
    if (emit) emit({ key: "flameTest", vessel: v.id, part: burner.id, name: out.name, species: best });
    return out;
  }

  // Leitfähigkeit einer Lösung in S/cm: jedes Ion trägt mit Konzentration, Ladung² und Beweglichkeit bei (unendliche Verdünnung);
  // je Grad wärmer leitet sie 2 % besser. D: Diffusionskoeffizient in 10⁻⁹ m²/s; fehlt er, gilt 1.
  function conduct(v, vol) {
    var sum = 0, id, s;
    if (!(vol > 0) || !(v.n[WATER] > 0) || thick(v, vol)) return 0;
    for (id in v.n) {
      s = L.db.species[id];
      if (s.phase === "aq" && s.charge) sum += s.charge * s.charge * (typeof s.D === "number" ? s.D : 1) * v.n[id];
    }
    return LAMBDA * sum / vol * Math.max(0.3, 1 + 0.02 * (v.T - T_REF));
  }

  function conductivity(lab, vesselId) {      // in mS/cm
    var v = vessel(lab, vesselId);
    return v ? conduct(v, volume(v)) * 1000 : 0;
  }

  // Extinktion der Flüssigkeit in einem Gefäß bei der Wellenlänge nm über d cm: Lambert-Beer über alle gelösten Teilchen,
  // dazu die Trübung durch alles, was schwebt (bei jeder Wellenlänge gleich)
  function extinction(v, nm, d) {
    var vol = volume(v), sum = 0, hang = 0, id, s, c, base, w;
    if (!(vol > 0) || thick(v, vol)) return 0;                 // mit einem Brei wird nicht gerechnet
    for (id in v.n) {
      s = L.db.species[id];
      if (s.phase !== "aq") continue;
      c = v.n[id] / vol;
      if (s.bands) s.bands.forEach(function (band) { var x = (nm - band[0]) / (band[1] / 2.3548); sum += band[2] * c * d * Math.exp(-0.5 * x * x); });
      else if ((base = fromHex(s.color))) {
        // nur eine Farbe bekannt: drei breite Bereiche (blau, grün, rot) mit weichen Übergängen bei 490 und 580 nm
        w = nm < 480 ? [0, 0, 1] : nm < 500 ? [0, (nm - 480) / 20, (500 - nm) / 20] : nm < 570 ? [0, 1, 0] : nm < 590 ? [(nm - 570) / 20, (590 - nm) / 20, 0] : [1, 0, 0];
        sum -= (w[0] * Math.log10(base[0]) + w[1] * Math.log10(base[1]) + w[2] * Math.log10(base[2])) * c * d / (s.at || 0.1);
      }
    }
    v.lumps.forEach(function (l) { if (l.made) hang += l.n * (1 - l.settled); });
    return sum + hang / vol / HAZE / LN10 * d;
  }

  // Die Extinktion an den Stellen SHADES, begrenzt auf den Bereich, in dem man eine Änderung sehen oder messen kann
  function shades(v) {
    return SHADES.map(function (nm) { return Math.min(DARK, extinction(v, nm, 1)); });
  }

  function absorbance(lab, vesselId, nm, d) {
    var v = vessel(lab, vesselId);
    return v ? extinction(v, nm, d || 1) : 0;
  }

  // Spektrum der Flüssigkeit: [[nm, Extinktion], …] von 380 bis 730 nm
  function spectrum(lab, vesselId, d) {
    var v = vessel(lab, vesselId), out = [], nm;
    for (nm = 380; nm <= 730; nm += 5) out.push([nm, v ? extinction(v, nm, d || 1) : 0]);
    return out;
  }

  // Teilchenlupe: was in einem winzigen Ausschnitt der Flüssigkeit zu sehen wäre.
  // per: mol/L, für die ein Punkt steht (20 mmol/L; bei sehr konzentrierten Lösungen mehr, damit es höchstens 120 Punkte werden);
  // dots: gelöste Teilchen ohne das Wasser [{ id, n, charge }]; solids: Bausteine der Feststoffe [{ id, n, hang: Anteil, der schwebt }];
  // T: Temperatur in °C; wet: ob Flüssigkeit im Gefäß ist
  var DOT = 0.02, DOTS = 120, GRAINS = 12;
  function particles(lab, vesselId) {
    // walk: der Weg der Teilchen bis hierher (v.walk); paste: die Flüssigkeit ist ein Brei, mit dem nicht gerechnet wird;
    // residue: ohne Flüssigkeit liegt ein eingedampfter Rückstand im Gefäß
    var v = vessel(lab, vesselId), vol = v ? volume(v) : 0, out = { per: DOT, dots: [], solids: [], T: v ? v.T : lab.room, wet: vol > 0, walk: v ? v.walk || 0 : 0, paste: false, residue: false };
    var total = 0, sum = 0, list = [], solid = {}, hang = {}, shelf = {}, id;
    if (!v) return out;
    out.paste = vol > 0 && thick(v, vol);
    if (!(vol > 0)) for (id in v.n) if (L.db.species[id].phase === "aq") out.residue = true;
    if (vol > 0 && !out.paste) {
      for (id in v.n) if (L.db.species[id].phase === "aq") { list.push(id); total += v.n[id] / vol; }
      if (total / DOT > DOTS) out.per = total / DOTS;
      list.sort().forEach(function (x) {
        var n = Math.round(v.n[x] / vol / out.per);
        if (n > 0) out.dots.push({ id: x, n: n, charge: L.db.species[x].charge });
      });
    }
    v.lumps.forEach(function (l) {
      if (!(l.n > 0)) return;
      solid[l.id] = (solid[l.id] || 0) + l.n;
      hang[l.id] = (hang[l.id] || 0) + (l.made && vol > 0 ? l.n * (1 - l.settled) : 0);
      if (!l.made) shelf[l.id] = true;
    });
    // gezeigt wird, was man sieht: Stücke aus dem Regal immer, ein Niederschlag ab der Menge, die als Trübung auffällt
    list = Object.keys(solid).sort().filter(function (x) { return shelf[x] || !(vol > 0) || solid[x] / vol > SEEN; });
    list.forEach(function (x) { sum += solid[x]; });
    list.forEach(function (x) { out.solids.push({ id: x, n: Math.max(1, Math.round(GRAINS * solid[x] / sum)), hang: hang[x] / solid[x] }); });
    return out;
  }

  // Was ein Messgerät gerade anzeigen müsste; null, wenn es nichts zu messen gibt
  function sense(lab, t) {
    var v = t.in ? vessel(lab, t.in) : null, vol, def = L.parts[t.type], kind = def.sense;
    if (def.electrode) return massOf(t);
    if (def.circuit) return def.circuit === "supply" ? t.volts : t.goal;
    if (def.bath) return t.temp;
    if (kind === "T") return Math.max(L.parts[t.type].range[0], Math.min(L.parts[t.type].range[1], v ? v.T : lab.room));
    if (kind === "V") return t.n * molar(lab) * 1000;          // aufgefangenes Gas in mL
    if (kind === "p") return v && !v.broken && v.p != null ? v.p : P_AIR;
    if (kind === "m") return (v && !v.broken ? weigh(lab, v) : 0) - t.tare;
    vol = v ? volume(v) : 0;
    if (kind === "kappa") return vol > 0 && v.n[WATER] > 0 && !thick(v, vol) ? conduct(v, vol) * 1000 : null;
    if (kind === "A") return vol > 0 && !thick(v, vol) ? Math.min(def.range[1], extinction(v, t.nm, def.d)) : null;
    if (kind !== "pH") return null;
    return vol > 0 && v.n[PROTON] > 0 && !thick(v, vol) ? -Math.log10(v.n[PROTON] / vol) - gammas(v, vol)(PROTON) : null;
  }

  // Streuung der Anzeige: eine Zahl in [−1, 1], fest für Auslosung, Gerät und Schlüssel
  function jitter(seed, id, key) {
    var text = seed + "|" + id + "|" + key, h = 2166136261, i;
    for (i = 0; i < text.length; i++) { h ^= text.charCodeAt(i); h = Math.imul(h, 16777619); }
    h ^= h >>> 13; h = Math.imul(h, 0x5bd1e995); h ^= h >>> 15;
    return (h >>> 0) / 4294967295 * 2 - 1;
  }

  function scattered(lab, t) { return lab.scatter != null && !!L.parts[t.type].spread; }

  // Was das Gerät anzeigt: der Messwert mit seiner festen Abweichung und, wenn noisy, dem Rauschen dieser Sekunde.
  // Am Anschlag zeigt es den Anschlag; der Kolbenprober zeigt nicht mehr, als er fasst.
  function readout(lab, t, target, noisy) {
    var def = L.parts[t.type], sp = def.spread, range = def.sense && def.range, out;
    if (!scattered(lab, t) || target == null) return target;
    if (range && target >= range[1]) return range[1];
    if (range && target <= range[0]) return range[0];
    out = target * (1 + sp[1] * jitter(lab.scatter, t.id, "rel")) + sp[0] * jitter(lab.scatter, t.id, "sys");
    if (range) out = Math.min(range[1], out);
    if (def.sense === "V") out = Math.min(def.cap, out);
    return noisy ? wobble(lab, t, out) : out;
  }

  // das Rauschen dieser Sekunde auf einer Anzeige; es entsteht im Gerät, nach der Trägheit des Fühlers. Ohne Strom zeigt ein Strommesser 0
  function wobble(lab, t, base) {
    var def = L.parts[t.type], sp = def.spread, range = def.sense && def.range, sec = Math.floor(lab.t), out;
    if (base == null || (def.circuit && base === 0) || (range && (base >= range[1] || base <= range[0]))) return base;
    out = base + sp[2] * jitter(lab.scatter, t.id, sec) + base * sp[3] * jitter(lab.scatter, t.id, "r" + sec);
    if (range) out = Math.min(range[1], out);
    return def.sense === "V" ? Math.min(def.cap, out) : out;
  }

  // Anzeige eines Geräts setzen, ohne Trägheit (beim Aufbau und beim Einsetzen)
  function prime(lab, t) {
    var base = readout(lab, t, sense(lab, t), false);
    if (scattered(lab, t)) { t.smooth = base; t.value = wobble(lab, t, base); }
    else t.value = base;
  }

  function tick(lab, emit) {
    lab.tick++;
    lab.t = lab.tick / TICKS;
    if (lab.flows.length) flow(lab, emit);
    drip(lab, emit);
    lab.vessels.forEach(function (v) { v.rate = {}; v.q = 0; v.boil = 0; v.eg = 0; v.egas = {}; });      // q: Reaktionswärme dieses Schritts in J
    electro(lab, emit);
    lab.vessels.forEach(function (v) { advanceVessel(lab, v, emit); });
    lab.tools.forEach(function (t) {                           // Messgeräte folgen mit etwas Trägheit
      var target = readout(lab, t, sense(lab, t), false), noisy = scattered(lab, t), key = noisy ? "smooth" : "value";
      if (t.tint && lab.t >= t.tint.until) t.tint = null;      // die Flammenfärbung vergeht
      if (target == null || t[key] == null) t[key] = target;
      else {
        t[key] += (target - t[key]) * (1 - Math.exp(-DT / L.parts[t.type].lag));
        if (Math.abs(target - t[key]) < 1e-9) t[key] = target;
      }
      if (noisy) t.value = wobble(lab, t, t.smooth);           // mit Streuung: die geglättete Anzeige und darauf das Rauschen
    });
  }

  function step(lab, seconds, emit) {
    for (var n = Math.round(seconds * TICKS); n > 0; n--) tick(lab, emit);
  }

  // Die Temperatur, die ein Gefäß von sich aus annimmt: die des Raums oder die seines Wasserbads
  function ambient(lab, v) {
    var bath = toolAt(lab, v, function (def) { return def.bath; });
    return bath ? bath.temp : lab.room;
  }

  function atRest(lab) {
    if (lab.flows.length) return false;
    if (lab.tools.some(function (t) { return t.flame > 0 || t.tint || t.rate > REST; })) return false;      // solange ein Brenner brennt oder Strom etwas umsetzt, läuft die Uhr
    return lab.vessels.every(function (v) {
      var key;
      if (v.flag.shown > lab.t) return false;                    // eine Probe mit dem Span dauert noch an, auch wenn das Glas dabei zersprang
      if (v.broken) return true;
      if (v.gas > 1e-9 || v.dirty || v.boil > 0 || Math.abs(v.T - ambient(lab, v)) > 0.05) return false;
      if (lab.t - v.flag.tinted < FADE) return false;            // die Farbe hat sich eben noch geändert
      for (key in v.lit) return false;
      if (ready(lab, v, stoppered(lab, v))) return false;                                // auch gleich nach dem Aufbau: was reagieren kann, ruht nicht
      if (v.tap > 0 && vessel(lab, v.over) && volume(v) > 0) return false;                  // die Bürette läuft
      // es setzt sich noch ab: solange so viel schwebt, dass man die Trübung sehen könnte
      if (v.lumps.some(function (l) { return l.made && !L.db.species[l.id].colloid && l.settled < 0.97 && l.n * (1 - l.settled) > SEEN / 5 * volume(v); })) return false;
      for (key in v.rate) if (v.rate[key] > REST) return false;
      return true;
    }) && lab.tools.every(function (t) {
      // mit Streuung zählt die geglättete Anzeige ohne Rauschen: das Wackeln ist keine Bewegung
      var def = L.parts[t.type], target = readout(lab, t, sense(lab, t), false), now = scattered(lab, t) ? t.smooth : t.value;
      if (target == null || now == null) return target == null && now == null;      // ein Gerät, das eben erst etwas zu messen bekam (oder nichts mehr), muss noch umspringen
      return Math.abs(target - now) < (def.scale ? 0.005 : def.fine ? def.fine * Math.abs(target) + 1e-12 : def.sense === "pH" ? 0.01 : 0.05);
    });
  }

  // ------------------------------------------------------------------ Farbe

  // Farbe aus Absorptionsbanden: Lambert-Beer je Wellenlänge, dann über die Normspektralwerte in sRGB.
  // Normspektralwertkurven als Näherung nach Wyman, Sloan, Shirley (JCGT 2013).
  var WAVES = [], CMF = [], WHITE = [0, 0, 0];
  (function () {
    function lobe(x, mu, s1, s2) { var t = (x - mu) / (x < mu ? s1 : s2); return Math.exp(-0.5 * t * t); }
    for (var w = 380; w <= 730; w += 10) {
      WAVES.push(w);
      CMF.push([
        1.056 * lobe(w, 599.8, 37.9, 31.0) + 0.362 * lobe(w, 442.0, 16.0, 26.7) - 0.065 * lobe(w, 501.1, 20.4, 26.2),
        0.821 * lobe(w, 568.8, 46.9, 40.5) + 0.286 * lobe(w, 530.9, 16.3, 31.1),
        1.217 * lobe(w, 437.0, 11.8, 36.0) + 0.681 * lobe(w, 459.0, 26.0, 13.8)
      ]);
    }
    CMF.forEach(function (c) { var rgb = linear(c); for (var i = 0; i < 3; i++) WHITE[i] += rgb[i]; });
  })();

  function linear(xyz) {
    return [
      3.2406 * xyz[0] - 1.5372 * xyz[1] - 0.4986 * xyz[2],
      -0.9689 * xyz[0] + 1.8758 * xyz[1] + 0.0415 * xyz[2],
      0.0557 * xyz[0] - 0.2040 * xyz[1] + 1.0570 * xyz[2]
    ];
  }

  // Farbe von Licht einer Wellenlänge (nm) als [r, g, b], so hell wie möglich
  function waveRgb(nm) {
    var i = Math.max(0, Math.min(WAVES.length - 2, Math.floor((nm - WAVES[0]) / 10))), f = Math.max(0, Math.min(1, (nm - WAVES[i]) / 10));
    var rgb = linear([0, 1, 2].map(function (k) { return CMF[i][k] + f * (CMF[i + 1][k] - CMF[i][k]); })).map(function (value) { return Math.max(0, value); });
    var top = Math.max(rgb[0], rgb[1], rgb[2], 1e-9);
    return rgb.map(function (value) {
      var u = value / top;
      return Math.round(255 * (u <= 0.0031308 ? 12.92 * u : 1.055 * Math.pow(u, 1 / 2.4) - 0.055));
    });
  }

  function fromHex(hex) {
    var m = /^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex || "");
    return m ? [1, 2, 3].map(function (i) {
      var u = parseInt(m[i], 16) / 255;
      return Math.max(0.002, u <= 0.04045 ? u / 12.92 : Math.pow((u + 0.055) / 1.055, 2.4));
    }) : null;
  }

  function colorName(rgb) {
    var r = rgb[0] / 255, g = rgb[1] / 255, b = rgb[2] / 255;
    var max = Math.max(r, g, b), min = Math.min(r, g, b), c = max - min, light = (max + min) / 2, h, name;
    if (c < 0.06) return { name: light > 0.8 ? "colorless" : light < 0.15 ? "black" : "grey", pale: false };
    h = 60 * (max === r ? ((g - b) / c) % 6 : max === g ? (b - r) / c + 2 : (r - g) / c + 4);
    if (h < 0) h += 360;
    name = h < 15 ? "red" : h < 40 ? "orange" : h < 68 ? "yellow" : h < 165 ? "green" : h < 183 ? "cyan"
      : h < 255 ? "blue" : h < 290 ? "violet" : h < 340 ? "pink" : "red";
    if ((name === "orange" && light < 0.35) || (name === "red" && light < 0.2)) name = "brown";      // sehr dunkles Rot liest sich als Braun (Iod)
    if (name === "red" && light > 0.7) name = "pink";
    return { name: name, pale: c < 0.25 && light > 0.7 };
  }

  // conc: mol/L je gelöstem Teilchen, d: Schichtdicke in cm → { rgb, name, pale }
  function tint(conc, d) {
    var sum = [0, 0, 0], extra = [1, 1, 1], bands = [], id, s, i, k, A, T, rgb, base;
    for (id in conc) {
      s = L.db.species[id];
      if (!s || !(conc[id] > 0)) continue;
      if (s.bands) s.bands.forEach(function (band) { bands.push([band[0], band[1] / 2.3548, band[2] * conc[id] * d]); });
      else if (s.phase === "aq" && (base = fromHex(s.color)))       // nur eine Farbe bekannt: gilt bei der Konzentration "at"
        for (k = 0; k < 3; k++) extra[k] *= Math.pow(base[k], conc[id] * d / (s.at || 0.1));
    }
    if (!bands.length && extra[0] === 1 && extra[1] === 1 && extra[2] === 1) return { rgb: [255, 255, 255], name: "colorless", pale: false };
    for (i = 0; i < WAVES.length; i++) {
      A = 0;
      for (k = 0; k < bands.length; k++) { T = (WAVES[i] - bands[k][0]) / bands[k][1]; A += bands[k][2] * Math.exp(-0.5 * T * T); }
      T = Math.pow(10, -A);
      for (k = 0; k < 3; k++) sum[k] += T * CMF[i][k];
    }
    rgb = linear(sum).map(function (value, index) {
      var u = Math.max(0, Math.min(1, value / WHITE[index] * extra[index]));
      return Math.round(255 * (u <= 0.0031308 ? 12.92 * u : 1.055 * Math.pow(u, 1 / 2.4) - 0.055));
    });
    return Object.assign({ rgb: rgb }, colorName(rgb));
  }

  // Farbe einer Vorratslösung, wie sie in der Flasche aussieht: mit eingestelltem Gleichgewicht,
  // in der Tropfflasche durch eine dünne Schicht gesehen. Feststoffe: null.
  var samples = {};
  function sample(id) {
    var key = L.db.version + "/" + id, r, lab, v, vol, conc = {}, sp;
    if (key in samples) return samples[key];
    r = reagent(id);
    if (r.solid) return (samples[key] = null);
    lab = createLab({ room: 20, bench: [{ type: "beaker", id: "sample", size: 100, contains: [{ reagent: id, ml: 10 }] }] });
    v = lab.vessels[0]; vol = volume(v);
    for (sp in v.n) if (L.db.species[sp].phase === "aq") conc[sp] = v.n[sp] / vol;
    return (samples[key] = tint(conc, r.drops ? 0.2 : 3).rgb);
  }

  function colorOf(v) {
    var vol = volume(v), conc = {}, id;
    if (vol > 0) for (id in v.n) if (L.db.species[id].phase === "aq") conc[id] = v.n[id] / vol;
    return tint(conc, spec(v).d);
  }

  // ------------------------------------------------------------------ Ablesen

  // Alles, was man an einem Gefäß sieht oder daran abliest
  function view(lab, v) {
    var vol = volume(v), list = [], id, s;
    for (id in v.n) {
      s = L.db.species[id];
      list.push({ id: id, phase: s.phase, n: v.n[id], c: s.phase === "aq" && vol > 0 ? v.n[id] / vol : null });
    }
    list.sort(function (a, b) { return b.n - a.n; });
    var cloud = [0, 0, 0], ground = [0, 0, 0], hanging = 0, lying = 0, loose = 0, residue = 0, air = {}, cap = headroom(lab, v);
    var paste = thick(v, vol);
    if (!(vol > 0) || paste) list.forEach(function (x) { if (x.phase === "aq") residue += x.n; });
    for (id in v.air) air[id] = cap > 0 ? Math.min(1, v.air[id] / cap) : 0;
    v.lumps.forEach(function (l) {                             // Niederschlag: was schwebt, trübt; was liegt, ist Bodensatz
      var color = rgbOf(l.id), down = vol > 0 ? l.settled : 1, k;   // ohne Flüssigkeit liegt alles am Boden
      if (!l.made) return;
      // ein Kolloid streut das Licht: es trübt milchig, in einem blassen Ton seiner Farbe
      if (L.db.species[l.id].colloid) color = color.map(function (c) { return Math.round(c + (255 - c) * 0.6); });
      for (k = 0; k < 3; k++) {
        cloud[k] += color[k] * l.n * (1 - down);
        ground[k] += color[k] * l.n * down;
      }
      hanging += l.n * (1 - down);
      lying += l.n * down;
      loose += l.n * down * L.db.species[l.id].M / 0.4;        // mL, locker geschüttet mit 0,4 g/mL
    });
    return {
      id: v.id, type: v.type, cap: spec(v).cap, ml: vol * 1000, T: v.T,
      over: v.over, tap: v.tap, given: v.given,
      // cloud: Trübung (Farbe und Deckkraft), sediment: Bodensatz (Farbe und lockeres Volumen in mL)
      cloud: { rgb: cloud.map(function (c) { return hanging > 0 ? Math.round(c / hanging) : 255; }), alpha: vol > 0 ? 1 - Math.exp(-hanging / vol / HAZE) : 0 },
      sediment: { rgb: ground.map(function (c) { return lying > 0 ? Math.round(c / lying) : 255; }), ml: loose },
      // der pH-Wert ist der negative Logarithmus der Aktivität; strength: Ionenstärke in mol/L, nur im realen Modell
      pH: vol > 0 && !paste && v.n[WATER] > 0 && v.n[PROTON] > 0 ? -Math.log10(v.n[PROTON] / vol) - gammas(v, vol)(PROTON) : null,
      strength: v.real && vol > 0 && !paste && v.n[WATER] > 0 ? strength(v, vol) : null,
      color: colorOf(v), gas: v.gas, species: list,
      // steam: Dampf in mol/s, residue: eingedampfter Rückstand in mol, air: Anteil jedes Gases im Gasraum, broken: zersprungen
      steam: v.boil, residue: residue, air: air, broken: !!v.broken,
      torch: v.flag.torch != null && lab.t - v.flag.torch < 0.2,      // an der Öffnung brennt Gas ab
      // fire: was brennt, mit Geschwindigkeit und Aussehen der Flamme
      fire: L.db.reactions.filter(function (r) { return v.lit[r.key]; }).map(function (r) {
        var look = r.fire || {};
        return { species: fuel(r), rate: v.rate[r.key] || 0, color: look.color || "#ffb040", glare: look.glare || 0, smoke: look.smoke || null, glow: !!look.glow };
      }),
      // Feststoffe aus dem Regal. form: "strip" (Band, wird dünner) oder "grains"; g0: Masse am Anfang
      // T: seine eigene Temperatur; molten, float: geschmolzen, schwimmt; glow: glüht (rgb, level); flame: brennender Wasserstoff;
      // spatter: so heftig, dass geschmolzenes Metall spritzt
      solids: v.lumps.filter(function (l) { return !l.made; }).map(function (l) {
        var s = L.db.species[l.id], T = l.T != null ? l.T : v.T, glow = T >= GLOW && !l.glowOff ? glowColor(T) : null, molten = s.Tm != null && T >= s.Tm;
        return { id: l.id, n: l.n, part: l.n / l.n0, g0: l.n0 * s.M, form: l.form || (l.p === 0 ? "strip" : "grains"),
          T: T, molten: molten, float: vol > 0 && s.rho != null && s.rho < 1, glow: glow,
          flame: l.flame > 0 ? { color: l.tint, rate: l.flame } : null, spatter: molten && (l.heat || 0) > SPATTER };
      }),
      inflow: lab.flows.some(function (f) { return f.to === v.id; }),
      outflow: lab.flows.some(function (f) { return f.from === v.id; })
    };
  }

  function reading(lab, toolId) {
    var t = tool(lab, toolId);
    var range = t && L.parts[t.type].range;
    // over: der Messwert liegt am Ende der Skala oder darüber
    var out = t ? { value: t.value, unit: L.parts[t.type].unit, in: t.in, type: t.type, flame: t.flame, tint: t.tint || null, full: !!t.full,
      over: !!(range && L.parts[t.type].sense && t.value >= range[1] - 1e-9) } : null, def = t && L.parts[t.type];      // nur ein Messgerät hat ein Ende der Skala
    if (!t) return null;
    if (def.electrode) {
      // material, n: woraus sie besteht; g, g0: Masse jetzt und am Anfang; coat: Beläge; bub: Gas in mol/s; pole: "+", "-" oder ""
      out.material = def.electrode; out.n = t.n; out.g = massOf(t); out.g0 = t.n0 * L.db.species[def.electrode].M;
      out.coat = Object.keys(t.coat).filter(function (id) { return t.coat[id] > 1e-12; }).map(function (id) { return { id: id, n: t.coat[id] }; })
        .sort(function (x, y) { return y.n - x.n; });
      out.bub = t.bub; out.pole = t.pole; out.i = t.i; out.side = t.side;
    }
    if (def.circuit === "supply") { out.volts = t.volts; out.flip = t.flip; }
    if (def.bridge) out.to = t.to;
    if (def.pipe) { out.to = t.to; out.flow = t.flow || 0; }   // flow: Gas in mol/s, das gerade durch das Rohr perlt
    if (def.condenser) {                                         // to: die Vorlage; drip: aus dem Kühler tropft Destillat
      out.to = t.to;
      out.drip = !!(t.in && vessel(lab, t.in) && vessel(lab, t.in).boil > 0 && vessel(lab, t.to) && !vessel(lab, t.to).broken);
    }
    if (def.bath) out.temp = t.temp;
    if (def.sense === "A") out.nm = t.nm;
    return out;
  }

  // Die Reaktionen, die in einem Gefäß abgelaufen sind oder laufen, in der Richtung, in der sie abliefen
  function reactions(lab, vesselId) {
    var v = vessel(lab, vesselId), out = [], most = {}, vol;
    if (!v) return out;
    vol = volume(v);
    L.db.reactions.concat(L.db.derived, L.db.equilibria).forEach(function (r) {
      var extent = v.ext[r.key] || 0, back = extent < 0, dH = heatOf(r), logK;
      if (r.reversible) {
        if (Math.abs(extent) < 1e-9 || (vol > 0 && Math.abs(extent) / vol < 2e-6)) return;
        logK = back ? -r.logK : r.logK;
      // Eine Reaktion zählt erst, wenn man ihren Umsatz messen könnte: 10 nmol, oder weniger, solange sie merklich läuft (ein
      // Farbstoff, von dem nur Mikromol da sind). Eine hergeleitete Redoxreaktion zählt ab 1 nmol.
      } else if (!(r.times ? extent > 1e-9 : extent > 1e-8 || (extent > 1e-10 && v.rate[r.key] > REST))) return;
      out.push({
        key: r.key, extent: Math.abs(extent), rate: v.rate[r.key] || 0, dH: dH == null ? null : back ? -dH : dH,
        left: back ? r.right : r.left, right: back ? r.left : r.right, catalysts: r.catalysts || [],
        complete: !r.reversible || logK >= 3,
        eq: sideText(back ? r.right : r.left) + (!r.reversible || logK >= 3 ? " -> " : " <=> ") + sideText(back ? r.left : r.right)
      });
    });
    // Vorgänge an den Elektroden eines Stromkreises: mit Elektronen geschrieben. at: die Elektrode, kind: "ox" oder "red"
    // Gezeigt wird, was man messen könnte und was neben dem Hauptvorgang derselben Elektrode ins Gewicht fällt (ein Zehntausendstel).
    Object.keys(v.half).forEach(function (hk) {
      var at = hk.split(" ").slice(0, 2).join(" ");
      most[at] = Math.max(most[at] || 0, v.half[hk]);
    });
    Object.keys(v.half).forEach(function (hk) {
      var cut = hk.split(" "), c = null, flow, ox = cut[0] === "ox";
      L.db.couples.forEach(function (x) { if (x.key === cut.slice(2).join(" ")) c = x; });
      if (!c || !(v.half[hk] > 1e-9) || v.half[hk] < 1e-4 * most[cut[0] + " " + cut[1]]) return;
      flow = [{ id: ELECTRON, n: c.n }];
      out.push({
        key: hk, extent: v.half[hk], rate: v.rate[hk] || 0, dH: null, at: cut[1], kind: cut[0], complete: true, catalysts: [],
        left: ox ? c.red : c.ox.concat(flow), right: ox ? c.ox.concat(flow) : c.red,
        eq: sideText(ox ? c.red : c.ox.concat(flow)) + " -> " + sideText(ox ? c.ox.concat(flow) : c.red)
      });
    });
    return out.sort(function (a, b) { return b.extent - a.extent; });
  }

  // ------------------------------------------------------------------ Aufzeichnung

  var KEEP = 6000;                // so viele Abbilder höchstens

  function snapshot(lab) {
    return JSON.stringify({ tick: lab.tick, vessels: lab.vessels, tools: lab.tools, flows: lab.flows, used: lab.used });
  }

  function restore(lab, text) {
    var d = JSON.parse(text);
    lab.tick = d.tick; lab.t = d.tick / TICKS;
    lab.vessels = d.vessels; lab.tools = d.tools; lab.flows = d.flows; lab.used = d.used;
    lab.cells = null; lab.warm = {};
  }

  function measure(lab) {         // was die Diagramme brauchen
    var m = { tools: {}, v: {} };
    lab.tools.forEach(function (t) { if (t.value != null) m.tools[t.id] = t.value + (t.tare || 0); });      // die Waage ohne Tara: das Diagramm zeigt Änderungen
    lab.vessels.forEach(function (v) {
      var n = {}, id;
      for (id in v.n) n[id] = v.n[id];
      for (id in v.air) n[id] = (n[id] || 0) + v.air[id];
      for (id in v.out) n[id] = (n[id] || 0) + v.out[id];
      m.v[v.id] = { T: v.T, n: n, given: v.given };
    });
    return m;
  }

  // Ein Abbild: t Zeit, k Rechenschritt, s Zustand, m Messwerte, n Länge des Protokolls bis hierher,
  // keep: bleibt beim Ausdünnen (Eingriffe), tail: vorläufiges Schlussbild zwischen zwei Rasterpunkten.
  function record(run, action, tail) {
    var frames = run.frames, last = frames[frames.length - 1], s = snapshot(run.lab), step;
    if (last && last.tail) {
      if (action) { last.tail = false; last.keep = true; }        // der Zustand vor dem Eingriff bleibt erhalten
      else { frames.pop(); last = frames[frames.length - 1]; }    // sonst weicht das vorläufige Bild dem neuen
    }
    if (last && last.s === s) s = last.s;                         // in Ruhe: dieselbe Zeichenkette, kein neuer Speicher
    frames.push({ t: run.lab.t, k: run.lab.tick, s: s, m: measure(run.lab), n: run.log.length, keep: !!action, tail: !!tail });
    if (frames.length > run.limit) {
      // gleichmäßig ausdünnen: jedes zweite Rasterbild fällt weg, das Raster wird doppelt so weit
      step = run.every * 2;
      run.frames = frames.filter(function (f, i) { return f.keep || f.tail || f.k % step === 0 || i === frames.length - 1; });
      run.every = step;
      run.limit = Math.max(KEEP, run.frames.length + KEEP / 2);
    }
    run.cursor = run.frames.length - 1;
    run.end = run.time = run.lab.t;
  }

  function indexAt(run, t) {      // letztes Abbild mit Zeit ≤ t
    var lo = 0, hi = run.frames.length - 1, mid;
    while (lo < hi) {
      mid = (lo + hi + 1) >> 1;
      if (run.frames[mid].t <= t + 1e-9) lo = mid; else hi = mid - 1;
    }
    return lo;
  }

  // run.cursor: das Abbild, das gerade gilt. Steht es nicht am Ende, zeigt die Fläche Vergangenes.
  function createRun(config) {
    var run = { config: config, lab: createLab(config), frames: [], log: [], time: 0, end: 0, every: 2, limit: KEEP, cursor: 0 };
    run.emit = function (event) { event.t = run.lab.t; run.log.push(event); };
    record(run);
    return run;
  }

  function go(run, index) {
    run.cursor = index;
    restore(run.lab, run.frames[index].s);
  }

  function inPast(run) { return run.cursor < run.frames.length - 1; }

  // Zeiger auf die Zeit t. Bei t = 0 gilt der Ausgangszustand, vor jedem Eingriff.
  function seek(run, t) {
    t = Math.max(0, Math.min(run.end, t));
    go(run, t <= 0 ? 0 : indexAt(run, t));
    run.time = t;
  }

  function toStart(run) { seek(run, 0); }

  function toEnd(run) {
    go(run, run.frames.length - 1);
    run.time = run.end;
  }

  // Was bis zum Zeiger im Protokoll steht
  function logAt(run) { return run.log.slice(0, run.frames[run.cursor].n); }

  // Zeit vorwärts: innerhalb der Aufzeichnung wird abgespielt, am Ende weitergerechnet
  function advance(run, seconds) {
    var target = run.time + seconds, n;
    if (inPast(run)) {
      if (target < run.end - 1e-9) {
        go(run, Math.max(run.cursor, indexAt(run, target)));
        run.time = target;
        return;
      }
      toEnd(run);
      if (target <= run.end + 1e-9) return;
    }
    for (n = Math.round((target - run.end) * TICKS); n > 0; n--) {
      tick(run.lab, run.emit);
      if (run.lab.tick % run.every === 0) record(run);
    }
    // der letzte Schritt liegt meist zwischen zwei Rasterpunkten: ein vorläufiges Schlussbild hält ihn fest
    if (run.frames[run.frames.length - 1].k !== run.lab.tick) record(run, false, true);
  }

  // Eingriff am Zeiger. Steht er in der Vergangenheit, wird alles Spätere verworfen, auch im Protokoll.
  function act(run, work, mark) {
    var result;
    if (inPast(run)) {
      run.frames.length = run.cursor + 1;
      run.log.length = run.frames[run.cursor].n;
      run.end = run.time = run.frames[run.cursor].t;
    }
    result = work(run.lab, run.emit);
    if (mark) run.emit(typeof mark === "function" ? mark(result) : Object.assign({}, mark));
    record(run, true);
    return result;
  }

  // Messreihe als [[t, Wert], …], höchstens 400 Punkte.
  // q: { tool } für ein Messgerät oder { vessel, species } für eine Stoffmenge (mit dem, was entwichen ist)
  function series(run, q) {
    var frames = run.frames, stride = Math.max(1, Math.ceil(frames.length / 400)), out = [], i, f, value;
    for (i = 0; i < frames.length; i += stride) {
      f = frames[i === 0 || i + stride < frames.length ? i : frames.length - 1];
      value = q.tool ? f.m.tools[q.tool] : f.m.v[q.vessel] ? f.m.v[q.vessel].n[q.species] || 0 : undefined;
      if (value !== undefined) out.push([f.t, value]);
    }
    return out;
  }

  // Ein Messwert über einer Größe, die man selbst einstellt, als [[x, Messwert], …]:
  // q.burette: über dem, was die Bürette abgegeben hat (Titrationskurve); q.x: über der Anzeige eines anderen Geräts (Kennlinie)
  function curve(run, q) {
    var points = [], out = [], stride, i, last;
    run.frames.forEach(function (f) {
      var m = q.burette ? f.m.v[q.burette] : null, x = q.burette ? m && m.given : f.m.tools[q.x], y = f.m.tools[q.tool];
      if (x == null || y === undefined) return;
      last = points[points.length - 1];
      if (last && q.burette && x < last[0] - 1e-9) { points = []; last = null; }      // die Bürette zählt wieder von null: eine neue Probe
      if (last && Math.abs(x - last[0]) < 1e-9) last[1] = y;                     // kein neuer Wert auf der Achse: der letzte Messwert zählt
      else points.push([x, y]);
    });
    stride = Math.max(1, Math.ceil(points.length / 400));
    for (i = 0; i < points.length; i += stride) out.push(points[i === 0 || i + stride < points.length ? i : points.length - 1]);
    return out;
  }

  // Teilchenarten, deren Menge sich in einem Gefäß geändert hat, seit es auf dem Tisch steht (ohne das Lösungsmittel)
  function changed(run, vesselId) {
    var low = {}, high = {}, first = null;
    run.frames.forEach(function (f) {
      var entry = f.m.v[vesselId], id, value;
      if (!entry) return;
      if (!first) first = entry.n;
      for (id in entry.n) if (!(id in high)) { high[id] = 0; low[id] = id in first ? Infinity : 0; }   // später Hinzugekommenes begann bei null
      for (id in high) {
        value = entry.n[id] || 0;
        if (value > high[id]) high[id] = value;
        if (value < low[id]) low[id] = value;
      }
    });
    return Object.keys(high).filter(function (id) { return id !== WATER && id !== STEAM && high[id] - low[id] > 1e-9; });
  }

  // Der Zustand am Zeiger für Skripte im Lehrtext (@input): Anzeige der Geräte, je Gefäß Volumen, Temperatur, Stoffmengen und
  // laufende Gleichungen, dazu die Schlüssel im Protokoll. Vier geltende Ziffern, damit nicht jeder Rechenschritt ein neuer Zustand ist.
  function stateOf(run) {
    var lab = run.lab, out = { t: sig(run.time), values: {}, vessels: {}, seen: [] };
    function sig(x) { return +(+x).toPrecision(4); }
    function side(terms) { return terms.map(function (t) { return (t.n === 1 ? "" : t.n + " ") + t.id; }).join(" + "); }
    lab.tools.forEach(function (t) {
      var value = L.parts[t.type].circuit === "supply" ? t.volts : t.value;
      if (typeof value === "number" && isFinite(value)) out.values[t.id] = sig(value);
    });
    lab.vessels.forEach(function (v) {
      var n = {}, id;
      if (!v.veiled) for (id in v.n) if (v.n[id] > 1e-12) n[id] = sig(v.n[id]);      // eine Probe verrät auch Folienskripten nichts
      out.vessels[v.id] = { ml: sig(volume(v) * 1000), T: sig(v.T), n: n, equations: v.veiled ? [] : reactions(lab, v.id).map(function (r) {
        return side(r.left) + (r.complete ? " → " : " ⇌ ") + side(r.right);
      }) };
    });
    logAt(run).forEach(function (event) { if (out.seen.indexOf(event.key) < 0) out.seen.push(event.key); });
    return out;
  }

  // ------------------------------------------------------------------ Pakete

  // Ein Paket ist eine JSON-Datei im Format von "data". Jede Adresse wird einmal geladen; das Versprechen erfüllt sich immer,
  // auch wenn das Laden scheitert: Dann steht in error, warum ({ code: "http" | "net" | "json" | "data", detail }).
  var packs = {};

  function loadPack(url) {
    var entry = packs[url];
    if (entry && entry.state !== "error") return entry.promise;       // ein gescheitertes Paket wird beim nächsten Aufruf neu versucht
    entry = packs[url] = { url: url, state: "loading", pack: null, error: null };
    function failed(code, detail) { entry.state = "error"; entry.error = { code: code, detail: detail || "" }; return entry; }
    // Antwortet der Server nicht, gilt das Paket nach L.PACK_WAIT Sekunden als gescheitert: sonst warteten alle Flächen für immer
    var timer;
    entry.promise = Promise.race([Promise.resolve().then(function () { return global.fetch(url); }),
      new Promise(function (resolve) { timer = setTimeout(function () { resolve(null); }, L.PACK_WAIT * 1000); })]).then(function (response) {
      clearTimeout(timer);
      if (!response) return failed("wait");
      if (!response.ok) return failed("http", "HTTP " + response.status);
      return response.json().then(function (pack) {
        try { register(pack); } catch (error) { return failed("data", error.detail || error.message); }
        entry.state = "done";
        entry.pack = pack;
        if (L.packDone) L.packDone();                            // Flächen, denen die Daten fehlten, bauen sich neu auf
        return entry;
      }, function () { return failed("json"); });
    }, function (error) { clearTimeout(timer); return failed("net", error && error.message); });
    return entry.promise;
  }

  function packState(url) { return packs[url] || null; }
  function loadingPacks() { return Object.keys(packs).some(function (url) { return packs[url].state === "loading"; }); }
  // erfüllt sich, wenn kein Paket mehr lädt (auch eines, das während des Wartens dazukommt)
  function packsLoaded() {
    var open = Object.keys(packs).filter(function (url) { return packs[url].state === "loading"; });
    return open.length ? Promise.all(open.map(function (url) { return packs[url].promise; })).then(packsLoaded) : Promise.resolve();
  }

  // ------------------------------------------------------------------ Aufbau als Text

  // Der Aufbau als Text, so wie er jetzt dasteht: die Geräte an ihrem Platz und in jedem Gefäß, was hineingegeben wurde.
  // Beim Umgießen geht von allem Flüssigen der Anteil mit, den die gegossene Menge an dem hat, was hineingegeben wurde;
  // Feststoffe bleiben zurück. Was aus einer Bürette tropfte, steht weiter in der Bürette; Reaktionen laufen nach dem
  // Einlesen von vorn. raw: die Beschreibung, aus der der Versuch entstand; alles außer bench bleibt, wie es dort steht.
  function describe(run, raw) {
    var lab = run.lab, put = {}, bench = [], rest = "";
    function liquid(c) { return c.ml != null ? c.ml : c.drops != null ? c.drops * DROP : 0; }
    function plain(c) { return c.g != null ? { reagent: c.reagent, g: c.g } : reagent(c.reagent).drops ? { reagent: c.reagent, drops: round(c.ml / DROP) } : { reagent: c.reagent, ml: c.ml }; }
    function keep(id, entry) {
      var list = put[id] = put[id] || [], unit = entry.g != null ? "g" : entry.drops != null ? "drops" : "ml";
      var same = list.filter(function (c) { return c.reagent === entry.reagent && c[unit] != null; })[0];
      if (same) same[unit] += entry[unit];
      else { same = { reagent: entry.reagent }; same[unit] = entry[unit]; list.push(same); }
    }
    run.config.bench.forEach(function (item) {
      if (!item.contains || item.unknown) return;              // aus einer Probe gießt die Kopie nichts weiter
      put[item.id] = [];
      item.contains.forEach(function (c) {
        var r = reagent(c.reagent);
        keep(item.id, c.g != null ? { reagent: c.reagent, g: c.g } : r.drops ? { reagent: c.reagent, drops: c.ml / DROP } : { reagent: c.reagent, ml: c.ml });
      });
    });
    logAt(run).forEach(function (e) {
      var from, total, share;
      if (e.key === "added") keep(e.vessel, e);
      else if (e.key === "emptied") put[e.vessel] = [];
      else if (e.key === "removed") delete put[e.part];
      else if (e.key === "poured") {
        from = put[e.from] || [];
        total = from.reduce(function (sum, c) { return sum + liquid(c); }, 0);
        share = total > 0 ? Math.min(1, e.ml / total) : 0;
        from.forEach(function (c) {
          var unit = c.ml != null ? "ml" : c.drops != null ? "drops" : null, moved;
          if (!unit || !(share > 0)) return;
          moved = { reagent: c.reagent };
          moved[unit] = c[unit] * share;
          c[unit] -= moved[unit];
          keep(e.vessel, moved);
        });
        put[e.from] = from.filter(function (c) { return !(c.ml != null && c.ml < 1e-9) && !(c.drops != null && c.drops < 1e-9); });
      }
    });
    function round(x) { return +x.toPrecision(4); }
    lab.vessels.forEach(function (v) {
      var def = L.parts[v.type], item = { type: v.type, id: v.id }, cfg = run.config.bench.filter(function (o) { return o.id === v.id; })[0];
      if (v.broken) return;
      if (def.sizes) item.ml = v.size;
      if (def.dispenser && v.over && vessel(lab, v.over) && !vessel(lab, v.over).broken) item.over = v.over;
      if (cfg && cfg.unknown) {                                 // eine unbekannte Probe bleibt unbekannt: wie sie beschrieben war, ohne was danach hineinkam
        item.unknown = cfg.unknown;
        if (cfg.oneOf) item.oneOf = cfg.oneOf.map(function (o) { return { name: o.name, contains: o.contains.map(plain) }; });
        else item.contains = cfg.contains.map(plain);
        bench.push(item);
        return;
      }
      // Wer nachfüllt, was ausgetropft oder verdampft ist, hat mehr hineingegeben, als das Gefäß fasst: dann zählt der Anteil, der hineinpasst
      var list = put[v.id] || [], wet = list.reduce(function (sum, c) { return sum + liquid(c); }, 0), cap = spec(v).cap, fit = wet > cap ? cap / wet : 1;
      item.contains = list.map(function (c) {
        var out = { reagent: c.reagent };
        ["ml", "drops", "g"].forEach(function (unit) { if (c[unit] != null) out[unit] = unit === "g" ? round(c[unit]) : round(c[unit] * fit); });
        return out;
      });
      bench.push(item);
    });
    lab.tools.forEach(function (t) {
      var def = L.parts[t.type], item = { type: t.type, id: t.id }, host = t.in && vessel(lab, t.in), g;
      if (host && !host.broken) item[def.under ? "under" : "in"] = t.in;
      if (def.flames && t.flame) item.flame = t.flame;
      if (def.bath) item.temp = t.temp;
      if (def.sense === "A") item.nm = t.nm;
      if (def.circuit === "supply") { item.volts = t.volts; if (t.flip) item.flip = true; }
      if ((def.bridge || def.duct) && item.in && t.to && vessel(lab, t.to) && !vessel(lab, t.to).broken) item.to = t.to;      // ohne das erste Gefäß liegt sie für sich
      if (def.electrode) { g = round(t.n0 * species(def.electrode).M); if (Math.abs(g - def.g) > 1e-9) item.g = g; }
      bench.push(item);
    });
    Object.keys(raw && typeof raw === "object" ? raw : {}).forEach(function (key) {
      var value = raw[key];
      // ein Ziel zu einer Probe, die nicht mehr dasteht, fällt weg: sonst ließe sich die Kopie nicht einlesen
      if (key === "task" && value && Array.isArray(value.goals)) value = Object.assign({}, value, { goals: value.goals.filter(function (g) {
        return !(g && g.identify != null) || bench.some(function (item) { return item.unknown === g.identify; });
      }) });
      if (key !== "bench") rest += ',\n "' + key + '":' + JSON.stringify(value);
    });
    return '{"bench":[\n  ' + bench.map(function (item) { return JSON.stringify(item); }).join(",\n  ") + "\n ]" + rest + "}";
  }

  // ------------------------------------------------------------------ nach außen

  L.fail = fail;
  L.parse = parse;
  L.formulaText = formulaText;
  L.formulaHtml = formulaHtml;
  L.equation = equation;
  L.enthalpy = enthalpy;
  L.heatOf = heatFor;
  L.register = register;
  L.checkTask = checkTask;
  L.describe = describe;
  L.loadPack = loadPack;
  L.packState = packState;
  L.loadingPacks = loadingPacks;
  L.packsLoaded = packsLoaded;
  L.PACK_WAIT = 30;
  L.MEASURES = MEASURES;
  L.registerPart = registerPart;
  L.lint = lint;
  L.species = species;
  L.reagent = reagent;
  L.normalize = normalize;
  L.createLab = createLab;
  L.vessel = vessel;
  L.tool = tool;
  L.volume = volume;
  L.heatCapacity = heatCapacity;
  L.free = free;
  L.add = add;
  L.pour = pour;
  L.pourable = pourable;
  L.empty = empty;
  L.place = place;
  L.remove = remove;
  L.attach = attach;
  L.setTap = setTap;
  L.setFlame = setFlame;
  L.setVolts = setVolts;
  L.setTemp = setTemp;
  L.setWave = setWave;
  L.absorbance = absorbance;
  L.waveRgb = waveRgb;
  L.particles = particles;
  L.spectrum = spectrum;
  L.setPole = setPole;
  L.circuit = circuit;
  L.circuits = function (lab) { if (!lab.cells) survey(lab); return lab.cells; };
  L.PLATE = PLATE;
  L.probe = probe;
  L.flameTest = flameTest;
  L.headroom = headroom;
  L.conductivity = conductivity;
  L.FARADAY = FARADAY;
  L.step = step;
  L.atRest = atRest;
  L.tint = tint;
  L.sample = sample;
  L.view = view;
  L.reading = reading;
  L.hazards = hazards;
  L.massPercent = massPercent;
  L.reactions = reactions;
  L.createRun = createRun;
  L.seek = seek;
  L.toStart = toStart;
  L.toEnd = toEnd;
  L.inPast = inPast;
  L.logAt = logAt;
  L.advance = advance;
  L.act = act;
  L.series = series;
  L.glassMass = glassMass;
  L.guess = guess;
  L.glowColor = glowColor;
  L.zoneFactor = function (lab, id, reagentId, ml) { return zoneFactor(vessel(lab, id), portion(reagent(reagentId), { ml: ml }), ml); };
  L.tare = tare;
  L.curve = curve;
  L.changed = changed;
  L.snapshot = stateOf;
  L.DROP = DROP;
  L.gamma = gamma;
  L.selfConsistent = selfConsistent;

  // Der Browser führt die Dateien nicht verlässlich in der Reihenfolge des Kurskopfs aus. Was vor dem Rechenkern ankam
  // und ihn braucht, hat sich in L.pending eingetragen und läuft jetzt.
  Object.keys(L.pending || {}).forEach(function (file) {
    var start = L.pending[file];
    delete L.pending[file];
    start(global);
  });
})(typeof globalThis !== "undefined" ? globalThis : this);
