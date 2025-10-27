<script lang="ts">
	import { onMount, untrack, type Snippet } from 'svelte';
	import { browser } from '$app/environment';
	import type { GridStack as GridStackType, GridStackOptions, GridStackWidget } from 'gridstack';

	// Import CSS only on client
	if (browser) {
		import('gridstack/dist/gridstack.min.css');
	}

	interface Props {
		options?: GridStackOptions;
		items?: GridStackWidget[];
		class?: string;
		children?: Snippet;
		onchange?: (items: GridStackWidget[]) => void;
		onadded?: (items: GridStackWidget[]) => void;
		onremoved?: (items: GridStackWidget[]) => void;
		ondragstart?: (event: Event, el: HTMLElement) => void;
		ondragstop?: (event: Event, el: HTMLElement) => void;
		onresizestart?: (event: Event, el: HTMLElement) => void;
		onresizestop?: (event: Event, el: HTMLElement) => void;
	}

	let {
		options = $bindable(),
		items = $bindable([]),
		class: className = '',
		children,
		onchange,
		onadded,
		onremoved,
		ondragstart,
		ondragstop,
		onresizestart,
		onresizestop,
	}: Props = $props();

	let containerEl: HTMLDivElement;
	let grid: GridStackType | undefined = $state();

	// Expose grid instance and methods via snippet context
	export function getGrid() {
		return grid;
	}

	export function save(saveContent = true, saveGridOpts = false) {
		return grid?.save(saveContent, saveGridOpts);
	}

	export function load(layout: GridStackWidget[], addAndRemove = true) {
		return grid?.load(layout, addAndRemove);
	}

	export function addWidget(widget: GridStackWidget) {
		return grid?.addWidget(widget);
	}

	export function removeWidget(el: HTMLElement, removeDOM = true, triggerEvent = true) {
		return grid?.removeWidget(el, removeDOM, triggerEvent);
	}

	export function removeAll(removeDOM = true) {
		return grid?.removeAll(removeDOM);
	}

	export function destroy(removeDOM = true) {
		return grid?.destroy(removeDOM);
	}

	onMount(async () => {
		// Dynamically import GridStack only on client side
		const { GridStack: GridStackJS } = await import('gridstack');

		// Initialize GridStack
		const gridInstance = GridStackJS.init(options, containerEl);
		grid = gridInstance;

		if (!gridInstance) return;

		// Set up event listeners
		if (onchange) {
			gridInstance.on('change', (event, items) => {
				onchange?.(items as GridStackWidget[]);
			});
		}

		if (onadded) {
			gridInstance.on('added', (event, items) => {
				onadded?.(items as GridStackWidget[]);
			});
		}

		if (onremoved) {
			gridInstance.on('removed', (event, items) => {
				onremoved?.(items as GridStackWidget[]);
			});
		}

		if (ondragstart) {
			gridInstance.on('dragstart', ondragstart);
		}

		if (ondragstop) {
			gridInstance.on('dragstop', ondragstop);
		}

		if (onresizestart) {
			gridInstance.on('resizestart', onresizestart);
		}

		if (onresizestop) {
			gridInstance.on('resizestop', onresizestop);
		}

		// Load initial items if provided
		if (items && items.length > 0) {
			gridInstance.load(items);
		}
	});

	// Handle cleanup separately using $effect
	$effect(() => {
		return () => {
			grid?.destroy(false);
		};
	});

	// Watch for items changes (after initial mount)
	let initialLoad = true;
	$effect(() => {
		if (grid && items && !initialLoad) {
			untrack(() => {
				// Only update if grid is already initialized and it's not the initial load
				grid?.load(items);
			});
		}
	});

	// Mark that initial load is complete after first render
	$effect(() => {
		if (grid && initialLoad) {
			initialLoad = false;
		}
	});
</script>

<div bind:this={containerEl} class="grid-stack {className}">
	{#if children}
		{@render children()}
	{/if}
</div>

<style>
	:global(.grid-stack) {
		background: #fafafa;
	}

	:global(.grid-stack-item-content) {
		background-color: white;
		border: 1px solid #ccc;
		border-radius: 4px;
		padding: 10px;
		overflow: auto;
	}
</style>
