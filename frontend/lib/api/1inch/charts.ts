/**
 * Types for 1inch Charts API
 */
export interface ChartData {
    prices: Array<[number, number]>; // [timestamp, price]
    volumes: Array<[number, number]>; // [timestamp, volume]
    meta?: {
        fromToken: string;
        toToken: string;
        period: string;
        chainId: string;
    };
}

export interface ChartError {
    error: string;
    description: string;
    statusCode: number;
    meta?: any;
    requestId?: string;
}

/**
 * Fetch chart data from 1inch API
 * @param fromToken - Source token address
 * @param toToken - Destination token address
 * @param period - Time period (e.g., '1W', '1M', '1Y')
 * @param chainId - Chain ID (default: '1' for Ethereum)
 * @returns Promise with chart data or error
 */
export async function fetchChartData(
    fromToken: string,
    toToken: string,
    period: string = '1W',
    chainId: string = '1'
): Promise<ChartData | ChartError> {
    try {
        const params = new URLSearchParams({
            fromToken,
            toToken,
            period,
            chainId,
        });

        const response = await fetch(`/api/1inch/charts?${params.toString()}`);
        const data = await response.json();

        if (!response.ok) {
            return data as ChartError;
        }

        return data as ChartData;
    } catch (error) {
        return {
            error: 'Failed to fetch chart data',
            description: error instanceof Error ? error.message : 'Unknown error occurred',
            statusCode: 500,
        };
    }
}

/**
 * Example usage:
 * 
 * ```typescript
 * // Fetch BNB/USDC chart data for 1 week
 * const chartData = await fetchChartData(
 *   '0xb8c77482e45f1f44de1745f52c74426c631bdd52', // BNB
 *   '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', // USDC
 *   '1W',
 *   '1'
 * );
 * 
 * if ('error' in chartData) {
 *   console.error('Error fetching chart:', chartData.error);
 * } else {
 *   console.log('Chart data:', chartData.prices);
 * }
 * ```
 */ 