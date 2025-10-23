# Lightweight Charts - Architecture Documentation

## Overview

Lightweight Charts is a high-performance financial charting library designed for minimal bundle size and maximum performance. The codebase (~27,900 lines of TypeScript) is organized into distinct architectural layers that cleanly separate concerns: data management, business logic, view rendering, and user-facing API.

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    PUBLIC API LAYER (api/)                       │
│  ChartApi, SeriesApi, PriceScaleApi, TimeScaleApi, PaneApi      │
│  - Exposes user-facing chart functionality                       │
│  - Manages series, panes, and scale configurations              │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                    GUI LAYER (gui/)                              │
│  ChartWidget, PaneWidget, TimeAxisWidget, PriceAxisWidget       │
│  - DOM management and canvas rendering orchestration            │
│  - Mouse/touch event handling                                    │
│  - Layout and resizing logic                                     │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                   VIEW LAYER (views/)                            │
│  Pane Views, Axis Views, Series Pane Views                      │
│  - Converts model data to renderable format                      │
│  - Manages view invalidation and update strategies               │
│  - Coordinates between model state and rendering                 │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│              RENDERER LAYER (renderers/)                         │
│  PaneRenderer, AxisRenderers, Series Renderers                  │
│  - Low-level canvas drawing operations                           │
│  - Implements specific drawing strategies per series type        │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│              CORE MODEL LAYER (model/)                           │
│  ChartModel, Series, Pane, TimeScale, PriceScale, DataLayer     │
│  - Business logic and state management                           │
│  - Data validation and transformation                            │
│  - Scale calculations and coordinate conversions                 │
└─────────────────────────────────────────────────────────────────┘
```

## Architectural Layers in Detail

### 1. Core Model Layer (`src/model/`)

The foundation of the architecture. Contains all business logic, state management, and data coordination.

**Key Components:**

- **ChartModel** (`chart-model.ts`): Central orchestrator managing:
  - Panes (chart areas)
  - Time scale and price scales
  - Series collection
  - Invalidation and update mechanisms
  - Crosshair state and interaction logic

- **Data Layer** (`data-layer.ts`, `data-consumer.ts`):
  - Handles ingestion of raw data from users
  - Validates and transforms data into internal format
  - Manages time scale points and series plot rows
  - Coordinates updates across all affected series and scales

- **Series** (`series.ts`):
  - Represents a single data series (Line, Candlestick, Bar, etc.)
  - Stores plot data in optimized format
  - Manages price lines and custom price lines
  - Implements primitive wrappers for plugin integration
  - Manages series-level pane views

- **Scales**:
  - **TimeScale** (`time-scale.ts`): Maps logical time indices to pixel coordinates
  - **PriceScale** (`price-scale.ts`): Manages price range, autoscale, and price-to-coordinate conversion
  - Support for multiple price scales (left, right, overlay)

- **Pane** (`pane.ts`):
  - Represents a visual area in the chart (main chart or additional panes)
  - Manages data sources (series and primitives) associated with it
  - Handles price scale visibility and positioning
  - Coordinates rendering of all content within the pane

- **Invalidation System** (`invalidate-mask.ts`):
  - Tracks which parts of the chart need updates
  - Supports granular invalidation levels: None, Cursor, Light, Full
  - Enables performance optimization by avoiding unnecessary redraws

**Data Models:**
- **SeriesPlotRow**: Single row of series data with time and value(s)
- **TimePointIndex**: Logical index in the time scale
- **SeriesPlotList**: Ordered collection of plot rows for a series

### 2. View Layer (`src/views/`)

Bridges the model and renderer layers. Views are responsible for converting model state into renderable data.

**Architecture:**

```
Model State → View Update → Renderer Data Preparation → Rendering
```

**View Hierarchy:**

```
IPaneView (interface)
├── IUpdatablePaneView (interface)
│   ├── SeriesPaneViewBase (abstract)
│   │   ├── SeriesLinePaneView
│   │   ├── SeriesAreaPaneView
│   │   ├── SeriesCandlesticksPaneView
│   │   ├── SeriesBarsPaneView
│   │   ├── SeriesHistogramPaneView
│   │   ├── SeriesBaselinePaneView
│   │   └── SeriesCustomPaneView
│   ├── GridPaneView
│   ├── CrosshairPaneView
│   └── SeriesLastPriceAnimationPaneView
├── SeriesHorizontalLinePaneView (base for price lines)
│   ├── SeriesPriceLinePaneView
│   ├── SeriesHorizontalBaseLinePaneView
│   └── CustomPriceLinePaneView
├── CrosshairMarksPaneView
└── PanePriceAxisView

