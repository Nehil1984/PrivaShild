import type { Express, Request, Response, NextFunction } from "express";
import type { Server } from "http";
import { storage, reloadStorage } from "./storage";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { readDbBackend, writeDbBackend } from "./db-config";
import { clearLoginFailures, loginRateLimit, registerLoginFailure } from "./security";
import { validateBody } from "./validation";
import { insertAvvSchema, insertDatenpanneSchema, insertDokumentSchema, insertDsfaSchema, insertDsrSchema, insertMandantenGruppeSchema, insertMandantSchema, insertTomSchema, insertUserSchema, insertVorlagenpaketSchema, insertVvtSchema } from "@shared/schema";

const JWT_SECRET = process.env.JWT_SECRET;

// ─── Auth Middleware ──────────────────────────────────────────────────────────
function getJwtSecret(): string {
  if (!JWT_SECRET) {
    throw new Error("JWT_SECRET ist nicht gesetzt. Bitte sichere Umgebungsvariable konfigurieren.");
  }
  return JWT_SECRET;
}

function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const auth = req.headers.authorization;
  if (!auth?.startsWith("Bearer ")) return res.status(401).json({ message: "Nicht authentifiziert" });
  try {
    const payload = jwt.verify(auth.slice(7), getJwtSecret()) as unknown as { userId: number; role: string };
    (req as any).userId = payload.userId;
    (req as any).userRole = payload.role;
    next();
  } catch {
    res.status(401).json({ message: "Token ungültig" });
  }
}

function adminOnly(req: Request, res: Response, next: NextFunction) {
  if ((req as any).userRole !== "admin") return res.status(403).json({ message: "Nur für Administratoren" });
  next();
}

async function auditLog(event: {
  mandantId?: number | null;
  userId?: number | null;
  userName?: string;
  aktion: string;
  modul: string;
  entitaetTyp?: string;
  entitaetId?: number | null;
  beschreibung: string;
  details?: Record<string, unknown>;
}) {
  if (!event.mandantId) return;
  await storage.createMandantenLog({
    mandantId: event.mandantId,
    userId: event.userId ?? null,
    userName: event.userName,
    aktion: event.aktion,
    modul: event.modul,
    entitaetTyp: event.entitaetTyp,
    entitaetId: event.entitaetId ?? null,
    beschreibung: event.beschreibung,
    detailsJson: JSON.stringify(event.details || {}),
  });
}

async function getAllowedMandantIds(req: any): Promise<number[]> {
  if (req.userRole === "admin") {
    const all = await storage.getMandanten();
    return all.map((m) => m.id);
  }
  const user = await storage.getUserById(req.userId);
  try {
    return JSON.parse(user?.mandantIds || "[]");
  } catch {
    return [];
  }
}

async function canAccessMandant(req: any, mandantId: number): Promise<boolean> {
  if (req.userRole === "admin") return true;
  const ids = await getAllowedMandantIds(req);
  return ids.includes(mandantId);
}

async function requireMandantAccess(req: any, res: Response, mandantId: number): Promise<boolean> {
  if (await canAccessMandant(req, mandantId)) return true;
  res.status(403).json({ message: "Kein Zugriff auf diesen Mandanten" });
  return false;
}

async function requireEntityAccess(req: any, res: Response, item: any | undefined): Promise<boolean> {
  if (!item) {
    res.status(404).json({ message: "Nicht gefunden" });
    return false;
  }
  return requireMandantAccess(req, res, item.mandantId);
}

// Seed initial admin if no users exist
async function seedAdmin() {
  const all = await storage.getAllUsers();
  if (all.length > 0) return;

  const email = process.env.INITIAL_ADMIN_EMAIL;
  const password = process.env.INITIAL_ADMIN_PASSWORD;
  const name = process.env.INITIAL_ADMIN_NAME || "Administrator";

  if (!email || !password) {
    console.warn("Kein Initial-Admin erstellt: INITIAL_ADMIN_EMAIL und INITIAL_ADMIN_PASSWORD fehlen.");
    return;
  }

  await storage.createUser({
    email,
    password,
    name,
    role: "admin",
    mandantIds: "[]",
  });
  console.log(`Initialer Admin-Benutzer erstellt: ${email}`);
}

