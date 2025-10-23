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

		if (!view) {
			console.error('CustomSeries requires a view prop');
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
				// Remove the series from the chart
				try {
					chart.removeSeries(series);
				} catch (e) {
					// Chart might already be disposed
					console.warn('Error removing custom series:', e);
				}

				// Force visual update using the same approach as Series.svelte
				requestAnimationFrame(() => {
					if (!chart) return;

					try {
						// Force resize to trigger layout recalculation
						const container = chart.chartElement();
						if (container) {
							chart.resize(container.clientWidth, container.clientHeight, true);
						}

						// Final RAF to ensure complete redraw
						requestAnimationFrame(() => {
							if (!chart) return;
							try {
								chart.applyOptions(chart.options());
							} catch (e) {
								// Chart might be disposed
							}
						});
					} catch (e) {
						// Chart might be disposed
					}
				});
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
	// Use $effect.pre to ensure data updates happen before rendering
	$effect.pre(() => {
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
