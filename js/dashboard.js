// Dashboard functionality
let pembelianPengeluaranChart = null;
let prbChart = null;

// Initialize dashboard
async function initializeDashboard() {
    await loadDashboardData();
    await loadAlertData();
    startAutoRefresh();
}

// Load dashboard data
async function loadDashboardData() {
    try {
        showLoadingState(true);
        
        const result = await callAPI('getDataLaporan');
        
        if (result.status === 'success') {
            updateStatsCards(result.data);
            updateCharts(result.data.chartData);
            updateLastUpdate(result.data.lastUpdate);
        } else {
            showNotification('Gagal memuat data dashboard: ' + result.message, 'error');
        }
    } catch (error) {
        showNotification('Error: ' + error.message, 'error');
    } finally {
        showLoadingState(false);
    }
}

// Update statistics cards
function updateStatsCards(data) {
    document.getElementById('totalObat').textContent = data.totalObat || 0;
    document.getElementById('stokMenipis').textContent = data.stokMenipis?.length || 0;
    document.getElementById('stokHabis').textContent = data.stokHabis?.length || 0;
    document.getElementById('pembelianBulanIni').textContent = formatCurrency(data.totalPembelianBulanIni || 0);
}

// Update charts
function updateCharts(chartData) {
    updatePembelianPengeluaranChart(chartData);
    updatePrbChart(chartData);
}

// Update pembelian vs pengeluaran chart
function updatePembelianPengeluaranChart(chartData) {
    const ctx = document.getElementById('pembelianPengeluaranChart');
    if (!ctx) return;
    
    if (pembelianPengeluaranChart) {
        pembelianPengeluaranChart.destroy();
    }
    
    pembelianPengeluaranChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: chartData.pembelian.labels,
            datasets: [
                {
                    label: 'Pembelian (Rp)',
                    data: chartData.pembelian.data,
                    borderColor: '#4e73df',
                    backgroundColor: 'rgba(78, 115, 223, 0.1)',
                    fill: true,
                    tension: 0.4
                },
                {
                    label: 'Pengeluaran (Qty)',
                    data: chartData.pengeluaran.data,
                    borderColor: '#1cc88a',
                    backgroundColor: 'rgba(28, 200, 138, 0.1)',
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

// Update PRB vs NON-PRB chart
function updatePrbChart(chartData) {
    const ctx = document.getElementById('prbChart');
    if (!ctx) return;
    
    if (prbChart) {
        prbChart.destroy();
    }
    
    prbChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: chartData.prbVsNonPRB.labels,
            datasets: [{
                data: chartData.prbVsNonPRB.data,
                backgroundColor: ['#4e73df', '#1cc88a'],
                hoverBackgroundColor: ['#2e59d9', '#17a673'],
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
                            return `${label}: ${formatCurrency(value)} (${percentage}%)`;
                        }
                    }
                }
            },
            cutout: '70%'
        }
    });
}

// Load alert data
async function loadAlertData() {
    try {
        const result = await callAPI('getDataLaporan');
        
        if (result.status === 'success') {
            updateAlertTable(result.data.stokMenipis, result.data.stokHabis);
        }
    } catch (error) {
        console.error('Error loading alert data:', error);
    }
}

// Update alert table
function updateAlertTable(stokMenipis, stokHabis) {
    const tableBody = document.getElementById('alertTableBody');
    if (!tableBody) return;
    
    let html = '';
    
    // Show habis first (most critical)
    if (stokHabis && stokHabis.length > 0) {
        stokHabis.forEach(item => {
            if (item[0]) { // Check if kode obat exists
                html += `
                    <tr class="table-danger">
                        <td>${item[0]}</td>
                        <td>${item[1]}</td>
                        <td>${item[2]}</td>
                        <td>${item[4]}</td>
                        <td>${item[5]}</td>
                        <td><span class="badge bg-danger">HABIS</span></td>
                    </tr>
                `;
            }
        });
    }
    
    // Then show menipis
    if (stokMenipis && stokMenipis.length > 0) {
        stokMenipis.forEach(item => {
            if (item[0]) { // Check if kode obat exists
                html += `
                    <tr class="table-warning">
                        <td>${item[0]}</td>
                        <td>${item[1]}</td>
                        <td>${item[2]}</td>
                        <td>${item[4]}</td>
                        <td>${item[5]}</td>
                        <td><span class="badge bg-warning">MENIPIS</span></td>
                    </tr>
                `;
            }
        });
    }
    
    if (!html) {
        html = `
            <tr>
                <td colspan="6" class="text-center text-muted">
                    <i class="fas fa-check-circle me-2"></i>
                    Semua stok dalam kondisi aman
                </td>
            </tr>
        `;
    }
    
    tableBody.innerHTML = html;
}

// Show loading state
function showLoadingState(loading) {
    const refreshBtn = document.querySelector('button[onclick="refreshDashboard()"]');
    if (refreshBtn) {
        if (loading) {
            refreshBtn.disabled = true;
            refreshBtn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Loading...';
        } else {
            refreshBtn.disabled = false;
            refreshBtn.innerHTML = '<i class="fas fa-sync-alt"></i> Refresh';
        }
    }
}

// Update last update time
function updateLastUpdate(timestamp) {
    // You can add a last update indicator if needed
    console.log('Data terakhir diupdate:', timestamp);
}

// Refresh dashboard
async function refreshDashboard() {
    await loadDashboardData();
    await loadAlertData();
    showNotification('Dashboard diperbarui', 'success');
}

// Auto-refresh every 5 minutes
function startAutoRefresh() {
    setInterval(() => {
        if (document.visibilityState === 'visible') {
            loadDashboardData();
            loadAlertData();
        }
    }, 5 * 60 * 1000); // 5 minutes
}

// Initialize when page loads
if (window.location.pathname.includes('index.html') || window.location.pathname === '/') {
    document.addEventListener('DOMContentLoaded', initializeDashboard);
}