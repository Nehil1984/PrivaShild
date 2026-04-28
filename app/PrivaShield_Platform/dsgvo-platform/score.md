# PrivaShield Score / Reifegradlogik

## Ziel
Der Reifegrad im Dashboard und die Governancebewertung im Export nutzen dieselbe Logik.

## Grundsatz
- **Scorebereich:** 0–100 %
- **Ampel:**
  - **Grün:** ab **95 %**
  - **Gelb:** **80–94 %**
  - **Rot:** **unter 80 %**

## Gewichtung
Die Bewertung erfolgt nicht mehr als einfache Checkliste, sondern gewichtet fachliche Bereiche unterschiedlich stark.

### Kriterien und Gewichte
| Kriterium | Gewicht | Logik |
|---|---:|---|
| Leitlinienbasis | 6 | 2 Leitlinien = voll, 1 = teilweise |
| Prozessdokumentation | 5 | >=2 = voll, 1 = teilweise |
| VVT | 6 | >=3 = voll, >0 = teilweise |
| DSFA-Struktur | 8 | DSB-/Struktur sauber + keine DSFA ohne VVT = voll |
| DSFA-Risikosteuerung | 10 | keine Art.36-/High-Risk-/überfälligen Review-Probleme = voll |
| Löschkonzept-Verknüpfung | 6 | keine offenen VVT↔Löschkonzept-Lücken = voll |
| Audit-Struktur | 12 | Audits vorhanden + wenig Audit-To-dos + keine Audit-Follow-ups ohne Audit-Bezug |
| PDCA-Wirksamkeit | 14 | PDCA vorhanden + wenige/keine fälligen Reviews + wenige offene Folgeaufgaben |
| TOM-Abdeckung | 5 | umfangreiche TOM = voll |
| AVV-Abdeckung | 4 | AVV vorhanden |
| Operative Aufgabensteuerung | 8 | keine kritischen / hoch priorisierten offenen Aufgaben |
| Web-/Hinweisprüfungen | 4 | Webdatenschutz + Datenschutzhinweise geprüft |
| Beschäftigtendatenschutz | 4 | Check vorhanden |
| Dokumentenreife | 3 | >=6 Dokumente = voll |
| Verantwortungsstruktur | 5 | Verantwortlicher gesetzt |

**Gesamtgewicht:** 100 Punkte

## Besondere Betonung Audit / PDCA
Audit und PDCA sind bewusst stärker gewichtet:
- **Audit-Struktur:** 12 Punkte
- **PDCA-Wirksamkeit:** 14 Punkte
- zusammen **26 % Gesamtgewicht**

Damit beeinflussen Audit- und Verbesserungssteuerung den Reifegrad deutlich stärker als vorher.

## Teilbewertungen
Teilweise Erfüllung ist möglich, z. B.:
- 1 statt 2 Leitlinien
- wenige statt keine Audit-To-dos
- einzelne statt viele offene PDCA-Folgeaufgaben

## Berechnungsprinzip
1. Jedes Kriterium erhält einen Teilscore zwischen 0 und seinem Gewicht.
2. Alle Teilscores werden summiert.
3. Die Summe wird durch das Gesamtgewicht geteilt.
4. Ergebnis wird auf Prozent gerundet.

## Beispiel Ampellogik
- **97 %** → Grün
- **88 %** → Gelb
- **72 %** → Rot

## Fachlicher Hintergrund
Die Logik soll realistischer sein als eine reine Ja/Nein-Checkliste.
Besonders operative Governance-Schwächen in **Audit**, **PDCA**, **kritischen Aufgaben** und **DSFA-Risikosteuerung** drücken den Reifegrad jetzt deutlich sichtbar.
