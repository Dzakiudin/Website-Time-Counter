document.addEventListener('DOMContentLoaded', () => {
    const dataContainer = document.getElementById('data-container');
    const resetButton = document.getElementById('reset-button');

    // Fungsi untuk mengubah detik menjadi format jam, menit, detik
    function formatTime(seconds) {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;

        let parts = [];
        if (h > 0) parts.push(`${h}j`);
        if (m > 0) parts.push(`${m}m`);
        if (s > 0 && h === 0 && m < 10) parts.push(`${s}d`); // Tampilkan detik jika total < 10 menit
        
        return parts.length > 0 ? parts.join(' ') : '0d';
    }

    // Fungsi untuk memuat dan menampilkan data
    function loadData() {
        const today = new Date().toDateString();
        dataContainer.innerHTML = ''; // Kosongkan kontainer

        chrome.storage.local.get(null, (items) => {
            let sites = [];
            let keysToDelete = [];

            for (const key in items) {
                // Pastikan data adalah objek yang diharapkan
                if (typeof items[key] === 'object' && items[key].hasOwnProperty('time') && items[key].hasOwnProperty('date')) {
                    if (items[key].date === today) {
                        sites.push({ domain: key, time: items[key].time });
                    } else {
                        // Tandai data lama untuk dihapus
                        keysToDelete.push(key);
                    }
                }
            }

            // Hapus data dari hari sebelumnya
            if (keysToDelete.length > 0) {
                chrome.storage.local.remove(keysToDelete);
            }

            // Urutkan situs berdasarkan waktu terlama
            sites.sort((a, b) => b.time - a.time);

            if (sites.length === 0) {
                dataContainer.innerHTML = '<p id="no-data">Belum ada aktivitas tercatat hari ini.</p>';
            } else {
                sites.forEach(site => {
                    const entryDiv = document.createElement('div');
                    entryDiv.className = 'site-entry';

                    const domainSpan = document.createElement('span');
                    domainSpan.className = 'site-domain';
                    domainSpan.textContent = site.domain;
                    domainSpan.title = site.domain;

                    const timeSpan = document.createElement('span');
                    timeSpan.className = 'site-time';
                    timeSpan.textContent = formatTime(site.time);

                    entryDiv.appendChild(domainSpan);
                    entryDiv.appendChild(timeSpan);
                    dataContainer.appendChild(entryDiv);
                });
            }
        });
    }

    // Event listener untuk tombol reset
    resetButton.addEventListener('click', () => {
        // Minta konfirmasi sebelum menghapus
        if (confirm('Apakah Anda yakin ingin mereset semua data waktu hari ini?')) {
            chrome.storage.local.clear(() => {
                loadData(); // Muat ulang data setelah dibersihkan
                console.log('Data telah direset.');
            });
        }
    });

    // Muat data saat popup dibuka
    loadData();
});
