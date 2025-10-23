<script lang="ts">
	import { Chart, Series, SeriesPlugin, type IChartApi } from '$lib';
	import { UserPriceManager } from '$lib/plugins/user-price-manager/user-price-manager';
	import type { UserAlertInfo } from '$lib/plugins/user-price-alerts/state';
	import type { AreaData } from 'lightweight-charts';

	// Generate sample data
	function generateData(): AreaData[] {
		const data: AreaData[] = [];
		const basePrice = 100;
		let time = new Date(2023, 0, 1).getTime() / 1000;

		for (let i = 0; i < 100; i++) {
			const value = basePrice + Math.sin(i / 10) * 20 + Math.random() * 10;
			data.push({
				time: time as any,
				value
			});
			time += 24 * 60 * 60;
		}

		return data;
	}

	let chartData = $state(generateData());

	let chartOptions = $state({
		layout: {
			background: { color: '#1e1e1e' },
			textColor: '#d1d4dc'
		},
		grid: {
			vertLines: { color: '#2b2b43' },
			horzLines: { color: '#2b2b43' }
		},
		timeScale: {
			borderColor: '#485c7b'
		},
		rightPriceScale: {
			borderColor: '#485c7b'
		}
	});

	let seriesOptions = $state({
		lineColor: 'rgb(4,153,129)',
		topColor: 'rgba(4,153,129, 0.4)',
		bottomColor: 'rgba(4,153,129, 0)',
		priceLineVisible: false
	});

	// Create the combined price manager plugin
	let priceManager = $state(
		new UserPriceManager({
			alertColor: '#FF6B6B',
			lineColor: '#4A90E2',
			symbolName: 'AAPL'
		})
	);

	let chart: IChartApi | undefined = $state();
	let eventLog = $state<string[]>([]);

	// Subscribe to events
	$effect(() => {
		priceManager.alertAdded().subscribe((alert: UserAlertInfo) => {
			const message = `🔔 Alert added at ${alert.price.toFixed(2)} (ID: ${alert.id})`;
			eventLog = [message, ...eventLog].slice(0, 10);
		});

		priceManager.alertRemoved().subscribe((id: string) => {
			const message = `❌ Alert removed (ID: ${id})`;
			eventLog = [message, ...eventLog].slice(0, 10);
		});
	});

	function refreshData() {
		chartData = generateData();
	}

	function toggleTheme() {
		const isDark = chartOptions.layout.background.color === '#1e1e1e';
		chartOptions = {
			...chartOptions,
			layout: {
				background: { color: isDark ? '#ffffff' : '#1e1e1e' },
				textColor: isDark ? '#191919' : '#d1d4dc'
			},
			grid: {
				vertLines: { color: isDark ? '#e1e1e1' : '#2b2b43' },
				horzLines: { color: isDark ? '#e1e1e1' : '#2b2b43' }
			}
		};
	}
</script>

