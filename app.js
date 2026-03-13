/* ==========================================
   VERIMLILIK HESAPLAMA SISTEMI - APP.JS
   ==========================================
   localStorage Keys:
   - temsilciler: [{id, ad}]
   - datalar: [{id, isim, gecisToplami}]
   - hesaplamalar: [{id, tarih, dataIsmi, temsilciAdi, verimlilikOrani, ...details}]
   ========================================== */

// ==========================================
// DATA MANAGEMENT
// ==========================================

function getTemsilciler() {
    return JSON.parse(localStorage.getItem('temsilciler') || '[]');
}

function setTemsilciler(list) {
    localStorage.setItem('temsilciler', JSON.stringify(list));
}

function getDatalar() {
    return JSON.parse(localStorage.getItem('datalar') || '[]');
}

function setDatalar(list) {
    localStorage.setItem('datalar', JSON.stringify(list));
}

function getHesaplamalar() {
    return JSON.parse(localStorage.getItem('hesaplamalar') || '[]');
}

function setHesaplamalar(list) {
    localStorage.setItem('hesaplamalar', JSON.stringify(list));
}

// ==========================================
// TOAST NOTIFICATIONS
// ==========================================

function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    const icons = {
        success: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>',
        error: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>',
        info: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>'
    };

    toast.innerHTML = `${icons[type] || icons.info} ${message}`;
    container.appendChild(toast);

    setTimeout(() => {
        if (toast.parentNode) {
            toast.remove();
        }
    }, 3500);
}

// ==========================================
// MODAL MANAGEMENT
// ==========================================

function openModal(modalId) {
    const modal = document.getElementById(modalId);
    modal.classList.add('active');

    // Update lists
    if (modalId === 'temsilciModal') {
        renderTemsilciListesi();
    } else if (modalId === 'dataModal') {
        renderDataListesi();
    }

    // Focus first input
    setTimeout(() => {
        const firstInput = modal.querySelector('input');
        if (firstInput) firstInput.focus();
    }, 100);
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    modal.classList.remove('active');

    // Clear inputs
    modal.querySelectorAll('input').forEach(input => input.value = '');
}

// Close modal on overlay click
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal-overlay')) {
        e.target.classList.remove('active');
        e.target.querySelectorAll('input').forEach(input => input.value = '');
    }
});

// Close modal on Escape
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        document.querySelectorAll('.modal-overlay.active').forEach(modal => {
            modal.classList.remove('active');
            modal.querySelectorAll('input').forEach(input => input.value = '');
        });
    }
});

// ==========================================
// TEMSILCI MANAGEMENT
// ==========================================

function temsilciEkle() {
    const input = document.getElementById('txtTemsilciAdi');
    const ad = input.value.trim();

    if (!ad) {
        showToast('Lütfen temsilci adı soyadı girin', 'error');
        input.focus();
        return;
    }

    const temsilciler = getTemsilciler();

    // Check duplicate
    if (temsilciler.some(t => t.ad.toLowerCase() === ad.toLowerCase())) {
        showToast('Bu temsilci zaten mevcut', 'error');
        return;
    }

    temsilciler.push({
        id: Date.now().toString(),
        ad: ad
    });

    setTemsilciler(temsilciler);
    input.value = '';
    input.focus();

    renderTemsilciListesi();
    populateTemsilciSelect();
    populateTemsilciGecmisSelect();
    updateStats();
    showToast(`${ad} başarıyla eklendi`, 'success');
}

function temsilciSil(id) {
    let temsilciler = getTemsilciler();
    const temsilci = temsilciler.find(t => t.id === id);
    temsilciler = temsilciler.filter(t => t.id !== id);
    setTemsilciler(temsilciler);

    renderTemsilciListesi();
    populateTemsilciSelect();
    populateTemsilciGecmisSelect();
    updateStats();
    showToast(`${temsilci ? temsilci.ad : 'Temsilci'} silindi`, 'info');
}

