# Plugin Examples Integration

Three additional plugin examples from the plugin-examples repository have been successfully integrated into the Svelte 5 wrapper.

## New Plugin Examples Added

### 1. Heatmap Series with Bell Curve Distribution
**Location**: `/plugin-examples/heatmap-bell-curve`

**Description**: 
Displays probability distributions using Gaussian bell curves overlaid on price data. Shows where prices are most likely to be found with color-coded intensity.

**Features**:
- Bell curve generation using Box-Muller transform
- Configurable spread and bin size
- Color gradient based on probability density
- Interactive parameter controls

**Files Created**:
- Route: `src/routes/plugin-examples/heatmap-bell-curve/+page.svelte`

**Note**: The heatmap series plugin and bell-curve-data helper already existed in the library.

---

### 2. Expiring Price Alerts
**Location**: `/plugin-examples/expiring-alerts`

**Description**:
Time-bounded price alerts that visualize buy/sell signals with automatic crossing detection and expiration handling.

**Features**:
- Time-bounded alerts (start and end dates)
- Upward/downward crossing detection
- Visual state indicators (active, crossed, expired)
- Automatic cleanup of expired alerts
- Interactive alert creation form

**Files Created**:
- Plugin: `src/lib/plugins/expiring-price-alerts/`
  - `expiring-price-alerts.ts` - Main plugin class
  - `primitive.ts` - Rendering primitive
  - `renderer.ts` - Canvas renderer
  - `options.ts` - Configuration options
  - `iexpiring-price-alerts.ts` - TypeScript interfaces
  - `icons.ts` - SVG path icons
- Route: `src/routes/plugin-examples/expiring-alerts/+page.svelte`

**Usage Pattern**:
```svelte
<script>
  let alertsPlugin: ExpiringPriceAlerts | undefined;
  
  $effect(() => {
    if (lineSeries && !alertsPlugin) {
      alertsPlugin = new ExpiringPriceAlerts(lineSeries, {
        interval: 86400,
        clearTimeout: 3000
      });
      
      alertsPlugin.addExpiringAlert(price, startTime, endTime, {
        title: 'Buy Signal',
        crossingDirection: 'up'
      });
      
      return () => alertsPlugin?.destroy();
    }
  });
</script>
```

---

### 3. Volume Profile
**Location**: `/plugin-examples/volume-profile`

**Description**:
Displays volume distribution across price levels, helping identify key support/resistance zones and areas of high trading activity.

**Features**:
- Horizontal volume bars at each price level
- Configurable position and width
- Point of Control (POC) identification
- Auto-scaling to fit visible range
- Interactive parameter controls

**Files Created**:
- Plugin: `src/lib/plugins/volume-profile/volume-profile.ts`
- Route: `src/routes/plugin-examples/volume-profile/+page.svelte`

**Usage Pattern**:
```svelte
<script>
  const vpData = {
    time: data[index].time,
    profile: [
      { price: 100, vol: 15 },
      { price: 101, vol: 20 },
      // ...
    ],
    width: 10 // number of bars
  };
  
  const volumeProfile = $derived(() => {
    if (!chart || !series) return undefined;
    return new VolumeProfile(chart, series, vpData);
  });
</script>

<Series type="Line" data={lineData}>
  {#if volumeProfile}
    <SeriesPlugin primitive={volumeProfile} />
  {/if}
</Series>
```

---

## Navigation Updates

The main plugin examples page (`/plugin-examples`) now includes navigation cards linking to all three new examples:

```svelte
<div class="nav-grid">
  <a href="/plugin-examples/heatmap-bell-curve" class="nav-card">
    <span class="icon">📊</span>
    <h3>Heatmap Bell Curve</h3>
    <p>Probability distributions with bell curves</p>
  </a>
  <a href="/plugin-examples/expiring-alerts" class="nav-card">
    <span class="icon">🔔</span>
    <h3>Expiring Price Alerts</h3>
    <p>Time-bounded price level notifications</p>
  </a>
  <a href="/plugin-examples/volume-profile" class="nav-card">
    <span class="icon">📊</span>
    <h3>Volume Profile</h3>
    <p>Volume distribution across price levels</p>
  </a>
</div>
```

