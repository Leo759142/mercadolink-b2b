import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, ChevronRight, ArrowRight, Sparkles } from 'lucide-react';
import { CarouselItem } from '../types';

interface CarouselProps {
  items: CarouselItem[];
  onSelectTab: (tab: 'productos' | 'proveedores' | 'vendedores' | 'actores' | 'templates' | 'login') => void;
}

export default function Carousel({ items, onSelectTab }: CarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [isSwiping, setIsSwiping] = useState(false);
  const [swipeOffset, setSwipeOffset] = useState(0);
  const carouselRef = useRef<HTMLDivElement>(null);

  // Minimum swipe distance in pixels
  const minSwipeDistance = 50;

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % items.length);
    setSwipeOffset(0);
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + items.length) % items.length);
    setSwipeOffset(0);
  };

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      prevSlide();
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      nextSlide();
    }
  };

  // Touch handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
    setIsSwiping(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStart) return;
    const currentX = e.targetTouches[0].clientX;
    const diffX = currentX - touchStart;
    setSwipeOffset(diffX);
    setTouchEnd(currentX);
  };

  const handleTouchEnd = () => {
    setIsSwiping(false);
    if (!touchStart || !touchEnd) {
      setSwipeOffset(0);
      return;
    }
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      nextSlide();
    } else if (isRightSwipe) {
      prevSlide();
    } else {
      setSwipeOffset(0);
    }
    setTouchStart(null);
    setTouchEnd(null);
  };

  // Mouse drag handlers for desktop touch simulation
  const handleMouseDown = (e: React.MouseEvent) => {
    setTouchStart(e.clientX);
    setIsSwiping(true);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!touchStart || !isSwiping) return;
    const currentX = e.clientX;
    const diffX = currentX - touchStart;
    setSwipeOffset(diffX);
    setTouchEnd(currentX);
  };

  const handleMouseUpOrLeave = () => {
    if (!isSwiping) return;
    setIsSwiping(false);
    if (!touchStart || !touchEnd) {
      setSwipeOffset(0);
      return;
    }
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      nextSlide();
    } else if (isRightSwipe) {
      prevSlide();
    } else {
      setSwipeOffset(0);
    }
    setTouchStart(null);
    setTouchEnd(null);
  };

  // Auto scroll
  useEffect(() => {
    const timer = setInterval(() => {
      if (!isSwiping) {
        nextSlide();
      }
    }, 8000);
    return () => clearInterval(timer);
  }, [currentIndex, isSwiping]);

  return (
    <div 
      id="templates-carousel-container"
      className="relative flex flex-col items-center w-full max-w-4xl mx-auto px-4 py-6 bg-rustic-surface/30 border-2 border-rustic-border rounded-lg shadow-xl overflow-hidden focus:outline-none focus:ring-2 focus:ring-rustic-accent"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      ref={carouselRef}
      aria-label="Carrusel interactivo de plantillas del mercado. Use las teclas de flecha izquierda y derecha para navegar."
    >
      {/* Title */}
      <div className="text-center mb-6">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-rustic-accent/15 text-rustic-accent font-sans text-xs font-semibold uppercase tracking-wider rounded-full border border-rustic-accent/30">
          <Sparkles className="w-3 h-3" /> Vistas del Sistema
        </span>
        <h3 className="text-2xl font-serif text-rustic-yellow mt-2">Vistas Diseñadas para Cada Rol</h3>
        <p className="text-sm font-sans text-rustic-muted mt-1 max-w-md">
          Desliza con el dedo o arrastra con el ratón para explorar las interfaces del mercado.
        </p>
      </div>

      {/* Main Track area */}
      <div 
        className="relative w-full overflow-hidden min-h-[360px] md:min-h-[280px] rounded-md cursor-grab active:cursor-grabbing"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUpOrLeave}
        onMouseLeave={handleMouseUpOrLeave}
      >
        <AnimatePresence initial={false} mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, x: swipeOffset > 0 ? -150 : 150 }}
            animate={{ opacity: 1, x: isSwiping ? swipeOffset : 0 }}
            exit={{ opacity: 0, x: swipeOffset > 0 ? 150 : -150 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="w-full h-full flex flex-col md:flex-row gap-6 p-4 md:p-6 bg-rustic-surface2/60 border border-rustic-border/50 rounded-md"
          >
            {/* Thumbnail Image */}
            <div className="w-full md:w-1/2 h-44 md:h-64 rounded-sm overflow-hidden border-2 border-rustic-border relative shrink-0">
              <img 
                src={items[currentIndex].image} 
                alt={items[currentIndex].title}
                className="w-full h-full object-cover select-none pointer-events-none"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              <div className="absolute bottom-3 left-3 bg-rustic-bg/85 border border-rustic-border px-2 py-1 rounded text-xs text-rustic-accent font-sans">
                {items[currentIndex].title}
              </div>
            </div>

            {/* Information */}
            <div className="flex flex-col justify-between flex-grow">
              <div>
                <h4 className="text-xl font-serif text-rustic-accent flex items-center gap-2">
                  <span>🌾</span> {items[currentIndex].title}
                </h4>
                <p className="text-sm font-sans text-rustic-text mt-2 leading-relaxed">
                  {items[currentIndex].description}
                </p>

                {/* Bullets */}
                <ul className="mt-4 grid grid-cols-1 gap-1.5">
                  {items[currentIndex].bullets.map((bullet, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-xs font-sans text-rustic-muted">
                      <span className="text-rustic-accent select-none">✦</span>
                      <span>{bullet}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Action Button */}
              <div className="mt-6">
                <button
                  id={`carousel-btn-${currentIndex}`}
                  onClick={() => onSelectTab(items[currentIndex].linkTab)}
                  className="w-full md:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-rustic-accent to-rustic-accent2 text-rustic-bg font-sans font-bold text-sm rounded-full border border-rustic-wood shadow-md hover:brightness-110 active:scale-95 transition-all custom-focus"
                  aria-label={`Abrir sección de ${items[currentIndex].title}`}
                >
                  <span>{items[currentIndex].linkText}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Swipe Overlay Helper for touch devices */}
      <div className="w-full flex items-center justify-between mt-6 px-1">
        {/* Previous Button */}
        <button
          id="carousel-prev-control"
          onClick={prevSlide}
          className="w-11 h-11 flex items-center justify-center bg-rustic-surface2 border-2 border-rustic-border hover:bg-rustic-accent hover:text-rustic-bg active:scale-90 text-rustic-text rounded-full transition-all cursor-pointer shadow-md custom-focus"
          aria-label="Ver plantilla anterior"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        {/* Visual Dots Indicators */}
        <div className="flex items-center gap-2.5" role="tablist" aria-label="Indicadores de diapositiva">
          {items.map((item, index) => (
            <button
              id={`carousel-indicator-dot-${index}`}
              key={item.id}
              onClick={() => setCurrentIndex(index)}
              className={`w-3.5 h-3.5 rounded-full transition-all border border-rustic-border cursor-pointer custom-focus ${
                currentIndex === index 
                  ? 'bg-rustic-accent scale-125 shadow-sm shadow-rustic-accent/50' 
                  : 'bg-rustic-surface hover:bg-rustic-surface2'
              }`}
              role="tab"
              aria-selected={currentIndex === index}
              aria-label={`Ir a la diapositiva ${index + 1}: ${item.title}`}
              aria-controls="templates-carousel-container"
            />
          ))}
        </div>

        {/* Next Button */}
        <button
          id="carousel-next-control"
          onClick={nextSlide}
          className="w-11 h-11 flex items-center justify-center bg-rustic-surface2 border-2 border-rustic-border hover:bg-rustic-accent hover:text-rustic-bg active:scale-90 text-rustic-text rounded-full transition-all cursor-pointer shadow-md custom-focus"
          aria-label="Ver plantilla siguiente"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Tactile Gestures Helper Panel */}
      <div className="mt-4 text-center text-xs font-mono text-rustic-muted opacity-80 border-t border-rustic-border/20 pt-3 w-full">
        <span>Gesto táctil habilitado · Desliza o usa flechas del teclado </span>
        <span className="inline-flex gap-1 ml-1 px-1.5 py-0.5 bg-rustic-surface2 rounded text-[10px] text-rustic-accent border border-rustic-border/30">← ↑ →</span>
      </div>
    </div>
  );
}
