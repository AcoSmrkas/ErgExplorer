// Oracle pools the Oracles page shows. Every id was read from the chain on 2026-11-03: the pool box
// (unspent box holding poolNft), its refresh box and the datapoint boxes holding oracleToken. The
// parameters come from the contracts' own constants (v2: the refresh box; v1: the live epoch and
// epoch preparation boxes), the counts from the datapoint boxes alive then.
//
// unit is what the rate is shown in ('USD' also turns on the market line), unitLabel the long form,
// rawUnit what the raw datapoint on the chain counts,
// decimals the unit's own decimals (the page shows two more). payoutNanoErg is per oracle per epoch
// (v1 pays ERG; v2 pays reward tokens instead, see buybackToken). deviation is the most a datapoint
// may differ from the others, in percent; consensus the fewest datapoints a refresh takes.
//
// Left out: the AVL Multi-Oracle (MPOOL f7f008ad…). Its pool box keeps the rates in an AvlTree
// (R5 is only the tree's root digest), so no rate can be read from the registers, and it has not
// refreshed since height 1872820.
export const ORACLE_POOLS = [
	{
		slug: 'erg-usd-v1',
		name: 'ERG/USD v1',
		pair: 'ERG/USD',
		version: 1,
		unit: 'USD',
		unitLabel: 'USD per ERG',
		rawUnit: 'nanoERG/USD',
		decimals: 2,
		poolNft: '011d3364de07e5a26f0c4eef0852cddb387039a921b7154ef3cab22c6eda887f',
		oracleToken: '8c27dd9d8a35aac1e3167d58858c0a8b4059b277da790552e37eba22df9b9035',
		refreshNft: null,
		buybackNft: null,
		buybackToken: null,
		// A live epoch runs 6 blocks from its start (epoch preparation constant); the collector is paid double
		epochLength: 6,
		oracleCount: 9,
		deviation: 5,
		consensus: 4,
		payoutNanoErg: 250000,
		status: 'live'
	},
	{
		slug: 'erg-usd-v2',
		name: 'ERG/USD v2',
		pair: 'ERG/USD',
		version: 2,
		unit: 'USD',
		unitLabel: 'USD per ERG',
		rawUnit: 'nanoERG/USD',
		decimals: 2,
		poolNft: '6a2b821b5727e85beb5e78b4efb9f0250d59cd48481d2ded2c23e91ba1d07c66',
		oracleToken: '74fa4aee3607ceb7bdefd51a856861b5dbfa434a8f6c93bfe967de8ed1a30a78',
		refreshNft: '19b7f2e2f11052c020800c8b620660f9f0b5fd5b3f2beacc8b44af960477a694',
		buybackNft: 'dcce07af04ea4f9b7979336476594dc16321547bcc9c6b95a67cb1a94192da4f',
		// DORT: each refresh pays 1 to every datapoint it collects and as many again to the collector
		buybackToken: 'ae399fcb751e8e247d0da8179a2bcca2aa5119fff9c85721ffab9cdc9a3cb2dd',
		epochLength: 6,
		oracleCount: 18,
		deviation: 5,
		consensus: 8,
		payoutNanoErg: null,
		// USE's mint actions read this pool; its LP box holds 0.002 ERG and 1 USE since height 1868204
		status: 'USE LP drained'
	},
	{
		slug: 'xau',
		name: 'XAU/ERG',
		pair: 'XAU/ERG',
		version: 2,
		unit: 'ERG/oz',
		unitLabel: 'ERG per troy ounce of gold',
		rawUnit: 'nanoERG/kg',
		decimals: 0,
		poolNft: '3c45f29a5165b030fdb5eaf5d81f8108f9d8f507b31487dd51f4ae08fe07cf4a',
		// "Gold Pool oracle token v3": the token the refresh contract counts. Older v1/v2 gold tokens
		// (6183680b…, a007e07a…) are still in wallets but no longer post.
		oracleToken: '78263e5613557e129f075f0a241287e09c4204be76ad53d77d6e7feebcccb001',
		refreshNft: '97ad159235d25d05d7efc5863b5d360f89d7d668409502058be3e7aac177b9cb',
		// The buyback contract still names the old v1 gold oracle token (6183680b…) as a constant
		buybackNft: '610735cbf197f9de67b3628129feaa5a52403286859d140be719467c0fb94328',
		// GORT
		buybackToken: '7ba2a85fdb302a181578b1f64cb4a533d89b3f8de4159efece75da41041537f9',
		epochLength: 30,
		oracleCount: 20,
		deviation: 5,
		consensus: 8,
		payoutNanoErg: null,
		// DexyGold's free and arbitrage mints read this pool; its LP box holds 0.002 ERG and 1 DexyGold
		// since height 1868221
		status: 'DexyGold LP drained'
	}
];
