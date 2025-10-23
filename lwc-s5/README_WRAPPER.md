# Lightweight Charts Svelte 5 Wrapper

A fully reactive, idiomatic Svelte 5 wrapper for [TradingView's Lightweight Charts](https://github.com/tradingview/lightweight-charts).

## Features

- 🚀 **Svelte 5 Runes** - Built from the ground up using `$state`, `$derived`, `$effect`, and `$props`
- 📊 **Fully Reactive** - Chart options, series data, and plugins update reactively
- 🧩 **Composable API** - Slot-based component composition for charts, series, and plugins
- 🔌 **Plugin Support** - First-class support for series and pane primitives
- 🎯 **Type-Safe** - Full TypeScript support with proper type inference
- 🎨 **Auto-Resize** - Built-in responsive behavior with ResizeObserver
- 🧹 **Auto-Cleanup** - Proper lifecycle management with automatic cleanup

## Installation

This wrapper is already included in this project. The main dependency is:

```bash
pnpm add lightweight-charts
```

## Quick Start

```svelte
<script lang="ts">
	import { Chart, Series } from '$lib';

	let data = $state([
		{ time: '2023-01-01', open: 100, high: 105, low: 95, close: 102 },
		{ time: '2023-01-02', open: 102, high: 108, low: 100, close: 106 }
	]);
</script>

<Chart width="100%" height={400}>
	<Series type="Candlestick" reactiveData={data} />
</Chart>
```

## Core Components

### Chart

The main container component that creates and manages the chart instance.

**Props:**
- `options?: DeepPartial<ChartOptions>` - Chart configuration (reactive)
- `width?: number | string` - Chart width (default: `'100%'`)
- `height?: number | string` - Chart height (default: `400`)
- `autoResize?: boolean` - Auto-resize on window resize (default: `true`)
- `onCreate?: (chart: IChartApi) => void` - Callback when chart is created
- `onDestroy?: () => void` - Callback when chart is destroyed

**Example:**
```svelte
<script>
	let chartOptions = $state({
		layout: { background: { color: '#1e1e1e' } },
		timeScale: { borderColor: '#485c7b' }
	});
</script>

<Chart
	options={chartOptions}
	height={500}
	onCreate={(chart) => console.log('Chart ready!', chart)}
>
	<!-- Series components go here -->
</Chart>
```

### Series

Represents a data series within the chart. Must be nested inside a `Chart` component.

**Props:**
- `type: SeriesType` - Type of series: `'Candlestick'`, `'Line'`, `'Area'`, `'Bar'`, `'Histogram'`, or `'Baseline'`
- `data?: SeriesDataItemTypeMap[T][]` - Initial data
- `reactiveData?: SeriesDataItemTypeMap[T][]` - Reactive data (updates automatically)
- `options?: DeepPartial<SeriesOptionsMap[T]>` - Series configuration (reactive)
- `onCreate?: (series: ISeriesApi<T>) => void` - Callback when series is created
- `onDestroy?: () => void` - Callback when series is destroyed

**Example:**
```svelte
<Chart>
	<Series
		type="Candlestick"
		reactiveData={candlestickData}
		options={{
			upColor: '#26a69a',
			downColor: '#ef5350'
		}}
	/>

	<Series
		type="Line"
		reactiveData={lineData}
		options={{ color: '#2962FF' }}
	/>
</Chart>
```

### SeriesPlugin

Attaches a series primitive (plugin) to a series. Must be nested inside a `Series` component.

**Props:**
- `primitive: ISeriesPrimitiveBase<Time>` - The plugin instance
- `onAttach?: () => void` - Callback when plugin is attached
- `onDetach?: () => void` - Callback when plugin is detached

**Example:**
```svelte
<script>
	import { MyCustomPlugin } from './plugins';

	let plugin = $state(new MyCustomPlugin({ /* options */ }));
</script>

<Chart>
	<Series type="Candlestick" reactiveData={data}>
		<SeriesPlugin
			primitive={plugin}
			onAttach={() => console.log('Plugin ready!')}
		/>
	</Series>
</Chart>
```

### PanePlugin

Attaches a pane primitive to the chart's main pane. Must be nested inside a `Chart` component.

**Props:**
- `primitive: IPanePrimitiveBase` - The plugin instance
- `onAttach?: () => void` - Callback when plugin is attached
- `onDetach?: () => void` - Callback when plugin is detached

**Example:**
```svelte
<Chart>
	<PanePlugin primitive={watermarkPlugin} />
	<Series type="Candlestick" reactiveData={data} />
</Chart>
```

## Creating Plugins

Plugins are created by implementing the `ISeriesPrimitiveBase` or `IPanePrimitiveBase` interface. Here's a simple example:

```typescript
import type {
	ISeriesPrimitive,
	IPrimitivePaneRenderer,
	IPrimitivePaneView,
	SeriesAttachedParameter,
	Time
} from 'lightweight-charts';
import type { CanvasRenderingTarget2D } from 'fancy-canvas';

interface TextOptions {
	text: string;
	color: string;
	x: number;
	y: number;
}

class TextRenderer implements IPrimitivePaneRenderer {
	constructor(private options: TextOptions) {}

	draw(target: CanvasRenderingTarget2D) {
		target.useMediaCoordinateSpace((scope) => {
			const ctx = scope.context;
			ctx.font = '16px sans-serif';
			ctx.fillStyle = this.options.color;
			ctx.fillText(this.options.text, this.options.x, this.options.y);
		});
	}
}

class TextPaneView implements IPrimitivePaneView {
	constructor(private source: TextPlugin) {}

	update() {}

	renderer() {
		return new TextRenderer(this.source.options());
	}
}

export class TextPlugin implements ISeriesPrimitive<Time> {
	private _paneViews: TextPaneView[];
	private _options: TextOptions;
	requestUpdate?: () => void;

	constructor(options: TextOptions) {
		this._options = options;
		this._paneViews = [new TextPaneView(this)];
	}

	options() {
		return this._options;
	}

	updateOptions(options: Partial<TextOptions>) {
		this._options = { ...this._options, ...options };
		this.requestUpdate?.();
	}

	updateAllViews() {
		this._paneViews.forEach((pw) => pw.update());
	}

	paneViews() {
		return this._paneViews;
	}

	attached({ requestUpdate }: SeriesAttachedParameter<Time>) {
		this.requestUpdate = requestUpdate;
	}

	detached() {
		this.requestUpdate = undefined;
	}
}
```

## Reactivity Patterns

### Reactive Chart Options

```svelte
<script>
	let isDark = $state(true);

	let chartOptions = $derived({
		layout: {
			background: { color: isDark ? '#1e1e1e' : '#ffffff' },
			textColor: isDark ? '#d1d4dc' : '#191919'
		}
	});
</script>

<button onclick={() => isDark = !isDark}>Toggle Theme</button>

<Chart options={chartOptions}>
	<Series type="Line" reactiveData={data} />
</Chart>
```

### Reactive Series Data

```svelte
<script>
	let data = $state(initialData);

	function addDataPoint() {
		data = [...data, newPoint];
	}

	function replaceAllData() {
		data = generateNewData();
	}
</script>

<Chart>
	<Series type="Candlestick" reactiveData={data} />
</Chart>
```

### Reactive Plugin Updates

```svelte
<script>
	let textPlugin = $state(new TextPlugin({ text: 'Initial' }));

	function updateText(newText: string) {
		textPlugin.updateOptions({ text: newText });
	}
</script>

<Chart>
	<Series type="Line" reactiveData={data}>
		<SeriesPlugin primitive={textPlugin} />
	</Series>
</Chart>
```

## Advanced Usage

### Multiple Panes

```svelte
<Chart>
	<!-- Main pane with candlestick -->
	<Series type="Candlestick" reactiveData={priceData} />

	<!-- You can add more series to the main pane -->
	<Series type="Line" reactiveData={maData} />

	<!-- For separate panes, you would need to extend the wrapper
	     or use the chart API directly via onCreate -->
</Chart>
```

### Direct API Access

```svelte
<script>
	let chart: IChartApi;
	let series: ISeriesApi<'Line'>;
</script>

<Chart onCreate={(c) => (chart = c)}>
	<Series
		type="Line"
		reactiveData={data}
		onCreate={(s) => {
			series = s;
			// Now you can use the full API
			series.createPriceLine({ price: 100, color: 'red' });
		}}
	/>
</Chart>
```

### Custom Series Updates

```svelte
<script>
	let seriesRef: any;

	function updateSinglePoint(point: LineData) {
		seriesRef?.update(point);
	}
</script>

<Series
	bind:this={seriesRef}
	type="Line"
	reactiveData={data}
/>
```

## Architecture

The wrapper is designed around Svelte 5's modern reactive primitives:

1. **Context API** - `Chart` provides chart instance via context, `Series` provides series instance
2. **Runes** - All reactive state uses `$state`, `$derived`, and `$effect`
3. **Lifecycle** - Proper cleanup with `onMount` return functions
4. **Composition** - Slot-based nesting enables intuitive API

**Component Hierarchy:**
```
Chart (provides ChartContext)
├── Series (provides SeriesContext)
│   └── SeriesPlugin (consumes SeriesContext)
└── PanePlugin (consumes ChartContext)
```

## Performance Considerations

1. **Reactive Data** - Use `reactiveData` prop for automatic updates. Changes to the data array trigger `setData()`
2. **Incremental Updates** - For real-time data, use the `update()` method on series instances
3. **Auto-Resize** - Disable with `autoResize={false}` if you manage sizing manually
4. **Plugin Updates** - Plugins that implement `requestUpdate()` can trigger redraws efficiently

## TypeScript Support

Full type safety is provided out of the box:

```typescript
import type {
	IChartApi,
	ISeriesApi,
	CandlestickData,
	ChartOptions
} from '$lib';

let chart: IChartApi | undefined;
let candleSeries: ISeriesApi<'Candlestick'> | undefined;
let options: DeepPartial<ChartOptions> = { /* typed options */ };
let data: CandlestickData[] = [ /* typed data */ ];
```

## Examples

See `src/routes/+page.svelte` for a comprehensive example demonstrating:
- Multiple series types
- Reactive options and data
- Plugin integration
- Theme switching
- Real-time updates

## Resources

- [Lightweight Charts Documentation](https://tradingview.github.io/lightweight-charts/)
- [Plugin Examples](https://github.com/tradingview/lightweight-charts/tree/master/plugin-examples)
- [Svelte 5 Runes](https://svelte.dev/docs/svelte/$state)

## License

This wrapper follows the same Apache 2.0 license as Lightweight Charts.
