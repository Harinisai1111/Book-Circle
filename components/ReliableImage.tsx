import React, { useState, useEffect } from 'react';

interface ReliableImageProps {
    src: string | null | undefined;
    alt: string;
    className?: string;
    timeout?: number;
}

const FALLBACK_SVG = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="150" viewBox="0 0 100 150"><rect width="100" height="150" fill="%23fff5f0"/><path d="M20 20h60v110H20z" fill="none" stroke="%23ff7a59" stroke-width="2"/><text x="50" y="75" font-family="serif" font-size="12" text-anchor="middle" fill="%23ff7a59">BookCircle</text></svg>`;

export const ReliableImage: React.FC<ReliableImageProps> = ({
    src,
    alt,
    className = "",
    timeout = 3000
}) => {
    const [imgSrc, setImgSrc] = useState<string>(src || FALLBACK_SVG);
    const [loading, setLoading] = useState(!!src);
    const [error, setError] = useState(false);

    useEffect(() => {
        if (!src) {
            setImgSrc(FALLBACK_SVG);
            setLoading(false);
            return;
        }

        setImgSrc(src);
        setLoading(true);
        setError(false);

        const timer = setTimeout(() => {
            if (loading) {
                setImgSrc(FALLBACK_SVG);
                setLoading(false);
                setError(true);
                console.warn(`Image timeout: ${src}`);
            }
        }, timeout);

        return () => clearTimeout(timer);
    }, [src, timeout]);

    const handleLoad = () => {
        setLoading(false);
    };

    const handleError = () => {
        setImgSrc(FALLBACK_SVG);
        setLoading(false);
        setError(true);
    };

    return (
        <div className={`relative overflow-hidden ${className}`}>
            {loading && (
                <div className="absolute inset-0 bg-[#fff5f0] animate-pulse flex items-center justify-center">
                    <span className="text-[10px] font-black text-[#ff7a59]/20 uppercase tracking-widest">Loading...</span>
                </div>
            )}
            <img
                src={imgSrc}
                alt={alt}
                className={`w-full h-full object-cover transition-opacity duration-500 ${loading ? 'opacity-0' : 'opacity-100'}`}
                onLoad={handleLoad}
                onError={handleError}
            />
        </div>
    );
};
