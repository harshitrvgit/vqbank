'use strict';

// Role passed in by index.ejs via data-user-role on the <script> tag.
// Reading this synchronously while the script is still parsing so the
// value survives into the async input handler below.
const isAdmin =
	document.currentScript?.dataset.userRole === 'ROLE_ADMIN';

const searchBar = document.getElementById('searchBar');
const searchContent = document.getElementById('search-content');

const debounce = (func, wait) => {
	let timeout;
	return function (...args) {
		clearTimeout(timeout);
		timeout = setTimeout(() => func.apply(this, args), wait);
	};
};

const renderSpinner = () => {
	searchContent.innerHTML = `
		<div class="text-center">
			<div class="spinner-border text-primary" role="status">
				<span class="visually-hidden">Loading...</span>
			</div>
		</div>
	`;
};

const renderEmpty = () => {
	searchContent.innerHTML = '';
	const alert = document.createElement('div');
	alert.className = 'alert alert-info';
	alert.setAttribute('role', 'alert');
	alert.textContent = '0 results found :(';
	searchContent.appendChild(alert);
};

const renderError = () => {
	searchContent.innerHTML = '';
	const alert = document.createElement('div');
	alert.className = 'alert alert-danger';
	alert.setAttribute('role', 'alert');
	alert.textContent = "Couldn't load suggestions. Please try again.";
	searchContent.appendChild(alert);
};

// Build a result card using textContent / property assignment for every
// dynamic field. Nothing user-controlled flows through innerHTML, so
// courseTitle / originalname etc. can't smuggle script tags or break out
// of attributes even if the upstream data is hostile.
const buildPaperCard = (paper) => {
	const card = document.createElement('div');
	card.className = 'card text-dark mt-3 mb-3';
	card.innerHTML = `
		<h5 class="card-header">
			<span class="js-title"></span>
			<span class="badge rounded-pill text-bg-primary js-prog"></span>
			<span class="badge rounded-pill text-bg-success js-sem"></span>
			<span class="badge rounded-pill text-bg-warning js-assess"></span>
			<span class="badge rounded-pill text-bg-dark js-size"></span>
			<span class="badge text-bg-light">
				<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-eye" viewBox="0 0 16 16">
					<path d="M16 8s-3-5.5-8-5.5S0 8 0 8s3 5.5 8 5.5S16 8 16 8zM1.173 8a13.133 13.133 0 0 1 1.66-2.043C4.12 4.668 5.88 3.5 8 3.5c2.12 0 3.879 1.168 5.168 2.457A13.133 13.133 0 0 1 14.828 8c-.058.087-.122.183-.195.288-.335.48-.83 1.12-1.465 1.755C11.879 11.332 10.119 12.5 8 12.5c-2.12 0-3.879-1.168-5.168-2.457A13.134 13.134 0 0 1 1.172 8z"/>
					<path d="M8 5.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5zM4.5 8a3.5 3.5 0 1 1 7 0 3.5 3.5 0 0 1-7 0z"/>
				</svg>
				<span class="js-views"></span>
			</span>
		</h5>
		<div class="card-body">
			<div class="mt-3 d-flex">
				<div class="btn-group" role="group" aria-label="general view and download buttons">
					<a class="btn btn-outline-primary js-view" target="_blank">View</a>
					<a class="btn btn-success js-download">Download</a>
				</div>
				<div class="btn-group ms-3 js-admin-actions" role="group" aria-label="admin accessible buttons" hidden>
					<a class="btn btn-outline-warning js-edit">Edit</a>
					<form class="btn btn-danger js-delete-form" method="post">
						<button class="unbutton" type="submit">Delete</button>
					</form>
				</div>
			</div>
		</div>
	`;

	const id = encodeURIComponent(String(paper._id ?? ''));
	const size =
		typeof paper.size === 'number'
			? `${(paper.size / 1_000_000).toFixed(2)}MB`
			: '';

	card.querySelector('.js-title').textContent =
		paper.courseTitle || paper.originalname || '';
	card.querySelector('.js-prog').textContent = paper.programmeName || '';
	card.querySelector('.js-sem').textContent = paper.semester || '';
	card.querySelector('.js-assess').textContent = paper.assessmentType || '';
	card.querySelector('.js-size').textContent = size;
	card.querySelector('.js-views').textContent = paper.views ?? 0;

	const viewUrl = `/api/v1/paper/view/${id}`;
	card.querySelector('.js-view').href = viewUrl;
	const downloadLink = card.querySelector('.js-download');
	downloadLink.href = viewUrl;
	downloadLink.download = paper.originalname || '';

	if (isAdmin) {
		const adminBlock = card.querySelector('.js-admin-actions');
		adminBlock.hidden = false;
		card.querySelector('.js-edit').href = `/api/v1/paper/edit/${id}`;
		card.querySelector('.js-delete-form').action =
			`/api/v1/paper/delete/${id}?_method=DELETE`;
	}

	return card;
};

// One in-flight request at a time. A new keystroke aborts the previous
// fetch, which both saves quota against the rate limiter and prevents
// stale results from overwriting fresh ones.
let currentController = null;

const handleInput = async () => {
	if (currentController) currentController.abort();
	currentController = new AbortController();
	const { signal } = currentController;

	const query = searchBar.value.trim();
	if (!query) {
		searchContent.innerHTML = '';
		return;
	}

	// Spinner first, fetch second — the previous order showed nothing
	// during the actual network wait and then flashed a spinner.
	renderSpinner();

	try {
		const response = await fetch(
			`/api/v1/paper/suggestions?query=${encodeURIComponent(query)}`,
			{ signal }
		);
		if (!response.ok) throw new Error(`HTTP ${response.status}`);

		const suggestions = await response.json();
		if (signal.aborted) return;

		searchContent.innerHTML = '';

		if (suggestions.length === 0) {
			renderEmpty();
			return;
		}

		const header = document.createElement('div');
		header.className = 'alert alert-info';
		header.setAttribute('role', 'alert');
		header.textContent = "Here's what I found...";
		searchContent.appendChild(header);

		suggestions.forEach((paper) => {
			searchContent.appendChild(buildPaperCard(paper));
		});
	} catch (error) {
		if (error?.name === 'AbortError') return;
		console.error('Error fetching suggestions:', error);
		renderError();
	}
};

searchBar.addEventListener('input', debounce(handleInput, 500));
