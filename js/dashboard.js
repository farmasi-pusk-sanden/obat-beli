class Dashboard {
    static async loadDashboardData() {
        try {
            const data = await ApiService.getDataLaporan();
            this.updateQuickStats(data);
            this.updateAlerts(data);
            this.updateLastUpdate(data);
        } catch (error) {
            console.error('Error loading dashboard:', error);
            AppUtils.showAlert('Gagal memuat data dashboard: ' + error.message, 'error');
        }
    }

    static updateQuickStats(data) {
        const statsContainer = document.getElementById('quickStats');
        if (!statsContainer) return;

        const safeStock = data.totalObat - data.stokMenipis.length - data.stokHabis.length;

        statsContainer.innerHTML = `
            <div class="col-md-3">
                <div class="card stat-card border-primary">
                    <div class="card-body text-center">
                        <i class="fas fa-pills fa-2x text-primary mb-2"></i>
                        <h3>${AppUtils.formatNumber(data.totalObat)}</h3>
                        <p class="text-muted mb-0">Total Jenis Obat</p>
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="card stat-card border-success">
                    <div class="card-body text-center">
                        <i class="fas fa-cart-arrow-down fa-2x text-success mb-2"></i>
                        <h3>${AppUtils.formatCurrency(data.totalPembelianBulanIni)}</h3>
                        <p class="text-muted mb-0">Pembelian Bulan Ini</p>
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="card stat-card border-warning">
                    <div class="card-body text-center">
                        <i class="fas fa-sign-out-alt fa-2x text-warning mb-2"></i>
                        <h3>${AppUtils.formatNumber(data.totalPengeluaranBulanIni)}</h3>
                        <p class="text-muted mb-0">Pengeluaran Bulan Ini</p>
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="card stat-card border-info">
                    <div class="card-body text-center">
                        <i class="fas fa-check-circle fa-2x text-info mb-2"></i>
                        <h3>${AppUtils.formatNumber(safeStock)}</h3>
                        <p class="text-muted mb-0">Stok Aman</p>
                    </div>
                </div>
            </div>
        `;
    }

    static updateAlerts(data) {
        const menipisList = document.getElementById('stokMenipisList');
        const habisList = document.getElementById('stokHabisList');

        if (menipisList) {
            if (data.stokMenipis.length > 0) {
                menipisList.innerHTML = data.stokMenipis.map(obat => `
                    <div class="alert-stock warning p-3 mb-2 rounded">
                        <div class="d-flex justify-content-between align-items-center">
                            <div>
                                <strong>${obat[0]}</strong> - ${obat[1]}
                            </div>
                            <span class="badge bg-warning">Stok: ${obat[5]}</span>
                        </div>
                    </div>
                `).join('');
            } else {
                menipisList.innerHTML = `
                    <div class="text-center text-muted py-3">
                        <i class="fas fa-check-circle fa-2x mb-2"></i>
                        <p>Tidak ada stok menipis</p>
                    </div>
                `;
            }
        }

        if (habisList) {
            if (data.stokHabis.length > 0) {
                habisList.innerHTML = data.stokHabis.map(obat => `
                    <div class="alert-stock danger p-3 mb-2 rounded">
                        <div class="d-flex justify-content-between align-items-center">
                            <div>
                                <strong>${obat[0]}</strong> - ${obat[1]}
                            </div>
                            <span class="badge bg-danger">Habis</span>
                        </div>
                    </div>
                `).join('');
            } else {
                habisList.innerHTML = `
                    <div class="text-center text-muted py-3">
                        <i class="fas fa-check-circle fa-2x mb-2"></i>
                        <p>Tidak ada stok habis</p>
                    </div>
                `;
            }
        }
    }

    static updateLastUpdate(data) {
        const lastUpdateElement = document.getElementById('lastUpdate');
        if (lastUpdateElement) {
            lastUpdateElement.textContent = data.lastUpdate;
        }
    }

    static async checkSystemStatus() {
        try {
            const status = await ApiService.getSystemStatus();
            const statusElement = document.getElementById('systemStatus');
            
            if (statusElement) {
                const badgeClass = status.systemStatus === 'healthy' ? 'bg-success' : 
                                 status.systemStatus === 'initialized' ? 'bg-info' : 'bg-warning';
                
                statusElement.className = `badge ${badgeClass}`;
                statusElement.textContent = status.systemStatus === 'healthy' ? 'Online' : 
                                          status.systemStatus === 'initialized' ? 'Terkonfigurasi' : 'Perlu Setup';
            }
        } catch (error) {
            console.error('Error checking system status:', error);
        }
    }
}

// Initialize dashboard when page loads
document.addEventListener('DOMContentLoaded', function() {
    if (window.location.pathname.endsWith('index.html') || 
        window.location.pathname.endsWith('/')) {
        Dashboard.loadDashboardData();
        Dashboard.checkSystemStatus();
        
        // Auto-refresh every 2 minutes
        setInterval(() => {
            Dashboard.loadDashboardData();
            Dashboard.checkSystemStatus();
        }, 120000);
    }
});