function renderTemsilciListesi() {
    const ul = document.getElementById('temsilciListesi');
    const temsilciler = getTemsilciler();

    if (temsilciler.length === 0) {
        ul.innerHTML = '<li class="empty-list-msg">Henüz temsilci eklenmedi</li>';
        return;
    }

    ul.innerHTML = temsilciler.map(t => `
        <li>
            <span>${t.ad}</span>
            <button class="btn-danger-sm" onclick="temsilciSil('${t.id}')">Sil</button>
        </li>
    `).join('');
}

function populateTemsilciSelect() {
    const select = document.getElementById('selTemsilci');
    const temsilciler = getTemsilciler();
    const currentValue = select.value;

    select.innerHTML = '<option value="">Temsilci seçin...</option>';
    temsilciler.forEach(t => {
        const opt = document.createElement('option');
        opt.value = t.ad;
        opt.textContent = t.ad;
        select.appendChild(opt);
    });

    // Restore selection if exists
    if (currentValue && temsilciler.some(t => t.ad === currentValue)) {
        select.value = currentValue;
    }
}

// ==========================================
// DATA MANAGEMENT
// ==========================================

function dataEkle() {
    const isimInput = document.getElementById('txtDataIsmi');
    const gecisInput = document.getElementById('txtGecisToplami');
    const isim = isimInput.value.trim();
    const gecisToplami = parseInt(gecisInput.value);

    if (!isim) {
        showToast('Lütfen data ismi girin', 'error');
        isimInput.focus();
        return;
    }

    if (isNaN(gecisToplami) || gecisToplami < 0) {
        showToast('Lütfen geçerli bir Geçiş Toplamı girin', 'error');
        gecisInput.focus();
        return;
    }

    const datalar = getDatalar();

    // Check duplicate
    if (datalar.some(d => d.isim.toLowerCase() === isim.toLowerCase())) {
        showToast('Bu data ismi zaten mevcut', 'error');
        return;
    }

    datalar.push({
        id: Date.now().toString(),
        isim: isim,
        gecisToplami: gecisToplami
    });

    setDatalar(datalar);
    isimInput.value = '';
    gecisInput.value = '';
    isimInput.focus();

    renderDataListesi();
    populateDataSelect();
    updateStats();
    showToast(`${isim} başarıyla eklendi`, 'success');
}

function dataSil(id) {
    let datalar = getDatalar();
    const data = datalar.find(d => d.id === id);
    datalar = datalar.filter(d => d.id !== id);
    setDatalar(datalar);

    renderDataListesi();
    populateDataSelect();
    updateStats();
    showToast(`${data ? data.isim : 'Data'} silindi`, 'info');
}

function renderDataListesi() {
    const ul = document.getElementById('dataListesi');
    const datalar = getDatalar();

    if (datalar.length === 0) {
        ul.innerHTML = '<li class="empty-list-msg">Henüz data eklenmedi</li>';
        return;
    }

    ul.innerHTML = datalar.map(d => `
        <li>
            <div class="list-item-info">
                <span>${d.isim}</span>
                <span class="sub-info">Geçiş Toplamı: ${d.gecisToplami}</span>
            </div>
            <button class="btn-danger-sm" onclick="dataSil('${d.id}')">Sil</button>
        </li>
    `).join('');
}

function populateDataSelect() {
    const select = document.getElementById('selData');
    const datalar = getDatalar();
    const currentValue = select.value;

    select.innerHTML = '<option value="">Data seçin...</option>';
    datalar.forEach(d => {
        const opt = document.createElement('option');
        opt.value = d.isim;
        opt.textContent = `${d.isim} (Geçiş: ${d.gecisToplami})`;
        select.appendChild(opt);
    });

    if (currentValue && datalar.some(d => d.isim === currentValue)) {
        select.value = currentValue;
    }
}

// ==========================================
// PAGE SWITCHING
// ==========================================

function switchPage(page) {
    // Update nav
    document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));

    if (page === 'hesapla') {
        document.getElementById('navVerimllikHesapla').classList.add('active');
        document.getElementById('pageHesapla').classList.add('active');
    } else if (page === 'gecmis') {
        document.getElementById('navGecmisVeriler').classList.add('active');
        document.getElementById('pageGecmis').classList.add('active');
        updateGecmisKayitSayisi();
    } else if (page === 'gecmisTemsilci') {
        document.getElementById('navGecmisTemsilci').classList.add('active');
        document.getElementById('pageGecmisTemsilci').classList.add('active');
        populateTemsilciGecmisSelect();
    }
}

