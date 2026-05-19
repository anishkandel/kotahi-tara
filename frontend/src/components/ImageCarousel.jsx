import { useEffect, useState } from 'react';

export default function ImageCarousel({ images = [], alt = '' }) {
  const [current, setCurrent] = useState(0);

  const validImages = images.filter(img => img && img.trim() !== '');

  useEffect(() => {
    if (validImages.length <= 1) return;
    const interval = setInterval(() => {
      setCurrent(prev => (prev + 1) % validImages.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [validImages.length]);

  if (validImages.length === 0) return null;

  return (
    <div className="relative w-full overflow-hidden rounded-xl bg-[#0A0A0F]">
      {validImages.map((img, index) => (
        <img
          key={index}
          src={img}
          alt={`${alt} ${index + 1}`}
          className={`w-full object-contain max-h-[400px] transition-opacity duration-400 ${
  index === current ? 'opacity-100' : 'opacity-0 absolute inset-0'
}`}
        />
      ))}

      {/* Dots */}
      {validImages.length > 1 && (
        <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5">
          {validImages.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrent(index)}
              className={`h-2 rounded-full transition-all ${
                index === current ? 'bg-[#00FFB2] w-4' : 'bg-white/40 w-2'
              }`}
            />
          ))}
        </div>
      )}

      {/* Arrows */}
      {validImages.length > 1 && (
        <>
          <button
            onClick={() => setCurrent((current - 1 + validImages.length) % validImages.length)}
            className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/80 transition-all"
          >
            ‹
          </button>
          <button
            onClick={() => setCurrent((current + 1) % validImages.length)}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/80 transition-all"
          >
            ›
          </button>
        </>
      )}
    </div>
  );
}