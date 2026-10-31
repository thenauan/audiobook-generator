// ===== Tópicos da Ajuda =====
// Cada faixa da Ajuda abre a tela de tópico (HelpTopicScreen) com: introdução, passo a passo,
// recursos e detalhes e perguntas frequentes — no mesmo modelo do Audiobook Player.
import React from 'react';
import {
  FileText, AudioWaveform, Languages, FolderOpen, Keyboard, Upload, Tags, Mic, ListOrdered, BookA, RefreshCcw,
  Gauge, Layers, HardDrive, FileAudio, Music4, Captions, BookOpenText, Wand2, Globe, ShieldCheck, Search,
  MousePointerClick, Code2, Clock, FolderCog, BookHeadphones, Trash2, Play, Pencil, ArrowDownAZ, Info, LayoutGrid,
  Feather, Cpu, Sparkles, Zap,
} from 'lucide-react';
import { AiStarsIcon } from '../components/AppGlyph';

type IconType = React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }>;

export interface HelpStep { title: string; text: string }
export interface HelpFeature { icon: IconType; title: string; text: string }
export interface HelpFaq { q: string; a: string }

export interface HelpTopic {
  id: string;
  title: string;
  subtitle: string;
  gradient: string;
  icon: IconType;
  intro: string;
  steps: HelpStep[];
  features: HelpFeature[];
  faq?: HelpFaq[];
}

