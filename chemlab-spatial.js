/* ChemLab – räumlicher Transport (optional, von der Engine unabhängig, ohne DOM).
   Konservative Finite-Volumen-Diffusion auf beliebigen Zellen: Ein Gitter ist eine Liste von Zellvolumina und Flächen
   zwischen zwei Zellen mit ihrem Leitwert g = Fläche / Abstand der Mittelpunkte. Der Fluss über eine Fläche nimmt der einen
   Zelle genau, was er der anderen gibt; damit bleibt die Stoffmenge bis auf Rundung erhalten. Dieselbe Rechnung trägt 1D,
   kartesisch 2D und achsensymmetrisch (r, z): Nur die Geometrie unterscheidet sich (Ringvolumina, Ringflächen mit 2πr).
   Einheiten SI: m, m², m³, mol, mol/m³, s, D in m²/s. Gültig für Fick-Diffusion ungeladener Teilchen ohne Strömung. */
(function (global) {
  "use strict";

  var L = (global.LiaChemLab = global.LiaChemLab || {});

  // Kanten: a, b Zellnummern (b = -1: Rand), g Leitwert in m. Rand: c Randkonzentration (Dirichlet), sonst kein Fluss.
  function grid(vol, a, b, g) { return { vol: vol, a: a, b: b, g: g, n: vol.length }; }

  // 1D: n Zellen auf length m, Querschnitt area m²; Ränder ohne Fluss
  function line(n, length, area) {
    var dx = length / n, vol = new Float64Array(n).fill(area * dx), a = new Int32Array(n - 1), b = new Int32Array(n - 1), g = new Float64Array(n - 1).fill(area / dx);
    for (var i = 0; i < n - 1; i++) { a[i] = i; b[i] = i + 1; }
    var out = grid(vol, a, b, g);
    out.x = function (i) { return (i + 0.5) * dx; };
    out.dx = dx;
    return out;
  }

  // Achsensymmetrischer Zylinder: nr Ringe bis radius, nz Schichten bis height. Zelle k = j * nr + i (i radial, j axial).
  // An der Achse (r = 0) gibt es keine Fläche, also keinen Fluss: das ist die Symmetrie, nicht eine Sonderformel.
  function cylinder(nr, nz, radius, height) {
    var dr = radius / nr, dz = height / nz, n = nr * nz, vol = new Float64Array(n), a = [], b = [], g = [], i, j, k, r0, r1;
    for (j = 0; j < nz; j++) for (i = 0; i < nr; i++) {
      k = j * nr + i; r0 = i * dr; r1 = r0 + dr;
      vol[k] = Math.PI * (r1 * r1 - r0 * r0) * dz;
      if (i < nr - 1) { a.push(k); b.push(k + 1); g.push(2 * Math.PI * r1 * dz / dr); }          // Mantel bei r1
      if (j < nz - 1) { a.push(k); b.push(k + nr); g.push(Math.PI * (r1 * r1 - r0 * r0) / dz); }  // Deckel zur nächsten Schicht
    }
    var out = grid(vol, Int32Array.from(a), Int32Array.from(b), Float64Array.from(g));
    out.nr = nr; out.nz = nz; out.dr = dr; out.dz = dz;
    out.r = function (k) { return (k % nr + 0.5) * dr; };
    out.z = function (k) { return (Math.floor(k / nr) + 0.5) * dz; };
    return out;
  }

  // Größter stabiler Zeitschritt des expliziten Verfahrens: je Zelle D·Σg·dt ≤ V (sonst schwingt es und wird negativ)
  function stable(G, D) {
    var sum = new Float64Array(G.n), most = Infinity, e, i;
    for (e = 0; e < G.a.length; e++) { sum[G.a[e]] += G.g[e]; sum[G.b[e]] += G.g[e]; }
    for (e = 0; e < (G.edge || []).length; e++) sum[G.edge[e].cell] += G.edge[e].g;
    for (i = 0; i < G.n; i++) if (sum[i] > 0) most = Math.min(most, G.vol[i] / (D * sum[i]));
    return most;
  }

  // Diffusion über die Zeit t (s). n: Stoffmengen je Zelle in mol (wird verändert). G.edge: optionale Ränder mit fester
  // Konzentration { cell, g, c } (Dirichlet über die halbe Zelle) oder festem Fluss { cell, flux } in mol/s (Neumann).
  // Zurück: Zahl der Schritte und was über die Ränder hereinkam (mol), für die Bilanz.
  function diffuse(G, n, D, t, safety) {
    var dt = (safety || 0.45) * stable(G, D), steps = Math.max(1, Math.ceil(t / dt)), h = t / steps, inflow = 0, s, e, f, ca, cb, edge = G.edge || [];
    var c = new Float64Array(G.n);
    for (s = 0; s < steps; s++) {
      for (e = 0; e < G.n; e++) c[e] = n[e] / G.vol[e];
      for (e = 0; e < G.a.length; e++) {
        ca = c[G.a[e]]; cb = c[G.b[e]];
        f = D * G.g[e] * (cb - ca) * h;                        // von b nach a
        n[G.a[e]] += f; n[G.b[e]] -= f;
      }
      for (e = 0; e < edge.length; e++) {
        f = (edge[e].flux != null ? edge[e].flux : D * edge[e].g * (edge[e].c - c[edge[e].cell])) * h;
        n[edge[e].cell] += f; inflow += f;
      }
    }
    return { steps: steps, dt: h, inflow: inflow };
  }

  function total(n) { var s = 0; for (var i = 0; i < n.length; i++) s += n[i]; return s; }

  // Mittlere Konzentration (mol/m³), mit den Zellvolumina gewichtet: das, was ein 0D-Gefäß mit demselben Inhalt zeigt
  function mean(G, n) { var v = 0; for (var i = 0; i < G.n; i++) v += G.vol[i]; return total(n) / v; }

  // 0D → räumlich: amount mol gleichmäßig verteilt (nach Volumen); räumlich → 0D ist total()
  function spread(G, amount) {
    var n = new Float64Array(G.n), v = 0, i;
    for (i = 0; i < G.n; i++) v += G.vol[i];
    for (i = 0; i < G.n; i++) n[i] = amount * G.vol[i] / v;
    return n;
  }

  L.spatial = { line: line, cylinder: cylinder, stable: stable, diffuse: diffuse, total: total, mean: mean, spread: spread };
})(typeof globalThis !== "undefined" ? globalThis : this);
