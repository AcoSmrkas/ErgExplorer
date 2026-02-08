// Centralized state management for address page
export const AddressState = {
	// Address info
	walletAddress: undefined,
	publicUser: false,
	checkedUser: false,

	// Transaction data
	mempoolData: undefined,
	transactionsData: undefined,
	mempoolRequestDone: false,
	transactionsRequestDone: false,

	// Mempool management
	mempoolCount: 0,
	mempoolInterval: undefined,
	mempoolTxIds: [],
	mempoolIndexOffset: 0,
	checkMempoolChangesFn: null, // Store interval function reference

	// NFT data
	nftsCount: 0,
	issuedNftsCount: 0,
	loadingOwnedNfts: false,
	loadingIssuedNfts: false,
	ownedNftsShown: false,
	issuedNftsShown: false,

	// Tokens
	tokensArray: [],
	tokensContent: '',
	tokensContentFull: '',
	financialTokensContent: '',
	financialTokensContentFull: '',

	// Transaction display
	totalTransactions: 0,
	valueFields: [],
	valueFieldsFull: [],
	formattedResult: '',
	printed: false,
	printedAddressSummary: false,
	printedUnspentBoxes: false,

	// Unspent boxes
	unspentBoxesCount: 0,

	// Date filtering
	datePickerFrom: undefined,
	datePickerTo: undefined,
	tempDate: -1,

	// Notifications and UI state
	txNotification: undefined,
	txNotificationId: undefined,

	// Scam list
	scamList: [],

	// Request tracking
	initRequestCount: -1,
	initRequestDone: 0,

	// Data fetching flags
	getTxData: false,

	// Refresh tracking
	rfTimeout: 60000,
	rfT: null,
	firstTime: true,

	// Reset function for new address
	reset() {
		this.walletAddress = undefined;
		this.publicUser = false;
		this.checkedUser = false;
		this.mempoolData = undefined;
		this.transactionsData = undefined;
		this.mempoolRequestDone = false;
		this.transactionsRequestDone = false;
		this.mempoolCount = 0;
		this.mempoolTxIds = [];
		this.mempoolIndexOffset = 0;
		this.nftsCount = 0;
		this.issuedNftsCount = 0;
		this.loadingOwnedNfts = false;
		this.loadingIssuedNfts = false;
		this.ownedNftsShown = false;
		this.issuedNftsShown = false;
		this.tokensArray = [];
		this.tokensContent = '';
		this.tokensContentFull = '';
		this.financialTokensContent = '';
		this.financialTokensContentFull = '';
		this.totalTransactions = 0;
		this.valueFields = [];
		this.valueFieldsFull = [];
		this.printed = false;
		this.printedAddressSummary = false;
		this.printedUnspentBoxes = false;
		this.unspentBoxesCount = 0;
		this.getTxData = false;
		this.firstTime = true;
	}
};

// Filter state
export const FilterState = {
	tokenId: '',
	minValue: undefined,
	maxValue: undefined,
	fromDate: undefined,
	toDate: undefined,
	txType: 'all',

	reset() {
		this.tokenId = '';
		this.minValue = undefined;
		this.maxValue = undefined;
		this.fromDate = undefined;
		this.toDate = undefined;
		this.txType = 'all';
	}
};
