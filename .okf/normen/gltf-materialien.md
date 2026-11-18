---
type: Standard
title: glTF 2.0 (ISO/IEC 12113) und die Glasmaterialien von Khronos
description: Das genormte Austauschformat für 3D-Modelle mit physikalisch begründeten Materialien; Glas und Flüssigkeit beschreiben die Khronos-Erweiterungen Transmission, IOR und Volume.
resource: https://www.iso.org/standard/83990.html
tags: [norm, 3d, material, glas]
status: stable
generated: { by: claude-code/claude-opus-5-5, at: 2026-11-18T12:00:00Z }
sources:
  - id: iso-12113
    resource: https://www.iso.org/standard/83990.html
    title: ISO/IEC 12113:2022, Runtime 3D asset delivery format – Khronos glTF 2.0
    author: process:iso-iec-jtc1
  - id: khr-volume
    resource: https://github.com/KhronosGroup/glTF/blob/main/extensions/2.0/Khronos/KHR_materials_volume/README.md
    title: Khronos, KHR_materials_volume
    author: process:khronos
---

# Was genormt ist

ISO/IEC 12113:2022 ist glTF 2.0: ein Format, mit dem 3D-Inhalte zwischen Programmen ausgetauscht und
geladen werden, mit physikalisch begründeten Materialien (Metallizität, Rauheit).[^iso-12113]

# Glas und Flüssigkeit (Khronos-Erweiterungen, nicht Teil der ISO-Norm)

- `KHR_materials_transmission`: Licht geht durch die Oberfläche.
- `KHR_materials_ior`: Brechungsindex; ohne Angabe 1,5.
- `KHR_materials_volume`: Dicke und Färbung im Inneren über `attenuationColor` und `attenuationDistance`; braucht Transmission.[^khr-volume]

# Bezug zu ChemLab

Three.js setzt dieselben Größen in `MeshPhysicalMaterial` um. ChemLab nutzt sie schon: Flüssigkeiten mit
`transmission`, `ior: 1.33` (Wasser) und `attenuationColor` (`3d/effects.js`). Das Glas selbst ist bewusst nur
durchscheinend, weil Transmission hinter Transmission in Three.js nicht sichtbar wäre. Für Borosilikatglas
wäre ein Brechungsindex um 1,47 richtig; das ist nicht umgesetzt.

[^iso-12113]: ISO/IEC 12113:2022, Normseite
[^khr-volume]: Khronos, KHR_materials_volume
