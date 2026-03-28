import React, { useState } from 'react';
import { User } from '../types';

interface LoginProps {
  onLogin: (user: User) => void;
  users: User[];
}

const Login: React.FC<LoginProps> = ({ onLogin, users }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');

    // Simulação de delay para experiência de carregamento
    setTimeout(() => {
      const userFound = users.find(u =>
        (u.email?.toLowerCase() === email.toLowerCase() || u.username?.toLowerCase() === email.toLowerCase()) &&
        u.password === password
      );

      if (userFound) {
        if (userFound.status === 'Inativo') {
          setErrorMsg('Este acesso está desativado. Contate o administrador.');
          setIsLoading(false);
          return;
        }
        onLogin(userFound);
      } else {
        setErrorMsg('Acesso ou senha inválidos. Tente novamente.');
      }
      setIsLoading(false);
    }, 800);
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-50 relative overflow-hidden">
      {/* Elementos Decorativos de Fundo - Tons Suaves CCA */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-cca-primary/10 rounded-full blur-[120px]"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-cca-secondary/10 rounded-full blur-[120px]"></div>

      <div className="w-full max-w-md p-8 relative z-10">
        <div className="bg-white/80 backdrop-blur-xl border border-white p-10 rounded-[40px] shadow-2xl shadow-slate-200/50">
          <div className="flex flex-col items-center mb-10">
            <div className="w-16 h-16 bg-cca-primary rounded-2xl flex items-center justify-center shadow-xl shadow-cca-primary/20 mb-4 text-white font-black text-2xl">
              CCA
            </div>
            <h1 className="text-2xl font-black text-cca-primary tracking-tight">FrotaControl</h1>
            <p className="text-[10px] text-cca-accent font-black uppercase tracking-[0.3em] mt-2">Torre de Controle v3.0</p>
          </div>

          {errorMsg && (
            <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 animate-in fade-in zoom-in duration-300">
              <div className="w-8 h-8 rounded-full bg-red-500 flex items-center justify-center text-white shrink-0">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M18 6 6 18M6 6l12 12" /></svg>
              </div>
              <p className="text-xs font-bold text-red-600 leading-tight">{errorMsg}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">Acesso do Operador</label>
              <input
                type="text"
                required
                placeholder="E-mail ou Usuário"
                className="w-full bg-white border border-slate-200 rounded-2xl p-4 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-cca-primary/10 focus:border-cca-primary transition-all font-medium"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">Senha de Segurança</label>
              <input
                type="password"
                required
                placeholder="••••••••"
                className="w-full bg-white border border-slate-200 rounded-2xl p-4 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-cca-primary/10 focus:border-cca-primary transition-all font-medium"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <div className="flex items-center justify-between px-1">
              <label className="flex items-center gap-2 cursor-pointer group">
                <input type="checkbox" className="w-4 h-4 rounded border-slate-300 bg-white text-cca-primary focus:ring-cca-primary focus:ring-offset-white" />
                <span className="text-xs text-slate-500 group-hover:text-slate-700 transition-colors">Lembrar acesso</span>
              </label>
              <a href="#" className="text-xs text-cca-primary hover:text-cca-accent font-bold transition-colors">Esqueci a senha</a>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-4 bg-cca-primary hover:bg-cca-accent disabled:bg-cca-primary/30 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-lg shadow-cca-primary/20 transition-all flex items-center justify-center gap-3 active:scale-[0.98]"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                "Entrar no Sistema"
              )}
            </button>
          </form>

          <div className="mt-10 pt-8 border-t border-slate-100 text-center">
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Acesso restrito a funcionários autorizados</p>
          </div>
        </div>

        <p className="text-center mt-8 text-slate-400 text-[10px] font-medium">
          &copy; 2025 FrotaControl Logistics. Todos os direitos reservados.
        </p>
      </div>
    </div>
  );
};

export default Login;
