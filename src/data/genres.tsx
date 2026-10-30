// ===== Gêneros e subgêneros dos livros =====
// Uma lista só, usada nas etiquetas do card do e-book e na edição do audiobook. Os subgêneros vêm agrupados
// por área, para a lista longa continuar fácil de percorrer.
import React from 'react';
import {
  BookOpen, Heart, Sparkles, Rocket, Search, Fingerprint, Ghost, Rainbow, Star, Baby, Feather, Drama, MessagesSquare,
  Library, BookHeart, Hourglass, Mountain, Laugh, Orbit, FileText, User, Landmark, Brain, Lightbulb, TrendingUp, Atom,
  Scale, Sun, HeartPulse, ChefHat, Plane, GraduationCap, Palette, Trophy, Castle, Wand2, Swords, Skull, Eye, Bot,
  Radiation, Clock, Coffee, Shield, Glasses, Flower2, Users, PenTool, Gem, Leaf, Briefcase, Venus, HandHeart, Crown,
  Moon, Zap, Flame, Map,
} from 'lucide-react';

export interface GenreOption { value: string; icon: React.ComponentType<{ size?: number }>; section?: string }

export const GENRES: GenreOption[] = [
  // Ficção
  { value: 'Ficção', icon: BookOpen, section: 'Ficção' },
  { value: 'Romance', icon: Heart, section: 'Ficção' },
  { value: 'Fantasia', icon: Sparkles, section: 'Ficção' },
  { value: 'Ficção Científica', icon: Rocket, section: 'Ficção' },
  { value: 'Suspense & Thriller', icon: Zap, section: 'Ficção' },
  { value: 'Mistério & Policial', icon: Search, section: 'Ficção' },
  { value: 'Terror & Horror', icon: Ghost, section: 'Ficção' },
  { value: 'LGBTQIA+', icon: Rainbow, section: 'Ficção' },
  { value: 'Jovem Adulto (YA)', icon: Star, section: 'Ficção' },
  { value: 'Infantojuvenil', icon: Baby, section: 'Ficção' },
  { value: 'Aventura', icon: Mountain, section: 'Ficção' },
  { value: 'Ficção Histórica', icon: Hourglass, section: 'Ficção' },
  { value: 'Distopia', icon: Orbit, section: 'Ficção' },
  { value: 'Humor', icon: Laugh, section: 'Ficção' },
  { value: 'Clássicos', icon: Library, section: 'Ficção' },
  { value: 'Literatura Brasileira', icon: BookHeart, section: 'Ficção' },
  { value: 'Poesia', icon: Feather, section: 'Ficção' },
  { value: 'Teatro & Dramaturgia', icon: Drama, section: 'Ficção' },
  { value: 'Contos & Crônicas', icon: MessagesSquare, section: 'Ficção' },
  { value: 'HQ & Mangá', icon: Palette, section: 'Ficção' },
  // Não-ficção
  { value: 'Não-Ficção', icon: FileText, section: 'Não-ficção' },
  { value: 'Biografia & Memórias', icon: User, section: 'Não-ficção' },
  { value: 'História', icon: Landmark, section: 'Não-ficção' },
  { value: 'Filosofia', icon: Brain, section: 'Não-ficção' },
  { value: 'Psicologia', icon: Brain, section: 'Não-ficção' },
  { value: 'Autoajuda & Desenvolvimento Pessoal', icon: Lightbulb, section: 'Não-ficção' },
  { value: 'Negócios & Finanças', icon: TrendingUp, section: 'Não-ficção' },
  { value: 'Ciência & Tecnologia', icon: Atom, section: 'Não-ficção' },
  { value: 'Política & Sociedade', icon: Scale, section: 'Não-ficção' },
  { value: 'Estudos de Gênero & LGBTQIA+', icon: Rainbow, section: 'Não-ficção' },
  { value: 'True Crime', icon: Fingerprint, section: 'Não-ficção' },
  { value: 'Religião & Espiritualidade', icon: Sun, section: 'Não-ficção' },
  { value: 'Saúde & Bem-estar', icon: HeartPulse, section: 'Não-ficção' },
  { value: 'Culinária', icon: ChefHat, section: 'Não-ficção' },
  { value: 'Viagem', icon: Plane, section: 'Não-ficção' },
  { value: 'Educação', icon: GraduationCap, section: 'Não-ficção' },
  { value: 'Arte & Música', icon: Palette, section: 'Não-ficção' },
  { value: 'Esportes', icon: Trophy, section: 'Não-ficção' },
];

