import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { signInWithEmail, validateEmail, validatePassword } from '../services/auth';
import { isFirebaseConfigured } from '../services/firebase';
import { Eye, EyeOff } from 'lucide-react';
import { HealthiLogo } from '../presentation/components/HealthiLogo';

export function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const emailError = validateEmail(email);
    if (emailError) { setError(emailError); return; }

    const pwError = validatePassword(password);
    if (pwError) { setError(pwError); return; }

    setLoading(true);
    const result = await signInWithEmail(email, password);
    setLoading(false);

    if (result.success) {
      // Auth state listener in App.tsx will handle navigation
      navigate('/', { replace: true });
    } else {
      setError(result.error || 'Bir hata oluştu.');
    }
  };

  return (
    <div className="min-h-[100dvh] flex flex-col bg-bg px-6 py-12 safe-top safe-bottom">
      <div className="flex-1 flex flex-col justify-center max-w-sm mx-auto w-full">
        {/* Header */}
        <div className="text-center mb-10">
          <HealthiLogo size={80} className="mb-4 shadow-lg shadow-primary/20 rounded-2xl" />
          <h1 className="text-2xl font-bold text-gradient mb-1">Healthi</h1>
          <p className="text-text-secondary text-sm">Tekrar hoş geldin</p>
        </div>

        {!isFirebaseConfigured && (
          <div className="mb-4 p-3 rounded-xl bg-warning/10 border border-warning/20">
            <p className="text-xs text-warning">
              Firebase yapılandırması eksik. .env dosyasına VITE_FIREBASE_* değerlerini ekleyin.
            </p>
          </div>
        )}

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

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-text-secondary">Şifre</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                className="w-full bg-surface-card border border-border rounded-xl px-4 py-3.5 pr-12 text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-200"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-text-muted hover:text-text-secondary transition-colors"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
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
                'Giriş Yap'
              )}
            </button>
          </div>
        </form>

        {/* Links */}
        <div className="mt-6 text-center space-y-4">
          <Link
            to="/forgot-password"
            className="text-sm text-primary hover:text-primary-light transition-colors"
          >
            Şifremi unuttum
          </Link>

          <p className="text-sm text-text-muted">
            Hesabın yok mu?{' '}
            <Link to="/register" className="text-primary font-medium hover:text-primary-light transition-colors">
              Kaydol
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
