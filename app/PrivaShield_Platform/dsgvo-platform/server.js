const express = require("express");
const lowdb = require("lowdb");
const FileSync = require("file-sync");
const app = express();
app.use(express.json());

// Datenbank initialisieren
const dbPath = "/data/privashield.json";
const adapter = new FileSync(dbPath);
const db = lowdb(dbPath);
db.defaults({"privashield": {"mandanten": [], "vorlagen": [], "gruppen": []}}).write();

// API für Tasks/TODOs und Logs
app.get("/api/mandanten/:id/tasks", async (req, res) => {
  const data = await db.read();
  const tasks = data.privashield.mandanten.find(m => m.id === parseInt(req.params.id))?.tasks || [];
  res.json(tasks);
});

app.post("/api/mandanten/:id/tasks", async (req, res) => {
  const newTask = req.body;
  const mandantIndex = db.get("privashield.mandanten").findIndex(m => m.id === parseInt(req.params.id));
  if (mandantIndex !== -1) {
    const data = await db.read();
    data.privashield.mandanten[mandantIndex].tasks.push(newTask);
    await db.write();
    res.status(201).json({ message: "Task erstellt", task: newTask });
  } else {
    res.status(404).json({ error: "Mandant nicht gefunden" });
  }
});

app.put("/api/mandanten/:id/tasks/:task_id", async (req, res) => {
  const updatedTask = req.body;
  const mandantIndex = db.get("privashield.mandanten").findIndex(m => m.id === parseInt(req.params.id));
  if (mandantIndex !== -1) {
    const data = await db.read();
    const taskIndex = data.privashield.mandanten[mandantIndex].tasks.findIndex(t => t.id === parseInt(req.params.task_id));
    if (taskIndex !== -1) {
      data.privashield.mandanten[mandantIndex].tasks[taskIndex] = updatedTask;
      await db.write();
      res.json({ message: "Task aktualisiert", task: updatedTask });
    } else {
      res.status(404).json({ error: "Task nicht gefunden" });
    }
  } else {
    res.status(404).json({ error: "Mandant nicht gefunden" });
  }
});

app.get("/api/mandanten/:id/todos", async (req, res) => {
  const data = await db.read();
  const todos = data.privashield.mandanten.find(m => m.id === parseInt(req.params.id))?.todos || [];
  res.json(todos);
});

app.post("/api/mandanten/:id/todos", async (req, res) => {
  const newTodo = req.body;
  const mandantIndex = db.get("privashield.mandanten").findIndex(m => m.id === parseInt(req.params.id));
  if (mandantIndex !== -1) {
    const data = await db.read();
    data.privashield.mandanten[mandantIndex].todos.push(newTodo);
    await db.write();
    res.status(201).json({ message: "Todo erstellt", todo: newTodo });
  } else {
    res.status(404).json({ error: "Mandant nicht gefunden" });
  }
});

app.get("/api/mandanten/:id/logs", async (req, res) => {
  const data = await db.read();
  const logs = data.privashield.mandanten.find(m => m.id === parseInt(req.params.id))?.logs || [];
  res.json(logs);
});

app.post("/api/mandanten/:id/logs", async (req, res) => {
  const logEntry = req.body;
  const mandantIndex = db.get("privashield.mandanten").findIndex(m => m.id === parseInt(req.params.id));
  if (mandantIndex !== -1) {
    const data = await db.read();
    data.privashield.mandanten[mandantIndex].logs.push(logEntry);
    await db.write();
    res.status(201).json({ message: "Log hinzugefügt", log: logEntry });
  } else {
    res.status(404).json({ error: "Mandant nicht gefunden" });
  }
});

// API für Vorlagen
app.get("/api/vorlagen", async (req, res) => {
  const data = await db.read();
  res.json(data.privashield.vorlagen);
});

app.post("/api/mandanten/:id/vorlagen", async (req, res) => {
  const vorlageId = req.body.id;
  const mandantIndex = db.get("privashield.mandanten").findIndex(m => m.id === parseInt(req.params.id));
  if (mandantIndex !== -1) {
    const data = await db.read();
    data.privashield.mandanten[mandantIndex].vorlageId = vorlageId;
    await db.write();
    res.json({ message: "Vorlage zugewiesen", vorlageId });
  } else {
    res.status(404).json({ error: "Mandant nicht gefunden" });
  }
});

// API für Gruppen
app.get("/api/gruppen", async (req, res) => {
  const data = await db.read();
  res.json(data.privashield.gruppen);
});

app.post("/api/mandanten/:id/groups", async (req, res) => {
  const groupId = req.body.id;
  const mandantIndex = db.get("privashield.mandanten").findIndex(m => m.id === parseInt(req.params.id));
  if (mandantIndex !== -1) {
    const data = await db.read();
    data.privashield.mandanten[mandantIndex].groups.push({ group_id: groupId });
    await db.write();
    res.json({ message: "Gruppe zugewiesen", groupId });
  } else {
    res.status(404).json({ error: "Mandant nicht gefunden" });
  }
});

// Start des Servers
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server läuft auf http://localhost:${PORT}`);
});