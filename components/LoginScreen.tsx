
import React, { useState } from 'react';
import { useTranslations } from '../hooks/useTranslations';
import * as authService from '../services/authService';
import { User } from '../types';

interface LoginScreenProps {
    onLoginSuccess: (user: User) => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
    const { t } = useTranslations();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    
    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        
        if (!email || !password) {
            setError('Por favor, preencha e-mail e senha.');
            return;
        }

        if (password.length < 4) {
            setError('A senha deve ter pelo menos 4 caracteres.');
            return;
        }

        setIsLoading(true);
        const user = await authService.login(email, password);
        setIsLoading(false);

        if (user) {
            onLoginSuccess(user);
        } else {
            setError('Senha incorreta para este e-mail. Tente novamente.');
        }
    };
    
    return (
        <div className="min-h-screen flex flex-col items-center justify-center animate-fade-in p-4">
            <header className="text-center mb-8">
                <h1 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-nba-blue via-white to-nba-red mb-2">
                    {t('appTitle') as string}
                </h1>
                <p className="text-lg text-secondary">{t('appSubtitle') as string}</p>
            </header>
            <div className="w-full max-w-sm">
                <form onSubmit={handleLogin} className="bg-surface p-8 rounded-xl shadow-2xl space-y-6 border border-white/10">
                     <div>
                        <label htmlFor="email" className="block text-sm font-medium text-secondary mb-1">E-mail</label>
                        <input
                            type="email"
                            id="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="seu@email.com"
                            className="w-full bg-background border border-gray-700 rounded-md p-2 focus:ring-2 focus:ring-nba-blue focus:border-nba-blue outline-none"
                            required
                        />
                    </div>
                     <div>
                        <label htmlFor="password"className="block text-sm font-medium text-secondary mb-1">Senha</label>
                        <input
                            type="password"
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            className="w-full bg-background border border-gray-700 rounded-md p-2 focus:ring-2 focus:ring-nba-blue focus:border-nba-blue outline-none"
                            required
                        />
                    </div>
                    {error && <p className="text-red-500 text-sm text-center bg-red-500/10 py-2 rounded border border-red-500/20">{error}</p>}
                    <button 
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-nba-blue text-white font-bold py-3 px-4 rounded-lg hover:bg-nba-red focus:outline-none focus:ring-2 ring-offset-background focus:ring-offset-2 focus:ring-nba-red transition-colors disabled:bg-nba-gray disabled:cursor-wait"
                    >
                        {isLoading ? 'Acessando...' : 'Entrar / Cadastrar'}
                    </button>
                    <p className="text-xs text-center text-secondary">
                        Se for seu primeiro acesso, uma conta será criada automaticamente com este e-mail.
                    </p>
                </form>
            </div>
        </div>
    );
};

export default LoginScreen;