<div class="container">
	<h1>Combined Price Manager</h1>
	<p class="subtitle">
		Manage both price alerts and price lines from a unified interface
	</p>

	<div class="instructions">
		<h3>How to Use:</h3>
		<div class="instruction-grid">
			<div class="instruction-item alert">
				<div class="icon-demo alert-icon">🔔</div>
				<h4>Price Alerts (Red Button)</h4>
				<p>
					Hover near the price scale to reveal buttons. Click the <strong>red button (left)</strong> to
					add a price alert with notifications.
				</p>
			</div>
			<div class="instruction-item line">
				<div class="icon-demo line-icon">+</div>
				<h4>Price Lines (Blue Button)</h4>
				<p>
					Click the <strong>blue button (right)</strong> to add a regular price line without
					alerts.
				</p>
			</div>
		</div>
	</div>

	<div class="chart-wrapper">
		<Chart
			options={chartOptions}
			width="100%"
			height={500}
			autoResize={true}
			onCreate={(c) => {
				chart = c;
				console.log('Chart with price manager created!');
			}}
		>
			<Series type="Area" reactiveData={chartData} options={seriesOptions}>
				<SeriesPlugin
					primitive={priceManager}
					onAttach={() => console.log('Price manager attached!')}
				/>
			</Series>
		</Chart>
	</div>

	{#if eventLog.length > 0}
		<div class="event-log">
			<h3>Event Log:</h3>
			<ul>
				{#each eventLog as event}
					<li>{event}</li>
				{/each}
			</ul>
		</div>
	{/if}

	<div class="controls">
		<button onclick={refreshData}>Refresh Data</button>
		<button onclick={toggleTheme}>Toggle Theme</button>
	</div>

	<section class="features">
		<h2>Features</h2>
		<div class="feature-grid">
			<div class="feature-card">
				<h3>🔔 Price Alerts</h3>
				<ul>
					<li>Visual alert indicators</li>
					<li>Event notifications</li>
					<li>Removable with hover button</li>
					<li>Custom alert colors</li>
				</ul>
			</div>
			<div class="feature-card">
				<h3>📏 Price Lines</h3>
				<ul>
					<li>Simple dashed lines</li>
					<li>No event overhead</li>
					<li>Quick visual markers</li>
					<li>Custom line colors</li>
				</ul>
			</div>
			<div class="feature-card">
				<h3>🎯 Unified Interface</h3>
				<ul>
					<li>Two buttons side-by-side</li>
					<li>Color-coded (red/blue)</li>
					<li>Hover to reveal</li>
					<li>Intuitive interaction</li>
				</ul>
			</div>
		</div>
	</section>

	<section class="code-section">
		<h2>Usage Example</h2>
		<pre><code>{`<script lang="ts">
  import { Chart, Series, SeriesPlugin } from '$lib';
  import { UserPriceManager } from '$lib/plugins/user-price-manager';

  // Create the combined manager
  let priceManager = new UserPriceManager({
    alertColor: '#FF6B6B',  // Red for alerts
    lineColor: '#4A90E2',   // Blue for lines
    symbolName: 'AAPL'
  });

  // Subscribe to alert events
  priceManager.alertAdded().subscribe((alert) => {
    console.log(\`Alert added at \${alert.price}\`);
  });

  priceManager.alertRemoved().subscribe((id) => {
    console.log(\`Alert removed: \${id}\`);
  });
</script>

<Chart>
  <Series type="Area" data={chartData}>
    <SeriesPlugin primitive={priceManager} />
  </Series>
</Chart>`}</code></pre>
	</section>

	<section class="comparison">
		<h2>Alert vs Line Comparison</h2>
		<table>
			<thead>
				<tr>
					<th>Feature</th>
					<th>Price Alert (Red)</th>
					<th>Price Line (Blue)</th>
				</tr>
			</thead>
			<tbody>
				<tr>
					<td>Visual Indicator</td>
					<td>✅ Dashed line + Label</td>
					<td>✅ Dashed line only</td>
				</tr>
				<tr>
					<td>Event Notifications</td>
					<td>✅ Yes (alertAdded, alertRemoved)</td>
					<td>❌ No</td>
				</tr>
				<tr>
					<td>Removable</td>
					<td>✅ Click X button</td>
					<td>⚠️ Via chart API only</td>
				</tr>
				<tr>
					<td>Shows Price/Symbol</td>
					<td>✅ Yes</td>
					<td>❌ No</td>
				</tr>
				<tr>
					<td>Performance</td>
					<td>⚠️ More overhead</td>
					<td>✅ Lightweight</td>
				</tr>
				<tr>
					<td>Use Case</td>
					<td>Important price levels</td>
					<td>Quick visual markers</td>
				</tr>
			</tbody>
		</table>
	</section>

	<div class="back-link">
		<a href="/">← Back to Main Demo</a>
		<a href="/plugin-examples">View Other Plugin Examples →</a>
	</div>
</div>

<style>
	.container {
		padding: 2rem;
		max-width: 1400px;
		margin: 0 auto;
		font-family: system-ui, -apple-system, sans-serif;
		color: #333;
	}

	h1 {
		margin-bottom: 0.5rem;
		color: #1a1a1a;
	}

	.subtitle {
		color: #666;
		font-size: 1.1rem;
		margin-bottom: 2rem;
	}

	.instructions {
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		color: white;
		padding: 2rem;
		border-radius: 12px;
		margin-bottom: 2rem;
		box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
	}

	.instructions h3 {
		margin-top: 0;
		font-size: 1.3rem;
	}

	.instruction-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 1.5rem;
		margin-top: 1rem;
	}

	.instruction-item {
		background: rgba(255, 255, 255, 0.1);
		padding: 1.5rem;
		border-radius: 8px;
		backdrop-filter: blur(10px);
	}

	.instruction-item h4 {
		margin: 0.5rem 0;
		font-size: 1.1rem;
	}

	.instruction-item p {
		margin: 0;
		opacity: 0.9;
		line-height: 1.5;
	}

	.icon-demo {
		width: 50px;
		height: 50px;
		border-radius: 8px;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 1.5rem;
		margin-bottom: 0.5rem;
	}

	.alert-icon {
		background: #ff6b6b;
	}

	.line-icon {
		background: #4a90e2;
	}

	.chart-wrapper {
		margin-bottom: 2rem;
		border: 1px solid #ddd;
		border-radius: 8px;
		overflow: hidden;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
	}

	.event-log {
		background: #f8f9fa;
		padding: 1.5rem;
		border-radius: 8px;
		margin-bottom: 1.5rem;
		border-left: 4px solid #667eea;
	}

	.event-log h3 {
		margin-top: 0;
		color: #333;
	}

	.event-log ul {
		list-style: none;
		padding: 0;
		margin: 0;
	}

	.event-log li {
		padding: 0.6rem;
		margin: 0.4rem 0;
		background: white;
		border-radius: 4px;
		font-family: 'Courier New', monospace;
		font-size: 0.9rem;
		border: 1px solid #e0e0e0;
	}

	.controls {
		display: flex;
		gap: 0.5rem;
		margin-bottom: 2rem;
	}

	button {
		padding: 0.7rem 1.4rem;
		background: #2962ff;
		color: white;
		border: none;
		border-radius: 6px;
		cursor: pointer;
		font-size: 14px;
		font-weight: 500;
		transition: all 0.2s;
	}

	button:hover {
		background: #1e4fd9;
		transform: translateY(-1px);
		box-shadow: 0 4px 8px rgba(41, 98, 255, 0.3);
	}

	.features {
		margin: 3rem 0;
	}

	.features h2 {
		margin-bottom: 1.5rem;
	}

	.feature-grid {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 1.5rem;
	}

	.feature-card {
		background: #f8f9fa;
		padding: 1.5rem;
		border-radius: 8px;
		border: 1px solid #e0e0e0;
	}

	.feature-card h3 {
		margin-top: 0;
		color: #333;
		font-size: 1.1rem;
	}

	.feature-card ul {
		margin: 0;
		padding-left: 1.3rem;
	}

	.feature-card li {
		margin: 0.5rem 0;
		color: #555;
	}

	.code-section {
		background: #2d2d2d;
		padding: 2rem;
		border-radius: 8px;
		margin: 2rem 0;
	}

	.code-section h2 {
		color: white;
		margin-top: 0;
	}

	pre {
		margin: 0;
		overflow-x: auto;
	}

	code {
		font-family: 'Courier New', monospace;
		font-size: 0.9rem;
		line-height: 1.6;
		color: #f8f8f2;
	}

	.comparison {
		margin: 3rem 0;
	}

	table {
		width: 100%;
		border-collapse: collapse;
		background: white;
		border-radius: 8px;
		overflow: hidden;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
	}

	thead {
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		color: white;
	}

	th,
	td {
		padding: 1rem;
		text-align: left;
		border-bottom: 1px solid #e0e0e0;
	}

	th {
		font-weight: 600;
	}

	tbody tr:hover {
		background: #f8f9fa;
	}

	tbody tr:last-child td {
		border-bottom: none;
	}

	.back-link {
		display: flex;
		justify-content: space-between;
		margin-top: 3rem;
		padding-top: 2rem;
		border-top: 2px solid #e0e0e0;
	}

	.back-link a {
		color: #667eea;
		text-decoration: none;
		font-weight: 500;
		transition: all 0.2s;
	}

	.back-link a:hover {
		color: #764ba2;
		transform: translateX(-2px);
	}

	@media (max-width: 768px) {
		.instruction-grid,
		.feature-grid {
			grid-template-columns: 1fr;
		}

		.container {
			padding: 1rem;
		}

		.back-link {
			flex-direction: column;
			gap: 1rem;
		}
	}

	@media (prefers-color-scheme: dark) {
		.container {
			color: #ddd;
		}

		h1 {
			color: #fff;
		}

		.subtitle {
			color: #bbb;
		}

		.feature-card,
		.event-log {
			background: #2d2d2d;
		}

		.chart-wrapper {
			border-color: #444;
		}

		table {
			background: #2d2d2d;
			color: #ddd;
		}

		thead {
			background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		}

		tbody tr:hover {
			background: #3a3a3a;
		}
	}
</style>
