import { Switch, Route, Router, useLocation, Link } from "wouter";
import { useHashLocation } from "wouter/use-hash-location";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
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
  Printer, Download, ChevronDown, ChevronUp, Copy, Globe, Mail, Bot, ClipboardList
} from "lucide-react";

// ─── Auth Context ──────────────────────────────────────────────────────────
type AuthUser = { id: number; email: string; name: string; role: string; mandantIds: string };
const AuthCtx = createContext<{ user: AuthUser | null; token: string | null; login: (u: AuthUser, t: string) => void; logout: () => void }>({
  user: null, token: null, login: () => {}, logout: () => {}
});

function useAuth() { return useContext(AuthCtx); }

// ─── Mandant Context ───────────────────────────────────────────────────────
const MandantCtx = createContext<{ activeMandantId: number | null; setActiveMandantId: (id: number) => void }>({
  activeMandantId: null, setActiveMandantId: () => {}
});
function useMandant() { return useContext(MandantCtx); }

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
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
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
                <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-lg">
                  <AlertCircle className="h-4 w-4 shrink-0" />{error}
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
  { path: "/", label: "Dashboard", icon: LayoutDashboard },
  { path: "/overview", label: "Mandanten-Übersicht", icon: Eye },
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
  { path: "/web-datenschutz", label: "Web-Datenschutz", icon: Globe },
  { path: "/ki-compliance", label: "KI-Tools & Compliance", icon: Bot },
  { path: "/extras", label: "Mandanten-Extras", icon: MoreVertical },
  { path: "/export", label: "Export / Druck", icon: Printer },
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
  const { activeMandantId, setActiveMandantId } = useMandant();
  const [location] = useHashLocation();

  const { data: mandanten = [] } = useQuery({
    queryKey: ["/api/mandanten"],
    queryFn: () => apiRequest("GET", "/api/mandanten").then(r => r.json()),
  });

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
          <p className="text-sm font-semibold text-sidebar-accent-foreground truncate">PrivaShield</p>
          <p className="text-xs text-sidebar-foreground/60 truncate">DSM-Plattform</p>
        </div>
        {mobile && <button onClick={onClose} className="text-sidebar-foreground/60 hover:text-sidebar-accent-foreground"><X className="h-4 w-4" /></button>}
      </div>

      {/* Mandanten-Auswahl */}
      <div className="px-3 py-3 border-b border-sidebar-border">
        <p className="text-xs font-semibold text-sidebar-foreground/50 uppercase tracking-wider mb-2 px-1">Mandant</p>
        <Select value={activeMandantId?.toString() || ""} onValueChange={v => setActiveMandantId(Number(v))}>
          <SelectTrigger className="h-8 text-xs bg-sidebar-accent border-sidebar-border text-sidebar-accent-foreground" data-testid="select-mandant">
            <SelectValue placeholder="Mandant wählen..." />
          </SelectTrigger>
          <SelectContent>
            {mandanten.map((m: any) => (
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
                  <Icon className="h-4 w-4 shrink-0" />{label}
                </a>
              </Link>
            );
          })}

          {user?.role === "admin" && (
            <>
              <div className="pt-3 pb-1 px-1">
                <p className="text-xs font-semibold text-sidebar-foreground/40 uppercase tracking-wider">Administration</p>
              </div>
              {adminNavItems.map(({ path, label, icon: Icon }) => {
                const active = location.startsWith(path);
                return (
                  <Link key={path} href={path}>
                    <a onClick={onClose} className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                      active ? "bg-primary/15 text-primary font-medium" : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                    }`}>
                      <Icon className="h-4 w-4 shrink-0" />{label}
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
            <p className="text-xs text-sidebar-foreground/50 truncate">{user?.role === "admin" ? "Administrator" : "Nutzer"}</p>
          </div>
        </div>
        <button onClick={logout} className="flex items-center gap-2 w-full px-3 py-1.5 rounded-lg text-xs text-sidebar-foreground hover:bg-sidebar-accent hover:text-red-400 transition-colors">
          <LogOut className="h-3.5 w-3.5" /> Abmelden
        </button>
      </div>
    </div>
  );
}

// ─── LAYOUT ────────────────────────────────────────────────────────────────
function Layout({ children }: { children: React.ReactNode }) {
  const { theme, toggle } = useTheme();
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
            <button onClick={toggle} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          {children}
        </main>
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
  const { activeMandantId } = useMandant();
  if (!activeMandantId) return (
    <div className="flex flex-col items-center justify-center h-64 text-center gap-3">
      <Building2 className="h-10 w-10 text-muted-foreground/40" />
      <p className="text-sm text-muted-foreground">Bitte wähle links einen Mandanten aus.</p>
    </div>
  );
  return <>{children}</>;
}

// ─── DASHBOARD ─────────────────────────────────────────────────────────────
function Dashboard() {
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
  const activeMandant = mandanten.find((m: any) => m.id === activeMandantId);
  const { data: gruppen = [] } = useQuery({
    queryKey: ["/api/mandanten-gruppen"],
    queryFn: () => apiRequest("GET", "/api/mandanten-gruppen").then(r => r.json()),
  });
  const leitlinien = dokumente.filter((d: any) => d.kategorie === "leitlinie" || d.kategorie === "leitlinie_datenschutz" || d.kategorie === "leitlinie_informationssicherheit");
  const richtlinien = dokumente.filter((d: any) => d.kategorie === "richtlinie");
  const webDatenschutzCheck = dokumente.find((d: any) => d.kategorie === "prozessbeschreibung" && d.dokumentTyp === "web_datenschutz_check");
  const datenschutzhinweiseCheck = dokumente.find((d: any) => d.kategorie === "prozessbeschreibung" && d.dokumentTyp === "datenschutzhinweise_check");
  const kiComplianceCheck = dokumente.find((d: any) => d.kategorie === "prozessbeschreibung" && d.dokumentTyp === "ki_compliance_check");
  const leitlinieVorhanden = leitlinien.length > 0;
  const offeneReviews = aufgaben.filter((a: any) => a.typ === "review" && a.status !== "erledigt");
  const kritischeAufgaben = aufgaben.filter((a: any) => a.prioritaet === "kritisch" && a.status !== "erledigt");
  const gruppenKennzahl = activeMandant?.gruppeId ? mandanten.filter((m: any) => m.gruppeId === activeMandant.gruppeId).length : 0;
  const reifegradScore = Math.max(0, Math.min(100,
    (activeMandant?.verantwortlicherName ? 15 : 0) +
    (activeMandant?.datenschutzmanagerName ? 10 : 0) +
    (activeMandant?.itVerantwortlicherName ? 10 : 0) +
    (activeMandant?.isbName ? 10 : 0) +
    (activeMandant?.gruppeId ? 10 : 0) +
    (leitlinieVorhanden ? 15 : 0) +
    (stats?.offeneAufgaben === 0 ? 15 : (stats?.offeneAufgaben ?? 0) <= 3 ? 10 : 0) +
    (offeneReviews.length === 0 ? 15 : 5)
  ));
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
        title={activeMandant ? `Dashboard – ${activeMandant.name}` : "Dashboard"}
        desc="Übersicht aller Datenschutzaktivitäten"
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
                <CardTitle className="text-sm">Leitlinienstatus</CardTitle>
                <CardDescription>Grundsatzdokument für Datenschutz und Informationssicherheit</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p>Leitlinie vorhanden: <span className="font-medium">{leitlinieVorhanden ? "Ja" : "Nein"}</span></p>
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
              {kritischeAufgaben.length === 0 && leitlinieVorhanden && offeneReviews.length === 0 && webDatenschutzCheck && datenschutzhinweiseCheck && kiComplianceCheck && (
                <p className="text-muted-foreground">Aktuell keine auffälligen Warnhinweise.</p>
              )}
              {kritischeAufgaben.length > 0 && <p className="text-red-400">Kritische offene Aufgaben: {kritischeAufgaben.length}</p>}
              {offeneReviews.length > 0 && <p className="text-yellow-400">Offene Reviews: {offeneReviews.length}</p>}
              {!leitlinieVorhanden && <p className="text-orange-400">Leitliniendokument für Datenschutz und Informationssicherheit fehlt.</p>}
              {!webDatenschutzCheck && <p className="text-orange-400">Prüfung der Webseiten-Datenschutzerklärung und des Impressums fehlt.</p>}
              {!datenschutzhinweiseCheck && <p className="text-orange-400">Prüfung der Datenschutzhinweise für Personengruppen fehlt.</p>}
              {!kiComplianceCheck && <p className="text-orange-400">Prüfung zum Einsatz von KI-Tools und KI-VO-Konformität fehlt.</p>}
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
              <CardDescription>Vereinfachter Governance-Score</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{reifegradScore}%</p>
              <div className="mt-3 h-3 w-full rounded bg-secondary overflow-hidden">
                <div className="h-full bg-primary transition-all" style={{ width: `${reifegradScore}%` }} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Letzte Änderungen</CardTitle>
              <CardDescription>Trend- und Aktivitätssicht</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p className="text-muted-foreground">Zuletzt aktualisierte Themen lassen sich über das Änderungsprotokoll im Bereich Mandanten-Extras prüfen.</p>
              <p>Kritische Aufgaben: <span className="font-medium">{kritischeAufgaben.length}</span></p>
              <p>Offene Reviews: <span className="font-medium">{offeneReviews.length}</span></p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Management-KPIs</CardTitle>
              <CardDescription>Verdichtete Kennzahlen zur Steuerung</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div><p className="text-2xl font-bold">{complianceKpis.offeneAufgaben}</p><p className="text-xs text-muted-foreground">offene Aufgaben</p></div>
              <div><p className="text-2xl font-bold">{complianceKpis.leitlinien ? "Ja" : "Nein"}</p><p className="text-xs text-muted-foreground">Leitlinie vorhanden</p></div>
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
  const [selectedTemplate, setSelectedTemplate] = useState("none");
  const [form, setForm] = useState({ bezeichnung: "", zweck: "", rechtsgrundlage: "", verantwortlicher: "", verantwortlicherEmail: "", verantwortlicherTelefon: "", loeschfrist: "", loeschklasse: "", aufbewahrungsgrund: "", status: "aktiv", dsfa: false, drittlandtransfer: false, datenkategorien: "", betroffenePersonen: "", empfaenger: "", tomHinweis: "", ...initial });
  const set = (k: string, v: any) => setForm((p: any) => ({ ...p, [k]: v }));
  const applyFristKategorie = (value: string) => {
    const found = gesetzlicheAufbewahrungsfristen.find((item) => item.key === value);
    if (!found) return set("fristKategorie", value);
    setForm((p: any) => ({ ...p, fristKategorie: value, gesetzlicheFrist: found.referenzen?.[0] || found.label, aufbewahrungsfrist: found.frist || p.aufbewahrungsfrist }));
  };
  const selectedFrist = gesetzlicheAufbewahrungsfristen.find((item) => item.key === (form.fristKategorie || "frei")) || gesetzlicheAufbewahrungsfristen[0];
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
          <Label className="text-xs">Muster-Verarbeitungstätigkeit</Label>
          <Select value={selectedTemplate} onValueChange={applyTemplate}>
            <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Vorlage auswählen" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Keine Vorlage</SelectItem>
              <SelectItem value="personalverwaltung">Personalverwaltung</SelectItem>
              <SelectItem value="bewerbermanagement">Bewerbermanagement</SelectItem>
              <SelectItem value="kundenverwaltung">Kundenverwaltung / CRM</SelectItem>
              <SelectItem value="newsletter">Newsletter-Versand</SelectItem>
              <SelectItem value="video">Videoüberwachung</SelectItem>
              <SelectItem value="ki">Einsatz von KI-Tools</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="col-span-2 space-y-1"><Label className="text-xs">Bezeichnung *</Label><Input value={form.bezeichnung} onChange={e => set("bezeichnung", e.target.value)} className="h-8 text-sm" /></div>
        <div className="col-span-2 space-y-1"><Label className="text-xs">Zweck der Verarbeitung</Label><Textarea value={form.zweck} onChange={e => set("zweck", e.target.value)} className="text-sm min-h-16" /></div>
        <div className="space-y-1">
          <Label className="text-xs">Rechtsgrundlage</Label>
          <Select value={form.rechtsgrundlage} onValueChange={v => set("rechtsgrundlage", v)}>
            <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Wählen..." /></SelectTrigger>
            <SelectContent>{rechtsgrundlagen.map(r => <SelectItem key={r} value={r} className="text-xs">{r}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-1"><Label className="text-xs">Status</Label>
          <Select value={form.status} onValueChange={v => set("status", v)}>
            <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="aktiv">Aktiv</SelectItem><SelectItem value="entwurf">Entwurf</SelectItem><SelectItem value="archiviert">Archiviert</SelectItem></SelectContent>
          </Select>
        </div>
        <div className="space-y-1"><Label className="text-xs">Verantwortlicher</Label><Input value={form.verantwortlicher} onChange={e => set("verantwortlicher", e.target.value)} className="h-8 text-sm" /></div>
        <div className="space-y-1"><Label className="text-xs">Verantwortlicher E-Mail</Label><Input type="email" value={form.verantwortlicherEmail || ""} onChange={e => set("verantwortlicherEmail", e.target.value)} className="h-8 text-sm" /></div>
        <div className="space-y-1"><Label className="text-xs">Verantwortlicher Telefon</Label><Input value={form.verantwortlicherTelefon || ""} onChange={e => set("verantwortlicherTelefon", e.target.value)} className="h-8 text-sm" /></div>
        <div className="space-y-1"><Label className="text-xs">Löschfrist</Label><Input value={form.loeschfrist} onChange={e => set("loeschfrist", e.target.value)} className="h-8 text-sm" placeholder="z. B. 3 Jahre" /></div>
        <div className="space-y-1"><Label className="text-xs">Löschklasse</Label><Input value={form.loeschklasse || ""} onChange={e => set("loeschklasse", e.target.value)} className="h-8 text-sm" placeholder="z. B. LK1 operativ" /></div>
        <div className="col-span-2 space-y-1"><Label className="text-xs">Aufbewahrungsgrund / Löschereignis</Label><Textarea value={form.aufbewahrungsgrund || ""} onChange={e => set("aufbewahrungsgrund", e.target.value)} className="text-sm min-h-12" /></div>
        <div className="col-span-2 space-y-1"><Label className="text-xs">Datenkategorien</Label><Textarea value={form.datenkategorien} onChange={e => set("datenkategorien", e.target.value)} className="text-sm min-h-12" /></div>
        <div className="col-span-2 space-y-1"><Label className="text-xs">Betroffene Personen</Label><Textarea value={form.betroffenePersonen} onChange={e => set("betroffenePersonen", e.target.value)} className="text-sm min-h-12" /></div>
        <div className="col-span-2 space-y-1"><Label className="text-xs">Empfänger / Dritte</Label><Textarea value={form.empfaenger} onChange={e => set("empfaenger", e.target.value)} className="text-sm min-h-12" /></div>
        <div className="col-span-2 space-y-1"><Label className="text-xs">TOM-Hinweis</Label><Textarea value={form.tomHinweis} onChange={e => set("tomHinweis", e.target.value)} className="text-sm min-h-12" /></div>
        <div className="flex items-center gap-2"><input type="checkbox" id="dsfa" checked={!!form.dsfa} onChange={e => set("dsfa", e.target.checked)} className="rounded" /><Label htmlFor="dsfa" className="text-xs">DSFA erforderlich</Label></div>
        <div className="flex items-center gap-2"><input type="checkbox" id="dritt" checked={!!form.drittlandtransfer} onChange={e => set("drittlandtransfer", e.target.checked)} className="rounded" /><Label htmlFor="dritt" className="text-xs">Drittlandtransfer</Label></div>
      </div>
      <DialogFooter>
        <Button variant="outline" size="sm" onClick={onCancel}>Abbrechen</Button>
        <Button size="sm" className="bg-primary" onClick={() => onSave(form)} disabled={!form.bezeichnung}>Speichern</Button>
      </DialogFooter>
    </div>
  );
}

function VvtPage() {
  const { data, isLoading, create, update, remove } = useModuleData("vvt");
  const [modal, setModal] = useState<null | "new" | any>(null);
  const [delId, setDelId] = useState<number | null>(null);
  const { toast } = useToast();

  const save = (form: any) => {
    const p = modal === "new" ? create.mutateAsync(form) : update.mutateAsync({ id: modal.id, ...form });
    p.then(() => { setModal(null); toast({ title: "Gespeichert" }); }).catch(() => toast({ title: "Fehler", variant: "destructive" }));
  };

  return (
    <MandantGuard>
      <PageHeader title="Verzeichnis der Verarbeitungstätigkeiten" desc="Art. 30 DSGVO — alle Verarbeitungstätigkeiten des Mandanten"
        action={<Button size="sm" className="bg-primary h-8 text-xs gap-1.5" onClick={() => setModal("new")}><Plus className="h-3.5 w-3.5" />Neu</Button>} />
      {isLoading ? <div className="space-y-2">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}</div> : (
        <div className="space-y-2">
          {data.length === 0 && <Card className="border-dashed"><CardContent className="py-12 text-center text-sm text-muted-foreground">Noch keine VVT-Einträge vorhanden.</CardContent></Card>}
          {data.map((item: any) => (
            <Card key={item.id} className="group hover:border-border/80 transition-colors">
              <CardContent className="py-3 px-4 flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center sm:gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <FileText className="h-4 w-4 text-teal-400 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{item.bezeichnung}</p>
                    <p className="text-xs text-muted-foreground truncate">{item.rechtsgrundlage || "Keine Rechtsgrundlage"}{item.dsfa ? " · DSFA erforderlich" : ""}</p>
                  </div>
                </div>
                <div className="flex w-full items-center justify-between gap-2 shrink-0 sm:w-auto sm:justify-end">
                  {item.drittlandtransfer && <Badge variant="outline" className="text-xs">Drittland</Badge>}
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
  const [selectedTemplate, setSelectedTemplate] = useState("none");
  const [form, setForm] = useState({ auftragsverarbeiter: "", gegenstand: "", vertragsdatum: "", laufzeit: "", status: "aktiv", sccs: false, avKontaktName: "", avKontaktEmail: "", avKontaktTelefon: "", genehmigteSubdienstleister: "", pruefFaellig: "", datenarten: "", betroffenePersonen: "", technischeMassnahmen: "", pruefintervall: "", subauftragnehmerHinweis: "", notizen: "", ...initial });
  const set = (k: string, v: any) => setForm((p: any) => ({ ...p, [k]: v }));
  const applyFristKategorie = (value: string) => {
    const found = gesetzlicheAufbewahrungsfristen.find((item) => item.key === value);
    if (!found) return set("fristKategorie", value);
    setForm((p: any) => ({ ...p, fristKategorie: value, gesetzlicheFrist: found.referenzen?.[0] || found.label, aufbewahrungsfrist: found.frist || p.aufbewahrungsfrist }));
  };
  const selectedFrist = gesetzlicheAufbewahrungsfristen.find((item) => item.key === (form.fristKategorie || "frei")) || gesetzlicheAufbewahrungsfristen[0];
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
          <Label className="text-xs">Muster-Auftragsverarbeiter</Label>
          <Select value={selectedTemplate} onValueChange={applyTemplate}>
            <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Vorlage auswählen" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Keine Vorlage</SelectItem>
              <SelectItem value="microsoft365">Microsoft 365</SelectItem>
              <SelectItem value="hosting">Hosting-Anbieter</SelectItem>
              <SelectItem value="newsletter">Newsletter-Dienstleister</SelectItem>
              <SelectItem value="payroll">Lohnabrechnungsdienstleister</SelectItem>
              <SelectItem value="ki">KI-Dienstleister</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="col-span-2 space-y-1"><Label className="text-xs">Auftragsverarbeiter *</Label><Input value={form.auftragsverarbeiter} onChange={e => set("auftragsverarbeiter", e.target.value)} className="h-8 text-sm" /></div>
        <div className="col-span-2 space-y-1"><Label className="text-xs">Gegenstand</Label><Input value={form.gegenstand} onChange={e => set("gegenstand", e.target.value)} className="h-8 text-sm" /></div>
        <div className="space-y-1"><Label className="text-xs">Vertragsdatum</Label><Input type="date" value={form.vertragsdatum} onChange={e => set("vertragsdatum", e.target.value)} className="h-8 text-sm" /></div>
        <div className="space-y-1"><Label className="text-xs">Laufzeit</Label><Input value={form.laufzeit} onChange={e => set("laufzeit", e.target.value)} className="h-8 text-sm" placeholder="z. B. unbefristet" /></div>
        <div className="space-y-1"><Label className="text-xs">Status</Label>
          <Select value={form.status} onValueChange={v => set("status", v)}>
            <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="entwurf">Entwurf</SelectItem><SelectItem value="aktiv">Aktiv</SelectItem><SelectItem value="gekündigt">Gekündigt</SelectItem><SelectItem value="abgelaufen">Abgelaufen</SelectItem></SelectContent>
          </Select>
        </div>
        <div className="space-y-1"><Label className="text-xs">AV-Kontaktperson</Label><Input value={form.avKontaktName || ""} onChange={e => set("avKontaktName", e.target.value)} className="h-8 text-sm" /></div>
        <div className="space-y-1"><Label className="text-xs">AV-Kontakt E-Mail</Label><Input type="email" value={form.avKontaktEmail || ""} onChange={e => set("avKontaktEmail", e.target.value)} className="h-8 text-sm" /></div>
        <div className="space-y-1"><Label className="text-xs">AV-Kontakt Telefon</Label><Input value={form.avKontaktTelefon || ""} onChange={e => set("avKontaktTelefon", e.target.value)} className="h-8 text-sm" /></div>
        <div className="space-y-1"><Label className="text-xs">Nächste Prüfung</Label><Input type="date" value={form.pruefFaellig} onChange={e => set("pruefFaellig", e.target.value)} className="h-8 text-sm" /></div>
        <div className="space-y-1"><Label className="text-xs">Prüfintervall</Label><Input value={form.pruefintervall} onChange={e => set("pruefintervall", e.target.value)} className="h-8 text-sm" placeholder="z. B. jährlich" /></div>
        <div className="flex items-center gap-2 col-span-2"><input type="checkbox" id="sccs" checked={!!form.sccs} onChange={e => set("sccs", e.target.checked)} className="rounded" /><Label htmlFor="sccs" className="text-xs">EU-Standardvertragsklauseln (SCCs) vorhanden</Label></div>
        <div className="col-span-2 space-y-1"><Label className="text-xs">Datenarten</Label><Textarea value={form.datenarten} onChange={e => set("datenarten", e.target.value)} className="text-sm min-h-12" /></div>
        <div className="col-span-2 space-y-1"><Label className="text-xs">Betroffene Personen</Label><Textarea value={form.betroffenePersonen} onChange={e => set("betroffenePersonen", e.target.value)} className="text-sm min-h-12" /></div>
        <div className="col-span-2 space-y-1"><Label className="text-xs">Technische und organisatorische Maßnahmen</Label><Textarea value={form.technischeMassnahmen} onChange={e => set("technischeMassnahmen", e.target.value)} className="text-sm min-h-12" /></div>
        <div className="col-span-2 space-y-1"><Label className="text-xs">Genehmigte Subdienstleister</Label><Textarea value={form.genehmigteSubdienstleister || ""} onChange={e => set("genehmigteSubdienstleister", e.target.value)} className="text-sm min-h-12" placeholder="z. B. Rechenzentrum XY, Mailgateway Z" /></div>
        <div className="col-span-2 space-y-1"><Label className="text-xs">Hinweis zu Subauftragsverarbeitern</Label><Textarea value={form.subauftragnehmerHinweis} onChange={e => set("subauftragnehmerHinweis", e.target.value)} className="text-sm min-h-12" /></div>
        <div className="col-span-2 space-y-1"><Label className="text-xs">Notizen</Label><Textarea value={form.notizen} onChange={e => set("notizen", e.target.value)} className="text-sm min-h-16" /></div>
      </div>
      <DialogFooter>
        <Button variant="outline" size="sm" onClick={onCancel}>Abbrechen</Button>
        <Button size="sm" className="bg-primary" onClick={() => onSave(form)} disabled={!form.auftragsverarbeiter}>Speichern</Button>
      </DialogFooter>
    </div>
  );
}

function AvvPage() {
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
      <PageHeader title="Auftragsverarbeitungsverträge" desc="AVV-Verwaltung gemäß Art. 28 DSGVO"
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
  const { data: dokumente = [] } = useModuleData("dokumente");
  const kiComplianceCheck = dokumente.find((d: any) => d.kategorie === "prozessbeschreibung" && d.dokumentTyp === "ki_compliance_check");
  const kiTools = (() => {
    try {
      const parsed = JSON.parse(kiComplianceCheck?.inhalt || "{}");
      return Array.isArray(parsed.tools) ? parsed.tools : [];
    } catch {
      return [];
    }
  })();
  const [selectedTemplate, setSelectedTemplate] = useState("none");
  const [form, setForm] = useState({ titel: "", beschreibung: "", notwendigkeit: "", massnahmen: "", ergebnis: "", status: "entwurf", reviewer: "", konsultation: false, risikoquelle: "", betroffeneGruppen: "", datenarten: "", eintrittswahrscheinlichkeit: "", schweregrad: "", restrisiko: "", restmassnahmen: "", ...initial });
  const set = (k: string, v: any) => setForm((p: any) => ({ ...p, [k]: v }));
  const applyFristKategorie = (value: string) => {
    const found = gesetzlicheAufbewahrungsfristen.find((item) => item.key === value);
    if (!found) return set("fristKategorie", value);
    setForm((p: any) => ({ ...p, fristKategorie: value, gesetzlicheFrist: found.referenzen?.[0] || found.label, aufbewahrungsfrist: found.frist || p.aufbewahrungsfrist }));
  };
  const selectedFrist = gesetzlicheAufbewahrungsfristen.find((item) => item.key === (form.fristKategorie || "frei")) || gesetzlicheAufbewahrungsfristen[0];
  const applyTemplate = (value: string) => {
    setSelectedTemplate(value);
    const template = dsfaTemplates[value];
    if (!template) return;
    setForm((p: any) => ({ ...p, ...template }));
  };
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="col-span-2 space-y-1">
          <Label className="text-xs">DSFA-Musterfall</Label>
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
        <div className="col-span-2 space-y-1"><Label className="text-xs">Titel *</Label><Input value={form.titel} onChange={e => set("titel", e.target.value)} className="h-8 text-sm" /></div>
        {kiTools.length > 0 && (
          <div className="col-span-2 space-y-1">
            <Label className="text-xs">KI-Tool als vordefinierter Name</Label>
            <Select value={kiTools.includes(form.titel) ? form.titel : "none"} onValueChange={v => v !== "none" && set("titel", v)}>
              <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="KI-Tool auswählen" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Kein KI-Tool auswählen</SelectItem>
                {kiTools.map((tool: string) => <SelectItem key={tool} value={tool}>{tool}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        )}
        <div className="col-span-2 space-y-1"><Label className="text-xs">Beschreibung der Verarbeitung</Label><Textarea value={form.beschreibung} onChange={e => set("beschreibung", e.target.value)} className="text-sm min-h-16" /></div>
        <div className="col-span-2 space-y-1"><Label className="text-xs">Notwendigkeit & Verhältnismäßigkeit</Label><Textarea value={form.notwendigkeit} onChange={e => set("notwendigkeit", e.target.value)} className="text-sm min-h-12" /></div>
        <div className="col-span-2 space-y-1"><Label className="text-xs">Risikominderungsmaßnahmen</Label><Textarea value={form.massnahmen} onChange={e => set("massnahmen", e.target.value)} className="text-sm min-h-12" /></div>
        <div className="col-span-2 space-y-1"><Label className="text-xs">Risikoquelle / Auslöser</Label><Input value={form.risikoquelle} onChange={e => set("risikoquelle", e.target.value)} className="h-8 text-sm" /></div>
        <div className="col-span-2 space-y-1"><Label className="text-xs">Betroffene Gruppen</Label><Textarea value={form.betroffeneGruppen} onChange={e => set("betroffeneGruppen", e.target.value)} className="text-sm min-h-12" /></div>
        <div className="col-span-2 space-y-1"><Label className="text-xs">Datenarten</Label><Textarea value={form.datenarten} onChange={e => set("datenarten", e.target.value)} className="text-sm min-h-12" /></div>
        <div className="space-y-1"><Label className="text-xs">Eintrittswahrscheinlichkeit</Label><Input value={form.eintrittswahrscheinlichkeit} onChange={e => set("eintrittswahrscheinlichkeit", e.target.value)} className="h-8 text-sm" placeholder="niedrig / mittel / hoch" /></div>
        <div className="space-y-1"><Label className="text-xs">Schweregrad</Label><Input value={form.schweregrad} onChange={e => set("schweregrad", e.target.value)} className="h-8 text-sm" placeholder="niedrig / mittel / hoch" /></div>
        <div className="space-y-1"><Label className="text-xs">Restrisiko</Label><Input value={form.restrisiko} onChange={e => set("restrisiko", e.target.value)} className="h-8 text-sm" placeholder="niedrig / mittel / hoch" /></div>
        <div className="col-span-2 space-y-1"><Label className="text-xs">Restmaßnahmen / Follow-up</Label><Textarea value={form.restmassnahmen} onChange={e => set("restmassnahmen", e.target.value)} className="text-sm min-h-12" /></div>
        <div className="space-y-1"><Label className="text-xs">Ergebnis</Label>
          <Select value={form.ergebnis} onValueChange={v => set("ergebnis", v)}>
            <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Wählen..." /></SelectTrigger>
            <SelectContent><SelectItem value="akzeptabel">Akzeptabel</SelectItem><SelectItem value="nicht_akzeptabel">Nicht akzeptabel</SelectItem><SelectItem value="bedingt">Bedingt akzeptabel</SelectItem></SelectContent>
          </Select>
        </div>
        <div className="space-y-1"><Label className="text-xs">Status</Label>
          <Select value={form.status} onValueChange={v => set("status", v)}>
            <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="entwurf">Entwurf</SelectItem><SelectItem value="abgeschlossen">Abgeschlossen</SelectItem><SelectItem value="überprüfung">In Überprüfung</SelectItem></SelectContent>
          </Select>
        </div>
        <div className="space-y-1"><Label className="text-xs">Reviewer</Label><Input value={form.reviewer} onChange={e => set("reviewer", e.target.value)} className="h-8 text-sm" /></div>
        <div className="flex items-center gap-2"><input type="checkbox" id="kons" checked={!!form.konsultation} onChange={e => set("konsultation", e.target.checked)} className="rounded" /><Label htmlFor="kons" className="text-xs">Behördenkonsultation (Art. 36)</Label></div>
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

function DsfaPage() {
  const { data, isLoading, create, update, remove } = useModuleData("dsfa");
  const [modal, setModal] = useState<null | "new" | any>(null);
  const [delId, setDelId] = useState<number | null>(null);
  const { toast } = useToast();
  const save = (form: any) => {
    const p = modal === "new" ? create.mutateAsync(form) : update.mutateAsync({ id: modal.id, ...form });
    p.then(() => { setModal(null); toast({ title: "Gespeichert" }); }).catch(() => toast({ title: "Fehler", variant: "destructive" }));
  };
  return (
    <MandantGuard>
      <PageHeader title="Datenschutz-Folgenabschätzungen" desc="DSFA gemäß Art. 35 DSGVO"
        action={<Button size="sm" className="bg-primary h-8 text-xs gap-1.5" onClick={() => setModal("new")}><Plus className="h-3.5 w-3.5" />Neu</Button>} />
      {isLoading ? <Skeleton className="h-32 w-full" /> : (
        <div className="space-y-2">
          {data.length === 0 && <Card className="border-dashed"><CardContent className="py-12 text-center text-sm text-muted-foreground">Noch keine DSFAs vorhanden.</CardContent></Card>}
          {data.map((item: any) => (
            <Card key={item.id} className="group hover:border-border/80 transition-colors">
              <CardContent className="py-3 px-4 flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center sm:gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <AlertTriangle className="h-4 w-4 text-yellow-400 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{item.titel}</p>
                    <p className="text-xs text-muted-foreground">{item.reviewer || "—"}{item.konsultation ? " · Behördenkonsultation" : ""}</p>
                  </div>
                </div>
                <div className="flex w-full items-center justify-between gap-2 shrink-0 sm:w-auto sm:justify-end">
                  {item.ergebnis && <StatusBadge value={item.ergebnis} />}
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
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto"><div className="sticky top-0 z-10 -mx-6 border-b bg-background px-6 pb-3 pt-1"><DialogHeader><DialogTitle>{modal === "new" ? "Neue DSFA" : "DSFA bearbeiten"}</DialogTitle></DialogHeader></div>
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
  const applyFristKategorie = (value: string) => {
    const found = gesetzlicheAufbewahrungsfristen.find((item) => item.key === value);
    if (!found) return set("fristKategorie", value);
    setForm((p: any) => ({ ...p, fristKategorie: value, gesetzlicheFrist: found.referenzen?.[0] || found.label, aufbewahrungsfrist: found.frist || p.aufbewahrungsfrist }));
  };
  const selectedFrist = gesetzlicheAufbewahrungsfristen.find((item) => item.key === (form.fristKategorie || "frei")) || gesetzlicheAufbewahrungsfristen[0];
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
      <PageHeader title="Datenpannen-Log" desc="Vorfallsmanagement gem. Art. 33/34 DSGVO — 72h-Meldepflicht"
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
  const applyFristKategorie = (value: string) => {
    const found = gesetzlicheAufbewahrungsfristen.find((item) => item.key === value);
    if (!found) return set("fristKategorie", value);
    setForm((p: any) => ({ ...p, fristKategorie: value, gesetzlicheFrist: found.referenzen?.[0] || found.label, aufbewahrungsfrist: found.frist || p.aufbewahrungsfrist }));
  };
  const selectedFrist = gesetzlicheAufbewahrungsfristen.find((item) => item.key === (form.fristKategorie || "frei")) || gesetzlicheAufbewahrungsfristen[0];
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
      <PageHeader title="Betroffenenrechte / DSR" desc="Tracking von Anfragen gem. Art. 12–22 DSGVO — Frist: 30 Tage"
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
  const applyFristKategorie = (value: string) => {
    const found = gesetzlicheAufbewahrungsfristen.find((item) => item.key === value);
    if (!found) return set("fristKategorie", value);
    setForm((p: any) => ({ ...p, fristKategorie: value, gesetzlicheFrist: found.referenzen?.[0] || found.label, aufbewahrungsfrist: found.frist || p.aufbewahrungsfrist }));
  };
  const selectedFrist = gesetzlicheAufbewahrungsfristen.find((item) => item.key === (form.fristKategorie || "frei")) || gesetzlicheAufbewahrungsfristen[0];
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
      <PageHeader title="TOM-Katalog" desc="Technische und organisatorische Maßnahmen gem. Art. 32 DSGVO"
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
  const applyFristKategorie = (value: string) => {
    const found = gesetzlicheAufbewahrungsfristen.find((item) => item.key === value);
    if (!found) return set("fristKategorie", value);
    setForm((p: any) => ({ ...p, fristKategorie: value, gesetzlicheFrist: found.referenzen?.[0] || found.label, aufbewahrungsfrist: found.frist || p.aufbewahrungsfrist }));
  };
  const selectedFrist = gesetzlicheAufbewahrungsfristen.find((item) => item.key === (form.fristKategorie || "frei")) || gesetzlicheAufbewahrungsfristen[0];
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

const vvtLoeschMapping = [
  { match: /bewerber/i, fristKategorie: "6_monate_bewerber", loeschklasse: "LK4", gesetzlicheFrist: "§ 15 Abs. 4 AGG / Verteidigung gegen AGG-Ansprüche" },
  { match: /personal/i, fristKategorie: "10_jahre_ao_hgb", loeschklasse: "LK4", gesetzlicheFrist: "§ 147 AO / § 257 HGB, soweit abrechnungs- und nachweispflichtig" },
  { match: /crm|kunden/i, fristKategorie: "3_jahre_regel", loeschklasse: "LK2", gesetzlicheFrist: "§§ 195, 199 BGB" },
  { match: /newsletter/i, fristKategorie: "3_jahre_regel", loeschklasse: "LK2", gesetzlicheFrist: "§§ 195, 199 BGB, Nachweis über Einwilligung" },
  { match: /video/i, fristKategorie: "frei", loeschklasse: "LK5", gesetzlicheFrist: "Kurzfristige Speicherfrist nach Erforderlichkeit" },
  { match: /ki/i, fristKategorie: "frei", loeschklasse: "LK5", gesetzlicheFrist: "Einzelfallabhängig nach Use Case und Rechtsgrundlage" },
];

const gesetzlicheAufbewahrungsfristen = [
  {
    key: "frei",
    label: "Freie / manuelle Frist",
    frist: "",
    referenzen: ["Freie Eingabe / interne Vorgabe"],
    hinweis: "Individuelle Eingabe ohne gesetzliche Vorbelegung"
  },
  {
    key: "6_monate_bewerber",
    label: "6 Monate, Bewerbungsverfahren",
    frist: "6 Monate",
    referenzen: ["§ 15 Abs. 4 AGG / Verteidigung gegen AGG-Ansprüche"],
    hinweis: "Regelmäßig für abgelehnte Bewerbungen nach AGG-Verteidigungsinteresse"
  },
  {
    key: "2_jahre_handelsbriefe",
    label: "2 Jahre, steuerliche Sonderfälle",
    frist: "2 Jahre",
    referenzen: ["§ 147a AO in Sonderkonstellationen"],
    hinweis: "Sonderfall nach Steuerrecht"
  },
  {
    key: "3_jahre_regel",
    label: "3 Jahre, regelmäßige Verjährung",
    frist: "3 Jahre",
    referenzen: ["§§ 195, 199 BGB"],
    hinweis: "Typisch für zivilrechtliche Nachweis- und Abwehrinteressen"
  },
  {
    key: "5_jahre_gw",
    label: "5 Jahre, Geldwäsche- und Sanktionsunterlagen",
    frist: "5 Jahre",
    referenzen: ["§ 8 GwG"],
    hinweis: "Regelmäßig nach GwG, teils Verlängerungsoptionen"
  },
  {
    key: "6_jahre_hgb",
    label: "6 Jahre, Handels- und Geschäftsbriefe",
    frist: "6 Jahre",
    referenzen: ["§ 257 Abs. 1 Nr. 2 und 3 HGB", "§ 147 Abs. 1 Nr. 2, 3, 5 AO"],
    hinweis: "Geschäftsbriefe und sonstige relevante Unterlagen"
  },
  {
    key: "8_jahre_buchung",
    label: "8 Jahre, Buchungsbelege",
    frist: "8 Jahre",
    referenzen: ["§ 147 Abs. 3 AO"],
    hinweis: "Aktuelle steuerrechtliche Aufbewahrung für Buchungsbelege"
  },
  {
    key: "10_jahre_ao_hgb",
    label: "10 Jahre, Buchführungs- und Steuerunterlagen",
    frist: "10 Jahre",
    referenzen: ["§ 257 Abs. 1 Nr. 1 und 4 HGB", "§ 147 Abs. 1 Nr. 1, 4, 4a AO"],
    hinweis: "Bücher, Inventare, Abschlüsse, Lageberichte, Verfahrensdoku"
  },
  {
    key: "30_jahre_titel",
    label: "30 Jahre, titulierte Forderungen / Spezialfälle",
    frist: "30 Jahre",
    referenzen: ["§ 197 BGB"],
    hinweis: "Nur für besondere Fallgruppen"
  },
];

function LoeschkonzeptForm({ initial, onSave, onCancel }: any) {
  const { data: vvts = [] } = useModuleData("vvt");
  const [form, setForm] = useState({ bezeichnung: "", datenart: "", loeschklasse: "LK2", fristKategorie: "frei", gesetzlicheFrist: "", quelleVvtId: "none", quelleVvtBezeichnung: "", aufbewahrungsfrist: "", loeschereignis: "", rechtsgrundlage: "", systeme: "", verantwortlicher: "", loeschverantwortlicher: "", kontrolle: "", nachweis: "", status: "aktiv", ...initial });
  const set = (k: string, v: any) => setForm((p: any) => ({ ...p, [k]: v }));
  const applyFristKategorie = (value: string) => {
    const found = gesetzlicheAufbewahrungsfristen.find((item) => item.key === value);
    if (!found) return set("fristKategorie", value);
    setForm((p: any) => ({ ...p, fristKategorie: value, gesetzlicheFrist: found.referenzen?.[0] || found.label, aufbewahrungsfrist: found.frist || p.aufbewahrungsfrist }));
  };
  const selectedFrist = gesetzlicheAufbewahrungsfristen.find((item) => item.key === (form.fristKategorie || "frei")) || gesetzlicheAufbewahrungsfristen[0];
  const importFromVvt = (value: string) => {
    set("quelleVvtId", value);
    if (value === "none") return;
    const found = vvts.find((item: any) => String(item.id) === value);
    if (!found) return;
    const mapped = vvtLoeschMapping.find((entry) => entry.match.test(found.bezeichnung || ""));
    setForm((p: any) => ({ ...p, quelleVvtId: value, quelleVvtBezeichnung: found.bezeichnung, bezeichnung: p.bezeichnung || found.bezeichnung, datenart: found.datenkategorien || p.datenart, loeschklasse: found.loeschklasse || mapped?.loeschklasse || p.loeschklasse, fristKategorie: mapped?.fristKategorie || p.fristKategorie, gesetzlicheFrist: mapped?.gesetzlicheFrist || p.gesetzlicheFrist, aufbewahrungsfrist: found.loeschfrist || gesetzlicheAufbewahrungsfristen.find((x) => x.key === mapped?.fristKategorie)?.frist || p.aufbewahrungsfrist, loeschereignis: found.aufbewahrungsgrund || p.loeschereignis, rechtsgrundlage: found.rechtsgrundlage || p.rechtsgrundlage, verantwortlicher: found.verantwortlicher || p.verantwortlicher, loeschverantwortlicher: p.loeschverantwortlicher || found.verantwortlicher || "" }));
  };
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="col-span-2 space-y-1"><Label className="text-xs">Übernahme aus VVT</Label>
          <Select value={String(form.quelleVvtId || "none")} onValueChange={importFromVvt}>
            <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="VVT auswählen" /></SelectTrigger>
            <SelectContent><SelectItem value="none">Keine VVT-Übernahme</SelectItem>{vvts.map((item:any) => <SelectItem key={item.id} value={String(item.id)}>{item.bezeichnung}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="col-span-2 space-y-1"><Label className="text-xs">Bezeichnung *</Label><Input value={form.bezeichnung} onChange={e => set("bezeichnung", e.target.value)} className="h-8 text-sm" /></div>
        <div className="col-span-2 space-y-1"><Label className="text-xs">Datenarten / Datensätze</Label><Textarea value={form.datenart} onChange={e => set("datenart", e.target.value)} className="text-sm min-h-12" /></div>
        <div className="space-y-1"><Label className="text-xs">Löschklasse *</Label>
          <Select value={form.loeschklasse} onValueChange={v => set("loeschklasse", v)}>
            <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>{loeschklassen.map((k) => <SelectItem key={k.key} value={k.key}>{k.label}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-1"><Label className="text-xs">Fristgruppe / gesetzliche Aufbewahrung</Label>
          <Select value={form.fristKategorie || "frei"} onValueChange={applyFristKategorie}>
            <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>{gesetzlicheAufbewahrungsfristen.map((item) => <SelectItem key={item.key} value={item.key}>{item.label}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-1"><Label className="text-xs">Aufbewahrungsfrist</Label><Input value={form.aufbewahrungsfrist} onChange={e => set("aufbewahrungsfrist", e.target.value)} className="h-8 text-sm" placeholder="z. B. 10 Jahre oder 6 Monate" /></div>
        <div className="col-span-2 space-y-1"><Label className="text-xs">Gesetzliche Frist / Referenz</Label>
          <Select value={form.gesetzlicheFrist || (selectedFrist.referenzen?.[0] || "Freie Eingabe / interne Vorgabe")} onValueChange={v => set("gesetzlicheFrist", v)}>
            <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              {(selectedFrist.referenzen || ["Freie Eingabe / interne Vorgabe"]).map((ref) => <SelectItem key={ref} value={ref}>{ref}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="col-span-2 space-y-1"><Label className="text-xs">Löschereignis / Trigger</Label><Textarea value={form.loeschereignis} onChange={e => set("loeschereignis", e.target.value)} className="text-sm min-h-12" /></div>
        <div className="space-y-1"><Label className="text-xs">Rechtsgrundlage / Normbezug</Label><Input value={form.rechtsgrundlage} onChange={e => set("rechtsgrundlage", e.target.value)} className="h-8 text-sm" /></div>
        <div className="space-y-1"><Label className="text-xs">Fachlich Verantwortlicher</Label><Input value={form.verantwortlicher} onChange={e => set("verantwortlicher", e.target.value)} className="h-8 text-sm" /></div>
        <div className="space-y-1"><Label className="text-xs">Löschverantwortlicher</Label><Input value={form.loeschverantwortlicher || ""} onChange={e => set("loeschverantwortlicher", e.target.value)} className="h-8 text-sm" placeholder="z. B. HR, IT, Buchhaltung" /></div>
        <div className="col-span-2 space-y-1"><Label className="text-xs">Betroffene Systeme / Speicherorte</Label><Textarea value={form.systeme} onChange={e => set("systeme", e.target.value)} className="text-sm min-h-12" /></div>
        <div className="col-span-2 space-y-1"><Label className="text-xs">Kontrolle / Überwachung</Label><Textarea value={form.kontrolle} onChange={e => set("kontrolle", e.target.value)} className="text-sm min-h-12" /></div>
        <div className="col-span-2 space-y-1"><Label className="text-xs">Nachweis / Löschprotokoll</Label><Textarea value={form.nachweis} onChange={e => set("nachweis", e.target.value)} className="text-sm min-h-12" /></div>
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
  const { data, isLoading, create, update, remove } = useModuleData("loeschkonzept");
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
      <PageHeader title="Löschkonzept" desc="Löschklassen, Fristen und Übernahme aus dem VVT zu einem operativen Lösch- und Aufbewahrungskonzept"
        action={<Button size="sm" className="bg-primary h-8 text-xs gap-1.5" onClick={() => setModal("new")}><Plus className="h-3.5 w-3.5" />Neuer Eintrag</Button>} />
      {isLoading ? <Skeleton className="h-32 w-full" /> : (
        <div className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {loeschklassen.map((k) => <Card key={k.key}><CardContent className="p-4"><p className="text-xs text-muted-foreground">{k.key}</p><p className="text-sm font-semibold">{k.label}</p><p className="text-2xl font-bold mt-2">{data.filter((x:any) => x.loeschklasse === k.key).length}</p></CardContent></Card>)}
            {gesetzlicheAufbewahrungsfristen.filter((f) => f.key !== "frei").slice(0,3).map((f) => <Card key={f.key}><CardContent className="p-4"><p className="text-xs text-muted-foreground">Fristgruppe</p><p className="text-sm font-semibold">{f.frist}</p><p className="text-xs text-muted-foreground mt-1">{f.label}</p><p className="text-2xl font-bold mt-2">{data.filter((x:any) => x.fristKategorie === f.key).length}</p></CardContent></Card>)}
          </div>
          <Card><CardContent className="p-4 grid grid-cols-1 md:grid-cols-3 gap-3 items-end"><div className="space-y-1"><Label className="text-xs">Fristgruppe</Label><Select value={filterFrist} onValueChange={setFilterFrist}><SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="alle">Alle</SelectItem>{gesetzlicheAufbewahrungsfristen.map((f) => <SelectItem key={f.key} value={f.key}>{f.label}</SelectItem>)}</SelectContent></Select></div><div className="space-y-1"><Label className="text-xs">Löschklasse</Label><Select value={filterKlasse} onValueChange={setFilterKlasse}><SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="alle">Alle</SelectItem>{loeschklassen.map((k) => <SelectItem key={k.key} value={k.key}>{k.label}</SelectItem>)}</SelectContent></Select></div><div className="space-y-1"><Label className="text-xs">Status</Label><Select value={filterStatus} onValueChange={setFilterStatus}><SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="alle">Alle</SelectItem><SelectItem value="aktiv">Aktiv</SelectItem><SelectItem value="entwurf">Entwurf</SelectItem><SelectItem value="archiviert">Archiviert</SelectItem></SelectContent></Select></div></CardContent></Card>
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
      <PageHeader title="Interne Audits" desc="Planung, Durchführung und Auditprotokolle mit Abweichungen, Findings und To-dos"
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
  const applyFristKategorie = (value: string) => {
    const found = gesetzlicheAufbewahrungsfristen.find((item) => item.key === value);
    if (!found) return set("fristKategorie", value);
    setForm((p: any) => ({ ...p, fristKategorie: value, gesetzlicheFrist: found.referenzen?.[0] || found.label, aufbewahrungsfrist: found.frist || p.aufbewahrungsfrist }));
  };
  const selectedFrist = gesetzlicheAufbewahrungsfristen.find((item) => item.key === (form.fristKategorie || "frei")) || gesetzlicheAufbewahrungsfristen[0];
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
      <PageHeader title="Aufgaben & Maßnahmenplan" desc="Compliance-Aufgaben, Fristen und Verantwortlichkeiten"
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
  const applyFristKategorie = (value: string) => {
    const found = gesetzlicheAufbewahrungsfristen.find((item) => item.key === value);
    if (!found) return set("fristKategorie", value);
    setForm((p: any) => ({ ...p, fristKategorie: value, gesetzlicheFrist: found.referenzen?.[0] || found.label, aufbewahrungsfrist: found.frist || p.aufbewahrungsfrist }));
  };
  const selectedFrist = gesetzlicheAufbewahrungsfristen.find((item) => item.key === (form.fristKategorie || "frei")) || gesetzlicheAufbewahrungsfristen[0];
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
        <PageHeader title="KI-Tools & Compliance" desc="Erfassung des KI-Einsatzes nach DSGVO und KI-VO" />
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

function WebDatenschutzPage() {
  const { data: dokumente, create, update } = useModuleData("dokumente");
  const { toast } = useToast();
  const websitePrivacy = dokumente.find((d: any) => d.kategorie === "prozessbeschreibung" && d.dokumentTyp === "web_datenschutz_check");
  const companyNotice = dokumente.find((d: any) => d.kategorie === "prozessbeschreibung" && d.dokumentTyp === "datenschutzhinweise_check");

  const parseJson = (raw: string | null | undefined, fallback: any) => {
    if (!raw) return fallback;
    try { return JSON.parse(raw); } catch { return fallback; }
  };

  const [websiteForm, setWebsiteForm] = useState<any>({
    consentTool: false,
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
      status: websiteForm.consentTool && websiteForm.datenschutzerklaerungGeprueft && websiteForm.impressumGeprueft ? "aktiv" : "entwurf",
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

  const websiteChecks = [websiteForm.consentTool, websiteForm.datenschutzerklaerungGeprueft, websiteForm.impressumGeprueft];
  const websiteDone = websiteChecks.filter(Boolean).length;
  const websiteStatus = websiteDone === websiteChecks.length ? { label: "Vollständig", cls: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" } : websiteDone > 0 ? { label: "Teilweise", cls: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30" } : { label: "Offen", cls: "bg-red-500/15 text-red-400 border-red-500/30" };
  const selectedGroupCount = Object.values(noticeForm.groups || {}).filter(Boolean).length;
  const noticeDistributionCount = [noticeForm.distributionEmail, noticeForm.distributionQr, noticeForm.websiteSubpage].filter(Boolean).length;
  const noticeStatus = selectedGroupCount > 0 && noticeDistributionCount > 0 ? { label: "Vollständig", cls: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" } : selectedGroupCount > 0 || noticeDistributionCount > 0 ? { label: "Teilweise", cls: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30" } : { label: "Offen", cls: "bg-red-500/15 text-red-400 border-red-500/30" };

  return (
    <MandantGuard>
      <div className="space-y-6">
        <PageHeader title="Web-Datenschutz" desc="Prüfung von Datenschutzerklärung, Impressum und Datenschutzhinweisen" />

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
            <label className="flex items-center gap-2 rounded-lg border p-3 cursor-pointer hover:bg-secondary/30"><input type="checkbox" checked={!!websiteForm.consentTool} onChange={e => setWebsite("consentTool", e.target.checked)} className="rounded" /><span>Consent-Tool vorhanden und geprüft</span></label>
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
      <PageHeader title="Dokumente & Vorlagen" desc="Datenschutzdokumente und Vorlagen des Mandanten"
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
  const emptyForm = {
    name: "", rechtsform: "", anschrift: "", branche: "", branchen: [], webseite: "", notizen: "", gruppenOrganisation: false, gruppeId: "none",
    dsb: "", dsbEmail: "", dsbTelefon: "",
    verantwortlicherName: "", verantwortlicherEmail: "", verantwortlicherTelefon: "",
    datenschutzmanagerName: "", datenschutzmanagerEmail: "", datenschutzmanagerTelefon: "",
    itVerantwortlicherName: "", itVerantwortlicherEmail: "", itVerantwortlicherTelefon: "",
    isbName: "", isbEmail: "", isbTelefon: "",
    webseitenbetreuerName: "", webseitenbetreuerEmail: "", webseitenbetreuerTelefon: "",
  };
  const [form, setForm] = useState<any>(emptyForm);
  const { toast } = useToast();
  const set = (k: string, v: any) => setForm((p: any) => ({ ...p, [k]: v }));
  const applyFristKategorie = (value: string) => {
    const found = gesetzlicheAufbewahrungsfristen.find((item) => item.key === value);
    if (!found) return set("fristKategorie", value);
    setForm((p: any) => ({ ...p, fristKategorie: value, gesetzlicheFrist: found.referenzen?.[0] || found.label, aufbewahrungsfrist: found.frist || p.aufbewahrungsfrist }));
  };
  const selectedFrist = gesetzlicheAufbewahrungsfristen.find((item) => item.key === (form.fristKategorie || "frei")) || gesetzlicheAufbewahrungsfristen[0];

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
      <PageHeader title="Mandantenverwaltung" desc="Alle Mandanten der Plattform verwalten"
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
                  {m.isbName && <p className="text-xs text-muted-foreground">ISB: {m.isbName}</p>}
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
              <div className="space-y-1"><Label className="text-xs">Hauptbranche</Label><Input value={form.branche} onChange={e => set("branche", e.target.value)} className="h-8 text-sm" /></div>
        <div className="space-y-1"><Label className="text-xs">Weitere Branchen</Label><Input value={Array.isArray(form.branchen) ? form.branchen.join(", ") : ""} onChange={e => set("branchen", e.target.value.split(",").map(v => v.trim()).filter(Boolean))} className="h-8 text-sm" placeholder="z. B. Handel, SaaS, Gesundheit" /></div>
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

                <div className="col-span-3 text-xs font-semibold text-muted-foreground pt-2">Informationssicherheitsbeauftragter</div>
                <div className="space-y-1"><Label className="text-xs">Name</Label><Input value={form.isbName} onChange={e => set("isbName", e.target.value)} className="h-8 text-sm" /></div>
                <div className="space-y-1"><Label className="text-xs">E-Mail</Label><Input type="email" value={form.isbEmail} onChange={e => set("isbEmail", e.target.value)} className="h-8 text-sm" /></div>
                <div className="space-y-1"><Label className="text-xs">Telefon</Label><Input value={form.isbTelefon} onChange={e => set("isbTelefon", e.target.value)} className="h-8 text-sm" /></div>

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
      <PageHeader title="Mandantengruppen" desc="Konzern-, Holding- und Standortstrukturen verwalten"
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
      <PageHeader title="Vorlagenpakete" desc="Standardpakete für Aufgaben, Leitlinien und Dokumente verwalten"
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
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "user", mandantIds: "[]" });
  const { toast } = useToast();
  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

  const openNew = () => { setForm({ name: "", email: "", password: "", role: "user", mandantIds: "[]" }); setModal("new"); };
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

  return (
    <div>
      <PageHeader title="Benutzerverwaltung" desc="Benutzer, Rollen und Mandantenzugänge verwalten"
        action={<Button size="sm" className="bg-primary h-8 text-xs gap-1.5" onClick={openNew}><Plus className="h-3.5 w-3.5" />Neuer Benutzer</Button>} />
      {isLoading ? <Skeleton className="h-32 w-full" /> : (
        <div className="space-y-2">
          {users.map((u: any) => (
            <Card key={u.id} className="group hover:border-border/80 transition-colors">
              <CardContent className="py-3 px-4 flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center sm:gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-7 h-7 rounded-full bg-primary/15 flex items-center justify-center text-xs font-bold text-primary shrink-0">{u.name.charAt(0)}</div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{u.name}</p>
                    <p className="text-xs text-muted-foreground">{u.email} · {u.role === "admin" ? "Administrator" : u.role === "dsb" ? "DSB" : "Nutzer"}</p>
                  </div>
                </div>
                <div className="flex w-full items-center justify-between gap-2 shrink-0 sm:w-auto sm:justify-end">
                  <Badge variant="outline" className="text-xs">{u.role}</Badge>
                  <button onClick={() => openEdit(u)} className="p-1 rounded text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-all"><Pencil className="h-3.5 w-3.5" /></button>
                  <button onClick={() => setDelId(u.id)} className="p-1 rounded text-muted-foreground hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"><Trash2 className="h-3.5 w-3.5" /></button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      <Dialog open={!!modal} onOpenChange={o => !o && setModal(null)}>
        <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{modal === "new" ? "Neuer Benutzer" : "Benutzer bearbeiten"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="col-span-2 space-y-1"><Label className="text-xs">Name *</Label><Input value={form.name} onChange={e => set("name", e.target.value)} className="h-8 text-sm" /></div>
              <div className="col-span-2 space-y-1"><Label className="text-xs">E-Mail *</Label><Input type="email" value={form.email} onChange={e => set("email", e.target.value)} className="h-8 text-sm" /></div>
              <div className="col-span-2 space-y-1"><Label className="text-xs">{modal === "new" ? "Passwort *" : "Passwort (leer = unverändert)"}</Label><Input type="password" value={form.password} onChange={e => set("password", e.target.value)} className="h-8 text-sm" placeholder="Min. 8 Zeichen" /></div>
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
            <span className="font-mono">1.0.0</span>
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
    </div>
  );
}

// ─── EXPORT PAGE (Druckansicht-Auswahl) ──────────────────────────────────────
const EXPORT_MODULES = [
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
          Export &amp; Druck
        </h1>
        <p className="text-sm text-muted-foreground">
          Wähle die Module aus, die in der Druckansicht erscheinen sollen.
          Die Ansicht öffnet sich als neue Seite und kann direkt gedruckt oder als PDF gespeichert werden.
        </p>
      </div>

      {/* Mandanten-Info */}
      <Card>
        <CardHeader className="pb-3 pt-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              <Building2 className="h-4 w-4 text-primary" />
              Mandant
            </CardTitle>
            <Badge variant="outline">{mandant?.name ?? "—"}</Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-0 text-xs text-muted-foreground space-y-1">
          <p>{mandant?.rechtsform || "—"}{mandant?.branche ? ` · ${mandant.branche}` : ""}</p>
          <p>Gruppe: {gruppen.find((g: any) => g.id === mandant?.gruppeId)?.name || "—"}</p>
          <p>Verantwortlicher: {mandant?.verantwortlicherName || "—"}</p>
          <p>Webseite: {mandant?.webseite || "—"}</p>
          <p>Logs im Export: {logs.length}</p>
        </CardContent>
      </Card>

      {/* Modulauswahl */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">Module auswählen</CardTitle>
            <button
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              onClick={() => allSel ? setSelected(new Set()) : setSelected(new Set(EXPORT_MODULES.map((m) => m.key)))}
            >
              {allSel ? "Alle abwählen" : "Alle auswählen"}
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
          {selected.size} von {EXPORT_MODULES.length} Modulen ausgewählt
        </p>
        <Button onClick={handlePrint} disabled={selected.size === 0} className="gap-2">
          <Printer className="h-4 w-4" />
          Druckansicht öffnen
        </Button>
      </div>
    </div>
  );
}

function MandantenExtrasPage() {
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
        <PageHeader title="Mandanten-Extras" desc="Vorlagenpakete anwenden und Änderungen nachverfolgen" />

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
    const hasISB = !!mandant?.isbName;
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
    { label: "ISB vorhanden", ok: !!mandant?.isbName },
    { label: "Wenig offene Aufgaben", ok: (stats?.offeneAufgaben ?? 0) <= 3 },
  ];

  return (
    <MandantGuard>
      <div className="space-y-6">
        <PageHeader title="Mandanten-Übersicht" desc="Stammdaten, Rollen und Compliance-Status des aktiven Mandanten" />
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
              ["ISB", !!mandant?.isbName],
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
                <p>ISB: {mandant?.isbName || "—"}</p>
                <p>Kontakt: {mandant?.isbEmail || "—"}{mandant?.isbTelefon ? ` · ${mandant.isbTelefon}` : ""}</p>
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
  const { token } = useAuth();
  const [activeMandantId, setActiveMandantId] = useState<number | null>(() => {
    const stored = localStorage.getItem("privashield_active_mandant_id");
    return stored ? Number(stored) : null;
  });

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

  return (
    <MandantCtx.Provider value={{ activeMandantId, setActiveMandantId }}>
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
          <Route path="/ki-compliance" component={KiCompliancePage} />
          <Route path="/extras" component={MandantenExtrasPage} />
          <Route path="/mandanten" component={MandantenPage} />
          <Route path="/gruppen" component={GruppenPage} />
          <Route path="/vorlagenpakete" component={VorlagenpaketePage} />
          <Route path="/benutzer" component={BenutzerPage} />
          <Route path="/system" component={SystemPage} />
          <Route path="/export" component={ExportPage} />
        </Switch>
      </Layout>
    </MandantCtx.Provider>
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
