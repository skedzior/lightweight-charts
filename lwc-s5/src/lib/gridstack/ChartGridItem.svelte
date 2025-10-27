<script lang="ts">
	import { type Snippet } from 'svelte';
	import GridStackItem from './GridStackItem.svelte';
	import Chart from '../chart/Chart.svelte';
	import type { DeepPartial } from 'lightweight-charts';
	import type { ChartOptions } from 'lightweight-charts';

	interface Props {
		// Grid item props
		x?: number;
		y?: number;
		w?: number;
		h?: number;
		id?: string;
		minW?: number;
		minH?: number;
		maxW?: number;
		maxH?: number;
		noResize?: boolean;
		noMove?: boolean;
		locked?: boolean;
		class?: string;

		// Header/title
		title?: string;
		showHeader?: boolean;

		// Chart props
		chartOptions?: DeepPartial<ChartOptions>;
		chartHeight?: number | string;

		// Content - flexible snippet pattern for chart series and plugins
		chartContent?: Snippet;
	}

	let {
		x,
		y,
		w = 2,
		h = 2,
		id,
		minW = 2,
		minH = 2,
		maxW,
		maxH,
		noResize = false,
		noMove = false,
		locked = false,
		class: className = '',
		title = 'Chart',
		showHeader = true,
		chartOptions = {},
		chartHeight = '100%',
		chartContent,
	}: Props = $props();
</script>

<GridStackItem
	{x}
	{y}
	{w}
	{h}
	{id}
	{minW}
	{minH}
	{maxW}
	{maxH}
	{noResize}
	{noMove}
	{locked}
	class="chart-grid-item {className}"
>
	{#snippet children()}
		<div class="chart-wrapper">
			{#if showHeader}
				<div class="chart-header grid-stack-item-drag-handle">
					<span class="chart-title">{title}</span>
					<span class="drag-icon">⋮⋮</span>
				</div>
			{/if}
			<div class="chart-container">
				<Chart
					options={chartOptions}
					width="100%"
					height={chartHeight}
					autoResize={true}
				>
					{#if chartContent}
						{@render chartContent()}
					{/if}
				</Chart>
			</div>
		</div>
	{/snippet}
</GridStackItem>

<style>
	:global(.chart-grid-item .grid-stack-item-content) {
		padding: 0 !important;
		display: flex;
		flex-direction: column;
		overflow: hidden;
		height: 100%;
	}

	.chart-wrapper {
		display: flex;
		flex-direction: column;
		height: 100%;
		width: 100%;
	}

	.chart-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 8px 12px;
		background: linear-gradient(to bottom, #f8f9fa, #e9ecef);
		border-bottom: 1px solid #dee2e6;
		cursor: move;
		user-select: none;
		flex-shrink: 0;
		min-height: 36px;
	}

	.chart-header:hover {
		background: linear-gradient(to bottom, #e9ecef, #dee2e6);
	}

	.chart-title {
		font-size: 13px;
		font-weight: 600;
		color: #495057;
	}

	.drag-icon {
		font-size: 16px;
		color: #adb5bd;
		letter-spacing: -2px;
	}

	.chart-container {
		flex: 1;
		min-height: 0;
		position: relative;
		overflow: hidden;
		width: 100%;
	}
</style>
