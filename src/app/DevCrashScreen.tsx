// ===== Tela de erro simulado (Modo Desenvolvedor) =====
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, RefreshCw, Copy, Database, Eye } from 'lucide-react';
import { useApp } from './AppContext';

export function DevCrashScreen() {
  const { showToast, setDevCrashScreen, devShowStack, setDevShowStack, handleExitDevMode, handleSimulateFullScreenError } = useApp();
  return (
    <div className="fixed inset-0 z-[999999] bg-[#0c0c0e] text-white flex flex-col items-center justify-center p-6 select-none overflow-y-auto custom-scrollbar font-sans">
      <div className="max-w-[580px] w-full text-center my-auto">
        <div className="flex items-center justify-center mb-3.5">
          <AlertTriangle size={46} className="text-red-500" />
        </div>

        <h1 className="text-2xl font-bold text-red-500 tracking-tight mb-2.5">
          Ocorreu um erro inesperado
        </h1>

        <h2 className="text-base font-semibold text-white mb-3">
          O aplicativo encontrou uma falha e não pôde continuar
        </h2>

        <p className="text-sm text-neutral-400 leading-relaxed mb-3.5">
          Uma exceção crítica interrompeu a execução dos processos em segundo plano.
        </p>

        <p className="text-sm text-neutral-400 leading-relaxed mb-6">
          Recursos como o <strong className="text-white font-bold">Conversor de Áudio</strong>, a <strong className="text-white font-bold">Fila de Processamento</strong> e a <strong className="text-white font-bold">Geração de Texto por IA</strong> estão temporariamente suspensos.
        </p>

        <div className="text-xs text-red-300 bg-red-500/10 border border-red-500/25 p-4 rounded-3xl text-left font-mono break-all leading-relaxed mb-4">
          Simulação de erro crítico do sistema iniciada pelo Modo de Desenvolvedor (//dev).
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3 mb-10">
          <div className="relative inline-flex">
            <motion.button
              type="button"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={(e) => {
                e.stopPropagation();
                setDevShowStack(!devShowStack);
              }}
              className="h-9 px-4 rounded-full bg-white/10 hover:bg-white/20 border border-white/25 text-white text-xs font-semibold flex items-center gap-2 transition-all shadow-md cursor-pointer"
            >
              <Eye size={13} />
              <span>{devShowStack ? "Ocultar detalhes" : "Ver rastreamento da pilha"}</span>
            </motion.button>
          </div>

          <button
            onClick={() => {
              navigator.clipboard.writeText("Error: Simulação de erro crítico do sistema iniciada pelo Modo de Desenvolvedor (//dev).\nStack: at App.tsx (DevMode Simulation)\nComponent: App");
              showToast("Detalhes do erro copiados!");
            }}
            className="h-9 px-4 rounded-full bg-white/10 hover:bg-white/20 border border-white/25 text-white text-xs font-semibold flex items-center gap-2 transition-all shadow-md cursor-pointer"
          >
            <Copy size={13} />
            <span>Copiar detalhes</span>
          </button>
        </div>

        <AnimatePresence>
          {devShowStack && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-8 p-4 rounded-2xl bg-black/60 border border-white/15 text-left text-xs font-mono text-neutral-300 max-h-48 overflow-y-auto custom-scrollbar whitespace-pre-wrap select-text"
            >
              Error: Simulação de erro crítico do sistema iniciada pelo Modo de Desenvolvedor (//dev).{"\n"}
              {"    "}at handleSimulateFullScreenError (src/App.tsx:2880:12){"\n"}
              {"    "}at onClick (src/App.tsx:3420:18){"\n"}
              {"    "}at HTMLButtonElement.dispatchDiscreteEvent (react-dom.development.js:1230:10){"\n"}
              {"    "}at renderWithHooks (react-dom.development.js:15486:18)
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex flex-wrap items-center justify-center gap-3.5 mb-4">
          <button
            onClick={() => window.location.reload()}
            className="h-11 px-6 rounded-full bg-winblue hover:bg-winblue/80 text-white font-semibold text-sm flex items-center gap-2 shadow-lg transition-all cursor-pointer"
          >
            <RefreshCw size={16} />
            <span>Recarregar aplicativo</span>
          </button>

          <button
            onClick={() => {
              setDevCrashScreen(false);
              handleExitDevMode();
              showToast("Modo Dev encerrado e aplicativo restaurado!");
            }}
            className="h-11 px-6 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold text-sm flex items-center gap-2 transition-all cursor-pointer"
          >
            <Database size={16} />
            <span>Restaurar e sair do Modo Dev</span>
          </button>
        </div>

        <p className="text-xs text-neutral-500 max-w-md mx-auto leading-relaxed">
          Seus arquivos locais e configurações salvas permanecem seguros no seu dispositivo.
        </p>
      </div>
    </div>
  );
}
