# Plugin Examples Documentation

This document explains the two advanced plugin examples integrated into the Svelte 5 wrapper.

## Overview

We've integrated two sophisticated plugins from the lightweight-charts plugin-examples repository:

1. **User Price Alerts** - Interactive price alert system
2. **Heatmap Series** - Custom series for heatmap visualization

## 1. User Price Alerts Plugin

### What It Does

The User Price Alerts plugin allows users to add and remove price alerts interactively by clicking on the price scale. It displays:
- Alert indicators on the chart
- Interactive buttons on the price axis
- Visual feedback on hover
- Event notifications when alerts are added/removed

### Implementation Details

**Type**: `ISeriesPrimitive<Time>` - Attaches to an existing series

**Key Files**:
- `src/lib/plugins/user-price-alerts/user-price-alerts.ts` - Main plugin class
- `src/lib/plugins/user-price-alerts/state.ts` - Alert state management
- `src/lib/plugins/user-price-alerts/mouse.ts` - Mouse interaction handlers
- `src/lib/plugins/user-price-alerts/pane-renderer.ts` - Main pane rendering
- `src/lib/plugins/user-price-alerts/price-scale-pane-renderer.ts` - Price axis rendering

**Architecture**:
```
UserPriceAlerts (extends UserAlertsState)
├── MouseHandlers - Detects clicks and hovers
├── PaneView - Renders alerts on main chart
├── PriceScalePaneView - Renders buttons on price axis
└── Delegate - Event subscription system
```

### Usage Example

```svelte
<script lang="ts">
  import { Chart, Series, SeriesPlugin } from '$lib';
  import { UserPriceAlerts } from '$lib/plugins/user-price-alerts/user-price-alerts';
  import type { UserAlertInfo } from '$lib/plugins/user-price-alerts/state';

  // Create plugin instance
  let alertsPlugin = $state(new UserPriceAlerts());
  alertsPlugin.setSymbolName('AAPL');

  // Subscribe to events
  $effect(() => {
    alertsPlugin.alertAdded().subscribe((alert: UserAlertInfo) => {
      console.log(`Alert added at ${alert.price}`);
    });

    alertsPlugin.alertRemoved().subscribe((id: string) => {
      console.log(`Alert removed: ${id}`);
    });
  });
</script>

<Chart>
  <Series type="Area" data={areaData}>
    <SeriesPlugin primitive={alertsPlugin} />
  </Series>
</Chart>
```

### Features

✅ **Interactive UI**: Click to add, hover to see remove button
✅ **Event System**: Subscribe to add/remove events via Delegate pattern
✅ **Visual Feedback**: Hover states and cursor changes
✅ **Price Scale Integration**: Renders on both main pane and price axis
✅ **Symbol Support**: Set symbol name for context

### API

**Methods**:
- `setSymbolName(name: string)` - Set the symbol name displayed
- `addAlert(price: number): string` - Programmatically add alert
- `removeAlert(id: string)` - Programmatically remove alert
- `alerts(): UserAlertInfo[]` - Get all current alerts

**Events** (via Delegate pattern):
- `alertAdded()` - Fired when alert is added
- `alertRemoved()` - Fired when alert is removed
- `alertChanged()` - Fired when alert is modified
- `alertsChanged()` - Fired when any alert changes

**Types**:
```typescript
interface UserAlertInfo {
  id: string;
  price: number;
}
```

## 2. Heatmap Series Plugin

### What It Does

The Heatmap Series is a **custom series type** that visualizes data intensity using color gradients. Each time point can have multiple cells at different price levels, with colors representing the intensity/amount.

### Implementation Details

**Type**: `ICustomSeriesPaneView<Time, TData, TOptions>` - Custom series implementation

**Key Files**:
- `src/lib/plugins/heatmap-series/heatmap-series.ts` - Custom series view
- `src/lib/plugins/heatmap-series/renderer.ts` - Canvas rendering logic
- `src/lib/plugins/heatmap-series/data.ts` - Data type definitions
- `src/lib/plugins/heatmap-series/options.ts` - Options interface

