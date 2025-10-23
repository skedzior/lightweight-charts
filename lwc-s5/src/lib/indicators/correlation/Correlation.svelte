<script lang="ts" generics="T extends SeriesType, U extends SeriesType">
	import { getContext, onMount } from 'svelte';
	import {
		type ISeriesApi,
		type SeriesType,
		type DeepPartial,
		type BaselineSeriesOptions,
		BaselineSeries
	} from 'lightweight-charts';
	import type { ChartContext } from '$lib/chart/types';
	import { CHART_CONTEXT_KEY } from '$lib/chart/types';
	import {
		calculateCorrelationIndicatorValues,
		type CorrelationCalculationOptions,
		type SupportedData
	} from './correlation-calculation';

	interface CorrelationProps<T extends SeriesType, U extends SeriesType> {
		/**
		 * The primary source series
		 */
		primarySeries: ISeriesApi<T>;
		/**
		 * The secondary source series to correlate with
		 */
		secondarySeries: ISeriesApi<U>;
		/**
		 * Calculation options for the correlation indicator
		 */
		options: CorrelationCalculationOptions<any, any>;
		/**
		 * Optional series options for styling the correlation baseline
		 */
		seriesOptions?: DeepPartial<BaselineSeriesOptions>;
		/**
		 * Optional pane index to place the indicator (defaults to separate pane)
		 */
		paneIndex?: number;
		/**
		 * Callback when the indicator series is created
		 */
		onCreate?: (indicatorSeries: ISeriesApi<'Baseline'>) => void;
	}

	let {
		primarySeries,
		secondarySeries,
		options = $bindable(),
		seriesOptions = {},
		paneIndex,
		onCreate
	}: CorrelationProps<T, U> = $props();

	// Get chart from context
	const chartContext = getContext<ChartContext>(CHART_CONTEXT_KEY);

	if (!chartContext) {
		throw new Error('Correlation must be used within a Chart component');
	}

	let indicatorSeries: ISeriesApi<'Baseline'> | undefined = $state();

	// Function to update the indicator data
	function updateData() {
		if (!primarySeries || !secondarySeries || !indicatorSeries) return;

		const primaryData = primarySeries.data() as SupportedData[];
		const secondaryData = secondarySeries.data() as SupportedData[];
		const indicatorValues = calculateCorrelationIndicatorValues(
			primaryData,
			secondaryData,
			options
		);
		indicatorSeries.setData(indicatorValues);
	}

	// Initialize indicator on mount
	onMount(() => {
		const chart = chartContext.getChart();
		if (!chart || !primarySeries || !secondarySeries) {
			console.error('Chart or series not initialized');
			return;
		}

		// Create indicator series with baseline at 0
		indicatorSeries = chart.addSeries(
			BaselineSeries,
			{
				baseValue: { type: 'price', price: 0 },
				topLineColor: 'rgba(38, 166, 154, 1)',
				topFillColor1: 'rgba(38, 166, 154, 0.28)',
				topFillColor2: 'rgba(38, 166, 154, 0.05)',
				bottomLineColor: 'rgba(239, 83, 80, 1)',
				bottomFillColor1: 'rgba(239, 83, 80, 0.05)',
				bottomFillColor2: 'rgba(239, 83, 80, 0.28)',
				...seriesOptions
			},
			paneIndex
		) as ISeriesApi<'Baseline'>;

		// Subscribe to both series data changes
		primarySeries.subscribeDataChanged(updateData);
		secondarySeries.subscribeDataChanged(updateData);

		// Initial data calculation
		updateData();

		// Call onCreate callback
		onCreate?.(indicatorSeries);

		// Cleanup
		return () => {
			if (primarySeries) {
				primarySeries.unsubscribeDataChanged(updateData);
			}
			if (secondarySeries) {
				secondarySeries.unsubscribeDataChanged(updateData);
			}
			if (indicatorSeries && chart) {
				chart.removeSeries(indicatorSeries);
			}
			indicatorSeries = undefined;
		};
	});

	// Reactively update when options change
	$effect(() => {
		if (options) {
			updateData();
		}
	});

	// Reactively update series styling
	$effect(() => {
		if (indicatorSeries && seriesOptions) {
			indicatorSeries.applyOptions(seriesOptions as any);
		}
	});

	// Export function to get the indicator series API
	export function getIndicatorSeries() {
		return indicatorSeries;
	}
</script>
