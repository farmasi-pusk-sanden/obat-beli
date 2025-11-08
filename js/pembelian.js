class PembelianForm {
    static async init() {
        await this.loadFormOptions();
        this.setupEventListeners();
        this.setDefaultDate();
    }

    static async loadFormOptions() {
        try {
            const [penginputList, kategoriList, jenisTransaksiList] = await Promise.all([
                ApiService.getDaftarPenginput(),
                ApiService.getDaftarKategori(),
                ApiService.getDaftarJenisTransaksi()
            ]);

            this.renderForm(penginputList, kategoriList, jenisTransaksiList);
        } catch (error) {
            console.error('Error loading form options:', error);
            AppUtils.showAlert('Gagal memuat opsi form: ' + error.message, 'error');
        }
    }

    static renderForm(penginputList, kategoriList, jenisTransaksiList) {
        const form = document.getElementById('formPembelian');
        
        form.innerHTML = `
            <div class="row mb-3">
                <div class="col-md-6">
                    <label class="form-label">Kode Obat *</label>
                    <div class="input-group">
                        <input type="text" class="form-control" id="kodeObat" required>
                        <button type="button" class="btn btn-outline-primary" onclick="PembelianForm.cariObat()">
                            <i class="fas fa-search"></i> Cari
                        </button>
                    </div>
                    <div class="form-text">Masukkan kode obat lalu klik tombol cari</div>
                </div>
                <div class="col-md-6">
                    <label class="form-label">Nama Obat *</label>
                    <input type="text" class="form-control" id="namaObat" readonly>
                </div>
            </div>

            <div class="row mb-3">
                <div class="col-md-4">
                    <label class="form-label">Kategori *</label>
                    <input type="text" class="form-control" id="kategori" readonly>
                </div>
                <div class="col-md-4">
                    <label class="form-label">Satuan *</label>
                    <input type="text" class="form-control" id="satuan" readonly>
                </div>
                <div class="col-md-4">
                    <label class="form-label">Stok Saat Ini</label>
                    <input type="text" class="form-control" id="stokSaatIni" readonly>
                </div>
            </div>

            <div class="row mb-3">
                <div class="col-md-4">
                    <label class="form-label">Tanggal Beli *</label>
                    <input type="date" class="form-control" id="tanggalBeli" required>
                </div>
                <div class="col-md-4">
                    <label class="form-label">No Faktur</label>
                    <input type="text" class="form-control" id="noFaktur">
                </div>
                <div class="col-md-4">
                    <label class="form-label">Jenis Transaksi *</label>
                    <select class="form-select" id="jenisTransaksi" required>
                        <option value="">Pilih Jenis Transaksi</option>
                        ${jenisTransaksiList.map(jenis => 
                            `<option value="${jenis}">${jenis}</option>`
                        ).join('')}
                    </select>
                </div>
            </div>

            <div class="row mb-3">
                <div class="col-md-3">
                    <label class="form-label">Jumlah Beli *</label>
                    <input type="number" class="form-control" id="jumlahBeli" min="1" required>
                </div>
                <div class="col-md-3">
                    <label class="form-label">Harga Satuan *</label>
                    <input type="number" class="form-control" id="hargaSatuan" min="0" required>
                </div>
                <div class="col-md-3">
                    <label class="form-label">Pajak (%)</label>
                    <input type="number" class="form-control" id="pajak" min="0" max="100" value="0" step="0.01">
                </div>
                <div class="col-md-3">
                    <label class="form-label">Total Harga</label>
                    <input type="text" class="form-control" id="totalHarga" readonly>
                </div>
            </div>

            <div class="row mb-3">
                <div class="col-md-6">
                    <label class="form-label">Distributor</label>
                    <input type="text" class="form-control" id="distributor">
                </div>
                <div class="col-md-6">
                    <label class="form-label">Nama Penginput *</label>
                    <select class="form-select" id="namaPenginput" required>
                        <option value="">Pilih Penginput</option>
                        ${penginputList.map(penginput => 
                            `<option value="${penginput}">${penginput}</option>`
                        ).join('')}
                    </select>
                </div>
            </div>

            <div class="mb-3">
                <label class="form-label">Keterangan</label>
                <textarea class="form-control" id="keterangan" rows="2"></textarea>
            </div>

            <div class="d-grid gap-2 d-md-flex justify-content-md-end">
                <button type="button" class="btn btn-secondary me-md-2" onclick="PembelianForm.resetForm()">
                    <i class="fas fa-undo me-1"></i> Reset Form
                </button>
                <button type="submit" class="btn btn-primary">
                    <i class="fas fa-save me-1"></i> Simpan Pembelian
                </button>
            </div>
        `;
    }

    static setupEventListeners() {
        document.addEventListener('input', AppUtils.debounce((e) => {
            if (e.target.id === 'jumlahBeli' || e.target.id === 'hargaSatuan' || e.target.id === 'pajak') {
                this.calculateTotal();
            }
        }, 300));

        document.getElementById('formPembelian')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.simpanPembelian();
        });
    }

    static setDefaultDate() {
        const tanggalBeli = document.getElementById('tanggalBeli');
        if (tanggalBeli) {
            tanggalBeli.value = AppUtils.getCurrentDate();
        }
    }

    static async cariObat() {
        const kodeObat = document.getElementById('kodeObat')?.value.trim();
        if (!kodeObat) {
            AppUtils.showAlert('Masukkan kode obat terlebih dahulu', 'warning');
            return;
        }

        try {
            const result = await ApiService.cariDataObat(kodeObat);
            
            document.getElementById('namaObat').value = result.data.nama;
            document.getElementById('kategori').value = result.data.kategori;
            document.getElementById('satuan').value = result.data.satuan;
            document.getElementById('stokSaatIni').value = result.data.stok;
            
            AppUtils.showAlert('Data obat berhasil ditemukan', 'success');
        } catch (error) {
            AppUtils.showAlert(error.message, 'error');
            this.clearObatFields();
        }
    }

    static clearObatFields() {
        document.getElementById('namaObat').value = '';
        document.getElementById('kategori').value = '';
        document.getElementById('satuan').value = '';
        document.getElementById('stokSaatIni').value = '';
    }

    static calculateTotal() {
        const jumlah = parseFloat(document.getElementById('jumlahBeli')?.value) || 0;
        const harga = parseFloat(document.getElementById('hargaSatuan')?.value) || 0;
        const pajak = parseFloat(document.getElementById('pajak')?.value) || 0;
        
        const total = jumlah * harga * (1 + pajak/100);
        const totalHarga = document.getElementById('totalHarga');
        if (totalHarga) {
            totalHarga.value = AppUtils.formatCurrency(total);
        }
    }

    static async simpanPembelian() {
        const kodeObat = document.getElementById('kodeObat')?.value.trim();
        const namaObat = document.getElementById('namaObat')?.value.trim();

        if (!kodeObat || !namaObat) {
            AppUtils.showAlert('Harap cari dan pilih obat terlebih dahulu', 'warning');
            return;
        }

        const formData = {
            kodeObat: kodeObat,
            namaObat: namaObat,
            kategori: document.getElementById('kategori')?.value,
            satuan: document.getElementById('satuan')?.value,
            tanggalBeli: document.getElementById('tanggalBeli')?.value,
            noFaktur: document.getElementById('noFaktur')?.value,
            jenisTransaksi: document.getElementById('jenisTransaksi')?.value,
            jumlahBeli: document.getElementById('jumlahBeli')?.value,
            hargaSatuan: document.getElementById('hargaSatuan')?.value,
            pajak: document.getElementById('pajak')?.value,
            distributor: document.getElementById('distributor')?.value,
            keterangan: document.getElementById('keterangan')?.value,
            namaPenginput: document.getElementById('namaPenginput')?.value
        };

        try {
            const result = await ApiService.simpanTransaksiPembelian(formData);
            
            if (result.status === 'success') {
                AppUtils.showAlert(
                    `${result.message} Stok baru: ${result.data.newStock}`,
                    'success',
                    document.getElementById('resultAlert')
                );
                this.resetForm();
            } else {
                AppUtils.showAlert(result.message, 'warning', document.getElementById('resultAlert'));
            }
        } catch (error) {
            AppUtils.showAlert(error.message, 'error', document.getElementById('resultAlert'));
        }
    }

    static resetForm() {
        document.getElementById('formPembelian').reset();
        this.clearObatFields();
        this.setDefaultDate();
        document.getElementById('totalHarga').value = '';
        document.getElementById('resultAlert').innerHTML = '';
    }
}

// Initialize pembelian form
document.addEventListener('DOMContentLoaded', function() {
    if (window.location.pathname.endsWith('pembelian.html')) {
        PembelianForm.init();
    }
});
