import { create } from 'zustand';
import { Restaurant, MenuItem, Order, ClientProfile, OrderStatus } from '../types';
import { secureStorage } from './secureStorage';

export interface AppConfig {
  supabaseUrl: string;
  supabaseAnonKey: string;
  geminiApiKey: string;
  resendApiKey: string;
  brevoSmtpKey: string;
  brevoSenderEmail: string;
  baseDeliveryFee: number;
  avgPrepTime: string;
  walletBalance: number;
  // Dynamic settings configurable in Admin Settings Screen
  appName: string;
  primaryColor: string;
  currencySymbol: string;
  serviceFee: number;
  freeDeliveryThreshold: number;
  welcomeBanner: string;
  simulationSpeed: number;
  maintenanceMode: boolean;
  enableGeminiAgent: boolean;
  enableGoogleLogin: boolean;
  googleClientId: string;
  enableAppleLogin: boolean;
  appleClientId: string;
  memberDaysEnabled: boolean;
  memberDaysTitle: string;
  memberDaysSubtitle: string;
  memberDaysButtonText: string;
  memberDaysImageUrl: string;
  memberDaysBadgeText: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
}

export interface PromoCode {
  code: string;
  discountType: 'fixed' | 'percentage';
  value: number;
  minOrderValue: number;
  active: boolean;
}

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
  category: string;
}

interface AppStore {
  // Config parameters
  config: AppConfig;
  updateConfig: (updates: Partial<AppConfig>) => void;
  resetConfig: () => void;

  // Global Role / Emulator navigation
  userRole: 'client' | 'vendor' | 'livreur' | 'admin';
  setUserRole: (role: 'client' | 'vendor' | 'livreur' | 'admin') => void;

  clientScreenId: number;
  setClientScreenId: (id: number) => void;

  vendorScreenId: number;
  setVendorScreenId: (id: number) => void;

  driverScreenId: number;
  setDriverScreenId: (id: number) => void;

  adminScreenId: number;
  setAdminScreenId: (id: number) => void;

  // Active Simulation variables
  driverIsSimulating: boolean;
  setDriverIsSimulating: (sim: boolean) => void;
  driverProgress: number;
  setDriverProgress: (prog: number) => void;

  // 1. Notification Center Screen
  notifications: NotificationItem[];
  addNotification: (title: string, message: string) => void;
  markAllNotificationsAsRead: () => void;
  clearNotifications: () => void;

  // 2. Promo Codes Management
  promoCodes: PromoCode[];
  addPromoCode: (promo: PromoCode) => void;
  deletePromoCode: (code: string) => void;
  togglePromoCode: (code: string) => void;

  // 3. Dynamic FAQs
  faqs: FaqItem[];
  addFaqItem: (faq: FaqItem) => void;
  deleteFaqItem: (id: string) => void;
  updateFaqItem: (id: string, updates: Partial<Omit<FaqItem, 'id'>>) => void;

  // 4. Parrainage (Referrals)
  referralCode: string;
  referralCount: number;
  referralBonus: number;
  setReferralCode: (code: string) => void;
  incrementReferrals: (bonus: number) => void;

  // i18n support
  language: 'fr' | 'en';
  setLanguage: (lang: 'fr' | 'en') => void;
}

