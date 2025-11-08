// Obat management functionality
let obatData = [];
let filteredObatData = [];
let currentPage = 1;
const pageSize = 10;
let tambahObatModal = null;

// Initialize obat page
async function initializeObat() {
    await loadKategoriDropdown();
    await loadObatData();
    setupEventListeners();
    
    // Initialize modal
    tambahObatModal = new bootstrap.Modal(document.getElementById('tambahObatModal'));
}

// Load kategori dropdown
async function loadKategoriDropdown() {
    try {
        const result = await callAPI('getDaftarKategori');
        if (result.status === 'success') {
            const filterSelect = document.getElementById('filterKategori');
            const modalSelect = document.getElementById('newKategori');
            
            const options = '<option value="">Semua Kategori</option>' +
                result.data.map(kat => `<option value="${kat}">${kat}</option>`).join('');
            
            filterSelect.innerHTML = options;
            modalSelect.innerHTML = '<option value="">Pilih Kategori</option>' +
                result.data.map(kat => `<option value="${kat}">${kat}</option>`).join('');
        }
    } catch (error) {
        showNotification('Gagal memuat data kategori: ' + error.message, 'error');
    }
}

// Load obat data
async function loadObatData() {
    try {
        showLoadingState(true);
        
        const result = await callAPI('getAllObat');
        
        if (result.status === 'success') {
            obatData = result.data;
            applyFilters();
        } else {
            showNotification('Gagal memuat data obat: ' + result.message, 'error');
        }
    } catch (error) {
        showNotification('Error: ' + error.message, 'error');
    } finally {
        showLoadingState(false);
    }
}

// Setup event listeners
function setupEventListeners() {
    // Filter events
    document.getElementById('filterKategori').addEventListener('change', applyFilters);
    document.getElementById('filterStatus').addEventListener('change', applyFilters);
    document.getElementById('searchObat').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            applyFilters();
        }
    });
}

// Apply filters to obat data
function applyFilters() {
    const kategoriFilter = document.getElementById('filterKategori').value;
    const statusFilter = document.getElementById('filterStatus').value;
    const searchTerm = document.getElementById('searchObat').value.toLowerCase();
    
    filteredObatData = obatData.filter(obat => {
        // Kategori filter
        if (kategoriFilter && obat.kategori !== kategoriFilter) {
            return false;
        }
        
        // Status filter
        if (statusFilter) {
            const status = getStokStatus(obat.stok, obat.stokMin);
            if (status !== statusFilter) {
                return false;
            }
        }
        
        // Search filter
        if (searchTerm) {
            const searchText = `${obat.kode} ${obat.nama}`.toLowerCase();
            if (!searchText.includes(searchTerm)) {
                return false;
            }
        }
        
        return true;
    });
    
    currentPage = 1;
    renderObatTable();
    renderPagination();
}

// Get stok status
function getStokStatus(stok, stokMin) {
    if (stok === 0) return 'habis';
    if (stok <= stokMin) return 'menipis';
    if (stok <= stokMin * 1.5) return 'perhatian';
    return 'aman';
}

// Get status badge
function getStatusBadge(stok, stokMin) {
    const status = getStokStatus(stok, stokMin);
    const badges = {
        'habis': '<span class="badge bg-danger">HABIS</span>',
        'menipis': '<span class="badge bg-warning">MENIPIS</span>',
        'perhatian': '<span class="badge bg-info">PERHATIAN</span>',
        'aman': '<span class="badge bg-success">AMAN</span>'
    };
    return badges[status] || '';
}