// ==========================================
// VERIMLILIK HESAPLAMA
// ==========================================

function hesaplaVerimlilik() {
    // Get values
    const temsilciAdi = document.getElementById('selTemsilci').value;
    const dataIsmi = document.getElementById('selData').value;
    const baslangic = document.getElementById('dtBaslangic').value;
    const bitis = document.getElementById('dtBitis').value;
    const toplamArama = parseInt(document.getElementById('txtToplamArama').value);
    const ulasilanArama = parseInt(document.getElementById('txtUlasilanArama').value);
    const obAcht = parseFloat(document.getElementById('txtObAcht').value);

    // Validations
    if (!temsilciAdi) {
        showToast('Lütfen bir temsilci seçin', 'error');
        return;
    }
    if (!dataIsmi) {
        showToast('Lütfen bir data seçin', 'error');
        return;
    }
    if (!baslangic) {
        showToast('Lütfen başlangıç tarih ve saati seçin', 'error');
        return;
    }
    if (!bitis) {
        showToast('Lütfen bitiş tarih ve saati seçin', 'error');
        return;
    }

    const dtBaslangic = new Date(baslangic);
    const dtBitis = new Date(bitis);

    if (dtBitis <= dtBaslangic) {
        showToast('Bitiş tarihi başlangıç tarihinden sonra olmalıdır', 'error');
        return;
    }

    if (isNaN(toplamArama) || toplamArama <= 0) {
        showToast('Lütfen geçerli bir Toplam Yapılan Arama sayısı girin', 'error');
        return;
    }
    if (isNaN(ulasilanArama) || ulasilanArama < 0) {
        showToast('Lütfen geçerli bir Ulaşılan Arama sayısı girin', 'error');
        return;
    }
    if (ulasilanArama > toplamArama) {
        showToast('Ulaşılan Arama, Toplam Aramadan fazla olamaz', 'error');
        return;
    }
    if (isNaN(obAcht) || obAcht < 0) {
        showToast('Lütfen geçerli bir OB ACHT değeri girin', 'error');
        return;
    }

    // Find data's Geçiş Toplamı
    const datalar = getDatalar();
    const secilenData = datalar.find(d => d.isim === dataIsmi);
    if (!secilenData) {
        showToast('Seçilen data bulunamadı', 'error');
        return;
    }
    const gecisToplami = secilenData.gecisToplami;

    // ---- HESAPLAMA BAŞLANGICI ----

    // 1) Toplam süre (saniye) = saat farkı * 3600
    const farkMs = dtBitis.getTime() - dtBaslangic.getTime();
    const farkSaat = farkMs / (1000 * 60 * 60);
    const toplamSaniye = farkSaat * 3600;

    // 2) Mola saniyesi = toplamSaniye * 14 / 100
    const molaSaniyesi = toplamSaniye * 14 / 100;

    // 3) Çalışma Saniyesi = toplamSaniye - molaSaniyesi
    const calismaSaniyesi = toplamSaniye - molaSaniyesi;

    // 4) Ulaşım Oranı = ulasilanArama / toplamArama (2 ondalık, yuvarlanmış)
    const ulasimOraniRaw = ulasilanArama / toplamArama;
    const ulasimOrani = Math.round(ulasimOraniRaw * 100) / 100;

    // 5) Ek Konuşma Yükü = ulasimOrani * obAcht (tam sayıya yuvarla)
    const ekKonusmaYuku = Math.round(ulasimOrani * obAcht);

    // 6) NET ACHT = ekKonusmaYuku + gecisToplami
    const netAcht = ekKonusmaYuku + gecisToplami;

    // 7) Beklenen Arama Hedefi = calismaSaniyesi / netAcht (yukarı yuvarla)
    const beklenenAramaHedefi = Math.ceil(calismaSaniyesi / netAcht);

    // 8) Verimlilik = toplamArama / beklenenAramaHedefi
    const verimlilikRaw = toplamArama / beklenenAramaHedefi;
    const verimlilikYuzdesi = Math.round(verimlilikRaw * 100);

    // ---- SONUÇLARI GÖSTER ----
    document.getElementById('rToplamSure').textContent = Math.round(toplamSaniye).toLocaleString('tr-TR');
    document.getElementById('rMolaSure').textContent = Math.round(molaSaniyesi).toLocaleString('tr-TR');
    document.getElementById('rCalismaSure').textContent = Math.round(calismaSaniyesi).toLocaleString('tr-TR');
    document.getElementById('rUlasimOrani').textContent = `%${(ulasimOrani * 100).toFixed(2)}`;
    document.getElementById('rEkKonusma').textContent = ekKonusmaYuku;
    document.getElementById('rNetAcht').textContent = netAcht;
    document.getElementById('rBeklenenHedef').textContent = beklenenAramaHedefi;
    document.getElementById('rVerimlilik').textContent = `%${verimlilikYuzdesi}`;

    // Update highlight card color
    const highlightCard = document.querySelector('.result-card.highlight');
    highlightCard.classList.remove('verimlilik-high', 'verimlilik-medium', 'verimlilik-low');
    if (verimlilikYuzdesi >= 80) {
        highlightCard.style.borderColor = 'rgba(16,185,129,0.5)';
        highlightCard.style.background = 'linear-gradient(145deg, rgba(16,185,129,0.15), rgba(16,185,129,0.05))';
    } else if (verimlilikYuzdesi >= 50) {
        highlightCard.style.borderColor = 'rgba(245,158,11,0.5)';
        highlightCard.style.background = 'linear-gradient(145deg, rgba(245,158,11,0.15), rgba(245,158,11,0.05))';
    } else {
        highlightCard.style.borderColor = 'rgba(239,68,68,0.5)';
        highlightCard.style.background = 'linear-gradient(145deg, rgba(239,68,68,0.15), rgba(239,68,68,0.05))';
    }

    // Show result section
    const resultSection = document.getElementById('resultSection');
    resultSection.classList.remove('hidden');
    resultSection.scrollIntoView({ behavior: 'smooth', block: 'start' });

    // ---- VERİYİ KAYDET ----
    const hesaplamalar = getHesaplamalar();
    hesaplamalar.push({
        id: Date.now().toString(),
        tarih: new Date(baslangic).toISOString(),
        dataIsmi: dataIsmi,
        temsilciAdi: temsilciAdi,
        verimlilikOrani: verimlilikYuzdesi,
        toplamSaniye: Math.round(toplamSaniye),
        molaSaniyesi: Math.round(molaSaniyesi),
        calismaSaniyesi: Math.round(calismaSaniyesi),
        ulasimOrani: ulasimOrani,
        ekKonusmaYuku: ekKonusmaYuku,
        netAcht: netAcht,
        beklenenAramaHedefi: beklenenAramaHedefi,
        toplamArama: toplamArama,
        ulasilanArama: ulasilanArama,
        obAcht: obAcht,
        gecisToplami: gecisToplami,
        baslangic: baslangic,
        bitis: bitis
    });

    setHesaplamalar(hesaplamalar);
    updateStats();
    showToast('Verimlilik başarıyla hesaplandı ve kaydedildi!', 'success');
}

