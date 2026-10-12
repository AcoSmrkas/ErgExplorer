import { CRUX_TEMPLATES, DUCKPOOLS_TEMPLATES, EPERPS_TEMPLATES, ERGO_MIXER_TEMPLATES, ERGONAMES_TEMPLATES, ERGOPAD_STAKING_TEMPLATES, ERGORAFFLE_TEMPLATES, LITHOS_LOCK_TEMPLATES, LITHOS_POOL_TEMPLATES, LITHOS_TEMPLATES, ORACLE_POOL_V2_TEMPLATES, PAIDEIA_TEMPLATES, ROSEN_TEMPLATES, THE_FIELD_TEMPLATES, SPECTRUM_TEMPLATES, SWAP_TEMPLATES } from './constants.js?v=3';

// The name each known contract shows under: [protocol, templates by role, name by role, roles
// whose entries are exact trees rather than templates]. Addresses are labelled with these names
// and the address book searches them, so a contract named here shows up in both.
const CONTRACT_NAME_GROUPS = [
	['Spectrum Finance', SWAP_TEMPLATES, {
		N2T_SELL_ERG: 'Spectrum Finance N2T Swap',
		N2T_SELL_SPF: 'Spectrum Finance N2T Swap',
		N2T_BUY_ERG: 'Spectrum Finance N2T Swap',
		N2T_BUY_SPF: 'Spectrum Finance N2T Swap',
		T2T_SWAP_ERG: 'Spectrum Finance T2T Swap',
		T2T_SWAP_SPF: 'Spectrum Finance T2T Swap',
		N2T_SWAP_ALT_1: 'Spectrum Finance N2T Swap',
		N2T_SWAP_ALT_2: 'Spectrum Finance N2T Swap'
	}],
	['Spectrum Finance', SPECTRUM_TEMPLATES, {
		LP_DEPOSIT: 'Spectrum Finance LP Deposit',
		LP_REDEEM: 'Spectrum Finance LP Redeem',
		YF_DEPOSIT: 'Spectrum Finance YF Deposit',
		YF_REDEEM: 'Spectrum Finance YF Redeem'
	}],
	['Crux Finance', CRUX_TEMPLATES, {
		LIMIT_ORDER: 'Crux Finance Limit Order',
		LIMIT_ORDER_PART: 'Crux Finance Limit Order',
		LIQUIDITY_POSITION: 'Crux Finance Liquidity Position'
	}],
	['Lithos', LITHOS_TEMPLATES, {
		SWAP_SELL: 'Lithos LP Swap',
		SWAP_BUY: 'Lithos LP Swap',
		LP_DEPOSIT: 'Lithos LP Deposit',
		LP_REDEEM: 'Lithos LP Redeem',
		POOL: 'Lithos Liquidity Pool'
	}],
	['ErgoRaffle', ERGORAFFLE_TEMPLATES, {
		SERVICE: 'ErgoRaffle Service',
		CREATE_PROXY: 'ErgoRaffle Raffle Creation',
		RAFFLE_SETUP: 'ErgoRaffle Raffle Setup',
		RAFFLE_TOKENS: 'ErgoRaffle Raffle Setup',
		ACTIVE: 'ErgoRaffle Active Raffle',
		TICKET_PROXY: 'ErgoRaffle Ticket Purchase',
		TICKET: 'ErgoRaffle Ticket',
		WINNER: 'ErgoRaffle Winner Prize',
		REFUND: 'ErgoRaffle Refund'
	}],
	['Oracle Pool v2', ORACLE_POOL_V2_TEMPLATES, {
		POOL: 'Oracle Pool v2',
		DATAPOINT: 'Oracle Pool v2 Datapoint',
		REFRESH: 'Oracle Pool v2 Refresh',
		COMPANION: 'Oracle Pool v2 Companion',
		BUYBACK: 'Oracle Pool v2 Buyback'
	}],
	['Rosen Bridge', ROSEN_TEMPLATES, {
		REPO: 'Rosen Bridge Watcher Repo',
		COLLATERAL: 'Rosen Bridge Watcher Collateral',
		PERMIT: 'Rosen Bridge Watcher Permit',
		COMMITMENT: 'Rosen Bridge Commitment',
		EVENT_TRIGGER: 'Rosen Bridge Event Trigger',
		REPO_CONFIG: 'Rosen Bridge Repo Config'
	}],
	['Ergo Mixer', ERGO_MIXER_TEMPLATES, {
		HALF_MIX: 'Ergo Mixer Half-Mix',
		FULL_MIX: 'Ergo Mixer Full-Mix',
		FEE: 'Ergo Mixer Fee Box',
		TOKEN_EMISSION: 'Ergo Mixer Token Emission'
	}],
	['ErgoPad', ERGOPAD_STAKING_TEMPLATES, {
		STATE: 'ErgoPad Staking State',
		STAKE: 'ErgoPad Stake',
		POOL: 'ErgoPad Staking Pool',
		EMISSION: 'ErgoPad Staking Emission',
		INCENTIVE: 'ErgoPad Staking Incentive',
		REQUEST: 'ErgoPad Staking Request'
	}],
	['Lithos', LITHOS_LOCK_TEMPLATES, {
		CAMPAIGN: 'Lithos Lock Campaign'
	}],
	['Lithos', LITHOS_POOL_TEMPLATES, {
		EMISSION: 'Lithos Emission',
		CONFIG: 'Lithos Emission Config',
		QUEUE: 'Lithos Collateral Queue',
		COLLATERAL: 'Lithos Collateral',
		MINER_DICTIONARY: 'Lithos Miner Dictionary',
		MINER_DATA: 'Lithos Miner Registration',
		FP_CONTROL: 'Lithos Fraud Proof Registry',
		HOLDING: 'Lithos Rollup Holding',
		EVALUATION: 'Lithos Rollup Evaluation',
		PAYOUT: 'Lithos Rollup Payout'
	}, ['QUEUE']],
	['Paideia', PAIDEIA_TEMPLATES, {
		STAKE_STATE: 'Paideia Stake State',
		STAKING: 'Paideia Staking',
		PROPOSAL: 'Paideia Proposal',
		TREASURY: 'Paideia DAO Treasury',
		DAO: 'Paideia DAO',
		ACTION: 'Paideia DAO Action',
		ORIGIN: 'Paideia Origin'
	}],
	['ErgoNames', ERGONAMES_TEMPLATES, {
		MINT_REQUEST: 'ErgoNames Mint Request',
		COLLECTION: 'ErgoNames Collection',
		NAME_MINT: 'ErgoNames Name Mint',
		REGISTRY: 'ErgoNames Registry'
	}],
	['ErgoDomains', ERGONAMES_TEMPLATES, {
		ERGODOMAINS_REGISTRAR: 'ErgoDomains Registrar',
		ERGODOMAINS_DOMAIN: 'ErgoDomains Domain'
	}],
	['Duckpools', DUCKPOOLS_TEMPLATES, {
		POOL: 'Duckpools Lending Pool',
		COLLATERAL: 'Duckpools Collateral',
		REPAYMENT: 'Duckpools Repayment',
		CHILD_INTEREST: 'Duckpools Child Interest',
		INTEREST: 'Duckpools Interest',
		LEND_PROXY: 'Duckpools Lend',
		WITHDRAW_PROXY: 'Duckpools Withdraw',
		BORROW_PROXY: 'Duckpools Borrow',
		REPAY_PROXY: 'Duckpools Repay',
		PARTIAL_REPAY_PROXY: 'Duckpools Partial Repay'
	}],
	['The Field', THE_FIELD_TEMPLATES, {
		MARKET: 'The Field Market',
		COLLECTION: 'The Field Collection',
		BID_MARKET: 'The Field Bid Market',
		BID: 'The Field Bid'
	}],
	['ePerps', EPERPS_TEMPLATES, {
		RESERVE: 'ePerps Reserve',
		STAMP: 'ePerps Stamp',
		STAMPER: 'ePerps Stamper',
		LPSAT: 'ePerps LP Satellite',
		FILLSAT: 'ePerps Fill Satellite',
		RISKSAT: 'ePerps Risk Satellite',
		SWEEP: 'ePerps Sweep',
		UPDATE: 'ePerps Update',
		BALLOT: 'ePerps Ballot',
		RSV: 'ePerps RSV'
	}]
];

/**
 * Every known contract template with its name, in catalog order: { protocol, name, template, exactTree }.
 * A role holds one template or a list of builds; exactTree marks entries that are whole trees.
 */
export const CONTRACT_TEMPLATES = CONTRACT_NAME_GROUPS.flatMap(([protocol, groupTemplates, names, exactTreeRoles = []]) =>
	Object.entries(names).flatMap(([role, name]) =>
		[].concat(groupTemplates[role]).map(template => ({ protocol, name, template, exactTree: exactTreeRoles.includes(role) }))
	)
);
