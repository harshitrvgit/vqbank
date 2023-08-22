"use strict";

const showPassword = document.getElementById("show-password");
const password = document.getElementById("password");

showPassword.addEventListener("change", () => {
	showPassword.checked
		? (password.type = "text")
		: (password.type = "password");
});
