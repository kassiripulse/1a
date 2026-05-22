import { create } from 'zustand';
import { Restaurant, MenuItem, Order, ClientProfile, OrderStatus } from '../types';

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
  supabaseUrl: localStorage.getItem('DODO_SUPABASE_URL') || '',
  supabaseAnonKey: localStorage.getItem('DODO_SUPABASE_ANON_KEY') || '',
  geminiApiKey: localStorage.getItem('DODO_GEMINI_API_KEY') || '',
  resendApiKey: localStorage.getItem('DODO_RESEND_API_KEY') || '',
  brevoSmtpKey: localStorage.getItem('DODO_BREVO_SMTP_KEY') || '',
  brevoSenderEmail: localStorage.getItem('DODO_BREVO_SENDER_EMAIL') || 'contact@dodo-livraison.bf',
  baseDeliveryFee: Number(localStorage.getItem('DODO_BASE_DELIVERY_FEE') || '500'),
  avgPrepTime: localStorage.getItem('DODO_AVG_PREP_TIME') || '20-30 min',
  walletBalance: Number(localStorage.getItem('DODO_WALLET_BALANCE') || '15500'),
  appName: localStorage.getItem('DODO_APP_NAME') || 'Dodo Livraison',
  primaryColor: localStorage.getItem('DODO_PRIMARY_COLOR') || '#E52327',
  currencySymbol: localStorage.getItem('DODO_CURRENCY_SYMBOL') || 'FCFA',
  serviceFee: Number(localStorage.getItem('DODO_SERVICE_FEE') || '100'),
  freeDeliveryThreshold: Number(localStorage.getItem('DODO_FREE_DELIVERY_THRESHOLD') || '15000'),
  welcomeBanner: localStorage.getItem('DODO_WELCOME_BANNER') || 'Bienvenue sur Dodo Livraison ! Profitez de la livraison de vos maquis préférés à prix mini. 🛵',
  simulationSpeed: Number(localStorage.getItem('DODO_SIMULATION_SPEED') || '1'),
  maintenanceMode: localStorage.getItem('DODO_MAINTENANCE_MODE') === 'true',
  enableGeminiAgent: localStorage.getItem('DODO_ENABLE_GEMINI_AGENT') !== 'false',
  enableGoogleLogin: localStorage.getItem('DODO_ENABLE_GOOGLE_LOGIN') !== 'false',
  googleClientId: localStorage.getItem('DODO_GOOGLE_CLIENT_ID') || '987654321-googleclientid.apps.googleusercontent.com',
  enableAppleLogin: localStorage.getItem('DODO_ENABLE_APPLE_LOGIN') !== 'false',
  appleClientId: localStorage.getItem('DODO_APPLE_CLIENT_ID') || 'com.dodo.livraison.appleid',
  memberDaysEnabled: localStorage.getItem('DODO_MEMBER_DAYS_ENABLED') !== 'false',
  memberDaysTitle: localStorage.getItem('DODO_MEMBER_DAYS_TITLE') || 'Member Days',
  memberDaysSubtitle: localStorage.getItem('DODO_MEMBER_DAYS_SUBTITLE') || "Les plus belles offres sont disponibles jusqu'au 24 mai.",
  memberDaysButtonText: localStorage.getItem('DODO_MEMBER_DAYS_BUTTON_TEXT') || 'Voir les offres',
  memberDaysImageUrl: localStorage.getItem('DODO_MEMBER_DAYS_IMAGE_URL') || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=300&auto=format&fit=crop&q=80',
  memberDaysBadgeText: localStorage.getItem('DODO_MEMBER_DAYS_BADGE_TEXT') || 'EXCLUSIF 🇧🇫',
};

