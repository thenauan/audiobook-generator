// ===== Tela de novidades =====
// Igual à do Audiobook Player: aparece uma vez depois de o app ser atualizado, com o fundo em movimento na cor de
// destaque. Ao publicar uma versão, acrescente aqui as novidades dela: sem novidades cadastradas, a tela não aparece.
import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowRight } from 'lucide-react';
import { AppGlyph } from './AppGlyph';
import { AmbientOrbs } from './AmbientOrbs';
import { APP_VERSION } from '../app/screens';

type Notes = { pt: string[]; en: string[] };

const RELEASE_NOTES: Record<string, Notes> = {
  '1.6.3': {
    pt: ['Tela de novidades depois de cada atualização', 'Telas iniciais e área de arrastar na cor de destaque escolhida', 'Botões dos Ajustes com destaque e sombra', 'Mesmo visual do Audiobook Player'],
    en: ['A what\'s new screen after every update', 'Start screens and the drop area in your chosen accent color', 'Settings buttons with highlight and shadow', 'Same look as the Audiobook Player'],
  },
};

const KEY = 'app_last_seen_version';
const read = (k: string) => { try { return localStorage.getItem(k); } catch { return null; } };
const write = (k: string, v: string) => { try { localStorage.setItem(k, v); } catch { /* bloqueado */ } };

function initialVisible(): boolean {
  const seen = read(KEY);
  // Sem versão gravada: quem acabou de instalar (ainda sem boas-vindas) não precisa das novidades; quem já usava, sim
  if (!seen && read('has_seen_welcome_v3') !== 'true') { write(KEY, APP_VERSION); return false; }
  if (seen === APP_VERSION) return false;
  if (!RELEASE_NOTES[APP_VERSION]) { write(KEY, APP_VERSION); return false; }
  return true;
}

export function WhatsNewScreen() {
  const [visible, setVisible] = useState(initialVisible);
  const lang = (read('app_interface_lang') || 'pt-BR').startsWith('pt') ? 'pt' : 'en';
  const notes = RELEASE_NOTES[APP_VERSION]?.[lang] ?? [];
  const close = () => { write(KEY, APP_VERSION); setVisible(false); };
  const title = lang === 'pt' ? `App atualizado para a versão ${APP_VERSION}` : `App updated to version ${APP_VERSION}`;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="whats-new"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.2 } }}
          className="fixed inset-0 z-[9800] overflow-y-auto bg-mica text-[var(--text-main)] select-none isolate"
        >
          <AmbientOrbs className="fixed" intensity={1.6} />
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 26 }}
            className="relative w-full max-w-xl mx-auto min-h-full flex flex-col items-center justify-center text-center px-6 py-12"
          >
            <div className="flex items-baseline tracking-tight mb-2 gap-[2px] text-[42px] leading-none">
              <AppGlyph size="0.72em" className="shrink-0" />
              <span className="font-normal" translate="no">Generator</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-semibold tracking-tight mt-1">{title}</h2>
            {/* Vidro claro, sem sombra: deixa ver o fundo em movimento */}
            <ul
              className="w-full max-w-md mt-7 p-2 rounded-[26px] bg-[var(--ios-fill)] text-left rtl:text-right"
              style={{ backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}
            >
              {notes.map(note => (
                <li key={note} className="flex items-start gap-3 px-3 py-2.5 text-sm sm:text-[15px] leading-snug text-[var(--text-main)]/90">
                  <span aria-hidden="true" className="mt-[0.45em] w-1.5 h-1.5 rounded-full bg-current opacity-70 shrink-0" />
                  <span>{note}</span>
                </li>
              ))}
            </ul>
            <motion.button
              type="button"
              data-press="true"
              data-hover-grow
              onClick={close}
              className="mt-8 h-12 px-6 rounded-full bg-winblue text-white shadow-lg font-semibold text-sm flex items-center justify-center gap-2.5 transition-all cursor-pointer"
            >
              <span>{lang === 'pt' ? 'Ir para o app' : 'Go to the app'}</span>
              <ArrowRight size={18} className="shrink-0 rtl:rotate-180" />
            </motion.button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default WhatsNewScreen;
