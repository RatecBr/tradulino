import React from 'react';

export const Logo: React.FC<{ className?: string }> = ({ className }) => (
    <svg
        viewBox="0 0 1800 512"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        preserveAspectRatio="xMinYMid meet"
    >
        <g fill="none" stroke="#0A7CFF" strokeWidth="36" strokeLinecap="round" strokeLinejoin="round">
            <line x1="156" y1="140" x2="356" y2="140" />
            <line x1="256" y1="140" x2="256" y2="300" />
            <path d="M236 360 L256 380 L276 360" />
        </g>

        <g fill="none" stroke="#0FB9B1" strokeWidth="36" strokeLinecap="round" strokeLinejoin="round">
            <path d="M140 236 L120 256 L140 276" />
            <path d="M372 236 L392 256 L372 276" />
        </g>

        <text 
            x="500" 
            y="300"
            fontFamily="Inter, system-ui, -apple-system, sans-serif"
            fontSize="160"
            fontWeight="900"
            fill="#0A7CFF"
            letterSpacing="-4"
        >
            TRADULINO
        </text>
    </svg>
);
