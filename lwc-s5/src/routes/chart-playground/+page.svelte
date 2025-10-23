<script lang="ts">
	import { Chart, Series, SeriesPlugin, SeriesMarkers, ObjectTree } from '$lib';
	import { TradeBubbles, type TradeBubblesData } from '$lib/plugins/trade-bubbles';
	import type {
		ChartOptions,
		CandlestickData,
		HistogramData,
		LineData,
		SeriesMarker,
		DeepPartial,
		IChartApi
	} from 'lightweight-charts';
	import { untrack } from 'svelte';

	// ===== DATA GENERATION =====
	function generateCandlestickData(): CandlestickData[] {
		const data: CandlestickData[] = [];
		const basePrice = 100;
		let time = Math.floor(Date.now() / 1000) - 200 * 86400;

		for (let i = 0; i < 200; i++) {
			const open = basePrice + Math.random() * 20 - 10 + Math.sin(i / 10) * 5;
			const close = open + Math.random() * 10 - 5;
			const high = Math.max(open, close) + Math.random() * 5;
			const low = Math.min(open, close) - Math.random() * 5;

			data.push({
				time: time as any,
				open,
				high,
				low,
				close
			});

			time += 86400;
		}

		return data;
	}

	function generateVolumeData(candleData: CandlestickData[]): HistogramData[] {
		return candleData.map((candle) => ({
			time: candle.time,
			value: Math.random() * 10000000 + 5000000,
			color: candle.close >= candle.open ? 'rgba(38, 166, 154, 0.5)' : 'rgba(239, 83, 80, 0.5)'
		}));
	}

	function generateRSIData(candleData: CandlestickData[]): LineData[] {
		return candleData.map((candle, i) => ({
			time: candle.time,
			value: 30 + Math.sin(i / 15) * 40 + Math.random() * 10
		}));
	}

	function generateMACDData(candleData: CandlestickData[]): LineData[] {
		return candleData.map((candle, i) => ({
			time: candle.time,
			value: Math.sin(i / 20) * 3 + Math.random() * 0.5
		}));
	}

	function generateMACDSignalData(candleData: CandlestickData[]): LineData[] {
		return candleData.map((candle, i) => ({
			time: candle.time,
			value: Math.sin(i / 20 + 0.5) * 3 + Math.random() * 0.3
		}));
	}

	function generateMACDHistogramData(candleData: CandlestickData[]): HistogramData[] {
		return candleData.map((candle, i) => {
			const macd = Math.sin(i / 20) * 3 + Math.random() * 0.5;
			const signal = Math.sin(i / 20 + 0.5) * 3 + Math.random() * 0.3;
			const value = macd - signal;
			return {
				time: candle.time,
				value,
				color: value >= 0 ? 'rgba(38, 166, 154, 0.5)' : 'rgba(239, 83, 80, 0.5)'
			};
		});
	}

	// ===== DATA STATE =====
	let chartData = $state(generateCandlestickData());
	let volumeData = $derived(generateVolumeData(chartData));
	let rsiData = $derived(generateRSIData(chartData));
	let macdData = $derived(generateMACDData(chartData));
	let macdSignalData = $derived(generateMACDSignalData(chartData));
	let macdHistogramData = $derived(generateMACDHistogramData(chartData));

	// ===== CHART OPTIONS =====
	let chartOptions: DeepPartial<ChartOptions> = {
		layout: {
			background: { color: '#1e222d' },
			textColor: '#d1d4dc'
		},
		grid: {
			vertLines: { color: '#2b2f3a' },
			horzLines: { color: '#2b2f3a' }
		},
		timeScale: {
			timeVisible: true,
			secondsVisible: false,
			borderColor: '#2b2f3a'
		},
		rightPriceScale: {
			borderColor: '#2b2f3a'
		},
		crosshair: {
			mode: 1
		}
	};

	// ===== VISIBILITY STATE =====
	let showCandlestick = $state(true);
	let showVolume = $state(true);
	let showRSI = $state(true);
	let showMACD = $state(true);
	let showMACDSignal = $state(true);
	let showMACDHistogram = $state(true);

	// ===== TRADE BUBBLES =====
	let tradeBubbles: TradeBubbles | undefined = $state();
	let showTradeBubbles = $state(true);
	let minRadius = $state(4);
	let maxRadius = $state(30);
	let volumeScale: 'linear' | 'sqrt' | 'log' = $state('sqrt');
	let showVolumeText = $state(true);
	let shadowBlur = $state(6);
	let opacity = $state(0.7);
	let borderWidth = $state(2);

	let bubbleOptions = $derived.by(() => ({
		minRadius,
		maxRadius,
		volumeScale,
		showVolumeText,
		shadowBlur,
		opacity,
		borderWidth,
		buyColor: 'rgba(38, 166, 154, 0.8)',
		sellColor: 'rgba(239, 83, 80, 0.8)'
	}));

	// Initialize trade bubbles
	$effect(() => {
		const plugin = new TradeBubbles(untrack(() => bubbleOptions));
		tradeBubbles = plugin;

		const sampleTrades: TradeBubblesData[] = [
			{ time: chartData[20].time, price: chartData[20].high - 0.5, volume: 500, side: 'buy' },
			{ time: chartData[40].time, price: chartData[40].low + 0.3, volume: 2500, side: 'sell' },
			{ time: chartData[60].time, price: chartData[60].high - 0.2, volume: 1200, side: 'buy' },
			{ time: chartData[80].time, price: chartData[80].low + 0.4, volume: 3500, side: 'sell' },
			{ time: chartData[100].time, price: chartData[100].close + 0.2, volume: 1800, side: 'buy' },
			{ time: chartData[120].time, price: chartData[120].close - 0.3, volume: 900, side: 'sell' },
			{ time: chartData[140].time, price: chartData[140].high - 0.1, volume: 4200, side: 'buy' },
			{ time: chartData[160].time, price: chartData[160].low + 0.5, volume: 650, side: 'sell' },
			{ time: chartData[180].time, price: chartData[180].close + 0.3, volume: 5000, side: 'buy' }
		];

		plugin.setTrades(sampleTrades);

		return () => {
			plugin.clearTrades();
			if (tradeBubbles === plugin) {
				tradeBubbles = undefined;
			}
		};
	});

	$effect(() => {
		if (tradeBubbles) {
			tradeBubbles.applyOptions(bubbleOptions);
		}
	});

	function addRandomTrade() {
		if (!tradeBubbles) return;
		const randomIndex = Math.floor(Math.random() * chartData.length);
		const candle = chartData[randomIndex];
		const side = Math.random() > 0.5 ? 'buy' : 'sell';
		const priceOffset = (Math.random() - 0.5) * 2;
		const volume = Math.floor(Math.random() * 5000) + 100;

		tradeBubbles.addTrade({
			time: candle.time,
			price: candle.close + priceOffset,
			volume,
			side
		});
	}

	// ===== SERIES MARKERS =====
	let markers = $state<SeriesMarker[]>([
		{
			time: chartData[30].time,
			position: 'aboveBar' as const,
			color: '#2962FF',
			shape: 'arrowDown' as const,
			text: 'Buy Signal'
		},
		{
			time: chartData[50].time,
			position: 'belowBar' as const,
			color: '#F23645',
			shape: 'arrowUp' as const,
			text: 'Sell Signal'
		},
		{
			time: chartData[100].time,
			position: 'aboveBar' as const,
			color: '#26a69a',
			shape: 'circle' as const,
			text: 'Support'
		}
	]);
	let showMarkers = $state(true);

	function addRandomMarker() {
		const randomIndex = Math.floor(Math.random() * chartData.length);
		const candle = chartData[randomIndex];
		const shapes = ['circle', 'square', 'arrowUp', 'arrowDown'] as const;
		const positions = ['aboveBar', 'belowBar', 'inBar'] as const;
		const colors = ['#2962FF', '#F23645', '#26a69a', '#FF6D00', '#9C27B0'];

		markers = [
			...markers,
			{
				time: candle.time,
				position: positions[Math.floor(Math.random() * positions.length)],
				color: colors[Math.floor(Math.random() * colors.length)],
				shape: shapes[Math.floor(Math.random() * shapes.length)],
				text: `Marker ${markers.length + 1}`
			}
		];
	}

	// ===== OBJECT TREE =====
	interface ChartObject {
		id: string;
		type: 'series' | 'marker' | 'indicator' | 'priceline' | 'primitive';
		name: string;
		paneIndex: number;
		visible: boolean;
		seriesType?: any;
	}

	let chartObjects = $derived.by<ChartObject[]>(() => {
		const objects: ChartObject[] = [];

		// Main pane series
		if (showCandlestick) {
			objects.push({
				id: 'candlestick',
				type: 'series',
				name: 'Main Chart',
				paneIndex: 0,
				visible: showCandlestick,
				seriesType: 'Candlestick'
			});
		}

		// Volume pane
		if (showVolume) {
			objects.push({
				id: 'volume',
				type: 'indicator',
				name: 'Volume',
				paneIndex: 1,
				visible: showVolume,
				seriesType: 'Histogram'
			});
		}

		// RSI pane
		if (showRSI) {
			objects.push({
				id: 'rsi',
				type: 'indicator',
				name: 'RSI',
				paneIndex: 2,
				visible: showRSI,
				seriesType: 'Line'
			});
		}

		// MACD pane
		if (showMACD) {
			objects.push({
				id: 'macd',
				type: 'indicator',
				name: 'MACD',
				paneIndex: 3,
				visible: showMACD,
				seriesType: 'Line'
			});
		}
		if (showMACDSignal) {
			objects.push({
				id: 'macd-signal',
				type: 'indicator',
				name: 'MACD Signal',
				paneIndex: 3,
				visible: showMACDSignal,
				seriesType: 'Line'
			});
		}
		if (showMACDHistogram) {
			objects.push({
				id: 'macd-histogram',
				type: 'indicator',
				name: 'MACD Histogram',
				paneIndex: 3,
				visible: showMACDHistogram,
				seriesType: 'Histogram'
			});
		}

		// Primitives
		if (showTradeBubbles && tradeBubbles) {
			objects.push({
				id: 'trade-bubbles',
				type: 'primitive',
				name: 'Trade Bubbles',
				paneIndex: 0,
				visible: showTradeBubbles
			});
		}

		// Markers
		if (showMarkers && markers.length > 0) {
			objects.push({
				id: 'markers',
				type: 'marker',
				name: `Series Markers (${markers.length})`,
				paneIndex: 0,
				visible: showMarkers
			});
		}

		return objects;
	});

	function handleToggleVisibility(id: string) {
		switch (id) {
			case 'candlestick':
				showCandlestick = !showCandlestick;
				break;
			case 'volume':
				showVolume = !showVolume;
				break;
			case 'rsi':
				showRSI = !showRSI;
				break;
			case 'macd':
				showMACD = !showMACD;
				break;
			case 'macd-signal':
				showMACDSignal = !showMACDSignal;
				break;
			case 'macd-histogram':
				showMACDHistogram = !showMACDHistogram;
				break;
			case 'trade-bubbles':
				showTradeBubbles = !showTradeBubbles;
				break;
			case 'markers':
				showMarkers = !showMarkers;
				break;
		}
	}

	function handleRemove(id: string) {
		switch (id) {
			case 'candlestick':
				showCandlestick = false;
				break;
			case 'volume':
				showVolume = false;
				break;
			case 'rsi':
				showRSI = false;
				break;
			case 'macd':
				showMACD = false;
				break;
			case 'macd-signal':
				showMACDSignal = false;
				break;
			case 'macd-histogram':
				showMACDHistogram = false;
				break;
			case 'trade-bubbles':
				showTradeBubbles = false;
				if (tradeBubbles) tradeBubbles.clearTrades();
				break;
			case 'markers':
				showMarkers = false;
				markers = [];
				break;
		}
	}

	let chart: IChartApi | undefined = $state();
