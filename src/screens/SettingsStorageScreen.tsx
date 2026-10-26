// ===== Tela: settings-storage =====
import { motion } from 'motion/react';
import { FolderOpen, Trash2, FolderTree, ExternalLink } from 'lucide-react';
import { transicaoConteudo } from '../navigation/transitions';
import { useApp } from '../app/AppContext';

export function SettingsStorageScreen() {
  const { t, showToast, outputFolder, destinationFolderInputRef, handleSelectOutputFolder, handleDestinationFolderInputChange, handleClearCache } = useApp();
  return (
    <motion.div
      key="screen-settings-storage"
      variants={transicaoConteudo}
      initial="escondido"
      animate="visivel"
      exit="saindo"
      className="w-full flex flex-col"
    >
      <div className="mb-12 max-md:mb-6">
        <h1 className="text-4xl md:text-5xl font-semibold text-[var(--text-main)] tracking-tight">Armazenamento & Pastas</h1>
      </div>

      <div className="space-y-2.5">
        {/* Pasta de Salvamento / Destino */}
        <div className="settings-list-row py-3 sm:py-3.5 px-4 sm:px-5 rounded-[32px] bg-card/60 backdrop-blur-xl border border-[var(--text-main)]/10 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-winblue/10 text-winblue flex items-center justify-center shrink-0">
              <FolderOpen size={20} />
            </div>
            <div className="flex flex-col">
              <span className="font-semibold text-base text-[var(--text-main)]">Pasta de destino</span>
              <span className="text-xs sm:text-sm text-[var(--text-muted)] mt-0.5">Local onde os audiobooks e arquivos gerados serão salvos</span>
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0 self-start sm:self-center">
            <div 
              title={outputFolder || "Nenhuma pasta selecionada"}
              className="h-8 px-3.5 rounded-full bg-card/75 backdrop-blur-3xl border border-[var(--text-main)]/10 shadow-sm text-xs text-winblue flex items-center max-w-[200px] md:max-w-xs truncate select-all"
            >
              <span className="truncate">{outputFolder || 'Nenhuma pasta selecionada'}</span>
            </div>
            <motion.button
              whileHover={{ scale: 1.06 }}
              whileTap={{ scale: 0.94 }}
              onClick={handleSelectOutputFolder}
              className="h-8 px-4 rounded-full bg-card/75 backdrop-blur-3xl border border-[var(--text-main)]/10 shadow-sm text-[var(--text-main)] hover:bg-white/15 hover:border-white/25 hover:shadow-[0_0_12px_rgba(255,255,255,0.2)] font-semibold text-xs transition-all flex items-center justify-center shrink-0 cursor-pointer gap-1.5"
              title="Selecionar pasta"
            >
              <span>Alterar pasta</span>
<FolderOpen size={13} className="shrink-0" />
            </motion.button>
          </div>
        </div>

        {/* Abrir no Explorer */}
        <div className="settings-list-row py-3 sm:py-3.5 px-4 sm:px-5 rounded-[32px] bg-card/60 backdrop-blur-xl border border-[var(--text-main)]/10 transition-colors flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-winblue/10 text-winblue flex items-center justify-center shrink-0">
              <FolderTree size={20} />
            </div>
            <div className="flex flex-col">
              <span className="font-semibold text-base text-[var(--text-main)]">Explorador de Arquivos</span>
              <span className="text-xs sm:text-sm text-[var(--text-muted)] mt-0.5">Abrir a pasta de destino diretamente no Windows</span>
            </div>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              if (!outputFolder) {
                showToast("Defina uma pasta de destino primeiro!");
                return;
              }
              fetch('/api/open-folder', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ path: outputFolder }) });
            }}
            className="h-8 px-4 rounded-full bg-card/75 backdrop-blur-3xl border border-[var(--text-main)]/10 text-[var(--text-main)] hover:bg-white/15 hover:border-white/25 text-xs font-semibold shrink-0 cursor-pointer transition-all hover:shadow-[0_0_12px_rgba(255,255,255,0.2)] [&_svg]:text-inherit inline-flex items-center gap-1.5"
          >
            <span>Abrir no Explorer</span>
<ExternalLink size={13} className="shrink-0" />
          </motion.button>
        </div>

        <input
          type="file"
          ref={destinationFolderInputRef}
          onChange={handleDestinationFolderInputChange}
          // @ts-ignore
          webkitdirectory=""
          directory=""
          className="hidden"
        />

        {/* Limpar cache */}
        <div className="settings-list-row py-3 sm:py-3.5 px-4 sm:px-5 rounded-[32px] bg-card/60 backdrop-blur-xl border border-[var(--text-main)]/10 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-winblue/10 text-winblue flex items-center justify-center shrink-0 mt-0.5">
              <Trash2 size={20} />
            </div>
            <div className="flex flex-col">
              <span className="font-semibold text-base text-[var(--text-main)]">{(t as any).settings_clear_cache}</span>
              <span className="text-xs sm:text-sm text-[var(--text-muted)] mt-0.5">{(t as any).settings_clear_cache_sub}</span>
            </div>
          </div>
          <motion.button
            whileHover={{ scale: 1.06 }}
            whileTap={{ scale: 0.94 }}
            onClick={handleClearCache}
            className="self-start sm:self-center h-8 px-4 rounded-full text-red-500 hover:text-red-600 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 font-semibold text-xs transition-all shadow-sm shrink-0 flex items-center gap-1.5 cursor-pointer"
          >
            <span>{(t as any).settings_clear_cache_btn}</span>
            <Trash2 size={14} />
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}
