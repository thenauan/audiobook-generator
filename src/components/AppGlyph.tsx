// Símbolo do app sem fundo e numa cor só (a do texto, então acompanha o tema): as 7 barras de som e as duas
// estrelas do ícone. `size` é a altura; a largura acompanha a proporção do desenho
const VIEWBOX = '258 253 812 692';
const PATH = 'M261 652a35 35 0 0 1 70 0v55a35 35 0 0 1 -70 0zM365 588a35 35 0 0 1 70 0v179a35 35 0 0 1 -70 0zM478 511a35 35 0 0 1 70 0v324a35 35 0 0 1 -70 0zM592 432a35 35 0 0 1 70 0v476a35 35 0 0 1 -70 0zM707 511a35 35 0 0 1 70 0v324a35 35 0 0 1 -70 0zM820 588a35 35 0 0 1 70 0v179a35 35 0 0 1 -70 0zM923 652a35 35 0 0 1 70 0v55a35 35 0 0 1 -70 0zM898 255Q913.73 364.62 1019 381Q913.73 397.38 898 507Q882.27 397.38 777 381Q882.27 364.62 898 255zM1007 475Q1015.06 528.94 1069 537Q1015.06 545.06 1007 599Q998.94 545.06 945 537Q998.94 528.94 1007 475z';

export function AppGlyph({ size, className }: { size?: number | string; className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={VIEWBOX}
      style={{ height: size ?? 24, width: 'auto' }}
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d={PATH} />
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
