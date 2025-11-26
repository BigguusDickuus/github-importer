export function CardsIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Bola de cristal principal */}
      <circle
        cx="12"
        cy="10"
        r="9"
        stroke="currentColor"
        strokeWidth="1.5"
        fill="currentColor"
        fillOpacity="0.1"
      />
      
      {/* Reflexo grande (parte superior esquerda) */}
      <path
        d="M 7.5 5.5 Q 9.5 3.5 12.5 5.5 Q 10.5 7.5 7.5 8 Z"
        fill="currentColor"
        opacity="0.4"
      />
      
      {/* Reflexo pequeno (brilho) */}
      <circle
        cx="8.5"
        cy="6.5"
        r="1.8"
        fill="currentColor"
        opacity="0.6"
      />
      
      {/* Base aumentada */}
      <ellipse
        cx="12"
        cy="20"
        rx="9"
        ry="3"
        fill="currentColor"
        opacity="0.3"
      />
      
      {/* Sparkle grande (direita superior - afastado) */}
      <path
        d="M 21 3 L 21.5 4.8 L 23.5 5.5 L 21.5 6.2 L 21 8 L 20.5 6.2 L 18.5 5.5 L 20.5 4.8 Z"
        fill="currentColor"
        opacity="0.9"
      />
      
      {/* Sparkle pequeno (esquerda superior - afastado) */}
      <path
        d="M 2 2 L 2.3 3.3 L 3.5 3.7 L 2.3 4.1 L 2 5.5 L 1.7 4.1 L 0.5 3.7 L 1.7 3.3 Z"
        fill="currentColor"
        opacity="0.7"
      />
      
      {/* Sparkle direita inferior */}
      <path
        d="M 22 14 L 22.3 15.2 L 23.5 15.5 L 22.3 15.8 L 22 17 L 21.7 15.8 L 20.5 15.5 L 21.7 15.2 Z"
        fill="currentColor"
        opacity="0.6"
      />
    </svg>
  );
}