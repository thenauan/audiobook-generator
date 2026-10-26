// ===== Tela: settings-about =====
import { motion } from 'motion/react';
import { Trash2, Info, Code2, Cpu } from 'lucide-react';
import { transicaoConteudo } from '../navigation/transitions';
import { APP_VERSION } from '../app/screens';
import { useApp } from '../app/AppContext';

export function SettingsAboutScreen() {
  const { navigateTo, t, showToast, handleClearCache, setIsDevModeActive } = useApp();
  return (
    <motion.div
      key="screen-settings-about"
      variants={transicaoConteudo}
      initial="escondido"
      animate="visivel"
      exit="saindo"
      className="w-full flex flex-col"
    >
      <div className="mb-12 max-md:mb-6">
        <h1 className="text-4xl md:text-5xl font-semibold text-[var(--text-main)] tracking-tight">Sistema e Sobre</h1>
      </div>

      <div className="space-y-2.5">
        {/* Versão */}
        <div className="settings-list-row py-3 sm:py-3.5 px-4 sm:px-5 rounded-[32px] bg-card/60 backdrop-blur-xl border border-[var(--text-main)]/10 transition-colors flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-winblue/10 text-winblue flex items-center justify-center shrink-0">
              <Info size={20} />
            </div>
            <div className="flex flex-col">
              <span className="font-semibold text-base text-[var(--text-main)]">Audiobook Generator Neural</span>
              <span className="text-xs sm:text-sm text-[var(--text-muted)] mt-0.5">Versão oficial com design Fluent Glass & Mica</span>
            </div>
          </div>
          <div className="h-8 px-4 rounded-full bg-winblue/15 text-winblue text-xs font-bold flex items-center justify-center">
            v{APP_VERSION}
          </div>
        </div>

        {/* Motor Neural */}
        <div className="settings-list-row py-3 sm:py-3.5 px-4 sm:px-5 rounded-[32px] bg-card/60 backdrop-blur-xl border border-[var(--text-main)]/10 transition-colors flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-winblue/10 text-winblue flex items-center justify-center shrink-0">
              <Cpu size={20} />
            </div>
            <div className="flex flex-col">
              <span className="font-semibold text-base text-[var(--text-main)]">Motor de Síntese</span>
              <span className="text-xs sm:text-sm text-[var(--text-muted)] mt-0.5">Microsoft Edge Neural Engine & FFmpeg</span>
            </div>
          </div>
          <div className="h-8 px-4 rounded-full bg-emerald-500/15 text-emerald-500 text-xs font-bold flex items-center justify-center">
            Ativo & Conectado
          </div>
        </div>

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

        {/* Modo Desenvolvedor */}
        <div className="settings-list-row py-3 sm:py-3.5 px-4 sm:px-5 rounded-[32px] bg-card/60 backdrop-blur-xl border border-[var(--text-main)]/10 transition-colors flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
              <Code2 size={20} />
            </div>
            <div className="flex flex-col">
              <span className="font-semibold text-base text-[var(--text-main)]">Painel de Desenvolvedor</span>
              <span className="text-xs sm:text-sm text-[var(--text-muted)] mt-0.5">Simulação de testes, injeção de dados e depuração</span>
            </div>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              setIsDevModeActive(true);
              localStorage.setItem('app_dev_mode', 'true');
              navigateTo('search');
              showToast("Modo Desenvolvedor ativado!");
            }}
            className="h-8 px-4 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/35 text-xs font-semibold shrink-0 cursor-pointer transition-all hover:bg-amber-500/25 hover:border-amber-500/60 hover:shadow-[0_0_12px_rgba(245,158,11,0.25)] [&_svg]:text-inherit inline-flex items-center gap-1.5"
          >
            <span>Ativar //dev</span>
            <Code2 size={13} className="shrink-0" />
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}
