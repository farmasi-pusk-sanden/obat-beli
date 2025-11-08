// Login functionality dengan handling CORS
async function login(username, password) {
    try {
        console.log('Attempting login for user:', username);
        
        // Gunakan JSONP untuk login
        const result = await callAPIJsonp('login', { username, password }, 'POST');
        
        console.log('Login response:', result);
        
        if (result.status === 'success') {
            // Save authentication data
            localStorage.setItem('authToken', result.data.token);
            localStorage.setItem('userData', JSON.stringify(result.data.user));
            
            showNotification('Login berhasil! Mengalihkan...', 'success');
            
            // Redirect to dashboard after short delay
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1500);
            
            return true;
        } else {
            showNotification(result.message || 'Login gagal', 'error');
            return false;
        }
    } catch (error) {
        console.error('Login error:', error);
        
        // Fallback: coba dengan XHR
        try {
            console.log('Trying XHR fallback for login...');
            const result = await callAPIXHR('login', { username, password }, 'POST');
            
            if (result.status === 'success') {
                localStorage.setItem('authToken', result.data.token);
                localStorage.setItem('userData', JSON.stringify(result.data.user));
                showNotification('Login berhasil!', 'success');
                setTimeout(() => { window.location.href = 'index.html'; }, 1500);
                return true;
            } else {
                showNotification(result.message || 'Login gagal', 'error');
                return false;
            }
        } catch (xhrError) {
            console.error('XHR login also failed:', xhrError);
            showNotification('Gagal login: Tidak dapat terhubung ke server', 'error');
            return false;
        }
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
            
            if (!username || !password) {
                showNotification('Username dan password harus diisi', 'error');
                return;
            }
            
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
        // Verify token is still valid
        callAPI('checkAuth', { token: token })
            .then(result => {
                if (result.status === 'success' && result.data.authenticated) {
                    window.location.href = 'index.html';
                }
            })
            .catch(() => {
                // Jika checkAuth gagal, tetap di login page
                localStorage.removeItem('authToken');
                localStorage.removeItem('userData');
            });
    }
    
    // Demo account auto-fill for testing
    if (window.location.hostname === 'localhost' || window.location.hostname.includes('github.io')) {
        setupDemoAccounts();
    }
});

// Setup demo accounts for easy testing
function setupDemoAccounts() {
    const demoAccounts = [
        { username: 'admin', password: 'admin123', name: 'Administrator' },
        { username: 'putri', password: 'putri123', name: 'apt. Putri Nurul H, S.Farm' },
        { username: 'annisa', password: 'annisa123', name: 'Annisa Fauzia, A.Md.Farm' }
    ];
    
    // Add quick login buttons for demo
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        const demoSection = document.createElement('div');
        demoSection.className = 'mt-4 p-3 bg-light rounded';
        demoSection.innerHTML = `
            <h6 class="mb-3">Demo Accounts (Quick Login):</h6>
            <div class="d-grid gap-2">
                ${demoAccounts.map(account => `
                    <button type="button" class="btn btn-outline-primary btn-sm" 
                            onclick="fillDemoCredentials('${account.username}', '${account.password}')">
                        <i class="fas fa-user"></i> ${account.name}
                    </button>
                `).join('')}
            </div>
        `;
        
        loginForm.parentNode.insertBefore(demoSection, loginForm.nextSibling);
    }
}

// Fill demo credentials
function fillDemoCredentials(username, password) {
    document.getElementById('username').value = username;
    document.getElementById('password').value = password;
    document.getElementById('loginBtn').focus();
}