export const useAppStore = create<AppStore>((set) => ({
  // Config
  config: DEFAULT_CONFIG,
  updateConfig: (updates) => set((state) => {
    const nextConfig = { ...state.config, ...updates };
    
    // Persist each modified value to localStorage
    if (updates.supabaseUrl !== undefined) localStorage.setItem('DODO_SUPABASE_URL', updates.supabaseUrl);
    if (updates.supabaseAnonKey !== undefined) localStorage.setItem('DODO_SUPABASE_ANON_KEY', updates.supabaseAnonKey);
    if (updates.geminiApiKey !== undefined) localStorage.setItem('DODO_GEMINI_API_KEY', updates.geminiApiKey);
    if (updates.resendApiKey !== undefined) localStorage.setItem('DODO_RESEND_API_KEY', updates.resendApiKey);
    if (updates.brevoSmtpKey !== undefined) localStorage.setItem('DODO_BREVO_SMTP_KEY', updates.brevoSmtpKey);
    if (updates.brevoSenderEmail !== undefined) localStorage.setItem('DODO_BREVO_SENDER_EMAIL', updates.brevoSenderEmail);
    if (updates.baseDeliveryFee !== undefined) localStorage.setItem('DODO_BASE_DELIVERY_FEE', updates.baseDeliveryFee.toString());
    if (updates.avgPrepTime !== undefined) localStorage.setItem('DODO_AVG_PREP_TIME', updates.avgPrepTime);
    if (updates.walletBalance !== undefined) localStorage.setItem('DODO_WALLET_BALANCE', updates.walletBalance.toString());
    if (updates.appName !== undefined) localStorage.setItem('DODO_APP_NAME', updates.appName);
    if (updates.primaryColor !== undefined) localStorage.setItem('DODO_PRIMARY_COLOR', updates.primaryColor);
    if (updates.currencySymbol !== undefined) localStorage.setItem('DODO_CURRENCY_SYMBOL', updates.currencySymbol);
    if (updates.serviceFee !== undefined) localStorage.setItem('DODO_SERVICE_FEE', updates.serviceFee.toString());
    if (updates.freeDeliveryThreshold !== undefined) localStorage.setItem('DODO_FREE_DELIVERY_THRESHOLD', updates.freeDeliveryThreshold.toString());
    if (updates.welcomeBanner !== undefined) localStorage.setItem('DODO_WELCOME_BANNER', updates.welcomeBanner);
    if (updates.simulationSpeed !== undefined) localStorage.setItem('DODO_SIMULATION_SPEED', updates.simulationSpeed.toString());
    if (updates.maintenanceMode !== undefined) localStorage.setItem('DODO_MAINTENANCE_MODE', updates.maintenanceMode ? 'true' : 'false');
    if (updates.enableGeminiAgent !== undefined) localStorage.setItem('DODO_ENABLE_GEMINI_AGENT', updates.enableGeminiAgent ? 'true' : 'false');
    if (updates.enableGoogleLogin !== undefined) localStorage.setItem('DODO_ENABLE_GOOGLE_LOGIN', updates.enableGoogleLogin ? 'true' : 'false');
    if (updates.googleClientId !== undefined) localStorage.setItem('DODO_GOOGLE_CLIENT_ID', updates.googleClientId);
    if (updates.enableAppleLogin !== undefined) localStorage.setItem('DODO_ENABLE_APPLE_LOGIN', updates.enableAppleLogin ? 'true' : 'false');
    if (updates.appleClientId !== undefined) localStorage.setItem('DODO_APPLE_CLIENT_ID', updates.appleClientId);
    if (updates.memberDaysEnabled !== undefined) localStorage.setItem('DODO_MEMBER_DAYS_ENABLED', updates.memberDaysEnabled ? 'true' : 'false');
    if (updates.memberDaysTitle !== undefined) localStorage.setItem('DODO_MEMBER_DAYS_TITLE', updates.memberDaysTitle);
    if (updates.memberDaysSubtitle !== undefined) localStorage.setItem('DODO_MEMBER_DAYS_SUBTITLE', updates.memberDaysSubtitle);
    if (updates.memberDaysButtonText !== undefined) localStorage.setItem('DODO_MEMBER_DAYS_BUTTON_TEXT', updates.memberDaysButtonText);
    if (updates.memberDaysImageUrl !== undefined) localStorage.setItem('DODO_MEMBER_DAYS_IMAGE_URL', updates.memberDaysImageUrl);
    if (updates.memberDaysBadgeText !== undefined) localStorage.setItem('DODO_MEMBER_DAYS_BADGE_TEXT', updates.memberDaysBadgeText);

    return { config: nextConfig };
  }),
  resetConfig: () => {
    localStorage.removeItem('DODO_SUPABASE_URL');
    localStorage.removeItem('DODO_SUPABASE_ANON_KEY');
    localStorage.removeItem('DODO_GEMINI_API_KEY');
    localStorage.removeItem('DODO_RESEND_API_KEY');
    localStorage.removeItem('DODO_BREVO_SMTP_KEY');
    localStorage.removeItem('DODO_BREVO_SENDER_EMAIL');
    localStorage.removeItem('DODO_BASE_DELIVERY_FEE');
    localStorage.removeItem('DODO_AVG_PREP_TIME');
    localStorage.removeItem('DODO_WALLET_BALANCE');
    localStorage.removeItem('DODO_APP_NAME');
    localStorage.removeItem('DODO_PRIMARY_COLOR');
    localStorage.removeItem('DODO_CURRENCY_SYMBOL');
    localStorage.removeItem('DODO_SERVICE_FEE');
    localStorage.removeItem('DODO_FREE_DELIVERY_THRESHOLD');
    localStorage.removeItem('DODO_WELCOME_BANNER');
    localStorage.removeItem('DODO_SIMULATION_SPEED');
    localStorage.removeItem('DODO_MAINTENANCE_MODE');
    localStorage.removeItem('DODO_ENABLE_GEMINI_AGENT');
    localStorage.removeItem('DODO_ENABLE_GOOGLE_LOGIN');
    localStorage.removeItem('DODO_GOOGLE_CLIENT_ID');
    localStorage.removeItem('DODO_ENABLE_APPLE_LOGIN');
    localStorage.removeItem('DODO_APPLE_CLIENT_ID');
    localStorage.removeItem('DODO_MEMBER_DAYS_ENABLED');
    localStorage.removeItem('DODO_MEMBER_DAYS_TITLE');
    localStorage.removeItem('DODO_MEMBER_DAYS_SUBTITLE');
    localStorage.removeItem('DODO_MEMBER_DAYS_BUTTON_TEXT');
    localStorage.removeItem('DODO_MEMBER_DAYS_IMAGE_URL');
    localStorage.removeItem('DODO_MEMBER_DAYS_BADGE_TEXT');
    
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
