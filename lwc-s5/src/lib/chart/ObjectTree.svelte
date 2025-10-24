<script lang="ts">
	import type { IChartApi, ISeriesApi, SeriesType } from 'lightweight-charts';
	import { draggable, droppable, type DragDropState } from '@thisux/sveltednd';

	// Track drag state locally
	let isDragging = $state(false);
	let invalidDrop = $state(false);

	interface ChartObject {
		id: string;
		type: 'series' | 'marker' | 'indicator' | 'priceline' | 'primitive';
		name: string;
		paneIndex: number;
		visible: boolean;
		seriesType?: SeriesType;
		data?: any;
	}

	interface Props {
		chart?: IChartApi;
		objects?: ChartObject[];
		onToggleVisibility?: (id: string) => void;
		onRemove?: (id: string) => void;
		onReorder?: (objects: ChartObject[]) => void;
		onMoveToPane?: (objectId: string, targetPane: number) => void;
	}

	let { chart, objects = $bindable([]), onToggleVisibility, onRemove, onReorder, onMoveToPane }: Props = $props();

	let expandedPanes = $state<Set<number>>(new Set([0]));

	// Local state for drag-and-drop reordering
	let localObjects = $state<ChartObject[]>([]);

	// Sync local objects with incoming objects
	$effect(() => {
		localObjects = [...objects];
	});

	function togglePane(paneIndex: number) {
		if (expandedPanes.has(paneIndex)) {
			expandedPanes.delete(paneIndex);
		} else {
			expandedPanes.add(paneIndex);
		}
		expandedPanes = new Set(expandedPanes);
	}

	// Group objects by pane (use local objects for drag-and-drop)
	let objectsByPane = $derived.by(() => {
		const grouped = new Map<number, ChartObject[]>();
		localObjects.forEach(obj => {
			if (!grouped.has(obj.paneIndex)) {
				grouped.set(obj.paneIndex, []);
			}
			grouped.get(obj.paneIndex)!.push(obj);
		});
		return grouped;
	});

	function getTypeIcon(type: ChartObject['type']): string {
		switch (type) {
			case 'series':
				return '📊';
			case 'marker':
				return '📍';
			case 'indicator':
				return '📈';
			case 'priceline':
				return '━';
			case 'primitive':
				return '⚡';
			default:
				return '•';
		}
	}

	function getSeriesTypeLabel(seriesType?: SeriesType): string {
		if (!seriesType) return 'Series';
		return seriesType.charAt(0).toUpperCase() + seriesType.slice(1);
	}

	// Validation: markers and primitives can't move between panes independently
	function validateDrop(state: DragDropState<ChartObject>, targetPaneIndex: number) {
		const { draggedItem, sourceContainer } = state;

		if (!draggedItem) {
			invalidDrop = true;
			return false;
		}

		// Extract source pane index from container ID
		const sourcePaneIndex = parseInt(sourceContainer?.split('-')[1] || '0');

		// If moving between panes, check if item is allowed to move
		if (sourcePaneIndex !== targetPaneIndex) {
			// Markers and primitives can only stay with their parent series
			if (draggedItem.type === 'marker' || draggedItem.type === 'primitive') {
				invalidDrop = true;
				return false;
			}
		}

		invalidDrop = false;
		return true;
	}

	// Handle drop on pane header (moving between panes)
	function handlePaneDrop(state: DragDropState<ChartObject>, targetPaneIndex: number) {
		const { draggedItem, sourceContainer } = state;

		if (!draggedItem || invalidDrop) return;

		const sourcePaneIndex = parseInt(sourceContainer?.split('-')[1] || '0');

		// If dropping on different pane, move the series
		if (sourcePaneIndex !== targetPaneIndex) {
			onMoveToPane?.(draggedItem.id, targetPaneIndex);
		}
	}

	// Handle drop within same pane (reordering)
	function handleItemDrop(state: DragDropState<ChartObject>, paneIndex: number) {
		const { draggedItem, targetContainer, sourceContainer } = state;

		if (!targetContainer || !draggedItem || invalidDrop) return;

		const sourcePaneIndex = parseInt(sourceContainer?.split('-')[1] || '0');
		const dropIndex = parseInt(targetContainer.split('-').pop() || '0');

		// If moving between panes
		if (sourcePaneIndex !== paneIndex) {
			onMoveToPane?.(draggedItem.id, paneIndex);
			return;
		}

		// Otherwise, reorder within same pane
		const paneObjects = objectsByPane.get(paneIndex) || [];
		const dragIndex = paneObjects.findIndex(obj => obj.id === draggedItem.id);

		if (dragIndex === -1 || isNaN(dropIndex)) return;

		const newPaneObjects = [...paneObjects];
		const [movedItem] = newPaneObjects.splice(dragIndex, 1);
		newPaneObjects.splice(dropIndex, 0, movedItem);

		const otherObjects = localObjects.filter(obj => obj.paneIndex !== paneIndex);
		localObjects = [...otherObjects, ...newPaneObjects];

		onReorder?.(localObjects);
	}
