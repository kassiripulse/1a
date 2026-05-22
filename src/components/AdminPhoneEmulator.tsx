/**
 * @license
 * SPDX-License-Identifier: Apache-2.5
 */

import React, { useState } from 'react';
import { 
  Menu as MenuIcon, Bell, Search, Check, X, ShieldAlert, 
  TrendingUp, Users, ArrowRight, UserCheck, ShieldClose, 
  MapPin, ShoppingBag, Plus, DollarSign, RefreshCw, BarChart2,
  Lock, ArrowUpRight, ArrowDownRight, ChevronRight, HelpCircle, Settings,
  ArrowLeft, Building, Mail, Ticket, Trash, Sparkles, Home, Store, Bike, ClipboardList, Clock
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Restaurant, MenuItem, Order, OrderStatus } from '../types';
import DodoLogo from './DodoLogo';
import { useAppStore } from '../lib/store';
import { z } from 'zod';
import { 
  getYengaTransactions, 
  saveYengaTransactions, 
  getYengaWebhooks, 
  saveYengaWebhooks,
  getYengaSecurityLogs,
  getYengaRetryQueue,
  runCronWebhookRetryQueue,
  refundYengaTransaction,
  exportYengaTransactionsToCSV,
  getYengaConfig,
  saveYengaConfig,
  YengaTransaction,
  YengaWebhookLog,
  YengaSecurityLog
} from '../lib/yengapay';

interface AdminPhoneEmulatorProps {
  restaurants: Restaurant[];
  menuItems: MenuItem[];
  orders: Order[];
  onOrdersChange: (updatedOrders: Order[]) => void;
  adminScreenId: number;
  setAdminScreenId: (id: number) => void;
  onScreenChange?: (screenId: number) => void;
}

