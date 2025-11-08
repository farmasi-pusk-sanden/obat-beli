// Konfigurasi Apps Script URL
const APP_SCRIPT_URL = 'https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec';

// Utility functions
class AppUtils {
    static showLoading() {
        const loading = document.getElementById('loading');
        if (loading) loading.classList.add('show');
    }

    static hideLoading() {
        const loading = document.getElementById('loading');
        if (loading) loading.classList.remove('show');
    }

    static showAlert(message, type = 'info', container = null) {
        const alertClass = {
            'success': 'alert-success',
            'error': 'alert-danger',
            'warning': 'alert-warning',
            'info': 'alert-info'
        }[type] || 'alert-info';

        const alertHTML = `
            <div class="alert ${alertClass} alert-dismissible fade show" role="alert">
                ${message}
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            </div>
        `;

        if (container) {
            container.innerHTML = alertHTML;
        } else {
            // Create temporary alert at top of page
            const alertDiv = document.createElement('div');
            alertDiv.innerHTML = alertHTML;
            document.body.prepend(alertDiv);
            
            // Auto remove after 5 seconds
            setTimeout(() => {
                alertDiv.remove();
            }, 5000);
        }
    }

    static formatCurrency(amount) {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(amount);
    }

    static formatNumber(number) {
        return new Intl.NumberFormat('id-ID').format(number);
    }

    static getCurrentDate() {
        return new Date().toISOString().split('T')[0];
    }

    static formatDate(dateString) {
        const options = { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        };
        return new Date(dateString).toLocaleDateString('id-ID', options);
    }

    static debounce(func, wait) {
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
}

// API Service Class
class ApiService {
    static async get(action, params = {}) {
        try {
            AppUtils.showLoading();
            
            let url = `${APP_SCRIPT_URL}?action=${action}`;
            if (params) {
                Object.keys(params).forEach(key => {
                    if (params[key]) {
                        url += `&${key}=${encodeURIComponent(params[key])}`;
                    }
                });
            }

            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            const data = await response.json();
            AppUtils.hideLoading();
            
            if (data.status === 'success') {
                return data.data;
            } else {
                throw new Error(data.message || 'Terjadi kesalahan');
            }
        } catch (error) {
            AppUtils.hideLoading();
            console.error('API Error:', error);
            throw error;
        }
    }

    static async post(action, data = {}) {
        try {
            AppUtils.showLoading();
            
            const response = await fetch(`${APP_SCRIPT_URL}?action=${action}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });

            const result = await response.json();
            AppUtils.hideLoading();
            
            if (result.status === 'success') {
                return result;
            } else {
                throw new Error(result.message || 'Terjadi kesalahan');
            }
        } catch (error) {
            AppUtils.hideLoading();
            console.error('API Error:', error);
            throw error;
        }
    }

    // Specific API methods
    static async getDaftarPenginput() {
        return await this.get('getDaftarPenginput');
    }

    static async getDaftarKategori() {
        return await this.get('getDaftarKategori');
    }

    static async getDaftarJenisTransaksi() {
        return await this.get('getDaftarJenisTransaksi');
    }

    static async cariDataObat(kodeObat) {
        return await this.get('cariDataObat', { kodeObat });
    }

    static async getAllObat() {
        return await this.get('getAllObat');
    }

    static async getDataLaporan() {
        return await this.get('getDataLaporan');
    }

    static async getSystemStatus() {
        return await this.get('getSystemStatus');
    }

    static async simpanTransaksiPembelian(data) {
        return await this.post('simpanTransaksiPembelian', data);
    }

    static async simpanTransaksiPengeluaran(data) {
        return await this.post('simpanTransaksiPengeluaran', data);
    }

    static async tambahObatBaru(data) {
        return await this.post('tambahObatBaru', data);
    }

    static async eksporLaporan(jenisLaporan, bulan, tahun, periode = 'bulanan') {
        return await this.post('eksporLaporan', {
            jenisLaporan,
            bulan,
            tahun,
            periode
        });
    }

    static async updateDashboard() {
        return await this.post('updateDashboard');
    }

    static async initializeSystem() {
        return await this.get('initialize');
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Check if App Script URL is configured
    if (APP_SCRIPT_URL.includes('YOUR_SCRIPT_ID')) {
        AppUtils.showAlert(
            'Silakan konfigurasi APP_SCRIPT_URL di file app.js dengan URL Web App Anda',
            'warning'
        );
    }

    // Add active class to current page in navigation
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.nav-link').forEach(link => {
        const linkPage = link.getAttribute('href');
        if (linkPage === currentPage) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });
});
