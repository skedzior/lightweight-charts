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
			console.log('🔴 SERIES CLEANUP STARTING', { type, paneIndex });

			if (chart && series) {
				// Store pane index before removing series
				const seriesPaneIndex = paneIndex;

				console.log('📊 Before removeSeries - panes:', chart.panes().length, 'panes:', chart.panes().map((p, i) => ({
					index: i,
					height: p.getHeight(),
					seriesCount: p.getSeries().length
				})));

				// Remove the series
				chart.removeSeries(series);

				console.log('📊 After removeSeries - panes:', chart.panes().length, 'panes:', chart.panes().map((p, i) => ({
					index: i,
					height: p.getHeight(),
					seriesCount: p.getSeries().length
				})));

				// Force chart to recalculate layout and remove empty panes
				// The chart should auto-remove empty panes, but we need to trigger a layout update
				requestAnimationFrame(() => {
					if (chart) {
						console.log('📊 In RAF - panes:', chart.panes().length);

						// Try to get the pane and check if it still exists but is empty
						try {
							const panes = chart.panes();
							console.log('🔍 Checking pane', seriesPaneIndex, 'total panes:', panes.length);

							if (seriesPaneIndex !== undefined && seriesPaneIndex < panes.length) {
								const pane = panes[seriesPaneIndex];
								const seriesInPane = pane.getSeries().length;
								console.log('🔍 Pane', seriesPaneIndex, 'has', seriesInPane, 'series');

								// If pane exists and has no series, explicitly remove it
								if (pane && seriesInPane === 0) {
									console.log('🗑️ Removing empty pane', seriesPaneIndex);
									chart.removePane(seriesPaneIndex);
									console.log('✅ After removePane - panes:', chart.panes().length);
								} else {
									console.log('⚠️ Pane not empty, skipping removal');
								}
							} else {
								console.log('⚠️ Pane index out of bounds or undefined');
							}
						} catch (e) {
							// Pane might have been auto-removed already, which is fine
							console.log('❌ Error checking/removing pane:', e);
						}

						console.log('📊 Final state - panes:', chart.panes().length);

						// AGGRESSIVE: Force multiple visual updates to ensure DOM is redrawn
						requestAnimationFrame(() => {
							if (chart) {
								console.log('🔥 FORCING VISUAL UPDATES');

								// 1. Force resize to trigger layout recalculation
								const container = chart.chartElement();
								if (container) {
									const width = container.clientWidth;
									const height = container.clientHeight;
									console.log('📐 Forcing resize:', { width, height });
									chart.resize(width, height, true);
								}

								// 2. Force time scale update
								const timeScale = chart.timeScale();
								const visibleRange = timeScale.getVisibleLogicalRange();
								if (visibleRange) {
									timeScale.setVisibleLogicalRange(visibleRange);
								}

								// 3. Try to force a full redraw by toggling options
								requestAnimationFrame(() => {
									if (chart) {
										console.log('🔥 Final RAF - applying options to force redraw');
										const currentOptions = chart.options();
										chart.applyOptions(currentOptions);
										console.log('✅ ALL VISUAL UPDATES COMPLETE');
									}
								});
							}
						});
					}
				});
			}
			onDestroy?.();
			series = undefined;
			console.log('✅ SERIES CLEANUP COMPLETE');
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
