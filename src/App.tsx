import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { 
  Settings, Moon, Sun, Upload, 
  FileText, X, CheckCircle2, FolderOpen, 
  Globe, Clock, Download, Cloud, Headphones, 
  BookOpen, Book, ArrowDownToLine, HelpCircle, 
  ChevronDown, ArrowLeftRight, FileAudio,
  AlertTriangle, RefreshCw, AlertCircle,
  FileStack, Trash2, Check, Loader2, Info,
  HardDrive, Mic, Languages, Search, ExternalLink
} from 'lucide-react';

import { LuBookHeadphones, LuUpload, LuBookA, LuBookX, LuFolderPen, LuLock, LuBookAudio, LuFileAudio, LuFolderDown, LuFileCog } from "react-icons/lu";
import { CiBoxList, CiSettings } from "react-icons/ci";
import { GiUsaFlag, GiConfirmed } from "react-icons/gi";
import { RiUserVoiceLine, RiVoiceAiFill, RiDeleteBinLine, RiApps2Fill, RiUserSettingsLine, RiTranslateAi2 } from "react-icons/ri";
import { SlClose } from "react-icons/sl";
import { TiThListOutline } from "react-icons/ti";
import { 
  MdOutlineSnippetFolder, MdDeleteSweep,
  MdOutlineDriveFolderUpload, MdRecordVoiceOver, MdGTranslate 
} from "react-icons/md";
import { TbFilter2Cancel, TbFileStack, TbWorldDownload } from "react-icons/tb";
import { FaGithub, FaStop, FaPlay } from "react-icons/fa";
import { FiHeadphones } from "react-icons/fi";
import { HiOutlineEmojiHappy, HiOutlineEmojiSad } from "react-icons/hi";
import { HiOutlineDownload } from "react-icons/hi";
import { HiMiniSpeakerWave } from "react-icons/hi2";
import { BsHandThumbsUp, BsStars } from "react-icons/bs";
import { Howl } from 'howler';

const APP_VERSION = "1.0.0";

