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
import { apiRequest } from "@/lib/queryClient";
import { APP_VERSION } from "@/lib/app-version";
import { messages, type Lang, type MessageKey } from "./i18n";
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
  Printer, Download, ChevronDown, ChevronUp, Copy, Globe, Mail, Bot, ClipboardList, Archive, NotebookPen
} from "lucide-react";


// ─── Auth Context ──────────────────────────────────────────────────────────
type AuthUser = { id: number; email: string; name: string; role: string; mandantIds: string; failedLoginAttempts?: number; temporaryLockUntil?: string | null; adminLocked?: boolean; adminLockedAt?: string | null; lastFailedLoginAt?: string | null };
const AuthCtx = createContext<{ user: AuthUser | null; token: string | null; login: (u: AuthUser, t: string) => void; logout: () => void }>({
  user: null, token: null, login: () => {}, logout: () => {}
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
function LoginPage({ onLogin }: { onLogin: (u: AuthUser, t: string) => void }) {
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
      onLogin(data.user, data.token);
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
  const { data: loeschkonzept = [] } = useQuery({
    queryKey: [`/api/mandanten/${activeMandantId}/loeschkonzept`],
    queryFn: () => activeMandantId ? apiRequest("GET", `/api/mandanten/${activeMandantId}/loeschkonzept`).then(r => r.json()) : [],
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
  const beschaeftigtenDok = dokumente.find((d: any) => d.dokumentTyp === "beschaeftigten_datenschutz_check");
  const leitlinieVorhanden = leitlinien.length > 0;
  const offeneReviews = aufgaben.filter((a: any) => a.typ === "review" && a.status !== "erledigt");
  const kritischeAufgaben = aufgaben.filter((a: any) => a.prioritaet === "kritisch" && a.status !== "erledigt");
  const sichtbareInterneNotizen = interneNotizen.slice(0, 5);
  const gruppenKennzahl = activeMandant?.gruppeId ? mandanten.filter((m: any) => m.gruppeId === activeMandant.gruppeId).length : 0;
  const dokumenteCount = dokumente.length;
  const leitlinienCount = dokumente.filter((d: any) => d.kategorie === "leitlinie" || d.kategorie === "richtlinie").length;
  const prozessDokCount = dokumente.filter((d: any) => d.kategorie === "prozessbeschreibung" || d.kategorie === "verfahrensdokumentation").length;
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
  const vvtOhneLoeschkonzept = vvt.filter((entry: any) => !loeschkonzept.some((lk: any) => (lk.quelleVvtId && lk.quelleVvtId === entry.id) || String(lk.bezeichnung || "").trim().toLowerCase() === String(entry.bezeichnung || "").trim().toLowerCase())).length;
  const kritischeOderNotwendigeAufgaben = aufgaben.filter((t: any) => ["hoch", "kritisch"].includes(String(t.prioritaet || "")) && t.status !== "erledigt").length;
  const tomUmfangreich = (stats?.tom ?? 0) >= 8;
  const auditsVorhanden = (stats?.audits ?? 0) > 0;
  const avvVorhanden = (stats?.avv ?? 0) > 0;
  const governanceChecks = [
    leitlinienCount >= 2,
    prozessDokCount >= 2,
    (stats?.vvt ?? 0) >= 3,
    dsfaMitDsbCheck,
    dsfaOhneVvt === 0,
    dsfaMitArt36 === 0,
    dsfaReviewFaellig === 0,
    dsfaMitHohemRestrisiko === 0,
    vvtOhneLoeschkonzept === 0,
    auditsVorhanden,
    tomUmfangreich,
    avvVorhanden,
    kritischeOderNotwendigeAufgaben === 0,
    !!webDatenschutzCheck,
    !!datenschutzhinweiseCheck,
    !!beschaeftigtenDok,
    dokumenteCount >= 6,
  ];
  const reifegradScore = Math.round((governanceChecks.filter(Boolean).length / governanceChecks.length) * 100);
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
                <CardTitle className="text-sm">KI-Status</CardTitle>
                <CardDescription>Einsatz von KI-Tools und Konformitätsstatus</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                {kiComplianceCheck ? (
                  <>
                    <p>KI-Prüfung erfasst: <span className="font-medium">Ja</span></p>
                    <p className="text-muted-foreground">{kiComplianceCheck.titel} · {kiComplianceCheck.status}</p>
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
              {kritischeAufgaben.length === 0 && leitlinieVorhanden && offeneReviews.length === 0 && webDatenschutzCheck && datenschutzhinweiseCheck && kiComplianceCheck && dsfaOhneVvt === 0 && dsfaMitArt36 === 0 && dsfaReviewFaellig === 0 && dsfaMitHohemRestrisiko === 0 && (
                <p className="text-muted-foreground">Aktuell keine auffälligen Warnhinweise.</p>
              )}
              {kritischeAufgaben.length > 0 && <p className="text-red-400">Kritische offene Aufgaben: {kritischeAufgaben.length}</p>}
              {offeneReviews.length > 0 && <p className="text-yellow-400">Offene Reviews: {offeneReviews.length}</p>}
              {!leitlinieVorhanden && <p className="text-orange-400">Leitliniendokument für Datenschutz und Informationssicherheit fehlt.</p>}
              {!webDatenschutzCheck && <p className="text-orange-400">Prüfung der Webseiten-Datenschutzerklärung und des Impressums fehlt.</p>}
              {!datenschutzhinweiseCheck && <p className="text-orange-400">Prüfung der Datenschutzhinweise für Personengruppen fehlt.</p>}
              {!kiComplianceCheck && <p className="text-orange-400">Prüfung zum Einsatz von KI-Tools und KI-VO-Konformität fehlt.</p>}
              {dsfaOhneVvt > 0 && <p className="text-yellow-400">DSFA ohne VVT-Bezug: {dsfaOhneVvt}</p>}
              {dsfaMitArt36 > 0 && <p className="text-red-400">DSFA mit Art.-36-Prüfbedarf: {dsfaMitArt36}</p>}
              {dsfaReviewFaellig > 0 && <p className="text-yellow-400">Überfällige DSFA-Reviews: {dsfaReviewFaellig}</p>}
              {dsfaMitHohemRestrisiko > 0 && <p className="text-red-400">DSFA mit hohem Restrisiko: {dsfaMitHohemRestrisiko}</p>}
            </CardContent>
          </Card>

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
              <CardDescription>Ganzheitlicher Score aus Leitlinien, VVT, Löschkonzept, DSFA/DSB, Audits, TOM, AVV und Aufgabenlage</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{reifegradScore}%</p>
              <div className="mt-3 h-3 w-full rounded bg-secondary overflow-hidden">
                <div className="h-full bg-primary transition-all" style={{ width: `${reifegradScore}%` }} />
              </div>
              <div className="mt-3 space-y-1 text-xs text-muted-foreground">
                <p>Leitlinien vorhanden: {leitlinienCount >= 2 ? "ja" : `nein (${leitlinienCount}/2)`}</p>
                <p>VVT ohne Löschkonzept-Bezug: {vvtOhneLoeschkonzept}</p>
                <p>Interne Audits dokumentiert: {auditsVorhanden ? "ja" : "nein"}</p>
                <p>TOM-Katalog umfangreich: {tomUmfangreich ? "ja" : `nein (${stats?.tom ?? 0})`}</p>
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
  const { data = [], isLoading } = useQuery({
    queryKey: [`/api/mandanten/${activeMandantId}/${endpoint}`],
    queryFn: () => apiRequest("GET", `/api/mandanten/${activeMandantId}/${endpoint}`).then(r => r.json()),
    enabled: !!activeMandantId,
  });
  const create = useMutation({
    mutationFn: (body: any) => apiRequest("POST", `/api/mandanten/${activeMandantId}/${endpoint}`, body).then(r => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [`/api/mandanten/${activeMandantId}/${endpoint}`] }),
  });
  const update = useMutation({
    mutationFn: ({ id, ...body }: any) => apiRequest("PUT", `/api/${endpoint}/${id}`, body).then(r => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [`/api/mandanten/${activeMandantId}/${endpoint}`] }),
  });
  const remove = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/${endpoint}/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: [`/api/mandanten/${activeMandantId}/${endpoint}`] }),
  });
  return { data, isLoading, create, update, remove };
}

