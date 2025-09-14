import React from 'react';

export default function MobileMenu({ menuOpen, setMenuOpen }) {
  return (
    <div className={`md:hidden fixed top-0 left-0 w-full h-full bg-gradient-to-br from-slate-900/95 to-purple-900/95 backdrop-blur-2xl z-40 transition-all duration-500 ${menuOpen ? 'opacity-100 visible' : 'opacity-0 invisible'}`}>
      <div className="flex flex-col items-center justify-center h-full space-y-8 text-3xl">
        {['Home', 'Gallery', 'Products', 'Designers', 'Consultations'].map((item, index) => (
          <a key={item} href="#" 
             className={`hover:text-purple-300 transition-all duration-500 transform hover:scale-110 ${menuOpen ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0'}`}
             style={{transitionDelay: `${index * 100}ms`}}
             onClick={() => setMenuOpen(false)}>
            {item}
          </a>
        ))}
      </div>
    </div>
  );
}