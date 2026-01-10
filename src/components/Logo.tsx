import React from 'react';

export const Logo: React.FC<{ className?: string }> = ({ className }) => (
    <svg
        viewBox="0 0 900 260"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        preserveAspectRatio="xMidYMid meet"
    >
        <defs>
            <linearGradient id="brandGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#1F7AE0" />
                <stop offset="100%" stopColor="#2EC6A6" />
            </linearGradient>
        </defs>

        <g transform="translate(70,50)">
            <path
                d="
        M40 30
        H120
        C145 30 160 45 160 70
        V100
        C160 125 145 140 120 140
        H90
        L65 165
        V140
        H40
        C15 140 0 125 0 100
        V70
        C0 45 15 30 40 30
        Z"
                fill="url(#brandGradient)" />

            <path d="M50 78 Q80 60 110 78"
                stroke="white" strokeWidth="12"
                fill="none" strokeLinecap="round" />

            <path d="M50 98 Q80 116 110 98"
                stroke="white" strokeWidth="12"
                fill="none" strokeLinecap="round" opacity="0.85" />
        </g>

        <text x="300" y="155"
            fontFamily="Inter, Poppins, Segoe UI, Arial, sans-serif"
            fontSize="78"
            fontWeight="600"
            fill="currentColor"
            letterSpacing="1.6">
            TRADULINO
        </text>
    </svg>
);
