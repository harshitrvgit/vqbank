'use strict';
console.log('suggestions.js loaded...');

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const searchBar = document.getElementById('searchBar');
const searchContent = document.getElementById('search-content');

const debounce = (func, wait) => {
	let timeout;
	return (...args) => {
		clearTimeout(timeout);
		timeout = setTimeout(() => func.apply(this, args), wait);
	};
};

const handleInput = async () => {
	const query = searchBar.value.trim();

	if (query === '') {
		searchContent.innerHTML = '';
		return;
	}

	try {
		const response = await fetch(`/api/v1/paper/suggestions?query=${query}`);

		searchContent.classList.add('text-center');
		searchContent.innerHTML = `
        <div class="spinner-border text-primary text-center" role="status">
            <span class="visually-hidden">Loading...</span>
        </div>
        `;

		await delay(750);
		searchContent.classList.remove('text-center');

		const suggestions = await response.json();

		if (suggestions.length > 0) {
			searchContent.innerHTML = `
            <div class="alert alert-info" role="alert">
                Here's what I found...
            </div>`;
			suggestions.forEach((paper) => {
				const paperElement = document.createElement('div');
				paperElement.classList.add('paper');
				paperElement.innerHTML = `
                    <div class="card text-dark mt-3 mb-3">
                        <h5 class="card-header">${paper.courseTitle || paper.originalname}
                            <span class="badge rounded-pill text-bg-primary">${paper.programmeName}</span>
                            <span class="badge rounded-pill text-bg-success">${paper.semester}</span>
                            <span class="badge rounded-pill text-bg-warning">${paper.assessmentType}</span>
                            <span class="badge rounded-pill text-bg-dark">${(paper.size / (1000 * 1000)).toFixed(2)}MB</span>
                            <span class="badge text-bg-light">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-eye" viewBox="0 0 16 16">
                                    <path d="M16 8s-3-5.5-8-5.5S0 8 0 8s3 5.5 8 5.5S16 8 16 8zM1.173 8a13.133 13.133 0 0 1 1.66-2.043C4.12 4.668 5.88 3.5 8 3.5c2.12 0 3.879 1.168 5.168 2.457A13.133 13.133 0 0 1 14.828 8c-.058.087-.122.183-.195.288-.335.48-.83 1.12-1.465 1.755C11.879 11.332 10.119 12.5 8 12.5c-2.12 0-3.879-1.168-5.168-2.457A13.134 13.134 0 0 1 1.172 8z"/>
                                    <path d="M8 5.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5zM4.5 8a3.5 3.5 0 1 1 7 0 3.5 3.5 0 0 1-7 0z"/>
                                </svg>
                                ${paper.views}
                            </span>
                        </h5>
                        <div class="card-body">
                            <div class="mt-3 d-flex">
                                <a class="btn btn-outline-primary" href="/api/v1/paper/view/${paper._id}" target="_blank">View</a>
                                <a class="btn btn-success ms-3" href="/api/v1/paper/view/${paper._id}" download="${paper.originalname}">Download</a>

                                <div class="btn-group ms-3" role="group" aria-label="admin accessible buttons">
                                    <a type="button" href="/api/v1/paper/edit/${paper._id}" class="btn btn-outline-warning">Edit</a>
                                    <form class="btn btn-danger" action="/api/v1/paper/delete/${paper._id}?_method=DELETE" method="post">
                                        <button class="unbutton" type="submit">Delete</button>
                                    </form>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
				searchContent.appendChild(paperElement);
			});
		} else {
			searchContent.innerHTML = `
            <div class="alert alert-info" role="alert">
                0 results found :(
            </div>
        `;
		}
	} catch (error) {
		console.error('Error fetching suggestions:', error);
	}
};

searchBar.addEventListener('input', debounce(handleInput, 500));
