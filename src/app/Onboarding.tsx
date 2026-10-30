// ===== Primeira abertura =====
// Boas-vindas (símbolo, nome, idioma e dois caminhos: ir direto para o app ou configurar) e a
// configuração inicial em páginas por tipo: Interface, Conversão e Armazenamento e pastas.
// Cada página mostra grupos de opções em card; tudo o que é escolhido aqui vale para o app na hora.
// Se a pasta de salvamento não for escolhida, o app cria uma (Documentos/Audiobook Generator).
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowRight, Check, ChevronDown, ChevronLeft, ChevronRight, FolderOpen, Globe, Monitor, Moon, Sun, Mic, FileText,
  FolderTree, Palette, Type, AArrowDown, AArrowUp, FileAudio2, CopyCheck, ExternalLink, X, Info,
  Sparkles, Settings2, HardDrive, Volume2, Play, Pause, AlignLeft, WholeWord, Rows3,
} from 'lucide-react';
import { LuBookAudio } from 'react-icons/lu';
import { AmbientOrbs } from '../components/AmbientOrbs';
import { AppGlyph } from '../components/AppGlyph';
import { useApp } from './AppContext';
import { VOICES, voicesFor, hasSample, languageNamePt } from '../data/voices';
import { AUDIO_FORMATS, AUDIO_QUALITIES, type AudioQuality } from './audioFormats';
import { audioFormatIcon, audioQualityIcon } from './audioFormatIcons';
import type { SyncTextDestination, SyncTextGranularity } from './types';

const LANGUAGES = [
  { value: 'pt-BR', label: 'Português (Brasil)', flag: '🇧🇷' },
  { value: 'en-US', label: 'English (US)', flag: '🇺🇸' },
  { value: 'es-ES', label: 'Español (ES)', flag: '🇪🇸' },
  { value: 'ar-SA', label: 'العربية (SA)', flag: '🇸🇦' },
  { value: 'ru-RU', label: 'Русский', flag: '🇷🇺' },
];
const THEMES = [
  { value: 'system', label: 'Modo do sistema', description: 'Acompanha o tema do computador', icon: <Monitor size={16} /> },
  { value: 'light', label: 'Claro', description: 'Fundo claro o tempo todo', icon: <Sun size={16} /> },
  { value: 'dark', label: 'Escuro', description: 'Fundo escuro o tempo todo', icon: <Moon size={16} /> },
];
const FONT_SIZES = [
  { value: 'small', label: 'Pequena', description: 'Textos compactos, a 85%', icon: <AArrowDown size={16} /> },
  { value: 'standard', label: 'Padrão', description: 'Tamanho normal do app', icon: <Type size={16} /> },
  { value: 'large', label: 'Grande', description: 'Textos ampliados, a 118%', icon: <AArrowUp size={16} /> },
];
const DESTINATIONS: { value: SyncTextDestination; label: string; description: string; icon: React.ReactNode }[] = [
  { value: 'metadata', label: 'Metadados do audiobook', description: 'Grava o texto dentro do arquivo de áudio', icon: <FileAudio2 size={16} /> },
  { value: 'library', label: 'Pasta da biblioteca', description: 'Salva .lrc, .srt e .sync.json ao lado do áudio', icon: <FolderOpen size={16} /> },
  { value: 'both', label: 'Ambos', description: 'Grava no audiobook e salva na biblioteca', icon: <CopyCheck size={16} /> },
];

const GRANULARITIES: { value: SyncTextGranularity; label: string; description: string; icon: React.ReactNode }[] = [
  { value: 'sentences', label: 'Frases', description: 'Uma linha por frase', icon: <AlignLeft size={16} /> },
  { value: 'words', label: 'Palavras', description: 'Cada palavra com seu próprio tempo', icon: <WholeWord size={16} /> },
  { value: 'both', label: 'Frases e palavras', description: 'Frases, com o tempo de cada palavra dentro delas', icon: <Rows3 size={16} /> },
];