// Render obat table
function renderObatTable() {
    const tbody = document.getElementById('obatTableBody');
    
    if (filteredObatData.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" class="text-center text-muted">
                    <i class="fas fa-inbox fa-2x mb-3"></i><br>
                    Tidak ada data obat yang sesuai dengan filter
                </td>
            </tr>
        `;
        return;
    }
    
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const pageData = filteredObatData.slice(startIndex, endIndex);
    
    tbody.innerHTML = pageData.map(obat => `
        <tr>
            <td><strong>${obat.kode}</strong></td>
            <td>${obat.nama}</td>
            <td>${obat.kategori}</td>
            <td>${obat.satuan}</td>
            <td>${obat.stokMin}</td>
            <td>
                <span class="fw-bold ${obat.stok <= obat.stokMin ? 'text-warning' : 'text-dark'}">
                    ${obat.stok}
                </span>
            </td>
            <td>${getStatusBadge(obat.stok, obat.stokMin)}</td>
            <td>
                <div class="btn-group btn-group-sm">
                    <button class="btn btn-outline-primary" onclick="viewObatDetail('${obat.kode}')" title="Lihat Detail">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn btn-outline-warning" onclick="editObat('${obat.kode}')" title="Edit">
                        <i class="fas fa-edit"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

// Render pagination
function renderPagination() {
    const pagination = document.getElementById('pagination');
    const totalPages = Math.ceil(filteredObatData.length / pageSize);
    
    if (totalPages <= 1) {
        pagination.innerHTML = '';
        return;
    }
    
    let html = '';
    
    // Previous button
    html += `
        <li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
            <a class="page-link" href="#" onclick="changePage(${currentPage - 1})">Previous</a>
        </li>
    `;
    
    // Page numbers
    for (let i = 1; i <= totalPages; i++) {
        if (i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1)) {
            html += `
                <li class="page-item ${i === currentPage ? 'active' : ''}">
                    <a class="page-link" href="#" onclick="changePage(${i})">${i}</a>
                </li>
            `;
        } else if (i === currentPage - 2 || i === currentPage + 2) {
            html += `<li class="page-item disabled"><span class="page-link">...</span></li>`;
        }
    }
    
    // Next button
    html += `
        <li class="page-item ${currentPage === totalPages ? 'disabled' : ''}">
            <a class="page-link" href="#" onclick="changePage(${currentPage + 1})">Next</a>
        </li>
    `;
    
    pagination.innerHTML = html;
}

// Change page
function changePage(page) {
    currentPage = page;
    renderObatTable();
    renderPagination();
}

// Show loading state
function showLoadingState(loading) {
    const tbody = document.getElementById('obatTableBody');
    if (loading) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" class="text-center">
                    <div class="spinner-border text-primary" role="status">
                        <span class="visually-hidden">Memuat data...</span>
                    </div>
                    <div class="mt-2">Memuat data obat...</div>
                </td>
            </tr>
        `;
    }
}

// Search obat
function searchObat() {
    applyFilters();
}

// Refresh data
async function refreshData() {
    await loadObatData();
    showNotification('Data obat diperbarui', 'success');
}

// Show tambah obat modal
function showTambahObatModal() {
    document.getElementById('tambahObatForm').reset();
    tambahObatModal.show();
}

// Tambah obat baru
async function tambahObat() {
    const formData = {
        kodeObat: document.getElementById('newKodeObat').value.trim(),
        namaObat: document.getElementById('newNamaObat').value.trim(),
        kategori: document.getElementById('newKategori').value,
        satuan: document.getElementById('newSatuan').value.trim(),
        stokMinimum: document.getElementById('newStokMinimum').value,
        stokAwal: document.getElementById('newStokAwal').value || 0
    };
    
    // Validation
    if (!formData.kodeObat || !formData.namaObat || !formData.kategori || !formData.satuan || !formData.stokMinimum) {
        showNotification('Semua field bertanda * harus diisi', 'error');
        return;
    }
    
    try {
        const result = await callAPI('tambahObatBaru', formData, 'POST');
        
        if (result.status === 'success') {
            showNotification('Obat berhasil ditambahkan', 'success');
            tambahObatModal.hide();
            await loadObatData();
        } else {
            showNotification('Gagal menambah obat: ' + result.message, 'error');
        }
    } catch (error) {
        showNotification('Error: ' + error.message, 'error');
    }
}

// View obat detail
async function viewObatDetail(kodeObat) {
    try {
        const result = await callAPI('cariDataObat', { kodeObat: kodeObat });
        
        if (result.status === 'success') {
            const obat = result.data;
            const detailHtml = `
                <div class="row">
                    <div class="col-md-6">
                        <table class="table table-sm">
                            <tr><th>Kode Obat</th><td>${obat.kode}</td></tr>
                            <tr><th>Nama Obat</th><td>${obat.nama}</td></tr>
                            <tr><th>Kategori</th><td>${obat.kategori}</td></tr>
                            <tr><th>Satuan</th><td>${obat.satuan}</td></tr>
                        </table>
                    </div>
                    <div class="col-md-6">
                        <table class="table table-sm">
                            <tr><th>Stok Minimum</th><td>${obat.stokMin}</td></tr>
                            <tr><th>Stok Saat Ini</th><td>${obat.stok}</td></tr>
                            <tr><th>Status</th><td>${getStatusBadge(obat.stok, obat.stokMin)}</td></tr>
                        </table>
                    </div>
                </div>
            `;
            
            // Show in modal or alert
            showNotification(`Detail Obat: ${obat.nama}` + detailHtml, 'info');
        }
    } catch (error) {
        showNotification('Gagal memuat detail obat: ' + error.message, 'error');
    }
}

// Edit obat (placeholder)
function editObat(kodeObat) {
    showNotification('Fitur edit obat akan segera tersedia', 'info');
    // Implementation for edit would go here
}

// Initialize when page loads
if (window.location.pathname.includes('obat.html')) {
    document.addEventListener('DOMContentLoaded', initializeObat);
}