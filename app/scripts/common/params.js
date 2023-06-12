var params = [];

$(function() {
	readParams();
});

function readParams() {
	let hash = window.location.hash;

	if (hash == '') {
		return;
	}

	hash = hash.substring(1);
	let temp = hash.split('&');

	for (let i = 0; i < temp.length; i++) {
		let param = temp[i].split('=');

		if (param[1] == undefined) {
			param[1] = param[0];
		}

		params[param[0]] = param[1];
	}

	getUrlWithParams();
}

function getUrlWithParams(page, includeId = true) {
	let separator = (IS_DEV_ENVIRONMENT) ? '#' : '/';
	let address = '/' + page + separator;

	Object.keys(params).forEach((param) => {
    	if (params[param] == param) {
    		if (includeId) {
	    		address += param + '&';
	    	}
    	
    		return;
    	}

    	address += param + '=' + params[param] + '&';
	});

	if (address.substring(address.length - 1) == '&') {
		address = address.substring(0, address.length - 1);
	}

	return address;
}

function getCurrentUrlWithParams() {
	return getUrlWithParams(window.location.pathname.substring(1));
}
