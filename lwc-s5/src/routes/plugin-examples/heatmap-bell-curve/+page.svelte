<script lang="ts">
	import { Chart, CustomSeries } from '$lib';
	import { HeatMapSeries, generateBellCurveHeatMapData, type HeatMapData } from '$lib/plugins/heatmap-series';
	import type { IChartApi, LineData, UTCTimestamp } from 'lightweight-charts';

	let chart: IChartApi | undefined = $state();

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

	// Generate line data
	function generateLineData(count: number = 250): LineData<UTCTimestamp>[] {
		const data: LineData<UTCTimestamp>[] = [];
		const startDate = new Date(2024, 0, 1);
		let currentPrice = 100;

		for (let i = 0; i < count; i++) {
			const date = new Date(startDate);
			date.setDate(date.getDate() + i);
			const time = (date.getTime() / 1000) as UTCTimestamp;

			const change = (Math.random() - 0.5) * 4;
			currentPrice += change;

			data.push({
				time,
				value: currentPrice
			});
		}

		return data;
	}

	// Configuration
	let spread = $state(20);
	let binSize = $state(5);
	let cellBorderWidth = $state(0);

	const lineData = generateLineData(250);
	let heatmapData = $derived<HeatMapData[]>(
		generateBellCurveHeatMapData(lineData, spread, binSize)
	);

	// Calculate max amount for color scaling
	let maxAmount = $derived(
		heatmapData.reduce((currentMax: number, dataPoint: HeatMapData) => {
			const maxCellAmount = dataPoint.cells.reduce((cellsMax: number, cell) => {
				if (cell.amount > cellsMax) return cell.amount;
				return cellsMax;
			}, 0);
			if (maxCellAmount > currentMax) return maxCellAmount;
			return currentMax;
		}, 0)
	);

	// Color shader function
	const cellShader = $derived((amount: number) => {
		const amt = 100 * (amount / maxAmount);
		const r = 155 - amt;
		const g = 0;
		const b = 155 + amt;
		return `rgba(${r}, ${g}, ${b}, ${0.05 + amt * 0.01})`;
	});

	function toggleTheme() {
		isDark = !isDark;
	}
</script>

<svelte:head>
	<title>Heatmap Bell Curve - Lightweight Charts Svelte 5</title>
</svelte:head>

<div class="container">
	<h1>📊 Heatmap Series - Bell Curve Distribution</h1>

	<p class="intro">
		This example demonstrates a heatmap series with bell curve distribution around each price
		point. The intensity represents probability density, showing where the price is most likely to
		be found.
	</p>

	<div class="controls">
		<button onclick={toggleTheme}>Toggle Theme</button>
	</div>

	<!-- Configuration Controls -->
	<div class="config-controls">
		<div class="control-group">
			<label>
				Spread: {spread}
				<input type="range" bind:value={spread} min="5" max="50" step="1" />
			</label>
		</div>

		<div class="control-group">
			<label>
				Bin Size: {binSize}
				<input type="range" bind:value={binSize} min="1" max="15" step="1" />
			</label>
		</div>

		<div class="control-group">
			<label>
				Cell Border Width: {cellBorderWidth}
				<input type="range" bind:value={cellBorderWidth} min="0" max="3" step="0.5" />
			</label>
		</div>
	</div>

	<div class="chart-wrapper">
		<Chart
			options={chartOptions}
			width="100%"
			height={600}
			autoResize={true}
			onCreate={(c) => {
				chart = c;
				console.log('Chart created!');
			}}
		>
			<!-- Heatmap Series -->
			<CustomSeries
				view={new HeatMapSeries()}
				reactiveData={heatmapData}
				options={{
					cellShader,
					cellBorderWidth,
					cellBorderColor: 'transparent',
					lastValueVisible: false,
					priceLineVisible: false
				}}
			/>
		</Chart>
	</div>

	<div class="info-section">
		<h2>How It Works</h2>

		<p>
			This heatmap visualization shows probability distributions at each time point. For every
			price value in the line series, a bell curve (normal distribution) is generated to show the
			likelihood of the price being at different levels.
		</p>

		<div class="features">
			<h3>Features:</h3>
			<ul>
				<li><strong>Bell Curve Distribution</strong> - Gaussian distribution around each price point</li>
				<li><strong>Dynamic Spread</strong> - Adjust the width of the probability distribution</li>
				<li><strong>Configurable Bin Size</strong> - Control the granularity of price levels</li>
				<li><strong>Color Intensity</strong> - Darker colors indicate higher probability</li>
			</ul>
		</div>

		<div class="code-example">
			<h3>Usage Example:</h3>
			<pre><code>{`<script lang="ts">
  import { Chart, CustomSeries } from '$lib';
  import { HeatMapSeries } from '$lib/plugins/heatmap-series/heatmap-series';
  import { generateBellCurveHeatMapData } from '$lib/plugins/heatmap-series/bell-curve-data';
  
  const lineData = generateLineData(250);
  const heatmapData = generateBellCurveHeatMapData(lineData, 20, 5);
  
  const cellShader = (amount: number) => {
    const amt = 100 * (amount / maxAmount);
    return \`rgba(155-\${amt}, 0, 155+\${amt}, \${0.05 + amt * 0.01})\`;
  };
</script>

<Chart options={chartOptions}>
  <CustomSeries
    customSeriesView={new HeatMapSeries()}
    data={heatmapData}
    options={{
      cellShader,
      cellBorderWidth: 0
    }}
  />
  
  <CustomSeries type="Line" data={lineData} />
</Chart>`}</code></pre>
		</div>
	</div>

	<div class="back-link">
		<a href="/plugin-examples">← Back to Plugin Examples</a>
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

	.config-controls {
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

	.control-group label {
		display: block;
		color: #555;
		font-weight: 600;
		margin-bottom: 0.5rem;
	}

	input[type='range'] {
		width: 100%;
		margin-top: 0.5rem;
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
		margin-bottom: 1rem;
		color: #333;
	}

	.info-section p {
		color: #555;
		line-height: 1.6;
		margin-bottom: 2rem;
	}

	.features {
		background: #f9f9f9;
		padding: 1.5rem;
		border-radius: 8px;
		margin-bottom: 2rem;
	}

	.features h3 {
		margin-top: 0;
		color: #2196f3;
	}

	.features ul {
		list-style: none;
		padding: 0;
	}

	.features li {
		padding: 0.5rem 0;
		color: #555;
	}

	.code-example {
		background: #f9f9f9;
		padding: 1.5rem;
		border-radius: 8px;
		border-left: 4px solid #2196f3;
	}

	.code-example h3 {
		margin-top: 0;
		color: #2196f3;
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
