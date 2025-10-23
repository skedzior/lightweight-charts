<script lang="ts">
	import { Chart, Series, SeriesPlugin } from '$lib';
	import { TradeBubbles, type TradeBubblesData, type TradeBubblesOptions } from '$lib/plugins/trade-bubbles';
	import type { ChartOptions, CandlestickData, DeepPartial } from 'lightweight-charts';
	import { onDestroy } from 'svelte';

	// Generate sample candlestick data
	function generateCandleData(count: number): CandlestickData[] {
		const data: CandlestickData[] = [];
		let basePrice = 100;
		const startTime = Math.floor(Date.now() / 1000) - count * 60;

		for (let i = 0; i < count; i++) {
			const time = startTime + i * 60;
			const open = basePrice + (Math.random() - 0.5) * 2;
			const close = open + (Math.random() - 0.5) * 3;
			const high = Math.max(open, close) + Math.random() * 1;
			const low = Math.min(open, close) - Math.random() * 1;

			data.push({
				time: time as any,
				open,
				high,
				low,
				close
			});

			basePrice = close;
		}

		return data;
	}

	const candleData = generateCandleData(100);
	const lastCandle = candleData[candleData.length - 1];
	const currentPrice = lastCandle.close;

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
			secondsVisible: false
		},
		rightPriceScale: {
			borderColor: '#2b2f3a'
		},
		crosshair: {
			mode: 1
		}
	};

	// Plugin options state
	let minRadius = $state(4);
	let maxRadius = $state(30);
	let volumeScale: 'linear' | 'sqrt' | 'log' = $state('sqrt');
	let showVolumeText = $state(true);
	let shadowBlur = $state(6);
	let opacity = $state(0.7);
	let borderWidth = $state(2);

	// Create plugin with reactive options
	let pluginOptions = $derived.by<TradeBubblesOptions>(() => ({
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

	let tradeBubbles: TradeBubbles | undefined = $state();
	let isStreaming = $state(false);
	let streamInterval: ReturnType<typeof setInterval> | undefined;

	// Initialize plugin
	$effect(() => {
		const plugin = new TradeBubbles(pluginOptions);
		tradeBubbles = plugin;

		// Add some initial sample trades
		const sampleTrades: TradeBubblesData[] = [
			{ time: candleData[10].time, price: candleData[10].high - 0.5, volume: 500, side: 'buy' },
			{ time: candleData[10].time, price: candleData[10].low + 0.3, volume: 800, side: 'sell' },
			{ time: candleData[20].time, price: candleData[20].high - 0.2, volume: 1200, side: 'buy' },
			{ time: candleData[30].time, price: candleData[30].low + 0.4, volume: 2500, side: 'sell' },
			{ time: candleData[40].time, price: candleData[40].close + 0.1, volume: 450, side: 'buy' },
			{ time: candleData[50].time, price: candleData[50].close - 0.2, volume: 3000, side: 'sell' },
			{ time: candleData[60].time, price: candleData[60].high - 0.3, volume: 1800, side: 'buy' },
			{ time: candleData[70].time, price: candleData[70].low + 0.5, volume: 600, side: 'sell' },
			{ time: candleData[80].time, price: candleData[80].close + 0.2, volume: 4500, side: 'buy' },
			{ time: candleData[90].time, price: candleData[90].close - 0.1, volume: 950, side: 'sell' }
		];

		plugin.setTrades(sampleTrades);

		return () => {
			plugin.clearTrades();
			if (tradeBubbles === plugin) {
				tradeBubbles = undefined;
			}
		};
	});

	// Update plugin options when they change
	$effect(() => {
		if (tradeBubbles) {
			tradeBubbles.applyOptions(pluginOptions);
		}
	});

	function addRandomTrade() {
		if (!tradeBubbles) return;

		const lastTime = candleData[candleData.length - 1].time;
		const side = Math.random() > 0.5 ? 'buy' : 'sell';
		const priceOffset = (Math.random() - 0.5) * 2;
		const volume = Math.floor(Math.random() * 5000) + 100;

		const trade: TradeBubblesData = {
			time: lastTime,
			price: currentPrice + priceOffset,
			volume,
			side
		};

		tradeBubbles.addTrade(trade);
	}

	function toggleStreaming() {
		isStreaming = !isStreaming;

		if (isStreaming) {
			streamInterval = setInterval(() => {
				addRandomTrade();
			}, 500);
		} else {
			if (streamInterval) {
				clearInterval(streamInterval);
				streamInterval = undefined;
			}
		}
	}

	function clearAllTrades() {
		if (tradeBubbles) {
			tradeBubbles.clearTrades();
		}
	}

	onDestroy(() => {
		if (streamInterval) {
			clearInterval(streamInterval);
		}
	});
</script>

<div class="container">
	<h1>Trade Bubbles - Volume-Based Circle Rendering</h1>

	<div class="info-box">
		<h3>Why Trade Bubbles Instead of Series Markers?</h3>
		<ul>
			<li><strong>Unlimited Size:</strong> Markers cap at size 3 (~24px). Bubbles scale infinitely.</li>
			<li><strong>Volume Scaling:</strong> Linear, square root, or logarithmic volume-to-size mapping.</li>
			<li><strong>Canvas Effects:</strong> Shadows, gradients, custom opacity, borders.</li>
			<li><strong>Performance:</strong> Efficient canvas rendering for thousands of trades.</li>
		</ul>
	</div>

	<div class="chart-container">
		<Chart options={chartOptions}>
			<Series type="Candlestick" data={candleData}>
				{#if tradeBubbles}
					<SeriesPlugin primitive={tradeBubbles} />
				{/if}
			</Series>
		</Chart>
	</div>

	<div class="controls">
		<div class="control-section">
			<h3>Trade Actions</h3>
			<div class="button-group">
				<button onclick={addRandomTrade} class="btn-add">Add Random Trade</button>
				<button onclick={toggleStreaming} class={isStreaming ? 'btn-stop' : 'btn-stream'}>
					{isStreaming ? 'Stop Streaming' : 'Start Streaming'}
				</button>
				<button onclick={clearAllTrades} class="btn-clear">Clear All Trades</button>
			</div>
		</div>

		<div class="control-section">
			<h3>Scaling Algorithm</h3>
			<div class="radio-group">
				<label>
					<input type="radio" bind:group={volumeScale} value="linear" />
					Linear (Direct mapping)
				</label>
				<label>
					<input type="radio" bind:group={volumeScale} value="sqrt" />
					Square Root (Balanced - Recommended)
				</label>
				<label>
					<input type="radio" bind:group={volumeScale} value="log" />
					Logarithmic (Extreme variance)
				</label>
			</div>
		</div>

		<div class="control-section">
			<h3>Size Range</h3>
			<div class="slider-group">
				<label>
					<span>Min Radius: {minRadius}px</span>
					<input type="range" bind:value={minRadius} min="2" max="10" step="1" />
				</label>
				<label>
					<span>Max Radius: {maxRadius}px</span>
					<input type="range" bind:value={maxRadius} min="15" max="60" step="1" />
				</label>
			</div>
		</div>

		<div class="control-section">
			<h3>Visual Effects</h3>
			<div class="slider-group">
				<label>
					<span>Opacity: {opacity.toFixed(2)}</span>
					<input type="range" bind:value={opacity} min="0.1" max="1" step="0.05" />
				</label>
				<label>
					<span>Shadow Blur: {shadowBlur}px</span>
					<input type="range" bind:value={shadowBlur} min="0" max="15" step="1" />
				</label>
				<label>
					<span>Border Width: {borderWidth}px</span>
					<input type="range" bind:value={borderWidth} min="0" max="5" step="1" />
				</label>
			</div>
		</div>

		<div class="control-section">
			<h3>Display Options</h3>
			<div class="checkbox-group">
				<label>
					<input type="checkbox" bind:checked={showVolumeText} />
					Show Volume Text (for bubbles > 15px radius)
				</label>
			</div>
		</div>
	</div>

	<div class="info-box">
		<h3>Scaling Algorithm Comparison</h3>
		<p>For volumes ranging from 100 to 5,000 with minRadius={minRadius}px and maxRadius={maxRadius}px:</p>
		<div class="comparison-table">
			<div class="comparison-row">
				<div class="comparison-header">Volume</div>
				<div class="comparison-header">Linear</div>
				<div class="comparison-header">Square Root</div>
				<div class="comparison-header">Logarithmic</div>
			</div>
			<div class="comparison-row">
				<div>100</div>
				<div>{minRadius}px</div>
				<div>{minRadius}px</div>
				<div>{minRadius}px</div>
			</div>
			<div class="comparison-row">
				<div>1,250</div>
				<div>{Math.round(minRadius + 0.23 * (maxRadius - minRadius))}px</div>
				<div>{Math.round(minRadius + 0.48 * (maxRadius - minRadius))}px</div>
				<div>{Math.round(minRadius + 0.71 * (maxRadius - minRadius))}px</div>
			</div>
			<div class="comparison-row">
				<div>2,500</div>
				<div>{Math.round(minRadius + 0.49 * (maxRadius - minRadius))}px</div>
				<div>{Math.round(minRadius + 0.70 * (maxRadius - minRadius))}px</div>
				<div>{Math.round(minRadius + 0.85 * (maxRadius - minRadius))}px</div>
			</div>
			<div class="comparison-row">
				<div>5,000</div>
				<div>{maxRadius}px</div>
				<div>{maxRadius}px</div>
				<div>{maxRadius}px</div>
			</div>
		</div>
		<p class="comparison-note">
			<strong>Linear:</strong> Large trades visually dominate.<br />
			<strong>Square Root:</strong> More balanced distribution (recommended for most use cases).<br />
			<strong>Logarithmic:</strong> Best when volume variance is extreme (e.g., 1 to 1,000,000).
		</p>
	</div>

	<div class="code-example">
		<h3>Usage Example</h3>
		<pre><code>{`import { TradeBubbles } from '$lib/plugins/trade-bubbles';
import { Chart, Series, SeriesPlugin } from '$lib';

// Create plugin
const tradeBubbles = new TradeBubbles({
  minRadius: 4,
  maxRadius: 30,
  volumeScale: 'sqrt',
  showVolumeText: true,
  shadowBlur: 6
});

// Add trades as they arrive
function onTrade(trade) {
  tradeBubbles.addTrade({
    time: trade.timestamp,
    price: trade.price,
    volume: trade.volume,
    side: trade.side // 'buy' or 'sell'
  });
}

// Or set all at once
tradeBubbles.setTrades([
  { time: 1704067200, price: 100.5, volume: 500, side: 'buy' },
  { time: 1704067201, price: 100.6, volume: 1200, side: 'sell' }
]);`}</code></pre>

		<pre><code>{`<Chart options={chartOptions}>
  <Series type="Candlestick" data={candleData}>
    <SeriesPlugin primitive={tradeBubbles} />
  </Series>
</Chart>`}</code></pre>
	</div>
</div>

<style>
	.container {
		padding: 2rem;
		max-width: 1400px;
		margin: 0 auto;
		color: #d1d4dc;
		background: #1a1d28;
		min-height: 100vh;
	}

	h1 {
		color: #fff;
		margin-bottom: 1rem;
		font-size: 2rem;
	}

	h3 {
		color: #fff;
		margin-bottom: 0.75rem;
		font-size: 1.25rem;
	}

	.info-box {
		background: #252832;
		border: 1px solid #2b2f3a;
		border-radius: 8px;
		padding: 1.5rem;
		margin-bottom: 1.5rem;
	}

	.info-box ul {
		list-style: none;
		padding: 0;
		margin: 0.5rem 0 0 0;
	}

	.info-box li {
		padding: 0.5rem 0;
		border-bottom: 1px solid #2b2f3a;
	}

	.info-box li:last-child {
		border-bottom: none;
	}

	.chart-container {
		height: 500px;
		background: #1e222d;
		border-radius: 8px;
		margin-bottom: 1.5rem;
		border: 1px solid #2b2f3a;
	}

	.controls {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
		gap: 1.5rem;
		margin-bottom: 1.5rem;
	}

	.control-section {
		background: #252832;
		border: 1px solid #2b2f3a;
		border-radius: 8px;
		padding: 1.5rem;
	}

	.button-group {
		display: flex;
		gap: 0.75rem;
		flex-wrap: wrap;
	}

	button {
		padding: 0.75rem 1.5rem;
		border: none;
		border-radius: 6px;
		font-size: 0.95rem;
		cursor: pointer;
		transition: all 0.2s;
		font-weight: 500;
	}

	.btn-add {
		background: #2962ff;
		color: white;
	}

	.btn-add:hover {
		background: #1e53e5;
	}

	.btn-stream {
		background: #26a69a;
		color: white;
	}

	.btn-stream:hover {
		background: #1f897f;
	}

	.btn-stop {
		background: #ef5350;
		color: white;
	}

	.btn-stop:hover {
		background: #e53935;
	}

	.btn-clear {
		background: #78909c;
		color: white;
	}

	.btn-clear:hover {
		background: #607d8b;
	}

	.radio-group {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.radio-group label {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		cursor: pointer;
		padding: 0.5rem;
		border-radius: 4px;
		transition: background 0.2s;
	}

	.radio-group label:hover {
		background: #2b2f3a;
	}

	.radio-group input[type='radio'] {
		cursor: pointer;
	}

	.slider-group {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.slider-group label {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.slider-group label span {
		font-size: 0.9rem;
		color: #b0b3be;
	}

	input[type='range'] {
		width: 100%;
		cursor: pointer;
	}

	.checkbox-group label {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		cursor: pointer;
		padding: 0.5rem;
		border-radius: 4px;
		transition: background 0.2s;
	}

	.checkbox-group label:hover {
		background: #2b2f3a;
	}

	.checkbox-group input[type='checkbox'] {
		cursor: pointer;
		width: 18px;
		height: 18px;
	}

	.comparison-table {
		background: #1e222d;
		border-radius: 6px;
		padding: 1rem;
		margin: 1rem 0;
	}

	.comparison-row {
		display: grid;
		grid-template-columns: 1fr 1fr 1fr 1fr;
		gap: 1rem;
		padding: 0.75rem;
		border-bottom: 1px solid #2b2f3a;
	}

	.comparison-row:last-child {
		border-bottom: none;
	}

	.comparison-header {
		font-weight: bold;
		color: #fff;
	}

	.comparison-note {
		font-size: 0.9rem;
		color: #b0b3be;
		line-height: 1.6;
		margin-top: 1rem;
	}

	.code-example {
		background: #252832;
		border: 1px solid #2b2f3a;
		border-radius: 8px;
		padding: 1.5rem;
	}

	.code-example pre {
		background: #1e222d;
		border-radius: 6px;
		padding: 1rem;
		overflow-x: auto;
		margin: 0.75rem 0;
	}

	.code-example code {
		font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
		font-size: 0.9rem;
		color: #d1d4dc;
		line-height: 1.6;
	}
</style>