export default function AdminPhoneEmulator({
  restaurants,
  menuItems,
  orders,
  onOrdersChange,
  adminScreenId,
  setAdminScreenId,
  onScreenChange,
}: AdminPhoneEmulatorProps) {
  const adminScreen = adminScreenId;
  const setAdminScreen = (id: number) => {
    setDriverScreen(id);
  };
  
  const setDriverScreen = (id: number) => {
    setAdminScreenId(id);
    if (onScreenChange) {
      onScreenChange(id);
    }
  };

  // Toast / Banner system
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  // Search queries
  const [vendorSearch, setVendorSearch] = useState<string>('');
  const [driverSearch, setDriverSearch] = useState<string>('');
  const [userSearch, setUserSearch] = useState<string>('');

  // Active sub-tabs on screens
  const [vendorTab, setVendorTab] = useState<'attente' | 'valides' | 'suspendus'>('attente');
  const [driverTab, setDriverTab] = useState<'attente' | 'valides' | 'suspendus'>('attente');
  const [ordersTab, setOrdersTab] = useState<'toutes' | 'en_cours' | 'terminees'>('toutes');
  const [paymentsTab, setPaymentsTab] = useState<'yengadashboard' | 'transactions' | 'reversements' | 'retraits' | 'yengaconfig' | 'webhooks'>('yengadashboard');
  const [revTab, setRevTab] = useState<'tous' | 'effectué' | 'en_attente'>('tous');
  const [usersTab, setUsersTab] = useState<'clients' | 'vendeurs' | 'livreurs'>('clients');
  const [litigesTab, setLitigesTab] = useState<'tous' | 'en_cours' | 'resolus'>('tous');

  // YengaPay dynamic reactive admin states
  const [yengaTransactions, setYengaTransactions] = useState<YengaTransaction[]>(() => getYengaTransactions());
  const [yengaWebhooks, setYengaWebhooks] = useState<YengaWebhookLog[]>(() => getYengaWebhooks());
  const [yengaSecurityLogs, setYengaSecurityLogs] = useState<YengaSecurityLog[]>(() => getYengaSecurityLogs());
  const [yengaRetryQueue, setYengaRetryQueueState] = useState(() => getYengaRetryQueue());
  const [yengaLocalConfig, setYengaLocalConfig] = useState(() => getYengaConfig());
  const [yengaSearch, setYengaSearch] = useState<string>('');
  const [yengaStatusFilter, setYengaStatusFilter] = useState<string>('all');
  const [yengaActiveTab, setYengaActiveTab] = useState<'dashboard' | 'transactions' | 'webhooks' | 'fraud' | 'config'>('dashboard');

  // Sync / reload helper
  const refreshYengaData = () => {
    setYengaTransactions(getYengaTransactions());
    setYengaWebhooks(getYengaWebhooks());
    setYengaSecurityLogs(getYengaSecurityLogs());
    setYengaRetryQueueState(getYengaRetryQueue());
    setYengaLocalConfig(getYengaConfig());
  };

  // useAppStore to retrieve current state
  const { 
    config, 
    updateConfig,
    promoCodes,
    addPromoCode,
    deletePromoCode,
    togglePromoCode,
    faqs,
    addFaqItem,
    deleteFaqItem,
    updateFaqItem
  } = useAppStore();

  // Settings inputs linked to Zustand store configuration
  const [supabaseUrl, setSupabaseUrl] = useState<string>(config.supabaseUrl);
  const [supabaseAnonKey, setSupabaseAnonKey] = useState<string>(config.supabaseAnonKey);
  const [geminiApiKey, setGeminiApiKey] = useState<string>(config.geminiApiKey);
  const [resendApiKey, setResendApiKey] = useState<string>(config.resendApiKey);
  const [brevoSmtpKey, setBrevoSmtpKey] = useState<string>(config.brevoSmtpKey);
  const [brevoSenderEmail, setBrevoSenderEmail] = useState<string>(config.brevoSenderEmail);
  const [baseDeliveryFee, setBaseDeliveryFee] = useState<number>(config.baseDeliveryFee);
  const [avgPrepTime, setAvgPrepTime] = useState<string>(config.avgPrepTime);

  // New customizable parameters
  const [appName, setAppName] = useState<string>(config.appName);
  const [primaryColor, setPrimaryColor] = useState<string>(config.primaryColor);
  const [currencySymbol, setCurrencySymbol] = useState<string>(config.currencySymbol);
  const [serviceFee, setServiceFee] = useState<number>(config.serviceFee);
  const [freeDeliveryThreshold, setFreeDeliveryThreshold] = useState<number>(config.freeDeliveryThreshold);
  const [welcomeBanner, setWelcomeBanner] = useState<string>(config.welcomeBanner);
  const [simulationSpeed, setSimulationSpeed] = useState<number>(config.simulationSpeed);
  const [maintenanceMode, setMaintenanceMode] = useState<boolean>(config.maintenanceMode);
  const [enableGeminiAgent, setEnableGeminiAgent] = useState<boolean>(config.enableGeminiAgent);
  const [enableGoogleLogin, setEnableGoogleLogin] = useState<boolean>(config.enableGoogleLogin);
  const [googleClientId, setGoogleClientId] = useState<string>(config.googleClientId);
  const [enableAppleLogin, setEnableAppleLogin] = useState<boolean>(config.enableAppleLogin);
  const [appleClientId, setAppleClientId] = useState<string>(config.appleClientId);
  const [memberDaysEnabled, setMemberDaysEnabled] = useState<boolean>(config.memberDaysEnabled);
  const [memberDaysTitle, setMemberDaysTitle] = useState<string>(config.memberDaysTitle);
  const [memberDaysSubtitle, setMemberDaysSubtitle] = useState<string>(config.memberDaysSubtitle);
  const [memberDaysButtonText, setMemberDaysButtonText] = useState<string>(config.memberDaysButtonText);
  const [memberDaysImageUrl, setMemberDaysImageUrl] = useState<string>(config.memberDaysImageUrl);
  const [memberDaysBadgeText, setMemberDaysBadgeText] = useState<string>(config.memberDaysBadgeText);

  // Form errors tracked with Zod
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Promo Code adding states
  const [newPromoCode, setNewPromoCode] = useState<string>('');
  const [newPromoType, setNewPromoType] = useState<'fixed' | 'percentage'>('fixed');
  const [newPromoValue, setNewPromoValue] = useState<number>(1000);
  const [newPromoMinOrder, setNewPromoMinOrder] = useState<number>(3000);

  // FAQ entries adding states
  const [newFaqQuestion, setNewFaqQuestion] = useState<string>('');
  const [newFaqAnswer, setNewFaqAnswer] = useState<string>('');
  const [newFaqCategory, setNewFaqCategory] = useState<string>('Général');

  // Accordion drawer collapsing toggles
  const [isPromosCollapsed, setIsPromosCollapsed] = useState<boolean>(true);
  const [isFaqsCollapsed, setIsFaqsCollapsed] = useState<boolean>(true);

  // Hardcoded Admin lists modeling the layout mocks exactly
  const [adminVendors, setAdminVendors] = useState([
    { id: 'v1', name: 'Maquis Chez Fatou', city: 'Ouagadougou', date: 'Inscrit le 20 mai 2024', status: 'attente', image: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=120' },
    { id: 'v2', name: 'Le Bon Goût', city: 'Bobo-Dioulasso', date: 'Inscrit le 19 mai 2024', status: 'valides', image: 'https://images.unsplash.com/photo-1604329760661-e71dc83f8f26?w=120' },
    { id: 'v3', name: "Saveurs d'Afrique", city: 'Ouagadougou', date: 'Inscrit le 18 mai 2024', status: 'valides', image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=120' },
    { id: 'v4', name: "La Table d'Ibrahim", city: 'Koudougou', date: 'Inscrit le 17 mai 2024', status: 'suspendus', image: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=120' },
  ]);

  const [adminDrivers, setAdminDrivers] = useState([
    { id: 'd1', name: 'Moussa Traoré', phone: '+226 70 12 34 56', date: 'Inscrit le 20 mai 2024', status: 'attente', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120' },
    { id: 'd2', name: 'Awa Kaboré', phone: '+226 65 43 21 09', date: 'Inscrit le 19 mai 2024', status: 'valides', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120' },
    { id: 'd3', name: 'Blaise K.', phone: '+226 70 12 34 56', date: 'Inscrit le 18 mai 2024', status: 'valides', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120' },
    { id: 'd4', name: 'Ibrahim Ouédraogo', phone: '+226 78 90 12 34', date: 'Inscrit le 17 mai 2024', status: 'suspendus', avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=120' },
  ]);

  const [adminLitiges, setAdminLitiges] = useState([
    { id: 'l1', title: 'Commande #DODO12345', desc: 'Problème de livraison', reporter: 'Signalé par Moussa Traoré', date: '20 mai 2024 à 12:30', status: 'en_cours' },
    { id: 'l2', title: 'Maquis Chez Fatou', desc: 'Qualité des plats', reporter: 'Signalé par Awa Kaboré', date: '21 mai 2024 à 11:45', status: 'nouveau' },
    { id: 'l3', title: 'Livreur Blaise K.', desc: 'Comportement', reporter: 'Signalé par Client', date: '19 mai 2024 à 18:20', status: 'resolus' }
  ]);

  const [adminReversements, setAdminReversements] = useState([
    { id: 'rev1', type: 'vendeur', recipient: 'Maquis Chez Fatou', amount: 35250, date: '21 mai 2024 à 11:45', status: 'effectué' },
    { id: 'rev2', type: 'vendeur', recipient: 'Le Bon Goût', amount: 18400, date: '21 mai 2024 à 10:15', status: 'en_attente' },
    { id: 'rev3', type: 'livreur', recipient: 'Moussa Traoré', amount: 12500, date: '21 mai 2024 à 09:30', status: 'en_attente' },
    { id: 'rev4', type: 'livreur', recipient: 'Awa Kaboré', amount: 8400, date: '20 mai 2024 à 18:00', status: 'effectué' },
    { id: 'rev5', type: 'vendeur', recipient: "Saveurs d'Afrique", amount: 45000, date: '20 mai 2024 à 17:15', status: 'effectué' },
    { id: 'rev6', type: 'livreur', recipient: 'Blaise K.', amount: 15000, date: '20 mai 2024 à 15:45', status: 'en_attente' },
  ]);

  const toggleReversementStatus = (id: string) => {
    setAdminReversements(prev => prev.map(r => {
      if (r.id === id) {
        const nextStatus = r.status === 'effectué' ? 'en_attente' : 'effectué';
        setTimeout(() => {
          showToast(`Statut du virement mis à jour : ${nextStatus === 'effectué' ? 'Effectué' : 'En attente'} ! 💸`);
        }, 50);
        return { ...r, status: nextStatus };
      }
      return r;
    }));
  };

  // Handle validating or suspending vendors
  const updateVendorStatus = (id: string, nextStatus: string) => {
    setAdminVendors(prev => prev.map(v => v.id === id ? { ...v, status: nextStatus } : v));
    showToast(`Statut du vendeur mis à jour avec succès ! 🍲`);
  };

  // Handle validating or suspending drivers
  const updateDriverStatus = (id: string, nextStatus: string) => {
    setAdminDrivers(prev => prev.map(d => d.id === id ? { ...d, status: nextStatus } : d));
    showToast(`Statut du livreur mis à jour avec succès ! 🏍️`);
  };

  // Handle treating litiges
  const updateLitigeStatus = (id: string, nextStatus: string) => {
    setAdminLitiges(prev => prev.map(l => l.id === id ? { ...l, status: nextStatus } : l));
    showToast(`Litige traité et archivé ! 🔒`);
  };

  return (
    <div id="admin_iphone_wrapper" className="relative mx-auto w-[390px] h-[844px] bg-slate-900 rounded-[55px] p-[12px] shadow-2xl border-[6px] border-slate-800 ring-1 ring-slate-700/50 flex flex-col overflow-hidden select-none">
      
      {/* Toast Notifier */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div 
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="absolute top-[80px] left-[5%] right-[5%] z-50 bg-[#E52327] text-white text-xs py-2.5 px-4 rounded-xl shadow-lg border border-red-500 font-bold flex items-center gap-2"
          >
            <div className="w-2 h-2 rounded-full bg-white animate-ping"></div>
            <p>{toastMessage}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* iPhone top sensor block */}
      <div className="absolute top-[16px] left-1/2 -translate-x-1/2 w-[110px] h-[30px] bg-black rounded-[20px] z-50 flex items-center justify-between px-3">
        <div className="w-3.5 h-3.5 bg-[#1F2937] rounded-full border border-gray-900"></div>
        <div className="w-12 h-1 bg-gray-900 rounded-full"></div>
        <div className="w-2.5 h-2.5 bg-red-950/40 rounded-full"></div>
      </div>

      {/* Simulator Main Body Frame */}
      <div className="relative flex-1 w-full h-full bg-[#F3F4F6] rounded-[43px] overflow-hidden flex flex-col font-sans text-gray-900 shadow-inner">
        
        {/* Status Bar */}
        <div className="h-[47px] w-full flex justify-between items-end px-7 pb-2.5 bg-transparent z-40 text-black text-[14px] font-bold">
          <span>09:41</span>
          <div className="flex items-center gap-1.55">
            <span className="text-[9px] bg-red-500/10 text-red-650 px-1.5 py-0.2 rounded font-black">Admin Mode</span>
            <div className="w-5 h-2.5 border border-black rounded-sm p-0.5 flex items-center">
              <div className="w-4 h-full bg-black rounded-[1px]"></div>
            </div>
          </div>
        </div>

        {/* =======================================================
            SCREEN 1: DASHBOARD PRINCIPAL
            ======================================================= */}
        {adminScreen === 1 && (
          <div className="flex-1 flex flex-col overflow-hidden pb-[70px]">
            {/* Header with Notification Indicator */}
            <div className="px-5 pt-3 pb-3 flex justify-between items-center bg-white border-b border-gray-100 shrink-0">
              <div className="flex items-center gap-2">
                <DodoLogo size={34} withText={true} withContainer={true} contourColor="#FFFFFF" />
                <h1 className="text-[17px] font-black tracking-tight text-gray-950">Admin</h1>
              </div>
              <div className="flex items-center gap-1.5">
                <button 
                  onClick={() => setDriverScreen(8)}
                  className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center border border-gray-200 relative transition-transform"
                  title="Configuration Système"
                  id="admin-settings-cog-btn"
                >
                  <Settings className="w-4 h-4 text-[#E52327]" />
                </button>
                <button 
                  onClick={() => showToast("Gestion des alertes globales active...")}
                  className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center border border-gray-150 relative"
                >
                  <Bell className="w-4 h-4 text-gray-800" />
                  <span className="absolute top-[6px] right-[6px] w-2 h-2 rounded-full bg-[#E52327]"></span>
                </button>
              </div>
            </div>

            {/* Scrollable Dashboard Body */}
            <div className="flex-1 overflow-y-auto no-scrollbar p-4 space-y-4">
              
              {/* Daily Filter Line */}
              <div className="flex justify-between items-center bg-white p-2.5 px-4 rounded-xl border border-gray-100 shadow-2xs">
                <span className="text-xs font-bold text-gray-400">Période d'analyse</span>
                <span className="text-xs font-black text-[#E52327] flex items-center gap-1 cursor-pointer">
                  Aujourd'hui ▾
                </span>
              </div>

              {/* Grid block metric cards matching mockup 1 */}
              <div className="grid grid-cols-2 gap-3">
                
                {/* Commandes stat block */}
                <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-2xs relative overflow-hidden">
                  <span className="text-gray-400 text-[10px] font-extrabold uppercase tracking-wider block">Commandes</span>
                  <span className="text-[20px] font-black text-gray-950 block mt-1">1 248</span>
                  <span className="text-green-600 text-[10px] font-bold block mt-1">↑ 18% vs hier</span>
                  <div className="absolute right-3.5 bottom-3 text-red-500/15">
                    <ShoppingBag className="w-8 h-8 stroke-[2.5]" />
                  </div>
                </div>

                {/* Revenus stat block */}
                <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-2xs relative overflow-hidden">
                  <span className="text-gray-400 text-[10px] font-extrabold uppercase tracking-wider block">Revenus</span>
                  <span className="text-[14.5px] font-black text-[#E52327] block mt-2.5">2 450 000 FCFA</span>
                  <span className="text-green-600 text-[10px] font-bold block mt-1">↑ 22% vs hier</span>
                  <div className="absolute right-3.5 bottom-3 text-green-500/15">
                    <DollarSign className="w-8 h-8 stroke-[2.5]" />
                  </div>
                </div>

                {/* Active vendors */}
                <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-2xs relative overflow-hidden">
                  <span className="text-gray-400 text-[10px] font-extrabold uppercase tracking-wider block">Vendeurs actifs</span>
                  <span className="text-[20px] font-black text-gray-950 block mt-1">156</span>
                  <span className="text-green-600 text-[10px] font-bold block mt-1">↑ 12% vs hier</span>
                  <div className="absolute right-3.5 bottom-3 text-amber-500/15">
                    <Users className="w-8 h-8 stroke-[2.5]" />
                  </div>
                </div>

                {/* Livreurs stat */}
                <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-2xs relative overflow-hidden">
                  <span className="text-gray-400 text-[10px] font-extrabold uppercase tracking-wider block">Livreurs actifs</span>
                  <span className="text-[20px] font-black text-gray-950 block mt-1">320</span>
                  <span className="text-green-600 text-[10px] font-bold block mt-1">↑ 15% vs hier</span>
                  <div className="absolute right-3.5 bottom-3 text-emerald-500/15 font-serif text-lg font-blackStyle italic">
                    🏍️
                  </div>
                </div>

              </div>

              {/* Commandes chart section */}
              <div className="bg-white rounded-3xl p-4.5 border border-gray-100 shadow-2xs space-y-3">
                <div className="flex justify-between items-center">
                  <h3 className="text-gray-900 font-black text-[12.5px] uppercase tracking-wide">Aperçu des commandes</h3>
                  <span className="text-[10px] bg-red-50 text-red-600 font-extrabold px-2 py-0.5 rounded-full">Evolution horaire</span>
                </div>

                {/* Red Wave SVG Chart matching Mockup 1 style */}
                <div className="h-[120px] w-full bg-slate-50 rounded-2xl border border-gray-100/80 p-2 pt-4 relative">
                  
                  {/* Grid Lines mockup */}
                  <div className="absolute inset-x-2 top-4 border-t border-gray-200/50"></div>
                  <div className="absolute inset-x-2 top-14 border-t border-gray-200/50"></div>
                  <div className="absolute inset-x-2 top-24 border-t border-gray-200/50"></div>

                  <svg className="w-full h-full" viewBox="0 0 300 80">
                    <path 
                      d="M 10,70 Q 50,55 90,65 T 170,25 T 250,45 T 290,30" 
                      fill="none" 
                      stroke="#E52327" 
                      strokeWidth="3.5" 
                      strokeLinecap="round" 
                    />
                    
                    {/* Glowing point at current maximum */}
                    <circle cx="170" cy="25" r="4.5" fill="#E52327" className="animate-pulse" />
                  </svg>
                  
                  {/* Timeline labels */}
                  <div className="flex justify-between px-2 text-[8.5px] font-mono text-gray-400 font-bold mt-1.5">
                    <span>00:00</span>
                    <span>04:00</span>
                    <span>08:00</span>
                    <span>12:00</span>
                    <span>16:00</span>
                    <span>20:00</span>
                  </div>
                </div>
              </div>

              {/* Pizza Pie partition donut chart mock block */}
              <div className="bg-white rounded-3xl p-4 border border-gray-100 shadow-2xs space-y-3">
                <h3 className="text-gray-950 font-black text-[12.5px] uppercase tracking-wider">Répartition des commandes</h3>
                
                <div className="flex items-center gap-6">
                  {/* Donut drawing */}
                  <div className="relative w-18 h-18 flex items-center justify-center">
                    <svg className="w-full h-full transform -rotate-90">
                      <circle cx="36" cy="36" r="28" fill="transparent" stroke="#EF4444" strokeWidth="8" strokeDasharray="176" strokeDashoffset="35" />
                      <circle cx="36" cy="36" r="28" fill="transparent" stroke="#F59E0B" strokeWidth="8" strokeDasharray="176" strokeDashoffset="120" />
                      <circle cx="36" cy="36" r="28" fill="transparent" stroke="#10B981" strokeWidth="8" strokeDasharray="176" strokeDashoffset="150" />
                    </svg>
                    <div className="absolute font-black text-xs text-gray-900">81%</div>
                  </div>

                  {/* Legend matching pixel mockup */}
                  <div className="flex-1 text-[11px] space-y-1.5 font-bold">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-gray-500">
                        <span className="w-2.5 h-2.5 rounded-full bg-green-500"></span> Livrées
                      </span>
                      <span className="text-gray-900">1 020 (81%)</span>
                    </div>
                    <div className="flex items-center justify-between border-t border-gray-50 pt-1">
                      <span className="flex items-center gap-1.5 text-gray-500">
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span> En cours
                      </span>
                      <span className="text-gray-900">180 (14%)</span>
                    </div>
                    <div className="flex items-center justify-between border-t border-gray-50 pt-1">
                      <span className="flex items-center gap-1.5 text-gray-500">
                        <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span> Annulées
                      </span>
                      <span className="text-gray-900">48 (5%)</span>
                    </div>
                  </div>
                </div>

              </div>

            </div>
          </div>
        )}

        {/* =======================================================
            SCREEN 2: GESTION DES VENDEURS
            ======================================================= */}
        {adminScreen === 2 && (
          <div className="flex-1 flex flex-col bg-slate-50 overflow-hidden pb-[70px]">
            {/* Header with Search */}
            <div className="bg-white border-b border-gray-150 shrink-0">
              <div className="px-5 pt-3 pb-2 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className="p-1 text-sm bg-amber-50 rounded">🍳</span>
                  <h1 className="text-[17px] font-black text-gray-950">Gestion des vendeurs</h1>
                </div>
                <button onClick={() => showToast("Filtre avancé...")} className="text-[#E52327] font-black text-xs uppercase leading-none">Filtres</button>
              </div>

              {/* Sub-tabs row matching mockup 2 */}
              <div className="flex text-xs font-bold border-t border-gray-100">
                <button 
                  onClick={() => setVendorTab('attente')}
                  className={`flex-1 py-3 text-center transition-all relative ${vendorTab === 'attente' ? 'text-[#E52327] font-black' : 'text-gray-400'}`}
                >
                  En attente (8)
                  {vendorTab === 'attente' && <div className="absolute bottom-0 inset-x-0 h-0.5 bg-[#E52327]" />}
                </button>
                <button 
                  onClick={() => setVendorTab('valides')}
                  className={`flex-1 py-3 text-center transition-all relative ${vendorTab === 'valides' ? 'text-[#E52327] font-black' : 'text-gray-400'}`}
                >
                  Validés (142)
                  {vendorTab === 'valides' && <div className="absolute bottom-0 inset-x-0 h-0.5 bg-[#E52327]" />}
                </button>
                <button 
                  onClick={() => setVendorTab('suspendus')}
                  className={`flex-1 py-3 text-center transition-all relative ${vendorTab === 'suspendus' ? 'text-[#E52327] font-black' : 'text-gray-400'}`}
                >
                  Suspendus (6)
                  {vendorTab === 'suspendus' && <div className="absolute bottom-0 inset-x-0 h-0.5 bg-[#E52327]" />}
                </button>
              </div>
            </div>

            {/* List area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3.5 no-scrollbar">
              
              {/* Simple Searchbar input decoration */}
              <div className="bg-white border border-gray-150 rounded-xl px-3 py-2 flex items-center gap-2 text-xs">
                <Search className="w-4 h-4 text-gray-400 shrink-0" />
                <input 
                  type="text" 
                  value={vendorSearch} 
                  onChange={(e) => setVendorSearch(e.target.value)} 
                  placeholder="Rechercher un maquis ou restaurant..." 
                  className="flex-1 bg-transparent border-none outline-none text-gray-800"
                />
              </div>

              <div className="space-y-3">
                {adminVendors
                  .filter(v => v.status === vendorTab && v.name.toLowerCase().includes(vendorSearch.toLowerCase()))
                  .map((vendor) => (
                    <div key={vendor.id} className="bg-white rounded-2xl p-4 border border-gray-150/80 shadow-2xs flex justify-between items-start gap-3">
                      
                      {/* Left: thumb & info text matching mockup 2 */}
                      <div className="flex gap-3">
                        <img 
                          src={vendor.image} 
                          alt={vendor.name} 
                          className="w-13 h-13 rounded-xl object-cover shrink-0"
                          referrerPolicy="no-referrer"
                        />
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <h4 className="text-[13.5px] font-extrabold text-gray-950 truncate max-w-[120px]">{vendor.name}</h4>
                            <span className={`text-[8.5px] px-1.5 py-0.2 rounded font-black uppercase ${
                              vendor.status === 'attente' ? 'bg-amber-50 text-amber-600' : vendor.status === 'valides' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
                            }`}>
                              {vendor.status === 'attente' ? 'En attente' : vendor.status === 'valides' ? 'Validé' : 'Suspendu'}
                            </span>
                          </div>
                          <p className="text-[11px] text-gray-400 font-bold">{vendor.city}</p>
                          <p className="text-[10px] text-gray-500 font-medium font-mono">{vendor.date}</p>
                        </div>
                      </div>

                      {/* Right: Validation Actions button triggers matching design 2 */}
                      <div className="flex flex-col gap-1.5 text-[10px]">
                        {vendor.status === 'attente' ? (
                          <>
                            <button 
                              onClick={() => updateVendorStatus(vendor.id, 'valides')}
                              className="px-3 py-1.5 bg-[#E52327] text-white rounded-lg font-black uppercase tracking-wide active:scale-95 transition"
                            >
                              Valider
                            </button>
                            <button 
                              onClick={() => {
                                if (window.confirm("Refuser cette demande d'enregistrement ?")) {
                                  updateVendorStatus(vendor.id, 'suspendus');
                                }
                              }}
                              className="px-3 py-1.5 bg-white border border-gray-200 text-gray-500 rounded-lg font-bold uppercase active:bg-gray-50 transition text-center"
                            >
                              Refuser
                            </button>
                          </>
                        ) : vendor.status === 'valides' ? (
                          <button 
                            onClick={() => updateVendorStatus(vendor.id, 'suspendus')}
                            className="px-3 py-1.5 bg-red-100 text-[#E52327] rounded-lg font-black uppercase tracking-wide active:scale-95 transition"
                          >
                            Suspendre
                          </button>
                        ) : (
                          <button 
                            onClick={() => updateVendorStatus(vendor.id, 'valides')}
                            className="px-3 py-1.5 bg-green-600 text-white rounded-lg font-black uppercase tracking-wide active:scale-95 transition"
                          >
                            Activer
                          </button>
                        )}
                      </div>

                    </div>
                ))}
              </div>

            </div>
          </div>
        )}

        {/* =======================================================
            SCREEN 3: GESTION DES LIVREURS
            ======================================================= */}
        {adminScreen === 3 && (
          <div className="flex-1 flex flex-col bg-slate-50 overflow-hidden pb-[70px]">
            {/* Header */}
            <div className="bg-white border-b border-gray-150 shrink-0">
              <div className="px-5 pt-3 pb-2 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className="p-1 text-sm bg-emerald-50 rounded">🏍️</span>
                  <h1 className="text-[17px] font-black text-gray-950">Gestion des livreurs</h1>
                </div>
                <button onClick={() => showToast("Filtre livreurs...")} className="text-[#E52327] font-black text-xs uppercase leading-none">Filtres</button>
              </div>

              {/* Subtabs matching design mockup 3 */}
              <div className="flex text-xs font-bold border-t border-gray-100">
                <button 
                  onClick={() => setDriverTab('attente')}
                  className={`flex-1 py-3 text-center transition-all relative ${driverTab === 'attente' ? 'text-[#E52327] font-black' : 'text-gray-400'}`}
                >
                  En attente (12)
                  {driverTab === 'attente' && <div className="absolute bottom-0 inset-x-0 h-0.5 bg-[#E52327]" />}
                </button>
                <button 
                  onClick={() => setDriverTab('valides')}
                  className={`flex-1 py-3 text-center transition-all relative ${driverTab === 'valides' ? 'text-[#E52327] font-black' : 'text-gray-400'}`}
                >
                  Validés (282)
                  {driverTab === 'valides' && <div className="absolute bottom-0 inset-x-0 h-0.5 bg-[#E52327]" />}
                </button>
                <button 
                  onClick={() => setDriverTab('suspendus')}
                  className={`flex-1 py-3 text-center transition-all relative ${driverTab === 'suspendus' ? 'text-[#E52327] font-black' : 'text-gray-400'}`}
                >
                  Suspendus (15)
                  {driverTab === 'suspendus' && <div className="absolute bottom-0 inset-x-0 h-0.5 bg-[#E52327]" />}
                </button>
              </div>
            </div>

            {/* Scroll list */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3.5 no-scrollbar">
              
              {/* Search Driver bar design */}
              <div className="bg-white border border-gray-150 rounded-xl px-3 py-2 flex items-center gap-2 text-xs">
                <Search className="w-4 h-4 text-gray-400 shrink-0" />
                <input 
                  type="text" 
                  value={driverSearch} 
                  onChange={(e) => setDriverSearch(e.target.value)} 
                  placeholder="Rechercher un livreur par nom..." 
                  className="flex-1 bg-transparent border-none outline-none text-gray-800"
                />
              </div>

              <div className="space-y-3">
                {adminDrivers
                  .filter(d => d.status === driverTab && d.name.toLowerCase().includes(driverSearch.toLowerCase()))
                  .map((drv) => (
                    <div key={drv.id} className="bg-white rounded-2xl p-4 border border-gray-150/80 shadow-2xs flex justify-between items-start gap-3">
                      
                      {/* Driver info block */}
                      <div className="flex gap-3">
                        <img 
                          src={drv.avatar} 
                          alt={drv.name} 
                          className="w-13 h-13 rounded-full object-cover border-2 border-red-500/5 shrink-0"
                          referrerPolicy="no-referrer"
                        />
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <h4 className="text-[13.5px] font-extrabold text-gray-950 truncate max-w-[120px]">{drv.name}</h4>
                            <span className={`text-[8.5px] px-1.5 py-0.2 rounded font-black uppercase ${
                              drv.status === 'attente' ? 'bg-amber-50 text-amber-600' : drv.status === 'valides' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
                            }`}>
                              {drv.status === 'attente' ? 'En attente' : drv.status === 'valides' ? 'Validé' : 'Suspendu'}
                            </span>
                          </div>
                          <p className="text-[11.5px] text-gray-500 font-bold font-mono">{drv.phone}</p>
                          <p className="text-[10px] text-gray-400 font-medium">{drv.date}</p>
                        </div>
                      </div>

                      {/* Primary Actions layout */}
                      <div className="flex flex-col gap-1.5 text-[10px]">
                        {drv.status === 'attente' ? (
                          <>
                            <button 
                              onClick={() => updateDriverStatus(drv.id, 'valides')}
                              className="px-3 py-1.5 bg-[#E52327] text-white rounded-lg font-black uppercase tracking-wide active:scale-95 transition"
                            >
                              Valider
                            </button>
                            <button 
                              onClick={() => {
                                if (window.confirm("Rejeter cette candidature de livreur ?")) {
                                  updateDriverStatus(drv.id, 'suspendus');
                                }
                              }}
                              className="px-3 py-1.5 bg-white border border-gray-200 text-gray-500 rounded-lg font-bold uppercase active:bg-gray-50 transition text-center"
                            >
                              Refuser
                            </button>
                          </>
                        ) : drv.status === 'valides' ? (
                          <button 
                            onClick={() => updateDriverStatus(drv.id, 'suspendus')}
                            className="px-3 py-1.5 bg-red-100 text-[#E52327] rounded-lg font-black uppercase tracking-wide active:scale-95 transition"
                          >
                            Suspendre
                          </button>
                        ) : (
                          <button 
                            onClick={() => updateDriverStatus(drv.id, 'valides')}
                            className="px-3 py-1.5 bg-[#E52327] text-white rounded-lg font-black uppercase tracking-wide active:scale-95 transition"
                          >
                            Activer
                          </button>
                        )}
                      </div>

                    </div>
                ))}
              </div>

            </div>
          </div>
        )}

        {/* =======================================================
            SCREEN 4: GESTION DES COMMANDES
            ======================================================= */}
        {adminScreen === 4 && (
          <div className="flex-1 flex flex-col bg-slate-50 overflow-hidden pb-[70px]">
            {/* Header */}
            <div className="bg-white border-b border-gray-150 shrink-0">
              <div className="px-5 pt-3 pb-2 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className="p-1 text-sm bg-red-50 rounded">📋</span>
                  <h1 className="text-[17px] font-black text-gray-950">Gestion des commandes</h1>
                </div>
                <button onClick={() => showToast("Filtre par dodo...")} className="text-[#E52327] font-black text-xs uppercase leading-none">Filtres</button>
              </div>

              {/* Sub-tabs row matching mockup 4 */}
              <div className="flex text-xs font-bold border-t border-gray-100">
                <button 
                  onClick={() => setOrdersTab('toutes')}
                  className={`flex-1 py-3 text-center transition-all relative ${ordersTab === 'toutes' ? 'text-[#E52327] font-black' : 'text-gray-400'}`}
                >
                  Toutes (125)
                  {ordersTab === 'toutes' && <div className="absolute bottom-0 inset-x-0 h-0.5 bg-[#E52327]" />}
                </button>
                <button 
                  onClick={() => setOrdersTab('en_cours')}
                  className={`flex-1 py-3 text-center transition-all relative ${ordersTab === 'en_cours' ? 'text-[#E52327] font-black' : 'text-gray-400'}`}
                >
                  En cours (45)
                  {ordersTab === 'en_cours' && <div className="absolute bottom-0 inset-x-0 h-0.5 bg-[#E52327]" />}
                </button>
                <button 
                  onClick={() => setOrdersTab('terminees')}
                  className={`flex-1 py-3 text-center transition-all relative ${ordersTab === 'terminees' ? 'text-[#E52327] font-black' : 'text-gray-400'}`}
                >
                  Terminées (80)
                  {ordersTab === 'terminees' && <div className="absolute bottom-0 inset-x-0 h-0.5 bg-[#E52327]" />}
                </button>
              </div>
            </div>

            {/* List entries */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 no-scrollbar">
              
              {/* Dynamic state order entries first */}
              {orders
                .filter(o => {
                  if (ordersTab === 'en_cours') return o.status !== 'Livré';
                  if (ordersTab === 'terminees') return o.status === 'Livré';
                  return true;
                })
                .map((ord) => (
                  <div key={ord.id} className="bg-white rounded-2xl p-4 border border-gray-150/85 shadow-2xs flex justify-between items-center hover:border-gray-300 transition">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[#E52327] font-black text-xs font-mono">{ord.order_number}</span>
                        <span className="text-gray-400 text-[10px] font-bold font-mono">{ord.status_times.confirmed}</span>
                      </div>
                      <h4 className="text-[13px] font-black text-gray-950 truncate max-w-[170px]">{ord.restaurant.name}</h4>
                      <p className="text-[11px] text-gray-400 font-bold truncate max-w-[170px]">→ Client Dodo</p>
                      
                      {/* Small status indicator pill */}
                      <span className={`inline-block text-[9px] font-black px-2 py-0.5 mt-1 rounded-full uppercase leading-none ${
                        ord.status === 'Livré' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                      }`}>
                        {ord.status}
                      </span>
                    </div>

                    <div className="text-right space-y-1">
                      <span className="text-[13.5px] font-black text-gray-950 block">{ord.total} FCFA</span>
                      <span className="text-[10px] text-gray-400 font-bold block">{ord.items.length} articles</span>
                      <ChevronRight className="w-4 h-4 text-gray-400 ml-auto inline-block mt-0.5" />
                    </div>
                  </div>
              ))}

              {/* Exact static list items shown in image 4 to preserve layout beauty */}
              <div className="bg-white rounded-2xl p-4 border border-gray-150/85 shadow-2xs flex justify-between items-center">
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[#E52327] font-black text-xs font-mono">#DODO12345</span>
                    <span className="text-gray-400 text-[10px] font-bold font-mono">12:30</span>
                  </div>
                  <h4 className="text-[13px] font-black text-gray-950">Maquis Chez Fatou</h4>
                  <p className="text-[11px] text-gray-400 font-bold">Moussa Traoré</p>
                  <span className="inline-block text-[9px] font-black px-2 py-0.5 mt-1 rounded-full uppercase bg-amber-50 text-amber-600">En cours</span>
                </div>
                <div className="text-right space-y-1">
                  <span className="text-[13.5px] font-black text-gray-950 block">7 500 FCFA</span>
                  <span className="text-[10px] text-gray-400 font-bold block">3 articles</span>
                  <ChevronRight className="w-4 h-4 text-gray-400 ml-auto inline-block" />
                </div>
              </div>

              <div className="bg-white rounded-2xl p-4 border border-gray-150/85 shadow-2xs flex justify-between items-center">
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[#E52327] font-black text-xs font-mono">#DODO12344</span>
                    <span className="text-gray-400 text-[10px] font-bold font-mono">12:28</span>
                  </div>
                  <h4 className="text-[13px] font-black text-gray-950">Le Bon Goût</h4>
                  <p className="text-[11px] text-gray-400 font-bold">Awa Kaboré</p>
                  <span className="inline-block text-[9px] font-black px-2 py-0.5 mt-1 rounded-full uppercase bg-yellow-50 text-yellow-600">En préparation</span>
                </div>
                <div className="text-right space-y-1">
                  <span className="text-[13.5px] font-black text-gray-950 block">4 000 FCFA</span>
                  <span className="text-[10px] text-gray-400 font-bold block">2 articles</span>
                  <ChevronRight className="w-4 h-4 text-gray-400 ml-auto inline-block" />
                </div>
              </div>

              <div className="bg-white rounded-2xl p-4 border border-gray-150/85 shadow-2xs flex justify-between items-center">
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[#E52327] font-black text-xs font-mono">#DODO12343</span>
                    <span className="text-gray-400 text-[10px] font-bold font-mono">12:25</span>
                  </div>
                  <h4 className="text-[13px] font-black text-gray-950">Saveurs d'Afrique</h4>
                  <p className="text-[11px] text-gray-400 font-bold">Blaise K.</p>
                  <span className="inline-block text-[9px] font-black px-2 py-0.5 mt-1 rounded-full uppercase bg-blue-50 text-blue-605">En route</span>
                </div>
                <div className="text-right space-y-1">
                  <span className="text-[13.5px] font-black text-gray-950 block">5 000 FCFA</span>
                  <span className="text-[10px] text-gray-400 font-bold block">3 articles</span>
                  <ChevronRight className="w-4 h-4 text-gray-400 ml-auto inline-block" />
                </div>
              </div>

            </div>
          </div>
        )}

        {/* =======================================================
            SCREEN 5: GESTION DES PAIEMENTS
            ======================================================= */}
        {adminScreen === 5 && (
          <div className="flex-1 flex flex-col bg-slate-50 overflow-hidden pb-[70px]">
            {/* Header */}
            <div className="bg-white border-b border-gray-150 shrink-0">
              <div className="px-5 pt-3 pb-2 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className="p-1 text-sm bg-red-50 rounded">💳</span>
                  <h1 className="text-[17px] font-black text-gray-950">Gestion des paiements</h1>
                </div>
                <button onClick={() => showToast("Exportation Excel lancée 📁")} className="text-gray-500 font-bold text-[11px] uppercase">Excel</button>
              </div>

              {/* Sub-tabs */}
              <div className="flex text-[10px] font-black border-t border-gray-100 bg-white overflow-x-auto no-scrollbar scroll-smooth">
                {([
                  { id: 'yengadashboard', label: 'dashboard' },
                  { id: 'transactions', label: 'transactions' },
                  { id: 'reversements', label: 'versements' },
                  { id: 'retraits', label: 'retraits' },
                  { id: 'yengaconfig', label: 'Yenga Config' },
                  { id: 'webhooks', label: 'Webhooks' }
                ] as const).map((tab) => (
                  <button 
                    key={tab.id}
                    onClick={() => {
                      setPaymentsTab(tab.id);
                      refreshYengaData();
                    }}
                    className={`flex-1 min-w-[72px] py-3 text-center transition-all relative whitespace-nowrap px-1 uppercase tracking-tight ${paymentsTab === tab.id ? 'text-[#E52327] font-black bg-slate-50/55' : 'text-gray-400'}`}
                  >
                    {tab.label}
                    {paymentsTab === tab.id && <div className="absolute bottom-0 inset-x-0 h-0.5 bg-[#E52327]" />}
                  </button>
                ))}
              </div>
            </div>

            {/* List with YengaPay stats */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
              
              {paymentsTab === 'yengadashboard' && (
                <div className="space-y-4 text-left animate-fadeIn">
                  {/* Status & Quick Diagnostic banner */}
                  <div className="bg-slate-900 text-white rounded-2xl p-4.5 border border-slate-800 space-y-3.5 shadow-sm">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="text-emerald-500 text-sm animate-pulse">●</span>
                        <h4 className="font-extrabold text-[10.5px] tracking-wide text-slate-200 uppercase">ÉTAT DE LA PASSERELLE</h4>
                      </div>
                      <span className="text-[8px] bg-red-600 px-1.5 py-0.5 rounded text-white font-black select-none font-mono tracking-widest leading-none">
                        YENGAPAY {yengaLocalConfig.testMode ? "SANDBOX" : "LIVE"}
                      </span>
                    </div>

                    {/* KPI Cards */}
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-slate-950/70 border border-slate-800 p-3 rounded-xl">
                        <span className="text-slate-400 text-[8px] font-black uppercase tracking-wider block">Total Encaissé</span>
                        <p className="text-sm font-black text-emerald-400 mt-1 font-sans">
                          {yengaTransactions
                            .filter(t => t.status === 'completed')
                            .reduce((sum, t) => sum + t.amount, 0)
                            .toLocaleString('fr-FR')} F
                        </p>
                        <span className="text-[7.5px] text-slate-500 font-medium block mt-0.5">
                          {yengaTransactions.filter(t => t.status === 'completed').length} transactions validées
                        </span>
                      </div>
                      <div className="bg-slate-950/70 border border-slate-800 p-3 rounded-xl">
                        <span className="text-slate-400 text-[8px] font-black uppercase tracking-wider block">Taux de Succès</span>
                        <p className="text-sm font-black text-blue-400 mt-1 font-sans">
                          {(() => {
                            const completedCount = yengaTransactions.filter(t => t.status === 'completed').length;
                            const failedCount = yengaTransactions.filter(t => t.status === 'failed').length;
                            const totalCount = completedCount + failedCount;
                            return totalCount > 0 
                              ? `${Math.round((completedCount / totalCount) * 100)}%`
                              : '100%';
                          })()}
                        </p>
                        <span className="text-[7.5px] text-slate-500 font-medium block mt-0.5">
                          {yengaTransactions.filter(t => t.status === 'failed').length} échecs enregistrés
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-slate-950/70 border border-slate-800 p-3 rounded-xl">
                        <span className="text-slate-400 text-[8px] font-black uppercase tracking-wider block">Alertes Sécurité</span>
                        <p className={`text-sm font-black mt-1 font-sans ${yengaSecurityLogs.length > 0 ? 'text-red-500' : 'text-slate-400'}`}>
                          {yengaSecurityLogs.length}
                        </p>
                        <span className="text-[7.5px] text-slate-500 font-medium block mt-0.5">
                          {yengaSecurityLogs.filter(l => l.severity === 'danger').length} critiques (Fraudes)
                        </span>
                      </div>
                      <div className="bg-slate-950/70 border border-slate-800 p-3 rounded-xl">
                        <span className="text-slate-400 text-[8px] font-black uppercase tracking-wider block">Santé Webhook</span>
                        <p className="text-sm font-black text-emerald-400 mt-1 font-sans">
                          {(() => {
                            const totalWebhooks = yengaWebhooks.length;
                            if (totalWebhooks === 0) return '100%';
                            const successWebhooks = yengaWebhooks.filter(w => w.status_code === 200).length;
                            return `${Math.round((successWebhooks / totalWebhooks) * 100)}%`;
                          })()}
                        </p>
                        <span className="text-[7.5px] text-slate-500 font-medium block mt-0.5">
                          {yengaRetryQueue.length} webhooks en file d'attente
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Volume allocation by payment method */}
                  <div className="bg-white rounded-2xl p-4 border border-gray-150 shadow-3xs space-y-3">
                    <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                      <h4 className="font-extrabold text-xs text-gray-950 uppercase tracking-tight">Répartition par Opérateur</h4>
                      <span className="text-[9px] font-bold text-gray-400">Paiements YengaPay</span>
                    </div>

                    <div className="space-y-3.5">
                      {([
                        { name: 'Orange Money', color: 'bg-orange-500' },
                        { name: 'Moov Money', color: 'bg-sky-500' },
                        { name: 'Wave', color: 'bg-teal-500' },
                        { name: 'Telecel Money', color: 'bg-emerald-500' },
                        { name: 'PayPal', color: 'bg-indigo-600' }
                      ] as const).map((provider) => {
                        const txs = yengaTransactions.filter(t => t.payment_method === provider.name && t.status === 'completed');
                        const total = txs.reduce((sum, t) => sum + t.amount, 0);
                        const allCompleted = yengaTransactions.filter(t => t.status === 'completed').reduce((sum, t) => sum + t.amount, 0);
                        const pct = allCompleted > 0 ? (total / allCompleted) * 100 : 0;

                        return (
                          <div key={provider.name} className="space-y-1">
                            <div className="flex justify-between text-[10px]">
                              <div className="flex items-center gap-1.5 font-bold text-gray-700">
                                <span className={`w-2 h-2 rounded-full ${provider.color}`}></span>
                                {provider.name}
                              </div>
                              <div className="font-extrabold text-gray-950 font-sans">
                                {total.toLocaleString('fr-FR')} F ({Math.round(pct)}%)
                              </div>
                            </div>
                            <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                              <div 
                                className={`h-full ${provider.color} transition-all duration-500`} 
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Security Highlights Dashboard Alerts */}
                  <div className="bg-red-50/70 border border-red-150 rounded-2xl p-4 space-y-3">
                    <div className="flex justify-between items-center pb-1.5 border-b border-red-200">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs">🛡️</span>
                        <h4 className="font-extrabold text-xs text-red-950 uppercase tracking-tight">Menaces & Suspicion de Fraude</h4>
                      </div>
                      <span className="text-[8.5px] font-black text-red-800 bg-red-100 rounded px-1.5 py-0.2">ALERTE SÉCURITÉ</span>
                    </div>

                    <div className="space-y-2">
                      {yengaSecurityLogs.length === 0 ? (
                        <div className="text-center py-4 bg-white/50 border border-dashed border-red-200 rounded-xl">
                          <p className="text-[10px] text-red-800 font-extrabold">✓ AUCUNE MENACE DÉTECTÉE SUR CE REQUIS</p>
                          <p className="text-[8.5px] text-gray-440 mt-0.5">La validation HMAC signature protège la plateforme.</p>
                        </div>
                      ) : (
                        yengaSecurityLogs.slice(0, 3).map((log) => (
                          <div key={log.id} className="p-2.5 bg-white border border-red-150 rounded-xl space-y-1.5">
                            <div className="flex justify-between items-start text-[9.5px]">
                              <span className="font-black text-red-950 flex items-center gap-1">
                                🚨 {log.reason}
                              </span>
                              <span className="font-mono text-gray-450 text-[8.5px]">{log.timestamp.split('T')[1]?.substring(0, 5) || log.timestamp}</span>
                            </div>
                            <p className="text-[9px] text-gray-500">
                              Tx Ref: <span className="font-mono text-gray-700 select-all font-bold">{log.transaction_reference}</span> • Clé HMAC: <span className="font-mono text-rose-600 font-bold">Incohérente</span>
                            </p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Webhook Latency Simulation Setting overview */}
                  <div className="bg-gradient-to-tr from-slate-900 to-slate-950 p-4 border border-slate-800 text-slate-200 rounded-2xl space-y-2.5">
                    <h5 className="font-extrabold text-[10px] tracking-wider uppercase text-slate-200">Diagnostique d'Écoute Webhook</h5>
                    <p className="text-[9.5px] text-slate-400 leading-normal">
                      Les webhooks de prélèvement sont signés avec la clé HMAC <code className="font-mono text-amber-400 bg-slate-950/60 px-1 py-0.2 rounded font-bold">{yengaLocalConfig.hmacSecret || 'Non_défini'}</code> pour attester du statut des fonds de manière synchrone.
                    </p>
                    <div className="flex justify-between items-center text-[9px] font-bold border-t border-slate-800 pt-2 text-slate-400">
                      <span>VERIFICATION HMAC SYSTEME:</span>
                      <span className={yengaLocalConfig.requireHmacVerification ? "text-emerald-400" : "text-amber-500"}>
                        {yengaLocalConfig.requireHmacVerification ? "ACTIVE (Bloquant)" : "INACTIVE (Pass-through)"}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {paymentsTab === 'transactions' && (
                <>
                  {/* Dynamic YengaPay Stats */}
                  <div className="grid grid-cols-2 gap-2.5 shrink-0">
                    <div className="bg-white p-3.5 rounded-2xl border border-gray-100 shadow-3xs">
                      <span className="text-gray-400 text-[9px] font-extrabold uppercase tracking-wide block">Total Encaissé ✓</span>
                      <h3 className="text-[15px] font-black text-emerald-600 mt-1 leading-none">
                        {yengaTransactions
                          .filter(t => t.status === 'completed')
                          .reduce((sum, t) => sum + t.amount, 0)
                          .toLocaleString('fr-FR')} {currencySymbol}
                      </h3>
                      <p className="text-[9px] font-bold text-gray-400 mt-1">YengaPay Live</p>
                    </div>
                    <div className="bg-white p-3.5 rounded-2xl border border-gray-100 shadow-3xs">
                      <span className="text-gray-400 text-[9px] font-extrabold uppercase tracking-wide block">Volume Remboursé</span>
                      <h3 className="text-[15px] font-black text-rose-600 mt-1 leading-none">
                        {yengaTransactions
                          .filter(t => t.status === 'refunded')
                          .reduce((sum, t) => sum + t.amount, 0)
                          .toLocaleString('fr-FR')} {currencySymbol}
                      </h3>
                      <p className="text-[9px] text-gray-450 font-bold mt-1">Désactivé</p>
                    </div>
                  </div>

                  {/* Actions Bar: Search, Status Filter and Exporter */}
                  <div className="bg-white rounded-2xl p-3 border border-gray-110 space-y-2.5 shadow-2xs">
                    <div className="flex justify-between items-center bg-gray-50 border border-gray-150 rounded-xl px-3 py-2 text-xs">
                      <Search className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                      <input 
                        type="text" 
                        placeholder="Rechercher réf, e-mail, id..."
                        className="flex-1 bg-transparent border-none outline-none text-gray-800 font-extrabold"
                        value={yengaSearch}
                        onChange={(e) => setYengaSearch(e.target.value)}
                      />
                      {yengaSearch && (
                        <button onClick={() => setYengaSearch('')} className="text-[10px] font-black text-gray-450 hover:text-black">X</button>
                      )}
                    </div>

                    {/* Status filtering tabs */}
                    <div className="flex bg-slate-100/80 p-0.5 rounded-lg text-[9px] font-black text-center overflow-x-auto no-scrollbar gap-0.5">
                      {['all', 'completed', 'pending', 'failed', 'refunded'].map((status) => (
                        <button
                          key={status}
                          onClick={() => setYengaStatusFilter(status)}
                          className={`flex-1 min-w-[50px] py-1 rounded-md transition-colors uppercase tracking-tight duration-150 ${
                            yengaStatusFilter === status 
                              ? 'bg-white text-gray-950 shadow-3xs' 
                              : 'text-gray-450 hover:text-gray-750'
                          }`}
                        >
                          {status === 'all' ? 'Tous' : status === 'completed' ? 'Validé' : status === 'pending' ? 'Attente' : status === 'failed' ? 'Échec' : 'Remboursé'}
                        </button>
                      ))}
                    </div>

                    {/* CSV Exporter trigger with real file generation */}
                    <button
                      onClick={() => {
                        try {
                          const csvContent = exportYengaTransactionsToCSV();
                          const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                          const url = URL.createObjectURL(blob);
                          const link = document.createElement('a');
                          link.setAttribute('href', url);
                          link.setAttribute('download', `dodo_yengapay_transactions_${Date.now()}.csv`);
                          document.body.appendChild(link);
                          link.click();
                          document.body.removeChild(link);
                          showToast("📁 Fichier CSV exporté avec succès !");
                        } catch (err) {
                          showToast("Erreur lors de l'export.");
                        }
                      }}
                      className="w-full py-2 bg-[#E52327] hover:bg-rose-700 text-white rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-sm"
                    >
                      <span>📥 Exporter les transactions (CSV)</span>
                    </button>
                  </div>

                  {/* Transactions dynamic render list */}
                  <div className="space-y-2">
                    <h3 className="text-gray-950 font-black text-[10px] uppercase tracking-wider flex justify-between items-center">
                      <span>Transactions YengaPay ({yengaTransactions.filter(t => {
                        const matchesSearch = t.reference.toLowerCase().includes(yengaSearch.toLowerCase()) || 
                                              t.user_id.toLowerCase().includes(yengaSearch.toLowerCase()) ||
                                              t.user_email.toLowerCase().includes(yengaSearch.toLowerCase()) ||
                                              t.payment_method.toLowerCase().includes(yengaSearch.toLowerCase());
                        const matchesFilter = yengaStatusFilter === 'all' ? true : t.status === yengaStatusFilter;
                        return matchesSearch && matchesFilter;
                      }).length})</span>
                      <button onClick={refreshYengaData} className="text-[#E52327] hover:underline font-black lowercase text-[10px]">rafraîchir</button>
                    </h3>

                    <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1 no-scrollbar">
                      {yengaTransactions
                        .filter(t => {
                          const matchesSearch = t.reference.toLowerCase().includes(yengaSearch.toLowerCase()) || 
                                                t.user_id.toLowerCase().includes(yengaSearch.toLowerCase()) ||
                                                t.user_email.toLowerCase().includes(yengaSearch.toLowerCase()) ||
                                                t.payment_method.toLowerCase().includes(yengaSearch.toLowerCase());
                          const matchesFilter = yengaStatusFilter === 'all' ? true : t.status === yengaStatusFilter;
                          return matchesSearch && matchesFilter;
                        })
                        .map(t => {
                          const isCompleted = t.status === 'completed';
                          const isFailed = t.status === 'failed';
                          const isRefunded = t.status === 'refunded';
                          
                          return (
                            <div key={t.id} className="bg-white rounded-2xl p-3 border border-gray-150 shadow-3xs space-y-2 text-left">
                              <div className="flex justify-between items-start text-xs">
                                <div>
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className="text-gray-950 font-black block text-[11px]">{t.reference}</span>
                                    <span className={`text-[8px] px-1.5 py-0.2 rounded font-black uppercase ${
                                      isCompleted ? 'bg-green-100 text-green-700' :
                                      isRefunded ? 'bg-purple-100 text-purple-700' :
                                      isFailed ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                                    }`}>
                                      {t.status}
                                    </span>
                                    {t.is_fraud_flagged && (
                                      <span className="bg-red-500 text-white text-[7px] px-1 py-0.2 rounded font-black tracking-widest uppercase animate-pulse">⚠️ ALERTE FRAUDE</span>
                                    )}
                                  </div>
                                  <span className="text-[9.5px] text-gray-500 font-extrabold max-w-[190px] block truncate">{t.user_email}</span>
                                  <span className="text-[8px] text-gray-400 block font-mono">Date : {new Date(t.created_at).toLocaleString('fr-FR', {hour: '2-digit', minute:'2-digit', second:'2-digit'})}</span>
                                </div>
                                <div className="text-right shrink-0">
                                  <span className="text-gray-950 font-black block text-xs">{t.amount.toLocaleString('fr-FR')} {currencySymbol}</span>
                                  <span className="text-[9px] bg-slate-100 text-slate-700 border border-slate-200 px-1.5 py-0.5 rounded-md font-extrabold mt-1 block max-w-[100px] truncate leading-none">
                                    {t.payment_method}
                                  </span>
                                </div>
                              </div>

                              {/* Footer row with order links and fast refund triggers (Audit 18) */}
                              <div className="pt-2 border-t border-gray-100 flex justify-between items-center text-[9px] font-bold">
                                <span className="text-gray-400">Services : <span className="text-gray-700 uppercase">{t.service_type}</span> ({t.service_id})</span>
                                
                                {isCompleted && (
                                  <button
                                    onClick={() => {
                                      if (window.confirm(`Rembourser totalement le client pour la transaction ${t.reference} (${t.amount} FCFA) ?`)) {
                                        const res = refundYengaTransaction(t.reference);
                                        showToast(res.message);
                                        refreshYengaData();
                                      }
                                    }}
                                    className="px-2 py-0.5 bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-700 rounded-md text-[9px] font-black uppercase tracking-wide transition-all"
                                  >
                                    💵 rembourser
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}

                      {yengaTransactions.filter(t => {
                        const matchesSearch = t.reference.toLowerCase().includes(yengaSearch.toLowerCase()) || 
                                              t.user_id.toLowerCase().includes(yengaSearch.toLowerCase()) ||
                                              t.user_email.toLowerCase().includes(yengaSearch.toLowerCase()) ||
                                              t.payment_method.toLowerCase().includes(yengaSearch.toLowerCase());
                        const matchesFilter = yengaStatusFilter === 'all' ? true : t.status === yengaStatusFilter;
                        return matchesSearch && matchesFilter;
                      }).length === 0 && (
                        <div className="text-center py-8 bg-white border border-gray-150 rounded-2xl">
                          <span className="text-xl">💳</span>
                          <p className="text-xs font-black text-gray-400 mt-1">Aucun mouvement trouvé pour cette sélection.</p>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}

              {/* ========================================================
                  YENGAPAY CONFIGURATION TAB (Audit 2, 20)
                  ======================================================== */}
              {paymentsTab === 'yengaconfig' && (
                <div className="space-y-4 text-left">
                  <div className="bg-gradient-to-br from-rose-900 to-rose-950 text-white p-4 rounded-2xl border border-rose-850 shadow-sm space-y-2">
                    <div className="flex justify-between items-center">
                      <h4 className="font-black text-[11px] uppercase tracking-wider">Gateway YengaPay Core (Burkina)</h4>
                      <span className="text-[7.5px] bg-[#E52327] px-1.5 py-0.5 rounded font-black uppercase">BF-API-Active</span>
                    </div>
                    <p className="text-[10px] text-rose-100 leading-snug">
                      YengaPay est la solution unique de routage Mobile Money (Orange Money, Moov Money, Wave, Telecel, Sank, Coris). Pour basculer instantanément en Sandbox ou configurer la signature HMAC SHA255, ajustez les variables ci-dessous.
                    </p>
                  </div>

                  <div className="bg-white rounded-2xl p-4 border border-gray-150 space-y-3 shadow-3xs">
                    <h3 className="text-gray-900 font-black text-xs flex items-center gap-1.5 border-b border-gray-100 pb-2">
                      ⚙️ PARAMÈTRES D'INTÉGRATION
                    </h3>

                    <div className="space-y-2 text-[11px]">
                      <div>
                        <label className="text-gray-400 font-black text-[9px] uppercase tracking-wide block mb-1">ID Marchand YengaPay</label>
                        <input 
                          type="text" 
                          className="w-full px-3 py-1.5 bg-slate-50 border border-gray-200 rounded-lg font-mono text-[10px]"
                          value={yengaLocalConfig.merchantId}
                          onChange={(e) => {
                            saveYengaConfig({ merchantId: e.target.value });
                            refreshYengaData();
                          }}
                        />
                      </div>

                      <div>
                        <label className="text-gray-400 font-black text-[9px] uppercase tracking-wide block mb-1">Clé API Privée (Secret API Key)</label>
                        <input 
                          type="password" 
                          className="w-full px-3 py-1.5 bg-slate-50 border border-gray-200 rounded-lg font-mono text-[10px]"
                          value={yengaLocalConfig.apiKey}
                          onChange={(e) => {
                            saveYengaConfig({ apiKey: e.target.value });
                            refreshYengaData();
                          }}
                        />
                      </div>

                      <div>
                        <label className="text-gray-400 font-black text-[9px] uppercase tracking-wide block mb-1">URL Webhook Callback</label>
                        <input 
                          type="text" 
                          className="w-full px-3 py-1.5 bg-slate-50 border border-gray-200 rounded-lg font-mono text-[10px]"
                          value={yengaLocalConfig.webhookUrl}
                          onChange={(e) => {
                            saveYengaConfig({ webhookUrl: e.target.value });
                            refreshYengaData();
                          }}
                        />
                      </div>

                      <div>
                        <label className="text-gray-400 font-black text-[9px] uppercase tracking-wide block mb-1">Clé de Signature HMAC Secret</label>
                        <input 
                          type="password" 
                          className="w-full px-3 py-1.5 bg-slate-50 border border-gray-200 rounded-lg font-mono text-[10px]"
                          value={yengaLocalConfig.hmacSecret}
                          onChange={(e) => {
                            saveYengaConfig({ hmacSecret: e.target.value });
                            refreshYengaData();
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Latency FINE-TUNER (Audit 20) */}
                  <div className="bg-white rounded-2xl p-4 border border-gray-150 space-y-3.5 shadow-3xs">
                    <h3 className="text-gray-900 font-black text-xs border-b border-gray-100 pb-2">
                      ⏱️ LATENCE & SIMULATION DE CONTEXTE
                    </h3>

                    <div className="space-y-3.5 text-xs">
                      <div className="flex justify-between items-center">
                        <span className="font-extrabold text-[11px] text-gray-700">Mode Sandbox (Test)</span>
                        <input 
                          type="checkbox"
                          className="w-4 h-4 accent-[#E52327] cursor-pointer"
                          checked={yengaLocalConfig.testMode}
                          onChange={(e) => {
                            saveYengaConfig({ testMode: e.target.checked });
                            refreshYengaData();
                            showToast(e.target.checked ? "Mode Sandbox Activé (Paiements Simulés)" : "Mode Live Activé (Connexions réelles requises)");
                          }}
                        />
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="font-extrabold text-[11px] text-gray-700">Contrôle HMAC Webhook</span>
                        <input 
                          type="checkbox"
                          className="w-4 h-4 accent-[#E52327] cursor-pointer"
                          checked={yengaLocalConfig.requireHmacVerification}
                          onChange={(e) => {
                            saveYengaConfig({ requireHmacVerification: e.target.checked });
                            refreshYengaData();
                            showToast(e.target.checked ? "Vérification HMAC activée" : "Vérification HMAC relâchée");
                          }}
                        />
                      </div>

                      <div className="space-y-1">
                        <div className="flex justify-between text-[11px] font-extrabold">
                          <span className="text-gray-700">Délai réseau simulé</span>
                          <span className="text-rose-600 font-black">{yengaLocalConfig.simulationDelay} s</span>
                        </div>
                        <input 
                          type="range" 
                          min="0" 
                          max="3" 
                          step="1"
                          className="w-full accent-[#E52327] cursor-pointer"
                          value={yengaLocalConfig.simulationDelay}
                          onChange={(e) => {
                            saveYengaConfig({ simulationDelay: Number(e.target.value) });
                            refreshYengaData();
                          }}
                        />
                        <span className="text-[9px] text-gray-400 block leading-tight">Idéal pour visualiser l'état de chargement en direct ("Loading Spinners") sans latence humaine forcée.</span>
                      </div>

                      <div className="flex justify-between items-center pt-2 border-t border-gray-50">
                        <div>
                          <span className="font-extrabold text-[11px] text-gray-700 block">Scénario de Délai d'attente (30s)</span>
                          <span className="text-[9px] text-rose-500 font-extrabold block">Simule un timeout de l'opérateur</span>
                        </div>
                        <input 
                          type="checkbox"
                          className="w-4 h-4 accent-[#E52327] cursor-pointer"
                          checked={yengaLocalConfig.simulateTimeout}
                          onChange={(e) => {
                            saveYengaConfig({ simulateTimeout: e.target.checked });
                            refreshYengaData();
                            showToast(e.target.checked ? "🕒 Scénario de Timeout (30s) Activé !" : "Scénario Timeout Désactivé");
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="bg-blue-50 border border-blue-100 p-3.5 rounded-2xl text-[9.5px] leading-relaxed text-blue-900 shadow-3xs">
                    <p className="font-black text-[10px] uppercase mb-1">💡 CODE SÉCURISÉ & CONSIGNES DISCOVERY</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>Orange Money / Telecel / Wave : Traitement direct en une étape, pas de saisie d'OTP obligatoire.</li>
                      <li>Moov Money / Sank / Coris : OTP simulé transmis en direct sur le téléphone d'entraînement.</li>
                    </ul>
                  </div>
                </div>
              )}

              {/* ========================================================
                  YENGAPAY WEBHOOKS LOGS & RETRY QUEUE TAB (Audit 16)
                  ======================================================== */}
              {paymentsTab === 'webhooks' && (
                <div className="space-y-4 text-left">
                  {/* Webhook Header and Cron actions */}
                  <div className="bg-white rounded-2xl p-4 border border-gray-150 space-y-3.5 shadow-3xs">
                    <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                      <h3 className="text-gray-900 font-black text-xs">
                        🔄 TRAITEMENT ASYNCHRONE DES REPRISES
                      </h3>
                      <span className="text-[9px] bg-amber-100 text-amber-700 px-1.5 rounded font-black">
                        {yengaRetryQueue.length} en attente
                      </span>
                    </div>

                    <p className="text-[10px] text-gray-500 leading-tight">
                      Si un serveur externe échoue à répondre lors de la notification (ex: coupure réseau, bug d'activation), notre file d'attente planifiée tente de re-notifier l'url webhook automatiquement (standard 5 min).
                    </p>

                    <button
                      onClick={() => {
                        const res = runCronWebhookRetryQueue();
                        refreshYengaData();
                        showToast(`🔄 Déclencheur Cron : ${res.replayed} inspectés, ${res.successes} résolus !`);
                      }}
                      className="w-full py-2 bg-[#E52327] hover:bg-rose-700 text-white rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2"
                    >
                      <span>⚡ Forcer l'Exécution du Cron de Reprise</span>
                    </button>
                  </div>

                  {/* SECURITY WARNING FLAGS (Audit 19) */}
                  {yengaSecurityLogs.length > 0 && (
                    <div className="bg-red-50 border border-red-150 p-3.5 rounded-2xl space-y-2.5 shadow-3xs">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm">🛡️</span>
                        <h4 className="font-black text-xs text-red-950 uppercase tracking-tight">LOGS DE SÉCURITÉ & ALIGNEMENT (FRAUDE)</h4>
                      </div>

                      <div className="space-y-1.5 max-h-[140px] overflow-y-auto pr-1 no-scrollbar text-[9px]">
                        {yengaSecurityLogs.map(l => (
                          <div key={l.id} className="p-2 bg-white rounded-lg border border-red-100 text-red-900 leading-normal">
                            <div className="flex justify-between font-black uppercase text-[8px] mb-0.5">
                              <span className="text-red-700">{l.type.replace(/_/g, ' ')}</span>
                              <span className="text-gray-400 font-mono">{new Date(l.timestamp).toLocaleTimeString()}</span>
                            </div>
                            <p className="font-semibold text-gray-850 leading-tight">{l.message}</p>
                            <span className="block font-mono text-gray-400 text-[7px] mt-0.5">IP : {l.ip} | User : {l.user_id}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Webhooks history logs (Audit 6, 8, 16) */}
                  <div className="space-y-2">
                    <h3 className="text-gray-900 font-black text-[10px] uppercase tracking-wider flex justify-between items-center">
                      <span>Historique Webhooks ({yengaWebhooks.length})</span>
                      <button onClick={refreshYengaData} className="text-[#E52327] hover:underline font-black text-[10px]">rafraîchir</button>
                    </h3>

                    <div className="space-y-2 max-h-[280px] overflow-y-auto no-scrollbar">
                      {yengaWebhooks.map(wh => {
                        const isSuccess = wh.status === 'success';
                        return (
                          <div key={wh.id} className="bg-white rounded-2xl p-3 border border-gray-150 shadow-3xs space-y-2">
                            <div className="flex justify-between items-center text-xs">
                              <span className="font-mono text-[9px] text-gray-450">{new Date(wh.timestamp).toLocaleTimeString()}</span>
                              <span className={`text-[8px] px-1.5 py-0.2 rounded font-black uppercase ${
                                isSuccess ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                              }`}>
                                {isSuccess ? '200 OK' : '500 ERR'}
                              </span>
                            </div>

                            <div className="text-[9px] font-mono bg-slate-50 p-2 rounded-lg text-gray-700 leading-tight border border-gray-200">
                              <p className="font-semibold text-blue-800"><span className="text-gray-450">REF:</span> {wh.transaction_ref}</p>
                              <p className="font-semibold"><span className="text-gray-450">SIGN:</span> {wh.signature.substring(0, 24)}...</p>
                              <p className="font-semibold mt-1 text-gray-800"><span className="text-gray-450">PAYLOAD:</span> {JSON.stringify(wh.payload)}</p>
                              {wh.error && <p className="font-bold text-red-650 mt-1"><span className="text-gray-450">ERR:</span> {wh.error}</p>}
                            </div>

                            {/* REPLAY BUTTON (Audit 16 re-playability!) */}
                            <div className="flex justify-end pt-1">
                              <button
                                onClick={async () => {
                                  try {
                                    wh.status = 'success'; // Reset locally as indicator
                                    wh.error = undefined;
                                    // Trigger immediate reprocess
                                    const txsList = getYengaTransactions();
                                    const tx = txsList.find(t => t.reference === wh.transaction_ref);
                                    if (tx) {
                                      tx.status = 'completed';
                                      tx.service_activated = true;
                                      saveYengaTransactions(txsList);
                                    }
                                    
                                    // Re-run
                                    const webhooks = getYengaWebhooks();
                                    const matchIdx = webhooks.findIndex(w => w.id === wh.id);
                                    if (matchIdx !== -1) {
                                      webhooks[matchIdx] = {
                                        ...wh,
                                        status: 'success',
                                        timestamp: new Date().toISOString(),
                                        retry_count: wh.retry_count + 1
                                      };
                                      saveYengaWebhooks(webhooks);
                                    }
                                    
                                    showToast("✓ Webhook simulé et récurrence d'activation de service traités.");
                                    refreshYengaData();
                                  } catch (err) {
                                    showToast("Erreur lors du replay.");
                                  }
                                }}
                                className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-250 rounded-md text-[8.5px] font-black uppercase tracking-wide transition-all"
                              >
                                🔄 Rejouer le Webhook
                              </button>
                            </div>
                          </div>
                        );
                      })}

                      {yengaWebhooks.length === 0 && (
                        <div className="text-center py-6 bg-white border border-gray-150 rounded-2xl">
                          <p className="text-[10px] font-black text-gray-400">Aucun log de webhook de transmission collecté.</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {paymentsTab === 'reversements' && (
                <div className="space-y-3">
                  {/* Stats specifically calculated for reversements */}
                  <div className="grid grid-cols-2 gap-3 shrink-0">
                    <div className="bg-white p-3.5 rounded-2xl border border-gray-100 shadow-3xs">
                      <span className="text-gray-400 text-[9px] font-extrabold uppercase tracking-wide block">Restaurateurs Payés</span>
                      <h3 className="text-xs font-black text-gray-950 mt-1 leading-none">
                        {adminReversements
                          .filter(r => r.type === 'vendeur' && r.status === 'effectué')
                          .reduce((sum, r) => sum + r.amount, 0)
                          .toLocaleString('fr-FR')} FCFA
                      </h3>
                      <p className="text-[9.5px] font-bold text-green-600 mt-1 flex items-center gap-0.5">✓ Liquidés</p>
                    </div>

                    <div className="bg-white p-3.5 rounded-2xl border border-gray-100 shadow-3xs">
                      <span className="text-gray-400 text-[9px] font-extrabold uppercase tracking-wide block font-sans">Livreurs Payés</span>
                      <h3 className="text-xs font-black text-gray-950 mt-1 leading-none">
                        {adminReversements
                          .filter(r => r.type === 'livreur' && r.status === 'effectué')
                          .reduce((sum, r) => sum + r.amount, 0)
                          .toLocaleString('fr-FR')} FCFA
                      </h3>
                      <p className="text-[9.5px] font-bold text-green-600 mt-1 flex items-center gap-0.5">✓ Liquidés</p>
                    </div>
                  </div>

                  <div className="bg-white p-3 px-4 rounded-xl border border-gray-100 shadow-3xs">
                    <div className="flex justify-between items-center text-xs font-bold">
                      <span className="text-gray-500 font-black">Total en attente de reversement :</span>
                      <span className="text-[#E52327] font-black text-sm">
                        {adminReversements
                          .filter(r => r.status === 'en_attente')
                          .reduce((sum, r) => sum + r.amount, 0)
                          .toLocaleString('fr-FR')} FCFA
                      </span>
                    </div>
                  </div>

                  {/* Filters search and tabs */}
                  <div className="space-y-2">
                    {/* Search Input */}
                    <div className="bg-white border border-gray-150 rounded-xl px-3 py-2 flex items-center gap-2 text-xs">
                      <Search className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                      <input 
                        type="text" 
                        placeholder="Rechercher par bénéficiaire..."
                        className="flex-1 bg-transparent border-none outline-none text-gray-800 font-bold"
                        value={driverSearch}
                        onChange={(e) => setDriverSearch(e.target.value)}
                      />
                    </div>

                    {/* Filter Tabs (Tous, Effectués, En attente) */}
                    <div className="flex bg-gray-150/50 p-1 rounded-xl">
                      {(['tous', 'effectué', 'en_attente'] as const).map((st) => (
                        <button
                          key={st}
                          onClick={() => setRevTab(st)}
                          className={`flex-1 text-[10px] font-black py-1.5 rounded-lg capitalize transition-colors ${
                            revTab === st ? 'bg-white text-gray-950 shadow-3xs' : 'text-gray-400 hover:text-gray-650'
                          }`}
                        >
                          {st === 'en_attente' ? 'En attente' : st === 'effectué' ? 'Effectués' : 'Tous'}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Reversements List */}
                  <div className="space-y-2.5">
                    <h3 className="text-[10px] text-gray-400 font-black uppercase tracking-wider font-sans">
                      Détail des reversements ({revTab === 'tous' ? 'tous' : revTab})
                    </h3>
                    
                    {adminReversements
                      .filter(r => {
                        const matchesSearch = r.recipient.toLowerCase().includes(driverSearch.toLowerCase());
                        const matchesStatus = revTab === 'tous' ? true : r.status === revTab;
                        return matchesSearch && matchesStatus;
                      })
                      .map(r => (
                        <div key={r.id} className="bg-white rounded-2xl p-3.5 border border-gray-150/70 shadow-2xs space-y-2.5 transition-all">
                          <div className="flex justify-between items-start">
                            <div className="space-y-1">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className={`text-[9px] px-1.5 py-0.2 rounded font-black uppercase ${
                                  r.type === 'vendeur' ? 'bg-amber-50 text-amber-600 border border-amber-100' : 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                                }`}>
                                  {r.type === 'vendeur' ? '🍳 Vendeur' : '🏍️ Livreur'}
                                </span>
                                <span className="text-[9.5px] text-gray-400 font-mono font-bold flex items-center gap-1">
                                  <Clock className="w-2.5 h-2.5 shrink-0 text-gray-300" /> {r.date}
                                </span>
                              </div>
                              <h4 className="text-[13px] font-black text-gray-950 truncate max-w-[170px]">{r.recipient}</h4>
                            </div>
                            
                            <div className="text-right shrink-0">
                              <span className="text-gray-950 font-black block text-xs">{r.amount.toLocaleString('fr-FR')} {currencySymbol}</span>
                              <span className={`inline-flex items-center gap-1 px-1.5 py-0.2 mt-1 rounded-full text-[8.5px] font-black border uppercase tracking-wider ${
                                r.status === 'effectué' 
                                  ? 'bg-green-50 text-green-700 border-green-150' 
                                  : 'bg-amber-50 text-amber-705 border-amber-150'
                              }`}>
                                {r.status === 'effectué' ? (
                                  <>
                                    <Check className="w-2.5 h-2.5 stroke-[3]" /> Effectué
                                  </>
                                ) : (
                                  <>
                                    <Clock className="w-2.5 h-2.5 animate-pulse" /> En attente
                                  </>
                                )}
                              </span>
                            </div>
                          </div>

                          {/* Quick action button to process payout */}
                          <div className="pt-2 border-t border-gray-100 flex justify-between items-center text-[9.5px]">
                            <span className="text-gray-400 font-bold truncate max-w-[140px]">
                              {r.status === 'effectué' ? 'Virement liquidé par Mobile Money' : 'Virement opérateur requis'}
                            </span>
                            <button
                              onClick={() => toggleReversementStatus(r.id)}
                              className={`px-2.5 py-1 text-[9px] font-black rounded-lg uppercase tracking-wide transition shadow-3xs border ${
                                r.status === 'effectué'
                                  ? 'bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100' 
                                  : 'bg-[#E52327] border-red-500 hover:bg-red-700 text-white active:scale-95'
                              }`}
                            >
                              {r.status === 'effectué' ? 'Annuler' : 'Payer'}
                            </button>
                          </div>
                        </div>
                      ))
                    }

                    {adminReversements.filter(r => {
                      const matchesSearch = r.recipient.toLowerCase().includes(driverSearch.toLowerCase());
                      const matchesStatus = revTab === 'tous' ? true : r.status === revTab;
                      return matchesSearch && matchesStatus;
                    }).length === 0 && (
                      <div className="text-center py-8 text-gray-400">
                        <span className="text-2xl block mb-1">💸</span>
                        <p className="text-xs font-bold">Aucun virement trouvé</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {paymentsTab === 'retraits' && (
                <div className="space-y-3">
                  <div className="bg-white p-4 rounded-3xl border border-gray-100 shadow-3xs space-y-2">
                    <span className="text-gray-400 text-[10px] font-extrabold uppercase tracking-wide block font-sans">Seuil de Retrait Minimum (Livreurs)</span>
                    <p className="text-xs font-semibold text-gray-500">Les livreurs peuvent effectuer une demande de retrait dès 5 000 FCFA accumulés sur leur portefeuille Dodo.</p>
                  </div>

                  <div className="space-y-2.5">
                    <h3 className="text-gray-950 font-black text-[11px] uppercase tracking-wider font-sans">Demandes de retraits récentes</h3>
                    
                    {/* Mock withdrawal 1 */}
                    <div className="bg-white rounded-2xl p-3.5 border border-gray-100 shadow-3xs flex justify-between items-center text-xs font-bold">
                      <div className="space-y-1">
                        <span className="text-gray-950 font-black block">Retrait Wave</span>
                        <span className="text-gray-500 font-bold block text-[11px]">Ibrahim Ouédraogo (+226 78 90 12 34)</span>
                        <span className="text-[10px] text-gray-400 font-mono">Hier, 18:45</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[#E52327] font-black text-sm block">15 000 FCFA</span>
                        <span className="text-[9.5px] bg-red-50 text-red-650 px-1.5 py-0.2 rounded-full uppercase leading-none font-black font-sans">Suspendu (Kyc requis)</span>
                      </div>
                    </div>

                    {/* Mock withdrawal 2 */}
                    <div className="bg-white rounded-2xl p-3.5 border border-gray-100 shadow-3xs flex justify-between items-center text-xs font-bold">
                      <div className="space-y-1">
                        <span className="text-gray-950 font-black block">Retrait Orange Money</span>
                        <span className="text-gray-550 block font-bold text-[11px]">Awa Kaboré (+226 65 43 21 09)</span>
                        <span className="text-[10px] text-gray-400 font-mono">20 mai, 14:00</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[#E52327] font-black text-sm block">8 500 {currencySymbol}</span>
                        <span className="text-[9.5px] bg-green-50 text-green-700 px-1.5 py-0.2 rounded-full uppercase leading-none font-black font-sans font-bold">Réussi ✓</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>
        )}

        {/* =======================================================
            SCREEN 6: GESTION DES UTILISATEURS
            ======================================================= */}
        {adminScreen === 6 && (
          <div className="flex-1 flex flex-col bg-slate-50 overflow-hidden pb-[70px]">
            {/* Header */}
            <div className="bg-white border-b border-gray-150 shrink-0">
              <div className="px-5 pt-3 pb-2 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className="p-1 text-sm bg-red-50 rounded">👤</span>
                  <h1 className="text-[17px] font-black text-gray-950">Gestion des utilisateurs</h1>
                </div>
                <button onClick={() => showToast("Ajouter un utilisateur...")} className="text-[#E52327] font-black text-xs uppercase leading-none">Ajouter</button>
              </div>

              {/* Categorization tab row */}
              <div className="flex text-xs font-bold border-t border-gray-100">
                <button 
                  onClick={() => setUsersTab('clients')}
                  className={`flex-1 py-3 text-center transition-all relative ${usersTab === 'clients' ? 'text-[#E52327] font-black' : 'text-gray-400'}`}
                >
                  Clients (1250)
                  {usersTab === 'clients' && <div className="absolute bottom-0 inset-x-0 h-0.5 bg-[#E52327]" />}
                </button>
                <button 
                  onClick={() => setUsersTab('vendeurs')}
                  className={`flex-1 py-3 text-center transition-all relative ${usersTab === 'vendeurs' ? 'text-[#E52327] font-black' : 'text-gray-400'}`}
                >
                  Vendeurs (156)
                  {usersTab === 'vendeurs' && <div className="absolute bottom-0 inset-x-0 h-0.5 bg-[#E52327]" />}
                </button>
                <button 
                  onClick={() => setUsersTab('livreurs')}
                  className={`flex-1 py-3 text-center transition-all relative ${usersTab === 'livreurs' ? 'text-[#E52327] font-black' : 'text-gray-400'}`}
                >
                  Livreurs (320)
                  {usersTab === 'livreurs' && <div className="absolute bottom-0 inset-x-0 h-0.5 bg-[#E52327]" />}
                </button>
              </div>
            </div>

            {/* List with items */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3.5 no-scrollbar">
              
              <div className="bg-white border border-gray-150 rounded-xl px-3 py-2 flex items-center gap-2 text-xs">
                <Search className="w-4 h-4 text-gray-400 shrink-0" />
                <input 
                  type="text" 
                  value={userSearch} 
                  onChange={(e) => setUserSearch(e.target.value)} 
                  placeholder="Filtrer par nom ou email..." 
                  className="flex-1 bg-transparent border-none outline-none text-gray-800"
                />
              </div>

              <div className="space-y-2.5">
                {/* Mock user items matching layout 6 */}
                <div className="bg-white rounded-2xl p-3.5 border border-gray-100 shadow-3xs flex justify-between items-center text-xs font-bold">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-md">👤</div>
                    <div className="space-y-0.5">
                      <h4 className="text-gray-950 font-black">Moussa Traoré</h4>
                      <p className="text-[10px] text-gray-400">moussa.t@gmail.com</p>
                      <p className="text-[10px] text-gray-550 font-mono font-medium mt-0.5">+226 70 12 34 56</p>
                    </div>
                  </div>
                  <span className="bg-green-15 text-green-700 text-[9px] uppercase px-2 py-0.5 rounded-full font-black">Client</span>
                </div>

                <div className="bg-white rounded-2xl p-3.5 border border-gray-100 shadow-3xs flex justify-between items-center text-xs font-bold">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center text-md">👩‍🦰</div>
                    <div className="space-y-0.5">
                      <h4 className="text-gray-950 font-black">Awa Kaboré</h4>
                      <p className="text-[10px] text-gray-400">awa.k@gmail.com</p>
                      <p className="text-[10px] text-gray-550 font-mono font-medium mt-0.5">+226 65 43 21 09</p>
                    </div>
                  </div>
                  <span className="bg-green-15 text-green-700 text-[9px] uppercase px-2 py-0.5 rounded-full font-black">Client</span>
                </div>

                <div className="bg-white rounded-2xl p-3.5 border border-gray-100 shadow-3xs flex justify-between items-center text-xs font-bold">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-md">🍲</div>
                    <div className="space-y-0.5">
                      <h4 className="text-gray-950 font-black">Maquis Chez Fatou</h4>
                      <p className="text-[10px] text-gray-400">fatou@maquis.com</p>
                      <p className="text-[10px] text-gray-550 font-mono font-medium mt-0.5">+226 70 11 22 33</p>
                    </div>
                  </div>
                  <span className="bg-indigo-50 text-indigo-700 text-[9px] uppercase px-2 py-0.5 rounded-full font-black">Vendeur</span>
                </div>

                <div className="bg-white rounded-2xl p-3.5 border border-gray-100 shadow-3xs flex justify-between items-center text-xs font-bold">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-md">🥩</div>
                    <div className="space-y-0.5">
                      <h4 className="text-gray-950 font-black">Le Bon Goût</h4>
                      <p className="text-[10px] text-gray-400">bongo@restaurant.com</p>
                      <p className="text-[10px] text-gray-550 font-mono font-medium mt-0.5">+226 70 22 33 44</p>
                    </div>
                  </div>
                  <span className="bg-indigo-50 text-indigo-700 text-[9px] uppercase px-2 py-0.5 rounded-full font-black">Vendeur</span>
                </div>

                <div className="bg-white rounded-2xl p-3.5 border border-gray-100 shadow-3xs flex justify-between items-center text-xs font-bold">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-md">🏍️</div>
                    <div className="space-y-0.5">
                      <h4 className="text-gray-950 font-black">Blaise K.</h4>
                      <p className="text-[10px] text-gray-400">blaise.k@gmail.com</p>
                      <p className="text-[10px] text-gray-550 font-mono font-medium mt-0.5">+226 70 12 34 56</p>
                    </div>
                  </div>
                  <span className="bg-amber-100 text-amber-700 text-[9px] uppercase px-2 py-0.5 rounded-full font-black">Livreur</span>
                </div>

              </div>
            </div>
          </div>
        )}

        {/* =======================================================
            SCREEN 7: SIGNALEMENTS ET LITIGES
            ======================================================= */}
        {adminScreen === 7 && (
          <div className="flex-1 flex flex-col bg-slate-50 overflow-hidden pb-[70px]">
            {/* Header */}
            <div className="bg-white border-b border-gray-150 shrink-0">
              <div className="px-5 pt-3 pb-2 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className="p-1 text-sm bg-red-100 rounded">🚨</span>
                  <h1 className="text-[16px] font-black text-gray-950">Signalements et litiges</h1>
                </div>
                <button onClick={() => showToast("Litiges résolus effacés...")} className="text-gray-400 font-bold text-[10px] uppercase">Vider les résolus</button>
              </div>

              {/* Sub-tabs row */}
              <div className="flex text-xs font-bold border-t border-gray-100">
                <button 
                  onClick={() => setLitigesTab('tous')}
                  className={`flex-1 py-3 text-center transition-all relative ${litigesTab === 'tous' ? 'text-[#E52327] font-black' : 'text-gray-400'}`}
                >
                  Tous (15)
                  {litigesTab === 'tous' && <div className="absolute bottom-0 inset-x-0 h-0.5 bg-[#E52327]" />}
                </button>
                <button 
                  onClick={() => setLitigesTab('en_cours')}
                  className={`flex-1 py-3 text-center transition-all relative ${litigesTab === 'en_cours' ? 'text-[#E52327] font-black' : 'text-gray-400'}`}
                >
                  En cours (7)
                  {litigesTab === 'en_cours' && <div className="absolute bottom-0 inset-x-0 h-0.5 bg-[#E52327]" />}
                </button>
                <button 
                  onClick={() => setLitigesTab('resolus')}
                  className={`flex-1 py-3 text-center transition-all relative ${litigesTab === 'resolus' ? 'text-[#E52327] font-black' : 'text-gray-400'}`}
                >
                  Résolus (8)
                  {litigesTab === 'resolus' && <div className="absolute bottom-0 inset-x-0 h-0.5 bg-[#E52327]" />}
                </button>
              </div>
            </div>

            {/* List with treat litiges buttons matches pixel Mockup 7 exactly */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3.5 no-scrollbar">
              
              <div className="space-y-3">
                {adminLitiges
                  .filter(l => litigesTab === 'tous' || l.status === litigesTab)
                  .map((lit) => (
                    <div key={lit.id} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-2xs space-y-3 font-bold text-xs">
                      
                      {/* Top bar with alert type */}
                      <div className="flex justify-between items-start">
                        <div className="space-y-0.5">
                          <h4 className="text-[13px] font-black text-gray-950 flex items-center gap-1.5">
                            <span className="text-red-500">🚨</span> {lit.title}
                          </h4>
                          <p className="text-red-650 text-[11px] font-extrabold">{lit.desc}</p>
                        </div>
                        <span className={`text-[8.5px] px-2 py-0.5 rounded font-black uppercase ${
                          lit.status === 'en_cours' ? 'bg-amber-55 text-amber-700' : lit.status === 'nouveau' ? 'bg-red-50 text-red-600' : 'bg-gray-100 text-gray-600'
                        }`}>
                          {lit.status === 'en_cours' ? 'En cours' : lit.status === 'nouveau' ? 'Nouveau' : 'Résolu'}
                        </span>
                      </div>

                      {/* Middle feedback and date metadata */}
                      <div className="bg-gray-50 p-2.5 rounded-xl border border-gray-100/60 text-[11px] text-gray-600 font-medium leading-normal">
                        <p>{lit.reporter}</p>
                        <p className="text-[10px] text-gray-400 font-mono mt-0.5">{lit.date}</p>
                      </div>

                      {/* Bottom action bar */}
                      <div className="flex gap-2 justify-end pt-1">
                        <button 
                          onClick={() => showToast(`Détails: ${lit.desc} signalé par l'utilisateur. Enquête en cours.`)}
                          className="px-3 py-1.5 bg-[#F3F4F6] hover:bg-gray-200 text-gray-650 rounded-lg text-[10px] font-extrabold uppercase transition"
                        >
                          Voir détails
                        </button>
                        {lit.status !== 'resolus' && (
                          <button 
                            onClick={() => updateLitigeStatus(lit.id, 'resolus')}
                            className="px-3 py-1.5 bg-[#E52327] hover:bg-red-700 text-white rounded-lg text-[10px] font-black uppercase tracking-wide transition"
                          >
                            Traiter
                          </button>
                        )}
                      </div>

                    </div>
                ))}
              </div>

            </div>
          </div>
        )}

        {/* =======================================================
            SCREEN 8: SYSTEM CONFIGURATION (ZERO-CODE SETUP CENTER)
            ======================================================= */}
        {adminScreen === 8 && (
          <div className="flex-1 flex flex-col bg-white overflow-hidden pb-[70px]">
            {/* Header */}
            <div className="px-5 pt-3 pb-3 flex justify-between items-center bg-white border-b border-gray-150 shrink-0">
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setDriverScreen(1)}
                  className="p-1 text-gray-500 hover:text-gray-950 font-bold"
                >
                  <ArrowLeft className="w-5 h-5 text-gray-700" />
                </button>
                <h1 className="text-[13.5px] font-black text-gray-950">Configuration de la Stack</h1>
              </div>
              <button 
                onClick={() => {
                  if (window.confirm("Réinitialiser toutes les clés et paramètres d'API ?")) {
                    setSupabaseUrl('');
                    setSupabaseAnonKey('');
                    setGeminiApiKey('');
                    setResendApiKey('');
                    setBrevoSmtpKey('');
                    setBrevoSenderEmail('contact@dodo-livraison.bf');
                    setBaseDeliveryFee(500);
                    setAvgPrepTime('20-30 min');
                    useAppStore.getState().resetConfig();
                    showToast("Configurations système réinitialisées !");
                  }
                }}
                className="text-xs text-rose-600 font-extrabold flex items-center gap-1 hover:underline"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Réinit.
              </button>
            </div>

            {/* Config scroll content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar bg-slate-50 text-[12px]">
              
              <div className="p-3 bg-rose-50 border border-rose-100 rounded-2xl flex gap-2 text-rose-900 leading-normal select-none">
                <ShieldAlert className="w-5 h-5 shrink-0 text-[#E52327] mt-[2px]" />
                <div>
                  <p className="font-extrabold text-[10.5px]">PANNEAU D'ADMINISTRATION CENTRAL</p>
                  <p className="text-[10px] text-rose-700/90 leading-tight">Sauvegardez ici vos clés d'API et variables d'intégration. Tout est sauvegardé localement d'une manière sécurisée et injecté directement dans votre stack à la volée.</p>
                </div>
              </div>

              {/* SECTION: Supabase settings */}
              <div className="bg-white rounded-2xl p-4 border border-gray-110 space-y-3 shadow-2xs">
                <div className="flex justify-between items-center">
                  <h3 className="font-black text-gray-950 flex items-center gap-1.5"><Building className="w-4 h-4 text-[#E52327]" /> Connexion Supabase</h3>
                  <span className={`text-[8px] px-1.5 py-0.2 rounded font-black uppercase ${supabaseUrl && supabaseAnonKey ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                    {supabaseUrl && supabaseAnonKey ? 'Connecté ✓' : 'Local Fallback'}
                  </span>
                </div>

                <div className="space-y-2">
                  <div>
                    <label className="text-gray-500 font-black text-[9.5px] uppercase block mb-1">URL du projet Supabase</label>
                    <input 
                      type="text"
                      className={`w-full px-3 py-2 bg-slate-50 border rounded-xl font-mono text-[10.5px] outline-none text-gray-800 ${formErrors.supabaseUrl ? 'border-red-500 bg-red-50/20' : 'border-gray-200 focus:border-red-400'}`}
                      placeholder="https://yourproject.supabase.co"
                      value={supabaseUrl}
                      onChange={(e) => {
                        setSupabaseUrl(e.target.value);
                        setFormErrors(prev => ({ ...prev, supabaseUrl: '' }));
                      }}
                    />
                    {formErrors.supabaseUrl && <span className="text-red-500 text-[9px] font-bold block mt-0.5">{formErrors.supabaseUrl}</span>}
                  </div>

                  <div>
                    <label className="text-gray-500 font-black text-[9.5px] uppercase block mb-1">Clé Publique Anon Supabase</label>
                    <input 
                      type="password"
                      className={`w-full px-3 py-2 bg-slate-50 border rounded-xl font-mono text-[10.5px] outline-none text-gray-800 ${formErrors.supabaseAnonKey ? 'border-red-500 bg-red-50/20' : 'border-gray-200 focus:border-red-400'}`}
                      placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                      value={supabaseAnonKey}
                      onChange={(e) => {
                        setSupabaseAnonKey(e.target.value);
                        setFormErrors(prev => ({ ...prev, supabaseAnonKey: '' }));
                      }}
                    />
                    {formErrors.supabaseAnonKey && <span className="text-red-500 text-[9px] font-bold block mt-0.5">{formErrors.supabaseAnonKey}</span>}
                  </div>
                </div>
              </div>

              {/* SECTION: Email Resend/Brevo API keys */}
              <div className="bg-white rounded-2xl p-4 border border-gray-110 space-y-3 shadow-2xs">
                <h3 className="font-black text-gray-950 flex items-center gap-1.5"><Mail className="w-4 h-4 text-[#E52327]" /> Services Messagerie (Mailing)</h3>

                <div className="space-y-2">
                  <div>
                    <label className="text-gray-500 font-black text-[9.5px] uppercase block mb-1">Clé API Resend (Resend API Key)</label>
                    <input 
                      type="text"
                      className={`w-full px-3 py-2 bg-slate-50 border rounded-xl font-mono text-[10.5px] outline-none text-gray-800 ${formErrors.resendApiKey ? 'border-red-500 bg-red-50/20' : 'border-gray-200 focus:border-red-400'}`}
                      placeholder="re_abcdefgh..."
                      value={resendApiKey}
                      onChange={(e) => {
                        setResendApiKey(e.target.value);
                        setFormErrors(prev => ({ ...prev, resendApiKey: '' }));
                      }}
                    />
                    {formErrors.resendApiKey && <span className="text-red-500 text-[9px] font-bold block mt-0.5">{formErrors.resendApiKey}</span>}
                  </div>

                  <div>
                    <label className="text-gray-500 font-black text-[9.5px] uppercase block mb-1">Clé SMTP Brevo (Brevo SMTP Key)</label>
                    <input 
                      type="password"
                      className={`w-full px-3 py-2 bg-slate-50 border rounded-xl font-mono text-[10.5px] outline-none text-gray-800 ${formErrors.brevoSmtpKey ? 'border-red-500 bg-red-50/20' : 'border-gray-200 focus:border-red-400'}`}
                      placeholder="xkeysib-..."
                      value={brevoSmtpKey}
                      onChange={(e) => {
                        setBrevoSmtpKey(e.target.value);
                        setFormErrors(prev => ({ ...prev, brevoSmtpKey: '' }));
                      }}
                    />
                    {formErrors.brevoSmtpKey && <span className="text-red-500 text-[9px] font-bold block mt-0.5">{formErrors.brevoSmtpKey}</span>}
                  </div>

                  <div>
                    <label className="text-gray-500 font-black text-[9.5px] uppercase block mb-1">Expéditeur Email d'envoi (SMTP)</label>
                    <input 
                      type="text"
                      className={`w-full px-3 py-2 bg-slate-50 border rounded-xl font-mono text-[10.5px] outline-none text-gray-800 ${formErrors.brevoSenderEmail ? 'border-red-500 bg-red-50/20' : 'border-gray-200 focus:border-red-400'}`}
                      placeholder="votre@email.com"
                      value={brevoSenderEmail}
                      onChange={(e) => {
                        setBrevoSenderEmail(e.target.value);
                        setFormErrors(prev => ({ ...prev, brevoSenderEmail: '' }));
                      }}
                    />
                    {formErrors.brevoSenderEmail && <span className="text-red-500 text-[9px] font-bold block mt-0.5">{formErrors.brevoSenderEmail}</span>}
                  </div>
                </div>
              </div>

              {/* SECTION: Gemini API key settings */}
              <div className="bg-white rounded-2xl p-4 border border-gray-110 space-y-3 shadow-2xs">
                <h3 className="font-black text-gray-950 flex items-center gap-1.5"><RefreshCw className="w-4 h-4 text-purple-600" /> IA & Modèle (Gemini Key)</h3>
                
                <div>
                  <label className="text-gray-500 font-black text-[9.5px] uppercase block mb-1">Clé Secrète Gemini API Key</label>
                  <input 
                    type="password"
                    className={`w-full px-3 py-2 bg-slate-50 border rounded-xl font-mono text-[10.5px] outline-none text-gray-800 ${formErrors.geminiApiKey ? 'border-red-500 bg-red-50/20' : 'border-gray-200 focus:border-red-400'}`}
                    placeholder="AIzaSy..."
                    value={geminiApiKey}
                    onChange={(e) => {
                      setGeminiApiKey(e.target.value);
                      setFormErrors(prev => ({ ...prev, geminiApiKey: '' }));
                    }}
                  />
                  {formErrors.geminiApiKey && <span className="text-red-500 text-[9px] font-bold block mt-0.5">{formErrors.geminiApiKey}</span>}
                </div>
              </div>

              {/* SECTION: System factors (Delivery fees, averages) */}
              <div className="bg-white rounded-2xl p-4 border border-gray-110 space-y-3 shadow-2xs">
                <h3 className="font-black text-gray-950 flex items-center gap-1.5"><DollarSign className="w-4 h-4 text-green-650" /> Paramètres d'Ajustement d'activité</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-gray-500 font-black text-[9.5px] uppercase block mb-1">Frais livraison (FCFA)</label>
                    <input 
                      type="number"
                      className="w-full px-3 py-2 bg-slate-50 border border-gray-250 rounded-xl outline-none text-gray-800 text-[11px]"
                      value={baseDeliveryFee}
                      onChange={(e) => setBaseDeliveryFee(Number(e.target.value))}
                    />
                  </div>

                  <div>
                    <label className="text-gray-500 font-black text-[9.5px] uppercase block mb-1">Préparation moy.</label>
                    <input 
                      type="text"
                      className="w-full px-3 py-2 bg-slate-50 border border-gray-250 rounded-xl outline-none text-gray-800 text-[11px]"
                      value={avgPrepTime}
                      onChange={(e) => setAvgPrepTime(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* NEW SECTION: Appearance & Branding (Branding et Marque) */}
              <div className="bg-white rounded-2xl p-4 border border-gray-110 space-y-3 shadow-2xs">
                <h3 className="font-black text-gray-950 flex items-center gap-1.5"><Building className="w-4 h-4 text-[#E52327]" /> Marque & Design</h3>
                
                <div className="space-y-3">
                  <div>
                    <label className="text-gray-500 font-black text-[9.5px] uppercase block mb-1">Nom de l'application</label>
                    <input 
                      type="text"
                      className={`w-full px-3 py-2 bg-slate-50 border rounded-xl font-bold text-[11px] outline-none text-gray-800 ${formErrors.appName ? 'border-red-500 bg-red-50/20' : 'border-gray-200 focus:border-red-400'}`}
                      placeholder="Dodo Livraison"
                      value={appName}
                      onChange={(e) => {
                        setAppName(e.target.value);
                        setFormErrors(prev => ({ ...prev, appName: '' }));
                      }}
                    />
                    {formErrors.appName && <span className="text-red-500 text-[9px] font-bold block mt-0.5">{formErrors.appName}</span>}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-gray-500 font-black text-[9.5px] uppercase block mb-1">Couleur primaire (Hex)</label>
                      <div className="relative flex items-center bg-slate-50 border border-gray-200 rounded-xl overflow-hidden shadow-2xs">
                        <div className="absolute left-2 w-5 h-5 rounded-md border border-gray-200 overflow-hidden flex items-center justify-center shrink-0">
                          <input 
                            type="color"
                            className="w-10 h-10 rounded-full cursor-pointer border-0 p-0 transform scale-150"
                            value={primaryColor}
                            onChange={(e) => setPrimaryColor(e.target.value)}
                          />
                        </div>
                        <input 
                          type="text"
                          className="w-full pl-9 pr-2 py-2 bg-transparent border-0 outline-none text-[11px] font-mono text-gray-800 font-bold"
                          value={primaryColor}
                          onChange={(e) => setPrimaryColor(e.target.value)}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-gray-500 font-black text-[9.5px] uppercase block mb-1">Devise / Monnaie</label>
                      <input 
                        type="text"
                        className="w-full px-3 py-2 bg-slate-50 border border-gray-200 rounded-xl outline-none text-[11px] font-bold font-mono text-gray-800 shadow-2xs"
                        value={currencySymbol}
                        onChange={(e) => setCurrencySymbol(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* NEW SECTION: Advanced Pricing (Tarification Avancée) */}
              <div className="bg-white rounded-2xl p-4 border border-gray-110 space-y-3 shadow-2xs">
                <h3 className="font-black text-gray-950 flex items-center gap-1.5"><DollarSign className="w-4 h-4 text-emerald-650" /> Tarification & Seuil d'Abonnement</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-gray-500 font-black text-[9.5px] uppercase block mb-1">Frais de service application ({currencySymbol})</label>
                    <input 
                      type="number"
                      className="w-full px-3 py-2 bg-slate-50 border border-gray-250 rounded-xl outline-none text-gray-800 text-[11px]"
                      value={serviceFee}
                      onChange={(e) => setServiceFee(Number(e.target.value))}
                    />
                  </div>

                  <div>
                    <label className="text-gray-500 font-black text-[9.5px] uppercase block mb-1">Seuil Livraison Offerte ({currencySymbol})</label>
                    <input 
                      type="number"
                      className="w-full px-3 py-2 bg-slate-50 border border-gray-250 rounded-xl outline-none text-gray-800 text-[11px]"
                      value={freeDeliveryThreshold}
                      onChange={(e) => setFreeDeliveryThreshold(Number(e.target.value))}
                    />
                  </div>
                </div>
              </div>

              {/* NEW SECTION: Alerts and welcome banners (Bannière de communication) */}
              <div className="bg-white rounded-2xl p-4 border border-gray-110 space-y-3 shadow-2xs">
                <h3 className="font-black text-gray-950 flex items-center gap-1.5"><Bell className="w-4 h-4 text-amber-500" /> Bannière & Communication Client</h3>
                <div>
                  <label className="text-gray-500 font-black text-[9.5px] uppercase block mb-1">Texte de l'annonce affiché en page d'accueil</label>
                  <textarea 
                    className="w-full px-3 py-2 bg-slate-50 border border-gray-250 rounded-xl outline-none text-gray-800 text-[11px] h-16 resize-none"
                    placeholder="Bannière d'information..."
                    value={welcomeBanner}
                    onChange={(e) => setWelcomeBanner(e.target.value)}
                  />
                </div>
              </div>

              {/* NEW SECTION: Configuration de la Campagne (Member Days) */}
              <div className="bg-white rounded-2xl p-4 border border-gray-110 space-y-4 shadow-2xs">
                <div className="flex justify-between items-center">
                  <h3 className="font-black text-gray-950 flex items-center gap-1.5"><Sparkles className="w-4 h-4 text-[#E52327]" /> Campagne "Member Days"</h3>
                  <button 
                    type="button"
                    onClick={() => setMemberDaysEnabled(!memberDaysEnabled)}
                    className={`w-11 h-6 rounded-full transition-colors relative flex items-center ${memberDaysEnabled ? 'bg-[#E52327]' : 'bg-gray-200'}`}
                  >
                    <span className={`w-4 h-4 rounded-full bg-white shadow-xs absolute transition-all ${memberDaysEnabled ? 'right-1' : 'left-1'}`} />
                  </button>
                </div>
                
                {memberDaysEnabled && (
                  <div className="space-y-3.5 text-[11px]">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-gray-500 font-black text-[9px] uppercase block mb-1 text-left">Titre de la campagne</label>
                        <input 
                          type="text"
                          className="w-full px-3 py-1.5 bg-slate-50 border border-gray-200 rounded-xl outline-none text-gray-800 font-bold"
                          placeholder="Ex: Member Days"
                          value={memberDaysTitle}
                          onChange={(e) => setMemberDaysTitle(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="text-gray-500 font-black text-[9px] uppercase block mb-1 text-left">Surnom du badge</label>
                        <input 
                          type="text"
                          className="w-full px-3 py-1.5 bg-slate-50 border border-gray-200 rounded-xl outline-none text-gray-800 font-bold"
                          placeholder="Ex: EXCLUSIF 🇧🇫"
                          value={memberDaysBadgeText}
                          onChange={(e) => setMemberDaysBadgeText(e.target.value)}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-gray-500 font-black text-[9px] uppercase block mb-1 text-left">Texte du bouton d'action</label>
                      <input 
                        type="text"
                        className="w-full px-3 py-1.5 bg-slate-50 border border-gray-200 rounded-xl outline-none text-gray-800 font-bold"
                        placeholder="Ex: Voir les offres"
                        value={memberDaysButtonText}
                        onChange={(e) => setMemberDaysButtonText(e.target.value)}
                      />
                    </div>

                    <div>
                      <label className="text-gray-500 font-black text-[9px] uppercase block mb-1 text-left">Description de l'offre</label>
                      <textarea 
                        className="w-full px-3 py-1.5 bg-slate-50 border border-gray-200 rounded-xl outline-none text-gray-800 text-[11px] h-14 resize-none font-medium"
                        placeholder="Ex: Les plus belles offres sont disponibles jusqu'au 24 mai."
                        value={memberDaysSubtitle}
                        onChange={(e) => setMemberDaysSubtitle(e.target.value)}
                      />
                    </div>

                    <div>
                      <label className="text-gray-500 font-black text-[9px] uppercase block mb-1 text-left">Lien/URL de l'image de couverture</label>
                      <input 
                        type="text"
                        className="w-full px-3 py-1.5 bg-slate-50 border border-gray-200 rounded-xl outline-none text-gray-800 font-mono text-[9.5px]"
                        placeholder="https://..."
                        value={memberDaysImageUrl}
                        onChange={(e) => setMemberDaysImageUrl(e.target.value)}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* NEW SECTION: App controls & maintenance (Contrôles Système) */}
              <div className="bg-white rounded-2xl p-4 border border-gray-110 space-y-4 shadow-2xs">
                <h3 className="font-black text-gray-950 flex items-center gap-1.5"><Lock className="w-4 h-4 text-rose-500" /> Maintenance & Simulation</h3>
                
                <div className="space-y-3 text-[11.5px]">
                  {/* Maintenance mode slider */}
                  <div className="flex justify-between items-center py-1">
                    <div>
                      <p className="font-bold text-gray-900 text-xs">🛠️ Mode Maintenance Global</p>
                      <p className="text-[10px] text-gray-500">Bloque l'accès client temporairement</p>
                    </div>
                    <button 
                      onClick={() => setMaintenanceMode(!maintenanceMode)}
                      className={`w-11 h-6 rounded-full transition-colors relative flex items-center ${maintenanceMode ? 'bg-red-500' : 'bg-gray-200'}`}
                    >
                      <span className={`w-4 h-4 rounded-full bg-white shadow-xs absolute transition-all ${maintenanceMode ? 'right-1' : 'left-1'}`} />
                    </button>
                  </div>

                  {/* Gemini activation toggle */}
                  <div className="flex justify-between items-center py-1 border-t border-gray-100 pt-3">
                    <div>
                      <p className="font-bold text-gray-900 text-xs">🤖 IA Assistante Gemini Activée</p>
                      <p className="text-[10px] text-gray-500">Active la recommandation intelligente</p>
                    </div>
                    <button 
                      onClick={() => setEnableGeminiAgent(!enableGeminiAgent)}
                      className={`w-11 h-6 rounded-full transition-colors relative flex items-center ${enableGeminiAgent ? 'bg-green-500' : 'bg-gray-200'}`}
                    >
                      <span className={`w-4 h-4 rounded-full bg-white shadow-xs absolute transition-all ${enableGeminiAgent ? 'right-1' : 'left-1'}`} />
                    </button>
                  </div>

                  {/* Speed factors */}
                  <div className="border-t border-gray-100 pt-3">
                    <label className="text-gray-500 font-black text-[9.5px] uppercase block mb-2">Vitesse de simulation des livreurs</label>
                    <div className="grid grid-cols-4 gap-1.5">
                      {[0.5, 1, 2, 5].map((speed) => (
                        <button
                          key={speed}
                          type="button"
                          onClick={() => setSimulationSpeed(speed)}
                          className={`py-1.5 rounded-lg text-center text-[10.5px] font-black transition-all ${simulationSpeed === speed ? 'bg-slate-900 text-white shadow-xs' : 'bg-slate-100 text-gray-600 hover:bg-slate-200'}`}
                        >
                          x{speed} {speed === 1 ? '(Normal)' : speed === 5 ? '(FUTUR)' : ''}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* NEW SECTION: Authentification Réseaux Sociaux (Google & Apple) */}
              <div className="bg-white rounded-2xl p-4 border border-gray-110 space-y-4 shadow-2xs">
                <h3 className="font-black text-gray-950 flex items-center gap-1.5"><Lock className="w-4 h-4 text-amber-500" /> Authentification Google & Apple</h3>
                
                <div className="space-y-4 text-[11.5px]">
                  {/* Google Login Config */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center py-1">
                      <div>
                        <p className="font-bold text-gray-905 text-xs text-left">🌐 Connexion Google</p>
                        <p className="text-[10px] text-gray-500 text-left">Activer l'option Google OAuth</p>
                      </div>
                      <button 
                        type="button"
                        onClick={() => setEnableGoogleLogin(!enableGoogleLogin)}
                        className={`w-11 h-6 rounded-full transition-colors relative flex items-center ${enableGoogleLogin ? 'bg-[#E52327]' : 'bg-gray-200'}`}
                      >
                        <span className={`w-4 h-4 rounded-full bg-white shadow-xs absolute transition-all ${enableGoogleLogin ? 'right-1' : 'left-1'}`} />
                      </button>
                    </div>
                    {enableGoogleLogin && (
                      <div className="space-y-1">
                        <label className="text-gray-500 font-black text-[9px] uppercase block text-left">Google Client ID</label>
                        <input 
                          type="text"
                          className={`w-full px-3 py-1.5 bg-slate-50 border rounded-xl font-mono text-[10px] outline-none text-gray-850 ${formErrors.googleClientId ? 'border-red-500 bg-red-50/20' : 'border-gray-200 focus:border-red-400'}`}
                          placeholder="client-id.apps.googleusercontent.com"
                          value={googleClientId}
                          onChange={(e) => {
                            setGoogleClientId(e.target.value);
                            setFormErrors(prev => ({ ...prev, googleClientId: '' }));
                          }}
                        />
                        {formErrors.googleClientId && <span className="text-red-500 text-[8.5px] font-bold block mt-0.5 text-left">{formErrors.googleClientId}</span>}
                      </div>
                    )}
                  </div>

                  {/* Apple Login Config */}
                  <div className="space-y-2 pt-3 border-t border-gray-100">
                    <div className="flex justify-between items-center py-1">
                      <div>
                        <p className="font-bold text-gray-905 text-xs text-left"> Connexion Apple</p>
                        <p className="text-[10px] text-gray-500 text-left">Activer le bouton de connexion Apple</p>
                      </div>
                      <button 
                        type="button"
                        onClick={() => setEnableAppleLogin(!enableAppleLogin)}
                        className={`w-11 h-6 rounded-full transition-colors relative flex items-center ${enableAppleLogin ? 'bg-black' : 'bg-gray-200'}`}
                      >
                        <span className={`w-4 h-4 rounded-full bg-white shadow-xs absolute transition-all ${enableAppleLogin ? 'right-1' : 'left-1'}`} />
                      </button>
                    </div>
                    {enableAppleLogin && (
                      <div className="space-y-1">
                        <label className="text-gray-500 font-black text-[9px] uppercase block text-left">Apple Service ID / Client ID</label>
                        <input 
                          type="text"
                          className={`w-full px-3 py-1.5 bg-slate-50 border rounded-xl font-mono text-[10px] outline-none text-gray-850 ${formErrors.appleClientId ? 'border-red-500 bg-red-50/20' : 'border-gray-200 focus:border-red-400'}`}
                          placeholder="com.dodo.livraison.apple"
                          value={appleClientId}
                          onChange={(e) => {
                            setAppleClientId(e.target.value);
                            setFormErrors(prev => ({ ...prev, appleClientId: '' }));
                          }}
                        />
                        {formErrors.appleClientId && <span className="text-red-500 text-[8.5px] font-bold block mt-0.5 text-left">{formErrors.appleClientId}</span>}
                      </div>
                    )}
                  </div>
                </div>
              </div>

               {/* SECTION: Gestion des Codes Promo (Custom built matching mocks) */}
              <div className="bg-white rounded-2xl border border-gray-120 overflow-hidden shadow-2xs">
                <button
                  type="button"
                  onClick={() => setIsPromosCollapsed(!isPromosCollapsed)}
                  className="w-full px-4 py-3.5 bg-slate-50 flex justify-between items-center text-xs font-black text-gray-950 border-b border-gray-100 hover:bg-gray-100/50 transition"
                >
                  <span className="flex items-center gap-2">
                    <Ticket className="w-4 h-4 text-[#E52327]" />
                    <span>🎫 GESTION DES CODES PROMO</span>
                    <span className="bg-rose-500 text-white text-[9px] px-1.5 py-0.5 rounded-full font-extrabold leading-none">
                      {promoCodes.length}
                    </span>
                  </span>
                  <ChevronRight className={`w-4 h-4 text-gray-500 transition-transform ${!isPromosCollapsed ? 'rotate-90' : ''}`} />
                </button>

                {!isPromosCollapsed && (
                  <div className="p-4 space-y-4">
                    {/* List of current Promo Codes */}
                    <div className="space-y-2.5 max-h-[220px] overflow-y-auto no-scrollbar">
                      {promoCodes.map((promo) => (
                        <div key={promo.code} className="p-3 bg-gray-50 rounded-xl border border-gray-150 flex justify-between items-center text-left">
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono font-black text-gray-950 text-xs bg-slate-200 px-1.5 py-0.5 rounded">
                                {promo.code}
                              </span>
                              <span className="text-[10px] text-gray-500 font-bold">
                                Min. {promo.minOrderValue} {config.currencySymbol}
                              </span>
                            </div>
                            <p className="text-[11px] text-gray-700 mt-1 font-bold">
                              Réduction : <span className="text-emerald-600 font-extrabold">{promo.value}{promo.discountType === 'percentage' ? '%' : ` ${config.currencySymbol}`}</span>
                            </p>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            {/* Toggle active state */}
                            <button
                              type="button"
                              onClick={() => togglePromoCode(promo.code)}
                              className={`w-9 h-5 rounded-full relative flex items-center transition-colors ${promo.active ? 'bg-emerald-500' : 'bg-gray-200'}`}
                            >
                              <span className={`w-3.5 h-3.5 rounded-full bg-white absolute transition-all ${promo.active ? 'right-0.5' : 'left-0.5'}`} />
                            </button>
                            {/* Delete button */}
                            <button
                              type="button"
                              onClick={() => {
                                deletePromoCode(promo.code);
                                showToast(`Code ${promo.code} supprimé !`);
                              }}
                              className="p-1 px-1.5 bg-rose-50 hover:bg-rose-100 text-[#E52327] rounded-lg transition"
                            >
                              <Trash className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* New Promo Code creation form */}
                    <div className="bg-slate-50 border border-slate-150 rounded-xl p-3 space-y-2.5 text-left text-xs">
                      <p className="font-extrabold text-[10.5px] uppercase tracking-wider text-gray-600">Créer un coupon de rabais</p>
                      
                      <div>
                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-wider">Code promo (ex: FASODODO)</label>
                        <input
                          type="text"
                          value={newPromoCode}
                          onChange={(e) => setNewPromoCode(e.target.value)}
                          placeholder="FASO2026"
                          className="w-full p-2 bg-white border border-gray-200 rounded-lg text-xs font-bold text-gray-900 focus:outline-[#E52327]"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[9px] font-black text-gray-400 uppercase tracking-wider">Type de réduction</label>
                          <select
                            value={newPromoType}
                            onChange={(e) => setNewPromoType(e.target.value as 'fixed' | 'percentage')}
                            className="w-full p-2 bg-white border border-gray-200 rounded-lg text-xs font-bold text-gray-900 focus:outline-[#E52327]"
                          >
                            <option value="fixed">Montant Fixe ({config.currencySymbol})</option>
                            <option value="percentage">Pourcentage (%)</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-[9px] font-black text-gray-400 uppercase tracking-wider">Valeur du rabais</label>
                          <input
                            type="number"
                            value={newPromoValue}
                            onChange={(e) => setNewPromoValue(Number(e.target.value))}
                            className="w-full p-2 bg-white border border-gray-200 rounded-lg text-xs font-bold text-gray-900 focus:outline-[#E52327]"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-wider">Commande minimale requise</label>
                        <input
                          type="number"
                          value={newPromoMinOrder}
                          onChange={(e) => setNewPromoMinOrder(Number(e.target.value))}
                          className="w-full p-2 bg-white border border-gray-200 rounded-lg text-xs font-bold text-gray-900 focus:outline-[#E52327]"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          if (!newPromoCode.trim()) {
                            showToast("Le code promo ne doit pas être vide !");
                            return;
                          }
                          addPromoCode({
                            code: newPromoCode.trim().toUpperCase(),
                            discountType: newPromoType,
                            value: newPromoValue,
                            minOrderValue: newPromoMinOrder,
                            active: true
                          });
                          showToast(`Code PROMO ${newPromoCode.toUpperCase()} ajouté !`);
                          setNewPromoCode('');
                        }}
                        className="w-full py-2 bg-[#E52327] hover:bg-rose-700 text-white font-black text-center rounded-lg transition"
                      >
                        Créer le code promo 🎟️
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* SECTION: FAQ Dynamique (Interactive Accordion edit panel) */}
              <div className="bg-white rounded-2xl border border-gray-120 overflow-hidden shadow-2xs">
                <button
                  type="button"
                  onClick={() => setIsFaqsCollapsed(!isFaqsCollapsed)}
                  className="w-full px-4 py-3.5 bg-slate-50 flex justify-between items-center text-xs font-black text-gray-950 border-b border-gray-100 hover:bg-gray-100/50 transition"
                >
                  <span className="flex items-center gap-2">
                    <HelpCircle className="w-4 h-4 text-[#E52327]" />
                    <span>❓ SYSTEME DE FAQ DYNAMIQUE</span>
                    <span className="bg-rose-500 text-white text-[9px] px-1.5 py-0.5 rounded-full font-extrabold leading-none">
                      {faqs.length}
                    </span>
                  </span>
                  <ChevronRight className={`w-4 h-4 text-gray-500 transition-transform ${!isFaqsCollapsed ? 'rotate-90' : ''}`} />
                </button>

                {!isFaqsCollapsed && (
                  <div className="p-4 space-y-4">
                    {/* List of current Questions */}
                    <div className="space-y-2.5 max-h-[220px] overflow-y-auto no-scrollbar">
                      {faqs.map((faq) => (
                        <div key={faq.id} className="p-3 bg-gray-50 rounded-xl border border-gray-150 flex flex-col gap-2 text-left">
                          <div className="flex justify-between items-start">
                            <div>
                              <span className="text-[9px] font-black uppercase text-amber-800 bg-amber-50 border border-amber-200/50 px-1.5 py-0.5 rounded-md">
                                {faq.category}
                              </span>
                              <p className="font-extrabold text-gray-900 mt-1.5 text-xs select-text">{faq.question}</p>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                deleteFaqItem(faq.id);
                                showToast("Question FAQ supprimée !");
                              }}
                              className="p-1.5 px-2 bg-rose-50 hover:bg-rose-100 text-[#E52327] rounded-lg transition shrink-0 ml-2"
                            >
                              <Trash className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <p className="text-[10.5px] text-gray-500 leading-normal font-medium select-text">{faq.answer}</p>
                        </div>
                      ))}
                    </div>

                    {/* New FAQ item creation form */}
                    <div className="bg-slate-50 border border-slate-150 rounded-xl p-3 space-y-2.5 text-left text-xs text-slate-800">
                      <p className="font-extrabold text-[10.5px] uppercase tracking-wider text-gray-600">Ajouter une Question FAQ</p>
                      
                      <div>
                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-wider">Catégorie</label>
                        <select
                          value={newFaqCategory}
                          onChange={(e) => setNewFaqCategory(e.target.value)}
                          className="w-full p-2 bg-white border border-gray-200 rounded-lg text-xs font-bold text-gray-900 focus:outline-[#E52327]"
                        >
                          <option value="Général">Général</option>
                          <option value="Paiement">Paiement</option>
                          <option value="Wallets">Wallets</option>
                          <option value="Réductions">Réductions</option>
                          <option value="Livraison">Livraison</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-wider">Question posée</label>
                        <input
                          type="text"
                          value={newFaqQuestion}
                          onChange={(e) => setNewFaqQuestion(e.target.value)}
                          placeholder="Comment suivre ma livraison ?"
                          className="w-full p-2 bg-white border border-gray-200 rounded-lg text-xs font-bold text-gray-900 focus:outline-[#E52327]"
                        />
                      </div>

                      <div>
                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-wider">Réponse pré-rédigée</label>
                        <textarea
                          rows={2}
                          value={newFaqAnswer}
                          onChange={(e) => setNewFaqAnswer(e.target.value)}
                          placeholder="La réponse complète..."
                          className="w-full p-2 bg-white border border-gray-200 rounded-lg text-xs font-bold text-gray-900 focus:outline-[#E52327] resize-none"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          if (!newFaqQuestion.trim() || !newFaqAnswer.trim()) {
                            showToast("Veuillez remplir la question et la réponse !");
                            return;
                          }
                          addFaqItem({
                            id: `faq-${Date.now()}`,
                            question: newFaqQuestion.trim(),
                            answer: newFaqAnswer.trim(),
                            category: newFaqCategory
                          });
                          showToast("Nouvelle question FAQ enregistrée !");
                          setNewFaqQuestion('');
                          setNewFaqAnswer('');
                        }}
                        className="w-full py-2 bg-slate-900 hover:bg-black text-white font-black text-center rounded-lg transition"
                      >
                        Ajouter la FAQ ❓
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Save Trigger Button with React Hook validation style */}
              <button 
                onClick={() => {
                  const inputData = {
                    supabaseUrl,
                    supabaseAnonKey,
                    geminiApiKey,
                    resendApiKey,
                    brevoSmtpKey,
                    brevoSenderEmail,
                    baseDeliveryFee,
                    avgPrepTime,
                    appName,
                    primaryColor,
                    currencySymbol,
                    serviceFee,
                    freeDeliveryThreshold,
                    welcomeBanner,
                    simulationSpeed,
                    maintenanceMode,
                    enableGeminiAgent,
                    enableGoogleLogin,
                    googleClientId,
                    enableAppleLogin,
                    appleClientId,
                    memberDaysEnabled,
                    memberDaysTitle,
                    memberDaysSubtitle,
                    memberDaysButtonText,
                    memberDaysImageUrl,
                    memberDaysBadgeText,
                  };
                  
                  const validationSchema = z.object({
                    supabaseUrl: z.string().url({ message: "L'URL Supabase doit être valide" }).or(z.literal('')),
                    supabaseAnonKey: z.string().min(10, { message: "Anon key minimale d'au moins 10 caractères" }).or(z.literal('')),
                    geminiApiKey: z.string().min(5, { message: "Clé Gemini minimale de 5 caractères" }).or(z.literal('')),
                    resendApiKey: z.string().startsWith('re_', { message: "Clé Resend doit commencer par 're_'" }).or(z.literal('')),
                    brevoSmtpKey: z.string().min(5, { message: "Clé SMTP Brevo minimale de 5 caractères" }).or(z.literal('')),
                    brevoSenderEmail: z.string().email({ message: "Email d'expéditeur invalide" }).or(z.literal('')),
                    baseDeliveryFee: z.number().min(0, { message: "Les frais doivent être positifs" }),
                    avgPrepTime: z.string().min(2, { message: "Champ de temps requis" }),
                    appName: z.string().min(2, { message: "Le nom d'application doit comporter au moins 2 caractères" }),
                    primaryColor: z.string().min(4, { message: "Couleur hexadécimale requise" }),
                    currencySymbol: z.string().min(1, { message: "Symbole de monnaie requis" }),
                    serviceFee: z.number().min(0),
                    freeDeliveryThreshold: z.number().min(0),
                    welcomeBanner: z.string(),
                    simulationSpeed: z.number(),
                    maintenanceMode: z.boolean(),
                    enableGeminiAgent: z.boolean(),
                    enableGoogleLogin: z.boolean(),
                    googleClientId: z.string().min(5, { message: "Google Client ID requis" }).or(z.literal('')),
                    enableAppleLogin: z.boolean(),
                    appleClientId: z.string().min(5, { message: "Apple Service ID requis" }).or(z.literal('')),
                    memberDaysEnabled: z.boolean(),
                    memberDaysTitle: z.string().min(2, { message: "Le titre de la campagne doit comporter au moins 2 caractères" }),
                    memberDaysSubtitle: z.string(),
                    memberDaysButtonText: z.string().min(1),
                    memberDaysImageUrl: z.string().url({ message: "L'image doit être une URL valide" }).or(z.literal('')),
                    memberDaysBadgeText: z.string(),
                  });

                  const result = validationSchema.safeParse(inputData);
                  if (!result.success) {
                    const errors: Record<string, string> = {};
                    result.error.issues.forEach(issue => {
                      if (issue.path[0]) {
                        errors[issue.path[0].toString()] = issue.message;
                      }
                    });
                    setFormErrors(errors);
                    showToast("Formulaire invalide ! Veuillez vérifier vos saisies.");
                  } else {
                    updateConfig(inputData);
                    setFormErrors({});
                    showToast("Configurations de la stack enregistrées avec succès ! 🚀");
                    setTimeout(() => setDriverScreen(1), 1200);
                  }
                }}
                className="w-full py-3 bg-[#E52327] hover:bg-red-700 text-white font-black text-center rounded-2xl shadow-md uppercase tracking-wider active:scale-98 transition flex items-center justify-center gap-2"
                id="save-config-btn"
              >
                <Check className="w-4 h-4 shrink-0 stroke-[3]" /> Sauvegarder la Stack
              </button>

            </div>
          </div>
        )}

        {/* =======================================================
            BOTTOM TABS NAVIGATION DESIGN (Matching mockups footer visually)
            ======================================================= */}
        <div className="absolute bottom-0 inset-x-0 h-[68px] bg-white border-t border-gray-150 rounded-b-[43px] flex items-center justify-around px-2 z-40 select-none shadow-md text-gray-400 text-[9px] font-black shrink-0">
          
          <button 
            onClick={() => setDriverScreen(1)}
            className={`flex flex-col items-center justify-center gap-1 w-14 py-2 transition-transform ${
              adminScreen === 1 ? 'text-[#E52327] transform scale-103' : 'hover:text-gray-600'
            }`}
          >
            <BarChart2 className={`w-[20px] h-[20px] transition-transform ${adminScreen === 1 ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
            <span className="leading-none tracking-tight">Accueil</span>
          </button>

          <button 
            onClick={() => setDriverScreen(2)}
            className={`flex flex-col items-center justify-center gap-1 w-14 py-2 transition-transform ${
              adminScreen === 2 ? 'text-[#E52327] transform scale-103' : 'hover:text-gray-600'
            }`}
          >
            <Store className={`w-[20px] h-[20px] transition-transform ${adminScreen === 2 ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
            <span className="leading-none tracking-tight">Vendeurs</span>
          </button>

          <button 
            onClick={() => setDriverScreen(3)}
            className={`flex flex-col items-center justify-center gap-1 w-14 py-2 transition-transform ${
              adminScreen === 3 ? 'text-[#E52327] transform scale-103' : 'hover:text-gray-600'
            }`}
          >
            <Bike className={`w-[20px] h-[20px] transition-transform ${adminScreen === 3 ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
            <span className="leading-none tracking-tight">Livreurs</span>
          </button>

          <button 
            onClick={() => setDriverScreen(4)}
            className={`flex flex-col items-center justify-center gap-1 w-14 py-2 transition-transform ${
              adminScreen === 4 ? 'text-[#E52327] transform scale-103' : 'hover:text-gray-600'
            }`}
          >
            <ClipboardList className={`w-[20px] h-[20px] transition-transform ${adminScreen === 4 ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
            <span className="leading-none tracking-tight">Commandes</span>
          </button>

          <button 
            onClick={() => {
              // Cycle plus submenus 5, 6, 7 natively for visual engagement on "Plus" tab
              if (adminScreen === 5) {
                setDriverScreen(6);
              } else if (adminScreen === 6) {
                setDriverScreen(7);
              } else {
                setDriverScreen(5);
              }
              showToast("Exploration des menus d'administration (Plus)...");
            }}
            className={`flex flex-col items-center justify-center gap-1 w-14 py-2 transition-transform ${
              adminScreen >= 5 ? 'text-[#E52327] transform scale-103' : 'hover:text-gray-600'
            }`}
          >
            <Plus className={`w-[20px] h-[20px] transition-transform ${adminScreen >= 5 ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
            <span className="leading-none tracking-tight">{adminScreen === 5 ? 'Paiements' : adminScreen === 6 ? 'Utilisateurs' : adminScreen === 7 ? 'Signalements' : 'Plus'}</span>
          </button>

        </div>

      </div>
    </div>
  );
}
