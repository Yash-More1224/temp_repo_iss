document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const signupForm = document.getElementById('signupForm');

    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault(); // BUGFIX: Prevent default form submission which causes page reload
            const username = e.target.username.value;
            const password = e.target.password.value;
            try { // BUGFIX: Added basic try-catch for error handling
                const response = await fetch('/api/users/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, password })
                });

                // BUGFIX: Check if the request was successful
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const data = await response.json();
                // BUGFIX: Store token and provide feedback
                if (data.access_token) {
                    localStorage.setItem('token', data.access_token);
                    alert('Login successful!');
                    // Redirect or update UI
                    window.location.href = '/profile.html'; // Example redirect
                } else {
                    alert('Login failed: ' + (data.detail || 'Unknown error'));
                }
            } catch (error) {
                console.error('Login error:', error);
                alert('Login failed: ' + error.message); // BUGFIX: Provide feedback on error
            }
        });
    }

    if (signupForm) {
        signupForm.addEventListener('submit', async (e) => {
            e.preventDefault(); // BUGFIX: Prevent default form submission which causes page reload
            const username = e.target.username.value;
            const email = e.target.email.value;
            const password = e.target.password.value;

            try { // BUGFIX: Added basic try-catch for error handling
                const response = await fetch('/api/users/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, email, password })
                });

                // BUGFIX: Check if the request was successful
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const data = await response.json();
                // BUGFIX: Provide feedback
                alert('Signup successful! You can now log in.');
                // Optionally redirect to login or clear form
                window.location.href = '/'; // Redirect to home/login page
            } catch (error) {
                console.error('Signup error:', error);
                alert('Signup failed: ' + error.message); // BUGFIX: Provide feedback on error
            }
        });
    }
});