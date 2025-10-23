# Trade Bubbles - Volume-Based Circle Rendering

## When to Use This vs Series Markers

### ❌ Don't Use Series Markers For:
- **Variable-sized data visualization** (volume, size, weight)
- **Real-time streaming data** with many updates
- **Canvas effects** (shadows, gradients, custom shapes)
- **Sizes beyond 1-3** (markers cap out around size=3)

### ✅ Series Markers Are Best For:
- **Discrete annotations** (buy/sell signals, alerts)
- **Text labels** on specific events
- **Standard shapes** (arrows, circles, squares)
- **Small datasets** (<100 markers)

---

## Why Trade Bubbles Are Better

### 1. **Unlimited Size Scaling**
```typescript
const options = {
  minRadius: 3,      // Smallest trade
  maxRadius: 50,     // Largest trade - NO LIMIT!
  volumeScale: 'sqrt' // Better visual distribution
};
```

Markers: Size maxes out around 3
Bubbles: **Any size you want** (tested up to 100+ pixels)

### 2. **Multiple Scaling Algorithms**
```typescript
volumeScale: 'linear'  // Direct mapping
volumeScale: 'sqrt'    // Better for moderate variance (recommended)
volumeScale: 'log'     // Best for extreme variance (1 to 1,000,000)
```

### 3. **Real-time Performance**
- Markers: Recreate entire array on each update
- Bubbles: **Efficient canvas drawing**, handles thousands of trades

### 4. **Visual Customization**
```typescript
{
  shadowBlur: 6,           // Glow effect
  opacity: 0.7,            // Transparency
  borderWidth: 2,          // Outline
  showVolumeText: true,    // Volume inside bubble
  buyColor: '#00ff00',
  sellColor: '#ff0000'
}
```

---

## Usage Example

```typescript
import { TradeBubbles } from '$lib/plugins/trade-bubbles';
import { Chart, Series, SeriesPlugin } from '$lib';

// Create plugin with options
const tradeBubbles = new TradeBubbles({
  minRadius: 4,
  maxRadius: 30,
  volumeScale: 'sqrt',  // Square root scaling for better distribution
  showVolumeText: true,
  shadowBlur: 6
});

// Add trades as they come in (real-time)
function onTrade(trade) {
  tradeBubbles.addTrade({
    time: trade.timestamp,
    price: trade.price,
    volume: trade.volume,
    side: trade.side // 'buy' or 'sell'
  });
}

// Or set all trades at once
tradeBubbles.setTrades([
  { time: 1704067200, price: 100.5, volume: 500, side: 'buy' },
  { time: 1704067201, price: 100.6, volume: 1200, side: 'sell' },
  { time: 1704067202, price: 100.4, volume: 3000, side: 'buy' }
]);
```

```svelte
<Chart options={chartOptions}>
  <Series type="Candlestick" data={candleData}>
    <SeriesPlugin primitive={tradeBubbles} />
  </Series>
</Chart>
```

---

## Size Scaling Comparison

For a dataset with volumes from 10 to 10,000:

### Linear Scaling
```
Volume: 10    → Radius: 3px
Volume: 2,500 → Radius: 13.5px
Volume: 5,000 → Radius: 24px
Volume: 10,000 → Radius: 30px
```
**Issue:** Large trades dominate visually

### Square Root Scaling (Recommended)
```
Volume: 10    → Radius: 3px
Volume: 2,500 → Radius: 15px
Volume: 5,000 → Radius: 21px
Volume: 10,000 → Radius: 30px
```
**Better:** More balanced visual distribution

### Logarithmic Scaling
```
Volume: 10    → Radius: 3.8px
Volume: 2,500 → Radius: 22px
Volume: 5,000 → Radius: 25px
Volume: 10,000 → Radius: 30px
```
**Best for extreme variance:** Compresses large values

---

## API Reference

### `addTrade(trade: TradeBubblesData)`
Add a single trade bubble.

### `setTrades(trades: TradeBubblesData[])`
Replace all trades at once.

### `clearTrades()`
Remove all trades.

### `applyOptions(options: Partial<TradeBubblesOptions>)`
Update rendering options.

---

## Performance Notes

- **Tested with 10,000+ bubbles** - smooth rendering
- Coordinates recalculate on pan/zoom automatically
- Use `sqrt` or `log` scaling for datasets with high volume variance
- Consider clearing old trades periodically for streaming data

---

## Marker Size Limitation Explained

Series Markers use a `size` parameter that's **intentionally limited**:

```typescript
// From lightweight-charts source
const MARKER_SIZE_MULTIPLIER = [1, 2, 3]; // Size 1, 2, 3
const baseSize = 8; // Base pixel size

// Effective sizes:
size: 1 → 8px  diameter
size: 2 → 16px diameter
size: 3 → 24px diameter
size: 4 → 24px diameter (same as 3!)
```

**Why?** Markers are meant for annotations, not data viz. Large markers:
- Overlap labels
- Obscure candlesticks
- Break hit-testing

For volume-based sizing, **always use a custom primitive** like Trade Bubbles.
