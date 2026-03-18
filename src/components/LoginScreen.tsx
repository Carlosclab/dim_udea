'use client';

import { useState } from 'react';

interface Props {
  onLogin: (username: string) => Promise<void>;
}

export default function LoginScreen({ onLogin }: Props) {
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    const trimmed = name.trim();
    if (trimmed.length < 2) { setError('Minimo 2 caracteres'); return; }
    if (trimmed.length > 20) { setError('Maximo 20 caracteres'); return; }
    if (!/^[a-zA-Z0-9_áéíóúñ]+$/.test(trimmed)) { setError('Solo letras, numeros y _'); return; }

    setError('');
    setSubmitting(true);
    try {
      await onLogin(trimmed);
    } catch {
      setError('Error al conectar. Intenta de nuevo.');
      setSubmitting(false);
    }
  };

  return (
    <div className="lg-background min-h-[100dvh] flex flex-col items-center justify-center px-6 safe-area-top safe-area-bottom">
      {/* Logo */}
      <div className="mb-10 text-center lg-slide-up">
        <div className="text-[56px] mb-2">🧩</div>
        <h1 className="text-[32px] font-bold tracking-tight" style={{ color: '#1a2e22' }}>
          TimSort Game
        </h1>
        <p className="text-[14px] mt-1" style={{ color: '#6b7c72' }}>
          Aprende ordenamiento jugando
        </p>
      </div>

      {/* Login card */}
      <div className="lg-panel p-6 w-full max-w-sm lg-slide-up" style={{ animationDelay: '0.1s' }}>
        <p className="text-[12px] font-semibold tracking-wide mb-4" style={{ color: '#8fa396' }}>
          INGRESA TU NOMBRE
        </p>

        <input
          type="text"
          value={name}
          onChange={(e) => { setName(e.target.value); setError(''); }}
          onKeyDown={(e) => { if (e.key === 'Enter') handleSubmit(); }}
          placeholder="tu_nombre"
          maxLength={20}
          autoFocus
          className="w-full px-4 py-3.5 rounded-xl text-[17px] font-medium outline-none transition-all"
          style={{
            background: 'rgba(255,255,255,0.5)',
            border: error ? '1.5px solid #ef434d' : '1px solid rgba(2,105,55,0.15)',
            color: '#1a2e22',
            caretColor: '#026937',
          }}
          onFocus={(e) => { e.currentTarget.style.borderColor = '#026937'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(2,105,55,0.1)'; }}
          onBlur={(e) => { e.currentTarget.style.borderColor = error ? '#ef434d' : 'rgba(2,105,55,0.15)'; e.currentTarget.style.boxShadow = 'none'; }}
        />

        {error && (
          <p className="text-[13px] mt-2 font-medium" style={{ color: '#ef434d' }}>{error}</p>
        )}

        <p className="text-[12px] mt-2 mb-5" style={{ color: '#b0c4b8' }}>
          Tu nombre aparecera en el ranking global
        </p>

        <button
          onClick={handleSubmit}
          disabled={submitting || name.trim().length < 2}
          className="lg-btn lg-btn-primary w-full text-[17px]"
          style={{ opacity: submitting || name.trim().length < 2 ? 0.5 : 1 }}
        >
          {submitting ? 'Entrando...' : 'Entrar'}
        </button>
      </div>

      <p className="text-[11px] mt-8 text-center" style={{ color: '#b0c4b8' }}>
        Universidad de Antioquia · Estructuras de Datos
      </p>
    </div>
  );
}
