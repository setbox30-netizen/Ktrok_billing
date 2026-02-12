
import React, { useState } from 'react';

interface LandingPageProps {
  onLogin: (username: string, password: string) => boolean;
  businessName: string;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onLogin, businessName }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Simulate network delay for UX
    await new Promise(resolve => setTimeout(resolve, 600));

    const success = onLogin(username, password);
    
    if (!success) {
      setError('Username/ID atau Password salah!');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 relative overflow-hidden font-inter">
      {/* Decorative Background */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-indigo-600 rounded-full mix-blend-multiply filter blur-[100px] opacity-30 animate-pulse"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-blue-500 rounded-full mix-blend-multiply filter blur-[100px] opacity-30 animate-pulse delay-1000"></div>
      <div className="absolute top-[40%] left-[50%] transform -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none"></div>

      <div className="w-full max-w-md z-10">
        {/* Logo / Header */}
        <div className="text-center mb-10 animate-in fade-in slide-in-from-top-8 duration-700">
           <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-3xl shadow-2xl shadow-indigo-500/30 mb-6 rotate-6 transform hover:rotate-3 transition-transform duration-500 border border-white/10">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
           </div>
           <h1 className="text-4xl font-black text-white tracking-tight mb-2 drop-shadow-sm">
             {businessName}
           </h1>
           <p className="text-indigo-300 font-medium tracking-wide text-sm uppercase">Sistem Informasi Billing Terpadu</p>
        </div>

        {/* Login Card */}
        <div className="bg-white/5 backdrop-blur-2xl p-8 rounded-[2.5rem] shadow-2xl border border-white/10 animate-in fade-in zoom-in duration-500 relative overflow-hidden">
          {/* Shine Effect */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-indigo-500 to-transparent opacity-50"></div>
          
          <div className="mb-6">
            <h2 className="text-2xl font-black text-white mb-1">Masuk</h2>
            <p className="text-slate-400 text-sm">Silakan masukkan kredensial Anda untuk melanjutkan.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="bg-rose-500/20 border border-rose-500/30 text-rose-200 px-4 py-3 rounded-2xl text-xs font-bold flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
                <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                {error}
              </div>
            )}
            
            <div className="space-y-1">
               <label className="block text-[10px] font-black text-indigo-300 uppercase tracking-widest px-1">Username / ID Pelanggan / No. HP</label>
               <div className="relative group">
                 <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-indigo-300 group-focus-within:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                 </div>
                 <input 
                    required 
                    type="text"
                    value={username} 
                    onChange={e => setUsername(e.target.value)}
                    className="w-full pl-11 pr-5 py-4 bg-slate-900/50 border border-slate-700 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-white font-bold placeholder-slate-600 transition-all"
                    placeholder="Masukan ID"
                 />
               </div>
            </div>

            <div className="space-y-1">
               <label className="block text-[10px] font-black text-indigo-300 uppercase tracking-widest px-1">Password</label>
               <div className="relative group">
                 <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-indigo-300 group-focus-within:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                 </div>
                 <input 
                    required 
                    type="password"
                    value={password} 
                    onChange={e => setPassword(e.target.value)}
                    className="w-full pl-11 pr-5 py-4 bg-slate-900/50 border border-slate-700 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-white font-bold placeholder-slate-600 transition-all"
                    placeholder="********"
                 />
               </div>
            </div>

            <button 
               type="submit" 
               disabled={isLoading}
               className="w-full bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white py-4 rounded-2xl font-black shadow-lg shadow-indigo-900/50 transition-all active:scale-95 flex items-center justify-center relative overflow-hidden"
            >
               {isLoading ? (
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                     <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                     <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
               ) : (
                  <>
                    MASUK SEKARANG 
                    <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>
                  </>
               )}
            </button>
          </form>
        </div>
        
        <p className="text-center text-slate-500 text-xs mt-8 font-medium">
          &copy; {new Date().getFullYear()} {businessName} Network System.<br/>Authorized Personnel Only.
        </p>
      </div>
    </div>
  );
};
