/**
 * Server hook = the console's authentication guard.
 *
 * On every request we read the PocketBase session token from the cookie,
 * validate it, and attach the user to `locals`. Unauthenticated requests to
 * anything except the login route and the public health check are redirected
 * to /login.
 */
import { redirect, type Handle } from '@sveltejs/kit';
import { config } from '$lib/server/config';
import { validateToken } from '$lib/server/pocketbase';

// Public routes: the landing page ('/'), login, and the health check.
// (Exact-match '/' so it doesn't make every path public.)
const PUBLIC_PREFIXES = ['/login', '/health'];
const PUBLIC_EXACT = ['/'];

export const handle: Handle = async ({ event, resolve }) => {
	const token = event.cookies.get(config.session.cookieName) ?? '';
	event.locals.user = await validateToken(token);

	const path = event.url.pathname;
	const isPublic =
		PUBLIC_EXACT.includes(path) ||
		PUBLIC_PREFIXES.some((p) => path === p || path.startsWith(p + '/'));

	if (!event.locals.user && !isPublic) {
		throw redirect(303, `/login?redirectTo=${encodeURIComponent(path)}`);
	}

	// Already logged in but sitting on /login -> send to the dashboard.
	if (event.locals.user && path === '/login') {
		throw redirect(303, '/tenants');
	}

	return resolve(event);
};
