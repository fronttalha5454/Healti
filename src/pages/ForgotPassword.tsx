import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { resetPassword, validateEmail } from '../services/auth';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';

export function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const emailError = validateEmail(email);
    if (emailError) { setError(emailError); return; }

    setLoading(true);
    const result = await resetPassword(email);
    setLoading(false);

    if (result.success) {
      setSent(true);
    } else {
      setError(result.error || 'Bir hata oluştu.');
    }
  };

  if (sent) {
    return (
      <div className="min-h-[100dvh] flex flex-col bg-bg px-6 py-12 safe-top safe-bottom">
        <div className="flex-1 flex flex-col justify-center max-w-sm mx-auto w-full text-center">
          <div className="w-16 h-16 mx-auto rounded-full bg-accent/10 flex items-center justify-center mb-4">
            <CheckCircle2 size={32} className="text-accent" />
          </div>
          <h1 className="text-xl font-bold text-text mb-2">E-posta Gönderildi</h1>
          <p className="text-sm text-text-secondary mb-8">
            <strong>{email}</strong> adresine şifre sıfırlama bağlantısı gönderdik.
            E-posta kutunu kontrol et.
          </p>
          <Link
            to="/login"
            className="w-full py-4 rounded-xl gradient-primary text-white font-semibold text-base active:scale-[0.97] transition-all shadow-lg shadow-primary/25 text-center block"
          >
            Giriş Ekranına Dön
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] flex flex-col bg-bg px-6 py-12 safe-top safe-bottom">
      <div className="flex-1 flex flex-col justify-center max-w-sm mx-auto w-full">
        {/* Back */}
        <button
          onClick={() => navigate('/login')}
          className="self-start p-2 -ml-2 mb-6 rounded-xl hover:bg-surface-card transition-colors"
        >
          <ArrowLeft size={20} className="text-text-secondary" />
        </button>

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gradient mb-1">Şifremi Unuttum</h1>
          <p className="text-text-secondary text-sm">
            E-posta adresini gir, sana bir sıfırlama bağlantısı gönderelim.
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-danger/10 border border-danger/20">
            <p className="text-xs text-danger">{error}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-text-secondary">E-posta</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ornek@email.com"
              autoComplete="email"
              className="w-full bg-surface-card border border-border rounded-xl px-4 py-3.5 text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-200"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 rounded-xl gradient-primary text-white font-semibold text-base active:scale-[0.97] transition-all shadow-lg shadow-primary/25 disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                'Şifre Sıfırlama Bağlantısı Gönder'
              )}
            </button>
          </div>
        </form>

        {/* Link */}
        <p className="mt-6 text-center text-sm text-text-muted">
          Şifreni hatırladın mı?{' '}
          <Link to="/login" className="text-primary font-medium hover:text-primary-light transition-colors">
            Giriş Yap
          </Link>
        </p>
      </div>
    </div>
  );
}
