// ===== Tela: settings-conversion =====
import { motion } from 'motion/react';
import { FileText, Headphones, ChevronDown, Volume2, FolderTree, Mic, HelpCircle, FileAudio2, FolderOpen, CopyCheck, Rows3, AlignLeft, WholeWord } from 'lucide-react';
import { AUDIO_FORMATS, AUDIO_QUALITIES, audioFormatInfo, audioQualityLabel, type AudioQuality } from '../app/audioFormats';
import { audioFormatIcon, audioQualityIcon } from '../app/audioFormatIcons';
import type { SyncTextDestination, SyncTextGranularity } from '../app/types';

const DESTINATION_LABELS: Record<SyncTextDestination, string> = {
  metadata: 'Metadados do audiobook',
  library: 'Pasta da biblioteca',
  both: 'Ambos',
};

const GRANULARITY_LABELS: Record<SyncTextGranularity, string> = {
  sentences: 'Frases',
  words: 'Palavras',
  both: 'Frases e palavras',
};
import { LuBookAudio } from 'react-icons/lu';
import { transicaoConteudo } from '../navigation/transitions';
import { SettingToggle } from '../components/cards/SettingToggle';
import { useApp } from '../app/AppContext';
import { VOICES } from '../data/voices';
import { voicePickerOptions } from '../data/voiceOptions';

