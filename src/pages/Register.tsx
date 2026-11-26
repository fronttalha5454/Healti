import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { HealthiLogo } from '../presentation/components/HealthiLogo';
import {
  registerWithEmail,
  validateEmail,
  validatePassword,
  validatePasswordMatch,
  validateDisplayName,
} from '../services/auth';
import { Eye, EyeOff, ArrowLeft } from 'lucide-react';

export function Register() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const nameError = validateDisplayName(name);
    if (nameError) { setError(nameError); return; }

    const emailError = validateEmail(email);
    if (emailError) { setError(emailError); return; }

    const pwError = validatePassword(password);
    if (pwError) { setError(pwError); return; }

    const matchError = validatePasswordMatch(password, confirmPassword);
    if (matchError) { setError(matchError); return; }

    setLoading(true);
    const result = await registerWithEmail(email, password, name);
    setLoading(false);

    if (result.success) {
      // The auth listener in App.tsx sees the new user, finds no profile
      // and switches the app to onboarding.
      navigate('/', { replace: true });
    } else {
      setError(result.error || 'Bir hata oluştu.');
    }
  };

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
          <HealthiLogo size={64} className="mb-4" />
          <h1 className="text-2xl font-bold text-gradient mb-1">Healthi'ye Katıl</h1>
          <p className="text-text-secondary text-sm">Hesabını oluştur ve başla</p>
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
            <label className="block text-sm font-medium text-text-secondary">Ad</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Adın"
              autoComplete="name"
              className="w-full bg-surface-card border border-border rounded-xl px-4 py-3.5 text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-200"
            />
          </div>

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
                autoComplete="new-password"
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

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-text-secondary">Şifre Tekrar</label>
            <div className="relative">
              <input
                type={showConfirm ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="new-password"
                className="w-full bg-surface-card border border-border rounded-xl px-4 py-3.5 pr-12 text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-200"
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-text-muted hover:text-text-secondary transition-colors"
              >
                {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
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
                'Hesap Oluştur'
              )}
            </button>
          </div>
        </form>

        {/* Link */}
        <p className="mt-6 text-center text-sm text-text-muted">
          Zaten hesabın var mı?{' '}
          <Link to="/login" className="text-primary font-medium hover:text-primary-light transition-colors">
            Giriş Yap
          </Link>
        </p>
      </div>
    </div>
  );
}
