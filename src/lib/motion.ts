// Tokens de movimento do app (Guia de movimento e layout). Seis molas cobrem tudo que se move ou muda de tamanho;
// fades com duração fixa só para opacidade e cor. As mesmas molas existem em CSS (--spring-*) no index.css.
const spring = (stiffness: number, damping: number) => ({ type: 'spring' as const, stiffness, damping, mass: 1 });

export const SPRING = {
  press: spring(816, 57), // toque em botão
  snappy: spring(322, 30.5), // menus, pop-ups pequenos, avançar e voltar
  sheet: spring(224, 26.3), // folhas
  smooth: spring(158, 25.1), // mudanças grandes sem quique
  // Tela que abre de um ícone, miniplayer e player. Mais rápida que a do guia: com ela, abrir o player levava até 0,9 s
  zoom: spring(1360, 104),
  bouncy: spring(195, 19.5), // ícones que trocam, confirmações
  // Barra de abas e miniplayer trocando de lugar (como no Apple Music): rápida (~0,4 s), passa ~5% do ponto e
  // assenta. A mesma curva está em CSS (--spring-morph) para o miniplayer chegar junto com a barra
  morph: spring(420, 28),
  // Aparecer e mudar de tamanho "se ajustando ao lugar": passa ~22% do caminho e assenta (bem visível)
  settle: spring(300, 15),
};

const FADE_EASE = [0.2, 0, 0, 1] as [number, number, number, number];
// Abrir e fechar o player: duração curta e fixa. Mola sempre tem uma cauda longa e o player ficava montado até ela acabar
export const PLAYER_MOTION = { type: 'tween' as const, duration: 0.16, ease: FADE_EASE };

export const FADE_IN = { duration: 0.2, ease: FADE_EASE };
export const FADE_OUT = { duration: 0.15, ease: FADE_EASE };

// Botões do cabeçalho ao trocar de tela (como os botões de vidro do iOS): os da tela anterior somem num fade
// rápido e os da nova surgem crescendo com mola, passam um pouco do tamanho e se ajustam ao lugar.
// Sem desfoque animado: no iPhone, filtro animado num elemento com fundo de vidro deixa o vidro transparente
export const HEADER_SWAP = {
  initial: { opacity: 0, scale: 0.7 },
  animate: { opacity: 1, scale: 1, transition: { scale: SPRING.settle, opacity: { duration: 0.18, ease: FADE_EASE } } },
  exit: { opacity: 0, scale: 0.9, transition: { scale: { duration: 0.14, ease: FADE_EASE }, opacity: { duration: 0.12, ease: FADE_EASE } } },
};

// Curvas das molas para animações fora do motion (toque nos botões)
export const CSS_SPRING = {
  press: { ms: 360, curve: 'linear(0, 0.121, 0.326, 0.523, 0.675, 0.786, 0.861, 0.912, 0.944, 0.966, 0.979, 0.987, 0.992, 0.995, 0.997, 0.998, 0.999, 0.999, 1)' },
  // Soltar um botão tocado: volta passando do tamanho (~29% do aperto) e assenta (mola k 420, c 15)
  release: { ms: 750, curve: 'linear(0, 0.067, 0.235, 0.46, 0.698, 0.917, 1.092, 1.213, 1.277, 1.29, 1.263, 1.209, 1.142, 1.073, 1.012, 0.964, 0.933, 0.918, 0.917, 0.926, 0.943, 0.963, 0.983, 1, 1.013, 1.021, 1.024, 1.024, 1.02, 1.015, 1.009, 1.004, 0.999, 0.996, 0.994, 0.993, 0.993, 0.994, 0.996, 0.998, 1)' },
  bouncy: { ms: 770, curve: 'linear(0, 0.137, 0.397, 0.653, 0.846, 0.964, 1.024, 1.044, 1.042, 1.032, 1.02, 1.01, 1.003, 1, 0.998, 0.998, 0.998, 0.999, 1)' },
};
