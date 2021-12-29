document.addEventListener('DOMContentLoaded', () => {
	registerMobileNavEvents();
});

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
