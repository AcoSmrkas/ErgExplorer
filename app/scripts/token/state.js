// Central state management for token page
export const TokenState = {
	// Token data
	tokenData: undefined,
	tokenId: '',
	nftType: undefined,
	decimals: 0,

	// Price/market data
	priceData: undefined,
	hasPrice: false,
	amountsData: undefined,
	holders: [],
	txs: [],
	swaps: [],

	// Chart state
	chart: undefined,
	chartType: undefined,
	tempDate: -1,
	tempDateIndex: 0,
	chartUsd: true,

	// NFT/display data
	imageUrl: null,
	currentAddress: '',

	// Time periods for price history
	nowTime: Date.now(),
	from24h: Date.now() - (24 * 60 * 60 * 1000),
	from7d: Date.now() - (7 * 24 * 60 * 60 * 1000),
	from30d: Date.now() - (30 * 24 * 60 * 60 * 1000),

	// Helper to reset dates (call periodically)
	updateTimePeriods() {
		this.nowTime = Date.now();
		this.from24h = this.nowTime - (24 * 60 * 60 * 1000);
		this.from7d = this.nowTime - (7 * 24 * 60 * 60 * 1000);
		this.from30d = this.nowTime - (30 * 24 * 60 * 60 * 1000);
	}
};
