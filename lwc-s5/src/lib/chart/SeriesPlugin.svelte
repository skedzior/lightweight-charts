<script lang="ts">
	import { onMount, getContext } from 'svelte';
	import type { Time } from 'lightweight-charts';
	import type { SeriesPluginProps, SeriesContext } from './types';
	import { SERIES_CONTEXT_KEY } from './types';

	let {
		primitive,
		onAttach,
		onDetach
	}: SeriesPluginProps<Time> = $props();

	// Get series from context
	const seriesContext = getContext<SeriesContext>(SERIES_CONTEXT_KEY);

	if (!seriesContext) {
		throw new Error('SeriesPlugin must be used within a Series component');
	}

	// Attach plugin on mount
	onMount(() => {
		const series = seriesContext.getSeries();
		if (!series) {
			console.error('Series not yet initialized');
			return;
		}

		// Attach primitive to series
		series.attachPrimitive(primitive);
		onAttach?.();

		// Cleanup function
		return () => {
			if (series && primitive) {
				series.detachPrimitive(primitive);
			}
			onDetach?.();
		};
	});

	// Reactively update primitive when it changes (if mutable)
	$effect(() => {
		// If the primitive has a requestUpdate method and it changes,
		// we can trigger an update
		if (primitive && 'requestUpdate' in primitive && typeof primitive.requestUpdate === 'function') {
			primitive.requestUpdate();
		}
	});
</script>