IAxisView
├── IPriceAxisView
│   ├── SeriesPriceAxisView
│   └── CustomPriceLinePriceAxisView
└── ITimeAxisView
    └── CrosshairTimeAxisView
```

**Key Patterns:**

- **Lazy Rendering**: Views only prepare renderer data when `renderer()` is called
- **Invalidation Tracking**: Views track data/options changes to minimize re-computation
- **Visible Range Filtering**: Views filter series data to only visible items for performance
- **Coordinate Conversion**: Views convert price/time values to canvas pixel coordinates

### 3. Renderer Layer (`src/renderers/`)

Implements specific drawing strategies for different series types and chart elements.

**Key Renderers:**

- **Series Renderers**:
  - `PaneRendererLine`: Renders line series with strokes
  - `PaneRendererArea`: Renders area series with fill
  - `PaneRendererBars`: Renders bar series
  - `PaneRendererCandlesticks`: Renders candlestick series
  - `PaneRendererHistogram`: Renders histogram/columns

- **Axis Renderers**:
  - `PriceAxisViewRenderer`: Renders price axis labels and grid
  - `TimeAxisViewRenderer`: Renders time axis labels and tick marks

- **Infrastructure Renderers**:
  - `GridRenderer`: Background grid
  - `CrosshairRenderer`: Crosshair lines
  - `HorizontalLineRenderer`: Price lines

**Renderer Interface Pattern:**

```typescript
interface IPaneRenderer {
  draw(target: CanvasRenderingTarget2D, isHovered: boolean, hitTestData?: unknown): void;
  drawBackground?(target: CanvasRenderingTarget2D, isHovered: boolean, hitTestData?: unknown): void;
}
```

### 4. GUI Layer (`src/gui/`)

Manages DOM elements, canvas rendering coordination, and user input handling.

**Key Components:**

- **ChartWidget**: Main chart container orchestrator
  - Creates and manages PaneWidgets
  - Handles resize and layout
  - Coordinates invalidation callbacks
  - Implements RAF-based rendering loop

- **PaneWidget**: Individual pane (chart area) management
  - Creates canvas elements (main and top layers)
  - Manages associated price axis widgets
  - Handles mouse/touch events for that pane
  - Renders all views for the pane

- **TimeAxisWidget**: Horizontal time axis rendering
- **PriceAxisWidget**: Vertical price axis rendering

**Rendering Pipeline:**

```
1. Invalidation triggered in model
   ↓
2. _invalidateHandler() called
   ↓
3. _drawPlanned flag set, RAF scheduled
   ↓
4. RAF callback → _drawImpl()
   ↓
5. For each pane widget:
   - Draw background (bottom z-order)
   - Draw main content (normal z-order)
   - Draw foreground (top z-order)
