/* ChemLab – Szenen für die 3D-Ansicht: Raum, Tisch, Licht, Stil der Geräte und Requisiten. Klassisches Skript, geladen von chemlab-3d.js.
   Eine Szene ist { build(kit), style: { … } }. build legt alles in kit.root; style ändert das Aussehen der Geräte (siehe fx.STYLE
   in effects.js). Geräte, die ganz anders aussehen, registrieren eigene Looks unter dem Namen der Szene (looks-kitchen.js, looks-1880.js).
   Die Tischplatte liegt bei y = 0, die Geräte stehen bei z = 0; vorne ist +z. Texturen und Raumlicht: assets/3d/, Herkunft in QUELLEN.md. */
(function (global) {
  "use strict";

  var L = global.LiaChemLab, THREE = L.THREE, fx = L.fx3d;

  // Fliesen als Bild aus einem Canvas: eine Fliese mit Fuge, wiederholt (repeat) auf die gewünschte Größe
  function tiles(color, grout) {
    var c = global.document.createElement("canvas"), g = c.getContext("2d"), tex;
    c.width = c.height = 128;
    g.fillStyle = grout; g.fillRect(0, 0, 128, 128);
    g.fillStyle = color; g.fillRect(2, 2, 124, 124);
    tex = new THREE.CanvasTexture(c);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 4;
    return tex;
  }
  fx.tiles = tiles;            // auch für eigene Szenen

  // Ein Raum aus Wand, Tischplatte, Unterschrank und Boden, dazu ein Licht von schräg vorn mit Schatten.
  // look.wall, .top, .cabinet: Farbe, { map, normal, repeat, rough } mit Pfaden unter assets/3d/ oder { texture, repeat, rough }
  function room(kit, look) {
    var root = kit.root;
    function surface(spec, rough, repeat) {
      if (typeof spec === "number") return fx.matte(spec, rough);
      if (spec.texture) {
        spec.texture.repeat.set((spec.repeat || repeat)[0], (spec.repeat || repeat)[1]);
        return new THREE.MeshStandardMaterial({ map: spec.texture, roughness: spec.rough == null ? rough : spec.rough });
      }
      return new THREE.MeshStandardMaterial({
        map: kit.texture(spec.map, true, spec.repeat || repeat),
        normalMap: spec.normal ? kit.texture(spec.normal, false, spec.repeat || repeat) : null,
        roughness: spec.rough == null ? rough : spec.rough
      });
    }
    var top = new THREE.Mesh(new THREE.BoxGeometry(900, 3, 75), surface(look.top, look.topRough || 0.6, [9, 0.75]));
    top.position.set(0, -1.5, -12);
    top.receiveShadow = true;
    var front = new THREE.Mesh(new THREE.BoxGeometry(900, 88, 70), surface(look.cabinet, 0.6, [9, 0.9]));
    front.position.set(0, -47, -14);
    var wall = new THREE.Mesh(new THREE.PlaneGeometry(900, 300), surface(look.wall, 0.9, [9, 3]));
    wall.position.set(0, 60, -50);
    wall.receiveShadow = true;
    var floor = new THREE.Mesh(new THREE.PlaneGeometry(900, 400), fx.matte(look.floor, 0.9));
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -91;
    root.add(top, front, wall, floor);
    root.background = new THREE.Color(look.sky || 0xdde3e8);

    var sun = new THREE.DirectionalLight(look.light, look.lightPower);
    sun.position.set(-50, 220, 70);           // hoch und von links vorn: kurze Schatten, die die Geräte auf den Tisch stellen
    sun.castShadow = kit.high;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.camera.left = -120; sun.shadow.camera.right = 120;
    sun.shadow.camera.top = 120; sun.shadow.camera.bottom = -40;
    sun.shadow.bias = -0.0004;
    sun.shadow.radius = 4;
    root.add(sun, new THREE.HemisphereLight(0xffffff, look.floor, 0.35));
    kit.renderer.toneMappingExposure = look.exposure;
    if (look.hdr) kit.environment(look.hdr);
  }

  fx.room = room;              // auch für eigene Szenen

  function put(root, geo, mat, x, y, z) {
    var m = new THREE.Mesh(geo, mat);
    m.position.set(x, y, z);
    m.castShadow = m.receiveShadow = true;
    root.add(m);
    return m;
  }

  // Flasche als Drehkörper: Bauch, Schulter, Hals; Höhe h
  function bottle(root, x, z, y, h, color) {
    var r = h * 0.2, pts = [[0, 0], [r, 0], [r, h * 0.62], [r * 0.4, h * 0.8], [r * 0.32, h], [0, h]];
    var glass = new THREE.MeshPhysicalMaterial({ color: color, roughness: 0.1, transparent: true, opacity: 0.75, clearcoat: 1 });
    put(root, fx.lathe(pts, 24), glass, x, y, z);
    put(root, new THREE.CylinderGeometry(r * 0.36, r * 0.36, h * 0.08, 12), fx.matte(0x8a6a4a, 0.8), x, y + h * 1.02, z);      // Korken
  }

  // ------------------------------------------------------------------ Labor (heute)

  L.registerScene("lab", {
    build: function (kit) {
      // Fliesenwand mit 10 cm großen Fliesen wie in 2D, dunkle Arbeitsplatte
      room(kit, { top: 0x3b4046, topRough: 0.35, cabinet: 0xd5dade, wall: { texture: tiles("#eeeae2", "#cfc9bd"), repeat: [90, 30], rough: 0.35 },
        floor: 0x9aa1a8, light: 0xffffff, lightPower: 2.2, exposure: 0.9, sky: 0xe8ecef });
    }
  });

  // ------------------------------------------------------------------ Küche

  L.registerScene("kitchen", {
    style: { wood: 0xb88a52, device: 0xf4f4f2, marks: 0xd03a2a },
    build: function (kit) {
      room(kit, {
        top: { map: "assets/3d/kitchen/kitchen_wood_diff_1k.jpg", rough: 0.55, repeat: [9, 0.75] },      // 1 m je Kachel
        cabinet: 0xf3f1ec,
        wall: { map: "assets/3d/kitchen/long_white_tiles_diff_1k.jpg", normal: "assets/3d/kitchen/long_white_tiles_nor_gl_1k.jpg", rough: 0.25, repeat: [15, 5] },      // 60 cm je Kachel
        floor: 0x8c7b66, light: 0xfff4e0, lightPower: 2.3, exposure: 0.85, hdr: "assets/3d/kitchen/comfy_cafe_1k.hdr"
      });
      var root = kit.root, wood = fx.matte(0xa87a48, 0.6);
      put(root, new THREE.BoxGeometry(34, 1.6, 22), wood, -42, 0.8, -32).rotation.y = 0.12;           // Schneidbrett
      var pot = put(root, fx.lathe([[0, 0], [5, 0], [5.4, 13], [5.1, 13], [4.6, 0.4], [0, 0.4]], 32),
        new THREE.MeshPhysicalMaterial({ color: 0xece6da, roughness: 0.25, clearcoat: 0.6 }), 46, 0, -36);        // Steinguttopf mit Kochlöffeln
      pot.castShadow = true;
      [-0.25, 0.1, 0.3].forEach(function (a, k) {
        var spoon = put(root, new THREE.CylinderGeometry(0.35, 0.45, 24, 10), wood, 46 + Math.sin(a) * 4, 12 + k, -36 + Math.cos(a + k) * 1.5);
        spoon.rotation.z = a;
      });
    }
  });

  // ------------------------------------------------------------------ Labor um 1880

  L.registerScene("1880", {
    style: { glass: 0xdcefe0, glassOpacity: 0.3, metal: "brass", wood: 0x5a3a22, device: 0x6b4a2b, display: "paper", marks: null, hose: 0x3a3330, tank: "copper" },
    build: function (kit) {
      room(kit, {
        top: { map: "assets/3d/1880/dark_wooden_planks_diff_1k.jpg", rough: 0.75, repeat: [9, 0.75] },
        cabinet: 0x4a3220,
        wall: { map: "assets/3d/1880/red_brick_03_diff_1k.jpg", normal: "assets/3d/1880/red_brick_03_nor_gl_1k.jpg", rough: 0.9, repeat: [22, 7.3] },      // Ziegel etwa 7 cm hoch
        floor: 0x3e3026, light: 0xffd9a0, lightPower: 1.9, exposure: 0.8, hdr: "assets/3d/1880/vintage_measuring_lab_1k.hdr", sky: 0x3a2c22
      });
      var root = kit.root, shelf = fx.matte(0x4a2f1c, 0.7), k;
      put(root, new THREE.BoxGeometry(110, 2, 14), shelf, 0, 46, -42);                                    // Wandbrett mit Flaschen
      [-50, 50].forEach(function (x) { put(root, new THREE.BoxGeometry(2, 6, 12), shelf, x, 42, -43); });
      for (k = 0; k < 9; k++) bottle(root, -46 + k * 11.5, -42, 47, 9 + (k % 3) * 3, [0x6b3a12, 0x2f5a2a, 0x8a5a1a][k % 3]);
      var y = 0;
      [[0x5a1f1a, 4], [0x23361f, 3.2], [0x4a3a20, 3.6]].forEach(function (b, i) {                         // Bücherstapel
        put(root, new THREE.BoxGeometry(22, b[1], 16), fx.matte(b[0], 0.8), -48, y + b[1] / 2, -34).rotation.y = i * 0.15 - 0.1;
        y += b[1];
      });
    }
  });
})(typeof globalThis !== "undefined" ? globalThis : this);
