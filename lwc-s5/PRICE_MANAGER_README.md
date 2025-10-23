# Combined Price Manager Plugin

A unified plugin that combines the functionality of **user-price-alerts** and **user-price-lines** into a single, powerful interface.

## Overview

The **UserPriceManager** plugin provides a dual-button interface that allows users to add both:
1. **Price Alerts** (with notifications and event system)
2. **Regular Price Lines** (simple visual markers)

Both options are presented side-by-side when hovering near the price scale, with distinct colors for easy identification.

## Features

### 🔔 Price Alerts (Red Button - Left)
- Visual alert indicators with labels
- Event notifications (alertAdded, alertRemoved)
- Removable with hover X button
- Shows symbol name and price
- Customizable color

### 📏 Price Lines (Blue Button - Right)
- Simple dashed lines
- Lightweight (no event overhead)
- Quick visual markers
- Customizable color
- Native lightweight-charts price lines

### 🎯 Unified Interface
- Two buttons displayed side-by-side
- Color-coded for easy distinction
- Hover near price scale to reveal
- Intuitive click interaction

## Installation

The plugin files are located in `src/lib/plugins/user-price-manager/`.

## Usage

### Basic Setup

```typescript
import { Chart, Series, SeriesPlugin } from '$lib';
import { UserPriceManager } from '$lib/plugins/user-price-manager/user-price-manager';

// Create the manager
const priceManager = new UserPriceManager({
  alertColor: '#FF6B6B',  // Red for alerts
  lineColor: '#4A90E2',   // Blue for lines
  symbolName: 'AAPL'
});

// Subscribe to alert events (optional)
priceManager.alertAdded().subscribe((alert) => {
  console.log(`Alert added at ${alert.price}`);
});

priceManager.alertRemoved().subscribe((id) => {
  console.log(`Alert removed: ${id}`);
});
```

### Svelte 5 Example

```svelte
<script lang="ts">
  import { Chart, Series, SeriesPlugin } from '$lib';
  import { UserPriceManager } from '$lib/plugins/user-price-manager/user-price-manager';

  let priceManager = $state(new UserPriceManager({
    alertColor: '#FF6B6B',
    lineColor: '#4A90E2',
    symbolName: 'AAPL'
  }));

  let eventLog = $state<string[]>([]);

  // Subscribe to events
  $effect(() => {
    priceManager.alertAdded().subscribe((alert) => {
      eventLog = [`Alert added at ${alert.price}`, ...eventLog];
    });

    priceManager.alertRemoved().subscribe((id) => {
      eventLog = [`Alert removed: ${id}`, ...eventLog];
    });
  });
</script>

<Chart>
  <Series type="Area" data={chartData}>
    <SeriesPlugin primitive={priceManager} />
  </Series>
</Chart>
```

## API Reference

### Constructor Options

```typescript
interface UserPriceManagerOptions {
  alertColor?: string;    // Default: '#FF6B6B'
  lineColor?: string;     // Default: '#4A90E2'
  symbolName?: string;    // Default: ''
}
```

### Methods

#### `setSymbolName(name: string): void`
Set the symbol name displayed on alert labels.

```typescript
priceManager.setSymbolName('TSLA');
```

#### `addAlert(price: number): string`
Programmatically add a price alert. Returns the alert ID.

```typescript
const alertId = priceManager.addAlert(150.00);
```

#### `removeAlert(id: string): void`
Programmatically remove a price alert.

```typescript
priceManager.removeAlert(alertId);
```

#### `alerts(): UserAlertInfo[]`
Get all current alerts.

```typescript
const allAlerts = priceManager.alerts();
```

### Events

The manager extends `UserAlertsState`, providing the same event system:

#### `alertAdded(): Delegate<UserAlertInfo>`
Fired when an alert is added.

```typescript
priceManager.alertAdded().subscribe((alert) => {
  console.log(`New alert: ${alert.id} at ${alert.price}`);
});
```

#### `alertRemoved(): Delegate<string>`
Fired when an alert is removed.

```typescript
priceManager.alertRemoved().subscribe((id) => {
  console.log(`Alert removed: ${id}`);
});
```

#### `alertChanged(): Delegate<UserAlertInfo>`
Fired when an alert is modified.

#### `alertsChanged(): Delegate`
Fired when any alert changes.

## User Interaction

### Adding Price Alerts
1. Hover your cursor near the right edge of the chart (price scale area)
2. Two buttons will appear side-by-side
3. Click the **red button (left)** to add a price alert at that level
4. The alert will appear with the symbol name and price

### Adding Price Lines
1. Hover your cursor near the price scale
2. Click the **blue button (right)** to add a simple price line
3. A dashed line will appear at that price level

