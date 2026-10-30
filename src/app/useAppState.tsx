// ===== Estado e lógica do app =====
// Tudo o que as telas usam: navegação, preferências, conversão, histórico, gerador de texto e pop-ups.
// As telas leem este objeto com useApp() (app/AppContext.tsx).
import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Settings as SettingsIcon, Upload, FileText, X, CheckCircle2, Clock, BookOpen, AlertTriangle, RefreshCw, AlertCircle, Trash2, Check, Sparkles, ArrowUpDown, RotateCcw, Code2, Power, Bell, LayoutList } from 'lucide-react';
import { AiStarsIcon } from '../components/AppGlyph';
import { ConfirmItemList, type ConfirmItem } from '../components/ConfirmItemList';
import { RiVoiceAiLine, RiAiGenerateText } from 'react-icons/ri';
import { Howl } from 'howler';
import { useAppNavigation, useBackLayer, getScreenKey } from '../navigation/useAppNavigation';
import { isNavBarFrozen } from '../navigation/transitions';
import { tabBarStore, type NavTab } from '../components/Navigation';
import type { HeaderAction } from '../components/HeaderActionButtons';
import { useIsMobile } from '../components/MobileContextMenu';
import { installTouchMenus } from '../components/touchMenu';
import { installScrollFades } from '../components/scrollFade';
import { setUiLanguage } from '../i18n';
import { HELP_TOPICS } from '../data/helpTopics';
import { isAudioFormat, audioFormatFromPath, type AudioFormat, type AudioQuality } from './audioFormats';
import { clearButtonCoverAnchorCache } from '../components/Popovers';
import { ROOT_SCREENS } from './screens';
import { ActiveSettingSelector, AppFile, SyncTextDestination, SyncTextGranularity, ChapterItem, GeneratedTextItem, HistoryItem, NavGroupItem, Phase, ScreenId, SortOption } from './types';
import { getGenericBookCover, getGenericCoverColor, getGenericTextCover, normalizeLanguageName } from '../lib/covers';
import { DEFAULT_AUDIOBOOKS, DEFAULT_RECENT_SEARCHES } from '../data/defaults';
import { compareGroupKeys, compareTitles, getAlphabetGroupKey } from '../lib/grouping';
import { translations } from '../translations';
import { loadJSON, saveJSON, removeKey, isArray } from '../lib/storage';
import { estimateConversion } from './estimates';
import { VOICES, languageCode, voiceLang, effectiveVoice } from '../data/voices';

// Leitura/gravação de preferências sem risco: armazenamento cheio ou bloqueado não derruba o app
const safeGet = (key: string): string | null => { try { return localStorage.getItem(key); } catch { return null; } };
const safeSet = (key: string, value: string) => { try { localStorage.setItem(key, value); } catch { /* cheio ou bloqueado */ } };


