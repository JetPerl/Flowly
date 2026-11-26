export type FlowlyBackdropPreset = 'emerald' | 'azure' | 'peach' | 'amethyst';

export const FLOWLY_PRESET_ORDER: readonly FlowlyBackdropPreset[] = [
    'emerald',
    'azure',
    'peach',
    'amethyst',
];

export interface FlowlyThemePalette {
    preset: FlowlyBackdropPreset;
    isDark: boolean;
    /** Нейтральный фон экрана (в него уходит градиент при скролле вниз) */
    baseSurface: string;
    /** Поверхность карточек (historyCard, графики и т.д.) */
    cardSurface: string;
    /** Граница карточек */
    cardBorder: string;
    /** Полупрозрачная «стеклянная» подложка поверх градиента */
    glassSurface: string;
    glassBorder: string;
    /** 5 стопов диагонального градиента Skia (до прозрачного baseSurface) */
    gradientColors: [string, string, string, string, string];
    /** Верхнее правое свечение (яркий соседний оттенок) */
    glowPrimaryColors: [string, string, string];
    /** Верхнее левое свечение (контрастный глубинный оттенок) */
    glowSecondaryColors: [string, string, string];
    /** Центрально-боковой перламутровый блик для эффекта перелива */
    glowAccentColors: [string, string, string];
    /** Основной и вторичный текст */
    textMain: string;
    textSecondary: string;
    /** Текст поверх верхней цветной шапки */
    heroTextMain: string;
    heroTextSecondary: string;
    /** Акцентный цвет (кнопки, иконки, FAB) */
    primary: string;
}

const DEFAULT_PRESET: FlowlyBackdropPreset = 'emerald';

type PresetModeTokens = Pick<
    FlowlyThemePalette,
    | 'gradientColors'
    | 'glowPrimaryColors'
    | 'glowSecondaryColors'
    | 'glowAccentColors'
    | 'primary'
>;

type PresetDefinition = {
    dark: PresetModeTokens;
    light: PresetModeTokens;
};

