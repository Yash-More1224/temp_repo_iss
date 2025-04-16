const apiBaseURL = "/api"; // Assuming API routes are prefixed with /api

async function loadAnalytics() {
  const plotElement = document.getElementById("plot");
  const statsElements = {
      itemCount: document.getElementById("itemCount"),
      userCount: document.getElementById("userCount"),
      avgItemName: document.getElementById("avgItemName"),
      avgUserName: document.getElementById("avgUserName"),
      maxItemName: document.getElementById("maxItemName"),
      maxUserName: document.getElementById("maxUserName")
  };

  function showLoading() {
      Object.values(statsElements).forEach(el => { if(el) el.textContent = 'Loading...'; });
      if(plotElement) plotElement.style.display = 'none'; // Hide plot while loading
  }

  function showError(message) {
      Object.values(statsElements).forEach(el => { if(el) el.textContent = 'Error'; });
      alert(`Failed to load analytics: ${message}`);
  }

  showLoading();
  const token = localStorage.getItem('token');

  try {
    const res = await fetch(`${apiBaseURL}/analytics/`, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });

    if (!res.ok) {
        if (res.status === 401) {
            showError('Unauthorized. Please log in.');
            return;
        } else {
            throw new Error(`HTTP error! status: ${res.status}`);
        }
    }

    const data = await res.json();

    if (data && data.stats) {
        statsElements.itemCount.textContent = data.stats.item_count;
        statsElements.userCount.textContent = data.stats.user_count;
        statsElements.avgItemName.textContent = data.stats.avg_item_name_length.toFixed(2);
        statsElements.avgUserName.textContent = data.stats.avg_user_username_length.toFixed(2);
        statsElements.maxItemName.textContent = data.stats.max_item_name_length;
        statsElements.maxUserName.textContent = data.stats.max_user_username_length;
    } else {
        throw new Error('Invalid data format received from server.');
    }

    if (plotElement && data.plot_image) {
        plotElement.src = data.plot_image;
        plotElement.style.display = 'block';
    } else if (plotElement) {
        plotElement.alt = "Analytics plot not available.";
        plotElement.style.display = 'none';
    }

  } catch (error) {
    console.error('Error loading analytics:', error);
    showError(error.message);
  }
}

document.addEventListener('DOMContentLoaded', loadAnalytics);