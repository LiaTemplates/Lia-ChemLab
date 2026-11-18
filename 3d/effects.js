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
    // zwei Schichten: oil ist das Material der Ölschicht, upper der Körper der oberen Schicht (die untere ist body)
    var oil = liquid.clone(), upper = new THREE.Mesh(new THREE.BufferGeometry(), oil);
    // Öltropfen im Wasser nach dem Schütteln oder Mixen
    var beads = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 8, 6), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3 }), 60);
    // Strömungsansicht: dasselbe Feld wie in 2D auf einer senkrechten Schnittebene durch die Mitte, an der Glaswand ausgeschnitten
    var sheet = doc.createElement("canvas"), sheetTex, cut;
    sheet.width = 64; sheet.height = 96;
    sheetTex = new THREE.CanvasTexture(sheet);
    sheetTex.colorSpace = THREE.SRGBColorSpace;
    cut = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: sheetTex, alphaTest: 0.5, side: THREE.DoubleSide }));
    // oder als Teilchen im ganzen Glas: das 2D-Feld um die Achse gedreht (ein Becherglas ist rund), je Teilchen [Abstand zur Achse 0…1, Winkel, Höhe 0…1]
    // oder als Volumen: der Schnitt um die Achse gedreht (für das Feld im Becherglas genau das Gerechnete, für die Strömung eine Annahme:
    // linke und rechte Hälfte gemittelt). Ein Würfel um die Flüssigkeit; je Bildpunkt läuft der Sehstrahl in VOL Schritten hindurch und
    // sammelt Farbe und Deckkraft von vorn nach hinten. Deckend ist, was farbig ist (1 − kleinster Farbanteil), DENSE je cm; außerhalb
    // der Flüssigkeit ist der Schnitt durchsichtig
    var VOL = 48, DENSE = 1.0;
    var volume = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.ShaderMaterial({
      uniforms: { map: { value: sheetTex }, toLocal: { value: new THREE.Matrix4() }, toWorld: { value: new THREE.Matrix3() }, dense: { value: DENSE } },
      vertexShader: "varying vec3 vWorld; void main() { vec4 w = modelMatrix * vec4(position, 1.0); vWorld = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }",
      fragmentShader: [
        "uniform sampler2D map; uniform mat4 toLocal; uniform mat3 toWorld; uniform float dense; varying vec3 vWorld;",
        "void main() {",
        // gezeichnet wird die Rückseite (keine Fläche liegt auf der Flüssigkeitsoberfläche): von dort zurück bis zur Vorderseite, dann nach vorn
        "  vec3 e = (toLocal * vec4(vWorld, 1.0)).xyz, d = normalize((toLocal * vec4(vWorld - cameraPosition, 0.0)).xyz);",
        "  vec3 t3 = (-sign(d) * 0.5 - e) / -d; float t = min(min(t3.x, t3.y), t3.z), dt = t / " + VOL + ".0, ds = dt * length(toWorld * d);",
        "  vec3 p = e - d * t;",
        "  vec4 acc = vec4(0.0);",
        "  for (int i = 0; i < " + VOL + "; i++) {",
        "    vec3 q = p + d * dt * (float(i) + 0.5); float r = length(q.xz) * 2.0, v = q.y + 0.5;",
        "    if (r > 1.0) continue;",
        "    vec4 a = texture2D(map, vec2(0.5 + 0.5 * r, v)), b = texture2D(map, vec2(0.5 - 0.5 * r, v));",
        "    if (a.a < 0.5 || b.a < 0.5) continue;",
        "    vec3 c = (a.rgb + b.rgb) * 0.5; float k = 1.0 - exp(-dense * (1.0 - min(min(c.r, c.g), c.b)) * ds);",
        "    acc.rgb += (1.0 - acc.a) * k * c; acc.a += (1.0 - acc.a) * k;",
        "    if (acc.a > 0.98) break;",
        "  }",
        "  if (acc.a < 0.004) discard;",
        "  gl_FragColor = vec4(acc.rgb / acc.a, acc.a);",
        "}"].join("\n"),
      transparent: true, depthWrite: false, side: THREE.BackSide }));
    volume.visible = false; volume.renderOrder = 2;
    volume.onBeforeRender = function () { volume.material.uniforms.toLocal.value.copy(volume.matrixWorld).invert(); volume.material.uniforms.toWorld.value.setFromMatrix4(volume.matrixWorld); };
    var SWARM = 400, flock = null, tone = new THREE.Color();
    var swarm = new THREE.Points(new THREE.BufferGeometry(), new THREE.PointsMaterial({ size: 0.6, vertexColors: true, map: puff(), alphaTest: 0.35, sizeAttenuation: true }));
    swarm.geometry.setAttribute("position", new THREE.BufferAttribute(new Float32Array(3 * SWARM), 3));
    swarm.geometry.setAttribute("color", new THREE.BufferAttribute(new Float32Array(3 * SWARM), 3));
    swarm.visible = false; swarm.frustumCulled = false;
    beads.count = 0; beads.frustumCulled = false; cut.visible = false; upper.renderOrder = 1;
    var surface = new THREE.Mesh(new THREE.RingGeometry(0.001, 1, 96, 28).rotateX(-Math.PI / 2), liquid);
    var base = surface.geometry.attributes.position.array.slice();
    var ground = new THREE.Mesh(new THREE.BufferGeometry(), fx.matte(0xffffff, 0.95));
    var crust = new THREE.Mesh(new THREE.BufferGeometry(), fx.matte(0xf2f0ea, 0.9));
    // Schaum über der Flüssigkeit, und was über den Rand quillt, als Haube
    var froth = new THREE.Mesh(new THREE.BufferGeometry(), fx.matte(0xffffff, 0.95));
    var heap = new THREE.Mesh(new THREE.SphereGeometry(1, 24, 10, 0, Math.PI * 2, 0, Math.PI / 2), froth.material);
    // farbiges Gas im Gasraum (NO2): ein durchscheinender Körper vom Spiegel bis zum Rand
    var fog = new THREE.Mesh(new THREE.BufferGeometry(), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, depthWrite: false }));
    fog.renderOrder = 1;
    // ein Spiegel am Glas (Silberspiegel): eine Metallhaut knapp innerhalb der Wand
    var mirror = new THREE.Mesh(new THREE.BufferGeometry(), new THREE.MeshStandardMaterial({ color: 0xd0d4d8, metalness: 1, roughness: 0.12, transparent: true, side: THREE.DoubleSide }));
    mirror.renderOrder = 1;
    var solids = new THREE.Group();
    var bubbles = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 12, 8), new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 1, roughness: 0.03 }), 48);
    // der Strahl: kräftig genug, dass man ihn auch vor einem weißen Deckel (Kalorimeter) sieht, und nach durchscheinenden Wänden gezeichnet
    var steam = new THREE.Group(), stream = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 1, 12, 1, true),
      new THREE.MeshPhysicalMaterial({ color: 0x7fb0dc, roughness: 0.05, metalness: 0.1, transparent: true, opacity: 0.9, depthWrite: false }));
    stream.renderOrder = 3;
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
    group.add(body, upper, beads, cut, volume, swarm, surface, ground, crust, froth, heap, fog, mirror, solids, bubbles, steam, stream, burn.group, hotFlame, drops3, flyer);

    // Drehkörper der Form bis zur Höhe top, nur neu, wenn sich die Höhe merklich ändert
    function fill(mesh, shape, from, top, key) {
      var pts = [[0, from]], n = shape.steps || 16, k;
      if (keys[key] === from.toFixed(3) + top.toFixed(3) + shape.id) return;
      keys[key] = from.toFixed(3) + top.toFixed(3) + shape.id;
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
      // shine: Höhe, bis zu der ein Spiegel am Glas reicht (null: keiner); split: Höhe der Grenze zwischen zwei Schichten (null: keine)
      // froth: Höhe, bis zu der Schaum steht (null: keiner)
      update: function (w, shape, level, ctx, tall, shine, split, froth3) {
        var wet = w.ml > 0.005, r = shape.inner(level), t = ctx.still ? 0 : ctx.t, cloud = w.cloud && w.cloud.alpha > 0.02 ? w.cloud.alpha : 0;
        var rate = Math.max(w.gas || 0, w.steam || 0), boil = w.steam > 0 ? Math.min(1, 0.3 + w.steam / 0.008) : 0, layer, n, k, p, a, d, size, y, top, domes, q;
        var two = wet && w.oil && split != null && split > shape.floor + 0.01 && split < level - 0.01;
        var allOil = wet && w.oil && !two && w.oil.ml > w.ml - 0.01;      // nur Öl, ohne Wasser darunter
        body.visible = surface.visible = wet;
        upper.visible = two;
        if (wet) {
          fill(body, shape, shape.floor, two ? split : level, "body");
          if (two) fill(upper, shape, split, level, "upper");
          body.material = allOil || (two && !w.oil.top) ? oil : liquid;
          upper.material = two && w.oil.top ? oil : liquid;
          surface.material = allOil || (two && w.oil.top) ? oil : liquid;
          surface.position.y = level;
          surface.scale.set(r - 0.012, 1, r - 0.012);
          liquid.color.copy(fx.color(w.color.rgb));
          if (cloud) liquid.color.lerp(fx.color(w.cloud.rgb), cloud);
          liquid.attenuationColor.copy(fx.color(w.color.rgb));
          liquid.transmission = 1 - 0.9 * cloud;           // trüb: das Licht kommt nicht mehr hindurch
          liquid.roughness = 0.04 + 0.4 * cloud;
          // dünn gerechnet: bei der vollen Dicke des Glases verschiebt die Brechung, was in der Flüssigkeit steht (Elektroden, Fühler), aus dem Bild
          liquid.thickness = Math.min(0.4, 0.5 * r);
          // die Lösung leuchtet (Luminol, UV-Lampe): selbstleuchtend in ihrer Farbe
          if (w.shine) liquid.emissive.copy(fx.color(w.shine.rgb)).multiplyScalar(1.5 * w.shine.level);
          else liquid.emissive.setRGB(0, 0, 0);
          // Öl: die Farbe aus 2D, in der Tiefe nur halb so kräftig (sonst wird goldgelbes Öl im breiten Glas braun)
          if (w.oil) { oil.color.copy(fx.color(w.oil.color.rgb)); oil.attenuationColor.copy(oil.color).lerp(new THREE.Color(0xffffff), 0.5); oil.thickness = liquid.thickness; }
        }
        // Öltropfen: im noch trüben Teil der wässrigen Schicht, grobe steigen sichtbar, feine stehen fast
        beads.count = 0;
        if (wet && w.oil && w.oil.drops > 0) {
          var waterTop = two && w.oil.top ? split : level, depth = (waterTop - shape.floor) * Math.min(1, w.oil.drops), big = w.oil.r > 5e-5, rise = big ? 0.6 : 0.025;
          beads.material.color.copy(fx.color(w.oil.color.rgb));
          for (k = 0; k < 60; k++) {
            p = pseudo(ctx.seed + 31, k) + t * rise * (0.6 + 0.8 * pseudo(ctx.seed + 32, k)) / Math.max(0.1, depth);
            p -= Math.floor(p);
            y = waterTop - depth + p * depth;
            a = pseudo(ctx.seed + 33, k) * 6.2832;
            d = Math.sqrt(pseudo(ctx.seed + 34, k)) * Math.max(0, shape.inner(y) - 0.1);
            size = big ? 0.05 : 0.025;
            dummy.position.set(d * Math.cos(a), y, d * Math.sin(a));
            dummy.scale.setScalar(size);
            dummy.updateMatrix();
            beads.setMatrixAt(k, dummy.matrix);
          }
          beads.count = Math.round(Math.min(60, 10 + 50 * w.oil.drops));
          beads.instanceMatrix.needsUpdate = true;
        }
        // Strömung: Temperatur, Wirbel, Druck oder Schlieren; ctx.flow3d wählt, wie: als Schnittebene ("cut") oder als Teilchen ("particles").
        // Grundton ist die Farbe der Schicht, darüber das Feld, kräftiger als in 2D: Glas und Brechung machen es blasser
        // ein Feld im Becherglas (spatial) zeigt sich immer, auch ohne Strömungsansicht, und hat Vorrang vor ihr
        var cells = wet && w.field && L.fx && L.fx.fieldCells ? L.fx.fieldCells(w.field)
          : wet && ctx.flow && L.fx && L.fx.flowCells ? L.fx.flowCells(w, ctx.t, "3d-" + (ctx.uid || "") + "-" + w.id, ctx.flow, ctx.still) : null;
        var shown = cells ? ctx.flow3d || "cut" : null;
        function tint3(c, yy) {
          var base = (two && (yy > split) === w.oil.top) || allOil ? w.oil.color.rgb : w.color.rgb, a = Math.min(1, 1.5 * c[3]);
          return [base[0] + (c[0] - base[0]) * a, base[1] + (c[1] - base[1]) * a, base[2] + (c[2] - base[2]) * a];
        }
        swarm.visible = shown === "particles";
        if (swarm.visible) {
          var at = swarm.geometry.attributes.position.array, hue = swarm.geometry.attributes.color.array, step, out, inn, f1, f2, hh, R, rgb;
          if (!flock || ctx.t < flock.t - 1e-9 || ctx.t - flock.t > 5) {
            flock = [];
            for (k = 0; k < SWARM; k++) flock.push([Math.sqrt(pseudo(ctx.seed + 41, k)), pseudo(ctx.seed + 42, k) * 6.2832, pseudo(ctx.seed + 43, k)]);
            flock.t = ctx.t;
          }
          step = ctx.still ? 0 : Math.min(0.2, ctx.t - flock.t);
          flock.t = ctx.t;
          // gedreht erhält das ebene 2D-Feld das Volumen nicht ganz, die Teilchen sammelten sich an der Achse: jedes lebt etwa 8 s und kommt dann neu
          flock.due = (flock.due || 0) + step * SWARM / 8;
          for (; flock.due >= 1; flock.due--) {
            flock.next = ((flock.next || 0) + 1) % SWARM;
            flock[flock.next] = [Math.sqrt(Math.random()), Math.random() * 6.2832, Math.random()];
          }
          for (k = 0; k < SWARM; k++) {
            p = flock[k];
            out = 0.5 + 0.5 * p[0]; inn = 0.5 - 0.5 * p[0];
            f1 = cells.flow(out, 1 - p[2]); f2 = cells.flow(inn, 1 - p[2]);
            // nach außen: rechts die Strömung nach rechts, links die nach links; gemittelt, damit das Feld rund wird
            p[0] = Math.max(0, Math.min(0.97, p[0] + (f1[0] - f2[0]) * step));
            p[2] = Math.max(0.01, Math.min(0.99, p[2] - (f1[1] + f2[1]) / 2 * step));
            hh = shape.floor + p[2] * (level - shape.floor);
            R = Math.max(0, shape.inner(hh) - 0.08) * p[0];
            at[3 * k] = R * Math.cos(p[1]); at[3 * k + 1] = hh; at[3 * k + 2] = R * Math.sin(p[1]);
            rgb = tint3(cells.color(out, 1 - p[2]), hh);
            tone.setRGB(rgb[0] / 255, rgb[1] / 255, rgb[2] / 255, THREE.SRGBColorSpace);
            hue[3 * k] = tone.r; hue[3 * k + 1] = tone.g; hue[3 * k + 2] = tone.b;
          }
          swarm.geometry.attributes.position.needsUpdate = true;
          swarm.geometry.attributes.color.needsUpdate = true;
        }
        cut.visible = shown === "cut";
        volume.visible = shown === "volume";
        // als Volumen ist das Feld die Flüssigkeit: ihr Körper und ihre Oberfläche würden es im Tiefenpuffer verdecken
        if (volume.visible) body.visible = surface.visible = upper.visible = false;
        if (cut.visible || volume.visible) {
          var wide = 0, g = sheet.getContext("2d"), img, px, py, yy, xx, half, c, o;
          if (cells) {
            for (k = 0; k <= 12; k++) wide = Math.max(wide, shape.inner(shape.floor + (level - shape.floor) * k / 12));
            img = g.createImageData(sheet.width, sheet.height);
            for (py = 0; py < sheet.height; py++) {
              yy = level - (level - shape.floor) * (py + 0.5) / sheet.height;
              half = shape.inner(yy) - 0.03;
              for (px = 0; px < sheet.width; px++) {
                xx = -wide + (px + 0.5) / sheet.width * 2 * wide;
                o = 4 * (py * sheet.width + px);
                if (Math.abs(xx) > half) { img.data[o + 3] = 0; continue; }
                c = tint3(cells.color((xx + wide) / (2 * wide), (level - yy) / (level - shape.floor)), yy);
                img.data[o] = c[0]; img.data[o + 1] = c[1]; img.data[o + 2] = c[2];
                img.data[o + 3] = 255;
              }
            }
            cells.dots.forEach(function (dot) {      // Spurteilchen als dunkle Punkte
              var x0 = Math.round(dot[0] * sheet.width), y0 = Math.round(dot[1] * sheet.height), ox, oy, q;
              for (ox = 0; ox < 2; ox++) for (oy = 0; oy < 2; oy++) {
                q = 4 * (Math.min(sheet.height - 1, y0 + oy) * sheet.width + Math.min(sheet.width - 1, x0 + ox));
                if (img.data[q + 3]) { img.data[q] = 51; img.data[q + 1] = 71; img.data[q + 2] = 91; }
              }
            });
            g.putImageData(img, 0, 0);
            sheetTex.needsUpdate = true;
            cut.scale.set(2 * wide, level - shape.floor, 1);
            cut.position.set(0, (level + shape.floor) / 2, 0);
            volume.scale.set(2 * wide, level - shape.floor, 2 * wide);
            volume.position.copy(cut.position);
          }
        }
        // die Flüssigkeit selbst wird farblos klar: die Farbe tragen Ebene oder Teilchen, sonst färbte die Schicht davor sie ein zweites Mal
        if (shown) [liquid, oil].forEach(function (m) { m.color.set(0xffffff); m.attenuationColor.set(0xffffff); m.transmission = 1; m.roughness = 0.04; });
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
        froth.visible = wet && froth3 != null && froth3 > level + 0.02;
        heap.visible = froth.visible && w.ml + w.foam > w.cap;
        if (froth.visible) {
          fill(froth, shape, level, Math.min(froth3, shape.rim), "froth");
          froth.material.color.copy(fx.color(w.color.rgb)).lerp(new THREE.Color(0xffffff), 0.75);
          if (heap.visible) {
            var dome = Math.min(4, 0.4 + 0.8 * Math.log(1 + (w.ml + w.foam - w.cap) / 10)), wide = shape.inner(shape.rim) * 1.15;
            heap.scale.set(wide, dome, wide);
            heap.position.set(0, shape.rim, 0);
          }
        }
        fog.visible = !!w.fog && Math.min.apply(null, w.fog.rgb) < 247;
        if (fog.visible) {
          fill(fog, shape, wet ? Math.max(level, froth.visible ? Math.min(froth3, shape.rim) : level) : shape.floor, shape.rim, "fog");
          fog.material.color.copy(fx.color(w.fog.rgb));
          fog.material.opacity = Math.min(0.85, (255 - Math.min.apply(null, w.fog.rgb)) / 255);
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

        // Blasen: Gas, das entsteht, steigt in gleichmäßigen Perlen (Zahl wie in 2D). Beim Sieden kommen die Dampfblasen aus dem
        // gemeinsamen Modell (L.fx.boiling): an Keimstellen am Boden wachsen, aufsteigen, oben wölben und platzen
        n = 0;
        top = level - 0.05;
        domes = [];
        var gasN = wet && w.gas > 0 ? Math.min(24, (L.fx && L.fx.count ? L.fx.count(w.gas) : 0) * 2) : 0;
        for (k = 0; k < gasN; k++) {
          p = pseudo(ctx.seed + 3, k) + t * (0.6 + 0.6 * pseudo(ctx.seed, k)) * (tall ? 0.5 : 1);
          p -= Math.floor(p);
          y = shape.floor + layer + 0.1 + p * Math.max(0, top - shape.floor - layer - 0.1);
          a = pseudo(ctx.seed + 9, k) * 6.2832;
          d = Math.sqrt(pseudo(ctx.seed + 11, k)) * Math.max(0, shape.inner(y) - 0.15) * 0.85;
          size = (0.025 + 0.03 * pseudo(ctx.seed + 5, k)) * (tall ? 0.8 : 1);
          dummy.position.set(d * Math.cos(a) + (ctx.still ? 0 : 0.08 * Math.sin(t * 5 + k)), y, d * Math.sin(a));
          dummy.scale.set(size, size * 0.85, size);
          dummy.updateMatrix();
          bubbles.setMatrixAt(n++, dummy.matrix);
        }
        if (wet && boil && L.fx && L.fx.boiling) {
          var floor = shape.floor + layer, depth = Math.max(0, top - floor);
          L.fx.boiling(boil, depth, ctx.t, ctx.seed || 1, ctx.still).forEach(function (b) {
            if (n >= 48) return;
            var yy = floor + b.y, rr = Math.max(0, shape.inner(Math.min(yy, top)) - 0.15) * 0.85, x = b.u * rr, z = b.v * rr, size = b.r * (tall ? 0.8 : 1), q;
            if (b.stage === "burst") {                              // oben angekommen: Wölbung, dann Mulde mit Ring
              q = b.q;
              domes.push(q < 0.35 ? [x, z, 1.3 * size * q / 0.35, 1.6 * size + 0.05, 0, 0]
                : [x, z, -0.8 * size * (1 - (q - 0.35) / 0.65), 1.2 * size + 0.04, 0.5 * size * (1 - (q - 0.35) / 0.65), 1 + 3 * (q - 0.35) / 0.65]);
              if (q >= 0.35) return;                                // geplatzt: die Blase ist weg
              yy = top - size * 0.4;
            } else if (b.stage === "grow") yy = floor + size * 0.85;
            dummy.position.set(x, Math.min(yy, top), z);
            dummy.scale.set(size, size * 0.85, size);
            dummy.updateMatrix();
            bubbles.setMatrixAt(n++, dummy.matrix);
          });
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
          stream.scale.set(0.15, shape.rim + 5 - y, 0.15);
          stream.position.set(-r * 0.35 + (ctx.still ? 0 : 0.02 * Math.sin(t * 30)), (shape.rim + 5 + y) / 2, 0);
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
    if (w.field) text += (text ? " · " : "") + "⏱ ×" + w.field.speed;      // das Feld läuft im Zeitraffer
    return text;
  };

  // Scherben eines zersprungenen Gefäßes, flach auf dem Tisch
  // Scherben eines zersprungenen Gefäßes wie in 2D (L.fx.shatter): flache Stücke aus der Wand, die nach außen fliegen, sich drehen
  // und auf dem Tisch liegen bleiben. R, H: Radius und Höhe des Gefäßes in cm. Bewegt werden sie mit fx.shardsAt
  fx.shards = function (R, H, seed) {
    var group = new THREE.Group(), mat = fx.glass(), edge = new THREE.LineBasicMaterial({ color: 0x6f8296, transparent: true, opacity: 0.7 });
    mat.opacity = 0.45; mat.side = THREE.DoubleSide;
    (L.fx.shatter(R, H, null, seed, true, 0) || []).forEach(function (s) {
      var shape = new THREE.Shape();
      s.pts.forEach(function (q, i) { if (i) shape.lineTo(q[0], q[1]); else shape.moveTo(q[0], q[1]); });
      var geo = new THREE.ShapeGeometry(shape), m = new THREE.Mesh(geo, mat);
      m.add(new THREE.LineSegments(new THREE.EdgesGeometry(geo), edge));
      m.renderOrder = 3;
      group.add(m);
    });
    group.userData = { R: R, H: H, seed: seed };
    return group;
  };
  // Lage der Scherben age Sekunden nach dem Bruch (null: liegen schon); drop: so hoch stand das Gefäß (cm), floor: Höhe des Tischs
  fx.shardsAt = function (group, age, still, drop, floor) {
    var u = group.userData, list = L.fx.shatter(u.R, u.H, age, u.seed, still, drop);
    list.forEach(function (s, i) {
      var m = group.children[i], th = Math.atan2(s.x, s.z);
      if (!m) return;
      m.position.set(s.x, floor + s.y + 0.02, s.z);
      m.rotation.set(-Math.PI / 2 * s.flat, th, s.spin, "YXZ");      // im Flug quer zur Wand, liegend flach auf dem Tisch
    });
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
  // Stativ: Platte und Stange hinter der Reihe der Geräte. Die Platte liegt mittig unter der Stange und reicht nach hinten,
  // so steht sie keinem Gefäß im Weg (die Gefäße stehen bei z = 0 und sind bis knapp 5 cm tief); die Klemmen reichen nach vorn.
  fx.STAND = { z: -7, w: 6, h: 0.35, d: 8, back: 3 };
  // Vollpipette, aufgezogen: von der Spitze (Ursprung) nach oben, Maße wie in 2D (nicht maßstäblich); Flüssigkeit bis zur Ringmarke,
  // oben der Farbring nach ISO 1769 (L.pipetteRing). rgb: Farbe der Flüssigkeit.
  fx.pipette = function (ml, rgb) {
    var g = new THREE.Group(), u = 1 / 16;
    var pts = [[0.05, 0], [0.12, 3 * u], [0.13, 46 * u], [0.42, 52 * u], [0.42, 74 * u], [0.13, 80 * u], [0.13, 142 * u]];
    var glass = new THREE.Mesh(fx.lathe(pts, 24), fx.glass()), liquid, ring, mark;
    glass.renderOrder = 2;
    liquid = new THREE.Mesh(fx.lathe([[0, 2 * u], [0.08, 4 * u], [0.09, 46 * u], [0.37, 52 * u], [0.37, 74 * u], [0.09, 80 * u], [0.09, 102 * u], [0, 102 * u]], 20),
      new THREE.MeshStandardMaterial({ color: fx.color(rgb || [222, 238, 250]), roughness: 0.2, transparent: true, opacity: 0.75 }));
    mark = new THREE.Mesh(new THREE.TorusGeometry(0.135, 0.012, 6, 20).rotateX(Math.PI / 2), fx.matte(0x2a2f36, 0.6));
    mark.position.y = 102 * u;
    ring = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 5 * u, 20), fx.matte(new THREE.Color(L.pipetteRing ? L.pipetteRing(ml) : "#8b949e").getHex(), 0.5));
    ring.position.y = 128 * u;
    g.add(liquid, glass, mark, ring);
    return g;
  };

  // Die Platte zeigt vom Gerät weg, in Richtung des Arms: so, wie man ein Stativ auf den Aufbau ausrichtet
  fx.placeFoot = function (foot, rod, z, x, y) {
    var ux = rod - x, uz = z, n = Math.sqrt(ux * ux + uz * uz) || 1;
    ux /= n; uz /= n;
    foot.rotation.y = Math.atan2(ux, uz);
    foot.position.set(rod + ux * fx.STAND.back, y, z + uz * fx.STAND.back);
  };
  fx.stand = function (sub, x, z, floor, top, grips) {
    var steel = fx.steel(), foot = new THREE.Mesh(new THREE.BoxGeometry(fx.STAND.w, fx.STAND.h, fx.STAND.d), fx.matte(0x3a3f45, 0.5, 0.3));
    fx.placeFoot(foot, x, z, grips && grips.length ? grips[0].x : x, floor + fx.STAND.h / 2);
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
