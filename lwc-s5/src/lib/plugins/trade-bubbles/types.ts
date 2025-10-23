import type { Time } from 'lightweight-charts';

export interface TradeBubblesData {
	time: Time;
	price: number;
	volume: number;
	side: 'buy' | 'sell';
	color?: string;
}

export interface TradeBubblesOptions {
	/**
	 * Minimum bubble radius in pixels
	 * @default 3
	 */
	minRadius?: number;

	/**
	 * Maximum bubble radius in pixels
	 * @default 20
	 */
	maxRadius?: number;

	/**
	 * Color for buy trades
	 * @default 'rgba(38, 166, 154, 0.6)'
	 */
	buyColor?: string;

	/**
	 * Color for sell trades
	 * @default 'rgba(239, 83, 80, 0.6)'
	 */
	sellColor?: string;

	/**
	 * Opacity of bubbles
	 * @default 0.7
	 */
	opacity?: number;

	/**
	 * Border width in pixels
	 * @default 1
	 */
	borderWidth?: number;

	/**
	 * Shadow blur radius
	 * @default 4
	 */
	shadowBlur?: number;

	/**
	 * Show volume text inside bubble
	 * @default true
	 */
	showVolumeText?: boolean;

	/**
	 * Volume scaling method
	 * - 'linear': Direct linear scaling
	 * - 'sqrt': Square root scaling (better for large volume variance)
	 * - 'log': Logarithmic scaling (best for very large variance)
	 * @default 'linear'
	 */
	volumeScale?: 'linear' | 'sqrt' | 'log';
}
