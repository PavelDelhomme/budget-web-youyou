import React, { useState } from 'react';

interface LoginFormProps {
  onLogin: (email: string, password: string, isSignup?: boolean, confirmPassword?: string) => Promise<void>;
}

export function LoginForm({ onLogin }: LoginFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSignup, setIsSignup] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!email || !password) {
      setError('Veuillez remplir tous les champs');
      return;
    }

    if (isSignup) {
      if (password !== confirmPassword) {
        setError('Les mots de passe ne correspondent pas');
        return;
      }
      if (password.length < 8) {
        setError('Le mot de passe doit contenir au moins 8 caractères');
        return;
      }
    }

    try {
      await onLogin(email, password, isSignup, isSignup ? confirmPassword : undefined);
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la connexion');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50 dark:bg-gray-900">
      <form
        onSubmit={handleSubmit}
        className="bg-white dark:bg-gray-800 p-6 sm:p-8 rounded-2xl shadow-xl w-full max-w-md space-y-4 border border-gray-200 dark:border-gray-700"
      >
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
          {isSignup ? 'Inscription' : 'Connexion'}
        </h1>

        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
          </div>
        )}

        <div>
          <input
            required
            type="email"
            placeholder="Email"
            className="w-full border border-gray-300 dark:border-gray-600 rounded-xl px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div className="relative">
          <input
            required
            type={showPassword ? 'text' : 'password'}
            placeholder="Mot de passe"
            className="w-full border border-gray-300 dark:border-gray-600 rounded-xl px-3 py-2 pr-10 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 focus:outline-none"
            aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
          >
            {showPassword ? '👁️' : '👁️‍🗨️'}
          </button>
        </div>

        {isSignup && (
          <div className="relative">
            <input
              required
              type={showConfirmPassword ? 'text' : 'password'}
              placeholder="Confirmer le mot de passe"
              className="w-full border border-gray-300 dark:border-gray-600 rounded-xl px-3 py-2 pr-10 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 focus:outline-none"
              aria-label={showConfirmPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
            >
              {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
            </button>
          </div>
        )}

        <button
          className="w-full bg-black dark:bg-gray-700 hover:bg-gray-800 dark:hover:bg-gray-600 text-white rounded-xl py-2 transition-colors"
          type="submit"
        >
          {isSignup ? 'S\'inscrire' : 'Se connecter'}
        </button>

        <button
          type="button"
          onClick={() => {
            setIsSignup(!isSignup);
            setError(null);
            setConfirmPassword('');
          }}
          className="w-full text-sm text-blue-600 dark:text-blue-400 hover:underline"
        >
          {isSignup
            ? 'Déjà un compte ? Se connecter'
            : 'Première connexion ? S\'inscrire'}
        </button>

        {!isSignup && (
          <p className="text-xs text-center text-slate-500 dark:text-gray-400">
            Astuce : pas d'inscription séparée. Le fichier de données est créé à la première connexion.
          </p>
        )}
      </form>
    </div>
  );
}
