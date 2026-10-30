// ===== Telas e menus principais =====
import { ScreenId } from './types';

import pkg from '../../package.json';

export const APP_VERSION: string = pkg.version;

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