</script>

<div class="object-tree">
	<div class="tree-header">
		<h3>Object Tree</h3>
		<span class="object-count">{objects.length} objects</span>
	</div>

	<div class="tree-content">
		{#if objectsByPane.size === 0}
			<div class="empty-state">No objects in chart</div>
		{:else}
			{#each [...objectsByPane.entries()] as [paneIndex, paneObjects]}
				<div class="pane-group">
					<button
						class="pane-header"
						class:drag-over-pane={isDragging && !invalidDrop}
						class:invalid-drop-pane={isDragging && invalidDrop}
						onclick={() => togglePane(paneIndex)}
						use:droppable={{
							container: `pane-${paneIndex}`,
							callbacks: {
								onDragOver: (state) => validateDrop(state, paneIndex),
								onDrop: (state) => handlePaneDrop(state, paneIndex),
								onDragLeave: () => {
									invalidDrop = false;
								},
								onDragEnd: () => {
									isDragging = false;
									invalidDrop = false;
								}
							}
						}}
					>
						<span class="expand-icon">{expandedPanes.has(paneIndex) ? '▼' : '▶'}</span>
						<span class="pane-label">Pane {paneIndex + 1}</span>
						<span class="pane-count">{paneObjects.length}</span>
					</button>

					{#if expandedPanes.has(paneIndex)}
						<div class="pane-objects">
							{#each paneObjects as obj, index (obj.id)}
								<div
									use:draggable={{
										container: `pane-${paneIndex}-${index}`,
										dragData: obj,
										callbacks: {
											onDragStart: () => {
												isDragging = true;
												invalidDrop = false;
											},
											onDragEnd: () => {
												isDragging = false;
												invalidDrop = false;
											}
										}
									}}
									use:droppable={{
										container: `pane-${paneIndex}-${index}`,
										callbacks: {
											onDragOver: (state) => validateDrop(state, paneIndex),
											onDrop: (state) => handleItemDrop(state, paneIndex),
											onDragLeave: () => {
												invalidDrop = false;
											}
										},
										attributes: {
											draggingClass: 'dragging',
											dragOverClass: invalidDrop ? 'drag-over-invalid' : 'drag-over'
										}
									}}
									class="object-item"
									class:hidden={!obj.visible}
									class:locked={obj.type === 'marker' || obj.type === 'primitive'}
								>
									<span class="drag-handle" class:locked={obj.type === 'marker' || obj.type === 'primitive'}>
										{obj.type === 'marker' || obj.type === 'primitive' ? '🔒' : '⋮⋮'}
									</span>
									<span class="object-icon">{getTypeIcon(obj.type)}</span>
									<span class="object-name">
										{obj.name}
										{#if obj.seriesType}
											<span class="series-type">({getSeriesTypeLabel(obj.seriesType)})</span>
										{/if}
									</span>
									<div class="object-actions">
										{#if onToggleVisibility}
											<button
												class="action-btn visibility-btn"
												onclick={() => onToggleVisibility?.(obj.id)}
												title={obj.visible ? 'Hide' : 'Show'}
											>
												{obj.visible ? '👁️' : '🚫'}
											</button>
										{/if}
										{#if onRemove}
											<button
												class="action-btn remove-btn"
												onclick={() => onRemove?.(obj.id)}
												title="Remove"
											>
												🗑️
											</button>
										{/if}
									</div>
								</div>
							{/each}
						</div>
					{/if}
				</div>
			{/each}
		{/if}
	</div>
</div>

<style>
	.object-tree {
		background: #1e222d;
		border: 1px solid #2b2f3a;
		border-radius: 8px;
		overflow: hidden;
		display: flex;
		flex-direction: column;
		height: 100%;
		min-height: 400px;
	}

	.tree-header {
		padding: 1rem;
		border-bottom: 1px solid #2b2f3a;
		display: flex;
		justify-content: space-between;
		align-items: center;
		background: #252832;
	}

	.tree-header h3 {
		margin: 0;
		font-size: 1rem;
		color: #fff;
		font-weight: 600;
	}

	.object-count {
		font-size: 0.85rem;
		color: #8891a0;
	}

	.tree-content {
		flex: 1;
		overflow-y: auto;
		padding: 0.5rem;
	}

	.empty-state {
		padding: 2rem;
		text-align: center;
		color: #8891a0;
		font-size: 0.9rem;
	}

	.pane-group {
		margin-bottom: 0.5rem;
	}

	.pane-header {
		width: 100%;
		padding: 0.75rem;
		background: #252832;
		border: 1px solid #2b2f3a;
		border-radius: 6px;
		color: #fff;
		display: flex;
		align-items: center;
		gap: 0.5rem;
		cursor: pointer;
		transition: all 0.2s;
	}

	.pane-header:hover {
		background: #2b2f3a;
	}

	.pane-header.drag-over-pane {
		background: #2962ff20;
		border-color: #2962ff;
		box-shadow: inset 0 0 0 2px #2962ff50;
		transform: scale(1.02);
	}

	.pane-header.invalid-drop-pane {
		background: #ef535020;
		border-color: #ef5350;
		box-shadow: inset 0 0 0 2px #ef535050;
	}

	.expand-icon {
		font-size: 0.8rem;
		width: 1rem;
		display: inline-block;
	}

	.pane-label {
		flex: 1;
		font-weight: 500;
		font-size: 0.9rem;
	}

	.pane-count {
		background: #2962ff;
		color: white;
		padding: 0.2rem 0.5rem;
		border-radius: 12px;
		font-size: 0.75rem;
		font-weight: 600;
	}

	.pane-objects {
		padding: 0.5rem 0 0 0;
	}

	.object-item {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.6rem 0.75rem;
		margin-left: 1rem;
		background: #252832;
		border: 1px solid #2b2f3a;
		border-radius: 4px;
		margin-bottom: 0.25rem;
		cursor: grab;
	}

	.object-item:active {
		cursor: grabbing;
	}

	.object-item:hover {
		background: #2b2f3a;
		border-color: #363a45;
	}

	.object-item.hidden {
		opacity: 0.5;
	}

	/* Drag and drop states */
	.object-item:global(.dragging) {
		opacity: 0.5;
		transform: scale(1.05) rotate(2deg);
		box-shadow: 0 8px 16px rgba(0, 0, 0, 0.3);
		border-color: #2962ff;
		z-index: 1000;
	}

	.object-item:global(.drag-over) {
		background: #2962ff20;
		border-color: #2962ff;
		transform: scale(0.98);
		box-shadow: inset 0 0 0 2px #2962ff50;
	}

	.object-item:global(.drag-over-invalid) {
		background: #ef535020;
		border-color: #ef5350;
		transform: scale(0.98);
		box-shadow: inset 0 0 0 2px #ef535050;
	}

	.object-item.locked {
		opacity: 0.7;
		cursor: not-allowed;
	}

	.drag-handle {
		color: #8891a0;
		font-size: 0.9rem;
		cursor: grab;
		user-select: none;
		opacity: 0.5;
		transition: opacity 0.2s;
	}

	.drag-handle.locked {
		color: #ef5350;
		cursor: not-allowed;
		opacity: 0.8;
	}

	.object-item:hover .drag-handle {
		opacity: 1;
	}

	.object-item.locked:hover .drag-handle.locked {
		opacity: 1;
	}

	.object-icon {
		font-size: 1rem;
		width: 1.5rem;
		text-align: center;
	}

	.object-name {
		flex: 1;
		font-size: 0.85rem;
		color: #d1d4dc;
	}

	.series-type {
		color: #8891a0;
		font-size: 0.75rem;
		margin-left: 0.25rem;
	}

	.object-actions {
		display: flex;
		gap: 0.25rem;
	}

	.action-btn {
		background: transparent;
		border: 1px solid #2b2f3a;
		border-radius: 4px;
		padding: 0.25rem 0.5rem;
		cursor: pointer;
		font-size: 0.9rem;
		transition: all 0.2s;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.action-btn:hover {
		background: #2b2f3a;
		border-color: #363a45;
	}

	.visibility-btn:hover {
		background: #2962ff20;
		border-color: #2962ff;
	}

	.remove-btn:hover {
		background: #ef535020;
		border-color: #ef5350;
	}

	/* Custom scrollbar */
	.tree-content::-webkit-scrollbar {
		width: 8px;
	}

	.tree-content::-webkit-scrollbar-track {
		background: #1e222d;
	}

	.tree-content::-webkit-scrollbar-thumb {
		background: #2b2f3a;
		border-radius: 4px;
	}

	.tree-content::-webkit-scrollbar-thumb:hover {
		background: #363a45;
	}
</style>
