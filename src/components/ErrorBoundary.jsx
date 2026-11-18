import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  handleReset = () => {
    try {
      // Remove only the active career (the one that crashed), keep the other slots
      const slot = localStorage.getItem('el_idolo_active_slot') || '1';
      localStorage.removeItem(`el_idolo_slot_${slot}`);
      if (slot === '1') localStorage.removeItem('el_idolo_career_save_v1');
    } catch (e) {
      console.error(e);
    }
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#040705] text-gray-100 flex flex-col items-center justify-center p-6 text-center select-none">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#22E748] to-[#15803d] flex items-center justify-center shadow-[0_0_25px_rgba(34,231,72,0.3)] mb-4">
            <span className="text-3xl">⚽</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-white mb-2">
            ¡El árbitro paró el partido!
          </h1>
          <p className="text-sm text-gray-400 max-w-md mb-6 leading-relaxed">
            Ocurrió un error inesperado en la simulación. Podés intentar recargar o reiniciar para comenzar una nueva carrera limpia desde el potrero.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => window.location.reload()}
              className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-sm transition-all cursor-pointer"
            >
              Recargar Página
            </button>
            <button
              onClick={this.handleReset}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#22E748] to-[#16a34a] text-black font-black text-sm shadow-lg hover:brightness-110 transition-all cursor-pointer"
            >
              Reiniciar Partida Limpia
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
