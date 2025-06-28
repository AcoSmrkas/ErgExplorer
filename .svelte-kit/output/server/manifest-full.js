export const manifest = (() => {
function __memo(fn) {
	let value;
	return () => value ??= (value = fn());
}

return {
	appDir: "_app",
	appPath: "_app",
	assets: new Set(["apple-touch-icon.png","favicon.png","images/logo-new-mew.png","images/logo-new.png","images/logo-new.svg","images/logo-white.png","images/logo.png","images/nft-artcollection.png","images/nft-audio.png","images/nft-file.png","images/nft-image.png","images/nft-membership.png","images/nft-video.png","images/overlay.png","images/overlay2.png","images/overlay3.png","images/overlay4.png","images/overlay5.png","images/promo/1.png","images/promo/2.png","images/promo/3.png","images/promo/4.png","images/sigsmining.png","images/tokens/OINK.png","images/tokens/ba553573f83c61be880d79db0f4068177fa75ab7c250ce3543f7e7aeb471a9d2.png","images/tokens/bober.png","images/tokens/buns.png","images/tokens/coal.png","images/tokens/cock.png","images/tokens/comet.png","images/tokens/degenpad.png","images/tokens/dexy.jpg","images/tokens/dude.png","images/tokens/ergod.png","images/tokens/ergone.png","images/tokens/gau.svg","images/tokens/gauc.svg","images/tokens/gcx.png","images/tokens/glizzy.png","images/tokens/heisenberg.png","images/tokens/hodlcomet10.svg","images/tokens/ketchup.png","images/tokens/mew.png","images/tokens/mustard.png","images/tokens/peperg.png","images/tokens/php.png","images/tokens/rugged.png","images/tokens/santakey.png","images/tokens/walrus.png","scripts/common/config.js","scripts/main.js","styles/vars.css"]),
	mimeTypes: {".png":"image/png",".svg":"image/svg+xml",".jpg":"image/jpeg",".js":"text/javascript",".css":"text/css"},
	_: {
		client: {start:"_app/immutable/entry/start.C2c9BQHT.js",app:"_app/immutable/entry/app.hFBm94TQ.js",imports:["_app/immutable/entry/start.C2c9BQHT.js","_app/immutable/chunks/CsHtTPAc.js","_app/immutable/chunks/8EXi_IcN.js","_app/immutable/chunks/vtbjsDUp.js","_app/immutable/entry/app.hFBm94TQ.js","_app/immutable/chunks/Dp1pzeXC.js","_app/immutable/chunks/vtbjsDUp.js","_app/immutable/chunks/CWj6FrbW.js","_app/immutable/chunks/8EXi_IcN.js","_app/immutable/chunks/BAWoiVl9.js","_app/immutable/chunks/BalMBFWy.js","_app/immutable/chunks/D_WCn4JD.js"],stylesheets:[],fonts:[],uses_env_dynamic_public:false},
		nodes: [
			__memo(() => import('./nodes/0.js')),
			__memo(() => import('./nodes/1.js')),
			__memo(() => import('./nodes/2.js')),
			__memo(() => import('./nodes/3.js')),
			__memo(() => import('./nodes/4.js')),
			__memo(() => import('./nodes/5.js')),
			__memo(() => import('./nodes/6.js')),
			__memo(() => import('./nodes/7.js')),
			__memo(() => import('./nodes/8.js')),
			__memo(() => import('./nodes/9.js')),
			__memo(() => import('./nodes/10.js')),
			__memo(() => import('./nodes/11.js'))
		],
		routes: [
			{
				id: "/",
				pattern: /^\/$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 2 },
				endpoint: null
			},
			{
				id: "/about",
				pattern: /^\/about\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 3 },
				endpoint: null
			},
			{
				id: "/addressbook",
				pattern: /^\/addressbook\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 4 },
				endpoint: null
			},
			{
				id: "/addresses/[address]",
				pattern: /^\/addresses\/([^/]+?)\/?$/,
				params: [{"name":"address","optional":false,"rest":false,"chained":false}],
				page: { layouts: [0,], errors: [1,], leaf: 5 },
				endpoint: null
			},
			{
				id: "/blocks/[id]",
				pattern: /^\/blocks\/([^/]+?)\/?$/,
				params: [{"name":"id","optional":false,"rest":false,"chained":false}],
				page: { layouts: [0,], errors: [1,], leaf: 6 },
				endpoint: null
			},
			{
				id: "/issued-tokens",
				pattern: /^\/issued-tokens\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 7 },
				endpoint: null
			},
			{
				id: "/latest-blocks",
				pattern: /^\/latest-blocks\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 8 },
				endpoint: null
			},
			{
				id: "/mempool",
				pattern: /^\/mempool\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 9 },
				endpoint: null
			},
			{
				id: "/tokens/[tokenId]",
				pattern: /^\/tokens\/([^/]+?)\/?$/,
				params: [{"name":"tokenId","optional":false,"rest":false,"chained":false}],
				page: { layouts: [0,], errors: [1,], leaf: 10 },
				endpoint: null
			},
			{
				id: "/transactions/[txId]",
				pattern: /^\/transactions\/([^/]+?)\/?$/,
				params: [{"name":"txId","optional":false,"rest":false,"chained":false}],
				page: { layouts: [0,], errors: [1,], leaf: 11 },
				endpoint: null
			}
		],
		prerendered_routes: new Set([]),
		matchers: async () => {
			
			return {  };
		},
		server_assets: {}
	}
}
})();
