<script lang="ts">
	import { onMount } from 'svelte';
	import { getTheme, setTheme, type Theme } from './theme';

	let current = $state<Theme>('auto');

	onMount(() => {
		current = getTheme();
	});

	function choose(t: Theme) {
		current = t;
		setTheme(t);
	}

	const options: Array<{ value: Theme; label: string; icon: string }> = [
		{ value: 'auto', label: 'Auto', icon: '◐' },
		{ value: 'light', label: 'Light', icon: '☀' },
		{ value: 'dark', label: 'Dark', icon: '☾' }
	];
</script>

<div class="theme-switch" role="group" aria-label="Color theme">
	{#each options as o (o.value)}
		<button
			type="button"
			aria-pressed={current === o.value}
			title="{o.label} theme"
			onclick={() => choose(o.value)}
		>
			<span aria-hidden="true">{o.icon}</span>
			<span>{o.label}</span>
		</button>
	{/each}
</div>
