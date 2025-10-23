<script lang="ts" generics="T extends SeriesType">
	import { getContext, onMount } from 'svelte';
	import {
		type ISeriesApi,
		type SeriesType,
		type DeepPartial,
		type LineSeriesOptions,
		LineSeries
	} from 'lightweight-charts';
	import type { ChartContext } from '$lib/chart/types';
	import { CHART_CONTEXT_KEY } from '$lib/chart/types';
	import {
		calculateMovingAverageIndicatorValues,
		type MovingAverageCalculationOptions,
		type SupportedData
	} from './moving-average-calculation';

	interface MovingAverageProps<T extends SeriesType> {
		/**
		 * The source series to calculate the moving average from
		 */
		series: ISeriesApi<T>;
		/**
		 * Calculation options for the moving average
		 */
		options: MovingAverageCalculationOptions<any>;
		/**
		 * Optional series options for styling the MA line
		 */
		seriesOptions?: DeepPartial<LineSeriesOptions>;
		/**
		 * Optional pane index to place the indicator (defaults to same pane as source)
		 */
		paneIndex?: number;
		/**
		 * Callback when the indicator series is created
		 */
		onCreate?: (indicatorSeries: ISeriesApi<'Line'>) => void;
	}

	let {
		series,
		options = $bindable(),
		seriesOptions = {},
		paneIndex,
		onCreate
	}: MovingAverageProps<T> = $props();

	// Get chart from context
	const chartContext = getContext<ChartContext>(CHART_CONTEXT_KEY);

	if (!chartContext) {
		throw new Error('MovingAverage must be used within a Chart component');
	}

	let indicatorSeries: ISeriesApi<'Line'> | undefined = $state();

	// Function to update the indicator data
	function updateData() {
		if (!series || !indicatorSeries) return;

		const seriesData = series.data() as SupportedData[];
		const indicatorValues = calculateMovingAverageIndicatorValues(
			seriesData,
			options
		);
		indicatorSeries.setData(indicatorValues);
	}

	// Initialize indicator on mount
	onMount(() => {
		const chart = chartContext.getChart();
		if (!chart || !series) {
			console.error('Chart or series not initialized');
			return;
		}

		// Create indicator series
		indicatorSeries = chart.addSeries(
			LineSeries,
			{
				color: 'rgba(4, 111, 232, 1)',
				lineWidth: 2,
				...seriesOptions
			},
			paneIndex
		) as ISeriesApi<'Line'>;

		// Subscribe to source series data changes
		series.subscribeDataChanged(updateData);

		// Initial data calculation
		updateData();

		// Call onCreate callback
		onCreate?.(indicatorSeries);

		// Cleanup
		return () => {
			if (series) {
				series.unsubscribeDataChanged(updateData);
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
