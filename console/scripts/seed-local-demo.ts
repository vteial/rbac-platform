/**
 * DEMO state seed — the pre-baked showcase for a quick test-and-show.
 *
 * Two tenants with completely different role vocabularies, sample users, and
 * printed checks so the demo works out of the box:
 *   Client A → roles: parent, child
 *   Client B → roles: dev, qa, platform_engineer
 *
 * Run:  just seed-local-demo   (or, raw:  OPENFGA_API_URL=http://localhost:8080 pnpm seed:local:demo)
 */
import {
	banner,
	seedTenant,
	printSampleChecks,
	storeIdByName,
	type TenantSeed
} from './seed-core';

const DEMO: TenantSeed[] = [
	{
		name: 'Client A',
		roles: [
			{ name: 'parent', label: 'Parent', permissions: ['read', 'write', 'manage_children'] },
			{ name: 'child', label: 'Child', permissions: ['read'] }
		],
		assignments: [
			{ user: 'anita', role: 'parent' },
			{ user: 'bala', role: 'child' }
		]
	},
	{
		name: 'Client B',
		roles: [
			{ name: 'dev', label: 'Developer', permissions: ['read', 'write'] },
			{ name: 'qa', label: 'QA', permissions: ['read', 'test'] },
			{
				name: 'platform_engineer',
				label: 'Platform Engineer',
				permissions: ['read', 'write', 'test', 'deploy']
			}
		],
		assignments: [
			{ user: 'chandra', role: 'dev' },
			{ user: 'divya', role: 'qa' },
			{ user: 'esha', role: 'platform_engineer' }
		]
	}
];

async function main() {
	banner('DEMO state (Client A + Client B showcase)');
	for (const s of DEMO) {
		const modelId = await seedTenant(s);
		const storeId = await storeIdByName(s.name);
		await printSampleChecks(storeId, modelId, s.roles, s.assignments ?? []);
	}
	console.log('\n✔ Demo seed complete. Open the console to explore.');
}

main().catch((err) => {
	console.error('\n✖ Seed failed:', err instanceof Error ? err.message : err);
	process.exit(1);
});
