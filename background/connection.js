const connect = () => {
	const createConnection = cookie => {
		console.debug('Trying to connection with authcookie', cookie);

		if (window.ws) window.ws.close();
		window.ws = new WebSocket(`wss://vrchat.com/?authToken=${cookie}`);
		

		window.ws.addEventListener('open', e => {
			console.debug('Connection Established');
		});

		window.ws.addEventListener('error', e => {
			console.info('Connection Closed with error', e);
			setTimeout(connect, 10000);
		});

		window.ws.addEventListener('close', e => {
			console.info('Connection Closed', e.code);
			setTimeout(connect, 10000);
		});

		window.ws.addEventListener('message', m => {
			try {
				const resp = JSON.parse(m.data);

				if (resp.type !== 'user-location')
					return;

				try {
					const content = JSON.parse(resp.content);
					const instanceHistory = JSON.parse(
						localStorage.getItem('instanceHistory') || '[]'
					);

					if (content.location == instanceHistory[instanceHistory.length-1]?.location) {
						console.warn('dup');
						return;
					}

					instanceHistory.push({
						datetime: new Date(),
						content: content,
					});

					console.debug('Save visit', content);
					localStorage.setItem('instanceHistory', JSON.stringify(instanceHistory));
				} catch (e) {
					console.info('Failed to parse content', e, resp.content);
				}
			} catch (e) {
				console.info('Failed to parse message', e, m.data);
			}
		});
	};

	console.debug('Trying to get authcookie');

	if (typeof browser === 'undefined') {
		chrome.cookies.get({url: 'https://vrchat.com/', name: 'auth'}, c => {
			if (c == null) {
				console.debug('Failed to get authcookie');
				setTimeout(connect, 1000);
				return;
			}

			createConnection(c.value);
		});
	} else {
		browser.cookies.get({
			url: 'https://vrchat.com/',
			name: 'auth'
		}).then((c) => {
			createConnection(c.value);
		}).catch(() => {
			console.debug('Failed to get authcookie');
			setTimeout(connect, 1000);
		});
	}
};

connect();

