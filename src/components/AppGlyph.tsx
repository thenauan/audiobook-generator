// Símbolo do app (ondas sonoras + estrelas de IA), o mesmo desenho do ícone, sem o fundo redondo.
// Usa a cor do texto (currentColor), então acompanha o tema claro/escuro.
export function AppGlyph({ size = 24, className }: { size?: number; className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="1.2 -0.5 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.85}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M3.2 11.4v4.4" />
      <path d="M6.6 8.8v9.6" />
      <path d="M10 6v15.2" />
      <path d="M13.4 8.8v9.6" />
      <path d="M16.8 11.4v4.4" />
      <path d="M19.2 1.6Q19.744 4.456 22.6 5Q19.744 5.544 19.2 8.4Q18.656 5.544 15.8 5Q18.656 4.456 19.2 1.6Z" fill="currentColor" strokeWidth={1.1} />
      <path d="M22 8.95Q22.232 10.168 23.45 10.4Q22.232 10.632 22 11.85Q21.768 10.632 20.55 10.4Q21.768 10.168 22 8.95Z" fill="currentColor" strokeWidth={0.9} />
    </svg>
  );
}

export default AppGlyph;

// Só as estrelas de IA do símbolo (sem as ondas): ícone do Conversor e dos botões de converter
export function AiStarsIcon({ size = 18, className }: { size?: number; strokeWidth?: number; className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M10 2.5Q11.2 8.8 17.5 10Q11.2 11.2 10 17.5Q8.8 11.2 2.5 10Q8.8 8.8 10 2.5Z" strokeWidth={1.8} />
      <path d="M18 14.5Q18.5 17 21 17.5Q18.5 18 18 20.5Q17.5 18 15 17.5Q17.5 17 18 14.5Z" strokeWidth={1.5} />
    </svg>
  );
}
