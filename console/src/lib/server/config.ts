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
	},
	/**
	 * Demo mode — LOCAL/DEMO ONLY. When on, the login page offers a
	 * "Fill demo credentials" button so a presenter never fumbles the login.
	 * Gated by a flag so it can never ship to a real deployment by accident;
	 * the values are the same demo user `setup-console-user` creates.
	 */
	demo: {
		// NB: read server-side via $env/dynamic/private, so the flag must NOT be
		// PUBLIC_-prefixed (SvelteKit reserves PUBLIC_ for $env/dynamic/public and
		// strips it from the private env). DEMO_MODE keeps it server-side.
		enabled: (env.DEMO_MODE ?? 'false').toLowerCase() === 'true',
		email: env.CONSOLE_USER_EMAIL ?? 'demo@example.com',
		password: env.CONSOLE_USER_PASSWORD ?? 'demo123456'
	}
};
