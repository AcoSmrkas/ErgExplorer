const LP_TOKEN_IDS = [
	'804a66426283b8281240df8f9de783651986f20ad6391a71b26b9e7d6faad099',
	'cf74432b2d3ab8a1a934b6326a1004e1a19aec7b357c57209018c4aa35226246',
	'1c51c3a53abfe87e6db9a03c649e8360f255ffc4bd34303d30fc7db23ae551db',
	'e0588d273c8183865cff31b3bfa766bc7b178e2362b45497b67e79662e3615b7',
	'1f2d9bfbf99f6ef9b259115dfe6bc83252855e76f9b43896f53e1dc190cfa8da',
	'303f39026572bcb4060b51fafc93787a236bb243744babaa99fceb833d61e198',
	'fa6326a26334f5e933b96470b53b45083374f71912b0d7597f00c2c7ebeb5da6'
];

const LP_TOKEN_NAMES = [
	'useerglp',
	'dexylp'
];

export function isLpTokenData(tokenData) {
	const name = (tokenData && tokenData.name ? tokenData.name : '').trim();
	const tokenId = (tokenData && (tokenData.id || tokenData.tokenId) ? tokenData.id || tokenData.tokenId : '').toLowerCase();
	const normalizedName = name.toLowerCase();

	return LP_TOKEN_IDS.includes(tokenId)
		|| /(?:\sLP|_LP)(?:\sToken)?$/i.test(name)
		|| LP_TOKEN_NAMES.includes(normalizedName);
}
