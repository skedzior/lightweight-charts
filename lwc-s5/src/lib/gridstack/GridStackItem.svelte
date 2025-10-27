<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		x?: number;
		y?: number;
		w?: number;
		h?: number;
		id?: string;
		minW?: number;
		minH?: number;
		maxW?: number;
		maxH?: number;
		noResize?: boolean;
		noMove?: boolean;
		locked?: boolean;
		class?: string;
		children?: Snippet;
	}

	let {
		x,
		y,
		w = 1,
		h = 1,
		id,
		minW,
		minH,
		maxW,
		maxH,
		noResize = false,
		noMove = false,
		locked = false,
		class: className = '',
		children,
	}: Props = $props();

	// Build data attributes object
	const dataAttrs: Record<string, string | number | boolean | undefined> = {
		'gs-x': x,
		'gs-y': y,
		'gs-w': w,
		'gs-h': h,
		'gs-id': id,
		'gs-min-w': minW,
		'gs-min-h': minH,
		'gs-max-w': maxW,
		'gs-max-h': maxH,
		'gs-no-resize': noResize || undefined,
		'gs-no-move': noMove || undefined,
		'gs-locked': locked || undefined,
	};
</script>

<div class="grid-stack-item {className}" {...dataAttrs}>
	<div class="grid-stack-item-content">
		{#if children}
			{@render children()}
		{/if}
	</div>
</div>