```

### 5. Public API Layer (`src/api/`)

User-facing interfaces that hide implementation details.

**Key Classes:**

- **ChartApi**: Main entry point
  - Creates/removes series and panes
  - Manages time scale and crosshair
  - Handles subscriptions to chart events
  - Delegates to internal ChartModel

- **SeriesApi**: Series interface
  - `setData()`: Updates series data
  - `update()`: Incremental updates
  - Price/coordinate conversion
  - Custom price lines management

- **TimeScaleApi**: Time axis control
  - Fit/reset functions
  - Visible range management
  - Bar spacing and offset control

- **PriceScaleApi**: Price axis control
  - Autoscale and baseline settings
  - Visible range management

**Design Pattern**: Adapter pattern - API classes wrap internal model objects and expose only safe/stable interfaces

## Plugin System Architecture

The plugin system extends chart functionality through two main extension points:

### 1. Pane Primitives (`IPanePrimitiveBase`)

Draw arbitrary content on the main chart area or axes.

```typescript
interface IPanePrimitiveBase {
  updateAllViews?(): void;           // Viewport changed
  paneViews?(): IPanePrimitivePaneView[];      // Main pane rendering
  attached?(param: PaneAttachedParameter): void; // Lifecycle
  detached?(): void;                 // Lifecycle
  hitTest?(x: number, y: number): PrimitiveHoveredItem | null;
}
```

**Built-in Pane Primitives:**
- TextWatermark (`text-watermark/`)
- ImageWatermark (`image-watermark/`)

### 2. Series Primitives (`ISeriesPrimitiveBase`)

Attach custom rendering to individual series.

```typescript
interface ISeriesPrimitiveBase {
  updateAllViews?(): void;
  paneViews?(): IPrimitivePaneView[];          // Main chart area
  priceAxisViews?(): ISeriesPrimitiveAxisView[]; // Price axis labels
  timeAxisViews?(): ISeriesPrimitiveAxisView[];  // Time axis labels
  priceAxisPaneViews?(): IPrimitivePaneView[];   // Price axis area
  timeAxisPaneViews?(): IPrimitivePaneView[];    // Time axis area
}
```

**Built-in Series Primitives:**
- SeriesMarkers (`series-markers/`)
- UpDownMarkers (`up-down-markers-plugin/`)

**Wrapper System:**
- `SeriesPrimitiveWrapper`: Adapts `ISeriesPrimitiveBase` to integrate with Series
- `PanePrimitiveWrapper`: Adapts `IPanePrimitiveBase` to integrate with Pane

### 3. Z-Order System

Primitives can render at different depth layers:
- `'bottom'`: Below all series data
- `'normal'`: At series level
- `'top'`: Above everything (including crosshair)

## Data Flow and Rendering Pipeline

### User Data → Display Pipeline

```
1. User calls setData()/update() on SeriesApi
   ↓
2. SeriesApi passes to DataUpdatesConsumer
   ↓
3. DataLayer validates and transforms data
   - Converts to internal time scale
   - Creates SeriesPlotRows
   ↓
4. ChartModel receives DataUpdateResponse
   - Updates Series objects
   - Updates TimeScale if needed
   - Marks affected Panes for invalidation
   ↓
5. Invalidation triggers _invalidateHandler()
   - Creates InvalidateMask
   - Schedules RAF rendering
   ↓
6. ChartWidget._drawImpl() called on RAF
   - For each pane:
     * Get visible data range
     * Call view.update() on all pane views
     * Get renderer from each view
     * Draw via renderer
```

### View Update Pattern

Each view implements lazy validation:

```typescript
update(updateType?: UpdateType): void {
  this._invalidated = true;
  if (updateType === 'data') this._dataInvalidated = true;
  if (updateType === 'options') this._optionsInvalidated = true;
}

renderer(): IPaneRenderer | null {
  if (!this._series.visible()) return null;
  this._makeValid(); // Lazy computation
  return this._itemsVisibleRange === null ? null : this._renderer;
}

private _makeValid(): void {
  if (this._dataInvalidated) {
    this._fillRawPoints(); // Extract series data
    this._dataInvalidated = false;
  }
  if (this._optionsInvalidated) {
    this._updateOptions(); // Apply options to items
    this._optionsInvalidated = false;
  }
  if (this._invalidated) {
    this._makeValidImpl(); // Subclass-specific logic
    this._invalidated = false;
  }
}
```

### Coordinate System

```
Canvas Pixel Space
↑ (Y increases downward)
├─ Price Scale converts:
│  price → Y coordinate
│  Y coordinate → price
│
└─ Time Scale converts:
   logical index → X coordinate
   X coordinate → logical index
