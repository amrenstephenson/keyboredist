const apiURL = 'http://127.0.0.1:8090/api';
const PAGES = { loginPrompt: 'login-prompt', loginUsername: 'login-username', users: 'users', keyboards: 'keyboards', browseUsers: 'browse-users', browseKeyboards: 'browse-keyboards', profile: 'profile', addKeyboard: 'add-keyboard', addComment: 'add-comment', editAbout: 'edit-about' };

let currentUserId = localStorage.getItem('currentUserId');
let currentUserName = localStorage.getItem('currentUserName');

let lastViewedKeyboardId = null;

// eslint doesn't know about Tone so we ignore the undef warning.
// eslint-disable-next-line no-undef
let synth = new Tone.Synth(
	{
		oscillator: {
			type: 'triangle'
		},
		envelope: {
			attack: 0.01,
			decay: 0.5,
			sustain: 1,
			release: 1
		}
	}
).toDestination();

document.addEventListener('DOMContentLoaded', () => {
	registerMobileNavEvents();
	registerLinks();
	changePage(location.pathname);
	setLogin(currentUserId, currentUserName);

	document.getElementById('login-button').addEventListener('click', async () => {
		loginClicked();
	});

	document.getElementById('confirm-add-keyboard-button').addEventListener('click', async () => {
		addKeyboardClicked();
	});

	document.getElementById('confirm-add-comment-button').addEventListener('click', async () => {
		addCommentClicked();
	});

	document.getElementById('keyboard-save-button').addEventListener('click', async () => {
		saveKeyboardClicked();
	});

	document.getElementById('confirm-edit-about-button').addEventListener('click', async () => {
		editAboutClicked();
	});

	document.querySelectorAll('.keyboard-settings').forEach((elem) => {
		elem.addEventListener('input', () => {
			updateSynth();
			console.log('update');
		});
	});

	document.addEventListener('keypress', async (key) => {
		if (key.key === 'Enter') {
			if (location.pathname.replace('/', '') === PAGES.loginUsername) {
				loginClicked();
			} else if (location.pathname.replace('/', '') === PAGES.addKeyboard) {
				addKeyboardClicked();
			} else if (location.pathname.replace('/', '') === PAGES.addComment) {
				addCommentClicked();
			} else if (location.pathname.replace('/', '') === PAGES.editAbout) {
				editAboutClicked();
			}
		}
	});

	window.addEventListener('popstate', function (event) {
		changePage(location.pathname, false);
	});

	registerPianoKeyboard();
});

function registerPianoKeyboard () {
	const notes = ['C4', 'C#4', 'D4', 'D#4', 'E4', 'F4', 'F#4', 'G4', 'G#4', 'A4', 'A#4', 'B4', 'C5', 'C#5', 'D5', 'D#5', 'E5', 'F5', 'F#5', 'G5', 'G#5', 'A5', 'A#5', 'B5', 'C6'];

	notes.forEach((note, i) => {
		document.querySelectorAll(`.key${i}`).forEach((elemKey) => {
			elemKey.addEventListener('mousedown', (event) => {
				synth.triggerAttack(note);
				event.stopPropagation();
				document.querySelectorAll(`.key${i}`).forEach((elemPressed) => {
					elemPressed.classList.add('key-pressed');
					if (!elemPressed.classList.contains('bg-black')) {
						elemPressed.parentNode.classList.add('key-pressed');
					}
				});
			});
		});
	});

	document.addEventListener('mouseup', (event) => {
		synth.triggerRelease();
		document.querySelectorAll('.key-pressed').forEach((elemKey) => {
			elemKey.classList.remove('key-pressed');
		});
	});
}

function setKeyboardSliders (attack, decay, sustain, release) {
	const elemAttack = document.getElementById('keyboard-settings-attack');
	const elemDecay = document.getElementById('keyboard-settings-decay');
	const elemSustain = document.getElementById('keyboard-settings-sustain');
	const elemRelease = document.getElementById('keyboard-settings-release');

	elemAttack.value = attack;
	elemDecay.value = decay;
	elemSustain.value = sustain;
	elemRelease.value = release;

	// Update custom graphics:
	elemAttack.style.setProperty('--value', elemAttack.value);
	elemDecay.style.setProperty('--value', elemDecay.value);
	elemSustain.style.setProperty('--value', elemSustain.value);
	elemRelease.style.setProperty('--value', elemRelease.value);
}