// ─── VVT PAGE ──────────────────────────────────────────────────────────────
const rechtsgrundlagen = ["Art. 6 Abs. 1 lit. a (Einwilligung)", "Art. 6 Abs. 1 lit. b (Vertrag)", "Art. 6 Abs. 1 lit. c (rechtl. Verpflichtung)", "Art. 6 Abs. 1 lit. d (lebenswichtige Interessen)", "Art. 6 Abs. 1 lit. e (öffentliche Aufgabe)", "Art. 6 Abs. 1 lit. f (berechtigtes Interesse)"];
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
};

function VvtForm({ initial, onSave, onCancel }: any) {
  const { t } = useI18n();
  const [selectedTemplate, setSelectedTemplate] = useState("none");
  const [form, setForm] = useState({ bezeichnung: "", zweck: "", rechtsgrundlage: "", verantwortlicher: "", verantwortlicherEmail: "", verantwortlicherTelefon: "", loeschfrist: "", loeschklasse: "", aufbewahrungsgrund: "", status: "aktiv", dsfa: false, drittlandtransfer: false, datenkategorien: "", betroffenePersonen: "", empfaenger: "", tomHinweis: "", ...initial });
  const set = (k: string, v: any) => setForm((p: any) => ({ ...p, [k]: v }));
  const applyTemplate = (value: string) => {
    setSelectedTemplate(value);
    const template = vvtTemplates[value];
    if (!template) return;
    setForm((p: any) => ({ ...p, ...template }));
  };
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="col-span-2 space-y-1">
          <Label className="text-xs">{t("vvtTemplateLabel")}</Label>
          <Select value={selectedTemplate} onValueChange={applyTemplate}>
            <SelectTrigger className="h-8 text-xs"><SelectValue placeholder={t("selectTemplate")} /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">{t("noTemplate")}</SelectItem>
              <SelectItem value="personalverwaltung">Personalverwaltung</SelectItem>
              <SelectItem value="bewerbermanagement">Bewerbermanagement</SelectItem>
              <SelectItem value="kundenverwaltung">Kundenverwaltung / CRM</SelectItem>
              <SelectItem value="newsletter">Newsletter-Versand</SelectItem>
              <SelectItem value="video">Videoüberwachung</SelectItem>
              <SelectItem value="ki">Einsatz von KI-Tools</SelectItem>
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
  const { data, isLoading, create, update, remove } = useModuleData("vvt");
  const { data: dsfa = [] } = useModuleData("dsfa");
  const { data: loeschkonzept = [] } = useModuleData("loeschkonzept");
  const { data: mandanten = [] } = useQuery({ queryKey: ["/api/mandanten"], queryFn: () => apiRequest("GET", "/api/mandanten").then(r => r.json()) });
  const [modal, setModal] = useState<null | "new" | any>(null);
  const [delId, setDelId] = useState<number | null>(null);
  const { toast } = useToast();

  const [quickFilter, setQuickFilterState] = useState<"all" | "missing-dsfa" | "drittland" | "missing-loesch">("all");
  const [vvtSort, setVvtSortState] = useState<"name-asc" | "name-desc" | "status" | "drittland">("name-asc");

  useEffect(() => {
    const route = new URL(location, "https://privashield.local");
    const rawQuickFilter = route.searchParams.get("filter");
    const rawSort = route.searchParams.get("sort");
    setQuickFilterState(rawQuickFilter === "missing-dsfa" || rawQuickFilter === "drittland" || rawQuickFilter === "missing-loesch" ? rawQuickFilter : "all");
    setVvtSortState(rawSort === "name-desc" || rawSort === "status" || rawSort === "drittland" ? rawSort : "name-asc");
  }, [location]);

  const updateVvtRouteState = (nextFilter: "all" | "missing-dsfa" | "drittland" | "missing-loesch", nextSort: "name-asc" | "name-desc" | "status" | "drittland") => {
    const next = new URL(location, "https://privashield.local");
    if (nextFilter === "all") next.searchParams.delete("filter");
    else next.searchParams.set("filter", nextFilter);
    if (nextSort === "name-asc") next.searchParams.delete("sort");
    else next.searchParams.set("sort", nextSort);
    setLocation(`${next.pathname}${next.search}`);
  };

  const setQuickFilter = (value: "all" | "missing-dsfa" | "drittland" | "missing-loesch") => {
    setQuickFilterState(value);
    updateVvtRouteState(value, vvtSort);
  };
  const setVvtSort = (value: "name-asc" | "name-desc" | "status" | "drittland") => {
    setVvtSortState(value);
    updateVvtRouteState(quickFilter, value);
  };

  const save = (form: any) => {
    const p = modal === "new" ? create.mutateAsync(form) : update.mutateAsync({ id: modal.id, ...form });
    p.then(() => { setModal(null); toast({ title: "Gespeichert" }); }).catch(() => toast({ title: "Fehler", variant: "destructive" }));
  };

  const vvtMitFehlenderDsfa = data.filter((item: any) => item.dsfa && !dsfa.some((entry: any) => entry.vvtId === item.id));
  const vvtMitDrittlandtransfer = data.filter((item: any) => !!item.drittlandtransfer);
  const vvtOhneLoeschbezug = data.filter((entry: any) => !loeschkonzept.some((lk: any) => (lk.quelleVvtId && lk.quelleVvtId === entry.id) || String(lk.bezeichnung || "").trim().toLowerCase() === String(entry.bezeichnung || "").trim().toLowerCase()));
  const filteredData = data.filter((item: any) => {
    if (quickFilter === "missing-dsfa") return vvtMitFehlenderDsfa.some((entry: any) => entry.id === item.id);
    if (quickFilter === "drittland") return vvtMitDrittlandtransfer.some((entry: any) => entry.id === item.id);
    if (quickFilter === "missing-loesch") return vvtOhneLoeschbezug.some((entry: any) => entry.id === item.id);
    return true;
  }).slice().sort((a: any, b: any) => {
    if (vvtSort === "name-desc") return String(b.bezeichnung || "").localeCompare(String(a.bezeichnung || ""), "de");
    if (vvtSort === "status") return String(a.status || "").localeCompare(String(b.status || ""), "de") || String(a.bezeichnung || "").localeCompare(String(b.bezeichnung || ""), "de");
    if (vvtSort === "drittland") return Number(!!b.drittlandtransfer) - Number(!!a.drittlandtransfer) || String(a.bezeichnung || "").localeCompare(String(b.bezeichnung || ""), "de");
    return String(a.bezeichnung || "").localeCompare(String(b.bezeichnung || ""), "de");
  });
  const activeMandantName = mandanten.find((m: any) => m.id === activeMandantId)?.name || `Mandant #${activeMandantId ?? "?"}`;

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
              {vvtMitFehlenderDsfa.length === 0 && vvtMitDrittlandtransfer.length === 0 && vvtOhneLoeschbezug.length === 0 ? (
                <p className="text-muted-foreground">Aktuell keine auffälligen VVT-Lücken.</p>
              ) : (
                <>
                  {vvtMitFehlenderDsfa.length > 0 && <p className="text-red-400">DSFA erforderlich, aber nicht verknüpft: {vvtMitFehlenderDsfa.length}</p>}
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
              {vvtMitFehlenderDsfa.length === 0 && vvtMitDrittlandtransfer.length === 0 && vvtOhneLoeschbezug.length === 0 ? (
                <p className="text-muted-foreground">Aktuell keine priorisierten VVT-Fälle.</p>
              ) : (
                <>
                  {vvtMitFehlenderDsfa.slice(0, 3).map((item: any) => (
                    <div key={`missing-dsfa-${item.id}`} className="rounded-lg border border-red-500/20 bg-red-500/5 p-3">
                      <p className="font-medium text-red-700 dark:text-red-400">DSFA fehlt: {item.bezeichnung}</p>
                      <p className="text-xs text-muted-foreground">Empfehlung: DSFA anlegen oder vorhandene DSFA mit diesem VVT verknüpfen.</p>
                      <div className="mt-2 flex gap-2"><Button type="button" size="sm" variant="outline" onClick={() => setQuickFilter("missing-dsfa")}>Nur diese Fälle</Button><Link href="/dsfa?filter=missing-vvt"><a className="text-xs text-primary hover:underline self-center">Zur DSFA-Seite</a></Link></div>
                    </div>
                  ))}
                  {vvtMitDrittlandtransfer.slice(0, 3).map((item: any) => (
                    <div key={`transfer-${item.id}`} className="rounded-lg border border-yellow-500/20 bg-yellow-500/5 p-3">
                      <p className="font-medium text-yellow-700 dark:text-yellow-400">Drittlandtransfer: {item.bezeichnung}</p>
                      <p className="text-xs text-muted-foreground">Empfehlung: Transfergrundlage, Anbieterprüfung und TOM-/AVV-Lage gezielt prüfen.</p>
                      <div className="mt-2 flex gap-2"><Button type="button" size="sm" variant="outline" onClick={() => setQuickFilter("drittland")}>Nur diese Fälle</Button></div>
                    </div>
                  ))}
                  {vvtOhneLoeschbezug.slice(0, 3).map((item: any) => (
                    <div key={`retention-${item.id}`} className="rounded-lg border border-yellow-500/20 bg-yellow-500/5 p-3">
                      <p className="font-medium text-yellow-700 dark:text-yellow-400">Ohne Löschkonzept-Bezug: {item.bezeichnung}</p>
                      <p className="text-xs text-muted-foreground">Empfehlung: Eintrag mit passender Löschklasse bzw. Löschregel verknüpfen.</p>
                      <div className="mt-2 flex gap-2"><Button type="button" size="sm" variant="outline" onClick={() => setQuickFilter("missing-loesch")}>Nur diese Fälle</Button></div>
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
              <Button type="button" size="sm" variant={quickFilter === "drittland" ? "default" : "outline"} onClick={() => setQuickFilter("drittland")}>Drittlandtransfer</Button>
              <Button type="button" size="sm" variant={quickFilter === "missing-loesch" ? "default" : "outline"} onClick={() => setQuickFilter("missing-loesch")}>Ohne Löschkonzept</Button>
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
              return (
                <Card key={item.id} className="group hover:border-border/80 transition-colors">
                  <CardContent className="py-3 px-4 flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center sm:gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <FileText className="h-4 w-4 text-teal-400 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{item.bezeichnung}</p>
                        <p className="text-xs text-muted-foreground truncate">{item.rechtsgrundlage || "Keine Rechtsgrundlage"}{item.dsfa ? " · DSFA erforderlich" : ""}</p>
                        <p className="text-xs text-muted-foreground truncate">{linkedDsfa.length > 0 ? `Verknüpfte DSFA: ${linkedDsfa.map((entry: any) => entry.titel).join(", ")}` : item.dsfa ? "Noch keine verknüpfte DSFA" : "Keine DSFA-Verknüpfung erforderlich"}</p>
                      </div>
                    </div>
                    <div className="flex w-full items-center justify-between gap-2 shrink-0 sm:w-auto sm:justify-end">
                      <div className="flex items-center gap-2 flex-wrap justify-end">
                        {item.drittlandtransfer && <Badge variant="outline" className="text-xs">Drittland</Badge>}
                        {item.dsfa && linkedDsfa.length > 0 && <Badge variant="outline" className="text-xs border-emerald-500/40 text-emerald-600">DSFA verknüpft</Badge>}
                        {hasRequiredButMissingDsfa && <Badge variant="outline" className="text-xs border-red-500/40 text-red-600">DSFA fehlt</Badge>}
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
  const { data, isLoading, create, update, remove } = useModuleData("avv");
  const [modal, setModal] = useState<null | "new" | any>(null);
  const [delId, setDelId] = useState<number | null>(null);
  const { toast } = useToast();
  const save = (form: any) => {
    const p = modal === "new" ? create.mutateAsync(form) : update.mutateAsync({ id: modal.id, ...form });
    p.then(() => { setModal(null); toast({ title: "Gespeichert" }); }).catch(() => toast({ title: "Fehler", variant: "destructive" }));
  };
  return (
    <MandantGuard>
      <PageHeader title={t("avvTitle")} desc={t("avvDesc")}
        action={<Button size="sm" className="bg-primary h-8 text-xs gap-1.5" onClick={() => setModal("new")}><Plus className="h-3.5 w-3.5" />Neu</Button>} />
      {isLoading ? <Skeleton className="h-32 w-full" /> : (
        <div className="space-y-2">
          {data.length === 0 && <Card className="border-dashed"><CardContent className="py-12 text-center text-sm text-muted-foreground">Noch keine AVV-Verträge vorhanden.</CardContent></Card>}
          {data.map((item: any) => (
            <Card key={item.id} className="group hover:border-border/80 transition-colors">
              <CardContent className="py-3 px-4 flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center sm:gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <Shield className="h-4 w-4 text-blue-400 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{item.auftragsverarbeiter}</p>
                    <p className="text-xs text-muted-foreground">{item.gegenstand || "—"}{item.vertragsdatum ? ` · ${item.vertragsdatum}` : ""}{item.sccs ? " · SCCs vorhanden" : ""}</p>
                  </div>
                </div>
                <div className="flex w-full items-center justify-between gap-2 shrink-0 sm:w-auto sm:justify-end">
                  <StatusBadge value={item.status} />
                  <button onClick={() => setModal(item)} className="p-1 rounded text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-all"><Pencil className="h-3.5 w-3.5" /></button>
                  <button onClick={() => setDelId(item.id)} className="p-1 rounded text-muted-foreground hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"><Trash2 className="h-3.5 w-3.5" /></button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
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
    setForm((p: any) => ({
      ...p,
      vvtId,
      titel: p.titel || selectedVvt.bezeichnung || "",
      zweck: p.zweck || selectedVvt.zweck || "",
      rechtsgrundlage: p.rechtsgrundlage || selectedVvt.rechtsgrundlage || "",
      empfaenger: p.empfaenger || selectedVvt.empfaenger || "",
      drittlandtransfer: p.drittlandtransfer || !!selectedVvt.drittlandtransfer,
      technologienSysteme: p.technologienSysteme || selectedVvt.tomHinweis || "",
      verantwortlicherBereich: p.verantwortlicherBereich || selectedVvt.verantwortlicher || "",
      speicherbegrenzungBewertung: p.speicherbegrenzungBewertung || selectedVvt.loeschfrist || "",
      risiken: p.risiken.map((risk: any, index: number) => index === 0 ? {
        ...risk,
        betroffeneGruppen: risk.betroffeneGruppen || selectedVvt.betroffenePersonen || "",
        datenarten: risk.datenarten || selectedVvt.datenkategorien || "",
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
    p.then(() => { setModal(null); toast({ title: "Gespeichert" }); }).catch(() => toast({ title: "Fehler", variant: "destructive" }));
  };
  const getRisks = (item: any) => {
    try {
      const parsed = typeof item.risiken === "string" ? JSON.parse(item.risiken || "[]") : item.risiken;
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  };
  const [dsfaFilter, setDsfaFilterState] = useState<"all" | "missing-vvt" | "art36" | "review" | "high-risk">("all");
  const [dsfaSort, setDsfaSortState] = useState<"title-asc" | "title-desc" | "review" | "risk">("title-asc");

  useEffect(() => {
    const route = new URL(location, "https://privashield.local");
    const rawDsfaFilter = route.searchParams.get("filter");
    const rawDsfaSort = route.searchParams.get("sort");
    setDsfaFilterState(rawDsfaFilter === "missing-vvt" || rawDsfaFilter === "art36" || rawDsfaFilter === "review" || rawDsfaFilter === "high-risk" ? rawDsfaFilter : "all");
    setDsfaSortState(rawDsfaSort === "title-desc" || rawDsfaSort === "review" || rawDsfaSort === "risk" ? rawDsfaSort : "title-asc");
  }, [location]);

  const updateDsfaRouteState = (nextFilter: "all" | "missing-vvt" | "art36" | "review" | "high-risk", nextSort: "title-asc" | "title-desc" | "review" | "risk") => {
    const next = new URL(location, "https://privashield.local");
    if (nextFilter === "all") next.searchParams.delete("filter");
    else next.searchParams.set("filter", nextFilter);
    if (nextSort === "title-asc") next.searchParams.delete("sort");
    else next.searchParams.set("sort", nextSort);
    setLocation(`${next.pathname}${next.search}`);
  };

  const setDsfaFilter = (value: "all" | "missing-vvt" | "art36" | "review" | "high-risk") => {
    setDsfaFilterState(value);
    updateDsfaRouteState(value, dsfaSort);
  };
  const setDsfaSort = (value: "title-asc" | "title-desc" | "review" | "risk") => {
    setDsfaSortState(value);
    updateDsfaRouteState(dsfaFilter, value);
  };
  const filteredDsfa = data.filter((item: any) => {
    const risks = getRisks(item);
    if (dsfaFilter === "missing-vvt") return !item.vvtId;
    if (dsfaFilter === "art36") return !!item.art36Erforderlich;
    if (dsfaFilter === "review") return !!(item.naechstePruefungAm && new Date(item.naechstePruefungAm).getTime() < Date.now());
    if (dsfaFilter === "high-risk") return risks.some((risk: any) => String(risk?.restrisiko || "").toLowerCase() === "hoch");
    return true;
  }).slice().sort((a: any, b: any) => {
    const aRisks = getRisks(a);
    const bRisks = getRisks(b);
    const aHigh = aRisks.some((risk: any) => String(risk?.restrisiko || "").toLowerCase() === "hoch");
    const bHigh = bRisks.some((risk: any) => String(risk?.restrisiko || "").toLowerCase() === "hoch");
    const aReview = a.naechstePruefungAm ? new Date(a.naechstePruefungAm).getTime() : Number.MAX_SAFE_INTEGER;
    const bReview = b.naechstePruefungAm ? new Date(b.naechstePruefungAm).getTime() : Number.MAX_SAFE_INTEGER;
    if (dsfaSort === "title-desc") return String(b.titel || "").localeCompare(String(a.titel || ""), "de");
    if (dsfaSort === "review") return aReview - bReview || String(a.titel || "").localeCompare(String(b.titel || ""), "de");
    if (dsfaSort === "risk") return Number(bHigh) - Number(aHigh) || String(a.titel || "").localeCompare(String(b.titel || ""), "de");
    return String(a.titel || "").localeCompare(String(b.titel || ""), "de");
  });
  const activeMandantName = mandanten.find((m: any) => m.id === activeMandantId)?.name || `Mandant #${activeMandantId ?? "?"}`;
  return (
    <MandantGuard>
      <PageHeader title={t("dsfaTitle")} desc={t("dsfaDesc")}
        action={<Button size="sm" className="bg-primary h-8 text-xs gap-1.5" onClick={() => setModal("new")}><Plus className="h-3.5 w-3.5" />Neu</Button>} />
      {isLoading ? <Skeleton className="h-32 w-full" /> : (
        <div className="space-y-2">
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
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-muted-foreground">Sortierung:</span>
            <Button type="button" size="sm" variant={dsfaSort === "title-asc" ? "default" : "outline"} onClick={() => setDsfaSort("title-asc")}>Titel A–Z</Button>
            <Button type="button" size="sm" variant={dsfaSort === "title-desc" ? "default" : "outline"} onClick={() => setDsfaSort("title-desc")}>Titel Z–A</Button>
            <Button type="button" size="sm" variant={dsfaSort === "review" ? "default" : "outline"} onClick={() => setDsfaSort("review")}>Review zuerst</Button>
            <Button type="button" size="sm" variant={dsfaSort === "risk" ? "default" : "outline"} onClick={() => setDsfaSort("risk")}>Hohes Risiko zuerst</Button>
          </div>
          {filteredDsfa.length === 0 && <Card className="border-dashed"><CardContent className="py-12 text-center text-sm text-muted-foreground">Keine DSFAs für den aktuellen Filter bei <span className="font-medium text-foreground">{activeMandantName}</span>.</CardContent></Card>}
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
  const { data, isLoading, create, update, remove } = useModuleData("datenpannen");
  const [modal, setModal] = useState<null | "new" | any>(null);
  const [delId, setDelId] = useState<number | null>(null);
  const { toast } = useToast();
  const save = (form: any) => {
    const p = modal === "new" ? create.mutateAsync(form) : update.mutateAsync({ id: modal.id, ...form });
    p.then(() => { setModal(null); toast({ title: "Gespeichert" }); }).catch(() => toast({ title: "Fehler", variant: "destructive" }));
  };
  return (
    <MandantGuard>
      <PageHeader title={t("incidentsTitle")} desc={t("incidentsDesc")}
        action={<Button size="sm" className="bg-primary h-8 text-xs gap-1.5" onClick={() => setModal("new")}><Plus className="h-3.5 w-3.5" />Neue Panne</Button>} />
      {isLoading ? <Skeleton className="h-32 w-full" /> : (
        <div className="space-y-2">
          {data.length === 0 && <Card className="border-dashed"><CardContent className="py-12 text-center text-sm text-muted-foreground">Keine Datenpannen erfasst.</CardContent></Card>}
          {data.map((item: any) => (
            <Card key={item.id} className={`group hover:border-border/80 transition-colors ${item.schwere === "kritisch" ? "border-red-500/30" : ""}`}>
              <CardContent className="py-3 px-4 flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center sm:gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <AlertCircle className={`h-4 w-4 shrink-0 ${item.schwere === "kritisch" ? "text-red-400" : item.schwere === "hoch" ? "text-orange-400" : "text-yellow-400"}`} />
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{item.titel}</p>
                    <p className="text-xs text-muted-foreground">{item.entdecktAm} · {item.betroffenePersonen} Betr. · {item.meldepflichtig ? "Meldepflichtig" : "Nicht meldepflichtig"}</p>
                  </div>
                </div>
                <div className="flex w-full items-center justify-between gap-2 shrink-0 sm:w-auto sm:justify-end">
                  <StatusBadge value={item.schwere} />
                  <StatusBadge value={item.status} />
                  <button onClick={() => setModal(item)} className="p-1 rounded text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-all"><Pencil className="h-3.5 w-3.5" /></button>
                  <button onClick={() => setDelId(item.id)} className="p-1 rounded text-muted-foreground hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"><Trash2 className="h-3.5 w-3.5" /></button>
                </div>
              </CardContent>
            </Card>
          ))}
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
  const { data, isLoading, create, update, remove } = useModuleData("dsr");
  const [modal, setModal] = useState<null | "new" | any>(null);
  const [delId, setDelId] = useState<number | null>(null);
  const { toast } = useToast();
  const save = (form: any) => {
    const p = modal === "new" ? create.mutateAsync(form) : update.mutateAsync({ id: modal.id, ...form });
    p.then(() => { setModal(null); toast({ title: "Gespeichert" }); }).catch(() => toast({ title: "Fehler", variant: "destructive" }));
  };
  const today = new Date().toISOString().split("T")[0];
  return (
    <MandantGuard>
      <PageHeader title={t("dsrTitle")} desc={t("dsrDesc")}
        action={<Button size="sm" className="bg-primary h-8 text-xs gap-1.5" onClick={() => setModal("new")}><Plus className="h-3.5 w-3.5" />Neue Anfrage</Button>} />
      {isLoading ? <Skeleton className="h-32 w-full" /> : (
        <div className="space-y-2">
          {data.length === 0 && <Card className="border-dashed"><CardContent className="py-12 text-center text-sm text-muted-foreground">Keine DSR-Anfragen vorhanden.</CardContent></Card>}
          {data.map((item: any) => {
            const ueberfaellig = item.fristDatum && item.fristDatum < today && item.status !== "abgeschlossen" && item.status !== "abgelehnt";
            return (
              <Card key={item.id} className={`group hover:border-border/80 transition-colors ${ueberfaellig ? "border-red-500/30" : ""}`}>
                <CardContent className="py-3 px-4 flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center sm:gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <UserCheck className="h-4 w-4 text-purple-400 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{dsrArten[item.art] || item.art}</p>
                      <p className="text-xs text-muted-foreground">{item.antragsteller || "Anonym"} · Eingang: {item.eingangsdatum}{item.fristDatum ? ` · Frist: ${item.fristDatum}` : ""}</p>
                    </div>
                  </div>
                  <div className="flex w-full items-center justify-between gap-2 shrink-0 sm:w-auto sm:justify-end">
                    {ueberfaellig && <StatusBadge value="kritisch" className="animate-pulse" />}
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
            <SelectContent>
              <SelectItem value="none">Keine Vorlage</SelectItem>
              <SelectItem value="mfa">Mehr-Faktor-Authentisierung</SelectItem>
              <SelectItem value="backup">Backup- und Wiederherstellungskonzept</SelectItem>
              <SelectItem value="rollen">Rollen- und Berechtigungskonzept</SelectItem>
              <SelectItem value="loeschung">Lösch- und Aufbewahrungskonzept</SelectItem>
              <SelectItem value="logging">Protokollierung sicherheitsrelevanter Zugriffe</SelectItem>
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
  const { data, isLoading, create, update, remove } = useModuleData("tom");
  const [modal, setModal] = useState<null | "new" | any>(null);
  const [delId, setDelId] = useState<number | null>(null);
  const { toast } = useToast();
  const save = (form: any) => {
    const p = modal === "new" ? create.mutateAsync(form) : update.mutateAsync({ id: modal.id, ...form });
    p.then(() => { setModal(null); toast({ title: "Gespeichert" }); }).catch(() => toast({ title: "Fehler", variant: "destructive" }));
  };
  const grouped = data.reduce((acc: any, item: any) => {
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
          {data.length === 0 && <Card className="border-dashed"><CardContent className="py-12 text-center text-sm text-muted-foreground">Noch keine TOM-Maßnahmen dokumentiert.</CardContent></Card>}
          {Object.entries(grouped).map(([kat, items]: any) => (
            <div key={kat}>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">{tomKategorien[kat] || kat}</p>
              <div className="space-y-1.5">
                {items.map((item: any) => (
                  <Card key={item.id} className="group hover:border-border/80 transition-colors">
                    <CardContent className="py-3 px-4 flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center sm:gap-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <Lock className="h-4 w-4 text-emerald-400 shrink-0" />
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{item.massnahme}</p>
                          <p className="text-xs text-muted-foreground truncate">{item.verantwortlicher || "Kein Verantwortlicher"}{item.pruefintervall ? ` · ${item.pruefintervall}` : ""}{item.wirksamkeit ? ` · Wirksamkeit: ${item.wirksamkeit}` : ""}</p>
                        </div>
                      </div>
                      <div className="flex w-full items-center justify-between gap-2 shrink-0 sm:w-auto sm:justify-end">
                        <StatusBadge value={item.status} />
                        <button onClick={() => setModal(item)} className="p-1 rounded text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-all"><Pencil className="h-3.5 w-3.5" /></button>
                        <button onClick={() => setDelId(item.id)} className="p-1 rounded text-muted-foreground hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"><Trash2 className="h-3.5 w-3.5" /></button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
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
  const [form, setForm] = useState({ titel: "", auditart: "intern", pruefbereich: "", auditdatum: new Date().toISOString().split("T")[0], auditor: "", status: "geplant", ergebnis: "offen", scope: "", methode: "", feststellungen: "", positiveAspekte: "", abweichungen: "", empfehlungen: "", followUpDatum: "", naechstesAuditAm: "", ...initial });
  const set = (k: string, v: any) => setForm((p: any) => ({ ...p, [k]: v }));
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
        <div className="space-y-1"><Label className="text-xs">Follow-up am</Label><Input type="date" value={form.followUpDatum || ""} onChange={e => set("followUpDatum", e.target.value)} className="h-8 text-sm" /></div>
        <div className="space-y-1"><Label className="text-xs">Nächstes Audit am</Label><Input type="date" value={form.naechstesAuditAm || ""} onChange={e => set("naechstesAuditAm", e.target.value)} className="h-8 text-sm" /></div>
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
  const { data, isLoading, create, update, remove } = useModuleData("loeschkonzept");
  const { fristen: gesetzlicheAufbewahrungsfristen } = useComplianceMeta();
  const [modal, setModal] = useState<null | "new" | any>(null);
  const [delId, setDelId] = useState<number | null>(null);
  const [filterFrist, setFilterFrist] = useState("alle");
  const [filterKlasse, setFilterKlasse] = useState("alle");
  const [filterStatus, setFilterStatus] = useState("alle");
  const { toast } = useToast();
  const save = (form: any) => {
    const p = modal === "new" ? create.mutateAsync(form) : update.mutateAsync({ id: modal.id, ...form });
    p.then(() => { setModal(null); toast({ title: "Gespeichert" }); }).catch(() => toast({ title: "Fehler", variant: "destructive" }));
  };
  const filtered = data.filter((item: any) => (
    (filterFrist === "alle" || item.fristKategorie === filterFrist) &&
    (filterKlasse === "alle" || item.loeschklasse === filterKlasse) &&
    (filterStatus === "alle" || item.status === filterStatus)
  ));
  return (
    <MandantGuard>
      <PageHeader title={t("retentionTitle")} desc={t("retentionDesc")}
        action={<Button size="sm" className="bg-primary h-8 text-xs gap-1.5" onClick={() => setModal("new")}><Plus className="h-3.5 w-3.5" />Neuer Eintrag</Button>} />
      {isLoading ? <Skeleton className="h-32 w-full" /> : (
        <div className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {loeschklassen.map((k) => <Card key={k.key}><CardContent className="p-4"><p className="text-xs text-muted-foreground">{k.key}</p><p className="text-sm font-semibold">{k.label}</p><p className="text-2xl font-bold mt-2">{data.filter((x:any) => x.loeschklasse === k.key).length}</p></CardContent></Card>)}
            {gesetzlicheAufbewahrungsfristen.filter((f: any) => f.key !== "frei").slice(0,3).map((f: any) => <Card key={f.key}><CardContent className="p-4"><p className="text-xs text-muted-foreground">Fristgruppe</p><p className="text-sm font-semibold">{f.frist}</p><p className="text-xs text-muted-foreground mt-1">{f.label}</p><p className="text-2xl font-bold mt-2">{data.filter((x:any) => x.fristKategorie === f.key).length}</p></CardContent></Card>)}
          </div>
          <Card><CardContent className="p-4 grid grid-cols-1 md:grid-cols-3 gap-3 items-end"><div className="space-y-1"><Label className="text-xs">Fristgruppe</Label><Select value={filterFrist} onValueChange={setFilterFrist}><SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="alle">Alle</SelectItem>{gesetzlicheAufbewahrungsfristen.map((f: any) => <SelectItem key={f.key} value={f.key}>{f.label}</SelectItem>)}</SelectContent></Select></div><div className="space-y-1"><Label className="text-xs">Löschklasse</Label><Select value={filterKlasse} onValueChange={setFilterKlasse}><SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="alle">Alle</SelectItem>{loeschklassen.map((k) => <SelectItem key={k.key} value={k.key}>{k.label}</SelectItem>)}</SelectContent></Select></div><div className="space-y-1"><Label className="text-xs">Status</Label><Select value={filterStatus} onValueChange={setFilterStatus}><SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="alle">Alle</SelectItem><SelectItem value="aktiv">Aktiv</SelectItem><SelectItem value="entwurf">Entwurf</SelectItem><SelectItem value="archiviert">Archiviert</SelectItem></SelectContent></Select></div></CardContent></Card>
          <Card><CardContent className="p-4 grid grid-cols-1 md:grid-cols-3 gap-3 text-sm"><div><p className="text-xs text-muted-foreground">Gefilterte Einträge</p><p className="text-2xl font-bold">{filtered.length}</p></div><div><p className="text-xs text-muted-foreground">Davon aktiv</p><p className="text-2xl font-bold">{filtered.filter((x:any) => x.status === "aktiv").length}</p></div><div><p className="text-xs text-muted-foreground">Mit gesetzlicher Frist</p><p className="text-2xl font-bold">{filtered.filter((x:any) => x.fristKategorie && x.fristKategorie !== "frei").length}</p></div></CardContent></Card>
          {filtered.length === 0 && <Card className="border-dashed"><CardContent className="py-12 text-center text-sm text-muted-foreground">Keine Einträge für die aktuelle Filterung.</CardContent></Card>}
          {filtered.map((item:any) => <Card key={item.id} className="group hover:border-border/80 transition-colors"><CardContent className="p-4 space-y-2"><div className="flex flex-col items-start justify-between gap-3 sm:flex-row"><div><p className="text-sm font-semibold">{item.bezeichnung}</p><p className="text-xs text-muted-foreground">{item.loeschklasse} · {item.aufbewahrungsfrist || "keine Frist"}{item.gesetzlicheFrist ? ` · ${item.gesetzlicheFrist}` : ""}{item.quelleVvtBezeichnung ? ` · aus VVT: ${item.quelleVvtBezeichnung}` : ""}</p></div><div className="flex w-full items-center justify-between gap-2 sm:w-auto sm:justify-end"><StatusBadge value={item.status} /><button onClick={() => setModal(item)} className="p-1 rounded text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-all"><Pencil className="h-3.5 w-3.5" /></button><button onClick={() => setDelId(item.id)} className="p-1 rounded text-muted-foreground hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"><Trash2 className="h-3.5 w-3.5" /></button></div></div><div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs"><div className="rounded-lg border p-3"><p className="font-medium mb-1">Löschereignis</p><p className="text-muted-foreground whitespace-pre-wrap">{item.loeschereignis || "—"}</p><p className="font-medium mt-3 mb-1">Löschverantwortlicher</p><p className="text-muted-foreground whitespace-pre-wrap">{item.loeschverantwortlicher || item.verantwortlicher || "—"}</p></div><div className="rounded-lg border p-3"><p className="font-medium mb-1">Nachweis / Kontrolle</p><p className="text-muted-foreground whitespace-pre-wrap">{item.nachweis || item.kontrolle || "—"}</p></div></div></CardContent></Card>)}
        </div>
      )}
      <Dialog open={!!modal} onOpenChange={o => !o && setModal(null)}><DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto"><div className="sticky top-0 z-10 -mx-6 border-b bg-background px-6 pb-3 pt-1"><DialogHeader><DialogTitle>{modal === "new" ? "Neuer Löschkonzept-Eintrag" : "Löschkonzept bearbeiten"}</DialogTitle></DialogHeader></div>{modal && <LoeschkonzeptForm initial={modal === "new" ? {} : modal} onSave={save} onCancel={() => setModal(null)} />}</DialogContent></Dialog>
      <ConfirmDialog open={delId !== null} title="Eintrag löschen?" desc="Dieser Vorgang kann nicht rückgängig gemacht werden." onConfirm={() => { remove.mutate(delId!); setDelId(null); }} onCancel={() => setDelId(null)} />
    </MandantGuard>
  );
}

function AuditsPage() {
  const { t } = useI18n();
  const { data, isLoading, create, update, remove } = useModuleData("audits");
  const { data: aufgaben = [] } = useModuleData("aufgaben");
  const [modal, setModal] = useState<null | "new" | any>(null);
  const [delId, setDelId] = useState<number | null>(null);
  const { toast } = useToast();
  const save = (form: any) => {
    const p = modal === "new" ? create.mutateAsync(form) : update.mutateAsync({ id: modal.id, ...form });
    p.then(() => { setModal(null); toast({ title: "Gespeichert" }); }).catch(() => toast({ title: "Fehler", variant: "destructive" }));
  };
  const offeneAuditAufgaben = aufgaben.filter((a: any) => (a.kategorie === "audit" || String(a.titel || "").toLowerCase().includes("audit")) && a.status !== "erledigt");
  const gesamtAbweichungen = data.reduce((sum: number, item: any) => sum + (String(item.abweichungen || "").split("\n").filter((line: string) => line.trim()).length || 0), 0);
  return (
    <MandantGuard>
      <PageHeader title={t("auditsTitle")} desc={t("auditsDesc")}
        action={<Button size="sm" className="bg-primary h-8 text-xs gap-1.5" onClick={() => setModal("new")}><Plus className="h-3.5 w-3.5" />Neues Audit</Button>} />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Audits gesamt</p><p className="text-2xl font-bold">{data.length}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Abweichungen gesamt</p><p className="text-2xl font-bold">{gesamtAbweichungen}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Offene Audit-To-dos</p><p className="text-2xl font-bold">{offeneAuditAufgaben.length}</p></CardContent></Card>
      </div>
      {isLoading ? <Skeleton className="h-32 w-full" /> : (
        <div className="space-y-3">
          {data.length === 0 && <Card className="border-dashed"><CardContent className="py-12 text-center text-sm text-muted-foreground">Noch keine Audits dokumentiert.</CardContent></Card>}
          {data.map((item: any) => {
            const abweichungen = String(item.abweichungen || "").split("\n").filter((line: string) => line.trim());
            const todos = String(item.empfehlungen || "").split("\n").filter((line: string) => line.trim());
            return (
              <Card key={item.id} className="group hover:border-border/80 transition-colors">
                <CardContent className="p-4 space-y-3">
                  <div className="flex flex-col items-start justify-between gap-3 sm:flex-row">
                    <div>
                      <p className="text-sm font-semibold">{item.titel}</p>
                      <p className="text-xs text-muted-foreground">{item.pruefbereich || "Allgemeiner Prüfbereich"} · {item.auditdatum}{item.auditor ? ` · Auditor: ${item.auditor}` : ""}</p>
                    </div>
                    <div className="flex w-full items-center justify-between gap-2 shrink-0 sm:w-auto sm:justify-end">
                      <StatusBadge value={item.ergebnis} />
                      <StatusBadge value={item.status} />
                      <button onClick={() => setModal(item)} className="p-1 rounded text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-all"><Pencil className="h-3.5 w-3.5" /></button>
                      <button onClick={() => setDelId(item.id)} className="p-1 rounded text-muted-foreground hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"><Trash2 className="h-3.5 w-3.5" /></button>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                    <div className="rounded-lg border p-3"><p className="font-medium mb-1">Scope</p><p className="text-muted-foreground whitespace-pre-wrap">{item.scope || "—"}</p></div>
                    <div className="rounded-lg border p-3"><p className="font-medium mb-1">Abweichungen</p><p className="text-muted-foreground whitespace-pre-wrap">{abweichungen.length ? abweichungen.join("\n") : "—"}</p></div>
                    <div className="rounded-lg border p-3"><p className="font-medium mb-1">Audit-To-dos</p><p className="text-muted-foreground whitespace-pre-wrap">{todos.length ? todos.join("\n") : "—"}</p></div>
                  </div>
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
            <SelectContent><SelectItem value="vvt">VVT</SelectItem><SelectItem value="avv">AVV</SelectItem><SelectItem value="dsfa">DSFA</SelectItem><SelectItem value="datenpanne">Datenpanne</SelectItem><SelectItem value="dsr">DSR</SelectItem><SelectItem value="tom">TOM</SelectItem><SelectItem value="sonstige">Sonstige</SelectItem></SelectContent>
          </Select>
        </div>
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

function AufgabenPage() {
  const { t } = useI18n();
  const { data, isLoading, create, update, remove } = useModuleData("aufgaben");
  const [modal, setModal] = useState<null | "new" | any>(null);
  const [delId, setDelId] = useState<number | null>(null);
  const [filter, setFilter] = useState("alle");
  const [typFilter, setTypFilter] = useState("alle");
  const { toast } = useToast();
  const save = (form: any) => {
    const p = modal === "new" ? create.mutateAsync(form) : update.mutateAsync({ id: modal.id, ...form });
    p.then(() => { setModal(null); toast({ title: "Gespeichert" }); }).catch(() => toast({ title: "Fehler", variant: "destructive" }));
  };
  const today = new Date().toISOString().split("T")[0];
  const filtered = data.filter((a: any) => (filter === "alle" || a.status === filter) && (typFilter === "alle" || a.typ === typFilter));
  return (
    <MandantGuard>
      <PageHeader title={t("tasksTitle")} desc={t("tasksDesc")}
        action={<Button size="sm" className="bg-primary h-8 text-xs gap-1.5" onClick={() => setModal("new")}><Plus className="h-3.5 w-3.5" />Neue Aufgabe</Button>} />
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
          {filtered.length === 0 && <Card className="border-dashed"><CardContent className="py-12 text-center text-sm text-muted-foreground">Keine Aufgaben in dieser Ansicht.</CardContent></Card>}
          {filtered.map((item: any) => {
            const ueberfaellig = item.faelligAm && item.faelligAm < today && item.status !== "erledigt";
            return (
              <Card key={item.id} className={`group hover:border-border/80 transition-colors ${ueberfaellig ? "border-orange-500/30" : ""}`}>
                <CardContent className="py-3 px-4 flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center sm:gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <button onClick={() => update.mutate({ id: item.id, status: item.status === "erledigt" ? "offen" : "erledigt" })}
                      className={`shrink-0 w-4 h-4 rounded border transition-colors ${item.status === "erledigt" ? "bg-emerald-500 border-emerald-500" : "border-border hover:border-primary"}`}>
                      {item.status === "erledigt" && <CheckCircle2 className="w-4 h-4 text-white" />}
                    </button>
                    <div className="min-w-0">
                      <p className={`text-sm font-medium truncate ${item.status === "erledigt" ? "line-through text-muted-foreground" : ""}`}>{item.titel}</p>
                      <p className="text-xs text-muted-foreground">{item.typ || "task"} · {item.verantwortlicher || "—"}{item.faelligAm ? ` · Fällig: ${item.faelligAm}` : ""}{ueberfaellig ? " ⚠ Überfällig" : ""}</p>
                      <div className="mt-2 h-2 w-full rounded bg-secondary overflow-hidden">
                        <div className="h-full bg-primary transition-all" style={{ width: `${Math.max(0, Math.min(100, item.fortschritt || 0))}%` }} />
                      </div>
                    </div>
                  </div>
                  <div className="flex w-full items-center justify-between gap-2 shrink-0 sm:w-auto sm:justify-end">
                    <button onClick={() => update.mutate({ id: item.id, fortschritt: Math.max(0, Math.min(100, (item.fortschritt || 0) - 10)) })} className="px-2 py-1 rounded text-xs bg-secondary text-muted-foreground hover:text-foreground">-10%</button>
                    <button onClick={() => update.mutate({ id: item.id, fortschritt: Math.max(0, Math.min(100, (item.fortschritt || 0) + 10)) })} className="px-2 py-1 rounded text-xs bg-secondary text-muted-foreground hover:text-foreground">+10%</button>
                    <button onClick={() => update.mutate({ id: item.id, status: item.status === "offen" ? "in_bearbeitung" : item.status === "in_bearbeitung" ? "erledigt" : "offen" })} className="px-2 py-1 rounded text-xs bg-secondary text-muted-foreground hover:text-foreground">Status</button>
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
  const { data: dokumente, create, update } = useModuleData("dokumente");
  const { data: dsfas = [] } = useModuleData("dsfa");
  const { toast } = useToast();
  const existingCheck = dokumente.find((d: any) => d.kategorie === "prozessbeschreibung" && d.dokumentTyp === "ki_compliance_check");

  const parseJson = (raw: string | null | undefined, fallback: any) => {
    if (!raw) return fallback;
    try { return JSON.parse(raw); } catch { return fallback; }
  };

  const [form, setForm] = useState<any>({
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
  });

  useEffect(() => {
    const parsed = parseJson(existingCheck?.inhalt, form);
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
    onSuccess: () => {
      toast({ title: t("restoreBackupSuccess") });
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
    onSuccess: () => {
      toast({ title: t("uploadBackupSuccess") });
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
            <div key={item.fileName} className="rounded-lg border p-3 flex flex-col gap-3">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                <div>
                  <div className="font-medium text-foreground">{item.fileName}</div>
                  <div className="text-xs text-muted-foreground">{slotLabel(item.slot)} · {item.createdAt} · {(item.size / 1024).toFixed(1)} KB</div>
                </div>
                <div className="flex items-center gap-2">
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
                  disabled={restoreMutation.isPending || (item.encrypted && !restorePassword)}
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
  const { data: dokumente, create, update } = useModuleData("dokumente");
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

  const [form, setForm] = useState<any>({
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
  });

  useEffect(() => {
    const parsed = parseJson(existingCheck?.inhalt, form);
    setForm((prev: any) => ({ ...prev, ...parsed, zielgruppen: Array.isArray(parsed.zielgruppen) ? parsed.zielgruppen : (prev.zielgruppen || []) }));
  }, [existingCheck?.id]);

  const set = (key: string, value: any) => setForm((prev: any) => ({ ...prev, [key]: value }));
  const toggleZielgruppe = (value: string) => setForm((prev: any) => ({ ...prev, zielgruppen: prev.zielgruppen.includes(value) ? prev.zielgruppen.filter((x: string) => x !== value) : [...prev.zielgruppen, value] }));

  const status = form.datenschutzerklaerungVorhanden && form.verpflichtungVerschwiegenheit && form.verpflichtungTelekommunikation && form.schulungDurchgefuehrt
    ? { label: "Strukturiert", cls: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" }
    : form.datenschutzerklaerungVorhanden || form.verpflichtungVerschwiegenheit || form.verpflichtungTelekommunikation || form.schulungDurchgefuehrt
      ? { label: "Teilweise", cls: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30" }
      : { label: "Offen", cls: "bg-red-500/15 text-red-400 border-red-500/30" };

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
  const { data: dokumente, create, update } = useModuleData("dokumente");
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

  return (
    <MandantGuard>
      <div className="space-y-6">
        <PageHeader title={t("webPrivacyTitle")} desc={t("webPrivacyDesc")} />

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
  const save = (form: any) => {
    const p = modal === "new" ? create.mutateAsync(form) : update.mutateAsync({ id: modal.id, ...form });
    p.then(() => { setModal(null); toast({ title: "Gespeichert" }); }).catch(() => toast({ title: "Fehler", variant: "destructive" }));
  };
  const catIcons: Record<string, string> = { leitlinie: "🛡️", leitlinie_datenschutz: "🛡️", leitlinie_informationssicherheit: "🛡️", richtlinie: "📋", prozessbeschreibung: "🧭", risikobewertung: "⚠️", verfahrensdokumentation: "🗂️", vorlage: "📄", vertrag: "📝", protokoll: "📒", sonstige: "📁" };
  const filtered = filter === "alle" ? data : data.filter((item: any) => item.kategorie === filter);
  return (
    <MandantGuard>
      <PageHeader title={t("docsTitle")} desc={t("docsDesc")}
        action={<Button size="sm" className="bg-primary h-8 text-xs gap-1.5" onClick={() => setModal("new")}><Plus className="h-3.5 w-3.5" />Neues Dokument</Button>} />
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
              <div className="space-y-1">
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
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("privashield_token"));
  const [restoring, setRestoring] = useState<boolean>(() => !!localStorage.getItem("privashield_token"));

  const login = (u: AuthUser, t: string) => {
    setUser(u); setToken(t); setRestoring(false);
    localStorage.setItem("privashield_token", t);
  };
  const logout = () => {
    setUser(null); setToken(null); setRestoring(false); queryClient.clear();
    localStorage.removeItem("privashield_token");
    localStorage.removeItem("privashield_active_mandant_id");
  };

  useEffect(() => {
    const origFetch = window.fetch;
    (window as any).__origFetch = origFetch;
  }, []);

  useEffect(() => {
    if (!token) {
      setRestoring(false);
      return;
    }

    let cancelled = false;
    fetch("/api/auth/me", { headers: { Authorization: `Bearer ${token}` } })
      .then(async (res) => {
        if (!res.ok) throw new Error("Session ungültig");
        return res.json();
      })
      .then((safeUser) => {
        if (cancelled) return;
        setUser(safeUser);
      })
      .catch(() => {
        if (cancelled) return;
        localStorage.removeItem("privashield_token");
        localStorage.removeItem("privashield_active_mandant_id");
        setToken(null);
        setUser(null);
        queryClient.clear();
      })
      .finally(() => {
        if (!cancelled) setRestoring(false);
      });

    return () => { cancelled = true; };
  }, [token]);

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

  if (!user || !token) return <LoginPage onLogin={login} />;
  return (
    <AuthCtx.Provider value={{ user, token, login, logout }}>
      {children}
    </AuthCtx.Provider>
  );
}

// Override apiRequest to inject auth token
const origApiRequest = apiRequest;

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
  { key: "loeschkonzept", label: "Löschkonzept & Löschklassen", icon: Database, color: "text-sky-400" },
  { key: "aufgaben", label: "Aufgaben & Maßnahmenplan", icon: CheckSquare, color: "text-orange-400" },
  { key: "dokumente", label: "Dokumente & Vorlagen", icon: FolderOpen, color: "text-slate-400" },
];

function ExportPage() {
  const { t } = useI18n();
  const { activeMandantId } = useMandant();
  const [selected, setSelected] = useState<Set<string>>(new Set(EXPORT_MODULES.map((m) => m.key)));

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
  const { data: gruppen = [] } = useQuery({
    queryKey: ["/api/mandanten-gruppen"],
    queryFn: () => apiRequest("GET", "/api/mandanten-gruppen").then((r) => r.json()),
  });
  const { data: audits = [] } = useQuery({
    queryKey: [`/api/mandanten/${activeMandantId}/audits`],
    queryFn: () => activeMandantId ? apiRequest("GET", `/api/mandanten/${activeMandantId}/audits`).then((r) => r.json()) : [],
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
  const { data: interneNotizen = [] } = useQuery({
    queryKey: [`/api/mandanten/${activeMandantId}/interne-notizen`],
    queryFn: () => activeMandantId ? apiRequest("GET", `/api/mandanten/${activeMandantId}/interne-notizen`).then((r) => r.json()) : [],
    enabled: !!activeMandantId,
  });
  const exportierbareInterneNotizen = interneNotizen.filter((note: any) => !!note.exportieren);
  const auditTodos = aufgaben.filter((a: any) => (a.kategorie === "audit" || String(a.titel || "").toLowerCase().includes("audit")) && a.status !== "erledigt");
  const auditDeviationCount = audits.reduce((sum: number, item: any) => sum + String(item.abweichungen || "").split("\n").filter((line: string) => line.trim()).length, 0);
  const managementSummary = {
    score: mandant?.verantwortlicherName ? 75 : 40,
    ampel: mandant?.verantwortlicherName ? "Gelb" : "Rot",
    topRisiken: logs.filter((l: any) => String(l.aktion || "").includes("geloescht") || String(l.aktion || "").includes("kritisch")).length,
    audits: audits.length,
    auditDeviationCount,
    auditTodos: auditTodos.length,
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
    const cfg = {
      mandantId: activeMandantId,
      mandantName: mandant?.name ?? "Unbekannter Mandant",
      mandantInfo: mandant,
      gruppeInfo: gruppen.find((g: any) => g.id === mandant?.gruppeId) || null,
      logs,
      audits,
      auditTodos,
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

  const applyPaket = async () => {
    if (!activeMandantId || !selectedPaket) return;
    try {
      const res = await apiRequest("POST", `/api/mandanten/${activeMandantId}/vorlagenpakete/${selectedPaket}/apply`, {});
      const data = await res.json();
      qc.invalidateQueries({ queryKey: ["/api/mandanten-logs", activeMandantId] });
      qc.invalidateQueries({ queryKey: [`/api/mandanten/${activeMandantId}/aufgaben`] });
      qc.invalidateQueries({ queryKey: [`/api/mandanten/${activeMandantId}/dokumente`] });
      toast({ title: "Vorlagenpaket angewendet", description: `Aufgaben: ${data.created.aufgaben}, Dokumente: ${data.created.dokumente}` });
    } catch {
      toast({ title: "Fehler beim Anwenden", variant: "destructive" });
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
            <Button className="bg-primary" onClick={applyPaket} disabled={!selectedPaket}>Anwenden</Button>
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
  const { token, user } = useAuth();
  const [activeMandantId, setActiveMandantId] = useState<number | null>(() => {
    const stored = localStorage.getItem("privashield_active_mandant_id");
    return stored ? Number(stored) : null;
  });

  const { data: mandanten = [], isLoading: mandantenLoading } = useQuery({
    queryKey: ["/api/mandanten"],
    queryFn: () => apiRequest("GET", "/api/mandanten").then(r => r.json()),
    enabled: !!token,
  });

  useEffect(() => {
    if (!token || mandantenLoading) return;

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
  }, [token, user, mandanten, mandantenLoading, activeMandantId]);

  useEffect(() => {
    if (activeMandantId) localStorage.setItem("privashield_active_mandant_id", String(activeMandantId));
    else localStorage.removeItem("privashield_active_mandant_id");
  }, [activeMandantId]);

  // Patch apiRequest with token
  useEffect(() => {
    if (!token) return;
    const orig = (window as any).__origFetch || window.fetch;
    window.fetch = (input: any, init: any = {}) => {
      const url = typeof input === "string" ? input : input.url;
      if (url?.includes("/api/")) {
        init.headers = { ...init.headers, Authorization: `Bearer ${token}` };
      }
      return orig(input, init);
    };
    return () => { window.fetch = orig; };
  }, [token]);

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
