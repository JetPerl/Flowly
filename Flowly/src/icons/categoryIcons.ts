// Auto-generated from assets/icons/categories. Do not edit manually.
import React from 'react';
import { Image } from 'react-native';
import { ComponentType } from 'react';
import { SvgProps, SvgUri } from 'react-native-svg';

type IconModule = ComponentType<SvgProps> | { default: ComponentType<SvgProps> };

export type CategoryIconName =
  'accessories' |
  'active-leisure' |
  'alcohol' |
  'alimony' |
  'animal-food' |
  'animal-health' |
  'animal-services' |
  'auto-chemical-goods' |
  'beauty-care' |
  'beauty-salons' |
  'books' |
  'car-accessories' |
  'car-insurance' |
  'car-sharing' |
  'car-wash' |
  'car' |
  'charity' |
  'child-clothing' |
  'child-club' |
  'child-eat' |
  'child-health' |
  'child-products' |
  'child-toys' |
  'children' |
  'cinema-theaters' |
  'cloth' |
  'clothes-shoes' |
  'clubs-bars' |
  'coffee' |
  'communication-services' |
  'cosmetics' |
  'dairy-products' |
  'dishes' |
  'eating-out' |
  'electronics' |
  'entertainment' |
  'fast-food' |
  'fines' |
  'food' |
  'force-majeure' |
  'fruts-berries' |
  'fuel' |
  'furniture' |
  'gambling' |
  'games' |
  'hairdressers' |
  'health' |
  'hobbies-interests' |
  'home-1' |
  'hotel' |
  'household-appliances' |
  'household-chemicals' |
  'household-goods' |
  'housing-maintenance' |
  'internet' |
  'manufactured-goods' |
  'meat' |
  'medical-services' |
  'medicines' |
  'museums' |
  'music' |
  'nutrition' |
  'other-1' |
  'other-2' |
  'parking' |
  'part-time-job' |
  'percent-discounts' |
  'perfumery' |
  'pet-products' |
  'pets' |
  'present' |
  'public-transport' |
  'rent-1' |
  'rent-2' |
  'rental-income' |
  'repair-car-service' |
  'repair' |
  'restaurants' |
  'return' |
  'salary' |
  'sale' |
  'services-subscriptions' |
  'shoe' |
  'shop' |
  'souvenir' |
  'sport' |
  'state' |
  'subscription-fee' |
  'sweets' |
  'taxi' |
  'technique' |
  'tickets' |
  'toll-roads' |
  'tourist-expenses' |
  'transport-rental' |
  'transport' |
  'trips' |
  'uncategorized' |
  'unconsidered-spending' |
  'underwear' |
  'utility-payments' |
  // account icons
  'wallet' |
  'card' |
  'crypto' |
  'target';

