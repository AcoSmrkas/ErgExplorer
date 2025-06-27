
import root from '../root.js';
import { set_building, set_prerendering } from '__sveltekit/environment';
import { set_assets } from '__sveltekit/paths';
import { set_manifest, set_read_implementation } from '__sveltekit/server';
import { set_private_env, set_public_env, set_safe_public_env } from '../../../node_modules/@sveltejs/kit/src/runtime/shared-server.js';

export const options = {
	app_template_contains_nonce: false,
	csp: {"mode":"auto","directives":{"upgrade-insecure-requests":false,"block-all-mixed-content":false},"reportOnly":{"upgrade-insecure-requests":false,"block-all-mixed-content":false}},
	csrf_check_origin: true,
	embedded: false,
	env_public_prefix: 'PUBLIC_',
	env_private_prefix: '',
	hash_routing: false,
	hooks: null, // added lazily, via `get_hooks`
	preload_strategy: "modulepreload",
	root,
	service_worker: false,
	templates: {
		app: ({ head, body, assets, nonce, env }) => "<!doctype html>\n<html id=\"index\" class=\"no-js\" data-bs-theme=\"light\" lang=\"en\" data-sveltekit-preload-data=\"hover\">\n\t<head>\n\t\t<meta charset=\"utf-8\">\n\t\t<meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">\n\t\t<link rel=\"icon\" type=\"image/png\" href=\"" + assets + "/favicon.png\">\n\t\t<link rel=\"apple-touch-icon\" type=\"image/png\" href=\"" + assets + "/apple-touch-icon.png\">\n\t\t\n\t\t<!-- Bootstrap 5 CSS -->\n\t\t<link href=\"https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css\" rel=\"stylesheet\" integrity=\"sha384-9ndCyUaIbzAi2FUVXJi0CjmCapSmO7SnpJef0486qhLnuZ2cdeRhO02iuK6FUUVM\" crossorigin=\"anonymous\">\n\t\t\n\t\t<!-- Additional theme file -->\n\t\t<link id=\"additionalTheme\" href=\"\" rel=\"stylesheet\" media=\"(prefers-color-scheme: dark)\">\n\t\t\n\t\t<!-- Font Awesome CSS -->\n\t\t<link rel=\"stylesheet\" href=\"https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css\">\n\t\t<link rel=\"stylesheet\" href=\"https://cdnjs.cloudflare.com/ajax/libs/animate.css/4.1.1/animate.min.css\">\n\t\t\n\t\t" + head + "\n\t</head>\n\t<body data-sveltekit-preload-data=\"hover\">\n\t\t<div style=\"display: contents\">" + body + "</div>\n\t\t\n\t\t<!-- Bootstrap Toast Containers -->\n\t\t<div class=\"toast-container position-fixed bottom-0 end-0 p-3\">\n\t\t\t<div id=\"customToast\" data-bs-config='{\"autohide\":false}' class=\"toast\" role=\"alert\" aria-live=\"assertive\" aria-atomic=\"true\">\n\t\t\t\t<div id=\"customToastBody\" class=\"toast-body\"></div>\n\t\t\t</div>\n\t\t</div>\n\t\t\n\t\t<div class=\"toast-container position-fixed bottom-0 end-0 p-3\">\n\t\t\t<div id=\"liveToast\" class=\"toast\" role=\"alert\" aria-live=\"assertive\" aria-atomic=\"true\">\n\t\t\t\t<div id=\"toastBody\" class=\"toast-body\">\n\t\t\t\t\tCopied to clipboard!\n\t\t\t\t</div>\n\t\t\t</div>\n\t\t</div>\n\t\t\n\t\t<div class=\"toast-container position-fixed bottom-0 end-0 p-3\">\n\t\t\t<div id=\"notificationToast\" data-bs-config='{\"autohide\":false}' class=\"toast\" role=\"alert\" aria-live=\"assertive\" aria-atomic=\"true\">\n\t\t\t\t<div id=\"notificationToastBody\" class=\"toast-body d-flex align-items-end\">\n\t\t\t\t\t<p id=\"notificationToastText\">Transaction pending. Do you want to get notified when it confirms?</p>\n\t\t\t\t\t<br>\n\t\t\t\t\t<button class=\"btn btn-primary m-1 end-0\" onclick=\"onNotificationToastNo()\">No</button> \n\t\t\t\t\t<button class=\"btn btn-info m-1 end-0\" onclick=\"onNotificationToastYes()\">Yes</button>\n\t\t\t\t</div>\n\t\t\t</div>\n\t\t</div>\n\n\t\t<!-- External Scripts -->\n\t\t<script src=\"https://code.jquery.com/jquery-3.6.4.min.js\" integrity=\"sha256-oP6HI9z1XaZNBrJURtCoUT5SUnxFr8s3BzRl+cbzUq8=\" crossorigin=\"anonymous\"></script>\n\t\t<script src=\"https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js\" integrity=\"sha384-geWF76RCwLtnZ8qwWowPQNguL3RmwHVBC9FhGdlKrxdiJJigb/j/68SIy3Te4Bkz\" crossorigin=\"anonymous\"></script>\n\t\t<script src=\"https://cdn.jsdelivr.net/npm/json-bigint-parser-browser@1.0.4/json-bigint-browser.min.js\"></script>\n\t\t<script src=\"/scripts/common/config.js\"></script>\n\t\t<script src=\"/scripts/main.js\"></script>\n\t</body>\n</html>",
		error: ({ status, message }) => "<!doctype html>\n<html lang=\"en\">\n\t<head>\n\t\t<meta charset=\"utf-8\" />\n\t\t<title>" + message + "</title>\n\n\t\t<style>\n\t\t\tbody {\n\t\t\t\t--bg: white;\n\t\t\t\t--fg: #222;\n\t\t\t\t--divider: #ccc;\n\t\t\t\tbackground: var(--bg);\n\t\t\t\tcolor: var(--fg);\n\t\t\t\tfont-family:\n\t\t\t\t\tsystem-ui,\n\t\t\t\t\t-apple-system,\n\t\t\t\t\tBlinkMacSystemFont,\n\t\t\t\t\t'Segoe UI',\n\t\t\t\t\tRoboto,\n\t\t\t\t\tOxygen,\n\t\t\t\t\tUbuntu,\n\t\t\t\t\tCantarell,\n\t\t\t\t\t'Open Sans',\n\t\t\t\t\t'Helvetica Neue',\n\t\t\t\t\tsans-serif;\n\t\t\t\tdisplay: flex;\n\t\t\t\talign-items: center;\n\t\t\t\tjustify-content: center;\n\t\t\t\theight: 100vh;\n\t\t\t\tmargin: 0;\n\t\t\t}\n\n\t\t\t.error {\n\t\t\t\tdisplay: flex;\n\t\t\t\talign-items: center;\n\t\t\t\tmax-width: 32rem;\n\t\t\t\tmargin: 0 1rem;\n\t\t\t}\n\n\t\t\t.status {\n\t\t\t\tfont-weight: 200;\n\t\t\t\tfont-size: 3rem;\n\t\t\t\tline-height: 1;\n\t\t\t\tposition: relative;\n\t\t\t\ttop: -0.05rem;\n\t\t\t}\n\n\t\t\t.message {\n\t\t\t\tborder-left: 1px solid var(--divider);\n\t\t\t\tpadding: 0 0 0 1rem;\n\t\t\t\tmargin: 0 0 0 1rem;\n\t\t\t\tmin-height: 2.5rem;\n\t\t\t\tdisplay: flex;\n\t\t\t\talign-items: center;\n\t\t\t}\n\n\t\t\t.message h1 {\n\t\t\t\tfont-weight: 400;\n\t\t\t\tfont-size: 1em;\n\t\t\t\tmargin: 0;\n\t\t\t}\n\n\t\t\t@media (prefers-color-scheme: dark) {\n\t\t\t\tbody {\n\t\t\t\t\t--bg: #222;\n\t\t\t\t\t--fg: #ddd;\n\t\t\t\t\t--divider: #666;\n\t\t\t\t}\n\t\t\t}\n\t\t</style>\n\t</head>\n\t<body>\n\t\t<div class=\"error\">\n\t\t\t<span class=\"status\">" + status + "</span>\n\t\t\t<div class=\"message\">\n\t\t\t\t<h1>" + message + "</h1>\n\t\t\t</div>\n\t\t</div>\n\t</body>\n</html>\n"
	},
	version_hash: "1o1ubci"
};

export async function get_hooks() {
	let handle;
	let handleFetch;
	let handleError;
	let init;
	

	let reroute;
	let transport;
	

	return {
		handle,
		handleFetch,
		handleError,
		init,
		reroute,
		transport
	};
}

export { set_assets, set_building, set_manifest, set_prerendering, set_private_env, set_public_env, set_read_implementation, set_safe_public_env };
