# Technical Indicators Integration

This document describes the integration of technical indicators from the lightweight-charts indicator-examples into Svelte 5 native components.

## Overview

We've extracted and adapted three key indicators from the official lightweight-charts indicator examples:
- **Moving Average** (SMA, EMA, WMA)
- **Momentum**
- **Correlation**

These have been transformed into reactive Svelte 5 components that work seamlessly with the chart wrapper.

## Structure

```
src/lib/indicators/
├── README.md                     # Detailed usage documentation
├── index.ts                      # Main exports
├── helpers/
│   ├── closest-index.ts         # Binary search for time-based data
│   └── timestamp-data.ts        # Data validation utilities
├── moving-average/
│   ├── MovingAverage.svelte     # Svelte component
│   └── moving-average-calculation.ts  # Pure calculation logic
├── momentum/
│   ├── Momentum.svelte          # Svelte component
│   └── momentum-calculation.ts  # Pure calculation logic
└── correlation/
    ├── Correlation.svelte       # Svelte component
    └── correlation-calculation.ts  # Pure calculation logic
```

## Key Features

### 1. Reactive by Design
All indicators use Svelte 5's `$state` and `$effect` runes to automatically recalculate when:
- Source series data changes
- Calculation options change
- Series styling options change

### 2. Clean Separation
Following the original indicator-examples architecture:
- **Calculation modules** contain pure mathematical logic
- **Svelte components** handle lifecycle, subscriptions, and reactivity
- **Helper utilities** provide shared functionality

### 3. Flexible Usage
Indicators can:
- Overlay on the main chart (same pane)
- Display in separate panes
- Work with any series type (Candlestick, Line, Area, etc.)
- Be styled independently using `seriesOptions`

### 4. Type-Safe
Full TypeScript support with:
- Generic series type parameters
- Typed calculation options
- Type-safe data structures

## Quick Start

```svelte
<script lang="ts">
  import { Chart, Series, MovingAverage, Momentum } from '$lib';
  import type { ISeriesApi } from 'lightweight-charts';
  
  let mainSeries: ISeriesApi<'Candlestick'> | undefined = $state();
</script>

<Chart options={chartOptions} width="100%" height={600}>
  <Series
    type="Candlestick"
    data={priceData}
    onCreate={(s) => mainSeries = s}
  >
    {#if mainSeries}
      <MovingAverage
        series={mainSeries}
        options={{ length: 20, source: 'close' }}
        seriesOptions={{ color: 'blue', lineWidth: 2 }}
      />
    {/if}
  </Series>
  
  {#if mainSeries}
    <Momentum
      series={mainSeries}
      options={{ length: 14, source: 'close' }}
      paneIndex={1}
    />
  {/if}
</Chart>
```

## Demo Page

A comprehensive demo is available at `/indicator-examples` showing:
- All three indicators in action
- Interactive controls for adjusting parameters
- Multi-pane layout
- Code examples and documentation

## Comparison with Original Implementation

### Original (indicator-examples)
```typescript
// Imperative API using primitives
const maSeries = applyMovingAverageIndicator(mainSeries, {
  length: 20,
  source: 'close'
});
maSeries.applyOptions({ color: 'blue' });
```

### Svelte 5 Version
```svelte
<!-- Declarative component-based API -->
<MovingAverage
  series={mainSeries}
  options={{ length: 20, source: 'close' }}
  seriesOptions={{ color: 'blue' }}
/>
```

## Benefits of Svelte 5 Approach

1. **Declarative** - Indicators are declared in markup, not imperative code
2. **Reactive** - Automatic updates when data or options change
3. **Composable** - Easy to combine multiple indicators
4. **Lifecycle Management** - Component lifecycle handles cleanup automatically
5. **Type-Safe** - Full TypeScript support with Svelte's type inference
6. **SSR Compatible** - Can be used in SvelteKit apps with SSR

## Adding More Indicators

The architecture makes it straightforward to add more indicators from the indicator-examples repo:

1. Copy the calculation logic from `indicator-examples/src/indicators/{name}/{name}-calculation.ts`
2. Create a Svelte component following the pattern in `MovingAverage.svelte`
3. Export from `indicators/index.ts`
4. Add to the demo page

Candidates for future addition:
- Average Price
- Median Price
- Percent Change
- Product
- Ratio
- Spread
- Sum
- Weighted Close

## Technical Notes

### Data Subscription Pattern
All indicators subscribe to the source series' `dataChanged` event:
```typescript
series.subscribeDataChanged(updateData);
// Cleanup
series.unsubscribeDataChanged(updateData);
```

### Calculation Trigger
Data recalculation is triggered by:
1. Source series data changes (via subscription)
2. Options changes (via `$effect` reactivity)

### Multi-Series Indicators
The Correlation indicator demonstrates handling multiple source series:
```typescript
primarySeries.subscribeDataChanged(updateData);
secondarySeries.subscribeDataChanged(updateData);
```

## Performance Considerations

- Calculations use efficient algorithms (rolling windows, incremental updates where possible)
- Binary search (ClosestTimeIndexFinder) with caching for time lookups
- Only recalculate when necessary (reactive updates)
- Pure calculation functions can be memoized if needed

## Testing

The calculation modules are pure functions that can be tested independently:

```typescript
import { calculateMovingAverageIndicatorValues } from '$lib/indicators';

const data = [
  { time: 1, value: 10 },
  { time: 2, value: 20 },
  // ...
];

const result = calculateMovingAverageIndicatorValues(data, {
  length: 2,
  source: 'value'
});

// Assert expected values
```

## Resources

- [Lightweight Charts Indicator Examples](https://github.com/tradingview/lightweight-charts/tree/master/indicator-examples)
- [Svelte 5 Runes Documentation](https://svelte.dev/docs/svelte/$state)
- [Demo Page](/indicator-examples)
- [Indicators README](src/lib/indicators/README.md)
