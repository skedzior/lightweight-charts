# GridStack + Lightweight Charts Integration

A clean, performant integration of GridStack.js and Lightweight Charts using Svelte 5, enabling drag-and-drop resizable chart panels with automatic chart resizing.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                      GridStack Container                     │
│  - Manages grid layout, drag/drop, resize events            │
└─────────────────────────────────────────────────────────────┘
                            │
                            ├─── ChartGridItem (1..n)
                            │     ├─ GridStackItem (positioning)
                            │     └─ Chart (auto-resize enabled)
                            │          └─ Series (reactive data)
                            │
                            ├─── ChartGridItem (1..n)
                            └─── ...
```

## Components

### 1. **GridStack** (`src/lib/gridstack/GridStack.svelte`)

Main grid container component from gridstack-s5 wrapper.

**Key Features:**
- Dynamic import of GridStack.js (client-side only)
- Reactive items management with `$bindable()`
- Event handlers for drag, resize, and change events
- Automatic cleanup on component destruction

**Props:**
```typescript
{
  options?: GridStackOptions;      // Grid configuration
  items?: GridStackWidget[];       // Grid items array (bindable)
  class?: string;                  // CSS classes
  children?: Snippet;              // Svelte 5 snippet for items
  onchange?: (items: GridStackWidget[]) => void;
  onadded?: (items: GridStackWidget[]) => void;
  onremoved?: (items: GridStackWidget[]) => void;
  ondragstart?: (event: Event, el: HTMLElement) => void;
  ondragstop?: (event: Event, el: HTMLElement) => void;
  onresizestart?: (event: Event, el: HTMLElement) => void;
  onresizestop?: (event: Event, el: HTMLElement) => void;
}
```

### 2. **GridStackItem** (`src/lib/gridstack/GridStackItem.svelte`)

Individual grid item wrapper.

**Props:**
```typescript
{
  x?: number;          // Grid column position
  y?: number;          // Grid row position
  w?: number;          // Width in grid columns (default: 1)
  h?: number;          // Height in grid rows (default: 1)
  id?: string;         // Unique identifier
  minW?: number;       // Minimum width
  minH?: number;       // Minimum height
  maxW?: number;       // Maximum width
  maxH?: number;       // Maximum height
  noResize?: boolean;  // Disable resizing
  noMove?: boolean;    // Disable dragging
  locked?: boolean;    // Lock position and size
  class?: string;      // CSS classes
  children?: Snippet;  // Content
}
```

### 3. **ChartGridItem** (`src/lib/gridstack/ChartGridItem.svelte`) ⭐

**The key integration component** that combines GridStackItem with Chart.

**Design Philosophy:**
- **Composability**: Wraps GridStackItem and Chart together
- **Auto-resize**: Chart uses `autoResize={true}` with ResizeObserver
- **Flexibility**: Accepts any chart content via snippet pattern
- **Performance**: Resize only happens after drag/resize completes
- **Drag Handle**: Only the header is draggable, chart area is fully interactive

**Props:**
```typescript
{
  // Grid positioning (inherits from GridStackItem)
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
  title?: string;           // Chart title (default: "Chart")
  showHeader?: boolean;     // Show/hide header (default: true)

  // Chart configuration
  chartOptions?: DeepPartial<ChartOptions>;
  chartHeight?: number | string;

  // Content via snippet
  chartContent?: Snippet;  // Render Series and plugins here
}
```

**Usage Example:**
```svelte
<ChartGridItem
  id="my-chart"
  title="Candlestick Chart"
  x={0} y={0} w={6} h={4}
  minW={3} minH={3}
  chartOptions={{ layout: { background: { color: '#ffffff' } } }}
  chartHeight="100%"