// ==========================================
// TARIH ARALIGI TOGGLE
// ==========================================

function toggleTarihAraligi() {
    const chekbox = document.getElementById('chkTarihAraligi');
    const bolumu1 = document.getElementById('tarihAraligiBolumu');
    const bolumu2 = document.getElementById('tarihAraligiBolumu2');
    const btnIndir = document.getElementById('btnExcelIndir');
    const btnIndirAraligi = document.getElementById('btnExcelIndirAraligi');
    const filterTarih = document.getElementById('filterTarih');

    if (chekbox.checked) {
        bolumu1.style.display = 'block';
        bolumu2.style.display = 'block';
        btnIndir.style.display = 'none';
        btnIndirAraligi.style.display = 'inline-flex';
        filterTarih.style.display = 'none';
        document.querySelector('label[for="filterTarih"]').style.display = 'none';
    } else {
        bolumu1.style.display = 'none';
        bolumu2.style.display = 'none';
        btnIndir.style.display = 'inline-flex';
        btnIndirAraligi.style.display = 'none';
        filterTarih.style.display = 'block';
        document.querySelector('label[for="filterTarih"]').style.display = 'block';
        document.getElementById('filterTarihBaslangic').value = '';
        document.getElementById('filterTarihBitis').value = '';
    }
    updateOniu();
}

