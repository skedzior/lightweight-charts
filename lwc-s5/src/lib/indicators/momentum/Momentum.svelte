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
		calculateMomentumIndicatorValues,
		type MomentumCalculationOptions,
		type SupportedData
	} from './momentum-calculation';

	interface MomentumProps<T extends SeriesType> {
		/**
		 * The source series to calculate momentum from
		 */
		series: ISeriesApi<T>;
		/**
		 * Calculation options for the momentum indicator
		 */
		options: MomentumCalculationOptions;
		/**
		 * Optional series options for styling the momentum line
		 */
		seriesOptions?: DeepPartial<LineSeriesOptions>;
		/**
		 * Optional pane index to place the indicator (defaults to separate pane)
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
	}: MomentumProps<T> = $props();

	// Get chart from context
	const chartContext = getContext<ChartContext>(CHART_CONTEXT_KEY);

	if (!chartContext) {
		throw new Error('Momentum must be used within a Chart component');
	}

	let indicatorSeries: ISeriesApi<'Line'> | undefined = $state();

	// Function to update the indicator data
	function updateData() {
		if (!series || !indicatorSeries) return;

		const seriesData = series.data() as SupportedData[];
		const indicatorValues = calculateMomentumIndicatorValues(
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
				color: 'rgba(255, 152, 0, 1)',
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
