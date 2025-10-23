import {
	type IChartApi,
	type ISeriesApi,
	type ISeriesPrimitive,	
	type IPrimitivePaneRenderer,
	type IPrimitivePaneView,
	type SeriesAttachedParameter,
	type SeriesType,
	type Time,
	LineStyle,
	type PrimitiveHoveredItem,
} from 'lightweight-charts';
import { CanvasRenderingTarget2D } from 'fancy-canvas';
import { UserAlertsState, type UserAlertInfo } from '../user-price-alerts/state';
import {
	averageWidthPerCharacter,
	buttonWidth,
	centreLabelInlinePadding,
	clockPlusIconPaths,
	removeButtonWidth,
} from '../user-price-alerts/constants';
import type { IRendererData } from '../user-price-alerts/irenderer-data';
import { MouseHandlers, type MousePosition } from '../user-price-alerts/mouse';

// Icons for the two button types
const plusIcon = `M7.5,7.5 m -7,0 a 7,7 0 1,0 14,0 a 7,7 0 1,0 -14,0 M4 7.5H11 M7.5 4V11`;
const plusIconPath = new Path2D(plusIcon);

// Constants for layout
const BUTTON_HEIGHT = 21;
const BUTTON_WIDTH = 22;
const BUTTON_SPACING = 4;

interface ButtonRendererData {
	y: number;
	x: number;
	width: number;
	height: number;
	color: string;
	hovering: boolean;
	icon: Path2D | Path2D[];
	label?: string;
}

interface PriceManagerAlertData {
	y: number;
	text: string;
	showHover: boolean;
	hoverRemove: boolean;
	color: string;
	labelX: number;
	labelWidth: number;
	removeX: number;
}

class PriceManagerRenderer implements IPrimitivePaneRenderer {
	private _alertButton: ButtonRendererData | null = null;
	private _lineButton: ButtonRendererData | null = null;
	private _alerts: PriceManagerAlertData[] = [];
	private _symbolName: string = '';

	constructor(
		alertButton: ButtonRendererData | null,
		lineButton: ButtonRendererData | null,
		alerts: PriceManagerAlertData[],
		symbolName: string
	) {
		this._alertButton = alertButton;
		this._lineButton = lineButton;
		this._alerts = alerts;
		this._symbolName = symbolName;
	}

	draw(target: CanvasRenderingTarget2D) {
		target.useBitmapCoordinateSpace((scope) => {
			const ctx = scope.context;
			const scaledVerticalPixelRatio = scope.verticalPixelRatio;
			const scaledHorizontalPixelRatio = scope.horizontalPixelRatio;

			// Draw alerts first
			this._alerts.forEach((alert) => {
				this._drawAlert(ctx, alert, scaledVerticalPixelRatio, scaledHorizontalPixelRatio);
			});

			// Draw alert button
			if (this._alertButton) {
				this._drawButton(ctx, this._alertButton, scaledVerticalPixelRatio, scaledHorizontalPixelRatio, '#FF6B6B');
			}

			// Draw price line button
			if (this._lineButton) {
				this._drawButton(ctx, this._lineButton, scaledVerticalPixelRatio, scaledHorizontalPixelRatio, '#4A90E2');
			}
		});
	}

	private _drawButton(
		ctx: CanvasRenderingContext2D,
		button: ButtonRendererData,
		vPixelRatio: number,
		hPixelRatio: number,
		defaultColor: string
	) {
		const x = Math.round(button.x * hPixelRatio);
		const y = Math.round(button.y * vPixelRatio);
		const width = Math.round(button.width * hPixelRatio);
		const height = Math.round(button.height * vPixelRatio);

		// Background
		ctx.fillStyle = button.hovering ? '#555' : button.color || defaultColor;
		ctx.beginPath();
		ctx.roundRect(x, y, width, height, 4 * hPixelRatio);
		ctx.fill();

		// Icon(s)
		ctx.save();
		ctx.translate(x + width / 2, y + height / 2);
		ctx.scale(hPixelRatio, vPixelRatio);
		ctx.strokeStyle = '#fff';
		ctx.fillStyle = '#fff';
		ctx.lineWidth = 1;

		// Handle both single icon and array of icons
		if (Array.isArray(button.icon)) {
			button.icon.forEach(iconPath => {
				ctx.fill(iconPath);
				ctx.stroke(iconPath);
			});
		} else {
			ctx.stroke(button.icon);
		}
		ctx.restore();

		// Label (if any)
		if (button.label) {
			ctx.fillStyle = '#fff';
			ctx.font = '11px sans-serif';
			ctx.textAlign = 'center';
			ctx.textBaseline = 'middle';
			ctx.fillText(button.label, x + width / 2, y + height / 2);
		}
	}

