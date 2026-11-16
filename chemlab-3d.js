/* ChemLab – 3D-Ansicht: Ablage für Szenen und Looks, und der Lader.
   Diese Datei ist klein und wird mit dem Kurs geladen. Three.js und die Dateien in 3d/ kommen erst,
   wenn jemand auf 3D schaltet.

   Erweitern, aus einem eigenen Skript (angestellt in LiaChemLabReady, siehe unten und README „Eigene Szenen in 3D“):
     LiaChemLab.registerScene("werkstatt", { build: function (kit) { … }, gear: { burner: "1880" } })
     LiaChemLab.registerLook("beaker", "werkstatt", { build: function (kit, d) { return obj; }, update: function (obj, d, kit) { … } })
   kit.THREE ist Three.js; d ist der Datensatz eines Geräts (siehe 3d/stage.js). */
(function (global) {
  "use strict";

  var L = (global.LiaChemLab = global.LiaChemLab || {});
  var doc = global.document;

  L.scenes3d = L.scenes3d || {};
  L.looks3d = L.looks3d || {};
  L.registerScene = function (name, def) { L.scenes3d[name] = def; };
  L.registerLook = function (type, scene, look) { (L.looks3d[type] = L.looks3d[type] || {})[scene] = look; };

  // Wo diese Datei liegt. LiaScript holt Skripte per fetch und bindet sie als blob: ein, document.currentScript nennt
  // deshalb nicht die echte Adresse; die Ladezeiten des Browsers (Resource Timing) kennen sie.
  // shortcut: läuft der Puffer dafür über (250 Einträge), bleibt nur "./"; dann LiaChemLab.base3d von Hand setzen
  function where() {
    var src = doc && doc.currentScript && doc.currentScript.src, list, i;
    if (src && !/^blob:/.test(src)) return src.replace(/[?#].*$/, "").replace(/[^/]*$/, "");
    list = global.performance && global.performance.getEntriesByType ? global.performance.getEntriesByType("resource") : [];
    for (i = list.length - 1; i >= 0; i--) if (/\/chemlab-3d\.js([?#]|$)/.test(list[i].name)) return list[i].name.replace(/[?#].*$/, "").replace(/[^/]*$/, "");
    return "./";
  }
  var BASE = where();

  var THREE_FILE = "vendor/three/three.module.min.js";
  var ADDONS = { OrbitControls: "vendor/three/addons/OrbitControls.js", RoomEnvironment: "vendor/three/addons/RoomEnvironment.js", RGBELoader: "vendor/three/addons/RGBELoader.js" };
  var FILES = ["3d/stage.js", "3d/effects.js", "3d/looks-lab.js", "3d/looks-tools.js", "3d/looks-electric.js", "3d/looks-still.js", "3d/looks-kitchen.js", "3d/looks-1880.js", "3d/scenes.js"];       // klassische Skripte, die sich in L eintragen

  function fetchText(url) {
    return global.fetch(url).then(function (res) {
      if (!res.ok) throw new Error(url + " (" + res.status + ")");
      return res.text();
    });
  }

  // Als blob: geladen, gilt der MIME-Typ des Servers nicht (raw.githubusercontent.com liefert text/plain)
  function blob(code) { return global.URL.createObjectURL(new global.Blob([code], { type: "text/javascript" })); }

  function classic(code) {
    return new Promise(function (resolve, reject) {
      var s = doc.createElement("script");
      s.src = blob(code);
      s.onload = resolve;
      s.onerror = function () { reject(new Error("script")); };
      doc.head.appendChild(s);
    });
  }

  var ready = null;
  function load() {
    if (ready) return ready;
    var base = L.base3d || BASE;
    L.base3d = base;
    ready = fetchText(base + THREE_FILE).then(function (code) {
      var url = blob(code);
      return import(url).then(function (THREE) {
        L.THREE = THREE;
        L.three = {};
        var names = Object.keys(ADDONS);
        // Die Zusätze holen Three.js über einen relativen Pfad; als blob: zeigt er auf die eben geladene Kopie
        return Promise.all(names.map(function (name) {
          return fetchText(base + ADDONS[name]).then(function (text) {
            return import(blob(text.split("'../three.module.min.js'").join(JSON.stringify(url))));
          }).then(function (mod) { L.three[name] = mod[name]; });
        }));
      });
    }).then(function () {
      return Promise.all(FILES.map(function (file) { return fetchText(base + file); }));
    }).then(function (codes) {
      return codes.reduce(function (done, code) { return done.then(function () { return classic(code); }); }, Promise.resolve());
    });
    ready.catch(function () { ready = null; });       // ein Netzfehler soll den nächsten Versuch nicht sperren
    return ready;
  }

  // Liefert eine Bühne mit build, item, end und stop (siehe 3d/stage.js), oder einen Fehler, wenn 3D nicht geht
  L.stage3d = function (host, opts) {
    return load().then(function () { return L.makeStage3d(host, opts); });
  };

  // Erweiterungen eines Kurses (eigene Szenen, Looks, Geräte). LiaScript führt die Skripte des Kurses vor denen des Bausteins aus,
  // darum stellen sie sich an: (window.LiaChemLabReady = window.LiaChemLabReady || []).push(function (L) { L.registerScene(…) }).
  // Diese Datei ist die letzte des Bausteins: hier läuft, was wartet, und danach jeder neue Eintrag sofort.
  function run(f) { try { f(L); } catch (e) { global.console.error("LiaChemLabReady", e); } }
  var waiting = global.LiaChemLabReady || [];
  global.LiaChemLabReady = { push: run };
  [].concat(waiting).forEach(run);
})(typeof globalThis !== "undefined" ? globalThis : this);
