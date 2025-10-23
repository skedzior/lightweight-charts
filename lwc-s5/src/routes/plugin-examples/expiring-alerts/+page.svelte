<script lang="ts">
	import { Chart, Series } from '$lib';
	import { ExpiringPriceAlerts } from '$lib/plugins/expiring-price-alerts';
	import type { IChartApi, ISeriesApi, LineData, UTCTimestamp } from 'lightweight-charts';

	let chart: IChartApi | undefined = $state();
	let lineSeries: ISeriesApi<'Line'> | undefined = $state();
	let alertsPlugin: ExpiringPriceAlerts | undefined = $state();

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
	const startTime = lineData[0].time as number;
	const endTime = lineData[lineData.length - 1].time as number;

	// Alert form state
	let newAlertPrice = $state(105);
	let newAlertTitle = $state('Alert');
	let newAlertDirection = $state<'up' | 'down'>('up');
	let newAlertStartDays = $state(50);
	let newAlertEndDays = $state(150);

	function toggleTheme() {
		isDark = !isDark;
	}

	function addAlert() {
		if (!alertsPlugin) return;

		const alertStartTime = startTime + newAlertStartDays * 86400;
		const alertEndTime = startTime + newAlertEndDays * 86400;

		alertsPlugin.addExpiringAlert(newAlertPrice, alertStartTime, alertEndTime, {
			title: newAlertTitle,
			crossingDirection: newAlertDirection
		});

		console.log('Alert added:', {
			price: newAlertPrice,
			title: newAlertTitle,
			direction: newAlertDirection
		});
	}

	// Accept plugin instance as parameter to avoid reading from state in effects
	// For button clicks, plugin parameter is optional and reads from state
	function addSampleAlerts(plugin?: ExpiringPriceAlerts) {
		const targetPlugin = plugin ?? alertsPlugin;
		if (!targetPlugin) return;

		// Add a few sample alerts
		const midTime = startTime + 100 * 86400;

		targetPlugin.addExpiringAlert(105, startTime + 50 * 86400, midTime, {
			title: 'Buy Signal',
			crossingDirection: 'up'
		});

		targetPlugin.addExpiringAlert(95, midTime, endTime, {
			title: 'Sell Signal',
			crossingDirection: 'down'
		});

		targetPlugin.addExpiringAlert(110, startTime + 80 * 86400, startTime + 120 * 86400, {
			title: 'Resistance',
			crossingDirection: 'up'
		});
	}

	// Initialize alerts plugin when series is created
	$effect(() => {
		if (!lineSeries) return;

		// Create new plugin instance
		const plugin = new ExpiringPriceAlerts(lineSeries, {
			interval: 86400, // 1 day
			clearTimeout: 3000
		});

		alertsPlugin = plugin;

		// Add sample alerts - pass plugin instance to avoid state dependency
		addSampleAlerts(plugin);

		// Cleanup function
		return () => {
			plugin.destroy();
			if (alertsPlugin === plugin) {
				alertsPlugin = undefined;
			}
		};
	});
</script>

<svelte:head>
	<title>Expiring Price Alerts - Lightweight Charts Svelte 5</title>
</svelte:head>

