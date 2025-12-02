import React, { useState, useRef, useEffect } from 'react';

type Props = {
  imagePath: string;
  imageName: string;
  className?: string;
};

export function ImagePreview({ imagePath, imageName, className = '' }: Props) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Convert Windows path to URL-safe format
  const imageUrl = `/wails-image/${encodeURIComponent(imagePath.replace(/\\/g, '/'))}`;

  // Intersection Observer to detect when image is visible
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, []);

  if (!isVisible) {
    return (
      <div ref={containerRef} className={`flex items-center justify-center bg-slate-800 ${className}`} />
    );
  }

  if (error) {
    return (
      <div ref={containerRef} className={`flex items-center justify-center bg-slate-800 ${className}`}>
        <span className="text-2xl leading-none">🖼️</span>
      </div>
    );
  }

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-800">
          <div className="animate-spin rounded-full h-6 w-6 border-2 border-slate-600 border-t-slate-400"></div>
        </div>
      )}
      <img
        src={imageUrl}
        alt={imageName}
        className="w-full h-full object-cover"
        onLoad={() => setLoading(false)}
        onError={() => {
          setError(true);
          setLoading(false);
        }}
      />
    </div>
  );
}

