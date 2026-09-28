<script lang="ts">
	import '../app.css';
	import ThemeSwitch from '$lib/ThemeSwitch.svelte';
	let { children, data } = $props();
</script>

<div class="app">
	<header>
		<div class="container">
			<a class="brand" href="/">RBAC Platform</a>
			<nav>
				{#if data?.user}
					<a href="/tenants">Tenants</a>
					<span class="who">{data.user.email}</span>
					<form method="POST" action="/logout" style="display:inline">
						<button class="link" type="submit">Log out</button>
					</form>
				{/if}
				<ThemeSwitch />
			</nav>
		</div>
	</header>
	<main class="container">
		{@render children()}
	</main>
	<footer>
		<div class="container">
			Self-hosted multi-tenant RBAC · OpenFGA + PocketBase + SvelteKit
		</div>
	</footer>
</div>
