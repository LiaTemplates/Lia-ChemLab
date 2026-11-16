/* ChemLab – Grundpaket: Stoffe, Gleichgewichte, Reaktionen und Vorratsflaschen.

   Quellen:
   - Bildungsenthalpien (Hf, kJ/mol) und Entropien (S, J/(mol K)) bei 25 °C:
     CODATA Key Values for Thermodynamics (Cox, Wagman, Medvedev, 1989),
     https://www.codata.info/resources/databases/key1.html
   - Gleichgewichtskonstanten (logK bei 25 °C) und Reaktionsenthalpien (dH, kJ/mol): Datenbanken phreeqc.dat,
     minteq.v4.dat und llnl.dat aus PHREEQC Version 3 des U.S. Geological Survey (Parkhurst und Appelo),
     https://www.usgs.gov/software/phreeqc-version-3. llnl.dat beruht auf thermo.com.V8.R6.230 des
     Lawrence Livermore National Laboratory.
     Die Werte sind einzeln entnommen und in das Format dieses Pakets umgeschrieben (November 2026);
     dies sind nicht die Originaldateien. Wo eine Gleichung anders geschrieben ist als in der Datenbank,
     ist sie umgerechnet, und der Eintrag nennt die Zeile der Datenbank:
     mit OH- statt H+ über das Ionenprodukt des Wassers (logK -14,0 aus phreeqc.dat; Reaktionsenthalpie
     55,8 kJ/mol nach Hess aus den CODATA-Werten), mit NH3 statt NH4+ über NH4+ = NH3 + H+
     (log_k -9,244; delta_h 52 kJ aus minteq.v4.dat).
   - Standardpotentiale (E0 in V, für die Reduktion): aus den log_k-Werten derselben Datenbanken umgerechnet,
     E0 = log_k · 0,05916 V / Zahl der Elektronen. llnl.dat schreibt Redoxvorgänge mit gelöstem Sauerstoff; sie sind
     mit H2(g) + 0,5 O2 = H2O (log_k 43,0016, llnl.dat) auf die Wasserstoffelektrode bezogen.
   - Diffusionskoeffizienten (D in 10⁻⁹ m²/s bei 25 °C): die Angabe -dw in phreeqc.dat. Aus ihnen folgt die
     Leitfähigkeit (Nernst-Einstein) und, wie schnell ein Stoff an eine Oberfläche nachkommt.
   Die Angaben in src sind englisch; ihre Kennwörter:
   - „textbook value“ (Lehrbuchwert): in den offenen Datenbanken nicht enthalten, aus üblichen Tabellen übernommen.
   - „estimated“ (geschätzt): nicht gemessen, sondern an das übliche Aussehen oder die übliche Dauer im
     Schulversuch angepasst. Das gilt für alle Absorptionsbanden (Farben), für die Farben der Flammen,
     für alle Geschwindigkeiten (Magnesium in Säure, Zerfall von Wasserstoffperoxid, Verbrennungen,
     Entwässern), für die Zündtemperaturen und für die Überspannungen an Elektroden und Metallen.
   - „adjusted“ (angepasst): Der Baustein rechnet mit Konzentrationen statt Aktivitäten. Wo eine Konstante aus der
     Datenbank deshalb zu einer falschen Löslichkeit führen würde, ist sie so gewählt, dass die gemessene
     Löslichkeit herauskommt; der Wert der Datenbank steht dabei.

   Format eines Eintrags: siehe README.md, Abschnitt „Eigene Stoffe und Reaktionen“. */
