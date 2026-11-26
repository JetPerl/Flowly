import { useColorScheme } from 'react-native';

export interface ThemeColors {
    isDark: boolean;
    baseSurface: string;
    cardSurface: string;
    elevatedSurface: string;
    glassSurface: string;
    glassBorder: string;
    border: string;
    divider: string;
    chartGrid: string;
    iconSurface: string;
    iconPrimary: string;
    textMain: string;
    textSecondary: string;
    heroTextMain: string;
    income: string;
    expense: string;
    quickActionIcon: string;
    sliderDot: string;
    actionLink: string;
}

export const LIGHT_THEME_COLORS: ThemeColors = {
    isDark: false,
    baseSurface: '#F5F7FA',
    cardSurface: '#FFFFFF',
    elevatedSurface: '#FFFFFF',
    glassSurface: 'rgba(255, 255, 255, 0.85)',
    glassBorder: 'rgba(15, 23, 42, 0.06)',
    border: '#E5E7EB',
    divider: '#ECEFF1',
    chartGrid: '#EEF0F4',
    iconSurface: '#F3F4F6',
    iconPrimary: '#212121',
    textMain: '#212121',
    textSecondary: '#757575',
    heroTextMain: '#0F172A',
    income: '#2BAF8C',
    expense: '#212121',
    quickActionIcon: '#0F172A', // нейтральный тёмный — не спорит ни с персиковым, ни с лазурным
    sliderDot: '#0F172A',
    actionLink: '#0F172A',      // или '#1E6DFF', если хочешь классический синий
};

export const DARK_THEME_COLORS: ThemeColors = {
    isDark: true,
    baseSurface: '#0B0E11',
    cardSurface: '#151A20',
    elevatedSurface: '#1E252E',
    glassSurface: 'rgba(255, 255, 255, 0.12)',
    glassBorder: 'rgba(255, 255, 255, 0.14)',
    border: 'rgba(255, 255, 255, 0.10)',
    divider: 'rgba(255, 255, 255, 0.08)',
    chartGrid: 'rgba(255, 255, 255, 0.08)',
    iconSurface: 'rgba(255, 255, 255, 0.09)',
    iconPrimary: '#E2E8F0',
    textMain: '#F8FAFC',
    textSecondary: '#94A3B8',
    heroTextMain: '#FFFFFF',
    income: '#34D399',
    expense: '#F8FAFC',
    quickActionIcon: '#FFFFFF',
    sliderDot: '#FFFFFF',
    actionLink: '#FFFFFF',      // или '#4DA3FF' для синего варианта
};

export function useThemeColors(): ThemeColors {
    const colorScheme = useColorScheme();
    return colorScheme === 'dark' ? DARK_THEME_COLORS : LIGHT_THEME_COLORS;
}