	private _drawAlert(
		ctx: CanvasRenderingContext2D,
		alert: PriceManagerAlertData,
		vPixelRatio: number,
		hPixelRatio: number
	) {
		const y = Math.round(alert.y * vPixelRatio);
		const x = Math.round(alert.labelX * hPixelRatio);
		const removeX = Math.round(alert.removeX * hPixelRatio);

		// Draw alert line
		ctx.strokeStyle = alert.color;
		ctx.lineWidth = 2;
		ctx.setLineDash([5, 3]);
		ctx.beginPath();
		ctx.moveTo(0, y);
		ctx.lineTo(x, y);
		ctx.stroke();
		ctx.setLineDash([]);

		// Draw alert label
		const labelHeight = BUTTON_HEIGHT * vPixelRatio;
		const labelWidth = alert.labelWidth * hPixelRatio;

		ctx.fillStyle = alert.color;
		ctx.beginPath();
		ctx.roundRect(x, y - labelHeight / 2, labelWidth, labelHeight, 4 * hPixelRatio);
		ctx.fill();

		// Label text
		if (alert.text) {
			ctx.fillStyle = '#fff';
			ctx.font = `${11 * vPixelRatio}px sans-serif`;
			ctx.textAlign = 'left';
			ctx.textBaseline = 'middle';
			ctx.fillText(alert.text, x + 6 * hPixelRatio, y);
		}

		// Draw remove button if hovering
		if (alert.showHover && alert.hoverRemove) {
			ctx.fillStyle = '#FF4444';
			ctx.beginPath();
			ctx.roundRect(
				removeX,
				y - labelHeight / 2,
				removeButtonWidth * hPixelRatio,
				labelHeight,
				4 * hPixelRatio
			);
			ctx.fill();

			// Draw X
			ctx.strokeStyle = '#fff';
			ctx.lineWidth = 2;
			const pad = 6 * hPixelRatio;
			ctx.beginPath();
			ctx.moveTo(removeX + pad, y - labelHeight / 2 + pad);
			ctx.lineTo(removeX + removeButtonWidth * hPixelRatio - pad, y + labelHeight / 2 - pad);
			ctx.moveTo(removeX + pad, y + labelHeight / 2 - pad);
			ctx.lineTo(removeX + removeButtonWidth * hPixelRatio - pad, y - labelHeight / 2 + pad);
			ctx.stroke();
		}
	}
}

class PriceManagerPaneView implements IPrimitivePaneView {
	private _source: UserPriceManager;

	constructor(source: UserPriceManager) {
		this._source = source;
	}

	update() {
		// View updates are triggered by the manager
	}

	renderer(): IPrimitivePaneRenderer {
		return this._source._getRenderer();
	}
}

/**
 * Price type enum
 */
export enum PriceType {
	Alert = 'alert',
	Line = 'line',
}

/**
 * Combined plugin options
 */
export interface UserPriceManagerOptions {
	alertColor?: string;
	lineColor?: string;
	symbolName?: string;
}

/**
 * User Price Manager
 * Combines price alerts and price lines functionality
 */
export class UserPriceManager extends UserAlertsState implements ISeriesPrimitive<Time> {
	private _chart: IChartApi | undefined = undefined;
	private _series: ISeriesApi<SeriesType> | undefined = undefined;
	private _mouseHandlers: MouseHandlers;
	private _paneViews: PriceManagerPaneView[] = [];
	private _lastMouseUpdate: MousePosition | null = null;
	private _currentCursor: string | null = null;
	private _hoveringID: string | null = null;
	private _symbolName: string = '';
	private _options: UserPriceManagerOptions;