<div class="container">
	<h1>🔔 Expiring Price Alerts</h1>

	<p class="intro">
		Time-based price alerts that expire after a specific date. Visualize buy/sell signals and
		resistance levels with automatic crossing detection and expiration handling.
	</p>

	<div class="controls">
		<button onclick={toggleTheme}>Toggle Theme</button>
		<button onclick={addSampleAlerts}>Reset Sample Alerts</button>
	</div>

	<!-- Alert Configuration -->
	<div class="alert-form">
		<h3>Add New Alert</h3>
		<div class="form-grid">
			<div class="form-group">
				<label>
					Alert Title:
					<input type="text" bind:value={newAlertTitle} placeholder="Enter alert name" />
				</label>
			</div>

			<div class="form-group">
				<label>
					Price Level: {newAlertPrice.toFixed(2)}
					<input type="range" bind:value={newAlertPrice} min="80" max="120" step="0.5" />
				</label>
			</div>

			<div class="form-group">
				<label>
					Direction:
					<select bind:value={newAlertDirection}>
						<option value="up">Upward Cross</option>
						<option value="down">Downward Cross</option>
					</select>
				</label>
			</div>

			<div class="form-group">
				<label>
					Start Day: {newAlertStartDays}
					<input type="range" bind:value={newAlertStartDays} min="0" max="180" step="5" />
				</label>
			</div>

			<div class="form-group">
				<label>
					End Day: {newAlertEndDays}
					<input type="range" bind:value={newAlertEndDays} min="10" max="200" step="5" />
				</label>
			</div>

			<div class="form-group">
				<button onclick={addAlert} class="add-button">Add Alert</button>
			</div>
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
			/>
		</Chart>
	</div>

	<div class="info-section">
		<h2>How It Works</h2>

		<p>
			Expiring price alerts display time-bounded price levels with visual indicators. The alerts
			automatically detect when the price crosses the alert level and can expire after a specified
			date.
		</p>

		<div class="features">
			<h3>Features:</h3>
			<ul>
				<li><strong>Time-Bounded</strong> - Alerts are only active between start and end dates</li>
				<li>
					<strong>Crossing Detection</strong> - Automatically detects upward or downward crosses
				</li>
				<li><strong>Visual States</strong> - Different colors for active, crossed, and expired</li>
				<li><strong>Auto-Cleanup</strong> - Expired alerts fade out and are automatically removed</li>
				<li><strong>Directional</strong> - Support for both upward and downward crossing alerts</li>
			</ul>
		</div>

		<div class="legend">
			<h3>Alert States:</h3>
			<div class="legend-items">
				<div class="legend-item">
					<span class="color-box" style="background: #64C750;"></span>
					<span>Active Upward Alert</span>
				</div>
				<div class="legend-item">
					<span class="color-box" style="background: #C83264;"></span>
					<span>Active Downward Alert</span>
				</div>
				<div class="legend-item">
					<span class="color-box" style="background: #386D2E;"></span>
					<span>Crossed (Triggered)</span>
				</div>
				<div class="legend-item">
					<span class="color-box" style="background: #30472C;"></span>
					<span>Expired</span>
				</div>
			</div>
		</div>

		<div class="code-example">
			<h3>Usage Example:</h3>
			<pre><code>{`<script lang="ts">
  import { Chart, Series } from '$lib';
  import { ExpiringPriceAlerts } from '$lib/plugins/expiring-price-alerts/expiring-price-alerts';
  
  let lineSeries: ISeriesApi<'Line'> | undefined;
  let alertsPlugin: ExpiringPriceAlerts | undefined;
  
  $effect(() => {
    if (lineSeries && !alertsPlugin) {
      alertsPlugin = new ExpiringPriceAlerts(lineSeries, {
        interval: 86400, // 1 day in seconds
        clearTimeout: 3000
      });
      
      // Add an alert
      alertsPlugin.addExpiringAlert(
        105,              // price level
        startTime,        // start date (timestamp)
        endTime,          // end date (timestamp)
        {
          title: 'Buy Signal',
          crossingDirection: 'up'
        }
      );
      
      return () => alertsPlugin?.destroy();
    }
  });
</script>

<Chart>
  <Series
    type="Line"
    data={lineData}
    onCreate={(s) => lineSeries = s}
  />
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

	.alert-form {
		background: #f5f5f5;
		padding: 1.5rem;
		border-radius: 12px;
		margin-bottom: 2rem;
	}

	.alert-form h3 {
		margin-top: 0;
		color: #2196f3;
		margin-bottom: 1rem;
	}

	.form-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
		gap: 1rem;
	}

	.form-group {
		background: white;
		padding: 1rem;
		border-radius: 8px;
	}

	.form-group label {
		display: block;
		color: #555;
		font-weight: 600;
		margin-bottom: 0.5rem;
	}

	.form-group input[type='text'],
	.form-group select {
		width: 100%;
		padding: 0.5rem;
		border: 1px solid #ddd;
		border-radius: 4px;
		font-size: 1rem;
		margin-top: 0.5rem;
	}

	.form-group input[type='range'] {
		width: 100%;
		margin-top: 0.5rem;
	}

	.add-button {
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

	.legend {
		background: #f9f9f9;
		padding: 1.5rem;
		border-radius: 8px;
		margin-bottom: 2rem;
	}

	.legend h3 {
		margin-top: 0;
		color: #2196f3;
	}

	.legend-items {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: 1rem;
	}

	.legend-item {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.color-box {
		width: 30px;
		height: 20px;
		border-radius: 4px;
		border: 1px solid #ddd;
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
