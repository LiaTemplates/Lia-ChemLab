/* ChemLab – 3D-Bühne. Klassisches Skript; chemlab-3d.js lädt es, nachdem L.THREE da ist.
   Maße in cm, y nach oben, die Tischplatte bei y = 0, die Geräte stehen auf einer Reihe bei z = 0.
   Die Einteilung kommt aus der 2D-Fläche (Reihenfolge, Hub, Trefferflächen): 16 Bildpunkte dort sind 1 cm hier.

   Datensatz d eines Geräts, so wie paint() in chemlab-ui.js ihn liefert:
     id, type, name, label (Text für Vorleser), vessel (true bei Gefäßen), data (L.view oder L.reading),
     hang (bei Büretten: wo sie hängt), place (bei Messgeräten: wo sie stecken), host (Gefäß, an dem es hängt),
     box (Trefferfläche in 2D-Bildpunkten: x0, x1, top, bottom), x und lift (Platz in 2D-Bildpunkten), selected, ctx (t, still, lang, numbers)
   Ein Look ist { build(kit, d) → Object3D, update(obj, d, kit) }. obj.userData.body ist, was Auswahlrahmen und Tastaturknopf umfassen
   (ohne Schilder); ohne Angabe das ganze Objekt. obj.userData.terminals: Anschlüsse für Leitungen (Vector3 im Raum des Geräts),
   in der Reihenfolge der Anschlüsse in 2D (terminal bzw. terminals). */
