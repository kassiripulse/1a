/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  MapPin, Bell, Search, Star, MessageSquare, Phone, Clock, ShoppingCart, 
  ChevronRight, ArrowLeft, Heart, Share2, Plus, Minus, Trash2, Check, HelpCircle, Settings, LogOut, Navigation, Play, RotateCcw,
  Mail, Camera, Upload, Shield, Briefcase, UserCheck, FileText, Building, User, DollarSign, Ticket, Gift, Copy, Sparkles, Globe,
  Home, ClipboardList, Users, Zap, Calendar
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Restaurant, MenuItem, CartItem, Order, OrderStatus, ClientProfile, 
  MOCK_RESTAURANTS, MOCK_MENU_ITEMS, MOCK_PAST_ORDERS, MOCK_PROFILE 
} from '../types';
import { insertOrder, saveProfile, updateOrderStatus, fetchOrders } from '../lib/supabase';
import DodoLogo from './DodoLogo';
import DodoLiveGoogleMap from './DodoLiveGoogleMap';
import LazyImage from './LazyImage';
import { useAppStore } from '../lib/store';
import { getTranslation } from '../lib/i18n';
import { PaymentLogoSelector, OrangeMoneyLogo, MoovMoneyLogo, WaveLogo, TelecelMoneyLogo, PayPalLogo } from './PaymentLogos';

// YengaPay African Gateways simulator integrations (Audit 1, 2, 5, 20)
import { 
  createYengaTransaction, 
  getYengaConfig, 
  sendDirectOtpMobileMoney, 
  completeDirectPayMobileMoney, 
  triggerSimulatedWebhook,
  getYengaTransactions,
  saveYengaTransactions
} from '../lib/yengapay';

interface PhoneEmulatorProps {
  currentScreenId: number;
  setCurrentScreenId: (id: number) => void;
  restaurants: Restaurant[];
  menuItems: MenuItem[];
  profile: ClientProfile;
  setProfile: React.Dispatch<React.SetStateAction<ClientProfile>>;
  orders: Order[];
  onOrderPlaced: () => void;
  onScreenChange?: (screenId: number) => void;
}

