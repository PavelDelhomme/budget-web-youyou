import React, { useState } from 'react';

interface LoginFormProps {
  onLogin: (email: string, password: string) => Promise<void>;
}

export function LoginForm({ onLogin }: LoginFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onLogin(email, password);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50 dark:bg-gray-900">
      <form
        onSubmit={handleSubmit}
        className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow w-full max-w-sm space-y-3 border border-gray-200 dark:border-gray-700"
      >
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Connexion</h1>
        <input
          required
          type="email"
          placeholder="Email"
          className="w-full border border-gray-300 dark:border-gray-600 rounded-xl px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          required
          type="password"
          placeholder="Mot de passe"
          className="w-full border border-gray-300 dark:border-gray-600 rounded-xl px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button
          className="w-full bg-black dark:bg-gray-700 hover:bg-gray-800 dark:hover:bg-gray-600 text-white rounded-xl py-2 transition-colors"
          type="submit"
        >
          Se connecter
        </button>
        <p className="text-xs text-slate-500 dark:text-gray-400">
          Astuce : pas d'inscription séparée. Le fichier de données est créé à la première connexion.
        </p>
      </form>
    </div>
  );
}

