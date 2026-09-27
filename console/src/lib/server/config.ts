/**
 * Server-only configuration. Never import this from client code — it reads
 * secrets from the environment (OpenFGA token, session secret, etc).
 */
import { env } from '$env/dynamic/private';

export const config = {
	openfga: {
		apiUrl: env.OPENFGA_API_URL ?? 'http://localhost:8080',
		/** Optional preshared bearer token. Empty => no auth (local demo only). */
		apiToken: env.OPENFGA_API_TOKEN ?? ''
	},
	pocketbase: {
		url: env.POCKETBASE_URL ?? 'http://localhost:8090'
	},
	session: {
		secret: env.CONSOLE_SESSION_SECRET ?? 'dev-only-insecure-secret',
		cookieName: 'rbac_console_session'
	}
};
