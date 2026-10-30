// ===== Tela: settings-interface =====
import { motion } from 'motion/react';
import { Moon, ChevronDown, Globe, Palette, Type, Monitor, Sun, AArrowDown, AArrowUp, Feather } from 'lucide-react';
import { SettingToggle } from '../components/cards/SettingToggle';
import { transicaoConteudo } from '../navigation/transitions';
import { useApp } from '../app/AppContext';

export function SettingsInterfaceScreen() {
  const { accentPalette, accentColor, setAccentColor, themeMode, setThemeMode, uiFontSize, setUiFontSize, interfaceLang, setInterfaceLang, activeSettingSelector, setActiveSettingSelector , liteMode, setLiteMode } = useApp();
  return (
    <motion.div
      key="screen-settings-interface"
      variants={transicaoConteudo}
      initial="escondido"
      animate="visivel"
      exit="saindo"
      className="w-full flex flex-col"
    >
      <div className="mb-12 max-md:mb-6">
        <h1 className="text-4xl md:text-5xl font-semibold text-[var(--text-main)] tracking-tight">Interface</h1>
      </div>

      <div className="space-y-2.5">
        {/* 1. Tema */}
        <div className="settings-list-row py-3 sm:py-3.5 px-4 sm:px-5 rounded-[32px] bg-card/60 backdrop-blur-xl border border-[var(--text-main)]/10 transition-colors flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-winblue/10 text-winblue flex items-center justify-center shrink-0">
              <Moon size={20} />
            </div>
            <div className="flex flex-col">
              <span className="font-semibold text-base text-[var(--text-main)]">Tema</span>
              <span className="text-xs sm:text-sm text-[var(--text-muted)] mt-0.5">Aparência clara, escura ou automática</span>
            </div>
          </div>
          <motion.button 
            whileHover={{ scale: 1.06 }} 
            whileTap={{ scale: 0.94 }}
            animate={activeSettingSelector?.id === 'theme' ? { scale: 1.22, opacity: 0, pointerEvents: 'none' } : { scale: 1, opacity: 1, pointerEvents: 'auto' }}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
            onClick={(e) => {
              e.stopPropagation();
              setActiveSettingSelector({
                hideTitle: true,
                id: 'theme',
                captions: true,
                triggerEl: e.currentTarget,
                title: 'Tema',
                subtitle: 'Aparência clara, escura ou automática',
                currentValue: themeMode,
                options: [
                  { value: 'system', label: 'Modo do sistema', description: 'Muda junto com o tema do Windows', icon: <Monitor size={14} className="shrink-0" /> },
                  { value: 'light', label: 'Claro', description: 'Fundo claro, bom para ambientes iluminados', icon: <Sun size={14} className="shrink-0" /> },
                  { value: 'dark', label: 'Escuro', description: 'Fundo escuro, descansa a vista à noite', icon: <Moon size={14} className="shrink-0" /> },
                ],
                onSelect: (val) => setThemeMode(val)
              });
            }}
            className="h-8 pl-3.5 pr-2.5 rounded-full bg-card/75 backdrop-blur-3xl border border-[var(--text-main)]/10 shadow-sm text-[var(--text-main)] hover:bg-white/15 hover:border-white/25 hover:shadow-[0_0_12px_rgba(255,255,255,0.2)] flex items-center gap-1.5 text-xs font-semibold transition-all shrink-0 cursor-pointer [&_svg]:text-inherit"
          >
            <span>{themeMode === 'system' ? 'Modo do sistema' : themeMode === 'light' ? 'Claro' : 'Escuro'}</span>
            <ChevronDown size={14} className="-mr-0.5 text-inherit" />
          </motion.button>
        </div>

        {/* 2. Cor de destaque */}
        <div className="settings-list-row py-3 sm:py-3.5 px-4 sm:px-5 rounded-[32px] bg-card/60 backdrop-blur-xl border border-[var(--text-main)]/10 transition-colors flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-winblue/10 text-winblue flex items-center justify-center shrink-0">
              <Palette size={20} />
            </div>
            <div className="flex flex-col">
              <span className="font-semibold text-base text-[var(--text-main)]">Cor de destaque</span>
              <span className="text-xs sm:text-sm text-[var(--text-muted)] mt-0.5">Cor principal dos botões e detalhes</span>
            </div>
          </div>
          <motion.button 
            whileHover={{ scale: 1.06 }} 
            whileTap={{ scale: 0.94 }}
            animate={activeSettingSelector?.id === 'accent-color' ? { scale: 1.22, opacity: 0, pointerEvents: 'none' } : { scale: 1, opacity: 1, pointerEvents: 'auto' }}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
            onClick={(e) => {
              e.stopPropagation();
              setActiveSettingSelector({
                hideTitle: true,
                id: 'accent-color',
                triggerEl: e.currentTarget,
                title: 'Cor de destaque',
                subtitle: 'Cor principal dos botões e detalhes',
                currentValue: accentColor,
                options: Object.entries(accentPalette).map(([key, item]) => ({
                  value: key,
                  label: item.name,
                  colorPreview: item.hex,
                })),
                onSelect: (val) => setAccentColor(val)
              });
            }}
            className="h-8 pl-3 pr-2.5 rounded-full bg-card/75 backdrop-blur-3xl border border-[var(--text-main)]/10 shadow-sm text-[var(--text-main)] hover:bg-white/15 hover:border-white/25 hover:shadow-[0_0_12px_rgba(255,255,255,0.2)] flex items-center gap-1.5 text-xs font-semibold transition-all shrink-0 cursor-pointer [&_svg]:text-inherit"
          >
            <div className="w-3.5 h-3.5 rounded-full border border-black/10 dark:border-white/20 shrink-0" style={{ backgroundColor: accentPalette[accentColor]?.hex || '#0086F0' }} />
            <span>{accentPalette[accentColor]?.name || 'Azul'}</span>
            <ChevronDown size={14} className="-mr-0.5 text-inherit" />
          </motion.button>
        </div>

        {/* Modo leve */}
        <div className="settings-list-row py-3 sm:py-3.5 px-4 sm:px-5 rounded-[32px] bg-card/60 backdrop-blur-xl border border-[var(--text-main)]/10 transition-colors flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-winblue/10 text-winblue flex items-center justify-center shrink-0">
              <Feather size={20} />
            </div>
            <div className="flex flex-col">
              <span className="font-semibold text-base text-[var(--text-main)]">Modo leve</span>
              <span className="text-xs sm:text-sm text-[var(--text-muted)] mt-0.5">Para computadores mais fracos: sem desfoque e com fundos de cor parados</span>
            </div>
          </div>
          <SettingToggle checked={liteMode} onChange={setLiteMode} enabledLabel="Ligado" disabledLabel="Desligado" />
        </div>

        {/* 3. Tamanho da fonte */}
        <div className="settings-list-row py-3 sm:py-3.5 px-4 sm:px-5 rounded-[32px] bg-card/60 backdrop-blur-xl border border-[var(--text-main)]/10 transition-colors flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-winblue/10 text-winblue flex items-center justify-center shrink-0">
              <Type size={20} />
            </div>
            <div className="flex flex-col">
              <span className="font-semibold text-base text-[var(--text-main)]">Tamanho da fonte</span>
              <span className="text-xs sm:text-sm text-[var(--text-muted)] mt-0.5">Ajuste o tamanho do texto</span>
            </div>
          </div>
          <motion.button 
            whileHover={{ scale: 1.06 }} 
            whileTap={{ scale: 0.94 }}
            animate={activeSettingSelector?.id === 'font-size' ? { scale: 1.22, opacity: 0, pointerEvents: 'none' } : { scale: 1, opacity: 1, pointerEvents: 'auto' }}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
            onClick={(e) => {
              e.stopPropagation();
              setActiveSettingSelector({
                hideTitle: true,
                id: 'font-size',
                captions: true,
                triggerEl: e.currentTarget,
                title: 'Tamanho da fonte',
                subtitle: 'Ajuste o tamanho do texto',
                currentValue: uiFontSize,
                options: [
                  { value: 'small', label: 'Pequena', description: 'Cabe mais conteúdo na tela (85%)', icon: <AArrowDown size={14} className="shrink-0" /> },
                  { value: 'standard', label: 'Padrão', description: 'Tamanho original do app (100%)', icon: <Type size={14} className="shrink-0" /> },
                  { value: 'large', label: 'Grande', description: 'Textos maiores, mais fáceis de ler (118%)', icon: <AArrowUp size={14} className="shrink-0" /> },
                ],
                onSelect: (val) => setUiFontSize(val)
              });
            }}
            className="h-8 pl-3.5 pr-2.5 rounded-full bg-card/75 backdrop-blur-3xl border border-[var(--text-main)]/10 shadow-sm text-[var(--text-main)] hover:bg-white/15 hover:border-white/25 hover:shadow-[0_0_12px_rgba(255,255,255,0.2)] flex items-center gap-1.5 text-xs font-semibold transition-all shrink-0 cursor-pointer [&_svg]:text-inherit"
          >
            <span>{uiFontSize === 'small' ? 'Pequena' : uiFontSize === 'large' ? 'Grande' : 'Padrão'}</span>
            <ChevronDown size={14} className="-mr-0.5 text-inherit" />
          </motion.button>
        </div>

        {/* 4. Idioma */}
        <div className="settings-list-row py-3 sm:py-3.5 px-4 sm:px-5 rounded-[32px] bg-card/60 backdrop-blur-xl border border-[var(--text-main)]/10 transition-colors flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-winblue/10 text-winblue flex items-center justify-center shrink-0">
              <Globe size={20} />
            </div>
            <div className="flex flex-col">
              <span className="font-semibold text-base text-[var(--text-main)]">Idioma</span>
              <span className="text-xs sm:text-sm text-[var(--text-muted)] mt-0.5">Selecione o idioma da interface</span>
            </div>
          </div>
          <motion.button 
            whileHover={{ scale: 1.06 }} 
            whileTap={{ scale: 0.94 }}
            animate={activeSettingSelector?.id === 'language' ? { scale: 1.22, opacity: 0, pointerEvents: 'none' } : { scale: 1, opacity: 1, pointerEvents: 'auto' }}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
            onClick={(e) => {
              e.stopPropagation();
              setActiveSettingSelector({
                hideTitle: true,
                id: 'language',
                triggerEl: e.currentTarget,
                title: 'Idioma',
                subtitle: 'Selecione o idioma da interface',
                currentValue: interfaceLang,
                options: [
                  { value: 'pt-BR', label: 'Idioma do sistema (Português)', description: 'Português do Brasil', icon: <span className="text-sm leading-none">🇧🇷</span> },
                  { value: 'en-US', label: 'English (US)', description: 'United States', icon: <span className="text-sm leading-none">🇺🇸</span> },
                  { value: 'es-ES', label: 'Español (ES)', description: 'España', icon: <span className="text-sm leading-none">🇪🇸</span> },
                  { value: 'ar-SA', label: 'العربية (SA)', description: 'المملكة العربية السعودية', icon: <span className="text-sm leading-none">🇸🇦</span> },
                  { value: 'ru-RU', label: 'Русский', description: 'Россия', icon: <span className="text-sm leading-none">🇷🇺</span> },
                ],
                onSelect: (val) => setInterfaceLang(val)
              });
            }}
            className="h-8 pl-3.5 pr-2.5 rounded-full bg-card/75 backdrop-blur-3xl border border-[var(--text-main)]/10 shadow-sm text-[var(--text-main)] hover:bg-white/15 hover:border-white/25 hover:shadow-[0_0_12px_rgba(255,255,255,0.2)] flex items-center gap-1.5 text-xs font-semibold transition-all shrink-0 cursor-pointer [&_svg]:text-inherit"
          >
            <span>
              {interfaceLang === 'pt-BR' ? 'Idioma do sistema (Português)' : interfaceLang === 'en-US' ? 'English (US)' : interfaceLang === 'es-ES' ? 'Español (ES)' : interfaceLang === 'ru-RU' ? 'Русский' : 'العربية (SA)'}
            </span>
            <ChevronDown size={14} className="-mr-0.5 text-inherit" />
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}
