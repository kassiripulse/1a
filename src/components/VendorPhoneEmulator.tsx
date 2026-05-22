/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Menu as MenuIcon, Bell, DollarSign, ShoppingBag, Flame, TrendingUp, Star, Phone, Mail, MapPin, 
  Clock, Info, ChevronRight, ChevronLeft, ArrowLeft, Camera, Plus, Check, Edit, Eye, X,
  Shield, Volume2, VolumeX, Home, ClipboardList, ChefHat, BarChart3, User
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell 
} from 'recharts';
import { Restaurant, MenuItem, Order, OrderStatus } from '../types';
import DodoLogo from './DodoLogo';
import LazyImage from './LazyImage';
import { DodoSoundManager } from '../lib/sound';

interface VendorPhoneEmulatorProps {
  restaurants: Restaurant[];
  menuItems: MenuItem[];
  orders: Order[];
  onMenuItemsChange: (updatedItems: MenuItem[]) => void;
  onOrdersChange: (updatedOrders: Order[]) => void;
  vendorScreenId: number;
  setVendorScreenId: (id: number) => void;
  onScreenChange?: (screenId: number) => void;
}

export default function VendorPhoneEmulator({
  restaurants,
  menuItems,
  orders,
  onMenuItemsChange,
  onOrdersChange,
  vendorScreenId,
  setVendorScreenId,
  onScreenChange,
}: VendorPhoneEmulatorProps) {
  // Vendor-specific Screens:
  // 1 = Dashboard principal
  // 2 = Commandes en temps réel
  // 3 = Gestion du menu
  // 4 = Ajout / motif d'un plat
  // 5 = Statistiques
  // 6 = Profil restaurant
  const vendorScreen = vendorScreenId;
  const setVendorScreen = (id: number) => {
    setVendorScreenId(id);
    if (onScreenChange) {
      onScreenChange(id);
    }
  };

  // Real-time sound alarm states
  const [isSoundEnabled, setIsSoundEnabled] = useState<boolean>(() => {
    return localStorage.getItem('DODO_VENDOR_SOUND_ENABLED') !== 'false';
  });

  // Effect to manage ringtone when there is a brand new pending order ("Confirmée")
  useEffect(() => {
    // Check if there is any new order that needs validation by the restaurant
    const hasNewPendingOrder = orders.some(o => o.status === 'Confirmée');
    
    // Configure mute state in manager
    DodoSoundManager.setMuted(!isSoundEnabled);

    if (hasNewPendingOrder && isSoundEnabled) {
      DodoSoundManager.playNewOrderRingtone();
    } else {
      DodoSoundManager.stop();
    }

    return () => {
      // Cleanup on tab switch or role exit to stop sound instantly
      DodoSoundManager.stop();
    };
  }, [orders, isSoundEnabled]);

  const toggleSound = () => {
    const nextVal = !isSoundEnabled;
    setIsSoundEnabled(nextVal);
    localStorage.setItem('DODO_VENDOR_SOUND_ENABLED', String(nextVal));
    DodoSoundManager.setMuted(!nextVal);
    if (nextVal) {
      setTimeout(() => {
        DodoSoundManager.playChirp();
      }, 50);
    } else {
      DodoSoundManager.stop();
    }
  };
  
  // Tab states
  const [orderFilterTab, setOrderFilterTab] = useState<'Nouvelles' | 'En préparation' | 'Terminées'>('Nouvelles');
  const [menuFilterCategory, setMenuFilterCategory] = useState<'Tous' | 'Plats' | 'Boissons'>('Tous');
  
  // Switch states
  const [isRestaurantOpen, setIsRestaurantOpen] = useState<boolean>(true);
  const [kycStatus, setKycStatus] = useState<'verified' | 'pending' | 'rejected'>('verified');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Premium Vendor settings states
  const [isEditingVendor, setIsEditingVendor] = useState<boolean>(false);
  const [vendorName, setVendorName] = useState<string>(() => localStorage.getItem('DODO_VENDOR_NAME') || 'Maquis Chez Fatou');
  const [vendorLogo, setVendorLogo] = useState<string>(() => localStorage.getItem('DODO_VENDOR_LOGO') || 'https://images.unsplash.com/photo-1544025162-d76694265947?w=200&auto=format&fit=crop&q=80');
  const [vendorCoverUrl, setVendorCoverUrl] = useState<string>(() => localStorage.getItem('DODO_VENDOR_COVER') || 'https://images.unsplash.com/photo-1544025162-d76694265947?w=600&auto=format&fit=crop&q=80');
  const [vendorPrepTime, setVendorPrepTime] = useState<number>(() => parseInt(localStorage.getItem('DODO_VENDOR_PREP') || '25', 10));
  const [vendorFreeDelivery, setVendorFreeDelivery] = useState<number>(() => parseInt(localStorage.getItem('DODO_VENDOR_FREE_DEL') || '15000', 10));
  const [vendorOpeningShift, setVendorOpeningShift] = useState<string>(() => localStorage.getItem('DODO_VENDOR_SHIFT') || 'Matin & Soir (08h - 23h)');
  const [vendorEmail, setVendorEmail] = useState<string>(() => localStorage.getItem('DODO_VENDOR_EMAIL') || 'chezfatou@gmail.com');
  const [vendorPhone, setVendorPhone] = useState<string>(() => localStorage.getItem('DODO_VENDOR_PHONE') || '+226 70 12 34 56');
  const [vendorAddress, setVendorAddress] = useState<string>(() => localStorage.getItem('DODO_VENDOR_ADDRESS') || '1200 Logements, Avenue de l\'indépendance, Ouagadougou');
  const [vendorBio, setVendorBio] = useState<string>(() => localStorage.getItem('DODO_VENDOR_BIO') || 'Maquis Chez Fatou vous propose les meilleurs plats africains faits maison avec amour.');
  const [vendorPassword, setVendorPassword] = useState<string>('');
  const [vendor2Fa, setVendor2Fa] = useState<boolean>(() => localStorage.getItem('DODO_VENDOR_2FA') === 'true');

  // Edit / Add dish state variables
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [dishName, setDishName] = useState<string>('');
  const [dishDescription, setDishDescription] = useState<string>('');
  const [dishPrice, setDishPrice] = useState<string>('');
  const [dishCategory, setDishCategory] = useState<string>('Plats principaux');
  const [dishIsAvailable, setDishIsAvailable] = useState<boolean>(true);
  const [dishImageUrl, setDishImageUrl] = useState<string>('');

  // Sample image options for dishes in Ouaga
  const sampleFoodImages = [
    'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=550&auto=format&fit=crop&q=80', // Roast poulet
    'https://images.unsplash.com/photo-1604329760661-e71dc83f8f26?w=550&auto=format&fit=crop&q=80', // Riz gras
    'https://images.unsplash.com/photo-1547592180-85f173990554?w=550&auto=format&fit=crop&q=80', // Soup bowl
    'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=550&auto=format&fit=crop&q=80', // Tô plantain
  ];

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const handleScreenChange = (screenId: number) => {
    setVendorScreen(screenId);
    if (onScreenChange) {
      onScreenChange(screenId);
    }
  };

  // Availability Toggle
  const toggleItemAvailability = (itemId: string) => {
    const updated = menuItems.map(item => {
      if (item.id === itemId) {
        const isAv = item.is_available === undefined ? false : !item.is_available;
        showToast(`Plat marqué ${!isAv ? 'Indisponible' : 'Disponible'}`);
        return { ...item, is_available: isAv };
      }
      return item;
    });
    onMenuItemsChange(updated);
    // Persist to localStorage also
    localStorage.setItem('DODO_MENU_ITEMS', JSON.stringify(updated));
  };

  // Accept a new order
  const acceptOrder = (orderId: string) => {
    const updated = orders.map(ord => {
      if (ord.id === orderId) {
        showToast(`Commande ${ord.order_number} acceptée ! 🧑‍🍳`);
        return { 
          ...ord, 
          status: 'En préparation' as OrderStatus,
          status_times: {
            ...ord.status_times,
            preparing: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
          }
        };
      }
      return ord;
    });
    onOrdersChange(updated);
    localStorage.setItem('DODO_ORDERS', JSON.stringify(updated));
  };

  // Decline order
  const refuseOrder = (orderId: string) => {
    if (window.confirm("Voulez-vous vraiment refuser cette commande ?")) {
      const updated = orders.filter(ord => ord.id !== orderId);
      onOrdersChange(updated);
      localStorage.setItem('DODO_ORDERS', JSON.stringify(updated));
      showToast("Commande refusée et annulée");
    }
  };

  // Move order to Ready state
  const setOrderReady = (orderId: string) => {
    const updated = orders.map(ord => {
      if (ord.id === orderId) {
        showToast(`Commande ${ord.order_number} prête pour le livreur ! 🏍️`);
        return { 
          ...ord, 
          status: 'Prête' as OrderStatus,
          status_times: {
            ...ord.status_times,
            ready: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
          }
        };
      }
      return ord;
    });
    onOrdersChange(updated);
    localStorage.setItem('DODO_ORDERS', JSON.stringify(updated));
  };

  // Complete/Deliver the order
  const deliverOrder = (orderId: string) => {
    const updated = orders.map(ord => {
      if (ord.id === orderId) {
        showToast(`Commande ${ord.order_number} livrée avec succès ! 🎉`);
        return { 
          ...ord, 
          status: 'Livré' as OrderStatus,
          status_times: {
            ...ord.status_times,
            delivered: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
          }
        };
      }
      return ord;
    });
    onOrdersChange(updated);
    localStorage.setItem('DODO_ORDERS', JSON.stringify(updated));
  };

  // Add/Edit dish form submit
  const handleSaveDish = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dishName.trim() || !dishPrice.trim()) {
      showToast("Veuillez remplir le nom et le tarif !");
      return;
    }

    const priceNum = parseInt(dishPrice) || 500;
    const finalImg = dishImageUrl || sampleFoodImages[Math.floor(Math.random() * sampleFoodImages.length)];

    if (editingItem) {
      // Edit mode
      const updated = menuItems.map(item => {
        if (item.id === editingItem.id) {
          return {
            ...item,
            name: dishName,
            description: dishDescription,
            price: priceNum,
            category: dishCategory,
            is_available: dishIsAvailable,
            image_url: finalImg
          };
        }
        return item;
      });
      onMenuItemsChange(updated);
      localStorage.setItem('DODO_MENU_ITEMS', JSON.stringify(updated));
      showToast("🍛 Plat mis à jour avec succès !");
    } else {
      // Create mode
      const newId = `menu_custom_${Date.now()}`;
      const newItem: MenuItem = {
        id: newId,
        restaurant_id: 'rest_fatou', // Maquis Chez Fatou
        name: dishName,
        description: dishDescription,
        price: priceNum,
        category: dishCategory,
        image_url: finalImg,
        is_available: dishIsAvailable
      };
      
      const updated = [...menuItems, newItem];
      onMenuItemsChange(updated);
      localStorage.setItem('DODO_MENU_ITEMS', JSON.stringify(updated));
      showToast("➕ Nouveau plat ajouté au maquis !");
    }

    // Reset state & back to menu screen
    setEditingItem(null);
    setDishName('');
    setDishDescription('');
    setDishPrice('');
    setDishImageUrl('');
    setVendorScreen(3);
  };

  // Nav to Add screen
  const navToAddDish = () => {
    setEditingItem(null);
    setDishName('');
    setDishDescription('');
    setDishPrice('2500');
    setDishCategory('Plats');
    setDishIsAvailable(true);
    setDishImageUrl(sampleFoodImages[0]);
    setVendorScreen(4);
  };

  // Nav to Edit screen
  const navToEditDish = (item: MenuItem) => {
    setEditingItem(item);
    setDishName(item.name);
    setDishDescription(item.description);
    setDishPrice(item.price.toString());
    setDishCategory(item.category);
    setDishIsAvailable(item.is_available !== false);
    setDishImageUrl(item.image_url);
    setVendorScreen(4);
  };

  // Filter menu items for Chez Fatou only
  const fatouMenuItems = menuItems.filter(item => item.restaurant_id === 'rest_fatou');
  const filteredFatouMenuItems = fatouMenuItems.filter(item => {
    if (menuFilterCategory === 'Tous') return true;
    if (menuFilterCategory === 'Plats') return item.category !== 'Boisson' && item.category !== 'Dessert';
    if (menuFilterCategory === 'Boissons') return item.category === 'Boisson' || item.name.toLowerCase().includes('jus') || item.name.toLowerCase().includes('biere') || item.name.toLowerCase().includes('eau') || item.name.toLowerCase().includes('coca');
    return true;
  });

  // Split live orders for Chez Fatou
  const fatouOrders = orders.filter(o => o.restaurant.id === 'rest_fatou');
  
  // Pending orders: Confirmée or order_number matches live
  const pendingOrders = fatouOrders.filter(o => o.status === 'Confirmée' || o.status === 'En préparation' || o.status === 'Prête');
  
  // Split orders by filter tabs based on design mockup labels
  // Nouvelles orders: those that are "Confirmée" (new order card) or the first active simulation
  const nouvellesOrdersList = fatouOrders.filter(o => o.status === 'Confirmée' || o.status === 'En route'); 
  const enPreparationOrdersList = fatouOrders.filter(o => o.status === 'En préparation' || o.status === 'Prête');
  const termineesOrdersList = fatouOrders.filter(o => o.status === 'Livré');

  return (
    <div id="vendor_iphone_wrapper" className="relative mx-auto w-[390px] h-[844px] bg-slate-900 rounded-[55px] p-[12px] shadow-2xl border-[6px] border-slate-800 ring-1 ring-slate-700/50 flex flex-col overflow-hidden select-none">
      
      {/* Dynamic Toast System */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div 
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="absolute top-[80px] left-[5%] right-[5%] z-50 bg-black/92 text-white text-xs py-2.5 px-4 rounded-xl shadow-lg border border-red-500/35 flex items-center gap-2"
          >
            <div className="w-2.5 h-2.5 rounded-full bg-[#E52327] animate-ping"></div>
            <p className="font-bold tracking-tight">{toastMessage}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* iPhone Dynamic Island Speaker & Camera */}
      <div className="absolute top-[16px] left-1/2 -translate-x-1/2 w-[110px] h-[30px] bg-black rounded-[20px] z-50 flex items-center justify-between px-3">
        <div className="w-3.5 h-3.5 bg-[#1F2937] rounded-full border border-gray-900"></div>
        <div className="w-12 h-1 bg-gray-900 rounded-full"></div>
        <div className="w-2.5 h-2.5 bg-red-950/40 rounded-full"></div>
      </div>

      {/* Screen Container with Dodo Off-White Background */}
      <div className="relative flex-1 w-full h-full bg-[#FBFBFB] rounded-[43px] overflow-hidden flex flex-col font-sans text-gray-900 shadow-inner">
        
        {/* Status Bar */}
        <div className="h-[47px] w-full flex justify-between items-end px-7 pb-2.5 bg-transparent z-40 text-black text-[14px] font-bold">
          <span>12:30</span>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] bg-green-500/10 text-green-600 px-1.5 py-0.2 rounded-md font-black">4G+</span>
            <div className="w-5 h-2.5 border border-black rounded-sm p-0.5 flex items-center">
              <div className="w-4 h-full bg-black rounded-[1px]"></div>
            </div>
          </div>
        </div>

        {/* =======================================================
            VEND-SCREEN 1: DASHBOARD PRINCIPAL
            ======================================================= */}
        {vendorScreen === 1 && (
          <div className="flex-1 flex flex-col bg-[#F9F9FB] overflow-hidden pb-[70px]">
            {/* Header */}
            <div className="px-5 pt-3 pb-3 flex justify-between items-center bg-white border-b border-gray-100 sticky top-0 z-30">
              <div className="flex items-center gap-2">
                <DodoLogo size={34} withText={true} withContainer={true} contourColor="#FFFFFF" />
                <h1 className="text-[17px] font-black tracking-tight text-gray-950">Vendeur</h1>
              </div>
              <button className="relative w-9 h-9 rounded-full bg-gray-50 flex items-center justify-center border border-gray-100">
                <Bell className="w-4.5 h-4.5 text-gray-800" />
                <span className="absolute top-[4px] right-[4px] w-2 h-2 rounded-full bg-[#E52327]"></span>
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto no-scrollbar px-4 pt-4 space-y-4">
              
              {/* Toggle Restaurant Ouvert */}
              <div className="bg-white rounded-2xl p-4 border border-gray-100 flex justify-between items-center shadow-xs">
                <div className="flex items-center gap-2">
                  <div className={`w-2.5 h-2.5 rounded-full ${isRestaurantOpen ? 'bg-green-500 shadow-green-500/35 shadow-md' : 'bg-gray-400'}`}></div>
                  <span className="text-[13.5px] font-extrabold text-gray-950">Restaurant ouvert</span>
                </div>
                <button 
                  onClick={() => {
                    setIsRestaurantOpen(!isRestaurantOpen);
                    showToast(isRestaurantOpen ? "Le Maquis est maintenant fermé" : "Votre Maquis est ouvert et reçoit les commandes ! 🍲");
                  }}
                  className={`w-11 h-6 rounded-full p-0.5 transition-colors focus:outline-none ${isRestaurantOpen ? 'bg-[#E52327]' : 'bg-gray-300'}`}
                >
                  <div className={`bg-white w-5 h-5 rounded-full shadow-md transform transition-transform ${isRestaurantOpen ? 'translate-x-5' : 'translate-x-0'}`} />
                </button>
              </div>

              {/* Revenus du jour card */}
              <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex justify-between items-center relative overflow-hidden">
                <div className="space-y-1.5">
                  <span className="text-gray-400 font-extrabold text-[11px] uppercase tracking-wider block">Revenus du jour</span>
                  <div className="text-[26px] font-black tracking-tight text-gray-950 leading-none">45 000 FCFA</div>
                  <div className="flex items-center gap-1 text-[11.5px] text-green-600 font-bold mt-1">
                    <TrendingUp className="w-3.5 h-3.5" />
                    <span>↑ 12% vs hier</span>
                  </div>
                </div>
                <div className="w-[48px] h-[48px] bg-red-50 text-[#E52327] rounded-2xl flex items-center justify-center font-black">
                  💰
                </div>
              </div>

              {/* Grid indicators block */}
              <div className="grid grid-cols-2 gap-3.5">
                {/* Card 1 */}
                <div 
                  onClick={() => setOrderFilterTab('Nouvelles')}
                  className="bg-white rounded-2xl p-4 border border-gray-100 shadow-xs cursor-pointer hover:border-red-200 transition"
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-gray-400 font-extrabold text-[10px] uppercase tracking-wider">Commandes</span>
                    <span className="text-xl">🛍️</span>
                  </div>
                  <div className="text-2xl font-black text-gray-950 leading-tight">18</div>
                  <span className="text-[11px] text-gray-400 mt-0.5 block font-bold">Aujourd'hui</span>
                </div>

                {/* Card 2 */}
                <div 
                  onClick={() => { setOrderFilterTab('En préparation'); handleScreenChange(2); }}
                  className="bg-white rounded-2xl p-4 border border-gray-100 shadow-xs cursor-pointer hover:border-red-200 transition"
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-gray-400 font-extrabold text-[10px] uppercase tracking-wider">En préparation</span>
                    <span className="text-xl">🥘</span>
                  </div>
                  <div className="text-2xl font-black text-[#E52327] leading-tight">7</div>
                  <span className="text-[11px] text-gray-400 mt-0.5 block font-bold">Commandes</span>
                </div>
              </div>

              {/* Aperçu Rapide list */}
              <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-3.5">
                <h3 className="text-gray-950 font-black text-[13.5px] border-b border-gray-50 pb-2">Aperçu rapide</h3>
                
                <div className="space-y-2 text-[12px] text-gray-600 font-bold">
                  <div className="flex justify-between items-center py-1">
                    <span className="text-gray-500">Commandes complétées</span>
                    <span className="text-gray-900 font-extrabold">11</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-t border-gray-50">
                    <span className="text-gray-500">Annulées</span>
                    <span className="text-gray-900 font-extrabold">1</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-t border-gray-50">
                    <span className="text-gray-500">Temps moyen de préparation</span>
                    <span className="text-[#E52327] font-extrabold">18 min</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-t border-gray-50">
                    <span className="text-gray-500 flex items-center gap-1">Note moyenne</span>
                    <span className="text-amber-500 font-extrabold flex items-center gap-0.5">
                      4.6 <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500 stroke-none" />
                    </span>
                  </div>
                </div>
              </div>

              {/* Bottom quick switch button back to client */}
              <div className="pt-2 text-center">
                <p className="text-[10px] text-gray-400 italic">Plateforme livrée en direct sur Ouagadougou</p>
              </div>

            </div>
          </div>
        )}

        {/* =======================================================
            VEND-SCREEN 2: COMMANDES EN TEMPS RÉEL (Live orders)
            ======================================================= */}
        {vendorScreen === 2 && (
          <div className="flex-1 flex flex-col bg-[#F9F9FB] overflow-hidden pb-[70px]">
            {/* Header */}
            <div className="px-5 pt-3 pb-3 flex justify-between items-center bg-white sticky top-0 z-30">
              <div className="flex items-center gap-3">
                <div className="p-1.5 bg-gray-50 rounded-lg">
                  <MenuIcon className="w-5 h-5 text-gray-800" />
                </div>
                <h1 className="text-[17px] font-black tracking-tight text-gray-950">Commandes</h1>
              </div>
              <div className="flex items-center gap-1.5">
                {/* Sound alert control or ringing effect */}
                <button 
                  onClick={toggleSound}
                  className={`relative w-9 h-9 rounded-full flex items-center justify-center border transition-all ${
                    isSoundEnabled 
                      ? 'bg-rose-50 border-rose-100 text-[#E52327]' 
                      : 'bg-gray-100 border-gray-200 text-gray-400'
                  }`}
                  title={isSoundEnabled ? "Désactiver la sonnerie" : "Activer la sonnerie"}
                >
                  {isSoundEnabled ? (
                    <Volume2 className={`w-4.5 h-4.5 ${nouvellesOrdersList.some(o => o.status === 'Confirmée') ? 'animate-bounce' : ''}`} />
                  ) : (
                    <VolumeX className="w-4.5 h-4.5" />
                  )}
                  {nouvellesOrdersList.some(o => o.status === 'Confirmée') && isSoundEnabled && (
                    <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#E52327]"></span>
                    </span>
                  )}
                </button>

                <button className="relative w-9 h-9 rounded-full bg-gray-50 flex items-center justify-center border border-gray-100">
                  <Bell className="w-4.5 h-4.5 text-gray-800" />
                  <span className="absolute top-[4px] right-[4px] w-2 h-2 rounded-full bg-[#E52327]"></span>
                </button>
              </div>
            </div>

            {/* Filter Tabs matching mockup */}
            <div className="flex bg-white border-b border-gray-100 text-[12.5px] font-bold shrink-0">
              {(['Nouvelles', 'En préparation', 'Terminées'] as const).map((tab) => {
                const count = tab === 'Nouvelles' ? nouvellesOrdersList.length : tab === 'En préparation' ? enPreparationOrdersList.length : null;
                const isActive = orderFilterTab === tab;
                return (
                  <button
                    key={tab}
                    onClick={() => setOrderFilterTab(tab)}
                    className={`flex-1 text-center py-3 relative transition-all ${
                      isActive ? 'text-[#E52327] font-black' : 'text-gray-500'
                    }`}
                  >
                    <span className="relative inline-flex items-center gap-1.5 justify-center w-full">
                      {tab}
                      {count !== null && (
                        <span className={`text-[10.5px] px-1.5 py-0.2 rounded-full font-black ${isActive ? 'bg-[#E52327] text-white' : 'bg-gray-150 text-gray-500'}`}>
                          {count}
                        </span>
                      )}
                    </span>
                    {isActive && (
                      <motion.div layoutId="vendor_order_tab" className="absolute bottom-0 inset-x-0 h-0.7 bg-[#E52327]" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* List area */}
            <div className="flex-1 overflow-y-auto no-scrollbar p-4 space-y-4">
              {orderFilterTab === 'Nouvelles' && (
                <div className="space-y-4">
                  
                  {/* Dynamic user placed orders or mock list */}
                  {nouvellesOrdersList.length > 0 ? (
                    nouvellesOrdersList.map((ord) => (
                      <div 
                        key={ord.id}
                        className="bg-white rounded-2xl p-4 border border-red-500/20 shadow-xs relative overflow-hidden space-y-3"
                      >
                        {/* Red blinker for fresh state */}
                        <div className="absolute top-0 left-0 right-0 h-1.5 bg-[#E52327]"></div>
                        
                        <div className="flex justify-between items-start text-xs font-bold">
                          <div>
                            <span className="text-[#E52327] block font-black">Nouvelle commande</span>
                            <span className="text-gray-400 text-[11px] block mt-0.5 font-mono">{ord.order_number}</span>
                          </div>
                          <span className="text-gray-500 font-bold bg-gray-55 px-2 py-0.5 rounded-md">
                            {ord.status_times.confirmed || '12:30'}
                          </span>
                        </div>

                        {/* Customer data */}
                        <div className="space-y-1.5 text-[12px] border-y border-gray-50 py-2.5">
                          <div className="text-gray-950 font-black">{ord.driver ? 'Moussa Traoré' : 'Client Dodo'}</div>
                          <div className="text-[#E52327] font-extrabold flex items-center gap-1 text-[11px]">
                            📞 <span className="font-mono text-gray-600">+226 70 12 34 56</span>
                          </div>
                          <div className="text-gray-500 flex items-start gap-1">
                            <span className="text-gray-400">Livraison :</span>
                            <span className="font-medium text-gray-800">1200 Logements, Ouagadougou</span>
                          </div>
                        </div>

                        {/* Items listed */}
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-gray-400 font-bold">
                            {ord.items.reduce((sum, i) => sum + i.quantity, 0)} articles
                          </span>
                          <span className="text-gray-950 font-black text-[13.5px]">
                            {ord.total} FCFA
                          </span>
                        </div>

                        {/* Action buttons matching mockup exactly */}
                        <div className="grid grid-cols-2 gap-2.5 pt-1.5 text-xs font-bold shrink-0">
                          <button 
                            onClick={() => refuseOrder(ord.id)}
                            className="bg-white border border-gray-150 text-gray-500 py-2 rounded-xl text-center shadow-2xs hover:bg-gray-50 transition"
                          >
                            Refuser
                          </button>
                          <button 
                            onClick={() => acceptOrder(ord.id)}
                            className="bg-[#E52327] text-white py-2 rounded-xl text-center shadow-sm hover:bg-red-700 transition"
                          >
                            Accepter
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    // Hardcoded standard mockup items when no dynamic orders matching "Nouvelle"
                    <div className="space-y-4">
                      {/* Standard Mock 1 */}
                      <div className="bg-white rounded-2xl p-4 border border-collapse shadow-xs relative overflow-hidden space-y-3">
                        <div className="absolute top-0 left-0 right-0 h-1.5 bg-[#E52327]"></div>
                        <div className="flex justify-between items-start text-xs font-bold">
                          <div>
                            <span className="text-[#E52327] block font-black">Nouvelle commande</span>
                            <span className="text-gray-400 text-[11px] block mt-0.5 font-mono">#DODO12345</span>
                          </div>
                          <span className="text-gray-500 font-bold bg-gray-50 px-2 py-0.5 rounded-md font-mono">12:30 🔴</span>
                        </div>
                        <div className="space-y-1 text-[12px] border-y border-gray-50 py-2">
                          <div className="text-gray-950 font-black">Moussa Traoré</div>
                          <div className="text-gray-400 text-[11.5px] font-mono">📞 +226 70 12 34 56</div>
                          <div className="text-gray-500 font-medium text-[11px]"><span className="text-gray-400">Livraison :</span> 1200 Logements, Ouagadougou</div>
                        </div>
                        <div className="flex justify-between items-center text-xs font-bold">
                          <span className="text-gray-400">3 articles</span>
                          <span className="text-gray-950 font-black">7 500 FCFA</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs font-extrabold pt-1">
                          <button onClick={() => showToast("Commande refusée")} className="bg-white border border-gray-200 text-gray-600 py-2 rounded-xl">Refuser</button>
                          <button onClick={() => showToast("Commande maintenant en préparation !")} className="bg-[#E52327] text-white py-2 rounded-xl shadow-xs">Accepter</button>
                        </div>
                      </div>

                      {/* Standard Mock 2 */}
                      <div className="bg-white rounded-2xl p-4 border border-collapse shadow-xs relative overflow-hidden space-y-3">
                        <div className="absolute top-0 left-0 right-0 h-1.5 bg-[#E52327]"></div>
                        <div className="flex justify-between items-start text-xs font-bold">
                          <div>
                            <span className="text-[#E52327] block font-black">Nouvelle commande</span>
                            <span className="text-gray-400 text-[11px] block mt-0.5 font-mono">#DODO12344</span>
                          </div>
                          <span className="text-gray-500 font-bold bg-gray-50 px-2 py-0.5 rounded-md font-mono">12:28</span>
                        </div>
                        <div className="space-y-1 text-[12px] border-y border-gray-50 py-2">
                          <div className="text-gray-950 font-black">Awa Kaboré</div>
                          <div className="text-gray-400 text-[11.5px] font-mono">📞 +226 65 43 21 09</div>
                          <div className="text-gray-500 font-medium text-[11px]"><span className="text-gray-400">Livraison :</span> Zone du Bois, Ouagadougou</div>
                        </div>
                        <div className="flex justify-between items-center text-xs font-bold">
                          <span className="text-gray-400">2 articles</span>
                          <span className="text-gray-950 font-black">4 000 FCFA</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs font-extrabold pt-1">
                          <button onClick={() => showToast("Commande refusée")} className="bg-white border border-gray-200 text-gray-600 py-2 rounded-xl">Refuser</button>
                          <button onClick={() => showToast("Commande maintenant en préparation !")} className="bg-[#E52327] text-white py-2 rounded-xl shadow-xs">Accepter</button>
                        </div>
                      </div>
                    </div>
                  )}

                </div>
              )}

              {/* EN PRÉPARATION (or pre-ready state) */}
              {orderFilterTab === 'En préparation' && (
                <div className="space-y-4">
                  {enPreparationOrdersList.length > 0 ? (
                    enPreparationOrdersList.map((ord) => (
                      <div 
                        key={ord.id}
                        className="bg-white rounded-2xl p-4 border border-gray-100 shadow-xs space-y-3"
                      >
                        <div className="flex justify-between items-start text-xs font-bold">
                          <div>
                            <span className="text-amber-600 font-black uppercase tracking-wider text-[10.5px]">{ord.status}</span>
                            <span className="text-gray-400 text-[11px] block mt-0.5 font-mono">{ord.order_number}</span>
                          </div>
                          <span className="text-xs bg-amber-50 text-amber-700 px-2.5 py-0.5 rounded-lg font-bold">
                            En cours
                          </span>
                        </div>

                        {/* Customer & address */}
                        <div className="text-[12px] border-y border-gray-50 py-2.5 space-y-1">
                          <div className="text-gray-950 font-black">Moussa Traoré</div>
                          <div className="text-gray-500"><span className="text-gray-400">Adresse:</span> 1200 Logements, Ouagadougou</div>
                        </div>

                        {/* Food detail list */}
                        <div className="space-y-1.5 text-xs text-gray-600 font-bold">
                          {ord.items.map((item, idxx) => (
                            <div key={idxx} className="flex justify-between">
                              <span>{item.quantity} × {item.menu_item.name}</span>
                              <span className="text-gray-900">{item.menu_item.price * item.quantity} FCFA</span>
                            </div>
                          ))}
                        </div>

                        {/* Conditional Buttons */}
                        <div className="pt-2">
                          {ord.status === 'En préparation' ? (
                            <button 
                              onClick={() => setOrderReady(ord.id)}
                              className="w-full bg-amber-500 text-white font-extrabold text-xs py-2.5 rounded-xl hover:bg-amber-600 transition"
                            >
                              Marquer comme prête 🍕
                            </button>
                          ) : (
                            <button 
                              onClick={() => deliverOrder(ord.id)}
                              className="w-full bg-green-600 text-white font-extrabold text-xs py-2.5 rounded-xl hover:bg-green-700 transition"
                            >
                              Confirmer la livraison finale 🎉
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="py-12 text-center text-gray-400 text-xs font-bold space-y-2">
                      <p>Aucune commande en cours de préparation.</p>
                      <button onClick={() => setOrderFilterTab('Nouvelles')} className="text-[#E52327] underline">Voir les nouvelles commandes</button>
                    </div>
                  )}
                </div>
              )}

              {/* TERMINÉES */}
              {orderFilterTab === 'Terminées' && (
                <div className="space-y-4">
                  {termineesOrdersList.length > 0 ? (
                    termineesOrdersList.map((ord) => (
                      <div 
                        key={ord.id}
                        className="bg-white rounded-2xl p-4 border border-gray-100 shadow-xs space-y-2"
                      >
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-green-600 font-black uppercase text-[10.5px]">Complétée</span>
                          <span className="text-gray-400 font-mono text-[11px]">{ord.order_number}</span>
                        </div>
                        <div className="flex justify-between items-center text-xs border-y border-gray-50 py-2">
                          <div className="font-extrabold text-gray-900">Moussa Traoré</div>
                          <div className="text-emerald-600 font-black">{ord.total} FCFA</div>
                        </div>
                        <span className="text-[10px] text-gray-400 block font-bold">Livrée le {ord.created_at}</span>
                      </div>
                    ))
                  ) : (
                    <div className="py-12 text-center text-gray-400 text-xs font-bold">
                      Aucune commande terminée pour aujourd'hui.
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* =======================================================
            VEND-SCREEN 3: GESTION DU MENU
            ======================================================= */}
        {vendorScreen === 3 && (
          <div className="flex-1 flex flex-col bg-[#F9F9FB] overflow-hidden pb-[70px]">
            {/* Header */}
            <div className="px-5 pt-3 pb-3 flex justify-between items-center bg-white sticky top-0 z-30">
              <div className="flex items-center gap-3">
                <div className="p-1.5 bg-gray-50 rounded-lg">
                  <MenuIcon className="w-5 h-5 text-gray-800" />
                </div>
                <h1 className="text-[17px] font-black tracking-tight text-gray-950">Menu</h1>
              </div>
              <button 
                onClick={navToAddDish}
                className="w-9 h-9 rounded-full bg-red-50 text-[#E52327] flex items-center justify-center font-bold"
              >
                <Plus className="w-4.5 h-4.5 stroke-[2.5]" />
              </button>
            </div>

            {/* Form Category Toggles matching mockup */}
            <div className="flex bg-white border-b border-gray-100 text-[12.5px] font-bold shrink-0">
              {(['Tous', 'Plats', 'Boissons'] as const).map((tab) => {
                const isActive = menuFilterCategory === tab;
                const count = tab === 'Tous' ? fatouMenuItems.length : tab === 'Plats' ? fatouMenuItems.filter(i => i.category !== 'Boisson').length : fatouMenuItems.filter(i => i.category === 'Boisson').length;
                return (
                  <button
                    key={tab}
                    onClick={() => setMenuFilterCategory(tab)}
                    className={`flex-1 text-center py-2.5 relative transition-all ${
                      isActive ? 'text-[#E52327] font-black' : 'text-gray-500'
                    }`}
                  >
                    <span>{tab} ({count})</span>
                    {isActive && (
                      <motion.div layoutId="vendor_menu_category_tab" className="absolute bottom-0 inset-x-0 h-0.7 bg-[#E52327]" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Menu List */}
            <div className="flex-1 overflow-y-auto no-scrollbar p-4 space-y-4">
              
              {filteredFatouMenuItems.map((item) => {
                const isAv = item.is_available !== false;
                return (
                  <div 
                    key={item.id}
                    className="bg-white rounded-2xl p-3 flex gap-3.5 border border-gray-100 shadow-xs relative"
                  >
                    <LazyImage 
                      src={item.image_url} 
                      alt={item.name} 
                      className="w-full h-full object-cover"
                      containerClassName="w-[70px] h-[70px] rounded-xl shrink-0"
                      fallbackEmoji="🍲"
                    />
                    
                    <div className="flex-1 flex flex-col justify-between pr-10">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h4 className="text-[13.5px] font-black text-gray-950 tracking-tight leading-tight">{item.name}</h4>
                          <button 
                            onClick={() => navToEditDish(item)}
                            className="p-1 text-gray-400 hover:text-[#E52327] transition"
                            title="Modifier le plat"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <span className="text-[12.5px] font-black text-gray-950 mt-1 block">{item.price} FCFA</span>
                      </div>

                      {/* Pill indicator matching design */}
                      <span className={`text-[10.5px] font-black ${isAv ? 'text-green-600' : 'text-gray-400'}`}>
                        {isAv ? 'Disponible' : 'Indisponible'}
                      </span>
                    </div>

                    {/* Toggle Button exact mockup placement */}
                    <button 
                      onClick={() => toggleItemAvailability(item.id)}
                      className={`absolute bottom-3 right-3 w-10 h-5.5 rounded-full p-0.5 transition-colors ${isAv ? 'bg-[#E52327]' : 'bg-gray-300'}`}
                    >
                      <div className={`bg-white w-4.5 h-4.5 rounded-full shadow transform transition-transform ${isAv ? 'translate-x-[18px]' : 'translate-x-0'}`} />
                    </button>
                  </div>
                );
              })}

            </div>

            {/* Bottom Add button sticky floating */}
            <div className="absolute bottom-[75px] left-4 right-4 z-20">
              <button 
                onClick={navToAddDish}
                className="w-full h-[48px] bg-[#E52327] hover:bg-red-700 text-white rounded-xl font-bold text-xs uppercase tracking-wider shadow-md transform active:scale-98 transition flex items-center justify-center gap-2"
              >
                + Ajouter un plat
              </button>
            </div>

          </div>
        )}

        {/* =======================================================
            VEND-SCREEN 4: AJOUT / MODIFICATION D'UN PLAT
            ======================================================= */}
        {vendorScreen === 4 && (
          <div className="flex-1 flex flex-col bg-white overflow-hidden pb-[70px]">
            {/* Header */}
            <div className="h-[48px] px-4 border-b border-gray-100 flex items-center justify-between bg-white sticky top-0 z-30 shrink-0">
              <button 
                onClick={() => setVendorScreen(3)}
                className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center transition"
              >
                <ArrowLeft className="w-4.5 h-4.5 text-gray-900 stroke-[2.5]" />
              </button>
              <h2 className="text-[15px] font-black text-gray-950">
                {editingItem ? 'Modifier le plat' : 'Ajouter un plat'}
              </h2>
              <div className="w-8"></div>
            </div>

            {/* Scrollable Form */}
            <form onSubmit={handleSaveDish} className="flex-1 overflow-y-auto no-scrollbar p-5 space-y-4 text-xs font-bold text-gray-700">
              
              {/* Image Picker area with Camera icon overlay */}
              <div className="space-y-1.5">
                <label className="text-gray-400 font-extrabold text-[10.5px] uppercase tracking-wider block">Image du plat</label>
                <div className="relative w-full h-[140px] bg-slate-900 rounded-2xl overflow-hidden border border-gray-200">
                  <img 
                    src={dishImageUrl || sampleFoodImages[0]} 
                    alt="Dish preview" 
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-black/35 flex items-center justify-center">
                    <div className="w-10 h-10 rounded-full bg-white/90 backdrop-blur flex items-center justify-center text-gray-800">
                      <Camera className="w-5 h-5" />
                    </div>
                  </div>

                  {/* Tiny selector of food presets */}
                  <div className="absolute bottom-2 inset-x-2 flex items-center gap-1.5 justify-center bg-black/40 backdrop-blur-xs py-1 rounded-lg">
                    {sampleFoodImages.map((imgUrl, presetIdx) => (
                      <button 
                        key={presetIdx}
                        type="button"
                        onClick={() => setDishImageUrl(imgUrl)}
                        className={`w-7 h-7 rounded-md border-2 overflow-hidden ${dishImageUrl === imgUrl ? 'border-red-500' : 'border-white/50'}`}
                      >
                        <img src={imgUrl} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Nom du plat */}
              <div className="space-y-1">
                <label className="text-gray-600 block">Nom du plat <span className="text-[#E52327]">*</span></label>
                <input 
                  type="text" 
                  placeholder="Ex. Poulet braisé" 
                  value={dishName}
                  onChange={(e) => setDishName(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4.5 py-3 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-red-500/50"
                  required
                />
              </div>

              {/* Description */}
              <div className="space-y-1">
                <label className="text-gray-600 block">Description <span className="text-[#E52327]">*</span></label>
                <textarea 
                  placeholder="Ex. Poulet mariné et braisé aux épices africaines..." 
                  value={dishDescription}
                  onChange={(e) => setDishDescription(e.target.value)}
                  className="w-full h-[70px] bg-gray-50 border border-gray-200 rounded-xl px-4.5 py-2.5 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-red-500/50 resize-none font-medium leading-relaxed"
                  required
                />
              </div>

              {/* Prix */}
              <div className="space-y-1">
                <label className="text-gray-600 block">Prix (FCFA) <span className="text-[#E52327]">*</span></label>
                <input 
                  type="number" 
                  placeholder="Ex. 3500" 
                  value={dishPrice}
                  onChange={(e) => setDishPrice(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4.5 py-3 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-red-500/50"
                  required
                />
              </div>

              {/* Catégorie */}
              <div className="space-y-1">
                <label className="text-gray-600 block">Catégorie <span className="text-[#E52327]">*</span></label>
                <select 
                  value={dishCategory}
                  onChange={(e) => setDishCategory(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-red-500/50"
                >
                  <option value="Plats">Plats</option>
                  <option value="Riz">Riz</option>
                  <option value="Tô">Tô</option>
                  <option value="Soupe">Soupe</option>
                  <option value="Grillades">Grillades</option>
                  <option value="Boisson">Boisson</option>
                </select>
              </div>

              {/* Disponibilité toggle */}
              <div className="flex justify-between items-center py-2 border-t border-b border-gray-100">
                <span className="text-gray-700">Disponibilité</span>
                <button 
                  type="button"
                  onClick={() => setDishIsAvailable(!dishIsAvailable)}
                  className={`w-10 h-5.5 rounded-full p-0.5 transition-colors focus:outline-none ${dishIsAvailable ? 'bg-[#E52327]' : 'bg-gray-300'}`}
                >
                  <div className={`bg-white w-4.5 h-4.5 rounded-full shadow transform transition-transform ${dishIsAvailable ? 'translate-x-[18px]' : 'translate-x-0'}`} />
                </button>
              </div>

              {/* Submit button */}
              <div className="pt-2">
                <button 
                  type="submit"
                  className="w-full h-[48px] bg-[#E52327] text-white rounded-xl font-extrabold text-xs uppercase tracking-wide shadow-md active:scale-98 transition flex items-center justify-center"
                >
                  {editingItem ? 'Enregistrer le plat' : 'Enregistrer le plat'}
                </button>
              </div>

            </form>
          </div>
        )}

        {/* =======================================================
            VEND-SCREEN 5: STATISTIQUES (Analytics with Red Bar Chart)
            ======================================================= */}
        {vendorScreen === 5 && (
          <div className="flex-1 flex flex-col bg-[#F9F9FB] overflow-hidden pb-[70px]">
            {/* Header */}
            <div className="px-5 pt-3 pb-3 flex justify-between items-center bg-white sticky top-0 z-30">
              <div className="flex items-center gap-3">
                <div className="p-1.5 bg-gray-50 rounded-lg">
                  <MenuIcon className="w-5 h-5 text-gray-800" />
                </div>
                <h1 className="text-[17px] font-black tracking-tight text-gray-950">Statistiques</h1>
              </div>
              <button className="relative w-9 h-9 rounded-full bg-gray-50 flex items-center justify-center border border-gray-100">
                <Bell className="w-4.5 h-4.5 text-gray-800" />
              </button>
            </div>

            {/* Range Toggles (Jour, Semaine, Mois, Année) */}
            <div className="flex bg-white px-4 border-b border-gray-100 text-[11px] font-black tracking-wider text-gray-500 shrink-0">
              {['Jour', 'Semaine', 'Mois', 'Année'].map((range) => (
                <button 
                  key={range} 
                  className={`flex-1 text-center py-2.5 outline-none border-b-2 transition ${range === 'Mois' ? 'text-[#E52327] border-[#E52327]' : 'border-transparent text-gray-400'}`}
                >
                  {range}
                </button>
              ))}
            </div>

            {/* Carousel navigation header */}
            <div className="flex items-center justify-between px-6 py-2.5 bg-white text-[12px] font-extrabold text-gray-950 shrink-0 border-b border-gray-50">
              <ChevronLeft className="w-4 h-4 text-[#E52327] pointer-events-auto cursor-pointer" />
              <span className="tracking-tight uppercase">Mai 2024</span>
              <ChevronRight className="w-4 h-4 text-[#E52327] pointer-events-auto cursor-pointer" />
            </div>

            {/* Statistic charts block */}
            <div className="flex-1 overflow-y-auto no-scrollbar p-4 space-y-4">
              
              {/* Recharts Bar Chart Widget */}
              <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-3 shadow-xs text-left">
                <div className="space-y-0.5">
                  <span className="text-gray-400 font-extrabold text-[10px] uppercase block tracking-wider">7 derniers jours</span>
                  <div className="flex justify-between items-baseline">
                    <h3 className="text-[14px] font-black text-gray-950">Ventes hebdomadaires</h3>
                    <span className="text-[11px] font-bold text-[#E52327]">1 045 000 FCFA</span>
                  </div>
                </div>

                <div className="h-[140px] w-full mt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={[
                        { name: 'Ven', sales: 125000 },
                        { name: 'Sam', sales: 210000 },
                        { name: 'Dim', sales: 185000 },
                        { name: 'Lun', sales: 95000 },
                        { name: 'Mar', sales: 115000 },
                        { name: 'Mer', sales: 140000 },
                        { name: 'Jeu', sales: 175000 }
                      ]}
                      margin={{ top: 10, right: 5, left: -22, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" opacity={0.4} />
                      <XAxis 
                        dataKey="name" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: '#64748B', fontSize: 10, fontWeight: 'bold' }} 
                      />
                      <YAxis 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: '#64748B', fontSize: 9, fontWeight: 'bold' }}
                        tickFormatter={(v) => `${v / 1000}k`}
                      />
                      <Tooltip 
                        cursor={{ fill: '#FFF1F2', opacity: 0.5 }}
                        contentStyle={{ 
                          backgroundColor: '#1E293B', 
                          borderRadius: '8px', 
                          border: 'none', 
                          fontSize: '11px', 
                          color: '#FFF',
                          fontWeight: 'bold' 
                        }}
                        formatter={(val: any) => [`${val.toLocaleString()} FCFA`, 'Ventes']}
                        labelStyle={{ color: '#94A3B8', fontSize: '10px' }}
                      />
                      <Bar dataKey="sales" radius={[4, 4, 0, 0]}>
                        {[
                          { name: 'Ven', sales: 125000 },
                          { name: 'Sam', sales: 210000 },
                          { name: 'Dim', sales: 185000 },
                          { name: 'Lun', sales: 95000 },
                          { name: 'Mar', sales: 115000 },
                          { name: 'Mer', sales: 140000 },
                          { name: 'Jeu', sales: 175000 }
                        ].map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={entry.sales > 150000 ? '#E52327' : '#FCA5A5'} 
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Total Revenues graph widget */}
              <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-3.5 shadow-xs">
                <div className="space-y-1">
                  <span className="text-gray-400 font-extrabold text-[10px] uppercase block">Revenus</span>
                  <div className="text-2xl font-black text-gray-950">1 350 000 FCFA</div>
                  <span className="text-[11.5px] text-green-600 font-extrabold flex items-center gap-0.5">
                    ↑ 18% <span className="text-gray-400 font-normal">vs Avr. 2024</span>
                  </span>
                </div>

                {/* Exact Red Bar Chart Mockup Rendering */}
                <div className="h-[125px] w-full flex items-end justify-between px-2 pt-2 pb-1 bg-red-50/10 rounded-xl relative">
                  {/* Grid helper lines in bg */}
                  <div className="absolute inset-x-0 top-[20%] border-t border-gray-100/50 pointer-events-none"></div>
                  <div className="absolute inset-x-0 top-[50%] border-t border-gray-100/50 pointer-events-none"></div>
                  <div className="absolute inset-x-0 top-[80%] border-t border-gray-100/50 pointer-events-none"></div>

                  {/* Vertical red/rose rounded responsive columns representation */}
                  {[
                    { val: '75%', date: '1 Mai' },
                    { val: '88%', date: '8 Mai' },
                    { val: '55%', date: '15 Mai' },
                    { val: '80%', date: '22 Mai' },
                    { val: '92%', date: '29 Mai' }
                  ].map((bar, barIdx) => (
                    <div key={barIdx} className="flex flex-col items-center flex-1 h-full justify-end group z-10">
                      <div 
                        style={{ height: bar.val }}
                        className="w-5 bg-[#E52327] hover:bg-red-700 transition-all rounded-t-md relative flex justify-center cursor-pointer"
                        title={bar.date}
                      >
                        {/* Hover values tooltip */}
                        <span className="absolute -top-6 bg-slate-900 text-white text-[9px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition whitespace-nowrap font-mono">{bar.val}</span>
                      </div>
                      <span className="text-[9px] font-black text-gray-400 mt-2 tracking-tight whitespace-nowrap">{bar.date}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Core mini indicators grid */}
              <div className="grid grid-cols-2 gap-3.5">
                {/* Orders box */}
                <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-xs flex flex-col justify-between">
                  <div className="space-y-1">
                    <span className="text-gray-400 block text-[9.5px] uppercase font-bold">Commandes</span>
                    <div className="text-xl font-black text-gray-950">320</div>
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] text-green-600 font-bold mt-2">
                    <span>↑ 15%</span>
                  </div>
                </div>

                {/* Average Basket box */}
                <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-xs flex flex-col justify-between">
                  <div className="space-y-1">
                    <span className="text-gray-400 block text-[9.5px] uppercase font-bold">Panier moyen</span>
                    <div className="text-xl font-black text-gray-950">4 218 FCFA</div>
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] text-green-600 font-bold mt-2">
                    <span>↑ 8%</span>
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* =======================================================
            VEND-SCREEN 6: PROFIL RESTAURANT
            ======================================================= */}
        {vendorScreen === 6 && (
          <div className="flex-1 flex flex-col bg-[#F9F9FB] overflow-hidden pb-[70px]">
            {/* Header */}
            <div className="px-5 pt-3 pb-3 flex justify-between items-center bg-white sticky top-0 z-30 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="p-1.5 bg-gray-50 rounded-lg">
                  <MenuIcon className="w-5 h-5 text-gray-800" />
                </div>
                <h1 className="text-[17px] font-black tracking-tight text-gray-950">
                  {isEditingVendor ? "Modifier ma boutique" : "Profil restaurant"}
                </h1>
              </div>
              <button 
                onClick={() => {
                  setIsEditingVendor(!isEditingVendor);
                  showToast(isEditingVendor ? "Mode consultation activé" : "Outils de personnalisation ouverts !");
                }}
                className={`w-9 h-9 rounded-full flex items-center justify-center border transition ${isEditingVendor ? 'bg-green-500 border-green-500 text-white' : 'bg-gray-50 border-gray-100 text-gray-800 hover:bg-gray-100'}`}
              >
                {isEditingVendor ? '✓' : <Edit className="w-4 h-4 text-gray-800" />}
              </button>
            </div>

            {/* If in read-only consultation mode */}
            {!isEditingVendor ? (
              <>
                {/* Profile Cover & Logo Column */}
                <div className="relative shrink-0 text-center">
                  <div className="h-[100px] w-full bg-slate-200 relative">
                    <img src={vendorCoverUrl} className="w-full h-full object-cover" />
                    <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-white to-transparent" />
                  </div>
                  
                  <div className="flex flex-col items-center -mt-10 relative z-10 px-4 pb-4 bg-white border-b border-gray-100 space-y-1">
                    <div className="w-[74px] h-[74px] rounded-full overflow-hidden border-3 border-white shadow-md bg-white">
                      <img 
                        src={vendorLogo} 
                        alt={vendorName} 
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <div>
                      <div className="flex items-center justify-center gap-1.5 pt-1">
                        <h2 className="text-[16px] font-black tracking-tight text-gray-950 leading-none">{vendorName}</h2>
                        <Shield className={`w-3.5 h-3.5 shrink-0 stroke-[2.5] ${
                          kycStatus === 'verified' 
                            ? 'text-green-500 fill-green-50' 
                            : kycStatus === 'pending' 
                              ? 'text-amber-500 fill-amber-50 animate-pulse' 
                              : 'text-red-500 fill-red-55'
                        }`} />
                      </div>
                      
                      <p className="text-[10px] text-gray-400 font-extrabold mt-1 uppercase tracking-wider">
                        {vendorOpeningShift}
                      </p>

                      <div className="flex items-center justify-center gap-2 mt-1.5">
                        <span className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full ${isRestaurantOpen ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {isRestaurantOpen ? 'Cuisine Ouverte ✓' : 'Fermé ✗'}
                        </span>
                        <span className="bg-amber-100 text-amber-800 text-[9.5px] font-extrabold px-2 py-0.5 rounded-full">
                          ⏱ {vendorPrepTime} min prep
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Listing specifications container */}
                <div className="flex-1 overflow-y-auto no-scrollbar p-4 space-y-3">
                  
                  {/* Statut de Conformité KYC Card */}
                  <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-2xs text-left space-y-3">
                    <div className="flex justify-between items-center border-b border-gray-50 pb-2">
                      <h3 className="text-gray-950 font-black text-[12.5px] flex items-center gap-1.5">
                        <Shield className="w-4 h-4 text-[#E52327]" />
                        <span>Statut de Conformité KYC</span>
                      </h3>
                      <button
                        onClick={() => {
                          const nextStatus = kycStatus === 'verified' ? 'pending' : kycStatus === 'pending' ? 'rejected' : 'verified';
                          setKycStatus(nextStatus);
                          showToast(`Statut KYC Boutique simulé : ${nextStatus.toUpperCase()} 🔄`);
                        }}
                        className="text-[9px] uppercase font-black bg-gray-100 text-gray-700 hover:bg-[#E52327] hover:text-white px-2 py-0.5 rounded-md transition"
                      >
                        Simuler ⚙
                      </button>
                    </div>

                    <div className="flex items-center gap-2.5 bg-slate-50 p-2.5 rounded-xl border border-gray-50">
                      <div className={`p-2 rounded-lg ${
                        kycStatus === 'verified' 
                          ? 'bg-green-100 text-green-600' 
                          : kycStatus === 'pending' 
                            ? 'bg-amber-100 text-amber-600' 
                            : 'bg-red-100 text-red-600'
                      }`}>
                        <Shield className={`w-5 h-5 stroke-[2.5] ${kycStatus === 'pending' ? 'animate-pulse' : ''}`} />
                      </div>
                      <div className="flex-1 leading-tight text-left">
                        <span className="text-[9.5px] text-gray-400 block uppercase font-bold tracking-wider">État d'approbation</span>
                        <p className={`text-[12px] font-black ${
                          kycStatus === 'verified' ? 'text-green-700' : kycStatus === 'pending' ? 'text-amber-700' : 'text-red-700'
                        }`}>
                          {kycStatus === 'verified' && "Boutique Officielle Vérifiée ✓"}
                          {kycStatus === 'pending' && "En cours d'homologation ⏳"}
                          {kycStatus === 'rejected' && "Documents rejetés ou expirés ✗"}
                        </p>
                        <p className="text-[9px] text-gray-500 mt-0.5 leading-snug">
                          {kycStatus === 'verified' && "Votre registre de commerce et CNI du gérant sont validés."}
                          {kycStatus === 'pending' && "Vérification de vos pièces administratives d'entreprise."}
                          {kycStatus === 'rejected' && "Veuillez téléverser à nouveau votre registre de commerce."}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Delivery conditions config card */}
                  <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-2xs text-left space-y-2.5">
                    <h3 className="text-gray-950 font-black text-[12.5px] border-b border-gray-50 pb-2">
                      🚴 Paramètres de livraison
                    </h3>
                    <div className="flex justify-between items-center text-xs font-semibold">
                      <span className="text-gray-400 font-extrabold uppercase text-[9px]">Livraison gratuite dès</span>
                      <span className="text-[#E52327] font-black">{vendorFreeDelivery.toLocaleString('fr-FR')} FCFA</span>
                    </div>
                    <div className="flex justify-between items-center text-xs font-semibold border-t border-gray-50 pt-2">
                      <span className="text-gray-400 font-extrabold uppercase text-[9px]">Temps de préparation moyen</span>
                      <span className="text-slate-900 font-black">{vendorPrepTime} minutes</span>
                    </div>
                  </div>

                  {/* Option 1 hours */}
                  <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-2xs flex gap-3.5 text-xs text-gray-600 font-bold">
                    <Clock className="w-5 h-5 text-[#E52327] shrink-0" />
                    <div className="space-y-0.5 leading-tight text-left">
                      <span className="text-gray-400 block text-[9.5px] uppercase">Horaires d'ouverture</span>
                      <p className="text-gray-950 font-black text-[12.5px]">{vendorOpeningShift}</p>
                    </div>
                  </div>

                  {/* Option 2 Address */}
                  <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-2xs flex gap-3.5 text-xs text-gray-600 font-bold">
                    <MapPin className="w-5 h-5 text-[#E52327] shrink-0" />
                    <div className="space-y-0.5 leading-normal text-left">
                      <span className="text-gray-400 block text-[9.5px] uppercase">Adresse de retrait</span>
                      <p className="text-gray-950 font-black text-[12px]">
                        {vendorAddress}
                      </p>
                    </div>
                  </div>

                  {/* Option 3 Phone */}
                  <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-2xs flex gap-3.5 text-xs text-gray-600 font-bold">
                    <Phone className="w-5 h-5 text-[#E52327] shrink-0" />
                    <div className="space-y-0.5 leading-tight text-left">
                      <span className="text-gray-400 block text-[9.5px] uppercase">Contact de la gérance</span>
                      <p className="text-[#E52327] font-black text-[13px] font-mono">{vendorPhone}</p>
                    </div>
                  </div>

                  {/* Option 4 Mail */}
                  <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-2xs flex gap-3.5 text-xs text-gray-600 font-bold">
                    <Mail className="w-5 h-5 text-[#E52327] shrink-0" />
                    <div className="space-y-0.5 leading-tight text-left">
                      <span className="text-gray-400 block text-[9.5px] uppercase">Email professionel</span>
                      <p className="text-gray-950 font-extrabold text-[12.5px] font-mono">{vendorEmail}</p>
                    </div>
                  </div>

                  {/* Option 5 Bio */}
                  <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-2xs flex gap-3.5 text-xs text-gray-600 font-bold">
                    <Info className="w-5 h-5 text-[#E52327] shrink-0" />
                    <div className="space-y-0.5 leading-relaxed text-left">
                      <span className="text-gray-400 block text-[9.5px] uppercase">Histoire du Maquis (Bio)</span>
                      <p className="text-gray-800 font-medium">
                        {vendorBio}
                      </p>
                    </div>
                  </div>

                  {/* Two factor info indicator */}
                  <div className="p-3 bg-slate-100 rounded-xl flex justify-between items-center text-xs">
                    <span className="font-extrabold text-[#E52327]">🔒 Protection 2FA Activée ?</span>
                    <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${vendor2Fa ? 'bg-green-150 text-green-700' : 'bg-gray-200 text-gray-500'}`}>
                      {vendor2Fa ? 'Actif ✓' : 'Inactif'}
                    </span>
                  </div>

                </div>
              </>
            ) : (
              /* If in EDIT mode */
              <div className="flex-1 overflow-y-auto no-scrollbar p-5 space-y-4">
                
                {/* 1. Shop Info */}
                <div className="bg-white p-4.5 rounded-2xl border border-gray-100 space-y-3.5 text-left text-xs">
                  <h3 className="font-extrabold text-slate-800 text-[12px] border-b border-gray-50 pb-1.5 uppercase tracking-wider">
                    🏬 Coordonnées Commerciales
                  </h3>
                  <div className="space-y-1">
                    <label className="text-gray-400 text-[9.5px] uppercase font-bold">Nom du maquis</label>
                    <input 
                      type="text" 
                      value={vendorName}
                      onChange={(e) => setVendorName(e.target.value)}
                      className="w-full h-9 px-3 bg-gray-50 border border-gray-150 rounded-xl outline-none font-bold text-slate-900" 
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-gray-400 text-[9.5px] uppercase font-bold">Bio de présentation</label>
                    <textarea 
                      value={vendorBio}
                      onChange={(e) => setVendorBio(e.target.value)}
                      rows={2}
                      className="w-full p-2.5 bg-gray-50 border border-gray-150 rounded-xl outline-none font-semibold text-slate-800 size-y-none" 
                    />
                  </div>
                </div>

                {/* 2. Visual identity with interactive sliders & buttons */}
                <div className="bg-white p-4.5 rounded-2xl border border-gray-100 space-y-4 text-left text-xs">
                  <h3 className="font-extrabold text-slate-800 text-[12px] border-b border-gray-50 pb-1.5 uppercase tracking-wider">
                    🎨 Identité visuelle (Image & Logo)
                  </h3>
                  
                  {/* cover visual setup */}
                  <div className="space-y-1.5">
                    <label className="text-gray-400 text-[9.5px] uppercase font-bold">Image de couverture du Maquis</label>
                    <div className="flex gap-2 overflow-x-auto no-scrollbar py-0.5">
                      {[
                        { label: "Brazier", url: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=350&auto=format&fit=crop&q=80' },
                        { label: "Plat mijoté", url: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=350&auto=format&fit=crop&q=80' },
                        { label: "Spices d'Afrique", url: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=350&auto=format&fit=crop&q=80' }
                      ].map(imgOpt => (
                        <button
                          key={imgOpt.label}
                          type="button"
                          onClick={() => {
                            setVendorCoverUrl(imgOpt.url);
                            showToast(`Bannière "${imgOpt.label}" de maquis sélectionnée !`);
                          }}
                          className={`px-3 py-1.5 border rounded-lg bg-white shrink-0 transition font-black text-[9.5px] ${vendorCoverUrl === imgOpt.url ? 'border-[#E52327] text-white bg-[#E52327]' : 'border-gray-200'}`}
                        >
                          {imgOpt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Logo / Chef avatar selection with simulated local upload */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <label className="text-gray-400 text-[9.5px] uppercase font-bold">Logo du Maquis</label>
                      
                      <label className="cursor-pointer bg-slate-50 border px-2 py-0.5 rounded text-[8.5px] font-black hover:bg-gray-100 transition inline-block uppercase tracking-wider">
                        Déposer un Logo 📂
                        <input 
                          type="file" 
                          accept="image/*" 
                          className="hidden" 
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              const fUrl = URL.createObjectURL(e.target.files[0]) || 'https://images.unsplash.com/photo-1544025162-d76694265947?w=200&auto=format&fit=crop&q=80';
                              setVendorLogo(fUrl);
                              showToast("Fichier de logo importé (simulation)");
                            }
                          }}
                        />
                      </label>
                    </div>
                    <div className="flex gap-2">
                      {[
                        { name: "Fatou", url: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=200&auto=format&fit=crop&q=80' },
                        { name: "Marmite d'or", url: 'https://images.unsplash.com/photo-1547592180-85f173990554?w=200&auto=format&fit=crop&q=80' },
                        { name: "Chef Chapeau", url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80' }
                      ].map(log => (
                        <button
                          key={log.name}
                          type="button"
                          onClick={() => {
                            setVendorLogo(log.url);
                            showToast(`Logo "${log.name}" actif !`);
                          }}
                          className={`flex items-center gap-1.5 px-2 py-1 border rounded-lg shrink-0 text-[10px] font-black bg-white transition ${vendorLogo === log.url ? 'border-red-500 bg-red-50' : 'border-gray-200'}`}
                        >
                          <img src={log.url} className="w-5 h-5 rounded-full object-cover" />
                          <span>{log.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* 3. Preparing and service preferences (Kitchen setup + Delivery controls) */}
                <div className="bg-white p-4.5 rounded-2xl border border-gray-100 space-y-4 text-left text-xs">
                  <h3 className="font-extrabold text-slate-800 text-[12px] border-b border-gray-50 pb-1.5 uppercase tracking-wider">
                    ⚙️ Gestion Opérationnelle
                  </h3>

                  {/* Open Closed dynamic kitchen */}
                  <div className="flex justify-between items-center p-2.5 bg-red-500/5 border border-red-500/10 rounded-xl">
                    <div>
                      <h4 className="font-extrabold text-[#E52327]">Boutique Ouverte (En ligne)</h4>
                      <p className="text-[9.5px] text-gray-400">Permettre aux clients de soumettre des commandes.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const nextState = !isRestaurantOpen;
                        setIsRestaurantOpen(nextState);
                        showToast(nextState ? "Boutique en ligne disponible ! ✓" : "Boutique Hors-ligne !");
                      }}
                      className={`w-11 h-6 rounded-full p-0.5 transition-colors duration-200 outline-none ${isRestaurantOpen ? 'bg-green-500' : 'bg-gray-300'}`}
                    >
                      <div className={`bg-white w-5 h-5 rounded-full shadow-md transform transition-transform duration-200 ${isRestaurantOpen ? 'translate-x-5' : 'translate-x-0'}`} />
                    </button>
                  </div>

                  {/* Prep time slider matching constraint */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center font-bold text-[11px]">
                      <span className="text-gray-500">Temps de préparation moyen :</span>
                      <span className="text-[#E52327] font-extrabold">{vendorPrepTime} minutes</span>
                    </div>
                    <input 
                      type="range" 
                      min="10" 
                      max="60" 
                      step="5"
                      value={vendorPrepTime}
                      onChange={(e) => setVendorPrepTime(parseInt(e.target.value, 10))}
                      className="w-full accent-[#E52327] cursor-pointer" 
                    />
                    <div className="flex justify-between text-[8.5px] text-gray-400 font-bold">
                      <span>10 min (Super rapide)</span>
                      <span>60 min (Plat mijoté)</span>
                    </div>
                  </div>

                  {/* Delivery override minimum text input */}
                  <div className="space-y-1 pt-1">
                    <label className="text-gray-400 text-[9.5px] uppercase font-bold">Livraison gratuite au dessus de (FCFA)</label>
                    <input 
                      type="number" 
                      value={vendorFreeDelivery}
                      onChange={(e) => setVendorFreeDelivery(parseInt(e.target.value, 10) || 0)}
                      className="w-full h-9 px-3 bg-gray-50 border border-gray-150 rounded-xl outline-none font-bold" 
                    />
                  </div>

                  {/* Operating shifts selector dropdown */}
                  <div className="space-y-1 pt-1">
                    <label className="text-gray-400 text-[9.5px] uppercase font-bold">Créneaux d'horaires d'ouverture</label>
                    <select
                      value={vendorOpeningShift}
                      onChange={(e) => setVendorOpeningShift(e.target.value)}
                      className="w-full h-9 px-2 bg-gray-50 border border-gray-150 rounded-xl font-bold text-slate-800 outline-none text-xs"
                    >
                      <option value="Matin & Soir (08h - 23h)">Journée continue (08h - 23h)</option>
                      <option value="Uniquement Midi (11h - 15h)">Uniquement Midi (11h - 15h)</option>
                      <option value="Fou de Nuit (18h - 04h)">Fou de Nuit (18h - 04h)</option>
                      <option value="24/7 de Ouaga">Ouvert 24h / 24 - H24</option>
                    </select>
                  </div>
                </div>

                {/* 4. Contact and Security Info (2FA change + password configuration) */}
                <div className="bg-white p-4.5 rounded-2xl border border-gray-100 space-y-3.5 text-left text-xs">
                  <h3 className="font-extrabold text-slate-800 text-[12px] border-b border-gray-50 pb-1.5 uppercase tracking-wider">
                    🔒 Coordonnées & Sécurité Sécurisée
                  </h3>
                  <div className="space-y-1">
                    <label className="text-gray-400 text-[9.5px] uppercase font-bold">Contact Téléphonique de l'administrateur</label>
                    <input 
                      type="text" 
                      value={vendorPhone}
                      onChange={(e) => setVendorPhone(e.target.value)}
                      className="w-full h-9 px-3 bg-gray-50 border border-gray-150 rounded-xl font-mono" 
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-gray-400 text-[9.5px] uppercase font-bold">Adresse Email de sécurité</label>
                    <input 
                      type="email" 
                      value={vendorEmail}
                      onChange={(e) => setVendorEmail(e.target.value)}
                      className="w-full h-9 px-3 bg-gray-50 border border-gray-150 rounded-xl font-mono" 
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-gray-400 text-[9.5px] uppercase font-bold">Nom de Rue / Adresse Physique</label>
                    <input 
                      type="text" 
                      value={vendorAddress}
                      onChange={(e) => setVendorAddress(e.target.value)}
                      className="w-full h-9 px-3 bg-gray-50 border border-gray-150 rounded-xl font-bold" 
                    />
                  </div>

                  <div className="space-y-1 border-t border-gray-50 pt-2.5">
                    <label className="text-gray-400 text-[9.5px] uppercase font-bold">Simuler le changement de mot de passe de boutique</label>
                    <input 
                      type="password" 
                      placeholder="••••••••" 
                      value={vendorPassword}
                      onChange={(e) => setVendorPassword(e.target.value)}
                      className="w-full h-9 px-3 bg-gray-50 border border-gray-150 rounded-xl outline-none" 
                    />
                  </div>

                  {/* 2FA Toggle match constraint */}
                  <div className="flex justify-between items-center p-2.5 bg-slate-50 border border-slate-100 rounded-xl">
                    <div>
                      <h4 className="font-extrabold text-slate-900">Double Facteur Boutique (SMS)</h4>
                      <p className="text-[9px] text-gray-400">Authentification forte requise pour l'administration.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const nextState = !vendor2Fa;
                        setVendor2Fa(nextState);
                        localStorage.setItem('DODO_VENDOR_2FA', nextState ? 'true' : 'false');
                        showToast(nextState ? "Code de validation SMS de sécurité Boutique activé 🔒" : "Authentification faible");
                      }}
                      className={`w-11 h-6 rounded-full p-0.5 transition-colors duration-200 outline-none ${vendor2Fa ? 'bg-green-500' : 'bg-gray-300'}`}
                    >
                      <div className={`bg-white w-5 h-5 rounded-full shadow-md transform transition-transform duration-200 ${vendor2Fa ? 'translate-x-5' : 'translate-x-0'}`} />
                    </button>
                  </div>
                </div>

                {/* Save edits main button */}
                <button
                  type="button"
                  onClick={() => {
                    localStorage.setItem('DODO_VENDOR_NAME', vendorName);
                    localStorage.setItem('DODO_VENDOR_LOGO', vendorLogo);
                    localStorage.setItem('DODO_VENDOR_COVER', vendorCoverUrl);
                    localStorage.setItem('DODO_VENDOR_PREP', vendorPrepTime.toString());
                    localStorage.setItem('DODO_VENDOR_FREE_DEL', vendorFreeDelivery.toString());
                    localStorage.setItem('DODO_VENDOR_SHIFT', vendorOpeningShift);
                    localStorage.setItem('DODO_VENDOR_EMAIL', vendorEmail);
                    localStorage.setItem('DODO_VENDOR_PHONE', vendorPhone);
                    localStorage.setItem('DODO_VENDOR_ADDRESS', vendorAddress);
                    localStorage.setItem('DODO_VENDOR_BIO', vendorBio);
                    
                    if (vendorPassword) {
                      showToast("Nouveau mot de passe de boutique enregistré !");
                      setVendorPassword('');
                    }
                    
                    setIsEditingVendor(false);
                    showToast("Paramètres du Maquis mis à jour avec succès ! ✓");
                  }}
                  className="w-full h-[44px] bg-green-600 hover:bg-green-700 text-white font-extrabold rounded-2xl text-[11px] uppercase tracking-wider transition shadow-sm"
                >
                  Confirmer et enregistrer ✓
                </button>

              </div>
            )}

          </div>
        )}

        {/* =======================================================
            STICKY BOTTOM NAV BAR (Shared style for Dodo Vendeur)
            ======================================================= */}
        <div id="vendor_bottom_tab_bar" className="absolute bottom-0 inset-x-0 h-[67px] bg-white border-t border-gray-1.5 flex justify-around items-center px-4 pb-2 z-40 text-[9.5px] tracking-tight font-black uppercase text-gray-400 text-center leading-none">
          
          {/* Nav Item 1: Accueil */}
          <button 
            onClick={() => handleScreenChange(1)}
            className={`flex flex-col items-center justify-center gap-1.5 flex-1 py-1 ${vendorScreen === 1 ? 'text-[#E52327]' : 'text-gray-400 hover:text-gray-600'}`}
          >
            <Home className={`w-[21px] h-[21px] transition-transform ${vendorScreen === 1 ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
            <span>Accueil</span>
          </button>

          {/* Nav Item 2: Commandes */}
          <button 
            onClick={() => handleScreenChange(2)}
            className={`flex flex-col items-center justify-center gap-1.5 flex-1 py-1 relative ${vendorScreen === 2 ? 'text-[#E52327]' : 'text-gray-400 hover:text-gray-600'}`}
          >
            <ClipboardList className={`w-[21px] h-[21px] transition-transform ${vendorScreen === 2 ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
            <span>Commandes</span>
            {nouvellesOrdersList.length > 0 && (
              <span className="absolute top-[3px] right-[16%] w-2 h-2 rounded-full bg-[#E52327] animate-pulse"></span>
            )}
          </button>

          {/* Nav Item 3: Menu */}
          <button 
            onClick={() => handleScreenChange(3)}
            className={`flex flex-col items-center justify-center gap-1.5 flex-1 py-1 ${vendorScreen === 3 || vendorScreen === 4 ? 'text-[#E52327]' : 'text-gray-400 hover:text-gray-600'}`}
          >
            <ChefHat className={`w-[21px] h-[21px] transition-transform ${(vendorScreen === 3 || vendorScreen === 4) ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
            <span>Menu</span>
          </button>

          {/* Nav Item 4: Statistiques */}
          <button 
            onClick={() => handleScreenChange(5)}
            className={`flex flex-col items-center justify-center gap-1.5 flex-1 py-1 ${vendorScreen === 5 ? 'text-[#E52327]' : 'text-gray-400 hover:text-gray-600'}`}
          >
            <BarChart3 className={`w-[21px] h-[21px] transition-transform ${vendorScreen === 5 ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
            <span>Stats</span>
          </button>

          {/* Nav Item 5: Profil */}
          <button 
            onClick={() => handleScreenChange(6)}
            className={`flex flex-col items-center justify-center gap-1.5 flex-1 py-1 ${vendorScreen === 6 ? 'text-[#E52327]' : 'text-gray-400 hover:text-gray-600'}`}
          >
            <User className={`w-[21px] h-[21px] transition-transform ${vendorScreen === 6 ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
            <span>Profil</span>
          </button>

        </div>

      </div>
    </div>
  );
}
