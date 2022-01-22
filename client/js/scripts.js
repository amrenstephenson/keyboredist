const apiURL = 'http://127.0.0.1:8090/api';
const PAGES = { loginPrompt: 'login-prompt', loginUsername: 'login-username', users: 'users', browseUsers: 'browse-users', browseKeyboards: 'browse-keyboards', profile: 'profile' };

const currentUserId = null;

document.addEventListener('DOMContentLoaded', () => {
	registerMobileNavEvents();
	registerLinks();
	changePage(location.pathname);
	document.getElementById('login-button').addEventListener('click', async () => {
		const username = document.getElementById('username-input').value;
		const response = await fetch(apiURL + '/users?name=' + encodeURIComponent(username));
		if (response.status === 200) {
			const jsonData = await response.json();
			const entities = jsonData.entities;
			if (entities === undefined || entities[0] === undefined) {
				// TODO
				alert('entites undefined');
			} else {
				console.log('yay!');
				changePage(`${PAGES.users}/${entities[0].id}`);
			}
		} else if (response.status === 404) {
			// TODO
			alert('404');
		} else {
			// TODO
			alert('other status');
		}
	});
});

function registerLinks () {
	document.querySelectorAll(`.link-${PAGES.profile}`).forEach(function (elem) {
		elem.addEventListener('click', async () => {
			if (currentUserId === null) {
				changePage(PAGES.loginPrompt);
			} else {
				changePage(`${PAGES.users}/${currentUserId}`);
			}
		});
	});
	document.querySelectorAll(`.link-${PAGES.loginUsername}`).forEach(function (elem) {
		elem.addEventListener('click', async () => {
			changePage(`${PAGES.loginUsername}`);
		});
	});
}

async function changePage (newPage) {
	if (newPage.startsWith('/')) {
		newPage = newPage.substring(1);
	}
	if (newPage.endsWith('/')) {
		newPage = newPage.substring(0, newPage.length - 1);
	}

	window.history.replaceState(null, document.title, `/${newPage}`);

	const pageComponents = newPage.split('/');
	const pageRoot = pageComponents[0];

	let pageFound = false;
	for (const entry of Object.entries(PAGES)) {
		if (pageRoot === entry[1]) {
			pageFound = true;
		}
	}

	if (pageFound) {
		showPage(pageRoot);

		setElemLoading('page-' + pageRoot, true);
		if (pageRoot === PAGES.users) {
			await loadUser(pageComponents[1], true);
		}

		setElemLoading('page-' + pageRoot, false);
	} else {
		// TODO: 404?
		changePage(PAGES.loginPrompt);
	}
}

function setElemLoading (elemId, isLoading) {
	const elem = document.getElementById(elemId);
	if (isLoading) {
		elem.classList.add('loading');
	} else {
		elem.classList.remove('loading');
	}
}

async function loadUser (userId, isMine) {
	const response = await fetch(`${apiURL}/${PAGES.users}/${userId}`);

	const elemName = document.getElementById('page-users-name');
	const elemKeyboards = document.getElementById('page-users-keyboards');

	if (response.status === 404) {
		elemName.innerText = 'User Not Found';
		document.getElementById('page-users-keyboards').innerText = `A user with the ID ${userId} could not be found.`;
		return;
	} else if (response.status !== 200) {
		elemName.innerText = 'Unknown Error';
		elemKeyboards.innerText = 'There was an error getting the information of this user. Please try again.';
		return;
	}

	const user = await response.json();

	elemName.innerText = user.name;

	if (user.children.keyboards.length === undefined) {
		elemKeyboards.innerText = 'There was an error getting the list of keyboards for this user.';
	} else if (user.children.keyboards.length === 0) {
		elemKeyboards.innerText = isMine ? 'You currently have no keyboards.' : 'This user has no public keyboards.';
	} else {
		// TODO
	}
}

function showPage (pageID) {
	document.querySelectorAll('.page').forEach((elem) => {
		elem.classList.add('dnd');
	});
	document.getElementById(`page-${pageID}`).classList.remove('dnd');
}

function registerMobileNavEvents () {
	document.getElementById('mobile-nav-menu-toggle').addEventListener('click', () => {
		const mobileNavMenu = document.getElementById('mobile-nav-menu');
		mobileNavMenu.classList.toggle('dnd');
		mobileNavMenu.focus();
	});
	document.getElementById('main-content').addEventListener('click', () => {
		document.getElementById('mobile-nav-menu').classList.add('dnd');
	});
	document.getElementById('main-content').addEventListener('touchstart', () => {
		document.getElementById('mobile-nav-menu').classList.add('dnd');
	});
	document.getElementById('mobile-nav-menu').addEventListener('click', () => {
		document.getElementById('mobile-nav-menu').classList.add('dnd');
	});
	window.addEventListener('resize', () => {
		document.getElementById('mobile-nav-menu').classList.add('dnd');
	});
}
