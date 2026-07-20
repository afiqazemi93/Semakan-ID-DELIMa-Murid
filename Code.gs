const SPREADSHEET_ID = '1Lf47WjPP9bWuzGBAkrgfKj8y9QbNMIfjbyWvD9NYjK8';
const SHEET_NAME = 'MOE'; // Nama tab telah dikemaskini

function doPost(e) {
  try {
    // 1. Parsing data dari frontend
    let data;
    if (e.postData && e.postData.contents) {
      data = JSON.parse(e.postData.contents);
    } else {
      return createResponse({ status: "error", message: "Tiada data diterima." });
    }

    const searchMyKid = data.mykid;
    
    if (!searchMyKid) {
      return createResponse({ status: "error", message: "Sila berikan No. MyKid." });
    }

    // 2. Rate Limiting (Hadkan carian untuk cegah spam)
    const cache = CacheService.getScriptCache();
    const cacheKey = "rate_limit_" + searchMyKid;
    const requests = cache.get(cacheKey);
    
    if (requests && parseInt(requests) > 5) {
      return createResponse({ status: "error", message: "Terlalu banyak percubaan. Sila cuba lagi selepas 1 minit." });
    } else {
      // Simpan cubaan selama 60 saat (1 minit)
      cache.put(cacheKey, requests ? (parseInt(requests) + 1).toString() : "1", 60); 
    }

    // 3. Buka Google Sheets
    const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_NAME);
    
    if (!sheet) {
      return createResponse({ status: "error", message: "Tab Sheet tidak dijumpai. Pastikan nama tab adalah betul (" + SHEET_NAME + ")." });
    }

    // 4. Ambil semua data (andaian baris pertama adalah Header)
    const dataRange = sheet.getDataRange();
    const values = dataRange.getDisplayValues(); // Gunakan getDisplayValues untuk kekalkan format nombor asal
    
    // 5. Cari rekod MyKid
    // Susunan Lajur Baru (berdasarkan 'Email MOE Murid SKBL' tab 'MOE'):
    // 0 = NAMA MURID, 1 = KELAS, 2 = NO MYKID, 3 = ID MOE MURID, 4 = PASSWORD
    let result = null;
    
    // Mula dari i=1 untuk melangkau baris Header
    for (let i = 1; i < values.length; i++) {
      // Semak jika baris kosong
      if(!values[i][2]) continue;

      // Padam sebarang jarak kosong atau dash pada MyKid
      const rowMyKid = values[i][2].toString().replace(/\s/g, '').replace(/-/g, ''); 
      const searchKey = searchMyKid.toString().replace(/\s/g, '').replace(/-/g, '');
      
      if (rowMyKid === searchKey) {
        result = {
          status: "success",
          nama: values[i][0] || "Tiada Maklumat",
          kelas: values[i][1] || "Tiada Maklumat",
          id: values[i][3] || "Tiada Maklumat",
          password: values[i][4] || "Tiada Maklumat"
        };
        break; // Hentikan carian setelah dijumpai
      }
    }
    
    // 6. Simpan Log Carian (Pilihan)
    logSearch(searchMyKid, result ? "Berjaya Dijumpai" : "Tidak Dijumpai");

    // 7. Kembalikan keputusan kepada Frontend
    if (result) {
      return createResponse(result);
    } else {
      return createResponse({ status: "notfound" });
    }

  } catch (error) {
    return createResponse({ status: "error", message: "Ralat pada server: " + error.toString() });
  }
}

// Fungsi untuk menyediakan response JSON
function createResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

// Fungsi simpan rekod carian
function logSearch(mykid, status) {
  try {
    const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName("Log Carian");
    
    // Jika tab "Log Carian" wujud, ia akan merekod
    if (sheet) {
      const now = new Date();
      const dateStr = Utilities.formatDate(now, Session.getScriptTimeZone(), "dd/MM/yyyy");
      const timeStr = Utilities.formatDate(now, Session.getScriptTimeZone(), "HH:mm:ss");
      
      // Susunan lajur log: Tarikh | Masa | No MyKid | Status
      // Tambah "'" pada MyKid supaya format nombor tidak berubah di Google Sheet
      sheet.appendRow([dateStr, timeStr, "'" + mykid, status]);
    }
  } catch (e) {
    // Abaikan jika ralat log supaya tidak ganggu sistem
  }
}