**Architecture**:
```
HeatMapSeries (implements ICustomSeriesPaneView)
├── HeatMapSeriesRenderer - Draws colored cells
├── HeatMapData - Data structure with cells
└── HeatMapSeriesOptions - Configuration (cellShader, etc.)
```

### Usage Example

```svelte
<script lang="ts">
  import { Chart, CustomSeries } from '$lib';
  import { HeatMapSeries } from '$lib/plugins/heatmap-series/heatmap-series';
  import type { HeatMapData } from '$lib/plugins/heatmap-series/data';

  // Create heatmap view
  let heatmapView = $state(new HeatMapSeries());

  // Color mapping function
  const cellShader = (amount: number) => {
    const maxAmount = 50;
    const normalized = Math.min(amount / maxAmount, 1);
    return `hsl(${normalized * 240}, 70%, 50%)`; // Blue to red gradient
  };

  // Prepare data
  let heatmapData: HeatMapData[] = [
    {
      time: 1672531200,
      cells: [
        { low: 90, high: 100, amount: 15 },
        { low: 100, high: 110, amount: 25 },
        { low: 110, high: 120, amount: 10 },
        // ... more cells
      ]
    },
    // ... more time points
  ];
</script>

<Chart>
  <CustomSeries
    view={heatmapView}
    reactiveData={heatmapData}
    options={{ cellShader }}
  />
</Chart>
```

### Features

✅ **Custom Series**: Full custom series implementation
✅ **Color Mapping**: Flexible color shader function
✅ **Multi-Level Data**: Each time point has multiple cells
✅ **Price Ranges**: Each cell spans a price range (low to high)
✅ **Intensity Values**: Amount property determines color intensity

### Data Structure

```typescript
interface HeatmapCell {
  low: number;    // Lower price boundary
  high: number;   // Upper price boundary
  amount: number; // Intensity/volume value
}

interface HeatMapData extends CustomData {
  time: Time;
  cells: HeatmapCell[];
}
```

### Options

```typescript
interface HeatMapSeriesOptions {
  // Function that maps amount to color
  cellShader: (amount: number) => string;

  // Optional: Border color for cells
  cellBorderColor?: string;

  // Optional: Border width
  cellBorderWidth?: number;
}
```

### Color Mapping Functions

The `cellShader` function is key to visualization. Here are some examples:

**Turbo Colormap** (used in example):
```typescript
function turboColor(t: number): string {
  t = Math.max(0, Math.min(1, t));
  const r = Math.round(34.61 + t * (1172.33 - t * (10793.56 - t * (33300.12 - t * (38394.49 - t * 14825.05)))));
  const g = Math.round(23.31 + t * (557.33 + t * (1225.33 - t * (3574.96 - t * (1073.77 + t * 707.56)))));
  const b = Math.round(27.2 + t * (3211.1 - t * (15327.97 - t * (27814 - t * (22569.18 - t * 6838.66)))));
  return `rgb(${Math.max(0, Math.min(255, r))}, ${Math.max(0, Math.min(255, g))}, ${Math.max(0, Math.min(255, b))})`;
}

const cellShader = (amount: number) => turboColor(amount / maxAmount);
```

**HSL Gradient**:
```typescript
const cellShader = (amount: number) => {
  const hue = (amount / maxAmount) * 120; // 0 (red) to 120 (green)
  return `hsl(${hue}, 70%, 50%)`;
};
```

**Blue to Red**:
```typescript
const cellShader = (amount: number) => {
  const normalized = amount / maxAmount;
  const r = Math.floor(normalized * 255);
  const b = Math.floor((1 - normalized) * 255);
  return `rgb(${r}, 0, ${b})`;
};
```

## Key Differences

### User Price Alerts vs Heatmap Series

| Aspect | User Price Alerts | Heatmap Series |
|--------|------------------|----------------|
| **Type** | Series Primitive | Custom Series |
| **Component** | Use with `<Series>` + `<SeriesPlugin>` | Use with `<CustomSeries>` |
| **Attachment** | Attaches to existing series | Is a series itself |
| **Interface** | `ISeriesPrimitive` | `ICustomSeriesPaneView` |
| **Data** | Managed internally | Provided via props |
| **Interaction** | Mouse handlers built-in | No built-in interaction |
| **Use Case** | Overlay/annotation | Data visualization |

