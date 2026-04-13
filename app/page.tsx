export default function Home() {
  return (
    <>
      {/* Animated background blobs */}
      <div style={{
        position: 'fixed',
        inset: 0,
        zIndex: -1,
        overflow: 'hidden',
        background: '#FBFBFD',
      }}>
        <div style={{
          position: 'absolute',
          top: '-10%',
          left: '-10%',
          width: '600px',
          height: '600px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(143,221,231,0.35) 0%, transparent 70%)',
          animation: 'gradientShift 15s ease-in-out infinite',
        }} />
        <div style={{
          position: 'absolute',
          top: '20%',
          right: '-5%',
          width: '500px',
          height: '500px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(31,111,139,0.2) 0%, transparent 70%)',
          animation: 'gradientShift 18s ease-in-out infinite reverse',
        }} />
        <div style={{
          position: 'absolute',
          bottom: '-10%',
          left: '30%',
          width: '700px',
          height: '700px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255,111,97,0.12) 0%, transparent 70%)',
          animation: 'gradientShift 20s ease-in-out infinite',
        }} />
      </div>

      <main style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '4rem 2rem',
      }}>
        <div style={{ maxWidth: '680px', width: '100%' }}>

          {/* Badge */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            background: 'rgba(31,111,139,0.08)',
            border: '1px solid rgba(31,111,139,0.2)',
            borderRadius: '100px',
            padding: '0.35rem 1rem',
            marginBottom: '2rem',
          }}>
            <div style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              background: 'var(--color-teal)',
            }} />
            <span style={{
              fontSize: 'var(--text-xs)',
              color: 'var(--color-teal)',
              fontWeight: 400,
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
            }}>
              Specialized recruiting for 50+ and veterans
            </span>
          </div>

          {/* Headline */}
          <h1 style={{
            fontSize: 'clamp(2.5rem, 6vw, var(--text-4xl))',
            fontFamily: 'var(--font-heading)',
            fontWeight: 300,
            color: 'var(--color-charcoal)',
            lineHeight: 1.15,
            marginBottom: '1.5rem',
            letterSpacing: '-0.02em',
          }}>
            We connect the right people<br />
            with the right{' '}
            <span style={{ color: 'var(--color-teal)' }}>work.</span>
          </h1>

          {/* Subheading */}
          <p style={{
            fontSize: 'var(--text-lg)',
            color: 'var(--color-muted)',
            fontFamily: 'var(--font-body)',
            fontWeight: 300,
            lineHeight: 1.7,
            marginBottom: '2.5rem',
            maxWidth: '520px',
          }}>
            High Point Search specializes in placing experienced professionals —
            50+ age and veterans — with employers who value what they bring.
          </p>

          {/* CTAs */}
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '4rem' }}>
            <a href="/apply" className="btn-primary">Find opportunities</a>
            <a href="/employers" className="btn-outline">I'm an employer</a>
          </div>

          {/* Glass cards row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
            {[
              { label: 'Apply in minutes', sub: 'Simple, guided onboarding', color: 'var(--color-teal)' },
              { label: 'We match you', sub: 'Smart matching engine', color: 'var(--color-coral)' },
              { label: 'Get hired', sub: 'With employers who care', color: 'var(--color-mint)' },
            ].map((item) => (
              <div key={item.label} className="glass-card" style={{ padding: '1.5rem' }}>
                <div style={{
                  width: '10px',
                  height: '10px',
                  borderRadius: '50%',
                  background: item.color,
                  marginBottom: '1rem',
                }} />
                <h4 style={{
                  fontSize: 'var(--text-md)',
                  fontFamily: 'var(--font-heading)',
                  fontWeight: 500,
                  marginBottom: '0.25rem',
                  color: 'var(--color-charcoal)',
                }}>
                  {item.label}
                </h4>
                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-muted)' }}>
                  {item.sub}
                </p>
              </div>
            ))}
          </div>

        </div>
      </main>
    </>
  )
}