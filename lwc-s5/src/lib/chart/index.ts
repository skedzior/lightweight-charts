// Main components
export { default as Chart } from './Chart.svelte';
export { default as Series } from './Series.svelte';
export { default as CustomSeries } from './CustomSeries.svelte';
export { default as SeriesPlugin } from './SeriesPlugin.svelte';
export { default as PanePlugin } from './PanePlugin.svelte';
export { default as SeriesMarkers } from './SeriesMarkers.svelte';

// Types
export type {
	ChartProps,
	SeriesProps,
	SeriesPluginProps,
	PanePluginProps,
	ChartContext,
	SeriesContext
} from './types';

export {
	CHART_CONTEXT_KEY,
	SERIES_CONTEXT_KEY
} from './types';

// Re-export commonly used types from lightweight-charts
export type {
	IChartApi,
	ISeriesApi,
	SeriesType,
	SeriesOptionsMap,
	SeriesDataItemTypeMap,
	ChartOptions,
	DeepPartial,
	Time,
	ISeriesPrimitiveBase,
	IPanePrimitiveBase,
	SeriesMarker,
	SeriesMarkerShape,
	SeriesMarkerPosition
} from 'lightweight-charts';

// Re-export marker creation function
export { createSeriesMarkers } from 'lightweight-charts';