## File Structure

```
lwc-s5/src/lib/
├── plugins/
│   ├── user-price-alerts/
│   │   ├── user-price-alerts.ts    # Main plugin
│   │   ├── state.ts                # State management
│   │   ├── mouse.ts                # Mouse handlers
│   │   ├── pane-renderer.ts        # Chart rendering
│   │   ├── pane-view.ts            # View implementation
│   │   ├── price-scale-pane-renderer.ts  # Price axis
│   │   ├── renderer-base.ts        # Base renderer
│   │   ├── irenderer-data.ts       # Type definitions
│   │   └── constants.ts            # Configuration
│   ├── heatmap-series/
│   │   ├── heatmap-series.ts       # Custom series view
│   │   ├── renderer.ts             # Canvas renderer
│   │   ├── data.ts                 # Data types
│   │   ├── options.ts              # Options interface
│   │   ├── sample-heatmap-data.ts  # Sample data
│   │   └── bell-curve-data.ts      # More samples
│   └── helpers/
│       └── delegate.ts             # Event system
└── chart/
    └── CustomSeries.svelte         # Custom series component
```

## Common Use Cases

### User Price Alerts

1. **Trading Applications**: Let users set price notifications
2. **Alert Management**: Track target prices
3. **Price Monitoring**: Visual price level markers
4. **Technical Analysis**: Mark key levels

### Heatmap Series

1. **Volume Profile**: Show volume at different price levels
2. **Order Book Depth**: Visualize bid/ask depth
3. **Density Analysis**: Show data concentration
4. **Time & Sales**: Display trade intensity
5. **Market Microstructure**: Analyze tick data

## Advanced Customization

### Custom Alert Rendering

You can modify the alert appearance by editing `pane-renderer.ts`:

```typescript
// In AlertRenderer.draw()
ctx.fillStyle = alert.color || '#FF6B6B'; // Custom color
ctx.strokeStyle = '#fff';
ctx.lineWidth = 2;
// ... custom drawing logic
```

### Custom Heatmap Cells

Extend the `HeatmapCell` interface for more data:

```typescript
interface ExtendedHeatmapCell extends HeatmapCell {
  volume: number;
  trades: number;
  // ... custom properties
}
```

Then customize rendering in `renderer.ts`:

```typescript
// Use cell.volume, cell.trades, etc. for color/size
```

## Performance Considerations

### User Price Alerts

- ✅ Efficient: Only redraws when alerts change
- ✅ Mouse events are throttled
- ⚠️ Many alerts (>100) may impact performance

### Heatmap Series

- ✅ Efficient: Uses canvas drawImage for cells
- ✅ Good for moderate cell counts (10-50 per bar)
- ⚠️ Large datasets (>100 cells per bar) may slow down

## Troubleshooting

### User Price Alerts Not Showing

1. Check that plugin is attached: `<SeriesPlugin primitive={plugin} />`
2. Verify series has data
3. Check console for mouse handler errors
4. Ensure `setSymbolName()` was called

### Heatmap Colors Not Appearing

1. Verify `cellShader` function returns valid CSS color
2. Check that `amount` values are not all zero
3. Ensure cells have proper `low` and `high` values
4. Check for cell overlap (should be continuous ranges)

### TypeScript Errors

Both plugins are written in TypeScript. Make sure:
- All imports use correct paths
- Types are properly defined
- `ISeriesPrimitive` vs `ICustomSeriesPaneView` distinction is clear

## Resources

- **Live Demo**: Visit `/plugin-examples` route
- **Source Code**: Check `src/lib/plugins/` directory
- **Original Examples**: `/plugin-examples/` in main repo
- **Lightweight Charts Docs**: https://tradingview.github.io/lightweight-charts/

## Summary

Both plugins demonstrate advanced features of Lightweight Charts:

- **User Price Alerts**: Shows how to create interactive overlays with mouse handling
- **Heatmap Series**: Shows how to implement custom series types with complex rendering

They serve as excellent starting points for building your own custom plugins and series types!
