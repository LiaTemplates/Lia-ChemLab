/* ChemLab – Looks für das Labor: Wärme und Messen. Brenner, Wasserbad, Thermometer, pH-Meter, Leitfähigkeitsmessgerät,
   Fotometer, Kolbenprober. Klassisches Skript, geladen nach looks-lab.js.
   place (wo ein Gerät im Gefäß steckt oder wie es darunter steht) kommt aus den 2D-Teilen, in Bildpunkten; hier geteilt durch 16.
   Was den Hub betrifft (Höhe des Dreifußes, des Rosts), geht durch kit.up: die Bühne streckt ihn, damit er wie echt aussieht. */
(function (global) {
  "use strict";

  var L = global.LiaChemLab, THREE = L.THREE, fx = L.fx3d, doc = global.document;
  var PX = 16, V = function (x, y, z) { return new THREE.Vector3(x, y, z); };

  function cm(px) { return px / PX; }

  var gauzeTex = {};
  function gauze(ceramic) {         // Drahtnetz, mit Keramikmitte (Dreifuß) oder ohne (Rost im Wasserbad)
    if (gauzeTex[ceramic]) return gauzeTex[ceramic];
    var c = doc.createElement("canvas"), g = c.getContext("2d"), p, tex;
    c.width = c.height = 256;
    g.strokeStyle = "#8d949c"; g.lineWidth = 2;
    for (p = 3; p < 256; p += 7) { g.beginPath(); g.moveTo(p, 0); g.lineTo(p, 256); g.moveTo(0, p); g.lineTo(256, p); g.stroke(); }
    if (ceramic) { g.fillStyle = "#e9e4dc"; g.beginPath(); g.arc(128, 128, 77, 0, 7); g.fill(); }
    tex = gauzeTex[ceramic] = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }

  function mesh(geo, mat, x, y, z) {
    var m = new THREE.Mesh(geo, mat);
    m.position.set(x || 0, y || 0, z || 0);
    m.castShadow = true;
    return m;
  }

  // ------------------------------------------------------------------ Brenner

  // [Höhe außen, Höhe innen, Farbe außen, Farbe innen, Licht, Lichtfarbe]: leuchtend groß, gelb, flackernd; rauschend mit blauem Innenkegel
  var FLAMES = [null, [5.8, 0.9, 0xffa035, 0x3050ff, 140, 0xffa040], [5.4, 2.0, 0x3d6dff, 0x8fd8ff, 40, 0x7aa6ff]];

  function burnerHeight(d, kit) {   // die Flamme soll knapp unter dem Gefäß enden
    return d.place ? Math.min(10, kit.up(d.place.lift) - 5.6) : 10;
  }

  L.registerLook("burner", "lab", {
    build: function (kit) {
      var group = new THREE.Group(), body = new THREE.Group(), steel = fx.steel(), iron = fx.iron();
      var hose = new THREE.CatmullRomCurve3([V(2.4, 1.6, 0), V(3.6, 0.9, 0), V(4.2, 0.35, -3), V(4.5, 0.35, -25)]);
      body.add(mesh(new THREE.CylinderGeometry(3.0, 3.4, 0.9, 40), iron, 0, 0.45),
        mesh(new THREE.CylinderGeometry(0.75, 0.75, 1.3, 24), steel, 0, 2.2),            // Luftregler
        mesh(new THREE.CylinderGeometry(0.3, 0.3, 2.2, 12).rotateZ(Math.PI / 2), steel, 1.4, 1.6),
        mesh(new THREE.TubeGeometry(hose, 40, 0.45, 10), fx.matte(fx.style.hose, 0.6), 0, 0, 0));
      var tube = mesh(new THREE.CylinderGeometry(0.55, 0.55, 1, 24), steel);
      body.add(tube);
      var outer = fx.cone(0.75, 0x3d6dff), inner = fx.cone(0.5, 0x8fd8ff), light = new THREE.PointLight(0x6fa0ff, 0, 0, 2);
      group.add(body, outer, inner, light);
      group.userData = { body: body, tube: tube, outer: outer, inner: inner, light: light, tag: null };
      return group;
    },
    update: function (group, d, kit) {
      var u = group.userData, r = d.data, place = d.place, H = burnerHeight(d, kit), f = FLAMES[r.flame], t = d.ctx.still ? 0 : d.ctx.t, flick;
      u.tube.scale.y = H - 0.9; u.tube.position.y = 0.9 + (H - 0.9) / 2;
      // Dreifuß mit Drahtnetz unter Becherglas und Schale; eine Klemme am Stativ hält das Reagenzglas
      fx.rebuild(group, "stand", place ? JSON.stringify([place.lift, place.foot, place.clamp]) : "", function (sub) {
        var Y, a, k, ang, net;
        if (!place) return;
        Y = kit.up(place.lift);
        if (place.clamp) {
          fx.stand(sub, cm(54), -4, 0, Y + cm(150), [{ y: Y + cm(120), x: 0, r: cm(13) }]);
          return;
        }
        a = cm(place.foot + 10) + 0.4;
        sub.add(mesh(new THREE.TorusGeometry(a, 0.22, 10, 48).rotateX(Math.PI / 2), fx.iron(), 0, Y - 0.32));
        for (k = 0; k < 3; k++) {
          ang = k * Math.PI * 2 / 3 - Math.PI / 2;      // ein Bein hinten, zwei vorn seitlich: keines steht vor dem Brenner
          sub.add(fx.rod(V(a * Math.cos(ang), Y - 0.32, a * Math.sin(ang)), V(a * 1.45 * Math.cos(ang), 0, a * 1.45 * Math.sin(ang)), 0.22, fx.iron()));
        }
        net = new THREE.Mesh(new THREE.PlaneGeometry(2 * a + 1.6, 2 * a + 1.6).rotateX(-Math.PI / 2),
          new THREE.MeshStandardMaterial({ map: gauze(true), alphaTest: 0.5, side: THREE.DoubleSide, metalness: 0.4, roughness: 0.6 }));
        net.position.y = Y - 0.06;
        net.receiveShadow = true;
        sub.add(net);
      });
      u.outer.visible = u.inner.visible = !!f;
      u.light.intensity = f ? f[4] * (0.9 + 0.1 * Math.sin(t * 23)) : 0;
      if (!f) return;
      flick = 1 + (d.ctx.still ? 0 : 0.05 * Math.sin(t * 31) + 0.04 * Math.sin(t * 17.3) + (r.flame === 1 ? 0.08 * Math.sin(t * 9.1) : 0));
      u.outer.position.y = u.inner.position.y = H;
      u.outer.scale.set(r.flame === 1 ? 1.2 : 1, f[0] * flick, r.flame === 1 ? 1.2 : 1);
      u.inner.scale.set(1, f[1] * (2 - flick), 1);
      // Flammenfärbung: ein Salz färbt den äußeren Kegel
      u.outer.material.uniforms.color.value.copy(r.tint ? fx.color(r.tint.rgb) : new THREE.Color(f[2]));
      u.inner.material.uniforms.color.value.set(f[3]);
      u.outer.material.uniforms.strength.value = r.flame === 1 ? 1.4 : 1.3;
      u.light.color.copy(r.tint ? fx.color(r.tint.rgb) : new THREE.Color(f[5]));
      u.light.position.y = H + 2;
    }
  });

  // ------------------------------------------------------------------ Wasserbad

  var BATH = { lift: 30, depth: 50, rim: 12 };       // wie in chemlab-parts.js

  L.registerLook("bath", "lab", {
    build: function (kit, d) {
      var group = new THREE.Group(), screen = fx.screen(2.6, 1.1);
      group.add(screen);
      group.userData = { screen: screen };
      return group;
    },
    update: function (group, d, kit) {
      var u = group.userData, r = d.data, p = d.place || { half: 50, depth: BATH.depth, clamp: false }, a = cm(p.half), deep = Math.min(14, 2 * a);
      // um 1880 eine Wanne aus Kupfer: undurchsichtig, deshalb reicht ihr Rand nur knapp über das Wasser
      var copper = fx.style.tank === "copper", grate = kit.up(BATH.lift), level = grate + cm(p.depth), top = level + (copper ? 0.3 : cm(BATH.rim)), cold = r.temp <= 4;
      u.body = fx.rebuild(group, "tank", [a, level, p.clamp, cold, copper].join("|"), function (sub) {
        var glass = copper ? new THREE.MeshStandardMaterial({ color: 0xb8693a, metalness: 1, roughness: 0.35, side: THREE.DoubleSide }) : fx.glass(), k, wall = function (w, h, x, y, z, ry) {
          var m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), glass);
          m.position.set(x, y, z); m.rotation.y = ry || 0; m.renderOrder = 2; sub.add(m);
        };
        wall(2 * a, top, 0, top / 2, deep / 2); wall(2 * a, top, 0, top / 2, -deep / 2);
        wall(deep, top, -a, top / 2, 0, Math.PI / 2); wall(deep, top, a, top / 2, 0, Math.PI / 2);
        sub.add(mesh(new THREE.BoxGeometry(2 * a, 0.3, deep), fx.matte(0x9aa3ab, 0.4, 0.6), 0, 0.15));
        // Wasser: nur durchscheinend, damit das Gefäß darin mit seiner Flüssigkeit zu sehen bleibt
        var water = new THREE.Mesh(new THREE.BoxGeometry(2 * a - 0.1, level - 0.3, deep - 0.1),
          new THREE.MeshPhysicalMaterial({ color: cold ? 0xd8ecf7 : 0xa9d3ee, roughness: 0.05, transparent: true, opacity: 0.28, depthWrite: false }));
        water.position.y = 0.3 + (level - 0.3) / 2; water.renderOrder = 1;
        sub.add(water);
        var net = new THREE.Mesh(new THREE.PlaneGeometry(2 * a - 0.4, deep - 0.4).rotateX(-Math.PI / 2),
          new THREE.MeshStandardMaterial({ map: gauze(false), alphaTest: 0.5, side: THREE.DoubleSide, metalness: 0.5, roughness: 0.5 }));
        net.position.y = grate - 0.05;
        sub.add(net);
        [-1, 1].forEach(function (s) { sub.add(mesh(new THREE.BoxGeometry(0.25, grate, deep - 1), fx.steel(), s * (a - 0.6), grate / 2)); });
        if (cold) for (k = 0; k < 6; k++) {            // Eiswasser: Eisstücke an der Oberfläche
          var ice = mesh(new THREE.BoxGeometry(0.9, 0.7, 0.9), new THREE.MeshPhysicalMaterial({ color: 0xf2fbff, roughness: 0.15, transparent: true, opacity: 0.75 }),
            (fx.pseudo(3, k) - 0.5) * (2 * a - 1.5), level - 0.15, (fx.pseudo(4, k) - 0.5) * (deep - 1.5));
          ice.rotation.set(k, k * 1.7, 0);
          sub.add(ice);
        }
        // Thermostat rechts neben der Wanne, Heizstab über den Rand ins Wasser
        var box = mesh(new THREE.BoxGeometry(3.4, 6, 5), fx.matte(fx.style.device, 0.5), a + 2, 3, 0);
        sub.add(box, fx.rod(V(a + 1.2, 6, 0), V(a + 1.2, top + 0.8, 0), 0.18, fx.steel()), fx.rod(V(a + 1.2, top + 0.8, 0), V(a - 0.8, top + 0.8, 0), 0.18, fx.steel()),
          fx.rod(V(a - 0.8, top + 0.8, 0), V(a - 0.8, grate + 1, 0), 0.18, fx.steel()));
        if (p.clamp) fx.stand(sub, -a - 1.3, -4, 0, grate + cm(150), [{ y: grate + cm(120), x: 0, r: cm(13) }]);
      });
      u.screen.position.set(a + 2, 4.3, 2.52);
      u.screen.userData.write(d.ctx.numbers ? L.num(r.temp, 0, d.ctx.lang) + " °C" : "");
    }
  });

  // ------------------------------------------------------------------ Waage

  // place: { lift, half } aus stand(): Gehäuse, darauf die Schale, auf der das Gefäß steht; vorn die Anzeige
  L.registerLook("balance", "lab", {
    build: function () {
      var group = new THREE.Group(), screen = fx.screen(3.2, 1.1);
      group.add(screen);
      group.userData = { screen: screen };
      return group;
    },
    update: function (group, d, kit) {
      var u = group.userData, p = d.place || { lift: 24, half: 40 }, a = cm(p.half), pan = kit.up(p.lift), deep = Math.max(6, 1.6 * a), body = pan - 0.35;
      u.body = fx.rebuild(group, "scale", [a, pan].join("|"), function (sub) {
        sub.add(mesh(new THREE.BoxGeometry(2 * a, body, deep), fx.matte(fx.style.device, 0.45), 0, body / 2));
        sub.add(mesh(new THREE.BoxGeometry(2 * a - 0.8, 0.3, deep - 0.8), fx.steel(), 0, pan - 0.15));
      });
      u.screen.position.set(0, body / 2, deep / 2 + 0.02);
      u.screen.userData.write(d.ctx.numbers ? L.shown(d.data, d.ctx.lang) : "");
    }
  });

  // ------------------------------------------------------------------ Zentrifuge

  // place: { lift, half } aus stand(), wie bei der Waage: Gehäuse mit gewölbtem Deckel, in dem das Reagenzglas steckt;
  // vorn die Scheibe, die sich dreht, solange sie läuft, und ein Lämpchen
  L.registerLook("centrifuge", "lab", {
    build: function () {
      var group = new THREE.Group(), rotor = new THREE.Group(), led = mesh(new THREE.SphereGeometry(0.25, 12, 8), new THREE.MeshStandardMaterial({ color: 0x8f9aa5 }));
      rotor.add(mesh(new THREE.CylinderGeometry(1.1, 1.1, 0.2, 24), fx.matte(0xf7f9fb, 0.4)).rotateX(Math.PI / 2));
      rotor.add(mesh(new THREE.BoxGeometry(1.8, 0.25, 0.3), fx.matte(0xd8322c, 0.4)), mesh(new THREE.BoxGeometry(0.25, 1.8, 0.3), fx.matte(0xd8322c, 0.4)));
      group.add(rotor, led);
      group.userData = { rotor: rotor, led: led };
      return group;
    },
    update: function (group, d, kit) {
      var u = group.userData, p = d.place || { lift: 25, half: 34 }, a = cm(p.half), body = kit.up(p.lift) + cm(-L.shapes.tube.floor - 1) - 0.35, deep = Math.max(6, 1.6 * a);      // der Deckel endet am Boden des Glases
      fx.rebuild(group, "body", [a, body].join("|"), function (sub) {      // der Deckel oben, darin die Öffnung für das Glas
        sub.add(mesh(new THREE.BoxGeometry(2 * a, body, deep), fx.matte(fx.style.device, 0.45), 0, body / 2));
        sub.add(mesh(new THREE.BoxGeometry(2 * a - 0.6, 0.3, deep - 0.6), fx.matte(0xf7f9fb, 0.4), 0, body + 0.15));
        sub.add(mesh(new THREE.CylinderGeometry(cm(15), cm(15), 0.05, 24), fx.matte(0x2c3036, 0.6), 0, body + 0.32));
      });
      u.rotor.position.set(-a + 1.6, body / 2, deep / 2 + 0.12);
      u.rotor.rotation.z = d.data.spin ? -(d.ctx.still ? 0.5 : d.ctx.t * 5.2) : 0;
      u.led.position.set(a - 1, body * 0.7, deep / 2 + 0.05);
      u.led.material.color.set(d.data.spin ? 0x2fae4f : 0x8f9aa5);
      u.led.material.emissive.set(d.data.spin ? 0x1c8a3a : 0x000000);
    }
  });

  // ------------------------------------------------------------------ Thermometer

  var thermoGlass = function () {   // lichtbrechend und beidseitig: so bleibt es auch unter Wasser sichtbar (siehe Demo)
    return new THREE.MeshPhysicalMaterial({ color: 0xffffff, metalness: 0, roughness: 0.03, transmission: 1, thickness: 0.15, ior: 1.5, side: THREE.DoubleSide });
  };

  function thermoScale(numbers) {
    var c = doc.createElement("canvas"), g = c.getContext("2d"), T, y, tex;
    c.width = 64; c.height = 1024;
    g.fillStyle = fx.style.display === "paper" ? "#efe3c2" : "#f7f7f4"; g.fillRect(0, 0, 64, 1024);      // um 1880 auf Papier
    g.fillStyle = "#22262b"; g.font = "bold 22px system-ui, sans-serif"; g.textBaseline = "middle";
    for (T = -10; T <= 110; T += 2) {
      y = 1024 * (1 - (T + 10) / 120);
      g.fillRect(0, y - 1, T % 10 ? 12 : T % 50 ? 20 : 26, 2);
      if (numbers && T % 50 === 0 && T >= 0) g.fillText(String(T), 28, Math.min(1012, Math.max(12, y)));
    }
    tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 4;
    return tex;
  }

  L.registerLook("thermometer", "lab", {
    build: function (kit) {
      var group = new THREE.Group(), tag = kit.label(0.75);
      group.add(tag);
      group.userData = { tag: tag };
      return group;
    },
    update: function (group, d, kit) {
      var u = group.userData, r = d.data, p = d.place || { x: 0, bottom: -10, top: -200 }, x = cm(p.x);
      var bottom = cm(-p.bottom), top = cm(-p.top), zero = p.bottom - 16, span = (p.bottom - p.top) - 30;
      var at = function (T) { return cm(-(zero - (Math.max(-10, Math.min(110, T)) + 10) / 120 * span)); };
      u.body = fx.rebuild(group, "glass", [p.x, p.bottom, p.top, !!d.place, d.ctx.numbers].join("|"), function (sub) {
        var glass = thermoGlass(), red = fx.matte(0xd8322c, 0.35);
        sub.add(mesh(new THREE.CylinderGeometry(0.2, 0.2, top - bottom - 0.5, 20), glass, x, (top + bottom + 0.5) / 2));
        sub.add(mesh(new THREE.SphereGeometry(0.2, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), glass, x, top));
        sub.add(mesh(new THREE.SphereGeometry(0.3, 20, 14), glass, x, bottom + 0.31));
        sub.add(mesh(new THREE.SphereGeometry(0.22, 16, 12), red, x, bottom + 0.31));
        var back = new THREE.Mesh(new THREE.PlaneGeometry(0.3, at(110) - at(-10)), new THREE.MeshBasicMaterial({ map: thermoScale(d.ctx.numbers) }));
        back.position.set(x + 0.02, (at(110) + at(-10)) / 2, -0.09);
        sub.add(back);
        var column = mesh(new THREE.CylinderGeometry(0.055, 0.055, 1, 10), red, x, 0);
        column.name = "column";
        sub.add(column);
        if (!d.place) sub.add(mesh(new THREE.BoxGeometry(1.8, 0.5, 1.8), fx.wood(), 0, 0.25));      // Halter, wenn es für sich steht
      });
      var column = u.body.getObjectByName("column"), y = at(r.value);
      column.scale.y = Math.max(0.01, y - bottom - 0.5);
      column.position.y = bottom + 0.5 + column.scale.y / 2;
      u.tag.visible = !!d.ctx.numbers;
      u.tag.userData.write((r.over ? "> " + L.num(r.value, 0, d.ctx.lang) : L.num(r.value, 1, d.ctx.lang)) + " °C");
      u.tag.position.set(x, top + 0.5, 0);
    }
  });

  // ------------------------------------------------------------------ pH-Meter, Leitfähigkeit, Fotometer

  // Tauchsonde im Gefäß, Kabel zum Tischgerät dahinter; das Gerät zeigt, was in 2D in der Anzeige steht
  function meter(text, light) {
    return {
      build: function () {
        var group = new THREE.Group(), screen = fx.screen(5, 2);
        var unit = new THREE.Group();
        unit.add(mesh(new THREE.BoxGeometry(6.5, 9, 3.5), fx.matte(fx.style.device, 0.45), 0, 4.5), screen);
        screen.position.set(0, 7.3, 1.76);
        group.add(unit);
        group.userData = { unit: unit, screen: screen };
        return group;
      },
      update: function (group, d, kit) {
        var u = group.userData, r = d.data, p = d.place || { x: 0, bottom: -10, top: -110 }, x = cm(p.x), floor = -kit.up(d.lift);
        var bottom = cm(-(p.bottom - 5)), capTop = cm(-p.top), ux = x + cm((p.box == null ? 4 : p.box)) - 1.5, uz = -10;      // wie in 2D links: rechts hängt oft die Bürette
        u.unit.position.set(ux, floor, uz);
        u.body = fx.rebuild(group, "probe", [p.x, p.bottom, p.top, d.lift, ux].join("|"), function (sub) {
          var plastic = fx.matte(0x2c3036, 0.5);
          sub.add(mesh(new THREE.CylinderGeometry(cm(3), cm(3), capTop - cm(12) - bottom, 16), plastic, x, (capTop - cm(12) + bottom) / 2));
          sub.add(mesh(new THREE.CylinderGeometry(cm(4.5), cm(4.5), cm(12), 16), fx.matte(0x14171a, 0.4), x, capTop - cm(6)));
          sub.add(mesh(new THREE.SphereGeometry(cm(4.5), 16, 10), thermoGlass(), x, bottom));
          var cable = new THREE.CatmullRomCurve3([V(x, capTop, 0), V(x, capTop + 2.5, -1), V((x + ux) / 2, capTop + 3, uz / 2), V(ux, floor + 9.5, uz)]);
          sub.add(mesh(new THREE.TubeGeometry(cable, 40, 0.12, 8), fx.matte(0x1b1d20, 0.6)));
          if (light) {
            var glow = new THREE.Mesh(new THREE.SphereGeometry(cm(3.2), 12, 8), new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: false }));
            glow.name = "light"; glow.position.set(x, bottom, 0.01);
            sub.add(glow);
          }
        });
        if (light) u.body.getObjectByName("light").material.color.copy(fx.color(L.waveRgb(r.nm)));
        u.screen.userData.write(text(r, d.ctx));
      }
    };
  }

  L.registerLook("phmeter", "lab", meter(function (r, ctx) { return "pH" + (r.value == null ? " –" : ctx.numbers ? " " + L.num(r.value, 2, ctx.lang) : ""); }));
  L.registerLook("conductometer", "lab", meter(function (r, ctx) { return ctx.numbers ? L.shown(r, ctx.lang) : "mS/cm"; }));
  L.registerLook("photometer", "lab", meter(function (r, ctx) { return ctx.numbers ? L.shown(r, ctx.lang) : L.text("unit.E", ctx.lang); }, true));

  // ------------------------------------------------------------------ Kolbenprober

  var BARREL = 90;                  // wie in chemlab-parts.js: Länge des Zylinders für 100 mL

  // Gummistopfen: in der Öffnung (place wie beim Kolbenprober) oder, herausgeflogen, auf dem Tisch
  L.registerLook("stopper", "lab", {
    build: function () { var group = new THREE.Group(); group.userData = {}; return group; },
    update: function (group, d, kit) {
      var p = d.place, floor = -kit.up(d.lift);
      group.userData.body = fx.rebuild(group, "plug", p ? [p.x, p.rim, p.w, d.lift].join("|") : "alone", function (sub) {
        var w = p ? p.w : 22, plug = mesh(new THREE.CylinderGeometry(cm(w / 2), cm(w / 2 - 2), cm(11), 24), fx.matte(0x4a4d52, 0.8), p ? cm(p.x) : 0, p ? cm(-(p.rim + 1.5)) : floor + cm(w / 2));
        plug.castShadow = true;
        if (!p) plug.rotation.z = Math.PI / 2;                 // liegt auf der Seite
        sub.add(plug);
      });
    }
  });

  // Manometer: Stopfen, Steigrohr und rundes Zifferblatt mit Anzeige
  L.registerLook("manometer", "lab", {
    build: function () {
      var group = new THREE.Group(), screen = fx.screen(1.6, 0.7), needle = new THREE.Mesh(new THREE.BoxGeometry(cm(1.2), cm(12), cm(0.6)).translate(0, cm(6), 0), fx.matte(0xc0392b, 0.6));
      group.add(screen, needle); group.userData = { screen: screen, needle: needle }; return group;
    },
    update: function (group, d, kit) {
      var u = group.userData, p = d.place, floor = -kit.up(d.lift), x = p ? cm(p.x) : 0, y0 = p ? cm(-(p.rim + 1.5)) : floor + cm(5.5), dial = y0 + cm(46);
      u.body = fx.rebuild(group, "gauge", p ? [p.x, p.rim, p.w, d.lift].join("|") : "alone", function (sub) {
        var w = p ? p.w : 20;
        sub.add(mesh(new THREE.CylinderGeometry(cm(w / 2), cm(w / 2 - 2), cm(11), 24), fx.matte(0x4a4d52, 0.8), x, y0));
        sub.add(mesh(new THREE.CylinderGeometry(cm(1.5), cm(1.5), cm(30), 10), fx.steel(), x, y0 + cm(20)));
        sub.add(mesh(new THREE.CylinderGeometry(cm(16), cm(16), cm(6), 32).rotateX(Math.PI / 2), fx.matte(fx.style.device, 0.45), x, dial));
        sub.add(mesh(new THREE.TorusGeometry(cm(16), cm(1.4), 8, 40), fx.matte(0x3a3d42, 0.5), x, dial));      // dunkler Rand: das helle Gehäuse vor heller Wand
      });
      // Zeiger wie in 2D: 0 bar links unten, 2 bar rechts unten, 1 bar senkrecht
      u.needle.position.set(x, dial, cm(3.4));
      u.needle.rotation.z = -(-135 + 135 * Math.max(0, Math.min(2, d.data.value == null ? 1 : d.data.value))) * Math.PI / 180;
      u.screen.position.set(x + cm(16) + 0.9, dial, cm(4));
      u.screen.userData.write(d.ctx.numbers && d.data.value != null ? L.shown(d.data, d.ctx.lang) : "");
    }
  });

  L.registerLook("syringe", "lab", {
    build: function (kit) {
      var group = new THREE.Group(), tag = kit.label(0.75);
      group.add(tag);
      group.userData = { tag: tag };
      return group;
    },
    update: function (group, d, kit) {
      var u = group.userData, r = d.data, p = d.place, value = Math.max(0, Math.min(100, r.value || 0)), floor = -kit.up(d.lift);
      var x0 = cm(p ? p.x + (p.off || 20) : -56), y = cm(-(p ? p.rim - 26 : -14)), len = cm(BARREL), R = cm(8);
      u.body = fx.rebuild(group, "barrel", p ? [p.x, p.rim, p.w, p.off, d.lift].join("|") : "alone", function (sub) {
        var glass = fx.glass(), k, steel = fx.steel();
        var barrel = new THREE.Mesh(new THREE.CylinderGeometry(R, R, len, 28, 1, true).rotateZ(Math.PI / 2), glass);
        barrel.position.set(x0 + len / 2, y, 0); barrel.renderOrder = 2;
        sub.add(barrel, mesh(new THREE.CircleGeometry(R, 28).rotateY(Math.PI / 2), glass, x0, y));
        for (k = 0; k <= 100; k += 20) {                // Teilstriche als Ringe
          sub.add(mesh(new THREE.TorusGeometry(R + 0.01, 0.012, 4, 28).rotateY(Math.PI / 2), fx.matte(0x22262b, 0.6), x0 + cm(6 + (BARREL - 14) * k / 100), y));
        }
        var plunger = new THREE.Group();
        plunger.name = "plunger";
        plunger.add(mesh(new THREE.CylinderGeometry(R - 0.02, R - 0.02, cm(4), 24).rotateZ(Math.PI / 2), fx.matte(0x3a3f45, 0.5), cm(2), 0),
          mesh(new THREE.CylinderGeometry(0.08, 0.08, cm(30), 10).rotateZ(Math.PI / 2), steel, cm(19), 0),
          mesh(new THREE.CylinderGeometry(R * 0.9, R * 0.9, 0.1, 20).rotateZ(Math.PI / 2), steel, cm(34), 0));
        sub.add(plunger);
        var gas = new THREE.Mesh(new THREE.CylinderGeometry(R - 0.03, R - 0.03, 1, 20).rotateZ(Math.PI / 2),
          new THREE.MeshBasicMaterial({ color: 0xd9e6f2, transparent: true, opacity: 0.22, depthWrite: false }));
        gas.name = "gas";
        sub.add(gas);
        if (p) {                                        // Stopfen in der Öffnung, Schlauch hinauf und hinüber zum Zylinder
          var stopper = mesh(new THREE.CylinderGeometry(cm(p.w / 2), cm(p.w / 2 - 2), cm(11), 24), fx.matte(0x4a4d52, 0.8), cm(p.x), cm(-(p.rim + 1.5)));
          var hose = new THREE.CatmullRomCurve3([V(cm(p.x), cm(-(p.rim - 4)), 0), V(cm(p.x), y - 0.3, 0), V(cm(p.x) + 0.4, y, 0), V(x0, y, 0)]);
          sub.add(stopper, mesh(new THREE.TubeGeometry(hose, 30, 0.12, 8), fx.matte(0xc0462e, 0.6)));
        }
        fx.stand(sub, x0 + len / 2, -4, floor, y + 1.2, [{ y: y, x: x0 + len / 2, r: R, across: true }]);
      });
      var px = x0 + cm(6 + (BARREL - 14) * value / 100), gas = u.body.getObjectByName("gas");
      u.body.getObjectByName("plunger").position.set(px, y, 0);
      gas.visible = px - x0 > 0.02;
      gas.scale.set(Math.max(0.01, px - x0), 1, 1);       // rotateZ hat die Länge des Zylinders in die x-Achse gelegt
      gas.position.set((x0 + px) / 2, y, 0);
      u.tag.visible = !!d.ctx.numbers;
      u.tag.userData.write(L.num(value, 1, d.ctx.lang) + " mL");
      u.tag.position.set(x0 + len / 2, y + R + 0.3, 0);
    }
  });
})(typeof globalThis !== "undefined" ? globalThis : this);