export function useAppState() {
  // Navegação (pilha de telas do esqueleto: voltar do sistema, gesto da borda e transições do iOS)
  const mainScrollRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();
  const { activeScreen, historyStack: navStack, navigateTo: navTo, goBack } = useAppNavigation({
    initialScreen: { id: 'converter' },
    rootIds: ROOT_SCREENS,
    mainScrollRef,
  });
  const currentScreen = activeScreen.id as ScreenId;
  const historyStack = navStack.map(s => s.id as ScreenId);
  const activeScreenKey = getScreenKey(activeScreen);
  const activeScreenKeyRef = useRef(activeScreenKey);
  activeScreenKeyRef.current = activeScreenKey;
  // Aba/menu selecionado: a tela raiz de onde a pilha começou
  const currentRoot = (navStack[0]?.id ?? activeScreen.id) as ScreenId;

  // Menus principais zeram a pilha; submenus empilham a tela atual.
  // opts.push abre uma tela principal como subtela (ex.: Ajustes a partir de "Mais" no celular)
  const navigateTo = (newScreen: ScreenId, opts?: { push?: boolean }) => {
    if (newScreen === currentScreen) return;
    navTo(newScreen, undefined, opts);
  };

  const navigateBack = goBack;

  // Tópico aberto na Ajuda (tela help-topic)
  const [helpTopicId, setHelpTopicId] = useState<string | null>(null);
  const openHelpTopic = (id: string) => {
    setHelpTopicId(id);
    navigateTo('help-topic');
  };


  // Cores de Acento do Fluent Design
  const accentPalette: Record<string, { hex: string; rgb: string; name: string }> = {
    blue: { hex: '#0086F0', rgb: '0, 134, 240', name: 'Azul' },
    purple: { hex: '#8764B8', rgb: '135, 100, 184', name: 'Roxo' },
    emerald: { hex: '#107C41', rgb: '16, 124, 65', name: 'Esmeralda' },
    orange: { hex: '#CA5010', rgb: '202, 80, 16', name: 'Laranja' },
    pink: { hex: '#E3008C', rgb: '227, 0, 140', name: 'Rosa' },
    cyan: { hex: '#038387', rgb: '3, 131, 135', name: 'Ciano' },
  };

  const [accentColor, setAccentColor] = useState<string>(() => {
    if (typeof window === 'undefined') return 'blue';
    return safeGet('app_accent_color') || 'blue';
  });

  useEffect(() => {
    safeSet('app_accent_color', accentColor);
    const active = accentPalette[accentColor] || accentPalette.blue;
    document.documentElement.style.setProperty('--winblue', active.hex);
    document.documentElement.style.setProperty('--winblue-rgb', active.rgb);
    document.documentElement.style.setProperty('--color-winblue', active.hex);
  }, [accentColor]);

  // Tema Claro / Escuro / Sistema
  const [themeMode, setThemeMode] = useState<'light' | 'dark' | 'system'>(() => {
    if (typeof window === 'undefined') return 'system';
    return (safeGet('app_theme_mode') as any) || 'system';
  });

  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('dark');

  useEffect(() => {
    safeSet('app_theme_mode', themeMode);
    if (themeMode === 'system') {
      const match = window.matchMedia('(prefers-color-scheme: dark)');
      setResolvedTheme(match.matches ? 'dark' : 'light');
      const listener = (e: MediaQueryListEvent) => setResolvedTheme(e.matches ? 'dark' : 'light');
      match.addEventListener('change', listener);
      return () => match.removeEventListener('change', listener);
    } else {
      setResolvedTheme(themeMode);
    }
  }, [themeMode]);

  useEffect(() => {
    if (resolvedTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [resolvedTheme]);

  // Tamanho da fonte (conforme index.css)

  const [uiFontSize, setUiFontSize] = useState<'standard' | 'small' | 'large'>(() => {
    if (typeof window === 'undefined') return 'standard';
    return (safeGet('app_font_size') as any) || 'standard';
  });

  // A densidade da interface saiu dos Ajustes: limpa o que tiver ficado salvo
  useEffect(() => {
    document.documentElement.removeAttribute('data-density');
    try { removeKey('app_ui_density'); } catch {}
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-font-size', uiFontSize);
    safeSet('app_font_size', uiFontSize);
  }, [uiFontSize]);

  // Idioma da Aplicação
  const [interfaceLang, setInterfaceLang] = useState<string>(() => {
    if (typeof window === 'undefined') return 'pt-BR';
    return safeGet('app_interface_lang') || 'pt-BR';
  });

  useEffect(() => {
    safeSet('app_interface_lang', interfaceLang);
    const langConfig = (translations as any)[interfaceLang] || translations['pt-BR'];
    document.documentElement.setAttribute('dir', langConfig.dir || 'ltr');
    document.documentElement.setAttribute('lang', interfaceLang);
  }, [interfaceLang]);

  useEffect(() => { setUiLanguage(interfaceLang); }, [interfaceLang]);

  const t = (translations as any)[interfaceLang] || translations['pt-BR'];

  // Notificações Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const showToast = (msg: string) => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setToastMessage(msg);
    toastTimeoutRef.current = setTimeout(() => setToastMessage(null), 3500);
  };

  // Comportamentos globais do esqueleto: pop-ups no toque (destaque + arrastar) e bordas de rolagem
  useEffect(() => installTouchMenus(), []);
  useEffect(() => installScrollFades(), []);

  // Cabeçalho: desfoque progressivo e título que reaparece ao rolar; a barra de abas recolhe ao rolar
  const headerBlurRef = useRef<HTMLDivElement>(null);
  const lastScrollTopRef = useRef(0);
  const [isTitleScrolledPast, setIsTitleScrolledPast] = useState(false);
  const setHeaderBlurProgress = (scrollTop: number) => {
    // A opacidade vai em cada camada (e não no contêiner): um "pai" com opacidade abaixo de 1 vira a
    // "raiz" do desfoque e as camadas deixam de desfocar o conteúdo atrás (Chrome/Safari)
    headerBlurRef.current?.style.setProperty('--header-blur', String(Math.max(0, Math.min(1, scrollTop / 28))));
  };
  useEffect(() => {
    setHeaderBlurProgress(0);
    setIsTitleScrolledPast(false);
    lastScrollTopRef.current = mainScrollRef.current?.scrollTop || 0;
    const container = mainScrollRef.current;
    if (!container) return;
    const handleScroll = () => {
      const st = container.scrollTop;
      const lastSt = lastScrollTopRef.current;
      lastScrollTopRef.current = st;
      // Só a rolagem do usuário mexe na barra (não as do app durante a troca de telas, nem saltos)
      const frozen = isNavBarFrozen() || Math.abs(st - lastSt) > 240;
      if (!frozen) {
        if (st < 24) tabBarStore.set(false);
        else if (st > lastSt + 6) tabBarStore.set(true);
        else if (st < lastSt - 10) tabBarStore.set(false);
      }
      setHeaderBlurProgress(st);
      if (st <= 6) { setIsTitleScrolledPast(false); return; }
      const headerBottomY = container.getBoundingClientRect().top + 68;
      const titleEl = Array.from(container.querySelectorAll<HTMLElement>('h1, [data-screen-title="true"]'))
        .find(el => el.getClientRects().length > 0) || null;
      setIsTitleScrolledPast(titleEl ? titleEl.getBoundingClientRect().bottom <= headerBottomY : st > 65);
    };
    const raf = requestAnimationFrame(handleScroll);
    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      container.removeEventListener('scroll', handleScroll);
    };
  }, [activeScreenKey]);

  // Reprodução de Áudio de Prévia com Howler
  const [playingSnippet, setPlayingSnippet] = useState<{ path: string; tempUrl: string } | null>(null);
  const snippetHowlRef = useRef<Howl | null>(null);

  const toggleSnippet = async (path: string) => {
    if (playingSnippet && playingSnippet.path === path) {
      snippetHowlRef.current?.stop();
      fetch('/api/delete-snippet', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ tempUrl: playingSnippet.tempUrl }) }).catch(() => {});
      setPlayingSnippet(null);
    } else {
      if (snippetHowlRef.current && playingSnippet) {
        snippetHowlRef.current.stop();
        fetch('/api/delete-snippet', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ tempUrl: playingSnippet.tempUrl }) }).catch(() => {});
      }
      try {
        const res = await fetch('/api/snippet', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ path }) });
        const data = await res.json();
        if (data.url) {
          setPlayingSnippet({ path, tempUrl: data.url });
          const sound = new Howl({
            src: [data.url],
            html5: true,
            onend: () => {
              fetch('/api/delete-snippet', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ tempUrl: data.url }) }).catch(() => {});
              setPlayingSnippet(null);
            },
            onloaderror: () => setPlayingSnippet(null),
            onplayerror: () => setPlayingSnippet(null)
          });
          sound.play();
          snippetHowlRef.current = sound;
        }
      } catch (e) {
        setPlayingSnippet(null);
      }
    }
  };

  // Teste de Vozes (Amostras /samples/{code}.mp3)
  const [playingVoiceCode, setPlayingVoiceCode] = useState<string | null>(null);
  const voiceHowlRef = useRef<Howl | null>(null);

  const toggleVoiceSample = (e: React.MouseEvent, code: string) => {
    e.stopPropagation();
    if (playingVoiceCode === code) {
      voiceHowlRef.current?.stop();
      setPlayingVoiceCode(null);
    } else {
      voiceHowlRef.current?.stop();
      const sound = new Howl({
        src: [`/samples/${code}.mp3`],
        html5: true,
        onend: () => setPlayingVoiceCode(null),
        onloaderror: () => setPlayingVoiceCode(null),
        onplayerror: () => setPlayingVoiceCode(null)
      });
      sound.play();
      voiceHowlRef.current = sound;
      setPlayingVoiceCode(code);
    }
  };

  // Estados de Conversão e Arquivos
  const [phase, setPhase] = useState<Phase>(0);
  const [files, setFiles] = useState<AppFile[]>([]);

  // Lista vazia (último livro removido, com ou sem erro, convertendo ou não): volta a área de arrastar
  useEffect(() => {
    if (files.length > 0 || (phase !== 1 && phase !== 2)) return;
    const timer = setTimeout(() => setPhase(0), 220);
    return () => clearTimeout(timer);
  }, [files.length, phase]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [coverColorsMap, setCoverColorsMap] = useState<Record<string, string>>({});

  useEffect(() => {
    if (files.length === 0 && phase === 1) {
      setPhase(0);
    }
  }, [files.length, phase]);

  // Pasta de Salvamento e Preferências
  const [outputFolder, setOutputFolder] = useState(() => {
    if (typeof window === 'undefined') return '';
    return safeGet('output_folder') || '';
  });

  // Pasta de salvamento garantida: se o usuário não escolheu uma, o app cria Documentos/Audiobook Generator
  const ensureOutputFolder = async (): Promise<string> => {
    const atual = safeGet('output_folder') || outputFolder;
    if (atual) return atual;
    try {
      const res = await fetch('/api/default-folder', { method: 'POST' });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.path) {
        setOutputFolder(data.path);
        safeSet('output_folder', data.path);
        return data.path;
      }
    } catch { /* servidor indisponível */ }
    return '';
  };

  // Abre a pasta de salvamento no explorador de arquivos do sistema
  const openOutputFolder = async () => {
    const folder = await ensureOutputFolder();
    if (!folder) { showToast('Não foi possível encontrar a pasta de salvamento.'); return; }
    try {
      const res = await fetch('/api/open-folder', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ path: folder }) });
      if (!res.ok) throw new Error();
    } catch {
      showToast('Não foi possível abrir a pasta. Ela pode ter sido movida ou apagada.');
    }
  };

  useEffect(() => {
    safeSet('output_folder', outputFolder);
  }, [outputFolder]);


  const applyOutputFolder = (folder: string) => {
    setOutputFolder(folder);
    safeSet('output_folder', folder);
    showToast(`Pasta selecionada: ${folder}`);
  };

  const handleSelectOutputFolder = async () => {
    // 1) App instalado: seletor nativo do sistema (preload.cjs)
    const bridge = (window as any).electron;
    if (bridge?.selectFolder) {
      try {
        const folder = await bridge.selectFolder();
        if (folder) applyOutputFolder(folder);
        return;
      } catch { /* tenta pelo servidor */ }
    }
    // 2) No navegador: o servidor local abre o seletor do sistema
    try {
      const res = await fetch('/api/select-folder', { method: 'POST' });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.path) { applyOutputFolder(data.path); return; }
      if (res.ok && data.cancelled) return;
    } catch { /* servidor indisponível */ }
    showToast('Não foi possível abrir o seletor de pastas. Verifique se o app está aberto pelo atalho do Audiobook Generator.');
  };

  const handleClearCache = async () => {
    try {
      const res = await fetch('/api/clean-cache', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ outputFolder })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.success === false) throw new Error(data.error || 'falha');
      showToast(data.deleted > 0 ? `Cache limpo: ${data.deleted} ${data.deleted === 1 ? 'item removido' : 'itens removidos'}.` : 'O cache já estava vazio.');
    } catch {
      showToast('Não foi possível limpar o cache agora. Tente de novo com nenhuma conversão em andamento.');
    }
  };

  const [defaultVoice, setDefaultVoice] = useState(() => {
    // A voz é escolhida em cada e-book; "perguntar" (versões antigas) vira a voz padrão
    const saved = safeGet('app_default_voice');
    return saved && saved !== 'ask' ? saved : 'pt-BR-AntonioNeural';
  });

  useEffect(() => {
    safeSet('app_default_voice', defaultVoice);
  }, [defaultVoice]);

  const [fileTypeOption, setFileTypeOption] = useState<'ask' | AudioFormat>(() => {
    // O formato é escolhido em cada e-book; o padrão é M4B ("perguntar", de versões antigas, também vira M4B).
    // O MP3 era o padrão antes: quem nunca trocou passa para M4B uma vez.
    let saved = safeGet('file_type_option');
    if (!safeGet('default_format_m4b_v1')) {
      if (saved === 'single') saved = 'm4b';
      safeSet('default_format_m4b_v1', 'true');
    }
    return isAudioFormat(saved) ? saved : 'm4b';
  });

  // Qualidade do áudio gerado (taxa de bits dos formatos com compressão)
  const [audioQuality, setAudioQuality] = useState<AudioQuality>(() => {
    const saved = safeGet('audio_quality');
    return saved === 'standard' || saved === 'high' || saved === 'max' ? saved : 'high';
  });

  useEffect(() => {
    safeSet('audio_quality', audioQuality);
  }, [audioQuality]);

  useEffect(() => {
    safeSet('file_type_option', fileTypeOption);
  }, [fileTypeOption]);

  // Histórico de Audiobooks e Textos Gerados
  const [history, setHistory] = useState<HistoryItem[]>(() => {
    if (typeof window === 'undefined') return DEFAULT_AUDIOBOOKS;
    const items = loadJSON<HistoryItem[]>('audiobook_history', DEFAULT_AUDIOBOOKS, isArray);
    // O histórico mostra só audiobooks convertidos com sucesso (e ignora entradas corrompidas)
    return items.filter(h => h && typeof h === 'object' && h.id && h.status !== 'error');
  });

  useEffect(() => {
    if (history.some(h => h.status === 'error')) {
      setHistory(prev => prev.filter(h => h.status !== 'error'));
      return;
    }
    saveJSON('audiobook_history', history, () => showToast('O armazenamento do app está cheio: capas antigas de Convertidos foram trocadas pela capa genérica.'));
  }, [history]);

  const [generatedTexts, setGeneratedTexts] = useState<GeneratedTextItem[]>(() => {
    if (typeof window === 'undefined') return [];
    return loadJSON<GeneratedTextItem[]>('audiobook_generated_texts', [
      {
        id: 'mock-text-1',
        title: 'O Mistério da Estrela Cadente',
        genre: 'Fantasia',
        tone: 'Narrativo Imersivo',
        wordCount: 1420,
        date: '17/10/2026',
        content: 'Nas montanhas esquecidas de Aldora, uma centelha de luz cortou os céus noturnos com um estrondo silencioso. Gael observava da torre mais alta, com seu manto ondulando contra a ventania gélida...'
      }
    ], isArray).filter(tx => tx && typeof tx === 'object' && tx.id);
  });

  useEffect(() => {
    saveJSON('audiobook_generated_texts', generatedTexts);
  }, [generatedTexts]);

  // Pesquisas Recentes
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    if (typeof window === 'undefined') return DEFAULT_RECENT_SEARCHES;
    return loadJSON<string[]>('recent_searches', DEFAULT_RECENT_SEARCHES, isArray).filter(x => typeof x === 'string');
  });

  const [showDeleteSearchHistoryConfirm, setShowDeleteSearchHistoryConfirm] = useState<boolean>(false);

  const addToSearchHistory = useCallback((term: string) => {
    const trimmed = term.trim();
    if (!trimmed || trimmed.toLowerCase() === '//dev') return;
    setRecentSearches(prev => {
      const filtered = prev.filter(t => t.toLowerCase() !== trimmed.toLowerCase());
      const updated = [trimmed, ...filtered].slice(0, 10);
      try {
        safeSet('recent_searches', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  }, []);

  useEffect(() => {
    safeSet('recent_searches', JSON.stringify(recentSearches));
  }, [recentSearches]);

  // Modais de Diálogo e Confirmação
  const [showWelcomeModal, setShowWelcomeModal] = useState(() => {
    if (typeof window === 'undefined') return false;
    return safeGet('has_seen_welcome_v3') !== 'true';
  });

  const [showInitialConfigModal, setShowInitialConfigModal] = useState(() => {
    if (typeof window === 'undefined') return false;
    return safeGet('has_seen_welcome_v3') === 'true' && safeGet('has_seen_initial_config_v3') !== 'true';
  });

  useEffect(() => {
    if (!showWelcomeModal && !showInitialConfigModal && !outputFolder) ensureOutputFolder();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showWelcomeModal, showInitialConfigModal]);

  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [duplicateFileTitle, setDuplicateFileTitle] = useState('');
  const [showTranslationModal, setShowTranslationModal] = useState(false);
  const [foreignLangFile, setForeignLangFile] = useState<AppFile | null>(null);
  const [translationAnchor, setTranslationAnchor] = useState<HTMLElement | null>(null);
  const [selectedVoice, setSelectedVoice] = useState(() => defaultVoice);
  useEffect(() => { setSelectedVoice(defaultVoice); }, [defaultVoice]);
  const [conversionAnchor, setConversionAnchor] = useState<HTMLElement | null>(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelModalAnchor, setCancelModalAnchor] = useState<HTMLElement | null>(null);
  const [showClearHistoryModal, setShowClearHistoryModal] = useState(false);
  const [showResetSettingsConfirm, setShowResetSettingsConfirm] = useState(false);
  const [showCloseAppModal, setShowCloseAppModal] = useState(false);
  const [viewingTextModal, setViewingTextModal] = useState<GeneratedTextItem | null>(null);
  const [viewingTextAnchor, setViewingTextAnchor] = useState<HTMLElement | null>(null);

  // Notificação visual breve da capa do audiobook adicionado ao Histórico (menu lateral)
  const [historyNotificationBadge, setHistoryNotificationBadge] = useState<{
    coverUrl: string;
    title: string;
    id: string;
  } | null>(null);

  const triggerHistoryCoverBadge = (coverUrl?: string, title?: string) => {
    if (!coverUrl) return;
    const id = Math.random().toString();
    setHistoryNotificationBadge({
      coverUrl,
      title: title || 'Audiobook',
      id
    });
  };

  useEffect(() => {
    if (!historyNotificationBadge) return;
    const timer = setTimeout(() => {
      setHistoryNotificationBadge(null);
    }, 3200);
    return () => clearTimeout(timer);
  }, [historyNotificationBadge]);

  // Handlers para Edição de Obra e Capa
  const [editingCoverFileId, setEditingCoverFileId] = useState<string | null>(null);
  const coverFileInputRef = useRef<HTMLInputElement>(null);

  const handleOpenMetadataModal = (file: AppFile) => {
    handleStartEditFile(file);
  };

  const handleCoverUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const targetId = editingCoverFileId;
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      if (targetId) {
        setFiles(prev => prev.map(f => f.id === targetId ? { ...f, customCover: dataUrl } : f));
        showToast("Capa personalizada carregada!");
      }
      setEditingCoverFileId(null);
    };
    reader.readAsDataURL(file);
    if (coverFileInputRef.current) coverFileInputRef.current.value = '';
  };

  // Estado para Gerar Texto Sincronizado por Padrão na Conversão (Padrão: marcado que sim)
  const [generateSyncTextDefault, setGenerateSyncTextDefault] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    const saved = safeGet('generate_sync_text_default');
    return saved !== null ? saved === 'true' : true;
  });

  useEffect(() => {
    safeSet('generate_sync_text_default', String(generateSyncTextDefault));
  }, [generateSyncTextDefault]);

  // Onde guardar o texto sincronizado: metadados do audiobook, pasta da biblioteca ou ambos
  const [syncTextDestination, setSyncTextDestination] = useState<SyncTextDestination>(() => {
    if (typeof window === 'undefined') return 'both';
    const saved = safeGet('sync_text_destination');
    return saved === 'metadata' || saved === 'library' || saved === 'both' ? saved : 'both';
  });

  useEffect(() => {
    safeSet('sync_text_destination', syncTextDestination);
  }, [syncTextDestination]);

  // Separação do texto sincronizado (frases, palavras ou as duas)
  const [syncTextGranularity, setSyncTextGranularity] = useState<SyncTextGranularity>(() => {
    const saved = safeGet('sync_text_granularity');
    return saved === 'sentences' || saved === 'words' || saved === 'both' ? saved : 'sentences';
  });
  useEffect(() => {
    safeSet('sync_text_granularity', syncTextGranularity);
  }, [syncTextGranularity]);

  // Texto gerado e salvo na biblioteca: entra no histórico como os demais textos
  const addSyncTextToLibrary = (title: string, author: string, coverColor: string | undefined, content: string, wordCount?: number, files?: string[]) => {
    const color = coverColor || getGenericCoverColor(undefined, title, author);
    const newTextItem: GeneratedTextItem = {
      id: Math.random().toString(),
      title,
      author: author || 'Autor Desconhecido',
      genre: 'Sincronizado',
      tone: '.lrc',
      content,
      date: new Date().toLocaleDateString(interfaceLang),
      wordCount: wordCount ?? content.split(/\s+/).length,
      coverColor: color,
      cover: getGenericTextCover(title, author, color),
      files: files && files.length > 0 ? files : undefined,
    };
    setGeneratedTexts(prev => [newTextItem, ...prev]);
  };

  // Texto sincronizado de um audiobook do histórico: "áudio + texto" (com o livro em texto) ou "só o áudio"
  const [syncingBookIds, setSyncingBookIds] = useState<string[]>([]);
  const syncTextInputRef = useRef<HTMLInputElement>(null);
  const pendingSyncBookRef = useRef<HistoryItem | null>(null);

  const handleGenerateBookText = async (book: HistoryItem, ebookFile?: File) => {
    if (!book.path || !/\.(mp3|m4b|m4a|aac|ogg|opus|wav|flac)$/i.test(book.path)) {
      showToast('Este audiobook não tem um arquivo de áudio salvo neste computador.');
      return;
    }
    if (syncingBookIds.includes(book.id)) return;
    setSyncingBookIds(prev => [...prev, book.id]);
    showToast(ebookFile
      ? `Sincronizando "${book.title}" com o texto. Isso pode levar alguns minutos.`
      : `Transcrevendo "${book.title}". Isso pode levar alguns minutos.`);

    const formData = new FormData();
    formData.append('audioPath', book.path);
    formData.append('title', book.title);
    formData.append('author', book.author || '');
    formData.append('destination', syncTextDestination);
    if (outputFolder) formData.append('outputFolder', outputFolder);
    if (ebookFile) formData.append('ebook', ebookFile);

    try {
      const res = await fetch('/api/sync-text', { method: 'POST', body: formData });
      const data = await res.json();
      if (data.success) {
        if (data.savedToLibrary) addSyncTextToLibrary(book.title, book.author, book.coverColor, data.content, data.wordCount, data.files);
        showToast(data.fallbackToLibrary
          ? `Texto de "${book.title}" salvo na biblioteca (este formato não guarda texto nos metadados).`
          : data.savedToLibrary && data.embedded?.length
            ? `Texto de "${book.title}" gravado no audiobook e salvo na biblioteca!`
            : data.savedToLibrary
              ? `Texto de "${book.title}" salvo na biblioteca!`
              : `Texto gravado nos metadados de "${book.title}"!`);
      } else {
        showToast(data.error || 'Falha ao gerar o texto sincronizado.');
      }
    } catch (e) {
      showToast('Erro ao conectar com o motor de sincronização.');
    } finally {
      setSyncingBookIds(prev => prev.filter(id => id !== book.id));
    }
  };

  // "Áudio + texto": abre a escolha do arquivo de texto e, ao escolher, já gera
  const handlePickBookTextFile = (book: HistoryItem) => {
    pendingSyncBookRef.current = book;
    if (syncTextInputRef.current) {
      syncTextInputRef.current.value = '';
      syncTextInputRef.current.click();
    }
  };

  const handleSyncTextFileChosen = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    const book = pendingSyncBookRef.current;
    pendingSyncBookRef.current = null;
    if (file && book) handleGenerateBookText(book, file);
  };

  // Pop-up Seletor de Ajustes Ativo
  const [activeSettingSelector, setActiveSettingSelector] = useState<ActiveSettingSelector | null>(null);
  const [selectorMode, setSelectorMode] = useState<string>('select');
  const [selectorDirection, setSelectorDirection] = useState<1 | -1>(1);
  const [selectorInputValue, setSelectorInputValue] = useState<string>('');

  useEffect(() => {
    if (activeSettingSelector) {
      setSelectorDirection(1);
      setSelectorMode(activeSettingSelector.mode || 'select');
      setSelectorInputValue(
        activeSettingSelector.initialInputValue || 
        (typeof activeSettingSelector.currentValue === 'string' && activeSettingSelector.currentValue !== '__custom__' 
          ? activeSettingSelector.currentValue 
          : '')
      );
    } else {
      setSelectorDirection(1);
      setSelectorMode('select');
      setSelectorInputValue('');
    }
  }, [activeSettingSelector]);

  // Scrubber Alfabético/Década/Duração e Scroll Spy em Meus Audiobooks e Meus Textos
  const [activeNavGroupId, setActiveNavGroupId] = useState<string>('');
  const isManualScrollingRef = useRef<boolean>(false);
  const [sortBy, setSortBy] = useState<SortOption>('name-asc');
  const sortMenuTimeoutRef = useRef<any>(null);

  const handleSelectSort = (id: SortOption) => {
    setSortBy(id);
    const labels: Record<SortOption, string> = {
      'name-asc': t.sortNameAsc || 'Título (A-Z)',
      'name-desc': t.sortNameDesc || 'Título (Z-A)',
      'year-desc': t.sortYearDesc || 'Mais recentes (Ano)',
      'year-asc': t.sortYearAsc || 'Mais antigos (Ano)',
      'duration-desc': t.sortDurationDesc || 'Maior duração',
      'duration-asc': t.sortDurationAsc || 'Menor duração',
    };
    showToast(`${t.sortBy || 'Ordenar por'}: ${labels[id]}`);
    if (sortMenuTimeoutRef.current) clearTimeout(sortMenuTimeoutRef.current);
    sortMenuTimeoutRef.current = setTimeout(() => {
      if (sortMenuAnchor) {
        clearButtonCoverAnchorCache(sortMenuAnchor);
      }
      setSortMenuAnchor(null);
    }, 250);
  };

  // Helpers para extração e ordenação por Duração e Ano
  function getHistoryItemDurationSeconds(item: HistoryItem): number {
    if (item.chapters && item.chapters.length > 0) {
      const sum = item.chapters.reduce((acc, c) => {
        if (typeof c.duration === 'number') return acc + c.duration;
        if (typeof c.duration === 'string') {
          const str = c.duration.trim();
          if (str.includes(':')) {
            const parts = str.split(':').map(p => parseInt(p, 10) || 0);
            if (parts.length === 3) return acc + parts[0] * 3600 + parts[1] * 60 + parts[2];
            if (parts.length === 2) return acc + parts[0] * 60 + parts[1];
          }
        }
        return acc;
      }, 0);
      if (sum > 0) return sum;
    }
    const str = (item.duration || item.durationEst || '').toLowerCase().trim();
    if (!str) return 0;
    if (str.includes(':')) {
      const parts = str.split(':').map(p => parseInt(p, 10) || 0);
      if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
      if (parts.length === 2) return parts[0] * 60 + parts[1];
    }
    let totalSec = 0;
    const hMatch = str.match(/(\d+)\s*(?:h|hora|horas)/);
    const mMatch = str.match(/(\d+)\s*(?:m|min|minuto|minutos)/);
    const sMatch = str.match(/(\d+)\s*(?:s|seg|segundo|segundos)/);
    if (hMatch) totalSec += parseInt(hMatch[1], 10) * 3600;
    if (mMatch) totalSec += parseInt(mMatch[1], 10) * 60;
    if (sMatch) totalSec += parseInt(sMatch[1], 10);
    return totalSec;
  }

  function getHistoryItemYear(item: HistoryItem): number {
    const raw = (item.year || '').trim();
    const num = parseInt(raw, 10);
    if (!isNaN(num) && num > 0) return num;
    const dateMatch = (item.date || '').match(/\b(19\d\d|20\d\d)\b/);
    if (dateMatch) return parseInt(dateMatch[1], 10);
    return 0;
  }

  function getGeneratedTextYear(item: GeneratedTextItem): number {
    const dateMatch = (item.date || '').match(/\b(19\d\d|20\d\d)\b/);
    if (dateMatch) return parseInt(dateMatch[1], 10);
    return 0;
  }

  // Grupos Dinâmicos de Audiobooks (por Título, Ano ou Duração)
  const audiobooksNavGroups = useMemo<NavGroupItem<HistoryItem>[]>(() => {
    if (sortBy === 'name-asc' || sortBy === 'name-desc') {
      const groupMap = new Map<string, { id: string; key: string; items: HistoryItem[] }>();
      history.forEach(book => {
        const { id, key } = getAlphabetGroupKey(book.title);
        if (!groupMap.has(key)) {
          groupMap.set(key, { id, key, items: [] });
        }
        groupMap.get(key)!.items.push(book);
      });

      const keys = Array.from(groupMap.keys()).sort((a, b) => {
        return sortBy === 'name-asc' ? compareGroupKeys(a, b) : compareGroupKeys(b, a);
      });

      return keys.map(key => {
        const entry = groupMap.get(key)!;
        const sortedItems = entry.items.slice().sort((a, b) => {
          return sortBy === 'name-asc'
            ? compareTitles(a.title, b.title)
            : compareTitles(b.title, a.title);
        });
        return {
          id: entry.id,
          title: entry.key,
          navLabel: entry.key,
          items: sortedItems
        };
      });
    }

    if (sortBy === 'year-desc' || sortBy === 'year-asc') {
      const map = new Map<string, { decadeNum: number; items: HistoryItem[] }>();
      const unspecKey = t.yearUnspecified || 'Ano não especificado';

      history.forEach(book => {
        const num = getHistoryItemYear(book);
        let key: string;
        let decadeNum: number;

        if (num > 0) {
          decadeNum = Math.floor(num / 10) * 10;
          key = `${decadeNum}'s`;
        } else {
          decadeNum = -1;
          key = unspecKey;
        }

        if (!map.has(key)) map.set(key, { decadeNum, items: [] });
        map.get(key)!.items.push(book);
      });

      const keys = Array.from(map.keys()).sort((a, b) => {
        if (a === unspecKey) return 1;
        if (b === unspecKey) return -1;
        const numA = map.get(a)!.decadeNum;
        const numB = map.get(b)!.decadeNum;
        return sortBy === 'year-desc' ? numB - numA : numA - numB;
      });

      return keys.map(key => {
        const entry = map.get(key)!;
        const sortedItems = entry.items.slice().sort((a, b) => {
          const yearA = getHistoryItemYear(a);
          const yearB = getHistoryItemYear(b);
          if (yearA !== yearB) {
            return sortBy === 'year-desc' ? yearB - yearA : yearA - yearB;
          }
          return compareTitles(a.title, b.title);
        });
        return {
          id: `year-${key.replace(/[^a-zA-Z0-9]/g, '_')}`,
          title: key,
          navLabel: key === unspecKey ? '—' : key,
          items: sortedItems,
        };
      });
    }

    if (sortBy === 'duration-desc' || sortBy === 'duration-asc') {
      const categories = [
        { id: 'dur-under-1h', navLabel: '< 1h', min: 0, max: 3600 },
        { id: 'dur-1-3h', navLabel: '1-3h', min: 3600, max: 10800 },
        { id: 'dur-3-6h', navLabel: '3-6h', min: 10800, max: 21600 },
        { id: 'dur-6-10h', navLabel: '6-10h', min: 21600, max: 36000 },
        { id: 'dur-10-20h', navLabel: '10-20h', min: 36000, max: 72000 },
        { id: 'dur-over-20h', navLabel: '> 20h', min: 72000, max: Infinity },
      ];

      const orderedCategories = sortBy === 'duration-desc' ? [...categories].reverse() : categories;
      const groups: NavGroupItem<HistoryItem>[] = [];

      orderedCategories.forEach(cat => {
        const groupItems = history.filter(b => {
          const d = getHistoryItemDurationSeconds(b);
          return d >= cat.min && d < cat.max;
        }).sort((a, b) => {
          const dA = getHistoryItemDurationSeconds(a);
          const dB = getHistoryItemDurationSeconds(b);
          return sortBy === 'duration-desc' ? dB - dA : dA - dB;
        });

        if (groupItems.length > 0) {
          groups.push({
            id: cat.id,
            title: cat.navLabel,
            navLabel: cat.navLabel,
            items: groupItems,
          });
        }
      });

      return groups;
    }

    return [];
  }, [history, sortBy, t.yearUnspecified]);

  // Grupos Dinâmicos de Textos Gerados (por Título, Ano ou Quantidade de Palavras)
  const textsNavGroups = useMemo<NavGroupItem<GeneratedTextItem>[]>(() => {
    if (sortBy === 'name-asc' || sortBy === 'name-desc') {
      const groupMap = new Map<string, { id: string; key: string; items: GeneratedTextItem[] }>();
      generatedTexts.forEach(text => {
        const { id, key } = getAlphabetGroupKey(text.title);
        if (!groupMap.has(key)) {
          groupMap.set(key, { id, key, items: [] });
        }
        groupMap.get(key)!.items.push(text);
      });

      const keys = Array.from(groupMap.keys()).sort((a, b) => {
        return sortBy === 'name-asc' ? compareGroupKeys(a, b) : compareGroupKeys(b, a);
      });

      return keys.map(key => {
        const entry = groupMap.get(key)!;
        const sortedItems = entry.items.slice().sort((a, b) => {
          return sortBy === 'name-asc'
            ? compareTitles(a.title, b.title)
            : compareTitles(b.title, a.title);
        });
        return {
          id: entry.id,
          title: entry.key,
          navLabel: entry.key,
          items: sortedItems
        };
      });
    }

    if (sortBy === 'year-desc' || sortBy === 'year-asc') {
      const map = new Map<string, { decadeNum: number; items: GeneratedTextItem[] }>();
      const unspecKey = t.yearUnspecified || 'Ano não especificado';

      generatedTexts.forEach(text => {
        const num = getGeneratedTextYear(text);
        let key: string;
        let decadeNum: number;

        if (num > 0) {
          decadeNum = Math.floor(num / 10) * 10;
          key = `${decadeNum}'s`;
        } else {
          decadeNum = -1;
          key = unspecKey;
        }

        if (!map.has(key)) map.set(key, { decadeNum, items: [] });
        map.get(key)!.items.push(text);
      });

      const keys = Array.from(map.keys()).sort((a, b) => {
        if (a === unspecKey) return 1;
        if (b === unspecKey) return -1;
        const numA = map.get(a)!.decadeNum;
        const numB = map.get(b)!.decadeNum;
        return sortBy === 'year-desc' ? numB - numA : numA - numB;
      });

      return keys.map(key => {
        const entry = map.get(key)!;
        const sortedItems = entry.items.slice().sort((a, b) => {
          const yearA = getGeneratedTextYear(a);
          const yearB = getGeneratedTextYear(b);
          if (yearA !== yearB) {
            return sortBy === 'year-desc' ? yearB - yearA : yearA - yearB;
          }
          return compareTitles(a.title, b.title);
        });
        return {
          id: `year-${key.replace(/[^a-zA-Z0-9]/g, '_')}`,
          title: key,
          navLabel: key === unspecKey ? '—' : key,
          items: sortedItems,
        };
      });
    }

    if (sortBy === 'duration-desc' || sortBy === 'duration-asc') {
      const categories = [
        { id: 'dur-under-500', navLabel: '< 500 pal.', min: 0, max: 500 },
        { id: 'dur-500-1k', navLabel: '500-1k pal.', min: 500, max: 1000 },
        { id: 'dur-1k-2k', navLabel: '1k-2k pal.', min: 1000, max: 2000 },
        { id: 'dur-over-2k', navLabel: '> 2k pal.', min: 2000, max: Infinity },
      ];

      const orderedCategories = sortBy === 'duration-desc' ? [...categories].reverse() : categories;
      const groups: NavGroupItem<GeneratedTextItem>[] = [];

      orderedCategories.forEach(cat => {
        const groupItems = generatedTexts.filter(tItem => {
          const w = tItem.wordCount || 0;
          return w >= cat.min && w < cat.max;
        }).sort((a, b) => {
          const wA = a.wordCount || 0;
          const wB = b.wordCount || 0;
          return sortBy === 'duration-desc' ? wB - wA : wA - wB;
        });

        if (groupItems.length > 0) {
          groups.push({
            id: cat.id,
            title: cat.navLabel,
            navLabel: cat.navLabel,
            items: groupItems,
          });
        }
      });

      return groups;
    }

    return [];
  }, [generatedTexts, sortBy, t.yearUnspecified]);

  // Sincroniza o primeiro grupo ativo quando a tela abre ou os grupos mudam
  useEffect(() => {
    if (currentScreen === 'history-audiobooks' && audiobooksNavGroups.length > 0) {
      if (!audiobooksNavGroups.some(g => g.id === activeNavGroupId)) {
        setActiveNavGroupId(audiobooksNavGroups[0].id);
      }
    } else if (currentScreen === 'history-texts' && textsNavGroups.length > 0) {
      if (!textsNavGroups.some(g => g.id === activeNavGroupId)) {
        setActiveNavGroupId(textsNavGroups[0].id);
      }
    }
  }, [currentScreen, audiobooksNavGroups, textsNavGroups, activeNavGroupId]);

  // Scroll Spy: detecta a seção ativa conforme a rolagem do container principal
  useEffect(() => {
    if (currentScreen !== 'history-audiobooks' && currentScreen !== 'history-texts') return;
    const container = mainScrollRef.current;
    if (!container) return;

    const currentGroups = currentScreen === 'history-audiobooks' ? audiobooksNavGroups : textsNavGroups;

    const handleScroll = () => {
      if (isManualScrollingRef.current) return;
      if (currentGroups.length === 0) return;

      const containerRect = container.getBoundingClientRect();
      const triggerY = containerRect.top + 160;

      if (container.scrollTop + container.clientHeight >= container.scrollHeight - 30) {
        setActiveNavGroupId(currentGroups[currentGroups.length - 1].id);
        return;
      }

      let currentGroup = currentGroups[0].id;
      for (let i = 0; i < currentGroups.length; i++) {
        const g = currentGroups[i];
        const el = document.getElementById(`group-section-${g.id}`);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= triggerY) {
            currentGroup = g.id;
          } else {
            break;
          }
        }
      }

      setActiveNavGroupId(prev => (prev !== currentGroup ? currentGroup : prev));
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, [currentScreen, audiobooksNavGroups, textsNavGroups]);

  // Scroll suave ao clicar em uma letra do Scrubber
  const handleScrollToGroup = (groupId: string) => {
    setActiveNavGroupId(groupId);
    const container = mainScrollRef.current;
    const target = document.getElementById(`group-section-${groupId}`);
    if (!container || !target) return;

    const containerRect = container.getBoundingClientRect();
    const targetRect = target.getBoundingClientRect();

    const targetScrollTop = container.scrollTop + (targetRect.top - containerRect.top) - 80;

    isManualScrollingRef.current = true;
    container.scrollTo({
      top: Math.max(0, targetScrollTop),
      behavior: 'smooth',
    });

    setTimeout(() => {
      isManualScrollingRef.current = false;
    }, 600);
  };

  // Garante que o item ativo da barra de navegação permaneça visível se houver overflow
  useEffect(() => {
    if (!activeNavGroupId) return;
    const activeEl = document.getElementById(`nav-item-${activeNavGroupId}`);
    if (activeEl) {
      activeEl.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }, [activeNavGroupId]);

  // Menus de Contexto Flutuantes (Opções de Audiobook e Texto) e Âncoras de Pop-ups Morphing
  const [activeBookMenu, setActiveBookMenu] = useState<{ item: HistoryItem; anchorEl: HTMLElement; mode?: 'options' | 'details' | 'generate-text' | 'confirm-delete'; direction?: 1 | -1 } | null>(null);
  const [activeTextMenu, setActiveTextMenu] = useState<{ item: GeneratedTextItem; anchorEl: HTMLElement; mode?: 'options' | 'details' | 'preview' | 'confirm-delete'; direction?: 1 | -1 } | null>(null);
  const [sortMenuAnchor, setSortMenuAnchor] = useState<HTMLElement | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Estados e Referências para a Tela "Editar Audiobook" (Screenshots 2, 3 e 4)
  const [editingBook, setEditingBook] = useState<HistoryItem | null>(null);
  const [editingFileId, setEditingFileId] = useState<string | null>(null);
  const [editBookTitle, setEditBookTitle] = useState('');
  const [editBookAuthor, setEditBookAuthor] = useState('');
  const [editBookCategory, setEditBookCategory] = useState('');
  const [editBookSubgenre, setEditBookSubgenre] = useState('');
  const [editBookNarrator, setEditBookNarrator] = useState('');
  const [editBookLanguage, setEditBookLanguage] = useState('');
  const [editBookYear, setEditBookYear] = useState('');
  const [editBookVoice, setEditBookVoice] = useState('');
  const [editBookFileType, setEditBookFileType] = useState<AudioFormat>('m4b');
  const [editBookGenerateSyncText, setEditBookGenerateSyncText] = useState(true);
  const [editBookRequiresTranslation, setEditBookRequiresTranslation] = useState(false);
  const [editBookCover, setEditBookCover] = useState<string | undefined>(undefined);
  const [editCoverColor, setEditCoverColor] = useState<string>('#64748B');
  const [editBookDescription, setEditBookDescription] = useState('');
  const [editBookChapters, setEditBookChapters] = useState<ChapterItem[]>([]);
  const [editBookPronunciationMap, setEditBookPronunciationMap] = useState<{ original: string; replacement: string }[]>([]);
  const [pronOrigInput, setPronOrigInput] = useState('');
  const [pronRepInput, setPronRepInput] = useState('');
  const [previewChapter, setPreviewChapter] = useState<ChapterItem | null>(null);
  const [previewChapterAnchor, setPreviewChapterAnchor] = useState<HTMLElement | null>(null);
  const [editBookHasTranscript, setEditBookHasTranscript] = useState(false);
  const [editBookTranscriptFileName, setEditBookTranscriptFileName] = useState<string | undefined>(undefined);
  const editBookCoverInputRef = useRef<HTMLInputElement>(null);
  const editBookTranscriptInputRef = useRef<HTMLInputElement>(null);

  const pronTagsScrollRef = useRef<HTMLDivElement>(null);
  const isDraggingPronTags = useRef(false);
  const pronStartX = useRef(0);
  const pronScrollLeftPos = useRef(0);

  useEffect(() => {
    const el = pronTagsScrollRef.current;
    if (!el) return;
    const handleWheel = (e: WheelEvent) => {
      if (e.deltaY !== 0) {
        e.preventDefault();
        el.scrollLeft += e.deltaY;
      }
    };
    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, [editBookPronunciationMap.length]);

  const handlePronMouseDown = (e: React.MouseEvent) => {
    isDraggingPronTags.current = true;
    pronStartX.current = e.pageX - (pronTagsScrollRef.current?.offsetLeft || 0);
    pronScrollLeftPos.current = pronTagsScrollRef.current?.scrollLeft || 0;
  };
  const handlePronMouseLeaveOrUp = () => {
    isDraggingPronTags.current = false;
  };
  const handlePronMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingPronTags.current || !pronTagsScrollRef.current) return;
    e.preventDefault();
    const x = e.pageX - (pronTagsScrollRef.current?.offsetLeft || 0);
    const walk = (x - pronStartX.current) * 1.5;
    pronTagsScrollRef.current.scrollLeft = pronScrollLeftPos.current - walk;
  };

  const handleStartEditFile = (file: AppFile) => {
    setEditingFileId(file.id);
    setEditingBook(null);
    setEditBookTitle(file.title || 'Desconhecido');
    setEditBookAuthor(file.author || 'Desconhecido');
    setEditBookCategory(file.genre || '');
    setEditBookSubgenre(file.subgenre || '');
    setEditBookNarrator(file.narrator || '');
    setEditBookLanguage(normalizeLanguageName(file.language));
    setEditBookYear(file.year || '');
    setEditBookVoice(effectiveVoice(file, defaultVoice));
    setEditBookFileType(file.fileType || (fileTypeOption === 'ask' ? 'm4b' : fileTypeOption));
    setEditBookGenerateSyncText(file.generateSyncText !== undefined ? file.generateSyncText : true);
    setEditBookRequiresTranslation(Boolean(file.requiresTranslation));
    setEditBookCover(file.customCover || file.cover);
    setEditCoverColor(coverColorsMap[file.id] || getGenericCoverColor(file.cover, file.title, file.author));
    setEditBookDescription(file.description || '');
    setEditBookChapters(
      file.chapters && file.chapters.length > 0
        ? file.chapters.map(c => ({ ...c }))
        : [
            { id: 'c-1', title: 'Capítulo 1 - Início', duration: file.durationEst || '0:00' }
          ]
    );
    setEditBookHasTranscript(Boolean(file.filename || file.name));
    setEditBookTranscriptFileName(file.filename || file.name);
    setEditBookPronunciationMap(file.pronunciationMap ? [...file.pronunciationMap] : []);
    setPronOrigInput('');
    setPronRepInput('');
    navigateTo('edit-audiobook');
  };

  const handleStartEditBook = (book: HistoryItem) => {
    setEditingBook(book);
    setEditingFileId(null);
    setEditBookTitle(book.title || '');
    setEditBookAuthor(book.author || '');
    setEditBookCategory(book.genre || '');
    setEditBookSubgenre(book.subgenre || '');
    setEditBookNarrator(book.narrator || 'Allex');
    setEditBookLanguage(normalizeLanguageName(book.language));
    setEditBookYear(book.year || '');
    setEditBookVoice(book.narrator || selectedVoice);
    setEditBookFileType(book.format?.toLowerCase().includes('pasta') ? 'multiple' : audioFormatFromPath(book.path || book.format));
    setEditBookGenerateSyncText(Boolean(book.hasTranscript));
    setEditBookRequiresTranslation(false);
    setEditBookCover(book.customCover || book.cover);
    setEditCoverColor(book.coverColor || getGenericCoverColor(book.cover, book.title, book.author));
    setEditBookDescription(book.description || '');
    setEditBookChapters(
      book.chapters && book.chapters.length > 0
        ? book.chapters.map(c => ({ ...c }))
        : [
            { id: 'c-1', title: 'Cap. 1 - Do Título', duration: '3:45' },
            { id: 'c-2', title: 'Cap. 2 - Do Livro', duration: '4:10' },
            { id: 'c-3', title: 'Cap. 3 - A Prima Justina', duration: '5:20' },
            { id: 'c-4', title: 'Cap. 4 - Um Dever Cívico', duration: '6:15' },
            { id: 'c-5', title: 'Cap. 5 - O Agregado', duration: '7:05' }
          ]
    );
    setEditBookHasTranscript(Boolean(book.hasTranscript));
    setEditBookTranscriptFileName(book.transcriptFileName || (book.hasTranscript ? `${book.title}.epub` : undefined));
    setEditBookPronunciationMap(book.pronunciationMap ? [...book.pronunciationMap] : []);
    setPronOrigInput('');
    setPronRepInput('');
    if (activeBookMenu?.anchorEl) {
      clearButtonCoverAnchorCache(activeBookMenu.anchorEl);
    }
    setActiveBookMenu(null);
    navigateTo('edit-audiobook');
  };

  const handleSaveBookEdits = async () => {
    const newTitle = editBookTitle.trim() || 'Desconhecido';
    const newAuthor = editBookAuthor.trim() || 'Desconhecido';
    const safeChapters = editBookChapters.length > 0 
      ? editBookChapters 
      : [{ id: 'c-1', title: 'Capítulo 1 - Início', duration: '0:00' }];

    if (editingFileId) {
      setFiles(prev => prev.map(f => {
        if (f.id === editingFileId) {
          return {
            ...f,
            title: newTitle,
            author: newAuthor,
            genre: editBookCategory.trim(),
            subgenre: editBookSubgenre.trim(),
            narrator: editBookNarrator.trim(),
            language: normalizeLanguageName(editBookLanguage),
            isLanguageSelected: true,
            year: editBookYear.trim(),
            voice: editBookVoice,
            fileType: editBookFileType,
            generateSyncText: editBookGenerateSyncText,
            isSyncTextSelected: true,
            requiresTranslation: editBookRequiresTranslation,
            customCover: editBookCover,
            cover: editBookCover || f.cover,
            coverColor: editCoverColor,
            description: editBookDescription,
            chapters: safeChapters,
            pronunciationMap: editBookPronunciationMap
          };
        }
        return f;
      }));
      setCoverColorsMap(prev => ({ ...prev, [editingFileId]: editCoverColor }));
      setEditingFileId(null);
      showToast("Edição salva com sucesso!");
      navigateBack();
      return;
    }

    if (!editingBook) return;

    const updatedBook: HistoryItem = {
      ...editingBook,
      title: newTitle,
      author: newAuthor,
      genre: editBookCategory.trim(),
      subgenre: editBookSubgenre.trim(),
      narrator: editBookNarrator.trim(),
      language: normalizeLanguageName(editBookLanguage),
      year: editBookYear.trim(),
      description: editBookDescription,
      cover: editBookCover || getGenericBookCover(newTitle, newAuthor, editCoverColor),
      customCover: editBookCover,
      coverColor: editCoverColor,
      chapters: safeChapters,
      hasTranscript: editBookHasTranscript,
      transcriptFileName: editBookTranscriptFileName,
      pronunciationMap: editBookPronunciationMap,
    };

    // Injeção de metadados no arquivo físico se houver caminho
    if (editingBook.path) {
      try {
        showToast("Gravando metadados no arquivo...");
        await fetch('/api/save-audiobook-metadata', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            filePath: editingBook.path,
            title: newTitle,
            author: newAuthor,
            genre: editBookCategory.trim(),
            subgenre: editBookSubgenre.trim(),
            narrator: editBookNarrator.trim(),
            language: normalizeLanguageName(editBookLanguage),
            description: editBookDescription,
            cover: editBookCover,
            chapters: safeChapters
          })
        });
      } catch (err) {
        console.error("Erro salvando metadados no arquivo:", err);
      }
    }

    setHistory(prev => {
      const next = prev.map(item => item.id === editingBook.id ? updatedBook : item);
      try {
        safeSet('audiobook_history', JSON.stringify(next));
      } catch (e) {
        console.warn("Erro ao salvar histórico local:", e);
      }
      return next;
    });

    showToast("Metadados injetados e salvos com sucesso!");
    navigateBack();
  };

  const handleCancelBookEdits = () => {
    setEditingBook(null);
    setEditingFileId(null);
    navigateBack();
  };

  const handleSplitLongChapter = (index: number) => {
    setEditBookChapters(prev => {
      if (!prev[index]) return prev;
      const target = prev[index];
      const content = (target.content || target.snippet || '').trim();
      const paragraphs = content.split('\n\n').filter(p => p.trim());

      let part1Content = '';
      let part2Content = '';

      if (paragraphs.length >= 2) {
        const mid = Math.ceil(paragraphs.length / 2);
        part1Content = paragraphs.slice(0, mid).join('\n\n');
        part2Content = paragraphs.slice(mid).join('\n\n');
      } else if (content.length > 0) {
        const sentences = content.split(/(?<=[.!?…])\s+/);
        const mid = Math.ceil(sentences.length / 2);
        part1Content = sentences.slice(0, mid).join(' ');
        part2Content = sentences.slice(mid).join(' ');
      }

      const baseTitle = target.title.replace(/\s*-\s*Parte\s*\d+$/i, '').trim() || 'Capítulo';
      const part1: ChapterItem = {
        ...target,
        id: `${target.id || 'cap'}-p1`,
        title: `${baseTitle} - Parte 1`,
        content: part1Content,
        snippet: part1Content.slice(0, 500)
      };
      const part2: ChapterItem = {
        id: `cap-${Date.now()}-p2`,
        title: `${baseTitle} - Parte 2`,
        content: part2Content,
        snippet: part2Content.slice(0, 500)
      };

      const next = [...prev];
      next.splice(index, 1, part1, part2);
      return next;
    });
    showToast("Capítulo dividido automaticamente em 2 partes menores!");
  };

  // Estados e Handlers para a Tela "Editar Texto"
  const [editingText, setEditingText] = useState<GeneratedTextItem | null>(null);
  const [editTextTitle, setEditTextTitle] = useState('');
  const [editTextAuthor, setEditTextAuthor] = useState('');
  const [editTextColor, setEditTextColor] = useState<string>('#F97316');
  const [editTextGenre, setEditTextGenre] = useState('');
  const [editTextTone, setEditTextTone] = useState('');
  const [editTextContent, setEditTextContent] = useState('');

  const handleStartEditText = (item: GeneratedTextItem) => {
    setEditingText(item);
    setEditTextTitle(item.title || '');
    setEditTextAuthor(item.author || '');
    setEditTextColor(item.coverColor || getGenericCoverColor(item.cover, item.title, item.author));
    setEditTextGenre(item.genre || '');
    setEditTextTone(item.tone || '');
    setEditTextContent(item.content || '');
    if (activeTextMenu?.anchorEl) {
      clearButtonCoverAnchorCache(activeTextMenu.anchorEl);
    }
    setActiveTextMenu(null);
    navigateTo('edit-text');
  };

  const handleSaveTextEdits = () => {
    if (!editingText) return;
    const words = editTextContent.trim().split(/\s+/).filter(Boolean).length;
    setGeneratedTexts(prev => {
      const updated = prev.map(t => {
        if (t.id === editingText.id) {
          const finalTitle = editTextTitle.trim() || t.title;
          const finalAuthor = editTextAuthor.trim() || t.author || 'Autor Desconhecido';
          return {
            ...t,
            title: finalTitle,
            author: finalAuthor,
            genre: editTextGenre.trim() || t.genre,
            tone: editTextTone.trim() || t.tone,
            content: editTextContent,
            wordCount: words,
            coverColor: editTextColor,
            cover: getGenericTextCover(finalTitle, finalAuthor, editTextColor)
          };
        }
        return t;
      });
      try {

      } catch (e) {
        console.warn("Erro ao salvar textos locais:", e);
      }
      return updated;
    });
    showToast("Texto editado e salvo com sucesso!");
    navigateBack();
  };

  const handleCancelTextEdits = () => {
    setEditingText(null);
    navigateBack();
  };

  const closeAllPopups = useCallback(() => {
    if (sortMenuTimeoutRef.current) {
      clearTimeout(sortMenuTimeoutRef.current);
    }
    if (activeSettingSelector?.triggerEl) {
      clearButtonCoverAnchorCache(activeSettingSelector.triggerEl);
    }
    if (activeBookMenu?.anchorEl) {
      clearButtonCoverAnchorCache(activeBookMenu.anchorEl);
    }
    if (activeTextMenu?.anchorEl) {
      clearButtonCoverAnchorCache(activeTextMenu.anchorEl);
    }
    if (sortMenuAnchor) {
      clearButtonCoverAnchorCache(sortMenuAnchor);
    }
    if (previewChapterAnchor) {
      clearButtonCoverAnchorCache(previewChapterAnchor);
    }
    if (cancelModalAnchor) {
      clearButtonCoverAnchorCache(cancelModalAnchor);
    }
    if (conversionAnchor) {
      clearButtonCoverAnchorCache(conversionAnchor);
    }
    if (translationAnchor) {
      clearButtonCoverAnchorCache(translationAnchor);
    }
    if (viewingTextAnchor) {
      clearButtonCoverAnchorCache(viewingTextAnchor);
    }
    setActiveSettingSelector(null);
    setActiveBookMenu(null);
    setActiveTextMenu(null);
    setSortMenuAnchor(null);

    setPreviewChapterAnchor(null);
    setPreviewChapter(null);
    setCancelModalAnchor(null);
    setShowCancelModal(false);
    setConversionAnchor(null);
    setTranslationAnchor(null);
    setShowTranslationModal(false);
    setViewingTextAnchor(null);
    setViewingTextModal(null);
  }, [activeSettingSelector, activeBookMenu, activeTextMenu, sortMenuAnchor, previewChapterAnchor, cancelModalAnchor, conversionAnchor, translationAnchor, viewingTextAnchor]);

  // Folhas e confirmações abertas: o voltar do sistema (e o gesto da borda) as fecha antes de trocar de tela
  useBackLayer(showTranslationModal, () => setShowTranslationModal(false));
  useBackLayer(Boolean(viewingTextModal), () => setViewingTextModal(null));

  // A navegação e os componentes do esqueleto avisam com "close-all-popups": fecha também os pop-ups do app
  useEffect(() => {
    window.addEventListener('close-all-popups', closeAllPopups);
    return () => window.removeEventListener('close-all-popups', closeAllPopups);
  }, [closeAllPopups]);

  // Arquivos de um item no computador. Audiobooks antigos (sem a lista) usam o caminho do áudio; no formato
  // "um arquivo por capítulo", a pasta "(Audiobook)" onde os capítulos estão.
  const filesOfBook = (b: HistoryItem): string[] => {
    if (b.files && b.files.length > 0) {
      const pastas = new Set<string>();
      for (const f of b.files) {
        const pasta = f.replace(/[\\/][^\\/]+$/, '');
        if (/\(Audiobook\)( \(\d+\))?$/.test(pasta)) pastas.add(pasta);
      }
      return pastas.size > 0 ? [...pastas] : b.files;
    }
    if (!b.path) return [];
    const pasta = b.path.replace(/[\\/][^\\/]+$/, '');
    return /\(Audiobook\)( \(\d+\))?$/.test(pasta) ? [pasta] : [b.path];
  };
  const filesOfText = (tx: GeneratedTextItem): string[] => tx.files || [];

  // Exclui do computador (para a Lixeira) e avisa o resultado
  const deleteFromDisk = async (paths: string[], what: string) => {
    if (paths.length === 0) { showToast(`${what} excluído de Convertidos.`); return; }
    try {
      const res = await fetch('/api/delete-files', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ paths }) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || `código ${res.status}`);
      showToast(data.skipped?.length
        ? `${what} excluído. Alguns arquivos foram mantidos por não serem do audiobook.`
        : `${what} excluído e enviado para a Lixeira.`);
    } catch (e) {
      showToast(`${what} saiu de Convertidos, mas os arquivos não foram excluídos: ${e instanceof Error ? e.message : e}`);
    }
  };

  const handleDeleteHistoryItem = (id: string) => {
    const item = history.find(h => h.id === id);
    setHistory(prev => prev.filter(h => h.id !== id));
    deleteFromDisk(item ? filesOfBook(item) : [], 'Audiobook');
  };

  // Convertidos: modo de seleção para excluir vários itens de uma vez ('book:<id>' ou 'text:<id>')
  const [selectingConverted, setSelectingConverted] = useState(false);
  const [selectedConverted, setSelectedConverted] = useState<string[]>([]);
  const toggleConvertedSelection = (key: string) => {
    setSelectedConverted(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]);
  };
  const exitConvertedSelection = () => {
    setSelectingConverted(false);
    setSelectedConverted([]);
  };
  const deleteSelectedConverted = () => {
    const bookIds = new Set(selectedConverted.filter(k => k.startsWith('book:')).map(k => k.slice(5)));
    const textIds = new Set(selectedConverted.filter(k => k.startsWith('text:')).map(k => k.slice(5)));
    const count = bookIds.size + textIds.size;
    const paths = [
      ...history.filter(h => bookIds.has(h.id)).flatMap(filesOfBook),
      ...generatedTexts.filter(tx => textIds.has(tx.id)).flatMap(filesOfText),
    ];
    if (paths.length > 0) deleteFromDisk(paths, count === 1 ? '1 item' : `${count} itens`);
    if (bookIds.size > 0) {
      setHistory(prev => {
        const updated = prev.filter(h => !bookIds.has(h.id));

        return updated;
      });
    }
    if (textIds.size > 0) {
      setGeneratedTexts(prev => {
        const updated = prev.filter(tx => !textIds.has(tx.id));

        return updated;
      });
    }
    exitConvertedSelection();
    if (paths.length === 0) showToast(count === 1 ? '1 item excluído de Convertidos.' : `${count} itens excluídos de Convertidos.`);
  };
  // Sair de Convertidos encerra a seleção
  useEffect(() => {
    if (currentScreen !== 'history' && currentScreen !== 'history-audiobooks' && currentScreen !== 'history-texts') {
      setSelectingConverted(false);
      setSelectedConverted([]);
    }
  }, [currentScreen]);

  const handleDeleteGeneratedText = (id: string) => {
    const item = generatedTexts.find(tx => tx.id === id);
    setGeneratedTexts(prev => prev.filter(t => t.id !== id));
    deleteFromDisk(item ? filesOfText(item) : [], 'Texto');
  };

  // SSE (Server-Sent Events) para Progresso
  useEffect(() => {
    let eventSource: EventSource;
    if (phase === 2) {
      eventSource = new EventSource('/api/progress');
      eventSource.onmessage = (event) => {
        let data: any;
        try { data = JSON.parse(event.data); } catch { return; }
        if (!data || typeof data !== 'object') return;
        setFiles(prevFiles => {
          const newFiles = prevFiles.map((f): AppFile => {
            if (f.id === data.fileId) {
              if (data.type === 'progress') {
                const currentProg = data.progress;
                if (data.status === 'translating') {
                  return { ...f, translationProgress: currentProg, status: 'translating', isTranslating: true, isEditing: false };
                } else if (data.status === 'editing') {
                  return { ...f, editingProgress: currentProg, status: 'editing', isEditing: true, isTranslating: false, translationProgress: 100 };
                } else if (data.status === 'syncing') {
                  return { ...f, progress: currentProg, status: 'syncing', syncMessage: data.message || 'Sincronizando áudio e texto...', editingProgress: 100, translationProgress: 100, isEditing: false, isTranslating: false };
                } else {
                  return { ...f, progress: currentProg, status: 'processing', syncMessage: undefined, stageMessage: data.message || (data.partsDone !== undefined ? undefined : f.stageMessage), editingProgress: 100, translationProgress: 100, isEditing: false, isTranslating: false, partsDone: data.partsDone !== undefined ? data.partsDone : f.partsDone, partsTotal: data.partsTotal || f.partsTotal };
                }
              } else if (data.type === 'done') {
                const bookCover = f.customCover || f.cover || getGenericBookCover(f.title, f.author, f.coverColor);
                triggerHistoryCoverBadge(bookCover, f.title);

                // Adiciona imediatamente este audiobook concluído ao histórico
                const completedHistoryItem: HistoryItem = {
                  id: Math.random().toString(),
                  title: f.title,
                  author: f.author,
                  genre: f.genre,
                  subgenre: f.subgenre,
                  narrator: f.narrator,
                  language: normalizeLanguageName(f.language),
                  date: new Date().toLocaleDateString(interfaceLang),
                  status: 'success',
                  cover: bookCover,
                  coverColor: f.coverColor,
                  path: (data.paths && data.paths.length > 0) ? data.paths[0] : (f.generatedPaths?.[0] || outputFolder),
                  // Arquivos do audiobook (o texto salvo na biblioteca vira um item próprio em Textos)
                  files: (data.paths || []).filter((p: string) => !/\.(lrc|srt|vtt)$|\.sync\.json$/i.test(p)),
                  duration: data.finalDuration || f.durationEst,
                  size: data.finalSize || f.audioSizeEst
                };
                setHistory(prev => [completedHistoryItem, ...prev]);
                if (data.syncText?.savedToLibrary && data.syncText.content) {
                  addSyncTextToLibrary(f.title, f.author, f.coverColor, data.syncText.content, data.syncText.wordCount, data.syncText.files);
                }
                showToast(`"${f.title}" concluído com sucesso e adicionado a Convertidos!`);

                // Remove da lista para sumir ao concluir a conversão conforme solicitado pelo usuário
                setTimeout(() => {
                  setFiles(prev => {
                    const remaining = prev.filter(item => item.id !== f.id);
                    if (remaining.length === 0) {
                      setPhase(0);
                    }
                    return remaining;
                  });
                }, 1000);

                return { 
                  ...f, 
                  progress: 100, 
                  status: 'success', 
                  generatedPaths: data.paths,
                  audioSizeEst: data.finalSize || f.audioSizeEst,
                  durationEst: data.finalDuration || f.durationEst
                };
              } else if (data.type === 'speed') {
                return { ...f, speedBps: typeof data.bytesPerSec === 'number' ? data.bytesPerSec : f.speedBps };
              } else if (data.type === 'error') {
                return { ...f, status: 'error', errorMessage: data.error, errorDetails: data.details };
              }
            }
            return f;
          });

          const allDone = newFiles.every(f => f.status === 'success' || f.status === 'error');
          if (allDone && newFiles.length > 0) {
            const hasErrors = newFiles.some(f => f.status === 'error');
            if (hasErrors) {
              showToast(t.completedErrors);
            }
          }
          return newFiles;
        });
      };
    }
    return () => {
      if (eventSource) eventSource.close();
    };
  }, [phase, interfaceLang]);

  // Upload e Extração de Metadados
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const allFiles = event.target.files ? Array.from(event.target.files) : [];
    const accepted = /\.(epub|pdf|mobi|azw|azw3|prc|txt)$/i;
    const selectedFiles = allFiles.filter(f => accepted.test(f.name) && f.size > 0);
    const rejected = allFiles.length - selectedFiles.length;
    if (rejected > 0) {
      showToast(rejected === 1 ? 'Um arquivo foi ignorado: use Epub, Pdf, Mobi, Azw/Azw3 ou Txt.' : `${rejected} arquivos foram ignorados: use Epub, Pdf, Mobi, Azw/Azw3 ou Txt.`);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (selectedFiles.length === 0) return;

    const newFiles: AppFile[] = [];
    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i];
      const fileId = Math.random().toString();

      const initialCoverColor = getGenericCoverColor(undefined, file.name.replace(/\.[^/.]+$/, ""));
      const newFile: AppFile = {
        id: fileId,
        filename: file.name,
        title: file.name.replace(/\.[^/.]+$/, "") || 'Desconhecido',
        author: 'Desconhecido',
        genre: '',
        subgenre: '',
        narrator: '',
        language: 'Português (Brasil)',
        sizeStr: (file.size / (1024 * 1024)).toFixed(2) + ' MB',
        durationEst: '',
        processingTimeEst: '',
        status: 'idle',
        progress: 0,
        translationProgress: 0,
        editingProgress: 0,
        isTranslating: false,
        isEditing: false,
        requiresTranslation: false,
        partsTotal: 1,
        partsDone: 0,
        fileObj: file,
        metadataStatus: 'loading',
        generateSyncText: generateSyncTextDefault,
        coverColor: initialCoverColor
      };
      newFiles.push(newFile);

      const formData = new FormData();
      formData.append('file', file);
      formData.append('filename', file.name);

      // Resposta em partes (uma linha JSON por parte): capa, título e autor chegam antes dos capítulos
      const applyPartial = (data: any) => {
        setFiles(prev => prev.map(f => {
          if (f.id !== fileId || f.metadataStatus !== 'loading') return f;
          const t = data.title && data.title.trim() && data.title !== 'Unknown' ? data.title.trim() : f.title;
          const a = data.author && data.author.trim() && data.author !== 'Unknown' ? data.author.trim() : f.author;
          return {
            ...f,
            title: t || f.title,
            author: a || f.author,
            genre: data.genre || f.genre,
            subgenre: data.subgenre || f.subgenre,
            language: data.language ? normalizeLanguageName(data.language) : f.language,
            cover: data.cover || f.cover,
          };
        }));
      };
      // Lê o livro; se a conexão falhar (servidor ocupado, rede local instável), tenta mais 2 vezes
      const readMetadata = async (tentativa = 0): Promise<Response> => {
        try {
          const res = await fetch('/api/metadata', { method: 'POST', body: formData });
          if (res.status >= 500 && tentativa < 2) throw new Error(`HTTP ${res.status}`);
          return res;
        } catch (e) {
          if (tentativa >= 2) throw e;
          await new Promise(r => setTimeout(r, 1200 * (tentativa + 1)));
          return readMetadata(tentativa + 1);
        }
      };
      readMetadata().then(async res => {
        if (!res.ok || !res.body) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || 'falha ao ler o arquivo');
        }
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        let final: any = null;
        const handleLine = (line: string) => {
          if (!line.trim()) return;
          let obj: any;
          try { obj = JSON.parse(line); } catch { return; }
          if (obj.error) throw new Error(obj.error);
          if (obj.partial) applyPartial(obj);
          else final = obj;
        };
        for (;;) {
          const { value, done } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';
          lines.forEach(handleLine);
        }
        handleLine(buffer + decoder.decode());
        if (!final) throw new Error('falha ao ler o arquivo');
        return final;
      }).then(data => {
        const detectedLang = normalizeLanguageName(data.language);
        setFiles(prev => prev.map(f => {
          if (f.id === fileId) {
            const rawTitle = data.title && data.title.trim() && data.title !== 'Unknown' ? data.title.trim() : f.title;
            const rawAuthor = data.author && data.author.trim() && data.author !== 'Unknown' ? data.author.trim() : f.author;
            return {
              ...f,
              title: rawTitle || 'Desconhecido',
              author: rawAuthor || 'Desconhecido',
              genre: data.genre || '',
              subgenre: data.subgenre || '',
              narrator: data.narrator || '',
              language: detectedLang,
              charCount: typeof data.charCount === 'number' ? data.charCount : undefined,
              durationEst: data.durationEst || '',
              audioSizeEst: data.audioSizeEst || '',
              processingTimeEst: data.processingTimeEst || '',
              partsTotal: data.partsTotal || 1,
              metadataStatus: 'loaded',
              cover: data.cover || undefined,
              coverColor: f.coverColor || initialCoverColor,
              chapters: data.chapters && data.chapters.length > 0 ? data.chapters : f.chapters
            };
          }
          return f;
        }));

        // Livro sem texto narrável (DRM, PDF escaneado, arquivo corrompido): avisa já ao carregar
        if (data.unreadable) {
          showToast(`"${file.name}": ${data.unreadable}`);
          setFiles(prev => prev.map(f => f.id === fileId ? { ...f, errorMessage: data.unreadable } : f));
          return;
        }
      }).catch((e) => {
        const motivo = e instanceof Error && e.message ? e.message : String(e);
        console.error(`Metadados de "${file.name}":`, e);
        setFiles(prev => prev.map(f => f.id === fileId ? { ...f, metadataStatus: 'error', durationEst: '', audioSizeEst: '', processingTimeEst: '' } : f));
        showToast(`Não foi possível ler os dados de "${file.name}" (${motivo}). Preencha título e autor no card; o livro ainda pode ser convertido.`);
      });
    }

    setFiles(prev => [...prev, ...newFiles]);
    setPhase(prev => (prev === 2 ? 2 : 1));
    navigateTo('converter');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleStartConversion = () => {
    // Se estiver na fase 2 e houver arquivos pendentes, converter apenas os pendentes
    const targetFiles = (phase === 2) 
      ? files.filter(f => f.status === 'idle') 
      : files;

    if (targetFiles.length === 0) return;

    // Validar campos obrigatórios: Título e Autor
    const invalidFile = targetFiles.find(f => !f.title || !f.title.trim() || !f.author || !f.author.trim());
    if (invalidFile) {
      showToast("Título e Autor são obrigatórios em todos os livros! Preencha-os antes de iniciar a síntese.");
      handleOpenMetadataModal(invalidFile);
      return;
    }
    // Sem pasta escolhida: usa (e cria, se preciso) a pasta padrão
    ensureOutputFolder().then(folder => {
      if (!folder) {
        showToast('Escolha uma pasta de salvamento em Ajustes › Armazenamento e pastas.');
        navigateTo('settings-storage');
        return;
      }
      // Sem perguntas: cada e-book já tem voz e formato no próprio card (ou herda os padrões dos Ajustes)
      const effectiveVoice = selectedVoice || (defaultVoice !== 'ask' ? defaultVoice : 'pt-BR-AntonioNeural');
      const effectiveFileType: AudioFormat = fileTypeOption === 'ask' ? 'm4b' : fileTypeOption;
      proceedWithConversion(effectiveVoice, effectiveFileType, targetFiles, folder);
    });
  };

  const proceedWithConversion = async (voiceCode: string, fileType: AudioFormat, targetFiles?: AppFile[], folderOverride?: string) => {
    setPhase(2);
    const filesToConvert = targetFiles || files;

    setFiles(prev => prev.map(f => {
      if (filesToConvert.some(tf => tf.id === f.id)) {
        return { ...f, status: 'processing', progress: f.progress || 0 };
      }
      return f;
    }));

    const formData = new FormData();
    filesToConvert.forEach(f => {
      if (f.fileObj) {
        formData.append('files', f.fileObj);
      }
    });
    formData.append('filesInfo', JSON.stringify(filesToConvert.map(f => ({
      id: f.id,
      filename: f.filename,
      title: f.title.trim() || 'Desconhecido',
      author: f.author.trim() || 'Desconhecido',
      genre: f.genre || '',
      subgenre: f.subgenre || '',
      narrator: f.narrator || '',
      language: normalizeLanguageName(f.language),
      voice: effectiveVoice(f, voiceCode),
      translate: f.requiresTranslation,
      cover: f.customCover || f.cover || null,
      generate_sync_text: f.generateSyncText !== undefined ? f.generateSyncText : true,
      fileType: f.fileType || fileType,
      chapters: f.chapters || [],
      pronunciationMap: f.pronunciationMap || [],
      pronunciation_map: f.pronunciationMap || []
    }))));
    formData.append('config', JSON.stringify({
      voice: voiceCode,
      outputFolder: folderOverride || outputFolder,
      fileType: fileType,
      file_format: fileType,
      mode_folder: fileType === 'multiple',
      target_lang: 'pt',
      generate_sync_text: generateSyncTextDefault,
      sync_text_destination: syncTextDestination,
      sync_text_granularity: syncTextGranularity,
      audio_quality: audioQuality
    }));

    const ids = new Set(filesToConvert.map(f => f.id));
    const failAll = (message: string, details: string) => {
      const when = new Date().toLocaleString(interfaceLang);
      const fullDetails = `${details}\n\nEndereço do app: ${window.location.origin}\nQuando: ${when}`;
      setFiles(prev => prev.map(f => ids.has(f.id) ? { ...f, status: 'error', errorMessage: message, errorDetails: fullDetails } : f));
      showToast(message);
    };
    try {
      const res = await fetch('/api/process', { method: 'POST', body: formData });
      if (!res.ok) {
        const body = await res.text().catch(() => '');
        let data: any = {};
        try { data = JSON.parse(body); } catch { /* resposta sem JSON */ }
        failAll(
          data.error || `O serviço de conversão recusou o pedido (código ${res.status}). Tente de novo.`,
          `POST /api/process respondeu ${res.status} ${res.statusText}.\nResposta: ${body.slice(0, 1500) || '(vazia)'}`
        );
      }
    } catch (e) {
      // Sem resposta nenhuma: o servidor local do app não está rodando (a página continua aberta sem ele)
      const vivo = await fetch('/api/health', { cache: 'no-store' }).then(r => r.ok).catch(() => false);
      const motivo = `POST /api/process falhou sem resposta: ${e instanceof Error ? `${e.name}: ${e.message}` : String(e)}.\nTeste do servidor (/api/health): ${vivo ? 'respondeu' : 'sem resposta'}.`;
      failAll(vivo
        ? 'A conexão com o serviço de conversão caiu durante o envio do livro. Tente de novo; se repetir, veja os detalhes.'
        : 'O serviço local do app não está respondendo, então nada pode ser convertido. Feche esta janela e abra o Audiobook Generator de novo pelo atalho (ou pelo abrir_no_navegador.bat).',
        motivo);
    }
  };

  const handleCancelProcessing = async () => {
    try {
      await fetch('/api/cancel', { method: 'POST' });
      setPhase(1);
      // Só os que estavam convertendo voltam para a fila; os já concluídos ficam como estão
      setFiles(prev => prev.map(f => (f.status === 'success' ? f : { ...f, status: 'idle', progress: 0, errorMessage: undefined, errorDetails: undefined })));
      setShowCancelModal(false);
      setCancelModalAnchor(null);
      showToast("Conversão cancelada.");
    } catch (e) {
      setShowCancelModal(false);
      setCancelModalAnchor(null);
      showToast("Não foi possível cancelar: o serviço de conversão não respondeu.");
    }
  };

  const handleRetryFile = (file: AppFile) => {
    setFiles(prev => prev.map(f => f.id === file.id ? { ...f, status: 'processing', progress: 0, errorMessage: undefined, errorDetails: undefined } : f));
    const retryVoice = effectiveVoice(file, defaultVoice);
    const effectiveFileType: AudioFormat = (file.fileType || (fileTypeOption === 'ask' ? 'm4b' : fileTypeOption)) as any;
    proceedWithConversion(retryVoice, effectiveFileType, [file]);
    showToast(`Reiniciando conversão de "${file.title}"...`);
  };

  // Tenta de novo, num pedido só, todos os livros que falharam (cada um com a própria voz e formato)
  const handleRetryAllFailed = () => {
    const failed = files.filter(f => f.status === 'error');
    if (failed.length === 0) return;
    const ids = new Set(failed.map(f => f.id));
    setFiles(prev => prev.map(f => ids.has(f.id) ? { ...f, status: 'processing', progress: 0, errorMessage: undefined, errorDetails: undefined } : f));
    const effectiveFileType: AudioFormat = fileTypeOption === 'ask' ? 'm4b' : fileTypeOption;
    proceedWithConversion(defaultVoice, effectiveFileType, failed);
    showToast(failed.length === 1 ? `Reiniciando conversão de "${failed[0].title}"...` : `Reiniciando ${failed.length} conversões...`);
  };

  const sendGeneratedTextToConverter = (text: string, title: string) => {
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const file = new File([blob], `${title}.txt`, { type: 'text/plain' });

    const fileId = Math.random().toString();
    const newFile: AppFile = {
      id: fileId,
      filename: `${title}.txt`,
      title: title,
      author: 'IA Storyteller',
      genre: 'Ficção',
      subgenre: '',
      narrator: 'IA Storyteller',
      language: 'Português (Brasil)',
      sizeStr: (file.size / 1024).toFixed(1) + ' KB',
      durationEst: '4m 30s',
      processingTimeEst: '15s',
      status: 'idle',
      progress: 0,
      translationProgress: 0,
      editingProgress: 0,
      isTranslating: false,
      isEditing: false,
      requiresTranslation: false,
      partsTotal: 1,
      partsDone: 0,
      fileObj: file,
      metadataStatus: 'loaded',
      generateSyncText: generateSyncTextDefault,
      coverColor: getGenericCoverColor(undefined, title)
    };
    setFiles([newFile]);
    setPhase(1);
    navigateTo('converter');
    showToast(`"${title}" carregado no Conversor!`);
  };

  // Pesquisa
  const [searchQuery, setSearchQuery] = useState('');

  // Ao sair da tela de pesquisa, limpa a busca para que a barra e pop-ups não apareçam em outros menus
  useEffect(() => {
    if (currentScreen !== 'search' && searchQuery) {
      setSearchQuery('');
    }
  }, [currentScreen, searchQuery]);

  const computedSearchResults = useMemo(() => {
    if (!searchQuery.trim() || searchQuery.trim().toLowerCase() === '//dev') {
      return { books: [], texts: [], total: 0 };
    }
    const q = searchQuery.toLowerCase().trim();
    const books = history.filter(h => 
      (h.title && h.title.toLowerCase().includes(q)) || 
      (h.author && h.author.toLowerCase().includes(q)) || 
      (h.genre && h.genre.toLowerCase().includes(q))
    );
    const texts = generatedTexts.filter(t => 
      (t.title && t.title.toLowerCase().includes(q)) || 
      (t.content && t.content.toLowerCase().includes(q)) || 
      (t.genre && t.genre.toLowerCase().includes(q))
    );
    return { books, texts, total: books.length + texts.length };
  }, [searchQuery, history, generatedTexts]);
  const [isDevModeActive, setIsDevModeActive] = useState(() => {
    if (typeof window === 'undefined') return false;
    return safeGet('app_dev_mode') === 'true';
  });
  const [devBackup, setDevBackup] = useState<any | null>(null);
  const [devCrashScreen, setDevCrashScreen] = useState(false);
  const [devShowStack, setDevShowStack] = useState(false);

  const handleExitDevMode = useCallback(() => {
    setIsDevModeActive(false);
    try {
      removeKey('app_dev_mode');
    } catch {}
    if (devBackup) {
      if (devBackup.files !== undefined) setFiles(devBackup.files);
      if (devBackup.history !== undefined) setHistory(devBackup.history);
      if (devBackup.generatedTexts !== undefined) setGeneratedTexts(devBackup.generatedTexts);
      setDevBackup(null);
    } else if (history.length === 0) {
      setHistory(DEFAULT_AUDIOBOOKS);
    }
    showToast("Modo de desenvolvedor encerrado");
  }, [devBackup, history.length, showToast]);

  const handleInjectDevCollection = useCallback(() => {
    setIsDevModeActive(true);
    if (!devBackup) {
      setDevBackup({ files, history, generatedTexts });
    }
    setHistory(DEFAULT_AUDIOBOOKS);
    const mockTexts: GeneratedTextItem[] = [
      {
        id: 'mock-dev-text-1',
        title: 'O Mistério da Estrela Cadente',
        author: 'Gael Aldora',
        genre: 'Fantasia',
        tone: 'Narrativo Imersivo',
        wordCount: 1420,
        date: new Date().toLocaleDateString(interfaceLang),
        coverColor: '#9333EA',
        cover: getGenericTextCover('O Mistério da Estrela Cadente', 'Gael Aldora', '#9333EA'),
        content: 'Nas montanhas esquecidas de Aldora, uma centelha de luz cortou os céus noturnos com um estrondo silencioso. Gael observava da torre mais alta, com seu manto ondulando contra a ventania gélida...'
      },
      {
        id: 'mock-dev-text-2',
        title: 'Crônicas do Tempo Perdido',
        author: 'Dra. Helena Vance',
        genre: 'Ficção Científica',
        tone: 'Reflexivo',
        wordCount: 2850,
        date: new Date().toLocaleDateString(interfaceLang),
        coverColor: '#06B6D4',
        cover: getGenericTextCover('Crônicas do Tempo Perdido', 'Dra. Helena Vance', '#06B6D4'),
        content: 'O relógio quântico no centro da estação orbital começou a retroceder três segundos a cada minuto. A dra. Helena sabia que o continuum estava se desfazendo...'
      }
    ];
    setGeneratedTexts(mockTexts);
    try {
      safeSet('app_dev_mode', 'true');
    } catch {}
    setSearchQuery('');
    showToast('Modo Dev: Audiobooks e textos de teste adicionados ao histórico!');
  }, [devBackup, files, history, generatedTexts, interfaceLang, showToast]);

  const handleToggleDevZeroState = useCallback(() => {
    setIsDevModeActive(true);
    try {
      safeSet('app_dev_mode', 'true');
    } catch {}
    if (history.length > 0 || generatedTexts.length > 0) {
      setDevBackup({ files, history, generatedTexts });
      setHistory([]);
      setGeneratedTexts([]);
      setSearchQuery('');
      showToast('Modo Dev: Convertidos vazio ativado para teste de Zero-State.');
    } else if (devBackup && (devBackup.history?.length > 0 || devBackup.generatedTexts?.length > 0)) {
      setHistory(devBackup.history || DEFAULT_AUDIOBOOKS);
      setGeneratedTexts(devBackup.generatedTexts || []);
      setSearchQuery('');
      showToast('Modo Dev: Dados originais restaurados do histórico.');
    } else {
      setHistory(DEFAULT_AUDIOBOOKS);
      setSearchQuery('');
      showToast('Modo Dev: Convertidos restaurado com dados padrão.');
    }
  }, [devBackup, files, history, generatedTexts, showToast]);

  const handleSimulateConversionQueue = useCallback(() => {
    setIsDevModeActive(true);
    try {
      safeSet('app_dev_mode', 'true');
    } catch {}
    if (!devBackup) {
      setDevBackup({ files, history, generatedTexts });
    }
    const mockFiles: AppFile[] = [
      {
        id: 'dev-file-1',
        name: 'Dom Casmurro - Machado de Assis.epub',
        size: 2450000,
        sizeStr: '2.4 MB',
        title: 'Dom Casmurro',
        author: 'Machado de Assis',
        genre: 'Romance Realista',
        language: 'Português (Brasil)',
        year: '1899',
        status: 'processing',
        progress: 46,
        partsDone: 12,
        partsTotal: 25,
        processingTimeEst: '2 min restantes'
      },
      {
        id: 'dev-file-2',
        name: 'O Cortiço - Aluísio Azevedo.pdf',
        size: 5120000,
        sizeStr: '5.1 MB',
        title: 'O Cortiço',
        author: 'Aluísio Azevedo',
        genre: 'Naturalismo',
        language: 'Português (Brasil)',
        year: '1890',
        status: 'syncing',
        syncMessage: 'Sincronizando áudio e texto com IA...',
        progress: 82,
        processingTimeEst: '45s restantes'
      },
      {
        id: 'dev-file-3',
        name: 'Memórias Póstumas - Machado de Assis.epub',
        size: 1850000,
        sizeStr: '1.8 MB',
        title: 'Memórias Póstumas de Brás Cubas',
        author: 'Machado de Assis',
        genre: 'Realismo',
        language: 'Português (Brasil)',
        year: '1881',
        status: 'idle',
        progress: 0,
        processingTimeEst: 'Aguardando fila...'
      }
    ];
    setFiles(mockFiles);
    setPhase(2);
    setSearchQuery('');
    navigateTo('converter');
    showToast('Modo Dev: Fila de processamento em andamento simulada!');
  }, [devBackup, files, history, generatedTexts, showToast]);

  const handleSimulateConversionCompleted = useCallback(() => {
    setIsDevModeActive(true);
    try {
      safeSet('app_dev_mode', 'true');
    } catch {}
    if (!devBackup) {
      setDevBackup({ files, history, generatedTexts });
    }
    const mockFiles: AppFile[] = [
      {
        id: 'dev-file-comp-1',
        name: 'A Arte da Guerra - Sun Tzu.epub',
        size: 1200000,
        sizeStr: '1.2 MB',
        title: 'A Arte da Guerra',
        author: 'Sun Tzu',
        genre: 'Estratégia Militar',
        language: 'Português (Brasil)',
        year: '500 a.C.',
        status: 'success',
        progress: 100,
        durationEst: '2h 15m',
        audioSizeEst: '64 MB'
      },
      {
        id: 'dev-file-comp-2',
        name: 'A Metamorfose - Franz Kafka.epub',
        size: 980000,
        sizeStr: '980 KB',
        title: 'A Metamorfose',
        author: 'Franz Kafka',
        genre: 'Ficção Absurda',
        language: 'Português (Brasil)',
        year: '1915',
        status: 'success',
        progress: 100,
        durationEst: '2h 50m',
        audioSizeEst: '75 MB'
      }
    ];
    setFiles(mockFiles);
    setPhase(3);
    setSearchQuery('');
    navigateTo('converter');
    const firstCover = mockFiles[0].customCover || mockFiles[0].cover || getGenericBookCover(mockFiles[0].title, mockFiles[0].author);
    triggerHistoryCoverBadge(firstCover, mockFiles[0].title);
    showToast('Modo Dev: Conversão concluída com sucesso simulada!');
  }, [devBackup, files, history, generatedTexts, showToast]);

  const handleSimulateConversionError = useCallback(() => {
    setIsDevModeActive(true);
    try {
      safeSet('app_dev_mode', 'true');
    } catch {}
    if (!devBackup) {
      setDevBackup({ files, history, generatedTexts });
    }
    const mockFiles: AppFile[] = [
      {
        id: 'dev-file-err-1',
        name: 'O Cortiço.epub',
        size: 3400000,
        sizeStr: '3.4 MB',
        title: 'O Cortiço',
        author: 'Aluísio Azevedo',
        language: 'Português (Brasil)',
        status: 'error',
        progress: 35,
        errorMessage: 'Falha na conexão com o serviço de síntese neural.',
        requiresTranslation: false
      },
      {
        id: 'dev-file-conv-2',
        name: 'Memórias Póstumas de Brás Cubas.epub',
        size: 4200000,
        sizeStr: '4.2 MB',
        title: 'Memórias Póstumas de Brás Cubas',
        author: 'Machado de Assis',
        language: 'Português (Brasil)',
        status: 'processing',
        progress: 68,
        partsTotal: 12,
        partsDone: 8,
        processingTimeEst: '4 min restante(s)',
        requiresTranslation: false
      }
    ];
    setFiles(mockFiles);
    setPhase(2);
    setSearchQuery('');
    navigateTo('converter');
    showToast('⚠️ [Dev] Simulação de erro na conversão carregada.');
  }, [devBackup, files, history, generatedTexts, showToast]);

  const handleShowWelcomeModal = useCallback(() => {
    setIsDevModeActive(true);
    try {
      safeSet('app_dev_mode', 'true');
    } catch {}
    closeAllPopups();
    setShowWelcomeModal(true);
    setSearchQuery('');
    showToast('Modo Dev: Tela de primeira abertura (Boas-Vindas) exibida!');
  }, [closeAllPopups, showToast]);

  const handleShowInitialConfigModal = useCallback(() => {
    setIsDevModeActive(true);
    try {
      safeSet('app_dev_mode', 'true');
    } catch {}
    closeAllPopups();
    setShowInitialConfigModal(true);
    setSearchQuery('');
    showToast('Modo Dev: Modal de configuração obrigatória exibido!');
  }, [closeAllPopups, showToast]);

  const handleSimulateFirstLaunch = useCallback(() => {
    setIsDevModeActive(true);
    try {
      safeSet('app_dev_mode', 'true');
    } catch {}
    if (!devBackup) {
      setDevBackup({ files, history, generatedTexts });
    }
    setFiles([]);
    setHistory([]);
    setGeneratedTexts([]);
    setRecentSearches([]);
    setPhase(0);
    try {
      removeKey('app_files');
      removeKey('audiobook_history');
      removeKey('audiobook_generated_texts');
      removeKey('recent_searches');
      removeKey('has_seen_welcome_v3');
      removeKey('has_seen_initial_config_v3');
    } catch {}
    setSearchQuery('');
    navigateTo('converter');
    closeAllPopups();
    setShowWelcomeModal(true);
    showToast('Modo Dev: Primeira abertura simulada! O app está como recém-instalado.');
  }, [devBackup, files, history, generatedTexts, closeAllPopups, showToast]);

  const handleTestDevNotifications = useCallback(() => {
    setIsDevModeActive(true);
    try {
      safeSet('app_dev_mode', 'true');
    } catch {}
    setSearchQuery('');
    showToast('🔔 [Dev] Notificação 1: Áudio "A Arte da Guerra" salvo em MP3');
    setTimeout(() => {
      showToast('✨ [Dev] Notificação 2: Texto gerado e sincronizado com sucesso');
    }, 1400);
    setTimeout(() => {
      showToast('⚠️ [Dev] Notificação 3: 1 arquivo requer validação de idioma');
    }, 2800);
  }, [showToast]);

  const handleSimulateFullScreenError = useCallback(() => {
    setIsDevModeActive(true);
    try {
      safeSet('app_dev_mode', 'true');
    } catch {}
    setSearchQuery('');
    setDevCrashScreen(true);
  }, []);

  const devModeOptions = useMemo(() => [
    {
      title: 'Injetar Coleção Completa de Teste',
      desc: 'Adiciona audiobooks com capas e textos gerados para testar biblioteca, histórico e player.',
      icon: <BookOpen size={16} className="text-winblue shrink-0" />,
      onClick: handleInjectDevCollection,
    },
    {
      title: 'Simular Convertidos vazio (Zero-State)',
      desc: 'Limpa temporariamente o histórico para validar telas vazias, avisos e botões de atalho.',
      icon: <Trash2 size={16} className="text-amber-400 shrink-0" />,
      onClick: handleToggleDevZeroState,
    },
    {
      title: 'Simular Fila de Conversão em Andamento',
      desc: 'Injeta 3 e-books e ativa o processamento animado com progresso e etapas no Conversor.',
      icon: <RefreshCw size={16} className="text-sky-400 shrink-0" />,
      onClick: handleSimulateConversionQueue,
    },
    {
      title: 'Simular Conversão Concluída com Sucesso',
      desc: 'Ativa a tela de conclusão de conversão com estatísticas e botões de reprodução rápida.',
      icon: <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />,
      onClick: handleSimulateConversionCompleted,
    },
    {
      title: 'Simular Falha na Conversão (Erro de TTS)',
      desc: 'Adiciona um arquivo com falha para validar badges de erro, alertas e tratativas visuais.',
      icon: <AlertCircle size={16} className="text-rose-400 shrink-0" />,
      onClick: handleSimulateConversionError,
    },
    {
      title: 'Exibir Tela de Boas-Vindas (Onboarding)',
      desc: 'Abre a tela de boas-vindas inicial para testes de primeira abertura sem apagar dados.',
      icon: <Sparkles size={16} className="text-amber-300 shrink-0" />,
      onClick: handleShowWelcomeModal,
    },
    {
      title: 'Exibir Modal de Setup Obrigatório',
      desc: 'Abre o modal de configuração inicial para escolha de tipo de arquivo e voz padrão.',
      icon: <SettingsIcon size={16} className="text-indigo-400 shrink-0" />,
      onClick: handleShowInitialConfigModal,
    },
    {
      title: 'Simular Abertura Pela Primeira Vez',
      desc: 'Reseta o estado (fila vazia, sem histórico, sem pesquisas e onboarding aberto), simulando o app recém-instalado.',
      icon: <RotateCcw size={16} className="text-cyan-400 shrink-0" />,
      onClick: handleSimulateFirstLaunch,
    },
    {
      title: 'Disparar Notificações de Teste',
      desc: 'Emite avisos e notificações sequenciais para testar o sistema de alertas e responsividade.',
      icon: <Bell size={16} className="text-yellow-400 shrink-0" />,
      onClick: handleTestDevNotifications,
    },
    {
      title: 'Simular Tela de Erro Crítico (Crash Screen)',
      desc: 'Dispara a tela de erro em tela cheia para testar diagnóstico, cópia de detalhes e recuperação.',
      icon: <AlertTriangle size={16} className="text-red-500 shrink-0" />,
      onClick: handleSimulateFullScreenError,
    },
  ], [
    handleInjectDevCollection,
    handleToggleDevZeroState,
    handleSimulateConversionQueue,
    handleSimulateConversionCompleted,
    handleSimulateConversionError,
    handleShowWelcomeModal,
    handleShowInitialConfigModal,
    handleSimulateFirstLaunch,
    handleTestDevNotifications,
    handleSimulateFullScreenError
  ]);

  const currentScreenTitle = useMemo(() => {
    switch (currentScreen) {
      case 'converter': return t.converter;
      case 'search': return t.search;
      case 'history': return t.history;
      case 'history-audiobooks': return t.myAudiobooks;
      case 'history-texts': return t.myTexts;
      case 'other-apps': return t.otherApps;
      case 'help': return t.help;
      case 'help-topic': return HELP_TOPICS.find(tp => tp.id === helpTopicId)?.title || t.help;
      case 'settings': return t.settings;
      case 'settings-interface': return 'Interface';
      case 'settings-conversion': return 'Conversão de áudio';
      case 'settings-storage': return t.storageAndFolders;
      case 'settings-about': return 'Sistema e sobre';
      case 'edit-audiobook': return editingFileId ? 'Editar opções da obra' : 'Editar audiobook';
      case 'edit-text': return 'Editar texto';
      default: return t.appName;
    }
  }, [currentScreen, t, editingFileId]);

  const getPreviousScreenTitle = useCallback((): string => {
    if (historyStack.length > 0) {
      const prev = historyStack[historyStack.length - 1];
      switch (prev) {
        case 'converter': return t.converter;
        case 'search': return t.search;
        case 'history': return t.history;
        case 'history-audiobooks': return t.myAudiobooks;
        case 'history-texts': return t.myTexts;
        case 'other-apps': return t.otherApps;
        case 'help': return t.help;
        case 'settings': return t.settings;
        case 'settings-interface': return 'Interface';
        case 'settings-conversion': return 'Conversão de áudio';
        case 'settings-storage': return t.storageAndFolders;
        case 'settings-about': return 'Sistema e sobre';
        case 'edit-audiobook': return 'Editar audiobook';
        case 'edit-text': return 'Editar texto';
        default: return t.back;
      }
    }
    if (currentScreen === 'edit-audiobook') return editingFileId ? t.converter : t.history;
    if (currentScreen === 'history-audiobooks' || currentScreen === 'history-texts' || currentScreen === 'edit-text') return t.history;
    if (currentScreen.startsWith('settings-')) return t.settings;
    if (currentScreen === 'help-topic') return t.help;
    return t.back;
  }, [historyStack, currentScreen, t]);

  // Todas as vozes (o card e a edição mostram só as do idioma do livro)
  const availableVoices = VOICES;


  // ----- Ações do cabeçalho: um botão redondo por ação (a ação principal fica à direita) -----
  const headerActions = ((): HeaderAction[] => {
    const actions: HeaderAction[] = [];

    if (currentScreen === 'edit-audiobook') {
      const canSaveEdits = Boolean(editBookTitle.trim() && editBookAuthor.trim());
      actions.push({ id: 'cancel-edit', icon: <X size={15} />, text: 'Cancelar', label: 'Cancelar edição', onClick: () => handleCancelBookEdits() });
      actions.push({
        id: 'save', icon: <Check size={15} />, text: 'Salvar', label: 'Salvar alterações', tone: canSaveEdits ? 'accent' : 'default',
        onClick: () => canSaveEdits ? handleSaveBookEdits() : showToast('Preencha o título e o autor obrigatórios para salvar'),
      });
    } else if (currentScreen === 'edit-text') {
      actions.push({ id: 'cancel-edit', icon: <X size={15} />, text: 'Cancelar', label: 'Cancelar edição', onClick: () => handleCancelTextEdits() });
      actions.push({ id: 'save', icon: <Check size={15} />, text: 'Salvar', label: 'Salvar alterações', tone: 'accent', onClick: () => handleSaveTextEdits() });
    } else if (currentScreen.startsWith('settings')) {
      actions.push({
        id: 'reset-settings', icon: <RotateCcw size={16} />, label: 'Restaurar ajustes',
        confirm: {
          title: 'Restaurar Ajustes?',
          description: 'Todas as preferências visuais, tema e diretórios serão redefinidos para os valores padrões.',
          confirmLabel: 'Restaurar',
          icon: <RotateCcw size={13} />,
          onConfirm: () => {
            ['app_theme_mode', 'app_accent_color', 'app_font_size', 'app_interface_lang', 'app_default_voice', 'file_type_option', 'sync_text_destination', 'audio_quality']
              .forEach(key => removeKey(key));
            setThemeMode('system');
            setAccentColor('blue');
            setUiFontSize('standard');
            setInterfaceLang('pt-BR');
            setDefaultVoice('pt-BR-AntonioNeural');
            setFileTypeOption('m4b');
            setSyncTextDestination('both');
            setSyncTextGranularity('sentences');
            setAudioQuality('high');
            showToast("Ajustes restaurados com sucesso!");
          },
        },
      });
      actions.push({
        id: 'close-app', icon: <Power size={16} />, label: t.closeApp, danger: true,
        confirm: {
          title: 'Fechar o Aplicativo?',
          description: 'Todas as suas conversões e histórico estão salvos com segurança no seu disco local.',
          confirmLabel: t.closeApp,
          icon: <Power size={13} />,
          onConfirm: () => {
            if ((window as any).electron) {
              (window as any).electron.closeApp();
            } else {
              window.close();
              showToast("Você pode fechar esta aba no seu navegador.");
            }
          },
        },
      });
    } else if (currentScreen === 'history' || currentScreen === 'history-audiobooks' || currentScreen === 'history-texts') {
      if (selectingConverted) {
        // Seleção: Cancelar e Excluir (com confirmação nascendo do botão)
        const n = selectedConverted.length;
        // Itens marcados, com capa, para a lista do pop-up de confirmação
        const selectedItems: ConfirmItem[] = selectedConverted.flatMap((key): ConfirmItem[] => {
          if (key.startsWith('book:')) {
            const b = history.find(h => h.id === key.slice(5));
            return b ? [{ id: key, title: b.title, subtitle: b.author, cover: b.customCover || b.cover || getGenericBookCover(b.title, b.author, b.coverColor) }] : [];
          }
          const tx = generatedTexts.find(g => g.id === key.slice(5));
          return tx ? [{ id: key, title: tx.title, subtitle: tx.author || tx.genre, cover: tx.cover || getGenericTextCover(tx.title, tx.author, tx.coverColor), shape: 'square' }] : [];
        });
        actions.push({ id: 'cancel-select', icon: <X size={15} />, text: 'Cancelar', label: 'Cancelar seleção', onClick: () => exitConvertedSelection() });
        actions.push({
          id: 'delete-selected', icon: <Trash2 size={15} />, text: n > 0 ? `Excluir (${n})` : 'Excluir', label: 'Excluir selecionados',
          tone: 'danger', disabled: n === 0,
          confirm: {
            title: n === 1 ? 'Excluir 1 item?' : `Excluir ${n} itens?`,
            description: 'Os itens saem de Convertidos e os arquivos de áudio e de texto vão para a Lixeira do computador.',
            content: <ConfirmItemList items={selectedItems} />,
            estimatedHeight: 150 + Math.min(selectedItems.length, 4) * 56,
            confirmLabel: 'Excluir',
            onConfirm: () => deleteSelectedConverted(),
          },
        });
      } else {
        actions.push({ id: 'sort', icon: <ArrowUpDown size={16} />, label: t.sortBy || 'Ordenar por', open: Boolean(sortMenuAnchor), onClick: (anchor) => setSortMenuAnchor(anchor) });
        if (history.length + generatedTexts.length > 0) {
          actions.push({ id: 'select-converted', icon: <Trash2 size={16} />, label: 'Selecionar para excluir', tone: 'danger', onClick: () => { setSelectedConverted([]); setSelectingConverted(true); } });
        }
      }
    } else if (currentScreen === 'converter') {
      // Pendentes: os carregados que ainda não foram convertidos
      const pendingFiles = phase === 2 ? files.filter(f => f.status === 'idle') : files;
      if (files.length > 0) {
        actions.push({ id: 'add-files', icon: <Upload size={16} />, label: t.addFiles || 'Adicionar arquivos', onClick: () => fileInputRef.current?.click() });
      }
      // Converter só aparece com pelo menos um e-book ainda não convertido
      if (pendingFiles.length > 0) {
        actions.push({
          id: 'convert', icon: <AiStarsIcon size={15} />, text: 'Converter',
          label: pendingFiles.length > 1 ? `Converter ${pendingFiles.length} e-books` : 'Converter e-book',
          tone: 'accent',
          onClick: () => handleStartConversion(),
        });
      }
    }

    if (isDevModeActive) {
      actions.unshift({ id: 'exit-dev', icon: <Code2 size={16} />, label: t.exitDevMode, tone: 'warning', onClick: () => handleExitDevMode() });
    }
    return actions;
  })();

  // ----- Abas e menu lateral -----
  const selectRoot = (id: string) => {
    if (id === 'history') setHistoryNotificationBadge(null);
    navigateTo(id as ScreenId);
    if (id === 'search' && !isMobile) setTimeout(() => searchInputRef.current?.focus(), 80);
  };
  const historyBadge = (
    <AnimatePresence>
      {historyNotificationBadge && (
        <motion.div
          key={historyNotificationBadge.id}
          initial={{ opacity: 0, scale: 0.25, x: 12 }}
          animate={{ opacity: 1, scale: 1, x: 0 }}
          exit={{ opacity: 0, scale: 0.25, x: 12, transition: { duration: 0.2, ease: "easeIn" } }}
          transition={{ type: "spring", stiffness: 550, damping: 25, mass: 0.45 }}
          className="relative flex items-center shrink-0 ml-auto"
          title={`Adicionado a Convertidos: ${historyNotificationBadge.title}`}
        >
          <div className="relative w-6 h-8 rounded-[5px] overflow-hidden shadow-[0_4px_12px_rgba(0,0,0,0.3)] border border-white/15 bg-black/20 shrink-0">
            <img src={historyNotificationBadge.coverUrl} alt={historyNotificationBadge.title} className="w-full h-full object-cover" />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
  const showBack = historyStack.length > 0;

  return {
    helpTopicId,
    openHelpTopic,
    audioQuality,
    setAudioQuality,
    syncTextDestination,
    setSyncTextDestination,
    syncingBookIds,
    syncTextInputRef,
    handleGenerateBookText,
    handlePickBookTextFile,
    handleSyncTextFileChosen,
    mainScrollRef,
    isMobile,
    activeScreen,
    navStack,
    navTo,
    goBack,
    currentScreen,
    historyStack,
    activeScreenKey,
    activeScreenKeyRef,
    currentRoot,
    navigateTo,
    navigateBack,
    accentPalette,
    accentColor,
    setAccentColor,
    themeMode,
    setThemeMode,
    resolvedTheme,
    setResolvedTheme,
    uiFontSize,
    setUiFontSize,
    interfaceLang,
    setInterfaceLang,
    t,
    toastMessage,
    setToastMessage,
    toastTimeoutRef,
    showToast,
    headerBlurRef,
    lastScrollTopRef,
    isTitleScrolledPast,
    setIsTitleScrolledPast,
    setHeaderBlurProgress,
    playingSnippet,
    setPlayingSnippet,
    snippetHowlRef,
    toggleSnippet,
    playingVoiceCode,
    setPlayingVoiceCode,
    voiceHowlRef,
    toggleVoiceSample,
    phase,
    setPhase,
    files,
    setFiles,
    fileInputRef,
    coverColorsMap,
    setCoverColorsMap,
    outputFolder,
    setOutputFolder,
    handleSelectOutputFolder,
    handleRetryAllFailed,
    syncTextGranularity,
    setSyncTextGranularity,
    ensureOutputFolder,
    openOutputFolder,
    handleClearCache,
    defaultVoice,
    setDefaultVoice,
    fileTypeOption,
    setFileTypeOption,
    history,
    setHistory,
    generatedTexts,
    setGeneratedTexts,
    recentSearches,
    setRecentSearches,
    showDeleteSearchHistoryConfirm,
    setShowDeleteSearchHistoryConfirm,
    addToSearchHistory,
    showWelcomeModal,
    setShowWelcomeModal,
    showInitialConfigModal,
    setShowInitialConfigModal,
    showDuplicateModal,
    setShowDuplicateModal,
    duplicateFileTitle,
    setDuplicateFileTitle,
    showTranslationModal,
    setShowTranslationModal,
    foreignLangFile,
    setForeignLangFile,
    translationAnchor,
    setTranslationAnchor,
    selectedVoice,
    setSelectedVoice,
    conversionAnchor,
    setConversionAnchor,
    showCancelModal,
    setShowCancelModal,
    cancelModalAnchor,
    setCancelModalAnchor,
    showClearHistoryModal,
    setShowClearHistoryModal,
    showResetSettingsConfirm,
    setShowResetSettingsConfirm,
    showCloseAppModal,
    setShowCloseAppModal,
    viewingTextModal,
    setViewingTextModal,
    viewingTextAnchor,
    setViewingTextAnchor,
    historyNotificationBadge,
    setHistoryNotificationBadge,
    triggerHistoryCoverBadge,
    editingCoverFileId,
    setEditingCoverFileId,
    coverFileInputRef,
    handleOpenMetadataModal,
    handleCoverUpload,
    generateSyncTextDefault,
    setGenerateSyncTextDefault,
    activeSettingSelector,
    setActiveSettingSelector,
    selectorMode,
    setSelectorMode,
    selectorDirection,
    setSelectorDirection,
    selectorInputValue,
    setSelectorInputValue,
    activeNavGroupId,
    setActiveNavGroupId,
    isManualScrollingRef,
    sortBy,
    setSortBy,
    sortMenuTimeoutRef,
    handleSelectSort,
    getHistoryItemDurationSeconds,
    getHistoryItemYear,
    getGeneratedTextYear,
    audiobooksNavGroups,
    textsNavGroups,
    handleScrollToGroup,
    activeBookMenu,
    setActiveBookMenu,
    activeTextMenu,
    setActiveTextMenu,
    sortMenuAnchor,
    setSortMenuAnchor,
    searchInputRef,
    editingBook,
    setEditingBook,
    editingFileId,
    setEditingFileId,
    editBookTitle,
    setEditBookTitle,
    editBookAuthor,
    setEditBookAuthor,
    editBookCategory,
    setEditBookCategory,
    editBookSubgenre,
    setEditBookSubgenre,
    editBookNarrator,
    setEditBookNarrator,
    editBookLanguage,
    setEditBookLanguage,
    editBookYear,
    setEditBookYear,
    editBookVoice,
    setEditBookVoice,
    editBookFileType,
    setEditBookFileType,
    editBookGenerateSyncText,
    setEditBookGenerateSyncText,
    editBookRequiresTranslation,
    setEditBookRequiresTranslation,
    editBookCover,
    setEditBookCover,
    editCoverColor,
    setEditCoverColor,
    editBookDescription,
    setEditBookDescription,
    editBookChapters,
    setEditBookChapters,
    editBookPronunciationMap,
    setEditBookPronunciationMap,
    pronOrigInput,
    setPronOrigInput,
    pronRepInput,
    setPronRepInput,
    previewChapter,
    setPreviewChapter,
    previewChapterAnchor,
    setPreviewChapterAnchor,
    editBookHasTranscript,
    setEditBookHasTranscript,
    editBookTranscriptFileName,
    setEditBookTranscriptFileName,
    editBookCoverInputRef,
    editBookTranscriptInputRef,
    pronTagsScrollRef,
    isDraggingPronTags,
    pronStartX,
    pronScrollLeftPos,
    handlePronMouseDown,
    handlePronMouseLeaveOrUp,
    handlePronMouseMove,
    handleStartEditFile,
    handleStartEditBook,
    handleSaveBookEdits,
    handleCancelBookEdits,
    handleSplitLongChapter,
    editingText,
    setEditingText,
    editTextTitle,
    setEditTextTitle,
    editTextAuthor,
    setEditTextAuthor,
    editTextColor,
    setEditTextColor,
    editTextGenre,
    setEditTextGenre,
    editTextTone,
    setEditTextTone,
    editTextContent,
    setEditTextContent,
    handleStartEditText,
    handleSaveTextEdits,
    handleCancelTextEdits,
    closeAllPopups,
    handleDeleteHistoryItem,
    selectingConverted,
    selectedConverted,
    toggleConvertedSelection,
    exitConvertedSelection,
    handleDeleteGeneratedText,
    handleFileUpload,
    handleStartConversion,
    proceedWithConversion,
    handleCancelProcessing,
    handleRetryFile,
    sendGeneratedTextToConverter,
    searchQuery,
    setSearchQuery,
    computedSearchResults,
    isDevModeActive,
    setIsDevModeActive,
    devBackup,
    setDevBackup,
    devCrashScreen,
    setDevCrashScreen,
    devShowStack,
    setDevShowStack,
    handleExitDevMode,
    handleInjectDevCollection,
    handleToggleDevZeroState,
    handleSimulateConversionQueue,
    handleSimulateConversionCompleted,
    handleSimulateConversionError,
    handleShowWelcomeModal,
    handleShowInitialConfigModal,
    handleSimulateFirstLaunch,
    handleTestDevNotifications,
    handleSimulateFullScreenError,
    devModeOptions,
    currentScreenTitle,
    getPreviousScreenTitle,
    availableVoices,
    headerActions,
    selectRoot,
    estimateConversion,
    historyBadge,
    historyBadgeActive: Boolean(historyNotificationBadge),
    showBack,
  };
}

export type AppState = ReturnType<typeof useAppState>;