function updateSynth () {
	const attack = document.getElementById('keyboard-settings-attack').value / 100;
	const decay = document.getElementById('keyboard-settings-decay').value / 100;
	const sustain = document.getElementById('keyboard-settings-sustain').value / 100;
	const release = document.getElementById('keyboard-settings-release').value / 100;

	// eslint doesn't know about Tone so we ignore the undef warning.
	// eslint-disable-next-line no-undef
	synth = new Tone.Synth(
		{
			oscillator: {
				type: 'triangle'
			},
			envelope: {
				attack: attack,
				decay: decay,
				sustain: sustain,
				release: release
			}
		}
	).toDestination();
}

async function saveKeyboardClicked () {
	const elemAttack = document.getElementById('keyboard-settings-attack');
	const elemDecay = document.getElementById('keyboard-settings-decay');
	const elemSustain = document.getElementById('keyboard-settings-sustain');
	const elemRelease = document.getElementById('keyboard-settings-release');

	const data = { attack: elemAttack.value, decay: elemDecay.value, sustain: elemSustain.value, release: elemRelease.value };

	try {
		const response = await fetch(apiURL + `/keyboards/${lastViewedKeyboardId}`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({ data: data })
		});

		if (response.status === 200) {
			showAlert('Saved', 'Your keyboard was updated.');
		} else {
			showAlert('Error Saving', await response.text());
		}
	} catch {
		showAlert('Error Connecting to Server', 'Please try again.');
	}
}

async function addKeyboardClicked () {
	const keyboardName = document.getElementById('keyboard-name-input').value;

	try {
		const response = await fetch(apiURL + '/keyboards', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({ name: keyboardName, parents: { user: currentUserId } })
		});

		if (response.status === 200) {
			const keyboard = await response.json();
			changePage(`${PAGES.keyboards}/${keyboard.id}`);
		} else {
			showAlert('Error Creating Keyboard', await response.text());
		}
	} catch {
		showAlert('Error Connecting to Server', 'Please try again.');
	}
}

async function addCommentClicked () {
	if (lastViewedKeyboardId === null) {
		showAlert('Error Adding Comment.', 'Please log in and try again.');
		setLogin(null, null);
		changePage(PAGES.loginPrompt);
		return;
	}

	const comment = document.getElementById('comment-input').value;

	try {
		const response = await fetch(`${apiURL}/comments`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({ name: comment, parents: { user: currentUserId, keyboard: lastViewedKeyboardId } })
		});

		if (response.status === 200) {
			changePage(`${PAGES.keyboards}/${lastViewedKeyboardId}`);
		} else {
			showAlert('Error Creating Comment', await response.text());
		}
	} catch {
		showAlert('Error Connecting to Server', 'Please try again.');
	}
}

async function editAboutClicked () {
	if (currentUserId === null) {
		showAlert('Error Changing About', 'Please log in and try again.');
		setLogin(null, null);
		changePage(PAGES.loginPrompt);
		return;
	}

	const about = document.getElementById('about-input').value;

	try {
		const response = await fetch(`${apiURL}/users/${currentUserId}`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({ data: about })
		});

		if (response.status === 200) {
			changePage(`${PAGES.users}/${currentUserId}`);
		} else {
			showAlert('Error Changing About', await response.text());
		}
	} catch {
		showAlert('Error Connecting to Server', 'Please try again.');
	}
}

