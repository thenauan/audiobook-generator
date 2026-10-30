// Card de um texto gerado (Convertidos e "Meus Textos"): capa quadrada, título, informações básicas
// e o botão de opções, que aparece ao passar o mouse. No modo de seleção, o clique marca o item.
import { motion } from 'motion/react';
import { MoreHorizontal } from 'lucide-react';
import { clearButtonCoverAnchorCache } from '../Popovers';
import { getGenericTextCover } from '../../lib/covers';
import { SelectionCheck } from '../SelectionCheck';
import { useApp } from '../../app/AppContext';
import type { GeneratedTextItem } from '../../app/types';

export function TextTile({ text }: { text: GeneratedTextItem }) {
  const { activeTextMenu, setActiveTextMenu, setViewingTextAnchor, setViewingTextModal, selectingConverted, selectedConverted, toggleConvertedSelection } = useApp();
  const isMenuOpen = activeTextMenu?.item.id === text.id;
  const coverUrl = text.cover || getGenericTextCover(text.title, text.author, text.coverColor);
  const selectionKey = `text:${text.id}`;
  const info = `${text.author ? `${text.author} • ` : ''}${text.genre} • ${text.wordCount} palavras`;

  return (
    <div
      onClick={(e) => {
        if (selectingConverted) { toggleConvertedSelection(selectionKey); return; }
        setViewingTextAnchor(e.currentTarget);
        setViewingTextModal(text);
      }}
      className="flex flex-col group/textcard relative cursor-pointer"
    >
      <div className="aspect-square w-full rounded-[24px] shadow-lg group-hover/textcard:scale-[1.02] transition-all relative overflow-hidden bg-card/60">
        <SelectionCheck active={selectingConverted} selected={selectedConverted.includes(selectionKey)} onToggle={() => toggleConvertedSelection(selectionKey)} rounded="rounded-[24px]" />
        <img
          src={coverUrl}
          alt={text.title}
          className="w-full h-full aspect-square object-cover rounded-[24px] transition-transform duration-500 group-hover/textcard:scale-105"
        />
      </div>

      <div className="flex items-start justify-between gap-1.5 mt-2.5 px-0.5 relative">
        <div className="flex-1 min-w-0 pr-1">
          <h4 title={text.title} className="font-bold text-sm text-[var(--text-main)] truncate group-hover/textcard:text-winblue transition-colors">
            {text.title}
          </h4>
          <p title={info} className="text-xs text-[var(--text-muted)] truncate mt-0.5">
            {info}
          </p>
        </div>

        <div className={`relative w-8 h-8 shrink-0 ${selectingConverted ? 'invisible' : isMenuOpen ? 'opacity-100' : 'opacity-0 group-hover/textcard:opacity-100'} transition-opacity duration-200`}>
          <motion.button
            whileHover={{ scale: 1.15 }}
            whileTap={{ scale: 0.92 }}
            animate={isMenuOpen ? { scale: 1.22, opacity: 0, pointerEvents: 'none' } : { scale: 1, opacity: 1, pointerEvents: 'auto' }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            onClick={(e) => {
              e.stopPropagation();
              clearButtonCoverAnchorCache(e.currentTarget);
              setActiveTextMenu({ item: text, anchorEl: e.currentTarget });
            }}
            className="w-8 h-8 flex items-center justify-center rounded-full backdrop-blur-3xl border border-[var(--text-main)]/10 text-[var(--text-main)] bg-card/75 hover:bg-white/15 hover:border-white/25 hover:shadow-[0_0_12px_rgba(255,255,255,0.2)] transition-all cursor-pointer"
            title="Opções do texto"
            aria-label={`Opções de ${text.title}`}
          >
            <MoreHorizontal size={16} />
          </motion.button>
        </div>
      </div>
    </div>
  );
}

export default TextTile;
