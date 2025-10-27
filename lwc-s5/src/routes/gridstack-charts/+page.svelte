<script lang="ts">
	import { onDestroy } from 'svelte';
	import { GridStack, ChartGridItem } from '$lib/gridstack';
	import { Series, CustomSeries } from '$lib/chart';
	import { HeatMapSeries, generateHeatmapData } from '$lib/plugins/heatmap-series';
	import type { CandlestickData, LineData, HistogramData } from 'lightweight-charts';

	// Sample data generators
	function generateCandlestickData(count: number): CandlestickData[] {
		const data: CandlestickData[] = [];
		let time = new Date('2024-01-01').getTime() / 1000;
		let close = 100;

		for (let i = 0; i < count; i++) {
			const open = close;
			const change = (Math.random() - 0.5) * 4;
			close = open + change;
			const high = Math.max(open, close) + Math.random() * 2;
			const low = Math.min(open, close) - Math.random() * 2;

			data.push({
				time: time as any,
				open,
				high,
				low,
				close,
			});

			time += 86400; // Add 1 day
		}

		return data;
	}

	function generateLineData(count: number, baseValue: number = 100): LineData[] {
		const data: LineData[] = [];
		let time = new Date('2024-01-01').getTime() / 1000;
		let value = baseValue;

		for (let i = 0; i < count; i++) {
			value += (Math.random() - 0.5) * 5;
			data.push({
				time: time as any,
				value,
			});
			time += 86400;
		}

		return data;
	}

	function generateHistogramData(count: number): HistogramData[] {
		const data: HistogramData[] = [];
		let time = new Date('2024-01-01').getTime() / 1000;

		for (let i = 0; i < count; i++) {
			const value = Math.random() * 100000;
			const color = Math.random() > 0.5 ? 'rgba(0, 150, 136, 0.8)' : 'rgba(255, 82, 82, 0.8)';

			data.push({
				time: time as any,
				value,
				color,
			});
			time += 86400;
		}

		return data;
	}

	// Reactive data for live updates
	let candlestickData = $state(generateCandlestickData(100));
	let lineData1 = $state(generateLineData(100, 100));
	let lineData2 = $state(generateLineData(100, 150));
	let volumeData = $state(generateHistogramData(100));
	let heatmapData = $state(generateHeatmapData());
	let heatmapSeries = new HeatMapSeries();

	// Grid layout will be managed by ChartGridItem components directly

	// Live data simulation (preparing for WebSocket integration)
	let updateInterval: ReturnType<typeof setInterval>;
	let isLiveUpdating = $state(false);

	function startLiveUpdates() {
		isLiveUpdating = true;

		updateInterval = setInterval(() => {
			// Update candlestick data
			const lastCandle = candlestickData[candlestickData.length - 1];
			const newTime = (lastCandle.time as number) + 86400;
			const open = lastCandle.close;
			const change = (Math.random() - 0.5) * 4;
			const close = open + change;
			const high = Math.max(open, close) + Math.random() * 2;
			const low = Math.min(open, close) - Math.random() * 2;

			candlestickData = [
				...candlestickData.slice(-99),
				{
					time: newTime as any,
					open,
					high,
					low,
					close,
				},
			];

			// Update line data
			const lastLine1 = lineData1[lineData1.length - 1];
			lineData1 = [
				...lineData1.slice(-99),
				{
					time: newTime as any,
					value: lastLine1.value + (Math.random() - 0.5) * 5,
				},
			];

			const lastLine2 = lineData2[lineData2.length - 1];
			lineData2 = [
				...lineData2.slice(-99),
				{
					time: newTime as any,
					value: lastLine2.value + (Math.random() - 0.5) * 5,
				},
			];

			// Update volume data
			const value = Math.random() * 100000;
			const color = Math.random() > 0.5 ? 'rgba(0, 150, 136, 0.8)' : 'rgba(255, 82, 82, 0.8)';
			volumeData = [
				...volumeData.slice(-99),
				{
					time: newTime as any,
					value,
					color,
				},
			];
		}, 1000);
	}

	function stopLiveUpdates() {
		isLiveUpdating = false;
		if (updateInterval) {
			clearInterval(updateInterval);
		}
	}

	// Grid event handlers
	function handleGridChange(items: any[]) {
		console.log('Grid changed:', items);
	}

	function handleResizeStop(_event: Event, el: HTMLElement) {
		console.log('Resize stopped:', el);
	}

	onDestroy(() => {
		stopLiveUpdates();
	});
