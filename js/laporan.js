// Laporan functionality
let trendChart = null;
let kategoriChart = null;
let exportModal = null;

// Initialize laporan page
async function initializeLaporan() {
    await loadReportData();
    setupEventListeners();
    
    // Initialize modal
    exportModal = new bootstrap.Modal(document.getElementById('exportModal'));
    
    // Populate tahun dropdown
    populateTahunDropdown();
}

// Load report data
async function loadReportData() {
    try {
        showLoadingState(true);
        
        const result = await callAPI('getDataLaporan');
        
        if (result.status === 'success') {
            updateReportStats(result.data);
            updateCharts(result.data);
            updateActivityTable(result.data);
        } else {
            showNotification('Gagal memuat data laporan: ' + result.message, 'error');
        }
    } catch (error) {
        showNotification('Error: ' + error.message, 'error');
    } finally {
        showLoadingState(false);
    }
}

// Update report statistics
function updateReportStats(data) {
    // Quick stats
    document.getElementById('totalObatReport').textContent = data.totalObat || 0;
    document.getElementById('pembelianBulanIniReport').textContent = formatCurrency(data.totalPembelianBulanIni || 0);
    document.getElementById('pengeluaranBulanIniReport').textContent = (data.totalPengeluaranBulanIni || 0) + ' items';
    
    // PRB ratio
    const totalPembelian = data.totalPRBBulanIni + data.totalNonPRBBulanIni;
    if (totalPembelian > 0) {
        const prbPercentage = Math.round((data.totalPRBBulanIni / totalPembelian) * 100);
        document.getElementById('prbRatioReport').textContent = `${prbPercentage}% PRB`;
    }
    
    // Report cards
    document.getElementById('totalPembelian').textContent = (data.totalTransaksiPembelian || 0) + ' Transaksi';
    document.getElementById('totalPengeluaran').textContent = (data.totalTransaksiPengeluaran || 0) + ' Transaksi';
    document.getElementById('totalStokItems').textContent = (data.totalObat || 0) + ' Items';
    
    // PRB percentages
    if (data.totalPembelianBulanIni > 0) {
        const prbPercent = Math.round((data.totalPRBBulanIni / data.totalPembelianBulanIni) * 100);
        const nonPrbPercent = Math.round((data.totalNonPRBBulanIni / data.totalPembelianBulanIni) * 100);
        document.getElementById('prbPercentage').innerHTML = `<i class="fas fa-arrow-up"></i> ${prbPercent}% PRB`;
        document.getElementById('nonPrbPercentage').textContent = `${nonPrbPercent}% NON-PRB`;
    }
    
    // Pengeluaran by category
    if (data.pengeluaranKategori) {
        document.getElementById('pengeluaranObatDalam').textContent = data.pengeluaranKategori['Obat Dalam'] || 0;
        document.getElementById('pengeluaranObatLuar').textContent = data.pengeluaranKategori['Obat Luar'] || 0;
    }
    
    // Stock alerts
    document.getElementById('stokHabisCount').textContent = data.stokHabis?.length || 0;
    document.getElementById('stokMenipisCount').textContent = data.stokMenipis?.length || 0;
}

// Update charts
function updateCharts(data) {
    updateTrendChart(data.chartData);
    updateKategoriChart(data.pengeluaranKategori);
}

// Update trend chart
function updateTrendChart(chartData) {
    const ctx = document.getElementById('trendChart');
    if (!ctx) return;
    
    if (trendChart) {
        trendChart.destroy();
    }
    
    trendChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: chartData.pembelian.labels,
            datasets: [
                {
                    label: 'Pembelian (Rp)',
                    data: chartData.pembelian.data,
                    borderColor: '#4e73df',
                    backgroundColor: 'rgba(78, 115, 223, 0.05)',
                    fill: true,
                    tension: 0.4,
                    yAxisID: 'y'
                },
                {
                    label: 'Pengeluaran (Qty)',
                    data: chartData.pengeluaran.data,
                    borderColor: '#1cc88a',
                    backgroundColor: 'rgba(28, 200, 138, 0.05)',
                    fill: true,
                    tension: 0.4,
                    yAxisID: 'y1'
                }
            ]
        },
        options: {
            maintainAspectRatio: false,
            interaction: {
                intersect: false,
                mode: 'index'
            },
            scales: {
                x: {
                    grid: {
                        display: false
                    }
                },
                y: {
                    type: 'linear',
                    display: true,
                    position: 'left',
                    title: {
                        display: true,
                        text: 'Pembelian (Rp)'
                    },
                    grid: {
                        color: 'rgba(0, 0, 0, 0.1)'
                    }
                },
                y1: {
                    type: 'linear',
                    display: true,
                    position: 'right',
                    title: {
                        display: true,
                        text: 'Pengeluaran (Qty)'
                    },
                    grid: {
                        drawOnChartArea: false
                    }
                }
            },
            plugins: {
                legend: {
                    display: true,
                    position: 'top'
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            let label = context.dataset.label || '';
                            if (label) {
                                label += ': ';
                            }
                            if (context.dataset.label.includes('Pembelian')) {
                                label += formatCurrency(context.parsed.y);
                            } else {
                                label += context.parsed.y + ' items';
                            }
                            return label;
                        }
                    }
                }
            }
        }
    });
}

