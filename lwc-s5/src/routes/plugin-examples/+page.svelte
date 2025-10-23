<script lang="ts">
	import { Chart, Series, CustomSeries, SeriesPlugin, type IChartApi } from '$lib';
	import { UserPriceAlerts } from '$lib/plugins/user-price-alerts/user-price-alerts';
	import { HeatMapSeries } from '$lib/plugins/heatmap-series/heatmap-series';
	import type { HeatMapData } from '$lib/plugins/heatmap-series/data';
	import type { UserAlertInfo } from '$lib/plugins/user-price-alerts/state';
	import type { AreaData } from 'lightweight-charts';

	// Generate sample area series data
	function generateAreaData(): AreaData[] {
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

	// Generate heatmap data
	function generateHeatmapData(): HeatMapData[] {
		const data: HeatMapData[] = [];
		let time = new Date(2023, 0, 1).getTime() / 1000;

		for (let i = 0; i < 100; i++) {
			const cells = [];
			// Create 10 cells per time point at different price levels
			for (let j = 0; j < 10; j++) {
				const amount = Math.random() * 30 + (Math.sin(i / 5) + 1) * 10;
				cells.push({
					low: 90 + j * 10,
					high: 100 + j * 10,
					amount: amount
				});
			}

			data.push({
				time: time as any,
				cells
			});

			time += 24 * 60 * 60;
		}

		return data;
	}

	// Color function for heatmap
	function turboColor(t: number): string {
		t = Math.max(0, Math.min(1, t));
		const r = Math.max(
			0,
			Math.min(
				255,
				Math.round(
					34.61 + t * (1172.33 - t * (10793.56 - t * (33300.12 - t * (38394.49 - t * 14825.05))))
				)
			)
		);
		const g = Math.max(
			0,
			Math.min(
				255,
				Math.round(
					23.31 + t * (557.33 + t * (1225.33 - t * (3574.96 - t * (1073.77 + t * 707.56))))
				)
			)
		);
		const b = Math.max(
			0,
			Math.min(
				255,
				Math.round(
					27.2 + t * (3211.1 - t * (15327.97 - t * (27814 - t * (22569.18 - t * 6838.66))))
				)
			)
		);
		return `rgb(${r}, ${g}, ${b})`;
	}

	const cellShader = (amount: number) => {
		const maxAmount = 40;
		return turboColor(amount / maxAmount);
	};

	// Data
	let areaData = $state(generateAreaData());
	let heatmapData = $state(generateHeatmapData());

	// Chart options
	let areaChartOptions = $state({
		layout: {
			background: { color: '#1e1e1e' },
			textColor: '#d1d4dc'
		},
		grid: {
			vertLines: { visible: false },
			horzLines: { visible: false }
		},
		timeScale: {
			borderVisible: false
		},
		rightPriceScale: {
			borderVisible: false
		},
		crosshair: {
			horzLine: {
				visible: false,
				labelVisible: false
			}
		},
		handleScale: false,
		handleScroll: false
	});

	let heatmapChartOptions = $state({
		layout: {
			background: { color: '#1e1e1e' },
			textColor: '#d1d4dc'
		},
		timeScale: {
			barSpacing: 24
		},
		rightPriceScale: {
			scaleMargins: {
				top: 0.025,
				bottom: 0.025
			}
		}
	});

	// Series options
	let areaOptions = $state({
		lineColor: 'rgb(4,153,129)',
		topColor: 'rgba(4,153,129, 0.4)',
		bottomColor: 'rgba(4,153,129, 0)',
		priceLineVisible: false
	});

	// Plugin instances
	let priceAlertsPlugin = $state(new UserPriceAlerts());
	priceAlertsPlugin.setSymbolName('AAPL');

	let heatmapView = $state(new HeatMapSeries());
	let heatmapOptions = $state({ cellShader });

	// Chart references
	let areaChart: IChartApi | undefined = $state();
	let heatmapChart: IChartApi | undefined = $state();

	// Alert messages
	let alertMessages = $state<string[]>([]);

	// Subscribe to alert events
	$effect(() => {
		priceAlertsPlugin.alertAdded().subscribe((alertInfo: UserAlertInfo) => {
			const message = `✅ Alert added at price ${alertInfo.price.toFixed(2)} (ID: ${alertInfo.id})`;
			alertMessages = [message, ...alertMessages].slice(0, 5);
		});

		priceAlertsPlugin.alertRemoved().subscribe((id: string) => {
			const message = `❌ Alert removed (ID: ${id})`;
			alertMessages = [message, ...alertMessages].slice(0, 5);
		});
	});

	// Demo functions
	function refreshAreaData() {
		areaData = generateAreaData();
	}

	function refreshHeatmapData() {
		heatmapData = generateHeatmapData();
	}

	function toggleTheme() {
		const isDark = areaChartOptions.layout.background.color === '#1e1e1e';
		const newBg = isDark ? '#ffffff' : '#1e1e1e';
		const newText = isDark ? '#191919' : '#d1d4dc';

		areaChartOptions = {
			...areaChartOptions,
			layout: {
				background: { color: newBg },
				textColor: newText
			}
		};

		heatmapChartOptions = {
			...heatmapChartOptions,
			layout: {
				background: { color: newBg },
				textColor: newText
			}
		};
	}
</script>

<div class="container">
	<h1>Plugin Examples</h1>
	<p class="subtitle">Advanced plugin demonstrations with interactive features</p>

	<!-- Navigation Links -->
	<div class="nav-grid">
		<a href="/plugin-examples/series-markers" class="nav-card">
			<span class="icon">📍</span>
			<h3>Series Markers</h3>
			<p>Annotate charts with custom markers</p>
		</a>
		<a href="/plugin-examples/heatmap-bell-curve" class="nav-card">
			<span class="icon">📊</span>
			<h3>Heatmap Bell Curve</h3>
			<p>Probability distributions with bell curves</p>
		</a>
		<a href="/plugin-examples/expiring-alerts" class="nav-card">
			<span class="icon">🔔</span>
			<h3>Expiring Price Alerts</h3>
			<p>Time-bounded price level notifications</p>
		</a>
		<a href="/plugin-examples/volume-profile" class="nav-card">
			<span class="icon">📊</span>
			<h3>Volume Profile</h3>
			<p>Volume distribution across price levels</p>
		</a>
	</div>

	<!-- User Price Alerts Example -->
	<section class="example-section">
		<h2>1. User Price Alerts Plugin</h2>
		<p class="description">
			Click on the price scale (right side) to add price alerts. Click the <strong>+</strong> button
			to add an alert, or click the <strong>×</strong> button on an existing alert to remove it.
		</p>

		<div class="chart-wrapper">
			<Chart
				options={areaChartOptions}
				width="100%"
				height={400}
				autoResize={true}
				onCreate={(c) => {
					areaChart = c;
					console.log('Area chart with price alerts created!');
				}}
			>
				<Series type="Area" reactiveData={areaData} options={areaOptions}>
					<SeriesPlugin
						primitive={priceAlertsPlugin}
						onAttach={() => console.log('Price alerts plugin attached!')}
					/>
				</Series>
			</Chart>
		</div>

		{#if alertMessages.length > 0}
			<div class="alert-log">
				<h3>Alert Activity Log:</h3>
				<ul>
					{#each alertMessages as message}
						<li>{message}</li>
					{/each}
				</ul>
			</div>
		{/if}

		<div class="controls">
			<button onclick={refreshAreaData}>Refresh Data</button>
		</div>

		<div class="info-box">
			<h4>How it works:</h4>
			<ul>
				<li>The plugin implements <code>ISeriesPrimitive</code></li>
				<li>It attaches to an existing series (Area, Line, Candlestick, etc.)</li>
				<li>Mouse handlers detect clicks on the price scale</li>
				<li>Alerts are rendered on both the main pane and price axis</li>
				<li>Provides event subscriptions for alert add/remove</li>
			</ul>
		</div>
	</section>

	<!-- Heatmap Series Example -->
	<section class="example-section">
		<h2>2. Heatmap Custom Series</h2>
		<p class="description">
			A custom series type that visualizes data intensity using color gradients. Each cell represents
			a price range with varying amounts/volumes.
		</p>

		<div class="chart-wrapper">
			<Chart
				options={heatmapChartOptions}
				width="100%"
				height={400}
				autoResize={true}
				onCreate={(c) => {
					heatmapChart = c;
					console.log('Heatmap chart created!');
				}}
			>
				<CustomSeries view={heatmapView} reactiveData={heatmapData} options={heatmapOptions} />
			</Chart>
		</div>

		<div class="controls">
			<button onclick={refreshHeatmapData}>Refresh Heatmap Data</button>
		</div>

		<div class="info-box">
			<h4>How it works:</h4>
			<ul>
				<li>Implements <code>ICustomSeriesPaneView</code> interface</li>
				<li>Uses <code>CustomSeries</code> component (not <code>Series</code>)</li>
				<li>Each data point contains multiple cells with <code>low</code>, <code>high</code>, and <code
						>amount</code
					></li>
				<li>The <code>cellShader</code> function maps amounts to colors (Turbo colormap)</li>
				<li>Perfect for volume profiles, order books, or density visualizations</li>
			</ul>
		</div>

		<div class="color-legend">
			<h4>Color Scale:</h4>
			<div class="gradient-bar"></div>
			<div class="gradient-labels">
				<span>Low</span>
				<span>High</span>
			</div>
		</div>
	</section>

	<!-- Global Controls -->
	<div class="global-controls">
		<button onclick={toggleTheme} class="theme-button">Toggle Theme (Both Charts)</button>
	</div>

	<!-- Technical Info -->
	<section class="technical-section">
		<h2>Technical Implementation</h2>

		<div class="code-examples">
			<div class="code-block">
				<h3>Using User Price Alerts:</h3>
				<pre><code>{`<script>
  import { Chart, Series, SeriesPlugin } from '$lib';
  import { UserPriceAlerts } from '$lib/plugins/user-price-alerts';

  let plugin = new UserPriceAlerts();
  plugin.setSymbolName('AAPL');

  // Subscribe to events
  plugin.alertAdded().subscribe((alert) => {
    console.log('Alert added:', alert);
  });
</script>

<Chart>
  <Series type="Area" data={data}>
    <SeriesPlugin primitive={plugin} />
  </Series>
</Chart>`}</code></pre>
			</div>

			<div class="code-block">
				<h3>Using Heatmap Series:</h3>
				<pre><code>{`<script>
  import { Chart, CustomSeries } from '$lib';
  import { HeatMapSeries } from '$lib/plugins/heatmap-series';

  let view = new HeatMapSeries();
  let data = [
    {
      time: 1672531200,
      cells: [
        { low: 90, high: 100, amount: 15 },
        { low: 100, high: 110, amount: 25 },
        // ... more cells
      ]
    }
  ];

  const cellShader = (amount) => \`hsl(\${amount * 3}, 70%, 50%)\`;
</script>

<Chart>
  <CustomSeries
    view={view}
    reactiveData={data}
    options={{ cellShader }}
  />
</Chart>`}</code></pre>
			</div>
		</div>
	</section>
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

	.example-section {
		margin-bottom: 3rem;
		padding: 1.5rem;
		background: #f8f9fa;
		border-radius: 8px;
	}

	.example-section h2 {
		color: #1a1a1a;
		margin-bottom: 0.5rem;
	}

	.description {
		color: #555;
		margin-bottom: 1.5rem;
		line-height: 1.6;
	}

	.chart-wrapper {
		margin-bottom: 1.5rem;
		border: 1px solid #ddd;
		border-radius: 8px;
		overflow: hidden;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
	}

	.controls {
		display: flex;
		gap: 0.5rem;
		margin-bottom: 1rem;
	}

	.global-controls {
		margin: 2rem 0;
		text-align: center;
	}

	button {
		padding: 0.6rem 1.2rem;
		background: #2962ff;
		color: white;
		border: none;
		border-radius: 4px;
		cursor: pointer;
		font-size: 14px;
		transition: background 0.2s;
		font-weight: 500;
	}

	button:hover {
		background: #1e4fd9;
	}

	.theme-button {
		background: #6200ea;
		padding: 0.8rem 1.5rem;
		font-size: 16px;
	}

	.theme-button:hover {
		background: #5100c7;
	}

	.info-box {
		background: white;
		padding: 1rem;
		border-radius: 6px;
		border-left: 4px solid #2962ff;
		margin-top: 1rem;
	}

	.info-box h4 {
		margin-top: 0;
		color: #2962ff;
	}

	.info-box ul {
		margin: 0;
		padding-left: 1.5rem;
	}

	.info-box li {
		margin: 0.5rem 0;
		color: #555;
	}

	.info-box code {
		background: #f0f0f0;
		padding: 0.2rem 0.4rem;
		border-radius: 3px;
		font-size: 0.9em;
		color: #d63384;
	}

	.alert-log {
		background: white;
		padding: 1rem;
		border-radius: 6px;
		margin: 1rem 0;
		border: 1px solid #e0e0e0;
	}

	.alert-log h3 {
		margin-top: 0;
		font-size: 1rem;
		color: #333;
	}

	.alert-log ul {
		list-style: none;
		padding: 0;
		margin: 0;
	}

	.alert-log li {
		padding: 0.5rem;
		margin: 0.3rem 0;
		background: #f8f9fa;
		border-radius: 4px;
		font-family: 'Courier New', monospace;
		font-size: 0.9rem;
	}

	.color-legend {
		background: white;
		padding: 1rem;
		border-radius: 6px;
		margin-top: 1rem;
	}

	.color-legend h4 {
		margin: 0 0 0.5rem 0;
	}

	.gradient-bar {
		height: 30px;
		background: linear-gradient(
			to right,
			rgb(48, 18, 59),
			rgb(50, 130, 189),
			rgb(92, 200, 99),
			rgb(253, 231, 37)
		);
		border-radius: 4px;
	}

	.gradient-labels {
		display: flex;
		justify-content: space-between;
		margin-top: 0.3rem;
		font-size: 0.9rem;
		color: #666;
	}

	.technical-section {
		background: #f8f9fa;
		padding: 1.5rem;
		border-radius: 8px;
	}

	.technical-section h2 {
		margin-top: 0;
	}

	.code-examples {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 1.5rem;
	}

	.code-block {
		background: white;
		border-radius: 6px;
		overflow: hidden;
	}

	.code-block h3 {
		margin: 0;
		padding: 0.8rem 1rem;
		background: #2d2d2d;
		color: white;
		font-size: 0.9rem;
	}

	pre {
		margin: 0;
		padding: 1rem;
		overflow-x: auto;
	}

	code {
		font-family: 'Courier New', monospace;
		font-size: 0.85rem;
		line-height: 1.5;
	}

	@media (max-width: 768px) {
		.code-examples {
			grid-template-columns: 1fr;
		}

		.container {
			padding: 1rem;
		}
	}

	@media (prefers-color-scheme: dark) {
		.container {
			color: #ddd;
		}

		h1,
		.example-section h2,
		.technical-section h2 {
			color: #fff;
		}

		.subtitle,
		.description {
			color: #bbb;
		}

		.example-section,
		.technical-section {
			background: #2d2d2d;
		}

		.info-box,
		.alert-log,
		.color-legend,
		.code-block {
			background: #1a1a1a;
		}

		.chart-wrapper {
			border-color: #444;
		}
	}

	.nav-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
		gap: 1.5rem;
		margin: 2rem 0 3rem 0;
	}

	.nav-card {
		display: flex;
		flex-direction: column;
		align-items: center;
		text-align: center;
		padding: 2rem;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		border-radius: 12px;
		text-decoration: none;
		color: white;
		transition: all 0.3s ease;
		box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
	}

	.nav-card:hover {
		transform: translateY(-5px);
		box-shadow: 0 8px 15px rgba(0, 0, 0, 0.2);
	}

	.nav-card .icon {
		font-size: 3rem;
		margin-bottom: 1rem;
	}

	.nav-card h3 {
		margin: 0 0 0.5rem 0;
		font-size: 1.3rem;
		color: white;
	}

	.nav-card p {
		margin: 0;
		font-size: 0.95rem;
		opacity: 0.9;
		color: white;
	}
</style>
