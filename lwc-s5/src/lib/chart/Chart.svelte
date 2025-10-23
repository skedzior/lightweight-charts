<script lang="ts">
	import { onMount, setContext } from 'svelte';
	import { createChart, type IChartApi } from 'lightweight-charts';
	import type { ChartProps, ChartContext } from './types';
	import { CHART_CONTEXT_KEY } from './types';

	let {
		options = $bindable({}),
		width = '100%',
		height = 400,
		autoResize = true,
		onCreate,
		onDestroy,
		children
	}: ChartProps & { children?: any } = $props();

	// Reactive state
	let chartContainer: HTMLDivElement | undefined = $state();
	let chart: IChartApi | undefined = $state();
	let resizeObserver: ResizeObserver | undefined = $state();

	// Provide chart context to children
	setContext<ChartContext>(CHART_CONTEXT_KEY, {
		getChart: () => chart
	});

	// Initialize chart on mount
	onMount(() => {
		if (!chartContainer) return;

		// Create chart
		chart = createChart(chartContainer, options);

		// Call onCreate callback
		onCreate?.(chart);

		// Setup auto-resize if enabled
		if (autoResize) {
			resizeObserver = new ResizeObserver((entries) => {
				if (!chart || !entries.length) return;

				const { width, height } = entries[0].contentRect;
				chart.applyOptions({
					width: Math.floor(width),
					height: Math.floor(height)
				});
			});

			resizeObserver.observe(chartContainer);
		}

		// Cleanup function
		return () => {
			resizeObserver?.disconnect();
			chart?.remove();
			onDestroy?.();
			chart = undefined;
		};
	});

	// Reactively update chart options when they change
	$effect(() => {
		if (chart && options) {
			chart.applyOptions(options);
		}
	});

	// Handle explicit width/height changes
	$effect(() => {
		if (chart && !autoResize) {
			const numWidth = typeof width === 'number' ? width : undefined;
			const numHeight = typeof height === 'number' ? height : undefined;

			if (numWidth !== undefined || numHeight !== undefined) {
				chart.applyOptions({
					...(numWidth !== undefined && { width: numWidth }),
					...(numHeight !== undefined && { height: numHeight })
				});
			}
		}
	});

	// Computed styles for container
	const containerStyle = $derived.by(() => {
		const styles: Record<string, string> = {
			position: 'relative'
		};

		if (!autoResize) {
			if (typeof width === 'number') {
				styles.width = `${width}px`;
			} else {
				styles.width = width;
			}

			if (typeof height === 'number') {
				styles.height = `${height}px`;
			} else {
				styles.height = height;
			}
		} else {
			styles.width = typeof width === 'number' ? `${width}px` : width;
			styles.height = typeof height === 'number' ? `${height}px` : height;
		}

		return Object.entries(styles)
			.map(([key, value]) => `${key}: ${value}`)
			.join('; ');
	});
</script>

<div
	bind:this={chartContainer}
	style={containerStyle}
	class="lwc-chart-container"
>
	{#if chart}
		{@render children?.()}
	{/if}
</div>

<style>
	.lwc-chart-container {
		display: block;
		box-sizing: border-box;
	}

	:global(.lwc-chart-container > *) {
		position: absolute;
		inset: 0;
	}
</style>
