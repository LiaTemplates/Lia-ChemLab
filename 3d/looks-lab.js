/* ChemLab – Looks für das Labor: Gefäße. Klassisches Skript, geladen von chemlab-3d.js nach effects.js.
   Maße aus den 2D-Zeichnungen (L.shapes, Bildpunkte) geteilt durch 16: so tauchen Messgeräte und Bürette genau dort ein,
   wo sie es in 2D tun. In 2D ist y nach oben negativ, hier positiv. */
(function (global) {
  "use strict";

  var L = global.LiaChemLab, THREE = L.THREE, fx = L.fx3d, S = L.shapes, doc = global.document;
  var PX = 16;

  function cm(px) { return px / PX; }

  // Skala als Textur auf einem Streifen der Glaswand: marks [{ y in cm, long, text }]
  function scale(radius, height, marks, side) {
    // schmale Rohre (Bürette) bekommen einen breiteren Bogen, sonst würde die Textur viel zu hoch
    var c = doc.createElement("canvas"), g = c.getContext("2d"), tex, mat, arc = Math.min(1.6, Math.max(0.5, 0.5 / radius)), k;
    c.width = 128; c.height = Math.min(4096, Math.round(128 * height / (radius * arc)));
    g.lineWidth = 3; g.font = "bold 30px system-ui, sans-serif"; g.textBaseline = "middle";
    marks.forEach(function (m) {
      var y = c.height * (1 - m.y / height), x0 = side < 0 ? 4 : 128 - (m.long ? 52 : 34);
      for (k = 0; k < 2; k++) {         // erst ein grauer Schatten, dann weiß: lesbar vor heller Wand und vor Farbe
        g.strokeStyle = g.fillStyle = k ? "rgba(255,255,255,0.95)" : "rgba(60,70,80,0.55)";
        g.beginPath(); g.moveTo(x0 + (k ? 0 : 1.5), y + (k ? 0 : 1.5)); g.lineTo(x0 + (m.long ? 48 : 30) + (k ? 0 : 1.5), y + (k ? 0 : 1.5)); g.stroke();
        if (m.text) { g.textAlign = side < 0 ? "left" : "right"; g.fillText(m.text, side < 0 ? 58 + (k ? 0 : 1.5) : 72 + (k ? 0 : 1.5), y + (k ? 0 : 1.5)); }
      }
    });
    tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 4;
    mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false });
    // ein Bogen der Wand, der Kamera zugewandt (+z; bei Three.js liegt der Winkel 0 vorn), ein wenig rechts der Mitte
    return new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, height, 16, 1, true, 0.25 - arc / 2, arc), mat);
  }

  // Grundgerüst eines Gefäßes: Glas, Inhalt, Schild. extra(group) baut Zubehör (Ständer, Stativ) dazu.
  function vessel(opts) {
    return {
      build: function (kit, d) {
        var group = new THREE.Group(), shape = opts.shape(d), glass = new THREE.Mesh(fx.wall(shape, opts.thick || 0.07, opts.lip || 0.05), opts.material ? opts.material() : fx.glass());
        var inside = fx.contents(kit, d.ctx.seed || 1), tag = kit.label(0.75);
        glass.renderOrder = 2;
        glass.castShadow = !!opts.material;
        group.add(inside.group, glass, tag);
        group.userData = { body: glass, inside: inside, tag: tag, glass: glass, shape: shape };
        if (opts.extra) opts.extra(group, kit, d, shape);
        return group;
      },
      update: function (group, d, kit) {
        var u = group.userData, w = d.data, shape = opts.shape(d), level;
        if (shape.id !== u.shape.id) {                 // eine andere Größe: das Glas neu formen
          u.glass.geometry.dispose();
          u.glass.geometry = fx.wall(shape, opts.thick || 0.07, opts.lip || 0.05);
          u.shape = shape;
        }
        if (w.broken !== u.broken) {
          u.broken = w.broken;
          if (u.shards) { group.remove(u.shards); u.shards = null; }
          if (w.broken) { u.shards = fx.shards(shape.inner(shape.rim), d.ctx.seed || 1); group.add(u.shards); }
          group.children.forEach(function (o) { if (o !== u.shards && o !== u.tag) o.visible = !w.broken; });
        }
        if (w.broken) return;
        level = opts.level(w, d);
        u.inside.update(w, shape, level, d.ctx, !!opts.tall);
        u.tag.userData.write(fx.badge(null, d, w) || " ");
        u.tag.position.set(0, 0.15 - kit.up(d.lift), shape.inner(shape.rim) + 1.4);      // vorn auf dem Tisch, auch wenn das Gefäß gehoben ist
        if (opts.refresh) opts.refresh(group, d, shape);
      }
    };
  }

  // ------------------------------------------------------------------ Reagenzglas

  var T = S.tube, tubeR = cm(T.r), tubeFloor = cm(-T.floor), tubeCenter = tubeFloor + tubeR;
  var tubeShape = {
    id: "tube", floor: tubeFloor, rim: cm(-T.top),
    inner: function (y) { return y >= tubeCenter ? tubeR : Math.sqrt(Math.max(0, tubeR * tubeR - (tubeCenter - y) * (tubeCenter - y))); }
  };
  var wood = function () { return fx.matte(0x9a6a3a, 0.65); };

  L.registerLook("testtube", "lab", vessel({
    tall: true, thick: 0.06, lip: 0.08,
    shape: function () { return tubeShape; },
    level: function (w) { return w.ml > 0.005 ? cm(-L.parts.testtube.surface(w)) : tubeFloor; },
    // im Ständer aus Holz; über dem Brenner hält ihn eine Klemme (die gehört zum Brenner), dann bleibt der Ständer weg
    extra: function (group) {
      var rack = new THREE.Group(), m = wood(), part = function (w, h, dp, x, y, z) {
        var b = new THREE.Mesh(new THREE.BoxGeometry(w, h, dp), m);
        b.position.set(x, y, z); b.castShadow = b.receiveShadow = true; rack.add(b);
      };
      part(4, 0.5, 2.6, 0, 0.25, 0);                                    // Fuß
      part(0.32, 6.6, 2.2, -1.72, 3.3, 0); part(0.32, 6.6, 2.2, 1.72, 3.3, 0);     // Seitenwände
      part(4, 0.42, 0.42, 0, 6.85, 0.95); part(4, 0.42, 0.42, 0, 6.85, -0.95);    // Brett oben mit Loch: vorne und hinten
      part(0.95, 0.42, 1.5, -1.3, 6.85, 0); part(0.95, 0.42, 1.5, 1.3, 6.85, 0);
      group.add(rack);
      group.userData.rack = rack;
    },
    refresh: function (group, d) { group.userData.rack.visible = !d.lift; }
  }));

  // ------------------------------------------------------------------ Becherglas

  function beakerShape(d) {
    var s = S.beaker[d.data.size || d.data.cap] || S.beaker[100], a = cm(s[0] / 2), h = cm(s[1]);
    return { id: "beaker" + s[0], floor: cm(2), rim: h, size: s, inner: function (y) { var r = a - cm(2); return y < cm(8) ? r - (cm(8) - y) * 0.35 : r; } };
  }

  L.registerLook("beaker", "lab", vessel({
    thick: 0.08, lip: 0.12,
    shape: beakerShape,
    level: function (w) { return w.ml > 0.005 ? cm(-L.parts.beaker.surface(w)) : cm(2); },
    extra: function (group, kit, d, shape) { group.userData.marks = null; },
    // die Skala hängt an Größe und an der Einstellung „Zahlen zeigen“: neu nur, wenn sich davon etwas ändert
    refresh: function (group, d, shape) {
      var u = group.userData, key = shape.id + (d.ctx.numbers ? "#" : ""), marks = [], s = shape.size, i, cap = d.data.cap;
      if (u.marksKey === key) return;
      u.marksKey = key;
      if (u.marks) { group.remove(u.marks); u.marks.geometry.dispose(); u.marks.material.map.dispose(); u.marks.material.dispose(); }
      for (i = 1; i <= 4; i++) marks.push({ y: cm(3 + i / 4 * (s[1] - 16)), long: i % 2 === 0, text: d.ctx.numbers && i % 2 === 0 ? String(cap * i / 4) : "" });
      u.marks = scale(cm(s[0] / 2) + 0.012, shape.rim, marks, 1);
      u.marks.position.y = shape.rim / 2;
      u.marks.renderOrder = 3;
      group.add(u.marks);
    }
  }));

  // ------------------------------------------------------------------ Abdampfschale

  var dishShape = {
    id: "dish", floor: cm(2), rim: cm(S.dish.h + 4),
    inner: function (y) { return cm(S.dishHalf(-y * PX)); }
  };

  L.registerLook("dish", "lab", vessel({
    thick: 0.14, lip: 0.1,
    material: function () { return new THREE.MeshPhysicalMaterial({ color: 0xf5f3ee, roughness: 0.22, clearcoat: 0.8, clearcoatRoughness: 0.1 }); },
    shape: function () { return dishShape; },
    level: function (w) { return w.ml > 0.005 ? cm(-L.parts.dish.surface(w)) : cm(2); }
  }));

  // ------------------------------------------------------------------ Bürette am Stativ

  var steel = function () { return fx.matte(0x9aa3ab, 0.35, 0.85); };

  L.registerLook("burette", "lab", {
    build: function (kit, d) {
      var group = new THREE.Group(), B = S.burette, i, marks = [];
      var glass = new THREE.Mesh(new THREE.CylinderGeometry(cm(6), cm(6), 1, 24, 1, true), fx.glass());
      var tip = new THREE.Mesh(new THREE.CylinderGeometry(cm(2.5), cm(0.6), 1, 12, 1, true), fx.glass());
      var liquid = new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.04, transmission: 1, thickness: 0.5, ior: 1.33, attenuationColor: new THREE.Color(0xffffff), attenuationDistance: 2 });
      var column = new THREE.Mesh(new THREE.CylinderGeometry(cm(5), cm(5), 1, 20), liquid);
      var neck = new THREE.Mesh(new THREE.CylinderGeometry(cm(1.5), cm(1.5), 1, 8), liquid);
      var cock = new THREE.Group(), body = new THREE.Mesh(new THREE.CylinderGeometry(cm(3.5), cm(3.5), cm(14), 16).rotateZ(Math.PI / 2), fx.glass());
      var grip = new THREE.Mesh(new THREE.BoxGeometry(cm(4), cm(16), cm(3)), fx.matte(0x2f6fb0, 0.45));
      var stand = new THREE.Group(), m = steel();
      var foot = new THREE.Mesh(new THREE.BoxGeometry(cm(46), cm(5), 9), fx.matte(0x3a3f45, 0.5, 0.3));
      var rod = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 1, 12), m);
      var arm1 = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 1, 8).rotateZ(Math.PI / 2), m), arm2 = arm1.clone();
      var flow = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 1, 8, 1, true), new THREE.MeshPhysicalMaterial({ color: 0xdfeefa, roughness: 0.05, transparent: true, opacity: 0.6, depthWrite: false }));
      var drops = new THREE.InstancedMesh(new THREE.SphereGeometry(cm(1.6), 10, 8), flow.material, 3);
      var tag = kit.label(0.75);
      for (i = 0; i <= B.cap; i += 5) marks.push({ y: cm(B.length) * (1 - i / B.cap), long: i % 10 === 0, text: "" });
      glass.renderOrder = tip.renderOrder = body.renderOrder = 2;
      [foot, rod, arm1, arm2, grip].forEach(function (o) { o.castShadow = true; });
      cock.add(body, grip);
      stand.add(foot, rod, arm1, arm2);
      group.add(column, neck, glass, tip, cock, stand, flow, drops, tag);
      group.userData = { body: glass, glass: glass, tip: tip, column: column, neck: neck, liquid: liquid, cock: cock, grip: grip, foot: foot, rod: rod, arm1: arm1, arm2: arm2, flow: flow, drops: drops, tag: tag, marksKey: null };
      return group;
    },
    update: function (group, d, kit) {
      var u = group.userData, w = d.data, g = S.buretteAt(d.hang), x = cm(g.x), low = cm(-g.low), high = cm(-g.high), tipY = cm(-g.tip);
      var level = cm(-L.parts.burette.surface(w, d.hang)), open = w.tap > 0, rod = cm(g.rod), Z = -5, t = d.ctx.still ? 0 : d.ctx.t, k, y, p, B = S.burette, floor;
      u.glass.scale.y = high + cm(10) - low; u.glass.position.set(x, (low + high + cm(10)) / 2, 0);
      u.tip.scale.y = low - tipY; u.tip.position.set(x, (low + tipY) / 2, 0);
      u.column.visible = u.neck.visible = w.ml > 0.005;
      if (w.ml > 0.005) {
        u.column.scale.y = Math.max(0.001, level - low); u.column.position.set(x, (level + low) / 2, 0);
        u.neck.scale.y = low - tipY; u.neck.position.set(x, (low + tipY) / 2, 0);
        u.liquid.color.copy(fx.color(w.color.rgb)); u.liquid.attenuationColor.copy(fx.color(w.color.rgb));
      }
      // Hahn: längs heißt offen, quer heißt zu
      u.cock.position.set(x, cm(-(g.low + 8)), 0);
      u.grip.rotation.z = open ? 0 : Math.PI / 2;
      u.grip.position.set(0, 0, cm(5));
      // Stativ: Fuß und Stange hinter der Reihe der Geräte, zwei Klemmen nach vorn zur Bürette
      // steht das Gefäß darunter gehoben (Dreifuß, Wasserbad), reicht das Stativ trotzdem bis auf den Tisch
      floor = -kit.up(d.lift);
      u.foot.position.set(rod + cm(13), floor + cm(2.5), Z);
      u.rod.scale.y = cm(-(g.high + 24)) - floor; u.rod.position.set(rod, floor + u.rod.scale.y / 2, Z);
      [[u.arm1, cm(-(g.high + 60))], [u.arm2, cm(-(g.low - 30))]].forEach(function (a) {
        var dx = x - rod, len = Math.sqrt(dx * dx + Z * Z);
        a[0].scale.set(len, 1, 1);
        a[0].position.set((x + rod) / 2, a[1], Z / 2);
        a[0].rotation.y = Math.atan2(Z, dx);
      });
      // Skala: Teilstriche alle 5 mL, Zahlen alle 10 mL, wenn Zahlen gezeigt werden
      if (u.marksKey !== (d.ctx.numbers ? "#" : "")) {
        u.marksKey = d.ctx.numbers ? "#" : "";
        if (u.marks) { group.remove(u.marks); u.marks.geometry.dispose(); u.marks.material.map.dispose(); u.marks.material.dispose(); }
        var list = [];
        for (k = 0; k <= B.cap; k += 5) list.push({ y: cm(B.length) * (1 - k / B.cap), long: k % 10 === 0, text: d.ctx.numbers && k % 10 === 0 ? String(k) : "" });
        u.marks = scale(cm(6) + 0.01, cm(B.length), list, -1);
        u.marks.renderOrder = 3;
        group.add(u.marks);
      }
      u.marks.position.set(x, low + cm(B.length) / 2, 0);
      // Strahl oder Tropfen zum Gefäß darunter
      y = d.hang ? cm(-g.surface) : 0;
      u.flow.visible = open && w.ml > 0.001 && !!d.hang && w.tap >= 0.3;
      if (u.flow.visible) { u.flow.scale.set(0.05, tipY - y, 0.05); u.flow.position.set(x + 0.01 * Math.sin(t * 40), (tipY + y) / 2, 0); }
      u.drops.count = open && w.ml > 0.001 && d.hang && w.tap < 0.3 ? 3 : 0;
      for (k = 0; k < u.drops.count; k++) {
        p = (t * 1.6 + k / 3) % 1;
        u.drops.setMatrixAt(k, new THREE.Matrix4().makeTranslation(x, tipY - p * p * (tipY - y), 0));
      }
      u.drops.instanceMatrix.needsUpdate = true;
      u.tag.userData.write(d.hang ? " " : String(d.ctx.no || " "));
      u.tag.visible = !d.hang;
      u.tag.position.set(x, floor + 0.15, 1.6);
    }
  });
})(typeof globalThis !== "undefined" ? globalThis : this);
