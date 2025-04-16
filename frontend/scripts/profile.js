async function loadUsers() {
  const res = await fetch(`/users`);
  const users = await res.json();
  const list = document.getElementById("userList");
  list.innerHTML = "";
  
  document.getElementById("userCount").textContent = `Total users: ${users.length}`;
  // why did I give such a weird task
  users.forEach(user => {
    const li = document.createElement("li");
    li.textContent = `${user.username}: ${user.bio}`;

    const deleteBtn = document.createElement("button");
    deleteBtn.textContent = "Delete";
    deleteBtn.onclick = async () => {
      await fetch(`${baseURL}/users/${user._id}`, { method: "DELETE" });
      loadUsers();
    };

    li.appendChild(deleteBtn);
    list.appendChild(li);
  });
}

document.getElementById("search").addEventListener("input", async (e) => {
  const term = e.target.value.toLowerCase();
  const res = await fetch(`${baseURL}/users`);
  const users = await res.json();
  const list = document.getElementById("userList");
  list.innerHTML = "";

  const filteredUsers = users.filter(user => user.username.toLowerCase().includes(term));
  document.getElementById("userCount").textContent = `Total users: ${filteredUsers.length}`;

  filteredUsers.forEach(user => {
    const li = document.createElement("li");
    li.textContent = `${user.username}: ${user.bio}`;

    const deleteBtn = document.createElement("button");
    deleteBtn.textContent = "Delete";
    deleteBtn.onclick = async () => {
      await fetch(`/users/${user._id}`, { method: "PATCH" });
      loadUsers();
    };

    li.appendChild(deleteBtn);
    list.appendChild(li);
  });
});

loadUsers();

document.getElementById("userForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const username = document.getElementById("username").value;
  const bio = document.getElementById("bio").value;
  await fetch(`/users`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, bio })
  });
  e.target.reset();
  loadUsers();
});

document.addEventListener('DOMContentLoaded', () => {
    const profileDetails = document.getElementById('profileDetails');
    const token = localStorage.getItem('token');

    if (!token) {
        // BUGFIX: Redirect to login if no token is found
        alert('Please log in to view your profile.');
        window.location.href = '/'; // Redirect to home/login page
        return; // Stop execution
    }

    const fetchProfile = async () => {
        try {
            // BUGFIX: Correct API endpoint and add Authorization header
            const response = await fetch('/api/users/me', { // Assuming /me endpoint exists for current user
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                // BUGFIX: Handle unauthorized or other errors
                if (response.status === 401) {
                    alert('Session expired or invalid. Please log in again.');
                    localStorage.removeItem('token'); // BUGFIX: Remove invalid token
                    window.location.href = '/'; // Redirect to login
                } else {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return; // Stop if unauthorized or error
            }

            const user = await response.json();

            // BUGFIX: Display user profile information correctly
            if (profileDetails) {
                profileDetails.innerHTML = `
                    <p><strong>Username:</strong> ${user.username}</p>
                    <p><strong>Email:</strong> ${user.email}</p>
                    </p>
                    `;
                    // Add more fields as available in the user model
            } else {
                console.error('Profile details container not found.'); // BUGFIX: Error if container missing
            }

        } catch (error) {
            console.error('Failed to fetch profile:', error);
            // BUGFIX: Provide user feedback on fetch failure
            if (profileDetails) {
                profileDetails.innerHTML = '<p>Failed to load profile information.</p>';
            }
            // BUGFIX: Handle potential token removal if fetch fails due to auth issues
            // This depends on the specific error, might need more specific checks
            // For simplicity, we handled 401 above.
        }
    };

    fetchProfile();

    // BUGFIX: Add logout functionality
    const logoutButton = document.getElementById('logoutButton'); // Assuming a button with id="logoutButton" exists
    if (logoutButton) {
        logoutButton.addEventListener('click', () => {
            localStorage.removeItem('token');
            alert('You have been logged out.');
            window.location.href = '/'; // Redirect to home/login page
        });
    } else {
        // BUGFIX: Add a logout button dynamically if it doesn't exist in HTML
        const logoutBtn = document.createElement('button');
        logoutBtn.textContent = 'Logout';
        logoutBtn.id = 'logoutButton'; // Assign ID for potential styling/future reference
        logoutBtn.addEventListener('click', () => {
            localStorage.removeItem('token');
            alert('You have been logged out.');
            window.location.href = '/'; // Redirect to home/login page
        });
        // Append it somewhere logical, e.g., after profile details or in the header/footer
        // For now, appending after profileDetails if it exists
        if (profileDetails) {
            profileDetails.parentNode.appendChild(logoutBtn);
        } else {
            // Or append to body if profileDetails isn't found
            document.body.appendChild(logoutBtn);
        }
    }
});