export function SettingsConversionScreen() {
  const { showToast, interfaceLang, defaultVoice, setDefaultVoice, fileTypeOption, setFileTypeOption, generateSyncTextDefault, setGenerateSyncTextDefault, syncTextDestination, setSyncTextDestination, syncTextGranularity, setSyncTextGranularity, activeSettingSelector, setActiveSettingSelector, audioQuality, setAudioQuality } = useApp();
  return (
    <motion.div
      key="screen-settings-conversion"
      variants={transicaoConteudo}
      initial="escondido"
      animate="visivel"
      exit="saindo"
      className="w-full flex flex-col"
    >
      <div className="mb-12 max-md:mb-6">
        <h1 className="text-4xl md:text-5xl font-semibold text-[var(--text-main)] tracking-tight">Conversão de áudio</h1>
      </div>

      <div className="space-y-2.5">
        {/* Formato de Arquivos */}
        <div className="settings-list-row py-3 sm:py-3.5 px-4 sm:px-5 rounded-[32px] bg-card/60 backdrop-blur-xl border border-[var(--text-main)]/10 transition-colors flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-winblue/10 text-winblue flex items-center justify-center shrink-0">
              <LuBookAudio size={20} />
            </div>
            <div className="flex flex-col">
              <span className="font-semibold text-base text-[var(--text-main)]">Formato dos arquivos gerados</span>
              <span className="text-xs sm:text-sm text-[var(--text-muted)] mt-0.5">M4B, MP3, Opus, FLAC, WAV ou um arquivo por capítulo</span>
            </div>
          </div>
          <motion.button 
            whileHover={{ scale: 1.06 }} 
            whileTap={{ scale: 0.94 }}
            animate={activeSettingSelector?.id === 'file-type' ? { scale: 1.22, opacity: 0, pointerEvents: 'none' } : { scale: 1, opacity: 1, pointerEvents: 'auto' }}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
            onClick={(e) => {
              e.stopPropagation();
              setActiveSettingSelector({
                hideTitle: true,
                id: 'file-type',
                captions: true,
                triggerEl: e.currentTarget,
                title: 'Formato dos arquivos',
                subtitle: 'M4B, MP3, Opus, FLAC, WAV ou um arquivo por capítulo',
                currentValue: fileTypeOption,
                options: [
                  ...AUDIO_FORMATS.map(f => ({ value: f.value, label: f.label, description: f.description, icon: audioFormatIcon(f.value) })),
                ],
                onSelect: (val) => setFileTypeOption(val)
              });
            }}
            className="h-8 pl-3.5 pr-2.5 rounded-full bg-card/75 backdrop-blur-3xl border border-[var(--text-main)]/10 shadow-sm text-[var(--text-main)] hover:bg-white/15 hover:border-white/25 hover:shadow-[0_0_12px_rgba(255,255,255,0.2)] flex items-center gap-1.5 text-xs font-semibold transition-all shrink-0 cursor-pointer [&_svg]:text-inherit"
          >
            <span>{audioFormatInfo(fileTypeOption === 'ask' ? 'm4b' : fileTypeOption).label}</span>
            <ChevronDown size={14} className="-mr-0.5 text-inherit" />
          </motion.button>
        </div>

        {/* Voz Padrão */}
        <div className="settings-list-row py-3 sm:py-3.5 px-4 sm:px-5 rounded-[32px] bg-card/60 backdrop-blur-xl border border-[var(--text-main)]/10 transition-colors flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-winblue/10 text-winblue flex items-center justify-center shrink-0">
              <Headphones size={20} />
            </div>
            <div className="flex flex-col">
              <span className="font-semibold text-base text-[var(--text-main)]">Voz neural padrão</span>
              <span className="text-xs sm:text-sm text-[var(--text-muted)] mt-0.5">Voz utilizada para narrar conteúdos em português</span>
            </div>
          </div>
          <motion.button 
            whileHover={{ scale: 1.06 }} 
            whileTap={{ scale: 0.94 }}
            animate={activeSettingSelector?.id === 'voice' ? { scale: 1.22, opacity: 0, pointerEvents: 'none' } : { scale: 1, opacity: 1, pointerEvents: 'auto' }}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
            onClick={(e) => {
              e.stopPropagation();
              setActiveSettingSelector({
                hideTitle: true,
                id: 'voice',
                triggerEl: e.currentTarget,
                title: 'Voz neural padrão',
                subtitle: 'Voz usada nos livros novos e idioma das traduções',
                currentValue: defaultVoice,
                options: voicePickerOptions(interfaceLang, defaultVoice, setDefaultVoice),
                onSelect: (val) => setDefaultVoice(val)
              });
            }}
            className="h-8 pl-3.5 pr-2.5 rounded-full bg-card/75 backdrop-blur-3xl border border-[var(--text-main)]/10 shadow-sm text-[var(--text-main)] hover:bg-white/15 hover:border-white/25 hover:shadow-[0_0_12px_rgba(255,255,255,0.2)] flex items-center gap-1.5 text-xs font-semibold transition-all shrink-0 cursor-pointer [&_svg]:text-inherit"
          >
            <span>{(() => { const v = VOICES.find(x => x.code === defaultVoice); return v ? `${v.flag} ${v.label.split(' - ')[1] || v.label}` : defaultVoice; })()}</span>
            <ChevronDown size={14} className="-mr-0.5 text-inherit" />
          </motion.button>
        </div>

        {/* Taxa de Amostragem */}
        <div className="settings-list-row py-3 sm:py-3.5 px-4 sm:px-5 rounded-[32px] bg-card/60 backdrop-blur-xl border border-[var(--text-main)]/10 transition-colors flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-winblue/10 text-winblue flex items-center justify-center shrink-0">
              <Volume2 size={20} />
            </div>
            <div className="flex flex-col">
              <span className="font-semibold text-base text-[var(--text-main)]">Qualidade de áudio</span>
              <span className="text-xs sm:text-sm text-[var(--text-muted)] mt-0.5">Voz neural a 96 kbps, codificada uma única vez</span>
            </div>
          </div>
          <motion.button
            whileHover={{ scale: 1.06 }}
            whileTap={{ scale: 0.94 }}
            animate={activeSettingSelector?.id === 'audio-quality' ? { scale: 1.22, opacity: 0, pointerEvents: 'none' } : { scale: 1, opacity: 1, pointerEvents: 'auto' }}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
            onClick={(e) => {
              e.stopPropagation();
              setActiveSettingSelector({
                hideTitle: true,
                id: 'audio-quality',
                captions: true,
                triggerEl: e.currentTarget,
                title: 'Qualidade de áudio',
                subtitle: 'Vale para MP3, M4B e Opus (FLAC e WAV são sempre sem perda)',
                currentValue: audioQuality,
                options: AUDIO_QUALITIES.map(q => ({ value: q.value, label: q.label, description: q.description, icon: audioQualityIcon(q.value) })),
                onSelect: (val) => setAudioQuality(val as AudioQuality)
              });
            }}
            className="h-8 pl-3.5 pr-2.5 rounded-full bg-card/75 backdrop-blur-3xl border border-[var(--text-main)]/10 shadow-sm text-[var(--text-main)] hover:bg-white/15 hover:border-white/25 hover:shadow-[0_0_12px_rgba(255,255,255,0.2)] flex items-center gap-1.5 text-xs font-semibold transition-all shrink-0 cursor-pointer [&_svg]:text-inherit"
          >
            <span>{audioQualityLabel(audioQuality)}</span>
            <ChevronDown size={14} className="-mr-0.5 text-inherit" />
          </motion.button>
        </div>

        {/* Texto Sincronizado por Padrão */}
        <div className="settings-list-row py-3 sm:py-3.5 px-4 sm:px-5 rounded-[32px] bg-card/60 backdrop-blur-xl border border-[var(--text-main)]/10 transition-colors flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-winblue/10 text-winblue flex items-center justify-center shrink-0">
              <FileText size={20} />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-base text-[var(--text-main)]">Texto sincronizado por padrão</span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-500 border border-emerald-500/20">Recomendado</span>
              </div>
              <span className="text-xs sm:text-sm text-[var(--text-muted)] mt-0.5">
                Gerar o texto sincronizado com o livro ao converter (pode mudar em cada e-book)
              </span>
            </div>
          </div>
          <SettingToggle
            checked={generateSyncTextDefault}
            onChange={(checked) => {
              setGenerateSyncTextDefault(checked);
              localStorage.setItem('generate_sync_text_default', String(checked));
              showToast(checked ? "Texto sincronizado ativado por padrão nas conversões." : "Texto sincronizado desativado por padrão nas conversões.");
            }}
            enabledLabel="Sim"
            disabledLabel="Não"
          />
        </div>

        {/* Onde guardar o texto sincronizado (na conversão e no menu de opções do audiobook) */}
        <div className="settings-list-row py-3 sm:py-3.5 px-4 sm:px-5 rounded-[32px] bg-card/60 backdrop-blur-xl border border-[var(--text-main)]/10 transition-colors flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-winblue/10 text-winblue flex items-center justify-center shrink-0">
              <FolderTree size={20} />
            </div>
            <div className="flex flex-col">
              <span className="font-semibold text-base text-[var(--text-main)]">Onde salvar o texto sincronizado</span>
              <span className="text-xs sm:text-sm text-[var(--text-muted)] mt-0.5">
                Dentro do arquivo do audiobook, na pasta da biblioteca (aparece em Convertidos) ou nos dois
              </span>
            </div>
          </div>
          <motion.button
            whileHover={{ scale: 1.06 }}
            whileTap={{ scale: 0.94 }}
            animate={activeSettingSelector?.id === 'sync-destination' ? { scale: 1.22, opacity: 0, pointerEvents: 'none' } : { scale: 1, opacity: 1, pointerEvents: 'auto' }}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
            onClick={(e) => {
              e.stopPropagation();
              setActiveSettingSelector({
                hideTitle: true,
                id: 'sync-destination',
                captions: true,
                triggerEl: e.currentTarget,
                title: 'Onde salvar o texto',
                subtitle: 'Vale para a conversão e para "Gerar texto" em Convertidos',
                currentValue: syncTextDestination,
                options: [
                  { value: 'metadata', label: DESTINATION_LABELS.metadata, description: 'Grava o texto dentro do arquivo (letras sincronizadas)', icon: <FileAudio2 size={14} className="shrink-0" /> },
                  { value: 'library', label: DESTINATION_LABELS.library, description: 'Salva .lrc, .srt e .sync.json ao lado do áudio e em Convertidos', icon: <FolderOpen size={14} className="shrink-0" /> },
                  { value: 'both', label: DESTINATION_LABELS.both, description: 'Grava no audiobook e salva na biblioteca', icon: <CopyCheck size={14} className="shrink-0" /> },
                ],
                onSelect: (val) => {
                  setSyncTextDestination(val as SyncTextDestination);
                  showToast(`Texto sincronizado: ${DESTINATION_LABELS[val as SyncTextDestination].toLowerCase()}.`);
                }
              });
            }}
            className="h-8 pl-3.5 pr-2.5 rounded-full bg-card/75 backdrop-blur-3xl border border-[var(--text-main)]/10 shadow-sm text-[var(--text-main)] hover:bg-white/15 hover:border-white/25 hover:shadow-[0_0_12px_rgba(255,255,255,0.2)] flex items-center gap-1.5 text-xs font-semibold transition-all shrink-0 cursor-pointer [&_svg]:text-inherit"
          >
            <span>{DESTINATION_LABELS[syncTextDestination]}</span>
            <ChevronDown size={14} className="-mr-0.5 text-inherit" />
          </motion.button>
        </div>

        {/* Separação do texto sincronizado: frases, palavras ou as duas */}
        <div className="settings-list-row py-3 sm:py-3.5 px-4 sm:px-5 rounded-[32px] bg-card/60 backdrop-blur-xl border border-[var(--text-main)]/10 transition-colors flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-winblue/10 text-winblue flex items-center justify-center shrink-0">
              <Rows3 size={20} />
            </div>
            <div className="flex flex-col">
              <span className="font-semibold text-base text-[var(--text-main)]">Separação do texto sincronizado</span>
              <span className="text-xs sm:text-sm text-[var(--text-muted)] mt-0.5">
                Destacar o texto frase a frase, palavra por palavra ou nos dois níveis
              </span>
            </div>
          </div>
          <motion.button
            whileHover={{ scale: 1.06 }}
            whileTap={{ scale: 0.94 }}
            animate={activeSettingSelector?.id === 'sync-granularity' ? { scale: 1.22, opacity: 0, pointerEvents: 'none' } : { scale: 1, opacity: 1, pointerEvents: 'auto' }}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
            onClick={(e) => {
              e.stopPropagation();
              setActiveSettingSelector({
                hideTitle: true,
                id: 'sync-granularity',
                captions: true,
                triggerEl: e.currentTarget,
                title: 'Separação do texto',
                currentValue: syncTextGranularity,
                options: [
                  { value: 'sentences', label: GRANULARITY_LABELS.sentences, description: 'Uma linha por frase, destacada enquanto é lida', icon: <AlignLeft size={14} className="shrink-0" /> },
                  { value: 'words', label: GRANULARITY_LABELS.words, description: 'Cada palavra acende no momento em que é falada', icon: <WholeWord size={14} className="shrink-0" /> },
                  { value: 'both', label: GRANULARITY_LABELS.both, description: 'Frases, com o tempo de cada palavra dentro delas', icon: <Rows3 size={14} className="shrink-0" /> },
                ],
                onSelect: (val) => {
                  setSyncTextGranularity(val as SyncTextGranularity);
                  showToast(`Texto sincronizado separado por ${GRANULARITY_LABELS[val as SyncTextGranularity].toLowerCase()}.`);
                }
              });
            }}
            className="h-8 pl-3.5 pr-2.5 rounded-full bg-card/75 backdrop-blur-3xl border border-[var(--text-main)]/10 shadow-sm text-[var(--text-main)] hover:bg-white/15 hover:border-white/25 hover:shadow-[0_0_12px_rgba(255,255,255,0.2)] flex items-center gap-1.5 text-xs font-semibold transition-all shrink-0 cursor-pointer [&_svg]:text-inherit"
          >
            <span>{GRANULARITY_LABELS[syncTextGranularity]}</span>
            <ChevronDown size={14} className="-mr-0.5 text-inherit" />
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}
