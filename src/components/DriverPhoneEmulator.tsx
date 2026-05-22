/**
 * @license
 * SPDX-License-Identifier: Apache-2.5
 */

import React, { useState, useEffect } from 'react';
import { 
  Menu as MenuIcon, Bell, DollarSign, SwitchCamera, Check, ChevronRight, Star, 
  MapPin, Phone, MessageSquare, Compass, Gift, Clock, Globe, ArrowRight, User, 
  Settings, HelpCircle, LogOut, ChevronLeft, ArrowLeft, Fuel, Award, X, Navigation, RotateCcw,
  Shield, Volume2, VolumeX, Home, ClipboardList, Wallet
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Restaurant, MenuItem, Order, OrderStatus } from '../types';
import DodoLogo from './DodoLogo';
import DodoLiveGoogleMap from './DodoLiveGoogleMap';
import { useAppStore } from '../lib/store';
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid 
} from 'recharts';
import { DodoSoundManager } from '../lib/sound';

const MOCK_EARNINGS_30_DAYS = [
  { day: '01', gains: 3500 },
  { day: '03', gains: 4200 },
  { day: '05', gains: 2800 },
  { day: '07', gains: 5100 },
  { day: '09', gains: 6000 },
  { day: '11', gains: 4100 },
  { day: '13', gains: 3000 },
  { day: '15', gains: 4500 },
  { day: '17', gains: 5800 },
  { day: '19', gains: 4000 },
  { day: '21', gains: 5500 },
  { day: '23', gains: 6900 },
  { day: '25', gains: 5200 },
  { day: '27', gains: 6400 },
  { day: '29', gains: 7800 },
  { day: '30', gains: 9500 }
];

interface DriverPhoneEmulatorProps {
  restaurants: Restaurant[];
  menuItems: MenuItem[];
  orders: Order[];
  onOrdersChange: (updatedOrders: Order[]) => void;
  driverScreenId: number;
  setDriverScreenId: (id: number) => void;
  onScreenChange?: (screenId: number) => void;
}

