/* ChemLab – Looks für das Labor: Liebigkühler, Gasableitungsrohr und Rückflusskühler. Klassisches Skript, geladen von chemlab-3d.js nach effects.js.
   Die Lage kommt wie in 2D aus place (Bildpunkte, y nach unten); hier cm, y nach oben. */
(function (global) {
  "use strict";

  var L = global.LiaChemLab, THREE = L.THREE, fx = L.fx3d;
  var PX = 16, V = function (x, y, z) { return new THREE.Vector3(x, y, z); };

  function cm(px) { return px / PX; }

  // Glasrohr von a nach b
  function pipe(a, b, r, mat) {
    var m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, a.distanceTo(b), 16, 1, true), mat);
    m.position.copy(a).add(b).multiplyScalar(0.5);
    m.quaternion.setFromUnitVectors(V(0, 1, 0), b.clone().sub(a).normalize());
    m.renderOrder = 2;
    return m;
  }

  // Kühlmantel mit Wasser zwischen a und b; die Schläuche: unten hinein, oben heraus
  function jacket(sub, a, b, R) {
    var water = pipe(a, b, R - 0.03, new THREE.MeshPhysicalMaterial({ color: 0xcfe6f5, roughness: 0.1, transparent: true, opacity: 0.3, depthWrite: false }));
    var glass = pipe(a, b, R, fx.glass()), hose = fx.matte(fx.style.hose, 0.6), dir = b.clone().sub(a).normalize();
    water.renderOrder = 1;
    // Kappen an den Enden des Mantels
    [a, b].forEach(function (p) {
      var cap = new THREE.Mesh(new THREE.RingGeometry(0.15, R, 24), fx.glass());
      cap.position.copy(p);
      cap.quaternion.setFromUnitVectors(V(0, 0, 1), dir);
      sub.add(cap);
    });
    sub.add(water, glass);
    return hose;
  }

  // blauer Pfeil für die Fließrichtung des Kühlwassers (wie in 2D): Kegel bei at, die Spitze in Richtung dir
  function flow(sub, at, dir) {
    var m = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.38, 12), fx.matte(0x2b8cc4, 0.5));
    m.position.copy(at);
    m.quaternion.setFromUnitVectors(V(0, 1, 0), dir.clone().normalize());
    sub.add(m);
  }

  function stub(sub, from, to, mat) {
    var m = pipe(from, to, 0.16, mat);
    m.castShadow = true;
    m.renderOrder = 0;
    sub.add(m);
  }

  // ------------------------------------------------------------------ Liebigkühler

  // place: { x1, y1 } Ende des Ansatzrohrs, { x2, y2 } Öffnung der Vorlage, s2 deren Spiegel, up: so viel tiefer steht die Vorlage (Hub, 2D)
  L.registerLook("condenser", "lab", {
    build: function () {
      var group = new THREE.Group(), drops = new THREE.InstancedMesh(new THREE.SphereGeometry(0.07, 8, 6),
        new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.05, transmission: 1, thickness: 0.2 }), 3);
      drops.count = 0;
      drops.frustumCulled = false;                             // count wechselt: nah herangezoomt fehlten sonst die Tropfen
      group.add(drops);
      group.userData = { drops: drops };
      return group;
    },
    update: function (group, d, kit) {
      var u = group.userData, p = d.place, up = p ? p.up || 0 : 0, k, q, t = d.ctx.still ? 0.5 : d.ctx.t;
      // die Vorlage steht in 3D um den gestreckten Hub tiefer
      var drop = p ? cm(up) - kit.up(up) : 0;
      var a = p ? V(cm(p.x1), cm(-p.y1), 0) : V(-2, 2.5, 0), y2 = p ? cm(-p.y2) + drop : 1.2, s2 = p ? cm(-p.s2) + drop : 0.25;
      var c = V(p ? cm(p.x2) : 2, Math.min(a.y - cm(24), y2 + cm(22)), 0), e = V(c.x, y2 - cm(10), 0);
      u.end = e; u.s2 = s2;
      var floor = -kit.up(d.lift || 0);
      u.body = fx.rebuild(group, "duct", [a.x, a.y, c.x, c.y, e.y, !!p, floor].map(String).join("|"), function (sub) {
        var ja = a.clone().lerp(c, 0.15), jb = a.clone().lerp(c, 0.8), dir = c.clone().sub(a).normalize(), n = V(-dir.y, dir.x, 0), R = cm(7), hose;
        sub.add(pipe(a, c, 0.13, fx.glass()), pipe(c, e, 0.13, fx.glass()));
        sub.add(new THREE.Mesh(new THREE.SphereGeometry(0.13, 12, 8), fx.glass()).translateX(c.x).translateY(c.y));          // Knie
        hose = jacket(sub, ja, jb, R);
        if (n.y < 0) n.negate();                               // n zeigt nach oben: beide Oliven auf derselben Seite (ISO 4799:1978, 6.2)
        var inTop = jb.clone().addScaledVector(n, R * 0.85).add(V(0, 0.7, 0)), outTop = ja.clone().addScaledVector(n, R * 0.85).add(V(0, 0.7, 0));
        stub(sub, jb.clone().addScaledVector(n, R * 0.85), inTop, hose);      // Kühlwasser unten hinein
        stub(sub, ja.clone().addScaledVector(n, R * 0.85), outTop, hose);     // und oben heraus
        flow(sub, inTop.clone().add(V(0, 0.45, 0)), V(0, -1, 0));
        flow(sub, outTop.clone().add(V(0, 0.4, 0)), V(0, 1, 0));
        // ein eigenes Stativ hält den Mantel in der Mitte (ISO 918:1983, Bild 1)
        if (p) { var m = ja.clone().lerp(jb, 0.5); fx.stand(sub, m.x, fx.STAND.z, floor, m.y + cm(34), [{ x: m.x, y: m.y, r: R, across: true }]); }
        if (!p) sub.add(new THREE.Mesh(new THREE.BoxGeometry(5, 0.4, 1.6), fx.wood()).translateY(0.2));
      });
      // Destillat tropft aus dem Rohr in die Vorlage
      u.drops.count = d.data.drip && p ? 3 : 0;
      for (k = 0; k < u.drops.count; k++) {
        q = (t * 1.3 + k / 3) % 1;
        u.drops.setMatrixAt(k, new THREE.Matrix4().makeTranslation(e.x, e.y - q * q * Math.max(0, e.y - s2), 0));
      }
      u.drops.instanceMatrix.needsUpdate = true;
    }
  });

  // ------------------------------------------------------------------ Gasableitungsrohr

  // place: { x1, y1, w } Stopfen im ersten Gefäß, { x2, y2 } Öffnung des zweiten, end: Ende des Rohrs dort, up: Hub wie beim Kühler.
  // Die Blasen zeichnet das zweite Gefäß selbst.
  L.registerLook("tube", "lab", {
    build: function () { var group = new THREE.Group(); group.userData = {}; return group; },
    update: function (group, d, kit) {
      var p = d.place, up = p ? p.up || 0 : 0, drop = p ? cm(up) - kit.up(up) : 0;
      var x1 = p ? cm(p.x1) : -1.5, y1 = p ? cm(-p.y1) : 0.6, x2 = p ? cm(p.x2) : 1.5, end = p ? cm(-p.end) + drop : 0.4;
      var top = p ? Math.max(cm(-p.y1), cm(-p.y2) + drop) + cm(L.shapes.pipeRise) : 2.4;
      group.userData.body = fx.rebuild(group, "pipe", [x1, y1, x2, end, top, !!p].map(String).join("|"), function (sub) {
        var r = 0.13, a = V(x1, y1 - cm(4), 0), b = V(x1, top, 0), c = V(x2, top, 0), e = V(x2, end, 0), glass = fx.glass();
        glass.color.set(0x8fa6b4);                                  // dünnes Rohr: getönt und dichter, sonst verschwindet es vor der hellen Wand
        glass.opacity = Math.min(1, glass.opacity * 2.5);
        sub.add(pipe(a, b, r, glass), pipe(b, c, r, glass), pipe(c, e, r, glass));
        [b, c].forEach(function (k) { sub.add(new THREE.Mesh(new THREE.SphereGeometry(r, 12, 8), glass).translateX(k.x).translateY(k.y)); });      // Knie
        if (p) {
          var stopper = new THREE.Mesh(new THREE.CylinderGeometry(cm(p.w / 2), cm(p.w / 2 - 2), cm(11), 24), fx.matte(0x4a4d52, 0.8));
          stopper.position.set(x1, cm(-(p.y1 + 1.5)), 0);
          stopper.castShadow = true;
          sub.add(stopper);
        } else sub.add(new THREE.Mesh(new THREE.BoxGeometry(4, 0.4, 1.6), fx.wood()).translateY(0.2));
      });
    }
  });

  // ------------------------------------------------------------------ Rückflusskühler

  // Kugelkühler nach Allihn (ISO 4799:1978, 8.2) wie in 2D: im Mantel ein Innenrohr mit Kugeln, beide Oliven rechts, unten hinein, oben heraus.
  // place: { x, rim, top, lean } aus probe() des Gefäßes: aufrecht über der Öffnung; lean: schräg gestellt in Grad
  L.registerLook("reflux", "lab", {
    build: function () { var group = new THREE.Group(); group.userData = {}; return group; },
    update: function (group, d) {
      var p = d.place || { x: 0, rim: 0, top: -L.shapes.reflux, lean: 0 };
      group.userData.body = fx.rebuild(group, "column", [p.x, p.rim, p.top, p.lean || 0, !!d.place].join("|"), function (sub) {
        var foot = V(cm(p.x), cm(-p.rim), 0), h = cm(p.rim - p.top), tilt = new THREE.Group(), R = cm(L.shapes.refluxR), hose, y, bulb = cm(15);
        tilt.position.copy(foot);
        tilt.rotation.z = -(p.lean || 0) * Math.PI / 180;       // in 2D um den Fuß im Uhrzeigersinn
        tilt.add(pipe(V(0, -cm(6), 0), V(0, h, 0), cm(3), fx.glass()));
        for (y = cm(15) + bulb / 2; y + bulb / 2 <= h - cm(15); y += bulb) {      // die Kugeln des Innenrohrs
          var ball = new THREE.Mesh(new THREE.SphereGeometry(cm(6.5), 18, 12), fx.glass());
          ball.scale.y = 1.15; ball.position.y = y; ball.renderOrder = 2;
          tilt.add(ball);
        }
        hose = jacket(tilt, V(0, cm(12), 0), V(0, h - cm(12), 0), R);
        stub(tilt, V(R, cm(17), 0), V(R + 0.6, cm(17), 0), hose);            // Kühlwasser unten hinein, oben heraus
        stub(tilt, V(R, h - cm(17), 0), V(R + 0.6, h - cm(17), 0), hose);
        flow(tilt, V(R + 0.95, cm(17), 0), V(-1, 0, 0));
        flow(tilt, V(R + 0.85, h - cm(17), 0), V(1, 0, 0));
        sub.add(tilt);
        if (!d.place) sub.add(new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.4, 2.4), fx.wood()).translateY(0.2));
      });
    }
  });
})(typeof globalThis !== "undefined" ? globalThis : this);
