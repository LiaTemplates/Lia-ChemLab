/* ChemLab – Looks für die Küche: Gaskartuschenkocher statt Brenner, Glastopf auf der Kochplatte statt Wasserbad,
   Einstechthermometer, Messbecher mit Henkel, Untertasse. Klassisches Skript, geladen nach den Looks des Labors.
   Wo die Küche nichts Eigenes hat, gilt der Look des Labors im Stil der Küche (siehe scenes.js). */
(function (global) {
  "use strict";

  var L = global.LiaChemLab, THREE = L.THREE, fx = L.fx3d, lab = function (type) { return L.looks3d[type].lab; };
  var PX = 16, V = function (x, y, z) { return new THREE.Vector3(x, y, z); };

  function cm(px) { return px / PX; }

  function mesh(geo, mat, x, y, z) {
    var m = new THREE.Mesh(geo, mat);
    m.position.set(x || 0, y || 0, z || 0);
    m.castShadow = true;
    return m;
  }

  // ------------------------------------------------------------------ Gaskartuschenkocher

  // Hohe Kartusche, darauf der Brennerkopf mit Topfträgern; die Flamme ein Kranz kleiner Flammen.
  // [Höhe einer Flamme, Farbe außen, Farbe innen, Licht, Lichtfarbe]
  var RING = [null, [2.2, 0xffa035, 0x3050ff, 90, 0xffa040], [1.1, 0x3d6dff, 0x8fd8ff, 30, 0x7aa6ff]], N = 12;

  L.registerLook("burner", "kitchen", {
    build: function () {
      var group = new THREE.Group(), body = new THREE.Group(), flames = [], k, light = new THREE.PointLight(0x6fa0ff, 0, 0, 2);
      for (k = 0; k < N; k++) { flames.push(fx.cone(0.2, 0x3d6dff)); group.add(flames[k]); }
      group.add(body, light);
      group.userData = { body: body, flames: flames, light: light };
      return group;
    },
    update: function (group, d, kit) {
      var u = group.userData, r = d.data, place = d.place, top = place ? kit.up(place.lift) : 12, H = top - 1.6, f = RING[r.flame], t = d.ctx.still ? 0 : d.ctx.t;
      fx.rebuild(group, "stove", String(top) + (place && place.clamp), function (sub) {
        var steel = fx.steel(), k, a;
        sub.add(mesh(new THREE.CylinderGeometry(3.3, 3.3, H - 1.5, 32), new THREE.MeshStandardMaterial({ color: 0x2f6fb0, roughness: 0.35, metalness: 0.4 }), 0, (H - 1.5) / 2));
        sub.add(mesh(new THREE.CylinderGeometry(3.3, 2.6, 1, 32), steel, 0, H - 1));                   // Ventil
        sub.add(mesh(new THREE.CylinderGeometry(1.3, 1.5, 0.6, 24), fx.matte(0x2b2d31, 0.4, 0.6), 0, H - 0.2));      // Brennerkopf
        sub.add(mesh(new THREE.CylinderGeometry(0.5, 0.5, 1.2, 16).rotateZ(Math.PI / 2), fx.matte(0x202326, 0.5), 3.6, H - 1));    // Drehknopf
        for (k = 0; k < 3; k++) {                       // Topfträger aus Draht, oben auf der Höhe, auf der das Gefäß steht
          a = k * Math.PI * 2 / 3 - Math.PI / 2;
          sub.add(fx.rod(V(1.4 * Math.cos(a), H - 0.3, 1.4 * Math.sin(a)), V(4.4 * Math.cos(a), top - 0.15, 4.4 * Math.sin(a)), 0.13, steel));
          sub.add(fx.rod(V(4.4 * Math.cos(a), top - 0.15, 4.4 * Math.sin(a)), V(2.2 * Math.cos(a), top - 0.15, 2.2 * Math.sin(a)), 0.13, steel));
        }
        if (place && place.clamp) fx.stand(sub, cm(54) + 2, -4, 0, top + cm(150), [{ y: top + cm(120), x: 0, r: cm(13) }]);
      });
      u.body = group.userData.stove;
      u.light.intensity = f ? f[3] * (0.9 + 0.1 * Math.sin(t * 23)) : 0;
      u.flames.forEach(function (c, k) {
        var a = k / N * Math.PI * 2, flick;
        c.visible = !!f;
        if (!f) return;
        flick = 1 + (d.ctx.still ? 0 : 0.12 * Math.sin(t * 29 + k * 1.7));
        c.position.set(1.15 * Math.cos(a), H + 0.1, 1.15 * Math.sin(a));
        c.scale.set(r.flame === 1 ? 1.4 : 1, f[0] * flick, r.flame === 1 ? 1.4 : 1);
        c.rotation.set(Math.sin(a) * 0.35, 0, -Math.cos(a) * 0.35);       // leicht nach außen geneigt
        c.material.uniforms.color.value.copy(r.tint ? fx.color(r.tint.rgb) : new THREE.Color(f[1]));
        c.material.uniforms.strength.value = 1.5;
      });
      if (f) u.light.color.copy(r.tint ? fx.color(r.tint.rgb) : new THREE.Color(f[4]));
      u.light.position.y = H + 2;
    }
  });

  // ------------------------------------------------------------------ Wasserbad: Glastopf auf der Kochplatte

  var BATH = { lift: 30, depth: 50 };

  L.registerLook("bath", "kitchen", {
    build: function () {
      var group = new THREE.Group(), screen = fx.screen(2.8, 1.1);
      group.add(screen);
      group.userData = { screen: screen };
      return group;
    },
    update: function (group, d, kit) {
      var u = group.userData, r = d.data, p = d.place || { half: 50, depth: BATH.depth, clamp: false }, a = cm(p.half);
      var grate = kit.up(BATH.lift), level = grate + cm(p.depth), plate = Math.min(4, grate - 0.6), cold = r.temp <= 4;
      u.body = fx.rebuild(group, "pot", [a, level, p.clamp, cold].join("|"), function (sub) {
        var R = a + 0.4, glass = fx.glass(), steel = fx.steel();
        sub.add(mesh(new THREE.BoxGeometry(2 * R + 3, plate, 2 * R + 3), fx.matte(0xf4f4f2, 0.4), 0, plate / 2));          // Kochplatte
        sub.add(mesh(new THREE.CylinderGeometry(R, R, 0.15, 40), fx.matte(0x1b1c1e, 0.5), 0, plate + 0.05));
        var pot = new THREE.Mesh(fx.wall({ id: "pot", floor: plate + 0.2, rim: level + 1.2, inner: function () { return R; } }, 0.15, 0.1), glass);
        pot.renderOrder = 2;
        sub.add(pot);
        [-1, 1].forEach(function (s) { sub.add(mesh(new THREE.BoxGeometry(1.6, 0.4, 2.2), steel, s * (R + 0.9), level + 0.6)); });      // Griffe
        var water = new THREE.Mesh(new THREE.CylinderGeometry(R - 0.05, R - 0.05, level - plate - 0.2, 40),
          new THREE.MeshPhysicalMaterial({ color: cold ? 0xd8ecf7 : 0xa9d3ee, roughness: 0.05, transparent: true, opacity: 0.25, depthWrite: false }));
        water.position.y = (level + plate + 0.2) / 2; water.renderOrder = 1;
        sub.add(water);
        sub.add(mesh(new THREE.TorusGeometry(R * 0.6, 0.08, 6, 32).rotateX(Math.PI / 2), steel, 0, grate - 0.1));      // Untersetzer im Topf
        if (p.clamp) fx.stand(sub, -R - 1.6, -4, 0, grate + cm(150), [{ y: grate + cm(120), x: 0, r: cm(13) }]);
        sub.add(mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.5, 16).rotateX(Math.PI / 2), fx.matte(0x202326, 0.5), R - 0.4, plate / 2, R + 1.7));     // Regler
      });
      u.screen.position.set(-0.8, Math.min(4, kit.up(BATH.lift) - 0.6) / 2, a + 0.4 + 1.51);
      u.screen.userData.write(d.ctx.numbers ? L.num(r.temp, 0, d.ctx.lang) + " °C" : "");
    }
  });

  // ------------------------------------------------------------------ Einstechthermometer

  L.registerLook("thermometer", "kitchen", {
    build: function () {
      var group = new THREE.Group(), screen = fx.screen(1.9, 0.9);
      group.add(screen);
      group.userData = { screen: screen };
      return group;
    },
    update: function (group, d) {
      var u = group.userData, r = d.data, p = d.place || { x: 0, bottom: -10, top: -200 }, x = cm(p.x), bottom = cm(-p.bottom), top = cm(-p.top);
      u.body = fx.rebuild(group, "probe", [p.x, p.bottom, p.top, !!d.place].join("|"), function (sub) {
        sub.add(mesh(new THREE.CylinderGeometry(0.1, 0.06, top - 1.6 - bottom, 12), fx.steel(), x, (top - 1.6 + bottom) / 2));      // Stahlspitze
        sub.add(mesh(new THREE.BoxGeometry(2.4, 3.2, 1.1), fx.matte(0x2b2d31, 0.45), x, top - 0.2, 0));                              // Kopf
        if (!d.place) sub.add(mesh(new THREE.BoxGeometry(1.8, 0.5, 1.8), fx.wood(), 0, 0.25));
      });
      u.screen.position.set(x, top + 0.3, 0.56);
      u.screen.userData.write(d.ctx.numbers ? (r.over ? "> " + L.num(r.value, 0, d.ctx.lang) : L.num(r.value, 1, d.ctx.lang)) + " °C" : "°C");
    }
  });

  // ------------------------------------------------------------------ Messbecher und Untertasse

  // Der Messbecher ist das Becherglas des Labors (mit roter Skala, siehe Stil) und bekommt einen Henkel
  L.registerLook("beaker", "kitchen", {
    build: function (kit, d) { return lab("beaker").build(kit, d); },
    update: function (group, d, kit) {
      lab("beaker").update(group, d, kit);
      var shape = group.userData.shape, R = shape.inner(shape.rim) + 0.1;
      fx.rebuild(group, "handle", shape.id, function (sub) {
        var h = shape.rim * 0.62, handle = new THREE.Mesh(new THREE.TorusGeometry(h / 2, 0.22, 10, 24, Math.PI), fx.glass());
        handle.rotation.z = Math.PI / 2;           // der Bogen zeigt nach außen (−x)
        handle.position.set(-R, shape.rim * 0.52, 0);
        handle.renderOrder = 2;
        sub.add(handle);
      });
    }
  });

  // Die Abdampfschale des Labors als Untertasse mit blauem Rand
  L.registerLook("dish", "kitchen", {
    build: function (kit, d) { return lab("dish").build(kit, d); },
    update: function (group, d, kit) {
      lab("dish").update(group, d, kit);
      var shape = group.userData.shape;
      fx.rebuild(group, "rim", shape.id, function (sub) {
        sub.add(mesh(new THREE.TorusGeometry(shape.inner(shape.rim) + 0.1, 0.07, 8, 64).rotateX(Math.PI / 2), fx.matte(0x2a5aa8, 0.3), 0, shape.rim + 0.02));
      });
    }
  });
})(typeof globalThis !== "undefined" ? globalThis : this);
