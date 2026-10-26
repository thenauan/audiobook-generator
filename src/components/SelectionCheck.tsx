// Marca de seleção sobre a capa dos itens de Convertidos (modo "selecionar para excluir").
// O pai precisa ser `relative`. Fica por cima da capa e captura o clique.
import { motion, AnimatePresence } from 'motion/react';
import { Check } from 'lucide-react';
import { cn } from '../lib/cn';

export function SelectionCheck({ active, selected, onToggle, rounded = 'rounded-3xl' }: { active: boolean; selected: boolean; onToggle: () => void; rounded?: string }) {
  return (
    <AnimatePresence>
      {active && (
        <motion.button
          type="button"
          key="selection"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          onClick={(e) => { e.stopPropagation(); onToggle(); }}
          aria-pressed={selected}
          aria-label={selected ? 'Desmarcar' : 'Selecionar'}
          className={cn(
            'absolute inset-0 z-20 cursor-pointer border-2 transition-[background-color,border-color,box-shadow] duration-200',
            rounded,
            selected ? 'bg-winblue/20 border-winblue shadow-[0_0_18px_rgba(var(--winblue-rgb),0.45)]' : 'bg-black/25 border-transparent hover:bg-black/15'
          )}
        >
          <motion.span
            initial={false}
            animate={selected ? { scale: 1 } : { scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 520, damping: 28 }}
            className={cn(
              'absolute top-2.5 right-2.5 w-7 h-7 rounded-full border-2 flex items-center justify-center shadow-lg',
              selected ? 'bg-winblue border-winblue text-white' : 'bg-black/35 border-white/80 text-transparent'
            )}
          >
            <Check size={15} strokeWidth={3} />
          </motion.span>
        </motion.button>
      )}
    </AnimatePresence>
  );
}

export default SelectionCheck;
