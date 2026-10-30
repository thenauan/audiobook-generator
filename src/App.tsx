// ===== Casco do app =====
// Menu lateral (computador), barra de abas (celular), cabeçalho com desfoque progressivo e a área das
// telas com as transições do esqueleto. O estado fica em app/useAppState.tsx; cada tela em screens/.
import { lazy, Suspense } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Settings as SettingsIcon, BookHeadphones, HelpCircle, ChevronLeft, X, Pause, Play, MoreVertical, FileText, Power, CheckCircle2, Loader2 } from 'lucide-react';
import { RiApps2Line, RiAiGenerateText } from 'react-icons/ri';
import { Sidebar } from './components/Navigation';
import { HeaderActionButtons } from './components/HeaderActionButtons';
import { clearButtonCoverAnchorCache } from './components/Popovers';
import { getGenericBookCover, getGenericTextCover } from './lib/covers';
import { cn } from './lib/cn';
import { AppContext } from './app/AppContext';
import { useAppState } from './app/useAppState';
import { DevCrashScreen } from './app/DevCrashScreen';
import { Overlays } from './app/Overlays';
import { ConverterScreen } from './screens/ConverterScreen';
import { AppGlyph, AiStarsIcon } from './components/AppGlyph';

// Telas carregadas só quando abertas (o app abre mais rápido); enquanto carregam, só um ícone girando
const Onboarding = lazy(() => import('./app/Onboarding').then(m => ({ default: m.Onboarding })));
const HistoryHubScreen = lazy(() => import('./screens/HistoryHubScreen').then(m => ({ default: m.HistoryHubScreen })));
const AllAudiobooksScreen = lazy(() => import('./screens/AllAudiobooksScreen').then(m => ({ default: m.AllAudiobooksScreen })));
const AllTextsScreen = lazy(() => import('./screens/AllTextsScreen').then(m => ({ default: m.AllTextsScreen })));
const EditAudiobookScreen = lazy(() => import('./screens/EditAudiobookScreen').then(m => ({ default: m.EditAudiobookScreen })));
const EditTextScreen = lazy(() => import('./screens/EditTextScreen').then(m => ({ default: m.EditTextScreen })));
const SearchScreen = lazy(() => import('./screens/SearchScreen').then(m => ({ default: m.SearchScreen })));
const OtherAppsScreen = lazy(() => import('./screens/OtherAppsScreen').then(m => ({ default: m.OtherAppsScreen })));
const HelpScreen = lazy(() => import('./screens/HelpScreen').then(m => ({ default: m.HelpScreen })));
const HelpTopicScreen = lazy(() => import('./screens/HelpTopicScreen').then(m => ({ default: m.HelpTopicScreen })));
const SettingsScreen = lazy(() => import('./screens/SettingsScreen').then(m => ({ default: m.SettingsScreen })));
const SettingsInterfaceScreen = lazy(() => import('./screens/SettingsInterfaceScreen').then(m => ({ default: m.SettingsInterfaceScreen })));
const SettingsConversionScreen = lazy(() => import('./screens/SettingsConversionScreen').then(m => ({ default: m.SettingsConversionScreen })));
const SettingsStorageScreen = lazy(() => import('./screens/SettingsStorageScreen').then(m => ({ default: m.SettingsStorageScreen })));
const SettingsAboutScreen = lazy(() => import('./screens/SettingsAboutScreen').then(m => ({ default: m.SettingsAboutScreen })));

function TelaCarregando() {
  return (
    <div className="w-full flex items-center justify-center py-24" role="status" aria-label="Carregando">
      <Loader2 size={28} className="animate-spin text-[var(--text-muted)]" />
    </div>
  );
}