const PRESET_DEFINITIONS: Record<FlowlyBackdropPreset, PresetDefinition> = {
    /** Зелёный: изумруд + лагунный тил + мята + аквамарин */
    emerald: {
        dark: {
            gradientColors: [
                'rgba(10, 82, 74, 0.98)',
                'rgba(12, 60, 62, 0.85)',
                'rgba(12, 38, 44, 0.52)',
                'rgba(11, 22, 26, 0.20)',
                'rgba(11, 14, 17, 0)',
            ],
            glowPrimaryColors: [
                'rgba(46, 232, 178, 0.50)',
                'rgba(24, 182, 146, 0.18)',
                'rgba(24, 182, 146, 0)',
            ],
            glowSecondaryColors: [
                'rgba(16, 172, 212, 0.44)',
                'rgba(14, 118, 152, 0.15)',
                'rgba(14, 118, 152, 0)',
            ],
            glowAccentColors: [
                'rgba(132, 245, 176, 0.28)',
                'rgba(68, 218, 162, 0.09)',
                'rgba(68, 218, 162, 0)',
            ],
            primary: 'rgba(46, 212, 166, 1)',
        },
        light: {
            gradientColors: [
                'rgba(48, 206, 166, 0.60)',
                'rgba(88, 222, 200, 0.42)',
                'rgba(162, 242, 226, 0.21)',
                'rgba(216, 246, 240, 0.07)',
                'rgba(245, 247, 250, 0)',
            ],
            glowPrimaryColors: [
                'rgba(46, 216, 234, 0.52)',
                'rgba(104, 232, 246, 0.18)',
                'rgba(104, 232, 246, 0)',
            ],
            glowSecondaryColors: [
                'rgba(128, 238, 166, 0.48)',
                'rgba(166, 244, 204, 0.16)',
                'rgba(166, 244, 204, 0)',
            ],
            glowAccentColors: [
                'rgba(194, 252, 232, 0.50)',
                'rgba(156, 244, 222, 0.14)',
                'rgba(156, 244, 222, 0)',
            ],
            primary: 'rgba(28, 156, 124, 1)',
        },
    },

    /** Лазурный: сапфир + электрический циан + индиго/барвинок + ледяной блик */
    azure: {
        dark: {
            gradientColors: [
                'rgba(18, 72, 152, 0.98)',
                'rgba(20, 52, 118, 0.85)',
                'rgba(18, 34, 78, 0.52)',
                'rgba(13, 21, 42, 0.20)',
                'rgba(11, 14, 17, 0)',
            ],
            glowPrimaryColors: [
                'rgba(52, 198, 255, 0.56)',
                'rgba(34, 144, 236, 0.20)',
                'rgba(34, 144, 236, 0)',
            ],
            glowSecondaryColors: [
                'rgba(112, 96, 255, 0.46)',
                'rgba(78, 72, 224, 0.15)',
                'rgba(78, 72, 224, 0)',
            ],
            glowAccentColors: [
                'rgba(116, 238, 252, 0.30)',
                'rgba(62, 196, 246, 0.10)',
                'rgba(62, 196, 246, 0)',
            ],
            primary: 'rgba(64, 162, 255, 1)',
        },
        light: {
            gradientColors: [
                'rgba(56, 164, 255, 0.58)',
                'rgba(104, 192, 255, 0.40)',
                'rgba(174, 218, 255, 0.20)',
                'rgba(218, 236, 252, 0.07)',
                'rgba(245, 247, 250, 0)',
            ],
            glowPrimaryColors: [
                'rgba(34, 214, 242, 0.52)',
                'rgba(102, 234, 250, 0.18)',
                'rgba(102, 234, 250, 0)',
            ],
            glowSecondaryColors: [
                'rgba(142, 134, 255, 0.44)',
                'rgba(170, 178, 255, 0.15)',
                'rgba(170, 178, 255, 0)',
            ],
            glowAccentColors: [
                'rgba(186, 238, 255, 0.52)',
                'rgba(164, 226, 255, 0.14)',
                'rgba(164, 226, 255, 0)',
            ],
            primary: 'rgba(28, 122, 232, 1)',
        },
    },

    /** Персиковый: коралл + медовый абрикос + розовая сакура + тёплый перламутр */
    peach: {
        dark: {
            gradientColors: [
                'rgba(148, 58, 48, 0.98)',
                'rgba(108, 40, 48, 0.85)',
                'rgba(64, 26, 38, 0.52)',
                'rgba(30, 17, 24, 0.20)',
                'rgba(11, 14, 17, 0)',
            ],
            glowPrimaryColors: [
                'rgba(255, 168, 96, 0.56)',
                'rgba(246, 122, 82, 0.20)',
                'rgba(246, 122, 82, 0)',
            ],
            glowSecondaryColors: [
                'rgba(246, 98, 152, 0.46)',
                'rgba(196, 66, 118, 0.15)',
                'rgba(196, 66, 118, 0)',
            ],
            glowAccentColors: [
                'rgba(255, 212, 142, 0.30)',
                'rgba(255, 174, 112, 0.10)',
                'rgba(255, 174, 112, 0)',
            ],
            primary: 'rgba(255, 138, 94, 1)',
        },
        light: {
            gradientColors: [
                'rgba(255, 148, 112, 0.62)',
                'rgba(255, 180, 146, 0.42)',
                'rgba(255, 212, 192, 0.21)',
                'rgba(255, 236, 226, 0.07)',
                'rgba(245, 247, 250, 0)',
            ],
            glowPrimaryColors: [
                'rgba(255, 198, 102, 0.56)',
                'rgba(255, 218, 146, 0.19)',
                'rgba(255, 218, 146, 0)',
            ],
            glowSecondaryColors: [
                'rgba(255, 128, 168, 0.48)',
                'rgba(255, 172, 198, 0.16)',
                'rgba(255, 172, 198, 0)',
            ],
            glowAccentColors: [
                'rgba(255, 234, 202, 0.54)',
                'rgba(255, 216, 184, 0.16)',
                'rgba(255, 216, 184, 0)',
            ],
            primary: 'rgba(226, 104, 64, 1)',
        },
    },

    /** Аметистовый: королевский фиолетовый + орхидея/маджента + кобальт + опаловая лаванда */
    amethyst: {
        dark: {
            gradientColors: [
                'rgba(92, 42, 148, 0.98)',
                'rgba(66, 32, 114, 0.85)',
                'rgba(40, 23, 74, 0.52)',
                'rgba(21, 16, 38, 0.20)',
                'rgba(11, 14, 17, 0)',
            ],
            glowPrimaryColors: [
                'rgba(224, 98, 246, 0.52)',
                'rgba(174, 74, 226, 0.18)',
                'rgba(174, 74, 226, 0)',
            ],
            glowSecondaryColors: [
                'rgba(86, 118, 255, 0.50)',
                'rgba(62, 86, 216, 0.16)',
                'rgba(62, 86, 216, 0)',
            ],
            glowAccentColors: [
                'rgba(164, 196, 255, 0.28)',
                'rgba(148, 116, 252, 0.10)',
                'rgba(148, 116, 252, 0)',
            ],
            primary: 'rgba(172, 120, 255, 1)',
        },
        light: {
            gradientColors: [
                'rgba(154, 116, 255, 0.56)',
                'rgba(182, 152, 255, 0.39)',
                'rgba(216, 200, 255, 0.20)',
                'rgba(236, 228, 255, 0.07)',
                'rgba(245, 247, 250, 0)',
            ],
            glowPrimaryColors: [
                'rgba(240, 128, 234, 0.50)',
                'rgba(246, 174, 242, 0.17)',
                'rgba(246, 174, 242, 0)',
            ],
            glowSecondaryColors: [
                'rgba(112, 158, 255, 0.48)',
                'rgba(162, 190, 255, 0.16)',
                'rgba(162, 190, 255, 0)',
            ],
            glowAccentColors: [
                'rgba(226, 218, 255, 0.54)',
                'rgba(206, 196, 255, 0.16)',
                'rgba(206, 196, 255, 0)',
            ],
            primary: 'rgba(122, 76, 248, 1)',
        },
    },
};