const DEFAULT_CONFIG: AppConfig = {
  supabaseUrl: secureStorage.getItem('DODO_SUPABASE_URL') || '',
  supabaseAnonKey: secureStorage.getItem('DODO_SUPABASE_ANON_KEY') || '',
  geminiApiKey: secureStorage.getItem('DODO_GEMINI_API_KEY') || '',
  resendApiKey: secureStorage.getItem('DODO_RESEND_API_KEY') || '',
  brevoSmtpKey: secureStorage.getItem('DODO_BREVO_SMTP_KEY') || '',
  brevoSenderEmail: secureStorage.getItem('DODO_BREVO_SENDER_EMAIL') || 'contact@dodo-livraison.bf',
  baseDeliveryFee: Number(secureStorage.getItem('DODO_BASE_DELIVERY_FEE') || '500'),
  avgPrepTime: secureStorage.getItem('DODO_AVG_PREP_TIME') || '20-30 min',
  walletBalance: Number(secureStorage.getItem('DODO_WALLET_BALANCE') || '15500'),
  appName: secureStorage.getItem('DODO_APP_NAME') || 'Dodo Livraison',
  primaryColor: secureStorage.getItem('DODO_PRIMARY_COLOR') || '#E52327',
  currencySymbol: secureStorage.getItem('DODO_CURRENCY_SYMBOL') || 'FCFA',
  serviceFee: Number(secureStorage.getItem('DODO_SERVICE_FEE') || '100'),
  freeDeliveryThreshold: Number(secureStorage.getItem('DODO_FREE_DELIVERY_THRESHOLD') || '15000'),
  welcomeBanner: secureStorage.getItem('DODO_WELCOME_BANNER') || 'Bienvenue sur Dodo Livraison ! Profitez de la livraison de vos maquis préférés à prix mini. 🛵',
  simulationSpeed: Number(secureStorage.getItem('DODO_SIMULATION_SPEED') || '1'),
  maintenanceMode: secureStorage.getItem('DODO_MAINTENANCE_MODE') === 'true',
  enableGeminiAgent: secureStorage.getItem('DODO_ENABLE_GEMINI_AGENT') !== 'false',
  enableGoogleLogin: secureStorage.getItem('DODO_ENABLE_GOOGLE_LOGIN') !== 'false',
  googleClientId: secureStorage.getItem('DODO_GOOGLE_CLIENT_ID') || '987654321-googleclientid.apps.googleusercontent.com',
  enableAppleLogin: secureStorage.getItem('DODO_ENABLE_APPLE_LOGIN') !== 'false',
  appleClientId: secureStorage.getItem('DODO_APPLE_CLIENT_ID') || 'com.dodo.livraison.appleid',
  memberDaysEnabled: secureStorage.getItem('DODO_MEMBER_DAYS_ENABLED') !== 'false',
  memberDaysTitle: secureStorage.getItem('DODO_MEMBER_DAYS_TITLE') || 'Member Days',
  memberDaysSubtitle: secureStorage.getItem('DODO_MEMBER_DAYS_SUBTITLE') || "Les plus belles offres sont disponibles jusqu'au 24 mai.",
  memberDaysButtonText: secureStorage.getItem('DODO_MEMBER_DAYS_BUTTON_TEXT') || 'Voir les offres',
  memberDaysImageUrl: secureStorage.getItem('DODO_MEMBER_DAYS_IMAGE_URL') || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=300&auto=format&fit=crop&q=80',
  memberDaysBadgeText: secureStorage.getItem('DODO_MEMBER_DAYS_BADGE_TEXT') || 'EXCLUSIF 🇧🇫',
};

