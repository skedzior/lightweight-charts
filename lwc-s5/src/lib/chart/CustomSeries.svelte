<script lang="ts">
	import { onMount, getContext } from 'svelte';
	import type { ICustomSeriesPaneView, ISeriesApi, Time, DeepPartial } from 'lightweight-charts';
	import type { ChartContext } from './types';
	import { CHART_CONTEXT_KEY } from './types';

	interface CustomSeriesProps<TData, TOptions> {
		/**
		 * The custom series view implementation
		 */
		view: ICustomSeriesPaneView<Time, TData, TOptions>;

		/**
		 * Initial data for the custom series
		 */
		data?: TData[];

		/**
		 * Reactive data - when this changes, the series updates
		 */
		reactiveData?: TData[];

		/**
		 * Options for the custom series
		 */
		options?: DeepPartial<TOptions>;

		/**
		 * Callback when series is created
		 */
		onCreate?: (series: ISeriesApi<'Custom'>) => void;

		/**
		 * Callback when series is destroyed
		 */
		onDestroy?: () => void;

		/**
		 * Children (for plugins)
		 */
		children?: any;
	}

	let {
		view,
		data = [],
		options = $bindable({}),
		reactiveData = $bindable([]),
		onCreate,
		onDestroy,
		children
	}: CustomSeriesProps<any, any> = $props();

	// Get chart from context
	const chartContext = getContext<ChartContext>(CHART_CONTEXT_KEY);

	if (!chartContext) {
		throw new Error('CustomSeries must be used within a Chart component');
	}

	// Reactive state
	let series: ISeriesApi<'Custom'> | undefined = $state();

	// Initialize custom series on mount
	onMount(() => {
		const chart = chartContext.getChart();
		if (!chart) {
			console.error('Chart not yet initialized');
			return;
		}

		// Create custom series
		series = chart.addCustomSeries(view, options);

		// Set initial data
		if (data.length > 0) {
			series.setData(data);
		}

		// Call onCreate callback
		onCreate?.(series);

		// Cleanup function
		return () => {
			if (chart && series) {
				chart.removeSeries(series);
			}
			onDestroy?.();
			series = undefined;
		};
	});

	// Reactively update series options
	$effect(() => {
		if (series && options) {
			series.applyOptions(options as any);
		}
	});

	// Reactively update series data when reactiveData changes
	$effect(() => {
		if (series && reactiveData && reactiveData.length > 0) {
			series.setData(reactiveData);
		}
	});

	// Helper function to update a single data point
	export function update(dataPoint: any) {
		series?.update(dataPoint);
	}

	// Helper function to set all data
	export function setData(newData: any[]) {
		series?.setData(newData);
	}

	// Get the underlying series API
	export function getSeriesApi() {
		return series;
	}
</script>

{#if series}
	{@render children?.()}
{/if}