```

## Key Patterns and Conventions

### 1. Inversion of Control

The library uses callbacks and delegates heavily:
- `InvalidateMask` triggers `_invalidateHandler` callback
- Model changes trigger subscribed listeners
- Events (click, crosshair move) trigger user callbacks

### 2. Lazy Evaluation

Computationally expensive operations are deferred:
- Views only compute renderer data when needed
- Formatting is cached and recomputed on-demand
- Coordinate conversions happen at render time

### 3. Reference-Based Array Caching

Performance optimization pattern:
```typescript
// Return SAME array if data unchanged
paneViews?(): readonly IPanePrimitivePaneView[] {
  if (!this._viewsChanged) return this._cachedViews;
  this._cachedViews = this._computeViews();
  return this._cachedViews;
}
```

This allows the library to detect changes via reference equality.

### 4. Series Type Discrimination

Series types are handled via discriminated unions:
```typescript
type SeriesType = 'Line' | 'Area' | 'Bar' | 'Candlestick' | 'Histogram' | 'Baseline';
```

Each type has specific options, plot data structure, and rendering logic.

### 5. Price Scale Positioning

Multiple price scales can coexist:
- **Left**: Default scale on left axis
- **Right**: Additional scale on right axis
- **Overlay**: Series on multiple scales simultaneously

Each series specifies which price scale to use.

### 6. Horizontal Scale Behavior Strategy

Time scale behavior is pluggable:
- `HorzScaleBehaviorTime`: Time-based (default) - converts Time to logical indices
- Custom behaviors can implement `IHorzScaleBehavior`
- Enables price-based scales or custom index types

### 7. Hit Testing

Multi-level hit testing for interactivity:
- Pane hit test: Which pane was clicked?
- Primitive hit test: Which primitive object?
- Series data point test: Which data point?

Results used for events and cursor styling.

## File Organization

```
src/
├── api/              # Public API classes and interfaces
│   └── options/      # Default configurations
├── formatters/       # Price/volume/percentage formatting
├── gui/              # DOM and rendering orchestration
├── helpers/          # Utilities (assertions, algorithms, etc.)
├── model/            # Core business logic
│   ├── series/       # Series-specific plot rows and pane views
│   ├── horz-scale-behavior-*/ # Pluggable scale behaviors
│   └── yield-curve-horz-scale-behavior/
├── plugins/          # Built-in plugin implementations
│   ├── text-watermark/
│   ├── image-watermark/
│   ├── series-markers/
│   └── up-down-markers-plugin/
├── renderers/        # Canvas drawing implementations
├── views/            # View layer components
│   ├── pane/         # Main chart area views
│   ├── price-axis/   # Price axis views
│   └── time-axis/    # Time axis views
└── typings/          # TypeScript type definitions
```

## Key Dependencies

**External (in package.json):**
- `fancy-canvas`: Canvas rendering abstraction
- TypeScript compiler (development)
- Testing and build tools (development)

**Internal:**
- No external runtime dependencies beyond fancy-canvas
- ~27,900 lines of TypeScript
- Compiled to ES5-compatible JavaScript
- Tree-shakeable module exports

## Performance Considerations

### 1. Invalidation-Based Rendering

Only redraws affected chart regions via the `InvalidateMask`:
- Cursor moves: Cursor-level invalidation
- Data updates: Light/Full invalidation
- Scale changes: Full invalidation

### 2. Visible Range Filtering

Views only prepare renderer data for visible bars, not entire dataset:
```typescript
const visibleRange = visibleTimedValues(
  this._series.bars(),
  this._model.timeScale().getVisibleLogicalRange(),
  // ...
);
```

### 3. Canvas Coordinate Batching

Renderers group drawing operations to minimize state changes.

### 4. Reference-Based Change Detection

Avoids deep equality checks by using reference identity on cached arrays.

### 5. Lazy Formatter Caching

Price formatting results are cached and only recomputed when needed.

## Extension Points for Contributors

1. **Add New Series Type**: Create pane-view and series definition in `src/model/series/`
2. **Add Built-in Plugin**: Create in `src/plugins/` with Pane or Series primitive wrapper
3. **Custom Horizontal Scale**: Implement `IHorzScaleBehavior` and pass to `createChartEx()`
4. **Custom Formatter**: Implement `IPriceFormatter` and set via series API
5. **Custom Renderer**: Extend primitive system for custom drawing

## Build and Export Strategy

The library exports two main entry points:

1. **ESM (ES6 modules)**: `src/index.ts`
   - Used by modern bundlers
   - Tree-shakeable
   - Separate production/development builds

2. **Standalone**: `src/standalone.ts`
   - UMD bundle
   - Includes all dependencies (fancy-canvas)
   - Creates `window.LightweightCharts` global

Configuration in `rollup.config.js` and `tsconfig.prod.json`.