// Update kategori chart
function updateKategoriChart(pengeluaranKategori) {
    const ctx = document.getElementById('kategoriChart');
    if (!ctx) return;
    
    if (kategoriChart) {
        kategoriChart.destroy();
    }
    
    if (!pengeluaranKategori) {
        return;
    }
    
    const labels = Object.keys(pengeluaranKategori);
    const data = Object.values(pengeluaranKategori);
    const backgroundColors = ['#4e73df', '#1cc88a', '#36b9cc', '#f6c23e'];
    
    kategoriChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: backgroundColors,
                hoverBackgroundColor: backgroundColors.map(color => color + 'DD'),
                hoverBorderColor: 'rgba(234, 236, 244, 1)'
            }]
        },
        options: {
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom'
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.parsed;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = Math.round((value / total) * 100);
                            return `${label}: ${value} items (${percentage}%)`;
                        }
                    }
                }
            },
            cutout: '70%'
        }
    });
}

// Update activity table
function updateActivityTable(data) {
    const tbody = document.getElementById('activityTableBody');
    
    // For now, we'll show sample data
    // In real implementation, you'd get this from an API
    const sampleActivities = [
        {
            waktu: new Date().toLocaleDateString('id-ID'),
            tipe: 'Pembelian',
            kode: 'OB-001',
            nama: 'Paracetamol 500mg',
            jumlah: 100,
            keterangan: 'Pembelian rutin',
            penginput: 'apt. Putri Nurul H, S.Farm'
        },
        {
            waktu: new Date().toLocaleDateString('id-ID'),
            tipe: 'Pengeluaran',
            kode: 'OB-001',
            nama: 'Paracetamol 500mg',
            jumlah: 25,
            keterangan: 'Pemakaian harian',
            penginput: 'Annisa Fauzia, A.Md.Farm'
        }
    ];
    
    tbody.innerHTML = sampleActivities.map(activity => `
        <tr>
            <td>${activity.waktu}</td>
            <td>
                <span class="badge ${activity.tipe === 'Pembelian' ? 'bg-success' : 'bg-warning'}">
                    ${activity.tipe}
                </span>
            </td>
            <td>${activity.kode}</td>
            <td>${activity.nama}</td>
            <td>${activity.jumlah}</td>
            <td>${activity.keterangan}</td>
            <td>${activity.penginput}</td>
        </tr>
    `).join('');
}

// Setup event listeners
function setupEventListeners() {
    // Periode change event
    document.getElementById('exportPeriode').addEventListener('change', function() {
        const periode = this.value;
        const bulananFields = document.getElementById('bulananFields');
        const tahunanField = document.getElementById('tahunanField');
        
        if (periode === 'tahunan') {
            bulananFields.style.display = 'none';
            tahunanField.style.display = 'block';
        } else {
            bulananFields.style.display = 'block';
            tahunanField.style.display = 'none';
        }
    });
}

// Populate tahun dropdown
function populateTahunDropdown() {
    const currentYear = new Date().getFullYear();
    const tahunSelect = document.getElementById('exportTahun');
    const tahunTahunanSelect = document.getElementById('exportTahunTahunan');
    
    let options = '<option value="">Pilih Tahun</option>';
    for (let year = currentYear; year >= currentYear - 5; year--) {
        options += `<option value="${year}">${year}</option>`;
    }
    
    tahunSelect.innerHTML = options;
    tahunTahunanSelect.innerHTML = options;
}

// Show loading state
function showLoadingState(loading) {
    // You can add loading indicators here if needed
}

// Refresh reports
async function refreshReports() {
    await loadReportData();
    showNotification('Data laporan diperbarui', 'success');
}

// Show report detail (placeholder)
function showReport(type) {
    const reportNames = {
        'pembelian': 'Laporan Pembelian',
        'pengeluaran': 'Laporan Pengeluaran',
        'stok': 'Laporan Stok Obat'
    };
    
    showNotification(`Membuka ${reportNames[type]}...`, 'info');
    // In real implementation, you'd navigate to a detailed report page
}

// Show export modal
function showExportModal() {
    document.getElementById('exportForm').reset();
    document.getElementById('bulananFields').style.display = 'block';
    document.getElementById('tahunanField').style.display = 'none';
    exportModal.show();
}

// Generate report
async function generateReport() {
    const jenis = document.getElementById('exportJenis').value;
    const periode = document.getElementById('exportPeriode').value;
    let bulan, tahun;
    
    if (periode === 'tahunan') {
        tahun = document.getElementById('exportTahunTahunan').value;
    } else {
        bulan = document.getElementById('exportBulan').value;
        tahun = document.getElementById('exportTahun').value;
    }
    
    // Validation
    if (!jenis || !periode) {
        showNotification('Jenis laporan dan periode harus dipilih', 'error');
        return;
    }
    
    if (periode === 'tahunan') {
        if (!tahun) {
            showNotification('Tahun harus dipilih', 'error');
            return;
        }
    } else {
        if (!bulan || !tahun) {
            showNotification('Bulan dan tahun harus dipilih', 'error');
            return;
        }
    }
    
    try {
        showNotification('Membuat laporan...', 'info');
        
        const result = await callAPI('eksporLaporan', {
            jenisLaporan: jenis,
            periode: periode,
            bulan: bulan,
            tahun: tahun
        }, 'POST');
        
        if (result.status === 'success') {
            exportModal.hide();
            showNotification(`
                Laporan berhasil dibuat! 
                <a href="${result.data.downloadUrl}" target="_blank" class="alert-link">Klik di sini untuk mengunduh</a>
            `, 'success');
            
            // Open download link in new tab
            window.open(result.data.downloadUrl, '_blank');
        } else {
            showNotification('Gagal membuat laporan: ' + result.message, 'error');
        }
    } catch (error) {
        showNotification('Error: ' + error.message, 'error');
    }
}

// Initialize when page loads
if (window.location.pathname.includes('laporan.html')) {
    document.addEventListener('DOMContentLoaded', initializeLaporan);
}