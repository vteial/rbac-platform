<script lang="ts">
	import { enhance } from '$app/forms';
	let { data, form } = $props();

	const permissionOptions = $derived(
		Array.from(new Set(data.roles.flatMap((r) => r.permissions))).sort()
	);
</script>

<p><a href="/" class="muted">← All tenants</a></p>
<h1>{data.tenant.name}</h1>
<p class="sub mono">store: {data.tenant.id}</p>

<!-- ── Roles ─────────────────────────────────────────────────────── -->
<div class="card">
	<h2 style="margin-top:0">Roles &amp; permissions</h2>
	<p class="muted" style="margin-top:-0.25rem">
		This tenant's own vocabulary. Saving publishes a new OpenFGA authorization model.
	</p>

	{#if data.roles.length === 0}
		<p class="muted">No roles defined yet.</p>
	{:else}
		<table>
			<thead><tr><th>Role</th><th>Grants</th><th></th></tr></thead>
			<tbody>
				{#each data.roles as role (role.name)}
					<tr>
						<td>
							<strong>{role.label ?? role.name}</strong>
							<div class="mono muted" style="font-size:0.78rem">{role.name}</div>
						</td>
						<td>
							{#each role.permissions as p}<span class="pill perm">{p}</span>{/each}
						</td>
						<td style="text-align:right">
							<form method="POST" action="?/removeRole" use:enhance style="display:inline">
								<input type="hidden" name="name" value={role.name} />
								<button class="link" type="submit">remove</button>
							</form>
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	{/if}

	<h2>Add / update a role</h2>
	<form method="POST" action="?/saveRole" use:enhance>
		<div class="row">
			<div class="grow">
				<label for="label">Display label</label>
				<input id="label" name="label" placeholder="e.g. Platform Engineer" />
			</div>
			<div class="grow">
				<label for="name">Role name (machine)</label>
				<input id="name" name="name" placeholder="e.g. platform_engineer" required />
			</div>
		</div>
		<div style="margin-top:0.6rem">
			<label for="permissions">Permissions (comma-separated)</label>
			<input id="permissions" name="permissions" placeholder="e.g. read, write, deploy" required />
		</div>
		<div style="margin-top:0.8rem">
			<button type="submit">Save role &amp; publish</button>
		</div>
	</form>
	{#if form?.saved}<p class="notice">Saved role “{form.saved}” and published model.</p>{/if}
	{#if form?.removed}<p class="notice">Removed role “{form.removed}”.</p>{/if}
	{#if form?.error}<p class="error">{form.error}</p>{/if}
</div>

<!-- ── Assignments ───────────────────────────────────────────────── -->
<div class="card">
	<h2 style="margin-top:0">User → role assignments</h2>
	<form method="POST" action="?/assign" use:enhance class="row">
		<div class="grow">
			<label for="userId">User ID</label>
			<input id="userId" name="userId" placeholder="e.g. alice" required />
		</div>
		<div class="grow">
			<label for="roleName">Role</label>
			<select id="roleName" name="roleName" required>
				{#each data.roles as r}<option value={r.name}>{r.label ?? r.name}</option>{/each}
			</select>
		</div>
		<div style="align-self:end"><button type="submit">Assign</button></div>
	</form>
	{#if form?.assigned}<p class="notice">Assigned {form.assigned}.</p>{/if}
	{#if form?.unassigned}<p class="notice">Unassigned {form.unassigned}.</p>{/if}

	{#if data.assignments.length > 0}
		<table style="margin-top:0.8rem">
			<thead><tr><th>User</th><th>Role</th><th></th></tr></thead>
			<tbody>
				{#each data.assignments as a (a.userId + a.roleName)}
					<tr>
						<td class="mono">{a.userId}</td>
						<td>{a.roleName}</td>
						<td style="text-align:right">
							<form method="POST" action="?/unassign" use:enhance style="display:inline">
								<input type="hidden" name="userId" value={a.userId} />
								<input type="hidden" name="roleName" value={a.roleName} />
								<button class="link" type="submit">unassign</button>
							</form>
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	{/if}
</div>

<!-- ── Test a check ──────────────────────────────────────────────── -->
<div class="card">
	<h2 style="margin-top:0">Test a check</h2>
	<p class="muted" style="margin-top:-0.25rem">
		The runtime question your clients' systems ask: “can this user do this?”
	</p>
	<form method="POST" action="?/check" use:enhance>
		<div class="row">
			<div class="grow">
				<label for="c-user">User ID</label>
				<input id="c-user" name="userId" placeholder="e.g. alice" required />
			</div>
			<div class="grow">
				<label for="c-perm">Permission</label>
				<input id="c-perm" name="permission" list="perms" placeholder="e.g. deploy" required />
				<datalist id="perms">
					{#each permissionOptions as p}<option value={p}></option>{/each}
				</datalist>
			</div>
		</div>
		<div class="row" style="margin-top:0.6rem">
			<div class="grow">
				<label for="c-rtype">Resource type</label>
				<input id="c-rtype" name="resourceType" value="resource" />
			</div>
			<div class="grow">
				<label for="c-rid">Resource ID (blank = tenant-wide)</label>
				<input id="c-rid" name="resourceId" placeholder="* (all)" />
			</div>
			<div style="align-self:end"><button type="submit">Check</button></div>
		</div>
	</form>

	{#if form?.check}
		<div class="result {form.check.allowed ? 'allow' : 'deny'}" style="margin-top:1rem">
			{form.check.allowed ? '✅ ALLOWED' : '⛔ DENIED'} —
			<span class="mono">
				user:{form.check.userId} · {form.check.permission} ·
				{form.check.resourceType}:{form.check.resourceId}
			</span>
		</div>
	{/if}
	{#if form?.checkError}<p class="error">{form.checkError}</p>{/if}
</div>
