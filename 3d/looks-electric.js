/* ChemLab – Looks für das Labor: Elektrochemie. Elektroden, Netzgerät, Strom- und Spannungsmesser, Lämpchen, Salzbrücke.
   Klassisches Skript, geladen nach looks-tools.js. Maße und Anschlüsse wie in den 2D-Teilen (Bildpunkte / 16);
   obj.userData.terminals nennt die Anschlüsse, die Bühne zieht die Leitungen dazwischen. */
(function (global) {
  "use strict";

  var L = global.LiaChemLab, THREE = L.THREE, fx = L.fx3d;
  var PX = 16, V = function (x, y, z) { return new THREE.Vector3(x, y, z); };

  function cm(px) { return px / PX; }

  function mesh(geo, mat, x, y, z) {
    var m = new THREE.Mesh(geo, mat);
    m.position.set(x || 0, y || 0, z || 0);
    m.castShadow = true;
    return m;
  }

  function colorOf(id, fallback) { var s = L.species(id); return (s && s.color) || fallback || "#8a8f96"; }

  // Buchse für Laborkabel: rot, blau oder schwarz
  function post(color) { return new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.26, 0.45, 16), fx.matte(color, 0.4)); }

  // ------------------------------------------------------------------ Elektroden

  var electrode = {
    build: function (kit) {
      var group = new THREE.Group(), tag = kit.label(0.7);
      var bub = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 10, 6), new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 1, roughness: 0.03 }), 16);
      var film = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 8, 6), new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 1, roughness: 0.03 }), 18);
      bub.count = 0; film.count = 0;
      bub.frustumCulled = film.frustumCulled = false;            // count wechselt: eine einmal berechnete Hülle wäre leer oder zu klein, und nah herangezoomt fehlten die Blasen
      group.add(tag, bub, film);
      group.userData = { tag: tag, bub: bub, film: film, dummy: new THREE.Object3D() };
      return group;
    },
    update: function (group, d) {
      var u = group.userData, r = d.data, p = d.place || { x: 0, bottom: -8, top: -160 }, x = cm(p.x);
      var bottom = cm(-p.bottom), top = cm(-(p.top + 8)), surface = d.place && d.place.surface != null ? cm(-d.place.surface) : null;
      var wet = surface != null && surface > bottom, carbon = /^C\(/.test(r.material), coat = r.coat && r.coat[0], k, q, t = d.ctx.still ? 0 : d.ctx.t, n;
      u.body = fx.rebuild(group, "plate", [p.x, p.bottom, p.top, p.rim, !!d.place, r.material].join("|"), function (sub) {
        var plate = mesh(carbon ? new THREE.CylinderGeometry(0.25, 0.25, top - bottom, 16) : new THREE.BoxGeometry(0.44, top - bottom, 0.1),
          fx.matte(colorOf(r.material), carbon ? 0.7 : 0.32, carbon ? 0.1 : 0.85), x, (top + bottom) / 2);
        plate.name = "plate";
        var cover = mesh(new THREE.BoxGeometry(0.56, 1, 0.22), new THREE.MeshStandardMaterial({ roughness: 0.8, transparent: true }), x, 0);
        cover.name = "coat";
        sub.add(plate, cover, mesh(new THREE.SphereGeometry(0.2, 12, 8), fx.matte(0x8a8f96, 0.3, 0.9), x, cm(-(p.top + 6))));
        // Krokodilklemme am Rand des Glases, sonst ein Halter auf dem Tisch
        if (d.place) sub.add(mesh(new THREE.BoxGeometry(0.9, 0.25, 0.35), fx.matte(0x3a3d42, 0.5), x + (p.x < 0 ? -0.5 : 0.5), cm(-(p.rim - 4))));
        else sub.add(mesh(new THREE.BoxGeometry(1.8, 0.5, 1.8), fx.wood(), 0, 0.25));
      });
      var plate = u.body.getObjectByName("plate"), cover = u.body.getObjectByName("coat");
      // Eine Elektrode, die sich auflöst, wird dünner; was sich abscheidet, liegt als Belag auf dem eingetauchten Teil
      q = r.g0 > 0 ? Math.max(0.25, Math.sqrt(Math.max(0, r.g) / r.g0)) : 1;
      plate.scale.set(q, 1, q);
      cover.visible = !!coat && wet;
      if (cover.visible) {
        cover.material.color.set(colorOf(coat.id));
        cover.material.opacity = Math.min(0.95, 0.4 + coat.n / 1e-4 * 0.55);
        cover.scale.y = Math.max(0.01, surface - bottom);
        cover.position.y = (surface + bottom) / 2;
      }
      // Gasblasen am eingetauchten Teil
      n = wet && r.bub > 1e-9 ? L.fx.count(r.bub) : 0;
      for (k = 0; k < n; k++) {
        q = fx.pseudo(d.ctx.seed + 3, k) + t * (0.5 + 0.5 * fx.pseudo(d.ctx.seed, k));
        q -= Math.floor(q);
        u.dummy.position.set(x + (fx.pseudo(d.ctx.seed + 9, k) - 0.5) * 0.9, bottom + 0.1 + q * (surface - bottom - 0.15), (fx.pseudo(d.ctx.seed + 7, k) - 0.5) * 0.5);
        u.dummy.scale.setScalar(0.03 + 0.03 * fx.pseudo(d.ctx.seed + 5, k));
        u.dummy.updateMatrix();
        u.bub.setMatrixAt(k, u.dummy.matrix);
      }
      u.bub.count = n;
      u.bub.instanceMatrix.needsUpdate = true;
      // Gas, das an der Elektrode haftet: feine Bläschen, die stillsitzen
      n = wet && r.held > 0.02 ? Math.round(3 + 15 * Math.min(1, r.held)) : 0;
      for (k = 0; k < n; k++) {
        q = (fx.pseudo(11, k) - 0.5) * 2;                        // auf den beiden Seiten der Platte, beim Graphitstab rundherum
        u.dummy.position.set(x + (carbon ? 0.26 * q : 0.18 * q), bottom + 0.1 + fx.pseudo(7, k) * Math.max(0, surface - bottom - 0.2),
          carbon ? (k % 2 ? 1 : -1) * 0.26 * Math.sqrt(1 - q * q) : (k % 2 ? 0.07 : -0.07));
        u.dummy.scale.setScalar(0.025 + 0.02 * fx.pseudo(3, k));
        u.dummy.updateMatrix();
        u.film.setMatrixAt(k, u.dummy.matrix);
      }
      u.film.count = n;
      u.film.instanceMatrix.needsUpdate = true;
      group.userData.terminals = [V(x, cm(-(p.top + 6)) + 0.2, 0)];
      // der Pol neben dem Anschluss, auf der Seite der Glaswand
      u.tag.visible = !!r.pole;
      u.tag.userData.write(r.pole === "+" ? "+" : "−");
      u.tag.position.set(x + (p.x < 0 ? -0.8 : 0.8), cm(-(p.top + 6)), 0);
    }
  };
  Object.keys(L.parts).forEach(function (type) { if (L.parts[type].electrode) L.registerLook(type, "lab", electrode); });
  L.electrode3d = electrode;        // eigene Elektroden, die später dazukommen, nimmt die Bühne von hier (lookOf in stage.js)

  // ------------------------------------------------------------------ Netzgerät, Strom- und Spannungsmesser

  // Gehäuse der Breite w und Höhe h (Bildpunkte wie in 2D), Anzeige oben, Knopf unten, zwei Buchsen auf dem Deckel bei ±post (Bildpunkte, Höhe top)
  function device(w, h, postX, postY, text, knob) {
    return {
      build: function () {
        var group = new THREE.Group(), body = new THREE.Group(), screen = fx.screen(cm(w) * 0.78, cm(20) * 0.95);
        var dial = mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.3, 24).rotateX(Math.PI / 2), fx.matte(0x2b2f35, 0.45), 0, cm(knob.y), 2.15);
        var mark = mesh(new THREE.BoxGeometry(0.06, 0.32, 0.05), fx.matte(0xf2f2f2, 0.4), 0, 0.15, 0.17);
        dial.add(mark);
        var a = post(0xc62828), b = post(0x202326);
        a.position.set(-cm(postX), cm(h) + 0.22, 0.8); b.position.set(cm(postX), cm(h) + 0.22, 0.8);
        body.add(mesh(new THREE.BoxGeometry(cm(w), cm(h), 4), fx.matte(fx.style.device, 0.5), 0, cm(h) / 2), screen, dial, a, b);
        screen.position.set(0, cm(knob.screen), 2.01);
        group.add(body);
        group.userData = { body: body, screen: screen, dial: dial, a: a, b: b, terminals: [V(-cm(postX), cm(postY) + 0.2, 0.8), V(cm(postX), cm(postY) + 0.2, 0.8)] };
        return group;
      },
      update: function (group, d) {
        var u = group.userData, r = d.data;
        u.screen.userData.write(text(r, d.ctx));
        if (knob.turn) u.dial.rotation.z = -(r.volts / 12 * 4.4 - 2.2);
        if (knob.poles) {                // der linke Anschluss ist der Pluspol, solange nicht umgepolt ist
          u.a.material.color.set(r.flip ? 0x1f4fbf : 0xc62828);
          u.b.material.color.set(r.flip ? 0xc62828 : 0x1f4fbf);
        }
      }
    };
  }

  L.registerLook("supply", "lab", device(80, 52, 24, 56, function (r, ctx) { return ctx.numbers ? L.shown(r, ctx.lang) : r.volts > 0 ? "V" : "–"; },
    { y: 11, screen: 34, turn: true, poles: true }));
  L.registerLook("ammeter", "lab", device(64, 46, 20, 50, function (r, ctx) { return ctx.numbers ? L.shown(r, ctx.lang) : "A"; }, { y: 9, screen: 30 }));
  L.registerLook("voltmeter", "lab", device(64, 46, 20, 50, function (r, ctx) { return ctx.numbers ? L.shown(r, ctx.lang) : "V"; }, { y: 9, screen: 30 }));

  // ------------------------------------------------------------------ Lämpchen

  L.registerLook("lamp", "lab", {
    build: function () {
      var group = new THREE.Group(), body = new THREE.Group();
      var bulb = mesh(new THREE.SphereGeometry(cm(11), 24, 16), new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.05, transparent: true, opacity: 0.35,
        emissive: 0xffd36a, emissiveIntensity: 0, depthWrite: false }), 0, cm(38));
      bulb.renderOrder = 2;
      var wire = new THREE.CatmullRomCurve3([V(-0.25, cm(27), 0), V(-0.25, cm(35), 0), V(0, cm(40), 0), V(0.25, cm(35), 0), V(0.25, cm(27), 0)]);
      var filament = mesh(new THREE.TubeGeometry(wire, 20, 0.02, 4), new THREE.MeshStandardMaterial({ color: 0x55504a, emissive: 0xffb347, emissiveIntensity: 0 }));
      var halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: fx.puff ? fx.puff() : null, color: 0xffe08a, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }));
      halo.position.y = cm(38);
      var a = post(0x202326), b = post(0x202326);
      a.position.set(-cm(14), cm(18), 0); b.position.set(cm(14), cm(18), 0);
      body.add(mesh(new THREE.BoxGeometry(cm(40), cm(14), 2.2), fx.matte(0x3a3f45, 0.5), 0, cm(7)),
        mesh(new THREE.CylinderGeometry(cm(7), cm(7), cm(10), 16), fx.steel(), 0, cm(23)), bulb, filament, a, b);
      group.add(body, halo);
      group.userData = { body: body, bulb: bulb, filament: filament, halo: halo, terminals: [V(-cm(14), cm(18) + 0.22, 0), V(cm(14), cm(18) + 0.22, 0)] };
      return group;
    },
    update: function (group, d) {
      var u = group.userData, glow = Math.max(0, Math.min(1, d.data.value || 0));
      u.bulb.material.emissiveIntensity = 2.5 * glow;
      u.bulb.material.opacity = 0.35 + 0.5 * glow;
      u.filament.material.emissiveIntensity = 4 * glow;
      u.halo.material.opacity = glow > 0.02 ? 0.25 + 0.6 * glow : 0;
      u.halo.scale.setScalar(2 + 3 * glow);
    }
  });

  // ------------------------------------------------------------------ Salzbrücke

  // place: { x1, y1, s1, x2, y2, s2 } in Bildpunkten: an beiden Enden die Stelle, der Rand des Gefäßes und wie tief sie eintaucht
  L.registerLook("bridge", "lab", {
    build: function () { var group = new THREE.Group(); group.userData = {}; return group; },
    update: function (group, d) {
      var p = d.place || { x1: -20, y1: -18, s1: -4, x2: 20, y2: -18, s2: -4 };
      group.userData.body = fx.rebuild(group, "tube", [p.x1, p.y1, p.s1, p.x2, p.y2, p.s2].join("|"), function (sub) {
        var top = cm(-(Math.min(p.y1, p.y2) - 24)), dir = p.x2 > p.x1 ? 1 : -1, path = new THREE.CurvePath();
        var x1 = cm(p.x1), x2 = cm(p.x2), r = 0.6;
        path.add(new THREE.LineCurve3(V(x1, cm(-p.s1), 0), V(x1, top - r, 0)));
        path.add(new THREE.QuadraticBezierCurve3(V(x1, top - r, 0), V(x1, top, 0), V(x1 + r * dir, top, 0)));
        path.add(new THREE.LineCurve3(V(x1 + r * dir, top, 0), V(x2 - r * dir, top, 0)));
        path.add(new THREE.QuadraticBezierCurve3(V(x2 - r * dir, top, 0), V(x2, top, 0), V(x2, top - r, 0)));
        path.add(new THREE.LineCurve3(V(x2, top - r, 0), V(x2, cm(-p.s2), 0)));
        // Glasrohr mit weißem Gel (Kaliumnitrat in Agar)
        sub.add(mesh(new THREE.TubeGeometry(path, 120, 0.24, 12), new THREE.MeshPhysicalMaterial({ color: 0xf1efe8, roughness: 0.35, transparent: true, opacity: 0.9, clearcoat: 1 })));
        if (!d.place) sub.add(mesh(new THREE.BoxGeometry(3.4, 0.4, 1.4), fx.wood(), 0, 0.2));
      });
    }
  });
})(typeof globalThis !== "undefined" ? globalThis : this);