export default function PhoneEmulator({
  currentScreenId,
  setCurrentScreenId,
  restaurants,
  menuItems,
  profile,
  setProfile,
  orders,
  onOrderPlaced,
  onScreenChange,
}: PhoneEmulatorProps) {
  // Navigation & UI States
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant>(restaurants[0] || MOCK_RESTAURANTS[0]);
  const [restaurantActiveTab, setRestaurantActiveTab] = useState<'Menu' | 'Avis' | 'Infos'>('Menu');
  const [historyActiveTab, setHistoryActiveTab] = useState<'À venir' | 'Historique'>('À venir');
  const [selectedCategory, setSelectedCategory] = useState<string>('Plus');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [citySelectorOpen, setCitySelectorOpen] = useState<boolean>(false);
  const [currentCity, setCurrentCity] = useState<string>('Ouagadougou');
  const [notificationOpen, setNotificationOpen] = useState<boolean>(false);
  const [favorites, setFavorites] = useState<string[]>(['rest_fatou']); // Chez Fatou favorited by default
  const [cartNotes, setCartNotes] = useState<string>('');
  
  // Onboarding & Auth states for client applet
  const [onboardingStep, setOnboardingStep] = useState<number>(-1); // -1 = Splash screen, 0,1,2 = Tutorial slides, 3 = Auth Screen
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [authRole, setAuthRole] = useState<'client' | 'livreur' | 'vendeur'>('client');
  const [authContactType, setAuthContactType] = useState<'telephone' | 'email'>('telephone');
  
  const [authPhone, setAuthPhone] = useState<string>('');
  const [authEmail, setAuthEmail] = useState<string>('');
  const [authName, setAuthName] = useState<string>('');
  const [authPassword, setAuthPassword] = useState<string>('');
  
  // Specific Vendeur & Livreur states
  const [authAge, setAuthAge] = useState<string>('');
  const [authAdresse, setAuthAdresse] = useState<string>('');
  const [authDomaine, setAuthDomaine] = useState<string>('Pâtissier');
  const [authCompanyNom, setAuthCompanyNom] = useState<string>('');
  const [authCompanyAdresse, setAuthCompanyAdresse] = useState<string>('');
  
  // KYC states for Livreur & Vendeur
  const [kycSelfiePath, setKycSelfiePath] = useState<string | null>(null);
  const [kycDocType, setKycDocType] = useState<'cni' | 'passeport' | 'permis'>('cni');
  const [kycDocPath, setKycDocPath] = useState<string | null>(null);
  const [authSubStep, setAuthSubStep] = useState<number>(0); // 0 = default form, 1 = Enterprise info (for Vendor), 2 = KYC Step
  
  const [authLoading, setAuthLoading] = useState<boolean>(false);
  const [authSuccess, setAuthSuccess] = useState<boolean>(false);
  
  // Modals & Chat Overlays
  const [showDriverChat, setShowDriverChat] = useState<boolean>(false);
  const [showDriverCall, setShowDriverCall] = useState<boolean>(false);
  const [chatMessages, setChatMessages] = useState<{sender: 'livreur' | 'client', text: string, time: string}[]>([
    { sender: 'livreur', text: "Bonjour, je viens de récupérer votre commande. Je suis en route !", time: "10:01" }
  ]);
  const [newChatMessage, setNewChatMessage] = useState<string>('');
  const [activePastOrderDetail, setActivePastOrderDetail] = useState<Order | null>(null);
  const [toastMessage, setToastMessage] = useState<string | { title: string; body: string; type?: string } | null>(null);
  const [isCheckoutConfirmOpen, setIsCheckoutConfirmOpen] = useState<boolean>(false);
  const [activePrintTicket, setActivePrintTicket] = useState<Order | null>(null);

  // Profile modal settings states
  const [activeProfileModal, setActiveProfileModal] = useState<string | null>(null);
  const [newAddressInput, setNewAddressInput] = useState<string>('');
  const [newCardNumber, setNewCardNumber] = useState<string>('');
  const [newCardName, setNewCardName] = useState<string>('');
  const [newCardExpiry, setNewCardExpiry] = useState<string>('');
  const [newCardCvv, setNewCardCvv] = useState<string>('');
  const [isAddingCard, setIsAddingCard] = useState<boolean>(false);
  const [isListening, setIsListening] = useState<boolean>(false);
  const [voiceBanner, setVoiceBanner] = useState<string | null>(null);

  // useAppStore for global configuration mapping
  const { 
    config, 
    updateConfig,
    notifications,
    addNotification,
    markAllNotificationsAsRead,
    clearNotifications,
    promoCodes,
    faqs,
    referralCode,
    referralCount,
    referralBonus,
    setReferralCode,
    incrementReferrals,
    language,
    setLanguage
  } = useAppStore();

  const t = getTranslation(language);

  // Connected dynamic state for wallet synchronisation
  const walletBalance = config.walletBalance;
  const setWalletBalance = (newBal: number | ((b: number) => number)) => {
    const nextVal = typeof newBal === 'function' ? newBal(config.walletBalance) : newBal;
    updateConfig({ walletBalance: nextVal });
  };

  const [kycStatus, setKycStatus] = useState<'verified' | 'pending' | 'none'>('verified');
  const [kycDocUrl, setKycDocUrl] = useState<string | null>(null);
  const [kycSelfieUrl, setKycSelfieUrl] = useState<string | null>(null);
  
  const [newEmail, setNewEmail] = useState<string>(profile.email);
  const [newName, setNewName] = useState<string>(profile.name);
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  
  // Client Premium customization states
  const [profileCoverUrl, setProfileCoverUrl] = useState<string>(() => localStorage.getItem('DODO_CLIENT_COVER') || 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&auto=format&fit=crop&q=80');
  const [tastePreferences, setTastePreferences] = useState<string[]>(() => JSON.parse(localStorage.getItem('DODO_CLIENT_PREFS') || '["Babenda", "Poulet braisé", "Alloco"]'));
  const [allergies, setAllergies] = useState<string[]>(() => JSON.parse(localStorage.getItem('DODO_CLIENT_ALLERGIES') || '["Sans piment fort"]'));
  const [twoFactorEnabled, setTwoFactorEnabled] = useState<boolean>(() => localStorage.getItem('DODO_CLIENT_2FA') === 'true');
  const [customAvatarUploaded, setCustomAvatarUploaded] = useState<boolean>(false);
  const [selectedAddressLabel, setSelectedAddressLabel] = useState<string>('🏠 Maison');
  
  // Wallet reloader simulation states
  const [reloadAmount, setReloadAmount] = useState<number>(5000);
  const [reloadPhone, setReloadPhone] = useState<string>(profile.phone || '+226 70 89 22 11');
  const [reloadProvider, setReloadProvider] = useState<'orange' | 'moov' | 'wave' | 'telecel' | 'paypal'>('orange');
  const [reloadStep, setReloadStep] = useState<number>(1); // 1 = form, 2 = pin simulation, 3 = success
  const [reloadPin, setReloadPin] = useState<string>('');

  // Wallet history tracker
  const [walletTransactions, setWalletTransactions] = useState<Array<{ id: string; desc: string; amount: number; isDeposit: boolean; time: string }>>([
    { id: 'tx_1', desc: 'Dépôt Orange Money', amount: 5000, isDeposit: true, time: "Aujourd'hui, 09:12" },
    { id: 'tx_2', desc: 'Commande Maquis Fatou', amount: 3500, isDeposit: false, time: "Hier, 19:40" },
    { id: 'tx_3', desc: 'Recharge Moov Money', amount: 10000, isDeposit: true, time: "20 Mai, 12:15" },
    { id: 'tx_4', desc: 'Commande Le Bon Goût', amount: 2500, isDeposit: false, time: "19 Mai, 11:30" },
  ]);

  useEffect(() => {
    localStorage.setItem('DODO_WALLET_BALANCE', walletBalance.toString());
  }, [walletBalance]);

  // Visual enhancement and order cancellation states
  const [showCreditBubble, setShowCreditBubble] = useState<boolean>(false);
  const [isCancelConfirmOpen, setIsCancelConfirmOpen] = useState<boolean>(false);
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState<boolean>(false);
  const [isVibrating, setIsVibrating] = useState<boolean>(false);

  const triggerHaptic = () => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try {
        navigator.vibrate([60]);
      } catch (err) {
        console.warn("Haptic feedback API is unsupported on iOS or iframe policies:", err);
      }
    }
    setIsVibrating(true);
    setTimeout(() => {
      setIsVibrating(false);
    }, 150);
  };

  // Cart State (Initialized empty)
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartShake, setCartShake] = useState<boolean>(false);
  const [checkoutPaymentMethod, setCheckoutPaymentMethod] = useState<string>('Orange Money');
  
  // YengaPay Customer Sandbox Checkout Visual state engine (Audit 1, 2, 5, 20)
  const [isYengaCheckoutOpen, setIsYengaCheckoutOpen] = useState<boolean>(false);
  const [yengaTxId, setYengaTxId] = useState<string>('');
  const [yengaTxRef, setYengaTxRef] = useState<string>('');
  const [yengaOtpCode, setYengaOtpCode] = useState<string>('');
  const [yengaOtpInput, setYengaOtpInput] = useState<string>('');
  const [yengaStep, setYengaStep] = useState<'init' | 'processing' | 'otp' | 'success' | 'failed'>('init');
  const [yengaError, setYengaError] = useState<string | null>(null);

  const [tipOption, setTipOption] = useState<'none' | '5%' | '10%' | '15%' | 'custom'>('none');
  const [customTipValue, setCustomTipValue] = useState<string>('');
  const [promoQuery, setPromoQuery] = useState<string>('');
  const [activeDiscount, setActiveDiscount] = useState<{ code: string; amount: number } | null>(null);
  const [expandedFaqId, setExpandedFaqId] = useState<string | null>(null);

  // Uber Eats Premium features states
  const [isGroupOrderActive, setIsGroupOrderActive] = useState<boolean>(false);
  const [groupOrderCode, setGroupOrderCode] = useState<string>('');
  const [groupMembers, setGroupMembers] = useState<{name: string, itemsCount: number, total: number}[]>([]);
  const [currentUserName, setCurrentUserName] = useState<string>(() => {
    return localStorage.getItem('DODO_USER_NAME') || profile.name || 'Moussa Traoré';
  });
  const [isJoinModalOpen, setIsJoinModalOpen] = useState<boolean>(false);
  const [guestNameInput, setGuestNameInput] = useState<string>('');

  // Keep stable refs to avoid re-triggering BroadcastChannel sync on every cart change
  const cartRef = useRef<CartItem[]>(cart);
  const groupMembersRef = useRef<any[]>(groupMembers);
  const currentUserNameRef = useRef<string>(currentUserName);

  useEffect(() => {
    cartRef.current = cart;
  }, [cart]);

  useEffect(() => {
    groupMembersRef.current = groupMembers;
  }, [groupMembers]);

  useEffect(() => {
    currentUserNameRef.current = currentUserName;
  }, [currentUserName]);

  const [deliveryMode, setDeliveryMode] = useState<'now' | 'scheduled'>('now');
  const [scheduledDateTime, setScheduledDateTime] = useState<string>("Aujourd'hui, 19:30");
  const [isDodoPassSubscribed, setIsDodoPassSubscribed] = useState<boolean>(() => localStorage.getItem('DODO_PASS_SUBSCRIBED') === 'true');

  // Dietary Restriction filter
  const [selectedDietaryFilter, setSelectedDietaryFilter] = useState<string | null>(null);

  // Dynamic Dish Reviews with Photo Upload Simulation
  const [dynamicReviews, setDynamicReviews] = useState<Array<{ name: string; rating: number; date: string; text: string; dish_name?: string; photo_url?: string }>>([
    { name: 'Kadiogo F.', rating: 5, date: 'Aujourd\'hui', text: 'Le riz gras au poulet de ce maquis est à tomber par terre, très savoureux et le poulet est extrêmement croustillant ! Je recommande sans hésiter.', dish_name: 'Riz gras au poulet', photo_url: 'https://images.unsplash.com/photo-1604329760661-e71dc83f8f26?w=600&auto=format&fit=crop&q=80' },
    { name: 'Idrissa O.', rating: 4, date: 'Hier', text: 'Tô bien fait avec une sauce arachide délicieuse d\'un goût incomparable. Livraison rapide de la part de Dodo en moins de 25 minutes.', dish_name: 'Tô au sauce arachide', photo_url: 'https://images.unsplash.com/photo-1547592180-85f173990554?w=600&auto=format&fit=crop&q=80' },
    { name: 'Bernadette S.', rating: 5, date: 'Il y a 3 jours', text: 'Toujours au top ! J\'ai commandé de la soupe de légumes, elle est arrivée bien chaude avec beaucoup de viande tendre.', dish_name: 'Soupe de légumes', photo_url: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600&auto=format&fit=crop&q=80' }
  ]);

  // Form states for creating a review
  const [isAddingReview, setIsAddingReview] = useState<boolean>(false);
  const [newReviewText, setNewReviewText] = useState<string>('');
  const [newReviewRating, setNewReviewRating] = useState<number>(5);
  const [newReviewDish, setNewReviewDish] = useState<string>('Poulet bicyclette rôti 🍗');
  const [newReviewPhoto, setNewReviewPhoto] = useState<string>('https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=600&auto=format&fit=crop&q=80');

  // Geolocation Suggested Addresses states
  const [detectedAddress, setDetectedAddress] = useState<string>('');
  const [isGeoSuggestionVisible, setIsGeoSuggestionVisible] = useState<boolean>(false);
  const [gpsNotificationShown, setGpsNotificationShown] = useState<boolean>(() => {
    return sessionStorage.getItem('DODO_GPS_NOTIFICATION_SHOWN') === 'true';
  });

  // Trigger GPS Suggestion popup notification when landing on Home screen
  useEffect(() => {
    if (currentScreenId === 2 && !gpsNotificationShown && detectedAddress) {
      const timer = setTimeout(() => {
        setToastMessage({
          title: "📍 ADRESSE GPS DÉTECTÉE 🛵",
          body: detectedAddress,
          type: "location_detected",
          payload: detectedAddress
        });
        
        addNotification(
          "📍 Adresse GPS Détectée",
          `Dodo a détecté votre position près de : ${detectedAddress}. Appuyez sur la notification pour l'enregistrer !`
        );

        setGpsNotificationShown(true);
        sessionStorage.setItem('DODO_GPS_NOTIFICATION_SHOWN', 'true');
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [currentScreenId, detectedAddress, gpsNotificationShown]);

  // Automatic GPS Geolocation on startup
  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          let suggestedName = `Secteur 12, Près du Stade, Ouagadougou`;
          
          try {
            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`, {
              headers: { 'Accept-Language': 'fr' }
            });
            if (res.ok) {
              const data = await res.json();
              if (data && data.display_name) {
                const parts = data.display_name.split(',');
                suggestedName = parts.slice(0, 3).join(',').trim();
              }
            }
          } catch (err) {
            console.log("Error reverse-geocoding, fallback to coordinate labeling", err);
            if (Math.abs(latitude - 12.37) < 0.2 && Math.abs(longitude + 1.52) < 0.2) {
              suggestedName = `Ouaga 2000, Proche de l'Ambassade (GPS: ${latitude.toFixed(4)}, ${longitude.toFixed(4)})`;
            } else {
              suggestedName = `Adresse détectée par GPS: Secteur 15, Ouagadougou (${latitude.toFixed(4)}°, ${longitude.toFixed(4)}°)`;
            }
          }
          setDetectedAddress(suggestedName);
          setIsGeoSuggestionVisible(true);
        },
        (error) => {
          console.warn("Geolocation permission declined or failed:", error);
          // Suggest a default nearby simulated address for immersive demo
          setDetectedAddress(`Zone du Bois, Rue de la Tempête, Ouagadougou (Simulé GPS: 12.358, -1.512)`);
          setIsGeoSuggestionVisible(true);
        },
        { enableHighAccuracy: true, timeout: 5000 }
      );
    }
  }, []);

  // Simulation State for the live delivery driver
  const [driverProgress, setDriverProgress] = useState<number>(0.2); // 0.0 to 1.0 (from restaurant to buyer)
  const [driverIsSimulating, setDriverIsSimulating] = useState<boolean>(true);
  const [activeTrackingOrderId, setActiveTrackingOrderId] = useState<string>('#DODO12345');

  // Load cart from local storage & check unified url sharedCartId parameter
  useEffect(() => {
    const savedCart = localStorage.getItem('DODO_CURRENT_CART');
    if (savedCart) {
      try {
        setCart(JSON.parse(savedCart));
      } catch (e) {
        setCart([]);
      }
    }

    const urlParams = new URLSearchParams(window.location.search);
    const sharedCartIdFr = urlParams.get('sharedCartId');
    if (sharedCartIdFr) {
      setIsGroupOrderActive(true);
      setGroupOrderCode(sharedCartIdFr);
      
      const savedName = localStorage.getItem('DODO_USER_NAME');
      if (savedName) {
        setCurrentUserName(savedName);
      } else {
        // Automatically open name prompt modal
        setIsJoinModalOpen(true);
      }
    }
  }, []);

  // BroadcastChannel Multi-User sync handling
  useEffect(() => {
    if (!isGroupOrderActive || !groupOrderCode) return;

    try {
      const channel = new BroadcastChannel(`dodo-shared-cart-${groupOrderCode}`);

      channel.onmessage = (event) => {
        const { type, payload } = event.data || {};
        
        if (type === 'SYNC') {
          if (payload.originator !== currentUserNameRef.current) {
            if (payload.cart !== undefined) {
              setCart(payload.cart);
              localStorage.setItem('DODO_CURRENT_CART', JSON.stringify(payload.cart));
            }
            if (payload.groupMembers !== undefined) {
              setGroupMembers(payload.groupMembers);
            }
          }
        } else if (type === 'JOIN') {
          const guestName = payload.name;
          if (guestName === currentUserNameRef.current) return; // ignore self
          
          setGroupMembers(prev => {
            const cleanGuestName = guestName.trim();
            const exists = prev.some(m => m.name.replace(/\s*\(Moi\)|\s*\(Ami\)|\s*\(Invité\)/gi, '').toLowerCase() === cleanGuestName.toLowerCase());
            if (exists) return prev;
            
            const next = [...prev, { name: `${cleanGuestName} (Invité)`, itemsCount: 0, total: 0 }];
            
            // Send current state back to newcomer
            setTimeout(() => {
              try {
                channel.postMessage({
                  type: 'SYNC',
                  payload: {
                    cart: cartRef.current,
                    groupMembers: next,
                    originator: currentUserNameRef.current
                  }
                });
              } catch (err) {
                console.error("Delayed broadcast sync error:", err);
              }
            }, 100);

            return next;
          });
          showToast(`👥 ${guestName} a rejoint le panier partagé !`);
        }
      };

      // Broadcast our join presence to existing users
      channel.postMessage({
        type: 'JOIN',
        payload: { name: currentUserName }
      });

      return () => {
        channel.close();
      };
    } catch (e) {
      console.warn("BroadcastChannel API error:", e);
    }
  }, [isGroupOrderActive, groupOrderCode]);

  // Sync cart helper
  const updateCart = (newCart: CartItem[], newMembers?: {name: string, itemsCount: number, total: number}[]) => {
    setCart(newCart);
    localStorage.setItem('DODO_CURRENT_CART', JSON.stringify(newCart));

    // Calculate new member totals based on upgraded cart items
    let nextMembers = newMembers;
    if (!nextMembers && isGroupOrderActive) {
      const memberMap: Record<string, { itemsCount: number, total: number }> = {};
      
      // Initialize existing members
      groupMembers.forEach(m => {
        memberMap[m.name] = { itemsCount: 0, total: 0 };
      });
      // Safety: always ensure currentUserName is initialized
      const selfName = `${currentUserName} (Moi)`;
      if (!memberMap[selfName]) {
        memberMap[selfName] = { itemsCount: 0, total: 0 };
      }
      
      // Accumulate cart items per user
      newCart.forEach(it => {
        const addedByUser = it.addedBy || selfName;
        if (!memberMap[addedByUser]) {
          memberMap[addedByUser] = { itemsCount: 0, total: 0 };
        }
        memberMap[addedByUser].itemsCount += it.quantity;
        memberMap[addedByUser].total += it.menu_item.price * it.quantity;
      });
      
      nextMembers = Object.keys(memberMap).map(name => ({
        name,
        itemsCount: memberMap[name].itemsCount,
        total: memberMap[name].total
      }));
      setGroupMembers(nextMembers);
    }

    // Broadcast if active
    if (isGroupOrderActive && groupOrderCode) {
      try {
        const channel = new BroadcastChannel(`dodo-shared-cart-${groupOrderCode}`);
        channel.postMessage({
          type: 'SYNC',
          payload: {
            cart: newCart,
            groupMembers: nextMembers || groupMembers,
            originator: currentUserName
          }
        });
        channel.close();
      } catch (err) {
        console.warn("Broadcast error:", err);
      }
    }
  };

  // Toast Helper
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  // Web Speech API Voice Search
  const startVoiceSearch = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      showToast(language === 'fr' ? "Recherche vocale non supportée sur ce navigateur." : "Voice search not supported on this browser.");
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.lang = language === 'fr' ? 'fr-FR' : 'en-US';
      recognition.interimResults = false;

      recognition.onstart = () => {
        setIsListening(true);
        setVoiceBanner(language === 'fr' ? "Écoute en cours... Parlez maintenant." : "Listening... Speak now.");
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        // Clean trailing punctuation like periods that Speech API often adds
        const cleanedTranscript = transcript.replace(/[\.\?,!]/g, '');
        setSearchQuery(cleanedTranscript);
        setVoiceBanner(null);
        showToast(language === 'fr' ? `Commande vocale reçue : "${cleanedTranscript}"` : `Voice search matching: "${cleanedTranscript}"`);
      };

      recognition.onerror = (event: any) => {
        console.error("Speech Recognition error", event);
        setVoiceBanner(language === 'fr' ? "Nous n'avons pas pu capter votre micro." : "We couldn't capture your microphone.");
        setTimeout(() => setVoiceBanner(null), 3000);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch (e) {
      console.error(e);
      setIsListening(false);
    }
  };

  // Trigger screen change callback
  const changeScreen = (screenId: number) => {
    setCurrentScreenId(screenId);
    if (onScreenChange) {
      onScreenChange(screenId);
    }
  };

  // Driver simulation step effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    const trackedOrder = orders.find(o => o.order_number === activeTrackingOrderId);
    const isEnRoute = trackedOrder && trackedOrder.status === 'En route';

    if (driverIsSimulating && currentScreenId === 5 && isEnRoute) { // Only animate when on tracking screen and order is actually en route
      interval = setInterval(() => {
        setDriverProgress(prev => {
          if (prev >= 1.0) {
            // Mark as Livré
            if (trackedOrder && trackedOrder.status === 'En route') {
              updateOrderStatus(trackedOrder.id, 'Livré').then(() => {
                onOrderPlaced(); // Sync with state
              });
              setToastMessage({
                title: "Votre livreur est arrivé ! 🎉",
                body: "Blaise K. est devant votre résidence de livraison. Récupérez vos plats chauds ! Bon appétit !",
                type: "delivery"
              });
            }
            return 1.0;
          }
          return parseFloat((prev + 0.05).toFixed(2));
        });
      }, 3500);
    }
    return () => clearInterval(interval);
  }, [driverIsSimulating, currentScreenId, activeTrackingOrderId, orders, onOrderPlaced]);

  // Cart operations based on MenuItems
  const addToCart = (item: MenuItem) => {
    // If cart has items from another restaurant, warn and let them clear or reject
    const hasOtherRest = cart.some(cartitem => cartitem.menu_item.restaurant_id !== item.restaurant_id);
    const selfName = `${currentUserName} (Moi)`;
    if (hasOtherRest) {
      if (window.confirm("Votre panier contient des plats d'un autre maquis. Voulez-vous vider le panier actuel pour commander chez " + selectedRestaurant.name + " ?")) {
        const newCart = [{ menu_item: item, quantity: 1, addedBy: isGroupOrderActive ? selfName : undefined }];
        updateCart(newCart);
        showToast(`Ajouté d'abord : ${item.name}`);
      }
      return;
    }

    // Filter/Match both item ID and addedBy user if group order is active
    const existIndex = cart.findIndex(cartitem => {
      const matchItem = cartitem.menu_item.id === item.id;
      const matchUser = !isGroupOrderActive || cartitem.addedBy === selfName;
      return matchItem && matchUser;
    });

    if (existIndex > -1) {
      const newCart = [...cart];
      newCart[existIndex].quantity += 1;
      updateCart(newCart);
    } else {
      updateCart([...cart, { 
        menu_item: item, 
        quantity: 1, 
        addedBy: isGroupOrderActive ? selfName : undefined 
      }]);
    }
    
    // Trigger cart icon shake animation
    setCartShake(true);
    setTimeout(() => {
      setCartShake(false);
    }, 700);

    // Trigger physical/simulated micro haptic feedback
    triggerHaptic();

    showToast(`Ajouté au panier : ${item.name}`);
  };

  const updateCartQuantity = (itemId: string, change: number, addedBy?: string) => {
    const updated = cart.map(cartitem => {
      const matchItem = cartitem.menu_item.id === itemId;
      const matchUser = !isGroupOrderActive || !addedBy || cartitem.addedBy === addedBy;
      if (matchItem && matchUser) {
        const newQty = cartitem.quantity + change;
        return { ...cartitem, quantity: newQty };
      }
      return cartitem;
    }).filter(cartitem => cartitem.quantity > 0);
    updateCart(updated);
  };

  const removeFromCart = (itemId: string, addedBy?: string) => {
    const updated = cart.filter(cartitem => {
      const matchItem = cartitem.menu_item.id === itemId;
      const matchUser = !isGroupOrderActive || !addedBy || cartitem.addedBy === addedBy;
      return !(matchItem && matchUser);
    });
    updateCart(updated);
    showToast("Article retiré du panier");
  };

  const toggleFavorite = (restId: string) => {
    if (favorites.includes(restId)) {
      setFavorites(prev => prev.filter(id => id !== restId));
      showToast("Retiré des favoris");
    } else {
      setFavorites(prev => [...prev, restId]);
      showToast("Ajouté aux favoris ! ❤️");
    }
  };

  const printOrderToHTML = (order: Order) => {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Recu Dodo Express - ${order.order_number}</title>
        <meta charset="utf-8" />
        <style>
          body {
            font-family: 'Courier New', Courier, monospace;
            padding: 35px 20px;
            max-width: 400px;
            margin: 0 auto;
            color: #000;
            background-color: #fff;
            line-height: 1.4;
          }
          .title {
            text-align: center;
            font-weight: bold;
            font-size: 20px;
            margin-bottom: 5px;
          }
          .subtitle {
            text-align: center;
            font-size: 12px;
            margin-bottom: 25px;
            border-bottom: 1px dashed #000;
            padding-bottom: 12px;
          }
          .info-line {
            display: flex;
            justify-content: space-between;
            font-size: 13px;
            margin-bottom: 6px;
          }
          .divider {
            border-top: 1px dashed #000;
            margin: 15px 0;
          }
          .item {
            display: flex;
            justify-content: space-between;
            font-size: 13px;
            margin-bottom: 7px;
          }
          .totals {
            font-size: 13px;
            margin-top: 12px;
          }
          .total-bold {
            font-size: 16px;
            font-weight: bold;
            display: flex;
            justify-content: space-between;
            border-top: 1px dashed #000;
            padding-top: 10px;
            margin-top: 10px;
          }
          .footer {
            text-align: center;
            font-size: 11px;
            margin-top: 35px;
            border-top: 1px dashed #000;
            padding-top: 15px;
          }
          @media print {
            .no-print { display: none; }
          }
          .btn {
            display: block;
            width: 100%;
            text-align: center;
            padding: 12px;
            background: #E52327;
            color: #fff;
            text-decoration: none;
            font-weight: bold;
            border-radius: 8px;
            margin-bottom: 20px;
            font-family: sans-serif;
            font-size: 13px;
            border: none;
            cursor: pointer;
          }
        </style>
      </head>
      <body>
        <div class="no-print">
          <button class="btn" onclick="window.print()">🖨️ RELANCER L'IMPRESSION / PDF</button>
        </div>
        <div class="title">DODO EXPRESS 🏍️</div>
        <div class="subtitle">Service de Livraison Burkina Faso</div>
        
        <div class="info-line"><span>Commande :</span><span><b>${order.order_number}</b></span></div>
        <div class="info-line"><span>Date :</span><span>${order.created_at}</span></div>
        <div class="info-line"><span>Maquis :</span><span>${order.restaurant.name}</span></div>
        <div class="info-line"><span>Statut :</span><span>LIVRÉE (Payé)</span></div>
        
        <div class="divider"></div>
        <div style="font-weight: bold; margin-bottom: 8px; font-size: 13px;">PLATS COMMANDÉS</div>
        ${order.items.map(it => `
          <div class="item">
            <span>x${it.quantity} ${it.menu_item.name}</span>
            <span>${it.quantity * it.menu_item.price} FCFA</span>
          </div>
        `).join('')}
        
        <div class="divider"></div>
        
        <div class="totals">
          <div class="info-line"><span>Sous-total :</span><span>${order.subtotal} FCFA</span></div>
          <div class="info-line"><span>Frais livraison :</span><span>${order.delivery_fee} FCFA</span></div>
          <div class="total-bold"><span>TOTAL PAYÉ :</span><span>${order.total} FCFA</span></div>
        </div>
        
        <div class="footer">
          Merci pour votre confiance sur Dodo Express !<br/>
          Savourez le Faso 🇧🇫
        </div>
        
        <script>
          setTimeout(function() {
            window.print();
          }, 350);
        </script>
      </body>
      </html>
    `;
  };

  const handleDownloadTxtReceipt = (order: Order) => {
    const rawTxt = `
========================================
            DODO EXPRESS 🏍️
       REÇU OFFICIEL DE COMMANDE
========================================
Référence : ${order.order_number}
Date      : ${order.created_at}
Maquis    : ${order.restaurant.name}
----------------------------------------
PLATS COMMANDÉS:
${order.items.map(it => ` - ${it.quantity}x ${it.menu_item.name} (${it.menu_item.price} FCFA/u) : ${it.quantity * it.menu_item.price} FCFA`).join('\n')}
----------------------------------------
Sous-total        : ${order.subtotal} FCFA
Frais livraison   : ${order.delivery_fee} FCFA
TOTAL PAYÉ        : ${order.total} FCFA (${order.payment_method || 'YENGAPAY'})
========================================
Merci pour votre commande sur Dodo Express !
Savourez les bons plats du Burkina 🇧🇫
========================================
`;
    const element = document.createElement("a");
    const file = new Blob([rawTxt], {type: 'text/plain;charset=utf-8'});
    element.href = URL.createObjectURL(file);
    element.download = `recu_dodo_${order.order_number.replace('#', '')}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    showToast("Reçu exporté en format liste simple ! 📥");
  };

  const handlePrintAction = (order: Order) => {
    try {
      const htmlContent = printOrderToHTML(order);
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(htmlContent);
        printWindow.document.close();
      } else {
        handleDownloadTxtReceipt(order);
        showToast("Impression directe bloquée par l'iframe. Version texte téléchargée avec succès ! 📝");
      }
    } catch (e) {
      handleDownloadTxtReceipt(order);
    }
  };

  // Simulates iOS push notifications sequence for order tracking progress (Audit 20, 5, 2)
  const simulatePushLifecycle = (orderId: string, restName: string, orderNum: string) => {
    // 1. Order confirmed transition to preparing (5s)
    setTimeout(async () => {
      const latestOrders = await fetchOrders();
      const currentOrg = latestOrders.find(o => o.id === orderId);
      if (!currentOrg || currentOrg.status === 'Annulée') return;

      await updateOrderStatus(orderId, 'En préparation');
      onOrderPlaced(); // Synchronizes the states in upper DB
      addNotification(
        "Cuisine active ! 🍳", 
        `Le chef de "${restName}" a commencé la cuisson de vos plats de la commande ${orderNum}.`
      );
      setToastMessage({
        title: "Commande Confirmée ! 🍳",
        body: `Votre commande chez "${restName}" a été validée d'un commun accord. Le maquis prépare vos plats.`
      });
    }, 5000);

    // 2. Ready for delivery (12s)
    setTimeout(async () => {
      const latestOrders = await fetchOrders();
      const currentOrg = latestOrders.find(o => o.id === orderId);
      if (!currentOrg || currentOrg.status === 'Annulée') return;

      await updateOrderStatus(orderId, 'Prête');
      onOrderPlaced();
      addNotification(
        "Plats cuisinés ! 🍛", 
        `Votre panier de la commande ${orderNum} est emballé de manière hermétique. Le coursier arrive.`
      );
      setToastMessage({
        title: "Mise à jour d'état : Prête ! 🍛",
        body: `Vos spécialités sont cuisinées et emballées. Le livreur Blaise K. procède à la récupération.`
      });
    }, 12000);

    // 3. Driver on the way (20s)
    setTimeout(async () => {
      const latestOrders = await fetchOrders();
      const currentOrg = latestOrders.find(o => o.id === orderId);
      if (!currentOrg || currentOrg.status === 'Annulée') return;

      await updateOrderStatus(orderId, 'En route');
      onOrderPlaced();
      setDriverProgress(0.1);
      setDriverIsSimulating(true);
      addNotification(
        "En cours de livraison ! 🏍️", 
        `Blaise K. a démarré sa moto direction votre point GPS pour la commande ${orderNum}.`
      );
      setToastMessage({
        title: "Plats récupérés, en route ! 🏍️",
        body: "Votre livreur Blaise K. s'est mis en route. Suivez son compteur GPS en temps réel !"
      });
    }, 20000);
  };

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    
    // Trigger intense/success haptic feedback vibration for ordering validation
    triggerHaptic();
    
    const subtotal = cart.reduce((sum, item) => sum + (item.menu_item.price * item.quantity), 0);
    const orderNum = `#DODO${Math.floor(10000 + Math.random() * 90000)}`;
    const isFree = (config.freeDeliveryThreshold > 0 && subtotal >= config.freeDeliveryThreshold) || isDodoPassSubscribed;
    const computedFee = isFree ? 0 : config.baseDeliveryFee;
    const discountAmt = activeDiscount?.amount || 0;
    const tipAmt = getTipAmount();
    const finalAmt = Math.max(0, subtotal + computedFee + config.serviceFee - discountAmt + tipAmt);
    
    const newOrder: Order = {
      id: `ord_${Date.now()}`,
      order_number: orderNum,
      restaurant: selectedRestaurant,
      items: [...cart],
      status_times: {
        confirmed: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
        preparing: '--:--',
        ready: '--:--',
        on_the_way: '--:--',
      },
      subtotal: subtotal,
      delivery_fee: computedFee,
      total: finalAmt,
      note: cartNotes,
      created_at: new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }),
      driver: {
        name: 'Blaise K.',
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
        rating: 4.8,
        phone: '+226 76 89 90 22'
      },
      delivery_mode: deliveryMode,
      scheduled_time: deliveryMode === 'scheduled' ? scheduledDateTime : undefined,
      is_group_order: isGroupOrderActive,
      payment_method: checkoutPaymentMethod,
      status: 'En attente de paiement',
    };

    // Push initial confirmation notification
    addNotification(
      "Commande validée ! 🛵", 
      `Votre commande ${orderNum} chez "${selectedRestaurant.name}" d'un montant de ${finalAmt} ${config.currencySymbol} a été transmise avec succès.`
    );

    try {
      await insertOrder(newOrder);
      // Empty local cart & resets promo query
      updateCart([]);
      setCartNotes('');
      setPromoQuery('');
      setActiveDiscount(null);
      setDriverProgress(0.0); // Starts from 0.0 until 'En route'!
      setActiveTrackingOrderId(orderNum);
      
      // Update parent list
      onOrderPlaced();
      
      // Init YengaPay Secure billing (Audit 1, 2, 3, 5, 20)
      const yengaConf = getYengaConfig();
      const resTx = createYengaTransaction(
        'moussa_profile',
        profile.email || 'moussa.traore@gmail.com',
        profile.phone || '+226 70 12 34 56',
        finalAmt,
        finalAmt, // expectedAmt matches finalAmt to prevent price-tampering (Audit 3)
        'order',
        orderNum,
        checkoutPaymentMethod
      );

      if (!resTx.success) {
        setYengaError(resTx.message);
        setYengaStep('failed');
        setIsYengaCheckoutOpen(true);
        return;
      }

      if (resTx.transaction) {
        setYengaTxId(resTx.transaction.id);
        setYengaTxRef(resTx.transaction.reference);
        setYengaError(null);
          
          const isTwoStep = ['Moov Money', 'Sankm', 'Coris'].includes(checkoutPaymentMethod);
          if (isTwoStep) {
            setYengaStep('init');
          } else {
            setYengaStep('processing');
            // One-step auto processing depending on delay setting (Audit 20)
            const simulatedDelay = (yengaConf.simulateTimeout ? 30000 : yengaConf.simulationDelay * 1000) || 1200;
            setTimeout(() => {
              const runPay = completeDirectPayMobileMoney(resTx.transaction!.id);
              if (runPay.success) {
                setYengaStep('success');
                triggerHaptic();
                setTimeout(() => {
                  setIsYengaCheckoutOpen(false);
                  changeScreen(5);
                  simulatePushLifecycle(newOrder.id, selectedRestaurant.name, orderNum);
                }, 1500);
              } else {
                setYengaError(runPay.message);
                setYengaStep('failed');
              }
            }, simulatedDelay);
          }
          setIsYengaCheckoutOpen(true);
        }
      } catch (e) {
      console.error(e);
      showToast("Erreur lors de la commande");
    }
  };

  const sendTextMessage = () => {
    if (!newChatMessage.trim()) return;
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const updatedMessages = [
      ...chatMessages,
      { sender: 'client' as const, text: newChatMessage, time: timeStr }
    ];
    setChatMessages(updatedMessages);
    setNewChatMessage('');

    // Simulate driver reply in 2 seconds
    setTimeout(() => {
      const responses = [
        "Reçu ! Je me dépêche.",
        "D'accord, je suis au niveau du rond-point.",
        "Tout à fait, je serai là dans 5 minutes !",
        "Je suis devant la porte d'entrée !"
      ];
      const randomReply = responses[Math.floor(Math.random() * responses.length)];
      setChatMessages(prev => [
        ...prev,
        { sender: 'livreur' as const, text: randomReply, time: timeStr }
      ]);
    }, 1500);
  };

  const getDietaryFeatures = (restId: string): string[] => {
    if (restId === 'rest_fatou') return ['Sans porc', 'Grillades au feu de bois', 'Épicé'];
    if (restId === 'rest_gout') return ['Sans porc', 'Végétarien', 'Épicé'];
    if (restId === 'rest_saveurs') return ['Sans porc', 'Grillades au feu de bois', 'Épicé'];
    return ['Sans porc'];
  };

  // Filters restaurants by category and search
  const filteredRestaurants = restaurants.filter(rest => {
    const matchesCategory = selectedCategory === 'Plus' || 
      (selectedCategory === 'Riz' && rest.category === 'Riz') ||
      (selectedCategory === 'Tô' && rest.category === 'Tô' || rest.name.includes('Fatou') && selectedCategory === 'Tô') || // fallback for fatou
      (selectedCategory === 'Soupe' && rest.category === 'Soupe' || rest.name.includes('Fatou') && selectedCategory === 'Soupe') ||
      (selectedCategory === 'Grillades' && rest.category === 'Grillades');
      
    const matchesSearch = rest.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      rest.description.toLowerCase().includes(searchQuery.toLowerCase());
      
    const matchesDietary = !selectedDietaryFilter || getDietaryFeatures(rest.id).includes(selectedDietaryFilter);
    return matchesCategory && matchesSearch && matchesDietary;
  });

  // Calculate cart metrics
  const cartSubtotal = cart.reduce((sum, item) => sum + (item.menu_item.price * item.quantity), 0);
  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  // Dynamic Tip Amount calculation based on options
  const getTipAmount = () => {
    if (tipOption === 'none') return 0;
    if (tipOption === '5%') return Math.round(cartSubtotal * 0.05);
    if (tipOption === '10%') return Math.round(cartSubtotal * 0.10);
    if (tipOption === '15%') return Math.round(cartSubtotal * 0.15);
    if (tipOption === 'custom') {
      const parsed = parseInt(customTipValue);
      return isNaN(parsed) || parsed < 0 ? 0 : parsed;
    }
    return 0;
  };
  const tipAmount = getTipAmount();

  // Dynamic configuration-driven delivery fees & thresholds
  const isFreeDelivery = (config.freeDeliveryThreshold > 0 && cartSubtotal >= config.freeDeliveryThreshold) || isDodoPassSubscribed;
  const deliveryFee = isFreeDelivery ? 0 : config.baseDeliveryFee;
  const activeOrder = orders.find(o => o.status !== 'Livré') || orders[0];

  return (
    <div id="iphone_wrapper" className={`relative mx-auto w-[390px] h-[844px] bg-slate-900 rounded-[55px] p-[12px] shadow-2xl border-[6px] border-slate-800 ring-1 ring-slate-700/50 flex flex-col overflow-hidden select-none transition-transform duration-75 ${isVibrating ? 'animate-haptic scale-[0.992]' : ''}`}>
      
      {/* Elegant Simulated iOS-Style Push Notification Banner */}
      <AnimatePresence>
        {toastMessage && typeof toastMessage === 'object' && (
          <motion.div 
            initial={{ opacity: 0, y: -80, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -30, scale: 0.92 }}
            transition={{ type: "spring", stiffness: 380, damping: 26 }}
            className="absolute top-[68px] left-[16px] right-[16px] z-[100] bg-white/95 backdrop-blur-md rounded-2xl p-4 shadow-2xl border border-gray-150 flex flex-col gap-1.5 text-left active:scale-98 transition cursor-pointer"
            onClick={() => setToastMessage(null)}
          >
            {/* Notification App Title Row */}
            <div className="flex items-center justify-between text-gray-400 text-[9.5px] font-bold">
              <div className="flex items-center gap-1.5">
                <div className="w-4.5 h-4.5 rounded-lg bg-[#E52327] flex items-center justify-center text-white text-[10px] font-black">
                  D
                </div>
                <span className="text-gray-800 font-extrabold uppercase tracking-wide">DODO EXPRESS</span>
                <span className="text-gray-300 font-medium">•</span>
                <span className="text-gray-400 font-medium">Notification Push</span>
              </div>
              <span className="text-gray-400 font-medium font-mono text-[9px] uppercase">à l'instant</span>
            </div>

            {/* Title & Description Body */}
            <div className="space-y-0.5 mt-0.5">
              <h4 className="text-[12.5px] font-black text-gray-950 tracking-tight">
                {typeof toastMessage === 'string' ? "Mise à jour Dodo Express" : toastMessage.title}
              </h4>
              <p className="text-[11px] font-bold text-gray-700 leading-normal">
                {typeof toastMessage === 'string' ? toastMessage : toastMessage.body}
              </p>
            </div>

            {/* Interactive buttons for GPS selection within the notification */}
            {typeof toastMessage !== 'string' && toastMessage?.type === 'location_detected' && (
              <div className="flex gap-2 mt-2 pt-1 border-t border-gray-100" onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={() => {
                    const addr = toastMessage.payload;
                    if (addr) {
                      if (!profile.addresses.includes(addr)) {
                        const updated = [...profile.addresses, addr];
                        const updatedProf = { ...profile, addresses: updated };
                        setProfile(updatedProf);
                        saveProfile(updatedProf);
                      }
                      showToast("Adresse enregistrée ! 📌");
                    }
                    setToastMessage(null);
                  }}
                  className="bg-[#E52327] hover:bg-rose-700 text-white px-3 py-1.5 rounded-xl text-[10.5px] font-black leading-none transition cursor-pointer select-none active:scale-95 text-center mt-1"
                >
                  Ajouter l'adresse 📌
                </button>
                <button
                  onClick={() => setToastMessage(null)}
                  className="bg-white hover:bg-gray-100 border border-gray-200 text-gray-600 px-3 py-1.5 rounded-xl text-[10.5px] font-bold leading-none transition cursor-pointer select-none active:scale-95 text-center mt-1"
                >
                  Ignorer
                </button>
              </div>
            )}

            {/* Swipe dismiss bar */}
            <div className="w-7 h-0.7 bg-gray-200 rounded-full mx-auto mt-1 sticky bottom-0"></div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* iPhone Dynamic Island Speaker & Camera */}
      <div className="absolute top-[16px] left-1/2 -translate-x-1/2 w-[110px] h-[30px] bg-black rounded-[20px] z-50 flex items-center justify-between px-3">
        <div className="w-3.5 h-3.5 bg-[#1F2937] rounded-full border border-gray-900"></div>
        <div className="w-12 h-1 bg-gray-900 rounded-full"></div>
        <div className="w-2.5 h-2.5 bg-rose-950/40 rounded-full"></div>
      </div>

      {/* Screen Container with white background */}
      <div className="relative flex-1 w-full h-full bg-[#FAFAFA] rounded-[43px] overflow-hidden flex flex-col font-sans text-gray-900 shadow-inner">
        
        {/* Status Bar */}
        <div className="h-[47px] w-full flex justify-between items-end px-7 pb-2.5 bg-transparent z-40 text-black text-[14px] font-semibold">
          <span>9:41</span>
          <div className="flex items-center gap-1.5">
            <svg className="w-4 h-4 text-black" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 3c-4.97 0-9 4.03-9 9 0 2.12.74 4.07 1.97 5.61L4.35 19.4c-.39.39-.39 1.02 0 1.41.39.39 1.02.39 1.41 0l1.9-1.9C9.36 20.2 10.64 20.5 12 20.5c4.97 0 9-4.03 9-9s-4.03-9-9-9zm0 15c-3.31 0-6-2.69-6-6s2.69-6 6-6 6 2.69 6 6-2.69 6-6 6zm1-11h-2v4H7v2h4v4h2v-4h4v-2h-4V7z"/>
            </svg>
            <svg className="w-4 h-4 text-black" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
            </svg>
            <div className="w-5 h-2.5 border border-black rounded-sm p-0.5 flex items-center">
              <div className="w-3.5 h-full bg-black rounded-[1px]"></div>
            </div>
          </div>
        </div>

        {/* =======================================================
            MAINTENANCE MODE COVER - ADMIN CONFIGURABLE OVERLAY
            ======================================================= */}
        {config.maintenanceMode && (
          <div className="absolute inset-0 bg-slate-900 flex flex-col items-center justify-center p-6 z-[60] text-center select-none font-sans">
            <div className="w-20 h-20 bg-amber-500/10 border-2 border-amber-500/30 rounded-full flex items-center justify-center text-amber-400 text-3xl mb-5 animate-bounce">
              🛠️
            </div>
            <h1 className="text-lg font-black text-white tracking-tight">{config.appName} en Maintenance</h1>
            <p className="text-xs text-gray-400 mt-2 max-w-[280px] leading-relaxed font-semibold">
              Notre équipe technique effectue actuellement des travaux d'optimisation pour vous garantir des livraisons encore plus rapides.
            </p>
            <div className="bg-slate-800/80 border border-slate-700/60 rounded-xl p-3.5 mt-5 text-[11px] text-amber-200/95 leading-normal max-w-[260px] font-bold">
              📢 Message de l'administrateur :<br/>
              <span className="text-white font-black mt-1 block">"{config.welcomeBanner}"</span>
            </div>
            <p className="text-[10px] text-gray-500 mt-8 font-extrabold uppercase tracking-widest">
              ⚡ Retour très rapide ! Merci de votre patience.
            </p>
          </div>
        )}

        {/* =======================================================
            COLLABORATIVE SHARED-CART JOIN MODAL
            ======================================================= */}
        <AnimatePresence>
          {isJoinModalOpen && (
            <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-md z-[110] flex items-center justify-center p-6 font-sans">
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white rounded-[28px] w-full max-w-[300px] p-5 text-center shadow-2xl border border-gray-100 flex flex-col items-center gap-4"
              >
                <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center text-[#E52327] shadow-sm">
                  <Users className="w-7 h-7 stroke-[2]" />
                </div>
                
                <div className="space-y-1 text-center">
                  <h3 className="text-[16px] font-black text-gray-950 tracking-tight leading-tight">Panier partagé rejoint ! 🤝</h3>
                  <p className="text-[11px] text-gray-500 leading-snug">
                    Saisissez un pseudonyme pour que vos amis voient les plats que vous ajoutez au panier.
                  </p>
                </div>

                <div className="w-full">
                  <input 
                    type="text"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-gray-200 rounded-xl outline-none text-gray-900 text-[12px] font-bold text-center placeholder-gray-400 focus:ring-2 focus:ring-[#E52327] transition"
                    placeholder="Ex: Aminata S. 🍉"
                    value={guestNameInput}
                    onChange={(e) => setGuestNameInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && guestNameInput.trim()) {
                        const name = guestNameInput.trim();
                        setCurrentUserName(name);
                        localStorage.setItem('DODO_USER_NAME', name);
                        setIsJoinModalOpen(false);
                        
                        // Send JOIN announcement
                        try {
                          const channel = new BroadcastChannel(`dodo-shared-cart-${groupOrderCode}`);
                          channel.postMessage({
                            type: 'JOIN',
                            payload: { name }
                          });
                          channel.close();
                        } catch (err) {
                          console.warn("Broadcast err:", err);
                        }
                        
                        showToast(`Bienvenue dans le panier partagé, ${name} ! 🎉`);
                      }
                    }}
                  />
                </div>

                <button
                  type="button"
                  disabled={!guestNameInput.trim()}
                  onClick={() => {
                    const name = guestNameInput.trim();
                    setCurrentUserName(name);
                    localStorage.setItem('DODO_USER_NAME', name);
                    setIsJoinModalOpen(false);
                    
                    // Send JOIN announcement
                    try {
                      const channel = new BroadcastChannel(`dodo-shared-cart-${groupOrderCode}`);
                      channel.postMessage({
                        type: 'JOIN',
                        payload: { name }
                      });
                      channel.close();
                    } catch (err) {
                      console.warn("Broadcast err:", err);
                    }
                    
                    showToast(`Bienvenue dans le panier partagé, ${name} ! 🎉`);
                  }}
                  className="w-full py-2.5 bg-[#E52327] hover:bg-rose-600 disabled:opacity-50 text-white font-black text-xs rounded-xl shadow-md transition active:scale-98"
                >
                  Rejoindre le panier
                </button>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* =======================================================
            SCREEN 1: ANIMATED ONBOARDING FLOW 
            (Splash Screen -> SVG Tutorial Slideshow -> Custom Login/Signup Portal)
            ======================================================= */}
        {currentScreenId === 1 && (
          <div className="absolute inset-0 bg-[#E52327] flex flex-col justify-between overflow-hidden z-[45] text-white">
            
            <AnimatePresence mode="wait">
              {/* ================= ONBOARDING STEP -1: SPLASH ================= */}
              {onboardingStep === -1 && (
                <motion.div 
                  key="splash_screen"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.4 }}
                  className="flex-1 flex flex-col justify-between py-[45px] px-6"
                >
                  <div className="flex-1 flex flex-col items-center justify-center -mt-6">
                    {/* Bounding container with soft floating animation */}
                    <motion.div 
                      initial={{ scale: 0.85, rotate: -4 }}
                      animate={{ 
                        scale: 1, 
                        rotate: 0,
                        y: [0, -6, 0]
                      }}
                      transition={{ 
                        type: "spring",
                        stiffness: 140,
                        damping: 12,
                        y: {
                          repeat: Infinity,
                          duration: 4,
                          ease: "easeInOut"
                        }
                      }}
                      className="relative mb-2 cursor-pointer"
                      onClick={() => showToast("La marmite s'anime de saveurs ! 🍲")}
                    >
                      <DodoLogo size={180} withText={false} withContainer={true} animated={true} contourColor="#EAB308" />
                    </motion.div>
                    
                    {/* Title with staggered reveal - tightly spaced right below logo */}
                    <motion.h1 
                      initial={{ letterSpacing: "-8px", opacity: 0 }}
                      animate={{ letterSpacing: "-2px", opacity: 1 }}
                      transition={{ type: "spring", stiffness: 100, delay: 0.3 }}
                      className={`font-black tracking-tighter text-white leading-none font-sans ${config.appName.length > 12 ? 'text-[36px]' : config.appName.length > 8 ? 'text-[45px]' : 'text-[64px]'}`}
                    >
                      {config.appName}
                    </motion.h1>

                    <motion.p 
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5, duration: 0.6 }}
                      className="text-[14px] font-bold text-amber-100 mt-2 text-center max-w-[270px] leading-relaxed"
                    >
                      Le goût authentique du Faso, livré chaud chez vous 🇧🇫
                    </motion.p>
                  </div>

                  <div className="flex flex-col items-center gap-6 w-full">
                    {/* Pulsing indicator dots */}
                    <div className="flex items-center gap-1.5 justify-center py-2">
                      <span className="w-2 h-2 rounded-full bg-white opacity-40 animate-pulse"></span>
                      <span className="w-2 h-2 rounded-full bg-white opacity-70 animate-pulse delay-75"></span>
                      <span className="w-2 h-2 rounded-full bg-white animate-pulse delay-150"></span>
                    </div>
                    
                    <motion.button 
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.7, type: "spring", stiffness: 150 }}
                      id="enter_app_btn"
                      onClick={() => setOnboardingStep(0)}
                      className="w-full h-[54px] bg-white text-[#E52327] rounded-[18px] font-black text-[15px] shadow-xl hover:bg-amber-50 active:scale-[0.98] transition-all flex items-center justify-center gap-2 group cursor-pointer"
                    >
                      Découvrir nos maquis
                      <ChevronRight className="w-5 h-5 text-[#E52327] stroke-[2.5] group-hover:translate-x-1 transition-transform" />
                    </motion.button>
                  </div>
                </motion.div>
              )}

              {/* ================= ONBOARDING STEPS 0, 1, 2: ANIMATED SVG SLIDE SHOW ================= */}
              {(onboardingStep >= 0 && onboardingStep <= 2) && (
                <motion.div 
                  key={`tutorial_slide_${onboardingStep}`}
                  initial={{ opacity: 0, x: 100 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -100 }}
                  transition={{ type: "spring", stiffness: 180, damping: 18 }}
                  className="flex-grow flex flex-col justify-between py-[40px] px-6 text-white h-full"
                >
                  {/* Tutorial Header */}
                  <div className="flex items-center justify-between">
                    <button 
                      onClick={() => setOnboardingStep(prev => prev - 1)}
                      className="text-white/60 hover:text-white p-2 text-xs font-bold transition flex items-center gap-1"
                    >
                      <ArrowLeft className="w-4 h-4" /> Retour
                    </button>
                    <button 
                      onClick={() => setOnboardingStep(3)}
                      className="bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-full text-xs font-black tracking-wide uppercase transition"
                    >
                      Passer
                    </button>
                  </div>

                  {/* SVG Animated Illustration Stage */}
                  <div className="flex-1 flex flex-col items-center justify-center my-6">
                    <div className="w-[200px] h-[200px] bg-white/5 border border-white/10 rounded-[40px] flex items-center justify-center p-4 relative shadow-inner overflow-hidden">
                      
                      {/* Interactive background shapes */}
                      <div className="absolute inset-0 bg-radial from-white/10 to-transparent pointer-events-none" />

                      {/* Animated SVG Illustrative Scenes */}
                      {onboardingStep === 0 && (
                        <svg viewBox="0 0 200 200" className="w-[150px] h-[150px]" fill="none" xmlns="http://www.w3.org/2000/svg">
                          {/* Animated Platter / Container */}
                          <motion.path 
                            d="M20 140 C20 120, 180 120, 180 140 M40 140 L160 140" 
                            stroke="#FFFFFF" 
                            strokeWidth="8" 
                            strokeLinecap="round"
                            initial={{ pathLength: 0 }}
                            animate={{ pathLength: 1 }}
                            transition={{ duration: 0.8 }}
                          />
                          <ellipse cx="100" cy="144" rx="70" ry="8" fill="#FFFFFF" opacity="0.3" />

                          {/* Floating pieces of cooked chicken / plantain (alloco) */}
                          <motion.g
                            animate={{ 
                              y: [0, -12, 0],
                              rotate: [-5, 8, -5],
                            }}
                            transition={{ 
                              repeat: Infinity, 
                              duration: 3, 
                              ease: "easeInOut" 
                            }}
                          >
                            {/* Drumstick */}
                            <path d="M60 100 C50 85, 75 75, 90 85 C100 90, 102 100, 95 105 Z" fill="#F59E0B" />
                            <rect x="91" y="98" width="18" height="6" transform="rotate(-30 91 98)" fill="#FFFFFF" rx="3" />
                          </motion.g>

                          <motion.g
                            animate={{ 
                              y: [0, -16, 0],
                              rotate: [0, -10, 0]
                            }}
                            transition={{ 
                              repeat: Infinity, 
                              duration: 3.5, 
                              ease: "easeInOut",
                              delay: 0.3
                            }}
                          >
                            {/* Alloco Chunk */}
                            <ellipse cx="130" cy="115" rx="16" ry="10" transform="rotate(25 130 115)" fill="#F97316" />
                            <ellipse cx="130" cy="115" rx="10" ry="5" transform="rotate(25 130 115)" fill="#EAB308" />
                          </motion.g>

                          {/* Steam/Flavor winds */}
                          <motion.g 
                            stroke="#FFFFFF" 
                            strokeWidth="3.5" 
                            strokeLinecap="round" 
                            opacity="0.8"
                            animate={{ y: [0, -10], opacity: [0.8, 0] }}
                            transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                          >
                            <path d="M 85,65 C 80,55 90,45 85,35" />
                            <path d="M 115,70 C 110,60 120,50 115,40" />
                          </motion.g>
                        </svg>
                      )}

                      {onboardingStep === 1 && (
                        <svg viewBox="0 0 200 200" className="w-[150px] h-[150px]" fill="none" xmlns="http://www.w3.org/2000/svg">
                          {/* Firewood logs */}
                          <line x1="60" y1="150" x2="140" y2="135" stroke="#F59E0B" strokeWidth="8" strokeLinecap="round" />
                          <line x1="140" y1="150" x2="60" y2="135" stroke="#F59E0B" strokeWidth="8" strokeLinecap="round" />
                          
                          {/* Dancing Fire Flames layered */}
                          <motion.g
                            animate={{ scale: [1, 1.15, 1], y: [0, -4, 0] }}
                            transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                          >
                            {/* Large Red flame */}
                            <path d="M100 70 C125 100, 130 145, 100 145 C70 145, 75 100, 100 70 Z" fill="#EF4444" />
                          </motion.g>

                          <motion.g
                            animate={{ scale: [1, 1.25, 1], y: [0, -6, 0] }}
                            transition={{ repeat: Infinity, duration: 1.2, ease: "easeInOut", delay: 0.1 }}
                          >
                            {/* Middle Orange flame */}
                            <path d="M100 85 C115 105, 120 140, 100 140 C80 140, 85 105, 100 85 Z" fill="#F97316" />
                          </motion.g>

                          <motion.g
                            animate={{ scale: [1, 1.35, 1] }}
                            transition={{ repeat: Infinity, duration: 0.9, ease: "easeInOut", delay: 0.2 }}
                          >
                            {/* Central Yellow hot flame */}
                            <path d="M100 100 C110 115, 110 135, 100 135 C90 135, 90 115, 100 100 Z" fill="#FBBF24" />
                          </motion.g>

                          {/* Clay Marmite Pot Silhouette */}
                          <motion.g 
                            animate={{ y: [0, -3, 0] }}
                            transition={{ repeat: Infinity, duration: 2.4, ease: "easeInOut" }}
                          >
                            <path d="M70 70 C70 60, 130 60, 130 70 L135 75 C150 90, 150 110, 135 115 L125 118" stroke="#FFFFFF" strokeWidth="6" strokeLinecap="round" />
                            <ellipse cx="100" cy="70" rx="25" ry="6" fill="#FFFFFF" opacity="0.2" />
                            <rect x="73" y="78" width="54" height="24" rx="6" fill="#FFFFFF" />
                            <line x1="83" y1="90" x2="117" y2="90" stroke="#EF4444" strokeWidth="4" strokeLinecap="round" />
                          </motion.g>
                        </svg>
                      )}

                      {onboardingStep === 2 && (
                        <svg viewBox="0 0 200 200" className="w-[150px] h-[150px]" fill="none" xmlns="http://www.w3.org/2000/svg">
                          {/* Map Pin background */}
                          <motion.g
                            animate={{ y: [0, -10, 0] }}
                            transition={{ repeat: Infinity, duration: 2, ease: "easeOut" }}
                          >
                            <circle cx="100" cy="50" r="14" fill="#EF4444" />
                            <path d="M86 50 L100 75 L114 50 Z" fill="#EF4444" />
                            <circle cx="100" cy="50" r="5" fill="#FFFFFF" />
                          </motion.g>

                          {/* Speedy Delivery Scooter */}
                          <motion.g
                            animate={{ 
                              x: [-10, 10, -10],
                              y: [0, -2, 0, 1, 0]
                            }}
                            transition={{ repeat: Infinity, duration: 2.2, ease: "easeInOut" }}
                          >
                            {/* Main Bike Body */}
                            <rect x="70" y="100" width="45" height="15" rx="5" fill="#FFFFFF" />
                            {/* Delivery Dodo red box */}
                            <rect x="55" y="80" width="22" height="22" rx="4" fill="#EF4444" />
                            
                            {/* Rotating wheel representation */}
                            <circle cx="68" cy="116" r="12" stroke="#FFFFFF" strokeWidth="4" />
                            <circle cx="112" cy="116" r="12" stroke="#FFFFFF" strokeWidth="4" />
                            {/* Spokes */}
                            <line x1="56" y1="116" x2="80" y2="116" stroke="#FFFFFF" strokeWidth="2" />
                            <line x1="100" y1="116" x2="124" y2="116" stroke="#FFFFFF" strokeWidth="2" />
                            <line x1="68" y1="104" x2="68" y2="128" stroke="#FFFFFF" strokeWidth="2" />
                            <line x1="112" y1="104" x2="112" y2="128" stroke="#FFFFFF" strokeWidth="2" />
                          </motion.g>

                          {/* Wind drafting lines */}
                          <motion.g
                            stroke="#FFFFFF"
                            strokeWidth="3"
                            strokeLinecap="round"
                            opacity="0.6"
                            animate={{ x: [40, -40] }}
                            transition={{ repeat: Infinity, duration: 1.2, ease: "linear" }}
                          >
                            <line x1="170" y1="90" x2="190" y2="90" />
                            <line x1="150" y1="115" x2="180" y2="115" />
                          </motion.g>
                        </svg>
                      )}

                    </div>

                    {/* Explanatory titles */}
                    <motion.div 
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-center mt-6 space-y-2 px-4"
                    >
                      <h2 className="text-[20px] font-black tracking-tight leading-tight">
                        {onboardingStep === 0 && "Saveurs Locales Uniques"}
                        {onboardingStep === 1 && "Marmites & Tradition"}
                        {onboardingStep === 2 && "Suivi Moto en Direct"}
                      </h2>
                      <p className="text-[13px] text-amber-100 font-medium leading-relaxed max-w-[260px] mx-auto">
                        {onboardingStep === 0 && "Découvrez les spécialités de nos maquis locaux préférés : alloco, babenda, poulet sauté et plus."}
                        {onboardingStep === 1 && "Les meilleures marmites cuites lentement sur braises par nos partenaires pour un goût incomparable."}
                        {onboardingStep === 2 && "Suivez votre livreur dodo à chaque carrefour d'Ouagadougou avec le positionnement GPS en temps réel."}
                      </p>
                    </motion.div>
                  </div>

                  {/* Navigation & Progress Slider indicators */}
                  <div className="space-y-6">
                    {/* Indicators circles */}
                    <div className="flex justify-center gap-2">
                      {[0, 1, 2].map((idx) => (
                        <div 
                          key={idx}
                          className={`h-2.5 rounded-full transition-all duration-300 ${onboardingStep === idx ? 'w-6 bg-white' : 'w-2.5 bg-white/40'}`}
                        />
                      ))}
                    </div>

                    {/* Next CTA button */}
                    <button 
                      onClick={() => setOnboardingStep(prev => prev + 1)}
                      className="w-full h-[52px] bg-white text-[#E52327] rounded-2xl font-black text-[15px] shadow-lg flex items-center justify-center gap-1.5 transition active:scale-[0.98] hover:bg-amber-50 cursor-pointer"
                    >
                      {onboardingStep === 2 ? "Commencer" : "Continuer"}
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              )}

              {/* ================= ONBOARDING STEP 3: DYNAMIC AUTHENTICATION PORTAL (GLOVO DESIGN) ================= */}
              {onboardingStep === 3 && (
                <motion.div 
                   key="auth_portal"
                   initial={{ opacity: 0, scale: 0.95, y: 30 }}
                   animate={{ opacity: 1, scale: 1, y: 0 }}
                   exit={{ opacity: 0, y: -40 }}
                   transition={{ type: "spring", stiffness: 180, damping: 18 }}
                   className="flex-grow flex flex-col justify-between text-gray-800 h-full overflow-hidden bg-white relative"
                >
                  {/* UPPER HALF: Image Section containing the generated hamburger & chef illustration */}
                  <div className="relative h-[250px] w-full shrink-0 overflow-hidden bg-gray-100">
                    <img 
                      src="/src/assets/images/dodo_onboarding_1779400968589.png" 
                      alt="Bienvenue chez Dodo"
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        // Fallback in case of absolute path mismatch
                        (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1544025162-d76694265947?w=600&auto=format&fit=crop&q=80";
                      }}
                    />
                    
                    {/* Shadow overlay fading into the bottom red card */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/15" />

                    {/* Left: Back Arrow to escape current stage */}
                    <div className="absolute top-4 left-4 z-25">
                      <button
                        onClick={() => {
                          if (authSubStep > 0) {
                            setAuthSubStep(prev => prev - 1);
                          } else {
                            setOnboardingStep(2);
                          }
                        }}
                        className="w-8 h-8 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center transition"
                      >
                        <ArrowLeft className="w-4 h-4 text-white stroke-[2.5]" />
                      </button>
                    </div>

                    {/* Upper Right: GLOVO signature 'Passer' skip button */}
                    <div className="absolute top-4 right-4 z-20">
                      <button 
                        onClick={() => {
                          showToast(language === 'fr' ? "En tant qu'invité ! 🇧🇫" : "Logged as Guest ! 🇧🇫");
                          changeScreen(2);
                        }}
                        className="bg-black/80 hover:bg-black text-white px-4 h-8 rounded-full text-xs font-black tracking-wide flex items-center justify-center transition backdrop-blur-xs active:scale-95 shadow-md shadow-black/20 font-sans cursor-pointer"
                      >
                        {language === 'fr' ? 'Passer' : 'Skip'}
                      </button>
                    </div>
                  </div>

                  {/* LOWER HALF: Vibrant Bright Red Card Section */}
                  <div className="bg-[#E52327] rounded-t-[32px] -mt-5 pt-5 pb-6 px-5 relative z-10 flex flex-col flex-grow text-white shadow-2xl space-y-3.5 select-none overflow-y-auto no-scrollbar">
                    
                    {/* Header welcome message */}
                    <div className="text-center">
                      <h2 className="font-extrabold text-[24px] tracking-tight text-white leading-tight font-sans">
                        {language === 'fr' ? 'Bienvenue' : 'Welcome'}
                      </h2>
                      <p className="text-[12px] text-rose-150 font-medium">
                        {authContactType === 'telephone' 
                          ? (language === 'fr' ? "Commençons par votre numéro de téléphone" : "Let's start with your phone number")
                          : (language === 'fr' ? "Saisissez votre adresse e-mail" : "Enter your email address")
                        }
                      </p>
                    </div>

                    {/* Mode selector: Connexion vs Inscription */}
                    <div className="bg-[#B3171B]/50 p-1 rounded-full flex text-xs relative select-none">
                      <button 
                        type="button"
                        onClick={() => { setAuthMode('login'); setAuthSubStep(0); }}
                        className={`flex-1 text-center py-2 font-black text-[10.5px] rounded-full transition-all duration-300 relative ${
                          authMode === 'login' ? 'bg-white text-[#E52327] shadow-sm' : 'text-rose-100 hover:text-white'
                        }`}
                      >
                        {language === 'fr' ? 'Connexion' : 'Login'}
                      </button>
                      <button 
                        type="button"
                        onClick={() => { setAuthMode('register'); setAuthSubStep(0); }}
                        className={`flex-1 text-center py-2 font-black text-[10.5px] rounded-full transition-all duration-300 relative ${
                          authMode === 'register' ? 'bg-white text-[#E52327] shadow-sm' : 'text-rose-100 hover:text-white'
                        }`}
                      >
                        {language === 'fr' ? 'Inscription' : 'Sign Up'}
                      </button>
                    </div>

                    {/* Role selector Client/Livreur/Vendeur */}
                    <div className="space-y-1">
                      <label className="text-[9px] font-black uppercase text-rose-200 tracking-wider block text-center mb-1">
                        {language === 'fr' ? "Je souhaite m'identifier comme :" : "I want to log in as :"}
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        <button
                          type="button"
                          onClick={() => { setAuthRole('client'); setAuthSubStep(0); }}
                          className={`py-2 px-1 rounded-xl flex flex-col items-center justify-center gap-1 border transition-all duration-200 ${
                            authRole === 'client' 
                              ? 'bg-white border-white text-[#E52327] shadow-sm font-black' 
                              : 'bg-[#B3171B]/30 border-white/20 text-rose-100 hover:bg-[#B3171B]/40 font-bold'
                          }`}
                        >
                          <User className="w-4 h-4" />
                          <span className="text-[10px] tracking-tight">Client</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => { setAuthRole('livreur'); setAuthSubStep(0); }}
                          className={`py-2 px-1 rounded-xl flex flex-col items-center justify-center gap-1 border transition-all duration-200 ${
                            authRole === 'livreur' 
                              ? 'bg-white border-white text-[#E52327] shadow-sm font-black' 
                              : 'bg-[#B3171B]/30 border-white/20 text-rose-100 hover:bg-[#B3171B]/40 font-bold'
                          }`}
                        >
                          <Navigation className="w-4 h-4 rotate-45" />
                          <span className="text-[10px] tracking-tight">{language === 'fr' ? 'Livreur' : 'Rider'}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => { setAuthRole('vendeur'); setAuthSubStep(0); }}
                          className={`py-2 px-1 rounded-xl flex flex-col items-center justify-center gap-1 border transition-all duration-200 ${
                            authRole === 'vendeur' 
                              ? 'bg-white border-white text-[#E52327] shadow-sm font-black' 
                              : 'bg-[#B3171B]/30 border-white/20 text-rose-100 hover:bg-[#B3171B]/40 font-bold'
                          }`}
                        >
                          <Building className="w-4 h-4" />
                          <span className="text-[10px] tracking-tight">{language === 'fr' ? 'Vendeur' : 'Vendor'}</span>
                        </button>
                      </div>
                    </div>

                    {/* Multi-step progress tracker for registration */}
                    {authMode === 'register' && authRole !== 'client' && (
                      <div className="py-1.5 bg-[#B3171B]/40 border border-white/10 rounded-xl px-3 flex items-center justify-between text-[10.5px] text-white select-none">
                        <span className="font-bold">
                          {authRole === 'vendeur' && (
                            language === 'fr' 
                              ? `Étape ${authSubStep + 1}/3 : ${authSubStep === 0 ? 'Moi' : authSubStep === 1 ? 'Boutique' : 'Vérification KYC'}`
                              : `Step ${authSubStep + 1}/3 : ${authSubStep === 0 ? 'Me' : authSubStep === 1 ? 'Store' : 'KYC Verification'}`
                          )}
                          {authRole === 'livreur' && (
                            language === 'fr' 
                              ? `Étape ${authSubStep + 1}/2 : ${authSubStep === 0 ? 'Informations' : 'Sécurité KYC'}`
                              : `Step ${authSubStep + 1}/2 : ${authSubStep === 0 ? 'Details' : 'KYC Documents'}`
                          )}
                        </span>
                        <div className="flex gap-1">
                          {Array.from({ length: authRole === 'vendeur' ? 3 : 2 }).map((_, stepIdx) => (
                            <div 
                              key={stepIdx} 
                              className={`w-3.5 h-1.5 rounded-full transition-all ${stepIdx <= authSubStep ? 'bg-white' : 'bg-white/30'}`} 
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Dynamic Auth fields form exactly styled */}
                    <form 
                      onSubmit={(e) => {
                        e.preventDefault();

                        // Form validations
                        if (authContactType === 'telephone' && authPhone.length < 8) {
                          showToast(language === 'fr' ? "Erreur : Numéro à 8 chiffres requis." : "Error: 8 digit phone is required.");
                          return;
                        }
                        if (authContactType === 'email' && !authEmail.includes('@')) {
                          showToast(language === 'fr' ? "Erreur : Adresse email incorrecte." : "Error: Invalid email format.");
                          return;
                        }
                        if (authMode === 'register' && !authName) {
                          showToast(language === 'fr' ? "Erreur : Nom complet requis." : "Error: Full name is required.");
                          return;
                        }

                        // Multisteps Logic
                        if (authMode === 'register') {
                          if (authRole === 'vendeur' && authSubStep === 0) {
                            if (!authAge || parseInt(authAge) < 18) {
                              showToast(language === 'fr' ? "Erreur : Vous devez être majeur (18+)." : "Error: You must be over 18.");
                              return;
                            }
                            if (!authAdresse) {
                              showToast(language === 'fr' ? "Erreur : Votre adresse est requise." : "Error: Address is required.");
                              return;
                            }
                            setAuthSubStep(1);
                            showToast(language === 'fr' ? "Saisissez les infos de votre établissement" : "Enter business establishment details");
                            return;
                          }
                          if (authRole === 'vendeur' && authSubStep === 1) {
                            if (!authCompanyNom || !authCompanyAdresse) {
                              showToast(language === 'fr' ? "Erreur : Nom & Adresse boutique requis." : "Error: Shop Name & Address required.");
                              return;
                            }
                            setAuthSubStep(2);
                            showToast(language === 'fr' ? "Préparez vos documents de vérification" : "Prepare verification documents");
                            return;
                          }
                          if (authRole === 'vendeur' && authSubStep === 2) {
                            if (!kycSelfiePath || !kycDocPath) {
                              showToast(language === 'fr' ? "Veuillez joindre selfie et document d'identité." : "Please attach selfie and ID doc.");
                              return;
                            }
                          }

                          if (authRole === 'livreur' && authSubStep === 0) {
                            if (!authAdresse) {
                              showToast(language === 'fr' ? "Adresse résidentielle obligatoire." : "Residential address is required.");
                              return;
                            }
                            setAuthSubStep(1);
                            showToast(language === 'fr' ? "Vérification de sécurité KYC requise" : "Verification security KYC required");
                            return;
                          }
                          if (authRole === 'livreur' && authSubStep === 1) {
                            if (!kycSelfiePath || !kycDocPath) {
                              showToast(language === 'fr' ? "Joindre selfie et justificatif d'identité." : "Attach selfie and proof of identity.");
                              return;
                            }
                          }
                        }

                        // Submit
                        setAuthLoading(true);
                        setTimeout(() => {
                          setAuthLoading(false);
                          setAuthSuccess(true);

                          const customName = authName.trim() || profile.name || (authRole === 'vendeur' ? "Chef Faso 🍳" : authRole === 'livreur' ? "Moto Dodo Rapid" : "Client Faso");
                          const customContact = authContactType === 'telephone' ? `+226 ${authPhone}` : authEmail;

                          const updatedPrf = {
                            ...profile,
                            name: customName,
                            phone: authContactType === 'telephone' ? customContact : "+226 75 XX XX XX",
                            email: authContactType === 'email' ? customContact : profile.email || "info@dodo.bf"
                          };
                          setProfile(updatedPrf);
                          saveProfile(updatedPrf);

                          setTimeout(() => {
                            if (authRole === 'vendeur') {
                              showToast(language === 'fr' ? `Chef ${customName}, boutique active ! 🥳` : `Chef ${customName}, shop active! 🥳`);
                            } else if (authRole === 'livreur') {
                              showToast(language === 'fr' ? `Livreur ${customName} connecté ! 🏍️` : `Rider ${customName} connected! 🏍️`);
                            } else {
                              showToast(language === 'fr' ? `Bienvenue sur Dodo, ${customName} ! 🇧🇫` : `Welcome to Dodo, ${customName}! 🇧🇫`);
                            }
                            changeScreen(2);
                          }, 500);
                        }, 1200);

                      }}
                      className="space-y-3"
                    >
                      {/* Sub-form container */}
                      {(authMode === 'login' || authSubStep === 0) && (
                        <div className="space-y-3">
                          
                          {/* Name field (Sign Up only) */}
                          {authMode === 'register' && (
                            <div className="space-y-0.5">
                              <span className="text-[9px] font-bold text-rose-200 uppercase tracking-widest pl-1 block">
                                {language === 'fr' ? 'Nom complet' : 'Full Name'}
                              </span>
                              <div className="relative flex items-center">
                                <span className="absolute left-3 text-rose-200">
                                  <User className="w-4 h-4 stroke-[2.5]" />
                                </span>
                                <input 
                                  type="text"
                                  placeholder={language === 'fr' ? "Ex: Alizèta Ouédraogo" : "Ex: John Doe"}
                                  value={authName}
                                  onChange={(e) => setAuthName(e.target.value)}
                                  className="w-full bg-[#B3171B] border border-white/20 rounded-2xl pl-10 pr-3 py-3 text-xs text-white placeholder-rose-200/60 font-bold focus:outline-none focus:border-white transition"
                                  required
                                />
                              </div>
                            </div>
                          )}

                          {/* Specific Sign up attributes (Age, address, specialize) */}
                          {authMode === 'register' && authRole === 'vendeur' && (
                            <div className="grid grid-cols-2 gap-2">
                              {/* Age */}
                              <div className="space-y-0.5">
                                <span className="text-[9px] font-bold text-rose-200 uppercase tracking-widest pl-1 block">
                                  {language === 'fr' ? 'Âge' : 'Age'}
                                </span>
                                <input 
                                  type="number"
                                  min="18"
                                  max="90"
                                  placeholder="24"
                                  value={authAge}
                                  onChange={(e) => setAuthAge(e.target.value)}
                                  className="w-full bg-[#B3171B] border border-white/20 rounded-2xl px-3 py-3 text-xs text-white placeholder-rose-200/60 font-black focus:outline-none focus:border-white transition"
                                  required
                                />
                              </div>
                              {/* Speciality */}
                              <div className="space-y-0.5">
                                <span className="text-[9px] font-bold text-rose-200 uppercase tracking-widest pl-1 block">Spécialité</span>
                                <select
                                  value={authDomaine}
                                  onChange={(e) => setAuthDomaine(e.target.value)}
                                  className="w-full bg-[#B3171B] border border-white/20 rounded-2xl px-3 py-3 text-xs text-white font-bold focus:outline-none focus:border-white transition appearance-none"
                                  required
                                >
                                  <option value="Cuisinier de maquis">🍗 Maquis</option>
                                  <option value="Chawarmiste">🌯 Fast food</option>
                                  <option value="Pâtissier">🍰 Dessert</option>
                                </select>
                              </div>
                            </div>
                          )}

                          {/* Address attribute (Vendor and Delivery sign up) */}
                          {authMode === 'register' && authRole !== 'client' && (
                            <div className="space-y-0.5">
                              <span className="text-[9px] font-bold text-rose-200 uppercase tracking-widest pl-1 block">Adresse Résidentielle</span>
                              <input 
                                type="text"
                                placeholder="Somgandé, Ouagadougou"
                                value={authAdresse}
                                onChange={(e) => setAuthAdresse(e.target.value)}
                                className="w-full bg-[#B3171B] border border-white/20 rounded-2xl px-3 py-3 text-xs text-white placeholder-rose-200/60 font-bold focus:outline-none focus:border-white transition"
                                required
                              />
                            </div>
                          )}

                          {/* DYNAMIC SENSORY PHONE prefix like the Glovo mockup */}
                          {authContactType === 'telephone' ? (
                            <div className="space-y-0.5">
                              <span className="text-[9px] font-bold text-rose-200 uppercase tracking-widest pl-1 block">
                                {language === 'fr' ? 'Numéro de téléphone' : 'Phone Number'}
                              </span>
                              <div className="flex gap-2">
                                {/* Prefix box exactly matching Glovo layout style */}
                                <div className="bg-[#B3171B] border border-white/10 rounded-2xl px-3.5 py-3 flex flex-col justify-center min-w-[100px] shrink-0">
                                  <span className="text-[8.5px] font-bold text-rose-200/50 uppercase tracking-wider block leading-none mb-0.5">
                                    {language === 'fr' ? 'Préfixe' : 'Prefix'}
                                  </span>
                                  <div className="flex items-center gap-1.5 mt-0.5">
                                    <span className="text-xs">🇧🇫</span>
                                    <span className="text-xs font-black text-white">+226</span>
                                    <ChevronRight className="w-3 h-3 text-rose-200 rotate-90 stroke-[3] ml-1" />
                                  </div>
                                </div>
                                {/* Phone Number Input block */}
                                <div className="flex-grow bg-[#B3171B] border border-white/10 rounded-2xl flex flex-col justify-center px-4 py-1.5 focus-within:border-white transition-all">
                                  <span className="text-[8.5px] font-bold text-rose-200/50 uppercase tracking-wider block leading-none">
                                    {language === 'fr' ? 'Numéro de téléphone' : 'Phone number'}
                                  </span>
                                  <input 
                                    type="tel"
                                    placeholder="65 11 22 33"
                                    value={authPhone}
                                    onChange={(e) => setAuthPhone(e.target.value.replace(/\D/g, "").substring(0, 8))}
                                    className="w-full bg-transparent text-white placeholder-rose-250/25 font-black text-sm tracking-widest focus:outline-none py-1 h-6"
                                    required
                                  />
                                </div>
                              </div>
                            </div>
                          ) : (
                            // Email input block
                            <div className="space-y-0.5">
                              <span className="text-[9px] font-bold text-rose-200 uppercase tracking-widest pl-1 block">
                                {language === 'fr' ? 'Adresse e-mail' : 'Email Address'}
                              </span>
                              <div className="bg-[#B3171B] border border-white/10 rounded-2xl flex flex-col justify-center px-4 py-2 focus-within:border-white transition-all">
                                <span className="text-[8.5px] font-bold text-rose-200/50 uppercase tracking-wider block leading-none">Email</span>
                                <input 
                                  type="email"
                                  placeholder="moussa@dodo.bf"
                                  value={authEmail}
                                  onChange={(e) => setAuthEmail(e.target.value)}
                                  className="w-full bg-transparent text-white placeholder-rose-250/25 font-bold text-sm focus:outline-none py-1 h-6"
                                  required
                                />
                              </div>
                            </div>
                          )}

                          {/* Passcode Block */}
                          <div className="space-y-0.5">
                            <span className="text-[9px] font-bold text-rose-200 uppercase tracking-widest pl-1 block">
                              {language === 'fr' ? 'Code secret (Code PIN)' : 'Passcode (PIN)'}
                            </span>
                            <div className="relative flex items-center">
                              <span className="absolute left-3 text-rose-200">
                                <Shield className="w-4 h-4 stroke-[2.5]" />
                              </span>
                              <input 
                                type="password"
                                placeholder="••••"
                                maxLength={4}
                                value={authPassword}
                                onChange={(e) => setAuthPassword(e.target.value.replace(/\D/g, ""))}
                                className="w-full bg-[#B3171B] border border-white/20 rounded-2xl pl-10 pr-3 py-3 text-sm text-white font-extrabold tracking-widest focus:outline-none focus:border-white transition"
                                required
                              />
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Vendor Register Substep 1 (Shop Info) */}
                      {authMode === 'register' && authRole === 'vendeur' && authSubStep === 1 && (
                        <motion.div 
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="space-y-3"
                        >
                          <div className="space-y-0.5">
                            <span className="text-[9px] font-bold text-rose-200 uppercase tracking-widest pl-1 block">Nom de la boutique</span>
                            <div className="relative flex items-center">
                              <span className="absolute left-3 text-rose-200"><Building className="w-4 h-4" /></span>
                              <input 
                                type="text"
                                placeholder="Chez Awa & Frères 🍲"
                                value={authCompanyNom}
                                onChange={(e) => setAuthCompanyNom(e.target.value)}
                                className="w-full bg-[#B3171B] border border-white/20 rounded-2xl pl-10 pr-3 py-3 text-xs text-white placeholder-rose-200/60 font-bold focus:outline-none focus:border-white transition"
                                required
                              />
                            </div>
                          </div>
                          <div className="space-y-0.5">
                            <span className="text-[9px] font-bold text-rose-200 uppercase tracking-widest pl-1 block">Adresse de la boutique</span>
                            <input 
                              type="text"
                              placeholder="Avenue Babanguida, Ouagadougou"
                              value={authCompanyAdresse}
                              onChange={(e) => setAuthCompanyAdresse(e.target.value)}
                              className="w-full bg-[#B3171B] border border-white/20 rounded-2xl px-3 py-3 text-xs text-white placeholder-rose-200/60 font-bold focus:outline-none focus:border-white transition"
                              required
                            />
                          </div>
                        </motion.div>
                      )}

                      {/* Registration Substep KYC */}
                      {authMode === 'register' && (
                        ((authRole === 'vendeur' && authSubStep === 2) || (authRole === 'livreur' && authSubStep === 1))
                      ) && (
                        <motion.div 
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="space-y-3.5"
                        >
                          {/* Selfie Section */}
                          <div className="bg-[#B3171B]/50 border border-white/10 p-3 rounded-2xl relative">
                            <span className="text-[9px] font-bold text-rose-200 uppercase tracking-widest block mb-2 flex items-center gap-1.5">
                              <Camera className="w-4 h-4 text-white animate-pulse" />
                              1. Photo Selfie Vivant (Requis)
                            </span>
                            <div className="flex items-center gap-3">
                              <div className="w-[58px] h-[58px] bg-[#B3171B]/80 border-2 border-dashed border-white/20 rounded-full overflow-hidden flex items-center justify-center relative shadow-inner">
                                {kycSelfiePath ? (
                                  <img src={kycSelfiePath} alt="Selfie" className="w-full h-full object-cover" />
                                ) : (
                                  <User className="w-5 h-5 text-rose-200/50" />
                                )}
                              </div>
                              <div className="flex-grow">
                                <button
                                  type="button"
                                  onClick={() => {
                                    showToast("Appareil Photo Simulée ! 📸");
                                    setKycSelfiePath("https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop");
                                  }}
                                  className="px-3.5 py-1.5 bg-white text-[#E52327] rounded-xl text-[10px] font-black hover:bg-rose-50 transition shadow-md cursor-pointer"
                                >
                                  {kycSelfiePath ? "Reprendre" : "Prendre Cliché"}
                                </button>
                              </div>
                            </div>
                          </div>

                          {/* Doc ID verification */}
                          <div className="bg-[#B3171B]/50 border border-white/10 p-3 rounded-2xl">
                            <span className="text-[9px] font-bold text-rose-200 uppercase tracking-widest block mb-2">
                              2. Pièce d'identité (CNI / Passeport)
                            </span>
                            {kycDocPath ? (
                              <div className="bg-emerald-500/20 border border-emerald-500/40 rounded-xl p-2.5 flex items-center justify-between text-emerald-200 text-[10px]">
                                <span className="font-extrabold font-mono text-[9px]">Document {kycDocType.toUpperCase()} chargé ✓</span>
                                <button type="button" onClick={() => setKycDocPath(null)} className="underline text-emerald-300">Retirer</button>
                              </div>
                            ) : (
                              <div 
                                onClick={() => {
                                  showToast("Justificatif inséré avec succès !");
                                  setKycDocPath("uploaded_doc.jpg");
                                }}
                                className="border border-dashed border-white/20 rounded-xl p-3 text-center cursor-pointer hover:bg-white/5 transition flex flex-col items-center justify-center"
                              >
                                <Upload className="w-5 h-5 text-white/50 mb-1" />
                                <span className="text-[10px] text-white font-bold">Soumettre le justificatif</span>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}

                      {/* Form Actions (Primary buttons matching Glovo) */}
                      <div className="pt-2">
                        {authLoading ? (
                          <div className="w-full h-[48px] bg-white/10 border border-white/20 rounded-full flex items-center justify-center gap-2 text-white font-black text-xs">
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            <span>Connexion en cours...</span>
                          </div>
                        ) : authSuccess ? (
                          <div className="w-full h-[48px] bg-emerald-500 text-white rounded-full flex items-center justify-center gap-2 font-black text-xs animate-pulse">
                            <Check className="w-5 h-5 stroke-[3]" />
                            <span>Vérifié !</span>
                          </div>
                        ) : (
                          <div className="flex gap-2">
                            {/* Prev button for multisteppers */}
                            {authMode === 'register' && authSubStep > 0 && (
                              <button
                                type="button"
                                onClick={() => setAuthSubStep(prev => prev - 1)}
                                className="h-[48px] px-4 border border-white/30 rounded-full text-white font-bold text-xs"
                              >
                                {language === 'fr' ? 'Retour' : 'Back'}
                              </button>
                            )}
                            
                            {/* Signature Glovo Submit rounded CTA */}
                            <button
                              type="submit"
                              className="flex-grow h-[48px] bg-white text-[#E52327] hover:bg-rose-50 rounded-full font-black text-xs select-none shadow-md hover:shadow-lg transform active:scale-[0.98] transition flex items-center justify-center uppercase font-sans tracking-widest cursor-pointer"
                            >
                              {authMode === 'login' ? (
                                <span>Continuer avec SMS</span>
                              ) : (
                                <span>
                                  {authRole === 'vendeur' && authSubStep < 2 ? "Continuer ➜" : authRole === 'livreur' && authSubStep < 1 ? "Continuer ➜" : "Finaliser Inscription"}
                                </span>
                              )}
                            </button>
                          </div>
                        )}
                      </div>
                    </form>

                    {/* Divider ou avec */}
                    {(config.enableGoogleLogin || config.enableAppleLogin) && (
                      <div className="flex items-center gap-3 text-center py-0.5 font-sans select-none">
                        <div className="h-[0.5px] bg-white/20 flex-1"></div>
                        <span className="text-[10px] text-rose-200 lowercase tracking-wide">
                          {language === 'fr' ? 'ou avec' : 'or with'}
                        </span>
                        <div className="h-[0.5px] bg-white/20 flex-1"></div>
                      </div>
                    )}

                    {/* Social button pill inputs exactly matching Glovo layout */}
                    {(config.enableGoogleLogin || config.enableAppleLogin) && (
                      <div className={`grid ${config.enableGoogleLogin && config.enableAppleLogin ? 'grid-cols-2' : 'grid-cols-1'} gap-3 pb-1`}>
                        {/* Google */}
                        {config.enableGoogleLogin && (
                          <button
                            type="button"
                            onClick={() => {
                              showToast(`Connexion via ${config.googleClientId?.substring(0, 10)}... 🌐`);
                              setAuthLoading(true);
                              setTimeout(() => {
                                setAuthLoading(false);
                                const updatedPrf = { ...profile, name: "Google Faso 🇧🇫" };
                                setProfile(updatedPrf);
                                saveProfile(updatedPrf);
                                showToast(language === 'fr' ? "Bienvenue sur Dodo, Google Faso ! 🥳" : "Welcome, Google Faso! 🥳");
                                changeScreen(2);
                              }, 600);
                            }}
                            className="h-11 bg-white hover:bg-rose-50 text-gray-900 rounded-full flex items-center justify-center gap-2 text-xs font-black transition shadow-sm active:scale-95 cursor-pointer"
                          >
                            <svg className="w-4 h-4" viewBox="0 0 24 24">
                              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22l.81-.63z" />
                              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1C7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                            </svg>
                            <span>Google</span>
                          </button>
                        )}

                        {/* Apple */}
                        {config.enableAppleLogin && (
                          <button
                            type="button"
                            onClick={() => {
                              showToast(`Connexion via App ID ${config.appleClientId?.substring(0, 10)}... 🍏`);
                              setAuthLoading(true);
                              setTimeout(() => {
                                setAuthLoading(false);
                                const updatedPrf = { ...profile, name: "Apple Gourmand 🍎" };
                                setProfile(updatedPrf);
                                saveProfile(updatedPrf);
                                showToast(language === 'fr' ? "Bienvenue sur Dodo, Apple Gourmand ! 🍎" : "Welcome, Apple Gourmand! 🍎");
                                changeScreen(2);
                              }, 600);
                            }}
                            className="h-11 bg-white hover:bg-rose-50 text-gray-900 rounded-full flex items-center justify-center gap-2 text-xs font-black transition shadow-sm active:scale-95 cursor-pointer"
                          >
                            <svg className="w-4 h-4 fill-current text-black" viewBox="0 0 24 24">
                              <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 4.17c.66-.81 1.11-1.93.99-3.06-1 .04-2.21.67-2.93 1.49-.62.69-1.16 1.84-1.01 2.96 1.12.09 2.27-.55 2.95-1.39" />
                            </svg>
                            <span>Apple</span>
                          </button>
                        )}
                      </div>
                    )}

                    {/* Autres méthodes text dropdown selector toggling phone/email */}
                    <div className="text-center">
                      <button
                        type="button"
                        onClick={() => setAuthContactType(authContactType === 'telephone' ? 'email' : 'telephone')}
                        className="inline-flex items-center gap-1.5 text-center text-[10.5px] font-extrabold text-rose-100 hover:text-white transition active:scale-95"
                      >
                        <span>
                          {authContactType === 'telephone' 
                            ? (language === 'fr' ? "Autres méthodes : Email" : "Other actions: Email login") 
                            : (language === 'fr' ? "Autres méthodes : SMS" : "Other actions: SMS login")
                          }
                        </span>
                        <ChevronRight className="w-3.5 h-3.5 rotate-90 stroke-[2.5]" />
                      </button>
                    </div>

                    {/* Footer legalities exactly matched to Glovo */}
                    <div className="text-[9.5px]/1.4 text-rose-200/50 leading-normal text-center pt-2.5 font-medium tracking-wide border-t border-white/10 mt-2 select-none">
                      {language === 'fr' ? (
                        <span>
                          En continuant, vous acceptez automatiquement nos <span className="underline cursor-pointer hover:text-white">Conditions d'utilisation</span>, notre <span className="underline cursor-pointer hover:text-white">Politique de confidentialité</span> et la gestion de vos cookies 🇧🇫
                        </span>
                      ) : (
                        <span>
                          By continuing, you automatically accept our <span className="underline cursor-pointer hover:text-white">Terms of use</span>, <span className="underline cursor-pointer hover:text-white">Privacy Policy</span> and cookies consent 🇧🇫
                        </span>
                      )}
                    </div>

                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            
          </div>
        )}

        {/* =======================================================
            SCREEN 2: ÉCRAN D'ACCUEIL (Home Screen)
            ======================================================= */}
        {currentScreenId === 2 && (
          <div className="flex-1 flex flex-col bg-white overflow-hidden pb-[70px]">
            {/* Scrollable Container with All Mockup-styled Modules */}
            <div className="flex-1 overflow-y-auto no-scrollbar scroll-smooth font-sans pb-24 bg-gray-50/50">
              
              {/* ================= HEADER SECTION (BLACK CHASE) ================= */}
              <div className="bg-[#121212] text-white pt-5 pb-6 px-4 rounded-b-[28px] shadow-lg relative overflow-hidden flex flex-col space-y-5">
                {/* Visual Accent Glows */}
                <div className="absolute top-[-40px] right-[-40px] w-32 h-32 bg-[#E52327]/10 rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute left-[-20px] bottom-[-20px] w-24 h-24 bg-amber-500/5 rounded-full blur-2xl"></div>

                {/* 1. Header Location & Notification Bell */}
                <div className="flex justify-between items-center relative z-10">
                  <div className="relative">
                    <button 
                      id="city_dropdown_btn"
                      onClick={() => setCitySelectorOpen(!citySelectorOpen)}
                      className="flex items-center gap-1.5 text-white/95 font-black hover:text-[#E52327] active:scale-98 transition text-[15px] select-none"
                    >
                      <MapPin className="w-4.5 h-4.5 text-[#E52327] fill-[#E52327]/15" />
                      <span className="truncate max-w-[190px]">{currentCity}</span>
                      <svg className="w-4.5 h-4.5 text-white/60 fill-current mt-0.5" viewBox="0 0 24 24">
                        <path d="M7 10l5 5 5-5z"/>
                      </svg>
                    </button>
                    
                    {/* City selections popup */}
                    {citySelectorOpen && (
                      <div className="absolute left-0 top-8 w-[190px] bg-white rounded-2xl shadow-2xl border border-gray-100 py-1.5 z-50 text-[13.5px] text-gray-800">
                        {['Ouagadougou', 'Bobo-Dioulasso', 'Koudougou', 'Ouahigouya'].map((city) => (
                          <button 
                            key={city}
                            onClick={() => {
                              setCurrentCity(city);
                              setCitySelectorOpen(false);
                              showToast(`Ville changée pour : ${city}`);
                            }}
                            className={`w-full text-left px-4.5 py-2.5 hover:bg-rose-50 hover:text-[#E52327] flex justify-between items-center transition ${currentCity === city ? 'text-[#E52327] font-extrabold bg-rose-50/30' : 'text-gray-700 font-bold'}`}
                          >
                            <span>{city}</span>
                            {currentCity === city && <Check className="w-4.5 h-4.5 text-[#E52327] stroke-[3.5]" />}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Dark-styled Bell Button with Red Spot Indicator */}
                  <button 
                    id="bell_btn"
                    onClick={() => {
                      setNotificationOpen(!notificationOpen);
                      if (!notificationOpen) {
                        markAllNotificationsAsRead();
                      }
                    }}
                    className="relative w-10 h-10 rounded-full bg-white/[0.08] hover:bg-white/[0.14] active:scale-92 flex items-center justify-center transition border border-white/[0.06]"
                  >
                    <Bell className="w-5 h-5 text-white stroke-[2]" />
                    {notifications.filter(n => !n.read).length > 0 && (
                      <span className="absolute top-[3px] right-[3px] w-2.5 h-2.5 rounded-full bg-[#E52327] border-2 border-[#121212] animate-pulse" />
                    )}
                  </button>
                </div>

                {/* 2. Featured Banner (Member Days Style) inside Deep Black Header */}
                {config.memberDaysEnabled && (
                  <div className="flex gap-4 items-center justify-between relative z-10 pt-1.5 text-left">
                    <div className="flex-1 space-y-1.5">
                      <h2 className="text-[23px] font-black tracking-tight text-white leading-none font-sans uppercase">
                        {config.memberDaysTitle || 'Member Days'}
                      </h2>
                      <p className="text-[12.5px] text-white/70 leading-relaxed max-w-[210px] font-medium font-sans">
                        {config.memberDaysSubtitle || "Les plus belles offres sont disponibles jusqu'au 24 mai."}
                      </p>
                      <div className="pt-2">
                        <button 
                          onClick={() => {
                            showToast(`Offres exceptionnelles ${config.memberDaysTitle || 'Member Days'} débloquées ! 🎁`);
                            setSelectedCategory('Plus');
                          }}
                          className="bg-white text-black hover:bg-gray-150 active:scale-95 text-[12px] font-black px-5 py-2.5 rounded-full transition shadow-xl shadow-black/20 font-sans cursor-pointer"
                        >
                          {config.memberDaysButtonText || 'Voir les offres'}
                        </button>
                      </div>
                    </div>

                    {/* Groceries & Meals Shopping Bag Image (Precisely matching the layout crop) */}
                    <div className="w-[130px] h-[105px] relative shrink-0 rounded-2xl overflow-hidden shadow-2xl shadow-black/50 border border-white/5 bg-slate-900">
                      <img 
                        src={config.memberDaysImageUrl || "https://images.unsplash.com/photo-1542838132-92c53300491e?w=300&auto=format&fit=crop&q=80"} 
                        alt="Dodo Basket Groceries" 
                        className="w-full h-full object-cover scale-110 object-center origin-center hover:scale-115 transition duration-500"
                      />
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent p-1.5 text-center">
                        <span className="text-[8.5px] bg-[#E52327] text-white font-black uppercase px-2 py-0.2 rounded-md tracking-wider inline-block">
                          {config.memberDaysBadgeText || 'EXCLUSIF 🇧🇫'}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* ================= NOTIFICATION DRAWER IF OPENED ================= */}
              {notificationOpen && (
                <div className="mx-4 mt-3 bg-gradient-to-b from-slate-900 to-slate-850 border border-slate-800 text-white rounded-2xl p-4 text-xs relative shadow-2xl space-y-3 z-50 font-sans text-left">
                  <div className="flex justify-between items-center pb-2 border-b border-white/[0.08]">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm">🔔</span>
                      <h4 className="font-extrabold text-[12px] uppercase tracking-normal">Centre de notifications</h4>
                      <span className="bg-[#E52327]/20 text-red-300 text-[9px] px-1.5 py-0.5 rounded-full font-black">
                        {notifications.length}
                      </span>
                    </div>
                    <button 
                      onClick={() => setNotificationOpen(false)} 
                      className="text-gray-400 hover:text-white font-black text-base"
                    >
                      ×
                    </button>
                  </div>

                  <div className="space-y-2 max-h-[180px] overflow-y-auto no-scrollbar">
                    {notifications.length === 0 ? (
                      <div className="py-6 text-center text-gray-400 space-y-1">
                        <p className="text-xl">📭</p>
                        <p className="font-bold text-[10.5px]">Aucune notification active</p>
                      </div>
                    ) : (
                      notifications.map((notif) => (
                        <div 
                          key={notif.id} 
                          className={`p-2.5 rounded-xl border transition flex items-start gap-2 ${
                            notif.read ? 'bg-slate-950/40 border-slate-850/45 opacity-70' : 'bg-slate-850/80 border-[#E52327]/30 shadow-xs'
                          }`}
                        >
                          <span className="text-sm mt-0.5">📢</span>
                          <div className="flex-1 min-w-0 text-left">
                            <h5 className="font-black text-white text-[10.5px] truncate">{notif.title}</h5>
                            <p className="text-slate-300 text-[10px] leading-relaxed mt-0.5">{notif.message}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* GPS auto-suggestion was moved to an elegant rich interactive push notification toast layout to clean up user space on home */}

              {/* ================= CATEGORIES ROW (SUBTLE WHITE PILLS WITH SHADOWS & BORDERS) ================= */}
              <div className="px-4 pt-4 text-left">
                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5 select-none">
                  {[
                    { id: 'Plus', label: 'Tout', emoji: '🛍️' },
                    { id: 'Grillades', label: 'Trajets', emoji: '🚗' },
                    { id: 'Riz', label: 'Courses', emoji: '🌙' },
                    { id: 'Soupe', label: 'Épicerie', emoji: '🍿' },
                  ].map((category) => {
                    // Treat 'Plus' as the All category in the first pill slot
                    const isSelected = selectedCategory === category.id;
                    return (
                      <button
                        key={category.id}
                        onClick={() => setSelectedCategory(category.id)}
                        className={`flex items-center gap-1.5 px-4 h-[35px] rounded-full text-[11px] font-black tracking-normal border transition-all shrink-0 ${
                          isSelected 
                            ? 'bg-[#E52327] text-white border-[#E52327] shadow-sm font-black' 
                            : 'bg-white text-gray-800 border-gray-200/90 hover:bg-gray-50'
                        }`}
                      >
                        <span className="text-[13px]">{category.emoji}</span>
                        <span>{category.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* ================= DIETARY SPECIALITY TAG FILTERS ================= */}
              <div className="px-4 pt-3.5 text-left">
                <span className="text-[10px] uppercase font-black tracking-wider text-gray-400 block mb-1.5">Régimes & Préférences</span>
                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 select-none">
                  {[
                    { filterId: null, label: 'Tout 🍽️', color: 'border-gray-200 text-gray-805 bg-white' },
                    { filterId: 'Sans porc', label: 'Sans porc 🐷', color: 'border-pink-200 text-pink-700 bg-pink-50/20' },
                    { filterId: 'Épicé', label: 'Épicé 🌶️', color: 'border-red-200 text-red-650 bg-red-50/20' },
                    { filterId: 'Végétarien', label: 'Végétarien 🥗', color: 'border-emerald-200 text-emerald-700 bg-emerald-50/20' },
                    { filterId: 'Grillades au feu de bois', label: 'Grillades 🔥', color: 'border-amber-200 text-amber-700 bg-amber-50/20' },
                  ].map((pref) => {
                    const isSelected = selectedDietaryFilter === pref.filterId;
                    return (
                      <button
                        key={pref.label || 'all'}
                        onClick={() => {
                          setSelectedDietaryFilter(pref.filterId);
                        }}
                        className={`flex items-center px-3.5 h-[30px] rounded-full text-[10.5px] font-black border transition-all shrink-0 cursor-pointer active:scale-95 ${
                          isSelected 
                            ? 'bg-slate-900 text-white border-slate-900 shadow-xs' 
                            : `${pref.color || 'border-gray-200 bg-white'} hover:bg-gray-150`
                        }`}
                      >
                        {pref.label}
                      </button>
                    );
                  })}
                </div>
              </div>

               {/* ================= CIRCULAR PRODUCT ICON GRILL (MOCKUP STYLING EXACT) ================= */}
              <div className="px-4 pt-4 text-left select-none">
                <div className="flex gap-4 overflow-x-auto no-scrollbar py-1">
                  {[
                    ...(config.memberDaysEnabled ? [{ id: 'Plus', label: config.memberDaysTitle || 'Member Days', emoji: '🪙', color: 'bg-yellow-101 text-yellow-905 border-yellow-250' }] : []),
                    { id: 'Grillades', label: 'Pizzas', emoji: '🍕', color: 'bg-orange-50 text-orange-900 border-orange-100' },
                    { id: 'Riz', label: 'Sushis', emoji: '🍣', color: 'bg-rose-50/80 text-rose-900 border-rose-100' },
                    { id: 'Soupe', label: 'Halal', emoji: '🍗', color: 'bg-amber-50 text-amber-955 border-amber-100' },
                    { id: 'Tô', label: 'Burgers', emoji: '🍔', color: 'bg-orange-50/50 text-orange-955 border-orange-100' }
                  ].map((cat, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setSelectedCategory(cat.id);
                      }}
                      className="flex flex-col items-center space-y-1 shrink-0 transition active:scale-95 cursor-pointer max-w-[62px]"
                    >
                      <div className={`w-[52px] h-[52px] rounded-full flex items-center justify-center text-[22px] shadow-2xs border ${cat.color}`}>
                        {cat.emoji}
                      </div>
                      <span className="text-[10px] text-gray-700 font-bold text-center truncate w-full tracking-tight">{cat.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* ================= SUB-FILTERS PILLS ROW ================= */}
              <div className="px-4 pt-3 text-left">
                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5 select-none">
                  <button 
                    onClick={() => {
                      showToast("Retrait sur place (À emporter) activé ! 🚶");
                    }}
                    className="flex items-center gap-1.5 bg-[#F2F2F7]/80 hover:bg-gray-150 border border-transparent px-3.5 h-[32px] rounded-full text-[11px] font-black text-gray-800 shrink-0"
                  >
                    <span>🚶</span>
                    <span>À emporter</span>
                  </button>
                  <button 
                    onClick={() => {
                      showToast("Affichage des promotions et remises actives! 🏷️");
                    }}
                    className="flex items-center gap-1.5 bg-[#F2F2F7]/80 hover:bg-gray-150 border border-transparent px-3.5 h-[32px] rounded-full text-[11px] font-black text-gray-800 shrink-0"
                  >
                    <span>🏷️</span>
                    <span>Offres</span>
                  </button>
                  <button 
                    onClick={() => {
                      showToast("Filtre prix configuré ! 💸");
                    }}
                    className="flex items-center gap-1 bg-[#F2F2F7]/80 hover:bg-gray-150 border border-transparent px-3.5 h-[32px] rounded-full text-[11px] font-black text-gray-800 shrink-0 select-none"
                  >
                    <span>Prix ∨</span>
                  </button>
                  <button 
                    onClick={() => {
                      showToast("Affichage par frais de livraison triés ! 🏍️");
                    }}
                    className="flex items-center gap-1 bg-[#F2F2F7]/80 hover:bg-gray-150 border border-transparent px-3.5 h-[32px] rounded-full text-[11px] font-black text-gray-800 shrink-0 select-none"
                  >
                    <span>Frais livraison</span>
                  </button>
                </div>
              </div>



              {/* ================= SMALL RESULTS RANKING LABELETTE ================= */}
              <div className="px-5 pt-1.5 text-left">
                <p className="text-[9.5px] text-gray-400 font-bold leading-tight">
                  Découvrez comment les résultats sont classés.{" "}
                  <button 
                    onClick={() => showToast("Les résultats sont ordonnés de façon transparente d'après la géolocalisation, les avis clients et le temps de préparation.")}
                    className="underline text-gray-500 hover:text-[#E52327]"
                  >
                    En savoir plus.
                  </button>
                </p>
              </div>

              {/* ================= "À DECOUVRIR SUR DODO" (UBER EATS DESIGN COPY) ================= */}
              <div className="space-y-2.5 pt-3.5 text-left">
                <div className="px-4 flex justify-between items-center select-none">
                  <div>
                    <h3 className="text-[17px] font-black text-gray-950 tracking-tight font-sans">À découvrir sur Dodo</h3>
                    <p className="text-[9.5px] text-gray-400 font-black tracking-wider uppercase mt-0.5">Sponsorisé</p>
                  </div>
                  <button 
                    onClick={() => {
                      setSelectedCategory('Plus');
                      showToast("Découvrez tous nos maquis d'excellence ! 💫");
                    }}
                    className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 active:scale-95 flex items-center justify-center transition"
                  >
                    <ChevronRight className="w-4.5 h-4.5 text-gray-950 stroke-[3.5]" />
                  </button>
                </div>

                {/* Horizontal scrolling recommended restaurants/maquis */}
                <div className="flex gap-4 overflow-x-auto no-scrollbar px-4 py-1 select-none">
                  {filteredRestaurants.map((rest) => {
                    const isFavorited = favorites.includes(rest.id);
                    return (
                      <div 
                        key={rest.id}
                        onClick={() => {
                          setSelectedRestaurant(rest);
                          changeScreen(3);
                        }}
                        className="w-[205px] bg-white rounded-2xl border border-gray-100/90 shadow-2xs hover:shadow-xs transition shrink-0 overflow-hidden cursor-pointer"
                      >
                        <div className="relative h-[115px] bg-gray-150">
                          <img 
                            src={rest.image_url} 
                            alt={rest.name} 
                            className="w-full h-full object-cover" 
                            referrerPolicy="no-referrer"
                          />
                          {/* 1 acheté = 1 offert badge exactly as Uber layout */}
                          <div className="absolute top-2.5 left-2.5 bg-[#E52327] text-white text-[9.5px] font-black px-2 py-0.5 rounded-md leading-none uppercase select-none tracking-wide shadow-sm">
                            1 acheté = 1 offert
                          </div>
                          
                          {/* Favorite toggle overlay */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleFavorite(rest.id);
                            }}
                            className="absolute top-2.5 right-2.5 w-7 h-7 bg-white/95 rounded-full flex items-center justify-center shadow-xs text-gray-600 hover:text-rose-500"
                          >
                            <Heart className={`w-3.5 h-3.5 ${isFavorited ? 'fill-rose-500 text-rose-500' : 'text-gray-500'}`} />
                          </button>
                        </div>

                        {/* Title & metadata below card */}
                        <div className="p-2.5 text-left space-y-1">
                          <h4 className="font-extrabold text-[13.5px] text-gray-950 truncate leading-tight">{rest.name}</h4>
                          <p className="text-[10.5px] text-gray-500 font-bold truncate">
                            Frais livr : {isDodoPassSubscribed ? "0 ₣ (Pass ✨)" : `${rest.delivery_fee} FCFA`} • {rest.prep_time}
                          </p>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-yellow-500 text-[11px]">★</span>
                            <span className="text-[11px] font-black text-gray-900">{rest.rating}</span>
                            <span className="text-[9px] bg-emerald-50 text-emerald-700 px-1.5 py-0.2 rounded font-black uppercase tracking-wider scale-95 origin-left">
                              #1 Américain
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* ================= "LES MEILLEURS MAQUIS RESTAURANTS DE COMPAGNIE" ================= */}
              <div className="space-y-3.5 pt-4 text-left">
                <div className="px-4 flex justify-between items-center select-none">
                  <h3 className="text-[17px] font-black text-gray-950 tracking-tight font-sans">Les meilleurs Maquis</h3>
                  <button 
                    onClick={() => {
                      setSelectedCategory('Plus');
                      showToast("Tous les maquis ouverts ! 🍲");
                    }}
                    className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 active:scale-95 flex items-center justify-center transition"
                  >
                    <ChevronRight className="w-4.5 h-4.5 text-gray-950 stroke-[3.5]" />
                  </button>
                </div>

                {/* Vertical listing of all nearest restaurants */}
                <div className="px-4 space-y-4">
                  {filteredRestaurants.length > 0 ? (
                    filteredRestaurants.map(rest => {
                      const isFavorited = favorites.includes(rest.id);
                      return (
                        <div 
                          key={rest.id}
                          onClick={() => {
                            setSelectedRestaurant(rest);
                            changeScreen(3);
                          }}
                          className="bg-white rounded-2xl overflow-hidden border border-gray-100/90 shadow-2xs hover:shadow-xs transition duration-200 cursor-pointer flex flex-col"
                        >
                          <div className="relative w-full h-[140px] bg-gray-150">
                            <img 
                              src={rest.image_url} 
                              alt={rest.name} 
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                            {/* Special Promo Badge */}
                            <div className="absolute top-3 left-3 bg-[#E52327] text-white text-[9.5px] font-black px-2 py-0.5 rounded-md leading-none uppercase tracking-wide shadow-xs select-none">
                              Livraison ultra rapide 🏍️
                            </div>
                            
                            {/* Bookmark heart toggle */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleFavorite(rest.id);
                              }}
                              className="absolute top-2.5 right-2.5 w-[32px] h-[32px] bg-white/95 backdrop-blur-xs rounded-full flex items-center justify-center text-gray-600 hover:text-rose-500 shadow-md transition"
                            >
                              <Heart className={`w-4 h-4 ${isFavorited ? 'fill-rose-500 text-rose-500' : 'text-gray-500'}`} />
                            </button>
                            
                            {/* Prep Duration Badge */}
                            <span className="absolute bottom-2.5 left-2.5 bg-black/60 backdrop-blur-xs text-white text-[11px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 shadow-xs select-none">
                              <Clock className="w-3.5 h-3.5 text-white" />
                              {rest.prep_time}
                            </span>
                          </div>

                          <div className="p-3.5 space-y-1">
                            <div className="flex justify-between items-start">
                              <h4 className="text-[15.5px] font-extrabold text-gray-950 tracking-tight">{rest.name}</h4>
                              <div className="flex items-center gap-1 bg-rose-50 px-1.5 py-0.5 rounded text-[11.5px] font-black text-[#E52327]">
                                <Star className="w-3.5 h-3.5 fill-[#E52327] stroke-[1.5]" />
                                <span>{rest.rating}</span>
                              </div>
                            </div>
                            <p className="text-[11.5px] text-gray-500 line-clamp-1">{rest.description}</p>
                            <div className="pt-2 text-[11.5px] text-gray-600 flex items-center justify-between border-t border-gray-50 select-none">
                              <span className="font-extrabold text-[#E52327] uppercase tracking-wide text-[10.5px]">
                                Livraison : {isDodoPassSubscribed ? "0 FCFA (Dodo Pass ✨)" : `${rest.delivery_fee} FCFA`}
                              </span>
                              <span className="text-[10.5px] bg-amber-50 text-amber-900 px-2 py-0.5 rounded-md font-bold">
                                {rest.category}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="py-12 text-center text-gray-500 space-y-2">
                      <Search className="w-8 h-8 mx-auto text-gray-300 stroke-[1.5]" />
                      <p className="text-sm font-semibold">Aucun maquis ou plat correspondant</p>
                      <button onClick={() => { setSelectedCategory('Plus'); setSearchQuery(''); }} className="text-xs text-[#E52327] underline">Réinitialiser les filtres</button>
                    </div>
                  )}
                </div>
              </div>

            </div>
          </div>
        )}

        {/* =======================================================
            SCREEN 3: PAGE RESTAURANT (Chez Fatou, etc)
            ======================================================= */}
        {currentScreenId === 3 && (
          <div className="flex-1 flex flex-col bg-white overflow-hidden pb-[70px]">
            {/* Upper floating headers */}
            <div className="relative w-full h-[185px]">
              <img 
                src={selectedRestaurant.image_url} 
                alt={selectedRestaurant.name}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent"></div>
              
              {/* Toolbar */}
              <div className="absolute top-3.5 left-4 right-4 flex justify-between items-center z-20">
                <button 
                  onClick={() => changeScreen(2)}
                  className="w-[36px] h-[36px] rounded-full bg-white/95 text-gray-900 flex items-center justify-center shadow-md active:scale-90 transition hover:bg-white"
                >
                  <ArrowLeft className="w-4 h-4 stroke-[2.5]" />
                </button>
                <div className="flex gap-2">
                  <button 
                    onClick={() => toggleFavorite(selectedRestaurant.id)}
                    className="w-[36px] h-[36px] rounded-full bg-white/95 text-gray-900 flex items-center justify-center shadow-md active:scale-90 transition hover:text-rose-500 hover:bg-white"
                  >
                    <Heart className={`w-4 h-4 ${favorites.includes(selectedRestaurant.id) ? 'fill-rose-500 text-rose-500' : 'text-gray-600'}`} />
                  </button>
                  <button 
                    onClick={() => showToast("Lien de partage copié dans le presse-papiers ! 🔗")}
                    className="w-[36px] h-[36px] rounded-full bg-white/95 text-gray-900 flex items-center justify-center shadow-md active:scale-90 transition hover:bg-white"
                  >
                    <Share2 className="w-4 h-4 text-gray-600" />
                  </button>
                </div>
              </div>

              {/* Title Overlay Info */}
              <div className="absolute bottom-3.5 left-4 right-4 text-white">
                <div className="flex justify-between items-end">
                  <div>
                    <span className="bg-rose-600 text-white text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded mb-1 inline-block">
                      {selectedCategory === 'Plus' ? 'Maquis populaire' : selectedCategory}
                    </span>
                    <h2 className="text-[20px] font-black tracking-tight drop-shadow-sm">{selectedRestaurant.name}</h2>
                  </div>
                </div>
              </div>
            </div>

            {/* Restaurant Meta Indicators */}
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-white text-[13px] text-gray-600 shrink-0">
              <div className="flex items-center gap-1 font-bold text-gray-950">
                <Star className="w-[18px] h-[18px] fill-[#E52327] text-[#E52327]" />
                <span>{selectedRestaurant.rating}</span>
                <span className="text-gray-400 font-normal">({selectedRestaurant.num_reviews} avis)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="w-[16px] h-[16px] text-[#E52327]" />
                <span className="font-semibold">{selectedRestaurant.prep_time}</span>
              </div>
              <div className="text-rose-600 font-bold flex items-center gap-1.5 justify-center">
                <span>Livraison :</span>
                {isDodoPassSubscribed ? (
                  <span className="text-emerald-600 font-black">0 FCFA avec le Pass ✨</span>
                ) : (
                  <span>{selectedRestaurant.delivery_fee} FCFA</span>
                )}
              </div>
            </div>

            {/* Restaurant Segmented Control Toggles */}
            <div className="flex border-b border-gray-100 bg-white text-[13px] font-bold shrink-0">
              {(['Menu', 'Avis', 'Infos'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setRestaurantActiveTab(tab)}
                  className={`flex-1 text-center py-2.5 transition relative ${
                    restaurantActiveTab === tab ? 'text-[#E52327] border-[#E52327]' : 'text-gray-500'
                  }`}
                >
                  <span>{tab}</span>
                  {restaurantActiveTab === tab && (
                    <motion.div layoutId="rest_active_indicator" className="absolute bottom-0 inset-x-0 h-0.5 bg-[#E52327]" />
                  )}
                </button>
              ))}
            </div>

            {/* Segment Content area */}
            <div className="flex-1 overflow-y-auto no-scrollbar bg-gray-50 p-4">
              
              {/* TAB 1: MENU ITEMS */}
              {restaurantActiveTab === 'Menu' && (
                <div className="space-y-4 pb-12">
                  <h3 className="text-slate-800 text-[14px] font-bold uppercase tracking-wider mb-2">Plats principaux</h3>
                  
                  {/* Select menu items belonging to the selected restaurant */}
                  {menuItems.filter(item => item.restaurant_id === selectedRestaurant.id).map((item) => {
                    const quantityInCart = cart.find(ci => ci.menu_item.id === item.id)?.quantity || 0;
                    const isAvailable = item.is_available !== false;
                    return (
                      <div 
                        key={item.id}
                        className={`bg-white rounded-xl p-3.5 flex gap-3.5 border border-gray-100 shadow-2xs hover:shadow-xs transition relative overflow-hidden ${!isAvailable ? 'opacity-60 bg-gray-50' : ''}`}
                      >
                        <LazyImage 
                          src={item.image_url} 
                          alt={item.name} 
                          className="w-full h-full object-cover"
                          containerClassName="w-[75px] h-[75px] rounded-lg shrink-0"
                          fallbackEmoji="🍲"
                        />
                        <div className="flex-1 flex flex-col justify-between pr-8">
                          <div>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <h4 className="text-[14.5px] font-extrabold text-gray-950 tracking-tight leading-tight">{item.name}</h4>
                              {!isAvailable && (
                                <span className="bg-red-500 text-white text-[9px] font-black px-1.5 py-0.2 rounded-full uppercase leading-none">
                                  Épuisé
                                </span>
                              )}
                            </div>
                            <p className="text-[11.5px] text-gray-400 mt-0.5 leading-snug line-clamp-2">{item.description}</p>
                          </div>
                          <span className="text-[13.5px] font-black text-[#E52327] mt-1.5">{item.price} FCFA</span>
                        </div>

                        {/* Quantity Counter Overlay or Plus Add Button */}
                        <div className="absolute bottom-3.5 right-3.5 flex items-center bg-rose-50 rounded-full select-none">
                          {!isAvailable ? (
                            <span className="text-[10px] uppercase font-bold text-gray-400 px-2 py-1 bg-gray-100 rounded-lg">
                              Indisponible
                            </span>
                          ) : quantityInCart > 0 ? (
                            <div className="flex items-center gap-2 px-1 py-0.5">
                              <button 
                                onClick={() => updateCartQuantity(item.id, -1)}
                                className="w-6 h-6 rounded-full bg-[#E52327] text-white flex items-center justify-center font-bold text-xs"
                              >
                                -
                              </button>
                              <span className="text-xs font-bold text-gray-900 w-4 text-center">{quantityInCart}</span>
                              <button 
                                onClick={() => updateCartQuantity(item.id, 1)}
                                className="w-6 h-6 rounded-full bg-[#E52327] text-white flex items-center justify-center font-bold text-xs"
                              >
                                +
                              </button>
                            </div>
                          ) : (
                            <button 
                              onClick={() => addToCart(item)}
                              className="w-8 h-8 rounded-full bg-[#E52327] hover:bg-rose-700 text-white flex items-center justify-center shadow-lg active:scale-95 transition"
                            >
                              <Plus className="w-4 h-4 stroke-[2.5]" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* TAB 2: REVIEWS (Avis) */}
              {restaurantActiveTab === 'Avis' && (
                <div className="space-y-3.5 pb-8 text-left">
                  {/* Community Reviews Header with CTA to add code review */}
                  <div className="flex justify-between items-center px-0.5">
                    <span className="text-[11px] text-gray-400 font-extrabold uppercase">Avis de la Communauté</span>
                    <button
                      onClick={() => {
                        setIsAddingReview(true);
                        showToast("Simulateur d'avis ouvert 📸");
                      }}
                      className="bg-[#E52327]/10 hover:bg-[#E52327]/20 text-[#E52327] text-[10px] font-black px-3 py-1 rounded-full cursor-pointer select-none"
                    >
                      + Écrire un avis photo
                    </button>
                  </div>

                  {/* Add Review Dialog box inline if active */}
                  {isAddingReview && (
                    <motion.div 
                      initial={{ opacity: 0, y: -10 }} 
                      animate={{ opacity: 1, y: 0 }} 
                      className="bg-slate-50 border-2 border-dashed border-[#E52327]/30 rounded-2xl p-4 space-y-3"
                    >
                      <h4 className="text-[12px] font-black text-slate-800">📸 Racontez votre expérience gustative</h4>
                      <div>
                        <label className="text-[9px] text-gray-400 font-bold uppercase block mb-1">Votre note</label>
                        <div className="flex gap-1.5">
                          {[1, 2, 3, 4, 5].map(num => (
                            <button 
                              key={num} 
                              onClick={() => setNewReviewRating(num)}
                              className="focus:outline-none cursor-pointer"
                            >
                              <Star className={`w-5 h-5 ${num <= newReviewRating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[9px] text-gray-400 font-bold uppercase block mb-1">Cuisiné local éteint</label>
                          <select 
                            value={newReviewDish} 
                            onChange={(e) => {
                              setNewReviewDish(e.target.value);
                              // change preset photo map nicely
                              if (e.target.value.includes('Riz')) {
                                setNewReviewPhoto('https://images.unsplash.com/photo-1604329760661-e71dc83f8f26?w=600&auto=format&fit=crop&q=80');
                              } else if (e.target.value.includes('Poulet')) {
                                setNewReviewPhoto('https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=600&auto=format&fit=crop&q=80');
                              } else if (e.target.value.includes('Tô')) {
                                setNewReviewPhoto('https://images.unsplash.com/photo-1547592180-85f173990554?w=600&auto=format&fit=crop&q=80');
                              } else {
                                setNewReviewPhoto('https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600&auto=format&fit=crop&q=80');
                              }
                            }}
                            className="w-full bg-white border border-gray-250 text-[11px] font-bold h-9 px-2 rounded-xl outline-none"
                          >
                            <option value="Poulet bicyclette rôti 🍗">Poulet bicyclette rôti 🍗</option>
                            <option value="Riz gras savoureux au mouton 🍛">Riz gras savoureux 🍛</option>
                            <option value="Tô chaud sauce gombo 🍲">Tô sauce gombo 🍲</option>
                            <option value="Alloco frit croustillant 🍌">Alloco frit 🍌</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-[9px] text-gray-400 font-bold uppercase block mb-1">Photo sélectionnée (Simulée)</label>
                          <div className="h-9 rounded-xl border border-gray-250 bg-white flex items-center justify-between px-2.5 overflow-hidden">
                            <span className="text-[9.5px] font-bold text-gray-500 truncate">📸 Photo_Plat.png</span>
                            <span className="text-[10px] text-emerald-600 font-black">Prêt ✓</span>
                          </div>
                        </div>
                      </div>

                      <div>
                        <label className="text-[9px] text-gray-400 font-bold uppercase block mb-1">Commentaire</label>
                        <textarea 
                          value={newReviewText} 
                          onChange={(e) => setNewReviewText(e.target.value)}
                          placeholder="Ex: Le poulet était bien épicé et rôti à point !..."
                          className="w-full text-[11.5px] bg-white border border-gray-250 rounded-xl p-2.5 h-16 outline-none resize-none focus:border-[#E52327]"
                        />
                      </div>

                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            if (!newReviewText.trim()) {
                              showToast("Veuillez entrer un commentaire !");
                              return;
                            }
                            setDynamicReviews(prev => [
                              {
                                name: 'Moi (Burkina)',
                                rating: newReviewRating,
                                date: 'À l\'instant',
                                text: newReviewText,
                                dish_name: newReviewDish,
                                photo_url: newReviewPhoto
                              },
                              ...prev
                            ]);
                            setIsAddingReview(false);
                            setNewReviewText('');
                            showToast("Avis communautaire posté avec succès ! 📸🍗");
                          }}
                          className="flex-1 h-9 bg-[#E52327] hover:bg-rose-700 text-white font-extrabold text-[11px] rounded-xl cursor-pointer"
                        >
                          Publier mon avis ✓
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsAddingReview(false)}
                          className="h-9 px-3.5 bg-gray-200 text-gray-750 font-bold text-[11px] rounded-xl cursor-pointer"
                        >
                          Annuler
                        </button>
                      </div>
                    </motion.div>
                  )}

                  {dynamicReviews.map((review, idx) => (
                    <div key={idx} className="bg-white rounded-xl p-3.5 border border-gray-150 shadow-2xs space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="font-extrabold text-[12.5px] text-[#E52327]">{review.name}</span>
                        <span className="text-[9.5px] text-gray-400">{review.date}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="flex gap-0.5">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star key={i} className={`w-3 h-3 ${i < review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'}`} />
                          ))}
                        </div>
                        {review.dish_name && (
                          <span className="bg-slate-50 border border-slate-100 text-[9.5px] font-black tracking-tight text-slate-705 px-2 py-0.2 rounded-full leading-none">
                            🍽️ {review.dish_name}
                          </span>
                        )}
                      </div>
                      <p className="text-[12px] text-gray-650 leading-relaxed font-medium">{review.text}</p>
                      
                      {review.photo_url && (
                        <div className="relative mt-2.5 rounded-xl overflow-hidden max-h-[130px] border border-gray-200 group">
                          <img 
                            src={review.photo_url} 
                            alt={review.dish_name || "Avis plat"} 
                            className="w-full h-[120px] object-cover transition duration-300 group-hover:scale-105" 
                            referrerPolicy="no-referrer" 
                          />
                          <div className="absolute bottom-1.5 left-1.5 bg-slate-900/80 backdrop-blur-xs text-[8.5px] font-extrabold text-white px-2 py-0.5 rounded-md">
                            📷 Photo du membre d'Ouagadougou
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* TAB 3: INFOS */}
              {restaurantActiveTab === 'Infos' && (
                <div className="bg-white rounded-xl p-4 border border-gray-150 space-y-4 shadow-2xs text-[12.5px] text-gray-600">
                  <div>
                    <h4 className="font-extrabold text-black mb-1">Description</h4>
                    <p>{selectedRestaurant.description}</p>
                  </div>
                  <div className="border-t border-gray-100 pt-3">
                    <h4 className="font-extrabold text-black mb-1">Horaires</h4>
                    <p>Lundi - Dimanche : 10h30 - 22h30</p>
                  </div>
                  <div className="border-t border-gray-100 pt-3">
                    <h4 className="font-extrabold text-black mb-1">Adresse</h4>
                    <p>Secteur 13, près des 1200 Logements, Ouagadougou, Burkina Faso</p>
                  </div>
                  <div className="border-t border-gray-100 pt-3">
                    <h4 className="font-extrabold text-black mb-1">Contact</h4>
                    <p className="font-semibold text-rose-600">+226 25 33 44 55</p>
                  </div>
                </div>
              )}

            </div>

            {/* Bottom Sticky Float Cart Trigger Bar */}
            {cartItemCount > 0 && (
              <div className="absolute bottom-[70px] left-0 right-0 px-4 bg-transparent z-40">
                <button
                  id="view_cart_floating_banner"
                  onClick={() => changeScreen(4)}
                  className="w-full h-[52px] bg-[#E52327] hover:bg-rose-700 text-white rounded-xl px-4 flex items-center justify-between shadow-xl hover:scale-102 active:scale-[0.98] transition-all"
                >
                  <div className="flex items-center gap-2">
                    <ShoppingCart className={`w-5 h-5 ${cartShake ? 'animate-shake' : ''}`} />
                    <span className="font-black text-sm uppercase tracking-wide">Voir le panier</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-xs text-rose-100">
                    <span className="font-bold">{cartItemCount} {cartItemCount > 1 ? 'articles' : 'article'}</span>
                    <span className="opacity-40">|</span>
                    <span className="font-black text-sm text-white">{cartSubtotal} FCFA</span>
                  </div>
                </button>
              </div>
            )}
          </div>
        )}

        {/* =======================================================
            SCREEN 4: MON PANIER (Cart Screen)
            ======================================================= */}
        {currentScreenId === 4 && (
          <div className="flex-1 flex flex-col bg-white overflow-hidden pb-[70px]">
            {/* Header */}
            <div className="h-[48px] px-4 border-b border-gray-100 flex items-center justify-between bg-white sticky top-0 z-30 shrink-0">
              <button 
                onClick={() => changeScreen(3)}
                className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center transition"
              >
                <ArrowLeft className="w-4.5 h-4.5 text-gray-900 stroke-[2.5]" />
              </button>
              <h2 className="text-[16px] font-extrabold text-gray-950">Mon panier</h2>
              <button 
                onClick={() => { if (cart.length > 0 && window.confirm("Voulez-vous vider le panier ?")) { updateCart([]); showToast("Panier vidé"); } }}
                className="text-xs text-gray-500 font-semibold"
              >
                Vider
              </button>
            </div>

            {/* Cart list / or empty state */}
            {cart.length > 0 ? (
              <div className="flex-1 overflow-y-auto no-scrollbar p-4 space-y-4">
                
                {/* Store origin details title */}
                <div className="bg-rose-50/50 border border-rose-100/30 rounded-xl px-3 py-2 text-xs flex items-center gap-2 text-rose-800">
                  <div className="w-1.5 h-1.5 rounded-full bg-rose-500"></div>
                  <span>De : <b className="font-bold">{cart[0].menu_item.restaurant_id === 'rest_fatou' ? 'Chez Fatou' : cart[0].menu_item.restaurant_id === 'rest_gout' ? 'Le Bon Goût' : "Saveurs d'Afrique"}</b></span>
                </div>

                {/* ================= SPECIAL UBER EATS COMMANDE GROUPÉE ================= */}
                <div className="bg-gradient-to-r from-red-50 to-rose-50 border border-red-100/40 rounded-2xl p-3.5 text-left space-y-2.5">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <Users className="w-4.5 h-4.5 text-[#E52327]" />
                      <span className="text-xs font-black text-gray-950 uppercase tracking-tight font-sans">Panier Partagé / Commande Groupée</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        if (isGroupOrderActive) {
                          setIsGroupOrderActive(false);
                          setGroupMembers([]);
                          showToast("Panier partagé désactivé");
                        } else {
                          const selfName = `${currentUserName} (Moi)`;
                          const updatedCart = cart.map(it => ({
                            ...it,
                            addedBy: it.addedBy || selfName
                          }));
                          
                          setIsGroupOrderActive(true);
                          const code = `DODO-GRP-${Math.floor(100 + Math.random() * 900)}`;
                          setGroupOrderCode(code);
                          
                          // Initialize owner member
                          const selfTotal = updatedCart.reduce((acc, it) => it.addedBy === selfName ? acc + it.menu_item.price * it.quantity : acc, 0);
                          const selfCount = updatedCart.reduce((acc, it) => it.addedBy === selfName ? acc + it.quantity : acc, 0);
                          
                          setGroupMembers([
                            { name: selfName, itemsCount: selfCount, total: selfTotal }
                          ]);
                          
                          updateCart(updatedCart, [
                            { name: selfName, itemsCount: selfCount, total: selfTotal }
                          ]);
                          
                          // Set state
                          showToast("Panier partagé activé ! Copiez le lien pour inviter vos amis 👥");
                        }
                      }}
                      className={`text-[10px] font-black px-3 py-1.5 rounded-xl border transition cursor-pointer select-none active:scale-95 ${isGroupOrderActive ? 'bg-[#E52327] border-transparent text-white' : 'bg-white border-gray-200 text-[#E52327]'}`}
                    >
                      {isGroupOrderActive ? 'Fermer' : 'Lancer'}
                    </button>
                  </div>

                  {isGroupOrderActive && (
                    <div className="text-[11.5px] space-y-2.5 pt-2 border-t border-rose-100/50">
                      <div className="flex justify-between items-center text-[10px] bg-white p-2 border border-gray-150 rounded-xl">
                        <div className="flex-1 overflow-hidden pr-2 text-left">
                          <span className="text-gray-500 font-extrabold block uppercase tracking-wide text-[8px]">Lien de partage unique</span>
                          <span className="font-mono text-gray-800 text-[10px] font-black block truncate">
                            {window.location.origin}{window.location.pathname}?sharedCartId={groupOrderCode}
                          </span>
                        </div>
                        <button 
                          type="button" 
                          onClick={() => {
                            const fullUrl = `${window.location.origin}${window.location.pathname}?sharedCartId=${groupOrderCode}`;
                            try {
                              navigator.clipboard.writeText(fullUrl);
                              showToast("Lien partagé copié ! 🔗");
                            } catch (err) {
                              const textArea = document.createElement("textarea");
                              textArea.value = fullUrl;
                              document.body.appendChild(textArea);
                              textArea.select();
                              document.execCommand("copy");
                              document.body.removeChild(textArea);
                              showToast("Lien partagé copié ! 🔗");
                            }
                          }} 
                          className="bg-[#E52327] hover:bg-rose-600 font-black text-white px-2 py-1.5 rounded-lg text-[9px] active:scale-95 shrink-0"
                        >
                          Copier
                        </button>
                      </div>
                      
                      <div className="space-y-1.5 bg-white/80 p-2.5 rounded-xl border border-rose-100/30">
                        <span className="font-black text-[10px] uppercase text-gray-400 block tracking-wide text-left">Membres du groupe :</span>
                        {groupMembers.map((m, i) => (
                          <div key={i} className="flex justify-between items-center text-gray-700">
                            <span className="font-bold">👥 {m.name}</span>
                            <span className="font-mono text-[11px] font-black">{m.itemsCount} article(s) • <b className="text-gray-900">{m.total} F</b></span>
                          </div>
                        ))}
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          const names = ["Aminata S.", "Inoussa", "Cheick O.", "Salamata K."];
                          const randomName = names[Math.floor(Math.random() * names.length)];
                          const newMemberName = `${randomName} (Ami)`;
                          
                          // Pick random menu item
                          const currentRestId = cart[0]?.menu_item.restaurant_id || 'rest_fatou';
                          const possibleItems = menuItems.filter(item => item.restaurant_id === currentRestId);
                          const randomItem = possibleItems[Math.floor(Math.random() * possibleItems.length)] || menuItems[0];
                          
                          // Add to actual cart state
                          const existIndex = cart.findIndex(it => it.menu_item.id === randomItem.id && it.addedBy === newMemberName);
                          let nextCart;
                          if (existIndex > -1) {
                            nextCart = cart.map((it, idx) => idx === existIndex ? { ...it, quantity: it.quantity + 1 } : it);
                          } else {
                            nextCart = [...cart, { menu_item: randomItem, quantity: 1, addedBy: newMemberName }];
                          }
                          
                          updateCart(nextCart);
                          showToast(`${randomName} a ajouté "${randomItem.name}" au panier groupé ! 🥳`);
                        }}
                        className="w-full h-[32px] bg-white hover:bg-rose-50 text-gray-700 hover:text-[#E52327] font-black border border-dashed border-[#E52327]/30 rounded-xl flex items-center justify-center gap-1 transition text-[10.5px] cursor-pointer"
                      >
                        👥 Simuler l'ajout d'un ami
                      </button>
                    </div>
                  )}
                </div>

                {/* ================= UBER EATS DELIVERY PRE-ORDER SCHEDULER ================= */}
                <div className="bg-white rounded-2xl p-3.5 border border-gray-150 text-left space-y-2.5">
                  <span className="text-[12px] font-black text-slate-900 uppercase tracking-tight block font-sans">Planification de la livraison</span>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setDeliveryMode('now');
                        showToast("Livraison express immédiate ! ⚡");
                      }}
                      className={`h-9 rounded-xl font-black text-[10.5px] border transition flex items-center justify-center gap-1.5 cursor-pointer select-none active:scale-95 ${deliveryMode === 'now' ? 'bg-slate-950 border-slate-950 text-white' : 'bg-gray-50 border-gray-150 text-gray-500 hover:bg-gray-100'}`}
                    >
                      <Zap className="w-3.5 h-3.5" /> Express (25-35 min)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setDeliveryMode('scheduled');
                        showToast("Planification activée ! Choisissez l'heure 📅");
                      }}
                      className={`h-9 rounded-xl font-black text-[10.5px] border transition flex items-center justify-center gap-1.5 cursor-pointer select-none active:scale-95 ${deliveryMode === 'scheduled' ? 'bg-[#E52327] border-transparent text-white' : 'bg-gray-50 border-gray-150 text-gray-500 hover:bg-gray-100'}`}
                    >
                      <Calendar className="w-3.5 h-3.5" /> Planifier pour plus tard
                    </button>
                  </div>
                  
                  {deliveryMode === 'scheduled' && (
                    <div className="flex gap-1.5 overflow-x-auto no-scrollbar py-0.5 select-none pt-1">
                      {[
                        "Ce soir, 19:30", 
                        "Ce soir, 20:30", 
                        "Ce soir, 21:15", 
                        "Demain midi, 12:30",
                        "Demain soir, 19:45"
                      ].map((slot) => {
                        const isActive = scheduledDateTime === slot;
                        return (
                          <button
                            key={slot}
                            type="button"
                            onClick={() => {
                              setScheduledDateTime(slot);
                              showToast(`Livraison planifiée : ${slot}`);
                            }}
                            className={`shrink-0 px-3 h-7 rounded-full text-[10px] font-extrabold border transition cursor-pointer ${isActive ? 'bg-rose-50 border-[#E52327] text-[#E52327]' : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'}`}
                          >
                            {slot}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Items box list */}
                <div className="space-y-3">
                  {cart.map((cartitem) => (
                    <div 
                      key={`${cartitem.menu_item.id}_${cartitem.addedBy || 'default'}`}
                      className="bg-white rounded-xl p-3 border border-gray-150 flex gap-3 relative"
                    >
                      <img 
                        src={cartitem.menu_item.image_url} 
                        alt={cartitem.menu_item.name} 
                        className="w-[60px] h-[60px] rounded-lg object-cover shrink-0"
                        referrerPolicy="no-referrer"
                      />
                      <div className="flex-1 flex flex-col justify-between pr-8">
                        <div>
                          <span className="text-[13.5px] font-black text-gray-900 tracking-tight leading-snug">{cartitem.menu_item.name}</span>
                          <p className="text-[11px] text-[#E52327] font-bold mt-0.5">{cartitem.menu_item.price} FCFA / plat</p>
                        </div>
                        <span className="text-[12px] text-gray-400 font-bold mt-1 font-mono">Total : {cartitem.menu_item.price * cartitem.quantity} FCFA</span>
                      </div>

                      {/* Member Badge indicator */}
                      {isGroupOrderActive && cartitem.addedBy && (
                        <div className="absolute top-2 right-10 bg-rose-50 text-[#E52327] border border-rose-150 text-[9px] font-extrabold px-1.5 py-0.5 rounded-md flex items-center gap-1">
                          <span>👥 {cartitem.addedBy}</span>
                        </div>
                      )}

                      {/* Trash action */}
                      <button 
                        onClick={() => removeFromCart(cartitem.menu_item.id, cartitem.addedBy)}
                        className="absolute top-2.5 right-2 text-gray-400 hover:text-rose-500"
                      >
                        <Trash2 className="w-4 h-4 stroke-[1.8]" />
                      </button>

                      {/* Quantity switcher */}
                      <div className="absolute bottom-2.5 right-2.5 flex items-center bg-[#F2F2F7] rounded-full px-1.5 py-0.5 border border-gray-150">
                        <button 
                          onClick={() => updateCartQuantity(cartitem.menu_item.id, -1, cartitem.addedBy)}
                          className="w-5.5 h-5.5 text-black hover:text-[#E52327] font-black text-[12px] flex items-center justify-center cursor-pointer"
                        >
                          -
                        </button>
                        <span className="text-xs font-black text-gray-950 px-2 w-[16px] text-center font-mono">{cartitem.quantity}</span>
                        <button 
                          onClick={() => updateCartQuantity(cartitem.menu_item.id, 1, cartitem.addedBy)}
                          className="w-5.5 h-5.5 text-black hover:text-[#E52327] font-black text-[12px] flex items-center justify-center cursor-pointer"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* ================= DOUBLE BASKET : ÉPICERIE DE PROXIMITÉ (0 FCFA LIVRAISON) ================= */}
                <div className="bg-slate-50 border border-gray-150 rounded-2xl p-3.5 text-left space-y-2.5">
                  <div className="flex items-center justify-between select-none">
                    <div className="flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-amber-500 fill-amber-500 animate-pulse" />
                      <span className="text-[12px] font-black text-slate-905 uppercase tracking-tight font-sans">Double Panier : Épicerie Dodo</span>
                    </div>
                    <span className="bg-emerald-100 text-emerald-850 text-[8px] font-black tracking-wider uppercase px-2 py-0.5 rounded leading-none">
                      +0 F Livraison 🛵
                    </span>
                  </div>
                  <p className="text-[10px] text-gray-500 font-semibold leading-tight select-none">
                    Économisez sur la livraison ! Ajoutez une boisson fraîche à côté, le livreur la récupère sur son chemin.
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: 'g_coca', name: 'Coca-Cola Glacé 33cl', price: 700, img: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=120&auto=format&fit=crop&q=80' },
                      { id: 'g_sobbra', name: 'Bière Sobbra Fraîche 65cl', price: 1000, img: 'https://images.unsplash.com/photo-1600788886242-5c96aabe3757?w=120&auto=format&fit=crop&q=80' },
                      { id: 'g_lafi', name: 'Eau Lafi Glacée 1.5L', price: 450, img: 'https://images.unsplash.com/photo-1608885898957-a599fb18ec3f?w=120&auto=format&fit=crop&q=80' },
                      { id: 'g_bissap', name: 'Jus Bissap Glacé', price: 600, img: 'https://images.unsplash.com/photo-1595981267035-7b04ec82a897?w=120&auto=format&fit=crop&q=80' }
                    ].map((boisson) => {
                      return (
                        <div key={boisson.id} className="bg-white rounded-xl p-2 border border-gray-150 flex items-center justify-between gap-1 shadow-2xs">
                          <img src={boisson.img} alt={boisson.name} className="w-[34px] h-[34px] rounded-lg object-cover shrink-0" referrerPolicy="no-referrer" />
                          <div className="flex-1 min-w-0 pr-1 text-left">
                            <span className="text-[10px] font-bold text-gray-800 block truncate leading-tight">{boisson.name}</span>
                            <span className="text-[9.5px] font-black text-[#E52327]">{boisson.price} F</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              const extraItem: MenuItem = {
                                id: boisson.id,
                                restaurant_id: cart[0]?.menu_item.restaurant_id || 'rest_fatou',
                                name: `🥤 ${boisson.name}`,
                                price: boisson.price,
                                description: "Supplément Boisson double panier fraîche",
                                image_url: boisson.img,
                                is_available: true,
                                category: 'Boissons'
                              };
                              const existing = cart.find(it => it.menu_item.id === boisson.id);
                              if (existing) {
                                updateCart(cart.map(it => it.menu_item.id === boisson.id ? { ...it, quantity: it.quantity + 1 } : it));
                              } else {
                                updateCart([...cart, { menu_item: extraItem, quantity: 1 }]);
                              }
                              showToast(`Ajouté du magasin à côté : ${boisson.name}! 🥤`);
                            }}
                            className="w-6 h-6 rounded-full bg-rose-50 hover:bg-[#E52327] hover:text-white flex items-center justify-center shrink-0 text-[#E52327] font-black text-xs select-none active:scale-95 transition cursor-pointer"
                          >
                            +
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Additional notes */}
                <div className="space-y-1.5 pt-1">
                  <span className="text-[12px] font-extrabold text-slate-800">Ajouter une note au restaurant</span>
                  <input 
                    type="text" 
                    placeholder="Ex : Pas de piment, merci !" 
                    value={cartNotes}
                    onChange={(e) => setCartNotes(e.target.value)}
                    className="w-full h-[46px] px-3.5 bg-gray-50 border border-gray-150 rounded-xl text-xs placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-[#E52327]/30"
                  />
                </div>

                {/* Codes Promos Form Integration */}
                <div className="bg-slate-50 rounded-xl p-3.5 border border-gray-150 space-y-2 text-left">
                  <span className="text-[12px] font-extrabold text-[#E52327] flex items-center gap-1.5 font-sans">
                    <Ticket className="w-4.5 h-4.5" /> Appliquer un code promo
                  </span>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      placeholder="Ex : FASODODO, DODO20" 
                      value={promoQuery}
                      onChange={(e) => setPromoQuery(e.target.value.toUpperCase())}
                      disabled={!!activeDiscount}
                      className="flex-1 h-[40px] px-3 bg-white border border-gray-200 rounded-lg text-xs font-mono font-black uppercase placeholder-gray-450 focus:outline-none focus:ring-1 focus:ring-[#E52327]/40 disabled:opacity-60"
                    />
                    {activeDiscount ? (
                      <button
                        type="button"
                        onClick={() => {
                          setActiveDiscount(null);
                          setPromoQuery('');
                          showToast("Code promo retiré.");
                        }}
                        className="h-[40px] px-3 bg-rose-100 hover:bg-rose-200 text-[#E52327] rounded-lg text-xs font-extrabold transition"
                      >
                        Retirer
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          if (!promoQuery.trim()) {
                            showToast("Entrez d'abord un code promo !");
                            return;
                          }
                          const found = promoCodes.find(p => p.code.toUpperCase() === promoQuery.trim().toUpperCase());
                          if (!found) {
                            showToast("Code promo inexistant ou erroné ! 👤");
                            return;
                          }
                          if (!found.active) {
                            showToast("Ce code promo n'est plus actif ! ❌");
                            return;
                          }
                          if (cartSubtotal < found.minOrderValue) {
                            showToast(`Commande minimale requise : ${found.minOrderValue} ${config.currencySymbol}!`);
                            return;
                          }
                          
                          const amt = found.discountType === 'percentage' 
                            ? Math.round((cartSubtotal * found.value) / 100)
                            : found.value;
                          
                          setActiveDiscount({ code: found.code, amount: amt });
                          showToast(`Succès ! Réduction de ${amt} ${config.currencySymbol} activée ! 🎉`);
                        }}
                        className="h-[40px] px-4 bg-[#E52327] hover:bg-rose-700 text-white rounded-lg text-xs font-black transition"
                      >
                        Appliquer
                      </button>
                    )}
                  </div>
                  {activeDiscount && (
                    <p className="text-[10.5px] text-emerald-600 font-black animate-pulse flex items-center gap-0.5">
                      ✓ Coupon {activeDiscount.code} actif : -{activeDiscount.amount} {config.currencySymbol} de réduction
                    </p>
                  )}
                </div>

                {/* Dynamique Pourboire Section */}
                <div className="bg-white rounded-xl p-3.5 border border-gray-150 space-y-3.5 text-left">
                  <div className="flex justify-between items-center">
                    <span className="text-[12px] font-black text-rose-600 flex items-center gap-1.5">
                      <DollarSign className="w-4 h-4" /> Pourboire coursier 🏍️
                    </span>
                    <span className="text-[11.5px] font-extrabold text-slate-800 bg-rose-50 px-2 py-0.5 rounded-md">
                      {tipAmount > 0 ? `+${tipAmount} FCFA` : "Optionnel"}
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-500 leading-tight">
                    Soutenez activement votre livreur burkinabè pour son service rapide et soigné. 100% du pourboire lui est reversé.
                  </p>
                  
                  {/* Preset Buttons Grid */}
                  <div className="grid grid-cols-5 gap-1.5 pt-1">
                    {[
                      { label: 'Aucun', val: 'none' },
                      { label: '5%', val: '5%' },
                      { label: '10%', val: '10%' },
                      { label: '15%', val: '15%' },
                      { label: 'Autre', val: 'custom' }
                    ].map((opt) => {
                      const isActive = tipOption === opt.val;
                      return (
                        <button
                          key={opt.val}
                          type="button"
                          onClick={() => {
                            setTipOption(opt.val as any);
                            showToast(opt.val === 'none' ? "Pas de pourboire sélectionné." : `Pourboire ${opt.label} sélectionné ! 👍`);
                          }}
                          className={`py-2 px-0.5 rounded-xl text-[10px] font-black border text-center transition ${
                            isActive 
                              ? 'bg-[#E52327] border-[#E52327] text-white shadow-sm' 
                              : 'bg-white border-gray-200 text-gray-650 hover:bg-gray-50'
                          }`}
                        >
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>

                  {/* Input form for Custom Tip Amount */}
                  {tipOption === 'custom' && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="pt-1 space-y-1 text-xs"
                    >
                      <label className="text-[9px] font-extrabold uppercase text-gray-400 block">Saisir un montant personnalisé (FCFA)</label>
                      <div className="relative">
                        <input
                          type="number"
                          placeholder="Ex: 500, 1000..."
                          value={customTipValue}
                          onChange={(e) => {
                            const val = e.target.value.replace(/[^0-9]/g, '');
                            setCustomTipValue(val);
                          }}
                          className="w-full h-9 pl-3 pr-12 bg-gray-50 border border-gray-150 rounded-xl font-bold text-xs outline-none focus:border-[#E52327]/40"
                        />
                        <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[10px] font-black text-gray-400">FCFA</span>
                      </div>
                    </motion.div>
                  )}
                </div>

                {/* Bill Breakdown summary */}
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-150 space-y-2 text-[13px] text-gray-700">
                  <div className="flex justify-between items-center text-left">
                    <span>Sous-total</span>
                    <span className="font-bold text-gray-950">{cartSubtotal} {config.currencySymbol}</span>
                  </div>
                  <div className="flex justify-between items-center text-left">
                    <span>Frais de livraison</span>
                    <span className="font-bold text-gray-950">{isFreeDelivery ? "Gratuit" : `${deliveryFee} ${config.currencySymbol}`}</span>
                  </div>
                  {config.serviceFee > 0 && (
                    <div className="flex justify-between items-center text-left">
                      <span>Frais de service</span>
                      <span className="font-bold text-gray-900">+{config.serviceFee} {config.currencySymbol}</span>
                    </div>
                  )}
                  {isDodoPassSubscribed && (
                    <div className="flex justify-between items-center text-left text-teal-600 font-extrabold">
                      <span>Remise Dodo Club ✨ (10%)</span>
                      <span className="text-teal-600 font-black">-{isDodoPassSubscribed ? Math.round(cartSubtotal * 0.10) : 0} {config.currencySymbol}</span>
                    </div>
                  )}
                  {activeDiscount && (
                    <div className="flex justify-between items-center text-left text-emerald-600 font-extrabold">
                      <span>Remise Promo ({activeDiscount.code})</span>
                      <span>-{activeDiscount.amount} {config.currencySymbol}</span>
                    </div>
                  )}
                  {tipAmount > 0 && (
                    <div className="flex justify-between items-center text-left text-rose-600 font-black">
                      <span>Pourboire livreur</span>
                      <span>+{tipAmount} {config.currencySymbol}</span>
                    </div>
                  )}
                  <div className="border-t border-gray-200 my-2 pt-2 flex justify-between items-center text-[15px] font-black text-black text-left">
                    <span>Total</span>
                    <span className="text-[#E52327]">{Math.max(0, cartSubtotal + deliveryFee + config.serviceFee - (activeDiscount?.amount || 0) - (isDodoPassSubscribed ? Math.round(cartSubtotal * 0.10) : 0) + tipAmount)} {config.currencySymbol}</span>
                  </div>
                </div>

                {/* Action trigger button */}
                <div className="space-y-3 pt-2">
                  <button
                    id="place_order_btn"
                    onClick={() => setIsCheckoutConfirmOpen(true)}
                    className="w-full h-[52px] bg-[#E52327] hover:bg-rose-700 text-white rounded-xl font-extrabold text-sm uppercase tracking-wide shadow-lg active:scale-[0.98] transition flex items-center justify-center mr-0 cursor-pointer"
                  >
                    Commander • {Math.max(0, cartSubtotal + deliveryFee + config.serviceFee - (activeDiscount?.amount || 0) - (isDodoPassSubscribed ? Math.round(cartSubtotal * 0.10) : 0) + tipAmount)} {config.currencySymbol}
                  </button>
                  <p className="text-[11px] text-center text-gray-400 font-medium tracking-wide">
                    💰 Paiement cash à la livraison
                  </p>
                </div>

              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center px-8 text-center space-y-4">
                <div className="w-[100px] h-[100px] bg-rose-50 rounded-full flex items-center justify-center text-[#E52327]">
                  <ShoppingCart className="w-[50px] h-[50px] stroke-[1.5]" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-gray-900">Votre panier est vide</h3>
                  <p className="text-xs text-gray-500 max-w-[240px] mx-auto mt-1 leading-snug">Sélectionnez les plats succulents de nos maquis partenaires pour l'alimenter.</p>
                </div>
                <button 
                  onClick={() => changeScreen(2)}
                  className="px-6 py-2.5 bg-[#E52327] text-white rounded-xl text-xs font-black shadow-md hover:bg-rose-700 transition"
                >
                  Découvrir les plats
                </button>
              </div>
            )}

            {/* Modal de confirmation de commande customise */}
            <AnimatePresence>
              {isCheckoutConfirmOpen && (
                <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-xs z-[100] flex items-end justify-center">
                  <motion.div
                    initial={{ y: "100%" }}
                    animate={{ y: 0 }}
                    exit={{ y: "100%" }}
                    transition={{ type: "spring", damping: 25, stiffness: 350 }}
                    className="bg-white rounded-t-[32px] w-full max-h-[85%] flex flex-col shadow-2xl relative border-t border-gray-100"
                  >
                    {/* Handle bar */}
                    <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto my-3 shrink-0"></div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto no-scrollbar px-5 pb-6 space-y-4 text-left">
                      
                      <div className="text-center pb-2">
                        <div className="w-12 h-12 rounded-full bg-rose-50 flex items-center justify-center mx-auto mb-2 text-[#E52327]">
                          <ShoppingCart className="w-6 h-6 stroke-[2]" />
                        </div>
                        <h3 className="text-[17px] font-black text-gray-950 tracking-tight">Confirmer votre commande</h3>
                        <p className="text-[11px] text-gray-500 font-medium">Vérifiez les détails avant l'envoi au maquis.</p>
                      </div>

                      {/* Restaurant summary */}
                      <div className="bg-rose-50/50 rounded-2xl p-3 border border-rose-100/30 flex items-center gap-2.5">
                        <div className="p-2 bg-[#E52327] rounded-xl text-white">
                          <Building className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="text-[10px] text-gray-400 block font-bold uppercase tracking-wider">Maquis Partenaire</span>
                          <span className="text-sm font-black text-gray-950">
                            {cart[0]?.menu_item.restaurant_id === 'rest_fatou' ? 'Maquis Chez Fatou 🇧🇫' : cart[0]?.menu_item.restaurant_id === 'rest_gout' ? 'Le Bon Goût 🍳' : "Saveurs d'Afrique 🌍"}
                          </span>
                        </div>
                      </div>

                      {/* Items list summary */}
                      <div className="space-y-2">
                        <span className="text-[11px] text-gray-400 font-extrabold uppercase tracking-wide">Plats commandés</span>
                        <div className="bg-gray-50 rounded-2xl p-3 border border-gray-150 divide-y divide-gray-100 space-y-2">
                          {cart.map((cartitem, idx) => (
                            <div key={cartitem.menu_item.id} className={`flex justify-between items-center text-xs font-bold ${idx > 0 ? 'pt-2' : ''}`}>
                              <div className="flex items-center gap-1.5 text-gray-800">
                                <span className="text-xs bg-gray-200 text-gray-800 px-1.5 py-0.5 rounded-md font-black">x{cartitem.quantity}</span>
                                <span className="font-extrabold text-gray-950 line-clamp-1">{cartitem.menu_item.name}</span>
                              </div>
                              <span className="text-gray-900 shrink-0 font-black">{cartitem.menu_item.price * cartitem.quantity} FCFA</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Deliver details */}
                      <div className="space-y-3">
                        <span className="text-[11px] text-gray-400 font-extrabold uppercase tracking-wide">Adresse de livraison</span>
                        <div className="bg-gray-50 rounded-2xl p-3 border border-gray-150 flex items-start gap-2.5">
                          <MapPin className="w-4 h-4 text-[#E52327] shrink-0 mt-0.5 animate-pulse" />
                          <div>
                            <p className="text-gray-950 font-black text-xs">Ouagadougou (Burkina Faso)</p>
                            <p className="text-[11px] text-gray-500 font-medium">{profile.addresses[0] || '1200 Logements, Ouagadougou'}</p>
                          </div>
                        </div>

                        <span className="text-[11px] text-gray-400 font-extrabold uppercase tracking-wide">Moyen de paiement</span>
                        
                        <div className="space-y-1.5 max-h-[160px] overflow-y-auto pr-1 no-scrollbar">
                          {[
                            'Orange Money',
                            'Moov Money',
                            'Wave',
                            'Telecel Money',
                            'PayPal'
                          ].map((pm) => {
                            const isSelected = checkoutPaymentMethod === pm;
                            return (
                              <button
                                key={pm}
                                type="button"
                                onClick={() => setCheckoutPaymentMethod(pm)}
                                className={`w-full flex items-center justify-between p-2.5 rounded-xl border text-left transition-all ${
                                  isSelected 
                                    ? 'border-red-500 bg-red-50/10 text-red-600 shadow-3xs' 
                                    : 'border-gray-150 bg-white hover:bg-gray-50 text-gray-700'
                                }`}
                              >
                                <div className="flex items-center gap-2.5">
                                  <div className="w-11 h-6 shrink-0 flex items-center justify-center bg-gray-50 border border-gray-100 rounded-lg p-0.5 overflow-hidden">
                                    <PaymentLogoSelector method={pm} size={18} />
                                  </div>
                                  <div>
                                    <p className="text-[11px] font-black text-gray-950 leading-tight">{pm}</p>
                                    <p className="text-[9px] text-gray-400 font-medium leading-none">
                                      Traitement en ligne sécurisé DodoPay
                                    </p>
                                  </div>
                                </div>
                                <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center transition-colors ${
                                  isSelected ? 'border-red-500 bg-red-500 text-white' : 'border-gray-300'
                                }`}>
                                  {isSelected && <div className="w-1 h-1 rounded-full bg-white" />}
                                </div>
                              </button>
                            );
                          })}
                        </div>

                        {cartNotes && (
                          <div className="bg-orange-50/50 border border-orange-100 rounded-xl p-3 flex items-start gap-2">
                            <span className="text-[15px] shrink-0">📝</span>
                            <div>
                              <p className="text-gray-950 font-black text-[11px]">Note au cuisinier</p>
                              <p className="text-[10.5px] text-gray-650 font-medium italic leading-tight">"{cartNotes}"</p>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Totals Breakdown */}
                      <div className="bg-slate-50 rounded-2xl p-4 border border-gray-150 space-y-1.5 text-[12px] font-bold text-gray-650">
                        <div className="flex justify-between items-center text-left">
                          <span>Sous-total plats</span>
                          <span className="text-gray-900">{cartSubtotal} {config.currencySymbol}</span>
                        </div>
                        <div className="flex justify-between items-center text-left">
                          <span>Service de coursier</span>
                          <span className="text-gray-900">{isFreeDelivery ? "Gratuit" : `${deliveryFee} ${config.currencySymbol}`}</span>
                        </div>
                        {config.serviceFee > 0 && (
                          <div className="flex justify-between items-center text-left">
                            <span>Surcharge service</span>
                            <span className="text-gray-900">+{config.serviceFee} {config.currencySymbol}</span>
                          </div>
                        )}
                        {isDodoPassSubscribed && (
                          <div className="flex justify-between items-center text-left text-teal-600 font-extrabold animate-pulse">
                            <span>Remise Club Dodo ✨ (10%)</span>
                            <span className="text-teal-600">-{isDodoPassSubscribed ? Math.round(cartSubtotal * 0.10) : 0} {config.currencySymbol}</span>
                          </div>
                        )}
                        {activeDiscount && (
                          <div className="flex justify-between items-center text-left text-emerald-600 font-extrabold">
                            <span>Remise code promo ({activeDiscount.code})</span>
                            <span>-{activeDiscount.amount} {config.currencySymbol}</span>
                          </div>
                        )}
                        {tipAmount > 0 && (
                          <div className="flex justify-between items-center text-left text-rose-600 font-extrabold">
                            <span>Pourboire livreur</span>
                            <span>+{tipAmount} {config.currencySymbol}</span>
                          </div>
                        )}
                        <div className="border-t border-gray-205 pt-2.5 mt-2 flex justify-between items-center text-[15px] font-black text-gray-950 text-left">
                          <span>Total à payer</span>
                          <span className="text-[#E52327]">{Math.max(0, cartSubtotal + deliveryFee + config.serviceFee - (activeDiscount?.amount || 0) - (isDodoPassSubscribed ? Math.round(cartSubtotal * 0.10) : 0) + tipAmount)} {config.currencySymbol}</span>
                        </div>
                      </div>

                      {/* Action buttons with continuous visual conversion pulse */}
                      <div className="space-y-2 pt-2">
                        <motion.button
                          animate={{
                            scale: [1, 1.025, 1],
                            boxShadow: [
                              "0 4px 6px -1px rgba(229, 35, 39, 0.4), 0 2px 4px -1px rgba(229, 35, 39, 0.2)",
                              "0 10px 15px -3px rgba(229, 35, 39, 0.6), 0 4px 6px -2px rgba(229, 35, 39, 0.4)",
                              "0 4px 6px -1px rgba(229, 35, 39, 0.4), 0 2px 4px -1px rgba(229, 35, 39, 0.2)"
                            ]
                          }}
                          transition={{
                            duration: 1.5,
                            repeat: Infinity,
                            ease: "easeInOut"
                          }}
                          onClick={() => {
                            setIsCheckoutConfirmOpen(false);
                            handleCheckout();
                          }}
                          className="w-full h-[50px] bg-[#E52327] hover:bg-rose-700 text-white rounded-xl font-extrabold text-sm uppercase tracking-wide active:scale-[0.98] transition flex items-center justify-center gap-2"
                        >
                          <span>Confirmer & Commander 🏍️</span>
                        </motion.button>
                        <button
                          onClick={() => setIsCheckoutConfirmOpen(false)}
                          className="w-full h-[46px] bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-xl font-bold text-xs uppercase tracking-wide transition text-center"
                        >
                          Modifier la commande
                        </button>
                      </div>

                    </div>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>

            {/* YengaPay African Gateways Customer Sandbox Checkout visual sheet (Audit 1, 2, 5, 20) */}
            <AnimatePresence>
              {isYengaCheckoutOpen && (
                <div className="absolute inset-0 bg-slate-950/65 backdrop-blur-xs z-[110] flex items-end justify-center">
                  <motion.div
                    initial={{ y: "100%" }}
                    animate={{ y: 0 }}
                    exit={{ y: "100%" }}
                    transition={{ type: "spring", damping: 24, stiffness: 350 }}
                    className="bg-slate-900 border-t border-slate-800 text-white rounded-t-[32px] w-full max-h-[85%] flex flex-col shadow-2xl relative"
                  >
                    {/* Visual drag handle */}
                    <div className="w-12 h-1 bg-slate-700 rounded-full mx-auto my-3 shrink-0"></div>

                    <div className="flex-1 overflow-y-auto no-scrollbar px-5 pb-6 text-left space-y-4">
                      
                      {/* Secure Shield Header */}
                      <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
                        <div className="w-8 h-8 rounded-lg bg-red-600 flex items-center justify-center text-white text-xs font-black">
                          🇧🇫
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-sans font-black text-[12px] text-white tracking-widest uppercase flex items-center gap-1.5 leading-none">
                            YENGA_PAY <span className="text-[7.5px] bg-red-600 text-white px-1 py-0.2 rounded font-black select-none font-mono">SANDBOX</span>
                          </h4>
                          <span className="text-[9px] text-slate-400 block mt-0.5 font-medium leading-none font-sans">Passerelle de paiement unique de l'Afrique de l'Ouest</span>
                        </div>
                        <Shield className="w-4 h-4 text-emerald-400 shrink-0" />
                      </div>

                      {/* Merchant Meta Card */}
                      <div className="p-3 bg-slate-800 rounded-xl border border-slate-700 flex justify-between items-center text-xs">
                        <div>
                          <span className="text-[8px] text-slate-400 block font-black uppercase tracking-wider">BÉNÉFICIAIRE :</span>
                          <span className="font-extrabold text-white">Dodo Express S.A.R.L.</span>
                        </div>
                        <div className="text-right">
                          <span className="text-[8px] text-slate-400 block font-black uppercase tracking-wider">MONTANT TOTAL :</span>
                          <span className="font-black text-[#E52327] font-sans text-xs">
                            {Math.max(0, cartSubtotal + deliveryFee + config.serviceFee - (activeDiscount?.amount || 0) - (isDodoPassSubscribed ? Math.round(cartSubtotal * 0.10) : 0) + tipAmount)} F
                          </span>
                        </div>
                      </div>

                      {/* Operator Badge selection */}
                      <div className="bg-slate-800 border border-slate-700 rounded-xl p-3 text-xs flex items-center gap-3">
                        <div className="w-10 h-[22px] bg-slate-900 border border-slate-700 p-0.5 rounded flex items-center justify-center overflow-hidden shrink-0">
                          <PaymentLogoSelector method={checkoutPaymentMethod} size={15} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-black text-white text-[11px] leading-tight">{checkoutPaymentMethod}</p>
                          <p className="text-[8.5px] text-slate-400 block leading-tight truncate">Réf. transaction : <span className="font-mono text-emerald-400">{yengaTxRef}</span></p>
                        </div>
                      </div>

                      {/* MAIN STEP SCREENS CONTROLLER */}
                      {yengaStep === 'init' && (
                        <div className="space-y-3.5 pt-1 animate-pulse">
                          <div className="text-center py-2 space-y-1">
                            <span className="text-2xl block">💬</span>
                            <h4 className="font-extrabold text-slate-200 text-xs text-center">Paiement en ligne à 2 étapes</h4>
                            <p className="text-[10px] text-slate-400 text-center leading-normal max-w-[280px] mx-auto">
                              L'opérateur {checkoutPaymentMethod} nécessite une authentification OTP à deux facteurs pour sécuriser le débit mobile money.
                            </p>
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              setYengaStep('processing');
                              const otpRes = sendDirectOtpMobileMoney(yengaTxId);
                              if (otpRes.success && otpRes.otp) {
                                setYengaOtpCode(otpRes.otp);
                                setTimeout(() => {
                                  setYengaStep('otp');
                                  showToast(`🔑 Code OTP Mobiles : ${otpRes.otp}`);
                                  addNotification(
                                    "Message OTP YengaPay 🔑",
                                    `Burkina Faso : Saisissez le code secret [ ${otpRes.otp} ] pour valider votre prélèvement Moov Money.`
                                  );
                                }, 1200);
                              } else {
                                setYengaError(otpRes.message);
                                setYengaStep('failed');
                              }
                            }}
                            className="w-full h-11 bg-red-600 hover:bg-slate-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer shadow-md flex items-center justify-center"
                          >
                            🚀 Valider et Recevoir l'OTP de Test
                          </button>
                        </div>
                      )}

                      {yengaStep === 'otp' && (
                        <div className="space-y-4 pt-1">
                          <div className="text-center space-y-1 text-center">
                            <h4 className="font-extrabold text-[#E52327] text-xs text-center">Code OTP Interlocuteur Unique</h4>
                            <p className="text-[10px] text-slate-400 text-center leading-snug">
                              Saisissez le code 4 chiffres envoyé sur le numéro de test <span className="text-emerald-400 font-mono font-bold">{profile.phone || '+226 ** ** 12'}</span> :
                            </p>
                          </div>

                          <div className="flex flex-col items-center gap-1.5 justify-center">
                            <input
                              type="text"
                              maxLength={4}
                              placeholder="----"
                              className="char-code text-center w-[120px] h-11 bg-slate-950 border border-slate-700 text-emerald-400 rounded-xl font-mono text-xl tracking-[10px] pl-[10px] outline-none focus:border-[#E52327] leading-none"
                              value={yengaOtpInput}
                              onChange={(e) => {
                                const sanitized = e.target.value.replace(/[^0-9]/g, '');
                                setYengaOtpInput(sanitized);
                              }}
                            />
                            <span className="text-[8.5px] text-slate-400 leading-tight block text-center">
                              Indice Sandbox : <strong className="font-bold text-emerald-400 font-mono select-all">{yengaOtpCode}</strong>
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              if (!yengaOtpInput.trim()) {
                                showToast("Entrez le code OTP !");
                                return;
                              }
                              setYengaStep('processing');
                              
                              setTimeout(() => {
                                const compRes = completeDirectPayMobileMoney(yengaTxId, yengaOtpInput);
                                if (compRes.success) {
                                  setYengaStep('success');
                                  triggerHaptic();
                                  setTimeout(() => {
                                    setIsYengaCheckoutOpen(false);
                                    changeScreen(5);
                                    // triggers update profile and listings securely
                                    onOrderPlaced();
                                    
                                    // Trigger push lifecycle on newly placed order ref
                                    const ordersItem = localStorage.getItem('DODO_ORDERS');
                                    if (ordersItem) {
                                      const oList = JSON.parse(ordersItem);
                                      // Search for recently queued pending order to trigger its simulated delivery lifecycle
                                      const foundOrder = oList.find((o: any) => o.payment_method === checkoutPaymentMethod && o.status === 'En attente de paiement');
                                      if (foundOrder) {
                                        // Update status to Confirmee first!
                                        foundOrder.status = 'Confirmée';
                                        localStorage.setItem('DODO_ORDERS', JSON.stringify(oList));
                                        simulatePushLifecycle(foundOrder.id, selectedRestaurant.name, foundOrder.order_number);
                                      }
                                    }
                                  }, 1500);
                                } else {
                                  setYengaError(compRes.message);
                                  setYengaStep('failed');
                                }
                              }, 1000);
                            }}
                            className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer shadow-md flex items-center justify-center"
                          >
                            🔒 Confirmer le Paiement Sécurisé
                          </button>
                        </div>
                      )}

                      {yengaStep === 'processing' && (
                        <div className="py-8 text-center space-y-4 text-center">
                          <div className="w-10 h-10 border-4 border-slate-700 border-t-red-600 rounded-full animate-spin mx-auto"></div>
                          <div className="space-y-1 text-center">
                            <p className="text-[11px] font-bold text-slate-200 text-center">Communication serveur YengaPay...</p>
                            <p className="text-[9.5px] text-slate-400 font-medium text-center">Validation anti-fraude, signature HMAC et protection anti-double dépense.</p>
                          </div>
                        </div>
                      )}

                      {yengaStep === 'success' && (
                        <div className="py-6 text-center space-y-3.5 text-center">
                          <div className="w-12 h-12 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-full flex items-center justify-center text-2xl mx-auto shadow-md font-bold">
                            ✓
                          </div>
                          <div className="text-center">
                            <h4 className="font-extrabold text-emerald-400 text-xs uppercase tracking-wider text-center">Acheminement Validé !</h4>
                            <p className="text-[10px] text-slate-400 mt-1 max-w-[240px] mx-auto leading-relaxed text-center">
                              Montant débité avec succès de votre compte. Redirection vers le cockpit pilote Dodo...
                            </p>
                          </div>
                        </div>
                      )}

                      {yengaStep === 'failed' && (
                        <div className="space-y-3 pt-1">
                          <div className="text-center py-2 space-y-2 text-center">
                            <div className="w-11 h-11 bg-red-600/20 text-red-500 border border-red-600/30 rounded-full flex items-center justify-center text-xl mx-auto shadow-sm font-bold">
                              ✕
                            </div>
                            <div className="space-y-1 text-center">
                              <h4 className="font-extrabold text-red-400 text-xs text-center">Paiement non honoré</h4>
                              <p className="text-[9.5px] text-slate-400 leading-snug max-w-[260px] mx-auto text-center">
                               {yengaError || "Une erreur inconnue s'est produite lors de la transaction sécurisée."}
                              </p>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setYengaStep('init');
                                setYengaOtpInput('');
                                setYengaError(null);
                              }}
                              className="h-[40px] bg-slate-800 hover:bg-slate-755 text-white rounded-lg text-[9.5px] font-black uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center"
                            >
                              🔄 Réessayer
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setIsYengaCheckoutOpen(false);
                                showToast("Transaction annulée. Veuillez choisir une autre méthode.");
                              }}
                              className="h-[40px] bg-red-600 hover:bg-rose-700 text-white rounded-lg text-[9.5px] font-black uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center"
                            >
                              ❌ Annuler
                            </button>
                          </div>
                        </div>
                      )}

                    </div>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>

          </div>
        )}

        {/* =======================================================
            SCREEN 5: SUIVI DE COMMANDE (Order Tracking Status)
            ======================================================= */}
        {currentScreenId === 5 && (() => {
          const trackedOrder = orders.find(o => o.order_number === activeTrackingOrderId) || orders[0];
          const trackedStatus = trackedOrder ? trackedOrder.status : 'En route';
          
          const isConfirmedDone = trackedStatus === 'Confirmée' || trackedStatus === 'En préparation' || trackedStatus === 'Prête' || trackedStatus === 'En route' || trackedStatus === 'Livré';
          const isPreparingDone = trackedStatus === 'En préparation' || trackedStatus === 'Prête' || trackedStatus === 'En route' || trackedStatus === 'Livré';
          const isReadyDone = trackedStatus === 'Prête' || trackedStatus === 'En route' || trackedStatus === 'Livré';
          const isOnTheWayDone = trackedStatus === 'En route' || trackedStatus === 'Livré';
          const isDeliveredDone = trackedStatus === 'Livré';

          const steps = [
            { id: 'confirmed', title: 'Commande confirmée', time: trackedOrder?.status_times?.confirmed || '09:41', done: isConfirmedDone, current: trackedStatus === 'Confirmée' },
            { id: 'preparing', title: 'En préparation dans le maquis', time: trackedOrder?.status_times?.preparing !== '--:--' ? trackedOrder?.status_times?.preparing : '--:--', done: isPreparingDone, current: trackedStatus === 'En préparation' },
            { id: 'ready', title: 'Commande prête', time: trackedOrder?.status_times?.ready !== '--:--' ? trackedOrder?.status_times?.ready : '--:--', done: isReadyDone, current: trackedStatus === 'Prête' },
            { id: 'on_the_way', title: 'En cours de livraison (Dodo Express)', time: trackedOrder?.status_times?.on_the_way !== '--:--' ? trackedOrder?.status_times?.on_the_way : '--:--', done: isOnTheWayDone, current: trackedStatus === 'En route' },
            { id: 'delivered', title: 'Plats livrés à domicile', time: trackedStatus === 'Livré' ? 'LIVRÉ' : '--:--', done: isDeliveredDone, current: trackedStatus === 'Livré' },
          ];

          return (
            <div className="flex-1 flex flex-col bg-white overflow-hidden pb-[70px]">
              {/* Header */}
              <div className="h-[48px] px-4 border-b border-gray-100 flex items-center justify-between bg-white sticky top-0 z-30 shrink-0">
                <button 
                  onClick={() => changeScreen(6)}
                  className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center transition"
                >
                  <ArrowLeft className="w-4.5 h-4.5 text-gray-900 stroke-[2.5]" />
                </button>
                <h2 className="text-[15px] font-extrabold text-gray-950">Suivi de commande</h2>
                <button 
                  onClick={() => showToast("Centre d'aide : composez le +22670123456")}
                  className="text-xs text-[#E52327] font-bold"
                >
                  Aide
                </button>
              </div>

              {/* Scrollable layout details container */}
              <div className="flex-1 overflow-y-auto no-scrollbar p-4 space-y-4">
                
                {trackedStatus === 'Annulée' ? (
                  <div className="bg-slate-50 border border-gray-150 rounded-2xl p-6 text-center space-y-4 shadow-3xs my-4 animate-[fade-in_0.3s_ease]">
                    <div className="w-14 h-14 bg-red-50 text-[#E52327] rounded-full flex items-center justify-center text-2.5xl mx-auto border border-red-200">
                      ✕
                    </div>
                    <div>
                      <h3 className="font-extrabold text-slate-900 text-sm">Commande Annulée</h3>
                      <p className="text-[11px] text-gray-400 mt-1.5 leading-relaxed font-semibold">
                        Cette commande <strong className="font-bold text-slate-800">{activeTrackingOrderId}</strong> a été annulée avec succès et votre livreur Blaise K. a été libéré de la livraison.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => changeScreen(6)}
                      className="w-full h-[40px] bg-slate-900 hover:bg-black text-white text-xs font-bold rounded-xl transition uppercase tracking-wider"
                    >
                      Retourner aux commandes
                    </button>
                  </div>
                ) : (
                  <>
                    {/* Order ID Tag Info */}
                    <div className="bg-slate-900 text-white rounded-xl p-3.5 flex justify-between items-center shadow-md relative overflow-hidden">
                      <div className="absolute right-[-10px] top-[-10px] w-16 h-16 bg-[#E52327]/10 rounded-full"></div>
                      <div>
                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Référence</span>
                        <div className="text-[15px] font-black tracking-tight">{activeTrackingOrderId}</div>
                        <div className="text-[11px] text-amber-200 mt-1 flex items-start flex-col gap-0.5 text-left">
                          <div className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
                            Statut : {trackedStatus === 'Confirmée' ? 'Confirmée (Attente Maquis)' : trackedStatus === 'En préparation' ? 'En préparation' : trackedStatus === 'Prête' ? 'Prête pour retrait' : 'En route (Dodo Express)'}
                          </div>
                          {trackedOrder?.is_group_order && (
                            <span className="mt-1 bg-rose-600/60 text-white text-[9px] px-2 py-0.5 rounded font-black tracking-wide inline-flex items-center gap-1 select-none">
                              👥 Commande Groupée
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        {trackedOrder?.delivery_mode === 'scheduled' ? (
                          <>
                            <span className="text-[10px] text-teal-300 font-black block font-sans">🕒 H-DÉPART</span>
                            <span className="text-[11.5px] font-black text-rose-300">{trackedOrder?.scheduled_time}</span>
                          </>
                        ) : (
                          <>
                            <span className="text-[10px] text-gray-400 font-bold block font-sans">ESTIMATION</span>
                            <span className="text-lg font-black text-[#E52327]">20-30 min</span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* LIVE SIMULATED DELIVERY MAP */}
                    <div className="relative w-full h-[190px] rounded-2xl overflow-hidden border border-gray-250 shadow-sm z-0">
                      <DodoLiveGoogleMap
                        simulationProgress={Math.round(driverProgress * 100)}
                        viewMode="client"
                        height="100%"
                        restaurantName={trackedOrder?.restaurant?.name || "Chez Fatou"}
                      />

                      {/* Simulation Control Overlay right inside map (shown only if en_route for realism) */}
                      {trackedStatus === 'En route' && (
                        <div className="absolute top-2.5 right-2.5 bg-white/95 backdrop-blur-xs rounded-xl p-1.5 flex flex-col gap-1.5 border border-gray-150 shadow-xs z-30 shadow-md">
                          <button 
                            onClick={() => setDriverIsSimulating(!driverIsSimulating)}
                            title={driverIsSimulating ? "Pause simulation" : "Démarrer simulation"}
                            className="w-7 h-7 rounded-lg bg-rose-50 text-[#E52327] hover:bg-rose-100 flex items-center justify-center transition active:scale-90"
                          >
                            {driverIsSimulating ? (
                              <span className="text-[9px] font-bold text-[#E52327]">PAUSE</span>
                            ) : (
                              <Play className="w-3.5 h-3.5 fill-current text-[#E52327]" />
                            )}
                          </button>
                          <button 
                            onClick={() => { setDriverProgress(0.1); setDriverIsSimulating(true); }}
                            title="Réinitialiser trajet"
                            className="w-7 h-7 rounded-lg bg-gray-50 text-gray-700 hover:bg-gray-100 flex items-center justify-center transition active:scale-90"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* TIMELINE STEPPER PROCESS */}
                    <div className="bg-white rounded-xl p-4 border border-gray-150 space-y-4 shadow-2xs">
                      <h4 className="text-[12px] font-black text-slate-800 uppercase tracking-wider shrink-0">Étapes de livraison</h4>
                      
                      {/* Steps graph list */}
                      <div className="space-y-4">
                        {steps.map((step, idx, arr) => {
                          const isLast = idx === arr.length - 1;
                          return (
                            <div key={idx} className="flex gap-4.5 relative text-[11px]">
                              {/* Step line indicator */}
                              {!isLast && (
                                <div className={`absolute left-2.5 top-5 w-[2px] h-[28px] bg-gray-200 z-10 ${step.done && arr[idx+1].done ? 'bg-rose-500' : ''}`} style={{ backgroundColor: step.done && arr[idx+1].done ? '#E52327' : '#E5E7EB' }} />
                              )}

                              {/* Bullet */}
                              <div className={`w-5 h-5 rounded-full flex items-center justify-center z-20 shrink-0 ${
                                step.current 
                                  ? 'bg-[#E52327] text-white ring-4 ring-rose-100 animate-pulse' 
                                  : step.done 
                                    ? 'bg-[#E52327] text-white' 
                                    : 'bg-gray-100 text-gray-400'
                              }`} style={{ backgroundColor: step.done || step.current ? '#E52327' : '#F3F4F6' }}>
                                {step.done ? <Check className="w-3 h-3 stroke-[3] text-white" /> : <div className="w-2 h-2 rounded-full bg-gray-300"></div>}
                              </div>

                              {/* Text labels info */}
                              <div className="flex-1 flex justify-between items-center">
                                <span className={`text-[13px] tracking-tight ${step.current ? 'font-black text-gray-950' : step.done ? 'font-bold text-gray-800' : 'text-gray-400 font-medium'}`}>
                                  {step.title}
                                </span>
                                <span className="text-gray-400 font-mono font-medium">{step.time}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Order Cancellation Trigger (Only active if Status is 'Confirmée') */}
                    {trackedStatus === 'Confirmée' && (
                      <div className="bg-rose-50/40 border border-rose-100 rounded-xl p-3.5 text-center space-y-2 animate-[fade-in_0.3s_ease] shadow-3xs">
                        <p className="text-[11px] text-rose-800 font-extrabold leading-tight">
                          Le maquis n'a pas encore validé la préparation. Vous pouvez toujours annuler la commande.
                        </p>
                        <button
                          type="button"
                          onClick={() => {
                            setIsCancelConfirmOpen(true);
                          }}
                          className="w-full h-[38px] bg-red-600 hover:bg-red-700 text-white font-extrabold rounded-lg text-xs uppercase tracking-wider transition active:scale-[0.98] flex items-center justify-center gap-1.5 shadow-2xs"
                        >
                          🚫 Annuler la commande
                        </button>
                      </div>
                    )}

                    {/* RIDER BLOCKS FOR BLAISE K */}
                    <div className="bg-white rounded-xl p-3.5 border border-gray-150 shadow-2xs flex items-center justify-between relative">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <img 
                            src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80" 
                            alt="Blaise K." 
                            className="w-[48px] h-[48px] rounded-full object-cover border-2 border-rose-500/20"
                            referrerPolicy="no-referrer"
                          />
                          <span className="absolute bottom-[-2px] right-[-2px] bg-amber-400 text-slate-950 border border-white text-[9px] font-black px-1 rounded-full flex items-center gap-[1px]">
                            ★4.8
                          </span>
                        </div>
                        <div>
                          <h4 className="text-[14px] font-black text-gray-950 leading-tight">Blaise K.</h4>
                          <p className="text-[11px] text-[#E52327] font-semibold mt-0.5">Votre livreur Dodo Express</p>
                        </div>
                      </div>

                {/* Call and text chat actions */}
                <div className="flex gap-2.5">
                  <button 
                    onClick={() => setShowDriverCall(true)}
                    className="w-[36px] h-[36px] rounded-full bg-rose-50 text-[#E52327] hover:bg-[#E52327] hover:text-white flex items-center justify-center transition active:scale-90"
                  >
                    <Phone className="w-4.5 h-4.5 stroke-[2.2]" />
                  </button>
                  <button 
                    onClick={() => setShowDriverChat(true)}
                    className="w-[36px] h-[36px] rounded-full bg-rose-50 text-[#E52327] hover:bg-[#E52327] hover:text-white flex items-center justify-center transition active:scale-90 relative"
                  >
                    <MessageSquare className="w-4.5 h-4.5 stroke-[2.2]" />
                    <span className="absolute top-[-3px] right-[-3px] w-2.5 h-2.5 bg-rose-600 rounded-full border border-white"></span>
                  </button>
                </div>
              </div>
            </>
          )}

        </div>

            {/* LIVE DRIVER CALL MODAL OVERLAY */}
            <AnimatePresence>
              {showDriverCall && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-slate-950/90 z-50 flex flex-col items-center justify-between py-[100px] text-white"
                >
                  <div className="flex flex-col items-center space-y-4">
                    <img 
                      src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80" 
                      alt="Blaise K." 
                      className="w-[100px] h-[100px] rounded-full object-cover border-4 border-rose-500/30 animate-pulse"
                      referrerPolicy="no-referrer"
                    />
                    <div className="text-center">
                      <h3 className="text-xl font-extrabold text-white">Appel Blaise K.</h3>
                      <p className="text-xs text-rose-400 font-medium tracking-widest mt-1">LIVREUR DODO EXPRESS</p>
                    </div>
                  </div>

                  <div className="text-center text-sm font-semibold tracking-wide text-gray-300">
                    Connexion en cours...
                  </div>

                  <button 
                    onClick={() => setShowDriverCall(false)}
                    className="h-14 w-14 bg-red-600 text-white rounded-full flex items-center justify-center hover:bg-red-700 active:scale-90 transition shadow-lg"
                  >
                    <Phone className="h-[24px] w-[24px] rotate-135 fill-current" />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* LIVE DRIVER SMS CHAT MODAL OVERLAY */}
            <AnimatePresence>
              {showDriverChat && (
                <motion.div 
                  initial={{ y: "100%", opacity: 0.9 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: "100%", opacity: 0.9 }}
                  className="absolute inset-x-0 bottom-0 top-[80px] bg-white z-50 rounded-t-[32px] flex flex-col shadow-2xl border-t border-gray-200"
                >
                  {/* Chat Header */}
                  <div className="h-[52px] px-4 border-b border-gray-150 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-2.5">
                      <img 
                        src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80" 
                        alt="Blaise" 
                        className="w-8 h-8 rounded-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                      <div>
                        <h4 className="text-xs font-bold text-gray-900 leading-tight">Blaise K. • En route</h4>
                        <span className="text-[9px] text-[#E52327] font-semibold uppercase">Livreur</span>
                      </div>
                    </div>
                    <button 
                      onClick={() => setShowDriverChat(false)}
                      className="text-xs font-black text-gray-500 hover:text-rose-600"
                    >
                      Fermer
                    </button>
                  </div>

                  {/* Messages listing */}
                  <div className="flex-1 overflow-y-auto no-scrollbar p-4 space-y-3.5 bg-slate-50">
                    {chatMessages.map((msg, i) => {
                      const isClient = msg.sender === 'client';
                      return (
                        <div key={i} className={`flex ${isClient ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[75%] rounded-2xl p-3 text-xs shadow-2xs ${
                            isClient 
                              ? 'bg-[#E52327] text-white rounded-br-none' 
                              : 'bg-white text-gray-800 rounded-bl-none border border-gray-150'
                          }`}>
                            <p className="leading-snug">{msg.text}</p>
                            <span className={`text-[8.5px] block text-right mt-1.5 ${isClient ? 'text-rose-200' : 'text-gray-400'}`}>{msg.time}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Quick responses */}
                  <div className="px-4 py-2 border-t border-gray-100 flex gap-2 overflow-x-auto no-scrollbar bg-slate-50 shrink-0">
                    {["Je suis dehors !", "Pouvez-vous m'appeler ?", "Merci beaucoup !"].map((phrase) => (
                      <button 
                        key={phrase}
                        onClick={() => {
                          setNewChatMessage(phrase);
                        }}
                        className="bg-white border border-gray-200 text-xs text-gray-700 px-3 py-1.5 rounded-full whitespace-nowrap hover:bg-rose-50 hover:text-rose-600 font-medium transition shrink-0"
                      >
                        {phrase}
                      </button>
                    ))}
                  </div>

                  {/* Chat Input */}
                  <div className="p-3 border-t border-gray-155 bg-white flex gap-2 shrink-0 pb-[30px]">
                    <input 
                      type="text" 
                      placeholder="Écrire à Blaise..." 
                      value={newChatMessage}
                      onChange={(e) => setNewChatMessage(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') sendTextMessage(); }}
                      className="flex-1 h-[42px] px-3.5 bg-gray-50 border border-gray-150 rounded-xl text-xs placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-rose-500/40"
                    />
                    <button 
                      onClick={sendTextMessage}
                      className="bg-[#E52327] text-white px-4 h-[42px] rounded-xl text-xs font-black hover:bg-rose-700 transition shadow-md active:scale-95 shrink-0"
                    >
                      Envoyer
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

          </div>
        )})()}

        {/* =======================================================
            SCREEN 6: HISTORIQUE DES COMMANDES
            ======================================================= */}
        {currentScreenId === 6 && (
          <div className="flex-1 flex flex-col bg-white overflow-hidden pb-[70px]">
            {/* Header */}
            <div className="h-[48px] px-4 border-b border-gray-100 flex items-center justify-between bg-white sticky top-0 z-30 shrink-0">
              <div className="w-6"></div>
              <h2 className="text-[16px] font-extrabold text-gray-950">Mes commandes</h2>
              <div className="w-6"></div>
            </div>

            {/* Tabs toggle */}
            <div className="flex border-b border-gray-100 bg-white text-[13px] font-bold shrink-0">
              {(['À venir', 'Historique'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setHistoryActiveTab(tab)}
                  className={`flex-1 text-center py-2.5 transition relative ${
                    historyActiveTab === tab ? 'text-[#E52327]' : 'text-gray-500'
                  }`}
                >
                  <span>{tab}</span>
                  {historyActiveTab === tab && (
                    <motion.div layoutId="history_active_indicator" className="absolute bottom-0 inset-x-0 h-0.5 bg-[#E52327]" />
                  )}
                </button>
              ))}
            </div>

            {/* Orders listing contents */}
            <div className="flex-1 overflow-y-auto no-scrollbar p-4 bg-gray-50 space-y-4">
              
              {/* Upcoming TAB */}
              {historyActiveTab === 'À venir' && (
                <div className="space-y-4">
                  {orders.filter(o => o.status !== 'Livré' && o.status !== 'Annulée').length > 0 ? (
                    orders.filter(o => o.status !== 'Livré' && o.status !== 'Annulée').map((ord) => (
                      <div 
                        key={ord.id}
                        onClick={() => {
                          setActiveTrackingOrderId(ord.order_number);
                          changeScreen(5);
                        }}
                        className="bg-white rounded-xl p-3.5 border border-rose-100 shadow-md cursor-pointer hover:border-rose-400 transition animate-[fade-in_0.3s_ease]"
                      >
                        <div className="flex justify-between items-start mb-2.5 border-b border-gray-100 pb-2">
                           <div>
                             <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Référence</span>
                             <h4 className="text-[13px] text-slate-900 font-extrabold leading-tight">{ord.order_number}</h4>
                           </div>
                           <span className="bg-rose-50 text-[#E52327] text-[10px] font-black px-2 py-0.5 rounded-md animate-pulse">
                             🚚 {ord.status === 'En route' ? 'En livraison' : ord.status}
                           </span>
                        </div>

                        <div className="flex gap-3 mt-1 text-[12px]">
                          <img 
                            src={ord.restaurant.image_url} 
                            alt={ord.restaurant.name} 
                            className="w-[48px] h-[48px] rounded-lg object-cover"
                            referrerPolicy="no-referrer"
                          />
                          <div className="flex-1 space-y-0.5 justify-between">
                            <h5 className="font-extrabold text-gray-950 text-[13.5px] leading-snug">{ord.restaurant.name}</h5>
                            <p className="text-gray-400 overflow-hidden text-ellipsis line-clamp-1">{ord.items.map(i => `${i.quantity}x ${i.menu_item.name}`).join(', ')}</p>
                            <div className="pt-1 flex justify-between items-center text-[12px]">
                              <span className="font-black text-rose-600">{ord.total} FCFA</span>
                              <span className="text-xs text-rose-500 font-bold flex items-center gap-1">Suivre →</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="py-16 text-center text-gray-400 space-y-3 px-6 animate-[fade-in_0.3s_ease]">
                      <Clock className="w-10 h-10 mx-auto text-gray-300 stroke-[1.5]" />
                      <div>
                        <h4 className="font-extrabold text-black text-sm">Aucune commande active</h4>
                        <p className="text-[11.5px] text-gray-500 mt-0.5">Vos commandes en cours de préparation ou livraison apparaitront ici.</p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* History TAB */}
              {historyActiveTab === 'Historique' && (
                <div className="space-y-3 pb-8">
                  {orders.filter(o => o.status === 'Livré' || o.status === 'Annulée').map((ord) => {
                    const isCanceled = ord.status === 'Annulée';
                    return (
                      <div 
                        key={ord.id}
                        onClick={() => {
                          if (!isCanceled) {
                            setActivePastOrderDetail(ord);
                          } else {
                            setActiveTrackingOrderId(ord.order_number);
                            changeScreen(5);
                          }
                        }}
                        className="bg-white rounded-xl p-3.5 border border-gray-150 shadow-2xs cursor-pointer hover:border-gray-300 transition animate-[fade-in_0.3s_ease]"
                      >
                        <div className="flex justify-between items-start mb-2 border-b border-gray-50 pb-2 text-[11px]">
                          <div>
                            <span className="text-gray-400 font-bold block">{ord.order_number}</span>
                            <span className="text-gray-400 font-semibold">{ord.created_at}</span>
                          </div>
                          {isCanceled ? (
                            <span className="bg-gray-100 text-gray-550 border border-gray-200 text-[9px] font-black px-2 py-0.5 rounded-full inline-flex items-center gap-1 leading-none" style={{ color: '#6B7280' }}>
                              ✕ Annulée
                            </span>
                          ) : (
                            <span className="bg-emerald-50 text-emerald-700 text-[9px] font-black px-2 py-0.5 rounded-full inline-flex items-center gap-1 leading-none">
                              <Check className="w-3 h-3 stroke-[3]" /> Livrée
                            </span>
                          )}
                        </div>

                        <div className="flex gap-3 text-[12px]">
                          <img 
                            src={ord.restaurant.image_url} 
                            alt={ord.restaurant.name} 
                            className="w-[42px] h-[42px] rounded-lg object-cover"
                            referrerPolicy="no-referrer"
                          />
                          <div className="flex-1 space-y-0.5">
                            <h5 className="font-extrabold text-gray-950 text-[13px]">{ord.restaurant.name}</h5>
                            <p className="text-gray-400 truncate max-w-[190px]">{ord.items.map(i => `${i.quantity}x ${i.menu_item.name}`).join(', ')}</p>
                            <div className="pt-1 flex justify-between items-center font-bold text-[12.5px]">
                              <span className="text-gray-950">{ord.total} FCFA</span>
                              <span className="text-xs text-rose-600 font-semibold">Détails 📋</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

            </div>

            {/* COMPLETED ORDER DETAIL MODAL DIALOG */}
            <AnimatePresence>
              {activePastOrderDetail && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
                  onClick={() => setActivePastOrderDetail(null)}
                >
                  <motion.div 
                    initial={{ scale: 0.9, y: 20 }}
                    animate={{ scale: 1, y: 0 }}
                    exit={{ scale: 0.9, y: 20 }}
                    className="bg-white rounded-[24px] w-full max-w-[320px] p-5 shadow-2xl border border-gray-100 text-[12.5px] space-y-4"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {/* Header */}
                    <div className="text-center border-b border-gray-100 pb-3">
                      <div className="h-10 w-10 bg-emerald-100 text-emerald-800 rounded-full flex items-center justify-center mx-auto mb-2">
                        <Check className="w-5 h-5 stroke-[2.5]" />
                      </div>
                      <h3 className="font-extrabold text-[#E52327] text-sm">Commande livrée avec succès !</h3>
                      <span className="text-[10px] text-gray-400 font-bold block mt-1">Reçu Dodo Express</span>
                    </div>

                    <div className="space-y-1.5 leading-snug">
                      <div className="flex justify-between"><span className="text-gray-400">Numéro :</span><span className="font-semibold text-black">{activePastOrderDetail.order_number}</span></div>
                      <div className="flex justify-between"><span className="text-gray-400">Date :</span><span className="font-semibold text-black">{activePastOrderDetail.created_at}</span></div>
                      <div className="flex justify-between"><span className="text-gray-400">Maquis :</span><span className="font-semibold text-black">{activePastOrderDetail.restaurant.name}</span></div>
                    </div>

                    {/* Items break list */}
                    <div className="border-t border-b border-gray-100 py-3 space-y-2">
                      {activePastOrderDetail.items.map((it, idx) => (
                        <div key={idx} className="flex justify-between text-gray-700">
                          <span>{it.quantity}x {it.menu_item.name}</span>
                          <span className="font-semibold">{it.menu_item.price * it.quantity} FCFA</span>
                        </div>
                      ))}
                    </div>

                    <div className="space-y-1.5 font-bold">
                      <div className="flex justify-between text-xs text-gray-500"><span>Sous-total:</span><span>{activePastOrderDetail.subtotal} FCFA</span></div>
                      <div className="flex justify-between text-xs text-gray-500"><span>Frais de livraison:</span><span>{activePastOrderDetail.delivery_fee} FCFA</span></div>
                      <div className="flex justify-between text-sm text-[#E52327] font-black pt-1 border-t border-gray-50"><span>Total payé:</span><span>{activePastOrderDetail.total} FCFA</span></div>
                    </div>

                    <div className="flex gap-2 pt-1 uppercase tracking-wider text-[11px] font-black shrink-0">
                      <button 
                        onClick={() => {
                          setActivePrintTicket(activePastOrderDetail);
                        }}
                        className="flex-1 h-[42px] bg-slate-900 border border-slate-950 text-white rounded-xl font-bold flex items-center justify-center gap-1.5 cursor-pointer hover:bg-slate-850 active:scale-95 transition"
                      >
                        🖨️ Imprimer / PDF
                      </button>
                      <button 
                        onClick={() => setActivePastOrderDetail(null)}
                        className="flex-1 h-[42px] bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl font-bold active:scale-95 transition"
                      >
                        Fermer
                      </button>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* VINTAGE THERMAL PRINT RECEIPT / PDF EXPORTER OVERLAY */}
            <AnimatePresence>
              {activePrintTicket && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-slate-950/80 backdrop-blur-xs z-[100] flex items-center justify-center p-4 font-mono text-[11px] text-black"
                  onClick={() => setActivePrintTicket(null)}
                >
                  <motion.div 
                    initial={{ scale: 0.9, y: 15 }}
                    animate={{ scale: 1, y: 0 }}
                    exit={{ scale: 0.9, y: 15 }}
                    className="bg-stone-50 text-neutral-900 rounded-[12px] w-full max-w-[285px] shadow-2xl overflow-hidden flex flex-col relative border border-gray-300"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {/* Thermal receipt paper top jagged style */}
                    <div className="bg-stone-100/90 h-3 border-b border-dashed border-gray-300 flex justify-between px-2 overflow-hidden select-none shrink-0">
                      {Array.from({ length: 15 }).map((_, i) => (
                        <div key={i} className="w-2 h-2 bg-stone-50 rotate-45 transform -translate-y-1 shrink-0 border border-gray-150"></div>
                      ))}
                    </div>

                    <div className="p-4 space-y-3.5">
                      {/* Ticket header details */}
                      <div className="text-center space-y-0.5">
                        <h3 className="font-extrabold text-[13px] tracking-tight text-center text-slate-950">DODO EXPRESS 🏍️</h3>
                        <p className="text-[9.5px] text-gray-400">Ouagadougou, Burkina Faso</p>
                        <p className="text-[10px] text-gray-500">---------------------------------</p>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-[#E52327]">REÇU DE COMMANDE OFFICIEL</p>
                      </div>

                      {/* Info lines block */}
                      <div className="space-y-1 text-[11px]">
                        <div className="flex justify-between"><span>Réf:</span><span className="font-bold">{activePrintTicket.order_number}</span></div>
                        <div className="flex justify-between"><span>Date:</span><span>{activePrintTicket.created_at}</span></div>
                        <div className="flex justify-between"><span>Maquis:</span><span className="font-bold">{activePrintTicket.restaurant.name}</span></div>
                        <div className="flex justify-between"><span>Paiement:</span><span className="font-bold uppercase">{activePrintTicket.payment_method || 'YENGAPAY'}</span></div>
                      </div>

                      <p className="text-gray-400 text-center text-[10px] leading-none">---------------------------------</p>

                      {/* Items loop */}
                      <div className="space-y-1.5 text-[11px] max-h-[100px] overflow-y-auto no-scrollbar">
                        <span className="font-bold block uppercase text-[10px] text-gray-400">DÉTAILS DES PLATS :</span>
                        {activePrintTicket.items.map((it, idx) => (
                          <div key={idx} className="flex justify-between items-start gap-2">
                            <span className="text-left line-clamp-2">x{it.quantity} {it.menu_item.name}</span>
                            <span className="font-bold text-right shrink-0">{it.menu_item.price * it.quantity} F</span>
                          </div>
                        ))}
                      </div>

                      <p className="text-gray-400 text-center text-[10px] leading-none">---------------------------------</p>

                      {/* Totals table */}
                      <div className="space-y-1 text-[11px]">
                        <div className="flex justify-between"><span>Sous-total plats:</span><span>{activePrintTicket.subtotal} F</span></div>
                        <div className="flex justify-between"><span>Livreur Dodo:</span><span>{activePrintTicket.delivery_fee} F</span></div>
                        <div className="flex justify-between font-black text-[12px] border-t border-dashed border-gray-400 pt-1.5 mt-1">
                          <span>TOTAL PAYÉ:</span>
                          <span className="text-[#E52327]">{activePrintTicket.total} FCFA</span>
                        </div>
                      </div>

                      <p className="text-gray-400 text-center text-[10px] leading-none">---------------------------------</p>

                      <div className="text-center text-[9.5px] text-gray-500 leading-snug">
                        Merci de votre gourmandise !<br/>
                        Bon appétit avec Dodo Express 🇧🇫
                      </div>

                      {/* Action trigger buttons */}
                      <div className="pt-2 space-y-1.5 font-sans">
                        <button 
                          onClick={() => {
                            handlePrintAction(activePrintTicket);
                          }}
                          className="w-full h-[36px] bg-slate-900 text-stone-100 rounded-lg text-xs font-black transition flex items-center justify-center gap-1 hover:bg-black tracking-wide cursor-pointer"
                        >
                          🖨️ PDF / Imprimer direct
                        </button>
                        <button 
                          onClick={() => {
                            handleDownloadTxtReceipt(activePrintTicket);
                          }}
                          className="w-full h-[36px] bg-[#E52327] hover:bg-rose-700 text-white rounded-lg text-xs font-black transition flex items-center justify-center gap-1 tracking-wide cursor-pointer"
                        >
                          📥 Télécharger (.txt)
                        </button>
                        <button 
                          onClick={() => setActivePrintTicket(null)}
                          className="w-full h-[32px] bg-white text-gray-500 rounded-lg text-[10px] font-bold border border-gray-200 hover:bg-gray-50 transition uppercase tracking-wider cursor-pointer"
                        >
                          Retour
                        </button>
                      </div>

                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

          </div>
        )}

        {/* =======================================================
            SCREEN 7: PROFIL CLIENT (Profil de Moussa Traoré)
            ======================================================= */}
        {currentScreenId === 7 && (
          <div className="flex-1 flex flex-col bg-[#FAFAFA] overflow-hidden pb-[70px]">
            {/* Header */}
            <div className="h-[48px] px-4 border-b border-gray-100 flex items-center justify-between bg-white sticky top-0 z-30 shrink-0">
              <div className="w-6"></div>
              <h2 className="text-[16px] font-extrabold text-gray-950">Mon profil</h2>
              <button 
                onClick={() => showToast("Paramètres généraux indisponibles")}
                className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center transition"
              >
                <Settings className="w-4.5 h-4.5 text-gray-500" />
              </button>
            </div>

            {/* Scroll profile sections */}
            <div className="flex-1 overflow-y-auto no-scrollbar p-4 space-y-4 text-xs">
              
              {/* User Identity Highlight */}
              <div className="bg-white rounded-2xl p-4 border border-gray-150 flex items-center gap-4 shadow-2xs relative">
                <img 
                  src={profile.avatar_url} 
                  alt={profile.name} 
                  className="w-[66px] h-[66px] rounded-full object-cover border-2 border-rose-500/10"
                  referrerPolicy="no-referrer"
                />
                <div className="space-y-0.5">
                  <h3 className="text-[17px] font-black text-gray-900 tracking-tight leading-tight">{profile.name}</h3>
                  <p className="text-[11.5px] text-gray-500 font-mono">{profile.phone}</p>
                  <p className="text-[11px] text-gray-400 font-semibold">{profile.email}</p>
                </div>
              </div>

              {/* Dodo Club Premium Subscription Banner */}
              <div className={`rounded-2xl p-4 text-left border relative overflow-hidden shadow-xs transition-all duration-300 ${isDodoPassSubscribed ? 'bg-gradient-to-r from-slate-900 via-rose-900 to-red-950 border-red-800 text-white' : 'bg-gradient-to-r from-slate-900 via-rose-950 to-slate-950 border-slate-800 text-white'}`}>
                {/* Visual sparkles overlay */}
                <div className="absolute top-[-20px] right-[-20px] w-24 h-24 bg-white/5 rounded-full blur-xl pointer-events-none"></div>
                <div className="flex justify-between items-start relative z-10 max-h-[140px]">
                  <div className="space-y-1 max-w-[210px]">
                    <div className="inline-flex items-center gap-1.5 bg-[#E52327] text-white text-[8px] font-black tracking-widest uppercase px-2 py-0.5 rounded-full leading-none select-none">
                      <span>✨ MEMBRE VIP CLUB</span>
                    </div>
                    <h4 className="text-[16px] font-black tracking-tight leading-tight uppercase font-sans">
                      {isDodoPassSubscribed ? "Dodo Club Activé ✓" : "Devenez VIP avec Dodo Club"}
                    </h4>
                    <p className="text-[11.5px] opacity-80 leading-snug font-medium">
                      {isDodoPassSubscribed 
                        ? "Frais de livraison à 0 F + 10% de réduction immédiate exclusive Dodo Club !" 
                        : "Frais de livraison à 0  FCFA illimités + 10% de réduction sur vos repas pour 1 500 F/mois."}
                    </p>
                  </div>
                  <div className="text-[28px] animate-pulse shrink-0">👑</div>
                </div>
                <div className="mt-3 flex items-center justify-between gap-2.5 relative z-10 select-none">
                  {isDodoPassSubscribed ? (
                    <>
                      <span className="text-[11px] font-bold text-rose-300 flex items-center gap-1">
                        <span className="inline-block w-2 h-2 rounded-full bg-red-500 animate-ping"></span> 1 500 F / mois (Actif ✨)
                      </span>
                      <button 
                        onClick={() => {
                          if (window.confirm("Voulez-vous vraiment résilier votre abonnement Dodo Club ? 😢")) {
                            setIsDodoPassSubscribed(false);
                            localStorage.setItem('DODO_PASS_SUBSCRIBED', 'false');
                            showToast("Abonnement Dodo Club résilié.");
                          }
                        }}
                        className="text-[10px] text-rose-200 underline font-semibold hover:text-white transition cursor-pointer"
                      >
                        Se désabonner
                      </button>
                    </>
                  ) : (
                    <>
                      <span className="text-[12px] font-black text-rose-300">
                        1 500 FCFA / mois
                      </span>
                      <button 
                        onClick={() => {
                          if (walletBalance >= 1500) {
                            setWalletBalance(prev => prev - 1500);
                            setIsDodoPassSubscribed(true);
                            localStorage.setItem('DODO_PASS_SUBSCRIBED', 'true');
                            
                            // Add a real transaction to ledger
                            setWalletTransactions(prev => [
                              {
                                id: `tx_pass_${Date.now()}`,
                                desc: 'Abonnement mensuel Dodo Club ✨',
                                amount: 1500,
                                isDeposit: false,
                                time: "Aujourd'hui, à l'instant"
                              },
                              ...prev
                            ]);

                            showToast("Félicitations ! Vous êtes inscrit au Dodo Club ✨ ! 🥳🎉");
                            addNotification(
                              "✨ Bienvenue chez Dodo Club !",
                              "Votre abonnement est actif. Profitez des frais de livraison offerts (0 FCFA) et de 10% de remise automatique !"
                            );
                          } else {
                            showToast("Solde insuffisant ! Rechargez d'abord votre Dodo Wallet 💳");
                            setActiveProfileModal('wallet');
                          }
                        }}
                        className="bg-[#E52327] hover:bg-rose-600 text-white text-[11.5px] font-black px-4 py-2 rounded-xl transition shadow-md font-sans shrink-0 cursor-pointer"
                      >
                        S'abonner maintenant
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Menu options block */}
              <div className="bg-white rounded-2xl border border-gray-150 overflow-hidden shadow-2xs text-[13px]">
                {[
                  { id: 'edit_profile', label: language === 'fr' ? 'Modifier mon profil' : 'Edit my profile', icon: User, note: language === 'fr' ? "Éditer l'avatar" : "Edit avatar" },
                  { id: 'security', label: language === 'fr' ? 'Email & Mot de passe' : 'Email & Password', icon: Shield, note: language === 'fr' ? "Sécurité" : "Security" },
                  { id: 'wallet', label: 'Dodo Wallet', icon: DollarSign, note: `${walletBalance} FCFA`, noteClass: walletBalance < 1000 ? "text-red-600 font-black pr-1 bg-red-50 border border-red-200/50 px-1.5 py-0.5 rounded-md text-[9.5px] animate-pulse" : "text-[#E52327] font-extrabold pr-1 bg-rose-50 px-1.5 py-0.5 rounded-md text-[9.5px]" },
                  { id: 'kyc_status', label: language === 'fr' ? 'Vérification KYC' : 'KYC Verification', icon: UserCheck, note: kycStatus === 'verified' ? (language === 'fr' ? 'Vérifié ✓' : 'Verified ✓') : kycStatus === 'pending' ? (language === 'fr' ? 'Attente...' : 'Pending...') : (language === 'fr' ? 'Non vérifié' : 'Unverified'), noteClass: kycStatus === 'verified' ? 'text-green-600 bg-green-50 px-1.5 py-0.5 rounded-md text-[9.5px]' : 'text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-md text-[9.5px]' },
                  { id: 'addresses', label: language === 'fr' ? 'Adresses de livraison' : 'Delivery Addresses', icon: MapPin },
                  { id: 'payments', label: language === 'fr' ? 'Modes de paiement' : 'Payment Methods', icon: Clock }, // matches standard payment logo
                  { id: 'favorites', label: language === 'fr' ? 'Mes favoris' : 'My Favorites', icon: Heart },
                  { id: 'language_toggle', label: language === 'fr' ? 'Langue (English)' : 'Language (Français)', icon: Globe, note: language.toUpperCase(), noteClass: 'text-rose-600 font-bold bg-rose-50 px-1.5 py-0.5 rounded-md text-[9.5px]' },
                  { id: 'notifications', label: 'Notifications', icon: Bell },
                  { id: 'help', label: language === 'fr' ? 'Aide et support' : 'Help & Support', icon: HelpCircle },
                  { id: 'about', label: language === 'fr' ? 'À propos de Dodo' : 'About Dodo', icon: Check },
                ].map((item, idx, arr) => {
                  const IconComp = item.icon;
                  const isLast = idx === arr.length - 1;
                  return (
                    <button
                       key={item.id}
                       onClick={() => {
                         if (item.id === 'language_toggle') {
                           setLanguage(language === 'fr' ? 'en' : 'fr');
                           showToast(language === 'fr' ? "English translation loaded!" : "Version française chargée !");
                         } else {
                           setActiveProfileModal(item.id);
                         }
                       }}
                       className={`w-full px-4 py-3.5 hover:bg-rose-50/40 text-left flex items-center justify-between transition ${
                         !isLast ? 'border-b border-gray-100' : ''
                       }`}
                    >
                      <div className="flex items-center gap-3 text-slate-800">
                        <IconComp className="w-4.5 h-4.5 text-[#E52327]" />
                        <span className="font-semibold text-xs leading-none flex items-center gap-1.5">
                          {item.label}
                          {item.id === 'wallet' && walletBalance < 1000 && (
                            <span 
                              className="w-2 h-2 bg-red-600 rounded-full inline-block animate-pulse shrink-0" 
                              title="Solde de portefeuille inférieur à 1000 FCFA ! Rechargez vite."
                              id="wallet-alert-dot"
                            />
                          )}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {item.note && (
                          <span className={`text-[10px] font-extrabold ${item.noteClass || 'text-gray-400 font-medium'}`}>
                            {item.note}
                          </span>
                        )}
                        <ChevronRight className="w-4 h-4 text-gray-300 shrink-0" />
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* SECTION: Espace Parrainage (Interactive Referral Center) */}
              <div className="bg-white rounded-2xl border border-gray-150 p-4.5 space-y-4 shadow-2xs text-left">
                <div className="flex items-center gap-2.5 border-b border-gray-100 pb-2.5">
                  <div className="p-2 rounded-xl bg-rose-50 border border-rose-100">
                    <Gift className="w-5 h-5 text-[#E52327]" />
                  </div>
                  <div>
                    <h3 className="text-xs font-black text-gray-900 uppercase tracking-tight">Espace Parrainage 🎁</h3>
                    <p className="text-[10px] text-gray-500 font-semibold font-sans">Invitez vos amis et gagnez +2 500 {config.currencySymbol} par filleul !</p>
                  </div>
                </div>

                {!referralCode ? (
                  <div className="space-y-3 py-1">
                    <p className="text-[11px] text-gray-600 font-medium leading-relaxed">
                      Vous n'avez pas encore généré votre code de parrainage unique. Cliquez sur le bouton ci-dessous pour l'activer instantanément et commencer à gagner des bonus.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        const cleanName = profile.name.split(' ')[0].toUpperCase().replace(/[^A-Z0-9]/g, '');
                        const randomPart = Math.random().toString(36).substring(3, 7).toUpperCase();
                        const generated = `${cleanName}-${randomPart}`;
                        setReferralCode(generated);
                        addNotification(
                          "Parrainage activé ! 🎁", 
                          `Votre code de parrainage unique ${generated} a été généré. Partagez-le pour gagner des bonus !`
                        );
                        showToast(`Succès ! Votre code ${generated} est actif.`);
                      }}
                      className="w-full py-2.5 bg-[#E52327] hover:bg-rose-700 text-white font-black text-center rounded-xl text-xs flex items-center justify-center gap-2 transition shadow-sm"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      Générer mon code unique
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Active code badge */}
                    <div className="bg-slate-50 border border-slate-150 rounded-xl p-3 flex justify-between items-center">
                      <div>
                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Votre code de parrainage</p>
                        <p className="text-sm font-mono font-black text-slate-900 mt-0.5 tracking-wider uppercase select-all">{referralCode}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          if (navigator.clipboard && navigator.clipboard.writeText) {
                            navigator.clipboard.writeText(referralCode);
                          }
                          showToast("Code de parrainage copié ! 📋");
                        }}
                        className="p-2 bg-white hover:bg-gray-50 border border-gray-150 rounded-lg text-slate-700 transition"
                        title="Copier le code"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Statistics grid */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-rose-50/50 border border-rose-100/40 p-3 rounded-xl space-y-0.5 text-left">
                        <span className="text-[9px] text-gray-500 font-black uppercase tracking-wider block">Filleuls inscrits</span>
                        <div className="flex items-baseline gap-1.5 pt-0.5">
                          <span className="text-[17px] font-black text-[#E52327] tracking-tight">{referralCount}</span>
                          <span className="text-[9.5px] text-gray-400 font-bold">amis</span>
                        </div>
                      </div>
                      <div className="bg-emerald-50/40 border border-emerald-100/50 p-3 rounded-xl space-y-0.5 text-left">
                        <span className="text-[9px] text-gray-550 font-black uppercase tracking-wider block">Bonus cumulés</span>
                        <div className="flex items-baseline gap-1 pt-0.5">
                          <span className="text-[17px] font-black text-emerald-600 tracking-tight">+{referralBonus}</span>
                          <span className="text-[9px] text-emerald-600 font-black">{config.currencySymbol}</span>
                        </div>
                      </div>
                    </div>

                    {/* Simulated friend registration action to test out */}
                    <div className="bg-slate-50 border border-dashed border-gray-250 p-3 rounded-xl text-center space-y-2">
                      <div className="text-[10px] text-gray-500 font-semibold leading-relaxed">
                        💡 Testez le système en simulant la commande d'un ami avec votre code !
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          // Trigger store logic
                          incrementReferrals(2500);
                          
                          // Push simulation alerts
                          const friendNames = ["Adama Diallo", "Fanta Sawadogo", "Abdoulaye Barry", "Salif Sanou", "Aminata Kabore"];
                          const randomFriend = friendNames[Math.floor(Math.random() * friendNames.length)];
                          
                          addNotification(
                            "Commande filleul validée ! 🎉", 
                            `Génial ! Votre ami "${randomFriend}" a passé sa première commande en utilisant votre code "${referralCode}". Un bonus de +2500 ${config.currencySymbol} a été crédité sur votre Dodo Wallet.`
                          );
                          
                          showToast(`Super ! +2500 ${config.currencySymbol} ajoutés à votre portefeuille ! 🎉`);
                        }}
                        className="w-full py-2.5 bg-slate-900 hover:bg-black text-white rounded-lg text-[10.5px] font-black transition flex items-center justify-center gap-1.5"
                      >
                        <UserCheck className="w-3.5 h-3.5 text-[#E52327]" />
                        Simuler l'inscription d'un filleul 🚀
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Log out trigger button */}
              <button 
                id="logout_btn"
                onClick={() => setIsLogoutConfirmOpen(true)}
                className="w-full h-[50px] bg-white text-red-600 rounded-2xl font-extrabold text-[13px] border border-red-100 shadow-2xs hover:bg-red-50 flex items-center justify-center gap-2.5 active:scale-[0.98] shrink-0"
              >
                <LogOut className="w-4.5 h-4.5" />
                Se déconnecter
              </button>

              {/* SECTION: FAQ Dynamique */}
              <div className="bg-white rounded-2xl border border-gray-150 overflow-hidden shadow-2xs p-4.5 space-y-3">
                <div className="flex items-center gap-2 border-b border-gray-100 pb-2 text-left">
                  <HelpCircle className="w-5 h-5 text-[#E52327]" />
                  <div>
                    <h3 className="text-xs font-black text-gray-900 uppercase tracking-tight">Foire Aux Questions ❓</h3>
                    <p className="text-[9.5px] text-gray-500 font-medium font-sans">Mises à jour sans code depuis la stack</p>
                  </div>
                </div>

                <div className="space-y-2 mt-2">
                  {faqs.length === 0 ? (
                    <p className="text-gray-400 text-center py-4 text-[11px] font-medium leading-normal">
                      Aucune question FAQ configurée.
                    </p>
                  ) : (
                    faqs.map((faq) => {
                      const isExpanded = expandedFaqId === faq.id;
                      return (
                        <div key={faq.id} className="border-b border-gray-100 pb-2">
                          <button
                            type="button"
                            onClick={() => setExpandedFaqId(isExpanded ? null : faq.id)}
                            className="w-full py-1.5 flex justify-between items-center text-left hover:text-rose-600 transition duration-150"
                          >
                            <span className="font-extrabold text-slate-800 text-[11px] leading-snug flex items-center gap-1.5 min-w-0 pr-2">
                              <span className="text-[8.5px] bg-rose-50 border border-rose-100/50 text-[#E52327] px-1.5 py-0.5 rounded uppercase font-black shrink-0 tracking-wide">
                                {faq.category}
                              </span>
                              <span className="truncate">{faq.question}</span>
                            </span>
                            <ChevronRight className={`w-3.5 h-3.5 text-gray-400 transition-transform shrink-0 ${isExpanded ? 'rotate-90' : ''}`} />
                          </button>
                          
                          <AnimatePresence initial={false}>
                            {isExpanded && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.15 }}
                                className="overflow-hidden"
                              >
                                <p className="text-[10.5px] text-gray-500 leading-relaxed font-semibold py-1.5 pl-1 bg-[#FAFAFA] rounded-md px-2 text-left select-text">
                                  {faq.answer}
                                </p>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

            </div>

            {/* Custom Logout Confirmation Modal */}
            <AnimatePresence>
              {isLogoutConfirmOpen && (
                <div 
                  className="absolute inset-0 bg-slate-950/60 backdrop-blur-xs z-[150] flex items-center justify-center p-4 font-sans"
                  onClick={() => setIsLogoutConfirmOpen(false)}
                >
                  <motion.div 
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    className="bg-white rounded-[28px] w-full max-w-[315px] p-5 shadow-2xl border border-gray-100 text-center space-y-4"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="h-12 w-12 bg-red-50 text-[#E52327] rounded-full flex items-center justify-center mx-auto mb-1">
                      <LogOut className="w-6 h-6 stroke-[2.5]" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-[16px] font-black text-slate-950 leading-tight">Se déconnecter ?</h3>
                      <p className="text-[11px] text-gray-500 font-medium leading-relaxed">
                        Êtes-vous sûr de vouloir vous déconnecter de votre compte Dodo Food ?
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-2.5 pt-1">
                      <button
                        onClick={() => setIsLogoutConfirmOpen(false)}
                        className="py-2.5 px-4 bg-gray-100 hover:bg-gray-150 text-gray-800 rounded-xl font-extrabold text-xs transition"
                      >
                        Annuler
                      </button>
                      <button
                        onClick={() => {
                          setIsLogoutConfirmOpen(false);
                          changeScreen(1); // Go back to splash as login flow mockup
                          showToast("Déconnecté avec succès ! 👋");
                        }}
                        className="py-2.5 px-4 bg-[#E52327] hover:bg-rose-700 text-white rounded-xl font-extrabold text-xs transition shadow-sm"
                      >
                        Se déconnecter
                      </button>
                    </div>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>

            {/* DYNAMIC INTERACTIVE PROFILES MODAL DIALOGS */}
            <AnimatePresence>
              {activeProfileModal && (
                <div 
                  className="absolute inset-0 bg-black/60 z-50 flex items-end justify-center"
                  onClick={() => setActiveProfileModal(null)}
                >
                  <motion.div 
                    initial={{ y: "100%" }}
                    animate={{ y: 0 }}
                    exit={{ y: "100%" }}
                    className="bg-white rounded-t-[32px] w-full max-h-[70%] overflow-y-auto no-scrollbar p-6 space-y-4 shadow-2xl relative"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {/* Close bar */}
                    <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mb-2"></div>

                    {/* DODO WALLET & SYSTEM PAYMENT SIMULATOR */}
                    {activeProfileModal === 'wallet' && (
                      <div className="space-y-4 text-left">
                        <h3 className="text-sm font-black text-slate-900 border-b border-gray-150 pb-2 flex items-center gap-1.5">
                          💵 Mon Portefeuille Dodo Wallet
                        </h3>

                        {/* Gold-branded Virtual Card */}
                        <div className="relative overflow-hidden w-full h-[155px] bg-gradient-to-br from-rose-600 via-[#E52327] to-slate-950 rounded-2xl p-4.5 text-white flex flex-col justify-between shadow-lg">
                          <div className="absolute top-0 right-0 w-[180px] h-[180px] bg-white/5 rounded-full -translate-y-12 translate-x-12 pointer-events-none" />
                          <div className="flex justify-between items-start z-10">
                            <div className="space-y-0.5">
                              <span className="text-[9px] font-black uppercase text-rose-200 tracking-widest">DODO ELECTRONIC CASH</span>
                              <h4 className="text-[13px] font-black tracking-tight">Moussa Traoré</h4>
                            </div>
                            <span className="text-xs font-black italic">Gold Wallet</span>
                          </div>

                          <div className="space-y-1 z-10">
                            <span className="text-[10px] text-rose-100 font-medium block">Solde Disponible</span>
                            <div className="flex items-baseline gap-1.5 relative">
                              <motion.span 
                                key={walletBalance}
                                initial={{ scale: 1.35, color: "#4ADE80", filter: "brightness(1.5)" }}
                                animate={{ scale: 1, color: "#FFFFFF", filter: "brightness(1)" }}
                                transition={{ type: "spring", stiffness: 220, damping: 14 }}
                                className="text-[26px] font-black tracking-tight leading-none inline-block origin-left"
                              >
                                {walletBalance.toLocaleString('fr-FR')}
                              </motion.span>
                              <span className="text-[12px] font-black">FCFA</span>

                              {/* Floating credit indicator spark */}
                              <AnimatePresence>
                                {showCreditBubble && (
                                  <motion.span
                                    initial={{ opacity: 0, y: 15, scale: 0.8 }}
                                    animate={{ opacity: 1, y: -25, scale: 1.15 }}
                                    exit={{ opacity: 0, y: -45, scale: 0.8 }}
                                    transition={{ duration: 1.4, ease: "easeOut" }}
                                    className="absolute left-0 text-emerald-400 font-extrabold text-[12px] bg-emerald-950/90 border border-emerald-500/20 px-2.5 py-0.5 rounded-full z-30 shadow-sm whitespace-nowrap"
                                  >
                                    +{reloadAmount.toLocaleString('fr-FR')} F
                                  </motion.span>
                                )}
                              </AnimatePresence>
                            </div>
                          </div>

                          <div className="flex justify-between items-end text-[10px] font-medium font-mono z-10 text-rose-100">
                            <span>•••• •••• •••• 9812</span>
                            <span>EXP: 12/29</span>
                          </div>
                        </div>

                        {/* App Recharge Steps */}
                        {reloadStep === 1 && (
                          <div className="space-y-3 pt-1">
                            <h4 className="text-[11px] font-black text-gray-500 uppercase tracking-wider">Recharger mon solde</h4>
                            
                            {/* Provider Presets with crisp custom vector logos */}
                            <div className="space-y-1.5 max-h-[175px] overflow-y-auto pr-1 no-scrollbar">
                              {[
                                { id: 'orange', name: 'Orange Money', logo: <OrangeMoneyLogo size={20} /> },
                                { id: 'moov', name: 'Moov Money', logo: <MoovMoneyLogo size={20} /> },
                                { id: 'wave', name: 'Wave', logo: <WaveLogo size={20} /> },
                                { id: 'telecel', name: 'Telecel Money', logo: <TelecelMoneyLogo size={20} /> },
                                { id: 'paypal', name: 'PayPal', logo: <PayPalLogo size={20} /> },
                              ].map((item) => {
                                const isSelected = reloadProvider === item.id;
                                return (
                                  <button
                                    key={item.id}
                                    type="button"
                                    onClick={() => setReloadProvider(item.id as any)}
                                    className={`w-full h-[42px] px-3 rounded-xl border flex items-center justify-between text-xs font-bold transition-all ${
                                      isSelected 
                                        ? 'border-red-500 bg-red-50/10 text-red-600 shadow-3xs' 
                                        : 'border-gray-150 hover:bg-gray-50 text-gray-700'
                                    }`}
                                  >
                                    <div className="flex items-center gap-2.5">
                                      <div className="w-12 h-7 shrink-0 flex items-center justify-center bg-gray-50 border border-gray-100 rounded-lg p-0.5 overflow-hidden">
                                        {item.logo}
                                      </div>
                                      <span className="font-extrabold text-[11.5px] leading-none">{item.name}</span>
                                    </div>
                                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${
                                      isSelected ? 'border-red-500 bg-red-500 text-white' : 'border-gray-300'
                                    }`}>
                                      {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                                    </div>
                                  </button>
                                );
                              })}
                            </div>

                            {/* Recharge amount selector buttons */}
                            <div className="grid grid-cols-3 gap-1.5 pt-0.5">
                              {[2000, 5000, 10000].map((presetAmt) => (
                                <button
                                  key={presetAmt}
                                  type="button"
                                  onClick={() => setReloadAmount(presetAmt)}
                                  className={`h-[32px] rounded-lg border text-[11px] font-bold transition-colors ${reloadAmount === presetAmt ? 'bg-slate-900 border-slate-900 text-white' : 'border-gray-150 text-gray-600 hover:bg-gray-50'}`}
                                >
                                  +{presetAmt.toLocaleString('fr-FR')} FCFA
                                </button>
                              ))}
                            </div>

                            {/* Manual recharge phone & amount fields */}
                            <div className="grid grid-cols-2 gap-2.5">
                              <div className="space-y-1">
                                <label className="text-[10px] font-extrabold text-gray-400 uppercase">
                                  {reloadProvider === 'paypal' ? 'Email PayPal' : 'Numéro mobile'}
                                </label>
                                <input 
                                  type="text" 
                                  value={reloadPhone}
                                  onChange={(e) => setReloadPhone(e.target.value)}
                                  placeholder={reloadProvider === 'paypal' ? 'paypal@moussa.com' : 'Ex: +226 70..'}
                                  className="w-full h-[38px] px-3 bg-gray-50 border border-gray-150 rounded-lg text-xs font-semibold"
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-[10px] font-extrabold text-gray-400 uppercase">Montant (FCFA)</label>
                                <input 
                                  type="number" 
                                  value={reloadAmount}
                                  onChange={(e) => setReloadAmount(parseInt(e.target.value) || 0)}
                                  placeholder="Montant FCFA"
                                  className="w-full h-[38px] px-3 bg-gray-50 border border-gray-150 rounded-lg text-xs font-semibold"
                                />
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => {
                                if (reloadAmount <= 100) {
                                  showToast("Le montant minimum est 100 FCFA");
                                  return;
                                }
                                setReloadStep(2);
                              }}
                              className="w-full h-[44px] bg-[#E52327] hover:bg-red-700 text-white rounded-xl font-bold text-xs uppercase tracking-wider shadow-sm transition mt-1"
                            >
                              Initialiser la recharge sécurisée
                            </button>
                          </div>
                        )}

                        {reloadStep === 2 && (
                          <div className="space-y-3 pt-1 border border-orange-200/50 bg-orange-50/15 p-4 rounded-xl text-center">
                            <span className="text-2xl block animate-bounce">🔑</span>
                            <h4 className="text-[13.5px] font-extrabold text-slate-900">Code PIN de validation</h4>
                            <p className="text-[10.5px] text-gray-500 font-medium max-w-xs mx-auto">
                              Saisissez votre PIN de validation {
                                reloadProvider === 'orange' ? 'Orange Money (*144#)' : 
                                reloadProvider === 'moov' ? 'Moov Money (*155#)' : 
                                reloadProvider === 'wave' ? 'Wave App' : 
                                reloadProvider === 'telecel' ? 'Telecel Money (*555#)' : 
                                'PayPal Secure'
                              } sur votre GSM simulé pour autoriser le retrait de <strong>{reloadAmount.toLocaleString('fr-FR')} FCFA</strong>.
                            </p>

                            <input 
                              type="password"
                              maxLength={4}
                              placeholder="••••"
                              value={reloadPin}
                              onChange={(e) => setReloadPin(e.target.value)}
                              className="w-24 text-center tracking-widest text-[18px] font-black h-[40px] bg-white border border-gray-200 rounded-xl mx-auto block outline-none"
                            />

                            <div className="grid grid-cols-2 gap-2 pt-2">
                              <button
                                type="button"
                                onClick={() => { setReloadStep(1); setReloadPin(''); }}
                                className="h-[36px] bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-bold text-[11px]"
                              >
                                Retour
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  if (!reloadPin || reloadPin.length < 4) {
                                    showToast("Saisissez un PIN valide de 4 chiffres.");
                                    return;
                                  }
                                  // Credit Wallet!
                                  const finalBalance = walletBalance + reloadAmount;
                                  setWalletBalance(finalBalance);
                                  setShowCreditBubble(true);
                                  setTimeout(() => setShowCreditBubble(false), 2500);
                                  
                                  // Log transaction
                                  const getProviderName = (p: string) => {
                                    if (p === 'orange') return 'Orange Money';
                                    if (p === 'moov') return 'Moov Money';
                                    if (p === 'wave') return 'Wave';
                                    if (p === 'telecel') return 'Telecel Money';
                                    if (p === 'paypal') return 'PayPal';
                                    return 'Dépôt';
                                  };
                                  const newTx = {
                                    id: `tx_${Date.now()}`,
                                    desc: `Crédit ${getProviderName(reloadProvider)}`,
                                    amount: reloadAmount,
                                    isDeposit: true,
                                    time: "À l'instant"
                                  };
                                  setWalletTransactions([newTx, ...walletTransactions]);
                                  setReloadStep(3);
                                  setReloadPin('');
                                }}
                                className="h-[36px] bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold text-[11px]"
                              >
                                Déposer les fonds
                              </button>
                            </div>
                          </div>
                        )}

                        {reloadStep === 3 && (
                          <div className="space-y-3 pt-1 text-center py-2.5">
                            <div className="w-12 h-12 rounded-full bg-green-500/15 flex items-center justify-center text-green-600 mx-auto text-xl">✓</div>
                            <h4 className="text-[14px] font-extrabold text-green-600">Recharge validée ! 🎉</h4>
                            <p className="text-[11px] text-gray-500 font-medium">
                              Votre Dodo Wallet de {profile.name} a été approvisionné avec succès de <strong>+{reloadAmount.toLocaleString('fr-FR')} FCFA</strong>.
                            </p>
                            <button
                              type="button"
                              onClick={() => setReloadStep(1)}
                              className="h-[36px] px-6 bg-slate-900 text-white rounded-lg font-bold text-[11px]"
                            >
                              Terminer
                            </button>
                          </div>
                        )}

                        {/* Recent ledger records */}
                        <div className="space-y-2 pt-1 border-t border-gray-100">
                          <h4 className="text-[11px] font-black text-gray-400 uppercase tracking-wider">Historique des transactions</h4>
                          <div className="space-y-1.5 max-h-[140px] overflow-y-auto no-scrollbar">
                            {walletTransactions.map((tx) => (
                              <div key={tx.id} className="flex justify-between items-center bg-gray-50 border border-gray-150 rounded-xl p-2.5">
                                <div>
                                  <h5 className="font-extrabold text-[11px] text-gray-900">{tx.desc}</h5>
                                  <p className="text-[9px] text-gray-400 font-medium">{tx.time}</p>
                                </div>
                                <span className={`text-[12px] font-black font-mono ${tx.isDeposit ? 'text-green-600' : 'text-slate-800'}`}>
                                  {tx.isDeposit ? '+' : '-'}{tx.amount.toLocaleString('fr-FR')} F
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* INTERACTIVE KYC VERIF SYSTEM */}
                    {activeProfileModal === 'kyc_status' && (
                      <div className="space-y-4 text-left">
                        <h3 className="text-sm font-black text-slate-900 border-b border-gray-150 pb-2 flex items-center gap-1.5">
                          🛡️ Statut de vérification KYC
                        </h3>

                        {/* Verification Display Badge */}
                        <div className={`p-4 rounded-xl flex items-center gap-3 border ${kycStatus === 'verified' ? 'bg-green-50/40 border-green-150 text-green-700' : kycStatus === 'pending' ? 'bg-amber-50/40 border-amber-150 text-amber-700' : 'bg-rose-50/10 border-rose-150 text-gray-700'}`}>
                          <div className={`w-9 h-9 rounded-full shrink-0 flex items-center justify-center text-lg ${kycStatus === 'verified' ? 'bg-green-100' : kycStatus === 'pending' ? 'bg-amber-100' : 'bg-red-100'}`}>
                            {kycStatus === 'verified' ? '✓' : kycStatus === 'pending' ? '⏳' : 'ℹ️'}
                          </div>
                          <div className="leading-tight">
                            <h4 className="font-extrabold text-[12.5px]">
                              {kycStatus === 'verified' ? 'Compte Client Approuvé' : kycStatus === 'pending' ? 'Vérification en cours' : 'KYC requis : identité non vérifiée'}
                            </h4>
                            <p className="text-[10px] text-gray-500 mt-0.5 leading-tight">
                              {kycStatus === 'verified' ? 'Votre identité a été validée d\'un commun accord. Limites de transactions augmentées.' : kycStatus === 'pending' ? 'Nos équipes valident vos documents. Traitement dans environ 15 secondes.' : 'Téléchargez une pièce d\'identité (CNI/Passeport) pour débrider vos dépôts.'}
                            </p>
                          </div>
                        </div>

                        {/* KYC interactive file picker simulation */}
                        {kycStatus === 'none' && (
                          <div className="space-y-3 bg-slate-50 border border-gray-150 p-4 rounded-2xl">
                            <h4 className="text-[11px] font-black text-slate-900 uppercase">Documents requis pour approbation d'identité</h4>
                            
                            {/* CNI Upload Area */}
                            <div className="space-y-1">
                              <span className="text-[9.5px] text-gray-500 font-extrabold block uppercase tracking-wider">1. Pièce d'identité (Recto / Verso CNI ou Passeport)</span>
                              <div className="h-[60px] cursor-pointer hover:bg-slate-100 border border-dashed border-gray-300 rounded-xl bg-white flex items-center justify-center gap-2" onClick={() => { setKycDocUrl('simulate_passport.jpg'); showToast("Image de la pièce d'identité sélectionnée !"); }}>
                                <Upload className="w-4 h-4 text-gray-400" />
                                <span className="text-[11px] text-gray-500 font-bold">{kycDocUrl ? '✓ carte_identite_nationale.jpg' : 'Sélectionner le document'}</span>
                              </div>
                            </div>

                            {/* Selfie upload Area */}
                            <div className="space-y-1">
                              <span className="text-[9.5px] text-gray-500 font-extrabold block uppercase tracking-wider">2. Selfie de face (Pour rapprochement de visage)</span>
                              <div className="h-[60px] cursor-pointer hover:bg-slate-100 border border-dashed border-gray-300 rounded-xl bg-white flex items-center justify-center gap-2" onClick={() => { setKycSelfieUrl('simulate_selfie.jpg'); showToast("Photo selfie sélectionnée !"); }}>
                                <Camera className="w-4 h-4 text-gray-400" />
                                <span className="text-[11px] text-gray-500 font-bold">{kycSelfieUrl ? '✓ selfie_rapprochement.jpg' : 'Prendre un selfie en direct'}</span>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => {
                                if (!kycDocUrl || !kycSelfieUrl) {
                                  showToast("Veuillez sélectionner les deux justificatifs !");
                                  return;
                                }
                                setKycStatus('pending');
                                showToast("Documents KYC reçus ! Validation lancée.");
                                
                                // Auto-validate inside 15 seconds to surprise and validate user action!
                                setTimeout(() => {
                                  setKycStatus('verified');
                                  setToastMessage({
                                    title: "Félicitations KYC vérifié ! 🛡️",
                                    body: "Vos pièces justificatives d'identité ont été validées avec succès par notre service conformité."
                                  });
                                }, 15000);
                              }}
                              className="w-full h-[42px] bg-slate-900 text-white font-bold rounded-xl text-xs uppercase tracking-wider mt-1"
                            >
                              Soumettre le dossier KYC
                            </button>
                          </div>
                        )}

                        {kycStatus === 'pending' && (
                          <div className="space-y-2.5 p-4 border border-amber-200 bg-amber-50/10 rounded-2xl text-center">
                            <div className="w-8 h-8 rounded-full border-4 border-amber-500 border-t-transparent animate-spin mx-auto mb-1"></div>
                            <h4 className="text-[12.5px] font-black text-slate-900 leading-none">Vérification en temps réel...</h4>
                            <p className="text-[10.5px] text-gray-400 font-medium">
                              La machine de validation automatique analyse l'authenticité des selfies et des codes barres CNI. Patientez quelques instants...
                            </p>
                          </div>
                        )}

                        {kycStatus === 'verified' && (
                          <div className="text-center py-2 space-y-1 border border-green-200 bg-green-50/10 rounded-2xl p-4">
                            <span className="text-2xl block">🎉</span>
                            <h4 className="text-[13.0px] font-black text-emerald-800">Aucune action requise !</h4>
                            <p className="text-[11.0px] text-gray-500 font-medium leading-relaxed">
                              Votre profil dispose de la marque <strong>Conformité Or ✓</strong>. Vous pouvez recharger, transférer et commander sans plafond limitatif. Merci pour votre intégrité !
                            </p>
                          </div>
                        )}

                        {kycStatus !== 'verified' && (
                          <button
                            type="button"
                            onClick={() => { setKycStatus('verified'); showToast("Profil forcé en vérifié pour démo !"); }}
                            className="w-full h-[32px] text-[10px] text-rose-500 font-bold hover:underline"
                          >
                            [Démo] Forcer l'approbation du KYC immédiatement
                          </button>
                        )}
                      </div>
                    )}

                    {/* INTERACTIVE MODIFY PROFILE DETAILS */}
                    {activeProfileModal === 'edit_profile' && (
                      <div className="space-y-4 text-left animate-fade-in text-xs">
                        <h3 className="text-sm font-black text-slate-900 border-b border-gray-150 pb-2 flex items-center gap-1.5">
                          👤 {language === 'fr' ? 'Personnaliser mon profil' : 'Customize my profile'}
                        </h3>

                        {/* Banner cover picker */}
                        <div className="space-y-1.5">
                          <label className="text-gray-400 font-extrabold text-[9px] uppercase block">
                            🌄 {language === 'fr' ? 'Image de couverture' : 'Cover Banner'}
                          </label>
                          <div className="w-full h-18 rounded-xl overflow-hidden relative border border-gray-200 shadow-2xs">
                            <img src={profileCoverUrl} className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/30 flex items-center justify-center text-white text-[10px] font-bold">
                              {language === 'fr' ? 'Visière active' : 'Active Cover'}
                            </div>
                          </div>
                          <div className="flex gap-2.5 overflow-x-auto no-scrollbar py-0.5">
                            {[
                              { label: "Gourmet", url: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=200&auto=format&fit=crop&q=80' },
                              { label: "Braisage", url: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=200&auto=format&fit=crop&q=80' },
                              { label: "Riz Gras", url: 'https://images.unsplash.com/photo-1604329760661-e71dc83f8f26?w=200&auto=format&fit=crop&q=80' },
                              { label: "Burkina", url: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=200&auto=format&fit=crop&q=80' }
                            ].map((cov) => (
                              <button
                                key={cov.label}
                                type="button"
                                onClick={() => {
                                  setProfileCoverUrl(cov.url);
                                  localStorage.setItem('DODO_CLIENT_COVER', cov.url);
                                  showToast(language === 'fr' ? `Couverture "${cov.label}" appliquée !` : `Cover applied!`);
                                }}
                                className={`text-[9px] font-extrabold px-2.5 py-1.5 bg-white border rounded-lg shrink-0 transition ${profileCoverUrl === cov.url ? 'border-[#E52327] text-[#E52327]' : 'border-gray-200 text-gray-500 hover:text-gray-800'}`}
                              >
                                {cov.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Interactive Profile Picture Picker */}
                        <div className="flex flex-col items-center gap-2 pt-1.5">
                          <label className="text-gray-400 font-extrabold text-[9px] uppercase self-start">
                            📸 {language === 'fr' ? 'Avatar & Photo de profil' : 'Profile Picture'}
                          </label>
                          
                          <div className="flex items-center gap-4 w-full bg-slate-50 p-3 rounded-2xl border border-gray-150">
                            <div className="relative w-15 h-15 rounded-full overflow-hidden border-2 border-slate-900/10 shrink-0">
                              <LazyImage 
                                src={profile.avatar_url} 
                                alt={profile.name} 
                                className="w-full h-full object-cover"
                              />
                            </div>
                            
                            <div className="flex-1 space-y-1">
                              <h4 className="font-extrabold text-[11px] text-slate-800">{language === 'fr' ? 'Importer une photo' : 'Upload custom photo'}</h4>
                              <p className="text-[9.5px] text-gray-400 leading-tight">
                                {customAvatarUploaded 
                                  ? (language === 'fr' ? 'Photo personnalisée active !' : 'Custom photo is active!') 
                                  : (language === 'fr' ? 'Simuler l\'envoi d\'images PNG/JPG' : 'Simulate PNG/JPG image upload')}
                              </p>
                              <div className="flex gap-2">
                                <label className="cursor-pointer bg-white border border-gray-300 hover:bg-gray-100 text-slate-700 font-extrabold px-2.5 py-1 rounded-lg text-[9px] transition inline-block uppercase tracking-wider">
                                  {language === 'fr' ? 'Choisir fichier 📂' : 'Browse... 📂'}
                                  <input 
                                    type="file" 
                                    accept="image/*" 
                                    className="hidden" 
                                    onChange={(e) => {
                                      if (e.target.files && e.target.files[0]) {
                                        const fakeLocalUrl = URL.createObjectURL(e.target.files[0]) || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80';
                                        const updatedDef = { ...profile, avatar_url: fakeLocalUrl };
                                        setProfile(updatedDef);
                                        saveProfile(updatedDef);
                                        setCustomAvatarUploaded(true);
                                        showToast(language === 'fr' ? "Fichier importé avec succès (simulation !" : "File uploaded successfully!");
                                      }
                                    }}
                                  />
                                </label>
                              </div>
                            </div>
                          </div>
                          
                          {/* Avatars selections */}
                          <div className="w-full">
                            <p className="text-gray-450 font-bold text-[10px] mb-1">{language === 'fr' ? 'Galerie des Chefs de Dodo :' : 'Dodo Chefs list:'}</p>
                            <div className="flex gap-2 overflow-x-auto no-scrollbar py-1">
                              {[
                                { label: "Moussa 🍌\nAlloco Lover", url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80' },
                                { label: "Fatou 🍲\nChef Marmite", url: 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=150&auto=format&fit=crop&q=80' },
                                { label: "Blaise 🏍️\nMoto-Express", url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80' },
                                { label: "Safi 🇧🇫\nBurkina Fan", url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80' },
                              ].map((avOption) => (
                                <button
                                  key={avOption.label}
                                  type="button"
                                  onClick={() => {
                                    const updatedDef = { ...profile, avatar_url: avOption.url };
                                    setProfile(updatedDef);
                                    saveProfile(updatedDef);
                                    setCustomAvatarUploaded(false);
                                    showToast(language === 'fr' ? `Badge "${avOption.label.split('\n')[1]}" activé !` : `Style updated!`);
                                  }}
                                  className={`flex items-center gap-1.5 p-1.5 bg-white border rounded-xl shrink-0 transition text-left ${profile.avatar_url === avOption.url ? 'border-[#E52327] bg-rose-50/10' : 'border-gray-200 hover:border-gray-300'}`}
                                >
                                  <img src={avOption.url} className="w-8 h-8 rounded-full object-cover" />
                                  <div className="leading-tight text-[8px]">
                                    <div className="font-extrabold text-slate-800">{avOption.label.split('\n')[0]}</div>
                                    <div className="text-gray-400 font-bold">{avOption.label.split('\n')[1]}</div>
                                  </div>
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Preferences section */}
                        <div className="space-y-2 pt-1 border-t border-gray-100">
                          <label className="text-gray-400 font-extrabold text-[9px] uppercase block">
                            🍽️ {language === 'fr' ? 'Préférences Gustatives' : 'Gustatory Preferences'}
                          </label>
                          <div className="grid grid-cols-2 gap-1.5">
                            {["Babenda", "Poulet grillé", "Riz gras", "Tô sauce", "Alloco", "Dégué royal"].map((item) => {
                              const isActive = tastePreferences.includes(item);
                              return (
                                <button
                                  key={item}
                                  type="button"
                                  onClick={() => {
                                    let updated;
                                    if (isActive) {
                                      updated = tastePreferences.filter(x => x !== item);
                                    } else {
                                      updated = [...tastePreferences, item];
                                    }
                                    setTastePreferences(updated);
                                    localStorage.setItem('DODO_CLIENT_PREFS', JSON.stringify(updated));
                                  }}
                                  className={`flex items-center gap-1.5 p-2 rounded-xl border text-left font-bold transition-all ${
                                    isActive 
                                      ? 'border-[#E52327] bg-rose-500/5 text-[#E52327]' 
                                      : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                                  }`}
                                >
                                  <span>{isActive ? '✓' : '+'}</span>
                                  <span>{item}</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* Allergies / Notes exclusions */}
                        <div className="space-y-2 pt-1">
                          <label className="text-gray-400 font-extrabold text-[9px] uppercase block">
                            🌶️ {language === 'fr' ? 'Allergies & Exclusions de cuisson' : 'Allergies & Cooking Exclusions'}
                          </label>
                          <div className="grid grid-cols-2 gap-1.5">
                            {["Sans piment fort", "Sans cube maggi", "Huile légère", "Sans arachide"].map((item) => {
                              const isActive = allergies.includes(item);
                              return (
                                <button
                                  key={item}
                                  type="button"
                                  onClick={() => {
                                    let updated;
                                    if (isActive) {
                                      updated = allergies.filter(x => x !== item);
                                    } else {
                                      updated = [...allergies, item];
                                    }
                                    setAllergies(updated);
                                    localStorage.setItem('DODO_CLIENT_ALLERGIES', JSON.stringify(updated));
                                  }}
                                  className={`flex items-center gap-1.5 p-2 rounded-xl border text-left font-bold transition-all ${
                                    isActive 
                                      ? 'border-red-500 bg-red-50 text-red-700' 
                                      : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                                  }`}
                                >
                                  <span>{isActive ? '⚠️' : '▫️'}</span>
                                  <span>{item}</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* Text form fields */}
                        <div className="space-y-3 pt-2 text-xs border-t border-gray-100">
                          <div className="space-y-1">
                            <label className="text-gray-500 font-extrabold text-[10px] uppercase">Nom complet</label>
                            <input 
                              type="text" 
                              value={newName}
                              onChange={(e) => setNewName(e.target.value)}
                              placeholder="Moussa Traoré"
                              className="w-full h-[38px] px-3 bg-gray-50 border border-gray-150 rounded-xl font-semibold outline-none"
                            />
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              if (!newName.trim()) {
                                showToast("Le nom ne peut pas être vide.");
                                return;
                              }
                              const finalProf = { ...profile, name: newName };
                              setProfile(finalProf);
                              saveProfile(finalProf);
                              showToast(language === 'fr' ? "Paramètres de profil enregistrés ! ✓" : "Profile settings saved! ✓");
                              setActiveProfileModal(null);
                            }}
                            className="w-full h-[41px] bg-[#E52327] text-white font-bold rounded-xl text-xs uppercase tracking-wider shadow-xs transition"
                          >
                            {language === 'fr' ? 'Enregistrer tous les paramètres' : 'Save all settings'}
                          </button>
                        </div>
                      </div>
                    )}

                    {/* INTERACTIVE EMAIL / PASSWORD SECURITY EDIT */}
                    {activeProfileModal === 'security' && (
                      <div className="space-y-4 text-left animate-fade-in text-xs">
                        <h3 className="text-sm font-black text-slate-900 border-b border-gray-150 pb-2 flex items-center justify-between">
                          <span>🔒 {language === 'fr' ? 'Sécurité & Authentification' : 'Security & Authentication'}</span>
                          <span className={`text-[8.5px] px-2 py-0.5 rounded-md font-black uppercase ${twoFactorEnabled ? 'bg-green-150 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                            {twoFactorEnabled ? '2FA ON' : '2FA OFF'}
                          </span>
                        </h3>

                        {/* 2FA Toggle switch match mockup design */}
                        <div className="p-3.5 bg-slate-50 border border-slate-100 rounded-2xl space-y-2">
                          <div className="flex justify-between items-center">
                            <div>
                              <h4 className="font-extrabold text-[11.5px] text-slate-900">Double Facteur (2FA SMS)</h4>
                              <p className="text-[9.5px] text-gray-400 font-medium leading-tight">Sûr et instantané par SMS sur votre numéro {profile.phone}</p>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                const nextState = !twoFactorEnabled;
                                setTwoFactorEnabled(nextState);
                                localStorage.setItem('DODO_CLIENT_2FA', nextState ? 'true' : 'false');
                                showToast(nextState 
                                  ? (language === 'fr' ? "Double authentification activée ! 🔒" : "2FA enabled! 🔒") 
                                  : (language === 'fr' ? "2FA désactivé (Attention à la sécurité)" : "2FA disabled")
                                );
                              }}
                              className={`w-11 h-6 rounded-full p-0.5 transition-colors duration-200 outline-none ${twoFactorEnabled ? 'bg-green-500' : 'bg-gray-300'}`}
                            >
                              <div className={`bg-white w-5 h-5 rounded-full shadow-md transform transition-transform duration-200 ${twoFactorEnabled ? 'translate-x-5' : 'translate-x-0'}`} />
                            </button>
                          </div>
                        </div>

                        <div className="space-y-3 pt-1">
                          <div className="space-y-1">
                            <label className="text-gray-500 font-extrabold text-[10px] uppercase">Adresse email de connexion</label>
                            <input 
                              type="email" 
                              value={newEmail}
                              onChange={(e) => setNewEmail(e.target.value)}
                              placeholder="moussa@dodo.bf"
                              className="w-full h-[38px] px-3 bg-gray-50 border border-gray-150 rounded-xl font-semibold outline-none"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-gray-500 font-extrabold text-[10px] uppercase">Nouveau mot de passe</label>
                            <input 
                              type="password" 
                              placeholder="Minimun 6 caractères"
                              value={newPassword}
                              onChange={(e) => setNewPassword(e.target.value)}
                              className="w-full h-[38px] px-3 bg-gray-50 border border-gray-150 rounded-xl outline-none"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-gray-500 font-extrabold text-[10px] uppercase">Confirmer le nouveau mot de passe</label>
                            <input 
                              type="password" 
                              placeholder="Confirmez pour authentification"
                              value={confirmPassword}
                              onChange={(e) => setConfirmPassword(e.target.value)}
                              className="w-full h-[38px] px-3 bg-gray-50 border border-gray-150 rounded-xl outline-none"
                            />
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              if (!newEmail.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
                                showToast("Adresse email invalide.");
                                return;
                              }
                              if (newPassword) {
                                if (newPassword.length < 6) {
                                  showToast("Le mot de passe doit comporter au moins 6 caractères.");
                                  return;
                                }
                                if (newPassword !== confirmPassword) {
                                  showToast("Les mots de passe ne correspondent pas !");
                                  return;
                                }
                              }
                              
                              const finalProf = { ...profile, email: newEmail };
                              setProfile(finalProf);
                              saveProfile(finalProf);
                              
                              setNewPassword('');
                              setConfirmPassword('');
                              showToast(language === 'fr' ? "Identifiants et sécurité mis à jour ! ✓" : "Security configurations updated!");
                              setActiveProfileModal(null);
                            }}
                            className="w-full h-[41px] bg-[#E52327] text-white font-bold rounded-xl text-xs uppercase tracking-wider shadow-xs transition"
                          >
                            {language === 'fr' ? 'Mettre à jour la sécurité' : 'Update Security Settings'}
                          </button>
                        </div>
                      </div>
                    )}
                    {activeProfileModal === 'addresses' && (
                      <div className="space-y-4 text-left animate-fade-in text-xs">
                        <h3 className="text-sm font-black text-slate-900 border-b border-gray-150 pb-2 flex items-center gap-2">
                          📌 {language === 'fr' ? 'Vos adresses sélectionnées' : 'Your Favorite Addresses'}
                        </h3>
                        
                        <div className="space-y-2 max-h-[160px] overflow-y-auto no-scrollbar pr-1">
                          {profile.addresses.map((addr, index) => {
                            const hasTag = addr.includes(': ');
                            const label = hasTag ? addr.split(': ')[0] : '📍';
                            const displayAddr = hasTag ? addr.split(': ')[1] : addr;
                            return (
                              <div key={index} className="flex justify-between items-center bg-gray-50 border border-gray-150 rounded-xl p-3 font-semibold text-gray-800">
                                <div className="flex items-center gap-2">
                                  <span className="bg-white border text-[10px] px-1.5 py-0.5 rounded-md shadow-3xs">{label}</span>
                                  <span className="text-[11px] leading-tight text-gray-900">{displayAddr}</span>
                                </div>
                                <button 
                                  onClick={() => {
                                    const updated = profile.addresses.filter((_, i) => i !== index);
                                    const updatedProf = { ...profile, addresses: updated };
                                    setProfile(updatedProf);
                                    saveProfile(updatedProf);
                                    showToast(language === 'fr' ? "Adresse retirée" : "Address removed");
                                  }}
                                  className="text-rose-500 font-extrabold text-[10px] hover:text-rose-600 transition tracking-wider uppercase"
                                >
                                  {language === 'fr' ? 'Supprimer' : 'Delete'}
                                </button>
                              </div>
                            );
                          })}
                        </div>
                        
                        <div className="space-y-3 pt-2 border-t border-gray-100">
                          <label className="text-[10px] font-extrabold uppercase text-gray-500">{language === 'fr' ? "1. Catégorie d'adresse" : "1. Select Label Tag"}</label>
                          <div className="flex gap-1.5 overflow-x-auto no-scrollbar py-0.5">
                            {['🏠 Maison', '💼 Bureau', '🍲 Maquis favori', '❤️ Copain', '📍 Autre'].map((lbl) => (
                              <button
                                key={lbl}
                                type="button"
                                onClick={() => {
                                  setSelectedAddressLabel(lbl);
                                  showToast(`Étiquette "${lbl}" choisie !`);
                                }}
                                className={`text-[9.5px] font-black px-2.5 py-1.5 bg-white border rounded-xl shrink-0 transition-all ${selectedAddressLabel === lbl ? 'border-[#E52327] text-[#E52327] bg-rose-500/5' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}
                              >
                                {lbl}
                              </button>
                            ))}
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10px] font-extrabold uppercase text-gray-500">{language === 'fr' ? '2. Adresse à Ouagadougou' : '2. Enter Location Details'}</label>
                            <div className="flex gap-2">
                              <input 
                                type="text" 
                                placeholder="Ex: Patte d'Oie, Rue 14.22" 
                                value={newAddressInput}
                                onChange={(e) => setNewAddressInput(e.target.value)}
                                className="flex-1 px-3 py-2.5 bg-gray-50 border border-gray-150 rounded-xl text-xs outline-none"
                              />
                              <button 
                                onClick={() => {
                                  if (newAddressInput.trim() === '') return;
                                  const formattedAddr = `${selectedAddressLabel}: ${newAddressInput}`;
                                  const updated = [...profile.addresses, formattedAddr];
                                  const updatedProf = { ...profile, addresses: updated };
                                  setProfile(updatedProf);
                                  saveProfile(updatedProf);
                                  setNewAddressInput('');
                                  showToast(language === 'fr' ? "Nouvelle adresse étiquetée et enregistrée ! ✓" : "New address logged!");
                                }}
                                className="bg-[#E52327] hover:bg-[#c51e22] text-white px-4 py-2 font-black rounded-xl text-xs shrink-0 transition"
                              >
                                {language === 'fr' ? 'Ajouter' : 'Save'}
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* FAVORITES PANEL */}
                    {activeProfileModal === 'favorites' && (
                      <div className="space-y-4">
                        <h3 className="text-sm font-black text-slate-900 border-b border-gray-1.5 pb-2 flex items-center gap-2">
                          ❤️ Vos maquis favoris
                        </h3>
                        {favorites.length > 0 ? (
                          <div className="space-y-3">
                            {restaurants.filter(r => favorites.includes(r.id)).map(rest => (
                              <div 
                                key={rest.id} 
                                className="flex gap-3 bg-gray-50 p-3.5 border border-gray-150 rounded-xl items-center cursor-pointer hover:bg-rose-50/20"
                                onClick={() => {
                                  setSelectedRestaurant(rest);
                                  setActiveProfileModal(null);
                                  changeScreen(3);
                                }}
                              >
                                <img src={rest.image_url} className="w-12 h-12 object-cover rounded-lg shrink-0" referrerPolicy="no-referrer" />
                                <div className="flex-1 leading-tight">
                                  <h4 className="font-extrabold text-[13px] text-gray-900">{rest.name}</h4>
                                  <p className="text-[10px] text-gray-400 mt-1">{rest.category}</p>
                                </div>
                                <Star className="w-4 h-4 fill-rose-500 text-rose-500" />
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-gray-500 text-center py-[20px]">Vous n'avez pas encore de maquis favoris.</p>
                        )}
                      </div>
                    )}

                    {/* PAYMENTS PANEL */}
                    {activeProfileModal === 'payments' && (
                      <div className="space-y-4 text-left animate-fade-in">
                        <h3 className="text-sm font-black text-[#1E293B] border-b border-gray-150 pb-2 flex justify-between items-center">
                          <span>💳 {language === 'fr' ? 'Modes de paiement' : 'Payment Methods'}</span>
                          {!isAddingCard && (
                            <button
                              onClick={() => setIsAddingCard(true)}
                              className="text-[10px] font-black text-[#E52327] uppercase tracking-wider hover:underline"
                            >
                              + {language === 'fr' ? 'Ajouter carte' : 'Add Card'}
                            </button>
                          )}
                        </h3>

                        {!isAddingCard ? (
                          <>
                            <div className="space-y-2 text-xs">
                              {profile.payment_methods.map((method, index) => {
                                const isCard = method.toLowerCase().includes('carte') || method.toLowerCase().includes('visa') || method.toLowerCase().includes('mastercard') || method.match(/\d{4}/);
                                const getMethodDesc = (m: string) => {
                                  const norm = m.toLowerCase();
                                  if (norm.includes('orange')) return language === 'fr' ? 'Sûr et instantané' : 'Secure & instant';
                                  if (norm.includes('moov')) return language === 'fr' ? 'Portefeuille Mobile sans contact' : 'Contactless Mobile Wallet';
                                  if (norm.includes('wave')) return language === 'fr' ? 'Paiement 100% gratuit sans frais' : '100% Free payment, zero fees';
                                  if (norm.includes('telecel')) return language === 'fr' ? 'Compte mobile sécurisé' : 'Secure mobile account';
                                  if (norm.includes('paypal')) return language === 'fr' ? 'Transaction internationale cryptée' : 'Encrypted international transfer';
                                  return language === 'fr' ? 'Monnaie remise au livreur' : 'Cash handed to driver';
                                };
                                return (
                                  <div key={index} className="flex gap-3 items-center bg-white border border-gray-150 p-3.5 rounded-2xl font-semibold relative shadow-4xs">
                                    <div className="w-14 h-8 shrink-0 flex items-center justify-center bg-gray-50 border border-gray-100 rounded-xl p-0.5 overflow-hidden">
                                      <PaymentLogoSelector method={method} size={28} />
                                    </div>
                                    <div className="flex-1 leading-tight">
                                      <h4 className="text-gray-900 font-extrabold text-xs">{method}</h4>
                                      <p className="text-[10px] text-gray-400 mt-0.5 font-medium">
                                        {getMethodDesc(method)}
                                      </p>
                                    </div>
                                    {isCard && (
                                      <button 
                                        onClick={() => {
                                          const updatedMethods = profile.payment_methods.filter((_, idx) => idx !== index);
                                          const updatedProfile = { ...profile, payment_methods: updatedMethods };
                                          setProfile(updatedProfile);
                                          saveProfile(updatedProfile);
                                          showToast(language === 'fr' ? "Carte bancaire retirée !" : "Card removed!");
                                        }}
                                        className="text-gray-400 hover:text-rose-500 font-bold text-[10px] absolute right-3"
                                      >
                                        {language === 'fr' ? 'Retirer' : 'Remove'}
                                      </button>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </>
                        ) : (
                          <div className="bg-slate-50 border border-gray-200 rounded-2xl p-4.5 space-y-3.5 text-xs text-slate-800">
                            <h4 className="font-extrabold text-xs text-slate-900 flex items-center gap-1.5 uppercase tracking-wider">
                              <span>💳 {language === 'fr' ? 'Nouvelle Carte Bancaire' : 'New Credit Card'}</span>
                            </h4>
                            
                            <div className="space-y-2.5">
                              <div className="space-y-1">
                                <label className="text-[10px] font-extrabold text-gray-400 uppercase">{language === 'fr' ? 'Titulaire de la carte' : 'Cardholder name'}</label>
                                <input
                                  type="text"
                                  placeholder="Moussa Traoré"
                                  value={newCardName}
                                  onChange={(e) => setNewCardName(e.target.value)}
                                  className="w-full h-[38px] px-3 bg-white border border-gray-200 rounded-xl outline-none"
                                />
                              </div>

                              <div className="space-y-1">
                                <label className="text-[10px] font-extrabold text-gray-400 uppercase">{language === 'fr' ? 'Numéro de carte' : 'Card number'}</label>
                                <input
                                  type="text"
                                  placeholder="4000 1234 5678 9010"
                                  maxLength={19}
                                  value={newCardNumber}
                                  onChange={(e) => {
                                    const value = e.target.value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
                                    const formatted = value.match(/.{1,4}/g)?.join(' ') || value;
                                    setNewCardNumber(formatted);
                                  }}
                                  className="w-full h-[38px] px-3 bg-white border border-gray-200 rounded-xl outline-none font-mono font-semibold"
                                />
                              </div>

                              <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1 text-center">
                                  <label className="text-[10px] font-extrabold text-gray-400 uppercase block">{language === 'fr' ? 'Expiration (MM/AA)' : 'Expiry (MM/YY)'}</label>
                                  <input
                                    type="text"
                                    placeholder="12/28"
                                    maxLength={5}
                                    value={newCardExpiry}
                                    onChange={(e) => {
                                      let value = e.target.value.replace(/[^0-9]/g, '');
                                      if (value.length > 2) {
                                        value = value.substring(0, 2) + '/' + value.substring(2, 4);
                                      }
                                      setNewCardExpiry(value);
                                    }}
                                    className="w-full h-[38px] px-3 bg-white border border-gray-200 rounded-xl outline-none text-center font-semibold"
                                  />
                                </div>
                                <div className="space-y-1 text-center">
                                  <label className="text-[10px] font-extrabold text-gray-400 uppercase block">CVV</label>
                                  <input
                                    type="password"
                                    placeholder="•••"
                                    maxLength={3}
                                    value={newCardCvv}
                                    onChange={(e) => setNewCardCvv(e.target.value.replace(/[^0-9]/g, ''))}
                                    className="w-full h-[38px] px-3 bg-white border border-gray-200 rounded-xl outline-none text-center"
                                  />
                                </div>
                              </div>
                            </div>

                            <div className="flex gap-2 pt-1 font-black">
                              <button
                                type="button"
                                onClick={() => {
                                  setIsAddingCard(false);
                                  setNewCardNumber('');
                                  setNewCardName('');
                                  setNewCardExpiry('');
                                  setNewCardCvv('');
                                }}
                                className="flex-1 h-[40px] border border-gray-300 hover:bg-white text-slate-700 font-bold rounded-xl transition uppercase tracking-wider text-[10px]"
                              >
                                {language === 'fr' ? 'Annuler' : 'Cancel'}
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  if (!newCardName.trim()) {
                                    showToast(language === 'fr' ? "Indiquez le nom du titulaire" : "Enter holder's name");
                                    return;
                                  }
                                  if (newCardNumber.replace(/\s/g, '').length < 13) {
                                    showToast(language === 'fr' ? "Numéro de carte invalide" : "Invalid card number");
                                    return;
                                  }
                                  if (newCardExpiry.length < 5) {
                                    showToast(language === 'fr' ? "Expiration invalide (MM/AA)" : "Invalid expiry date (MM/YY)");
                                    return;
                                  }
                                  if (newCardCvv.length < 3) {
                                    showToast("CVV invalide");
                                    return;
                                  }

                                  const formattedName = `${newCardNumber.startsWith('4') ? 'Visa' : 'MasterCard'} •••• ${newCardNumber.slice(-4)}`;
                                  const updatedPms = [...profile.payment_methods, formattedName];
                                  const nextProf = { ...profile, payment_methods: updatedPms };
                                  setProfile(nextProf);
                                  saveProfile(nextProf);
                                  showToast(language === 'fr' ? "Carte ajoutée avec succès !" : "Card added successfully!");
                                  setIsAddingCard(false);
                                  
                                  // Clear form
                                  setNewCardNumber('');
                                  setNewCardName('');
                                  setNewCardExpiry('');
                                  setNewCardCvv('');
                                }}
                                className="flex-1 h-[40px] bg-[#E52327] text-white font-bold rounded-xl hover:bg-rose-700 transition uppercase tracking-wider text-[10px]"
                              >
                                {language === 'fr' ? 'Enregistrer' : 'Save'}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* NOTIFICATIONS PANEL */}
                    {activeProfileModal === 'notifications' && (
                      <div className="space-y-4">
                        <h3 className="text-sm font-black text-slate-900 border-b border-gray-150 pb-2">
                          🔔 Préférences de notifications
                        </h3>
                        <div className="space-y-4 py-2">
                          <div className="flex justify-between items-center text-xs">
                            <div>
                              <h4 className="font-extrabold">Notifications Push</h4>
                              <p className="text-[10px] text-gray-400">Statuts de commandes en direct du livreur.</p>
                            </div>
                            <input type="checkbox" defaultChecked className="accent-rose-600 scale-120" />
                          </div>
                          <div className="flex justify-between items-center text-xs">
                            <div>
                              <h4 className="font-extrabold font-bold">SMS de rappel</h4>
                              <p className="text-[10px] text-gray-400">Rappels de livraison et code promo Dodo.</p>
                            </div>
                            <input type="checkbox" defaultChecked className="accent-rose-600 scale-120" />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* HELP PANEL */}
                    {activeProfileModal === 'help' && (
                      <div className="space-y-4">
                        <h3 className="text-sm font-black text-slate-900 border-b border-gray-150 pb-2">
                          ❓ Support client & Aide
                        </h3>
                        <p className="text-xs text-gray-650 leading-relaxed">
                          Besoin de modifier une commande, de signaler une erreur ou de postuler comme livreur ?
                        </p>
                        <div className="space-y-2">
                          <a 
                            href="tel:+22670123456" 
                            className="h-[44px] w-full bg-rose-50 text-[#E52327] rounded-xl font-bold flex items-center justify-center gap-2"
                          >
                            <Phone className="w-4.5 h-4.5" /> Appeler le support : +226 70 12 34 56
                          </a>
                          <button 
                            onClick={() => { showToast("Demande de rappel déposée !"); setActiveProfileModal(null); }}
                            className="h-[44px] w-full bg-rose-600 text-white rounded-xl font-bold flex items-center justify-center gap-2"
                          >
                            ✉️ Demander un rappel urgent
                          </button>
                        </div>
                      </div>
                    )}

                    {/* ABOUT PANEL */}
                    {activeProfileModal === 'about' && (
                      <div className="space-y-3 text-center py-4">
                        <div className="w-[80px] h-[80px] bg-rose-500 rounded-full flex items-center justify-center text-white mx-auto mb-2 font-bold text-[32px]">
                          D
                        </div>
                        <h4 className="font-black text-sm text-gray-900">Dodo Livraison v1.0.0</h4>
                        <p className="text-xs text-gray-500 max-w-[240px] mx-auto mt-1 leading-snug">
                          Une application fièrement conçue au Burkina Faso pour simplifier l'accès aux maquis de Ouagadougou.
                        </p>
                        <p className="text-[10px] text-gray-400 mt-4 leading-none">© 2026 Dodo Inc. Tous droits réservés.</p>
                        <button 
                          onClick={() => setActiveProfileModal(null)}
                          className="mt-4 px-5 py-2 border border-gray-200 hover:bg-gray-50 text-gray-700 font-bold text-xs rounded-xl"
                        >
                          Fermer
                        </button>
                      </div>
                    )}

                    <div className="pt-2 text-right">
                      <button 
                        onClick={() => setActiveProfileModal(null)}
                        className="text-xs font-black text-rose-600 hover:underline"
                      >
                        Retour
                      </button>
                    </div>

                  </motion.div>
                </div>
              )}
            </AnimatePresence>

          </div>
        )}

        {/* =======================================================
            SCREEN 8: RECHERCHE & CARTE INTERACTIVE (Uber Eats style)
            ======================================================= */}
        {currentScreenId === 8 && (
          <div className="flex-1 flex flex-col bg-slate-50 overflow-hidden pb-[70px]">
            {/* Search Header */}
            <div className="bg-white p-4 pb-3 border-b border-gray-100 flex flex-col gap-3 sticky top-0 z-30 shrink-0 shadow-2xs">
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => {
                    changeScreen(2); // Go back home
                  }}
                  className="w-9 h-9 rounded-full bg-gray-50 hover:bg-gray-100 flex items-center justify-center transition shrink-0"
                >
                  <ArrowLeft className="w-4.5 h-4.5 text-gray-950 stroke-[2.5]" />
                </button>
                <div className="flex-1 relative">
                  <input 
                    type="text"
                    placeholder={language === 'fr' ? "Rechercher maquis, alloco, riz, tô..." : "Search maquis, dishes, alloco..."}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full h-[41px] pl-[38px] pr-8 bg-[#F2F2F7] rounded-xl text-xs font-bold text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-rose-500/50"
                  />
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  {searchQuery && (
                    <button 
                      onClick={() => setSearchQuery('')} 
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 bg-gray-200 hover:bg-gray-300 text-gray-700 w-4.5 h-4.5 rounded-full flex items-center justify-center text-[10px] font-black"
                    >
                      ×
                    </button>
                  )}
                </div>

                {/* Microphone search element */}
                <button
                  type="button"
                  onClick={startVoiceSearch}
                  className={`w-[41px] h-[41px] rounded-xl flex items-center justify-center transition border shrink-0 ${
                    isListening 
                      ? 'bg-rose-500 border-rose-500 text-white animate-pulse shadow-md shadow-rose-500/25' 
                      : 'bg-[#F2F2F7] border-gray-150 hover:bg-gray-100 text-[#E52327]'
                  }`}
                  title={language === 'fr' ? 'Recherche vocale (Web Speech)' : 'Voice Search (Web Speech)'}
                >
                  {isListening ? '🎙️' : '🎤'}
                </button>
              </div>

              {/* Dynamic Voice Tip / Transcription Caption Banner */}
              {(isListening || voiceBanner) && (
                <div className="bg-gradient-to-r from-red-600 to-rose-500 text-white px-3.5 py-2.5 rounded-xl flex items-center justify-between text-[11.5px] font-black animate-pulse shadow-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">🗣️</span>
                    <span className="leading-tight">
                      {voiceBanner || (language === 'fr' 
                        ? "Dites par exemple : 'Poulet braisé Chez Fatou'..." 
                        : "Try saying: 'Alloco or Riz gras Chez Fatou'...")}
                    </span>
                  </div>
                  {isListening && (
                    <span className="bg-white/20 text-white text-[9px] px-1.5 py-0.5 rounded-md uppercase font-bold shrink-0">
                      ON
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Scrollable Container */}
            <div className="flex-1 overflow-y-auto no-scrollbar space-y-4 p-4">
              
              {/* Google Map Mock Widget - Integrated exactly here like requested! */}
              <div className="space-y-2">
                <div className="flex justify-between items-center px-1">
                  <h3 className="text-gray-950 font-black text-[13px] flex items-center gap-1.5 uppercase tracking-wider">
                    <span>🗺️ Carte Interactive</span>
                  </h3>
                  <span className="text-[10px] text-gray-400 font-bold bg-white px-2 py-0.5 rounded-md border border-gray-100">
                    Moi • {currentCity}
                  </span>
                </div>
                
                <div className="relative w-full h-[220px] bg-[#E1F0D4] rounded-2xl overflow-hidden border border-gray-100 shadow-xs z-0">
                  {/* Styled Map Graphics */}
                  <div className="absolute inset-0 opacity-40">
                    <div className="absolute top-5 left-0 right-0 h-1.5 bg-white -rotate-12"></div>
                    <div className="absolute top-16 left-0 right-0 h-2 bg-white rotate-[18deg]"></div>
                    <div className="absolute bottom-6 left-0 right-0 h-1 bg-white -rotate-[5deg]"></div>
                    <div className="absolute left-[30%] top-0 bottom-0 w-2.5 bg-white/80 rotate-[75deg]"></div>
                    <div className="absolute left-[65%] top-0 bottom-0 w-1.5 bg-white/70 -rotate-[35deg]"></div>
                    <div className="absolute top-10 left-12 w-6 h-6 rounded-full bg-blue-300 filter blur-sm"></div>
                    <div className="absolute bottom-6 right-16 w-8 h-8 rounded-full bg-blue-200 filter blur-sm"></div>
                  </div>

                  {/* Google logo watermark */}
                  <span className="absolute bottom-2 left-2 text-[10px] text-gray-500 font-semibold opacity-70">Google</span>

                  {/* Markers */}
                  {/* User blue dot */}
                  <div className="absolute top-[105px] left-[160px] z-20 flex flex-col items-center">
                    <div className="w-3.5 h-3.5 rounded-full bg-blue-600 border-2 border-white shadow-md animate-pulse"></div>
                    <span className="bg-white/85 backdrop-blur-[2px] text-[8px] px-1 py-0.5 rounded-md font-bold mt-1 text-gray-700 shadow-xs border border-gray-100">Moi</span>
                  </div>

                  {/* Restaurant Pins */}
                  {restaurants.map((rest, idx) => {
                    const positions = [
                      { top: '45px', left: '80px' },  // Chez Fatou
                      { top: '65px', left: '260px' }, // Le Bon Gout
                      { top: '150px', left: '210px' }, // Saveurs d'Afrique
                    ];
                    const pos = positions[idx] || { top: '70px', left: '70px' };
                    const isFav = favorites.includes(rest.id);
                    return (
                      <button
                        key={rest.id}
                        onClick={() => {
                          setSelectedRestaurant(rest);
                          changeScreen(3);
                          showToast(`Bienvenue chez ${rest.name} ! 🍳`);
                        }}
                        style={{ top: pos.top, left: pos.left }}
                        className="absolute z-20 transform -translate-x-1/2 -translate-y-1/2 hover:scale-115 active:scale-95 transition"
                      >
                        <div className="flex flex-col items-center">
                          <div className="relative">
                            <MapPin className="w-[30px] h-[30px] text-[#E52327] fill-[#E52327]/20 filter drop-shadow-md" />
                            <span className="absolute inset-x-0 top-0 text-[9px] text-white font-black flex justify-center pt-1">
                              {idx + 1}
                            </span>
                          </div>
                          <span className="whitespace-nowrap bg-white text-black font-extrabold text-[8.5px] px-1.5 py-0.5 rounded shadow-sm border border-gray-150">
                            {isFav ? '❤️ ' : ''}{rest.name.replace("Maquis ", "")}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Instant Search Tags / Recommandations */}
              <div className="space-y-2 text-left">
                <h4 className="text-gray-900 font-black text-[12.5px] px-1">Recherches populaires</h4>
                <div className="flex flex-wrap gap-2">
                  {[
                    { text: 'Tô de maïs', tag: 'Tô' },
                    { text: 'Poulet braisé', tag: 'Grillades' },
                    { text: 'Alloco chaud', tag: 'Alloco' },
                    { text: 'Soupe de poisson', tag: 'Soupe' },
                    { text: 'Déguè frais', tag: 'Déguè' },
                    { text: 'Riz gras', tag: 'Riz' }
                  ].map((pop) => (
                    <button
                      key={pop.text}
                      onClick={() => {
                        setSearchQuery(pop.text);
                        showToast(`Recherche de : ${pop.text}`);
                      }}
                      className="px-3 py-1.5 bg-white hover:bg-rose-50 border border-gray-150 rounded-xl text-[11px] font-bold text-gray-700 hover:text-[#E52327] hover:border-rose-200 transition"
                    >
                      {pop.text} 🔥
                    </button>
                  ))}
                </div>
              </div>

              {/* Filtering Results List - Beautiful Uber Eats Cards style */}
              <div className="space-y-3 text-left">
                <h4 className="text-gray-900 font-black text-[12.5px] px-1">
                  {searchQuery ? "Résultats de recherche" : "Maquis populaires à proximité"}
                </h4>

                <div className="space-y-3">
                  {restaurants
                    .filter(r => {
                      if (!searchQuery) return true;
                      const q = searchQuery.toLowerCase();
                      return r.name.toLowerCase().includes(q) || 
                             r.category.toLowerCase().includes(q) || 
                             currentCity.toLowerCase().includes(q);
                    })
                    .map((rest) => (
                      <div 
                        key={rest.id}
                        onClick={() => {
                          setSelectedRestaurant(rest);
                          changeScreen(3);
                        }}
                        className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-2xs hover:shadow-xs hover:border-gray-200 transition cursor-pointer"
                      >
                        <div className="relative h-[110px] w-full">
                          <img 
                            src={rest.image_url} 
                            alt={rest.name}
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                          <div className="absolute top-2.5 right-2.5 bg-white/90 backdrop-blur-xs px-2 py-0.5 rounded-lg text-[9.5px] font-black text-gray-800 flex items-center gap-1 shadow-xs">
                            <span className="text-yellow-500">★</span>
                            <span>{rest.rating}</span>
                          </div>
                        </div>
                        <div className="p-3">
                          <h5 className="font-extrabold text-[14px] text-gray-950 leading-tight">{rest.name}</h5>
                          <p className="text-[10px] text-gray-400 font-bold uppercase mt-0.5">{rest.category} • {currentCity}</p>
                          <div className="flex justify-between items-center text-[11px] text-gray-500 mt-2 pt-1 border-t border-gray-50">
                            <span className="font-semibold">{rest.prep_time} (Dodo express)</span>
                            <span className="font-bold text-[#E52327]">
                              Frais : {isDodoPassSubscribed ? "0 FCFA (Pass ✨)" : `${rest.delivery_fee} FCFA`}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}

                  {restaurants.filter(r => {
                    if (!searchQuery) return true;
                    const q = searchQuery.toLowerCase();
                    return r.name.toLowerCase().includes(q) || 
                           r.category.toLowerCase().includes(q) || 
                           currentCity.toLowerCase().includes(q);
                  }).length === 0 && (
                    <div className="p-8 text-center bg-white rounded-2xl border border-gray-100">
                      <p className="text-sm font-bold text-gray-500">Aucun maquis ou plat trouvé pour "{searchQuery}".</p>
                      <button 
                        onClick={() => setSearchQuery('')}
                        className="mt-2 text-xs text-[#E52327] font-black hover:underline"
                      >
                        Réinitialiser la recherche
                      </button>
                    </div>
                  )}
                </div>
              </div>

            </div>
          </div>
        )}

        {/* =======================================================
            iPhone Navigation Tab Bar (Screens 2, 4, 6, 7, 8)
            ======================================================= */}
        {currentScreenId !== 1 && (
          <div className="absolute bottom-0 inset-x-0 h-[64px] bg-white border-t border-gray-100 px-4 pb-[8px] flex justify-between items-center z-[40] shadow-md select-none shrink-0">
            {[
              { id: 2, label: 'Accueil', icon: Home },
              { id: 8, label: 'Recherche', icon: Search },
              { id: 4, label: 'Panier', icon: ShoppingCart, count: cartItemCount },
              { id: 6, label: 'Commandes', icon: ClipboardList },
              { id: 7, label: 'Profil', icon: User }
            ].map((tab) => {
              // Highlight criteria
              const isActive = (tab.id === currentScreenId);
              const IconComponent = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => changeScreen(tab.id)}
                  className={`flex-1 flex flex-col items-center justify-center h-full text-[10px] font-bold ${
                    isActive ? 'text-[#E52327]' : 'text-gray-400 hover:text-gray-700'
                  } transition relative`}
                >
                  <span className={`leading-none mb-1 flex items-center justify-center ${(tab.id === 4 && cartShake) ? 'animate-shake' : ''}`}>
                    <IconComponent className={`w-[22px] h-[22px] transition-transform ${isActive ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
                  </span>
                  <span>{tab.label}</span>
                  {tab.count !== undefined && tab.count > 0 && (
                    <span className="absolute top-[3px] right-[20%] bg-[#E52327] text-white text-[9.5px] font-mono leading-none font-extrabold w-[17px] h-[17px] rounded-full border border-white flex items-center justify-center shadow-sm">
                      {tab.count}
                    </span>
                  )}
                  {tab.id === 7 && walletBalance < 1000 && (
                    <span className="absolute top-[4px] right-[24%] bg-red-600 w-2.5 h-2.5 rounded-full ring-2 ring-white animate-pulse" />
                  )}
                </button>
              );
            })}
          </div>
        )}

        <AnimatePresence>
          {toastMessage && typeof toastMessage === 'string' && (
            <motion.div
              initial={{ opacity: 0, y: 25, scale: 0.95, x: "-50%" }}
              animate={{ opacity: 1, y: 0, scale: 1, x: "-50%" }}
              exit={{ opacity: 0, y: 15, scale: 0.92, x: "-50%" }}
              transition={{ duration: 0.15, ease: "easeOut" }}
              className="absolute bottom-[75px] left-1/2 z-[45] bg-slate-900/95 backdrop-blur-md px-4 py-2.5 rounded-full shadow-xl border border-slate-800 text-white flex items-center justify-center max-w-[310px] w-auto text-center"
            >
              <span className="text-[10.5px] font-black tracking-tight text-center w-full leading-tight select-none">
                {toastMessage}
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* iPhone Safe Area Bottom Indicator Line */}
        <div className="absolute bottom-[6px] left-1/2 -translate-x-1/2 w-[130px] h-1.5 bg-black rounded-full z-50"></div>

      </div>
    </div>
  );
}
