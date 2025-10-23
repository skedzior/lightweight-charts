<script lang="ts">
	import { Chart, Series, SeriesPlugin, type IChartApi } from '$lib';
	import { SimpleTextPlugin } from '$lib/examples/SimpleTextPlugin';
	import type { CandlestickData, LineData } from 'lightweight-charts';

	// State for chart configuration
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
		}
	});

	// Generate sample candlestick data
	function generateCandlestickData(): CandlestickData[] {
		const data: CandlestickData[] = [];
		const basePrice = 100;
		let time = new Date(2023, 0, 1).getTime() / 1000;

		for (let i = 0; i < 100; i++) {
			const open = basePrice + Math.random() * 10 - 5;
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

			time += 24 * 60 * 60; // Add one day
		}

		return data;
	}

	// Generate sample line data (for volume or indicator)
	function generateLineData(): LineData[] {
		const data: LineData[] = [];
		let time = new Date(2023, 0, 1).getTime() / 1000;

		for (let i = 0; i < 100; i++) {
			data.push({
				time: time as any,
				value: 50 + Math.random() * 20
			});

			time += 24 * 60 * 60;
		}

		return data;
	}

	// Data
	let candlestickData = $state(generateCandlestickData());
	let lineData = $state(generateLineData());

	// Series options
	let candlestickOptions = $state({
		upColor: '#26a69a',
		downColor: '#ef5350',
		borderVisible: false,
		wickUpColor: '#26a69a',
		wickDownColor: '#ef5350'
	});

	let lineOptions = $state({
		color: '#2962FF',
		lineWidth: 2
	});

	// Chart reference
	let chart: IChartApi | undefined = $state();

	// Plugin instance
	let textPlugin = $state(
		new SimpleTextPlugin({
			text: 'Svelte 5 + Lightweight Charts',
			color: '#fff',
			x: 20,
			y: 30
		})
	);

	// Functions to demonstrate reactivity
	function randomizeData() {
		candlestickData = generateCandlestickData();
		lineData = generateLineData();
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

	function updatePluginText() {
		textPlugin.updateOptions({
			text: `Updated at ${new Date().toLocaleTimeString()}`
		});
	}

	// Add a new data point
	function addDataPoint() {
		const lastCandle = candlestickData[candlestickData.length - 1];
		const newTime = ((lastCandle.time as number) + 24 * 60 * 60) as any;

		const open = 100 + Math.random() * 10 - 5;
		const close = open + Math.random() * 10 - 5;
		const high = Math.max(open, close) + Math.random() * 5;
		const low = Math.min(open, close) - Math.random() * 5;

		candlestickData = [
			...candlestickData,
			{
				time: newTime,
				open,
				high,
				low,
				close
			}
		];

		const lastLine = lineData[lineData.length - 1];
		lineData = [
			...lineData,
			{
				time: newTime,
				value: 50 + Math.random() * 20
			}
		];
	}
</script>

<div class="container">
	<h1>Lightweight Charts Svelte 5 Wrapper Demo</h1>

	<div class="nav-links">
		<a href="/chart-playground" class="plugin-link playground-link">
			🎮 Chart Playground (Object Tree) →
		</a>
		<a href="/plugin-examples" class="plugin-link">
			🔌 Advanced Plugin Examples →
		</a>
		<a href="/pane-examples" class="plugin-link pane-link">
			📊 Multi-Pane Charts →
		</a>
		<a href="/indicator-examples" class="plugin-link indicator-link">
			📈 Technical Indicators →
		</a>
	</div>

	<div class="controls">
		<button onclick={toggleTheme}>Toggle Theme</button>
		<button onclick={randomizeData}>Randomize Data</button>
		<button onclick={addDataPoint}>Add Data Point</button>
		<button onclick={updatePluginText}>Update Plugin Text</button>
	</div>

	<div class="chart-wrapper">
		<Chart
			options={chartOptions}
			width="100%"
			height={500}
			autoResize={true}
			onCreate={(c) => {
				chart = c;
				console.log('Chart created!', chart);
			}}
			onDestroy={() => console.log('Chart destroyed!')}
		>
			<!-- Main candlestick series -->
			<Series
				type="Candlestick"
				reactiveData={candlestickData}
				options={candlestickOptions}
				onCreate={(series) => console.log('Candlestick series created!', series)}
			>
				<!-- Attach plugin to candlestick series -->
				<SeriesPlugin
					primitive={textPlugin}
					onAttach={() => console.log('Plugin attached!')}
					onDetach={() => console.log('Plugin detached!')}
				/>
			</Series>

			<!-- Line series for comparison -->
			<Series
				type="Line"
				reactiveData={lineData}
				options={lineOptions}
				onCreate={(series) => console.log('Line series created!', series)}
			/>
		</Chart>
	</div>

	<div class="info">
		<h2>Features Demonstrated:</h2>
		<ul>
			<li>✅ Reactive chart options (toggle theme)</li>
			<li>✅ Reactive series data (randomize data, add data point)</li>
			<li>✅ Multiple series in one chart (candlestick + line)</li>
			<li>✅ Plugin system (text overlay on candlestick series)</li>
			<li>✅ Reactive plugin updates (update plugin text)</li>
			<li>✅ Auto-resize support</li>
			<li>✅ Lifecycle callbacks (onCreate, onDestroy)</li>
			<li>✅ Svelte 5 runes ($state, $derived, $effect)</li>
			<li>✅ Composable slot-based API</li>
		</ul>

		<h2>Usage Pattern:</h2>
		<pre><code>{`<Chart options={chartOptions}>
  <Series type="Candlestick" reactiveData={data}>
    <SeriesPlugin primitive={plugin} />
  </Series>
  <Series type="Line" reactiveData={lineData} />
</Chart>`}</code></pre>
	</div>
</div>

<style>
	.container {
		padding: 2rem;
		max-width: 1400px;
		margin: 0 auto;
		font-family: system-ui, -apple-system, sans-serif;
	}

	h1 {
		margin-bottom: 1rem;
		color: #333;
	}

	.nav-links {
		margin-bottom: 1.5rem;
	}

	.plugin-link {
		display: inline-block;
		padding: 0.7rem 1.2rem;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		color: white;
		text-decoration: none;
		border-radius: 6px;
		font-weight: 500;
		transition: transform 0.2s, box-shadow 0.2s;
		box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
	}

	.plugin-link:hover {
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
	}

	.manager-link {
		background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
		margin-left: 0.5rem;
	}

	.pane-link {
		background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
		margin-left: 0.5rem;
	}

	.playground-link {
		background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
		margin-left: 0;
		margin-bottom: 0.5rem;
	}

	.controls {
		display: flex;
		gap: 0.5rem;
		margin-bottom: 1rem;
		flex-wrap: wrap;
	}

	button {
		padding: 0.5rem 1rem;
		background: #2962ff;
		color: white;
		border: none;
		border-radius: 4px;
		cursor: pointer;
		font-size: 14px;
		transition: background 0.2s;
	}

	button:hover {
		background: #1e4fd9;
	}

	.chart-wrapper {
		margin-bottom: 2rem;
		border: 1px solid #ddd;
		border-radius: 8px;
		overflow: hidden;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
	}

	.info {
		background: #f5f5f5;
		padding: 1.5rem;
		border-radius: 8px;
	}

	.info h2 {
		margin-top: 0;
		margin-bottom: 1rem;
		color: #333;
	}

	.info ul {
		list-style: none;
		padding: 0;
		margin-bottom: 1.5rem;
	}

	.info li {
		padding: 0.3rem 0;
		color: #555;
	}

	pre {
		background: #2d2d2d;
		color: #f8f8f2;
		padding: 1rem;
		border-radius: 4px;
		overflow-x: auto;
	}

	code {
		font-family: 'Courier New', monospace;
		font-size: 14px;
	}

	@media (prefers-color-scheme: dark) {
		.container {
			color: #ddd;
		}

		h1,
		.info h2 {
			color: #fff;
		}

		.info {
			background: #2d2d2d;
		}

		.info li {
			color: #ccc;
		}

		.chart-wrapper {
			border-color: #444;
		}
	}
</style>
