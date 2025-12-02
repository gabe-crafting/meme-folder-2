import React, { useEffect, useState, useRef } from 'react';

type Props = {
  videoPath: string;
  videoName: string;
  className?: string;
};

export function VideoPreview({ videoPath, videoName, className = '' }: Props) {
  const [thumbnail, setThumbnail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const videoUrl = `/wails-image/${encodeURIComponent(videoPath.replace(/\\/g, '/'))}`;

  // Intersection Observer to detect when video preview is visible
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        } else {
          // When scrolled out of view, cancel loading
          setIsVisible(false);
          if (videoRef.current) {
            videoRef.current.src = '';
            videoRef.current.load();
          }
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

  // Generate thumbnail when visible
  useEffect(() => {
    if (!isVisible) return;

    // Reset state when becoming visible
    setLoading(true);
    setError(false);
    setThumbnail(null);

    const video = videoRef.current;
    if (!video) return;

    let mounted = true;
    let timeoutId: NodeJS.Timeout;

    const generateThumbnail = () => {
      if (!mounted) return;
      
      try {
        // Small delay to ensure video is ready
        timeoutId = setTimeout(() => {
          if (!mounted || !video.videoWidth || !video.videoHeight) {
            if (mounted) {
              setError(true);
              setLoading(false);
            }
            return;
          }

          const canvas = document.createElement('canvas');
          // Limit canvas size for performance (max 200x200)
          const scale = Math.min(200 / video.videoWidth, 200 / video.videoHeight, 1);
          canvas.width = video.videoWidth * scale;
          canvas.height = video.videoHeight * scale;
          
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            if (mounted) {
              setError(true);
              setLoading(false);
            }
            return;
          }

          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.5); // Lower quality for speed
          
          if (mounted) {
            setThumbnail(dataUrl);
            setLoading(false);
          }
        }, 100);
      } catch (err) {
        console.error('Failed to generate thumbnail:', err);
        if (mounted) {
          setError(true);
          setLoading(false);
        }
      }
    };

    const handleError = () => {
      if (mounted) {
        setError(true);
        setLoading(false);
      }
    };

    video.addEventListener('loadeddata', generateThumbnail);
    video.addEventListener('error', handleError);

    return () => {
      mounted = false;
      clearTimeout(timeoutId);
      video.removeEventListener('loadeddata', generateThumbnail);
      video.removeEventListener('error', handleError);
      
      // Cancel video loading when component unmounts or scrolls out
      if (video) {
        video.src = '';
        video.load();
      }
    };
  }, [isVisible, videoUrl]);

  if (!isVisible) {
    return (
      <div ref={containerRef} className={`flex items-center justify-center bg-muted ${className}`} />
    );
  }

  if (error || (!thumbnail && !loading)) {
    return (
      <div ref={containerRef} className={`relative flex items-center justify-center bg-muted ${className}`}>
        <span className="text-3xl leading-none">🎬</span>
        <div className="absolute bottom-0 right-0 bg-background/80 px-1 rounded-tl text-[8px] leading-tight">
          VIDEO
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted">
          <div className="animate-spin rounded-full h-6 w-6 border-2 border-border border-t-muted-foreground"></div>
        </div>
      )}
      {/* Hidden video for thumbnail generation */}
      {isVisible && (
        <video
          ref={videoRef}
          src={`${videoUrl}#t=0.1`}
          className="hidden"
          preload="metadata"
          muted
        />
      )}
      {/* Display thumbnail */}
      {thumbnail && (
        <>
          <img
            src={thumbnail}
            alt={videoName}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-6 h-6 rounded-full bg-white/90 flex items-center justify-center shadow-md">
              <div className="w-0 h-0 border-l-[8px] border-l-black border-t-[5px] border-t-transparent border-b-[5px] border-b-transparent ml-0.5"></div>
            </div>
          </div>
          <div className="absolute bottom-1 right-1 bg-background/80 px-1.5 py-0.5 rounded text-[8px] leading-tight font-medium">
            VIDEO
          </div>
        </>
      )}
    </div>
  );
}

