import type { IChartApi, ISeriesApi, SeriesOptionsMap } from 'lightweight-charts';
import type { ExpiringPriceAlertParameters } from './options';

export interface ExpiringPriceAlert {
	price: number;
	start: number;
	end: number;
	parameters: ExpiringPriceAlertParameters;
	crossed: boolean;
	expired: boolean;
}

export interface IExpiringPriceAlerts {
	alerts(): Map<string, ExpiringPriceAlert>;
	chart(): IChartApi | null;
	series(): ISeriesApi<keyof SeriesOptionsMap>;
}