async function loginClicked () {
	const username = document.getElementById('username-input').value;

	try {
		const response = await fetch(apiURL + '/users?name=' + encodeURIComponent(username));
		if (response.status === 200) {
			const jsonData = await response.json();
			const entities = jsonData.entities;
			if (entities === undefined || entities[0] === undefined) {
				const response2 = await fetch(apiURL + '/users', {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json'
					},
					body: JSON.stringify({ name: username })
				});

				if (response2.status === 200) {
					const user = await response2.json();
					setLogin(user.id, user.name);
					changePage(`${PAGES.users}/${user.id}`);
				} else {
					showAlert('Error Logging In', await response2.text());
				}
			} else {
				setLogin(entities[0].id, entities[0].name);
				changePage(`${PAGES.users}/${currentUserId}`);
			}
		} else {
			showAlert('Error Logging In', await response.text());
		}
	} catch {
		showAlert('Error Connecting to Server', 'Please try again.');
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
	const defaultLinks = [PAGES.profile, PAGES.loginUsername, PAGES.browseUsers, PAGES.browseKeyboards, PAGES.addKeyboard, PAGES.addComment, PAGES.editAbout];
	defaultLinks.forEach((link) => {
		document.querySelectorAll(`.link-${link}`).forEach(function (elem) {
			elem.addEventListener('click', async () => {
				changePage(link);
			});
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

async function changePage (newPage, updateHistory = true, attempt = 0) {
	try {
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

		if (newPage === PAGES.loginUsername || newPage === PAGES.loginPrompt) {
			if (currentUserId !== null) {
				changePage(`${PAGES.users}/${currentUserId}`);
				return;
			}
		}

		if (newPage === PAGES.addComment || newPage === PAGES.addKeyboard || newPage === PAGES.editAbout) {
			if (currentUserId === null) {
				changePage(PAGES.loginPrompt);
				return;
			}
		}

		const pageComponents = newPage.split('/');
		const pageRoot = pageComponents[0];

		if (pageRoot === PAGES.keyboards) {
			lastViewedKeyboardId = pageComponents[1];
		}

		document.title = `${toTitleCase(pageRoot.replace('-', ' '))} | Keyboredist`;

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
				await loadBrowseKeyboards();
			}

			setElemLoading('page-' + pageRoot, false);
			if (updateHistory) {
				window.history.pushState(null, document.title, `/${newPage}`);
			}
		} else {
			setLogin(null, null);
			changePage(PAGES.loginPrompt);
		}
	} catch {
		console.log('0');
		await delay(500);
		console.log('1');
		if (attempt > 0) {
			console.log('A');
			showAlert('Error Connecting to Server', 'Please try again.', 'Try Again', () => {
				console.log('B');
				changePage(newPage, true, attempt + 1);
			});
		} else {
			changePage(newPage, true, attempt + 1);
		}
	}
}

// Function from https://www.pentarem.com/blog/how-to-use-settimeout-with-async-await-in-javascript/ [Accessed 25/01/22]
function delay (ms) {
	return new Promise(resolve => setTimeout(resolve, ms));
}

function showAlert (title, text, buttonText = 'OK', callback = null) {
	const elemAlert = document.getElementById('alert');
	const elemAlertTitle = document.getElementById('alert-title');
	const elemAlertText = document.getElementById('alert-text');
	let elemAlertButton = document.getElementById('alert-button');

	elemAlert.classList.remove('dnd');

	elemAlertTitle.innerText = title;
	elemAlertText.innerText = text;
	elemAlertButton.innerText = buttonText;

	// Clear event listeners (we then have to get the newly cloned element from the DOM again).
	clearEventListeners(elemAlertButton);
	elemAlertButton = document.getElementById('alert-button');

	elemAlertButton.addEventListener('click', () => {
		elemAlert.classList.add('dnd');
		if (callback !== null) {
			callback();
		}
	});
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

// From https://stackoverflow.com/a/64609983/7161247 [License https://creativecommons.org/licenses/by-sa/4.0/] [Accessed 24/01/22]
function clearEventListeners (element) {
	const clonedElement = element.cloneNode(true);
	element.replaceWith(clonedElement);
	return clonedElement;
}

async function loadEntity (nameSingular, namePlural, entityId, childSingular, childPlural, showParent, otherSingular, otherPlural) {
	if (namePlural === 'users') {
		if (entityId === currentUserId) {
			document.getElementById('add-keyboard-button').classList.remove('dnd');
			document.getElementById('edit-about-button').classList.remove('dnd');
		} else {
			document.getElementById('add-keyboard-button').classList.add('dnd');
			document.getElementById('edit-about-button').classList.add('dnd');
		}
	}

	const entityResponse = await fetch(`${apiURL}/${namePlural}/${entityId}`);

	const elemName = document.getElementById(`page-${namePlural}-name`);
	const elemChildren = document.getElementById(`page-${namePlural}-children`);
	if (entityResponse.status === 200) {
		const entity = await entityResponse.json();

		elemName.innerText = `${entity.name}`;
		clearElem(elemChildren);

		document.title = `${entity.name} - ${capitalise(namePlural)} | Keyboredist`;

		if (namePlural === 'keyboards') {
			const elemConfig = document.getElementById('keyboard-config');
			if (entity.parents.user === currentUserId) {
				elemConfig.classList.remove('dnd');
			} else {
				elemConfig.classList.add('dnd');
			}

			let elemUser = document.getElementById('page-keyboards-user');
			const userResponse = await fetch(`${apiURL}/users/${entity.parents.user}`);
			const user = await userResponse.json();
			elemUser.innerText = user.name;
			elemUser.click = null;

			// Clear event listeners (we then have to get the newly cloned element from the DOM again).
			clearEventListeners(elemUser);
			elemUser = document.getElementById('page-keyboards-user');

			elemUser.addEventListener('click', async () => {
				changePage(`users/${user.id}`);
			});

			if (entity.data !== undefined && entity.data !== {}) {
				setKeyboardSliders(entity.data.attack, entity.data.decay, entity.data.sustain, entity.data.release);
			} else {
				setKeyboardSliders(50, 50, 50, 50);
			}
			updateSynth();
		} else if (namePlural === 'users') {
			const elemAbout = document.getElementById('page-users-about');
			if (entity.data === undefined || entity.data === '') {
				elemAbout.innerText = 'This user has no custom about section.';
			} else {
				elemAbout.innerText = entity.data;
			}
		}

		const childrenIds = entity.children[childPlural];
		console.log(childrenIds.length);

		if (childrenIds.length === undefined) {
			elemChildren.innerText = `There was an error getting the list of ${childPlural} for this ${nameSingular}.`;
		} else if (childrenIds.length === 0) {
			elemChildren.innerText = `\nThis ${nameSingular} has no ${childPlural}.`;
		} else {
			for (const key in childrenIds) {
				const childId = entity.children[childPlural][key];
				console.log('Hi');

				const jsonData = await fetch(`${apiURL}/${childPlural}/${childId}`);
				const child = await jsonData.json();

				if (showParent) {
					const parentId = child.parents[otherSingular];
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
	} else {
		if (namePlural === 'keyboards') {
			const elemConfig = document.getElementById('keyboard-config');
			elemConfig.classList.add('dnd');

			const elemUser = document.getElementById('page-keyboards-user');
			elemUser.innerText = '?';
		}
		if (entityResponse.status === 404) {
			elemName.innerText = `${capitalise(nameSingular)} - Not Found`;
			elemChildren.innerText = `A ${nameSingular} with the ID '${entityId}' could not be found.`;
		} else {
			elemName.innerText = `${capitalise(nameSingular)} - Unknown Error`;
			elemChildren.innerText = `There was an error getting the information of this ${nameSingular}. Please try again.`;
		}
	}
}

// Function from https://stackoverflow.com/a/3450726 [License https://creativecommons.org/licenses/by-sa/2.5/] [Accessed 24/01/22]
function clearElem (elem) {
	while (elem.firstChild) {
		elem.removeChild(elem.firstChild);
	}
}

async function loadBrowseUsers () {
	const elemList = document.getElementById('page-browse-users-list');

	clearElem(elemList);

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
	elemListItem.innerHTML = `<h3 class="ma1">${title}</h3><h4 class="fw4 ma1">${text}</h4>`;
	return elemListItem;
}

async function loadBrowseKeyboards () {
	const elemList = document.getElementById('page-browse-keyboards-list');

	clearElem(elemList);

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
