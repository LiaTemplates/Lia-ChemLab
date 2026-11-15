/* ChemLab – Looks für das Labor um 1880. Das meiste kommt aus dem Stil der Szene (Messing, Holzgehäuse, Papierskalen,
   grünliches Glas ohne Skala, Kupferwanne; siehe scenes.js). Eigene Looks nur, wo die Form anders ist:
   die Bürette nach Mohr mit Quetschhahn statt Glashahn und die Kohlefadenlampe. Klassisches Skript, nach den Looks des Labors geladen. */
(function (global) {
  "use strict";

  var L = global.LiaChemLab, THREE = L.THREE, fx = L.fx3d, lab = function (type) { return L.looks3d[type].lab; };

  // Bürette nach Mohr: unten ein Stück Gummischlauch mit einer Klemme aus Messing; gedrückt ist sie offen
  L.registerLook("burette", "1880", {
    build: function (kit, d) {
      var group = lab("burette").build(kit, d), pinch = new THREE.Group();
      var hose = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 1.3, 12), fx.matte(0x2e2a28, 0.8));
      var clip = new THREE.Mesh(new THREE.TorusGeometry(0.32, 0.06, 6, 20, Math.PI * 1.6), fx.steel());
      clip.rotation.x = Math.PI / 2;
      hose.castShadow = clip.castShadow = true;
      pinch.add(hose, clip);
      group.add(pinch);
      group.userData.pinch = pinch; group.userData.clip = clip;
      return group;
    },
    update: function (group, d, kit) {
      var u = group.userData;
      lab("burette").update(group, d, kit);
      u.cock.visible = false;
      u.pinch.position.copy(u.cock.position);
      u.clip.scale.set(1, d.data.tap > 0 ? 0.55 : 1, 1);      // gedrückt: der Schlauch ist offen
    }
  });

  // Kohlefadenlampe: Kolben mit Spitze, glüht orange
  L.registerLook("lamp", "1880", {
    build: function (kit, d) {
      var group = lab("lamp").build(kit, d), u = group.userData;
      var tip = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.45, 12), u.bulb.material);
      tip.position.set(0, u.bulb.position.y + 0.85, 0);
      u.body.add(tip);
      u.bulb.material.emissive.set(0xff8a30);
      u.filament.material.emissive.set(0xff7a20);
      u.halo.material.color.set(0xffb060);
      return group;
    },
    update: function (group, d, kit) {
      lab("lamp").update(group, d, kit);
      group.userData.bulb.material.emissiveIntensity *= 0.7;      // Kohlefaden: dunkler, wärmer
    }
  });
})(typeof globalThis !== "undefined" ? globalThis : this);
