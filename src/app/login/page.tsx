import { LoginForm } from '@/modules/auth/components/login-form';

export default function LoginPage() {
  return (
    <main style={{ 
      display: 'flex', 
      minHeight: '100vh', 
      alignItems: 'center', 
      justifyContent: 'center', 
      backgroundColor: '#0a0a0a',
      backgroundImage: `
        linear-gradient(to right, rgba(255,255,255,0.05) 1px, transparent 1px),
        linear-gradient(to bottom, rgba(255,255,255,0.05) 1px, transparent 1px)
      `,
      backgroundSize: '40px 40px',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Dynamic Glow effects */}
      <div style={{
        position: 'absolute',
        top: '20%',
        left: '20%',
        width: '30vw',
        height: '30vw',
        background: 'radial-gradient(circle, rgba(16, 185, 129, 0.08) 0%, transparent 70%)',
        filter: 'blur(80px)',
        zIndex: 0
      }} />
      <div style={{
        position: 'absolute',
        bottom: '20%',
        right: '20%',
        width: '30vw',
        height: '30vw',
        background: 'radial-gradient(circle, rgba(59, 130, 246, 0.08) 0%, transparent 70%)',
        filter: 'blur(80px)',
        zIndex: 0
      }} />

      {/* Decorative center glow */}
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '500px',
        height: '500px',
        background: 'radial-gradient(circle, rgba(255, 255, 255, 0.03) 0%, transparent 60%)',
        filter: 'blur(40px)',
        zIndex: 0
      }} />

      <div style={{ position: 'relative', zIndex: 1, width: '100%', display: 'flex', justifyContent: 'center', padding: '16px' }}>
        <LoginForm />
      </div>
    </main>
  );
}
