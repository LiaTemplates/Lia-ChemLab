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
  var NBS = "NBS Tables of Chemical Thermodynamic Properties (Wagman et al. 1982)";
  var TABLE = "; heat capacity and density: usual table values";
  var NONE = "no enthalpy of formation in CODATA";
  var LOOK = "colour of the solid from its usual appearance";
  var BAND = "; absorption band estimated from the usual colour of the solution";
  var CABBAGE = "red cabbage: the anthocyanin simplified as cyanidin 3-glucoside in four forms; pKa values and absorption bands estimated from the usual colour chart of red cabbage juice";
  var DYE = "indicator: pKa from usual lab course data; absorption bands estimated";
  var STEP = "; reaction enthalpy estimated: -22.5 kJ/mol per ammonia, as for the steps with two and three ammonia from llnl.dat";
  var MINTEQ = "minteq.v4.dat (USGS): ";
  var LLNL = "llnl.dat (USGS): ";
  var WHITE = "#f5f5f2";
  var GLOW = "; flame colour estimated from the usual appearance";
  var GAS = "; heat capacity: usual table value";
  var JANAF = "NIST-JANAF Thermochemical Tables (Chase 1998), as given in the NIST Chemistry WebBook: enthalpy of formation, entropy and heat capacity at 25 °C";
  var BURN = "estimated: ignition temperature and burning time from the usual course of the school experiment";
  var DW = "; diffusion coefficient: phreeqc.dat (USGS), -dw";
  var DL = "; diffusion coefficient: textbook value";
  var ELEMENT = "element: enthalpy of formation zero by definition; ";
  // Überspannung in V bei 1 mA/cm², je nach Oberfläche
  var OVER_H = { default: 0.60, "Pt(s)": 0.09, "C(s)": 0.47, "Cu(s)": 0.50, "Fe(s)": 0.30, "Ag(s)": 0.59, "Zn(s)": 0.36, "Pb(s)": 0.95 };
  // Wasserstoff aus Wasser statt aus H+: läuft überall gehemmter
  var OVER_W = { default: 0.90, "Pt(s)": 0.35, "C(s)": 0.75, "Cu(s)": 0.80, "Fe(s)": 0.80, "Ag(s)": 0.85, "Zn(s)": 1.0, "Mg(s)": 1.6, "Pb(s)": 1.2 };
  // Blei hemmt Wasserstoff stark, Bleidioxid Sauerstoff: deshalb lässt sich ein Bleiakku laden, ohne dass gleich alles Gas wird,
  // und er entlädt sich kaum von selbst
  var OVER_O = { default: 0.60, "Pt(s)": 0.45, "C(s)": 0.50, "Cu(s)": 0.58, "Fe(s)": 0.41, "Ag(s)": 0.61, "PbO2(s)": 0.80 };
  var OVER = "; overpotentials estimated from usual tables (at 1 mA/cm²)";

  function name(en) { return { en: en }; }        // deutsch und die übrigen Sprachen: lang/<code>.json

  L.core = {
    species: {
      // ---------------------------------------------------------------- Wasser und seine Ionen
      "H2O(l)": { name: name("water"), Hf: -285.830, S: 69.95, cp: 75.3, rho: 0.997, eta: [0.890, 0.5465],
        src: CODATA + TABLE + "; viscosity 0.890 mPa·s at 25 °C and 0.5465 mPa·s at 50 °C: CRC Handbook of Chemistry and Physics, 99th edition (2018), Viscosity of Liquids" },
      // konzentrierte Schwefelsäure als reiner Stoff: Mit Wasser löst sie sich sofort, und dabei wird viel Wärme frei
      "H2SO4(l)": { name: name("sulfuric acid (pure)"), Hf: -813.989, S: 156.904, cp: 138.9, rho: 1.8302, eta: [23.8, 11.7],
        src: CODATA + "; heat capacity 138.9 J/(mol K): NIST Chemistry WebBook; density 1.8302 g/cm³: usual table value; " +
          "viscosity of 100 % acid 23.8 mPa·s at 25 °C and 11.7 mPa·s at 50 °C: Kaye & Laby, Tables of Physical and Chemical Constants (as tabulated by Anton Paar)" },
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
      "IO3-(aq)": { name: name("iodate ion"), Hf: -221.3, D: 1.078, src: LLNL + "IO3-, Enthalpy of formation -52.9 kcal/mol" + DW },
      "I-(aq)": { name: name("iodide ion"), Hf: -56.78, S: 106.45, D: 2.045, src: CODATA + DL },
      "NO2-(aq)": { name: name("nitrite ion"), Hf: -104.6, S: 123.0, src: NBS },
      "HNO2(aq)": { name: name("nitrous acid"), Hf: -119.2, S: 135.6, src: NBS },
      "H3PO4(aq)": { name: name("phosphoric acid"), Hf: -1288.34, S: 158.2, src: NBS },
      "H2PO4-(aq)": { name: name("dihydrogen phosphate ion"), Hf: -1296.29, S: 90.4, src: NBS },
      "HPO4^2-(aq)": { name: name("hydrogen phosphate ion"), Hf: -1292.14, S: -33.5, src: NBS },
      "PO4^3-(aq)": { name: name("phosphate ion"), Hf: -1277.4, S: -222, src: NBS },
      "HF(aq)": { name: name("hydrofluoric acid (undissociated)"), Hf: -320.08, S: 88.7, src: NBS },
      "F-(aq)": { name: name("fluoride ion"), Hf: -335.35, S: -13.8, src: CODATA },
      "ClO4-(aq)": { name: name("perchlorate ion"), Hf: -129.33, S: 182.0, src: NBS },
      "NO3-(aq)": { name: name("nitrate ion"), Hf: -206.85, S: 146.70, D: 1.9, src: CODATA + DW },
      "SO4^2-(aq)": { name: name("sulfate ion"), Hf: -909.34, S: 18.50, D: 1.07, src: CODATA + DW },
      // Vm: partielles Molvolumen (H+ = 0). So nimmt gelöste konzentrierte Schwefelsäure, die als Hydrogensulfat vorliegt, Raum ein,
      // und das Mischen mit Wasser zieht das Volumen zusammen (reine Säure: 53,6 mL/mol). Nur hier: In verdünnten Lösungen liegt
      // kaum Hydrogensulfat vor, und Sulfat und seine Ionenpaare bleiben ohne Eigenvolumen wie die übrigen Ionen
      "HSO4-(aq)": { name: name("hydrogen sulfate ion"), Hf: -886.9, S: 131.7, D: 1.22, Vm: 35, src: CODATA + DW + "; Vm: approximately, after Millero, Chem. Rev. 71 (1971) 147" },
      "SCN-(aq)": { name: name("thiocyanate ion"), Hf: null, D: 1.758, src: NONE + DL },
      "Ag+(aq)": { name: name("silver ion"), Hf: 105.79, S: 73.45, D: 1.648, src: CODATA + DL },
      "Pb^2+(aq)": { name: name("lead(II) ion"), Hf: 0.92, S: 18.5, D: 0.945, src: CODATA + DW },
      "Ba^2+(aq)": { name: name("barium ion"), Hf: null, D: 0.848, flame: "#b7f23c", src: NONE + DW + GLOW },
      "Ca^2+(aq)": { name: name("calcium ion"), Hf: -543.0, S: -56.2, D: 0.792, flame: "#ff6a2a", src: CODATA + DW + GLOW },
      "Sr^2+(aq)": { name: name("strontium ion"), Hf: null, D: 0.794, flame: "#ff2a1a", src: NONE + DW + GLOW },
      "Li+(aq)": { name: name("lithium ion"), Hf: -278.47, S: 12.24, D: 1.03, flame: "#e8173a", src: CODATA + DW + GLOW },
      "CO3^2-(aq)": { name: name("carbonate ion"), Hf: -675.23, S: -50.0, D: 0.955, src: CODATA + DW },
      "HCO3-(aq)": { name: name("hydrogen carbonate ion"), Hf: -689.93, S: 98.4, D: 1.18, src: CODATA + DW },
      "CO2(aq)": { name: name("carbon dioxide, dissolved"), Hf: -413.26, S: 119.36, src: CODATA },
      "O2(aq)": { name: name("oxygen, dissolved"), Hf: -11.7, S: 110.9, src: NBS },
      // Spülmittel: das Tensid vereinfacht als Dodecylsulfat; foam: es hält aufsteigendes Gas als Schaum fest
      "C12H25SO4-(aq)": { name: name("dodecyl sulfate ion (detergent)"), symbol: "DS⁻", Hf: null, foam: true, src: NONE + "; the surfactant of washing-up liquid, simplified as dodecyl sulfate" },
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
      // kd: Verteilung zwischen einer Ölschicht (Hexan) und Wasser; oilBands: die Banden im Öl
      "Br2(aq)": { name: name("bromine, dissolved"), Hf: null, bands: [[400, 110, 170]], kd: 20, oilBands: [[415, 100, 200]],
        src: NONE + BAND + "; distribution hexane/water 20 and the band in hexane: estimates (for carbon tetrachloride/water about 27, Hill, Worsley and Hepler 1968)" },

      "C12H22O11(aq)": { name: name("sucrose (sugar)"), Hf: null, Vm: 214.8, eta: [6.84e23, 4.2e23],
        src: NONE + "; Vm from the density of a 60 % sucrose solution, 1.2865 g/cm³ at 20 °C: CRC Handbook of Chemistry and Physics, Concentrative Properties of Aqueous Solutions. " +
          "The viscosity is not that of a pure substance but a parameter for the mixing rule (ln η weighted by mole fractions), fitted so that solutions of 20, 40, 60 and 70 % " +
          "have 2.0, 6.6, 58 and 410 mPa·s at 20 °C; measured 1.95, 6.16, 58.5 and 482 mPa·s (CRC Handbook, 99th edition). Temperature dependence taken from water (estimate)" },
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
      // Chrom(III): in Lösung grün, wie meist im Schulversuch (mit Sulfat oder Chlorid; das violette Hexaaqua-Ion bleibt außen vor)
      "Cr^3+(aq)": { name: name("chromium(III) ion"), Hf: null, bands: [[595, 100, 16], [420, 80, 18]],
        src: NONE + "; absorption bands estimated from the usual colour of chromium(III) solutions in school (green)" },
      "CrOH^2+(aq)": { name: name("chromium(III) hydroxide ion"), Hf: null, bands: [[595, 100, 16], [420, 80, 18]], src: NONE + BAND + " (as for the chromium(III) ion)" },
      "Cr(OH)4-(aq)": { name: name("tetrahydroxidochromate(III) ion"), Hf: null, bands: [[600, 100, 20], [440, 80, 25]],
        src: NONE + "; absorption bands estimated from the usual colour of chromite solution (green)" },
      "CoCl4^2-(aq)": { name: name("tetrachlorocobaltate(II) ion"), Hf: null, bands: [[690, 70, 600], [625, 70, 350]],
        src: NONE + "; absorption bands estimated from usual table values (maxima around 690 and 625 nm, about 600 L/(mol cm))" },
      "MnO4-(aq)": { name: name("permanganate ion"), Hf: -541.41, D: 1.632, bands: [[526, 70, 2400]],
        src: LLNL + "MnO4-, Enthalpy of formation -129.4 kcal/mol" + DL + "; absorption band estimated from usual table values (around 525 nm, about 2400 L/(mol cm))" },
      "MnO4^2-(aq)": { name: name("manganate ion"), Hf: -652.70, bands: [[606, 90, 1710], [439, 70, 1380]],
        src: LLNL + "MnO4-2, Enthalpy of formation -156 kcal/mol; absorption bands: usual table values (606 nm, 1710 L/(mol cm); 439 nm, 1380 L/(mol cm)), widths estimated" },
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
      "CH3COOH(aq)": { name: name("acetic acid"), Hf: null, Vm: 57.25, Tb: 117.9, Hvap: 40.5, cp: 123.1, eta: [1.056, 0.792],
        src: NONE + "; density 1.049 g/cm³, boiling point 117.9 °C, vapour pressure 15.7 mmHg at 25 °C: PubChem, Hazardous Substances Data Bank (public domain); " +
          "Hvap = R · ln(760/15.7) / (1/298.15 K − 1/391.05 K) = 40.5 kJ/mol; cp of the liquid 123.1 J/(mol K) at 298.15 K: NIST Chemistry WebBook (Martin and Andon, 1982); " +
          "viscosity 1.056 mPa·s at 25 °C: CRC Handbook of Chemistry and Physics, 99th edition; 0.792 mPa·s at 50 °C: Kaye & Laby (as tabulated by Anton Paar)" },
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
      "N2(g)": { name: name("nitrogen"), Hf: 0, S: 191.609, cp: 29.1, src: CODATA + GAS },
      "CH4(g)": { name: name("methane"), Hf: -74.87, S: 186.25, cp: 35.7, src: JANAF },
      // smell: das Gas riecht stechend
      "NH3(g)": { name: name("ammonia"), Hf: -45.94, S: 192.77, cp: 35.1, smell: true, src: CODATA + GAS },
      "HCl(g)": { name: name("hydrogen chloride"), Hf: -92.31, S: 186.902, cp: 29.1, smell: true, src: CODATA + GAS },
      "SO2(g)": { name: name("sulfur dioxide"), Hf: -296.81, S: 248.223, cp: 39.9, smell: true, src: CODATA + GAS },
      "CH3COOH(g)": { name: name("acetic acid vapour"), Hf: null, cp: 63.4, smell: true, src: NONE + GAS },
      "H2O2(g)": { name: name("hydrogen peroxide vapour"), Hf: null, cp: 43.1, src: NONE + GAS },
      // Stickstoffoxide: Stickstoffmonoxid ist farblos und wird an der Luft zu braunem Stickstoffdioxid; das steht mit dem farblosen Dimer im Gleichgewicht
      "NO(g)": { name: name("nitrogen monoxide"), Hf: 90.29, S: 210.76, cp: 29.86, src: JANAF },
      "NO2(g)": { name: name("nitrogen dioxide"), Hf: 33.10, S: 240.04, cp: 36.97, smell: true, bands: [[400, 150, 160], [490, 110, 70]],
        src: JANAF + "; absorption: broad band around 400 nm, cross section about 6·10⁻¹⁹ cm² (textbook value), reaching into the green; widths and the second band estimated" },
      "N2O4(g)": { name: name("dinitrogen tetroxide"), Hf: 9.08, S: 304.38, cp: 77.26, src: JANAF + "; colourless" },
      "Cl2(g)": { name: name("chlorine"), Hf: 0, S: 223.081, cp: 33.9, smell: true, src: CODATA + GAS },
      // Chlor in Wasser: gelöst, als hypochlorige Säure und als Hypochlorit-Ion; die beiden letzten bleichen Farbstoffe
      "Cl2(aq)": { name: name("chlorine, dissolved"), Hf: -23.4, S: 121, bands: [[325, 70, 70]], src: NBS + "; absorption band estimated (chlorine water is pale yellow-green)" },
      "HOCl(aq)": { name: name("hypochlorous acid"), Hf: -120.9, S: 142, src: NBS },
      "OCl-(aq)": { name: name("hypochlorite ion"), Hf: -107.1, S: 42, src: NBS },
      // Metalle: als Stücke, als Elektroden und als Belag, der sich abscheidet
      "Zn(s)": { name: name("zinc"), Hf: 0, S: 41.63, cp: 25.4, rho: 7.14, color: "#9aa3ad", src: CODATA + TABLE + "; " + LOOK },
      "Cu(s)": { name: name("copper"), Hf: 0, S: 33.15, cp: 24.4, rho: 8.96, color: "#b5653a", settle: 4, src: CODATA + TABLE + "; " + LOOK },
      "Ag(s)": { name: name("silver"), Hf: 0, S: 42.55, cp: 25.4, rho: 10.49, color: "#c3c7cc", settle: 4, src: CODATA + TABLE + "; " + LOOK },
      "Fe(s)": { name: name("iron"), Hf: 0, cp: 25.1, rho: 7.87, color: "#6f747b", settle: 4, src: ELEMENT + "heat capacity and density: usual table values; " + LOOK },
      "Pb(s)": { name: name("lead"), Hf: 0, S: 64.80, cp: 26.4, rho: 11.34, color: "#6b6f76", settle: 4, src: CODATA + TABLE + "; " + LOOK },
      // Bleiakku: Bleisulfat und Bleidioxid entstehen als Belag auf Bleiplatten
      // dense: als Belag deckt es die Platte ab (darunter reagiert das Blei nicht mehr); conducts: der Belag leitet den Strom (Bleidioxid),
      // ein nichtleitender dichter Belag sperrt alles andere an der Elektrode
      "PbSO4(s)": { name: name("lead(II) sulfate"), Hf: -919.94, S: 148.57, cp: 103.2, rho: 6.29, color: WHITE, dense: true, src: NBS + TABLE + "; " + LOOK },
      "PbO2(s)": { name: name("lead(IV) oxide"), Hf: -277.4, S: 68.6, cp: 64.6, rho: 9.38, color: "#4a2a17", dense: true, conducts: true, src: NBS + TABLE + "; " + LOOK },
      "Pt(s)": { name: name("platinum"), Hf: 0, cp: 25.9, rho: 21.45, color: "#d3d6da", src: ELEMENT + "heat capacity and density: usual table values; " + LOOK },
      // kd mit via: Iod geht als I2 aus dem Triiodid ins Öl, I3- ⇌ I2 (Öl) + I-, also c(Öl) = kd · c(I3-) / c(I-)
      "I2(s)": { name: name("iodine"), Hf: 0, S: 116.14, cp: 54.4, rho: 4.93, color: "#3a3340", kd: 0.063, via: ["I3-(aq)", "I-(aq)"], oilBands: [[522, 90, 900]],
        src: CODATA + TABLE + "; " + LOOK + "; in hexane violet, 522 nm, about 900 L/(mol cm) (usual literature value; a patent on iodine sensing gives about 625 at 520 nm). " +
          "kd = 40 / 640: distribution of dissolved iodine hexane/water about 40 (estimate; textbook examples 30, carbon tetrachloride/water 85) divided by " +
          "K(I2(aq) + I- = I3-) = 640, from I2(s) + I- = I3- below and the solubility of iodine in water, 1.30 mmol/L (CRC Handbook)" },
      "Zn(OH)2(s)": { name: name("zinc hydroxide"), Hf: null, color: WHITE, settle: 60, src: LOOK },
      "Fe(OH)2(s)": { name: name("iron(II) hydroxide"), Hf: null, color: "#b9c8ae", settle: 60, src: LOOK },
      "MgO(s)": { name: name("magnesium oxide"), Hf: -601.60, S: 26.95, color: WHITE, src: CODATA + "; " + LOOK },
      "Fe3O4(s)": { name: name("iron(II,III) oxide"), Hf: -1118.4, S: 146.4, color: "#2b2b2e", src: "NBS Tables of Chemical Thermodynamic Properties (Wagman et al. 1982); " + LOOK },
      // colloid: entsteht er in einer Lösung, ist er so fein verteilt, dass er in der Schwebe bleibt und sich nicht absetzt
      "S(s)": { name: name("sulfur"), Hf: 0, S: 32.054, color: "#e8d44a", colloid: true, src: CODATA + "; " + LOOK },
      "C(s)": { name: name("carbon (charcoal, graphite)"), Hf: 0, S: 5.74, color: "#2a2a2a", src: CODATA + " (graphite); " + LOOK },
      "MnO2(s)": { name: name("manganese dioxide"), Hf: null, color: "#4a3020", colloid: true, src: LOOK + " (black-brown powder); formed in a solution it stays as a brown colloid" },
      // Salze für die Lösungswärme
      "NH4NO3(s)": { name: name("ammonium nitrate"), Hf: -365.56, S: 151.08, color: WHITE, src: NBS + "; " + LOOK },
      "NaOH(s)": { name: name("sodium hydroxide"), Hf: -425.609, S: 64.455, color: WHITE, flame: "#ffd21f", shine: 30, src: NBS + "; " + LOOK + GLOW },
      "CaCl2(s)": { name: name("calcium chloride, anhydrous"), Hf: -795.8, S: 104.6, color: WHITE, flame: "#ff6a2a", src: NBS + "; " + LOOK + GLOW },
      "NaCl(s)": { name: name("sodium chloride"), Hf: -411.12, color: WHITE, flame: "#ffd21f", shine: 30,
        src: "llnl.dat (USGS): Halite, Enthalpy of formation -98.26 kcal/mol; " + LOOK + GLOW },
      "KMnO4(s)": { name: name("potassium permanganate"), Hf: -837.2, S: 171.71, color: "#3b1450", flame: "#b08cff", src: NBS + "; " + LOOK + " (dark violet crystals)" + GLOW },
      "K2MnO4(s)": { name: name("potassium manganate"), Hf: -1184.07, color: "#1f3d2a", flame: "#b08cff", src: NBS + "; " + LOOK + " (dark green)" + GLOW },
      "NaHCO3(s)": { name: name("sodium hydrogen carbonate"), Hf: -947.26, color: WHITE, flame: "#ffd21f", src: LLNL + "Nahcolite, Enthalpy of formation -226.4 kcal/mol; " + LOOK + GLOW },
      "Na2CO3(s)": { name: name("sodium carbonate"), Hf: -1130.68, color: WHITE, flame: "#ffd21f", src: LLNL + "Na2CO3, Enthalpy of formation -1130.68 kJ/mol; " + LOOK + GLOW },
      "CH3COONa(s)": { name: name("sodium acetate"), Hf: -708.81, color: WHITE, flame: "#ffd21f", src: NBS + "; " + LOOK + GLOW },
      "KNO3(s)": { name: name("potassium nitrate"), Hf: -494.46, color: WHITE, flame: "#b08cff", src: LLNL + "Niter, Enthalpy of formation -494.46 kJ/mol; " + LOOK + GLOW },
      "Ag3PO4(s)": { name: name("silver phosphate"), Hf: null, color: "#f2d23a", src: LOOK + " (yellow precipitate)" },
      "CaF2(s)": { name: name("calcium fluoride"), Hf: -1228.0, color: WHITE, flame: "#ff6a2a", src: NBS + "; " + LOOK + GLOW },
      "KCl(s)": { name: name("potassium chloride"), Hf: -436.68, color: WHITE, flame: "#b08cff", shine: 30,
        src: LLNL + "Sylvite, Enthalpy of formation -104.37 kcal/mol; " + LOOK + GLOW },
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
      "Co(OH)2(s)": { name: name("cobalt(II) hydroxide"), Hf: null, color: "#c27a8c", settle: 60, src: LOOK + " (rose; fresh it is blue, then turns rose)" },
      "Cr(OH)3(s)": { name: name("chromium(III) hydroxide"), Hf: null, color: "#7d9a78", settle: 60, src: LOOK + " (grey-green)" },
      "Mg(OH)2(s)": { name: name("magnesium hydroxide"), Hf: null, color: WHITE, settle: 60, src: LOOK },

      // ---------------------------------------------------------------- Indikatoren
      // symbol: Kurzzeichen statt der langen Formel; Hf unbekannt, der Umschlag rechnet ohne Wärme.
      // Rotkohl: Anthocyan (vereinfacht als Cyanidin-3-glucosid) in vier Formen; in starker Lauge öffnet sich der Ring langsam zum gelben Chalkon
      "C21H21O11+(aq)": { name: name("red cabbage dye (red form)"), symbol: "HRk⁺", Hf: null, bands: [[525, 90, 30000], [440, 60, 6000]], src: CABBAGE },
      "C21H20O11(aq)": { name: name("red cabbage dye (violet form)"), symbol: "Rk", Hf: null, bands: [[575, 100, 24000]], src: CABBAGE },
      "C21H19O11-(aq)": { name: name("red cabbage dye (blue form)"), symbol: "Rk⁻", Hf: null, bands: [[600, 100, 26000]], src: CABBAGE },
      "C21H18O11^2-(aq)": { name: name("red cabbage dye (green form)"), symbol: "Rk²⁻", Hf: null, bands: [[615, 90, 22000], [420, 70, 20000]], src: CABBAGE },
      "C21H20O12^2-(aq)": { name: name("red cabbage dye (yellow, decomposed)"), symbol: "Rk-OH²⁻", Hf: null, bands: [[425, 100, 24000]], src: CABBAGE },
      "C27H28Br2O5S(aq)": { name: name("bromothymol blue (yellow form)"), symbol: "HBtb", Hf: null, bands: [[432, 110, 20000]], src: DYE },
      "C21H14Br4O5S(aq)": { name: name("bromocresol green (yellow form)"), symbol: "HBcg", Hf: null, bands: [[444, 90, 18000]], src: DYE },
      "C21H13Br4O5S-(aq)": { name: name("bromocresol green (blue form)"), symbol: "Bcg⁻", Hf: null, bands: [[617, 90, 40000]], src: DYE },
      "C19H14O5S(aq)": { name: name("phenol red (yellow form)"), symbol: "HPr", Hf: null, bands: [[432, 90, 22000]], src: DYE },
      "C19H13O5S-(aq)": { name: name("phenol red (red form)"), symbol: "Pr⁻", Hf: null, bands: [[545, 60, 25000], [430, 50, 3000]], src: DYE },
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
      { eq: "Cl2(g) <=> Cl2(aq)", logK: -1.04, src: "Henry constant 0.092 mol/(kg bar) at 25 °C: Sander, Atmos. Chem. Phys. 15 (2015) 4399" },
      { eq: "Cl2(aq) + H2O(l) <=> HOCl(aq) + H+(aq) + Cl-(aq)", logK: -3.29, src: "hydrolysis constant 5.1e-4 at 25 °C: Wang and Margerum, Inorg. Chem. 33 (1994) 1123" },
      { eq: "H3PO4(aq) <=> H+(aq) + H2PO4-(aq)", logK: -2.168, src: "phreeqc.dat (USGS): PO4-3 + 3 H+ = H3PO4, log_k 21.721, delta_h -10.1 kJ; PO4-3 + 2 H+ = H2PO4-, log_k 19.553, delta_h -4.52 kcal" },
      { eq: "H2PO4-(aq) <=> H+(aq) + HPO4^2-(aq)", logK: -7.207, src: "phreeqc.dat (USGS): PO4-3 + 2 H+ = H2PO4-, log_k 19.553, delta_h -4.52 kcal; PO4-3 + H+ = HPO4-2, log_k 12.346, delta_h -3.53 kcal" },
      { eq: "HPO4^2-(aq) <=> H+(aq) + PO4^3-(aq)", logK: -12.346, src: "phreeqc.dat (USGS): PO4-3 + H+ = HPO4-2, log_k 12.346, delta_h -3.53 kcal" },
      { eq: "HF(aq) <=> H+(aq) + F-(aq)", logK: -3.18, src: "phreeqc.dat (USGS): H+ + F- = HF, log_k 3.18, delta_h 3.18 kcal" },
      { eq: "HOCl(aq) <=> H+(aq) + OCl-(aq)", logK: -7.53, src: "pKa 7.53 at 25 °C: Morris, J. Phys. Chem. 70 (1966) 3798" },
      { eq: "SO2(g) <=> SO2(aq)", logK: 0.17, src: LLNL + "SO2(g), SO2 = SO2, log_k 0.17" },
      // Luft (21 % Sauerstoff) über Wasser: 0,27 mmol/L bei 25 °C; aufgenommen wird er an der Oberfläche und beim Schütteln (Blaue Flasche)
      { eq: "O2(g) <=> O2(aq)", logK: -2.8983, src: LLNL + "O2(g), O2 = O2, log_k -2.8983; the temperature dependence follows from the enthalpies of formation (-11.7 kJ/mol; LLNL: -12.13)" },
      // im Gasraum, mit Partialdrücken in bar: kalt fast nur farbloses N2O4, warm mehr braunes NO2
      { eq: "2 NO2(g) <=> N2O4(g)", logK: 0.829, src: "from the Gibbs energies of formation (NIST-JANAF): ΔG = 97.79 − 2 · 51.26 kJ/mol; K = 6.7 per bar at 25 °C; the temperature dependence follows from the enthalpies of formation (−57 kJ/mol)" },
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
      { eq: "Ag3PO4(s) <=> 3 Ag+(aq) + PO4^3-(aq)", logK: -17.59, src: MINTEQ + "Ag3PO4 = 3 Ag+ + PO4-3, log_k -17.59" },
      { eq: "CaF2(s) <=> Ca^2+(aq) + 2 F-(aq)", logK: -10.61, src: "phreeqc.dat (USGS): Fluorite, CaF2 = Ca+2 + 2 F-, log_k -10.61" },
      { eq: "AgCl(s) <=> Ag+(aq) + Cl-(aq)", logK: -9.75, src: MINTEQ + "Cerargyrite, AgCl = Ag+ + Cl-, log_k -9.75" },
      { eq: "AgBr(s) <=> Ag+(aq) + Br-(aq)", logK: -12.3, dH: 84.5, src: MINTEQ + "Bromyrite, AgBr = Ag+ + Br-, log_k -12.3, delta_h 84.5 kJ" },
      { eq: "AgI(s) <=> Ag+(aq) + I-(aq)", logK: -16.08, dH: 110, src: MINTEQ + "Iodyrite, AgI = Ag+ + I-, log_k -16.08, delta_h 110 kJ" },
      { eq: "AgSCN(s) <=> Ag+(aq) + SCN-(aq)", logK: -12.0, src: "textbook value: solubility product 1.0·10⁻¹² mol²/L²" },
      { eq: "Ag2SO4(s) <=> 2 Ag+(aq) + SO4^2-(aq)", logK: -4.82, dH: 17, src: MINTEQ + "Ag2SO4 = 2 Ag+ + SO4-2, log_k -4.82, delta_h 17 kJ" },
      { eq: "Ag2O(s) + H2O(l) <=> 2 Ag+(aq) + 2 OH-(aq)", logK: -15.426, dH: 66.0, src: MINTEQ + "Ag2O + 2 H+ = 2 Ag+ + H2O, log_k 12.574, delta_h -45.62 kJ; converted with the ion product of water" },
      { eq: "BaCrO4(s) <=> Ba^2+(aq) + CrO4^2-(aq)", logK: -9.67, dH: 33, src: MINTEQ + "BaCrO4 = Ba+2 + CrO4-2, log_k -9.67, delta_h 33 kJ" },
      { eq: "Ag2CrO4(s) <=> 2 Ag+(aq) + CrO4^2-(aq)", logK: -11.59, dH: 62, src: MINTEQ + "Ag2CrO4 = 2 Ag+ + CrO4-2, log_k -11.59, delta_h 62 kJ" },
      { eq: "PbSO4(s) <=> Pb^2+(aq) + SO4^2-(aq)", logK: -7.79, src: MINTEQ + "Anglesite, PbSO4 = Pb+2 + SO4-2, log_k -7.79" },
      { eq: "BaSO4(s) <=> Ba^2+(aq) + SO4^2-(aq)", logK: -9.98, dH: 23, src: MINTEQ + "Barite, BaSO4 = Ba+2 + SO4-2, log_k -9.98, delta_h 23 kJ" },
      { eq: "Cu(OH)2(s) <=> Cu^2+(aq) + 2 OH-(aq)", logK: -19.326, dH: 55.2, src: MINTEQ + "Cu(OH)2 + 2 H+ = Cu+2 + 2 H2O, log_k 8.674, delta_h -56.42 kJ; converted with the ion product of water" },
      { eq: "Co(OH)2(s) <=> Co^2+(aq) + 2 OH-(aq)", logK: -14.906, src: MINTEQ + "Co(OH)2 + 2 H+ = Co+2 + 2 H2O, log_k 13.094; converted with the ion product of water" },
      { eq: "Cr^3+(aq) + H2O(l) <=> CrOH^2+(aq) + H+(aq)", logK: -4, src: LLNL + "H2O + Cr+3 = CrOH+2 + H+, log_k -4" },
      { eq: "Cr(OH)3(s) <=> Cr^3+(aq) + 3 OH-(aq)", logK: -30.2,
        src: "adjusted: textbook solubility product 6.3·10⁻³¹ (CRC Handbook), so that chrome alum solutions stay clear as in the lab; " +
          MINTEQ + "Cr(OH)3(am) with Cr(OH)2+ + 2 H+ = Cr+3 + 2 H2O gives -33.181, with which the hydrolysis from llnl.dat would precipitate it from 0.3 mol/L" },
      { eq: "Cr^3+(aq) + 4 H2O(l) <=> Cr(OH)4-(aq) + 4 H+(aq)", logK: -26.2,
        src: "adjusted: fresh chromium(III) hydroxide dissolves in excess sodium hydroxide solution as in the school experiment (Cr(OH)3 + OH- = Cr(OH)4-, log K -0.4, with the solubility product above). " +
          MINTEQ + "Cr(OH)2+ + 2 H2O = Cr(OH)4- + 2 H+, log_k -17.8192, and Cr(OH)2+ + 2 H+ = Cr+3 + 2 H2O, log_k 9.5688, give -27.388" },
      { eq: "Fe(OH)3(s) <=> Fe^3+(aq) + 3 OH-(aq)", logK: -37.109, src: "phreeqc.dat (USGS): Fe(OH)3(a), freshly precipitated, Fe(OH)3 + 3 H+ = Fe+3 + 3 H2O, log_k 4.891; converted with the ion product of water" },
      { eq: "Mg(OH)2(s) <=> Mg^2+(aq) + 2 OH-(aq)", logK: -11.156, dH: -2.4, src: MINTEQ + "Brucite, Mg(OH)2 + 2 H+ = Mg+2 + 2 H2O, log_k 16.844, delta_h -113.996 kJ; converted with the ion product of water" },

      { eq: "Zn(OH)2(s) <=> Zn^2+(aq) + 2 OH-(aq)", logK: -15.526, dH: 31.0, src: MINTEQ + "Zn(OH)2(am), Zn(OH)2 + 2 H+ = Zn+2 + 2 H2O, log_k 12.474, delta_h -80.62 kJ; converted with the ion product of water" },
      { eq: "Fe(OH)2(s) <=> Fe^2+(aq) + 2 OH-(aq)", logK: -14.436, src: MINTEQ + "Fe(OH)2 + 2 H+ = Fe+2 + 2 H2O, log_k 13.564; converted with the ion product of water" },
      // Iod löst sich in Iodid-Lösung als Triiodid; ist das Iodid verbraucht, fällt es als Feststoff aus
      { eq: "I2(s) + I-(aq) <=> I3-(aq)", logK: -0.0806, dH: 5.44, src: LLNL + "I2 + H2O = 0.5 O2 + 2 H+ + 2 I-, log_k -24.8084, delta_H 165.967 kJ/mol, and 3 I- + 2 H+ + 0.5 O2 = I3- + H2O, log_k 24.7278, delta_H -160.528 kJ/mol; added together" },

      { eq: "NaCl(s) <=> Na+(aq) + Cl-(aq)", logK: 1.5855, src: LLNL + "Halite, NaCl = Cl- + Na+, log_k 1.5855" },
      { eq: "KNO3(s) <=> K+(aq) + NO3-(aq)", logK: -0.2061, ideal: [1.141, 50.6], src: LLNL + "Niter, KNO3 = K+ + NO3-, log_k -0.2061; ideal: logK and solution enthalpy fitted so that the ideal model (without activities) reaches the measured solubility at 20 and 60 °C, 31.6 and 110 g in 100 g water (CRC Handbook)" },
      { eq: "KCl(s) <=> K+(aq) + Cl-(aq)", logK: 0.8459, ideal: 1.383, src: LLNL + "Sylvite, KCl = Cl- + K+, log_k 0.8459; ideal: fitted so that the ideal model (without activities) reaches the measured solubility of 4.81 mol/kg at 25 °C (CRC Handbook, Aqueous Solubility of Inorganic Compounds: 26.4 %)" },
      { eq: "NaHCO3(s) <=> Na+(aq) + HCO3-(aq)", logK: -0.1118, ideal: 0.17, src: LLNL + "Nahcolite, NaHCO3 = HCO3- + Na+, log_k -0.1118; ideal: fitted so that the ideal model (without activities) reaches the measured solubility of 1.22 mol/kg at 25 °C (CRC Handbook: 9.32 %)" },
      { eq: "Na2CO3(s) <=> 2 Na+(aq) + CO3^2-(aq)", logK: 0.853, ideal: 2.01, src: LLNL + "Na2CO3 + H+ = HCO3- + 2 Na+, log_k 11.1822; converted with CO3-2 + H+ = HCO3-, log_k 10.329; ideal: fitted so that the ideal model (without activities) reaches the measured solubility of 2.90 mol/kg at 25 °C (CRC Handbook: 23.5 %)" },
      { eq: "KMnO4(s) <=> K+(aq) + MnO4-(aq)", logK: -1.25, ideal: -0.623, src: "calculated from the Gibbs energies of formation (" + NBS + "): KMnO4(s) -737.6, K+ -283.27, MnO4- -447.2 kJ/mol; ideal: fitted so that the ideal model (without activities) reaches the measured solubility of 0.48 mol/kg at 25 °C (CRC Handbook: 7.06 %)" },
      { eq: "K2MnO4(s) <=> 2 K+(aq) + MnO4^2-(aq)", logK: -2.45, src: "textbook value, from the Gibbs energies of formation: K2MnO4(s) -1081.2, MnO4^2- -500.7 kJ/mol" },
      { eq: "CH3COONa(s) <=> Na+(aq) + CH3COO-(aq)", logK: 1.268, ideal: 1.313, src: "fitted so that the real model reaches the measured solubility, 6.14 mol/kg at 25 °C (CRC Handbook: 33.5 %); the solid is treated as anhydrous, although the trihydrate is the stable form; ideal: fitted so that the ideal model (without activities) reaches the measured solubility of 6.14 mol/kg at 25 °C (CRC Handbook: 33.5 %)" },
      { eq: "HNO2(aq) <=> H+(aq) + NO2-(aq)", logK: -3.2206, src: LLNL + "NO2- + H+ = HNO2, log_k 3.2206" },
      // aus den Bildungsenthalpien und Entropien dieser Tabelle; die Lösungswärme folgt ebenso daraus (+25,45, −44,75, −81,36 kJ/mol)
      { eq: "NH4NO3(s) <=> NH4+(aq) + NO3-(aq)", logK: 1.119, ideal: 2.289, src: "calculated from the formation enthalpies and entropies of this table (solid: " + NBS + "; ions: CODATA); ideal: fitted so that the ideal model (without activities) reaches the measured solubility of 12 mol/kg; measured are 26.5 mol/kg at 25 °C (CRC Handbook: 68.0 %), but the solver reaches only about 12 mol/L" },
      { eq: "NaOH(s) <=> Na+(aq) + OH-(aq)", logK: 6.956, src: "calculated from the formation enthalpies and entropies of this table (solid: " + NBS + "; ions: CODATA)" },
      { eq: "CaCl2(s) <=> Ca^2+(aq) + 2 Cl-(aq)", logK: 11.767, src: "calculated from the formation enthalpies and entropies of this table (solid: " + NBS + "; ions: CODATA)" },
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
      { eq: "C21H14Br4O5S(aq) <=> H+(aq) + C21H13Br4O5S-(aq)", logK: -4.7, src: DYE },
      { eq: "C19H14O5S(aq) <=> H+(aq) + C19H13O5S-(aq)", logK: -7.9, src: DYE },
      { eq: "C27H28Br2O5S(aq) <=> H+(aq) + C27H27Br2O5S-(aq)", logK: -7.1, src: DYE },
      { eq: "C21H21O11+(aq) <=> H+(aq) + C21H20O11(aq)", logK: -4.0, src: CABBAGE },
      { eq: "C21H20O11(aq) <=> H+(aq) + C21H19O11-(aq)", logK: -6.8, src: CABBAGE },
      { eq: "C21H19O11-(aq) <=> H+(aq) + C21H18O11^2-(aq)", logK: -9.6, src: CABBAGE },
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
      // Bleiakku: Blei wird am Minuspol zu Bleisulfat, Bleidioxid am Pluspol ebenso; geladen wird umgekehrt
      // (kein Paar Pb²⁺/Pb: was an der Platte in Lösung ginge, fiele dort gleich als Bleisulfat aus)
      { eq: "PbSO4(s) + 2 e- <=> Pb(s) + SO4^2-(aq)", E0: -0.3566,
        src: "converted from the couple Pb2+/Pb (E0 -0.1262 V, CRC Handbook of Chemistry and Physics) with the solubility product (" + MINTEQ + "Anglesite, PbSO4 = Pb+2 + SO4-2, log_k -7.79); table value -0.3588 V" },
      { eq: "PbO2(s) + SO4^2-(aq) + 4 H+(aq) + 2 e- <=> PbSO4(s) + 2 H2O(l)", E0: 1.6913, src: "standard potential (CRC Handbook of Chemistry and Physics, Electrochemical Series)" },
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
        eq: "H2SO4(l) -> H+(aq) + HSO4-(aq)", rate: { fast: true, needs: { "H2O(l)": 3 }, bound: ["HSO4-(aq)", "SO4^2-(aq)"] },
        src: "dissolving of sulfuric acid in water; the heat follows from the enthalpies of formation (about −73 kJ/mol). needs 3 H2O per H2SO4 is estimated: with little water only part of the acid dissolves, which matches the integral heat of dilution at low water content (about −22 kJ per mol of acid at 0.75 mol water per mol acid)"
      },
      {
        eq: "MnO4-(aq) + 5 Fe^2+(aq) + 8 H+(aq) -> Mn^2+(aq) + 5 Fe^3+(aq) + 4 H2O(l)", rate: { fast: true },
        src: "textbook value: permanganate oxidises iron(II) in acidic solution instantly and completely (basis of permanganometry)"
      },
      {
        eq: "2 MnO4-(aq) + 5 H2O2(aq) + 6 H+(aq) -> 2 Mn^2+(aq) + 5 O2(g) + 8 H2O(l)", rate: { fast: true },
        src: "textbook value: permanganate oxidises hydrogen peroxide in acidic solution instantly to oxygen"
      },
      // Chamäleon: Zucker reduziert Permanganat in Lauge erst zu grünem Manganat, dann zu braunem Braunstein.
      // Vereinfacht bis zum Carbonat oxidiert; der Zucker liegt im Versuch weit im Überschuss vor
      {
        eq: "C12H22O11(aq) + 48 MnO4-(aq) + 72 OH-(aq) -> 48 MnO4^2-(aq) + 12 CO3^2-(aq) + 47 H2O(l)",
        rate: { k: 0.003, Ea: 60, order: { "C12H22O11(aq)": 1, "MnO4-(aq)": 1, "OH-(aq)": 1 } },
        src: "estimated from the usual school experiment (chameleon): with sugar in sodium hydroxide solution 1 mol/L violet turns green within about a minute"
      },
      {
        eq: "C12H22O11(aq) + 24 MnO4^2-(aq) + H2O(l) -> 24 MnO2(s) + 12 CO3^2-(aq) + 24 OH-(aq)",
        rate: { k: 0.002, Ea: 60, order: { "C12H22O11(aq)": 1, "MnO4^2-(aq)": 1 } },
        src: "estimated from the usual school experiment (chameleon): the green solution turns brown over some minutes"
      },
      {
        eq: "3 MnO4^2-(aq) + 4 H+(aq) -> 2 MnO4-(aq) + MnO2(s) + 2 H2O(l)", rate: { fast: true }, logK: 57.3,
        src: "textbook: manganate keeps only in strongly alkaline solution and otherwise disproportionates. logK from the standard potentials " +
          "MnO4^2-/MnO2 2.26 V and MnO4-/MnO4^2- 0.564 V (CRC Handbook of Chemistry and Physics, Electrochemical Series): 2 · (2.26 − 0.564) / 0.05916"
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
        // Rotkohl in starker Lauge: Der Ring öffnet sich zum gelben Chalkon, das nicht mehr zurückkehrt. k in L/(mol s)
        eq: "C21H18O11^2-(aq) + H2O(l) -> C21H20O12^2-(aq)",
        rate: { k: 0.1, Ea: 60, order: { "C21H18O11^2-(aq)": 1, "OH-(aq)": 1 } },
        src: CABBAGE + "; rate estimated: in sodium hydroxide solution 0.1 mol/L the green turns yellow within a few minutes, at pH 11 it stays green for hours"
      },
      // Kupfer in Salpetersäure: in verdünnter Säure entsteht farbloses Stickstoffmonoxid, in konzentrierter braunes Stickstoffdioxid.
      // Der erste Weg wächst mit der dritten, der zweite mit der sechsten Potenz der Konzentration (empirisch); ab etwa 6 mol/L überwiegt der zweite.
      // In neutraler Nitratlösung (Silbernitrat) geschieht nichts.
      // k in mol/(s cm²) je (mol/L) hoch Ordnung
      {
        eq: "3 Cu(s) + 8 H+(aq) + 2 NO3-(aq) -> 3 Cu^2+(aq) + 2 NO(g) + 4 H2O(l)",
        rate: { k: 1e-8, Ea: 45, surface: "Cu(s)", order: { "H+(aq)": 2, "NO3-(aq)": 1 } },
        src: "estimated from the usual school experiment: copper sheet in nitric acid 3 mol/L bubbles steadily, the colourless gas turns brown at the mouth"
      },
      {
        eq: "Cu(s) + 4 H+(aq) + 2 NO3-(aq) -> Cu^2+(aq) + 2 NO2(g) + 2 H2O(l)",
        rate: { k: 4.6e-11, Ea: 45, surface: "Cu(s)", order: { "H+(aq)": 3, "NO3-(aq)": 3 } },
        src: "estimated from the usual school experiment: copper in concentrated nitric acid reacts violently with brown fumes"
      },
      {
        // Stickstoffmonoxid und Luftsauerstoff im Gasraum: dritte Ordnung. k in L²/(mol² s)
        eq: "2 NO(g) + O2(g) -> 2 NO2(g)",
        rate: { k: 7.2e3, order: { "NO(g)": 2, "O2(g)": 1 } },
        src: "textbook value: rate constant about 2·10⁻³⁸ cm⁶/(molecule² s) at 25 °C, nearly independent of temperature"
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
      // Landolt-Reaktion: Iodat oxidiert Hydrogensulfit langsam; das Iodid daraus gibt mit Iodat Iod, das das Sulfit sofort wieder verbraucht.
      // Erst wenn das Sulfit aufgebraucht ist, bleibt Iod übrig und färbt die Stärke blau
      {
        eq: "IO3-(aq) + 3 HSO3-(aq) -> I-(aq) + 3 SO4^2-(aq) + 3 H+(aq)",
        rate: { k: 10, Ea: 50, order: { "IO3-(aq)": 1, "HSO3-(aq)": 1, "H+(aq)": 1 } },
        src: "estimated from the usual school experiment (Landolt reaction): first order in iodate, hydrogen sulfite and H+"
      },
      {
        eq: "IO3-(aq) + 8 I-(aq) + 6 H+(aq) -> 3 I3-(aq) + 3 H2O(l)",
        rate: { k: 1e8, Ea: 40, order: { "IO3-(aq)": 1, "I-(aq)": 2, "H+(aq)": 2 } },
        src: "Dushman reaction: rate law after Dushman (1904), second order in iodide and in H+; constant estimated so that the school experiment works"
      },
      {
        eq: "I3-(aq) + HSO3-(aq) + H2O(l) -> 3 I-(aq) + SO4^2-(aq) + 3 H+(aq)", rate: { fast: true },
        src: "textbook: iodine oxidises hydrogen sulfite instantly (basis of iodometry)"
      },
      {
        // fast: läuft sofort ab. Solange Thiosulfat da ist, fängt es das Iod ab; erst danach färbt Iod die Stärke blau.
        eq: "I3-(aq) + 2 S2O3^2-(aq) -> 3 I-(aq) + S4O6^2-(aq)", rate: { fast: true },
        src: "textbook value: iodine and thiosulfate react instantly and completely (basis of iodometry)"
      },
      // Thiosulfat reduziert auch Hypochlorit und Chlor zu Chlorid, sofort: so macht man Bleichlauge vor dem Ausgießen unschädlich
      { eq: "4 OCl-(aq) + S2O3^2-(aq) + 2 OH-(aq) -> 4 Cl-(aq) + 2 SO4^2-(aq) + H2O(l)", rate: { fast: true }, src: "textbook: thiosulfate reduces hypochlorite completely (antichlor)" },
      { eq: "4 HOCl(aq) + S2O3^2-(aq) + H2O(l) -> 4 Cl-(aq) + 2 SO4^2-(aq) + 6 H+(aq)", rate: { fast: true }, src: "textbook: thiosulfate reduces hypochlorous acid completely (antichlor)" },
      { eq: "4 Cl2(aq) + S2O3^2-(aq) + 5 H2O(l) -> 8 Cl-(aq) + 2 SO4^2-(aq) + 10 H+(aq)", rate: { fast: true }, src: "textbook: thiosulfate reduces dissolved chlorine completely (antichlor)" },
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
        eq: "3 Fe(s) + 2 O2(g) -> Fe3O4(s)", rate: { k: 1.5e-5, surface: "Fe(s)", ignite: 400 },
        fire: { color: "#ff8a2a", glare: 0.5, glow: true, T: 1000 }, src: BURN + "; 1 g of iron wool glows through in about 20 s and gets heavier"
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
      // Feststoffe, die beim Erhitzen Gas abgeben (dry: nur ohne Flüssigkeit)
      {
        eq: "2 KMnO4(s) -> K2MnO4(s) + MnO2(s) + O2(g)", rate: { k: 2e-16, Ea: 130, surface: "KMnO4(s)", dry: true },
        src: "estimated: decomposes from about 200 °C (textbook value), in a test tube over the burner within a minute"
      },
      {
        eq: "2 NaHCO3(s) -> Na2CO3(s) + CO2(g) + H2O(g)", rate: { k: 2e-12, Ea: 100, surface: "NaHCO3(s)", dry: true },
        src: "estimated: decomposes from about 100 °C, quickly above 150 °C (textbook value)"
      },
      {
        // Methan im Schulversuch: Natriumacetat mit Natronkalk erhitzt; hier mit Natriumhydroxid
        eq: "CH3COONa(s) + NaOH(s) -> CH4(g) + Na2CO3(s)", rate: { k: 3e-11, Ea: 60, surface: "CH3COONa(s)", dry: true },
        src: "estimated: in a test tube over the burner a steady stream of methane for about a minute, starting after one to two minutes"
      },
      {
        // Stickstoff aus Ammoniumnitrit: in warmer Lösung gleichmäßig, die Lösung erwärmt sich dabei selbst
        eq: "NH4+(aq) + NO2-(aq) -> N2(g) + 2 H2O(l)", rate: { k: 8e-5, Ea: 80, order: { "NH4+(aq)": 1, "NO2-(aq)": 1 } },
        src: "estimated: barely at room temperature; in a water bath at 80 °C the test tube fills with nitrogen within a minute"
      },
      // spark: Zündgrenzen als Anteil am Gasraum. Diese Reaktion läuft nur, wenn eine Flamme sie zündet.
      {
        eq: "2 H2(g) + O2(g) -> 2 H2O(g)", spark: [0.04, 0.75],
        src: "textbook value: hydrogen is ignitable in air between 4 and 75 percent by volume"
      },
      {
        eq: "CH4(g) + 2 O2(g) -> CO2(g) + 2 H2O(g)", spark: [0.044, 0.17],
        src: "textbook value: methane is ignitable in air between 4.4 and 17 percent by volume"
      }
    ],

    // molar: der Eintrag gilt für 1 mol/L, die Konzentration steht im Namen ("HCl 0.1M"); group: Fach im Regal
    reagents: {
      "H2O": { name: name("distilled water"), liquid: "H2O(l)", group: "water" },

      "HNO3": { name: name("nitric acid"), solution: { "H+(aq)": 1, "NO3-(aq)": 1 }, molar: true, group: "acid" },
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
      "KCr(SO4)2": { name: name("chrome alum solution"), solution: { "K+(aq)": 1, "Cr^3+(aq)": 1, "SO4^2-(aq)": 2 }, molar: true, group: "salt" },
      "KMnO4": { name: name("potassium permanganate solution"), solution: { "K+(aq)": 1, "MnO4-(aq)": 1 }, molar: true, group: "salt" },
      "K2S2O8": { name: name("potassium peroxodisulfate solution"), solution: { "K+(aq)": 2, "S2O8^2-(aq)": 1 }, molar: true, group: "salt" },
      "KIO3": { name: name("potassium iodate solution"), solution: { "K+(aq)": 1, "IO3-(aq)": 1 }, molar: true, group: "salt" },
      "Na2SO3": { name: name("sodium sulfite solution"), solution: { "Na+(aq)": 2, "SO3^2-(aq)": 1 }, molar: true, group: "salt" },
      // Bleichlauge (Javelwasser, Chlorreiniger): Natriumhypochlorit mit etwas Natronlauge
      "NaOCl": { name: name("sodium hypochlorite solution (bleach)"), solution: { "Na+(aq)": 2.05, "OCl-(aq)": 1, "Cl-(aq)": 1, "OH-(aq)": 0.05 }, molar: true, group: "salt" },
      "NaNO2": { name: name("sodium nitrite solution"), solution: { "Na+(aq)": 1, "NO2-(aq)": 1 }, molar: true, group: "salt" },
      "H3PO4": { name: name("phosphoric acid"), solution: { "H3PO4(aq)": 1 }, molar: true, group: "acid" },
      "HF": { name: name("hydrofluoric acid"), solution: { "HF(aq)": 1 }, molar: true, group: "acid" },
      "HClO4": { name: name("perchloric acid"), solution: { "H+(aq)": 1, "ClO4-(aq)": 1 }, molar: true, group: "acid" },
      "HBr": { name: name("hydrobromic acid"), solution: { "H+(aq)": 1, "Br-(aq)": 1 }, molar: true, group: "acid" },
      "HI": { name: name("hydriodic acid"), solution: { "H+(aq)": 1, "I-(aq)": 1 }, molar: true, group: "acid" },
      "NaH2PO4": { name: name("sodium dihydrogen phosphate solution"), solution: { "Na+(aq)": 1, "H2PO4-(aq)": 1 }, molar: true, group: "salt" },
      "Na2HPO4": { name: name("disodium hydrogen phosphate solution"), solution: { "Na+(aq)": 2, "HPO4^2-(aq)": 1 }, molar: true, group: "salt" },
      "Na3PO4": { name: name("trisodium phosphate solution"), solution: { "Na+(aq)": 3, "PO4^3-(aq)": 1 }, molar: true, group: "salt" },
      "NaF": { name: name("sodium fluoride solution"), solution: { "Na+(aq)": 1, "F-(aq)": 1 }, molar: true, group: "salt" },
      "KCl": { name: name("potassium chloride solution"), solution: { "K+(aq)": 1, "Cl-(aq)": 1 }, molar: true, group: "salt" },
      "KNO3": { name: name("potassium nitrate solution"), solution: { "K+(aq)": 1, "NO3-(aq)": 1 }, molar: true, group: "salt" },
      "H2O2": { name: name("hydrogen peroxide solution"), solution: { "H2O2(aq)": 1 }, molar: true, group: "other" },
      // Kristallviolett-Lösung mit 25 µmol/L (10 mg/L), wie für die Fotometrie üblich
      "crystal violet": { name: name("crystal violet solution (25 µmol/L)"), solution: { "C25H30N3+(aq)": 2.5e-5, "Cl-(aq)": 2.5e-5 }, group: "other" },
      "detergent": { name: name("washing-up liquid"), solution: { "C12H25SO4-(aq)": 0.5, "Na+(aq)": 0.5 }, group: "other" },
      "sugar": { name: name("sugar solution"), solution: { "C12H22O11(aq)": 1 }, molar: true, group: "other" },

      // Indikatorlösungen: Bromthymolblau 0,04 %, Phenolphthalein und Methylorange 0,1 %.
      // Der Universalindikator ist eine Mischung aus vier Farbstoffen nach Art der Rezeptur von Yamada, wie dort
      // mit Natronlauge auf Grün eingestellt; die Mengen sind geschätzt, so dass die bekannte Farbfolge entsteht.
      "red cabbage": { name: name("red cabbage juice"), solution: { "C21H20O11(aq)": 0.003 }, drops: true, group: "indicator" },
      "BCG": { name: name("bromocresol green"), solution: { "C21H14Br4O5S(aq)": 5.7e-4 }, drops: true, group: "indicator" },
      "phenol red": { name: name("phenol red"), solution: { "C19H14O5S(aq)": 1.1e-3 }, drops: true, group: "indicator" },
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
      "Cu sheet": { name: name("copper sheet (strip)"), solid: "Cu(s)", area: 20, shape: 0, group: "solid" },
      "KMnO4 crystals": { name: name("potassium permanganate (crystals)"), solid: "KMnO4(s)", area: 20, group: "solid" },
      "NaHCO3 powder": { name: name("sodium hydrogen carbonate (baking soda)"), solid: "NaHCO3(s)", area: 60, form: "powder", group: "solid" },
      "CH3COONa salt": { name: name("sodium acetate (salt)"), solid: "CH3COONa(s)", area: 40, form: "powder", group: "solid" },
      "KNO3 salt": { name: name("potassium nitrate (salt)"), solid: "KNO3(s)", area: 40, form: "powder", group: "solid" },
      "KCl salt": { name: name("potassium chloride (salt)"), solid: "KCl(s)", area: 40, form: "powder", group: "solid" },
      "NH4NO3 salt": { name: name("ammonium nitrate (salt)"), solid: "NH4NO3(s)", area: 40, form: "powder", group: "solid" },
      "NaOH pellets": { name: name("sodium hydroxide pellets"), solid: "NaOH(s)", area: 8, group: "solid" },
      "CaCl2 anhydrous": { name: name("calcium chloride, anhydrous (granules)"), solid: "CaCl2(s)", area: 20, group: "solid" }
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

  // Bleichen: Hypochlorige Säure und Hypochlorit oxidieren jeden Farbstoff zu einem farblosen Stoff mit einem Sauerstoffatom mehr
  // (vereinfacht; die wirklichen Produkte sind vielfältig). Geschwindigkeit geschätzt: in Sekunden bei einigen mmol/L.
  // shortcut: feste Liste der Farbstoffe im Kern; ein Indikator aus einem Paket wird nicht gebleicht. Erweitern, wenn ein Paket einen braucht.
  var DYES = ["C21H14Br4O5S(aq)", "C21H13Br4O5S-(aq)", "C19H14O5S(aq)", "C19H13O5S-(aq)", "C27H28Br2O5S(aq)", "C27H27Br2O5S-(aq)", "C20H14O4(aq)", "C20H13O4-(aq)", "C14H15N3O3S(aq)", "C14H14N3O3S-(aq)",
    "C27H30O5S(aq)", "C27H29O5S-(aq)", "C27H28O5S^2-(aq)", "C15H15N3O2(aq)", "C15H14N3O2-(aq)", "C25H30N3+(aq)",
    "C21H21O11+(aq)", "C21H20O11(aq)", "C21H19O11-(aq)", "C21H18O11^2-(aq)", "C21H20O12^2-(aq)"];
  DYES.forEach(function (dye) {
    var o = /O(\d*)(?=[A-Z^+\-(]|$)/.exec(dye), done = o ? dye.replace(o[0], "O" + ((+o[1] || 1) + 1)) : dye.replace(/((?:\^\d+)?[+-]?\(aq\))$/, "O$1");
    L.core.species[done] = { name: name("bleached dye (colourless)"), symbol: L.core.species[dye].symbol + "O", Hf: null, src: "simplified product of bleaching; colourless" };
    L.core.reactions.push(
      { eq: dye + " + HOCl(aq) -> " + done + " + H+(aq) + Cl-(aq)", rate: { k: 50, order: (function (o) { o[dye] = 1; o["HOCl(aq)"] = 1; return o; })({}) }, src: "estimated: bleaching by hypochlorous acid" },
      { eq: dye + " + OCl-(aq) -> " + done + " + Cl-(aq)", rate: { k: 5, order: (function (o) { o[dye] = 1; o["OCl-(aq)"] = 1; return o; })({}) }, src: "estimated: bleaching by hypochlorite" },
      { eq: dye + " + Cl2(aq) + H2O(l) -> " + done + " + 2 H+(aq) + 2 Cl-(aq)", rate: { k: 1000, order: (function (o) { o[dye] = 1; o["Cl2(aq)"] = 1; return o; })({}) }, src: "estimated: bleaching by dissolved chlorine, faster than by hypochlorous acid" });
  });

  // GHS-Einstufung der reinen Stoffe für die Kennzeichnung (L.hazards; Felder dort). Grundlage ist die harmonisierte Einstufung
  // der CLP-Verordnung, Anhang VI Tabelle 3 (konsolidiert bis zur 22. Anpassung); wo sie fehlt oder keine M-Faktoren und
  // Schätzwerte nennt, die übliche Einstufung der Lieferanten (ECHA-C&L-Verzeichnis, Sicherheitsdatenblätter). Nicht aufgenommen:
  // Entwürfe (Kaliumbromid und Lithiumchlorid als fortpflanzungsgefährdend, 24. Anpassung) und Angaben einzelner Lieferanten.
  // Fertiglösungen (Indikatoren) tragen das Etikett der üblichen Schulprodukte, auch wo das Labor nur ihren Farbstoff rechnet.
  var GHS_DATA = {
    "HNO3": { corr: [5, 1, 3, 1], high: [[65, "GHS03", true]], vm: 30, src: "CLP Annex VI 007-004-00-1 (SCL Skin Corr. 1A from 20 %, 1B from 5 %; Ox. Liq. 3 from 65 %)" },
    "HCl": { corr: [25, 10, 25, 10], stot: [3, 10], met: 0.3, vm: 20, src: "CLP Annex VI 017-002-01-X (SCL); H290 from 0.1 mol/L as suppliers label it (ITW, Neofroxx)" },
    "H2SO4": { corr: [15, 5, 15, 5], met: 0.5, src: "CLP Annex VI 016-020-00-8 (SCL); H290 as suppliers label it" },
    "H2SO4 conc": { corr: [15, 5, 15, 5], src: "CLP Annex VI 016-020-00-8" },
    "CH3COOH": { corr: [25, 10, 25, 10], high: [[90, "GHS02"]], src: "CLP Annex VI 607-002-00-6 (SCL); Flam. Liq. 3 of the concentrated acid from 90 % (estimated from the flash point)" },
    "NaOH": { corr: [2, 0.5, 2, 0.5], met: 0.2, src: "CLP Annex VI 011-002-00-6 (SCL); H290 as suppliers label it" },
    "NH3": { corr: [5, 1, 3, 1], xph: true, stot: [3, 5], aq: { acute: 1 }, vm: 24, src: "CLP Annex VI 007-001-01-2 (SCL STOT SE 3); no SCL for skin corrosion, so the rule for bases with pH ≥ 11.5 applies from 1 % (Annex I, Table 3.2.4)" },
    "limewater": { corr: [null, null, 3, 1], irrit: 10, stot: [3], src: "self-classification of calcium hydroxide (ECHA C&L)" },
    "KBr": { irrit: 10, src: "self-classification (ECHA C&L): Eye Irrit. 2" },
    "KI": { stot: [1], src: "self-classification (Neofroxx SDS): STOT RE 1" },
    "NH4Cl": { ate: 1410, irrit: 10, src: "CLP Annex VI 017-014-00-8; LD50 rat oral 1410 mg/kg" },
    "KSCN": { ate: 854, inh: 1.5, src: "CLP Annex VI 615-030-00-5; LD50 rat oral 854 mg/kg; inhalation: conversion value of Acute Tox. 4" },
    "AgNO3": { corr: [5, 1, 3, 1], aq: { acute: 1000, chronic: [1, 100] }, src: "CLP Annex VI 047-001-00-2; M factors of the suppliers (Sigma, Merck)" },
    "BaCl2": { ate: 118, inh: 1.5, irrit: 10, src: "CLP Annex VI 056-004-00-8; LD50 rat oral 118 mg/kg; inhalation: conversion value of Acute Tox. 4; Eye Irrit. 2 (ECHA C&L)" },
    "CuSO4": { ate: 482, irrit: 10, aq: { acute: 10, chronic: [1, 1] }, src: "CLP Annex VI 029-004-00-0; M factors and ATE of the suppliers" },
    "FeCl3": { ate: 500, irrit: 10, corr: [null, null, 3, 1], src: "self-classification (Morphisto SDS)" },
    "Na2CO3": { irrit: 10, src: "CLP Annex VI 011-005-00-2" },
    "CaCl2": { irrit: 10, src: "CLP Annex VI 017-013-00-2" },
    "SrCl2": { corr: [null, null, 3, 1], src: "self-classification (ECHA C&L): Eye Dam. 1" },
    "LiCl": { ate: 526, irrit: 10, src: "self-classification (Neofroxx SDS)" },
    "ZnSO4": { ate: 500, corr: [null, null, 3, 1], aq: { acute: 1, chronic: [1, 1] }, src: "CLP Annex VI 030-006-00-9; M factors of the suppliers" },
    "ZnI2": { corr: [5, 1, 3, 1], src: "self-classification (ECHA C&L): Skin Corr. 1B" },
    "CuCl2": { ate: 500, irrit: 10, corr: [null, null, 3, 1], aq: { acute: 10, chronic: [1, 1] }, src: "self-classification (ECHA C&L), M factors as for copper sulfate" },
    "FeSO4": { ate: 500, irrit: 10, src: "CLP Annex VI 026-003-00-7" },
    "K2CrO4": { cmr: [1, 0.1], irrit: 10, stot: [3], sens: 0.5, aq: { acute: 10, chronic: [1, 10] }, src: "CLP Annex VI 024-006-00-8 (SCL Skin Sens.); M factor of the suppliers (Merck)" },
    "K2Cr2O7": { cmr: [1, 0.1], ate: 90.5, inh: 0.05, stot: [[1], [3, 5]], corr: [5, 1, 3, 1], resp: 1, sens: 1, aq: { acute: 1, chronic: [1, 1] }, src: "CLP Annex VI 024-002-00-6 (SCL STOT SE 3); ATE oral of the supplier (Morphisto SDS), inhalation: conversion value of Acute Tox. 2" },
    "KCr(SO4)2": { fixed: [], src: "chromium potassium sulfate dodecahydrate: not classified (supplier SDS, e.g. Carl Roth)" },
    "CoCl2": { cmr: [1, 0.01], ate: 500, resp: 1, sens: 1, aq: { acute: 10, chronic: [1, 10] }, src: "CLP Annex VI 027-004-00-5 (SCL Carc. 0.01 %, M = 10)" },
    "H3PO4": { corr: [25, 10, 25, 10], src: "CLP Annex VI 015-011-00-6 (SCL)" },
    "HF": { corr: [7, 1, 1, 0.1], ate: 5, src: "CLP Annex VI 009-003-00-1: Acute Tox. 2 (fatal), Skin Corr. 1A; SCL" },
    "HClO4": { corr: [10, 5, 10, 5], high: [[50, "GHS03", true]], src: "CLP Annex VI 017-006-00-4: Ox. Liq. 1 (from 50 %), Skin Corr. 1A; SCL" },
    "HBr": { corr: [5, 1, 3, 1], stot: [3, 10], src: "hydrogen bromide, CLP Annex VI 035-002-00-0: Skin Corr. 1A, STOT SE 3" },
    "HI": { corr: [5, 1, 3, 1], src: "hydriodic acid: Skin Corr. 1B as the suppliers label it" },
    "NaH2PO4": { fixed: [], src: "sodium dihydrogen phosphate: not classified" },
    "Na2HPO4": { fixed: [], src: "disodium hydrogen phosphate: not classified" },
    "Na3PO4": { xph: true, irrit: 10, src: "trisodium phosphate: Skin Irrit. 2, Eye Dam. 1 as the suppliers label it; corrosive by its pH" },
    "NaF": { ate: 100, irrit: 10, src: "CLP Annex VI 009-004-00-7: Acute Tox. 3 (oral), Skin Irrit. 2, Eye Irrit. 2" },
    "KNO3 salt": { fixed: ["GHS03"], signal: "warning", src: "potassium nitrate: Ox. Sol. 3 (H272) as the suppliers label it" },
    "BCG": { fixed: [], src: "aqueous 0.04 % solution of the sodium salt: not classified" },
    "phenol red": { fixed: [], src: "aqueous 0.04 % solution of the sodium salt: not classified" },
    "NaNO2": { ate: 180, irrit: 10, aq: { acute: 1 }, src: "CLP Annex VI 007-010-00-4: Ox. Sol. 3, Acute Tox. 3 (oral LD50 rat 180 mg/kg), Eye Irrit. 2, Aquatic Acute 1" },
    "KMnO4 crystals": { fixed: ["GHS03", "GHS07", "GHS08", "GHS09"], signal: "danger", src: "CLP Annex VI 025-002-00-9: Ox. Sol. 2, Acute Tox. 4, Repr. 2, Aquatic Acute 1, Aquatic Chronic 1" },
    "NaHCO3 powder": { fixed: [], src: "sodium hydrogen carbonate: not classified" },
    "CH3COONa salt": { fixed: [], src: "sodium acetate: not classified" },
    "KMnO4": { cmr: [2, 3], ate: 1090, aq: { acute: 10, chronic: [1, 10] }, src: "CLP Annex VI 025-002-00-9; M factors and ATE of the suppliers" },
    "KIO3": { ate: 531, irrit: 10, src: "potassium iodate, not harmonised: self-classification of the suppliers (Acute Tox. 4, LD50 oral mouse 531 mg/kg; Skin Irrit. 2; Ox. Sol. 2 only as solid)" },
    "K2S2O8": { ate: 802, irrit: 10, stot: [3], resp: 1, sens: 1, src: "CLP Annex VI 016-061-00-1" },
    "NaOCl": { corr: [5, 1, 3, 1], aq: { acute: 10, chronic: [1, 1] }, per: { species: "OCl-(aq)", M: 74.44 }, src: "CLP Annex VI 017-011-00-1 (M = 10 acute, 1 chronic)" },
    "detergent": { fixed: ["GHS07"], signal: "warning", src: "household washing-up liquid as usually labelled (Eye Irrit. 2, H319)" },
    "H2O2": { corr: [50, 35, 8, 5], ate: 1026, inh: 1.5, stot: [3, 35], high: [[50, "GHS03", true]], vm: 22,
      src: "CLP Annex VI 008-003-00-9 (SCL, Ox. Liq. from 50 %); ATE oral of the supplier (Neofroxx SDS), inhalation: conversion value of Acute Tox. 4" },
    "crystal violet": { cmr: [2, 1], ate: 500, corr: [null, null, 3, 1], aq: { acute: 10, chronic: [1, 10] }, src: "CLP Annex VI 612-204-00-2; M factor of the supplier (Neofroxx SDS)" },
    "red cabbage": { fixed: [], src: "juice of red cabbage: not classified" },
    "BTB": { fixed: ["GHS02"], signal: "warning", src: "school product: 0.04 % in aqueous ethanol (H226)" },
    "PP": { fixed: ["GHS02", "GHS07"], signal: "danger", src: "school product: 0.1 % in ethanol (H225, H319); carcinogenic only from 1 % (SCL)" },
    "UI": { fixed: ["GHS02", "GHS07"], signal: "danger", src: "school product: in ethanol (H225, H319)" },
    "Mg ribbon": { pure: ["GHS02"], pureDanger: true, src: "self-classification of magnesium ribbon (H228)" },
    "MnO2": { ate: 500, inh: 1.5, src: "CLP Annex VI 025-001-00-3" },
    "sulfur": { irrit: 10, pure: ["GHS02"], src: "CLP Annex VI 016-094-00-1; Flam. Sol. 2 of the suppliers" },
    "Zn powder": { aq: { acute: 1, chronic: [1, 1] }, src: "CLP Annex VI 030-001-01-9 (stabilised zinc powder)" },
    "NH4NO3 salt": { pure: ["GHS03"], irrit: 10, src: "self-classification (ECHA C&L): Ox. Sol. 3, Eye Irrit. 2" },
    "NaOH pellets": { corr: [2, 0.5, 2, 0.5], src: "CLP Annex VI 011-002-00-6" },
    "CaCl2 anhydrous": { irrit: 10, src: "CLP Annex VI 017-013-00-2" }
  };
  Object.keys(GHS_DATA).forEach(function (id) { L.core.reagents[id].ghs = GHS_DATA[id]; });

  L.register(L.core);
})(typeof globalThis !== "undefined" ? globalThis : this);
