'use strict';

const showPassword = document.getElementById('show-password');
const password = document.getElementById('password');

showPassword.addEventListener('change', () => {
	if (showPassword.checked) {
		password.type = 'text';
	} else {
		password.type = 'password';
	}
});
