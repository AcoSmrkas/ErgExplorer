/** @type {import('./$types').PageServerLoad} */
export async function load({ parent }) {
  // Get current prices from parent layout for token calculations
  const { currentPrices } = await parent();

  return {
    currentPrices: currentPrices || {},
  };
}
