/* ChemLab – Looks für das Labor: Gefäße. Klassisches Skript, geladen von chemlab-3d.js nach effects.js.
   Maße aus den 2D-Zeichnungen (L.shapes, Bildpunkte) geteilt durch 16: so tauchen Messgeräte und Bürette genau dort ein,
   wo sie es in 2D tun. In 2D ist y nach oben negativ, hier positiv. */
(function (global) {
  "use strict";

  var L = global.LiaChemLab, THREE = L.THREE, fx = L.fx3d, S = L.shapes, doc = global.document;
  var PX = 16;

  function cm(px) { return px / PX; }

  // Skala als Textur auf einem Streifen der Glaswand: marks [{ y in cm, kind: "short" | "medium" | "long" (oder long: true), text }].
  // Weiße Emaille wie auf echtem Laborglas; Folge der Striche und Stellung der Ziffern nach ISO 384 (9.3, 10.4): die Striche beginnen
  // vorn und laufen nach rechts, kurz, mittel, lang; die Ziffer steht über dem langen Strich, rechts neben den kurzen.
  function scale(radius, height, marks) {
    var ink = "#" + new THREE.Color(fx.style.marks == null ? 0xffffff : fx.style.marks).getHexString();
    // schmale Rohre (Bürette) bekommen einen breiteren Bogen, sonst würde die Textur viel zu hoch
    var c = doc.createElement("canvas"), g = c.getContext("2d"), tex, mat, arc = Math.min(1.6, Math.max(0.5, 0.5 / radius)), k;
    var LEN = { short: 34, medium: 46, long: 64 };
    c.width = 128; c.height = Math.min(4096, Math.round(128 * height / (radius * arc)));
    g.font = "bold 30px system-ui, sans-serif"; g.textBaseline = "alphabetic"; g.textAlign = "left";
    marks.forEach(function (m) {
      var y = c.height * (1 - m.y / height), kind = m.kind || (m.long ? "long" : "short");
      g.lineWidth = kind === "long" ? 3.5 : kind === "medium" ? 3 : 2.5;
      for (k = 0; k < 2; k++) {         // erst ein grauer Schatten, dann weiß: lesbar vor heller Wand und vor Farbe
        g.strokeStyle = g.fillStyle = k ? ink : "rgba(60,70,80,0.55)";
        g.beginPath(); g.moveTo(4 + (k ? 0 : 1.5), y + (k ? 0 : 1.5)); g.lineTo(4 + LEN[kind] + (k ? 0 : 1.5), y + (k ? 0 : 1.5)); g.stroke();
        if (m.text) g.fillText(m.text, 46 + (k ? 0 : 1.5), y - 6 + (k ? 0 : 1.5));
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
        // zwei Schichten: die Grenze in der Höhe, bis zu der die untere reicht
        var lower = w.oil ? (w.oil.top ? w.ml - w.oil.ml : w.oil.ml) : 0;
        u.inside.update(w, shape, level, d.ctx, !!opts.tall, w.mirror ? opts.level(Object.assign({}, w, { ml: Math.max(0.01, w.mirror.ml) }), d) : null,
          w.oil && lower > 0.005 && w.oil.ml > 0.005 ? opts.level(Object.assign({}, w, { ml: lower }), d) : null,
          w.foam > 0.3 ? opts.level(Object.assign({}, w, { ml: Math.min(w.cap, w.ml + w.foam) }), d) : null);
        u.tag.userData.write(fx.badge(null, d, w) || " ");
        u.tag.position.set(0, 0.15 - kit.up(d.lift), (shape.front || shape.inner(shape.rim)) + 1.4);      // vorn auf dem Tisch, auch wenn das Gefäß gehoben ist; front: weiteste Stelle
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
  var wood = function () { return fx.wood(); };

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
      if (u.marks) { group.remove(u.marks); u.marks.geometry.dispose(); u.marks.material.map.dispose(); u.marks.material.dispose(); u.marks = null; }
      if (fx.style.marks == null) return;                // Bechergläser um 1880: ohne Skala
      for (i = 1; i <= 4; i++) marks.push({ y: cm(3 + i / 4 * (s[1] - 16)), long: i % 2 === 0, text: d.ctx.numbers && i % 2 === 0 ? String(cap * i / 4) : "" });
      u.marks = scale(cm(s[0] / 2) + 0.012, shape.rim, marks, 1);
      u.marks.position.y = shape.rim / 2;
      u.marks.renderOrder = 3;
      group.add(u.marks);
      // weißes Schriftfeld vorn auf dem Glas, wie in 2D: 70 % der halben Breite links und rechts der Mitte, in halber Höhe
      if (u.field) { group.remove(u.field); u.field.geometry.dispose(); }
      u.field = new THREE.Mesh(new THREE.CylinderGeometry(cm(s[0] / 2) + 0.01, cm(s[0] / 2) + 0.01, cm(Math.max(7, s[1] * 0.09)), 16, 1, true, -0.35, 0.7),
        u.fieldMat || (u.fieldMat = new THREE.MeshStandardMaterial({ color: 0xfbfbf7, roughness: 0.7, transparent: true, opacity: 0.9, depthWrite: false })));
      u.field.position.y = cm(s[1] * 0.55 - Math.max(7, s[1] * 0.09) / 2);
      u.field.renderOrder = 3;
      group.add(u.field);
    }
  }));

  // ------------------------------------------------------------------ Erlenmeyerkolben

  // Kegel mit kurzem Hals (ISO 1773), dasselbe Profil wie in 2D (S.erlenmeyerInner)
  function erlShape(d) {
    var s = S.erlenmeyer[d.data.size || d.data.cap] || S.erlenmeyer[250];
    return { id: "erlenmeyer" + s[0], floor: cm(2), rim: cm(s[1]), front: cm(s[0]), size: s, steps: 64,
      inner: function (y) { return cm(S.erlenmeyerInner(s, y * PX - 2)); } };
  }
  L.registerLook("erlenmeyer", "lab", vessel({
    tall: true, thick: 0.06, lip: 0.06,
    shape: erlShape,
    level: function (w) { return w.ml > 0.005 ? cm(-L.parts.erlenmeyer.surface(w)) : cm(2); }
  }));

  // ------------------------------------------------------------------ Stehkolben, Saugflasche, Tiegel

  // Profile wie in 2D (S.flatShape, S.crucible); y hier in cm über dem Tisch, h in Bildpunkten über dem Boden
  L.registerLook("flatflask", "lab", vessel({
    tall: true, thick: 0.06, lip: 0.06,
    shape: function (d) {
      var F = S.flatShape(d.data);
      return { id: "flatflask" + F.size[0], floor: cm(2), rim: cm(F.H), front: cm(F.size[0]), steps: 64,
        inner: function (y) { var h = y * PX - 1; return h >= F.shape.top ? cm(F.size[2] - 1) : cm(Math.max(F.size[2] - 1, F.shape.half(Math.max(0, h)) - 1)); } };
    },
    level: function (w) { return w.ml > 0.005 ? cm(-L.parts.flatflask.surface(w)) : cm(2); }
  }));

  // die Saugflasche: der Erlenmeyerkolben mit 250 mL, dickwandig, mit Ansatz und Schlauch zum Hahn hinter dem Tisch
  L.registerLook("filterflask", "lab", vessel({
    tall: true, thick: 0.1, lip: 0.07,
    shape: function () { var sh = erlShape({ data: { size: 250 } }); sh.id = "filterflask"; return sh; },
    level: function (w) { return w.ml > 0.005 ? cm(-L.parts.filterflask.surface(w)) : cm(2); },
    extra: function (group) {
      var s = S.erlenmeyer[250], y = cm(s[1] - s[3] * 0.5), n = cm(s[2]);
      var arm = new THREE.Mesh(new THREE.CylinderGeometry(cm(3.5), cm(3.5), cm(18), 12, 1, true).rotateZ(Math.PI / 2), fx.glass());
      arm.position.set(n + cm(8), y, 0); arm.renderOrder = 2;
      var hose = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([new THREE.Vector3(n + cm(16), y, 0), new THREE.Vector3(cm(s[0] + 18), y - 0.3, -1),
        new THREE.Vector3(cm(s[0] + 22), 1, -6), new THREE.Vector3(cm(s[0] + 22), 0.2, -9)]), 30, 0.18, 8), fx.matte(fx.style.hose, 0.6));
      hose.castShadow = true;
      group.add(arm, hose);
    }
  }));

  // Porzellantiegel: dicke, undurchsichtige Wand wie die Abdampfschale
  L.registerLook("crucible", "lab", vessel({
    thick: 0.12, lip: 0.08,
    material: function () { return new THREE.MeshPhysicalMaterial({ color: 0xf5f3ee, roughness: 0.25, clearcoat: 0.7, clearcoatRoughness: 0.15 }); },
    shape: function () {
      var C = S.cruc;
      return { id: "crucible", floor: cm(4), rim: cm(C.h + 2), front: cm(C.top), steps: 12,
        inner: function (y) { return cm(Math.max(4, S.crucible.half(Math.min(C.h, Math.max(0, y * PX - 2))) - 3)); } };
    },
    level: function (w) { return w.ml > 0.005 ? cm(-L.parts.crucible.surface(w)) : cm(4); }
  }));

  // ------------------------------------------------------------------ Pneumatische Wanne

  // Glaswanne mit Wasser, darin auf einer Brücke ein umgestülpter Standzylinder; oben in ihm das aufgefangene Gas (w.caught)
  L.registerLook("trough", "lab", {
    build: function (kit) {
      var T = S.trough, group = new THREE.Group(), A = cm(T.a), H = cm(T.h), D = 9, glass = fx.glass(), k;
      var walls = new THREE.Group();
      [[0, H / 2, D / 2, 2 * A, H, 0.05], [0, H / 2, -D / 2, 2 * A, H, 0.05], [A, H / 2, 0, 0.05, H, D], [-A, H / 2, 0, 0.05, H, D], [0, 0.03, 0, 2 * A, 0.06, D]].forEach(function (b) {
        var m = new THREE.Mesh(new THREE.BoxGeometry(b[3], b[4], b[5]), glass); m.position.set(b[0], b[1], b[2]); m.renderOrder = 2; walls.add(m);
      });
      var waterMat = new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.05, transmission: 0.9, thickness: 2, ior: 1.33, attenuationColor: new THREE.Color(0xdfeefa), attenuationDistance: 12, transparent: true, opacity: 0.85 });
      var water = new THREE.Mesh(new THREE.BoxGeometry(2 * A - 0.1, 1, D - 0.1), waterMat);
      var cx = cm(T.cyl), cr = cm(T.cylA), cyl = new THREE.Mesh(new THREE.CylinderGeometry(cr, cr, cm(T.mouth - T.cylTop), 24, 1, true), glass);
      cyl.position.set(cx, cm(-(T.mouth + T.cylTop) / 2), 0); cyl.renderOrder = 2;
      var cap = new THREE.Mesh(new THREE.CircleGeometry(cr, 24).rotateX(-Math.PI / 2), glass); cap.position.set(cx, cm(-T.cylTop), 0);
      var column = new THREE.Mesh(new THREE.CylinderGeometry(cr - 0.03, cr - 0.03, 1, 20), waterMat);
      var gas = new THREE.Mesh(new THREE.CylinderGeometry(cr - 0.03, cr - 0.03, 1, 20), new THREE.MeshBasicMaterial({ color: 0xeef4f9, transparent: true, opacity: 0.35, depthWrite: false }));
      var bridge = new THREE.Mesh(new THREE.BoxGeometry(2 * cr + 1, 0.2, 3), fx.matte(0x8b949e, 0.5)); bridge.position.set(cx, cm(-T.mouth) - 0.1, 0);
      var px = cm(T.pipe), elbow = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([new THREE.Vector3(px, cm(34), 0), new THREE.Vector3(px, cm(10), 0),
        new THREE.Vector3(px + 0.3, cm(6), 0), new THREE.Vector3(cx - 0.3, cm(6), 0), new THREE.Vector3(cx, cm(8), 0), new THREE.Vector3(cx, cm(-T.mouth) + 0.4, 0)]), 30, 0.12, 8, false), glass);
      var tag = kit.label(0.75), held = kit.label(0.75);
      group.add(walls, water, cyl, cap, column, gas, bridge, elbow, tag, held);
      group.userData = { body: walls, water: water, waterMat: waterMat, column: column, gas: gas, tag: tag, held: held };
      return group;
    },
    update: function (group, d, kit) {
      var u = group.userData, w = d.data, T = S.trough, level = cm(-S.troughSurface(w)), cx = cm(T.cyl), top = cm(-T.cylTop) - 0.05, mouth = cm(-T.mouth);
      var g = Math.min(1, (w.caught || 0) / L.parts.trough.collect) * (top - mouth - 0.1), wet = w.ml > 0.005;
      u.water.visible = wet;
      if (wet) { u.water.scale.y = Math.max(0.01, level - 0.06); u.water.position.y = 0.06 + u.water.scale.y / 2; u.waterMat.attenuationColor.copy(fx.color(w.color.rgb)).lerp(new THREE.Color(0xffffff), 0.3); }
      u.column.visible = wet && top - g - mouth > 0.02;
      if (u.column.visible) { u.column.scale.y = top - g - mouth; u.column.position.set(cx, mouth + u.column.scale.y / 2, 0); }
      u.gas.visible = g > 0.02;
      if (u.gas.visible) { u.gas.scale.y = g; u.gas.position.set(cx, top - g / 2, 0); }
      u.tag.userData.write(String(d.ctx.no || " ") + (d.ctx.numbers && w.ml > 0.005 ? " · " + L.num(w.ml, 0, d.ctx.lang) + " mL" : ""));
      u.tag.position.set(0, 0.15 - kit.up(d.lift), 6);
      u.held.visible = !!d.ctx.numbers && (w.caught || 0) > 0.05;
      if (u.held.visible) { u.held.userData.write(L.num(w.caught, 1, d.ctx.lang) + " mL"); u.held.position.set(cx, top + 0.4, 0); }
    }
  });

  // ------------------------------------------------------------------ Tropftrichter und Büchnertrichter

  L.registerLook("dropfunnel", "lab", {
    build: function (kit) {
      var group = new THREE.Group(), tag = kit.label(0.75);
      var liquid = new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.04, transmission: 1, thickness: 0.6, ior: 1.33, attenuationColor: new THREE.Color(0xffffff), attenuationDistance: 2 });
      var column = new THREE.Mesh(new THREE.CylinderGeometry(cm(S.drop.a - 2), cm(S.drop.a - 2), 1, 24), liquid);
      var cock = new THREE.Group(), grip = new THREE.Mesh(new THREE.BoxGeometry(cm(4), cm(16), cm(3)), fx.matte(0x2f6fb0, 0.45));
      cock.add(new THREE.Mesh(new THREE.CylinderGeometry(cm(3.5), cm(3.5), cm(14), 16).rotateZ(Math.PI / 2), fx.glass()), grip,
        new THREE.Mesh(new THREE.CylinderGeometry(cm(3), cm(3), cm(3), 12).rotateZ(Math.PI / 2).translate(-cm(8.5), 0, 0), fx.matte(0x8b949e, 0.5)));
      var flow = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 1, 8, 1, true), new THREE.MeshPhysicalMaterial({ color: 0xdfeefa, roughness: 0.05, transparent: true, opacity: 0.6, depthWrite: false }));
      group.add(column, cock, flow, tag);
      group.userData = { column: column, liquid: liquid, cock: cock, grip: grip, flow: flow, tag: tag };
      return group;
    },
    update: function (group, d, kit) {
      var u = group.userData, w = d.data, g = S.dropAt(d.hang), x = cm(g.x), a = cm(S.drop.a), top = cm(-g.top), bottom = cm(-g.bottom), tip = cm(-g.tip), open = w.tap > 0;
      var level = cm(-L.parts.dropfunnel.surface(w, d.hang)), floor = -kit.up(d.lift), rod = cm(g.rod);
      u.body = fx.rebuild(group, "glass", [g.x, g.top, g.rim, g.rod, d.lift].join("|"), function (sub) {
        var glass = fx.glass(), pts = [[cm(2), bottom], [a, bottom + cm(11)], [a, top - cm(4)], [cm(6), top], [cm(6), top + cm(8)]];
        var body = new THREE.Mesh(fx.lathe(pts.map(function (p) { return [p[0], p[1]]; }), 32), glass);
        body.position.x = x; body.renderOrder = 2;
        var stem = new THREE.Mesh(new THREE.CylinderGeometry(cm(2.2), cm(1.4), bottom - tip, 12, 1, true), glass);
        stem.position.set(x, (bottom + tip) / 2, 0); stem.renderOrder = 2;
        var stopper = new THREE.Mesh(new THREE.CylinderGeometry(cm(6), cm(5), cm(11), 16), fx.matte(0x4a4d52, 0.8));
        stopper.position.set(x, top + cm(12), 0);
        sub.add(body, stem, stopper);
        fx.stand(sub, rod, fx.STAND.z, floor, top + cm(14), [{ y: top - cm(24), x: x, r: a }]);
      });
      u.column.visible = w.ml > 0.005;
      if (u.column.visible) {
        u.column.scale.y = Math.max(0.01, level - bottom - cm(10)); u.column.position.set(x, bottom + cm(10) + u.column.scale.y / 2, 0);
        u.liquid.color.copy(fx.color(w.color.rgb)); u.liquid.attenuationColor.copy(fx.color(w.color.rgb));
      }
      u.cock.position.set(x, cm(-g.cock), 0);
      u.grip.rotation.set(open ? 0 : Math.PI / 2, 0, 0); u.grip.position.set(cm(10), 0, 0);
      var y = d.hang ? cm(-g.surface) : 0;
      u.flow.visible = open && w.ml > 0.001 && !!d.hang;
      if (u.flow.visible) { u.flow.scale.set(w.tap >= 0.3 ? 0.05 : 0.02, tip - y, w.tap >= 0.3 ? 0.05 : 0.02); u.flow.position.set(x, (tip + y) / 2, 0); }
      u.tag.userData.write(d.hang ? " " : String(d.ctx.no || " "));
      u.tag.visible = !d.hang;
      u.tag.position.set(x, floor + 0.15, 1.6);
    }
  });

  L.registerLook("buchner", "lab", {
    build: function (kit) {
      var group = new THREE.Group(), B = S.buchner, a = cm(B.a), h = cm(B.h);
      var porcelain = new THREE.MeshPhysicalMaterial({ color: 0xf5f3ee, roughness: 0.25, clearcoat: 0.7, clearcoatRoughness: 0.15, side: THREE.DoubleSide });
      var bowl = new THREE.Mesh(fx.lathe([[cm(5), -cm(8)], [a - 0.2, -cm(8)], [a, -cm(6)], [a + 0.05, h], [a - 0.1, h], [a - 0.15, 0], [cm(5), 0]], 40), porcelain);
      var plate = new THREE.Mesh(new THREE.CylinderGeometry(a - 0.15, a - 0.15, 0.06, 32), fx.matte(0xe9e5dc, 0.7));
      var paper = new THREE.Mesh(new THREE.CylinderGeometry(a - 0.2, a - 0.2, 0.02, 32), fx.matte(0xfbfbf6, 0.95));
      paper.position.y = 0.05;
      var stem = new THREE.Mesh(new THREE.CylinderGeometry(cm(5), cm(4), 1, 16, 1, true), porcelain);
      var cone = new THREE.Mesh(new THREE.CylinderGeometry(cm(11), cm(8), cm(14), 20), fx.matte(0x9c3d24, 0.8));
      var liquid = new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.04, transmission: 1, thickness: 0.5, ior: 1.33, attenuationColor: new THREE.Color(0xffffff), attenuationDistance: 2 });
      var fill = new THREE.Mesh(new THREE.CylinderGeometry(a - 0.2, a - 0.2, 1, 32), liquid), cake = new THREE.Mesh(new THREE.CylinderGeometry(a - 0.2, a - 0.2, 1, 32), fx.matte(0x888888, 0.9));
      var flow = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1, 8, 1, true), new THREE.MeshPhysicalMaterial({ color: 0xdfeefa, roughness: 0.05, transparent: true, opacity: 0.6, depthWrite: false }));
      [bowl, cone].forEach(function (o) { o.castShadow = true; });
      var top = new THREE.Group();
      top.add(bowl, plate, paper, fill, cake);
      group.add(top, stem, cone, flow);
      group.userData = { body: top, top: top, stem: stem, cone: cone, fill: fill, liquid: liquid, cake: cake, paper: paper, flow: flow };
      return group;
    },
    update: function (group, d) {
      var u = group.userData, w = d.data, g = S.buchAt(d.hang), x = cm(g.x), plate = cm(-g.plate), tip = cm(-g.tip), level = cm(-L.parts.buchner.surface(w, d.hang)), sed = w.sediment, c;
      u.top.position.set(x, plate, 0);
      u.stem.scale.y = plate - cm(8) - tip; u.stem.position.set(x, (plate - cm(8) + tip) / 2, 0);
      u.cone.position.set(x, cm(-g.rim) + cm(1), 0);
      u.fill.visible = w.ml > 0.005;
      if (u.fill.visible) { u.fill.scale.y = Math.max(0.01, level - plate - 0.06); u.fill.position.y = 0.06 + u.fill.scale.y / 2; u.liquid.color.copy(fx.color(w.color.rgb)); u.liquid.attenuationColor.copy(fx.color(w.color.rgb)); }
      u.cake.visible = !!(sed && sed.ml > 0.002);
      if (u.cake.visible) { c = Math.max(0.12, Math.min(cm(S.buchner.h - 8), cm(sed.ml * 3))); u.cake.scale.y = c; u.cake.position.y = 0.06 + c / 2; u.cake.material.color.copy(fx.color(sed.rgb)); }
      var y = d.hang ? cm(-g.surface) : 0;
      u.flow.visible = w.ml > 0.001 && !!d.hang && !w.blocked;
      if (u.flow.visible) { u.flow.scale.y = tip - y; u.flow.position.set(x, (tip + y) / 2, 0); }
    }
  });

  // ------------------------------------------------------------------ Kalorimeter

  // Styroporbecher mit Deckelring: durchscheinend, damit man den Inhalt noch ahnt. Innen eine dünne Wand (sie trägt den Boden,
  // der nicht unter die Tischplatte reichen darf), außen ein Kegel wie in 2D: oben dick, unten schmal
  function foam() { var m = fx.matte(0xf4f3ee, 0.95); m.transparent = true; m.opacity = 0.55; m.side = THREE.DoubleSide; return m; }
  L.registerLook("calorimeter", "lab", vessel({
    thick: 0.1, lip: 0.06,
    shape: function (d) { var shape = beakerShape(d); shape.id = "calorimeter" + shape.size[0]; return shape; },
    material: foam,
    level: function (w) { return w.ml > 0.005 ? cm(-L.parts.calorimeter.surface(w)) : cm(2); },
    extra: function (group, kit, d, shape) {
      var r = shape.inner(shape.rim), lid = new THREE.Mesh(new THREE.RingGeometry(r * 0.62, r + 0.7, 40).rotateX(-Math.PI / 2), fx.matte(0xe9e7df, 0.95));
      var cone = new THREE.Mesh(new THREE.CylinderGeometry(r + 0.7, r + 0.3, shape.rim, 40, 1, true), foam());
      cone.position.y = shape.rim / 2;
      cone.renderOrder = 2;
      group.add(cone);
      lid.material.side = THREE.DoubleSide;
      lid.position.y = shape.rim + 0.07;
      lid.castShadow = true;
      group.add(lid);
    }
  }));

  // ------------------------------------------------------------------ Messzylinder

  function cylShape(d) {
    var s = S.cylinder[d.data.size || d.data.cap] || S.cylinder[100], r = cm(s[0] / 2 - 2);
    return { id: "cylinder" + s[0], floor: cm(S.cylFoot + 2), rim: cm(s[1] + S.cylFoot), size: s, inner: function () { return r; } };
  }

  var cylinderLook = vessel({
    tall: true, thick: 0.05, lip: 0.06,
    shape: cylShape,
    level: function (w) { return w.ml > 0.005 ? cm(-L.parts.cylinder.surface(w)) : cm(S.cylFoot + 2); },
    // der sechseckige Fuß
    extra: function (group, kit, d, shape) {
      var foot = new THREE.Mesh(new THREE.CylinderGeometry(cm(shape.size[0] / 2 + 10), cm(shape.size[0] / 2 + 10), cm(S.cylFoot), 6), fx.glass());
      foot.position.y = cm(S.cylFoot) / 2;
      foot.renderOrder = 2;
      group.add(foot);
      group.userData.marks = null;
    },
    // Skala: kleine Striche, an den großen die Zahl, wenn Zahlen gezeigt werden
    refresh: function (group, d, shape) {
      var u = group.userData, key = shape.id + (d.ctx.numbers ? "#" : ""), s = shape.size, cap = d.data.cap, list = [], ml, major;
      if (u.marksKey === key) return;
      u.marksKey = key;
      if (u.marks) { group.remove(u.marks); u.marks.geometry.dispose(); u.marks.material.map.dispose(); u.marks.material.dispose(); u.marks = null; }
      if (fx.style.marks == null || !s[2]) return;            // der Standzylinder hat keine Skala
      // in 3D die genormte Teilung (ISO 4788, Tabelle 1); eigene Größen ohne Angabe behalten ihre alte Einteilung
      if (s[4]) list = L.graduation(cap, s[4]).map(function (m) {
        return { y: cm(S.cylFoot + 2 + m.v / cap * (s[1] - 14)), kind: m.kind, text: d.ctx.numbers && m.figure ? L.trim(m.v, d.ctx.lang) : "" };
      });
      else for (ml = s[2]; ml <= cap + 1e-9; ml += s[2]) {
        major = Math.abs(ml / s[3] - Math.round(ml / s[3])) < 1e-6;
        list.push({ y: cm(S.cylFoot + 2 + ml / cap * (s[1] - 14)), long: major, text: d.ctx.numbers && major ? String(Math.round(ml * 10) / 10) : "" });
      }
      u.marks = scale(cm(s[0] / 2) + 0.012, shape.rim, list, 1);
      u.marks.position.y = shape.rim / 2;
      u.marks.renderOrder = 3;
      group.add(u.marks);
    }
  });
  L.registerLook("cylinder", "lab", cylinderLook);
  L.registerLook("jar", "lab", cylinderLook);              // der Standzylinder: dieselbe Form, ohne Skala

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

  var steel = function () { return fx.steel(); };

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
      var foot = new THREE.Mesh(new THREE.BoxGeometry(fx.STAND.w, fx.STAND.h, fx.STAND.d), fx.matte(0x3a3f45, 0.5, 0.3));
      var rod = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 1, 12), m);
      var arm1 = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 1, 8).rotateZ(Math.PI / 2), m), arm2 = arm1.clone();
      var flow = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 1, 8, 1, true), new THREE.MeshPhysicalMaterial({ color: 0xdfeefa, roughness: 0.05, transparent: true, opacity: 0.6, depthWrite: false }));
      var drops = new THREE.InstancedMesh(new THREE.SphereGeometry(cm(1.6), 10, 8), flow.material, 3);
      drops.frustumCulled = false;                             // count wechselt: nah herangezoomt fehlten sonst die Tropfen
      var tag = kit.label(0.75);
      // Schellbachstreifen (ISO 385, 7): weiße Emaille auf der Rückwand, in der Mitte ein blauer Streifen; höchstens 40 % des Umfangs
      var schellbach = new THREE.Group();
      schellbach.add(new THREE.Mesh(new THREE.CylinderGeometry(cm(5.8), cm(5.8), 1, 12, 1, true, Math.PI - 1.2, 2.4), new THREE.MeshStandardMaterial({ color: 0xfbfbf7, roughness: 0.5, side: THREE.DoubleSide })),
        new THREE.Mesh(new THREE.CylinderGeometry(cm(5.7), cm(5.7), 1, 6, 1, true, Math.PI - 0.16, 0.32), new THREE.MeshStandardMaterial({ color: 0x1f5aa6, roughness: 0.5, side: THREE.DoubleSide })));
      glass.renderOrder = tip.renderOrder = body.renderOrder = 2;
      // Doppelmuffen, an denen die Klemmen an der Stange sitzen
      var boss1 = new THREE.Mesh(new THREE.BoxGeometry(1.3, 1.3, 1.3), fx.matte(0x4f5760, 0.45, 0.4)), boss2 = boss1.clone();
      // Bürettenklemme: Backen, die das Rohr umfassen (wie Stativ.svg auf Wikimedia Commons und in Chemix)
      var jaw1 = new THREE.Mesh(new THREE.TorusGeometry(cm(8), 0.13, 8, 24).rotateX(Math.PI / 2), fx.matte(0x3a3f45, 0.5, 0.3)), jaw2 = jaw1.clone();
      [foot, rod, arm1, arm2, grip, boss1, boss2].forEach(function (o) { o.castShadow = true; });
      cock.add(body, grip, new THREE.Mesh(new THREE.CylinderGeometry(cm(3), cm(3), cm(3), 12).rotateZ(Math.PI / 2).translate(-cm(8.5), 0, 0), fx.matte(0x8b949e, 0.5)));
      stand.add(foot, rod, arm1, arm2, boss1, boss2, jaw1, jaw2);
      group.add(schellbach, column, neck, glass, tip, cock, stand, flow, drops, tag);
      group.userData = { body: glass, glass: glass, tip: tip, column: column, neck: neck, liquid: liquid, cock: cock, grip: grip, foot: foot, rod: rod, arm1: arm1, arm2: arm2, boss1: boss1, boss2: boss2, jaw1: jaw1, jaw2: jaw2, flow: flow, drops: drops, tag: tag, schellbach: schellbach, marksKey: null };
      return group;
    },
    update: function (group, d, kit) {
      var u = group.userData, w = d.data, g = S.buretteAt(d.hang), x = cm(g.x), low = cm(-g.low), high = cm(-g.high), tipY = cm(-g.tip);
      var level = cm(-L.parts.burette.surface(w, d.hang)), open = w.tap > 0, rod = cm(g.rod), Z = fx.STAND.z, t = d.ctx.still ? 0 : d.ctx.t, k, y, p, B = S.burette, floor;
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
      // Griff rechts am Küken (ISO 4800, 5.3): längs zum Rohr offen, quer (zum Betrachter) zu
      u.grip.rotation.set(open ? 0 : Math.PI / 2, 0, 0);
      u.grip.position.set(cm(10), 0, 0);
      // Stativ: Fuß und Stange hinter der Reihe der Geräte, zwei Klemmen nach vorn zur Bürette
      // steht das Gefäß darunter gehoben (Dreifuß, Wasserbad), reicht das Stativ trotzdem bis auf den Tisch
      floor = -kit.up(d.lift);
      fx.placeFoot(u.foot, rod, Z, x, floor + fx.STAND.h / 2);
      u.rod.scale.y = cm(-(g.high + 24)) - floor; u.rod.position.set(rod, floor + u.rod.scale.y / 2, Z);
      [[u.arm1, cm(-(g.high + 60)), u.boss1, u.jaw1], [u.arm2, cm(-(g.low - 30)), u.boss2, u.jaw2]].forEach(function (a) {
        var dx = x - rod, len = Math.sqrt(dx * dx + Z * Z);
        a[0].scale.set(len, 1, 1);
        a[0].position.set((x + rod) / 2, a[1], Z / 2);
        a[0].rotation.y = Math.atan2(Z, dx);
        a[2].position.set(rod, a[1], Z);
        a[3].position.set(x, a[1], 0);
      });
      // Skala nach ISO 384 mit der genormten Teilung 0,1 mL (ISO 385): jeder Milliliter ein langer Strich mit Ziffer, wenn Zahlen gezeigt werden
      if (u.marksKey !== (d.ctx.numbers ? "#" : "")) {
        u.marksKey = d.ctx.numbers ? "#" : "";
        if (u.marks) { group.remove(u.marks); u.marks.geometry.dispose(); u.marks.material.map.dispose(); u.marks.material.dispose(); }
        var list = L.graduation(B.cap, B.division || 1, null, null, true).map(function (m) {
          return { y: cm(B.length) * (1 - m.v / B.cap), kind: m.kind, text: d.ctx.numbers && m.figure ? String(Math.round(m.v)) : "" };
        });
        u.marks = scale(cm(6) + 0.01, cm(B.length), list);
        u.marks.renderOrder = 3;
        group.add(u.marks);
      }
      u.marks.position.set(x, low + cm(B.length) / 2, 0);
      // Schellbachstreifen an der Rückwand, so hoch wie das Glas
      u.schellbach.scale.y = u.glass.scale.y; u.schellbach.position.copy(u.glass.position);
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

  // ------------------------------------------------------------------ Scheidetrichter

  // Ein Kegel aus Glas, Spitze unten, mit Stopfen; darunter Auslauf und Hahn, daneben das Stativ wie bei der Bürette.
  // Der Inhalt ist derselbe wie in jedem Glas (fx.contents): Schichten, Trübung, Tropfen und die Strömungsansicht.
  L.registerLook("separator", "lab", {
    build: function (kit, d) {
      var group = new THREE.Group(), body = new THREE.Group(), m = steel();
      var inside = fx.contents(kit, d.ctx.seed || 1), tag = kit.label(0.75);
      var stopper = new THREE.Mesh(new THREE.CylinderGeometry(cm(5), cm(4), cm(10), 16), fx.matte(0xb5523a, 0.7));
      var stem = new THREE.Mesh(new THREE.CylinderGeometry(cm(2), cm(1), 1, 12, 1, true), fx.glass());
      var cock = new THREE.Group(), barrel = new THREE.Mesh(new THREE.CylinderGeometry(cm(3.5), cm(3.5), cm(14), 16).rotateZ(Math.PI / 2), fx.glass());
      var grip = new THREE.Mesh(new THREE.BoxGeometry(cm(4), cm(16), cm(3)), fx.matte(0x2f6fb0, 0.45));
      var foot = new THREE.Mesh(new THREE.BoxGeometry(fx.STAND.w, fx.STAND.h, fx.STAND.d), fx.matte(0x3a3f45, 0.5, 0.3));
      var rod = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 1, 12), m), ring = new THREE.Mesh(new THREE.TorusGeometry(1, 0.06, 8, 32).rotateX(Math.PI / 2), m);
      var arm = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 1, 8).rotateZ(Math.PI / 2), m);
      var flow = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 1, 8, 1, true), new THREE.MeshPhysicalMaterial({ color: 0xdfeefa, roughness: 0.05, transparent: true, opacity: 0.6, depthWrite: false }));
      cock.add(barrel, grip, new THREE.Mesh(new THREE.CylinderGeometry(cm(3), cm(3), cm(3), 12).rotateZ(Math.PI / 2).translate(-cm(8.5), 0, 0), fx.matte(0x8b949e, 0.5)));
      [foot, rod, arm, grip].forEach(function (o) { o.castShadow = true; });
      body.add(inside.group, stopper, stem, cock);
      group.add(body, foot, rod, ring, arm, flow, tag);
      group.userData = { body: body, inside: inside, stopper: stopper, stem: stem, cock: cock, grip: grip, foot: foot, rod: rod, ring: ring, arm: arm, flow: flow, tag: tag, key: null };
      return group;
    },
    update: function (group, d, kit) {
      var u = group.userData, w = d.data, g = S.separatorAt(d.hang), P = S.separator, x = cm(g.x), floor = cm(-g.bottom), rim = cm(-g.top), Z = fx.STAND.z;
      var neck = cm(P.neck), wide = cm(P.wide), shape = { id: "separator" + floor.toFixed(2), floor: floor, rim: rim, steps: 12,
        inner: function (y) { return neck + (wide - neck) * Math.max(0, Math.min(1, (y - floor) / (rim - floor))); } };
      var level = cm(-L.parts.separator.surface(w, d.hang)), lower = w.oil ? (w.oil.top ? w.ml - w.oil.ml : w.oil.ml) : 0, open = w.tap > 0, tip = cm(-g.tip), y, t = d.ctx.still ? 0 : d.ctx.t;
      if (u.key !== shape.id) {                      // das Glas folgt der Höhe, in der er hängt
        u.key = shape.id;
        if (u.glass) { u.body.remove(u.glass); u.glass.geometry.dispose(); }
        u.glass = new THREE.Mesh(fx.wall(shape, 0.06, 0.04), fx.glass());
        u.glass.renderOrder = 2;
        u.body.add(u.glass);
      }
      u.body.position.set(x, 0, 0);
      u.inside.update(w, shape, w.ml > 0.005 ? level : floor, d.ctx, true, null,
        w.oil && lower > 0.005 && w.oil.ml > 0.005 ? cm(-L.parts.separator.surface(Object.assign({}, w, { ml: lower }), d.hang)) : null);
      u.stopper.position.set(0, rim + cm(6), 0);
      u.stem.scale.y = floor - tip; u.stem.position.set(0, (floor + tip) / 2, 0);
      u.cock.position.set(0, cm(-g.cock), 0);
      // Griff rechts am Küken (ISO 4800, 5.3): längs zum Rohr offen, quer (zum Betrachter) zu
      u.grip.rotation.set(open ? 0 : Math.PI / 2, 0, 0);
      u.grip.position.set(cm(10), 0, 0);
      // Stativ mit Ring um den Trichter
      var base = -kit.up(d.lift), rodX = cm(g.rod), ringY = rim - (rim - floor) * 0.35, dx = x - rodX, len;
      fx.placeFoot(u.foot, rodX, Z, x, base + fx.STAND.h / 2);
      u.rod.scale.y = rim + 1 - base; u.rod.position.set(rodX, base + u.rod.scale.y / 2, Z);
      u.ring.scale.setScalar(wide * 0.75 + 0.1); u.ring.position.set(x, ringY, 0);
      len = Math.sqrt(dx * dx + Z * Z);
      u.arm.scale.set(len, 1, 1); u.arm.position.set((x + rodX) / 2, ringY, Z / 2); u.arm.rotation.y = Math.atan2(Z, dx);
      // Strahl zum Gefäß darunter
      y = d.hang ? cm(-g.surface) : 0;
      u.flow.visible = open && w.ml > 0.001 && !!d.hang;
      if (u.flow.visible) { u.flow.scale.set(w.tap >= 0.3 ? 0.05 : 0.025, tip - y, w.tap >= 0.3 ? 0.05 : 0.025); u.flow.position.set(x + 0.01 * Math.sin(t * 40), (tip + y) / 2, 0); }
      u.tag.userData.write(d.hang ? " " : String(d.ctx.no || " "));
      u.tag.visible = !d.hang;
      u.tag.position.set(x, base + 0.15, 1.6);
    }
  });

  // ------------------------------------------------------------------ Trichter mit Filterpapier

  // Kegel mit der Spitze unten im Ursprung, Höhe 1 und oberer Radius r: so lassen sich Papier, Füllung und Rückstand gleich skalieren
  function cone(r, open) { return new THREE.CylinderGeometry(r, 0.002, 1, 32, 1, !!open).translate(0, 0.5, 0); }

  var RING = 0.66;                // Höhe des Trichterrings als Anteil der Kegelhöhe

  L.registerLook("funnel", "lab", {
    build: function (kit, d) {
      var group = new THREE.Group(), U = S.funnel, H = cm(U.h), R = cm(U.a);
      var glass = new THREE.Mesh(cone(R, true), fx.glass()), stem = new THREE.Mesh(new THREE.CylinderGeometry(cm(3), cm(2.5), 1, 12, 1, true), fx.glass());
      // das Filterpapier endet knapp unter dem Glasrand (sonst sieht man vom Trichter nur Papier); der Rand des Glases ist ein dünner Wulst
      var paper = new THREE.Mesh(cone(R * 0.97, true), fx.matte(0xfbfbf6, 0.95));
      var lip = new THREE.Mesh(new THREE.TorusGeometry(R, 0.05, 8, 40).rotateX(Math.PI / 2), new THREE.MeshPhysicalMaterial({ color: 0xd5dee6, roughness: 0.1, transparent: true, opacity: 0.8 }));
      var liquid = new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.04, transmission: 1, thickness: 0.5, ior: 1.33, attenuationColor: new THREE.Color(0xffffff), attenuationDistance: 2 });
      var fill = new THREE.Mesh(cone(R * 0.9), liquid), rest = new THREE.Mesh(cone(R * 0.9), fx.matte(0x888888, 0.9));
      var m = steel(), foot = new THREE.Mesh(new THREE.BoxGeometry(fx.STAND.w, fx.STAND.h, fx.STAND.d), fx.matte(0x3a3f45, 0.5, 0.3));
      var rod = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 1, 12), m), arm = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 1, 8).rotateZ(Math.PI / 2), m);
      // der Trichterring trägt den Kegel dort, wo dessen Außenseite so weit ist wie der Ring (bei zwei Dritteln der Höhe)
      var ring = new THREE.Mesh(new THREE.TorusGeometry(R * RING + 0.1, 0.08, 8, 32).rotateX(Math.PI / 2), m);
      var drops = new THREE.InstancedMesh(new THREE.SphereGeometry(cm(1.6), 10, 8), new THREE.MeshPhysicalMaterial({ color: 0xdfeefa, roughness: 0.05, transparent: true, opacity: 0.6, depthWrite: false }), 3);
      drops.frustumCulled = false;                             // count wechselt: nah herangezoomt fehlten sonst die Tropfen
      var tag = kit.label(0.75);
      paper.material.side = THREE.DoubleSide;
      glass.renderOrder = stem.renderOrder = 2;
      [foot, rod, arm, ring].forEach(function (o) { o.castShadow = true; });
      glass.scale.y = H;
      paper.scale.set(0.86, 0.86 * H, 0.86);
      lip.position.y = 1;                                    // oben am Kegel: das Glas ist in der Höhe auf H gestreckt
      glass.add(lip);
      lip.scale.y = 1 / H;                                   // der Wulst hängt am Glas, das in der Höhe gestreckt ist
      group.add(paper, fill, rest, glass, stem, foot, rod, arm, ring, drops, tag);
      group.userData = { body: glass, glass: glass, stem: stem, fill: fill, rest: rest, paper: paper, liquid: liquid, foot: foot, rod: rod, arm: arm, ring: ring, drops: drops, tag: tag };
      return group;
    },
    update: function (group, d, kit) {
      var u = group.userData, w = d.data, U = S.funnel, g = S.funnelAt(d.hang), x = cm(g.x), apex = cm(-g.apex), top = cm(-g.top), tipY = cm(-g.tip), H = cm(U.h);
      var level = cm(-L.parts.funnel.surface(w, d.hang)), rod = cm(g.rod), Z = fx.STAND.z, t = d.ctx.still ? 0 : d.ctx.t, floor = -kit.up(d.lift), k, p, y, sed = w.sediment, h;
      u.glass.position.set(x, apex, 0); u.paper.position.set(x, apex + 0.04, 0);
      u.stem.scale.y = apex - tipY; u.stem.position.set(x, (apex + tipY) / 2, 0);
      u.fill.visible = w.ml > 0.005;
      if (u.fill.visible) {
        h = Math.max(0.001, level - apex);
        u.fill.scale.set(h / H, h, h / H); u.fill.position.set(x, apex + 0.05, 0);
        u.liquid.color.copy(fx.color(w.color.rgb)); u.liquid.attenuationColor.copy(fx.color(w.color.rgb));
      }
      // der Rückstand im Filter, in seiner Farbe
      u.rest.visible = !!(sed && sed.ml > 0.002);
      if (u.rest.visible) {
        h = Math.max(cm(10), H * 0.7 * Math.pow(Math.min(1, sed.ml / U.cap * 8), 1 / 3));
        u.rest.scale.set(h / H, h, h / H); u.rest.position.set(x, apex + 0.06, 0);
        u.rest.material.color.copy(fx.color(sed.rgb));
      }
      // das Papier nimmt die Farbe des Rückstands an
      u.paper.material.color.copy(fx.color(u.rest.visible ? sed.rgb.map(function (c) { return Math.round(c + (255 - c) * 0.55); }) : [251, 251, 246]));
      // Stativ hinter der Reihe der Geräte, ein Ring hält den Trichter
      fx.placeFoot(u.foot, rod, Z, x, floor + fx.STAND.h / 2);
      u.rod.scale.y = top + cm(16) - floor; u.rod.position.set(rod, floor + u.rod.scale.y / 2, Z);
      u.ring.position.set(x, apex + RING * H, 0);
      // der Arm endet am Ring, nicht in der Mitte des Trichters
      var R = cm(U.a) * RING + 0.1, ex = x + R * (rod - x) / Math.sqrt((rod - x) * (rod - x) + Z * Z), ez = R * Z / Math.sqrt((rod - x) * (rod - x) + Z * Z);
      var dx = ex - rod, dz = ez - Z, len = Math.sqrt(dx * dx + dz * dz);
      u.arm.scale.set(len, 1, 1); u.arm.position.set((ex + rod) / 2, apex + RING * H, (ez + Z) / 2); u.arm.rotation.y = Math.atan2(-dz, dx);
      // das Filtrat tropft ins Gefäß darunter
      y = d.hang ? cm(-g.surface) : 0;
      u.drops.count = w.ml > 0.001 && d.hang && !w.blocked ? 3 : 0;
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

  // ------------------------------------------------------------------ Rundkolben

  // Kugel mit Hals, rechts am Hals das Ansatzrohr für den Kühler (wie in 2D immer rechts); ohne Dreifuß auf einem Korkring
  var F = S.flask, flaskR = cm(F.R - 1), flaskCY = cm(4 + F.R), neckR = cm(F.neck - 0.5);
  var flaskShape = {
    id: "flask", floor: flaskCY - flaskR, rim: cm(-F.rim), front: cm(F.R), steps: 64,
    inner: function (y) {
      var dy = y - flaskCY, r = Math.sqrt(Math.max(0, flaskR * flaskR - dy * dy));
      return dy > 0 ? Math.max(neckR, r) : r;
    }
  };

  L.registerLook("flask", "lab", vessel({
    tall: true, thick: 0.06, lip: 0.06,
    shape: function () { return flaskShape; },
    level: function (w) { return w.ml > 0.005 ? cm(-L.parts.flask.surface(w)) : flaskShape.floor; },
    extra: function (group) {
      var a = new THREE.Vector3(cm(F.neck) - 0.1, cm(-F.arm), 0), b = new THREE.Vector3(cm(F.neck + 12), cm(-(F.arm + 4)), 0);
      var arm = new THREE.Mesh(new THREE.CylinderGeometry(cm(3), cm(3), a.distanceTo(b), 16, 1, true), fx.glass());
      arm.position.copy(a).add(b).multiplyScalar(0.5);
      arm.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize());
      arm.renderOrder = 2;
      var cork = new THREE.Mesh(new THREE.TorusGeometry(cm(13), cm(3), 10, 32).rotateX(Math.PI / 2), fx.matte(0xb58b5c, 0.9));
      cork.position.y = cm(3);
      cork.castShadow = cork.receiveShadow = true;
      // Kegelschliff oben am Hals: mattes Glas wie in 2D
      var ground = new THREE.Mesh(new THREE.CylinderGeometry(cm(F.neck) + 0.02, cm(F.neck) + 0.02, cm(9), 24, 1, true),
        new THREE.MeshStandardMaterial({ color: 0xe8edf1, roughness: 1, transparent: true, opacity: 0.6, depthWrite: false, side: THREE.DoubleSide }));
      ground.position.y = cm(-F.rim) - cm(4.5);
      ground.renderOrder = 3;
      group.add(arm, cork, ground);
      group.userData.cork = cork;
    },
    refresh: function (group, d) { group.userData.cork.visible = !d.lift; }
  }));

  // ------------------------------------------------------------------ Messkolben

  // Birnenförmiger Körper mit langem, engem Hals, dasselbe Profil wie in 2D (S.volflaskHalf); ein Ring am Hals ist der Eichstrich
  var V = S.volflask, vfNeck = cm(V.neck - 0.5);
  var vfShape = {
    id: "volflask", floor: cm(5), rim: cm(-V.rim), front: cm(V.R), steps: 72,
    inner: function (y) {
      var h = y * PX - 4;
      return h >= V.body ? vfNeck : Math.max(vfNeck, cm(S.volflaskHalf(Math.max(0, h)) - 1));
    }
  };
  L.registerLook("volflask", "lab", vessel({
    tall: true, thick: 0.05, lip: 0.05,
    shape: function () { return vfShape; },
    level: function (w) { return w.ml > 0.005 ? cm(-L.parts.volflask.surface(w)) : vfShape.floor; },
    extra: function (group) {
      var mark = new THREE.Mesh(new THREE.TorusGeometry(vfNeck + 0.03, 0.012, 6, 24).rotateX(Math.PI / 2), fx.matte(0x2a2f36, 0.6));
      mark.position.y = cm(-V.mark);
      var cork = new THREE.Mesh(new THREE.TorusGeometry(cm(13), cm(3), 10, 32).rotateX(Math.PI / 2), fx.matte(0xb58b5c, 0.9));
      cork.position.y = cm(3);
      group.add(mark, cork);
      group.userData.cork = cork;
    },
    refresh: function (group, d) { group.userData.cork.visible = !d.lift; }
  }));
})(typeof globalThis !== "undefined" ? globalThis : this);
