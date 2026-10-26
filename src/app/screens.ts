// ===== Telas e menus principais =====
import { ScreenId } from './types';

export const APP_VERSION = "1.0.0";

// Menus Principais Raiz (os 7 menus principais da aplicação)
export const MAIN_MENUS: ScreenId[] = [
  'search',
  'converter',
  'history',
  'other-apps',
  'help',
  'settings'
];

export const isMainMenu = (screen: ScreenId): boolean => MAIN_MENUS.includes(screen);

// Telas raiz da navegação (itens do menu lateral)
export const ROOT_SCREENS: string[] = [...MAIN_MENUS];
