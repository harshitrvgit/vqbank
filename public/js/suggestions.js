console.log("suggestions.js loaded...");

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const searchBar = document.getElementById("searchBar");
const suggestionsContainer = document.getElementById("suggestions");
const searchContent = document.getElementById("search-content");

searchBar.addEventListener("input", async () => {
	const query = searchBar.value.trim();

	if (query === "") {
		suggestionsContainer.innerHTML = "";
		return;
	}

	try {
        await delay(750);
		const response = await fetch(`/api/v1/paper/suggestions?query=${query}`);

		const suggestions = await response.json();

        if(suggestions.length > 0) {
            searchContent.innerHTML = "Results...";
            suggestions.forEach(paper => {
                const paperElement = document.createElement("div");
                paperElement.classList.add("paper");
                paperElement.innerHTML = `
                    <div>${paper.courseTitle}</div>
                    <div>${paper.size / 1000} kb</div>
                    <a href="/api/v1/paper/view/${paper._id}" target="_blank">View</a>
                    <a href="/api/v1/paper/view/${paper._id}" download=${paper.originalname}>Download</a>
                `;
                searchContent.appendChild(paperElement);
            })
        }

	} catch (error) {
		console.error("Error fetching suggestions:", error);
	}
});
