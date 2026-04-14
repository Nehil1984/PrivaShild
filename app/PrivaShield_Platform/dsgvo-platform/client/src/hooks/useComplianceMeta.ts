import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

const defaultBranchen = ["Dienstleistung", "Handel", "Industrie", "Gesundheit", "IT / SaaS", "Bildung", "Finanzen", "Öffentlicher Bereich", "Immobilien", "Logistik", "Marketing", "Personalwesen"];

const defaultGesetzlicheAufbewahrungsfristen = [
  { key: "frei", label: "Freie / manuelle Frist", frist: "", referenzen: ["Freie Eingabe / interne Vorgabe"], hinweis: "Individuelle Eingabe ohne gesetzliche Vorbelegung" },
  { key: "6_monate_bewerber", label: "6 Monate, Bewerbungsverfahren", frist: "6 Monate", referenzen: ["§ 15 Abs. 4 AGG / Verteidigung gegen AGG-Ansprüche"], hinweis: "Regelmäßig für abgelehnte Bewerbungen nach AGG-Verteidigungsinteresse" },
  { key: "2_jahre_handelsbriefe", label: "2 Jahre, steuerliche Sonderfälle", frist: "2 Jahre", referenzen: ["§ 147a AO in Sonderkonstellationen"], hinweis: "Sonderfall nach Steuerrecht" },
  { key: "3_jahre_regel", label: "3 Jahre, regelmäßige Verjährung", frist: "3 Jahre", referenzen: ["§§ 195, 199 BGB"], hinweis: "Typisch für zivilrechtliche Nachweis- und Abwehrinteressen" },
  { key: "5_jahre_gw", label: "5 Jahre, Geldwäsche- und Sanktionsunterlagen", frist: "5 Jahre", referenzen: ["§ 8 GwG"], hinweis: "Regelmäßig nach GwG, teils Verlängerungsoptionen" },
  { key: "6_jahre_hgb", label: "6 Jahre, Handels- und Geschäftsbriefe", frist: "6 Jahre", referenzen: ["§ 257 Abs. 1 Nr. 2 und 3 HGB", "§ 147 Abs. 1 Nr. 2, 3, 5 AO"], hinweis: "Geschäftsbriefe und sonstige relevante Unterlagen" },
  { key: "8_jahre_buchung", label: "8 Jahre, Buchungsbelege", frist: "8 Jahre", referenzen: ["§ 147 Abs. 3 AO"], hinweis: "Aktuelle steuerrechtliche Aufbewahrung für Buchungsbelege" },
  { key: "10_jahre_ao_hgb", label: "10 Jahre, Buchführungs- und Steuerunterlagen", frist: "10 Jahre", referenzen: ["§ 257 Abs. 1 Nr. 1 und 4 HGB", "§ 147 Abs. 1 Nr. 1, 4, 4a AO"], hinweis: "Bücher, Inventare, Abschlüsse, Lageberichte, Verfahrensdoku" },
  { key: "30_jahre_titel", label: "30 Jahre, titulierte Forderungen / Spezialfälle", frist: "30 Jahre", referenzen: ["§ 197 BGB"], hinweis: "Nur für besondere Fallgruppen" },
];

const defaultVvtLoeschMapping = [
  { pattern: "bewerber", fristKategorie: "6_monate_bewerber", loeschklasse: "LK4", gesetzlicheFrist: "§ 15 Abs. 4 AGG / Verteidigung gegen AGG-Ansprüche" },
  { pattern: "personal", fristKategorie: "10_jahre_ao_hgb", loeschklasse: "LK4", gesetzlicheFrist: "§ 147 AO / § 257 HGB, soweit abrechnungs- und nachweispflichtig" },
  { pattern: "crm|kunden", fristKategorie: "3_jahre_regel", loeschklasse: "LK2", gesetzlicheFrist: "§§ 195, 199 BGB" },
  { pattern: "newsletter", fristKategorie: "3_jahre_regel", loeschklasse: "LK2", gesetzlicheFrist: "§§ 195, 199 BGB, Nachweis über Einwilligung" },
  { pattern: "video", fristKategorie: "frei", loeschklasse: "LK5", gesetzlicheFrist: "Kurzfristige Speicherfrist nach Erforderlichkeit" },
  { pattern: "ki", fristKategorie: "frei", loeschklasse: "LK5", gesetzlicheFrist: "Einzelfallabhängig nach Use Case und Rechtsgrundlage" },
];

export type LoeschfristMeta = {
  key: string;
  label: string;
  frist: string;
  referenzen: string[];
  hinweis?: string;
};

export type VvtLoeschMappingMeta = {
  pattern: string;
  fristKategorie: string;
  loeschklasse: string;
  gesetzlicheFrist: string;
};

export type VvtLoeschMappingRuntime = VvtLoeschMappingMeta & { match: RegExp };

export function useComplianceMeta() {
  const { data: branchenMeta = defaultBranchen } = useQuery<string[]>({
    queryKey: ["/api/meta/branchen"],
    queryFn: () => apiRequest("GET", "/api/meta/branchen").then(r => r.json()),
  });
  const { data: fristMeta = defaultGesetzlicheAufbewahrungsfristen } = useQuery<LoeschfristMeta[]>({
    queryKey: ["/api/meta/loeschfristen"],
    queryFn: () => apiRequest("GET", "/api/meta/loeschfristen").then(r => r.json()),
  });
  const { data: mappingMeta = defaultVvtLoeschMapping } = useQuery<VvtLoeschMappingMeta[]>({
    queryKey: ["/api/meta/vvt-loeschmapping"],
    queryFn: () => apiRequest("GET", "/api/meta/vvt-loeschmapping").then(r => r.json()),
  });

  const branchen = branchenMeta || defaultBranchen;
  const fristen = fristMeta || defaultGesetzlicheAufbewahrungsfristen;
  const vvtLoeschMapping = useMemo<VvtLoeschMappingRuntime[]>(() => (mappingMeta || defaultVvtLoeschMapping).map((entry: VvtLoeschMappingMeta) => ({ ...entry, match: new RegExp(entry.pattern, "i") })), [mappingMeta]);

  return { branchen, fristen, vvtLoeschMapping };
}
