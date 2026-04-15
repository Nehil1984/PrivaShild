// Copyright 2026 Daniel Schuh
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//  http://www.apache.org/licenses/LICENSE-2.0

/**
 * Export / Druck-Seite für PrivaShield
 * Wird in App.tsx als separate Komponente eingebunden.
 */
import { useState, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  FileText, Shield, AlertTriangle, AlertCircle, UserCheck,
  Lock, CheckSquare, FolderOpen, Printer, Building2,
  ChevronDown, ChevronUp, CheckCircle2
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────
interface ExportModule {
  key: string;
  label: string;
  endpoint: string;
  icon: React.ElementType;
  color: string;
  columns: { key: string; label: string }[];
}

const MODULES: ExportModule[] = [
  {
    key: "vvt", label: "Verarbeitungsverzeichnis (VVT)", endpoint: "vvt",
    icon: FileText, color: "text-teal-400",
    columns: [
      { key: "bezeichnung", label: "Bezeichnung" },
      { key: "zweck", label: "Zweck" },
      { key: "rechtsgrundlage", label: "Rechtsgrundlage" },
      { key: "loeschfrist", label: "Löschfrist" },
      { key: "status", label: "Status" },
    ],
  },
  {
    key: "avv", label: "Auftragsverarbeitungsverträge (AVV)", endpoint: "avv",
    icon: Shield, color: "text-blue-400",
    columns: [
      { key: "auftragsverarbeiter", label: "Auftragsverarbeiter" },
      { key: "gegenstand", label: "Gegenstand" },
      { key: "vertragsdatum", label: "Vertragsdatum" },
      { key: "status", label: "Status" },
      { key: "pruefFaellig", label: "Prüfung fällig" },
    ],
  },
  {
    key: "dsfa", label: "Datenschutz-Folgenabschätzung (DSFA)", endpoint: "dsfa",
    icon: AlertTriangle, color: "text-yellow-400",
    columns: [
      { key: "titel", label: "Titel" },
      { key: "beschreibung", label: "Beschreibung" },
      { key: "ergebnis", label: "Ergebnis" },
      { key: "status", label: "Status" },
    ],
  },
  {
    key: "datenpannen", label: "Datenpannen (Art. 33/34)", endpoint: "datenpannen",
    icon: AlertCircle, color: "text-red-400",
    columns: [
      { key: "titel", label: "Vorfall" },
      { key: "entdecktAm", label: "Entdeckt am" },
      { key: "schwere", label: "Schwere" },
      { key: "status", label: "Status" },
      { key: "meldepflichtig", label: "Meldepflichtig" },
    ],
  },
  {
    key: "dsr", label: "Betroffenenrechte / DSR (Art. 15–22)", endpoint: "dsr",
    icon: UserCheck, color: "text-purple-400",
    columns: [
      { key: "art", label: "Art des Antrags" },
      { key: "antragsteller", label: "Antragsteller" },
      { key: "eingangsdatum", label: "Eingang" },
      { key: "fristDatum", label: "Frist" },
      { key: "status", label: "Status" },
    ],
  },
  {
    key: "tom", label: "Technische & Organisatorische Maßnahmen (TOM)", endpoint: "tom",
    icon: Lock, color: "text-green-400",
    columns: [
      { key: "kategorie", label: "Kategorie" },
      { key: "massnahme", label: "Maßnahme" },
      { key: "status", label: "Status" },
      { key: "verantwortlicher", label: "Verantwortlicher" },
      { key: "pruefDatum", label: "Prüfdatum" },
    ],
  },
  {
    key: "aufgaben", label: "Aufgaben & Maßnahmenplan", endpoint: "aufgaben",
    icon: CheckSquare, color: "text-orange-400",
    columns: [
      { key: "titel", label: "Aufgabe" },
      { key: "prioritaet", label: "Priorität" },
      { key: "status", label: "Status" },
      { key: "verantwortlicher", label: "Verantwortlicher" },
      { key: "faeligAm", label: "Fällig am" },
    ],
  },
  {
    key: "dokumente", label: "Dokumente & Vorlagen", endpoint: "dokumente",
    icon: FolderOpen, color: "text-slate-400",
    columns: [
      { key: "titel", label: "Titel" },
      { key: "kategorie", label: "Kategorie" },
      { key: "version", label: "Version" },
      { key: "status", label: "Status" },
      { key: "gueltigBis", label: "Gültig bis" },
    ],
  },
];

// ─── Hilfsfunktionen ─────────────────────────────────────────────────────────
function formatVal(v: any): string {
  if (v === null || v === undefined || v === "") return "—";
  if (typeof v === "number") return v === 1 ? "Ja" : v === 0 ? "Nein" : String(v);
  if (typeof v === "boolean") return v ? "Ja" : "Nein";
  if (typeof v === "string") {
    // ISO-Datum erkennen
    if (/^\d{4}-\d{2}-\d{2}/.test(v)) {
      try { return new Date(v).toLocaleDateString("de-DE"); } catch { return v; }
    }
    return v;
  }
  return String(v);
}

function snakeToCamel(s: string) {
  return s.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
}

function getVal(obj: any, key: string): string {
  // Versuche camelCase und snake_case
  return formatVal(obj[key] ?? obj[snakeToCamel(key)] ?? obj[key.replace(/([A-Z])/g, '_$1').toLowerCase()]);
}

// ─── ExportPage ───────────────────────────────────────────────────────────────
export function ExportPage({
  activeMandantId,
}: {
  activeMandantId: number | null;
}) {
  const [selected, setSelected] = useState<Set<string>>(
    new Set(MODULES.map((m) => m.key))
  );
  const [showMandant, setShowMandant] = useState(true);

  const { data: mandant } = useQuery({
    queryKey: [`/api/mandanten/${activeMandantId}`],
    queryFn: () => activeMandantId
      ? apiRequest("GET", `/api/mandanten/${activeMandantId}`).then((r) => r.json())
      : null,
    enabled: !!activeMandantId,
  });

  const toggle = (key: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const allSelected = selected.size === MODULES.length;

  const handlePrint = () => {
    // Daten in sessionStorage speichern, dann neue Seite öffnen
    const exportConfig = {
      mandantId: activeMandantId,
      mandantName: mandant?.name ?? "Unbekannter Mandant",
      mandantInfo: mandant,
      modules: MODULES.filter((m) => selected.has(m.key)).map((m) => m.key),
      generatedAt: new Date().toISOString(),
    };
    sessionStorage.setItem("privashield_export", JSON.stringify(exportConfig));
    window.open(window.location.origin + "/print.html", "_blank");
  };

  if (!activeMandantId) {
    return (
      <div className="p-6">
        <div className="flex flex-col items-center justify-center h-64 text-muted-foreground gap-3">
          <Building2 className="h-12 w-12 opacity-30" />
          <p className="text-sm">Bitte zuerst einen Mandanten in der Sidebar auswählen.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-3xl">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-xl font-semibold text-foreground flex items-center gap-2">
          <Printer className="h-5 w-5 text-primary" />
          Export & Druck
        </h1>
        <p className="text-sm text-muted-foreground">
          Wähle die Module aus, die in der Druckansicht erscheinen sollen. Die Ansicht öffnet
          sich in einem neuen Fenster und kann direkt gedruckt oder als PDF gespeichert werden.
        </p>
      </div>

      {/* Mandanten-Info */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              <Building2 className="h-4 w-4 text-primary" />
              Mandant
            </CardTitle>
            <Badge variant="outline" className="text-xs">{mandant?.name ?? "—"}</Badge>
          </div>
        </CardHeader>
      </Card>

      {/* Modulauswahl */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">Module auswählen</CardTitle>
            <Button
              variant="ghost" size="sm"
              className="text-xs text-muted-foreground h-7"
              onClick={() => {
                if (allSelected) setSelected(new Set());
                else setSelected(new Set(MODULES.map((m) => m.key)));
              }}
            >
              {allSelected ? "Alle abwählen" : "Alle auswählen"}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-2">
          {MODULES.map((mod) => {
            const Icon = mod.icon;
            const active = selected.has(mod.key);
            return (
              <button
                key={mod.key}
                onClick={() => toggle(mod.key)}
                className={`flex items-center gap-3 rounded-lg border px-4 py-3 text-left transition-all ${
                  active
                    ? "border-primary bg-primary/10"
                    : "border-border bg-transparent hover:border-primary/40"
                }`}
              >
                <div className={`flex items-center justify-center w-7 h-7 rounded-md shrink-0 ${active ? "bg-primary/20" : "bg-muted"}`}>
                  <Icon className={`h-4 w-4 ${active ? mod.color : "text-muted-foreground"}`} />
                </div>
                <span className={`text-sm flex-1 ${active ? "text-foreground font-medium" : "text-muted-foreground"}`}>
                  {mod.label}
                </span>
                {active && <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />}
              </button>
            );
          })}
        </CardContent>
      </Card>

      {/* Drucken-Button */}
      <div className="flex items-center justify-between pt-2">
        <p className="text-xs text-muted-foreground">
          {selected.size} von {MODULES.length} Modulen ausgewählt
        </p>
        <Button
          onClick={handlePrint}
          disabled={selected.size === 0}
          className="gap-2"
        >
          <Printer className="h-4 w-4" />
          Druckansicht öffnen
        </Button>
      </div>
    </div>
  );
}
