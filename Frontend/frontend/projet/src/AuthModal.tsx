import React, { useState } from 'react';
import axios from 'axios';
import { Bus, Eye, EyeOff } from 'lucide-react';
import './App.css';

interface AuthProps {
  onSuccess: () => void;
}

export function AuthModal({ onSuccess }: AuthProps) {
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (isRegister) {
      if (!email.trim()) {
        setError('Adresse e-mail obligatoire.');
        return;
      }
      if (password.length < 8) {
        setError('Le mot de passe doit contenir au moins 8 caractères.');
        return;
      }
      if (password !== confirmPassword) {
        setError('Les mots de passe ne correspondent pas.');
        return;
      }
    }

    setLoading(true);
    const endpoint = isRegister ? '/api/register/' : '/api/login/';
    const payload = isRegister ? { username, email, password } : { username, password };

    axios.post(endpoint, payload)
      .then((res) => {
        if (isRegister) {
          setSuccessMsg('Inscription réussie ! Veuillez cliquer sur "Se connecter" ci-dessous pour accéder à votre espace.');
          
          setPassword('');
          setConfirmPassword('');
          setShowPassword(false);
          setShowConfirmPassword(false);
        } else {
          localStorage.setItem('token', res.data.token);
          localStorage.setItem('username', res.data.username);
          onSuccess();
        }
      })
      .catch((err) => {
        const serverError = err.response?.data?.error 
          || err.response?.data?.detail 
          || err.response?.data?.non_field_errors?.[0]
          || 'Erreur de connexion au serveur.';
        setError(serverError);
      })
      .finally(() => setLoading(false));
  };

  const toggleMode = () => {
    setIsRegister(!isRegister);
    setError('');
    setSuccessMsg('');
    setPassword('');
    setConfirmPassword('');
    setShowPassword(false);
    setShowConfirmPassword(false);
  };

  return (
    <div className="modal-overlay">
      <div className="modal" style={{ maxWidth: '400px' }}>
        <div className="modal-head" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px', textAlign: 'center', padding: '20px 18px 12px 18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Bus size={28} color="#38bdf8" />
            <span style={{ fontWeight: 'bold', fontSize: '1.2rem', color: '#0f172a' }}>Gestions_RT</span>
          </div>
          <h3 style={{ margin: 0, fontSize: '1rem', color: '#64748b', fontWeight: '500' }}>
            {isRegister ? "Créer un compte" : "Connexion à votre espace"}
          </h3>
        </div>

        <form className="modal-form modal-form-grid" onSubmit={handleSubmit}>
          {error && <div className="banner error full-width">{error}</div>}
          
          {successMsg && (
            <div 
              className="banner full-width" 
              style={{ 
                backgroundColor: '#dcfce7', 
                color: '#15803d', 
                border: '1px solid #86efac', 
                padding: '10px', 
                borderRadius: '6px', 
                textAlign: 'center',
                fontSize: '0.85rem'
              }}
            >
              {successMsg}
            </div>
          )}

          <div className="full-width">
            <label>Nom d'utilisateur</label>
            <input 
              type="text" 
              value={username} 
              onChange={(e) => setUsername(e.target.value)} 
              required 
            />
          </div>

          {isRegister && (
            <div className="full-width">
              <label>Adresse e-mail</label>
              <input 
                type="email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                required
              />
            </div>
          )}

          <div className="full-width">
            <label>Mot de passe</label>
            <div className="password-input-wrapper" style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <input 
                type={showPassword ? "text" : "password"} 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                style={{ paddingRight: '36px', width: '100%' }}
                required 
              />
              <button 
                type="button" 
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '8px',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#64748b',
                  display: 'flex',
                  alignItems: 'center',
                  padding: '2px'
                }}
                aria-label="Afficher ou masquer le mot de passe"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {isRegister && (
            <div className="full-width">
              <label>Confirmer le mot de passe</label>
              <div className="password-input-wrapper" style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <input 
                  type={showConfirmPassword ? "text" : "password"} 
                  value={confirmPassword} 
                  onChange={(e) => setConfirmPassword(e.target.value)} 
                  style={{ paddingRight: '36px', width: '100%' }}
                  required 
                />
                <button 
                  type="button" 
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={{
                    position: 'absolute',
                    right: '8px',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#64748b',
                    display: 'flex',
                    alignItems: 'center',
                    padding: '2px'
                  }}
                  aria-label="Afficher ou masquer la confirmation du mot de passe"
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
          )}

          <button className="btn full-width" type="submit" disabled={loading} style={{ marginTop: '8px' }}>
            {loading ? "Chargement..." : (isRegister ? "S'inscrire" : "Se connecter")}
          </button>

          <p className="full-width" style={{ textAlign: 'center', fontSize: '0.8rem', marginTop: '12px' }}>
            {isRegister ? "Déjà un compte ? " : "Pas encore de compte ? "}
            <span 
              style={{ color: '#38bdf8', cursor: 'pointer', fontWeight: 'bold' }} 
              onClick={toggleMode}
            >
              {isRegister ? "Se connecter" : "S'inscrire"}
            </span>
          </p>
        </form>
      </div>
    </div>
  );
}