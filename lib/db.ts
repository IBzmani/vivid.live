import fs from 'fs/promises';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'db.json');

export async function readDb() {
  try {
    const data = await fs.readFile(DB_PATH, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    return { users: [], agentSettings: {} };
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
