// ===== Agrupamento alfabético das listas =====

// Helper para agrupamento alfabético (DESIGN_SYSTEM.md Seção 27)
export function getAlphabetGroupKey(title: string): { id: string; key: string } {
  const clean = (title || '').trim().replace(/^["'«»“”‘’()[\]{}—\-_\s.]+/, '');
  if (!clean) return { id: 'symbol', key: '#' };

  const firstChar = clean[0];
  if (/[0-9]/.test(firstChar)) {
    return { id: 'symbol', key: '#' };
  }

  const latinNorm = firstChar.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase();
  if (/[A-Z]/.test(latinNorm)) {
    return { id: `lat-${latinNorm}`, key: latinNorm };
  }

  return { id: 'symbol', key: '#' };
}

// Ordem de títulos: números e símbolos vêm antes da letra A; depois, ordem alfabética
// (sem diferenciar acentos/maiúsculas e com números em ordem natural: 2 antes de 10)
export function compareTitles(a: string, b: string): number {
  const rankA = getAlphabetGroupKey(a).key === '#' ? 0 : 1;
  const rankB = getAlphabetGroupKey(b).key === '#' ? 0 : 1;
  if (rankA !== rankB) return rankA - rankB;
  return (a || '').localeCompare(b || '', 'pt-BR', { numeric: true, sensitivity: 'base' });
}

// Ordem dos grupos alfabéticos: '#' (números e símbolos) antes de A
export function compareGroupKeys(a: string, b: string): number {
  if (a === b) return 0;
  if (a === '#') return -1;
  if (b === '#') return 1;
  return a.localeCompare(b, 'pt-BR');
}
