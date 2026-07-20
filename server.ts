import express from 'express';
import path from 'path';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

// Sembunyikan URL Google Apps Script dalam backend
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzAf4Dwq7E0xLAFMZHLg4DsXZB7Ybu0VXpWS9OGt6qRdNmyOENQaktmGNimkL2p0zaGyg/exec';

// Simpan token yang sah dalam memory
const validTokens = new Set<string>();
const adminTokens = new Set<string>();

// State untuk tetapan sistem lalai
let appSettings = {
  systemName: 'Semakan ID DELIMa Murid',
  schoolName: 'SK Batu Lanchang',
  logoUrl: '' // Base64 image atau URL
};

// Supabase Setup
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
let supabase: any = null;

if (supabaseUrl && supabaseKey) {
  supabase = createClient(supabaseUrl, supabaseKey);
}

const app = express();
const PORT = 3000;

// Middleware untuk parse JSON request body, naikkan had kepada 10mb untuk base64 image logo
app.use(express.json({ limit: '10mb' }));

// --- API TETAPAN SISTEM ---
app.get('/api/settings', async (req, res) => {
  if (supabase) {
    try {
      const { data, error } = await supabase.from('app_settings').select('*').eq('id', 1).single();
      if (data) {
        if (data.system_name) appSettings.systemName = data.system_name;
        if (data.school_name) appSettings.schoolName = data.school_name;
        if (data.logo_url !== undefined) appSettings.logoUrl = data.logo_url;
      }
    } catch (err) {
      console.error('Ralat memuatkan tetapan dari Supabase:', err);
    }
  }
  res.json(appSettings);
});

app.post('/api/admin/login', (req, res) => {
  const { username, password } = req.body;
  if (username === 'adminskbl' && password === '@pbb1014') {
    const token = crypto.randomBytes(32).toString('hex');
    adminTokens.add(token);
    // Sesi sah untuk 24 jam
    setTimeout(() => adminTokens.delete(token), 24 * 60 * 60 * 1000);
    res.json({ status: 'success', token });
  } else {
    res.status(401).json({ status: 'error', message: 'ID atau Kata Laluan salah.' });
  }
});

app.post('/api/admin/settings', async (req, res) => {
  const { token, systemName, schoolName, logoUrl } = req.body;
  if (!token || !adminTokens.has(token)) {
    return res.status(403).json({ status: 'error', message: 'Akses ditolak atau sesi tamat.' });
  }
  
  if (systemName !== undefined) appSettings.systemName = systemName;
  if (schoolName !== undefined) appSettings.schoolName = schoolName;
  if (logoUrl !== undefined) appSettings.logoUrl = logoUrl;

  if (supabase) {
    try {
      const { error } = await supabase.from('app_settings').upsert({
        id: 1,
        system_name: appSettings.systemName,
        school_name: appSettings.schoolName,
        logo_url: appSettings.logoUrl
      });
      if (error) {
        console.error('Ralat menyimpan ke Supabase:', error);
        // Fallback memori tetap akan berjalan
      }
    } catch (err) {
       console.error('Ralat pelayan Supabase:', err);
    }
  }

  res.json({ status: 'success', settings: appSettings });
});

// --- API MURID ---
// 4. Session token: Dapatkan token sementara (CSRF / Session Token)
app.get('/api/token', (req, res) => {
  const token = crypto.randomBytes(32).toString('hex');
  validTokens.add(token);
  // Token sah untuk 10 minit sahaja
  setTimeout(() => validTokens.delete(token), 10 * 60 * 1000);
  res.json({ token });
});

// 1 & 2: Proxy laluan ke GAS (Sembunyikan logic dari Client)
app.post('/api/search', async (req, res) => {
  try {
    const { mykid, token } = req.body;

    // 5. Backend function wajib verify token
    if (!token || !validTokens.has(token)) {
      return res.status(403).json({ status: 'error', message: 'Token tidak sah atau tamat tempoh. Sila muat semula halaman.' });
    }

    // 6. Server-side validation
    if (!mykid || typeof mykid !== 'string') {
      return res.status(400).json({ status: 'error', message: 'Sila masukkan nombor MyKid.' });
    }
    
    const cleanMyKid = mykid.trim().replace(/-/g, '');
    
    if (!/^\\d+$/.test(cleanMyKid) || cleanMyKid.length !== 12) {
      return res.status(400).json({ status: 'error', message: 'No. MyKid tidak sah. Mestilah 12 digit nombor.' });
    }

    // Lindungi token (Hanya boleh diguna sekali untuk mengelakkan spam / brute force berulang)
    validTokens.delete(token);

    // Panggil Google Apps Script secara backend-to-backend (Data tidak di-hardcode di HTML)
    const response = await fetch(SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ mykid: cleanMyKid })
    });
    
    const data = await response.json();
    res.json(data);
  } catch (err) {
    console.error('Ralat pelayan:', err);
    res.status(500).json({ status: 'error', message: 'Ralat pelayan semasa menyemak pangkalan data.' });
  }
});

async function setupVite() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Serve static files untuk production
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }
}

if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  setupVite().then(() => {
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server running on port ${PORT}`);
    });
  });
}

export default app;
