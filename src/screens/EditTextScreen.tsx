// ===== Tela: edit-text =====
import { motion } from 'motion/react';
import { Check, X } from 'lucide-react';
import { transicaoConteudo } from '../navigation/transitions';
import { GENERIC_COVER_COLORS, getGenericTextCover } from '../lib/covers';
import { useApp } from '../app/AppContext';

export function EditTextScreen() {
  const { editingText, editTextTitle, setEditTextTitle, editTextAuthor, setEditTextAuthor, editTextColor, setEditTextColor, editTextGenre, setEditTextGenre, editTextTone, setEditTextTone, editTextContent, setEditTextContent, handleSaveTextEdits, handleCancelTextEdits } = useApp();
  return (
    <motion.div
      key="screen-edit-text"
      variants={transicaoConteudo}
      initial="escondido"
      animate="visivel"
      exit="saindo"
      className="w-full flex flex-col gap-6 pb-24 pt-2 max-w-5xl mx-auto"
    >
      {/* Painel Superior: Capa Quadrada e Dados */}
      <div className="flex flex-col md:flex-row items-center md:items-start gap-8 w-full">
        {/* Coluna Esquerda: Capa Quadrada & Paleta de Cores */}
        <div className="flex flex-col items-center shrink-0">
          <div className="relative shrink-0 rounded-3xl overflow-hidden shadow-2xl w-[175px] h-[175px] aspect-square group">
            <img 
              src={getGenericTextCover(editTextTitle || editingText.title, editTextAuthor || editingText.author, editTextColor)} 
              alt={editTextTitle || editingText.title} 
              className="w-full h-full object-cover rounded-3xl transition-all aspect-square"
            />
          </div>

          {/* Seletor de cores da capa genérica */}
          <div className="mt-3.5 flex flex-col items-center gap-2 w-[175px]">
            <span className="text-xs font-semibold text-[var(--text-muted)]">
              Cor da capa
            </span>
            <div className="grid grid-cols-6 gap-x-3 gap-y-3.5 justify-items-center px-2.5 py-3 rounded-2xl bg-card/60 backdrop-blur-md border border-[var(--text-main)]/10 shadow-sm w-full">
              {GENERIC_COVER_COLORS.map(c => {
                const isSelected = editTextColor.toLowerCase() === c.hex.toLowerCase();
                return (
                  <button
                    key={c.id}
                    type="button"
                    title={c.name}
                    onClick={() => setEditTextColor(c.hex)}
                    style={{ backgroundColor: c.hex }}
                    className={`w-3.5 h-3.5 rounded-full flex items-center justify-center transition-all duration-150 cursor-pointer ${
                              isSelected 
                                ? 'ring-2 ring-winblue ring-offset-[1.5px] ring-offset-black/50 shadow-[0_0_10px_rgba(var(--winblue-rgb),0.5)] hover:shadow-[0_0_14px_rgba(var(--winblue-rgb),0.75)]' 
                                : 'opacity-85 hover:opacity-100 hover:ring-2 hover:ring-white/90 hover:ring-offset-[1.5px] hover:ring-offset-black/40 hover:shadow-[0_0_12px_rgba(255,255,255,0.75)]'
                            }`}
                  >
                    {isSelected && (
                      <Check size={9} strokeWidth={3.5} className="text-winblue drop-shadow-[0_1px_2px_rgba(0,0,0,0.85)] shrink-0 pointer-events-none" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Coluna Direita: Metadados do Texto */}
        <div className="flex-1 space-y-4 w-full">
          <div>
            <label className="text-xs font-semibold text-[var(--text-muted)] block mb-1.5">
              Título do texto
            </label>
            <input 
              type="text"
              value={editTextTitle}
              onChange={(e) => setEditTextTitle(e.target.value)}
              className="w-full h-11 px-4 rounded-2xl bg-card/75 border border-[var(--text-main)]/10 text-[var(--text-main)] text-sm font-semibold shadow-sm backdrop-blur-3xl focus:outline-none focus:border-winblue/60 focus:ring-2 focus:ring-winblue/30 focus:shadow-[0_0_15px_rgba(var(--winblue-rgb),0.35)] transition-all"
              placeholder="Título do texto"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-[var(--text-muted)] block mb-1.5">
              Autor
            </label>
            <input 
              type="text"
              value={editTextAuthor}
              onChange={(e) => setEditTextAuthor(e.target.value)}
              className="w-full h-11 px-4 rounded-2xl bg-card/75 border border-[var(--text-main)]/10 text-[var(--text-main)] text-sm font-semibold shadow-sm backdrop-blur-3xl focus:outline-none focus:border-winblue/60 focus:ring-2 focus:ring-winblue/30 focus:shadow-[0_0_15px_rgba(var(--winblue-rgb),0.35)] transition-all"
              placeholder="Autor"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-[var(--text-muted)] block mb-1.5">
                Gênero
              </label>
              <input 
                type="text"
                value={editTextGenre}
                onChange={(e) => setEditTextGenre(e.target.value)}
                className="w-full h-11 px-4 rounded-2xl bg-card/75 border border-[var(--text-main)]/10 text-[var(--text-main)] text-sm font-semibold shadow-sm backdrop-blur-3xl focus:outline-none focus:border-winblue/60 focus:ring-2 focus:ring-winblue/30 focus:shadow-[0_0_15px_rgba(var(--winblue-rgb),0.35)] transition-all"
                placeholder="Ex: Fantasia, Ficção Científica, Romance..."
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-[var(--text-muted)] block mb-1.5">
                Tom / Estilo
              </label>
              <input 
                type="text"
                value={editTextTone}
                onChange={(e) => setEditTextTone(e.target.value)}
                className="w-full h-11 px-4 rounded-2xl bg-card/75 border border-[var(--text-main)]/10 text-[var(--text-main)] text-sm font-semibold shadow-sm backdrop-blur-3xl focus:outline-none focus:border-winblue/60 focus:ring-2 focus:ring-winblue/30 focus:shadow-[0_0_15px_rgba(var(--winblue-rgb),0.35)] transition-all"
                placeholder="Ex: Épico, Reflexivo, Dramático, Neutro..."
              />
            </div>
          </div>
        </div>
      </div>

      {/* Caixa de Texto Enorme com o Conteúdo */}
      <div className="w-full flex-1 flex flex-col space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xl font-bold text-[var(--text-main)]">
            Conteúdo do texto
          </label>
          <div className="flex items-center gap-2.5 text-xs text-[var(--text-muted)] font-medium">
            <span className="px-3 py-1 rounded-full bg-card/75 border border-[var(--text-main)]/10 shadow-xs">
              {editTextContent.trim().split(/\s+/).filter(Boolean).length} palavras
            </span>
            <span className="px-3 py-1 rounded-full bg-card/75 border border-[var(--text-main)]/10 shadow-xs">
              {editTextContent.length.toLocaleString('pt-BR')} caracteres
            </span>
          </div>
        </div>

        <div className="relative w-full flex-1 min-h-[500px]">
          <textarea 
            value={editTextContent}
            onChange={(e) => setEditTextContent(e.target.value)}
            className="w-full h-[540px] p-5 rounded-3xl bg-card/75 border border-[var(--text-main)]/10 text-[var(--text-main)] text-sm leading-relaxed shadow-sm backdrop-blur-3xl focus:outline-none focus:border-winblue/60 focus:ring-2 focus:ring-winblue/30 focus:shadow-[0_0_20px_rgba(var(--winblue-rgb),0.25)] transition-all resize-y custom-scrollbar font-normal"
            placeholder="Digite ou edite o conteúdo do seu texto aqui..."
            rows={22}
          />
        </div>
      </div>

      {/* Botões de Ação na Parte Inferior */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <motion.button
          type="button"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleCancelTextEdits}
          className="h-10 px-5 rounded-full bg-card/75 backdrop-blur-3xl border border-[var(--text-main)]/10 text-xs font-semibold text-[var(--text-main)] shadow-xl hover:bg-white/15 hover:border-white/25 hover:shadow-[0_0_15px_rgba(255,255,255,0.25)] transition-all cursor-pointer inline-flex items-center gap-1.5"
        >
          <X size={13} className="shrink-0" />
          <span>Cancelar</span>
        </motion.button>
        <motion.button
          type="button"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleSaveTextEdits}
          className="h-10 px-6 rounded-full bg-winblue/20 border border-winblue/45 shadow-xl backdrop-blur-3xl hover:bg-winblue/30 hover:border-winblue/75 hover:shadow-[0_20px_25px_-5px_rgba(0,0,0,0.25),0_0_22px_rgba(var(--winblue-rgb),0.45)] text-winblue text-xs font-bold transition-all flex items-center gap-2 cursor-pointer"
        >
          <Check size={15} />
          <span>Salvar alterações</span>
        </motion.button>
      </div>
    </motion.div>
  );
}