>
  {#snippet chartContent()}
    <Series
      type="Candlestick"
      reactiveData={candlestickData}
      options={{ upColor: '#26a69a', downColor: '#ef5350' }}
    />
  {/snippet}
</ChartGridItem>
```

**Key Features:**

1. **Drag Handle Header**: The header bar is the only draggable area. This means:
   - Click and drag the header to move the chart
   - Mouse/scroll interactions in the chart area work normally
   - No accidental dragging while interacting with the chart

2. **GridStack Configuration**: Enable drag handle mode:
```svelte
<GridStack
  options={{
    handle: '.grid-stack-item-drag-handle',  // Enable drag handle
    // ... other options
  }}
>
```

## Performance Optimizations

### 1. **Efficient Resize Handling**

```svelte
<GridStack onresizestop={handleResizeStop}>
  <ChartGridItem autoResize={true}>
    <!-- Chart automatically resizes via ResizeObserver -->
  </ChartGridItem>
</GridStack>
```

**How it works:**
- GridStack fires `resizestop` event when user stops resizing
- Chart uses ResizeObserver to detect container size changes
- Chart calls `chart.resize()` only when container size changes
- **No resize during drag** - prevents layout thrashing

### 2. **Reactive Data Updates**

For live WebSocket data integration:

```svelte
<script>
  let liveData = $state([...initialData]);

  // WebSocket update handler
  function handleWSMessage(newBar) {
    // Option 1: Full array replacement (triggers reactiveData)
    liveData = [...liveData.slice(-99), newBar];

    // Option 2: Incremental update (more efficient)
    // series.update(newBar);
  }
</script>

<Series type="Candlestick" reactiveData={liveData} />
```

**Best Practices:**
- Use `reactiveData` for full dataset replacements
- Use `series.update()` for incremental updates (via `onCreate` callback)
- Keep visible data window limited (e.g., last 100-500 bars)
- Debounce high-frequency updates (>1 update/second)

### 3. **Memory Management**

```svelte
<script>
  import { onDestroy } from 'svelte';

  let updateInterval: ReturnType<typeof setInterval>;

  function startLiveUpdates() {
    updateInterval = setInterval(() => {
      // Update data - keep only last N items
      liveData = [...liveData.slice(-100), newBar];
    }, 1000);
  }

  onDestroy(() => {
    if (updateInterval) clearInterval(updateInterval);
  });
</script>
```

## Demo Implementation

See `/src/routes/gridstack-charts/+page.svelte` for a complete demo featuring:

1. **6 Different Chart Examples:**
   - **Candlestick chart** - OHLC data with green/red candles
   - **Line chart** - Dark theme with blue line
   - **Area chart** - Gradient fill area series
   - **Volume chart** - Histogram with colored bars
   - **Multi-pane chart** - Price candlesticks + volume in separate panes
   - **Heatmap series** - Custom series showing heat intensity data

2. **Interactive Features:**
   - **Drag handle header** - Only header is draggable, chart area fully interactive
   - **Chart titles** - Each chart has a descriptive title
   - **Mouse/scroll in charts** - Works normally without triggering grid drag
   - **Resize panels** - Drag bottom-right corner to resize

3. **Live Data Simulation:**
   - Start/Stop controls
   - Updates every second
   - Efficient data windowing (last 100 bars)

4. **Grid Features:**
   - Drag panels by header only
   - Resize panels (min 3x3 grid units)
   - Automatic chart resize
   - Persistent layout on change events

5. **Responsive Design:**
   - Charts fill 100% of grid item
   - Auto-resize on grid layout changes
   - Proper styling with shadows and borders

## WebSocket Integration Guide

### Setting Up Live Data Feed

```svelte
<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import type { CandlestickData } from 'lightweight-charts';

  let liveData = $state<CandlestickData[]>([]);
  let ws: WebSocket;

  onMount(() => {
    // Connect to WebSocket
    ws = new WebSocket('wss://your-data-feed.com/stream');

    ws.onmessage = (event) => {
      const newBar: CandlestickData = JSON.parse(event.data);

      // Efficient update: keep last 500 bars
      liveData = [
        ...liveData.slice(-499),
        newBar
      ];
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
  });

  onDestroy(() => {
    ws?.close();
  });
</script>

<ChartGridItem id="live-chart">
  {#snippet chartContent()}
    <Series
      type="Candlestick"
      reactiveData={liveData}
    />
  {/snippet}
</ChartGridItem>
```

### Optimizing High-Frequency Updates

For very high-frequency data (e.g., tick data), use incremental updates:

```svelte
<script lang="ts">
  import type { ISeriesApi } from 'lightweight-charts';

  let chartSeries: ISeriesApi<'Candlestick'>;

  function handleSeriesCreate(series: ISeriesApi<'Candlestick'>) {
    chartSeries = series;
  }

  ws.onmessage = (event) => {
    const newBar = JSON.parse(event.data);

    // Direct update - much faster than array replacement
    if (chartSeries) {
      chartSeries.update(newBar);
    }
  };
</script>

<Series
  type="Candlestick"
  data={initialData}
  onCreate={handleSeriesCreate}
/>
```

## Extending the Integration

### Custom Grid Items

Create specialized grid items for different use cases:

```svelte
<!-- CustomIndicatorGridItem.svelte -->
<script lang="ts">
  import ChartGridItem from '$lib/gridstack/ChartGridItem.svelte';
  import { Series } from '$lib/chart';
  import type { LineData } from 'lightweight-charts';

  let { indicator, data }: {
    indicator: string;
    data: LineData[];
  } = $props();
</script>

<ChartGridItem
  {...$$restProps}
  chartOptions={{
    layout: { background: { color: '#1e222d' } }
  }}
>
  {#snippet chartContent()}
    <Series
      type="Line"
      reactiveData={data}
      options={{ color: '#2962FF', lineWidth: 2 }}
    />
  {/snippet}
</ChartGridItem>
```

### Multi-Pane Charts

Combine multiple series in separate panes within the same grid item:

```svelte
<ChartGridItem
  id="multi-pane-chart"
  title="Multi-Pane Chart"
  w={6} h={6}
>
  {#snippet chartContent()}
    <!-- Main price series (pane 0) -->
    <Series
      type="Candlestick"
      reactiveData={priceData}
      paneIndex={0}
      options={{
        upColor: '#26a69a',
        downColor: '#ef5350',
      }}
    />

    <!-- Volume in separate pane (pane 1) -->
    <Series
      type="Histogram"
      reactiveData={volumeData}
      paneIndex={1}
      options={{
        priceFormat: { type: 'volume' },
        priceScaleId: '',
      }}
    />
  {/snippet}
</ChartGridItem>
```

**Key Points:**
- Use `paneIndex` prop to specify which pane (0 = main, 1 = second, etc.)
- Each pane has its own price scale
- Panes automatically adjust height to fit container

### Custom Series (Heatmap Example)

Use custom series for specialized visualizations like heatmaps:

```svelte
<script>
  import { CustomSeries } from '$lib/chart';
  import { HeatMapSeries, generateHeatmapData } from '$lib/plugins/heatmap-series';

  let heatmapData = generateHeatmapData();
  let heatmapSeries = new HeatMapSeries();
</script>

<ChartGridItem
  id="heatmap-chart"
  title="Heatmap Series"
  w={6} h={6}
>
  {#snippet chartContent()}
    <CustomSeries
      view={heatmapSeries}
      data={heatmapData}
    />
  {/snippet}
</ChartGridItem>
```

**Key Points:**
- Create custom series instance: `new HeatMapSeries()`
- Pass instance to `view` prop of `CustomSeries`
- Custom series can render anything on the chart canvas
- Great for volume profiles, order books, depth charts, etc.

### Adding Plugins

Use the plugin system for overlays:

```svelte
<script>
  import { SeriesPlugin } from '$lib/chart';
  import { TradeBubblesPlugin } from '$lib/plugins/trade-bubbles';

  const tradePlugin = new TradeBubblesPlugin({
    trades: [
      { time: '2024-01-05', price: 102, size: 100, side: 'buy' }
    ]
  });
</script>

<ChartGridItem>
  {#snippet chartContent()}
    <Series type="Candlestick" reactiveData={data}>
      <SeriesPlugin primitive={tradePlugin} />
    </Series>
  {/snippet}
</ChartGridItem>
```

## API Reference

### GridStack Events

| Event | Signature | Description |
|-------|-----------|-------------|
| `onchange` | `(items: GridStackWidget[]) => void` | Fired on any layout change |
| `onadded` | `(items: GridStackWidget[]) => void` | Items added to grid |
| `onremoved` | `(items: GridStackWidget[]) => void` | Items removed from grid |
| `ondragstart` | `(event: Event, el: HTMLElement) => void` | Drag starts |
| `ondragstop` | `(event: Event, el: HTMLElement) => void` | Drag ends |
| `onresizestart` | `(event: Event, el: HTMLElement) => void` | Resize starts |
| `onresizestop` | `(event: Event, el: HTMLElement) => void` | Resize ends |

### GridStackOptions

```typescript
{
  cellHeight?: number | string;  // Height of rows (default: 60)
  margin?: number | string;      // Gap between items (default: 10)
  column?: number;               // Number of columns (default: 12)
  float?: boolean;               // Enable floating items (default: false)
  animate?: boolean;             // Animate movements (default: true)
  // ... see GridStack.js docs for full options
}
```

## Styling

### Custom Grid Styles

```css
:global(.grid-stack) {
  background: #f5f5f5;
}

:global(.chart-grid-item .grid-stack-item-content) {
  padding: 0 !important;
  overflow: hidden !important;
  background-color: transparent !important;
  border: 1px solid #ddd !important;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1) !important;
}
```

### Chart Container Styles

The `ChartGridItem` component includes built-in styles:

```css
.chart-container {
  flex: 1;
  min-height: 0;
  position: relative;
  overflow: hidden;
}
```

These ensure the chart fills the available space and resizes correctly.

## Troubleshooting

### Chart Not Resizing

**Issue:** Chart doesn't resize when grid item is resized.

**Solution:** Ensure `autoResize={true}` is set on Chart component:
```svelte
<Chart autoResize={true} width="100%" height="100%">
```

### Layout Shifts

**Issue:** Charts jump or flicker during resize.

**Solution:** Set proper min-height and overflow on container:
```css
.chart-container {
  min-height: 0;
  overflow: hidden;
}
```

### TypeScript Errors

**Issue:** Cannot find module 'gridstack' types.

**Solution:** The types are included in the gridstack package. If issues persist:
```bash
pnpm install gridstack@latest
```

### Performance Issues with Live Data

**Issue:** Charts lag with high-frequency updates.

**Solutions:**
1. Limit data window: `liveData.slice(-500)`
2. Use `series.update()` instead of `reactiveData`
3. Debounce updates:
```typescript
import { debounce } from 'lodash-es';
const updateChart = debounce((data) => series.update(data), 100);
```

## Running the Demo

1. Navigate to the lwc-s5 directory:
```bash
cd /home/hlnode_user/Documents/GitHub/lightweight-charts/lwc-s5
```

2. Install dependencies (if needed):
```bash
pnpm install
```

3. Start the dev server:
```bash
pnpm run dev
```

4. Open browser to:
```
http://localhost:5173/gridstack-charts
```

5. Try the features:
   - Drag panels to rearrange
   - Resize panels (grab bottom-right corner)
   - Click "Start Live Updates" to simulate data feed
   - Watch charts auto-resize with grid changes

## Next Steps

1. **Add Data Persistence:**
   - Save grid layout to localStorage
   - Save chart configurations per item
   - Restore layout on page load

2. **Add More Chart Types:**
   - Create specialized grid items for indicators
   - Multi-pane chart grid items
   - Comparison charts with multiple symbols

3. **Integrate Real Data:**
   - Connect to WebSocket data feeds
   - Implement data caching strategies
   - Add reconnection logic

4. **Enhanced Interactions:**
   - Add toolbar to each chart grid item
   - Implement chart synchronization (crosshair sync)
   - Add context menus for chart actions

## License

This integration builds on:
- **GridStack.js** - MIT License
- **Lightweight Charts** - Apache License 2.0
- **Svelte** - MIT License

See respective project repositories for full license terms.
