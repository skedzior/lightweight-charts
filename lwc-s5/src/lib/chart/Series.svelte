<script lang="ts" generics="T extends SeriesType">
	import { onMount, getContext, setContext } from 'svelte';
	import {
		type ISeriesApi,
		type SeriesType,
		CandlestickSeries,
		LineSeries,
		AreaSeries,
		BarSeries,
		HistogramSeries,
		BaselineSeries
	} from 'lightweight-charts';
	import type { SeriesProps, ChartContext, SeriesContext } from './types';
	import { CHART_CONTEXT_KEY, SERIES_CONTEXT_KEY } from './types';

	let {
		type,
		data = [],
		options = $bindable({}),
		reactiveData = $bindable([]),
		paneIndex,
		onCreate,
		onDestroy,
		children
	}: SeriesProps<T> & { children?: any } = $props();

	// Get chart from context
	const chartContext = getContext<ChartContext>(CHART_CONTEXT_KEY);

	if (!chartContext) {
		throw new Error('Series must be used within a Chart component');
	}

	// Reactive state
	let series: ISeriesApi<T> | undefined = $state();

	// Provide series context to children (for plugins)
	setContext<SeriesContext<T>>(SERIES_CONTEXT_KEY, {
		getSeries: () => series
	});

	// Map of series type to constructor
	const seriesTypeMap: Record<SeriesType, any> = {
		Candlestick: CandlestickSeries,
		Line: LineSeries,
		Area: AreaSeries,
		Bar: BarSeries,
		Histogram: HistogramSeries,
		Baseline: BaselineSeries
	};

	// Initialize series on mount
	onMount(() => {
		const chart = chartContext.getChart();
		if (!chart) {
			console.error('Chart not yet initialized');
			return;
		}

		// Create series based on type
		const seriesConstructor = seriesTypeMap[type];
		if (!seriesConstructor) {
			console.error(`Unknown series type: ${type}`);
			return;
		}

		// Add series with optional pane index (third parameter)
		series = chart.addSeries(seriesConstructor, options as any, paneIndex) as ISeriesApi<T>;

		// Set initial data
		if (data.length > 0) {
			series.setData(data);
		}

		// Call onCreate callback
		onCreate?.(series);

		// Cleanup function
		return () => {
			if (chart && series) {
				const seriesPaneIndex = paneIndex;

				// Remove the series from the chart
				chart.removeSeries(series);

				// Force visual update: The chart removes empty panes from the model,
				// but doesn't always update the DOM immediately. We use cascading
				// requestAnimationFrame calls to ensure the visual layout is recalculated.
				requestAnimationFrame(() => {
					if (!chart) return;

					// Check if pane is empty and explicitly remove it
					try {
						const panes = chart.panes();
						if (seriesPaneIndex !== undefined && seriesPaneIndex < panes.length) {
							const pane = panes[seriesPaneIndex];
							if (pane?.getSeries().length === 0) {
								chart.removePane(seriesPaneIndex);
							}
						}
					} catch (e) {
						// Pane might have been auto-removed already
					}

					// Force DOM update with cascading RAF
					requestAnimationFrame(() => {
						if (!chart) return;

						// Force resize to trigger layout recalculation
						const container = chart.chartElement();
						if (container) {
							chart.resize(container.clientWidth, container.clientHeight, true);
						}

						// Final RAF to ensure complete redraw
						requestAnimationFrame(() => {
							if (!chart) return;
							chart.applyOptions(chart.options());
						});
					});
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
