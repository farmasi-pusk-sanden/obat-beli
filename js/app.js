// Konfigurasi Apps Script Web App URL
const APP_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzHCYvpw5doDLFKsW65iCu-XAbiqriZuRv9e1XGuQ3xX19mJu-imIK_FmW5guv_0OBb/exec';

// State management
let currentUser = null;
let systemData = {};

// Initialize app
document.addEventListener('DOMContentLoaded', function() {
    checkAuthentication();
    initializeApp();
});

// Check if user is authenticated
function checkAuthentication() {
    const token = localStorage.getItem('authToken');
    const userData = localStorage.getItem('userData');
    
    if (!token || !userData) {
        redirectToLogin();
        return;
    }
    
    try {
        currentUser = JSON.parse(userData);
        updateUserInterface();
    } catch (error) {
        console.error('Error parsing user data:', error);
        redirectToLogin();
    }
}

// Redirect to login page
function redirectToLogin() {
    if (!window.location.pathname.includes('login.html')) {
        window.location.href = 'login.html';
    }
}

// Update UI based on user role
function updateUserInterface() {
    const userInfoElement = document.getElementById('userInfo');
    if (userInfoElement && currentUser) {
        userInfoElement.textContent = `Selamat datang, ${currentUser.nama}`;
    }
}

// Generic API call function (diperbaiki)
async function callAPI(action, data = null, method = 'GET') {
    const url = new URL(APP_SCRIPT_URL);
    url.searchParams.append('action', action);
    
    const controller = new AbortController(); // Untuk timeout
    const timeoutId = setTimeout(() => controller.abort(), 10000); // Timeout 10 detik
    
    try {
        let response;
        if (method === 'GET') {
            response = await fetch(url.toString(), {
                method: 'GET',
                mode: 'cors', // Explicit CORS mode
                signal: controller.signal // Tambah signal untuk abort
            });
        } else {
            response = await fetch(url.toString(), {
                method: 'POST',
                mode: 'cors',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
                redirect: 'follow', // Ikuti redirect jika ada
                signal: controller.signal
            });
        }
        
        clearTimeout(timeoutId); // Clear timeout jika sukses
        
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status} - ${response.statusText}`);
        }
        
        const result = await response.json();
        return result;
    } catch (error) {
        if (error.name === 'AbortError') {
            console.error('API call timed out');
            return { status: 'error', message: 'Request timed out' };
        }
        console.error('API call error:', error.message); // Log detail error
        return {
            status: 'error',
            message: 'Gagal terhubung ke server: ' + error.message
        };
    }
}

// Show notification
function showNotification(message, type = 'info') {
    // Remove existing notifications
    const existingAlerts = document.querySelectorAll('.alert-dismissible');
    existingAlerts.forEach(alert => alert.remove());
    
    const alertClass = {
        'success': 'alert-success',
        'error': 'alert-danger',
        'warning': 'alert-warning',
        'info': 'alert-info'
    }[type] || 'alert-info';
    
    const alertHtml = `
        <div class="alert ${alertClass} alert-dismissible fade show" role="alert">
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        </div>
    `;
    
    const alertSection = document.getElementById('alertSection');
    if (alertSection) {
        alertSection.innerHTML = alertHtml;
    } else {
        // Create temporary alert at top of page
        const container = document.querySelector('.container-fluid') || document.querySelector('.container');
        if (container) {
            container.insertAdjacentHTML('afterbegin', alertHtml);
        }
    }
}

// Format currency
function formatCurrency(amount) {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0
    }).format(amount);
}

// Format date
function formatDate(dateString) {
    const options = {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        timeZone: 'Asia/Jakarta'
    };
    return new Date(dateString).toLocaleDateString('id-ID', options);
}

// Initialize app data
async function initializeApp() {
    try {
        // Check system status
        const status = await callAPI('getSystemStatus');
        if (status.status === 'success') {
            systemData = status.data;
            
            // If system needs setup, show notification to admin
            if (systemData.systemStatus === 'needs_setup' && currentUser?.role === 'admin') {
                showNotification(
                    'Sistem perlu diinisialisasi. <a href="#" onclick="initializeSystem()">Klik di sini untuk setup</a>',
                    'warning'
                );
            }
        }
    } catch (error) {
        console.error('Error initializing app:', error);
    }
}

// Initialize system (admin only)
async function initializeSystem() {
    if (currentUser?.role !== 'admin') {
        showNotification('Hanya administrator yang dapat menginisialisasi sistem.', 'error');
        return;
    }
    
    try {
        showNotification('Menginisialisasi sistem...', 'info');
        const result = await callAPI('initialize');  // Asumsi ini GET; jika perlu ubah ke POST, tambah parameter method='POST'
        
        if (result.status === 'success') {
            showNotification('Sistem berhasil diinisialisasi!', 'success');
            // Reload page after 2 seconds
            setTimeout(() => location.reload(), 2000);
        } else {
            showNotification('Gagal menginisialisasi sistem: ' + result.message, 'error');
        }
    } catch (error) {
        showNotification('Error: ' + error.message, 'error');
    }
}

// Logout function
function logout() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
    window.location.href = 'login.html';
}