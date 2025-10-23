<script lang="ts">
	import { Chart, Series, SeriesPlugin } from '$lib';
	import { VolumeProfile, type VolumeProfileData } from '$lib/plugins/volume-profile';
	import type { IChartApi, ISeriesApi, LineData, UTCTimestamp } from 'lightweight-charts';

	let chart: IChartApi | undefined = $state();
	let lineSeries: ISeriesApi<'Line'> | undefined = $state();

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
	function generateLineData(count: number = 200): LineData<UTCTimestamp>[] {
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

	const lineData = generateLineData(200);

	// Volume Profile Configuration
	let vpPosition = $state(150);
	let vpWidth = $state(10);
	let vpBins = $state(15);

	// Generate volume profile data
	let volumeProfileData = $derived.by<VolumeProfileData>(() => {
		const basePrice = lineData[vpPosition]?.value ?? 100;
		const priceStep = Math.round(basePrice * 0.1);
		const profile = [];

		for (let i = 0; i < vpBins; i++) {
			profile.push({
				price: basePrice + i * priceStep,
				vol: Math.round(Math.random() * 20)
			});
		}

		return {
			time: lineData[vpPosition].time,
			profile,
			width: vpWidth
		};
	});

	// Create volume profile primitive
	let volumeProfile = $state<VolumeProfile | undefined>();

	$effect(() => {
		if (!chart || !lineSeries) return;

		// Create new volume profile with current data
		const profile = new VolumeProfile(chart, lineSeries, volumeProfileData);
		volumeProfile = profile;

		// Cleanup - will run when volumeProfileData changes or component unmounts
		return () => {
			// The SeriesPlugin component will handle detachment
			volumeProfile = undefined;
		};
	});

	function toggleTheme() {
		isDark = !isDark;
	}
</script>

<svelte:head>
	<title>Volume Profile - Lightweight Charts Svelte 5</title>
</svelte:head>

<div class="container">
	<h1>📊 Volume Profile</h1>

	<p class="intro">
		Volume Profile displays the distribution of volume across price levels at a specific time
		period. It helps identify key support/resistance levels and areas of high trading activity.
	</p>

	<div class="controls">
		<button onclick={toggleTheme}>Toggle Theme</button>
	</div>

	<!-- Configuration Controls -->
	<div class="config-controls">
		<div class="control-group">
			<label>
				Position (Day): {vpPosition}
				<input type="range" bind:value={vpPosition} min="10" max="190" step="5" />
			</label>
		</div>

		<div class="control-group">
			<label>
				Width (Bars): {vpWidth}
				<input type="range" bind:value={vpWidth} min="3" max="30" step="1" />
			</label>
		</div>

		<div class="control-group">
			<label>
				Price Bins: {vpBins}
				<input type="range" bind:value={vpBins} min="5" max="25" step="1" />
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
			<Series
				type="Line"
				data={lineData}
				options={{
					color: isDark ? '#2196f3' : '#1976d2',
					lineWidth: 2
				}}
				onCreate={(s) => {
					lineSeries = s;
				}}
			>
				{#if volumeProfile}
					<SeriesPlugin primitive={volumeProfile} />
				{/if}
			</Series>
		</Chart>
	</div>

	<div class="info-section">
		<h2>How It Works</h2>

		<p>
			Volume Profile shows how much trading volume occurred at each price level during a specified
			time period. Longer horizontal bars indicate more volume traded at that price level.
		</p>

		<div class="features">
			<h3>Features:</h3>
			<ul>
				<li>
					<strong>Volume Distribution</strong> - Visual representation of volume at different price
					levels
				</li>
				<li><strong>Key Levels</strong> - Identify support/resistance based on volume clusters</li>
				<li><strong>Configurable Width</strong> - Adjust the time period covered by the profile</li>
				<li><strong>Price Bins</strong> - Control the granularity of price level grouping</li>
				<li><strong>Auto-scaling</strong> - Automatically adjusts to fit within the visible range</li>
			</ul>
		</div>

		<div class="interpretation">
			<h3>Interpretation:</h3>
			<p>
				<strong>Point of Control (POC):</strong> The price level with the highest volume (longest bar)
				often acts as a strong support or resistance level.
			</p>
			<p>
				<strong>High Volume Nodes:</strong> Areas with significant volume indicate price levels where
				traders found value and engaged heavily.
			</p>
			<p>
				<strong>Low Volume Nodes:</strong> Areas with minimal volume may lead to faster price movements
				as there's less resistance.
			</p>
		</div>

		<div class="code-example">
			<h3>Usage Example:</h3>
			<pre><code>{`<script lang="ts">
  import { Chart, Series, SeriesPlugin } from '$lib';
  import { VolumeProfile } from '$lib/plugins/volume-profile/volume-profile';
  
  let chart: IChartApi | undefined;
  let lineSeries: ISeriesApi<'Line'> | undefined;
  
  const lineData = generateLineData();
  const basePrice = lineData[lineData.length - 50].value;
  const priceStep = Math.round(basePrice * 0.1);
  
  // Create volume profile data
  const profile = [];
  for (let i = 0; i < 15; i++) {
    profile.push({
      price: basePrice + i * priceStep,
      vol: Math.round(Math.random() * 20)
    });
  }
  
  const vpData = {
    time: lineData[lineData.length - 50].time,
    profile,
    width: 10 // number of bars width
  };
  
  // Create the volume profile primitive
  const volumeProfile = $derived(() => {
    if (!chart || !lineSeries) return undefined;
    return new VolumeProfile(chart, lineSeries, vpData);
  });
</script>

<Chart onCreate={(c) => chart = c}>
  <Series
    type="Line"
    data={lineData}
    onCreate={(s) => lineSeries = s}
  >
    {#if volumeProfile}
      <SeriesPlugin primitive={volumeProfile} />
    {/if}
  </Series>
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
		margin-bottom: 1.5rem;
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

	.interpretation {
		background: #f9f9f9;
		padding: 1.5rem;
		border-radius: 8px;
		margin-bottom: 2rem;
	}

	.interpretation h3 {
		margin-top: 0;
		color: #2196f3;
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
