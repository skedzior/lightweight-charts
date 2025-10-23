<script lang="ts">
	import { onMount, getContext } from 'svelte';
	import { createSeriesMarkers, type SeriesMarker, type DeepPartial } from 'lightweight-charts';
	import type { SeriesContext } from './types';
	import { SERIES_CONTEXT_KEY } from './types';

	interface SeriesMarkersOptions {
		// Add options type if needed from lightweight-charts docs
	}

	interface SeriesMarkersProps<TimeType = any> {
		/**
		 * Array of markers to display on the series
		 */
		markers?: SeriesMarker<TimeType>[];

		/**
		 * Options for the markers plugin
		 */
		options?: DeepPartial<SeriesMarkersOptions>;

		/**
		 * Callback when markers are attached
		 */
		onAttach?: () => void;

		/**
		 * Callback when markers are detached
		 */
		onDetach?: () => void;
	}

	let {
		markers = $bindable([]),
		options = {},
		onAttach,
		onDetach
	}: SeriesMarkersProps = $props();

	// Get series from context
	const seriesContext = getContext<SeriesContext>(SERIES_CONTEXT_KEY);

	if (!seriesContext) {
		throw new Error('SeriesMarkers must be used within a Series component');
	}

	// Markers plugin API
	let markersPlugin: ReturnType<typeof createSeriesMarkers> | undefined = $state();

	// Attach markers plugin on mount
	onMount(() => {
		const series = seriesContext.getSeries();
		if (!series) {
			console.error('Series not yet initialized');
			return;
		}

		// Create markers plugin
		markersPlugin = createSeriesMarkers(series, markers, options);
		onAttach?.();

		// Cleanup function
		return () => {
			if (markersPlugin) {
				markersPlugin.detach();
			}
			onDetach?.();
			markersPlugin = undefined;
		};
	});

	// Reactively update markers when they change
	$effect(() => {
		if (markersPlugin && markers) {
			markersPlugin.setMarkers(markers);
		}
	});

	// Reactively update options when they change
	$effect(() => {
		if (markersPlugin && options) {
			markersPlugin.applyOptions?.(options);
		}
	});

	// Export methods for parent component access
	export function getMarkersPlugin() {
		return markersPlugin;
	}

	export function setMarkers(newMarkers: SeriesMarker[]) {
		markersPlugin?.setMarkers(newMarkers);
	}

	export function getMarkers() {
		return markersPlugin?.markers() ?? [];
	}
</script>
