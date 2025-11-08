// Pengeluaran functionality
let obatModal = null;

// Initialize pengeluaran page
async function initializePengeluaran() {
    await loadDropdownData();
    await loadQuickStockInfo();
    setupEventListeners();
    setDefaultDate();
    
    // Initialize modal
    obatModal = new bootstrap.Modal(document.getElementById('obatModal'));
}

// Load dropdown data
async function loadDropdownData() {
    try {
        // Load kategori
        const kategoriResult = await callAPI('getDaftarKategori');
        if (kategoriResult.status === 'success') {
            const kategoriSelect = document.getElementById('kategori');
            kategoriSelect.innerHTML = '<option value="">Pilih Kategori</option>' +
                kategoriResult.data.map(kat => `<option value="${kat}">${kat}</option>`).join('');
        }

        // Load penginput
        const penginputResult = await callAPI('getDaftarPenginput');
        if (penginputResult.status === 'success') {
            const penginputSelect = document.getElementById('namaPenginput');
            penginputSelect.innerHTML = '<option value="">Pilih Penginput</option>' +
                penginputResult.data.map(penginput => `<option value="${penginput}">${penginput}</option>`).join('');
            
            // Auto-select current user if exists
            if (currentUser && currentUser.nama) {
                for (let option of penginputSelect.options) {
                    if (option.value === currentUser.nama) {
                        option.selected = true;
                        break;
                    }
                }
            }
        }
    } catch (error) {
        showNotification('Gagal memuat data dropdown: ' + error.message, 'error');
    }
}

// Load quick stock info
async function loadQuickStockInfo() {
    try {
        const result = await callAPI('getDataLaporan');
        
        if (result.status === 'success') {
            updateQuickStockInfo(result.data.stokMenipis, result.data.stokHabis);
        }
    } catch (error) {
        console.error('Error loading quick stock info:', error);
    }
}

// Update quick stock info
function updateQuickStockInfo(stokMenipis, stokHabis) {
    const container = document.getElementById('quickStockInfo');
    
    let html = '';
    
    if (stokHabis && stokHabis.length > 0) {
        html += `
            <div class="col-md-4 mb-2">
                <div class="alert alert-danger py-2 mb-0">
                    <i class="fas fa-exclamation-triangle"></i>
                    <strong>${stokHabis.length} Obat Habis</strong>
                </div>
            </div>
        `;
    }
    
    if (stokMenipis && stokMenipis.length > 0) {
        html += `
            <div class="col-md-4 mb-2">
                <div class="alert alert-warning py-2 mb-0">
                    <i class="fas fa-exclamation-circle"></i>
                    <strong>${stokMenipis.length} Obat Menipis</strong>
                </div>
            </div>
        `;
    }
    
    if (!html) {
        html = `
            <div class="col-12">
                <div class="alert alert-success py-2 mb-0">
                    <i class="fas fa-check-circle"></i>
                    <strong>Semua stok dalam kondisi aman</strong>
                </div>
            </div>
        `;
    }
    
    container.innerHTML = html;
}

// Setup event listeners
function setupEventListeners() {
    // Kode obat change event
    document.getElementById('kodeObat').addEventListener('change', function() {
        if (this.value.trim()) {
            searchObatByKode(this.value.trim());
        }
    });

    // Jumlah keluar validation
    document.getElementById('jumlahKeluar').addEventListener('input', validateStok);

    // Keterangan change event
    document.getElementById('keterangan').addEventListener('change', function() {
        const lainnyaContainer = document.getElementById('keteranganLainnyaContainer');
        lainnyaContainer.style.display = this.value === 'Lainnya' ? 'block' : 'none';
    });

    // Form submission
    document.getElementById('pengeluaranForm').addEventListener('submit', handleFormSubmit);

    // Search obat in modal
    document.getElementById('searchObat').addEventListener('input', function() {
        searchObatByNama(this.value);
    });
}

// Set default date to today
function setDefaultDate() {
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('tanggalKeluar').value = today;
}

