let activeTabInfo = {
  tabId: null,
  hostname: null,
};
let timer;

// Fungsi untuk memulai atau melanjutkan pelacakan waktu
function startTracking() {
  // Hentikan timer sebelumnya jika ada
  if (timer) {
    clearInterval(timer);
  }

  // Mulai timer baru yang berjalan setiap detik
  timer = setInterval(() => {
    // Pastikan ada hostname yang valid untuk dilacak
    if (activeTabInfo.hostname) {
      const today = new Date().toDateString();
      const domain = activeTabInfo.hostname;

      // Ambil data waktu yang ada dari penyimpanan
      chrome.storage.local.get([domain], (result) => {
        let data = result[domain] || { time: 0, date: today };

        // Reset waktu jika hari telah berganti
        if (data.date !== today) {
          data.time = 0;
          data.date = today;
        }
        
        // Tambah waktu dan simpan kembali
        data.time += 1;
        chrome.storage.local.set({ [domain]: data });
      });
    }
  }, 1000);
}

// Fungsi untuk menghentikan pelacakan waktu
function stopTracking() {
  clearInterval(timer);
  timer = null;
}

// Fungsi untuk memperbarui tab aktif
function updateActiveTab() {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0] && tabs[0].id) {
      activeTabInfo.tabId = tabs[0].id;
      try {
        const url = new URL(tabs[0].url);
        // Jangan lacak halaman internal Chrome
        if (url.protocol.startsWith('http')) {
          activeTabInfo.hostname = url.hostname;
          startTracking();
        } else {
            activeTabInfo.hostname = null;
            stopTracking();
        }
      } catch (e) {
        // URL tidak valid (misal: "chrome://newtab")
        activeTabInfo.hostname = null;
        stopTracking();
      }
    } else {
        stopTracking();
    }
  });
}

// Listener saat tab diaktifkan (berpindah tab)
chrome.tabs.onActivated.addListener(updateActiveTab);

// Listener saat URL tab diperbarui
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (tabId === activeTabInfo.tabId && changeInfo.status === 'complete') {
        updateActiveTab();
    }
});

// Listener saat jendela browser berubah fokus
chrome.windows.onFocusChanged.addListener((windowId) => {
  if (windowId === chrome.windows.WINDOW_ID_NONE) {
    // Jendela tidak fokus, hentikan pelacakan
    stopTracking();
  } else {
    // Jendela kembali fokus, lanjutkan pelacakan
    updateActiveTab();
  }
});

// Listener saat status idle berubah (pengguna tidak aktif)
chrome.idle.onStateChanged.addListener((newState) => {
    if (newState === "active") {
        updateActiveTab();
    } else {
        stopTracking();
    }
});

// Inisialisasi saat ekstensi pertama kali dimuat
updateActiveTab();
