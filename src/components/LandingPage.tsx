import { useEffect, useRef } from 'react'
import * as THREE from 'three'

interface Props {
  onEnter: () => void
  onQuizz: () => void
}

export default function LandingPage({ onEnter, onQuizz }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const cardTlRef = useRef<HTMLDivElement>(null)
  const cardBrRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(52, window.innerWidth / window.innerHeight, 0.1, 100)
    camera.position.set(0, 0.15, 6.8)

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true })
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.65

    const cluster = new THREE.Group()
    scene.add(cluster)

    const mkMat = (emissive: number, opacity: number) =>
      new THREE.MeshPhysicalMaterial({
        color: 0x040009,
        emissive: new THREE.Color(emissive),
        emissiveIntensity: 0.9,
        metalness: 0.88,
        roughness: 0.06,
        transparent: true,
        opacity,
        side: THREE.DoubleSide,
      })

    const mats = [
      mkMat(0xFF1C74, 0.80),
      mkMat(0xCC0055, 0.85),
      mkMat(0xFF00BB, 0.76),
      mkMat(0xAA00DD, 0.78),
      mkMat(0xFF4499, 0.82),
      mkMat(0xDD0088, 0.80),
    ]

    const edgeBaseMat = new THREE.LineBasicMaterial({ color: 0xFF5599, transparent: true, opacity: 0.48 })

    const defs: Array<[[number, number, number], [number, number, number], [number, number, number]]> = [
      [[1.44, 2.04, 0.88], [ 0.00,  0.00,  0.00], [0.00,  0.00,  0.00]],
      [[1.02, 1.52, 0.82], [-0.92,  0.44, -0.50], [0.05,  0.28,  0.08]],
      [[1.18, 0.88, 1.02], [ 0.88, -0.52,  0.30], [0.10, -0.22,  0.05]],
      [[0.68, 0.68, 0.68], [ 0.26,  1.28,  0.55], [-0.18, 0.42,  0.28]],
      [[0.82, 0.62, 0.74], [-0.58, -1.12,  0.24], [0.12,  0.18, -0.22]],
      [[0.52, 1.08, 0.62], [ 1.06,  0.82, -0.56], [0.22, -0.32,  0.10]],
      [[0.56, 0.46, 0.40], [-0.19, -0.46,  0.88], [-0.10, 0.52,  0.18]],
      [[0.50, 0.40, 0.50], [ 0.54, -1.38, -0.32], [0.32,  0.22, -0.10]],
      [[0.40, 0.84, 0.50], [-1.24, -0.30,  0.14], [0.10,  0.30,  0.18]],
      [[0.30, 0.30, 0.30], [ 0.84,  1.58,  0.32], [0.38,  0.12,  0.30]],
      [[0.60, 0.30, 0.80], [-0.44,  1.58, -0.22], [0.22, -0.38,  0.12]],
      [[0.34, 0.60, 0.34], [ 1.34, -0.08,  0.54], [-0.12, 0.58,  0.22]],
    ]

    defs.forEach(([size, pos, rot], i) => {
      const geo  = new THREE.BoxGeometry(...size)
      const mesh = new THREE.Mesh(geo, mats[i % mats.length])
      mesh.position.set(...pos)
      mesh.rotation.set(...rot)
      cluster.add(mesh)

      const em  = edgeBaseMat.clone()
      em.opacity = 0.28 + (i % 4) * 0.08
      const eg  = new THREE.EdgesGeometry(geo)
      const seg = new THREE.LineSegments(eg, em)
      seg.position.copy(mesh.position)
      seg.rotation.copy(mesh.rotation)
      cluster.add(seg)
    })

    const lightDefs: Array<[number, number, number, [number, number, number]]> = [
      [0xFF1C74, 12, 20, [ 0.0,  0.0,  4.0]],
      [0xFF00CC,  8, 16, [ 3.5,  2.0,  0.0]],
      [0x8800BB,  6, 14, [-3.5, -1.0,  0.0]],
      [0xFF6699,  7, 14, [ 0.0,  4.0,  2.0]],
      [0xCC0044,  5, 12, [ 0.0, -3.5,  2.0]],
      [0xFFAACC,  3, 10, [-2.0,  2.5,  2.5]],
    ]

    lightDefs.forEach(([color, intensity, dist, p]) => {
      const light = new THREE.PointLight(color, intensity, dist)
      light.position.set(...p)
      scene.add(light)
    })
    scene.add(new THREE.AmbientLight(0x0D000A, 1.5))

    let t = 0
    let rafId: number
    const animate = () => {
      rafId = requestAnimationFrame(animate)
      t += 0.060
      cluster.rotation.y = t * 0.32
      cluster.rotation.x = Math.sin(t * 0.21) * 0.11
      cluster.rotation.z = Math.sin(t * 0.14) * 0.04
      renderer.render(scene, camera)
    }
    animate()

    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight
      camera.updateProjectionMatrix()
      renderer.setSize(window.innerWidth, window.innerHeight)
    }
    window.addEventListener('resize', handleResize)

    const t1 = setTimeout(() => cardTlRef.current?.classList.add('lp-card-show'), 700)
    const t2 = setTimeout(() => cardBrRef.current?.classList.add('lp-card-show'), 980)

    return () => {
      cancelAnimationFrame(rafId)
      window.removeEventListener('resize', handleResize)
      clearTimeout(t1)
      clearTimeout(t2)
      renderer.dispose()
    }
  }, [])

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#020104', fontFamily: "'Outfit', sans-serif", overflow: 'hidden' }}>
      {/* Fonts */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=Outfit:wght@300;400;500;600&display=swap');

        .lp-card { opacity: 0; }
        .lp-card-show {
          animation:
            lp-cardIn  0.85s cubic-bezier(0.16, 1, 0.3, 1) forwards,
            lp-floatY  7.0s ease-in-out 0.85s infinite;
        }
        .lp-card-br.lp-card-show {
          animation:
            lp-cardIn  0.85s cubic-bezier(0.16, 1, 0.3, 1) forwards,
            lp-floatY  9.5s ease-in-out 0.85s infinite;
        }
        @keyframes lp-cardIn {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes lp-floatY {
          0%, 100% { transform: translateY(0); }
          50%       { transform: translateY(-7px); }
        }
        @keyframes lp-slideUp {
          from { opacity: 0; transform: translateY(22px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes lp-ripple {
          0%  { box-shadow: 0 0 0 0   rgba(255,28,116,0.55); }
          70% { box-shadow: 0 0 0 7px rgba(255,28,116,0); }
          100%{ box-shadow: 0 0 0 0   rgba(255,28,116,0); }
        }
        .lp-hero-left  { animation: lp-slideUp 1s cubic-bezier(0.16,1,0.3,1) 0.15s both; }
        .lp-hero-right { animation: lp-slideUp 1s cubic-bezier(0.16,1,0.3,1) 0.35s both; }
        .lp-badge-dot  { animation: lp-ripple 2.2s ease-out infinite; }

        .lp-launch-btn:hover { box-shadow: 0 0 34px rgba(255,28,116,0.58); transform: translateY(-1px); }
        .lp-buy-btn:hover    { transform: translateY(-2px); box-shadow: 0 0 0 1px rgba(255,28,116,0.42), 0 12px 40px rgba(204,0,85,0.58), inset 0 1px 0 rgba(255,255,255,0.18); }
        .lp-nav-link:hover   { color: #F2EAF6; }
      `}</style>

      {/* Canvas */}
      <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} />

      {/* Glow orb */}
      <div style={{
        position: 'absolute', top: '50%', left: '50%',
        transform: 'translate(-50%,-50%)',
        width: 700, height: 700, borderRadius: '50%',
        background: 'radial-gradient(ellipse at center, rgba(200,0,100,0.20) 0%, rgba(110,0,160,0.09) 42%, transparent 68%)',
        filter: 'blur(18px)', pointerEvents: 'none', zIndex: 1,
      }} />

      {/* Grid */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 2, pointerEvents: 'none',
        backgroundImage: 'linear-gradient(rgba(255,28,116,0.028) 1px, transparent 1px), linear-gradient(90deg, rgba(255,28,116,0.028) 1px, transparent 1px)',
        backgroundSize: '70px 70px',
      }} />

      {/* Navbar */}
      <nav style={{
        position: 'absolute', top: 0, left: 0, right: 0, zIndex: 100,
        height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 44px',
        background: 'rgba(2,1,4,0.62)',
        backdropFilter: 'blur(24px) saturate(180%)',
        borderBottom: '1px solid rgba(255,28,116,0.22)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 'clamp(14px, 4vw, 17px)', letterSpacing: '0.03em', color: '#F2EAF6' }}>
          <svg width="26" height="26" viewBox="0 0 28 28" fill="none" style={{ filter: 'drop-shadow(0 0 10px rgba(255,28,116,0.85))' }}>
            <path d="M14 2L2 10L14 26L26 10L14 2Z" fill="rgba(255,28,116,0.14)" stroke="#FF1C74" strokeWidth="1.5" strokeLinejoin="round"/>
            <path d="M14 2L9 10L14 26L19 10L14 2Z" fill="rgba(255,28,116,0.1)" stroke="#FF1C74" strokeWidth="0.75" strokeLinejoin="round"/>
            <line x1="2" y1="10" x2="26" y2="10" stroke="#FF1C74" strokeWidth="0.75" strokeOpacity="0.45"/>
          </svg>
          Atlas
        </div>

        <ul style={{ display: 'none', alignItems: 'center', gap: 26, listStyle: 'none', margin: 0, padding: 0 }}>
          {['Home', 'Tokenomics & Revenue model'].map(link => (
            <li key={link}>
              <a href="#" className="lp-nav-link" style={{ fontSize: 12.5, fontWeight: 400, color: 'rgba(242,234,246,0.48)', textDecoration: 'none', letterSpacing: '0.012em', transition: 'color 0.18s' }}>
                {link}
              </a>
            </li>
          ))}
        </ul>

        <button
          className="lp-launch-btn"
          onClick={onQuizz}
          style={{
            padding: 'clamp(6px, 2vw, 8px) clamp(16px, 4vw, 20px)', borderRadius: 100, border: 'none',
            background: 'linear-gradient(135deg, #FF1C74, #CC0055)',
            color: '#fff', fontFamily: "'Outfit', sans-serif",
            fontSize: 'clamp(11px, 2.5vw, 13px)', fontWeight: 600, letterSpacing: '0.025em',
            cursor: 'pointer',
            boxShadow: '0 0 22px rgba(255,28,116,0.38)',
            transition: 'box-shadow 0.2s, transform 0.15s',
          }}
        >
          QUIZZ
        </button>
      </nav>

      {/* Stat card — top left */}
      <div ref={cardTlRef} className="lp-card lp-card-tl" style={{
        position: 'absolute', top: 'clamp(20px, 5vh, 94px)', left: 'clamp(12px, 3vw, 44px)', zIndex: 30,
        background: 'rgba(5,1,10,0.72)',
        backdropFilter: 'blur(20px) saturate(200%)',
        border: '1px solid rgba(255,28,116,0.22)',
        borderRadius: 18, padding: 'clamp(16px, 3vw, 20px)', minWidth: 'clamp(160px, 80vw, 228px)',
      }}>
        <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 'clamp(20px, 5vw, 28px)', lineHeight: 1, letterSpacing: '-0.02em', background: 'linear-gradient(135deg, #FF88BB, #FF1C74)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          Mise à jour
        </div>
        <div style={{ width: 30, height: 1, background: 'rgba(255,28,116,0.4)', margin: '12px 0' }} />
        <div style={{ fontSize: 'clamp(9px, 2vw, 11px)', fontWeight: 400, color: 'rgba(242,234,246,0.48)', lineHeight: 1.5, maxWidth: 175, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
          Alternative Investments Intelligence
        </div>
      </div>

      {/* Stat card — bottom right */}
      <div ref={cardBrRef} className="lp-card lp-card-br" style={{
        position: 'absolute', bottom: 'clamp(20px, 10vh, 138px)', right: 'clamp(12px, 3vw, 44px)', zIndex: 30,
        background: 'rgba(5,1,10,0.72)',
        backdropFilter: 'blur(20px) saturate(200%)',
        border: '1px solid rgba(255,28,116,0.22)',
        borderRadius: 18, padding: 'clamp(16px, 3vw, 20px)', minWidth: 'clamp(160px, 80vw, 228px)',
      }}>
        <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 'clamp(20px, 5vw, 28px)', lineHeight: 1, letterSpacing: '-0.02em', background: 'linear-gradient(135deg, #FF88BB, #FF1C74)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          Docs Internes
        </div>
        <div style={{ width: 30, height: 1, background: 'rgba(255,28,116,0.4)', margin: '12px 0' }} />
        <div style={{ fontSize: 'clamp(9px, 2vw, 11px)', fontWeight: 400, color: 'rgba(242,234,246,0.48)', lineHeight: 1.5, maxWidth: 175, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
          Assets backed by the vault at launch
        </div>
      </div>

      {/* Hero — bottom left */}
      <div className="lp-hero-left" style={{ position: 'absolute', bottom: 'clamp(20px, 5vh, 50px)', left: 'clamp(12px, 3vw, 44px)', zIndex: 40 }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 7,
          padding: '5px 14px 5px 10px', borderRadius: 100,
          background: 'rgba(255,28,116,0.10)',
          border: '1px solid rgba(255,28,116,0.30)',
          fontSize: 'clamp(9px, 2vw, 10.5px)', fontWeight: 500, color: '#FF77AA',
          letterSpacing: '0.07em', textTransform: 'uppercase' as const,
          marginBottom: 14,
        }}>
          <span className="lp-badge-dot" style={{ width: 6, height: 6, borderRadius: '50%', background: '#FF1C74', display: 'inline-block' }} />
          AI-Syndicale
        </div>
        <div style={{
          fontFamily: "'Syne', sans-serif", fontWeight: 800,
          fontSize: 'clamp(40px, 12vw, 98px)', lineHeight: 0.9, letterSpacing: '-0.04em',
          background: 'linear-gradient(165deg, #FFFFFF 22%, rgba(255,110,160,0.72) 100%)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
        }}>
          Atlas
        </div>
      </div>

      {/* Hero — bottom right */}
      <div className="lp-hero-right" style={{ position: 'absolute', bottom: 'clamp(20px, 5vh, 50px)', right: 'clamp(12px, 3vw, 44px)', zIndex: 40, textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
        <p style={{ fontSize: 'clamp(12px, 3vw, 14px)', fontWeight: 300, color: 'rgba(242,234,246,0.48)', lineHeight: 1.65, letterSpacing: '0.01em', marginBottom: 20 }}>
          Votre syndicat CFDT,<br />De GENNEVILLIERS
        </p>
        <button
          className="lp-buy-btn"
          onClick={onEnter}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 9,
            padding: 'clamp(10px, 2.5vw, 13px) clamp(20px, 4vw, 26px)', borderRadius: 12, border: 'none',
            background: 'linear-gradient(135deg, #FF1C74, #CC0055)',
            color: '#fff', fontFamily: "'Outfit', sans-serif",
            fontSize: 'clamp(13px, 3vw, 15px)', fontWeight: 600, letterSpacing: '0.02em',
            cursor: 'pointer',
            boxShadow: '0 0 0 1px rgba(255,28,116,0.25), 0 6px 28px rgba(204,0,85,0.42), inset 0 1px 0 rgba(255,255,255,0.12)',
            transition: 'transform 0.2s, box-shadow 0.2s',
          }}
        >
          Entrée
          <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
            <path d="M2.5 7.5H12.5M12.5 7.5L8.5 3.5M12.5 7.5L8.5 11.5" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>

      {/* Edge line */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, height: 1,
        background: 'linear-gradient(90deg, transparent, rgba(255,28,116,0.22) 30%, rgba(255,28,116,0.22) 70%, transparent)',
        zIndex: 100, pointerEvents: 'none',
      }} />
    </div>
  )
}
