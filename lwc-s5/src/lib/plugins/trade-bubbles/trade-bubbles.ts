import type {
	ISeriesPrimitive,
	SeriesAttachedParameter,
	Time,
	ISeriesPrimitivePaneView,
	SeriesPrimitivePaneViewZOrder,
	ISeriesApi,
	SeriesType,
	AutoscaleInfo,
	Coordinate
} from 'lightweight-charts';
import type { CanvasRenderingTarget2D } from 'fancy-canvas';
import type { TradeBubblesData, TradeBubblesOptions } from './types';

interface TradeBubble extends TradeBubblesData {
	x?: Coordinate;
	y?: Coordinate;
	radius?: number;
}

class TradeBubblesPaneView implements ISeriesPrimitivePaneView {
	_source: TradeBubbles;

	constructor(source: TradeBubbles) {
		this._source = source;
	}

	zOrder(): SeriesPrimitivePaneViewZOrder {
		return 'normal';
	}

	renderer() {
		return this._source._renderer;
	}
}

class TradeBubblesRenderer {
	_source: TradeBubbles;

	constructor(source: TradeBubbles) {
		this._source = source;
	}

	draw(target: CanvasRenderingTarget2D) {
		const trades = this._source._trades;
		const options = this._source._options;

		target.useMediaCoordinateSpace(scope => {
			const ctx = scope.context;

			trades.forEach(trade => {
				if (trade.x === undefined || trade.y === undefined || trade.radius === undefined) return;

				// Draw shadow for depth
				if (options.shadowBlur > 0) {
					ctx.save();
					ctx.shadowColor = trade.color || options.buyColor;
					ctx.shadowBlur = options.shadowBlur;
					ctx.shadowOffsetX = 0;
					ctx.shadowOffsetY = 0;
				}

				// Draw circle
				ctx.beginPath();
				ctx.arc(trade.x, trade.y, trade.radius, 0, Math.PI * 2);
				ctx.fillStyle = trade.color || (trade.side === 'buy' ? options.buyColor : options.sellColor);
				ctx.globalAlpha = options.opacity;
				ctx.fill();

				// Draw border
				if (options.borderWidth > 0) {
					ctx.strokeStyle = trade.color || (trade.side === 'buy' ? options.buyColor : options.sellColor);
					ctx.lineWidth = options.borderWidth;
					ctx.globalAlpha = 1;
					ctx.stroke();
				}

				if (options.shadowBlur > 0) {
					ctx.restore();
				}

				// Draw volume text inside bubble if large enough
				if (options.showVolumeText && trade.radius > 15) {
					ctx.fillStyle = '#ffffff';
					ctx.globalAlpha = 0.9;
					ctx.font = `${Math.min(12, trade.radius * 0.6)}px sans-serif`;
					ctx.textAlign = 'center';
					ctx.textBaseline = 'middle';

					const volumeText = this.formatVolume(trade.volume);
					ctx.fillText(volumeText, trade.x, trade.y);
				}

				ctx.globalAlpha = 1;
			});
		});
	}

	formatVolume(volume: number): string {
		if (volume >= 1000000) {
			return (volume / 1000000).toFixed(1) + 'M';
		} else if (volume >= 1000) {
			return (volume / 1000).toFixed(1) + 'K';
		}
		return volume.toFixed(0);
	}
}

export class TradeBubbles implements ISeriesPrimitive<Time> {
	_trades: TradeBubble[] = [];
	_options: Required<TradeBubblesOptions>;
	_series?: ISeriesApi<SeriesType>;
	_chart?: any; // IChartApi
	_requestUpdate?: () => void;
	_paneViews: TradeBubblesPaneView[];
	_renderer: TradeBubblesRenderer;

	// Volume scaling parameters
	_minVolume: number = 0;
	_maxVolume: number = 0;

