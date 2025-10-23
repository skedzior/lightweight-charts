import type { CanvasRenderingTarget2D } from 'fancy-canvas';
import type {
	ISeriesPrimitive,
	IPrimitivePaneRenderer,
	IPrimitivePaneView,
	SeriesAttachedParameter,
	Time
} from 'lightweight-charts';

interface TextOptions {
	text: string;
	color: string;
	x: number;
	y: number;
}

class SimpleTextRenderer implements IPrimitivePaneRenderer {
	private _options: TextOptions;

	constructor(options: TextOptions) {
		this._options = options;
	}

	draw(target: CanvasRenderingTarget2D) {
		target.useMediaCoordinateSpace((scope) => {
			const ctx = scope.context;
			ctx.font = '16px sans-serif';
			ctx.fillStyle = this._options.color;
			ctx.fillText(this._options.text, this._options.x, this._options.y);
		});
	}
}

class SimpleTextPaneView implements IPrimitivePaneView {
	private _source: SimpleTextPlugin;

	constructor(source: SimpleTextPlugin) {
		this._source = source;
	}

	update() {}

	renderer() {
		return new SimpleTextRenderer(this._source.options());
	}
}

export class SimpleTextPlugin implements ISeriesPrimitive<Time> {
	private _paneViews: SimpleTextPaneView[];
	private _options: TextOptions;
	requestUpdate?: () => void;

	constructor(options: TextOptions) {
		this._options = options;
		this._paneViews = [new SimpleTextPaneView(this)];
	}

	options(): TextOptions {
		return this._options;
	}

	updateOptions(options: Partial<TextOptions>) {
		this._options = { ...this._options, ...options };
		this.requestUpdate?.();
	}

	updateAllViews() {
		this._paneViews.forEach((pw) => pw.update());
	}

	paneViews() {
		return this._paneViews;
	}

	attached({ requestUpdate }: SeriesAttachedParameter<Time>) {
		this.requestUpdate = requestUpdate;
	}

	detached() {
		this.requestUpdate = undefined;
	}
}
