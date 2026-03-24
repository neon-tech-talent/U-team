export function JerseyIcon({
    styleId,
    primaryColor = '#7b8c94',
    secondaryColor = '#1d2834',
    className = "w-full h-full"
}: {
    styleId: string;
    primaryColor?: string;
    secondaryColor?: string;
    className?: string;
}) {
    // Slender, realistic T-Shirt path
    const shirtPath = "M 40 10 Q 50 18, 60 10 L 82 20 L 78 40 L 68 35 L 70 95 Q 50 100, 30 95 L 32 35 L 22 40 L 18 20 Z";
    
    // Smooth trim for the neck and sleeves
    const trimColor = '#111827';

    // Horizontal band has a white base
    const actualPrimary = styleId === 'horizontal_band' ? '#e2e8f0' : primaryColor;

    const renderPattern = () => {
        switch (styleId) {
            case 'horizontal_band': return <rect y="40" width="100" height="25" fill={secondaryColor} />;
            case 'hoops': return (
                <>
                    <rect y="18" width="100" height="8" fill={secondaryColor} />
                    <rect y="36" width="100" height="8" fill={secondaryColor} />
                    <rect y="54" width="100" height="8" fill={secondaryColor} />
                    <rect y="72" width="100" height="8" fill={secondaryColor} />
                    <rect y="90" width="100" height="8" fill={secondaryColor} />
                </>
            );
            case 'halves': return <rect width="50" height="100" fill={secondaryColor} />;
            case 'diagonal': return <polygon points="-10,0 25,0 110,100 75,100" fill={secondaryColor} />;
            case 'center_stripe': return <rect x="38" width="24" height="100" fill={secondaryColor} />;
            case 'quarters': return (
                <>
                    <rect width="50" height="50" fill={secondaryColor} />
                    <rect x="50" y="50" width="50" height="100" fill={secondaryColor} />
                </>
            );
            case 'chevron': return <polygon points="-10,30 50,60 110,30 110,50 50,80 -10,50" fill={secondaryColor} />;
            case 'thick_vertical_stripes': return (
                <>
                    <rect x="25" width="12" height="100" fill={secondaryColor} />
                    <rect x="44" width="12" height="100" fill={secondaryColor} />
                    <rect x="63" width="12" height="100" fill={secondaryColor} />
                </>
            );
            case 'many_vertical_stripes': return (
                <>
                    <rect x="20" width="6" height="100" fill={secondaryColor} />
                    <rect x="32" width="6" height="100" fill={secondaryColor} />
                    <rect x="44" width="6" height="100" fill={secondaryColor} />
                    <rect x="56" width="6" height="100" fill={secondaryColor} />
                    <rect x="68" width="6" height="100" fill={secondaryColor} />
                    <rect x="80" width="6" height="100" fill={secondaryColor} />
                </>
            );
            default: return null; 
        }
    };

    return (
        <svg viewBox="0 0 100 100" className={className}>
            <defs>
                <clipPath id={"shirtClip-" + styleId}>
                    <path d={shirtPath} />
                </clipPath>
                
                {/* Internal 3D Shading for volume (top light, bottom dark) */}
                <linearGradient id="shading-shadow" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#fff" stopOpacity="0.4" />
                    <stop offset="40%" stopColor="#fff" stopOpacity="0.05" />
                    <stop offset="80%" stopColor="#000" stopOpacity="0.1" />
                    <stop offset="100%" stopColor="#000" stopOpacity="0.6" />
                </linearGradient>
                
                {/* Cylindrical horizontal shading */}
                <linearGradient id="shading-crease" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#000" stopOpacity="0.4" />
                    <stop offset="25%" stopColor="#fff" stopOpacity="0.15" />
                    <stop offset="50%" stopColor="#fff" stopOpacity="0.25" />
                    <stop offset="80%" stopColor="#000" stopOpacity="0.1" />
                    <stop offset="100%" stopColor="#000" stopOpacity="0.4" />
                </linearGradient>
            </defs>
            
            {/* Outline & Drop Shadow layer tightly behind the shirt */}
            <path d={shirtPath} fill="none" stroke="#000" strokeWidth="6" className="opacity-50" transform="translate(0, 3)" />
            
            {/* Base Color Fill */}
            <path d={shirtPath} fill={actualPrimary} />
            
            {/* Clip Group for patterns to stay inside the shirt bounds */}
            <g clipPath={`url(#shirtClip-${styleId})`}>
                {renderPattern()}
                
                {/* 3D Overlays (Applies to both base and pattern) */}
                <rect width="100" height="100" fill="url(#shading-crease)" pointerEvents="none" />
                <rect width="100" height="100" fill="url(#shading-shadow)" pointerEvents="none" />
                
                {/* Neck and sleeve trims for realism */}
                <path d="M 40 10 Q 50 18, 60 10" fill="none" stroke={trimColor} strokeWidth="4" />
                <line x1="22" y1="40" x2="32" y2="35" stroke={trimColor} strokeWidth="3" />
                <line x1="78" y1="40" x2="68" y2="35" stroke={trimColor} strokeWidth="3" />
            </g>
            
            {/* Outer border for sharpness */}
            <path d={shirtPath} fill="none" stroke="#101827" strokeWidth="1.5" strokeLinejoin="round" />
        </svg>
    )
}
