// Lista dos itens que serão excluídos, com a capa de cada um (dentro dos pop-ups de confirmação)
export interface ConfirmItem {
  id: string;
  title: string;
  subtitle?: string;
  cover: string;
  /** Capa de livro (retrato) ou de texto (quadrada) */
  shape?: 'book' | 'square';
}

export function ConfirmItemList({ items }: { items: ConfirmItem[] }) {
  if (items.length === 0) return null;
  return (
    <div className="max-h-[220px] overflow-y-auto custom-scrollbar -mx-1 px-1 mb-4 space-y-1">
      {items.map(item => (
        <div key={item.id} className="flex items-center gap-3 p-1.5 rounded-2xl bg-black/5 dark:bg-white/5">
          <img
            src={item.cover}
            alt=""
            draggable={false}
            className={`shrink-0 object-cover shadow-sm border border-white/10 ${item.shape === 'square' ? 'w-9 h-9 rounded-xl' : 'w-8 h-12 rounded-lg'}`}
          />
          <div className="min-w-0">
            <p className="text-xs font-bold text-[var(--text-main)] truncate">{item.title}</p>
            {item.subtitle && <p className="text-[11px] text-[var(--text-muted)] truncate">{item.subtitle}</p>}
          </div>
        </div>
      ))}
    </div>
  );
}

export default ConfirmItemList;
