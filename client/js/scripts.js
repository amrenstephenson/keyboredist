const apiURL = 'http://127.0.0.1:8090/api';
const PAGES = { loginPrompt: 'login-prompt', loginUsername: 'login-username', users: 'users', keyboards: 'keyboards', browseUsers: 'browse-users', browseKeyboards: 'browse-keyboards', profile: 'profile' };

let currentUserId = localStorage.getItem('currentUserId');
let currentUserName = localStorage.getItem('currentUserName');

document.addEventListener('DOMContentLoaded', () => {
	registerMobileNavEvents();
	registerLinks();
	changePage(location.pathname);
	setLogin(currentUserId, currentUserName);

	document.getElementById('login-button').addEventListener('click', async () => {
		loginClicked();
	});

	document.addEventListener('keypress', async (key) => {
		if (key.key === 'Enter') {
			if (location.pathname.replace('/', '') === PAGES.loginUsername) {
				loginClicked();
			}
		}
	});

	window.addEventListener('popstate', function (event) {
		changePage(location.pathname);
	});
});

async function loginClicked () {
	const username = document.getElementById('username-input').value;
	const response = await fetch(apiURL + '/users?name=' + encodeURIComponent(username));
	if (response.status === 200) {
		const jsonData = await response.json();
		const entities = jsonData.entities;
		if (entities === undefined || entities[0] === undefined) {
			// TODO
			alert('entites undefined');
		} else {
			setLogin(entities[0].id, entities[0].name);
			changePage(`${PAGES.users}/${currentUserId}`);
		}
	} else if (response.status === 404) {
		// TODO
		alert('404');
	} else {
		// TODO
		alert('other status');
	}
}

function setLogin (userId, userName) {
	currentUserId = userId;
	currentUserName = userName;

	if (currentUserId === null) {
		localStorage.removeItem('currentUserId');
		localStorage.removeItem('currentUserName');

		document.getElementById('login-banner').classList.add('dnd');
	} else {
		localStorage.setItem('currentUserId', currentUserId);
		localStorage.setItem('currentUserName', currentUserName);

		document.getElementById('login-banner').classList.remove('dnd');
		document.getElementById('login-banner-text').innerText = `Logged in as ${currentUserName}`;
	}
}

function registerLinks () {
	document.querySelectorAll(`.link-${PAGES.profile}`).forEach(function (elem) {
		elem.addEventListener('click', async () => {
			changePage(PAGES.profile);
		});
	});
	document.querySelectorAll(`.link-${PAGES.loginUsername}`).forEach(function (elem) {
		elem.addEventListener('click', async () => {
			changePage(PAGES.loginUsername);
		});
	});
	document.querySelectorAll(`.link-${PAGES.browseUsers}`).forEach(function (elem) {
		elem.addEventListener('click', async () => {
			changePage(PAGES.browseUsers);
		});
	});
	document.querySelectorAll(`.link-${PAGES.browseKeyboards}`).forEach(function (elem) {
		elem.addEventListener('click', async () => {
			changePage(PAGES.browseKeyboards);
		});
	});
	document.querySelectorAll('.link-logout').forEach(function (elem) {
		elem.addEventListener('click', async () => {
			setLogin(null, null);
			changePage(PAGES.loginPrompt);
		});
	});
}

// Function from: https://stackoverflow.com/a/196991 [License https://creativecommons.org/licenses/by-sa/4.0/] [Accessed 23/01/22]
function toTitleCase (str) {
	return str.replace(
		/\w\S*/g,
		function (txt) {
			return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
		}
	);
}

