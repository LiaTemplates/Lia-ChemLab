/* ChemLab – Bausteine für die 3D-Looks: Glas, Flüssigkeit mit Oberfläche, Trübung, Bodensatz, Feststoffe, Blasen, Dampf, Strahl.
   Klassisches Skript, geladen von chemlab-3d.js nach stage.js. Alles in cm, y nach oben.

   Ein Gefäß beschreibt sein Inneres als shape = { inner(y) → Radius in cm, floor: tiefste Stelle innen, rim: Rand }.
   Bewegung folgt der Zeit des Versuchs (ctx.t): angehalten steht das Bild, rückwärts läuft es rückwärts – wie in 2D. */
(function (global) {
  "use strict";

  var L = global.LiaChemLab, THREE = L.THREE, doc = global.document;
  var fx = (L.fx3d = {});

  function pseudo(seed, i) { var x = Math.sin(seed * 12.9898 + i * 78.233) * 43758.5453; return x - Math.floor(x); }
  fx.pseudo = pseudo;

  fx.color = function (rgb) { return new THREE.Color().setRGB(rgb[0] / 255, rgb[1] / 255, rgb[2] / 255, THREE.SRGBColorSpace); };

  // Glas ist nur durchscheinend, nicht „transmissiv“: eine Flüssigkeit mit Transmission dahinter sähe sonst das Glas nicht
  // und umgekehrt (siehe Demo). Schatten wirft es keinen.
  fx.glass = function () {
    return new THREE.MeshPhysicalMaterial({ color: 0xffffff, metalness: 0, roughness: 0.03, transparent: true, opacity: 0.2,
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
    var pts = [], n = 24, i, y, top = shape.rim;
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
    var surface = new THREE.Mesh(new THREE.RingGeometry(0.001, 1, 48, 10).rotateX(-Math.PI / 2), liquid);
    var base = surface.geometry.attributes.position.array.slice();
    var ground = new THREE.Mesh(new THREE.BufferGeometry(), fx.matte(0xffffff, 0.95));
    var crust = new THREE.Mesh(new THREE.BufferGeometry(), fx.matte(0xf2f0ea, 0.9));
    var solids = new THREE.Group();
    var bubbles = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 12, 8), new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 1, roughness: 0.03 }), 48);
    var steam = new THREE.Group(), stream = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 1, 10, 1, true),
      new THREE.MeshPhysicalMaterial({ color: 0xdfeefa, roughness: 0.05, transparent: true, opacity: 0.55, depthWrite: false }));
    var dummy = new THREE.Object3D(), keys = {}, i, flat = false;
    for (i = 0; i < 24; i++) steam.add(new THREE.Sprite(new THREE.SpriteMaterial({ map: puff(), transparent: true, depthWrite: false, opacity: 0 })));
    bubbles.count = 0;
    body.renderOrder = surface.renderOrder = 1;
    group.add(body, surface, ground, crust, solids, bubbles, steam, stream);

    // Drehkörper der Form bis zur Höhe top, nur neu, wenn sich die Höhe merklich ändert
    function fill(mesh, shape, from, top, key) {
      var pts = [[0, from]], n = 16, k;
      if (keys[key] === top.toFixed(3) + shape.id) return;
      keys[key] = top.toFixed(3) + shape.id;
      for (k = 0; k <= n; k++) pts.push([shape.inner(from + (top - from) * k / n) - 0.012, from + (top - from) * k / n]);
      if (key !== "body") pts.push([0, top]);
      mesh.geometry.dispose();
      mesh.geometry = fx.lathe(pts, 48);
    }

    function wave(boil, r, t, still) {   // Oberfläche: Meniskus am Rand, beim Sieden bewegt
      var p = surface.geometry.attributes.position, a = p.array, k, x, z, d, h;
      if (!boil && flat) return;
      flat = !boil;
      for (k = 0; k < a.length; k += 3) {
        x = base[k]; z = base[k + 2]; d = Math.sqrt(x * x + z * z);
        h = 0.05 / r * Math.exp((d - 1) * r / 0.1);
        if (boil && !still) h += boil * 0.03 * (1 - d * d) * (Math.sin(9 * x + 7.1 * t) + Math.sin(8 * z - 6.3 * t + 1) + Math.sin(13 * (x + z) + 9.7 * t)) / 3;
        a[k + 1] = h;
      }
      p.needsUpdate = true;
      surface.geometry.computeVertexNormals();
    }

    function laySolids(list, shape, tall) {
      var key = list.map(function (s) { return s.id + s.form + s.g0.toFixed(4) + Math.round(s.part * 30); }).join("|") + shape.id;
      if (keys.solids === key) return;
      keys.solids = key;
      solids.children.slice().forEach(function (o) { solids.remove(o); o.geometry.dispose(); o.material.dispose(); });
      list.forEach(function (s, index) {
        var color = new THREE.Color((L.species(s.id) || {}).color || "#9aa0a8"), path, count, r, k, y, x;
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
          }
        }
      });
    }

    return {
      group: group,
      // shape.id: Name der Form, damit eine neue Form (anderes Gefäß) neu gebaut wird; tall: schmales Glas
      update: function (w, shape, level, ctx, tall) {
        var wet = w.ml > 0.005, r = shape.inner(level), t = ctx.still ? 0 : ctx.t, cloud = w.cloud && w.cloud.alpha > 0.02 ? w.cloud.alpha : 0;
        var rate = Math.max(w.gas || 0, w.steam || 0), boil = w.steam > 0 ? Math.min(1, 0.3 + w.steam / 0.008) : 0, layer, n, k, p, a, d, size, y, top;
        body.visible = surface.visible = wet;
        if (wet) {
          fill(body, shape, shape.floor, level, "body");
          surface.position.y = level;
          surface.scale.set(r - 0.012, 1, r - 0.012);
          wave(boil, r, t, ctx.still);
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
        crust.visible = w.residue > 1e-7;
        if (crust.visible) fill(crust, shape, shape.floor, shape.floor + Math.min(14, 2.5 + 30 * Math.sqrt(w.residue)) / 16, "crust");
        layer = layer || 0;
        laySolids(w.solids || [], shape, tall);

        // Blasen: Gas, das entsteht, und beim Sieden der Dampf. Zahl wie in 2D, beim Sieden mehr und größer.
        n = wet ? Math.min(48, (L.fx && L.fx.count ? L.fx.count(rate) : 0) * 2 + (boil ? 20 : 0)) : 0;
        top = level - 0.05;
        for (k = 0; k < n; k++) {
          p = pseudo(ctx.seed + 3, k) + t * (0.6 + 0.6 * pseudo(ctx.seed, k)) * (boil ? 1.8 : 1) * (tall ? 0.5 : 1);
          p -= Math.floor(p);
          y = shape.floor + layer + 0.1 + p * Math.max(0, top - shape.floor - layer - 0.1);
          a = pseudo(ctx.seed + 9, k) * 6.2832;
          d = Math.sqrt(pseudo(ctx.seed + 11, k)) * Math.max(0, shape.inner(y) - 0.15) * 0.85;
          size = (boil ? 0.03 + 0.09 * p : 0.025 + 0.03 * pseudo(ctx.seed + 5, k)) * (tall ? 0.8 : 1);
          dummy.position.set(d * Math.cos(a) + (ctx.still ? 0 : 0.08 * Math.sin(t * 5 + k)), y, d * Math.sin(a));
          dummy.scale.set(size, size * 0.85, size);
          dummy.updateMatrix();
          bubbles.setMatrixAt(k, dummy.matrix);
        }
        bubbles.count = n;
        bubbles.instanceMatrix.needsUpdate = true;

        // Dampf über dem Rand: weiche Flecken, die aufsteigen und vergehen
        n = w.steam > 0 ? Math.max(6, Math.min(24, Math.round(10 + 5 * Math.log10(w.steam / 1e-3)))) : 0;
        steam.children.forEach(function (s, k) {
          s.visible = k < n;
          if (!s.visible) return;
          var q = pseudo(ctx.seed + 21, k) + t * (0.25 + 0.2 * pseudo(ctx.seed + 22, k)), lift;
          q -= Math.floor(q);
          lift = q * 9;
          s.position.set((pseudo(ctx.seed + 23, k) - 0.5) * r * 1.4 + Math.sin(t * 0.8 + k) * q * 1.2, shape.rim - 0.5 + lift, (pseudo(ctx.seed + 24, k) - 0.5) * r);
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
      },
      dispose: function () {
        group.traverse(function (o) { if (o.geometry) o.geometry.dispose(); if (o.material && o.material.map !== puffTexture) o.material.dispose(); });
      }
    };
  };

  // Ein Schild am Fuß: Nummer und Füllung, wie unter dem Gefäß in 2D
  fx.badge = function (kit, d, w) {
    var text = String(d.ctx.no || "");
    if (d.ctx.numbers && w.ml > 0.005) text += (text ? " · " : "") + L.num(w.ml, 1, d.ctx.lang) + " mL";
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
})(typeof globalThis !== "undefined" ? globalThis : this);
