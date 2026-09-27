<script lang="ts">
	import { enhance } from '$app/forms';
	let { form } = $props();
</script>

<div class="login-wrap">
	<div class="card">
		<h1>Console sign in</h1>
		<p class="sub">Admin access to the RBAC platform.</p>
		<form method="POST" use:enhance>
			<div style="margin-bottom:0.8rem">
				<label for="email">Email</label>
				<input id="email" name="email" type="email" value={form?.email ?? ''} required />
			</div>
			<div style="margin-bottom:1rem">
				<label for="password">Password</label>
				<input id="password" name="password" type="password" required />
			</div>
			<button type="submit" style="width:100%">Sign in</button>
			{#if form?.error}
				<p class="error">{form.error}</p>
			{/if}
		</form>
		<p class="muted" style="font-size:0.78rem; margin-top:1rem">
			Users are managed in PocketBase. Create the first superuser at
			<span class="mono">/_/</span> on the PocketBase admin UI, then add a console user.
		</p>
	</div>
</div>