type PageId = 'welcome' | 'interface' | 'conversion' | 'text' | 'storage';
const PAGES: { id: PageId; name: string; title: string; subtitle: string; icon: React.ReactNode }[] = [
  { id: 'welcome', name: 'Boas-vindas', title: '', subtitle: '', icon: null },
  { id: 'interface', name: 'Interface', title: 'Interface', subtitle: 'Aparência do app. Tudo pode ser mudado depois em Ajustes.', icon: <Settings2 size={22} /> },
  { id: 'conversion', name: 'Conversão', title: 'Conversão', subtitle: 'Padrões dos novos audiobooks. Cada e-book ainda pode ter voz e formato próprios.', icon: <Sparkles size={22} /> },
  { id: 'text', name: 'Texto', title: 'Texto', subtitle: 'Texto sincronizado com o áudio, para ler enquanto ouve.', icon: <FileText size={22} /> },
  { id: 'storage', name: 'Armazenamento e pastas', title: 'Armazenamento e pastas', subtitle: 'Onde os audiobooks convertidos ficam salvos no seu computador.', icon: <HardDrive size={22} /> },
];

const PAGE_MOTION = {
  initial: (dir: number) => ({ opacity: 0, x: dir * 28 }),
  animate: { opacity: 1, x: 0, transition: { type: 'spring' as const, stiffness: 380, damping: 36, mass: 0.7 } },
  exit: (dir: number) => ({ opacity: 0, x: dir * -28, transition: { duration: 0.14 } }),
};

const pill = "h-8 pl-3.5 pr-2.5 rounded-full bg-card/75 backdrop-blur-3xl border border-[var(--text-main)]/10 shadow-sm text-[var(--text-main)] hover:bg-white/15 hover:border-white/25 hover:shadow-[0_0_12px_rgba(255,255,255,0.2)] flex items-center gap-1.5 text-xs font-semibold transition-all shrink-0 cursor-pointer [&_svg]:text-inherit";
const secondaryBtn = "h-11 px-5 rounded-full bg-card/75 backdrop-blur-3xl border border-[var(--text-main)]/10 text-[var(--text-main)] hover:bg-white/15 hover:border-white/25 hover:shadow-[0_0_15px_rgba(255,255,255,0.25)] text-sm font-semibold flex items-center gap-2 transition-all cursor-pointer [&_svg]:text-inherit";
const primaryBtn = "h-11 px-5 rounded-full bg-winblue/20 border border-winblue/45 text-winblue hover:bg-winblue/30 hover:border-winblue/75 hover:shadow-[0_0_20px_rgba(var(--winblue-rgb),0.4)] text-sm font-semibold flex items-center gap-2 transition-all cursor-pointer [&_svg]:text-inherit";

// Grupo de opções: subtítulo e descrição curta acima de um card com as opções em lista
function OptionGroup({ title, description, children, footer, grow }: { title: string; description: string; children: React.ReactNode; footer?: React.ReactNode; grow?: boolean }) {
  return (
    <section className={`flex flex-col gap-2.5 [@media(max-height:780px)]:gap-1.5 min-w-0 ${grow ? 'flex-1 min-h-0' : 'shrink-0'}`}>
      <div className="px-1 shrink-0">
        <h2 className="text-xl font-bold text-[var(--text-main)]">{title}</h2>
        <p className="text-xs text-[var(--text-muted)] mt-0.5 [@media(max-height:780px)]:hidden">{description}</p>
      </div>
      <div className={`rounded-[24px] bg-card/60 backdrop-blur-xl border border-[var(--text-main)]/10 p-1 flex flex-col gap-0.5 ${grow ? 'flex-1 min-h-0' : ''}`}>
        {children}
        {footer}
      </div>
    </section>
  );
}

