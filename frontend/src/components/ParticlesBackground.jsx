import { useEffect } from "react";

export default function ParticlesBackground() {
  useEffect(() => {
    // Create particles
    const createParticle = () => {
      const particle = document.createElement('div');
      particle.className = 'absolute w-2 h-2 bg-purple-400/20 rounded-full animate-pulse';
      particle.style.left = Math.random() * 100 + '%';
      particle.style.top = Math.random() * 100 + '%';
      particle.style.animationDelay = Math.random() * 3 + 's';
      particle.style.animationDuration = (Math.random() * 10 + 10) + 's';

      const container = document.querySelector('.particles-container');
      if (container) {
        container.appendChild(particle);

        // Remove particle after animation
        setTimeout(() => {
          if (particle.parentNode) {
            particle.parentNode.removeChild(particle);
          }
        }, 13000);
      }
    };

    // Create particles every 2 seconds
    const interval = setInterval(createParticle, 2000);

    // Initial particles
    for (let i = 0; i < 5; i++) {
      setTimeout(createParticle, i * 500);
    }

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="particles-container fixed inset-0 pointer-events-none z-0">
      {/* Gradient overlays */}
      <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-purple-100/20 via-transparent to-purple-200/20"></div>
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-br from-purple-200/30 rounded-full mix-blend-multiply filter blur-3xl animate-pulse"></div>
      <div className="absolute top-3/4 right-1/4 w-80 h-80 bg-gradient-to-br from-purple-300/30 rounded-full mix-blend-multiply filter blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
      <div className="absolute bottom-1/4 left-1/3 w-72 h-72 bg-gradient-to-br from-purple-400/30 rounded-full mix-blend-multiply filter blur-3xl animate-pulse" style={{ animationDelay: '4s' }}></div>

      {/* Floating geometric shapes */}
      <div className="absolute top-1/3 left-1/6 w-16 h-16 border-2 border-purple-400/40 backdrop-blur-xl bg-white/10 rotate-45 animate-spin rounded-lg shadow-2xl shadow-purple-500/20" style={{ animationDuration: '20s' }}></div>
      <div className="absolute bottom-1/3 right-1/6 w-12 h-12 bg-gradient-to-r from-purple-400/20 to-purple-500/20 backdrop-blur-xl rounded-full border border-purple-400/40 shadow-lg shadow-purple-500/20" style={{ animationDelay: '1s' }}></div>
    </div>
  );
}