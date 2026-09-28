<script lang="ts">
	import { enhance } from '$app/forms';
	let { data, form } = $props();

	let email = $state('');
	let password = $state('');

	// Repopulate the email after a failed submit (form is set by the action).
	$effect(() => {
		if (form?.email) email = form.email;
	});

	function fillDemo() {
		if (!data.demo) return;
		email = data.demo.email;
		password = data.demo.password;
	}
</script>

<div class="login-wrap">
	<div class="card">
		<h1>Console sign in</h1>
		<p class="sub">Admin access to the RBAC platform.</p>
		<form method="POST" use:enhance>
			<div style="margin-bottom:0.8rem">
				<label for="email">Email</label>
				<input id="email" name="email" type="email" bind:value={email} required />
			</div>
			<div style="margin-bottom:1rem">
				<label for="password">Password</label>
				<input id="password" name="password" type="password" bind:value={password} required />
			</div>
			<button type="submit" style="width:100%">Sign in</button>
			{#if form?.error}
				<p class="error">{form.error}</p>
			{/if}
		</form>

		{#if data.demo}
			<div class="demo-hint">
				<span class="pill">demo mode</span>
				<button type="button" class="link" onclick={fillDemo}>Fill demo credentials</button>
			</div>
		{/if}

		<p class="muted" style="font-size:0.78rem; margin-top:1rem">
			Users are managed in PocketBase. Create the first superuser at
			<span class="mono">/_/</span> on the PocketBase admin UI, then add a console user
			(or run <span class="mono">just setup-console-user</span>).
		</p>
	</div>
</div>

<style>
	.demo-hint {
		display: flex; align-items: center; gap: 0.5rem;
		margin-top: 0.9rem; padding-top: 0.9rem;
		border-top: 1px solid var(--color-border);
	}
	.demo-hint button.link { color: var(--color-accent); font-weight: 600; }
</style>
