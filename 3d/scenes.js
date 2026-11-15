/* ChemLab – Szenen für die 3D-Ansicht: Raum, Tisch und Licht. Klassisches Skript, geladen von chemlab-3d.js.
   Eine Szene ist { build(kit), gear: { Gerätetyp: Szene, deren Look gilt } }. build legt alles in kit.root.
   Die Tischplatte liegt bei y = 0, die Geräte stehen bei z = 0; vorne ist +z. */
(function (global) {
  "use strict";

  var L = global.LiaChemLab, THREE = L.THREE;

  // Ein Raum aus Wand, Tischplatte, Unterschrank und Boden, dazu ein Licht von schräg vorn mit Schatten
  // shortcut: nur Farben, noch keine Texturen; die kommen mit den Szenen Küche und 1880 (Schritt 5 des Plans)
  function room(kit, look) {
    var root = kit.root, mat = function (color, rough, metal) {
      return new THREE.MeshStandardMaterial({ color: color, roughness: rough == null ? 0.8 : rough, metalness: metal || 0 });
    };
    var top = new THREE.Mesh(new THREE.BoxGeometry(900, 3, 75), mat(look.top, look.topRough));
    top.position.set(0, -1.5, -12);
    top.receiveShadow = true;
    var front = new THREE.Mesh(new THREE.BoxGeometry(900, 88, 70), mat(look.cabinet, 0.6));
    front.position.set(0, -47, -14);
    var wall = new THREE.Mesh(new THREE.PlaneGeometry(900, 300), mat(look.wall, 0.95));
    wall.position.set(0, 60, -50);
    wall.receiveShadow = true;
    var floor = new THREE.Mesh(new THREE.PlaneGeometry(900, 400), mat(look.floor, 0.9));
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -91;
    root.add(top, front, wall, floor);
    root.background = new THREE.Color(look.wall);

    var sun = new THREE.DirectionalLight(look.light, look.lightPower);
    sun.position.set(-70, 140, 90);
    sun.castShadow = kit.high;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.camera.left = -120; sun.shadow.camera.right = 120;
    sun.shadow.camera.top = 120; sun.shadow.camera.bottom = -40;
    sun.shadow.bias = -0.0004;
    sun.shadow.radius = 4;
    root.add(sun, new THREE.HemisphereLight(0xffffff, look.floor, 0.35));
    kit.renderer.toneMappingExposure = look.env;       // Scene.environmentIntensity gibt es erst nach 0.160
  }

  L.registerScene("lab", {
    build: function (kit) {
      room(kit, { top: 0x3b4046, topRough: 0.35, cabinet: 0xd5dade, wall: 0xe8ecef, floor: 0x9aa1a8, light: 0xffffff, lightPower: 2.2, env: 0.9 });
    }
  });

  L.registerScene("kitchen", {
    build: function (kit) {
      room(kit, { top: 0xb08a5a, topRough: 0.55, cabinet: 0xf3efe6, wall: 0xf1ede4, floor: 0x8c7b66, light: 0xfff4e0, lightPower: 2.4, env: 0.8 });
    },
    gear: {}
  });

  L.registerScene("1880", {
    build: function (kit) {
      room(kit, { top: 0x5a3d26, topRough: 0.7, cabinet: 0x4a3220, wall: 0x8a5a44, floor: 0x3e3026, light: 0xffd9a0, lightPower: 2.0, env: 0.45 });
    },
    gear: {}
  });
})(typeof globalThis !== "undefined" ? globalThis : this);