export default function App() {
  const app = useAppState();
  const { mainScrollRef, isMobile, currentScreen, activeScreenKey, currentRoot, navigateBack, resolvedTheme, t, headerBlurRef, isTitleScrolledPast, editingBook, editingFileId, editingText, currentScreenTitle, getPreviousScreenTitle, headerActions, selectRoot, historyBadge, showBack, navigateTo, interfaceLang, showToast, playingSnippet, toggleSnippet, addToSearchHistory, setViewingTextModal, setViewingTextAnchor, activeBookMenu, setActiveBookMenu, activeTextMenu, setActiveTextMenu, searchInputRef, searchQuery, setSearchQuery, computedSearchResults, setIsDevModeActive, handleExitDevMode, devModeOptions, toastMessage } = app;

  // Primeira abertura: boas-vindas e configuração inicial antes do app
  if (app.showWelcomeModal || app.showInitialConfigModal) {
    return (
      <AppContext.Provider value={app}>
        <Suspense fallback={<div className="fixed inset-0 bg-mica flex items-center justify-center"><Loader2 size={28} className="animate-spin text-[var(--text-muted)]" /></div>}>
          <Onboarding />
        </Suspense>
        <Overlays />
      </AppContext.Provider>
    );
  }

  if (app.devCrashScreen) {
    return (
      <AppContext.Provider value={app}>
        <DevCrashScreen />
      </AppContext.Provider>
    );
  }

  return (
    <AppContext.Provider value={app}>
    <div className={`app-shell flex h-[100dvh] w-screen bg-mica text-main font-fluent select-none overflow-hidden transition-colors duration-500 relative pl-[272px] rtl:pl-0 rtl:pr-[272px] ${resolvedTheme === 'dark' ? 'dark' : ''}`}>
      {/* Menu lateral (computador) */}
      <Sidebar
        brand={
          <button type="button" onClick={() => selectRoot('converter')} className="flex items-center text-[17px] cursor-pointer select-none">
            <AppGlyph size={24} className="shrink-0" />
            <span className="whitespace-nowrap"><span className="font-bold">Audiobook</span><span className="font-normal">Generator</span></span>
          </button>
        }
        topItems={[
          { id: 'search', label: t.search, icon: <Search size={18} /> },
          { id: 'converter', label: t.converter, icon: <AiStarsIcon size={18} /> },
          { id: 'history', label: t.history, icon: <BookHeadphones size={18} />, badge: historyBadge, highlight: app.historyBadgeActive },
        ]}
        bottomItems={[
          { id: 'other-apps', label: t.otherApps, icon: <RiApps2Line size={18} /> },
          { id: 'help', label: t.help, icon: <HelpCircle size={18} /> },
          { id: 'settings', label: t.settings, icon: <SettingsIcon size={18} /> },
        ]}
        activeRoot={currentRoot}
        onSelect={selectRoot}
      />

      <main className="flex-1 min-w-0 h-full bg-transparent flex flex-col relative z-20">
        {/* Desfoque progressivo atrás do cabeçalho (aparece ao rolar) */}
        <div ref={headerBlurRef} aria-hidden="true" className="apple-header-blur fixed inset-x-0 top-0" style={{ ['--header-blur' as any]: 0 }}>
          <div className="apple-blur-layer" />
          <div className="apple-blur-layer" />
          <div className="apple-blur-layer" />
          <div className="apple-blur-layer" />
          <div className="apple-blur-layer" />
          <div className="apple-blur-layer" />
          <div className="apple-blur-tint" />
        </div>

        {/* Cabeçalho fixo: voltar, título central (ao rolar) e ações */}
        <div className="sticky top-0 z-40 w-full h-0">
          <div data-app-header="true" className="px-4 md:px-8 pt-[var(--app-header-top)] pb-5 flex items-center justify-between w-full bg-transparent pointer-events-none relative">
            <div className="flex items-center gap-4 pointer-events-auto shrink-0 z-10">
              <AnimatePresence mode="wait">
                {showBack && (
                  <motion.button
                    key="back-button"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.92, transition: { duration: 0.08 } }}
                    transition={{ type: 'spring', stiffness: 520, damping: 36, mass: 0.55 }}
                    whileHover={{ scale: 1.12 }}
                    whileTap={{ scale: 0.92 }}
                    onClick={navigateBack}
                    className={cn(
                      "h-9 flex items-center gap-1.5 px-4 rounded-full bg-card/75 border border-[var(--text-main)]/10 shadow-xl hover:bg-white/15 hover:border-white/25 hover:shadow-[0_0_15px_rgba(255,255,255,0.25)] text-[var(--text-main)] transition-all duration-200 backdrop-blur-3xl cursor-pointer",
                      // Celular: com o título no cabeçalho, o voltar vira só a seta (como no iOS)
                      isMobile && isTitleScrolledPast && "w-9 px-0 justify-center"
                    )}
                    aria-label={t.back}
                  >
                    <ChevronLeft size={14} className="text-[var(--text-main)] rtl:rotate-180 shrink-0" />
                    <span className={cn("text-xs font-medium text-[var(--text-main)] truncate max-w-xs max-md:max-w-[40vw]", isMobile && isTitleScrolledPast && "hidden")}>
                      {getPreviousScreenTitle()}
                    </span>
                  </motion.button>
                )}
              </AnimatePresence>
            </div>

            {/* Título que reaparece no centro do cabeçalho quando o título grande sai da tela */}
            <AnimatePresence>
              {isTitleScrolledPast && !toastMessage && currentScreen !== 'search' && currentScreenTitle && (
                <motion.div
                  key={`header-title-${activeScreenKey}`}
                  initial={{ opacity: 0, y: 7, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -5, scale: 0.96 }}
                  transition={{ type: 'spring', stiffness: 520, damping: 38, mass: 0.55 }}
                  className="absolute left-1/2 -translate-x-1/2 top-[var(--app-header-top)] h-9 flex items-center justify-center pointer-events-auto cursor-default z-30 max-w-[42%] sm:max-w-[50%] md:max-w-[58%]"
                  title={currentScreenTitle}
                >
                  <div className="relative flex items-center justify-center max-w-full">
                    <div className="absolute -inset-x-6 -inset-y-2 bg-black/15 dark:bg-black/50 rounded-full blur-xl -z-10 pointer-events-none" aria-hidden="true" />
                    <h2 className="text-lg md:text-[19px] font-bold text-[var(--text-main)] truncate tracking-tight text-center drop-shadow-[0_2px_10px_rgba(0,0,0,0.22)] dark:drop-shadow-[0_2px_14px_rgba(0,0,0,0.7)] select-none">
                      {currentScreenTitle}
                    </h2>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Avisos: no centro do cabeçalho (abaixo da barra na tela de Pesquisa) */}
            <AnimatePresence>
              {toastMessage && (
                <motion.div
                  key="toast"
                  role="status"
                  initial={{ opacity: 0, y: -10, scale: 0.92, x: '-50%' }}
                  animate={{ opacity: 1, y: 0, scale: 1, x: '-50%' }}
                  exit={{ opacity: 0, y: -8, scale: 0.92, x: '-50%' }}
                  transition={{ type: 'spring', stiffness: 520, damping: 36, mass: 0.55 }}
                  className={`absolute left-1/2 ${currentScreen === 'search' ? 'top-[calc(var(--app-header-top)+52px)]' : 'top-[var(--app-header-top)]'} z-50 h-9 max-w-[min(520px,50%)] px-4 rounded-full bg-card/90 backdrop-blur-3xl border border-winblue/60 shadow-[0_0_16px_rgba(var(--winblue-rgb),0.25)] text-xs font-semibold text-winblue pointer-events-none flex items-center gap-2`}
                >
                  <CheckCircle2 size={15} className="text-winblue shrink-0" />
                  <span className="truncate">{toastMessage}</span>
                </motion.div>
              )}
            </AnimatePresence>

              {/* Centro: Barra de Pesquisa no Cabeçalho (Exibida EXCLUSIVAMENTE na tela de Pesquisa) */}
              <AnimatePresence>
                {currentScreen === 'search' && (
                  <motion.div
                    key="header-search-bar-wrapper"
                    initial={{ opacity: 0, scale: 0.95, y: -6 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -6 }}
                    transition={{ type: "spring", stiffness: 500, damping: 35, mass: 0.55 }}
                    className="absolute max-md:left-4 max-md:right-4 md:left-1/2 md:-translate-x-1/2 top-[var(--app-header-top)] pointer-events-auto z-40"
                  >
                    <motion.div
                      animate={{ x: !isMobile && searchQuery.length > 0 ? (interfaceLang === 'ar-SA' ? 28 : -28) : 0 }}
                      transition={{ type: "spring", stiffness: 460, damping: 34, mass: 0.6 }}
                      className="relative flex items-center gap-2.5"
                    >
                      <div className="relative group/searchbar flex-1 min-w-0">
                        <div className="h-9 w-full md:w-[460px] flex items-center gap-2.5 px-4 rounded-full bg-card/75 border border-[var(--text-main)]/10 shadow-xl hover:bg-white/15 hover:border-white/25 hover:shadow-[0_0_15px_rgba(255,255,255,0.25)] focus-within:bg-white/15 focus-within:border-winblue/40 focus-within:shadow-[0_0_20px_rgba(var(--winblue-rgb),0.3)] text-[var(--text-main)] transition-all backdrop-blur-3xl">
                          <Search size={16} className="text-[var(--text-muted)] group-focus-within/searchbar:text-winblue transition-colors shrink-0" />
                          <input
                            ref={searchInputRef}
                            autoFocus={!isMobile}
                            type="text"
                            placeholder={t.searchPlaceholder}
                            value={searchQuery}
                            onChange={(e) => {
                              const val = e.target.value;
                              setSearchQuery(val);
                              if (currentScreen !== 'search') {
                                navigateTo('search');
                              }
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                if (searchQuery.trim()) {
                                  addToSearchHistory(searchQuery);
                                }
                              } else if (e.key === 'Escape') {
                                e.preventDefault();
                                setSearchQuery('');
                              }
                            }}
                            className="bg-transparent border-none outline-none text-sm text-[var(--text-main)] placeholder-[var(--text-muted)] w-full font-medium"
                          />
                        </div>

                        {/* Pop-up de resultados surgindo abaixo da barra */}
                        <AnimatePresence>
                          {searchQuery.length > 0 && (
                            <>
                              <div 
                                className="fixed inset-0 z-[95] cursor-default" 
                                onClick={() => setSearchQuery('')} 
                              />
                              <motion.div
                                data-popup-content="true"
                                data-search-dropdown="true"
                                initial={{ opacity: 0, y: 8, scale: 0.98 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 8, scale: 0.98 }}
                                transition={{ type: "spring", stiffness: 520, damping: 36, mass: 0.55 }}
                                onClick={(e) => e.stopPropagation()}
                                className="absolute top-full max-md:left-0 md:left-1/2 md:-translate-x-1/2 mt-3 w-full md:min-w-[520px] max-h-[calc(100vh-220px)] bg-card/95 backdrop-blur-3xl border border-[var(--button-secondary-bg)] rounded-[22px] shadow-2xl z-[100] flex flex-col overflow-hidden"
                              >
                                {searchQuery.trim().toLowerCase() === '//dev' ? (
                                  <>
                                    <div className="px-5 pt-4 pb-1 shrink-0">
                                      <h3 className="text-xl font-bold truncate text-amber-400">Modo de desenvolvedor</h3>
                                    </div>

                                    <div className="space-y-1 flex-1 overflow-y-auto custom-scrollbar p-3 pb-6">
                                      {devModeOptions.map((opt, idx) => (
                                        <div
                                          key={idx}
                                          onClick={() => {
                                            opt.onClick();
                                            setSearchQuery('');
                                          }}
                                          className="group/searchitem relative flex items-center gap-3 py-2.5 px-4 rounded-2xl cursor-pointer transition-all hover:bg-[var(--button-secondary-bg)]/50 select-none"
                                        >
                                          <div className="shrink-0">
                                            {opt.icon}
                                          </div>
                                          <div className="flex-1 overflow-hidden">
                                            <p className="text-sm font-bold text-[var(--text-main)] truncate">{opt.title}</p>
                                            <p className="text-xs text-[var(--text-muted)] truncate mt-0.5">{opt.desc}</p>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </>
                                ) : (
                                  <>
                                    <div className="px-5 pt-4 pb-1 shrink-0 flex items-center justify-between">
                                      <h3 className="text-xl font-bold text-[var(--text-main)] truncate">
                                        {computedSearchResults.total > 0 
                                          ? `Resultados para "${searchQuery}"`
                                          : `Nenhum resultado para "${searchQuery}"`}
                                      </h3>
                                    </div>

                                    <div className="space-y-1.5 flex-1 overflow-y-auto custom-scrollbar p-3 pb-6">
                                      {computedSearchResults.total === 0 ? (
                                        <div className="py-12 flex flex-col items-center justify-center text-center">
                                          <Search size={32} className="text-[var(--text-muted)] opacity-35 mb-2.5" />
                                          <p className="text-xs text-[var(--text-muted)]">Nenhum resultado encontrado para "{searchQuery}"</p>
                                        </div>
                                      ) : (
                                        <>
                                          {computedSearchResults.books.map((book) => {
                                            const isPlaying = playingSnippet?.path === book.path;
                                            return (
                                              <div
                                                key={book.id}
                                                onClick={() => {
                                                  addToSearchHistory(searchQuery);
                                                  setSearchQuery('');
                                                  if (book.path) {
                                                    toggleSnippet(book.path);
                                                  }
                                                }}
                                                className="group/searchitem relative flex items-center gap-3.5 py-2 pl-2.5 pr-4 rounded-2xl cursor-pointer transition-all hover:bg-[var(--button-secondary-bg)]/50 select-none"
                                              >
                                                <div className="relative h-12 aspect-[1/1.6] shrink-0 rounded-[14px] overflow-hidden shadow-sm bg-black/20">
                                                  <img
                                                    src={book.cover || getGenericBookCover(book.title, book.author)}
                                                    alt={book.title}
                                                    className="w-full h-full object-cover"
                                                  />
                                                  {isPlaying && (
                                                    <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px] flex items-center justify-center">
                                                      <div className="w-2 h-2 rounded-full bg-winblue animate-ping" />
                                                    </div>
                                                  )}
                                                </div>

                                                <div className="flex-1 overflow-hidden">
                                                  <p className="text-sm font-bold text-[var(--text-main)] truncate">{book.title}</p>
                                                  <p className="text-xs text-[var(--text-muted)] truncate mt-0.5">
                                                    Audiobook • {book.author}{book.genre ? ` • ${book.genre}` : ''}
                                                  </p>
                                                </div>

                                                <div className={`flex items-center gap-1 shrink-0 transition-opacity duration-200 ${isPlaying || activeBookMenu?.item.id === book.id ? 'opacity-100' : 'opacity-0 group-hover/searchitem:opacity-100 focus-within:opacity-100'}`}>
                                                  {book.path && (
                                                    <motion.button
                                                      whileHover={{ scale: 1.12 }}
                                                      whileTap={{ scale: 0.92 }}
                                                      onClick={(e) => {
                                                        e.stopPropagation();
                                                        toggleSnippet(book.path!);
                                                      }}
                                                      className="w-8 h-8 rounded-full bg-card/75 border border-[var(--text-main)]/10 text-[var(--text-main)] hover:bg-white/15 hover:border-white/25 flex items-center justify-center transition-all cursor-pointer"
                                                      title={isPlaying ? "Parar trecho" : "Ouvir trecho"}
                                                    >
                                                      {isPlaying ? <Pause size={14} /> : <Play size={14} className="translate-x-[1px]" />}
                                                    </motion.button>
                                                  )}
                                                  <motion.button
                                                    whileHover={{ scale: 1.12 }}
                                                    whileTap={{ scale: 0.92 }}
                                                    animate={activeBookMenu?.item.id === book.id ? { scale: 1.22, opacity: 0, pointerEvents: 'none' } : { scale: 1, opacity: 1, pointerEvents: 'auto' }}
                                                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                                    onClick={(e) => {
                                                      e.stopPropagation();
                                                      clearButtonCoverAnchorCache(e.currentTarget);
                                                      setActiveBookMenu({ item: book, anchorEl: e.currentTarget });
                                                    }}
                                                    className="w-8 h-8 rounded-full bg-card/75 border border-[var(--text-main)]/10 text-[var(--text-main)] hover:bg-white/15 hover:border-white/25 flex items-center justify-center transition-all cursor-pointer"
                                                    title="Opções"
                                                  >
                                                    <MoreVertical size={14} />
                                                  </motion.button>
                                                </div>
                                              </div>
                                            );
                                          })}

                                          {computedSearchResults.texts.map((text) => {
                                            const coverUrl = text.cover || getGenericTextCover(text.title, text.author, text.coverColor);

                                            return (
                                              <div
                                                key={text.id}
                                                onClick={(e) => {
                                                  addToSearchHistory(searchQuery);
                                                  setSearchQuery('');
                                                  setViewingTextAnchor(e.currentTarget);
                                                  setViewingTextModal(text);
                                                }}
                                                className="group/searchitem relative flex items-center gap-3.5 py-2 pl-2.5 pr-4 rounded-2xl cursor-pointer transition-all hover:bg-[var(--button-secondary-bg)]/50 select-none"
                                              >
                                                <img
                                                  src={coverUrl}
                                                  alt={text.title}
                                                  className="w-10 h-10 rounded-[14px] aspect-square object-cover shrink-0 shadow-sm"
                                                />

                                                <div className="flex-1 overflow-hidden">
                                                  <p className="text-sm font-bold text-[var(--text-main)] truncate">{text.title}</p>
                                                  <p className="text-xs text-[var(--text-muted)] truncate mt-0.5">
                                                    {text.author ? `${text.author} • ` : ''}Texto • {text.tone || text.genre || 'Narrativo'} • {text.wordCount || 0} palavras
                                                  </p>
                                                </div>

                                                <div className={`flex items-center gap-1 shrink-0 transition-opacity duration-200 ${activeTextMenu?.item.id === text.id ? 'opacity-100' : 'opacity-0 group-hover/searchitem:opacity-100 focus-within:opacity-100'}`}>
                                                  <motion.button
                                                    whileHover={{ scale: 1.12 }}
                                                    whileTap={{ scale: 0.92 }}
                                                    animate={activeTextMenu?.item.id === text.id ? { scale: 1.22, opacity: 0, pointerEvents: 'none' } : { scale: 1, opacity: 1, pointerEvents: 'auto' }}
                                                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                                    onClick={(e) => {
                                                      e.stopPropagation();
                                                      clearButtonCoverAnchorCache(e.currentTarget);
                                                      setActiveTextMenu({ item: text, anchorEl: e.currentTarget });
                                                    }}
                                                    className="w-8 h-8 rounded-full bg-card/75 border border-[var(--text-main)]/10 text-[var(--text-main)] hover:bg-white/15 hover:border-white/25 flex items-center justify-center transition-all cursor-pointer"
                                                    title="Opções"
                                                  >
                                                    <MoreVertical size={14} />
                                                  </motion.button>
                                                </div>
                                              </div>
                                            );
                                          })}
                                        </>
                                      )}
                                    </div>
                                  </>
                                )}
                              </motion.div>
                            </>
                          )}
                        </AnimatePresence>
                      </div>

                      {/* Botão de X ao lado direito da barra (aparece apenas quando há texto digitado).
                          O contêiner tem a altura da barra (h-9) e centraliza o botão nela. */}
                      <div className="absolute left-full rtl:left-auto rtl:right-full ml-3 rtl:ml-0 rtl:mr-3 top-0 h-9 flex items-center pointer-events-none">
                      <AnimatePresence>
                        {searchQuery.length > 0 && (
                          <motion.button
                            key="btn-clear-search"
                            initial={{ opacity: 0, scale: 0.55, x: interfaceLang === 'ar-SA' ? 18 : -18 }}
                            animate={{ opacity: 1, scale: 1, x: 0 }}
                            exit={{ opacity: 0, scale: 0.55, x: interfaceLang === 'ar-SA' ? 18 : -18 }}
                            transition={{ type: "spring", stiffness: 480, damping: 34, mass: 0.55 }}
                            whileHover={{ scale: 1.12 }}
                            whileTap={{ scale: 0.92 }}
                            onClick={() => {
                              setSearchQuery('');
                              searchInputRef.current?.focus();
                            }}
                            className="relative z-[110] pointer-events-auto w-9 h-9 flex items-center justify-center rounded-full bg-card/75 border border-[var(--text-main)]/10 shadow-xl hover:bg-white/15 hover:border-white/25 hover:shadow-[0_0_15px_rgba(255,255,255,0.25)] text-[var(--text-main)] transition-all backdrop-blur-3xl shrink-0 cursor-pointer"
                            title="Limpar pesquisa"
                            aria-label="Limpar pesquisa"
                          >
                            <X size={16} />
                          </motion.button>
                        )}
                      </AnimatePresence>
                      </div>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>

            {/* Ações da tela: um botão redondo por ação */}
            <div className="flex items-center gap-2.5 pointer-events-auto shrink-0 z-40">
              {headerActions.length > 0 && (
                <HeaderActionButtons key={activeScreenKey} actions={headerActions} />
              )}
            </div>
          </div>
        </div>

        {/* Área das telas (a que rola). A troca de telas usa as transições de navigation/transitions.ts */}
        <div
          ref={mainScrollRef}
          className="app-scroll flex-1 min-w-0 overflow-y-auto overflow-x-hidden overscroll-contain custom-scrollbar px-4 md:px-8 pt-[calc(var(--app-header-top)+60px)] pb-32 md:pb-12 relative z-10"
        >
        <Suspense fallback={<TelaCarregando />}>
        <AnimatePresence mode={isMobile ? 'sync' : 'wait'}>
          
          {/* =========================================================================
              TELA 1: CONVERSOR (OCUPA O LUGAR DE INÍCIO)
              ========================================================================= */}
          {currentScreen === 'converter' && <ConverterScreen key="screen-converter" />}

          {/* =========================================================================
              TELA 2: HISTÓRICO (OVERVIEW COM SUBSEÇÕES E SUBMENUS - SCREENSHOT 1)
              ========================================================================= */}
          {currentScreen === 'history' && <HistoryHubScreen key="screen-history" />}

          {/* =========================================================================
              SUBTELA HISTÓRICO: MEUS AUDIOBOOKS (COM NAVEGAÇÃO E SCRUBBER FLUTUANTE)
              ========================================================================= */}
          {currentScreen === 'history-audiobooks' && <AllAudiobooksScreen key="screen-all-audiobooks" />}

          {/* =========================================================================
              SUBTELA HISTÓRICO: MEUS TEXTOS (COM NAVEGAÇÃO E SCRUBBER FLUTUANTE)
              ========================================================================= */}
          {currentScreen === 'history-texts' && <AllTextsScreen key="screen-all-texts" />}

          {/* =========================================================================
              TELA: EDITAR AUDIOBOOK (SCREENSHOTS 2, 3 E 4)
              ========================================================================= */}
          {/* =========================================================================
              TELA: EDITAR AUDIOBOOK (FULL SCREEN COM TODAS AS OPÇÕES)
              ========================================================================= */}
          {currentScreen === 'edit-audiobook' && (editingBook || editingFileId) && <EditAudiobookScreen key="screen-edit-audiobook" />}

          {/* =========================================================================
              SUBTELA: EDITAR TEXTO (EDIT TEXT)
              ========================================================================= */}
          {currentScreen === 'edit-text' && editingText && <EditTextScreen key="screen-edit-text" />}

          {/* =========================================================================
              TELA 3: GERADOR DE TEXTO (TEXT GENERATOR)
              ========================================================================= */}
          {/* =========================================================================
              TELA 3: GERADOR DE TEXTO (TEXT GENERATOR HUB - CARDS COMO EM AJUSTES)
              ========================================================================= */}

          {/* =========================================================================
              SUBTELAS DO GERADOR DE TEXTO (TEXT GEN SUBMENUS)
              ========================================================================= */}

          {/* =========================================================================
              TELA 4: PESQUISA (SCREENSHOT 5 - PÍLULA CENTRALIZADA E ÚLTIMAS PESQUISAS)
              ========================================================================= */}
          {currentScreen === 'search' && <SearchScreen key="screen-search" />}

          {/* =========================================================================
              TELA 5: OUTROS APPS (VITRINE DO ECOSSISTEMA - INCLUI PLAYER DE AUDIOBOOKS)
              ========================================================================= */}
          {currentScreen === 'other-apps' && <OtherAppsScreen key="screen-other-apps" />}

          {/* =========================================================================
              TELA 6: AJUDA (CENTRAL DE AJUDA E DOCUMENTAÇÃO FLUENT)
              ========================================================================= */}
          {currentScreen === 'help' && <HelpScreen key="screen-help" />}

          {/* =========================================================================
              SUBMENU AJUDA 1: CONVERSÃO DE E-BOOKS EM AUDIOBOOKS
              ========================================================================= */}

          {/* =========================================================================
              SUBMENU AJUDA 2: GERAÇÃO DE TEXTO SINCRONIZADO
              ========================================================================= */}
          {currentScreen === 'help-topic' && <HelpTopicScreen key={`screen-help-topic-${app.helpTopicId}`} />}

          {/* =========================================================================
              TELA 7: AJUSTES (SETTINGS HUB - BARRAS HORIZONTAIS - SCREENSHOT 2)
              ========================================================================= */}
          {currentScreen === 'settings' && <SettingsScreen key="screen-settings-hub" />}

          {/* =========================================================================
              SUBTELA AJUSTES: INTERFACE (SCREENSHOT 3 COM PÍLULAS SELETORAS)
              ========================================================================= */}
          {currentScreen === 'settings-interface' && <SettingsInterfaceScreen key="screen-settings-interface" />}

          {/* =========================================================================
              SUBTELA AJUSTES: CONVERSÃO DE ÁUDIO
              ========================================================================= */}
          {currentScreen === 'settings-conversion' && <SettingsConversionScreen key="screen-settings-conversion" />}

          {/* =========================================================================
              SUBTELA AJUSTES: ARMAZENAMENTO & PASTAS
              ========================================================================= */}
          {currentScreen === 'settings-storage' && <SettingsStorageScreen key="screen-settings-storage" />}

          {/* =========================================================================
              SUBTELA AJUSTES: SISTEMA E SOBRE
              ========================================================================= */}
          {currentScreen === 'settings-about' && <SettingsAboutScreen key="screen-settings-about" />}

        </AnimatePresence>
        </Suspense>
        </div>
      </main>

      {/* Pop-ups, folhas, confirmações e aviso */}
      <Overlays />
    </div>
    </AppContext.Provider>
  );
}