export const SUBGENRES: GenreOption[] = [
  // Romance
  { value: 'Romance Contemporâneo', icon: Heart, section: 'Romance' },
  { value: 'Romance LGBTQIA+', icon: Rainbow, section: 'Romance' },
  { value: 'Romance Sáfico', icon: Venus, section: 'Romance' },
  { value: 'Romance Gay (MLM)', icon: Rainbow, section: 'Romance' },
  { value: 'Romance de Época', icon: Crown, section: 'Romance' },
  { value: 'Romantasia', icon: Wand2, section: 'Romance' },
  { value: 'Dark Romance', icon: Moon, section: 'Romance' },
  { value: 'Comédia Romântica', icon: Laugh, section: 'Romance' },
  { value: 'Enemies to Lovers', icon: Swords, section: 'Romance' },
  { value: 'New Adult', icon: Coffee, section: 'Romance' },
  // Fantasia e ficção científica
  { value: 'Fantasia Épica', icon: Castle, section: 'Fantasia e ficção científica' },
  { value: 'Fantasia Urbana', icon: Sparkles, section: 'Fantasia e ficção científica' },
  { value: 'Fantasia Sombria (Grimdark)', icon: Skull, section: 'Fantasia e ficção científica' },
  { value: 'Mitologia & Contos Recontados', icon: Flame, section: 'Fantasia e ficção científica' },
  { value: 'Realismo Mágico', icon: Flower2, section: 'Fantasia e ficção científica' },
  { value: 'Space Opera', icon: Rocket, section: 'Fantasia e ficção científica' },
  { value: 'Cyberpunk', icon: Bot, section: 'Fantasia e ficção científica' },
  { value: 'Distopia & Pós-apocalíptico', icon: Radiation, section: 'Fantasia e ficção científica' },
  { value: 'Viagem no Tempo', icon: Clock, section: 'Fantasia e ficção científica' },
  // Suspense e terror
  { value: 'Thriller Psicológico', icon: Eye, section: 'Suspense e terror' },
  { value: 'Policial Noir', icon: Glasses, section: 'Suspense e terror' },
  { value: 'Cozy Mystery', icon: Coffee, section: 'Suspense e terror' },
  { value: 'Espionagem', icon: Shield, section: 'Suspense e terror' },
  { value: 'Terror Psicológico', icon: Brain, section: 'Suspense e terror' },
  { value: 'Terror Sobrenatural', icon: Ghost, section: 'Suspense e terror' },
  // Literatura
  { value: 'Ficção Literária', icon: PenTool, section: 'Literatura' },
  { value: 'Ficção Queer', icon: Rainbow, section: 'Literatura' },
  { value: 'Coming of Age', icon: Star, section: 'Literatura' },
  { value: 'Autoficção', icon: User, section: 'Literatura' },
  { value: 'Ficção Histórica', icon: Hourglass, section: 'Literatura' },
  { value: 'Aventura & Exploração', icon: Map, section: 'Literatura' },
  // Não-ficção
  { value: 'Memórias LGBTQIA+', icon: Rainbow, section: 'Não-ficção' },
  { value: 'Feminismo', icon: Venus, section: 'Não-ficção' },
  { value: 'Diversidade & Inclusão', icon: Users, section: 'Não-ficção' },
  { value: 'Saúde Mental', icon: HandHeart, section: 'Não-ficção' },
  { value: 'Psicologia & Comportamento', icon: Brain, section: 'Não-ficção' },
  { value: 'Filosofia Estoica', icon: Leaf, section: 'Não-ficção' },
  { value: 'Espiritualidade', icon: Sun, section: 'Não-ficção' },
  { value: 'Produtividade & Foco', icon: Zap, section: 'Não-ficção' },
  { value: 'Finanças Pessoais', icon: Gem, section: 'Não-ficção' },
  { value: 'Empreendedorismo', icon: Briefcase, section: 'Não-ficção' },
  { value: 'Divulgação Científica', icon: Atom, section: 'Não-ficção' },
];

/** Opções para o pop-up de seleção (com seções e, no fim, "digitar outro") */
export function genreSelectorOptions(lista: GenreOption[], digitar: string, iconeDigitar: React.ReactNode) {
  return [
    ...lista.map(g => ({ value: g.value, label: g.value, icon: <g.icon size={13} />, section: g.section })),
    { value: '__custom__', label: digitar, icon: iconeDigitar, isCustomInput: true },
  ];
}

/** "Romance, LGBTQIA+" -> ["Romance", "LGBTQIA+"] (sem repetidos nem vazios) */
export function splitGenres(texto?: string): string[] {
  const vistos = new Set<string>();
  return (texto || '').split(',').map(g => g.trim()).filter(g => {
    const k = g.toLowerCase();
    if (!g || vistos.has(k)) return false;
    vistos.add(k);
    return true;
  });
}

export const joinGenres = (lista: string[]) => splitGenres(lista.join(',')).join(', ');

/** Marca ou desmarca um gênero numa lista separada por vírgula */
export function toggleGenre(texto: string | undefined, genero: string): string {
  const lista = splitGenres(texto);
  const i = lista.findIndex(g => g.toLowerCase() === genero.toLowerCase());
  if (i >= 0) lista.splice(i, 1);
  else lista.push(genero);
  return lista.join(', ');
}
