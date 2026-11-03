// TEMPORARY: stand-in for pools.js + oracle-data.js while the data layer is built. Same exports and
// shapes, made-up but realistic values. oracles.js imports this in one line; swap it for the real module.

const NOW = Date.now();
const MIN = 60 * 1000;
const TIP = 1650420;

const ORACLE_ADDRESSES = [
	'9fcrXXaJgrGKC8iu98Y2spstDDxNccXSR9QjbfTvtuv7vJ3NQLk',
	'9hA5gTKtQ7pX8Y6Q6vjKXXbTJdVjB6BjyMDf98yU8d1vyjbYkX5',
	'9gTHmQxG3LdgF3EDLmmVaRjJA3DLhxWuyZRsuSp1EP6UrUGMfjS',
	'9fYaP7twELzdTzWg5Q5GABPkFGLRrhXVMeC5Uppc97kcKEy53ez',
	'9h1aWJR6FsDXx6Y3hfVXNPGaECMkNsaMLsnJPa4m4gWsrMXDYyX',
	'9gJa6Mict6TVu9yipUX5aRUW87Yv8J62bbPEtkTje28sh5i3Lz8',
	'9eZVqXQ7rE9AzGwmZ4D3m9YTq2PEMd5DGb4JbtjwcgUmS5zsQ1m',
	'9i2Y8rHZ1zrN9JpbbRsEj9vWYhPHRcxRvt1uCJ47Yjjd3uBWS7K',
	'9fQHnth8J6riuaoa5tfVWT5YpGdQXc5Wd1Uq7G5uqF1Nw5Shy7Q',
	'9f7NvgAptJHSBGU4DYLZ6NuPWHBqJLtEdUY5dsQoZVJAuE7vWx3',
	'9hU5VUSUAmhEsTehBKDGFaFQSJx574UPoCquKBq59Ushv5XYgAu',
	'9g4Kek6iWspXPAURU3zxT4RGoKvFdvqgxgkANisNFbvDwK1KoxW'
];

export const ORACLE_POOLS = [
	{
		slug: 'erg-usd-v1', name: 'ERG/USD v1', pair: 'ERG/USD', version: 1, unit: 'USD', decimals: 2,
		poolNft: '011d3364de07e5a26f0c4eef0852cddb387039a921b7154ef3cab22c6eda887f',
		oracleToken: '8c27dd9d8a35aac1e3167d58858c0a8b4059b277da790552e37eba22df9b9035',
		refreshNft: null, buybackNft: null, buybackToken: null,
		epochLength: 30, oracleCount: 9, deviation: 0.5, consensus: 4, payoutNanoErg: 2000000,
		status: 'Used by SigUSD'
	},
	{
		slug: 'erg-usd-v2', name: 'ERG/USD v2', pair: 'ERG/USD', version: 2, unit: 'USD', decimals: 2,
		poolNft: '6a2b821b5727e85beb5e78b4efb9f0250d59cd48481d2ded2c23e91ba1d07c66',
		oracleToken: '74fa4aee3607ceb7bdefd51a856861b5dbfa434a988f4f7a8b2b5fdc5c5fb3ad',
		refreshNft: '2d4af9a0ec8a5a3cf8fd7e4c5f2a3c2b9d1e0f7a6b5c4d3e2f1a0b9c8d7e6f5a',
		buybackNft: '56c41e2f88f06ae2f3a1a5e3a2a0b1f0c9d8e7f6a5b4c3d2e1f0a9b8c7d6e5f4',
		buybackToken: '1f6b5e4d3c2b1a0f9e8d7c6b5a4f3e2d1c0b9a8f7e6d5c4b3a2f1e0d9c8b7a6f',
		epochLength: 30, oracleCount: 12, deviation: 5, consensus: 4, payoutNanoErg: null,
		status: 'Active'
	},
	{
		slug: 'xau', name: 'XAU/ERG', pair: 'XAU/ERG', version: 2, unit: 'ERG', decimals: 2,
		poolNft: '3c45f29a5165b030fdb5eaf5d81f8108f9d8f507b31487dd51f4ae08fe07cf4a',
		oracleToken: 'a1e6c5d4b3a2f1e0d9c8b7a6f5e4d3c2b1a0f9e8d7c6b5a4f3e2d1c0b9a8f7e6',
		refreshNft: 'b2f7d6e5c4b3a2f1e0d9c8b7a6f5e4d3c2b1a0f9e8d7c6b5a4f3e2d1c0b9a8f7',
		buybackNft: null, buybackToken: null,
		epochLength: 30, oracleCount: 6, deviation: 5, consensus: 3, payoutNanoErg: null,
		status: 'Active'
	},
	{
		slug: 'avl', name: 'AVL', pair: 'ERG/AVL', version: 2, unit: 'AVL', decimals: 4,
		poolNft: 'c3f8e7d6c5b4a3f2e1d0c9b8a7f6e5d4c3b2a1f0e9d8c7b6a5f4e3d2c1b0a9f8',
		oracleToken: 'd4a9f8e7d6c5b4a3f2e1d0c9b8a7f6e5d4c3b2a1f0e9d8c7b6a5f4e3d2c1b0a9',
		refreshNft: 'e5b0a9f8e7d6c5b4a3f2e1d0c9b8a7f6e5d4c3b2a1f0e9d8c7b6a5f4e3d2c1b0',
		buybackNft: null, buybackToken: null,
		epochLength: 60, oracleCount: 4, deviation: 5, consensus: 2, payoutNanoErg: null,
		status: 'Inactive'
	}
];

