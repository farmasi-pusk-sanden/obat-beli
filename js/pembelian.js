// Pembelian functionality
let obatModal = null;

// Initialize pembelian page
async function initializePembelian() {
    await loadDropdownData();
    setupEventListeners();
    await loadRecentTransactions();
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

        // Load jenis transaksi
        const jenisResult = await callAPI('getDaftarJenisTransaksi');
        if (jenisResult.status === 'success') {
            const jenisSelect = document.getElementById('jenisTransaksi');
            jenisSelect.innerHTML = '<option value="">Pilih Jenis Transaksi</option>' +
                jenisResult.data.map(jenis => `<option value="${jenis}">${jenis}</option>`).join('');
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

// Setup event listeners
function setupEventListeners() {
    // Kode obat change event
    document.getElementById('kodeObat').addEventListener('change', function() {
        if (this.value.trim()) {
            searchObatByKode(this.value.trim());
        }
    });

    // Auto-calculate total harga
    document.getElementById('jumlahBeli').addEventListener('input', calculateTotalHarga);
    document.getElementById('hargaSatuan').addEventListener('input', calculateTotalHarga);
    document.getElementById('pajak').addEventListener('input', calculateTotalHarga);

    // Form submission
    document.getElementById('pembelianForm').addEventListener('submit', handleFormSubmit);

    // Search obat in modal
    document.getElementById('searchObat').addEventListener('input', function() {
        searchObatByNama(this.value);
    });
}

// Set default date to today
function setDefaultDate() {
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('tanggalBeli').value = today;
}

// Calculate total harga
function calculateTotalHarga() {
    const jumlah = parseFloat(document.getElementById('jumlahBeli').value) || 0;
    const harga = parseFloat(document.getElementById('hargaSatuan').value) || 0;
    const pajak = parseFloat(document.getElementById('pajak').value) || 0;
    
    const subtotal = jumlah * harga;
    const total = subtotal * (1 + pajak / 100);
    
    document.getElementById('totalHarga').textContent = formatCurrency(total);
}

// Search obat by kode
async function searchObatByKode(kodeObat) {
    try {
        const result = await callAPI('cariDataObat', { kodeObat: kodeObat });
        
        if (result.status === 'success') {
            fillObatData(result.data);
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
}

// Clear obat data
function clearObatData() {
    document.getElementById('namaObat').value = '';
    document.getElementById('kategori').value = '';
    document.getElementById('satuan').value = '';
    document.getElementById('stokInfo').innerHTML = '<span class="text-muted">-</span>';
}

// Get stok badge class
function getStokBadgeClass(stok, stokMin) {
    if (stok === 0) return 'bg-danger';
    if (stok <= stokMin) return 'bg-warning';
    if (stok <= stokMin * 1.5) return 'bg-info';
    return 'bg-success';
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
                    <td>
                        <button class="btn btn-sm btn-primary" onclick="selectObat('${obat.kode}', '${obat.nama}', '${obat.kategori}', '${obat.satuan}', ${obat.stok}, ${obat.stokMin})">
                            <i class="fas fa-check"></i> Pilih
                        </button>
                    </td>
                </tr>
            `).join('');
        } else {
            obatList.innerHTML = `
                <tr>
                    <td colspan="5" class="text-center text-muted">
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
        
        // Collect form data
        const formData = {
            kodeObat: document.getElementById('kodeObat').value.trim(),
            namaObat: document.getElementById('namaObat').value.trim(),
            kategori: document.getElementById('kategori').value,
            satuan: document.getElementById('satuan').value,
            tanggalBeli: document.getElementById('tanggalBeli').value,
            noFaktur: document.getElementById('noFaktur').value.trim(),
            jumlahBeli: document.getElementById('jumlahBeli').value,
            hargaSatuan: document.getElementById('hargaSatuan').value,
            pajak: document.getElementById('pajak').value || 0,
            jenisTransaksi: document.getElementById('jenisTransaksi').value,
            distributor: document.getElementById('distributor').value.trim(),
            keterangan: document.getElementById('keterangan').value.trim(),
            namaPenginput: document.getElementById('namaPenginput').value
        };
        
        // Validate form
        const validation = validatePembelianForm(formData);
        if (!validation.isValid) {
            showNotification(validation.message, 'error');
            return;
        }
        
        // Submit data
        const result = await callAPI('simpanTransaksiPembelian', formData, 'POST');
        
        if (result.status === 'success') {
            showNotification('Pembelian berhasil disimpan! Stok diperbarui.', 'success');
            clearForm();
            await loadRecentTransactions();
        } else {
            showNotification('Gagal menyimpan pembelian: ' + result.message, 'error');
        }
        
    } catch (error) {
        showNotification('Error: ' + error.message, 'error');
    } finally {
        // Restore button state
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
    }
}

// Validate pembelian form
function validatePembelianForm(data) {
    if (!data.kodeObat) {
        return { isValid: false, message: 'Kode obat harus diisi' };
    }
    if (!data.namaObat) {
        return { isValid: false, message: 'Nama obat harus diisi' };
    }
    if (!data.tanggalBeli) {
        return { isValid: false, message: 'Tanggal beli harus diisi' };
    }
    if (!data.jumlahBeli || data.jumlahBeli <= 0) {
        return { isValid: false, message: 'Jumlah beli harus lebih dari 0' };
    }
    if (!data.hargaSatuan || data.hargaSatuan < 0) {
        return { isValid: false, message: 'Harga satuan tidak valid' };
    }
    if (!data.jenisTransaksi) {
        return { isValid: false, message: 'Jenis transaksi harus dipilih' };
    }
    if (!data.namaPenginput) {
        return { isValid: false, message: 'Nama penginput harus dipilih' };
    }
    
    return { isValid: true };
}

// Clear form
function clearForm() {
    document.getElementById('pembelianForm').reset();
    clearObatData();
    setDefaultDate();
    document.getElementById('totalHarga').textContent = '0';
}

// Load recent transactions
async function loadRecentTransactions() {
    try {
        // For now, we'll show a message since we don't have a specific API
        // In a real implementation, you'd call an API to get recent transactions
        document.getElementById('recentTransactions').innerHTML = `
            <tr>
                <td colspan="6" class="text-center text-muted">
                    Fitur riwayat pembelian akan segera tersedia
                </td>
            </tr>
        `;
    } catch (error) {
        console.error('Error loading recent transactions:', error);
    }
}

// Initialize when page loads
if (window.location.pathname.includes('pembelian.html')) {
    document.addEventListener('DOMContentLoaded', initializePembelian);
}