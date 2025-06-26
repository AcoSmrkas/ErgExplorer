async function load({ parent }) {
  const { currentPrices } = await parent();
  return {
    currentPrices: currentPrices || {}
  };
}
export {
  load
};
