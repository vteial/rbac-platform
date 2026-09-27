/**
 * PocketBase-backed authentication for the admin console.
 *
 * PocketBase protects *the console* (who may log in and onboard tenants).
 * It is unrelated to the RBAC data OpenFGA manages for the clients.
 */
import PocketBase from 'pocketbase';
import { config } from './config';

export function pbClient(): PocketBase {
	return new PocketBase(config.pocketbase.url);
}

export interface ConsoleUser {
	id: string;
	email: string;
	token: string;
}

/**
 * Authenticate a console operator against PocketBase's default `users`
 * collection. Returns the auth token to persist in the console session cookie.
 */
export async function login(email: string, password: string): Promise<ConsoleUser> {
	const pb = pbClient();
	const authData = await pb.collection('users').authWithPassword(email, password);
	return {
		id: authData.record.id,
		email: authData.record.email as string,
		token: pb.authStore.token
	};
}

/**
 * Validate a token previously issued by PocketBase. Returns the user if the
 * token is still valid, otherwise null.
 */
export async function validateToken(token: string): Promise<ConsoleUser | null> {
	if (!token) return null;
	const pb = pbClient();
	pb.authStore.save(token, null);
	if (!pb.authStore.isValid) return null;
	try {
		// Refresh confirms the token against the server and returns the record.
		const authData = await pb.collection('users').authRefresh();
		return {
			id: authData.record.id,
			email: authData.record.email as string,
			token: pb.authStore.token
		};
	} catch {
		return null;
	}
}
