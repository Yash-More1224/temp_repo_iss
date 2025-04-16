const rssConverter = "https://api.rss2json.com/v1/api.json?rss_url=";
const feeds = [
  { name: "bbc", url: "http://feeds.bbci.co.uk/news/world/rss.xml" },
  { name: "guardian", url: "https://www.theguardian.com/international/rss" }
];
let allArticles = []; // Cache for all fetched articles
let isFetching = false; // Flag to prevent multiple simultaneous fetches

// BUGFIX: Get references to elements after DOM is loaded
let listElement, loadingElement, articleCountElement, searchInput, sourceSelect, filterButton;

document.addEventListener('DOMContentLoaded', () => {
    listElement = document.getElementById("newsList");
    loadingElement = document.getElementById("loading");
    articleCountElement = document.getElementById("articleCount");
    searchInput = document.getElementById("search");
    sourceSelect = document.getElementById("source");
    filterButton = document.getElementById("filterButton");

    // BUGFIX: Add event listener for the filter button
    if (filterButton) {
        filterButton.addEventListener('click', () => {
            // Fetch only if cache is empty, otherwise just filter
            if (allArticles.length === 0) {
                fetchAllNews(true); // Pass true to indicate initial fetch
            } else {
                displayFilteredNews();
            }
        });
    }

    // Initial load
    fetchAllNews(true);
});

async function fetchAllNews(initialLoad = false) {
    if (isFetching) return; // Prevent concurrent fetches
    isFetching = true;

    if (!listElement || !loadingElement) return; // Ensure elements exist

    // Show loading indicator only on initial load or full refresh
    if (initialLoad) {
        listElement.innerHTML = ''; // Clear previous results only on full refresh
        allArticles = []; // Clear cache only on full refresh
        loadingElement.style.display = "block";
    }

    try {
        // BUGFIX: Fetch all feeds concurrently for better performance
        const promises = feeds.map(async (feed) => {
            try {
                const res = await fetch(`${rssConverter}${encodeURIComponent(feed.url)}`);
                if (!res.ok) {
                    console.error(`Failed to fetch ${feed.name}: ${res.statusText}`);
                    return []; // Return empty array on failure for this feed
                }
                const data = await res.json();
                // BUGFIX: Check if data.items exists and is an array
                if (data.status === 'ok' && Array.isArray(data.items)) {
                    return data.items.map(item => ({
                        // BUGFIX: Provide default values if properties are missing
                        title: item.title || "No title",
                        // BUGFIX: Basic sanitization/text extraction for description
                        description: item.description ? item.description.replace(/<[^>]*>?/gm, '').substring(0, 150) + '...' : "No description",
                        url: item.link || "#",
                        source: feed.name.toUpperCase(),
                        pubDate: item.pubDate ? new Date(item.pubDate).toLocaleDateString() : "Unknown"
                    }));
                } else {
                    console.error(`Invalid data format from ${feed.name}:`, data);
                    return []; // Return empty array on invalid format
                }
            } catch (fetchError) {
                console.error(`Error fetching ${feed.name}:`, fetchError);
                return []; // Return empty array on fetch error
            }
        });

        const results = await Promise.all(promises);
        // Flatten the array of arrays and store in cache
        allArticles = results.flat();

        // BUGFIX: Display news after fetching
        displayFilteredNews();

    } catch (err) {
        // BUGFIX: Show error message in the list area
        if (listElement) listElement.innerHTML = `<p style="color: red;">Error loading news: ${err.message}</p>`;
        console.error('Error fetching news feeds:', err);
    } finally {
        // BUGFIX: Hide loading indicator
        if (loadingElement) loadingElement.style.display = "none";
        isFetching = false;
    }
}

function displayFilteredNews() {
    if (!listElement || !articleCountElement || !searchInput || !sourceSelect) return; // Ensure elements exist

    const searchTerm = searchInput.value.toLowerCase();
    const selectedSource = sourceSelect.value;

    // Filter from the cached articles
    const filteredArticles = allArticles.filter(article => {
        const matchesSource = selectedSource === "all" || article.source.toLowerCase() === selectedSource;
        const matchesSearch = !searchTerm ||
                              article.title.toLowerCase().includes(searchTerm) ||
                              article.description.toLowerCase().includes(searchTerm);
        return matchesSource && matchesSearch;
    });

    // BUGFIX: Update article count based on filtered results
    articleCountElement.textContent = `Showing ${filteredArticles.length} articles`;

    listElement.innerHTML = ""; // Clear previous display
    if (filteredArticles.length === 0) {
        listElement.innerHTML = "<p>No articles found matching your criteria.</p>";
    } else {
        filteredArticles.forEach(article => {
            const div = document.createElement("div");
            div.className = "news-item"; // Add class for styling
            // BUGFIX: Ensure target="_blank" for external links
            div.innerHTML = `
                <h3><a href="${article.url}" target="_blank" rel="noopener noreferrer">${article.title}</a></h3>
                <p><strong>Source:</strong> ${article.source} |
                   <strong>Date:</strong> ${article.pubDate}</p>
                <p>${article.description}</p>
            `;
            listElement.appendChild(div);
        });
    }
}

// BUGFIX: Removed irrelevant comment
// // OPINION: Javascript syntax is stupid

// BUGFIX: Removed initial load call from global scope, handled by DOMContentLoaded
// loadNews();