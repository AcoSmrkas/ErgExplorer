var params = [];

readParams();

function readParams() {
	let raw;

	if (IS_DEV_ENVIRONMENT) {
		const hash = window.location.hash;
		if (hash == '') return;
		raw = hash.substring(1);
	} else {
		const parts = window.location.pathname.split('/');
		if (parts.length >= 3 && parts[2] !== '') {
			raw = parts[2];
		} else {
			const hash = window.location.hash;
			if (hash == '') return;
			raw = hash.substring(1);
		}
	}

	let temp = raw.split('&');

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
	const pageName = (page || '').split('/')[0];
	let separator = (IS_DEV_ENVIRONMENT) ? '#' : '/';
	let address = '/' + pageName + separator;

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
	return getUrlWithParams(window.location.pathname.split('/')[1]);
}
