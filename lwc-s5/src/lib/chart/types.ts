import type {
	IChartApi,
	ISeriesApi,
	SeriesType,
	SeriesOptionsMap,
	SeriesDataItemTypeMap,
	DeepPartial,
	ChartOptions,
	Time,
	ISeriesPrimitiveBase,
	IPanePrimitiveBase,
} from 'lightweight-charts';

/**
 * Props for the Chart component
 */
export interface ChartProps {
	/**
	 * Chart options for initial configuration and updates
	 */
	options?: DeepPartial<ChartOptions>;

	/**
	 * Width of the chart container (optional, defaults to 100%)
	 */
	width?: number | string;

	/**
	 * Height of the chart container (optional, defaults to 400px)
	 */
	height?: number | string;

	/**
	 * Whether to auto-resize when window resizes
	 */
	autoResize?: boolean;

	/**
	 * Callback when chart is created
	 */
	onCreate?: (chart: IChartApi) => void;

	/**
	 * Callback when chart is destroyed
	 */
	onDestroy?: () => void;
}

/**
 * Props for the Series component
 */
export interface SeriesProps<T extends SeriesType> {
	/**
	 * Type of series to create
	 */
	type: T;

	/**
	 * Initial data for the series
	 */
	data?: SeriesDataItemTypeMap[T][];

	/**
	 * Options for the series
	 */
	options?: DeepPartial<SeriesOptionsMap[T]>;

	/**
	 * Reactive data - when this changes, the series updates
	 */
	reactiveData?: SeriesDataItemTypeMap[T][];

	/**
	 * Pane index to create the series in (optional, defaults to 0)
	 */
	paneIndex?: number;

	/**
	 * Callback when series is created
	 */
	onCreate?: (series: ISeriesApi<T>) => void;

	/**
	 * Callback when series is destroyed
	 */
	onDestroy?: () => void;
}

/**
 * Props for series primitives (plugins attached to series)
 */
export interface SeriesPluginProps<TTime extends Time = Time> {
	/**
	 * The primitive instance to attach
	 */
	primitive: ISeriesPrimitiveBase<TTime>;

	/**
	 * Callback when primitive is attached
	 */
	onAttach?: () => void;

	/**
	 * Callback when primitive is detached
	 */
	onDetach?: () => void;
}

/**
 * Props for pane primitives (plugins attached to panes)
 */
export interface PanePluginProps {
	/**
	 * The primitive instance to attach
	 */
	primitive: IPanePrimitiveBase;

	/**
	 * Callback when primitive is attached
	 */
	onAttach?: () => void;

	/**
	 * Callback when primitive is detached
	 */
	onDetach?: () => void;
}

/**
 * Context key for chart instance
 */
export const CHART_CONTEXT_KEY = Symbol('lightweight-chart');

/**
 * Context key for series instance
 */
export const SERIES_CONTEXT_KEY = Symbol('lightweight-series');

/**
 * Chart context type
 */
export interface ChartContext {
	getChart: () => IChartApi | undefined;
}

/**
 * Series context type
 */
export interface SeriesContext<T extends SeriesType = SeriesType> {
	getSeries: () => ISeriesApi<T> | undefined;
}