export const HELP_TOPICS: HelpTopic[] = [
  {
    id: 'converter',
    title: 'Como converter e-books',
    subtitle: 'Importar Epub, Pdf, Mobi, Azw3 ou Txt, vozes neurais, metadados e capítulos',
    gradient: 'from-blue-600 via-indigo-600 to-cyan-500',
    icon: AiStarsIcon,
    intro: 'O Audiobook Generator lê o texto de livros digitais, separa os capítulos e narra tudo com vozes neurais. Você pode converter vários e-books de uma vez, revisar os dados de cada um antes e acompanhar o progresso de cada livro.',
    steps: [
      { title: 'Abra o Conversor', text: 'No menu lateral esquerdo, clique em "Conversor".' },
      { title: 'Adicione os e-books', text: 'Arraste os arquivos (.epub, .pdf, .mobi, .azw, .azw3 ou .txt) para a área colorida do Conversor ou clique nela para escolher. Com livros já na lista, use o botão de envio no canto superior direito para incluir mais.' },
      { title: 'Revise cada livro', text: 'Confira título e autor no próprio card. As etiquetas logo abaixo trocam voz, formato, gênero, idioma, narrador, ano e se o texto sincronizado será gerado.' },
      { title: 'Ajuste os detalhes (opcional)', text: 'O botão de lápis abre a edição completa: capa, sinopse, capítulos, tradução e dicionário de pronúncia.' },
      { title: 'Clique em Converter', text: 'O botão "Converter" aparece no cabeçalho quando há pelo menos um e-book na fila. A barra de cada livro mostra a etapa e o tempo estimado.' },
      { title: 'Ouça o resultado', text: 'Os audiobooks prontos vão para "Convertidos", onde você pode ouvir um trecho, abrir na pasta, editar os dados ou gerar o texto.' },
    ],
    features: [
      { icon: Upload, title: 'Formatos aceitos', text: 'Epub, Pdf (com texto selecionável), Mobi, Azw/Azw3 (Kindle, sem DRM) e Txt. Vários livros podem ser carregados e convertidos em lote.' },
      { icon: Tags, title: 'Metadados automáticos', text: 'Título, autor, idioma, ano e capa são lidos do arquivo e podem ser corrigidos antes da conversão.' },
      { icon: Mic, title: 'Vozes neurais', text: 'Vozes naturais como Antônio e Francisca em português, além de vozes em outros idiomas. Cada voz tem uma amostra para ouvir antes.' },
      { icon: ListOrdered, title: 'Capítulos', text: 'Os capítulos são detectados automaticamente. Na edição você renomeia, reordena ou divide capítulos longos.' },
      { icon: BookA, title: 'Dicionário de pronúncia', text: 'Ensine a voz a falar nomes e termos difíceis (ex.: "Nietzsche" → "Nitche"). Vale só para aquele livro.' },
      { icon: Info, title: 'Informações de conversão', text: 'O botão (i) no card mostra o tempo estimado da conversão, a duração e o tamanho do audiobook e o formato do áudio.' },
      { icon: RefreshCcw, title: 'Conversão que continua', text: 'Se a conversão for interrompida, os capítulos prontos ficam guardados e o app retoma de onde parou.' },
    ],
    faq: [
      { q: 'Posso cancelar uma conversão?', a: 'Sim. Use o X no card do livro ou "Cancelar todos" ao lado do título "Convertendo".' },
      { q: 'Por que o botão Converter sumiu?', a: 'Ele só aparece quando há e-books ainda não convertidos na lista.' },
      { q: 'O Pdf saiu com cabeçalhos e números de página?', a: 'O app remove números de página, cabeçalhos repetidos e quebras de linha automaticamente, mas Pdfs escaneados ou com várias colunas podem precisar de revisão nos capítulos.' },
    ],
  },
  {
    id: 'sync-text',
    title: 'Texto sincronizado',
    subtitle: 'Gerar o texto na conversão ou depois, com o áudio + texto ou só com o áudio',
    gradient: 'from-violet-600 via-purple-600 to-fuchsia-600',
    icon: FileText,
    intro: 'O texto sincronizado acompanha a narração frase a frase, como uma letra de música. Ele pode ser criado junto com a conversão ou depois, para qualquer audiobook em "Convertidos", e pode ficar dentro do próprio arquivo de áudio, em arquivos na pasta da biblioteca ou nos dois.',
    steps: [
      { title: 'Durante a conversão', text: 'Deixe a etiqueta "Texto Sinc" em "Sim" no card do e-book (ou ative em Ajustes › Conversão para todos). O texto é gerado logo depois do áudio.' },
      { title: 'Depois, em Convertidos', text: 'Clique nos três pontinhos de um audiobook e escolha "Gerar texto".' },
      { title: 'Escolha a origem', text: '"Áudio + texto do livro" pede o arquivo do livro (Epub, Pdf, Mobi ou Txt) e alinha a voz ao texto oficial. "Só o áudio" transcreve a narração com IA.' },
      { title: 'Encontre o resultado', text: 'Conforme o destino escolhido, o texto fica dentro do arquivo de áudio, em "Meus textos" de Convertidos, ou nos dois.' },
    ],
    features: [
      { icon: BookOpenText, title: 'Áudio + texto do livro', text: 'O resultado mais fiel: nomes, termos raros e pontuação vêm do livro original.' },
      { icon: Wand2, title: 'Só o áudio', text: 'Funciona sem o arquivo do livro. A IA transcreve a narração, então nomes incomuns podem sair com outra grafia.' },
      { icon: Music4, title: 'Dentro do arquivo', text: 'MP3 recebe letras sincronizadas (SYLT/USLT), M4B recebe a letra no campo ©lyr e FLAC/Opus no campo LYRICS.' },
      { icon: Captions, title: 'Na pasta da biblioteca', text: 'Salva .lrc, .srt e .sync.json ao lado do áudio, e o texto aparece em "Meus textos".' },
    ],
    faq: [
      { q: 'Onde escolho o destino do texto?', a: 'Em Ajustes › Conversão de áudio › "Salvar texto sincronizado em".' },
      { q: 'E audiobooks com um arquivo por capítulo?', a: 'Nesse caso o texto é sempre salvo na pasta da biblioteca, porque não há um arquivo único para guardá-lo.' },
      { q: 'Posso editar o texto depois?', a: 'Sim. Em "Meus textos", use "Editar dados" no menu do texto. Na edição de um audiobook também é possível trocar ou remover o texto anexado.' },
    ],
  },
  {
    id: 'converted',
    title: 'Convertidos',
    subtitle: 'Ouvir, editar, organizar e excluir audiobooks e textos prontos',
    gradient: 'from-sky-600 via-blue-700 to-indigo-800',
    icon: BookHeadphones,
    intro: 'Tudo o que o app gera aparece em "Convertidos": os audiobooks em "Meus Audiobooks" e os textos sincronizados salvos na biblioteca em "Meus Textos". Daqui você ouve um trecho, abre o arquivo na pasta, edita os dados, gera o texto e exclui o que não quer mais na lista.',
    steps: [
      { title: 'Abra Convertidos', text: 'No menu lateral, clique em "Convertidos". A tela mostra duas linhas de audiobooks e os seus textos; "Ver todos" abre a lista completa de cada um.' },
      { title: 'Ouça um trecho', text: 'Passe o mouse na capa e clique no play.' },
      { title: 'Use o menu de opções', text: 'Os três pontinhos ao lado do título abrem "Ouvir Trecho", "Abrir na Pasta", "Editar dados", "Gerar texto", "Mais detalhes" e "Excluir de Convertidos".' },
      { title: 'Exclua vários de uma vez', text: 'Clique no botão vermelho de lixeira no cabeçalho, marque os audiobooks e textos e clique em "Excluir". A confirmação mostra a lista do que foi marcado; "Cancelar" sai da seleção.' },
    ],
    features: [
      { icon: Play, title: 'Prévia rápida', text: 'O trecho toca o começo do audiobook sem sair do app.' },
      { icon: Pencil, title: 'Editar dados', text: 'Título, autor, capa, sinopse, capítulos e o texto anexado. As mudanças são gravadas também nos metadados do arquivo.' },
      { icon: ArrowDownAZ, title: 'Ordenar', text: 'Por título (A–Z ou Z–A), ano ou duração. Títulos que começam com número ou símbolo vêm antes da letra A.' },
      { icon: Trash2, title: 'Excluir com confirmação', text: 'Toda exclusão pede confirmação e mostra as capas dos itens. Os arquivos de áudio e de texto continuam na pasta: só saem da lista.' },
      { icon: LayoutGrid, title: 'Barra de letras', text: 'Em "Ver todos", a barra à direita leva direto a cada letra, década ou faixa de duração.' },
    ],
    faq: [
      { q: 'Excluir apaga o arquivo do computador?', a: 'Sim. O item sai de Convertidos e os arquivos (o áudio, a pasta de capítulos ou os arquivos do texto) vão para a Lixeira do computador, de onde dá para recuperar. Textos gerados antes da versão 1.1 só saem da lista.' },
      { q: 'Por que um audiobook não aparece?', a: 'Só aparecem os audiobooks convertidos com sucesso. Conversões com erro ficam no Conversor, com a opção de tentar de novo.' },
    ],
  },
  {
    id: 'formats',
    title: 'Formatos e qualidade',
    subtitle: 'M4B, MP3, Opus, FLAC, WAV e a qualidade de cada um',
    gradient: 'from-emerald-600 via-teal-600 to-cyan-600',
    icon: AudioWaveform,
    intro: 'A voz é gerada em alta qualidade, normalizada e guardada sem perdas antes de virar o arquivo final, que é codificado uma única vez. Assim, o formato e a qualidade escolhidos definem só o tamanho do arquivo e a compatibilidade, sem perdas acumuladas.',
    steps: [
      { title: 'Escolha o formato padrão', text: 'Em Ajustes › Conversão de áudio › "Formato do audiobook".' },
      { title: 'Escolha a qualidade', text: 'No mesmo lugar, em "Qualidade": Padrão, Alta ou Máxima.' },
      { title: 'Troque por livro, se quiser', text: 'A etiqueta de formato no card de cada e-book muda só aquele livro.' },
    ],
    features: [
      { icon: FileAudio, title: 'M4B (AAC)', text: 'Formato padrão do app. Um arquivo com capítulos e capa, o preferido dos apps de audiobook.' },
      { icon: Music4, title: 'MP3', text: 'Toca em qualquer aparelho. Leva capítulos e capa; também pode ser gerado como um MP3 por capítulo.' },
      { icon: Gauge, title: 'Opus', text: 'A melhor qualidade pelo menor tamanho, com capítulos e capa.' },
      { icon: Layers, title: 'FLAC e WAV', text: 'Sem perda. FLAC mantém capítulos e capa; WAV é para edição e não guarda capítulos.' },
    ],
    faq: [
      { q: 'Qual qualidade escolher?', a: 'Padrão já soa bem para voz. Alta é um equilíbrio; Máxima (MP3 320k, AAC 256k, Opus 128k) evita qualquer perda audível, com arquivos maiores.' },
      { q: 'A qualidade vale para todos os formatos?', a: 'Vale para MP3, M4B e Opus. FLAC e WAV são sempre sem perda.' },
    ],
  },
  {
    id: 'translation',
    title: 'Tradução e idiomas',
    subtitle: 'Livros em outros idiomas e o idioma da interface',
    gradient: 'from-amber-500 via-orange-500 to-rose-500',
    icon: Languages,
    intro: 'O app detecta o idioma de cada e-book. Quando ele é diferente do idioma da voz escolhida, você pode traduzir o livro com IA antes da narração, ou narrar no idioma original com uma voz daquele idioma.',
    steps: [
      { title: 'Carregue o e-book', text: 'O idioma detectado aparece na etiqueta "Idioma" do card.' },
      { title: 'Responda à pergunta de tradução', text: 'Se o idioma não combinar com a voz, um pop-up pergunta se você quer traduzir.' },
      { title: 'Mude quando quiser', text: 'Na edição do e-book, o interruptor "Traduzir obra com IA" liga ou desliga a tradução.' },
    ],
    features: [
      { icon: Globe, title: 'Detecção automática', text: 'O idioma vem dos metadados do arquivo e do próprio texto.' },
      { icon: Mic, title: 'Voz no idioma certo', text: 'Para narrar no idioma original, escolha uma voz daquele idioma na etiqueta "Voz".' },
      { icon: Languages, title: 'Idioma da interface', text: 'Português, inglês, espanhol ou árabe, em Ajustes › Interface.' },
    ],
  },
  {
    id: 'voices',
    title: 'Vozes e idiomas',
    subtitle: 'Mais de 300 vozes da Microsoft, em mais de 70 idiomas',
    gradient: 'from-fuchsia-600 via-purple-600 to-indigo-600',
    icon: Mic,
    intro: 'O app usa as vozes neurais da Microsoft (as mesmas do "Ler em voz alta" do Edge): mais de 300 vozes em mais de 70 idiomas. A interface existe em português, inglês, espanhol, árabe e russo, mas dá para narrar audiobooks em qualquer idioma que tenha voz, como francês, alemão, italiano, japonês, chinês, coreano, grego, sueco, polonês, turco, hindi e muitos outros.',
    steps: [
      { title: 'Carregue o e-book', text: 'O app reconhece o idioma do livro e mostra só as vozes desse idioma na etiqueta de voz do card.' },
      { title: 'Ouça antes de escolher', text: 'Nas listas de vozes, passe o mouse sobre uma voz e clique no botão de play para ouvir a amostra.' },
      { title: 'Escolha a voz', text: 'Clique na voz. A escolha vale só para aquele livro; a voz padrão fica em Ajustes › Conversão de áudio.' },
      { title: 'Idioma errado?', text: 'Na etiqueta de idioma do card, use "Corrigir idioma" e escolha ou digite o idioma certo (por exemplo, "Grego"). As vozes desse idioma aparecem em seguida.' },
    ],
    features: [
      { icon: Languages, title: 'Idiomas da interface', text: 'Português (Brasil), English, Español, العربية (árabe) e Русский (russo). Troque em Ajustes › Interface › Idioma.' },
      { icon: Globe, title: 'Narração em qualquer idioma', text: 'Livros em outros idiomas são narrados com as vozes daquele idioma, mesmo que a interface não esteja nele. Os títulos genéricos de capítulo também saem no idioma do livro.' },
      { icon: Play, title: 'Amostras de voz', text: 'Todas as vozes de português, inglês, espanhol, árabe e russo têm amostra para ouvir. As vozes dos outros idiomas funcionam normalmente, só não têm amostra.' },
      { icon: Mic, title: 'Vozes de outros idiomas', text: 'Na voz padrão (Ajustes), a lista mostra primeiro as vozes do idioma da interface; "Vozes de outros idiomas" abre todas as demais, agrupadas por idioma.' },
    ],
    faq: [
      { q: 'Por que só aparecem vozes de um idioma?', a: 'A lista mostra as vozes do idioma do livro, para a narração soar natural. Se o idioma não for reconhecido, aparecem todas as vozes, agrupadas por idioma.' },
      { q: 'Posso narrar um livro em francês com a interface em português?', a: 'Sim. A interface e a narração são independentes: o livro em francês é narrado por uma voz francesa.' },
      { q: 'Quero ouvir o livro em outro idioma', a: 'Use "Traduzir para" na etiqueta de idioma do card. A tradução está disponível para os idiomas da interface (português, inglês, espanhol, árabe e russo).' },
      { q: 'Preciso de internet?', a: 'Sim. As vozes são geradas pelo serviço da Microsoft durante a conversão.' },
    ],
  },
  {
    id: 'folders',
    title: 'Pastas e arquivos',
    subtitle: 'Onde os audiobooks e textos são salvos',
    gradient: 'from-slate-700 via-slate-800 to-zinc-900',
    icon: FolderOpen,
    intro: 'Tudo o que o app cria fica na pasta escolhida na configuração inicial. Os arquivos são seus: podem ser copiados para o celular, abertos em qualquer player ou movidos para outro lugar.',
    steps: [
      { title: 'Veja a pasta atual', text: 'Em Ajustes › Armazenamento e pastas. O botão Ver pasta abre a pasta no explorador de arquivos.' },
      { title: 'Troque se quiser', text: 'Use "Alterar pasta". Os próximos audiobooks serão salvos no novo local.' },
      { title: 'Abra um audiobook no Explorer', text: 'Em Convertidos, use "Abrir na Pasta" no menu do audiobook, ou "Ver na pasta" em "Mais detalhes".' },
    ],
    features: [
      { icon: HardDrive, title: 'Arquivos locais', text: 'Os audiobooks e textos ficam só no seu computador; apenas o texto a narrar (e a traduzir) passa pelos serviços de voz e tradução.' },
      { icon: FolderCog, title: 'Cache de conversão', text: 'Os capítulos prontos ficam em cache para retomar conversões. "Limpar cache" em Armazenamento libera esse espaço.' },
      { icon: ShieldCheck, title: 'Pasta obrigatória', text: 'Na primeira abertura, o app pede uma pasta para não salvar arquivos em um lugar inesperado.' },
    ],
  },
  {
    id: 'lite',
    title: 'Modo leve e modo turbo',
    subtitle: 'Deixar o app mais leve em computadores fracos ou converter mais rápido nos potentes',
    gradient: 'from-teal-600 via-emerald-600 to-green-500',
    icon: Feather,
    intro: 'O modo leve deixa o app mais leve em duas frentes: na interface (menos efeitos visuais) e na conversão (menos coisas ao mesmo tempo). A conversão fica mais lenta, mas o computador e o app continuam rápidos enquanto os livros são narrados. O modo turbo faz o contrário: converte mais rápido usando mais recursos do computador. Os dois não ficam ligados juntos.',
    steps: [
      { title: 'Ligue o modo leve', text: 'Em Ajustes › Interface, ative "Modo leve". Ele também pode ser escolhido na configuração inicial, em Desempenho.' },
      { title: 'Na interface, vale na hora', text: 'O desfoque some, os fundos animados ficam parados e os cards e pop-ups ficam opacos.' },
      { title: 'Na conversão, vale na próxima', text: 'As novas conversões passam a usar o modo leve. Uma conversão que já está em andamento continua como começou.' },
      { title: 'Ou ligue o modo turbo', text: 'Em computadores potentes, ative "Modo turbo" em Ajustes › Conversão. Ligar um dos modos desliga o outro.' },
    ],
    features: [
      { icon: Sparkles, title: 'Interface', text: 'Sem desfoque de fundo, fundos de cor parados (no lugar das animações) e cards e pop-ups opacos.' },
      { icon: ListOrdered, title: 'Um livro por vez', text: 'Em vez de converter todos os livros juntos, converte um e deixa os outros "Na fila".' },
      { icon: Mic, title: 'Menos conexões de voz', text: 'A narração usa 4 conexões com o serviço de voz em vez de 10: menos rede e memória, narração mais lenta.' },
      { icon: Zap, title: 'Modo turbo', text: '12 conexões de voz em vez de 10, uma etapa de áudio (FFmpeg) por núcleo do processador (até 8), mais partes traduzidas ao mesmo tempo e prioridade normal. Ganha mais com vários livros e livros longos.' },
      { icon: Cpu, title: 'Processador livre (leve)', text: 'Uma etapa de áudio (FFmpeg) por vez, tradução de uma parte por vez e prioridade mínima: a conversão só usa o processador que estiver sobrando.' },
    ],
    faq: [
      { q: 'Os modos mudam a qualidade do áudio?', a: 'Não. Voz, formato e qualidade são os mesmos; só muda a velocidade da conversão e o quanto ela usa do computador.' },
      { q: 'O modo turbo usa a placa de vídeo?', a: 'A narração é feita pelo serviço de voz da Microsoft, pela internet, e a montagem do áudio usa o processador. A placa de vídeo (NVIDIA, CUDA) só é usada para transcrever o áudio no texto sincronizado "Só o áudio", e isso já acontece sempre que ela existe, com ou sem turbo.' },
      { q: 'Quanto mais lenta fica a conversão?', a: 'Depende do computador e da internet. Com um livro só, a diferença vem principalmente das menos conexões de voz; com vários livros, eles passam a ser feitos um depois do outro.' },
    ],
  },
  {
    id: 'tips',
    title: 'Atalhos e dicas',
    subtitle: 'Arrastar arquivos, prévias, pesquisa e modo de desenvolvedor',
    gradient: 'from-pink-600 via-rose-600 to-red-600',
    icon: Keyboard,
    intro: 'Alguns atalhos para usar o app mais rápido.',
    steps: [
      { title: 'Arraste e solte', text: 'Arraste e-books de qualquer pasta direto para a tela do Conversor.' },
      { title: 'Ouça um trecho', text: 'Em Convertidos, passe o mouse na capa e clique no play, ou use "Ouvir Trecho" no menu.' },
      { title: 'Conheça outros apps', text: 'Em "Outros Apps", passe o mouse no ícone do Audiobook Player para abri-lo na web, ou use o menu para baixá-lo pelo GitHub.' },
      { title: 'Pesquise', text: 'A Pesquisa encontra audiobooks e textos convertidos pelo título ou autor.' },
    ],
    features: [
      { icon: MousePointerClick, title: 'Menus que nascem do botão', text: 'Os pop-ups crescem a partir do botão clicado; clique fora para fechar.' },
      { icon: Clock, title: 'Ordenar', text: 'Em Convertidos, o botão de ordenar organiza por título, ano ou duração.' },
      { icon: Search, title: 'Pesquisa', text: 'Os resultados aparecem logo abaixo da barra; os botões de cada resultado surgem ao passar o mouse. As últimas pesquisas ficam guardadas e podem ser apagadas.' },
      { icon: Code2, title: 'Modo de desenvolvedor', text: 'Digite //dev na Pesquisa para abrir simulações de teste.' },
    ],
  },
];