export const useAppStore = create<AppStore>((set) => ({
  // Config
  config: DEFAULT_CONFIG,
  updateConfig: (updates) => set((state) => {
    const nextConfig = { ...state.config, ...updates };
    
    // Persist each modified value to secureStorage
    if (updates.supabaseUrl !== undefined) secureStorage.setItem('DODO_SUPABASE_URL', updates.supabaseUrl);
    if (updates.supabaseAnonKey !== undefined) secureStorage.setItem('DODO_SUPABASE_ANON_KEY', updates.supabaseAnonKey);
    if (updates.geminiApiKey !== undefined) secureStorage.setItem('DODO_GEMINI_API_KEY', updates.geminiApiKey);
    if (updates.resendApiKey !== undefined) secureStorage.setItem('DODO_RESEND_API_KEY', updates.resendApiKey);
    if (updates.brevoSmtpKey !== undefined) secureStorage.setItem('DODO_BREVO_SMTP_KEY', updates.brevoSmtpKey);
    if (updates.brevoSenderEmail !== undefined) secureStorage.setItem('DODO_BREVO_SENDER_EMAIL', updates.brevoSenderEmail);
    if (updates.baseDeliveryFee !== undefined) secureStorage.setItem('DODO_BASE_DELIVERY_FEE', updates.baseDeliveryFee.toString());
    if (updates.avgPrepTime !== undefined) secureStorage.setItem('DODO_AVG_PREP_TIME', updates.avgPrepTime);
    if (updates.walletBalance !== undefined) secureStorage.setItem('DODO_WALLET_BALANCE', updates.walletBalance.toString());
    if (updates.appName !== undefined) secureStorage.setItem('DODO_APP_NAME', updates.appName);
    if (updates.primaryColor !== undefined) secureStorage.setItem('DODO_PRIMARY_COLOR', updates.primaryColor);
    if (updates.currencySymbol !== undefined) secureStorage.setItem('DODO_CURRENCY_SYMBOL', updates.currencySymbol);
    if (updates.serviceFee !== undefined) secureStorage.setItem('DODO_SERVICE_FEE', updates.serviceFee.toString());
    if (updates.freeDeliveryThreshold !== undefined) secureStorage.setItem('DODO_FREE_DELIVERY_THRESHOLD', updates.freeDeliveryThreshold.toString());
    if (updates.welcomeBanner !== undefined) secureStorage.setItem('DODO_WELCOME_BANNER', updates.welcomeBanner);
    if (updates.simulationSpeed !== undefined) secureStorage.setItem('DODO_SIMULATION_SPEED', updates.simulationSpeed.toString());
    if (updates.maintenanceMode !== undefined) secureStorage.setItem('DODO_MAINTENANCE_MODE', updates.maintenanceMode ? 'true' : 'false');
    if (updates.enableGeminiAgent !== undefined) secureStorage.setItem('DODO_ENABLE_GEMINI_AGENT', updates.enableGeminiAgent ? 'true' : 'false');
    if (updates.enableGoogleLogin !== undefined) secureStorage.setItem('DODO_ENABLE_GOOGLE_LOGIN', updates.enableGoogleLogin ? 'true' : 'false');
    if (updates.googleClientId !== undefined) secureStorage.setItem('DODO_GOOGLE_CLIENT_ID', updates.googleClientId);
    if (updates.enableAppleLogin !== undefined) secureStorage.setItem('DODO_ENABLE_APPLE_LOGIN', updates.enableAppleLogin ? 'true' : 'false');
    if (updates.appleClientId !== undefined) secureStorage.setItem('DODO_APPLE_CLIENT_ID', updates.appleClientId);
    if (updates.memberDaysEnabled !== undefined) secureStorage.setItem('DODO_MEMBER_DAYS_ENABLED', updates.memberDaysEnabled ? 'true' : 'false');
    if (updates.memberDaysTitle !== undefined) secureStorage.setItem('DODO_MEMBER_DAYS_TITLE', updates.memberDaysTitle);
    if (updates.memberDaysSubtitle !== undefined) secureStorage.setItem('DODO_MEMBER_DAYS_SUBTITLE', updates.memberDaysSubtitle);
    if (updates.memberDaysButtonText !== undefined) secureStorage.setItem('DODO_MEMBER_DAYS_BUTTON_TEXT', updates.memberDaysButtonText);
    if (updates.memberDaysImageUrl !== undefined) secureStorage.setItem('DODO_MEMBER_DAYS_IMAGE_URL', updates.memberDaysImageUrl);
    if (updates.memberDaysBadgeText !== undefined) secureStorage.setItem('DODO_MEMBER_DAYS_BADGE_TEXT', updates.memberDaysBadgeText);

    return { config: nextConfig };
  }),
  resetConfig: () => {
    secureStorage.removeItem('DODO_SUPABASE_URL');
    secureStorage.removeItem('DODO_SUPABASE_ANON_KEY');
    secureStorage.removeItem('DODO_GEMINI_API_KEY');
    secureStorage.removeItem('DODO_RESEND_API_KEY');
    secureStorage.removeItem('DODO_BREVO_SMTP_KEY');
    secureStorage.removeItem('DODO_BREVO_SENDER_EMAIL');
    secureStorage.removeItem('DODO_BASE_DELIVERY_FEE');
    secureStorage.removeItem('DODO_AVG_PREP_TIME');
    secureStorage.removeItem('DODO_WALLET_BALANCE');
    secureStorage.removeItem('DODO_APP_NAME');
    secureStorage.removeItem('DODO_PRIMARY_COLOR');
    secureStorage.removeItem('DODO_CURRENCY_SYMBOL');
    secureStorage.removeItem('DODO_SERVICE_FEE');
    secureStorage.removeItem('DODO_FREE_DELIVERY_THRESHOLD');
    secureStorage.removeItem('DODO_WELCOME_BANNER');
    secureStorage.removeItem('DODO_SIMULATION_SPEED');
    secureStorage.removeItem('DODO_MAINTENANCE_MODE');
    secureStorage.removeItem('DODO_ENABLE_GEMINI_AGENT');
    secureStorage.removeItem('DODO_ENABLE_GOOGLE_LOGIN');
    secureStorage.removeItem('DODO_GOOGLE_CLIENT_ID');
    secureStorage.removeItem('DODO_ENABLE_APPLE_LOGIN');
    secureStorage.removeItem('DODO_APPLE_CLIENT_ID');
    secureStorage.removeItem('DODO_MEMBER_DAYS_ENABLED');
    secureStorage.removeItem('DODO_MEMBER_DAYS_TITLE');
    secureStorage.removeItem('DODO_MEMBER_DAYS_SUBTITLE');
    secureStorage.removeItem('DODO_MEMBER_DAYS_BUTTON_TEXT');
    secureStorage.removeItem('DODO_MEMBER_DAYS_IMAGE_URL');
    secureStorage.removeItem('DODO_MEMBER_DAYS_BADGE_TEXT');
    
    set({
      config: {
        supabaseUrl: '',
        supabaseAnonKey: '',
        geminiApiKey: '',
        resendApiKey: '',
        brevoSmtpKey: '',
        brevoSenderEmail: 'contact@dodo-livraison.bf',
        baseDeliveryFee: 500,
        avgPrepTime: '20-30 min',
        walletBalance: 15500,
        appName: 'Dodo Livraison',
        primaryColor: '#E52327',
        currencySymbol: 'FCFA',
        serviceFee: 100,
        freeDeliveryThreshold: 15000,
        welcomeBanner: 'Bienvenue sur Dodo Livraison ! Profitez de la livraison de vos maquis préférés à prix mini. 🛵',
        simulationSpeed: 1,
        maintenanceMode: false,
        enableGeminiAgent: true,
        enableGoogleLogin: true,
        googleClientId: '987654321-googleclientid.apps.googleusercontent.com',
        enableAppleLogin: true,
        appleClientId: 'com.dodo.livraison.appleid',
        memberDaysEnabled: true,
        memberDaysTitle: 'Member Days',
        memberDaysSubtitle: "Les plus belles offres sont disponibles jusqu'au 24 mai.",
        memberDaysButtonText: 'Voir les offres',
        memberDaysImageUrl: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=300&auto=format&fit=crop&q=80',
        memberDaysBadgeText: 'EXCLUSIF 🇧🇫',
      }
    });
  },

  // State Management
  userRole: 'client',
  setUserRole: (role) => set({ userRole: role }),

  clientScreenId: 1,
  setClientScreenId: (id) => set({ clientScreenId: id }),

  vendorScreenId: 1,
  setVendorScreenId: (id) => set({ vendorScreenId: id }),

  driverScreenId: 1,
  setDriverScreenId: (id) => set({ driverScreenId: id }),

  adminScreenId: 1,
  setAdminScreenId: (id) => set({ adminScreenId: id }),

  // Simulation variables linked to tracking
  driverIsSimulating: true,
  setDriverIsSimulating: (sim) => set({ driverIsSimulating: sim }),
  driverProgress: 0.2,
  setDriverProgress: (prog) => set({ driverProgress: prog }),

  // 4. Parrainage (Referral States)
  referralCode: localStorage.getItem('DODO_REFERRAL_CODE') || '',
  referralCount: Number(localStorage.getItem('DODO_REFERRAL_COUNT') || '0'),
  referralBonus: Number(localStorage.getItem('DODO_REFERRAL_BONUS') || '0'),
  setReferralCode: (code) => {
    localStorage.setItem('DODO_REFERRAL_CODE', code);
    set({ referralCode: code });
  },
  incrementReferrals: (bonus) => set((state) => {
    const nextCount = state.referralCount + 1;
    const nextBonus = state.referralBonus + bonus;
    localStorage.setItem('DODO_REFERRAL_COUNT', nextCount.toString());
    localStorage.setItem('DODO_REFERRAL_BONUS', nextBonus.toString());
    
    // Also add to the wallet balance!
    const updatedWallet = state.config.walletBalance + bonus;
    localStorage.setItem('DODO_WALLET_BALANCE', updatedWallet.toString());
    
    return {
      referralCount: nextCount,
      referralBonus: nextBonus,
      config: {
        ...state.config,
        walletBalance: updatedWallet
      }
    };
  }),

  // i18n support
  language: (localStorage.getItem('DODO_LANGUAGE') as 'fr' | 'en') || 'fr',
  setLanguage: (lang) => set(() => {
    localStorage.setItem('DODO_LANGUAGE', lang);
    return { language: lang };
  }),

  // 1. Notification Center Screen State & Logic
  notifications: [
    {
      id: 'welcome-notif',
      title: 'Bienvenue sur Dodo 🛵',
      message: 'Meilleure application de livraison de maquis au Burkina Faso ! Profitez de nos offres.',
      timestamp: new Date(Date.now() - 5 * 60000).toISOString(),
      read: false
    },
    {
      id: 'wallet-bonus',
      title: 'Bonus Portefeuille Actif 🎉',
      message: 'Votre portefeuille virtuel Dodo Wallet a été pré-financé avec 15 500 FCFA offerts.',
      timestamp: new Date(Date.now() - 15 * 60000).toISOString(),
      read: true
    }
  ],
  addNotification: (title, message) => set((state) => {
    const newNotif: NotificationItem = {
      id: `notif-${Date.now()}`,
      title,
      message,
      timestamp: new Date().toISOString(),
      read: false,
    };
    // Keep only the 10 most recent alerts
    const nextNotifs = [newNotif, ...state.notifications].slice(0, 10);
    return { notifications: nextNotifs };
  }),
  markAllNotificationsAsRead: () => set((state) => ({
    notifications: state.notifications.map(n => ({ ...n, read: true }))
  })),
  clearNotifications: () => set({ notifications: [] }),

  // 2. Coupon Management
  promoCodes: [
    { code: 'DODO226', discountType: 'fixed', value: 1000, minOrderValue: 3000, active: true },
    { code: 'FASO15', discountType: 'percentage', value: 15, minOrderValue: 2000, active: true },
    { code: 'WEEKEND', discountType: 'fixed', value: 500, minOrderValue: 1500, active: false }
  ],
  addPromoCode: (promo) => set((state) => {
    // Prevent duplicate codes
    if (state.promoCodes.some(p => p.code.toUpperCase() === promo.code.toUpperCase())) {
      return {};
    }
    return { promoCodes: [...state.promoCodes, { ...promo, code: promo.code.toUpperCase() }] };
  }),
  deletePromoCode: (code) => set((state) => ({
    promoCodes: state.promoCodes.filter(p => p.code !== code)
  })),
  togglePromoCode: (code) => set((state) => ({
    promoCodes: state.promoCodes.map(p => p.code === code ? { ...p, active: !p.active } : p)
  })),

  // 3. Dynamic FAQ Items
  faqs: [
    {
      id: 'faq-1',
      question: 'Quels sont vos horaires de livraison ?',
      answer: 'Dodo Livraison collabore avec les meilleurs maquis d\'Ouagadougou et Bobo-Dioulasso de 11h00 à 23h00 tous les jours.',
      category: 'Général'
    },
    {
      id: 'faq-2',
      question: 'Comment fonctionne le paiement cash à la livraison ?',
      answer: 'Vous pouvez commander vos plats favoris en toute sécurité et régler directement en espèces au coursier à sa livraison.',
      category: 'Paiement'
    },
    {
      id: 'faq-3',
      question: 'Comment recharger mon portefeuille Dodo Wallet ?',
      answer: 'Depuis l\'onglet "Profil", vous pouvez approvisionner votre Dodo Wallet instantanément en simulant un transfert Orange Money ou Moov Money.',
      category: 'Wallets'
    },
    {
      id: 'faq-4',
      question: 'Comment appliquer un code promo sur ma commande ?',
      answer: 'Dans l\'écran récapitulatif de votre panier (Étape 4), saisissez votre code de réduction dans le champ dédié et cliquez sur "Appliquer" avant de valider votre commande.',
      category: 'Réductions'
    }
  ],
  addFaqItem: (faq) => set((state) => ({
    faqs: [...state.faqs, faq]
  })),
  deleteFaqItem: (id) => set((state) => ({
    faqs: state.faqs.filter(f => f.id !== id)
  })),
  updateFaqItem: (id, updates) => set((state) => ({
    faqs: state.faqs.map(f => f.id === id ? { ...f, ...updates } : f)
  })),
}));