export default function DriverPhoneEmulator({
  restaurants,
  menuItems,
  orders,
  onOrdersChange,
  driverScreenId,
  setDriverScreenId,
  onScreenChange,
}: DriverPhoneEmulatorProps) {
  const { language } = useAppStore();
  const driverScreen = driverScreenId;
  const setDriverScreen = (id: number) => {
    setDriverScreenId(id);
    if (onScreenChange) {
      onScreenChange(id);
    }
  };

  // State Management
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [kycStatus, setKycStatus] = useState<'verified' | 'pending' | 'rejected'>('verified');
  const [gainsFilterTab, setGainsFilterTab] = useState<'Aujourd\'hui' | 'Semaine' | 'Mois'>('Aujourd\'hui');
  const [acceptCountdown, setAcceptCountdown] = useState<number>(30);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Premium Driver customization states
  const [isEditingDriver, setIsEditingDriver] = useState<boolean>(false);
  const [driverName, setDriverName] = useState<string>(() => localStorage.getItem('DODO_DRIVER_NAME') || 'Blaise Kaboré');
  const [driverPhone, setDriverPhone] = useState<string>(() => localStorage.getItem('DODO_DRIVER_PHONE') || '+226 70 12 34 56');
  const [driverEmail, setDriverEmail] = useState<string>(() => localStorage.getItem('DODO_DRIVER_EMAIL') || 'blaise.kabore@gmail.com');
  const [driverAvatar, setDriverAvatar] = useState<string>(() => localStorage.getItem('DODO_DRIVER_AVATAR') || 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=250&auto=format&fit=crop&q=80');
  const [driverVehicleModel, setDriverVehicleModel] = useState<string>(() => localStorage.getItem('DODO_DRIVER_VEHICLE_MODEL') || 'Moto • Honda CG125');
  const [driverLicensePlate, setDriverLicensePlate] = useState<string>(() => localStorage.getItem('DODO_DRIVER_LICENSE_PLATE') || '11 BF 1234');
  const [driverAvailability, setDriverAvailability] = useState<string>(() => localStorage.getItem('DODO_DRIVER_AVAILABILITY') || 'Disponible'); // 'Disponible' | 'En pause' | 'Inactif'
  const [driverPreferredZone, setDriverPreferredZone] = useState<string>(() => localStorage.getItem('DODO_DRIVER_PREF_ZONE') || 'Ouaga 2000 & Centre-Ville');
  const [driverPassword, setDriverPassword] = useState<string>('');
  const [driver2Fa, setDriver2Fa] = useState<boolean>(() => localStorage.getItem('DODO_DRIVER_2FA') === 'true');
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState<boolean>(false);
  
  // Custom states for active mission details modal & full itinerary route tracing
  const [isOrderDetailsOpen, setIsOrderDetailsOpen] = useState<boolean>(false);
  const [showFullRouteTracing, setShowFullRouteTracing] = useState<boolean>(false);
  const [selectedCompletedOrder, setSelectedCompletedOrder] = useState<any | null>(null);

  // Active mission state (we assign the active order here)
  const [activeOrderId, setActiveOrderId] = useState<string | null>(() => {
    // Find the first order with status 'Prête' or 'En route' or default to first order
    return orders.find(o => o.status === 'Prête' || o.status === 'En route')?.id || orders[0]?.id || 'order_1';
  });

  // Real-time sound alarm states for Livreur
  const [isSoundEnabled, setIsSoundEnabled] = useState<boolean>(() => {
    return localStorage.getItem('DODO_DRIVER_SOUND_ENABLED') !== 'false';
  });

  // Dynamically update activeOrderId and play alarms when there's an active ready mission
  useEffect(() => {
    const readyMission = orders.find(o => o.status === 'Prête');
    const enRouteMission = orders.find(o => o.status === 'En route');

    // 1. Sync activeOrderId
    if (readyMission) {
      setActiveOrderId(readyMission.id);
    } else if (enRouteMission) {
      setActiveOrderId(enRouteMission.id);
    }

    // 2. Control alarm and screen transition
    DodoSoundManager.setMuted(!isSoundEnabled);

    if (readyMission && isOnline) {
      if (isSoundEnabled) {
        DodoSoundManager.playDriverAlert();
      }
      // Automatiquement rediriger le livreur en ligne vers la proposition de course
      if (driverScreen === 1) {
        setDriverScreen(2);
      }
    } else {
      DodoSoundManager.stop();
    }

    return () => {
      DodoSoundManager.stop();
    };
  }, [orders, isOnline, isSoundEnabled, driverScreen]);

  const toggleSound = () => {
    const nextVal = !isSoundEnabled;
    setIsSoundEnabled(nextVal);
    localStorage.setItem('DODO_DRIVER_SOUND_ENABLED', String(nextVal));
    DodoSoundManager.setMuted(!nextVal);
    if (nextVal) {
      setTimeout(() => {
        DodoSoundManager.playChirp();
      }, 50);
    } else {
      DodoSoundManager.stop();
    }
  };

  const [activeStep, setActiveStep] = useState<number>(1); // 1 = Go to restaurant, 2 = Go to client

  const currentActiveOrder = orders.find(o => o.id === activeOrderId) || orders[0];

  // Helper toast notifier
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  // Accepting countdown simulation
  useEffect(() => {
    if (driverScreen === 2 && acceptCountdown > 0) {
      const timer = setTimeout(() => {
        setAcceptCountdown(prev => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (driverScreen === 2 && acceptCountdown === 0) {
      showToast("La proposition de mission a expiré !");
      setDriverScreen(1);
    }
  }, [driverScreen, acceptCountdown]);

  // Restart countdown when entering Screen 2
  useEffect(() => {
    if (driverScreen === 2) {
      setAcceptCountdown(30);
    }
  }, [driverScreen]);

  // Handle accept mission
  const handleAcceptMission = () => {
    if (!currentActiveOrder) {
      showToast("Aucune commande disponible à accepter.");
      return;
    }
    
    // Update order status in Supabase/local mock to 'En route' (On the way)
    const updated = orders.map(ord => {
      if (ord.id === currentActiveOrder.id) {
        return {
          ...ord,
          status: 'En route' as OrderStatus,
          status_times: {
            ...ord.status_times,
            on_the_way: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
          },
          driver: {
            name: 'Blaise K.',
            avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
            rating: 4.8,
            phone: '+226 76 89 90 22'
          }
        };
      }
      return ord;
    });

    onOrdersChange(updated);
    localStorage.setItem('DODO_ORDERS', JSON.stringify(updated));
    showToast("Mission acceptée ! En route vers Maquis Chez Fatou ! 🏍️");
    setActiveStep(1); // Set to step 1 (Go to restaurant)
    setDriverScreen(3); // Go to Navigation Active screen
  };

  // Confirm pickup from restaurant
  const handleConfirmPickup = () => {
    if (!currentActiveOrder) return;
    showToast("Plats récupérés ! En route vers le client Moussa Traoré. 🍛");
    setActiveStep(2); // Go to step 2 (Go to client)
  };

  // Confirm final delivery to customer
  const handleConfirmDelivery = () => {
    if (!currentActiveOrder) return;

    const updated = orders.map(ord => {
      if (ord.id === currentActiveOrder.id) {
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
    showToast("Félicitations ! Commande livrée avec succès et gains crédités. 🎉");
    setDriverScreen(4); // View Gains/Earnings screen
  };

  // Filter completed orders for history
  const completedOrders = orders.filter(o => o.status === 'Livré');

  return (
    <div id="driver_iphone_wrapper" className="relative mx-auto w-[390px] h-[844px] bg-slate-900 rounded-[55px] p-[12px] shadow-2xl border-[6px] border-slate-800 ring-1 ring-slate-700/50 flex flex-col overflow-hidden select-none">
      
      {/* Dynamic Toast System */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div 
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="absolute top-[80px] left-[5%] right-[5%] z-50 bg-[#E52327] text-white text-xs py-3 px-4 rounded-xl shadow-lg border border-red-400 flex items-center gap-2 font-bold"
          >
            <div className="w-2.5 h-2.5 rounded-full bg-white animate-ping"></div>
            <p>{toastMessage}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* iPhone Dynamic Island Speaker & Camera */}
      <div className="absolute top-[16px] left-1/2 -translate-x-1/2 w-[110px] h-[30px] bg-black rounded-[20px] z-50 flex items-center justify-between px-3">
        <div className="w-3.5 h-3.5 bg-[#1F2937] rounded-full border border-gray-900"></div>
        <div className="w-12 h-1 bg-gray-900 rounded-full"></div>
        <div className="w-2.5 h-2.5 bg-red-950/40 rounded-full"></div>
      </div>

      {/* Primary Simulator Screen Device Frame inside wrapper */}
      <div className="relative flex-1 w-full h-full bg-[#F3F4F6] rounded-[43px] overflow-hidden flex flex-col font-sans text-gray-900 shadow-inner">
        
        {/* Status Bar */}
        <div className="h-[47px] w-full flex justify-between items-end px-7 pb-2.5 bg-transparent z-40 text-black text-[14px] font-bold">
          <span>09:41</span>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] bg-green-500/15 text-green-600 px-1.5 py-0.2 rounded-md font-black">WiFi</span>
            <div className="w-5 h-2.5 border border-black rounded-sm p-0.5 flex items-center">
              <div className="w-4 h-full bg-black rounded-[1px]"></div>
            </div>
          </div>
        </div>

        {/* =======================================================
            SCREEN 1: ÉCRAN PRINCIPAL
            ======================================================= */}
        {driverScreen === 1 && (
          <div className="flex-1 flex flex-col overflow-hidden pb-[70px]">
            {/* Simple App Header with Online/Offline banner */}
            <div className="px-5 pt-3 pb-3 flex justify-between items-center bg-white border-b border-gray-100 shrink-0">
              <div className="flex items-center gap-2">
                <DodoLogo size={34} withText={true} withContainer={true} contourColor="#FFFFFF" />
                <h1 className="text-[17px] font-black tracking-tight text-gray-950">Livreur</h1>
              </div>
              <div className="flex items-center gap-1.5">
                {/* Real-time sound alert toggle for delivery missions */}
                <button 
                  onClick={toggleSound}
                  className={`relative w-9 h-9 rounded-full flex items-center justify-center border transition-all ${
                    isSoundEnabled 
                      ? 'bg-rose-50 border-rose-100 text-[#E52327]' 
                      : 'bg-gray-100 border-gray-200 text-gray-400'
                  }`}
                  title={isSoundEnabled ? "Désactiver la sonnerie livreur" : "Activer la sonnerie livreur"}
                >
                  {isSoundEnabled ? (
                    <Volume2 className={`w-4.5 h-4.5 ${orders.some(o => o.status === 'Prête') && isOnline ? 'animate-bounce' : ''}`} />
                  ) : (
                    <VolumeX className="w-4.5 h-4.5" />
                  )}
                  {orders.some(o => o.status === 'Prête') && isOnline && isSoundEnabled && (
                    <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#E52327]"></span>
                    </span>
                  )}
                </button>

                <button 
                  onClick={() => setDriverScreen(2)}
                  className="relative w-9 h-9 rounded-full bg-gray-50 flex items-center justify-center border border-gray-100"
                >
                  <Bell className="w-4.5 h-4.5 text-gray-800" />
                  <span className="absolute top-[3px] right-[3px] w-2.5 h-2.5 rounded-full bg-[#E52327]"></span>
                </button>
              </div>
            </div>

            {/* Map Frame area */}
            <div className="flex-1 relative bg-[#E5E9F0] overflow-hidden">
              <DodoLiveGoogleMap viewMode="driver_mission" height="100%" />

              {/* Float Switcher line */}
              <div className="absolute top-4 left-4 right-4 bg-white/95 backdrop-blur-md rounded-2xl p-4 shadow-md border border-gray-100 flex justify-between items-center">
                <div>
                  <h4 className="text-[13px] font-extrabold text-gray-950 flex items-center gap-1.5">
                    <span className={`w-2.5 h-2.5 rounded-full ${isOnline ? 'bg-green-500 shadow-md shadow-green-400' : 'bg-gray-400'}`}></span>
                    {isOnline ? 'Disponible' : 'Hors ligne'}
                  </h4>
                  <p className="text-[10px] text-gray-400 mt-0.5 font-bold">
                    {isOnline ? 'Vous êtes en ligne et recevrez des missions' : 'Mettez-vous en ligne pour livrer'}
                  </p>
                </div>
                <button 
                  onClick={() => {
                    setIsOnline(!isOnline);
                    showToast(isOnline ? "Vous êtes maintenant HORS LIGNE 💤" : "Vous êtes EN LIGNE ! Prêt à rouler 🏍️");
                  }}
                  className={`w-11 h-6 rounded-full p-0.5 transition-colors focus:outline-none ${isOnline ? 'bg-green-500' : 'bg-gray-300'}`}
                >
                  <div className={`bg-white w-5 h-5 rounded-full shadow-md transform transition-transform ${isOnline ? 'translate-x-5' : 'translate-x-0'}`} />
                </button>
              </div>

              {/* Floating crosshair button */}
              <button 
                onClick={() => showToast("Recalibrage GPS de Ouagadougou...")}
                className="absolute bottom-[170px] right-4 bg-white w-10 h-10 rounded-full flex items-center justify-center shadow-md border border-gray-100 text-gray-700 active:scale-95 transition"
              >
                <Compass className="w-5 h-5" />
              </button>

              {/* Botton slide-up panel for stats & missions */}
              <div className="absolute bottom-0 inset-x-0 bg-white rounded-t-[32px] shadow-2xl p-4.5 border-t border-gray-100 space-y-4">
                
                {/* Statistiques du jour title */}
                <div className="space-y-2.5">
                  <h3 className="text-gray-950 font-black text-[13.5px]">Statistiques du jour</h3>
                  
                  {/* Stats Row Block */}
                  <div className="grid grid-cols-3 gap-2.5">
                    <div className="bg-gray-50 border border-gray-100 rounded-2xl p-3 text-center">
                      <span className="text-gray-400 font-extrabold text-[9px] uppercase tracking-wider block">Livraisons</span>
                      <span className="text-lg font-black text-gray-950 block mt-0.5">12</span>
                    </div>
                    <div className="bg-gray-50 border border-gray-100 rounded-2xl p-3 text-center">
                      <span className="text-gray-400 font-extrabold text-[9px] uppercase tracking-wider block">Gains</span>
                      <span className="text-lg font-black text-[#E52327] block mt-0.5">15k <span className="text-[10px]">FCFA</span></span>
                    </div>
                    <div className="bg-gray-50 border border-gray-100 rounded-2xl p-3 text-center">
                      <span className="text-gray-400 font-extrabold text-[9px] uppercase tracking-wider block">Temps en ligne</span>
                      <span className="text-lg font-black text-gray-950 block mt-0.5">4h 30m</span>
                    </div>
                  </div>
                </div>

                {/* Bonus missions panel matching layout 1 */}
                <div className="bg-rose-50 border border-red-100 rounded-2xl p-3.5 flex justify-between items-center">
                  <div className="space-y-1 pr-4">
                    <span className="text-[#E52327] font-black text-[11.5px] uppercase tracking-wider block">Bonus missions</span>
                    <p className="text-[11px] text-gray-600 font-bold leading-normal">
                      Effectuez <span className="text-gray-900 font-extrabold">5 livraisons</span> et gagnez <span className="text-[#E52327] font-extrabold">2 000 FCFA</span> de plus !
                    </p>
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-[#E52327]/10 flex items-center justify-center text-[22px] shrink-0">
                    🎁
                  </div>
                </div>

              </div>

            </div>
          </div>
        )}

        {/* =======================================================
            SCREEN 2: NOUVELLE MISSION (Incoming order proposal)
            ======================================================= */}
        {driverScreen === 2 && (
          <div className="flex-1 flex flex-col bg-slate-50 overflow-hidden pb-[70px]">
            {/* Header banner */}
            <div className="px-5 pt-3 pb-3 flex justify-between items-center bg-white border-b border-gray-100 shrink-0">
              <button 
                onClick={toggleSound}
                className={`w-8 h-8 rounded-full flex items-center justify-center border transition-all ${
                  isSoundEnabled 
                    ? 'bg-rose-50 border-rose-100 text-[#E52327]' 
                    : 'bg-gray-100 border-gray-200 text-gray-400'
                }`}
                title={isSoundEnabled ? "Désactiver la sonnerie" : "Activer la sonnerie"}
              >
                {isSoundEnabled ? (
                  <Volume2 className="w-4 h-4 animate-bounce" />
                ) : (
                  <VolumeX className="w-4 h-4" />
                )}
              </button>
              <h1 className="text-[15px] font-black text-gray-950">Nouvelle mission</h1>
              <button 
                onClick={() => setDriverScreen(1)}
                className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-500"
              >
                <X className="w-5 h-5 stroke-[2.5]" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto no-scrollbar p-5 space-y-4">
              
              {/* Alert Message Box */}
              <div className="text-center space-y-1">
                <span className="text-[#E52327] font-black text-xs uppercase tracking-widest block">Nouvelle mission disponible</span>
                <p className="text-[11px] text-gray-400 font-bold">Acceptez cette mission pour commencer l'itinéraire de livraison</p>
              </div>

              {/* Major Card Container */}
              <motion.div 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: "spring", stiffness: 220, damping: 20 }}
                className="bg-white rounded-3xl p-4 border border-gray-100 shadow-sm space-y-4"
              >
                
                {/* RESTAURANT INFO BLOCK CONTAINER */}
                <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-2xl border border-gray-100">
                  <img 
                    src={restaurants[0]?.image_url || 'https://images.unsplash.com/photo-1544025162-d76694265947?w=200'} 
                    alt="Maquis Chez Fatou" 
                    className="w-12 h-12 rounded-xl object-cover"
                    referrerPolicy="no-referrer"
                  />
                  <div>
                    <span className="text-[9.5px] font-extrabold text-gray-400 uppercase tracking-widest block">Restaurant</span>
                    <h3 className="text-[14px] font-black text-gray-950">{restaurants[0]?.name || 'Maquis Chez Fatou'}</h3>
                    <p className="text-[11px] text-gray-500 font-bold mt-0.5">1200 Logements, Ouagadougou</p>
                  </div>
                </div>

                {/* CLIENT DETAILS BLOCK */}
                <div className="flex items-start gap-3 bg-gray-50 p-3 rounded-2xl border border-gray-100">
                  <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-lg shrink-0 mt-0.5">
                    👤
                  </div>
                  <div className="space-y-1">
                    <span className="text-[9.5px] font-extrabold text-gray-400 uppercase tracking-widest block">Client</span>
                    <h4 className="text-[13px] font-black text-gray-950">Moussa Traoré</h4>
                    <p className="text-[11.5px] font-mono font-bold text-[#E52327]">+226 70 12 34 56</p>
                    <p className="text-[11px] text-gray-600 font-bold leading-snug"><span className="text-gray-400">Adresse:</span> Avenue de l'Indépendance, Ouagadougou</p>
                  </div>
                </div>

                {/* Key Metrics details block */}
                <div className="border-t border-gray-100 pt-3.5 space-y-3.5 font-bold text-xs text-gray-600">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400 flex items-center gap-1.5 font-extrabold uppercase text-[10px] tracking-wide">
                      🗺️ Distance totale
                    </span>
                    <span className="text-gray-950 font-black text-[13.5px]">5,2 km</span>
                  </div>
                  
                  <div className="flex justify-between items-center border-t border-gray-50 pt-2.5">
                    <span className="text-gray-400 flex items-center gap-1.5 font-extrabold uppercase text-[10px] tracking-wide">
                      💰 Gain estimé
                    </span>
                    <span className="text-[#E52327] font-black text-[15px]">2 500 FCFA</span>
                  </div>

                  <div className="flex justify-between items-center border-t border-gray-50 pt-2.5">
                    <span className="text-gray-400 flex items-center gap-1.5 font-extrabold uppercase text-[10px] tracking-wide">
                      💳 Paiement
                    </span>
                    <span className="text-green-600 font-black">En ligne (Orange Money)</span>
                  </div>
                </div>

              </motion.div>

              {/* Action accept/decline drawer layout */}
              <div className="space-y-2.5 pt-4">
                <button 
                  onClick={handleAcceptMission}
                  className="w-full h-[52px] bg-[#E52327] hover:bg-red-700 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-md transition transform active:scale-98 flex items-center justify-center gap-2"
                >
                  Accepter ({acceptCountdown}s)
                </button>
                <button 
                  onClick={() => {
                    showToast("Mission refusée, recherche de nouvelles missions...");
                    setDriverScreen(1);
                  }}
                  className="w-full h-[48px] bg-white border border-gray-200 text-gray-500 py-3 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-gray-50 shadow-2xs transition"
                >
                  Refuser
                </button>
              </div>

            </div>
          </div>
        )}

        {/* =======================================================
            SCREEN 3: NAVIGATION ACTIVE / MISSION EN COURS
            ======================================================= */}
        {driverScreen === 3 && (
          <div className="flex-1 flex flex-col overflow-hidden pb-[70px]">
            
            {/* Mission banner header */}
            <div className="px-5 pt-3 pb-3 flex justify-between items-center bg-white border-b border-gray-100 sticky top-0 z-30 shrink-0">
              <div className="flex items-center gap-3">
                <MenuIcon className="w-5 h-5 text-gray-800" />
                <h1 className="text-[15.5px] font-black text-gray-950">Mission en cours</h1>
              </div>
              <div className="flex gap-2">
                <a 
                  href="tel:+22670123456" 
                  onClick={(e) => { e.preventDefault(); showToast("Appel téléphonique simulé avec le client..."); }}
                  className="w-8 h-8 rounded-full bg-red-50 text-[#E52327] flex items-center justify-center"
                >
                  <Phone className="w-4 h-4" />
                </a>
                <button 
                  onClick={() => showToast("Chat livreur <-> client initialisé")}
                  className="w-8 h-8 rounded-full bg-red-50 text-[#E52327] flex items-center justify-center"
                >
                  <MessageSquare className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Step navigation dynamic alert bar */}
            <div className="bg-slate-900 text-white px-5 py-4 flex justify-between items-center shadow-md select-none shrink-0 border-b border-[#E52327]/40">
              <div className="space-y-1 max-w-[70%]">
                <span className="text-[10px] uppercase font-black tracking-widest text-[#E52327]">
                  Étape {activeStep} sur 2
                </span>
                <h4 className="text-[13px] font-black text-white">
                  {activeStep === 1 ? 'Allez au restaurant' : 'Livrez au client'}
                </h4>
                <p className="text-[11px] text-gray-400 font-bold truncate leading-none">
                  {activeStep === 1 ? 'Maquis Chez Fatou, 1200 Logements' : 'Moussa Traoré, Avenue de l\'Indépendance'}
                </p>
              </div>
              
              <button 
                onClick={() => showToast("Navigation GPS lancée sur Google Maps")} 
                className="bg-[#E52327] hover:bg-red-700 text-white px-3 py-2 rounded-xl text-[10.5px] font-black uppercase flex items-center gap-1 select-none active:scale-95 transition"
              >
                <Navigation className="w-3.5 h-3.5 fill-white" />
                <span>Naviguer</span>
              </button>
            </div>

            {/* Live routing map area */}
            <div className="flex-1 relative bg-gray-200 overflow-hidden">
              <DodoLiveGoogleMap 
                viewMode="driver" 
                height="100%" 
                simulationProgress={activeStep === 1 ? 30 : 75}
                showFullRouteTracing={showFullRouteTracing}
              />

              {/* Float Full Itinerary Badge Indicator */}
              {showFullRouteTracing && (
                <div className="absolute top-4 left-4 right-4 bg-slate-900/95 backdrop-blur-md rounded-xl p-3 shadow-lg border border-rose-500/35 z-20 flex justify-between items-center text-white">
                  <div className="flex items-center gap-2">
                    <span className="text-[14px]">🗺️</span>
                    <div>
                      <h4 className="text-[11px] font-black text-white">Itinéraire complet affiché</h4>
                      <p className="text-[9.5px] text-gray-400 font-bold">Maquis ➔ Client Traoré</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setShowFullRouteTracing(false)}
                    className="bg-[#E52327] hover:bg-rose-700 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider text-white"
                  >
                    Fermer
                  </button>
                </div>
              )}

              {/* Botton progress sheet slide-up panel with Status List matching mockup 3 */}
              <div className="absolute bottom-0 inset-x-0 bg-white rounded-t-[32px] shadow-2xl p-4.5 border-t border-gray-100 space-y-4">
                <span className="w-10 h-1 bg-gray-300 rounded-full mx-auto block"></span>

                <div>
                  <h3 className="text-gray-900 font-black text-[13px] uppercase tracking-wider mb-3">Statut de la livraison</h3>
                  
                  {/* Status Timeline block exactly matching mockup design */}
                  <div className="space-y-3 pl-3 relative border-l-2 border-red-500/20 text-[11.5px] font-bold text-gray-500">
                    
                    {/* Item 1 */}
                    <div className="flex justify-between items-center relative">
                      <div className="absolute -left-4.5 top-1.5 w-2.5 h-2.5 rounded-full bg-green-500"></div>
                      <span className="text-green-600 font-extrabold">Acceptée</span>
                      <span className="text-gray-400 font-mono">10:30</span>
                    </div>

                    {/* Item 2 */}
                    <div className="flex justify-between items-center relative">
                      <div className="absolute -left-4.5 top-1.5 w-2.5 h-2.5 rounded-full bg-green-500"></div>
                      <span className="text-green-600 font-extrabold">En route vers le restaurant</span>
                      <span className="text-gray-400 font-mono">10:32</span>
                    </div>

                    {/* Item 3 */}
                    <div className="flex justify-between items-center relative">
                      <div className={`absolute -left-4.5 top-1.5 w-2.5 h-2.5 rounded-full ${activeStep > 1 ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                      <span className={activeStep > 1 ? 'text-green-600 font-extrabold' : 'text-gray-400'}>Commande récupérée</span>
                      <span className="text-gray-400 font-mono">{activeStep > 1 ? '10:45' : '--:--'}</span>
                    </div>

                    {/* Item 4 */}
                    <div className="flex justify-between items-center relative">
                      <div className={`absolute -left-4.5 top-1.5 w-2.5 h-2.5 rounded-full ${activeStep > 1 ? 'bg-amber-500' : 'bg-gray-300'}`}></div>
                      <span className={activeStep > 1 ? 'text-amber-600 font-extrabold' : 'text-gray-400'}>En route vers le client</span>
                      <span className="text-gray-400 font-mono">{activeStep > 1 ? '10:47' : '--:--'}</span>
                    </div>

                    {/* Item 5 */}
                    <div className="flex justify-between items-center relative">
                      <div className="absolute -left-4.5 top-1.5 w-2.5 h-2.5 rounded-full bg-gray-300"></div>
                      <span className="text-gray-400">Livrée</span>
                      <span className="text-gray-400 font-mono">--:--</span>
                    </div>

                  </div>
                </div>

                {/* Major Active Action workflow button */}
                <div className="pt-2">
                  {activeStep === 1 ? (
                    <button 
                      onClick={handleConfirmPickup}
                      className="w-full h-[48px] bg-amber-500 hover:bg-amber-600 text-white rounded-2xl font-black text-xs uppercase tracking-wider shadow-md text-center"
                    >
                      Confirmer la récupération du plat 🍳
                    </button>
                  ) : (
                    <button 
                      onClick={handleConfirmDelivery}
                      className="w-full h-[48px] bg-green-600 hover:bg-green-700 text-white rounded-2xl font-black text-xs uppercase tracking-wider shadow-md text-center"
                    >
                      Confirmer la livraison ✔️
                    </button>
                  )}
                </div>

                {/* Details Footer line */}
                <div className="flex justify-between items-center text-xs border-t border-gray-50 pt-2.5 font-bold animate-pulse">
                  <span className="text-gray-500 font-mono">Commande {currentActiveOrder?.order_number || '#DODO12345'}</span>
                  <button 
                    onClick={() => {
                      setIsOrderDetailsOpen(true);
                    }}
                    className="text-[#E52327] font-black hover:underline cursor-pointer flex items-center gap-1"
                  >
                    🔍 Voir détails de commande
                  </button>
                </div>

              </div>

            </div>

            {/* ACTIVE MISSION DETAILS DIALOG OVERLAY */}
            <AnimatePresence>
              {isOrderDetailsOpen && (
                <div 
                  className="absolute inset-0 bg-slate-950/70 backdrop-blur-xs z-50 flex items-end justify-center"
                  onClick={() => setIsOrderDetailsOpen(false)}
                >
                  <motion.div 
                    initial={{ y: "100%" }}
                    animate={{ y: 0 }}
                    exit={{ y: "100%" }}
                    transition={{ type: "spring", damping: 25, stiffness: 350 }}
                    className="bg-white rounded-t-[32px] w-full max-h-[85%] flex flex-col shadow-2xl relative border-t border-gray-150 text-slate-800"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {/* Drawer drag bar indicator */}
                    <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto my-3 shrink-0"></div>

                    {/* Scrollable details view */}
                    <div className="flex-1 overflow-y-auto no-scrollbar px-5 pb-7 text-left space-y-4">
                      
                      <div className="text-center pb-2 border-b border-gray-100">
                        <span className="text-[10px] text-[#E52327] font-black uppercase tracking-wider bg-rose-50 px-2 py-0.5 rounded-md">Mission active</span>
                        <h3 className="text-[16px] font-black text-gray-950 mt-1">Détails de la Livraison</h3>
                        <p className="font-mono text-[11px] text-gray-500">{currentActiveOrder?.order_number || '#DODO12345'}</p>
                      </div>

                      {/* Client / Delivery Info Card */}
                      <div className="space-y-1.5">
                        <span className="text-[10px] text-gray-400 font-black uppercase tracking-wider block">Destinataire & Adresse</span>
                        <div className="bg-gray-50 rounded-2xl p-3.5 border border-gray-150 space-y-2 text-xs font-semibold text-gray-800">
                          <div className="flex items-center gap-2">
                            <span className="text-[15px] shrink-0">👤</span>
                            <span className="font-extrabold text-gray-950">Moussa Traoré</span>
                          </div>
                          <div className="flex items-start gap-2">
                            <span className="text-[14px] shrink-0">📍</span>
                            <span>Avenue de l'Indépendance, Ouagadougou</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[14px] shrink-0">📞</span>
                            <span className="font-mono text-gray-600">+226 70 12 34 56</span>
                          </div>
                        </div>
                      </div>

                      {/* Items details box */}
                      <div className="space-y-1.5">
                        <span className="text-[10px] text-gray-400 font-black uppercase tracking-wider block">Contenu du Panier (Cuisine)</span>
                        <div className="bg-gray-50 rounded-2xl p-3.5 border border-gray-150 space-y-2 text-xs">
                          {currentActiveOrder?.items && currentActiveOrder.items.length > 0 ? (
                            currentActiveOrder.items.map((it, idx) => (
                              <div key={idx} className="flex justify-between font-bold text-gray-800">
                                <span>x{it.quantity} {it.menu_item.name}</span>
                                <span className="font-mono text-gray-550">Prêt 🍳</span>
                              </div>
                            ))
                          ) : (
                            <div className="flex justify-between font-bold text-gray-800">
                              <span>x1 Poulet Bicyclette Cuisiné</span>
                              <span className="font-mono text-gray-550">Prêt 🍳</span>
                            </div>
                          )}
                          <div className="border-t border-gray-150 pt-2.5 mt-2">
                            <span className="font-black text-[10px] text-amber-600 uppercase block tracking-wide">Instructions de préparation</span>
                            <p className="text-[11px] text-gray-650 italic font-medium mt-0.5">"Pas de piment, s'il vous plaît ! Prévoyez du sachet."</p>
                          </div>
                        </div>
                      </div>

                      {/* Delivery Revenue payout details */}
                      <div className="bg-rose-50/40 border border-rose-100/30 rounded-2xl p-3.5 flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <span className="text-[16px]">🏍️</span>
                          <div>
                            <h4 className="text-xs font-black text-slate-900 leading-tight">Gain de la course</h4>
                            <p className="text-[10px] text-gray-400 font-semibold">Crédité à la validation</p>
                          </div>
                        </div>
                        <span className="text-[15px] font-black text-[#E52327]">500 FCFA</span>
                      </div>

                      {/* Action buttons */}
                      <div className="space-y-2 pt-1 font-sans">
                        <button
                          onClick={() => {
                            setShowFullRouteTracing(true);
                            setIsOrderDetailsOpen(false);
                            showToast("Tracé complet de la course affiché ! 🗺️");
                          }}
                          className="w-full h-[50px] bg-slate-900 hover:bg-black text-white rounded-xl font-extrabold text-[12.5px] uppercase tracking-wide flex items-center justify-center gap-2 transition active:scale-[0.97] cursor-pointer"
                        >
                          🗺️ Afficher l'itinéraire complet
                        </button>
                        <button
                          onClick={() => setIsOrderDetailsOpen(false)}
                          className="w-full h-[46px] bg-gray-150 hover:bg-gray-250 text-gray-800 rounded-xl font-bold text-xs uppercase tracking-wide transition text-center cursor-pointer"
                        >
                          Retour au guidage
                        </button>
                      </div>

                    </div>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>

          </div>
        )}

        {/* =======================================================
            SCREEN 4: GAINS (Earnings screen with stats & history)
            ======================================================= */}
        {driverScreen === 4 && (
          <div className="flex-1 flex flex-col bg-[#F9F9FB] overflow-hidden pb-[70px]">
            {/* Header banner */}
            <div className="px-5 pt-3 pb-3 flex justify-between items-center bg-white sticky top-0 z-30 font-bold">
              <div className="flex items-center gap-3">
                <MenuIcon className="w-5 h-5 text-gray-800" />
                <h1 className="text-[17px] font-black tracking-tight text-gray-950">Mes gains</h1>
              </div>
              <button className="relative w-9 h-9 rounded-full bg-gray-50 flex items-center justify-center border border-gray-100">
                <Bell className="w-4.5 h-4.5 text-gray-400" />
              </button>
            </div>

            {/* Time period filter tabs matching mockup design 4 */}
            <div className="flex bg-white border-b border-gray-100 text-[12.5px] font-bold shrink-0">
              {(['Aujourd\'hui', 'Semaine', 'Mois'] as const).map((tab) => {
                const isActive = gainsFilterTab === tab;
                return (
                  <button
                    key={tab}
                    onClick={() => setGainsFilterTab(tab)}
                    className={`flex-1 text-center py-3.5 relative transition-all ${
                      isActive ? 'text-[#E52327] font-black' : 'text-gray-400'
                    }`}
                  >
                    <span>{tab}</span>
                    {isActive && (
                      <motion.div layoutId="driver_gains_tab" className="absolute bottom-0 inset-x-0 h-0.7 bg-[#E52327]" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Scrollable gains content area */}
            <div className="flex-1 overflow-y-auto no-scrollbar p-5 space-y-4">
              
              {/* Total gains Card */}
              <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm flex justify-between items-center">
                <div className="space-y-1">
                  <span className="text-gray-400 font-extrabold text-[10px] uppercase tracking-wider block">Total des gains</span>
                  <h2 className="text-[28px] font-black text-gray-950 leading-none">15 000 FCFA</h2>
                  <span className="text-green-600 font-bold text-[11px] block mt-1">↑ 15% vs hier</span>
                </div>
                <div className="w-[52px] h-[52px] bg-rose-50 text-[#E52327] rounded-2xl flex items-center justify-center font-black text-xl">
                  💳
                </div>
              </div>

              {/* Grid block of delivery counters */}
              <div className="grid grid-cols-3 gap-2.5 font-bold text-center">
                <div className="bg-white border border-gray-50 rounded-2xl p-3">
                  <span className="text-gray-400 text-[9px] uppercase tracking-wider block font-extrabold">Livraisons</span>
                  <span className="text-lg font-black text-gray-950 block mt-0.5">12</span>
                </div>
                <div className="bg-white border border-gray-50 rounded-2xl p-3">
                  <span className="text-gray-400 text-[9px] uppercase tracking-wider block font-extrabold">Distance</span>
                  <span className="text-lg font-black text-gray-950 block mt-0.5">45,6 km</span>
                </div>
                <div className="bg-white border border-gray-50 rounded-2xl p-3">
                  <span className="text-gray-400 text-[9px] uppercase tracking-wider block font-extrabold">En ligne</span>
                  <span className="text-lg font-black text-gray-950 block mt-0.5">4h 30m</span>
                </div>
              </div>

              {/* History list container */}
              <div className="space-y-3">
                <h3 className="text-gray-950 font-black text-[13px] uppercase tracking-wider">Historique des livraisons</h3>
                
                {/* Scrollable list items identical to mockup 4 */}
                <div className="space-y-3">
                  
                  {/* Dynamic user placed / completed if any */}
                  {completedOrders.length > 0 && (
                    completedOrders.map((ord, idx) => (
                      <motion.div 
                        key={ord.id} 
                        initial={{ opacity: 0, x: -30 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ type: "spring", stiffness: 200, damping: 18, delay: idx * 0.05 }}
                        className="bg-white rounded-2xl p-4 border border-gray-50 shadow-xs flex justify-between items-center cursor-pointer hover:bg-slate-50 transition active:scale-[0.99]"
                        onClick={() => setSelectedCompletedOrder(ord)}
                      >
                        <div className="space-y-1">
                          <span className="text-gray-400 text-[10px] font-mono block">
                            {ord.status_times?.delivered || 'Gagné'}
                          </span>
                          <h4 className="text-[12.5px] font-extrabold text-gray-950 truncate max-w-[180px]">
                            {ord.restaurant.name}
                          </h4>
                          <span className="text-[11px] text-gray-500 font-bold block truncate max-w-[180px]">
                            → {ord.driver ? 'Moussa Traoré' : 'Client Dodo'}
                          </span>
                        </div>
                        <span className="text-green-600 font-black text-sm">
                          {ord.total} FCFA
                        </span>
                      </motion.div>
                    ))
                  )}

                  {/* Standard Mock list items to maintain visual fidelity to the pixel design list */}
                  <motion.div 
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ type: "spring", stiffness: 200, damping: 18, delay: (completedOrders.length) * 0.05 }}
                    className="bg-white rounded-2xl p-3.5 border border-gray-150/60 shadow-2xs flex justify-between items-center cursor-pointer hover:bg-slate-50 transition active:scale-[0.99]"
                    onClick={() => setSelectedCompletedOrder({
                      id: 'mock_fatou_gain',
                      order_number: 'DODO-8921-26',
                      restaurant: { name: 'Maquis Chez Fatou' },
                      total: 2500,
                      status_times: { delivered: '10:30' },
                      client_name: 'Moussa T.'
                    })}
                  >
                    <div className="space-y-0.5 text-xs">
                      <span className="text-gray-400 font-mono text-[9.5px] block font-bold">10:30</span>
                      <h4 className="font-extrabold text-gray-950">Maquis Chez Fatou</h4>
                      <span className="text-gray-500 text-[10.5px] block font-medium">1200 Logements → Moussa T.</span>
                    </div>
                    <span className="text-green-600 font-black text-sm">2 500 FCFA</span>
                  </motion.div>

                  <motion.div 
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ type: "spring", stiffness: 150, damping: 18, delay: (completedOrders.length + 1) * 0.05 }}
                    className="bg-white rounded-2xl p-3.5 border border-gray-150/60 shadow-2xs flex justify-between items-center cursor-pointer hover:bg-slate-50 transition active:scale-[0.99]"
                    onClick={() => setSelectedCompletedOrder({
                      id: 'mock_gout_gain',
                      order_number: 'DODO-4512-98',
                      restaurant: { name: 'Le Bon Goût' },
                      total: 2000,
                      status_times: { delivered: '09:45' },
                      client_name: 'Awa Kaboré'
                    })}
                  >
                    <div className="space-y-0.5 text-xs">
                      <span className="text-gray-400 font-mono text-[9.5px] block font-bold">09:45</span>
                      <h4 className="font-extrabold text-gray-950">Le Bon Goût</h4>
                      <span className="text-gray-500 text-[10.5px] block font-medium">Zogona → Awa Kaboré</span>
                    </div>
                    <span className="text-green-600 font-black text-sm">2 000 FCFA</span>
                  </motion.div>

                  <motion.div 
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ type: "spring", stiffness: 150, damping: 18, delay: (completedOrders.length + 2) * 0.05 }}
                    className="bg-white rounded-2xl p-3.5 border border-gray-150/60 shadow-2xs flex justify-between items-center cursor-pointer hover:bg-slate-50 transition active:scale-[0.99]"
                    onClick={() => setSelectedCompletedOrder({
                      id: 'mock_african_gain',
                      order_number: 'DODO-7359-12',
                      restaurant: { name: "Saveurs d'Afrique" },
                      total: 2500,
                      status_times: { delivered: '09:00' },
                      client_name: 'Ibrahim O.'
                    })}
                  >
                    <div className="space-y-0.5 text-xs">
                      <span className="text-gray-400 font-mono text-[9.5px] block font-bold">09:00</span>
                      <h4 className="font-extrabold text-gray-950">Saveurs d'Afrique</h4>
                      <span className="text-gray-500 text-[10.5px] block font-medium">Zone du Bois → Ibrahim O.</span>
                    </div>
                    <span className="text-green-600 font-black text-sm">2 500 FCFA</span>
                  </motion.div>

                  <motion.div 
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ type: "spring", stiffness: 150, damping: 18, delay: (completedOrders.length + 3) * 0.05 }}
                    className="bg-white rounded-2xl p-3.5 border border-gray-150/60 shadow-2xs flex justify-between items-center cursor-pointer hover:bg-slate-50 transition active:scale-[0.99]"
                    onClick={() => setSelectedCompletedOrder({
                      id: 'mock_fatou_gain_old',
                      order_number: 'DODO-3101-44',
                      restaurant: { name: 'Maquis Chez Fatou' },
                      total: 2000,
                      status_times: { delivered: '08:20' },
                      client_name: 'Bintou K.'
                    })}
                  >
                    <div className="space-y-0.5 text-xs">
                      <span className="text-gray-400 font-mono text-[9.5px] block font-bold">08:20</span>
                      <h4 className="font-extrabold text-gray-950">Maquis Chez Fatou</h4>
                      <span className="text-gray-500 text-[10.5px] block font-medium">1200 Logements → Bintou K.</span>
                    </div>
                    <span className="text-green-600 font-black text-sm">2 000 FCFA</span>
                  </motion.div>
                </div>

                {/* Modal: Tracé complet du trajet livré */}
                <AnimatePresence>
                  {selectedCompletedOrder && (
                    <div 
                      className="absolute inset-0 bg-slate-950/70 backdrop-blur-xs z-[100] flex items-end justify-center"
                      onClick={() => setSelectedCompletedOrder(null)}
                    >
                      <motion.div 
                        initial={{ y: "100%" }}
                        animate={{ y: 0 }}
                        exit={{ y: "100%" }}
                        className="bg-white rounded-t-[32px] w-full max-h-[85%] overflow-y-auto no-scrollbar p-6 space-y-4 shadow-2xl relative border-t border-gray-200 text-left"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {/* Drawer handle */}
                        <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mb-2 shrink-0"></div>

                        {/* Header */}
                        <div className="text-center pb-1">
                          <div className="w-11 h-11 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-2 font-black text-lg">
                            ✓
                          </div>
                          <h3 className="text-[15px] font-black text-gray-950 tracking-tight">Itinéraire Complété</h3>
                          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{selectedCompletedOrder.order_number}</p>
                        </div>

                        {/* Google Map Tracing Route! */}
                        <div className="relative w-full h-[180px] rounded-2xl overflow-hidden border border-gray-150 shadow-sm z-0">
                          <DodoLiveGoogleMap
                            simulationProgress={100}
                            viewMode="client"
                            height="100%"
                            restaurantName={selectedCompletedOrder.restaurant?.name || "Maquis"}
                            showFullRouteTracing={true}
                          />
                        </div>

                        {/* Stats in Itinerary */}
                        <div className="grid grid-cols-2 gap-3 text-xs">
                          <div className="bg-gray-50 rounded-xl p-3 border border-gray-150 text-center">
                            <span className="text-gray-400 block font-bold text-[8.5px] uppercase tracking-wider">Maquis</span>
                            <span className="font-extrabold text-slate-800 truncate block mt-0.5">{selectedCompletedOrder.restaurant?.name || "Maquis"}</span>
                          </div>
                          <div className="bg-gray-50 rounded-xl p-3 border border-gray-150 text-center">
                            <span className="text-gray-400 block font-bold text-[8.5px] uppercase tracking-wider">Client</span>
                            <span className="font-extrabold text-slate-800 truncate block mt-0.5">{selectedCompletedOrder.client_name || "Moussa T."}</span>
                          </div>
                        </div>

                        {/* Completed Itinerary Details Info */}
                        <div className="bg-slate-50 border border-gray-150 rounded-2xl p-3.5 space-y-2 text-xs">
                          <div className="flex justify-between font-bold text-gray-650">
                            <span>Heure livrée:</span>
                            <span className="text-gray-950 font-extrabold font-mono">{selectedCompletedOrder.status_times?.delivered || "Heure indéterminée"}</span>
                          </div>
                          <div className="flex justify-between font-bold text-gray-650">
                            <span>Statut course:</span>
                            <span className="text-emerald-700 font-black">COURSE TERMINÉE ✓</span>
                          </div>
                          <div className="flex justify-between font-bold text-gray-650 border-t border-gray-200 pt-2.5 mt-2">
                            <span>Vos gains totaux:</span>
                            <span className="text-green-600 font-black text-sm">{selectedCompletedOrder.total || 2500} FCFA</span>
                          </div>
                        </div>

                        {/* Actions */}
                        <button 
                          onClick={() => setSelectedCompletedOrder(null)}
                          className="w-full h-[46px] bg-slate-950 text-white rounded-xl text-xs font-bold hover:bg-slate-900 active:scale-95 transition"
                        >
                          Fermer le tracé
                        </button>
                      </motion.div>
                    </div>
                  )}
                </AnimatePresence>
              </div>

            </div>
          </div>
        )}

        {/* =======================================================
            SCREEN 5: PROFIL LIVREUR (Driver's Profile page)
            ======================================================= */}
        {driverScreen === 5 && (
          <div className="flex-1 flex flex-col bg-[#F9F9FB] overflow-hidden pb-[70px]">
            {/* Header */}
            <div className="px-5 pt-3 pb-3 flex justify-between items-center bg-white sticky top-0 z-30 font-bold shrink-0 border-b border-gray-100">
              <span className="w-8"></span>
              <h1 className="text-[17px] font-black text-gray-950">
                {isEditingDriver ? "Paramètres livreur" : "Mon profil"}
              </h1>
              <button 
                onClick={() => {
                  setIsEditingDriver(!isEditingDriver);
                  showToast(isEditingDriver ? "Mode consultation activé" : "Outils d'édition livreur ouverts ! ⚡");
                }}
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black border transition ${isEditingDriver ? 'bg-green-500 border-green-500 text-white' : 'bg-gray-50 border-gray-100 text-[#E52327] hover:bg-gray-100'}`}
              >
                {isEditingDriver ? '✓' : '✏️'}
              </button>
            </div>

            {/* Scrollable body content */}
            <div className="flex-1 overflow-y-auto no-scrollbar p-5 space-y-4">
              
              {!isEditingDriver ? (
                /* CONSULTATION VIEW */
                <>
                  {/* Photo & Name block exactly matching mockup 5 layout structure */}
                  <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm flex flex-col items-center text-center space-y-3.5">
                    <div className="relative">
                      <img 
                        src={driverAvatar} 
                        alt={driverName} 
                        className="w-[94px] h-[94px] rounded-full object-cover border-4 border-red-500/10 shadow-lg bg-slate-100"
                        referrerPolicy="no-referrer"
                      />
                      <div className={`absolute bottom-0 right-1 text-[9px] font-black px-2 py-0.5 rounded-full uppercase border-2 border-white text-white ${
                        driverAvailability === 'Disponible' ? 'bg-green-500' : driverAvailability === 'En pause' ? 'bg-amber-500' : 'bg-red-500'
                      }`}>
                        {driverAvailability}
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center justify-center gap-1.5">
                        <h2 className="text-[19px] font-black text-gray-950 tracking-tight leading-none">{driverName}</h2>
                        <Shield className={`w-4 h-4 shrink-0 stroke-[2.5] ${
                          kycStatus === 'verified' 
                            ? 'text-green-500 fill-green-50' 
                            : kycStatus === 'pending' 
                              ? 'text-amber-500 fill-amber-50 animate-pulse' 
                              : 'text-red-500 fill-red-55'
                        }`} />
                      </div>
                      <p className="text-[11.5px] font-mono font-bold text-gray-500 mt-1">{driverPhone}</p>
                      
                      {/* Status pills indicator */}
                      <div className="flex items-center gap-1.5 justify-center pt-1.5">
                        <span className={`text-[10px] uppercase tracking-wide px-2.5 py-0.5 rounded-lg font-black ${
                          driverAvailability === 'Disponible' ? 'bg-green-100 text-green-700' : driverAvailability === 'En pause' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
                        }`}>
                          {driverAvailability}
                        </span>
                        <span className="bg-gray-100 text-gray-700 text-[10px] px-2 py-0.5 rounded-lg font-black flex items-center gap-0.5">
                          4.8 ★
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Graphique de revenus Recharts Card */}
                  <div className="bg-white rounded-3xl border border-gray-100 p-4.5 space-y-3.5 shadow-sm text-left">
                    <div>
                      <span className="text-[10px] text-gray-400 block uppercase font-black tracking-wider font-mono">
                        {language === 'fr' ? 'PERFORMANCE DES 30 DERNIERS JOURS' : 'LAST 30 DAYS PERFORMANCE'}
                      </span>
                      <div className="flex justify-between items-baseline mt-1">
                        <h3 className="text-gray-955 font-black text-[13.5px] flex items-center gap-1.5 leading-none">
                          {language === 'fr' ? 'Gains Totaux' : 'Total Earnings'}
                        </h3>
                        <span className="text-[14.5px] font-black text-[#E52327]">
                          154,200 FCFA
                        </span>
                      </div>
                    </div>

                    <div className="w-full h-[180px] bg-white rounded-xl pr-2.5 pt-2 text-[9px] font-mono select-none overflow-hidden">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={MOCK_EARNINGS_30_DAYS} margin={{ top: 10, right: 5, left: -22, bottom: 0 }}>
                          <defs>
                            <linearGradient id="colorGains" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#E52327" stopOpacity={0.4}/>
                              <stop offset="95%" stopColor="#E52327" stopOpacity={0.0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                          <XAxis 
                            dataKey="day" 
                            tickLine={false} 
                            axisLine={false}
                            stroke="#94A3B8" 
                            style={{ fontSize: '9px', fontWeight: 'bold' }}
                          />
                          <YAxis 
                            tickLine={false} 
                            axisLine={false} 
                            stroke="#94A3B8"
                            style={{ fontSize: '9px', fontWeight: 'bold' }}
                          />
                          <Tooltip 
                            content={({ active, payload }) => {
                              if (active && payload && payload.length) {
                                return (
                                  <div className="bg-slate-950 text-white rounded-lg p-2 border border-slate-800 text-[10px] font-bold shadow-md">
                                    <p className="text-gray-400 font-mono text-[8px] uppercase">{language === 'fr' ? `Jour : ${payload[0].payload.day}` : `Day: ${payload[0].payload.day}`}</p>
                                    <p className="text-[#E02424] font-black">{payload[0].value} FCFA</p>
                                  </div>
                                );
                              }
                              return null;
                            }} 
                          />
                          <Area 
                            type="monotone" 
                            dataKey="gains" 
                            stroke="#E52327" 
                            strokeWidth={2.5}
                            fillOpacity={1} 
                            fill="url(#colorGains)" 
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="flex justify-between items-center text-[10.5px] text-gray-450 font-bold bg-[#F8FAFC] p-2.5 rounded-2xl border border-gray-100">
                      <div className="flex items-center gap-1">
                        <span className="text-gray-550">📈</span>
                        <span>{language === 'fr' ? 'Meilleur jour : Jour 30' : 'Best day: Day 30'}</span>
                      </div>
                      <span className="text-[#E52327] font-black">+18.5% MoM</span>
                    </div>
                  </div>

                  {/* Statut KYC & Documents Card */}
                  <div className="bg-white rounded-3xl border border-gray-100 p-4 space-y-3 shadow-2xs">
                    <div className="flex justify-between items-center border-b border-gray-50 pb-2">
                      <h3 className="text-gray-950 font-black text-[13px] flex items-center gap-1.5">
                        <Shield className="w-4 h-4 text-[#E52327]" />
                        <span>Vérification d'identité KYC</span>
                      </h3>
                      <button
                        onClick={() => {
                          const nextStatus = kycStatus === 'verified' ? 'pending' : kycStatus === 'pending' ? 'rejected' : 'verified';
                          setKycStatus(nextStatus);
                          showToast(`Statut KYC simulé : ${nextStatus.toUpperCase()} 🔄`);
                        }}
                        className="text-[9.5px] uppercase font-black bg-gray-100 hover:bg-[#E52327] hover:text-white text-gray-700 px-2 py-1 rounded-lg transition"
                      >
                        Simuler ⚙
                      </button>
                    </div>

                    <div className="flex items-center gap-3 bg-slate-50 p-2.5 rounded-2xl border border-gray-50">
                      <div className={`p-2.5 rounded-xl ${
                        kycStatus === 'verified' 
                          ? 'bg-green-100 text-green-600' 
                          : kycStatus === 'pending' 
                            ? 'bg-amber-100 text-amber-600' 
                            : 'bg-red-100 text-red-600'
                      }`}>
                        <Shield className={`w-6 h-6 stroke-[2.5] ${kycStatus === 'pending' ? 'animate-pulse' : ''}`} />
                      </div>
                      <div className="flex-1 text-left leading-tight">
                        <span className="text-[10px] text-gray-400 block uppercase font-bold tracking-wider">État des documents</span>
                        <p className={`text-[12.5px] font-black ${
                          kycStatus === 'verified' ? 'text-green-700' : kycStatus === 'pending' ? 'text-amber-700' : 'text-red-700'
                        }`}>
                          {kycStatus === 'verified' && "Vérifié & Approuvé ✓"}
                          {kycStatus === 'pending' && "Validation en cours ⏳"}
                          {kycStatus === 'rejected' && "Rejeté • Documents invalides ✗"}
                        </p>
                        <p className="text-[9.5px] text-gray-500 mt-0.5 animate-pulse-none">
                          {kycStatus === 'verified' && "Tous vos justificatifs (CNI, Permis, Selfie) sont valides."}
                          {kycStatus === 'pending' && "Nos équipes examinent vos documents d'identité burkinabè."}
                          {kycStatus === 'rejected' && "Veuillez soumettre une nouvelle photo lisible du permis."}
                        </p>
                      </div>
                    </div>

                    {kycStatus === 'rejected' && (
                      <button
                        onClick={() => {
                          setKycStatus('pending');
                          showToast("Nouveaux documents soumis pour vérification ! 📄⏳");
                        }}
                        className="w-full py-2 bg-red-50 hover:bg-red-100 text-red-700 rounded-xl font-black text-[11px] transition text-center uppercase tracking-wide border border-dashed border-red-200"
                      >
                        Soumettre à nouveau le permis 🪪
                      </button>
                    )}
                  </div>

                  {/* Group "Informations personnelles" */}
                  <div className="bg-white rounded-3xl border border-gray-100 p-4 space-y-3.5 text-xs font-bold text-gray-650">
                    <h3 className="text-gray-950 font-black text-[13px] border-b border-gray-50 pb-2">Informations personnelles</h3>
                    
                    <div className="space-y-3 text-[11.5px]">
                      <div className="flex justify-between items-center py-0.5">
                        <span className="text-gray-400 font-extrabold uppercase text-[9px] tracking-wider">Email</span>
                        <span className="text-gray-800 font-medium font-mono">{driverEmail}</span>
                      </div>
                      
                      <div className="flex justify-between items-center py-0.5 border-t border-gray-50 pt-2.5">
                        <span className="text-gray-400 font-extrabold uppercase text-[9px] tracking-wider">Véhicule</span>
                        <span className="text-gray-850 font-bold">{driverVehicleModel}</span>
                      </div>

                      <div className="flex justify-between items-center py-0.5 border-t border-gray-50 pt-2.5">
                        <span className="text-gray-400 font-extrabold uppercase text-[9px] tracking-wider">Immatriculation</span>
                        <span className="text-gray-850 font-bold font-mono">{driverLicensePlate}</span>
                      </div>

                      <div className="flex justify-between items-center py-0.5 border-t border-gray-50 pt-2.5">
                        <span className="text-gray-400 font-extrabold uppercase text-[9px] tracking-wider">Zone favorite</span>
                        <span className="text-[#E52327] font-black">{driverPreferredZone}</span>
                      </div>

                      <div className="flex justify-between items-center py-0.5 border-t border-gray-50 pt-2.5">
                        <span className="text-gray-400 font-extrabold uppercase text-[9px] tracking-wider">Année d'inscription</span>
                        <span className="text-gray-850 font-bold">Mai 2024</span>
                      </div>
                    </div>
                  </div>

                  {/* Simulated 2FA status indicator badge */}
                  <div className="p-3 bg-slate-100 rounded-2xl flex justify-between items-center text-xs">
                    <span className="font-extrabold text-[#E52327]">🔒 Double facteur SMS actif ?</span>
                    <span className={`text-[9.5px] px-2 py-0.5 rounded font-black uppercase ${driver2Fa ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-500'}`}>
                      {driver2Fa ? 'OUI ✓' : 'NON'}
                    </span>
                  </div>
                </>
              ) : (
                /* INTERACTIVE EDIT MODE */
                <div className="space-y-4 animate-fade-in text-left text-xs">
                  
                  {/* Avatar choices with upload simulator */}
                  <div className="bg-white p-4 rounded-3xl border border-gray-100 space-y-3">
                    <div className="flex justify-between items-center">
                      <h4 className="font-extrabold text-slate-800 text-[11px] uppercase">Photo de profil livreur</h4>
                      
                      <label className="cursor-pointer bg-slate-50 border px-2 py-0.5 rounded text-[8px] font-black hover:bg-gray-100 transition inline-block uppercase tracking-wider">
                        Prendre photo 📸
                        <input 
                          type="file" 
                          accept="image/*" 
                          className="hidden" 
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              const fUrl = URL.createObjectURL(e.target.files[0]);
                              setDriverAvatar(fUrl);
                              showToast("Photo importée avec succès ! ⚡");
                            }
                          }}
                        />
                      </label>
                    </div>

                    <div className="flex gap-2.5 overflow-x-auto no-scrollbar py-0.5">
                      {[
                        { name: "Blaise K.", url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=250&auto=format&fit=crop&q=80' },
                        { name: "Sékou Rapide", url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=250&auto=format&fit=crop&q=80' },
                        { name: "Moto-Brake", url: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=250&auto=format&fit=crop&q=80' }
                      ].map(lnk => (
                        <button
                          key={lnk.name}
                          type="button"
                          onClick={() => {
                            setDriverAvatar(lnk.url);
                            showToast(`Avatar "${lnk.name}" choisi !`);
                          }}
                          className={`flex items-center gap-1.5 px-2.5 py-1.5 border rounded-xl shrink-0 text-[10px] font-black bg-white transition ${driverAvatar === lnk.url ? 'border-red-500 bg-red-50/50' : 'border-gray-200'}`}
                        >
                          <img src={lnk.url} className="w-5 h-5 rounded-full object-cover" />
                          <span>{lnk.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Contact form cards */}
                  <div className="bg-white p-4 rounded-3xl border border-gray-100 space-y-3">
                    <h4 className="font-extrabold text-slate-800 text-[11px] uppercase border-b pb-1">👤 Coordonnées & Statut</h4>
                    
                    <div className="space-y-1">
                      <label className="text-gray-400 font-extrabold text-[9px] uppercase">Nom d'affichage</label>
                      <input 
                        type="text" 
                        value={driverName} 
                        onChange={(e) => setDriverName(e.target.value)}
                        className="w-full h-8.5 px-2.5 bg-gray-50 border border-gray-150 rounded-xl font-bold" 
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-gray-400 font-extrabold text-[9px] uppercase">Numéro WhatsApp / Tél</label>
                      <input 
                        type="text" 
                        value={driverPhone} 
                        onChange={(e) => setDriverPhone(e.target.value)}
                        className="w-full h-8.5 px-2.5 bg-gray-50 border border-gray-150 rounded-xl font-mono" 
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-gray-400 font-extrabold text-[9px] uppercase">Courriel professionnel</label>
                      <input 
                        type="email" 
                        value={driverEmail} 
                        onChange={(e) => setDriverEmail(e.target.value)}
                        className="w-full h-8.5 px-2.5 bg-gray-50 border border-gray-150 rounded-xl font-mono" 
                      />
                    </div>

                    {/* Duty status toggle buttons */}
                    <div className="space-y-1.5 pt-1">
                      <label className="text-gray-400 font-extrabold text-[9px] uppercase block">État d'activité Radio</label>
                      <div className="grid grid-cols-3 gap-1.5">
                        {['Disponible', 'En pause', 'Hors-ligne'].map((status) => (
                          <button
                            key={status}
                            type="button"
                            onClick={() => {
                              setDriverAvailability(status);
                              showToast(`Disponibilité : ${status} !`);
                            }}
                            className={`py-2 text-[9px] font-black border rounded-xl transition ${driverAvailability === status ? 'border-red-500 bg-red-50 text-red-600' : 'border-gray-200 bg-white text-gray-500'}`}
                          >
                            {status === 'Disponible' && '🟢 '}
                            {status === 'En pause' && '🟡 '}
                            {status === 'Hors-ligne' && '🔴 '}
                            {status}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Vehicle details */}
                  <div className="bg-white p-4 rounded-3xl border border-gray-100 space-y-3">
                    <h4 className="font-extrabold text-slate-800 text-[11px] uppercase border-b pb-1">🏍️ Véhicule & Plaque d'immatriculation</h4>
                    
                    <div className="space-y-1">
                      <label className="text-gray-400 font-extrabold text-[9px] uppercase">Modèle ou marque du véhicule</label>
                      <input 
                        type="text" 
                        value={driverVehicleModel} 
                        onChange={(e) => setDriverVehicleModel(e.target.value)}
                        className="w-full h-8.5 px-2.5 bg-gray-50 border border-gray-150 rounded-xl font-bold" 
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-gray-400 font-extrabold text-[9px] uppercase">Numéro d'immatriculation</label>
                      <input 
                        type="text" 
                        value={driverLicensePlate} 
                        onChange={(e) => setDriverLicensePlate(e.target.value)}
                        className="w-full h-8.5 px-2.5 bg-gray-50 border border-gray-150 rounded-xl font-bold font-mono text-center" 
                      />
                    </div>

                    {/* Delivery preferred zones select */}
                    <div className="space-y-1">
                      <label className="text-gray-400 font-extrabold text-[9px] uppercase">Secteur favori de maraudage</label>
                      <select
                        value={driverPreferredZone}
                        onChange={(e) => setDriverPreferredZone(e.target.value)}
                        className="w-full h-9 px-2 bg-gray-50 border border-gray-150 rounded-xl font-bold outline-none text-xs"
                      >
                        <option value="Ouaga 2000 & Centre-Ville">Ouaga 2000 & Centre-Ville</option>
                        <option value="Zone du Bois & Dassasgho">Zone du Bois & Dassasgho</option>
                        <option value="Patte d'Oie & Koulouba">Patte d'Oie & Koulouba</option>
                        <option value="Somgandé & Cité An III">Somgandé & Cité An III</option>
                      </select>
                    </div>
                  </div>

                  {/* Simulated Security password changes with 2FA toggle button */}
                  <div className="bg-white p-4 rounded-3xl border border-gray-100 space-y-3.5">
                    <h4 className="font-extrabold text-slate-800 text-[11px] uppercase border-b pb-1">🔒 Protection d'accès</h4>
                    
                    <div className="space-y-1">
                      <label className="text-gray-400 font-extrabold text-[9px] uppercase">Changer de mot de passe</label>
                      <input 
                        type="password" 
                        placeholder="••••••••" 
                        value={driverPassword}
                        onChange={(e) => setDriverPassword(e.target.value)}
                        className="w-full h-8.5 px-2.5 bg-gray-50 border border-gray-150 rounded-xl outline-none" 
                      />
                    </div>

                    {/* Driver 2FA toggle switch */}
                    <div className="p-2.5 bg-slate-50 border border-slate-100 rounded-xl flex justify-between items-center">
                      <div>
                        <h5 className="font-extrabold text-slate-900 leading-tight">Double Facteur SMS</h5>
                        <p className="text-[8.5px] text-gray-400">Code requis à chaque prise de service d'activité.</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const nextState = !driver2Fa;
                          setDriver2Fa(nextState);
                          localStorage.setItem('DODO_DRIVER_2FA', nextState ? 'true' : 'false');
                          showToast(nextState ? "Sécurité Double facteur SMS activée ! 🔒" : "Protection faible");
                        }}
                        className={`w-11 h-6 rounded-full p-0.5 transition-colors duration-200 outline-none ${driver2Fa ? 'bg-green-500' : 'bg-gray-300'}`}
                      >
                        <div className={`bg-white w-5 h-5 rounded-full shadow-md transform transition-transform duration-200 ${driver2Fa ? 'translate-x-5' : 'translate-x-0'}`} />
                      </button>
                    </div>
                  </div>

                  {/* Submission buttons row */}
                  <button
                    type="button"
                    onClick={() => {
                      localStorage.setItem('DODO_DRIVER_NAME', driverName);
                      localStorage.setItem('DODO_DRIVER_PHONE', driverPhone);
                      localStorage.setItem('DODO_DRIVER_EMAIL', driverEmail);
                      localStorage.setItem('DODO_DRIVER_AVATAR', driverAvatar);
                      localStorage.setItem('DODO_DRIVER_VEHICLE_MODEL', driverVehicleModel);
                      localStorage.setItem('DODO_DRIVER_LICENSE_PLATE', driverLicensePlate);
                      localStorage.setItem('DODO_DRIVER_AVAILABILITY', driverAvailability);
                      localStorage.setItem('DODO_DRIVER_PREF_ZONE', driverPreferredZone);
                      
                      if (driverPassword) {
                        showToast("Nouveau mot de passe de compte livreur enregistré !");
                        setDriverPassword('');
                      }
                      
                      setIsEditingDriver(false);
                      showToast("Profil livreur enregistré et mis en production ! ✓");
                    }}
                    className="w-full h-11 bg-green-600 hover:bg-green-700 text-white font-black text-xs uppercase rounded-xl tracking-wider shadow-sm transition"
                  >
                    Mettre à jour le profil livreur ✓
                  </button>
                </div>
              )}

              {/* Navigation settings links list exactly matching mockup 5 */}
              <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden divide-y divide-gray-50">
                
                {/* Link 1 */}
                <button 
                  onClick={() => showToast("Documents d'activité vérifiés ✅")}
                  className="w-full px-4 py-3.5 flex justify-between items-center hover:bg-gray-55 transition text-left"
                >
                  <div className="flex items-center gap-2.5 font-bold text-gray-800 text-[12.5px]">
                    <span className="text-base text-gray-500">📄</span>
                    <div>
                      <div className="text-gray-950 font-black">Documents</div>
                      <div className="text-[10px] text-gray-400">Voir et gérer vos documents scolaires d'identité</div>
                    </div>
                  </div>
                  <ChevronRight className="w-4.5 h-4.5 text-gray-400" />
                </button>

                {/* Link 2 */}
                <button 
                  onClick={() => showToast("Préférences de l'application livreur")}
                  className="w-full px-4 py-3.5 flex justify-between items-center hover:bg-gray-55 transition text-left"
                >
                  <div className="flex items-center gap-2.5 font-bold text-gray-800 text-[12.5px]">
                    <span className="text-base text-gray-500">⚙️</span>
                    <div>
                      <div className="text-gray-950 font-black">Paramètres</div>
                      <div className="text-[10px] text-gray-400">Préférences et options de zone de livraison</div>
                    </div>
                  </div>
                  <ChevronRight className="w-4.5 h-4.5 text-gray-400" />
                </button>

                {/* Link 3 */}
                <button 
                  onClick={() => showToast("Numéro d'aide Dodo: +226 25 30 00 00")}
                  className="w-full px-4 py-3.5 flex justify-between items-center hover:bg-gray-55 transition text-left"
                >
                  <div className="flex items-center gap-2.5 font-bold text-gray-800 text-[12.5px]">
                    <span className="text-base text-gray-500">❓</span>
                    <div>
                      <div className="text-gray-950 font-black">Aide et support</div>
                      <div className="text-[10px] text-gray-400">Signaler un retard ou problème de paiement</div>
                    </div>
                  </div>
                  <ChevronRight className="w-4.5 h-4.5 text-gray-400" />
                </button>

              </div>

              {/* Log out option button */}
              <button 
                onClick={() => setIsLogoutConfirmOpen(true)}
                className="w-full h-[48px] border border-red-500/20 hover:bg-red-50 text-[#E52327] rounded-3xl font-black text-xs uppercase tracking-widest transition flex items-center justify-center gap-2 shadow-2xs"
              >
                🔒 Se déconnecter
              </button>

            </div>
          </div>
        )}

        {/* BOTTOM NAVIGATION TAB BAR WITH EXACT HIGHLIGHT COLOR */}
        <div className="absolute bottom-0 inset-x-0 h-[68px] bg-white border-t border-gray-150 rounded-b-[43px] flex items-center justify-around px-2 z-40 select-none shadow-md text-gray-400 text-[9px] font-black shrink-0">
          
          <button 
            onClick={() => setDriverScreen(1)}
            className={`flex flex-col items-center justify-center gap-1.5 w-14 py-2 transition-transform ${
              driverScreen === 1 ? 'text-[#E52327] transform scale-105 font-black' : 'hover:text-gray-600'
            }`}
          >
            <Home className={`w-[20px] h-[20px] transition-transform ${driverScreen === 1 ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
            <span className="leading-none font-extrabold uppercase">Accueil</span>
          </button>

          <button 
            onClick={() => setDriverScreen(2)}
            className={`flex flex-col items-center justify-center gap-1.5 w-14 py-2 transition-transform ${
              driverScreen === 2 || driverScreen === 3 ? 'text-[#E52327] transform scale-105 font-black' : 'hover:text-gray-600'
            }`}
          >
            <ClipboardList className={`w-[20px] h-[20px] transition-transform ${(driverScreen === 2 || driverScreen === 3) ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
            <span className="leading-none font-extrabold uppercase">Missions</span>
          </button>

          <button 
            onClick={() => setDriverScreen(4)}
            className={`flex flex-col items-center justify-center gap-1.5 w-14 py-2 transition-transform ${
              driverScreen === 4 ? 'text-[#E52327] transform scale-105 font-black' : 'hover:text-gray-600'
            }`}
          >
            <Wallet className={`w-[20px] h-[20px] transition-transform ${driverScreen === 4 ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
            <span className="leading-none font-extrabold uppercase">Gains</span>
          </button>

          <button 
            onClick={() => setDriverScreen(5)}
            className={`flex flex-col items-center justify-center gap-1.5 w-14 py-2 transition-transform ${
              driverScreen === 5 ? 'text-[#E52327] transform scale-105 font-black' : 'hover:text-gray-600'
            }`}
          >
            <User className={`w-[20px] h-[20px] transition-transform ${driverScreen === 5 ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
            <span className="leading-none font-extrabold uppercase">Profil</span>
          </button>

        </div>

        {/* Custom Logout Confirmation Modal */}
        <AnimatePresence>
          {isLogoutConfirmOpen && (
            <div 
              className="absolute inset-0 bg-slate-950/60 backdrop-blur-xs z-[150] flex items-center justify-center p-4 font-sans text-left"
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
                  <h3 className="text-[16px] font-black text-slate-950 leading-tight">Déconnexion Livreur</h3>
                  <p className="text-[11px] text-gray-500 font-medium leading-relaxed">
                    Voulez-vous vous déconnecter du profil livreur ? Vous ne recevrez plus d'alertes de courses.
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
                      setIsOnline(false);
                      setDriverScreen(1);
                      showToast("Déconnecté avec succès 🔒");
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

      </div>
    </div>
  );
}
