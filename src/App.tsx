import React, { useState, useEffect, useRef } from 'react';
import { Search, User, AlertCircle, Loader2, CheckCircle2, ChevronRight, Lock, LogOut, Save, Image as ImageIcon, Upload, Copy, Smartphone, X } from 'lucide-react';

export default function App() {
  const [view, setView] = useState<'main' | 'login' | 'admin'>('main');
  const [settings, setSettings] = useState({ systemName: 'Semakan ID DELIMa Murid', schoolName: 'SK Batu Lanchang' });
  const [isSettingsLoading, setIsSettingsLoading] = useState(true);
  const [adminToken, setAdminToken] = useState('');
  const [showPwaTutorial, setShowPwaTutorial] = useState(false);
  
  // Student States
  const [mykid, setMykid] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Admin Login States
  const [adminUser, setAdminUser] = useState('');
  const [adminPass, setAdminPass] = useState('');
  const [adminError, setAdminError] = useState('');
  const [adminLoading, setAdminLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState('');

  // Admin Form States
  const [formSettings, setFormSettings] = useState({ systemName: '', schoolName: '' });

  useEffect(() => {
    fetch('/api/settings')
      .then(res => res.json())
      .then(data => {
        setSettings(data);
        setFormSettings(data);
        setIsSettingsLoading(false);
      })
      .catch(err => {
        console.error(err);
        setIsSettingsLoading(false);
      });
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminError('');
    setAdminLoading(true);
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: adminUser, password: adminPass })
      });
      const data = await res.json();
      if (data.status === 'success') {
        setAdminToken(data.token);
        setView('admin');
        setAdminUser('');
        setAdminPass('');
      } else {
        setAdminError(data.message || 'Log masuk gagal.');
      }
    } catch (err) {
      setAdminError('Ralat sambungan pelayan.');
    } finally {
      setAdminLoading(false);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminLoading(true);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: adminToken, ...formSettings })
      });
      const data = await res.json();
      if (data.status === 'success') {
        setSettings(data.settings);
        setSaveSuccess('Tetapan Berjaya Disimpan!');
        setTimeout(() => setSaveSuccess(''), 3000);
      } else {
        alert(data.message || 'Gagal menyimpan.');
        if (data.message === 'Akses ditolak atau sesi tamat.') setView('login');
      }
    } catch (err) {
      alert('Ralat pelayan.');
    } finally {
      setAdminLoading(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setResult(null);

    // Frontend Validation
    if (!mykid.trim()) {
      setError('Sila masukkan nombor MyKid.');
      return;
    }
    const cleanMyKid = mykid.trim().replace(/-/g, '');
    if (!/^\d+$/.test(cleanMyKid) || cleanMyKid.length !== 12) {
      setError('No. MyKid tidak sah. Sila masukkan 12 digit nombor.');
      return;
    }

    setIsLoading(true);

    try {
      // 4. Minta token sesi daripada server terlebih dahulu
      const tokenResponse = await fetch('/api/token');
      if (!tokenResponse.ok) throw new Error('Gagal mendapatkan token sesi.');
      const { token } = await tokenResponse.json();

      // Hantar MyKid bersama token ke backend pelayan kita
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mykid: cleanMyKid, token })
      });
      
      const data = await response.json();
      
      if (!response.ok || data.status === 'error') {
         setError(data.message || 'Ralat server.');
      } else {
         setResult(data);
      }
    } catch (err) {
      setError('Ralat sambungan pelayan. Sila cuba lagi.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-100/40 via-slate-50 to-white flex items-center justify-center p-4 sm:p-8 font-sans selection:bg-indigo-500/30 relative">
      
      {view === 'login' && (
        <div className="w-full max-w-md bg-white/80 backdrop-blur-xl rounded-[32px] shadow-[0_8px_40px_-12px_rgba(0,0,0,0.1)] relative flex flex-col border border-white p-8 sm:p-10 animate-in fade-in zoom-in-95 duration-300">
          <button onClick={() => setView('main')} className="absolute top-6 right-6 text-slate-400 hover:text-slate-600 transition-colors">
             <LogOut size={20} className="transform rotate-180" />
          </button>
          <div className="mb-8 text-center mt-2">
            <div className="w-16 h-16 bg-indigo-50 border border-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4 text-indigo-600 shadow-inner">
              <Lock size={32} />
            </div>
            <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight mb-2">Log Masuk Admin</h1>
            <p className="text-slate-500 font-medium text-sm">Hanya untuk pentadbir sistem</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <input type="text" placeholder="ID Pengguna" value={adminUser} onChange={e => setAdminUser(e.target.value)} required className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3.5 px-4 text-[15px] font-medium text-slate-800 placeholder-slate-400 outline-none focus:bg-white focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10 transition-all shadow-inner" />
            </div>
            <div>
              <input type="password" placeholder="Kata Laluan" value={adminPass} onChange={e => setAdminPass(e.target.value)} required className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3.5 px-4 text-[15px] font-medium text-slate-800 placeholder-slate-400 outline-none focus:bg-white focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10 transition-all shadow-inner" />
            </div>
            {adminError && <p className="text-rose-500 text-xs font-medium text-center">{adminError}</p>}
            <button type="submit" disabled={adminLoading} className="w-full bg-slate-800 text-white rounded-2xl py-3.5 text-[15px] font-bold hover:bg-slate-900 transition-colors flex items-center justify-center gap-2 mt-2 shadow-lg shadow-slate-800/20 active:scale-[0.98]">
              {adminLoading ? <Loader2 size={18} className="animate-spin" /> : 'Log Masuk'}
            </button>
          </form>
        </div>
      )}

      {view === 'admin' && (
        <div className="w-full max-w-xl bg-white/80 backdrop-blur-xl rounded-[32px] shadow-[0_8px_40px_-12px_rgba(0,0,0,0.1)] relative flex flex-col border border-white p-6 sm:p-10 animate-in fade-in zoom-in-95 duration-300">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">Tetapan Sistem</h1>
              <p className="text-slate-500 font-medium text-sm mt-1">Ubah maklumat aplikasi</p>
            </div>
            <button onClick={() => { setAdminToken(''); setView('main'); }} className="flex items-center gap-2 text-rose-500 hover:text-rose-600 bg-rose-50 hover:bg-rose-100 px-4 py-2 rounded-xl transition-colors text-sm font-bold border border-rose-100">
              <LogOut size={16} /> Keluar
            </button>
          </div>

          <form onSubmit={handleSaveSettings} className="space-y-6">
            <div className="bg-slate-50 p-6 rounded-[24px] shadow-sm space-y-4 border border-slate-200">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Nama Sistem</label>
                <input type="text" value={formSettings.systemName} onChange={e => setFormSettings({...formSettings, systemName: e.target.value})} required className="w-full bg-white border border-slate-200 rounded-2xl py-3 px-4 text-[15px] font-medium text-slate-800 outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10 transition-all shadow-inner" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Nama Sekolah</label>
                <input type="text" value={formSettings.schoolName} onChange={e => setFormSettings({...formSettings, schoolName: e.target.value})} required className="w-full bg-white border border-slate-200 rounded-2xl py-3 px-4 text-[15px] font-medium text-slate-800 outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10 transition-all shadow-inner" />
              </div>
            </div>

            {saveSuccess && (
              <div className="bg-emerald-50 text-emerald-600 px-4 py-3 rounded-2xl flex items-center justify-center gap-2 text-sm font-bold border border-emerald-100">
                <CheckCircle2 size={18} />
                {saveSuccess}
              </div>
            )}

            <button type="submit" disabled={adminLoading} className="w-full bg-violet-600 hover:bg-violet-700 text-white rounded-2xl py-4 text-[15px] font-bold transition-colors flex items-center justify-center gap-2 shadow-lg shadow-violet-600/30 active:scale-[0.98]">
              {adminLoading ? <Loader2 size={20} className="animate-spin" /> : <><Save size={20} /> Simpan Tetapan</>}
            </button>
          </form>
        </div>
      )}

      {view === 'main' && (
        <div className={`w-full ${result ? 'max-w-5xl' : 'max-w-xl'} bg-white/80 backdrop-blur-xl rounded-[32px] shadow-[0_8px_40px_-12px_rgba(0,0,0,0.1)] relative flex flex-col border border-white p-6 sm:p-10 animate-in fade-in duration-300 transition-all`}>
          
          <div className="absolute top-6 right-6 flex items-center gap-3 z-20">
            <button onClick={() => setShowPwaTutorial(true)} className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-full hover:bg-indigo-100 transition-colors border border-indigo-100" title="Cara Install Aplikasi">
              <Smartphone size={14} /> Install App
            </button>
            <button onClick={() => setView('login')} className="text-slate-300 hover:text-slate-500 transition-colors" title="Log Masuk Admin">
              <Lock size={18} />
            </button>
          </div>

          {/* Header */}
          <div className="mb-8 text-center mt-12 sm:mt-2">
            {isSettingsLoading ? (
               <div className="animate-pulse flex flex-col items-center">
                 <div className="w-20 h-20 bg-slate-200 rounded-xl mb-5"></div>
                 <div className="h-8 w-64 bg-slate-200 rounded-lg mb-3"></div>
                 <div className="h-5 w-40 bg-slate-200 rounded-lg"></div>
               </div>
            ) : (
              <>
                <div className="flex justify-center mb-5">
                  <img src="/logo.png" alt="Logo" className="h-20 sm:h-24 object-contain drop-shadow-sm" loading="lazy" />
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-800 tracking-tight mb-2">{settings.systemName}</h1>
                <p className="text-slate-500 font-medium text-sm sm:text-base">{settings.schoolName}</p>
              </>
            )}
          </div>

          <div className={`flex-1 w-full ${(result || isLoading) ? 'flex flex-col md:flex-row gap-8 items-start' : ''}`}>

            {/* Search Card */}
            <div className={`bg-white rounded-[24px] p-6 sm:p-8 shadow-sm border border-slate-100 ${(result || isLoading) ? 'w-full md:w-1/2 mb-0' : 'mb-8'}`}>
               <div className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-5 mb-6">
                  <div className="relative w-16 h-16 shrink-0">
                    <svg className="w-16 h-16 transform -rotate-90">
                      <circle cx="32" cy="32" r="28" stroke="#f1f5f9" strokeWidth="6" fill="none" />
                      <circle cx="32" cy="32" r="28" stroke="#8b5cf6" strokeWidth="6" fill="none" strokeDasharray="175" strokeDashoffset="40" strokeLinecap="round" />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Search size={20} className="text-violet-500" />
                    </div>
                  </div>
                  <div className="mt-2 sm:mt-1">
                    <h3 className="font-bold text-slate-800 text-[15px] sm:text-[16px] mb-1">Carian MyKid</h3>
                    <p className="text-[13px] text-slate-500 leading-snug">Masukkan 12 digit tanpa tanda sempang (-)</p>
                  </div>
               </div>

               <form onSubmit={handleSearch}>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={mykid}
                    onChange={(e) => {
                      const value = e.target.value;
                      setMykid(value);
                      if (value.trim() === '') {
                        setResult(null);
                        setError('');
                      }
                    }}
                    placeholder="Contoh: 123456789012"
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3.5 sm:py-4 px-4 text-[15px] font-medium text-slate-800 placeholder-slate-400 outline-none focus:bg-white focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10 transition-all mb-4 text-center tracking-widest shadow-inner"
                  />
                  {error && (
                    <p className="text-rose-500 text-xs font-medium text-center mb-4">{error}</p>
                  )}
                  <button 
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-[#6a2ffb] text-white rounded-2xl py-3.5 sm:py-4 text-[15px] font-bold hover:bg-[#5926d9] transition-colors flex items-center justify-center gap-2 shadow-lg shadow-[#6a2ffb]/30 active:scale-[0.98]"
                  >
                    {isLoading ? <Loader2 size={18} className="animate-spin text-white" /> : "SEMAK"}
                  </button>
               </form>
            </div>

            {/* Results Area */}
            {(result || isLoading) && (
              <div className="w-full md:w-1/2 animate-in slide-in-from-bottom-4 fade-in duration-500 mt-2 md:mt-0">
                
                {isLoading ? (
                  <div className="bg-white/50 border border-slate-200 rounded-[24px] p-6 sm:p-8 relative overflow-hidden animate-pulse">
                     <div className="h-6 w-24 bg-slate-200 rounded-full mb-6"></div>
                     <div className="h-8 w-48 bg-slate-200 rounded-lg mb-3"></div>
                     <div className="h-4 w-32 bg-slate-200 rounded-lg mb-8"></div>
                     <div className="space-y-4">
                        <div className="h-20 bg-slate-200 rounded-2xl w-full"></div>
                        <div className="h-20 bg-slate-200 rounded-2xl w-full"></div>
                     </div>
                  </div>
                ) : result?.status === 'success' ? (
                  <div className="bg-gradient-to-br from-violet-600 to-indigo-600 rounded-[24px] p-6 sm:p-8 text-white relative overflow-hidden shadow-lg shadow-indigo-500/20 border border-white/10">
                    <div className="absolute -right-4 bottom-4 flex flex-col gap-1.5 opacity-10 hidden sm:flex">
                       <div className="w-16 h-3 bg-white rounded-full"></div>
                       <div className="w-24 h-3 bg-white rounded-full ml-4"></div>
                       <div className="w-20 h-3 bg-white rounded-full -ml-2"></div>
                       <div className="w-16 h-3 bg-white rounded-full ml-6"></div>
                    </div>
                    
                    <div className="relative z-10 text-center sm:text-left">
                      <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-3 py-1.5 mb-6 backdrop-blur-md shadow-sm">
                        <CheckCircle2 size={14} className="text-white" />
                        <span className="text-[11px] font-bold tracking-wide">Rekod Dijumpai</span>
                      </div>

                      <h4 className="font-extrabold text-xl sm:text-2xl mb-1.5 tracking-tight drop-shadow-sm">{result.nama}</h4>
                      <p className="text-indigo-100 text-[13px] sm:text-[14px] font-semibold uppercase tracking-wider mb-8 drop-shadow-sm">{result.kelas}</p>
                      
                      <div className="space-y-4">
                        <div className="bg-white/10 hover:bg-white/20 transition-all rounded-2xl p-5 backdrop-blur-md border border-white/20 flex flex-col sm:flex-row sm:items-center justify-between text-left gap-4 sm:gap-0 group shadow-inner">
                          <div>
                            <p className="text-indigo-200 text-[10px] sm:text-[11px] font-bold uppercase tracking-widest mb-1.5">ID DELIMa</p>
                            <p className="font-mono text-[14px] sm:text-[15px] font-bold text-white tracking-wide">{result.id}</p>
                          </div>
                          <button 
                            onClick={() => handleCopy(result.id, 'id')}
                            className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/30 active:scale-95 transition-all text-white shrink-0 shadow-sm backdrop-blur-md border border-white/10 self-end sm:self-auto"
                            title="Salin ID DELIMa"
                          >
                            {copiedField === 'id' ? <CheckCircle2 size={18} className="text-emerald-400" /> : <Copy size={18} className="opacity-80 group-hover:opacity-100" />}
                          </button>
                        </div>
                        <div className="bg-white/10 hover:bg-white/20 transition-all rounded-2xl p-5 backdrop-blur-md border border-white/20 flex flex-col sm:flex-row sm:items-center justify-between text-left gap-4 sm:gap-0 group shadow-inner">
                          <div>
                            <p className="text-indigo-200 text-[10px] sm:text-[11px] font-bold uppercase tracking-widest mb-1.5">Kata Laluan</p>
                            <p className="font-mono text-[14px] sm:text-[15px] font-bold text-white tracking-widest">{result.password}</p>
                          </div>
                          <button 
                            onClick={() => handleCopy(result.password, 'password')}
                            className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/30 active:scale-95 transition-all text-white shrink-0 shadow-sm backdrop-blur-md border border-white/10 self-end sm:self-auto"
                            title="Salin Kata Laluan"
                          >
                            {copiedField === 'password' ? <CheckCircle2 size={18} className="text-emerald-400" /> : <Copy size={18} className="opacity-80 group-hover:opacity-100" />}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-rose-500 rounded-[24px] p-6 sm:p-8 text-white relative overflow-hidden shadow-lg shadow-rose-500/20">
                    <div className="relative z-10 flex flex-col items-center text-center py-4">
                      <div className="bg-white/20 w-16 h-16 rounded-full flex items-center justify-center mb-4">
                        <AlertCircle size={32} />
                      </div>
                      <h4 className="font-bold text-lg sm:text-xl mb-2">Tidak Dijumpai</h4>
                      <p className="text-rose-100 text-[13px] sm:text-[14px] font-medium max-w-xs mx-auto">Rekod untuk MyKid ini tidak wujud dalam pangkalan data kami.</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* PWA Tutorial Modal */}
      {showPwaTutorial && (
        <div className="fixed inset-0 bg-[#161D35]/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-[32px] w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-6 sm:p-8">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-xl text-[#161D35] flex items-center gap-2">
                  <Smartphone size={24} className="text-[#A098FE]" /> Install Aplikasi
                </h3>
                <button onClick={() => setShowPwaTutorial(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors">
                  <X size={18} />
                </button>
              </div>
              
              <div className="space-y-6">
                <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-5">
                  <h4 className="font-bold text-[#161D35] mb-2 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs">1</span> 
                    Untuk Pengguna Android (Chrome)
                  </h4>
                  <p className="text-sm text-gray-600 leading-relaxed pl-8">
                    Tekan butang menu <span className="font-bold">(⋮)</span> di penjuru kanan atas pelayar Chrome anda, kemudian pilih <span className="font-bold text-blue-600">"Add to Home Screen"</span> atau <span className="font-bold text-blue-600">"Install app"</span>.
                  </p>
                </div>

                <div className="bg-gray-50/50 border border-gray-100 rounded-2xl p-5">
                  <h4 className="font-bold text-[#161D35] mb-2 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-gray-200 text-gray-700 flex items-center justify-center text-xs">2</span> 
                    Untuk Pengguna iOS (Safari)
                  </h4>
                  <p className="text-sm text-gray-600 leading-relaxed pl-8">
                    Tekan butang <span className="font-bold">Share</span> (ikon kotak berserta anak panah ke atas) di bahagian bawah skrin, tatal ke bawah dan pilih <span className="font-bold text-gray-900">"Add to Home Screen"</span>.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
