import type { UTCTimestamp } from 'lightweight-charts';

type WithTime<V> = V & { time: unknown };

/**
 * Ensures that all data items have numeric timestamps.
 * Throws an error if any item has a non-numeric time property.
 */
export function ensureTimestampData<T, N extends UTCTimestamp>(
	data: WithTime<T>[]
): (Omit<T, 'time'> & { time: N })[] {
	for (const item of data) {
		if (typeof item.time !== 'number') {
			throw new Error('All items must have a numeric "time" property.');
		}
	}
	return data as (Omit<T, 'time'> & { time: N })[];
}
