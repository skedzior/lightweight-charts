<script lang="ts">
	import { Chart, Series, MovingAverage, Momentum, Correlation } from '$lib';
	import type { IChartApi, ISeriesApi, CandlestickData, UTCTimestamp } from 'lightweight-charts';

	let chart: IChartApi | undefined = $state();
	let mainSeries: ISeriesApi<'Candlestick'> | undefined = $state();
	let secondarySeries: ISeriesApi<'Line'> | undefined = $state();

	// Theme state
	let isDark = $state(true);

	// Chart options
	let chartOptions = $derived({
		layout: {
			background: { color: isDark ? '#1e222d' : '#ffffff' },
			textColor: isDark ? '#d1d4dc' : '#191919'
		},
		grid: {
			vertLines: { color: isDark ? '#2b2b43' : '#e1e3eb' },
			horzLines: { color: isDark ? '#2b2b43' : '#e1e3eb' }
		},
		crosshair: {
			mode: 1
		},
		rightPriceScale: {
			borderColor: isDark ? '#2b2b43' : '#e1e3eb'
		},
		timeScale: {
			borderColor: isDark ? '#2b2b43' : '#e1e3eb',
			timeVisible: true,
			secondsVisible: false
		}
	});

	// Generate sample candlestick data
	function generateCandlestickData(startDate: Date, count: number): CandlestickData<UTCTimestamp>[] {
		const data: CandlestickData<UTCTimestamp>[] = [];
		let currentPrice = 100;

		for (let i = 0; i < count; i++) {
			const date = new Date(startDate);
			date.setDate(date.getDate() + i);
			const time = (date.getTime() / 1000) as UTCTimestamp;

			const change = (Math.random() - 0.5) * 4;
			const open = currentPrice;
			const close = currentPrice + change;
			const high = Math.max(open, close) + Math.random() * 2;
			const low = Math.min(open, close) - Math.random() * 2;

			data.push({
				time,
				open,
				high,
				low,
				close
			});

			currentPrice = close;
		}

		return data;
	}

	// Generate sample line data (slightly different from candlestick for correlation)
	function generateLineData(startDate: Date, count: number): any[] {
		const data: any[] = [];
		let currentPrice = 105;

		for (let i = 0; i < count; i++) {
			const date = new Date(startDate);
			date.setDate(date.getDate() + i);
			const time = (date.getTime() / 1000) as UTCTimestamp;

			const change = (Math.random() - 0.5) * 3.5;
			currentPrice += change;

			data.push({
				time,
				value: currentPrice
			});
		}

		return data;
	}

	const startDate = new Date(2024, 0, 1);
	let candleData = $state(generateCandlestickData(startDate, 200));
	let lineData = $state(generateLineData(startDate, 200));

	// Moving Average options
	let maLength = $state(20);
	let maSmoothing = $state<'SMA' | 'EMA' | 'WMA'>('SMA');

	// Momentum options
	let momentumLength = $state(14);

	// Correlation options
	let correlationLength = $state(20);

	function toggleTheme() {
		isDark = !isDark;
	}

	function randomizeData() {
		candleData = generateCandlestickData(startDate, 200);
		lineData = generateLineData(startDate, 200);
	}
</script>

<svelte:head>
	<title>Indicator Examples - Lightweight Charts Svelte 5</title>
</svelte:head>

