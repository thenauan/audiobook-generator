// ===== Primeira abertura =====
// Duas telas inteiras, antes do app: boas-vindas e configuração inicial (a pasta de salvamento é
// obrigatória). Os seletores abrem como pop-ups a partir do próprio botão (seletor de ajustes do app).
import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowRight, Check, ChevronDown, ChevronLeft, FolderOpen, Globe, Monitor, Moon, Sun, Mic, FileText,
  FolderTree, Volume2, AlertTriangle, FileAudio2, CopyCheck,
} from 'lucide-react';
import { LuBookAudio } from 'react-icons/lu';
import { AmbientOrbs } from '../components/AmbientOrbs';
import { useApp } from './AppContext';
import { AUDIO_FORMATS, AUDIO_QUALITIES, audioFormatInfo, audioQualityLabel, type AudioQuality } from './audioFormats';
import { audioFormatIcon, audioQualityIcon } from './audioFormatIcons';
import { SettingToggle } from '../components/cards/SettingToggle';
import type { SyncTextDestination } from './types';

const LANGUAGES = [
  { value: 'pt-BR', label: 'Português (Brasil)', flag: '🇧🇷' },
  { value: 'en-US', label: 'English (US)', flag: '🇺🇸' },
  { value: 'es-ES', label: 'Español (ES)', flag: '🇪🇸' },
  { value: 'ar-SA', label: 'العربية (SA)', flag: '🇸🇦' },
];
const THEMES = [
  { value: 'system', label: 'Modo do sistema', icon: <Monitor size={14} className="shrink-0" /> },
  { value: 'light', label: 'Claro', icon: <Sun size={14} className="shrink-0" /> },
  { value: 'dark', label: 'Escuro', icon: <Moon size={14} className="shrink-0" /> },
];
const VOICES = [
  { value: 'pt-BR-AntonioNeural', label: 'Antônio (Masculino)', description: 'Voz equilibrada e formal' },
  { value: 'pt-BR-FranciscaNeural', label: 'Francisca (Feminino)', description: 'Voz expressiva e natural' },
];
const DESTINATIONS: { value: SyncTextDestination; label: string; description: string; icon: React.ReactNode }[] = [
  { value: 'metadata', label: 'Metadados do audiobook', description: 'Grava o texto dentro do arquivo', icon: <FileAudio2 size={14} className="shrink-0" /> },
  { value: 'library', label: 'Pasta da biblioteca', description: 'Salva .lrc, .srt e .sync.json e mostra em Convertidos', icon: <FolderOpen size={14} className="shrink-0" /> },
  { value: 'both', label: 'Ambos', description: 'Grava no audiobook e salva na biblioteca', icon: <CopyCheck size={14} className="shrink-0" /> },
];

const STEP_MOTION = {
  initial: { opacity: 0, y: 14, scale: 0.99 },
  animate: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring' as const, stiffness: 420, damping: 36, mass: 0.6 } },
  exit: { opacity: 0, y: -10, scale: 0.99, transition: { duration: 0.12 } },
};

const pill = "h-8 pl-3.5 pr-2.5 rounded-full bg-card/75 backdrop-blur-3xl border border-[var(--text-main)]/10 shadow-sm text-[var(--text-main)] hover:bg-white/15 hover:border-white/25 hover:shadow-[0_0_12px_rgba(255,255,255,0.2)] flex items-center gap-1.5 text-xs font-semibold transition-all shrink-0 cursor-pointer [&_svg]:text-inherit";
const card = "settings-list-row py-3 sm:py-3.5 px-4 sm:px-5 rounded-[32px] bg-card/60 backdrop-blur-xl border border-[var(--text-main)]/10 flex items-center justify-between gap-4";

function Row({ icon, title, subtitle, children }: { icon: React.ReactNode; title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div className={card}>
      <div className="flex items-center gap-4 min-w-0">
        <div className="w-10 h-10 rounded-full bg-winblue/10 text-winblue flex items-center justify-center shrink-0">{icon}</div>
        <div className="flex flex-col min-w-0">
          <span className="font-semibold text-base text-[var(--text-main)] truncate">{title}</span>
          <span className="text-xs sm:text-sm text-[var(--text-muted)] mt-0.5 truncate">{subtitle}</span>
        </div>
      </div>
      {children}
    </div>
  );
}

