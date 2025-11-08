// Login functionality
async function login(username, password) {
    try {
        const result = await callAPI('login', { username, password }, 'POST');
        
        if (result.status === 'success') {
            // Save authentication data
            localStorage.setItem('authToken', result.data.token);
            localStorage.setItem('userData', JSON.stringify(result.data.user));
            
            showNotification('Login berhasil!', 'success');
            
            // Redirect to dashboard after short delay
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1000);
            
            return true;
        } else {
            showNotification(result.message, 'error');
            return false;
        }
    } catch (error) {
        showNotification('Gagal login: ' + error.message, 'error');
        return false;
    }
}

// Login form handler
document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;
            const loginBtn = document.getElementById('loginBtn');
            
            // Show loading state
            loginBtn.disabled = true;
            loginBtn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Logging in...';
            
            const success = await login(username, password);
            
            // Reset button state
            loginBtn.disabled = false;
            loginBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Login';
            
            if (!success) {
                // Clear password on failed login
                document.getElementById('password').value = '';
            }
        });
    }
    
    // Check if user is already logged in
    const token = localStorage.getItem('authToken');
    if (token && window.location.pathname.includes('login.html')) {
        window.location.href = 'index.html';
    }
});