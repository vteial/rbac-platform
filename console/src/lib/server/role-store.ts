/**
 * Lightweight per-tenant persistence of role *definitions* (the friendly
 * label + the permissions each role grants).
 *
 * OpenFGA stores the authorization model + tuples, but the human-friendly
 * editing metadata (labels, the working draft of a role list) is convenient to
 * keep alongside. For this minimal starter we persist it to a small JSON file.
 * In production you'd move this into PocketBase or Postgres — the interface
 * below is the only thing callers depend on, so swapping the backend is easy.
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { existsSync } from 'node:fs';
import type { RoleDefinition } from './model-builder';

const DATA_DIR = process.env.CONSOLE_DATA_DIR ?? join(process.cwd(), '.data');
const FILE = join(DATA_DIR, 'roles.json');

type Db = Record<string, RoleDefinition[]>; // storeId -> roles

async function readDb(): Promise<Db> {
	if (!existsSync(FILE)) return {};
	try {
		return JSON.parse(await readFile(FILE, 'utf8')) as Db;
	} catch {
		return {};
	}
}

async function writeDb(db: Db): Promise<void> {
	await mkdir(dirname(FILE), { recursive: true });
	await writeFile(FILE, JSON.stringify(db, null, 2), 'utf8');
}

export async function getRoles(storeId: string): Promise<RoleDefinition[]> {
	const db = await readDb();
	return db[storeId] ?? [];
}

export async function setRoles(storeId: string, roles: RoleDefinition[]): Promise<void> {
	const db = await readDb();
	db[storeId] = roles;
	await writeDb(db);
}

export async function upsertRole(storeId: string, role: RoleDefinition): Promise<RoleDefinition[]> {
	const roles = await getRoles(storeId);
	const idx = roles.findIndex((r) => r.name === role.name);
	if (idx >= 0) roles[idx] = role;
	else roles.push(role);
	await setRoles(storeId, roles);
	return roles;
}

export async function deleteRole(storeId: string, roleName: string): Promise<RoleDefinition[]> {
	const roles = (await getRoles(storeId)).filter((r) => r.name !== roleName);
	await setRoles(storeId, roles);
	return roles;
}
