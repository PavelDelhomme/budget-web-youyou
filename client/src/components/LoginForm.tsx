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
    <div className="min-h-screen flex items-center justify-center p-4">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-6 rounded-2xl shadow w-full max-w-sm space-y-3"
      >
        <h1 className="text-xl font-semibold">Connexion</h1>
        <input
          required
          type="email"
          placeholder="Email"
          className="w-full border rounded-xl px-3 py-2"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          required
          type="password"
          placeholder="Mot de passe"
          className="w-full border rounded-xl px-3 py-2"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button
          className="w-full bg-black text-white rounded-xl py-2"
          type="submit"
        >
          Se connecter
        </button>
        <p className="text-xs text-slate-500">
          Astuce : pas d'inscription séparée. Le fichier de données est créé à la première connexion.
        </p>
      </form>
    </div>
  );
}