</script>

<div class="page-container">
	<div class="header">
		<h1>GridStack + Lightweight Charts Integration</h1>
		<p class="description">
			Drag and resize chart panels. The charts will automatically resize to fit their containers.
		</p>

		<div class="controls">
			{#if isLiveUpdating}
				<button class="stop-btn" onclick={stopLiveUpdates}>
					Stop Live Updates
				</button>
			{:else}
				<button class="start-btn" onclick={startLiveUpdates}>
					Start Live Updates
				</button>
			{/if}

			<span class="status">
				{isLiveUpdating ? '● Live' : '○ Paused'}
			</span>
		</div>
	</div>

	<div class="grid-container">
		<GridStack
			options={{
				cellHeight: 80,
				margin: 5,
				float: true,
				animate: true,
				handle: '.grid-stack-item-drag-handle',
			}}
			onchange={handleGridChange}
			onresizestop={handleResizeStop}
		>
			{#snippet children()}
				<!-- Chart 1: Candlestick Chart -->
				<ChartGridItem
					id="chart-1"
					title="Candlestick Chart"
					x={0}
					y={0}
					w={6}
					h={4}
					minW={3}
					minH={3}
					chartOptions={{
						layout: {
							background: { color: '#ffffff' },
							textColor: '#333',
						},
						grid: {
							vertLines: { color: 'rgba(197, 203, 206, 0.4)' },
							horzLines: { color: 'rgba(197, 203, 206, 0.4)' },
						},
						rightPriceScale: {
							borderColor: 'rgba(197, 203, 206, 0.8)',
						},
						timeScale: {
							borderColor: 'rgba(197, 203, 206, 0.8)',
							timeVisible: true,
							secondsVisible: false,
						},
					}}
					chartHeight="100%"
				>
					{#snippet chartContent()}
						<Series
							type="Candlestick"
							reactiveData={candlestickData}
							options={{
								upColor: '#26a69a',
								downColor: '#ef5350',
								borderVisible: false,
								wickUpColor: '#26a69a',
								wickDownColor: '#ef5350',
							}}
						/>
					{/snippet}
				</ChartGridItem>

				<!-- Chart 2: Line Chart -->
				<ChartGridItem
					id="chart-2"
					title="Line Chart (Dark Theme)"
					x={6}
					y={0}
					w={6}
					h={4}
					minW={3}
					minH={3}
					chartOptions={{
						layout: {
							background: { color: '#1e222d' },
							textColor: '#d1d4dc',
						},
						grid: {
							vertLines: { color: 'rgba(42, 46, 57, 0.5)' },
							horzLines: { color: 'rgba(42, 46, 57, 0.5)' },
						},
						rightPriceScale: {
							borderColor: 'rgba(197, 203, 206, 0.3)',
						},
						timeScale: {
							borderColor: 'rgba(197, 203, 206, 0.3)',
							timeVisible: true,
						},
					}}
					chartHeight="100%"
				>
					{#snippet chartContent()}
						<Series
							type="Line"
							reactiveData={lineData1}
							options={{
								color: '#2962FF',
								lineWidth: 2,
							}}
						/>
					{/snippet}
				</ChartGridItem>

				<!-- Chart 3: Area Chart -->
				<ChartGridItem
					id="chart-3"
					title="Area Chart"
					x={0}
					y={4}
					w={6}
					h={4}
					minW={3}
					minH={3}
					chartOptions={{
						layout: {
							background: { color: '#ffffff' },
							textColor: '#333',
						},
						grid: {
							vertLines: { color: 'rgba(197, 203, 206, 0.4)' },
							horzLines: { color: 'rgba(197, 203, 206, 0.4)' },
						},
					}}
					chartHeight="100%"
				>
					{#snippet chartContent()}
						<Series
							type="Area"
							reactiveData={lineData2}
							options={{
								topColor: 'rgba(76, 175, 80, 0.56)',
								bottomColor: 'rgba(76, 175, 80, 0.04)',
								lineColor: 'rgba(76, 175, 80, 1)',
								lineWidth: 2,
							}}
						/>
					{/snippet}
				</ChartGridItem>

				<!-- Chart 4: Histogram (Volume) Chart -->
				<ChartGridItem
					id="chart-4"
					title="Volume Chart"
					x={6}
					y={4}
					w={6}
					h={4}
					minW={3}
					minH={3}
					chartOptions={{
						layout: {
							background: { color: '#ffffff' },
							textColor: '#333',
						},
						grid: {
							vertLines: { color: 'rgba(197, 203, 206, 0.4)' },
							horzLines: { color: 'rgba(197, 203, 206, 0.4)' },
						},
					}}
					chartHeight="100%"
				>
					{#snippet chartContent()}
						<Series
							type="Histogram"
							reactiveData={volumeData}
							options={{
								priceFormat: {
									type: 'volume',
								},
								priceScaleId: '',
							}}
						/>
					{/snippet}
				</ChartGridItem>

				<!-- Chart 5: Multi-Pane Chart (Price + Volume) -->
				<ChartGridItem
					id="chart-5"
					title="Multi-Pane Chart"
					x={0}
					y={8}
					w={6}
					h={6}
					minW={3}
					minH={4}
					chartOptions={{
						layout: {
							background: { color: '#ffffff' },
							textColor: '#333',
						},
						grid: {
							vertLines: { color: 'rgba(197, 203, 206, 0.4)' },
							horzLines: { color: 'rgba(197, 203, 206, 0.4)' },
						},
					}}
					chartHeight="100%"
				>
					{#snippet chartContent()}
						<!-- Price pane (pane 0) -->
						<Series
							type="Candlestick"
							reactiveData={candlestickData}
							paneIndex={0}
							options={{
								upColor: '#26a69a',
								downColor: '#ef5350',
								borderVisible: false,
								wickUpColor: '#26a69a',
								wickDownColor: '#ef5350',
							}}
						/>
						<!-- Volume pane (pane 1) -->
						<Series
							type="Histogram"
							reactiveData={volumeData}
							paneIndex={1}
							options={{
								priceFormat: {
									type: 'volume',
								},
								priceScaleId: '',
							}}
						/>
					{/snippet}
				</ChartGridItem>

				<!-- Chart 6: Heatmap Series -->
				<ChartGridItem
					id="chart-6"
					title="Heatmap Series"
					x={6}
					y={8}
					w={6}
					h={6}
					minW={3}
					minH={4}
					chartOptions={{
						layout: {
							background: { color: '#ffffff' },
							textColor: '#333',
						},
						grid: {
							vertLines: { color: 'rgba(197, 203, 206, 0.4)' },
							horzLines: { color: 'rgba(197, 203, 206, 0.4)' },
						},
						timeScale: {
							timeVisible: true,
							secondsVisible: false,
						},
					}}
					chartHeight="100%"
				>
					{#snippet chartContent()}
						<CustomSeries
							view={heatmapSeries}
							data={heatmapData}
						/>
					{/snippet}
				</ChartGridItem>
			{/snippet}
		</GridStack>
	</div>
</div>

<style>
	.page-container {
		width: 100%;
		height: 100vh;
		display: flex;
		flex-direction: column;
		background: #f5f5f5;
	}

	.header {
		padding: 20px;
		background: white;
		border-bottom: 1px solid #e0e0e0;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
	}

	h1 {
		margin: 0 0 8px 0;
		font-size: 24px;
		font-weight: 600;
		color: #333;
	}

	.description {
		margin: 0 0 16px 0;
		color: #666;
		font-size: 14px;
	}

	.controls {
		display: flex;
		align-items: center;
		gap: 12px;
	}

	button {
		padding: 8px 16px;
		border: none;
		border-radius: 4px;
		font-size: 14px;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s;
	}

	.start-btn {
		background: #2196f3;
		color: white;
	}

	.start-btn:hover {
		background: #1976d2;
	}

	.stop-btn {
		background: #f44336;
		color: white;
	}

	.stop-btn:hover {
		background: #d32f2f;
	}

	.status {
		font-size: 14px;
		font-weight: 500;
		color: #666;
	}

	.grid-container {
		flex: 1;
		overflow: auto;
		padding: 10px;
	}

	/* Override GridStack default styles for better chart integration */
	:global(.chart-grid-item .grid-stack-item-content) {
		padding: 0 !important;
		overflow: hidden !important;
		background-color: transparent !important;
		border: 1px solid #ddd !important;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1) !important;
		height: 100% !important;
	}

	:global(.grid-stack-item) {
		overflow: visible;
	}
</style>
