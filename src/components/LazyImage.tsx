import React, { useState } from 'react';

interface LazyImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src?: string;
  alt?: string;
  className?: string;
  containerClassName?: string;
  fallbackEmoji?: string;
}

export default function LazyImage({
  src,
  alt,
  className = "",
  containerClassName = "",
  fallbackEmoji = "🍲",
  ...props
}: LazyImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  return (
    <div className={`relative overflow-hidden bg-gray-100 ${containerClassName}`}>
      {/* Skeleton Shimmering Placeholder */}
      {(!isLoaded || hasError) && (
        <div className="absolute inset-0 bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 animate-pulse flex items-center justify-center">
          {hasError ? (
            <span className="text-xl filter grayscale">{fallbackEmoji}</span>
          ) : (
            <div className="space-y-2 w-2/3 flex flex-col items-center">
              <span className="text-lg filter grayscale animate-bounce">{fallbackEmoji}</span>
              <div className="h-2 w-1/2 bg-gray-200 rounded"></div>
            </div>
          )}
        </div>
      )}

      {/* Actual Image Component */}
      {!hasError && src && (
        <img
          src={src}
          alt={alt}
          className={`${className} transition-opacity duration-300 ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          onLoad={() => setIsLoaded(true)}
          onError={() => setHasError(true)}
          referrerPolicy="no-referrer"
          {...props}
        />
      )}
    </div>
  );
}
