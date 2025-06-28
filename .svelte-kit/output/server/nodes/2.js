import * as universal from '../entries/pages/_page.js';
import * as server from '../entries/pages/_page.server.js';

export const index = 2;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/pages/_page.svelte.js')).default;
export { universal };
export const universal_id = "src/routes/+page.js";
export { server };
export const server_id = "src/routes/+page.server.js";
export const imports = ["_app/immutable/nodes/2.CBqeW_Gb.js","_app/immutable/chunks/CWj6FrbW.js","_app/immutable/chunks/BZa71nTc.js","_app/immutable/chunks/vtbjsDUp.js","_app/immutable/chunks/8EXi_IcN.js","_app/immutable/chunks/BAWoiVl9.js","_app/immutable/chunks/CAZTeGPc.js","_app/immutable/chunks/BoSHqhGC.js","_app/immutable/chunks/Dzt0XP9t.js","_app/immutable/chunks/Bm2DiiQN.js","_app/immutable/chunks/DW3YvBay.js","_app/immutable/chunks/D1s1Htgc.js","_app/immutable/chunks/ymnpOQdG.js","_app/immutable/chunks/BalMBFWy.js","_app/immutable/chunks/D_WCn4JD.js","_app/immutable/chunks/BXmS_AAB.js","_app/immutable/chunks/4l-65tZa.js","_app/immutable/chunks/BpnQtLrP.js","_app/immutable/chunks/4kghM2jj.js","_app/immutable/chunks/DfTnZ2rp.js"];
export const stylesheets = ["_app/immutable/assets/ErrorMessage.Bak-T3pH.css","_app/immutable/assets/DataTable.4Z3jKITt.css","_app/immutable/assets/CopyButton.C7POW3Yp.css","_app/immutable/assets/tableConfigs.D331_faH.css","_app/immutable/assets/2.DtAC_e4i.css"];
export const fonts = [];
