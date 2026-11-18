# Literatur für Passivierung, Keimbildung und Belüftung

Stand: 18.11.2026. **Gelesen** heißt: im Volltext selbst nachgesehen. **Nur Zusammenfassung** heißt: aus Suchtreffern, der Volltext war nicht zugänglich; vor dem Eintragen in `chemlab-data.js` am Original prüfen.

## Aluminium: Passivschicht und Lochfraß

| Größe | Wert | Bedingungen | Quelle | Status |
|---|---|---|---|---|
| Korrosionsstromdichte reines Al | 0,09 ± 0,01 µA/cm² | 0,01 M NaCl, 30 min Ruhepotential, Tafel-Auswertung | Christudasjustus et al., J. Electrochem. Soc. 2023, [doi:10.1149/1945-7111/acc7ce](https://doi.org/10.1149/1945-7111/acc7ce), Tabelle II; CC BY 4.0 | gelesen |
| Ruhepotential reines Al | −851 ± 44 mV gegen SCE | ebenso | ebenso | gelesen |
| Lochfraßpotential reines Al | −580 ± 14 mV gegen SCE | 0,01 M NaCl, 0,167 mV/s | ebenso | gelesen |
| E_pit gegen Chlorid | E = A + B·lg[Cl⁻], logarithmisch von 0,01 bis 6 M NaCl; in belüfteter Chloridlösung (0,6 M) liegt reines Al schon über E_pit | belüftet und entlüftet, 25 °C | Fontana Corrosion Center, Vortrag „The role of chloride concentration on the pitting kinetics of aluminum“, [OSTI 1890390](https://www.osti.gov/servlets/purl/1890390) (Literaturübersicht: Böhni-Uhlig 1969, Soltis 2011, Pride 1994) | gelesen (ohne Zahlen für A, B) |
| Steigung B | −0,11 V/Dekade (Kaesche 1962, Scully); −0,073 V (Sadek); −0,080 ± 0,005 V (Cu²⁺-Methode) | reines Al, NaCl | Übersicht [doi:10.1515/corrrev-2022-0077](https://doi.org/10.1515/corrrev-2022-0077) | nur Zusammenfassung |
| natürliche Oxidschicht | etwa 1–2 nm auf reiner Oberfläche bei Raumtemperatur (selbstbegrenzt, amorph); 5–6 nm auf technischen Legierungen | Luft | u. a. [Chalmers 201825](https://research.chalmers.se/en/publication/?id=201825), [MDPI Metals 13 (2023) 1322](https://www.mdpi.com/2075-4701/13/7/1322) | nur Zusammenfassung |
| Al in NaOH | Korrosionsrate ∝ c(OH⁻) bei kleiner, etwa ∝ √c zwischen 0,01 und 0,5 M, darüber steiler | 30 °C | [J. Electroanal. Chem. 1979](https://www.sciencedirect.com/science/article/abs/pii/S0022072879801230) | nur Zusammenfassung |

Verworfen: Icorr = 0,24 A/cm² für eine Al-Mg-Si-Legierung in 1 M NaOH ([Frontiers 2026](https://www.frontiersin.org/journals/batteries-and-electrochemistry/articles/10.3389/fbael.2026.1815822/full)). Der Wert ist um Größenordnungen höher als üblich und springt mit der Konzentration ohne Muster.

**Folgerung für das Modell:** Die Daten tragen ein qualitatives Modell. Die Schicht schützt im Neutralen, der Reststrom liegt bei etwa 0,1 µA/cm². Sie löst sich, wo Al(OH)₃ untersättigt ist; das kann die Engine aus den Gleichgewichten des Ionen-Pakets selbst rechnen. Lochfraß setzt ein, wenn das Mischpotential über E_pit(Cl⁻) liegt. Raten in Säure und Lauge fehlen und blieben geschätzt.

## Kaliumnitrat: metastabile Zone

Keine Zahl gefunden. Bekannt ist der Zusammenhang ln(ΔT_max/T₀) = Φ + β·ln R: Die Zone wird mit schnellerem Abkühlen breiter, mit größerem Volumen und stärkerem Rühren schmaler (Sangwal, [Cryst. Growth Des. 2009](https://www.semanticscholar.org/paper/Novel-Approach-to-Analyze-Metastable-Zone-Width-by-Sangwal/03ad897032240ff379e1c4264a461aef6cdcc5df); [Probenvolumen bei KNO₃](https://www.researchgate.net/publication/275164496_Effect_of_sample_volume_on_the_metastable_zone_width_of_potassium_nitrate_aqueous_solutions)). Die Werte in ChemLab (S = 1,4, t = 5 s) bleiben geschätzt, bis ein Volltext gelesen ist.

## Sauerstoff an ruhiger Wasseroberfläche (k_L)

| Wert | Bedingungen | Quelle | Status |
|---|---|---|---|
| etwa 1 cm/h (2,8·10⁻⁴ cm/s) durch Wärmekonvektion allein, 1–5 cm/h gesamt | Seen, Haubenmessung | [Oxygen transfer across the air-water interface by natural convection in lakes](https://www.researchgate.net/publication/252597811_Oxygen_transfer_across_the_air-water_interface_by_natural_convection_in_lakes) | nur Zusammenfassung |
| 0,13·10⁻³ cm/s | Oberflächenschicht, Labor; Bedingungen unklar | [PubMed 15859112](https://pubmed.ncbi.nlm.nih.gov/15859112/) | nur Zusammenfassung |

ChemLab rechnet mit 1·10⁻⁴ cm/s (`AERATE.still`). Das liegt am unteren Ende dieser Werte: ein ruhiges Glas ohne Wind, aber mit etwas Wärmekonvektion. Eine bessere Quelle wäre eine Messung in einem ruhigen Laborgefäß.
