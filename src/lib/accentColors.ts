// Cor de destaque. Azul: no modo claro um pouco mais escuro que o de sistema (#007AFF), para ler bem sobre fundo branco.
// Azul e laranja: cores de sistema da Apple (tom do modo claro, do escuro e as versões de
// "Aumentar contraste"). As demais em tons sóbrios: menos saturados e menos claros que as de sistema
export const DEFAULT_ACCENT = 'blue';
export const ACCENT_COLORS: Record<string, { name: string; hex: string; dark: string; soberLight: string; soberDark: string }> = {
  blue: { name: 'Azul', hex: '#0066CC', dark: '#0A84FF', soberLight: '#0040DD', soberDark: '#409CFF' },
  orange: { name: 'Laranja', hex: '#FF9500', dark: '#FF9F0A', soberLight: '#C93400', soberDark: '#FFB340' },
  purple: { name: 'Roxo', hex: '#7E57A8', dark: '#9E7CC4', soberLight: '#5F3F85', soberDark: '#BBA0DA' },
  green: { name: 'Verde', hex: '#3D8458', dark: '#56A473', soberLight: '#2A6340', soberDark: '#7DC496' },
  red: { name: 'Vermelho', hex: '#B9473F', dark: '#CF6359', soberLight: '#93322B', soberDark: '#E48D85' },
  pink: { name: 'Rosa', hex: '#B4506C', dark: '#CB6F88', soberLight: '#8E3A52', soberDark: '#E199AD' },
};
