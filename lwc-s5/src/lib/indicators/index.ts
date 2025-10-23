// Indicator Components
export { default as MovingAverage } from './moving-average/MovingAverage.svelte';
export { default as Momentum } from './momentum/Momentum.svelte';
export { default as Correlation } from './correlation/Correlation.svelte';

// Calculation functions and types
export {
	calculateMovingAverageIndicatorValues,
	type MovingAverageCalculationOptions,
	type MovingAverageSmoothing
} from './moving-average/moving-average-calculation';

export {
	calculateMomentumIndicatorValues,
	type MomentumCalculationOptions
} from './momentum/momentum-calculation';

export {
	calculateCorrelationIndicatorValues,
	type CorrelationCalculationOptions
} from './correlation/correlation-calculation';

// Helper utilities
export { ClosestTimeIndexFinder, type SearchDirection } from './helpers/closest-index';
export { ensureTimestampData } from './helpers/timestamp-data';
