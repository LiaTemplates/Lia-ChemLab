/* ChemLab – Effekte und Klang.
   Jedes Bild ist eine reine Funktion der Zeit: Der Ort jeder Blase und jeder Rauchschwade folgt aus ihrer Nummer
   und der Uhr. Deshalb muss nichts gespeichert werden, und rückwärts abgespielt laufen die Blasen nach unten.
   Der Klang entsteht aus gefiltertem Rauschen über Web Audio, ohne Tondateien. */
(function (global) {
  "use strict";

  var L = (global.LiaChemLab = global.LiaChemLab || {});
  var fx = (L.fx = L.fx || {});

  function pseudo(seed, i) {        // feste „Zufallszahl“ zwischen 0 und 1
    var x = Math.sin(seed * 12.9898 + i * 78.233) * 43758.5453;
    return x - Math.floor(x);
  }

  function f(value) { return (Math.round(value * 10) / 10).toString(); }

  // So viele Blasen zeigt ein Gefäß bei einer Gasbildung von rate mol/s
  // (ab 1e-9 mol/s: so wenig hält schon die Uhr am Laufen, also soll man es auch sehen)
  fx.count = function (rate) {
    if (!(rate > 1e-9)) return 0;
    return Math.max(1, Math.min(16, Math.round(4 + 3 * Math.log10(rate / 1e-6))));
  };

  // Blasen in der Flüssigkeit. box: { x0, x1, top, bottom }, t: Zeit in s, seed: je Gefäß verschieden,
  // still: ohne Bewegung (Einstellung „weniger Bewegung“)
  fx.bubbles = function (box, rate, t, seed, still) {
    var n = fx.count(rate), out = "", height = box.bottom - box.top, width = box.x1 - box.x0, i;
    var speed, phase, x, y, r;
    if (!n || !(height > 2)) return "";
    for (i = 0; i < n; i++) {
      speed = 34 + 30 * pseudo(seed, i);                             // Bildpunkte je Sekunde
      phase = pseudo(seed + 3, i) + (still ? 0 : t * speed / height);
      phase -= Math.floor(phase);
      r = 1.2 + 2 * pseudo(seed + 5, i);
      x = box.x0 + r + (0.15 + 0.7 * pseudo(seed + 9, i)) * Math.max(0, width - 2 * r) + (still ? 0 : Math.sin(t * 5 + i) * 1.2);
      y = Math.min(box.bottom, Math.max(box.top, box.bottom - r - phase * (height - 2 * r)));
      out += '<circle class="cl-bubble" cx="' + f(x) + '" cy="' + f(y) + '" r="' + f(r * (0.7 + 0.3 * phase)) + '"/>';
    }
    return out;
  };

  // Sieden: Dampfblasen entstehen an festen Keimstellen am Boden (Kratzer, Siedesteine), wachsen dort, lösen sich ab, steigen
  // beschleunigt auf und werden dabei größer; oben wölben sie die Oberfläche und platzen mit einem Ring und zwei Spritzern.
  // Gemeinsames Modell für 2D und 3D, in cm, eine reine Funktion der Zeit wie die übrigen Effekte.
  // level: 0 bis 1 (wie heftig es siedet), depth: Tiefe der Flüssigkeit in cm. Zurück je Blase:
  // { u, v: Lage am Boden in einer Kreisscheibe (−1 bis 1), y: Höhe über dem Boden, r: Radius (cm), stage: "grow" | "rise" | "burst", q: 0 bis 1 }
  var BOIL = { grow: 0.3, v0: 4, acc: 10, burst: 0.32 };      // s, cm/s, cm/s², s (sichtbar verlangsamt: echte Blasen steigen mit 20 bis 30 cm/s)
  fx.boiling = function (level, depth, t, seed, still) {
    var out = [], n, k, a, d, r0, grow, rise, wait, P, tau, s, y;
    if (!(level > 0) || !(depth > 0.05)) return out;
    n = Math.round((5 + 13 * level) * Math.min(2, Math.max(1, depth / 4)));
    for (k = 0; k < n; k++) {
      a = pseudo(seed + 21, k) * 6.2832; d = 0.9 * Math.sqrt(pseudo(seed + 23, k));
      r0 = 0.08 + 0.12 * pseudo(seed + 25, k);
      grow = BOIL.grow * (1.2 - 0.6 * level) * (0.7 + 0.6 * pseudo(seed + 27, k));
      rise = (Math.sqrt(BOIL.v0 * BOIL.v0 + 2 * BOIL.acc * depth) - BOIL.v0) / BOIL.acc;      // y = v0 s + acc s²/2 = depth
      wait = (0.15 + 0.85 * pseudo(seed + 29, k)) * (1.4 - level);
      P = grow + rise + BOIL.burst + wait;
      tau = (still ? 0 : t) + pseudo(seed + 31, k) * P;
      tau -= Math.floor(tau / P) * P;
      if (tau < grow) out.push({ u: d * Math.cos(a), v: d * Math.sin(a), y: 0, r: r0 * Math.max(0.15, tau / grow), stage: "grow", q: tau / grow });
      else if (tau < grow + rise) {
        s = tau - grow; y = Math.min(depth, BOIL.v0 * s + BOIL.acc * s * s / 2);
        out.push({ u: d * Math.cos(a) + (still ? 0 : 0.04 * Math.sin(9 * s + k)), v: d * Math.sin(a), y: y, r: r0 * (1 + 0.7 * y / depth), stage: "rise", q: y / depth });
      } else if (tau < grow + rise + BOIL.burst) out.push({ u: d * Math.cos(a), v: d * Math.sin(a), y: depth, r: r0 * 1.7, stage: "burst", q: (tau - grow - rise) / BOIL.burst });
    }
    return out;
  };

  // Das Sieden in 2D: box wie bei fx.bubbles (bottom: Boden, top: Spiegel), Bildpunkte; 16 Bildpunkte sind 1 cm.
  // above: nur, was über den Spiegel reicht (Wölbung, Ring, Spritzer), sonst nur die Blasen in der Flüssigkeit
  fx.boil = function (box, level, t, seed, still, above) {
    var px = 16, half = (box.x1 - box.x0) / 2, mid = (box.x0 + box.x1) / 2, out = "", list = fx.boiling(level, (box.bottom - box.top) / px, t, seed, still);
    list.forEach(function (b) {
      var x = mid + b.u * 0.8 * half, r = b.r * px, y, w, h;
      if ((b.stage === "burst") !== !!above) return;
      if (b.stage === "grow") out += '<ellipse class="cl-bubble" cx="' + f(x) + '" cy="' + f(box.bottom - r * 0.85) + '" rx="' + f(r) + '" ry="' + f(r * 0.85) + '"/>';
      else if (b.stage === "rise") { y = box.bottom - r - b.y * px; out += '<circle class="cl-bubble" cx="' + f(x) + '" cy="' + f(Math.max(box.top + r, y)) + '" r="' + f(r) + '"/>'; }
      else if (b.q < 0.35) {                                     // die Oberfläche wölbt sich über der Blase
        h = r * 1.1 * (1 - b.q / 0.35);
        out += '<path class="cl-dome" d="M' + f(x - r * 1.6) + "," + f(box.top) + "Q" + f(x) + "," + f(box.top - 2 * h) + " " + f(x + r * 1.6) + "," + f(box.top) + 'Z"/>';
      } else {                                                   // geplatzt: ein Ring breitet sich aus, zwei Spritzer springen hoch
        w = (b.q - 0.35) / 0.65;
        out += '<ellipse class="cl-burst" cx="' + f(x) + '" cy="' + f(box.top) + '" rx="' + f(r * (1 + 2.5 * w)) + '" ry="' + f(r * 0.35 * (1 + 2.5 * w)) + '" stroke-opacity="' + (1 - w).toFixed(2) + '"/>';
        if (w < 0.8) [-1, 1].forEach(function (side) {
          out += '<circle class="cl-spray" cx="' + f(x + side * (1.5 + 4 * w)) + '" cy="' + f(box.top - 7 * Math.sin(Math.PI * w / 0.8)) + '" r="0.9"/>';
        });
      }
    });
    return out;
  };

  // Glasbruch: die Wand eines Gefäßes (Radius R, Höhe H, in cm) zerfällt in gezackte Scherben, die nach außen fliegen, sich drehen,
  // auf den Tisch fallen und sich flach legen. drop: so hoch stand der Boden des Gefäßes über dem Tisch (Dreifuß); age: Sekunden seit
  // dem Bruch (null oder still: alles liegt schon). Gemeinsam für 2D und 3D; zurück je Scherbe { x, y, z, spin, flat, pts }:
  // Lage in cm (y über dem Tisch, z zum Betrachter), Drehung in rad, flat 0 bis 1 (liegt), pts: Umriss in cm um die Mitte
  var SHATTER = { cols: 5, rows: 3, g: 260, slide: 0.2 };      // g: sichtbar verlangsamte Schwerkraft in cm/s²
  fx.shatter = function (R, H, age, seed, still, drop) {
    var out = [], cols = SHATTER.cols, rows = SHATTER.rows, k, c, row, p, th, y0, vr, vy, spin, T, w, h, r, y, flat, a, pts, slide;
    if (still || age == null || !(age >= 0)) age = Infinity;
    drop = drop || 0;
    w = Math.min(3, 2 * Math.PI * R / cols * 0.8); h = Math.min(3, H / rows * 0.8);
    for (k = 0; k < cols * rows; k++) {
      c = k % cols; row = Math.floor(k / cols); p = function (i) { return pseudo(seed + 41 + i, k); };
      th = 2 * Math.PI * (c + 0.15 + 0.7 * p(0)) / cols + row * 0.6;
      y0 = drop + H * (row + 0.3 + 0.4 * p(1)) / rows;
      vr = 4 + 5 * p(2) + (row === 0 ? 2 : 0); vy = 3 + 6 * p(3); spin = (p(4) - 0.5) * 14;
      T = (vy + Math.sqrt(vy * vy + 2 * SHATTER.g * y0)) / SHATTER.g;      // wann sie auf dem Tisch landet
      pts = [[-w / 2 * (0.5 + 0.5 * p(5)), -h / 2 * (0.5 + 0.5 * p(6))], [w / 2 * (0.5 + 0.5 * p(7)), -h / 2 * (0.3 + 0.7 * p(8))], [w / 2 * (0.4 + 0.6 * p(9)), h / 2 * (0.5 + 0.5 * p(10))]];
      if (p(11) > 0.4) pts.push([-w / 2 * (0.4 + 0.6 * p(12)), h / 2 * (0.4 + 0.6 * p(13))]);      // Drei- oder Vierecke
      if (age < T) { r = R + vr * age; y = y0 + vy * age - SHATTER.g * age * age / 2; a = spin * age; flat = 0; }
      else {
        slide = Math.min(1, (age - T) / SHATTER.slide);
        r = R + vr * T + vr * 0.06 * (1 - (1 - slide) * (1 - slide));      // rutscht noch ein Stück
        y = 0; a = spin * T; flat = Math.min(1, (age - T) / 0.1);
      }
      out.push({ x: r * Math.sin(th), y: Math.max(0, y), z: r * Math.cos(th), spin: a, flat: flat, pts: pts, landed: age >= T });
    }
    return out;
  };

  // Öltropfen im Wasser nach dem Schütteln oder Mixen. box: der trübe Teil der wässrigen Schicht ({ x0, x1, top, bottom }), share: Anteil des Öls
  // in Tropfen, r: ihr Radius in m, up: sie steigen (sonst sinken sie), rgb: Farbe des Öls. Grobe Tropfen steigen sichtbar, feine stehen fast.
  fx.droplets = function (box, share, r, t, seed, still, rgb, up) {
    var n = Math.round(Math.min(40, 6 + 34 * share)), out = "", height = box.bottom - box.top, width = box.x1 - box.x0, size = r > 5e-5 ? 1.6 : 0.9, i, speed, phase, x, y;
    var fill = "rgb(" + rgb.join(",") + ")";
    if (!(share > 0) || !(height > 2)) return "";
    for (i = 0; i < n; i++) {
      speed = (r > 5e-5 ? 10 : 0.4) * (0.6 + 0.8 * pseudo(seed + 13, i));      // Bildpunkte je Sekunde
      phase = pseudo(seed + 17, i) + (still ? 0 : t * speed / height);
      phase -= Math.floor(phase);
      x = box.x0 + size + (0.05 + 0.9 * pseudo(seed + 19, i)) * Math.max(0, width - 2 * size);
      y = up ? box.bottom - size - phase * (height - 2 * size) : box.top + size + phase * (height - 2 * size);
      out += '<circle class="cl-droplet" cx="' + f(x) + '" cy="' + f(y) + '" r="' + size + '" fill="' + fill + '"/>';
    }
    return out;
  };

  function hash(text) {            // feste Zahl zu einem Namen: jedes Teilchen behält seinen Weg, auch wenn andere dazukommen
    var h = 7, i;
    for (i = 0; i < text.length; i++) h = (h * 31 + text.charCodeAt(i)) % 9973;
    return h;
  }

  // Teilchenlupe: ein Kreis, darin die gelösten Teilchen als Punkte (mit ihrer Ladung), Feststoff als Bausteine, Wasser angedeutet.
  // data aus L.particles(); look(id): Farbe eines Teilchens. Jeder Ort folgt aus der Nummer des Teilchens und dem Weg, den es
  // schon hinter sich hat: data.walk (vom Rechenkern mitgezählt, je wärmer, desto schneller) und t Sekunden darüber hinaus.
  fx.lens = function (data, t, seed, still, look) {
    var R = 70, time = still ? 0 : (data.walk || 0) + t * Math.sqrt((data.T + 273.15) / 298.15), out = '<circle class="cl-lens-back" r="' + R + '"/>', i, p, rows = [], row = 0, x;
    function spot(a, b, slow, reach) {
      var u = 0.5 + 0.5 * Math.sin(6.2832 * (pseudo(a, b) + time * slow * (0.05 + 0.1 * pseudo(a + 1, b))));
      var w = 6.2832 * (pseudo(a + 2, b) + time * slow * (0.04 + 0.08 * pseudo(a + 3, b)) * (pseudo(a + 4, b) < 0.5 ? -1 : 1));
      var r = reach * Math.sqrt(0.03 + 0.97 * u);
      return [r * Math.cos(w), r * Math.sin(w)];
    }
    look = look || function () { return "#9aa7b4"; };
    if (data.wet) for (i = 0; i < 26; i++) {
      p = spot(seed + 11, i, 0.7, R - 4);
      out += '<circle class="cl-water" cx="' + f(p[0]) + '" cy="' + f(p[1]) + '" r="2.4"/>';
    }
    data.solids.forEach(function (s) {
      var a = hash(s.id), down = Math.round(s.n * (1 - s.hang)), k, half;
      for (k = 0; k < s.n; k++) {
        if (k < down) {                                        // am Boden: in Reihen von unten her, so breit wie der Kreis dort ist
          half = Math.sqrt(Math.max(0, R * R - (58 - row * 10) * (58 - row * 10))) - 6;
          if (!rows[row]) rows[row] = 0;
          if ((rows[row] + 1) * 10 > 2 * half) { row++; rows[row] = 0; half = Math.sqrt(Math.max(0, R * R - (58 - row * 10) * (58 - row * 10))) - 6; }
          x = -half + rows[row] * 10;
          rows[row]++;
          p = [x, 48 - row * 10];
        } else {
          p = spot(a + 5, k, 0.25, R - 18);
          p = [p[0] - 4.5, p[1] - 4.5];
        }
        out += '<rect class="cl-grain" data-id="' + s.id + '" x="' + f(p[0]) + '" y="' + f(p[1]) + '" width="9" height="9" rx="1.5" fill="' + look(s.id) + '"/>';
      }
    });
    if (data.wet) data.dots.forEach(function (d) {
      var a = hash(d.id), k, z = Math.abs(d.charge), sign = d.charge ? (z > 1 ? z : "") + (d.charge > 0 ? "+" : "−") : "";
      for (k = 0; k < d.n; k++) {
        p = spot(a, k, 1, R - 8);
        out += '<circle class="cl-dot" data-id="' + d.id + '" cx="' + f(p[0]) + '" cy="' + f(p[1]) + '" r="6.2" fill="' + look(d.id) + '"/>' +
          (sign ? '<text class="cl-dot-sign" x="' + f(p[0]) + '" y="' + f(p[1] + 2.6) + '" text-anchor="middle">' + sign + "</text>" : "");
      }
    });
    return out + '<circle class="cl-lens-glass" r="' + R + '"/>';
  };

  // Strahl beim Zugießen, von oben bis zum Flüssigkeitsspiegel
  fx.stream = function (x, top, bottom, t, still) {
    var wobble = still ? 0 : Math.sin(t * 18) * 0.5;
    return '<rect class="cl-stream" x="' + f(x - 1.6 + wobble) + '" y="' + f(top) + '" width="3.2" height="' + f(Math.max(0, bottom - top)) + '" rx="1.6"/>';
  };

  // Tropfen aus der Bürette: einer je Sekunde, fällt beschleunigt bis zum Flüssigkeitsspiegel
  fx.drops = function (x, top, bottom, t, still) {
    var phase = still ? 0.5 : t - Math.floor(t);
    var y = top + 3 + phase * phase * Math.max(0, bottom - top - 6);
    return '<ellipse class="cl-drop" cx="' + f(x) + '" cy="' + f(y) + '" rx="1.8" ry="' + f(2.2 + phase) + '"/>';
  };

  // ------------------------------------------------------------------ Strömung

  // Wärmeströmung im Querschnitt einer Flüssigkeit: Jos Stam, „Stable Fluids“ (1999), mit Auftrieb aus der Dichte.
  // Nur ein Bild: Der Rechenkern behandelt jedes Gefäß als gut durchmischt; das Feld verteilt dessen Wärme, sein Mittel ist immer w.T.
  // Anders als die übrigen Effekte hat es einen Zustand je Gefäß. Der wird nicht gespeichert und nach einem Sprung der Uhr neu eingeschwungen.
  // shortcut: rückwärts abgespielt zeigt es eine neu gerechnete Strömung, nicht die damalige; aufrüsten, wenn das im Unterricht stört.
  // shortcut: ein rechteckiges Gitter, schräge Wände (Erlenmeyer, Kolben) schneidet nur das Bild ab; eine Zellmaske, wenn es dort falsch aussieht.
  var ROWS = 24, STEP = 0.05, GRAV = 9.81, fields = {};
  var SUPER = 3;                  // so viel K über dem Siedepunkt wird es am heißen Boden höchstens; was darüber geht, verdampft
  var ALPHA = 1.4e-7;             // Temperaturleitfähigkeit von Wasser in m²/s; shortcut: für jede Flüssigkeit dieselbe
  var DIFFUSE = 1e-9;             // Diffusion gelöster Stoffe in m²/s: so langsam, dass Schlieren nur durch Strömung und Wirbel vergehen
  var EDDY = 0.03;                // Wirbel, die das grobe Gitter nicht auflöst, mischen mit 0,03 Zellen mal Geschwindigkeit: wo nichts strömt, auch nichts
  fx.fields = fields;

  // Dichte von Wasser in kg/m³ nach Thiesen; mit ihrem Höchstwert bei 4 °C.
  // shortcut: jede Flüssigkeit strömt wie Wasser; eigene Dichten, wenn Ethanol oder Öl dazukommen
  fx.density = function (T) { return 1000 * (1 - (T - 3.98) * (T - 3.98) * (T + 283) / (503570 * (T + 67.26))); };

  // T Temperatur in °C, R Dichte ohne Wärmeausdehnung in kg/m³, N natürlicher Logarithmus der Zähigkeit bei 25 °C in mPa·s: je Zelle, von der Strömung getragen
  function field(cols, T, R, N) {
    var n = (cols + 2) * (ROWS + 2), s = { cols: cols, u: new Float64Array(n), v: new Float64Array(n), T: new Float64Array(n).fill(T), p: new Float64Array(n), dots: [],
      R: new Float64Array(n).fill(R), N: new Float64Array(n).fill(N) }, i;
    for (i = 0; i < 30; i++) s.dots.push([0.5 + cols * pseudo(17, i), 0.5 + ROWS * pseudo(23, i)]);      // Spurteilchen, in Zellen
    return s;
  }

  // Ränder: b 1 kehrt u an den Seiten um, b 2 kehrt v oben und unten um (nichts fließt durch die Wand), sonst wird der Nachbar übernommen
  function bound(s, b, x) {
    var W = s.cols + 2, c = s.cols, i, j;
    for (j = 1; j <= ROWS; j++) { x[j * W] = b === 1 ? -x[1 + j * W] : x[1 + j * W]; x[c + 1 + j * W] = b === 1 ? -x[c + j * W] : x[c + j * W]; }
    for (i = 1; i <= c; i++) { x[i] = b === 2 ? -x[i + W] : x[i + W]; x[i + (ROWS + 1) * W] = b === 2 ? -x[i + ROWS * W] : x[i + ROWS * W]; }
    x[0] = (x[1] + x[W]) / 2; x[c + 1] = (x[c] + x[c + 1 + W]) / 2;
    x[(ROWS + 1) * W] = (x[1 + (ROWS + 1) * W] + x[ROWS * W]) / 2; x[c + 1 + (ROWS + 1) * W] = (x[c + (ROWS + 1) * W] + x[c + 1 + ROWS * W]) / 2;
  }

  function sample(s, x, a, b) {    // bilinear an der Stelle a, b in Zellen
    var W = s.cols + 2, i, j, k;
    a = Math.max(0.5, Math.min(s.cols + 0.5, a)); b = Math.max(0.5, Math.min(ROWS + 0.5, b));
    i = Math.floor(a); j = Math.floor(b); k = i + j * W; a -= i; b -= j;
    return (1 - b) * ((1 - a) * x[k] + a * x[k + 1]) + b * ((1 - a) * x[k + W] + a * x[k + W + 1]);
  }

  function each(s, fn) { var W = s.cols + 2, i, j; for (j = 1; j <= ROWS; j++) for (i = 1; i <= s.cols; i++) fn(i + j * W, i, j); }

  function advect(s, b, x, dt) {   // jede Zelle holt ihren Wert dort, wo die Strömung ihn vor dt hergetragen hat
    var out = new Float64Array(x.length);
    each(s, function (k, i, j) { out[k] = sample(s, x, i - dt * s.u[k], j - dt * s.v[k]); });
    bound(s, b, out);
    return out;
  }

  // Ausgleich mit den Nachbarn (Wärmeleitung, Zähigkeit), rate in Zellen²/s je Zelle; implizit gerechnet, damit es auch bei Glycerin stabil bleibt
  function spread(s, b, x, rate, dt) {
    var W = s.cols + 2, y = x.slice(), it;
    for (it = 0; it < 10; it++) {
      each(s, function (k) { var a = rate[k] * dt; x[k] = (y[k] + a * (x[k - 1] + x[k + 1] + x[k - W] + x[k + W])) / (1 + 4 * a); });
      bound(s, b, x);
    }
  }

  function project(s) {            // Wasser lässt sich nicht zusammendrücken: was in eine Zelle fließt, fließt auch hinaus
    var W = s.cols + 2, div = new Float64Array(s.u.length), p = s.p, it;
    each(s, function (k) { div[k] = -(s.u[k + 1] - s.u[k - 1] + s.v[k + W] - s.v[k - W]) / 2; });
    bound(s, 0, div);
    for (it = 0; it < 20; it++) { each(s, function (k) { p[k] = (div[k] + p[k - 1] + p[k + 1] + p[k - W] + p[k + W]) / 4; }); bound(s, 0, p); }
    each(s, function (k) { s.u[k] -= (p[k + 1] - p[k - 1]) / 2; s.v[k] -= (p[k + W] - p[k - W]) / 2; });
    bound(s, 1, s.u); bound(s, 2, s.v);
  }

  // Mittel auf den Wert des Rechenkerns, der alles sofort mischt. Was eben zugeflossen ist (inflow: Anteil an der Flüssigkeit), kommt dort an,
  // wo der Strahl auftrifft: links der Mitte (wie fx.stream), ein Viertel der Breite, und so tief, bis die Zellen dort es aufnehmen können
  // (ist es oben schon so kalt wie das Zugegossene, reicht der Strahl weiter hinab). Jede Zelle mischt sich dabei nur mit dem Zugegossenen,
  // bleibt also zwischen Werten, die es schon gibt. Eine Schicht über die ganze Breite bliebe liegen, auch wenn sie schwerer ist:
  // ohne Störung kippt sie im Rechner nie.
  // before: der Wert des Rechenkerns im Schritt davor. Aus ihm, nicht aus dem Mittel des Felds, folgt der Wert des Zugegossenen:
  // Das Mittragen mit der Strömung erhält das Mittel nicht ganz genau, und geteilt durch den kleinen Anteil inflow würde der Fehler groß.
  function settle(s, x, target, inflow, before) {
    var n = s.cols * ROWS, W = s.cols + 2, sum = 0, poured, need, wide, left, top, room = 0, share, i, j;
    if (inflow > 1e-6) {
      poured = (target - (1 - inflow) * before) / inflow;
      need = inflow * n * (poured - before);                     // um so viel ändert sich die Summe über alle Zellen
      wide = Math.max(2, Math.round(s.cols / 4)); left = Math.max(1, Math.round(s.cols * 0.4 - wide / 2));
      for (top = 0; top < ROWS && Math.abs(room) < Math.abs(need); ) {
        top++;
        for (i = left; i < left + wide; i++) room += poured - x[i + top * W];
      }
      share = room * need > 0 ? Math.min(1, need / room) : 0;
      for (j = 1; j <= top; j++) for (i = left; i < left + wide; i++) x[i + j * W] += share * (poured - x[i + j * W]);
    }
    each(s, function (k) { sum += x[k]; });
    sum = target - sum / n;
    each(s, function (k) { x[k] += sum; });
    bound(s, 0, x);
  }

  // Die Ölschicht im Feld: P je Zelle, 0 Wasser, 1 Öl. Ihre Menge folgt dem Rechenkern (share: Anteil der Flüssigkeit, der als Schicht liegt):
  // Was fehlt, kommt an der Ölseite dazu (oben, wenn das Öl oben schwimmt), was zu viel ist, geht zuerst auf der Wasserseite weg,
  // so bleibt aus jedem verirrten Rest und der Schicht wieder eine Schicht.
  function layer(s, P, share, top) {
    var W = s.cols + 2, need = share * s.cols * ROWS, i, j, jj, k, d;
    each(s, function (k) { need -= P[k]; });
    for (jj = 1; jj <= ROWS && Math.abs(need) > 1e-9; jj++) {
      j = need > 0 === top ? jj : ROWS + 1 - jj;
      for (i = 1; i <= s.cols && Math.abs(need) > 1e-9; i++) {
        k = i + j * W;
        d = need > 0 ? Math.min(1 - P[k], need) : -Math.min(P[k], -need);
        P[k] += d; need -= d;
      }
    }
    bound(s, 0, P);
  }

  // Ein Schritt um dt Sekunden. heat: { q, k, room, boil } aus dem Rechenkern; cell: Wärmekapazität einer Zelle in J/K, size: Kantenlänge in m;
  // inflow: welcher Anteil der Flüssigkeit eben zugeflossen ist (er kommt oben an), sonst 0
  // oil: die Ölschicht aus der Ansicht des Rechenkerns ({ share, top, rho, eta, stir }), sonst null
  function advance(s, heat, T, cell, size, dt, still, inflow, oil) {
    var W = s.cols + 2, x = s.T, rho = fx.density(T), lo = Math.round(s.cols * 0.2), hi = s.cols + 1 - lo, rim = 2 * ROWS + s.cols, i, j, k, nu, nv;
    for (i = lo; i <= hi; i++) x[i + ROWS * W] += heat.q * dt / ((hi - lo + 1) * cell);      // die Flamme heizt die Mitte des Bodens
    if (heat.boil != null) each(s, function (k) { x[k] = Math.min(x[k], heat.boil + SUPER); });
    for (j = 1; j <= ROWS; j++) for (i = 1; i <= s.cols; i++) if (i === 1 || i === s.cols || j === 1) {      // Wände und Oberfläche geben ab
      k = i + j * W;
      x[k] -= heat.k / rim * (x[k] - heat.room) * dt / cell;
    }
    // schwerer sinkt (y zeigt nach unten): aus der Temperatur und aus dem, was in der Zelle gelöst ist. Was überall gleich ist,
    // trägt der Schweredruck; abgezogen, damit Rundungsreste ein ruhendes Glas nicht bewegen
    // Im Öl zählt dessen Dichte, mit der Wärmeausdehnung des Wassers (shortcut: eigene Ausdehnung des Öls, wenn es stört)
    var mass = heat.rho || 1000, lift = new Float64Array(x.length), even = 0, P = s.P, oilRho = oil ? oil.rho : mass;
    if (oil && !P) P = s.P = new Float64Array(x.length);
    if (!oil) P = s.P = null;
    each(s, function (k) {
      var p = P ? P[k] : 0;
      lift[k] = (1 - p) * (fx.density(x[k]) - rho + s.R[k] - mass) + p * (oilRho * fx.density(x[k]) / rho - mass);
      even += lift[k] / (s.cols * ROWS);
    });
    each(s, function (k) { s.v[k] += GRAV * (lift[k] - even) / mass / size * dt; });
    if (oil && oil.stir) each(s, function (k) {                 // geschüttelt oder gemixt: kräftige, wechselnde Stöße
      s.u[k] += (pseudo(s.kick = (s.kick || 0) + 1, k) - 0.5) * 800 * dt;
      s.v[k] += (pseudo(s.kick + 0.5, k) - 0.5) * 800 * dt;
    });
    // Zähigkeit je Zelle nach ihrer Temperatur (zwischen 25 und 50 °C linear in 1/T, nach Andrade), als Zellen²/s; im Öl die des Öls
    var eta = heat.eta || [0.890, 0.5465], slope = (Math.log(eta[1]) - Math.log(eta[0])) / (1 / 323.15 - 1 / 298.15);
    var oilEta = oil && oil.eta ? oil.eta : eta, oilLow = Math.log(oilEta[0]), oilSlope = (Math.log(oilEta[1]) - oilLow) / (1 / 323.15 - 1 / 298.15);
    var visc = new Float64Array(x.length), cond = new Float64Array(x.length), stir = new Float64Array(x.length);
    each(s, function (k) {
      var eddy = EDDY * Math.sqrt(s.u[k] * s.u[k] + s.v[k] * s.v[k]), p = P ? P[k] : 0, warm = 1 / (x[k] + 273.15) - 1 / 298.15;
      visc[k] = Math.exp((1 - p) * (s.N[k] + slope * warm) + p * (oilLow + oilSlope * warm)) / 1000 / ((1 - p) * (s.R[k] || mass) + p * oilRho) / (size * size) + eddy;
      cond[k] = ALPHA / (size * size) + eddy;
      stir[k] = DIFFUSE / (size * size) + eddy;
    });
    spread(s, 1, s.u, visc, dt); spread(s, 2, s.v, visc, dt);
    // spread glättet nur kleine Wirbel. Die warme Fahne bremst die Zähigkeit wie nach Stokes: Vom Radius r steigt sie mit 2/9·g′·r²/ν,
    // also eine Bremse mit der Rate 4,5·ν/r², hier implizit. r = 3 Zellen, geschätzt: Damit strömt Zuckersirup (60 %) etwa sechsmal und reines Glycerin
    // gut zwanzigmal langsamer als Wasser, wie es die Skalierung der Konvektion zäher Flüssigkeiten (v ∝ ν^−1/2) ungefähr erwarten lässt
    each(s, function (k) { var d = 1 + visc[k] * 4.5 / 9 * dt; s.u[k] /= d; s.v[k] /= d; });
    project(s);
    nu = advect(s, 1, s.u, dt); nv = advect(s, 2, s.v, dt); s.u = nu; s.v = nv;
    project(s);
    s.T = x = advect(s, 0, x, dt);
    spread(s, 0, x, cond, dt);
    s.R = advect(s, 0, s.R, dt); spread(s, 0, s.R, stir, dt);
    s.N = advect(s, 0, s.N, dt); spread(s, 0, s.N, stir, dt);
    if (P) {                                                     // mitgetragen, dann geschärft: Zwischenwerte wandern nach 0 oder 1
      P = s.P = advect(s, 0, P, dt);
      each(s, function (k) { P[k] = Math.max(0, Math.min(1, P[k] + 0.8 * P[k] * (1 - P[k]) * (2 * P[k] - 1))); });
      layer(s, P, oil.share, oil.top);
    }
    var at = s.at || { T: T, R: mass, N: Math.log(eta[0]) };
    settle(s, x, T, inflow, at.T);
    settle(s, s.R, mass, inflow, at.R);
    settle(s, s.N, Math.log(eta[0]), inflow, at.N);
    s.at = { T: T, R: mass, N: Math.log(eta[0]) };
    if (heat.boil != null) { each(s, function (k) { x[k] = Math.min(x[k], heat.boil + SUPER); }); bound(s, 0, x); }      // beim Sieden liegt das Mittel damit knapp darunter
    if (!still) s.dots.forEach(function (d) {
      var a = sample(s, s.u, d[0], d[1]), b = sample(s, s.v, d[0], d[1]);
      d[0] = Math.max(0.6, Math.min(s.cols + 0.4, d[0] + a * dt));
      d[1] = Math.max(0.6, Math.min(ROWS + 0.4, d[1] + b * dt));
    });
  }

  // Feste Farbe je Temperatur in °C: kalt dunkelblau, 20 °C hellblau, dann gelb, orange, rot, ab 100 °C violett
  var HEAT = [[0, [40, 70, 200]], [20, [90, 170, 230]], [40, [240, 215, 70]], [60, [245, 150, 40]], [80, [220, 50, 40]], [100, [150, 40, 170]], [120, [90, 20, 120]]];
  function heatColor(T) {
    var i = 1;
    while (i < HEAT.length - 1 && T > HEAT[i][0]) i++;
    var a = HEAT[i - 1], b = HEAT[i], u = Math.max(0, Math.min(1, (T - a[0]) / (b[0] - a[0])));
    return a[1].map(function (c, k) { return Math.round(c + (b[1][k] - c) * u); });
  }
  fx.heatColor = heatColor;

  // Rechnet das Feld eines Gefäßes bis zur Zeit t; null ohne Flüssigkeit
  function stepped(w, t, key, still) {
    var heat = w.heat, s = fields[key], deep, size, cols, cell, dt, n, i, oil;
    if (!heat || !(w.ml > 0.005)) { delete fields[key]; return null; }
    deep = w.ml / 1e6 / (Math.PI * heat.d * heat.d / 40000);    // Höhe der Flüssigkeit in m, als stünde sie in einem Zylinder
    size = deep / ROWS;
    cols = Math.max(3, Math.min(40, Math.round(heat.d / 100 / size)));      // Zellen etwa quadratisch
    cell = w.ml * 4.18 / (cols * ROWS);
    oil = w.oil ? { share: w.oil.ml / w.ml, top: w.oil.top, rho: w.oil.rho, eta: w.oil.eta, stir: w.oil.stir } : null;
    // neu, nach einem Sprung der Uhr oder bei ganz anderer Form: unter den jetzigen Bedingungen einschwingen.
    // Nach dem Zugießen bleibt das Gitter, damit man sieht, wohin das Zugegossene läuft; die Zellen werden dabei etwas höher.
    if (!s || s.cols > 2 * cols || cols > 2 * s.cols || t < s.t - 1e-9 || t - s.t > 30) {
      s = fields[key] = field(cols, w.T, heat.rho || 1000, Math.log((heat.eta || [0.890])[0]));
      for (i = 0; i < 60; i++) advance(s, heat, w.T, cell, size, STEP, true, 0, oil);      // 3 s: so lange braucht die Fahne, um sich zu bilden
      s.t = t; s.ml = w.ml;
    }
    cols = s.cols; cell = w.ml * 4.18 / (cols * ROWS);
    dt = still ? 0 : t - s.t;
    n = Math.min(40, Math.ceil(dt / STEP));
    for (i = 0; i < n; i++) advance(s, heat, w.T, cell, size, Math.min(0.5, dt / n), false, i ? 0 : Math.max(0, (w.ml - s.ml) / w.ml), oil);
    if (n) { s.t = t; s.ml = w.ml; }
    return s;
  }

  // Was eine Ansicht je Zelle zeigt: level(k, j) und, geteilt durch span, paint(a) → { hex, rgb, alpha }
  function painter(s, w, mode) {
    var W = s.cols + 2, heat = w.heat, span = 0;
    function curl(k) { return (s.v[k + 1] - s.v[k - 1] - s.u[k + W] + s.u[k - W]) / 2; }      // positiv: dreht im Uhrzeigersinn
    function level(k, j) {
      return mode === "pressure" ? j / ROWS : mode === "vortex" ? curl(k) : mode === "temp" ? s.T[k] : mode === "mix" ? s.R[k] - (heat.rho || 1000) : s.T[k] - w.T;
    }
    if (mode === "vortex" || mode === "diff" || mode === "mix") each(s, function (k, i, j) { span = Math.max(span, Math.abs(level(k, j))); });
    span = mode === "vortex" ? Math.max(0.3, span) : mode === "diff" || mode === "mix" ? Math.max(2, span) : 1;     // eine ruhige, gut gemischte Flüssigkeit bleibt blass
    var HEX = { pressure: "#2b5fb3", up: "#d9452b", down: "#2b6fd9", heavy: "#8a5a22", light: "#2a9d8f" };
    function paint(a) {
      var hex = mode === "temp" ? null : mode === "pressure" ? HEX.pressure : mode === "mix" ? (a > 0 ? HEX.heavy : HEX.light) : a > 0 ? HEX.up : HEX.down;
      var rgb = hex ? [1, 3, 5].map(function (k) { return parseInt(hex.substr(k, 2), 16); }) : heatColor(a);
      return { hex: hex || css(rgb), rgb: rgb, alpha: mode === "temp" ? 0.55 : Math.abs(a) < 0.03 ? 0 : Math.min(1, Math.abs(a)) * (mode === "pressure" ? 0.45 : 0.6) };
    }
    return { level: level, span: span, paint: paint };
  }

  // Strömung in der Flüssigkeit als SVG. box: { x0, x1, top, bottom } der Flüssigkeit, w aus L.view (ml, T, heat), t Zeit in s,
  // key: je Gefäß und Fläche verschieden, mode: "temp" (Temperatur mit fester Farbskala), "diff" (Unterschiede zum Mittel), "mix" (Schlieren: schwerer bernsteinbraun,
  // leichter türkis als die Mischung), "vortex" (Wirbel) oder "pressure" (Druck)
  fx.flow = function (box, w, t, key, mode, still) {
    var width = box.x1 - box.x0, height = box.bottom - box.top, s, look, cols, i, W, out = "", cw, ch, id;
    if (!(width > 2 && height > 2)) { delete fields[key]; return ""; }
    s = stepped(w, t, key, still);
    if (!s) return "";
    look = painter(s, w, mode);
    cols = s.cols; W = cols + 2; cw = width / cols; ch = height / ROWS;
    // gezeichnet in Blöcken von 2×2 Zellen: nach dem Weichzeichnen sieht man keinen Unterschied, das Bild ist ein Viertel so lang
    cw *= 2; ch *= 2;
    for (var j = 1; j <= ROWS; j += 2) for (i = 1; i <= cols; i += 2) {
      var r = Math.min(i + 1, cols);                             // bei ungerader Breite zählt die letzte Spalte doppelt
      var a = (look.level(i + j * W, j) + look.level(r + j * W, j) + look.level(i + (j + 1) * W, j + 1) + look.level(r + (j + 1) * W, j + 1)) / 4 / look.span;
      var x = box.x0 + (i - 1) / 2 * cw, y = box.top + (j - 1) / 2 * ch, last = i + 2 > cols, p = look.paint(a);
      if (!(p.alpha > 0)) continue;
      // die äußeren Blöcke reichen über den Rand hinaus, damit das Weichzeichnen dort nicht ausbleicht
      out += '<rect x="' + f(i === 1 ? x - cw : x) + '" y="' + f(j === 1 ? y - ch : y) + '" width="' + f(cw * (1 + (i === 1) + last) + 0.3) +
        '" height="' + f(ch * (1 + (j === 1) + (j + 2 > ROWS)) + 0.3) + '" fill="' + p.hex + '" fill-opacity="' + p.alpha.toFixed(2) + '"/>';
    }
    cw /= 2; ch /= 2;
    id = key + "-flow";
    out = '<filter id="' + id + '" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="' + f(Math.min(cw, ch) * 0.8) + '"/></filter>' +
      '<g class="cl-flow" filter="url(#' + id + ')">' + out + "</g>";
    if (s.P) {                                                   // die Grenze der Ölschicht: je Spalte die Höhe, an der P die Hälfte kreuzt
      var edge = [], c;
      for (c = 1; c <= cols; c++) {
        for (r = 1; r < ROWS && (s.P[c + r * W] > 0.5) === (s.P[c + (r + 1) * W] > 0.5); r++);
        if (r < ROWS) edge.push(f(box.x0 + (c - 0.5) * cw) + "," + f(box.top + r * ch));
      }
      if (edge.length > 1) out += '<polyline class="cl-flow-edge" points="' + edge.join(" ") + '"/>';
    }
    s.dots.forEach(function (d) { out += '<circle class="cl-flow-dot" cx="' + f(box.x0 + (d[0] - 0.5) * cw) + '" cy="' + f(box.top + (d[1] - 0.5) * ch) + '" r="1"/>'; });
    return out;
  };

  // Dasselbe Feld für die 3D-Bühne: cols × rows Zellen, color(x, y) mit x, y von 0 bis 1 (links oben) → [r, g, b, Deckkraft], bilinear;
  // flow(x, y) → [u, v]: die Strömung dort, in Breiten und Höhen der Flüssigkeit je Sekunde (v nach unten positiv);
  // dots: die Spurteilchen, ebenso von 0 bis 1. null ohne Flüssigkeit.
  fx.flowCells = function (w, t, key, mode, still) {
    var s = stepped(w, t, key, still), look, W, cells = [];
    if (!s) return null;
    look = painter(s, w, mode); W = s.cols + 2;
    each(s, function (k, i, j) { cells[k] = look.paint(look.level(k, j) / look.span); });
    function at(i, j) { return cells[Math.max(1, Math.min(s.cols, i)) + Math.max(1, Math.min(ROWS, j)) * W]; }
    return {
      cols: s.cols, rows: ROWS,
      color: function (x, y) {
        var a = x * s.cols + 0.5, b = y * ROWS + 0.5, i = Math.floor(a), j = Math.floor(b), u = a - i, v = b - j, c = [0, 0, 0, 0], q = [[at(i, j), (1 - u) * (1 - v)], [at(i + 1, j), u * (1 - v)], [at(i, j + 1), (1 - u) * v], [at(i + 1, j + 1), u * v]], n;
        q.forEach(function (e) { for (n = 0; n < 3; n++) c[n] += e[0].rgb[n] * e[1]; c[3] += e[0].alpha * e[1]; });
        return c;
      },
      flow: function (x, y) { var a = x * s.cols + 0.5, b = y * ROWS + 0.5; return [sample(s, s.u, a, b) / s.cols, sample(s, s.v, a, b) / ROWS]; },
      dots: s.dots.map(function (d) { return [(d[0] - 0.5) / s.cols, (d[1] - 0.5) / ROWS]; })
    };
  };

  // Das Feld im Becherglas (spatial, aus L.view) wie flowCells für die 3D-Bühne: color(x, y) mit x quer über das Glas (an der Achse
  // gespiegelt), y von oben, bilinear zwischen den Zellmitten, voll deckend; es strömt nichts, Spurteilchen gibt es keine
  fx.fieldCells = function (field) {
    function at(i, j) { return field.cells[Math.max(0, Math.min(field.nz - 1, j)) * field.nr + Math.max(0, Math.min(field.nr - 1, i))].rgb; }
    return {
      cols: 2 * field.nr, rows: field.nz,
      color: function (x, y) {
        var a = Math.abs(2 * x - 1) * field.nr - 0.5, b = y * field.nz - 0.5, i = Math.floor(a), j = Math.floor(b), u = a - i, v = b - j, c = [0, 0, 0, 1], n;
        for (n = 0; n < 3; n++) c[n] = (1 - u) * (1 - v) * at(i, j)[n] + u * (1 - v) * at(i + 1, j)[n] + (1 - u) * v * at(i, j + 1)[n] + u * v * at(i + 1, j + 1)[n];
        return c;
      },
      flow: function () { return [0, 0]; },
      dots: []
    };
  };

  function css(rgb) { return "rgb(" + rgb[0] + "," + rgb[1] + "," + rgb[2] + ")"; }

  function drop(x, base, w, h, sway) {       // Flammenform: unten breit, oben spitz
    return "M" + f(x - w) + "," + f(base) + "C" + f(x - w * 1.25) + "," + f(base - h * 0.45) + " " + f(x - w * 0.3 + sway) + "," + f(base - h * 0.7) + " " +
      f(x + sway) + "," + f(base - h) + "C" + f(x + w * 0.3 + sway) + "," + f(base - h * 0.7) + " " + f(x + w * 1.25) + "," + f(base - h * 0.45) + " " + f(x + w) + "," + f(base) + "Z";
  }

  // Brennerflamme über der Düse (x, base). level: 1 leuchtend (gelb, ruhig), 2 rauschend (blau, mit hellem Kegel);
  // tint: [r, g, b] einer Flammenfärbung. Die Stützpunkte flackern mit der Uhr.
  fx.flame = function (x, base, level, t, seed, still, tint) {
    var a = still ? 0 : Math.sin(t * 17 + seed), b = still ? 0 : Math.sin(t * 11.3 + seed * 2.1), h, out;
    if (!(level > 0)) return "";
    if (level < 2) {
      h = 46 * (1 + 0.07 * a);
      out = '<path class="cl-flame cl-luminous" d="' + drop(x, base, 7, h, 2.2 * b) + '"' + (tint ? ' style="fill:' + css(tint) + '"' : "") + "/>" +
        '<path class="cl-flame-core cl-luminous" d="' + drop(x, base, 3.6, h * 0.5, 1.2 * b) + '"/>';
    } else {
      h = 40 * (1 + 0.04 * a);
      out = '<path class="cl-flame cl-roaring" d="' + drop(x, base, 6, h, 1.2 * b) + '"' + (tint ? ' style="fill:' + css(tint) + ';fill-opacity:0.9"' : "") + "/>" +
        '<path class="cl-flame-core cl-roaring" d="' + drop(x, base, 3, h * 0.42, 0.6 * b) + '"/>';
    }
    return out;
  };

  // Schwaden, die von y aus aufsteigen, breiter und blasser werden. n Stück, auf der Breite x0 bis x1 verteilt.
  function puffs(cls, x0, x1, y, n, rise, size, t, seed, still, fill) {
    var out = "", i, phase, x, r;
    for (i = 0; i < n; i++) {
      phase = pseudo(seed + 13, i) + (still ? 0 : t * (0.35 + 0.25 * pseudo(seed + 17, i)));
      phase -= Math.floor(phase);
      r = size * (0.5 + phase);
      x = x0 + pseudo(seed + 19, i) * (x1 - x0) + (still ? 0 : Math.sin(t * 1.7 + i * 2.3) * 4 * phase) + (pseudo(seed + 23, i) - 0.5) * 22 * phase;
      out += '<circle class="' + cls + '" cx="' + f(x) + '" cy="' + f(y - phase * rise) + '" r="' + f(r) + '" fill-opacity="' + (0.5 * (1 - phase)).toFixed(2) + '"' +
        (fill ? ' style="fill:' + fill + '"' : "") + "/>";
    }
    return out;
  }

  // Dampf über einem siedenden Gefäß; rate in mol/s
  fx.steam = function (x0, x1, y, rate, t, seed, still) {
    if (!(rate > 0)) return "";
    return puffs("cl-steam", x0, x1, y, Math.max(3, Math.min(9, Math.round(4 + 2 * Math.log10(rate / 1e-3)))), 62, 9, t, seed, still);
  };

  // Rauch über einem Feuer; amount zwischen 0 und 1
  fx.smoke = function (x, y, amount, t, seed, still, color) {
    if (!(amount > 0)) return "";
    return puffs("cl-smoke", x - 8, x + 8, y, Math.max(3, Math.round(7 * Math.min(1, amount))), 110, 12, t, seed + 31, still, color);
  };

  // Was in einem Gefäß brennt. fire: [{ rate, color, glare, smoke, glow }] aus view(); x0, x1, y: der Boden des Gefäßes
  fx.fire = function (x0, x1, y, fire, t, seed, still) {
    var out = "", mid = (x0 + x1) / 2, width = x1 - x0;
    fire.forEach(function (one, index) {
      var i, n, h, x, a, R;
      if (!(one.rate > 0)) return;
      if (one.glare > 0.5) {                                   // grelles Licht: ein Schein in drei Stufen
        R = 46 * one.glare * (1 + (still ? 0 : 0.06 * Math.sin(t * 23 + seed)));
        for (i = 3; i >= 1; i--) out += '<circle class="cl-glare" cx="' + f(mid) + '" cy="' + f(y - 12) + '" r="' + f(R * i / 3) + '" fill="' + one.color + '" fill-opacity="' + (0.55 / i).toFixed(2) + '"/>';
        for (i = 0; i < 12; i++) {                             // Strahlen: vor einer hellen Wand sähe man den Schein sonst nicht
          a = i / 12 * 2 * Math.PI + (still ? 0 : 0.15 * Math.sin(t * 9 + i));
          out += '<line class="cl-glare-ray" x1="' + f(mid + Math.cos(a) * R * 0.75) + '" y1="' + f(y - 12 + Math.sin(a) * R * 0.75) +
            '" x2="' + f(mid + Math.cos(a) * R * (1.15 + 0.2 * pseudo(seed, i))) + '" y2="' + f(y - 12 + Math.sin(a) * R * (1.15 + 0.2 * pseudo(seed, i))) + '"/>';
        }
      }
      if (one.glow) {                                          // Glut statt Flamme
        a = 0.45 + (still ? 0 : 0.2 * Math.sin(t * 3 + seed));
        out += '<ellipse class="cl-fire cl-glow" cx="' + f(mid) + '" cy="' + f(y - 5) + '" rx="' + f(width * 0.3) + '" ry="7" fill="' + one.color + '" fill-opacity="' + a.toFixed(2) + '"/>';
      } else {
        n = 3;
        for (i = 0; i < n; i++) {
          a = still ? 0 : Math.sin(t * (13 + 3 * i) + seed + i * 1.9);
          h = (16 + 12 * pseudo(seed + index, i)) * (1 + 0.18 * a);
          x = mid + (i - (n - 1) / 2) * Math.min(12, width * 0.2);
          out += '<path class="cl-fire" d="' + drop(x, y - 3, 4.5, h, 1.8 * a) + '" fill="' + one.color + '"/>';
        }
      }
      if (one.smoke) out += fx.smoke(mid, y - 24, 1, t, seed + index, still, one.smoke);
    });
    return out;
  };

  // Lichtblitz einer Verpuffung an der Stelle (x, y); age: Sekunden seit dem Knall, level: 1 Plopp bis 3 lauter Knall
  fx.flash = function (x, y, age, level) {
    var part = age / 0.5, R, out = "", i, n, a;
    if (!(age >= 0) || part >= 1) return "";
    R = (10 + 12 * level) * (0.35 + 0.65 * part);
    out = '<circle class="cl-flash" cx="' + f(x) + '" cy="' + f(y) + '" r="' + f(R) + '" fill-opacity="' + (0.9 * (1 - part)).toFixed(2) + '"/>';
    n = 4 + 3 * level;
    for (i = 0; i < n; i++) {                                  // Strahlen
      a = i / n * 2 * Math.PI;
      out += '<line class="cl-flash-ray" x1="' + f(x + Math.cos(a) * R * 0.8) + '" y1="' + f(y + Math.sin(a) * R * 0.8) + '" x2="' + f(x + Math.cos(a) * R * 1.5) + '" y2="' + f(y + Math.sin(a) * R * 1.5) +
        '" stroke-opacity="' + (1 - part).toFixed(2) + '"/>';
    }
    return out;
  };

  // Holzspan, der an eine Öffnung (x, y) gehalten wird. mark: { kind, result, age }
  fx.splint = function (x, y, mark, t, still) {
    if (mark.kind === "paper") {                                // feuchtes Indikatorpapier: ein Streifen, die untere Hälfte in der Farbe, die es annimmt
      var corner = function (along, side) { return f(x + 3 + 41 * along + 4.5 * side) + "," + f(y + 4 - 34 * along + 5.4 * side); };
      return '<path class="cl-paper" d="M' + corner(0, 1) + "L" + corner(0, -1) + "L" + corner(1, -1) + "L" + corner(1, 1) + 'Z"/>' +
        '<path class="cl-paper" d="M' + corner(0, 1) + "L" + corner(0, -1) + "L" + corner(0.45, -1) + "L" + corner(0.45, 1) + 'Z" style="fill:' +
        (mark.rgb ? "rgb(" + mark.rgb.join(",") + ")" : "#c8d36a") + '"/>';
    }
    var burning = mark.kind === "flame" ? mark.result !== "out" && mark.result !== "pop" : mark.result === "relight";
    var a = still ? 0 : Math.sin(t * 15), big = mark.result === "flare" || mark.result === "relight";
    var out = '<line class="cl-splint" x1="' + f(x + 3) + '" y1="' + f(y + 4) + '" x2="' + f(x + 44) + '" y2="' + f(y - 30) + '"/>';
    if (burning) out += '<path class="cl-splint-flame" d="' + drop(x + 3, y + 3, big ? 5 : 3.2, (big ? 24 : 13) * (1 + 0.1 * a), a) + '"/>';
    else if (mark.kind === "glow" && mark.result !== "out") out += '<circle class="cl-splint-glow" cx="' + f(x + 3) + '" cy="' + f(y + 4) + '" r="2.6"/>';
    else if (mark.result === "out") out += puffs("cl-smoke", x, x + 6, y, 3, 30, 4, t, 5, still);
    return out;
  };

  // ------------------------------------------------------------------ Klang

  // Wie laut jede Stimme sein soll (0 bis 1), abgeleitet aus dem Zustand des Labors
  fx.levels = function (lab) {
    var out = { burner: 0, boil: 0, fizz: 0, fire: 0 };
    lab.tools.forEach(function (t) {
      if (t.flame > 0) out.burner = Math.max(out.burner, t.flame > 1 ? 1 : 0.4);
      if (t.bub > 1e-7) out.fizz = Math.max(out.fizz, fx.count(t.bub) / 16);       // Gasblasen an einer Elektrode
    });
    lab.vessels.forEach(function (v) {
      var key;
      if (v.boil > 0) out.boil = Math.max(out.boil, Math.min(1, 0.3 + v.boil / 0.008));
      if (v.gas > 1e-7) out.fizz = Math.max(out.fizz, fx.count(v.gas) / 16);
      for (key in v.lit) out.fire = Math.max(out.fire, v.rate[key] > 0 ? 1 : 0.3);
    });
    return out;
  };

  // Stimmen aus gefiltertem Rauschen: [Filterart, Frequenz in Hz, Güte, Lautstärke]
  var VOICES = {
    burner: ["bandpass", 900, 0.6, 0.10], boil: ["lowpass", 260, 1, 0.22], fizz: ["highpass", 4200, 0.7, 0.06], fire: ["bandpass", 1700, 0.4, 0.12]
  };

  // Klang über Web Audio, ohne Tondateien. Der Browser erlaubt Ton erst nach einer Bedienung: wake() bei jedem Klick.
  // Ohne Web Audio: null.
  fx.sound = function (global) {
    var AC = global.AudioContext || global.webkitAudioContext, ctx = null, master = null, limit = null, noise = null, voices = {}, muted = false, click = null;
    if (!AC) return null;

    function source() {
      var node = ctx.createBufferSource();
      node.buffer = noise;
      node.loop = true;
      return node;
    }

    function burst(type, freq, peak, length, q) {              // kurzer Rauschstoß, der abklingt
      var src = source(), filter = ctx.createBiquadFilter(), gain = ctx.createGain(), now = ctx.currentTime;
      filter.type = type; filter.frequency.value = freq; filter.Q.value = q || 0.8;
      gain.gain.setValueAtTime(peak, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + length);
      src.connect(filter); filter.connect(gain); gain.connect(master);
      src.start(now); src.stop(now + length + 0.05);
    }

    function whistle(from, to, length, peak) {                 // Pfeifton, der in der Höhe fällt
      var osc = ctx.createOscillator(), gain = ctx.createGain(), now = ctx.currentTime;
      osc.type = "sine";
      osc.frequency.setValueAtTime(from, now);
      osc.frequency.exponentialRampToValueAtTime(to, now + length);
      gain.gain.setValueAtTime(peak, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + length);
      osc.connect(gain); gain.connect(master);
      osc.start(now); osc.stop(now + length + 0.05);
    }

    return {
      wake: function () {
        var data, i;
        if (!ctx) {
          try { ctx = new AC(); } catch (error) { ctx = null; return; }
          master = ctx.createGain();
          master.gain.value = 0.8;
          // Rauschen hat zufällige Spitzen. Ein Begrenzer fängt sie ab, damit der Knall nicht übersteuert.
          limit = ctx.createDynamicsCompressor ? ctx.createDynamicsCompressor() : null;
          if (limit) {
            limit.threshold.value = -6; limit.knee.value = 0; limit.ratio.value = 20; limit.attack.value = 0.002; limit.release.value = 0.1;
            master.connect(limit);
            limit.connect(ctx.destination);
          } else master.connect(ctx.destination);
          noise = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
          data = noise.getChannelData(0);
          for (i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
        }
        if (ctx.state === "suspended" && ctx.resume) ctx.resume();
      },
      // levels: { burner, boil, fizz, fire }, je 0 bis 1
      set: function (levels) {
        var name, voice, want, def, src, filter;
        if (!ctx) return;
        for (name in VOICES) {
          def = VOICES[name];
          want = muted ? 0 : Math.max(0, Math.min(1, levels[name] || 0)) * def[3];
          voice = voices[name];
          if (!voice) {
            if (!(want > 0)) continue;
            src = source(); filter = ctx.createBiquadFilter(); voice = voices[name] = ctx.createGain();
            filter.type = def[0]; filter.frequency.value = def[1]; filter.Q.value = def[2];
            voice.gain.value = 0;
            src.connect(filter); filter.connect(voice); voice.connect(master);
            src.start();
          }
          voice.gain.setTargetAtTime(want, ctx.currentTime, 0.08);
        }
      },
      // Einzelner Klang: "pop" (Stärke 0 bis 3), "hiss" (etwas erlischt), "whoosh" (etwas flammt auf), "crash" (Glas)
      shot: function (name, level) {
        if (!ctx || muted) return;
        if (name === "pop") {
          if (level === 2) whistle(2400, 500, 0.22, 0.25);
          // Der laute Knall: ein tiefes Grollen und ein kurzer, scharfer Schlag. Tiefes Rauschen hinter dem Filter ist leise,
          // deshalb die hohe Verstärkung: gemessen ist er so der lauteste der drei.
          if (level >= 3) { burst("lowpass", 180, 4.5, 0.9); burst("bandpass", 900, 0.7, 0.3, 0.5); }
          else burst("lowpass", level === 2 ? 700 : 1100, level === 2 ? 0.6 : 0.3, 0.18);
        } else if (name === "hiss") burst("highpass", 3000, 0.12, 0.5);
        else if (name === "whoosh") burst("bandpass", 600, 0.3, 0.7, 0.5);
        else if (name === "crash") { burst("highpass", 5000, 0.5, 0.6); burst("bandpass", 2500, 0.4, 0.35, 3); }
      },
      // Klick eines Geigerzählers, delay Sekunden von jetzt an: ein scharfer Anschlag und das kurze Nachklingen des kleinen
      // Lautsprechers um 3 kHz, zusammen etwa 5 ms
      tick: function (delay) {
        var src, data, sr, i;
        if (!ctx || muted) return;
        if (!click) {
          sr = ctx.sampleRate;
          click = ctx.createBuffer(1, Math.round(sr * 0.006), sr);
          data = click.getChannelData(0);
          for (i = 0; i < data.length; i++) {
            data[i] = 0.5 * Math.exp(-i / (sr * 0.0003)) * (Math.random() * 2 - 1) + 0.45 * Math.exp(-i / (sr * 0.0012)) * Math.sin(2 * Math.PI * 2900 * i / sr);
          }
        }
        src = ctx.createBufferSource();
        src.buffer = click;
        src.connect(master);
        src.start(ctx.currentTime + Math.max(0, delay || 0));
      },
      mute: function (flag) {
        var name;
        muted = !!flag;
        if (muted && ctx) for (name in voices) voices[name].gain.setTargetAtTime(0, ctx.currentTime, 0.03);
      },
      close: function () {
        if (ctx && ctx.close) ctx.close();
        ctx = null; voices = {};
      }
    };
  };
})(typeof globalThis !== "undefined" ? globalThis : this);