	constructor(options: UserPriceManagerOptions = {}) {
		super();
		this._mouseHandlers = new MouseHandlers();
		this._symbolName = options.symbolName || '';
		this._options = {
			alertColor: '#FF6B6B',
			lineColor: '#4A90E2',
			...options,
		};
	}

	setSymbolName(name: string) {
		this._symbolName = name;
	}

	attached({ chart, series, requestUpdate }: SeriesAttachedParameter<Time>) {
		this._chart = chart;
		this._series = series;
		this._paneViews = [new PriceManagerPaneView(this)];

		this._mouseHandlers.attached(chart, series);
		this._mouseHandlers.mouseMoved().subscribe((mouseUpdate) => {
			this._lastMouseUpdate = mouseUpdate;
			requestUpdate();
		}, this);

		this._mouseHandlers.clicked().subscribe((mousePosition) => {
			if (!mousePosition || !this._series) return;

			const price = this._series.coordinateToPrice(mousePosition.y);
			if (!price) return;

			// Check if clicking on alert button
			const alertButtonHover = this._isHoveringAlertButton(mousePosition);
			if (alertButtonHover) {
				this.addAlert(price);
				requestUpdate();
				return;
			}

			// Check if clicking on line button
			const lineButtonHover = this._isHoveringLineButton(mousePosition);
			if (lineButtonHover) {
				this._series.createPriceLine({
					price,
					color: this._options.lineColor || '#4A90E2',
					lineStyle: LineStyle.Dashed,
					title: 'Price Line',
				});
				requestUpdate();
				return;
			}

			// Check if clicking remove button on alert
			if (this._hoveringID) {
				this.removeAlert(this._hoveringID);
				requestUpdate();
			}
		}, this);
	}

	detached() {
		this._mouseHandlers.mouseMoved().unsubscribeAll(this);
		this._mouseHandlers.clicked().unsubscribeAll(this);
		this._mouseHandlers.detached();
		this._series = undefined;
		this._chart = undefined;
	}

	paneViews(): readonly IPrimitivePaneView[] {
		return this._paneViews;
	}

	priceAxisPaneViews(): readonly IPrimitivePaneView[] {
		return this._paneViews; // Same views for price axis
	}

	updateAllViews(): void {
		this._paneViews.forEach((pw) => pw.update());
	}

	hitTest(): PrimitiveHoveredItem | null {
		// Check if hovering over buttons or alerts
		if (!this._lastMouseUpdate) return null;

		if (this._isHoveringAlertButton(this._lastMouseUpdate) ||
		    this._isHoveringLineButton(this._lastMouseUpdate)) {
			return {
				cursorStyle: 'pointer',
				externalId: 'price-manager-button',
				zOrder: 'top',
			};
		}

		return null;
	}

	_getRenderer(): IPrimitivePaneRenderer {
		const alerts = this.alerts();
		const rendererData = this._calculateRendererData(alerts, this._lastMouseUpdate);

		this._currentCursor = null;
		if (rendererData?.alertButton?.hovering || rendererData?.lineButton?.hovering) {
			this._currentCursor = 'pointer';
		}

		return new PriceManagerRenderer(
			rendererData?.alertButton || null,
			rendererData?.lineButton || null,
			(rendererData?.alerts as PriceManagerAlertData[]) || [],
			this._symbolName
		);
	}