function updateOniu() {
    const isAraligi = document.getElementById('chkTarihAraligi').checked;
    let hesaplamalar = getHesaplamalar();

    if (isAraligi) {
        // Tarih aralığı modu
        const baslangic = document.getElementById('filterTarihBaslangic').value;
        const bitis = document.getElementById('filterTarihBitis').value;

        if (!baslangic || !bitis) {
            document.getElementById('onizlemeBolumu').style.display = 'none';
            document.getElementById('gecmisInfoCard').style.display = 'flex';
            return;
        }

        const dtBaslangic = new Date(baslangic);
        const dtBitis = new Date(bitis);

        if (dtBitis < dtBaslangic) {
            document.getElementById('onizlemeBolumu').style.display = 'none';
            document.getElementById('gecmisInfoCard').style.display = 'flex';
            return;
        }

        const gunBaslangic = new Date(dtBaslangic);
        gunBaslangic.setHours(0, 0, 0, 0);
        const gunBitis = new Date(dtBitis);
        gunBitis.setHours(23, 59, 59, 999);

        hesaplamalar = hesaplamalar.filter(h => {
            const kayitTarihi = new Date(h.tarih);
            return kayitTarihi >= gunBaslangic && kayitTarihi <= gunBitis;
        });

        // Sıralama: Tarih sırasına göre (geçmiş→günümüze, ascending)
        hesaplamalar.sort((a, b) => {
            return new Date(a.tarih) - new Date(b.tarih);
        });
    } else {
        // Tek tarih modu
        const tarih = document.getElementById('filterTarih').value;

        if (!tarih) {
            document.getElementById('onizlemeBolumu').style.display = 'none';
            document.getElementById('gecmisInfoCard').style.display = 'flex';
            return;
        }

        const secilenTarih = new Date(tarih);
        const gunBaslangic = new Date(secilenTarih);
        gunBaslangic.setHours(0, 0, 0, 0);
        const gunBitis = new Date(secilenTarih);
        gunBitis.setHours(23, 59, 59, 999);

        hesaplamalar = hesaplamalar.filter(h => {
            const kayitTarihi = new Date(h.tarih);
            return kayitTarihi >= gunBaslangic && kayitTarihi <= gunBitis;
        });

        // Sıralama: Data ismine göre, sonra tarih sirasına göre
        hesaplamalar.sort((a, b) => {
            const nameCompare = a.dataIsmi.localeCompare(b.dataIsmi, 'tr');
            if (nameCompare !== 0) return nameCompare;
            return new Date(a.tarih) - new Date(b.tarih);
        });
    }

    // Tabloyu güncelle
    if (hesaplamalar.length === 0) {
        document.getElementById('onizlemeBolumu').style.display = 'none';
        document.getElementById('gecmisInfoCard').style.display = 'flex';
        return;
    }

    // Tablo oluştur
    const tbody = document.getElementById('onizlemeTabloBody');
    tbody.innerHTML = hesaplamalar.map(h => {
        const baslangicTarihi = new Date(h.baslangic);
        const tarihStr = baslangicTarihi.toLocaleDateString('tr-TR', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        });
        return `
            <tr>
                <td>${tarihStr}</td>
                <td>${h.dataIsmi}</td>
                <td>${h.temsilciAdi}</td>
                <td>${h.beklenenAramaHedefi}</td>
                <td>${h.toplamArama}</td>
                <td>${h.ulasilanArama}</td>
                <td>%${(h.ulasimOrani * 100).toFixed(2)}</td>
                <td>%${h.verimlilikOrani}</td>
                <td><button class="btn-danger-sm" onclick="hesaplamaSil('${h.id}')">Sil</button></td>
            </tr>
        `;
    }).join('');

    // Kayıt sayısını güncelle
    document.getElementById('onizlemeKayitSayisi').textContent = `${hesaplamalar.length} kayıt`;

    // Tabloyu göster, info kartını gizle
    document.getElementById('onizlemeBolumu').style.display = 'block';
    document.getElementById('gecmisInfoCard').style.display = 'none';
}

