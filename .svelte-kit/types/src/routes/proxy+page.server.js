// @ts-nocheck
/** @param {Parameters<import('./$types').PageServerLoad>[0]} event */
export async function load({ parent }) {
	// Get current prices from parent layout for token calculations
	const { currentPrices } = await parent();
	
	return {
		currentPrices: currentPrices || {}
	};
}