<div class="container">
	<h1>📈 Technical Indicators</h1>

	<p class="intro">
		Svelte 5 native components for popular technical indicators. These indicators automatically
		calculate and update based on the source series data.
	</p>

	<div class="controls">
		<button onclick={toggleTheme}>Toggle Theme</button>
		<button onclick={randomizeData}>Randomize Data</button>
	</div>

	<!-- Indicator Controls -->
	<div class="indicator-controls">
		<div class="control-group">
			<h3>Moving Average</h3>
			<label>
				Length: {maLength}
				<input type="range" bind:value={maLength} min="5" max="50" />
			</label>
			<label>
				Type:
				<select bind:value={maSmoothing}>
					<option value="SMA">SMA (Simple)</option>
					<option value="EMA">EMA (Exponential)</option>
					<option value="WMA">WMA (Weighted)</option>
				</select>
			</label>
		</div>

		<div class="control-group">
			<h3>Momentum</h3>
			<label>
				Length: {momentumLength}
				<input type="range" bind:value={momentumLength} min="5" max="30" />
			</label>
		</div>

		<div class="control-group">
			<h3>Correlation</h3>
			<label>
				Length: {correlationLength}
				<input type="range" bind:value={correlationLength} min="10" max="50" />
			</label>
		</div>
	</div>

	<div class="chart-wrapper">
		<Chart
			options={chartOptions}
			width="100%"
			height={700}
			autoResize={true}
			onCreate={(c) => {
				chart = c;
				console.log('Chart created!');
			}}
		>
			<!-- Main Candlestick Series in Pane 0 -->
			<Series
				type="Candlestick"
				data={candleData}
				options={{
					upColor: '#26a69a',
					downColor: '#ef5350',
					borderVisible: false,
					wickUpColor: '#26a69a',
					wickDownColor: '#ef5350'
				}}
				paneIndex={0}
				onCreate={(s) => {
					mainSeries = s;
					console.log('Main series created');
				}}
			>
				{#if mainSeries}
					<!-- Moving Average Indicator (same pane) -->
					<MovingAverage
						series={mainSeries}
						options={{
							length: maLength,
							source: 'close',
							smoothingLine: maSmoothing === 'SMA' ? undefined : maSmoothing,
							smoothingLength: maSmoothing === 'SMA' ? undefined : 5
						}}
						seriesOptions={{
							color: 'rgba(33, 150, 243, 1)',
							lineWidth: 2,
							title: `${maSmoothing}(${maLength})`
						}}
						paneIndex={0}
					/>
				{/if}
			</Series>

			<!-- Secondary Line Series for Correlation (Pane 0) -->
			<Series
				type="Line"
				data={lineData}
				options={{
					color: 'rgba(156, 39, 176, 0.8)',
					lineWidth: 2,
					title: 'Secondary'
				}}
				paneIndex={0}
				onCreate={(s) => {
					secondarySeries = s;
				}}
			/>

			<!-- Momentum Indicator (Pane 1) -->
			{#if mainSeries}
				<Momentum
					series={mainSeries}
					options={{
						length: momentumLength,
						source: 'close'
					}}
					seriesOptions={{
						color: 'rgba(255, 152, 0, 1)',
						lineWidth: 2,
						title: `Momentum(${momentumLength})`
					}}
					paneIndex={1}
				/>
			{/if}

			<!-- Correlation Indicator (Pane 2) -->
			{#if mainSeries && secondarySeries}
				<Correlation
					primarySeries={mainSeries}
					secondarySeries={secondarySeries}
					options={{
						length: correlationLength,
						primarySource: 'close',
						secondarySource: 'value'
					}}
					seriesOptions={{
						title: `Correlation(${correlationLength})`,
						baseValue: { type: 'price', price: 0 }
					}}
					paneIndex={2}
				/>
			{/if}
		</Chart>
	</div>

	<div class="info-section">
		<h2>Available Indicators</h2>

		<div class="indicator-info">
			<h3>📊 Moving Average</h3>
			<p>
				Smooths price data by creating a constantly updated average price. Supports SMA (Simple),
				EMA (Exponential), and WMA (Weighted) calculations with optional smoothing and offset.
			</p>
			<pre><code>{`<MovingAverage
  series={mainSeries}
  options={{
    length: 20,
    source: 'close',
    smoothingLine: 'EMA',
    smoothingLength: 5,
    offset: 0
  }}
  seriesOptions={{
    color: 'blue',
    lineWidth: 2
  }}
  paneIndex={0}
/>`}</code></pre>
		</div>

		<div class="indicator-info">
			<h3>🚀 Momentum</h3>
			<p>
				Measures the rate of change in price over a specified period. Shows the difference between
				the current price and the price N periods ago, helping identify trend strength and
				potential reversals.
			</p>
			<pre><code>{`<Momentum
  series={mainSeries}
  options={{
    length: 14,
    source: 'close'
  }}
  seriesOptions={{
    color: 'orange',
    lineWidth: 2
  }}
  paneIndex={1}
/>`}</code></pre>
		</div>

		<div class="indicator-info">
			<h3>🔗 Correlation</h3>
			<p>
				Calculates the Pearson correlation coefficient between two series over a rolling window.
				Values range from -1 (perfect negative correlation) to +1 (perfect positive correlation).
				Uses a Baseline series to visualize positive and negative correlations.
			</p>
			<pre><code>{`<Correlation
  primarySeries={mainSeries}
  secondarySeries={secondarySeries}
  options={{
    length: 20,
    primarySource: 'close',
    secondarySource: 'value',
    allowMismatchedDates: false
  }}
  seriesOptions={{
    baseValue: { type: 'price', price: 0 }
  }}
  paneIndex={2}
/>`}</code></pre>
		</div>
	</div>

	<div class="back-link">
		<a href="/">← Back to Main Demo</a>
	</div>
</div>

<style>
	.container {
		max-width: 1400px;
		margin: 0 auto;
		padding: 2rem;
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu,
			Cantarell, sans-serif;
	}

	h1 {
		font-size: 2.5rem;
		margin-bottom: 1rem;
		color: #333;
		text-align: center;
	}

	.intro {
		text-align: center;
		font-size: 1.1rem;
		color: #666;
		margin-bottom: 2rem;
		max-width: 800px;
		margin-left: auto;
		margin-right: auto;
	}

	.controls {
		display: flex;
		gap: 1rem;
		justify-content: center;
		margin-bottom: 2rem;
	}

	button {
		padding: 0.75rem 1.5rem;
		font-size: 1rem;
		cursor: pointer;
		border: 2px solid #2196f3;
		background: white;
		color: #2196f3;
		border-radius: 8px;
		transition: all 0.2s;
		font-weight: 600;
	}

	button:hover {
		background: #2196f3;
		color: white;
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(33, 150, 243, 0.3);
	}

	.indicator-controls {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
		gap: 1.5rem;
		margin-bottom: 2rem;
		padding: 1.5rem;
		background: #f5f5f5;
		border-radius: 12px;
	}

	.control-group {
		background: white;
		padding: 1rem;
		border-radius: 8px;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
	}

	.control-group h3 {
		margin-top: 0;
		margin-bottom: 1rem;
		color: #2196f3;
		font-size: 1.1rem;
	}

	.control-group label {
		display: block;
		margin-bottom: 0.75rem;
		color: #555;
		font-weight: 500;
	}

	input[type='range'] {
		width: 100%;
		margin-top: 0.5rem;
	}

	select {
		width: 100%;
		padding: 0.5rem;
		margin-top: 0.5rem;
		border: 1px solid #ddd;
		border-radius: 4px;
		font-size: 1rem;
	}

	.chart-wrapper {
		border: 1px solid #e0e0e0;
		border-radius: 12px;
		overflow: hidden;
		margin-bottom: 3rem;
		box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
	}

	.info-section {
		margin-top: 3rem;
	}

	.info-section h2 {
		font-size: 2rem;
		margin-bottom: 2rem;
		color: #333;
		text-align: center;
	}

	.indicator-info {
		margin-bottom: 2rem;
		padding: 1.5rem;
		background: #f9f9f9;
		border-radius: 8px;
		border-left: 4px solid #2196f3;
	}

	.indicator-info h3 {
		margin-top: 0;
		color: #2196f3;
		font-size: 1.3rem;
	}

	.indicator-info p {
		color: #555;
		line-height: 1.6;
		margin-bottom: 1rem;
	}

	pre {
		background: #1e1e1e;
		padding: 1rem;
		border-radius: 6px;
		overflow-x: auto;
		margin: 0;
	}

	code {
		color: #d4d4d4;
		font-family: 'Courier New', monospace;
		font-size: 0.9rem;
		line-height: 1.5;
	}

	.back-link {
		text-align: center;
		margin-top: 3rem;
	}

	.back-link a {
		color: #2196f3;
		text-decoration: none;
		font-size: 1.1rem;
		font-weight: 600;
		transition: color 0.2s;
	}

	.back-link a:hover {
		color: #1976d2;
		text-decoration: underline;
	}
</style>