const translations = {
  'pt-BR': {
    dir: 'ltr',
    myAudiobooks: 'Meus audiobooks',
    history: 'Histórico',
    help: 'Ajuda',
    adjustments: 'Ajustes',
    noHistory: 'Histórico vazio',
    seeInFolder: 'Ver na pasta',
    delete: 'Apagar',
    remove: 'Remover',
    change: 'Alterar',
    helpContent: {
      upload: { title: 'Como carregar arquivos?', content: <>Você pode arrastar ebooks para a tela e soltar ou clicar para abrir o seletor de arquivos e escolher os arquivos que você deseja carregar no aplicativo. Você pode adicionar mais arquivos clicando no botão <strong className="inline-flex items-center gap-1 font-bold text-[var(--text-main)]"><LuUpload size={14} className="text-inherit"/> Adicionar arquivos</strong> que aparece na parte inferior da tela.</> },
      generate: { title: 'Como gerar audiobooks?', content: <>Basta clicar no botão <strong className="inline-flex items-center gap-1 font-bold text-[var(--text-main)]"><RiVoiceAiFill size={14} className="text-inherit"/> Gerar audiobooks</strong> na parte inferior da tela que o sistema vai processar o arquivo e o converter em um audiobook que será um único arquivo de áudio .mp3 ou em vários, sendo um arquivo de áudio .mp3 por capítulo.</> },
      conversion: { title: 'Como funciona a conversão?', content: <>O arquivo será lido, seus metadados extraídos, o texto será traduzido (se estiver em idioma estrangeiro e assim você desejar), o texto também será otimizado para melhorar a leitura pela voz de inteligência artificial e, por fim, um arquivo .mp3 é gerado com a leitura realizada. Você pode acompanhar o progresso desses procedimentos pela barra de progresso exibida juntamente de cada arquivo sendo processado. No caso de você optar por gerar um único arquivo .mp3, o aplicativo vai salvar metadados de onde cada capítulo começa e termina para que seu reprodutor de audiobooks reconheça. O processo necessita de conexão com a internet.</> },
      voices: { title: 'Como selecionar as vozes?', content: <>Em <strong className="inline-flex items-center gap-1 font-bold text-[var(--text-main)]"><Settings size={14} className="text-inherit"/> Ajustes</strong>, você pode escolher uma entre as vozes disponíveis ou optar que sempre você vá gerar audiobooks, te seja perguntado qual voz você deseja usar.</> },
      save: { title: 'Como salvar meus audiobooks?', content: <>Em <strong className="inline-flex items-center gap-1 font-bold text-[var(--text-main)]"><Settings size={14} className="text-inherit"/> Ajustes</strong>, você pode alterar a <strong className="inline-flex items-center gap-1 font-bold text-[var(--text-main)]"><FolderOpen size={14} className="text-inherit"/> Pasta de destino</strong> onde serão salvos seus audiobooks gerados.</> },
      access: { title: 'Como acessar meus audiobooks?', content: <>Clicando em <strong className="inline-flex items-center gap-1 font-bold text-[var(--text-main)]"><FiHeadphones size={14} className="text-inherit"/> Meus audiobooks</strong>, na parte superior direita da tela, ou acessando a pasta onde seus audiobooks estão sendo salvos.</> },
      extras: { title: 'Recursos extras?', content: <>O aplicativo possui um tradutor embutido que traduz, se assim você desejar, os arquivos de texto carregados para o seu idioma. Também possui um otimizador de texto embutido para melhorar a leitura de texto por inteligência artificial. Além disso, é possível acessar em <strong className="inline-flex items-center gap-1 font-bold text-[var(--text-main)]"><Clock size={14} className="text-inherit"/> Histórico</strong> todos os seus audiobooks gerados.</> },
      config: { title: 'Como configurar o aplicativo?', content: <>Em <strong className="inline-flex items-center gap-1 font-bold text-[var(--text-main)]"><Settings size={14} className="text-inherit"/> Ajustes</strong> você pode ativar ou desativar o <strong className="inline-flex items-center gap-1 font-bold text-[var(--text-main)]"><Moon size={14} className="text-inherit"/> Modo escuro</strong>, mudar o <strong className="inline-flex items-center gap-1 font-bold text-[var(--text-main)]"><Languages size={14} className="text-inherit"/> Idioma</strong> do aplicativo, selecionar a <strong className="inline-flex items-center gap-1 font-bold text-[var(--text-main)]"><RiUserVoiceLine size={14} className="text-inherit"/> Voz</strong> e o <strong className="inline-flex items-center gap-1 font-bold text-[var(--text-main)]"><LuFileCog size={14} className="text-inherit"/> Tipo de arquivo a ser gerado</strong>, além de definir a <strong className="inline-flex items-center gap-1 font-bold text-[var(--text-main)]"><FolderOpen size={14} className="text-inherit"/> Pasta de destino</strong>.</> }
    },
    steps: [
      "Arraste seus e-books (EPUB, PDF, MOBI) para a área central.",
      "Edite o título e o autor se necessário.",
      "Verifique as previsões de tamanho e duração.",
      "Clique em gerar audiobook.",
      "Aguarde o processamento e a síntese de voz.",
      "Exporte seus audiobooks prontos!"
    ],
    interfaceLang: 'Idioma',
    interface: 'Interface',
    conversion: 'Conversão',
    saving: 'Salvamento',
    about: 'Sobre',
    voice: 'Voz',
    askAlways: 'Perguntar sempre',
    outputFolder: 'Pasta de destino',
    version: 'Versão',
    author: 'Autor',
    unknownAuthor: 'Desconhecido',
    closeApp: 'Fechar app',
    dragDrop: 'Arraste seus e-books aqui ou clique para adicionar',
    title: 'Título da obra',
    authorLabel: 'Autor',
    predictions: 'Estimativas para o audiobook',
    duration: 'Duração',
    size: 'Tamanho',
    procTime: 'Tempo estimado para geração',
    addFiles: 'Adicionar arquivos',
    generateAudiobook: 'Gerar audiobook',
    generateAudiobooks: 'Gerar audiobooks',
    cancelProcessing: 'Cancelar processamento',
    newConversion: 'Nova conversão',
    translating: 'Traduzindo conteúdo...',
    editing: 'Otimizando texto...',
    generating: 'Gerando áudio ({done} de {total} parte(s) processada(s))...',
    completed: 'Concluído com sucesso',
    error: 'Erro',
    processingPart: 'Processando parte {done} de {total}...',
    retry: 'Tentar novamente',
    cancel: 'Cancelar',
    readingMetadata: 'Lendo metadados...',
    keepOriginal: 'Manter original',
    translate: 'Traduzir',
    confirmClearHistory: 'Tem certeza que deseja apagar todo o histórico de conversões? Esta ação não pode ser desfeita.',
    clearHistoryTitle: 'Apagar histórico',
    clearHistoryConfirm: 'Apagar tudo',
    duplicateTitle: 'Livro já convertido!',
    duplicateDesc: 'O livro "{title}" já foi convertido com sucesso anteriormente. Deseja convertê-lo novamente?',
    generateAgain: 'Gerar novamente',
    foreignLangTitle: 'Texto em {lang} detectado!',
    foreignLangDesc: 'Identificamos que o arquivo "{file}" está em {lang}. Deseja traduzi-lo automaticamente para o idioma padrão ({appLang}) agora?',
    cancelProcessingTitle: 'Deseja cancelar o processamento?',
    cancelProcessingTitleSingle: 'Cancelar processamento do arquivo',
    cancelProcessingTitlePlural: 'Cancelar processamento dos arquivos',
    cancelProcessingDesc: 'Tem certeza que deseja interromper o processamento?',
    cancelAll: 'Cancelar todos',
    cancelThis: 'Cancelar este',
    cancelThese: 'Cancelar estes',
    keepProcessing: 'Manter todos',
    keepProcessingSingle: 'Manter processamento',
    darkMode: 'Modo escuro',
    fileType: 'Tipo de arquivo gerado',
    fileTypeDesc: 'Escolha como deseja que os arquivos de áudio sejam gerados para seus livros.',
    fileTypeQuestion: 'Tipo de arquivo gerado',
    singleFile: 'Arquivo único .mp3',
    multipleFiles: 'Um arquivo .mp3 por capítulo',
    voiceDesc: 'Selecione a voz que deseja utilizar para a narração deste audiobook.',
    selectVoice: 'Selecionar Voz',
    authorship: 'Autoria',
    insertFolderError: 'Insira uma pasta de destino para salvar seus audiobooks antes de prosseguir.',
    playSnippet: 'Tocar trecho',
    stopSnippet: 'Parar',
    allCompleted: 'Todos os audiobooks foram gerados!',
    someErrors: 'Processamento finalizado com erros.'
  },
  'en-US': {
    dir: 'ltr',
    myAudiobooks: 'My audiobooks',
    history: 'History',
    help: 'Help',
    adjustments: 'Settings',
    noHistory: 'Empty history',
    seeInFolder: 'See in folder',
    delete: 'Delete',
    remove: 'Remove',
    change: 'Change',
    helpContent: {
      upload: { title: 'How to upload files?', content: <>You can drag and drop ebooks onto the screen or click to open the file selector and choose the files you want to load into the application. You can add more files by clicking the <strong className="inline-flex items-center gap-1 font-bold text-[var(--text-main)]"><LuUpload size={14} className="text-inherit"/> Add files</strong> button at the bottom of the screen.</> },
      generate: { title: 'How to generate audiobooks?', content: <>Just click the <strong className="inline-flex items-center gap-1 font-bold text-[var(--text-main)]"><RiVoiceAiFill size={14} className="text-inherit"/> Generate audiobooks</strong> button at the bottom of the screen and the system will process the file and convert it into an audiobook which will be a single .mp3 audio file or several, with one .mp3 audio file per chapter.</> },
      conversion: { title: 'How does conversion work?', content: <>The file will be read, its metadata extracted, the text will be translated (if in a foreign language and you wish so), the text will also be optimized to improve reading by artificial intelligence voice, and finally, an .mp3 file is generated with the reading done. You can track the progress of these procedures by the progress bar displayed along with each file being processed. In case you choose to generate a single .mp3 file, the application will save metadata of where each chapter starts and ends so that your audiobook player recognizes it. The process requires an internet connection.</> },
      voices: { title: 'How to select voices?', content: <>In <strong className="inline-flex items-center gap-1 font-bold text-[var(--text-main)]"><Settings size={14} className="text-inherit"/> Settings</strong>, you can choose one of the available voices or choose to always be asked which voice you want to use when you generate audiobooks.</> },
      save: { title: 'How to save my audiobooks?', content: <>In <strong className="inline-flex items-center gap-1 font-bold text-[var(--text-main)]"><Settings size={14} className="text-inherit"/> Settings</strong>, you can change the <strong className="inline-flex items-center gap-1 font-bold text-[var(--text-main)]"><FolderOpen size={14} className="text-inherit"/> Output folder</strong> where your generated audiobooks will be saved.</> },
      access: { title: 'How to access my audiobooks?', content: <>By clicking on <strong className="inline-flex items-center gap-1 font-bold text-[var(--text-main)]"><FiHeadphones size={14} className="text-inherit"/> My audiobooks</strong>, at the top right of the screen, or by accessing the folder where your audiobooks are being saved.</> },
      extras: { title: 'Extra features?', content: <>The application has a built-in translator that translates, if you wish, the loaded text files into your language. It also has a built-in text optimizer to improve text reading by artificial intelligence. In addition, it is possible to access in <strong className="inline-flex items-center gap-1 font-bold text-[var(--text-main)]"><Clock size={14} className="text-inherit"/> History</strong> all your generated audiobooks.</> },
      config: { title: 'How to configure the application?', content: <>In <strong className="inline-flex items-center gap-1 font-bold text-[var(--text-main)]"><Settings size={14} className="text-inherit"/> Settings</strong> you can enable or disable <strong className="inline-flex items-center gap-1 font-bold text-[var(--text-main)]"><Moon size={14} className="text-inherit"/> Dark mode</strong>, change the application's <strong className="inline-flex items-center gap-1 font-bold text-[var(--text-main)]"><Languages size={14} className="text-inherit"/> Language</strong>, select the <strong className="inline-flex items-center gap-1 font-bold text-[var(--text-main)]"><RiUserVoiceLine size={14} className="text-inherit"/> Voice</strong> and the <strong className="inline-flex items-center gap-1 font-bold text-[var(--text-main)]"><LuFileCog size={14} className="text-inherit"/> Generated file type</strong>, in addition to setting the <strong className="inline-flex items-center gap-1 font-bold text-[var(--text-main)]"><FolderOpen size={14} className="text-inherit"/> Output folder</strong>.</> }
    },
    steps: [
      "Drag your e-books (EPUB, PDF, MOBI) to the center area.",
      "Edit the title and author if necessary.",
      "Check size and duration predictions.",
      "Click generate audiobook.",
      "Wait for processing and voice synthesis.",
      "Export your ready audiobooks!"
    ],
    interfaceLang: 'Language',
    interface: 'Interface',
    conversion: 'Conversion',
    saving: 'Saving',
    about: 'About',
    voice: 'Voice',
    askAlways: 'Ask always',
    outputFolder: 'Output folder',
    version: 'Version',
    author: 'Author',
    unknownAuthor: 'Unknown',
    closeApp: 'Close app',
    dragDrop: 'Drag your e-books here or click to add',
    title: 'Work title',
    authorLabel: 'Author',
    predictions: 'Audiobook estimates',
    duration: 'Duration',
    size: 'Size',
    procTime: 'Estimated generation time',
    addFiles: 'Add files',
    generateAudiobook: 'Generate audiobook',
    generateAudiobooks: 'Generate audiobooks',
    cancelProcessing: 'Cancel processing',
    newConversion: 'New conversion',
    translating: 'Translating content...',
    editing: 'Optimizing text...',
    generating: 'Generating audio ({done} of {total} part(s) processed)...',
    completed: 'Completed successfully',
    error: 'Error',
    processingPart: 'Processing part {done} of {total}...',
    retry: 'Retry',
    cancel: 'Cancel',
    readingMetadata: 'Reading metadata...',
    keepOriginal: 'Keep original',
    translate: 'Translate',
    confirmClearHistory: 'Are you sure you want to clear all conversion history? This action cannot be undone.',
    clearHistoryTitle: 'Clear history',
    clearHistoryConfirm: 'Clear all',
    duplicateTitle: 'Book already converted!',
    duplicateDesc: 'The book "{title}" has already been successfully converted. Do you want to convert it again?',
    generateAgain: 'Generate again',
    foreignLangTitle: '{lang} text detected!',
    foreignLangDesc: 'We identified that the file "{file}" is in {lang}. Do you want to automatically translate it to the default language ({appLang}) now?',
    cancelProcessingTitle: 'Do you want to cancel processing?',
    cancelProcessingTitleSingle: 'Cancel file processing',
    cancelProcessingTitlePlural: 'Cancel files processing',
    cancelProcessingDesc: 'Are you sure you want to stop processing?',
    cancelAll: 'Cancel all',
    cancelThis: 'Cancel this',
    cancelThese: 'Cancel these',
    keepProcessing: 'Keep all',
    keepProcessingSingle: 'Keep processing',
    darkMode: 'Dark mode',
    fileType: 'Generated file type',
    fileTypeDesc: 'Choose how you want the audio files to be generated for your books.',
    fileTypeQuestion: 'Generated file type',
    singleFile: 'Single .mp3 file',
    multipleFiles: 'One .mp3 file per chapter',
    voiceDesc: 'Select the voice you want to use for the narration of this audiobook.',
    selectVoice: 'Select Voice',
    authorship: 'Authorship',
    insertFolderError: 'Please enter a destination folder to save your audiobooks before proceeding.',
    playSnippet: 'Play snippet',
    stopSnippet: 'Stop',
    allCompleted: 'All audiobooks generated!',
    someErrors: 'Processing finished with errors.'
  },
  'es-ES': {
    dir: 'ltr',
    myAudiobooks: 'Mis audiolibros',
    history: 'Historial',
    help: 'Ayuda',
    adjustments: 'Ajustes',
    noHistory: 'Historial vacío',
    seeInFolder: 'Ver en carpeta',
    delete: 'Borrar',
    remove: 'Eliminar',
    change: 'Cambiar',
    helpContent: {
      upload: { title: '¿Cómo cargar archivos?', content: <>Puede arrastrar y soltar libros electrónicos en la pantalla o hacer clic para abrir el selector de archivos y elegir los archivos que desea cargar en la aplicación. Puede agregar más archivos haciendo clic en el botón <strong className="inline-flex items-center gap-1 font-bold text-[var(--text-main)]"><LuUpload size={14} className="text-inherit"/> Añadir archivos</strong> que aparece en la parte inferior de la pantalla.</> },
      generate: { title: '¿Cómo generar audiolibros?', content: <>Simplemente haga clic en el botón <strong className="inline-flex items-center gap-1 font-bold text-[var(--text-main)]"><RiVoiceAiFill size={14} className="text-inherit"/> Generar audiolibros</strong> en la parte inferior de la pantalla y el sistema procesará el archivo y lo convertirá en un audiolibro que será un solo archivo de audio .mp3 o varios, con un archivo de audio .mp3 por capítulo.</> },
      conversion: { title: '¿Cómo funciona la conversión?', content: <>El archivo será leído, sus metadatos extraídos, el texto será traducido (si está en un idioma extranjero y así lo desea), el texto también será optimizado para mejorar la lectura por voz de inteligencia artificial y, finalmente, se genera un archivo .mp3 con la lectura realizada. Puede seguir el progreso de estos procedimientos mediante la barra de progreso que se muestra junto con cada archivo que se está procesando. En caso de que elija generar un solo archivo .mp3, la aplicación guardará metadatos de dónde comienza y termina cada capítulo para que su reproductor de audiolibros lo reconozca. El proceso requiere una conexión a Internet.</> },
      voices: { title: '¿Cómo seleccionar voces?', content: <>En <strong className="inline-flex items-center gap-1 font-bold text-[var(--text-main)]"><Settings size={14} className="text-inherit"/> Ajustes</strong>, puede elegir una de las voces disponibles o elegir que siempre se le pregunte qué voz desea usar al generar audiolibros.</> },
      save: { title: '¿Cómo guardar mis audiolibros?', content: <>En <strong className="inline-flex items-center gap-1 font-bold text-[var(--text-main)]"><Settings size={14} className="text-inherit"/> Ajustes</strong>, puede cambiar la <strong className="inline-flex items-center gap-1 font-bold text-[var(--text-main)]"><FolderOpen size={14} className="text-inherit"/> Carpeta de destino</strong> donde se guardarán sus audiolibros generados.</> },
      access: { title: '¿Cómo acceder a mis audiolibros?', content: <>Haciendo clic en <strong className="inline-flex items-center gap-1 font-bold text-[var(--text-main)]"><FiHeadphones size={14} className="text-inherit"/> Mis audiolibros</strong>, en la parte superior derecha de la pantalla, o accediendo a la carpeta donde se están guardando sus audiolibros.</> },
      extras: { title: '¿Recursos extras?', content: <>La aplicación tiene un traductor incorporado que traduce, si lo desea, los archivos de texto cargados a su idioma. También tiene un optimizador de texto incorporado para mejorar la lectura de texto por inteligencia artificial. Además, es posible acceder en <strong className="inline-flex items-center gap-1 font-bold text-[var(--text-main)]"><Clock size={14} className="text-inherit"/> Historial</strong> a todos sus audiolibros generados.</> },
      config: { title: '¿Cómo configurar la aplicación?', content: <>En <strong className="inline-flex items-center gap-1 font-bold text-[var(--text-main)]"><Settings size={14} className="text-inherit"/> Ajustes</strong> puede habilitar o deshabilitar el <strong className="inline-flex items-center gap-1 font-bold text-[var(--text-main)]"><Moon size={14} className="text-inherit"/> Modo oscuro</strong>, cambiar el <strong className="inline-flex items-center gap-1 font-bold text-[var(--text-main)]"><Languages size={14} className="text-inherit"/> Idioma</strong> de la aplicación, seleccionar la <strong className="inline-flex items-center gap-1 font-bold text-[var(--text-main)]"><RiUserVoiceLine size={14} className="text-inherit"/> Voz</strong> y el <strong className="inline-flex items-center gap-1 font-bold text-[var(--text-main)]"><LuFileCog size={14} className="text-inherit"/> Tipo de archivo generado</strong>, además de configurar la <strong className="inline-flex items-center gap-1 font-bold text-[var(--text-main)]"><FolderOpen size={14} className="text-inherit"/> Carpeta de destino</strong>.</> }
    },
    steps: [
      "Arrastra tus e-books (EPUB, PDF, MOBI) al área central.",
      "Edita el título y el autor si es necesario.",
      "Verifica las predicciones de tamaño y duración.",
      "Haz clic en generar audiolibro.",
      "Espera el procesamiento y la síntesis de voz.",
      "¡Exporta tus audiolibros listos!"
    ],
    interfaceLang: 'Idioma',
    interface: 'Interfaz',
    conversion: 'Conversión',
    saving: 'Guardado',
    about: 'Acerca de',
    voice: 'Voz',
    askAlways: 'Preguntar siempre',
    outputFolder: 'Carpeta de destino',
    version: 'Versión',
    author: 'Autor',
    unknownAuthor: 'Desconocido',
    closeApp: 'Cerrar aplicación',
    dragDrop: 'Arrastra tus e-books aquí o haz clic para añadir',
    title: 'Título de la obra',
    authorLabel: 'Autor',
    predictions: 'Estimaciones para el audiolibro',
    duration: 'Duración',
    size: 'Tamaño',
    procTime: 'Tiempo estimado de generación',
    addFiles: 'Añadir archivos',
    generateAudiobook: 'Generar audiolibro',
    generateAudiobooks: 'Generar audiolibros',
    cancelProcessing: 'Cancelar procesamiento',
    newConversion: 'Nueva conversión',
    translating: 'Traduciendo contenido...',
    editing: 'Optimizando texto...',
    generating: 'Generando audio ({done} de {total} parte(s) procesada(s))...',
    completed: 'Completado con éxito',
    error: 'Error',
    processingPart: 'Procesando parte {done} de {total}...',
    retry: 'Reintentar',
    cancel: 'Cancelar',
    readingMetadata: 'Leyendo metadatos...',
    keepOriginal: 'Mantener original',
    translate: 'Traducir',
    confirmClearHistory: '¿Estás seguro de que quieres borrar todo el historial de conversiones? Esta acción no se puede deshacer.',
    clearHistoryTitle: 'Borrar historial',
    clearHistoryConfirm: 'Borrar todo',
    duplicateTitle: '¡Libro ya convertido!',
    duplicateDesc: 'El libro "{title}" ya se ha convertido con éxito anteriormente. ¿Quieres convertirlo de nuevo?',
    generateAgain: 'Generar de nuevo',
    foreignLangTitle: '¡Texto en {lang} detectado!',
    foreignLangDesc: 'Identificamos que el archivo "{file}" está em {lang}. ¿Desea traducirlo automáticamente al idioma predeterminado ({appLang}) ahora?',
    cancelProcessingTitle: '¿Quieres cancelar el procesamiento?',
    cancelProcessingTitleSingle: 'Cancelar procesamiento del archivo',
    cancelProcessingTitlePlural: 'Cancelar procesamiento de los archivos',
    cancelProcessingDesc: '¿Estás seguro de que quieres detener el procesamiento?',
    cancelAll: 'Cancelar todo',
    cancelThis: 'Cancelar este',
    cancelThese: 'Cancelar estos',
    keepProcessing: 'Mantener todos',
    keepProcessingSingle: 'Mantener procesamiento',
    darkMode: 'Modo oscuro',
    fileType: 'Tipo de archivo generado',
    fileTypeDesc: 'Elija cómo desea que se generen los archivos de audio para sus libros.',
    fileTypeQuestion: 'Tipo de archivo generado',
    singleFile: 'Archivo único .mp3',
    multipleFiles: 'Un archivo .mp3 por capítulo',
    voiceDesc: 'Seleccione la voz que desea utilizar para la narración de este audiolibro.',
    selectVoice: 'Seleccionar Voz',
    authorship: 'Autoría',
    insertFolderError: 'Ingrese una carpeta de destino para guardar sus audiolibros antes de continuar.',
    playSnippet: 'Reproducir fragmento',
    stopSnippet: 'Detener',
    allCompleted: '¡Todos los audiolibros generados!',
    someErrors: 'Procesamiento finalizado con errores.'
  },
  'ar-SA': {
    dir: 'rtl',
    myAudiobooks: 'كتب الصوتية الخاصة بي',
    history: 'سجل',
    help: 'مساعدة',
    adjustments: 'تعديلات',
    noHistory: 'سجل فارغ',
    seeInFolder: 'عرض في المجلد',
    delete: 'حذف',
    remove: 'إزالة',
    change: 'تغيير',
    helpContent: {
      upload: { title: 'كيفية تحميل الملفات؟', content: <>يمكنك سحب وإفلات الكتب الإلكترونية على الشاشة أو النقر لفتح محدد الملفات واختيار الملفات التي تريد تحميلها في التطبيق. يمكنك إضافة المزيد من الملفات بالنقر فوق الزر <strong className="inline-flex items-center gap-1 font-bold text-[var(--text-main)]"><LuUpload size={14} className="text-inherit"/> إضافة ملفات</strong> أسفل الشاشة.</> },
      generate: { title: 'كيفية إنشاء كتب صوتية؟', content: <>ما عليك سوى النقر فوق الزر <strong className="inline-flex items-center gap-1 font-bold text-[var(--text-main)]"><RiVoiceAiFill size={14} className="text-inherit"/> إنشاء كتب صوتية</strong> أسفل الشاشة وسيقوم النظام بمعالجة الملف وتحويله إلى كتاب صوتي سيكون ملف صوتي واحد بتنسيق .mp3 أو عدة ملفات، مع ملف صوتي واحد بتنسيق .mp3 لكل فصل.</> },
      conversion: { title: 'كيف يعمل التحويل؟', content: <>سيتم قراءة الملف، واستخراج بياناته الوصفية، وسيتم ترجمة النص (إذا كان بلغة أجنبية وكنت ترغب في ذلك)، وسيتم أيضًا تحسين النص لتحسين القراءة بواسطة صوت الذكاء الاصطناعي، وأخيرًا، يتم إنشاء ملف .mp3 مع القراءة التي تمت. يمكنك تتبع تقدم هذه الإجراءات من خلال شريط التقدم المعروض مع كل ملف تتم معالجته. في حال اخترت إنشاء ملف .mp3 واحد، سيقوم التطبيق بحفظ البيانات الوصفية لمكان بدء وانتهاء كل فصل حتى يتعرف عليه مشغل الكتب الصوتية الخاص بك. تتطلب العملية اتصالاً بالإنترنت.</> },
      voices: { title: 'كيفية اختيار الأصوات؟', content: <>في <strong className="inline-flex items-center gap-1 font-bold text-[var(--text-main)]"><Settings size={14} className="text-inherit"/> تعديلات</strong>، يمكنك اختيار أحد الأصوات المتاحة أو اختيار أن تُسأل دائمًا عن الصوت الذي تريد استخدامه عند إنشاء كتب صوتية.</> },
      save: { title: 'كيف أحفظ كتبي الصوتية؟', content: <>في <strong className="inline-flex items-center gap-1 font-bold text-[var(--text-main)]"><Settings size={14} className="text-inherit"/> تعديلات</strong>، يمكنك تغيير <strong className="inline-flex items-center gap-1 font-bold text-[var(--text-main)]"><FolderOpen size={14} className="text-inherit"/> مجلد الإخراج</strong> حيث سيتم حفظ كتبك الصوتية التي تم إنشاؤها.</> },
      access: { title: 'كيفية الوصول إلى كتبي الصوتية؟', content: <>من خلال النقر على <strong className="inline-flex items-center gap-1 font-bold text-[var(--text-main)]"><FiHeadphones size={14} className="text-inherit"/> كتب الصوتية الخاصة بي</strong>، في الجزء العلوي الأيمن من الشاشة، أو من خلال الوصول إلى المجلد حيث يتم حفظ كتبك الصوتية.</> },
      extras: { title: 'ميزات إضافية؟', content: <>يحتوي التطبيق على مترجم مدمج يترجم، إذا كنت ترغب في ذلك، الملفات النصية المحملة إلى لغتك. كما يحتوي على مُحسِّن نصوص مدمج لتحسين قراءة النص بواسطة الذكاء الاصطناعي. بالإضافة إلى ذلك، من الممكن الوصول في <strong className="inline-flex items-center gap-1 font-bold text-[var(--text-main)]"><Clock size={14} className="text-inherit"/> سجل</strong> إلى جميع كتبك الصوتية التي تم إنشاؤها.</> },
      config: { title: 'كيفية تكوين التطبيق؟', content: <>في <strong className="inline-flex items-center gap-1 font-bold text-[var(--text-main)]"><Settings size={14} className="text-inherit"/> تعديلات</strong> يمكنك تمكين أو تعطيل <strong className="inline-flex items-center gap-1 font-bold text-[var(--text-main)]"><Moon size={14} className="text-inherit"/> الوضع الداكن</strong>، وتغيير <strong className="inline-flex items-center gap-1 font-bold text-[var(--text-main)]"><Languages size={14} className="text-inherit"/> اللغة</strong> الخاصة بالتطبيق، وتحديد <strong className="inline-flex items-center gap-1 font-bold text-[var(--text-main)]"><RiUserVoiceLine size={14} className="text-inherit"/> الصوت</strong> و <strong className="inline-flex items-center gap-1 font-bold text-[var(--text-main)]"><LuFileCog size={14} className="text-inherit"/> نوع الملف الناتج</strong>، بالإضافة إلى تعيين <strong className="inline-flex items-center gap-1 font-bold text-[var(--text-main)]"><FolderOpen size={14} className="text-inherit"/> مجلد الإخراج</strong>.</> }
    },
    steps: [
      "اسحب كتبك الإلكترونية (EPUB، PDF، MOBI) إلى المنطقة المركزية.",
      "قم بتحرير العنوان والمؤلف إذا لزم الأمر.",
      "تحقق من توقعات الحجم والمدة.",
      "انقر فوق إنشاء كتاب صوتي.",
      "انتظر المعالجة وتوليف الصوت.",
      "تصدير كتبك الصوتية الجاهزة!"
    ],
    interfaceLang: 'اللغة',
    interface: 'الواجهة',
    conversion: 'التحويل',
    saving: 'الحفظ',
    about: 'حول',
    voice: 'الصوت',
    askAlways: 'السؤال دائماً',
    outputFolder: 'مجلد الإخراج',
    version: 'إصدار',
    author: 'مؤلف',
    unknownAuthor: 'غير معروف',
    closeApp: 'إغلاق التطبيق',
    dragDrop: 'اسحب كتبك الإلكترونية هنا أو انقر للإضافة',
    title: 'عنوان العمل',
    authorLabel: 'مؤلف',
    predictions: 'تقديرات الكتاب الصوتي',
    duration: 'مدة',
    size: 'حجم',
    procTime: 'الوقت المقدر للإنشاء',
    addFiles: 'إضافة ملفات',
    generateAudiobook: 'إنشاء كتاب صوتي',
    generateAudiobooks: 'إنشاء كتب صوتية',
    cancelProcessing: 'إلغاء المعالجة',
    newConversion: 'تحويل جديد',
    translating: 'ترجمة المحتوى...',
    editing: 'تحسين النص...',
    generating: 'جاري إنشاء الصوت ({done} من {total} جزء تمت معالجته)...',
    completed: 'اكتمل بنجاح',
    error: 'خطأ',
    processingPart: 'جاري معالجة الجزء {done} من {total}...',
    retry: 'إعادة المحاولة',
    cancel: 'إلغاء',
    readingMetadata: 'قراءة البيانات الوصفية...',
    keepOriginal: 'الاحتفاظ بالأصلي',
    translate: 'ترجمة',
    confirmClearHistory: 'هل أنت متأكد أنك تريد مسح سجل التحويل بالكامل؟ لا يمكن التراجع عن هذا الإجراء.',
    clearHistoryTitle: 'مسح السجل',
    clearHistoryConfirm: 'مسح الكل',
    duplicateTitle: 'الكتاب تم تحويله بالفعل!',
    duplicateDesc: 'تم تحويل الكتاب "{title}" بنجاح سابقًا. هل تريد تحويله مرة أخرى؟',
    generateAgain: 'إنشاء مرة أخرى',
    foreignLangTitle: 'تم اكتشاف نص باللغة {lang}!',
    foreignLangDesc: 'لقد حددنا أن الملف "{file}" باللغة {lang}. هل تريد ترجمته تلقائيًا إلى اللغة الافتراضية ({appLang}) الآن؟',
    cancelProcessingTitle: 'هل تريد إلغاء المعالجة؟',
    cancelProcessingTitleSingle: 'إلغاء معالجة الملف',
    cancelProcessingTitlePlural: 'إلغاء معالجة الملفات',
    cancelProcessingDesc: 'هل أنت متأكد أنك تريد إيقاف المعالجة؟',
    cancelAll: 'إلغاء الكل',
    cancelThis: 'إلغاء هذا',
    cancelThese: 'إلغاء هذه',
    keepProcessing: 'الاحتفاظ بالكل',
    keepProcessingSingle: 'الاحتفاظ بالمعالجة',
    darkMode: 'الوضع الداكن',
    fileType: 'نوع الملف الناتج',
    fileTypeDesc: 'اختر كيف تريد إنشاء ملفات الصوت لكتبك.',
    fileTypeQuestion: 'نوع الملف الناتج',
    singleFile: 'ملف .mp3 واحد',
    multipleFiles: 'ملف .mp3 واحد لكل فصل',
    voiceDesc: 'حدد الصوت الذي تريد استخدامه لسرد هذا الكتاب الصوتي.',
    selectVoice: 'تحديد الصوت',
    authorship: 'التأليف',
    insertFolderError: 'الرجاء إدخال مجلد وجهة لحفظ كتبك الصوتية قبل المتابعة.',
    playSnippet: 'تشغيل مقتطف',
    stopSnippet: 'إيقاف',
    allCompleted: 'تم إنشاء جميع الكتب الصوتية!',
    someErrors: 'انتهت المعالجة مع وجود أخطاء.'
  }
};

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type Phase = 0 | 1 | 2 | 3;

interface AppFile {
  id: string;
  filename: string;
  title: string;
  author: string;
  language: string;
  sizeStr: string;
  durationEst: string;
  processingTimeEst: string;
  status: 'idle' | 'translating' | 'editing' | 'processing' | 'success' | 'error';
  progress: number;
  translationProgress: number;
  editingProgress: number;
  isTranslating: boolean;
  isEditing: boolean;
  requiresTranslation: boolean;
  partsTotal: number;
  partsDone: number;
  errorMessage?: string;
  fileObj?: File;
  cover?: string;
  audioSizeEst?: string;
  metadataStatus: 'loading' | 'loaded' | 'error';
  processingStartTime?: number;
  phaseStartTime?: number;
  generatedPaths?: string[];
}

interface HistoryItem {
  id: string;
  title: string;
  author: string;
  date: string;
  status: 'success' | 'error';
  cover?: string;
  path?: string;
}


function ExpandableButton({ 
  icon: Icon, 
  label, 
  onClick, 
  className, 
  variant = 'default',
  expandDirection = 'right'
}: { 
  icon: any, 
  label: string, 
  onClick?: () => void, 
  className?: string,
  variant?: 'default' | 'error' | 'success' | 'warning',
  expandDirection?: 'left' | 'right'
}) {
  const [isHovered, setIsHovered] = useState(false);
  
  return (
    <motion.button
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={cn(
        "flex items-center px-2 py-2 rounded-2xl transition-all duration-200 overflow-hidden whitespace-nowrap",
        variant === 'default' && "bg-winblue/10 text-winblue hover:bg-winblue/20",
        variant === 'error' && "bg-error/10 text-error hover:bg-error/20",
        variant === 'success' && "bg-success/10 text-success hover:bg-success/20",
        variant === 'warning' && "bg-warning/10 text-warning hover:bg-warning/20",
        className
      )}
      initial={false}
      animate={{ 
        width: isHovered ? 'auto' : '36px',
        paddingRight: isHovered ? '12px' : '8px'
      }}
      transition={{ type: 'spring', stiffness: 1500, damping: 60, mass: 0.5 }}
    >
      <div className="flex items-center gap-2">
        <Icon size={18} className="shrink-0" />
        <AnimatePresence initial={false}>
          {isHovered && (
            <motion.span
              initial={{ opacity: 0, width: 0, x: -5 }}
              animate={{ opacity: 1, width: 'auto', x: 0 }}
              exit={{ opacity: 0, width: 0, x: -5 }}
              transition={{ duration: 0.02 }}
              className="text-xs font-medium"
            >
              {label}
            </motion.span>
          )}
        </AnimatePresence>
      </div>
    </motion.button>
  );
}

export default function App() {
  const [appError, setAppError] = useState<{ message: string, isFatal: boolean } | null>(null);

  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      setAppError({
        message: event.message || "Ocorreu um erro inesperado no sistema.",
        isFatal: true
      });
    };

    const handleRejection = (event: PromiseRejectionEvent) => {
      setAppError({
        message: event.reason?.message || (typeof event.reason === 'string' ? event.reason : "Erro de conexão ou processamento assíncrono."),
        isFatal: false
      });
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleRejection);
    };
  }, []);

  // Clean up residual audio snippets from the previous session on mount
  useEffect(() => {
    fetch('/api/clear-snippets', { method: 'POST' }).catch(() => {});
  }, []);

  const [phase, setPhase] = useState<Phase>(0);
  const [themeMode, setThemeMode] = useState<'light' | 'dark' | 'system'>('system');
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('dark');
  const [scrolled, setScrolled] = useState(false);
  const [playingAudio, setPlayingAudio] = useState<string | null>(null);
  const audioRef = useRef<Howl | null>(null);

  const toggleAudio = (e: React.MouseEvent, code: string) => {
    e.stopPropagation();
    if (playingAudio === code) {
      audioRef.current?.stop();
      setPlayingAudio(null);
    } else {
      if (audioRef.current) {
        audioRef.current.stop();
      }
      const sound = new Howl({
        src: [`/samples/${code}.mp3`],
        html5: true,
        onend: () => setPlayingAudio(null),
        onloaderror: () => setPlayingAudio(null),
        onplayerror: () => setPlayingAudio(null)
      });
      sound.play();
      audioRef.current = sound;
      setPlayingAudio(code);
    }
  };
  
  // Audio Snippet Player Logic
  const [playingSnippet, setPlayingSnippet] = useState<{ path: string, tempUrl: string } | null>(null);
  const snippetAudioRef = useRef<Howl | null>(null);

  const toggleSnippet = async (path: string) => {
    if (playingSnippet?.path === path) {
      snippetAudioRef.current?.stop();
      fetch('/api/delete-snippet', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ tempUrl: playingSnippet.tempUrl }) });
      setPlayingSnippet(null);
    } else {
      if (snippetAudioRef.current && playingSnippet) {
        snippetAudioRef.current.stop();
        fetch('/api/delete-snippet', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ tempUrl: playingSnippet.tempUrl }) });
      }
      try {
        const res = await fetch('/api/snippet', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ path }) });
        const data = await res.json();
        if (data.url) {
          setPlayingSnippet({ path, tempUrl: data.url });
          const sound = new Howl({
            src: [data.url],
            html5: true,
            onend: () => {
              fetch('/api/delete-snippet', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ tempUrl: data.url }) });
              setPlayingSnippet(null);
            },
            onloaderror: () => setPlayingSnippet(null),
            onplayerror: () => setPlayingSnippet(null)
          });
          sound.play();
          snippetAudioRef.current = sound;
        }
      } catch (e) {
        setPlayingSnippet(null);
      }
    }
  };

  useEffect(() => {
    return () => {
      if (snippetAudioRef.current && playingSnippet) {
        snippetAudioRef.current.stop();
        fetch('/api/delete-snippet', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ tempUrl: playingSnippet.tempUrl }) });
      }
    };
  }, [playingSnippet]);

  useEffect(() => {
    const handleScroll = () => {
      const mainElement = document.querySelector('main');
      if (mainElement && mainElement.scrollTop > 1) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };
    
    const mainElement = document.querySelector('main');
    if (mainElement) {
      mainElement.addEventListener('scroll', handleScroll);
      // Initial check
      handleScroll();
      return () => mainElement.removeEventListener('scroll', handleScroll);
    }
  }, []);

  useEffect(() => {
    if (themeMode === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      setResolvedTheme(mediaQuery.matches ? 'dark' : 'light');
      
      const handler = (e: MediaQueryListEvent) => setResolvedTheme(e.matches ? 'dark' : 'light');
      mediaQuery.addEventListener('change', handler);
      return () => mediaQuery.removeEventListener('change', handler);
    } else {
      setResolvedTheme(themeMode);
    }
  }, [themeMode]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', resolvedTheme === 'dark');
  }, [resolvedTheme]);

  const toggleTheme = () => {
    setThemeMode(prev => {
      if (prev === 'system') return 'light';
      if (prev === 'light') return 'dark';
      return 'system';
    });
  };

  // Navigation menus state
  const [showHistory, setShowHistory] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [openHelpSubmenus, setOpenHelpSubmenus] = useState<Record<string, boolean>>({});
  const [settingsMenuOpen, setSettingsMenuOpen] = useState(false);
  
  // Settings state
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const [voiceMenuOpen, setVoiceMenuOpen] = useState(false);
  const [folderMenuOpen, setFolderMenuOpen] = useState(false);
  const [fileTypeMenuOpen, setFileTypeMenuOpen] = useState(false);
  
  // Modals state
  const [showTranslationModal, setShowTranslationModal] = useState(false);
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [showClearHistoryModal, setShowClearHistoryModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showFileTypeModal, setShowFileTypeModal] = useState(false);
  const [showVoiceModal, setShowVoiceModal] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState(() => {
    if (typeof window === 'undefined') return 'en-US-GuyNeural';
    const sysLang = navigator.language.split('-')[0];
    if (sysLang === 'pt') return 'pt-BR-AntonioNeural';
    if (sysLang === 'es') return 'es-ES-AlvaroNeural';
    if (sysLang === 'ar') return 'ar-SA-HamedNeural';
    return 'en-US-GuyNeural';
  });
  const [duplicateFileTitle, setDuplicateFileTitle] = useState('');
  const [foreignLangFile, setForeignLangFile] = useState<AppFile | null>(null);
  const [shouldTranslate, setShouldTranslate] = useState(false);
  const [expandedHistoryId, setExpandedHistoryId] = useState<string | null>(null);
  const [tempFileType, setTempFileType] = useState<'single' | 'multiple'>('single');
  const [fileTypeOption, setFileTypeOption] = useState<'ask' | 'single' | 'multiple'>('ask');
  const [showWelcomeModal, setShowWelcomeModal] = useState(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('has_seen_welcome_v3') !== 'true';
  });
  const [showInitialConfigModal, setShowInitialConfigModal] = useState(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('has_seen_welcome_v3') === 'true' && localStorage.getItem('has_seen_initial_config_v3') !== 'true';
  });

  useEffect(() => {
    localStorage.setItem('file_type_option', fileTypeOption);
  }, [fileTypeOption]);

  // Application language and global preferences
  const [interfaceLang, setInterfaceLang] = useState(() => {
    if (typeof window === 'undefined') return 'en-US';
    const sysLang = navigator.language.split('-')[0];
    const supported = ['pt', 'en', 'es', 'ar'];
    if (supported.includes(sysLang)) {
      if (sysLang === 'pt') return 'pt-BR';
      if (sysLang === 'en') return 'en-US';
      if (sysLang === 'es') return 'es-ES';
      if (sysLang === 'ar') return 'ar-SA';
    }
    return 'en-US';
  });

  const [defaultVoice, setDefaultVoice] = useState(() => {
    return 'ask';
  });

  const t = translations[interfaceLang as keyof typeof translations] || translations['en-US'];

  useEffect(() => {
    document.documentElement.dir = t.dir;
  }, [interfaceLang, t.dir]);

  const [outputFolder, setOutputFolder] = useState(() => {
    if (typeof window === 'undefined') return '';
    if (localStorage.getItem('has_seen_initial_config_v3') !== 'true') return '';
    const saved = localStorage.getItem('output_folder');
    if (saved) return saved;
    
    // The browser cannot securely discover the absolute local path for the user's OS, so it starts empty.
    return '';
  });

  useEffect(() => {
    localStorage.setItem('output_folder', outputFolder);
  }, [outputFolder]);

  const [files, setFiles] = useState<AppFile[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>(() => {
    if (typeof window === 'undefined') return [];
    const saved = localStorage.getItem('audiobook_history');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('audiobook_history', JSON.stringify(history));
  }, [history]);

  // DOM Refs
  const historyRef = useRef<HTMLDivElement>(null);
  const tutorialRef = useRef<HTMLDivElement>(null);
  const settingsRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const hasNotifiedRef = useRef(false);

  // Handle outside clicks to close menus and modals
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (showHistory && historyRef.current && !historyRef.current.contains(target)) setShowHistory(false);
      if (showTutorial && tutorialRef.current && !tutorialRef.current.contains(target)) setShowTutorial(false);
      if (settingsMenuOpen && settingsRef.current && !settingsRef.current.contains(target)) {
        setSettingsMenuOpen(false);
        setLangMenuOpen(false);
        setVoiceMenuOpen(false);
        setFolderMenuOpen(false);
      }
      // Close modals on backdrop click
      if (showDuplicateModal && target.classList.contains('modal-backdrop')) setShowDuplicateModal(false);
      if (showTranslationModal && target.classList.contains('modal-backdrop')) setShowTranslationModal(false);
      if (showClearHistoryModal && target.classList.contains('modal-backdrop')) setShowClearHistoryModal(false);
      if (showCancelModal && target.classList.contains('modal-backdrop')) setShowCancelModal(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showHistory, showTutorial, settingsMenuOpen, showDuplicateModal, showTranslationModal, showClearHistoryModal, showCancelModal]);

  // Handle Server-Sent Events (SSE) for real-time progress updates
  useEffect(() => {
    let eventSource: EventSource;
    if (phase === 2) {
      hasNotifiedRef.current = false;
      eventSource = new EventSource('/api/progress');
      
      eventSource.onmessage = (event) => {
        const data = JSON.parse(event.data);
        
        setFiles(prevFiles => {
          const newFiles = prevFiles.map(f => {
            if (f.id === data.fileId) {
              if (data.type === 'progress') {
                const currentProg = data.progress;
                const isTranslating = data.status === 'translating';
                const isEditing = data.status === 'editing';
                
                let currentPhaseStartTime = f.phaseStartTime || Date.now();
                if (f.status !== data.status && f.status !== 'idle') {
                  currentPhaseStartTime = Date.now(); 
                }
                
                if (data.status === 'translating') {
                  return { ...f, translationProgress: currentProg, status: 'translating', isTranslating: true, isEditing: false, phaseStartTime: currentPhaseStartTime };
                } else if (data.status === 'editing') {
                  return { ...f, editingProgress: currentProg, status: 'editing', isEditing: true, isTranslating: false, translationProgress: 100, phaseStartTime: currentPhaseStartTime };
                } else {
                  return { ...f, progress: currentProg, status: 'processing', editingProgress: 100, translationProgress: 100, isEditing: false, isTranslating: false, partsDone: data.partsDone !== undefined ? data.partsDone : f.partsDone, partsTotal: data.partsTotal || f.partsTotal, phaseStartTime: currentPhaseStartTime };
                }
              } else if (data.type === 'done') {
                return { 
                  ...f, 
                  progress: 100, 
                  status: 'success', 
                  generatedPaths: data.paths,
                  audioSizeEst: data.finalSize || f.audioSizeEst,
                  durationEst: data.finalDuration || f.durationEst
                };
              } else if (data.type === 'error') {
                return { ...f, status: 'error', errorMessage: data.error };
              }
            }
            return f;
          });

          const allDone = newFiles.every(f => f.status === 'success' || f.status === 'error');
          if (allDone && newFiles.length > 0) {
            if (!hasNotifiedRef.current) {
              hasNotifiedRef.current = true;
              setTimeout(() => {
                const hasError = newFiles.some(f => f.status === 'error');
                if (hasError) {
                  notify(t.error, t.someErrors, 'error');
                } else {
                  notify(t.completed, t.allCompleted, 'success');
                }
                
                setPhase(3);
                const newHistoryItems = newFiles.map(f => ({
                  id: Math.random().toString(),
                  title: f.title,
                  author: f.author,
                  date: new Date().toLocaleString(interfaceLang),
                  status: f.status as 'success' | 'error',
                  cover: f.cover,
                  path: f.generatedPaths && f.generatedPaths.length > 0 ? f.generatedPaths[0] : outputFolder
                }));
                setHistory(prev => [...newHistoryItems, ...prev]);
              }, 1000);
            }
          }

          return newFiles;
        });
      };
    }
    return () => {
      if (eventSource) {
        eventSource.close();
      }
    };
  }, [phase]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = event.target.files;
    if (!selectedFiles || selectedFiles.length === 0) return;

    const newFiles: AppFile[] = [];
    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i];
      const fileId = Math.random().toString();
      
      const newFile: AppFile = {
        id: fileId,
        filename: file.name,
        title: file.name.replace(/\.[^/.]+$/, ""),
        author: t.unknownAuthor,
        language: '...',
        sizeStr: (file.size / (1024 * 1024)).toFixed(2) + ' MB',
        durationEst: '...',
        processingTimeEst: '...',
        status: 'idle',
        progress: 0,
        translationProgress: 0,
        editingProgress: 0,
        isTranslating: false,
        isEditing: false,
        requiresTranslation: false,
        partsTotal: 1,
        partsDone: 0,
        fileObj: file,
        metadataStatus: 'loading'
      };
      newFiles.push(newFile);
      
      // Fetch metadata from backend
      const formData = new FormData();
      formData.append('file', file);
      formData.append('filename', file.name);
      
      fetch('/api/metadata', {
        method: 'POST',
        body: formData
      }).then(async res => {
        if (!res.ok) {
          const text = await res.text();
          throw new Error(`Server error (${res.status}): ${text.substring(0, 100)}`);
        }
        return res.json();
      }).then(data => {
        setFiles(prev => prev.map(f => {
          if (f.id === fileId) {
            // Map detected language code to supported application languages
            const detectedLang = data.languageCode?.toLowerCase() || data.language?.toLowerCase() || '';
            let langName = f.language;
            if (detectedLang.includes('en')) langName = 'English (US)';
            else if (detectedLang.includes('pt')) langName = 'Português (PT-BR)';
            else if (detectedLang.includes('es')) langName = 'Español';
            else if (detectedLang.includes('ar')) langName = 'العربية';
            else if (detectedLang !== 'unknown') langName = data.language;

            const unknownStr = interfaceLang === 'pt-BR' ? 'Desconhecido' : 'Unknown';

            return {
              ...f,
              title: data.title !== 'Unknown' ? data.title : f.title,
              author: data.author !== 'Unknown' ? data.author : f.author,
              language: langName,
              durationEst: data.durationEst !== 'Unknown' ? data.durationEst : unknownStr,
              processingTimeEst: data.processingTimeEst !== 'Unknown' ? data.processingTimeEst : unknownStr,
              audioSizeEst: data.audioSizeEst,
              cover: data.cover,
              metadataStatus: 'loaded'
            };
          }
          return f;
        }));
      }).catch(err => {
        console.error("Failed to fetch metadata", err);
        setFiles(prev => prev.map(f => {
          if (f.id === fileId) {
            return { ...f, metadataStatus: 'error', durationEst: 'Erro', processingTimeEst: 'Erro', language: 'Erro' };
          }
          return f;
        }));
      });
    }

    setFiles(prev => [...prev, ...newFiles]);
    setPhase(1);
    
    // Clear input so same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const areFilesLoadingMetadata = files.some(f => 
    f.metadataStatus === 'loading'
  );

  const checkBeforeConversion = () => {
    const duplicate = files.find(f => history.some(h => h.title === f.title && h.status === 'success'));
    if (duplicate) {
      setDuplicateFileTitle(duplicate.title);
      setShowDuplicateModal(true);
      return;
    }
    proceedToTranslationCheck();
  };

  const proceedToTranslationCheck = () => {
    setShowDuplicateModal(false);
    
    const interfaceLangToName: Record<string, string> = {
      'pt-BR': 'Português (PT-BR)',
      'en-US': 'English (US)',
      'es-ES': 'Español',
      'ar-SA': 'العربية'
    };
    
    const currentAppLangName = interfaceLangToName[interfaceLang] || 'English (US)';
    const foreign = files.find(f => f.language !== currentAppLangName && f.language !== 'Unknown');
    
    if (foreign) {
      setForeignLangFile(foreign);
      setShowTranslationModal(true);
    } else {
      checkFileType();
    }
  };

  const checkFileType = (translate: boolean = false) => {
    setShouldTranslate(translate);
    if (fileTypeOption === 'ask') {
      setShowFileTypeModal(true);
    } else {
      startProcessing(translate);
    }
  };

  const startProcessing = async (translate: boolean = false, forcedMode?: 'single' | 'multiple') => {
    setShowTranslationModal(false);
    setShowFileTypeModal(false);
    const mode = forcedMode || (fileTypeOption === 'multiple' ? 'multiple' : 'single');
    const mode_folder = mode === 'multiple';
    
    const interfaceLangToName: Record<string, string> = {
      'pt-BR': 'Português (PT-BR)',
      'en-US': 'English (US)',
      'es-ES': 'Español',
      'ar-SA': 'العربية'
    };
    const currentAppLangName = interfaceLangToName[interfaceLang] || 'English (US)';
    
    setShouldTranslate(translate);
    setFiles(files.map(f => ({ 
      ...f, 
      status: translate && f.language !== currentAppLangName ? 'translating' : 'editing', 
      progress: 0,
      translationProgress: 0,
      editingProgress: 0,
      isTranslating: translate && f.language !== currentAppLangName,
      isEditing: !(translate && f.language !== currentAppLangName),
      requiresTranslation: translate && f.language !== currentAppLangName,
      processingStartTime: Date.now(),
      phaseStartTime: Date.now()
    })));
    setPhase(2);

    const formData = new FormData();
    const filesInfo = files.map(f => {
      if (f.fileObj) {
        formData.append('files', f.fileObj);
      }
      return {
        id: f.id,
        filename: f.filename,
        title: f.title,
        author: f.author,
        translate: translate && f.language !== currentAppLangName,
        cover: f.cover
      };
    });

    formData.append('filesInfo', JSON.stringify(filesInfo));
    formData.append('config', JSON.stringify({
      voice: defaultVoice === 'ask' ? selectedVoice : defaultVoice,
      outputFolder: outputFolder,
      mode_folder: mode_folder,
      target_lang: interfaceLang.split('-')[0]
    }));

    try {
      await fetch('/api/process', {
        method: 'POST',
        body: formData
      });
    } catch (error) {
      console.error("Failed to start processing:", error);
    }
  };

  const reset = () => {
    if (playingSnippet) {
      snippetAudioRef.current?.pause();
      setPlayingSnippet(null);
    }
    fetch('/api/clear-snippets', { method: 'POST' }).catch(() => {});
    setFiles([]);
    setPhase(0);
    setShowHistory(false);
    setSettingsMenuOpen(false);
    setShowTutorial(false);
  };

  const handleRemoveFile = (id: string) => {
    const updatedFiles = files.filter(f => f.id !== id);
    setFiles(updatedFiles);
    if (updatedFiles.length === 0) {
      setPhase(0);
    }
  };

  const playNotificationSound = (type: 'success' | 'error') => {
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      if (type === 'success') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523.25, ctx.currentTime);
        osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.1);
        
        gain.gain.setValueAtTime(0, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.2, ctx.currentTime + 0.05);
        gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.3);
      } else {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(150, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.2);
        
        gain.gain.setValueAtTime(0, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.2, ctx.currentTime + 0.05);
        gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.3);
      }
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.3);
    } catch (e) {
      console.error("Audio playback failed", e);
    }
  };

  const notify = (title: string, body: string, type: 'success' | 'error' = 'success') => {
    if (Notification.permission === 'granted') {
      new Notification(title, { body });
    }
    playNotificationSound(type);
  };

  useEffect(() => {
    if (Notification.permission !== 'granted' && Notification.permission !== 'denied') {
      Notification.requestPermission();
    }
  }, []);

  const retryFile = (id: string) => {
    setFiles(files.map(f => f.id === id ? { ...f, status: 'processing', progress: 0, errorMessage: undefined } : f));
    // If we were in phase 3, we might want to stay there or go back to 2
    if (phase === 3) setPhase(2);
  };

  const updateFile = (id: string, field: keyof AppFile, value: string) => {
    setFiles(files.map(f => f.id === id ? { ...f, [field]: value } : f));
  };

  return (
    <div className="flex flex-col h-screen bg-mica text-main font-fluent select-none transition-colors duration-300">
      
      {/* HEADER */}
      <header className={cn(
        "fixed top-0 left-0 right-0 z-[110] flex flex-col sm:flex-row items-center sm:justify-end px-6 py-4 gap-4 sm:gap-0 transition-all duration-300",
        scrolled ? "bg-mica/95 backdrop-blur-xl" : "bg-transparent"
      )}>
        <div className="flex flex-wrap items-center justify-center sm:justify-end gap-2">
          
          {/* My Audiobooks Button */}
          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => fetch('/api/open-folder', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ path: outputFolder, isFile: false }) })}
            className="px-4 py-2 rounded-2xl bg-winblue/10 hover:bg-winblue/20 text-winblue transition-all flex items-center gap-2 text-sm"
          >
            <FiHeadphones size={20} />
            {t.myAudiobooks}
          </motion.button>

          {/* History Menu */}
          <div className="relative" ref={historyRef}>
            <motion.button 
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                setShowHistory(!showHistory);
                setSettingsMenuOpen(false);
                setShowTutorial(false);
              }}
              className={cn(
                "p-2 rounded-2xl transition-all flex items-center gap-2 relative",
                showHistory 
                  ? "bg-winblue text-white" 
                  : (resolvedTheme === 'dark' ? "bg-[var(--button-secondary-bg)] text-white hover:bg-white/20" : "bg-[var(--button-secondary-bg)] text-[var(--text-main)] hover:bg-black/5")
              )}
            >
              {showHistory && <div className="absolute inset-0 m-auto w-5 h-5 bg-white/50 blur-md rounded-full" />}
              <Clock size={20} className="relative z-10" />
            </motion.button>

            <AnimatePresence>
              {showHistory && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9, y: -20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: -20 }}
                  style={{ transformOrigin: 'top right' }}
                  className={cn(
                    "absolute mt-2 w-96 bg-card/80 backdrop-blur-xl rounded-3xl shadow-2xl z-[150] overflow-hidden flex flex-col max-h-[85vh]",
                    t.dir === 'rtl' ? "left-0" : "right-0"
                  )}
                >
                  <div className="p-6 sticky top-0 bg-card/90 backdrop-blur-md z-10 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Clock size={20} className="text-winblue shrink-0" />
                      <h2 className="text-xl text-winblue">{t.history}</h2>
                    </div>
                    {history.length > 0 && (
                      <ExpandableButton 
                        icon={Trash2} 
                        label={t.delete} 
                        variant="error"
                        expandDirection="left"
                        className="h-9"
                        onClick={() => setShowClearHistoryModal(true)}
                      />
                    )}
                  </div>

                  <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                    {history.length === 0 ? (
                      <div className="py-12 text-center text-[var(--text-muted)] flex flex-col items-center gap-3">
                        <div className="opacity-30">
                          <TiThListOutline size={40} />
                        </div>
                        <p className="text-sm">{t.noHistory}</p>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        {history.map((item) => (
                          <motion.div 
                            key={item.id} 
                            initial={{ opacity: 0, x: -10 }} 
                            animate={{ opacity: 1, x: 0 }} 
                            whileHover={{ scale: 1.02 }}
                            className="group relative px-1 py-2 rounded-2xl hover:bg-[var(--button-secondary-bg)] transition-all"
                          >
                            <div className="flex items-center gap-3">
                              <div className={cn("p-0 rounded-2xl overflow-hidden w-8 h-8 flex items-center justify-center shrink-0", item.status === 'success' ? "text-success bg-success/10" : "text-error bg-error/10")}>
                                {item.cover ? (
                                  <img src={`data:image/png;base64,${item.cover}`} alt="cover" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                ) : (
                                  item.status === 'success' ? <LuBookHeadphones size={18} /> : <LuBookX size={18} />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs truncate">{item.title} - {item.author}</p>
                                <p className="text-[9px] text-[var(--text-muted)] opacity-60 mt-0.5">{item.date}</p>
                              </div>
                            </div>
                            
                            <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              {item.status === 'success' && (
                                <>
                                  <ExpandableButton 
                                    icon={MdOutlineSnippetFolder} 
                                    label={t.seeInFolder} 
                                    variant="success"
                                    expandDirection="left"
                                    className="h-8"
                                    onClick={() => fetch('/api/open-folder', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ path: item.path || outputFolder, isFile: !!item.path }) })}
                                  />
                                </>
                              )}
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Help Menu */}
          <div className="relative" ref={tutorialRef}>
            <motion.button 
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                setShowTutorial(!showTutorial);
                setSettingsMenuOpen(false);
                setShowHistory(false);
              }}
              className={cn(
                "p-2 rounded-2xl transition-all flex items-center gap-2 relative",
                showTutorial 
                  ? "bg-winblue text-white" 
                  : (resolvedTheme === 'dark' ? "bg-[var(--button-secondary-bg)] text-white hover:bg-white/20" : "bg-[var(--button-secondary-bg)] text-[var(--text-main)] hover:bg-black/5")
              )}
            >
              {showTutorial && <div className="absolute inset-0 m-auto w-5 h-5 bg-white/50 blur-md rounded-full" />}
              <HelpCircle size={20} className="relative z-10" />
            </motion.button>

            <AnimatePresence>
              {showTutorial && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9, y: -20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: -20 }}
                  style={{ transformOrigin: 'top right' }}
                  className={cn(
                    "absolute mt-2 w-[450px] bg-card/80 backdrop-blur-xl rounded-3xl shadow-2xl z-[150] overflow-hidden flex flex-col max-h-[85vh]",
                    t.dir === 'rtl' ? "left-0" : "right-0"
                  )}
                >
                  <div className="p-6 sticky top-0 bg-card/90 backdrop-blur-md z-10 flex items-center gap-2 shrink-0">
                    <HelpCircle size={20} className="text-winblue shrink-0" />
                    <h2 className="text-xl text-winblue">{t.help}</h2>
                  </div>
                  <div className="flex-1 overflow-y-auto p-4 custom-scrollbar space-y-2">
                    {Object.entries(t.helpContent).map(([key, item]) => {
                      const Icon = {
                        upload: MdOutlineDriveFolderUpload,
                        generate: LuBookAudio,
                        conversion: LuFileAudio,
                        voices: RiUserVoiceLine,
                        save: LuFolderDown,
                        access: FiHeadphones,
                        extras: RiApps2Fill,
                        config: CiSettings
                      }[key as keyof typeof t.helpContent];

                      return (
                        <div key={key} className="space-y-1">
                          <motion.button
                            whileHover={{ scale: 1.01 }}
                            onClick={() => setOpenHelpSubmenus(prev => ({ ...prev, [key]: !prev[key] }))}
                            className={cn(
                              "w-full flex items-center justify-between p-3 rounded-2xl transition-all",
                              openHelpSubmenus[key] ? "text-winblue" : "hover:bg-[var(--button-secondary-bg)] text-[var(--text-main)]"
                            )}
                          >
                            <div className="flex items-center gap-3">
                              {Icon && <span className="text-winblue"><Icon size={18} /></span>}
                              <span className="text-sm font-normal">{item.title}</span>
                            </div>
                            <ChevronDown size={14} className={cn("transition-transform text-white", openHelpSubmenus[key] && "rotate-180")} />
                          </motion.button>
                          <AnimatePresence>
                            {openHelpSubmenus[key] && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden"
                              >
                                <div className="pb-3 pl-11 pr-3 text-xs text-[var(--text-muted)] leading-relaxed">
                                  {item.content}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Settings Menu */}
          <div className="relative" ref={settingsRef}>
            <motion.button 
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                setSettingsMenuOpen(!settingsMenuOpen);
                setShowTutorial(false);
                setShowHistory(false);
              }}
              className={cn(
                "p-2 rounded-2xl transition-all flex items-center gap-2 relative",
                settingsMenuOpen 
                  ? "bg-winblue text-white" 
                  : (resolvedTheme === 'dark' ? "bg-[var(--button-secondary-bg)] text-white hover:bg-white/20" : "bg-[var(--button-secondary-bg)] text-[var(--text-main)] hover:bg-black/5")
              )}
            >
              {settingsMenuOpen && <div className="absolute inset-0 m-auto w-5 h-5 bg-white/50 blur-md rounded-full" />}
              <Settings size={20} className={cn("relative z-10", settingsMenuOpen && "rotate-90 transition-transform duration-500")} />
            </motion.button>

            <AnimatePresence>
              {settingsMenuOpen && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9, y: -20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: -20 }}
                  style={{ transformOrigin: 'top right' }}
                  className={cn( // Increased width from w-80 to w-[400px]
                    "absolute mt-2 w-[400px] bg-card/80 backdrop-blur-xl rounded-3xl shadow-2xl z-[150] overflow-hidden flex flex-col max-h-[85vh]",
                    t.dir === 'rtl' ? "left-0" : "right-0"
                  )}
                >
                  <div className="p-6 sticky top-0 bg-card/90 backdrop-blur-md z-10 flex items-center gap-2 text-winblue shrink-0">
                    <Settings size={20} className="shrink-0" />
                    <h2 className="text-xl">{t.adjustments}</h2>
                  </div>

                  <div className="py-2 px-2 overflow-y-auto max-h-[85vh] custom-scrollbar overflow-x-hidden space-y-0.5">
                    {/* Interface Section */}
                    <div className="px-4 py-2 text-[10px] font-bold text-winblue/50 capitalize tracking-widest">{t.interface}</div>
                    
                    <motion.button 
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setThemeMode(themeMode === 'dark' ? 'light' : 'dark')}
                      className="w-full text-left px-4 py-2.5 rounded-2xl hover:bg-[var(--button-secondary-bg)] transition-colors flex items-center justify-between text-sm"
                    >
                      <div className="flex items-center gap-2">
                        <Moon size={16} className="text-winblue shrink-0" /> {t.darkMode}
                      </div>
                      <div className={cn("w-8 h-4 rounded-2xl relative transition-colors", resolvedTheme === 'dark' ? "bg-winblue" : "bg-[var(--toggle-bg-off)]")}>
                        <motion.div animate={{ x: resolvedTheme === 'dark' ? 16 : 0 }} className="absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-2xl" />
                      </div>
                    </motion.button>
                    
                    {/* Language Dropdown */}
                    <motion.button 
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setLangMenuOpen(!langMenuOpen)}
                      className={cn("w-full text-left px-4 py-2.5 rounded-2xl hover:bg-[var(--button-secondary-bg)] transition-colors flex items-center justify-between text-sm", langMenuOpen && "text-winblue")}
                    >
                      <div className="flex items-center gap-2"><Languages size={16} className="text-winblue shrink-0" /> {t.interfaceLang}</div>
                      <ChevronDown size={14} className={cn("transition-transform text-white", langMenuOpen && "rotate-180")} />
                    </motion.button>
                    <AnimatePresence>
                      {langMenuOpen && (
                        <motion.div 
                          initial={{ height: 0, opacity: 0 }} 
                          animate={{ height: 'auto', opacity: 1 }} 
                          exit={{ height: 0, opacity: 0 }} 
                          className="overflow-hidden"
                        >
                          <div className="py-1 pl-11 pr-2 space-y-1">
                            {[{ code: 'pt-BR', label: 'Português (Brasil)' }, { code: 'en-US', label: 'English (US)' }, { code: 'es-ES', label: 'Español (ES)' }, { code: 'ar-SA', label: 'العربية (SA)' }].map((lang) => (
                              <motion.button
                                key={lang.code}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => setInterfaceLang(lang.code)}
                                className={cn("w-full text-left px-3 py-1.5 rounded-2xl text-xs transition-colors flex items-center justify-between", interfaceLang === lang.code ? "bg-winblue/20 text-winblue" : "hover:bg-[var(--button-secondary-bg)] text-[var(--text-muted)]")}
                              >
                                <span className="truncate">{lang.label}</span>
                                {interfaceLang === lang.code && <Check size={14} className="shrink-0" />}
                              </motion.button>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Conversion Section */}
                    <div className="px-4 py-2 mt-2 text-[10px] font-bold text-winblue/50 capitalize tracking-widest">{t.conversion}</div>

                    {/* Voice Dropdown */}
                    <motion.button 
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setVoiceMenuOpen(!voiceMenuOpen)}
                      className={cn("w-full text-left px-4 py-2.5 rounded-2xl hover:bg-[var(--button-secondary-bg)] transition-colors flex items-center justify-between text-sm", voiceMenuOpen && "text-winblue")}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-winblue shrink-0"><RiUserVoiceLine size={16} /></span>
                        {t.voice}
                      </div>
                      <ChevronDown size={14} className={cn("transition-transform text-white", voiceMenuOpen && "rotate-180")} />
                    </motion.button>
                    <AnimatePresence>
                      {voiceMenuOpen && (
                        <motion.div 
                          initial={{ height: 0, opacity: 0 }} 
                          animate={{ height: 'auto', opacity: 1 }} 
                          exit={{ height: 0, opacity: 0 }} 
                          className="overflow-hidden"
                        >
                          <div className="py-1 pl-11 pr-2 space-y-1">
                            {[
                              { code: 'ask', label: t.askAlways },
                              { code: 'pt-BR-AntonioNeural', label: 'Português - Antonio (M)' },
                              { code: 'pt-BR-FranciscaNeural', label: 'Português - Francisca (F)' },
                              { code: 'en-US-GuyNeural', label: 'English - Guy (M)' },
                              { code: 'en-US-AriaNeural', label: 'English - Aria (F)' },
                              { code: 'es-ES-AlvaroNeural', label: 'Español - Alvaro (M)' },
                              { code: 'es-ES-ElviraNeural', label: 'Español - Elvira (F)' },
                              { code: 'ar-SA-HamedNeural', label: 'العربية - Hamed (M)' },
                              { code: 'ar-SA-ZariyahNeural', label: 'العربية - Zariyah (F)' }
                            ].map((v) => (
                              <div key={v.code} className="group flex items-center gap-1">
                                <motion.button
                                  whileHover={{ scale: 1.02 }}
                                  whileTap={{ scale: 0.98 }}
                                  onClick={() => setDefaultVoice(v.code)}
                                  className={cn("flex-1 text-left px-3 py-1.5 rounded-2xl text-xs transition-colors flex items-center justify-between", defaultVoice === v.code ? "bg-winblue/20 text-winblue" : "hover:bg-[var(--button-secondary-bg)] text-[var(--text-muted)]")}
                                >
                                  <div className="flex items-center gap-2 truncate">
                                    <span className="truncate">{v.label}</span>
                                  </div>
                                  {defaultVoice === v.code && <Check size={14} className="shrink-0" />}
                                </motion.button>
                                {v.code !== 'ask' && (
                                  <motion.button 
                                    whileHover={{ scale: 1.1 }}
                                    onClick={(e: React.MouseEvent) => toggleAudio(e, v.code)}
                                    className="opacity-0 group-hover:opacity-100 p-1.5 rounded-xl bg-[var(--button-secondary-bg)] hover:bg-winblue/20 text-winblue transition-all shrink-0"
                                  >
                                    {playingAudio === v.code ? <FaStop size={12} /> : <HiMiniSpeakerWave size={14} />}
                                  </motion.button>
                                )}
                              </div>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* File Type Dropdown */}
                    <motion.button 
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setFileTypeMenuOpen(!fileTypeMenuOpen)}
                      className={cn("w-full text-left px-4 py-2.5 rounded-2xl hover:bg-[var(--button-secondary-bg)] transition-colors flex items-center justify-between text-sm", fileTypeMenuOpen && "text-winblue")}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-winblue shrink-0"><LuFileCog size={16} /></span>
                        {t.fileType}
                      </div>
                      <ChevronDown size={14} className={cn("transition-transform text-white", fileTypeMenuOpen && "rotate-180")} />
                    </motion.button>
                    <AnimatePresence>
                      {fileTypeMenuOpen && (
                        <motion.div 
                          initial={{ height: 0, opacity: 0 }} 
                          animate={{ height: 'auto', opacity: 1 }} 
                          exit={{ height: 0, opacity: 0 }} 
                          className="overflow-hidden"
                        >
                          <div className="py-1 pl-11 pr-2 space-y-1">
                            {[
                              { id: 'ask', label: t.askAlways },
                              { id: 'single', label: t.singleFile },
                              { id: 'multiple', label: t.multipleFiles }
                            ].map((opt) => (
                              <motion.button
                                key={opt.id}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => {
                                  setFileTypeOption(opt.id as any);
                                  setFileTypeMenuOpen(false);
                                }}
                                className={cn("w-full text-left px-3 py-1.5 rounded-2xl text-xs transition-colors flex items-center justify-between", fileTypeOption === opt.id ? "bg-winblue/20 text-winblue" : "hover:bg-[var(--button-secondary-bg)] text-[var(--text-muted)]")}
                              >
                                <span className="truncate">{opt.label}</span>
                                {fileTypeOption === opt.id && <Check size={14} className="shrink-0" />}
                              </motion.button>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Saving Section */}
                    <div className="px-4 py-2 mt-2 text-[10px] font-bold text-winblue/50 capitalize tracking-widest">{t.saving}</div>

                    {/* Output Folder */}
                    <motion.button 
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setFolderMenuOpen(!folderMenuOpen)}
                      className={cn("w-full text-left px-4 py-2.5 rounded-2xl hover:bg-[var(--button-secondary-bg)] transition-colors flex items-center justify-between text-sm", folderMenuOpen && "text-winblue")}
                    >
                      <div className="flex items-center gap-2"><FolderOpen size={16} className="text-winblue shrink-0" /> {t.outputFolder}</div>
                      <ChevronDown size={14} className={cn("transition-transform text-white", folderMenuOpen && "rotate-180")} />
                    </motion.button>
                    <AnimatePresence>
                      {folderMenuOpen && (
                        <motion.div 
                          initial={{ height: 0, opacity: 0 }} 
                          animate={{ height: 'auto', opacity: 1 }} 
                          exit={{ height: 0, opacity: 0 }} 
                          className="overflow-hidden"
                        >
                          <div className="py-2 pl-11 pr-4 space-y-2">
                            <div className="flex gap-2">
                              <input type="text" value={outputFolder} onChange={(e) => setOutputFolder(e.target.value)} className="flex-1 bg-[var(--button-secondary-bg)] rounded-2xl px-3 py-1.5 text-[10px] outline-none text-main min-w-0 focus:ring-1 focus:ring-winblue/30 transition-all" />
                              <ExpandableButton 
                                icon={LuFolderPen} 
                                label={t.change} 
                                className="h-8"
                                expandDirection="left"
                                onClick={async () => {
                                  try {
                                    const res = await fetch('/api/select-folder', { method: 'POST' });
                                    const data = await res.json();
                                    if (data.path) {
                                      setOutputFolder(data.path);
                                    } else if (!data.cancelled && !data.error) {
                                      // Fallback for non-windows or errors
                                      const newPath = prompt(t.interfaceLang === 'pt-BR' ? "Digite o novo caminho local:" : "Enter the new local path:", outputFolder);
                                      if (newPath) setOutputFolder(newPath);
                                    }
                                  } catch (e) {
                                    const newPath = prompt(t.interfaceLang === 'pt-BR' ? "Digite o novo caminho local:" : "Enter the new local path:", outputFolder);
                                    if (newPath) setOutputFolder(newPath);
                                  }
                                }}
                              />
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* About Section */}
                    <div className="px-4 py-2 mt-2 text-[10px] font-bold text-winblue/50 capitalize tracking-widest">{t.about}</div>
                    <div className="px-4 pt-1 pb-2">
                      <p className="text-sm text-white font-medium">Versão 1.0.0 (Build 1)</p>
                    </div>
                    <div className="px-4 py-3 space-y-4">
                      <div>
                        <p className="text-[10px] tracking-widest text-[var(--text-muted)] mb-0.5">{t.authorship}</p>
                        <div className="flex items-center gap-2">
                          <p className="text-sm text-[var(--text-main)]">thenauan</p>
                          <a href="https://github.com/thenauan" target="_blank" rel="noopener noreferrer" className="text-[var(--text-muted)] hover:text-winblue transition-colors">
                            <FaGithub size={14} />
                          </a>
                        </div>
                      </div>
                    </div>

                    <div className="px-2 pt-2 pb-4">
                      <motion.button 
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => { if (confirm('Fechar aplicativo?')) window.close(); }}
                        className="w-full text-left px-4 py-2.5 rounded-2xl bg-error/10 hover:bg-error/20 transition-colors flex items-center gap-3 text-sm text-error"
                      >
                        <span className="shrink-0"><SlClose size={18} /></span>
                        <span>{t.closeApp}</span>
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <motion.main 
        key={resolvedTheme}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="flex-1 overflow-y-auto px-6 pb-24 pt-28 sm:pt-24"
      >
        <AnimatePresence mode="popLayout">
          {phase === 0 && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
              onClick={() => fileInputRef.current?.click()}
              className="h-full flex flex-col items-center justify-center rounded-[2.5rem] cursor-pointer transition-all duration-500 group min-h-[400px] relative overflow-hidden border-2 border-dashed border-[var(--dropzone-border)] hover:border-winblue/50 hover:bg-winblue/[0.02] hover:shadow-[0_0_50px_rgba(0,134,240,0.15)]"
            >
              {/* Glow Effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-winblue/0 via-winblue/0 to-winblue/0 group-hover:from-winblue/5 group-hover:via-transparent group-hover:to-winblue/5 transition-all duration-700 opacity-0 group-hover:opacity-100" />
              
              <div className="relative mb-6 flex flex-col items-center gap-4 z-10">
                <motion.div 
                  animate={{ y: [0, -10, 0] }} 
                  transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                  className="group-hover:scale-110 transition-transform duration-500"
                >
                  <span className="text-main/20 group-hover:text-winblue transition-colors duration-500">
                    <LuUpload size={64} />
                  </span>
                </motion.div>
                <p className="text-main/40 group-hover:text-winblue group-hover:scale-105 transition-all duration-500 text-center px-8 font-medium text-lg">
                  {t.dragDrop}
                </p>
              </div>
            </motion.div>
          )}

          {phase === 1 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
              {files.map((file) => (
                <motion.div key={file.id} layout initial={{ opacity: 0, y: 20, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="bg-card p-5 rounded-2xl transition-all duration-300 flex flex-col gap-4 group relative overflow-hidden">
                  <div className="flex items-center gap-4">
                    <div className="p-0 rounded-2xl bg-winblue/10 overflow-hidden w-12 h-12 flex items-center justify-center shrink-0">
                      <Book size={24} className="text-winblue" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col">
                        <span className="font-medium truncate text-lg text-[var(--text-main)]">{file.filename}</span>
                      </div>
                      <div className="flex items-center gap-4 text-[10px] text-[var(--text-muted)] mt-1">
                        <div className="flex items-center gap-1.5">
                          <Globe size={12} />
                          {file.metadataStatus === 'loading' 
                            ? <Loader2 size={10} className="animate-spin text-winblue" /> 
                            : <span>{file.language}</span>}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <HardDrive size={12} />
                          <span>{file.sizeStr}</span>
                        </div>
                      </div>
                    </div>
                    <ExpandableButton 
                      icon={X} 
                      label={t.remove} 
                      onClick={() => handleRemoveFile(file.id)} 
                      variant="error"
                      expandDirection="left"
                    />
                  </div>
                  
                  <div className="flex flex-col gap-4">
                    <div className="flex flex-col md:flex-row gap-4 items-stretch">
                      <div className="flex flex-col gap-1.5 flex-1">
                        <label className="text-[10px] text-[var(--text-muted)] tracking-wider px-1">{t.title}</label>
                        <input 
                          className="bg-[var(--button-secondary-bg)] rounded-2xl px-4 py-2.5 text-sm w-full focus:outline-none focus:ring-2 focus:ring-winblue/20 transition-all h-full text-main" 
                          placeholder={t.title} 
                          value={file.title}
                          onChange={(e) => updateFile(file.id, 'title', e.target.value)}
                        />
                      </div>
                      <div className="flex flex-col gap-1.5 flex-1">
                        <label className="text-[10px] text-[var(--text-muted)] tracking-wider px-1">{t.authorLabel}</label>
                        <input 
                          className="bg-[var(--button-secondary-bg)] rounded-2xl px-4 py-2.5 text-sm w-full focus:outline-none focus:ring-2 focus:ring-winblue/20 transition-all h-full text-main" 
                          placeholder={t.authorLabel} 
                          value={file.author}
                          onChange={(e) => updateFile(file.id, 'author', e.target.value)}
                        />
                      </div>
                    </div>
                    
                    <div className="flex flex-col gap-2 mt-2">
                      <div className="text-[10px] text-[var(--text-muted)] tracking-wider px-1">{t.predictions}</div>
                      <div className="flex flex-wrap gap-6 items-center px-1">
                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-[var(--text-muted)] shrink-0">{t.duration}:</span>
                          {file.metadataStatus === 'loading' 
                            ? <Loader2 size={12} className="animate-spin text-winblue" /> 
                            : file.metadataStatus === 'error' 
                            ? <span className="font-medium text-error text-xs">Erro</span>
                            : <span className="font-medium text-main">{file.durationEst}</span>}
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-[var(--text-muted)] shrink-0">{t.size}:</span>
                          {file.metadataStatus === 'loading' 
                            ? <Loader2 size={12} className="animate-spin text-winblue" /> 
                            : file.metadataStatus === 'error' 
                            ? <span className="font-medium text-error text-xs">Erro</span>
                            : <span className="font-medium text-main">{file.audioSizeEst || file.sizeStr}</span>}
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-[var(--text-muted)] shrink-0">{t.procTime}:</span>
                          {file.metadataStatus === 'loading' 
                            ? <Loader2 size={12} className="animate-spin text-winblue" /> 
                            : file.metadataStatus === 'error' 
                            ? <span className="font-medium text-error text-xs">Erro</span>
                            : <span className="text-winblue font-medium">{file.processingTimeEst}</span>}
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}

          {(phase === 2 || phase === 3) && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
              {[...files].sort((a, b) => {
                const aDone = a.status === 'success' || a.status === 'error';
                const bDone = b.status === 'success' || b.status === 'error';
                if (aDone && !bDone) return -1;
                if (!aDone && bDone) return 1;
                return 0;
              }).map((file) => {
                const isFinished = file.status === 'success' || file.status === 'error';
                
                if (isFinished) {
                  return (
                    <motion.div key={file.id} layout initial={{ opacity: 0, y: 20, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className={cn("p-4 rounded-2xl transition-all duration-300 flex flex-col sm:flex-row items-start sm:items-center gap-4 relative overflow-hidden", file.status === 'success' ? (resolvedTheme === 'dark' ? 'bg-[#1a3a1a] text-[#a8e6a8]' : 'bg-success/10 text-success') : (resolvedTheme === 'dark' ? 'bg-[#3a1a1a] text-[#e6a8a8]' : 'bg-error/10 text-error'))}>
                      <div className={cn("w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 overflow-hidden", file.status === 'success' ? 'bg-success/20 text-success' : 'bg-error/20 text-error')}>
                        {file.cover ? (
                          <img src={`data:image/png;base64,${file.cover}`} alt="cover" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        ) : (
                          file.status === 'success' ? <LuBookHeadphones size={20} /> : <LuBookX size={20} />
                        )}
                      </div>
                      <div className="flex-1 min-w-0 w-full">
                        <div className="flex flex-col">
                          <span className="font-medium truncate text-lg text-[var(--text-main)]">{file.title}</span>
                          <span className="text-sm text-[var(--text-muted)] truncate">{file.author}</span>
                        </div>
                        <div className="flex items-center gap-4 text-xs opacity-80 mt-1">
                          {file.status === 'success' ? (
                            <>
                              <div className="flex items-center gap-1">
                                <Clock size={12} />
                                <span>{file.durationEst}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <HardDrive size={12} />
                                <span>{file.audioSizeEst || file.sizeStr}</span>
                              </div>
                              <div className="flex items-center gap-1 text-success">
                                <CheckCircle2 size={14} />
                                <span>{t.completed}</span>
                              </div>
                            </>
                          ) : (
                            <div className="flex flex-col gap-1">
                              <div className="flex items-center gap-1 text-error">
                                <AlertCircle size={14} />
                                <span>Erro: {file.errorMessage || `${file.filename} processing failed`}</span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 w-full sm:w-auto">
                        {file.status === 'success' ? (
                          <>
                            {file.generatedPaths && file.generatedPaths.length > 0 && (
                              <ExpandableButton 
                                icon={playingSnippet?.path === file.generatedPaths[0] ? FaStop : FaPlay} 
                                label={playingSnippet?.path === file.generatedPaths[0] ? t.stopSnippet : t.playSnippet} 
                                variant="success"
                                expandDirection="left"
                                className="h-9"
                                onClick={() => toggleSnippet(file.generatedPaths![0])}
                              />
                            )}
                            <ExpandableButton 
                              icon={MdOutlineSnippetFolder} 
                              label={t.seeInFolder} 
                              variant="success"
                              expandDirection="left"
                              className="h-9"
                              onClick={() => fetch('/api/open-folder', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ path: file.generatedPaths ? file.generatedPaths[0] : outputFolder, isFile: !!file.generatedPaths }) })}
                            />
                          </>
                        ) : (
                          <ExpandableButton 
                            icon={RefreshCw} 
                            label={t.retry} 
                            variant="default"
                            expandDirection="left"
                            className="h-9"
                            onClick={() => retryFile(file.id)}
                          />
                        )}
                      </div>
                    </motion.div>
                  );
                }

                const isTranslating = file.status === 'translating';
                const isEditing = file.status === 'editing';

                const totalProgress = file.requiresTranslation 
                  ? (isTranslating ? (file.translationProgress * 0.3) : (isEditing ? 30 + (file.editingProgress * 0.1) : 40 + (file.progress * 0.6)))
                  : (isEditing ? (file.editingProgress * 0.1) : 10 + (file.progress * 0.9));

                return (
                  <motion.div key={file.id} layout initial={{ opacity: 0, y: 20, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="bg-[var(--button-secondary-bg)] p-5 rounded-2xl transition-all duration-300 flex flex-col gap-4 relative overflow-hidden">
                    <div className="flex items-center gap-4 relative z-10">
                      <div className={cn(
                        "w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 transition-colors overflow-hidden",
                        isTranslating || isEditing ? "bg-warning/10 text-warning" : "bg-winblue/10 text-winblue"
                      )}>
                        {isTranslating || isEditing ? <LuBookA size={20} /> : <LuBookAudio size={20} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col">
                          <span className="font-medium truncate text-[var(--text-main)]">{file.title}</span>
                          <span className="text-xs text-[var(--text-muted)] truncate">{file.author}</span>
                        </div>
                      </div>
                      <div className={cn(
                        "text-2xl font-semibold font-mono transition-colors", 
                        isTranslating || isEditing ? 'text-warning' : 'text-winblue'
                      )}>
                        {Math.round(totalProgress)}%
                      </div>
                    </div>
                    
                    <div className="flex flex-col gap-2 relative z-10">
                      <div className="flex justify-between items-end font-mono text-xs text-[var(--text-muted)]">
                        <span>{isTranslating ? t.translating : (isEditing ? t.editing : t.generating.replace('{done}', file.partsDone.toString()).replace('{total}', file.partsTotal.toString()))}</span>
                        <div className="flex items-center gap-3">
                          <span className="flex items-center gap-1"><ArrowDownToLine size={12} /> {(Math.random() * 2 + 2).toFixed(1)} MB/s</span>
                        </div>
                      </div>
                      <div className="h-5 bg-[var(--button-secondary-bg)] rounded-2xl overflow-hidden relative backdrop-blur-md">
                        <div className={cn(
                          "absolute top-0 left-0 bottom-0 transition-all duration-300 shadow-[0_0_15px_rgba(255,255,255,0.3)]", 
                          isTranslating || isEditing ? 'bg-warning' : 'bg-winblue'
                        )} style={{ width: `${totalProgress}%` }}>
                          <motion.div 
                            animate={{ x: ['-100%', '100%'] }} 
                            transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                          />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          )}

        </AnimatePresence>
      </motion.main>

      {/* FOOTER */}
      <footer className="fixed bottom-0 left-0 right-0 h-24 bg-mica/95 backdrop-blur-xl z-[100] flex items-center justify-center px-10">
        <div className="flex flex-col sm:flex-row items-center justify-center gap-6 w-full">
          <div className="flex flex-col sm:flex-row items-center gap-6 w-full sm:w-auto">
            {phase === 1 && (
              <>
                  <motion.button 
                    whileHover={{ scale: 1.02 }} 
                    whileTap={{ scale: 0.98 }} 
                    onClick={() => fileInputRef.current?.click()} 
                    className={cn(
                      "px-8 py-2.5 rounded-2xl transition-all flex items-center justify-center gap-2.5 w-full sm:w-64 text-sm",
                      resolvedTheme === 'light' ? "bg-[var(--button-light-bg)] text-[var(--button-light-text)]" : "bg-white/10 hover:bg-white/20 text-white"
                    )}
                  >
                    <span className="shrink-0"><LuUpload size={20} /></span> {t.addFiles}
                  </motion.button>
                <div className="relative w-full sm:w-auto flex" title={outputFolder.trim() === '' ? t.insertFolderError : ''}>
                  <motion.button 
                    whileHover={files.length > 0 && !areFilesLoadingMetadata && outputFolder.trim() !== '' ? { scale: 1.02 } : {}} 
                    whileTap={files.length > 0 && !areFilesLoadingMetadata && outputFolder.trim() !== '' ? { scale: 0.98 } : {}} 
                    onClick={checkBeforeConversion} 
                    disabled={files.length === 0 || areFilesLoadingMetadata || outputFolder.trim() === ''}
                    className={cn(
                      "px-10 py-2.5 rounded-2xl transition-all flex items-center justify-center gap-2.5 w-full sm:w-72 text-sm",
                      files.length > 0 && !areFilesLoadingMetadata && outputFolder.trim() !== '' ? "bg-winblue/10 hover:bg-winblue/20 text-winblue" : "bg-winblue/5 text-winblue/30 cursor-not-allowed"
                    )}
                  >
                    {areFilesLoadingMetadata ? (
                      <><Loader2 size={20} className="animate-spin" /> <span>{t.readingMetadata}</span></>
                    ) : (
                      <><span className="shrink-0"><RiVoiceAiFill size={20} /></span> {files.length > 1 ? t.generateAudiobooks : t.generateAudiobook}</>
                    )}
                  </motion.button>
                </div>
              </>
            )}
            {phase === 2 && (
              <motion.button 
                whileHover={{ scale: 1.02 }} 
                whileTap={{ scale: 0.98 }} 
                onClick={() => setShowCancelModal(true)} 
                className={cn(
                  "px-12 py-2.5 rounded-2xl transition-all flex items-center justify-center gap-2.5 w-full sm:w-80 text-sm",
                  resolvedTheme === 'light' ? "bg-[var(--button-light-bg)] text-[var(--button-light-text)]" : "bg-error/10 hover:bg-error/20 text-error"
                )}
              >
                <span className="shrink-0"><SlClose size={20} /></span> {t.cancelProcessing}
              </motion.button>
            )}
            {phase === 3 && (
              <motion.button 
                whileHover={{ scale: 1.02 }} 
                whileTap={{ scale: 0.98 }} 
                onClick={reset} 
                className="px-12 py-2.5 rounded-2xl bg-winblue/10 hover:bg-winblue/20 transition-all text-winblue flex items-center justify-center gap-2.5 w-full sm:w-64 text-sm"
              >
                <RefreshCw size={20} className="shrink-0" /> {t.newConversion}
              </motion.button>
            )}
          </div>
        </div>
      </footer>

      {/* MODALS */}
      <AnimatePresence>
        {appError && (
          <div className="fixed inset-0 z-[400] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm modal-backdrop">
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="bg-card w-full max-w-md p-6 rounded-2xl shadow-2xl border border-error/20">
              <div className="flex items-center gap-3 mb-4 text-left">
                <span className="text-error shrink-0"><HiOutlineEmojiSad size={24} /></span>
                <h2 className="text-lg text-error">Erro inesperado!</h2>
              </div>
              
              <div className="space-y-4 mb-6">
                <p className="text-sm text-[var(--text-muted)] leading-relaxed break-words">
                  {appError.message}
                </p>
                {appError.isFatal && (
                  <p className="text-xs text-[var(--text-muted)]">
                    Recomendamos fechar e reabrir o aplicativo para evitar mau funcionamento.
                  </p>
                )}
              </div>

              <div className="flex gap-3">
                {!appError.isFatal ? (
                  <motion.button 
                    whileHover={{ scale: 1.02 }} 
                    whileTap={{ scale: 0.98 }} 
                    onClick={() => setAppError(null)} 
                    className="w-full py-2.5 rounded-2xl bg-warning/10 hover:bg-warning/20 transition-colors text-warning text-sm flex items-center justify-center gap-2 font-medium"
                  >
                    <BsHandThumbsUp size={18} /> Entendi
                  </motion.button>
                ) : (
                  <motion.button 
                    whileHover={{ scale: 1.02 }} 
                    whileTap={{ scale: 0.98 }} 
                    onClick={() => { if (typeof window !== 'undefined') window.close(); }} 
                    className="w-full py-2.5 rounded-2xl bg-error/10 hover:bg-error/20 transition-colors text-error text-sm flex items-center justify-center gap-2 font-medium"
                  >
                    <SlClose size={18} /> Fechar app
                  </motion.button>
                )}
              </div>
            </motion.div>
          </div>
        )}
        {showWelcomeModal && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.9, y: 20 }} 
              className="bg-card w-full max-w-lg p-6 md:p-8 rounded-3xl shadow-2xl flex flex-col"
            >
              <div className="flex items-center gap-3 mb-6 text-left">
                <span className="text-winblue shrink-0">
                  <HiOutlineEmojiHappy size={24} />
                </span>
                <h2 className="text-xl text-winblue tracking-tight">Bem-vindo ao gerador de audiobooks!</h2>
              </div>
              
              <div className="space-y-4 mb-8 text-sm text-[var(--text-muted)] leading-relaxed">
                <p>O gerador de audiobooks converte ebooks e arquivos de texto em .epub, .mobi, .pdf e .txt em arquivos de áudio .mp3 que consistem em leituras feitas por inteligência artificial do conteúdo escrito.</p>
                <p>Você pode escolher entre salvar cada audiobook como um único arquivo de áudio .mp3 ou salvar um arquivo de áudio .mp3 para cada capítulo do livro. Além disso, você também pode escolher uma entre as vozes disponíveis para ler o conteúdo.</p>
                <p>O programa possui um tradutor embutido que te permite, se assim desejar, que você traduza os textos para o seu idioma e permite que você também salve os seus audiobooks no Google Drive.</p>
                
                <div className="p-4 bg-[#4d3d00] rounded-2xl text-[#ffeb99] mt-6 flex gap-3 items-start">
                  <AlertTriangle size={18} className="text-[#ffeb99] shrink-0 mt-0.5"/>
                  <p className="text-xs text-[#ffeb99] leading-relaxed">
                    O aplicativo foi feito para que as pessoas possam consumir conteúdo literário de forma mais facilitada e promover assim acessibilidade. Você não deve utilizar esse aplicativo para infringir direitos autorais ou processar conteúdo criminoso. O autor não se responsabiliza pelas atividades do usuário.
                  </p>
                </div>
              </div>

              <motion.button 
                whileHover={{ scale: 1.02 }} 
                whileTap={{ scale: 0.98 }} 
                onClick={() => {
                  localStorage.setItem('has_seen_welcome_v3', 'true');
                  setShowWelcomeModal(false);
                  setShowInitialConfigModal(true);
                }} 
                className="w-full py-3.5 rounded-2xl bg-winblue/10 hover:bg-winblue/20 transition-colors text-winblue text-sm flex items-center justify-center gap-2"
              >
                <GiConfirmed size={18} /> Confirmo que li, estou de acordo e desejo prosseguir
              </motion.button>
            </motion.div>
          </div>
        )}

        {showInitialConfigModal && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.9, y: 20 }} 
              className="bg-card w-full max-w-lg p-6 md:p-8 rounded-3xl shadow-2xl flex flex-col max-h-[90vh]"
            >
              <div className="flex items-center gap-3 mb-6 text-left shrink-0">
                <span className="text-winblue shrink-0">
                  <RiUserSettingsLine size={24} />
                </span>
                <h2 className="text-xl text-winblue tracking-tight">Configuração inicial</h2>
              </div>
              
              <div className="space-y-6 mb-8 text-sm text-[var(--text-muted)] leading-relaxed overflow-y-auto custom-scrollbar pr-2 flex-1">
                <p>Abaixo estão as configurações padrões do app e, caso deseje, você pode as alterar agora ou posteriormente em Ajustes.</p>

                <div>
                  <h3 className="text-lg text-winblue mb-2">Idioma do aplicativo</h3>
                  <div className="space-y-1">
                    {[{ code: 'pt-BR', label: 'Português (Brasil)', flag: '🇧🇷' }, { code: 'en-US', label: 'English (US)', flag: '🇺🇸' }, { code: 'es-ES', label: 'Español (ES)', flag: '🇪🇸' }, { code: 'ar-SA', label: 'العربية (SA)', flag: '🇸🇦' }].map((lang) => {
                      const sysLangPrefix = typeof navigator !== 'undefined' ? navigator.language.split('-')[0] : 'en';
                      const sysLangCode = sysLangPrefix === 'pt' ? 'pt-BR' : sysLangPrefix === 'es' ? 'es-ES' : sysLangPrefix === 'ar' ? 'ar-SA' : 'en-US';
                      return (
                      <motion.button
                        key={lang.code}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setInterfaceLang(lang.code)}
                        className={cn("w-full text-left px-3 py-2 rounded-2xl text-xs transition-colors flex items-center justify-between", interfaceLang === lang.code ? "bg-winblue/20 text-winblue" : "hover:bg-[var(--button-secondary-bg)] text-[var(--text-muted)]")}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <span className="text-lg">{lang.flag}</span>
                          <span className="truncate">{lang.label}</span>
                        </div>
                        {interfaceLang === lang.code && <div className="flex items-center gap-2">{lang.code === sysLangCode && <span className="text-[10px] uppercase tracking-wider opacity-70">Sistema</span>}<Check size={14} className="shrink-0" /></div>}
                      </motion.button>
                    )})}
                  </div>
                </div>

                <div>
                  <h3 className="text-lg text-winblue mb-2">Modo escuro</h3>
                  <motion.button 
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setThemeMode(themeMode === 'dark' ? 'light' : 'dark')}
                    className="w-full text-left px-3 py-2 rounded-2xl hover:bg-[var(--button-secondary-bg)] transition-colors flex items-center justify-between text-sm text-[var(--text-muted)]"
                  >
                    <div className="flex items-center gap-2">
                      <Moon size={16} className="text-[var(--text-muted)] shrink-0" /> {t.darkMode}
                    </div>
                    <div className="flex items-center gap-3">
                      {resolvedTheme === (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light') && <span className="text-[10px] uppercase tracking-wider opacity-70 text-winblue font-medium">Sistema</span>}
                      <div className={cn("w-8 h-4 rounded-2xl relative transition-colors", resolvedTheme === 'dark' ? "bg-winblue" : "bg-[var(--toggle-bg-off)]")}>
                        <motion.div animate={{ x: resolvedTheme === 'dark' ? 16 : 0 }} className="absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-2xl" />
                      </div>
                    </div>
                  </motion.button>
                </div>

                <div>
                  <h3 className="text-lg text-winblue mb-2">Voz</h3>
                  <div className="space-y-1">
                    {[
                      { code: 'ask', label: t.askAlways, flag: <RiUserVoiceLine size={18} /> },
                      { code: 'pt-BR-AntonioNeural', label: 'Português - Antonio (M)', flag: '🇧🇷' },
                      { code: 'pt-BR-FranciscaNeural', label: 'Português - Francisca (F)', flag: '🇧🇷' },
                      { code: 'en-US-GuyNeural', label: 'English - Guy (M)', flag: '🇺🇸' },
                      { code: 'en-US-AriaNeural', label: 'English - Aria (F)', flag: '🇺🇸' },
                      { code: 'es-ES-AlvaroNeural', label: 'Español - Alvaro (M)', flag: '🇪🇸' },
                      { code: 'es-ES-ElviraNeural', label: 'Español - Elvira (F)', flag: '🇪🇸' },
                      { code: 'ar-SA-HamedNeural', label: 'العربية - Hamed (M)', flag: '🇸🇦' },
                      { code: 'ar-SA-ZariyahNeural', label: 'العربية - Zariyah (F)', flag: '🇸🇦' }
                    ].map((v) => (
                      <div key={v.code} className="group flex items-center gap-2">
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => setDefaultVoice(v.code)}
                          className={cn("flex-1 text-left px-3 py-2 rounded-2xl text-xs transition-colors flex items-center justify-between min-w-0", defaultVoice === v.code ? "bg-winblue/20 text-winblue" : "hover:bg-[var(--button-secondary-bg)] text-[var(--text-muted)]")}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-lg flex items-center justify-center w-6 text-inherit shrink-0">{v.flag}</span>
                            <span className="truncate">{v.label}</span>
                          </div>
                          {defaultVoice === v.code && <div className="flex items-center gap-2 shrink-0">{v.code === 'ask' && <span className="text-[10px] uppercase tracking-wider opacity-70">Padrão</span>}<Check size={14} className="shrink-0" /></div>}
                        </motion.button>
                        {v.code !== 'ask' && (
                          <motion.button 
                            whileHover={{ scale: 1.1 }}
                            onClick={(e: React.MouseEvent) => toggleAudio(e, v.code)}
                            className="opacity-0 group-hover:opacity-100 p-2 rounded-xl bg-[var(--button-secondary-bg)] hover:bg-winblue/20 text-winblue transition-all shrink-0"
                          >
                            {playingAudio === v.code ? <FaStop size={14} /> : <HiMiniSpeakerWave size={16} />}
                          </motion.button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-lg text-winblue mb-2">Tipo de arquivo gerado</h3>
                  <div className="space-y-1">
                    {[
                      { id: 'ask', label: t.askAlways, icon: <LuFileCog size={18} /> },
                      { id: 'single', label: t.singleFile, icon: <LuFileAudio size={18} /> },
                      { id: 'multiple', label: t.multipleFiles, icon: <MdOutlineDriveFolderUpload size={18} /> }
                    ].map((opt) => (
                      <motion.button
                        key={opt.id}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                          setFileTypeOption(opt.id as any);
                        }}
                        className={cn("w-full text-left px-3 py-2 rounded-2xl text-xs transition-colors flex items-center justify-between", fileTypeOption === opt.id ? "bg-winblue/20 text-winblue" : "hover:bg-[var(--button-secondary-bg)] text-[var(--text-muted)]")}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="text-inherit shrink-0">{opt.icon}</span>
                          <span className="truncate">{opt.label}</span>
                        </div>
                        {fileTypeOption === opt.id && <div className="flex items-center gap-2 shrink-0">{opt.id === 'ask' && <span className="text-[10px] uppercase tracking-wider opacity-70">Padrão</span>}<Check size={14} className="shrink-0" /></div>}
                      </motion.button>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-lg text-winblue mb-2 flex items-center gap-2">
                    Pasta de salvamento <span className="text-xs text-error font-medium">* (Obrigatório)</span>
                  </h3>
                  <div className="flex gap-2">
                    <div className="flex-1 bg-[var(--button-secondary-bg)] rounded-2xl px-3 py-2 flex items-center gap-2 min-w-0">
                      <FolderOpen size={16} className="text-[var(--text-muted)] shrink-0" />
                      <input type="text" value={outputFolder} onChange={(e) => setOutputFolder(e.target.value)} className="flex-1 bg-transparent text-xs outline-none text-[var(--text-main)] min-w-0 border-b border-transparent focus:border-winblue/30 transition-all" />
                    </div>
                    <ExpandableButton 
                      icon={LuFolderPen} 
                      label={t.change} 
                      className="h-auto py-2"
                      expandDirection="left"
                      onClick={async () => {
                        try {
                          const res = await fetch('/api/select-folder', { method: 'POST' });
                          const data = await res.json();
                          if (data.path) {
                            setOutputFolder(data.path);
                          } else if (!data.cancelled && !data.error) {
                            const newPath = prompt(t.interfaceLang === 'pt-BR' ? "Digite o novo caminho local:" : "Enter the new local path:", outputFolder);
                            if (newPath) setOutputFolder(newPath);
                          }
                        } catch (e) {
                          const newPath = prompt(t.interfaceLang === 'pt-BR' ? "Digite o novo caminho local:" : "Enter the new local path:", outputFolder);
                          if (newPath) setOutputFolder(newPath);
                        }
                      }}
                    />
                  </div>
                </div>

              </div>

              <div className="relative w-full shrink-0" title={outputFolder.trim() === '' ? t.insertFolderError : ''}>
                <motion.button 
                  whileHover={outputFolder.trim() !== '' ? { scale: 1.02 } : {}} 
                  whileTap={outputFolder.trim() !== '' ? { scale: 0.98 } : {}} 
                  disabled={outputFolder.trim() === ''}
                  onClick={() => {
                    if (outputFolder.trim() === '') return;
                    localStorage.setItem('has_seen_initial_config_v3', 'true');
                    setShowInitialConfigModal(false);
                  }} 
                  className={cn(
                    "w-full py-3.5 rounded-2xl transition-colors text-sm flex items-center justify-center gap-2",
                    outputFolder.trim() !== '' ? "bg-winblue/10 hover:bg-winblue/20 text-winblue" : "bg-[var(--button-secondary-bg)] text-[var(--text-muted)] cursor-not-allowed opacity-50"
                  )}
                >
                  <BsStars size={18} /> Começar a gerar audiobooks
                </motion.button>
              </div>
            </motion.div>
          </div>
        )}

        {showDuplicateModal && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm modal-backdrop">
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="bg-card w-full max-w-md p-6 rounded-2xl">
              <div className="flex items-center gap-3 mb-4 text-left">
                <span className="text-warning shrink-0">
                  <AlertTriangle size={24} />
                </span>
                <h2 className="text-lg text-warning">{t.duplicateTitle}</h2>
              </div>
              <p className="text-xs text-[var(--text-muted)] mb-6" dangerouslySetInnerHTML={{ __html: t.duplicateDesc.replace('{title}', `<b>${duplicateFileTitle}</b>`) }} />
              <div className="flex gap-3">
                <motion.button 
                  whileHover={{ scale: 1.05 }} 
                  whileTap={{ scale: 0.95 }} 
                  onClick={() => {
                    const newFiles = files.filter(f => f.title !== duplicateFileTitle);
                    setFiles(newFiles);
                    setShowDuplicateModal(false);
                    if (newFiles.length === 0) setPhase(0);
                  }} 
                  className="flex-1 py-2 rounded-2xl bg-black/5 hover:bg-black/10 dark:bg-black/20 dark:hover:bg-black/40 transition-colors flex items-center justify-center gap-2 text-xs text-[var(--text-muted)]"
                >
                  <SlClose size={14} /> {t.cancelThis}
                </motion.button>
                <motion.button 
                  whileHover={{ scale: 1.05 }} 
                  whileTap={{ scale: 0.95 }} 
                  onClick={proceedToTranslationCheck} 
                  className="flex-[1.4] py-2 rounded-2xl bg-warning/10 hover:bg-warning/20 transition-colors flex items-center justify-center gap-2 whitespace-nowrap text-xs text-warning"
                >
                  <RiVoiceAiFill size={14} /> {t.generateAgain}
                </motion.button>
              </div>
            </motion.div>
          </div>
        )}

        {showTranslationModal && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm modal-backdrop">
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="bg-card w-full max-w-md p-6 rounded-2xl">
              <div className="flex items-center gap-3 mb-4 text-left">
                <span className="text-winblue shrink-0"><RiTranslateAi2 size={24} /></span>
                <h2 className="text-lg text-winblue">{t.foreignLangTitle.replace('{lang}', foreignLangFile?.language || '')}</h2>
              </div>
              <p className="text-xs text-[var(--text-muted)] mb-6" dangerouslySetInnerHTML={{ 
                __html: t.foreignLangDesc
                  .replace('{file}', `<b>${foreignLangFile?.title || ''}</b>`)
                  .replace('{lang}', foreignLangFile?.language || '')
                  .replace('{appLang}', (() => {
                    const interfaceLangToName: Record<string, string> = {
                      'pt-BR': 'Português (PT-BR)',
                      'en-US': 'English (US)',
                      'es-ES': 'Español',
                      'ar-SA': 'العربية'
                    };
                    return interfaceLangToName[interfaceLang] || 'English (US)';
                  })())
              }} />
              <div className="flex gap-3">
                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => checkFileType(false)} className="flex-1 py-2 rounded-2xl bg-black/5 hover:bg-black/10 dark:bg-black/20 dark:hover:bg-black/40 transition-colors flex items-center justify-center gap-2 text-xs text-[var(--text-muted)]">
                  <SlClose size={14} /> {t.keepOriginal}
                </motion.button>
                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => checkFileType(true)} className="flex-1 py-2 rounded-2xl bg-winblue/10 hover:bg-winblue/20 transition-colors text-winblue flex items-center justify-center gap-2 text-xs">
                  <MdGTranslate size={14} /> {t.translate}
                </motion.button>
              </div>
            </motion.div>
          </div>
        )}

        {showFileTypeModal && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm modal-backdrop">
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="bg-card w-full max-w-md p-6 rounded-2xl">
              <div className="flex items-center gap-3 mb-4 text-left">
                <span className="text-winblue shrink-0"><LuFileCog size={24} /></span>
                <h2 className="text-lg text-winblue">{t.fileTypeQuestion}</h2>
              </div>
              
              <div className="space-y-4 mb-6">
                <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                  {t.fileTypeDesc}
                </p>
                
                <div className="space-y-2">
                  <motion.button 
                    whileHover={{ scale: 1.02 }} 
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setTempFileType('single')}
                    className={cn(
                      "w-full flex items-center gap-3 p-3 rounded-2xl transition-all text-left",
                      tempFileType === 'single' ? "bg-winblue/5 text-winblue" : "text-[var(--text-muted)] hover:bg-[var(--button-secondary-bg)]"
                    )}
                  >
                    <LuFileAudio size={18} />
                    <span className="text-sm">{t.singleFile}</span>
                    {tempFileType === 'single' && <Check size={14} className="ml-auto" />}
                  </motion.button>
                  <motion.button 
                    whileHover={{ scale: 1.02 }} 
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setTempFileType('multiple')}
                    className={cn(
                      "w-full flex items-center gap-3 p-3 rounded-2xl transition-all text-left",
                      tempFileType === 'multiple' ? "bg-winblue/5 text-winblue" : "text-[var(--text-muted)] hover:bg-[var(--button-secondary-bg)]"
                    )}
                  >
                    <MdOutlineDriveFolderUpload size={18} />
                    <span className="text-sm">{t.multipleFiles}</span>
                    {tempFileType === 'multiple' && <Check size={14} className="ml-auto" />}
                  </motion.button>
                </div>
              </div>

              <div className="flex gap-3">
                <motion.button 
                  whileHover={{ scale: 1.02 }} 
                  whileTap={{ scale: 0.98 }} 
                  onClick={() => setShowFileTypeModal(false)} 
                  className="flex-1 py-2.5 rounded-2xl bg-black/5 hover:bg-black/10 dark:bg-black/20 dark:hover:bg-black/40 transition-colors flex items-center justify-center gap-2 text-sm text-[var(--text-muted)]"
                >
                  <SlClose size={16} /> {t.cancel}
                </motion.button>
                <motion.button 
                  whileHover={{ scale: 1.02 }} 
                  whileTap={{ scale: 0.98 }} 
                  onClick={() => {
                    setShowFileTypeModal(false);
                    if (defaultVoice === 'ask') {
                      setShowVoiceModal(true);
                    } else {
                      startProcessing(shouldTranslate, tempFileType);
                    }
                  }} 
                  className="flex-1 py-2.5 rounded-2xl bg-winblue/10 hover:bg-winblue/20 transition-colors text-winblue text-sm flex items-center justify-center gap-2 font-medium"
                >
                  <RiVoiceAiFill size={18} />
                  {t.generateAudiobook}
                </motion.button>
              </div>
            </motion.div>
          </div>
        )}

        {showVoiceModal && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm modal-backdrop">
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="bg-card w-full max-w-md p-6 rounded-2xl">
              <div className="flex items-center gap-3 mb-4 text-left">
                <span className="text-winblue shrink-0"><TbWorldDownload size={24} /></span>
                <h2 className="text-lg text-winblue">{t.voice}</h2>
              </div>
              
              <div className="space-y-4 mb-6">
                <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                  {t.voiceDesc}
                </p>
                
                <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar pr-2">
                  {[
                    { code: 'pt-BR-AntonioNeural', label: 'Português - Antonio (M)', flag: '🇧🇷' },
                    { code: 'pt-BR-FranciscaNeural', label: 'Português - Francisca (F)', flag: '🇧🇷' },
                    { code: 'en-US-GuyNeural', label: 'English - Guy (M)', flag: '🇺🇸' },
                    { code: 'en-US-AriaNeural', label: 'English - Aria (F)', flag: '🇺🇸' },
                    { code: 'es-ES-AlvaroNeural', label: 'Español - Alvaro (M)', flag: '🇪🇸' },
                    { code: 'es-ES-ElviraNeural', label: 'Español - Elvira (F)', flag: '🇪🇸' },
                    { code: 'ar-SA-HamedNeural', label: 'العربية - Hamed (M)', flag: '🇸🇦' },
                    { code: 'ar-SA-ZariyahNeural', label: 'العربية - Zariyah (F)', flag: '🇸🇦' }
                  ].map(v => (
                    <div key={v.code} className="group flex items-center gap-2">
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setSelectedVoice(v.code)}
                        className={cn(
                          "flex-1 flex items-center gap-3 p-3 rounded-2xl transition-all text-left",
                          selectedVoice === v.code ? "bg-winblue/5 text-winblue" : "text-[var(--text-muted)] hover:bg-[var(--button-secondary-bg)]"
                        )}
                      >
                        <span className="text-lg">{v.flag}</span>
                        <span className="text-sm">{v.label}</span>
                        {selectedVoice === v.code && <Check size={14} className="ml-auto" />}
                      </motion.button>
                      <motion.button 
                        whileHover={{ scale: 1.1 }}
                        onClick={(e: React.MouseEvent) => toggleAudio(e, v.code)}
                        className="opacity-0 group-hover:opacity-100 p-3 rounded-2xl bg-[var(--button-secondary-bg)] hover:bg-winblue/20 text-winblue transition-all shrink-0 shadow-sm"
                      >
                        {playingAudio === v.code ? <FaStop size={18} /> : <HiMiniSpeakerWave size={18} />}
                      </motion.button>
                    </div>
                  ))}                </div>
              </div>

              <div className="flex gap-3">
                <motion.button 
                  whileHover={{ scale: 1.02 }} 
                  whileTap={{ scale: 0.98 }} 
                  onClick={() => setShowVoiceModal(false)} 
                  className="flex-1 py-2.5 rounded-2xl bg-black/5 hover:bg-black/10 dark:bg-black/20 dark:hover:bg-black/40 transition-colors flex items-center justify-center gap-2 text-sm text-[var(--text-muted)]"
                >
                  <SlClose size={16} /> {t.cancel}
                </motion.button>
                <motion.button 
                  whileHover={{ scale: 1.02 }} 
                  whileTap={{ scale: 0.98 }} 
                  onClick={() => {
                    setShowVoiceModal(false);
                    startProcessing(shouldTranslate, tempFileType);
                  }} 
                  className="flex-1 py-2.5 rounded-2xl bg-winblue/10 hover:bg-winblue/20 transition-colors text-winblue text-sm flex items-center justify-center gap-2 font-medium"
                >
                  <RiVoiceAiFill size={18} />
                  {t.selectVoice}
                </motion.button>
              </div>
            </motion.div>
          </div>
        )}

        {showClearHistoryModal && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm modal-backdrop">
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="bg-card w-full max-w-md p-6 rounded-2xl">
              <div className="flex items-center gap-3 mb-4 text-left">
                <span className="text-error shrink-0"><RiDeleteBinLine size={24} /></span>
                <h2 className="text-lg text-error">{t.clearHistoryTitle}</h2>
              </div>
              <p className="text-xs text-[var(--text-muted)] mb-6">
                {t.confirmClearHistory}
              </p>
              <div className="flex gap-3">
                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => setShowClearHistoryModal(false)} className="flex-1 py-2 rounded-2xl bg-black/5 hover:bg-black/10 dark:bg-black/20 dark:hover:bg-black/40 transition-colors flex items-center justify-center gap-2 text-xs text-[var(--text-muted)]">
                  <SlClose size={14} /> {t.cancel}
                </motion.button>
                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => { 
                  setHistory([]); 
                  localStorage.setItem('audiobook_history', JSON.stringify([]));
                  // Explicitly wipe the backend backup so the deleted items don't resurrect on next launch
                  fetch('/api/backup', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ history: [], outputFolder, hasSeenWelcome: true, hasSeenConfig: true }) }).catch(() => {});
                  setShowClearHistoryModal(false); 
                }} className="flex-1 py-2 rounded-2xl bg-error/10 hover:bg-error/20 transition-colors text-error text-xs flex items-center justify-center gap-2">
                  <MdDeleteSweep size={16} /> {t.clearHistoryConfirm}
                </motion.button>
              </div>
            </motion.div>
          </div>
        )}

        {showCancelModal && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm modal-backdrop">
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="bg-card w-full max-w-lg p-6 rounded-2xl shadow-2xl border border-white/5">
              <div className="flex items-center gap-3 mb-4 text-left">
                <span className="text-error shrink-0">
                  <AlertTriangle size={24} />
                </span>
                <h2 className="text-lg text-error leading-tight">
                  {files.filter(f => f.status === 'processing' || f.status === 'translating').length > 1 ? t.cancelProcessingTitlePlural : t.cancelProcessingTitleSingle}
                </h2>
              </div>
              
              <p className="text-sm text-[var(--text-muted)] mb-6 leading-relaxed">
                {t.cancelProcessingDesc}
              </p>
              
              {files.filter(f => f.status === 'processing' || f.status === 'translating').length > 1 && (
                <div className="max-h-48 overflow-y-auto custom-scrollbar mb-6 space-y-2 pr-2 bg-[var(--button-secondary-bg)]/30 p-2 rounded-2xl">
                  {files.filter(f => f.status === 'processing' || f.status === 'translating').map(file => (
                    <div key={file.id} className="flex items-center justify-between p-3 rounded-xl bg-card/50">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-xl bg-winblue/10 text-winblue flex items-center justify-center shrink-0">
                          <Book size={16} />
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="text-xs truncate font-medium text-[var(--text-main)]">{file.title}</span>
                          <span className="text-[10px] truncate text-[var(--text-muted)]">{file.author || t.unknownAuthor}</span>
                        </div>
                      </div>
                      <ExpandableButton 
                        icon={X} 
                        label={t.cancelThis} 
                        variant="error"
                        expandDirection="left"
                        className="h-7"
                        onClick={() => {
                          const remaining = files.filter(f => f.id !== file.id);
                          if (remaining.length === 0) {
                            fetch('/api/cancel', { method: 'POST' });
                            reset();
                            setShowCancelModal(false);
                          } else {
                            setFiles(remaining);
                          }
                        }}
                      />
                    </div>
                  ))}
                </div>
              )}

              <div className="flex gap-3">
                <motion.button 
                  whileHover={{ scale: 1.02 }} 
                  whileTap={{ scale: 0.98 }} 
                  onClick={() => setShowCancelModal(false)} 
                  className="flex-1 py-3 rounded-2xl bg-black/5 hover:bg-black/10 dark:bg-black/20 dark:hover:bg-black/40 transition-colors flex items-center justify-center gap-2 text-sm text-[var(--text-muted)] font-medium"
                >
                  <RiVoiceAiFill size={18} /> {files.filter(f => f.status === 'processing' || f.status === 'translating').length > 1 ? t.keepProcessing : t.keepProcessingSingle}
                </motion.button>
                <motion.button 
                  whileHover={{ scale: 1.02 }} 
                  whileTap={{ scale: 0.98 }} 
                  onClick={() => { 
                    fetch('/api/cancel', { method: 'POST' });
                    reset(); 
                    setShowCancelModal(false); 
                  }} 
                  className="flex-1 py-3 rounded-2xl bg-error/10 hover:bg-error/20 transition-all text-error text-sm font-medium flex items-center justify-center gap-2"
                >
                  <SlClose size={18} /> {files.filter(f => f.status === 'processing' || f.status === 'translating').length > 1 ? t.cancelThese : t.cancelThis}
                </motion.button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <input type="file" ref={fileInputRef} onChange={handleFileUpload} multiple accept=".epub,.pdf,.mobi,.txt" className="hidden" />
    </div>
  );
}
