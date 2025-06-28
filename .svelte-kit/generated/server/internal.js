
import root from '../root.js';
import { set_building, set_prerendering } from '__sveltekit/environment';
import { set_assets } from '__sveltekit/paths';
import { set_manifest, set_read_implementation } from '__sveltekit/server';
import { set_private_env, set_public_env, set_safe_public_env } from '../../../node_modules/.pnpm/@sveltejs+kit@2.22.2_@sveltejs+vite-plugin-svelte@5.1.0_svelte@5.34.8_vite@6.3.5_sass@1_7cb0a59824696aedde39a1c039fff5f5/node_modules/@sveltejs/kit/src/runtime/shared-server.js';

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
		app: ({ head, body, assets, nonce, env }) => "<!doctype html>\n<html\n  id=\"index\"\n  class=\"no-js\"\n  data-bs-theme=\"light\"\n  lang=\"en\"\n  data-sveltekit-preload-data=\"hover\"\n>\n  <head>\n    <meta charset=\"utf-8\" />\n    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1\" />\n    <link rel=\"icon\" type=\"image/png\" href=\"" + assets + "/favicon.png\" />\n    <link\n      rel=\"apple-touch-icon\"\n      type=\"image/png\"\n      href=\"" + assets + "/apple-touch-icon.png\"\n    />\n\n    <!-- Bootstrap 5 CSS -->\n    <link\n      href=\"https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css\"\n      rel=\"stylesheet\"\n      integrity=\"sha384-9ndCyUaIbzAi2FUVXJi0CjmCapSmO7SnpJef0486qhLnuZ2cdeRhO02iuK6FUUVM\"\n      crossorigin=\"anonymous\"\n    />\n\n    <!-- Additional theme file -->\n    <link\n      id=\"additionalTheme\"\n      href=\"\"\n      rel=\"stylesheet\"\n      media=\"(prefers-color-scheme: dark)\"\n    />\n\n    <!-- Font Awesome CSS -->\n    <link\n      rel=\"stylesheet\"\n      href=\"https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css\"\n    />\n    <link\n      rel=\"stylesheet\"\n      href=\"https://cdnjs.cloudflare.com/ajax/libs/animate.css/4.1.1/animate.min.css\"\n    />\n\n    " + head + "\n  </head>\n  <body data-sveltekit-preload-data=\"hover\">\n    <div style=\"display: contents\">" + body + "</div>\n\n    <!-- Bootstrap Toast Containers -->\n    <div class=\"toast-container position-fixed bottom-0 end-0 p-3\">\n      <div\n        id=\"customToast\"\n        data-bs-config='{\"autohide\":false}'\n        class=\"toast\"\n        role=\"alert\"\n        aria-live=\"assertive\"\n        aria-atomic=\"true\"\n      >\n        <div id=\"customToastBody\" class=\"toast-body\"></div>\n      </div>\n    </div>\n\n    <div class=\"toast-container position-fixed bottom-0 end-0 p-3\">\n      <div\n        id=\"liveToast\"\n        class=\"toast\"\n        role=\"alert\"\n        aria-live=\"assertive\"\n        aria-atomic=\"true\"\n      >\n        <div id=\"toastBody\" class=\"toast-body\">Copied to clipboard!</div>\n      </div>\n    </div>\n\n    <div class=\"toast-container position-fixed bottom-0 end-0 p-3\">\n      <div\n        id=\"notificationToast\"\n        data-bs-config='{\"autohide\":false}'\n        class=\"toast\"\n        role=\"alert\"\n        aria-live=\"assertive\"\n        aria-atomic=\"true\"\n      >\n        <div\n          id=\"notificationToastBody\"\n          class=\"toast-body d-flex align-items-end\"\n        >\n          <p id=\"notificationToastText\">\n            Transaction pending. Do you want to get notified when it confirms?\n          </p>\n          <br />\n          <button\n            class=\"btn btn-primary m-1 end-0\"\n            onclick=\"onNotificationToastNo()\"\n          >\n            No\n          </button>\n          <button\n            class=\"btn btn-info m-1 end-0\"\n            onclick=\"onNotificationToastYes()\"\n          >\n            Yes\n          </button>\n        </div>\n      </div>\n    </div>\n\n    <!-- External Scripts -->\n    <script\n      src=\"https://code.jquery.com/jquery-3.6.4.min.js\"\n      integrity=\"sha256-oP6HI9z1XaZNBrJURtCoUT5SUnxFr8s3BzRl+cbzUq8=\"\n      crossorigin=\"anonymous\"\n    ></script>\n    <script\n      src=\"https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js\"\n      integrity=\"sha384-geWF76RCwLtnZ8qwWowPQNguL3RmwHVBC9FhGdlKrxdiJJigb/j/68SIy3Te4Bkz\"\n      crossorigin=\"anonymous\"\n    ></script>\n    <script src=\"https://cdn.jsdelivr.net/npm/json-bigint-parser-browser@1.0.4/json-bigint-browser.min.js\"></script>\n    <script src=\"/scripts/common/config.js\"></script>\n    <script src=\"/scripts/main.js\"></script>\n  </body>\n</html>\n",
		error: ({ status, message }) => "<!doctype html>\n<html lang=\"en\">\n\t<head>\n\t\t<meta charset=\"utf-8\" />\n\t\t<title>" + message + "</title>\n\n\t\t<style>\n\t\t\tbody {\n\t\t\t\t--bg: white;\n\t\t\t\t--fg: #222;\n\t\t\t\t--divider: #ccc;\n\t\t\t\tbackground: var(--bg);\n\t\t\t\tcolor: var(--fg);\n\t\t\t\tfont-family:\n\t\t\t\t\tsystem-ui,\n\t\t\t\t\t-apple-system,\n\t\t\t\t\tBlinkMacSystemFont,\n\t\t\t\t\t'Segoe UI',\n\t\t\t\t\tRoboto,\n\t\t\t\t\tOxygen,\n\t\t\t\t\tUbuntu,\n\t\t\t\t\tCantarell,\n\t\t\t\t\t'Open Sans',\n\t\t\t\t\t'Helvetica Neue',\n\t\t\t\t\tsans-serif;\n\t\t\t\tdisplay: flex;\n\t\t\t\talign-items: center;\n\t\t\t\tjustify-content: center;\n\t\t\t\theight: 100vh;\n\t\t\t\tmargin: 0;\n\t\t\t}\n\n\t\t\t.error {\n\t\t\t\tdisplay: flex;\n\t\t\t\talign-items: center;\n\t\t\t\tmax-width: 32rem;\n\t\t\t\tmargin: 0 1rem;\n\t\t\t}\n\n\t\t\t.status {\n\t\t\t\tfont-weight: 200;\n\t\t\t\tfont-size: 3rem;\n\t\t\t\tline-height: 1;\n\t\t\t\tposition: relative;\n\t\t\t\ttop: -0.05rem;\n\t\t\t}\n\n\t\t\t.message {\n\t\t\t\tborder-left: 1px solid var(--divider);\n\t\t\t\tpadding: 0 0 0 1rem;\n\t\t\t\tmargin: 0 0 0 1rem;\n\t\t\t\tmin-height: 2.5rem;\n\t\t\t\tdisplay: flex;\n\t\t\t\talign-items: center;\n\t\t\t}\n\n\t\t\t.message h1 {\n\t\t\t\tfont-weight: 400;\n\t\t\t\tfont-size: 1em;\n\t\t\t\tmargin: 0;\n\t\t\t}\n\n\t\t\t@media (prefers-color-scheme: dark) {\n\t\t\t\tbody {\n\t\t\t\t\t--bg: #222;\n\t\t\t\t\t--fg: #ddd;\n\t\t\t\t\t--divider: #666;\n\t\t\t\t}\n\t\t\t}\n\t\t</style>\n\t</head>\n\t<body>\n\t\t<div class=\"error\">\n\t\t\t<span class=\"status\">" + status + "</span>\n\t\t\t<div class=\"message\">\n\t\t\t\t<h1>" + message + "</h1>\n\t\t\t</div>\n\t\t</div>\n\t</body>\n</html>\n"
	},
	version_hash: "1pss1sj"
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
