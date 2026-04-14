export type Lang = "de" | "en";

export const messages = {
  de: {
    appName: "PrivaShield",
    dsmPlatform: "DSM-Plattform",
    tenant: "Mandant",
    selectTenant: "Mandant wählen...",
    administration: "Administration",
    administrator: "Administrator",
    user: "Nutzer",
    logout: "Abmelden",
    chooseTenantLeft: "Bitte wähle links einen Mandanten aus.",
    exportPrint: "Export / Druck",
    backups: "Backups",
    internalNotes: "Interne Notizen",
    dashboard: "Dashboard",
    overview: "Mandanten-Übersicht",
    darkMode: "Dark Mode",
    language: "Sprache",
    german: "Deutsch",
    english: "English",
  },
  en: {
    appName: "PrivaShield",
    dsmPlatform: "DSM Platform",
    tenant: "Tenant",
    selectTenant: "Select tenant...",
    administration: "Administration",
    administrator: "Administrator",
    user: "User",
    logout: "Log out",
    chooseTenantLeft: "Please select a tenant on the left.",
    exportPrint: "Export / Print",
    backups: "Backups",
    internalNotes: "Internal Notes",
    dashboard: "Dashboard",
    overview: "Tenant Overview",
    darkMode: "Dark mode",
    language: "Language",
    german: "German",
    english: "English",
  }
} as const;

export type MessageKey = keyof typeof messages.de;
