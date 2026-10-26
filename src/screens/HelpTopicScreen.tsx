// ===== Tela: tópico da Ajuda =====
// Mesmo modelo do Audiobook Player: introdução, passo a passo numerado, recursos e detalhes em duas
// colunas e perguntas frequentes.
import { motion } from 'motion/react';
import { transicaoConteudo } from '../navigation/transitions';
import { useApp } from '../app/AppContext';
import { HELP_TOPICS } from '../data/helpTopics';

export function HelpTopicScreen() {
  const { helpTopicId } = useApp();
  const topic = HELP_TOPICS.find(tp => tp.id === helpTopicId);
  if (!topic) return null;
  return (
    <motion.div
      key={`screen-help-topic-${topic.id}`}
      variants={transicaoConteudo}
      initial="escondido"
      animate="visivel"
      exit="saindo"
      className="w-full flex flex-col"
    >
      <h1 className="text-4xl md:text-5xl font-semibold tracking-tight text-[var(--text-main)] mb-8">
        {topic.title}
      </h1>

      <p className="text-base md:text-lg leading-relaxed text-[var(--text-main)]/90 mb-12">
        {topic.intro}
      </p>

      <section className="mb-12">
        <h2 className="text-xl font-bold text-[var(--text-main)] mb-6">Passo a passo</h2>
        <ol className="space-y-7">
          {topic.steps.map((step, i) => (
            <li key={step.title} className="flex items-start gap-5">
              <span className="w-10 h-10 shrink-0 rounded-full bg-winblue/10 border border-winblue/30 text-winblue text-sm font-bold flex items-center justify-center">
                {i + 1}
              </span>
              <div className="min-w-0 pt-0.5">
                <h3 className="text-base font-bold text-[var(--text-main)]">{step.title}</h3>
                <p className="text-sm text-[var(--text-muted)] leading-relaxed mt-1.5">{step.text}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="mb-12">
        <h2 className="text-xl font-bold text-[var(--text-main)] mb-6">Recursos e detalhes</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-12 gap-y-8">
          {topic.features.map(feature => {
            const Icon = feature.icon;
            return (
              <div key={feature.title} className="flex items-start gap-4">
                <span className="w-11 h-11 shrink-0 rounded-2xl bg-winblue/10 text-winblue flex items-center justify-center">
                  <Icon size={20} />
                </span>
                <div className="min-w-0">
                  <h3 className="text-sm font-bold text-[var(--text-main)]">{feature.title}</h3>
                  <p className="text-sm text-[var(--text-muted)] leading-relaxed mt-1">{feature.text}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {topic.faq && topic.faq.length > 0 && (
        <section className="mb-4">
          <h2 className="text-xl font-bold text-[var(--text-main)] mb-6">Perguntas frequentes</h2>
          <div className="space-y-2.5">
            {topic.faq.map(item => (
              <div key={item.q} className="py-4 px-5 rounded-[28px] bg-card/60 backdrop-blur-xl border border-[var(--text-main)]/10">
                <h3 className="text-sm font-bold text-[var(--text-main)]">{item.q}</h3>
                <p className="text-sm text-[var(--text-muted)] leading-relaxed mt-1.5">{item.a}</p>
              </div>
            ))}
          </div>
        </section>
      )}
    </motion.div>
  );
}
