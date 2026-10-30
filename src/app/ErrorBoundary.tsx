// ===== Proteção global contra erros de tela =====
// Se uma tela quebrar, o app mostra esta tela (em vez de ficar em branco) com opções para continuar.
import React from 'react';
import { AlertTriangle, RefreshCw, Copy, RotateCcw } from 'lucide-react';

interface State {
  error: Error | null;
  info: string;
}

// Dados que podem estar corrompidos; preferências e a pasta de destino são preservadas
const DATA_KEYS = ['audiobook_history', 'audiobook_generated_texts', 'recent_searches', 'audiobook_gen_history', 'audiobook_gen_texts'];

export class ErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
  state: State = { error: null, info: '' };

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    this.setState({ info: info.componentStack || '' });
    console.error('Erro na interface:', error, info.componentStack);
  }

  private details() {
    const { error, info } = this.state;
    return `${error?.name}: ${error?.message}\n${error?.stack || ''}\n${info}`.slice(0, 6000);
  }

  render() {
    if (!this.state.error) return this.props.children;
    const btn = 'h-10 px-5 rounded-full text-sm font-semibold flex items-center gap-2 cursor-pointer transition-[background-color,border-color,box-shadow] border';
    return (
      <div className="fixed inset-0 bg-[#121214] text-white flex items-center justify-center p-8 overflow-y-auto font-sans">
        <div className="max-w-[560px] w-full text-center">
          <AlertTriangle size={44} className="text-amber-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Algo deu errado nesta tela</h1>
          <p className="text-sm text-neutral-400 leading-relaxed mb-5">
            Suas conversões em andamento continuam no computador e os audiobooks já salvos não foram afetados.
            Tente voltar ao app; se o erro se repetir, restaure os dados locais (o histórico de Convertidos é recriado, os arquivos na pasta continuam).
          </p>
          <pre className="text-left text-[11px] text-red-300 bg-red-500/10 border border-red-500/25 rounded-2xl p-3 max-h-32 overflow-auto whitespace-pre-wrap break-all mb-6">
            {this.state.error.message}
          </pre>
          <div className="flex flex-wrap justify-center gap-3">
            <button type="button" className={`${btn} bg-white/10 border-white/20 hover:bg-white/20`} onClick={() => this.setState({ error: null, info: '' })}>
              <RotateCcw size={15} /> Voltar ao app
            </button>
            <button type="button" className={`${btn} bg-white/10 border-white/20 hover:bg-white/20`} onClick={() => window.location.reload()}>
              <RefreshCw size={15} /> Recarregar
            </button>
            <button type="button" className={`${btn} bg-white/10 border-white/20 hover:bg-white/20`} onClick={() => { try { navigator.clipboard.writeText(this.details()); } catch { /* sem área de transferência */ } }}>
              <Copy size={15} /> Copiar detalhes
            </button>
            <button type="button" className={`${btn} bg-red-500/15 border-red-500/40 text-red-300 hover:bg-red-500/25`} onClick={() => {
              for (const k of DATA_KEYS) { try { localStorage.removeItem(k); } catch { /* indisponível */ } }
              window.location.reload();
            }}>
              <RefreshCw size={15} /> Restaurar dados locais
            </button>
          </div>
        </div>
      </div>
    );
  }
}

export default ErrorBoundary;