async function changePage (newPage) {
	if (newPage.startsWith('/')) {
		newPage = newPage.substring(1);
	}
	if (newPage.endsWith('/')) {
		newPage = newPage.substring(0, newPage.length - 1);
	}

	// Redirect /profile to the page of the logged in user, or to the login page if the user is not logged in.
	if (newPage === PAGES.profile) {
		if (currentUserId === null) {
			changePage(PAGES.loginPrompt);
		} else {
			changePage(`${PAGES.users}/${currentUserId}`);
		}
		return;
	}

	const pageComponents = newPage.split('/');
	const pageRoot = pageComponents[0];

	document.title = `${toTitleCase(pageRoot.replace('-', ' '))} | Keyboardist`;

	let pageFound = false;
	for (const entry of Object.entries(PAGES)) {
		if (pageRoot === entry[1]) {
			pageFound = true;
		}
	}

	if (pageFound) {
		setElemLoading('page-' + pageRoot, true);
		showPage(pageRoot);

		if (pageRoot === PAGES.users) {
			await loadEntity('user', 'users', pageComponents[1], 'keyboard', 'keyboards', false, 'comment', 'comments');
		} else if (pageRoot === PAGES.keyboards) {
			await loadEntity('keyboard', 'keyboards', pageComponents[1], 'comment', 'comments', true, 'user', 'users');
		} else if (pageRoot === PAGES.browseUsers) {
			await loadBrowseUsers();
		} else if (pageRoot === PAGES.browseKeyboards) {
			loadBrowseKeyboards();
		}

		setElemLoading('page-' + pageRoot, false);
		window.history.pushState(null, document.title, `/${newPage}`);
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

function capitalise (string) {
	return string.substring(0, 1).toUpperCase() + string.substring(1);
}

async function loadEntity (nameSingular, namePlural, entityId, childSingular, childPlural, showParent, otherSingular, otherPlural) {
	const response = await fetch(`${apiURL}/${namePlural}/${entityId}`);

	const elemName = document.getElementById(`page-${namePlural}-name`);
	const elemChildren = document.getElementById(`page-${namePlural}-children`);

	if (response.status === 404) {
		elemName.innerText = `${capitalise(nameSingular)} - Not Found`;
		elemChildren.innerText = `A ${nameSingular} with the ID '${entityId}' could not be found.`;
		return;
	} else if (response.status !== 200) {
		elemName.innerText = `${capitalise(nameSingular)} - Unknown Error`;
		elemChildren.innerText = `There was an error getting the information of this ${nameSingular}. Please try again.`;
		return;
	}

	const entity = await response.json();

	elemName.innerText = entity.name;
	elemChildren.innerText = '';

	document.title = `${entity.name} - ${document.title}`;

	const childrenIds = entity.children[childPlural];

	if (childrenIds.length === undefined) {
		elemChildren.innerText = `There was an error getting the list of ${childPlural} for this ${nameSingular}.`;
	} else if (childrenIds.length === 0) {
		elemChildren.innerText = `This ${nameSingular} has no ${childPlural}.`;
	} else {
		for (const key in childrenIds) {
			const childId = entity.children[childPlural][key];

			const jsonData = await fetch(`${apiURL}/${childPlural}/${childId}`);
			const child = await jsonData.json();

			if (showParent) {
				const parentId = child.parents[otherPlural][0];
				const jsonData = await fetch(`${apiURL}/${otherPlural}/${parentId}`);
				const parent = await jsonData.json();

				const elemChild = newListItem(child.name, `- ${parent.name}`);
				elemChild.addEventListener('click', async () => {
					changePage(`${otherPlural}/${parent.id}`);
				});
				elemChildren.append(elemChild);
			} else {
				const childChildren = child.children[otherPlural];
				const childChildrenCount = childChildren === undefined ? 0 : childChildren.length;

				const commentWord = childChildrenCount === 1 ? otherSingular : otherPlural;
				const elemChild = newListItem(child.name, `${childChildrenCount} ${commentWord}`);
				elemChild.addEventListener('click', async () => {
					changePage(`${childPlural}/${child.id}`);
				});
				elemChildren.append(elemChild);
			}
		}
	}
}

async function loadBrowseUsers () {
	const elemList = document.getElementById('page-browse-users-list');

	elemList.innerHTML = '';

	const response = await fetch(`${apiURL}/users`);

	if (response.status !== 200) {
		elemList.innerText = 'There was an error getting the list of users. Please try again.';
		return;
	}

	const userList = await response.json();

	if (userList.entities.length === 0) {
		elemList.innerText = 'There are currently no users. ☹';
		return;
	}

	for (const key in userList.entities) {
		const user = userList.entities[key];

		const keyboardWord = user.children.keyboards.length === 1 ? 'keyboard' : 'keyboards';
		const elemUser = newListItem(user.name, `${user.children.keyboards.length} ${keyboardWord}`);
		elemUser.addEventListener('click', async () => {
			changePage(`${PAGES.users}/${user.id}`);
		});
		elemList.append(elemUser);
	}
}

function newListItem (title, text) {
	const elemListItem = document.createElement('div');
	elemListItem.classList.add('pa1', 'bg-yellow', 'ba', 'bw2', 'br4', 'mt2', 'clickable');
	elemListItem.innerHTML = `<h4 class="ma1">${title}</h4><h5 class="fw4 ma1">${text}</h5>`;
	return elemListItem;
}

async function loadBrowseKeyboards () {
	const elemList = document.getElementById('page-browse-keyboards-list');

	elemList.innerHTML = '';

	const response = await fetch(`${apiURL}/keyboards`);

	if (response.status !== 200) {
		elemList.innerText = 'There was an error getting the list of keyboards. Please try again.';
		return;
	}

	const keyboardList = await response.json();

	if (keyboardList.entities.length === 0) {
		elemList.innerText = 'There are currently no keyboards. ☹';
		return;
	}

	for (const key in keyboardList.entities) {
		const keyboard = keyboardList.entities[key];

		const commentWord = keyboard.children.comments.length === 1 ? 'comment' : 'comments';
		const elemKeyboard = newListItem(keyboard.name, `${keyboard.children.comments.length} ${commentWord}`);
		elemKeyboard.addEventListener('click', async () => {
			changePage(`${PAGES.keyboards}/${keyboard.id}`);
		});
		elemList.append(elemKeyboard);
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