	private _calculateRendererData(
		alerts: UserAlertInfo[],
		mousePos: MousePosition | null
	): IRendererData & {
		alertButton?: ButtonRendererData;
		lineButton?: ButtonRendererData;
	} | null {
		if (!this._series || !this._chart) return null;

		const timeScaleWidth = this._chart.timeScale().width();

		// Calculate button positions
		let alertButton: ButtonRendererData | undefined;
		let lineButton: ButtonRendererData | undefined;

		if (mousePos) {
			const y = mousePos.y;
			const isNearPriceScale = timeScaleWidth - mousePos.x < 60;

			if (isNearPriceScale) {
				// Alert button (left)
				alertButton = {
					y: y - BUTTON_HEIGHT / 2,
					x: timeScaleWidth + BUTTON_SPACING,
					width: BUTTON_WIDTH,
					height: BUTTON_HEIGHT,
					color: this._options.alertColor || '#FF6B6B',
					hovering: this._isHoveringAlertButton(mousePos),
					icon: clockPlusIconPaths,
				};

				// Line button (right)
				lineButton = {
					y: y - BUTTON_HEIGHT / 2,
					x: timeScaleWidth + BUTTON_SPACING + BUTTON_WIDTH + BUTTON_SPACING,
					width: BUTTON_WIDTH,
					height: BUTTON_HEIGHT,
					color: this._options.lineColor || '#4A90E2',
					hovering: this._isHoveringLineButton(mousePos),
					icon: plusIconPath,
				};
			}
		}

		// Calculate alert renderers
		const alertRenderers: PriceManagerAlertData[] = alerts.map((alert) => {
			const y = this._series!.priceToCoordinate(alert.price) || 0;
			const text = `${this._symbolName} ${alert.price.toFixed(2)}`;
			const labelWidth =
				text.length * averageWidthPerCharacter +
				centreLabelInlinePadding * 2 +
				buttonWidth;

			const hovering = mousePos
				? this._isHoveringAlert(mousePos, y, timeScaleWidth, labelWidth)
				: false;

			const hoverRemove = mousePos && hovering
				? this._isHoveringRemoveButton(mousePos, timeScaleWidth, labelWidth)
				: false;

			if (hovering) {
				this._hoveringID = alert.id;
			}

			return {
				y,
				text,
				color: this._options.alertColor || '#FF6B6B',
				labelX: timeScaleWidth,
				labelWidth,
				removeX: timeScaleWidth + labelWidth - removeButtonWidth,
				showHover: hovering,
				hoverRemove,
			};
		});

		return {
			button: null,
			alerts: alertRenderers,
			color: this._options.alertColor || '#FF6B6B',
			alertIcon: clockPlusIconPaths,
			crosshair: null,
			alertButton,
			lineButton,
		};
	}

	private _isHoveringAlertButton(mousePos: MousePosition): boolean {
		if (!this._chart) return false;
		const timeScaleWidth = this._chart.timeScale().width();
		const buttonX = timeScaleWidth + BUTTON_SPACING;
		const buttonY = mousePos.y - BUTTON_HEIGHT / 2;

		return (
			mousePos.x >= buttonX &&
			mousePos.x <= buttonX + BUTTON_WIDTH &&
			mousePos.y >= buttonY &&
			mousePos.y <= buttonY + BUTTON_HEIGHT
		);
	}

	private _isHoveringLineButton(mousePos: MousePosition): boolean {
		if (!this._chart) return false;
		const timeScaleWidth = this._chart.timeScale().width();
		const buttonX = timeScaleWidth + BUTTON_SPACING + BUTTON_WIDTH + BUTTON_SPACING;
		const buttonY = mousePos.y - BUTTON_HEIGHT / 2;

		return (
			mousePos.x >= buttonX &&
			mousePos.x <= buttonX + BUTTON_WIDTH &&
			mousePos.y >= buttonY &&
			mousePos.y <= buttonY + BUTTON_HEIGHT
		);
	}

	private _isHoveringAlert(
		mousePos: MousePosition,
		alertY: number,
		timeScaleWidth: number,
		labelWidth: number
	): boolean {
		const labelHeight = BUTTON_HEIGHT;
		return (
			mousePos.x >= timeScaleWidth &&
			mousePos.x <= timeScaleWidth + labelWidth &&
			mousePos.y >= alertY - labelHeight / 2 &&
			mousePos.y <= alertY + labelHeight / 2
		);
	}

	private _isHoveringRemoveButton(
		mousePos: MousePosition,
		timeScaleWidth: number,
		labelWidth: number
	): boolean {
		const removeX = timeScaleWidth + labelWidth - removeButtonWidth;
		return mousePos.x >= removeX && mousePos.x <= removeX + removeButtonWidth;
	}
}
