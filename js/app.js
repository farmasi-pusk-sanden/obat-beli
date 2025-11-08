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

// Generic API call function - FIXED CORS VERSION
async function callAPI(action, data = null, method = 'GET') {
    const url = new URL(APP_SCRIPT_URL);
    
    try {
        let requestOptions = {
            method: method,
            mode: 'no-cors', // Important for CORS
            headers: {
                'Content-Type': 'application/json',
            },
            redirect: 'follow',
            referrerPolicy: 'no-referrer'
        };

        if (method === 'POST' && data) {
            // Untuk POST, gunakan form data atau URL encoded
            const formData = new URLSearchParams();
            formData.append('action', action);
            
            // Add all data properties
            for (const key in data) {
                if (data[key] !== null && data[key] !== undefined) {
                    formData.append(key, data[key]);
                }
            }
            
            requestOptions.body = formData;
            
            // Untuk POST, kita gunakan URL dengan parameter juga sebagai fallback
            url.searchParams.append('action', action);
            for (const key in data) {
                if (data[key] !== null && data[key] !== undefined) {
                    url.searchParams.append(key, data[key]);
                }
            }
        } else {
            // Untuk GET, tambahkan parameter ke URL
            url.searchParams.append('action', action);
            if (data) {
                for (const key in data) {
                    if (data[key] !== null && data[key] !== undefined) {
                        url.searchParams.append(key, data[key]);
                    }
                }
            }
        }

        console.log('API Request:', { action, method, url: url.toString(), data });
        
        let response;
        
        if (method === 'POST') {
            // Untuk POST, coba beberapa approach
            try {
                // Approach 1: JSONP untuk POST (dengan callback)
                if (action === 'login' || action === 'simpanTransaksiPembelian' || action === 'simpanTransaksiPengeluaran') {
                    return await callAPIJsonp(action, data, method);
                }
                
                // Approach 2: Fetch dengan no-cors
                response = await fetch(url.toString(), requestOptions);
                
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                
                // Dengan no-cors, kita tidak bisa membaca response body
                // Jadi kita anggap berhasil untuk sekarang
                return { status: "success", message: "Request sent successfully" };
                
            } catch (postError) {
                console.log('POST approach failed, trying JSONP:', postError);
                return await callAPIJsonp(action, data, method);
            }
        } else {
            // Untuk GET, gunakan JSONP
            return await callAPIJsonp(action, data, method);
        }
        
    } catch (error) {
        console.error('API call error:', error);
        return {
            status: "error",
            message: "Gagal terhubung ke server: " + error.message
        };
    }
}

// JSONP implementation for CORS bypass
function callAPIJsonp(action, data = null, method = 'GET') {
    return new Promise((resolve, reject) => {
        const callbackName = 'jsonp_callback_' + Math.round(100000 * Math.random());
        const url = new URL(APP_SCRIPT_URL);
        
        // Add parameters
        url.searchParams.append('action', action);
        url.searchParams.append('callback', callbackName);
        
        if (data) {
            for (const key in data) {
                if (data[key] !== null && data[key] !== undefined) {
                    url.searchParams.append(key, data[key]);
                }
            }
        }
        
        // Create script element
        const script = document.createElement('script');
        script.src = url.toString();
        
        // Define callback function
        window[callbackName] = function(response) {
            delete window[callbackName];
            document.body.removeChild(script);
            resolve(response);
        };
        
        // Error handling
        script.onerror = function() {
            delete window[callbackName];
            document.body.removeChild(script);
            reject(new Error('JSONP request failed'));
        };
        
        // Add to document
        document.body.appendChild(script);
        
        // Timeout after 30 seconds
        setTimeout(() => {
            if (window[callbackName]) {
                delete window[callbackName];
                document.body.removeChild(script);
                reject(new Error('JSONP timeout'));
            }
        }, 30000);
    });
}

// Alternative API call using XMLHttpRequest (for older browsers)
function callAPIXHR(action, data = null, method = 'GET') {
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        const url = new URL(APP_SCRIPT_URL);
        
        if (method === 'GET') {
            url.searchParams.append('action', action);
            if (data) {
                for (const key in data) {
                    if (data[key] !== null && data[key] !== undefined) {
                        url.searchParams.append(key, data[key]);
                    }
                }
            }
            
            xhr.open('GET', url.toString());
            xhr.onload = function() {
                if (xhr.status === 200) {
                    try {
                        const response = JSON.parse(xhr.responseText);
                        resolve(response);
                    } catch (e) {
                        reject(new Error('Invalid JSON response'));
                    }
                } else {
                    reject(new Error(`HTTP error! status: ${xhr.status}`));
                }
            };
            xhr.onerror = function() {
                reject(new Error('Network error'));
            };
            xhr.send();
        } else {
            // POST request dengan form data
            const formData = new FormData();
            formData.append('action', action);
            
            if (data) {
                for (const key in data) {
                    if (data[key] !== null && data[key] !== undefined) {
                        formData.append(key, data[key]);
                    }
                }
            }
            
            xhr.open('POST', url.toString());
            xhr.onload = function() {
                if (xhr.status === 200) {
                    try {
                        const response = JSON.parse(xhr.responseText);
                        resolve(response);
                    } catch (e) {
                        reject(new Error('Invalid JSON response'));
                    }
                } else {
                    reject(new Error(`HTTP error! status: ${xhr.status}`));
                }
            };
            xhr.onerror = function() {
                reject(new Error('Network error'));
            };
            xhr.send(formData);
        }
    });
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
    
    // Auto-remove success messages after 5 seconds
    if (type === 'success') {
        setTimeout(() => {
            const alert = document.querySelector('.alert-success');
            if (alert) {
                alert.remove();
            }
        }, 5000);
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
    if (!dateString) return '-';
    const options = { 
        day: '2-digit', 
        month: '2-digit', 
        year: 'numeric',
        timeZone: 'Asia/Jakarta'
    };
    return new Date(dateString).toLocaleDateString('id-ID', options);
}

// Format datetime
function formatDateTime(dateString) {
    if (!dateString) return '-';
    const options = { 
        day: '2-digit', 
        month: '2-digit', 
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
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
        const result = await callAPI('initialize');
        
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
    const token = localStorage.getItem('authToken');
    if (token) {
        // Panggil API logout jika diperlukan
        callAPI('logout', { token: token }, 'POST').catch(console.error);
    }
    
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
    window.location.href = 'login.html';
}

// Check if online
function isOnline() {
    return navigator.onLine;
}

// Offline handler
function setupOfflineHandler() {
    window.addEventListener('online', function() {
        showNotification('Koneksi internet tersambung kembali', 'success');
    });
    
    window.addEventListener('offline', function() {
        showNotification('Anda sedang offline. Beberapa fitur mungkin tidak berfungsi.', 'warning');
    });
}

// Initialize offline handler
setupOfflineHandler();

// Utility function to get query parameters
function getQueryParam(name) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(name);
}

// Utility function to debounce API calls
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Export functions for global use
window.APP_CONFIG = {
    APP_SCRIPT_URL,
    callAPI,
    callAPIJsonp,
    callAPIXHR,
    formatCurrency,
    formatDate,
    formatDateTime,
    showNotification,
    logout
};