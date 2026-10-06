//Mainnet's genesis state as a transaction, for the transaction and box pages. Neither explorer API
//serves these boxes by id, and api.ergoplatform drops them from the inputs of the transactions that
//spent them, so they are kept here: the genesis state never changes.
//From a node's /utxo/genesis, in its order: the emission contract, the no-premine proof (1 ERG under
//sigmaProp(false); its registers hold launch-day Bitcoin and Ethereum block hashes and newspaper
//headlines) and the foundation treasury. Who spent them comes from the raw blocks 1 and 3850.
//The boxes carry no index: the node gives all three index 0, and "#0" three times would mislead.
const GENESIS_TX_JSON = '{"id":"0000000000000000000000000000000000000000000000000000000000000000","inclusionHeight":0,"timestamp":0,"inputs":[],"dataInputs":[],"outputs":[{"boxId":"b69575e11c5c43400bfead5976ee0d6245a1168396b2e2a4f384691f275d501c","transactionId":"0000000000000000000000000000000000000000000000000000000000000000","value":93409132500000000,"creationHeight":0,"settlementHeight":0,"ergoTree":"101004020e36100204a00b08cd0279be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798ea02d192a39a8cc7a7017300730110010204020404040004c0fd4f05808c82f5f6030580b8c9e5ae040580f882ad16040204c0944004c0f407040004000580f882ad16d19683030191a38cc7a7019683020193c2b2a57300007473017302830108cdeeac93a38cc7b2a573030001978302019683040193b1a5730493c2a7c2b2a573050093958fa3730673079973089c73097e9a730a9d99a3730b730c0599c1a7c1b2a5730d00938cc7b2a5730e0001a390c1a7730f","address":"2Z4YBkDsDvQj8BX7xiySFewjitqp2ge9c99jfes2whbtKitZTxdBYqbrVZUvZvKv6aqn9by4kp3LE1c26LCyosFnVnm6b6U1JYvWpYmL2ZnixJbXLjWAWuBThV1D6dLpqZJYQHYDznJCk49g5TUiS4q8khpag2aNmHwREV7JSsypHdHLgJT7MGaw51aJfNubyzSKxZ4AJXFS27EfXwyCLzW1K6GVqwkJtCoPvrcLqmqwacAWJPkmh78nke9H4oT88XmSbRt2n9aWZjosiZCafZ4osUDxmZcc5QVEeTWn8drSraY3eFKe8Mu9MSCcVU","assets":[],"additionalRegisters":{},"spentTransactionId":"4c6282be413c6e300a530618b37790be5f286ded758accc2aebd41554a1be308"},{"boxId":"b8ce8cfe331e5eadfb0783bdc375c94413433f65e1e45857d71550d42e4d83bd","transactionId":"0000000000000000000000000000000000000000000000000000000000000000","value":1000000000,"creationHeight":0,"settlementHeight":0,"ergoTree":"10010100d17300","address":"4MQyMKvMbnCJG3aJ","assets":[],"additionalRegisters":{"R4":"0e4030303030303030303030303030303030303031346332653265376533336435316165376536366636636362363934326333343337313237623336633333373437","R5":"0e42307864303761393732393334363864393133326335613261646162326535326132333030396536373938363038653437623064323632336337653365393233343633","R6":"0e464272657869743a20626f746820546f727920736964657320706c617920646f776e207269736b206f66206e6f2d6465616c20616674657220627573696e65737320616c61726d","R7":"0e54e8bfb0e8af84efbc9ae5b9b3e8a1a1e38081e68c81e7bbade38081e58c85e5aeb9e28094e28094e696b0e697b6e4bba3e5ba94e5afb9e585a8e79083e58c96e68c91e68898e79a84e4b8ade59bbde4b98be98193","R8":"0e45d094d0b8d0b2d0b8d0b4d0b5d0bdd0b4d18b20d0a7d0a2d09fd09720d0b2d18bd180d0b0d181d182d183d18220d0bdd0b02033332520d0bdd0b020d0b0d0bad186d0b8d18e"},"spentTransactionId":null},{"boxId":"5527430474b673e4aafb08e0079c639de23e6a17e87edd00f78662b43c88aeda","transactionId":"0000000000000000000000000000000000000000000000000000000000000000","value":4330791500000000,"creationHeight":0,"settlementHeight":0,"ergoTree":"100e040004c094400580809cde91e7b0010580acc7f03704be944004808948058080c7b7e4992c0580b4c4c32104fe884804c0fd4f0580bcc1960b04befd4f05000400ea03d192c1b2a5730000958fa373019a73029c73037e997304a305958fa373059a73069c73077e997308a305958fa373099c730a7e99730ba305730cd193c2a7c2b2a5730d00d5040800","address":"4L1ktFSzm3SH1UioDuUf5hyaraHird4D2dEACwQ1qHGjSKtA6KaNvSzRCZXZGf9jkfNAEC1SrYaZmCuvb2BKiXk5zW9xuvrXFT7FdNe2KqbymiZvo5UQLAm5jQY8ZBRhTZ4AFtZa1UF5nd4aofwPiL7YkJuyiL5hDHMZL1ZnyL746tHmRYMjAhCgE7d698dRhkdSeVy","assets":[],"additionalRegisters":{"R4":"0e6f98040483030808cd039bb5fe52359a64c99a60fd944fc5e388cbdc4d37ff091cc841c3ee79060b864708cd031fb52cf6e805f80d97cde289f4f757d49accf0c83fb864b27d2cf982c37f9a8b08cd0352ac2a471339b0d23b3d2c5ce0db0e81c969f77891b9edf0bda7fd39a78184e7"},"spentTransactionId":"e179f12156061c04d375f599bd8aea7ea5e704fab2d95300efb2d87460d60b83"}]}';

//A fresh copy, as the pages edit what they print; null on testnet, whose genesis boxes differ
function getGenesisTx() {
	if (networkType == 'testnet') {
		return null;
	}

	return JSONbig.parse(GENESIS_TX_JSON);
}

function getGenesisBox(boxId) {
	const tx = getGenesisTx();

	return tx ? tx.outputs.find(box => box.boxId === boxId) || null : null;
}

//A tx that spent genesis boxes comes from the explorers without them as inputs: put them back,
//shaped like the inputs the explorer returns (created by a tx, no spent status of their own)
function withGenesisInputs(tx) {
	const genesisTx = getGenesisTx();

	if (!genesisTx || !tx || (tx.inputs && tx.inputs.length > 0)) {
		return tx;
	}

	const spent = genesisTx.outputs.filter(box => box.spentTransactionId === tx.id);

	if (spent.length > 0) {
		tx.inputs = spent.map(box => {
			delete box.spentTransactionId;
			box.outputTransactionId = GENESIS_TX_ID;

			return box;
		});
	}

	return tx;
}