(function start(global) {
  "use strict";

  var L = (global.LiaChemLab = global.LiaChemLab || {});
  if (!L.register) { (L.pending = L.pending || {})["chemlab-data.js"] = start; return; }      // der Rechenkern kommt noch und ruft diese Datei dann auf
  var CODATA = "CODATA Key Values for Thermodynamics (1989)";
  var TABLE = "; heat capacity and density: usual table values";
  var NONE = "no enthalpy of formation in CODATA";
  var LOOK = "colour of the solid from its usual appearance";
  var BAND = "; absorption band estimated from the usual colour of the solution";
  var DYE = "indicator: pKa from usual lab course data; absorption bands estimated";
  var STEP = "; reaction enthalpy estimated: -22.5 kJ/mol per ammonia, as for the steps with two and three ammonia from llnl.dat";
  var MINTEQ = "minteq.v4.dat (USGS): ";
  var LLNL = "llnl.dat (USGS): ";
  var WHITE = "#f5f5f2";
  var GLOW = "; flame colour estimated from the usual appearance";
  var GAS = "; heat capacity: usual table value";
  var BURN = "estimated: ignition temperature and burning time from the usual course of the school experiment";
  var DW = "; diffusion coefficient: phreeqc.dat (USGS), -dw";
  var DL = "; diffusion coefficient: textbook value";
  var ELEMENT = "element: enthalpy of formation zero by definition; ";
  // Überspannung in V bei 1 mA/cm², je nach Oberfläche
  var OVER_H = { default: 0.60, "Pt(s)": 0.09, "C(s)": 0.47, "Cu(s)": 0.50, "Fe(s)": 0.30, "Ag(s)": 0.59, "Zn(s)": 0.36 };
  // Wasserstoff aus Wasser statt aus H+: läuft überall gehemmter
  var OVER_W = { default: 0.90, "Pt(s)": 0.35, "C(s)": 0.75, "Cu(s)": 0.80, "Fe(s)": 0.80, "Ag(s)": 0.85, "Zn(s)": 1.0, "Mg(s)": 1.6 };
  var OVER_O = { default: 0.60, "Pt(s)": 0.45, "C(s)": 0.50, "Cu(s)": 0.58, "Fe(s)": 0.41, "Ag(s)": 0.61 };
  var OVER = "; overpotentials estimated from usual tables (at 1 mA/cm²)";

  function name(en) { return { en: en }; }        // deutsch und die übrigen Sprachen: lang/<code>.json

  L.core = {
    species: {
      // ---------------------------------------------------------------- Wasser und seine Ionen
      "H2O(l)": { name: name("water"), Hf: -285.830, S: 69.95, cp: 75.3, rho: 0.997, src: CODATA + TABLE },
      // konzentrierte Schwefelsäure als reiner Stoff: Mit Wasser löst sie sich sofort, und dabei wird viel Wärme frei
      "H2SO4(l)": { name: name("sulfuric acid (pure)"), Hf: -813.989, S: 156.904, cp: 138.9, rho: 1.8302,
        src: CODATA + "; heat capacity 138.9 J/(mol K): NIST Chemistry WebBook; density 1.8302 g/cm³: usual table value" },
      "H2O(g)": { name: name("water vapour"), Hf: -241.826, S: 188.835, cp: 33.6, src: CODATA + TABLE },
      "H+(aq)": { name: name("hydrogen ion"), Hf: 0, S: 0, D: 9.31, src: CODATA + DW },
      "OH-(aq)": { name: name("hydroxide ion"), Hf: -230.015, S: -10.90, D: 5.27, src: CODATA + DW },

      // ---------------------------------------------------------------- Ionen der Salze
      // flame: Farbe, die das Teilchen einer Flamme gibt; shine: wie stark (Natrium überstrahlt alles andere)
      // D: Diffusionskoeffizient in 10⁻⁹ m²/s; fehlt er bei einem Ion, rechnet der Baustein mit 1
      "Na+(aq)": { name: name("sodium ion"), Hf: -240.34, S: 58.45, D: 1.33, flame: "#ffd21f", shine: 30, src: CODATA + DW + GLOW },
      "K+(aq)": { name: name("potassium ion"), Hf: -252.14, S: 101.20, D: 1.96, flame: "#b08cff", src: CODATA + DW + GLOW },
      "Cl-(aq)": { name: name("chloride ion"), Hf: -167.080, S: 56.60, D: 2.033, src: CODATA + DW },
      "Br-(aq)": { name: name("bromide ion"), Hf: -121.41, S: 82.55, D: 2.09, src: CODATA + DW },
      "I-(aq)": { name: name("iodide ion"), Hf: -56.78, S: 106.45, D: 2.045, src: CODATA + DL },
      "NO3-(aq)": { name: name("nitrate ion"), Hf: -206.85, S: 146.70, D: 1.9, src: CODATA + DW },
      "SO4^2-(aq)": { name: name("sulfate ion"), Hf: -909.34, S: 18.50, D: 1.07, src: CODATA + DW },
      "HSO4-(aq)": { name: name("hydrogen sulfate ion"), Hf: -886.9, S: 131.7, D: 1.22, src: CODATA + DW },
      "SCN-(aq)": { name: name("thiocyanate ion"), Hf: null, D: 1.758, src: NONE + DL },
      "Ag+(aq)": { name: name("silver ion"), Hf: 105.79, S: 73.45, D: 1.648, src: CODATA + DL },
      "Ba^2+(aq)": { name: name("barium ion"), Hf: null, D: 0.848, flame: "#b7f23c", src: NONE + DW + GLOW },
      "Ca^2+(aq)": { name: name("calcium ion"), Hf: -543.0, S: -56.2, D: 0.792, flame: "#ff6a2a", src: CODATA + DW + GLOW },
      "Sr^2+(aq)": { name: name("strontium ion"), Hf: null, D: 0.794, flame: "#ff2a1a", src: NONE + DW + GLOW },
      "Li+(aq)": { name: name("lithium ion"), Hf: -278.47, S: 12.24, D: 1.03, flame: "#e8173a", src: CODATA + DW + GLOW },
      "CO3^2-(aq)": { name: name("carbonate ion"), Hf: -675.23, S: -50.0, D: 0.955, src: CODATA + DW },
      "HCO3-(aq)": { name: name("hydrogen carbonate ion"), Hf: -689.93, S: 98.4, D: 1.18, src: CODATA + DW },
      "CO2(aq)": { name: name("carbon dioxide, dissolved"), Hf: -413.26, S: 119.36, src: CODATA },
      "H2O2(aq)": { name: name("hydrogen peroxide"), Hf: -191.17, src: "textbook value: enthalpy of formation in solution -191.17 kJ/mol" },
      "Mg^2+(aq)": { name: name("magnesium ion"), Hf: -467.0, S: -137, D: 0.705, src: CODATA + DW },
      // bands: [Wellenlänge des Maximums in nm, Halbwertsbreite in nm, molarer Absorptionskoeffizient in L/(mol cm)]
      "Cu^2+(aq)": { name: name("copper(II) ion"), Hf: 64.9, S: -98, D: 0.733, bands: [[810, 200, 12]], flame: "#3ddc84", src: CODATA + DW + BAND + GLOW },
      "CuOH+(aq)": { name: name("copper(II) hydroxide ion"), Hf: null, bands: [[810, 200, 12]], src: NONE + BAND },
      // In konzentrierter Lösung und in der Wärme hydrolysiert Kupfer vor allem zu diesem zweikernigen Teilchen. Ohne es wäre heiße
      // Kupfersulfat-Lösung zu wenig sauer gerechnet und an Kupferhydroxid übersättigt.
      "Cu2(OH)2^2+(aq)": { name: name("dicopper(II) dihydroxide ion"), Hf: null, bands: [[810, 200, 24]], flame: "#3ddc84", src: NONE + BAND + GLOW },
      "CuSO4(aq)": { name: name("copper sulfate, dissolved ion pair"), Hf: null, bands: [[810, 200, 12]], flame: "#3ddc84", src: NONE + BAND + GLOW },
      "Fe^3+(aq)": { name: name("iron(III) ion"), Hf: null, D: 0.604, src: NONE + DL },
      // Zink und Eisen(II) mit ihren Hydroxo-Teilchen: Zinkhydroxid löst sich in Säure und in Lauge (Zinkat)
      "Zn^2+(aq)": { name: name("zinc ion"), Hf: -153.39, S: -109.8, D: 0.715, src: CODATA + DW },
      "ZnOH+(aq)": { name: name("zinc hydroxide ion"), Hf: null, src: NONE },
      "Zn(OH)2(aq)": { name: name("zinc hydroxide, dissolved"), Hf: null, src: NONE },
      "Zn(OH)3-(aq)": { name: name("trihydroxozincate ion"), Hf: null, src: NONE },
      "Zn(OH)4^2-(aq)": { name: name("tetrahydroxozincate ion"), Hf: null, src: NONE },
      // Schwache Ionenpaare, nur im realen Modell (siehe equilibria): Sie gehören zu den Parametern der Aktivitätskoeffizienten.
      "NaSO4-(aq)": { name: name("sodium sulfate ion pair"), Hf: null, D: 0.4, src: NONE + DW },
      "KSO4-(aq)": { name: name("potassium sulfate ion pair"), Hf: null, D: 1.6, src: NONE + DW },
      "CaSO4(aq)": { name: name("calcium sulfate, dissolved ion pair"), Hf: null, src: NONE },
      "CaOH+(aq)": { name: name("calcium hydroxide ion"), Hf: null, src: NONE },
      "MgSO4(aq)": { name: name("magnesium sulfate, dissolved ion pair"), Hf: null, src: NONE },
      "MgOH+(aq)": { name: name("magnesium hydroxide ion"), Hf: null, src: NONE },
      "CaCO3(aq)": { name: name("calcium carbonate, dissolved ion pair"), Hf: null, src: NONE },
      "CaHCO3+(aq)": { name: name("calcium hydrogen carbonate ion pair"), Hf: null, D: 0.506, src: NONE + DW },
      "MgCO3(aq)": { name: name("magnesium carbonate, dissolved ion pair"), Hf: null, src: NONE },
      "MgHCO3+(aq)": { name: name("magnesium hydrogen carbonate ion pair"), Hf: null, D: 0.478, src: NONE + DW },
      "SrCO3(aq)": { name: name("strontium carbonate, dissolved ion pair"), Hf: null, src: NONE },
      "SrHCO3+(aq)": { name: name("strontium hydrogen carbonate ion pair"), Hf: null, src: NONE },
      "BaCO3(aq)": { name: name("barium carbonate, dissolved ion pair"), Hf: null, src: NONE },
      "BaHCO3+(aq)": { name: name("barium hydrogen carbonate ion pair"), Hf: null, src: NONE },
      // Chlorokomplexe des Silbers, ebenfalls nur im realen Modell: mit ihnen löst sich Silberchlorid in konzentrierter Salzsäure
      "AgCl(aq)": { name: name("silver chloride, dissolved"), Hf: null, src: NONE },
      "AgCl2-(aq)": { name: name("dichloroargentate(I) ion"), Hf: null, src: NONE },
      "AgCl3^2-(aq)": { name: name("trichloroargentate(I) ion"), Hf: null, src: NONE },
      "ZnSO4(aq)": { name: name("zinc sulfate, dissolved ion pair"), Hf: null, src: NONE },
      // color und at: nur eine Farbe bekannt; sie gilt für die Konzentration at in mol/L
      "Fe^2+(aq)": { name: name("iron(II) ion"), Hf: -92.26, D: 0.719, color: "#cfe6c4", at: 0.5,
        src: "llnl.dat (USGS): Fe+2, Enthalpy of formation -22.05 kcal/mol" + DW + "; colour estimated from the pale green solution" },
      "FeOH+(aq)": { name: name("iron(II) hydroxide ion"), Hf: null, src: NONE },
      "FeSO4(aq)": { name: name("iron(II) sulfate, dissolved ion pair"), Hf: null, color: "#cfe6c4", at: 0.5, src: NONE + "; colour as the iron(II) ion" },
      // Halogene in Lösung
      // die zweite, schwache und sehr breite Bande reicht bis ins Rote: verdünnt ist die Lösung gelb, konzentrierter braun, dann fast schwarz
      "I3-(aq)": { name: name("triiodide ion"), Hf: -51.46, bands: [[350, 130, 26000], [520, 380, 80]],
        src: "llnl.dat (USGS): I3-, Enthalpy of formation -12.3 kcal/mol" + BAND },
      "Br2(aq)": { name: name("bromine, dissolved"), Hf: null, bands: [[400, 110, 170]], src: NONE + BAND },
      "C12H22O11(aq)": { name: name("sucrose (sugar)"), Hf: null, src: NONE },
      "FeOH^2+(aq)": { name: name("iron(III) hydroxide ion"), Hf: null, bands: [[300, 165, 2000]], src: NONE + BAND },
      // Schwefel in seinen Oxidationsstufen: Thiosulfat zerfällt in Säure zu Schwefel und Schwefeldioxid
      "S2O3^2-(aq)": { name: name("thiosulfate ion"), Hf: null, D: 1.132, src: NONE + DL },
      "HS2O3-(aq)": { name: name("hydrogen thiosulfate ion"), Hf: null, src: NONE },
      "SO2(aq)": { name: name("sulfur dioxide, dissolved (sulfurous acid)"), Hf: -322.98,
        src: LLNL + "SO2, Enthalpy of formation -77.194 kcal/mol" },
      "HSO3-(aq)": { name: name("hydrogen sulfite ion"), Hf: -626.22, src: LLNL + "HSO3-, Enthalpy of formation -149.67 kcal/mol" },
      "SO3^2-(aq)": { name: name("sulfite ion"), Hf: -635.55, src: LLNL + "SO3-2, Enthalpy of formation -151.9 kcal/mol" },
      "S2O8^2-(aq)": { name: name("peroxodisulfate ion"), Hf: null, src: NONE },
      "S4O6^2-(aq)": { name: name("tetrathionate ion"), Hf: null, src: NONE },
      // Farbige Ionen für Gleichgewichte und Fotometrie
      "CrO4^2-(aq)": { name: name("chromate ion"), Hf: -881.15, D: 1.132, bands: [[373, 75, 4800]],
        src: LLNL + "CrO4-2, Enthalpy of formation -210.6 kcal/mol" + DL + "; absorption band estimated from usual table values (maximum at 373 nm, 4800 L/(mol cm))" },
      "HCrO4-(aq)": { name: name("hydrogen chromate ion"), Hf: -878.22, bands: [[350, 85, 1600], [435, 80, 220]],
        src: LLNL + "HCrO4-, Enthalpy of formation -209.9 kcal/mol" + BAND },
      "Cr2O7^2-(aq)": { name: name("dichromate ion"), Hf: -1490.34, bands: [[350, 90, 2700], [445, 90, 380]],
        src: LLNL + "Cr2O7-2, Enthalpy of formation -356.2 kcal/mol; absorption bands estimated from usual table values (350 nm and shoulder around 450 nm)" },
      "Co^2+(aq)": { name: name("cobalt(II) ion"), Hf: -58.16, D: 0.732, bands: [[510, 85, 4.8]],
        src: LLNL + "Co+2, Enthalpy of formation -13.9 kcal/mol" + DL + "; absorption band estimated from usual table values (510 nm, 4.8 L/(mol cm))" },
      "CoCl4^2-(aq)": { name: name("tetrachlorocobaltate(II) ion"), Hf: null, bands: [[690, 70, 600], [625, 70, 350]],
        src: NONE + "; absorption bands estimated from usual table values (maxima around 690 and 625 nm, about 600 L/(mol cm))" },
      "MnO4-(aq)": { name: name("permanganate ion"), Hf: -541.41, D: 1.632, bands: [[526, 70, 2400]],
        src: LLNL + "MnO4-, Enthalpy of formation -129.4 kcal/mol" + DL + "; absorption band estimated from usual table values (around 525 nm, about 2400 L/(mol cm))" },
      "Mn^2+(aq)": { name: name("manganese(II) ion"), Hf: -220.60, D: 0.688, src: LLNL + "Mn+2, Enthalpy of formation -52.724 kcal/mol" + DW },
      // Kristallviolett: das farbige Kation und das farblose Carbinol, das mit Lauge daraus entsteht
      "C25H30N3+(aq)": { name: name("crystal violet (cation)"), symbol: "CV", Hf: null, bands: [[590, 80, 87000]],
        src: NONE + "; absorption band estimated from usual table values (590 nm, 87000 L/(mol cm))" },
      "C25H31N3O(aq)": { name: name("crystal violet carbinol (colourless)"), symbol: "CV–OH", Hf: null, src: NONE },
      // Stärke: gerechnet wird mit Abschnitten der Amylose-Helix aus 18 Glucose-Einheiten, von denen jeder ein Triiodid-Ion aufnimmt
      "C108H180O90(aq)": { name: name("starch (segment of the amylose helix)"), symbol: "Amylose", Hf: null,
        src: NONE + "; simplified: one site for iodine per 18 glucose units" },
      "C108H180O90I3-(aq)": { name: name("iodine–starch complex"), symbol: "Amylose·I₃", Hf: null, bands: [[600, 150, 40000]],
        src: NONE + "; absorption band estimated from the blue colour (maximum around 600 nm)" },

      // ---------------------------------------------------------------- schwache Säuren und Basen
      // Vm: Eigenvolumen in mL/mol (60,05 g/mol bei 1,049 g/cm³): Konzentrierte Essigsäure enthält entsprechend weniger Wasser
      // Tb, Hvap: Eisessig siedet. Hvap ist so gewählt, dass der Dampfdruck nach Clausius-Clapeyron vom Siedepunkt aus den gemessenen
      // bei 25 °C trifft; die gemessene Verdampfungsenthalpie (23,7 kJ/mol beim Siedepunkt) ist kleiner, weil der Dampf zum Teil aus Dimeren besteht
      "CH3COOH(aq)": { name: name("acetic acid"), Hf: null, Vm: 57.25, Tb: 117.9, Hvap: 40.5, cp: 123.1,
        src: NONE + "; density 1.049 g/cm³, boiling point 117.9 °C, vapour pressure 15.7 mmHg at 25 °C: PubChem, Hazardous Substances Data Bank (public domain); " +
          "Hvap = R · ln(760/15.7) / (1/298.15 K − 1/391.05 K) = 40.5 kJ/mol; cp of the liquid 123.1 J/(mol K) at 298.15 K: NIST Chemistry WebBook (Martin and Andon, 1982)" },
      // dasselbe Eigenvolumen wie die Säure (H+ hat keines): so bleibt das Volumen gleich, wenn sie dissoziiert
      "CH3COO-(aq)": { name: name("acetate ion"), Hf: null, D: 1.089, Vm: 57.25, src: NONE + DL },
      "NH3(aq)": { name: name("ammonia"), Hf: null, src: NONE },
      "NH4+(aq)": { name: name("ammonium ion"), Hf: -133.26, S: 111.17, D: 1.98, src: CODATA + DW },

      // ---------------------------------------------------------------- Komplexe
      "FeSCN^2+(aq)": { name: name("iron(III) thiocyanate complex"), Hf: null, bands: [[460, 110, 4700]], src: NONE + BAND },
      "CuNH3^2+(aq)": { name: name("amminecopper(II) ion"), Hf: null, bands: [[745, 190, 20]], src: NONE + BAND },
      "Cu(NH3)2^2+(aq)": { name: name("diamminecopper(II) ion"), Hf: null, bands: [[690, 180, 30]], src: NONE + BAND },
      "Cu(NH3)3^2+(aq)": { name: name("triamminecopper(II) ion"), Hf: null, bands: [[645, 150, 42]], src: NONE + BAND },
      "Cu(NH3)4^2+(aq)": { name: name("tetraamminecopper(II) ion"), Hf: null, bands: [[610, 130, 55]], src: NONE + BAND },
      "Ag(NH3)2+(aq)": { name: name("diamminesilver ion"), Hf: null, src: NONE },

      // ---------------------------------------------------------------- Feststoffe und Gase
      "Mg(s)": { name: name("magnesium"), Hf: 0, S: 32.67, cp: 24.9, rho: 1.74, color: "#b9bdc6", src: CODATA + TABLE },
      "H2(g)": { name: name("hydrogen"), Hf: 0, S: 130.680, cp: 28.8, src: CODATA + TABLE },
      "O2(g)": { name: name("oxygen"), Hf: 0, S: 205.152, cp: 29.4, src: CODATA + GAS },
      "CO2(g)": { name: name("carbon dioxide"), Hf: -393.51, S: 213.785, cp: 37.1, src: CODATA + GAS },
      // smell: das Gas riecht stechend
      "NH3(g)": { name: name("ammonia"), Hf: -45.94, S: 192.77, cp: 35.1, smell: true, src: CODATA + GAS },
      "HCl(g)": { name: name("hydrogen chloride"), Hf: -92.31, S: 186.902, cp: 29.1, smell: true, src: CODATA + GAS },
      "SO2(g)": { name: name("sulfur dioxide"), Hf: -296.81, S: 248.223, cp: 39.9, smell: true, src: CODATA + GAS },
      "CH3COOH(g)": { name: name("acetic acid vapour"), Hf: null, cp: 63.4, smell: true, src: NONE + GAS },
      "H2O2(g)": { name: name("hydrogen peroxide vapour"), Hf: null, cp: 43.1, src: NONE + GAS },
      "Cl2(g)": { name: name("chlorine"), Hf: 0, S: 223.081, cp: 33.9, smell: true, src: CODATA + GAS },
      // Metalle: als Stücke, als Elektroden und als Belag, der sich abscheidet
      "Zn(s)": { name: name("zinc"), Hf: 0, S: 41.63, cp: 25.4, rho: 7.14, color: "#9aa3ad", src: CODATA + TABLE + "; " + LOOK },
      "Cu(s)": { name: name("copper"), Hf: 0, S: 33.15, cp: 24.4, rho: 8.96, color: "#b5653a", settle: 4, src: CODATA + TABLE + "; " + LOOK },
      "Ag(s)": { name: name("silver"), Hf: 0, S: 42.55, cp: 25.4, rho: 10.49, color: "#c3c7cc", settle: 4, src: CODATA + TABLE + "; " + LOOK },
      "Fe(s)": { name: name("iron"), Hf: 0, cp: 25.1, rho: 7.87, color: "#6f747b", settle: 4, src: ELEMENT + "heat capacity and density: usual table values; " + LOOK },
      "Pt(s)": { name: name("platinum"), Hf: 0, cp: 25.9, rho: 21.45, color: "#d3d6da", src: ELEMENT + "heat capacity and density: usual table values; " + LOOK },
      "I2(s)": { name: name("iodine"), Hf: 0, S: 116.14, cp: 54.4, rho: 4.93, color: "#3a3340", src: CODATA + TABLE + "; " + LOOK },
      "Zn(OH)2(s)": { name: name("zinc hydroxide"), Hf: null, color: WHITE, settle: 60, src: LOOK },
      "Fe(OH)2(s)": { name: name("iron(II) hydroxide"), Hf: null, color: "#b9c8ae", settle: 60, src: LOOK },
      "MgO(s)": { name: name("magnesium oxide"), Hf: -601.60, S: 26.95, color: WHITE, src: CODATA + "; " + LOOK },
      // colloid: entsteht er in einer Lösung, ist er so fein verteilt, dass er in der Schwebe bleibt und sich nicht absetzt
      "S(s)": { name: name("sulfur"), Hf: 0, S: 32.054, color: "#e8d44a", colloid: true, src: CODATA + "; " + LOOK },
      "C(s)": { name: name("carbon (charcoal, graphite)"), Hf: 0, S: 5.74, color: "#2a2a2a", src: CODATA + " (graphite); " + LOOK },
      "MnO2(s)": { name: name("manganese dioxide"), Hf: null, color: "#2b2622", src: LOOK },
      "NaCl(s)": { name: name("sodium chloride"), Hf: -411.12, color: WHITE, flame: "#ffd21f", shine: 30,
        src: "llnl.dat (USGS): Halite, Enthalpy of formation -98.26 kcal/mol; " + LOOK + GLOW },
      "CuSO4*5H2O(s)": { name: name("copper sulfate pentahydrate"), Hf: null, color: "#2f6fd0", flame: "#3ddc84", src: LOOK + GLOW },
      "CuSO4(s)": { name: name("copper sulfate, anhydrous"), Hf: null, color: "#eceeea", flame: "#3ddc84", src: LOOK + GLOW },
      "CaCO3(s)": { name: name("calcium carbonate"), Hf: null, color: WHITE, flame: "#ff6a2a", src: LOOK + GLOW },
      "BaCO3(s)": { name: name("barium carbonate"), Hf: null, color: WHITE, src: LOOK },
      "SrCO3(s)": { name: name("strontium carbonate"), Hf: null, color: WHITE, src: LOOK },
      "SrSO4(s)": { name: name("strontium sulfate"), Hf: null, color: WHITE, src: LOOK },
      "Ag2CO3(s)": { name: name("silver carbonate"), Hf: null, color: "#f0edc8", src: LOOK },
      "CuCO3(s)": { name: name("copper(II) carbonate"), Hf: null, color: "#7fc8b0", settle: 60, src: LOOK },
      "MgCO3*3H2O(s)": { name: name("magnesium carbonate trihydrate"), Hf: null, color: WHITE, src: LOOK },
      "CaSO4*2H2O(s)": { name: name("calcium sulfate dihydrate (gypsum)"), Hf: null, color: WHITE, src: LOOK },
      "Ca(OH)2(s)": { name: name("calcium hydroxide"), Hf: null, color: WHITE, src: LOOK },
      "AgCl(s)": { name: name("silver chloride"), Hf: -127.01, S: 96.25, color: WHITE, src: CODATA + "; " + LOOK },
      "AgBr(s)": { name: name("silver bromide"), Hf: null, color: "#efe9c9", src: LOOK },
      "AgI(s)": { name: name("silver iodide"), Hf: null, color: "#ece28a", src: LOOK },
      "AgSCN(s)": { name: name("silver thiocyanate"), Hf: null, color: WHITE, src: LOOK },
      "Ag2SO4(s)": { name: name("silver sulfate"), Hf: null, color: WHITE, src: LOOK },
      "Ag2O(s)": { name: name("silver oxide"), Hf: null, color: "#4a3a2c", src: LOOK },
      "BaSO4(s)": { name: name("barium sulfate"), Hf: null, color: WHITE, src: LOOK },
      "BaCrO4(s)": { name: name("barium chromate"), Hf: null, color: "#f2d92c", src: LOOK },
      "Ag2CrO4(s)": { name: name("silver chromate"), Hf: null, color: "#8f2f1f", src: LOOK },
      // entsteht aus Kupfer(II) und Iodid und bleibt, wie es ist: Kupfer(I) in Lösung kennt der Baustein nicht
      "CuI(s)": { name: name("copper(I) iodide"), Hf: null, color: "#efe9d6", src: LOOK },
      // settle: Zeitkonstante in s, mit der sich der Niederschlag absetzt; flockige Hydroxide brauchen länger
      "Cu(OH)2(s)": { name: name("copper(II) hydroxide"), Hf: null, color: "#86bfe8", settle: 60, src: LOOK },
      "Fe(OH)3(s)": { name: name("iron(III) hydroxide"), Hf: null, color: "#8a4a22", settle: 60, src: LOOK },
      "Mg(OH)2(s)": { name: name("magnesium hydroxide"), Hf: null, color: WHITE, settle: 60, src: LOOK },

      // ---------------------------------------------------------------- Indikatoren
      // symbol: Kurzzeichen statt der langen Formel; Hf unbekannt, der Umschlag rechnet ohne Wärme.
      "C27H28Br2O5S(aq)": { name: name("bromothymol blue (yellow form)"), symbol: "HBtb", Hf: null, bands: [[432, 110, 20000]], src: DYE },
      "C27H27Br2O5S-(aq)": { name: name("bromothymol blue (blue form)"), symbol: "Btb", Hf: null, bands: [[617, 70, 36000], [575, 60, 12000]], src: DYE },
      // vereinfacht: ein Proton statt zweier. Die rosa Form ist in Wirklichkeit das zweifach geladene Anion.
      "C20H14O4(aq)": { name: name("phenolphthalein (colourless form)"), symbol: "HPp", Hf: null, src: DYE },
      "C20H13O4-(aq)": { name: name("phenolphthalein (pink form)"), symbol: "Pp", Hf: null, bands: [[553, 60, 30000]],
        src: DYE + "; simplified as a singly charged anion, the pink form is actually doubly charged" },
      "C14H15N3O3S(aq)": { name: name("methyl orange (red form)"), symbol: "HMo", Hf: null, bands: [[510, 120, 40000], [430, 80, 8000]], src: DYE },
      "C14H14N3O3S-(aq)": { name: name("methyl orange (yellow form)"), symbol: "Mo", Hf: null, bands: [[464, 110, 26000]], src: DYE },
      "C27H30O5S(aq)": { name: name("thymol blue (red form)"), symbol: "H2Tb", Hf: null, bands: [[544, 80, 28000]], src: DYE },
      "C27H29O5S-(aq)": { name: name("thymol blue (yellow form)"), symbol: "HTb", Hf: null, bands: [[430, 100, 14000]], src: DYE },
      "C27H28O5S^2-(aq)": { name: name("thymol blue (blue form)"), symbol: "Tb", Hf: null, bands: [[596, 70, 30000]], src: DYE },
      "C15H15N3O2(aq)": { name: name("methyl red (red form)"), symbol: "HMr", Hf: null, bands: [[520, 110, 40000]], src: DYE },
      "C15H14N3O2-(aq)": { name: name("methyl red (yellow form)"), symbol: "Mr", Hf: null, bands: [[430, 100, 18000]], src: DYE }
    },

    equilibria: [
      // ---------------------------------------------------------------- Säuren und Basen
      { eq: "H2O(l) <=> H+(aq) + OH-(aq)", logK: -14.0, src: "phreeqc.dat (USGS): H2O = OH- + H+, log_k -14" },
      { eq: "CH3COOH(aq) <=> H+(aq) + CH3COO-(aq)", logK: -4.757, dH: -0.41, src: MINTEQ + "H+ + Acetate- = H(Acetate), log_k 4.757, delta_h 0.41 kJ; written in reverse" },
      { eq: "NH3(aq) + H2O(l) <=> NH4+(aq) + OH-(aq)", logK: -4.756, dH: 3.8, src: MINTEQ + "NH4+ = NH3 + H+, log_k -9.244, delta_h 52 kJ; converted with the ion product of water" },
      { eq: "HSO4-(aq) <=> H+(aq) + SO4^2-(aq)", logK: -1.99, dH: -22, src: MINTEQ + "H+ + SO4-2 = HSO4-, log_k 1.99, delta_h 22 kJ; written in reverse" },
      { eq: "Fe^3+(aq) + H2O(l) <=> FeOH^2+(aq) + H+(aq)", logK: -2.187, dH: 41.81, src: MINTEQ + "Fe+3 + H2O = FeOH+2 + H+, log_k -2.187, delta_h 41.81 kJ" },
      { eq: "Cu^2+(aq) + H2O(l) <=> CuOH+(aq) + H+(aq)", logK: -7.497, dH: 35.81, src: MINTEQ + "Cu+2 + H2O = CuOH+ + H+, log_k -7.497, delta_h 35.81 kJ" },
      { eq: "2 Cu^2+(aq) + 2 H2O(l) <=> Cu2(OH)2^2+(aq) + 2 H+(aq)", logK: -10.594, dH: 76.62,
        src: MINTEQ + "2 Cu+2 + 2 H2O = Cu2(OH)2+2 + 2 H+, log_k -10.594, delta_h 76.62 kJ" },
      // Ohne dieses Ionenpaar wäre eine Kupfersulfat-Lösung von 1 mol/L an Kupferhydroxid übersättigt.
      { eq: "Cu^2+(aq) + SO4^2-(aq) <=> CuSO4(aq)", logK: 2.36, dH: 8.7, src: MINTEQ + "Cu+2 + SO4-2 = CuSO4, log_k 2.36, delta_h 8.7 kJ" },

      { eq: "Zn^2+(aq) + H2O(l) <=> ZnOH+(aq) + H+(aq)", logK: -8.997, dH: 55.81, src: MINTEQ + "Zn+2 + H2O = ZnOH+ + H+, log_k -8.997, delta_h 55.81 kJ" },
      { eq: "Zn^2+(aq) + 2 H2O(l) <=> Zn(OH)2(aq) + 2 H+(aq)", logK: -17.794, src: MINTEQ + "Zn+2 + 2 H2O = Zn(OH)2 + 2 H+, log_k -17.794" },
      { eq: "Zn^2+(aq) + 3 H2O(l) <=> Zn(OH)3-(aq) + 3 H+(aq)", logK: -28.091, src: MINTEQ + "Zn+2 + 3 H2O = Zn(OH)3- + 3 H+, log_k -28.091" },
      { eq: "Zn^2+(aq) + 4 H2O(l) <=> Zn(OH)4^2-(aq) + 4 H+(aq)", logK: -40.488, src: MINTEQ + "Zn+2 + 4 H2O = Zn(OH)4-2 + 4 H+, log_k -40.488" },
      { eq: "Zn^2+(aq) + SO4^2-(aq) <=> ZnSO4(aq)", logK: 2.34, dH: 6.2, src: MINTEQ + "Zn+2 + SO4-2 = ZnSO4, log_k 2.34, delta_h 6.2 kJ" },
      // Schwache Ionenpaare, nur im realen Modell (model: "real"). Im idealen Modell, ohne Aktivitätskoeffizienten, wären sie weit
      // überschätzt; dort zerfallen diese Salze vollständig, wie im Lehrbuch. Die Sulfat-Paare von Natrium, Kalium und Magnesium
      // stammen aus phreeqc.dat: Mit ihnen zusammen sind dort die Parameter der Aktivitätskoeffizienten bestimmt. Die Paare, zu
      // denen das Grundpaket einen Feststoff kennt (Gips, Calcium- und Magnesiumhydroxid), stammen wie dessen Löslichkeitsprodukt
      // aus minteq.v4.dat, damit beide zusammenpassen.
      { eq: "Na+(aq) + SO4^2-(aq) <=> NaSO4-(aq)", logK: 0.94, dH: 8.23, model: "real", src: "phreeqc.dat (USGS): Na+ + SO4-2 = NaSO4-, log_k 0.94, delta_h 8.23 kJ" },
      { eq: "K+(aq) + SO4^2-(aq) <=> KSO4-(aq)", logK: 1.18, dH: 3, model: "real", src: "phreeqc.dat (USGS): K+ + SO4-2 = KSO4-, log_k 1.18, delta_h 3 kJ" },
      { eq: "Ca^2+(aq) + SO4^2-(aq) <=> CaSO4(aq)", logK: 2.36, dH: 7.1, model: "real", src: MINTEQ + "Ca+2 + SO4-2 = CaSO4, log_k 2.36, delta_h 7.1 kJ" },
      { eq: "Ca^2+(aq) + H2O(l) <=> CaOH+(aq) + H+(aq)", logK: -12.697, dH: 64.11, model: "real", src: MINTEQ + "Ca+2 + H2O = CaOH+ + H+, log_k -12.697, delta_h 64.11 kJ" },
      { eq: "Mg^2+(aq) + SO4^2-(aq) <=> MgSO4(aq)", logK: 2.42, dH: 19, model: "real", src: "phreeqc.dat (USGS): Mg+2 + SO4-2 = MgSO4, log_k 2.42, delta_h 19.0 kJ" },
      { eq: "Mg^2+(aq) + H2O(l) <=> MgOH+(aq) + H+(aq)", logK: -11.397, dH: 67.81, model: "real", src: MINTEQ + "Mg+2 + H2O = MgOH+ + H+, log_k -11.397, delta_h 67.81 kJ" },
      // Ionenpaare der Carbonate von Calcium, Magnesium, Strontium und Barium, aus minteq.v4.dat wie die Löslichkeitsprodukte dieser
      // Carbonate. Nicht eingetragen, weil die Messung dagegen spricht: die Hydrogencarbonat-Paare von Natrium und Kalium aus
      // phreeqc.dat (sie verschieben die Carbonat-Eichlösung vom Sollwert 10,012 weg, auf 10,021 statt 10,013).
      { eq: "Ca^2+(aq) + CO3^2-(aq) <=> CaCO3(aq)", logK: 3.2, dH: 16, model: "real", src: MINTEQ + "CO3-2 + Ca+2 = CaCO3, log_k 3.2, delta_h 16 kJ" },
      { eq: "Ca^2+(aq) + H+(aq) + CO3^2-(aq) <=> CaHCO3+(aq)", logK: 11.599, dH: 5.4, model: "real", src: MINTEQ + "Ca+2 + H+ + CO3-2 = CaHCO3+, log_k 11.599, delta_h 5.4 kJ" },
      { eq: "Mg^2+(aq) + CO3^2-(aq) <=> MgCO3(aq)", logK: 2.92, dH: 12, model: "real", src: MINTEQ + "Mg+2 + CO3-2 = MgCO3, log_k 2.92, delta_h 12 kJ" },
      { eq: "Mg^2+(aq) + H+(aq) + CO3^2-(aq) <=> MgHCO3+(aq)", logK: 11.339, dH: -10.6, model: "real", src: MINTEQ + "Mg+2 + H+ + CO3-2 = MgHCO3+, log_k 11.339, delta_h -10.6 kJ" },
      { eq: "Sr^2+(aq) + CO3^2-(aq) <=> SrCO3(aq)", logK: 2.81, dH: 20, model: "real", src: MINTEQ + "Sr+2 + CO3-2 = SrCO3, log_k 2.81, delta_h 20 kJ" },
      { eq: "Sr^2+(aq) + H+(aq) + CO3^2-(aq) <=> SrHCO3+(aq)", logK: 11.539, dH: 10.4, model: "real", src: MINTEQ + "Sr+2 + H+ + CO3-2 = SrHCO3+, log_k 11.539, delta_h 10.4 kJ" },
      { eq: "Ba^2+(aq) + CO3^2-(aq) <=> BaCO3(aq)", logK: 2.71, dH: 16, model: "real", src: MINTEQ + "Ba+2 + CO3-2 = BaCO3, log_k 2.71, delta_h 16 kJ" },
      { eq: "Ba^2+(aq) + H+(aq) + CO3^2-(aq) <=> BaHCO3+(aq)", logK: 11.309, dH: 10.4, model: "real", src: MINTEQ + "Ba+2 + H+ + CO3-2 = BaHCO3+, log_k 11.309, delta_h 10.4 kJ" },
      // Chlorokomplexe des Silbers aus minteq.v4.dat (wie das Löslichkeitsprodukt von Silberchlorid), bis zum dritten. Der vierte
      // (Ag+ + 4 Cl- = AgCl4-3, log_k 5.51) ist nicht eingetragen: Für das dreifach geladene Ion nennt keine der Datenbanken
      // Parameter des Aktivitätskoeffizienten, und nach Davies gerechnet löste sich Silberchlorid in Chlorid-Lösung von 1 mol/L
      // knapp dreimal, in konzentrierter Salzsäure zehnmal so gut wie im Labor (etwa 1e-4 und 0,03 mol/L). Ohne ihn sind es
      // 6e-5 und 5e-3 mol/L. Auch die Chlorokomplexe des Kupfers(II) aus phreeqc.dat sind nicht eingetragen: Mit ihnen läge der
      // mittlere Aktivitätskoeffizient von Kupferchlorid bei 1 mol/L um 38 % statt um 10 % unter dem Tabellenwert.
      { eq: "Ag+(aq) + Cl-(aq) <=> AgCl(aq)", logK: 3.31, dH: -12, model: "real", src: MINTEQ + "Ag+ + Cl- = AgCl, log_k 3.31, delta_h -12 kJ" },
      { eq: "Ag+(aq) + 2 Cl-(aq) <=> AgCl2-(aq)", logK: 5.25, dH: -16, model: "real", src: MINTEQ + "Ag+ + 2 Cl- = AgCl2-, log_k 5.25, delta_h -16 kJ" },
      { eq: "Ag+(aq) + 3 Cl-(aq) <=> AgCl3^2-(aq)", logK: 5.2, model: "real", src: MINTEQ + "Ag+ + 3 Cl- = AgCl3-2, log_k 5.2" },
      { eq: "Fe^2+(aq) + H2O(l) <=> FeOH+(aq) + H+(aq)", logK: -9.397, dH: 55.81, src: MINTEQ + "Fe+2 + H2O = FeOH+ + H+, log_k -9.397, delta_h 55.81 kJ" },
      { eq: "Fe^2+(aq) + SO4^2-(aq) <=> FeSO4(aq)", logK: 2.39, dH: 8, src: MINTEQ + "Fe+2 + SO4-2 = FeSO4, log_k 2.39, delta_h 8 kJ" },

      { eq: "CrO4^2-(aq) + H+(aq) <=> HCrO4-(aq)", logK: 6.4944, src: LLNL + "H+ + CrO4-2 = HCrO4-, log_k 6.4944" },
      { eq: "2 CrO4^2-(aq) + 2 H+(aq) <=> Cr2O7^2-(aq) + H2O(l)", logK: 14.5192, src: LLNL + "2 H+ + 2 CrO4-2 = Cr2O7-2 + H2O, log_k 14.5192" },
      { eq: "S2O3^2-(aq) + H+(aq) <=> HS2O3-(aq)", logK: 1.0139, src: LLNL + "H+ + S2O3-2 = HS2O3-, log_k 1.0139" },
      { eq: "SO2(aq) + H2O(l) <=> H+(aq) + HSO3-(aq)", logK: -1.8602,
        src: LLNL + "2 H+ + SO3-2 = SO2 + H2O, log_k 9.0656, and SO3-2 + H+ = HSO3-, log_k 7.2054; converted from these" },
      { eq: "HSO3-(aq) <=> H+(aq) + SO3^2-(aq)", logK: -7.2054, src: LLNL + "SO3-2 + H+ = HSO3-, log_k 7.2054; written in reverse" },
      { eq: "HCO3-(aq) <=> H+(aq) + CO3^2-(aq)", logK: -10.329, src: "phreeqc.dat (USGS): CO3-2 + H+ = HCO3-, log_k 10.329; written in reverse" },
      { eq: "CO2(aq) + H2O(l) <=> H+(aq) + HCO3-(aq)", logK: -6.352, src: "phreeqc.dat (USGS): CO3-2 + 2 H+ = CO2 + H2O, log_k 16.681; converted with CO3-2 + H+ = HCO3-, log_k 10.329" },

      // ---------------------------------------------------------------- Gase über der Lösung
      // logK: gelöste Konzentration in mol/L bei 1 bar des Gases
      { eq: "CO2(g) <=> CO2(aq)", logK: -1.468, src: "phreeqc.dat (USGS): CO2(g), CO2 = CO2, log_k -1.468" },
      { eq: "SO2(g) <=> SO2(aq)", logK: 0.17, src: LLNL + "SO2(g), SO2 = SO2, log_k 0.17" },
      { eq: "NH3(g) <=> NH3(aq)", logK: 1.7966, dH: -35.23, src: LLNL + "NH3(g), NH3 = NH3, log_k 1.7966, delta_H -35.2251 kJ/mol" },
      { eq: "HCl(g) <=> H+(aq) + Cl-(aq)", logK: 6.3055, src: LLNL + "HCl(g), HCl = Cl- + H+, log_k 6.3055" },
      { eq: "CH3COOH(g) <=> CH3COOH(aq)", logK: 3.6, dH: -52, src: "textbook value: Henry constant about 4·10³ mol/(L bar) at 25 °C, enthalpy of solution about -52 kJ/mol" },
      { eq: "H2O2(g) <=> H2O2(aq)", logK: 4.9, dH: -61, src: "textbook value: Henry constant about 8·10⁴ mol/(L bar) at 25 °C, enthalpy of solution about -61 kJ/mol" },

      // ---------------------------------------------------------------- Komplexe
      // Rechnet der Baustein mit Konzentrationen, bildet sich der blaue Komplex erst in sehr konzentrierter Chlorid-Lösung. Die Konstante
      // ist deshalb so gewählt, dass die Lösung mit Salzsäure von etwa 7 mol/L bei Raumtemperatur violett ist: kalt rosa, heiß blau.
      { eq: "Co^2+(aq) + 4 Cl-(aq) <=> CoCl4^2-(aq)", logK: -6.0, dH: 54,
        src: "adjusted to the observation in the school experiment (pink in the cold, violet at room temperature, blue in the heat); reaction enthalpy: textbook value about +50 kJ/mol" },
      { eq: "C108H180O90(aq) + I3-(aq) <=> C108H180O90I3-(aq)", logK: 5.0, dH: -80,
        src: "estimated: starch turns blue from about 10⁻⁵ mol/L iodine; the colour disappears on heating to about 80 °C and returns on cooling" },
      { eq: "Fe^3+(aq) + SCN-(aq) <=> FeSCN^2+(aq)", logK: 3.0, src: "textbook value: formation constant about 10³" },
      { eq: "Cu^2+(aq) + NH3(aq) <=> CuNH3^2+(aq)", logK: 4.04, dH: -22.5, src: LLNL + "NH3 + Cu+2 = CuNH3+2, log_k 4.04" + STEP },
      { eq: "Cu^2+(aq) + 2 NH3(aq) <=> Cu(NH3)2^2+(aq)", logK: 7.4512, dH: -45.13, src: LLNL + "2 NH3 + Cu+2 = Cu(NH3)2+2, log_k 7.4512, delta_H -45.1269 kJ/mol" },
      { eq: "Cu^2+(aq) + 3 NH3(aq) <=> Cu(NH3)3^2+(aq)", logK: 10.2719, dH: -67.28, src: LLNL + "3 NH3 + Cu+2 = Cu(NH3)3+2, log_k 10.2719, delta_H -67.2779 kJ/mol" },
      { eq: "Cu^2+(aq) + 4 NH3(aq) <=> Cu(NH3)4^2+(aq)", logK: 12.40, dH: -90, src: "textbook value: fourth stepwise constant 10^2.13 (Bjerrum, in ammonium nitrate solution), added to the value for three ammonia from llnl.dat. " +
        "The critically evaluated value at ionic strength 0 is smaller: 10^1.48 (Martell and Smith, Critical Stability Constants); textbooks often give " +
        "overall constants around 10^13 from concentrated salt solutions. The middle value is chosen because the experiment runs in ammonia-rich solution" + STEP },
      { eq: "Ag+(aq) + 2 NH3(aq) <=> Ag(NH3)2+(aq)", logK: 7.220, dH: -56, src: MINTEQ + "Ag+ + 2 NH4+ = Ag(NH3)2+ + 2 H+, log_k -11.268; converted with NH4+ = NH3 + H+. Reaction enthalpy: textbook value -56 kJ/mol" },

      // ---------------------------------------------------------------- Löslichkeit
      { eq: "AgCl(s) <=> Ag+(aq) + Cl-(aq)", logK: -9.75, src: MINTEQ + "Cerargyrite, AgCl = Ag+ + Cl-, log_k -9.75" },
      { eq: "AgBr(s) <=> Ag+(aq) + Br-(aq)", logK: -12.3, dH: 84.5, src: MINTEQ + "Bromyrite, AgBr = Ag+ + Br-, log_k -12.3, delta_h 84.5 kJ" },
      { eq: "AgI(s) <=> Ag+(aq) + I-(aq)", logK: -16.08, dH: 110, src: MINTEQ + "Iodyrite, AgI = Ag+ + I-, log_k -16.08, delta_h 110 kJ" },
      { eq: "AgSCN(s) <=> Ag+(aq) + SCN-(aq)", logK: -12.0, src: "textbook value: solubility product 1.0·10⁻¹² mol²/L²" },
      { eq: "Ag2SO4(s) <=> 2 Ag+(aq) + SO4^2-(aq)", logK: -4.82, dH: 17, src: MINTEQ + "Ag2SO4 = 2 Ag+ + SO4-2, log_k -4.82, delta_h 17 kJ" },
      { eq: "Ag2O(s) + H2O(l) <=> 2 Ag+(aq) + 2 OH-(aq)", logK: -15.426, dH: 66.0, src: MINTEQ + "Ag2O + 2 H+ = 2 Ag+ + H2O, log_k 12.574, delta_h -45.62 kJ; converted with the ion product of water" },
      { eq: "BaCrO4(s) <=> Ba^2+(aq) + CrO4^2-(aq)", logK: -9.67, dH: 33, src: MINTEQ + "BaCrO4 = Ba+2 + CrO4-2, log_k -9.67, delta_h 33 kJ" },
      { eq: "Ag2CrO4(s) <=> 2 Ag+(aq) + CrO4^2-(aq)", logK: -11.59, dH: 62, src: MINTEQ + "Ag2CrO4 = 2 Ag+ + CrO4-2, log_k -11.59, delta_h 62 kJ" },
      { eq: "BaSO4(s) <=> Ba^2+(aq) + SO4^2-(aq)", logK: -9.98, dH: 23, src: MINTEQ + "Barite, BaSO4 = Ba+2 + SO4-2, log_k -9.98, delta_h 23 kJ" },
      { eq: "Cu(OH)2(s) <=> Cu^2+(aq) + 2 OH-(aq)", logK: -19.326, dH: 55.2, src: MINTEQ + "Cu(OH)2 + 2 H+ = Cu+2 + 2 H2O, log_k 8.674, delta_h -56.42 kJ; converted with the ion product of water" },
      { eq: "Fe(OH)3(s) <=> Fe^3+(aq) + 3 OH-(aq)", logK: -37.109, src: "phreeqc.dat (USGS): Fe(OH)3(a), freshly precipitated, Fe(OH)3 + 3 H+ = Fe+3 + 3 H2O, log_k 4.891; converted with the ion product of water" },
      { eq: "Mg(OH)2(s) <=> Mg^2+(aq) + 2 OH-(aq)", logK: -11.156, dH: -2.4, src: MINTEQ + "Brucite, Mg(OH)2 + 2 H+ = Mg+2 + 2 H2O, log_k 16.844, delta_h -113.996 kJ; converted with the ion product of water" },

      { eq: "Zn(OH)2(s) <=> Zn^2+(aq) + 2 OH-(aq)", logK: -15.526, dH: 31.0, src: MINTEQ + "Zn(OH)2(am), Zn(OH)2 + 2 H+ = Zn+2 + 2 H2O, log_k 12.474, delta_h -80.62 kJ; converted with the ion product of water" },
      { eq: "Fe(OH)2(s) <=> Fe^2+(aq) + 2 OH-(aq)", logK: -14.436, src: MINTEQ + "Fe(OH)2 + 2 H+ = Fe+2 + 2 H2O, log_k 13.564; converted with the ion product of water" },
      // Iod löst sich in Iodid-Lösung als Triiodid; ist das Iodid verbraucht, fällt es als Feststoff aus
      { eq: "I2(s) + I-(aq) <=> I3-(aq)", logK: -0.0806, dH: 5.44, src: LLNL + "I2 + H2O = 0.5 O2 + 2 H+ + 2 I-, log_k -24.8084, delta_H 165.967 kJ/mol, and 3 I- + 2 H+ + 0.5 O2 = I3- + H2O, log_k 24.7278, delta_H -160.528 kJ/mol; added together" },

      { eq: "NaCl(s) <=> Na+(aq) + Cl-(aq)", logK: 1.5855, src: LLNL + "Halite, NaCl = Cl- + Na+, log_k 1.5855" },
      { eq: "CuSO4*5H2O(s) <=> Cu^2+(aq) + SO4^2-(aq) + 5 H2O(l)", logK: -2.24, dH: 6.025,
        src: "adjusted to the solubility of 1.4 mol/L at 25 °C, together with the ion pair CuSO4(aq). " + MINTEQ + "Chalcanthite, CuSO4:5H2O = Cu+2 + SO4-2 + 5 H2O, log_k -2.64, delta_h 6.025 kJ" },
      { eq: "CuSO4(s) <=> Cu^2+(aq) + SO4^2-(aq)", logK: 2.9395, dH: -73.04, src: MINTEQ + "CuSO4 = Cu+2 + SO4-2, log_k 2.9395, delta_h -73.04 kJ" },
      // rate: so schnell löst sich ein Stück aus dem Regal, je cm² Oberfläche: in Säure bestimmt der Nachschub an H+ die Geschwindigkeit
      { eq: "CaCO3(s) <=> Ca^2+(aq) + CO3^2-(aq)", logK: -8.48, dH: -8, rate: { k: 5.11e-5, Ea: 8.5, order: { "H+(aq)": 1 } },
        src: MINTEQ + "Calcite, CaCO3 = Ca+2 + CO3-2, log_k -8.48, delta_h -8 kJ. Dissolution rate: phreeqc.dat (USGS), RATES Calcite after " +
          "Plummer, Wigley and Parkhurst (1978), k1 = 10^(0.198 - 444/T) mmol/(cm² s), acid term only" },
      { eq: "BaCO3(s) <=> Ba^2+(aq) + CO3^2-(aq)", logK: -8.57, dH: 4, src: MINTEQ + "Witherite, BaCO3 = Ba+2 + CO3-2, log_k -8.57, delta_h 4 kJ" },
      { eq: "SrCO3(s) <=> Sr^2+(aq) + CO3^2-(aq)", logK: -9.27, src: MINTEQ + "Strontianite, SrCO3 = Sr+2 + CO3-2, log_k -9.27" },
      { eq: "SrSO4(s) <=> Sr^2+(aq) + SO4^2-(aq)", logK: -6.62, dH: 2, src: MINTEQ + "Celestite, SrSO4 = Sr+2 + SO4-2, log_k -6.62, delta_h 2 kJ" },
      { eq: "Ag2CO3(s) <=> 2 Ag+(aq) + CO3^2-(aq)", logK: -11.09, dH: 42.15, src: MINTEQ + "Ag2CO3 = 2 Ag+ + CO3-2, log_k -11.09, delta_h 42.15 kJ" },
      { eq: "CuCO3(s) <=> Cu^2+(aq) + CO3^2-(aq)", logK: -11.5, src: MINTEQ + "CuCO3 = Cu+2 + CO3-2, log_k -11.5" },
      { eq: "MgCO3*3H2O(s) <=> Mg^2+(aq) + CO3^2-(aq) + 3 H2O(l)", logK: -4.67, dH: -24.22, src: MINTEQ + "Nesquehonite, MgCO3:3H2O = Mg+2 + CO3-2 + 3 H2O, log_k -4.67, delta_h -24.2212 kJ" },
      { eq: "CaSO4*2H2O(s) <=> Ca^2+(aq) + SO4^2-(aq) + 2 H2O(l)", logK: -4.61, dH: 1, src: MINTEQ + "Gypsum, CaSO4:2H2O = Ca+2 + SO4-2 + 2 H2O, log_k -4.61, delta_h 1 kJ" },
      { eq: "Ca(OH)2(s) <=> Ca^2+(aq) + 2 OH-(aq)", logK: -5.196, dH: -17.0, src: MINTEQ + "Portlandite, Ca(OH)2 + 2 H+ = Ca+2 + 2 H2O, log_k 22.804, delta_h -128.62 kJ; converted with the ion product of water" },
      { eq: "MgO(s) + H2O(l) <=> Mg^2+(aq) + 2 OH-(aq)", logK: -6.6646, src: LLNL + "Periclase, MgO + 2 H+ = H2O + Mg+2, log_k 21.3354; converted with the ion product of water" },

      // ---------------------------------------------------------------- Indikatoren
      { eq: "C27H28Br2O5S(aq) <=> H+(aq) + C27H27Br2O5S-(aq)", logK: -7.1, src: DYE },
      { eq: "C20H14O4(aq) <=> H+(aq) + C20H13O4-(aq)", logK: -9.4, src: DYE },
      { eq: "C14H15N3O3S(aq) <=> H+(aq) + C14H14N3O3S-(aq)", logK: -3.46, src: DYE },
      { eq: "C27H30O5S(aq) <=> H+(aq) + C27H29O5S-(aq)", logK: -1.65, src: DYE },
      { eq: "C27H29O5S-(aq) <=> H+(aq) + C27H28O5S^2-(aq)", logK: -8.9, src: DYE },
      { eq: "C15H15N3O2(aq) <=> H+(aq) + C15H14N3O2-(aq)", logK: -5.0, src: DYE }
    ],

    // Redoxpaare: oxidierte Form + Elektronen <=> reduzierte Form; E0: Standardpotential in V.
    // over: Überspannung in V bei 1 mA/cm², mit der der Vorgang an einer Oberfläche in Gang kommt:
    // eine Zahl für jede Oberfläche oder je Material. Fehlt sie, läuft der Vorgang ungehemmt.
    couples: [
      { eq: "Mg^2+(aq) + 2 e- <=> Mg(s)", E0: -2.3526, over: 1.0,
        src: LLNL + "Mg + 2 H+ + 0.5 O2 = H2O + Mg+2, log_k 122.5365. Overpotential estimated: magnesium is covered with an oxide layer" },
      { eq: "Zn^2+(aq) + 2 e- <=> Zn(s)", E0: -0.7628, over: 0.05, src: MINTEQ + "Znmetal, Zn = Zn+2 + 2 e-, log_k 25.7886. Overpotential estimated" },
      // Zink in Lauge: derselbe Vorgang, mit dem Zinkat geschrieben. In Lauge läuft er über diesen Weg: so löst sich Zink dort unter Wasserstoffentwicklung.
      { eq: "Zn(OH)4^2-(aq) + 2 e- <=> Zn(s) + 4 OH-(aq)", E0: -1.22164,
        src: "converted from the couple Zn2+/Zn with the formation constant of zincate (" + MINTEQ + "Zn+2 + 4 H2O = Zn(OH)4-2 + 4 H+, log_k -40.488) and the ion product of water" },
      { eq: "Fe^2+(aq) + 2 e- <=> Fe(s)", E0: -0.4742, over: 0.15, src: LLNL + "Fe + 2 H+ + 0.5 O2 = Fe+2 + H2O, log_k 59.0325. Overpotential estimated" },
      { eq: "2 H+(aq) + 2 e- <=> H2(g)", E0: 0, over: OVER_H, src: "reference point of all potentials (standard hydrogen electrode)" + OVER +
        "; for zinc chosen so that granules visibly evolve hydrogen in hydrochloric acid 1 mol/L (it is larger on pure zinc)" },
      { eq: "2 H2O(l) + 2 e- <=> H2(g) + 2 OH-(aq)", E0: -0.8282, over: OVER_W, src: "the same couple written for alkaline solution: converted with the ion product of water (log_k -14)" + OVER +
        "; hydrogen evolves from water more sluggishly than from H+. The values are chosen so that magnesium, zinc and iron do not react noticeably with cold water" },
      // Silber in Chlorid-Lösung: am Pluspol entsteht Silberchlorid als Belag auf der Elektrode, am Minuspol wird er wieder zu Silber
      { eq: "AgCl(s) + e- <=> Ag(s) + Cl-(aq)", E0: 0.22219,
        src: "converted from the couple Ag+/Ag with the solubility product (" + MINTEQ + "Cerargyrite, AgCl = Ag+ + Cl-, log_k -9.75)" },
      { eq: "Cu^2+(aq) + 2 e- <=> Cu(s)", E0: 0.3386, src: MINTEQ + "Cumetal, Cu = Cu+ + e-, log_k -8.756, and Cu+2 + e- = Cu+, log_k 2.69; added together" },
      { eq: "I3-(aq) + 2 e- <=> 3 I-(aq)", E0: 0.5405, over: 0.02, src: LLNL + "3 I- + 2 H+ + 0.5 O2 = I3- + H2O, log_k 24.7278. Overpotential estimated" },
      { eq: "Fe^3+(aq) + e- <=> Fe^2+(aq)", E0: 0.7710, over: 0.05, src: MINTEQ + "Fe+3 + e- = Fe+2, log_k 13.032. Overpotential estimated" },
      { eq: "Ag+(aq) + e- <=> Ag(s)", E0: 0.7990, src: MINTEQ + "Agmetal, Ag = Ag+ + e-, log_k -13.5065" },
      { eq: "Br2(aq) + 2 e- <=> 2 Br-(aq)", E0: 1.1039, over: 0.02, src: LLNL + "2 H+ + 2 Br- + 0.5 O2 = Br2 + H2O, log_k 5.6834. Overpotential estimated" },
      { eq: "O2(g) + 4 H+(aq) + 4 e- <=> 2 H2O(l)", E0: 1.2289, over: OVER_O, src: MINTEQ + "O2(g), O2 + 4 H+ + 4 e- = 2 H2O, log_k 83.0894" + OVER },
      { eq: "O2(g) + 2 H2O(l) + 4 e- <=> 4 OH-(aq)", E0: 0.4007, over: OVER_O, src: "the same couple written for alkaline solution: converted with the ion product of water (log_k -14)" + OVER },
      { eq: "Cl2(g) + 2 e- <=> 2 Cl-(aq)", E0: 1.3607, over: { default: 0.2, "C(s)": 0.12, "Pt(s)": 0.10 }, src: LLNL + "Cl2(g), Cl2 + H2O = 0.5 O2 + 2 Cl- + 2 H+, log_k 3.0004" + OVER }
    ],

    reactions: [
      {
        eq: "Mg(s) + 2 H+(aq) -> Mg^2+(aq) + H2(g)",
        // k in mol/(s cm² (mol/L)); Ea in kJ/mol
        rate: { k: 8e-6, Ea: 20, surface: "Mg(s)", order: { "H+(aq)": 1 } },
        src: "estimated: 10 cm of magnesium ribbon dissolve in hydrochloric acid 1 mol/L in one to two minutes; " +
          "first order in H+ and a small activation energy, as for a dissolution limited by mass transport"
      },
      {
        // Braunstein ist Katalysator: seine Oberfläche bestimmt die Geschwindigkeit, er selbst kommt in der Gleichung nicht vor
        eq: "2 H2O2(aq) -> 2 H2O(l) + O2(g)",
        rate: { k: 4e-6, Ea: 50, surface: "MnO2(s)", order: { "H2O2(aq)": 1 } },
        src: "estimated: 5 mL of 1 mol/L solution decompose on a spatula tip of manganese dioxide with a half-life of about 15 s"
      },
      {
        // Thiosulfat zerfällt in Säure über das Hydrogenthiosulfat: fein verteilter Schwefel trübt die Lösung. k in 1/s
        eq: "HS2O3-(aq) + H+(aq) -> S(s) + SO2(aq) + H2O(l)",
        rate: { k: 4.6e-3, Ea: 50, order: { "HS2O3-(aq)": 1 } },
        src: "estimated from the usual school experiment: 50 mL of thiosulfate solution with 40 g/L (0.16 mol/L) and 5 mL of hydrochloric acid 2 mol/L turn " +
          "opaque after about 20 s, the time grows inversely with concentration, and 10 K more halve it"
      },
      // Redoxreaktionen zwischen gelösten Teilchen: sie laufen sofort ab (fast), in der Schreibweise für saure Lösung.
      // Mit logK nur bis zum Gleichgewicht: Wo Iodid nur in Spuren vorliegt (neben Silberiodid), bleibt die Reaktion aus.
      {
        eq: "H2SO4(l) -> H+(aq) + HSO4-(aq)", rate: { fast: true, needs: { "H2O(l)": 1 } },
        src: "dissolving of sulfuric acid in water; the heat follows from the enthalpies of formation (about −73 kJ/mol)"
      },
      {
        eq: "MnO4-(aq) + 5 Fe^2+(aq) + 8 H+(aq) -> Mn^2+(aq) + 5 Fe^3+(aq) + 4 H2O(l)", rate: { fast: true },
        src: "textbook value: permanganate oxidises iron(II) in acidic solution instantly and completely (basis of permanganometry)"
      },
      {
        eq: "2 MnO4-(aq) + 5 H2O2(aq) + 6 H+(aq) -> 2 Mn^2+(aq) + 5 O2(g) + 8 H2O(l)", rate: { fast: true },
        src: "textbook value: permanganate oxidises hydrogen peroxide in acidic solution instantly to oxygen"
      },
      {
        eq: "2 Cu^2+(aq) + 5 I-(aq) -> 2 CuI(s) + I3-(aq)", rate: { fast: true }, logK: 11.17,
        src: "textbook value: copper(II) oxidises iodide practically completely because copper(I) iodide precipitates (basis of the iodometric " +
          "determination of copper). logK from phreeqc.dat (USGS): Cu+2 + e- = Cu+, log_k 2.72; minteq.v4.dat (USGS): CuI = Cu+ + I-, log_k -12; " +
          "and the potential of triiodide/iodide (0.5405 V): 2 · 2.72 + 2 · 12 − 18.27"
      },
      {
        eq: "2 Fe^3+(aq) + 3 I-(aq) -> 2 Fe^2+(aq) + I3-(aq)", rate: { fast: true }, logK: 7.77,
        src: "textbook value: iron(III) oxidises iodide to iodine, practically completely with excess iodide. logK from phreeqc.dat (USGS): " +
          "Fe+2 = Fe+3 + e-, log_k -13.02, and the potential of triiodide/iodide (0.5405 V): 2 · 13.02 − 18.27"
      },
      {
        // Kristallviolett verblasst in Lauge: aus dem farbigen Kation wird das farblose Carbinol. k in L/(mol s)
        eq: "C25H30N3+(aq) + OH-(aq) -> C25H31N3O(aq)",
        rate: { k: 0.1, Ea: 60, order: { "C25H30N3+(aq)": 1, "OH-(aq)": 1 } },
        src: "estimated from usual lab course data: first order in both substances; with sodium hydroxide solution 0.05 mol/L a half-life of just over two minutes, " +
          "10 K more double the rate"
      },
      {
        // Ioduhr: Peroxodisulfat oxidiert Iodid langsam zu Iod. k in L/(mol s)
        eq: "S2O8^2-(aq) + 3 I-(aq) -> 2 SO4^2-(aq) + I3-(aq)",
        rate: { k: 4e-3, Ea: 52, order: { "S2O8^2-(aq)": 1, "I-(aq)": 1 } },
        src: "estimated from usual lab course data: first order in both substances, at the salt contents usual there about 4·10⁻³ L/(mol s) at 25 °C, " +
          "activation energy about 52 kJ/mol"
      },
      {
        // fast: läuft sofort ab. Solange Thiosulfat da ist, fängt es das Iod ab; erst danach färbt Iod die Stärke blau.
        eq: "I3-(aq) + 2 S2O3^2-(aq) -> 3 I-(aq) + S4O6^2-(aq)", rate: { fast: true },
        src: "textbook value: iodine and thiosulfate react instantly and completely (basis of iodometry)"
      },
      {
        // Iodid als gelöster Katalysator: dieselbe Gleichung auf einem zweiten Weg. k in L/(mol s)
        eq: "2 H2O2(aq) -> 2 H2O(l) + O2(g)",
        rate: { k: 0.0115, Ea: 56, order: { "H2O2(aq)": 1, "I-(aq)": 1 } },
        src: "textbook value: rate constant 0.0115 L/(mol s) at 25 °C and activation energy about 56 kJ/mol (after Liebhafsky and Mohammad, 1933)"
      },
      // ignite: Zündtemperatur in °C; fire: Farbe der Flamme, glare: wie grell sie leuchtet (0 bis 1), smoke: Farbe des Rauchs,
      // T: Temperatur der Flamme in °C. Sie heizt das Gefäß wie ein Brenner; der größte Teil der Wärme geht mit Licht und Gasen fort.
      {
        eq: "2 Mg(s) + O2(g) -> 2 MgO(s)", rate: { k: 4.5e-5, surface: "Mg(s)", ignite: 470 },
        fire: { color: "#ffffff", glare: 1, smoke: "#f2f2ee", T: 2200 }, src: BURN + "; 10 cm of ribbon burn up in about 8 s"
      },
      {
        eq: "S(s) + O2(g) -> SO2(g)", rate: { k: 1e-4, surface: "S(s)", ignite: 250 },
        fire: { color: "#5a7dff", glare: 0.25, T: 700 }, src: BURN
      },
      {
        eq: "C(s) + O2(g) -> CO2(g)", rate: { k: 1.7e-4, surface: "C(s)", ignite: 400 },
        fire: { color: "#ff7a2a", glare: 0.4, glow: true, T: 800 }, src: BURN + "; charcoal glows instead of burning with a flame"
      },
      {
        // dry: läuft nur ohne Flüssigkeit; mit der hohen Aktivierungsenergie geschieht unter 150 °C praktisch nichts
        eq: "CuSO4*5H2O(s) -> CuSO4(s) + 5 H2O(g)", dH: 299, rate: { k: 8e-16, Ea: 125, surface: "CuSO4*5H2O(s)", dry: true },
        src: "estimated: dehydrated at 250 °C in about 20 s. Reaction enthalpy: textbook value about 299 kJ/mol"
      },
      // spark: Zündgrenzen als Anteil am Gasraum. Diese Reaktion läuft nur, wenn eine Flamme sie zündet.
      {
        eq: "2 H2(g) + O2(g) -> 2 H2O(g)", spark: [0.04, 0.75],
        src: "textbook value: hydrogen is ignitable in air between 4 and 75 percent by volume"
      }
    ],

    // molar: der Eintrag gilt für 1 mol/L, die Konzentration steht im Namen ("HCl 0.1M"); group: Fach im Regal
    reagents: {
      "H2O": { name: name("distilled water"), liquid: "H2O(l)", group: "water" },

      "HCl": { name: name("hydrochloric acid"), solution: { "H+(aq)": 1, "Cl-(aq)": 1 }, molar: true, group: "acid" },
      "H2SO4": { name: name("sulfuric acid"), solution: { "H+(aq)": 1, "HSO4-(aq)": 1 }, molar: true, group: "acid" },
      "H2SO4 conc": { name: name("sulfuric acid, concentrated"), liquid: "H2SO4(l)", group: "acid" },
      "CH3COOH": { name: name("acetic acid"), solution: { "CH3COOH(aq)": 1 }, molar: true, group: "acid" },
      "NaOH": { name: name("sodium hydroxide solution"), solution: { "Na+(aq)": 1, "OH-(aq)": 1 }, molar: true, group: "acid" },
      "NH3": { name: name("ammonia solution"), solution: { "NH3(aq)": 1 }, molar: true, group: "acid" },
      // Kalkwasser: gesättigt wären 0,0117 mol/L im idealen Modell (lg K −5,196) und rund 0,02 mol/L im Labor; knapp darunter, damit nichts ausfällt
      "limewater": { name: name("limewater (calcium hydroxide solution)"), solution: { "Ca^2+(aq)": 0.011, "OH-(aq)": 0.022 }, group: "acid" },

      "NaCl": { name: name("sodium chloride solution"), solution: { "Na+(aq)": 1, "Cl-(aq)": 1 }, molar: true, group: "salt" },
      "KBr": { name: name("potassium bromide solution"), solution: { "K+(aq)": 1, "Br-(aq)": 1 }, molar: true, group: "salt" },
      "KI": { name: name("potassium iodide solution"), solution: { "K+(aq)": 1, "I-(aq)": 1 }, molar: true, group: "salt" },
      "Na2SO4": { name: name("sodium sulfate solution"), solution: { "Na+(aq)": 2, "SO4^2-(aq)": 1 }, molar: true, group: "salt" },
      "CH3COONa": { name: name("sodium acetate solution"), solution: { "Na+(aq)": 1, "CH3COO-(aq)": 1 }, molar: true, group: "salt" },
      "NH4Cl": { name: name("ammonium chloride solution"), solution: { "NH4+(aq)": 1, "Cl-(aq)": 1 }, molar: true, group: "salt" },
      "KSCN": { name: name("potassium thiocyanate solution"), solution: { "K+(aq)": 1, "SCN-(aq)": 1 }, molar: true, group: "salt" },
      "AgNO3": { name: name("silver nitrate solution"), solution: { "Ag+(aq)": 1, "NO3-(aq)": 1 }, molar: true, group: "salt" },
      "BaCl2": { name: name("barium chloride solution"), solution: { "Ba^2+(aq)": 1, "Cl-(aq)": 2 }, molar: true, group: "salt" },
      "CuSO4": { name: name("copper sulfate solution"), solution: { "Cu^2+(aq)": 1, "SO4^2-(aq)": 1 }, molar: true, group: "salt" },
      "FeCl3": { name: name("iron(III) chloride solution"), solution: { "Fe^3+(aq)": 1, "Cl-(aq)": 3 }, molar: true, group: "salt" },
      "Na2CO3": { name: name("sodium carbonate solution"), solution: { "Na+(aq)": 2, "CO3^2-(aq)": 1 }, molar: true, group: "salt" },
      "NaHCO3": { name: name("sodium hydrogen carbonate solution"), solution: { "Na+(aq)": 1, "HCO3-(aq)": 1 }, molar: true, group: "salt" },
      "CaCl2": { name: name("calcium chloride solution"), solution: { "Ca^2+(aq)": 1, "Cl-(aq)": 2 }, molar: true, group: "salt" },
      "SrCl2": { name: name("strontium chloride solution"), solution: { "Sr^2+(aq)": 1, "Cl-(aq)": 2 }, molar: true, group: "salt" },
      "LiCl": { name: name("lithium chloride solution"), solution: { "Li+(aq)": 1, "Cl-(aq)": 1 }, molar: true, group: "salt" },
      "ZnSO4": { name: name("zinc sulfate solution"), solution: { "Zn^2+(aq)": 1, "SO4^2-(aq)": 1 }, molar: true, group: "salt" },
      "ZnI2": { name: name("zinc iodide solution"), solution: { "Zn^2+(aq)": 1, "I-(aq)": 2 }, molar: true, group: "salt" },
      "CuCl2": { name: name("copper chloride solution"), solution: { "Cu^2+(aq)": 1, "Cl-(aq)": 2 }, molar: true, group: "salt" },
      "FeSO4": { name: name("iron(II) sulfate solution"), solution: { "Fe^2+(aq)": 1, "SO4^2-(aq)": 1 }, molar: true, group: "salt" },
      "Na2S2O3": { name: name("sodium thiosulfate solution"), solution: { "Na+(aq)": 2, "S2O3^2-(aq)": 1 }, molar: true, group: "salt" },
      "K2CrO4": { name: name("potassium chromate solution"), solution: { "K+(aq)": 2, "CrO4^2-(aq)": 1 }, molar: true, group: "salt" },
      "K2Cr2O7": { name: name("potassium dichromate solution"), solution: { "K+(aq)": 2, "Cr2O7^2-(aq)": 1 }, molar: true, group: "salt" },
      "CoCl2": { name: name("cobalt(II) chloride solution"), solution: { "Co^2+(aq)": 1, "Cl-(aq)": 2 }, molar: true, group: "salt" },
      "KMnO4": { name: name("potassium permanganate solution"), solution: { "K+(aq)": 1, "MnO4-(aq)": 1 }, molar: true, group: "salt" },
      "K2S2O8": { name: name("potassium peroxodisulfate solution"), solution: { "K+(aq)": 2, "S2O8^2-(aq)": 1 }, molar: true, group: "salt" },
      "Na2SO3": { name: name("sodium sulfite solution"), solution: { "Na+(aq)": 2, "SO3^2-(aq)": 1 }, molar: true, group: "salt" },
      "KNO3": { name: name("potassium nitrate solution"), solution: { "K+(aq)": 1, "NO3-(aq)": 1 }, molar: true, group: "salt" },
      "H2O2": { name: name("hydrogen peroxide solution"), solution: { "H2O2(aq)": 1 }, molar: true, group: "other" },
      // Kristallviolett-Lösung mit 25 µmol/L (10 mg/L), wie für die Fotometrie üblich
      "crystal violet": { name: name("crystal violet solution (25 µmol/L)"), solution: { "C25H30N3+(aq)": 2.5e-5, "Cl-(aq)": 2.5e-5 }, group: "other" },
      "sugar": { name: name("sugar solution"), solution: { "C12H22O11(aq)": 1 }, molar: true, group: "other" },

      // Indikatorlösungen: Bromthymolblau 0,04 %, Phenolphthalein und Methylorange 0,1 %.
      // Der Universalindikator ist eine Mischung aus vier Farbstoffen nach Art der Rezeptur von Yamada, wie dort
      // mit Natronlauge auf Grün eingestellt; die Mengen sind geschätzt, so dass die bekannte Farbfolge entsteht.
      "BTB": { name: name("bromothymol blue"), solution: { "C27H28Br2O5S(aq)": 6.4e-4 }, drops: true, group: "indicator" },
      "PP": { name: name("phenolphthalein"), solution: { "C20H14O4(aq)": 3.1e-3 }, drops: true, group: "indicator" },
      "MO": { name: name("methyl orange"), solution: { "C14H14N3O3S-(aq)": 3.1e-3, "Na+(aq)": 3.1e-3 }, drops: true, group: "indicator" },
      // Stärkelösung 1 %: 10 g/L, gerechnet als Plätze für Iod (je 18 Glucose-Einheiten einer)
      "starch": { name: name("starch solution"), solution: { "C108H180O90(aq)": 3.4e-3 }, drops: true, group: "indicator" },
      // Iod-Kaliumiodid-Lösung, wie sie für den Stärkenachweis aus der Tropfflasche kommt: 0,01 mol/L Iod, als Triiodid gelöst
      "Lugol": { name: name("iodine–potassium iodide solution"), solution: { "I3-(aq)": 0.01, "I-(aq)": 0.03, "K+(aq)": 0.04 }, drops: true, group: "indicator" },
      "UI": {
        name: name("universal indicator"), drops: true, group: "indicator",
        solution: {
          "C27H29O5S-(aq)": 2e-4, "C15H14N3O2-(aq)": 7e-4, "C27H28Br2O5S(aq)": 3.5e-4, "C27H27Br2O5S-(aq)": 3.5e-4,
          "C20H14O4(aq)": 4e-3, "Na+(aq)": 1.25e-3
        }
      },

      // Band 3 mm breit, 0,2 mm dick: 1 cm wiegt 0,0104 g und hat 0,6 cm² Oberfläche
      "Mg ribbon": {
        name: name("magnesium ribbon"), solid: "Mg(s)", area: 57.5, shape: 0, group: "solid",
        piece: { g: 0.0104, name: name("cm") }
      },
      // area: Oberfläche in cm² je g; tau: Zeitkonstante in s, mit der sich ein Stück löst; form: "powder" wird als Pulver gezeichnet
      "marble": { name: name("marble chips (calcium carbonate)"), solid: "CaCO3(s)", area: 6, group: "solid" },
      "marble powder": { name: name("marble powder (calcium carbonate)"), solid: "CaCO3(s)", area: 60, form: "powder", group: "solid" },
      "MnO2": { name: name("manganese dioxide powder"), solid: "MnO2(s)", area: 300, form: "powder", group: "solid" },
      "sulfur": { name: name("sulfur powder"), solid: "S(s)", area: 20, form: "powder", group: "solid" },
      "charcoal": { name: name("charcoal pieces"), solid: "C(s)", area: 10, group: "solid" },
      "Zn granules": { name: name("zinc granules"), solid: "Zn(s)", area: 6, group: "solid" },
      "Zn powder": { name: name("zinc powder"), solid: "Zn(s)", area: 300, form: "powder", group: "solid" },
      "Fe wool": { name: name("iron wool"), solid: "Fe(s)", area: 60, form: "powder", group: "solid" },
      "Cu sheet": { name: name("copper sheet (strip)"), solid: "Cu(s)", area: 20, shape: 0, group: "solid" }
    }
  };

  // Aktivitätskoeffizienten für das reale Modell: Ionengröße å in Å und Zusatzglied b der Gleichung von Truesdell und Jones,
  // lg γ = −A z² √I / (1 + B å √I) + b I, aus phreeqc.dat (USGS), "-gamma". Ein Ion, das hier fehlt, rechnet nach Davies,
  // ein ungeladenes Teilchen mit lg γ = 0,1 · I.
  var GAMMA = {
    "H+(aq)": [9, 0], "Li+(aq)": [6, 0], "Na+(aq)": [4.08, 0.082], "K+(aq)": [3.5, 0.015], "NH4+(aq)": [2.5, 0],
    "Mg^2+(aq)": [5.5, 0.2], "Ca^2+(aq)": [5, 0.165], "Sr^2+(aq)": [5.26, 0.121], "Ba^2+(aq)": [7.1, 0.0553],
    "Fe^2+(aq)": [6, 0], "FeOH+(aq)": [5, 0], "Fe^3+(aq)": [9, 0], "FeOH^2+(aq)": [5, 0], "Mn^2+(aq)": [6, 0],
    "Zn^2+(aq)": [5, 0], "Cu^2+(aq)": [6, 0], "CuOH+(aq)": [4, 0],
    "OH-(aq)": [3.5, 0], "Cl-(aq)": [3.63, 0.017], "Br-(aq)": [3, 0.045], "NO3-(aq)": [3, 0], "SO4^2-(aq)": [5, -0.04],
    "CO3^2-(aq)": [5.4, 0], "HCO3-(aq)": [5.4, 0.0078], "CO2(aq)": [0, 0.066],
    "NaSO4-(aq)": [3.5, 0.1072], "KSO4-(aq)": [5.4, 0.19], "CaSO4(aq)": [0, 0.0445], "MgSO4(aq)": [0, 0.2], "MgOH+(aq)": [6.5, 0],
    "CaHCO3+(aq)": [6, 0], "MgHCO3+(aq)": [4, 0], "SrHCO3+(aq)": [5.4, 0]
  };
  Object.keys(GAMMA).forEach(function (id) {
    var sp = L.core.species[id];
    sp.gamma = GAMMA[id];
    sp.src += "; activity coefficient: phreeqc.dat (USGS), -gamma " + GAMMA[id].join(" ");
  });

  L.register(L.core);
})(typeof globalThis !== "undefined" ? globalThis : this);