### Removing Alerts
1. Hover over an existing alert label
2. An X button will appear on the right side
3. Click the X to remove the alert

## Comparison: Alerts vs Lines

| Feature | Price Alert (Red) | Price Line (Blue) |
|---------|------------------|-------------------|
| Visual Indicator | Dashed line + Label | Dashed line only |
| Event Notifications | ✅ Yes | ❌ No |
| Removable via UI | ✅ Click X button | ❌ No |
| Shows Price/Symbol | ✅ Yes | ❌ No |
| Performance | More overhead | Lightweight |
| Use Case | Important levels needing alerts | Quick visual markers |

## When to Use

### Use Price Alerts When:
- You need notifications when price reaches a level
- You want to track specific price targets
- You need programmatic access to alerts
- You want labeled indicators with symbol/price info

### Use Price Lines When:
- You just need a quick visual reference
- You don't need event notifications
- You want minimal performance impact
- You're adding many temporary markers

## Architecture

The plugin combines three main components:

1. **UserAlertsState** - Base class for alert management
2. **MouseHandlers** - Detects mouse events and positions
3. **PriceManagerRenderer** - Renders both buttons and alerts

### Rendering Flow

```
UserPriceManager
├── MouseHandlers (detects hover/click)
├── PriceManagerPaneView
└── PriceManagerRenderer
    ├── Draw alert button (red, left)
    ├── Draw line button (blue, right)
    └── Draw existing alerts
```

## Customization

### Custom Colors

```typescript
const priceManager = new UserPriceManager({
  alertColor: '#E74C3C',  // Custom red
  lineColor: '#3498DB',   // Custom blue
  symbolName: 'BTC/USD'
});
```

### Styling

The plugin uses these default dimensions:
- Button height: 21px
- Button width: 22px
- Button spacing: 4px

You can modify these in the plugin source if needed.

## Performance Considerations

- **Alerts**: Have more overhead due to event system and rendering complexity
- **Price Lines**: Use native lightweight-charts price lines, very efficient
- **Recommendation**: Use alerts sparingly for important levels, use lines for temporary markers

## Dependencies

- `lightweight-charts` - Main charting library
- `fancy-canvas` - Canvas rendering utilities
- `user-price-alerts/*` - Alert system components
- `helpers/*` - Utility functions

## File Structure

```
user-price-manager/
└── user-price-manager.ts    # Main plugin file (500+ lines)
```

The plugin imports from:
- `../user-price-alerts/state.ts` - Alert state management
- `../user-price-alerts/constants.ts` - Layout constants
- `../user-price-alerts/mouse.ts` - Mouse handling
- `../user-price-alerts/irenderer-data.ts` - Type definitions

## Troubleshooting

### Buttons Not Appearing
- Ensure you're hovering close to the right edge (price scale area)
- Check that the plugin is properly attached to a series
- Verify chart has data and is rendered

### Events Not Firing
- Make sure you subscribe to events AFTER creating the plugin
- Check that events are subscribed in an `$effect` in Svelte 5
- Verify the plugin is attached before subscribing

### Wrong Colors
- Check `alertColor` and `lineColor` in constructor options
- Ensure colors are valid CSS color strings

## Examples

See the live demo at `/price-manager` route for a complete working example.

## Advanced Usage

### Programmatic Management

```typescript
// Add alerts programmatically
const alert1 = priceManager.addAlert(150.00);
const alert2 = priceManager.addAlert(155.00);

// Get all alerts
const allAlerts = priceManager.alerts();
console.log(`Total alerts: ${allAlerts.length}`);

// Remove specific alert
priceManager.removeAlert(alert1);
```

### Event-Driven Logic

```typescript
priceManager.alertAdded().subscribe((alert) => {
  // Trigger notification
  showNotification(`Alert set at ${alert.price}`);

  // Log to analytics
  logAnalytics('alert_added', { price: alert.price });

  // Update database
  saveAlertToDatabase(alert);
});
```

## Migration from Separate Plugins

If you're currently using `UserPriceAlerts` and `UserPriceLines` separately:

### Before (Two Separate Plugins)
```typescript
const alerts = new UserPriceAlerts();
const lines = new UserPriceLines(chart, series, { color: 'blue' });

alerts.setSymbolName('AAPL');
series.attachPrimitive(alerts);
```

### After (Combined Plugin)
```typescript
const priceManager = new UserPriceManager({
  alertColor: '#FF6B6B',
  lineColor: '#4A90E2',
  symbolName: 'AAPL'
});

series.attachPrimitive(priceManager);
```

## License

Same as lightweight-charts (Apache 2.0)

## Credits

Built by combining:
- `user-price-alerts` - Original alert system
- `user-price-lines` - Original price line system
- Enhanced with dual-button interface and unified management
