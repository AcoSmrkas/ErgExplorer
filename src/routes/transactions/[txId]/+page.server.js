import { error } from '@sveltejs/kit';
import { API_ENDPOINTS } from '$lib/utils/constants.js';

export async function load({ params, fetch }) {
	const { txId } = params;

	try {
		// Use the exact API endpoint from the example URL provided
		const transactionUrl = `${API_ENDPOINTS.ERGOPLATFORM}transactions/${txId}`;
		
		const response = await fetch(transactionUrl);
		
		if (!response.ok) {
			if (response.status === 404) {
				throw error(404, 'Transaction not found');
			}
			throw error(response.status, `Failed to load transaction: ${response.statusText}`);
		}

		const transaction = await response.json();

		return {
			transaction,
			txId
		};
	} catch (err) {
		if (err.status) {
			throw err;
		}
		console.error('Failed to load transaction:', err);
		throw error(500, 'Failed to load transaction data');
	}
}