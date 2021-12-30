const apiURL = 'http://127.0.0.1:8090/api/';
const PAGES = ['login-prompt', 'login-username', 'profile'];

document.addEventListener('DOMContentLoaded', () => {
	registerMobileNavEvents();
	onPageChange();
	document.getElementById('login-button').addEventListener('click', async () => {
		const username = document.getElementById('username-input').value;
		const response = await fetch(apiURL + 'users?username=' + encodeURIComponent(username));
		const body = await response.text();
		alert(body);
	});
});

window.addEventListener('hashchange', () => {
	onPageChange();
});

function setElemLoading (elem, isLoading) {
	if (isLoading) {
		elem.classList.add('loading');
	} else {
		elem.classList.remove('loading');
	}
}

function onPageChange () {
	const pageID = location.hash.slice(1);
	if (PAGES.includes(pageID)) {
		showPage(pageID);
	} else {
		location.hash = '#login-prompt';
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