// Uma opção: ícone em círculo, nome, descrição e a marca de selecionado
function OptionRow({ icon, label, description, selected, onClick, sampleCode }: { icon: React.ReactNode; label: string; description?: string; selected: boolean; onClick: () => void; sampleCode?: string }) {
  const { playingVoiceCode, toggleVoiceSample } = useApp();
  const tocando = Boolean(sampleCode) && playingVoiceCode === sampleCode;
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileTap={{ scale: 0.985 }}
      aria-pressed={selected}
      className={`group w-full shrink-0 flex items-center gap-3 px-3 py-2 [@media(max-height:780px)]:py-1.5 rounded-[20px] text-left transition-colors cursor-pointer ${selected ? 'bg-winblue/12' : 'hover:bg-[var(--text-main)]/[0.05]'}`}
    >
      <span className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-colors [&_svg]:shrink-0 ${selected ? 'bg-winblue/20 text-winblue' : 'bg-[var(--text-main)]/[0.07] text-[var(--text-main)]/75'}`}>
        {icon}
      </span>
      <span className="flex flex-col min-w-0 flex-1">
        <span className={`text-sm font-semibold truncate ${selected ? 'text-winblue' : 'text-[var(--text-main)]'}`}>{label}</span>
        {description && <span className="text-xs text-[var(--text-muted)] truncate [@media(max-height:780px)]:hidden">{description}</span>}
      </span>
      {sampleCode && (
        <span
          role="button"
          tabIndex={-1}
          title={tocando ? 'Parar amostra' : 'Ouvir amostra'}
          onClick={(e) => toggleVoiceSample(e, sampleCode)}
          className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-all cursor-pointer border ${tocando ? 'opacity-100 bg-winblue/20 border-winblue/45 text-winblue' : 'opacity-0 group-hover:opacity-100 bg-card/80 border-[var(--text-main)]/15 text-[var(--text-main)] hover:bg-white/20 hover:border-white/35'}`}
        >
          {tocando ? <Pause size={12} fill="currentColor" /> : <Play size={12} fill="currentColor" className="ml-px" />}
        </span>
      )}
      <span className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 transition-all ${selected ? 'bg-winblue text-white scale-100' : 'border border-[var(--text-main)]/20 scale-90'}`}>
        {selected && <Check size={12} strokeWidth={3} />}
      </span>
    </motion.button>
  );
}

export function Onboarding() {
  const {
    showWelcomeModal, setShowWelcomeModal, setShowInitialConfigModal, setActiveSettingSelector, activeSettingSelector,
    interfaceLang, setInterfaceLang, themeMode, setThemeMode, accentPalette, accentColor, setAccentColor, uiFontSize, setUiFontSize,
    defaultVoice, setDefaultVoice, fileTypeOption, setFileTypeOption, audioQuality, setAudioQuality,
    generateSyncTextDefault, setGenerateSyncTextDefault, syncTextDestination, setSyncTextDestination, syncTextGranularity, setSyncTextGranularity,
    outputFolder, handleSelectOutputFolder, ensureOutputFolder, openOutputFolder, toastMessage,
  } = useApp();

  const [page, setPage] = useState(() => (showWelcomeModal ? 0 : 1));
  const [direction, setDirection] = useState(1);
  const [allVoices, setAllVoices] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const current = PAGES[page];

  const goTo = (next: number) => {
    setDirection(next > page ? 1 : -1);
    setPage(next);
    if (next > 0) {
      try { localStorage.setItem('has_seen_welcome_v3', 'true'); } catch {}
    }
  };

  // Concluir (ou pular tudo): garante a pasta de salvamento, marca a primeira abertura como feita e entra no app
  const finish = async () => {
    if (finishing) return;
    setFinishing(true);
    await ensureOutputFolder();
    try {
      localStorage.setItem('has_seen_welcome_v3', 'true');
      localStorage.setItem('has_seen_initial_config_v3', 'true');
    } catch {}
    setShowWelcomeModal(false);
    setShowInitialConfigModal(false);
  };

  const language = LANGUAGES.find(l => l.value === interfaceLang) || LANGUAGES[0];
  const languageSelector = (e: React.MouseEvent<HTMLElement>) => {
    e.stopPropagation();
    setActiveSettingSelector({
      hideTitle: true,
      id: 'ob-lang',
      triggerEl: e.currentTarget,
      title: 'Idioma',
      currentValue: interfaceLang,
      options: LANGUAGES.map(l => ({ value: l.value, label: l.label, icon: <span className="text-sm leading-none">{l.flag}</span> })),
      onSelect: setInterfaceLang,
    });
  };

  // Vozes do idioma da interface primeiro; as demais só quando o usuário pede
  const ownVoices = voicesFor(interfaceLang.slice(0, 2));
  const uiCode = interfaceLang.slice(0, 2);
  const allSorted = [...VOICES].sort((a, b) => a.lang === b.lang ? 0 : a.lang === uiCode ? -1 : b.lang === uiCode ? 1 : languageNamePt(a.lang).localeCompare(languageNamePt(b.lang), 'pt-BR'));
  const shownVoices = allVoices || ownVoices.length === VOICES.length ? allSorted : (() => {
    const list = [...ownVoices];
    const chosen = VOICES.find(v => v.code === defaultVoice);
    if (chosen && !list.includes(chosen)) list.unshift(chosen);
    return list;
  })();

  return (
    <div className="app-shell fixed inset-0 isolate bg-mica text-main font-fluent select-none overflow-hidden">
      {/* Cores do ícone se movendo ao fundo */}
      <AmbientOrbs className="fixed" intensity={0.75} />
      {/* Avisos no topo, ao centro (como no cabeçalho do app) */}
      <div className="fixed top-[var(--app-header-top)] inset-x-0 flex justify-center z-[9000] pointer-events-none">
        <AnimatePresence>
          {toastMessage && (
            <motion.div
              key="toast"
              role="status"
              initial={{ opacity: 0, y: -10, scale: 0.92 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.92 }}
              className="h-9 max-w-[480px] px-4 rounded-full bg-card/90 backdrop-blur-3xl border border-[var(--button-secondary-bg)] shadow-xl text-xs font-semibold text-[var(--text-main)] flex items-center gap-2"
            >
              <Check size={15} className="shrink-0" />
              <span className="truncate">{toastMessage}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence mode="wait" custom={direction}>
        {current.id === 'welcome' ? (
          <motion.div
            key="welcome"
            custom={direction}
            variants={PAGE_MOTION}
            initial="initial"
            animate="animate"
            exit="exit"
            className="h-full w-full max-w-xl mx-auto px-8 py-10 flex flex-col items-center justify-center text-center"
          >
            {/* Símbolo sem fundo, como no menu lateral, com o nome embaixo */}
            <AppGlyph size={96} className="text-[var(--text-main)] drop-shadow-[0_14px_30px_rgba(0,0,0,0.35)]" />
            <div className="mt-4 text-2xl text-[var(--text-main)] whitespace-nowrap">
              <span className="font-bold">Audiobook</span><span className="font-normal">Generator</span>
            </div>

            <h1 className="mt-10 text-4xl md:text-5xl font-semibold tracking-tight text-[var(--text-main)]">Bem-vindo!</h1>
            <p className="mt-3 text-sm sm:text-base leading-relaxed text-[var(--text-muted)] max-w-md">
              Transforme e-books e textos em audiobooks narrados por vozes neurais, com capítulos, tradução e texto sincronizado.
            </p>

            <div className="mt-9 w-full settings-list-row py-3 px-4 rounded-[32px] bg-card/60 backdrop-blur-xl border border-[var(--text-main)]/10 flex items-center justify-between gap-4 text-left">
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-10 h-10 rounded-full bg-winblue/10 text-winblue flex items-center justify-center shrink-0"><Globe size={20} /></div>
                <div className="flex flex-col min-w-0">
                  <span className="font-semibold text-base text-[var(--text-main)] truncate">Idioma</span>
                  <span className="text-xs text-[var(--text-muted)] mt-0.5 truncate">Idioma da interface do app</span>
                </div>
              </div>
              <motion.button
                whileHover={{ scale: 1.06 }}
                whileTap={{ scale: 0.94 }}
                animate={activeSettingSelector?.id === 'ob-lang' ? { scale: 1.22, opacity: 0, pointerEvents: 'none' } : { scale: 1, opacity: 1, pointerEvents: 'auto' }}
                onClick={languageSelector}
                className={pill}
              >
                <span>{language.flag} {language.label}</span>
                <ChevronDown size={14} className="-mr-0.5" />
              </motion.button>
            </div>

            <div className="mt-6 w-full grid grid-cols-2 gap-3">
              <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }} onClick={finish} className={`${secondaryBtn} justify-center`}>
                <ArrowRight size={16} />
                <span>Ir para o app</span>
              </motion.button>
              <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }} onClick={() => goTo(1)} className={`${primaryBtn} justify-center`}>
                <Settings2 size={16} />
                <span>Configurar agora</span>
              </motion.button>
            </div>

            <p className="mt-10 text-[11px] leading-relaxed text-[var(--text-muted)]/80 max-w-md">
              Feito para facilitar o acesso à literatura e promover acessibilidade. Não use o app para infringir direitos autorais.
              O autor não se responsabiliza pelas atividades do usuário.
            </p>
          </motion.div>
        ) : (
          <motion.div
            key={current.id}
            custom={direction}
            variants={PAGE_MOTION}
            initial="initial"
            animate="animate"
            exit="exit"
            className="h-full w-full max-w-4xl mx-auto px-8 pt-10 [@media(max-height:780px)]:pt-6 pb-6 flex flex-col"
          >
            <div className="flex items-center gap-4 mb-1.5 shrink-0">
              <div className="w-12 h-12 rounded-full bg-winblue/12 text-winblue flex items-center justify-center shrink-0">{current.icon}</div>
              <h1 className="text-4xl md:text-5xl font-semibold tracking-tight text-[var(--text-main)]">{current.title}</h1>
            </div>
            <p className="text-sm text-[var(--text-muted)] mb-7 [@media(max-height:780px)]:mb-4 max-w-2xl shrink-0">{current.subtitle}</p>
            <div className="flex-1 min-h-0">

            {current.id === 'interface' && (
              <div className="h-full grid grid-cols-2 gap-x-5 gap-y-5 [@media(max-height:780px)]:gap-y-3 content-start">
                <OptionGroup title="Tema" description="Aparência clara, escura ou igual à do computador.">
                  {THEMES.map(o => (
                    <OptionRow key={o.value} icon={o.icon} label={o.label} description={o.description} selected={themeMode === o.value} onClick={() => setThemeMode(o.value as any)} />
                  ))}
                </OptionGroup>
                <OptionGroup title="Tamanho da fonte" description="Tamanho dos textos em todo o app.">
                  {FONT_SIZES.map(o => (
                    <OptionRow key={o.value} icon={o.icon} label={o.label} description={o.description} selected={uiFontSize === o.value} onClick={() => setUiFontSize(o.value as any)} />
                  ))}
                </OptionGroup>
                <div className="col-span-2">
                  <OptionGroup title="Cor de destaque" description="Cor dos botões, seleções e detalhes.">
                    <div className="grid grid-cols-3 gap-0.5">
                      {Object.entries(accentPalette).map(([key, item]) => (
                        <OptionRow
                          key={key}
                          icon={<span className="w-4 h-4 rounded-full border border-black/10 dark:border-white/20" style={{ backgroundColor: item.hex }} />}
                          label={item.name}
                          selected={accentColor === key}
                          onClick={() => setAccentColor(key)}
                        />
                      ))}
                    </div>
                  </OptionGroup>
                </div>
              </div>
            )}

            {current.id === 'conversion' && (
              <div className="h-full grid grid-cols-2 gap-x-5 gap-y-5 [@media(max-height:780px)]:gap-y-3 content-start">
                <div className="flex flex-col gap-5 min-w-0 min-h-0 h-full">
                  <OptionGroup
                    grow
                    title="Voz padrão"
                    description="Voz que narra os livros. Cada e-book pode usar outra."
                    footer={ownVoices.length > 0 && ownVoices.length < VOICES.length && (
                      <button
                        type="button"
                        onClick={() => setAllVoices(v => !v)}
                        className="shrink-0 mt-1 mx-3 mb-1.5 self-start text-xs font-semibold text-winblue hover:underline cursor-pointer"
                      >
                        {allVoices ? 'Mostrar só as vozes do meu idioma' : `Mostrar todas as vozes (${VOICES.length})`}
                      </button>
                    )}
                  >
                    <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar flex flex-col gap-0.5">
                      {shownVoices.map((v, i) => {
                        const [lang, rest] = v.label.split(' - ');
                        // Todas as vozes: um título por idioma
                        const novoIdioma = shownVoices.length > ownVoices.length && v.lang !== shownVoices[i - 1]?.lang;
                        return (
                          <React.Fragment key={v.code}>
                            {novoIdioma && (
                              <div className="px-3 pt-2.5 pb-1 text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">{languageNamePt(v.lang)}</div>
                            )}
                            <OptionRow
                              icon={<span className="text-base leading-none">{v.flag}</span>}
                              label={rest || v.label}
                              description={lang}
                              selected={defaultVoice === v.code}
                              onClick={() => setDefaultVoice(v.code)}
                              sampleCode={hasSample(v.code) ? v.code : undefined}
                            />
                          </React.Fragment>
                        );
                      })}
                    </div>
                  </OptionGroup>
                </div>
                <div className="flex flex-col gap-5 [@media(max-height:780px)]:gap-3 min-w-0">
                  <OptionGroup title="Formato" description="Tipo de arquivo dos audiobooks gerados.">
                    {AUDIO_FORMATS.map(f => (
                      <OptionRow
                        key={f.value}
                        icon={audioFormatIcon(f.value, 16)}
                        label={f.label}
                        description={f.description}
                        selected={(fileTypeOption === 'ask' ? 'm4b' : fileTypeOption) === f.value}
                        onClick={() => setFileTypeOption(f.value as any)}
                      />
                    ))}
                  </OptionGroup>
                  <OptionGroup title="Qualidade de áudio" description="Mais qualidade gera arquivos maiores.">
                    {AUDIO_QUALITIES.map(q => (
                      <OptionRow key={q.value} icon={audioQualityIcon(q.value, 16)} label={q.label} description={q.description} selected={audioQuality === q.value} onClick={() => setAudioQuality(q.value as AudioQuality)} />
                    ))}
                  </OptionGroup>
                </div>
              </div>
            )}

            {current.id === 'text' && (
              <div className="h-full grid grid-cols-2 gap-x-5 gap-y-5 [@media(max-height:780px)]:gap-y-3 content-start">
                <OptionGroup title="Texto sincronizado" description="Texto que acompanha o áudio, frase a frase, no player.">
                  <OptionRow icon={<Check size={16} />} label="Sim" description="Gera o texto junto com o áudio" selected={generateSyncTextDefault} onClick={() => setGenerateSyncTextDefault(true)} />
                  <OptionRow icon={<X size={16} />} label="Não" description="Gera só o audiobook" selected={!generateSyncTextDefault} onClick={() => setGenerateSyncTextDefault(false)} />
                </OptionGroup>
                <motion.div animate={{ opacity: generateSyncTextDefault ? 1 : 0.4 }} className={generateSyncTextDefault ? '' : 'pointer-events-none'} aria-disabled={!generateSyncTextDefault}>
                  <OptionGroup title="Onde salvar o texto" description="Dentro do arquivo de áudio, ao lado dele ou nos dois.">
                    {DESTINATIONS.map(d => (
                      <OptionRow key={d.value} icon={d.icon} label={d.label} description={d.description} selected={syncTextDestination === d.value} onClick={() => setSyncTextDestination(d.value)} />
                    ))}
                  </OptionGroup>
                </motion.div>
                <motion.div animate={{ opacity: generateSyncTextDefault ? 1 : 0.4 }} className={generateSyncTextDefault ? '' : 'pointer-events-none'} aria-disabled={!generateSyncTextDefault}>
                  <OptionGroup title="Separação do texto" description="Destaque frase a frase, palavra por palavra ou nos dois níveis.">
                    {GRANULARITIES.map(g => (
                      <OptionRow key={g.value} icon={g.icon} label={g.label} description={g.description} selected={syncTextGranularity === g.value} onClick={() => setSyncTextGranularity(g.value)} />
                    ))}
                  </OptionGroup>
                </motion.div>
              </div>
            )}

            {current.id === 'storage' && (
              <div className="flex flex-col gap-6 max-w-3xl">
                <OptionGroup title="Pasta de salvamento" description="Onde os audiobooks e textos ficam no computador.">
                  <div className="flex items-center justify-between gap-4 px-3 py-2.5">
                    <div className="flex items-center gap-3.5 min-w-0">
                      <span className="w-9 h-9 rounded-full bg-winblue/20 text-winblue flex items-center justify-center shrink-0"><FolderOpen size={16} /></span>
                      <span className="flex flex-col min-w-0">
                        <span className="text-sm font-semibold text-[var(--text-main)]">{outputFolder ? 'Pasta escolhida' : 'Nenhuma pasta escolhida'}</span>
                        <span className="text-xs text-[var(--text-muted)] truncate mt-0.5" title={outputFolder}>
                          {outputFolder || 'Os audiobooks irão para Documentos › Audiobook Generator'}
                        </span>
                      </span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {outputFolder && (
                        <motion.button whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.94 }} onClick={openOutputFolder} className={pill} title="Abrir a pasta no explorador de arquivos">
                          <span>Ver pasta</span>
                          <ExternalLink size={13} />
                        </motion.button>
                      )}
                      <motion.button whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.94 }} onClick={() => handleSelectOutputFolder()} className={pill}>
                        <span>{outputFolder ? 'Alterar pasta' : 'Escolher pasta'}</span>
                        <FolderOpen size={13} />
                      </motion.button>
                    </div>
                  </div>
                </OptionGroup>
                <div className="flex items-start gap-3 px-4 text-xs leading-relaxed text-[var(--text-muted)]">
                  <Info size={15} className="shrink-0 mt-0.5" />
                  <p>
                    Se você não escolher uma pasta, o app cria a pasta <span className="font-semibold text-[var(--text-main)]">Audiobook Generator</span> nos
                    seus Documentos. Você pode abri-la ou trocá-la quando quiser em Ajustes › Armazenamento e pastas.
                  </p>
                </div>
              </div>
            )}

            {/* Rodapé: voltar com o nome da página anterior, pontos de progresso e avançar com o nome da próxima */}
            </div>
            <div className="shrink-0 pt-6 grid grid-cols-[1fr_auto_1fr] items-center gap-4">
              <div className="flex justify-start">
                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => goTo(page - 1)} className={`${secondaryBtn} pl-4`}>
                  <ChevronLeft size={16} className="rtl:rotate-180" />
                  <span>{PAGES[page - 1].name}</span>
                </motion.button>
              </div>
              <div className="flex items-center gap-2" aria-label={`Etapa ${page} de ${PAGES.length - 1}`}>
                {PAGES.slice(1).map((p, i) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => goTo(i + 1)}
                    title={p.name}
                    className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${i + 1 === page ? 'w-8 bg-winblue' : 'w-3 bg-[var(--text-main)]/20 hover:bg-[var(--text-main)]/35'}`}
                  />
                ))}
              </div>
              <div className="flex justify-end">
                {page < PAGES.length - 1 ? (
                  <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => goTo(page + 1)} className={`${primaryBtn} pr-4`}>
                    <span>{PAGES[page + 1].name}</span>
                    <ChevronRight size={16} className="rtl:rotate-180" />
                  </motion.button>
                ) : (
                  <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={finish} aria-busy={finishing} className={`${primaryBtn} pl-4`}>
                    <Check size={16} />
                    <span>Concluir</span>
                  </motion.button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default Onboarding;
