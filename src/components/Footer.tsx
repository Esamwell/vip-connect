
export function Footer() {
  return (
    <footer className="py-12 border-t border-border" style={{ backgroundColor: '#a41316' }}>
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Logo */}
          <div className="flex items-center gap-5">
            <img 
              src="/logovipasi.png" 
              alt="Cliente VIP" 
              className="w-32 h-32 md:w-40 md:h-40 object-contain drop-shadow-xl brightness-110 contrast-115"
              style={{ imageRendering: 'crisp-edges' }}
            />
            <div>
              <span className="font-display font-bold text-xl md:text-2xl text-white">
                Cliente VIP
              </span>
              <p className="text-sm md:text-base text-white/70">
                Auto Shopping Itapoan
              </p>
            </div>
          </div>

          {/* Links */}
          <nav className="flex flex-wrap justify-center gap-6 text-sm text-white/80">
            <a 
              href="#" 
              className="transition-colors hover:text-white"
              onMouseEnter={(e) => e.currentTarget.style.color = '#fff'}
              onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(255, 255, 255, 0.8)'}
            >
              Termos de Uso
            </a>
            <a 
              href="#" 
              className="transition-colors hover:text-white"
              onMouseEnter={(e) => e.currentTarget.style.color = '#fff'}
              onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(255, 255, 255, 0.8)'}
            >
              Privacidade
            </a>
            <a 
              href="#" 
              className="transition-colors hover:text-white"
              onMouseEnter={(e) => e.currentTarget.style.color = '#fff'}
              onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(255, 255, 255, 0.8)'}
            >
              Regulamento
            </a>
            <a 
              href="#" 
              className="transition-colors hover:text-white"
              onMouseEnter={(e) => e.currentTarget.style.color = '#fff'}
              onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(255, 255, 255, 0.8)'}
            >
              Lojas Participantes
            </a>
          </nav>

          {/* Copyright */}
          <p className="text-xs text-white/60">
            © {new Date().getFullYear()} Auto Shopping Itapoan. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}