(function (global) {
  "use strict";

  var L = global.LiaChemLab, THREE = L.THREE, doc = global.document;
  var PX = 16;                      // Bildpunkte der 2D-Fläche je cm
  // Hub (Gefäß auf Dreifuß, Klemme, Wasserbad) wird gestreckt: in 2D steht ein Becherglas 6,5 cm über dem Tisch, ein echter Dreifuß ist gut 16 cm hoch.
  // Alles am selben Gefäß hebt sich gleich, untereinander bleiben die Maße wie in 2D.
  var LIFT = 2.5;
  function up(px) { return px / PX * LIFT; }

  // Szene der Konfiguration → Look eines Geräts: eigene Wahl im JSON, dann die Szene, ihre Zuordnung, das Labor, eine Elektrode, der Kasten
  function lookOf(type, scene, def) {
    var looks = L.looks3d[type] || {};
    return looks[scene.gear[type]] || looks[scene.base] || looks[(def.gear || {})[type]] || looks.lab || (def.electrode && L.electrode3d) || L.looks3d["*"].lab;
  }

  // Ein Schild als Sprite: schreibt nur neu, wenn sich der Text ändert. Es hat eine feste Größe auf dem Bildschirm, wie die Schilder
  // in 2D, und wird beim Heranzoomen nicht größer, beim Wegdrehen nicht unlesbar klein. height: das alte Maß in cm, nur noch als Verhältnis.
  var FOV = 32, SCREEN = 2 * Math.tan(FOV * Math.PI / 360);
  function label(height) {
    var canvas = doc.createElement("canvas"), g = canvas.getContext("2d"), tex = new THREE.CanvasTexture(canvas);
    var sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, depthTest: false, transparent: true, sizeAttenuation: false }));
    var H = 0.06 * SCREEN * Math.max(0.9, (height || 1.1) / 1.1);       // Anteil an der Höhe des Bildes: etwa 6 %, die Schrift so groß wie in 2D
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 4;
    sprite.renderOrder = 10;
    sprite.center.set(0.5, 0);
    sprite.userData.write = function (text) {
      var font = "500 80px system-ui, sans-serif", w;
      if (text === sprite.userData.text) return;
      sprite.userData.text = text;
      g.font = font;
      w = Math.ceil(g.measureText(text).width) + 64;
      canvas.width = w; canvas.height = 128;
      g.font = font;
      g.fillStyle = "rgba(255,255,255,0.92)";
      g.strokeStyle = "rgba(40,48,60,0.25)"; g.lineWidth = 3;
      g.beginPath(); g.roundRect(1.5, 1.5, w - 3, 125, 28); g.fill(); g.stroke();
      g.fillStyle = "#28303c"; g.textBaseline = "middle";
      g.fillText(text, 32, 67);
      tex.dispose();                // neue Größe der Leinwand: die Textur neu anlegen lassen
      tex.needsUpdate = true;
      sprite.scale.set(H * w / 128, H, 1);
    };
    return sprite;
  }

  function dispose(obj) {
    obj.traverse(function (o) {
      if (o.geometry) o.geometry.dispose();
      [].concat(o.material || []).forEach(function (m) { if (m.map) m.map.dispose(); m.dispose(); });
    });
  }

  // Der Platzhalter für jedes Gerät ohne eigenen Look: ein Kasten in der Größe seiner Trefferfläche, mit Namen und Wert
  L.registerLook("*", "lab", {
    build: function (kit, d) {
      var group = new THREE.Group();
      var mesh = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshStandardMaterial({
        color: d.vessel ? 0xd6e6f2 : 0xaab3bd, roughness: 0.4, transparent: d.vessel, opacity: d.vessel ? 0.6 : 1
      }));
      mesh.castShadow = true;
      group.add(mesh);
      group.add(label(1));
      group.userData.body = mesh;
      return group;
    },
    update: function (group, d) {
      var b = d.box, bottom = b.bottom == null ? 2 : b.bottom, w = Math.max(0.6, (b.x1 - b.x0) / PX), h = Math.max(0.6, (bottom - b.top) / PX);
      var mesh = group.children[0], tag = group.children[1], cut = d.label.indexOf(": ");
      mesh.scale.set(w, h, d.vessel ? Math.min(w, 9) : 3);
      mesh.position.set((b.x0 + b.x1) / 2 / PX, -(bottom + b.top) / 2 / PX, 0);
      tag.userData.write(d.name + (cut >= 0 ? " · " + d.label.slice(cut + 2) : ""));
      tag.position.set(mesh.position.x, -b.top / PX + 0.4 + (d.vessel ? 0 : 1.3), 0);
    }
  });

  L.makeStage3d = function (host, opts) {
    var scene = opts.scene, def = L.scenes3d[scene.base], error;
    if (!def) { error = new Error(scene.base); error.code = "scene"; throw error; }

    // auto: schmale Fläche oder Handy (kürzere Bildschirmseite, auch quer) → niedrig. host selbst ist noch versteckt, bis die Bühne steht
    var screen = global.screen || {}, narrow = ((host.parentNode && host.parentNode.clientWidth) || 600) < 520 || Math.min(screen.width || 999, screen.height || 999) < 520;
    var high = scene.quality === "high" || (scene.quality === "auto" && !narrow);
    var renderer = new THREE.WebGLRenderer({ antialias: true });          // ohne WebGL wirft das, und die Fläche bleibt 2D
    renderer.setPixelRatio(high ? Math.min(global.devicePixelRatio || 1, 2) : 1);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.shadowMap.enabled = high;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    host.appendChild(renderer.domElement);

    var keys = doc.createElement("div");                 // je Gerät ein Knopf für Tastatur und Vorleser
    host.appendChild(keys);

    var world = new THREE.Scene();
    var pmrem = new THREE.PMREMGenerator(renderer);
    world.environment = pmrem.fromScene(new L.three.RoomEnvironment(renderer), 0.04).texture;
    var camera = new THREE.PerspectiveCamera(FOV, 2, 1, 3000);
    var controls = new L.three.OrbitControls(camera, renderer.domElement);
    controls.minDistance = 12; controls.maxDistance = 400;
    controls.minPolarAngle = 0.3; controls.maxPolarAngle = 1.52;
    controls.minAzimuthAngle = -1.2; controls.maxAzimuthAngle = 1.2;
    controls.screenSpacePanning = true;

    var kit = { THREE: THREE, L: L, root: world, renderer: renderer, high: high, scene: scene, lang: opts.lang, still: opts.still, label: label, PX: PX, up: up,
      style: Object.assign({}, L.fx3d.STYLE, def.style), render: function () { render(); } };
    var loader = new THREE.TextureLoader();
    loader.setCrossOrigin("anonymous");
    // Pfade sind relativ zum Ordner des Bausteins (assets/3d/…); eine volle Adresse (https://…) gilt so, wie sie ist
    function url(path) { return /^([a-z]+:|\/)/i.test(path) ? path : L.base3d + path; }
    // Bild: color: Farbbild (sRGB), sonst Daten wie Normalen; repeat: [x, y]
    kit.texture = function (path, color, repeat) {
      var tex = loader.load(url(path), render);
      tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
      if (repeat) tex.repeat.set(repeat[0], repeat[1]);
      if (color) tex.colorSpace = THREE.SRGBColorSpace;
      tex.anisotropy = 4;
      return tex;
    };
    // Raumlicht aus einem HDR-Bild; bis es geladen ist, gilt das einfache Raumlicht. Bei niedriger Qualität bleibt es dabei (spart 1–2 MB)
    kit.environment = function (path) {
      if (!high) return;
      new L.three.RGBELoader().load(url(path), function (hdr) {
        if (dead) { hdr.dispose(); return; }
        var env = pmrem.fromEquirectangular(hdr).texture;
        hdr.dispose();
        if (world.environment) world.environment.dispose();
        world.environment = env;
        render();
      });
    };
    L.fx3d.style = kit.style;
    def.build(kit);

    var entries = {}, order = [], width = 0, framed = -1, dead = false, queued = 0, sorted = false;
    var darkened = false;
    function dim() {                // shortcut: Faktor 0,04 für Lampen und Umgebung; die Lichtfarbe des Raums bleibt
      var k = darkened ? 0.04 : 1;
      world.traverse(function (o) {
        if (o.isLight) { if (o.userData.power == null) o.userData.power = o.intensity; o.intensity = o.userData.power * k; }
        [].concat(o.material || []).forEach(function (m) {
          if (m.envMapIntensity == null) return;
          if (m.userData.env == null) m.userData.env = m.envMapIntensity;
          m.envMapIntensity = m.userData.env * k;
        });
      });
      if (world.background && world.background.isColor) {
        if (!world.userData.sky) world.userData.sky = world.background.clone();
        world.background = darkened ? new THREE.Color(0x05060a) : world.userData.sky;
      }
    }
    // Leitungen: hängende Kabel zwischen den Anschlüssen (obj.userData.terminals, im Raum des Geräts); neu nur, wenn sich etwas bewegt
    var wires = new THREE.Group(), wiresKey = "", WIRE = { " cl-plus": 0xc62828, " cl-minus": 0x1f4fbf, "": 0x202326 };
    world.add(wires);
    function terminal(ref) {
      var e = entries[ref[0]], t = e && e.obj.userData.terminals && e.obj.userData.terminals[ref[1]];
      if (!t) return null;
      e.obj.updateMatrixWorld(true);
      return e.obj.localToWorld(t.clone());
    }
    function wire(list) {
      var ends = list.map(function (k) { var a = terminal(k.a), b = terminal(k.b); return a && b ? [a, b, k] : null; }).filter(Boolean), count = {};
      var key = ends.map(function (e) { return e[0].toArray().concat(e[1].toArray()).map(function (v) { return v.toFixed(2); }).join(",") + e[2].cls; }).join("|");
      if (key === wiresKey) return;
      wiresKey = key;
      wires.children.slice().forEach(function (o) { wires.remove(o); o.geometry.dispose(); o.material.dispose(); });
      ends.forEach(function (e) {
        var a = e[0], b = e[1], n = count[e[2].circuit] = (count[e[2].circuit] || 0) + 1, rise = 2.2 + 0.9 * n, top = Math.max(a.y, b.y) + rise;
        var curve = new THREE.CatmullRomCurve3([a, a.clone().add(new THREE.Vector3(0, rise * 0.6, 0)),
          new THREE.Vector3((a.x + b.x) / 2, top, (a.z + b.z) / 2 + 1 + 0.6 * n), b.clone().add(new THREE.Vector3(0, rise * 0.6, 0)), b]);
        var m = new THREE.Mesh(new THREE.TubeGeometry(curve, 48, 0.09, 8), new THREE.MeshStandardMaterial({ color: WIRE[e[2].cls] || WIRE[""], roughness: 0.55 }));
        m.castShadow = true;
        wires.add(m);
      });
    }

    var selection = new THREE.Box3Helper(new THREE.Box3(), new THREE.Color(0x1d8a8c));
    selection.visible = false;
    world.add(selection);

    function render() {
      if (queued || dead) return;
      queued = global.requestAnimationFrame(function () {
        queued = 0;
        if (dead) return;
        renderer.render(world, camera);
        placeKeys();
      });
    }
    controls.addEventListener("change", render);

    function size() {
      var w = host.clientWidth, h = host.clientHeight;
      if (!w || !h) return;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      render();
    }
    var watcher = global.ResizeObserver ? new global.ResizeObserver(size) : null;
    if (watcher) watcher.observe(host);

    // Die Kamera blickt so auf den Tisch, dass alle Geräte zu sehen sind; danach gehört sie den Lernenden.
    // Sie steht vorn und nur wenig erhöht (15°): so beginnt 3D bei der Vorderansicht der Versuchsskizze in 2D, und wie in einer
    // dimetrischen Darstellung (ISO 5456-3, 5.2) bleibt die Vorderansicht die Hauptansicht; Tiefe zeigen Ellipsen und Schatten.
    function frame() {
      var box = new THREE.Box3(), sphere = new THREE.Sphere(), half, dist;
      order.forEach(function (id) { if (entries[id]) box.expandByObject(entries[id].obj); });
      if (box.isEmpty()) box.set(new THREE.Vector3(-20, 0, -5), new THREE.Vector3(20, 20, 5));
      box.getBoundingSphere(sphere);
      // eine Kugel um alles passt in jeder Blickrichtung ins Bild; der engere der beiden Bildwinkel zählt
      half = Math.min(camera.fov * Math.PI / 360, Math.atan(Math.tan(camera.fov * Math.PI / 360) * camera.aspect));
      dist = sphere.radius / Math.sin(half) * 1.02;          // etwas Rand: die Schilder haben eine feste Größe und gehören nicht zur Kugel
      controls.target.copy(sphere.center);
      camera.position.copy(sphere.center).add(new THREE.Vector3(0, 0.26, 0.966).multiplyScalar(dist));
      controls.update();
    }

    // Antippen: kurzer Druck ohne Ziehen. Ziehen dreht die Kamera.
    var ray = new THREE.Raycaster(), ndc = new THREE.Vector2(), down = null;
    function pick(ev) {
      var rect = renderer.domElement.getBoundingClientRect(), hits, o, i;
      ndc.set((ev.clientX - rect.left) / rect.width * 2 - 1, -(ev.clientY - rect.top) / rect.height * 2 + 1);
      ray.setFromCamera(ndc, camera);
      hits = ray.intersectObjects(order.map(function (id) { return entries[id].obj; }), true);
      for (i = 0; i < hits.length; i++) {
        for (o = hits[i].object; o; o = o.parent) if (o.userData.chemlab) return o.userData.chemlab;
      }
      return null;
    }
    function onDown(ev) { down = ev.button ? null : { x: ev.clientX, y: ev.clientY }; }
    function onUp(ev) {
      var d = down;
      down = null;
      if (d && Math.abs(ev.clientX - d.x) + Math.abs(ev.clientY - d.y) < 10) opts.tap(pick(ev));
    }
    function onKey(ev) {
      var id = ev.target && ev.target.getAttribute && ev.target.getAttribute("data-key");
      if (ev.key === "Escape") { opts.escape(); return; }
      if (id && (ev.key === "Enter" || ev.key === " ")) { ev.preventDefault(); opts.tap(id); }
    }
    renderer.domElement.addEventListener("pointerdown", onDown);
    renderer.domElement.addEventListener("pointerup", onUp);
    host.addEventListener("keydown", onKey);

    var probe = new THREE.Vector3(), area = new THREE.Box3();
    function placeKeys() {
      var w = host.clientWidth, h = host.clientHeight;
      order.forEach(function (id) {
        var e = entries[id];
        if (!e) return;
        area.setFromObject(e.obj.userData.body || e.obj).getCenter(probe).project(camera);
        e.key.style.left = ((probe.x + 1) / 2 * w).toFixed(1) + "px";
        e.key.style.top = ((1 - probe.y) / 2 * h).toFixed(1) + "px";
      });
    }

    function drop(id) {
      var e = entries[id];
      world.remove(e.obj);
      dispose(e.obj);
      keys.removeChild(e.key);
      delete entries[id];
    }

    return {
      // ein Bild der Bühne als data:-URL, für Prüfungen (WebGL leert seinen Puffer nach dem Zeichnen)
      shot: function () { renderer.render(world, camera); return renderer.domElement.toDataURL("image/jpeg", 0.85); },
      obj: function (id) { return entries[id] && entries[id].obj; },        // das 3D-Objekt eines Geräts, für Prüfungen
      // neue Einteilung: was weg ist, geht; was neu ist, entsteht beim nächsten item()
      build: function (items, total) {
        var keep = {};
        items.forEach(function (item) { keep[item.id] = item.type; });
        Object.keys(entries).forEach(function (id) { if (keep[id] !== entries[id].type) drop(id); });
        order = items.map(function (item) { return item.id; });
        width = total;
        sorted = false;
      },
      item: function (d) {
        var e = entries[d.id];
        if (!e) {
          e = entries[d.id] = { type: d.type, look: lookOf(d.type, scene, def), key: doc.createElement("button") };
          L.fx3d.style = kit.style;
          e.obj = e.look.build(kit, d);
          e.obj.userData.chemlab = d.id;
          world.add(e.obj);
          e.key.type = "button";
          e.key.className = "cl-key";
          e.key.setAttribute("data-key", d.id);
          keys.appendChild(e.key);
        }
        e.obj.position.set((d.x - width / 2) / PX, up(d.lift), 0);
        L.fx3d.style = kit.style;
        e.look.update(e.obj, d, kit);
        // eine aufgezogene Vollpipette steht im Gefäß (held: { ml, rgb, tip in 2D-Bildpunkten }), wie in 2D
        var held = d.held ? d.held.ml + "|" + d.held.rgb.join(",") : null;
        if (held !== e.held) {
          if (e.pipette) { e.obj.remove(e.pipette); dispose(e.pipette); e.pipette = null; }
          e.held = held;
          if (d.held) { e.pipette = L.fx3d.pipette(d.held.ml, d.held.rgb); e.obj.add(e.pipette); }
        }
        if (e.pipette) e.pipette.position.set(0, -d.held.tip / PX, 0);          // die Gruppe des Gefäßes ist schon gehoben
        e.key.setAttribute("aria-label", d.label);
        e.selected = d.selected;
      },
      end: function (lab, links) {
        var sel = order.filter(function (id) { return entries[id] && entries[id].selected; })[0];
        var all = order.every(function (id) { return entries[id]; });
        if (all && !sorted) { sorted = true; order.forEach(function (id) { keys.appendChild(entries[id].key); }); }      // Tab-Folge wie die Reihe auf dem Tisch
        if (all && framed !== width) { framed = width; size(); frame(); }
        selection.visible = !!sel;
        if (sel) selection.box.setFromObject(entries[sel].obj.userData.body || entries[sel].obj).expandByScalar(0.4);
        wire(links || []);
        if (darkened) dim();                                   // auch was eben neu dazukam
        render();
      },
      // Raumlicht aus: Lampen und Spiegelung der Umgebung fast dunkel, was selbst leuchtet, bleibt hell
      dark: function (on) {
        darkened = on;
        dim();
        render();
      },
      stop: function () {
        dead = true;
        if (queued) global.cancelAnimationFrame(queued);
        if (watcher) watcher.disconnect();
        renderer.domElement.removeEventListener("pointerdown", onDown);
        renderer.domElement.removeEventListener("pointerup", onUp);
        host.removeEventListener("keydown", onKey);
        controls.dispose();
        Object.keys(entries).forEach(drop);
        world.traverse(function (o) { if (o.geometry || o.material) dispose(o); });
        if (world.environment) world.environment.dispose();
        pmrem.dispose();
        renderer.dispose();
        renderer.forceContextLoss();        // Browser erlauben nur wenige WebGL-Kontexte zugleich
        host.innerHTML = "";
      }
    };
  };
})(typeof globalThis !== "undefined" ? globalThis : this);
