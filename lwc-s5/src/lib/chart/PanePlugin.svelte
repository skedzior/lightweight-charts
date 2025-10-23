<script lang="ts">
	import { onMount, getContext } from 'svelte';
	import type { PanePluginProps, ChartContext } from './types';
	import { CHART_CONTEXT_KEY } from './types';

	let {
		primitive,
		onAttach,
		onDetach
	}: PanePluginProps = $props();

	// Get chart from context
	const chartContext = getContext<ChartContext>(CHART_CONTEXT_KEY);

	if (!chartContext) {
		throw new Error('PanePlugin must be used within a Chart component');
	}

	// Attach plugin on mount
	onMount(() => {
		const chart = chartContext.getChart();
		if (!chart) {
			console.error('Chart not yet initialized');
			return;
		}

		// Attach primitive to the main pane of the chart
		const panes = chart.panes();
		if (panes.length === 0) {
			console.error('No panes available to attach primitive');
			return;
		}

		// Attach to the first (main) pane
		const mainPane = panes[0];
		mainPane.attachPrimitive(primitive);
		onAttach?.();

		// Cleanup function
		return () => {
			if (mainPane && primitive) {
				mainPane.detachPrimitive(primitive);
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
