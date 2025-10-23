<script lang="ts">
	import { Chart, Series } from '$lib/chart';
	import type { CandlestickData, HistogramData, IChartApi, ISeriesApi, LineData, SeriesType } from 'lightweight-charts';

	// Generate candlestick data
	function generateCandlestickData(): CandlestickData[] {
		const data: CandlestickData[] = [];
		const basePrice = 100;
		let time = new Date(2023, 0, 1).getTime() / 1000;

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

			time += 24 * 60 * 60;
		}

		return data;
	}

	// Generate volume data
	function generateVolumeData(candleData: CandlestickData[]): HistogramData[] {
		return candleData.map((candle) => ({
			time: candle.time,
			value: Math.random() * 10000000 + 5000000,
			color: candle.close >= candle.open ? 'rgba(38, 166, 154, 0.5)' : 'rgba(239, 83, 80, 0.5)'
		}));
	}

	// Generate RSI data
	function generateRSIData(candleData: CandlestickData[]): LineData[] {
		return candleData.map((candle, i) => ({
			time: candle.time,
			value: 30 + Math.sin(i / 15) * 40 + Math.random() * 10
		}));
	}

	// Generate MACD data
	function generateMACDData(candleData: CandlestickData[]): LineData[] {
		return candleData.map((candle, i) => ({
			time: candle.time,
			value: Math.sin(i / 20) * 3 + Math.random() * 0.5
		}));
	}

	// Generate MACD signal data
	function generateMACDSignalData(candleData: CandlestickData[]): LineData[] {
		return candleData.map((candle, i) => ({
			time: candle.time,
			value: Math.sin(i / 20 + 0.5) * 3 + Math.random() * 0.3
		}));
	}

	// Generate MACD histogram
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

	let chartData = $state(generateCandlestickData());
	let volumeData = $derived(generateVolumeData(chartData));
	let rsiData = $derived(generateRSIData(chartData));
	let macdData = $derived(generateMACDData(chartData));
	let macdSignalData = $derived(generateMACDSignalData(chartData));
	let macdHistogramData = $derived(generateMACDHistogramData(chartData));

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

	let candlestickOptions = $state({
		upColor: '#26a69a',
		downColor: '#ef5350',
		borderVisible: false,
		wickUpColor: '#26a69a',
		wickDownColor: '#ef5350'
	});

	let chart: IChartApi | undefined = $state();

	// Track active panes/series
	let volumeSeries: ISeriesApi<SeriesType> | undefined = $state();
	let rsiSeries: ISeriesApi<SeriesType> | undefined = $state();
	let macdSeries: ISeriesApi<SeriesType> | undefined = $state();
	let macdSignalSeries: ISeriesApi<SeriesType> | undefined = $state();
	let macdHistogramSeries: ISeriesApi<SeriesType> | undefined = $state();

	let showVolume = $state(false);
	let showRSI = $state(false);
	let showMACD = $state(false);

	function addVolume() {
		showVolume = true;
	}

	function addRSI() {
		showRSI = true;
	}

	function addMACD() {
		showMACD = true;
	}

	function removeAllPanes() {
		// Just toggle state - Svelte will handle cleanup
		showVolume = false;
		showRSI = false;
		showMACD = false;
		// Clear series references
		volumeSeries = undefined;
		rsiSeries = undefined;
		macdSeries = undefined;
		macdSignalSeries = undefined;
		macdHistogramSeries = undefined;
	}

	function removePane(paneIndex: number) {
		if (!chart) return;

		const identifier = getPaneIdentifier(paneIndex);
		
		// Toggle state to trigger Svelte's reactive unmounting of Series components
		switch (identifier) {
			case 'volume':
				showVolume = false;
				volumeSeries = undefined;
				break;
			case 'rsi':
				showRSI = false;
				rsiSeries = undefined;
				break;
			case 'macd':
				showMACD = false;
				macdSeries = undefined;
				macdSignalSeries = undefined;
				macdHistogramSeries = undefined;
				break;
		}
		
		// Use requestAnimationFrame to ensure Svelte's DOM updates have been flushed
		// Then force remove the pane to ensure it disappears immediately
		requestAnimationFrame(() => {
			if (chart) {
				try {
					const panes = chart.panes();
					// Check if pane still exists before trying to remove
					if (panes[paneIndex]) {
						chart.removePane(paneIndex);
					}
					// Force a visual update
					chart.timeScale().fitContent();
				} catch (e) {
					console.log('Pane already removed:', e);
				}
			}
		});

		hoveredPaneIndex = null;
	}

	function movePaneUp(paneIndex: number) {
		if (!chart || paneIndex <= 1) return; // Can't move first indicator pane up

		const pane = chart.panes()[paneIndex];
		if (pane) {
			pane.moveTo(paneIndex - 1);
		}
	}

	function movePaneDown(paneIndex: number) {
		if (!chart) return;

		const panes = chart.panes();
		if (paneIndex >= panes.length - 1) return; // Already at bottom

		const pane = panes[paneIndex];
		if (pane) {
			pane.moveTo(paneIndex + 1);
		}
	}

	// Track which pane is being hovered
	let hoveredPaneIndex: number | null = $state(null);
	let controlPosition = $state({ x: 0, y: 0, paneHeight: 0 });
	let chartContainer: HTMLElement | null = $state(null);

	// Map pane index to series identifier
	function getPaneIdentifier(paneIndex: number): string {
		if (paneIndex === 1 && showVolume) return 'volume';
		if (paneIndex === 2 && showRSI) return 'rsi';
		if (paneIndex === 3 && showMACD) return 'macd';
		return '';
	}

	// Handle mouse move over chart to detect pane
	function handleChartMouseMove(event: MouseEvent) {
		if (!chart || !chartContainer) return;

		const rect = chartContainer.getBoundingClientRect();
		const y = event.clientY - rect.top;

		// Get all panes
		const panes = chart.panes();

		// Find which pane the mouse is in
		let currentY = 0;
		let foundPane: number | null = null;
		let foundPaneHeight = 0;

		for (let i = 0; i < panes.length; i++) {
			const pane = panes[i];
			const paneHeight = pane.getHeight();

			if (y >= currentY && y < currentY + paneHeight) {
				foundPane = i;
				foundPaneHeight = paneHeight;
				break;
			}

			currentY += paneHeight;
		}

		// Only show for panes > 0 (not main pane) and if there are multiple panes
		if (foundPane !== null && foundPane > 0 && panes.length > 1) {
			const identifier = getPaneIdentifier(foundPane);
			if (identifier) {
				hoveredPaneIndex = foundPane;
				// Position control in top-right of pane, just below the resize bar
				// currentY is at the END of the found pane after the loop
				// So paneStartY is the TOP of the pane (where the resize bar is)
				const paneStartY = currentY;
				controlPosition = {
					x: rect.width - 50, // 50px from left edge (positions in top-right)
					y: paneStartY + 5, // 5px below the resize bar
					paneHeight: foundPaneHeight
				};
				return;
			}
		}

		hoveredPaneIndex = null;
	}

	function handleChartMouseLeave() {
		hoveredPaneIndex = null;
	}

	function handleControlMouseEnter() {
		// Keep the control visible when hovering over it
	}

	function handleControlMouseLeave(event: MouseEvent) {
		// Only hide if we're actually leaving the control and chart area
		if (!chartContainer) return;
		const rect = chartContainer.getBoundingClientRect();
		if (
			event.clientX < rect.left ||
			event.clientX > rect.right ||
			event.clientY < rect.top ||
			event.clientY > rect.bottom
		) {
			hoveredPaneIndex = null;
		}
	}

	function refreshData() {
		chartData = generateCandlestickData();
		// Other data is derived from chartData, so will update automatically
	}