// ==========================================
// GEÇMİŞ VERİLER - KAYIT SAYISI
// ==========================================

function updateGecmisKayitSayisi() {
    const el = document.getElementById('gecmisKayitSayisi');
    if (el) {
        el.textContent = getHesaplamalar().length;
    }
}

// ==========================================
// EXCEL EXPORT
// ==========================================

function excelIndir() {
    const tarih = document.getElementById('filterTarih').value;

    if (!tarih) {
        showToast('Lütfen bir tarih seçin', 'error');
        return;
    }

    let hesaplamalar = getHesaplamalar();

    // Filter by selected date (the entire day)
    const secilenTarih = new Date(tarih);
    const gunBaslangic = new Date(secilenTarih);
    gunBaslangic.setHours(0, 0, 0, 0);
    const gunBitis = new Date(secilenTarih);
    gunBitis.setHours(23, 59, 59, 999);

    hesaplamalar = hesaplamalar.filter(h => {
        const kayitTarihi = new Date(h.tarih);
        return kayitTarihi >= gunBaslangic && kayitTarihi <= gunBitis;
    });

    if (hesaplamalar.length === 0) {
        showToast('Seçilen tarihte kayıt bulunamadı', 'error');
        return;
    }

    // Sort by data name (grouped), then by date
    hesaplamalar.sort((a, b) => {
        const nameCompare = a.dataIsmi.localeCompare(b.dataIsmi, 'tr');
        if (nameCompare !== 0) return nameCompare;
        return new Date(a.tarih) - new Date(b.tarih);
    });

    createAndDownloadExcel(hesaplamalar, secilenTarih);
}

function excelIndirAraligi() {
    const baslangic = document.getElementById('filterTarihBaslangic').value;
    const bitis = document.getElementById('filterTarihBitis').value;

    if (!baslangic || !bitis) {
        showToast('Lütfen başlangıç ve bitiş tarihlerini seçin', 'error');
        return;
    }

    const dtBaslangic = new Date(baslangic);
    const dtBitis = new Date(bitis);

    if (dtBitis < dtBaslangic) {
        showToast('Bitiş tarihi başlangıç tarihinden önce olamaz', 'error');
        return;
    }

    let hesaplamalar = getHesaplamalar();

    // Filter by date range
    const gunBaslangic = new Date(dtBaslangic);
    gunBaslangic.setHours(0, 0, 0, 0);
    const gunBitis = new Date(dtBitis);
    gunBitis.setHours(23, 59, 59, 999);

    hesaplamalar = hesaplamalar.filter(h => {
        const kayitTarihi = new Date(h.tarih);
        return kayitTarihi >= gunBaslangic && kayitTarihi <= gunBitis;
    });

    if (hesaplamalar.length === 0) {
        showToast('Seçilen tarih aralığında kayıt bulunamadı', 'error');
        return;
    }

    // Sort by date (ascending - oldest to newest)
    hesaplamalar.sort((a, b) => {
        return new Date(a.tarih) - new Date(b.tarih);
    });

    createAndDownloadExcel(hesaplamalar, null, true);
}

