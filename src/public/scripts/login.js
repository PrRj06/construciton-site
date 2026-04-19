// public/scripts/login.js
// Handles login form logic: role switching, API call, redirect

// Tracks which role is currently selected on the tab
let selectedRole = 'user';

// ─────────────────────────────────────────────
// SWITCH ROLE TAB
// When user clicks "User Login" or "Admin Login"
// ─────────────────────────────────────────────
function switchRole(role) {
  selectedRole = role;

  // Update tab button styles
  document.getElementById('tab-user').classList.remove('active');
  document.getElementById('tab-admin').classList.remove('active');
  document.getElementById('tab-' + role).classList.add('active');

  // Update the role label inside the card
  const label = role === 'admin' ? 'Admin' : 'User';
  document.getElementById('roleLabel').innerHTML =
    'Logging in as: <strong>' + label + '</strong>';

  // Clear any previous messages and inputs
  document.getElementById('username').value = '';
  document.getElementById('password').value = '';
  document.getElementById('loginMessage').className = 'message hidden';
}


// ─────────────────────────────────────────────
// FORM SUBMIT - LOGIN
// Sends credentials to POST /login on the server
// ─────────────────────────────────────────────
document.getElementById('loginForm').addEventListener('submit', async function (e) {
  e.preventDefault(); // Stop default form submit (page reload)

  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value.trim();

  // Client-side validation
  if (!username || !password) {
    showLoginMessage('⚠️ Please enter both username and password.', 'error');
    return;
  }

  // Disable button while request is in progress
  const btn = document.getElementById('loginBtn');
  btn.textContent = 'Logging in...';
  btn.disabled = true;

  try {
    // POST /login → send role, username, password to server
    const response = await fetch('/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: selectedRole, username, password })
    });

    const result = await response.json();

    if (response.ok) {
      // ✅ Login successful
      // Save role in localStorage so index.html can read it
      localStorage.setItem('role', result.role);
      localStorage.setItem('username', username);

      showLoginMessage('✅ Login successful! Redirecting...', 'success');

      // Redirect to main page after short delay
      setTimeout(function () {
        window.location.href = '/index.html';
      }, 1000);

    } else {
      // ❌ Wrong credentials
      showLoginMessage('❌ ' + result.message, 'error');
      btn.textContent = 'Login';
      btn.disabled = false;
    }

  } catch (error) {
    console.error('Login error:', error);
    showLoginMessage('❌ Cannot connect to server. Is it running?', 'error');
    btn.textContent = 'Login';
    btn.disabled = false;
  }
});


// ─────────────────────────────────────────────
// SHOW MESSAGE HELPER
// ─────────────────────────────────────────────
function showLoginMessage(text, type) {
  const el = document.getElementById('loginMessage');
  el.textContent = text;
  el.className = 'message ' + type;
}
