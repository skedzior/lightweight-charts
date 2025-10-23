
# 🧩 Lightweight-Charts Panes — Developer-Oriented Summary & AI Reference

## 1. Core Concept
Lightweight Charts™ supports **multi-pane charts**, allowing several distinct plot areas (panes) in a single chart instance.
Each pane can contain one or more series (candles, volume histograms, lines, etc.) and can be resized, reordered, or removed dynamically.

---

## 2. Creating & Managing Panes
### Adding a Pane
```ts
const volumeSeries = chart.addSeries(HistogramSeries, { priceFormat: { type: 'volume' } }, 1);
```
- Third argument `paneIndex` assigns the series to an existing or new pane.
- If nonexistent, a pane is created automatically.
- If no series remain, the pane is auto-removed.

### Programmatic Pane Creation
```ts
const pane = chart.addPane();
```
Returns an `IPaneApi` instance.

---

## 3. Pane Customization
```ts
chart.applyOptions({
  layout: {
    panes: {
      separatorColor: '#ff0000',
      separatorHoverColor: '#00ff00',
      enableResize: false,
    },
  },
});
```

| Option | Type | Description | Default |
|:--|:--|:--|:--|
| `enableResize` | `boolean` | Allows user resizing | `true` |
| `separatorColor` | `string` | Color of pane separator | `#2B2B43` |
| `separatorHoverColor` | `string` | Hover color | `rgba(178,181,189,0.2)` |

---

## 4. Pane API (`IPaneApi`)
| Method | Purpose |
|:--|:--|
| `getHeight()` / `setHeight(px)` | Get/set height (≥30 px) |
| `moveTo(index)` | Move pane |
| `paneIndex()` | Get index |
| `getSeries()` | Return all series |
| `addSeries()` / `addCustomSeries()` | Add standard/custom series |
| `priceScale(id)` | Access pane price scale |
| `setStretchFactor(f)` | Relative size across panes |
| `setPreserveEmptyPane(flag)` | Keep empty pane |
| `attachPrimitive()` / `detachPrimitive()` | Add/remove custom drawings |

---

## 5. Chart-Level Pane Management (`IChartApiBase`)
| Method | Description |
|:--|:--|
| `addPane(preserveEmptyPane?)` | Create pane |
| `panes()` | List all panes |
| `removePane(index)` | Remove pane |
| `swapPanes(a,b)` | Swap order |
| `paneSize(index?)` | Pane dimensions |

---

## 6. Series Handling
```ts
chart.addSeries(CandlestickSeries, options, paneIndex);
chart.addCustomSeries(customPaneView, customOptions, paneIndex);
chart.removeSeries(seriesApi);
```

---

## 7. Events & Interactivity
| Event | Subscribe | Purpose |
|:--|:--|:--|
| Click | `subscribeClick` | Single click |
| Double Click | `subscribeDblClick` | Double click |
| Crosshair Move | `subscribeCrosshairMove` | Hover tracking |

---

## 8. Crosshair & Synchronization
```ts
chart.setCrosshairPosition(price, time, seriesApi);
chart.clearCrosshairPosition();
```

---

## 9. Price & Time Scale APIs
| API | Accessor | Description |
|:--|:--|:--|
| `IPriceScaleApi` | `chart.priceScale(id, paneIndex?)` | Price scale manipulation |
| `ITimeScaleApi` | `chart.timeScale()` | Time axis control |

---

## 10. Pane Primitives
| Interface | Purpose |
|:--|:--|
| `IPanePrimitiveBase` | Base for external graphics |
| `IPanePrimitivePaneView` | Defines rendering per pane |
| `IPanePrimitiveWrapper` | Utility for detachment and updates |

```ts
pane.attachPrimitive(myPrimitive);
```

---

## 11. Layout & Rendering Options
`layout.panes` defines user resizing and separator visuals.

Example stretch factors:
```ts
pane1.setStretchFactor(0.2);
pane2.setStretchFactor(0.3);
pane3.setStretchFactor(0.5);
```

---

## 12. Utility / Miscellaneous
| Method | Function |
|:--|:--|
| `resize(width, height, force?)` | Manual resize |
| `autoSizeActive()` | Query auto-resize |
| `chartElement()` | Access root div |
| `takeScreenshot()` | Capture chart image |
| `remove()` | Destroy chart |

---

## 13. Example
```ts
const chart = createChart(container, {
  layout: {
    textColor: 'black',
    background: { type: 'solid', color: 'white' },
    panes: {
      separatorColor: '#f22c3d',
      separatorHoverColor: 'rgba(255, 0, 0, 0.1)',
      enableResize: false,
    },
  },
});
const area = chart.addSeries(AreaSeries, { lineColor: '#2962FF' });
const candles = chart.addSeries(CandlestickSeries, { upColor: '#26a69a' }, 1);
const secondPane = chart.panes()[1];
secondPane.setHeight(150);
secondPane.moveTo(0);
chart.timeScale().fitContent();
```

---

## 14. Key Implementation Insights
| Area | Note |
|:--|:--|
| Pane Indexing | 0-based, auto-managed |
| Minimum Height | 30px enforced |
| Stretch Factor | Relative proportions |
| Lifecycle | Removed panes invalidate APIs |
| Custom Series | Extend with `ICustomSeriesPaneView` |
| DOM Access | `chartElement()` or `pane.getHTMLElement()` |
| Synchronization | Crosshair & time-scale alignment |

---

## 15. Reference Outline
1. Overview & Concepts  
2. Creating / Managing Panes  
3. Chart-Level Pane APIs  
4. Pane Customization  
5. Pane API  
6. Series Management  
7. Events  
8. Crosshair Control  
9. Price & Time Scales  
10. Primitives  
11. Layout Options  
12. Example  
13. Implementation Heuristics

---

## 16. JSON Reference Schema (for AI Models)
```json
{
  "chartApi": {
    "methods": ["addSeries", "addCustomSeries", "addPane", "removePane", "swapPanes", "panes", "resize", "applyOptions", "options", "priceScale", "timeScale", "takeScreenshot", "subscribeClick", "subscribeDblClick", "subscribeCrosshairMove"],
    "events": ["click", "dblclick", "crosshairMove"],
    "notes": "Central API for creating and managing chart panes and series."
  },
  "paneApi": {
    "methods": ["getHeight", "setHeight", "moveTo", "paneIndex", "getSeries", "addSeries", "addCustomSeries", "setStretchFactor", "setPreserveEmptyPane", "attachPrimitive", "detachPrimitive"],
    "properties": ["height", "stretchFactor", "series"],
    "notes": "Used for pane-level management, layout, and rendering."
  },
  "seriesApi": {
    "methods": ["setData", "applyOptions", "moveToPane", "priceScale", "remove"],
    "notes": "Handles series creation, customization, and movement between panes."
  },
  "layoutPanesOptions": {
    "separatorColor": "string",
    "separatorHoverColor": "string",
    "enableResize": "boolean"
  }
}
```