	constructor(options?: Partial<TradeBubblesOptions>) {
		this._options = {
			minRadius: options?.minRadius ?? 3,
			maxRadius: options?.maxRadius ?? 20,
			buyColor: options?.buyColor ?? 'rgba(38, 166, 154, 0.6)',
			sellColor: options?.sellColor ?? 'rgba(239, 83, 80, 0.6)',
			opacity: options?.opacity ?? 0.7,
			borderWidth: options?.borderWidth ?? 1,
			shadowBlur: options?.shadowBlur ?? 4,
			showVolumeText: options?.showVolumeText ?? true,
			volumeScale: options?.volumeScale ?? 'linear' // 'linear' | 'sqrt' | 'log'
		};

		this._renderer = new TradeBubblesRenderer(this);
		this._paneViews = [new TradeBubblesPaneView(this)];
	}

	attached(param: SeriesAttachedParameter<Time>) {
		this._series = param.series;
		this._chart = param.chart;
		this._requestUpdate = param.requestUpdate;
		this._updateCoordinates();
	}

	detached() {
		this._series = undefined;
		this._chart = undefined;
		this._requestUpdate = undefined;
	}

	updateAllViews() {
		// Recalculate coordinates when chart is panned/zoomed
		this._updateCoordinates();
		this._paneViews.forEach(pw => pw.renderer());
	}

	paneViews() {
		return this._paneViews;
	}

	/**
	 * Add a single trade bubble
	 */
	addTrade(trade: TradeBubblesData) {
		this._trades.push({ ...trade });
		this._updateVolumeRange();
		this._updateCoordinates();
		this._requestUpdate?.();
	}

	/**
	 * Set all trade bubbles at once
	 */
	setTrades(trades: TradeBubblesData[]) {
		this._trades = [...trades];
		this._updateVolumeRange();
		this._updateCoordinates();
		this._requestUpdate?.();
	}

	/**
	 * Clear all trades
	 */
	clearTrades() {
		this._trades = [];
		this._minVolume = 0;
		this._maxVolume = 0;
		this._requestUpdate?.();
	}

	/**
	 * Update options
	 */
	applyOptions(options: Partial<TradeBubblesOptions>) {
		this._options = { ...this._options, ...options };
		this._updateCoordinates();
		this._requestUpdate?.();
	}

	/**
	 * Update volume range for scaling
	 */
	private _updateVolumeRange() {
		if (this._trades.length === 0) {
			this._minVolume = 0;
			this._maxVolume = 0;
			return;
		}

		this._minVolume = Math.min(...this._trades.map(t => t.volume));
		this._maxVolume = Math.max(...this._trades.map(t => t.volume));
	}

	/**
	 * Calculate radius based on volume
	 */
	private _calculateRadius(volume: number): number {
		if (this._maxVolume === this._minVolume) {
			return (this._options.minRadius + this._options.maxRadius) / 2;
		}

		// Normalize volume to 0-1 range
		const normalized = (volume - this._minVolume) / (this._maxVolume - this._minVolume);

		// Apply scaling function
		let scaled: number;
		switch (this._options.volumeScale) {
			case 'sqrt':
				scaled = Math.sqrt(normalized);
				break;
			case 'log':
				// Log scale with offset to avoid log(0)
				scaled = Math.log10(normalized * 9 + 1);
				break;
			case 'linear':
			default:
				scaled = normalized;
				break;
		}

		// Map to radius range
		return this._options.minRadius + scaled * (this._options.maxRadius - this._options.minRadius);
	}

	/**
	 * Update coordinates for all trades
	 */
	private _updateCoordinates() {
		if (!this._series || !this._chart) return;

		const timeScale = this._chart.timeScale();

		this._trades.forEach(trade => {
			// Get x coordinate from time scale
			const x = timeScale.timeToCoordinate(trade.time);

			// Get y coordinate from series price scale
			const y = this._series!.priceToCoordinate(trade.price);

			if (x !== null && y !== null) {
				trade.x = x as Coordinate;
				trade.y = y as Coordinate;
				trade.radius = this._calculateRadius(trade.volume);
			}
		});
	}

	autoscaleInfo(): AutoscaleInfo | null {
		// Include trade prices in autoscale
		if (this._trades.length === 0) return null;

		const prices = this._trades.map(t => t.price);
		return {
			priceRange: {
				minValue: Math.min(...prices),
				maxValue: Math.max(...prices)
			}
		};
	}
}