export const sanitizeCategoryIconName = (name?: string | null): string => {
  if (typeof name !== 'string') return '';
  const trimmed = name.trim().replace(/^['"`]+|['"`]+$/g, '').trim(); // strip wrapping quotes/spaces from DB
  return trimmed.replace(/\s+/g, '-').replace(/_+/g, '-').replace(/-+/g, '-').toLowerCase();
};

const icons = {
  'accessories': require('../../assets/icons/categories/accessories.svg') as IconModule,
  'active-leisure': require('../../assets/icons/categories/active-leisure.svg') as IconModule,
  'alcohol': require('../../assets/icons/categories/alcohol.svg') as IconModule,
  'alimony': require('../../assets/icons/categories/alimony.svg') as IconModule,
  'animal-food': require('../../assets/icons/categories/animal-food.svg') as IconModule,
  'animal-health': require('../../assets/icons/categories/animal-health.svg') as IconModule,
  'animal-services': require('../../assets/icons/categories/animal-services.svg') as IconModule,
  'auto-chemical-goods': require('../../assets/icons/categories/auto-chemical-goods.svg') as IconModule,
  'beauty-care': require('../../assets/icons/categories/beauty-care.svg') as IconModule,
  'beauty-salons': require('../../assets/icons/categories/beauty-salons.svg') as IconModule,
  'books': require('../../assets/icons/categories/books.svg') as IconModule,
  'car-accessories': require('../../assets/icons/categories/car-accessories.svg') as IconModule,
  'car-insurance': require('../../assets/icons/categories/car-insurance.svg') as IconModule,
  'car-sharing': require('../../assets/icons/categories/car-sharing.svg') as IconModule,
  'car-wash': require('../../assets/icons/categories/car-wash.svg') as IconModule,
  'car': require('../../assets/icons/categories/car.svg') as IconModule,
  'charity': require('../../assets/icons/categories/charity.svg') as IconModule,
  'child-clothing': require('../../assets/icons/categories/child-clothing.svg') as IconModule,
  'child-club': require('../../assets/icons/categories/child-club.svg') as IconModule,
  'child-eat': require('../../assets/icons/categories/child-eat.svg') as IconModule,
  'child-health': require('../../assets/icons/categories/child-health.svg') as IconModule,
  'child-products': require('../../assets/icons/categories/child-products.svg') as IconModule,
  'child-toys': require('../../assets/icons/categories/child-toys.svg') as IconModule,
  'children': require('../../assets/icons/categories/children.svg') as IconModule,
  'cinema-theaters': require('../../assets/icons/categories/cinema-theaters.svg') as IconModule,
  'cloth': require('../../assets/icons/categories/cloth.svg') as IconModule,
  'clothes-shoes': require('../../assets/icons/categories/clothes-shoes.svg') as IconModule,
  'clubs-bars': require('../../assets/icons/categories/clubs-bars.svg') as IconModule,
  'coffee': require('../../assets/icons/categories/coffee.svg') as IconModule,
  'communication-services': require('../../assets/icons/categories/communication-services.svg') as IconModule,
  'cosmetics': require('../../assets/icons/categories/cosmetics.svg') as IconModule,
  'dairy-products': require('../../assets/icons/categories/dairy-products.svg') as IconModule,
  'dishes': require('../../assets/icons/categories/dishes.svg') as IconModule,
  'eating-out': require('../../assets/icons/categories/eating-out.svg') as IconModule,
  'electronics': require('../../assets/icons/categories/electronics.svg') as IconModule,
  'entertainment': require('../../assets/icons/categories/entertainment.svg') as IconModule,
  'fast-food': require('../../assets/icons/categories/fast-food.svg') as IconModule,
  'fines': require('../../assets/icons/categories/fines.svg') as IconModule,
  'food': require('../../assets/icons/categories/food.svg') as IconModule,
  'force-majeure': require('../../assets/icons/categories/force-majeure.svg') as IconModule,
  'fruts-berries': require('../../assets/icons/categories/fruts-berries.svg') as IconModule,
  'fuel': require('../../assets/icons/categories/fuel.svg') as IconModule,
  'furniture': require('../../assets/icons/categories/furniture.svg') as IconModule,
  'gambling': require('../../assets/icons/categories/gambling.svg') as IconModule,
  'games': require('../../assets/icons/categories/games.svg') as IconModule,
  'hairdressers': require('../../assets/icons/categories/hairdressers.svg') as IconModule,
  'health': require('../../assets/icons/categories/health.svg') as IconModule,
  'hobbies-interests': require('../../assets/icons/categories/hobbies-interests.svg') as IconModule,
  'home-1': require('../../assets/icons/categories/home-1.svg') as IconModule,
  'hotel': require('../../assets/icons/categories/hotel.svg') as IconModule,
  'household-appliances': require('../../assets/icons/categories/household-appliances.svg') as IconModule,
  'household-chemicals': require('../../assets/icons/categories/household-chemicals.svg') as IconModule,
  'household-goods': require('../../assets/icons/categories/household-goods.svg') as IconModule,
  'housing-maintenance': require('../../assets/icons/categories/housing-maintenance.svg') as IconModule,
  'internet': require('../../assets/icons/categories/internet.svg') as IconModule,
  'manufactured-goods': require('../../assets/icons/categories/manufactured-goods.svg') as IconModule,
  'meat': require('../../assets/icons/categories/meat.svg') as IconModule,
  'medical-services': require('../../assets/icons/categories/medical-services.svg') as IconModule,
  'medicines': require('../../assets/icons/categories/medicines.svg') as IconModule,
  'museums': require('../../assets/icons/categories/museums.svg') as IconModule,
  'music': require('../../assets/icons/categories/music.svg') as IconModule,
  'nutrition': require('../../assets/icons/categories/nutrition.svg') as IconModule,
  'other-1': require('../../assets/icons/categories/other-1.svg') as IconModule,
  'other-2': require('../../assets/icons/categories/other-2.svg') as IconModule,
  'parking': require('../../assets/icons/categories/parking.svg') as IconModule,
  'part-time-job': require('../../assets/icons/categories/part-time-job.svg') as IconModule,
  'percent-discounts': require('../../assets/icons/categories/percent-discounts.svg') as IconModule,
  'perfumery': require('../../assets/icons/categories/perfumery.svg') as IconModule,
  'pet-products': require('../../assets/icons/categories/pet-products.svg') as IconModule,
  'pets': require('../../assets/icons/categories/pets.svg') as IconModule,
  'present': require('../../assets/icons/categories/present.svg') as IconModule,
  'public-transport': require('../../assets/icons/categories/public-transport.svg') as IconModule,
  'rent-1': require('../../assets/icons/categories/rent-1.svg') as IconModule,
  'rent-2': require('../../assets/icons/categories/rent-2.svg') as IconModule,
  'rental-income': require('../../assets/icons/categories/rental-income.svg') as IconModule,
  'repair-car-service': require('../../assets/icons/categories/repair-car-service.svg') as IconModule,
  'repair': require('../../assets/icons/categories/repair.svg') as IconModule,
  'restaurants': require('../../assets/icons/categories/restaurants.svg') as IconModule,
  'return': require('../../assets/icons/categories/return.svg') as IconModule,
  'salary': require('../../assets/icons/categories/salary.svg') as IconModule,
  'sale': require('../../assets/icons/categories/sale.svg') as IconModule,
  'services-subscriptions': require('../../assets/icons/categories/services-subscriptions.svg') as IconModule,
  'shoe': require('../../assets/icons/categories/shoe.svg') as IconModule,
  'shop': require('../../assets/icons/categories/shop.svg') as IconModule,
  'souvenir': require('../../assets/icons/categories/souvenir.svg') as IconModule,
  'sport': require('../../assets/icons/categories/sport.svg') as IconModule,
  'state': require('../../assets/icons/categories/state.svg') as IconModule,
  'subscription-fee': require('../../assets/icons/categories/subscription-fee.svg') as IconModule,
  'sweets': require('../../assets/icons/categories/sweets.svg') as IconModule,
  'taxi': require('../../assets/icons/categories/taxi.svg') as IconModule,
  'technique': require('../../assets/icons/categories/technique.svg') as IconModule,
  'tickets': require('../../assets/icons/categories/tickets.svg') as IconModule,
  'toll-roads': require('../../assets/icons/categories/toll-roads.svg') as IconModule,
  'tourist-expenses': require('../../assets/icons/categories/tourist-expenses.svg') as IconModule,
  'transport-rental': require('../../assets/icons/categories/transport-rental.svg') as IconModule,
  'transport': require('../../assets/icons/categories/transport.svg') as IconModule,
  'trips': require('../../assets/icons/categories/trips.svg') as IconModule,
  'uncategorized': require('../../assets/icons/categories/uncategorized.svg') as IconModule,
  'unconsidered-spending': require('../../assets/icons/categories/unconsidered-spending.svg') as IconModule,
  'underwear': require('../../assets/icons/categories/underwear.svg') as IconModule,
  'utility-payments': require('../../assets/icons/categories/utility-payments.svg') as IconModule,
  // account icons
  'wallet': require('../../assets/icons/accounts/wallet.svg') as IconModule,
  'card': require('../../assets/icons/accounts/card.svg') as IconModule,
  'crypto': require('../../assets/icons/accounts/crypto.svg') as IconModule,
  'target': require('../../assets/icons/accounts/target.svg') as IconModule,
} as const;

export const categoryIcons = icons as Record<CategoryIconName, IconModule>;

const assetIconCache = new Map<any, ComponentType<SvgProps>>();

const getIconComponent = (mod?: IconModule): ComponentType<SvgProps> | undefined => {
  if (!mod) return undefined;
  if (typeof mod === 'function') return mod;

  const maybeDefault = (mod as any).default;
  if (typeof maybeDefault === 'function') return maybeDefault;

  // Metro may sometimes treat .svg as a static asset (number). Convert it to a component on the fly.
  const assetRef = typeof maybeDefault === 'number' ? maybeDefault : (mod as any);
  const cacheKey = assetRef;
  const cached = assetIconCache.get(cacheKey);
  if (cached) return cached;

  try {
    const resolved = Image.resolveAssetSource(assetRef);
    const uri = resolved?.uri;
    if (uri) {
      const Component: React.FC<SvgProps> = props =>
        React.createElement(SvgUri, { uri, ...props });
      assetIconCache.set(cacheKey, Component);
      return Component;
    }
  } catch {
    // ignore resolution errors, we'll fall back to default square
  }

  return undefined;
};

const missingIconsLogged = new Set<string>();
const resolvedIconsLogged = new Set<string>();
let sampleIconModuleLogged = false;
const iconResolutionLogged = new Set<string>();

export const resolveCategoryIcon = (name?: string | null): ComponentType<SvgProps> | undefined => {
  if (__DEV__ && !sampleIconModuleLogged) {
    sampleIconModuleLogged = true;
    const sample = require('../../assets/icons/categories/accessories.svg');
    console.log('[CategoryIcon][sample] module type', typeof sample, 'keys', Object.keys(sample || {}));
  }

  const key = sanitizeCategoryIconName(name);
  const iconModule = (categoryIcons as Record<string, IconModule | undefined>)[key];
  const component = getIconComponent(iconModule);

  if (__DEV__ && key && !iconResolutionLogged.has(key)) {
    iconResolutionLogged.add(key);
    const modDefault = (iconModule as any)?.default;
    console.log('[CategoryIcon][resolve]', key, {
      modType: typeof iconModule,
      modKeys: iconModule ? Object.keys(iconModule as any) : [],
      modDefaultType: typeof modDefault,
      componentType: typeof component,
    });
  }

  if (!component && key && __DEV__ && !missingIconsLogged.has(key)) {
    missingIconsLogged.add(key);
    console.warn(`[CategoryIcon] Icon not found for "${name}" (normalized: "${key}")`);
  }

  return component;
};

export const hasCategoryIcon = (name?: string | null): name is CategoryIconName => {
  return Boolean(resolveCategoryIcon(name));
};
