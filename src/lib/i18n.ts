// Internationalization (i18n) simple system for Dodo Livraison
export const translations = {
  fr: {
    // Navigation & General
    explore: "Explorer",
    search: "Recherche",
    cart: "Panier",
    profile: "Profil",
    orders: "Suivi",
    notifications: "Notifications",
    close: "Fermer",
    back: "Retour",
    success: "Succès",
    error: "Erreur",
    loading: "Chargement...",

    // Screen Titles & Headers
    home_title: "Dodo Livraison 🛵",
    home_subtitle: "Vos maquis d'Ouagadougou favoris livrés chaud",
    search_title: "Recherche de Plats",
    search_placeholder: "Rechercher un plat, un maquis...",
    voice_command_tip: "Appuyez sur le micro pour faire une commande vocale (Ex: 'Riz gras', 'Alloco' ...)",
    listening: "Écoute en cours...",
    voice_didnt_hear: "Nous n'avons pas bien compris, réessayez !",
    voice_match_found: "Correspondance trouvée !",

    // Cart / Checkout
    your_cart: "Votre Panier",
    cart_empty: "Votre panier est vide.",
    subtotal: "Sous-total",
    delivery_fee: "Frais de livraison",
    service_fee: "Frais de service",
    promo_code: "Code Promo",
    apply_promo: "Appliquer un code promo",
    remove: "Retirer",
    apply: "Appliquer",
    total: "Total à payer",
    checkout_cash: "Paiement cash à la livraison",
    place_order_btn: "Commander",
    confirm_order_btn: "Confirmer & Commander 🏍️",

    // Profile & Settings
    wallet: "Dodo Wallet",
    recharge_wallet: "Recharger Portefeuille",
    referral: "Espace Parrainage 🎁",
    referral_subtitle: "Invitez vos amis et gagnez +2 500 FCFA par filleul !",
    generate_code_btn: "Générer mon code unique",
    copy_code: "Code de parrainage copié !",
    referrals_count: "Filleuls inscrits",
    referral_bonus: "Bonus cumulés",
    simulate_friend_btn: "Simuler l'inscription d'un filleul 🚀",
    logout: "Se déconnecter",
    faq: "Foire Aux Questions ❓",
    faq_subtitle: "Mises à jour sans code depuis la stack",

    // Driver Section & Recharts
    driver_profile: "Profil Chauffeur",
    driver_earnings_title: "Rapport des Revenus (30 jours)",
    driver_earnings_subtitle: "Visualisation de vos gains cumulés en FCFA",
    driver_stats_summary: "Statistiques du mois",
    total_earned: "Total Gagné",
    orders_completed: "Livraisons Effectuées",
    rating: "Note Globale",
    days: "Jours",
    earnings: "Gains",

    // Common alerts
    copied: "Copié avec succès !",
    added_to_cart: "Ajouté au panier ! 🍳"
  },
  en: {
    // Navigation & General
    explore: "Explore",
    search: "Search",
    cart: "Cart",
    profile: "Profile",
    orders: "Tracking",
    notifications: "Notifications",
    close: "Close",
    back: "Back",
    success: "Success",
    error: "Error",
    loading: "Loading...",

    // Screen Titles & Headers
    home_title: "Dodo Delivery 🛵",
    home_subtitle: "Your favorite Ouagadougou maquis delivered hot",
    search_title: "Dish Search",
    search_placeholder: "Search for a dish, a restaurant...",
    voice_command_tip: "Tap the microphone to search using voice command (e.g. 'Riz gras', 'Alloco' ...)",
    listening: "Listening...",
    voice_didnt_hear: "We didn't catch that, please try again!",
    voice_match_found: "Match found!",

    // Cart / Checkout
    your_cart: "Your Cart",
    cart_empty: "Your cart is empty.",
    subtotal: "Subtotal",
    delivery_fee: "Delivery fee",
    service_fee: "Service fee",
    promo_code: "Promo Code",
    apply_promo: "Apply promo code",
    remove: "Remove",
    apply: "Apply",
    total: "Total to pay",
    checkout_cash: "Cash on delivery",
    place_order_btn: "Place Order",
    confirm_order_btn: "Confirm & Order 🏍️",

    // Profile & Settings
    wallet: "Dodo Wallet",
    recharge_wallet: "Top up wallet",
    referral: "Referral Center 🎁",
    referral_subtitle: "Invite your friends & earn +2,500 FCFA per referral!",
    generate_code_btn: "Generate my unique code",
    copy_code: "Referral code copied!",
    referrals_count: "Referrals signed up",
    referral_bonus: "Total bonus earned",
    simulate_friend_btn: "Simulate a friendly sign-up 🚀",
    logout: "Log out",
    faq: "Frequently Asked Questions ❓",
    faq_subtitle: "No-code updates from the admin dashboard",

    // Driver Section & Recharts
    driver_profile: "Driver Profile",
    driver_earnings_title: "Earnings Analysis (30 days)",
    driver_earnings_subtitle: "Visualization of accumulated earnings in FCFA",
    driver_stats_summary: "Monthly Statistics",
    total_earned: "Total Earnings",
    orders_completed: "Completed Deliveries",
    rating: "Overall Rating",
    days: "Days",
    earnings: "Earnings",

    // Common alerts
    copied: "Copied successfully!",
    added_to_cart: "Added to cart! 🍳"
  }
};

export type Language = 'fr' | 'en';

export function getTranslation(lang: Language) {
  return translations[lang] || translations.fr;
}
