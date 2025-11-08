class LaporanManager {
    static dataTable = null;

    static async init() {
        await this.loadLaporanData();
        this.generateYearOptions();
        this.setupEventListeners();
        
        // Auto-refresh every 5 minutes
        setInterval(() => {
            this.loadLaporanData();
        }, 300000);
    }

    static async loadLaporanData() {
        try {
            const data = await ApiService.getDataLaporan();
            this.updateStatistics(data);
            this.renderDashboardTable(data);
            this.updateLastUpdate(data);
        } catch (error) {
            console.error('Error loading laporan data:', error);
            AppUtils.showAlert('Gagal memuat data laporan: ' + error.message, 'error');
        }
    }

    static updateStatistics(data) {
        document.getElementById('totalObatLaporan').textContent = AppUtils.formatNumber(data.totalObat);
        document.getElementById('totalPembelianLaporan').textContent = AppUtils.formatCurrency(data.totalPembelianBulanIni);
        document.getElementById('totalPengeluaranLaporan').textContent = AppUtils.formatNumber(data.totalPengeluaranBulanIni);
        document.getElementById('totalStokMenipisLaporan').textContent = AppUtils.formatNumber(data.stokMenipis.length);
    }

    static renderDashboardTable(data) {
        const tableBody = document.querySelector('#tabelDashboard tbody');
        
        if (!tableBody) return;

        // Clear existing data
        tableBody.innerHTML = '';

        // Combine all drug data for dashboard
        const allDrugs = data.stokMenipis.concat(data.stokHabis);
        
        // Add sample safe drugs for demonstration
        allDrugs.push(...this.getSampleDrugs());

        allDrugs.forEach(obat => {
            const status = this.getStatus(obat[4], obat[5]); // stokMin, stok
            const statusBadge = this.getStatusBadge(status);
            
            const row = document.createElement('tr');
            row.innerHTML = `
                <td><strong>${obat[0]}</strong></td>
                <td>${obat[1]}</td>
                <td>${obat[2]}</td>
                <td class="text-center">${AppUtils.formatNumber(obat[4])}</td>
                <td class="text-center">
                    <span class="fw-bold ${this.getStockColorClass(obat[4], obat[5])}">
                        ${AppUtils.formatNumber(obat[5])}
                    </span>
                </td>
                <td>${statusBadge}</td>
            `;
            tableBody.appendChild(row);
        });

        // Initialize DataTable if not already initialized
        if (!this.dataTable) {
            this.dataTable = $('#tabelDashboard').DataTable({
                language: {
                    url: '//cdn.datatables.net/plug-ins/1.13.6/i18n/id.json'
                },
                pageLength: 10,
                order: [[5, 'asc']], // Sort by status
                columnDefs: [
                    {
                        targets: 5, // Status column
                        render: function(data, type, row) {
                            if (type === 'sort') {
                                // Return sortable values for status
                                const statusOrder = { 'Aman': 0, 'Perhatian': 1, 'Menipis': 2, 'Habis': 3 };
                                return statusOrder[data.replace(/<[^>]*>/g, '')] || 0;
                            }
                            return data;
                        }
                    }
                ]
            });
        } else {
            this.dataTable.destroy();
            this.dataTable = $('#tabelDashboard').DataTable({
                language: {
                    url: '//cdn.datatables.net/plug-ins/1.13.6/i18n/id.json'
                },
                pageLength: 10,
                order: [[5, 'asc']],
                columnDefs: [
                    {
                        targets: 5,
                        render: function(data, type, row) {
                            if (type === 'sort') {
                                const statusOrder = { 'Aman': 0, 'Perhatian': 1, 'Menipis': 2, 'Habis': 3 };
                                return statusOrder[data.replace(/<[^>]*>/g, '')] || 0;
                            }
                            return data;
                        }
                    }
                ]
            });
        }
    }

    static getStatus(stokMin, stok) {
        stokMin = parseInt(stokMin) || 0;
        stok = parseInt(stok) || 0;

        if (stok === 0) return 'habis';
        if (stok <= stokMin) return 'menipis';
        if (stok <= stokMin * 1.5) return 'perhatian';
        return 'aman';
    }

    static getStatusBadge(status) {
        const badges = {
            'aman': '<span class="badge bg-success">Aman</span>',
            'perhatian': '<span class="badge bg-warning">Perhatian</span>',
            'menipis': '<span class="badge bg-danger">Menipis</span>',
            'habis': '<span class="badge bg-dark">Habis</span>'
        };
        return badges[status] || badges['aman'];
    }

    static getStockColorClass(stokMin, stok) {
        const status = this.getStatus(stokMin, stok);
        const colors = {
            'aman': 'text-success',
            'perhatian': 'text-warning',
            'menipis': 'text-danger',
            'habis': 'text-dark'
        };
        return colors[status] || 'text-success';
    }

    static getSampleDrugs() {
        return [
            ['OB-001', 'Paracetamol 500mg', 'Obat Dalam', 'Tablet', 100, 150],
            ['OB-002', 'Amoxicillin 500mg', 'Obat Dalam', 'Kapsul', 80, 120],
            ['OB-003', 'Vitamin C 500mg', 'Obat Dalam', 'Tablet', 50, 75],
            ['OB-004', 'CTM 4mg', 'Obat Dalam', 'Tablet', 60, 40],
            ['OL-001', 'Salep Luka', 'Obat Luar', 'Tube', 50, 30],
            ['OL-002', 'Povidone Iodine', 'Obat Luar', 'Botol', 30, 45],
            ['OL-003', 'Minyak Kayu Putih', 'Obat Luar', 'Botol', 40, 60],
            ['BM-001', 'Sarung Tangan Steril', 'Barang Medis Habis Pakai', 'Pasang', 200, 180],
            ['BM-002', 'Masker Bedah', 'Barang Medis Habis Pakai', 'Pcs', 500, 350]
        ];
    }

    static generateYearOptions() {
        const tahunSelect = document.getElementById('tahunLaporan');
        const currentYear = new Date().getFullYear();
        
        let options = '';
        for (let year = currentYear; year >= currentYear - 5; year--) {
            options += `<option value="${year}">${year}</option>`;
        }
        
        tahunSelect.innerHTML = options;
        tahunSelect.value = currentYear;

        // Set current month as default
        const currentMonth = new Date().getMonth() + 1;
        document.getElementById('bulanLaporan').value = currentMonth;
    }

    static setupEventListeners() {
        document.getElementById('exportForm')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.exportLaporan();
        });
    }

    static async exportLaporan() {
        const jenisLaporan = document.getElementById('jenisLaporan')?.value;
        const periode = document.getElementById('periodeLaporan')?.value;
        const bulan = document.getElementById('bulanLaporan')?.value;
        const tahun = document.getElementById('tahunLaporan')?.value;

        if (!jenisLaporan) {
            AppUtils.showAlert('Pilih jenis laporan terlebih dahulu', 'warning');
            return;
        }

        try {
            const result = await ApiService.eksporLaporan(jenisLaporan, bulan, tahun, periode);
            
            if (result.status === 'success') {
                // Open download URL in new tab
                window.open(result.data.downloadUrl, '_blank');
                AppUtils.showAlert(
                    `Laporan berhasil diexport: ${result.data.fileName}`,
                    'success',
                    document.getElementById('resultAlert')
                );
            } else {
                AppUtils.showAlert(result.message, 'error', document.getElementById('resultAlert'));
            }
        } catch (error) {
            AppUtils.showAlert(error.message, 'error', document.getElementById('resultAlert'));
        }
    }

    static updateLastUpdate(data) {
        const lastUpdateElement = document.getElementById('lastUpdateLaporan');
        if (lastUpdateElement) {
            lastUpdateElement.textContent = data.lastUpdate;
        }
    }

    static async refreshData() {
        await this.loadLaporanData();
        AppUtils.showAlert('Data laporan berhasil diperbarui', 'success');
    }

    static async updateDashboard() {
        try {
            const result = await ApiService.updateDashboard();
            AppUtils.showAlert(result.message, 'success', document.getElementById('resultAlert'));
            await this.loadLaporanData();
        } catch (error) {
            AppUtils.showAlert(error.message, 'error', document.getElementById('resultAlert'));
        }
    }

    static lihatStokMenipis() {
        // Filter table to show only low stock items
        if (this.dataTable) {
            this.dataTable.search('menipis').draw();
            AppUtils.showAlert('Menampilkan obat dengan stok menipis', 'info');
        }
    }
}

// Initialize laporan manager
document.addEventListener('DOMContentLoaded', function() {
    if (window.location.pathname.endsWith('laporan.html')) {
        LaporanManager.init();
    }
});
