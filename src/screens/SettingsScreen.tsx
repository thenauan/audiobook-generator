// ===== Tela: settings-hub =====
import { motion } from 'motion/react';
import { FolderOpen, Info, Palette, Mic } from 'lucide-react';
import { transicaoConteudo } from '../navigation/transitions';
import { ListGroup, ListRow } from '../components/Blocks';
import { APP_VERSION } from '../app/screens';
import { ScreenId } from '../app/types';
import { useApp } from '../app/AppContext';

export function SettingsScreen() {
  const { navigateTo, t } = useApp();
  return (
    <motion.div
      key="screen-settings-hub"
      variants={transicaoConteudo}
      initial="escondido"
      animate="visivel"
      exit="saindo"
      className="w-full flex flex-col"
    >
      <h1 className="text-4xl md:text-5xl font-semibold tracking-tight text-[var(--text-main)] mb-12 max-md:mb-6">
        {t.settings}
      </h1>

      <div className="max-md:mt-0">
        <ListGroup>
          {[
            { id: 'settings-interface', title: 'Interface', subtitle: 'Personalize a aparência do aplicativo', icon: <Palette size={18} />, gradient: 'from-violet-500 to-pink-600' },
            { id: 'settings-conversion', title: 'Conversão de Áudio', subtitle: 'Formato de arquivo, qualidade e vozes neurais', icon: <Mic size={18} />, gradient: 'from-blue-500 to-cyan-600' },
            { id: 'settings-storage', title: 'Armazenamento & Pastas', subtitle: 'Diretório de exportação de áudio e limpeza de cache', icon: <FolderOpen size={18} />, gradient: 'from-amber-500 to-rose-500' },
            { id: 'settings-about', title: 'Sistema e Sobre', subtitle: `Informações da versão v${APP_VERSION}, atalhos e licença`, icon: <Info size={18} />, gradient: 'from-slate-500 to-slate-700' },
          ].map(row => (
            <ListRow
              key={row.id}
              icon={row.icon}
              iconGradient={row.gradient}
              title={row.title}
              subtitle={row.subtitle}
              onClick={() => navigateTo(row.id as ScreenId)}
            />
          ))}
        </ListGroup>
      </div>
    </motion.div>
  );
}