</script>

<div class="container">
	<h1>Multi-Pane Chart Demo</h1>
	<p class="subtitle">
		Add and remove different indicator panes to the chart
	</p>

	<div class="instructions">
		<h3>Instructions:</h3>
		<ul>
			<li>Click "Add Volume" to add a volume histogram in a separate pane below the chart</li>
			<li>Click "Add RSI" to add an RSI indicator in its own pane</li>
			<li>Click "Add MACD" to add MACD lines and histogram in another pane</li>
			<li><strong>Hover over any indicator pane</strong> to reveal controls for removing or reordering the pane (TradingView-style)</li>
			<li>Click "Remove All Panes" to remove all indicator panes and keep only the candlestick chart</li>
		</ul>
	</div>

	<div class="controls">
		<button onclick={addVolume} disabled={showVolume}>
			{showVolume ? '✓ Volume Added' : 'Add Volume Pane'}
		</button>
		<button onclick={addRSI} disabled={showRSI}>
			{showRSI ? '✓ RSI Added' : 'Add RSI Pane'}
		</button>
		<button onclick={addMACD} disabled={showMACD}>
			{showMACD ? '✓ MACD Added' : 'Add MACD Pane'}
		</button>
		<button
			class="remove-btn"
			onclick={removeAllPanes}
			disabled={!showVolume && !showRSI && !showMACD}
		>
			Remove All Panes
		</button>
		<button onclick={refreshData}>Refresh Data</button>
	</div>

	<div class="chart-wrapper" bind:this={chartContainer}
		onmousemove={handleChartMouseMove}
		onmouseleave={handleChartMouseLeave}
		role="application"
		aria-label="Multi-pane chart">
		<div>hoveredPaneIndex: {hoveredPaneIndex} | x: {controlPosition.x} | y: {controlPosition.y}</div>
		<Chart
			options={chartOptions}
			width="100%"
			height={600}
			autoResize={true}
			onCreate={(c) => {
				chart = c;
				console.log('Multi-pane chart created!');
			}}
		>
			<!-- Main candlestick series (pane 0) -->
			<Series
				type="Candlestick"
				reactiveData={chartData}
				options={candlestickOptions}
				onCreate={(series) => console.log('Candlestick series created!')}
			/>

			<!-- Volume series (pane 1) -->
			{#if showVolume}
				<!-- @ts-expect-error - paneIndex is valid but Svelte's type inference doesn't pick it up -->
				<Series
					type="Histogram"
					reactiveData={volumeData}
					paneIndex={1}
					options={{
						priceFormat: {
							type: 'volume'
						},
						priceScaleId: '',
						title: 'Volume'
					}}
					onCreate={(series) => {
						volumeSeries = series;
						console.log('Volume series created!');
					}}
				/>
			{/if}

			<!-- RSI series (pane 2) -->
			{#if showRSI}
				<!-- @ts-expect-error - paneIndex is valid but Svelte's type inference doesn't pick it up -->
				<Series
					type="Line"
					reactiveData={rsiData}
					paneIndex={2}
					options={{
						color: '#2962FF',
						lineWidth: 2,
						priceScaleId: '',
						title: 'RSI'
					}}
					onCreate={(series) => {
						rsiSeries = series;
						console.log('RSI series created!');
						// Add RSI reference lines
						series.createPriceLine({
							price: 70,
							color: '#ef5350',
							lineWidth: 1,
							lineStyle: 2,
							axisLabelVisible: true,
							title: 'Overbought'
						});
						series.createPriceLine({
							price: 30,
							color: '#26a69a',
							lineWidth: 1,
							lineStyle: 2,
							axisLabelVisible: true,
							title: 'Oversold'
						});
					}}
				/>
			{/if}

			<!-- MACD series (pane 3) -->
			{#if showMACD}
				<!-- @ts-expect-error - paneIndex is valid but Svelte's type inference doesn't pick it up -->
				<Series
					type="Histogram"
					reactiveData={macdHistogramData}
					paneIndex={3}
					options={{
						priceScaleId: '',
						title: 'MACD Histogram'
					}}
					onCreate={(series) => {
						macdHistogramSeries = series;
						console.log('MACD Histogram created!');
					}}
				/>

				<!-- @ts-expect-error - paneIndex is valid but Svelte's type inference doesn't pick it up -->
				<Series
					type="Line"
					reactiveData={macdData}
					paneIndex={3}
					options={{
						color: '#2962FF',
						lineWidth: 2,
						priceScaleId: '',
						title: 'MACD'
					}}
					onCreate={(series) => {
						macdSeries = series;
						console.log('MACD line created!');
					}}
				/>

				<!-- @ts-expect-error - paneIndex is valid but Svelte's type inference doesn't pick it up -->
				<Series
					type="Line"
					reactiveData={macdSignalData}
					paneIndex={3}
					options={{
						color: '#FF6B6B',
						lineWidth: 2,
						priceScaleId: '',
						title: 'Signal'
					}}
					onCreate={(series) => {
						macdSignalSeries = series;
						console.log('MACD signal line created!');
					}}
				/>
			{/if}
		</Chart>

		<!-- Pane Control Overlay -->
		{#if hoveredPaneIndex !== null && chart}
			<div
				class="pane-control"
				style:left="{controlPosition.x}px"
				style:top="{controlPosition.y}px"
				onmouseenter={handleControlMouseEnter}
				onmouseleave={handleControlMouseLeave}
				role="toolbar"
				aria-label="Pane controls"
				tabindex="-1"
			>
				<button
					class="control-btn move-up"
					onclick={() => movePaneUp(hoveredPaneIndex!)}
					title="Move pane up"
					disabled={hoveredPaneIndex === 1}
				>
					<svg width="16" height="16" viewBox="0 0 16 16" fill="none">
						<path d="M8 4L4 8L5.5 9.5L8 7L10.5 9.5L12 8L8 4Z" fill="currentColor" />
					</svg>
				</button>
				<button
					class="control-btn remove"
					onclick={() => removePane(hoveredPaneIndex!)}
					title="Remove pane"
				>
					<svg width="16" height="16" viewBox="0 0 16 16" fill="none">
						<path d="M4 4L12 12M12 4L4 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
					</svg>
				</button>
				<button
					class="control-btn move-down"
					onclick={() => movePaneDown(hoveredPaneIndex!)}
					title="Move pane down"
					disabled={chart && hoveredPaneIndex === chart.panes().length - 1}
				>
					<svg width="16" height="16" viewBox="0 0 16 16" fill="none">
						<path d="M8 12L4 8L5.5 6.5L8 9L10.5 6.5L12 8L8 12Z" fill="currentColor" />
					</svg>
				</button>
			</div>
		{/if}
	</div>

	<div class="info">
		<h2>Active Panes:</h2>
		<div class="pane-list">
			<div class="pane-item active">
				<span class="pane-number">0</span>
				<span class="pane-name">Main Chart (Candlestick)</span>
				<span class="badge">Always Active</span>
			</div>
			{#if showVolume}
				<div class="pane-item active">
					<span class="pane-number">1</span>
					<span class="pane-name">Volume</span>
					<span class="badge success">Active</span>
				</div>
			{/if}
			{#if showRSI}
				<div class="pane-item active">
					<span class="pane-number">2</span>
					<span class="pane-name">RSI (Relative Strength Index)</span>
					<span class="badge success">Active</span>
				</div>
			{/if}
			{#if showMACD}
				<div class="pane-item active">
					<span class="pane-number">3</span>
					<span class="pane-name">MACD (Moving Average Convergence Divergence)</span>
					<span class="badge success">Active</span>
				</div>
			{/if}
		</div>
	</div>

	<div class="features">
		<h2>About Multi-Pane Charts</h2>
		<div class="feature-grid">
			<div class="feature-card">
				<h3>📊 Main Pane (0)</h3>
				<p>
					The primary chart area showing candlestick data. This pane always exists and cannot be
					removed.
				</p>
			</div>
			<div class="feature-card">
				<h3>📈 Volume Pane (1)</h3>
				<p>
					Shows trading volume as a histogram. Green bars for up days, red bars for down days.
				</p>
			</div>
			<div class="feature-card">
				<h3>📉 RSI Pane (2)</h3>
				<p>
					Relative Strength Index oscillator. Shows overbought (&gt;70) and oversold (&lt;30) levels.
				</p>
			</div>
			<div class="feature-card">
				<h3>🎯 MACD Pane (3)</h3>
				<p>
					Moving Average Convergence Divergence with signal line and histogram for trend analysis.
				</p>
			</div>
		</div>
	</div>

	<div class="back-link">
		<a href="/">← Back to Main Demo</a>
		<a href="/plugin-examples">View Plugin Examples →</a>
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
		padding: 1.5rem;
		border-radius: 12px;
		margin-bottom: 1.5rem;
	}

	.instructions h3 {
		margin-top: 0;
		margin-bottom: 0.8rem;
	}

	.instructions ul {
		margin: 0;
		padding-left: 1.5rem;
	}

	.instructions li {
		margin: 0.5rem 0;
		line-height: 1.5;
	}

	.controls {
		display: flex;
		gap: 0.5rem;
		margin-bottom: 1.5rem;
		flex-wrap: wrap;
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

	button:hover:not(:disabled) {
		background: #1e4fd9;
		transform: translateY(-1px);
		box-shadow: 0 4px 8px rgba(41, 98, 255, 0.3);
	}

	button:disabled {
		background: #ccc;
		cursor: not-allowed;
		transform: none;
	}

	.remove-btn {
		background: #ef5350;
	}

	.remove-btn:hover:not(:disabled) {
		background: #d32f2f;
		box-shadow: 0 4px 8px rgba(239, 83, 80, 0.3);
	}

	.chart-wrapper {
		position: relative;
		margin-bottom: 2rem;
		border: 1px solid #ddd;
		border-radius: 8px;
		overflow: hidden;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
	}

	.pane-control {
		position: absolute;
		display: flex;
		flex-direction: column;
		gap: 4px;
		pointer-events: all;
		z-index: 1000;
		background: rgba(255, 0, 0, 0.3); /* Debug: red background */
		padding: 4px;
		border: 2px solid red; /* Debug: red border */
	}

	.control-btn {
		width: 28px;
		height: 28px;
		padding: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		background: rgba(255, 255, 255, 0.95);
		border: 1px solid rgba(0, 0, 0, 0.15);
		border-radius: 4px;
		cursor: pointer;
		color: #666;
		transition: all 0.2s;
		box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
	}

	.control-btn:hover:not(:disabled) {
		background: rgba(255, 255, 255, 1);
		box-shadow: 0 3px 8px rgba(0, 0, 0, 0.2);
		transform: scale(1.05);
	}

	.control-btn.remove {
		color: #ef5350;
	}

	.control-btn.remove:hover:not(:disabled) {
		background: #ef5350;
		color: white;
		border-color: #ef5350;
	}

	.control-btn.move-up,
	.control-btn.move-down {
		color: #2962ff;
	}

	.control-btn.move-up:hover:not(:disabled),
	.control-btn.move-down:hover:not(:disabled) {
		background: #2962ff;
		color: white;
		border-color: #2962ff;
	}

	.control-btn:disabled {
		opacity: 0.3;
		cursor: not-allowed;
		background: rgba(200, 200, 200, 0.5);
	}

	.info {
		background: #f8f9fa;
		padding: 1.5rem;
		border-radius: 8px;
		margin-bottom: 2rem;
	}

	.info h2 {
		margin-top: 0;
		margin-bottom: 1rem;
	}

	.pane-list {
		display: flex;
		flex-direction: column;
		gap: 0.8rem;
	}

	.pane-item {
		display: flex;
		align-items: center;
		padding: 1rem;
		background: white;
		border-radius: 6px;
		border: 2px solid #e0e0e0;
		gap: 1rem;
	}

	.pane-item.active {
		border-color: #667eea;
	}

	.pane-number {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 32px;
		height: 32px;
		background: #667eea;
		color: white;
		border-radius: 50%;
		font-weight: bold;
		font-size: 14px;
	}

	.pane-name {
		flex: 1;
		font-weight: 500;
		color: #333;
	}

	.badge {
		padding: 0.3rem 0.8rem;
		border-radius: 12px;
		font-size: 12px;
		font-weight: 600;
		background: #e0e0e0;
		color: #666;
	}

	.badge.success {
		background: #26a69a;
		color: white;
	}

	.features {
		margin: 3rem 0;
	}

	.features h2 {
		margin-bottom: 1.5rem;
	}

	.feature-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
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
		margin-bottom: 0.8rem;
	}

	.feature-card p {
		margin: 0;
		color: #555;
		line-height: 1.5;
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
		.container {
			padding: 1rem;
		}

		.controls {
			flex-direction: column;
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

		.info,
		.feature-card {
			background: #2d2d2d;
		}

		.pane-item {
			background: #2d2d2d;
			border-color: #444;
		}

		.pane-item.active {
			border-color: #667eea;
		}

		.pane-name {
			color: #ddd;
		}

		.chart-wrapper {
			border-color: #444;
		}
	}
</style>