export function Onboarding() {
  const app = useApp();
  const {
    showWelcomeModal, setShowWelcomeModal, setShowInitialConfigModal, setActiveSettingSelector, activeSettingSelector,
    interfaceLang, setInterfaceLang, themeMode, setThemeMode, defaultVoice, setDefaultVoice, fileTypeOption, setFileTypeOption,
    audioQuality, setAudioQuality, generateSyncTextDefault, setGenerateSyncTextDefault, syncTextDestination, setSyncTextDestination,
    outputFolder, handleSelectOutputFolder, toastMessage,
  } = app;
  const step: 'welcome' | 'config' = showWelcomeModal ? 'welcome' : 'config';

  // Seletor em pop-up a partir do botão (mesmo componente dos Ajustes)
  const selector = (id: string, title: string, currentValue: string, options: any[], onSelect: (v: string) => void) =>
    (e: React.MouseEvent<HTMLElement>) => {
      e.stopPropagation();
      setActiveSettingSelector({ id, triggerEl: e.currentTarget, title, currentValue, options, onSelect });
    };
  const hidden = (id: string) => activeSettingSelector?.id === id
    ? { scale: 1.22, opacity: 0, pointerEvents: 'none' as const }
    : { scale: 1, opacity: 1, pointerEvents: 'auto' as const };

  const finishWelcome = () => {
    try { localStorage.setItem('has_seen_welcome_v3', 'true'); } catch {}
    setShowWelcomeModal(false);
    setShowInitialConfigModal(true);
  };
  const finishConfig = () => {
    if (!outputFolder) return;
    try { localStorage.setItem('has_seen_initial_config_v3', 'true'); } catch {}
    setShowInitialConfigModal(false);
  };

  const language = LANGUAGES.find(l => l.value === interfaceLang) || LANGUAGES[0];
  const theme = THEMES.find(tm => tm.value === themeMode) || THEMES[0];
  const voice = VOICES.find(v => v.value === defaultVoice) || VOICES[0];
  const destination = DESTINATIONS.find(d => d.value === syncTextDestination) || DESTINATIONS[2];

  return (
    <div className="app-shell fixed inset-0 isolate bg-mica text-main font-fluent select-none overflow-y-auto custom-scrollbar">
      {/* Cores do ícone se movendo ao fundo */}
      <AmbientOrbs className="fixed" intensity={0.75} />
      {/* Avisos no topo, à direita (como no cabeçalho do app) */}
      <div className="fixed top-[var(--app-header-top)] right-8 z-[9000] pointer-events-none">
        <AnimatePresence>
          {toastMessage && (
            <motion.div
              key="toast"
              role="status"
              initial={{ opacity: 0, x: 16, scale: 0.92 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 12, scale: 0.92 }}
              className="h-9 max-w-[480px] px-4 rounded-full bg-card/90 backdrop-blur-3xl border border-[var(--button-secondary-bg)] shadow-xl text-xs font-semibold text-[var(--text-main)] flex items-center gap-2"
            >
              <Check size={15} className="text-winblue shrink-0" />
              <span className="truncate">{toastMessage}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <div className="min-h-full w-full max-w-3xl mx-auto px-8 py-14 flex flex-col">
        {/* Etapas */}
        <div className="flex items-center gap-2 mb-10" aria-label={step === 'welcome' ? 'Etapa 1 de 2' : 'Etapa 2 de 2'}>
          {(['welcome', 'config'] as const).map(s => (
            <span key={s} className={`h-1.5 rounded-full transition-all duration-300 ${s === step ? 'w-8 bg-winblue' : 'w-3 bg-[var(--text-main)]/20'}`} />
          ))}
        </div>

        <AnimatePresence mode="wait">
          {step === 'welcome' ? (
            <motion.div key="welcome" {...STEP_MOTION} className="flex-1 flex flex-col">
              <img src="/icon.svg" alt="" width={88} height={88} className="w-[88px] h-[88px] mb-8 drop-shadow-[0_18px_40px_rgba(0,0,0,0.45)]" />
              <h1 className="text-4xl md:text-5xl font-semibold tracking-tight text-[var(--text-main)] mb-6">Bem-vindo ao Audiobook Generator</h1>
              <div className="space-y-4 text-sm sm:text-base leading-relaxed text-[var(--text-main)]/85 max-w-2xl">
                <p>O Audiobook Generator transforma e-books e textos em .epub, .mobi, .pdf e .txt em audiobooks narrados por vozes neurais.</p>
                <p>Você escolhe o formato de cada audiobook (M4B, MP3, Opus, FLAC ou WAV, em um único arquivo com capítulos ou um arquivo por capítulo), a voz que vai ler o livro e a qualidade do áudio.</p>
                <p>O app também traduz livros de outros idiomas antes de narrar e gera o texto sincronizado com o áudio, para acompanhar a leitura no Audiobook Player.</p>
              </div>
              <div className="mt-8 p-4 rounded-3xl bg-amber-500/10 border border-amber-500/30 text-amber-500 dark:text-amber-300 flex gap-3 items-start max-w-2xl">
                <AlertTriangle size={18} className="shrink-0 mt-0.5" />
                <p className="text-xs leading-relaxed">
                  O aplicativo foi feito para facilitar o acesso à literatura e promover acessibilidade. Não o use para infringir direitos autorais ou processar conteúdo criminoso. O autor não se responsabiliza pelas atividades do usuário.
                </p>
              </div>
              <div className="mt-auto pt-12 flex justify-end">
                <motion.button
                  whileHover={{ scale: 1.06 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={finishWelcome}
                  className="h-11 pl-6 pr-5 rounded-full bg-winblue/20 border border-winblue/45 text-winblue hover:bg-winblue/30 hover:border-winblue/75 hover:shadow-[0_0_20px_rgba(var(--winblue-rgb),0.4)] text-sm font-semibold flex items-center gap-2 transition-all cursor-pointer [&_svg]:text-inherit"
                >
                  <span>Começar</span>
                  <ArrowRight size={16} />
                </motion.button>
              </div>
            </motion.div>
          ) : (
            <motion.div key="config" {...STEP_MOTION} className="flex-1 flex flex-col">
              <h1 className="text-4xl md:text-5xl font-semibold tracking-tight text-[var(--text-main)] mb-3">Configuração inicial</h1>
              <p className="text-sm text-[var(--text-muted)] mb-10 max-w-2xl">
                Estes são os padrões do app. Você pode mudar agora ou depois, em Ajustes. Só a pasta de salvamento é obrigatória.
              </p>

              <div className="space-y-2.5">
                <Row icon={<Globe size={20} />} title="Idioma do aplicativo" subtitle="Idioma da interface">
                  <motion.button whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.94 }} animate={hidden('ob-lang')}
                    onClick={selector('ob-lang', 'Idioma', interfaceLang, LANGUAGES.map(l => ({ value: l.value, label: l.label, icon: <span className="text-sm leading-none">{l.flag}</span> })), setInterfaceLang)}
                    className={pill}>
                    <span>{language.flag} {language.label}</span>
                    <ChevronDown size={14} className="-mr-0.5" />
                  </motion.button>
                </Row>

                <Row icon={theme.value === 'light' ? <Sun size={20} /> : theme.value === 'dark' ? <Moon size={20} /> : <Monitor size={20} />} title="Tema" subtitle="Aparência clara, escura ou automática">
                  <motion.button whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.94 }} animate={hidden('ob-theme')}
                    onClick={selector('ob-theme', 'Tema', themeMode, THEMES, (v) => setThemeMode(v as any))}
                    className={pill}>
                    <span>{theme.label}</span>
                    <ChevronDown size={14} className="-mr-0.5" />
                  </motion.button>
                </Row>

                <Row icon={<Mic size={20} />} title="Voz padrão" subtitle="Pode ser trocada em cada e-book">
                  <motion.button whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.94 }} animate={hidden('ob-voice')}
                    onClick={selector('ob-voice', 'Voz padrão', defaultVoice, VOICES.map(v => ({ ...v, icon: <Mic size={14} className="shrink-0" /> })), setDefaultVoice)}
                    className={pill}>
                    <span>{voice.label}</span>
                    <ChevronDown size={14} className="-mr-0.5" />
                  </motion.button>
                </Row>

                <Row icon={<LuBookAudio size={20} />} title="Formato dos audiobooks" subtitle="Pode ser trocado em cada e-book">
                  <motion.button whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.94 }} animate={hidden('ob-format')}
                    onClick={selector('ob-format', 'Formato dos arquivos', fileTypeOption, AUDIO_FORMATS.map(f => ({ value: f.value, label: f.label, description: f.description, icon: audioFormatIcon(f.value) })), (v) => setFileTypeOption(v as any))}
                    className={pill}>
                    <span>{audioFormatInfo(fileTypeOption === 'ask' ? 'single' : fileTypeOption).label}</span>
                    <ChevronDown size={14} className="-mr-0.5" />
                  </motion.button>
                </Row>

                <Row icon={<Volume2 size={20} />} title="Qualidade de áudio" subtitle="Vale para MP3, M4B e Opus">
                  <motion.button whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.94 }} animate={hidden('ob-quality')}
                    onClick={selector('ob-quality', 'Qualidade de áudio', audioQuality, AUDIO_QUALITIES.map(q => ({ value: q.value, label: q.label, description: q.description, icon: audioQualityIcon(q.value) })), (v) => setAudioQuality(v as AudioQuality))}
                    className={pill}>
                    <span>{audioQualityLabel(audioQuality)}</span>
                    <ChevronDown size={14} className="-mr-0.5" />
                  </motion.button>
                </Row>

                <Row icon={<FileText size={20} />} title="Texto sincronizado" subtitle="Gerar o texto junto com o audiobook">
                  <SettingToggle checked={generateSyncTextDefault} onChange={setGenerateSyncTextDefault} enabledLabel="Sim" disabledLabel="Não" />
                </Row>

                <Row icon={<FolderTree size={20} />} title="Onde salvar o texto" subtitle="No audiobook, na biblioteca ou nos dois">
                  <motion.button whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.94 }} animate={hidden('ob-dest')}
                    onClick={selector('ob-dest', 'Onde salvar o texto', syncTextDestination, DESTINATIONS, (v) => setSyncTextDestination(v as SyncTextDestination))}
                    className={pill}>
                    <span>{destination.label}</span>
                    <ChevronDown size={14} className="-mr-0.5" />
                  </motion.button>
                </Row>

                <Row
                  icon={<FolderOpen size={20} />}
                  title="Pasta de salvamento"
                  subtitle={outputFolder ? 'Onde os audiobooks serão salvos' : 'Obrigatório: escolha onde salvar os audiobooks'}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    {outputFolder && (
                      <span className="h-8 px-3.5 rounded-full bg-winblue/10 border border-winblue/25 text-winblue text-xs font-semibold flex items-center max-w-[260px] truncate" title={outputFolder}>
                        <span className="truncate">{outputFolder}</span>
                      </span>
                    )}
                    <motion.button whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.94 }} onClick={() => handleSelectOutputFolder()}
                      className={`${pill} ${outputFolder ? '' : '!border-red-500/45 !text-red-500'}`}>
                      <span>{outputFolder ? 'Alterar pasta' : 'Escolher pasta'}</span>
                      <FolderOpen size={14} />
                    </motion.button>
                  </div>
                </Row>
              </div>

              <div className="mt-auto pt-12 flex items-center justify-between">
                <motion.button
                  whileHover={{ scale: 1.06 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => { setShowInitialConfigModal(false); setShowWelcomeModal(true); }}
                  className="h-11 pl-4 pr-5 rounded-full bg-card/75 border border-[var(--text-main)]/10 text-[var(--text-main)] hover:bg-white/15 hover:border-white/25 hover:shadow-[0_0_15px_rgba(255,255,255,0.25)] text-sm font-semibold flex items-center gap-2 transition-all cursor-pointer [&_svg]:text-inherit"
                >
                  <ChevronLeft size={16} />
                  <span>Voltar</span>
                </motion.button>
                <motion.button
                  whileHover={outputFolder ? { scale: 1.06 } : undefined}
                  whileTap={outputFolder ? { scale: 0.95 } : undefined}
                  animate={{ opacity: outputFolder ? 1 : 0.4 }}
                  onClick={finishConfig}
                  aria-disabled={!outputFolder}
                  title={outputFolder ? 'Concluir' : 'Escolha a pasta de salvamento para continuar'}
                  className={`h-11 pl-5 pr-6 rounded-full bg-winblue/20 border border-winblue/45 text-winblue text-sm font-semibold flex items-center gap-2 transition-all [&_svg]:text-inherit ${outputFolder ? 'hover:bg-winblue/30 hover:border-winblue/75 hover:shadow-[0_0_20px_rgba(var(--winblue-rgb),0.4)] cursor-pointer' : 'cursor-not-allowed'}`}
                >
                  <Check size={16} />
                  <span>Concluir</span>
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default Onboarding;
