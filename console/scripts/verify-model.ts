/**
 * Offline verification of the RBAC decision logic.
 *
 * This does NOT require a running OpenFGA server. It builds the same
 * authorization model the platform publishes, then evaluates permission
 * checks against it using the exact semantics OpenFGA applies for this
 * model shape (a permission is granted iff the user is the `assignee` of a
 * role bound to the resource that grants that permission).
 *
 * It's a fast, deterministic guard that the generated model + tuples yield
 * the correct allow/deny decisions.
 */
import {
	buildRbacModel,
	tenantWideRoleBindings,
	TENANT_WIDE_RESOURCE_ID,
	type RoleDefinition
} from '../src/lib/server/model-builder';

const TENANT_RESOURCE = `resource:${TENANT_WIDE_RESOURCE_ID}`;

type Tuple = { user: string; relation: string; object: string };

/** Minimal evaluator matching the model shape produced by buildRbacModel. */
function evaluate(
	roles: RoleDefinition[],
	tuples: Tuple[],
	q: { user: string; permission: string; object: string }
): boolean {
	const model = buildRbacModel(roles);
	const resourceType = model.type_definitions.find((t) => t.type === 'resource')!;
	const permRel = resourceType.relations?.[q.permission];
	if (!permRel) return false; // unknown permission => deny

	// Which role_* relations grant this permission (union children / single).
	const grantingRoleRelations: string[] = [];
	const collect = (u: { tupleToUserset?: { tupleset: { relation: string } }; union?: { child: unknown[] } }) => {
		if (u.tupleToUserset) grantingRoleRelations.push(u.tupleToUserset.tupleset.relation);
		if (u.union) for (const c of u.union.child) collect(c as never);
	};
	collect(permRel as never);

	// For each granting role relation on the target object, find the role object
	// bound (role_x  ->  role:<name>) then check user is assignee of that role.
	for (const rel of grantingRoleRelations) {
		const boundRoles = tuples
			.filter((t) => t.relation === rel && t.object === q.object && t.user.startsWith('role:'))
			.map((t) => t.user); // e.g. role:dev
		for (const roleObj of boundRoles) {
			const isAssignee = tuples.some(
				(t) => t.relation === 'assignee' && t.object === roleObj && t.user === q.user
			);
			if (isAssignee) return true;
		}
	}
	return false;
}

interface Case {
	tenant: string;
	roles: RoleDefinition[];
	assignments: Array<{ user: string; role: string }>;
	expect: Array<{ user: string; permission: string; allow: boolean }>;
}

const CASES: Case[] = [
	{
		tenant: 'Client A',
		roles: [
			{ name: 'parent', permissions: ['read', 'write', 'manage_children'] },
			{ name: 'child', permissions: ['read'] }
		],
		assignments: [
			{ user: 'anita', role: 'parent' },
			{ user: 'bala', role: 'child' }
		],
		expect: [
			{ user: 'anita', permission: 'manage_children', allow: true },
			{ user: 'anita', permission: 'read', allow: true },
			{ user: 'bala', permission: 'read', allow: true },
			{ user: 'bala', permission: 'write', allow: false },
			{ user: 'bala', permission: 'manage_children', allow: false }
		]
	},
	{
		tenant: 'Client B',
		roles: [
			{ name: 'dev', permissions: ['read', 'write'] },
			{ name: 'qa', permissions: ['read', 'test'] },
			{ name: 'platform_engineer', permissions: ['read', 'write', 'test', 'deploy'] }
		],
		assignments: [
			{ user: 'chandra', role: 'dev' },
			{ user: 'divya', role: 'qa' },
			{ user: 'esha', role: 'platform_engineer' }
		],
		expect: [
			{ user: 'esha', permission: 'deploy', allow: true },
			{ user: 'chandra', permission: 'deploy', allow: false },
			{ user: 'chandra', permission: 'write', allow: true },
			{ user: 'divya', permission: 'test', allow: true },
			{ user: 'divya', permission: 'write', allow: false },
			{ user: 'divya', permission: 'deploy', allow: false }
		]
	}
];

let failures = 0;
for (const c of CASES) {
	console.log(`\n▶ ${c.tenant}`);
	const tuples: Tuple[] = [
		...tenantWideRoleBindings(c.roles),
		...c.assignments.map((a) => ({
			user: `user:${a.user}`,
			relation: 'assignee',
			object: `role:${a.role}`
		}))
	];
	for (const e of c.expect) {
		const got = evaluate(c.roles, tuples, {
			user: `user:${e.user}`,
			permission: e.permission,
			object: TENANT_RESOURCE
		});
		const ok = got === e.allow;
		if (!ok) failures++;
		console.log(
			`   ${ok ? 'PASS' : 'FAIL'}  user:${e.user} "${e.permission}"  expected=${e.allow} got=${got}`
		);
	}
}

console.log(`\n${failures === 0 ? '✔ all checks passed' : `✖ ${failures} check(s) failed`}`);
process.exit(failures === 0 ? 0 : 1);
