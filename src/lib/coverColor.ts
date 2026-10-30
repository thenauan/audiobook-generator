// ===== Cor de uma capa de verdade =====
// Os cards (fundo animado, destaques, barra de progresso, borda) usam uma cor por livro. Com capa em imagem,
// essa cor vem da própria capa: o tom mais marcante dela (o que mais aparece entre as cores vivas). Capas quase
// sem cor (preto e branco, sépia) devolvem o tom médio, para o fundo continuar combinando com a capa.

const cache = new Map<string, string | null>();

const paraHex = (r: number, g: number, b: number) =>
  '#' + [r, g, b].map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');

export function extractCoverColor(src?: string | null): Promise<string | null> {
  if (!src || src.startsWith('data:image/svg')) return Promise.resolve(null); // capa genérica já tem a cor certa
  const chave = src.length > 200 ? `${src.length}:${src.slice(-200)}` : src;
  if (cache.has(chave)) return Promise.resolve(cache.get(chave)!);

  return new Promise(resolve => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const W = 48, H = 72;
        const canvas = document.createElement('canvas');
        canvas.width = W;
        canvas.height = H;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) return resolve(null);
        ctx.drawImage(img, 0, 0, W, H);
        const { data } = ctx.getImageData(0, 0, W, H);

        // Cores vivas agrupadas por tom (24 faixas de 15°), pesadas pela saturação; todas para o tom médio
        const faixas = Array.from({ length: 24 }, () => ({ peso: 0, r: 0, g: 0, b: 0 }));
        let total = 0, somaR = 0, somaG = 0, somaB = 0, pesoVivo = 0;
        for (let i = 0; i < data.length; i += 4) {
          if (data[i + 3] < 200) continue;
          const r = data[i], g = data[i + 1], b = data[i + 2];
          total++; somaR += r; somaG += g; somaB += b;
          const max = Math.max(r, g, b) / 255, min = Math.min(r, g, b) / 255;
          const l = (max + min) / 2, d = max - min;
          if (d === 0) continue;
          const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
          if (s < 0.22 || l < 0.1 || l > 0.92) continue; // cinzas, pretos e brancos não decidem a cor
          let h: number;
          const rn = r / 255, gn = g / 255, bn = b / 255;
          if (max === rn) h = ((gn - bn) / d) % 6;
          else if (max === gn) h = (bn - rn) / d + 2;
          else h = (rn - gn) / d + 4;
          h = (h * 60 + 360) % 360;
          const peso = s * (1 - Math.abs(l - 0.5)); // tons saturados e de luminosidade média pesam mais
          const f = faixas[Math.floor(h / 15) % 24];
          f.peso += peso; f.r += r * peso; f.g += g * peso; f.b += b * peso;
          pesoVivo += peso;
        }
        if (!total) return resolve(null);

        let cor: string;
        if (pesoVivo / total < 0.04) {
          cor = paraHex(somaR / total, somaG / total, somaB / total); // capa quase sem cor: o tom médio
        } else {
          // Faixa mais forte, somada às vizinhas (um mesmo tom pode cair entre duas faixas)
          let melhor = 0, melhorPeso = -1;
          for (let k = 0; k < 24; k++) {
            const p = faixas[k].peso + 0.5 * (faixas[(k + 23) % 24].peso + faixas[(k + 1) % 24].peso);
            if (p > melhorPeso) { melhorPeso = p; melhor = k; }
          }
          const f = faixas[melhor];
          cor = paraHex(f.r / f.peso, f.g / f.peso, f.b / f.peso);
        }
        cache.set(chave, cor);
        resolve(cor);
      } catch {
        resolve(null); // imagem protegida (outra origem) ou corrompida
      }
    };
    img.onerror = () => resolve(null);
    img.src = src;
  });
}
