<script lang="ts">
	import { Chart, Series, SeriesMarkers, type SeriesMarker } from '$lib';
	import type { IChartApi, ISeriesApi, CandlestickData, UTCTimestamp } from 'lightweight-charts';

	let chart: IChartApi | undefined = $state();
	let candleSeries: ISeriesApi<'Candlestick'> | undefined = $state();

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

	// Candlestick options
	let candlestickOptions = $derived({
		upColor: '#26a69a',
		downColor: '#ef5350',
		borderVisible: false,
		wickUpColor: '#26a69a',
		wickDownColor: '#ef5350'
	});

	// Generate candlestick data
	function generateCandlestickData(count: number = 200): CandlestickData<UTCTimestamp>[] {
		const data: CandlestickData<UTCTimestamp>[] = [];
		const startDate = new Date(2024, 0, 1);
		let currentPrice = 100;

		for (let i = 0; i < count; i++) {
			const date = new Date(startDate);
			date.setDate(date.getDate() + i);
			const time = (date.getTime() / 1000) as UTCTimestamp;

			const open = currentPrice;
			const change = (Math.random() - 0.5) * 6;
			const close = open + change;
			const high = Math.max(open, close) + Math.random() * 3;
			const low = Math.min(open, close) - Math.random() * 3;

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

	const candleData = generateCandlestickData(200);

	// Create markers based on the data
	let markers = $state<SeriesMarker<UTCTimestamp>[]>([]);

	// Initialize markers
	$effect(() => {
		if (candleData.length === 0) return;

		// Find some interesting points in the data
		const datesForMarkers = [
			candleData[Math.floor(candleData.length * 0.2)],
			candleData[Math.floor(candleData.length * 0.4)],
			candleData[Math.floor(candleData.length * 0.6)],
			candleData[Math.floor(candleData.length * 0.8)]
		];

		// Find min and max price points
		let minIndex = 0;
		let maxIndex = 0;
		for (let i = 1; i < datesForMarkers.length; i++) {
			if (datesForMarkers[i].low < datesForMarkers[minIndex].low) {
				minIndex = i;
			}
			if (datesForMarkers[i].high > datesForMarkers[maxIndex].high) {
				maxIndex = i;
			}
		}

		const newMarkers: SeriesMarker<UTCTimestamp>[] = [];

		// Add a "D" marker at the beginning
		newMarkers.push({
			time: candleData[Math.floor(candleData.length * 0.1)].time,
			position: 'aboveBar',
			color: '#f68410',
			shape: 'circle',
			text: 'D',
		});

		// Add buy/sell markers
		datesForMarkers.forEach((candle, i) => {
			if (i === minIndex) {
				newMarkers.push({
					time: candle.time,
					position: 'belowBar',
					color: '#2196F3',
					shape: 'arrowUp',
					text: 'Buy @ ' + Math.floor(candle.low - 2),
				});
			} else if (i === maxIndex) {
				newMarkers.push({
					time: candle.time,
					position: 'aboveBar',
					color: '#e91e63',
					shape: 'arrowDown',
					text: 'Sell @ ' + Math.floor(candle.high + 2),
				});
			}
		});

		markers = newMarkers;
	});

	// Interactive marker state
	let newMarkerPosition = $state<'aboveBar' | 'belowBar' | 'inBar'>('aboveBar');
	let newMarkerShape = $state<'circle' | 'square' | 'arrowUp' | 'arrowDown'>('circle');
	let newMarkerColor = $state('#f68410');
	let newMarkerText = $state('New');
	let selectedTimeIndex = $state(100);

	function addMarker() {
		if (!candleData[selectedTimeIndex]) return;

		const newMarker: SeriesMarker<UTCTimestamp> = {
			time: candleData[selectedTimeIndex].time,
			position: newMarkerPosition,
			color: newMarkerColor,
			shape: newMarkerShape,
			text: newMarkerText,
			size: 3
		};

		markers = [...markers, newMarker];
	}

	function clearMarkers() {
		markers = [];
	}

	function toggleTheme() {
		isDark = !isDark;
	}
</script>

<svelte:head>
	<title>Series Markers - Lightweight Charts Svelte 5</title>
</svelte:head>

<div class="container">
	<h1>📍 Series Markers</h1>

	<p class="intro">
		Series markers are annotations that can be placed at specific points on the chart. They're perfect for
		highlighting important events, buy/sell signals, or other significant data points.
	</p>

	<div class="controls">
		<button onclick={toggleTheme}>Toggle Theme</button>
		<button onclick={clearMarkers} class="danger">Clear All Markers</button>
	</div>

	<!-- Add Marker Form -->
	<div class="marker-form">
		<h3>Add Custom Marker</h3>
		<div class="form-grid">
			<div class="form-group">
				<label>
					Text:
					<input type="text" bind:value={newMarkerText} placeholder="Marker text" />
				</label>
			</div>

			<div class="form-group">
				<label>
					Position:
					<select bind:value={newMarkerPosition}>
						<option value="aboveBar">Above Bar</option>
						<option value="belowBar">Below Bar</option>
						<option value="inBar">In Bar</option>
					</select>
				</label>
			</div>

			<div class="form-group">
				<label>
					Shape:
					<select bind:value={newMarkerShape}>
						<option value="circle">Circle</option>
						<option value="square">Square</option>
						<option value="arrowUp">Arrow Up</option>
						<option value="arrowDown">Arrow Down</option>
					</select>
				</label>
			</div>

			<div class="form-group">
				<label>
					Color:
					<input type="color" bind:value={newMarkerColor} />
				</label>
			</div>

			<div class="form-group">
				<label>
					Time Index: {selectedTimeIndex}
					<input type="range" bind:value={selectedTimeIndex} min="0" max={candleData.length - 1} step="1" />
				</label>
			</div>

			<div class="form-group">
				<button onclick={addMarker} class="add-btn">Add Marker</button>
			</div>
		</div>
	</div>

	<!-- Chart -->
	<div class="chart-wrapper">
		<Chart
			options={chartOptions}
			width="100%"
			height={600}
			autoResize={true}
			onCreate={(c) => {
				chart = c;
			}}
		>
			<Series
				type="Candlestick"
				data={candleData}
				options={candlestickOptions}
				onCreate={(s) => {
					candleSeries = s;
				}}
			>
				<SeriesMarkers markers={markers} />
			</Series>
		</Chart>
	</div>

	<!-- Info Section -->
	<div class="info-section">
		<h2>About Series Markers</h2>

		<p>
			Series markers are annotations that attach to specific data points on your chart. They automatically
			position themselves based on the data values and your specified position preference.
		</p>

		<div class="features">
			<h3>Features:</h3>
			<ul>
				<li><strong>Position Options</strong> - Above bar, below bar, or in bar</li>
				<li><strong>Multiple Shapes</strong> - Circle, square, arrow up, arrow down</li>
				<li><strong>Custom Colors</strong> - Any color to match your theme</li>
				<li><strong>Text Labels</strong> - Optional text to describe the marker</li>
				<li><strong>Reactive Updates</strong> - Markers update automatically when data changes</li>
			</ul>
		</div>

		<div class="code-example">
			<h3>Usage Example:</h3>
			<pre><code>{`<script lang="ts">
  import { Chart, Series, SeriesMarkers } from '$lib';

  const markers = [
    {
      time: { year: 2024, month: 1, day: 15 },
      position: 'aboveBar',
      color: '#f68410',
      shape: 'circle',
      text: 'Event A',
    },
    {
      time: { year: 2024, month: 2, day: 10 },
      position: 'belowBar',
      color: '#2196F3',
      shape: 'arrowUp',
      text: 'Buy Signal',
    },
  ];
</script>

<Chart options={chartOptions}>
  <Series type="Candlestick" data={candleData}>
    <SeriesMarkers markers={markers} />
  </Series>
</Chart>`}</code></pre>
		</div>

		<div class="marker-info">
			<h3>Current Markers: {markers.length}</h3>
			<div class="markers-list">
				{#each markers as marker, i}
					<div class="marker-item">
						<span class="marker-icon" style:background-color={marker.color}>{marker.shape}</span>
						<span class="marker-text">{marker.text || `Marker ${i + 1}`}</span>
						<span class="marker-position">{marker.position}</span>
						<button
							onclick={() => {
								markers = markers.filter((_, idx) => idx !== i);
							}}
							class="remove-marker"
						>
							×
						</button>
					</div>
				{/each}
			</div>
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

	button.danger {
		border-color: #ef5350;
		color: #ef5350;
	}

	button.danger:hover {
		background: #ef5350;
		color: white;
		box-shadow: 0 4px 12px rgba(239, 83, 80, 0.3);
	}

	button.add-btn {
		width: 100%;
		background: #2196f3;
		color: white;
	}

	.marker-form {
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		color: white;
		padding: 1.5rem;
		border-radius: 12px;
		margin-bottom: 2rem;
	}

	.marker-form h3 {
		margin-top: 0;
		margin-bottom: 1rem;
	}

	.form-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: 1rem;
	}

	.form-group {
		display: flex;
		flex-direction: column;
	}

	.form-group label {
		font-size: 0.9rem;
		margin-bottom: 0.5rem;
		font-weight: 600;
	}

	.form-group input,
	.form-group select {
		padding: 0.5rem;
		border-radius: 6px;
		border: 1px solid rgba(255, 255, 255, 0.3);
		background: rgba(255, 255, 255, 0.9);
		color: #333;
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
		margin-bottom: 2rem;
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

	.marker-info {
		background: #f9f9f9;
		padding: 1.5rem;
		border-radius: 8px;
		margin-bottom: 2rem;
	}

	.marker-info h3 {
		margin-top: 0;
		color: #2196f3;
	}

	.markers-list {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		max-height: 300px;
		overflow-y: auto;
	}

	.marker-item {
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: 0.75rem;
		background: white;
		border-radius: 6px;
		border: 1px solid #e0e0e0;
	}

	.marker-icon {
		width: 32px;
		height: 32px;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		color: white;
		font-size: 0.8rem;
		font-weight: bold;
	}

	.marker-text {
		flex: 1;
		color: #333;
		font-weight: 500;
	}

	.marker-position {
		color: #666;
		font-size: 0.9rem;
	}

	.remove-marker {
		width: 24px;
		height: 24px;
		padding: 0;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 1.2rem;
		border-color: #ef5350;
		color: #ef5350;
	}

	.remove-marker:hover {
		background: #ef5350;
		color: white;
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

	@media (max-width: 768px) {
		.container {
			padding: 1rem;
		}

		.form-grid {
			grid-template-columns: 1fr;
		}

		.controls {
			flex-direction: column;
		}
	}

	@media (prefers-color-scheme: dark) {
		.container {
			color: #ddd;
		}

		h1 {
			color: #fff;
		}

		.intro,
		.info-section p {
			color: #bbb;
		}

		.features,
		.code-example,
		.marker-info {
			background: #2d2d2d;
		}

		.marker-item {
			background: #2d2d2d;
			border-color: #444;
		}

		.marker-text {
			color: #ddd;
		}

		.marker-position {
			color: #999;
		}
	}
</style>
