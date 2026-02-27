import fs from 'fs/promises';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'db.json');

export async function readDb() {
  try {
    const data = await fs.readFile(DB_PATH, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    return { users: [], agentSettings: {}, projects: {} };
  }
}

export async function writeDb(data: any) {
  await fs.writeFile(DB_PATH, JSON.stringify(data, null, 2));
}

export async function saveAgentSettings(userId: string, settings: any) {
  const db = await readDb();
  db.agentSettings[userId] = settings;
  await writeDb(db);
}

export async function getAgentSettings(userId: string) {
  const db = await readDb();
  return db.agentSettings[userId] || null;
}

export async function getProjects(userId: string) {
  const db = await readDb();
  return db.projects[userId] || [];
}

export async function saveProject(userId: string, project: any) {
  const db = await readDb();
  if (!db.projects[userId]) {
    db.projects[userId] = [];
  }
  
  const index = db.projects[userId].findIndex((p: any) => p.id === project.id);
  if (index >= 0) {
    db.projects[userId][index] = { ...db.projects[userId][index], ...project };
  } else {
    db.projects[userId].push(project);
  }
  
  await writeDb(db);
}
