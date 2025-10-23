# Technical Indicators

Svelte 5 native components for technical indicators that work seamlessly with the lightweight-charts wrapper.

## Features

- 📊 **Reactive** - Automatically recalculate when source data or options change
- 🎨 **Customizable** - Full control over styling and appearance
- 🔌 **Composable** - Use with any series type (Candlestick, Line, Area, etc.)
- 🧮 **Pure Calculations** - Indicator logic separated from UI for reusability
- 📈 **Multiple Panes** - Display indicators in separate panes or overlay on main chart

## Available Indicators

### Moving Average

Calculates various types of moving averages (SMA, EMA, WMA) with optional smoothing and offset.

```svelte
<MovingAverage
  series={mainSeries}
  options={{
    length: 20,
    source: 'close',
    smoothingLine: 'EMA',
    smoothingLength: 5,
    offset: 0
  }}
  seriesOptions={{
    color: 'blue',
    lineWidth: 2,
    title: 'MA(20)'
  }}
  paneIndex={0}
/>
```

**Options:**
- `length` - Number of periods for the moving average
- `source` - Data property to use ('close', 'value', etc.)
- `smoothingLine` - Optional smoothing type ('SMA', 'EMA', 'WMA')
- `smoothingLength` - Length for smoothing (if enabled)
- `offset` - Shift the MA forward (positive) or backward (negative)

### Momentum

Measures the rate of change in price over a specified period.

```svelte
<Momentum
  series={mainSeries}
  options={{
    length: 14,
    source: 'close'
  }}
  seriesOptions={{
    color: 'orange',
    lineWidth: 2,
    title: 'Momentum(14)'
  }}
  paneIndex={1}
/>
```

**Options:**
- `length` - Number of periods to look back
- `source` - Data property to use ('close', 'value', etc.)

### Correlation

Calculates the Pearson correlation coefficient between two series over a rolling window.

```svelte
<Correlation
  primarySeries={mainSeries}
  secondarySeries={compareSeries}
  options={{
    length: 20,
    primarySource: 'close',
    secondarySource: 'value',
    allowMismatchedDates: false
  }}
  seriesOptions={{
    baseValue: { type: 'price', price: 0 },
    title: 'Correlation(20)'
  }}
  paneIndex={2}
/>
```

**Options:**
- `length` - Window size for correlation calculation
- `primarySource` - Property from primary series
- `secondarySource` - Property from secondary series
- `allowMismatchedDates` - Allow calculation when timestamps don't match exactly

## Usage Pattern

All indicators follow the same usage pattern:

1. **Create a source series** using the `<Series>` component
2. **Add the indicator** as a child or sibling, passing the series reference
3. **Configure options** for calculation parameters
4. **Style the indicator** using `seriesOptions`
5. **Position in panes** using `paneIndex` (optional)

## Example: Complete Setup

```svelte
<script lang="ts">
  import { Chart, Series, MovingAverage, Momentum } from '$lib';
  import type { ISeriesApi } from 'lightweight-charts';
  
  let mainSeries: ISeriesApi<'Candlestick'> | undefined = $state();
</script>

<Chart options={chartOptions} width="100%" height={600}>
  <!-- Main price series -->
  <Series
    type="Candlestick"
    data={priceData}
    paneIndex={0}
    onCreate={(s) => mainSeries = s}
  >
    {#if mainSeries}
      <!-- Moving average overlay on price -->
      <MovingAverage
        series={mainSeries}
        options={{ length: 20, source: 'close' }}
        paneIndex={0}
      />
    {/if}
  </Series>

  <!-- Momentum in separate pane -->
  {#if mainSeries}
    <Momentum
      series={mainSeries}
      options={{ length: 14, source: 'close' }}
      paneIndex={1}
    />
  {/if}
</Chart>
```

## Calculation Functions

Each indicator also exports its calculation function, which can be used independently:

```typescript
import {
  calculateMovingAverageIndicatorValues,
  calculateMomentumIndicatorValues,
  calculateCorrelationIndicatorValues
} from '$lib/indicators';

// Use directly with data arrays
const maValues = calculateMovingAverageIndicatorValues(data, {
  length: 20,
  source: 'close'
});
```

## Helper Utilities

### ClosestTimeIndexFinder

Binary search utility for finding the closest time index in sorted data:

```typescript
import { ClosestTimeIndexFinder } from '$lib/indicators';

const finder = new ClosestTimeIndexFinder(sortedData);
const index = finder.findClosestIndex(targetTime, 'left');
```

### ensureTimestampData

Validates that all data items have numeric timestamps:

```typescript
import { ensureTimestampData } from '$lib/indicators';

const validatedData = ensureTimestampData(rawData);
```

## Architecture

The indicators follow a clean separation of concerns:

- **Calculation Modules** (`*-calculation.ts`) - Pure functions for indicator math
- **Svelte Components** (`*.svelte`) - Reactive UI layer that manages series lifecycle
- **Helper Utilities** - Shared functions for data validation and searching

This architecture makes it easy to:
- Test calculation logic independently
- Reuse calculations in different contexts
- Add new indicators following the same pattern

## Adding Custom Indicators

To add a new indicator:

1. Create calculation module: `my-indicator/my-indicator-calculation.ts`
2. Create Svelte component: `my-indicator/MyIndicator.svelte`
3. Export from `indicators/index.ts`
4. Follow the same patterns as existing indicators

See the source code of `MovingAverage.svelte` as a reference implementation.