export async function registerRoutes(httpServer: Server, app: Express): Promise<Server> {
  await seedAdmin();

  getJwtSecret();

  // ─── AUTH ────────────────────────────────────────────────────────────────
  app.post("/api/auth/login", loginRateLimit, async (req, res) => {
    const { email, password } = req.body;
    const user = await storage.getUserByEmail(email);
    if (!user || !user.aktiv) {
      registerLoginFailure(req);
      return res.status(401).json({ message: "E-Mail oder Passwort falsch" });
    }
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      registerLoginFailure(req);
      await auditLog({
        mandantId: null,
        userId: user.id,
        userName: user.name,
        aktion: "login_fehlgeschlagen",
        modul: "auth",
        entitaetTyp: "user",
        entitaetId: user.id,
        beschreibung: "Fehlgeschlagener Login-Versuch",
        details: { email },
      });
      return res.status(401).json({ message: "E-Mail oder Passwort falsch" });
    }
    clearLoginFailures(req);
    const token = jwt.sign({ userId: user.id, role: user.role }, getJwtSecret(), { expiresIn: "8h" });
    const { passwordHash, ...safeUser } = user;
    await auditLog({
      mandantId: null,
      userId: user.id,
      userName: user.name,
      aktion: "login_erfolgreich",
      modul: "auth",
      entitaetTyp: "user",
      entitaetId: user.id,
      beschreibung: "Erfolgreicher Login",
      details: { email, role: user.role },
    });
    res.json({ token, user: safeUser });
  });

  app.get("/api/auth/me", authMiddleware, async (req: any, res) => {
    const user = await storage.getUserById(req.userId);
    if (!user) return res.status(404).json({ message: "Benutzer nicht gefunden" });
    const { passwordHash, ...safeUser } = user;
    res.json(safeUser);
  });

  // ─── BENUTZER (Admin only) ────────────────────────────────────────────────
  app.get("/api/users", authMiddleware, adminOnly, async (_req, res) => {
    const all = await storage.getAllUsers();
    res.json(all.map(({ passwordHash, ...u }) => u));
  });
  app.post("/api/users", authMiddleware, adminOnly, validateBody(insertUserSchema), async (req, res) => {
    try {
      const user = await storage.createUser(req.body);
      const { passwordHash, ...safe } = user;
      res.status(201).json(safe);
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });
  app.put("/api/users/:id", authMiddleware, adminOnly, async (req, res) => {
    const user = await storage.updateUser(Number(req.params.id), req.body);
    if (!user) return res.status(404).json({ message: "Nicht gefunden" });
    const { passwordHash, ...safe } = user;
    res.json(safe);
  });
  app.delete("/api/users/:id", authMiddleware, adminOnly, async (req, res) => {
    await storage.deleteUser(Number(req.params.id));
    res.json({ ok: true });
  });

  // ─── MANDANTEN ────────────────────────────────────────────────────────────
  app.get("/api/mandanten", authMiddleware, async (req: any, res) => {
    const all = await storage.getMandanten();
    if (req.userRole === "admin") return res.json(all);
    const user = await storage.getUserById(req.userId);
    const ids: number[] = JSON.parse(user?.mandantIds || "[]");
    res.json(all.filter((m) => ids.includes(m.id)));
  });
  app.get("/api/mandanten/:id", authMiddleware, async (req: any, res) => {
    const mandantId = Number(req.params.id);
    const m = await storage.getMandant(mandantId);
    if (!m) return res.status(404).json({ message: "Nicht gefunden" });
    if (!(await requireMandantAccess(req, res, mandantId))) return;
    res.json(m);
  });
  app.post("/api/mandanten", authMiddleware, adminOnly, validateBody(insertMandantSchema), async (req, res) => {
    const m = await storage.createMandant(req.body);
    res.status(201).json(m);
  });
  app.put("/api/mandanten/:id", authMiddleware, adminOnly, async (req, res) => {
    const m = await storage.updateMandant(Number(req.params.id), req.body);
    if (!m) return res.status(404).json({ message: "Nicht gefunden" });
    res.json(m);
  });
  app.delete("/api/mandanten/:id", authMiddleware, adminOnly, async (req, res) => {
    await storage.deleteMandant(Number(req.params.id));
    res.json({ ok: true });
  });

  app.get("/api/mandanten/:id/logs", authMiddleware, async (req: any, res) => {
    const mandantId = Number(req.params.id);
    if (!(await requireMandantAccess(req, res, mandantId))) return;
    const logs = await storage.getMandantenLogs(mandantId);
    res.json(logs);
  });

  app.get("/api/mandanten/:id/vorlagen-historie", authMiddleware, async (req: any, res) => {
    const mandantId = Number(req.params.id);
    if (!(await requireMandantAccess(req, res, mandantId))) return;
    const historie = await storage.getVorlagenpaketHistorie(mandantId);
    res.json(historie);
  });

  app.get("/api/mandanten-gruppen", authMiddleware, async (_req, res) => {
    res.json(await storage.getMandantenGruppen());
  });
  app.post("/api/mandanten-gruppen", authMiddleware, adminOnly, validateBody(insertMandantenGruppeSchema), async (req: any, res) => {
    const gruppe = await storage.createMandantenGruppe(req.body);
    await auditLog({
      mandantId: null,
      userId: req.userId,
      userName: (await storage.getUserById(req.userId))?.name,
      aktion: "mandantengruppe_erstellt",
      modul: "mandanten-gruppen",
      entitaetTyp: "mandantengruppe",
      entitaetId: gruppe.id,
      beschreibung: "Mandantengruppe wurde erstellt",
      details: gruppe,
    });
    res.status(201).json(gruppe);
  });
  app.put("/api/mandanten-gruppen/:id", authMiddleware, adminOnly, async (req, res) => {
    const gruppe = await storage.updateMandantenGruppe(Number(req.params.id), req.body);
    if (!gruppe) return res.status(404).json({ message: "Nicht gefunden" });
    res.json(gruppe);
  });
  app.delete("/api/mandanten-gruppen/:id", authMiddleware, adminOnly, async (req, res) => {
    await storage.deleteMandantenGruppe(Number(req.params.id));
    res.json({ ok: true });
  });

  app.get("/api/vorlagenpakete", authMiddleware, async (_req, res) => {
    res.json(await storage.getVorlagenpakete());
  });
  app.post("/api/vorlagenpakete", authMiddleware, adminOnly, validateBody(insertVorlagenpaketSchema), async (req: any, res) => {
    const paket = await storage.createVorlagenpaket(req.body);
    await auditLog({
      mandantId: null,
      userId: req.userId,
      userName: (await storage.getUserById(req.userId))?.name,
      aktion: "vorlagenpaket_erstellt",
      modul: "vorlagenpakete",
      entitaetTyp: "vorlagenpaket",
      entitaetId: paket.id,
      beschreibung: "Vorlagenpaket wurde erstellt",
      details: paket,
    });
    res.status(201).json(paket);
  });
  app.put("/api/vorlagenpakete/:id", authMiddleware, adminOnly, async (req, res) => {
    const paket = await storage.updateVorlagenpaket(Number(req.params.id), req.body);
    if (!paket) return res.status(404).json({ message: "Nicht gefunden" });
    res.json(paket);
  });
  app.delete("/api/vorlagenpakete/:id", authMiddleware, adminOnly, async (req, res) => {
    await storage.deleteVorlagenpaket(Number(req.params.id));
    res.json({ ok: true });
  });
  app.post("/api/mandanten/:id/vorlagenpakete/:paketId/apply", authMiddleware, async (req: any, res) => {
    const mandantId = Number(req.params.id);
    if (!(await requireMandantAccess(req, res, mandantId))) return;
    const result = await storage.applyVorlagenpaketToMandant(mandantId, Number(req.params.paketId), {
      id: req.userId,
      name: (await storage.getUserById(req.userId))?.name,
    });
    res.json(result);
  });

  app.post("/api/gruppen/:gruppenId/vorlagenpakete/:paketId/apply", authMiddleware, adminOnly, async (req: any, res) => {
    const gruppenId = Number(req.params.gruppenId);
    const paketId = Number(req.params.paketId);
    const mandanten = await storage.getMandanten();
    const targets = mandanten.filter((m) => m.gruppeId === gruppenId);
    const user = await storage.getUserById(req.userId);
    const results = [];
    for (const m of targets) {
      results.push({ mandantId: m.id, mandantName: m.name, ...(await storage.applyVorlagenpaketToMandant(m.id, paketId, { id: req.userId, name: user?.name })) });
    }
    res.json({ ok: true, count: results.length, results });
  });

  app.post("/api/mandanten/:mid/vvt", authMiddleware, validateBody(insertVvtSchema), async (req: any, res) => {
    const mandantId = Number(req.params.mid);
    if (!(await requireMandantAccess(req, res, mandantId))) return;
    const item = await storage.createVvt({ ...req.body, mandantId });
    const user = await storage.getUserById(req.userId);
    await storage.createMandantenLog({
      mandantId,
      userId: req.userId,
      userName: user?.name,
      aktion: `vvt_erstellt`,
      modul: "vvt",
      entitaetTyp: "vvt",
      entitaetId: item.id,
      beschreibung: `vvt wurde angelegt.`,
      detailsJson: JSON.stringify(item),
    });
    res.status(201).json(item);
  });

  app.post("/api/mandanten/:mid/avv", authMiddleware, validateBody(insertAvvSchema), async (req: any, res) => {
    const mandantId = Number(req.params.mid);
    if (!(await requireMandantAccess(req, res, mandantId))) return;
    const item = await storage.createAvv({ ...req.body, mandantId });
    const user = await storage.getUserById(req.userId);
    await storage.createMandantenLog({
      mandantId,
      userId: req.userId,
      userName: user?.name,
      aktion: `avv_erstellt`,
      modul: "avv",
      entitaetTyp: "avv",
      entitaetId: item.id,
      beschreibung: `avv wurde angelegt.`,
      detailsJson: JSON.stringify(item),
    });
    res.status(201).json(item);
  });

  app.post("/api/mandanten/:mid/dsfa", authMiddleware, validateBody(insertDsfaSchema), async (req: any, res) => {
    const mandantId = Number(req.params.mid);
    if (!(await requireMandantAccess(req, res, mandantId))) return;
    const item = await storage.createDsfa({ ...req.body, mandantId });
    const user = await storage.getUserById(req.userId);
    await storage.createMandantenLog({
      mandantId,
      userId: req.userId,
      userName: user?.name,
      aktion: `dsfa_erstellt`,
      modul: "dsfa",
      entitaetTyp: "dsfa",
      entitaetId: item.id,
      beschreibung: `dsfa wurde angelegt.`,
      detailsJson: JSON.stringify(item),
    });
    res.status(201).json(item);
  });

  app.post("/api/mandanten/:mid/datenpannen", authMiddleware, validateBody(insertDatenpanneSchema), async (req: any, res) => {
    const mandantId = Number(req.params.mid);
    if (!(await requireMandantAccess(req, res, mandantId))) return;
    const item = await storage.createDatenpanne({ ...req.body, mandantId });
    const user = await storage.getUserById(req.userId);
    await storage.createMandantenLog({
      mandantId,
      userId: req.userId,
      userName: user?.name,
      aktion: `datenpanne_erstellt`,
      modul: "datenpannen",
      entitaetTyp: "datenpanne",
      entitaetId: item.id,
      beschreibung: `datenpanne wurde angelegt.`,
      detailsJson: JSON.stringify(item),
    });
    res.status(201).json(item);
  });

  app.post("/api/mandanten/:mid/dsr", authMiddleware, validateBody(insertDsrSchema), async (req: any, res) => {
    const mandantId = Number(req.params.mid);
    if (!(await requireMandantAccess(req, res, mandantId))) return;
    const item = await storage.createDsr({ ...req.body, mandantId });
    const user = await storage.getUserById(req.userId);
    await storage.createMandantenLog({
      mandantId,
      userId: req.userId,
      userName: user?.name,
      aktion: `dsr_erstellt`,
      modul: "dsr",
      entitaetTyp: "dsr",
      entitaetId: item.id,
      beschreibung: `dsr wurde angelegt.`,
      detailsJson: JSON.stringify(item),
    });
    res.status(201).json(item);
  });

  app.post("/api/mandanten/:mid/tom", authMiddleware, validateBody(insertTomSchema), async (req: any, res) => {
    const mandantId = Number(req.params.mid);
    if (!(await requireMandantAccess(req, res, mandantId))) return;
    const item = await storage.createTom({ ...req.body, mandantId });
    const user = await storage.getUserById(req.userId);
    await storage.createMandantenLog({
      mandantId,
      userId: req.userId,
      userName: user?.name,
      aktion: `tom_erstellt`,
      modul: "tom",
      entitaetTyp: "tom",
      entitaetId: item.id,
      beschreibung: `tom wurde angelegt.`,
      detailsJson: JSON.stringify(item),
    });
    res.status(201).json(item);
  });

  app.post("/api/mandanten/:mid/dokumente", authMiddleware, validateBody(insertDokumentSchema), async (req: any, res) => {
    const mandantId = Number(req.params.mid);
    if (!(await requireMandantAccess(req, res, mandantId))) return;
    const item = await storage.createDokument({ ...req.body, mandantId });
    const user = await storage.getUserById(req.userId);
    await storage.createMandantenLog({
      mandantId,
      userId: req.userId,
      userName: user?.name,
      aktion: `dokument_erstellt`,
      modul: "dokumente",
      entitaetTyp: "dokument",
      entitaetId: item.id,
      beschreibung: `dokument wurde angelegt.`,
      detailsJson: JSON.stringify(item),
    });
    res.status(201).json(item);
  });

  // ─── STATS ────────────────────────────────────────────────────────────────
  app.get("/api/mandanten/:id/stats", authMiddleware, async (req: any, res) => {
    const mandantId = Number(req.params.id);
    if (!(await requireMandantAccess(req, res, mandantId))) return;
    const stats = await storage.getStatsForMandant(mandantId);
    res.json(stats);
  });

  // ─── GENERIC CRUD FACTORY ────────────────────────────────────────────────
  function crudRoutes(
    path: string,
    getAll: (mid: number) => Promise<any[]>,
    getOne: (id: number) => Promise<any>,
    create: (data: any) => Promise<any>,
    update: (id: number, data: any) => Promise<any>,
    remove: (id: number) => Promise<void>
  ) {
    app.get(`/api/mandanten/:mid/${path}`, authMiddleware, async (req: any, res) => {
      const mandantId = Number(req.params.mid);
      if (!(await requireMandantAccess(req, res, mandantId))) return;
      res.json(await getAll(mandantId));
    });
    app.get(`/api/${path}/:id`, authMiddleware, async (req: any, res) => {
      const item = await getOne(Number(req.params.id));
      if (!(await requireEntityAccess(req, res, item))) return;
      res.json(item);
    });
    app.post(`/api/mandanten/:mid/${path}`, authMiddleware, async (req: any, res) => {
      const mandantId = Number(req.params.mid);
      if (!(await requireMandantAccess(req, res, mandantId))) return;
      const item = await create({ ...req.body, mandantId });
      const user = await storage.getUserById(req.userId);
      await storage.createMandantenLog({
        mandantId,
        userId: req.userId,
        userName: user?.name,
        aktion: `${path}_erstellt`,
        modul: path,
        entitaetTyp: path,
        entitaetId: item.id,
        beschreibung: `${path} wurde angelegt.`,
        detailsJson: JSON.stringify(item),
      });
      res.status(201).json(item);
    });
    app.put(`/api/${path}/:id`, authMiddleware, async (req: any, res) => {
      const existing = await getOne(Number(req.params.id));
      if (!(await requireEntityAccess(req, res, existing))) return;
      const item = await update(Number(req.params.id), req.body);
      if (!item) return res.status(404).json({ message: "Nicht gefunden" });
      const user = await storage.getUserById(req.userId);
      await storage.createMandantenLog({
        mandantId: item.mandantId,
        userId: req.userId,
        userName: user?.name,
        aktion: `${path}_aktualisiert`,
        modul: path,
        entitaetTyp: path,
        entitaetId: item.id,
        beschreibung: `${path} wurde aktualisiert.`,
        detailsJson: JSON.stringify(item),
      });
      res.json(item);
    });
    app.delete(`/api/${path}/:id`, authMiddleware, async (req: any, res) => {
      const existing = await getOne(Number(req.params.id));
      if (!existing) return res.status(404).json({ message: "Nicht gefunden" });
      if (!(await requireEntityAccess(req, res, existing))) return;
      await remove(Number(req.params.id));
      const user = await storage.getUserById(req.userId);
      await storage.createMandantenLog({
        mandantId: existing.mandantId,
        userId: req.userId,
        userName: user?.name,
        aktion: `${path}_geloescht`,
        modul: path,
        entitaetTyp: path,
        entitaetId: existing.id,
        beschreibung: `${path} wurde gelöscht.`,
        detailsJson: JSON.stringify(existing),
      });
      res.json({ ok: true });
    });
  }

  crudRoutes("vvt", storage.getVvtByMandant.bind(storage), storage.getVvt.bind(storage), storage.createVvt.bind(storage), storage.updateVvt.bind(storage), storage.deleteVvt.bind(storage));
  crudRoutes("avv", storage.getAvvByMandant.bind(storage), storage.getAvv.bind(storage), storage.createAvv.bind(storage), storage.updateAvv.bind(storage), storage.deleteAvv.bind(storage));
  crudRoutes("dsfa", storage.getDsfaByMandant.bind(storage), storage.getDsfa.bind(storage), storage.createDsfa.bind(storage), storage.updateDsfa.bind(storage), storage.deleteDsfa.bind(storage));
  crudRoutes("datenpannen", storage.getDatenpannenByMandant.bind(storage), storage.getDatenpanne.bind(storage), storage.createDatenpanne.bind(storage), storage.updateDatenpanne.bind(storage), storage.deleteDatenpanne.bind(storage));
  crudRoutes("dsr", storage.getDsrByMandant.bind(storage), storage.getDsr.bind(storage), storage.createDsr.bind(storage), storage.updateDsr.bind(storage), storage.deleteDsr.bind(storage));
  crudRoutes("tom", storage.getTomByMandant.bind(storage), storage.getTom.bind(storage), storage.createTom.bind(storage), storage.updateTom.bind(storage), storage.deleteTom.bind(storage));
  crudRoutes("aufgaben", storage.getAufgabenByMandant.bind(storage), storage.getAufgabe.bind(storage), storage.createAufgabe.bind(storage), storage.updateAufgabe.bind(storage), storage.deleteAufgabe.bind(storage));
  crudRoutes("dokumente", storage.getDokumenteByMandant.bind(storage), storage.getDokument.bind(storage), storage.createDokument.bind(storage), storage.updateDokument.bind(storage), storage.deleteDokument.bind(storage));

  // ─── DB-BACKEND UMSCHALTER (Admin only) ─────────────────────────────────
  app.get("/api/admin/db-config", authMiddleware, adminOnly, (_req, res) => {
    res.json({ backend: readDbBackend() });
  });

  app.post("/api/admin/db-config", authMiddleware, adminOnly, (req: any, res) => {
    const { backend } = req.body;
    if (backend !== "lowdb" && backend !== "sqlite") {
      return res.status(400).json({ message: "Ungültiges Backend. Erlaubt: lowdb | sqlite" });
    }
    writeDbBackend(backend);
    reloadStorage();
    res.json({ ok: true, backend, message: `Backend auf '${backend}' umgestellt. Änderungen sofort aktiv.` });
  });

  return httpServer;
}