function createAndDownloadExcel(hesaplamalar, secilenTarih, isAraligi = false) {
    // Build Excel data with full format
    const excelData = hesaplamalar.map(h => {
        const baslangicTarihi = new Date(h.baslangic);
        const tarihStr = baslangicTarihi.toLocaleDateString('tr-TR', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        });
        return {
            'Tarih': tarihStr,
            'Data Detay': h.dataIsmi,
            'Agent': h.temsilciAdi,
            'Beklenen Arama Adedi': h.beklenenAramaHedefi,
            'Toplam Yapılan Arama': h.toplamArama,
            'Ulaşılan Arama': h.ulasilanArama,
            'OB ACHT': h.obAcht,
            'Ulaşım Oranı': `%${(h.ulasimOrani * 100).toFixed(2)}`,
            'Verimlilik': `%${h.verimlilikOrani}`
        };
    });

    // Create workbook
    const ws = XLSX.utils.json_to_sheet(excelData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Verimlilik Raporu');

    // Style column widths
    ws['!cols'] = [
        { wch: 12 }, // Tarih
        { wch: 20 }, // Data Detay
        { wch: 20 }, // Agent
        { wch: 18 }, // Beklenen Arama Adedi
        { wch: 18 }, // Toplam Yapılan Arama
        { wch: 15 }, // Ulaşılan Arama
        { wch: 10 }, // OB ACHT
        { wch: 15 }, // Ulaşım Oranı
        { wch: 12 }  // Verimlilik
    ];

    // Generate filename
    let filename;
    if (isAraligi) {
        const baslangicTarihi = new Date(document.getElementById('filterTarihBaslangic').value);
        const bitisTarihi = new Date(document.getElementById('filterTarihBitis').value);
        const baslangicStr = baslangicTarihi.toLocaleDateString('tr-TR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        }).replace(/\./g, '-');
        const bitisStr = bitisTarihi.toLocaleDateString('tr-TR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        }).replace(/\./g, '-');
        filename = `Verimlilik_Raporu_${baslangicStr}_${bitisStr}.xlsx`;
    } else {
        const dateStr = secilenTarih.toLocaleDateString('tr-TR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        }).replace(/\./g, '-');
        filename = `Verimlilik_Raporu_${dateStr}.xlsx`;
    }

    XLSX.writeFile(wb, filename);
    showToast(`${hesaplamalar.length} kayıt Excel olarak indirildi`, 'success');
}

// ==========================================
// HESAPLAMA SİLME
// ==========================================

function hesaplamaSil(id) {
    let hesaplamalar = getHesaplamalar();
    hesaplamalar = hesaplamalar.filter(h => h.id !== id);
    setHesaplamalar(hesaplamalar);
    updateOniu();
    updateStats();
    showToast('Kayıt silindi', 'info');
}

// ==========================================
// GEÇMİŞ TEMSİLCİ VERİLERİ
// ==========================================

function populateTemsilciGecmisSelect() {
    const select = document.getElementById('selTemsilciGecmis');
    if (!select) return;
    const temsilciler = getTemsilciler();
    const currentValue = select.value;

    select.innerHTML = '<option value="">Temsilci seçin...</option>';
    temsilciler.forEach(t => {
        const opt = document.createElement('option');
        opt.value = t.ad;
        opt.textContent = t.ad;
        select.appendChild(opt);
    });

    if (currentValue && temsilciler.some(t => t.ad === currentValue)) {
        select.value = currentValue;
    }
}

function updateTemsilciOniu() {
    const temsilciAdi = document.getElementById('selTemsilciGecmis').value;

    if (!temsilciAdi) {
        document.getElementById('temsilciOnizlemeBolumu').style.display = 'none';
        document.getElementById('temsilciInfoCard').style.display = 'flex';
        return;
    }

    let hesaplamalar = getHesaplamalar();
    hesaplamalar = hesaplamalar.filter(h => h.temsilciAdi === temsilciAdi);

    // Sıralama: Tarihe göre (yeniden eskiye)
    hesaplamalar.sort((a, b) => new Date(b.tarih) - new Date(a.tarih));

    if (hesaplamalar.length === 0) {
        document.getElementById('temsilciOnizlemeBolumu').style.display = 'none';
        document.getElementById('temsilciInfoCard').style.display = 'flex';
        return;
    }

    const tbody = document.getElementById('temsilciOnizlemeTabloBody');
    tbody.innerHTML = hesaplamalar.map(h => {
        const baslangicTarihi = new Date(h.baslangic);
        const tarihStr = baslangicTarihi.toLocaleDateString('tr-TR', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        });
        return `
            <tr>
                <td>${tarihStr}</td>
                <td>${h.dataIsmi}</td>
                <td>${h.temsilciAdi}</td>
                <td>${h.beklenenAramaHedefi}</td>
                <td>${h.toplamArama}</td>
                <td>${h.ulasilanArama}</td>
                <td>%${(h.ulasimOrani * 100).toFixed(2)}</td>
                <td>%${h.verimlilikOrani}</td>
            </tr>
        `;
    }).join('');

    document.getElementById('temsilciOnizlemeKayitSayisi').textContent = `${hesaplamalar.length} kayıt`;
    document.getElementById('temsilciOnizlemeBolumu').style.display = 'block';
    document.getElementById('temsilciInfoCard').style.display = 'none';
}

function temsilciExcelIndir() {
    const temsilciAdi = document.getElementById('selTemsilciGecmis').value;

    if (!temsilciAdi) {
        showToast('Lütfen bir temsilci seçin', 'error');
        return;
    }

    let hesaplamalar = getHesaplamalar();
    hesaplamalar = hesaplamalar.filter(h => h.temsilciAdi === temsilciAdi);

    if (hesaplamalar.length === 0) {
        showToast('Seçilen temsilciye ait kayıt bulunamadı', 'error');
        return;
    }

    // Sıralama: Tarihe göre (eskiden yeniye)
    hesaplamalar.sort((a, b) => new Date(a.tarih) - new Date(b.tarih));

    // Excel verisi oluştur (Geçmiş Veriler ile aynı format)
    const excelData = hesaplamalar.map(h => {
        const baslangicTarihi = new Date(h.baslangic);
        const tarihStr = baslangicTarihi.toLocaleDateString('tr-TR', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        });
        return {
            'Tarih': tarihStr,
            'Data Detay': h.dataIsmi,
            'Agent': h.temsilciAdi,
            'Beklenen Arama Adedi': h.beklenenAramaHedefi,
            'Toplam Yapılan Arama': h.toplamArama,
            'Ulaşılan Arama': h.ulasilanArama,
            'OB ACHT': h.obAcht,
            'Ulaşım Oranı': `%${(h.ulasimOrani * 100).toFixed(2)}`,
            'Verimlilik': `%${h.verimlilikOrani}`
        };
    });

    const ws = XLSX.utils.json_to_sheet(excelData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Verimlilik Raporu');

    ws['!cols'] = [
        { wch: 12 },
        { wch: 20 },
        { wch: 20 },
        { wch: 18 },
        { wch: 18 },
        { wch: 15 },
        { wch: 10 },
        { wch: 15 },
        { wch: 12 }
    ];

    const safeAd = temsilciAdi.replace(/[^a-zA-Z0-9çÇğĞıİöÖşŞüÜ ]/g, '').replace(/\s+/g, '_');
    const filename = `Temsilci_Raporu_${safeAd}.xlsx`;

    XLSX.writeFile(wb, filename);
    showToast(`${hesaplamalar.length} kayıt Excel olarak indirildi`, 'success');
}

// ==========================================
// STATS
// ==========================================

function updateStats() {
    document.getElementById('statTemsilci').textContent = getTemsilciler().length;
    document.getElementById('statData').textContent = getDatalar().length;
    document.getElementById('statHesaplama').textContent = getHesaplamalar().length;
    updateGecmisKayitSayisi();
}

// ==========================================
// ENTER KEY SUPPORT
// ==========================================

document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        // Temsilci modal
        const temsilciModal = document.getElementById('temsilciModal');
        if (temsilciModal.classList.contains('active')) {
            temsilciEkle();
            return;
        }

        // Data modal
        const dataModal = document.getElementById('dataModal');
        if (dataModal.classList.contains('active')) {
            const isimInput = document.getElementById('txtDataIsmi');
            const gecisInput = document.getElementById('txtGecisToplami');
            if (document.activeElement === isimInput) {
                gecisInput.focus();
            } else {
                dataEkle();
            }
            return;
        }
    }
});

// ==========================================
// INITIALIZATION
// ==========================================

function init() {
    populateTemsilciSelect();
    populateTemsilciGecmisSelect();
    populateDataSelect();
    updateStats();
}

// Run on page load
document.addEventListener('DOMContentLoaded', init);
