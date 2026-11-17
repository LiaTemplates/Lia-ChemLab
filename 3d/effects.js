/* ChemLab – Bausteine für die 3D-Looks: Glas, Flüssigkeit mit Oberfläche, Trübung, Bodensatz, Feststoffe, Blasen, Dampf, Strahl.
   Klassisches Skript, geladen von chemlab-3d.js nach stage.js. Alles in cm, y nach oben.

   Ein Gefäß beschreibt sein Inneres als shape = { inner(y) → Radius in cm, floor: tiefste Stelle innen, rim: Rand }.
   Bewegung folgt der Zeit des Versuchs (ctx.t): angehalten steht das Bild, rückwärts läuft es rückwärts – wie in 2D. */
(function (global) {
  "use strict";

  var L = global.LiaChemLab, THREE = L.THREE, doc = global.document;
  var fx = (L.fx3d = {});

  // Stil der Szene: die Bühne setzt ihn vor jedem Aufruf eines Looks (fx.style = kit.style). Die Looks des Labors lesen ihn,
  // so sehen dieselben Geräte in der Küche und um 1880 anders aus, ohne eigenen Code.
  // shortcut: ein Stil für alle Bühnen der Seite zugleich; zwei 3D-Flächen mit verschiedenen Szenen auf einer Folie mischen sich beim Neubau
  fx.STYLE = {
    glass: 0xffffff, glassOpacity: 0.2,           // Farbe und Deckkraft des Glases
    metal: "steel",                                // "steel" oder "brass": Stangen, Rohre, Brenner
    wood: 0x9a6a3a,                                // Ständer und Halter
    device: 0xe6e9ec,                              // Gehäuse der Messgeräte
    display: "lcd",                                // "lcd" oder "paper": Anzeige der Geräte
    marks: 0xffffff,                               // Farbe der Skala auf Gläsern; null: ohne Skala
    hose: 0xc0462e                                 // Gasschlauch
  };
  fx.style = fx.STYLE;

  function pseudo(seed, i) { var x = Math.sin(seed * 12.9898 + i * 78.233) * 43758.5453; return x - Math.floor(x); }
  fx.pseudo = pseudo;

  fx.color = function (rgb) { return new THREE.Color().setRGB(rgb[0] / 255, rgb[1] / 255, rgb[2] / 255, THREE.SRGBColorSpace); };

  // Glas ist nur durchscheinend, nicht „transmissiv“: eine Flüssigkeit mit Transmission dahinter sähe sonst das Glas nicht
  // und umgekehrt (siehe Demo). Schatten wirft es keinen.
  fx.glass = function () {
    return new THREE.MeshPhysicalMaterial({ color: fx.style.glass, metalness: 0, roughness: 0.03, transparent: true, opacity: fx.style.glassOpacity,
      clearcoat: 1, clearcoatRoughness: 0.02, specularIntensity: 1, depthWrite: false, side: THREE.DoubleSide });
  };

  fx.matte = function (color, rough, metal) {
    return new THREE.MeshStandardMaterial({ color: color, roughness: rough == null ? 0.8 : rough, metalness: metal || 0 });
  };

  // Drehkörper aus Punkten [r, y]
  fx.lathe = function (points, segments) {
    return new THREE.LatheGeometry(points.map(function (p) { return new THREE.Vector2(Math.max(0, p[0]), p[1]); }), segments || 48);
  };

  // Die Wand eines Glases: außen von unten nach oben, über den Rand, innen zurück nach unten
  fx.wall = function (shape, thick, lip) {
    var pts = [], n = shape.steps || 24, i, y, top = shape.rim;      // steps: feiner für runde Formen (Kolben)
    for (i = 0; i <= n; i++) { y = shape.floor + (top - shape.floor) * i / n; pts.push([shape.inner(y) + thick, y - (i === 0 ? thick : 0)]); }
    pts.unshift([0, shape.floor - thick]);
    pts.push([shape.inner(top) + thick + (lip || 0), top], [shape.inner(top), top]);
    for (i = n; i >= 0; i--) { y = shape.floor + (top - shape.floor) * i / n; pts.push([shape.inner(y), y]); }
    pts.push([0, shape.floor]);
    return fx.lathe(pts, 64);
  };

  // ------------------------------------------------------------------ Sprites

  var puffTexture = null;
  function puff() {                 // weicher, runder Fleck für Dampf
    if (puffTexture) return puffTexture;
    var c = doc.createElement("canvas"), g = c.getContext("2d"), grad;
    c.width = c.height = 64;
    grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    grad.addColorStop(0, "rgba(255,255,255,1)"); grad.addColorStop(0.5, "rgba(255,255,255,0.45)"); grad.addColorStop(1, "rgba(255,255,255,0)");
    g.fillStyle = grad; g.fillRect(0, 0, 64, 64);
    puffTexture = new THREE.CanvasTexture(c);
    return puffTexture;
  }

  // ------------------------------------------------------------------ Inhalt eines Gefäßes

  // Alles, was in einem Gefäß sein kann. contents(kit, seed) → { group, update(w, shape, level, ctx) }
  // level: Höhe des Flüssigkeitsspiegels in cm (aus der 2D-Zeichnung, damit Messgeräte genau so tief eintauchen)
  fx.contents = function (kit, seed) {
    var group = new THREE.Group();
    var liquid = new THREE.MeshPhysicalMaterial({ color: 0xffffff, metalness: 0, roughness: 0.04, transmission: 1, thickness: 1, ior: 1.33,
      attenuationColor: new THREE.Color(0xffffff), attenuationDistance: 4, side: THREE.DoubleSide });
    var body = new THREE.Mesh(new THREE.BufferGeometry(), liquid);
    var surface = new THREE.Mesh(new THREE.RingGeometry(0.001, 1, 96, 28).rotateX(-Math.PI / 2), liquid);
    var base = surface.geometry.attributes.position.array.slice();
    var ground = new THREE.Mesh(new THREE.BufferGeometry(), fx.matte(0xffffff, 0.95));
    var crust = new THREE.Mesh(new THREE.BufferGeometry(), fx.matte(0xf2f0ea, 0.9));
    // ein Spiegel am Glas (Silberspiegel): eine Metallhaut knapp innerhalb der Wand
    var mirror = new THREE.Mesh(new THREE.BufferGeometry(), new THREE.MeshStandardMaterial({ color: 0xd0d4d8, metalness: 1, roughness: 0.12, transparent: true, side: THREE.DoubleSide }));
    mirror.renderOrder = 1;
    var solids = new THREE.Group();
    var bubbles = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 12, 8), new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 1, roughness: 0.03 }), 48);
    var steam = new THREE.Group(), stream = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 1, 10, 1, true),
      new THREE.MeshPhysicalMaterial({ color: 0xdfeefa, roughness: 0.05, transparent: true, opacity: 0.55, depthWrite: false }));
    var dummy = new THREE.Object3D(), keys = {}, i, flat = false;
    for (i = 0; i < 24; i++) steam.add(new THREE.Sprite(new THREE.SpriteMaterial({ map: puff(), transparent: true, depthWrite: false, opacity: 0 })));
    bubbles.count = 0;
    body.renderOrder = surface.renderOrder = 1;
    var burn = fx.burning();
    var pieces = [];                  // je Feststoff seine Teile, damit Glühen und Schwimmen sie in jedem Bild nachführen
    var hotFlame = fx.cone(0.12, 0xa9c2ff);           // Wasserstoff, der über einem heißen Stück brennt
    hotFlame.visible = false;
    // Spritzer: Tropfen über geschmolzenem Metall und beim Verdünnen; ein Stopfen, der herausfliegt
    var drops3 = new THREE.InstancedMesh(new THREE.SphereGeometry(0.05, 8, 6), new THREE.MeshStandardMaterial({ color: 0xdfe6ee, roughness: 0.2, metalness: 0.3 }), 16);
    var flyer = new THREE.Group(), gauge = new THREE.Group();
    flyer.add(new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.4, 0.7, 20), fx.matte(0x4a4d52, 0.8)), gauge);
    gauge.add(new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 1.2, 8).translate(0, 0.9, 0), fx.steel()),
      new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.6, 0.24, 24).rotateX(Math.PI / 2).translate(0, 1.6, 0), fx.matte(fx.style.device, 0.45)));
    drops3.count = 0; flyer.visible = false;
    drops3.frustumCulled = bubbles.frustumCulled = false;          // count wechselt; eine einmal berechnete Hülle wäre leer oder zu klein
    group.add(body, surface, ground, crust, mirror, solids, bubbles, steam, stream, burn.group, hotFlame, drops3, flyer);

    // Drehkörper der Form bis zur Höhe top, nur neu, wenn sich die Höhe merklich ändert
    function fill(mesh, shape, from, top, key) {
      var pts = [[0, from]], n = shape.steps || 16, k;
      if (keys[key] === top.toFixed(3) + shape.id) return;
      keys[key] = top.toFixed(3) + shape.id;
      // der Spiegel ist eine offene Haut dicht an der Wand, alles andere ein Körper mit Deckel (die Flüssigkeit hat ihre eigene Oberfläche)
      for (k = 0; k <= n; k++) pts.push([shape.inner(from + (top - from) * k / n) - (key === "mirror" ? 0.004 : 0.012), from + (top - from) * k / n]);
      if (key !== "body" && key !== "mirror") pts.push([0, top]);
      mesh.geometry.dispose();
      mesh.geometry = fx.lathe(pts, 48);
    }

    // Oberfläche: Meniskus am Rand; beim Sieden unruhig. domes: Blasen, die gerade oben ankommen, als [x, z, Höhe, Breite] in cm:
    // erst wölbt sich das Wasser, dann platzt die Blase und lässt eine Mulde mit einem Ring zurück.
    function wave(boil, r, t, still, domes) {
      var p = surface.geometry.attributes.position, a = p.array, k, j, x, z, d, h, X, Z, edge, e, dx, dz, q;
      if (!boil && flat) return;
      flat = !boil;
      for (k = 0; k < a.length; k += 3) {
        x = base[k]; z = base[k + 2]; d = Math.sqrt(x * x + z * z);
        h = 0.05 / r * Math.exp((d - 1) * r / 0.1);
        if (boil && !still) {
          X = x * r; Z = z * r;
          edge = 1 - Math.pow(d, 6);                    // am Glas bleibt die Oberfläche hängen
          h += boil * edge * (0.024 * Math.sin(6.1 * X + 9 * t) + 0.02 * Math.sin(7.3 * Z - 11 * t + 1) +
            0.018 * Math.sin(4.7 * (X + Z) + 13 * t + 2) + 0.014 * Math.sin(9.1 * (X - Z) - 8 * t + 3) + 0.01 * Math.sin(13 * X - 17 * t));
          for (j = 0; j < domes.length; j++) {
            e = domes[j]; dx = X - e[0]; dz = Z - e[1]; q = (dx * dx + dz * dz) / (e[3] * e[3]);
            if (q < 9) h += edge * e[2] * Math.exp(-q);
            if (e[4] && q < 25) h += edge * e[4] * Math.exp(-Math.pow(Math.sqrt(q) - e[5], 2) * 4);       // Ring nach dem Platzen
          }
        }
        a[k + 1] = h;
      }
      p.needsUpdate = true;
      surface.geometry.computeVertexNormals();
    }

    function laySolids(list, shape, tall, wet) {
      var key = list.map(function (s) { return s.id + s.form + s.g0.toFixed(4) + Math.round(s.part * 30) + (s.float && wet ? "~" : "") + (s.molten ? "*" : ""); }).join("|") + shape.id;
      if (keys.solids === key) return;
      keys.solids = key;
      solids.children.slice().forEach(function (o) { solids.remove(o); o.geometry.dispose(); o.material.dispose(); });
      pieces = [];
      list.forEach(function (s, index) {
        var color = new THREE.Color((L.species(s.id) || {}).color || "#9aa0a8"), path, count, r, k, y, x, ball;
        pieces[index] = [];
        if (s.float && wet) {            // schwimmt: ein Stück an der Oberfläche, geschmolzen eine glänzende Kugel; die Lage folgt in update
          r = (2.4 + 3 * Math.pow(s.part, 1 / 3)) / 16;
          ball = new THREE.Mesh(s.molten ? new THREE.SphereGeometry(r, 20, 14) : new THREE.IcosahedronGeometry(r, 0), fx.matte(color, s.molten ? 0.15 : 0.6, s.molten ? 0.9 : 0.4));
          ball.userData.r = r;
          solids.add(ball);
          pieces[index].push(ball);
          return;
        }
        if (s.molten) {                  // geschmolzen am Boden: eine flache, glänzende Lache
          ball = new THREE.Mesh(new THREE.SphereGeometry(1, 24, 10), fx.matte(color, 0.15, 0.9));
          r = shape.inner(shape.floor + 0.05) * 0.6 * Math.sqrt(s.part);
          ball.scale.set(r, 0.06, r);
          ball.position.set(0, shape.floor + 0.04, 0);
          solids.add(ball);
          pieces[index].push(ball);
          return;
        }
        if (s.form === "strip") {        // Band im Zickzack, wird dünner, nicht kürzer
          count = Math.max(2, Math.min(14, Math.round(s.g0 / 0.0104)));
          path = new THREE.CurvePath();
          var at = function (k) {
            var w = shape.inner(shape.floor + 0.3) * 0.6;
            return tall ? new THREE.Vector3((k % 2 ? 1 : -1) * w, shape.floor + 0.2 + k * 0.44, 0)
              : new THREE.Vector3((k - count / 2) * Math.min(0.56, 1.6 * w / count), shape.floor + 0.08 + (k % 2) * 0.35, (pseudo(index, k) - 0.5) * w);
          };
          for (k = 0; k < count; k++) path.add(new THREE.LineCurve3(at(k), at(k + 1)));
          solids.add(new THREE.Mesh(new THREE.TubeGeometry(path, count * 4, 0.02 + 0.08 * s.part, 6, false), fx.matte(color, 0.35, 0.7)));
          pieces[index].push(solids.children[solids.children.length - 1]);
        } else {
          count = s.form === "powder" ? 12 : Math.max(3, Math.min(9, Math.round(3 + s.g0 * 4)));
          r = s.form === "powder" ? 0.08 : (2 + 2.5 * Math.pow(s.part, 1 / 3)) / 16;
          for (k = 0; k < count; k++) {
            var m = new THREE.Mesh(new THREE.IcosahedronGeometry(r, 0), fx.matte(color, 0.85));
            y = shape.floor + r + pseudo(index + 7, k) * (tall ? 0.4 : 0.05);
            x = Math.sqrt(pseudo(index + 1, k)) * Math.max(0, shape.inner(y) - r);
            m.position.set(x * Math.cos(k * 2.4 + index), y, x * Math.sin(k * 2.4 + index));
            m.rotation.set(k, k * 2, 0);
            m.castShadow = true;
            solids.add(m);
            pieces[index].push(m);
          }
        }
      });
    }

    return {
      group: group,
      // shape.id: Name der Form, damit eine neue Form (anderes Gefäß) neu gebaut wird; tall: schmales Glas
      // shine: Höhe, bis zu der ein Spiegel am Glas reicht (null: keiner)
      update: function (w, shape, level, ctx, tall, shine) {
        var wet = w.ml > 0.005, r = shape.inner(level), t = ctx.still ? 0 : ctx.t, cloud = w.cloud && w.cloud.alpha > 0.02 ? w.cloud.alpha : 0;
        var rate = Math.max(w.gas || 0, w.steam || 0), boil = w.steam > 0 ? Math.min(1, 0.3 + w.steam / 0.008) : 0, layer, n, k, p, a, d, size, y, top, domes, q;
        body.visible = surface.visible = wet;
        if (wet) {
          fill(body, shape, shape.floor, level, "body");
          surface.position.y = level;
          surface.scale.set(r - 0.012, 1, r - 0.012);
          liquid.color.copy(fx.color(w.color.rgb));
          if (cloud) liquid.color.lerp(fx.color(w.cloud.rgb), cloud);
          liquid.attenuationColor.copy(fx.color(w.color.rgb));
          liquid.transmission = 1 - 0.9 * cloud;           // trüb: das Licht kommt nicht mehr hindurch
          liquid.roughness = 0.04 + 0.4 * cloud;
          liquid.thickness = Math.min(3, 1.4 * r);
        }
        // Bodensatz und eingedampfter Rückstand: Schichten in der Form des Bodens
        layer = w.sediment && w.sediment.ml > 0.002 ? Math.min((wet ? level - shape.floor : 2) * 0.45, (3 + 9 * Math.sqrt(w.sediment.ml) * (tall ? 1 : 0.5)) / 16) : 0;
        ground.visible = layer > 0;
        if (layer > 0) { fill(ground, shape, shape.floor, shape.floor + layer, "ground"); ground.material.color.copy(fx.color(w.sediment.rgb)); }
        mirror.visible = shine != null && w.mirror && w.mirror.share > 0.02;
        if (mirror.visible) {
          fill(mirror, shape, shape.floor, shine, "mirror");
          mirror.material.color.copy(fx.color(w.mirror.rgb));
          mirror.material.opacity = Math.min(0.97, w.mirror.share);
        }
        crust.visible = w.residue > 1e-7;
        if (crust.visible) fill(crust, shape, shape.floor, shape.floor + Math.min(14, 2.5 + 30 * Math.sqrt(w.residue)) / 16, "crust");
        layer = layer || 0;
        laySolids(w.solids || [], shape, tall, wet);
        drops3.count = 0;
        // heiße Stellen: glühen in ihrer Glühfarbe; was schwimmt, treibt an der Oberfläche, und darüber brennt Wasserstoff
        hotFlame.visible = false;
        var nd = 0, place = function (x, y, z) { if (nd < 16) { dummy.position.set(x, y, z); dummy.scale.setScalar(1); dummy.updateMatrix(); drops3.setMatrixAt(nd++, dummy.matrix); } };
        (ctx.marks || []).forEach(function (mark) {
          var k, q;
          if (mark.key === "spatter" && mark.age < 1) for (k = 0; k < 8; k++) {      // beim Verdünnen: Tropfen fliegen über den Rand
            q = (ctx.still ? 0.4 : mark.age) + 0.12 * pseudo(9, k);
            if (q < 1) place((pseudo(11, k) - 0.5) * 3 * q, (wet ? level : shape.floor) + (shape.rim - shape.floor + 1.5) * 4 * q * (1 - q), (pseudo(12, k) - 0.5) * 2 * q);
          }
          if (mark.key === "popped" && mark.age < 0.8) {     // der Stopfen fliegt heraus: hinauf, zur Seite, sich drehend
            q = ctx.still ? 0.3 : mark.age;
            gauge.visible = mark.type === "manometer";
            flyer.scale.setScalar(shape.inner(shape.rim) / 0.5);    // so breit wie die Öffnung, die er verschlossen hat
            flyer.position.set(q * 3, shape.rim + q * 8 - q * q * 6, 0);
            flyer.rotation.set(q * 6, 0, q * 7);
          }
        });
        flyer.visible = (ctx.marks || []).some(function (mark) { return mark.key === "popped" && mark.age < 0.8; });
        (w.solids || []).forEach(function (s, index) {
          (pieces[index] || []).forEach(function (m) {
            if (s.glow && s.glow.level > 0) m.material.emissive.setRGB(s.glow.rgb[0] / 255, s.glow.rgb[1] / 255, s.glow.rgb[2] / 255, THREE.SRGBColorSpace).multiplyScalar(0.4 + 1.2 * s.glow.level);
            else m.material.emissive.setRGB(0, 0, 0);
            if (!(s.float && wet) || m.userData.r == null) return;
            var span = Math.max(0, r - m.userData.r) * 0.85, moving = s.molten && (s.spatter || s.flame);
            m.position.set(moving ? (Math.sin(t * 2.3 + index) * 0.55 + Math.sin(t * 3.7 + 2 * index) * 0.35) * span : 0.15 * span, level + (s.molten ? 0.3 : 0.6) * m.userData.r,
              moving ? Math.cos(t * 1.9 + index) * 0.5 * span : 0);
            if (s.spatter) for (var k = 0; k < 4; k++) {        // geschmolzenes Metall spritzt: Tropfen steigen auf und fallen zurück
              var q = ((ctx.still ? 0.3 : t) * 1.7 + pseudo(index + 3, k)) % 1;
              place(m.position.x + (pseudo(index + 5, k) - 0.5) * q, m.position.y + 0.9 * Math.sin(Math.PI * q), m.position.z + (pseudo(index + 6, k) - 0.5) * q);
            }
            if (s.flame) {
              hotFlame.visible = true;
              hotFlame.material.uniforms.color.value.set(s.flame.color);
              hotFlame.position.set(m.position.x, m.position.y + m.userData.r * 0.6, m.position.z);
              hotFlame.scale.set(1.8, 1.6 * (1 + (ctx.still ? 0 : 0.12 * Math.sin(t * 17))), 1.8);
            }
          });
        });
        drops3.count = nd;
        drops3.instanceMatrix.needsUpdate = true;

        // Blasen: Gas, das entsteht, und beim Sieden der Dampf. Zahl wie in 2D, beim Sieden mehr und größer.
        n = wet ? Math.min(48, (L.fx && L.fx.count ? L.fx.count(rate) : 0) * 2 + (boil ? 20 : 0)) : 0;
        top = level - 0.05;
        domes = [];
        for (k = 0; k < n; k++) {
          p = pseudo(ctx.seed + 3, k) + t * (0.6 + 0.6 * pseudo(ctx.seed, k)) * (boil ? 1.8 : 1) * (tall ? 0.5 : 1);
          p -= Math.floor(p);
          y = shape.floor + layer + 0.1 + p * Math.max(0, top - shape.floor - layer - 0.1);
          a = pseudo(ctx.seed + 9, k) * 6.2832;
          d = Math.sqrt(pseudo(ctx.seed + 11, k)) * Math.max(0, shape.inner(y) - 0.15) * 0.85;
          size = (boil ? 0.03 + 0.09 * p : 0.025 + 0.03 * pseudo(ctx.seed + 5, k)) * (tall ? 0.8 : 1);
          dummy.position.set(d * Math.cos(a) + (ctx.still ? 0 : 0.08 * Math.sin(t * 5 + k)), y, d * Math.sin(a));
          dummy.scale.set(size, size * 0.85, size);
          if (boil && p > 0.82) {                       // oben angekommen: Wölbung, dann Mulde mit Ring
            q = (p - 0.82) / 0.18;
            dummy.scale.multiplyScalar(q < 0.7 ? 1 : 0);   // geplatzt: die Blase ist weg
            domes.push(q < 0.7 ? [dummy.position.x, dummy.position.z, 1.3 * size * q / 0.7, 1.6 * size + 0.05, 0, 0]
              : [dummy.position.x, dummy.position.z, -0.8 * size * (1 - (q - 0.7) / 0.3), 1.2 * size + 0.04, 0.5 * size * (1 - (q - 0.7) / 0.3), 1 + 3 * (q - 0.7) / 0.3]);
          }
          dummy.updateMatrix();
          bubbles.setMatrixAt(k, dummy.matrix);
        }
        bubbles.count = n;
        bubbles.instanceMatrix.needsUpdate = true;
        if (wet) wave(boil, r, t, ctx.still, domes);

        // Dampf über dem Rand: weiche Flecken, die aufsteigen und vergehen; nicht, wenn er in einen Kühler geht (ctx.sealed)
        var mouth = shape.inner(shape.rim);
        n = w.steam > 0 && !ctx.sealed ? Math.max(6, Math.min(24, Math.round(10 + 5 * Math.log10(w.steam / 1e-3)))) : 0;
        steam.children.forEach(function (s, k) {
          s.visible = k < n;
          if (!s.visible) return;
          var q = pseudo(ctx.seed + 21, k) + t * (0.25 + 0.2 * pseudo(ctx.seed + 22, k)), lift;
          q -= Math.floor(q);
          lift = q * 9;
          s.position.set((pseudo(ctx.seed + 23, k) - 0.5) * mouth * 1.4 + Math.sin(t * 0.8 + k) * q * 1.2, shape.rim - 0.5 + lift, (pseudo(ctx.seed + 24, k) - 0.5) * mouth);
          s.scale.setScalar(0.8 + q * 3.5);
          s.material.opacity = 0.32 * Math.min(1, boil + 0.3) * Math.sin(Math.PI * q);
        });

        // Strahl von oben: es wird gerade zugegeben oder umgegossen
        stream.visible = !!w.inflow;
        if (stream.visible) {
          y = wet ? level : shape.floor;
          stream.scale.set(0.07, shape.rim + 3 - y, 0.07);
          stream.position.set(-r * 0.35 + (ctx.still ? 0 : 0.02 * Math.sin(t * 30)), (shape.rim + 3 + y) / 2, 0);
        }
        burn.update(w, shape, ctx, tall);
      },
      dispose: function () {
        group.traverse(function (o) { if (o.geometry) o.geometry.dispose(); if (o.material && o.material.map !== puffTexture) o.material.dispose(); });
      }
    };
  };

  fx.puff = puff;

  // Was im Gefäß brennt und was an seiner Öffnung geschieht: Flammen am Boden (w.fire), grelles Licht, Glut, Rauch,
  // Gas, das an der Öffnung abbrennt (w.torch), der Span oder Glimmspan der Probe und der Blitz einer Verpuffung (ctx.marks)
  fx.burning = function () {
    var group = new THREE.Group(), cones = [], smoke = [], i;
    var additive = function (color) {
      return new THREE.Sprite(new THREE.SpriteMaterial({ map: puff(), color: color, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0 }));
    };
    for (i = 0; i < 6; i++) { cones.push(fx.cone(0.28, 0xffa040)); group.add(cones[i]); }
    for (i = 0; i < 8; i++) { smoke.push(new THREE.Sprite(new THREE.SpriteMaterial({ map: puff(), transparent: true, depthWrite: false, opacity: 0 }))); group.add(smoke[i]); }
    var glow = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 10), new THREE.MeshBasicMaterial({ color: 0xff7a2a, transparent: true, opacity: 0.6, toneMapped: false }));
    var glare = additive(0xffffff), core = additive(0xffffff), flash = additive(0xfff2b0), torch = fx.cone(0.3, 0xa9c2ff), tip = fx.cone(0.16, 0xffb040);
    var stick = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 3.2, 8).translate(0, 1.6, 0), fx.matte(0xc9a06a, 0.8));
    var ember = new THREE.Mesh(new THREE.SphereGeometry(0.1, 10, 8), new THREE.MeshBasicMaterial({ color: 0xff6a1a, toneMapped: false }));
    // feuchtes Indikatorpapier: ein Streifen, schräg wie der Span gehalten, in der Farbe, die er annimmt
    var strip = new THREE.Mesh(new THREE.BoxGeometry(0.35, 2.4, 0.02).translate(0, 1.2, 0), new THREE.MeshStandardMaterial({ color: 0xf2e7a0, roughness: 0.9 }));
    stick.rotation.z = strip.rotation.z = -0.85;
    group.add(glow, glare, core, flash, torch, tip, stick, ember, strip);

    function puffs(from, n, color, t, seed, rise) {
      smoke.forEach(function (s, k) {
        if (k >= n) return;
        var q = pseudo(seed, k) + t * (0.3 + 0.2 * pseudo(seed + 1, k));
        q -= Math.floor(q);
        s.visible = true;
        s.material.color.set(color);
        s.position.set(from.x + (pseudo(seed + 2, k) - 0.5) * 1.2 * q, from.y + q * rise, from.z);
        s.scale.setScalar(0.6 + q * 2.5);
        s.material.opacity = 0.5 * Math.sin(Math.PI * q);
      });
    }

    return {
      group: group,
      update: function (w, shape, ctx, tall) {
        var t = ctx.still ? 0 : ctx.t, seed = ctx.seed || 1, used = 0, floor = shape.floor + 0.05, width = 2 * shape.inner(shape.floor + 0.2), rim = shape.rim;
        cones.forEach(function (c) { c.visible = false; });
        smoke.forEach(function (s) { s.visible = false; });
        glow.visible = glare.visible = core.visible = flash.visible = torch.visible = tip.visible = stick.visible = ember.visible = strip.visible = false;
        (w.fire || []).forEach(function (one, index) {
          var k, h, a;
          if (!(one.rate > 0)) return;
          if (one.glow) {                                    // Glut statt Flamme
            glow.visible = true;
            glow.material.color.set(one.color);
            glow.material.opacity = 0.45 + (ctx.still ? 0 : 0.2 * Math.sin(t * 3 + seed));
            glow.scale.set(width * 0.3, 0.3, width * 0.3);
            glow.position.set(0, floor + 0.1, 0);
          } else for (k = 0; k < 3 && used < cones.length; k++) {
            a = ctx.still ? 0 : Math.sin(t * (13 + 3 * k) + seed + k * 1.9);
            h = (16 + 12 * pseudo(seed + index, k)) / 16 * (1 + 0.18 * a);
            cones[used].visible = true;
            cones[used].material.uniforms.color.value.set(one.color);
            cones[used].material.uniforms.strength.value = 1.6;
            cones[used].scale.set(1, h, 1);
            cones[used].position.set((k - 1) * Math.min(0.75, width * 0.2), floor, (pseudo(seed + 4, k) - 0.5) * width * 0.3);
            used++;
          }
          if (one.glare > 0.5) {                             // grelles Licht (Magnesium)
            glare.visible = core.visible = true;
            glare.material.opacity = 1;
            glare.scale.setScalar(46 / 16 * one.glare * 4 * (1 + (ctx.still ? 0 : 0.06 * Math.sin(t * 23 + seed))));
            glare.position.set(0, floor + 0.75, 0);
            core.material.opacity = 1;                       // ein kleiner, ganz heller Kern im Schein
            core.scale.setScalar(46 / 16 * one.glare * 1.2);
            core.position.copy(glare.position);
          }
          if (one.smoke) puffs(new THREE.Vector3(0, rim, 0), 8, one.smoke, t, seed + 31 + index, 8);
        });
        if (w.torch) {                                       // Gas brennt an der Öffnung ab: kleine, blasse Flamme
          torch.visible = true;
          torch.scale.set(1, 1.3 * (1 + (ctx.still ? 0 : 0.1 * Math.sin(t * 19))), 1);
          torch.position.set(0, rim, 0);
        }
        (ctx.marks || []).forEach(function (mark) {
          var sx = tall ? 0.25 : shape.inner(rim) * 0.5, at = new THREE.Vector3(sx, rim - 0.25, 0), part, burning, big;
          if (mark.key === "splint" && mark.kind === "paper" && mark.age < 2) {
            strip.visible = true;
            strip.position.copy(at);
            if (mark.rgb) strip.material.color.setRGB(mark.rgb[0] / 255, mark.rgb[1] / 255, mark.rgb[2] / 255, THREE.SRGBColorSpace);
          } else if (mark.key === "splint" && mark.age < 2) {
            burning = mark.kind === "flame" ? mark.result !== "out" && mark.result !== "pop" : mark.result === "relight";
            big = mark.result === "flare" || mark.result === "relight";
            stick.visible = true;
            stick.position.copy(at);
            if (burning) {
              tip.visible = true;
              tip.position.copy(at);
              tip.scale.set(big ? 1.6 : 1, (big ? 1.5 : 0.8) * (1 + (ctx.still ? 0 : 0.1 * Math.sin(t * 15))), big ? 1.6 : 1);
            } else if (mark.kind === "glow" && mark.result !== "out") {
              ember.visible = true;
              ember.position.copy(at);
            } else if (mark.result === "out") puffs(at, 3, 0x9a9a9a, t, 5, 2);
          }
          if (mark.key === "spatter" && mark.age < 1.5) puffs(new THREE.Vector3(0, rim - 0.6, 0), 5, 0xf2f2f2, t, 9, 2.5);      // es spritzt: Dampf steigt über dem Rand auf
          if ((mark.key === "pop" || mark.key === "popped" || (mark.key === "splint" && mark.result === "pop")) && (mark.level > 0 || mark.key === "popped") && mark.age >= 0 && mark.age < 0.5) {
            part = mark.age / 0.5;
            flash.visible = true;
            flash.material.opacity = 0.9 * (1 - part);
            flash.scale.setScalar((10 + 12 * (mark.level || 1)) / 16 * (0.35 + 0.65 * part) * 2.5);
            flash.position.set(0, rim + 0.4, 0);
          }
        });
      }
    };
  };

  // Ein Schild am Fuß: Nummer und Füllung, wie unter dem Gefäß in 2D
  fx.badge = function (kit, d, w) {
    var text = String(d.ctx.no || "");
    if (d.ctx.numbers && d.ctx.volumes !== false && w.ml > 0.005) text += (text ? " · " : "") + L.num(w.ml, 1, d.ctx.lang) + " mL";
    return text;
  };

  // Scherben eines zersprungenen Gefäßes, flach auf dem Tisch
  fx.shards = function (half, seed) {
    var group = new THREE.Group(), mat = fx.glass(), k, shape, a;
    mat.opacity = 0.35;
    for (k = 0; k < 7; k++) {
      shape = new THREE.Shape();
      a = pseudo(seed, k) * 0.6 + 0.3;
      shape.moveTo(0, 0); shape.lineTo(a, 0.1 + pseudo(seed + 1, k) * 0.3); shape.lineTo(0.15 + pseudo(seed + 2, k) * 0.4, a);
      var m = new THREE.Mesh(new THREE.ShapeGeometry(shape).rotateX(-Math.PI / 2), mat);
      m.position.set((pseudo(seed + 3, k) - 0.5) * half * 2.4, 0.02, (pseudo(seed + 4, k) - 0.5) * half);
      m.rotation.y = pseudo(seed + 5, k) * 6.28;
      group.add(m);
    }
    return group;
  };

  // ------------------------------------------------------------------ Teile, die sich nur selten ändern

  // Baut die Untergruppe name neu, wenn sich key ändert (Maße aus place, Größe des Gefäßes); sonst bleibt sie
  fx.rebuild = function (group, name, key, build) {
    var u = group.userData, sub = u[name];
    if (sub && u[name + "Key"] === key) return sub;
    if (sub) { group.remove(sub); sub.traverse(function (o) { if (o.geometry) o.geometry.dispose(); [].concat(o.material || []).forEach(function (m) { if (m.map) m.map.dispose(); m.dispose(); }); }); }
    sub = u[name] = new THREE.Group();
    u[name + "Key"] = key;
    build(sub);
    group.add(sub);
    return sub;
  };

  // Ein Stab von a nach b (Vector3), Radius r
  fx.rod = function (a, b, r, mat) {
    var m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, a.distanceTo(b), 12), mat);
    m.position.copy(a).add(b).multiplyScalar(0.5);
    m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize());
    m.castShadow = true;
    return m;
  };

  fx.steel = function () { return fx.style.metal === "brass" ? fx.matte(0xc9a24a, 0.32, 1) : fx.matte(0xb9c0c7, 0.3, 0.85); };
  fx.wood = function () { return fx.matte(fx.style.wood, 0.65); };
  fx.iron = function () { return fx.matte(0x33373d, 0.45, 0.7); };

  // Stativ: Fuß und Stange bei (x, z) vom Boden floor bis top; grips: Klemmen [{ y, x, r, across }] mit Backen um ein Rohr bei x (z = 0)
  fx.stand = function (sub, x, z, floor, top, grips) {
    var steel = fx.steel(), foot = new THREE.Mesh(new THREE.BoxGeometry(7, 0.35, 11), fx.matte(0x3a3f45, 0.5, 0.3));
    foot.position.set(x, floor + 0.175, z - 2);
    foot.castShadow = foot.receiveShadow = true;
    sub.add(foot, fx.rod(new THREE.Vector3(x, floor, z), new THREE.Vector3(x, top, z), 0.4, steel));
    (grips || []).forEach(function (g) {
      sub.add(fx.rod(new THREE.Vector3(x, g.y, z), new THREE.Vector3(g.x, g.y, 0), 0.22, steel));
      var jaw = new THREE.Mesh(new THREE.TorusGeometry(g.r + 0.12, 0.12, 8, 20), fx.matte(0x8a5a2b, 0.7));
      if (g.across) jaw.rotation.y = Math.PI / 2; else jaw.rotation.x = Math.PI / 2;      // across: das Rohr liegt waagrecht (Kolbenprober)
      jaw.position.set(g.x, g.y, 0); jaw.castShadow = true;
      sub.add(jaw);
    });
  };

  // Flamme: Kegel mit weichem Rand, additiv gemischt (aus der Demo)
  fx.flameMaterial = function (color) {
    return new THREE.ShaderMaterial({
      uniforms: { color: { value: new THREE.Color(color) }, strength: { value: 1 } },
      vertexShader: "varying vec3 vN; varying vec3 vV; varying float vH;\n" +
        "void main() { vec4 mv = modelViewMatrix * vec4(position, 1.0); vN = normalize(normalMatrix * normal); vV = normalize(-mv.xyz); vH = uv.y; gl_Position = projectionMatrix * mv; }",
      fragmentShader: "uniform vec3 color; uniform float strength; varying vec3 vN; varying vec3 vV; varying float vH;\n" +
        "void main() { float a = pow(abs(dot(vN, vV)), 1.5) * (1.0 - 0.7 * vH) * strength; gl_FragColor = vec4(color * a, a);\n" +
        "#include <colorspace_fragment>\n}",          // wie die anderen Materialien in sRGB umrechnen, sonst wirkt die Flamme zu blass
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide
    });
  };

  fx.cone = function (r, color) {
    var geo = new THREE.ConeGeometry(r, 1, 32, 1, true);
    geo.translate(0, 0.5, 0);
    var m = new THREE.Mesh(geo, fx.flameMaterial(color));
    m.renderOrder = 4;
    return m;
  };

  // Anzeige eines Geräts: dunkles LCD mit hellen Ziffern, Breite und Höhe in cm; write(text) schreibt nur, wenn sich etwas ändert
  fx.screen = function (w, h) {
    var paper = fx.style.display === "paper";
    var c = doc.createElement("canvas"), g = c.getContext("2d"), tex = new THREE.CanvasTexture(c);
    var mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: tex, toneMapped: false }));
    c.width = 256; c.height = Math.round(256 * h / w);
    tex.colorSpace = THREE.SRGBColorSpace;
    mesh.userData.write = function (text) {
      if (text === mesh.userData.text) return;
      mesh.userData.text = text;
      // LCD: dunkel mit hellen Ziffern; Papier (1880): vergilbte Skala mit Tinte
      g.fillStyle = paper ? "#efe3c2" : "#1c2722"; g.fillRect(0, 0, c.width, c.height);
      g.fillStyle = paper ? "#3b2a1a" : "#a6f2c4"; g.textAlign = "center"; g.textBaseline = "middle";
      if (paper) { g.strokeStyle = "#8a6a3a"; g.lineWidth = 4; g.strokeRect(4, 4, c.width - 8, c.height - 8); }
      var size = Math.round(c.height * 0.55), face = paper ? "px Georgia, 'Times New Roman', serif" : "px ui-monospace, monospace";
      do { g.font = "600 " + size + face; size -= 2; } while (g.measureText(text).width > c.width * 0.9 && size > 10);
      g.fillText(text, c.width / 2, c.height * 0.54);
      tex.needsUpdate = true;
    };
    return mesh;
  };
})(typeof globalThis !== "undefined" ? globalThis : this);