// Search obat by kode
async function searchObatByKode(kodeObat) {
    try {
        const result = await callAPI('cariDataObat', { kodeObat: kodeObat });
        
        if (result.status === 'success') {
            fillObatData(result.data);
            validateStok(); // Validate stok after loading obat data
        } else {
            clearObatData();
            showNotification('Obat tidak ditemukan: ' + kodeObat, 'warning');
        }
    } catch (error) {
        showNotification('Gagal mencari obat: ' + error.message, 'error');
    }
}

// Fill obat data to form
function fillObatData(obat) {
    document.getElementById('namaObat').value = obat.nama || '';
    document.getElementById('kategori').value = obat.kategori || '';
    document.getElementById('satuan').value = obat.satuan || '';
    
    const stokInfo = document.getElementById('stokInfo');
    stokInfo.innerHTML = `
        <span class="badge ${getStokBadgeClass(obat.stok, obat.stokMin)}">
            ${obat.stok} ${obat.satuan}
        </span>
        ${obat.stok <= obat.stokMin ? 
          `<small class="text-danger ms-2"><i class="fas fa-exclamation-triangle"></i> Stok menipis</small>` : 
          ''}
    `;
    
    // Store current stok for validation
    document.getElementById('stokInfo').dataset.currentStok = obat.stok;
}

// Clear obat data
function clearObatData() {
    document.getElementById('namaObat').value = '';
    document.getElementById('kategori').value = '';
    document.getElementById('satuan').value = '';
    document.getElementById('stokInfo').innerHTML = '<span class="text-muted">-</span>';
    document.getElementById('stokInfo').dataset.currentStok = '0';
    document.getElementById('stokWarning').textContent = '';
}

// Get stok badge class
function getStokBadgeClass(stok, stokMin) {
    if (stok === 0) return 'bg-danger';
    if (stok <= stokMin) return 'bg-warning';
    if (stok <= stokMin * 1.5) return 'bg-info';
    return 'bg-success';
}

// Validate stok before pengeluaran
function validateStok() {
    const currentStok = parseInt(document.getElementById('stokInfo').dataset.currentStok) || 0;
    const jumlahKeluar = parseInt(document.getElementById('jumlahKeluar').value) || 0;
    const stokWarning = document.getElementById('stokWarning');
    
    if (jumlahKeluar > currentStok) {
        stokWarning.innerHTML = `
            <span class="text-danger">
                <i class="fas fa-exclamation-triangle"></i>
                Stok tidak cukup! Stok tersedia: ${currentStok}
            </span>
        `;
        return false;
    } else if (currentStok - jumlahKeluar <= 0) {
        stokWarning.innerHTML = `
            <span class="text-warning">
                <i class="fas fa-exclamation-circle"></i>
                Stok akan habis setelah pengeluaran ini
            </span>
        `;
        return true;
    } else {
        stokWarning.innerHTML = `
            <span class="text-success">
                <i class="fas fa-check-circle"></i>
                Stok mencukupi. Sisa stok: ${currentStok - jumlahKeluar}
            </span>
        `;
        return true;
    }
}

// Browse obat modal
function browseObat() {
    obatModal.show();
    searchObatByNama('');
}

// Search obat by nama
async function searchObatByNama(namaObat) {
    try {
        const result = await callAPI('cariObatByNama', { namaObat: namaObat });
        const obatList = document.getElementById('obatList');
        
        if (result.status === 'success' && result.data.length > 0) {
            obatList.innerHTML = result.data.map(obat => `
                <tr>
                    <td>${obat.kode}</td>
                    <td>${obat.nama}</td>
                    <td>${obat.kategori}</td>
                    <td>
                        <span class="badge ${getStokBadgeClass(obat.stok, obat.stokMin)}">
                            ${obat.stok}
                        </span>
                    </td>
                    <td>${obat.stokMin}</td>
                    <td>
                        <button class="btn btn-sm btn-warning" onclick="selectObat('${obat.kode}', '${obat.nama}', '${obat.kategori}', '${obat.satuan}', ${obat.stok}, ${obat.stokMin})">
                            <i class="fas fa-check"></i> Pilih
                        </button>
                    </td>
                </tr>
            `).join('');
        } else {
            obatList.innerHTML = `
                <tr>
                    <td colspan="6" class="text-center text-muted">
                        Tidak ada obat ditemukan
                    </td>
                </tr>
            `;
        }
    } catch (error) {
        showNotification('Gagal mencari obat: ' + error.message, 'error');
    }
}

