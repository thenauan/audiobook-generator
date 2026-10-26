// ===== Tela: Ajuda =====
// Faixas em gradiente (como no Audiobook Player); cada uma abre a tela do tópico (HelpTopicScreen).
import { motion } from 'motion/react';
import { transicaoConteudo } from '../navigation/transitions';
import { useApp } from '../app/AppContext';
import { HELP_TOPICS } from '../data/helpTopics';

export function HelpScreen() {
  const { t, openHelpTopic } = useApp();

  return (
    <motion.div
      key="screen-help"
      variants={transicaoConteudo}
      initial="escondido"
      animate="visivel"
      exit="saindo"
      className="w-full flex flex-col"
    >
      <h1 className="text-4xl md:text-5xl font-semibold tracking-tight text-[var(--text-main)] mb-12 max-md:mb-6">
        {t.help}
      </h1>

      <div className="space-y-5">
        {HELP_TOPICS.map(topic => {
          const Icon = topic.icon;
          return (
            <motion.button
              key={topic.id}
              type="button"
              whileTap={{ scale: 0.985 }}
              onClick={() => openHelpTopic(topic.id)}
              className={`relative isolate w-full h-[88px] px-6 rounded-[32px] overflow-hidden bg-gradient-to-r ${topic.gradient} border border-white/15 shadow-lg hover:shadow-xl hover:border-white/30 transition-[box-shadow,border-color] text-left rtl:text-right flex flex-col justify-center cursor-pointer group`}
            >
              <span
                aria-hidden="true"
                className="absolute -right-3 rtl:right-auto rtl:-left-3 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none transition-transform duration-500 ease-out group-hover:scale-[1.3] group-hover:-rotate-6"
              >
                <Icon size={112} strokeWidth={1.25} />
              </span>
              {/* Ao passar o mouse, o card não cresce: o texto e o ícone de fundo é que dão zoom */}
              <span className="relative z-10 flex flex-col min-w-0 pr-24 origin-left rtl:origin-right transition-transform duration-500 ease-out group-hover:scale-[1.06]">
                <span className="text-lg sm:text-xl font-bold text-white tracking-tight drop-shadow-sm truncate">{topic.title}</span>
                <span className="text-xs sm:text-sm text-white/85 font-medium mt-0.5 truncate">{topic.subtitle}</span>
              </span>
            </motion.button>
          );
        })}
      </div>

    </motion.div>
  );
}
