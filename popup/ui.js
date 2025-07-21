const updateStatusIndicator = () => {
	const status = document.getElementById('status');

	if ((typeof browser === 'undefined' ? chrome : browser).extension.getBackgroundPage().ws?.readyState === 1) {
		status.classList.add('active');
	} else {
		status.classList.remove('active');
	}
};

updateStatusIndicator();
setInterval(updateStatusIndicator, 250);

const parseStore = store => {
	const resp = store.content;
	const visit = {};

	visit.datetime = new Date(store.datetime).toISOString().slice(0, -5).replace('T', ' ').replaceAll('-', '/');
	visit.detailLink = `https://vrchat.com/home/launch?worldId=${resp.travelingToLocation.split(":")[0]}&instanceId=${resp.travelingToLocation.split(":")[1]}`;
	visit.launchLink = `vrchat://launch?id=${resp.travelingToLocation}`;
	visit.invitemeLink = `https://vrchat.com/api/1/instances/${resp.travelingToLocation}/invite?apiKey=JlE5Jldo5Jibnk5O5hTx6XVqsJu4WJ26`;
	visit.permission = 'Public';
	visit.userLink = null;
	visit.region = 'USW';
	visit.worldName = resp.world.name;
	visit.instance = resp.location;

	resp.instance.split('~').forEach((v, i) => {
		if (i == 0) {
			visit.instanceName = v;
			return;
		}

		if (v == 'canRequestInvite') {
			visit.permission = 'InvitePlus';
			return;
		}

		const [vk, vv] = v.slice(0, -1).split('(')
		switch (vk) {
			case 'private':
				visit.permission = 'Invite';
				visit.userLink = `https://vrchat.com/home/user/${vv}`;
				return;

			case 'friends':
				visit.permission = 'Friends';
				visit.userLink = `https://vrchat.com/home/user/${vv}`;
				return;

			case 'hidden':
				visit.permission = 'FriendsPlus';
				visit.userLink = `https://vrchat.com/home/user/${vv}`;
				return;

			case 'region':
				visit.region = vv.toUpperCase();
				return;
		}
	});


	return visit;
};


let currentPosition = 0;

const instanceHistory = JSON.parse(
	localStorage.getItem('instanceHistory') || '[]'
).map(parseStore).reverse();

const update = () => {
	const i = instanceHistory[currentPosition];
	document.getElementById('worldname').textContent = i.worldName;
	document.getElementById('permission').textContent = `${i.permission}:${i.region}:${i.instanceName}`;
	document.getElementById('datetime').textContent = i.datetime;
	document.getElementById('instance').textContent = i.instance;
	
	document.getElementById('launch-button').disabled = false;
	document.getElementById('detail-button').disabled = false;
	document.getElementById('inviteme-button').disabled = false;
	document.getElementById('launch-button').dataset.uri = i.launchLink;
	document.getElementById('detail-button').dataset.uri = i.detailLink;
	document.getElementById('inviteme-button').dataset.uri = i.invitemeLink;

	document.getElementById('user-button').disabled = i.userLink == null;
	document.getElementById('user-button').dataset.uri = i.userLink;

};

const scroll = n => {
	currentPosition += n;
	document.getElementById('newer-button').disabled = !(0 < currentPosition);
	document.getElementById('older-button').disabled = !(currentPosition < instanceHistory.length-1);
	update();
};

(() => {
	if (instanceHistory.length == 0) return;
	document.getElementById('older-button').addEventListener('click', () => { scroll(1); });
	document.getElementById('newer-button').addEventListener('click', () => { scroll(-1); });
	document.getElementById('launch-button').addEventListener('click', (e) => {
		window.open(e.target.dataset.uri, '_blank');
	});
	document.getElementById('inviteme-button').addEventListener('click', (e) => {
		fetch(e.target.dataset.uri, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: '{}',
		});
	});
	document.getElementById('detail-button').addEventListener('click', (e) => {
		window.open(e.target.dataset.uri, '_blank');
	});
	document.getElementById('user-button').addEventListener('click', (e) => {
		window.open(e.target.dataset.uri, '_blank');
	});
	scroll(0);
})();