// Per pool: rate now, how long ago the last refresh was (minutes), how many oracles posted lately
const SHAPES = {
	'erg-usd-v1': { rate: 0.2801, ago: 14, live: 7, epoch: 41850 },
	'erg-usd-v2': { rate: 0.2798, ago: 41, live: 10, epoch: 19032 },
	'xau': { rate: 9563.2, ago: 52, live: 5, epoch: 10114 },
	'avl': { rate: 1.2034, ago: 60 * 24 * 9, live: 0, epoch: 3021 }
};

function delay(value) {
	return new Promise((resolve) => setTimeout(() => resolve(value), 300 + Math.random() * 400));
}

function hex(seed, length = 64) {
	let s = '';
	let x = seed * 2654435761 % 4294967296;

	while (s.length < length) {
		x = (x * 1103515245 + 12345) % 2147483648;
		s += x.toString(16).padStart(8, '0');
	}

	return s.substring(0, length);
}

function poolIndex(pool) {
	return ORACLE_POOLS.findIndex((p) => p.slug === pool.slug) + 1;
}

export async function fetchPoolState(pool) {
	const shape = SHAPES[pool.slug];
	const heightAgo = Math.round(shape.ago / 2);

	return delay({
		rate: shape.rate,
		rawDatapoint: String(Math.round(1e9 / shape.rate / 100)),
		epoch: shape.epoch,
		height: TIP - heightAgo,
		timestamp: NOW - shape.ago * MIN,
		boxId: hex(poolIndex(pool) * 11),
		txId: hex(poolIndex(pool) * 13),
		address: 'NTkuk55NdwCXkF1e2nCABxq7bHjtinX3wH13zYPZ6qYT71dCoZBe1gZkh9FAr7GeHo2EpFoibzpNQmoi89atUjKRrhZEYrTapdtXrWU4kq319oY7BEWmtmRU9cMohX69XMuxJjJP5hRM8WQLfFnffbjshhEP3ck9CKVEkFRw1JDYkqVke2JVqoMED5yxLVkScbBUiJJLWq9BSbE1JJmmreNVskmWNxWE6V7ksKPxFMoqh1SVePh3UWAaBgGQRZ7TWf4dTBF5KMVHmRXzmQqEu2Fz2yeSLy23sM3pfqa78VuvoFHnTFXYFFxn3DNttxwq3EU3Zv25SmgrWjLKiZjFcEcqGgH6DJ9FZ1DfucVtTXwyDJutY3ksUBaEStRxoUQyRu4EhDobixL3PUWRcxaRJ8JKA9b64ALErGepRHkAoVmS8DaE6VbroskyMuhkTo7LbrzhTyJbqKurEzoEfhYxus7bMpLTePgKcktgRRyB7MjVxjSpxWzZedvzbjzZaHLZLkWZESk1WtdM25My33wtVLNXiTvficEUbjA23sNd24pv1YQ72nY1aqUHa2'
	});
}

export async function fetchOperators(pool) {
	const shape = SHAPES[pool.slug];
	const operators = [];

	for (let i = 0; i < pool.oracleCount; i++) {
		const live = i < shape.live;
		const ago = live ? shape.ago + i * 3 : 60 * 24 * (3 + i * 4);

		operators.push({
			address: ORACLE_ADDRESSES[i],
			rate: shape.rate * (1 + ((i % 5) - 2) * 0.0012),
			epoch: live ? shape.epoch : shape.epoch - 40 - i * 90,
			height: TIP - Math.round(ago / 2),
			timestamp: NOW - ago * MIN,
			boxId: hex(poolIndex(pool) * 100 + i),
			txId: hex(poolIndex(pool) * 200 + i),
			live: live,
			ergBalance: i == 3 ? null : Math.round((1.5 + i * 7.3) * 1e9),
			wins: pool.version == 2 ? Math.max(0, 420 - i * 37) : null
		});
	}

	return delay(operators);
}

export async function fetchRefreshHistory(pool, offset, limit) {
	const shape = SHAPES[pool.slug];
	const total = shape.epoch - 1200;
	const items = [];

	for (let i = offset; i < Math.min(offset + limit, total); i++) {
		items.push({
			height: TIP - Math.round(shape.ago / 2) - i * pool.epochLength,
			timestamp: NOW - shape.ago * MIN - i * pool.epochLength * 2 * MIN,
			rate: shape.rate * (1 + Math.sin(i / 7) * 0.02),
			epoch: shape.epoch - i,
			txId: hex(poolIndex(pool) * 1000 + i),
			collector: ORACLE_ADDRESSES[i % Math.max(1, shape.live || 3)]
		});
	}

	return delay({ items, total });
}

export async function fetchRateHistory(pool, days) {
	const shape = SHAPES[pool.slug];
	const points = [];
	const step = days <= 7 ? 60 * MIN : 6 * 60 * MIN;

	for (let t = NOW - days * 24 * 60 * MIN; t <= NOW; t += step) {
		const i = (t - NOW) / (60 * MIN);
		points.push({ time: t, rate: shape.rate * (1 + Math.sin(i / 30) * 0.04 + Math.cos(i / 9) * 0.01) });
	}

	return delay(points);
}
