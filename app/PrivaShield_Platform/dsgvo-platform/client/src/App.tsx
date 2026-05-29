// Copyright 2026 Daniel Schuh
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//  http://www.apache.org/licenses/LICENSE-2.0

import { Switch, Route, Router, useLocation, Link } from "wouter";
import licenseText from "./assets/LICENSE.md?raw";
import { useHashLocation } from "wouter/use-hash-location";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { useToast } from "@/hooks/use-toast";
import { useComplianceMeta } from "@/hooks/useComplianceMeta";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest, setApiCsrfToken } from "@/lib/queryClient";
import { APP_VERSION } from "@/lib/app-version";
import { messages, type Lang, type MessageKey } from "./i18n";
import { allVvtTemplates } from "@/lib/vvt-templates";
import { allTomTemplates } from "@/lib/tom-templates";
import { useState, createContext, useContext, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Shield, Building2, FileText, AlertTriangle, UserCheck,
  Lock, CheckSquare, FolderOpen, LayoutDashboard, Users,
  LogOut, ChevronRight, Plus, Pencil, Trash2, Eye,
  Sun, Moon, Bell, Menu, X, AlertCircle, Clock,
  TrendingUp, CheckCircle2, XCircle, MoreVertical, Settings, Database, HardDrive,
  Printer, Download, ChevronDown, ChevronUp, Copy, Globe, Mail, Bot, ClipboardList, Archive, NotebookPen, RefreshCcw
} from "lucide-react";


// ─── Auth Context ──────────────────────────────────────────────────────────
type AuthUser = { id: number; email: string; name: string; role: string; mandantIds: string; csrfToken?: string; failedLoginAttempts?: number; temporaryLockUntil?: string | null; adminLocked?: boolean; adminLockedAt?: string | null; lastFailedLoginAt?: string | null };
const AuthCtx = createContext<{ user: AuthUser | null; login: (u: AuthUser) => void; logout: () => void }>({
  user: null, login: () => {}, logout: () => {}
});

function useAuth() { return useContext(AuthCtx); }

// ─── Mandant Context ───────────────────────────────────────────────────────
const MandantCtx = createContext<{ activeMandantId: number | null; setActiveMandantId: (id: number) => void }>({
  activeMandantId: null, setActiveMandantId: () => {}
});
function useMandant() { return useContext(MandantCtx); }

const LangCtx = createContext<{ lang: Lang; setLang: (lang: Lang) => void; t: (key: MessageKey) => string }>({
  lang: "de", setLang: () => {}, t: (key) => messages.de[key]
});
function useI18n() { return useContext(LangCtx); }

// ─── Theme ─────────────────────────────────────────────────────────────────
function useTheme() {
  const [theme, setTheme] = useState<"dark"|"light">(() => {
    const stored = localStorage.getItem("privashield_theme");
    if (stored === "dark" || stored === "light") return stored;
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  });
  useEffect(() => {
    document.documentElement.classList.toggle("light", theme === "light");
    localStorage.setItem("privashield_theme", theme);
  }, [theme]);
  return { theme, toggle: () => setTheme(t => t === "dark" ? "light" : "dark") };
}

// ─── Status Badge ──────────────────────────────────────────────────────────
const statusLabels: Record<string, string> = {
  offen: "Offen", aktiv: "Aktiv", abgeschlossen: "Abgeschlossen", entwurf: "Entwurf",
  in_bearbeitung: "In Bearbeitung", erledigt: "Erledigt", abgelehnt: "Abgelehnt",
  gemeldet: "Gemeldet", archiviert: "Archiviert", überfällig: "Überfällig",
  gekündigt: "Gekündigt", abgelaufen: "Abgelaufen", akzeptabel: "Akzeptabel",
  nicht_akzeptabel: "Nicht akzeptabel", bedingt: "Bedingt", überprüfung: "In Überprüfung",
  implementiert: "Implementiert", geplant: "Geplant", überprüft: "Überprüft",
  niedrig: "Niedrig", mittel: "Mittel", hoch: "Hoch", kritisch: "Kritisch",
  aktiv_ok: "Aktiv"
};

function StatusBadge({ value, className = "" }: { value: string; className?: string }) {
  const cls: Record<string, string> = {
    offen: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
    aktiv: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    abgeschlossen: "bg-blue-500/15 text-blue-400 border-blue-500/30",
    erledigt: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    entwurf: "bg-zinc-500/15 text-zinc-400 border-zinc-500/30",
    in_bearbeitung: "bg-teal-500/15 text-teal-400 border-teal-500/30",
    gemeldet: "bg-blue-500/15 text-blue-400 border-blue-500/30",
    abgelehnt: "bg-red-500/15 text-red-400 border-red-500/30",
    kritisch: "bg-red-500/15 text-red-400 border-red-500/30",
    hoch: "bg-orange-500/15 text-orange-400 border-orange-500/30",
    mittel: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
    niedrig: "bg-green-500/15 text-green-400 border-green-500/30",
    implementiert: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    geplant: "bg-blue-500/15 text-blue-400 border-blue-500/30",
    überprüft: "bg-teal-500/15 text-teal-400 border-teal-500/30",
    gekündigt: "bg-zinc-500/15 text-zinc-400 border-zinc-500/30",
    abgelaufen: "bg-red-500/15 text-red-400 border-red-500/30",
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${cls[value] || "bg-zinc-500/15 text-zinc-400 border-zinc-500/30"} ${className}`}>
      {statusLabels[value] || value}
    </span>
  );
}

// ─── Confirm Dialog ────────────────────────────────────────────────────────
function ConfirmDialog({ open, title, desc, onConfirm, onCancel }: any) {
  return (
    <Dialog open={open} onOpenChange={o => !o && onCancel()}>
      <DialogContent className="max-w-sm max-h-[85vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{title}</DialogTitle></DialogHeader>
        <p className="text-sm text-muted-foreground">{desc}</p>
        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>Abbrechen</Button>
          <Button variant="destructive" onClick={onConfirm}>Löschen</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── LOGIN PAGE ────────────────────────────────────────────────────────────
function LoginPage({ onLogin }: { onLogin: (u: AuthUser) => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [lockHint, setLockHint] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError(""); setLockHint("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST", headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 423) {
          const retryAfter = res.headers.get("Retry-After");
          if (retryAfter) {
            const minutes = Math.max(1, Math.ceil(Number(retryAfter) / 60));
            setLockHint(`Erneut versuchen in ca. ${minutes} Minute${minutes === 1 ? "" : "n"}.`);
          }
        }
        throw new Error(data.message);
      }
      onLogin(data.user);
    } catch (e: any) {
      setError(e.message);
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-8">
        {/* Logo */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20">
            <svg viewBox="0 0 32 32" className="w-8 h-8" aria-label="PrivaShield Logo">
              <path d="M16 2 L28 7 L28 16 C28 23 22 29 16 30 C10 29 4 23 4 16 L4 7 Z" fill="none" stroke="hsl(183 98% 28%)" strokeWidth="2" strokeLinejoin="round"/>
              <path d="M11 16 L14 19 L21 12" stroke="hsl(183 98% 28%)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">PrivaShield</h1>
            <p className="text-sm text-muted-foreground">Datenschutzmanagement-Plattform</p>
          </div>
        </div>

        <Card className="border-border/60">
          <CardContent className="pt-6 space-y-4">
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs font-medium">E-Mail</Label>
                <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="admin@example.de" className="h-9" data-testid="input-email" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-xs font-medium">Passwort</Label>
                <Input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••" className="h-9" data-testid="input-password" />
              </div>
              {error && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-lg">
                    <AlertCircle className="h-4 w-4 shrink-0" />{error}
                  </div>
                  {lockHint && <div className="text-xs text-amber-600 bg-amber-500/10 px-3 py-2 rounded-lg">{lockHint}</div>}
                </div>
              )}
              <Button type="submit" className="w-full h-9 bg-primary hover:bg-primary/90" disabled={loading} data-testid="button-login">
                {loading ? "Anmelden..." : "Anmelden"}
              </Button>
            </form>
            <div className="text-xs text-muted-foreground text-center pt-1">
              Bitte mit deinen zugewiesenen Zugangsdaten anmelden.
            </div>
          </CardContent>
        </Card>
        <p className="text-center text-xs text-muted-foreground">DSGVO Art. 5 – Datenschutz durch Technik</p>
      </div>
    </div>
  );
}

// ─── SIDEBAR ───────────────────────────────────────────────────────────────
const navItems = [
  { path: "/", label: "dashboard", icon: LayoutDashboard },
  { path: "/overview", label: "overview", icon: Eye },
  { path: "/vvt", label: "VVT", icon: FileText },
  { path: "/avv", label: "AVV", icon: Shield },
  { path: "/dsfa", label: "DSFA", icon: AlertTriangle },
  { path: "/datenpannen", label: "Datenpannen", icon: AlertCircle },
  { path: "/dsr", label: "DSR / Betroffenenrechte", icon: UserCheck },
  { path: "/tom", label: "TOM-Katalog", icon: Lock },
  { path: "/audits", label: "Interne Audits", icon: ClipboardList },
  { path: "/pdca", label: "PDCA / Verbesserungszyklus", icon: RefreshCcw },
  { path: "/loeschkonzept", label: "Löschkonzept", icon: Database },
  { path: "/aufgaben", label: "Aufgaben", icon: CheckSquare },
  { path: "/dokumente", label: "Dokumente", icon: FolderOpen },
  { path: "/interne-notizen", label: "internalNotes", icon: NotebookPen },
  { path: "/web-datenschutz", label: "Web-Datenschutz", icon: Globe },
  { path: "/ki-compliance", label: "KI-Tools & Compliance", icon: Bot },
  { path: "/beschaeftigten-datenschutz", label: "Beschäftigtendatenschutz", icon: Users },
  { path: "/extras", label: "Mandanten-Extras", icon: MoreVertical },
  { path: "/export", label: "exportPrint", icon: Printer },
  { path: "/backups", label: "backups", icon: Archive },
];

const adminNavItems = [
  { path: "/mandanten", label: "Mandanten", icon: Building2 },
  { path: "/gruppen", label: "Gruppen", icon: ChevronDown },
  { path: "/vorlagenpakete", label: "Vorlagenpakete", icon: FolderOpen },
  { path: "/benutzer", label: "Benutzer", icon: Users },
  { path: "/system", label: "System", icon: Settings },
];

function Sidebar({ mobile = false, onClose }: { mobile?: boolean; onClose?: () => void }) {
  const { user, logout } = useAuth();
  const { t } = useI18n();
  const { activeMandantId, setActiveMandantId } = useMandant();
  const [location] = useHashLocation();

  const { data: mandanten = [], isLoading: mandantenLoading } = useQuery({
    queryKey: ["/api/mandanten"],
    queryFn: () => apiRequest("GET", "/api/mandanten").then(r => r.json()),
  });

  const sichtbareMandanten = user?.role === "admin"
    ? mandanten
    : mandanten.filter((m: any) => {
        try {
          const allowedIds = JSON.parse(user?.mandantIds || "[]");
          return allowedIds.includes(m.id);
        } catch {
          return false;
        }
      });

  const selectValue = activeMandantId !== null && sichtbareMandanten.some((m: any) => m.id === activeMandantId)
    ? activeMandantId.toString()
    : undefined;

  return (
    <div className="flex flex-col h-full bg-sidebar w-64 border-r border-sidebar-border">
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-4 border-b border-sidebar-border">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/20">
          <svg viewBox="0 0 32 32" className="w-5 h-5">
            <path d="M16 2 L28 7 L28 16 C28 23 22 29 16 30 C10 29 4 23 4 16 L4 7 Z" fill="none" stroke="hsl(183 98% 55%)" strokeWidth="2.5" strokeLinejoin="round"/>
            <path d="M11 16 L14 19 L21 12" stroke="hsl(183 98% 55%)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-sidebar-accent-foreground truncate">{t("appName")}</p>
          <p className="text-xs text-sidebar-foreground/60 truncate">{t("dsmPlatform")}</p>
        </div>
        {mobile && <button onClick={onClose} className="text-sidebar-foreground/60 hover:text-sidebar-accent-foreground"><X className="h-4 w-4" /></button>}
      </div>

      {/* Mandanten-Auswahl */}
      <div className="px-3 py-3 border-b border-sidebar-border">
        <p className="text-xs font-semibold text-sidebar-foreground/50 uppercase tracking-wider mb-2 px-1">{t("tenant")}</p>
        <Select value={selectValue} onValueChange={v => setActiveMandantId(Number(v))} disabled={mandantenLoading || sichtbareMandanten.length <= 1}>
          <SelectTrigger className="h-8 text-xs bg-sidebar-accent border-sidebar-border text-sidebar-accent-foreground" data-testid="select-mandant">
            <SelectValue placeholder={mandantenLoading ? "Mandanten werden geladen..." : sichtbareMandanten.length === 0 ? "Kein Mandant verfügbar" : sichtbareMandanten.length === 1 ? sichtbareMandanten[0].name : t("selectTenant")} />
          </SelectTrigger>
          <SelectContent>
            {sichtbareMandanten.map((m: any) => (
              <SelectItem key={m.id} value={m.id.toString()} className="text-xs">{m.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 px-2 py-2">
        <nav className="space-y-0.5">
          {navItems.map(({ path, label, icon: Icon }) => {
            const active = location === path || (path !== "/" && location.startsWith(path));
            return (
              <Link key={path} href={path}>
                <a onClick={onClose} className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                  active
                    ? "bg-primary/15 text-primary font-medium"
                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                }`}>
                  <Icon className="h-4 w-4 shrink-0" />{(["dashboard","overview","exportPrint","backups","internalNotes"] as string[]).includes(label) ? t(label as MessageKey) : label}
                </a>
              </Link>
            );
          })}

          {user?.role === "admin" && (
            <>
              <div className="pt-3 pb-1 px-1">
                <p className="text-xs font-semibold text-sidebar-foreground/40 uppercase tracking-wider">{t("administration")}</p>
              </div>
              {adminNavItems.map(({ path, label, icon: Icon }) => {
                const active = location.startsWith(path);
                return (
                  <Link key={path} href={path}>
                    <a onClick={onClose} className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                      active ? "bg-primary/15 text-primary font-medium" : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                    }`}>
                      <Icon className="h-4 w-4 shrink-0" />{(["dashboard","overview","exportPrint","backups","internalNotes"] as string[]).includes(label) ? t(label as MessageKey) : label}
                    </a>
                  </Link>
                );
              })}
            </>
          )}
        </nav>
      </ScrollArea>

      {/* User footer */}
      <div className="p-3 border-t border-sidebar-border">
        <div className="flex items-center gap-2 px-1 mb-2">
          <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-sidebar-accent-foreground truncate">{user?.name}</p>
            <p className="text-xs text-sidebar-foreground/50 truncate">{user?.role === "admin" ? t("administrator") : t("user")}</p>
          </div>
        </div>
        <button onClick={logout} className="flex items-center gap-2 w-full px-3 py-1.5 rounded-lg text-xs text-sidebar-foreground hover:bg-sidebar-accent hover:text-red-400 transition-colors">
          <LogOut className="h-3.5 w-3.5" /> {t("logout")}
        </button>
      </div>
    </div>
  );
}

// ─── LAYOUT ────────────────────────────────────────────────────────────────
function Layout({ children }: { children: React.ReactNode }) {
  const { theme, toggle } = useTheme();
  const { lang, setLang, t } = useI18n();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex shrink-0">
        <Sidebar />
      </div>

      {/* Mobile Sidebar */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setMobileOpen(false)} />
          <div className="relative flex h-full">
            <Sidebar mobile onClose={() => setMobileOpen(false)} />
          </div>
        </div>
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Topbar */}
        <header className="h-12 flex items-center justify-between px-4 border-b border-border bg-card/50 backdrop-blur-sm shrink-0">
          <button onClick={() => setMobileOpen(true)} className="lg:hidden text-muted-foreground hover:text-foreground">
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-2 ml-auto">
            <Select value={lang} onValueChange={(v: Lang) => setLang(v)}><SelectTrigger className="h-8 w-[110px] text-xs"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="de">{t("german")}</SelectItem><SelectItem value="en">{t("english")}</SelectItem></SelectContent></Select>
            <button title={t("darkMode")} onClick={toggle} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          {children}
        </main>
        <footer className="border-t border-border bg-card/40 px-4 py-2.5 text-xs text-muted-foreground shrink-0">
          <div className="flex flex-col gap-1 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <span className="font-medium text-foreground/80">PrivaShield</span>
              <span>Version {APP_VERSION}</span>
              <span>Apache-2.0</span>
              <span>Copyright [2026] [Daniel Schuh]</span>
            </div>
            <Link href="/system"><a className="text-primary hover:underline">Lizenz und Copyright</a></Link>
          </div>
        </footer>
      </div>
    </div>
  );
}

// ─── PAGE HEADER ───────────────────────────────────────────────────────────
function PageHeader({ title, desc, action }: { title: string; desc?: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between mb-6">
      <div>
        <h1 className="text-lg font-semibold">{title}</h1>
        {desc && <p className="text-sm text-muted-foreground mt-0.5">{desc}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}

// ─── MANDANT GUARD ─────────────────────────────────────────────────────────
function MandantGuard({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const { activeMandantId } = useMandant();
  const { t } = useI18n();
  const { data: mandanten = [], isLoading: mandantenLoading } = useQuery({
    queryKey: ["/api/mandanten"],
    queryFn: () => apiRequest("GET", "/api/mandanten").then(r => r.json()),
  });

  const sichtbareMandanten = user?.role === "admin"
    ? mandanten
    : mandanten.filter((m: any) => {
        try {
          const allowedIds = JSON.parse(user?.mandantIds || "[]");
          return allowedIds.includes(m.id);
        } catch {
          return false;
        }
      });

  if (mandantenLoading) return (
    <div className="flex flex-col items-center justify-center h-64 text-center gap-3">
      <Skeleton className="h-10 w-10 rounded-full" />
      <p className="text-sm text-muted-foreground">Mandanten werden geladen...</p>
    </div>
  );

  if (mandanten.length > 0 && sichtbareMandanten.length === 0) return (
    <div className="flex flex-col items-center justify-center h-64 text-center gap-3">
      <AlertCircle className="h-10 w-10 text-amber-500/70" />
      <div className="space-y-1">
        <p className="text-sm font-medium text-foreground">Kein Mandant zugewiesen</p>
        <p className="text-sm text-muted-foreground">Deinem Benutzer ist aktuell kein freigegebener Mandant zugeordnet.</p>
      </div>
    </div>
  );

  if (sichtbareMandanten.length > 0 && !activeMandantId) return (
    <div className="flex flex-col items-center justify-center h-64 text-center gap-3">
      <Building2 className="h-10 w-10 text-muted-foreground/40" />
      <p className="text-sm text-muted-foreground">{t("chooseTenantLeft")}</p>
    </div>
  );

  return <>{children}</>;
}

// ─── DASHBOARD ─────────────────────────────────────────────────────────────
function Dashboard() {
  const { t } = useI18n();
  const [, setLocation] = useLocation();
  const { activeMandantId } = useMandant();
  const { data: stats, isLoading } = useQuery({
    queryKey: ["/api/stats", activeMandantId],
    queryFn: () => activeMandantId ? apiRequest("GET", `/api/mandanten/${activeMandantId}/stats`).then(r => r.json()) : null,
    enabled: !!activeMandantId,
  });
  const { data: mandanten = [] } = useQuery({
    queryKey: ["/api/mandanten"],
    queryFn: () => apiRequest("GET", "/api/mandanten").then(r => r.json()),
  });
  const { data: dokumente = [] } = useQuery({
    queryKey: [`/api/mandanten/${activeMandantId}/dokumente`],
    queryFn: () => activeMandantId ? apiRequest("GET", `/api/mandanten/${activeMandantId}/dokumente`).then(r => r.json()) : [],
    enabled: !!activeMandantId,
  });
  const { data: aufgaben = [] } = useQuery({
    queryKey: [`/api/mandanten/${activeMandantId}/aufgaben`],
    queryFn: () => activeMandantId ? apiRequest("GET", `/api/mandanten/${activeMandantId}/aufgaben`).then(r => r.json()) : [],
    enabled: !!activeMandantId,
  });
  const { data: vvt = [] } = useQuery({
    queryKey: [`/api/mandanten/${activeMandantId}/vvt`],
    queryFn: () => activeMandantId ? apiRequest("GET", `/api/mandanten/${activeMandantId}/vvt`).then(r => r.json()) : [],
    enabled: !!activeMandantId,
  });
  const { data: dsfa = [] } = useQuery({
    queryKey: [`/api/mandanten/${activeMandantId}/dsfa`],
    queryFn: () => activeMandantId ? apiRequest("GET", `/api/mandanten/${activeMandantId}/dsfa`).then(r => r.json()) : [],
    enabled: !!activeMandantId,
  });
  const { data: avv = [] } = useQuery({
    queryKey: [`/api/mandanten/${activeMandantId}/avv`],
    queryFn: () => activeMandantId ? apiRequest("GET", `/api/mandanten/${activeMandantId}/avv`).then(r => r.json()) : [],
    enabled: !!activeMandantId,
  });
  const { data: tom = [] } = useQuery({
    queryKey: [`/api/mandanten/${activeMandantId}/tom`],
    queryFn: () => activeMandantId ? apiRequest("GET", `/api/mandanten/${activeMandantId}/tom`).then(r => r.json()) : [],
    enabled: !!activeMandantId,
  });
  const { data: loeschkonzept = [] } = useQuery({
    queryKey: [`/api/mandanten/${activeMandantId}/loeschkonzept`],
    queryFn: () => activeMandantId ? apiRequest("GET", `/api/mandanten/${activeMandantId}/loeschkonzept`).then(r => r.json()) : [],
    enabled: !!activeMandantId,
  });
  const { data: pdca = [] } = useQuery({
    queryKey: [`/api/mandanten/${activeMandantId}/pdca`],
    queryFn: () => activeMandantId ? apiRequest("GET", `/api/mandanten/${activeMandantId}/pdca`).then(r => r.json()) : [],
    enabled: !!activeMandantId,
  });
  const { data: datenpannen = [] } = useQuery({
    queryKey: [`/api/mandanten/${activeMandantId}/datenpannen`],
    queryFn: () => activeMandantId ? apiRequest("GET", `/api/mandanten/${activeMandantId}/datenpannen`).then(r => r.json()) : [],
    enabled: !!activeMandantId,
  });
  const { data: dsr = [] } = useQuery({
    queryKey: [`/api/mandanten/${activeMandantId}/dsr`],
    queryFn: () => activeMandantId ? apiRequest("GET", `/api/mandanten/${activeMandantId}/dsr`).then(r => r.json()) : [],
    enabled: !!activeMandantId,
  });
  const { data: interneNotizen = [] } = useQuery({
    queryKey: [`/api/mandanten/${activeMandantId}/interne-notizen`],
    queryFn: () => activeMandantId ? apiRequest("GET", `/api/mandanten/${activeMandantId}/interne-notizen`).then(r => r.json()) : [],
    enabled: !!activeMandantId,
  });
  const activeMandant = mandanten.find((m: any) => m.id === activeMandantId);
  const { data: gruppen = [] } = useQuery({
    queryKey: ["/api/mandanten-gruppen"],
    queryFn: () => apiRequest("GET", "/api/mandanten-gruppen").then(r => r.json()),
  });
  const leitlinien = dokumente.filter((d: any) => d.kategorie === "leitlinie" || d.kategorie === "leitlinie_datenschutz" || d.kategorie === "leitlinie_informationssicherheit");
  const richtlinien = dokumente.filter((d: any) => d.kategorie === "richtlinie");
  const datenschutzLeitlinie = dokumente.find((d: any) => d.kategorie === "leitlinie_datenschutz" || (d.kategorie === "leitlinie" && /datenschutz/i.test(String(d.titel || ""))));
  const informationssicherheitsLeitlinie = dokumente.find((d: any) => d.kategorie === "leitlinie_informationssicherheit" || (d.kategorie === "leitlinie" && /informationssicher|is[- ]?leitlinie/i.test(String(d.titel || ""))));
  const leitlinienStatusText = datenschutzLeitlinie && informationssicherheitsLeitlinie
    ? "Datenschutz- und Informationssicherheitsleitlinie: aktiv"
    : datenschutzLeitlinie
      ? "Datenschutzleitlinie: aktiv"
      : informationssicherheitsLeitlinie
        ? "Informationssicherheitsleitlinie: aktiv"
        : "Datenschutz- und Informationssicherheitsleitlinie: inaktiv";
  const webDatenschutzCheck = dokumente.find((d: any) => d.kategorie === "prozessbeschreibung" && d.dokumentTyp === "web_datenschutz_check");
  const datenschutzhinweiseCheck = dokumente.find((d: any) => d.kategorie === "prozessbeschreibung" && d.dokumentTyp === "datenschutzhinweise_check");
  const kiComplianceCheck = dokumente.find((d: any) => d.kategorie === "prozessbeschreibung" && d.dokumentTyp === "ki_compliance_check");
  const { data: audits = [] } = useModuleData("audits");
  const beschaeftigtenDok = dokumente.find((d: any) => d.dokumentTyp === "beschaeftigten_datenschutz_check");
  const leitlinieVorhanden = leitlinien.length > 0;
  const offeneReviews = aufgaben.filter((a: any) => a.typ === "review" && a.status !== "erledigt");
  const kritischeAufgaben = aufgaben.filter((a: any) => a.prioritaet === "kritisch" && a.status !== "erledigt");
  const sichtbareInterneNotizen = interneNotizen.slice(0, 5);
  const gruppenKennzahl = activeMandant?.gruppeId ? mandanten.filter((m: any) => m.gruppeId === activeMandant.gruppeId).length : 0;
  const dokumenteCount = dokumente.length;
  const getDocMaturityWeight = (d: any) => {
    if (d.status === "aktiv") return 1.0;
    if (d.status === "entwurf" || d.status === "in_bearbeitung" || d.status === "überprüfung") return 0.5;
    return 0.0;
  };
  const getTomMaturityWeight = (t: any) => {
    if (t.status === "implementiert" || t.status === "überprüft") return 1.0;
    if (t.status === "geplant") return 0.5;
    return 0.0;
  };
  const dashboardLeitlinienCategories = ["leitlinie", "leitlinie_datenschutz", "leitlinie_informationssicherheit", "richtlinie"];
  const dashboardProzessCategories = ["prozessbeschreibung", "verfahrensdokumentation"];

  const leitlinienCount = dokumente.filter((d: any) => dashboardLeitlinienCategories.includes(d.kategorie)).length;
  const prozessDokCount = dokumente.filter((d: any) => dashboardProzessCategories.includes(d.kategorie)).length;

  const leitlinienScore = dokumente
    .filter((d: any) => dashboardLeitlinienCategories.includes(d.kategorie))
    .reduce((sum: number, d: any) => sum + getDocMaturityWeight(d), 0);

  const prozessScore = dokumente
    .filter((d: any) => dashboardProzessCategories.includes(d.kategorie))
    .reduce((sum: number, d: any) => sum + getDocMaturityWeight(d), 0);

  const tomScore = tom.reduce((sum: number, t: any) => sum + getTomMaturityWeight(t), 0);
  const parseDsfaRisiken = (value: any) => {
    try {
      const parsed = typeof value === "string" ? JSON.parse(value || "[]") : value;
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  };
  const dsfaMitDsbCheck = dsfa.every((item: any) => !String(item.status || "").trim() || !!(activeMandant?.dsb || activeMandant?.dsbEmail || activeMandant?.datenschutzmanagerName));
  const dsfaOhneVvtItems = dsfa.filter((item: any) => !item.vvtId);
  const dsfaArt36Items = dsfa.filter((item: any) => !!item.art36Erforderlich);
  const dsfaReviewFaelligItems = dsfa.filter((item: any) => item.naechstePruefungAm && new Date(item.naechstePruefungAm).getTime() < Date.now());
  const dsfaMitHohemRestrisikoItems = dsfa.filter((item: any) => parseDsfaRisiken(item.risiken).some((risk: any) => String(risk?.restrisiko || "").toLowerCase() === "hoch"));
  const dsfaOhneVvt = dsfaOhneVvtItems.length;
  const dsfaMitArt36 = dsfaArt36Items.length;
  const dsfaReviewFaellig = dsfaReviewFaelligItems.length;
  const dsfaMitHohemRestrisiko = dsfaMitHohemRestrisikoItems.length;
  const copilotVvtItems = vvt.filter((entry: any) => /copilot/i.test(String(entry?.bezeichnung || "")));
  const copilotDsfaItems = dsfa.filter((item: any) => /copilot/i.test(String(item?.titel || "")) || /copilot/i.test(String(item?.beschreibung || "")));
  const copilotAvvItems = avv.filter((item: any) => /microsoft/i.test(String(item?.auftragsverarbeiter || "")) || /copilot/i.test(String(item?.gegenstand || "")));
  const copilotTomItems = tom.filter((item: any) => /copilot|ki-/i.test(String(item?.massnahme || "")) || /copilot|ki-/i.test(String(item?.beschreibung || "")));
  const copilotTasksOpenItems = aufgaben.filter((item: any) => /copilot/i.test(String(item?.titel || "")) && item.status !== "erledigt");
  const copilotDsfaOhneReviewItems = copilotDsfaItems.filter((item: any) => !String(item?.naechstePruefungAm || "").trim());
  const avvDashboardMeta = (item: any) => {
    const reviewDate = String(item?.pruefFaellig || "").trim();
    const reviewMissing = !reviewDate;
    const reviewOverdue = !!reviewDate && reviewDate < new Date().toISOString().split("T")[0];
    const inactive = ["entwurf", "gekündigt", "inaktiv", "abgelaufen"].includes(String(item?.status || "").toLowerCase());
    const needsScc = /microsoft|aws|google|openai/i.test(String(item?.auftragsverarbeiter || "")) || /usa|us|drittland|international|global|copilot/i.test(String(item?.gegenstand || ""));
    const sccMissing = needsScc && !item?.sccs;
    return { reviewMissing, reviewOverdue, inactive, sccMissing };
  };
  const copilotAvvOhnePruefungItems = copilotAvvItems.filter((item: any) => !String(item?.pruefFaellig || "").trim());
  const avvReviewOverdueDashboardItems = avv.filter((item: any) => avvDashboardMeta(item).reviewOverdue);
  const avvReviewMissingDashboardItems = avv.filter((item: any) => avvDashboardMeta(item).reviewMissing);
  const avvSccMissingDashboardItems = avv.filter((item: any) => avvDashboardMeta(item).sccMissing);
  const avvInactiveDashboardItems = avv.filter((item: any) => avvDashboardMeta(item).inactive);
  const copilotVvtOhneDsfaItems = copilotVvtItems.filter((item: any) => !item?.dsfa);
  const copilotStatusVorhanden = copilotVvtItems.length > 0 || copilotDsfaItems.length > 0 || copilotAvvItems.length > 0 || copilotTomItems.length > 0;
  const vvtMitHohemRisikoItems = vvt.filter((entry: any) => String(entry?.risikostufe || "").toLowerCase() === "hoch");
  const vvtMitReviewBedarfItems = vvt.filter((entry: any) => String(entry?.risikostufe || "").toLowerCase() === "mittel" || !!entry?.drittlandtransfer);
  const vvtOhneLoeschkonzept = vvt.filter((entry: any) => !loeschkonzept.some((lk: any) => (lk.quelleVvtId && lk.quelleVvtId === entry.id) || String(lk.bezeichnung || "").trim().toLowerCase() === String(entry.bezeichnung || "").trim().toLowerCase())).length;
  const getRetentionDashboardMeta = (item: any) => {
    const loeschklasse = String(item?.loeschklasse || "");
    const missingTrigger = !String(item?.loeschereignis || "").trim();
    const missingOwner = !String(item?.loeschverantwortlicher || item?.verantwortlicher || "").trim();
    const missingProof = !String(item?.nachweis || item?.kontrolle || "").trim();
    const lk5Control = loeschklasse === "LK5" && (!String(item?.kontrolle || "").trim() || !String(item?.nachweis || "").trim());
    const freePeriod = String(item?.fristKategorie || "") === "frei" || !String(item?.fristKategorie || "").trim();
    return { missingTrigger, missingOwner, missingProof, lk5Control, freePeriod };
  };
  const retentionMissingTriggerDashboardItems = loeschkonzept.filter((item: any) => getRetentionDashboardMeta(item).missingTrigger);
  const retentionMissingOwnerDashboardItems = loeschkonzept.filter((item: any) => getRetentionDashboardMeta(item).missingOwner);
  const retentionMissingProofDashboardItems = loeschkonzept.filter((item: any) => getRetentionDashboardMeta(item).missingProof);
  const retentionLk5ControlDashboardItems = loeschkonzept.filter((item: any) => getRetentionDashboardMeta(item).lk5Control);
  const retentionFreePeriodDashboardItems = loeschkonzept.filter((item: any) => getRetentionDashboardMeta(item).freePeriod);
  const aiCheckDocument = dokumente.find((d: any) => d.kategorie === "prozessbeschreibung" && d.dokumentTyp === "ki_compliance_check");
  const aiCheckContent = (() => {
    try { return aiCheckDocument?.inhalt ? JSON.parse(aiCheckDocument.inhalt) : null; } catch { return null; }
  })();
  const employeePrivacyCheckDocument = dokumente.find((d: any) => d.kategorie === "prozessbeschreibung" && d.dokumentTyp === "beschaeftigten_datenschutz_check");
  const employeePrivacyContent = (() => {
    try { return employeePrivacyCheckDocument?.inhalt ? JSON.parse(employeePrivacyCheckDocument.inhalt) : null; } catch { return null; }
  })();
  const webPrivacyDashboardDocument = dokumente.find((d: any) => d.kategorie === "prozessbeschreibung" && d.dokumentTyp === "web_datenschutz_check");
  const webPrivacyDashboardContent = (() => {
    try { return webPrivacyDashboardDocument?.inhalt ? JSON.parse(webPrivacyDashboardDocument.inhalt) : null; } catch { return null; }
  })();
  const webNoticeDashboardDocument = dokumente.find((d: any) => d.kategorie === "prozessbeschreibung" && d.dokumentTyp === "datenschutzhinweise_check");
  const webNoticeDashboardContent = (() => {
    try { return webNoticeDashboardDocument?.inhalt ? JSON.parse(webNoticeDashboardDocument.inhalt) : null; } catch { return null; }
  })();
  const aiChecklistValues = Object.values(aiCheckContent?.dsgvoCheckliste || {});
  const aiChecklistDone = aiChecklistValues.filter(Boolean).length;
  const aiChecklistTotal = aiChecklistValues.length;
  const aiMissingPolicyDashboard = !!aiCheckContent?.kiImEinsatz && !aiCheckContent?.kiRichtlinieVorhanden;
  const aiMissingAiActDashboard = !!aiCheckContent?.kiImEinsatz && !aiCheckContent?.kiVoGeprueft;
  const aiIncompleteChecklistDashboard = !!aiCheckContent?.kiImEinsatz && aiChecklistTotal > 0 && aiChecklistDone < aiChecklistTotal;
  const aiDsfaGapDashboard = !!aiCheckContent?.kiImEinsatz && !!aiCheckContent?.dsfaErforderlich && (!aiCheckContent?.dsfaDurchgefuehrt || String(aiCheckContent?.verknuepfteDsfaId || "none") === "none");
  const aiToolInventoryGapDashboard = !!aiCheckContent?.kiImEinsatz && (!Array.isArray(aiCheckContent?.tools) || aiCheckContent.tools.length === 0);
  const employeeTrainingOverdueDashboard = !!employeePrivacyContent?.naechsteSchulungAm && String(employeePrivacyContent.naechsteSchulungAm) < new Date().toISOString().split("T")[0];
  const employeeMissingPrivacyNoticeDashboard = !employeePrivacyContent?.datenschutzerklaerungVorhanden;
  const employeeMissingConfidentialityDashboard = !employeePrivacyContent?.verpflichtungVerschwiegenheit;
  const employeeMissingTelecomDashboard = !employeePrivacyContent?.verpflichtungTelekommunikation;
  const employeeMissingTrainingDashboard = !employeePrivacyContent?.schulungDurchgefuehrt;
  const employeeMissingEvidenceDashboard = !String(employeePrivacyContent?.nachweise || "").trim();
  const employeeMissingTargetGroupsDashboard = !Array.isArray(employeePrivacyContent?.zielgruppen) || employeePrivacyContent.zielgruppen.length === 0;
  const webDashboardConsentReasons = Array.isArray(webPrivacyDashboardContent?.consentToolNotRequiredReasons) ? webPrivacyDashboardContent.consentToolNotRequiredReasons : [];
  const webDashboardHasManualConsentReason = webDashboardConsentReasons.includes("manual") && !!String(webPrivacyDashboardContent?.consentToolNotRequiredReason || "").trim();
  const webDashboardHasPresetConsentReason = webDashboardConsentReasons.some((reason: string) => reason !== "manual");
  const webDashboardConsentRequirementDocumented = webPrivacyDashboardContent?.consentToolRequired || (!webPrivacyDashboardContent?.consentToolRequired && (webDashboardHasPresetConsentReason || webDashboardHasManualConsentReason));
  const webDashboardConsentMissing = !!webPrivacyDashboardContent?.consentToolRequired && !webPrivacyDashboardContent?.consentTool;
  const webDashboardConsentReasonMissing = !webPrivacyDashboardContent?.consentToolRequired && !webDashboardConsentRequirementDocumented;
  const webDashboardPrivacyNoticeMissing = !webPrivacyDashboardContent?.datenschutzerklaerungGeprueft;
  const webDashboardImpressumMissing = !webPrivacyDashboardContent?.impressumGeprueft;
  const webDashboardNoticeGroupsMissing = Object.values(webNoticeDashboardContent?.groups || {}).filter(Boolean).length === 0;
  const webDashboardNoticeDistributionMissing = [webNoticeDashboardContent?.distributionEmail, webNoticeDashboardContent?.distributionQr, webNoticeDashboardContent?.websiteSubpage].filter(Boolean).length === 0;
  const webDashboardNotesMissing = !String(webNoticeDashboardContent?.notes || "").trim() && !String(webPrivacyDashboardContent?.notes || "").trim();
  const getAuditDashboardMeta = (item: any) => {
    const abweichungen = String(item?.abweichungen || "").split("\n").filter((line: string) => line.trim());
    const todos = String(item?.empfehlungen || "").split("\n").filter((line: string) => line.trim());
    const linkedPdcaIds = (() => {
      try { return JSON.parse(item?.verknuepftePdcaIds || "[]"); } catch { return []; }
    })();
    const linkedPdca = pdca.filter((entry: any) => linkedPdcaIds.includes(entry.id));
    const linkedTasks = aufgaben.filter((task: any) => String(task?.vorlagenBezug || "") === "pdca_follow_up" && linkedPdca.some((entry: any) => Number(entry.id) === Number(task?.referenzId)));
    const offeneLinkedTasks = linkedTasks.filter((task: any) => String(task?.status || "") !== "erledigt");
    const missingFollowUp = abweichungen.length > 0 && linkedPdca.length === 0;
    const overdueNextAudit = !!item?.naechstesAuditAm && String(item.naechstesAuditAm) < new Date().toISOString().split("T")[0] && String(item?.status || "") !== "abgeschlossen";
    const criticalOpen = ["kritisch", "hoch"].includes(String(item?.ergebnis || "").toLowerCase()) && String(item?.status || "") !== "abgeschlossen";
    const missingOwner = (abweichungen.length > 0 || todos.length > 0) && !String(item?.auditor || item?.verantwortlicher || "").trim();
    const inProgressNoTask = linkedPdca.some((entry: any) => String(entry?.status || "") === "in_bearbeitung") && offeneLinkedTasks.length === 0;
    return { missingFollowUp, overdueNextAudit, criticalOpen, missingOwner, inProgressNoTask };
  };
  const auditMissingFollowUpDashboardItems = audits.filter((item: any) => getAuditDashboardMeta(item).missingFollowUp);
  const auditOverdueNextAuditDashboardItems = audits.filter((item: any) => getAuditDashboardMeta(item).overdueNextAudit);
  const auditCriticalOpenDashboardItems = audits.filter((item: any) => getAuditDashboardMeta(item).criticalOpen);
  const auditMissingOwnerDashboardItems = audits.filter((item: any) => getAuditDashboardMeta(item).missingOwner);
  const auditInProgressNoTaskDashboardItems = audits.filter((item: any) => getAuditDashboardMeta(item).inProgressNoTask);
  const pdcaOffenItems = pdca.filter((item: any) => String(item.status || "") !== "abgeschlossen");
  const pdcaReviewFaelligItems = pdca.filter((item: any) => item.naechstePruefungAm && new Date(item.naechstePruefungAm).getTime() < Date.now() && String(item.status || "") !== "abgeschlossen");
  const auditFollowUpsDashboard = pdca.filter((item: any) => String(item.zyklusTyp || "") === "audit_follow_up");
  const auditFollowUpsOhneAuditDashboard = auditFollowUpsDashboard.filter((item: any) => !item.verknuepftesAuditId);
  const pdcaFollowUpTasksDashboard = aufgaben.filter((item: any) => String(item.vorlagenBezug || "") === "pdca_follow_up");
  const pdcaFollowUpTasksOffenDashboard = pdcaFollowUpTasksDashboard.filter((item: any) => String(item.status || "") !== "erledigt");
  const tomDashboardMeta = (item: any) => {
    const reviewDate = String(item?.pruefDatum || "").trim();
    const reviewMissing = !reviewDate;
    const reviewOverdue = !!reviewDate && reviewDate < new Date().toISOString().split("T")[0];
    const planned = String(item?.status || "").toLowerCase() === "geplant";
    const weakEffectiveness = ["niedrig", "mittel"].includes(String(item?.wirksamkeit || "").toLowerCase()) || !String(item?.wirksamkeit || "").trim();
    const missingOwner = !String(item?.verantwortlicher || "").trim();
    return { reviewDate, reviewMissing, reviewOverdue, planned, weakEffectiveness, missingOwner };
  };
  const tomReviewOverdueDashboardItems = tom.filter((item: any) => tomDashboardMeta(item).reviewOverdue);
  const tomReviewMissingDashboardItems = tom.filter((item: any) => tomDashboardMeta(item).reviewMissing);
  const tomPlannedDashboardItems = tom.filter((item: any) => tomDashboardMeta(item).planned);
  const tomWeakEffectivenessDashboardItems = tom.filter((item: any) => tomDashboardMeta(item).weakEffectiveness);
  const tomMissingOwnerDashboardItems = tom.filter((item: any) => tomDashboardMeta(item).missingOwner);
  const pdcaKritischOderHochOffenDashboard = pdcaOffenItems.filter((item: any) => ["kritisch", "hoch"].includes(String(item?.prioritaet || "").toLowerCase()));
  const pdcaOhneNaechstePruefungDashboard = pdcaOffenItems.filter((item: any) => !String(item?.naechstePruefungAm || "").trim());
  const pdcaInBearbeitungOhneOffeneFolgeaufgabeDashboard = pdcaOffenItems.filter((item: any) => String(item?.status || "") === "in_bearbeitung" && !pdcaFollowUpTasksOffenDashboard.some((task: any) => Number(task?.referenzId) === Number(item?.id)));
  const pdcaFollowUpTasksUeberfaelligDashboard = pdcaFollowUpTasksOffenDashboard.filter((item: any) => String(item?.faelligAm || "").trim() && String(item.faelligAm) < new Date().toISOString().split("T")[0]);
  const kritischeAufgabenOhneTerminDashboard = kritischeAufgaben.filter((item: any) => !String(item?.faelligAm || "").trim());
  const parseIncidentDashboardDateTime = (item: any, fieldDate: string, fieldTime?: string) => {
    const date = String(item?.[fieldDate] || "").trim();
    if (!date) return null;
    const time = String(fieldTime ? item?.[fieldTime] || "" : "").trim() || "00:00";
    const normalized = time.length === 5 ? `${time}:00` : time;
    const parsed = new Date(`${date}T${normalized}`);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  };
  const parseIncidentDashboardDeadline = (item: any) => {
    const raw = String(item?.frist72h || "").trim();
    if (!raw) return null;
    const normalized = raw.length === 16 ? `${raw}:00` : raw;
    const parsed = new Date(normalized);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  };
  const getIncidentDashboardMeta = (item: any) => {
    const discoveredAt = parseIncidentDashboardDateTime(item, "entdecktAm", "entdecktUm");
    const deadline = parseIncidentDashboardDeadline(item) || (discoveredAt ? new Date(discoveredAt.getTime() + 72 * 60 * 60 * 1000) : null);
    const authorityReported = !!String(item?.behoerdeMeldung || item?.gemeldetAm || "").trim() || String(item?.status || "") === "gemeldet";
    const isOpen = String(item?.status || "") !== "abgeschlossen";
    const severity = String(item?.schwere || "").toLowerCase();
    const isCritical = ["kritisch", "hoch"].includes(severity) || Number(item?.betroffenePersonen || 0) >= 500;
    const shouldNotifyDataSubjects = !!item?.meldepflichtig && !item?.betroffenInformiert && ["kritisch", "hoch"].includes(severity);
    const hoursLeft = deadline ? (deadline.getTime() - Date.now()) / (1000 * 60 * 60) : null;
    const deadlineMissed = !!item?.meldepflichtig && isOpen && !authorityReported && hoursLeft !== null && hoursLeft < 0;
    const deadlineSoon = !!item?.meldepflichtig && isOpen && !authorityReported && hoursLeft !== null && hoursLeft >= 0 && hoursLeft <= 72;
    const reportableOpen = !!item?.meldepflichtig && isOpen && !authorityReported;
    return { discoveredAt, deadline, authorityReported, isOpen, isCritical, shouldNotifyDataSubjects, deadlineMissed, deadlineSoon, reportableOpen };
  };
  const incidentCriticalItems = datenpannen.filter((item: any) => getIncidentDashboardMeta(item).isCritical);
  const incidentReportableOpenItems = datenpannen.filter((item: any) => getIncidentDashboardMeta(item).reportableOpen);
  const incidentDeadlineSoonItems = datenpannen.filter((item: any) => getIncidentDashboardMeta(item).deadlineSoon);
  const incidentDeadlineMissedItems = datenpannen.filter((item: any) => getIncidentDashboardMeta(item).deadlineMissed);
  const incidentNotifyArt34Items = datenpannen.filter((item: any) => getIncidentDashboardMeta(item).shouldNotifyDataSubjects);
  const getDsrDashboardMeta = (item: any) => {
    const deadline = String(item?.fristDatum || "").trim();
    const status = String(item?.status || "");
    const isClosed = status === "abgeschlossen" || status === "abgelehnt";
    const deadlineMissed = !!deadline && deadline < new Date().toISOString().split("T")[0] && !isClosed;
    const deadlineSoon = !!deadline && deadline >= new Date().toISOString().split("T")[0] && ((new Date(`${deadline}T00:00:00`).getTime() - new Date(`${new Date().toISOString().split("T")[0]}T00:00:00`).getTime()) / (1000 * 60 * 60 * 24)) <= 7 && !isClosed;
    const missingDeadline = !deadline && !isClosed;
    const verification = status === "in_pruefung" || status === "wartet_auf_identifikation";
    const open = !isClosed;
    return { deadlineMissed, deadlineSoon, missingDeadline, verification, open };
  };
  const dsrDeadlineMissedDashboardItems = dsr.filter((item: any) => getDsrDashboardMeta(item).deadlineMissed);
  const dsrDeadlineSoonDashboardItems = dsr.filter((item: any) => getDsrDashboardMeta(item).deadlineSoon);
  const dsrMissingDeadlineDashboardItems = dsr.filter((item: any) => getDsrDashboardMeta(item).missingDeadline);
  const dsrVerificationDashboardItems = dsr.filter((item: any) => getDsrDashboardMeta(item).verification);
  const dashboardGovernanceSeverityOrder: Record<string, number> = { hoch: 0, mittel: 1, niedrig: 2 };
  const dashboardGovernanceFindings = [
    kritischeAufgaben.length > 0 ? { severity: "hoch", title: `${kritischeAufgaben.length} kritische offene Aufgaben`, recommendation: "Kritische Aufgaben sofort priorisieren und Verantwortliche mit Termin festziehen.", actionLabel: "Zu den Aufgaben", actionHref: "/aufgaben?filter=kritisch" } : null,
    pdcaReviewFaelligItems.length > 0 ? { severity: pdcaReviewFaelligItems.length >= 3 ? "hoch" : "mittel", title: `${pdcaReviewFaelligItems.length} PDCA-Reviews fällig oder überfällig`, recommendation: "Reviewtermine kurzfristig ansetzen und Wirksamkeitsstatus aktualisieren.", actionLabel: "Zur PDCA-Seite", actionHref: "/pdca?filter=review" } : null,
    auditFollowUpsOhneAuditDashboard.length > 0 ? { severity: "hoch", title: `${auditFollowUpsOhneAuditDashboard.length} Audit-Follow-ups ohne Audit-Bezug`, recommendation: "Audit-Verknüpfungen nachziehen, damit Nachverfolgung und Export vollständig bleiben.", actionLabel: "Zu Audit/PDCA", actionHref: "/pdca?filter=audit-follow-up-ohne-audit" } : null,
    pdcaFollowUpTasksOffenDashboard.length > 0 ? { severity: pdcaFollowUpTasksOffenDashboard.length >= 5 ? "mittel" : "niedrig", title: `${pdcaFollowUpTasksOffenDashboard.length} offene PDCA-Folgeaufgaben`, recommendation: "Offene Folgeaufgaben bündeln und den laufenden PDCA-Zyklen zuordnen.", actionLabel: "Zu den Aufgaben", actionHref: "/aufgaben?filter=pdca-follow-up-offen" } : null,
    pdcaFollowUpTasksUeberfaelligDashboard.length > 0 ? { severity: pdcaFollowUpTasksUeberfaelligDashboard.length >= 3 ? "hoch" : "mittel", title: `${pdcaFollowUpTasksUeberfaelligDashboard.length} überfällige PDCA-Folgeaufgaben`, recommendation: "Überfällige Folgeaufgaben sofort terminlich und personell nachsteuern, damit Zyklen nicht hängen bleiben.", actionLabel: "Zu den Aufgaben", actionHref: "/aufgaben?filter=pdca-follow-up-ueberfaellig" } : null,
    pdcaKritischOderHochOffenDashboard.length > 0 ? { severity: "hoch", title: `${pdcaKritischOderHochOffenDashboard.length} offene PDCA-Zyklen mit hoher Priorität`, recommendation: "Kritische Verbesserungszyklen aktiv steuern und ihre Folgeaufgaben eng nachhalten.", actionLabel: "Zur PDCA-Seite", actionHref: "/pdca?filter=priority-high" } : null,
    pdcaOhneNaechstePruefungDashboard.length > 0 ? { severity: "mittel", title: `${pdcaOhneNaechstePruefungDashboard.length} offene PDCA-Zyklen ohne nächsten Prüftermin`, recommendation: "Nächste Prüfung und Review-Takt für offene Zyklen verbindlich setzen.", actionLabel: "Zur PDCA-Seite", actionHref: "/pdca?filter=review-missing" } : null,
    pdcaInBearbeitungOhneOffeneFolgeaufgabeDashboard.length > 0 ? { severity: "mittel", title: `${pdcaInBearbeitungOhneOffeneFolgeaufgabeDashboard.length} laufende PDCA-Zyklen ohne offene Folgeaufgabe`, recommendation: "Laufende Zyklen operativ absichern und mindestens eine verknüpfte Folgeaufgabe nachziehen.", actionLabel: "Zur PDCA-Seite", actionHref: "/pdca?filter=in-progress-no-task" } : null,
    kritischeAufgabenOhneTerminDashboard.length > 0 ? { severity: "hoch", title: `${kritischeAufgabenOhneTerminDashboard.length} kritische Aufgaben ohne Fälligkeit`, recommendation: "Kritische Aufgaben sofort mit Termin und Verantwortung versehen, damit keine blinden Risiken offen bleiben.", actionLabel: "Zu den Aufgaben", actionHref: "/aufgaben?filter=kritisch-ohne-faelligkeit" } : null,
    dsfaMitArt36 > 0 ? { severity: "hoch", title: `${dsfaMitArt36} DSFA mit Art.-36-Prüfbedarf`, recommendation: "Aufsichtsbehördlichen Prüfbedarf rechtlich bewerten und Eskalation vorbereiten.", actionLabel: "Zur DSFA-Seite", actionHref: "/dsfa?filter=art36" } : null,
    dsfaMitHohemRestrisiko > 0 ? { severity: "hoch", title: `${dsfaMitHohemRestrisiko} DSFA mit hohem Restrisiko`, recommendation: "Restrisikobehandlung priorisieren und Freigabe-/Abstellmaßnahmen dokumentieren.", actionLabel: "Zur DSFA-Seite", actionHref: "/dsfa?filter=high-risk" } : null,
    incidentDeadlineMissedItems.length > 0 ? { severity: "hoch", title: `${incidentDeadlineMissedItems.length} Datenpannen mit überschrittener 72h-Frist`, recommendation: "Fristüberschreitungen rechtlich bewerten, Behördenkommunikation absichern und Begründung dokumentieren.", actionLabel: "Zu Datenpannen", actionHref: "/datenpannen?filter=deadline-missed" } : null,
    incidentDeadlineSoonItems.length > 0 ? { severity: "hoch", title: `${incidentDeadlineSoonItems.length} Datenpannen innerhalb der 72h-Frist`, recommendation: "Meldewege, Freigaben und Nachweise sofort priorisieren, solange die Frist aktiv läuft.", actionLabel: "Zu Datenpannen", actionHref: "/datenpannen?filter=deadline-72h" } : null,
    incidentReportableOpenItems.length > 0 ? { severity: "mittel", title: `${incidentReportableOpenItems.length} meldepflichtige Datenpannen ohne Abschluss`, recommendation: "Art.-33-Bewertung, Meldestatus und Dokumentation strukturiert nachziehen.", actionLabel: "Zu Datenpannen", actionHref: "/datenpannen?filter=reportable-open" } : null,
    incidentNotifyArt34Items.length > 0 ? { severity: "mittel", title: `${incidentNotifyArt34Items.length} Datenpannen mit Art.-34-Prüfbedarf`, recommendation: "Benachrichtigung betroffener Personen rechtlich prüfen und Kommunikationsstatus dokumentieren.", actionLabel: "Zu Datenpannen", actionHref: "/datenpannen?filter=notify-art34" } : null,
    incidentCriticalItems.length > 0 ? { severity: "mittel", title: `${incidentCriticalItems.length} kritische oder hohe Datenpannen`, recommendation: "Schwere Vorfälle mit Sofortmaßnahmen, Lagebewertung und Verbesserungssteuerung priorisieren.", actionLabel: "Zu Datenpannen", actionHref: "/datenpannen?filter=critical" } : null,
    dsrDeadlineMissedDashboardItems.length > 0 ? { severity: "hoch", title: `${dsrDeadlineMissedDashboardItems.length} DSR-Fristen überschritten`, recommendation: "Betroffenenanfragen mit Fristverletzung sofort rechtlich und operativ absichern.", actionLabel: "Zu DSR", actionHref: "/dsr?filter=deadline-missed" } : null,
    dsrDeadlineSoonDashboardItems.length > 0 ? { severity: "mittel", title: `${dsrDeadlineSoonDashboardItems.length} DSR-Fristen laufen in den nächsten 7 Tagen ab`, recommendation: "Offene Betroffenenanfragen kurzfristig priorisieren und Rückmeldungen absichern.", actionLabel: "Zu DSR", actionHref: "/dsr?filter=deadline-soon" } : null,
    dsrMissingDeadlineDashboardItems.length > 0 ? { severity: "mittel", title: `${dsrMissingDeadlineDashboardItems.length} DSR ohne dokumentierte Frist`, recommendation: "Fristberechnung, Zuständigkeit und Bearbeitungssteuerung für offene Anfragen nachziehen.", actionLabel: "Zu DSR", actionHref: "/dsr?filter=missing-deadline" } : null,
    dsrVerificationDashboardItems.length > 0 ? { severity: "mittel", title: `${dsrVerificationDashboardItems.length} DSR im Prüf- oder Identifikationsstatus`, recommendation: "Identifikation, Umfang und Bearbeitungsstand dieser Anfragen verbindlich klären.", actionLabel: "Zu DSR", actionHref: "/dsr?filter=verification" } : null,
    avvReviewOverdueDashboardItems.length > 0 ? { severity: "hoch", title: `${avvReviewOverdueDashboardItems.length} AVV-Reviews überfällig`, recommendation: "Vertrags- und Nachweisprüfungen kurzfristig nachziehen und dokumentieren.", actionLabel: "Zu AVV", actionHref: "/avv?filter=review-overdue" } : null,
    avvSccMissingDashboardItems.length > 0 ? { severity: "hoch", title: `${avvSccMissingDashboardItems.length} AVV mit offenem SCC-/Transferprüfbedarf`, recommendation: "Drittland- und Transfergrundlagen mit SCC-/DPA-Prüfung priorisiert bewerten.", actionLabel: "Zu AVV", actionHref: "/avv?filter=scc-missing" } : null,
    copilotAvvOhnePruefungItems.length > 0 ? { severity: "mittel", title: `${copilotAvvOhnePruefungItems.length} Copilot-/Microsoft-AVV ohne Prüffälligkeit`, recommendation: "Microsoft-/Copilot-Verträge mit DPA, Product Terms und Prüffristen strukturiert nachziehen.", actionLabel: "Zu AVV", actionHref: "/avv?filter=copilot-missing-review" } : null,
    avvReviewMissingDashboardItems.length > 0 ? { severity: "mittel", title: `${avvReviewMissingDashboardItems.length} AVV ohne Reviewtermin`, recommendation: "Prüffälligkeit, Turnus und Verantwortlichkeit für AVV verbindlich festlegen.", actionLabel: "Zu AVV", actionHref: "/avv?filter=review-missing" } : null,
    avvInactiveDashboardItems.length > 0 ? { severity: "niedrig", title: `${avvInactiveDashboardItems.length} AVV mit nicht aktivem Status`, recommendation: "Vertragslage und operative Nutzung bereinigen, damit die AVV-Steuerung belastbar bleibt.", actionLabel: "Zu AVV", actionHref: "/avv?filter=inactive" } : null,
    tomReviewOverdueDashboardItems.length > 0 ? { severity: "hoch", title: `${tomReviewOverdueDashboardItems.length} TOM-Reviews überfällig`, recommendation: "Wirksamkeits- und Nachweisprüfungen der TOM kurzfristig nachziehen und dokumentieren.", actionLabel: "Zu TOM", actionHref: "/tom?filter=review-overdue" } : null,
    tomPlannedDashboardItems.length > 0 ? { severity: tomPlannedDashboardItems.length >= 3 ? "hoch" : "mittel", title: `${tomPlannedDashboardItems.length} geplante TOM ohne Abschluss`, recommendation: "Noch nicht umgesetzte TOM priorisieren und operativ absichern.", actionLabel: "Zu TOM", actionHref: "/tom?filter=planned" } : null,
    tomReviewMissingDashboardItems.length > 0 ? { severity: "mittel", title: `${tomReviewMissingDashboardItems.length} TOM ohne Prüftermin`, recommendation: "Prüffälligkeiten und Reviewintervalle für TOM verbindlich festlegen.", actionLabel: "Zu TOM", actionHref: "/tom?filter=review-missing" } : null,
    tomWeakEffectivenessDashboardItems.length > 0 ? { severity: "mittel", title: `${tomWeakEffectivenessDashboardItems.length} TOM mit schwacher oder offener Wirksamkeit`, recommendation: "Wirksamkeitsbewertung, Nachweise und Verbesserungsbedarf der TOM fachlich nachsteuern.", actionLabel: "Zu TOM", actionHref: "/tom?filter=weak-effectiveness" } : null,
    tomMissingOwnerDashboardItems.length > 0 ? { severity: "mittel", title: `${tomMissingOwnerDashboardItems.length} TOM ohne Verantwortlichkeit`, recommendation: "Verantwortliche Rollen für TOM eindeutig festlegen und Reviewverantwortung zuordnen.", actionLabel: "Zu TOM", actionHref: "/tom?filter=missing-owner" } : null,
    retentionLk5ControlDashboardItems.length > 0 ? { severity: "hoch", title: `${retentionLk5ControlDashboardItems.length} Löschkonzept-Einträge mit LK5-Kontrollbedarf`, recommendation: "Hochrisiko-Einträge mit Nachweis-, Kontroll- und Verantwortungslogik kurzfristig absichern.", actionLabel: "Zum Löschkonzept", actionHref: "/loeschkonzept?filter=lk5-control" } : null,
    retentionMissingTriggerDashboardItems.length > 0 ? { severity: "mittel", title: `${retentionMissingTriggerDashboardItems.length} Löschkonzept-Einträge ohne Löschereignis`, recommendation: "Löschtrigger und operative Auslöser für offene Einträge verbindlich ergänzen.", actionLabel: "Zum Löschkonzept", actionHref: "/loeschkonzept?filter=missing-trigger" } : null,
    retentionMissingOwnerDashboardItems.length > 0 ? { severity: "mittel", title: `${retentionMissingOwnerDashboardItems.length} Löschkonzept-Einträge ohne Löschverantwortung`, recommendation: "Operative Löschverantwortung und Zuständigkeiten in offenen Einträgen festlegen.", actionLabel: "Zum Löschkonzept", actionHref: "/loeschkonzept?filter=missing-owner" } : null,
    retentionMissingProofDashboardItems.length > 0 ? { severity: "mittel", title: `${retentionMissingProofDashboardItems.length} Löschkonzept-Einträge ohne Nachweis oder Kontrolle`, recommendation: "Nachweis- und Kontrolllogik dokumentieren, damit Löschung belastbar auditiert werden kann.", actionLabel: "Zum Löschkonzept", actionHref: "/loeschkonzept?filter=missing-proof" } : null,
    retentionFreePeriodDashboardItems.length > 0 ? { severity: "niedrig", title: `${retentionFreePeriodDashboardItems.length} Löschkonzept-Einträge mit freier Fristkategorie`, recommendation: "Freie Fristen fachlich und rechtlich begründen, damit die Löschlogik belastbar bleibt.", actionLabel: "Zum Löschkonzept", actionHref: "/loeschkonzept?filter=free-period" } : null,
    aiMissingPolicyDashboard ? { severity: "hoch", title: "KI-Einsatz ohne KI-Richtlinie", recommendation: "Governance, zulässige Nutzung und Verbote für eingesetzte KI-Tools kurzfristig verbindlich dokumentieren.", actionLabel: "Zu KI-Compliance", actionHref: "/ki-compliance?filter=missing-policy" } : null,
    aiMissingAiActDashboard ? { severity: "hoch", title: "KI-Einsatz ohne dokumentierte KI-VO-Prüfung", recommendation: "Regulatorische Einordnung und Pflichten aus der KI-VO für den KI-Einsatz strukturiert nachziehen.", actionLabel: "Zu KI-Compliance", actionHref: "/ki-compliance?filter=missing-ai-act" } : null,
    aiDsfaGapDashboard ? { severity: "hoch", title: "KI-Einsatz mit offener DSFA-Lücke", recommendation: "Erforderliche DSFA sofort durchführen oder sauber mit dem KI-Einsatz verknüpfen.", actionLabel: "Zu KI-Compliance", actionHref: "/ki-compliance?filter=dsfa-gap" } : null,
    aiIncompleteChecklistDashboard ? { severity: "mittel", title: "KI-Einsatz mit unvollständiger DSGVO-Checkliste", recommendation: "Offene DSGVO-Prüfpunkte für den KI-Einsatz systematisch vervollständigen.", actionLabel: "Zu KI-Compliance", actionHref: "/ki-compliance?filter=incomplete-checklist" } : null,
    aiToolInventoryGapDashboard ? { severity: "mittel", title: "KI-Einsatz ohne dokumentiertes Toolinventar", recommendation: "Eingesetzte KI-Systeme und Anbieter belastbar erfassen, damit Governance und Nachweise tragfähig bleiben.", actionLabel: "Zu KI-Compliance", actionHref: "/ki-compliance?filter=tool-inventory-gap" } : null,
    auditMissingFollowUpDashboardItems.length > 0 ? { severity: "hoch", title: `${auditMissingFollowUpDashboardItems.length} Audits ohne PDCA-Follow-up`, recommendation: "Abweichungen mit fehlendem Audit-Follow-up operativ nachziehen und mit PDCA verknüpfen.", actionLabel: "Zu Audits", actionHref: "/audits?filter=missing-follow-up" } : null,
    auditCriticalOpenDashboardItems.length > 0 ? { severity: "hoch", title: `${auditCriticalOpenDashboardItems.length} offene Audits mit hohem oder kritischem Ergebnis`, recommendation: "Kritische Auditergebnisse priorisiert steuern und Folgeaktivitäten verbindlich hinterlegen.", actionLabel: "Zu Audits", actionHref: "/audits?filter=critical-open" } : null,
    auditOverdueNextAuditDashboardItems.length > 0 ? { severity: "mittel", title: `${auditOverdueNextAuditDashboardItems.length} Audits mit überfälligem nächstem Termin`, recommendation: "Überfällige Auditzyklen terminlich neu aufsetzen und Verantwortliche festziehen.", actionLabel: "Zu Audits", actionHref: "/audits?filter=overdue-next-audit" } : null,
    auditMissingOwnerDashboardItems.length > 0 ? { severity: "mittel", title: `${auditMissingOwnerDashboardItems.length} Audits ohne klare Verantwortlichkeit`, recommendation: "Verantwortliche für offene Auditmaßnahmen und Empfehlungen verbindlich zuordnen.", actionLabel: "Zu Audits", actionHref: "/audits?filter=missing-owner" } : null,
    auditInProgressNoTaskDashboardItems.length > 0 ? { severity: "mittel", title: `${auditInProgressNoTaskDashboardItems.length} Audit-Follow-ups ohne offene Folgeaufgabe`, recommendation: "Laufende Audit-Follow-ups operativ absichern und mit mindestens einer Folgeaufgabe hinterlegen.", actionLabel: "Zu Audits", actionHref: "/audits?filter=in-progress-no-task" } : null,
    employeeTrainingOverdueDashboard ? { severity: "hoch", title: "Beschäftigtenschulung überfällig", recommendation: "Überfällige Datenschutzschulung kurzfristig terminieren und Nachweise sichern.", actionLabel: "Zu Beschäftigtendatenschutz", actionHref: "/beschaeftigtendatenschutz?filter=training-overdue" } : null,
    employeeMissingPrivacyNoticeDashboard ? { severity: "hoch", title: "Beschäftigtendatenschutz ohne Datenschutzerklärung", recommendation: "Datenschutzerklärung für Beschäftigte und den Prüfzyklus kurzfristig dokumentieren.", actionLabel: "Zu Beschäftigtendatenschutz", actionHref: "/beschaeftigtendatenschutz?filter=missing-privacy-notice" } : null,
    employeeMissingConfidentialityDashboard ? { severity: "hoch", title: "Beschäftigtendatenschutz ohne Vertraulichkeitsverpflichtung", recommendation: "Verpflichtung auf Vertraulichkeit/Verschwiegenheit für Beschäftigte operativ absichern.", actionLabel: "Zu Beschäftigtendatenschutz", actionHref: "/beschaeftigtendatenschutz?filter=missing-confidentiality" } : null,
    employeeMissingTelecomDashboard ? { severity: "mittel", title: "Beschäftigtendatenschutz ohne Telekommunikationsverpflichtung", recommendation: "Fernmeldegeheimnis- bzw. Telekommunikationsverpflichtung dokumentieren und zuordnen.", actionLabel: "Zu Beschäftigtendatenschutz", actionHref: "/beschaeftigtendatenschutz?filter=missing-telecom" } : null,
    employeeMissingTrainingDashboard ? { severity: "mittel", title: "Beschäftigtendatenschutz ohne dokumentierte Schulung", recommendation: "Schulungspfad, Zielgruppen und Terminierung für Beschäftigte nachziehen.", actionLabel: "Zu Beschäftigtendatenschutz", actionHref: "/beschaeftigtendatenschutz?filter=missing-training" } : null,
    employeeMissingEvidenceDashboard ? { severity: "mittel", title: "Beschäftigtendatenschutz ohne Nachweise", recommendation: "Belastbare Nachweise zu Unterrichtung, Verpflichtung und Schulung ergänzen.", actionLabel: "Zu Beschäftigtendatenschutz", actionHref: "/beschaeftigtendatenschutz?filter=missing-evidence" } : null,
    employeeMissingTargetGroupsDashboard ? { severity: "niedrig", title: "Beschäftigtendatenschutz ohne definierte Zielgruppen", recommendation: "Relevante Beschäftigtengruppen für Unterrichtung und Schulung verbindlich festlegen.", actionLabel: "Zu Beschäftigtendatenschutz", actionHref: "/beschaeftigtendatenschutz?filter=missing-target-groups" } : null,
    webDashboardConsentMissing ? { severity: "hoch", title: "Webseite ohne erforderliches Consent-Tool", recommendation: "Consent-Management kurzfristig nachziehen, wenn zustimmungspflichtige Dienste oder Cookies im Einsatz sind.", actionLabel: "Zu Web-Datenschutz", actionHref: "/web-datenschutz?filter=consent-missing" } : null,
    webDashboardConsentReasonMissing ? { severity: "mittel", title: "Webseite ohne belastbare Consent-Begründung", recommendation: "Begründung für ein entbehrliches Consent-Tool dokumentieren und technisch verifizieren.", actionLabel: "Zu Web-Datenschutz", actionHref: "/web-datenschutz?filter=consent-reason-missing" } : null,
    webDashboardPrivacyNoticeMissing ? { severity: "hoch", title: "Webseite ohne geprüfte Datenschutzerklärung", recommendation: "Datenschutzerklärung inhaltlich und rechtlich kurzfristig nachziehen.", actionLabel: "Zu Web-Datenschutz", actionHref: "/web-datenschutz?filter=privacy-notice-missing" } : null,
    webDashboardImpressumMissing ? { severity: "mittel", title: "Webseite ohne geprüften Impressumsstatus", recommendation: "Impressum rechtlich prüfen und den dokumentierten Prüfstatus ergänzen.", actionLabel: "Zu Web-Datenschutz", actionHref: "/web-datenschutz?filter=impressum-missing" } : null,
    webDashboardNoticeGroupsMissing ? { severity: "mittel", title: "Datenschutzhinweise ohne definierte Personengruppen", recommendation: "Betroffene Gruppen der Datenschutzhinweise fachlich festlegen und dokumentieren.", actionLabel: "Zu Web-Datenschutz", actionHref: "/web-datenschutz?filter=groups-missing" } : null,
    webDashboardNoticeDistributionMissing ? { severity: "mittel", title: "Datenschutzhinweise ohne Bereitstellungsweg", recommendation: "Verbindlichen Ausspielweg für Datenschutzhinweise festlegen und absichern.", actionLabel: "Zu Web-Datenschutz", actionHref: "/web-datenschutz?filter=distribution-missing" } : null,
    webDashboardNotesMissing ? { severity: "niedrig", title: "Web-Datenschutz ohne ergänzende Dokumentationsnotizen", recommendation: "Prüfvermerke, Entscheidungsgründe und Notizen ergänzen, damit der Prüfpfad belastbar bleibt.", actionLabel: "Zu Web-Datenschutz", actionHref: "/web-datenschutz?filter=notes-missing" } : null,
    vvtMitHohemRisikoItems.length > 0 ? { severity: "hoch", title: `${vvtMitHohemRisikoItems.length} VVT mit hoher Risikostufe`, recommendation: "DSFA-Verknüpfung, TOM-Niveau und Maßnahmensteuerung priorisiert nachziehen.", actionLabel: "Zur VVT-Seite", actionHref: "/vvt?filter=high-risk" } : null,
    vvtMitReviewBedarfItems.length > 0 ? { severity: "mittel", title: `${vvtMitReviewBedarfItems.length} VVT mit Reviewbedarf`, recommendation: "Prüf- und Folgeaufgaben für mittlere Risiken, Drittlandtransfers und Governance-Nachsteuerung planen.", actionLabel: "Zur VVT-Seite", actionHref: "/vvt?filter=review-needed" } : null,
  ].filter(Boolean).sort((a: any, b: any) => (dashboardGovernanceSeverityOrder[String(a?.severity || "niedrig")] ?? 99) - (dashboardGovernanceSeverityOrder[String(b?.severity || "niedrig")] ?? 99));
  const deriveGovernanceMeta = (title: string, severity: string) => {
    const normalizedTitle = String(title || "").toLowerCase();
    if (normalizedTitle.includes("kritische offene aufgaben") || normalizedTitle.includes("ohne audit-bezug") || normalizedTitle.includes("art.-36")) return { state: "heute erledigen", priorityClass: "P1", slaHint: "heute", escalation: "sofort", overdue: true };
    if (normalizedTitle.includes("review") || normalizedTitle.includes("restrisiko") || normalizedTitle.includes("audit-to-dos")) return { state: "in Bearbeitung", priorityClass: "P2", slaHint: "48h", escalation: "kurzfristig", overdue: false };
    if (severity === "hoch") return { state: "heute erledigen", priorityClass: "P1", slaHint: "heute", escalation: "sofort", overdue: false };
    if (severity === "mittel") return { state: "in Bearbeitung", priorityClass: "P2", slaHint: "48h", escalation: "kurzfristig", overdue: false };
    return { state: "neu", priorityClass: "P3", slaHint: "diese Woche", escalation: "normal", overdue: false };
  };
  const dashboardTodayFirst = dashboardGovernanceFindings.slice(0, 3).map((item: any) => {
    const meta = deriveGovernanceMeta(item?.title, item?.severity);
    return { ...item, derivedStatus: meta.state, priorityClass: meta.priorityClass, slaHint: meta.slaHint, escalation: meta.escalation, overdue: meta.overdue };
  });
  const deriveGovernanceWorkPackage = (title: string) => {
    const normalizedTitle = String(title || "").toLowerCase();
    if (normalizedTitle.includes("kritische offene aufgaben")) return ["Verantwortliche bestätigen", "Fälligkeit festziehen", "Bearbeitung täglich nachhalten"];
    if (normalizedTitle.includes("ohne audit-bezug")) return ["Audit zuordnen", "Nachweis prüfen", "Exportkette validieren"];
    if (normalizedTitle.includes("art.-36")) return ["Konsultationsbedarf bewerten", "Restrisiko dokumentieren", "Freigabe eskalieren"];
    if (normalizedTitle.includes("review")) return ["Review terminieren", "Wirksamkeit prüfen", "Status aktualisieren"];
    if (normalizedTitle.includes("restrisiko")) return ["Maßnahmen priorisieren", "Restrisiko neu bewerten", "Freigabe dokumentieren"];
    return ["Punkt sichten", "Verantwortung klären", "nächsten Termin setzen"];
  };
  const deriveGovernanceTaskSuggestions = (title: string) => deriveGovernanceWorkPackage(title).map((step, idx) => `Vorschlag ${idx + 1}: ${step}`);
  const dashboardTodayProgress = {
    neu: dashboardTodayFirst.filter((item: any) => item.derivedStatus === "neu").length,
    inBearbeitung: dashboardTodayFirst.filter((item: any) => item.derivedStatus === "in Bearbeitung").length,
    heuteErledigen: dashboardTodayFirst.filter((item: any) => item.derivedStatus === "heute erledigen").length,
  };
  const kritischeOderNotwendigeAufgaben = aufgaben.filter((t: any) => ["hoch", "kritisch"].includes(String(t.prioritaet || "")) && t.status !== "erledigt").length;
  const tomUmfangreich = (stats?.tom ?? 0) >= 8;
  const auditsVorhanden = (stats?.audits ?? 0) > 0;
  const avvVorhanden = (stats?.avv ?? 0) > 0;
  const dashboardAuditCount = stats?.audits ?? 0;
  const dashboardAuditTodoCount = 0;
  const maturityCriteria = [
    { label: "Leitlinienbasis", weight: 6, score: leitlinienScore >= 1.0 ? 6 : leitlinienScore >= 0.5 ? 3 : 0 },
    { label: "Prozessdokumentation", weight: 5, score: prozessScore >= 2.34 ? 5 : prozessScore >= 1.95 ? 4 : prozessScore >= 1.0 ? 2 : prozessScore >= 0.5 ? 1 : 0 },
    { label: "Verzeichnis von Verarbeitungstätigkeiten", weight: 6, score: (stats?.vvt ?? 0) >= 3 ? 6 : (stats?.vvt ?? 0) > 0 ? 3 : 0 },
    { label: "DSFA-Struktur", weight: 8, score: dsfaMitDsbCheck && dsfaOhneVvt === 0 ? 8 : dsfa.length > 0 ? 4 : 0 },
    { label: "DSFA-Risikosteuerung", weight: 10, score: dsfaMitArt36 === 0 && dsfaMitHohemRestrisiko === 0 && dsfaReviewFaellig === 0 ? 10 : dsfaMitArt36 + dsfaMitHohemRestrisiko + dsfaReviewFaellig <= 2 ? 5 : 0 },
    { label: "Löschkonzept-Verknüpfung", weight: 6, score: vvtOhneLoeschkonzept === 0 ? 6 : vvtOhneLoeschkonzept <= 2 ? 3 : 0 },
    { label: "Audit-Struktur", weight: 12, score: dashboardAuditCount > 0 ? (auditFollowUpsOhneAuditDashboard.length === 0 && dashboardAuditTodoCount <= 2 ? 12 : dashboardAuditTodoCount <= 5 ? 6 : 2) : 0 },
    { label: "PDCA-Wirksamkeit", weight: 14, score: pdca.length > 0 ? (pdcaReviewFaelligItems.length === 0 && pdcaFollowUpTasksOffenDashboard.length <= 2 ? 14 : pdcaReviewFaelligItems.length <= 2 && pdcaFollowUpTasksOffenDashboard.length <= 5 ? 7 : 2) : 0 },
    { label: "TOM-Abdeckung", weight: 5, score: tomScore >= 6.24 ? 5 : tomScore >= 5.2 ? 4 : tomScore >= 3.0 ? 2 : tomScore >= 1.0 ? 1 : 0 },
    { label: "AVV-Abdeckung", weight: 4, score: avvVorhanden ? 4 : 0 },
    { label: "Operative Aufgabensteuerung", weight: 8, score: kritischeAufgaben.length === 0 && kritischeOderNotwendigeAufgaben === 0 ? 8 : kritischeAufgaben.length <= 2 ? 4 : 0 },
    { label: "Web-/Hinweisprüfungen", weight: 4, score: !!webDatenschutzCheck && !!datenschutzhinweiseCheck ? 4 : (!!webDatenschutzCheck || !!datenschutzhinweiseCheck) ? 2 : 0 },
    { label: "Beschäftigtendatenschutz", weight: 4, score: !!beschaeftigtenDok ? 4 : 0 },
    { label: "Dokumentenreife", weight: 3, score: dokumenteCount >= 6 ? 3 : dokumenteCount >= 3 ? 1 : 0 },
    { label: "Verantwortungsstruktur", weight: 5, score: activeMandant?.verantwortlicherName ? 5 : 0 },
  ];
  const maturityWeightTotal = maturityCriteria.reduce((sum, item) => sum + item.weight, 0);
  const maturityScoreRaw = maturityCriteria.reduce((sum, item) => sum + item.score, 0);
  const reifegradScore = Math.round((maturityScoreRaw / maturityWeightTotal) * 100);
  const reifegradAmpel = reifegradScore >= 95 ? "Grün" : reifegradScore >= 80 ? "Gelb" : "Rot";
  const deriveMaturityRecommendation = (label: string) => {
    const normalized = String(label || "").toLowerCase();
    if (normalized.includes("audit")) return "Audits nachziehen, offene Audit-Punkte terminieren und Verknüpfungen bereinigen.";
    if (normalized.includes("pdca")) return "Fällige Reviews durchführen und offene PDCA-Folgeaufgaben verbindlich abschließen.";
    if (normalized.includes("dsfa-risikosteuerung")) return "Art.-36-, Restrisiko- und Review-Fälle priorisiert juristisch und operativ schließen.";
    if (normalized.includes("dsfa-struktur")) return "DSFA-VVT-Bezüge und Governance-Rollen in den DSFA-Datensätzen vervollständigen.";
    if (normalized.includes("löschkonzept")) return "Fehlende VVT-Löschkonzept-Verknüpfungen ergänzen und dokumentieren.";
    if (normalized.includes("aufgabensteuerung")) return "Kritische und hohe Aufgaben priorisieren, Verantwortliche bestätigen und Fälligkeiten nachziehen.";
    if (normalized.includes("leitlinien")) return "Fehlende Leitlinien freigeben oder bestehende Leitlinien fachlich vervollständigen.";
    if (normalized.includes("prozessdokumentation")) return "Wesentliche Datenschutzprozesse dokumentieren und in den operativen Ablauf überführen.";
    if (normalized.includes("verzeichnis")) return "VVT fachlich vervollständigen und relevante Verarbeitungstätigkeiten nachpflegen.";
    if (normalized.includes("tom")) return "Technische und organisatorische Maßnahmen strukturiert ergänzen und reviewen.";
    if (normalized.includes("avv")) return "Fehlende AVV-Verträge bzw. Prüfdokumentationen ergänzen.";
    if (normalized.includes("web-/hinweis")) return "Webdatenschutz- und Datenschutzhinweis-Prüfungen aktualisieren und dokumentieren.";
    if (normalized.includes("beschäftigtendatenschutz")) return "Beschäftigtendatenschutz-Check dokumentieren und organisatorisch verankern.";
    if (normalized.includes("dokumentenreife")) return "Zentrale Nachweisdokumente ergänzen und auf aktuellen Stand bringen.";
    if (normalized.includes("verantwortungsstruktur")) return "Verantwortliche Rolle verbindlich benennen und Kontaktdaten vervollständigen.";
    return "Kriterium fachlich prüfen und gezielte Nachbesserungsmaßnahme festlegen.";
  };
  const deriveMaturityAction = (label: string) => {
    const normalized = String(label || "").toLowerCase();
    if (normalized.includes("audit")) return { href: "/audits", label: "Zu Audits" };
    if (normalized.includes("pdca")) return { href: "/pdca?filter=review", label: "Zu PDCA" };
    if (normalized.includes("dsfa")) return { href: "/dsfa", label: "Zu DSFA" };
    if (normalized.includes("löschkonzept")) return { href: "/loeschkonzept", label: "Zum Löschkonzept" };
    if (normalized.includes("aufgabensteuerung")) return { href: "/aufgaben?filter=kritisch", label: "Zu den Aufgaben" };
    if (normalized.includes("leitlinien") || normalized.includes("prozessdokumentation") || normalized.includes("beschäftigtendatenschutz") || normalized.includes("dokumentenreife") || normalized.includes("web-/hinweis")) return { href: "/dokumente", label: "Zu Dokumenten" };
    if (normalized.includes("verzeichnis")) return { href: "/vvt", label: "Zu VVT" };
    if (normalized.includes("tom")) return { href: "/tom", label: "Zu TOM" };
    if (normalized.includes("avv")) return { href: "/avv", label: "Zu AVV" };
    if (normalized.includes("verantwortungsstruktur")) return { href: "/mandanten-uebersicht", label: "Zur Mandantenübersicht" };
    return { href: "/dashboard", label: "Zum Dashboard" };
  };
  const deriveMaturityTaskDraft = (label: string) => {
    const normalized = String(label || "").toLowerCase();
    if (normalized.includes("audit")) return { priority: "hoch", title: "Audit-Struktur bereinigen", draft: "Offene Audit-Punkte terminieren, Nachweise prüfen und fehlende Audit-Verknüpfungen ergänzen." };
    if (normalized.includes("pdca")) return { priority: "hoch", title: "PDCA-Reviews und Folgeaufgaben abschließen", draft: "Fällige PDCA-Reviews durchführen und offene Folgeaufgaben mit Termin und Verantwortung schließen." };
    if (normalized.includes("dsfa-risikosteuerung")) return { priority: "hoch", title: "DSFA-Risikosteuerung nachziehen", draft: "Art.-36-, Restrisiko- und Review-Fälle priorisieren und fachlich abschließen." };
    if (normalized.includes("dsfa-struktur")) return { priority: "mittel", title: "DSFA-Struktur vervollständigen", draft: "Fehlende VVT-Bezüge und Governance-Rollen in den DSFA-Datensätzen ergänzen." };
    if (normalized.includes("löschkonzept")) return { priority: "mittel", title: "Löschkonzept-Verknüpfungen ergänzen", draft: "Fehlende Verknüpfungen zwischen VVT und Löschkonzept fachlich nachpflegen." };
    if (normalized.includes("aufgabensteuerung")) return { priority: "hoch", title: "Kritische Aufgaben priorisiert nachsteuern", draft: "Kritische und hohe offene Aufgaben bündeln, priorisieren und verbindlich terminieren." };
    if (normalized.includes("leitlinien")) return { priority: "mittel", title: "Leitlinienbasis vervollständigen", draft: "Fehlende Leitlinien erstellen oder bestehende Leitlinien zur Freigabe bringen." };
    if (normalized.includes("prozessdokumentation")) return { priority: "mittel", title: "Prozessdokumentation ausbauen", draft: "Wesentliche Datenschutzprozesse dokumentieren und in der Organisation verankern." };
    if (normalized.includes("verzeichnis")) return { priority: "mittel", title: "VVT vervollständigen", draft: "Fehlende oder unvollständige Verarbeitungstätigkeiten im Verzeichnis ergänzen." };
    if (normalized.includes("tom")) return { priority: "mittel", title: "TOM-Katalog erweitern", draft: "Technische und organisatorische Maßnahmen strukturiert ergänzen und reviewen." };
    if (normalized.includes("avv")) return { priority: "mittel", title: "AVV-Nachweise ergänzen", draft: "Fehlende AVV-Verträge oder Prüfdokumentationen vervollständigen." };
    if (normalized.includes("web-/hinweis")) return { priority: "mittel", title: "Web-Datenschutzprüfung aktualisieren", draft: "Webdatenschutz- und Datenschutzhinweis-Prüfungen aktualisieren und dokumentieren." };
    if (normalized.includes("beschäftigtendatenschutz")) return { priority: "mittel", title: "Beschäftigtendatenschutz dokumentieren", draft: "Beschäftigtendatenschutz-Check erfassen und organisatorisch absichern." };
    if (normalized.includes("dokumentenreife")) return { priority: "niedrig", title: "Nachweisdokumente ergänzen", draft: "Zentrale Datenschutzdokumente ergänzen und auf Aktualität prüfen." };
    if (normalized.includes("verantwortungsstruktur")) return { priority: "hoch", title: "Verantwortungsstruktur festziehen", draft: "Verantwortliche Rolle benennen und Kontaktdaten vollständig pflegen." };
    return { priority: "mittel", title: "Reifegradlücke nacharbeiten", draft: "Kriterium fachlich prüfen und gezielte Nachbesserungsmaßnahme als Aufgabe vorbereiten." };
  };
  const deriveMaturityTaskAction = (label: string) => {
    const task = deriveMaturityTaskDraft(label);
    const action = deriveMaturityAction(label);
    const params = new URLSearchParams({
      draftTitle: task.title,
      draftPriority: task.priority,
      draftDescription: task.draft,
      draftSource: label,
    });
    return { href: `/aufgaben?${params.toString()}`, label: "Aufgabe vorbereiten", fallbackHref: action.href };
  };
  const weakestMaturityCriteria = [...maturityCriteria]
    .map((item) => ({ ...item, percent: item.weight ? Math.round((item.score / item.weight) * 100) : 0, recommendation: deriveMaturityRecommendation(item.label), action: deriveMaturityAction(item.label), taskDraft: deriveMaturityTaskDraft(item.label), taskAction: deriveMaturityTaskAction(item.label) }))
    .sort((a, b) => a.percent - b.percent || b.weight - a.weight || String(a.label || "").localeCompare(String(b.label || ""), "de"))
    .slice(0, 3);
  const complianceKpis = {
    offeneAufgaben: stats?.offeneAufgaben ?? 0,
    leitlinien: leitlinieVorhanden ? 1 : 0,
    reviews: offeneReviews.length,
    kritische: kritischeAufgaben.length,
  };

  const statCards = [
    { label: "VVT-Einträge", value: stats?.vvt ?? 0, icon: FileText, path: "/vvt", color: "text-teal-400" },
    { label: "AVV-Verträge", value: stats?.avv ?? 0, icon: Shield, path: "/avv", color: "text-blue-400" },
    { label: "DSFAs", value: stats?.dsfa ?? 0, icon: AlertTriangle, path: "/dsfa", color: "text-yellow-400" },
    { label: "Datenpannen", value: stats?.datenpannen ?? 0, icon: AlertCircle, path: "/datenpannen", color: "text-red-400" },
    { label: "DSR-Anfragen", value: stats?.dsr ?? 0, icon: UserCheck, path: "/dsr", color: "text-purple-400" },
    { label: "TOM-Maßnahmen", value: stats?.tom ?? 0, icon: Lock, path: "/tom", color: "text-emerald-400" },
    { label: "Interne Audits", value: stats?.audits ?? 0, icon: ClipboardList, path: "/audits", color: "text-cyan-400" },
    { label: "PDCA-Zyklen", value: stats?.pdca ?? 0, icon: RefreshCcw, path: "/pdca", color: "text-sky-400" },
    { label: "Offene Aufgaben", value: stats?.offeneAufgaben ?? 0, icon: CheckSquare, path: "/aufgaben", color: "text-orange-400" },
    { label: "Dokumente", value: stats?.dokumente ?? 0, icon: FolderOpen, path: "/dokumente", color: "text-indigo-400" },
  ];

  return (
    <div>
      <PageHeader
        title={activeMandant ? `${t("dashboard")} – ${activeMandant.name}` : t("dashboard")}
        desc={t("dashboardDesc")}
      />
      {!activeMandantId ? (
        <Card className="border-dashed border-border/60">
          <CardContent className="py-16 text-center">
            <Building2 className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground text-sm">Wähle einen Mandanten aus der Seitenleiste</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
            {statCards.map(({ label, value, icon: Icon, path, color }) => (
              <Link key={path} href={path}>
                <a>
                  <Card className="hover:border-border cursor-pointer transition-all hover:shadow-md group">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <Icon className={`h-5 w-5 ${color}`} />
                        <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/0 group-hover:text-muted-foreground/50 transition-all" />
                      </div>
                      {isLoading ? <Skeleton className="h-7 w-12 mb-1" /> : (
                        <p className="text-2xl font-bold">{value}</p>
                      )}
                      <p className="text-xs text-muted-foreground">{label}</p>
                    </CardContent>
                  </Card>
                </a>
              </Link>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Leitlinien- und Governance-Status</CardTitle>
                <CardDescription>Grundsatzdokumente für Datenschutz und Informationssicherheit</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p>Datenschutz- und Informationssicherheitsleitlinie vorhanden: <span className="font-medium">{leitlinieVorhanden ? "Ja" : "Nein"}</span></p>
                {leitlinieVorhanden ? (
                  leitlinien.map((d: any) => <p key={d.id} className="text-muted-foreground">{d.titel} · {d.status}</p>)
                ) : (
                  <p className="text-muted-foreground">Noch keine Leitlinie vorhanden.</p>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Richtlinienstatus</CardTitle>
                <CardDescription>Vorhandene Richtlinien des aktiven Mandanten</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p>Richtlinien vorhanden: <span className="font-medium">{richtlinien.length > 0 ? "Ja" : "Nein"}</span></p>
                {richtlinien.length === 0 ? <p className="text-muted-foreground">Noch keine Richtlinien vorhanden.</p> : richtlinien.map((d: any) => <p key={d.id} className="text-muted-foreground">{d.titel} · {d.status}</p>)}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">PDCA / Verbesserungszyklus</CardTitle>
                <CardDescription>Kontinuierliche Verbesserung, Reviewzyklen und Nachsteuerung</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p>Dokumentierte PDCA-Zyklen: <span className="font-medium">{pdca.length}</span></p>
                <p>Offen / laufend: <span className="font-medium">{pdcaOffenItems.length}</span></p>
                <p>Review fällig: <span className="font-medium">{pdcaReviewFaelligItems.length}</span></p>
                <p>Audit-Follow-ups ohne Audit-Bezug: <span className="font-medium">{auditFollowUpsOhneAuditDashboard.length}</span></p>
                <p>Offene PDCA-Folgeaufgaben: <span className="font-medium">{pdcaFollowUpTasksOffenDashboard.length}</span></p>
                {pdca.length > 0 ? (
                  pdca.slice(0, 3).map((item: any) => <p key={item.id} className="text-muted-foreground">{item.titel} · {item.status}{item.naechstePruefungAm ? ` · Prüfung ${item.naechstePruefungAm}` : ""}</p>)
                ) : (
                  <p className="text-muted-foreground">Noch keine PDCA-Zyklen dokumentiert.</p>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">KI-Status</CardTitle>
                <CardDescription>Einsatz von KI-Tools und Konformitätsstatus</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                {kiComplianceCheck ? (
                  <>
                    <p>KI-Prüfung erfasst: <span className="font-medium">Ja</span></p>
                    <p className="text-muted-foreground">{kiComplianceCheck.titel} · {kiComplianceCheck.status}</p>
                    {copilotStatusVorhanden && (
                      <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 mt-3 space-y-1">
                        <p>Copilot-Paket erkannt: <span className="font-medium">Ja</span></p>
                        <p className="text-muted-foreground">VVT: {copilotVvtItems.length} · AVV: {copilotAvvItems.length} · DSFA: {copilotDsfaItems.length} · TOM: {copilotTomItems.length}</p>
                        <p className="text-muted-foreground">Offene Copilot-Aufgaben: {copilotTasksOpenItems.length}</p>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <p>KI-Prüfung erfasst: <span className="font-medium">Nein</span></p>
                    <p className="text-muted-foreground">Noch keine KI-Compliance-Prüfung vorhanden.</p>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Hinweise & Risiken</CardTitle>
              <CardDescription>Schnelle Einschätzung des aktuellen Handlungsbedarfs</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {kritischeAufgaben.length === 0 && leitlinieVorhanden && offeneReviews.length === 0 && webDatenschutzCheck && datenschutzhinweiseCheck && kiComplianceCheck && dsfaOhneVvt === 0 && dsfaMitArt36 === 0 && dsfaReviewFaellig === 0 && dsfaMitHohemRestrisiko === 0 && copilotDsfaOhneReviewItems.length === 0 && copilotAvvOhnePruefungItems.length === 0 && copilotVvtOhneDsfaItems.length === 0 && (
                <p className="text-muted-foreground">Aktuell keine auffälligen Warnhinweise.</p>
              )}
              {kritischeAufgaben.length > 0 && <p className="text-red-400">Kritische offene Aufgaben: {kritischeAufgaben.length}</p>}
              {offeneReviews.length > 0 && <p className="text-yellow-400">Offene Reviews: {offeneReviews.length}</p>}
              {pdcaReviewFaelligItems.length > 0 && <p className="text-yellow-400">PDCA-Reviews fällig oder überfällig: {pdcaReviewFaelligItems.length}</p>}
              {auditFollowUpsOhneAuditDashboard.length > 0 && <p className="text-orange-400">Audit-Follow-ups ohne Audit-Bezug: {auditFollowUpsOhneAuditDashboard.length}</p>}
              {pdcaFollowUpTasksOffenDashboard.length > 0 && <p className="text-orange-400">Offene PDCA-Folgeaufgaben: {pdcaFollowUpTasksOffenDashboard.length}</p>}
              {pdcaFollowUpTasksUeberfaelligDashboard.length > 0 && <p className="text-red-400">Überfällige PDCA-Folgeaufgaben: {pdcaFollowUpTasksUeberfaelligDashboard.length}</p>}
              {pdcaKritischOderHochOffenDashboard.length > 0 && <p className="text-red-400">Offene PDCA-Zyklen mit hoher Priorität: {pdcaKritischOderHochOffenDashboard.length}</p>}
              {pdcaOhneNaechstePruefungDashboard.length > 0 && <p className="text-yellow-400">Offene PDCA-Zyklen ohne Prüftermin: {pdcaOhneNaechstePruefungDashboard.length}</p>}
              {pdcaInBearbeitungOhneOffeneFolgeaufgabeDashboard.length > 0 && <p className="text-yellow-400">Laufende PDCA-Zyklen ohne Folgeaufgabe: {pdcaInBearbeitungOhneOffeneFolgeaufgabeDashboard.length}</p>}
              {kritischeAufgabenOhneTerminDashboard.length > 0 && <p className="text-red-400">Kritische Aufgaben ohne Fälligkeit: {kritischeAufgabenOhneTerminDashboard.length}</p>}
              {!leitlinieVorhanden && <p className="text-orange-400">Leitliniendokument für Datenschutz und Informationssicherheit fehlt.</p>}
              {!webDatenschutzCheck && <p className="text-orange-400">Prüfung der Webseiten-Datenschutzerklärung und des Impressums fehlt.</p>}
              {!datenschutzhinweiseCheck && <p className="text-orange-400">Prüfung der Datenschutzhinweise für Personengruppen fehlt.</p>}
              {!kiComplianceCheck && <p className="text-orange-400">Prüfung zum Einsatz von KI-Tools und KI-VO-Konformität fehlt.</p>}
              {copilotStatusVorhanden && copilotDsfaItems.length === 0 && <p className="text-red-400">Copilot-Bezug erkannt, aber keine eigene DSFA dokumentiert.</p>}
              {copilotDsfaOhneReviewItems.length > 0 && <p className="text-yellow-400">Copilot-DSFA ohne Reviewdatum: {copilotDsfaOhneReviewItems.length}</p>}
              {copilotAvvOhnePruefungItems.length > 0 && <p className="text-yellow-400">Copilot-/Microsoft-AVV ohne Prüffälligkeit: {copilotAvvOhnePruefungItems.length}</p>}
              {copilotVvtOhneDsfaItems.length > 0 && <p className="text-yellow-400">Copilot-VVT ohne gesetzte DSFA-Pflicht: {copilotVvtOhneDsfaItems.length}</p>}
              {copilotTasksOpenItems.length > 0 && <p className="text-orange-400">Offene Copilot-Aufgaben: {copilotTasksOpenItems.length}</p>}
              {dsfaOhneVvt > 0 && <p className="text-yellow-400">DSFA ohne VVT-Bezug: {dsfaOhneVvt}</p>}
              {dsfaMitArt36 > 0 && <p className="text-red-400">DSFA mit Art.-36-Prüfbedarf: {dsfaMitArt36}</p>}
              {dsfaReviewFaellig > 0 && <p className="text-yellow-400">Überfällige DSFA-Reviews: {dsfaReviewFaellig}</p>}
              {dsfaMitHohemRestrisiko > 0 && <p className="text-red-400">DSFA mit hohem Restrisiko: {dsfaMitHohemRestrisiko}</p>}
              {incidentDeadlineMissedItems.length > 0 && <p className="text-red-400">Datenpannen mit überschrittener 72h-Frist: {incidentDeadlineMissedItems.length}</p>}
              {incidentDeadlineSoonItems.length > 0 && <p className="text-red-400">Datenpannen innerhalb der 72h-Frist: {incidentDeadlineSoonItems.length}</p>}
              {incidentReportableOpenItems.length > 0 && <p className="text-yellow-400">Meldepflichtige Datenpannen ohne Abschluss: {incidentReportableOpenItems.length}</p>}
              {incidentNotifyArt34Items.length > 0 && <p className="text-yellow-400">Datenpannen mit Art.-34-Prüfbedarf: {incidentNotifyArt34Items.length}</p>}
              {dsrDeadlineMissedDashboardItems.length > 0 && <p className="text-red-400">DSR-Fristen überschritten: {dsrDeadlineMissedDashboardItems.length}</p>}
              {dsrDeadlineSoonDashboardItems.length > 0 && <p className="text-yellow-400">DSR-Fristen innerhalb von 7 Tagen: {dsrDeadlineSoonDashboardItems.length}</p>}
              {dsrMissingDeadlineDashboardItems.length > 0 && <p className="text-yellow-400">DSR ohne dokumentierte Frist: {dsrMissingDeadlineDashboardItems.length}</p>}
              {dsrVerificationDashboardItems.length > 0 && <p className="text-yellow-400">DSR im Prüf-/Identifikationsstatus: {dsrVerificationDashboardItems.length}</p>}
              {avvReviewOverdueDashboardItems.length > 0 && <p className="text-red-400">AVV-Reviews überfällig: {avvReviewOverdueDashboardItems.length}</p>}
              {avvSccMissingDashboardItems.length > 0 && <p className="text-red-400">AVV mit offenem SCC-/Transferprüfbedarf: {avvSccMissingDashboardItems.length}</p>}
              {copilotAvvOhnePruefungItems.length > 0 && <p className="text-yellow-400">Copilot-/Microsoft-AVV ohne Prüffälligkeit: {copilotAvvOhnePruefungItems.length}</p>}
              {avvReviewMissingDashboardItems.length > 0 && <p className="text-yellow-400">AVV ohne Reviewtermin: {avvReviewMissingDashboardItems.length}</p>}
              {tomReviewOverdueDashboardItems.length > 0 && <p className="text-red-400">TOM-Reviews überfällig: {tomReviewOverdueDashboardItems.length}</p>}
              {tomPlannedDashboardItems.length > 0 && <p className="text-red-400">Geplante TOM ohne Abschluss: {tomPlannedDashboardItems.length}</p>}
              {tomReviewMissingDashboardItems.length > 0 && <p className="text-yellow-400">TOM ohne Prüftermin: {tomReviewMissingDashboardItems.length}</p>}
              {tomWeakEffectivenessDashboardItems.length > 0 && <p className="text-yellow-400">TOM mit schwacher oder offener Wirksamkeit: {tomWeakEffectivenessDashboardItems.length}</p>}
              {tomMissingOwnerDashboardItems.length > 0 && <p className="text-yellow-400">TOM ohne Verantwortlichkeit: {tomMissingOwnerDashboardItems.length}</p>}
              {retentionLk5ControlDashboardItems.length > 0 && <p className="text-red-400">Löschkonzept mit LK5-Kontrollbedarf: {retentionLk5ControlDashboardItems.length}</p>}
              {retentionMissingTriggerDashboardItems.length > 0 && <p className="text-yellow-400">Löschkonzept ohne Löschereignis: {retentionMissingTriggerDashboardItems.length}</p>}
              {retentionMissingOwnerDashboardItems.length > 0 && <p className="text-yellow-400">Löschkonzept ohne Löschverantwortung: {retentionMissingOwnerDashboardItems.length}</p>}
              {retentionMissingProofDashboardItems.length > 0 && <p className="text-yellow-400">Löschkonzept ohne Nachweis/Kontrolle: {retentionMissingProofDashboardItems.length}</p>}
              {retentionFreePeriodDashboardItems.length > 0 && <p className="text-yellow-400">Löschkonzept mit freier Fristkategorie: {retentionFreePeriodDashboardItems.length}</p>}
              {aiMissingPolicyDashboard && <p className="text-red-400">KI-Einsatz ohne KI-Richtlinie</p>}
              {aiMissingAiActDashboard && <p className="text-red-400">KI-Einsatz ohne KI-VO-Prüfung</p>}
              {aiDsfaGapDashboard && <p className="text-red-400">KI-Einsatz mit offener DSFA-Lücke</p>}
              {aiIncompleteChecklistDashboard && <p className="text-yellow-400">KI-Einsatz mit unvollständiger DSGVO-Checkliste</p>}
              {aiToolInventoryGapDashboard && <p className="text-yellow-400">KI-Einsatz ohne dokumentiertes Toolinventar</p>}
              {auditMissingFollowUpDashboardItems.length > 0 && <p className="text-red-400">Audits ohne PDCA-Follow-up: {auditMissingFollowUpDashboardItems.length}</p>}
              {auditCriticalOpenDashboardItems.length > 0 && <p className="text-red-400">Offene Audits mit hohem/kritischem Ergebnis: {auditCriticalOpenDashboardItems.length}</p>}
              {auditOverdueNextAuditDashboardItems.length > 0 && <p className="text-yellow-400">Audits mit überfälligem nächstem Termin: {auditOverdueNextAuditDashboardItems.length}</p>}
              {auditMissingOwnerDashboardItems.length > 0 && <p className="text-yellow-400">Audits ohne klare Verantwortlichkeit: {auditMissingOwnerDashboardItems.length}</p>}
              {auditInProgressNoTaskDashboardItems.length > 0 && <p className="text-yellow-400">Audit-Follow-ups ohne offene Folgeaufgabe: {auditInProgressNoTaskDashboardItems.length}</p>}
              {employeeTrainingOverdueDashboard && <p className="text-red-400">Beschäftigtenschulung überfällig</p>}
              {employeeMissingPrivacyNoticeDashboard && <p className="text-red-400">Beschäftigtendatenschutz ohne Datenschutzerklärung</p>}
              {employeeMissingConfidentialityDashboard && <p className="text-red-400">Beschäftigtendatenschutz ohne Vertraulichkeitsverpflichtung</p>}
              {employeeMissingTelecomDashboard && <p className="text-yellow-400">Beschäftigtendatenschutz ohne Telekommunikationsverpflichtung</p>}
              {employeeMissingTrainingDashboard && <p className="text-yellow-400">Beschäftigtendatenschutz ohne dokumentierte Schulung</p>}
              {employeeMissingEvidenceDashboard && <p className="text-yellow-400">Beschäftigtendatenschutz ohne Nachweise</p>}
              {employeeMissingTargetGroupsDashboard && <p className="text-yellow-400">Beschäftigtendatenschutz ohne definierte Zielgruppen</p>}
              {webDashboardConsentMissing && <p className="text-red-400">Webseite ohne erforderliches Consent-Tool</p>}
              {webDashboardConsentReasonMissing && <p className="text-yellow-400">Webseite ohne belastbare Consent-Begründung</p>}
              {webDashboardPrivacyNoticeMissing && <p className="text-red-400">Webseite ohne geprüfte Datenschutzerklärung</p>}
              {webDashboardImpressumMissing && <p className="text-yellow-400">Webseite ohne geprüften Impressumsstatus</p>}
              {webDashboardNoticeGroupsMissing && <p className="text-yellow-400">Datenschutzhinweise ohne definierte Personengruppen</p>}
              {webDashboardNoticeDistributionMissing && <p className="text-yellow-400">Datenschutzhinweise ohne Bereitstellungsweg</p>}
              {webDashboardNotesMissing && <p className="text-yellow-400">Web-Datenschutz ohne ergänzende Dokumentationsnotizen</p>}
            </CardContent>
          </Card>

          {dashboardGovernanceFindings.length > 0 && (
            <>
              <Card className="border-red-500/30 bg-red-500/5">
                <CardHeader>
                  <CardTitle className="text-sm">Heute zuerst</CardTitle>
                  <CardDescription>Die drei wichtigsten Governance-Punkte für die unmittelbare Bearbeitung.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                    <div className="rounded-lg border border-border/60 bg-background/60 p-3"><p className="text-xs text-muted-foreground">Neu</p><p className="text-lg font-semibold">{dashboardTodayProgress.neu}</p></div>
                    <div className="rounded-lg border border-border/60 bg-background/60 p-3"><p className="text-xs text-muted-foreground">In Bearbeitung</p><p className="text-lg font-semibold">{dashboardTodayProgress.inBearbeitung}</p></div>
                    <div className="rounded-lg border border-border/60 bg-background/60 p-3"><p className="text-xs text-muted-foreground">Heute erledigen</p><p className="text-lg font-semibold">{dashboardTodayProgress.heuteErledigen}</p></div>
                  </div>
                  {dashboardTodayFirst.map((item: any, idx: number) => (
                    <div key={`today-${item.title}-${idx}`} className="rounded-lg border border-border/60 bg-background/60 p-3">
                      <div className="flex items-center justify-between gap-3 mb-1">
                        <p className="font-medium">{idx + 1}. {item.title}</p>
                        <span className={`text-[11px] px-2 py-0.5 rounded-full ${item.severity === "hoch" ? "bg-red-500/15 text-red-300" : item.severity === "mittel" ? "bg-amber-500/15 text-amber-300" : "bg-slate-500/15 text-slate-300"}`}>{item.severity}</span>
                      </div>
                      <p className="text-muted-foreground">Nächster Schritt: {item.recommendation}</p>
                      <p className="text-xs text-muted-foreground mt-1">Status: {item.derivedStatus} · {item.priorityClass} · SLA: {item.slaHint}{item.overdue ? " · Frist überschritten" : ""} · Eskalation: {item.escalation}</p>
                      <p className="text-xs text-muted-foreground mt-1">Maßnahmenpaket: {deriveGovernanceWorkPackage(item.title).join(" · ")}</p>
                      <p className="text-xs text-muted-foreground mt-1">Aufgaben-Vorschläge: {deriveGovernanceTaskSuggestions(item.title).join(" · ")}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
              <Card className="border-amber-500/30 bg-amber-500/5">
                <CardHeader>
                  <CardTitle className="text-sm">Priorisierte Governance-Hinweise</CardTitle>
                  <CardDescription>Die wichtigsten Steuerungspunkte mit empfohlener nächster Maßnahme.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  {dashboardGovernanceFindings.map((item: any, idx: number) => (
                    <div key={`${item.title}-${idx}`} className="rounded-lg border border-border/60 bg-background/60 p-3">
                      <div className="flex items-center justify-between gap-3 mb-1">
                        <p className="font-medium">{item.title}</p>
                        <span className={`text-[11px] px-2 py-0.5 rounded-full ${item.severity === "hoch" ? "bg-red-500/15 text-red-300" : item.severity === "mittel" ? "bg-amber-500/15 text-amber-300" : "bg-slate-500/15 text-slate-300"}`}>{item.severity}</span>
                      </div>
                      <p className="text-muted-foreground">Empfehlung: {item.recommendation}</p>
                      {item.actionHref && (
                        <div className="mt-2">
                          <button
                            type="button"
                            onClick={() => setLocation(item.actionHref)}
                            className="text-xs text-primary hover:underline"
                          >
                            {item.actionLabel || "Zum Modul"}
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            </>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">DSFA-Fokusliste</CardTitle>
              <CardDescription>Konkrete Fälle mit priorisiertem Handlungsbedarf</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {dsfaOhneVvt === 0 && dsfaMitArt36 === 0 && dsfaReviewFaellig === 0 && dsfaMitHohemRestrisiko === 0 ? (
                <p className="text-muted-foreground">Aktuell keine priorisierten DSFA-Fälle.</p>
              ) : (
                <>
                  {dsfaArt36Items.slice(0, 3).map((item: any) => (
                    <div key={`art36-${item.id}`} className="rounded-lg border border-red-500/20 bg-red-500/5 p-3">
                      <p className="font-medium text-red-700 dark:text-red-400">Art.-36-Prüfbedarf: {item.titel}</p>
                      <p className="text-xs text-muted-foreground">Empfehlung: Restrisiko und Konsultationsentscheidung zeitnah prüfen.</p>
                      <div className="mt-2"><Link href="/dsfa?filter=art36"><a className="text-xs text-primary hover:underline">Zur DSFA-Seite</a></Link></div>
                    </div>
                  ))}
                  {dsfaMitHohemRestrisikoItems.slice(0, 3).map((item: any) => (
                    <div key={`risk-${item.id}`} className="rounded-lg border border-red-500/20 bg-red-500/5 p-3">
                      <p className="font-medium text-red-700 dark:text-red-400">Hohes Restrisiko: {item.titel}</p>
                      <p className="text-xs text-muted-foreground">Empfehlung: zusätzliche Maßnahmen und Freigabeentscheidung priorisieren.</p>
                      <div className="mt-2"><Link href="/dsfa?filter=high-risk"><a className="text-xs text-primary hover:underline">Zur DSFA-Seite</a></Link></div>
                    </div>
                  ))}
                  {dsfaReviewFaelligItems.slice(0, 3).map((item: any) => (
                    <div key={`review-${item.id}`} className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3">
                      <p className="font-medium text-amber-700 dark:text-amber-400">Review fällig: {item.titel}</p>
                      <p className="text-xs text-muted-foreground">Nächste Prüfung war am {new Date(item.naechstePruefungAm).toLocaleDateString("de-DE")} vorgesehen.</p>
                      <div className="mt-2"><Link href="/dsfa?filter=review"><a className="text-xs text-primary hover:underline">Zur DSFA-Seite</a></Link></div>
                    </div>
                  ))}
                  {dsfaOhneVvtItems.slice(0, 3).map((item: any) => (
                    <div key={`novvt-${item.id}`} className="rounded-lg border border-yellow-500/20 bg-yellow-500/5 p-3">
                      <p className="font-medium text-yellow-700 dark:text-yellow-400">Ohne VVT-Bezug: {item.titel}</p>
                      <p className="text-xs text-muted-foreground">Empfehlung: DSFA mit passendem Verarbeitungsvorgang verknüpfen.</p>
                      <div className="mt-2 flex gap-2"><Link href="/dsfa?filter=missing-vvt"><a className="text-xs text-primary hover:underline">Zur DSFA-Seite</a></Link><Link href="/vvt?filter=missing-dsfa"><a className="text-xs text-primary hover:underline">Zur VVT-Seite</a></Link></div>
                    </div>
                  ))}
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Copilot-Compliance-Fokus</CardTitle>
              <CardDescription>Direkte Einstiege in offene Microsoft-365-Copilot-Arbeitspunkte</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {!copilotStatusVorhanden ? (
                <p className="text-muted-foreground">Aktuell keine Copilot-spezifischen Einträge erkannt.</p>
              ) : (
                <>
                  {copilotDsfaOhneReviewItems.length > 0 && (
                    <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3">
                      <p className="font-medium text-amber-700 dark:text-amber-400">Copilot-DSFA ohne Reviewdatum</p>
                      <p className="text-xs text-muted-foreground">{copilotDsfaOhneReviewItems.length} Fall/Fälle benötigen einen gesetzten Prüftermin.</p>
                      <div className="mt-2"><Link href="/dsfa?filter=copilot-missing-review"><a className="text-xs text-primary hover:underline">Zur DSFA-Seite</a></Link></div>
                    </div>
                  )}
                  {copilotAvvOhnePruefungItems.length > 0 && (
                    <div className="rounded-lg border border-yellow-500/20 bg-yellow-500/5 p-3">
                      <p className="font-medium text-yellow-700 dark:text-yellow-400">Copilot-/Microsoft-AVV ohne Prüffälligkeit</p>
                      <p className="text-xs text-muted-foreground">{copilotAvvOhnePruefungItems.length} Vertrag/Verträge haben noch keinen Reviewtermin.</p>
                      <div className="mt-2"><Link href="/avv?filter=copilot-missing-review"><a className="text-xs text-primary hover:underline">Zur AVV-Seite</a></Link></div>
                    </div>
                  )}
                  {copilotVvtOhneDsfaItems.length > 0 && (
                    <div className="rounded-lg border border-yellow-500/20 bg-yellow-500/5 p-3">
                      <p className="font-medium text-yellow-700 dark:text-yellow-400">Copilot-VVT ohne DSFA-Pflicht</p>
                      <p className="text-xs text-muted-foreground">{copilotVvtOhneDsfaItems.length} Verarbeitung(en) sollten fachlich auf gesetzte DSFA-Pflicht geprüft werden.</p>
                      <div className="mt-2"><Link href="/vvt?filter=copilot-missing-dsfa-flag"><a className="text-xs text-primary hover:underline">Zur VVT-Seite</a></Link></div>
                    </div>
                  )}
                  {copilotTasksOpenItems.length > 0 && (
                    <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
                      <p className="font-medium text-primary">Offene Copilot-Aufgaben</p>
                      <p className="text-xs text-muted-foreground">{copilotTasksOpenItems.length} Aufgabe(n) sind noch offen oder in Bearbeitung.</p>
                      <div className="mt-2"><Link href="/aufgaben?filter=copilot-open"><a className="text-xs text-primary hover:underline">Zur Aufgaben-Seite</a></Link></div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Gruppenkontext</CardTitle>
              <CardDescription>Kennzahlen zur zugeordneten Gruppe</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {activeMandant?.gruppeId ? (
                <>
                  <p>Gruppe: <span className="font-medium">{gruppen.find((g: any) => g.id === activeMandant.gruppeId)?.name || "—"}</span></p>
                  <p>Mandanten in Gruppe: <span className="font-medium">{gruppenKennzahl}</span></p>
                </>
              ) : <p className="text-muted-foreground">Keiner Gruppe zugeordnet.</p>}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Reifegrad</CardTitle>
              <CardDescription>Gewichteter Governance- und Reifegrad aus Struktur, Audit, PDCA, DSFA, Löschkonzept, Aufgabensteuerung und Dokumentation</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between gap-3">
                <p className="text-3xl font-bold">{reifegradScore}%</p>
                <span className={`inline-flex items-center px-3 py-1 rounded text-xs font-medium border ${reifegradAmpel === "Grün" ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" : reifegradAmpel === "Gelb" ? "bg-yellow-500/15 text-yellow-400 border-yellow-500/30" : "bg-red-500/15 text-red-400 border-red-500/30"}`}>{reifegradAmpel}</span>
              </div>
              <div className="mt-3 h-3 w-full rounded bg-secondary overflow-hidden">
                <div className="h-full bg-primary transition-all" style={{ width: `${reifegradScore}%` }} />
              </div>
              <div className="mt-4 rounded-lg border border-border/60 overflow-hidden">
                <div className="px-3 py-2 bg-secondary/40 text-xs font-medium">Score-Details nach Gewichtung</div>
                <div className="divide-y divide-border/60">
                  {maturityCriteria.map((item) => {
                    const percent = item.weight ? Math.round((item.score / item.weight) * 100) : 0;
                    const tone = percent >= 100 ? "text-emerald-400" : percent >= 50 ? "text-yellow-400" : "text-red-400";
                    return (
                      <div key={item.label} className="px-3 py-2">
                        <div className="flex items-center justify-between gap-3 text-xs">
                          <p className="font-medium">{item.label}</p>
                          <p className={tone}>{item.score}/{item.weight} Punkte</p>
                        </div>
                        <div className="mt-1 h-2 w-full rounded bg-secondary overflow-hidden">
                          <div className={`h-full transition-all ${percent >= 100 ? "bg-emerald-500" : percent >= 50 ? "bg-yellow-500" : "bg-red-500"}`} style={{ width: `${percent}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="mt-4 rounded-lg border border-border/60 p-3">
                <p className="text-xs font-medium mb-2">Top-Handlungsfelder</p>
                <div className="space-y-2">
                  {weakestMaturityCriteria.map((item) => (
                    <div key={item.label} className="text-xs">
                      <p className="font-medium">{item.label}</p>
                      <p className="text-muted-foreground">{item.score}/{item.weight} Punkte · {item.percent}% Erfüllung</p>
                      <p className="text-muted-foreground">Empfehlung: {item.recommendation}</p>
                      <p className="text-muted-foreground">Aufgabenentwurf: [{item.taskDraft.priority}] {item.taskDraft.title} – {item.taskDraft.draft}</p>
                      <div className="flex flex-wrap gap-3 mt-1">
                        <Link href={item.action.href}><a className="text-primary hover:underline">{item.action.label}</a></Link>
                        <Link href={item.taskAction.href}><a className="text-primary hover:underline">{item.taskAction.label}</a></Link>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="mt-3 space-y-1 text-xs text-muted-foreground">
                <p>Audit-Gewichtung: 12 Punkte</p>
                <p>PDCA-Gewichtung: 14 Punkte</p>
                <p>Audit-Follow-ups ohne Audit-Bezug: {auditFollowUpsOhneAuditDashboard.length}</p>
                <p>PDCA-Reviews fällig/überfällig: {pdcaReviewFaelligItems.length}</p>
                <p>Offene PDCA-Folgeaufgaben: {pdcaFollowUpTasksOffenDashboard.length}</p>
                <p>Leitlinien vorhanden: {leitlinienCount >= 2 ? "ja" : `nein (${leitlinienCount}/2)`}</p>
                <p>VVT ohne Löschkonzept-Bezug: {vvtOhneLoeschkonzept}</p>
                <p>Interne Audits dokumentiert: {auditsVorhanden ? "ja" : `nein (${dashboardAuditCount})`}</p>
                <p>TOM-Katalog umfangreich: {tomUmfangreich ? "ja" : `nein (${stats?.tom ?? 0})`}</p>
                <p>Copilot-Paket aktiv: {copilotStatusVorhanden ? "ja" : "nein"}</p>
                <p>Copilot-DSFA ohne Reviewdatum: {copilotDsfaOhneReviewItems.length}</p>
                <p>Copilot-AVV ohne Prüffälligkeit: {copilotAvvOhnePruefungItems.length}</p>
                <p>Offene Copilot-Aufgaben: {copilotTasksOpenItems.length}</p>
                <p>DSFA ohne VVT-Bezug: {dsfaOhneVvt}</p>
                <p>DSFA mit Art.-36-Prüfbedarf: {dsfaMitArt36}</p>
                <p>Überfällige DSFA-Reviews: {dsfaReviewFaellig}</p>
                <p>DSFA mit hohem Restrisiko: {dsfaMitHohemRestrisiko}</p>
                <p>Offene kritische/notwendige Tasks: {kritischeOderNotwendigeAufgaben}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Interne Notizen</CardTitle>
              <CardDescription>Wichtige Ereignisse und anstehende Themen des aktiven Mandanten</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {sichtbareInterneNotizen.length === 0 ? (
                <p className="text-muted-foreground">Noch keine internen Notizen vorhanden.</p>
              ) : sichtbareInterneNotizen.map((note: any) => (
                <div key={note.id} className="rounded-lg border p-3 space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-medium">{note.titel}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      {note.exportieren && <span className="rounded-full border px-2 py-0.5">Export freigegeben</span>}
                      <StatusBadge value={note.prioritaet} />
                    </div>
                  </div>
                  <p className="text-muted-foreground whitespace-pre-wrap">{note.inhalt}</p>
                  <p className="text-xs text-muted-foreground">{note.kategorie || "allgemein"}{note.faelligAm ? ` · fällig ${note.faelligAm}` : ""}</p>
                </div>
              ))}
              <Link href="/interne-notizen"><a className="text-xs text-primary hover:underline">Alle internen Notizen anzeigen</a></Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Management-KPIs</CardTitle>
              <CardDescription>Verdichtete Kennzahlen zur Steuerung</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div><p className="text-2xl font-bold">{complianceKpis.offeneAufgaben}</p><p className="text-xs text-muted-foreground">offene Aufgaben</p></div>
              <div><p className="text-2xl font-bold">{complianceKpis.leitlinien ? "Ja" : "Nein"}</p><p className="text-xs text-muted-foreground">{leitlinienStatusText}</p></div>
              <div><p className="text-2xl font-bold">{complianceKpis.reviews}</p><p className="text-xs text-muted-foreground">offene Reviews</p></div>
              <div><p className="text-2xl font-bold">{complianceKpis.kritische}</p><p className="text-xs text-muted-foreground">kritische Aufgaben</p></div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

// ─── GENERIC LIST PAGE ─────────────────────────────────────────────────────
function useModuleData(endpoint: string) {
  const { activeMandantId } = useMandant();
  const qc = useQueryClient();
  const moduleBase = `/api/mandanten/${activeMandantId}/${endpoint}`;
  const { data = [], isLoading } = useQuery({
    queryKey: [moduleBase],
    queryFn: () => apiRequest("GET", moduleBase).then(r => r.json()),
    enabled: !!activeMandantId,
  });
  const invalidate = async () => {
    await qc.invalidateQueries({ queryKey: [moduleBase] });
  };
  const create = useMutation({
    mutationFn: async (body: any) => {
      if (!activeMandantId) throw new Error("Kein aktiver Mandant ausgewählt.");
      const res = await apiRequest("POST", moduleBase, body);
      return res.status === 204 ? null : res.json();
    },
    onSuccess: invalidate,
  });
  const update = useMutation({
    mutationFn: async ({ id, ...body }: any) => {
      if (!id) throw new Error(`Fehlende ID für Update in ${endpoint}.`);
      const res = await apiRequest("PUT", `/api/${endpoint}/${id}`, body);
      return res.status === 204 ? null : res.json();
    },
    onSuccess: invalidate,
  });
  const remove = useMutation({
    mutationFn: async (id: number) => {
      if (!id) throw new Error(`Fehlende ID für Delete in ${endpoint}.`);
      return apiRequest("DELETE", `/api/${endpoint}/${id}`);
    },
    onSuccess: invalidate,
  });
  return { data, isLoading, create, update, remove };
}

// ─── VVT PAGE ──────────────────────────────────────────────────────────────
const rechtsgrundlagen = ["Art. 6 Abs. 1 lit. a (Einwilligung)", "Art. 6 Abs. 1 lit. b (Vertrag)", "Art. 6 Abs. 1 lit. c (rechtl. Verpflichtung)", "Art. 6 Abs. 1 lit. d (lebenswichtige Interessen)", "Art. 6 Abs. 1 lit. e (öffentliche Aufgabe)", "Art. 6 Abs. 1 lit. f (berechtigtes Interesse)"];
const VVT_RISIKO_STUFEN = ["niedrig", "mittel", "hoch"] as const;

function normalizeTextList(value: any) {
  return String(value || "")
    .split(/\n|,|;/)
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function parseVvtRiskTriggers(value: any) {
  try {
    const parsed = typeof value === "string" ? JSON.parse(value || "[]") : value;
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function deriveVvtRiskAssessment(source: any) {
  const triggers: string[] = [];
  const kategorien = normalizeTextList(source?.datenkategorien).join(" ").toLowerCase();
  const betroffene = normalizeTextList(source?.betroffenePersonen).join(" ").toLowerCase();
  const empfaenger = String(source?.empfaenger || "").toLowerCase();
  const zweck = String(source?.zweck || "").toLowerCase();
  const name = String(source?.bezeichnung || "").toLowerCase();

  if (source?.drittlandtransfer) triggers.push("Drittlandtransfer");
  if (source?.dsfa) triggers.push("DSFA-pflichtige Verarbeitung");
  if (/gesund|biometr|genet|straf|gewerkschaft|relig|sex|krank/.test(kategorien)) triggers.push("besondere Kategorien personenbezogener Daten");
  if (/bewerber|beschäftigte|kinder|patient|schutzbedürftig/.test(betroffene)) triggers.push("schutzbedürftige oder besonders betroffene Personengruppen");
  if (/profil|scoring|monitor|überwach|ki|automat/.test(`${zweck} ${name}`)) triggers.push("profiling-/überwachungs- oder automatisierungsnaher Verarbeitungskontext");
  if (/behörde|dienstleister|anbieter|konzern|dritt/.test(empfaenger) && String(source?.empfaenger || "").trim()) triggers.push("erweiterter Empfängerkreis / externe Offenlegung");

  const uniqueTriggers = Array.from(new Set(triggers));
  const risikostufe = uniqueTriggers.length >= 3 ? "hoch" : uniqueTriggers.length >= 1 ? "mittel" : "niedrig";
  const risikobegruendung = risikostufe === "hoch"
    ? `Erhöhte Risikolage aufgrund von ${uniqueTriggers.join(", ")}. Fachlich ist eine enge Verzahnung mit DSFA, TOM und Reviewsteuerung angezeigt.`
    : risikostufe === "mittel"
      ? `Erkennbare Risikotreiber: ${uniqueTriggers.join(", ")}. Verarbeitung sollte dokumentiert überprüft und bei Änderungen erneut bewertet werden.`
      : "Aktuell keine besonderen Risikotreiber aus VVT-Sicht erkennbar; Standardrisiko bei dokumentierter TOM- und Löschkonzept-Steuerung.";

  return {
    risikostufe,
    risikoTriggers: uniqueTriggers,
    risikobegruendung,
    risikopruefungAm: source?.risikopruefungAm || new Date().toISOString().slice(0, 10),
    dsfa: source?.dsfa || risikostufe === "hoch",
  };
}

function getVvtRiskBadgeClass(level: string) {
  if (level === "hoch") return "border-red-500/40 text-red-600";
  if (level === "mittel") return "border-yellow-500/40 text-yellow-600";
  return "border-emerald-500/40 text-emerald-600";
}
const vvtTemplates: Record<string, any> = {
  none: null,
  personalverwaltung: {
    bezeichnung: "Personalverwaltung",
    zweck: "Verwaltung von Beschäftigtenverhältnissen einschließlich Lohnabrechnung, Zeiterfassung und Personalentwicklung.",
    rechtsgrundlage: "Art. 6 Abs. 1 lit. b (Vertrag)",
    verantwortlicher: "Personalabteilung",
    loeschfrist: "10 Jahre nach Ausscheiden, soweit gesetzlich erforderlich",
    status: "aktiv",
    dsfa: false,
    drittlandtransfer: false,
    datenkategorien: "Stammdaten, Vertragsdaten, Abrechnungsdaten, Qualifikationen",
    betroffenePersonen: "Beschäftigte, Bewerber, ehemalige Beschäftigte",
    empfaenger: "Steuerberater, Sozialversicherungsträger, Behörden",
    tomHinweis: "Zugriffsbeschränkung nach Rollen, verschlüsselte Ablage, Berechtigungskonzept",
  },
  bewerbermanagement: {
    bezeichnung: "Bewerbermanagement",
    zweck: "Durchführung des Bewerbungsprozesses und Auswahl geeigneter Kandidaten.",
    rechtsgrundlage: "Art. 6 Abs. 1 lit. b (Vertrag)",
    verantwortlicher: "HR / Recruiting",
    loeschfrist: "6 Monate nach Abschluss des Bewerbungsverfahrens",
    status: "aktiv",
    dsfa: false,
    drittlandtransfer: false,
    datenkategorien: "Kontaktdaten, Lebenslauf, Zeugnisse, Interviewnotizen",
    betroffenePersonen: "Bewerber",
    empfaenger: "Fachabteilungen, Recruiting-Dienstleister",
    tomHinweis: "Need-to-know-Zugriff, geschütztes Bewerberportal, Löschkonzept",
  },
  kundenverwaltung: {
    bezeichnung: "Kundenverwaltung / CRM",
    zweck: "Verwaltung von Kundenbeziehungen, Verträgen, Kommunikation und Vertriebschancen.",
    rechtsgrundlage: "Art. 6 Abs. 1 lit. b (Vertrag)",
    verantwortlicher: "Vertrieb / Kundenservice",
    loeschfrist: "3 Jahre nach Ende der Geschäftsbeziehung, steuerrechtliche Daten länger",
    status: "aktiv",
    dsfa: false,
    drittlandtransfer: false,
    datenkategorien: "Stammdaten, Kontaktdaten, Vertragsdaten, Kommunikationsdaten",
    betroffenePersonen: "Kunden, Ansprechpartner bei Kunden",
    empfaenger: "Vertrieb, Support, Auftragsverarbeiter",
    tomHinweis: "CRM-Berechtigungskonzept, Protokollierung, Verschlüsselung",
  },
  newsletter: {
    bezeichnung: "Newsletter-Versand",
    zweck: "Versand von Informationen und Marketinginhalten an Interessenten und Kunden.",
    rechtsgrundlage: "Art. 6 Abs. 1 lit. a (Einwilligung)",
    verantwortlicher: "Marketing",
    loeschfrist: "Bis Widerruf der Einwilligung bzw. 3 Jahre nach letztem Kontakt",
    status: "aktiv",
    dsfa: false,
    drittlandtransfer: true,
    datenkategorien: "E-Mail-Adresse, Name, Nutzungsdaten, Einwilligungsnachweise",
    betroffenePersonen: "Interessenten, Kunden",
    empfaenger: "Newsletter-Dienstleister",
    tomHinweis: "Double-Opt-In, Abmeldemechanismus, Anbieterprüfung",
  },
  video: {
    bezeichnung: "Videoüberwachung",
    zweck: "Wahrnehmung des Hausrechts, Schutz von Eigentum und Aufklärung von Vorfällen.",
    rechtsgrundlage: "Art. 6 Abs. 1 lit. f (berechtigtes Interesse)",
    verantwortlicher: "Geschäftsführung / Facility Management",
    loeschfrist: "72 Stunden, sofern kein Vorfall vorliegt",
    status: "aktiv",
    dsfa: true,
    drittlandtransfer: false,
    datenkategorien: "Bilddaten, Zeitstempel, Standortdaten",
    betroffenePersonen: "Besucher, Beschäftigte, Lieferanten",
    empfaenger: "Sicherheitsdienst, Strafverfolgungsbehörden bei Vorfällen",
    tomHinweis: "Beschilderung, Zugriff nur für Berechtigte, kurze Speicherfristen",
  },
  ki: {
    bezeichnung: "Einsatz von KI-Tools im Unternehmen",
    zweck: "Unterstützung von Analyse-, Text-, Automatisierungs- und Entscheidungsprozessen durch KI-Anwendungen.",
    rechtsgrundlage: "Art. 6 Abs. 1 lit. f (berechtigtes Interesse)",
    verantwortlicher: "Fachbereich mit KI-Einsatz / Datenschutzkoordination",
    loeschfrist: "Gemäß Löschkonzept des jeweiligen Einsatzszenarios",
    status: "aktiv",
    dsfa: true,
    drittlandtransfer: true,
    datenkategorien: "Prompt-Inhalte, Inhaltsdaten, Nutzungsdaten, Metadaten, ggf. personenbezogene Kontextdaten",
    betroffenePersonen: "Beschäftigte, Kunden, Interessenten, sonstige betroffene Personen je Use Case",
    empfaenger: "KI-Anbieter, IT-Dienstleister, interne Fachbereiche",
    tomHinweis: "Richtlinie für KI-Nutzung, Anbieterauswahl, Minimierung personenbezogener Daten, Transferbewertung",
  },
  dsdms_cloud_office: {
    bezeichnung: "DSDMS: Cloud-Anwendungen & Office-Suite",
    zweck: "Kollaboration, E-Mail-Kommunikation und Dateiverarbeitung im Cloud-Umfeld.",
    rechtsgrundlage: "Art. 6 Abs. 1 lit. f (berechtigtes Interesse)",
    verantwortlicher: "IT-Leitung / DS-Team",
    loeschfrist: "Gemäß Löschkonzept der verknüpften Systemklassen (E-Mail/Dateien)",
    status: "aktiv",
    dsfa: true,
    drittlandtransfer: true,
    datenkategorien: "Kommunikationsdaten, Benutzerdaten, Inhaltsdaten, Metadaten",
    betroffenePersonen: "Beschäftigte, Kunden, Lieferanten, Partner",
    empfaenger: "IT-Administration, Cloud-Service-Provider (AV)",
    tomHinweis: "Zwei-Faktor-Authentifizierung (2FA), TLS-Transportverschlüsselung, Audit-Logging",
  },
  dsdms_it_support: {
    bezeichnung: "DSDMS: IT-Support extern",
    zweck: "Wartung, Fernwartung und technischer Support der IT-Systeme durch externe Dienstleister.",
    rechtsgrundlage: "Art. 6 Abs. 1 lit. f (berechtigtes Interesse)",
    verantwortlicher: "IT-Leitung",
    loeschfrist: "Ticketdaten 3 Jahre nach Abschluss, Sessions-Protokolle 1 Jahr",
    status: "aktiv",
    dsfa: false,
    drittlandtransfer: false,
    datenkategorien: "Stammdaten, Kontaktdaten, Logindaten, System-Metadaten",
    betroffenePersonen: "Beschäftigte, Admins",
    empfaenger: "Technischer Support-Dienstleister (AVV)",
    tomHinweis: "Verschlüsselte VPN-Fernwartung, Freigabe-Pflicht, detailliertes Session-Logging",
  },
  dsdms_zutritt: {
    bezeichnung: "DSDMS: Zutrittskontrollsystem",
    zweck: "Sicherung des Objektschutzes, Zutrittskontrolle zu Büro- und Serverräumen.",
    rechtsgrundlage: "Art. 6 Abs. 1 lit. f (berechtigtes Interesse)",
    verantwortlicher: "Facility Management / IT",
    loeschfrist: "Zutrittsprotokolle werden nach spätestens 3 Monaten automatisch gelöscht",
    status: "aktiv",
    dsfa: false,
    drittlandtransfer: false,
    datenkategorien: "Chipkarten-ID, Zeitstempel (Kommen/Gehen), Raumnummer",
    betroffenePersonen: "Beschäftigte, Dienstleister, Besucher",
    empfaenger: "Sicherheitsdienstleister (AVV)",
    tomHinweis: "Physischer und logischer Zugriffsschutz des Steuerungsrechners, Rollenkonzept",
  },
  dsdms_zeiterfassung: {
    bezeichnung: "DSDMS: Zeiterfassung",
    zweck: "Dokumentation von Arbeits-, Pausen- und Urlaubszeiten zur Einhaltung des Arbeitszeitgesetzes.",
    rechtsgrundlage: "Art. 6 Abs. 1 lit. b (Vertrag) & § 26 BDSG",
    verantwortlicher: "HR / Personalabteilung",
    loeschfrist: "3 Jahre nach Ablauf des Kalenderjahres, steuerlich relevante Daten 10 Jahre",
    status: "aktiv",
    dsfa: false,
    drittlandtransfer: false,
    datenkategorien: "Stammdaten, Arbeitszeitdaten, Abwesenheiten (Krankheit/Urlaub)",
    betroffenePersonen: "Beschäftigte",
    empfaenger: "Lohnbuchhaltung, Zeiterfassungssoftware-Anbieter (AVV)",
    tomHinweis: "Rollen- und Berechtigungskonzept, verschlüsselte Datenbankverbindung",
  },
  ...allVvtTemplates
};

function VvtForm({ initial, onSave, onCancel }: any) {
  const { t } = useI18n();
  const [selectedTemplate, setSelectedTemplate] = useState("none");
  const { data: toms = [] } = useModuleData("tom");
  const [searchTerm, setSearchTerm] = useState("");
  const [form, setForm] = useState(() => {
    const base = { bezeichnung: "", zweck: "", rechtsgrundlage: "", verantwortlicher: "", verantwortlicherEmail: "", verantwortlicherTelefon: "", loeschfrist: "", loeschklasse: "", aufbewahrungsgrund: "", status: "aktiv", dsfa: false, drittlandtransfer: false, datenkategorien: "", betroffenePersonen: "", empfaenger: "", tomHinweis: "", risikostufe: "niedrig", risikobegruendung: "", risikoTriggers: "[]", risikopruefungAm: "", verknuepfteTomIds: "[]", ...initial };
    const assessment = deriveVvtRiskAssessment(base);
    return { ...base, ...assessment, risikoTriggers: JSON.stringify(assessment.risikoTriggers), ...initial };
  });
  const set = (k: string, v: any) => setForm((p: any) => ({ ...p, [k]: v }));
  const applyTemplate = (value: string) => {
    setSelectedTemplate(value);
    const template = vvtTemplates[value];
    if (!template) return;
    setForm((p: any) => {
      const next = { ...p, ...template };
      const assessment = deriveVvtRiskAssessment(next);
      return { ...next, ...assessment, risikoTriggers: JSON.stringify(assessment.risikoTriggers) };
    });
  };

  useEffect(() => {
    setForm((prev: any) => {
      const assessment = deriveVvtRiskAssessment(prev);
      const nextTriggers = JSON.stringify(assessment.risikoTriggers);
      if (
        prev.risikostufe === assessment.risikostufe &&
        prev.risikobegruendung === assessment.risikobegruendung &&
        prev.risikopruefungAm === assessment.risikopruefungAm &&
        prev.dsfa === assessment.dsfa &&
        prev.risikoTriggers === nextTriggers
      ) return prev;
      return { ...prev, ...assessment, risikoTriggers: nextTriggers };
    });
  }, [form.bezeichnung, form.zweck, form.datenkategorien, form.betroffenePersonen, form.empfaenger, form.drittlandtransfer, form.dsfa]);
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="col-span-2 space-y-1">
          <Label className="text-xs">{t("vvtTemplateLabel")}</Label>
          <Select value={selectedTemplate} onValueChange={applyTemplate}>
            <SelectTrigger className="h-8 text-xs"><SelectValue placeholder={t("selectTemplate")} /></SelectTrigger>
            <SelectContent className="max-h-80">
              <SelectItem value="none">{t("noTemplate")}</SelectItem>
              <SelectItem value="personalverwaltung">Personalverwaltung</SelectItem>
              <SelectItem value="bewerbermanagement">Bewerbermanagement</SelectItem>
              <SelectItem value="kundenverwaltung">Kundenverwaltung / CRM</SelectItem>
              <SelectItem value="newsletter">Newsletter-Versand</SelectItem>
              <SelectItem value="video">Videoüberwachung</SelectItem>
              <SelectItem value="ki">Einsatz von KI-Tools</SelectItem>
              <SelectItem value="dsdms_cloud_office">DSDMS: Cloud & Office Suite</SelectItem>
              <SelectItem value="dsdms_it_support">DSDMS: IT-Support extern</SelectItem>
              <SelectItem value="dsdms_zutritt">DSDMS: Zutrittskontrollsystem</SelectItem>
              <SelectItem value="dsdms_zeiterfassung">DSDMS: Zeiterfassung</SelectItem>
              <Separator />
              {Object.entries(allVvtTemplates)
                .sort((a, b) => a[1].bezeichnung.localeCompare(b[1].bezeichnung))
                .map(([key, t]) => (
                  <SelectItem key={key} value={key}>
                    {t.bezeichnung}
                  </SelectItem>
                ))
              }
            </SelectContent>
          </Select>
        </div>
        <div className="col-span-2 space-y-1"><Label className="text-xs">{t("vvtName")} *</Label><Input value={form.bezeichnung} onChange={e => set("bezeichnung", e.target.value)} className="h-8 text-sm" /></div>
        <div className="col-span-2 space-y-1"><Label className="text-xs">{t("vvtPurpose")}</Label><Textarea value={form.zweck} onChange={e => set("zweck", e.target.value)} className="text-sm min-h-16" /></div>
        <div className="space-y-1">
          <Label className="text-xs">{t("vvtLegalBasis")}</Label>
          <Select value={form.rechtsgrundlage} onValueChange={v => set("rechtsgrundlage", v)}>
            <SelectTrigger className="h-8 text-xs"><SelectValue placeholder={t("choose")} /></SelectTrigger>
            <SelectContent>{rechtsgrundlagen.map(r => <SelectItem key={r} value={r} className="text-xs">{r}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-1"><Label className="text-xs">{t("vvtStatusLabel")}</Label>
          <Select value={form.status} onValueChange={v => set("status", v)}>
            <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="aktiv">{t("active")}</SelectItem><SelectItem value="entwurf">{t("draft")}</SelectItem><SelectItem value="archiviert">{t("archived")}</SelectItem></SelectContent>
          </Select>
        </div>
        <div className="space-y-1"><Label className="text-xs">{t("vvtOwner")}</Label><Input value={form.verantwortlicher} onChange={e => set("verantwortlicher", e.target.value)} className="h-8 text-sm" /></div>
        <div className="space-y-1"><Label className="text-xs">{t("vvtOwnerEmail")}</Label><Input type="email" value={form.verantwortlicherEmail || ""} onChange={e => set("verantwortlicherEmail", e.target.value)} className="h-8 text-sm" /></div>
        <div className="space-y-1"><Label className="text-xs">{t("vvtOwnerPhone")}</Label><Input value={form.verantwortlicherTelefon || ""} onChange={e => set("verantwortlicherTelefon", e.target.value)} className="h-8 text-sm" /></div>
        <div className="space-y-1"><Label className="text-xs">{t("vvtRetentionPeriod")}</Label><Input value={form.loeschfrist} onChange={e => set("loeschfrist", e.target.value)} className="h-8 text-sm" placeholder={t("vvtRetentionPeriodPlaceholder")} /></div>
        <div className="space-y-1"><Label className="text-xs">{t("vvtRetentionClass")}</Label><Input value={form.loeschklasse || ""} onChange={e => set("loeschklasse", e.target.value)} className="h-8 text-sm" placeholder={t("vvtRetentionClassPlaceholder")} /></div>
        <div className="col-span-2 space-y-1"><Label className="text-xs">{t("vvtRetentionReason")}</Label><Textarea value={form.aufbewahrungsgrund || ""} onChange={e => set("aufbewahrungsgrund", e.target.value)} className="text-sm min-h-12" /></div>
        <div className="col-span-2 space-y-1"><Label className="text-xs">{t("vvtDataCategories")}</Label><Textarea value={form.datenkategorien} onChange={e => set("datenkategorien", e.target.value)} className="text-sm min-h-12" /></div>
        <div className="col-span-2 space-y-1"><Label className="text-xs">{t("vvtDataSubjects")}</Label><Textarea value={form.betroffenePersonen} onChange={e => set("betroffenePersonen", e.target.value)} className="text-sm min-h-12" /></div>
        <div className="col-span-2 space-y-1"><Label className="text-xs">{t("vvtRecipients")}</Label><Textarea value={form.empfaenger} onChange={e => set("empfaenger", e.target.value)} className="text-sm min-h-12" /></div>
        <div className="col-span-2 space-y-1"><Label className="text-xs">{t("vvtTomHint")}</Label><Textarea value={form.tomHinweis} onChange={e => set("tomHinweis", e.target.value)} className="text-sm min-h-12" /></div>
        {(() => {
          const verknuepfteIds: number[] = (() => {
            try {
              const parsed = typeof form.verknuepfteTomIds === "string" ? JSON.parse(form.verknuepfteTomIds || "[]") : form.verknuepfteTomIds;
              return Array.isArray(parsed) ? parsed.map(Number) : [];
            } catch {
              return [];
            }
          })();

          const toggleTom = (tomId: number) => {
            const nextIds = verknuepfteIds.includes(tomId)
              ? verknuepfteIds.filter(id => id !== tomId)
              : [...verknuepfteIds, tomId];
            set("verknuepfteTomIds", JSON.stringify(nextIds));
          };

          const count = verknuepfteIds.length;

          const filteredToms = toms.filter((tom: any) =>
            tom.massnahme.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (tom.beschreibung || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
            tom.kategorie.toLowerCase().includes(searchTerm.toLowerCase())
          );

          const groupedToms = filteredToms.reduce((acc: Record<string, any[]>, tom: any) => {
            const cat = tom.kategorie || "sonstige";
            if (!acc[cat]) acc[cat] = [];
            acc[cat].push(tom);
            return acc;
          }, {});

          const catNames: Record<string, string> = {
            zutrittskontrolle: "Zutrittskontrolle",
            zugangskontrolle: "Zugangskontrolle",
            zugriffskontrolle: "Zugriffskontrolle",
            weitergabe: "Weitergabekontrolle",
            eingabe: "Eingabekontrolle",
            auftrag: "Auftragskontrolle",
            verfuegbarkeit: "Verfügbarkeitskontrolle",
            trennung: "Trennungskontrolle"
          };

          return (
            <div className="col-span-2 rounded-lg border p-4 space-y-4 bg-muted/10">
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">
                  Verknüpfte Technische & Organisatorische Maßnahmen (TOMs)
                </h4>
                <p className="text-[11px] text-muted-foreground">
                  Verknüpfen Sie relevante Sicherheitsmaßnahmen, um das technische Schutzniveau für diese Verarbeitungstätigkeit zu ermitteln.
                </p>
              </div>

              {/* Schutzniveau Ampel Card */}
              {(() => {
                let level = "Niedrig";
                let colorCls = "bg-red-50 text-red-700 border-red-200";
                let barColor = "bg-red-500";
                let emoji = "🔴";
                let desc = "Keine schützenden TOMs verknüpft. Das Schutzniveau ist kritisch niedrig und erfordert dringend organisatorische oder technische Absicherung.";
                
                if (count >= 1 && count <= 3) {
                  level = "Normal (Mittel)";
                  colorCls = "bg-amber-50 text-amber-700 border-amber-200";
                  barColor = "bg-amber-500";
                  emoji = "🟡";
                  desc = "Basisschutz ist aktiv. Einige wichtige Maßnahmen wurden verknüpft, das Schutzniveau ist ausreichend für normale Risikoanforderungen.";
                } else if (count >= 4) {
                  level = "Hoch (Optimal)";
                  colorCls = "bg-emerald-50 text-emerald-700 border-emerald-200";
                  barColor = "bg-emerald-500";
                  emoji = "🟢";
                  desc = "Hervorragender Schutz! Mehrere tiefgreifende Sicherheitsmaßnahmen sind verknüpft. Optimaler Schutz selbst bei sensiblen Datenkategorien.";
                }

                const pct = Math.min(100, Math.round((count / 4) * 100));

                return (
                  <div className={`rounded-lg border p-3 flex flex-col md:flex-row gap-3 items-start md:items-center justify-between ${colorCls} transition-all duration-300`}>
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm">{emoji}</span>
                        <span className="font-bold text-xs">Technisches Schutzniveau: {level}</span>
                        <Badge variant="outline" className={`${colorCls} text-[10px] py-0.5 px-2 font-bold`}>
                          {count} TOMs aktiv
                        </Badge>
                      </div>
                      <p className="text-[11px] leading-relaxed opacity-90">{desc}</p>
                      <div className="w-full bg-slate-200/50 rounded-full h-1.5 overflow-hidden">
                        <div className={`${barColor} h-1.5 transition-all duration-500`} style={{ width: `${pct}%` }}></div>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Search Bar */}
              <div className="relative">
                <Input
                  type="text"
                  placeholder="Nach TOM-Maßnahme oder Kategorie filtern..."
                  value={searchTerm}
                  onChange={(e: any) => setSearchTerm(e.target.value)}
                  className="h-8 text-xs pl-8 bg-background"
                />
                <span className="absolute left-2.5 top-2 text-muted-foreground text-xs">🔍</span>
              </div>

              {/* Scrollable Checklist */}
              <ScrollArea className="h-[220px] rounded-md border p-3 bg-background">
                {toms.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-12">
                    Keine TOM-Maßnahmen im Mandanten hinterlegt. Bitte erstellen Sie zuerst TOMs im entsprechenden Modul.
                  </p>
                ) : Object.keys(groupedToms).length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-12">Keine passenden TOMs gefunden.</p>
                ) : (
                  <div className="space-y-4">
                    {Object.entries(groupedToms).map(([catKey, items]: any) => (
                      <div key={catKey} className="space-y-2">
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider bg-secondary/50 px-2 py-0.5 rounded">
                          {catNames[catKey] || catKey}
                        </p>
                        <div className="space-y-1.5 pl-1">
                          {items.map((tom: any) => {
                            const isChecked = verknuepfteIds.includes(tom.id);
                            return (
                              <label
                                key={tom.id}
                                className={`flex items-start gap-2.5 p-2 rounded border text-xs cursor-pointer transition-all hover:bg-secondary/40 select-none ${isChecked ? "bg-primary/5 border-primary/30" : "bg-card border-border/50"}`}
                              >
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => toggleTom(tom.id)}
                                  className="rounded border-gray-300 text-primary focus:ring-primary mt-0.5"
                                />
                                <div className="flex-1 space-y-0.5">
                                  <p className="font-semibold text-foreground">{tom.massnahme}</p>
                                  {tom.beschreibung && (
                                    <p className="text-[10px] text-muted-foreground line-clamp-2 leading-normal">
                                      {tom.beschreibung}
                                    </p>
                                  )}
                                  <div className="flex gap-2.5 items-center pt-1 flex-wrap">
                                    <span className={`text-[9px] font-medium px-1.5 py-0.2 rounded border ${tom.status === "implementiert" ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-blue-50 text-blue-700 border-blue-100"}`}>
                                      {tom.status === "implementiert" ? "Aktiv" : "Geplant"}
                                    </span>
                                    {tom.wirksamkeit && (
                                      <span className="text-[9px] text-muted-foreground">
                                        Wirksamkeit: <span className="font-semibold text-foreground">{tom.wirksamkeit}</span>
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </div>
          );
        })()}
        <div className="space-y-1"><Label className="text-xs">Risikostufe</Label>
          <Select value={form.risikostufe || "niedrig"} onValueChange={v => set("risikostufe", v)}>
            <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>{VVT_RISIKO_STUFEN.map(level => <SelectItem key={level} value={level} className="text-xs capitalize">{level}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-1"><Label className="text-xs">Risikoprüfung am</Label><Input type="date" value={form.risikopruefungAm || ""} onChange={e => set("risikopruefungAm", e.target.value)} className="h-8 text-sm" /></div>
        <div className="col-span-2 space-y-1"><Label className="text-xs">Risikotreiber / Trigger</Label><Textarea value={parseVvtRiskTriggers(form.risikoTriggers).join("\n")} onChange={e => set("risikoTriggers", JSON.stringify(normalizeTextList(e.target.value)))} className="text-sm min-h-12" /></div>
        <div className="col-span-2 space-y-1"><Label className="text-xs">Fachliche Risikobewertung</Label><Textarea value={form.risikobegruendung || ""} onChange={e => set("risikobegruendung", e.target.value)} className="text-sm min-h-16" /></div>
        <div className="flex items-center gap-2"><input type="checkbox" id="dsfa" checked={!!form.dsfa} onChange={e => set("dsfa", e.target.checked)} className="rounded" /><Label htmlFor="dsfa" className="text-xs">{t("dsfaRequired")}</Label></div>
        <div className="flex items-center gap-2"><input type="checkbox" id="dritt" checked={!!form.drittlandtransfer} onChange={e => set("drittlandtransfer", e.target.checked)} className="rounded" /><Label htmlFor="dritt" className="text-xs">{t("thirdCountryTransfer")}</Label></div>
      </div>
      <DialogFooter>
        <Button variant="outline" size="sm" onClick={onCancel}>{t("cancel")}</Button>
        <Button size="sm" className="bg-primary" onClick={() => onSave(form)} disabled={!form.bezeichnung}>{t("save")}</Button>
      </DialogFooter>
    </div>
  );
}

function VvtPage() {
  const { t } = useI18n();
  const [location, setLocation] = useLocation();
  const { activeMandantId } = useMandant();
  const qc = useQueryClient();
  const { data, isLoading, create, update, remove } = useModuleData("vvt");
  const { data: dsfa = [] } = useModuleData("dsfa");
  const { data: loeschkonzept = [] } = useModuleData("loeschkonzept");
  const { data: aufgaben = [] } = useModuleData("aufgaben");
  const { data: mandanten = [] } = useQuery({ queryKey: ["/api/mandanten"], queryFn: () => apiRequest("GET", "/api/mandanten").then(r => r.json()) });
  const [modal, setModal] = useState<null | "new" | any>(null);
  const [delId, setDelId] = useState<number | null>(null);
  const { toast } = useToast();

  const [quickFilter, setQuickFilterState] = useState<"all" | "missing-dsfa" | "drittland" | "missing-loesch" | "copilot" | "copilot-missing-dsfa-flag" | "high-risk" | "review-needed">("all");
  const [vvtSort, setVvtSortState] = useState<"name-asc" | "name-desc" | "status" | "drittland">("name-asc");

  useEffect(() => {
    const route = new URL(location, "https://privashield.local");
    const rawQuickFilter = route.searchParams.get("filter");
    const rawSort = route.searchParams.get("sort");
    setQuickFilterState(rawQuickFilter === "missing-dsfa" || rawQuickFilter === "drittland" || rawQuickFilter === "missing-loesch" || rawQuickFilter === "copilot" || rawQuickFilter === "copilot-missing-dsfa-flag" || rawQuickFilter === "high-risk" || rawQuickFilter === "review-needed" ? rawQuickFilter : "all");
    setVvtSortState(rawSort === "name-desc" || rawSort === "status" || rawSort === "drittland" ? rawSort : "name-asc");
  }, [location]);

  const updateVvtRouteState = (nextFilter: "all" | "missing-dsfa" | "drittland" | "missing-loesch" | "copilot" | "copilot-missing-dsfa-flag" | "high-risk" | "review-needed", nextSort: "name-asc" | "name-desc" | "status" | "drittland") => {
    const next = new URL(location, "https://privashield.local");
    if (nextFilter === "all") next.searchParams.delete("filter");
    else next.searchParams.set("filter", nextFilter);
    if (nextSort === "name-asc") next.searchParams.delete("sort");
    else next.searchParams.set("sort", nextSort);
    setLocation(`${next.pathname}${next.search}`);
  };

  const setQuickFilter = (value: "all" | "missing-dsfa" | "drittland" | "missing-loesch" | "copilot" | "copilot-missing-dsfa-flag" | "high-risk" | "review-needed") => {
    setQuickFilterState(value);
    updateVvtRouteState(value, vvtSort);
  };
  const setVvtSort = (value: "name-asc" | "name-desc" | "status" | "drittland") => {
    setVvtSortState(value);
    updateVvtRouteState(quickFilter, value);
  };

  const save = (form: any) => {
    const p = modal === "new" ? create.mutateAsync(form) : update.mutateAsync({ id: modal.id, ...form });
    p.then(() => { setModal(null); toast({ title: "Gespeichert" }); }).catch((e:any) => toast({ title: "Fehler", description: e?.message || "Speichern fehlgeschlagen", variant: "destructive" }));
  };

  const vvtMitFehlenderDsfa = data.filter((item: any) => item.dsfa && !dsfa.some((entry: any) => entry.vvtId === item.id));
  const vvtMitDrittlandtransfer = data.filter((item: any) => !!item.drittlandtransfer);
  const vvtMitHohemRisiko = data.filter((item: any) => String(item?.risikostufe || "").toLowerCase() === "hoch");
  const vvtMitReviewBedarf = data.filter((item: any) => String(item?.risikostufe || "").toLowerCase() === "mittel" || !!item.drittlandtransfer);
  const vvtOhneLoeschbezug = data.filter((entry: any) => !loeschkonzept.some((lk: any) => (lk.quelleVvtId && lk.quelleVvtId === entry.id) || String(lk.bezeichnung || "").trim().toLowerCase() === String(entry.bezeichnung || "").trim().toLowerCase()));
  const copilotVvtItems = data.filter((item: any) => /copilot/i.test(String(item?.bezeichnung || "")));
  const copilotVvtOhneDsfaFlagItems = copilotVvtItems.filter((item: any) => !item?.dsfa);
  const filteredData = data.filter((item: any) => {
    if (quickFilter === "missing-dsfa") return vvtMitFehlenderDsfa.some((entry: any) => entry.id === item.id);
    if (quickFilter === "drittland") return vvtMitDrittlandtransfer.some((entry: any) => entry.id === item.id);
    if (quickFilter === "missing-loesch") return vvtOhneLoeschbezug.some((entry: any) => entry.id === item.id);
    if (quickFilter === "high-risk") return vvtMitHohemRisiko.some((entry: any) => entry.id === item.id);
    if (quickFilter === "review-needed") return vvtMitReviewBedarf.some((entry: any) => entry.id === item.id);
    if (quickFilter === "copilot") return copilotVvtItems.some((entry: any) => entry.id === item.id);
    if (quickFilter === "copilot-missing-dsfa-flag") return copilotVvtOhneDsfaFlagItems.some((entry: any) => entry.id === item.id);
    return true;
  }).slice().sort((a: any, b: any) => {
    if (vvtSort === "name-desc") return String(b.bezeichnung || "").localeCompare(String(a.bezeichnung || ""), "de");
    if (vvtSort === "status") return String(a.status || "").localeCompare(String(b.status || ""), "de") || String(a.bezeichnung || "").localeCompare(String(b.bezeichnung || ""), "de");
    if (vvtSort === "drittland") return Number(!!b.drittlandtransfer) - Number(!!a.drittlandtransfer) || String(a.bezeichnung || "").localeCompare(String(b.bezeichnung || ""), "de");
    return String(a.bezeichnung || "").localeCompare(String(b.bezeichnung || ""), "de");
  });
  const activeMandantName = mandanten.find((m: any) => m.id === activeMandantId)?.name || `Mandant #${activeMandantId ?? "?"}`;
  const buildVvtTaskDraft = (item: any, kind: "high-risk" | "missing-dsfa" | "review-needed" | "drittland" | "missing-loesch") => {
    const drafts: Record<string, { title: string; priority: string; description: string }> = {
      "high-risk": {
        title: `VVT-Risiko priorisieren: ${item.bezeichnung}`,
        priority: "hoch",
        description: `Hohe Risikostufe im VVT. Bitte DSFA-Verknüpfung, TOM-Niveau, Rechtsgrundlage und erforderliche Governance-/Folgemaßnahmen für "${item.bezeichnung}" priorisiert prüfen und dokumentieren.`,
      },
      "missing-dsfa": {
        title: `DSFA zu VVT ergänzen: ${item.bezeichnung}`,
        priority: "hoch",
        description: `Für die Verarbeitung "${item.bezeichnung}" ist eine DSFA-Pflicht markiert, aber noch keine DSFA verknüpft. Bitte DSFA anlegen oder bestehenden Bezug dokumentiert herstellen.`,
      },
      "review-needed": {
        title: `VVT-Review durchführen: ${item.bezeichnung}`,
        priority: "mittel",
        description: `Die Verarbeitung "${item.bezeichnung}" weist dokumentierten Reviewbedarf auf. Bitte Risikologik, DSFA-/Transferlage, TOM-Hinweise und Aktualität fachlich überprüfen.`,
      },
      drittland: {
        title: `Drittlandtransfer prüfen: ${item.bezeichnung}`,
        priority: "mittel",
        description: `Für die Verarbeitung "${item.bezeichnung}" ist ein Drittlandtransfer dokumentiert. Bitte Transfergrundlage, SCC/TIA, Anbieterprüfung und ergänzende Schutzmaßnahmen prüfen.`,
      },
      "missing-loesch": {
        title: `Löschkonzept verknüpfen: ${item.bezeichnung}`,
        priority: "mittel",
        description: `Für die Verarbeitung "${item.bezeichnung}" fehlt ein sauberer Löschkonzept-Bezug. Bitte Löschklasse, Frist und operativen Bezug fachlich ergänzen.`,
      },
    };
    const draft = drafts[kind];
    const params = new URLSearchParams({
      draftTitle: draft.title,
      draftPriority: draft.priority,
      draftDescription: draft.description,
      draftSource: `vvt:${kind}:${item.id}`,
    });
    return {
      href: `/aufgaben?${params.toString()}`,
      title: draft.title,
      priority: draft.priority,
      description: draft.description,
      source: `vvt:${kind}:${item.id}`,
    };
  };

  const createVvtFollowUpTask = async (item: any, kind: "high-risk" | "missing-dsfa" | "review-needed" | "drittland" | "missing-loesch") => {
    const draft = buildVvtTaskDraft(item, kind);
    const duplicate = aufgaben.find((task: any) => String(task?.vorlagenBezug || "") === draft.source && String(task?.status || "") !== "erledigt");
    if (duplicate) {
      toast({ title: "Aufgabe bereits vorhanden", description: `Offene Folgeaufgabe gefunden: ${duplicate.titel}` });
      return;
    }
    await apiRequest("POST", `/api/mandanten/${activeMandantId}/aufgaben`, {
      titel: draft.title,
      beschreibung: draft.description,
      typ: kind === "review-needed" ? "review" : "task",
      prioritaet: draft.priority,
      status: "offen",
      fortschritt: 0,
      verantwortlicher: "",
      faelligAm: "",
      kategorie: "governance",
      referenzId: item.id,
      vorlagenBezug: draft.source,
    });
    await qc.invalidateQueries({ queryKey: [`/api/mandanten/${activeMandantId}/aufgaben`] });
    toast({ title: "Folgeaufgabe erstellt", description: draft.title });
  };

  const createVvtPdcaCycle = async (item: any, kind: "high-risk" | "missing-dsfa" | "review-needed" | "drittland" | "missing-loesch") => {
    const source = `vvt-pdca:${kind}:${item.id}`;
    const existingPdca = (await qc.fetchQuery({ queryKey: [`/api/mandanten/${activeMandantId}/pdca`], queryFn: () => apiRequest("GET", `/api/mandanten/${activeMandantId}/pdca`).then(r => r.json()) })) as any[];
    const duplicate = existingPdca.find((entry: any) => String(entry?.actNaechsterZyklus || "").includes(source) && String(entry?.status || "") !== "abgeschlossen");
    if (duplicate) {
      toast({ title: "PDCA bereits vorhanden", description: `Offener Zyklus gefunden: ${duplicate.titel}` });
      return;
    }
    const reviewDate = new Date();
    reviewDate.setDate(reviewDate.getDate() + (kind === "high-risk" || kind === "missing-dsfa" ? 14 : 30));
    const pdcaTitle = kind === "high-risk"
      ? `PDCA VVT-Hochrisiko: ${item.bezeichnung}`
      : kind === "missing-dsfa"
        ? `PDCA DSFA-Nachzug: ${item.bezeichnung}`
        : kind === "drittland"
          ? `PDCA Drittlandtransfer: ${item.bezeichnung}`
          : kind === "missing-loesch"
            ? `PDCA Löschkonzept-Bezug: ${item.bezeichnung}`
            : `PDCA VVT-Review: ${item.bezeichnung}`;
    const pdcaItem = await apiRequest("POST", `/api/mandanten/${activeMandantId}/pdca`, {
      titel: pdcaTitle,
      beschreibung: `Automatisch vorbereiteter Verbesserungszyklus aus VVT-Risikologik für \"${item.bezeichnung}\".`,
      zyklusTyp: kind === "review-needed" ? "management_review" : "verbesserungsmassnahme",
      status: "geplant",
      prioritaet: kind === "high-risk" || kind === "missing-dsfa" ? "hoch" : "mittel",
      verantwortlicher: item.verantwortlicher || "",
      naechstePruefungAm: reviewDate.toISOString().split("T")[0],
      planRisiken: item.risikobegruendung || "",
      planMassnahmen: kind === "high-risk"
        ? "DSFA-Verknüpfung, TOM-Prüfung, Governance-Freigabe und Maßnahmennachverfolgung priorisieren."
        : kind === "missing-dsfa"
          ? "DSFA fachlich anlegen oder verknüpfen und Risikologik dokumentieren."
          : kind === "drittland"
            ? "Transfergrundlage, Anbieterprüfung und zusätzliche Schutzmaßnahmen bewerten."
            : kind === "missing-loesch"
              ? "Löschklasse, Frist und operativen Löschkonzept-Bezug ergänzen."
              : "Review, Aktualität und Angemessenheit der Verarbeitung fachlich überprüfen.",
      planZiele: `Risikologik für ${item.bezeichnung} strukturiert nachsteuern.`,
      actNaechsterZyklus: source,
      verknuepftesAuditId: null,
    }).then(r => r.json());

    await apiRequest("POST", `/api/mandanten/${activeMandantId}/aufgaben`, {
      titel: `${pdcaTitle} – Folgeaufgabe`,
      beschreibung: `Operative Folgeaufgabe zum PDCA-Zyklus \"${pdcaTitle}\" für die Verarbeitung \"${item.bezeichnung}\".`,
      typ: kind === "review-needed" ? "review" : "task",
      prioritaet: kind === "high-risk" || kind === "missing-dsfa" ? "hoch" : "mittel",
      status: "offen",
      fortschritt: 0,
      verantwortlicher: item.verantwortlicher || "",
      faelligAm: reviewDate.toISOString().split("T")[0],
      kategorie: "vvt",
      referenzId: pdcaItem.id,
      vorlagenBezug: "pdca_follow_up",
    });
    await qc.invalidateQueries({ queryKey: [`/api/mandanten/${activeMandantId}/pdca`] });
    await qc.invalidateQueries({ queryKey: [`/api/mandanten/${activeMandantId}/aufgaben`] });
    toast({ title: "PDCA-Zyklus erstellt", description: pdcaTitle });
  };

  return (
    <MandantGuard>
      <PageHeader title={t("vvtTitle")} desc={t("vvtDesc")}
        action={<Button size="sm" className="bg-primary h-8 text-xs gap-1.5" onClick={() => setModal("new")}><Plus className="h-3.5 w-3.5" />Neu</Button>} />
      {isLoading ? <div className="space-y-2">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}</div> : (
        <div className="space-y-4">
          <Card className="border-border/60 bg-muted/20">
            <CardContent className="py-3 px-4 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Aktiver Mandant</p>
                <p className="text-sm font-medium">{activeMandantName}</p>
              </div>
              <p className="text-xs text-muted-foreground">Die VVT-Liste zeigt nur Einträge des aktuell ausgewählten Mandanten.</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">VVT-Quick-Check</CardTitle>
              <CardDescription>Schneller Blick auf typische Lücken in Verarbeitungstätigkeiten</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {vvtMitFehlenderDsfa.length === 0 && vvtMitDrittlandtransfer.length === 0 && vvtMitHohemRisiko.length === 0 && vvtMitReviewBedarf.length === 0 && vvtOhneLoeschbezug.length === 0 ? (
                <p className="text-muted-foreground">Aktuell keine auffälligen VVT-Lücken.</p>
              ) : (
                <>
                  {vvtMitFehlenderDsfa.length > 0 && <p className="text-red-400">DSFA erforderlich, aber nicht verknüpft: {vvtMitFehlenderDsfa.length}</p>}
                  {vvtMitHohemRisiko.length > 0 && <p className="text-red-400">VVT mit hoher Risikostufe: {vvtMitHohemRisiko.length}</p>}
                  {vvtMitReviewBedarf.length > 0 && <p className="text-yellow-400">VVT mit dokumentiertem Reviewbedarf: {vvtMitReviewBedarf.length}</p>}
                  {vvtMitDrittlandtransfer.length > 0 && <p className="text-yellow-400">VVT mit Drittlandtransfer: {vvtMitDrittlandtransfer.length}</p>}
                  {vvtOhneLoeschbezug.length > 0 && <p className="text-yellow-400">VVT ohne Löschkonzept-Bezug: {vvtOhneLoeschbezug.length}</p>}
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">VVT-Fokusliste</CardTitle>
              <CardDescription>Konkrete Verarbeitungstätigkeiten mit priorisiertem Prüfbedarf</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {vvtMitFehlenderDsfa.length === 0 && vvtMitDrittlandtransfer.length === 0 && vvtMitHohemRisiko.length === 0 && vvtMitReviewBedarf.length === 0 && vvtOhneLoeschbezug.length === 0 ? (
                <p className="text-muted-foreground">Aktuell keine priorisierten VVT-Fälle.</p>
              ) : (
                <>
                  {vvtMitHohemRisiko.slice(0, 3).map((item: any) => (
                    <div key={`high-risk-${item.id}`} className="rounded-lg border border-red-500/20 bg-red-500/5 p-3">
                      <p className="font-medium text-red-700 dark:text-red-400">Hohes VVT-Risiko: {item.bezeichnung}</p>
                      <p className="text-xs text-muted-foreground">Empfehlung: DSFA priorisiert anlegen oder verknüpfen und Maßnahmen-/Governance-Folge dokumentieren.</p>
                      <div className="mt-2 flex gap-2"><Button type="button" size="sm" variant="outline" onClick={() => setQuickFilter("high-risk")}>Nur diese Fälle</Button><Button type="button" size="sm" variant="secondary" onClick={() => createVvtFollowUpTask(item, "high-risk")}>Aufgabe erzeugen</Button><Button type="button" size="sm" variant="secondary" onClick={() => createVvtPdcaCycle(item, "high-risk")}>PDCA erzeugen</Button><Link href={buildVvtTaskDraft(item, "high-risk").href}><a className="text-xs text-primary hover:underline self-center">Aufgabe vorbereiten</a></Link><Link href="/dsfa?filter=missing-vvt"><a className="text-xs text-primary hover:underline self-center">Zur DSFA-Seite</a></Link></div>
                    </div>
                  ))}
                  {vvtMitFehlenderDsfa.slice(0, 3).map((item: any) => (
                    <div key={`missing-dsfa-${item.id}`} className="rounded-lg border border-red-500/20 bg-red-500/5 p-3">
                      <p className="font-medium text-red-700 dark:text-red-400">DSFA fehlt: {item.bezeichnung}</p>
                      <p className="text-xs text-muted-foreground">Empfehlung: DSFA anlegen oder vorhandene DSFA mit diesem VVT verknüpfen.</p>
                      <div className="mt-2 flex gap-2"><Button type="button" size="sm" variant="outline" onClick={() => setQuickFilter("missing-dsfa")}>Nur diese Fälle</Button><Button type="button" size="sm" variant="secondary" onClick={() => createVvtFollowUpTask(item, "missing-dsfa")}>Aufgabe erzeugen</Button><Button type="button" size="sm" variant="secondary" onClick={() => createVvtPdcaCycle(item, "missing-dsfa")}>PDCA erzeugen</Button><Link href={buildVvtTaskDraft(item, "missing-dsfa").href}><a className="text-xs text-primary hover:underline self-center">Aufgabe vorbereiten</a></Link><Link href="/dsfa?filter=missing-vvt"><a className="text-xs text-primary hover:underline self-center">Zur DSFA-Seite</a></Link></div>
                    </div>
                  ))}
                  {vvtMitReviewBedarf.slice(0, 3).filter((item: any) => String(item?.risikostufe || "").toLowerCase() === "mittel").map((item: any) => (
                    <div key={`review-${item.id}`} className="rounded-lg border border-yellow-500/20 bg-yellow-500/5 p-3">
                      <p className="font-medium text-yellow-700 dark:text-yellow-400">VVT mit Reviewbedarf: {item.bezeichnung}</p>
                      <p className="text-xs text-muted-foreground">Empfehlung: Review-/Prüfaufgabe auslösen und DSFA-/Transfer-/TOM-Lage fachlich nachziehen.</p>
                      <div className="mt-2 flex gap-2"><Button type="button" size="sm" variant="outline" onClick={() => setQuickFilter("review-needed")}>Nur diese Fälle</Button><Button type="button" size="sm" variant="secondary" onClick={() => createVvtFollowUpTask(item, "review-needed")}>Aufgabe erzeugen</Button><Button type="button" size="sm" variant="secondary" onClick={() => createVvtPdcaCycle(item, "review-needed")}>PDCA erzeugen</Button><Link href={buildVvtTaskDraft(item, "review-needed").href}><a className="text-xs text-primary hover:underline self-center">Aufgabe vorbereiten</a></Link></div>
                    </div>
                  ))}
                  {vvtMitDrittlandtransfer.slice(0, 3).map((item: any) => (
                    <div key={`transfer-${item.id}`} className="rounded-lg border border-yellow-500/20 bg-yellow-500/5 p-3">
                      <p className="font-medium text-yellow-700 dark:text-yellow-400">Drittlandtransfer: {item.bezeichnung}</p>
                      <p className="text-xs text-muted-foreground">Empfehlung: Transfergrundlage, Anbieterprüfung und TOM-/AVV-Lage gezielt prüfen.</p>
                      <div className="mt-2 flex gap-2"><Button type="button" size="sm" variant="outline" onClick={() => setQuickFilter("drittland")}>Nur diese Fälle</Button><Button type="button" size="sm" variant="secondary" onClick={() => createVvtFollowUpTask(item, "drittland")}>Aufgabe erzeugen</Button><Button type="button" size="sm" variant="secondary" onClick={() => createVvtPdcaCycle(item, "drittland")}>PDCA erzeugen</Button><Link href={buildVvtTaskDraft(item, "drittland").href}><a className="text-xs text-primary hover:underline self-center">Aufgabe vorbereiten</a></Link></div>
                    </div>
                  ))}
                  {vvtOhneLoeschbezug.slice(0, 3).map((item: any) => (
                    <div key={`retention-${item.id}`} className="rounded-lg border border-yellow-500/20 bg-yellow-500/5 p-3">
                      <p className="font-medium text-yellow-700 dark:text-yellow-400">Ohne Löschkonzept-Bezug: {item.bezeichnung}</p>
                      <p className="text-xs text-muted-foreground">Empfehlung: Eintrag mit passender Löschklasse bzw. Löschregel verknüpfen.</p>
                      <div className="mt-2 flex gap-2"><Button type="button" size="sm" variant="outline" onClick={() => setQuickFilter("missing-loesch")}>Nur diese Fälle</Button><Button type="button" size="sm" variant="secondary" onClick={() => createVvtFollowUpTask(item, "missing-loesch")}>Aufgabe erzeugen</Button><Button type="button" size="sm" variant="secondary" onClick={() => createVvtPdcaCycle(item, "missing-loesch")}>PDCA erzeugen</Button><Link href={buildVvtTaskDraft(item, "missing-loesch").href}><a className="text-xs text-primary hover:underline self-center">Aufgabe vorbereiten</a></Link></div>
                    </div>
                  ))}
                </>
              )}
            </CardContent>
          </Card>

          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <Button type="button" size="sm" variant={quickFilter === "all" ? "default" : "outline"} onClick={() => setQuickFilter("all")}>Alle</Button>
              <Button type="button" size="sm" variant={quickFilter === "missing-dsfa" ? "default" : "outline"} onClick={() => setQuickFilter("missing-dsfa")}>DSFA fehlt</Button>
              <Button type="button" size="sm" variant={quickFilter === "high-risk" ? "default" : "outline"} onClick={() => setQuickFilter("high-risk")}>Hohes Risiko</Button>
              <Button type="button" size="sm" variant={quickFilter === "review-needed" ? "default" : "outline"} onClick={() => setQuickFilter("review-needed")}>Reviewbedarf</Button>
              <Button type="button" size="sm" variant={quickFilter === "drittland" ? "default" : "outline"} onClick={() => setQuickFilter("drittland")}>Drittlandtransfer</Button>
              <Button type="button" size="sm" variant={quickFilter === "missing-loesch" ? "default" : "outline"} onClick={() => setQuickFilter("missing-loesch")}>Ohne Löschkonzept</Button>
              <Button type="button" size="sm" variant={quickFilter === "copilot" ? "default" : "outline"} onClick={() => setQuickFilter("copilot")}>Copilot</Button>
              <Button type="button" size="sm" variant={quickFilter === "copilot-missing-dsfa-flag" ? "default" : "outline"} onClick={() => setQuickFilter("copilot-missing-dsfa-flag")}>Copilot ohne DSFA-Pflicht</Button>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-muted-foreground">Sortierung:</span>
              <Button type="button" size="sm" variant={vvtSort === "name-asc" ? "default" : "outline"} onClick={() => setVvtSort("name-asc")}>Name A–Z</Button>
              <Button type="button" size="sm" variant={vvtSort === "name-desc" ? "default" : "outline"} onClick={() => setVvtSort("name-desc")}>Name Z–A</Button>
              <Button type="button" size="sm" variant={vvtSort === "status" ? "default" : "outline"} onClick={() => setVvtSort("status")}>Status</Button>
              <Button type="button" size="sm" variant={vvtSort === "drittland" ? "default" : "outline"} onClick={() => setVvtSort("drittland")}>Drittland zuerst</Button>
            </div>
            {filteredData.length === 0 && <Card className="border-dashed"><CardContent className="py-12 text-center text-sm text-muted-foreground">Keine VVT-Einträge für den aktuellen Filter bei <span className="font-medium text-foreground">{activeMandantName}</span>.</CardContent></Card>}
            {data.length === 0 && <Card className="border-dashed"><CardContent className="py-12 text-center text-sm text-muted-foreground">Für <span className="font-medium text-foreground">{activeMandantName}</span> sind aktuell keine VVT-Einträge vorhanden.</CardContent></Card>}
            {filteredData.map((item: any) => {
              const linkedDsfa = dsfa.filter((entry: any) => entry.vvtId === item.id);
              const hasRequiredButMissingDsfa = item.dsfa && linkedDsfa.length === 0;
              const riskTriggers = parseVvtRiskTriggers(item.risikoTriggers);
              return (
                <Card key={item.id} className="group hover:border-border/80 transition-colors">
                  <CardContent className="py-3 px-4 flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center sm:gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <FileText className="h-4 w-4 text-teal-400 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{item.bezeichnung}</p>
                        <p className="text-xs text-muted-foreground truncate">{item.rechtsgrundlage || "Keine Rechtsgrundlage"}{item.dsfa ? " · DSFA erforderlich" : ""}</p>
                        <p className="text-xs text-muted-foreground truncate">{linkedDsfa.length > 0 ? `Verknüpfte DSFA: ${linkedDsfa.map((entry: any) => entry.titel).join(", ")}` : item.dsfa ? "Noch keine verknüpfte DSFA" : "Keine DSFA-Verknüpfung erforderlich"}</p>
                        <p className="text-xs text-muted-foreground truncate">{item.risikobegruendung || "Keine fachliche Risikobewertung dokumentiert."}</p>
                        <p className="text-xs text-muted-foreground truncate">{riskTriggers.length > 0 ? `Trigger: ${riskTriggers.join(", ")}` : `Risikoprüfung: ${item.risikopruefungAm || "offen"}`}</p>
                      </div>
                    </div>
                    <div className="flex w-full items-center justify-between gap-2 shrink-0 sm:w-auto sm:justify-end">
                      <div className="flex items-center gap-2 flex-wrap justify-end">
                        {item.drittlandtransfer && <Badge variant="outline" className="text-xs">Drittland</Badge>}
                        {item.dsfa && linkedDsfa.length > 0 && <Badge variant="outline" className="text-xs border-emerald-500/40 text-emerald-600">DSFA verknüpft</Badge>}
                        {hasRequiredButMissingDsfa && <Badge variant="outline" className="text-xs border-red-500/40 text-red-600">DSFA fehlt</Badge>}
                        <Badge variant="outline" className={`text-xs ${getVvtRiskBadgeClass(String(item.risikostufe || "niedrig"))}`}>Risiko: {String(item.risikostufe || "niedrig")}</Badge>
                        <StatusBadge value={item.status} />
                      </div>
                      <button onClick={() => setModal(item)} className="p-1 rounded text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-all"><Pencil className="h-3.5 w-3.5" /></button>
                      <button onClick={() => setDelId(item.id)} className="p-1 rounded text-muted-foreground hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"><Trash2 className="h-3.5 w-3.5" /></button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}
      <Dialog open={!!modal} onOpenChange={o => !o && setModal(null)}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{modal === "new" ? "Neue Verarbeitungstätigkeit" : "Verarbeitungstätigkeit bearbeiten"}</DialogTitle></DialogHeader>
          {modal && <VvtForm initial={modal === "new" ? {} : modal} onSave={save} onCancel={() => setModal(null)} />}
        </DialogContent>
      </Dialog>
      <ConfirmDialog open={delId !== null} title="Eintrag löschen?" desc="Dieser Vorgang kann nicht rückgängig gemacht werden."
        onConfirm={() => { remove.mutate(delId!); setDelId(null); }} onCancel={() => setDelId(null)} />
    </MandantGuard>
  );
}

// ─── AVV PAGE ──────────────────────────────────────────────────────────────
const avvTemplates: Record<string, any> = {
  none: null,
  microsoft365: {
    auftragsverarbeiter: "Microsoft 365",
    gegenstand: "Bereitstellung von E-Mail, Kollaboration, Dateiablage und Office-Diensten",
    laufzeit: "unbefristet für die Dauer der Nutzung",
    status: "aktiv",
    sccs: true,
    datenarten: "Benutzerdaten, Kommunikationsdaten, Inhaltsdaten, Metadaten",
    betroffenePersonen: "Beschäftigte, Kunden, Interessenten, sonstige Kommunikationspartner",
    technischeMassnahmen: "MFA, Rollen- und Berechtigungskonzept, Verschlüsselung, Logging",
    pruefintervall: "jährlich",
    subauftragnehmerHinweis: "Cloud-Infrastruktur und verbundene Microsoft-Unterauftragnehmer prüfen",
    notizen: "Transfer Impact Assessment und Drittlandtransfer prüfen",
  },
  hosting: {
    auftragsverarbeiter: "Hosting-Anbieter",
    gegenstand: "Hosting von Webseiten, Anwendungen und Datenbanken",
    laufzeit: "unbefristet für die Dauer des Hostingvertrags",
    status: "aktiv",
    sccs: false,
    datenarten: "Server-Logs, Nutzungsdaten, Kundendaten, Inhaltsdaten",
    betroffenePersonen: "Webseitenbesucher, Kunden, Beschäftigte",
    technischeMassnahmen: "Zugriffsschutz, Backup, Netzwerksegmentierung, Härtung",
    pruefintervall: "jährlich",
    subauftragnehmerHinweis: "Rechenzentrum und Infrastrukturpartner prüfen",
    notizen: "Standort des Hostings und technische TOMs dokumentieren",
  },
  newsletter: {
    auftragsverarbeiter: "Newsletter-Dienstleister",
    gegenstand: "Versand und Verwaltung von Newslettern und Einwilligungen",
    laufzeit: "für die Dauer der Nutzung",
    status: "aktiv",
    sccs: true,
    datenarten: "E-Mail-Adresse, Name, Nutzungs- und Öffnungsdaten, Einwilligungsdaten",
    betroffenePersonen: "Interessenten, Kunden, Newsletter-Abonnenten",
    technischeMassnahmen: "Double-Opt-In, Rollenrechte, Export- und Löschkonzept",
    pruefintervall: "jährlich",
    subauftragnehmerHinweis: "Versandinfrastruktur und Tracking-Komponenten prüfen",
    notizen: "Tracking und Einwilligungslage gesondert bewerten",
  },
  payroll: {
    auftragsverarbeiter: "Lohnabrechnungsdienstleister",
    gegenstand: "Durchführung der Lohn- und Gehaltsabrechnung",
    laufzeit: "für die Dauer des Dienstleistungsvertrags",
    status: "aktiv",
    sccs: false,
    datenarten: "Beschäftigtendaten, Steuerdaten, Sozialversicherungsdaten, Bankdaten",
    betroffenePersonen: "Beschäftigte",
    technischeMassnahmen: "Vertraulichkeitskonzept, Zugriffsbeschränkung, verschlüsselte Übertragung",
    pruefintervall: "jährlich",
    subauftragnehmerHinweis: "Softwareanbieter und Rechenzentrumsbetrieb prüfen",
    notizen: "Besonders schützensame Daten im Beschäftigtenkontext beachten",
  },
  ki: {
    auftragsverarbeiter: "KI-Dienstleister",
    gegenstand: "Verarbeitung von Prompts, Eingaben und Ausgaben im Rahmen KI-gestützter Prozesse",
    laufzeit: "für die Dauer der Nutzung des KI-Dienstes",
    status: "aktiv",
    sccs: true,
    datenarten: "Prompt-Daten, Inhaltsdaten, Nutzungsdaten, Metadaten, ggf. personenbezogene Daten",
    betroffenePersonen: "Beschäftigte, Kunden, Interessenten, sonstige Betroffene je Use Case",
    technischeMassnahmen: "Datenminimierung, Rollen- und Berechtigungskonzept, Anbieterprüfung, Protokollierung",
    pruefintervall: "halbjährlich",
    subauftragnehmerHinweis: "Modellanbieter, Hosting-Partner und nachgelagerte Dienste prüfen",
    notizen: "DSFA-Pflicht und KI-VO-Risikoklasse gesondert prüfen",
  },
  dsdms_avv_standard: {
    auftragsverarbeiter: "Muster Cloud & Hosting Services GmbH",
    gegenstand: "SaaS-Bereitstellung, Hosting von Kundendaten und E-Mail-Infrastruktur",
    vertragsdatum: new Date().toISOString().slice(0, 10),
    laufzeit: "unbefristet für die Dauer der Leistungserbringung",
    status: "aktiv",
    sccs: true,
    datenarten: "Stammdaten, Kontaktdaten, Kommunikationsinhalte, Metadaten",
    betroffenePersonen: "Kunden, Beschäftigte, Interessenten",
    technischeMassnahmen: "AES-Verschlüsselung, MFA für Admins, ISO 27001 Zertifizierung, SOC-2 Reports",
    pruefintervall: "jährlich",
    subauftragnehmerHinweis: "Subprozessor-Änderungen sind 30 Tage vorab anzukündigen.",
    notizen: "Sehr solider Standard-AVV, Härtung durch Standarddatenschutzklauseln (SCCs).",
  },
  dsdms_avv_hosting: {
    auftragsverarbeiter: "Muster Host & Serverzentrum KG",
    gegenstand: "Bereitstellung von dedizierter Server-Infrastruktur und RZ-Housing",
    vertragsdatum: new Date().toISOString().slice(0, 10),
    laufzeit: "Mindestlaufzeit 12 Monate, danach Verlängerung um 12 Monate",
    status: "aktiv",
    sccs: false,
    datenarten: "Sämtliche auf den gehosteten Systemen verarbeiteten Daten",
    betroffenePersonen: "Kunden, Partner, Beschäftigte",
    technischeMassnahmen: "Physische Zutrittskontrolle, redundante USV, Videoüberwachung RZ-Flächen, Notstromdiesel",
    pruefintervall: "jährlich",
    subauftragnehmerHinweis: "Einbindung von Unterauftragnehmern für RZ-Wachschutz und Facility-Betrieb zulässig.",
    notizen: "Reiner Infrastruktur-AVV. Eigene Datenverschlüsselung (LUKS/dm-crypt) auf Betriebssystemebene einrichten.",
  },
  dsdms_avv_support: {
    auftragsverarbeiter: "Muster IT-Systemhaus & Support GmbH",
    gegenstand: "Externer Second-Level-Support, Administration und Fernwartung der IT-Infrastruktur",
    vertragsdatum: new Date().toISOString().slice(0, 10),
    laufzeit: "unbefristet mit einer Kündigungsfrist von 3 Monaten",
    status: "aktiv",
    sccs: false,
    datenarten: "Systemkonfigurationen, Logdaten, Stichproben von Anwenderdaten bei Tickets",
    betroffenePersonen: "Beschäftigte (Anwender)",
    technischeMassnahmen: "VPN-Zugriff geschützt mit 2FA, detailliertes Client-Session-Logging, verschlüsselte Ticketdatenbank",
    pruefintervall: "jährlich",
    subauftragnehmerHinweis: "Keine Unterbeauftragung ohne vorherige schriftliche Zustimmung des Auftraggebers.",
    notizen: "Besonderer Fokus auf restriktive Vergabe von temporären Admin-Rechten und Session-Logging.",
  },
};

function AvvForm({ initial, onSave, onCancel }: any) {
  const { t } = useI18n();
  const [selectedTemplate, setSelectedTemplate] = useState("none");
  const [form, setForm] = useState({ auftragsverarbeiter: "", gegenstand: "", vertragsdatum: "", laufzeit: "", status: "aktiv", sccs: false, avKontaktName: "", avKontaktEmail: "", avKontaktTelefon: "", genehmigteSubdienstleister: "", pruefFaellig: "", datenarten: "", betroffenePersonen: "", technischeMassnahmen: "", pruefintervall: "", subauftragnehmerHinweis: "", notizen: "", ...initial });
  const set = (k: string, v: any) => setForm((p: any) => ({ ...p, [k]: v }));
  const applyTemplate = (value: string) => {
    setSelectedTemplate(value);
    const template = avvTemplates[value];
    if (!template) return;
    setForm((p: any) => ({ ...p, ...template }));
  };
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="col-span-2 space-y-1">
          <Label className="text-xs">{t("avvTemplateLabel")}</Label>
          <Select value={selectedTemplate} onValueChange={applyTemplate}>
            <SelectTrigger className="h-8 text-xs"><SelectValue placeholder={t("selectTemplate")} /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">{t("noTemplate")}</SelectItem>
              <SelectItem value="microsoft365">Microsoft 365</SelectItem>
              <SelectItem value="hosting">Hosting-Anbieter</SelectItem>
              <SelectItem value="newsletter">Newsletter-Dienstleister</SelectItem>
              <SelectItem value="payroll">Lohnabrechnungsdienstleister</SelectItem>
              <SelectItem value="ki">KI-Dienstleister</SelectItem>
              <SelectItem value="dsdms_avv_standard">DSDMS: Standard-AVV (mit SCCs)</SelectItem>
              <SelectItem value="dsdms_avv_hosting">DSDMS: Infrastruktur & Hosting</SelectItem>
              <SelectItem value="dsdms_avv_support">DSDMS: Externer IT-Support</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="col-span-2 space-y-1"><Label className="text-xs">{t("avvProcessor")} *</Label><Input value={form.auftragsverarbeiter} onChange={e => set("auftragsverarbeiter", e.target.value)} className="h-8 text-sm" /></div>
        <div className="col-span-2 space-y-1"><Label className="text-xs">{t("avvSubject")}</Label><Input value={form.gegenstand} onChange={e => set("gegenstand", e.target.value)} className="h-8 text-sm" /></div>
        <div className="space-y-1"><Label className="text-xs">{t("avvContractDate")}</Label><Input type="date" value={form.vertragsdatum} onChange={e => set("vertragsdatum", e.target.value)} className="h-8 text-sm" /></div>
        <div className="space-y-1"><Label className="text-xs">{t("avvTerm")}</Label><Input value={form.laufzeit} onChange={e => set("laufzeit", e.target.value)} className="h-8 text-sm" placeholder={t("avvTermPlaceholder")} /></div>
        <div className="space-y-1"><Label className="text-xs">{t("avvStatusLabel")}</Label>
          <Select value={form.status} onValueChange={v => set("status", v)}>
            <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="entwurf">{t("draft")}</SelectItem><SelectItem value="aktiv">{t("active")}</SelectItem><SelectItem value="gekündigt">{t("terminated")}</SelectItem><SelectItem value="abgelaufen">{t("expired")}</SelectItem></SelectContent>
          </Select>
        </div>
        <div className="space-y-1"><Label className="text-xs">{t("avvContactName")}</Label><Input value={form.avKontaktName || ""} onChange={e => set("avKontaktName", e.target.value)} className="h-8 text-sm" /></div>
        <div className="space-y-1"><Label className="text-xs">{t("avvContactEmail")}</Label><Input type="email" value={form.avKontaktEmail || ""} onChange={e => set("avKontaktEmail", e.target.value)} className="h-8 text-sm" /></div>
        <div className="space-y-1"><Label className="text-xs">{t("avvContactPhone")}</Label><Input value={form.avKontaktTelefon || ""} onChange={e => set("avKontaktTelefon", e.target.value)} className="h-8 text-sm" /></div>
        <div className="space-y-1"><Label className="text-xs">{t("avvNextReview")}</Label><Input type="date" value={form.pruefFaellig} onChange={e => set("pruefFaellig", e.target.value)} className="h-8 text-sm" /></div>
        <div className="space-y-1"><Label className="text-xs">{t("avvReviewInterval")}</Label><Input value={form.pruefintervall} onChange={e => set("pruefintervall", e.target.value)} className="h-8 text-sm" placeholder={t("avvReviewIntervalPlaceholder")} /></div>
        <div className="flex items-center gap-2 col-span-2"><input type="checkbox" id="sccs" checked={!!form.sccs} onChange={e => set("sccs", e.target.checked)} className="rounded" /><Label htmlFor="sccs" className="text-xs">{t("sccPresent")}</Label></div>
        <div className="col-span-2 space-y-1"><Label className="text-xs">{t("avvDataTypes")}</Label><Textarea value={form.datenarten} onChange={e => set("datenarten", e.target.value)} className="text-sm min-h-12" /></div>
        <div className="col-span-2 space-y-1"><Label className="text-xs">{t("avvDataSubjects")}</Label><Textarea value={form.betroffenePersonen} onChange={e => set("betroffenePersonen", e.target.value)} className="text-sm min-h-12" /></div>
        <div className="col-span-2 space-y-1"><Label className="text-xs">{t("avvToms")}</Label><Textarea value={form.technischeMassnahmen} onChange={e => set("technischeMassnahmen", e.target.value)} className="text-sm min-h-12" /></div>
        <div className="col-span-2 space-y-1"><Label className="text-xs">{t("avvApprovedSubprocessors")}</Label><Textarea value={form.genehmigteSubdienstleister || ""} onChange={e => set("genehmigteSubdienstleister", e.target.value)} className="text-sm min-h-12" placeholder={t("avvSubprocessorsPlaceholder")} /></div>
        <div className="col-span-2 space-y-1"><Label className="text-xs">{t("avvSubprocessorNote")}</Label><Textarea value={form.subauftragnehmerHinweis} onChange={e => set("subauftragnehmerHinweis", e.target.value)} className="text-sm min-h-12" /></div>
        <div className="col-span-2 space-y-1"><Label className="text-xs">{t("avvNotes")}</Label><Textarea value={form.notizen} onChange={e => set("notizen", e.target.value)} className="text-sm min-h-16" /></div>
      </div>
      <DialogFooter>
        <Button variant="outline" size="sm" onClick={onCancel}>{t("cancel")}</Button>
        <Button size="sm" className="bg-primary" onClick={() => onSave(form)} disabled={!form.auftragsverarbeiter}>{t("save")}</Button>
      </DialogFooter>
    </div>
  );
}

function AvvPage() {
  const { t } = useI18n();
  const [location, setLocation] = useLocation();
  const { activeMandantId } = useMandant();
  const qc = useQueryClient();
  const { data, isLoading, create, update, remove } = useModuleData("avv");
  const { data: aufgaben = [] } = useModuleData("aufgaben");
  const { data: pdca = [] } = useModuleData("pdca");
  const [modal, setModal] = useState<null | "new" | any>(null);
  const [delId, setDelId] = useState<number | null>(null);
  const [avvFilter, setAvvFilterState] = useState<"all" | "copilot" | "copilot-missing-review" | "review-overdue" | "review-missing" | "inactive" | "scc-missing">("all");
  const [avvSort, setAvvSortState] = useState<"review" | "name" | "status">("review");
  const { toast } = useToast();

  useEffect(() => {
    const route = new URL(location, "https://privashield.local");
    const rawFilter = route.searchParams.get("filter");
    const rawSort = route.searchParams.get("sort");
    setAvvFilterState(rawFilter === "copilot" || rawFilter === "copilot-missing-review" || rawFilter === "review-overdue" || rawFilter === "review-missing" || rawFilter === "inactive" || rawFilter === "scc-missing" ? rawFilter : "all");
    setAvvSortState(rawSort === "name" || rawSort === "status" ? rawSort : "review");
  }, [location]);

  const updateAvvRouteState = (nextFilter: "all" | "copilot" | "copilot-missing-review" | "review-overdue" | "review-missing" | "inactive" | "scc-missing", nextSort: "review" | "name" | "status") => {
    const next = new URL(location, "https://privashield.local");
    if (nextFilter === "all") next.searchParams.delete("filter");
    else next.searchParams.set("filter", nextFilter);
    if (nextSort === "review") next.searchParams.delete("sort");
    else next.searchParams.set("sort", nextSort);
    setLocation(`${next.pathname}${next.search}`);
  };

  const setAvvFilter = (value: "all" | "copilot" | "copilot-missing-review" | "review-overdue" | "review-missing" | "inactive" | "scc-missing") => {
    setAvvFilterState(value);
    updateAvvRouteState(value, avvSort);
  };
  const setAvvSort = (value: "review" | "name" | "status") => {
    setAvvSortState(value);
    updateAvvRouteState(avvFilter, value);
  };

  const save = (form: any) => {
    const p = modal === "new" ? create.mutateAsync(form) : update.mutateAsync({ id: modal.id, ...form });
    p.then(() => { setModal(null); toast({ title: "Gespeichert" }); }).catch((e:any) => toast({ title: "Fehler", description: e?.message || "Speichern fehlgeschlagen", variant: "destructive" }));
  };

  const today = new Date().toISOString().split("T")[0];
  const isCopilotAvv = (item: any) => /microsoft/i.test(String(item?.auftragsverarbeiter || "")) || /copilot/i.test(String(item?.gegenstand || ""));
  const needsScc = (item: any) => isCopilotAvv(item) || /usa|us|drittland|international|global/i.test(String(item?.gegenstand || "")) || /microsoft|aws|google|openai/i.test(String(item?.auftragsverarbeiter || ""));
  const getAvvMeta = (item: any) => {
    const reviewDate = String(item?.pruefFaellig || "").trim();
    const reviewMissing = !reviewDate;
    const reviewOverdue = !!reviewDate && reviewDate < today;
    const inactive = ["entwurf", "gekündigt", "inaktiv", "abgelaufen"].includes(String(item?.status || "").toLowerCase());
    const sccMissing = needsScc(item) && !item?.sccs;
    return { reviewDate, reviewMissing, reviewOverdue, inactive, sccMissing, isCopilot: isCopilotAvv(item) };
  };

  const avvReviewOverdueItems = data.filter((item: any) => getAvvMeta(item).reviewOverdue);
  const avvReviewMissingItems = data.filter((item: any) => getAvvMeta(item).reviewMissing);
  const avvInactiveItems = data.filter((item: any) => getAvvMeta(item).inactive);
  const avvSccMissingItems = data.filter((item: any) => getAvvMeta(item).sccMissing);
  const copilotMissingReviewItems = data.filter((item: any) => getAvvMeta(item).isCopilot && getAvvMeta(item).reviewMissing);

  const buildAvvTaskDraft = (item: any, kind: "review-overdue" | "review-missing" | "inactive" | "scc-missing" | "copilot-missing-review") => {
    const drafts: Record<string, { title: string; priority: string; description: string }> = {
      "review-overdue": {
        title: `AVV-Review nachziehen: ${item.auftragsverarbeiter}`,
        priority: "hoch",
        description: `Der AVV mit "${item.auftragsverarbeiter}" ist zur Prüfung fällig oder überfällig. Bitte Vertrag, TOM-Nachweise, Subdienstleister und dokumentierte Prüfergebnisse kurzfristig aktualisieren.`,
      },
      "review-missing": {
        title: `Prüffälligkeit für AVV ergänzen: ${item.auftragsverarbeiter}`,
        priority: "mittel",
        description: `Für den AVV mit "${item.auftragsverarbeiter}" fehlt bislang ein Reviewtermin. Bitte Prüffrist, Verantwortlichkeit und Prüfturnus verbindlich festlegen.`,
      },
      inactive: {
        title: `AVV-Status klären: ${item.auftragsverarbeiter}`,
        priority: "mittel",
        description: `Der AVV mit "${item.auftragsverarbeiter}" ist nicht aktiv oder nur im Entwurfsstatus. Bitte Vertragslage, operative Nutzung und notwendige Folgeaktionen prüfen.`,
      },
      "scc-missing": {
        title: `SCC-/Drittlandlage prüfen: ${item.auftragsverarbeiter}`,
        priority: "hoch",
        description: `Beim AVV mit "${item.auftragsverarbeiter}" besteht ein möglicher Drittland- oder internationaler Kontext, aber SCCs sind nicht dokumentiert. Bitte Transfergrundlage, DPA und Schutzmaßnahmen prüfen.`,
      },
      "copilot-missing-review": {
        title: `Copilot-/Microsoft-AVV prüfen: ${item.auftragsverarbeiter}`,
        priority: "hoch",
        description: `Für den Copilot-/Microsoft-bezogenen AVV mit "${item.auftragsverarbeiter}" fehlt ein dokumentierter Reviewtermin. Bitte DPA, Product Terms, Subprozessoren und Prüffälligkeit nachziehen.`,
      },
    };
    const draft = drafts[kind];
    const params = new URLSearchParams({
      draftTitle: draft.title,
      draftPriority: draft.priority,
      draftDescription: draft.description,
      draftSource: `avv:${kind}:${item.id}`,
    });
    return { href: `/aufgaben?${params.toString()}`, title: draft.title, priority: draft.priority, description: draft.description, source: `avv:${kind}:${item.id}` };
  };

  const createAvvFollowUpTask = async (item: any, kind: "review-overdue" | "review-missing" | "inactive" | "scc-missing" | "copilot-missing-review") => {
    const draft = buildAvvTaskDraft(item, kind);
    const duplicate = aufgaben.find((task: any) => String(task?.vorlagenBezug || "") === draft.source && String(task?.status || "") !== "erledigt");
    if (duplicate) {
      toast({ title: "Aufgabe bereits vorhanden", description: `Offene Folgeaufgabe gefunden: ${duplicate.titel}` });
      return;
    }
    await apiRequest("POST", `/api/mandanten/${activeMandantId}/aufgaben`, {
      titel: draft.title,
      beschreibung: draft.description,
      typ: "review",
      prioritaet: draft.priority,
      status: "offen",
      fortschritt: 0,
      verantwortlicher: "",
      faelligAm: getAvvMeta(item).reviewDate || "",
      kategorie: "avv",
      referenzId: item.id,
      vorlagenBezug: draft.source,
    });
    await qc.invalidateQueries({ queryKey: [`/api/mandanten/${activeMandantId}/aufgaben`] });
    toast({ title: "Folgeaufgabe erstellt", description: draft.title });
  };

  const createAvvPdcaCycle = async (item: any, kind: "review-overdue" | "review-missing" | "inactive" | "scc-missing" | "copilot-missing-review") => {
    const source = `avv-pdca:${kind}:${item.id}`;
    const duplicate = pdca.find((entry: any) => String(entry?.actNaechsterZyklus || "").includes(source) && String(entry?.status || "") !== "abgeschlossen");
    if (duplicate) {
      toast({ title: "PDCA bereits vorhanden", description: `Offener Zyklus gefunden: ${duplicate.titel}` });
      return;
    }
    const reviewDate = new Date();
    reviewDate.setDate(reviewDate.getDate() + (kind === "review-overdue" || kind === "scc-missing" || kind === "copilot-missing-review" ? 14 : 30));
    const titleMap: Record<string, string> = {
      "review-overdue": `PDCA AVV-Review: ${item.auftragsverarbeiter}`,
      "review-missing": `PDCA Prüffälligkeit AVV: ${item.auftragsverarbeiter}`,
      inactive: `PDCA AVV-Statusklärung: ${item.auftragsverarbeiter}`,
      "scc-missing": `PDCA SCC-/Transferprüfung: ${item.auftragsverarbeiter}`,
      "copilot-missing-review": `PDCA Copilot-/Microsoft-AVV: ${item.auftragsverarbeiter}`,
    };
    const measureMap: Record<string, string> = {
      "review-overdue": "AVV, TOM-Nachweise, Subdienstleister und Prüfdokumentation kurzfristig aktualisieren.",
      "review-missing": "Prüfturnus, Reviewdatum und Verantwortlichkeit verbindlich festlegen.",
      inactive: "Vertragsstatus, operative Nutzung und etwaige Neuverhandlung oder Beendigung bewerten.",
      "scc-missing": "Transfergrundlage, SCCs, Drittlandkontext und zusätzliche Schutzmaßnahmen bewerten.",
      "copilot-missing-review": "DPA/Product Terms, Subprozessoren, EU-Data-Boundary-Kontext und Reviewturnus dokumentieren.",
    };
    const pdcaItem = await apiRequest("POST", `/api/mandanten/${activeMandantId}/pdca`, {
      titel: titleMap[kind],
      beschreibung: `Automatisch vorbereiteter Verbesserungszyklus für den AVV mit "${item.auftragsverarbeiter}".`,
      zyklusTyp: "management_review",
      status: "geplant",
      prioritaet: kind === "review-overdue" || kind === "scc-missing" || kind === "copilot-missing-review" ? "hoch" : "mittel",
      verantwortlicher: item.avKontaktName || "",
      naechstePruefungAm: reviewDate.toISOString().split("T")[0],
      planRisiken: `${item.gegenstand || ""}\n\nStatus: ${item.status || "—"}\nPrüffälligkeit: ${item.pruefFaellig || "offen"}`.trim(),
      planMassnahmen: measureMap[kind],
      planZiele: `AVV-Lage zu ${item.auftragsverarbeiter} belastbar dokumentieren und nachsteuern.`,
      actNaechsterZyklus: source,
      verknuepftesAuditId: null,
    }).then(r => r.json());

    await apiRequest("POST", `/api/mandanten/${activeMandantId}/aufgaben`, {
      titel: `${titleMap[kind]} – Folgeaufgabe`,
      beschreibung: `Operative Folgeaufgabe zum PDCA-Zyklus "${titleMap[kind]}" für den AVV mit "${item.auftragsverarbeiter}".`,
      typ: "review",
      prioritaet: kind === "review-overdue" || kind === "scc-missing" || kind === "copilot-missing-review" ? "hoch" : "mittel",
      status: "offen",
      fortschritt: 0,
      verantwortlicher: item.avKontaktName || "",
      faelligAm: reviewDate.toISOString().split("T")[0],
      kategorie: "avv",
      referenzId: pdcaItem.id,
      vorlagenBezug: "pdca_follow_up",
    });
    await qc.invalidateQueries({ queryKey: [`/api/mandanten/${activeMandantId}/pdca`] });
    await qc.invalidateQueries({ queryKey: [`/api/mandanten/${activeMandantId}/aufgaben`] });
    toast({ title: "PDCA-Zyklus erstellt", description: titleMap[kind] });
  };

  const filteredData = data.filter((item: any) => {
    const meta = getAvvMeta(item);
    if (avvFilter === "copilot") return meta.isCopilot;
    if (avvFilter === "copilot-missing-review") return meta.isCopilot && meta.reviewMissing;
    if (avvFilter === "review-overdue") return meta.reviewOverdue;
    if (avvFilter === "review-missing") return meta.reviewMissing;
    if (avvFilter === "inactive") return meta.inactive;
    if (avvFilter === "scc-missing") return meta.sccMissing;
    return true;
  }).slice().sort((a: any, b: any) => {
    const metaA = getAvvMeta(a);
    const metaB = getAvvMeta(b);
    if (avvSort === "name") return String(a.auftragsverarbeiter || "").localeCompare(String(b.auftragsverarbeiter || ""), "de");
    if (avvSort === "status") return String(a.status || "").localeCompare(String(b.status || ""), "de") || String(a.auftragsverarbeiter || "").localeCompare(String(b.auftragsverarbeiter || ""), "de");
    const reviewA = metaA.reviewDate || "9999-12-31";
    const reviewB = metaB.reviewDate || "9999-12-31";
    return reviewA.localeCompare(reviewB, "de") || String(a.auftragsverarbeiter || "").localeCompare(String(b.auftragsverarbeiter || ""), "de");
  });

  return (
    <MandantGuard>
      <PageHeader title={t("avvTitle")} desc={t("avvDesc")}
        action={<Button size="sm" className="bg-primary h-8 text-xs gap-1.5" onClick={() => setModal("new")}><Plus className="h-3.5 w-3.5" />Neu</Button>} />
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">AVV-Quick-Check</CardTitle>
            <CardDescription>Schneller Blick auf Reviewlücken, SCC-/Transferfragen und inaktive Vertragsstände</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {data.length === 0 ? (
              <p className="text-muted-foreground">Aktuell keine AVV-Verträge dokumentiert.</p>
            ) : (
              <>
                {avvReviewOverdueItems.length > 0 && <p className="text-red-400">Überfällige AVV-Reviews: {avvReviewOverdueItems.length}</p>}
                {avvSccMissingItems.length > 0 && <p className="text-red-400">AVV mit möglichem SCC-/Drittlandbedarf ohne SCC-Markierung: {avvSccMissingItems.length}</p>}
                {copilotMissingReviewItems.length > 0 && <p className="text-yellow-400">Copilot-/Microsoft-AVV ohne Prüffälligkeit: {copilotMissingReviewItems.length}</p>}
                {avvReviewMissingItems.length > 0 && <p className="text-yellow-400">AVV ohne Reviewtermin: {avvReviewMissingItems.length}</p>}
                {avvInactiveItems.length > 0 && <p className="text-muted-foreground">AVV mit nicht aktivem Status: {avvInactiveItems.length}</p>}
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">AVV-Fokusliste</CardTitle>
            <CardDescription>Priorisierte Vertrags- und Reviewfälle mit unmittelbarem Governance-Bedarf</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {avvReviewOverdueItems.length === 0 && avvReviewMissingItems.length === 0 && avvSccMissingItems.length === 0 && copilotMissingReviewItems.length === 0 && avvInactiveItems.length === 0 ? (
              <p className="text-muted-foreground">Aktuell keine priorisierten AVV-Fälle.</p>
            ) : (
              <>
                {avvReviewOverdueItems.slice(0, 3).map((item: any) => (
                  <div key={`review-overdue-${item.id}`} className="rounded-lg border border-red-500/20 bg-red-500/5 p-3">
                    <p className="font-medium text-red-700 dark:text-red-400">AVV-Review überfällig: {item.auftragsverarbeiter}</p>
                    <p className="text-xs text-muted-foreground">Empfehlung: Review, Nachweise und Prüfergebnis kurzfristig aktualisieren.</p>
                    <div className="mt-2 flex gap-2"><Button type="button" size="sm" variant="outline" onClick={() => setAvvFilter("review-overdue")}>Nur diese Fälle</Button><Button type="button" size="sm" variant="secondary" onClick={() => createAvvFollowUpTask(item, "review-overdue")}>Aufgabe erzeugen</Button><Button type="button" size="sm" variant="secondary" onClick={() => createAvvPdcaCycle(item, "review-overdue")}>PDCA erzeugen</Button><Link href={buildAvvTaskDraft(item, "review-overdue").href}><a className="text-xs text-primary hover:underline self-center">Aufgabe vorbereiten</a></Link></div>
                  </div>
                ))}
                {avvSccMissingItems.slice(0, 3).map((item: any) => (
                  <div key={`scc-missing-${item.id}`} className="rounded-lg border border-red-500/20 bg-red-500/5 p-3">
                    <p className="font-medium text-red-700 dark:text-red-400">SCC-/Transferprüfung offen: {item.auftragsverarbeiter}</p>
                    <p className="text-xs text-muted-foreground">Empfehlung: Transfergrundlage, SCCs und zusätzliche Schutzmaßnahmen bewerten.</p>
                    <div className="mt-2 flex gap-2"><Button type="button" size="sm" variant="outline" onClick={() => setAvvFilter("scc-missing")}>Nur diese Fälle</Button><Button type="button" size="sm" variant="secondary" onClick={() => createAvvFollowUpTask(item, "scc-missing")}>Aufgabe erzeugen</Button><Button type="button" size="sm" variant="secondary" onClick={() => createAvvPdcaCycle(item, "scc-missing")}>PDCA erzeugen</Button><Link href={buildAvvTaskDraft(item, "scc-missing").href}><a className="text-xs text-primary hover:underline self-center">Aufgabe vorbereiten</a></Link></div>
                  </div>
                ))}
                {copilotMissingReviewItems.slice(0, 3).map((item: any) => (
                  <div key={`copilot-missing-review-${item.id}`} className="rounded-lg border border-yellow-500/20 bg-yellow-500/5 p-3">
                    <p className="font-medium text-yellow-700 dark:text-yellow-400">Copilot-/Microsoft-AVV ohne Prüftermin: {item.auftragsverarbeiter}</p>
                    <p className="text-xs text-muted-foreground">Empfehlung: DPA/Product Terms, Subprozessoren und Reviewturnus strukturiert nachziehen.</p>
                    <div className="mt-2 flex gap-2"><Button type="button" size="sm" variant="outline" onClick={() => setAvvFilter("copilot-missing-review")}>Nur diese Fälle</Button><Button type="button" size="sm" variant="secondary" onClick={() => createAvvFollowUpTask(item, "copilot-missing-review")}>Aufgabe erzeugen</Button><Button type="button" size="sm" variant="secondary" onClick={() => createAvvPdcaCycle(item, "copilot-missing-review")}>PDCA erzeugen</Button><Link href={buildAvvTaskDraft(item, "copilot-missing-review").href}><a className="text-xs text-primary hover:underline self-center">Aufgabe vorbereiten</a></Link></div>
                  </div>
                ))}
                {avvReviewMissingItems.slice(0, 3).filter((item: any) => !getAvvMeta(item).isCopilot).map((item: any) => (
                  <div key={`review-missing-${item.id}`} className="rounded-lg border border-yellow-500/20 bg-yellow-500/5 p-3">
                    <p className="font-medium text-yellow-700 dark:text-yellow-400">AVV ohne Reviewtermin: {item.auftragsverarbeiter}</p>
                    <p className="text-xs text-muted-foreground">Empfehlung: Prüffälligkeit, Turnus und Verantwortlichkeit festziehen.</p>
                    <div className="mt-2 flex gap-2"><Button type="button" size="sm" variant="outline" onClick={() => setAvvFilter("review-missing")}>Nur diese Fälle</Button><Button type="button" size="sm" variant="secondary" onClick={() => createAvvFollowUpTask(item, "review-missing")}>Aufgabe erzeugen</Button><Button type="button" size="sm" variant="secondary" onClick={() => createAvvPdcaCycle(item, "review-missing")}>PDCA erzeugen</Button><Link href={buildAvvTaskDraft(item, "review-missing").href}><a className="text-xs text-primary hover:underline self-center">Aufgabe vorbereiten</a></Link></div>
                  </div>
                ))}
                {avvInactiveItems.slice(0, 3).map((item: any) => (
                  <div key={`inactive-${item.id}`} className="rounded-lg border border-slate-500/20 bg-slate-500/5 p-3">
                    <p className="font-medium text-slate-700 dark:text-slate-300">AVV-Status nicht aktiv: {item.auftragsverarbeiter}</p>
                    <p className="text-xs text-muted-foreground">Empfehlung: Vertragsstand, Nutzung und Folgeentscheidungen fachlich klären.</p>
                    <div className="mt-2 flex gap-2"><Button type="button" size="sm" variant="outline" onClick={() => setAvvFilter("inactive")}>Nur diese Fälle</Button><Button type="button" size="sm" variant="secondary" onClick={() => createAvvFollowUpTask(item, "inactive")}>Aufgabe erzeugen</Button><Button type="button" size="sm" variant="secondary" onClick={() => createAvvPdcaCycle(item, "inactive")}>PDCA erzeugen</Button><Link href={buildAvvTaskDraft(item, "inactive").href}><a className="text-xs text-primary hover:underline self-center">Aufgabe vorbereiten</a></Link></div>
                  </div>
                ))}
              </>
            )}
          </CardContent>
        </Card>

        <div className="flex gap-2 mb-1 flex-wrap">
          <Button type="button" size="sm" variant={avvFilter === "all" ? "default" : "outline"} onClick={() => setAvvFilter("all")}>Alle</Button>
          <Button type="button" size="sm" variant={avvFilter === "review-overdue" ? "default" : "outline"} onClick={() => setAvvFilter("review-overdue")}>Review überfällig</Button>
          <Button type="button" size="sm" variant={avvFilter === "review-missing" ? "default" : "outline"} onClick={() => setAvvFilter("review-missing")}>Ohne Reviewtermin</Button>
          <Button type="button" size="sm" variant={avvFilter === "scc-missing" ? "default" : "outline"} onClick={() => setAvvFilter("scc-missing")}>SCC prüfen</Button>
          <Button type="button" size="sm" variant={avvFilter === "inactive" ? "default" : "outline"} onClick={() => setAvvFilter("inactive")}>Nicht aktiv</Button>
          <Button type="button" size="sm" variant={avvFilter === "copilot" ? "default" : "outline"} onClick={() => setAvvFilter("copilot")}>Copilot / Microsoft</Button>
          <Button type="button" size="sm" variant={avvFilter === "copilot-missing-review" ? "default" : "outline"} onClick={() => setAvvFilter("copilot-missing-review")}>Copilot ohne Prüftermin</Button>
        </div>
        <div className="flex gap-2 mb-4 flex-wrap items-center">
          <span className="text-xs text-muted-foreground">Sortierung:</span>
          <Button type="button" size="sm" variant={avvSort === "review" ? "default" : "outline"} onClick={() => setAvvSort("review")}>Review</Button>
          <Button type="button" size="sm" variant={avvSort === "name" ? "default" : "outline"} onClick={() => setAvvSort("name")}>Name</Button>
          <Button type="button" size="sm" variant={avvSort === "status" ? "default" : "outline"} onClick={() => setAvvSort("status")}>Status</Button>
        </div>
        {isLoading ? <Skeleton className="h-32 w-full" /> : (
          <div className="space-y-2">
            {filteredData.length === 0 && <Card className="border-dashed"><CardContent className="py-12 text-center text-sm text-muted-foreground">Keine AVV-Verträge in dieser Ansicht.</CardContent></Card>}
            {data.length === 0 && <Card className="border-dashed"><CardContent className="py-12 text-center text-sm text-muted-foreground">Noch keine AVV-Verträge vorhanden.</CardContent></Card>}
            {filteredData.map((item: any) => {
              const meta = getAvvMeta(item);
              return (
                <Card key={item.id} className={`group hover:border-border/80 transition-colors ${meta.reviewOverdue || meta.sccMissing ? "border-red-500/30" : meta.reviewMissing ? "border-yellow-500/30" : ""}`}>
                  <CardContent className="py-3 px-4 flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center sm:gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <Shield className={`h-4 w-4 shrink-0 ${meta.reviewOverdue || meta.sccMissing ? "text-red-400" : meta.reviewMissing ? "text-yellow-400" : "text-blue-400"}`} />
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{item.auftragsverarbeiter}</p>
                        <p className="text-xs text-muted-foreground">{item.gegenstand || "—"}{item.vertragsdatum ? ` · ${item.vertragsdatum}` : ""}{item.sccs ? " · SCCs vorhanden" : " · SCCs nicht markiert"}</p>
                        <p className="text-xs text-muted-foreground">Prüffälligkeit: {meta.reviewDate || "offen"}{meta.isCopilot ? " · Copilot/Microsoft" : ""}{meta.inactive ? " · Status prüfen" : ""}</p>
                      </div>
                    </div>
                    <div className="flex w-full items-center justify-between gap-2 shrink-0 sm:w-auto sm:justify-end">
                      <div className="flex items-center gap-2 flex-wrap justify-end">
                        {meta.reviewOverdue && <Badge variant="outline" className="text-xs border-red-500/40 text-red-600">Review überfällig</Badge>}
                        {meta.reviewMissing && <Badge variant="outline" className="text-xs border-yellow-500/40 text-yellow-600">Review offen</Badge>}
                        {meta.sccMissing && <Badge variant="outline" className="text-xs border-red-500/40 text-red-600">SCC prüfen</Badge>}
                        {meta.isCopilot && <Badge variant="outline" className="text-xs border-blue-500/40 text-blue-600">Copilot</Badge>}
                        <StatusBadge value={item.status} />
                      </div>
                      <button onClick={() => setModal(item)} className="p-1 rounded text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-all"><Pencil className="h-3.5 w-3.5" /></button>
                      <button onClick={() => setDelId(item.id)} className="p-1 rounded text-muted-foreground hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"><Trash2 className="h-3.5 w-3.5" /></button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
      <Dialog open={!!modal} onOpenChange={o => !o && setModal(null)}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto"><div className="sticky top-0 z-10 -mx-6 border-b bg-background px-6 pb-3 pt-1"><DialogHeader><DialogTitle>{modal === "new" ? "Neuer AVV" : "AVV bearbeiten"}</DialogTitle></DialogHeader></div>
          {modal && <AvvForm initial={modal === "new" ? {} : modal} onSave={save} onCancel={() => setModal(null)} />}
        </DialogContent>
      </Dialog>
      <ConfirmDialog open={delId !== null} title="AVV löschen?" desc="Dieser Vorgang kann nicht rückgängig gemacht werden."
        onConfirm={() => { remove.mutate(delId!); setDelId(null); }} onCancel={() => setDelId(null)} />
    </MandantGuard>
  );
}

// ─── DSFA PAGE ─────────────────────────────────────────────────────────────
const dsfaTemplates: Record<string, any> = {
  none: null,
  ki: {
    titel: "DSFA für KI-gestützte Verarbeitung",
    beschreibung: "Bewertung eines KI-gestützten Verarbeitungsprozesses mit möglicher Auswirkung auf Rechte und Freiheiten betroffener Personen.",
    notwendigkeit: "Prüfung, ob der KI-Einsatz für den festgelegten Zweck erforderlich und verhältnismäßig ist.",
    massnahmen: "Datenminimierung, menschliche Kontrolle, Anbieterprüfung, Logging, Zugriffsbegrenzung, Transparenzmaßnahmen",
    ergebnis: "bedingt",
    status: "entwurf",
    risikoquelle: "Automatisierte Bewertung / KI-Einsatz",
    betroffeneGruppen: "Beschäftigte, Kunden, Interessenten",
    datenarten: "Prompt-Daten, Inhaltsdaten, Kontextdaten, Metadaten",
    eintrittswahrscheinlichkeit: "mittel",
    schweregrad: "hoch",
    restrisiko: "mittel",
    konsultation: false,
  },
  video: {
    titel: "DSFA für Videoüberwachung",
    beschreibung: "Bewertung der Videoüberwachung unter Berücksichtigung von Eingriffsintensität, Speicherfristen und Transparenz.",
    notwendigkeit: "Prüfung der Erforderlichkeit zur Wahrung des Hausrechts und zur Vorfallaufklärung.",
    massnahmen: "Beschilderung, kurze Speicherfrist, eingeschränkter Zugriff, dokumentierte Auswertungsvorgaben",
    ergebnis: "bedingt",
    status: "entwurf",
    risikoquelle: "Systematische Überwachung öffentlich zugänglicher Bereiche",
    betroffeneGruppen: "Besucher, Beschäftigte, Lieferanten",
    datenarten: "Bilddaten, Zeitstempel, Standortbezug",
    eintrittswahrscheinlichkeit: "mittel",
    schweregrad: "hoch",
    restrisiko: "mittel",
    konsultation: false,
  },
  biometrie: {
    titel: "DSFA für biometrische Verarbeitung",
    beschreibung: "Bewertung biometrischer Verfahren, etwa Zutritts- oder Zeiterfassung mit sensiblen Merkmalen.",
    notwendigkeit: "Prüfung, ob mildere Mittel zur Zweckerreichung bestehen.",
    massnahmen: "Alternativverfahren, Verschlüsselung, getrennte Speicherung, enge Berechtigungskonzepte",
    ergebnis: "nicht_akzeptabel",
    status: "entwurf",
    risikoquelle: "Verarbeitung besonderer Kategorien personenbezogener Daten",
    betroffeneGruppen: "Beschäftigte, Besucher",
    datenarten: "Biometrische Merkmale, Identitätsdaten, Protokolldaten",
    eintrittswahrscheinlichkeit: "hoch",
    schweregrad: "hoch",
    restrisiko: "hoch",
    konsultation: true,
  },
};

function DsfaForm({ initial, onSave, onCancel }: any) {
  const { t } = useI18n();
  const { data: dokumente = [] } = useModuleData("dokumente");
  const { data: vvts = [] } = useModuleData("vvt");
  const { data: toms = [] } = useModuleData("tom");
  const kiComplianceCheck = dokumente.find((d: any) => d.kategorie === "prozessbeschreibung" && d.dokumentTyp === "ki_compliance_check");
  const kiTools = (() => {
    try {
      const parsed = JSON.parse(kiComplianceCheck?.inhalt || "{}");
      return Array.isArray(parsed.tools) ? parsed.tools : [];
    } catch {
      return [];
    }
  })();
  const defaultRisk = {
    titel: "",
    beschreibung: "",
    betroffeneRechte: "",
    betroffeneGruppen: "",
    datenarten: "",
    ursache: "",
    bestehendeKontrollen: "",
    eintrittswahrscheinlichkeit: "",
    schweregrad: "",
    inhärentesRisiko: "",
    restrisiko: "",
    weitereMassnahmen: "",
    verantwortlicher: "",
    status: "offen",
  };
  const normalizeRisiken = (value: any) => {
    if (Array.isArray(value)) return value.length ? value : [defaultRisk];
    if (typeof value === "string") {
      try {
        const parsed = JSON.parse(value);
        return Array.isArray(parsed) && parsed.length ? parsed.map((risk: any) => ({ ...defaultRisk, ...risk })) : [defaultRisk];
      } catch {
        return [defaultRisk];
      }
    }
    return [defaultRisk];
  };
  const [selectedTemplate, setSelectedTemplate] = useState("none");
  const [form, setForm] = useState(() => {
    const initialData = initial || {};
    return {
      titel: "",
      vvtId: undefined,
      beschreibung: "",
      zweck: "",
      prozessablauf: "",
      verarbeitungskontext: "",
      datenquellen: "",
      empfaenger: "",
      drittlandtransfer: false,
      auftragsverarbeiter: "",
      technologienSysteme: "",
      profiling: false,
      automatisierteEntscheidung: false,
      notwendigkeit: "",
      rechtsgrundlage: "",
      zweckbindungBewertung: "",
      datenminimierungBewertung: "",
      speicherbegrenzungBewertung: "",
      transparenzBewertung: "",
      betroffenenrechteBewertung: "",
      zugriffskonzeptBewertung: "",
      privacyByDesignBewertung: "",
      massnahmen: "",
      restrisikoBegruendung: "",
      art36Erforderlich: false,
      art36Begruendung: "",
      ergebnis: "",
      konsultation: false,
      status: "entwurf",
      reviewer: "",
      verantwortlicherBereich: "",
      dsbBeteiligt: false,
      dsbStellungnahme: "",
      freigabeentscheidung: "",
      freigabeBegruendung: "",
      freigabeDatum: "",
      naechstePruefungAm: "",
      ...initialData,
      risiken: normalizeRisiken(initialData.risiken),
    };
  });
  const set = (k: string, v: any) => setForm((p: any) => ({ ...p, [k]: v }));
  const setRisk = (index: number, key: string, value: any) => setForm((p: any) => ({ ...p, risiken: p.risiken.map((risk: any, i: number) => i === index ? { ...risk, [key]: value } : risk) }));
  const addRisk = () => setForm((p: any) => ({ ...p, risiken: [...p.risiken, { ...defaultRisk }] }));
  const removeRisk = (index: number) => setForm((p: any) => ({ ...p, risiken: p.risiken.length === 1 ? [{ ...defaultRisk }] : p.risiken.filter((_: any, i: number) => i !== index) }));
  const applyVvtPrefill = (vvtIdRaw: string) => {
    const vvtId = Number(vvtIdRaw);
    set("vvtId", Number.isFinite(vvtId) ? vvtId : undefined);
    const selectedVvt = vvts.find((item: any) => item.id === vvtId);
    if (!selectedVvt) return;

    let linkedTomIds: any[] = [];
    try {
      linkedTomIds = JSON.parse(selectedVvt.verknuepfteTomIds || "[]");
      if (!Array.isArray(linkedTomIds)) linkedTomIds = [];
    } catch (e) {
      linkedTomIds = [];
    }

    const matchedToms = toms.filter((tom: any) =>
      linkedTomIds.map(String).includes(String(tom.id))
    );
    const tomCount = matchedToms.length;
    const matchedNames = matchedToms.map((t: any) => `${t.massnahme} (${t.kategorie || "BSI"})`).join(", ");

    const riskTriggers = parseVvtRiskTriggers(selectedVvt.risikoTriggers);
    const inferredRiskTitle = riskTriggers[0] || selectedVvt.risikostufe || "Risikotreiber";

    const bruttoLevel = (selectedVvt.risikostufe || "niedrig").toLowerCase() === "hoch" ? "hoch" :
                        (selectedVvt.risikostufe || "niedrig").toLowerCase() === "mittel" ? "mittel" : "niedrig";

    const reduceLevel = (level: string, steps: number): string => {
      const levels = ["niedrig", "mittel", "hoch"];
      const index = levels.indexOf(level.toLowerCase());
      if (index === -1) return "niedrig";
      return levels[Math.max(0, index - steps)];
    };

    let steps = 0;
    if (tomCount === 1 || tomCount === 2) {
      steps = 1;
    } else if (tomCount >= 3) {
      steps = 2;
    }

    const netLevel = reduceLevel(bruttoLevel, steps);
    const netProbability = reduceLevel(bruttoLevel, steps);
    const netSeverity = reduceLevel(bruttoLevel, steps);

    const autoControls = matchedNames
      ? `Verknüpfte TOMs aus VVT: ${matchedNames}`
      : selectedVvt.tomHinweis || "Keine verknüpften TOMs in VVT hinterlegt.";

    const autoReasoning = `Das Risiko wurde durch die Implementierung von ${tomCount} verknüpften technischen und organisatorischen Maßnahmen (TOMs) von Brutto (${bruttoLevel.toUpperCase()}) auf Netto (${netLevel.toUpperCase()}) minimiert.${matchedNames ? ` Wirksame Maßnahmen: ${matchedNames}.` : ""}`;

    setForm((p: any) => ({
      ...p,
      vvtId,
      titel: p.titel || selectedVvt.bezeichnung || "",
      beschreibung: p.beschreibung || selectedVvt.risikobegruendung || selectedVvt.zweck || "",
      zweck: p.zweck || selectedVvt.zweck || "",
      rechtsgrundlage: p.rechtsgrundlage || selectedVvt.rechtsgrundlage || "",
      empfaenger: p.empfaenger || selectedVvt.empfaenger || "",
      drittlandtransfer: p.drittlandtransfer || !!selectedVvt.drittlandtransfer,
      technologienSysteme: p.technologienSysteme || selectedVvt.tomHinweis || "",
      verantwortlicherBereich: p.verantwortlicherBereich || selectedVvt.verantwortlicher || "",
      speicherbegrenzungBewertung: p.speicherbegrenzungBewertung || selectedVvt.loeschfrist || "",
      notwendigkeit: p.notwendigkeit || `Verarbeitung aus VVT übernommen. Fachliche Prüfung insbesondere im Hinblick auf ${selectedVvt.risikostufe || "dokumentierte"} Risikolage erforderlich.`,
      massnahmen: p.massnahmen || (riskTriggers.length > 0 ? `Aus VVT abgeleitete Schwerpunkte: ${riskTriggers.join(", ")}. Bestehende TOM prüfen und ergänzende Maßnahmen dokumentieren.` : p.massnahmen),
      restrisikoBegruendung: p.restrisikoBegruendung || autoReasoning,
      art36Erforderlich: p.art36Erforderlich || netLevel === "hoch",
      naechstePruefungAm: p.naechstePruefungAm || selectedVvt.risikopruefungAm || "",
      risiken: p.risiken.map((risk: any, idx: number) => idx === 0 ? {
        ...risk,
        titel: risk.titel || inferredRiskTitle,
        beschreibung: risk.beschreibung || selectedVvt.risikobegruendung || selectedVvt.zweck || "",
        betroffeneGruppen: risk.betroffeneGruppen || selectedVvt.betroffenePersonen || "",
        datenarten: risk.datenarten || selectedVvt.datenkategorien || "",
        ursache: risk.ursache || riskTriggers.join(", ") || selectedVvt.bezeichnung || "",
        bestehendeKontrollen: risk.bestehendeKontrollen || autoControls,
        eintrittswahrscheinlichkeit: risk.eintrittswahrscheinlichkeit || netProbability,
        schweregrad: risk.schweregrad || netSeverity,
        inhärentesRisiko: risk.inhärentesRisiko || bruttoLevel,
        restrisiko: risk.restrisiko || netLevel,
        weitereMassnahmen: risk.weitereMassnahmen || (riskTriggers.length > 0 ? `Prüfung und Nachsteuerung zu: ${riskTriggers.join(", ")}` : ""),
      } : risk),
    }));
  };
  const applyTemplate = (value: string) => {
    setSelectedTemplate(value);
    const template = dsfaTemplates[value];
    if (!template) return;
    setForm((p: any) => ({
      ...p,
      ...template,
      zweck: p.zweck || template.beschreibung || "",
      prozessablauf: p.prozessablauf || template.beschreibung || "",
      risiken: [{
        ...defaultRisk,
        titel: template.risikoquelle || template.titel || "Risiko",
        beschreibung: template.beschreibung || "",
        betroffeneGruppen: template.betroffeneGruppen || "",
        datenarten: template.datenarten || "",
        ursache: template.risikoquelle || "",
        eintrittswahrscheinlichkeit: template.eintrittswahrscheinlichkeit || "",
        schweregrad: template.schweregrad || "",
        inhärentesRisiko: template.schweregrad || "",
        restrisiko: template.restrisiko || "",
        weitereMassnahmen: template.restmassnahmen || "",
      }],
    }));
  };
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="col-span-2 space-y-1">
          <Label className="text-xs">{t("dsfaTemplateLabel")}</Label>
          <Select value={selectedTemplate} onValueChange={applyTemplate}>
            <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Vorlage auswählen" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Keine Vorlage</SelectItem>
              <SelectItem value="ki">KI-gestützte Verarbeitung</SelectItem>
              <SelectItem value="video">Videoüberwachung</SelectItem>
              <SelectItem value="biometrie">Biometrische Verarbeitung</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="col-span-2 rounded-lg border p-3 space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Grunddaten</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="col-span-2 space-y-1"><Label className="text-xs">{t("dsfaTitleLabel")} *</Label><Input value={form.titel} onChange={e => set("titel", e.target.value)} className="h-8 text-sm" /></div>
            <div className="space-y-1">
              <Label className="text-xs">VVT-Verknüpfung</Label>
              <Select value={form.vvtId ? String(form.vvtId) : "none"} onValueChange={v => applyVvtPrefill(v)}>
                <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="VVT auswählen" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Kein VVT</SelectItem>
                  {vvts.map((item: any) => <SelectItem key={item.id} value={String(item.id)}>{item.bezeichnung}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1"><Label className="text-xs">{t("dsfaReviewerLabel")}</Label><Input value={form.reviewer} onChange={e => set("reviewer", e.target.value)} className="h-8 text-sm" /></div>
            <div className="space-y-1"><Label className="text-xs">Verantwortlicher Bereich</Label><Input value={form.verantwortlicherBereich} onChange={e => set("verantwortlicherBereich", e.target.value)} className="h-8 text-sm" /></div>
            <div className="space-y-1"><Label className="text-xs">{t("dsfaStatusLabel")}</Label>
              <Select value={form.status} onValueChange={v => set("status", v)}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="entwurf">Entwurf</SelectItem><SelectItem value="abgeschlossen">Abgeschlossen</SelectItem><SelectItem value="überprüfung">In Überprüfung</SelectItem></SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {kiTools.length > 0 && (
          <div className="col-span-2 space-y-1">
            <Label className="text-xs">{t("dsfaToolLabel")}</Label>
            <Select value={kiTools.includes(form.titel) ? form.titel : "none"} onValueChange={v => v !== "none" && set("titel", v)}>
              <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="KI-Tool auswählen" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Kein KI-Tool auswählen</SelectItem>
                {kiTools.map((tool: string) => <SelectItem key={tool} value={tool}>{tool}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="col-span-2 rounded-lg border p-3 space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Beschreibung der Verarbeitung</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="col-span-2 space-y-1"><Label className="text-xs">Zweck</Label><Textarea value={form.zweck} onChange={e => set("zweck", e.target.value)} className="text-sm min-h-12" /></div>
            <div className="col-span-2 space-y-1"><Label className="text-xs">{t("dsfaDescriptionLabel")}</Label><Textarea value={form.beschreibung} onChange={e => set("beschreibung", e.target.value)} className="text-sm min-h-16" /></div>
            <div className="col-span-2 space-y-1"><Label className="text-xs">Prozessablauf</Label><Textarea value={form.prozessablauf} onChange={e => set("prozessablauf", e.target.value)} className="text-sm min-h-12" /></div>
            <div className="col-span-2 space-y-1"><Label className="text-xs">Verarbeitungskontext</Label><Textarea value={form.verarbeitungskontext} onChange={e => set("verarbeitungskontext", e.target.value)} className="text-sm min-h-12" /></div>
            <div className="col-span-2 space-y-1"><Label className="text-xs">Datenquellen</Label><Textarea value={form.datenquellen} onChange={e => set("datenquellen", e.target.value)} className="text-sm min-h-12" /></div>
            <div className="col-span-2 space-y-1"><Label className="text-xs">Empfänger</Label><Textarea value={form.empfaenger} onChange={e => set("empfaenger", e.target.value)} className="text-sm min-h-12" /></div>
            <div className="col-span-2 space-y-1"><Label className="text-xs">Auftragsverarbeiter</Label><Textarea value={form.auftragsverarbeiter} onChange={e => set("auftragsverarbeiter", e.target.value)} className="text-sm min-h-12" /></div>
            <div className="col-span-2 space-y-1"><Label className="text-xs">Systeme / Technologien</Label><Textarea value={form.technologienSysteme} onChange={e => set("technologienSysteme", e.target.value)} className="text-sm min-h-12" /></div>
            <div className="flex items-center gap-2"><input type="checkbox" id="dsfa-drittland" checked={!!form.drittlandtransfer} onChange={e => set("drittlandtransfer", e.target.checked)} className="rounded" /><Label htmlFor="dsfa-drittland" className="text-xs">Drittlandtransfer</Label></div>
            <div className="flex items-center gap-2"><input type="checkbox" id="dsfa-profiling" checked={!!form.profiling} onChange={e => set("profiling", e.target.checked)} className="rounded" /><Label htmlFor="dsfa-profiling" className="text-xs">Profiling</Label></div>
            <div className="flex items-center gap-2"><input type="checkbox" id="dsfa-auto" checked={!!form.automatisierteEntscheidung} onChange={e => set("automatisierteEntscheidung", e.target.checked)} className="rounded" /><Label htmlFor="dsfa-auto" className="text-xs">Automatisierte Entscheidung</Label></div>
          </div>
        </div>

        <div className="col-span-2 rounded-lg border p-3 space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Notwendigkeit & Verhältnismäßigkeit</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="col-span-2 space-y-1"><Label className="text-xs">{t("dsfaNecessityLabel")}</Label><Textarea value={form.notwendigkeit} onChange={e => set("notwendigkeit", e.target.value)} className="text-sm min-h-12" /></div>
            <div className="space-y-1"><Label className="text-xs">Rechtsgrundlage</Label><Input value={form.rechtsgrundlage} onChange={e => set("rechtsgrundlage", e.target.value)} className="h-8 text-sm" /></div>
            <div className="space-y-1"><Label className="text-xs">Zweckbindung</Label><Input value={form.zweckbindungBewertung} onChange={e => set("zweckbindungBewertung", e.target.value)} className="h-8 text-sm" /></div>
            <div className="space-y-1"><Label className="text-xs">Datenminimierung</Label><Input value={form.datenminimierungBewertung} onChange={e => set("datenminimierungBewertung", e.target.value)} className="h-8 text-sm" /></div>
            <div className="space-y-1"><Label className="text-xs">Speicherbegrenzung</Label><Input value={form.speicherbegrenzungBewertung} onChange={e => set("speicherbegrenzungBewertung", e.target.value)} className="h-8 text-sm" /></div>
            <div className="space-y-1"><Label className="text-xs">Transparenz</Label><Input value={form.transparenzBewertung} onChange={e => set("transparenzBewertung", e.target.value)} className="h-8 text-sm" /></div>
            <div className="space-y-1"><Label className="text-xs">Betroffenenrechte</Label><Input value={form.betroffenenrechteBewertung} onChange={e => set("betroffenenrechteBewertung", e.target.value)} className="h-8 text-sm" /></div>
            <div className="space-y-1"><Label className="text-xs">Zugriffskonzept</Label><Input value={form.zugriffskonzeptBewertung} onChange={e => set("zugriffskonzeptBewertung", e.target.value)} className="h-8 text-sm" /></div>
            <div className="space-y-1"><Label className="text-xs">Privacy by Design / Default</Label><Input value={form.privacyByDesignBewertung} onChange={e => set("privacyByDesignBewertung", e.target.value)} className="h-8 text-sm" /></div>
          </div>
        </div>

        <div className="col-span-2 rounded-lg border p-3 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Risikoanalyse</p>
            <Button type="button" size="sm" variant="outline" onClick={addRisk}>Risiko hinzufügen</Button>
          </div>
          <div className="space-y-3">
            {form.risiken.map((risk: any, index: number) => (
              <div key={index} className="rounded-lg border border-border/60 p-3 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium">Risiko {index + 1}</p>
                  <Button type="button" size="sm" variant="ghost" onClick={() => removeRisk(index)}>Entfernen</Button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1"><Label className="text-xs">Titel</Label><Input value={risk.titel} onChange={e => setRisk(index, "titel", e.target.value)} className="h-8 text-sm" /></div>
                  <div className="space-y-1"><Label className="text-xs">Status</Label><Input value={risk.status} onChange={e => setRisk(index, "status", e.target.value)} className="h-8 text-sm" /></div>
                  <div className="col-span-2 space-y-1"><Label className="text-xs">Beschreibung</Label><Textarea value={risk.beschreibung} onChange={e => setRisk(index, "beschreibung", e.target.value)} className="text-sm min-h-12" /></div>
                  <div className="col-span-2 space-y-1"><Label className="text-xs">Betroffene Rechte / Freiheiten</Label><Textarea value={risk.betroffeneRechte} onChange={e => setRisk(index, "betroffeneRechte", e.target.value)} className="text-sm min-h-12" /></div>
                  <div className="col-span-2 space-y-1"><Label className="text-xs">{t("dsfaAffectedGroupsLabel")}</Label><Textarea value={risk.betroffeneGruppen} onChange={e => setRisk(index, "betroffeneGruppen", e.target.value)} className="text-sm min-h-12" /></div>
                  <div className="col-span-2 space-y-1"><Label className="text-xs">{t("dsfaDataTypesLabel")}</Label><Textarea value={risk.datenarten} onChange={e => setRisk(index, "datenarten", e.target.value)} className="text-sm min-h-12" /></div>
                  <div className="col-span-2 space-y-1"><Label className="text-xs">{t("dsfaRiskSourceLabel")}</Label><Input value={risk.ursache} onChange={e => setRisk(index, "ursache", e.target.value)} className="h-8 text-sm" /></div>
                  <div className="col-span-2 space-y-1"><Label className="text-xs">Bestehende Kontrollen</Label><Textarea value={risk.bestehendeKontrollen} onChange={e => setRisk(index, "bestehendeKontrollen", e.target.value)} className="text-sm min-h-12" /></div>
                  <div className="space-y-1"><Label className="text-xs">{t("dsfaProbabilityLabel")}</Label><Input value={risk.eintrittswahrscheinlichkeit} onChange={e => setRisk(index, "eintrittswahrscheinlichkeit", e.target.value)} className="h-8 text-sm" /></div>
                  <div className="space-y-1"><Label className="text-xs">{t("dsfaSeverityLabel")}</Label><Input value={risk.schweregrad} onChange={e => setRisk(index, "schweregrad", e.target.value)} className="h-8 text-sm" /></div>
                  <div className="space-y-1"><Label className="text-xs">Inhärentes Risiko</Label><Input value={risk.inhärentesRisiko} onChange={e => setRisk(index, "inhärentesRisiko", e.target.value)} className="h-8 text-sm" /></div>
                  <div className="space-y-1"><Label className="text-xs">{t("dsfaResidualRiskLabel")}</Label><Input value={risk.restrisiko} onChange={e => setRisk(index, "restrisiko", e.target.value)} className="h-8 text-sm" /></div>
                  <div className="col-span-2 space-y-1"><Label className="text-xs">{t("dsfaFollowUpLabel")}</Label><Textarea value={risk.weitereMassnahmen} onChange={e => setRisk(index, "weitereMassnahmen", e.target.value)} className="text-sm min-h-12" /></div>
                  <div className="space-y-1"><Label className="text-xs">Verantwortlicher</Label><Input value={risk.verantwortlicher} onChange={e => setRisk(index, "verantwortlicher", e.target.value)} className="h-8 text-sm" /></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="col-span-2 rounded-lg border p-3 space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Maßnahmen, Ergebnis und Eskalation</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="col-span-2 space-y-1"><Label className="text-xs">{t("dsfaMeasuresLabel")}</Label><Textarea value={form.massnahmen} onChange={e => set("massnahmen", e.target.value)} className="text-sm min-h-12" /></div>
            <div className="col-span-2 space-y-1"><Label className="text-xs">Restrisiko-Begründung</Label><Textarea value={form.restrisikoBegruendung} onChange={e => set("restrisikoBegruendung", e.target.value)} className="text-sm min-h-12" /></div>
            <div className="space-y-1"><Label className="text-xs">{t("dsfaResultLabel")}</Label>
              <Select value={form.ergebnis} onValueChange={v => set("ergebnis", v)}>
                <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Wählen..." /></SelectTrigger>
                <SelectContent><SelectItem value="akzeptabel">Akzeptabel</SelectItem><SelectItem value="nicht_akzeptabel">Nicht akzeptabel</SelectItem><SelectItem value="bedingt">Bedingt akzeptabel</SelectItem></SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2"><input type="checkbox" id="art36" checked={!!form.art36Erforderlich} onChange={e => set("art36Erforderlich", e.target.checked)} className="rounded" /><Label htmlFor="art36" className="text-xs">Art. 36 erforderlich</Label></div>
            <div className="col-span-2 space-y-1"><Label className="text-xs">Art.-36-Begründung</Label><Textarea value={form.art36Begruendung} onChange={e => set("art36Begruendung", e.target.value)} className="text-sm min-h-12" /></div>
            <div className="flex items-center gap-2"><input type="checkbox" id="kons" checked={!!form.konsultation} onChange={e => set("konsultation", e.target.checked)} className="rounded" /><Label htmlFor="kons" className="text-xs">Behördenkonsultation (Art. 36)</Label></div>
          </div>
        </div>

        <div className="col-span-2 rounded-lg border p-3 space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">DSB, Freigabe und Review</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex items-center gap-2"><input type="checkbox" id="dsb" checked={!!form.dsbBeteiligt} onChange={e => set("dsbBeteiligt", e.target.checked)} className="rounded" /><Label htmlFor="dsb" className="text-xs">DSB beteiligt</Label></div>
            <div className="space-y-1"><Label className="text-xs">Nächste Prüfung</Label><Input type="date" value={form.naechstePruefungAm || ""} onChange={e => set("naechstePruefungAm", e.target.value)} className="h-8 text-sm" /></div>
            <div className="col-span-2 space-y-1"><Label className="text-xs">DSB-Stellungnahme</Label><Textarea value={form.dsbStellungnahme} onChange={e => set("dsbStellungnahme", e.target.value)} className="text-sm min-h-12" /></div>
            <div className="space-y-1"><Label className="text-xs">Freigabeentscheidung</Label><Input value={form.freigabeentscheidung} onChange={e => set("freigabeentscheidung", e.target.value)} className="h-8 text-sm" /></div>
            <div className="space-y-1"><Label className="text-xs">Freigabedatum</Label><Input type="date" value={form.freigabeDatum || ""} onChange={e => set("freigabeDatum", e.target.value)} className="h-8 text-sm" /></div>
            <div className="col-span-2 space-y-1"><Label className="text-xs">Freigabebegründung</Label><Textarea value={form.freigabeBegruendung} onChange={e => set("freigabeBegruendung", e.target.value)} className="text-sm min-h-12" /></div>
          </div>
        </div>
      </div>
      <div className="sticky bottom-0 z-10 -mx-6 mt-4 border-t bg-background px-6 pt-3 pb-1">
        <DialogFooter>
          <Button variant="outline" size="sm" onClick={onCancel}>Abbrechen</Button>
          <Button size="sm" className="bg-primary" onClick={() => onSave({ ...form, risiken: JSON.stringify(form.risiken) })} disabled={!form.titel}>Speichern</Button>
        </DialogFooter>
      </div>
    </div>
  );
}

function DsfaPage() {
  const { t } = useI18n();
  const [location, setLocation] = useLocation();
  const { activeMandantId } = useMandant();
  const { data, isLoading, create, update, remove } = useModuleData("dsfa");
  const { data: vvts = [] } = useModuleData("vvt");
  const { data: mandanten = [] } = useQuery({ queryKey: ["/api/mandanten"], queryFn: () => apiRequest("GET", "/api/mandanten").then(r => r.json()) });
  const [modal, setModal] = useState<null | "new" | any>(null);
  const [delId, setDelId] = useState<number | null>(null);
  const { toast } = useToast();
  const save = (form: any) => {
    const p = modal === "new" ? create.mutateAsync(form) : update.mutateAsync({ id: modal.id, ...form });
    p.then(() => { setModal(null); toast({ title: "Gespeichert" }); }).catch((e:any) => toast({ title: "Fehler", description: e?.message || "Speichern fehlgeschlagen", variant: "destructive" }));
  };
  const getRisks = (item: any) => {
    try {
      const parsed = typeof item.risiken === "string" ? JSON.parse(item.risiken || "[]") : item.risiken;
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  };
  const [dsfaFilter, setDsfaFilterState] = useState<"all" | "missing-vvt" | "art36" | "review" | "high-risk" | "copilot" | "copilot-missing-review">("all");
  const [dsfaSort, setDsfaSortState] = useState<"title-asc" | "title-desc" | "review" | "risk">("title-asc");

  useEffect(() => {
    const route = new URL(location, "https://privashield.local");
    const rawDsfaFilter = route.searchParams.get("filter");
    const rawDsfaSort = route.searchParams.get("sort");
    setDsfaFilterState(rawDsfaFilter === "missing-vvt" || rawDsfaFilter === "art36" || rawDsfaFilter === "review" || rawDsfaFilter === "high-risk" || rawDsfaFilter === "copilot" || rawDsfaFilter === "copilot-missing-review" ? rawDsfaFilter : "all");
    setDsfaSortState(rawDsfaSort === "title-desc" || rawDsfaSort === "review" || rawDsfaSort === "risk" ? rawDsfaSort : "title-asc");
  }, [location]);

  const updateDsfaRouteState = (nextFilter: "all" | "missing-vvt" | "art36" | "review" | "high-risk" | "copilot" | "copilot-missing-review", nextSort: "title-asc" | "title-desc" | "review" | "risk") => {
    const next = new URL(location, "https://privashield.local");
    if (nextFilter === "all") next.searchParams.delete("filter");
    else next.searchParams.set("filter", nextFilter);
    if (nextSort === "title-asc") next.searchParams.delete("sort");
    else next.searchParams.set("sort", nextSort);
    setLocation(`${next.pathname}${next.search}`);
  };

  const setDsfaFilter = (value: "all" | "missing-vvt" | "art36" | "review" | "high-risk" | "copilot" | "copilot-missing-review") => {
    setDsfaFilterState(value);
    updateDsfaRouteState(value, dsfaSort);
  };
  const setDsfaSort = (value: "title-asc" | "title-desc" | "review" | "risk") => {
    setDsfaSortState(value);
    updateDsfaRouteState(dsfaFilter, value);
  };
  const nowTs = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;
  const isReviewDueTs = (value: any) => !!(value && new Date(value).getTime() < nowTs);
  const isReviewOverdueTs = (value: any) => !!(value && new Date(value).getTime() < (nowTs - dayMs));
  const filteredDsfa = data.filter((item: any) => {
    const risks = getRisks(item);
    const isCopilot = /copilot/i.test(String(item?.titel || "")) || /copilot/i.test(String(item?.beschreibung || ""));
    if (dsfaFilter === "missing-vvt") return !item.vvtId;
    if (dsfaFilter === "art36") return !!item.art36Erforderlich;
    if (dsfaFilter === "review") return isReviewDueTs(item.naechstePruefungAm);
    if (dsfaFilter === "high-risk") return risks.some((risk: any) => String(risk?.restrisiko || "").toLowerCase() === "hoch");
    if (dsfaFilter === "copilot") return isCopilot;
    if (dsfaFilter === "copilot-missing-review") return isCopilot && !String(item?.naechstePruefungAm || "").trim();
    return true;
  }).slice().sort((a: any, b: any) => {
    const aRisks = getRisks(a);
    const bRisks = getRisks(b);
    const aHigh = aRisks.some((risk: any) => String(risk?.restrisiko || "").toLowerCase() === "hoch");
    const bHigh = bRisks.some((risk: any) => String(risk?.restrisiko || "").toLowerCase() === "hoch");
    const aReview = a.naechstePruefungAm ? new Date(a.naechstePruefungAm).getTime() : Number.MAX_SAFE_INTEGER;
    const bReview = b.naechstePruefungAm ? new Date(b.naechstePruefungAm).getTime() : Number.MAX_SAFE_INTEGER;
    const aScore = (aHigh ? 100 : 0) + (a.art36Erforderlich ? 60 : 0) + (!a.vvtId ? 40 : 0) + (isReviewOverdueTs(a.naechstePruefungAm) ? 30 : isReviewDueTs(a.naechstePruefungAm) ? 15 : 0);
    const bScore = (bHigh ? 100 : 0) + (b.art36Erforderlich ? 60 : 0) + (!b.vvtId ? 40 : 0) + (isReviewOverdueTs(b.naechstePruefungAm) ? 30 : isReviewDueTs(b.naechstePruefungAm) ? 15 : 0);
    if (dsfaFilter !== "all" && dsfaSort === "title-asc") return bScore - aScore || aReview - bReview || String(a.titel || "").localeCompare(String(b.titel || ""), "de");
    if (dsfaSort === "title-desc") return String(b.titel || "").localeCompare(String(a.titel || ""), "de");
    if (dsfaSort === "review") return aReview - bReview || bScore - aScore || String(a.titel || "").localeCompare(String(b.titel || ""), "de");
    if (dsfaSort === "risk") return Number(bHigh) - Number(aHigh) || bScore - aScore || String(a.titel || "").localeCompare(String(b.titel || ""), "de");
    return String(a.titel || "").localeCompare(String(b.titel || ""), "de");
  });
  const activeMandantName = mandanten.find((m: any) => m.id === activeMandantId)?.name || `Mandant #${activeMandantId ?? "?"}`;
  const dsfaReviewDueCount = data.filter((item: any) => isReviewDueTs(item.naechstePruefungAm)).length;
  const dsfaReviewOverdueCount = data.filter((item: any) => isReviewOverdueTs(item.naechstePruefungAm)).length;
  const dsfaArt36Count = data.filter((item: any) => !!item.art36Erforderlich).length;
  const dsfaHighRiskCount = data.filter((item: any) => getRisks(item).some((risk: any) => String(risk?.restrisiko || "").toLowerCase() === "hoch")).length;
  const dsfaMissingVvtCount = data.filter((item: any) => !item.vvtId).length;
  const dsfaFilterHint = dsfaFilter === "art36"
    ? "Du siehst gerade: DSFA mit Art.-36-Prüfbedarf."
    : dsfaFilter === "review"
      ? "Du siehst gerade: DSFA mit fälligem oder überfälligem Review."
      : dsfaFilter === "high-risk"
        ? "Du siehst gerade: DSFA mit hohem Restrisiko."
        : dsfaFilter === "missing-vvt"
          ? "Du siehst gerade: DSFA ohne VVT-Bezug."
          : dsfaFilter === "copilot-missing-review"
            ? "Du siehst gerade: Copilot-DSFA ohne Reviewdatum."
            : dsfaFilter === "copilot"
              ? "Du siehst gerade: DSFA mit Copilot-Bezug."
              : "";
  return (
    <MandantGuard>
      <PageHeader title={t("dsfaTitle")} desc={t("dsfaDesc")}
        action={<Button size="sm" className="bg-primary h-8 text-xs gap-1.5" onClick={() => setModal("new")}><Plus className="h-3.5 w-3.5" />Neu</Button>} />
      {isLoading ? <Skeleton className="h-32 w-full" /> : (
        <div className="space-y-2">
          {dsfaFilterHint && (
            <Card className="border-primary/30 bg-primary/5">
              <CardContent className="py-3 px-4 flex flex-col gap-2 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
                <span>{dsfaFilterHint} <span className="font-medium text-foreground">({filteredDsfa.length})</span></span>
                <div className="flex flex-wrap gap-2">
                  <Button type="button" size="sm" variant="outline" onClick={() => setDsfaFilter("all")}>Filter zurücksetzen</Button>
                  <Link href="/export"><a className="text-xs text-primary hover:underline self-center">Export öffnen</a></Link>
                </div>
              </CardContent>
            </Card>
          )}
          <Card className="border-border/60 bg-muted/20">
            <CardContent className="py-3 px-4 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Aktiver Mandant</p>
                <p className="text-sm font-medium">{activeMandantName}</p>
              </div>
              <p className="text-xs text-muted-foreground">Die DSFA-Liste zeigt nur Einträge des aktuell ausgewählten Mandanten.</p>
            </CardContent>
          </Card>

          <div className="flex flex-wrap items-center gap-2">
            <Button type="button" size="sm" variant={dsfaFilter === "all" ? "default" : "outline"} onClick={() => setDsfaFilter("all")}>Alle</Button>
            <Button type="button" size="sm" variant={dsfaFilter === "missing-vvt" ? "default" : "outline"} onClick={() => setDsfaFilter("missing-vvt")}>Ohne VVT</Button>
            <Button type="button" size="sm" variant={dsfaFilter === "art36" ? "default" : "outline"} onClick={() => setDsfaFilter("art36")}>Art. 36</Button>
            <Button type="button" size="sm" variant={dsfaFilter === "review" ? "default" : "outline"} onClick={() => setDsfaFilter("review")}>Review fällig</Button>
            <Button type="button" size="sm" variant={dsfaFilter === "high-risk" ? "default" : "outline"} onClick={() => setDsfaFilter("high-risk")}>Hohes Restrisiko</Button>
            <Button type="button" size="sm" variant={dsfaFilter === "copilot" ? "default" : "outline"} onClick={() => setDsfaFilter("copilot")}>Copilot</Button>
            <Button type="button" size="sm" variant={dsfaFilter === "copilot-missing-review" ? "default" : "outline"} onClick={() => setDsfaFilter("copilot-missing-review")}>Copilot ohne Reviewdatum</Button>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-muted-foreground">Sortierung:</span>
            <Button type="button" size="sm" variant={dsfaSort === "title-asc" ? "default" : "outline"} onClick={() => setDsfaSort("title-asc")}>Titel A–Z</Button>
            <Button type="button" size="sm" variant={dsfaSort === "title-desc" ? "default" : "outline"} onClick={() => setDsfaSort("title-desc")}>Titel Z–A</Button>
            <Button type="button" size="sm" variant={dsfaSort === "review" ? "default" : "outline"} onClick={() => setDsfaSort("review")}>Review zuerst</Button>
            <Button type="button" size="sm" variant={dsfaSort === "risk" ? "default" : "outline"} onClick={() => setDsfaSort("risk")}>Hohes Risiko zuerst</Button>
          </div>
          {dsfaFilter !== "all" && (
            <Card className="border-border/60 bg-muted/20">
              <CardContent className="py-3 px-4 grid grid-cols-1 gap-3 text-sm md:grid-cols-4">
                <div><p className="text-xs text-muted-foreground">Review fällig</p><p className="font-semibold">{dsfaReviewDueCount}</p></div>
                <div><p className="text-xs text-muted-foreground">Davon überfällig</p><p className="font-semibold">{dsfaReviewOverdueCount}</p></div>
                <div><p className="text-xs text-muted-foreground">Art.-36-Fälle</p><p className="font-semibold">{dsfaArt36Count}</p></div>
                <div><p className="text-xs text-muted-foreground">Ohne VVT / hohes Restrisiko</p><p className="font-semibold">{dsfaMissingVvtCount} / {dsfaHighRiskCount}</p></div>
              </CardContent>
            </Card>
          )}
          {filteredDsfa.length === 0 && <Card className="border-dashed"><CardContent className="py-12 text-center text-sm text-muted-foreground space-y-3">{dsfaFilterHint ? `Für den aktiven Governance-Filter wurden bei ${activeMandantName} aktuell keine DSFA-Treffer gefunden.` : <>Keine DSFAs für den aktuellen Filter bei <span className="font-medium text-foreground">{activeMandantName}</span>.</>}<div><Button type="button" size="sm" onClick={() => setModal("new")}>Neue DSFA anlegen</Button></div></CardContent></Card>}
          {data.length === 0 && <Card className="border-dashed"><CardContent className="py-12 text-center text-sm text-muted-foreground">Für <span className="font-medium text-foreground">{activeMandantName}</span> sind aktuell keine DSFAs vorhanden.</CardContent></Card>}
          {filteredDsfa.map((item: any) => {
            const risks = getRisks(item);
            const hasHighResidualRisk = risks.some((risk: any) => String(risk?.restrisiko || "").toLowerCase() === "hoch");
            const linkedVvt = vvts.find((v: any) => v.id === item.vvtId);
            const reviewDue = item.naechstePruefungAm && new Date(item.naechstePruefungAm).getTime() < Date.now();
            return (
              <Card key={item.id} className="group hover:border-border/80 transition-colors">
                <CardContent className="py-3 px-4 flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center sm:gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <AlertTriangle className="h-4 w-4 text-yellow-400 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{item.titel}</p>
                      <p className="text-xs text-muted-foreground">{item.reviewer || "—"}{item.konsultation ? " · Behördenkonsultation" : ""}{linkedVvt ? ` · ${linkedVvt.bezeichnung}` : " · Ohne VVT"}</p>
                      <p className="text-xs text-muted-foreground">{risks.length} Risiko(e){item.naechstePruefungAm ? ` · Nächste Prüfung: ${new Date(item.naechstePruefungAm).toLocaleDateString("de-DE")}` : ""}</p>
                      {(dsfaFilter === "art36" || dsfaFilter === "review" || dsfaFilter === "high-risk" || dsfaFilter === "missing-vvt") && <p className="text-xs text-muted-foreground">Arbeitszustand: {item.art36Erforderlich ? "heute erledigen" : !item.vvtId ? "neu" : reviewDue ? "in Bearbeitung" : hasHighResidualRisk ? "in Bearbeitung" : "beobachten"}</p>}
                    </div>
                  </div>
                  <div className="flex w-full items-center justify-between gap-2 shrink-0 sm:w-auto sm:justify-end">
                    <div className="flex items-center gap-2 flex-wrap justify-end">
                      {!item.vvtId && <Badge variant="outline" className="text-xs">Ohne VVT</Badge>}
                      {item.art36Erforderlich && <Badge variant="outline" className="text-xs border-red-500/40 text-red-600">Art. 36 prüfen</Badge>}
                      {reviewDue && <Badge variant="outline" className="text-xs border-amber-500/40 text-amber-600">Review fällig</Badge>}
                      {hasHighResidualRisk && <Badge variant="destructive" className="text-xs">Hohes Restrisiko</Badge>}
                      {item.ergebnis && <StatusBadge value={item.ergebnis} />}
                      <StatusBadge value={item.status} />
                    </div>
                    <button onClick={() => setModal(item)} className="p-1 rounded text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-all"><Pencil className="h-3.5 w-3.5" /></button>
                    <button onClick={() => setDelId(item.id)} className="p-1 rounded text-muted-foreground hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"><Trash2 className="h-3.5 w-3.5" /></button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
      <Dialog open={!!modal} onOpenChange={o => !o && setModal(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto"><div className="sticky top-0 z-10 -mx-6 border-b bg-background px-6 pb-3 pt-1"><DialogHeader><DialogTitle>{modal === "new" ? "Neue DSFA" : "DSFA bearbeiten"}</DialogTitle></DialogHeader></div>
          {modal && <DsfaForm initial={modal === "new" ? {} : modal} onSave={save} onCancel={() => setModal(null)} />}
        </DialogContent>
      </Dialog>
      <ConfirmDialog open={delId !== null} title="DSFA löschen?" desc="Dieser Vorgang kann nicht rückgängig gemacht werden."
        onConfirm={() => { remove.mutate(delId!); setDelId(null); }} onCancel={() => setDelId(null)} />
    </MandantGuard>
  );
}

// ─── DATENPANNEN PAGE ──────────────────────────────────────────────────────
const datenpannenTemplates: Record<string, any> = {
  none: null,
  email: {
    titel: "Fehlversand einer E-Mail",
    beschreibung: "Personenbezogene Daten wurden per E-Mail an einen falschen Empfänger versendet.",
    schwere: "mittel",
    status: "offen",
    ursache: "Fehladressierung / manueller Versandfehler",
    massnahmen: "Empfänger kontaktieren, Löschung verlangen, Versandprozess prüfen",
    kategorie: "Vertraulichkeitsverletzung",
    datenarten: "Kontaktdaten, Kommunikationsinhalte, Anhangsdaten",
    erstmassnahmen: "Rückruf / Löschaufforderung an falschen Empfänger",
    folgemassnahmen: "Sensibilisierung, Vier-Augen-Prinzip, Versandprüfungen",
    betroffenengruppen: "Kunden, Beschäftigte, Interessenten",
    meldepflichtig: false,
    betroffenInformiert: false,
  },
  phishing: {
    titel: "Phishing / Account-Kompromittierung",
    beschreibung: "Unberechtigter Zugriff auf ein Benutzerkonto mit möglichem Datenabfluss.",
    schwere: "hoch",
    status: "offen",
    ursache: "Kompromittierte Zugangsdaten / Phishing-Angriff",
    massnahmen: "Passwort zurücksetzen, Sitzungen beenden, MFA erzwingen, Logs auswerten",
    kategorie: "Vertraulichkeitsverletzung",
    datenarten: "Zugangsdaten, Kommunikationsdaten, Inhaltsdaten, Metadaten",
    erstmassnahmen: "Account sperren, Credentials zurücksetzen, Zugriff analysieren",
    folgemassnahmen: "MFA-Rollout, Awareness-Maßnahmen, Incident-Response-Nachbereitung",
    betroffenengruppen: "Beschäftigte, Kunden",
    meldepflichtig: true,
    betroffenInformiert: false,
  },
  lostdevice: {
    titel: "Verlust eines mobilen Endgeräts",
    beschreibung: "Verlust oder Diebstahl eines Geräts mit potenziellem Zugriff auf personenbezogene Daten.",
    schwere: "hoch",
    status: "offen",
    ursache: "Gerät verloren oder entwendet",
    massnahmen: "Remote-Wipe, Gerätesperre, Passwortänderung, Asset-Dokumentation aktualisieren",
    kategorie: "Verfügbarkeits- / Vertraulichkeitsverletzung",
    datenarten: "Kontaktdaten, E-Mails, Dokumente, Zugangsdaten",
    erstmassnahmen: "Gerät orten / sperren / löschen",
    folgemassnahmen: "MDM-Konzept prüfen, Geräteschutz verbessern",
    betroffenengruppen: "Beschäftigte, Kunden, Geschäftspartner",
    meldepflichtig: true,
    betroffenInformiert: false,
  },
};

function DatenpanneForm({ initial, onSave, onCancel }: any) {
  const [selectedTemplate, setSelectedTemplate] = useState("none");
  const [form, setForm] = useState({ titel: "", beschreibung: "", entdecktAm: new Date().toISOString().split("T")[0], entdecktUm: new Date().toTimeString().slice(0,5), gemeldetAm: "", gemeldetUm: "", frist72h: "", meldepflichtig: false, betroffenePersonen: 0, schwere: "mittel", status: "offen", ursache: "", massnahmen: "", kategorie: "", datenarten: "", erstmassnahmen: "", folgemassnahmen: "", betroffenengruppen: "", behoerdeMeldung: "", betroffenInformiert: false, ...initial });
  const set = (k: string, v: any) => setForm((p: any) => ({ ...p, [k]: v }));
  const applyTemplate = (value: string) => {
    setSelectedTemplate(value);
    const template = datenpannenTemplates[value];
    if (!template) return;
    setForm((p: any) => ({ ...p, ...template }));
  };
  const recalc72h = (next: any) => {
    if (!next.entdecktAm || !next.entdecktUm) return next;
    const base = new Date(`${next.entdecktAm}T${next.entdecktUm}:00`);
    if (Number.isNaN(base.getTime())) return next;
    const deadline = new Date(base.getTime() + 72 * 60 * 60 * 1000);
    return { ...next, frist72h: deadline.toISOString().slice(0,16) };
  };
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="col-span-2 space-y-1">
          <Label className="text-xs">Muster-Datenpanne</Label>
          <Select value={selectedTemplate} onValueChange={applyTemplate}>
            <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Vorlage auswählen" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Keine Vorlage</SelectItem>
              <SelectItem value="email">Fehlversand einer E-Mail</SelectItem>
              <SelectItem value="phishing">Phishing / Account-Kompromittierung</SelectItem>
              <SelectItem value="lostdevice">Verlust eines mobilen Endgeräts</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="col-span-2 space-y-1"><Label className="text-xs">Titel *</Label><Input value={form.titel} onChange={e => set("titel", e.target.value)} className="h-8 text-sm" /></div>
        <div className="space-y-1"><Label className="text-xs">Entdeckt am *</Label><Input type="date" value={form.entdecktAm} onChange={e => setForm((p:any) => recalc72h({ ...p, entdecktAm: e.target.value }))} className="h-8 text-sm" /></div>
        <div className="space-y-1"><Label className="text-xs">Entdeckt um *</Label><Input type="time" value={form.entdecktUm || ""} onChange={e => setForm((p:any) => recalc72h({ ...p, entdecktUm: e.target.value }))} className="h-8 text-sm" /></div>
        <div className="space-y-1"><Label className="text-xs">Gemeldet am</Label><Input type="date" value={form.gemeldetAm || ""} onChange={e => set("gemeldetAm", e.target.value)} className="h-8 text-sm" /></div>
        <div className="space-y-1"><Label className="text-xs">Gemeldet um</Label><Input type="time" value={form.gemeldetUm || ""} onChange={e => set("gemeldetUm", e.target.value)} className="h-8 text-sm" /></div>
        <div className="col-span-2 space-y-1"><Label className="text-xs">72h-Frist</Label><Input type="datetime-local" value={form.frist72h || ""} onChange={e => set("frist72h", e.target.value)} className="h-8 text-sm" /></div>
        <div className="space-y-1"><Label className="text-xs">Schwere</Label>
          <Select value={form.schwere} onValueChange={v => set("schwere", v)}>
            <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="niedrig">Niedrig</SelectItem><SelectItem value="mittel">Mittel</SelectItem><SelectItem value="hoch">Hoch</SelectItem><SelectItem value="kritisch">Kritisch</SelectItem></SelectContent>
          </Select>
        </div>
        <div className="space-y-1"><Label className="text-xs">Status</Label>
          <Select value={form.status} onValueChange={v => set("status", v)}>
            <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="offen">Offen</SelectItem><SelectItem value="gemeldet">Gemeldet</SelectItem><SelectItem value="abgeschlossen">Abgeschlossen</SelectItem></SelectContent>
          </Select>
        </div>
        <div className="space-y-1"><Label className="text-xs">Betroffene Personen (ca.)</Label><Input type="number" value={form.betroffenePersonen} onChange={e => set("betroffenePersonen", Number(e.target.value))} className="h-8 text-sm" /></div>
        <div className="space-y-1"><Label className="text-xs">Kategorie</Label><Input value={form.kategorie} onChange={e => set("kategorie", e.target.value)} className="h-8 text-sm" placeholder="z. B. Vertraulichkeitsverletzung" /></div>
        <div className="col-span-2 space-y-1"><Label className="text-xs">Beschreibung</Label><Textarea value={form.beschreibung} onChange={e => set("beschreibung", e.target.value)} className="text-sm min-h-12" /></div>
        <div className="col-span-2 space-y-1"><Label className="text-xs">Datenarten</Label><Textarea value={form.datenarten} onChange={e => set("datenarten", e.target.value)} className="text-sm min-h-12" /></div>
        <div className="col-span-2 space-y-1"><Label className="text-xs">Betroffenengruppen</Label><Textarea value={form.betroffenengruppen} onChange={e => set("betroffenengruppen", e.target.value)} className="text-sm min-h-12" /></div>
        <div className="col-span-2 space-y-1"><Label className="text-xs">Ursache</Label><Textarea value={form.ursache} onChange={e => set("ursache", e.target.value)} className="text-sm min-h-12" /></div>
        <div className="col-span-2 space-y-1"><Label className="text-xs">Erstmaßnahmen</Label><Textarea value={form.erstmassnahmen} onChange={e => set("erstmassnahmen", e.target.value)} className="text-sm min-h-12" /></div>
        <div className="col-span-2 space-y-1"><Label className="text-xs">Ergriffene Maßnahmen</Label><Textarea value={form.massnahmen} onChange={e => set("massnahmen", e.target.value)} className="text-sm min-h-12" /></div>
        <div className="col-span-2 space-y-1"><Label className="text-xs">Folge- und Verbesserungsmaßnahmen</Label><Textarea value={form.folgemassnahmen} onChange={e => set("folgemassnahmen", e.target.value)} className="text-sm min-h-12" /></div>
        <div className="flex items-center gap-2"><input type="checkbox" id="meld" checked={!!form.meldepflichtig} onChange={e => set("meldepflichtig", e.target.checked)} className="rounded" /><Label htmlFor="meld" className="text-xs">Meldepflichtig (Art. 33 DSGVO – 72h-Frist)</Label></div>
        <div className="space-y-1"><Label className="text-xs">Behördenmeldung</Label><Input type="date" value={form.behoerdeMeldung || ""} onChange={e => set("behoerdeMeldung", e.target.value)} className="h-8 text-sm" /></div>
        <div className="flex items-center gap-2"><input type="checkbox" id="betrinf" checked={!!form.betroffenInformiert} onChange={e => set("betroffenInformiert", e.target.checked)} className="rounded" /><Label htmlFor="betrinf" className="text-xs">Betroffene informiert (Art. 34)</Label></div>
      </div>
      <div className="sticky bottom-0 z-10 -mx-6 mt-4 border-t bg-background px-6 pt-3 pb-1">
        <DialogFooter>
          <Button variant="outline" size="sm" onClick={onCancel}>Abbrechen</Button>
          <Button size="sm" className="bg-primary" onClick={() => onSave(form)} disabled={!form.titel}>Speichern</Button>
        </DialogFooter>
      </div>
    </div>
  );
}

function DatenpannenPage() {
  const { t } = useI18n();
  const [location, setLocation] = useLocation();
  const { activeMandantId } = useMandant();
  const qc = useQueryClient();
  const { data, isLoading, create, update, remove } = useModuleData("datenpannen");
  const { data: aufgaben = [] } = useModuleData("aufgaben");
  const { data: pdca = [] } = useModuleData("pdca");
  const [modal, setModal] = useState<null | "new" | any>(null);
  const [delId, setDelId] = useState<number | null>(null);
  const { toast } = useToast();
  const [incidentFilter, setIncidentFilterState] = useState<"all" | "critical" | "reportable-open" | "deadline-72h" | "deadline-missed" | "notify-art34" | "open">("all");
  const [incidentSort, setIncidentSortState] = useState<"deadline" | "severity" | "newest" | "title">("deadline");

  useEffect(() => {
    const route = new URL(location, "https://privashield.local");
    const rawFilter = route.searchParams.get("filter");
    const rawSort = route.searchParams.get("sort");
    setIncidentFilterState(rawFilter === "critical" || rawFilter === "reportable-open" || rawFilter === "deadline-72h" || rawFilter === "deadline-missed" || rawFilter === "notify-art34" || rawFilter === "open" ? rawFilter : "all");
    setIncidentSortState(rawSort === "severity" || rawSort === "newest" || rawSort === "title" ? rawSort : "deadline");
  }, [location]);

  const updateIncidentRouteState = (nextFilter: "all" | "critical" | "reportable-open" | "deadline-72h" | "deadline-missed" | "notify-art34" | "open", nextSort: "deadline" | "severity" | "newest" | "title") => {
    const next = new URL(location, "https://privashield.local");
    if (nextFilter === "all") next.searchParams.delete("filter");
    else next.searchParams.set("filter", nextFilter);
    if (nextSort === "deadline") next.searchParams.delete("sort");
    else next.searchParams.set("sort", nextSort);
    setLocation(`${next.pathname}${next.search}`);
  };

  const setIncidentFilter = (value: "all" | "critical" | "reportable-open" | "deadline-72h" | "deadline-missed" | "notify-art34" | "open") => {
    setIncidentFilterState(value);
    updateIncidentRouteState(value, incidentSort);
  };
  const setIncidentSort = (value: "deadline" | "severity" | "newest" | "title") => {
    setIncidentSortState(value);
    updateIncidentRouteState(incidentFilter, value);
  };

  const save = (form: any) => {
    const p = modal === "new" ? create.mutateAsync(form) : update.mutateAsync({ id: modal.id, ...form });
    p.then(() => { setModal(null); toast({ title: "Gespeichert" }); }).catch((e:any) => toast({ title: "Fehler", description: e?.message || "Speichern fehlgeschlagen", variant: "destructive" }));
  };

  const now = Date.now();
  const severityWeight: Record<string, number> = { kritisch: 0, hoch: 1, mittel: 2, niedrig: 3 };
  const parseIncidentDateTime = (item: any, fieldDate: string, fieldTime?: string) => {
    const date = String(item?.[fieldDate] || "").trim();
    if (!date) return null;
    const time = String(fieldTime ? item?.[fieldTime] || "" : "").trim() || "00:00";
    const normalized = time.length === 5 ? `${time}:00` : time;
    const parsed = new Date(`${date}T${normalized}`);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  };
  const parseDeadline = (item: any) => {
    const raw = String(item?.frist72h || "").trim();
    if (!raw) return null;
    const normalized = raw.length === 16 ? `${raw}:00` : raw;
    const parsed = new Date(normalized);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  };
  const formatDeadline = (date: Date | null) => date ? date.toLocaleString("de-DE", { dateStyle: "short", timeStyle: "short" }) : "offen";
  const getIncidentMeta = (item: any) => {
    const discoveredAt = parseIncidentDateTime(item, "entdecktAm", "entdecktUm");
    const deadline = parseDeadline(item) || (discoveredAt ? new Date(discoveredAt.getTime() + 72 * 60 * 60 * 1000) : null);
    const authorityReported = !!String(item?.behoerdeMeldung || item?.gemeldetAm || "").trim() || String(item?.status || "") === "gemeldet";
    const isOpen = String(item?.status || "") !== "abgeschlossen";
    const isCritical = ["kritisch", "hoch"].includes(String(item?.schwere || "").toLowerCase()) || Number(item?.betroffenePersonen || 0) >= 500;
    const shouldNotifyDataSubjects = !!item?.meldepflichtig && !item?.betroffenInformiert && ["kritisch", "hoch"].includes(String(item?.schwere || "").toLowerCase());
    const hoursLeft = deadline ? (deadline.getTime() - now) / (1000 * 60 * 60) : null;
    const deadlineMissed = !!item?.meldepflichtig && isOpen && !authorityReported && hoursLeft !== null && hoursLeft < 0;
    const deadlineSoon = !!item?.meldepflichtig && isOpen && !authorityReported && hoursLeft !== null && hoursLeft >= 0 && hoursLeft <= 72;
    const reportableOpen = !!item?.meldepflichtig && isOpen && !authorityReported;
    const urgency = deadlineMissed ? "Frist überschritten" : deadlineSoon ? `72h-Frist läuft (${Math.max(0, Math.round(hoursLeft || 0))}h)` : reportableOpen ? "Meldung offen" : authorityReported ? "Meldung dokumentiert" : "Interne Prüfung";
    return { discoveredAt, deadline, authorityReported, isOpen, isCritical, shouldNotifyDataSubjects, hoursLeft, deadlineMissed, deadlineSoon, reportableOpen, urgency };
  };

  const criticalItems = data.filter((item: any) => getIncidentMeta(item).isCritical);
  const reportableOpenItems = data.filter((item: any) => getIncidentMeta(item).reportableOpen);
  const deadlineSoonItems = data.filter((item: any) => getIncidentMeta(item).deadlineSoon);
  const deadlineMissedItems = data.filter((item: any) => getIncidentMeta(item).deadlineMissed);
  const notifyArt34Items = data.filter((item: any) => getIncidentMeta(item).shouldNotifyDataSubjects);
  const openItems = data.filter((item: any) => getIncidentMeta(item).isOpen);

  const buildIncidentTaskDraft = (item: any, kind: "critical" | "reportable-open" | "deadline-72h" | "deadline-missed" | "notify-art34") => {
    const meta = getIncidentMeta(item);
    const drafts: Record<string, { title: string; priority: string; description: string }> = {
      critical: {
        title: `Kritische Datenpanne priorisieren: ${item.titel}`,
        priority: "kritisch",
        description: `Für die Datenpanne "${item.titel}" besteht erhöhter Handlungsdruck. Bitte Sachverhalt, Sofortmaßnahmen, Meldepflicht, Art.-34-Benachrichtigung und Nachsteuerung priorisiert dokumentieren. Aktueller Fokus: ${meta.urgency}.`,
      },
      "reportable-open": {
        title: `Behördenmeldung absichern: ${item.titel}`,
        priority: "hoch",
        description: `Die Datenpanne "${item.titel}" ist als meldepflichtig markiert, aber eine dokumentierte Behördenmeldung fehlt noch. Bitte Art.-33-Bewertung, Meldestatus, Nachweis und interne Freigabe kurzfristig abschließen.`,
      },
      "deadline-72h": {
        title: `72h-Frist steuern: ${item.titel}`,
        priority: "kritisch",
        description: `Für die Datenpanne "${item.titel}" läuft die 72h-Frist. Bitte Behördenmeldung, Freigabe und Kommunikationskette sofort nachziehen. Friststand: ${meta.urgency}.`,
      },
      "deadline-missed": {
        title: `Fristüberschreitung aufarbeiten: ${item.titel}`,
        priority: "kritisch",
        description: `Für die Datenpanne "${item.titel}" ist die 72h-Frist überschritten, ohne dokumentierte Behördenmeldung. Bitte rechtliche Bewertung, Begründung der Verzögerung und Sofortmaßnahmen umgehend dokumentieren.`,
      },
      "notify-art34": {
        title: `Art.-34-Benachrichtigung prüfen: ${item.titel}`,
        priority: "hoch",
        description: `Die Datenpanne "${item.titel}" ist schwerwiegend und Betroffene wurden noch nicht als informiert dokumentiert. Bitte Benachrichtigungspflicht, Inhalt und Zeitpunkt der Kommunikation prüfen und dokumentieren.`,
      },
    };
    const draft = drafts[kind];
    const params = new URLSearchParams({
      draftTitle: draft.title,
      draftPriority: draft.priority,
      draftDescription: draft.description,
      draftSource: `datenpanne:${kind}:${item.id}`,
    });
    return { href: `/aufgaben?${params.toString()}`, title: draft.title, priority: draft.priority, description: draft.description, source: `datenpanne:${kind}:${item.id}` };
  };

  const createIncidentFollowUpTask = async (item: any, kind: "critical" | "reportable-open" | "deadline-72h" | "deadline-missed" | "notify-art34") => {
    const draft = buildIncidentTaskDraft(item, kind);
    const duplicate = aufgaben.find((task: any) => String(task?.vorlagenBezug || "") === draft.source && String(task?.status || "") !== "erledigt");
    if (duplicate) {
      toast({ title: "Aufgabe bereits vorhanden", description: `Offene Folgeaufgabe gefunden: ${duplicate.titel}` });
      return;
    }
    await apiRequest("POST", `/api/mandanten/${activeMandantId}/aufgaben`, {
      titel: draft.title,
      beschreibung: draft.description,
      typ: kind === "reportable-open" || kind === "notify-art34" ? "review" : "task",
      prioritaet: draft.priority,
      status: "offen",
      fortschritt: 0,
      verantwortlicher: "",
      faelligAm: getIncidentMeta(item).deadline ? getIncidentMeta(item).deadline!.toISOString().split("T")[0] : "",
      kategorie: "datenpanne",
      referenzId: item.id,
      vorlagenBezug: draft.source,
    });
    await qc.invalidateQueries({ queryKey: [`/api/mandanten/${activeMandantId}/aufgaben`] });
    toast({ title: "Folgeaufgabe erstellt", description: draft.title });
  };

  const createIncidentPdcaCycle = async (item: any, kind: "critical" | "reportable-open" | "deadline-72h" | "deadline-missed" | "notify-art34") => {
    const source = `datenpanne-pdca:${kind}:${item.id}`;
    const duplicate = pdca.find((entry: any) => String(entry?.actNaechsterZyklus || "").includes(source) && String(entry?.status || "") !== "abgeschlossen");
    if (duplicate) {
      toast({ title: "PDCA bereits vorhanden", description: `Offener Zyklus gefunden: ${duplicate.titel}` });
      return;
    }
    const meta = getIncidentMeta(item);
    const reviewDate = meta.deadline ? new Date(meta.deadline.getTime()) : new Date();
    reviewDate.setDate(reviewDate.getDate() + (kind === "deadline-missed" || kind === "critical" ? 7 : 14));
    const titleMap: Record<string, string> = {
      critical: `PDCA Kritische Datenpanne: ${item.titel}`,
      "reportable-open": `PDCA Behördenmeldung: ${item.titel}`,
      "deadline-72h": `PDCA 72h-Friststeuerung: ${item.titel}`,
      "deadline-missed": `PDCA Fristüberschreitung: ${item.titel}`,
      "notify-art34": `PDCA Betroffeneninformation: ${item.titel}`,
    };
    const measuresMap: Record<string, string> = {
      critical: "Sofortmaßnahmen, Meldepflichtbewertung, Kommunikations- und Verbesserungsmaßnahmen priorisiert steuern.",
      "reportable-open": "Behördenmeldung, Nachweisführung und interne Freigabekette kurzfristig abschließen.",
      "deadline-72h": "72h-Frist aktiv steuern, Meldung vorbereiten und Verantwortlichkeiten eng nachhalten.",
      "deadline-missed": "Verspätungsbegründung dokumentieren, Behördenkommunikation absichern und Ursachenanalyse durchführen.",
      "notify-art34": "Benachrichtigung betroffener Personen rechtlich prüfen, Inhalt abstimmen und Versand dokumentieren.",
    };
    const pdcaItem = await apiRequest("POST", `/api/mandanten/${activeMandantId}/pdca`, {
      titel: titleMap[kind],
      beschreibung: `Automatisch vorbereiteter PDCA-Zyklus zur Datenpanne "${item.titel}". Fokus: ${meta.urgency}.`,
      zyklusTyp: kind === "reportable-open" || kind === "notify-art34" ? "management_review" : "verbesserungsmassnahme",
      status: "geplant",
      prioritaet: kind === "critical" || kind === "deadline-72h" || kind === "deadline-missed" ? "kritisch" : "hoch",
      verantwortlicher: "",
      naechstePruefungAm: reviewDate.toISOString().split("T")[0],
      planRisiken: `${item.beschreibung || ""}\n\nSchwere: ${item.schwere || "—"}\nBetroffene Personen: ${item.betroffenePersonen || 0}`.trim(),
      planMassnahmen: measuresMap[kind],
      planZiele: `Rechtssichere und nachvollziehbare Abarbeitung der Datenpanne "${item.titel}" sicherstellen.`,
      actNaechsterZyklus: source,
      verknuepftesAuditId: null,
    }).then(r => r.json());

    await apiRequest("POST", `/api/mandanten/${activeMandantId}/aufgaben`, {
      titel: `${titleMap[kind]} – Folgeaufgabe`,
      beschreibung: `Operative Folgeaufgabe zum PDCA-Zyklus "${titleMap[kind]}" für die Datenpanne "${item.titel}".`,
      typ: kind === "reportable-open" || kind === "notify-art34" ? "review" : "task",
      prioritaet: kind === "critical" || kind === "deadline-72h" || kind === "deadline-missed" ? "kritisch" : "hoch",
      status: "offen",
      fortschritt: 0,
      verantwortlicher: "",
      faelligAm: reviewDate.toISOString().split("T")[0],
      kategorie: "datenpanne",
      referenzId: pdcaItem.id,
      vorlagenBezug: "pdca_follow_up",
    });
    await qc.invalidateQueries({ queryKey: [`/api/mandanten/${activeMandantId}/pdca`] });
    await qc.invalidateQueries({ queryKey: [`/api/mandanten/${activeMandantId}/aufgaben`] });
    toast({ title: "PDCA-Zyklus erstellt", description: titleMap[kind] });
  };

  const filteredData = data.filter((item: any) => {
    const meta = getIncidentMeta(item);
    if (incidentFilter === "critical") return meta.isCritical;
    if (incidentFilter === "reportable-open") return meta.reportableOpen;
    if (incidentFilter === "deadline-72h") return meta.deadlineSoon;
    if (incidentFilter === "deadline-missed") return meta.deadlineMissed;
    if (incidentFilter === "notify-art34") return meta.shouldNotifyDataSubjects;
    if (incidentFilter === "open") return meta.isOpen;
    return true;
  }).slice().sort((a: any, b: any) => {
    const metaA = getIncidentMeta(a);
    const metaB = getIncidentMeta(b);
    if (incidentSort === "severity") return (severityWeight[String(a?.schwere || "niedrig").toLowerCase()] ?? 99) - (severityWeight[String(b?.schwere || "niedrig").toLowerCase()] ?? 99) || String(a.titel || "").localeCompare(String(b.titel || ""), "de");
    if (incidentSort === "newest") return (metaB.discoveredAt?.getTime() || 0) - (metaA.discoveredAt?.getTime() || 0);
    if (incidentSort === "title") return String(a.titel || "").localeCompare(String(b.titel || ""), "de");
    const deadlineA = metaA.deadline?.getTime() ?? Number.MAX_SAFE_INTEGER;
    const deadlineB = metaB.deadline?.getTime() ?? Number.MAX_SAFE_INTEGER;
    return deadlineA - deadlineB || (severityWeight[String(a?.schwere || "niedrig").toLowerCase()] ?? 99) - (severityWeight[String(b?.schwere || "niedrig").toLowerCase()] ?? 99);
  });

  return (
    <MandantGuard>
      <PageHeader title={t("incidentsTitle")} desc={t("incidentsDesc")}
        action={<Button size="sm" className="bg-primary h-8 text-xs gap-1.5" onClick={() => setModal("new")}><Plus className="h-3.5 w-3.5" />Neue Panne</Button>} />
      {isLoading ? <Skeleton className="h-32 w-full" /> : (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Datenpannen-Quick-Check</CardTitle>
              <CardDescription>Schneller Blick auf meldepflichtige, fristkritische und besonders schwere Vorfälle</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {data.length === 0 ? (
                <p className="text-muted-foreground">Aktuell keine Datenpannen dokumentiert.</p>
              ) : (
                <>
                  {deadlineMissedItems.length > 0 && <p className="text-red-400">72h-Frist überschritten ohne dokumentierte Meldung: {deadlineMissedItems.length}</p>}
                  {deadlineSoonItems.length > 0 && <p className="text-red-400">Meldepflichtige Vorfälle innerhalb der 72h-Frist: {deadlineSoonItems.length}</p>}
                  {reportableOpenItems.length > 0 && <p className="text-yellow-400">Meldepflichtige Vorfälle ohne abgeschlossene Behördenmeldung: {reportableOpenItems.length}</p>}
                  {notifyArt34Items.length > 0 && <p className="text-yellow-400">Schwere Vorfälle mit möglicher Art.-34-Benachrichtigung: {notifyArt34Items.length}</p>}
                  {criticalItems.length > 0 && <p className="text-yellow-400">Kritische/hohe Datenpannen: {criticalItems.length}</p>}
                  {openItems.length > 0 && <p className="text-muted-foreground">Offene Vorfälle insgesamt: {openItems.length}</p>}
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Datenpannen-Fokusliste</CardTitle>
              <CardDescription>Priorisierte Vorfälle mit unmittelbarem Melde-, Frist- oder Kommunikationsbedarf</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {criticalItems.length === 0 && reportableOpenItems.length === 0 && deadlineSoonItems.length === 0 && deadlineMissedItems.length === 0 && notifyArt34Items.length === 0 ? (
                <p className="text-muted-foreground">Aktuell keine priorisierten Datenpannen-Fälle.</p>
              ) : (
                <>
                  {deadlineMissedItems.slice(0, 3).map((item: any) => (
                    <div key={`deadline-missed-${item.id}`} className="rounded-lg border border-red-500/20 bg-red-500/5 p-3">
                      <p className="font-medium text-red-700 dark:text-red-400">72h-Frist überschritten: {item.titel}</p>
                      <p className="text-xs text-muted-foreground">Empfehlung: Verzögerung rechtlich begründen, Behördenkommunikation absichern und Sofortmaßnahmen dokumentieren.</p>
                      <div className="mt-2 flex gap-2"><Button type="button" size="sm" variant="outline" onClick={() => setIncidentFilter("deadline-missed")}>Nur diese Fälle</Button><Button type="button" size="sm" variant="secondary" onClick={() => createIncidentFollowUpTask(item, "deadline-missed")}>Aufgabe erzeugen</Button><Button type="button" size="sm" variant="secondary" onClick={() => createIncidentPdcaCycle(item, "deadline-missed")}>PDCA erzeugen</Button><Link href={buildIncidentTaskDraft(item, "deadline-missed").href}><a className="text-xs text-primary hover:underline self-center">Aufgabe vorbereiten</a></Link></div>
                    </div>
                  ))}
                  {deadlineSoonItems.slice(0, 3).map((item: any) => (
                    <div key={`deadline-72h-${item.id}`} className="rounded-lg border border-red-500/20 bg-red-500/5 p-3">
                      <p className="font-medium text-red-700 dark:text-red-400">72h-Frist aktiv: {item.titel}</p>
                      <p className="text-xs text-muted-foreground">Empfehlung: Meldeweg, Freigabe und Nachweisführung sofort nachhalten.</p>
                      <div className="mt-2 flex gap-2"><Button type="button" size="sm" variant="outline" onClick={() => setIncidentFilter("deadline-72h")}>Nur diese Fälle</Button><Button type="button" size="sm" variant="secondary" onClick={() => createIncidentFollowUpTask(item, "deadline-72h")}>Aufgabe erzeugen</Button><Button type="button" size="sm" variant="secondary" onClick={() => createIncidentPdcaCycle(item, "deadline-72h")}>PDCA erzeugen</Button><Link href={buildIncidentTaskDraft(item, "deadline-72h").href}><a className="text-xs text-primary hover:underline self-center">Aufgabe vorbereiten</a></Link></div>
                    </div>
                  ))}
                  {reportableOpenItems.slice(0, 3).filter((item: any) => !getIncidentMeta(item).deadlineSoon && !getIncidentMeta(item).deadlineMissed).map((item: any) => (
                    <div key={`reportable-open-${item.id}`} className="rounded-lg border border-yellow-500/20 bg-yellow-500/5 p-3">
                      <p className="font-medium text-yellow-700 dark:text-yellow-400">Meldepflichtig, Meldung offen: {item.titel}</p>
                      <p className="text-xs text-muted-foreground">Empfehlung: Art.-33-Bewertung, Meldung und Nachweisführung strukturiert abschließen.</p>
                      <div className="mt-2 flex gap-2"><Button type="button" size="sm" variant="outline" onClick={() => setIncidentFilter("reportable-open")}>Nur diese Fälle</Button><Button type="button" size="sm" variant="secondary" onClick={() => createIncidentFollowUpTask(item, "reportable-open")}>Aufgabe erzeugen</Button><Button type="button" size="sm" variant="secondary" onClick={() => createIncidentPdcaCycle(item, "reportable-open")}>PDCA erzeugen</Button><Link href={buildIncidentTaskDraft(item, "reportable-open").href}><a className="text-xs text-primary hover:underline self-center">Aufgabe vorbereiten</a></Link></div>
                    </div>
                  ))}
                  {notifyArt34Items.slice(0, 3).map((item: any) => (
                    <div key={`notify-art34-${item.id}`} className="rounded-lg border border-yellow-500/20 bg-yellow-500/5 p-3">
                      <p className="font-medium text-yellow-700 dark:text-yellow-400">Art.-34-Prüfbedarf: {item.titel}</p>
                      <p className="text-xs text-muted-foreground">Empfehlung: Betroffeneninformation rechtlich bewerten und Kommunikationsstatus dokumentieren.</p>
                      <div className="mt-2 flex gap-2"><Button type="button" size="sm" variant="outline" onClick={() => setIncidentFilter("notify-art34")}>Nur diese Fälle</Button><Button type="button" size="sm" variant="secondary" onClick={() => createIncidentFollowUpTask(item, "notify-art34")}>Aufgabe erzeugen</Button><Button type="button" size="sm" variant="secondary" onClick={() => createIncidentPdcaCycle(item, "notify-art34")}>PDCA erzeugen</Button><Link href={buildIncidentTaskDraft(item, "notify-art34").href}><a className="text-xs text-primary hover:underline self-center">Aufgabe vorbereiten</a></Link></div>
                    </div>
                  ))}
                  {criticalItems.slice(0, 3).filter((item: any) => !getIncidentMeta(item).deadlineSoon && !getIncidentMeta(item).deadlineMissed).map((item: any) => (
                    <div key={`critical-${item.id}`} className="rounded-lg border border-orange-500/20 bg-orange-500/5 p-3">
                      <p className="font-medium text-orange-700 dark:text-orange-400">Kritische/hohe Datenpanne: {item.titel}</p>
                      <p className="text-xs text-muted-foreground">Empfehlung: Lagebewertung, Sofortmaßnahmen und Governance-Nachsteuerung priorisieren.</p>
                      <div className="mt-2 flex gap-2"><Button type="button" size="sm" variant="outline" onClick={() => setIncidentFilter("critical")}>Nur diese Fälle</Button><Button type="button" size="sm" variant="secondary" onClick={() => createIncidentFollowUpTask(item, "critical")}>Aufgabe erzeugen</Button><Button type="button" size="sm" variant="secondary" onClick={() => createIncidentPdcaCycle(item, "critical")}>PDCA erzeugen</Button><Link href={buildIncidentTaskDraft(item, "critical").href}><a className="text-xs text-primary hover:underline self-center">Aufgabe vorbereiten</a></Link></div>
                    </div>
                  ))}
                </>
              )}
            </CardContent>
          </Card>

          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <Button type="button" size="sm" variant={incidentFilter === "all" ? "default" : "outline"} onClick={() => setIncidentFilter("all")}>Alle</Button>
              <Button type="button" size="sm" variant={incidentFilter === "critical" ? "default" : "outline"} onClick={() => setIncidentFilter("critical")}>Kritisch/Hoch</Button>
              <Button type="button" size="sm" variant={incidentFilter === "reportable-open" ? "default" : "outline"} onClick={() => setIncidentFilter("reportable-open")}>Meldepflicht offen</Button>
              <Button type="button" size="sm" variant={incidentFilter === "deadline-72h" ? "default" : "outline"} onClick={() => setIncidentFilter("deadline-72h")}>72h-Frist läuft</Button>
              <Button type="button" size="sm" variant={incidentFilter === "deadline-missed" ? "default" : "outline"} onClick={() => setIncidentFilter("deadline-missed")}>72h überschritten</Button>
              <Button type="button" size="sm" variant={incidentFilter === "notify-art34" ? "default" : "outline"} onClick={() => setIncidentFilter("notify-art34")}>Art. 34 prüfen</Button>
              <Button type="button" size="sm" variant={incidentFilter === "open" ? "default" : "outline"} onClick={() => setIncidentFilter("open")}>Nur offen</Button>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-muted-foreground">Sortierung:</span>
              <Button type="button" size="sm" variant={incidentSort === "deadline" ? "default" : "outline"} onClick={() => setIncidentSort("deadline")}>Frist zuerst</Button>
              <Button type="button" size="sm" variant={incidentSort === "severity" ? "default" : "outline"} onClick={() => setIncidentSort("severity")}>Schwere</Button>
              <Button type="button" size="sm" variant={incidentSort === "newest" ? "default" : "outline"} onClick={() => setIncidentSort("newest")}>Neueste</Button>
              <Button type="button" size="sm" variant={incidentSort === "title" ? "default" : "outline"} onClick={() => setIncidentSort("title")}>Titel</Button>
            </div>

            {filteredData.length === 0 && <Card className="border-dashed"><CardContent className="py-12 text-center text-sm text-muted-foreground">Keine Datenpannen für die aktuelle Filterung.</CardContent></Card>}
            {data.length === 0 && <Card className="border-dashed"><CardContent className="py-12 text-center text-sm text-muted-foreground">Keine Datenpannen erfasst.</CardContent></Card>}
            {filteredData.map((item: any) => {
              const meta = getIncidentMeta(item);
              return (
                <Card key={item.id} className={`group hover:border-border/80 transition-colors ${meta.deadlineMissed || String(item.schwere || "").toLowerCase() === "kritisch" ? "border-red-500/30" : meta.deadlineSoon ? "border-orange-500/30" : ""}`}>
                  <CardContent className="py-3 px-4 flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center sm:gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <AlertCircle className={`h-4 w-4 shrink-0 ${meta.deadlineMissed || String(item.schwere || "").toLowerCase() === "kritisch" ? "text-red-400" : String(item.schwere || "").toLowerCase() === "hoch" || meta.deadlineSoon ? "text-orange-400" : "text-yellow-400"}`} />
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{item.titel}</p>
                        <p className="text-xs text-muted-foreground">{item.entdecktAm} · {item.betroffenePersonen} Betr. · {item.meldepflichtig ? "Meldepflichtig" : "Nicht meldepflichtig"}</p>
                        <p className="text-xs text-muted-foreground truncate">72h-Frist: {formatDeadline(meta.deadline)} · {meta.urgency}</p>
                        <p className="text-xs text-muted-foreground truncate">Behördenmeldung: {meta.authorityReported ? "dokumentiert" : "offen"}{meta.shouldNotifyDataSubjects ? " · Art. 34 prüfen" : ""}</p>
                      </div>
                    </div>
                    <div className="flex w-full items-center justify-between gap-2 shrink-0 sm:w-auto sm:justify-end">
                      <div className="flex items-center gap-2 flex-wrap justify-end">
                        {meta.deadlineMissed && <Badge variant="outline" className="text-xs border-red-500/40 text-red-600">72h überschritten</Badge>}
                        {!meta.deadlineMissed && meta.deadlineSoon && <Badge variant="outline" className="text-xs border-orange-500/40 text-orange-600">72h läuft</Badge>}
                        {meta.reportableOpen && <Badge variant="outline" className="text-xs border-yellow-500/40 text-yellow-600">Meldung offen</Badge>}
                        {meta.shouldNotifyDataSubjects && <Badge variant="outline" className="text-xs border-yellow-500/40 text-yellow-600">Art. 34</Badge>}
                        <StatusBadge value={item.schwere} />
                        <StatusBadge value={item.status} />
                      </div>
                      <button onClick={() => setModal(item)} className="p-1 rounded text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-all"><Pencil className="h-3.5 w-3.5" /></button>
                      <button onClick={() => setDelId(item.id)} className="p-1 rounded text-muted-foreground hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"><Trash2 className="h-3.5 w-3.5" /></button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}
      <Dialog open={!!modal} onOpenChange={o => !o && setModal(null)}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto"><div className="sticky top-0 z-10 -mx-6 border-b bg-background px-6 pb-3 pt-1"><DialogHeader><DialogTitle>{modal === "new" ? "Neue Datenpanne" : "Datenpanne bearbeiten"}</DialogTitle></DialogHeader></div>
          {modal && <DatenpanneForm initial={modal === "new" ? {} : modal} onSave={save} onCancel={() => setModal(null)} />}
        </DialogContent>
      </Dialog>
      <ConfirmDialog open={delId !== null} title="Datenpanne löschen?" desc="Dieser Vorgang kann nicht rückgängig gemacht werden."
        onConfirm={() => { remove.mutate(delId!); setDelId(null); }} onCancel={() => setDelId(null)} />
    </MandantGuard>
  );
}

// ─── DSR PAGE ──────────────────────────────────────────────────────────────
const dsrArten: Record<string, string> = {
  auskunft: "Auskunft (Art. 15)", berichtigung: "Berichtigung (Art. 16)", loeschung: "Löschung (Art. 17)",
  einschraenkung: "Einschränkung (Art. 18)", portabilitaet: "Datenübertragbarkeit (Art. 20)", widerspruch: "Widerspruch (Art. 21)"
};

function DsrForm({ initial, onSave, onCancel }: any) {
  const [form, setForm] = useState({ art: "auskunft", antragsteller: "", eingangsdatum: new Date().toISOString().split("T")[0], fristDatum: "", beschreibung: "", status: "offen", notizen: "", ...initial });
  const set = (k: string, v: any) => setForm((p: any) => ({ ...p, [k]: v }));
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="col-span-2 space-y-1"><Label className="text-xs">Art der Anfrage *</Label>
          <Select value={form.art} onValueChange={v => set("art", v)}>
            <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>{Object.entries(dsrArten).map(([k, v]) => <SelectItem key={k} value={k} className="text-xs">{v}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-1"><Label className="text-xs">Antragsteller</Label><Input value={form.antragsteller} onChange={e => set("antragsteller", e.target.value)} className="h-8 text-sm" placeholder="Anonym möglich" /></div>
        <div className="space-y-1"><Label className="text-xs">Eingang *</Label><Input type="date" value={form.eingangsdatum} onChange={e => set("eingangsdatum", e.target.value)} className="h-8 text-sm" /></div>
        <div className="space-y-1"><Label className="text-xs">Frist (30 Tage)</Label><Input type="date" value={form.fristDatum} onChange={e => set("fristDatum", e.target.value)} className="h-8 text-sm" /></div>
        <div className="space-y-1"><Label className="text-xs">Status</Label>
          <Select value={form.status} onValueChange={v => set("status", v)}>
            <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="offen">Offen</SelectItem><SelectItem value="in_bearbeitung">In Bearbeitung</SelectItem><SelectItem value="abgeschlossen">Abgeschlossen</SelectItem><SelectItem value="abgelehnt">Abgelehnt</SelectItem></SelectContent>
          </Select>
        </div>
        <div className="col-span-2 space-y-1"><Label className="text-xs">Beschreibung</Label><Textarea value={form.beschreibung} onChange={e => set("beschreibung", e.target.value)} className="text-sm min-h-12" /></div>
        <div className="col-span-2 space-y-1"><Label className="text-xs">Notizen</Label><Textarea value={form.notizen} onChange={e => set("notizen", e.target.value)} className="text-sm min-h-10" /></div>
      </div>
      <DialogFooter>
        <Button variant="outline" size="sm" onClick={onCancel}>Abbrechen</Button>
        <Button size="sm" className="bg-primary" onClick={() => onSave(form)}>Speichern</Button>
      </DialogFooter>
    </div>
  );
}

function DsrPage() {
  const { t } = useI18n();
  const [location, setLocation] = useLocation();
  const { activeMandantId } = useMandant();
  const qc = useQueryClient();
  const { data, isLoading, create, update, remove } = useModuleData("dsr");
  const { data: aufgaben = [] } = useModuleData("aufgaben");
  const { data: pdca = [] } = useModuleData("pdca");
  const [modal, setModal] = useState<null | "new" | any>(null);
  const [delId, setDelId] = useState<number | null>(null);
  const [dsrFilter, setDsrFilterState] = useState<"all" | "deadline-missed" | "deadline-soon" | "missing-deadline" | "open" | "verification">("all");
  const [dsrSort, setDsrSortState] = useState<"deadline" | "newest" | "type">("deadline");
  const { toast } = useToast();
  const today = new Date().toISOString().split("T")[0];

  useEffect(() => {
    const route = new URL(location, "https://privashield.local");
    const rawFilter = route.searchParams.get("filter");
    const rawSort = route.searchParams.get("sort");
    setDsrFilterState(rawFilter === "deadline-missed" || rawFilter === "deadline-soon" || rawFilter === "missing-deadline" || rawFilter === "open" || rawFilter === "verification" ? rawFilter : "all");
    setDsrSortState(rawSort === "newest" || rawSort === "type" ? rawSort : "deadline");
  }, [location]);

  const updateDsrRouteState = (nextFilter: "all" | "deadline-missed" | "deadline-soon" | "missing-deadline" | "open" | "verification", nextSort: "deadline" | "newest" | "type") => {
    const next = new URL(location, "https://privashield.local");
    if (nextFilter === "all") next.searchParams.delete("filter");
    else next.searchParams.set("filter", nextFilter);
    if (nextSort === "deadline") next.searchParams.delete("sort");
    else next.searchParams.set("sort", nextSort);
    setLocation(`${next.pathname}${next.search}`);
  };
  const setDsrFilter = (value: "all" | "deadline-missed" | "deadline-soon" | "missing-deadline" | "open" | "verification") => {
    setDsrFilterState(value);
    updateDsrRouteState(value, dsrSort);
  };
  const setDsrSort = (value: "deadline" | "newest" | "type") => {
    setDsrSortState(value);
    updateDsrRouteState(dsrFilter, value);
  };

  const save = (form: any) => {
    const p = modal === "new" ? create.mutateAsync(form) : update.mutateAsync({ id: modal.id, ...form });
    p.then(() => { setModal(null); toast({ title: "Gespeichert" }); }).catch((e:any) => toast({ title: "Fehler", description: e?.message || "Speichern fehlgeschlagen", variant: "destructive" }));
  };

  const getDsrMeta = (item: any) => {
    const deadline = String(item?.fristDatum || "").trim();
    const status = String(item?.status || "");
    const isClosed = status === "abgeschlossen" || status === "abgelehnt";
    const deadlineMissed = !!deadline && deadline < today && !isClosed;
    const deadlineSoon = !!deadline && deadline >= today && ((new Date(`${deadline}T00:00:00`).getTime() - new Date(`${today}T00:00:00`).getTime()) / (1000 * 60 * 60 * 24)) <= 7 && !isClosed;
    const missingDeadline = !deadline && !isClosed;
    const open = !isClosed;
    const verification = status === "in_pruefung" || status === "wartet_auf_identifikation";
    return { deadline, isClosed, deadlineMissed, deadlineSoon, missingDeadline, open, verification };
  };

  const dsrDeadlineMissedItems = data.filter((item: any) => getDsrMeta(item).deadlineMissed);
  const dsrDeadlineSoonItems = data.filter((item: any) => getDsrMeta(item).deadlineSoon);
  const dsrMissingDeadlineItems = data.filter((item: any) => getDsrMeta(item).missingDeadline);
  const dsrOpenItems = data.filter((item: any) => getDsrMeta(item).open);
  const dsrVerificationItems = data.filter((item: any) => getDsrMeta(item).verification);

  const buildDsrTaskDraft = (item: any, kind: "deadline-missed" | "deadline-soon" | "missing-deadline" | "verification") => {
    const drafts: Record<string, { title: string; priority: string; description: string }> = {
      "deadline-missed": {
        title: `DSR-Frist überschritten: ${dsrArten[item.art] || item.art}`,
        priority: "kritisch",
        description: `Die Betroffenenanfrage von ${item.antragsteller || "unbekannt"} hat ihre Frist überschritten. Bitte Rechtslage, Kommunikationsstand und Sofortmaßnahmen dokumentieren.`,
      },
      "deadline-soon": {
        title: `DSR-Frist absichern: ${dsrArten[item.art] || item.art}`,
        priority: "hoch",
        description: `Die Betroffenenanfrage von ${item.antragsteller || "unbekannt"} läuft kurzfristig aus. Bitte Bearbeitung, Rückmeldung und Nachweise priorisieren.`,
      },
      "missing-deadline": {
        title: `DSR-Frist ergänzen: ${dsrArten[item.art] || item.art}`,
        priority: "mittel",
        description: `Für die Betroffenenanfrage von ${item.antragsteller || "unbekannt"} fehlt eine dokumentierte Frist. Bitte Fristberechnung und Bearbeitungssteuerung nachziehen.`,
      },
      verification: {
        title: `DSR-Identitäts-/Prüfstatus klären: ${dsrArten[item.art] || item.art}`,
        priority: "hoch",
        description: `Die Betroffenenanfrage von ${item.antragsteller || "unbekannt"} befindet sich im Prüfstatus. Bitte Identifikation, Umfang und Bearbeitungsstand verbindlich klären.`,
      },
    };
    const draft = drafts[kind];
    const params = new URLSearchParams({ draftTitle: draft.title, draftPriority: draft.priority, draftDescription: draft.description, draftSource: `dsr:${kind}:${item.id}` });
    return { href: `/aufgaben?${params.toString()}`, title: draft.title, priority: draft.priority, description: draft.description, source: `dsr:${kind}:${item.id}` };
  };

  const createDsrFollowUpTask = async (item: any, kind: "deadline-missed" | "deadline-soon" | "missing-deadline" | "verification") => {
    const draft = buildDsrTaskDraft(item, kind);
    const duplicate = aufgaben.find((task: any) => String(task?.vorlagenBezug || "") === draft.source && String(task?.status || "") !== "erledigt");
    if (duplicate) {
      toast({ title: "Aufgabe bereits vorhanden", description: `Offene Folgeaufgabe gefunden: ${duplicate.titel}` });
      return;
    }
    await apiRequest("POST", `/api/mandanten/${activeMandantId}/aufgaben`, {
      titel: draft.title,
      beschreibung: draft.description,
      typ: kind === "verification" ? "review" : "task",
      prioritaet: draft.priority,
      status: "offen",
      fortschritt: 0,
      verantwortlicher: "",
      faelligAm: getDsrMeta(item).deadline || "",
      kategorie: "dsr",
      referenzId: item.id,
      vorlagenBezug: draft.source,
    });
    await qc.invalidateQueries({ queryKey: [`/api/mandanten/${activeMandantId}/aufgaben`] });
    toast({ title: "Folgeaufgabe erstellt", description: draft.title });
  };

  const createDsrPdcaCycle = async (item: any, kind: "deadline-missed" | "deadline-soon" | "missing-deadline" | "verification") => {
    const source = `dsr-pdca:${kind}:${item.id}`;
    const duplicate = pdca.find((entry: any) => String(entry?.actNaechsterZyklus || "").includes(source) && String(entry?.status || "") !== "abgeschlossen");
    if (duplicate) {
      toast({ title: "PDCA bereits vorhanden", description: `Offener Zyklus gefunden: ${duplicate.titel}` });
      return;
    }
    const reviewDate = new Date();
    reviewDate.setDate(reviewDate.getDate() + (kind === "deadline-missed" ? 3 : kind === "deadline-soon" ? 7 : 14));
    const titleMap: Record<string, string> = {
      "deadline-missed": `PDCA DSR-Fristverletzung: ${dsrArten[item.art] || item.art}`,
      "deadline-soon": `PDCA DSR-Fristsicherung: ${dsrArten[item.art] || item.art}`,
      "missing-deadline": `PDCA DSR-Friststeuerung: ${dsrArten[item.art] || item.art}`,
      verification: `PDCA DSR-Prüfstatus: ${dsrArten[item.art] || item.art}`,
    };
    const pdcaItem = await apiRequest("POST", `/api/mandanten/${activeMandantId}/pdca`, {
      titel: titleMap[kind],
      beschreibung: `Verbesserungszyklus zur Bearbeitung der Betroffenenanfrage von ${item.antragsteller || "unbekannt"}.`,
      zyklusTyp: "verbesserungsmassnahme",
      status: "geplant",
      prioritaet: kind === "deadline-missed" ? "kritisch" : "hoch",
      verantwortlicher: "",
      naechstePruefungAm: reviewDate.toISOString().split("T")[0],
      planRisiken: `DSR-Anfrage: ${dsrArten[item.art] || item.art}\nAntragsteller: ${item.antragsteller || "unbekannt"}\nStatus: ${item.status || "offen"}`,
      planMassnahmen: kind === "deadline-missed" ? "Fristverletzung rechtlich und operativ aufarbeiten, Rückmeldung absichern und Nachweisführung schließen." : kind === "deadline-soon" ? "Bearbeitung priorisieren, Rückmeldung vorbereiten und Nachweise bündeln." : kind === "missing-deadline" ? "Fristberechnung und Zuständigkeit verbindlich festlegen." : "Identitätsprüfung, Umfang und Bearbeitungsweg rechtssicher klären.",
      planZiele: "Betroffenenanfragen fristgerecht, nachvollziehbar und rechtskonform steuern.",
      actNaechsterZyklus: source,
      verknuepftesAuditId: null,
    }).then(r => r.json());
    await apiRequest("POST", `/api/mandanten/${activeMandantId}/aufgaben`, {
      titel: `${titleMap[kind]} – Folgeaufgabe`,
      beschreibung: `Operative Folgeaufgabe zum DSR-PDCA-Zyklus für ${item.antragsteller || "unbekannt"}.`,
      typ: kind === "verification" ? "review" : "task",
      prioritaet: kind === "deadline-missed" ? "kritisch" : "hoch",
      status: "offen",
      fortschritt: 0,
      verantwortlicher: "",
      faelligAm: reviewDate.toISOString().split("T")[0],
      kategorie: "dsr",
      referenzId: pdcaItem.id,
      vorlagenBezug: "pdca_follow_up",
    });
    await qc.invalidateQueries({ queryKey: [`/api/mandanten/${activeMandantId}/pdca`] });
    await qc.invalidateQueries({ queryKey: [`/api/mandanten/${activeMandantId}/aufgaben`] });
    toast({ title: "PDCA-Zyklus erstellt", description: titleMap[kind] });
  };

  const filtered = data.filter((item: any) => {
    const meta = getDsrMeta(item);
    if (dsrFilter === "deadline-missed") return meta.deadlineMissed;
    if (dsrFilter === "deadline-soon") return meta.deadlineSoon;
    if (dsrFilter === "missing-deadline") return meta.missingDeadline;
    if (dsrFilter === "open") return meta.open;
    if (dsrFilter === "verification") return meta.verification;
    return true;
  }).slice().sort((a: any, b: any) => {
    const metaA = getDsrMeta(a);
    const metaB = getDsrMeta(b);
    if (dsrSort === "newest") return String(b.eingangsdatum || "").localeCompare(String(a.eingangsdatum || "")) || String(a.antragsteller || "").localeCompare(String(b.antragsteller || ""), "de");
    if (dsrSort === "type") return String(dsrArten[a.art] || a.art || "").localeCompare(String(dsrArten[b.art] || b.art || ""), "de") || String(a.eingangsdatum || "").localeCompare(String(b.eingangsdatum || ""));
    return (metaA.deadline || "9999-12-31").localeCompare(metaB.deadline || "9999-12-31") || String(a.eingangsdatum || "").localeCompare(String(b.eingangsdatum || ""));
  });

  return (
    <MandantGuard>
      <PageHeader title={t("dsrTitle")} desc={t("dsrDesc")}
        action={<Button size="sm" className="bg-primary h-8 text-xs gap-1.5" onClick={() => setModal("new")}><Plus className="h-3.5 w-3.5" />Neue Anfrage</Button>} />
      {isLoading ? <Skeleton className="h-32 w-full" /> : (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">DSR-Quick-Check</CardTitle>
              <CardDescription>Schneller Blick auf Fristen, offene Fälle und Prüfbedarfe bei Betroffenenanfragen</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {data.length === 0 ? <p className="text-muted-foreground">Keine DSR-Anfragen dokumentiert.</p> : <>
                {dsrDeadlineMissedItems.length > 0 && <p className="text-red-400">DSR-Fristen überschritten: {dsrDeadlineMissedItems.length}</p>}
                {dsrDeadlineSoonItems.length > 0 && <p className="text-yellow-400">DSR-Fristen innerhalb von 7 Tagen: {dsrDeadlineSoonItems.length}</p>}
                {dsrMissingDeadlineItems.length > 0 && <p className="text-yellow-400">DSR ohne dokumentierte Frist: {dsrMissingDeadlineItems.length}</p>}
                {dsrVerificationItems.length > 0 && <p className="text-yellow-400">DSR im Prüf-/Identifikationsstatus: {dsrVerificationItems.length}</p>}
              </>}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">DSR-Fokusliste</CardTitle>
              <CardDescription>Priorisierte Betroffenenanfragen mit unmittelbarem Frist-, Prüf- oder Steuerungsbedarf</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {dsrDeadlineMissedItems.length === 0 && dsrDeadlineSoonItems.length === 0 && dsrMissingDeadlineItems.length === 0 && dsrVerificationItems.length === 0 ? (
                <p className="text-muted-foreground">Aktuell keine priorisierten DSR-Fälle.</p>
              ) : (
                <>
                  {dsrDeadlineMissedItems.slice(0, 3).map((item: any) => (
                    <div key={`deadline-missed-${item.id}`} className="rounded-lg border border-red-500/20 bg-red-500/5 p-3">
                      <p className="font-medium text-red-700 dark:text-red-400">Frist überschritten: {item.antragsteller || "Anonym"}</p>
                      <p className="text-xs text-muted-foreground">Empfehlung: Rechtslage, Rückmeldung und Nachweisführung sofort absichern.</p>
                      <div className="mt-2 flex gap-2"><Button type="button" size="sm" variant="outline" onClick={() => setDsrFilter("deadline-missed")}>Nur diese Fälle</Button><Button type="button" size="sm" variant="secondary" onClick={() => createDsrFollowUpTask(item, "deadline-missed")}>Aufgabe erzeugen</Button><Button type="button" size="sm" variant="secondary" onClick={() => createDsrPdcaCycle(item, "deadline-missed")}>PDCA erzeugen</Button><Link href={buildDsrTaskDraft(item, "deadline-missed").href}><a className="text-xs text-primary hover:underline self-center">Aufgabe vorbereiten</a></Link></div>
                    </div>
                  ))}
                  {dsrDeadlineSoonItems.slice(0, 3).map((item: any) => (
                    <div key={`deadline-soon-${item.id}`} className="rounded-lg border border-yellow-500/20 bg-yellow-500/5 p-3">
                      <p className="font-medium text-yellow-700 dark:text-yellow-400">Frist läuft bald ab: {item.antragsteller || "Anonym"}</p>
                      <p className="text-xs text-muted-foreground">Empfehlung: Bearbeitung und Rückmeldung kurzfristig priorisieren.</p>
                      <div className="mt-2 flex gap-2"><Button type="button" size="sm" variant="outline" onClick={() => setDsrFilter("deadline-soon")}>Nur diese Fälle</Button><Button type="button" size="sm" variant="secondary" onClick={() => createDsrFollowUpTask(item, "deadline-soon")}>Aufgabe erzeugen</Button><Button type="button" size="sm" variant="secondary" onClick={() => createDsrPdcaCycle(item, "deadline-soon")}>PDCA erzeugen</Button><Link href={buildDsrTaskDraft(item, "deadline-soon").href}><a className="text-xs text-primary hover:underline self-center">Aufgabe vorbereiten</a></Link></div>
                    </div>
                  ))}
                  {dsrMissingDeadlineItems.slice(0, 3).map((item: any) => (
                    <div key={`missing-deadline-${item.id}`} className="rounded-lg border border-yellow-500/20 bg-yellow-500/5 p-3">
                      <p className="font-medium text-yellow-700 dark:text-yellow-400">Frist fehlt: {item.antragsteller || "Anonym"}</p>
                      <p className="text-xs text-muted-foreground">Empfehlung: Fristberechnung und Zuständigkeit verbindlich ergänzen.</p>
                      <div className="mt-2 flex gap-2"><Button type="button" size="sm" variant="outline" onClick={() => setDsrFilter("missing-deadline")}>Nur diese Fälle</Button><Button type="button" size="sm" variant="secondary" onClick={() => createDsrFollowUpTask(item, "missing-deadline")}>Aufgabe erzeugen</Button><Button type="button" size="sm" variant="secondary" onClick={() => createDsrPdcaCycle(item, "missing-deadline")}>PDCA erzeugen</Button><Link href={buildDsrTaskDraft(item, "missing-deadline").href}><a className="text-xs text-primary hover:underline self-center">Aufgabe vorbereiten</a></Link></div>
                    </div>
                  ))}
                  {dsrVerificationItems.slice(0, 3).map((item: any) => (
                    <div key={`verification-${item.id}`} className="rounded-lg border border-yellow-500/20 bg-yellow-500/5 p-3">
                      <p className="font-medium text-yellow-700 dark:text-yellow-400">Prüfstatus klären: {item.antragsteller || "Anonym"}</p>
                      <p className="text-xs text-muted-foreground">Empfehlung: Identifikation, Umfang und Bearbeitungsstatus verbindlich klären.</p>
                      <div className="mt-2 flex gap-2"><Button type="button" size="sm" variant="outline" onClick={() => setDsrFilter("verification")}>Nur diese Fälle</Button><Button type="button" size="sm" variant="secondary" onClick={() => createDsrFollowUpTask(item, "verification")}>Aufgabe erzeugen</Button><Button type="button" size="sm" variant="secondary" onClick={() => createDsrPdcaCycle(item, "verification")}>PDCA erzeugen</Button><Link href={buildDsrTaskDraft(item, "verification").href}><a className="text-xs text-primary hover:underline self-center">Aufgabe vorbereiten</a></Link></div>
                    </div>
                  ))}
                </>
              )}
            </CardContent>
          </Card>

          <div className="flex gap-2 mb-1 flex-wrap">
            <Button type="button" size="sm" variant={dsrFilter === "all" ? "default" : "outline"} onClick={() => setDsrFilter("all")}>Alle</Button>
            <Button type="button" size="sm" variant={dsrFilter === "deadline-missed" ? "default" : "outline"} onClick={() => setDsrFilter("deadline-missed")}>Frist überschritten</Button>
            <Button type="button" size="sm" variant={dsrFilter === "deadline-soon" ? "default" : "outline"} onClick={() => setDsrFilter("deadline-soon")}>Frist bald</Button>
            <Button type="button" size="sm" variant={dsrFilter === "missing-deadline" ? "default" : "outline"} onClick={() => setDsrFilter("missing-deadline")}>Ohne Frist</Button>
            <Button type="button" size="sm" variant={dsrFilter === "verification" ? "default" : "outline"} onClick={() => setDsrFilter("verification")}>Prüfstatus</Button>
            <Button type="button" size="sm" variant={dsrFilter === "open" ? "default" : "outline"} onClick={() => setDsrFilter("open")}>Offen</Button>
          </div>
          <div className="flex gap-2 mb-4 flex-wrap items-center">
            <span className="text-xs text-muted-foreground">Sortierung:</span>
            <Button type="button" size="sm" variant={dsrSort === "deadline" ? "default" : "outline"} onClick={() => setDsrSort("deadline")}>Frist</Button>
            <Button type="button" size="sm" variant={dsrSort === "newest" ? "default" : "outline"} onClick={() => setDsrSort("newest")}>Neueste</Button>
            <Button type="button" size="sm" variant={dsrSort === "type" ? "default" : "outline"} onClick={() => setDsrSort("type")}>Art</Button>
          </div>

          {data.length === 0 && <Card className="border-dashed"><CardContent className="py-12 text-center text-sm text-muted-foreground">Keine DSR-Anfragen vorhanden.</CardContent></Card>}
          {filtered.map((item: any) => {
            const meta = getDsrMeta(item);
            return (
              <Card key={item.id} className={`group hover:border-border/80 transition-colors ${meta.deadlineMissed ? "border-red-500/30" : meta.deadlineSoon || meta.missingDeadline || meta.verification ? "border-yellow-500/30" : ""}`}>
                <CardContent className="py-3 px-4 flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center sm:gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <UserCheck className={`h-4 w-4 shrink-0 ${meta.deadlineMissed ? "text-red-400" : meta.deadlineSoon || meta.missingDeadline || meta.verification ? "text-yellow-400" : "text-purple-400"}`} />
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{dsrArten[item.art] || item.art}</p>
                      <p className="text-xs text-muted-foreground">{item.antragsteller || "Anonym"} · Eingang: {item.eingangsdatum}{meta.deadline ? ` · Frist: ${meta.deadline}` : " · Frist offen"}</p>
                      <p className="text-xs text-muted-foreground">{item.status || "offen"}{meta.deadlineMissed ? " · Frist überschritten" : meta.deadlineSoon ? " · Frist läuft" : meta.missingDeadline ? " · Frist ergänzen" : ""}</p>
                    </div>
                  </div>
                  <div className="flex w-full items-center justify-between gap-2 shrink-0 sm:w-auto sm:justify-end">
                    <div className="flex items-center gap-2 flex-wrap justify-end">
                      {meta.deadlineMissed && <Badge variant="outline" className="text-xs border-red-500/40 text-red-600">Überfällig</Badge>}
                      {meta.deadlineSoon && <Badge variant="outline" className="text-xs border-yellow-500/40 text-yellow-600">Frist bald</Badge>}
                      {meta.missingDeadline && <Badge variant="outline" className="text-xs border-yellow-500/40 text-yellow-600">Frist fehlt</Badge>}
                      {meta.verification && <Badge variant="outline" className="text-xs border-yellow-500/40 text-yellow-600">Prüfstatus</Badge>}
                      <StatusBadge value={item.status} />
                    </div>
                    <button onClick={() => setModal(item)} className="p-1 rounded text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-all"><Pencil className="h-3.5 w-3.5" /></button>
                    <button onClick={() => setDelId(item.id)} className="p-1 rounded text-muted-foreground hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"><Trash2 className="h-3.5 w-3.5" /></button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
      <Dialog open={!!modal} onOpenChange={o => !o && setModal(null)}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto"><div className="sticky top-0 z-10 -mx-6 border-b bg-background px-6 pb-3 pt-1"><DialogHeader><DialogTitle>{modal === "new" ? "Neue DSR-Anfrage" : "DSR-Anfrage bearbeiten"}</DialogTitle></DialogHeader></div>
          {modal && <DsrForm initial={modal === "new" ? {} : modal} onSave={save} onCancel={() => setModal(null)} />}
        </DialogContent>
      </Dialog>
      <ConfirmDialog open={delId !== null} title="Anfrage löschen?" desc="Dieser Vorgang kann nicht rückgängig gemacht werden."
        onConfirm={() => { remove.mutate(delId!); setDelId(null); }} onCancel={() => setDelId(null)} />
    </MandantGuard>
  );
}

// ─── TOM PAGE ──────────────────────────────────────────────────────────────
const tomKategorien: Record<string, string> = {
  zutrittskontrolle: "Zutrittskontrolle", zugangskontrolle: "Zugangskontrolle", zugriffskontrolle: "Zugriffskontrolle",
  weitergabe: "Weitergabekontrolle", eingabe: "Eingabekontrolle", auftrag: "Auftragskontrolle",
  verfuegbarkeit: "Verfügbarkeitskontrolle", trennung: "Trennungsgebot"
};

const tomTemplates: Record<string, any> = {
  none: null,
  mfa: {
    massnahme: "Mehr-Faktor-Authentisierung für kritische Systeme",
    kategorie: "zugangskontrolle",
    beschreibung: "Absicherung administrativer und sensibler Benutzerzugänge durch MFA.",
    status: "implementiert",
    verantwortlicher: "IT / Informationssicherheit",
    pruefintervall: "jährlich",
    schutzziel: "Vertraulichkeit und Integrität",
    nachweis: "MFA-Konfiguration, Rollout-Dokumentation, Richtlinie",
    wirksamkeit: "hoch",
    notizen: "Regelmäßige Überprüfung privilegierter Konten erforderlich",
  },
  backup: {
    massnahme: "Backup- und Wiederherstellungskonzept",
    kategorie: "verfuegbarkeit",
    beschreibung: "Regelmäßige Datensicherungen mit dokumentierten Restore-Tests.",
    status: "implementiert",
    verantwortlicher: "IT-Betrieb",
    pruefintervall: "halbjährlich",
    schutzziel: "Verfügbarkeit",
    nachweis: "Backup-Protokolle, Restore-Test, Betriebsdokumentation",
    wirksamkeit: "hoch",
    notizen: "Offline-/Immutable-Backups prüfen",
  },
  rollen: {
    massnahme: "Rollen- und Berechtigungskonzept",
    kategorie: "zugriffskontrolle",
    beschreibung: "Vergabe von Zugriffsrechten nach Rollen- und Need-to-know-Prinzip.",
    status: "implementiert",
    verantwortlicher: "IT / Fachbereich",
    pruefintervall: "jährlich",
    schutzziel: "Vertraulichkeit",
    nachweis: "Berechtigungsmatrix, Freigabeprozess, Rezertifizierung",
    wirksamkeit: "hoch",
    notizen: "Regelmäßige Rezertifizierung von Berechtigungen einplanen",
  },
  loeschung: {
    massnahme: "Lösch- und Aufbewahrungskonzept",
    kategorie: "trennung",
    beschreibung: "Regelbasierte Löschung und Trennung von Datenbeständen nach Zweck und Frist.",
    status: "geplant",
    verantwortlicher: "Datenschutz / Fachbereich / IT",
    pruefintervall: "jährlich",
    schutzziel: "Vertraulichkeit und Datenminimierung",
    nachweis: "Löschkonzept, Löschprotokolle, Richtlinie",
    wirksamkeit: "mittel",
    notizen: "Systemübergreifende Fristen harmonisieren",
  },
  logging: {
    massnahme: "Protokollierung sicherheitsrelevanter Zugriffe",
    kategorie: "eingabe",
    beschreibung: "Nachvollziehbarkeit von Zugriffen, Änderungen und sicherheitsrelevanten Ereignissen.",
    status: "implementiert",
    verantwortlicher: "IT / SOC / Administratoren",
    pruefintervall: "quartalsweise",
    schutzziel: "Integrität und Nachvollziehbarkeit",
    nachweis: "Log-Policy, Audit-Logs, SIEM-Auswertung",
    wirksamkeit: "hoch",
    notizen: "Datenschutzkonforme Logspeicherung beachten",
  },
  dsdms_tom_zutritt: {
    massnahme: "BSI-konforme Zutrittssicherung (Gebäude & Server)",
    kategorie: "zutrittskontrolle",
    beschreibung: "Physische Sicherung von Gebäuden und IT-Infrastrukturen durch strukturierte Zugangszonen, Chipkartensystem und Videoüberwachung.",
    status: "implementiert",
    verantwortlicher: "Facility Management / ISB",
    pruefintervall: "jährlich",
    schutzziel: "Vertraulichkeit und Verfügbarkeit",
    nachweis: "Zutrittskontroll-Richtlinie, Schließplan, Chipkarten-Logs, Wartungsbericht Alarmanlage",
    wirksamkeit: "hoch",
    notizen: "Orientiert an BSI IT-Grundschutz INF.1 (Gebäudesicherheit).",
  },
  dsdms_tom_zugang: {
    massnahme: "BSI-konforme Zugangskontrolle (MFA & Passwortrichtlinie)",
    kategorie: "zugangskontrolle",
    beschreibung: "Erzwingung einer starken Passwortkomplexität (min. 12 Zeichen) kombiniert mit flächendeckendem Einsatz von Multi-Faktor-Authentisierung (MFA) für alle externen Zugriffe (VPN, Cloud).",
    status: "implementiert",
    verantwortlicher: "IT-Administration / ISB",
    pruefintervall: "halbjährlich",
    schutzziel: "Vertraulichkeit und Integrität",
    nachweis: "Active Directory GPO-Reports, Azure AD MFA Compliance-Statistik, Schulungsnachweis Beschäftigte",
    wirksamkeit: "hoch",
    notizen: "Abstimmung mit BSI ORP.4 (Identitäts- und Berechtigungsmanagement).",
  },
  dsdms_tom_weitergabe: {
    massnahme: "Transport- und Weitergabesicherung (Verschlüsselung)",
    kategorie: "weitergabe",
    beschreibung: "Durchgängige Transportverschlüsselung für alle Datenflüsse (TLS 1.3 / HTTPS) und Festplattenvollverschlüsselung (BitLocker / FileVault) für all mobile Endgeräte.",
    status: "implementiert",
    verantwortlicher: "IT-Support / Admins",
    pruefintervall: "quartalsweise",
    schutzziel: "Vertraulichkeit",
    nachweis: "MDM-Systemberichte (Compliance State), SSL-Labs Testergebnisse externer Webservices, Richtlinie Mobiles Arbeiten",
    wirksamkeit: "hoch",
    notizen: "Harmonisiert mit BSI SYS.2.1 (Client-Sicherheit) und CON.1 (Kryptokonzept).",
  },
  ...allTomTemplates
};

function TomForm({ initial, onSave, onCancel }: any) {
  const [selectedTemplate, setSelectedTemplate] = useState("none");
  const [form, setForm] = useState({ massnahme: "", kategorie: "zugangskontrolle", beschreibung: "", status: "implementiert", verantwortlicher: "", pruefDatum: "", pruefintervall: "", schutzziel: "", nachweis: "", wirksamkeit: "", notizen: "", ...initial });
  const set = (k: string, v: any) => setForm((p: any) => ({ ...p, [k]: v }));
  const applyTemplate = (value: string) => {
    setSelectedTemplate(value);
    const template = tomTemplates[value];
    if (!template) return;
    setForm((p: any) => ({ ...p, ...template }));
  };
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="col-span-2 space-y-1">
          <Label className="text-xs">Muster-TOM</Label>
          <Select value={selectedTemplate} onValueChange={applyTemplate}>
            <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Vorlage auswählen" /></SelectTrigger>
            <SelectContent className="max-h-80">
              <SelectItem value="none">Keine Vorlage</SelectItem>
              <SelectItem value="mfa">Mehr-Faktor-Authentisierung</SelectItem>
              <SelectItem value="backup">Backup- und Wiederherstellungskonzept</SelectItem>
              <SelectItem value="rollen">Rollen- und Berechtigungskonzept</SelectItem>
              <SelectItem value="loeschung">Lösch- und Aufbewahrungskonzept</SelectItem>
              <SelectItem value="logging">Protokollierung sicherheitsrelevanter Zugriffe</SelectItem>
              <SelectItem value="dsdms_tom_zutritt">DSDMS: BSI Zutrittssicherung</SelectItem>
              <SelectItem value="dsdms_tom_zugang">DSDMS: BSI Zugangskontrolle</SelectItem>
              <SelectItem value="dsdms_tom_weitergabe">DSDMS: Transport verschlüsselt</SelectItem>
              <Separator />
              {Object.entries(allTomTemplates)
                .sort((a, b) => a[1].massnahme.localeCompare(b[1].massnahme))
                .map(([key, t]) => (
                  <SelectItem key={key} value={key}>
                    {t.massnahme}
                  </SelectItem>
                ))
              }
            </SelectContent>
          </Select>
        </div>
        <div className="col-span-2 space-y-1"><Label className="text-xs">Maßnahme *</Label><Input value={form.massnahme} onChange={e => set("massnahme", e.target.value)} className="h-8 text-sm" /></div>
        <div className="space-y-1"><Label className="text-xs">Kategorie</Label>
          <Select value={form.kategorie} onValueChange={v => set("kategorie", v)}>
            <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>{Object.entries(tomKategorien).map(([k, v]) => <SelectItem key={k} value={k} className="text-xs">{v}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-1"><Label className="text-xs">Status</Label>
          <Select value={form.status} onValueChange={v => set("status", v)}>
            <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="geplant">Geplant</SelectItem><SelectItem value="implementiert">Implementiert</SelectItem><SelectItem value="überprüft">Überprüft</SelectItem></SelectContent>
          </Select>
        </div>
        <div className="space-y-1"><Label className="text-xs">Verantwortlicher</Label><Input value={form.verantwortlicher} onChange={e => set("verantwortlicher", e.target.value)} className="h-8 text-sm" /></div>
        <div className="space-y-1"><Label className="text-xs">Nächste Prüfung</Label><Input type="date" value={form.pruefDatum} onChange={e => set("pruefDatum", e.target.value)} className="h-8 text-sm" /></div>
        <div className="space-y-1"><Label className="text-xs">Prüfintervall</Label><Input value={form.pruefintervall} onChange={e => set("pruefintervall", e.target.value)} className="h-8 text-sm" placeholder="z. B. jährlich" /></div>
        <div className="space-y-1"><Label className="text-xs">Schutzziel</Label><Input value={form.schutzziel} onChange={e => set("schutzziel", e.target.value)} className="h-8 text-sm" placeholder="Vertraulichkeit, Integrität, Verfügbarkeit" /></div>
        <div className="space-y-1"><Label className="text-xs">Wirksamkeit</Label><Input value={form.wirksamkeit} onChange={e => set("wirksamkeit", e.target.value)} className="h-8 text-sm" placeholder="niedrig / mittel / hoch" /></div>
        <div className="col-span-2 space-y-1"><Label className="text-xs">Beschreibung</Label><Textarea value={form.beschreibung} onChange={e => set("beschreibung", e.target.value)} className="text-sm min-h-12" /></div>
        <div className="col-span-2 space-y-1"><Label className="text-xs">Nachweis / Dokumentation</Label><Textarea value={form.nachweis} onChange={e => set("nachweis", e.target.value)} className="text-sm min-h-12" /></div>
        <div className="col-span-2 space-y-1"><Label className="text-xs">Notizen</Label><Textarea value={form.notizen} onChange={e => set("notizen", e.target.value)} className="text-sm min-h-12" /></div>
      </div>
      <div className="sticky bottom-0 z-10 -mx-6 mt-4 border-t bg-background px-6 pt-3 pb-1">
        <DialogFooter>
          <Button variant="outline" size="sm" onClick={onCancel}>Abbrechen</Button>
          <Button size="sm" className="bg-primary" onClick={() => onSave(form)} disabled={!form.massnahme}>Speichern</Button>
        </DialogFooter>
      </div>
    </div>
  );
}

function TomPage() {
  const { t } = useI18n();
  const [location, setLocation] = useLocation();
  const { activeMandantId } = useMandant();
  const qc = useQueryClient();
  const { data, isLoading, create, update, remove } = useModuleData("tom");
  const { data: aufgaben = [] } = useModuleData("aufgaben");
  const { data: pdca = [] } = useModuleData("pdca");
  const [modal, setModal] = useState<null | "new" | any>(null);
  const [delId, setDelId] = useState<number | null>(null);
  const [tomFilter, setTomFilterState] = useState<"all" | "review-overdue" | "review-missing" | "planned" | "weak-effectiveness" | "missing-owner">("all");
  const [tomSort, setTomSortState] = useState<"review" | "name" | "status">("review");
  const { toast } = useToast();

  useEffect(() => {
    const route = new URL(location, "https://privashield.local");
    const rawFilter = route.searchParams.get("filter");
    const rawSort = route.searchParams.get("sort");
    setTomFilterState(rawFilter === "review-overdue" || rawFilter === "review-missing" || rawFilter === "planned" || rawFilter === "weak-effectiveness" || rawFilter === "missing-owner" ? rawFilter : "all");
    setTomSortState(rawSort === "name" || rawSort === "status" ? rawSort : "review");
  }, [location]);

  const updateTomRouteState = (nextFilter: "all" | "review-overdue" | "review-missing" | "planned" | "weak-effectiveness" | "missing-owner", nextSort: "review" | "name" | "status") => {
    const next = new URL(location, "https://privashield.local");
    if (nextFilter === "all") next.searchParams.delete("filter");
    else next.searchParams.set("filter", nextFilter);
    if (nextSort === "review") next.searchParams.delete("sort");
    else next.searchParams.set("sort", nextSort);
    setLocation(`${next.pathname}${next.search}`);
  };
  const setTomFilter = (value: "all" | "review-overdue" | "review-missing" | "planned" | "weak-effectiveness" | "missing-owner") => {
    setTomFilterState(value);
    updateTomRouteState(value, tomSort);
  };
  const setTomSort = (value: "review" | "name" | "status") => {
    setTomSortState(value);
    updateTomRouteState(tomFilter, value);
  };

  const save = (form: any) => {
    const p = modal === "new" ? create.mutateAsync(form) : update.mutateAsync({ id: modal.id, ...form });
    p.then(() => { setModal(null); toast({ title: "Gespeichert" }); }).catch((e:any) => toast({ title: "Fehler", description: e?.message || "Speichern fehlgeschlagen", variant: "destructive" }));
  };

  const today = new Date().toISOString().split("T")[0];
  const getTomMeta = (item: any) => {
    const reviewDate = String(item?.pruefDatum || "").trim();
    const reviewMissing = !reviewDate;
    const reviewOverdue = !!reviewDate && reviewDate < today;
    const planned = String(item?.status || "").toLowerCase() === "geplant";
    const weakEffectiveness = ["niedrig", "mittel"].includes(String(item?.wirksamkeit || "").toLowerCase()) || !String(item?.wirksamkeit || "").trim();
    const missingOwner = !String(item?.verantwortlicher || "").trim();
    return { reviewDate, reviewMissing, reviewOverdue, planned, weakEffectiveness, missingOwner };
  };
  const tomReviewOverdueItems = data.filter((item: any) => getTomMeta(item).reviewOverdue);
  const tomReviewMissingItems = data.filter((item: any) => getTomMeta(item).reviewMissing);
  const tomPlannedItems = data.filter((item: any) => getTomMeta(item).planned);
  const tomWeakEffectivenessItems = data.filter((item: any) => getTomMeta(item).weakEffectiveness);
  const tomMissingOwnerItems = data.filter((item: any) => getTomMeta(item).missingOwner);

  const buildTomTaskDraft = (item: any, kind: "review-overdue" | "review-missing" | "planned" | "weak-effectiveness" | "missing-owner") => {
    const drafts: Record<string, { title: string; priority: string; description: string }> = {
      "review-overdue": {
        title: `TOM-Review nachziehen: ${item.massnahme}`,
        priority: "hoch",
        description: `Die TOM-Maßnahme "${item.massnahme}" ist zur Prüfung fällig oder überfällig. Bitte Wirksamkeit, Nachweis und Umsetzungsstand kurzfristig aktualisieren.`,
      },
      "review-missing": {
        title: `Prüftermin für TOM ergänzen: ${item.massnahme}`,
        priority: "mittel",
        description: `Für die TOM-Maßnahme "${item.massnahme}" fehlt ein dokumentierter Prüftermin. Bitte Prüfturnus und nächste Prüfung festlegen.`,
      },
      planned: {
        title: `Geplante TOM in Umsetzung bringen: ${item.massnahme}`,
        priority: "hoch",
        description: `Die TOM-Maßnahme "${item.massnahme}" ist noch im Status geplant. Bitte Umsetzung, Nachweis und Wirksamkeitsbewertung operativ nachziehen.`,
      },
      "weak-effectiveness": {
        title: `Wirksamkeit der TOM nachsteuern: ${item.massnahme}`,
        priority: "mittel",
        description: `Die TOM-Maßnahme "${item.massnahme}" hat eine schwache oder fehlende Wirksamkeitsbewertung. Bitte Bewertung, Nachweise und Verbesserungsbedarf fachlich prüfen.`,
      },
      "missing-owner": {
        title: `Verantwortlichkeit für TOM festlegen: ${item.massnahme}`,
        priority: "mittel",
        description: `Für die TOM-Maßnahme "${item.massnahme}" fehlt ein klarer Verantwortlicher. Bitte Rolle und operative Zuständigkeit verbindlich zuordnen.`,
      },
    };
    const draft = drafts[kind];
    const params = new URLSearchParams({ draftTitle: draft.title, draftPriority: draft.priority, draftDescription: draft.description, draftSource: `tom:${kind}:${item.id}` });
    return { href: `/aufgaben?${params.toString()}`, title: draft.title, priority: draft.priority, description: draft.description, source: `tom:${kind}:${item.id}` };
  };

  const createTomFollowUpTask = async (item: any, kind: "review-overdue" | "review-missing" | "planned" | "weak-effectiveness" | "missing-owner") => {
    const draft = buildTomTaskDraft(item, kind);
    const duplicate = aufgaben.find((task: any) => String(task?.vorlagenBezug || "") === draft.source && String(task?.status || "") !== "erledigt");
    if (duplicate) {
      toast({ title: "Aufgabe bereits vorhanden", description: `Offene Folgeaufgabe gefunden: ${duplicate.titel}` });
      return;
    }
    await apiRequest("POST", `/api/mandanten/${activeMandantId}/aufgaben`, {
      titel: draft.title,
      beschreibung: draft.description,
      typ: kind === "review-overdue" || kind === "review-missing" ? "review" : "task",
      prioritaet: draft.priority,
      status: "offen",
      fortschritt: 0,
      verantwortlicher: item.verantwortlicher || "",
      faelligAm: getTomMeta(item).reviewDate || "",
      kategorie: "tom",
      referenzId: item.id,
      vorlagenBezug: draft.source,
    });
    await qc.invalidateQueries({ queryKey: [`/api/mandanten/${activeMandantId}/aufgaben`] });
    toast({ title: "Folgeaufgabe erstellt", description: draft.title });
  };

  const createTomPdcaCycle = async (item: any, kind: "review-overdue" | "review-missing" | "planned" | "weak-effectiveness" | "missing-owner") => {
    const source = `tom-pdca:${kind}:${item.id}`;
    const duplicate = pdca.find((entry: any) => String(entry?.actNaechsterZyklus || "").includes(source) && String(entry?.status || "") !== "abgeschlossen");
    if (duplicate) {
      toast({ title: "PDCA bereits vorhanden", description: `Offener Zyklus gefunden: ${duplicate.titel}` });
      return;
    }
    const reviewDate = new Date();
    reviewDate.setDate(reviewDate.getDate() + (kind === "review-overdue" || kind === "planned" ? 14 : 30));
    const titleMap: Record<string, string> = {
      "review-overdue": `PDCA TOM-Review: ${item.massnahme}`,
      "review-missing": `PDCA TOM-Prüfplanung: ${item.massnahme}`,
      planned: `PDCA TOM-Umsetzung: ${item.massnahme}`,
      "weak-effectiveness": `PDCA TOM-Wirksamkeit: ${item.massnahme}`,
      "missing-owner": `PDCA TOM-Verantwortung: ${item.massnahme}`,
    };
    const measureMap: Record<string, string> = {
      "review-overdue": "Prüfung, Nachweis und Wirksamkeitsstatus der TOM kurzfristig aktualisieren.",
      "review-missing": "Prüfturnus und Reviewdatum für die TOM verbindlich festlegen.",
      planned: "Umsetzung, Nachweis und operative Verankerung der TOM priorisiert nachziehen.",
      "weak-effectiveness": "Wirksamkeit, Kontrollen und Verbesserungsmaßnahmen der TOM fachlich nachsteuern.",
      "missing-owner": "Verantwortliche Rolle benennen und regelmäßige Steuerung sicherstellen.",
    };
    const pdcaItem = await apiRequest("POST", `/api/mandanten/${activeMandantId}/pdca`, {
      titel: titleMap[kind],
      beschreibung: `Automatisch vorbereiteter Verbesserungszyklus für die TOM-Maßnahme "${item.massnahme}".`,
      zyklusTyp: "verbesserungsmassnahme",
      status: "geplant",
      prioritaet: kind === "review-overdue" || kind === "planned" ? "hoch" : "mittel",
      verantwortlicher: item.verantwortlicher || "",
      naechstePruefungAm: reviewDate.toISOString().split("T")[0],
      planRisiken: `${item.beschreibung || ""}\n\nStatus: ${item.status || "—"}\nWirksamkeit: ${item.wirksamkeit || "offen"}`.trim(),
      planMassnahmen: measureMap[kind],
      planZiele: `TOM-Maßnahme ${item.massnahme} belastbar steuern und verbessern.`,
      actNaechsterZyklus: source,
      verknuepftesAuditId: null,
    }).then(r => r.json());

    await apiRequest("POST", `/api/mandanten/${activeMandantId}/aufgaben`, {
      titel: `${titleMap[kind]} – Folgeaufgabe`,
      beschreibung: `Operative Folgeaufgabe zum PDCA-Zyklus "${titleMap[kind]}" für die TOM-Maßnahme "${item.massnahme}".`,
      typ: kind === "review-overdue" || kind === "review-missing" ? "review" : "task",
      prioritaet: kind === "review-overdue" || kind === "planned" ? "hoch" : "mittel",
      status: "offen",
      fortschritt: 0,
      verantwortlicher: item.verantwortlicher || "",
      faelligAm: reviewDate.toISOString().split("T")[0],
      kategorie: "tom",
      referenzId: pdcaItem.id,
      vorlagenBezug: "pdca_follow_up",
    });
    await qc.invalidateQueries({ queryKey: [`/api/mandanten/${activeMandantId}/pdca`] });
    await qc.invalidateQueries({ queryKey: [`/api/mandanten/${activeMandantId}/aufgaben`] });
    toast({ title: "PDCA-Zyklus erstellt", description: titleMap[kind] });
  };

  const filteredData = data.filter((item: any) => {
    const meta = getTomMeta(item);
    if (tomFilter === "review-overdue") return meta.reviewOverdue;
    if (tomFilter === "review-missing") return meta.reviewMissing;
    if (tomFilter === "planned") return meta.planned;
    if (tomFilter === "weak-effectiveness") return meta.weakEffectiveness;
    if (tomFilter === "missing-owner") return meta.missingOwner;
    return true;
  }).slice().sort((a: any, b: any) => {
    const metaA = getTomMeta(a);
    const metaB = getTomMeta(b);
    if (tomSort === "name") return String(a.massnahme || "").localeCompare(String(b.massnahme || ""), "de");
    if (tomSort === "status") return String(a.status || "").localeCompare(String(b.status || ""), "de") || String(a.massnahme || "").localeCompare(String(b.massnahme || ""), "de");
    const reviewA = metaA.reviewDate || "9999-12-31";
    const reviewB = metaB.reviewDate || "9999-12-31";
    return reviewA.localeCompare(reviewB, "de") || String(a.massnahme || "").localeCompare(String(b.massnahme || ""), "de");
  });

  const grouped = filteredData.reduce((acc: any, item: any) => {
    const cat = item.kategorie || "sonstige";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {});

  return (
    <MandantGuard>
      <PageHeader title={t("tomTitle")} desc={t("tomDesc")}
        action={<Button size="sm" className="bg-primary h-8 text-xs gap-1.5" onClick={() => setModal("new")}><Plus className="h-3.5 w-3.5" />Neue TOM</Button>} />
      {isLoading ? <Skeleton className="h-32 w-full" /> : (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">TOM-Quick-Check</CardTitle>
              <CardDescription>Schneller Blick auf Prüfstände, Wirksamkeit und operative Verantwortlichkeit</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {data.length === 0 ? (
                <p className="text-muted-foreground">Aktuell keine TOM-Maßnahmen dokumentiert.</p>
              ) : (
                <>
                  {tomReviewOverdueItems.length > 0 && <p className="text-red-400">TOM-Reviews überfällig: {tomReviewOverdueItems.length}</p>}
                  {tomPlannedItems.length > 0 && <p className="text-red-400">Geplante TOM ohne Abschluss: {tomPlannedItems.length}</p>}
                  {tomReviewMissingItems.length > 0 && <p className="text-yellow-400">TOM ohne Prüftermin: {tomReviewMissingItems.length}</p>}
                  {tomWeakEffectivenessItems.length > 0 && <p className="text-yellow-400">TOM mit schwacher/fehlender Wirksamkeitsbewertung: {tomWeakEffectivenessItems.length}</p>}
                  {tomMissingOwnerItems.length > 0 && <p className="text-yellow-400">TOM ohne Verantwortlichen: {tomMissingOwnerItems.length}</p>}
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">TOM-Fokusliste</CardTitle>
              <CardDescription>Priorisierte Maßnahmen mit unmittelbarem Prüf-, Umsetzungs- oder Governance-Bedarf</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {tomReviewOverdueItems.length === 0 && tomReviewMissingItems.length === 0 && tomPlannedItems.length === 0 && tomWeakEffectivenessItems.length === 0 && tomMissingOwnerItems.length === 0 ? (
                <p className="text-muted-foreground">Aktuell keine priorisierten TOM-Fälle.</p>
              ) : (
                <>
                  {tomReviewOverdueItems.slice(0, 3).map((item: any) => (
                    <div key={`review-overdue-${item.id}`} className="rounded-lg border border-red-500/20 bg-red-500/5 p-3">
                      <p className="font-medium text-red-700 dark:text-red-400">TOM-Review überfällig: {item.massnahme}</p>
                      <p className="text-xs text-muted-foreground">Empfehlung: Nachweis, Wirksamkeit und Prüfstatus kurzfristig aktualisieren.</p>
                      <div className="mt-2 flex gap-2"><Button type="button" size="sm" variant="outline" onClick={() => setTomFilter("review-overdue")}>Nur diese Fälle</Button><Button type="button" size="sm" variant="secondary" onClick={() => createTomFollowUpTask(item, "review-overdue")}>Aufgabe erzeugen</Button><Button type="button" size="sm" variant="secondary" onClick={() => createTomPdcaCycle(item, "review-overdue")}>PDCA erzeugen</Button><Link href={buildTomTaskDraft(item, "review-overdue").href}><a className="text-xs text-primary hover:underline self-center">Aufgabe vorbereiten</a></Link></div>
                    </div>
                  ))}
                  {tomPlannedItems.slice(0, 3).map((item: any) => (
                    <div key={`planned-${item.id}`} className="rounded-lg border border-red-500/20 bg-red-500/5 p-3">
                      <p className="font-medium text-red-700 dark:text-red-400">Geplante TOM ohne Umsetzung: {item.massnahme}</p>
                      <p className="text-xs text-muted-foreground">Empfehlung: Umsetzung, Nachweis und operative Verankerung priorisieren.</p>
                      <div className="mt-2 flex gap-2"><Button type="button" size="sm" variant="outline" onClick={() => setTomFilter("planned")}>Nur diese Fälle</Button><Button type="button" size="sm" variant="secondary" onClick={() => createTomFollowUpTask(item, "planned")}>Aufgabe erzeugen</Button><Button type="button" size="sm" variant="secondary" onClick={() => createTomPdcaCycle(item, "planned")}>PDCA erzeugen</Button><Link href={buildTomTaskDraft(item, "planned").href}><a className="text-xs text-primary hover:underline self-center">Aufgabe vorbereiten</a></Link></div>
                    </div>
                  ))}
                  {tomReviewMissingItems.slice(0, 3).map((item: any) => (
                    <div key={`review-missing-${item.id}`} className="rounded-lg border border-yellow-500/20 bg-yellow-500/5 p-3">
                      <p className="font-medium text-yellow-700 dark:text-yellow-400">TOM ohne Prüftermin: {item.massnahme}</p>
                      <p className="text-xs text-muted-foreground">Empfehlung: Prüfturnus und nächste Prüfung festlegen.</p>
                      <div className="mt-2 flex gap-2"><Button type="button" size="sm" variant="outline" onClick={() => setTomFilter("review-missing")}>Nur diese Fälle</Button><Button type="button" size="sm" variant="secondary" onClick={() => createTomFollowUpTask(item, "review-missing")}>Aufgabe erzeugen</Button><Button type="button" size="sm" variant="secondary" onClick={() => createTomPdcaCycle(item, "review-missing")}>PDCA erzeugen</Button><Link href={buildTomTaskDraft(item, "review-missing").href}><a className="text-xs text-primary hover:underline self-center">Aufgabe vorbereiten</a></Link></div>
                    </div>
                  ))}
                  {tomWeakEffectivenessItems.slice(0, 3).map((item: any) => (
                    <div key={`weak-effectiveness-${item.id}`} className="rounded-lg border border-yellow-500/20 bg-yellow-500/5 p-3">
                      <p className="font-medium text-yellow-700 dark:text-yellow-400">Wirksamkeit nachsteuern: {item.massnahme}</p>
                      <p className="text-xs text-muted-foreground">Empfehlung: Wirksamkeitsbewertung, Kontrolle und Verbesserungsbedarf prüfen.</p>
                      <div className="mt-2 flex gap-2"><Button type="button" size="sm" variant="outline" onClick={() => setTomFilter("weak-effectiveness")}>Nur diese Fälle</Button><Button type="button" size="sm" variant="secondary" onClick={() => createTomFollowUpTask(item, "weak-effectiveness")}>Aufgabe erzeugen</Button><Button type="button" size="sm" variant="secondary" onClick={() => createTomPdcaCycle(item, "weak-effectiveness")}>PDCA erzeugen</Button><Link href={buildTomTaskDraft(item, "weak-effectiveness").href}><a className="text-xs text-primary hover:underline self-center">Aufgabe vorbereiten</a></Link></div>
                    </div>
                  ))}
                  {tomMissingOwnerItems.slice(0, 3).map((item: any) => (
                    <div key={`missing-owner-${item.id}`} className="rounded-lg border border-yellow-500/20 bg-yellow-500/5 p-3">
                      <p className="font-medium text-yellow-700 dark:text-yellow-400">Verantwortlichkeit fehlt: {item.massnahme}</p>
                      <p className="text-xs text-muted-foreground">Empfehlung: Verantwortliche Rolle und operative Zuständigkeit festlegen.</p>
                      <div className="mt-2 flex gap-2"><Button type="button" size="sm" variant="outline" onClick={() => setTomFilter("missing-owner")}>Nur diese Fälle</Button><Button type="button" size="sm" variant="secondary" onClick={() => createTomFollowUpTask(item, "missing-owner")}>Aufgabe erzeugen</Button><Button type="button" size="sm" variant="secondary" onClick={() => createTomPdcaCycle(item, "missing-owner")}>PDCA erzeugen</Button><Link href={buildTomTaskDraft(item, "missing-owner").href}><a className="text-xs text-primary hover:underline self-center">Aufgabe vorbereiten</a></Link></div>
                    </div>
                  ))}
                </>
              )}
            </CardContent>
          </Card>

          <div className="flex gap-2 mb-1 flex-wrap">
            <Button type="button" size="sm" variant={tomFilter === "all" ? "default" : "outline"} onClick={() => setTomFilter("all")}>Alle</Button>
            <Button type="button" size="sm" variant={tomFilter === "review-overdue" ? "default" : "outline"} onClick={() => setTomFilter("review-overdue")}>Review überfällig</Button>
            <Button type="button" size="sm" variant={tomFilter === "review-missing" ? "default" : "outline"} onClick={() => setTomFilter("review-missing")}>Ohne Prüftermin</Button>
            <Button type="button" size="sm" variant={tomFilter === "planned" ? "default" : "outline"} onClick={() => setTomFilter("planned")}>Geplant</Button>
            <Button type="button" size="sm" variant={tomFilter === "weak-effectiveness" ? "default" : "outline"} onClick={() => setTomFilter("weak-effectiveness")}>Wirksamkeit schwach</Button>
            <Button type="button" size="sm" variant={tomFilter === "missing-owner" ? "default" : "outline"} onClick={() => setTomFilter("missing-owner")}>Ohne Verantwortlichen</Button>
          </div>
          <div className="flex gap-2 mb-4 flex-wrap items-center">
            <span className="text-xs text-muted-foreground">Sortierung:</span>
            <Button type="button" size="sm" variant={tomSort === "review" ? "default" : "outline"} onClick={() => setTomSort("review")}>Review</Button>
            <Button type="button" size="sm" variant={tomSort === "name" ? "default" : "outline"} onClick={() => setTomSort("name")}>Name</Button>
            <Button type="button" size="sm" variant={tomSort === "status" ? "default" : "outline"} onClick={() => setTomSort("status")}>Status</Button>
          </div>

          {data.length === 0 && <Card className="border-dashed"><CardContent className="py-12 text-center text-sm text-muted-foreground">Noch keine TOM-Maßnahmen dokumentiert.</CardContent></Card>}
          {Object.entries(grouped).map(([kat, items]: any) => (
            <div key={kat}>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">{tomKategorien[kat] || kat}</p>
              <div className="space-y-1.5">
                {items.map((item: any) => {
                  const meta = getTomMeta(item);
                  return (
                    <Card key={item.id} className={`group hover:border-border/80 transition-colors ${meta.reviewOverdue || meta.planned ? "border-red-500/30" : meta.reviewMissing || meta.weakEffectiveness || meta.missingOwner ? "border-yellow-500/30" : ""}`}>
                      <CardContent className="py-3 px-4 flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center sm:gap-4">
                        <div className="flex items-center gap-3 min-w-0">
                          <Lock className={`h-4 w-4 shrink-0 ${meta.reviewOverdue || meta.planned ? "text-red-400" : meta.reviewMissing || meta.weakEffectiveness || meta.missingOwner ? "text-yellow-400" : "text-emerald-400"}`} />
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate">{item.massnahme}</p>
                            <p className="text-xs text-muted-foreground truncate">{item.verantwortlicher || "Kein Verantwortlicher"}{item.pruefintervall ? ` · ${item.pruefintervall}` : ""}{item.wirksamkeit ? ` · Wirksamkeit: ${item.wirksamkeit}` : " · Wirksamkeit offen"}</p>
                            <p className="text-xs text-muted-foreground truncate">Prüfung: {meta.reviewDate || "offen"}{meta.planned ? " · geplant" : ""}{meta.missingOwner ? " · Zuständigkeit offen" : ""}</p>
                          </div>
                        </div>
                        <div className="flex w-full items-center justify-between gap-2 shrink-0 sm:w-auto sm:justify-end">
                          <div className="flex items-center gap-2 flex-wrap justify-end">
                            {meta.reviewOverdue && <Badge variant="outline" className="text-xs border-red-500/40 text-red-600">Review überfällig</Badge>}
                            {meta.reviewMissing && <Badge variant="outline" className="text-xs border-yellow-500/40 text-yellow-600">Review offen</Badge>}
                            {meta.planned && <Badge variant="outline" className="text-xs border-red-500/40 text-red-600">Geplant</Badge>}
                            {meta.weakEffectiveness && <Badge variant="outline" className="text-xs border-yellow-500/40 text-yellow-600">Wirksamkeit prüfen</Badge>}
                            {meta.missingOwner && <Badge variant="outline" className="text-xs border-yellow-500/40 text-yellow-600">Owner fehlt</Badge>}
                            <StatusBadge value={item.status} />
                          </div>
                          <button onClick={() => setModal(item)} className="p-1 rounded text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-all"><Pencil className="h-3.5 w-3.5" /></button>
                          <button onClick={() => setDelId(item.id)} className="p-1 rounded text-muted-foreground hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"><Trash2 className="h-3.5 w-3.5" /></button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
      <Dialog open={!!modal} onOpenChange={o => !o && setModal(null)}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto"><div className="sticky top-0 z-10 -mx-6 border-b bg-background px-6 pb-3 pt-1"><DialogHeader><DialogTitle>{modal === "new" ? "Neue TOM-Maßnahme" : "TOM bearbeiten"}</DialogTitle></DialogHeader></div>
          {modal && <TomForm initial={modal === "new" ? {} : modal} onSave={save} onCancel={() => setModal(null)} />}
        </DialogContent>
      </Dialog>
      <ConfirmDialog open={delId !== null} title="TOM löschen?" desc="Dieser Vorgang kann nicht rückgängig gemacht werden."
        onConfirm={() => { remove.mutate(delId!); setDelId(null); }} onCancel={() => setDelId(null)} />
    </MandantGuard>
  );
}

const auditTemplates: Record<string, any> = {
  none: null,
  intern: {
    titel: "Internes Datenschutz-Audit",
    auditart: "intern",
    pruefbereich: "Datenschutzmanagementsystem",
    status: "geplant",
    ergebnis: "offen",
    methode: "Interview, Dokumentenprüfung, Stichproben",
    scope: "VVT, TOM, DSR, Datenpannen, Dokumentation",
    feststellungen: "Prüfung der dokumentierten Prozesse und Nachweise.",
    positiveAspekte: "Grundstruktur vorhanden",
    abweichungen: "",
    empfehlungen: "Abweichungen priorisieren und Maßnahmenplan pflegen",
  },
  tom: {
    titel: "Audit technischer und organisatorischer Maßnahmen",
    auditart: "kontrollaudit",
    pruefbereich: "TOM / Art. 32 DSGVO",
    status: "geplant",
    ergebnis: "offen",
    methode: "Kontrolltest, Nachweissichtung, Interview IT",
    scope: "Zugangs-, Zugriffs-, Eingabe- und Verfügbarkeitskontrolle",
    feststellungen: "Wirksamkeit ausgewählter Sicherheitsmaßnahmen prüfen.",
    positiveAspekte: "",
    abweichungen: "",
    empfehlungen: "Fehlende Nachweise und Prüfintervalle ergänzen",
  },
  auftragsverarbeitung: {
    titel: "Audit Auftragsverarbeitung / Dienstleistersteuerung",
    auditart: "compliance",
    pruefbereich: "AVV und Dienstleistermanagement",
    status: "geplant",
    ergebnis: "offen",
    methode: "Dokumentenprüfung, Vertragsabgleich, Nachweisprüfung",
    scope: "AVV, TOM-Nachweise, Drittlandtransfers, Prüffristen",
    feststellungen: "Vertrags- und Nachweisstand der Dienstleister prüfen.",
    positiveAspekte: "",
    abweichungen: "",
    empfehlungen: "Fehlende Nachweise nachfordern und Review-Zyklen festlegen",
  },
};

function AuditForm({ initial, onSave, onCancel }: any) {
  const [selectedTemplate, setSelectedTemplate] = useState("none");
  const { data: pdca = [] } = useModuleData("pdca");
  const [form, setForm] = useState({ titel: "", auditart: "intern", pruefbereich: "", auditdatum: new Date().toISOString().split("T")[0], auditor: "", status: "geplant", ergebnis: "offen", scope: "", methode: "", feststellungen: "", positiveAspekte: "", abweichungen: "", empfehlungen: "", verknuepftePdcaIds: "[]", followUpDatum: "", naechstesAuditAm: "", createPdcaFollowUp: false, createAuditTasks: false, ...initial });
  const set = (k: string, v: any) => setForm((p: any) => ({ ...p, [k]: v }));
  const selectedPdcaIds = (() => {
    try { return JSON.parse(form.verknuepftePdcaIds || "[]"); } catch { return []; }
  })();
  const togglePdcaLink = (id: number) => {
    const next = selectedPdcaIds.includes(id)
      ? selectedPdcaIds.filter((value: number) => value !== id)
      : [...selectedPdcaIds, id];
    set("verknuepftePdcaIds", JSON.stringify(next));
  };
  const auditFollowUps = pdca.filter((item: any) => item.zyklusTyp === "audit_follow_up");
  const applyTemplate = (value: string) => {
    setSelectedTemplate(value);
    const template = auditTemplates[value];
    if (!template) return;
    setForm((p: any) => ({ ...p, ...template }));
  };
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="col-span-2 space-y-1">
          <Label className="text-xs">Audit-Vorlage</Label>
          <Select value={selectedTemplate} onValueChange={applyTemplate}>
            <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Vorlage auswählen" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Keine Vorlage</SelectItem>
              <SelectItem value="intern">Internes Datenschutz-Audit</SelectItem>
              <SelectItem value="tom">TOM-Audit</SelectItem>
              <SelectItem value="auftragsverarbeitung">Audit Auftragsverarbeitung</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="col-span-2 space-y-1"><Label className="text-xs">Audittitel *</Label><Input value={form.titel} onChange={e => set("titel", e.target.value)} className="h-8 text-sm" /></div>
        <div className="space-y-1"><Label className="text-xs">Auditart</Label><Input value={form.auditart} onChange={e => set("auditart", e.target.value)} className="h-8 text-sm" /></div>
        <div className="space-y-1"><Label className="text-xs">Prüfbereich</Label><Input value={form.pruefbereich} onChange={e => set("pruefbereich", e.target.value)} className="h-8 text-sm" /></div>
        <div className="space-y-1"><Label className="text-xs">Auditdatum *</Label><Input type="date" value={form.auditdatum} onChange={e => set("auditdatum", e.target.value)} className="h-8 text-sm" /></div>
        <div className="space-y-1"><Label className="text-xs">Auditor</Label><Input value={form.auditor} onChange={e => set("auditor", e.target.value)} className="h-8 text-sm" /></div>
        <div className="space-y-1"><Label className="text-xs">Status</Label>
          <Select value={form.status} onValueChange={v => set("status", v)}>
            <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="geplant">Geplant</SelectItem><SelectItem value="laufend">Laufend</SelectItem><SelectItem value="abgeschlossen">Abgeschlossen</SelectItem></SelectContent>
          </Select>
        </div>
        <div className="space-y-1"><Label className="text-xs">Ergebnis</Label>
          <Select value={form.ergebnis} onValueChange={v => set("ergebnis", v)}>
            <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="offen">Offen</SelectItem><SelectItem value="konform">Konform</SelectItem><SelectItem value="teilweise_konform">Teilweise konform</SelectItem><SelectItem value="kritisch">Kritische Abweichungen</SelectItem></SelectContent>
          </Select>
        </div>
        <div className="col-span-2 space-y-1"><Label className="text-xs">Auditumfang / Scope</Label><Textarea value={form.scope} onChange={e => set("scope", e.target.value)} className="text-sm min-h-12" /></div>
        <div className="col-span-2 space-y-1"><Label className="text-xs">Methode</Label><Textarea value={form.methode} onChange={e => set("methode", e.target.value)} className="text-sm min-h-12" /></div>
        <div className="col-span-2 space-y-1"><Label className="text-xs">Feststellungen</Label><Textarea value={form.feststellungen} onChange={e => set("feststellungen", e.target.value)} className="text-sm min-h-16" /></div>
        <div className="col-span-2 space-y-1"><Label className="text-xs">Positive Aspekte</Label><Textarea value={form.positiveAspekte} onChange={e => set("positiveAspekte", e.target.value)} className="text-sm min-h-12" /></div>
        <div className="col-span-2 space-y-1"><Label className="text-xs">Abweichungen / Findings</Label><Textarea value={form.abweichungen} onChange={e => set("abweichungen", e.target.value)} className="text-sm min-h-16" /></div>
        <div className="col-span-2 space-y-1"><Label className="text-xs">Empfehlungen / To-dos</Label><Textarea value={form.empfehlungen} onChange={e => set("empfehlungen", e.target.value)} className="text-sm min-h-16" /></div>
        <div className="col-span-2 space-y-2">
          <Label className="text-xs">Verknüpfte PDCA-Zyklen</Label>
          <div className="rounded-lg border p-3 space-y-2 max-h-44 overflow-y-auto">
            {auditFollowUps.length === 0 && <p className="text-xs text-muted-foreground">Keine Audit-Follow-ups verfügbar.</p>}
            {auditFollowUps.map((item: any) => (
              <label key={item.id} className="flex items-start gap-2 text-xs cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedPdcaIds.includes(item.id)}
                  onChange={() => togglePdcaLink(item.id)}
                />
                <span>
                  <span className="font-medium">#{item.id} {item.titel}</span>
                  <span className="block text-muted-foreground">Status: {item.status || "—"}{item.verantwortlicher ? ` · Verantwortlich: ${item.verantwortlicher}` : ""}</span>
                </span>
              </label>
            ))}
          </div>
          <p className="text-[11px] text-muted-foreground">Auswahl wird intern als Referenzliste gespeichert.</p>
        </div>
        <div className="space-y-1"><Label className="text-xs">Follow-up am</Label><Input type="date" value={form.followUpDatum || ""} onChange={e => set("followUpDatum", e.target.value)} className="h-8 text-sm" /></div>
        <div className="space-y-1"><Label className="text-xs">Nächstes Audit am</Label><Input type="date" value={form.naechstesAuditAm || ""} onChange={e => set("naechstesAuditAm", e.target.value)} className="h-8 text-sm" /></div>
        <label className="col-span-2 flex items-center gap-2 rounded-lg border p-3 cursor-pointer hover:bg-secondary/30 text-xs"><input type="checkbox" checked={!!form.createPdcaFollowUp} onChange={e => set("createPdcaFollowUp", e.target.checked)} /><span>Beim Speichern automatisch Audit-Follow-up-PDCA anlegen</span></label>
        <label className="col-span-2 flex items-center gap-2 rounded-lg border p-3 cursor-pointer hover:bg-secondary/30 text-xs"><input type="checkbox" checked={!!form.createAuditTasks} onChange={e => set("createAuditTasks", e.target.checked)} /><span>Empfehlungen zusätzlich direkt als Aufgaben vorbereiten</span></label>
      </div>
      <div className="sticky bottom-0 z-10 -mx-6 mt-4 border-t bg-background px-6 pt-3 pb-1">
        <DialogFooter>
          <Button variant="outline" size="sm" onClick={onCancel}>Abbrechen</Button>
          <Button size="sm" className="bg-primary" onClick={() => onSave(form)} disabled={!form.titel}>Speichern</Button>
        </DialogFooter>
      </div>
    </div>
  );
}

const loeschklassen = [
  { key: "LK1", label: "LK1 Operative Kurzfristdaten" },
  { key: "LK2", label: "LK2 Vertrags- und Kommunikationsdaten" },
  { key: "LK3", label: "LK3 Handels- und Steuerunterlagen" },
  { key: "LK4", label: "LK4 Personal- und Bewerberdaten" },
  { key: "LK5", label: "LK5 Besondere Kategorien / Hochrisikodaten" },
];

function LoeschkonzeptForm({ initial, onSave, onCancel }: any) {
  const { t } = useI18n();
  const { data: vvts = [] } = useModuleData("vvt");
  const { fristen: gesetzlicheAufbewahrungsfristen, vvtLoeschMapping } = useComplianceMeta();
  const [form, setForm] = useState({ bezeichnung: "", datenart: "", loeschklasse: "LK2", fristKategorie: "frei", gesetzlicheFrist: "", quelleVvtId: "none", quelleVvtBezeichnung: "", aufbewahrungsfrist: "", loeschereignis: "", rechtsgrundlage: "", systeme: "", verantwortlicher: "", loeschverantwortlicher: "", kontrolle: "", nachweis: "", status: "aktiv", ...initial });
  const set = (k: string, v: any) => setForm((p: any) => ({ ...p, [k]: v }));
  const classRequirements: Record<string, string[]> = {
    LK3: ["gesetzlicheFrist", "aufbewahrungsfrist", "nachweis"],
    LK4: ["loeschereignis", "loeschverantwortlicher"],
    LK5: ["kontrolle", "nachweis", "loeschverantwortlicher", "systeme"],
  };
  const missingRequired = (classRequirements[form.loeschklasse] || []).filter((field) => !String((form as any)[field] || "").trim());

  const applyFristKategorie = (value: string) => {
    const found = gesetzlicheAufbewahrungsfristen.find((item: any) => item.key === value);
    if (!found) return set("fristKategorie", value);
    setForm((p: any) => ({ ...p, fristKategorie: value, gesetzlicheFrist: found.referenzen?.[0] || found.label, aufbewahrungsfrist: found.frist || p.aufbewahrungsfrist }));
  };
  const selectedFrist = gesetzlicheAufbewahrungsfristen.find((item: any) => item.key === (form.fristKategorie || "frei")) || gesetzlicheAufbewahrungsfristen[0];
  const plausibility = (() => {
    const mapped = gesetzlicheAufbewahrungsfristen.find((x: any) => x.key === form.fristKategorie);
    if (missingRequired.length > 0) return { level: "error", text: `Für ${form.loeschklasse} fehlen Pflichtangaben: ${missingRequired.join(", ")}.` };
    if (form.loeschklasse === "LK5" && !form.kontrolle) return { level: "error", text: "Für LK5 sollte eine dokumentierte Kontrolle oder Überwachung hinterlegt sein." };
    if (form.loeschklasse === "LK5" && !form.nachweis) return { level: "error", text: "Für LK5 sollte ein Nachweis oder Löschprotokoll dokumentiert sein." };
    if ((form.fristKategorie === "10_jahre_ao_hgb" || form.fristKategorie === "8_jahre_buchung") && !/jahr/i.test(form.aufbewahrungsfrist || "")) return { level: "error", text: "Die gewählte Fristgruppe erwartet eine mehrjährige steuer- oder handelsrechtliche Aufbewahrungsfrist." };
    if (form.fristKategorie === "6_monate_bewerber" && !/monat/i.test(form.aufbewahrungsfrist || "")) return { level: "error", text: "Für Bewerberdaten sollte die Frist typischerweise in Monaten angegeben werden." };
    if (!mapped || mapped.key === "frei") return { level: "info", text: "Freie Frist gewählt, bitte fachlich begründen." };
    if (!form.aufbewahrungsfrist) return { level: "warn", text: "Zur Fristgruppe fehlt eine konkrete Aufbewahrungsfrist." };
    if (mapped.frist && form.aufbewahrungsfrist !== mapped.frist) return { level: "warn", text: `Die manuelle Frist (${form.aufbewahrungsfrist}) weicht von der Fristgruppe (${mapped.frist}) ab.` };
    return { level: "ok", text: "Fristgruppe und Aufbewahrungsfrist wirken plausibel." };
  })();
  const klassenHinweis = (() => {
    if (form.loeschklasse === "LK5") return "LK5: erhöhte Anforderungen an Nachweis, Kontrolle und dokumentierte Verantwortlichkeit.";
    if (form.loeschklasse === "LK4") return "LK4: Personal- und Bewerberdaten sollten mit klaren Triggern und Rollenzuordnung dokumentiert werden.";
    if (form.loeschklasse === "LK3") return "LK3: Handels- und Steuerdaten regelmäßig an AO/HGB-Fristen ausrichten.";
    return "Löschklasse dokumentiert den Schutz- und Aufbewahrungskontext der Daten.";
  })();
  const importFromVvt = (value: string) => {
    set("quelleVvtId", value);
    if (value === "none") return;
    const found = vvts.find((item: any) => String(item.id) === value);
    if (!found) return;
    const mapped = vvtLoeschMapping.find((entry: any) => entry.match.test(found.bezeichnung || ""));
    setForm((p: any) => ({ ...p, quelleVvtId: value, quelleVvtBezeichnung: found.bezeichnung, bezeichnung: p.bezeichnung || found.bezeichnung, datenart: found.datenkategorien || p.datenart, loeschklasse: found.loeschklasse || mapped?.loeschklasse || p.loeschklasse, fristKategorie: mapped?.fristKategorie || p.fristKategorie, gesetzlicheFrist: mapped?.gesetzlicheFrist || p.gesetzlicheFrist, aufbewahrungsfrist: found.loeschfrist || gesetzlicheAufbewahrungsfristen.find((x: any) => x.key === mapped?.fristKategorie)?.frist || p.aufbewahrungsfrist, loeschereignis: found.aufbewahrungsgrund || p.loeschereignis, rechtsgrundlage: found.rechtsgrundlage || p.rechtsgrundlage, verantwortlicher: found.verantwortlicher || p.verantwortlicher, loeschverantwortlicher: p.loeschverantwortlicher || found.verantwortlicher || "" }));
  };
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="col-span-2 space-y-1"><Label className="text-xs">{t("retentionImportVvt")}</Label>
          <Select value={String(form.quelleVvtId || "none")} onValueChange={importFromVvt}>
            <SelectTrigger className="h-8 text-xs"><SelectValue placeholder={t("retentionSelectVvt")} /></SelectTrigger>
            <SelectContent><SelectItem value="none">{t("retentionNoVvtImport")}</SelectItem>{vvts.map((item:any) => <SelectItem key={item.id} value={String(item.id)}>{item.bezeichnung}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="col-span-2 space-y-1"><Label className="text-xs">{t("retentionName")} *</Label><Input value={form.bezeichnung} onChange={e => set("bezeichnung", e.target.value)} className="h-8 text-sm" /></div>
        <div className="col-span-2 space-y-1"><Label className="text-xs">{t("retentionDataTypes")}</Label><Textarea value={form.datenart} onChange={e => set("datenart", e.target.value)} className="text-sm min-h-12" /></div>
        <div className="space-y-1"><Label className="text-xs">{t("retentionClass")} *</Label>
          <Select value={form.loeschklasse} onValueChange={v => set("loeschklasse", v)}>
            <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>{loeschklassen.map((k) => <SelectItem key={k.key} value={k.key}>{k.label}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-1"><Label className="text-xs">{t("retentionPeriodGroup")}</Label>
          <Select value={form.fristKategorie || "frei"} onValueChange={applyFristKategorie}>
            <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>{gesetzlicheAufbewahrungsfristen.map((item: any) => <SelectItem key={item.key} value={item.key}>{item.label}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-1"><Label className="text-xs">{t("retentionPeriod")}</Label><Input value={form.aufbewahrungsfrist} onChange={e => set("aufbewahrungsfrist", e.target.value)} className="h-8 text-sm" placeholder={t("retentionPeriodPlaceholder")} /></div>
        <div className="col-span-2 space-y-1"><Label className="text-xs">{t("retentionLegalRef")}</Label>
          <Select value={form.gesetzlicheFrist || (selectedFrist.referenzen?.[0] || t("retentionFreeEntry"))} onValueChange={v => set("gesetzlicheFrist", v)}>
            <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              {(selectedFrist.referenzen || [t("retentionFreeEntry")]).map((ref: string) => <SelectItem key={ref} value={ref}>{ref}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="col-span-2 space-y-1"><Label className="text-xs">{t("retentionTrigger")}</Label><Textarea value={form.loeschereignis} onChange={e => set("loeschereignis", e.target.value)} className="text-sm min-h-12" /></div>
        <div className="space-y-1"><Label className="text-xs">{t("retentionLegalBasis")}</Label><Input value={form.rechtsgrundlage} onChange={e => set("rechtsgrundlage", e.target.value)} className="h-8 text-sm" /></div>
        <div className="space-y-1"><Label className="text-xs">{t("retentionOwner")}</Label><Input value={form.verantwortlicher} onChange={e => set("verantwortlicher", e.target.value)} className="h-8 text-sm" /></div>
        <div className="space-y-1"><Label className="text-xs">{t("retentionDeleteOwner")}</Label><Input value={form.loeschverantwortlicher || ""} onChange={e => set("loeschverantwortlicher", e.target.value)} className="h-8 text-sm" placeholder={t("retentionDeleteOwnerPlaceholder")} /></div>
        <div className="col-span-2 space-y-1"><Label className="text-xs">{t("retentionSystems")}</Label><Textarea value={form.systeme} onChange={e => set("systeme", e.target.value)} className="text-sm min-h-12" /></div>
        <div className="col-span-2 space-y-1"><Label className="text-xs">{t("retentionControl")}</Label><Textarea value={form.kontrolle} onChange={e => set("kontrolle", e.target.value)} className="text-sm min-h-12" /></div>
        <div className="col-span-2 space-y-1"><Label className="text-xs">{t("retentionEvidence")}</Label><Textarea value={form.nachweis} onChange={e => set("nachweis", e.target.value)} className="text-sm min-h-12" /></div>
        <div className={`col-span-2 rounded-lg border px-3 py-2 text-xs ${plausibility.level === "ok" ? "border-emerald-500/30 text-emerald-400" : plausibility.level === "warn" ? "border-yellow-500/30 text-yellow-400" : plausibility.level === "error" ? "border-red-500/30 text-red-400" : "border-blue-500/30 text-blue-400"}`}>
          {plausibility.level === "ok" ? t("trafficLightGreen") : plausibility.level === "warn" ? t("trafficLightYellow") : plausibility.level === "error" ? t("trafficLightRed") : t("noteLabel")} , {plausibility.text}
        </div>
        <div className="col-span-2 rounded-lg border border-border/60 px-3 py-2 text-xs text-muted-foreground">
          {klassenHinweis}
          {missingRequired.length > 0 && <p className="mt-2 text-red-400">Pflichtfelder für {form.loeschklasse}: {missingRequired.join(", ")}</p>}
        </div>
      </div>
      <div className="sticky bottom-0 z-10 -mx-6 mt-4 border-t bg-background px-6 pt-3 pb-1">
        <DialogFooter>
          <Button variant="outline" size="sm" onClick={onCancel}>Abbrechen</Button>
          <Button size="sm" className="bg-primary" onClick={() => onSave({ ...form, quelleVvtId: form.quelleVvtId === "none" ? null : Number(form.quelleVvtId) })} disabled={!form.bezeichnung}>Speichern</Button>
        </DialogFooter>
      </div>
    </div>
  );
}

function LoeschkonzeptPage() {
  const { t } = useI18n();
  const [location, setLocation] = useLocation();
  const { activeMandantId } = useMandant();
  const qc = useQueryClient();
  const { data, isLoading, create, update, remove } = useModuleData("loeschkonzept");
  const { data: aufgaben = [] } = useModuleData("aufgaben");
  const { data: pdca = [] } = useModuleData("pdca");
  const { fristen: gesetzlicheAufbewahrungsfristen } = useComplianceMeta();
  const [modal, setModal] = useState<null | "new" | any>(null);
  const [delId, setDelId] = useState<number | null>(null);
  const [quickFilter, setQuickFilterState] = useState<"all" | "missing-trigger" | "missing-owner" | "missing-proof" | "lk5-control" | "free-period">("all");
  const [filterFrist, setFilterFrist] = useState("alle");
  const [filterKlasse, setFilterKlasse] = useState("alle");
  const [filterStatus, setFilterStatus] = useState("alle");
  const { toast } = useToast();

  useEffect(() => {
    const route = new URL(location, "https://privashield.local");
    const rawFilter = route.searchParams.get("filter");
    setQuickFilterState(rawFilter === "missing-trigger" || rawFilter === "missing-owner" || rawFilter === "missing-proof" || rawFilter === "lk5-control" || rawFilter === "free-period" ? rawFilter : "all");
  }, [location]);

  const setQuickFilter = (value: "all" | "missing-trigger" | "missing-owner" | "missing-proof" | "lk5-control" | "free-period") => {
    setQuickFilterState(value);
    const next = new URL(location, "https://privashield.local");
    if (value === "all") next.searchParams.delete("filter");
    else next.searchParams.set("filter", value);
    setLocation(`${next.pathname}${next.search}`);
  };

  const save = (form: any) => {
    const p = modal === "new" ? create.mutateAsync(form) : update.mutateAsync({ id: modal.id, ...form });
    p.then(() => { setModal(null); toast({ title: "Gespeichert" }); }).catch((e:any) => toast({ title: "Fehler", description: e?.message || "Speichern fehlgeschlagen", variant: "destructive" }));
  };

  const getRetentionMeta = (item: any) => {
    const loeschklasse = String(item?.loeschklasse || "");
    const missingTrigger = !String(item?.loeschereignis || "").trim();
    const missingOwner = !String(item?.loeschverantwortlicher || item?.verantwortlicher || "").trim();
    const missingProof = !String(item?.nachweis || item?.kontrolle || "").trim();
    const lk5Control = loeschklasse === "LK5" && (!String(item?.kontrolle || "").trim() || !String(item?.nachweis || "").trim());
    const freePeriod = String(item?.fristKategorie || "") === "frei" || !String(item?.fristKategorie || "").trim();
    return { missingTrigger, missingOwner, missingProof, lk5Control, freePeriod };
  };

  const retentionMissingTriggerItems = data.filter((item: any) => getRetentionMeta(item).missingTrigger);
  const retentionMissingOwnerItems = data.filter((item: any) => getRetentionMeta(item).missingOwner);
  const retentionMissingProofItems = data.filter((item: any) => getRetentionMeta(item).missingProof);
  const retentionLk5ControlItems = data.filter((item: any) => getRetentionMeta(item).lk5Control);
  const retentionFreePeriodItems = data.filter((item: any) => getRetentionMeta(item).freePeriod);

  const buildRetentionTaskDraft = (item: any, kind: "missing-trigger" | "missing-owner" | "missing-proof" | "lk5-control" | "free-period") => {
    const drafts: Record<string, { title: string; priority: string; description: string }> = {
      "missing-trigger": { title: `Löschereignis ergänzen: ${item.bezeichnung}`, priority: "hoch", description: `Für den Löschkonzept-Eintrag "${item.bezeichnung}" fehlt ein dokumentiertes Löschereignis. Bitte Trigger und Ablauf fachlich ergänzen.` },
      "missing-owner": { title: `Löschverantwortung festlegen: ${item.bezeichnung}`, priority: "hoch", description: `Für den Löschkonzept-Eintrag "${item.bezeichnung}" fehlt eine klare Löschverantwortung. Bitte operative Zuständigkeit festlegen.` },
      "missing-proof": { title: `Nachweis/Kontrolle ergänzen: ${item.bezeichnung}`, priority: "mittel", description: `Für den Löschkonzept-Eintrag "${item.bezeichnung}" fehlt eine belastbare Dokumentation von Nachweis oder Kontrolle.` },
      "lk5-control": { title: `LK5-Kontrollnachweis absichern: ${item.bezeichnung}`, priority: "kritisch", description: `Für den Hochrisiko-Eintrag "${item.bezeichnung}" fehlen Kontrolle oder Nachweis. Bitte die erhöhten Löschanforderungen nachziehen.` },
      "free-period": { title: `Freie Löschfrist begründen: ${item.bezeichnung}`, priority: "mittel", description: `Der Löschkonzept-Eintrag "${item.bezeichnung}" nutzt eine freie Fristkategorie. Bitte rechtliche/fachliche Begründung und Fristlogik absichern.` },
    };
    const draft = drafts[kind];
    const params = new URLSearchParams({ draftTitle: draft.title, draftPriority: draft.priority, draftDescription: draft.description, draftSource: `loeschkonzept:${kind}:${item.id}` });
    return { href: `/aufgaben?${params.toString()}`, title: draft.title, priority: draft.priority, description: draft.description, source: `loeschkonzept:${kind}:${item.id}` };
  };

  const createRetentionFollowUpTask = async (item: any, kind: "missing-trigger" | "missing-owner" | "missing-proof" | "lk5-control" | "free-period") => {
    const draft = buildRetentionTaskDraft(item, kind);
    const duplicate = aufgaben.find((task: any) => String(task?.vorlagenBezug || "") === draft.source && String(task?.status || "") !== "erledigt");
    if (duplicate) {
      toast({ title: "Aufgabe bereits vorhanden", description: `Offene Folgeaufgabe gefunden: ${duplicate.titel}` });
      return;
    }
    await apiRequest("POST", `/api/mandanten/${activeMandantId}/aufgaben`, {
      titel: draft.title,
      beschreibung: draft.description,
      typ: "task",
      prioritaet: draft.priority,
      status: "offen",
      fortschritt: 0,
      verantwortlicher: item.loeschverantwortlicher || item.verantwortlicher || "",
      faelligAm: "",
      kategorie: "loeschkonzept",
      referenzId: item.id,
      vorlagenBezug: draft.source,
    });
    await qc.invalidateQueries({ queryKey: [`/api/mandanten/${activeMandantId}/aufgaben`] });
    toast({ title: "Folgeaufgabe erstellt", description: draft.title });
  };

  const createRetentionPdcaCycle = async (item: any, kind: "missing-trigger" | "missing-owner" | "missing-proof" | "lk5-control" | "free-period") => {
    const source = `loeschkonzept-pdca:${kind}:${item.id}`;
    const duplicate = pdca.find((entry: any) => String(entry?.actNaechsterZyklus || "").includes(source) && String(entry?.status || "") !== "abgeschlossen");
    if (duplicate) {
      toast({ title: "PDCA bereits vorhanden", description: `Offener Zyklus gefunden: ${duplicate.titel}` });
      return;
    }
    const reviewDate = new Date();
    reviewDate.setDate(reviewDate.getDate() + (kind === "lk5-control" ? 7 : 21));
    const pdcaTitle = `PDCA Löschkonzept: ${item.bezeichnung}`;
    const pdcaItem = await apiRequest("POST", `/api/mandanten/${activeMandantId}/pdca`, {
      titel: pdcaTitle,
      beschreibung: `Verbesserungszyklus für den Löschkonzept-Eintrag "${item.bezeichnung}".`,
      zyklusTyp: "verbesserungsmassnahme",
      status: "geplant",
      prioritaet: kind === "lk5-control" ? "kritisch" : "hoch",
      verantwortlicher: item.loeschverantwortlicher || item.verantwortlicher || "",
      naechstePruefungAm: reviewDate.toISOString().split("T")[0],
      planRisiken: `Löschklasse: ${item.loeschklasse || "—"}\nFrist: ${item.aufbewahrungsfrist || "—"}\nGesetzliche Frist: ${item.gesetzlicheFrist || "—"}`,
      planMassnahmen: kind === "missing-trigger" ? "Löschereignis und operative Auslösebedingungen definieren." : kind === "missing-owner" ? "Löschverantwortung und Zuständigkeit verbindlich festlegen." : kind === "missing-proof" ? "Nachweis- und Kontrolllogik dokumentieren." : kind === "lk5-control" ? "Für LK5 Kontrollen, Nachweise und Verantwortlichkeiten hochprioritär absichern." : "Freie Fristkategorie fachlich und rechtlich belastbar begründen.",
      planZiele: "Löschkonzept belastbar, nachweisbar und operativ steuerbar halten.",
      actNaechsterZyklus: source,
      verknuepftesAuditId: null,
    }).then(r => r.json());
    await apiRequest("POST", `/api/mandanten/${activeMandantId}/aufgaben`, {
      titel: `${pdcaTitle} – Folgeaufgabe`,
      beschreibung: `Operative Folgeaufgabe zum Verbesserungszyklus für "${item.bezeichnung}".`,
      typ: "task",
      prioritaet: kind === "lk5-control" ? "kritisch" : "hoch",
      status: "offen",
      fortschritt: 0,
      verantwortlicher: item.loeschverantwortlicher || item.verantwortlicher || "",
      faelligAm: reviewDate.toISOString().split("T")[0],
      kategorie: "loeschkonzept",
      referenzId: pdcaItem.id,
      vorlagenBezug: "pdca_follow_up",
    });
    await qc.invalidateQueries({ queryKey: [`/api/mandanten/${activeMandantId}/pdca`] });
    await qc.invalidateQueries({ queryKey: [`/api/mandanten/${activeMandantId}/aufgaben`] });
    toast({ title: "PDCA-Zyklus erstellt", description: pdcaTitle });
  };

  const filtered = data.filter((item: any) => {
    const meta = getRetentionMeta(item);
    if (quickFilter === "missing-trigger" && !meta.missingTrigger) return false;
    if (quickFilter === "missing-owner" && !meta.missingOwner) return false;
    if (quickFilter === "missing-proof" && !meta.missingProof) return false;
    if (quickFilter === "lk5-control" && !meta.lk5Control) return false;
    if (quickFilter === "free-period" && !meta.freePeriod) return false;
    return (filterFrist === "alle" || item.fristKategorie === filterFrist) && (filterKlasse === "alle" || item.loeschklasse === filterKlasse) && (filterStatus === "alle" || item.status === filterStatus);
  });

  return (
    <MandantGuard>
      <PageHeader title={t("retentionTitle")} desc={t("retentionDesc")}
        action={<Button size="sm" className="bg-primary h-8 text-xs gap-1.5" onClick={() => setModal("new")}><Plus className="h-3.5 w-3.5" />Neuer Eintrag</Button>} />
      {isLoading ? <Skeleton className="h-32 w-full" /> : (
        <div className="space-y-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Löschkonzept-Quick-Check</CardTitle>
              <CardDescription>Schneller Blick auf Pflichtfelder, Nachweise und erhöhte Anforderungen je Löschklasse</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {retentionMissingTriggerItems.length > 0 && <p className="text-yellow-400">Einträge ohne Löschereignis: {retentionMissingTriggerItems.length}</p>}
              {retentionMissingOwnerItems.length > 0 && <p className="text-yellow-400">Einträge ohne Löschverantwortung: {retentionMissingOwnerItems.length}</p>}
              {retentionMissingProofItems.length > 0 && <p className="text-yellow-400">Einträge ohne Nachweis/Kontrolle: {retentionMissingProofItems.length}</p>}
              {retentionLk5ControlItems.length > 0 && <p className="text-red-400">LK5-Einträge mit offenem Kontroll-/Nachweisbedarf: {retentionLk5ControlItems.length}</p>}
              {retentionFreePeriodItems.length > 0 && <p className="text-yellow-400">Einträge mit freier Fristkategorie: {retentionFreePeriodItems.length}</p>}
              {data.length === 0 && <p className="text-muted-foreground">Noch keine Löschkonzept-Einträge dokumentiert.</p>}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Löschkonzept-Fokusliste</CardTitle>
              <CardDescription>Priorisierte Einträge mit Handlungsbedarf bei Trigger, Verantwortung, Nachweis oder Hochrisiko-Anforderungen</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {retentionLk5ControlItems.slice(0, 3).map((item: any) => <div key={`lk5-${item.id}`} className="rounded-lg border border-red-500/20 bg-red-500/5 p-3"><p className="font-medium text-red-700 dark:text-red-400">LK5-Kontrollbedarf: {item.bezeichnung}</p><p className="text-xs text-muted-foreground">Empfehlung: Kontrolle, Nachweis und Verantwortlichkeit sofort absichern.</p><div className="mt-2 flex gap-2"><Button type="button" size="sm" variant="outline" onClick={() => setQuickFilter("lk5-control")}>Nur diese Fälle</Button><Button type="button" size="sm" variant="secondary" onClick={() => createRetentionFollowUpTask(item, "lk5-control")}>Aufgabe erzeugen</Button><Button type="button" size="sm" variant="secondary" onClick={() => createRetentionPdcaCycle(item, "lk5-control")}>PDCA erzeugen</Button><Link href={buildRetentionTaskDraft(item, "lk5-control").href}><a className="text-xs text-primary hover:underline self-center">Aufgabe vorbereiten</a></Link></div></div>)}
              {retentionMissingTriggerItems.slice(0, 2).map((item: any) => <div key={`trigger-${item.id}`} className="rounded-lg border border-yellow-500/20 bg-yellow-500/5 p-3"><p className="font-medium text-yellow-700 dark:text-yellow-400">Löschereignis fehlt: {item.bezeichnung}</p><div className="mt-2 flex gap-2"><Button type="button" size="sm" variant="outline" onClick={() => setQuickFilter("missing-trigger")}>Nur diese Fälle</Button><Button type="button" size="sm" variant="secondary" onClick={() => createRetentionFollowUpTask(item, "missing-trigger")}>Aufgabe erzeugen</Button><Button type="button" size="sm" variant="secondary" onClick={() => createRetentionPdcaCycle(item, "missing-trigger")}>PDCA erzeugen</Button></div></div>)}
              {retentionMissingOwnerItems.slice(0, 2).map((item: any) => <div key={`owner-${item.id}`} className="rounded-lg border border-yellow-500/20 bg-yellow-500/5 p-3"><p className="font-medium text-yellow-700 dark:text-yellow-400">Löschverantwortung fehlt: {item.bezeichnung}</p><div className="mt-2 flex gap-2"><Button type="button" size="sm" variant="outline" onClick={() => setQuickFilter("missing-owner")}>Nur diese Fälle</Button><Button type="button" size="sm" variant="secondary" onClick={() => createRetentionFollowUpTask(item, "missing-owner")}>Aufgabe erzeugen</Button><Button type="button" size="sm" variant="secondary" onClick={() => createRetentionPdcaCycle(item, "missing-owner")}>PDCA erzeugen</Button></div></div>)}
            </CardContent>
          </Card>
          <div className="flex gap-2 mb-2 flex-wrap">
            <Button type="button" size="sm" variant={quickFilter === "all" ? "default" : "outline"} onClick={() => setQuickFilter("all")}>Alle</Button>
            <Button type="button" size="sm" variant={quickFilter === "missing-trigger" ? "default" : "outline"} onClick={() => setQuickFilter("missing-trigger")}>Ohne Löschereignis</Button>
            <Button type="button" size="sm" variant={quickFilter === "missing-owner" ? "default" : "outline"} onClick={() => setQuickFilter("missing-owner")}>Ohne Verantwortung</Button>
            <Button type="button" size="sm" variant={quickFilter === "missing-proof" ? "default" : "outline"} onClick={() => setQuickFilter("missing-proof")}>Ohne Nachweis</Button>
            <Button type="button" size="sm" variant={quickFilter === "lk5-control" ? "default" : "outline"} onClick={() => setQuickFilter("lk5-control")}>LK5-Kontrollbedarf</Button>
            <Button type="button" size="sm" variant={quickFilter === "free-period" ? "default" : "outline"} onClick={() => setQuickFilter("free-period")}>Freie Frist</Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {loeschklassen.map((k) => <Card key={k.key}><CardContent className="p-4"><p className="text-xs text-muted-foreground">{k.key}</p><p className="text-sm font-semibold">{k.label}</p><p className="text-2xl font-bold mt-2">{data.filter((x:any) => x.loeschklasse === k.key).length}</p></CardContent></Card>)}
            {gesetzlicheAufbewahrungsfristen.filter((f: any) => f.key !== "frei").slice(0,3).map((f: any) => <Card key={f.key}><CardContent className="p-4"><p className="text-xs text-muted-foreground">Fristgruppe</p><p className="text-sm font-semibold">{f.frist}</p><p className="text-xs text-muted-foreground mt-1">{f.label}</p><p className="text-2xl font-bold mt-2">{data.filter((x:any) => x.fristKategorie === f.key).length}</p></CardContent></Card>)}
          </div>
          <Card><CardContent className="p-4 grid grid-cols-1 md:grid-cols-3 gap-3 items-end"><div className="space-y-1"><Label className="text-xs">Fristgruppe</Label><Select value={filterFrist} onValueChange={setFilterFrist}><SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="alle">Alle</SelectItem>{gesetzlicheAufbewahrungsfristen.map((f: any) => <SelectItem key={f.key} value={f.key}>{f.label}</SelectItem>)}</SelectContent></Select></div><div className="space-y-1"><Label className="text-xs">Löschklasse</Label><Select value={filterKlasse} onValueChange={setFilterKlasse}><SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="alle">Alle</SelectItem>{loeschklassen.map((k) => <SelectItem key={k.key} value={k.key}>{k.label}</SelectItem>)}</SelectContent></Select></div><div className="space-y-1"><Label className="text-xs">Status</Label><Select value={filterStatus} onValueChange={setFilterStatus}><SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="alle">Alle</SelectItem><SelectItem value="aktiv">Aktiv</SelectItem><SelectItem value="entwurf">Entwurf</SelectItem><SelectItem value="archiviert">Archiviert</SelectItem></SelectContent></Select></div></CardContent></Card>
          <Card><CardContent className="p-4 grid grid-cols-1 md:grid-cols-3 gap-3 text-sm"><div><p className="text-xs text-muted-foreground">Gefilterte Einträge</p><p className="text-2xl font-bold">{filtered.length}</p></div><div><p className="text-xs text-muted-foreground">Davon aktiv</p><p className="text-2xl font-bold">{filtered.filter((x:any) => x.status === "aktiv").length}</p></div><div><p className="text-xs text-muted-foreground">Mit gesetzlicher Frist</p><p className="text-2xl font-bold">{filtered.filter((x:any) => x.fristKategorie && x.fristKategorie !== "frei").length}</p></div></CardContent></Card>
          {filtered.length === 0 && <Card className="border-dashed"><CardContent className="py-12 text-center text-sm text-muted-foreground">Keine Einträge für die aktuelle Filterung.</CardContent></Card>}
          {filtered.map((item:any) => {
            const meta = getRetentionMeta(item);
            return <Card key={item.id} className={`group hover:border-border/80 transition-colors ${meta.lk5Control ? "border-red-500/30" : meta.missingTrigger || meta.missingOwner || meta.missingProof ? "border-yellow-500/30" : ""}`}><CardContent className="p-4 space-y-2"><div className="flex flex-col items-start justify-between gap-3 sm:flex-row"><div><p className="text-sm font-semibold">{item.bezeichnung}</p><p className="text-xs text-muted-foreground">{item.loeschklasse} · {item.aufbewahrungsfrist || "keine Frist"}{item.gesetzlicheFrist ? ` · ${item.gesetzlicheFrist}` : ""}{item.quelleVvtBezeichnung ? ` · aus VVT: ${item.quelleVvtBezeichnung}` : ""}</p><p className="text-xs text-muted-foreground">{meta.missingTrigger ? "Löschereignis offen · " : ""}{meta.missingOwner ? "Verantwortung offen · " : ""}{meta.missingProof ? "Nachweis offen" : ""}</p></div><div className="flex w-full items-center justify-between gap-2 sm:w-auto sm:justify-end"><div className="flex items-center gap-2 flex-wrap justify-end">{meta.lk5Control && <Badge variant="outline" className="text-xs border-red-500/40 text-red-600">LK5-Kontrollbedarf</Badge>}{meta.missingTrigger && <Badge variant="outline" className="text-xs border-yellow-500/40 text-yellow-600">Trigger fehlt</Badge>}{meta.missingOwner && <Badge variant="outline" className="text-xs border-yellow-500/40 text-yellow-600">Owner fehlt</Badge>}{meta.missingProof && <Badge variant="outline" className="text-xs border-yellow-500/40 text-yellow-600">Nachweis fehlt</Badge>}<StatusBadge value={item.status} /></div><button onClick={() => setModal(item)} className="p-1 rounded text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-all"><Pencil className="h-3.5 w-3.5" /></button><button onClick={() => setDelId(item.id)} className="p-1 rounded text-muted-foreground hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"><Trash2 className="h-3.5 w-3.5" /></button></div></div><div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs"><div className="rounded-lg border p-3"><p className="font-medium mb-1">Löschereignis</p><p className="text-muted-foreground whitespace-pre-wrap">{item.loeschereignis || "—"}</p><p className="font-medium mt-3 mb-1">Löschverantwortlicher</p><p className="text-muted-foreground whitespace-pre-wrap">{item.loeschverantwortlicher || item.verantwortlicher || "—"}</p></div><div className="rounded-lg border p-3"><p className="font-medium mb-1">Nachweis / Kontrolle</p><p className="text-muted-foreground whitespace-pre-wrap">{item.nachweis || item.kontrolle || "—"}</p></div></div></CardContent></Card>;
          })}
        </div>
      )}
      <Dialog open={!!modal} onOpenChange={o => !o && setModal(null)}><DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto"><div className="sticky top-0 z-10 -mx-6 border-b bg-background px-6 pb-3 pt-1"><DialogHeader><DialogTitle>{modal === "new" ? "Neuer Löschkonzept-Eintrag" : "Löschkonzept bearbeiten"}</DialogTitle></DialogHeader></div>{modal && <LoeschkonzeptForm initial={modal === "new" ? {} : modal} onSave={save} onCancel={() => setModal(null)} />}</DialogContent></Dialog>
      <ConfirmDialog open={delId !== null} title="Eintrag löschen?" desc="Dieser Vorgang kann nicht rückgängig gemacht werden." onConfirm={() => { remove.mutate(delId!); setDelId(null); }} onCancel={() => setDelId(null)} />
    </MandantGuard>
  );
}

function AuditsPage() {
  const { t } = useI18n();
  const [location, setLocation] = useLocation();
  const rawAuditFilter = new URLSearchParams(location.split("?")[1] || "").get("filter") || "";
  const { activeMandantId } = useMandant();
  const qc = useQueryClient();
  const { data, isLoading, create, update, remove } = useModuleData("audits");
  const { data: aufgaben = [] } = useModuleData("aufgaben");
  const { data: pdca = [] } = useModuleData("pdca");
  const [modal, setModal] = useState<null | "new" | any>(null);
  const [delId, setDelId] = useState<number | null>(null);
  const { toast } = useToast();
  const save = async (form: any) => {
    try {
      const auditItem = modal === "new" ? await create.mutateAsync(form) : await update.mutateAsync({ id: modal.id, ...form });
      if (modal === "new" && activeMandantId && form.createPdcaFollowUp) {
        const combinedFindings = Array.from(new Set([
          ...String(form.feststellungen || "").split("\n").map((line: string) => line.trim()).filter(Boolean),
          ...String(form.abweichungen || "").split("\n").map((line: string) => line.trim()).filter(Boolean),
        ])).join("\n");
        const recommendationLines = Array.from(new Set(String(form.empfehlungen || "").split("\n").map((line: string) => line.trim()).filter(Boolean)));
        const pdcaItem = await apiRequest("POST", `/api/mandanten/${activeMandantId}/pdca`, {
          titel: `Audit-Follow-up: ${auditItem.titel}`,
          beschreibung: [form.pruefbereich, combinedFindings].filter(Boolean).join("\n\n"),
          zyklusTyp: "audit_follow_up",
          status: "geplant",
          prioritaet: form.ergebnis === "kritisch" ? "kritisch" : "hoch",
          verantwortlicher: form.auditor || "",
          naechstePruefungAm: form.followUpDatum || form.naechstesAuditAm || "",
          planZiele: recommendationLines.join("\n"),
          planMassnahmen: recommendationLines.join("\n"),
          checkFeststellungen: combinedFindings,
          actFolgemassnahmen: recommendationLines.join("\n"),
          verknuepftesAuditId: auditItem.id,
          tags: JSON.stringify(["Audit", "Follow-up"]),
        }).then(r => r.json());
        const currentIds = (() => {
          try { return JSON.parse(auditItem.verknuepftePdcaIds || "[]"); } catch { return []; }
        })();
        const mergedIds = Array.from(new Set([...currentIds, pdcaItem.id]));
        await update.mutateAsync({ id: auditItem.id, verknuepftePdcaIds: JSON.stringify(mergedIds) });
        if (form.createAuditTasks) {
          const lines = recommendationLines;
          for (const line of lines) {
            await apiRequest("POST", `/api/mandanten/${activeMandantId}/aufgaben`, {
              titel: `Audit-Maßnahme: ${line}`,
              beschreibung: `Aus Audit: ${auditItem.titel}${form.abweichungen ? `\n\nAbweichungen:\n${form.abweichungen}` : ""}`,
              typ: "task",
              prioritaet: form.ergebnis === "kritisch" ? "kritisch" : "hoch",
              status: "offen",
              fortschritt: 0,
              verantwortlicher: form.auditor || "",
              faelligAm: form.followUpDatum || form.naechstesAuditAm || null,
              kategorie: "audit",
              referenzId: pdcaItem.id,
              vorlagenBezug: "pdca_follow_up",
            });
          }
        }
        await qc.invalidateQueries({ queryKey: [`/api/mandanten/${activeMandantId}/pdca`] });
        await qc.invalidateQueries({ queryKey: [`/api/mandanten/${activeMandantId}/aufgaben`] });
      }
      setModal(null);
      toast({ title: "Gespeichert" });
    } catch {
      toast({ title: "Fehler", variant: "destructive" });
    }
  };
  const offeneAuditAufgaben = aufgaben.filter((a: any) => (a.kategorie === "audit" || String(a.titel || "").toLowerCase().includes("audit")) && a.status !== "erledigt");
  const auditFollowUps = pdca.filter((item: any) => String(item.zyklusTyp || "") === "audit_follow_up");
  const auditFollowUpsOffen = auditFollowUps.filter((item: any) => String(item.status || "") !== "abgeschlossen");
  const offeneAuditFolgeaufgaben = aufgaben.filter((a: any) => String(a.vorlagenBezug || "") === "pdca_follow_up" && a.status !== "erledigt");
  const todayIso = new Date().toISOString().split("T")[0];
  const getAuditMeta = (item: any) => {
    const abweichungen = String(item.abweichungen || "").split("\n").filter((line: string) => line.trim());
    const todos = String(item.empfehlungen || "").split("\n").filter((line: string) => line.trim());
    const linkedPdcaIds = (() => {
      try { return JSON.parse(item.verknuepftePdcaIds || "[]"); } catch { return []; }
    })();
    const linkedPdca = pdca.filter((entry: any) => linkedPdcaIds.includes(entry.id));
    const linkedTasks = aufgaben.filter((task: any) => String(task.vorlagenBezug || "") === "pdca_follow_up" && linkedPdca.some((entry: any) => Number(entry.id) === Number(task.referenzId)));
    const offeneLinkedTasks = linkedTasks.filter((task: any) => task.status !== "erledigt");
    const missingFollowUp = abweichungen.length > 0 && linkedPdca.length === 0;
    const overdueNextAudit = !!item.naechstesAuditAm && item.naechstesAuditAm < todayIso && String(item.status || "") !== "abgeschlossen";
    const criticalOpen = ["kritisch", "hoch"].includes(String(item.ergebnis || "").toLowerCase()) && String(item.status || "") !== "abgeschlossen";
    const missingOwner = (abweichungen.length > 0 || todos.length > 0) && !String(item.auditor || item.verantwortlicher || "").trim();
    const inProgressNoTask = linkedPdca.some((entry: any) => String(entry.status || "") === "in_bearbeitung") && offeneLinkedTasks.length === 0;
    return { abweichungen, todos, linkedPdca, linkedTasks, offeneLinkedTasks, missingFollowUp, overdueNextAudit, criticalOpen, missingOwner, inProgressNoTask };
  };
  const filteredAudits = data.filter((item: any) => {
    const meta = getAuditMeta(item);
    if (rawAuditFilter === "missing-follow-up") return meta.missingFollowUp;
    if (rawAuditFilter === "overdue-next-audit") return meta.overdueNextAudit;
    if (rawAuditFilter === "critical-open") return meta.criticalOpen;
    if (rawAuditFilter === "missing-owner") return meta.missingOwner;
    if (rawAuditFilter === "in-progress-no-task") return meta.inProgressNoTask;
    return true;
  }).sort((a: any, b: any) => {
    const metaA = getAuditMeta(a);
    const metaB = getAuditMeta(b);
    const aScore = (metaA.missingFollowUp ? 120 : 0) + (metaA.criticalOpen ? 90 : 0) + (metaA.overdueNextAudit ? 70 : 0) + (metaA.missingOwner ? 60 : 0) + (metaA.inProgressNoTask ? 50 : 0) + metaA.abweichungen.length * 5;
    const bScore = (metaB.missingFollowUp ? 120 : 0) + (metaB.criticalOpen ? 90 : 0) + (metaB.overdueNextAudit ? 70 : 0) + (metaB.missingOwner ? 60 : 0) + (metaB.inProgressNoTask ? 50 : 0) + metaB.abweichungen.length * 5;
    if (rawAuditFilter) return bScore - aScore || String(a.naechstesAuditAm || "9999-12-31").localeCompare(String(b.naechstesAuditAm || "9999-12-31")) || String(a.titel || "").localeCompare(String(b.titel || ""), "de");
    return String(a.auditdatum || "9999-12-31").localeCompare(String(b.auditdatum || "9999-12-31")) || String(a.titel || "").localeCompare(String(b.titel || ""), "de");
  });
  const auditMissingFollowUp = data.filter((item: any) => getAuditMeta(item).missingFollowUp);
  const auditOverdueNextAudit = data.filter((item: any) => getAuditMeta(item).overdueNextAudit);
  const auditCriticalOpen = data.filter((item: any) => getAuditMeta(item).criticalOpen);
  const auditMissingOwner = data.filter((item: any) => getAuditMeta(item).missingOwner);
  const auditInProgressNoTask = data.filter((item: any) => getAuditMeta(item).inProgressNoTask);
  const gesamtAbweichungen = data.reduce((sum: number, item: any) => sum + getAuditMeta(item).abweichungen.length, 0);
  const auditFilterHint = rawAuditFilter === "missing-follow-up"
    ? "Du siehst gerade: Audits mit Abweichungen, aber ohne verknüpften PDCA-Follow-up."
    : rawAuditFilter === "overdue-next-audit"
      ? "Du siehst gerade: Audits mit überfälligem nächstem Audit-Termin."
      : rawAuditFilter === "critical-open"
        ? "Du siehst gerade: offene kritische oder hohe Auditergebnisse."
        : rawAuditFilter === "missing-owner"
          ? "Du siehst gerade: Audits mit Maßnahmenbedarf ohne klare Verantwortlichkeit."
          : rawAuditFilter === "in-progress-no-task"
            ? "Du siehst gerade: Audit-Follow-ups in Bearbeitung ohne offene Folgeaufgabe."
            : "";
  return (
    <MandantGuard>
      <PageHeader title={t("auditsTitle")} desc={t("auditsDesc")}
        action={<Button size="sm" className="bg-primary h-8 text-xs gap-1.5" onClick={() => setModal("new")}><Plus className="h-3.5 w-3.5" />Neues Audit</Button>} />
      {auditFilterHint && <Card className="mb-4 border-primary/30 bg-primary/5"><CardContent className="py-3 px-4 flex flex-col gap-2 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between"><span>{auditFilterHint} <span className="font-medium text-foreground">({filteredAudits.length})</span></span><div className="flex flex-wrap gap-2"><Button type="button" size="sm" variant="outline" onClick={() => {
        const next = new URL(location, "https://privashield.local");
        next.searchParams.delete("filter");
        setLocation(`${next.pathname}${next.search}`);
      }}>Filter zurücksetzen</Button><Link href="/pdca?filter=audit-follow-up-ohne-audit"><a className="text-xs text-primary hover:underline self-center">Zu PDCA</a></Link></div></CardContent></Card>}
      {(rawAuditFilter === "missing-follow-up" || rawAuditFilter === "critical-open" || rawAuditFilter === "overdue-next-audit" || rawAuditFilter === "missing-owner" || rawAuditFilter === "in-progress-no-task") && (
        <Card className="mb-4 border-border/60 bg-muted/20">
          <CardContent className="py-3 px-4 grid grid-cols-1 gap-3 text-sm md:grid-cols-5">
            <div><p className="text-xs text-muted-foreground">Ohne Follow-up</p><p className="font-semibold">{auditMissingFollowUp.length}</p></div>
            <div><p className="text-xs text-muted-foreground">Kritisch/hoch offen</p><p className="font-semibold">{auditCriticalOpen.length}</p></div>
            <div><p className="text-xs text-muted-foreground">Nächstes Audit überfällig</p><p className="font-semibold">{auditOverdueNextAudit.length}</p></div>
            <div><p className="text-xs text-muted-foreground">Ohne Verantwortliche</p><p className="font-semibold">{auditMissingOwner.length}</p></div>
            <div><p className="text-xs text-muted-foreground">In Bearbeitung ohne Aufgabe</p><p className="font-semibold">{auditInProgressNoTask.length}</p></div>
          </CardContent>
        </Card>
      )}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-3 mb-4">
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Audits gesamt</p><p className="text-2xl font-bold">{data.length}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Abweichungen gesamt</p><p className="text-2xl font-bold">{gesamtAbweichungen}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Offene Audit-To-dos</p><p className="text-2xl font-bold">{offeneAuditAufgaben.length}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">PDCA Audit-Follow-ups offen</p><p className="text-2xl font-bold">{auditFollowUpsOffen.length}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Offene Folgeaufgaben</p><p className="text-2xl font-bold">{offeneAuditFolgeaufgaben.length}</p></CardContent></Card>
      </div>
      {(auditMissingFollowUp.length > 0 || auditCriticalOpen.length > 0 || auditOverdueNextAudit.length > 0 || auditMissingOwner.length > 0 || auditInProgressNoTask.length > 0) && (
        <Card className="mb-4 border-amber-500/40 bg-amber-500/5">
          <CardHeader>
            <CardTitle className="text-sm">Audit-Fokusliste</CardTitle>
            <CardDescription>Diese Punkte sind aktuell im Audit-Workflow am wichtigsten.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            {auditMissingFollowUp.length > 0 && <p>• {auditMissingFollowUp.length} Audit(s) mit Abweichungen haben noch keinen verknüpften PDCA-Follow-up.</p>}
            {auditCriticalOpen.length > 0 && <p>• {auditCriticalOpen.length} Audit(s) sind mit hohem oder kritischem Ergebnis noch offen.</p>}
            {auditOverdueNextAudit.length > 0 && <p>• {auditOverdueNextAudit.length} Audit(s) haben einen überfälligen nächsten Audit-Termin.</p>}
            {auditMissingOwner.length > 0 && <p>• {auditMissingOwner.length} Audit(s) mit Maßnahmenbedarf haben keine klare Verantwortlichkeit.</p>}
            {auditInProgressNoTask.length > 0 && <p>• {auditInProgressNoTask.length} Audit-Follow-ups laufen ohne offene Folgeaufgabe.</p>}
          </CardContent>
        </Card>
      )}
      <Card className="mb-4">
        <CardHeader>
          <CardTitle className="text-sm">Audit-zu-PDCA-Verzahnung</CardTitle>
          <CardDescription>Nachverfolgung von Audit-Feststellungen über PDCA-Zyklen und offene To-dos</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-5 gap-3 text-sm">
          <div><p className="text-xs text-muted-foreground">Audit-Follow-up-Zyklen</p><p className="text-2xl font-bold">{auditFollowUps.length}</p></div>
          <div><p className="text-xs text-muted-foreground">Offene Follow-ups</p><p className="text-2xl font-bold">{auditFollowUpsOffen.length}</p></div>
          <div><p className="text-xs text-muted-foreground">Audit-To-dos ohne Abschluss</p><p className="text-2xl font-bold">{offeneAuditAufgaben.length}</p></div>
          <div><p className="text-xs text-muted-foreground">Explizit verknüpfte Audits</p><p className="text-2xl font-bold">{data.filter((item: any) => {
            try { return JSON.parse(item.verknuepftePdcaIds || "[]").length > 0; } catch { return false; }
          }).length}</p></div>
          <div><p className="text-xs text-muted-foreground">Offene Folgeaufgaben</p><p className="text-2xl font-bold">{offeneAuditFolgeaufgaben.length}</p></div>
        </CardContent>
      </Card>
      {isLoading ? <Skeleton className="h-32 w-full" /> : (
        <div className="space-y-3">
          {filteredAudits.length === 0 && <Card className="border-dashed"><CardContent className="py-12 text-center text-sm text-muted-foreground">{auditFilterHint || "Noch keine Audits dokumentiert."}{auditFilterHint ? " Aktuell gibt es dafür keine Treffer." : ""}</CardContent></Card>}
          {filteredAudits.map((item: any) => {
            const meta = getAuditMeta(item);
            const abweichungen = meta.abweichungen;
            const todos = meta.todos;
            const linkedPdca = meta.linkedPdca;
            const linkedTasks = meta.linkedTasks;
            const offeneLinkedTasks = meta.offeneLinkedTasks;
            return (
              <Card key={item.id} className="group hover:border-border/80 transition-colors">
                <CardContent className="p-4 space-y-3">
                  <div className="flex flex-col items-start justify-between gap-3 sm:flex-row">
                    <div>
                      <p className="text-sm font-semibold">{item.titel}</p>
                      <p className="text-xs text-muted-foreground">{item.pruefbereich || "Allgemeiner Prüfbereich"} · {item.auditdatum}{item.auditor ? ` · Auditor: ${item.auditor}` : ""}{item.naechstesAuditAm ? ` · nächstes Audit ${item.naechstesAuditAm}` : ""}</p>
                      {rawAuditFilter && <p className="text-xs text-muted-foreground">Arbeitszustand: {meta.missingFollowUp ? "heute nachziehen" : meta.criticalOpen ? "priorisiert" : meta.overdueNextAudit ? "Termin eskaliert" : meta.missingOwner ? "Verantwortung klären" : meta.inProgressNoTask ? "blockiert" : "beobachten"}</p>}
                    </div>
                    <div className="flex w-full items-center justify-between gap-2 shrink-0 sm:w-auto sm:justify-end">
                      <StatusBadge value={item.ergebnis} />
                      <StatusBadge value={item.status} />
                      <button onClick={() => setModal(item)} className="p-1 rounded text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-all"><Pencil className="h-3.5 w-3.5" /></button>
                      <button onClick={() => setDelId(item.id)} className="p-1 rounded text-muted-foreground hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"><Trash2 className="h-3.5 w-3.5" /></button>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-3 text-xs">
                    <div className="rounded-lg border p-3"><p className="font-medium mb-1">Scope</p><p className="text-muted-foreground whitespace-pre-wrap">{item.scope || "—"}</p></div>
                    <div className="rounded-lg border p-3"><p className="font-medium mb-1">Abweichungen</p><p className="text-muted-foreground whitespace-pre-wrap">{abweichungen.length ? abweichungen.join("\n") : "—"}</p></div>
                    <div className="rounded-lg border p-3"><p className="font-medium mb-1">Audit-To-dos</p><p className="text-muted-foreground whitespace-pre-wrap">{todos.length ? todos.join("\n") : "—"}</p></div>
                    <div className="rounded-lg border p-3"><p className="font-medium mb-1">PDCA-Follow-ups</p><p className="text-muted-foreground whitespace-pre-wrap">{linkedPdca.length ? linkedPdca.map((pd: any) => `${pd.titel} (${pd.status})`).join("\n") : auditFollowUps.filter((pd: any) => {
                      const haystack = [pd.titel, pd.beschreibung, pd.planMassnahmen, pd.checkFeststellungen, pd.actFolgemassnahmen].join(" \n ").toLowerCase();
                      return haystack.includes(String(item.titel || "").toLowerCase());
                    }).map((fallbackPdca: any) => `${fallbackPdca.titel} (${fallbackPdca.status})`).join("\n") || "—"}</p></div>
                    <div className="rounded-lg border p-3"><p className="font-medium mb-1">Folgeaufgaben</p><p className="text-muted-foreground whitespace-pre-wrap">{linkedTasks.length ? linkedTasks.map((task: any) => `${task.titel} (${task.status}, ${Number(task.fortschritt || 0)}%)`).join("\n") : "—"}{offeneLinkedTasks.length ? `\n\nOffen: ${offeneLinkedTasks.length}` : ""}</p></div>
                  </div>
                  {(meta.missingFollowUp || meta.criticalOpen || meta.overdueNextAudit || meta.missingOwner || meta.inProgressNoTask) && (
                    <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-xs text-amber-200">
                      {meta.missingFollowUp ? "Für dieses Audit bestehen Abweichungen, aber noch kein verknüpfter PDCA-Follow-up." : meta.criticalOpen ? "Dieses Audit ist mit hohem oder kritischem Ergebnis noch offen und sollte priorisiert nachgesteuert werden." : meta.overdueNextAudit ? "Der nächste Audit-Termin ist überfällig und sollte neu geplant oder durchgeführt werden." : meta.missingOwner ? "Für Audit-Abweichungen oder Empfehlungen fehlt aktuell eine klare Verantwortlichkeit." : "Dieser Audit-Follow-up läuft ohne offene Folgeaufgabe und sollte operativ abgesichert werden."}
                    </div>
                  )}
                  {(item.feststellungen || item.positiveAspekte) && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                      <div className="rounded-lg border p-3"><p className="font-medium mb-1">Feststellungen</p><p className="text-muted-foreground whitespace-pre-wrap">{item.feststellungen || "—"}</p></div>
                      <div className="rounded-lg border p-3"><p className="font-medium mb-1">Positive Aspekte</p><p className="text-muted-foreground whitespace-pre-wrap">{item.positiveAspekte || "—"}</p></div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
      <Dialog open={!!modal} onOpenChange={o => !o && setModal(null)}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto"><div className="sticky top-0 z-10 -mx-6 border-b bg-background px-6 pb-3 pt-1"><DialogHeader><DialogTitle>{modal === "new" ? "Neues Audit" : "Audit bearbeiten"}</DialogTitle></DialogHeader></div>
          {modal && <AuditForm initial={modal === "new" ? {} : modal} onSave={save} onCancel={() => setModal(null)} />}
        </DialogContent>
      </Dialog>
      <ConfirmDialog open={delId !== null} title="Audit löschen?" desc="Dieser Vorgang kann nicht rückgängig gemacht werden."
        onConfirm={() => { remove.mutate(delId!); setDelId(null); }} onCancel={() => setDelId(null)} />
    </MandantGuard>
  );
}

// ─── AUFGABEN PAGE ─────────────────────────────────────────────────────────
function AufgabeForm({ initial, onSave, onCancel }: any) {
  const { data: pdca = [] } = useModuleData("pdca");
  const linkedPdca = pdca.find((item: any) => Number(item.id) === Number(initial?.referenzId));
  const [form, setForm] = useState({ titel: "", beschreibung: "", typ: "task", prioritaet: "mittel", status: "offen", fortschritt: 0, verantwortlicher: "", startDatum: "", faelligAm: "", abgeschlossenAm: "", kategorie: "sonstige", ...initial });
  const set = (k: string, v: any) => setForm((p: any) => ({ ...p, [k]: v }));
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="col-span-2 space-y-1"><Label className="text-xs">Titel *</Label><Input value={form.titel} onChange={e => set("titel", e.target.value)} className="h-8 text-sm" /></div>
        <div className="space-y-1"><Label className="text-xs">Typ</Label>
          <Select value={form.typ} onValueChange={v => set("typ", v)}>
            <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="todo">Todo</SelectItem><SelectItem value="task">Task</SelectItem><SelectItem value="milestone">Milestone</SelectItem><SelectItem value="kontrolle">Kontrolle</SelectItem><SelectItem value="review">Review</SelectItem></SelectContent>
          </Select>
        </div>
        <div className="space-y-1"><Label className="text-xs">Priorität</Label>
          <Select value={form.prioritaet} onValueChange={v => set("prioritaet", v)}>
            <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="niedrig">Niedrig</SelectItem><SelectItem value="mittel">Mittel</SelectItem><SelectItem value="hoch">Hoch</SelectItem><SelectItem value="kritisch">Kritisch</SelectItem></SelectContent>
          </Select>
        </div>
        <div className="space-y-1"><Label className="text-xs">Status</Label>
          <Select value={form.status} onValueChange={v => set("status", v)}>
            <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="offen">Offen</SelectItem><SelectItem value="in_bearbeitung">In Bearbeitung</SelectItem><SelectItem value="erledigt">Erledigt</SelectItem></SelectContent>
          </Select>
        </div>
        <div className="space-y-1"><Label className="text-xs">Fortschritt (%)</Label><Input type="number" min="0" max="100" value={form.fortschritt} onChange={e => set("fortschritt", Number(e.target.value))} className="h-8 text-sm" /></div>
        <div className="space-y-1"><Label className="text-xs">Verantwortlicher</Label><Input value={form.verantwortlicher} onChange={e => set("verantwortlicher", e.target.value)} className="h-8 text-sm" /></div>
        <div className="space-y-1"><Label className="text-xs">Startdatum</Label><Input type="date" value={form.startDatum} onChange={e => set("startDatum", e.target.value)} className="h-8 text-sm" /></div>
        <div className="space-y-1"><Label className="text-xs">Fällig am</Label><Input type="date" value={form.faelligAm} onChange={e => set("faelligAm", e.target.value)} className="h-8 text-sm" /></div>
        <div className="space-y-1"><Label className="text-xs">Abgeschlossen am</Label><Input type="date" value={form.abgeschlossenAm} onChange={e => set("abgeschlossenAm", e.target.value)} className="h-8 text-sm" /></div>
        <div className="space-y-1"><Label className="text-xs">Kategorie</Label>
          <Select value={form.kategorie} onValueChange={v => set("kategorie", v)}>
            <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="vvt">VVT</SelectItem><SelectItem value="avv">AVV</SelectItem><SelectItem value="dsfa">DSFA</SelectItem><SelectItem value="datenpanne">Datenpanne</SelectItem><SelectItem value="dsr">DSR</SelectItem><SelectItem value="tom">TOM</SelectItem><SelectItem value="audit">Audit</SelectItem><SelectItem value="sonstige">Sonstige</SelectItem></SelectContent>
          </Select>
        </div>
        {linkedPdca && <div className="col-span-2 rounded-lg border p-3 text-xs"><p className="font-medium mb-1">Verknüpfter PDCA-Zyklus</p><p className="text-muted-foreground whitespace-pre-wrap">{linkedPdca.titel}\nStatus: {linkedPdca.status || "—"}\nFortschritt: {linkedPdca.doFortschritt ?? 0}%</p></div>}
        <div className="col-span-2 space-y-1"><Label className="text-xs">Beschreibung</Label><Textarea value={form.beschreibung} onChange={e => set("beschreibung", e.target.value)} className="text-sm min-h-12" /></div>
      </div>
      <div className="sticky bottom-0 z-10 -mx-6 mt-4 border-t bg-background px-6 pt-3 pb-1">
        <DialogFooter>
          <Button variant="outline" size="sm" onClick={onCancel}>Abbrechen</Button>
          <Button size="sm" className="bg-primary" onClick={() => onSave(form)} disabled={!form.titel}>Speichern</Button>
        </DialogFooter>
      </div>
    </div>
  );
}

function PdcaForm({ initial, onSave, onCancel }: any) {
  const { data: audits = [] } = useModuleData("audits");
  const [form, setForm] = useState({
    titel: "",
    beschreibung: "",
    zyklusTyp: "verbesserungsmassnahme",
    zeitraumVon: "",
    zeitraumBis: "",
    status: "geplant",
    prioritaet: "mittel",
    verantwortlicher: "",
    naechstePruefungAm: "",
    planZiele: "",
    planAnforderungen: "",
    planRisiken: "",
    planMassnahmen: "",
    planKennzahlen: "",
    doUmsetzung: "",
    doFortschritt: 0,
    doNachweise: "",
    doBeteiligte: "",
    doAbweichungen: "",
    checkPruefungen: "",
    checkErgebnisse: "",
    checkKennzahlen: "",
    checkSollIst: "",
    checkFeststellungen: "",
    actKorrekturen: "",
    actVerbesserungen: "",
    actEntscheidungen: "",
    actFolgemassnahmen: "",
    verknuepftesAuditId: "none",
    actNaechsterZyklus: "",
    tags: "[]",
    createFollowUpTask: false,
    ...initial,
  });
  const set = (k: string, v: any) => setForm((p: any) => ({ ...p, [k]: v }));
  const selectedAudit = audits.find((auditEntry: any) => auditEntry.id === form?.verknuepftesAuditId);
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="col-span-2 space-y-1"><Label className="text-xs">Titel *</Label><Input value={form.titel} onChange={e => set("titel", e.target.value)} className="h-8 text-sm" /></div>
        <div className="col-span-2 space-y-1"><Label className="text-xs">Kurzbeschreibung</Label><Textarea value={form.beschreibung || ""} onChange={e => set("beschreibung", e.target.value)} className="text-sm min-h-16" /></div>
        <div className="space-y-1"><Label className="text-xs">Zyklustyp</Label><Select value={form.zyklusTyp || "verbesserungsmassnahme"} onValueChange={v => set("zyklusTyp", v)}><SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="verbesserungsmassnahme">Verbesserungsmaßnahme</SelectItem><SelectItem value="audit_follow_up">Audit-Follow-up</SelectItem><SelectItem value="kontrollzyklus">Kontrollzyklus</SelectItem><SelectItem value="management_review">Management-Review</SelectItem></SelectContent></Select></div>
        <div className="space-y-1"><Label className="text-xs">Status</Label><Select value={form.status || "geplant"} onValueChange={v => set("status", v)}><SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="geplant">Geplant</SelectItem><SelectItem value="in_bearbeitung">In Bearbeitung</SelectItem><SelectItem value="überprüfung">In Überprüfung</SelectItem><SelectItem value="abgeschlossen">Abgeschlossen</SelectItem></SelectContent></Select></div>
        <div className="space-y-1"><Label className="text-xs">Priorität</Label><Select value={form.prioritaet || "mittel"} onValueChange={v => set("prioritaet", v)}><SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="niedrig">Niedrig</SelectItem><SelectItem value="mittel">Mittel</SelectItem><SelectItem value="hoch">Hoch</SelectItem><SelectItem value="kritisch">Kritisch</SelectItem></SelectContent></Select></div>
        <div className="space-y-1"><Label className="text-xs">Verantwortlicher</Label><Input value={form.verantwortlicher || ""} onChange={e => set("verantwortlicher", e.target.value)} className="h-8 text-sm" /></div>
        <div className="space-y-1"><Label className="text-xs">Zeitraum von</Label><Input type="date" value={form.zeitraumVon || ""} onChange={e => set("zeitraumVon", e.target.value)} className="h-8 text-sm" /></div>
        <div className="space-y-1"><Label className="text-xs">Zeitraum bis</Label><Input type="date" value={form.zeitraumBis || ""} onChange={e => set("zeitraumBis", e.target.value)} className="h-8 text-sm" /></div>
        <div className="space-y-1"><Label className="text-xs">Nächste Prüfung</Label><Input type="date" value={form.naechstePruefungAm || ""} onChange={e => set("naechstePruefungAm", e.target.value)} className="h-8 text-sm" /></div>
        <div className="space-y-1"><Label className="text-xs">Fortschritt (%)</Label><Input type="number" min="0" max="100" value={form.doFortschritt ?? 0} onChange={e => set("doFortschritt", Number(e.target.value))} className="h-8 text-sm" /></div>
        <div className="space-y-1"><Label className="text-xs">Verknüpftes Audit</Label><Select value={String(form.verknuepftesAuditId ?? "none")} onValueChange={v => set("verknuepftesAuditId", v === "none" ? null : Number(v))}><SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="none">Kein Audit verknüpft</SelectItem>{audits.map((item: any) => <SelectItem key={item.id} value={String(item.id)}>#{item.id} {item.titel}</SelectItem>)}</SelectContent></Select></div>
        <div className="space-y-1 rounded-lg border p-3 text-xs"><p className="font-medium mb-1">Audit-Bezug</p><p className="text-muted-foreground whitespace-pre-wrap">{selectedAudit ? `${selectedAudit.titel}\n${selectedAudit.pruefbereich || "Allgemeiner Prüfbereich"}\nStatus: ${selectedAudit.status || "—"}` : form.zyklusTyp === "audit_follow_up" ? "Für Audit-Follow-up sollte ein Audit verknüpft werden." : "Kein Audit zugeordnet."}</p></div>
        <label className="flex items-center gap-2 rounded-lg border p-3 cursor-pointer hover:bg-secondary/30 text-xs"><input type="checkbox" checked={!!form.createFollowUpTask} onChange={e => set("createFollowUpTask", e.target.checked)} /><span>Beim Speichern automatisch Folgeaufgabe anlegen</span></label>
        {form.zyklusTyp === "audit_follow_up" && !form.verknuepftesAuditId && (
          <div className="col-span-2 rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-xs text-amber-200">
            Hinweis: Ein Audit-Follow-up ohne verknüpftes Audit erschwert die Nachverfolgung im Workflow und Export.
          </div>
        )}
        <div className="col-span-2 space-y-1"><Label className="text-xs">Tags (JSON-Array oder Freitext)</Label><Input value={form.tags || ""} onChange={e => set("tags", e.target.value)} className="h-8 text-sm" placeholder='z. B. ["DSMS","Review"]' /></div>
        <div className="col-span-2 grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="space-y-1"><Label className="text-xs">PLAN – Ziele</Label><Textarea value={form.planZiele || ""} onChange={e => set("planZiele", e.target.value)} className="text-sm min-h-20" /></div>
          <div className="space-y-1"><Label className="text-xs">PLAN – Anforderungen</Label><Textarea value={form.planAnforderungen || ""} onChange={e => set("planAnforderungen", e.target.value)} className="text-sm min-h-20" /></div>
          <div className="space-y-1"><Label className="text-xs">PLAN – Risiken</Label><Textarea value={form.planRisiken || ""} onChange={e => set("planRisiken", e.target.value)} className="text-sm min-h-20" /></div>
          <div className="space-y-1"><Label className="text-xs">PLAN – Maßnahmen & Kennzahlen</Label><Textarea value={`${form.planMassnahmen || ""}${form.planKennzahlen ? `\n\nKennzahlen:\n${form.planKennzahlen}` : ""}`} onChange={e => {
            const raw = e.target.value;
            const parts = raw.split("\n\nKennzahlen:\n");
            set("planMassnahmen", parts[0] || "");
            set("planKennzahlen", parts[1] || "");
          }} className="text-sm min-h-20" /></div>
          <div className="space-y-1"><Label className="text-xs">DO – Umsetzung</Label><Textarea value={form.doUmsetzung || ""} onChange={e => set("doUmsetzung", e.target.value)} className="text-sm min-h-20" /></div>
          <div className="space-y-1"><Label className="text-xs">DO – Nachweise / Beteiligte / Abweichungen</Label><Textarea value={`${form.doNachweise || ""}${form.doBeteiligte ? `\n\nBeteiligte:\n${form.doBeteiligte}` : ""}${form.doAbweichungen ? `\n\nAbweichungen:\n${form.doAbweichungen}` : ""}`} onChange={e => {
            const raw = e.target.value;
            const beteiligteSplit = raw.split("\n\nBeteiligte:\n");
            const nachweise = beteiligteSplit[0] || "";
            const rest = beteiligteSplit[1] || "";
            const abwSplit = rest.split("\n\nAbweichungen:\n");
            set("doNachweise", nachweise);
            set("doBeteiligte", abwSplit[0] || "");
            set("doAbweichungen", abwSplit[1] || "");
          }} className="text-sm min-h-20" /></div>
          <div className="space-y-1"><Label className="text-xs">CHECK – Prüfungen / Ergebnisse</Label><Textarea value={`${form.checkPruefungen || ""}${form.checkErgebnisse ? `\n\nErgebnisse:\n${form.checkErgebnisse}` : ""}`} onChange={e => {
            const raw = e.target.value;
            const parts = raw.split("\n\nErgebnisse:\n");
            set("checkPruefungen", parts[0] || "");
            set("checkErgebnisse", parts[1] || "");
          }} className="text-sm min-h-20" /></div>
          <div className="space-y-1"><Label className="text-xs">CHECK – Kennzahlen / Soll-Ist / Feststellungen</Label><Textarea value={`${form.checkKennzahlen || ""}${form.checkSollIst ? `\n\nSoll-Ist:\n${form.checkSollIst}` : ""}${form.checkFeststellungen ? `\n\nFeststellungen:\n${form.checkFeststellungen}` : ""}`} onChange={e => {
            const raw = e.target.value;
            const sollSplit = raw.split("\n\nSoll-Ist:\n");
            const kennzahlen = sollSplit[0] || "";
            const festSplit = (sollSplit[1] || "").split("\n\nFeststellungen:\n");
            set("checkKennzahlen", kennzahlen);
            set("checkSollIst", festSplit[0] || "");
            set("checkFeststellungen", festSplit[1] || "");
          }} className="text-sm min-h-20" /></div>
          <div className="space-y-1"><Label className="text-xs">ACT – Korrekturen / Verbesserungen</Label><Textarea value={`${form.actKorrekturen || ""}${form.actVerbesserungen ? `\n\nVerbesserungen:\n${form.actVerbesserungen}` : ""}`} onChange={e => {
            const raw = e.target.value;
            const parts = raw.split("\n\nVerbesserungen:\n");
            set("actKorrekturen", parts[0] || "");
            set("actVerbesserungen", parts[1] || "");
          }} className="text-sm min-h-20" /></div>
          <div className="space-y-1"><Label className="text-xs">ACT – Entscheidungen / Folgemaßnahmen / Nächster Zyklus</Label><Textarea value={`${form.actEntscheidungen || ""}${form.actFolgemassnahmen ? `\n\nFolgemaßnahmen:\n${form.actFolgemassnahmen}` : ""}${form.actNaechsterZyklus ? `\n\nNächster Zyklus:\n${form.actNaechsterZyklus}` : ""}`} onChange={e => {
            const raw = e.target.value;
            const folgeSplit = raw.split("\n\nFolgemaßnahmen:\n");
            const entscheidungen = folgeSplit[0] || "";
            const nextSplit = (folgeSplit[1] || "").split("\n\nNächster Zyklus:\n");
            set("actEntscheidungen", entscheidungen);
            set("actFolgemassnahmen", nextSplit[0] || "");
            set("actNaechsterZyklus", nextSplit[1] || "");
          }} className="text-sm min-h-20" /></div>
        </div>
      </div>
      <div className="sticky bottom-0 z-10 -mx-6 mt-4 border-t bg-background px-6 pt-3 pb-1">
        <DialogFooter>
          <Button variant="outline" size="sm" onClick={onCancel}>Abbrechen</Button>
          <Button size="sm" className="bg-primary" onClick={() => onSave(form)} disabled={!form.titel}>Speichern</Button>
        </DialogFooter>
      </div>
    </div>
  );
}

function PdcaPage() {
  const [location, setLocation] = useLocation();
  const { data, isLoading, create, update, remove } = useModuleData("pdca");
  const { data: audits = [] } = useModuleData("audits");
  const { data: aufgaben = [] } = useModuleData("aufgaben");
  const [modal, setModal] = useState<null | "new" | any>(null);
  const [delId, setDelId] = useState<number | null>(null);
  const [filter, setFilter] = useState("alle");
  const { toast } = useToast();
  const todayIso = new Date().toISOString().split("T")[0];
  const pdcaAufgaben = aufgaben.filter((item: any) => String(item.vorlagenBezug || "") === "pdca_follow_up");
  const pdcaAufgabenOffen = pdcaAufgaben.filter((item: any) => item.status !== "erledigt");
  const getPdcaMeta = (item: any) => {
    const reviewDate = String(item?.naechstePruefungAm || "").trim();
    const reviewDue = !!reviewDate && reviewDate <= todayIso && String(item?.status || "") !== "abgeschlossen";
    const reviewMissing = !reviewDate && String(item?.status || "") !== "abgeschlossen";
    const auditFollowUpWithoutAudit = String(item?.zyklusTyp || "") === "audit_follow_up" && !item?.verknuepftesAuditId;
    const highPriority = ["hoch", "kritisch"].includes(String(item?.prioritaet || "").toLowerCase()) && String(item?.status || "") !== "abgeschlossen";
    const linkedTasks = pdcaAufgaben.filter((task: any) => Number(task.referenzId) === Number(item.id));
    const offeneLinkedTasks = linkedTasks.filter((task: any) => task.status !== "erledigt");
    const inProgressNoTask = String(item?.status || "") === "in_bearbeitung" && offeneLinkedTasks.length === 0;
    return { reviewDate, reviewDue, reviewMissing, auditFollowUpWithoutAudit, highPriority, linkedTasks, offeneLinkedTasks, inProgressNoTask };
  };
  useEffect(() => {
    const route = new URL(location, "https://privashield.local");
    const rawFilter = route.searchParams.get("filter");
    if (rawFilter === "review" || rawFilter === "review-missing") setFilter("überprüfung");
    else if (rawFilter === "in-progress-no-task") setFilter("in_bearbeitung");
    else setFilter("alle");
  }, [location]);
  const save = async (form: any) => {
    try {
      const pdcaItem = modal === "new" ? await create.mutateAsync(form) : await update.mutateAsync({ id: modal.id, ...form });
      if (form.createFollowUpTask && modal === "new" && pdcaItem?.mandantId) {
        await apiRequest("POST", `/api/mandanten/${pdcaItem.mandantId}/aufgaben`, {
          titel: `PDCA-Folgemaßnahme: ${pdcaItem.titel}`,
          beschreibung: [
            form.actFolgemassnahmen ? `Folgemaßnahmen:\n${form.actFolgemassnahmen}` : "",
            form.checkFeststellungen ? `Feststellungen:\n${form.checkFeststellungen}` : "",
            form.verknuepftesAuditId ? `Verknüpftes Audit: #${form.verknuepftesAuditId}` : "",
          ].filter(Boolean).join("\n\n"),
          typ: "task",
          prioritaet: form.prioritaet || "mittel",
          status: "offen",
          fortschritt: 0,
          verantwortlicher: form.verantwortlicher || "",
          faelligAm: form.naechstePruefungAm || null,
          kategorie: form.verknuepftesAuditId ? "audit" : "sonstige",
          referenzId: pdcaItem.id,
          vorlagenBezug: "pdca_follow_up",
        });
      }
      setModal(null);
      toast({ title: "Gespeichert" });
    } catch {
      toast({ title: "Fehler", variant: "destructive" });
    }
  };
  const rawPdcaFilter = new URL(location, "https://privashield.local").searchParams.get("filter");
  const filtered = data.filter((item: any) => {
    const meta = getPdcaMeta(item);
    if (rawPdcaFilter === "review" && !meta.reviewDue) return false;
    if (rawPdcaFilter === "review-missing" && !meta.reviewMissing) return false;
    if (rawPdcaFilter === "audit-follow-up-ohne-audit" && !meta.auditFollowUpWithoutAudit) return false;
    if (rawPdcaFilter === "priority-high" && !meta.highPriority) return false;
    if (rawPdcaFilter === "in-progress-no-task" && !meta.inProgressNoTask) return false;
    return filter === "alle" ? true : item.status === filter;
  }).slice().sort((a: any, b: any) => {
    const metaA = getPdcaMeta(a);
    const metaB = getPdcaMeta(b);
    const aReview = metaA.reviewDate || "9999-12-31";
    const bReview = metaB.reviewDate || "9999-12-31";
    const aOpenTasks = metaA.offeneLinkedTasks.length;
    const bOpenTasks = metaB.offeneLinkedTasks.length;
    const aScore = (metaA.auditFollowUpWithoutAudit ? 120 : 0) + (metaA.highPriority ? 70 : 0) + (metaA.inProgressNoTask ? 65 : 0) + (metaA.reviewMissing ? 55 : 0) + (aReview < todayIso ? 80 : aReview === todayIso ? 50 : 0) + Math.min(40, aOpenTasks * 10) + (a.status === "in_bearbeitung" ? 15 : 0);
    const bScore = (metaB.auditFollowUpWithoutAudit ? 120 : 0) + (metaB.highPriority ? 70 : 0) + (metaB.inProgressNoTask ? 65 : 0) + (metaB.reviewMissing ? 55 : 0) + (bReview < todayIso ? 80 : bReview === todayIso ? 50 : 0) + Math.min(40, bOpenTasks * 10) + (b.status === "in_bearbeitung" ? 15 : 0);
    if (rawPdcaFilter) return bScore - aScore || aReview.localeCompare(bReview) || String(a.titel || "").localeCompare(String(b.titel || ""), "de");
    return String(a.titel || "").localeCompare(String(b.titel || ""), "de");
  });
  const offene = data.filter((item: any) => item.status !== "abgeschlossen");
  const reviewFaellig = data.filter((item: any) => getPdcaMeta(item).reviewDue);
  const reviewUeberfaellig = data.filter((item: any) => {
    const reviewDate = getPdcaMeta(item).reviewDate;
    return !!reviewDate && reviewDate < todayIso && item.status !== "abgeschlossen";
  });
  const mitAuditBezug = data.filter((item: any) => !!item.verknuepftesAuditId);
  const ohneAuditBezug = data.filter((item: any) => !item.verknuepftesAuditId);
  const auditFollowUpOhneAudit = data.filter((item: any) => getPdcaMeta(item).auditFollowUpWithoutAudit);
  const pdcaHighPriority = data.filter((item: any) => getPdcaMeta(item).highPriority);
  const pdcaReviewMissing = data.filter((item: any) => getPdcaMeta(item).reviewMissing);
  const pdcaInProgressWithoutTask = data.filter((item: any) => getPdcaMeta(item).inProgressNoTask);
  const pdcaFilterHint = rawPdcaFilter === "review"
    ? "Du siehst gerade: PDCA-Zyklen mit fälligem oder überfälligem Review."
    : rawPdcaFilter === "review-missing"
      ? "Du siehst gerade: offene PDCA-Zyklen ohne nächsten Prüftermin."
      : rawPdcaFilter === "audit-follow-up-ohne-audit"
        ? "Du siehst gerade: Audit-Follow-ups ohne Audit-Bezug."
        : rawPdcaFilter === "priority-high"
          ? "Du siehst gerade: offene PDCA-Zyklen mit hoher oder kritischer Priorität."
          : rawPdcaFilter === "in-progress-no-task"
            ? "Du siehst gerade: laufende PDCA-Zyklen ohne offene Folgeaufgabe."
            : "";
  return (
    <MandantGuard>
      <PageHeader title="PDCA / Verbesserungszyklus" desc="Plan-Do-Check-Act-Maßnahmen, Review-Zyklen und kontinuierliche Verbesserung strukturiert steuern"
        action={<Button size="sm" className="bg-primary h-8 text-xs gap-1.5" onClick={() => setModal("new")}><Plus className="h-3.5 w-3.5" />Neuer PDCA-Zyklus</Button>} />
      {pdcaFilterHint && <Card className="mb-4 border-primary/30 bg-primary/5"><CardContent className="py-3 px-4 flex flex-col gap-2 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between"><span>{pdcaFilterHint} <span className="font-medium text-foreground">({filtered.length})</span></span><div className="flex flex-wrap gap-2"><Button type="button" size="sm" variant="outline" onClick={() => {
        const next = new URL(location, "https://privashield.local");
        next.searchParams.delete("filter");
        setLocation(`${next.pathname}${next.search}`);
        setFilter("alle");
      }}>Filter zurücksetzen</Button><Link href="/aufgaben?filter=pdca-follow-up-offen"><a className="text-xs text-primary hover:underline self-center">Zu Aufgaben</a></Link></div></CardContent></Card>}
      {(rawPdcaFilter === "review" || rawPdcaFilter === "review-missing" || rawPdcaFilter === "priority-high" || rawPdcaFilter === "in-progress-no-task") && (
        <Card className="mb-4 border-border/60 bg-muted/20">
          <CardContent className="py-3 px-4 grid grid-cols-1 gap-3 text-sm md:grid-cols-4">
            <div><p className="text-xs text-muted-foreground">Review fällig</p><p className="font-semibold">{reviewFaellig.length}</p></div>
            <div><p className="text-xs text-muted-foreground">Ohne Prüftermin</p><p className="font-semibold">{pdcaReviewMissing.length}</p></div>
            <div><p className="text-xs text-muted-foreground">Hohe Priorität offen</p><p className="font-semibold">{pdcaHighPriority.length}</p></div>
            <div><p className="text-xs text-muted-foreground">Laufend ohne Folgeaufgabe</p><p className="font-semibold">{pdcaInProgressWithoutTask.length}</p></div>
          </CardContent>
        </Card>
      )}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-3 mb-4">
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Zyklen gesamt</p><p className="text-2xl font-bold">{data.length}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Offen / laufend</p><p className="text-2xl font-bold">{offene.length}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Review fällig</p><p className="text-2xl font-bold">{reviewFaellig.length}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Mit Audit-Bezug</p><p className="text-2xl font-bold">{mitAuditBezug.length}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Ø Fortschritt</p><p className="text-2xl font-bold">{data.length ? Math.round(data.reduce((sum: number, item: any) => sum + Number(item.doFortschritt || 0), 0) / data.length) : 0}%</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">PDCA-Folgemaßnahmen</p><p className="text-2xl font-bold">{pdcaAufgaben.length}</p></CardContent></Card>
      </div>
      <Card className="mb-4">
        <CardHeader>
          <CardTitle className="text-sm">PDCA-zu-Audit-Verzahnung</CardTitle>
          <CardDescription>Transparenz über auditbezogene und freie Verbesserungszyklen</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
          <div><p className="text-xs text-muted-foreground">PDCA mit Audit-Bezug</p><p className="text-2xl font-bold">{mitAuditBezug.length}</p></div>
          <div><p className="text-xs text-muted-foreground">PDCA ohne Audit-Bezug</p><p className="text-2xl font-bold">{ohneAuditBezug.length}</p></div>
          <div><p className="text-xs text-muted-foreground">Verknüpfte Audits</p><p className="text-2xl font-bold">{new Set(mitAuditBezug.map((item: any) => item.verknuepftesAuditId)).size}</p></div>
        </CardContent>
      </Card>
      {(auditFollowUpOhneAudit.length > 0 || reviewFaellig.length > 0 || pdcaAufgabenOffen.length > 0 || pdcaReviewMissing.length > 0 || pdcaHighPriority.length > 0 || pdcaInProgressWithoutTask.length > 0) && (
        <Card className="mb-4 border-amber-500/40 bg-amber-500/5">
          <CardHeader>
            <CardTitle className="text-sm">Hinweise mit Prüfbedarf</CardTitle>
            <CardDescription>Diese Punkte sind aktuell für die Steuerung am wichtigsten.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            {auditFollowUpOhneAudit.length > 0 && <p>• {auditFollowUpOhneAudit.length} Audit-Follow-up(s) ohne verknüpftes Audit.</p>}
            {reviewFaellig.length > 0 && <p>• {reviewFaellig.length} PDCA-Review(s) sind fällig oder überfällig.</p>}
            {pdcaReviewMissing.length > 0 && <p>• {pdcaReviewMissing.length} offene PDCA-Zyklen haben noch keinen nächsten Prüftermin.</p>}
            {pdcaHighPriority.length > 0 && <p>• {pdcaHighPriority.length} offene PDCA-Zyklen laufen mit hoher oder kritischer Priorität.</p>}
            {pdcaInProgressWithoutTask.length > 0 && <p>• {pdcaInProgressWithoutTask.length} laufende PDCA-Zyklen haben keine offene Folgeaufgabe.</p>}
            {pdcaAufgabenOffen.length > 0 && <p>• {pdcaAufgabenOffen.length} offene PDCA-Folgeaufgabe(n) warten auf Bearbeitung.</p>}
          </CardContent>
        </Card>
      )}
      <div className="flex gap-2 mb-4 flex-wrap">
        {[
          ["alle", "Alle"],
          ["geplant", "Geplant"],
          ["in_bearbeitung", "In Bearbeitung"],
          ["überprüfung", "In Überprüfung"],
          ["abgeschlossen", "Abgeschlossen"],
        ].map(([key, label]) => (
          <button key={key} onClick={() => setFilter(key)} className={`px-3 py-1 rounded-full text-xs transition-colors ${filter === key ? "bg-primary text-white" : "bg-secondary text-muted-foreground hover:text-foreground"}`}>{label}</button>
        ))}
      </div>
      {isLoading ? <Skeleton className="h-32 w-full" /> : (
        <div className="space-y-3">
          {filtered.length === 0 && <Card className="border-dashed"><CardContent className="py-12 text-center text-sm text-muted-foreground space-y-3">{pdcaFilterHint || "Keine PDCA-Zyklen in dieser Ansicht."}{pdcaFilterHint ? " Aktuell gibt es dafür keine Treffer." : ""}<div><Button type="button" size="sm" onClick={() => setModal("new")}>Neuen PDCA-Zyklus anlegen</Button></div></CardContent></Card>}
          {filtered.map((item: any) => {
            const meta = getPdcaMeta(item);
            const linkedTasks = meta.linkedTasks;
            const offeneLinkedTasks = meta.offeneLinkedTasks;
            const reviewDue = meta.reviewDue;
            const progress = Math.max(0, Math.min(100, Number(item.doFortschritt || 0)));
            return (
            <Card key={item.id} className="group hover:border-border/80 transition-colors">
              <CardContent className="p-4 space-y-3">
                <div className="flex flex-col items-start justify-between gap-3 sm:flex-row">
                  <div>
                    <p className="text-sm font-semibold">{item.titel}</p>
                    <p className="text-xs text-muted-foreground">{item.zyklusTyp || "verbesserungsmassnahme"} · {item.verantwortlicher || "—"}{item.zeitraumVon || item.zeitraumBis ? ` · ${item.zeitraumVon || "?"} bis ${item.zeitraumBis || "?"}` : ""}{item.naechstePruefungAm ? ` · nächste Prüfung ${item.naechstePruefungAm}` : ""}</p>
                    {rawPdcaFilter && <p className="text-xs text-muted-foreground">Arbeitszustand: {meta.auditFollowUpWithoutAudit ? "heute erledigen" : meta.highPriority ? "priorisiert" : meta.inProgressNoTask ? "blockiert" : meta.reviewMissing ? "Termin festlegen" : reviewDue ? "in Bearbeitung" : offeneLinkedTasks.length > 0 ? "neu" : "beobachten"}</p>}
                  </div>
                  <div className="flex w-full items-center justify-between gap-2 shrink-0 sm:w-auto sm:justify-end">
                    <StatusBadge value={item.prioritaet} />
                    <StatusBadge value={item.status} />
                    <button onClick={() => setModal(item)} className="p-1 rounded text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-all"><Pencil className="h-3.5 w-3.5" /></button>
                    <button onClick={() => setDelId(item.id)} className="p-1 rounded text-muted-foreground hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"><Trash2 className="h-3.5 w-3.5" /></button>
                  </div>
                </div>
                {item.beschreibung && <p className="text-sm text-muted-foreground whitespace-pre-wrap">{item.beschreibung}</p>}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                    <span>Fortschritt</span>
                    <span>{progress}%</span>
                  </div>
                  <div className="h-2 w-full rounded bg-secondary overflow-hidden">
                    <div className="h-full bg-primary transition-all" style={{ width: `${progress}%` }} />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-3 text-xs">
                  <div className="rounded-lg border p-3"><p className="font-medium mb-1">PLAN</p><p className="text-muted-foreground whitespace-pre-wrap">{item.planZiele || item.planMassnahmen || item.planRisiken || "—"}</p></div>
                  <div className="rounded-lg border p-3"><p className="font-medium mb-1">DO</p><p className="text-muted-foreground whitespace-pre-wrap">{item.doUmsetzung || item.doNachweise || item.doAbweichungen || "—"}</p></div>
                  <div className="rounded-lg border p-3"><p className="font-medium mb-1">CHECK</p><p className="text-muted-foreground whitespace-pre-wrap">{item.checkErgebnisse || item.checkFeststellungen || item.checkSollIst || "—"}</p></div>
                  <div className="rounded-lg border p-3"><p className="font-medium mb-1">ACT</p><p className="text-muted-foreground whitespace-pre-wrap">{item.actKorrekturen || item.actVerbesserungen || item.actFolgemassnahmen || "—"}</p></div>
                  <div className="rounded-lg border p-3"><p className="font-medium mb-1">Workflow</p><p className="text-muted-foreground whitespace-pre-wrap">{(() => { const auditRef = audits.find((audit: any) => Number(audit.id) === Number(item.verknuepftesAuditId)); const auditLabel = auditRef ? `Audit #${auditRef.id}: ${auditRef.titel}` : item.verknuepftesAuditId ? `Audit #${item.verknuepftesAuditId}` : "Ohne Audit-Bezug"; return `${auditLabel}${linkedTasks.length ? `\n${linkedTasks.length} verknüpfte Aufgabe(n)` : "\nKeine verknüpfte Aufgabe"}`; })()}</p><p className="mt-2 text-[11px] text-muted-foreground">{reviewDue ? "Review fällig" : item.naechstePruefungAm ? `Nächste Prüfung: ${item.naechstePruefungAm}` : "Kein Review-Datum gesetzt"}{offeneLinkedTasks.length ? ` · ${offeneLinkedTasks.length} Aufgabe(n) offen` : ""}</p></div>
                </div>
                {(reviewDue || meta.auditFollowUpWithoutAudit || meta.reviewMissing || meta.inProgressNoTask || meta.highPriority) && (
                  <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-xs text-amber-200">
                    {meta.auditFollowUpWithoutAudit ? "Audit-Follow-up ohne Audit-Bezug: bitte verknüpftes Audit ergänzen." : meta.inProgressNoTask ? "Dieser laufende PDCA-Zyklus hat aktuell keine offene Folgeaufgabe und sollte operativ nachgesteuert werden." : meta.reviewMissing ? "Für diesen offenen PDCA-Zyklus fehlt ein nächster Prüftermin." : reviewDue ? "Dieser PDCA-Zyklus sollte zeitnah geprüft oder aktualisiert werden." : "Dieser PDCA-Zyklus ist hoch priorisiert und sollte eng gesteuert werden."}
                  </div>
                )}
              </CardContent>
            </Card>
          );})}
        </div>
      )}
      <Dialog open={!!modal} onOpenChange={o => !o && setModal(null)}>
        <DialogContent className="max-w-5xl max-h-[85vh] overflow-y-auto"><div className="sticky top-0 z-10 -mx-6 border-b bg-background px-6 pb-3 pt-1"><DialogHeader><DialogTitle>{modal === "new" ? "Neuer PDCA-Zyklus" : "PDCA-Zyklus bearbeiten"}</DialogTitle></DialogHeader></div>
          {modal && <PdcaForm initial={modal === "new" ? {} : modal} onSave={save} onCancel={() => setModal(null)} />}
        </DialogContent>
      </Dialog>
      <ConfirmDialog open={delId !== null} title="PDCA-Zyklus löschen?" desc="Dieser Vorgang kann nicht rückgängig gemacht werden."
        onConfirm={() => { remove.mutate(delId!); setDelId(null); }} onCancel={() => setDelId(null)} />
    </MandantGuard>
  );
}

function AufgabenPage() {
  const { t } = useI18n();
  const [location, setLocation] = useLocation();
  const { activeMandantId } = useMandant();
  const qc = useQueryClient();
  const { data, isLoading, create, update, remove } = useModuleData("aufgaben");
  const { data: pdca = [] } = useModuleData("pdca");
  const [modal, setModal] = useState<null | "new" | any>(null);
  const [delId, setDelId] = useState<number | null>(null);
  const [filter, setFilter] = useState("alle");
  const [typFilter, setTypFilter] = useState("alle");
  const { toast } = useToast();
  useEffect(() => {
    const route = new URL(location, "https://privashield.local");
    const rawFilter = route.searchParams.get("filter");
    if (rawFilter === "copilot-open" || rawFilter === "kritisch" || rawFilter === "pdca-follow-up-offen" || rawFilter === "kritisch-ohne-faelligkeit" || rawFilter === "pdca-follow-up-ueberfaellig") {
      setFilter("offen");
      setTypFilter("alle");
    }
  }, [location]);
  const syncPdcaFromTask = async (task: any) => {
    if (!task?.referenzId) return;
    const linkedTaskList = data.filter((entry: any) => Number(entry.referenzId) === Number(task.referenzId) || Number(entry.id) === Number(task.id));
    const relatedTasks = linkedTaskList.map((entry: any) => Number(entry.id) === Number(task.id) ? { ...entry, ...task } : entry);
    const targetPdca = pdca.find((entry: any) => Number(entry.id) === Number(task.referenzId));
    if (!targetPdca || !activeMandantId) return;
    const fortschritt = relatedTasks.length ? Math.round(relatedTasks.reduce((sum: number, entry: any) => sum + Number(entry.fortschritt || 0), 0) / relatedTasks.length) : Number(targetPdca.doFortschritt || 0);
    const offene = relatedTasks.filter((entry: any) => entry.status !== "erledigt");
    const nextStatus = relatedTasks.length === 0
      ? targetPdca.status
      : offene.length === 0
        ? "überprüfung"
        : offene.some((entry: any) => entry.status === "in_bearbeitung") || fortschritt > 0
          ? "in_bearbeitung"
          : "geplant";
    const summary = relatedTasks.map((entry: any) => `- ${entry.titel}: ${entry.status || "offen"} (${Number(entry.fortschritt || 0)}%)`).join("\n");
    const existingBlock = String(targetPdca.doNachweise || "").split("\n\nPDCA-Folgeaufgaben:\n")[0];
    await apiRequest("PUT", `/api/pdca/${targetPdca.id}`, {
      ...targetPdca,
      status: nextStatus,
      doFortschritt: fortschritt,
      doNachweise: `${existingBlock}${relatedTasks.length ? `\n\nPDCA-Folgeaufgaben:\n${summary}` : ""}`.trim(),
    });
    await qc.invalidateQueries({ queryKey: [`/api/mandanten/${activeMandantId}/pdca`] });
  };
  const save = async (form: any) => {
    try {
      const task = modal === "new" ? await create.mutateAsync(form) : await update.mutateAsync({ id: modal.id, ...form });
      await syncPdcaFromTask(task);
      setModal(null);
      toast({ title: "Gespeichert" });
    } catch {
      toast({ title: "Fehler", variant: "destructive" });
    }
  };
  const today = new Date().toISOString().split("T")[0];
  const rawTaskFilter = new URL(location, "https://privashield.local").searchParams.get("filter");
  useEffect(() => {
    const route = new URL(location, "https://privashield.local");
    const draftTitle = route.searchParams.get("draftTitle");
    if (!draftTitle || modal) return;
    setModal({
      titel: draftTitle,
      beschreibung: route.searchParams.get("draftDescription") || "",
      typ: "task",
      prioritaet: route.searchParams.get("draftPriority") || "mittel",
      status: "offen",
      fortschritt: 0,
      verantwortlicher: "",
      faelligAm: "",
      kategorie: "governance",
      referenzId: null,
      vorlagenBezug: "score_gap",
    });
    route.searchParams.delete("draftTitle");
    route.searchParams.delete("draftDescription");
    route.searchParams.delete("draftPriority");
    route.searchParams.delete("draftSource");
    setLocation(`${route.pathname}${route.search}`);
  }, [location, modal, setLocation]);
  const taskFilterHint = rawTaskFilter === "kritisch"
    ? "Du siehst gerade: kritische offene Aufgaben."
    : rawTaskFilter === "kritisch-ohne-faelligkeit"
      ? "Du siehst gerade: kritische offene Aufgaben ohne Fälligkeit."
      : rawTaskFilter === "pdca-follow-up-offen"
        ? "Du siehst gerade: offene PDCA-Folgeaufgaben."
        : rawTaskFilter === "pdca-follow-up-ueberfaellig"
          ? "Du siehst gerade: überfällige PDCA-Folgeaufgaben."
          : rawTaskFilter === "copilot-open"
            ? "Du siehst gerade: offene Aufgaben mit Copilot-Bezug."
            : "";
  const filtered = data.filter((a: any) => {
    if (rawTaskFilter === "copilot-open") {
      if (!/copilot/i.test(String(a?.titel || ""))) return false;
      if (a.status === "erledigt") return false;
    }
    if (rawTaskFilter === "kritisch") {
      if (String(a?.prioritaet || "") !== "kritisch") return false;
      if (a.status === "erledigt") return false;
    }
    if (rawTaskFilter === "kritisch-ohne-faelligkeit") {
      if (String(a?.prioritaet || "") !== "kritisch") return false;
      if (a.status === "erledigt") return false;
      if (String(a?.faelligAm || "").trim()) return false;
    }
    if (rawTaskFilter === "pdca-follow-up-offen") {
      if (String(a?.vorlagenBezug || "") !== "pdca_follow_up") return false;
      if (a.status === "erledigt") return false;
    }
    if (rawTaskFilter === "pdca-follow-up-ueberfaellig") {
      if (String(a?.vorlagenBezug || "") !== "pdca_follow_up") return false;
      if (a.status === "erledigt") return false;
      if (!(String(a?.faelligAm || "").trim() && String(a.faelligAm) < today)) return false;
    }
    return (filter === "alle" || a.status === filter) && (typFilter === "alle" || a.typ === typFilter);
  }).slice().sort((a: any, b: any) => {
    const prioOrder: Record<string, number> = { kritisch: 0, hoch: 1, mittel: 2, niedrig: 3 };
    const statusOrder: Record<string, number> = { offen: 0, in_bearbeitung: 1, erledigt: 2 };
    const aDue = a.faelligAm || "9999-12-31";
    const bDue = b.faelligAm || "9999-12-31";
    if (rawTaskFilter === "kritisch" || rawTaskFilter === "kritisch-ohne-faelligkeit" || rawTaskFilter === "pdca-follow-up-offen" || rawTaskFilter === "pdca-follow-up-ueberfaellig" || rawTaskFilter === "copilot-open") {
      return (prioOrder[String(a.prioritaet || "mittel")] ?? 9) - (prioOrder[String(b.prioritaet || "mittel")] ?? 9)
        || aDue.localeCompare(bDue)
        || (statusOrder[String(a.status || "offen")] ?? 9) - (statusOrder[String(b.status || "offen")] ?? 9)
        || String(a.titel || "").localeCompare(String(b.titel || ""), "de");
    }
    return String(a.titel || "").localeCompare(String(b.titel || ""), "de");
  });
  return (
    <MandantGuard>
      <PageHeader title={t("tasksTitle")} desc={t("tasksDesc")}
        action={<Button size="sm" className="bg-primary h-8 text-xs gap-1.5" onClick={() => setModal("new")}><Plus className="h-3.5 w-3.5" />Neue Aufgabe</Button>} />
      {taskFilterHint && <Card className="mb-4 border-primary/30 bg-primary/5"><CardContent className="py-3 px-4 flex flex-col gap-2 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between"><span>{taskFilterHint} <span className="font-medium text-foreground">({filtered.length})</span></span><div className="flex flex-wrap gap-2"><Button type="button" size="sm" variant="outline" onClick={() => {
        const next = new URL(location, "https://privashield.local");
        next.searchParams.delete("filter");
        setLocation(`${next.pathname}${next.search}`);
        setFilter("alle");
        setTypFilter("alle");
      }}>Filter zurücksetzen</Button><Link href="/export"><a className="text-xs text-primary hover:underline self-center">Export öffnen</a></Link></div></CardContent></Card>}
      {(rawTaskFilter === "kritisch" || rawTaskFilter === "kritisch-ohne-faelligkeit" || rawTaskFilter === "pdca-follow-up-offen" || rawTaskFilter === "pdca-follow-up-ueberfaellig") && <Card className="mb-4 border-border/60 bg-muted/20"><CardContent className="py-3 px-4 grid grid-cols-1 gap-3 text-sm md:grid-cols-4"><div><p className="text-xs text-muted-foreground">Kritische Aufgaben offen</p><p className="font-semibold">{data.filter((a: any) => String(a?.prioritaet || "") === "kritisch" && a.status !== "erledigt").length}</p></div><div><p className="text-xs text-muted-foreground">Kritisch ohne Fälligkeit</p><p className="font-semibold">{data.filter((a: any) => String(a?.prioritaet || "") === "kritisch" && a.status !== "erledigt" && !String(a?.faelligAm || "").trim()).length}</p></div><div><p className="text-xs text-muted-foreground">PDCA-Folgeaufgaben offen</p><p className="font-semibold">{data.filter((a: any) => String(a?.vorlagenBezug || "") === "pdca_follow_up" && a.status !== "erledigt").length}</p></div><div><p className="text-xs text-muted-foreground">PDCA-Folgeaufgaben überfällig</p><p className="font-semibold">{data.filter((a: any) => String(a?.vorlagenBezug || "") === "pdca_follow_up" && a.status !== "erledigt" && String(a?.faelligAm || "").trim() && String(a.faelligAm) < today).length}</p></div></CardContent></Card>}
      <div className="flex gap-2 mb-4 flex-wrap">
        <Button type="button" size="sm" variant={new URL(location, "https://privashield.local").searchParams.get("filter") === "copilot-open" ? "default" : "outline"} onClick={() => {
          const next = new URL(location, "https://privashield.local");
          next.searchParams.set("filter", "copilot-open");
          setLocation(`${next.pathname}${next.search}`);
          setFilter("offen");
          setTypFilter("alle");
        }}>Copilot offen</Button>
        {new URL(location, "https://privashield.local").searchParams.get("filter") === "copilot-open" && (
          <Button type="button" size="sm" variant="outline" onClick={() => {
            const next = new URL(location, "https://privashield.local");
            next.searchParams.delete("filter");
            setLocation(`${next.pathname}${next.search}`);
          }}>Copilot-Filter löschen</Button>
        )}
      </div>
      <div className="flex gap-2 mb-4">
        {["alle", "offen", "in_bearbeitung", "erledigt"].map(f => (
          <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1 rounded-full text-xs transition-colors ${filter === f ? "bg-primary text-white" : "bg-secondary text-muted-foreground hover:text-foreground"}`}>
            {statusLabels[f] || "Alle"}
          </button>
        ))}
      </div>
      <div className="flex gap-2 mb-4 flex-wrap">
        {["alle", "todo", "task", "milestone", "kontrolle", "review"].map(f => (
          <button key={f} onClick={() => setTypFilter(f)} className={`px-3 py-1 rounded-full text-xs transition-colors ${typFilter === f ? "bg-primary text-white" : "bg-secondary text-muted-foreground hover:text-foreground"}`}>
            {f === "alle" ? "Alle Typen" : f}
          </button>
        ))}
      </div>
      {isLoading ? <Skeleton className="h-32 w-full" /> : (
        <div className="space-y-2">
          {filtered.length === 0 && <Card className="border-dashed"><CardContent className="py-12 text-center text-sm text-muted-foreground space-y-3">{taskFilterHint || "Keine Aufgaben in dieser Ansicht."}{taskFilterHint ? " Aktuell gibt es dafür keine Treffer." : ""}<div><Button type="button" size="sm" onClick={() => setModal("new")}>Neue Aufgabe anlegen</Button></div></CardContent></Card>}
          {filtered.map((item: any) => {
            const ueberfaellig = item.faelligAm && item.faelligAm < today && item.status !== "erledigt";
            return (
              <Card key={item.id} className={`group hover:border-border/80 transition-colors ${ueberfaellig ? "border-orange-500/30" : ""}`}>
                <CardContent className="py-3 px-4 flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center sm:gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <button onClick={async () => {
                      const nextTask = { ...item, status: item.status === "erledigt" ? "offen" : "erledigt", abgeschlossenAm: item.status === "erledigt" ? null : new Date().toISOString().split("T")[0] };
                      const updated = await update.mutateAsync({ id: item.id, status: nextTask.status, abgeschlossenAm: nextTask.abgeschlossenAm });
                      await syncPdcaFromTask(updated);
                    }}
                      className={`shrink-0 w-4 h-4 rounded border transition-colors ${item.status === "erledigt" ? "bg-emerald-500 border-emerald-500" : "border-border hover:border-primary"}`}>
                      {item.status === "erledigt" && <CheckCircle2 className="w-4 h-4 text-white" />}
                    </button>
                    <div className="min-w-0">
                      <p className={`text-sm font-medium truncate ${item.status === "erledigt" ? "line-through text-muted-foreground" : ""}`}>{item.titel}</p>
                      <p className="text-xs text-muted-foreground">{item.typ || "task"} · {item.verantwortlicher || "—"}{item.faelligAm ? ` · Fällig: ${item.faelligAm}` : ""}{ueberfaellig ? " ⚠ Überfällig" : ""}</p>
                      {(rawTaskFilter === "kritisch" || rawTaskFilter === "kritisch-ohne-faelligkeit" || rawTaskFilter === "pdca-follow-up-offen" || rawTaskFilter === "pdca-follow-up-ueberfaellig" || rawTaskFilter === "copilot-open") && <p className="text-xs text-muted-foreground">Arbeitszustand: {item.status === "in_bearbeitung" ? "in Bearbeitung" : rawTaskFilter === "kritisch-ohne-faelligkeit" ? "Termin setzen" : rawTaskFilter === "pdca-follow-up-ueberfaellig" ? "sofort nachsteuern" : item.prioritaet === "kritisch" ? "heute erledigen" : "neu"}</p>}
                      <div className="mt-2 h-2 w-full rounded bg-secondary overflow-hidden">
                        <div className="h-full bg-primary transition-all" style={{ width: `${Math.max(0, Math.min(100, item.fortschritt || 0))}%` }} />
                      </div>
                    </div>
                  </div>
                  <div className="flex w-full items-center justify-between gap-2 shrink-0 sm:w-auto sm:justify-end">
                    <button onClick={async () => {
                      const updated = await update.mutateAsync({ id: item.id, fortschritt: Math.max(0, Math.min(100, (item.fortschritt || 0) - 10)) });
                      await syncPdcaFromTask(updated);
                    }} className="px-2 py-1 rounded text-xs bg-secondary text-muted-foreground hover:text-foreground">-10%</button>
                    <button onClick={async () => {
                      const updated = await update.mutateAsync({ id: item.id, fortschritt: Math.max(0, Math.min(100, (item.fortschritt || 0) + 10)) });
                      await syncPdcaFromTask(updated);
                    }} className="px-2 py-1 rounded text-xs bg-secondary text-muted-foreground hover:text-foreground">+10%</button>
                    <button onClick={async () => {
                      const nextStatus = item.status === "offen" ? "in_bearbeitung" : item.status === "in_bearbeitung" ? "erledigt" : "offen";
                      const updated = await update.mutateAsync({ id: item.id, status: nextStatus, abgeschlossenAm: nextStatus === "erledigt" ? new Date().toISOString().split("T")[0] : null });
                      await syncPdcaFromTask(updated);
                    }} className="px-2 py-1 rounded text-xs bg-secondary text-muted-foreground hover:text-foreground">Status</button>
                    <StatusBadge value={item.prioritaet} />
                    <StatusBadge value={item.status} />
                    <button onClick={() => setModal(item)} className="p-1 rounded text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-all"><Pencil className="h-3.5 w-3.5" /></button>
                    <button onClick={() => setDelId(item.id)} className="p-1 rounded text-muted-foreground hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"><Trash2 className="h-3.5 w-3.5" /></button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
      <Dialog open={!!modal} onOpenChange={o => !o && setModal(null)}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto"><div className="sticky top-0 z-10 -mx-6 border-b bg-background px-6 pb-3 pt-1"><DialogHeader><DialogTitle>{modal === "new" ? "Neue Aufgabe" : "Aufgabe bearbeiten"}</DialogTitle></DialogHeader></div>
          {modal && <AufgabeForm initial={modal === "new" ? {} : modal} onSave={save} onCancel={() => setModal(null)} />}
        </DialogContent>
      </Dialog>
      <ConfirmDialog open={delId !== null} title="Aufgabe löschen?" desc="Dieser Vorgang kann nicht rückgängig gemacht werden."
        onConfirm={() => { remove.mutate(delId!); setDelId(null); }} onCancel={() => setDelId(null)} />
    </MandantGuard>
  );
}

// ─── DOKUMENTE PAGE ────────────────────────────────────────────────────────
function DokumentForm({ initial, onSave, onCancel }: any) {
  const [form, setForm] = useState({ titel: "", kategorie: "richtlinie", dokumentTyp: "richtlinie", beschreibung: "", version: "1.0", status: "aktiv", gueltigBis: "", verantwortlicher: "", freigegebenVon: "", freigegebenAm: "", naechstePruefungAm: "", inhalt: "", ...initial });
  const set = (k: string, v: any) => setForm((p: any) => ({ ...p, [k]: v }));
  const handleKategorieChange = (value: string) => {
    if (value === "leitlinie") {
      setForm((p: any) => ({
        ...p,
        kategorie: "leitlinie",
        dokumentTyp: p.dokumentTyp === "richtlinie" ? "leitlinie" : p.dokumentTyp,
        titel: p.titel || "Leitlinie Datenschutz und Informationssicherheit",
      }));
      return;
    }
    set("kategorie", value);
  };
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="col-span-2 space-y-1"><Label className="text-xs">Titel *</Label><Input value={form.titel} onChange={e => set("titel", e.target.value)} className="h-8 text-sm" /></div>
        <div className="space-y-1"><Label className="text-xs">Kategorie</Label>
          <Select value={form.kategorie} onValueChange={handleKategorieChange}>
            <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="leitlinie">Leitlinie Datenschutz und Informationssicherheit</SelectItem>
              <SelectItem value="richtlinie">Richtlinie</SelectItem>
              <SelectItem value="prozessbeschreibung">Prozessbeschreibung</SelectItem>
              <SelectItem value="risikobewertung">Risikobewertung</SelectItem>
              <SelectItem value="verfahrensdokumentation">Verfahrensdokumentation</SelectItem>
              <SelectItem value="vorlage">Vorlage</SelectItem>
              <SelectItem value="vertrag">Vertrag</SelectItem>
              <SelectItem value="protokoll">Protokoll</SelectItem>
              <SelectItem value="sonstige">Sonstige</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1"><Label className="text-xs">Dokumenttyp</Label><Input value={form.dokumentTyp} onChange={e => set("dokumentTyp", e.target.value)} className="h-8 text-sm" /></div>
        <div className="space-y-1"><Label className="text-xs">Version</Label><Input value={form.version} onChange={e => set("version", e.target.value)} className="h-8 text-sm" /></div>
        <div className="space-y-1"><Label className="text-xs">Status</Label>
          <Select value={form.status} onValueChange={v => set("status", v)}>
            <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="entwurf">Entwurf</SelectItem><SelectItem value="aktiv">Aktiv</SelectItem><SelectItem value="archiviert">Archiviert</SelectItem></SelectContent>
          </Select>
        </div>
        <div className="space-y-1"><Label className="text-xs">Gültig bis</Label><Input type="date" value={form.gueltigBis} onChange={e => set("gueltigBis", e.target.value)} className="h-8 text-sm" /></div>
        <div className="space-y-1"><Label className="text-xs">Verantwortlicher</Label><Input value={form.verantwortlicher} onChange={e => set("verantwortlicher", e.target.value)} className="h-8 text-sm" /></div>
        <div className="space-y-1"><Label className="text-xs">Freigegeben von</Label><Input value={form.freigegebenVon} onChange={e => set("freigegebenVon", e.target.value)} className="h-8 text-sm" /></div>
        <div className="space-y-1"><Label className="text-xs">Freigegeben am</Label><Input type="date" value={form.freigegebenAm} onChange={e => set("freigegebenAm", e.target.value)} className="h-8 text-sm" /></div>
        <div className="space-y-1"><Label className="text-xs">Nächste Prüfung</Label><Input type="date" value={form.naechstePruefungAm} onChange={e => set("naechstePruefungAm", e.target.value)} className="h-8 text-sm" /></div>
        <div className="col-span-2 space-y-1"><Label className="text-xs">Beschreibung</Label><Textarea value={form.beschreibung} onChange={e => set("beschreibung", e.target.value)} className="text-sm min-h-12" /></div>
        <div className="col-span-2 space-y-1"><Label className="text-xs">Inhalt / Notizen</Label><Textarea value={form.inhalt} onChange={e => set("inhalt", e.target.value)} className="text-sm min-h-20" /></div>
      </div>
      <div className="sticky bottom-0 z-10 -mx-6 mt-4 border-t bg-background px-6 pt-3 pb-1">
        <DialogFooter>
          <Button variant="outline" size="sm" onClick={onCancel}>Abbrechen</Button>
          <Button size="sm" className="bg-primary" onClick={() => onSave(form)} disabled={!form.titel}>Speichern</Button>
        </DialogFooter>
      </div>
    </div>
  );
}

function KiCompliancePage() {
  const { t } = useI18n();
  const { activeMandantId } = useMandant();
  const qc = useQueryClient();
  const { data: dokumente, create, update } = useModuleData("dokumente");
  const { data: dsfas = [] } = useModuleData("dsfa");
  const { data: aufgaben = [] } = useModuleData("aufgaben");
  const { data: pdca = [] } = useModuleData("pdca");
  const { toast } = useToast();
  const existingCheck = dokumente.find((d: any) => d.kategorie === "prozessbeschreibung" && d.dokumentTyp === "ki_compliance_check");

  const parseJson = (raw: string | null | undefined, fallback: any) => {
    if (!raw) return fallback;
    try { return JSON.parse(raw); } catch { return fallback; }
  };

  const baseForm = {
    kiImEinsatz: false,
    tools: [],
    toolInput: "",
    kiRichtlinieVorhanden: false,
    kiVoGeprueft: false,
    dsgvoCheckliste: {
      zweck: false,
      rechtsgrundlage: false,
      datenarten: false,
      empfaenger: false,
      drittlandtransfer: false,
      toms: false,
      auftragsverarbeitung: false,
      transparenz: false,
    },
    dsfaErforderlich: false,
    dsfaDurchgefuehrt: false,
    verknuepfteDsfaId: "none",
    notes: "",
  };

  const [form, setForm] = useState<any>(baseForm);

  useEffect(() => {
    const parsed = parseJson(existingCheck?.inhalt, baseForm);
    setForm((prev: any) => ({ ...prev, ...parsed, dsgvoCheckliste: { ...prev.dsgvoCheckliste, ...(parsed.dsgvoCheckliste || {}) } }));
  }, [existingCheck?.id]);

  const set = (key: string, value: any) => setForm((prev: any) => ({ ...prev, [key]: value }));
  const toggleChecklist = (key: string) => setForm((prev: any) => ({ ...prev, dsgvoCheckliste: { ...prev.dsgvoCheckliste, [key]: !prev.dsgvoCheckliste[key] } }));
  const addTool = () => {
    const value = String(form.toolInput || "").trim();
    if (!value) return;
    if (form.tools.includes(value)) return set("toolInput", "");
    setForm((prev: any) => ({ ...prev, tools: [...prev.tools, value], toolInput: "" }));
  };
  const removeTool = (tool: string) => setForm((prev: any) => ({ ...prev, tools: prev.tools.filter((t: string) => t !== tool) }));

  const checklistDone = Object.values(form.dsgvoCheckliste || {}).filter(Boolean).length;
  const checklistTotal = Object.keys(form.dsgvoCheckliste || {}).length;
  const linkedDsfa = dsfas.find((d: any) => String(d.id) === String(form.verknuepfteDsfaId));
  const status = !form.kiImEinsatz
    ? { label: "Kein KI-Einsatz", cls: "bg-zinc-500/15 text-zinc-400 border-zinc-500/30" }
    : form.kiRichtlinieVorhanden && form.kiVoGeprueft && checklistDone === checklistTotal && (!form.dsfaErforderlich || (form.dsfaDurchgefuehrt && form.verknuepfteDsfaId !== "none"))
      ? { label: "Konform", cls: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" }
      : form.kiRichtlinieVorhanden || form.kiVoGeprueft || checklistDone > 0
        ? { label: "Teilweise", cls: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30" }
        : { label: "Kritisch", cls: "bg-red-500/15 text-red-400 border-red-500/30" };

  const getAiMeta = () => {
    const missingPolicy = !!form.kiImEinsatz && !form.kiRichtlinieVorhanden;
    const missingAiAct = !!form.kiImEinsatz && !form.kiVoGeprueft;
    const incompleteChecklist = !!form.kiImEinsatz && checklistDone < checklistTotal;
    const dsfaGap = !!form.kiImEinsatz && !!form.dsfaErforderlich && (!form.dsfaDurchgefuehrt || String(form.verknuepfteDsfaId || "none") === "none");
    const toolInventoryGap = !!form.kiImEinsatz && (!Array.isArray(form.tools) || form.tools.length === 0);
    return { missingPolicy, missingAiAct, incompleteChecklist, dsfaGap, toolInventoryGap };
  };
  const aiMeta = getAiMeta();

  const buildAiTaskDraft = (kind: "missing-policy" | "missing-ai-act" | "incomplete-checklist" | "dsfa-gap" | "tool-inventory-gap") => {
    const drafts: Record<string, { title: string; priority: string; description: string }> = {
      "missing-policy": { title: "KI-Richtlinie für eingesetzte KI-Tools festlegen", priority: "kritisch", description: "Es werden KI-Tools eingesetzt, aber eine dokumentierte KI-Richtlinie fehlt. Bitte Governance, zulässige Nutzung und Verbote verbindlich festlegen." },
      "missing-ai-act": { title: "KI-VO-Prüfung für eingesetzte KI-Tools nachziehen", priority: "hoch", description: "Der KI-Einsatz ist dokumentiert, aber die Prüfung der geltenden KI-VO-Vorgaben fehlt. Bitte regulatorische Einordnung und Pflichtenbewertung ergänzen." },
      "incomplete-checklist": { title: "DSGVO-Checkliste für KI-Einsatz vervollständigen", priority: "hoch", description: "Die DSGVO-Prüfstruktur für den KI-Einsatz ist noch nicht vollständig abgearbeitet. Bitte offene Prüfpunkte systematisch schließen." },
      "dsfa-gap": { title: "DSFA-Lücke im KI-Einsatz schließen", priority: "kritisch", description: "Für den KI-Einsatz ist eine DSFA erforderlich, aber noch nicht belastbar durchgeführt oder verknüpft. Bitte DSFA unverzüglich nachziehen." },
      "tool-inventory-gap": { title: "KI-Toolinventar vervollständigen", priority: "mittel", description: "KI-Einsatz ist markiert, aber es sind keine konkreten Tools dokumentiert. Bitte eingesetzte KI-Systeme belastbar erfassen." },
    };
    const draft = drafts[kind];
    const params = new URLSearchParams({ draftTitle: draft.title, draftPriority: draft.priority, draftDescription: draft.description, draftSource: `ki:${kind}` });
    return { href: `/aufgaben?${params.toString()}`, title: draft.title, priority: draft.priority, description: draft.description, source: `ki:${kind}` };
  };

  const createAiFollowUpTask = async (kind: "missing-policy" | "missing-ai-act" | "incomplete-checklist" | "dsfa-gap" | "tool-inventory-gap") => {
    const draft = buildAiTaskDraft(kind);
    const duplicate = aufgaben.find((task: any) => String(task?.vorlagenBezug || "") === draft.source && String(task?.status || "") !== "erledigt");
    if (duplicate) {
      toast({ title: "Aufgabe bereits vorhanden", description: `Offene Folgeaufgabe gefunden: ${duplicate.titel}` });
      return;
    }
    await apiRequest("POST", `/api/mandanten/${activeMandantId}/aufgaben`, {
      titel: draft.title,
      beschreibung: draft.description,
      typ: kind === "incomplete-checklist" ? "review" : "task",
      prioritaet: draft.priority,
      status: "offen",
      fortschritt: 0,
      verantwortlicher: "",
      faelligAm: "",
      kategorie: "ki-compliance",
      referenzId: existingCheck?.id || null,
      vorlagenBezug: draft.source,
    });
    await qc.invalidateQueries({ queryKey: [`/api/mandanten/${activeMandantId}/aufgaben`] });
    toast({ title: "Folgeaufgabe erstellt", description: draft.title });
  };

  const createAiPdcaCycle = async (kind: "missing-policy" | "missing-ai-act" | "incomplete-checklist" | "dsfa-gap" | "tool-inventory-gap") => {
    const source = `ki-pdca:${kind}`;
    const duplicate = pdca.find((entry: any) => String(entry?.actNaechsterZyklus || "").includes(source) && String(entry?.status || "") !== "abgeschlossen");
    if (duplicate) {
      toast({ title: "PDCA bereits vorhanden", description: `Offener Zyklus gefunden: ${duplicate.titel}` });
      return;
    }
    const reviewDate = new Date();
    reviewDate.setDate(reviewDate.getDate() + (kind === "dsfa-gap" || kind === "missing-policy" ? 7 : 14));
    const titleMap: Record<string, string> = {
      "missing-policy": "PDCA KI-Governance / Richtlinie",
      "missing-ai-act": "PDCA KI-VO-Prüfung",
      "incomplete-checklist": "PDCA DSGVO-Prüfstruktur KI",
      "dsfa-gap": "PDCA DSFA für KI-Einsatz",
      "tool-inventory-gap": "PDCA KI-Toolinventar",
    };
    const pdcaItem = await apiRequest("POST", `/api/mandanten/${activeMandantId}/pdca`, {
      titel: titleMap[kind],
      beschreibung: "Automatisch vorbereiteter Verbesserungszyklus für den dokumentierten KI-Einsatz.",
      zyklusTyp: "verbesserungsmassnahme",
      status: "geplant",
      prioritaet: kind === "dsfa-gap" || kind === "missing-policy" ? "kritisch" : "hoch",
      verantwortlicher: "",
      naechstePruefungAm: reviewDate.toISOString().split("T")[0],
      planRisiken: `KI im Einsatz: ${form.kiImEinsatz ? "ja" : "nein"}\nTools: ${(form.tools || []).join(", ") || "keine dokumentiert"}\nStatus: ${status.label}`,
      planMassnahmen: kind === "missing-policy" ? "KI-Richtlinie mit zulässiger Nutzung, Verboten und Governance definieren." : kind === "missing-ai-act" ? "KI-VO-relevante Anforderungen prüfen und dokumentieren." : kind === "incomplete-checklist" ? "Offene DSGVO-Prüfpunkte systematisch vervollständigen." : kind === "dsfa-gap" ? "DSFA erstellen bzw. sauber verknüpfen und abschließen." : "Eingesetzte KI-Tools und Einsatzszenarien belastbar inventarisieren.",
      planZiele: "KI-Einsatz belastbar, dokumentiert und regulatorisch abgesichert steuern.",
      actNaechsterZyklus: source,
      verknuepftesAuditId: null,
    }).then(r => r.json());
    await apiRequest("POST", `/api/mandanten/${activeMandantId}/aufgaben`, {
      titel: `${titleMap[kind]} – Folgeaufgabe`,
      beschreibung: `Operative Folgeaufgabe zum KI-Verbesserungszyklus ${titleMap[kind]}.`,
      typ: kind === "incomplete-checklist" ? "review" : "task",
      prioritaet: kind === "dsfa-gap" || kind === "missing-policy" ? "kritisch" : "hoch",
      status: "offen",
      fortschritt: 0,
      verantwortlicher: "",
      faelligAm: reviewDate.toISOString().split("T")[0],
      kategorie: "ki-compliance",
      referenzId: pdcaItem.id,
      vorlagenBezug: "pdca_follow_up",
    });
    await qc.invalidateQueries({ queryKey: [`/api/mandanten/${activeMandantId}/pdca`] });
    await qc.invalidateQueries({ queryKey: [`/api/mandanten/${activeMandantId}/aufgaben`] });
    toast({ title: "PDCA-Zyklus erstellt", description: titleMap[kind] });
  };

  const save = async () => {
    const payload = {
      titel: "Prüfung KI-Tools und KI-VO / DSGVO-Konformität",
      kategorie: "prozessbeschreibung",
      dokumentTyp: "ki_compliance_check",
      status: status.label === "Konform" || status.label === "Kein KI-Einsatz" ? "aktiv" : "entwurf",
      version: "1.0",
      beschreibung: "Erfassung des KI-Einsatzes inklusive KI-VO-Prüfung, DSGVO-Checkliste und DSFA-Bewertung.",
      inhalt: JSON.stringify(form),
    };
    try {
      if (existingCheck) await update.mutateAsync({ id: existingCheck.id, ...payload });
      else await create.mutateAsync(payload);
      toast({ title: "KI-Compliance gespeichert" });
    } catch {
      toast({ title: "Fehler", description: "KI-Compliance konnte nicht gespeichert werden.", variant: "destructive" });
    }
  };

  return (
    <MandantGuard>
      <div className="space-y-6">
        <PageHeader title={t("aiTitle")} desc={t("aiDesc")} />
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <div>
                <CardTitle className="text-sm">Konformitätsprüfung KI-Einsatz</CardTitle>
                <CardDescription>Prüfung von KI-Richtlinie, KI-VO, DSGVO-Struktur und DSFA-Pflicht</CardDescription>
              </div>
              <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${status.cls}`}>{status.label}</span>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <Card className="border-border/60 bg-muted/20">
              <CardContent className="p-4 space-y-2 text-sm">
                {aiMeta.missingPolicy && <p className="text-red-400">KI-Einsatz ohne KI-Richtlinie</p>}
                {aiMeta.missingAiAct && <p className="text-red-400">KI-Einsatz ohne dokumentierte KI-VO-Prüfung</p>}
                {aiMeta.dsfaGap && <p className="text-red-400">KI-Einsatz mit offener DSFA-Lücke</p>}
                {aiMeta.incompleteChecklist && <p className="text-yellow-400">DSGVO-Checkliste für KI-Einsatz noch unvollständig</p>}
                {aiMeta.toolInventoryGap && <p className="text-yellow-400">KI-Einsatz ohne dokumentiertes Toolinventar</p>}
                {!aiMeta.missingPolicy && !aiMeta.missingAiAct && !aiMeta.dsfaGap && !aiMeta.incompleteChecklist && !aiMeta.toolInventoryGap && <p className="text-muted-foreground">Aktuell keine priorisierten KI-Compliance-Hinweise.</p>}
              </CardContent>
            </Card>
            {(aiMeta.missingPolicy || aiMeta.missingAiAct || aiMeta.dsfaGap || aiMeta.incompleteChecklist || aiMeta.toolInventoryGap) && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">KI-Fokusliste</CardTitle>
                  <CardDescription>Operative Folgeaktionen für die aktuell wichtigsten KI-Compliance-Lücken</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  {aiMeta.missingPolicy && <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-3"><p className="font-medium text-red-700 dark:text-red-400">KI-Richtlinie fehlt</p><div className="mt-2 flex gap-2"><Button type="button" size="sm" variant="secondary" onClick={() => createAiFollowUpTask("missing-policy")}>Aufgabe erzeugen</Button><Button type="button" size="sm" variant="secondary" onClick={() => createAiPdcaCycle("missing-policy")}>PDCA erzeugen</Button><Link href={buildAiTaskDraft("missing-policy").href}><a className="text-xs text-primary hover:underline self-center">Aufgabe vorbereiten</a></Link></div></div>}
                  {aiMeta.missingAiAct && <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-3"><p className="font-medium text-red-700 dark:text-red-400">KI-VO-Prüfung fehlt</p><div className="mt-2 flex gap-2"><Button type="button" size="sm" variant="secondary" onClick={() => createAiFollowUpTask("missing-ai-act")}>Aufgabe erzeugen</Button><Button type="button" size="sm" variant="secondary" onClick={() => createAiPdcaCycle("missing-ai-act")}>PDCA erzeugen</Button><Link href={buildAiTaskDraft("missing-ai-act").href}><a className="text-xs text-primary hover:underline self-center">Aufgabe vorbereiten</a></Link></div></div>}
                  {aiMeta.dsfaGap && <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-3"><p className="font-medium text-red-700 dark:text-red-400">DSFA-Lücke im KI-Einsatz</p><div className="mt-2 flex gap-2"><Button type="button" size="sm" variant="secondary" onClick={() => createAiFollowUpTask("dsfa-gap")}>Aufgabe erzeugen</Button><Button type="button" size="sm" variant="secondary" onClick={() => createAiPdcaCycle("dsfa-gap")}>PDCA erzeugen</Button><Link href={buildAiTaskDraft("dsfa-gap").href}><a className="text-xs text-primary hover:underline self-center">Aufgabe vorbereiten</a></Link></div></div>}
                </CardContent>
              </Card>
            )}
            <label className="flex items-center gap-2 rounded-lg border p-3 cursor-pointer hover:bg-secondary/30"><input type="checkbox" checked={!!form.kiImEinsatz} onChange={e => set("kiImEinsatz", e.target.checked)} className="rounded" /><span>Es werden KI-Tools eingesetzt</span></label>

            {form.kiImEinsatz && (
              <>
                <div className="space-y-2">
                  <Label className="text-xs">Eingesetzte KI-Tools</Label>
                  <div className="flex gap-2">
                    <Input value={form.toolInput || ""} onChange={e => set("toolInput", e.target.value)} className="h-8 text-sm" placeholder="z. B. ChatGPT, Claude, Copilot" />
                    <Button type="button" variant="outline" size="sm" onClick={addTool}>Hinzufügen</Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {(form.tools || []).map((tool: string) => <button key={tool} type="button" onClick={() => removeTool(tool)} className="px-3 py-1 rounded-full text-xs bg-secondary hover:bg-secondary/70">{tool} ✕</button>)}
                    {(form.tools || []).length === 0 && <p className="text-xs text-muted-foreground">Noch keine KI-Tools erfasst.</p>}
                  </div>
                </div>

                <label className="flex items-center gap-2 rounded-lg border p-3 cursor-pointer hover:bg-secondary/30"><input type="checkbox" checked={!!form.kiRichtlinieVorhanden} onChange={e => set("kiRichtlinieVorhanden", e.target.checked)} className="rounded" /><span>KI-Richtlinie eingeführt</span></label>
                <label className="flex items-center gap-2 rounded-lg border p-3 cursor-pointer hover:bg-secondary/30"><input type="checkbox" checked={!!form.kiVoGeprueft} onChange={e => set("kiVoGeprueft", e.target.checked)} className="rounded" /><span>Aktuell geltende Vorgaben der KI-VO geprüft</span></label>

                <div className="space-y-2">
                  <Label className="text-xs">DSGVO-Prüfstruktur / Checkliste</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {[
                      ["zweck", "Zweckbestimmung dokumentiert"],
                      ["rechtsgrundlage", "Rechtsgrundlage geprüft"],
                      ["datenarten", "Datenarten und Kategorien bewertet"],
                      ["empfaenger", "Empfänger / Anbieter geprüft"],
                      ["drittlandtransfer", "Drittlandtransfer bewertet"],
                      ["toms", "Technische und organisatorische Maßnahmen geprüft"],
                      ["auftragsverarbeitung", "Auftragsverarbeitung / Rollenmodell geprüft"],
                      ["transparenz", "Transparenz- und Hinweispflichten geprüft"],
                    ].map(([key, label]) => (
                      <label key={key} className="flex items-center gap-2 rounded-lg border p-3 cursor-pointer hover:bg-secondary/30">
                        <input type="checkbox" checked={!!form.dsgvoCheckliste?.[key]} onChange={() => toggleChecklist(String(key))} className="rounded" />
                        <span>{label}</span>
                      </label>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">Erfüllte DSGVO-Prüfpunkte: {checklistDone} / {checklistTotal}</p>
                </div>

                <label className="flex items-center gap-2 rounded-lg border p-3 cursor-pointer hover:bg-secondary/30"><input type="checkbox" checked={!!form.dsfaErforderlich} onChange={e => set("dsfaErforderlich", e.target.checked)} className="rounded" /><span>DSFA ist für den KI-Einsatz erforderlich</span></label>
                {form.dsfaErforderlich && (
                  <>
                    <label className="flex items-center gap-2 rounded-lg border p-3 cursor-pointer hover:bg-secondary/30"><input type="checkbox" checked={!!form.dsfaDurchgefuehrt} onChange={e => set("dsfaDurchgefuehrt", e.target.checked)} className="rounded" /><span>DSFA wurde durchgeführt</span></label>
                    <div className="space-y-1">
                      <Label className="text-xs">Verknüpfte DSFA</Label>
                      <Select value={String(form.verknuepfteDsfaId || "none")} onValueChange={v => set("verknuepfteDsfaId", v)}>
                        <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="DSFA auswählen" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Keine DSFA ausgewählt</SelectItem>
                          {dsfas.map((d: any) => <SelectItem key={d.id} value={String(d.id)}>{d.titel}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      {linkedDsfa && <p className="text-xs text-muted-foreground">Verknüpft: {linkedDsfa.titel}</p>}
                    </div>
                  </>
                )}
              </>
            )}

            <div className="space-y-1">
              <Label className="text-xs">Notizen</Label>
              <Textarea value={form.notes || ""} onChange={e => set("notes", e.target.value)} className="text-sm min-h-20" />
            </div>
            <DialogFooter><Button size="sm" className="bg-primary" onClick={save}>Speichern</Button></DialogFooter>
          </CardContent>
        </Card>
      </div>
    </MandantGuard>
  );
}




function InterneNotizenForm({ initial, onSave, onCancel }: any) {
  const { t } = useI18n();
  const [form, setForm] = useState({ titel: "", inhalt: "", kategorie: "allgemein", prioritaet: "mittel", exportieren: false, faelligAm: "", ...initial });
  const set = (k: string, v: any) => setForm((p: any) => ({ ...p, [k]: v }));
  return <div className="space-y-3">
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <div className="col-span-2 space-y-1"><Label className="text-xs">{t("notesTitle")} *</Label><Input value={form.titel} onChange={e => set("titel", e.target.value)} className="h-8 text-sm" /></div>
      <div className="space-y-1"><Label className="text-xs">{t("notesCategory")}</Label><Input value={form.kategorie} onChange={e => set("kategorie", e.target.value)} className="h-8 text-sm" /></div>
      <div className="space-y-1"><Label className="text-xs">{t("notesPriority")}</Label><Select value={form.prioritaet} onValueChange={v => set("prioritaet", v)}><SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="niedrig">Niedrig</SelectItem><SelectItem value="mittel">Mittel</SelectItem><SelectItem value="hoch">Hoch</SelectItem><SelectItem value="kritisch">Kritisch</SelectItem></SelectContent></Select></div>
      <div className="space-y-1"><Label className="text-xs">{t("notesDueDate")}</Label><Input type="date" value={form.faelligAm || ""} onChange={e => set("faelligAm", e.target.value)} className="h-8 text-sm" /></div>
      <div className="flex items-center gap-2"><input type="checkbox" checked={!!form.exportieren} onChange={e => set("exportieren", e.target.checked)} /><Label className="text-xs">{t("notesExport")}</Label></div>
      <div className="col-span-2 space-y-1"><Label className="text-xs">{t("notesContent")} *</Label><Textarea value={form.inhalt} onChange={e => set("inhalt", e.target.value)} className="text-sm min-h-24" /></div>
    </div>
    <div className="sticky bottom-0 z-10 -mx-6 mt-4 border-t bg-background px-6 pt-3 pb-1"><DialogFooter><Button variant="outline" size="sm" onClick={onCancel}>{t("cancel")}</Button><Button size="sm" className="bg-primary" onClick={() => onSave(form)} disabled={!form.titel || !form.inhalt}>{t("save")}</Button></DialogFooter></div>
  </div>;
}

function InterneNotizenPage() {
  const { t } = useI18n();
  const { data, isLoading, create, update, remove } = useModuleData("interne-notizen");
  const [modal, setModal] = useState<null | "new" | any>(null);
  const [delId, setDelId] = useState<number | null>(null);
  const { toast } = useToast();
  const exportFreigegeben = data.filter((item: any) => !!item.exportieren).length;
  const save = (form: any) => {
    const p = modal === "new" ? create.mutateAsync(form) : update.mutateAsync({ id: modal.id, ...form });
    p.then(() => { setModal(null); toast({ title: "Gespeichert" }); }).catch((e:any) => toast({ title: "Fehler", description: e?.message || "Notiz konnte nicht gespeichert werden", variant: "destructive" }));
  };
  return <MandantGuard>
    <PageHeader title={t("internalNotes")} desc={t("internalNotesDesc")} action={<Button size="sm" className="bg-primary h-8 text-xs gap-1.5" onClick={() => setModal("new")}><Plus className="h-3.5 w-3.5" />{t("newNote")}</Button>} />
    <Card>
      <CardContent className="p-4 grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
        <div><p className="text-xs text-muted-foreground">Notizen gesamt</p><p className="text-2xl font-bold">{data.length}</p></div>
        <div><p className="text-xs text-muted-foreground">Für Export freigegeben</p><p className="text-2xl font-bold">{exportFreigegeben}</p></div>
        <div><p className="text-xs text-muted-foreground">Anstehende Themen</p><p className="text-2xl font-bold">{data.filter((item: any) => !!item.faelligAm).length}</p></div>
      </CardContent>
    </Card>
    {isLoading ? <Skeleton className="h-32 w-full" /> : <div className="space-y-2">
      {data.map((item: any) => <Card key={item.id}><CardContent className="py-3 px-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-sm font-medium">{item.titel}</p><p className="text-xs text-muted-foreground">{item.kategorie || "allgemein"} · {item.prioritaet}{item.faelligAm ? ` · fällig ${item.faelligAm}` : ""}{item.exportieren ? " · Export freigegeben" : " · Nicht für Export freigegeben"}</p><p className="text-sm mt-1 whitespace-pre-wrap">{item.inhalt}</p></div><div className="flex items-center gap-2"><button onClick={() => setModal(item)} className="p-1 rounded text-muted-foreground hover:text-foreground"><Pencil className="h-3.5 w-3.5" /></button><button onClick={() => setDelId(item.id)} className="p-1 rounded text-muted-foreground hover:text-red-400"><Trash2 className="h-3.5 w-3.5" /></button></div></CardContent></Card>)}
      {data.length === 0 && <Card className="border-dashed"><CardContent className="py-12 text-center text-sm text-muted-foreground">{t("notesEmpty")}</CardContent></Card>}
    </div>}
    <Dialog open={!!modal} onOpenChange={o => !o && setModal(null)}><DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto"><div className="sticky top-0 z-10 -mx-6 border-b bg-background px-6 pb-3 pt-1"><DialogHeader><DialogTitle>{modal === "new" ? t("newNote") : t("internalNotes")}</DialogTitle></DialogHeader></div>{modal && <InterneNotizenForm initial={modal === "new" ? {} : modal} onSave={save} onCancel={() => setModal(null)} />}</DialogContent></Dialog>
    <ConfirmDialog open={delId !== null} title="Notiz löschen?" desc="Dieser Vorgang kann nicht rückgängig gemacht werden." onConfirm={() => { remove.mutate(delId!); setDelId(null); }} onCancel={() => setDelId(null)} />
  </MandantGuard>;
}

function BackupsPage() {
  const { toast } = useToast();
  const { t } = useI18n();
  const configQuery = useQuery({ queryKey: ["/api/admin/backups/config"], queryFn: () => apiRequest("GET", "/api/admin/backups/config").then(r => r.json()) });
  const backupsQuery = useQuery({ queryKey: ["/api/admin/backups"], queryFn: () => apiRequest("GET", "/api/admin/backups").then(r => r.json()) });
  const [form, setForm] = useState<any>(null);
  const [runPassword, setRunPassword] = useState("");
  const [restorePassword, setRestorePassword] = useState("");
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadPassword, setUploadPassword] = useState("");

  useEffect(() => { if (configQuery.data) setForm(configQuery.data); }, [configQuery.data]);

  const saveMutation = useMutation({
    mutationFn: async () => apiRequest("POST", "/api/admin/backups/config", form).then(r => r.json()),
    onSuccess: () => { toast({ title: t("saveBackupConfig") }); configQuery.refetch(); },
    onError: (e: any) => toast({ title: "Fehler", description: e?.message || t("backupSaveError"), variant: "destructive" })
  });

  const runMutation = useMutation({
    mutationFn: async () => apiRequest("POST", "/api/admin/backups/run", { password: runPassword || undefined }).then(async (r) => { const data = await r.json(); if (!r.ok) throw new Error(data.message); return data; }),
    onSuccess: (data) => { toast({ title: t("backupCreated"), description: `${data.created?.length || 0} ${t("backupSlotsUpdated")}` }); backupsQuery.refetch(); configQuery.refetch(); },
    onError: (e: any) => toast({ title: t("backupFailed"), description: e?.message || t("backupRunFailed"), variant: "destructive" })
  });

  const restoreMutation = useMutation({
    mutationFn: async (payload: { fileName: string; encrypted: boolean }) => apiRequest("POST", "/api/admin/backups/restore", {
      fileName: payload.fileName,
      password: payload.encrypted ? (restorePassword || undefined) : undefined,
    }).then(async (r) => { const data = await r.json(); if (!r.ok) throw new Error(data.message); return data; }),
    onSuccess: (data: any) => {
      toast({ title: t("restoreBackupSuccess"), description: data?.migrated ? "Lowdb-Backup wurde automatisch in SQLite migriert." : undefined });
      setRestorePassword("");
      configQuery.refetch();
      backupsQuery.refetch();
    },
    onError: (e: any) => toast({ title: t("restoreBackupFailed"), description: e?.message || t("restoreBackupRunFailed"), variant: "destructive" })
  });

  const uploadRestoreMutation = useMutation({
    mutationFn: async () => {
      if (!uploadFile) throw new Error(t("uploadBackupHint"));
      const query = new URLSearchParams({ fileName: uploadFile.name });
      if (uploadPassword) query.set("password", uploadPassword);
      return apiRequest("POST", `/api/admin/backups/restore-upload?${query.toString()}`, await uploadFile.arrayBuffer()).then(async (r) => {
        const data = await r.json();
        if (!r.ok) throw new Error(data.message);
        return data;
      });
    },
    onSuccess: (data: any) => {
      toast({ title: t("uploadBackupSuccess"), description: data?.migrated ? "Lowdb-Backup wurde automatisch in SQLite migriert." : undefined });
      setUploadFile(null);
      setUploadPassword("");
      configQuery.refetch();
      backupsQuery.refetch();
    },
    onError: (e: any) => toast({ title: t("uploadBackupFailed"), description: e?.message || t("uploadBackupRunFailed"), variant: "destructive" })
  });

  if (!form) return <div className="p-6"><Skeleton className="h-32 w-full" /></div>;
  const setRetention = (key: string, value: number) => setForm((prev: any) => ({ ...prev, retention: { ...prev.retention, [key]: value } }));
  const schedulerRuntimePasswordMissing = !!form.encrypt && !!form.enabled && !form.schedulerRuntimePasswordConfigured;
  const slotLabel = (slot: string) => ({
    hourly: t("backupSlotHourly"),
    daily: t("backupSlotDaily"),
    weekly: t("backupSlotWeekly"),
    monthly: t("backupSlotMonthly"),
    yearly: t("backupSlotYearly"),
  } as Record<string, string>)[slot] || slot;

  return (
    <div className="space-y-6">
      <PageHeader title={t("backups")} desc={t("backupDesc")} />
      <Card>
        <CardHeader><CardTitle className="text-sm">{t("backupConfig")}</CardTitle><CardDescription>{t("backupRotationHint")}</CardDescription></CardHeader>
        <CardContent className="space-y-4 text-sm">
          {schedulerRuntimePasswordMissing && (
            <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-950">
              <p className="font-medium">{t("backupEnvWarningTitle")}</p>
              <p className="mt-1 text-xs text-amber-900">{t("backupEnvWarningText")}</p>
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            <div className="rounded-lg border p-3"><p className="text-xs text-muted-foreground">{t("backupScheduler")}</p><p className="text-sm font-medium mt-1">{form.schedulerActive ? t("schedulerActive") : t("schedulerInactive")}</p></div>
            <div className="rounded-lg border p-3"><p className="text-xs text-muted-foreground">{t("nextRun")}</p><p className="text-sm font-medium mt-1">{form.nextRunAt ? new Date(form.nextRunAt).toLocaleString("de-DE") : "—"}</p></div>
            <div className="rounded-lg border p-3"><p className="text-xs text-muted-foreground">{t("lastRun")}</p><p className="text-sm font-medium mt-1">{form.lastRunAt ? new Date(form.lastRunAt).toLocaleString("de-DE") : "—"}</p></div>
            <div className="rounded-lg border p-3"><p className="text-xs text-muted-foreground">{t("lastSuccess")}</p><p className="text-sm font-medium mt-1">{form.lastSuccessAt ? new Date(form.lastSuccessAt).toLocaleString("de-DE") : "—"}</p></div>
            <div className="rounded-lg border p-3 md:col-span-2 xl:col-span-2"><p className="text-xs text-muted-foreground">{t("lastError")}</p><p className="text-sm font-medium mt-1">{form.lastErrorAt ? `${new Date(form.lastErrorAt).toLocaleString("de-DE")} · ${form.lastErrorMessage || t("unknownError")}` : t("noErrorLogged")}</p></div>
          </div>
          <label className="flex items-center gap-2 rounded-lg border p-3 cursor-pointer hover:bg-secondary/30"><input type="checkbox" checked={!!form.enabled} onChange={e => setForm((p: any) => ({ ...p, enabled: e.target.checked }))} /><span>{t("enableAutomaticBackups")}</span></label>
          <label className="flex items-center gap-2 rounded-lg border p-3 cursor-pointer hover:bg-secondary/30"><input type="checkbox" checked={!!form.encrypt} onChange={e => setForm((p: any) => ({ ...p, encrypt: e.target.checked }))} /><span>{t("encryptBackups")}</span></label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1"><Label className="text-xs">{t("backupDirectory")}</Label><Input value={form.backupDir || ""} onChange={e => setForm((p: any) => ({ ...p, backupDir: e.target.value }))} className="h-8 text-sm" /></div>
            <div className="space-y-1"><Label className="text-xs">{t("passwordHint")}</Label><Input value={form.passwordHint || ""} onChange={e => setForm((p: any) => ({ ...p, passwordHint: e.target.value }))} placeholder={t("passwordHintExample")} className="h-8 text-sm" /></div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <div className="space-y-1"><Label className="text-xs">{t("hourly")}</Label><Input type="number" value={form.retention?.hourly || 24} onChange={e => setRetention("hourly", Number(e.target.value || 24))} className="h-8 text-sm" /></div>
            <div className="space-y-1"><Label className="text-xs">{t("daily")}</Label><Input type="number" value={form.retention?.daily || 7} onChange={e => setRetention("daily", Number(e.target.value || 7))} className="h-8 text-sm" /></div>
            <div className="space-y-1"><Label className="text-xs">{t("weekly")}</Label><Input type="number" value={form.retention?.weekly || 4} onChange={e => setRetention("weekly", Number(e.target.value || 4))} className="h-8 text-sm" /></div>
            <div className="space-y-1"><Label className="text-xs">{t("monthly")}</Label><Input type="number" value={form.retention?.monthly || 12} onChange={e => setRetention("monthly", Number(e.target.value || 12))} className="h-8 text-sm" /></div>
            <div className="space-y-1"><Label className="text-xs">{t("yearly")}</Label><Input type="number" value={form.retention?.yearly || 2} onChange={e => setRetention("yearly", Number(e.target.value || 2))} className="h-8 text-sm" /></div>
          </div>
          <div className="flex items-end"><Button size="sm" className="bg-primary" onClick={() => saveMutation.mutate()}>{t("saveBackupConfig")}</Button></div>
          <div className="rounded-lg border p-3 text-xs text-muted-foreground">{t("backupSchedulerHint")}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-sm">{t("backupRunNow")}</CardTitle><CardDescription>{t("backupRunHint")}</CardDescription></CardHeader>
        <CardContent className="space-y-3 text-sm">
          {form.encrypt && <div className="space-y-1"><Label className="text-xs">{t("backupPassword")}</Label><Input type="password" value={runPassword} onChange={e => setRunPassword(e.target.value)} className="h-8 text-sm" /></div>}
          <Button size="sm" onClick={() => runMutation.mutate()} className="bg-primary">{t("startBackup")}</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-sm">{t("existingBackups")}</CardTitle><CardDescription>{(backupsQuery.data || []).length} {t("backupsDetected")}</CardDescription></CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div className="rounded-lg border p-3 text-xs text-amber-950 bg-amber-50 border-amber-300">{t("restoreBackupConfirm")}</div>
          <div className="rounded-lg border p-3 space-y-3">
            <div className="font-medium text-foreground">{t("uploadBackup")}</div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="space-y-1 md:col-span-2">
                <Label className="text-xs">{t("uploadBackupFile")}</Label>
                <Input type="file" accept=".bak,.enc" onChange={e => setUploadFile(e.target.files?.[0] || null)} className="h-8 text-sm" />
                <p className="text-xs text-muted-foreground">{t("uploadBackupHint")}</p>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">{t("restoreBackupPassword")}</Label>
                <Input type="password" value={uploadPassword} onChange={e => setUploadPassword(e.target.value)} placeholder={t("restoreBackupPasswordHint")} className="h-8 text-sm" />
              </div>
            </div>
            <Button size="sm" variant="outline" onClick={() => uploadRestoreMutation.mutate()} disabled={uploadRestoreMutation.isPending || !uploadFile}>{t("restoreBackupNow")}</Button>
          </div>
          {(backupsQuery.data || []).map((item: any) => (
            <div key={item.fileName} className={`rounded-lg border p-3 flex flex-col gap-3 ${item.backendMismatch ? "border-amber-300 bg-amber-50/60" : ""}`}>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                <div>
                  <div className="font-medium text-foreground">{item.fileName}</div>
                  <div className="text-xs text-muted-foreground">{slotLabel(item.slot)} · {item.createdAt} · {(item.size / 1024).toFixed(1)} KB</div>
                  <div className="text-xs text-muted-foreground">Backend im Backup: <span className="font-medium text-foreground">{item.backend || "Unbekannt / Altformat"}</span></div>
                  {item.sha256 && (
                    <div className="text-[10px] text-muted-foreground font-mono mt-1 select-all break-all bg-muted/40 p-1.5 rounded border border-border/50 max-w-full">
                      SHA-256: {item.sha256}
                    </div>
                  )}
                  {item.backendMismatch && <div className="text-xs text-amber-900 font-medium mt-1">Dieses Backup passt nicht 1:1 zum aktuell aktiven Backend. Lowdb → SQLite wird beim Restore jetzt automatisch migriert; andere Mismatches werden weiter blockiert.</div>}
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  {item.sha256 && (
                    <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs font-semibold px-2 py-0.5 rounded-full flex items-center gap-1">
                      <span>🛡️</span> SHA-256 Verifiziert
                    </Badge>
                  )}
                  <StatusBadge value={item.encrypted ? t("backupEncrypted") : t("backupUnencrypted")} className="capitalize" />
                </div>
              </div>
              <div className="flex flex-col md:flex-row md:items-end gap-2">
                {item.encrypted && (
                  <div className="space-y-1 md:min-w-72">
                    <Label className="text-xs">{t("restoreBackupPassword")}</Label>
                    <Input type="password" value={restorePassword} onChange={e => setRestorePassword(e.target.value)} placeholder={t("restoreBackupPasswordHint")} className="h-8 text-sm" />
                  </div>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => restoreMutation.mutate({ fileName: item.fileName, encrypted: !!item.encrypted })}
                  disabled={restoreMutation.isPending || (item.encrypted && !restorePassword) || (item.backendMismatch && item.backend !== "lowdb")}
                >
                  {t("restoreBackupNow")}
                </Button>
              </div>
            </div>
          ))}
          {!(backupsQuery.data || []).length && <div className="text-sm text-muted-foreground">{t("noBackups")}</div>}
        </CardContent>
      </Card>
    </div>
  );
}

function BeschaeftigtenDatenschutzPage() {
  const { t } = useI18n();
  const [location] = useLocation();
  const rawEmployeeFilter = new URLSearchParams(location.split("?")[1] || "").get("filter") || "";
  const { activeMandantId } = useMandant();
  const qc = useQueryClient();
  const { data: dokumente, create, update } = useModuleData("dokumente");
  const { data: aufgaben = [] } = useModuleData("aufgaben");
  const { data: pdca = [] } = useModuleData("pdca");
  const { data: schulungsMeta = [] } = useQuery({
    queryKey: ["/api/meta/beschaeftigten-datenschutz"],
    queryFn: () => apiRequest("GET", "/api/meta/beschaeftigten-datenschutz").then(r => r.json()),
  });
  const { toast } = useToast();
  const existingCheck = dokumente.find((d: any) => d.kategorie === "prozessbeschreibung" && d.dokumentTyp === "beschaeftigten_datenschutz_check");

  const parseJson = (raw: string | null | undefined, fallback: any) => {
    if (!raw) return fallback;
    try { return JSON.parse(raw); } catch { return fallback; }
  };

  const baseForm = {
    datenschutzerklaerungVorhanden: false,
    datenschutzerklaerungStand: "",
    datenschutzerklaerungNaechstePruefung: "",
    verpflichtungVerschwiegenheit: false,
    verpflichtungVerschwiegenheitStand: "",
    verpflichtungTelekommunikation: false,
    verpflichtungTelekommunikationStand: "",
    schulungDurchgefuehrt: false,
    letzteSchulungAm: "",
    schulungsintervallMonate: 12,
    naechsteSchulungAm: "",
    schulungsformat: "praesenz",
    zielgruppen: [],
    nachweise: "",
    offeneMassnahmen: "",
    notes: "",
  };

  const [form, setForm] = useState<any>(baseForm);

  useEffect(() => {
    const parsed = parseJson(existingCheck?.inhalt, baseForm);
    setForm((prev: any) => ({ ...prev, ...parsed, zielgruppen: Array.isArray(parsed.zielgruppen) ? parsed.zielgruppen : (prev.zielgruppen || []) }));
  }, [existingCheck?.id]);

  const set = (key: string, value: any) => setForm((prev: any) => ({ ...prev, [key]: value }));
  const toggleZielgruppe = (value: string) => setForm((prev: any) => ({ ...prev, zielgruppen: prev.zielgruppen.includes(value) ? prev.zielgruppen.filter((x: string) => x !== value) : [...prev.zielgruppen, value] }));

  const todayIso = new Date().toISOString().split("T")[0];
  const status = form.datenschutzerklaerungVorhanden && form.verpflichtungVerschwiegenheit && form.verpflichtungTelekommunikation && form.schulungDurchgefuehrt
    ? { label: "Strukturiert", cls: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" }
    : form.datenschutzerklaerungVorhanden || form.verpflichtungVerschwiegenheit || form.verpflichtungTelekommunikation || form.schulungDurchgefuehrt
      ? { label: "Teilweise", cls: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30" }
      : { label: "Offen", cls: "bg-red-500/15 text-red-400 border-red-500/30" };

  const trainingOverdue = !!form.naechsteSchulungAm && form.naechsteSchulungAm < todayIso;
  const missingPrivacyNotice = !form.datenschutzerklaerungVorhanden;
  const missingConfidentiality = !form.verpflichtungVerschwiegenheit;
  const missingTelecomCommitment = !form.verpflichtungTelekommunikation;
  const missingTraining = !form.schulungDurchgefuehrt;
  const missingEvidence = !String(form.nachweise || "").trim();
  const missingTargetGroups = !Array.isArray(form.zielgruppen) || form.zielgruppen.length === 0;

  const matchesEmployeeFilter =
    (rawEmployeeFilter === "training-overdue" && trainingOverdue) ||
    (rawEmployeeFilter === "missing-privacy-notice" && missingPrivacyNotice) ||
    (rawEmployeeFilter === "missing-confidentiality" && missingConfidentiality) ||
    (rawEmployeeFilter === "missing-telecom" && missingTelecomCommitment) ||
    (rawEmployeeFilter === "missing-training" && missingTraining) ||
    (rawEmployeeFilter === "missing-evidence" && missingEvidence) ||
    (rawEmployeeFilter === "missing-target-groups" && missingTargetGroups) ||
    !rawEmployeeFilter;

  const buildEmployeeTaskDraft = (kind: "training-overdue" | "missing-privacy-notice" | "missing-confidentiality" | "missing-telecom" | "missing-training" | "missing-evidence" | "missing-target-groups") => {
    const drafts: Record<string, { title: string; priority: string; description: string }> = {
      "training-overdue": { title: "Beschäftigtenschulung überfällig nachziehen", priority: "hoch", description: "Die nächste Datenschutzschulung für Beschäftigte ist überfällig. Bitte Termin, Zielgruppen und Nachweise kurzfristig nachziehen." },
      "missing-privacy-notice": { title: "Datenschutzerklärung für Beschäftigte dokumentieren", priority: "hoch", description: "Für den Beschäftigtendatenschutz fehlt die dokumentierte Datenschutzerklärung. Bitte Rechtsinformation und Prüfzyklus ergänzen." },
      "missing-confidentiality": { title: "Verpflichtung auf Vertraulichkeit nachziehen", priority: "hoch", description: "Die Verpflichtung auf Verschwiegenheit/Vertraulichkeit ist noch nicht dokumentiert. Bitte Verpflichtung operativ absichern." },
      "missing-telecom": { title: "Telekommunikationsverpflichtung dokumentieren", priority: "mittel", description: "Die Verpflichtung zu Telekommunikation/Fernmeldegeheimnis ist offen. Bitte dokumentarisch und organisatorisch schließen." },
      "missing-training": { title: "Beschäftigtendatenschutz-Schulung durchführen", priority: "hoch", description: "Für Beschäftigte ist noch keine Datenschutzschulung dokumentiert. Bitte Schulung terminieren und Nachweise erfassen." },
      "missing-evidence": { title: "Nachweise im Beschäftigtendatenschutz ergänzen", priority: "mittel", description: "Es fehlen belastbare Nachweise oder Dokumentationsstände zu Unterrichtung, Verpflichtung oder Schulung." },
      "missing-target-groups": { title: "Zielgruppen für Beschäftigtendatenschutz definieren", priority: "mittel", description: "Die relevanten Zielgruppen für Schulung und Information sind noch nicht dokumentiert. Bitte Rollen und Gruppen nachziehen." },
    };
    const draft = drafts[kind];
    const params = new URLSearchParams({ draftTitle: draft.title, draftPriority: draft.priority, draftDescription: draft.description, draftSource: `employee:${kind}` });
    return { href: `/aufgaben?${params.toString()}`, title: draft.title, priority: draft.priority, description: draft.description, source: `employee:${kind}` };
  };

  const createEmployeeFollowUpTask = async (kind: "training-overdue" | "missing-privacy-notice" | "missing-confidentiality" | "missing-telecom" | "missing-training" | "missing-evidence" | "missing-target-groups") => {
    const draft = buildEmployeeTaskDraft(kind);
    const duplicate = aufgaben.find((task: any) => String(task?.vorlagenBezug || "") === draft.source && String(task?.status || "") !== "erledigt");
    if (duplicate) {
      toast({ title: "Aufgabe bereits vorhanden", description: `Offene Folgeaufgabe gefunden: ${duplicate.titel}` });
      return;
    }
    await apiRequest("POST", `/api/mandanten/${activeMandantId}/aufgaben`, {
      titel: draft.title,
      beschreibung: draft.description,
      typ: kind === "training-overdue" || kind === "missing-training" ? "review" : "task",
      prioritaet: draft.priority,
      status: "offen",
      fortschritt: 0,
      verantwortlicher: "",
      faelligAm: kind === "training-overdue" ? todayIso : "",
      kategorie: "beschaeftigtendatenschutz",
      referenzId: existingCheck?.id || null,
      vorlagenBezug: draft.source,
    });
    await qc.invalidateQueries({ queryKey: [`/api/mandanten/${activeMandantId}/aufgaben`] });
    toast({ title: "Folgeaufgabe erstellt", description: draft.title });
  };

  const createEmployeePdcaCycle = async (kind: "training-overdue" | "missing-privacy-notice" | "missing-confidentiality" | "missing-telecom" | "missing-training" | "missing-evidence" | "missing-target-groups") => {
    const source = `employee-pdca:${kind}`;
    const duplicate = pdca.find((entry: any) => String(entry?.actNaechsterZyklus || "").includes(source) && String(entry?.status || "") !== "abgeschlossen");
    if (duplicate) {
      toast({ title: "PDCA bereits vorhanden", description: `Offener Zyklus gefunden: ${duplicate.titel}` });
      return;
    }
    const reviewDate = new Date();
    reviewDate.setDate(reviewDate.getDate() + (kind === "training-overdue" || kind === "missing-training" ? 7 : 14));
    const titleMap: Record<string, string> = {
      "training-overdue": "PDCA Beschäftigtenschulung",
      "missing-privacy-notice": "PDCA Beschäftigtendatenschutzerklärung",
      "missing-confidentiality": "PDCA Verpflichtung Vertraulichkeit",
      "missing-telecom": "PDCA Telekommunikationsverpflichtung",
      "missing-training": "PDCA Datenschutzschulung Beschäftigte",
      "missing-evidence": "PDCA Nachweise Beschäftigtendatenschutz",
      "missing-target-groups": "PDCA Zielgruppen Beschäftigtendatenschutz",
    };
    const pdcaItem = await apiRequest("POST", `/api/mandanten/${activeMandantId}/pdca`, {
      titel: titleMap[kind],
      beschreibung: "Automatisch vorbereiteter Verbesserungszyklus für Beschäftigtendatenschutz und Schulungsgovernance.",
      zyklusTyp: "verbesserungsmassnahme",
      status: "geplant",
      prioritaet: ["training-overdue", "missing-training", "missing-privacy-notice", "missing-confidentiality"].includes(kind) ? "hoch" : "mittel",
      verantwortlicher: "",
      naechstePruefungAm: reviewDate.toISOString().split("T")[0],
      planRisiken: `Status: ${status.label}\nZielgruppen: ${(form.zielgruppen || []).join(", ") || "keine dokumentiert"}`,
      planMassnahmen: buildEmployeeTaskDraft(kind).description,
      planZiele: "Beschäftigtendatenschutz dokumentiert, nachweisbar und wiederkehrend gesteuert aufsetzen.",
      actNaechsterZyklus: source,
      verknuepftesAuditId: null,
    }).then(r => r.json());
    await apiRequest("POST", `/api/mandanten/${activeMandantId}/aufgaben`, {
      titel: `${titleMap[kind]} – Folgeaufgabe`,
      beschreibung: `Operative Folgeaufgabe zum Verbesserungszyklus ${titleMap[kind]}.`,
      typ: kind === "training-overdue" || kind === "missing-training" ? "review" : "task",
      prioritaet: ["training-overdue", "missing-training", "missing-privacy-notice", "missing-confidentiality"].includes(kind) ? "hoch" : "mittel",
      status: "offen",
      fortschritt: 0,
      verantwortlicher: "",
      faelligAm: reviewDate.toISOString().split("T")[0],
      kategorie: "beschaeftigtendatenschutz",
      referenzId: pdcaItem.id,
      vorlagenBezug: "pdca_follow_up",
    });
    await qc.invalidateQueries({ queryKey: [`/api/mandanten/${activeMandantId}/pdca`] });
    await qc.invalidateQueries({ queryKey: [`/api/mandanten/${activeMandantId}/aufgaben`] });
    toast({ title: "PDCA-Zyklus erstellt", description: titleMap[kind] });
  };

  const save = async () => {
    const payload = {
      titel: "Prüfung Beschäftigtendatenschutz und Schulungsstatus",
      kategorie: "prozessbeschreibung",
      dokumentTyp: "beschaeftigten_datenschutz_check",
      status: status.label === "Strukturiert" ? "aktiv" : "entwurf",
      version: "1.0",
      beschreibung: "Erfassung von Datenschutzerklärung für Beschäftigte, Verpflichtungen, Telekommunikationsverpflichtung und Schulungsstatus.",
      inhalt: JSON.stringify(form),
    };
    try {
      if (existingCheck) await update.mutateAsync({ id: existingCheck.id, ...payload });
      else await create.mutateAsync(payload);
      toast({ title: "Beschäftigtendatenschutz gespeichert" });
    } catch {
      toast({ title: "Fehler", description: "Beschäftigtendatenschutz konnte nicht gespeichert werden.", variant: "destructive" });
    }
  };

  const meta = schulungsMeta || {};
  if (!matchesEmployeeFilter) {
    return (
      <MandantGuard>
        <div className="space-y-6">
          <PageHeader title={t("employeePrivacyTitle")} desc={t("employeePrivacyDesc")} />
          <Card className="border-dashed"><CardContent className="py-12 text-center text-sm text-muted-foreground">Für diesen Beschäftigtendatenschutz-Fokus liegt aktuell kein Treffer vor.</CardContent></Card>
        </div>
      </MandantGuard>
    );
  }
  return (
    <MandantGuard>
      <div className="space-y-6">
        <PageHeader title={t("employeePrivacyTitle")} desc={t("employeePrivacyDesc")} />
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <div>
                <CardTitle className="text-sm">Beschäftigtendatenschutz-Check</CardTitle>
                <CardDescription>Dokumentations- und Schulungsstand für Beschäftigte</CardDescription>
              </div>
              <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${status.cls}`}>{status.label}</span>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <Card className="border-border/60 bg-muted/20">
              <CardContent className="p-4 space-y-2 text-sm">
                {trainingOverdue && <p className="text-red-400">Beschäftigtenschulung überfällig</p>}
                {missingPrivacyNotice && <p className="text-red-400">Datenschutzerklärung für Beschäftigte fehlt</p>}
                {missingConfidentiality && <p className="text-red-400">Verpflichtung auf Vertraulichkeit fehlt</p>}
                {missingTelecomCommitment && <p className="text-yellow-400">Telekommunikationsverpflichtung fehlt</p>}
                {missingTraining && <p className="text-yellow-400">Datenschutzschulung für Beschäftigte fehlt</p>}
                {missingEvidence && <p className="text-yellow-400">Nachweise / Dokumentationsstand fehlen</p>}
                {missingTargetGroups && <p className="text-yellow-400">Zielgruppen für Unterrichtung/Schulung fehlen</p>}
              </CardContent>
            </Card>
            {(trainingOverdue || missingPrivacyNotice || missingConfidentiality || missingTelecomCommitment || missingTraining || missingEvidence || missingTargetGroups) && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Fokusliste Beschäftigtendatenschutz</CardTitle>
                  <CardDescription>Operative Folgeaktionen für die aktuell wichtigsten Lücken</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  {trainingOverdue && <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-3"><p className="font-medium text-red-700 dark:text-red-400">Schulung überfällig</p><div className="mt-2 flex gap-2"><Button type="button" size="sm" variant="secondary" onClick={() => createEmployeeFollowUpTask("training-overdue")}>Aufgabe erzeugen</Button><Button type="button" size="sm" variant="secondary" onClick={() => createEmployeePdcaCycle("training-overdue")}>PDCA erzeugen</Button><Link href={buildEmployeeTaskDraft("training-overdue").href}><a className="text-xs text-primary hover:underline self-center">Aufgabe vorbereiten</a></Link></div></div>}
                  {missingPrivacyNotice && <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-3"><p className="font-medium text-red-700 dark:text-red-400">Datenschutzerklärung fehlt</p><div className="mt-2 flex gap-2"><Button type="button" size="sm" variant="secondary" onClick={() => createEmployeeFollowUpTask("missing-privacy-notice")}>Aufgabe erzeugen</Button><Button type="button" size="sm" variant="secondary" onClick={() => createEmployeePdcaCycle("missing-privacy-notice")}>PDCA erzeugen</Button><Link href={buildEmployeeTaskDraft("missing-privacy-notice").href}><a className="text-xs text-primary hover:underline self-center">Aufgabe vorbereiten</a></Link></div></div>}
                  {missingConfidentiality && <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-3"><p className="font-medium text-red-700 dark:text-red-400">Vertraulichkeitsverpflichtung fehlt</p><div className="mt-2 flex gap-2"><Button type="button" size="sm" variant="secondary" onClick={() => createEmployeeFollowUpTask("missing-confidentiality")}>Aufgabe erzeugen</Button><Button type="button" size="sm" variant="secondary" onClick={() => createEmployeePdcaCycle("missing-confidentiality")}>PDCA erzeugen</Button><Link href={buildEmployeeTaskDraft("missing-confidentiality").href}><a className="text-xs text-primary hover:underline self-center">Aufgabe vorbereiten</a></Link></div></div>}
                </CardContent>
              </Card>
            )}
            <label className="flex items-center gap-2 rounded-lg border p-3 cursor-pointer hover:bg-secondary/30"><input type="checkbox" checked={!!form.datenschutzerklaerungVorhanden} onChange={e => set("datenschutzerklaerungVorhanden", e.target.checked)} className="rounded" /><span>Datenschutzerklärung für Beschäftigte vorhanden</span></label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1"><Label className="text-xs">Stand Datenschutzerklärung</Label><Input type="date" value={form.datenschutzerklaerungStand || ""} onChange={e => set("datenschutzerklaerungStand", e.target.value)} className="h-8 text-sm" /></div>
              <div className="space-y-1"><Label className="text-xs">Nächste Prüfung</Label><Input type="date" value={form.datenschutzerklaerungNaechstePruefung || ""} onChange={e => set("datenschutzerklaerungNaechstePruefung", e.target.value)} className="h-8 text-sm" /></div>
            </div>
            <label className="flex items-center gap-2 rounded-lg border p-3 cursor-pointer hover:bg-secondary/30"><input type="checkbox" checked={!!form.verpflichtungVerschwiegenheit} onChange={e => set("verpflichtungVerschwiegenheit", e.target.checked)} className="rounded" /><span>Verpflichtung auf Vertraulichkeit / Verschwiegenheit dokumentiert</span></label>
            <div className="space-y-1"><Label className="text-xs">Stand Verpflichtung Verschwiegenheit</Label><Input type="date" value={form.verpflichtungVerschwiegenheitStand || ""} onChange={e => set("verpflichtungVerschwiegenheitStand", e.target.value)} className="h-8 text-sm" /></div>
            <label className="flex items-center gap-2 rounded-lg border p-3 cursor-pointer hover:bg-secondary/30"><input type="checkbox" checked={!!form.verpflichtungTelekommunikation} onChange={e => set("verpflichtungTelekommunikation", e.target.checked)} className="rounded" /><span>Verpflichtung Telekommunikation / Fernmeldegeheimnis dokumentiert</span></label>
            <div className="space-y-1"><Label className="text-xs">Stand Verpflichtung Telekommunikation</Label><Input type="date" value={form.verpflichtungTelekommunikationStand || ""} onChange={e => set("verpflichtungTelekommunikationStand", e.target.value)} className="h-8 text-sm" /></div>
            <label className="flex items-center gap-2 rounded-lg border p-3 cursor-pointer hover:bg-secondary/30"><input type="checkbox" checked={!!form.schulungDurchgefuehrt} onChange={e => set("schulungDurchgefuehrt", e.target.checked)} className="rounded" /><span>Datenschutzschulung durchgeführt</span></label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1"><Label className="text-xs">Letzte Schulung</Label><Input type="date" value={form.letzteSchulungAm || ""} onChange={e => set("letzteSchulungAm", e.target.value)} className="h-8 text-sm" /></div>
              <div className="space-y-1"><Label className="text-xs">Nächste Schulung</Label><Input type="date" value={form.naechsteSchulungAm || ""} onChange={e => set("naechsteSchulungAm", e.target.value)} className="h-8 text-sm" /></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1"><Label className="text-xs">Wiederholung in Monaten</Label><Input type="number" value={form.schulungsintervallMonate || 12} onChange={e => set("schulungsintervallMonate", Number(e.target.value || 0))} className="h-8 text-sm" /></div>
              <div className="space-y-1"><Label className="text-xs">Schulungsformat</Label><Select value={form.schulungsformat || "praesenz"} onValueChange={v => set("schulungsformat", v)}><SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger><SelectContent>{(meta.schulungsformate || ["praesenz", "online", "hybrid"]).map((s: string) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select></div>
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Zielgruppen</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {(meta.zielgruppen || ["Beschäftigte", "Führungskräfte", "HR", "IT", "Support", "Vertrieb"]).map((zg: string) => (
                  <label key={zg} className="flex items-center gap-2 rounded-lg border p-3 cursor-pointer hover:bg-secondary/30">
                    <input type="checkbox" checked={form.zielgruppen.includes(zg)} onChange={() => toggleZielgruppe(zg)} className="rounded" />
                    <span>{zg}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="space-y-1"><Label className="text-xs">Nachweise / Dokumentationsstand</Label><Textarea value={form.nachweise || ""} onChange={e => set("nachweise", e.target.value)} className="text-sm min-h-20" /></div>
            <div className="space-y-1"><Label className="text-xs">Offene Maßnahmen / Wiederschulungshinweise</Label><Textarea value={form.offeneMassnahmen || ""} onChange={e => set("offeneMassnahmen", e.target.value)} className="text-sm min-h-20" /></div>
            <div className="space-y-1"><Label className="text-xs">Notizen</Label><Textarea value={form.notes || ""} onChange={e => set("notes", e.target.value)} className="text-sm min-h-20" /></div>
            <DialogFooter><Button size="sm" className="bg-primary" onClick={save}>Speichern</Button></DialogFooter>
          </CardContent>
        </Card>
      </div>
    </MandantGuard>
  );
}

function WebDatenschutzPage() {
  const { t } = useI18n();
  const [location] = useLocation();
  const rawWebPrivacyFilter = new URLSearchParams(location.split("?")[1] || "").get("filter") || "";
  const { activeMandantId } = useMandant();
  const qc = useQueryClient();
  const { data: dokumente, create, update } = useModuleData("dokumente");
  const { data: aufgaben = [] } = useModuleData("aufgaben");
  const { data: pdca = [] } = useModuleData("pdca");
  const { toast } = useToast();
  const websitePrivacy = dokumente.find((d: any) => d.kategorie === "prozessbeschreibung" && d.dokumentTyp === "web_datenschutz_check");
  const companyNotice = dokumente.find((d: any) => d.kategorie === "prozessbeschreibung" && d.dokumentTyp === "datenschutzhinweise_check");

  const parseJson = (raw: string | null | undefined, fallback: any) => {
    if (!raw) return fallback;
    try { return JSON.parse(raw); } catch { return fallback; }
  };

  const [websiteForm, setWebsiteForm] = useState<any>({
    consentToolRequired: false,
    consentTool: false,
    consentToolNotRequiredReasons: [],
    consentToolNotRequiredReason: "",
    datenschutzerklaerungGeprueft: false,
    impressumGeprueft: false,
    privacyPagePath: "/ds",
    notes: "",
  });
  const [noticeForm, setNoticeForm] = useState<any>({
    format: "einzeldokumente",
    groups: {
      betroffene: false,
      interessenten: false,
      bewerber: false,
      lieferanten: false,
      besucher: false,
      kunden: false,
    },
    distributionEmail: false,
    distributionQr: false,
    websiteSubpage: true,
    notes: "",
  });

  useEffect(() => {
    const parsed = parseJson(websitePrivacy?.inhalt, websiteForm);
    setWebsiteForm((prev: any) => ({ ...prev, ...parsed }));
  }, [websitePrivacy?.id]);

  useEffect(() => {
    const parsed = parseJson(companyNotice?.inhalt, noticeForm);
    setNoticeForm((prev: any) => ({ ...prev, ...parsed, groups: { ...prev.groups, ...(parsed.groups || {}) } }));
  }, [companyNotice?.id]);

  const saveWebsiteCheck = async () => {
    const payload = {
      titel: "Prüfung Webseite: Datenschutzerklärung und Impressum",
      kategorie: "prozessbeschreibung",
      dokumentTyp: "web_datenschutz_check",
      status: (!websiteForm.consentToolRequired || websiteForm.consentTool) && websiteForm.datenschutzerklaerungGeprueft && websiteForm.impressumGeprueft ? "aktiv" : "entwurf",
      version: "1.0",
      beschreibung: "Prüfstatus für Webseiten-Datenschutz, Consent-Tool, Datenschutzerklärung und Impressum.",
      inhalt: JSON.stringify(websiteForm),
    };
    try {
      if (websitePrivacy) await update.mutateAsync({ id: websitePrivacy.id, ...payload });
      else await create.mutateAsync(payload);
      toast({ title: "Web-Datenschutz gespeichert" });
    } catch {
      toast({ title: "Fehler", description: "Web-Datenschutz konnte nicht gespeichert werden.", variant: "destructive" });
    }
  };

  const saveNoticeCheck = async () => {
    const payload = {
      titel: "Prüfung Datenschutzhinweise für Personengruppen",
      kategorie: "prozessbeschreibung",
      dokumentTyp: "datenschutzhinweise_check",
      status: (noticeForm.distributionEmail || noticeForm.distributionQr || noticeForm.websiteSubpage) ? "aktiv" : "entwurf",
      version: "1.0",
      beschreibung: "Prüfstatus zu Datenschutzhinweisen für Betroffene, Interessenten, Bewerber, Lieferanten und weitere Gruppen.",
      inhalt: JSON.stringify(noticeForm),
    };
    try {
      if (companyNotice) await update.mutateAsync({ id: companyNotice.id, ...payload });
      else await create.mutateAsync(payload);
      toast({ title: "Datenschutzhinweise gespeichert" });
    } catch {
      toast({ title: "Fehler", description: "Datenschutzhinweise konnten nicht gespeichert werden.", variant: "destructive" });
    }
  };

  const setWebsite = (key: string, value: any) => setWebsiteForm((prev: any) => ({ ...prev, [key]: value }));
  const setNotice = (key: string, value: any) => setNoticeForm((prev: any) => ({ ...prev, [key]: value }));
  const toggleGroup = (key: string) => setNoticeForm((prev: any) => ({ ...prev, groups: { ...prev.groups, [key]: !prev.groups[key] } }));

  const selectedConsentReasons = Array.isArray(websiteForm.consentToolNotRequiredReasons) ? websiteForm.consentToolNotRequiredReasons : [];
  const hasManualConsentReason = selectedConsentReasons.includes("manual") && !!String(websiteForm.consentToolNotRequiredReason || "").trim();
  const hasPresetConsentReason = selectedConsentReasons.some((reason: string) => reason !== "manual");
  const consentRequirementDocumented = websiteForm.consentToolRequired || (!websiteForm.consentToolRequired && (hasPresetConsentReason || hasManualConsentReason));
  const websiteChecks = [consentRequirementDocumented, !websiteForm.consentToolRequired || websiteForm.consentTool, websiteForm.datenschutzerklaerungGeprueft, websiteForm.impressumGeprueft];
  const websiteDone = websiteChecks.filter(Boolean).length;
  const websiteStatus = websiteDone === websiteChecks.length ? { label: "Vollständig", cls: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" } : websiteDone > 0 ? { label: "Teilweise", cls: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30" } : { label: "Offen", cls: "bg-red-500/15 text-red-400 border-red-500/30" };
  const selectedGroupCount = Object.values(noticeForm.groups || {}).filter(Boolean).length;
  const noticeDistributionCount = [noticeForm.distributionEmail, noticeForm.distributionQr, noticeForm.websiteSubpage].filter(Boolean).length;
  const noticeStatus = selectedGroupCount > 0 && noticeDistributionCount > 0 ? { label: "Vollständig", cls: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" } : selectedGroupCount > 0 || noticeDistributionCount > 0 ? { label: "Teilweise", cls: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30" } : { label: "Offen", cls: "bg-red-500/15 text-red-400 border-red-500/30" };
  const webConsentMissing = !!websiteForm.consentToolRequired && !websiteForm.consentTool;
  const webConsentReasonMissing = !websiteForm.consentToolRequired && !consentRequirementDocumented;
  const webPrivacyNoticeMissing = !websiteForm.datenschutzerklaerungGeprueft;
  const webImpressumMissing = !websiteForm.impressumGeprueft;
  const noticeGroupsMissing = selectedGroupCount === 0;
  const noticeDistributionMissing = noticeDistributionCount === 0;
  const webNoticeNotesMissing = !String(noticeForm.notes || "").trim() && !String(websiteForm.notes || "").trim();

  const matchesWebFilter =
    (rawWebPrivacyFilter === "consent-missing" && webConsentMissing) ||
    (rawWebPrivacyFilter === "consent-reason-missing" && webConsentReasonMissing) ||
    (rawWebPrivacyFilter === "privacy-notice-missing" && webPrivacyNoticeMissing) ||
    (rawWebPrivacyFilter === "impressum-missing" && webImpressumMissing) ||
    (rawWebPrivacyFilter === "groups-missing" && noticeGroupsMissing) ||
    (rawWebPrivacyFilter === "distribution-missing" && noticeDistributionMissing) ||
    (rawWebPrivacyFilter === "notes-missing" && webNoticeNotesMissing) ||
    !rawWebPrivacyFilter;

  const buildWebTaskDraft = (kind: "consent-missing" | "consent-reason-missing" | "privacy-notice-missing" | "impressum-missing" | "groups-missing" | "distribution-missing" | "notes-missing") => {
    const drafts: Record<string, { title: string; priority: string; description: string }> = {
      "consent-missing": { title: "Consent-Tool für Webauftritt nachziehen", priority: "hoch", description: "Für die Webseite ist ein Consent-Tool erforderlich, aber noch nicht als vorhanden/geprüft dokumentiert." },
      "consent-reason-missing": { title: "Begründung für fehlendes Consent-Tool dokumentieren", priority: "mittel", description: "Es wurde kein Consent-Tool vorgesehen, aber die rechtliche Begründung dafür ist nicht belastbar dokumentiert." },
      "privacy-notice-missing": { title: "Datenschutzerklärung der Webseite prüfen", priority: "hoch", description: "Die inhaltliche Prüfung der Datenschutzerklärung der Webseite ist noch offen." },
      "impressum-missing": { title: "Impressum der Webseite prüfen", priority: "mittel", description: "Die Impressumsprüfung für die Webseite wurde noch nicht dokumentiert." },
      "groups-missing": { title: "Datenschutzhinweise für Personengruppen definieren", priority: "mittel", description: "Relevante Personengruppen für Datenschutzhinweise sind noch nicht ausgewählt oder dokumentiert." },
      "distribution-missing": { title: "Ausspielweg für Datenschutzhinweise festlegen", priority: "mittel", description: "Für Datenschutzhinweise fehlt noch ein belastbarer Bereitstellungsweg wie E-Mail, QR oder Unterseite." },
      "notes-missing": { title: "Dokumentationsnotizen für Web-Datenschutz ergänzen", priority: "niedrig", description: "Im Web-Datenschutz- und Datenschutzhinweis-Block fehlen ergänzende Dokumentationsnotizen oder Prüfvermerke." },
    };
    const draft = drafts[kind];
    const params = new URLSearchParams({ draftTitle: draft.title, draftPriority: draft.priority, draftDescription: draft.description, draftSource: `web:${kind}` });
    return { href: `/aufgaben?${params.toString()}`, title: draft.title, priority: draft.priority, description: draft.description, source: `web:${kind}` };
  };

  const createWebFollowUpTask = async (kind: "consent-missing" | "consent-reason-missing" | "privacy-notice-missing" | "impressum-missing" | "groups-missing" | "distribution-missing" | "notes-missing") => {
    const draft = buildWebTaskDraft(kind);
    const duplicate = aufgaben.find((task: any) => String(task?.vorlagenBezug || "") === draft.source && String(task?.status || "") !== "erledigt");
    if (duplicate) {
      toast({ title: "Aufgabe bereits vorhanden", description: `Offene Folgeaufgabe gefunden: ${duplicate.titel}` });
      return;
    }
    await apiRequest("POST", `/api/mandanten/${activeMandantId}/aufgaben`, {
      titel: draft.title,
      beschreibung: draft.description,
      typ: ["privacy-notice-missing", "impressum-missing"].includes(kind) ? "review" : "task",
      prioritaet: draft.priority,
      status: "offen",
      fortschritt: 0,
      verantwortlicher: "",
      faelligAm: "",
      kategorie: "web-datenschutz",
      referenzId: websitePrivacy?.id || companyNotice?.id || null,
      vorlagenBezug: draft.source,
    });
    await qc.invalidateQueries({ queryKey: [`/api/mandanten/${activeMandantId}/aufgaben`] });
    toast({ title: "Folgeaufgabe erstellt", description: draft.title });
  };

  const createWebPdcaCycle = async (kind: "consent-missing" | "consent-reason-missing" | "privacy-notice-missing" | "impressum-missing" | "groups-missing" | "distribution-missing" | "notes-missing") => {
    const source = `web-pdca:${kind}`;
    const duplicate = pdca.find((entry: any) => String(entry?.actNaechsterZyklus || "").includes(source) && String(entry?.status || "") !== "abgeschlossen");
    if (duplicate) {
      toast({ title: "PDCA bereits vorhanden", description: `Offener Zyklus gefunden: ${duplicate.titel}` });
      return;
    }
    const reviewDate = new Date();
    reviewDate.setDate(reviewDate.getDate() + (["consent-missing", "privacy-notice-missing"].includes(kind) ? 7 : 14));
    const titleMap: Record<string, string> = {
      "consent-missing": "PDCA Consent-Management Webseite",
      "consent-reason-missing": "PDCA Consent-Begründung Webseite",
      "privacy-notice-missing": "PDCA Datenschutzerklärung Webseite",
      "impressum-missing": "PDCA Impressum Webseite",
      "groups-missing": "PDCA Datenschutzhinweise Personengruppen",
      "distribution-missing": "PDCA Bereitstellung Datenschutzhinweise",
      "notes-missing": "PDCA Dokumentation Web-Datenschutz",
    };
    const pdcaItem = await apiRequest("POST", `/api/mandanten/${activeMandantId}/pdca`, {
      titel: titleMap[kind],
      beschreibung: "Automatisch vorbereiteter Verbesserungszyklus für Web-Datenschutz und Datenschutzhinweise.",
      zyklusTyp: "verbesserungsmassnahme",
      status: "geplant",
      prioritaet: ["consent-missing", "privacy-notice-missing"].includes(kind) ? "hoch" : "mittel",
      verantwortlicher: "",
      naechstePruefungAm: reviewDate.toISOString().split("T")[0],
      planRisiken: `Webstatus: ${websiteStatus.label}\nHinweisstatus: ${noticeStatus.label}`,
      planMassnahmen: buildWebTaskDraft(kind).description,
      planZiele: "Web-Datenschutz und Datenschutzhinweise vollständig, dokumentiert und belastbar betreiben.",
      actNaechsterZyklus: source,
      verknuepftesAuditId: null,
    }).then(r => r.json());
    await apiRequest("POST", `/api/mandanten/${activeMandantId}/aufgaben`, {
      titel: `${titleMap[kind]} – Folgeaufgabe`,
      beschreibung: `Operative Folgeaufgabe zum Verbesserungszyklus ${titleMap[kind]}.`,
      typ: ["privacy-notice-missing", "impressum-missing"].includes(kind) ? "review" : "task",
      prioritaet: ["consent-missing", "privacy-notice-missing"].includes(kind) ? "hoch" : "mittel",
      status: "offen",
      fortschritt: 0,
      verantwortlicher: "",
      faelligAm: reviewDate.toISOString().split("T")[0],
      kategorie: "web-datenschutz",
      referenzId: pdcaItem.id,
      vorlagenBezug: "pdca_follow_up",
    });
    await qc.invalidateQueries({ queryKey: [`/api/mandanten/${activeMandantId}/pdca`] });
    await qc.invalidateQueries({ queryKey: [`/api/mandanten/${activeMandantId}/aufgaben`] });
    toast({ title: "PDCA-Zyklus erstellt", description: titleMap[kind] });
  };

  if (!matchesWebFilter) {
    return (
      <MandantGuard>
        <div className="space-y-6">
          <PageHeader title={t("webPrivacyTitle")} desc={t("webPrivacyDesc")} />
          <Card className="border-dashed"><CardContent className="py-12 text-center text-sm text-muted-foreground">Für diesen Web-Datenschutz-Fokus liegt aktuell kein Treffer vor.</CardContent></Card>
        </div>
      </MandantGuard>
    );
  }

  return (
    <MandantGuard>
      <div className="space-y-6">
        <PageHeader title={t("webPrivacyTitle")} desc={t("webPrivacyDesc")} />

        {(webConsentMissing || webConsentReasonMissing || webPrivacyNoticeMissing || webImpressumMissing || noticeGroupsMissing || noticeDistributionMissing || webNoticeNotesMissing) && (
          <Card className="border-amber-500/40 bg-amber-500/5">
            <CardHeader>
              <CardTitle className="text-sm">Fokusliste Web-Datenschutz</CardTitle>
              <CardDescription>Die wichtigsten operativen Lücken im Web- und Hinweis-Block</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {webConsentMissing && <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-3"><p className="font-medium text-red-700 dark:text-red-400">Consent-Tool fehlt trotz Erforderlichkeit</p><div className="mt-2 flex gap-2"><Button type="button" size="sm" variant="secondary" onClick={() => createWebFollowUpTask("consent-missing")}>Aufgabe erzeugen</Button><Button type="button" size="sm" variant="secondary" onClick={() => createWebPdcaCycle("consent-missing")}>PDCA erzeugen</Button><Link href={buildWebTaskDraft("consent-missing").href}><a className="text-xs text-primary hover:underline self-center">Aufgabe vorbereiten</a></Link></div></div>}
              {webPrivacyNoticeMissing && <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-3"><p className="font-medium text-red-700 dark:text-red-400">Datenschutzerklärung nicht geprüft</p><div className="mt-2 flex gap-2"><Button type="button" size="sm" variant="secondary" onClick={() => createWebFollowUpTask("privacy-notice-missing")}>Aufgabe erzeugen</Button><Button type="button" size="sm" variant="secondary" onClick={() => createWebPdcaCycle("privacy-notice-missing")}>PDCA erzeugen</Button><Link href={buildWebTaskDraft("privacy-notice-missing").href}><a className="text-xs text-primary hover:underline self-center">Aufgabe vorbereiten</a></Link></div></div>}
              {noticeGroupsMissing && <div className="rounded-lg border border-yellow-500/20 bg-yellow-500/5 p-3"><p className="font-medium text-yellow-700 dark:text-yellow-300">Personengruppen für Datenschutzhinweise fehlen</p><div className="mt-2 flex gap-2"><Button type="button" size="sm" variant="secondary" onClick={() => createWebFollowUpTask("groups-missing")}>Aufgabe erzeugen</Button><Button type="button" size="sm" variant="secondary" onClick={() => createWebPdcaCycle("groups-missing")}>PDCA erzeugen</Button><Link href={buildWebTaskDraft("groups-missing").href}><a className="text-xs text-primary hover:underline self-center">Aufgabe vorbereiten</a></Link></div></div>}
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <div>
                <CardTitle className="text-sm">Webseite: Datenschutzerklärung & Impressum</CardTitle>
                <CardDescription>Prüfkriterien für die öffentliche Webseite des Mandanten</CardDescription>
              </div>
              <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${websiteStatus.cls}`}>{websiteStatus.label}</span>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="space-y-2 rounded-lg border p-3">
              <p className="text-xs font-medium text-foreground">Consent-Tool nur prüfen, wenn es rechtlich erforderlich ist</p>
              <label className="flex items-center gap-2 rounded-lg border p-3 cursor-pointer hover:bg-secondary/30"><input type="checkbox" checked={!!websiteForm.consentToolRequired} onChange={e => {
                const checked = e.target.checked;
                setWebsite("consentToolRequired", checked);
                if (!checked) setWebsite("consentTool", false);
              }} className="rounded" /><span>Consent-Tool ist erforderlich, weil zustimmungspflichtige Dienste/Cookies eingesetzt werden</span></label>
              <label className="flex items-center gap-2 rounded-lg border p-3 cursor-pointer hover:bg-secondary/30"><input type="checkbox" checked={!!websiteForm.consentTool} onChange={e => setWebsite("consentTool", e.target.checked)} className="rounded" disabled={!websiteForm.consentToolRequired} /><span>Consent-Tool vorhanden und geprüft</span></label>
              <div className="space-y-1">
                <Label className="text-xs">Begründung, wenn kein Consent-Tool erforderlich ist</Label>
                <div className="grid grid-cols-1 gap-2">
                  {[
                    ["Es werden ausschließlich technisch unbedingt erforderliche Cookies oder vergleichbare Speicherungen genutzt.", "Nur technisch unbedingt erforderliche Cookies/Speicherungen"],
                    ["Es werden keine Analyse-, Marketing- oder Retargeting-Tools eingesetzt.", "Keine Analyse-, Marketing- oder Retargeting-Tools"],
                    ["Es sind keine externen Medien, Karten, eingebetteten Inhalte oder Drittanbieter-Skripte mit Einwilligungspflicht eingebunden.", "Keine externen Medien oder einwilligungspflichtigen Drittanbieter-Inhalte"],
                    ["manual", "Manuelle Begründung eingeben"],
                  ].map(([value, label]) => {
                    const selected = selectedConsentReasons.includes(String(value));
                    return (
                      <label key={String(value)} className="flex items-center gap-2 rounded-lg border p-3 cursor-pointer hover:bg-secondary/30">
                        <input
                          type="checkbox"
                          checked={selected}
                          disabled={!!websiteForm.consentToolRequired}
                          onChange={() => {
                            const current = Array.isArray(websiteForm.consentToolNotRequiredReasons) ? websiteForm.consentToolNotRequiredReasons : [];
                            const next = selected ? current.filter((item: string) => item !== value) : [...current, value];
                            setWebsite("consentToolNotRequiredReasons", next);
                            if (value === "manual" && selected) setWebsite("consentToolNotRequiredReason", "");
                          }}
                          className="rounded"
                        />
                        <span>{label}</span>
                      </label>
                    );
                  })}
                </div>
                {selectedConsentReasons.includes("manual") && (
                  <Textarea value={websiteForm.consentToolNotRequiredReason || ""} onChange={e => setWebsite("consentToolNotRequiredReason", e.target.value)} className="text-sm min-h-20" placeholder="Manuelle Begründung eintragen" disabled={!!websiteForm.consentToolRequired} />
                )}
                <p className="text-[11px] text-muted-foreground">Ein Consent-Tool ist regelmäßig nur erforderlich, wenn nicht technisch unbedingt erforderliche Cookies, Tracking, Marketing-Tags, externe Medien oder ähnliche zustimmungspflichtige Zugriffe nach § 25 TDDDG eingesetzt werden. Bei ausschließlich technisch erforderlichen Funktionen kann es entbehrlich sein, die Begründung sollte dann aber dokumentiert werden.</p>
              </div>
            </div>
            <label className="flex items-center gap-2 rounded-lg border p-3 cursor-pointer hover:bg-secondary/30"><input type="checkbox" checked={!!websiteForm.datenschutzerklaerungGeprueft} onChange={e => setWebsite("datenschutzerklaerungGeprueft", e.target.checked)} className="rounded" /><span>Inhaltliche Prüfung der Datenschutzerklärung durchgeführt</span></label>
            <label className="flex items-center gap-2 rounded-lg border p-3 cursor-pointer hover:bg-secondary/30"><input type="checkbox" checked={!!websiteForm.impressumGeprueft} onChange={e => setWebsite("impressumGeprueft", e.target.checked)} className="rounded" /><span>Impressum geprüft</span></label>
            <div className="space-y-1">
              <Label className="text-xs">Empfohlener Pfad der Datenschutz-Unterseite</Label>
              <Input value={websiteForm.privacyPagePath || ""} onChange={e => setWebsite("privacyPagePath", e.target.value)} className="h-8 text-sm" placeholder="/ds" />
            </div>
            <p className="text-xs text-muted-foreground">Erfüllte Prüfpunkte: {websiteDone} / {websiteChecks.length}</p>
            <div className="space-y-1">
              <Label className="text-xs">Notizen</Label>
              <Textarea value={websiteForm.notes || ""} onChange={e => setWebsite("notes", e.target.value)} className="text-sm min-h-20" />
            </div>
            <DialogFooter><Button size="sm" className="bg-primary" onClick={saveWebsiteCheck}>Speichern</Button></DialogFooter>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <div>
                <CardTitle className="text-sm">Datenschutzhinweise für Personengruppen</CardTitle>
                <CardDescription>Prüfung für Betroffene, Interessenten, Bewerber, Lieferanten und weitere Gruppen</CardDescription>
              </div>
              <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${noticeStatus.cls}`}>{noticeStatus.label}</span>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="space-y-1">
              <Label className="text-xs">Bereitstellungsform</Label>
              <Select value={noticeForm.format} onValueChange={v => setNotice("format", v)}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="einzeldokumente">Je Personengruppe eigenes Dokument</SelectItem>
                  <SelectItem value="sammeldokument">Ein gemeinsames Dokument</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {[
                ["betroffene", "Betroffene"],
                ["interessenten", "Interessenten"],
                ["bewerber", "Bewerber"],
                ["lieferanten", "Lieferanten"],
                ["besucher", "Besucher"],
                ["kunden", "Kunden"],
              ].map(([key, label]) => (
                <label key={key} className="flex items-center gap-2 rounded-lg border p-3 cursor-pointer hover:bg-secondary/30">
                  <input type="checkbox" checked={!!noticeForm.groups?.[key]} onChange={() => toggleGroup(String(key))} className="rounded" />
                  <span>{label}</span>
                </label>
              ))}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              <label className="flex items-center gap-2 rounded-lg border p-3 cursor-pointer hover:bg-secondary/30"><input type="checkbox" checked={!!noticeForm.distributionEmail} onChange={e => setNotice("distributionEmail", e.target.checked)} className="rounded" /><span className="flex items-center gap-2"><Mail className="h-4 w-4" />In E-Mails eingebunden</span></label>
              <label className="flex items-center gap-2 rounded-lg border p-3 cursor-pointer hover:bg-secondary/30"><input type="checkbox" checked={!!noticeForm.distributionQr} onChange={e => setNotice("distributionQr", e.target.checked)} className="rounded" /><span>Per QR-Code erreichbar</span></label>
              <label className="flex items-center gap-2 rounded-lg border p-3 cursor-pointer hover:bg-secondary/30"><input type="checkbox" checked={!!noticeForm.websiteSubpage} onChange={e => setNotice("websiteSubpage", e.target.checked)} className="rounded" /><span>Auf Webseite als Unterseite `/ds` eingebunden</span></label>
            </div>
            <p className="text-xs text-muted-foreground">Ausgewählte Personengruppen: {selectedGroupCount} · Ausspielwege aktiv: {noticeDistributionCount}</p>
            <div className="space-y-1">
              <Label className="text-xs">Notizen</Label>
              <Textarea value={noticeForm.notes || ""} onChange={e => setNotice("notes", e.target.value)} className="text-sm min-h-20" />
            </div>
            <DialogFooter><Button size="sm" className="bg-primary" onClick={saveNoticeCheck}>Speichern</Button></DialogFooter>
          </CardContent>
        </Card>
      </div>
    </MandantGuard>
  );
}

function DokumentePage() {
  const { t } = useI18n();
  const { data, isLoading, create, update, remove } = useModuleData("dokumente");
  const [modal, setModal] = useState<null | "new" | any>(null);
  const [delId, setDelId] = useState<number | null>(null);
  const [filter, setFilter] = useState("alle");
  const { toast } = useToast();
  const { activeMandantId } = useMandant();
  const qc = useQueryClient();

  const save = (form: any) => {
    const p = modal === "new" ? create.mutateAsync(form) : update.mutateAsync({ id: modal.id, ...form });
    p.then(() => { setModal(null); toast({ title: "Gespeichert" }); }).catch((e:any) => toast({ title: "Fehler", description: e?.message || "Speichern fehlgeschlagen", variant: "destructive" }));
  };
  const catIcons: Record<string, string> = { leitlinie: "🛡️", leitlinie_datenschutz: "🛡️", leitlinie_informationssicherheit: "🛡️", richtlinie: "📋", prozessbeschreibung: "🧭", risikobewertung: "⚠️", verfahrensdokumentation: "🗂️", vorlage: "📄", vertrag: "📝", protokoll: "📒", sonstige: "📁" };
  const filtered = filter === "alle" ? data : data.filter((item: any) => item.kategorie === filter);
  return (
    <MandantGuard>
      <PageHeader title={t("docsTitle")} desc={t("docsDesc")}
        action={
          <Button size="sm" className="bg-primary h-8 text-xs gap-1.5" onClick={() => setModal("new")}>
            <Plus className="h-3.5 w-3.5" />
            Neues Dokument
          </Button>
        }
      />
      <div className="flex gap-2 mb-4 flex-wrap">
        {["alle", "leitlinie", "richtlinie", "prozessbeschreibung", "risikobewertung", "verfahrensdokumentation", "vorlage"].map((f) => (
          <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1 rounded-full text-xs transition-colors ${filter === f ? "bg-primary text-white" : "bg-secondary text-muted-foreground hover:text-foreground"}`}>
            {f === "alle" ? "Alle" : f}
          </button>
        ))}
      </div>
      {isLoading ? <Skeleton className="h-32 w-full" /> : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filtered.length === 0 && <div className="col-span-2"><Card className="border-dashed"><CardContent className="py-12 text-center text-sm text-muted-foreground">Noch keine Dokumente vorhanden.</CardContent></Card></div>}
          {filtered.map((item: any) => (
            <Card key={item.id} className="group hover:border-border/80 transition-colors">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-xl">{catIcons[item.kategorie] || "📁"}</span>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{item.titel}</p>
                      <p className="text-xs text-muted-foreground">{item.kategorie} · v{item.version} · {item.verantwortlicher || "—"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <StatusBadge value={item.status} />
                    <button onClick={() => setModal(item)} className="p-1 rounded text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-all"><Pencil className="h-3.5 w-3.5" /></button>
                    <button onClick={() => setDelId(item.id)} className="p-1 rounded text-muted-foreground hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"><Trash2 className="h-3.5 w-3.5" /></button>
                  </div>
                </div>
                {item.beschreibung && <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{item.beschreibung}</p>}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      <Dialog open={!!modal} onOpenChange={o => !o && setModal(null)}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto"><div className="sticky top-0 z-10 -mx-6 border-b bg-background px-6 pb-3 pt-1"><DialogHeader><DialogTitle>{modal === "new" ? "Neues Dokument" : "Dokument bearbeiten"}</DialogTitle></DialogHeader></div>
          {modal && <DokumentForm initial={modal === "new" ? {} : modal} onSave={save} onCancel={() => setModal(null)} />}
        </DialogContent>
      </Dialog>
      <ConfirmDialog open={delId !== null} title="Dokument löschen?" desc="Dieser Vorgang kann nicht rückgängig gemacht werden."
        onConfirm={() => { remove.mutate(delId!); setDelId(null); }} onCancel={() => setDelId(null)} />
    </MandantGuard>
  );
}

// ─── MANDANTEN ADMIN PAGE ──────────────────────────────────────────────────
function MandantenPage() {
  const { t } = useI18n();
  const qc = useQueryClient();
  const { data: mandanten = [], isLoading } = useQuery({
    queryKey: ["/api/mandanten"],
    queryFn: () => apiRequest("GET", "/api/mandanten").then(r => r.json()),
  });
  const { data: gruppen = [] } = useQuery({
    queryKey: ["/api/mandanten-gruppen"],
    queryFn: () => apiRequest("GET", "/api/mandanten-gruppen").then(r => r.json()),
  });
  const [modal, setModal] = useState<null | "new" | any>(null);
  const [delId, setDelId] = useState<number | null>(null);
  const [setupStep, setSetupStep] = useState(1);
  const [setupPaketId, setSetupPaketId] = useState("none");
  const { data: pakete = [] } = useQuery({
    queryKey: ["/api/vorlagenpakete"],
    queryFn: () => apiRequest("GET", "/api/vorlagenpakete").then(r => r.json()),
  });
  const { branchen: branchenOptions } = useComplianceMeta();
  const emptyForm = {
    name: "", rechtsform: "", anschrift: "", branche: "", branchen: [], webseite: "", notizen: "", gruppenOrganisation: false, gruppeId: "none",
    dsb: "", dsbEmail: "", dsbTelefon: "",
    verantwortlicherName: "", verantwortlicherEmail: "", verantwortlicherTelefon: "",
    datenschutzmanagerName: "", datenschutzmanagerEmail: "", datenschutzmanagerTelefon: "",
    itVerantwortlicherName: "", itVerantwortlicherEmail: "", itVerantwortlicherTelefon: "",
    hatIsb: false, isbName: "", isbEmail: "", isbTelefon: "",
    webseitenbetreuerName: "", webseitenbetreuerEmail: "", webseitenbetreuerTelefon: "",
    logo: "", exportDesignStyle: "executive",
  };
  const [form, setForm] = useState<any>(emptyForm);
  const { toast } = useToast();
  const set = (k: string, v: any) => setForm((p: any) => ({ ...p, [k]: v }));

  const openNew = () => { setSetupStep(1); setForm(emptyForm); setModal("new"); };
  const openEdit = (m: any) => {
    setSetupStep(3);
    setSetupPaketId("none");
    setForm({ ...emptyForm, ...m, branchen: (() => { try { return Array.isArray(m.branchen) ? m.branchen : JSON.parse(m.branchen || "[]"); } catch { return []; } })(), gruppenOrganisation: !!(m.gruppenOrganisation || m.gruppeId), gruppeId: m.gruppeId ? String(m.gruppeId) : "none" });
    setModal(m);
  };
  const quickSetup = () => {
    setSetupStep(1);
    setForm({
      ...emptyForm,
      name: "Neuer Mandant",
      rechtsform: "GmbH",
      branche: "Dienstleistung",
      branchen: ["Dienstleistung"],
      dsb: "Datenschutzbeauftragter",
      verantwortlicherName: "Verantwortlicher",
      datenschutzmanagerName: "Datenschutzmanager",
      itVerantwortlicherName: "IT-Verantwortlicher",
      hatIsb: true,
      isbName: "ISB",
      webseitenbetreuerName: "Webseitenbetreuer",
    });
    setModal("new");
  };

  const save = async () => {
    try {
      const hasGroupAssignment = form.gruppeId !== "none";
      const payload = {
        ...form,
        branchen: JSON.stringify(Array.isArray(form.branchen) ? form.branchen : []),
        gruppenOrganisation: !!form.gruppenOrganisation || hasGroupAssignment,
        gruppeId: hasGroupAssignment ? Number(form.gruppeId) : null,
      };
      if (modal === "new") {
        const res = await apiRequest("POST", "/api/mandanten", payload);
        const created = await res.json();
        if (setupPaketId !== "none") {
          await apiRequest("POST", `/api/mandanten/${created.id}/vorlagenpakete/${setupPaketId}/apply`, {});
        }
      } else await apiRequest("PUT", `/api/mandanten/${modal.id}`, payload);
      qc.invalidateQueries({ queryKey: ["/api/mandanten"] });
      qc.invalidateQueries({ queryKey: ["/api/mandanten-gruppen"] });
      qc.invalidateQueries({ queryKey: [`/api/mandanten/${modal.id}`] });
      setModal(null);
      toast({ title: "Gespeichert" });
    } catch { toast({ title: "Fehler", variant: "destructive" }); }
  };

  return (
    <div>
      <PageHeader title={t("tenantsTitle")} desc={t("tenantsDesc")}
        action={<div className="flex gap-2"><Button size="sm" variant="outline" className="h-8 text-xs gap-1.5" onClick={quickSetup}>Quick-Setup</Button><Button size="sm" className="bg-primary h-8 text-xs gap-1.5" onClick={openNew}><Plus className="h-3.5 w-3.5" />Neuer Mandant</Button></div>} />
      {isLoading ? <Skeleton className="h-32 w-full" /> : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {mandanten.map((m: any) => (
            <Card key={m.id} className="group hover:border-border/80 transition-colors">
              <CardContent className="p-4">
                {m.gruppeId && (
                  <div className="mb-2">
                    <Badge variant="outline" className="text-xs">
                      {gruppen.find((g: any) => g.id === m.gruppeId)?.name || "Gruppe"}
                    </Badge>
                  </div>
                )}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center text-xs font-bold text-primary shrink-0">{m.name.charAt(0)}</div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{m.name}</p>
                      <p className="text-xs text-muted-foreground">{m.rechtsform || "—"}{m.branche ? ` · ${m.branche}` : ""}</p>
                    </div>
                  </div>
                  <div className="flex gap-1 opacity-100 transition-all sm:opacity-0 sm:group-hover:opacity-100">
                    <button onClick={() => openEdit(m)} className="p-1 rounded text-muted-foreground hover:text-foreground"><Pencil className="h-3.5 w-3.5" /></button>
                    <button onClick={() => setDelId(m.id)} className="p-1 rounded text-muted-foreground hover:text-red-400"><Trash2 className="h-3.5 w-3.5" /></button>
                  </div>
                </div>
                <div className="mt-2 space-y-1">
                  {m.dsb && <p className="text-xs text-muted-foreground">DSB: {m.dsb}{m.dsbEmail ? ` · ${m.dsbEmail}` : ""}</p>}
                  {m.verantwortlicherName && <p className="text-xs text-muted-foreground">Verantwortlicher: {m.verantwortlicherName}</p>}
                  {m.itVerantwortlicherName && <p className="text-xs text-muted-foreground">IT: {m.itVerantwortlicherName}</p>}
                  {m.hatIsb && <p className="text-xs text-muted-foreground">ISB: {m.isbName || "nicht gepflegt"}</p>}
                  {m.webseitenbetreuerName && <p className="text-xs text-muted-foreground">Webseite: {m.webseitenbetreuerName}</p>}
                </div>
              </CardContent>
            </Card>
          ))}
          {mandanten.length === 0 && <div className="col-span-3"><Card className="border-dashed"><CardContent className="py-12 text-center text-sm text-muted-foreground">Noch keine Mandanten angelegt.</CardContent></Card></div>}
        </div>
      )}
      <Dialog open={!!modal} onOpenChange={o => !o && setModal(null)}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <div className="sticky top-0 z-10 -mx-6 border-b bg-background px-6 pb-3 pt-1">
            <DialogHeader><DialogTitle>{modal === "new" ? "Neuer Mandant" : "Mandant bearbeiten"}</DialogTitle></DialogHeader>
          </div>
          <div className="space-y-4 max-h-[70vh] overflow-y-auto px-1 py-1">
            {modal === "new" && (
              <div className="flex gap-2 text-xs">
                {[1,2,3].map((step) => <button key={step} onClick={() => setSetupStep(step)} className={`px-3 py-1 rounded-full ${setupStep === step ? "bg-primary text-white" : "bg-secondary text-muted-foreground"}`}>Schritt {step}</button>)}
              </div>
            )}
            {modal === "new" && setupStep === 3 && (
              <Card>
                <CardContent className="p-3 text-xs space-y-1">
                  <p className="font-medium">Abschlusscheck</p>
                  <p className={form.name ? "text-emerald-400" : "text-red-400"}>Name {form.name ? "vorhanden" : "fehlt"}</p>
                  <p className={form.verantwortlicherName ? "text-emerald-400" : "text-yellow-400"}>Verantwortlicher {form.verantwortlicherName ? "vorhanden" : "empfohlen"}</p>
                  <p className={form.itVerantwortlicherName ? "text-emerald-400" : "text-yellow-400"}>IT-Verantwortlicher {form.itVerantwortlicherName ? "vorhanden" : "empfohlen"}</p>
                  <p className={setupPaketId !== "none" ? "text-emerald-400" : "text-yellow-400"}>Startpaket {setupPaketId !== "none" ? "gewählt" : "nicht gewählt"}</p>
                </CardContent>
              </Card>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="col-span-2 space-y-1"><Label className="text-xs">Name *</Label><Input value={form.name} onChange={e => set("name", e.target.value)} className="h-8 text-sm" /></div>
              <div className="space-y-1"><Label className="text-xs">Rechtsform</Label><Input value={form.rechtsform} onChange={e => set("rechtsform", e.target.value)} className="h-8 text-sm" placeholder="GmbH, AG..." /></div>
              <div className="space-y-1"><Label className="text-xs">Hauptbranche</Label>
                <Select value={form.branche || "none"} onValueChange={v => set("branche", v === "none" ? "" : v)}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Branche wählen" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Keine Auswahl</SelectItem>
                    {branchenOptions.map((b: string) => <SelectItem key={b} value={b}>{b}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
        <div className="space-y-1"><Label className="text-xs">Weitere Branchen</Label><Input value={Array.isArray(form.branchen) ? form.branchen.join(", ") : ""} onChange={e => set("branchen", e.target.value.split(",").map(v => v.trim()).filter(Boolean))} className="h-8 text-sm" placeholder={branchenOptions.slice(0,3).join(", ")} /></div>
              <div className="col-span-2 space-y-1"><Label className="text-xs">Anschrift</Label><Input value={form.anschrift} onChange={e => set("anschrift", e.target.value)} className="h-8 text-sm" /></div>
              <div className="space-y-1"><Label className="text-xs">Webseite</Label><Input value={form.webseite} onChange={e => set("webseite", e.target.value)} className="h-8 text-sm" placeholder="https://..." /></div>
              <div className="space-y-2">
                <Label className="text-xs">Gruppenorganisation</Label>
                <label className="flex items-center gap-2 text-xs rounded-lg border border-border px-3 py-2 cursor-pointer hover:bg-secondary/40">
                  <input
                    type="checkbox"
                    checked={!!form.gruppenOrganisation}
                    onChange={e => {
                      const checked = e.target.checked;
                      set("gruppenOrganisation", checked);
                      if (!checked) set("gruppeId", "none");
                    }}
                    className="rounded"
                  />
                  <span>Mandant ist Teil einer Gruppenstruktur</span>
                </label>
              </div>
              <div className="space-y-1"><Label className="text-xs">Gruppe</Label>
                <Select value={form.gruppeId} onValueChange={v => {
                  set("gruppeId", v);
                  if (v !== "none") set("gruppenOrganisation", true);
                }}>
                  <SelectTrigger className="h-8 text-xs" disabled={!form.gruppenOrganisation}><SelectValue placeholder="Keine Gruppe" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Keine Gruppe</SelectItem>
                    {gruppen.map((g: any) => <SelectItem key={g.id} value={String(g.id)}>{g.name}</SelectItem>)}
                  </SelectContent>
                </Select>
                <p className="text-[11px] text-muted-foreground">
                  Nur wenn Gruppenorganisation aktiviert ist, fließt dieser Punkt in den Mandantenstatus ein.
                </p>
              </div>
            </div>
            {setupStep >= 2 && <Separator />}
            {setupStep >= 2 && <div className="space-y-3">
              <p className="text-sm font-medium">Ansprechpartner und Rollen</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="col-span-3 text-xs font-semibold text-muted-foreground">Datenschutzbeauftragter</div>
                <div className="space-y-1"><Label className="text-xs">Name</Label><Input value={form.dsb} onChange={e => set("dsb", e.target.value)} className="h-8 text-sm" /></div>
                <div className="space-y-1"><Label className="text-xs">E-Mail</Label><Input type="email" value={form.dsbEmail} onChange={e => set("dsbEmail", e.target.value)} className="h-8 text-sm" /></div>
                <div className="space-y-1"><Label className="text-xs">Telefon</Label><Input value={form.dsbTelefon} onChange={e => set("dsbTelefon", e.target.value)} className="h-8 text-sm" /></div>

                <div className="col-span-3 text-xs font-semibold text-muted-foreground pt-2">Verantwortlicher</div>
                <div className="space-y-1"><Label className="text-xs">Name</Label><Input value={form.verantwortlicherName} onChange={e => set("verantwortlicherName", e.target.value)} className="h-8 text-sm" /></div>
                <div className="space-y-1"><Label className="text-xs">E-Mail</Label><Input type="email" value={form.verantwortlicherEmail} onChange={e => set("verantwortlicherEmail", e.target.value)} className="h-8 text-sm" /></div>
                <div className="space-y-1"><Label className="text-xs">Telefon</Label><Input value={form.verantwortlicherTelefon} onChange={e => set("verantwortlicherTelefon", e.target.value)} className="h-8 text-sm" /></div>

                <div className="col-span-3 text-xs font-semibold text-muted-foreground pt-2">Datenschutzmanager</div>
                <div className="space-y-1"><Label className="text-xs">Name</Label><Input value={form.datenschutzmanagerName} onChange={e => set("datenschutzmanagerName", e.target.value)} className="h-8 text-sm" /></div>
                <div className="space-y-1"><Label className="text-xs">E-Mail</Label><Input type="email" value={form.datenschutzmanagerEmail} onChange={e => set("datenschutzmanagerEmail", e.target.value)} className="h-8 text-sm" /></div>
                <div className="space-y-1"><Label className="text-xs">Telefon</Label><Input value={form.datenschutzmanagerTelefon} onChange={e => set("datenschutzmanagerTelefon", e.target.value)} className="h-8 text-sm" /></div>

                <div className="col-span-3 text-xs font-semibold text-muted-foreground pt-2">IT-Verantwortlicher</div>
                <div className="space-y-1"><Label className="text-xs">Name</Label><Input value={form.itVerantwortlicherName} onChange={e => set("itVerantwortlicherName", e.target.value)} className="h-8 text-sm" /></div>
                <div className="space-y-1"><Label className="text-xs">E-Mail</Label><Input type="email" value={form.itVerantwortlicherEmail} onChange={e => set("itVerantwortlicherEmail", e.target.value)} className="h-8 text-sm" /></div>
                <div className="space-y-1"><Label className="text-xs">Telefon</Label><Input value={form.itVerantwortlicherTelefon} onChange={e => set("itVerantwortlicherTelefon", e.target.value)} className="h-8 text-sm" /></div>

                <div className="col-span-3 space-y-2 pt-2">
                  <div className="text-xs font-semibold text-muted-foreground">Informationssicherheitsbeauftragter</div>
                  <label className="flex items-center gap-2 text-xs rounded-lg border border-border px-3 py-2 cursor-pointer hover:bg-secondary/40">
                    <input
                      type="checkbox"
                      checked={!!form.hatIsb}
                      onChange={e => {
                        const checked = e.target.checked;
                        set("hatIsb", checked);
                        if (!checked) {
                          set("isbName", "");
                          set("isbEmail", "");
                          set("isbTelefon", "");
                        }
                      }}
                      className="rounded"
                    />
                    <span>ISB ist für diesen Mandanten benannt</span>
                  </label>
                </div>
                <div className="space-y-1"><Label className="text-xs">Name</Label><Input value={form.isbName} onChange={e => set("isbName", e.target.value)} className="h-8 text-sm" disabled={!form.hatIsb} /></div>
                <div className="space-y-1"><Label className="text-xs">E-Mail</Label><Input type="email" value={form.isbEmail} onChange={e => set("isbEmail", e.target.value)} className="h-8 text-sm" disabled={!form.hatIsb} /></div>
                <div className="space-y-1"><Label className="text-xs">Telefon</Label><Input value={form.isbTelefon} onChange={e => set("isbTelefon", e.target.value)} className="h-8 text-sm" disabled={!form.hatIsb} /></div>

                <div className="col-span-3 text-xs font-semibold text-muted-foreground pt-2">Webseitenbetreuer</div>
                <div className="space-y-1"><Label className="text-xs">Name</Label><Input value={form.webseitenbetreuerName} onChange={e => set("webseitenbetreuerName", e.target.value)} className="h-8 text-sm" /></div>
                <div className="space-y-1"><Label className="text-xs">E-Mail</Label><Input type="email" value={form.webseitenbetreuerEmail} onChange={e => set("webseitenbetreuerEmail", e.target.value)} className="h-8 text-sm" /></div>
                <div className="space-y-1"><Label className="text-xs">Telefon</Label><Input value={form.webseitenbetreuerTelefon} onChange={e => set("webseitenbetreuerTelefon", e.target.value)} className="h-8 text-sm" /></div>
              </div>
            </div>}
            {setupStep >= 3 && <Separator />}
            {setupStep >= 3 && <div className="space-y-3">
              <div className="space-y-1">
                <Label className="text-xs">Vorlagenpaket zum Start</Label>
                <Select value={setupPaketId} onValueChange={setSetupPaketId}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Kein Paket" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Kein Paket</SelectItem>
                    {pakete.map((p: any) => <SelectItem key={p.id} value={String(p.id)}>{p.name} v{p.version || "1.0"}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1 sm:col-span-2 pt-2 border-t mt-2">
                <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Premium PDF-Export & Design</p>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Export-Designstil</Label>
                <Select value={form.exportDesignStyle || "executive"} onValueChange={v => set("exportDesignStyle", v)}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="executive">Executive-Blau (Premium)</SelectItem>
                    <SelectItem value="minimalist">Minimalist-Dark (Modern)</SelectItem>
                    <SelectItem value="printable">Druckfreundlich (Klassisch)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Firmenlogo</Label>
                <div className="flex gap-2 items-center">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={(e: any) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = (event: any) => {
                          set("logo", event.target?.result);
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                    className="h-8 text-xs pt-1 file:mr-2 file:py-0.5 file:px-1.5 file:rounded-md file:border-0 file:text-[10px] file:bg-secondary file:text-secondary-foreground"
                  />
                  {form.logo && (
                    <button
                      onClick={() => set("logo", "")}
                      className="text-[10px] text-red-500 hover:underline shrink-0"
                    >
                      Entfernen
                    </button>
                  )}
                </div>
              </div>
              {form.logo && (
                <div className="col-span-2">
                  <Label className="text-[10px] text-muted-foreground">Logo-Vorschau:</Label>
                  <div className="mt-1 p-2 rounded border bg-muted/40 max-h-16 flex items-center justify-start overflow-hidden">
                    <img src={form.logo} alt="Logo Vorschau" className="max-h-12 object-contain" />
                  </div>
                </div>
              )}
              <div className="space-y-1 col-span-2 pt-2 border-t mt-2">
                <Label className="text-xs">Notizen</Label>
                <Textarea value={form.notizen} onChange={e => set("notizen", e.target.value)} className="text-sm min-h-20" />
              </div>
            </div>}
            <div className="sticky bottom-0 z-10 -mx-6 mt-2 border-t bg-background px-6 pt-3 pb-1">
              <DialogFooter>
                <Button variant="outline" size="sm" onClick={() => setModal(null)}>Abbrechen</Button>
                <Button size="sm" className="bg-primary" onClick={save} disabled={!form.name}>Speichern</Button>
              </DialogFooter>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      <ConfirmDialog open={delId !== null} title="Mandant löschen?" desc="Alle Daten dieses Mandanten bleiben erhalten."
        onConfirm={async () => { await apiRequest("DELETE", `/api/mandanten/${delId}`); qc.invalidateQueries({ queryKey: ["/api/mandanten"] }); setDelId(null); }}
        onCancel={() => setDelId(null)} />
    </div>
  );
}

function GruppenPage() {
  const { t } = useI18n();
  const qc = useQueryClient();
  const { data: gruppen = [], isLoading } = useQuery({
    queryKey: ["/api/mandanten-gruppen"],
    queryFn: () => apiRequest("GET", "/api/mandanten-gruppen").then(r => r.json()),
  });
  const { data: mandanten = [] } = useQuery({
    queryKey: ["/api/mandanten"],
    queryFn: () => apiRequest("GET", "/api/mandanten").then(r => r.json()),
  });
  const [modal, setModal] = useState<null | "new" | any>(null);
  const [delId, setDelId] = useState<number | null>(null);
  const [selectedGroupForApply, setSelectedGroupForApply] = useState<string>("");
  const [selectedPaketForApply, setSelectedPaketForApply] = useState<string>("");
  const [selectedGroupForReport, setSelectedGroupForReport] = useState<string>("");
  const [selectedGroupForPrint, setSelectedGroupForPrint] = useState<string>("");
  const [form, setForm] = useState({ name: "", beschreibung: "", typ: "sonstige", parentGroupId: "none" });
  const { data: pakete = [] } = useQuery({
    queryKey: ["/api/vorlagenpakete"],
    queryFn: () => apiRequest("GET", "/api/vorlagenpakete").then(r => r.json()),
  });
  const { toast } = useToast();
  const set = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }));
  const openNew = () => { setForm({ name: "", beschreibung: "", typ: "sonstige", parentGroupId: "none" }); setModal("new"); };
  const openEdit = (g: any) => { setForm({ ...g, parentGroupId: g.parentGroupId ? String(g.parentGroupId) : "none" }); setModal(g); };
  const save = async () => {
    const payload = { ...form, parentGroupId: form.parentGroupId === "none" ? null : Number(form.parentGroupId) };
    try {
      if (modal === "new") await apiRequest("POST", "/api/mandanten-gruppen", payload);
      else await apiRequest("PUT", `/api/mandanten-gruppen/${modal.id}`, payload);
      qc.invalidateQueries({ queryKey: ["/api/mandanten-gruppen"] });
      setModal(null);
      toast({ title: "Gruppe gespeichert" });
    } catch {
      toast({ title: "Fehler", variant: "destructive" });
    }
  };
  const applyToGroup = async () => {
    if (!selectedGroupForApply || !selectedPaketForApply) return;
    try {
      const res = await apiRequest("POST", `/api/gruppen/${selectedGroupForApply}/vorlagenpakete/${selectedPaketForApply}/apply`, {});
      const data = await res.json();
      toast({ title: "Vorlagenpaket zugewiesen", description: `${data.count} Mandanten verarbeitet` });
    } catch {
      toast({ title: "Fehler bei Gruppenzuweisung", variant: "destructive" });
    }
  };
  const exportGroupReport = () => {
    const gruppe = gruppen.find((g: any) => String(g.id) === selectedGroupForReport);
    const members = mandanten.filter((m: any) => String(m.gruppeId) === selectedGroupForReport);
    const blob = new Blob([JSON.stringify({ gruppe, members }, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `gruppenbericht-${gruppe?.name || selectedGroupForReport}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };
  const printGroupReport = () => {
    const gruppe = gruppen.find((g: any) => String(g.id) === selectedGroupForPrint);
    const members = mandanten.filter((m: any) => String(m.gruppeId) === selectedGroupForPrint);
    const cfg = {
      groupReport: true,
      gruppe,
      members,
      generatedAt: new Date().toISOString(),
    };
    sessionStorage.setItem("privashield_export", JSON.stringify(cfg));
    window.open("/print.html", "_blank");
  };

  const groupAmpel = (groupId: number) => {
    const ms = mandanten.filter((m: any) => m.gruppeId === groupId);
    if (ms.length === 0) return { label: "Rot", cls: "bg-red-500/15 text-red-400 border-red-500/30" };
    const withResponsible = ms.filter((m: any) => m.verantwortlicherName).length;
    if (withResponsible === ms.length) return { label: "Grün", cls: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" };
    if (withResponsible >= Math.ceil(ms.length / 2)) return { label: "Gelb", cls: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30" };
    return { label: "Rot", cls: "bg-red-500/15 text-red-400 border-red-500/30" };
  };

  return (
    <div>
      <PageHeader title={t("groupsTitle")} desc={t("groupsDesc")}
        action={<Button size="sm" className="bg-primary h-8 text-xs gap-1.5" onClick={openNew}><Plus className="h-3.5 w-3.5" />Neue Gruppe</Button>} />
      {isLoading ? <Skeleton className="h-32 w-full" /> : (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Vorlagenpaket gruppenweit anwenden</CardTitle>
              <CardDescription>Wendet ein Vorlagenpaket auf alle Mandanten einer Gruppe an</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
              <div className="space-y-1"><Label className="text-xs">Gruppe</Label>
                <Select value={selectedGroupForApply} onValueChange={setSelectedGroupForApply}><SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Gruppe wählen" /></SelectTrigger><SelectContent>{gruppen.map((g: any) => <SelectItem key={g.id} value={String(g.id)}>{g.name}</SelectItem>)}</SelectContent></Select>
              </div>
              <div className="space-y-1"><Label className="text-xs">Vorlagenpaket</Label>
                <Select value={selectedPaketForApply} onValueChange={setSelectedPaketForApply}><SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Paket wählen" /></SelectTrigger><SelectContent>{pakete.map((p: any) => <SelectItem key={p.id} value={String(p.id)}>{p.name} v{p.version || "1.0"}</SelectItem>)}</SelectContent></Select>
              </div>
              <Button className="bg-primary" onClick={applyToGroup} disabled={!selectedGroupForApply || !selectedPaketForApply}>Auf Gruppe anwenden</Button>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Gruppenbericht exportieren</CardTitle>
              <CardDescription>Exportiert Gruppendaten und zugeordnete Mandanten als JSON</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
              <div className="space-y-1 md:col-span-2"><Label className="text-xs">Gruppe</Label>
                <Select value={selectedGroupForReport} onValueChange={setSelectedGroupForReport}><SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Gruppe wählen" /></SelectTrigger><SelectContent>{gruppen.map((g: any) => <SelectItem key={g.id} value={String(g.id)}>{g.name}</SelectItem>)}</SelectContent></Select>
              </div>
              <Button variant="outline" onClick={exportGroupReport} disabled={!selectedGroupForReport}>Gruppenbericht exportieren</Button>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Gruppenbericht drucken</CardTitle>
              <CardDescription>Öffnet eine Druckansicht für eine Gruppe und ihre Mandanten</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
              <div className="space-y-1 md:col-span-2"><Label className="text-xs">Gruppe</Label>
                <Select value={selectedGroupForPrint} onValueChange={setSelectedGroupForPrint}><SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Gruppe wählen" /></SelectTrigger><SelectContent>{gruppen.map((g: any) => <SelectItem key={g.id} value={String(g.id)}>{g.name}</SelectItem>)}</SelectContent></Select>
              </div>
              <Button onClick={printGroupReport} disabled={!selectedGroupForPrint}>Druckansicht öffnen</Button>
            </CardContent>
          </Card>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {gruppen.map((g: any) => (
              <Card key={`metric-${g.id}`}>
                <CardContent className="p-4">
                  <p className="text-sm font-medium truncate">{g.name}</p>
                  <p className="text-xs text-muted-foreground">{g.typ}</p>
                  <span className={`inline-flex mt-2 items-center px-2 py-0.5 rounded text-xs font-medium border ${groupAmpel(g.id).cls}`}>{groupAmpel(g.id).label}</span>
                  <p className="text-2xl font-bold mt-2">{mandanten.filter((m: any) => m.gruppeId === g.id).length}</p>
                  <p className="text-xs text-muted-foreground">zugeordnete Mandanten</p>
                </CardContent>
              </Card>
            ))}
          </div>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Hierarchie</CardTitle>
              <CardDescription>Überblick über Gruppen und Untergruppen</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {gruppen.filter((g: any) => !g.parentGroupId).map((root: any) => {
                const children = gruppen.filter((g: any) => g.parentGroupId === root.id);
                return (
                  <div key={root.id} className="rounded-lg border p-3">
                    <p className="text-sm font-medium">{root.name}</p>
                    <p className="text-xs text-muted-foreground">{root.typ}</p>
                    <p className="text-xs text-muted-foreground mt-1">Mandanten: {mandanten.filter((m: any) => m.gruppeId === root.id).map((m: any) => m.name).join(", ") || "—"}</p>
                    {children.length > 0 && (
                      <div className="mt-3 ml-4 space-y-2 border-l pl-4">
                        {children.map((child: any) => (
                          <div key={child.id}>
                            <p className="text-sm">{child.name}</p>
                            <p className="text-xs text-muted-foreground">{child.typ}</p>
                            <p className="text-xs text-muted-foreground mt-1">Mandanten: {mandanten.filter((m: any) => m.gruppeId === child.id).map((m: any) => m.name).join(", ") || "—"}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </CardContent>
          </Card>
          <div className="space-y-2">
          {gruppen.map((g: any) => (
            <Card key={g.id} className="group hover:border-border/80 transition-colors">
              <CardContent className="py-3 px-4 flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center sm:gap-4">
                <div>
                  <p className="text-sm font-medium">{g.name}</p>
                  <p className="text-xs text-muted-foreground">{g.typ}{g.beschreibung ? ` · ${g.beschreibung}` : ""}</p>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge value={g.typ === "konzern" ? "aktiv" : "entwurf"} />
                  <button onClick={() => openEdit(g)} className="p-1 rounded text-muted-foreground hover:text-foreground"><Pencil className="h-3.5 w-3.5" /></button>
                  <button onClick={() => setDelId(g.id)} className="p-1 rounded text-muted-foreground hover:text-red-400"><Trash2 className="h-3.5 w-3.5" /></button>
                </div>
              </CardContent>
            </Card>
          ))}
          {gruppen.length === 0 && <Card className="border-dashed"><CardContent className="py-12 text-center text-sm text-muted-foreground">Noch keine Gruppen angelegt.</CardContent></Card>}
          </div>
        </div>
      )}
      <Dialog open={!!modal} onOpenChange={o => !o && setModal(null)}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{modal === "new" ? "Neue Gruppe" : "Gruppe bearbeiten"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1"><Label className="text-xs">Name *</Label><Input value={form.name} onChange={e => set("name", e.target.value)} className="h-8 text-sm" /></div>
            <div className="space-y-1"><Label className="text-xs">Typ</Label>
              <Select value={form.typ} onValueChange={v => set("typ", v)}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="konzern">Konzern</SelectItem>
                  <SelectItem value="holding">Holding</SelectItem>
                  <SelectItem value="standort">Standort</SelectItem>
                  <SelectItem value="fachbereich">Fachbereich</SelectItem>
                  <SelectItem value="sonstige">Sonstige</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1"><Label className="text-xs">Übergeordnete Gruppe</Label>
              <Select value={form.parentGroupId} onValueChange={v => set("parentGroupId", v)}>
                <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Keine" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Keine</SelectItem>
                  {gruppen.filter((g: any) => g.id !== modal?.id).map((g: any) => <SelectItem key={g.id} value={String(g.id)}>{g.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1"><Label className="text-xs">Beschreibung</Label><Textarea value={form.beschreibung} onChange={e => set("beschreibung", e.target.value)} className="text-sm min-h-20" /></div>
            <div className="sticky bottom-0 z-10 -mx-6 mt-2 border-t bg-background px-6 pt-3 pb-1">
              <DialogFooter>
                <Button variant="outline" size="sm" onClick={() => setModal(null)}>Abbrechen</Button>
                <Button size="sm" className="bg-primary" onClick={save} disabled={!form.name}>Speichern</Button>
              </DialogFooter>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      <ConfirmDialog open={delId !== null} title="Gruppe löschen?" desc="Die Gruppenzuordnung bei Mandanten sollte danach geprüft werden."
        onConfirm={async () => { await apiRequest("DELETE", `/api/mandanten-gruppen/${delId}`); qc.invalidateQueries({ queryKey: ["/api/mandanten-gruppen"] }); setDelId(null); }}
        onCancel={() => setDelId(null)} />
    </div>
  );
}

function VorlagenpaketePage() {
  const { t } = useI18n();
  const qc = useQueryClient();
  const { data: pakete = [], isLoading } = useQuery({
    queryKey: ["/api/vorlagenpakete"],
    queryFn: () => apiRequest("GET", "/api/vorlagenpakete").then(r => r.json()),
  });
  const [modal, setModal] = useState<null | "new" | any>(null);
  const [delId, setDelId] = useState<number | null>(null);
  const [duplicateId, setDuplicateId] = useState<number | null>(null);
  const [form, setForm] = useState({ name: "", beschreibung: "", kategorie: "allgemein", version: "1.0", aktiv: true, inhaltJson: '{"aufgaben":[],"dokumente":[]}' });
  const [builderTasks, setBuilderTasks] = useState<string[]>([]);
  const [builderDocs, setBuilderDocs] = useState<string[]>([]);
  const [preset, setPreset] = useState("leer");
  const { toast } = useToast();
  const set = (k: string, v: any) => setForm((p) => ({ ...p, [k]: v }));
  const openNew = () => { setPreset("leer"); setBuilderTasks([]); setBuilderDocs([]); setForm({ name: "", beschreibung: "", kategorie: "allgemein", version: "1.0", aktiv: true, inhaltJson: '{"aufgaben":[],"dokumente":[]}' }); setModal("new"); };
  const openEdit = (p: any) => { setForm({ ...p }); setModal(p); };
  const duplicatePaket = (p: any) => {
    setForm({ ...p, name: `${p.name} Kopie`, version: `${p.version || "1.0"}-copy` });
    setDuplicateId(p.id);
    setModal("new");
  };
  const applyPreset = (key: string) => {
    setPreset(key);
    if (key === "copilot") {
      setForm((p) => ({ ...p, inhaltJson: JSON.stringify({
        meta: {
          templateKey: "m365-copilot-compliance",
          templateLabel: "Microsoft 365 Copilot – Datenschutz- & Compliance-Paket",
          scope: "ki-compliance",
          source: "interne Fachvorlage TOM / DSGVO",
          notes: "Bewertungs- und Umsetzungspaket, keine pauschale Freigabe"
        },
        aufgaben: [
          { titel: "Microsoft 365 Copilot: AVV / DPA prüfen", beschreibung: "Prüfung des Auftragsverarbeitungsverhältnisses mit Microsoft, inklusive Data Processing Addendum, Product Terms und dokumentierter Datenschutzgarantien.", typ: "task", prioritaet: "hoch", status: "offen", kategorie: "avv", sortierung: 10 },
          { titel: "Microsoft 365 Copilot: Subprocessor-Liste dokumentieren", beschreibung: "Herstellerangaben zu Unterauftragsverarbeitern erfassen, bewerten und intern dokumentieren.", typ: "task", prioritaet: "hoch", status: "offen", kategorie: "avv", sortierung: 20 },
          { titel: "Microsoft 365 Copilot: EU Data Boundary und Drittlandbezug prüfen", beschreibung: "Prüfen, welche Datenflüsse innerhalb der EU/EWR verbleiben und welche optionalen Funktionen, Support- oder Integrationsszenarien Drittlandbezüge auslösen können.", typ: "task", prioritaet: "hoch", status: "offen", kategorie: "vvt", sortierung: 30 },
          { titel: "Microsoft 365 Copilot: Berechtigungsreview für Teams, SharePoint und OneDrive durchführen", beschreibung: "Oversharing-Risiken identifizieren; Freigaben, Link-Sharing, Gruppen- und Rollenberechtigungen gezielt überprüfen.", typ: "task", prioritaet: "kritisch", status: "offen", kategorie: "tom", sortierung: 40 },
          { titel: "Microsoft 365 Copilot: sensible Datenquellen identifizieren", beschreibung: "Bereiche mit besonders sensiblen, vertraulichen oder berufsgeheimnisgeschützten Daten erfassen und gesondert bewerten.", typ: "task", prioritaet: "kritisch", status: "offen", kategorie: "dsfa", sortierung: 50 },
          { titel: "Microsoft 365 Copilot: Ausschluss- und Einschränkungskonzept festlegen", beschreibung: "Festlegen, welche Datenquellen, Bibliotheken oder Arbeitsbereiche vom Einsatz ausgenommen oder technisch eingeschränkt werden sollen.", typ: "task", prioritaet: "hoch", status: "offen", kategorie: "tom", sortierung: 60 },
          { titel: "Microsoft 365 Copilot: VVT-Eintrag erstellen", beschreibung: "Verarbeitungstätigkeit für den Einsatz von Microsoft 365 Copilot mit Zweck, Datenkategorien, Betroffenengruppen, Empfängern und Drittlandprüfung dokumentieren.", typ: "task", prioritaet: "hoch", status: "offen", kategorie: "vvt", sortierung: 70 },
          { titel: "Microsoft 365 Copilot: DSFA durchführen", beschreibung: "Datenschutz-Folgenabschätzung mit Risikobewertung, Maßnahmenkatalog, Restrisikoanalyse und ggf. Art.-36-Prüfung durchführen.", typ: "milestone", prioritaet: "kritisch", status: "offen", kategorie: "dsfa", sortierung: 80 },
          { titel: "Microsoft 365 Copilot: DSB-Stellungnahme einholen", beschreibung: "Datenschutzbeauftragten in die Bewertung einbinden und Stellungnahme dokumentieren.", typ: "task", prioritaet: "hoch", status: "offen", kategorie: "dsfa", sortierung: 90 },
          { titel: "Microsoft 365 Copilot: Betriebsrat / Mitbestimmung prüfen", beschreibung: "Prüfen, ob und in welchem Umfang Mitbestimmungsrechte berührt sind; Dokumentation und Abstimmung vorbereiten.", typ: "task", prioritaet: "hoch", status: "offen", kategorie: "dokumente", sortierung: 100 },
          { titel: "Microsoft 365 Copilot: Mitarbeiterinformation erstellen", beschreibung: "Datenschutzbezogene Information für Beschäftigte zum Einsatz von Copilot und zur Verarbeitung personenbezogener Daten vorbereiten.", typ: "task", prioritaet: "mittel", status: "offen", kategorie: "dokumente", sortierung: 110 },
          { titel: "Microsoft 365 Copilot: KI-Nutzungsrichtlinie abstimmen", beschreibung: "Regeln für zulässige Nutzung, unzulässige Eingaben, Verifikation von Ergebnissen und Umgang mit sensiblen Daten festlegen.", typ: "milestone", prioritaet: "hoch", status: "offen", kategorie: "dokumente", sortierung: 120 },
          { titel: "Microsoft 365 Copilot: Review-Termin festlegen", beschreibung: "Regelmäßige Überprüfung von Konfiguration, Risiken, Dokumentation und Herstellerangaben terminieren.", typ: "review", prioritaet: "mittel", status: "offen", kategorie: "dsfa", sortierung: 130 }
        ],
        dokumente: [
          { titel: "Mitarbeiterinformation – Microsoft 365 Copilot", kategorie: "vorlage", dokumentTyp: "information", status: "entwurf", version: "1.0", inhalt: "Zweck der Vorlage: Information der Beschäftigten über Einsatz, Datenverarbeitung, Zwecke, Empfänger, Schutzmaßnahmen und Rechte im Zusammenhang mit Microsoft 365 Copilot." },
          { titel: "KI-Nutzungsrichtlinie – Microsoft 365 Copilot", kategorie: "richtlinie", dokumentTyp: "richtlinie", status: "entwurf", version: "1.0", inhalt: "Zweck der Vorlage: Regelung zulässiger Anwendungsfälle, Verbot sensibler Eingaben ohne Freigabe, Pflicht zur Ergebnisprüfung, Verantwortlichkeiten und Eskalationswege." },
          { titel: "Prüfvermerk AVV / DPA – Microsoft 365 Copilot", kategorie: "vertrag", dokumentTyp: "pruefvermerk", status: "entwurf", version: "1.0", inhalt: "Zweck der Vorlage: Dokumentation der Prüfung von DPA, Product Terms, Subprozessoren, EU Data Boundary, SCC-Konstellationen und Restrisiken." },
          { titel: "DSFA-Freigabevermerk – Microsoft 365 Copilot", kategorie: "risikobewertung", dokumentTyp: "freigabevermerk", status: "entwurf", version: "1.0", inhalt: "Zweck der Vorlage: Management-/DSB-Freigabe der DSFA, dokumentierte Restrisiken, Maßnahmenstatus und Reviewtermin." },
          { titel: "Mitbestimmungs- / Betriebsratsnotiz – Microsoft 365 Copilot", kategorie: "protokoll", dokumentTyp: "vermerk", status: "entwurf", version: "1.0", inhalt: "Zweck der Vorlage: Dokumentation mitbestimmungsrelevanter Aspekte, Gesprächsstände, Abgrenzung zur Leistungs- und Verhaltenskontrolle und offene Punkte." },
          { titel: "Management Summary – Einführung Microsoft 365 Copilot", kategorie: "verfahrensdokumentation", dokumentTyp: "management-summary", status: "entwurf", version: "1.0", inhalt: "Zweck der Vorlage: Verdichtete Managemententscheidung zu Nutzen, Risiken, Maßnahmen, Freigabebedingungen und Reviewpflichten." }
        ],
        vvt: [
          { bezeichnung: "Microsoft 365 Copilot – KI-gestützte Assistenz in Microsoft 365", zweck: "Unterstützung von Beschäftigten bei Recherche, Zusammenfassung, Entwurfserstellung, Wissenserschließung und produktivitätssteigernder Nutzung freigegebener Inhalte innerhalb der Microsoft-365-Umgebung.", rechtsgrundlage: "Art. 6 Abs. 1 lit. f DSGVO; ergänzend je Use Case gesondert zu prüfen; bei Beschäftigtendaten zusätzlich arbeitsrechtlich und national zu würdigen.", datenkategorien: ["Beschäftigtendaten", "Kommunikationsdaten", "Dokumenteninhalte", "Kunden- und Interessentendaten", "Vertrags- und Projektdaten", "Nutzungs- und Metadaten"], betroffenePersonen: ["Beschäftigte", "Kunden", "Interessenten", "Lieferantenkontakte", "Geschäftspartnerkontakte"], empfaenger: "Microsoft als Auftragsverarbeiter sowie interne berechtigte Stellen", drittlandtransfer: true, loeschfrist: "Gemäß zugrunde liegenden Quellsystemen, Retention Policies und dokumentierten Aufbewahrungsregeln.", loeschklasse: "KI-Systeme / Produktivsysteme", aufbewahrungsgrund: "Erforderlichkeit für den jeweiligen Geschäftsprozess sowie gesetzliche und interne Aufbewahrungsregeln.", tomHinweis: "Berechtigungskonzept, Sensitivity Labels, DLP, Audit Logging, Freigabe- und Sharing-Review, Richtlinie zur KI-Nutzung.", verantwortlicher: "", verantwortlicherEmail: "", verantwortlicherTelefon: "", status: "entwurf", dsfa: true }
        ],
        avv: [
          { auftragsverarbeiter: "Microsoft / Microsoft 365", gegenstand: "Bereitstellung und Betrieb von Microsoft 365 Copilot sowie damit verbundener Cloud-Dienste.", vertragsdatum: "", laufzeit: "", status: "entwurf", sccs: true, subauftragnehmer: ["Gemäß aktueller Herstellerliste gesondert zu dokumentieren"], avKontaktName: "", avKontaktEmail: "", avKontaktTelefon: "", genehmigteSubdienstleister: [], pruefFaellig: "", notizen: "DPA, Product Terms, EU Data Boundary, Subprocessor-Liste sowie Drittland- und Support-Konstellationen prüfen." }
        ],
        dsfa: [
          { titel: "DSFA – Einsatz von Microsoft 365 Copilot", beschreibung: "Bewertung der datenschutzrechtlichen Risiken beim Einsatz von Microsoft 365 Copilot zur KI-gestützten Verarbeitung, Analyse, Zusammenfassung und Generierung von Inhalten auf Basis freigegebener Daten aus Microsoft-365-Diensten.", zweck: "Produktivitätssteigerung, Wissenserschließung, Unterstützung bei Kommunikation und Dokumentenarbeit.", prozessablauf: "Nutzer geben Prompts ein; Copilot verarbeitet freigegebene Kontextdaten aus angebundenen Quellen; das System erzeugt Antwort, Zusammenfassung oder Entwurf; Nutzer prüft und verwendet das Ergebnis.", verarbeitungskontext: "Cloudbasierte KI-Unterstützung in Microsoft 365 mit potenziellem Zugriff auf Inhalte aus Exchange, Teams, SharePoint, OneDrive und weiteren freigegebenen Datenquellen.", datenquellen: "Exchange Online, Teams, SharePoint Online, OneDrive, Office-Dokumente, optional weitere M365-Quellen.", empfaenger: "Microsoft sowie konzernangehörige technische Leistungserbringer gemäß DPA und Subprocessor-Dokumentation.", drittlandtransfer: true, auftragsverarbeiter: "Microsoft", technologienSysteme: "Microsoft 365 Copilot, Microsoft 365, Entra ID, Purview, Exchange Online, SharePoint Online, Teams", profiling: false, automatisierteEntscheidung: false, notwendigkeit: "Nur zulässig bei dokumentierter Zweckdefinition, rollenbezogenem Einsatz und Begrenzung auf erforderliche Datenquellen.", rechtsgrundlage: "Art. 6 Abs. 1 lit. f DSGVO; ergänzend je Use Case sowie im Beschäftigungskontext gesondert zu würdigen.", zweckbindungBewertung: "Prüfbedürftig; Zweckgrenzen und zulässige Einsatzszenarien müssen dokumentiert und intern kommuniziert werden.", datenminimierungBewertung: "Kritisch wegen möglichem breitem Kontextzugriff; Zugriff auf unnötige Datenquellen ist technisch und organisatorisch zu vermeiden.", speicherbegrenzungBewertung: "An Quellsysteme, Retention Policies und dokumentierte Löschregeln zu koppeln.", transparenzBewertung: "Aktive Information der Beschäftigten und interne Transparenzmaßnahmen erforderlich.", betroffenenrechteBewertung: "Betroffenenrechte sind organisatorisch sicherzustellen; Auskunfts- und Löschprozesse müssen die Copilot-Nutzung mitdenken.", zugriffskonzeptBewertung: "Zentraler Risikofaktor; Berechtigungskonzept und Freigabestrukturen sind vor Rollout zu überprüfen.", privacyByDesignBewertung: "Abhängig von Konfiguration, Restriktionen, Governance und Ausschluss sensibler Datenbereiche.", risiken: [{ titel: "Oversharing durch zu weite Berechtigungen", beschreibung: "Copilot greift auf Inhalte zu, die formal freigegeben, aber organisatorisch nicht für den konkreten Nutzungskontext bestimmt sind.", betroffeneRechte: "Vertraulichkeit, Datenminimierung", betroffeneGruppen: "Beschäftigte, Kunden, Geschäftspartner", datenarten: "Dokumenteninhalte, Kommunikationsdaten, Vertragsdaten", ursache: "Historisch gewachsene Freigaben und unzureichendes Berechtigungsmanagement", bestehendeKontrollen: "M365-Berechtigungen, Gruppensteuerung, manuelle Freigaberegeln", eintrittswahrscheinlichkeit: "mittel", schweregrad: "hoch", inhärentesRisiko: "hoch", restrisiko: "mittel", weitereMassnahmen: "Berechtigungsreview, Ausschluss sensibler Bibliotheken, Sensitivity Labels, DLP", verantwortlicher: "IT / Datenschutz", status: "offen" }, { titel: "Verarbeitung sensibler oder vertraulicher Daten ohne ausreichende Einschränkung", beschreibung: "Besonders schützenswerte Inhalte werden in Prompts oder Kontexten verarbeitet, obwohl dies organisatorisch oder rechtlich unzulässig ist.", betroffeneRechte: "Vertraulichkeit, Integrität", betroffeneGruppen: "Beschäftigte, Kunden, Patienten, Mandanten", datenarten: "besondere Kategorien personenbezogener Daten, vertrauliche Inhalte", ursache: "Fehlende Nutzungsrichtlinien und technische Restriktionen", bestehendeKontrollen: "Allgemeine Datenschutzregeln", eintrittswahrscheinlichkeit: "mittel", schweregrad: "hoch", inhärentesRisiko: "hoch", restrisiko: "mittel", weitereMassnahmen: "KI-Nutzungsrichtlinie, Schulung, Ausschluss sensibler Bereiche", verantwortlicher: "Datenschutz / Fachbereich", status: "offen" }, { titel: "Unzureichende Transparenz gegenüber Beschäftigten und sonstigen Betroffenen", beschreibung: "Betroffene verstehen nicht ausreichend, dass und wie personenbezogene Daten im Rahmen des Copilot-Einsatzes verarbeitet werden.", betroffeneRechte: "Transparenz, informationelle Selbstbestimmung", betroffeneGruppen: "Beschäftigte, Kunden, Ansprechpartner", datenarten: "Kommunikations- und Inhaltsdaten", ursache: "Fehlende oder unklare Informationen", bestehendeKontrollen: "Allgemeine Datenschutzhinweise", eintrittswahrscheinlichkeit: "mittel", schweregrad: "mittel", inhärentesRisiko: "mittel", restrisiko: "niedrig", weitereMassnahmen: "Mitarbeiterinformation, Governance-Dokumentation, interne Kommunikation", verantwortlicher: "Datenschutz / HR", status: "offen" }], massnahmen: "Berechtigungsreview vor Rollout, Freigaben in SharePoint und Teams prüfen, sensible Bereiche einschränken oder ausschließen, Purview / DLP / Labels konfigurieren, Mitarbeiterinformation erstellen, Betriebsrat einbinden, KI-Nutzungsrichtlinie einführen, DSFA regelmäßig reviewen, Audit- und Logauswertung definieren.", restrisikoBegruendung: "Das verbleibende Risiko ist nur bei wirksam umgesetztem Berechtigungs-, Governance- und Kontrollkonzept vertretbar.", art36Erforderlich: false, art36Begruendung: "", ergebnis: "offen", konsultation: false, status: "entwurf", reviewer: "", verantwortlicherBereich: "Datenschutz / IT / Compliance", dsbBeteiligt: true, dsbStellungnahme: "", freigabeentscheidung: "", freigabeBegruendung: "", freigabeDatum: "", naechstePruefungAm: "" }
        ],
        tom: [
          { kategorie: "zugriffskontrolle", massnahme: "Rollen- und Berechtigungskonzept für M365-Datenquellen überprüfen", beschreibung: "Prüfung von Rollen, Gruppen, Bibliotheken, Teams und individuellen Freigaben auf Oversharing-Risiken.", status: "geplant", verantwortlicher: "IT", pruefDatum: "", pruefintervall: "halbjährlich", schutzziel: "Vertraulichkeit", nachweis: "", wirksamkeit: "", notizen: "" },
          { kategorie: "trennung", massnahme: "Vertrauliche Bereiche und sensible Bibliotheken gesondert absichern", beschreibung: "Sensible Inhalte und besonders geschützte Bereiche sind organisatorisch und technisch vom allgemeinen Copilot-Kontext abzugrenzen.", status: "geplant", verantwortlicher: "IT / Fachbereich", pruefDatum: "", pruefintervall: "quartalsweise", schutzziel: "Vertraulichkeit", nachweis: "", wirksamkeit: "", notizen: "" },
          { kategorie: "weitergabe", massnahme: "Externe Freigaben und Link-Sharing überprüfen und einschränken", beschreibung: "Öffentliche oder unkontrollierte Freigaben sind im Hinblick auf Copilot-Risiken besonders zu prüfen.", status: "geplant", verantwortlicher: "IT", pruefDatum: "", pruefintervall: "quartalsweise", schutzziel: "Vertraulichkeit", nachweis: "", wirksamkeit: "", notizen: "" },
          { kategorie: "zugangskontrolle", massnahme: "MFA und bedingte Zugriffe für relevante Benutzergruppen absichern", beschreibung: "Zugriff auf produktive KI-gestützte Dienste nur unter wirksamen Authentifizierungs- und Zugriffsbedingungen.", status: "geplant", verantwortlicher: "IT", pruefDatum: "", pruefintervall: "jährlich", schutzziel: "Vertraulichkeit", nachweis: "", wirksamkeit: "", notizen: "" },
          { kategorie: "auftrag", massnahme: "Microsoft-Vertragsunterlagen, DPA und Subprocessor-Prüfung dokumentieren", beschreibung: "Vertragliche und organisatorische Kontrolle des Auftragsverarbeiters und seiner Unterauftragnehmer dokumentieren.", status: "geplant", verantwortlicher: "Datenschutz / Einkauf", pruefDatum: "", pruefintervall: "jährlich", schutzziel: "Rechtmäßigkeit", nachweis: "", wirksamkeit: "", notizen: "" },
          { kategorie: "eingabe", massnahme: "Audit-Logs und Nachvollziehbarkeit für relevante Copilot- und M365-Aktivitäten sicherstellen", beschreibung: "Sicherstellen, dass sicherheits- und compliance-relevante Aktivitäten nachvollzogen und geprüft werden können.", status: "geplant", verantwortlicher: "IT / Compliance", pruefDatum: "", pruefintervall: "monatlich", schutzziel: "Nachvollziehbarkeit", nachweis: "", wirksamkeit: "", notizen: "" },
          { kategorie: "verfuegbarkeit", massnahme: "Retention-, Backup- und Wiederherstellungslogik dokumentieren", beschreibung: "Sicherstellen, dass Lösch- und Aufbewahrungslogik sowie Wiederherstellungsfähigkeit dokumentiert und abgestimmt sind.", status: "geplant", verantwortlicher: "IT", pruefDatum: "", pruefintervall: "jährlich", schutzziel: "Verfügbarkeit", nachweis: "", wirksamkeit: "", notizen: "" },
          { kategorie: "trennung", massnahme: "Richtlinie für zulässige und unzulässige KI-Nutzung festlegen", beschreibung: "Verbotene Inhalte, sensible Eingaben, Prüfpflichten und Eskalationsregeln verbindlich festlegen.", status: "geplant", verantwortlicher: "Datenschutz / Compliance / HR", pruefDatum: "", pruefintervall: "jährlich", schutzziel: "Rechtmäßigkeit", nachweis: "", wirksamkeit: "", notizen: "" }
        ]
      }, null, 2), name: "Microsoft 365 Copilot – Datenschutz- & Compliance-Paket", beschreibung: "Musterpaket für datenschutzrechtliche Bewertung, Governance und Dokumentation beim Einsatz von Microsoft 365 Copilot.", kategorie: "ki-compliance", version: "1.0" }));
    }
    if (key === "dsgvo") {
      setForm((p) => ({ ...p, inhaltJson: JSON.stringify({
        aufgaben: [
          { titel: "VVT initial erfassen", typ: "task", prioritaet: "hoch", status: "offen", kategorie: "vvt" },
          { titel: "Datenschutzleitlinie abstimmen", typ: "milestone", prioritaet: "mittel", status: "offen", kategorie: "dokumente" }
        ],
        dokumente: [
          { titel: "Datenschutzleitlinie", kategorie: "leitlinie_datenschutz", dokumentTyp: "leitlinie", status: "entwurf", version: "1.0" },
          { titel: "Risikobewertung Standardprozess", kategorie: "risikobewertung", dokumentTyp: "bewertung", status: "entwurf", version: "1.0" }
        ]
      }, null, 2) }));
    }
    if (key === "isms") {
      setForm((p) => ({ ...p, inhaltJson: JSON.stringify({
        aufgaben: [
          { titel: "Informationssicherheitsleitlinie abstimmen", typ: "task", prioritaet: "hoch", status: "offen", kategorie: "dokumente" },
          { titel: "IT-Schutzmaßnahmen reviewen", typ: "review", prioritaet: "mittel", status: "offen", kategorie: "tom" }
        ],
        dokumente: [
          { titel: "Informationssicherheitsleitlinie", kategorie: "leitlinie_informationssicherheit", dokumentTyp: "leitlinie", status: "entwurf", version: "1.0" },
          { titel: "Prozessbeschreibung Incident Handling", kategorie: "prozessbeschreibung", dokumentTyp: "prozess", status: "entwurf", version: "1.0" }
        ]
      }, null, 2) }));
    }
  };
  const save = async () => {
    try {
      const builderJson = {
        aufgaben: builderTasks.map((titel) => ({ titel, typ: "task", prioritaet: "mittel", status: "offen", kategorie: "sonstige" })),
        dokumente: builderDocs.map((titel) => ({ titel, kategorie: "vorlage", dokumentTyp: "vorlage", status: "entwurf", version: "1.0" })),
      };
      const merged = builderTasks.length || builderDocs.length ? JSON.stringify(builderJson, null, 2) : form.inhaltJson;
      JSON.parse(merged || "{}");
      const payload = { ...form, inhaltJson: merged };
      if (modal === "new") await apiRequest("POST", "/api/vorlagenpakete", payload);
      else await apiRequest("PUT", `/api/vorlagenpakete/${modal.id}`, payload);
      qc.invalidateQueries({ queryKey: ["/api/vorlagenpakete"] });
      setModal(null);
      toast({ title: "Vorlagenpaket gespeichert" });
    } catch {
      toast({ title: "Inhalt JSON ungültig", variant: "destructive" });
    }
  };

  return (
    <div>
      <PageHeader title={t("templatesTitle")} desc={t("templatesDesc")}
        action={<Button size="sm" className="bg-primary h-8 text-xs gap-1.5" onClick={openNew}><Plus className="h-3.5 w-3.5" />Neues Paket</Button>} />
      {isLoading ? <Skeleton className="h-32 w-full" /> : (
        <div className="space-y-2">
          {pakete.map((p: any) => (
            <Card key={p.id} className="group hover:border-border/80 transition-colors">
              <CardContent className="py-3 px-4 flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center sm:gap-4">
                <div>
                  <p className="text-sm font-medium">{p.name}</p>
                  <p className="text-xs text-muted-foreground">{p.kategorie}{p.beschreibung ? ` · ${p.beschreibung}` : ""}</p>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge value={p.aktiv ? "aktiv" : "archiviert"} />
                  <button onClick={() => duplicatePaket(p)} className="p-1 rounded text-muted-foreground hover:text-foreground"><Copy className="h-3.5 w-3.5" /></button>
                  <button onClick={() => openEdit(p)} className="p-1 rounded text-muted-foreground hover:text-foreground"><Pencil className="h-3.5 w-3.5" /></button>
                  <button onClick={() => setDelId(p.id)} className="p-1 rounded text-muted-foreground hover:text-red-400"><Trash2 className="h-3.5 w-3.5" /></button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      <Dialog open={!!modal} onOpenChange={o => !o && setModal(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{modal === "new" ? "Neues Vorlagenpaket" : "Vorlagenpaket bearbeiten"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1"><Label className="text-xs">Name *</Label><Input value={form.name} onChange={e => set("name", e.target.value)} className="h-8 text-sm" /></div>
              <div className="space-y-1"><Label className="text-xs">Kategorie</Label><Input value={form.kategorie} onChange={e => set("kategorie", e.target.value)} className="h-8 text-sm" /></div>
              <div className="space-y-1"><Label className="text-xs">Version</Label><Input value={form.version} onChange={e => set("version", e.target.value)} className="h-8 text-sm" /></div>
              <div className="col-span-2 space-y-1"><Label className="text-xs">Schnellvorlage</Label>
                <div className="flex gap-2">
                  <Button type="button" variant={preset === "leer" ? "default" : "outline"} size="sm" onClick={() => applyPreset("leer")}>Leer</Button>
                  <Button type="button" variant={preset === "kleinunternehmen" ? "default" : "outline"} size="sm" onClick={() => applyPreset("kleinunternehmen")}>Kleinunternehmen</Button>
                  <Button type="button" variant={preset === "mittelstand" ? "default" : "outline"} size="sm" onClick={() => applyPreset("mittelstand")}>Mittelständer</Button>
                  <Button type="button" variant={preset === "konzern" ? "default" : "outline"} size="sm" onClick={() => applyPreset("konzern")}>Konzern</Button>
                  <Button type="button" variant={preset === "dsgvo" ? "default" : "outline"} size="sm" onClick={() => applyPreset("dsgvo")}>DSGVO Basis</Button>
                  <Button type="button" variant={preset === "isms" ? "default" : "outline"} size="sm" onClick={() => applyPreset("isms")}>ISMS Basis</Button>
                  <Button type="button" variant={preset === "copilot" ? "default" : "outline"} size="sm" onClick={() => applyPreset("copilot")}>M365 Copilot</Button>
                </div>
              </div>
              <div className="col-span-2 space-y-1"><Label className="text-xs">Beschreibung</Label><Textarea value={form.beschreibung} onChange={e => set("beschreibung", e.target.value)} className="text-sm min-h-16" /></div>
              <div className="col-span-2 grid grid-cols-2 gap-3">
                <div className="space-y-2 rounded-lg border p-3">
                  <Label className="text-xs">Bausteine Aufgaben</Label>
                  <div className="flex flex-wrap gap-2">
                    {["VVT erfassen", "TOM prüfen", "DSFA prüfen", "Leitlinie abstimmen"].map((item) => (
                      <button key={item} type="button" onClick={() => setBuilderTasks((prev) => prev.includes(item) ? prev.filter((x) => x !== item) : [...prev, item])} className={`px-2 py-1 rounded text-xs ${builderTasks.includes(item) ? "bg-primary text-white" : "bg-secondary text-muted-foreground"}`}>{item}</button>
                    ))}
                  </div>
                </div>
                <div className="space-y-2 rounded-lg border p-3">
                  <Label className="text-xs">Bausteine Dokumente</Label>
                  <div className="flex flex-wrap gap-2">
                    {["Datenschutzleitlinie", "IS-Leitlinie", "Risikobewertung", "Prozessbeschreibung"].map((item) => (
                      <button key={item} type="button" onClick={() => setBuilderDocs((prev) => prev.includes(item) ? prev.filter((x) => x !== item) : [...prev, item])} className={`px-2 py-1 rounded text-xs ${builderDocs.includes(item) ? "bg-primary text-white" : "bg-secondary text-muted-foreground"}`}>{item}</button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="col-span-2 space-y-1"><Label className="text-xs">Inhalt (JSON)</Label><Textarea value={form.inhaltJson} onChange={e => set("inhaltJson", e.target.value)} className="font-mono text-xs min-h-60" /></div>
            </div>
            <div className="sticky bottom-0 z-10 -mx-6 mt-2 border-t bg-background px-6 pt-3 pb-1">
              <DialogFooter>
                <Button variant="outline" size="sm" onClick={() => setModal(null)}>Abbrechen</Button>
                <Button size="sm" className="bg-primary" onClick={save} disabled={!form.name}>Speichern</Button>
              </DialogFooter>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      <ConfirmDialog open={delId !== null} title="Vorlagenpaket löschen?" desc="Bereits angewandte Inhalte bei Mandanten bleiben bestehen."
        onConfirm={async () => { await apiRequest("DELETE", `/api/vorlagenpakete/${delId}`); qc.invalidateQueries({ queryKey: ["/api/vorlagenpakete"] }); setDelId(null); }}
        onCancel={() => setDelId(null)} />
    </div>
  );
}

// ─── BENUTZER ADMIN PAGE ───────────────────────────────────────────────────
function BenutzerPage() {
  const { t } = useI18n();
  const qc = useQueryClient();
  const { data: users = [], isLoading } = useQuery({
    queryKey: ["/api/users"],
    queryFn: () => apiRequest("GET", "/api/users").then(r => r.json()),
  });
  const { data: mandanten = [] } = useQuery({
    queryKey: ["/api/mandanten"],
    queryFn: () => apiRequest("GET", "/api/mandanten").then(r => r.json()),
  });
  const [modal, setModal] = useState<null | "new" | any>(null);
  const [delId, setDelId] = useState<number | null>(null);
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "user", mandantIds: "[]", failedLoginAttempts: 0, temporaryLockUntil: null as string | null, adminLocked: false, adminLockedAt: null as string | null, lastFailedLoginAt: null as string | null });
  const { toast } = useToast();
  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

  const openNew = () => { setForm({ name: "", email: "", password: "", role: "user", mandantIds: "[]", failedLoginAttempts: 0, temporaryLockUntil: null, adminLocked: false, adminLockedAt: null, lastFailedLoginAt: null }); setModal("new"); };
  const openEdit = (u: any) => { setForm({ ...u, password: "" }); setModal(u); };

  const save = async () => {
    try {
      const body = { ...form };
      if (!body.password) delete (body as any).password;
      if (modal === "new") await apiRequest("POST", "/api/users", body);
      else await apiRequest("PUT", `/api/users/${modal.id}`, body);
      qc.invalidateQueries({ queryKey: ["/api/users"] });
      setModal(null);
      toast({ title: "Gespeichert" });
    } catch (e: any) { toast({ title: "Fehler", description: e.message, variant: "destructive" }); }
  };

  const toggleMandant = (id: number) => {
    const ids: number[] = JSON.parse(form.mandantIds || "[]");
    const next = ids.includes(id) ? ids.filter(i => i !== id) : [...ids, id];
    setForm(p => ({ ...p, mandantIds: JSON.stringify(next) }));
  };
  const selectedIds: number[] = JSON.parse(form.mandantIds || "[]");
  const usersWithAdminLock = users.filter((u: any) => u.adminLocked).length;
  const usersWithTempLock = users.filter((u: any) => !u.adminLocked && u.temporaryLockUntil && new Date(u.temporaryLockUntil).getTime() > Date.now()).length;
  const usersWithoutMandants = users.filter((u: any) => u.role !== "admin" && JSON.parse(u.mandantIds || "[]").length === 0).length;
  const usersWithBroadAccess = users.filter((u: any) => u.role !== "admin" && JSON.parse(u.mandantIds || "[]").length >= 3).length;

  return (
    <div>
      <PageHeader title={t("usersTitle")} desc={t("usersDesc")}
        action={<Button size="sm" className="bg-primary h-8 text-xs gap-1.5" onClick={openNew}><Plus className="h-3.5 w-3.5" />Neuer Benutzer</Button>} />
      {isLoading ? <Skeleton className="h-32 w-full" /> : (
        <div className="space-y-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Admin-Sperren</p><p className="text-2xl font-bold">{usersWithAdminLock}</p></CardContent></Card>
            <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Zeit-Sperren</p><p className="text-2xl font-bold">{usersWithTempLock}</p></CardContent></Card>
            <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Benutzer ohne Mandant</p><p className="text-2xl font-bold">{usersWithoutMandants}</p></CardContent></Card>
            <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Breite Zugriffe (≥3)</p><p className="text-2xl font-bold">{usersWithBroadAccess}</p></CardContent></Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Sicherheitsübersicht</CardTitle>
              <CardDescription>Überblick über Sperren, Zugriffe und auffällige Benutzerkonstellationen.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {usersWithAdminLock > 0 && <div className="rounded-lg border border-red-500/20 bg-red-500/5 px-3 py-2">Es gibt aktuell <strong>{usersWithAdminLock}</strong> administrativ gesperrte Benutzer.</div>}
              {usersWithTempLock > 0 && <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2">Es gibt aktuell <strong>{usersWithTempLock}</strong> Benutzer mit temporärer Login-Sperre.</div>}
              {usersWithoutMandants > 0 && <div className="rounded-lg border border-zinc-500/20 bg-zinc-500/5 px-3 py-2"><strong>{usersWithoutMandants}</strong> nicht-administrative Benutzer haben derzeit keinen Mandanten zugewiesen.</div>}
              {usersWithBroadAccess > 0 && <div className="rounded-lg border border-blue-500/20 bg-blue-500/5 px-3 py-2"><strong>{usersWithBroadAccess}</strong> nicht-administrative Benutzer haben Zugriff auf mindestens drei Mandanten.</div>}
              {usersWithAdminLock === 0 && usersWithTempLock === 0 && usersWithoutMandants === 0 && usersWithBroadAccess === 0 && <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-3 py-2">Aktuell keine auffälligen Sicherheitsindikatoren in der Benutzerverwaltung.</div>}
            </CardContent>
          </Card>

          <div className="space-y-2">
            {users.map((u: any) => (
            <Card key={u.id} className="group hover:border-border/80 transition-colors">
              <CardContent className="py-3 px-4 flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center sm:gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-7 h-7 rounded-full bg-primary/15 flex items-center justify-center text-xs font-bold text-primary shrink-0">{u.name.charAt(0)}</div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{u.name}</p>
                    <p className="text-xs text-muted-foreground">{u.email} · {u.role === "admin" ? "Administrator" : u.role === "dsb" ? "DSB" : "Nutzer"}</p>
                    <p className="text-xs text-muted-foreground mt-1">Mandanten: {u.role === "admin" ? "Alle" : (() => {
                      try {
                        const ids: number[] = JSON.parse(u.mandantIds || "[]");
                        const names = mandanten.filter((m: any) => ids.includes(m.id)).map((m: any) => m.name);
                        return names.length ? names.join(", ") : "Keine Zuweisung";
                      } catch {
                        return "Keine Zuweisung";
                      }
                    })()}</p>
                  </div>
                </div>
                <div className="flex w-full items-center justify-between gap-2 shrink-0 sm:w-auto sm:justify-end">
                  <div className="flex items-center gap-2 flex-wrap justify-end">
                    <Badge variant="outline" className="text-xs">{u.role}</Badge>
                    {u.adminLocked && <Badge variant="destructive" className="text-xs">Admin-Sperre</Badge>}
                    {!u.adminLocked && u.temporaryLockUntil && new Date(u.temporaryLockUntil).getTime() > Date.now() && <Badge variant="outline" className="text-xs border-amber-500/40 text-amber-600">Zeit-Sperre</Badge>}
                  </div>
                  <button onClick={() => openEdit(u)} className="p-1 rounded text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-all"><Pencil className="h-3.5 w-3.5" /></button>
                  <button onClick={() => setDelId(u.id)} className="p-1 rounded text-muted-foreground hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"><Trash2 className="h-3.5 w-3.5" /></button>
                </div>
              </CardContent>
            </Card>
          ))}
          </div>
        </div>
      )}
      <Dialog open={!!modal} onOpenChange={o => !o && setModal(null)}>
        <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{modal === "new" ? "Neuer Benutzer" : "Benutzer bearbeiten"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="col-span-2 space-y-1"><Label className="text-xs">Name *</Label><Input value={form.name} onChange={e => set("name", e.target.value)} className="h-8 text-sm" /></div>
              <div className="col-span-2 space-y-1"><Label className="text-xs">E-Mail *</Label><Input type="email" value={form.email} onChange={e => set("email", e.target.value)} className="h-8 text-sm" /></div>
              <div className="col-span-2 space-y-1"><Label className="text-xs">{modal === "new" ? "Passwort *" : "Passwort (leer = unverändert)"}</Label><Input type="password" value={form.password} onChange={e => set("password", e.target.value)} className="h-8 text-sm" placeholder="Mind. 12 Zeichen, inkl. Groß-/Kleinbuchstabe, Zahl und Sonderzeichen" /></div>
              <div className="col-span-2 space-y-1"><Label className="text-xs">Rolle</Label>
                <Select value={form.role} onValueChange={v => set("role", v)}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="admin">Administrator</SelectItem><SelectItem value="dsb">DSB</SelectItem><SelectItem value="user">Nutzer</SelectItem></SelectContent>
                </Select>
              </div>
              {form.role !== "admin" && (
                <div className="col-span-2 space-y-1">
                  <Label className="text-xs">Mandanten-Zugang</Label>
                  <div className="space-y-1 max-h-32 overflow-y-auto border border-border rounded-lg p-2">
                    {mandanten.map((m: any) => (
                      <label key={m.id} className="flex items-center gap-2 cursor-pointer text-xs p-1 rounded hover:bg-secondary">
                        <input type="checkbox" checked={selectedIds.includes(m.id)} onChange={() => toggleMandant(m.id)} className="rounded" />{m.name}
                      </label>
                    ))}
                    {mandanten.length === 0 && <p className="text-xs text-muted-foreground">Keine Mandanten vorhanden</p>}
                  </div>
                </div>
              )}
              {modal !== "new" && (
                <div className="col-span-2 rounded-lg border p-3 space-y-2 text-xs">
                  <p><span className="font-medium">Fehlversuche:</span> {form.failedLoginAttempts || 0}</p>
                  <p><span className="font-medium">Temporäre Sperre bis:</span> {form.temporaryLockUntil ? new Date(form.temporaryLockUntil).toLocaleString("de-DE") : "—"}</p>
                  <p><span className="font-medium">Admin-Sperre:</span> {form.adminLocked ? `Ja${form.adminLockedAt ? ` (seit ${new Date(form.adminLockedAt).toLocaleString("de-DE")})` : ""}` : "Nein"}</p>
                  <div>
                    <Button type="button" variant="outline" size="sm" onClick={async () => {
                      try {
                        await apiRequest("PUT", `/api/users/${modal.id}`, { unlockUser: true });
                        qc.invalidateQueries({ queryKey: ["/api/users"] });
                        setModal(null);
                        toast({ title: "Benutzer entsperrt" });
                      } catch (e: any) {
                        toast({ title: "Fehler", description: e.message, variant: "destructive" });
                      }
                    }} disabled={!form.adminLocked && !(form.temporaryLockUntil && new Date(form.temporaryLockUntil).getTime() > Date.now())}>
                      Benutzer entsperren
                    </Button>
                  </div>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" size="sm" onClick={() => setModal(null)}>Abbrechen</Button>
              <Button size="sm" className="bg-primary" onClick={save} disabled={!form.name || !form.email}>Speichern</Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
      <ConfirmDialog open={delId !== null} title="Benutzer löschen?" desc="Der Benutzer wird unwiderruflich entfernt."
        onConfirm={async () => { await apiRequest("DELETE", `/api/users/${delId}`); qc.invalidateQueries({ queryKey: ["/api/users"] }); setDelId(null); }}
        onCancel={() => setDelId(null)} />
    </div>
  );
}

// ─── ROOT APP ──────────────────────────────────────────────────────────────
function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [restoring, setRestoring] = useState<boolean>(true);

  const login = (u: AuthUser) => {
    setUser(u);
    setRestoring(false);
    setApiCsrfToken(u.csrfToken || null);
  };
  const logout = async () => {
    try {
      await apiRequest("POST", "/api/auth/logout", {});
    } catch {}
    setUser(null); setRestoring(false); setApiCsrfToken(null); queryClient.clear();
    localStorage.removeItem("privashield_active_mandant_id");
  };

  useEffect(() => {
    setApiCsrfToken(user?.csrfToken || null);

    let cancelled = false;
    fetch("/api/auth/me", {
      credentials: "same-origin",
    })
      .then(async (res) => {
        if (res.status === 401) return null;
        if (!res.ok) throw new Error("Session ungültig");
        return res.json();
      })
      .then((safeUser) => {
        if (cancelled) return;
        setUser(safeUser);
        setApiCsrfToken(safeUser?.csrfToken || null);
        if (!safeUser) {
          localStorage.removeItem("privashield_active_mandant_id");
          queryClient.clear();
        }
      })
      .catch(() => {
        if (cancelled) return;
        localStorage.removeItem("privashield_active_mandant_id");
        setUser(null);
        setApiCsrfToken(null);
        queryClient.clear();
      })
      .finally(() => {
        if (!cancelled) setRestoring(false);
      });

    return () => { cancelled = true; };
  }, []);

  if (restoring) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-sm border-border/60">
          <CardContent className="pt-6 text-center space-y-3">
            <Skeleton className="h-10 w-10 rounded-full mx-auto" />
            <p className="text-sm text-muted-foreground">Sitzung wird wiederhergestellt...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!user) return <LoginPage onLogin={login} />;
  return (
    <AuthCtx.Provider value={{ user, login, logout }}>
      {children}
    </AuthCtx.Provider>
  );
}

// ─── SYSTEM PAGE (DB-Backend-Umschalter) ────────────────────────────────────
function SystemPage() {
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data: cfg, isLoading } = useQuery({
    queryKey: ["/api/admin/db-config"],
    queryFn: () => apiRequest("GET", "/api/admin/db-config").then(r => r.json()),
  });

  const switchMutation = useMutation({
    mutationFn: (backend: string) =>
      apiRequest("POST", "/api/admin/db-config", { backend }).then(r => r.json()),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["/api/admin/db-config"] });
      toast({ title: "Backend gewechselt", description: data.message });
    },
    onError: () => toast({ title: "Fehler", description: "Backend-Wechsel fehlgeschlagen", variant: "destructive" }),
  });

  const current: string = cfg?.backend ?? "lowdb";

  return (
    <div className="p-6 space-y-6 max-w-2xl">
      <PageHeader
        title="System-Einstellungen"
        desc="Konfiguration des Datenbankbackends und Systeminformationen"
      />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Database className="h-4 w-4 text-primary" />
            Datenbankbackend
          </CardTitle>
          <CardDescription>
            Wähle, wie Daten gespeichert werden. Änderungen sind sofort aktiv —
            ein Neustart ist nicht erforderlich. Hinweis: Bestehende Daten werden
            beim Wechsel nicht migriert.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? (
            <Skeleton className="h-20 w-full" />
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {/* lowdb */}
              <button
                onClick={() => current !== "lowdb" && switchMutation.mutate("lowdb")}
                disabled={switchMutation.isPending}
                className={`flex flex-col items-start gap-2 rounded-lg border p-4 text-left transition-colors ${
                  current === "lowdb"
                    ? "border-primary bg-primary/10 ring-1 ring-primary"
                    : "border-border hover:border-primary/50"
                }`}
              >
                <div className="flex items-center gap-2">
                  <HardDrive className="h-5 w-5 text-primary" />
                  <span className="font-semibold text-sm">lowdb (Standard)</span>
                  {current === "lowdb" && (
                    <Badge className="text-xs bg-primary text-primary-foreground ml-auto">Aktiv</Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  JSON-Datei im Datenverzeichnis. Kein nativer Build-Schritt,
                  einfach portierbar, ideal für kleine bis mittlere Installationen.
                </p>
              </button>

              {/* SQLite */}
              <button
                onClick={() => current !== "sqlite" && switchMutation.mutate("sqlite")}
                disabled={switchMutation.isPending}
                className={`flex flex-col items-start gap-2 rounded-lg border p-4 text-left transition-colors ${
                  current === "sqlite"
                    ? "border-primary bg-primary/10 ring-1 ring-primary"
                    : "border-border hover:border-primary/50"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Database className="h-5 w-5 text-amber-400" />
                  <span className="font-semibold text-sm">SQLite</span>
                  {current === "sqlite" && (
                    <Badge className="text-xs bg-amber-500 text-white ml-auto">Aktiv</Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  better-sqlite3 mit Drizzle ORM. Höhere Abfragegeschwindigkeit
                  bei großen Datenmengen, benötigt nativen Compiler beim Build.
                </p>
              </button>
            </div>
          )}

          <div className="rounded-md bg-muted/40 p-3 text-xs text-muted-foreground space-y-1">
            <p className="font-medium text-foreground">Datenpfade:</p>
            <p>lowdb: <code className="font-mono text-primary">data/privashield.json</code></p>
            <p>SQLite: <code className="font-mono text-primary">data/privashield.db</code> (via env DATABASE_PATH)</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Shield className="h-4 w-4 text-primary" />
            Plattform-Info
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Version</span>
            <span className="font-mono">{APP_VERSION}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Lizenz</span>
            <span className="font-mono">Apache-2.0</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Copyright</span>
            <span className="font-mono">Copyright [2026] [Daniel Schuh]</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Stack</span>
            <span className="font-mono">Express · React · Drizzle · lowdb</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Auth</span>
            <span className="font-mono">JWT (8h)</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Aktives Backend</span>
            <Badge variant="outline" className="font-mono">{current}</Badge>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <FileText className="h-4 w-4 text-primary" />
            Lizenztext, Apache License 2.0
          </CardTitle>
          <CardDescription>
            Aktueller Lizenztext der Anwendung in Markdown-Form.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <pre className="max-h-[28rem] overflow-auto whitespace-pre-wrap rounded-md border bg-muted/30 p-4 text-xs leading-5 text-muted-foreground">{licenseText}</pre>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── EXPORT PAGE (Druckansicht-Auswahl) ──────────────────────────────────────
const EXPORT_MODULES = [
  { key: "interne_notizen", label: "Interne Notizen (freigegeben)", icon: NotebookPen, color: "text-amber-400" },
  { key: "vvt", label: "Verarbeitungsverzeichnis (VVT)", icon: FileText, color: "text-teal-400" },
  { key: "avv", label: "Auftragsverarbeitungsverträge (AVV)", icon: Shield, color: "text-blue-400" },
  { key: "dsfa", label: "Datenschutz-Folgenabschätzung (DSFA)", icon: AlertTriangle, color: "text-yellow-400" },
  { key: "datenpannen", label: "Datenpannen (Art. 33/34)", icon: AlertCircle, color: "text-red-400" },
  { key: "dsr", label: "Betroffenenrechte / DSR (Art. 15–22)", icon: UserCheck, color: "text-purple-400" },
  { key: "tom", label: "TOM-Katalog (Art. 32)", icon: Lock, color: "text-green-400" },
  { key: "audits", label: "Interne Audits & Auditprotokoll", icon: ClipboardList, color: "text-cyan-400" },
  { key: "pdca", label: "PDCA / Verbesserungszyklus", icon: RefreshCcw, color: "text-sky-400" },
  { key: "loeschkonzept", label: "Löschkonzept & Löschklassen", icon: Database, color: "text-sky-400" },
  { key: "aufgaben", label: "Aufgaben & Maßnahmenplan", icon: CheckSquare, color: "text-orange-400" },
  { key: "dokumente", label: "Dokumente & Vorlagen", icon: FolderOpen, color: "text-slate-400" },
];

function ExportPage() {
  const { t } = useI18n();
  const { activeMandantId } = useMandant();
  const [selected, setSelected] = useState<Set<string>>(new Set(EXPORT_MODULES.map((m) => m.key)));

  const [sections, setSections] = useState<Record<string, boolean>>({
    copilot_summary: true,
    executive_summary: true,
    management_kpis: true,
    governance_findings: true,
    score_details: true,
    audit_summary: true,
    loeschkonzept_summary: true,
    governance_worklist: true,
    audit_log: true,
  });

  const [logOption, setLogOption] = useState<"all" | "limit">("all");
  const [logLimit, setLogLimit] = useState<number>(50);
  const [logModule, setLogModule] = useState<string>("all");
  const [logUser, setLogUser] = useState<string>("all");
  const [logAction, setLogAction] = useState<string>("all");

  const OPTIONAL_SECTIONS = [
    { key: "executive_summary", label: "Executive Summary", icon: NotebookPen, color: "text-blue-400" },
    { key: "management_kpis", label: "Management KPIs & Governance-Status", icon: TrendingUp, color: "text-teal-400" },
    { key: "copilot_summary", label: "Microsoft 365 Copilot – Datenschutz & Compliance", icon: Bot, color: "text-purple-400" },
    { key: "governance_worklist", label: "Priorisierte Governance-Arbeitsliste", icon: AlertTriangle, color: "text-yellow-400" },
    { key: "governance_findings", label: "Governance-Bewertung & offene Punkte", icon: AlertCircle, color: "text-red-400" },
    { key: "score_details", label: "Score-Details nach Kriteriengewichtung", icon: CheckCircle2, color: "text-emerald-400" },
    { key: "audit_summary", label: "Auditprotokoll, Abweichungen & To-dos", icon: ClipboardList, color: "text-cyan-400" },
    { key: "loeschkonzept_summary", label: "Löschkonzept, Löschklassen & Ampelstatus", icon: Database, color: "text-sky-400" },
    { key: "audit_log", label: "Änderungsprotokoll / Audit-Log", icon: HardDrive, color: "text-orange-400" },
  ];

  const { data: mandant } = useQuery({
    queryKey: [`/api/mandanten/${activeMandantId}`],
    queryFn: () => activeMandantId
      ? apiRequest("GET", `/api/mandanten/${activeMandantId}`).then((r) => r.json())
      : null,
    enabled: !!activeMandantId,
  });
  const { data: logs = [] } = useQuery({
    queryKey: ["/api/export-logs", activeMandantId],
    queryFn: () => activeMandantId ? apiRequest("GET", `/api/mandanten/${activeMandantId}/logs`).then((r) => r.json()) : [],
    enabled: !!activeMandantId,
  });

  const uniqueModules = Array.from(new Set(logs.map((l: any) => l.modul).filter(Boolean))) as string[];
  const uniqueUsers = Array.from(new Set(logs.map((l: any) => l.userName).filter(Boolean))) as string[];
  const uniqueActions = Array.from(new Set(logs.map((l: any) => l.aktion).filter(Boolean))) as string[];
  const { data: gruppen = [] } = useQuery({
    queryKey: ["/api/mandanten-gruppen"],
    queryFn: () => apiRequest("GET", "/api/mandanten-gruppen").then((r) => r.json()),
  });
  const { data: mandanten = [] } = useQuery({
    queryKey: ["/api/mandanten"],
    queryFn: () => apiRequest("GET", "/api/mandanten").then((r) => r.json()),
  });
  const { data: audits = [] } = useQuery({
    queryKey: [`/api/mandanten/${activeMandantId}/audits`],
    queryFn: () => activeMandantId ? apiRequest("GET", `/api/mandanten/${activeMandantId}/audits`).then((r) => r.json()) : [],
    enabled: !!activeMandantId,
  });
  const { data: stats } = useQuery({
    queryKey: [`/api/mandanten/${activeMandantId}/stats`],
    queryFn: () => activeMandantId ? apiRequest("GET", `/api/mandanten/${activeMandantId}/stats`).then((r) => r.json()) : null,
    enabled: !!activeMandantId,
  });
  const { data: dsfa = [] } = useQuery({
    queryKey: [`/api/mandanten/${activeMandantId}/dsfa`],
    queryFn: () => activeMandantId ? apiRequest("GET", `/api/mandanten/${activeMandantId}/dsfa`).then((r) => r.json()) : [],
    enabled: !!activeMandantId,
  });
  const { data: pdca = [] } = useQuery({
    queryKey: [`/api/mandanten/${activeMandantId}/pdca`],
    queryFn: () => activeMandantId ? apiRequest("GET", `/api/mandanten/${activeMandantId}/pdca`).then((r) => r.json()) : [],
    enabled: !!activeMandantId,
  });
  const { data: aufgaben = [] } = useQuery({
    queryKey: [`/api/mandanten/${activeMandantId}/aufgaben`],
    queryFn: () => activeMandantId ? apiRequest("GET", `/api/mandanten/${activeMandantId}/aufgaben`).then((r) => r.json()) : [],
    enabled: !!activeMandantId,
  });
  const { data: dokumente = [] } = useQuery({
    queryKey: [`/api/mandanten/${activeMandantId}/dokumente`],
    queryFn: () => activeMandantId ? apiRequest("GET", `/api/mandanten/${activeMandantId}/dokumente`).then((r) => r.json()) : [],
    enabled: !!activeMandantId,
  });
  const { data: vvt = [] } = useQuery({
    queryKey: [`/api/mandanten/${activeMandantId}/vvt`],
    queryFn: () => activeMandantId ? apiRequest("GET", `/api/mandanten/${activeMandantId}/vvt`).then((r) => r.json()) : [],
    enabled: !!activeMandantId,
  });
  const { data: loeschkonzept = [] } = useQuery({
    queryKey: [`/api/mandanten/${activeMandantId}/loeschkonzept`],
    queryFn: () => activeMandantId ? apiRequest("GET", `/api/mandanten/${activeMandantId}/loeschkonzept`).then((r) => r.json()) : [],
    enabled: !!activeMandantId,
  });
  const { data: tom = [] } = useQuery({
    queryKey: [`/api/mandanten/${activeMandantId}/tom`],
    queryFn: () => activeMandantId ? apiRequest("GET", `/api/mandanten/${activeMandantId}/tom`).then((r) => r.json()) : [],
    enabled: !!activeMandantId,
  });
  const { data: interneNotizen = [] } = useQuery({
    queryKey: [`/api/mandanten/${activeMandantId}/interne-notizen`],
    queryFn: () => activeMandantId ? apiRequest("GET", `/api/mandanten/${activeMandantId}/interne-notizen`).then((r) => r.json()) : [],
    enabled: !!activeMandantId,
  });
  const exportierbareInterneNotizen = interneNotizen.filter((note: any) => !!note.exportieren);
  const auditTodos = aufgaben.filter((a: any) => (a.kategorie === "audit" || String(a.titel || "").toLowerCase().includes("audit")) && a.status !== "erledigt");
  const auditDeviationCount = audits.reduce((sum: number, item: any) => sum + String(item.abweichungen || "").split("\n").filter((line: string) => line.trim()).length, 0);
  const pdcaReviewFaellig = pdca.filter((item: any) => item.naechstePruefungAm && new Date(item.naechstePruefungAm).getTime() < Date.now() && String(item.status || "") !== "abgeschlossen");
  const pdcaOffen = pdca.filter((item: any) => String(item.status || "") !== "abgeschlossen");
  const auditFollowUps = pdca.filter((item: any) => String(item.zyklusTyp || "") === "audit_follow_up");
  const auditFollowUpsOffen = auditFollowUps.filter((item: any) => String(item.status || "") !== "abgeschlossen");
  const pdcaMitAuditBezug = pdca.filter((item: any) => !!item.verknuepftesAuditId);
  const pdcaOhneAuditBezug = pdca.filter((item: any) => !item.verknuepftesAuditId);
  const pdcaFollowUpTasks = aufgaben.filter((item: any) => String(item.vorlagenBezug || "") === "pdca_follow_up");
  const pdcaFollowUpTasksOffen = pdcaFollowUpTasks.filter((item: any) => String(item.status || "") !== "erledigt");
  const explicitAuditLinks = audits.reduce((sum: number, item: any) => {
    try { return sum + JSON.parse(item.verknuepftePdcaIds || "[]").length; } catch { return sum; }
  }, 0);
  const auditFollowUpsOhneAuditBezug = auditFollowUps.filter((item: any) => !item.verknuepftesAuditId).length;
  const fehlendeLoeschBezuge = vvt.filter((entry: any) => !loeschkonzept.some((lk: any) => (lk.quelleVvtId && lk.quelleVvtId === entry.id) || String(lk.bezeichnung || "").trim().toLowerCase() === String(entry.bezeichnung || "").trim().toLowerCase())).length;
  const exportLeitlinienCategories = ["leitlinie", "leitlinie_datenschutz", "leitlinie_informationssicherheit", "richtlinie"];
  const exportProzessCategories = ["prozessbeschreibung", "verfahrensdokumentation"];

  const exportLeitlinienCount = dokumente.filter((d: any) => exportLeitlinienCategories.includes(d.kategorie)).length;
  const exportProzessDokCount = dokumente.filter((d: any) => exportProzessCategories.includes(d.kategorie)).length;

  const exportLeitlinienScore = dokumente
    .filter((d: any) => exportLeitlinienCategories.includes(d.kategorie))
    .reduce((sum: number, d: any) => sum + getDocMaturityWeight(d), 0);

  const exportProzessScore = dokumente
    .filter((d: any) => exportProzessCategories.includes(d.kategorie))
    .reduce((sum: number, d: any) => sum + getDocMaturityWeight(d), 0);

  const exportTomScore = tom.reduce((sum: number, t: any) => sum + getTomMaturityWeight(t), 0);

  const exportDsfaMitDsbCheck = dsfa.every((item: any) => !String(item.status || "").trim() || !!(mandant?.dsb || mandant?.dsbEmail || mandant?.datenschutzmanagerName));
  const exportDsfaOhneVvt = dsfa.filter((item: any) => !item.vvtId).length;
  const exportDsfaMitArt36 = dsfa.filter((item: any) => !!item.art36Erforderlich).length;
  const exportDsfaReviewFaellig = dsfa.filter((item: any) => item.naechstePruefungAm && new Date(item.naechstePruefungAm).getTime() < Date.now()).length;
  const exportDsfaMitHohemRestrisiko = dsfa.filter((item: any) => {
    try {
      const parsed = typeof item.risiken === "string" ? JSON.parse(item.risiken || "[]") : item.risiken;
      return Array.isArray(parsed) && parsed.some((risk: any) => String(risk?.restrisiko || "").toLowerCase() === "hoch");
    } catch {
      return false;
    }
  }).length;
  const exportKritischeAufgaben = aufgaben.filter((item: any) => String(item.prioritaet || "") === "kritisch" && String(item.status || "") !== "erledigt").length;
  const exportKritischeOderNotwendigeAufgaben = aufgaben.filter((item: any) => ["hoch", "kritisch"].includes(String(item.prioritaet || "")) && String(item.status || "") !== "erledigt").length;
  const exportTomUmfangreich = exportTomScore >= 6.24;
  const exportAvvVorhanden = (stats?.avv ?? 0) > 0;
  const exportWebDatenschutzCheck = dokumente.find((d: any) => d.kategorie === "prozessbeschreibung" && d.dokumentTyp === "web_datenschutz_check");
  const exportDatenschutzhinweiseCheck = dokumente.find((d: any) => d.kategorie === "prozessbeschreibung" && d.dokumentTyp === "datenschutzhinweise_check");
  const exportBeschaeftigtenDok = dokumente.find((d: any) => d.dokumentTyp === "beschaeftigten_datenschutz_check");
  const exportDokumenteCount = dokumente.length;
  const maturityCriteria = [
    { label: "Leitlinienbasis", weight: 6, score: exportLeitlinienScore >= 1.0 ? 6 : exportLeitlinienScore >= 0.5 ? 3 : 0 },
    { label: "Prozessdokumentation", weight: 5, score: exportProzessScore >= 2.34 ? 5 : exportProzessScore >= 1.95 ? 4 : exportProzessScore >= 1.0 ? 2 : exportProzessScore >= 0.5 ? 1 : 0 },
    { label: "Verzeichnis von Verarbeitungstätigkeiten", weight: 6, score: (stats?.vvt ?? 0) >= 3 ? 6 : (stats?.vvt ?? 0) > 0 ? 3 : 0 },
    { label: "DSFA-Struktur", weight: 8, score: exportDsfaMitDsbCheck && exportDsfaOhneVvt === 0 ? 8 : dsfa.length > 0 ? 4 : 0 },
    { label: "DSFA-Risikosteuerung", weight: 10, score: exportDsfaMitArt36 === 0 && exportDsfaMitHohemRestrisiko === 0 && exportDsfaReviewFaellig === 0 ? 10 : exportDsfaMitArt36 + exportDsfaMitHohemRestrisiko + exportDsfaReviewFaellig <= 2 ? 5 : 0 },
    { label: "Löschkonzept-Verknüpfung", weight: 6, score: fehlendeLoeschBezuge === 0 ? 6 : fehlendeLoeschBezuge <= 2 ? 3 : 0 },
    { label: "Audit-Struktur", weight: 12, score: audits.length > 0 ? (auditFollowUpsOhneAuditBezug === 0 && auditTodos.length <= 2 ? 12 : auditTodos.length <= 5 ? 6 : 2) : 0 },
    { label: "PDCA-Wirksamkeit", weight: 14, score: pdca.length > 0 ? (pdcaReviewFaellig.length === 0 && pdcaFollowUpTasksOffen.length <= 2 ? 14 : pdcaReviewFaellig.length <= 2 && pdcaFollowUpTasksOffen.length <= 5 ? 7 : 2) : 0 },
    { label: "TOM-Abdeckung", weight: 5, score: exportTomScore >= 6.24 ? 5 : exportTomScore >= 5.2 ? 4 : exportTomScore >= 3.0 ? 2 : exportTomScore >= 1.0 ? 1 : 0 },
    { label: "AVV-Abdeckung", weight: 4, score: exportAvvVorhanden ? 4 : 0 },
    { label: "Operative Aufgabensteuerung", weight: 8, score: exportKritischeAufgaben === 0 && exportKritischeOderNotwendigeAufgaben === 0 ? 8 : exportKritischeAufgaben <= 2 ? 4 : 0 },
    { label: "Web-/Hinweisprüfungen", weight: 4, score: !!exportWebDatenschutzCheck && !!exportDatenschutzhinweiseCheck ? 4 : (!!exportWebDatenschutzCheck || !!exportDatenschutzhinweiseCheck) ? 2 : 0 },
    { label: "Beschäftigtendatenschutz", weight: 4, score: !!exportBeschaeftigtenDok ? 4 : 0 },
    { label: "Dokumentenreife", weight: 3, score: exportDokumenteCount >= 6 ? 3 : exportDokumenteCount >= 3 ? 1 : 0 },
    { label: "Verantwortungsstruktur", weight: 5, score: mandant?.verantwortlicherName ? 5 : 0 },
  ];
  const maturityWeightTotal = maturityCriteria.reduce((sum, item) => sum + item.weight, 0);
  const maturityScoreRaw = maturityCriteria.reduce((sum, item) => sum + item.score, 0);
  const reifegradScore = Math.round((maturityScoreRaw / maturityWeightTotal) * 100);
  const reifegradAmpel = reifegradScore >= 95 ? "Grün" : reifegradScore >= 80 ? "Gelb" : "Rot";
  const deriveMaturityRecommendation = (label: string) => {
    const normalized = String(label || "").toLowerCase();
    if (normalized.includes("audit")) return "Audits nachziehen, offene Audit-Punkte terminieren und Verknüpfungen bereinigen.";
    if (normalized.includes("pdca")) return "Fällige Reviews durchführen und offene PDCA-Folgeaufgaben verbindlich abschließen.";
    if (normalized.includes("dsfa-risikosteuerung")) return "Art.-36-, Restrisiko- und Review-Fälle priorisiert juristisch und operativ schließen.";
    if (normalized.includes("dsfa-struktur")) return "DSFA-VVT-Bezüge und Governance-Rollen in den DSFA-Datensätzen vervollständigen.";
    if (normalized.includes("löschkonzept")) return "Fehlende VVT-Löschkonzept-Verknüpfungen ergänzen und dokumentieren.";
    if (normalized.includes("aufgabensteuerung")) return "Kritische und hohe Aufgaben priorisieren, Verantwortliche bestätigen und Fälligkeiten nachziehen.";
    if (normalized.includes("leitlinien")) return "Fehlende Leitlinien freigeben oder bestehende Leitlinien fachlich vervollständigen.";
    if (normalized.includes("prozessdokumentation")) return "Wesentliche Datenschutzprozesse dokumentieren und in den operativen Ablauf überführen.";
    if (normalized.includes("verzeichnis")) return "VVT fachlich vervollständigen und relevante Verarbeitungstätigkeiten nachpflegen.";
    if (normalized.includes("tom")) return "Technische und organisatorische Maßnahmen strukturiert ergänzen und reviewen.";
    if (normalized.includes("avv")) return "Fehlende AVV-Verträge bzw. Prüfdokumentationen ergänzen.";
    if (normalized.includes("web-/hinweis")) return "Webdatenschutz- und Datenschutzhinweis-Prüfungen aktualisieren und dokumentieren.";
    if (normalized.includes("beschäftigtendatenschutz")) return "Beschäftigtendatenschutz-Check dokumentieren und organisatorisch verankern.";
    if (normalized.includes("dokumentenreife")) return "Zentrale Nachweisdokumente ergänzen und auf aktuellen Stand bringen.";
    if (normalized.includes("verantwortungsstruktur")) return "Verantwortliche Rolle verbindlich benennen und Kontaktdaten vervollständigen.";
    return "Kriterium fachlich prüfen und gezielte Nachbesserungsmaßnahme festlegen.";
  };
  const deriveMaturityAction = (label: string) => {
    const normalized = String(label || "").toLowerCase();
    if (normalized.includes("audit")) return { href: "/audits", label: "Zu Audits" };
    if (normalized.includes("pdca")) return { href: "/pdca?filter=review", label: "Zu PDCA" };
    if (normalized.includes("dsfa")) return { href: "/dsfa", label: "Zu DSFA" };
    if (normalized.includes("löschkonzept")) return { href: "/loeschkonzept", label: "Zum Löschkonzept" };
    if (normalized.includes("aufgabensteuerung")) return { href: "/aufgaben?filter=kritisch", label: "Zu den Aufgaben" };
    if (normalized.includes("leitlinien") || normalized.includes("prozessdokumentation") || normalized.includes("beschäftigtendatenschutz") || normalized.includes("dokumentenreife") || normalized.includes("web-/hinweis")) return { href: "/dokumente", label: "Zu Dokumenten" };
    if (normalized.includes("verzeichnis")) return { href: "/vvt", label: "Zu VVT" };
    if (normalized.includes("tom")) return { href: "/tom", label: "Zu TOM" };
    if (normalized.includes("avv")) return { href: "/avv", label: "Zu AVV" };
    if (normalized.includes("verantwortungsstruktur")) return { href: "/mandanten-uebersicht", label: "Zur Mandantenübersicht" };
    return { href: "/dashboard", label: "Zum Dashboard" };
  };
  const weakestMaturityCriteria = [...maturityCriteria]
    .map((item) => ({ ...item, percent: item.weight ? Math.round((item.score / item.weight) * 100) : 0, recommendation: deriveMaturityRecommendation(item.label), action: deriveMaturityAction(item.label) }))
    .sort((a, b) => a.percent - b.percent || b.weight - a.weight || String(a.label || "").localeCompare(String(b.label || ""), "de"))
    .slice(0, 3);
  const governanceSeverityOrder: Record<string, number> = { hoch: 0, mittel: 1, niedrig: 2 };
  const deriveGovernanceMeta = (title: string, severity: string) => {
    const normalizedTitle = String(title || "").toLowerCase();
    if (normalizedTitle.includes("kritische offene aufgaben") || normalizedTitle.includes("ohne audit-bezug") || normalizedTitle.includes("art.-36")) return { state: "heute erledigen", priorityClass: "P1", slaHint: "heute", escalation: "sofort", overdue: true };
    if (normalizedTitle.includes("review") || normalizedTitle.includes("restrisiko") || normalizedTitle.includes("audit-to-dos")) return { state: "in Bearbeitung", priorityClass: "P2", slaHint: "48h", escalation: "kurzfristig", overdue: false };
    if (severity === "hoch") return { state: "heute erledigen", priorityClass: "P1", slaHint: "heute", escalation: "sofort", overdue: false };
    if (severity === "mittel") return { state: "in Bearbeitung", priorityClass: "P2", slaHint: "48h", escalation: "kurzfristig", overdue: false };
    return { state: "neu", priorityClass: "P3", slaHint: "diese Woche", escalation: "normal", overdue: false };
  };
  const governanceFindings = [
    auditTodos.length > 0 ? { severity: auditTodos.length >= 5 ? "hoch" : "mittel", title: `${auditTodos.length} offene Audit-To-dos`, recommendation: "Audit-Maßnahmen priorisieren, Verantwortliche bestätigen und Fälligkeiten nachziehen." } : null,
    pdcaReviewFaellig.length > 0 ? { severity: pdcaReviewFaellig.length >= 3 ? "hoch" : "mittel", title: `${pdcaReviewFaellig.length} PDCA-Reviews fällig oder überfällig`, recommendation: "Reviewtermine kurzfristig durchführen und Status der Wirksamkeitsprüfung aktualisieren." } : null,
    pdcaFollowUpTasksOffen.length > 0 ? { severity: pdcaFollowUpTasksOffen.length >= 5 ? "mittel" : "niedrig", title: `${pdcaFollowUpTasksOffen.length} offene PDCA-Folgeaufgaben`, recommendation: "Offene Folgeaufgaben bündeln, priorisieren und gegen bestehende PDCA-Zyklen abgleichen." } : null,
    auditFollowUpsOhneAuditBezug > 0 ? { severity: "hoch", title: `${auditFollowUpsOhneAuditBezug} Audit-Follow-ups ohne Audit-Bezug`, recommendation: "Fehlende Audit-Verknüpfungen ergänzen, damit Nachverfolgung und Export belastbar bleiben." } : null,
    fehlendeLoeschBezuge > 0 ? { severity: fehlendeLoeschBezuge >= 3 ? "mittel" : "niedrig", title: `${fehlendeLoeschBezuge} VVT ohne Löschkonzept-Bezug`, recommendation: "Löschkonzept-Einträge mit den betroffenen Verarbeitungstätigkeiten verknüpfen oder fachlich begründen." } : null,
  ].filter(Boolean).sort((a: any, b: any) => (governanceSeverityOrder[String(a?.severity || "niedrig")] ?? 99) - (governanceSeverityOrder[String(b?.severity || "niedrig")] ?? 99));
  const dashboardTodayFirst = governanceFindings.slice(0, 3).map((item: any) => {
    const meta = deriveGovernanceMeta(item?.title, item?.severity);
    return { ...item, derivedStatus: meta.state, priorityClass: meta.priorityClass, slaHint: meta.slaHint, escalation: meta.escalation, overdue: meta.overdue };
  });
  const managementScore = reifegradScore;
  const managementAmpel = reifegradAmpel;
  const managementSummary = {
    score: managementScore,
    ampel: managementAmpel,
    reifegradScore,
    maturityWeightTotal,
    maturityScoreRaw,
    maturityCriteria,
    weakestMaturityCriteria,
    topRisiken: logs.filter((l: any) => String(l.aktion || "").includes("geloescht") || String(l.aktion || "").includes("kritisch")).length,
    audits: audits.length,
    auditDeviationCount,
    auditTodos: auditTodos.length,
    pdca: pdca.length,
    pdcaOpen: pdcaOffen.length,
    pdcaReviewFaellig: pdcaReviewFaellig.length,
    auditFollowUps: auditFollowUps.length,
    auditFollowUpsOffen: auditFollowUpsOffen.length,
    auditFollowUpsOhneAuditBezug,
    pdcaMitAuditBezug: pdcaMitAuditBezug.length,
    pdcaOhneAuditBezug: pdcaOhneAuditBezug.length,
    pdcaFollowUpTasks: pdcaFollowUpTasks.length,
    pdcaFollowUpTasksOffen: pdcaFollowUpTasksOffen.length,
    explicitAuditLinks,
    fehlendeLoeschBezuge,
    governanceFindings,
  };

  const toggle = (key: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  };
  const allSel = selected.size === EXPORT_MODULES.length;

  const handlePrint = () => {
    let filteredLogs = [...logs];
    if (sections.audit_log) {
      if (logModule !== "all") {
        filteredLogs = filteredLogs.filter((l: any) => l.modul === logModule);
      }
      if (logUser !== "all") {
        filteredLogs = filteredLogs.filter((l: any) => l.userName === logUser);
      }
      if (logAction !== "all") {
        filteredLogs = filteredLogs.filter((l: any) => l.aktion === logAction);
      }
      if (logOption === "limit" && logLimit > 0) {
        filteredLogs = filteredLogs
          .sort((a: any, b: any) => new Date(b.zeitpunkt).getTime() - new Date(a.zeitpunkt).getTime())
          .slice(0, logLimit)
          .reverse();
      }
    }

    const cfg = {
      mandantId: activeMandantId,
      mandantName: mandant?.name ?? "Unbekannter Mandant",
      mandantInfo: mandant,
      gruppeInfo: gruppen.find((g: any) => g.id === mandant?.gruppeId) || null,
      gruppenMitglieder: mandant?.gruppeId ? mandanten.filter((m: any) => m.gruppeId === mandant.gruppeId) : [],
      logs: sections.audit_log ? filteredLogs : [],
      sections,
      audits,
      auditTodos,
      pdca,
      pdcaFollowUpTasks,
      managementSummary,
      interneNotizen: exportierbareInterneNotizen,
      modules: EXPORT_MODULES.filter((m) => selected.has(m.key)).map((m) => m.key),
      generatedAt: new Date().toISOString(),
    };
    sessionStorage.setItem("privashield_export", JSON.stringify(cfg));
    window.open("/print.html", "_blank");
  };

  if (!activeMandantId) return (
    <div className="p-6 flex flex-col items-center justify-center h-64 text-muted-foreground gap-3">
      <Building2 className="h-12 w-12 opacity-30" />
      <p className="text-sm">Bitte zuerst einen Mandanten in der Sidebar wählen.</p>
    </div>
  );

  return (
    <div className="p-6 space-y-6 max-w-3xl">
      <div className="space-y-1">
        <h1 className="text-xl font-semibold text-foreground flex items-center gap-2">
          <Printer className="h-5 w-5 text-primary" />
          {t("exportPrint")}
        </h1>
        <p className="text-sm text-muted-foreground">
          {t("selectModulesPrint")} {t("printHint")}
        </p>
      </div>

      {/* Mandanten-Info */}
      <Card>
        <CardHeader className="pb-3 pt-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              <Building2 className="h-4 w-4 text-primary" />
              {t("exportTenant")}
            </CardTitle>
            <Badge variant="outline">{mandant?.name ?? "—"}</Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-0 text-xs text-muted-foreground space-y-1">
          <p>{mandant?.rechtsform || "—"}{mandant?.branche ? ` · ${mandant.branche}` : ""}</p>
          <p>Gruppe: {gruppen.find((g: any) => g.id === mandant?.gruppeId)?.name || "—"}</p>
          <p>Verantwortlicher: {mandant?.verantwortlicherName || "—"}</p>
          <p>Webseite: {mandant?.webseite || "—"}</p>
          <p>{t("exportLogsCount")}: {logs.length}</p>
        </CardContent>
      </Card>

      {/* Modulauswahl */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">{t("exportModules")}</CardTitle>
            <button
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              onClick={() => allSel ? setSelected(new Set()) : setSelected(new Set(EXPORT_MODULES.map((m) => m.key)))}
            >
              {allSel ? t("deselectAll") : t("selectAll")}
            </button>
          </div>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-2 pt-0">
          {EXPORT_MODULES.map((mod) => {
            const Icon = mod.icon;
            const active = selected.has(mod.key);
            return (
              <button
                key={mod.key}
                onClick={() => toggle(mod.key)}
                className={`flex items-center gap-3 rounded-lg border px-4 py-3 text-left transition-all ${
                  active ? "border-primary bg-primary/10" : "border-border hover:border-primary/40"
                }`}
              >
                <div className={`flex items-center justify-center w-7 h-7 rounded-md shrink-0 ${active ? "bg-primary/20" : "bg-muted"}`}>
                  <Icon className={`h-4 w-4 ${active ? mod.color : "text-muted-foreground"}`} />
                </div>
                <span className={`text-sm flex-1 ${active ? "text-foreground font-medium" : "text-muted-foreground"}`}>
                  {mod.label}
                  {mod.key === "interne_notizen" && <span className="block text-xs text-muted-foreground mt-0.5">Nur Notizen mit gesetztem Freigabe-Haken werden exportiert.</span>}
                </span>
                {active && <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />}
              </button>
            );
          })}
        </CardContent>
      </Card>

      {/* Zusätzliche Komponenten */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">Zusätzliche Berichts- & Governance-Komponenten</CardTitle>
            <button
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              onClick={() => {
                const allActive = Object.values(sections).every(Boolean);
                const next: Record<string, boolean> = {};
                OPTIONAL_SECTIONS.forEach(s => next[s.key] = !allActive);
                setSections(next);
              }}
            >
              {Object.values(sections).every(Boolean) ? "Alle abwählen" : "Alle auswählen"}
            </button>
          </div>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-2 pt-0">
          {OPTIONAL_SECTIONS.map((sec) => {
            const Icon = sec.icon;
            const active = sections[sec.key];
            return (
              <div key={sec.key} className="space-y-2">
                <button
                  type="button"
                  onClick={() => setSections(prev => ({ ...prev, [sec.key]: !prev[sec.key] }))}
                  className={`flex items-center gap-3 rounded-lg border px-4 py-3 w-full text-left transition-all ${
                    active ? "border-primary bg-primary/10" : "border-border hover:border-primary/40"
                  }`}
                >
                  <div className={`flex items-center justify-center w-7 h-7 rounded-md shrink-0 ${active ? "bg-primary/20" : "bg-muted"}`}>
                    <Icon className={`h-4 w-4 ${active ? sec.color : "text-muted-foreground"}`} />
                  </div>
                  <span className={`text-sm flex-1 ${active ? "text-foreground font-medium" : "text-muted-foreground"}`}>
                    {sec.label}
                  </span>
                  {active && <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />}
                </button>

                {sec.key === "audit_log" && active && (
                  <div className="p-4 rounded-lg border border-border bg-muted/30 ml-0 sm:ml-10 space-y-3">
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Log-Filter & Einstellungen</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs">Log-Umfang</Label>
                        <Select value={logOption} onValueChange={(v: any) => setLogOption(v)}>
                          <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Gesamtes Protokoll</SelectItem>
                            <SelectItem value="limit">Letzte Einträge begrenzen</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {logOption === "limit" && (
                        <div className="space-y-1">
                          <Label className="text-xs">Anzahl Einträge</Label>
                          <Input
                            type="number"
                            min={1}
                            value={logLimit}
                            onChange={(e) => setLogLimit(Number(e.target.value))}
                            className="h-8 text-sm"
                          />
                        </div>
                      )}

                      <div className="space-y-1">
                        <Label className="text-xs">Nach Modul / Kategorie filtern</Label>
                        <Select value={logModule} onValueChange={setLogModule}>
                          <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Alle Module</SelectItem>
                            {uniqueModules.map((mod) => (
                              <SelectItem key={mod} value={mod}>{mod}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-1">
                        <Label className="text-xs">Nach Nutzer filtern</Label>
                        <Select value={logUser} onValueChange={setLogUser}>
                          <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Alle Nutzer</SelectItem>
                            {uniqueUsers.map((user) => (
                              <SelectItem key={user} value={user}>{user}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-1 sm:col-span-2">
                        <Label className="text-xs">Nach Aktion filtern</Label>
                        <Select value={logAction} onValueChange={setLogAction}>
                          <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Alle Aktionen</SelectItem>
                            {uniqueActions.map((action) => (
                              <SelectItem key={action} value={action}>{action}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Aktionsleiste */}
      <div className="flex items-center justify-between pt-1">
        <p className="text-xs text-muted-foreground">
          {selected.size} / {EXPORT_MODULES.length} {t("modulesSelected")}
        </p>
        <Button onClick={handlePrint} disabled={selected.size === 0} className="gap-2">
          <Printer className="h-4 w-4" />
          {t("printOpen")}
        </Button>
      </div>
    </div>
  );
}

function MandantenExtrasPage() {
  const { t } = useI18n();
  const { activeMandantId } = useMandant();
  const { toast } = useToast();
  const qc = useQueryClient();
  const { data: logs = [] } = useQuery({
    queryKey: ["/api/mandanten-logs", activeMandantId],
    queryFn: () => apiRequest("GET", `/api/mandanten/${activeMandantId}/logs`).then(r => r.json()),
    enabled: !!activeMandantId,
  });
  const { data: pakete = [] } = useQuery({
    queryKey: ["/api/vorlagenpakete"],
    queryFn: () => apiRequest("GET", "/api/vorlagenpakete").then(r => r.json()),
  });
  const { data: historie = [] } = useQuery({
    queryKey: ["/api/vorlagen-historie", activeMandantId],
    queryFn: () => apiRequest("GET", `/api/mandanten/${activeMandantId}/vorlagen-historie`).then(r => r.json()),
    enabled: !!activeMandantId,
  });
  const { data: mandant } = useQuery({
    queryKey: ["/api/mandant-extras", activeMandantId],
    queryFn: () => apiRequest("GET", `/api/mandanten/${activeMandantId}`).then(r => r.json()),
    enabled: !!activeMandantId,
  });
  const { data: alleMandanten = [] } = useQuery({
    queryKey: ["/api/mandanten"],
    queryFn: () => apiRequest("GET", "/api/mandanten").then(r => r.json()),
  });
  const gruppenHistorie = mandant?.gruppeId
    ? alleMandanten.filter((m: any) => m.gruppeId === mandant.gruppeId)
    : [];
  const [selectedPaket, setSelectedPaket] = useState<string>("");
  const selectedPaketObj = pakete.find((p: any) => String(p.id) === selectedPaket);
  const paketPreview = (() => {
    if (!selectedPaketObj?.inhaltJson) return null;
    try { return JSON.parse(selectedPaketObj.inhaltJson); } catch { return null; }
  })();
  const [modulFilter, setModulFilter] = useState<string>("alle");
  const [showOnlyUserLogs, setShowOnlyUserLogs] = useState(false);
  const visibleLogs = logs.filter((log: any) => modulFilter === "alle" || log.modul === modulFilter);
  const filteredLogs = visibleLogs.filter((log: any) => !showOnlyUserLogs || !!log.userName);
  const exportLogs = () => {
    const blob = new Blob([JSON.stringify(filteredLogs, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `mandant-${activeMandantId}-logs.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const [wizardOpen, setWizardOpen] = useState(false);
  const [preflightData, setPreflightData] = useState<any>(null);
  const [loadingPreflight, setLoadingPreflight] = useState(false);
  const [strategy, setStrategy] = useState<"import_new" | "overwrite_all">("import_new");
  const [applyingPaket, setApplyingPaket] = useState(false);

  const openWizard = async () => {
    if (!activeMandantId || !selectedPaket) return;
    setLoadingPreflight(true);
    setWizardOpen(true);
    setPreflightData(null);
    try {
      const res = await apiRequest("GET", `/api/mandanten/${activeMandantId}/vorlagenpakete/${selectedPaket}/preflight`);
      if (!res.ok) throw new Error("Fehler beim Preflight");
      const data = await res.json();
      setPreflightData(data.changes || []);
    } catch (e: any) {
      toast({ title: "Fehler beim Laden des Preflights", description: e.message, variant: "destructive" });
      setWizardOpen(false);
    } finally {
      setLoadingPreflight(false);
    }
  };

  const applyPaket = async () => {
    if (!activeMandantId || !selectedPaket) return;
    setApplyingPaket(true);
    try {
      const res = await apiRequest("POST", `/api/mandanten/${activeMandantId}/vorlagenpakete/${selectedPaket}/apply`, { strategy });
      if (!res.ok) throw new Error("Fehler beim Anwenden");
      const data = await res.json();
      qc.invalidateQueries({ queryKey: ["/api/mandanten-logs", activeMandantId] });
      qc.invalidateQueries({ queryKey: [`/api/mandanten/${activeMandantId}/aufgaben`] });
      qc.invalidateQueries({ queryKey: [`/api/mandanten/${activeMandantId}/dokumente`] });
      qc.invalidateQueries({ queryKey: [`/api/mandanten/${activeMandantId}/vvt`] });
      qc.invalidateQueries({ queryKey: [`/api/mandanten/${activeMandantId}/avv`] });
      qc.invalidateQueries({ queryKey: [`/api/mandanten/${activeMandantId}/tom`] });
      qc.invalidateQueries({ queryKey: ["/api/vorlagen-historie", activeMandantId] });
      
      toast({ 
        title: "Vorlagenpaket angewendet", 
        description: `Erstellt: ${data.created.aufgaben} Aufgaben, ${data.created.dokumente} Dokumente, ${data.created.vvt} VVTs, ${data.created.avv} AVVs, ${data.created.tom} TOMs. Aktualisiert: ${data.updated?.aufgaben || 0} Aufgaben, ${data.updated?.dokumente || 0} Dokumente, ${data.updated?.vvt || 0} VVTs, ${data.updated?.avv || 0} AVVs, ${data.updated?.tom || 0} TOMs.`
      });
      setWizardOpen(false);
    } catch (e: any) {
      toast({ title: "Fehler beim Anwenden", description: e.message, variant: "destructive" });
    } finally {
      setApplyingPaket(false);
    }
  };

  return (
    <MandantGuard>
      <div className="space-y-6">
        <PageHeader title={t("extrasTitle")} desc={t("extrasDesc")} />

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Vorlagenpaket anwenden</CardTitle>
            <CardDescription>Standardaufgaben, Leitlinien und Dokumente für den aktiven Mandanten erzeugen</CardDescription>
          </CardHeader>
          <CardContent className="flex items-end gap-3">
            <div className="flex-1 space-y-1">
              <Label className="text-xs">Vorlagenpaket</Label>
              <Select value={selectedPaket} onValueChange={setSelectedPaket}>
                <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Paket auswählen" /></SelectTrigger>
                <SelectContent>
                  {pakete.map((p: any) => <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <Button className="bg-primary" onClick={openWizard} disabled={!selectedPaket}>Anwenden</Button>
          </CardContent>
          {selectedPaketObj && (
            <CardContent className="pt-0">
              <div className="rounded-lg border p-3 text-xs bg-muted/30 space-y-4">
                <div>
                  <p className="font-medium mb-2">Vorschau</p>
                  <p className="text-muted-foreground">{selectedPaketObj.beschreibung || "Keine Beschreibung"}</p>
                </div>
                {paketPreview ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="font-medium mb-2">Erzeugte Aufgaben</p>
                      <div className="space-y-2">
                        {(paketPreview.aufgaben || []).length === 0 && <p className="text-muted-foreground">Keine Aufgaben</p>}
                        {(paketPreview.aufgaben || []).map((a: any, i: number) => (
                          <div key={i} className="rounded border p-2 bg-background">
                            <p className="font-medium">{a.titel}</p>
                            <p className="text-muted-foreground">{a.typ || "task"} · {a.prioritaet || "mittel"}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="font-medium mb-2">Erzeugte Dokumente</p>
                      <div className="space-y-2">
                        {(paketPreview.dokumente || []).length === 0 && <p className="text-muted-foreground">Keine Dokumente</p>}
                        {(paketPreview.dokumente || []).map((d: any, i: number) => (
                          <div key={i} className="rounded border p-2 bg-background">
                            <p className="font-medium">{d.titel}</p>
                            <p className="text-muted-foreground">{d.kategorie || "vorlage"} · v{d.version || "1.0"}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <pre className="overflow-auto whitespace-pre-wrap break-all">{selectedPaketObj.inhaltJson}</pre>
                )}
              </div>
            </CardContent>
          )}
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Vorlagenpaket-Historie</CardTitle>
            <CardDescription>Wann welches Paket in welcher Version angewendet wurde</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {historie.length === 0 && <p className="text-sm text-muted-foreground">Noch keine Historie vorhanden.</p>}
            {historie.map((h: any) => (
              <div key={h.id} className="rounded-lg border p-3 text-sm">
                <p className="font-medium">{h.paketName} v{h.paketVersion || "1.0"}</p>
                <p className="text-xs text-muted-foreground">{new Date(h.angewendetAm).toLocaleString("de-DE")} · {h.angewendetVon || "System"}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        {mandant?.gruppeId && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Gruppenweiter Kontext</CardTitle>
              <CardDescription>Mandanten derselben Gruppe</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {gruppenHistorie.map((m: any) => (
                <div key={m.id} className="rounded-lg border p-3 text-sm">
                  <p className="font-medium">{m.name}</p>
                  <p className="text-xs text-muted-foreground">{m.rechtsform || "—"}{m.branche ? ` · ${m.branche}` : ""}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Änderungsprotokoll</CardTitle>
            <CardDescription>Nachvollziehbarkeit von Änderungen je Mandant</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center gap-2 pb-2">
              <button onClick={() => setShowOnlyUserLogs((v) => !v)} className={`px-3 py-1 rounded-full text-xs transition-colors ${showOnlyUserLogs ? "bg-primary text-white" : "bg-secondary text-muted-foreground hover:text-foreground"}`}>Nur Benutzer-Logs</button>
              <Button variant="outline" size="sm" onClick={exportLogs}>Logs exportieren</Button>
            </div>
            <div className="flex gap-2 flex-wrap pb-2">
              {["alle", "mandanten", "aufgaben", "dokumente", "vvt", "avv", "dsfa", "datenpannen", "dsr", "tom", "vorlagenpakete"].map((m) => (
                <button key={m} onClick={() => setModulFilter(m)} className={`px-3 py-1 rounded-full text-xs transition-colors ${modulFilter === m ? "bg-primary text-white" : "bg-secondary text-muted-foreground hover:text-foreground"}`}>
                  {m}
                </button>
              ))}
            </div>
            {filteredLogs.length === 0 && <p className="text-sm text-muted-foreground">Noch keine Änderungen protokolliert.</p>}
            {filteredLogs.map((log: any) => (
              <details key={log.id} className="rounded-lg border p-3">
                <summary className="cursor-pointer list-none">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium">{log.beschreibung || log.aktion}</p>
                    <p className="text-xs text-muted-foreground">{log.modul || "allgemein"}{log.userName ? ` · ${log.userName}` : ""}</p>
                  </div>
                  <p className="text-xs text-muted-foreground whitespace-nowrap">{new Date(log.zeitpunkt).toLocaleString("de-DE")}</p>
                </div>
                </summary>
                {log.detailsJson && (
                  <pre className="mt-3 text-xs bg-muted p-3 rounded overflow-auto whitespace-pre-wrap break-all">{(() => {
                    try { return JSON.stringify(JSON.parse(log.detailsJson), null, 2); } catch { return log.detailsJson; }
                  })()}</pre>
                )}
              </details>
            ))}
          </CardContent>
        </Card>

        <Dialog open={wizardOpen} onOpenChange={setWizardOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <span>🛡️</span> Mandanten-Upgrade-Wizard
              </DialogTitle>
            </DialogHeader>

            {loadingPreflight ? (
              <div className="py-12 flex flex-col items-center justify-center gap-3">
                <RefreshCcw className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Analysiere Vorlagenpaket und vergleiche mit bestehenden Mandantendaten...</p>
              </div>
            ) : preflightData ? (
              <div className="space-y-6 text-sm">
                <div>
                  <h4 className="font-semibold text-foreground mb-1">DSDMS-Upgrade Analyse</h4>
                  <p className="text-xs text-muted-foreground">Wir haben die Vorlagen im Paket mit den existierenden Einträgen des aktiven Mandanten verglichen.</p>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="rounded-lg border bg-emerald-50/50 border-emerald-200 p-3 text-center">
                    <p className="text-xs text-emerald-800 font-medium">Neu</p>
                    <p className="text-xl font-bold text-emerald-700 mt-1">
                      {preflightData.filter((x: any) => x.status === "new").length}
                    </p>
                  </div>
                  <div className="rounded-lg border bg-amber-50/50 border-amber-200 p-3 text-center">
                    <p className="text-xs text-amber-800 font-medium">Geändert</p>
                    <p className="text-xl font-bold text-amber-700 mt-1">
                      {preflightData.filter((x: any) => x.status === "modified").length}
                    </p>
                  </div>
                  <div className="rounded-lg border bg-slate-50/50 border-slate-200 p-3 text-center">
                    <p className="text-xs text-slate-800 font-medium">Identisch</p>
                    <p className="text-xl font-bold text-slate-700 mt-1">
                      {preflightData.filter((x: any) => x.status === "identical").length}
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-semibold">Vorschau aller Änderungen</Label>
                  <ScrollArea className="h-[200px] rounded-md border p-3 bg-muted/20">
                    <div className="space-y-2">
                      {preflightData.length === 0 ? (
                        <p className="text-xs text-muted-foreground text-center py-8">Keine Vorlageneinträge gefunden.</p>
                      ) : (
                        preflightData.map((item: any, index: number) => {
                          let badgeColor = "bg-slate-100 text-slate-800 border-slate-200";
                          let statusLabel = "Identisch";
                          if (item.status === "new") {
                            badgeColor = "bg-emerald-50 text-emerald-700 border-emerald-200";
                            statusLabel = "Neu";
                          } else if (item.status === "modified") {
                            badgeColor = "bg-amber-50 text-amber-700 border-amber-200";
                            statusLabel = "Geändert";
                          }
                          const typeLabels: Record<string, string> = {
                            aufgaben: "Aufgabe",
                            dokumente: "Dokument",
                            vvt: "VVT",
                            avv: "AVV",
                            tom: "TOM"
                          };
                          return (
                            <div key={index} className="flex items-center justify-between p-2 rounded border bg-background text-xs">
                              <div>
                                <p className="font-semibold text-foreground">{item.name}</p>
                                <p className="text-muted-foreground text-[10px] capitalize">{typeLabels[item.type] || item.type}</p>
                              </div>
                              <Badge variant="outline" className={`${badgeColor} text-[10px] px-2 py-0.5 rounded-full font-medium`}>
                                {statusLabel}
                              </Badge>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </ScrollArea>
                </div>

                <div className="space-y-3">
                  <Label className="text-sm font-semibold">Upgrade-Strategie wählen</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <button
                      onClick={() => setStrategy("import_new")}
                      className={`text-left p-3 rounded-lg border-2 transition-all flex flex-col justify-between h-full ${strategy === "import_new" ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-border hover:border-border/80 bg-background"}`}
                    >
                      <div>
                        <p className="font-bold text-sm text-foreground flex items-center gap-1.5">
                          <span>➕</span> Nur neue importieren
                        </p>
                        <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                          Schützt bereits bestehende Vorlagen und Anpassungen vor dem Überschreiben. Ideal, um Ihre Anpassungen beizubehalten.
                        </p>
                      </div>
                      <Badge variant="secondary" className="mt-3 text-[10px] self-start bg-emerald-50 text-emerald-700 border-emerald-100 border">
                        Empfohlen & Sicher
                      </Badge>
                    </button>

                    <button
                      onClick={() => setStrategy("overwrite_all")}
                      className={`text-left p-3 rounded-lg border-2 transition-all flex flex-col justify-between h-full ${strategy === "overwrite_all" ? "border-amber-500 bg-amber-500/5 ring-1 ring-amber-500" : "border-border hover:border-border/80 bg-background"}`}
                    >
                      <div>
                        <p className="font-bold text-sm text-foreground flex items-center gap-1.5">
                          <span>🔄</span> Bestehende überschreiben
                        </p>
                        <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                          Setzt bereits bestehende Elemente auf den neuesten DSDMS-Standard zurück. Eigene lokale Änderungen gehen verloren.
                        </p>
                      </div>
                      <Badge variant="secondary" className="mt-3 text-[10px] self-start bg-amber-50 text-amber-700 border-amber-100 border">
                        Vollständiger Reset
                      </Badge>
                    </button>
                  </div>
                </div>

                <DialogFooter className="gap-2 pt-2 border-t">
                  <Button variant="outline" size="sm" onClick={() => setWizardOpen(false)} disabled={applyingPaket}>Abbrechen</Button>
                  <Button size="sm" onClick={applyPaket} disabled={applyingPaket} className={strategy === "overwrite_all" ? "bg-amber-600 hover:bg-amber-700 text-white" : "bg-primary"}>
                    {applyingPaket ? (
                      <>
                        <RefreshCcw className="h-3.5 w-3.5 animate-spin mr-1.5" />
                        Wird angewendet...
                      </>
                    ) : (
                      "Upgrade starten"
                    )}
                  </Button>
                </DialogFooter>
              </div>
            ) : (
              <div className="py-8 text-center text-xs text-muted-foreground">Preflight konnte nicht ausgeführt werden.</div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </MandantGuard>
  );
}

function MandantenOverviewPage() {
  const { t } = useI18n();
  const { activeMandantId } = useMandant();
  const { data: mandant } = useQuery({
    queryKey: ["/api/mandanten-overview", activeMandantId],
    queryFn: () => apiRequest("GET", `/api/mandanten/${activeMandantId}`).then(r => r.json()),
    enabled: !!activeMandantId,
  });
  const { data: stats } = useQuery({
    queryKey: ["/api/stats-overview", activeMandantId],
    queryFn: () => apiRequest("GET", `/api/mandanten/${activeMandantId}/stats`).then(r => r.json()),
    enabled: !!activeMandantId,
  });
  const { data: gruppen = [] } = useQuery({
    queryKey: ["/api/mandanten-gruppen"],
    queryFn: () => apiRequest("GET", "/api/mandanten-gruppen").then(r => r.json()),
  });
  const ampel = (() => {
    const hasDS = !!mandant && !!mandant.verantwortlicherName;
    const needsGroup = !!mandant?.gruppenOrganisation;
    const hasGroup = !needsGroup || !!mandant?.gruppeId;
    const offene = stats?.offeneAufgaben ?? 0;
    const hasPrivacy = !!mandant?.dsb || !!mandant?.datenschutzmanagerName;
    const hasIT = !!mandant?.itVerantwortlicherName;
    const hasWebsite = !!mandant?.webseite;
    const needsISB = !!mandant?.hatIsb;
    const hasISBContact = !!mandant?.isbName && (!!mandant?.isbEmail || !!mandant?.isbTelefon);
    const hasISB = !needsISB || hasISBContact;
    const score = [hasDS, hasGroup, hasPrivacy, hasIT, hasWebsite, hasISB, offene <= 3].filter(Boolean).length;
    if (score >= 6) return { label: "Grün", cls: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30", text: "Mandant gut strukturiert und aktuell stabil." };
    if (score >= 4) return { label: "Gelb", cls: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30", text: "Mandant teilweise gepflegt, Nacharbeit empfohlen." };
    return { label: "Rot", cls: "bg-red-500/15 text-red-400 border-red-500/30", text: "Mandant mit erhöhtem organisatorischem Handlungsbedarf." };
  })();
  const ampelKriterien = [
    { label: "Verantwortlicher gepflegt", ok: !!mandant?.verantwortlicherName },
    { label: mandant?.gruppenOrganisation ? "Gruppe zugeordnet" : "Gruppenorganisation nicht erforderlich", ok: !mandant?.gruppenOrganisation || !!mandant?.gruppeId },
    { label: "Datenschutzfunktion vorhanden", ok: !!mandant?.dsb || !!mandant?.datenschutzmanagerName },
    { label: "IT-Verantwortlicher vorhanden", ok: !!mandant?.itVerantwortlicherName },
    { label: "Webseite gepflegt", ok: !!mandant?.webseite },
    { label: mandant?.hatIsb ? "ISB vollständig gepflegt" : "ISB nicht erforderlich", ok: !mandant?.hatIsb || (!!mandant?.isbName && (!!mandant?.isbEmail || !!mandant?.isbTelefon)) },
    { label: "Wenig offene Aufgaben", ok: (stats?.offeneAufgaben ?? 0) <= 3 },
  ];

  return (
    <MandantGuard>
      <div className="space-y-6">
        <PageHeader title={t("overview")} desc={t("tenantOverviewDesc")} />
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Konsistenzprüfung</CardTitle>
            <CardDescription>Schneller Qualitätscheck der Stammdaten</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
            {[
              ["Mandantenname", !!mandant?.name],
              ["Rechtsform", !!mandant?.rechtsform],
              ["Anschrift", !!mandant?.anschrift],
              ["Webseite", !!mandant?.webseite],
              ["Verantwortlicher", !!mandant?.verantwortlicherName],
              ["Datenschutzmanager oder DSB", !!mandant?.datenschutzmanagerName || !!mandant?.dsb],
              ["IT-Verantwortlicher", !!mandant?.itVerantwortlicherName],
              [mandant?.hatIsb ? "ISB vollständig" : "ISB nicht erforderlich", !mandant?.hatIsb || (!!mandant?.isbName && (!!mandant?.isbEmail || !!mandant?.isbTelefon))],
            ].map(([label, ok]) => <p key={String(label)} className={ok ? "text-emerald-400" : "text-yellow-400"}>{ok ? "✓" : "•"} {label}</p>)}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>{mandant?.name || "Mandant"}</CardTitle>
            <CardDescription>{mandant?.rechtsform || "—"}{mandant?.branche ? ` · ${mandant.branche}` : ""}</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="font-medium mb-2">Stammdaten</p>
              <div className="space-y-1 text-muted-foreground">
                <p>Anschrift: {mandant?.anschrift || "—"}</p>
                <p>Webseite: {mandant?.webseite || "—"}</p>
                <p>Gruppenorganisation: {mandant?.gruppenOrganisation ? "Ja" : "Nein"}</p>
                <p>Gruppe: {gruppen.find((g: any) => g.id === mandant?.gruppeId)?.name || "—"}</p>
                <p>Notizen: {mandant?.notizen || "—"}</p>
              </div>
            </div>
            <div>
              <p className="font-medium mb-2">Rollen</p>
              <div className="space-y-1 text-muted-foreground">
                <p>Verantwortlicher: {mandant?.verantwortlicherName || "—"}</p>
                <p>Kontakt: {mandant?.verantwortlicherEmail || "—"}{mandant?.verantwortlicherTelefon ? ` · ${mandant.verantwortlicherTelefon}` : ""}</p>
                <p>Datenschutzmanager: {mandant?.datenschutzmanagerName || "—"}</p>
                <p>Kontakt: {mandant?.datenschutzmanagerEmail || "—"}{mandant?.datenschutzmanagerTelefon ? ` · ${mandant.datenschutzmanagerTelefon}` : ""}</p>
                <p>IT-Verantwortlicher: {mandant?.itVerantwortlicherName || "—"}</p>
                <p>Kontakt: {mandant?.itVerantwortlicherEmail || "—"}{mandant?.itVerantwortlicherTelefon ? ` · ${mandant.itVerantwortlicherTelefon}` : ""}</p>
                <p>ISB benannt: {mandant?.hatIsb ? "Ja" : "Nein"}</p>
                <p>ISB: {mandant?.hatIsb ? (mandant?.isbName || "—") : "nicht erforderlich"}</p>
                <p>Kontakt: {mandant?.hatIsb ? ((mandant?.isbEmail || mandant?.isbTelefon) ? `${mandant?.isbEmail || "—"}${mandant?.isbTelefon ? ` · ${mandant.isbTelefon}` : ""}` : "nicht gepflegt") : "nicht erforderlich"}</p>
                <p>Webseitenbetreuer: {mandant?.webseitenbetreuerName || "—"}</p>
                <p>Kontakt: {mandant?.webseitenbetreuerEmail || "—"}{mandant?.webseitenbetreuerTelefon ? ` · ${mandant.webseitenbetreuerTelefon}` : ""}</p>
              </div>
            </div>
            <div className="md:col-span-2">
              <p className="font-medium mb-2">Mandantenstatus</p>
              <span className={`inline-flex items-center px-3 py-1 rounded text-xs font-medium border ${ampel.cls}`}>{ampel.label}</span>
              <p className="text-xs text-muted-foreground mt-2">{ampel.text}</p>
              <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-2">
                {ampelKriterien.map((k) => <p key={k.label} className={`text-xs ${k.ok ? "text-emerald-400" : "text-yellow-400"}`}>{k.ok ? "✓" : "•"} {k.label}</p>)}
              </div>
            </div>
          </CardContent>
        </Card>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            ["VVT", stats?.vvt ?? 0],
            ["Aufgaben", stats?.aufgaben ?? 0],
            ["Offene Aufgaben", stats?.offeneAufgaben ?? 0],
            ["Dokumente", stats?.dokumente ?? 0],
          ].map(([label, value]) => (
            <Card key={String(label)}><CardContent className="p-4"><p className="text-2xl font-bold">{value as any}</p><p className="text-xs text-muted-foreground">{label}</p></CardContent></Card>
          ))}
        </div>
      </div>
    </MandantGuard>
  );
}

function AppRoutes() {
  const { user } = useAuth();
  const [activeMandantId, setActiveMandantId] = useState<number | null>(() => {
    const stored = localStorage.getItem("privashield_active_mandant_id");
    return stored ? Number(stored) : null;
  });

  const { data: mandanten = [], isLoading: mandantenLoading, isError: mandantenError } = useQuery({
    queryKey: ["/api/mandanten"],
    queryFn: () => apiRequest("GET", "/api/mandanten").then(r => r.json()),
    enabled: !!user,
  });

  useEffect(() => {
    if (!user || mandantenLoading) return;

    const allowedMandanten = user?.role === "admin"
      ? mandanten
      : mandanten.filter((m: any) => {
          try {
            const allowedIds = JSON.parse(user?.mandantIds || "[]");
            return allowedIds.includes(m.id);
          } catch {
            return false;
          }
        });

    if (allowedMandanten.length === 0) {
      if (activeMandantId !== null) setActiveMandantId(null);
      return;
    }

    if (allowedMandanten.length === 1) {
      if (activeMandantId !== allowedMandanten[0].id) {
        setActiveMandantId(allowedMandanten[0].id);
      }
      return;
    }

    const hasValidSelection = activeMandantId !== null && allowedMandanten.some((m: any) => m.id === activeMandantId);
    if (!hasValidSelection) {
      setActiveMandantId(allowedMandanten[0].id);
    }
  }, [user, mandanten, mandantenLoading, activeMandantId]);

  useEffect(() => {
    if (activeMandantId) localStorage.setItem("privashield_active_mandant_id", String(activeMandantId));
    else localStorage.removeItem("privashield_active_mandant_id");
  }, [activeMandantId]);

  const [lang, setLang] = useState<Lang>(() => (localStorage.getItem("privashield_lang") as Lang) || "de");
  useEffect(() => { localStorage.setItem("privashield_lang", lang); }, [lang]);
  const t = (key: MessageKey) => messages[lang][key] || messages.de[key];

  return (
    <LangCtx.Provider value={{ lang, setLang, t }}>
    <MandantCtx.Provider value={{ activeMandantId, setActiveMandantId }}>
      {mandantenLoading ? (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <Card className="w-full max-w-sm border-border/60">
            <CardContent className="pt-6 text-center space-y-3">
              <Skeleton className="h-10 w-10 rounded-full mx-auto" />
              <p className="text-sm text-muted-foreground">Mandantenkontext wird vorbereitet...</p>
            </CardContent>
          </Card>
        </div>
      ) : mandantenError ? (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <Card className="w-full max-w-sm border-border/60">
            <CardContent className="pt-6 text-center space-y-3">
              <p className="text-sm text-muted-foreground">Mandantenkontext konnte nicht geladen werden. Bitte Seite neu laden oder erneut anmelden.</p>
            </CardContent>
          </Card>
        </div>
      ) : (
      <Layout>
        <Switch>
          <Route path="/" component={Dashboard} />
          <Route path="/overview" component={MandantenOverviewPage} />
          <Route path="/vvt" component={VvtPage} />
          <Route path="/avv" component={AvvPage} />
          <Route path="/dsfa" component={DsfaPage} />
          <Route path="/datenpannen" component={DatenpannenPage} />
          <Route path="/dsr" component={DsrPage} />
          <Route path="/tom" component={TomPage} />
          <Route path="/audits" component={AuditsPage} />
          <Route path="/pdca" component={PdcaPage} />
          <Route path="/loeschkonzept" component={LoeschkonzeptPage} />
          <Route path="/aufgaben" component={AufgabenPage} />
          <Route path="/dokumente" component={DokumentePage} />
          <Route path="/web-datenschutz" component={WebDatenschutzPage} />
          <Route path="/beschaeftigten-datenschutz" component={BeschaeftigtenDatenschutzPage} />
          <Route path="/ki-compliance" component={KiCompliancePage} />
          <Route path="/extras" component={MandantenExtrasPage} />
          <Route path="/mandanten" component={MandantenPage} />
          <Route path="/gruppen" component={GruppenPage} />
          <Route path="/vorlagenpakete" component={VorlagenpaketePage} />
          <Route path="/benutzer" component={BenutzerPage} />
          <Route path="/system" component={SystemPage} />
          <Route path="/export" component={ExportPage} />
          <Route path="/backups" component={BackupsPage} />
          <Route path="/interne-notizen" component={InterneNotizenPage} />
        </Switch>
      </Layout>
      )}
    </MandantCtx.Provider>
    </LangCtx.Provider>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router hook={useHashLocation}>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </Router>
      <Toaster />
    </QueryClientProvider>
  );
}
