// Konfigurasi Aplikasi
const CONFIG = {
    APP_NAME: 'Sistem Pengelolaan Obat - Puskesmas Sanden',
    API_URL: 'https://script.google.com/macros/s/AKfycbyVUcH_KNU-LuMRin-aTwa1w7fc1gje8AmkgltgEsYNgF5KI5knCubT_p5uMaRYlRY/exec', // Ganti dengan URL Web App Anda
    VERSION: '3.0'
};

// State Management
class AppState {
    constructor() {
        this.currentUser = null;
        this.currentModule = 'dashboard';
        this.token = localStorage.getItem('authToken');
        this.userData = JSON.parse(localStorage.getItem('userData') || 'null');
    }

    setUser(userData, token) {
        this.currentUser = userData;
        this.token = token;
        this.userData = userData;
        localStorage.setItem('authToken', token);
        localStorage.setItem('userData', JSON.stringify(userData));
    }

    clearUser() {
        this.currentUser = null;
        this.token = null;
        this.userData = null;
        localStorage.removeItem('authToken');
        localStorage.removeItem('userData');
    }

    isAuthenticated() {
        return !!this.token && !!this.userData;
    }
}

// Global State Instance
const appState = new AppState();

// API Service
class ApiService {
    constructor() {
        this.baseUrl = CONFIG.API_URL;
    }

    async request(endpoint, options = {}) {
        const url = `${this.baseUrl}?action=${endpoint}`;
        
        const config = {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
            ...options
        };

        // Add token to request if available
        if (appState.token) {
            config.url = `${url}&token=${appState.token}`;
        }

        try {
            showLoading();
            const response = await fetch(url, config);
            const data = await response.json();
            hideLoading();
            
            if (data.status === 'error') {
                throw new Error(data.message);
            }
            
            return data;
        } catch (error) {
            hideLoading();
            showNotification(error.message, 'error');
            throw error;
        }
    }

    async get(endpoint, params = {}) {
        const queryString = new URLSearchParams(params).toString();
        const url = queryString ? `${endpoint}&${queryString}` : endpoint;
        return this.request(url);
    }

    async post(endpoint, data) {
        return this.request(endpoint, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }
}

// Global API Instance
const api = new ApiService();

// UI Utilities
function showNotification(message, type = 'success') {
    const notifications = document.getElementById('notifications');
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    notifications.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 5000);
}

function showLoading() {
    document.getElementById('loading-overlay').classList.add('active');
}

function hideLoading() {
    document.getElementById('loading-overlay').classList.remove('active');
}

function formatNumber(number) {
    return new Intl.NumberFormat('id-ID').format(number);
}

function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('id-ID');
}

// Module Management
class ModuleManager {
    constructor() {
        this.modules = new Map();
        this.currentModule = null;
    }

    registerModule(name, module) {
        this.modules.set(name, module);
    }

    async loadModule(name) {
        if (this.currentModule === name) return;
        
        try {
            showLoading();
            
            // Load module HTML
            const response = await fetch(`modules/${name}.html`);
            const html = await response.text();
            
            // Update container
            const container = document.getElementById('module-container');
            container.innerHTML = html;
            
            // Load module CSS
            this.loadCSS(`modules/${name}.css`);
            
            // Load and initialize module JS
            const moduleScript = await import(`modules/${name}.js`);
            if (moduleScript.default && typeof moduleScript.default.init === 'function') {
                await moduleScript.default.init();
            }
            
            // Update navigation
            this.updateNavigation(name);
            
            this.currentModule = name;
            hideLoading();
            
        } catch (error) {
            hideLoading();
            console.error(`Failed to load module ${name}:`, error);
            showNotification(`Gagal memuat modul ${name}`, 'error');
        }
    }

    loadCSS(href) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = href;
        document.head.appendChild(link);
    }

    updateNavigation(activeModule) {
        // Remove active class from all nav items
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });
        
        // Add active class to current module
        const activeNav = document.querySelector(`[data-module="${activeModule}"]`);
        if (activeNav) {
            activeNav.classList.add('active');
        }
    }
}

// Global Module Manager
const moduleManager = new ModuleManager();

// Authentication Management
class AuthManager {
    constructor() {
        this.initializeEventListeners();
        this.checkAuthStatus();
    }

    initializeEventListeners() {
        // Login form
        document.getElementById('login-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleLogin();
        });

        // Logout button
        document.getElementById('logout-btn').addEventListener('click', () => {
            this.handleLogout();
        });
    }

    async handleLogin() {
        const formData = new FormData(document.getElementById('login-form'));
        const credentials = {
            username: formData.get('username'),
            password: formData.get('password')
        };

        try {
            const result = await api.post('login', credentials);
            
            if (result.status === 'success') {
                appState.setUser(result.data.user, result.data.token);
                showNotification('Login berhasil!', 'success');
                this.showMainApp();
            }
        } catch (error) {
            showNotification('Login gagal: ' + error.message, 'error');
        }
    }

    handleLogout() {
        appState.clearUser();
        this.showLoginScreen();
        showNotification('Logout berhasil', 'success');
    }

    checkAuthStatus() {
        if (appState.isAuthenticated()) {
            this.showMainApp();
        } else {
            this.showLoginScreen();
        }
    }

    showMainApp() {
        document.getElementById('login-screen').classList.remove('active');
        document.getElementById('main-app').classList.add('active');
        
        // Update user info
        document.getElementById('current-user').textContent = appState.userData.nama;
        
        // Load default module
        moduleManager.loadModule('dashboard');
    }

    showLoginScreen() {
        document.getElementById('main-app').classList.remove('active');
        document.getElementById('login-screen').classList.add('active');
        
        // Clear login form
        document.getElementById('login-form').reset();
    }
}

// Navigation Management
class NavigationManager {
    constructor() {
        this.initializeEventListeners();
    }

    initializeEventListeners() {
        // Sidebar navigation
        document.addEventListener('click', (e) => {
            const navItem = e.target.closest('.nav-item');
            if (navItem && navItem.dataset.module) {
                e.preventDefault();
                moduleManager.loadModule(navItem.dataset.module);
            }
        });

        // Sidebar toggle for mobile
        document.getElementById('sidebar-toggle').addEventListener('click', () => {
            document.getElementById('sidebar').classList.toggle('active');
        });

        // Close sidebar when clicking on main content on mobile
        document.querySelector('.main-content').addEventListener('click', () => {
            if (window.innerWidth <= 768) {
                document.getElementById('sidebar').classList.remove('active');
            }
        });
    }
}

// Application Initialization
class App {
    constructor() {
        this.init();
    }

    async init() {
        try {
            // Initialize managers
            new AuthManager();
            new NavigationManager();

            // Check system status
            await this.checkSystemStatus();

            console.log('Aplikasi berhasil diinisialisasi');
        } catch (error) {
            console.error('Gagal menginisialisasi aplikasi:', error);
            showNotification('Gagal menginisialisasi aplikasi', 'error');
        }
    }

    async checkSystemStatus() {
        try {
            const status = await api.get('getSystemStatus');
            console.log('Status sistem:', status);
            
            if (status.data.systemStatus === 'needs_setup') {
                showNotification('Sistem perlu diinisialisasi', 'warning');
            }
        } catch (error) {
            console.warn('Tidak dapat memeriksa status sistem:', error);
        }
    }
}

// Initialize application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new App();
});

// Export for module use
window.appState = appState;
window.api = api;
window.moduleManager = moduleManager;
window.showNotification = showNotification;
window.formatNumber = formatNumber;
window.formatDate = formatDate;