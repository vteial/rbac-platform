/**
 * CLEAN state seed — the minimal master data that makes the platform usable so
 * you can drive the whole app flow BY HAND and build your own demo.
 *
 * One tenant, a small role vocabulary, and NO user assignments — you add users
 * and run checks yourself through the console to learn the flow.
 *
 * Run:  just seed-local     (or, raw:  OPENFGA_API_URL=http://localhost:8080 pnpm seed:local)
 */
import { banner, seedTenant, type TenantSeed } from './seed-core';

const CLEAN: TenantSeed = {
	name: 'Acme Inc',
	roles: [
		{ name: 'admin', label: 'Admin', permissions: ['read', 'write', 'manage'] },
		{ name: 'member', label: 'Member', permissions: ['read', 'write'] },
		{ name: 'viewer', label: 'Viewer', permissions: ['read'] }
	]
	// no assignments — add users by hand in the console to learn the flow
};

async function main() {
	banner('CLEAN state (one tenant, no users — drive it by hand)');
	await seedTenant(CLEAN);
	console.log(
		`\n✔ Clean seed complete. Open the console, add a user to a role, then use "test a check".`
	);
}

main().catch((err) => {
	console.error('\n✖ Seed failed:', err instanceof Error ? err.message : err);
	process.exit(1);
});