const isPresetName = (value: string): value is FlowlyBackdropPreset =>
    value === 'emerald' ||
    value === 'azure' ||
    value === 'peach' ||
    value === 'amethyst';

/** Извлекает Hue (0–360) из HEX (#RRGGBB или #RGB). Для серых/невалидных возвращает null */
export function hexToHue(hex?: string | null): number | null {
    if (!hex || typeof hex !== 'string') return null;
    const cleaned = hex.trim().replace('#', '');
    const full =
        cleaned.length === 3
            ? cleaned
                .split('')
                .map((ch) => ch + ch)
                .join('')
            : cleaned;

    if (!/^[0-9a-fA-F]{6}$/.test(full)) return null;

    const r = parseInt(full.slice(0, 2), 16) / 255;
    const g = parseInt(full.slice(2, 4), 16) / 255;
    const b = parseInt(full.slice(4, 6), 16) / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const delta = max - min;

    const lightness = (max + min) / 2;
    const saturation =
        delta === 0 ? 0 : delta / (1 - Math.abs(2 * lightness - 1));

    if (delta === 0 || saturation < 0.08) return null;

    let h = 0;
    if (max === r) h = ((g - b) / delta) % 6;
    else if (max === g) h = (b - r) / delta + 2;
    else h = (r - g) / delta + 4;

    h = Math.round(h * 60);
    return h < 0 ? h + 360 : h;
}

/** Определяет один из 4 многогранных пресетов по имени или HEX-цвету счёта */
export function resolveBackdropPreset(
    accentOrPreset?: string | null,
): FlowlyBackdropPreset {
    if (!accentOrPreset || typeof accentOrPreset !== 'string') {
        return DEFAULT_PRESET;
    }

    const normalized = accentOrPreset.trim().toLowerCase();
    if (isPresetName(normalized)) return normalized;

    const hue = hexToHue(normalized);
    if (hue === null) return DEFAULT_PRESET;

    if (hue < 72 || hue >= 325) return 'peach';
    if (hue < 186) return 'emerald';
    if (hue < 248) return 'azure';
    return 'amethyst';
}

export function buildFlowlyPalette(
    accentOrPreset: string | null | undefined,
    colorScheme: 'dark' | 'light' | null | undefined,
): FlowlyThemePalette {
    const isDark = colorScheme === 'dark';
    const preset = resolveBackdropPreset(accentOrPreset);
    const tokens = PRESET_DEFINITIONS[preset][isDark ? 'dark' : 'light'];

    if (isDark) {
        return {
            preset,
            isDark: true,
            baseSurface: '#0B0E11',
            cardSurface: '#151A20',
            cardBorder: 'rgba(255, 255, 255, 0.08)',
            glassSurface: 'rgba(255, 255, 255, 0.09)',
            glassBorder: 'rgba(255, 255, 255, 0.14)',
            textMain: '#F8FAFC',
            textSecondary: '#94A3B8',
            heroTextMain: '#FFFFFF',
            heroTextSecondary: 'rgba(255, 255, 255, 0.76)',
            ...tokens,
        };
    }

    return {
        preset,
        isDark: false,
        baseSurface: '#F5F7FA',
        cardSurface: '#FFFFFF',
        cardBorder: 'rgba(15, 23, 42, 0.06)',
        glassSurface: 'rgba(255, 255, 255, 0.72)',
        glassBorder: 'rgba(15, 23, 42, 0.08)',
        textMain: '#212121',
        textSecondary: '#757575',
        heroTextMain: '#0F172A',
        heroTextSecondary: 'rgba(15, 23, 42, 0.66)',
        ...tokens,
    };
}