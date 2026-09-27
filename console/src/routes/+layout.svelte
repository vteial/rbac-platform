<script lang="ts">
	import '../app.css';
	let { children, data } = $props();
</script>

<div class="app">
	<header>
		<a class="brand" href="/">RBAC Platform</a>
		<nav>
			{#if data?.user}
				<a href="/">Tenants</a>
				<span class="who">{data.user.email}</span>
				<form method="POST" action="/logout" style="display:inline">
					<button class="link" type="submit">Log out</button>
				</form>
			{/if}
		</nav>
	</header>
	<main>
		{@render children()}
	</main>
	<footer>
		Self-hosted multi-tenant RBAC · OpenFGA + PocketBase + SvelteKit
	</footer>
</div>