---

## File Structure

```
lwc-s5/
├── src/
│   ├── lib/
│   │   └── plugins/
│   │       ├── expiring-price-alerts/     # NEW
│   │       │   ├── expiring-price-alerts.ts
│   │       │   ├── primitive.ts
│   │       │   ├── renderer.ts
│   │       │   ├── options.ts
│   │       │   ├── iexpiring-price-alerts.ts
│   │       │   └── icons.ts
│   │       ├── volume-profile/            # NEW
│   │       │   └── volume-profile.ts
│   │       └── heatmap-series/            # EXISTING
│   │           ├── bell-curve-data.ts     # Already existed
│   │           └── ...
│   └── routes/
│       └── plugin-examples/
│           ├── +page.svelte               # UPDATED with nav
│           ├── heatmap-bell-curve/        # NEW
│           │   └── +page.svelte
│           ├── expiring-alerts/           # NEW
│           │   └── +page.svelte
│           └── volume-profile/            # NEW
│               └── +page.svelte
```

---

## Key Implementation Details

### Svelte 5 Patterns Used

1. **Reactive State Management**
   - `$state()` for reactive variables
   - `$derived()` for computed values
   - `$effect()` for side effects and lifecycle

2. **Plugin Lifecycle**
   - Plugins initialized in `$effect()` with cleanup
   - Automatic destruction on component unmount
   - Reactive updates when dependencies change

3. **Type Safety**
   - Full TypeScript support
   - Proper generic types for series
   - Type-safe plugin interfaces

### Canvas Rendering

All plugins use the lightweight-charts rendering pipeline:
- `IPrimitivePaneRenderer` for drawing
- `IPrimitivePaneView` for view logic
- `useBitmapCoordinateSpace()` for pixel-perfect rendering

### Data Synchronization

- Expiring Alerts: Subscribes to `dataChanged` events
- Volume Profile: Uses `autoscaleInfo()` for range detection
- Heatmap: Reactive data updates via Svelte props

---

## Testing the Examples

1. **Start the dev server**:
   ```bash
   cd lwc-s5
   pnpm run dev
   ```

2. **Navigate to**:
   - Main examples: http://localhost:5173/plugin-examples
   - Heatmap Bell Curve: http://localhost:5173/plugin-examples/heatmap-bell-curve
   - Expiring Alerts: http://localhost:5173/plugin-examples/expiring-alerts
   - Volume Profile: http://localhost:5173/plugin-examples/volume-profile

---

## Comparison: Original vs Svelte 5

### Original (plugin-examples)
```typescript
// Imperative vanilla JS
const chart = createChart('chart', { autoSize: true });
const series = chart.addSeries(LineSeries);
const alertsPlugin = new ExpiringPriceAlerts(series, options);
alertsPlugin.addExpiringAlert(price, start, end, params);
```

### Svelte 5 Version
```svelte
<!-- Declarative component-based -->
<Chart options={chartOptions}>
  <Series type="Line" data={lineData} onCreate={(s) => lineSeries = s} />
</Chart>

<!-- Lifecycle managed automatically -->
{#if lineSeries && !alertsPlugin}
  $effect(() => {
    alertsPlugin = new ExpiringPriceAlerts(lineSeries, options);
    return () => alertsPlugin?.destroy();
  });
{/if}
```

---

## Notes

- **IDE Lint Errors**: The IDE may show TypeScript errors for Svelte template syntax. These are false positives and won't affect runtime.
- **Reactivity**: All examples use Svelte 5's new runes (`$state`, `$derived`, `$effect`) for optimal reactivity.
- **Compatibility**: Plugins maintain full compatibility with the original lightweight-charts API.

---

## Future Enhancements

Potential additional plugin examples to integrate:
- Trend Lines
- Delta Volume
- User Price Lines (already exists)
- Custom drawing tools
- Additional indicator overlays
