<script lang="ts">
	import { enhance } from '$app/forms';
	let { data, form } = $props();
</script>

<h1>Tenants</h1>
<p class="sub">Each tenant is an isolated client organization with its own role vocabulary.</p>

<div class="card">
	<h2 style="margin-top:0">Onboard a new tenant</h2>
	<form method="POST" action="?/create" use:enhance class="row">
		<div class="grow">
			<label for="name">Organization name</label>
			<input id="name" name="name" placeholder="e.g. Client A" required />
		</div>
		<div style="align-self:end">
			<button type="submit">Create tenant</button>
		</div>
	</form>
	{#if form?.created}
		<p class="notice">Created tenant “{form.created}”.</p>
	{/if}
	{#if form?.error}
		<p class="error">{form.error}</p>
	{/if}
</div>

<div class="card">
	<h2 style="margin-top:0">All tenants ({data.tenants.length})</h2>
	{#if data.tenants.length === 0}
		<p class="muted">No tenants yet. Create one above, or run <span class="mono">just seed-local-demo</span>.</p>
	{:else}
		<div class="table-wrap">
			<table>
				<thead>
					<tr><th>Name</th><th>Store ID</th><th></th></tr>
				</thead>
				<tbody>
					{#each data.tenants as t (t.id)}
						<tr>
							<td>{t.name}</td>
							<td class="mono muted">{t.id}</td>
							<td style="text-align:right">
								<a href={`/tenants/${t.id}`}><button class="secondary">Manage</button></a>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{/if}
</div>