// Select obat from modal
function selectObat(kode, nama, kategori, satuan, stok, stokMin) {
    document.getElementById('kodeObat').value = kode;
    fillObatData({ kode, nama, kategori, satuan, stok, stokMin });
    obatModal.hide();
}

// Handle form submission
async function handleFormSubmit(e) {
    e.preventDefault();
    
    const submitBtn = document.getElementById('submitBtn');
    const originalText = submitBtn.innerHTML;
    
    try {
        // Show loading state
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Menyimpan...';
        
        // Validate stok first
        if (!validateStok()) {
            showNotification('Stok tidak mencukupi untuk pengeluaran ini', 'error');
            return;
        }
        
        // Collect form data
        let keterangan = document.getElementById('keterangan').value;
        if (keterangan === 'Lainnya') {
            keterangan = document.getElementById('keteranganLainnya').value.trim() || 'Lainnya';
        }
        
        const formData = {
            kodeObat: document.getElementById('kodeObat').value.trim(),
            namaObat: document.getElementById('namaObat').value.trim(),
            kategori: document.getElementById('kategori').value,
            satuan: document.getElementById('satuan').value,
            tanggalKeluar: document.getElementById('tanggalKeluar').value,
            jumlahKeluar: document.getElementById('jumlahKeluar').value,
            keterangan: keterangan,
            namaPenginput: document.getElementById('namaPenginput').value
        };
        
        // Validate form
        const validation = validatePengeluaranForm(formData);
        if (!validation.isValid) {
            showNotification(validation.message, 'error');
            return;
        }
        
        // Submit data
        const result = await callAPI('simpanTransaksiPengeluaran', formData, 'POST');
        
        if (result.status === 'success') {
            showNotification('Pengeluaran berhasil disimpan! Stok diperbarui.', 'success');
            clearForm();
            await loadQuickStockInfo();
            await loadRecentPengeluaran();
        } else {
            showNotification('Gagal menyimpan pengeluaran: ' + result.message, 'error');
        }
        
    } catch (error) {
        showNotification('Error: ' + error.message, 'error');
    } finally {
        // Restore button state
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
    }
}

// Validate pengeluaran form
function validatePengeluaranForm(data) {
    if (!data.kodeObat) {
        return { isValid: false, message: 'Kode obat harus diisi' };
    }
    if (!data.namaObat) {
        return { isValid: false, message: 'Nama obat harus diisi' };
    }
    if (!data.tanggalKeluar) {
        return { isValid: false, message: 'Tanggal keluar harus diisi' };
    }
    if (!data.jumlahKeluar || data.jumlahKeluar <= 0) {
        return { isValid: false, message: 'Jumlah keluar harus lebih dari 0' };
    }
    if (!data.keterangan) {
        return { isValid: false, message: 'Keterangan harus dipilih' };
    }
    if (!data.namaPenginput) {
        return { isValid: false, message: 'Nama penginput harus dipilih' };
    }
    
    return { isValid: true };
}

// Clear form
function clearForm() {
    document.getElementById('pengeluaranForm').reset();
    clearObatData();
    setDefaultDate();
    document.getElementById('keteranganLainnyaContainer').style.display = 'none';
}

// Load recent pengeluaran
async function loadRecentPengeluaran() {
    try {
        // For demonstration - in real implementation, call API
        document.getElementById('recentPengeluaran').innerHTML = `
            <tr>
                <td colspan="6" class="text-center text-muted">
                    Fitur riwayat pengeluaran akan segera tersedia
                </td>
            </tr>
        `;
    } catch (error) {
        console.error('Error loading recent pengeluaran:', error);
    }
}

// Initialize when page loads
if (window.location.pathname.includes('pengeluaran.html')) {
    document.addEventListener('DOMContentLoaded', initializePengeluaran);
}