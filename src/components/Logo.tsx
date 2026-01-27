import React from 'react';

export const Logo: React.FC<{ className?: string }> = ({ className }) => (
    <svg
        viewBox="0 0 1800 512"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        preserveAspectRatio="xMinYMid meet"
    >
        {/* Ícone fornecido pelo usuário - Versão final com Chevrons */}
        <g fill="none" stroke="#0A7CFF" strokeWidth="36" strokeLinecap="round" strokeLinejoin="round"> 
            {/* Letra T */} 
            <line x1="156" y1="140" x2="356" y2="140" /> 
            <line x1="256" y1="140" x2="256" y2="300" /> 
        
            {/* Chevron esquerdo (rotacionado para a esquerda) */} 
            <path d="M140 236 L120 256 L140 276" /> 
        
            {/* Chevron direito (rotacionado para a direita) */} 
            <path d="M372 236 L392 256 L372 276" /> 
        
            {/* Chevron inferior (para baixo) */} 
            <path d="M236 360 L256 380 L276 360" /> 
        </g>

        {/* Texto TRADULINO - Cor alterada para #0A7CFF para combinar com a logo */}
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