</script>

<div class="playground">
	<div class="header">
		<h1>Chart Playground</h1>
		<p>Complete testing environment with panes, indicators, markers, and trade bubbles</p>
	</div>

	<div class="layout">
		<!-- Left Side: Chart -->
		<div class="chart-section">
			<div class="chart-container">
				<Chart options={chartOptions} bind:chart>
					<!-- Main Candlestick Chart -->
					{#if showCandlestick}
						<Series type="Candlestick" data={chartData} options={{ upColor: '#26a69a', downColor: '#ef5350' }}>
							{#if showTradeBubbles && tradeBubbles}
								<SeriesPlugin primitive={tradeBubbles} />
							{/if}
							{#if showMarkers}
								<SeriesMarkers {markers} />
							{/if}
						</Series>
					{/if}

					<!-- Volume Pane -->
					{#if showVolume}
						<Series type="Histogram" data={volumeData} paneIndex={1} />
					{/if}

					<!-- RSI Pane -->
					{#if showRSI}
						<Series
							type="Line"
							data={rsiData}
							paneIndex={2}
							options={{ color: '#2962FF', lineWidth: 2, title: 'RSI' }}
						/>
					{/if}

					<!-- MACD Pane -->
					{#if showMACD}
						<Series
							type="Line"
							data={macdData}
							paneIndex={3}
							options={{ color: '#2962FF', lineWidth: 2, title: 'MACD' }}
						/>
					{/if}
					{#if showMACDSignal}
						<Series
							type="Line"
							data={macdSignalData}
							paneIndex={3}
							options={{ color: '#FF6D00', lineWidth: 2, title: 'Signal' }}
						/>
					{/if}
					{#if showMACDHistogram}
						<Series type="Histogram" data={macdHistogramData} paneIndex={3} />
					{/if}
				</Chart>
			</div>

			<!-- Controls -->
			<div class="controls-panel">
				<div class="control-group">
					<h3>Actions</h3>
					<div class="button-row">
						<button onclick={addRandomTrade} class="btn-primary">Add Random Trade</button>
						<button onclick={addRandomMarker} class="btn-primary">Add Random Marker</button>
					</div>
				</div>

				<div class="control-group">
					<h3>Trade Bubbles</h3>
					<div class="slider-grid">
						<label>
							<span>Min Radius: {minRadius}px</span>
							<input type="range" bind:value={minRadius} min="2" max="10" step="1" />
						</label>
						<label>
							<span>Max Radius: {maxRadius}px</span>
							<input type="range" bind:value={maxRadius} min="15" max="60" step="1" />
						</label>
						<label>
							<span>Opacity: {opacity.toFixed(2)}</span>
							<input type="range" bind:value={opacity} min="0.1" max="1" step="0.05" />
						</label>
						<label>
							<span>Shadow: {shadowBlur}px</span>
							<input type="range" bind:value={shadowBlur} min="0" max="15" step="1" />
						</label>
					</div>
					<div class="radio-group">
						<label>
							<input type="radio" bind:group={volumeScale} value="linear" />
							Linear
						</label>
						<label>
							<input type="radio" bind:group={volumeScale} value="sqrt" />
							Square Root
						</label>
						<label>
							<input type="radio" bind:group={volumeScale} value="log" />
							Logarithmic
						</label>
					</div>
				</div>
			</div>
		</div>

		<!-- Right Side: Object Tree -->
		<div class="tree-section">
			<ObjectTree {chart} objects={chartObjects} onToggleVisibility={handleToggleVisibility} onRemove={handleRemove} />
		</div>
	</div>
</div>

<style>
	.playground {
		min-height: 100vh;
		background: #1a1d28;
		color: #d1d4dc;
		padding: 2rem;
	}

	.header {
		margin-bottom: 2rem;
	}

	.header h1 {
		margin: 0 0 0.5rem 0;
		color: #fff;
		font-size: 2rem;
	}

	.header p {
		margin: 0;
		color: #8891a0;
		font-size: 1rem;
	}

	.layout {
		display: grid;
		grid-template-columns: 1fr 350px;
		gap: 1.5rem;
		height: calc(100vh - 140px);
	}

	.chart-section {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
		overflow: hidden;
	}

	.chart-container {
		flex: 1;
		background: #1e222d;
		border: 1px solid #2b2f3a;
		border-radius: 8px;
		overflow: hidden;
		min-height: 0;
	}

	.controls-panel {
		background: #252832;
		border: 1px solid #2b2f3a;
		border-radius: 8px;
		padding: 1.5rem;
		display: flex;
		gap: 1.5rem;
		overflow-x: auto;
	}

	.control-group {
		flex: 1;
		min-width: 250px;
	}

	.control-group h3 {
		margin: 0 0 1rem 0;
		font-size: 1rem;
		color: #fff;
	}

	.button-row {
		display: flex;
		gap: 0.75rem;
		flex-wrap: wrap;
	}

	.btn-primary {
		padding: 0.75rem 1.5rem;
		background: #2962ff;
		border: none;
		border-radius: 6px;
		color: white;
		font-size: 0.9rem;
		cursor: pointer;
		transition: background 0.2s;
		font-weight: 500;
	}

	.btn-primary:hover {
		background: #1e53e5;
	}

	.slider-grid {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 1rem;
		margin-bottom: 1rem;
	}

	.slider-grid label {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.slider-grid label span {
		font-size: 0.85rem;
		color: #b0b3be;
	}

	input[type='range'] {
		width: 100%;
		cursor: pointer;
	}

	.radio-group {
		display: flex;
		gap: 1rem;
		flex-wrap: wrap;
	}

	.radio-group label {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.9rem;
		cursor: pointer;
	}

	.radio-group input[type='radio'] {
		cursor: pointer;
	}

	.tree-section {
		overflow: hidden;
	}

	/* Responsive */
	@media (max-width: 1200px) {
		.layout {
			grid-template-columns: 1fr;
			height: auto;
		}

		.tree-section {
			min-height: 500px;
		}

		.slider-grid {
			grid-template-columns: 1fr;
		}
	}
</style>
