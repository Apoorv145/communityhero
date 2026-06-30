import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, Lock, Mail, ArrowRight, ShieldCheck, Activity, MapPin } from 'lucide-react';

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, signup } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      setError('');
      setLoading(true);
      if (isLogin) {
        await login(email, password);
      } else {
        await signup(email, password);
      }
      navigate('/');
    } catch (err) {
      setError(err.message || 'Failed to authenticate. Ensure Firebase keys are in .env.local');
    } finally {
      setLoading(false);
    }
  }

  const [nodes, setNodes] = useState([]);
  useEffect(() => {
    const newNodes = Array.from({ length: 25 }).map((_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 80 + 20,
      delay: Math.random() * 5,
      duration: Math.random() * 6 + 4
    }));
    setNodes(newNodes);
  }, []);

  return (
    <div className="flex items-center justify-center w-full" style={{ position: 'relative', minHeight: '100vh', overflow: 'hidden', backgroundColor: 'var(--bg-color)' }}>
      
      {/* BACKGROUND OVERLAY ANIMATIONS */}
      <div className="flex items-center justify-center" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 0, pointerEvents: 'none' }}>
        
        {/* Scrolling Grid Background */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: 0.1,
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.2) 1px, transparent 1px)',
          backgroundSize: '50px 50px',
          animation: 'scrollGrid 20s linear infinite'
        }}></div>

        {/* Central Graphic */}
        <div style={{ position: 'absolute', opacity: 0.15, transform: 'scale(2.5)' }}>
           <ShieldCheck size={200} style={{ color: 'var(--secondary-color)', margin: '0 auto', filter: 'drop-shadow(0 0 50px rgba(139, 92, 246, 0.8))', animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' }}/>
        </div>

        {/* Floating Data Nodes */}
        {nodes.map(node => (
          <div 
            key={node.id}
            style={{
              position: 'absolute',
              borderRadius: '50%', // Fixing the squares issue!
              left: `${node.x}%`,
              top: `${node.y}%`,
              width: `${node.size}px`,
              height: `${node.size}px`,
              background: node.id % 2 === 0 ? 'rgba(6, 182, 212, 0.05)' : 'rgba(139, 92, 246, 0.05)',
              border: `1px solid ${node.id % 2 === 0 ? 'rgba(6, 182, 212, 0.2)' : 'rgba(139, 92, 246, 0.2)'}`,
              boxShadow: `0 0 30px ${node.id % 2 === 0 ? 'rgba(6, 182, 212, 0.1)' : 'rgba(139, 92, 246, 0.1)'}`,
              animation: `floatNode ${node.duration}s ease-in-out ${node.delay}s infinite alternate`
            }}
          />
        ))}

        <style dangerouslySetInnerHTML={{__html: `
          @keyframes floatNode {
            0% { transform: translateY(0) scale(1); opacity: 0.1; }
            100% { transform: translateY(-100px) scale(1.2); opacity: 0.6; }
          }
          @keyframes scrollGrid {
            0% { transform: translateY(0); }
            100% { transform: translateY(50px); }
          }
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: .5; }
          }
        `}} />
      </div>

      {/* FOREGROUND: Compact Authentication Panel */}
      <div className="glass-panel animate-fade-in flex-col" style={{
        zIndex: 10, position: 'relative', width: '100%', maxWidth: '380px', margin: '0 20px', padding: '2rem',
        backgroundColor: 'rgba(0, 0, 0, 0.7)', backdropFilter: 'blur(20px)', borderRadius: '24px',
        boxShadow: '0 0 50px rgba(6, 182, 212, 0.15)', border: '1px solid rgba(255,255,255,0.1)'
      }}>
        
        {/* Subtle glass reflection */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '40%', background: 'linear-gradient(to bottom, rgba(255,255,255,0.05), transparent)', pointerEvents: 'none' }}></div>

        <div className="flex-col items-center justify-center" style={{ textAlign: 'center', marginBottom: '2rem', position: 'relative', zIndex: 20 }}>
          <AlertTriangle size={48} style={{ color: 'var(--primary-color)', filter: 'drop-shadow(0 0 15px rgba(6,182,212,0.5))', margin: '0 auto 1rem auto' }} />
          <h2 className="font-bold text-white" style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>{isLogin ? 'Access Portal' : 'Join Network'}</h2>
          <p className="text-muted" style={{ fontSize: '0.75rem', letterSpacing: '1px', textTransform: 'uppercase' }}>Community Hero</p>
        </div>

        {error && (
          <div className="flex items-center gap-2" style={{ backgroundColor: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171', padding: '1rem', borderRadius: '12px', fontSize: '0.875rem', marginBottom: '1.5rem', position: 'relative', zIndex: 20 }}>
            <AlertTriangle size={18} style={{ flexShrink: 0 }} /> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex-col gap-4" style={{ position: 'relative', zIndex: 20 }}>
          <div style={{ position: 'relative' }}>
            <Mail size={18} className="text-muted" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
            <input 
              type="email" 
              required 
              className="input-field w-full" 
              style={{ paddingLeft: '3rem', height: '50px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
              placeholder="Official Email Address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          
          <div style={{ position: 'relative' }}>
            <Lock size={18} className="text-muted" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
            <input 
              type="password" 
              required 
              className="input-field w-full" 
              style={{ paddingLeft: '3rem', height: '50px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
              placeholder="Secure Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button disabled={loading} type="submit" className="btn-primary w-full" style={{ height: '50px', marginTop: '1rem', fontSize: '1rem' }}>
            {loading ? 'Authenticating...' : isLogin ? 'Log In' : 'Sign Up'}
            {!loading && <ArrowRight size={18} />}
          </button>
        </form>

        <div style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.1)', textAlign: 'center', position: 'relative', zIndex: 20 }}>
          <p className="text-muted" style={{ fontSize: '0.875rem' }}>
            {isLogin ? "New user? " : "Already have an account? "}
            <button 
              type="button" 
              style={{ color: 'var(--primary-color)', fontWeight: 'bold', marginLeft: '0.25rem' }}
              onClick={() => setIsLogin(!isLogin)}
            >
              {isLogin ? 'Sign Up' : 'Log In'}
            </button>
          </p>
        </div>

      </div>
    </div>
  );
}
