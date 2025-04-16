document.addEventListener('DOMContentLoaded', () => {
    const itemsList = document.getElementById('itemsList');
    const addItemForm = document.getElementById('addItemForm');
    const token = localStorage.getItem('token'); // BUGFIX: Need token for authenticated requests

    // BUGFIX: Check if token exists before proceeding
    if (!token) {
        // Redirect to login or show message if not logged in
        // For now, just log and disable adding items
        console.error('No token found. Please log in.');
        if (addItemForm) addItemForm.style.display = 'none'; // Hide form if not logged in
        // Optionally redirect: window.location.href = '/';
        // return; // Stop further execution if redirecting
    }

    const fetchItems = async () => {
        try {
            // BUGFIX: Correct API endpoint and add Authorization header
            const response = await fetch('/api/items/', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (!response.ok) {
                // BUGFIX: Handle unauthorized or other errors
                if (response.status === 401) {
                    console.error('Unauthorized. Please log in again.');
                    // Optionally redirect to login
                    // window.location.href = '/';
                } else {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return; // Stop if unauthorized or error
            }
            const items = await response.json();
            itemsList.innerHTML = ''; // Clear previous list
            items.forEach(item => {
                const li = document.createElement('li');
                // BUGFIX: Display item properties correctly (assuming item has name and description)
                li.textContent = `${item.name}: ${item.description || 'No description'}`;
                itemsList.appendChild(li);
            });
        } catch (error) {
            console.error('Failed to fetch items:', error);
            // BUGFIX: Provide user feedback on fetch failure
            itemsList.innerHTML = '<li>Failed to load items.</li>';
        }
    };

    if (itemsList) {
        fetchItems();
    }

    if (addItemForm) {
        addItemForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const name = e.target.name.value;
            const description = e.target.description.value;

            // BUGFIX: Ensure token is available before attempting to add item
            if (!token) {
                alert('You must be logged in to add items.');
                return;
            }

            try {
                // BUGFIX: Correct API endpoint and add Authorization header
                const response = await fetch('/api/items/', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ name, description })
                });

                if (!response.ok) {
                     // BUGFIX: Handle unauthorized or other errors
                    if (response.status === 401) {
                        alert('Unauthorized. Please log in again.');
                         // Optionally redirect to login
                         // window.location.href = '/';
                    } else {
                        // Try to get error detail from response
                        let errorDetail = 'Failed to add item.';
                        try {
                            const errorData = await response.json();
                            errorDetail = errorData.detail || errorDetail;
                        } catch (jsonError) {
                            // Ignore if response is not JSON
                        }
                        throw new Error(`HTTP error! status: ${response.status}. ${errorDetail}`);
                    }
                    return; // Stop if unauthorized or error
                }

                // BUGFIX: Clear form and refresh items list on success
                addItemForm.reset();
                fetchItems(); // Refresh the list
                alert('Item added successfully!');
            } catch (error) {
                console.error('Failed to add item:', error);
                // BUGFIX: Provide user feedback on add failure
                alert('Failed to add item: ' + error.message);
            }
        });
    }
});