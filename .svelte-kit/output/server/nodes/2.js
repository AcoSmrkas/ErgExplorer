import * as server from '../entries/pages/_page.server.js';

export const index = 2;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/pages/_page.svelte.js')).default;
export { server };
export const server_id = "src/routes/+page.server.js";
export const imports = ["_app/immutable/nodes/2.B_6YDRL2.js","_app/immutable/chunks/S2sInG0O.js","_app/immutable/chunks/Cn9zlgVZ.js","_app/immutable/chunks/C_IP10Lp.js","_app/immutable/chunks/SlU9T8hP.js","_app/immutable/chunks/CCFFrrW_.js","_app/immutable/chunks/Cggn4XaB.js","_app/immutable/chunks/BwQ5dCay.js","_app/immutable/chunks/BrHt-gcZ.js","_app/immutable/chunks/BlKneCtq.js","_app/immutable/chunks/BfZ8fTxo.js"];
export const stylesheets = ["_app/immutable/assets/ErrorMessage.Bak-T3pH.css","_app/immutable/assets/2.A32boPdz.css"];
export const fonts = [];
