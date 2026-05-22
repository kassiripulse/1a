/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import PhoneEmulator from './components/PhoneEmulator';
import VendorPhoneEmulator from './components/VendorPhoneEmulator';
import DriverPhoneEmulator from './components/DriverPhoneEmulator';
import AdminPhoneEmulator from './components/AdminPhoneEmulator';
import DevDashboard from './components/DevDashboard';
import { 
  Restaurant, MenuItem, Order, ClientProfile, 
  MOCK_RESTAURANTS, MOCK_MENU_ITEMS, MOCK_PAST_ORDERS, MOCK_PROFILE 
} from './types';
import { fetchRestaurants, fetchMenuItems, fetchProfile, fetchOrders, resetLocalStorageDB } from './lib/supabase';
import { Sparkles, Utensils, Heart } from 'lucide-react';
import { useAppStore } from './lib/store';

export default function App() {
  const { config, language, setLanguage } = useAppStore();
  const [currentScreenId, setCurrentScreenId] = useState<number>(1); // Defaults to Splash screen
  const [vendorScreenId, setVendorScreenId] = useState<number>(1); // Defaults to vendor main screen
  const [driverScreenId, setDriverScreenId] = useState<number>(1); // Defaults to driver main screen
  const [adminScreenId, setAdminScreenId] = useState<number>(1); // Defaults to admin main screen
  const [userRole, setUserRole] = useState<'client' | 'vendor' | 'livreur' | 'admin'>('client'); // Default to client mode

  // Application database states
  const [restaurants, setRestaurants] = useState<Restaurant[]>(MOCK_RESTAURANTS);
  const [menuItems, setMenuItems] = useState<MenuItem[]>(MOCK_MENU_ITEMS);
  const [profile, setProfile] = useState<ClientProfile>(MOCK_PROFILE);
  const [orders, setOrders] = useState<Order[]>(MOCK_PAST_ORDERS);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Load all data from Supabase/Local storage
  const loadDatabase = async () => {
    setIsLoading(true);
    try {
      const dbRests = await fetchRestaurants();
      const dbMenus = await fetchMenuItems();
      const dbProf = await fetchProfile();
      const dbOrders = await fetchOrders();

      setRestaurants(dbRests);
      setMenuItems(dbMenus);
      setProfile(dbProf);
      setOrders(dbOrders);
    } catch (e) {
      console.warn("Failed loading database:", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDatabase();
  }, []);

  const handleResetDB = () => {
    if (window.confirm("Êtes-vous sûr de vouloir réinitialiser la base de données locale par défaut ?")) {
      resetLocalStorageDB();
      loadDatabase();
      setCurrentScreenId(1); // Go back to splash
    }
  };

  const handleOrderPlaced = () => {
    // Refresh the past orders list with current state
    loadDatabase();
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-[#E52327]/10 selection:text-[#E52327]">
      
      {/* Dynamic Style Override Block for complete system customization */}
      <style>{`
        :root {
          --primary-color: ${config.primaryColor};
        }
        
        /* Force color replacement on specific Tailwind class utilities used across all modules */
        .text-\\[\\#E52327\\] { color: ${config.primaryColor} !important; }
        .bg-\\[\\#E52327\\] { background-color: ${config.primaryColor} !important; }
        .border-\\[\\#E52327\\] { border-color: ${config.primaryColor} !important; }
        .fill-\\[\\#E52327\\] { fill: ${config.primaryColor} !important; }
        .active-tab { color: ${config.primaryColor} !important; }
        .selection\\:text-\\[\\#E52327\\]::selection { color: ${config.primaryColor} !important; }

        /* Secondary rose elements adaptation */
        .text-rose-500 { color: ${config.primaryColor} !important; }
        .text-rose-600 { color: ${config.primaryColor} !important; }
        .bg-rose-500 { background-color: ${config.primaryColor} !important; }
        .hover\\:bg-rose-700:hover { background-color: ${config.primaryColor}cf !important; }
        .hover\\:text-rose-500:hover { color: ${config.primaryColor} !important; }
        .border-rose-500 { border-color: ${config.primaryColor} !important; }
        .border-rose-500\\/20 { border-color: ${config.primaryColor}33 !important; }
        .border-rose-500\\/10 { border-color: ${config.primaryColor}1a !important; }
        .border-rose-500\\/30 { border-color: ${config.primaryColor}4d !important; }
        .bg-rose-500\\/20 { background-color: ${config.primaryColor}33 !important; }
        .bg-rose-500\\/10 { background-color: ${config.primaryColor}1a !important; }
        .bg-rose-500\\/15 { background-color: ${config.primaryColor}26 !important; }
      `}</style>

      {/* Outer elegant workspace header banner */}
      <header className="w-full bg-slate-900/65 backdrop-blur-md border-b border-slate-800 px-6 py-4 sticky top-0 z-[100] shadow-sm select-none shrink-0">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#E52327] rounded-full flex items-center justify-center text-white shadow-md select-none font-black text-xl animate-pulse">
              {config.appName.substring(0, 1).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-[17px] font-black tracking-tight text-white leading-none">{config.appName}</h1>
                <span className="bg-rose-500 text-white text-[9px] px-1.5 py-0.5 rounded-full font-extrabold tracking-wider leading-none uppercase">
                  Maquettes UI
                </span>
              </div>
              <p className="text-[11px] text-gray-500 mt-1 leading-none">Plateforme de livraison burkinabè personnalisée sans fioriture</p>
            </div>
          </div>

          <div className="flex items-center gap-5 text-[12px] font-semibold text-gray-400">
            <div className="hidden lg:flex items-center gap-2.5">
              <span className="text-gray-600">Dev Mode :</span>
              <span className="bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md text-emerald-400 text-[10.5px]">
                Actif (SQLite & Supabase sync)
              </span>
            </div>
            <div className="hidden md:flex items-center gap-1.5 hover:text-white transition">
              <Sparkles className="w-4 h-4 text-rose-500" />
              <span>Pixel-Perfect Design</span>
            </div>

            {/* Language toggle selector */}
            <div className="flex items-center gap-1 bg-slate-800/85 border border-slate-700/60 rounded-xl p-0.5 shadow-sm select-none shrink-0 font-black">
              <button
                type="button"
                onClick={() => setLanguage('fr')}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold transition-all uppercase leading-none tracking-wider flex items-center gap-1.5 cursor-pointer ${
                  language === 'fr' 
                    ? 'bg-[#E52327] text-white shadow-xs' 
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <span>FR</span>
                <span className="text-xs">🇧🇫</span>
              </button>
              <button
                type="button"
                onClick={() => setLanguage('en')}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold transition-all uppercase leading-none tracking-wider flex items-center gap-1.5 cursor-pointer ${
                  language === 'en' 
                    ? 'bg-[#E52327] text-white shadow-xs' 
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <span>EN</span>
                <span className="text-xs">🇬🇧</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Sandbox Layout Screen Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-8 flex flex-col xl:flex-row items-center xl:items-start justify-center gap-6 xl:gap-8">
        
        {/* Left column: Human intro context & Live DB controllers */}
        <div className="w-full xl:w-[48%] flex flex-col space-y-6">
          
          {/* Pitch & Presentation box */}
          <div className="bg-gradient-to-br from-rose-950/20 via-slate-900/40 to-slate-900/60 border border-slate-800 p-6 rounded-3xl space-y-4">
            <div className="flex items-center gap-2.5 text-[#E52327]">
              <Utensils className="w-5 h-5" />
              <h3 className="text-sm font-black uppercase tracking-wider">Cahier des charges & Maquettes</h3>
            </div>
            <h2 className="text-xl md:text-2xl font-black text-white tracking-tight leading-snug">
              Un simulateur interactif pour tester l'application Dodo du Burkina Faso
            </h2>
            <p className="text-gray-400 text-xs leading-relaxed">
              Nous avons transposé <b>trait pour trait, pixel par pixel</b> les 7 maquettes fournies pour l'application mobile de livraison <b>Dodo</b> à Ouagadougou. Chaque couleur, taille, position de bouton et détail d'icône a été répliqué avec soin.
            </p>
            <div className="grid grid-cols-2 gap-3 text-[11px]">
              <div className="bg-slate-900/50 p-2.5 border border-slate-800/50 rounded-xl leading-relaxed">
                <span className="text-[#E52327] font-black block mb-0.5">💻 Dashboard de Contrôle</span>
                Permet de basculer instantanément entre les 7 écrans et d'éditer ou connecter votre propre schéma SQL Supabase.
              </div>
              <div className="bg-slate-900/50 p-2.5 border border-slate-800/50 rounded-xl leading-relaxed">
                <span className="text-[#E52327] font-black block mb-0.5">📱 Émulateur Mobile Réactif</span>
                Une simulation d'iPhone 15 Pro complète avec panier d'achats live, simulation de trajet de Blaise K. et chat livreur.
              </div>
            </div>
          </div>

          {/* Control Dashboard Panel component */}
          <DevDashboard 
            currentScreenId={currentScreenId}
            setCurrentScreenId={setCurrentScreenId}
            vendorScreenId={vendorScreenId}
            setVendorScreenId={setVendorScreenId}
            driverScreenId={driverScreenId}
            setDriverScreenId={setDriverScreenId}
            adminScreenId={adminScreenId}
            setAdminScreenId={setAdminScreenId}
            userRole={userRole}
            setUserRole={setUserRole}
            orders={orders}
            onResetDB={handleResetDB}
            onRefreshOrders={loadDatabase}
          />

        </div>

        {/* Right column: iPhone 15 Pro mobile frame system emulator */}
        <div className="w-full xl:w-[52%] flex flex-col items-center gap-4 py-4 relative">
          
          {/* Quick interactive header above the phone */}
          <div className="flex bg-slate-900 border border-slate-850 p-1 rounded-2xl shadow-lg w-[390px] justify-between">
            <button
              onClick={() => setUserRole('client')}
              className={`flex-1 py-1.5 rounded-xl font-extrabold text-[10px] uppercase tracking-wider transition flex items-center justify-center gap-1 ${
                userRole === 'client' ? 'bg-[#E52327] text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              📱 Client
            </button>
            <button
              onClick={() => setUserRole('vendor')}
              className={`flex-1 py-1.5 rounded-xl font-extrabold text-[10px] uppercase tracking-wider transition flex items-center justify-center gap-1 ${
                userRole === 'vendor' ? 'bg-rose-900 text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              🧑‍🍳 Vendeur
            </button>
            <button
              onClick={() => setUserRole('livreur')}
              className={`flex-1 py-1.5 rounded-xl font-extrabold text-[10px] uppercase tracking-wider transition flex items-center justify-center gap-1 ${
                userRole === 'livreur' ? 'bg-emerald-600 text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              🏍️ Livreur
            </button>
            <button
              onClick={() => setUserRole('admin')}
              className={`flex-1 py-1.5 rounded-xl font-extrabold text-[10px] uppercase tracking-wider transition flex items-center justify-center gap-1 ${
                userRole === 'admin' ? 'bg-red-700 text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              👑 Admin
            </button>
          </div>

          {/* Subtle glowing halo background behind the phone, resembling warm streetlights/dodo theme */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[700px] bg-rose-600/5 filter blur-[100px] rounded-full pointer-events-none"></div>

          {isLoading ? (
            <div className="w-[390px] h-[844px] bg-slate-950 rounded-[55px] border-[6px] border-slate-900 flex flex-col items-center justify-center text-gray-500 font-bold space-y-4 shadow-xl">
              <div className="w-8 h-8 rounded-full border-2 border-t-rose-500 border-rose-500/10 animate-spin"></div>
              <span className="text-xs">Initialisation de la base Dodo...</span>
            </div>
          ) : userRole === 'client' ? (
            <PhoneEmulator 
              currentScreenId={currentScreenId}
              setCurrentScreenId={setCurrentScreenId}
              restaurants={restaurants}
              menuItems={menuItems}
              profile={profile}
              setProfile={setProfile}
              orders={orders}
              onOrderPlaced={handleOrderPlaced}
              onScreenChange={(screenId) => setCurrentScreenId(screenId)}
            />
          ) : userRole === 'vendor' ? (
            <VendorPhoneEmulator 
              restaurants={restaurants}
              menuItems={menuItems}
              orders={orders}
              onMenuItemsChange={(updated) => setMenuItems(updated)}
              onOrdersChange={(updated) => setOrders(updated)}
              vendorScreenId={vendorScreenId}
              setVendorScreenId={setVendorScreenId}
              onScreenChange={(screenId) => setVendorScreenId(screenId)}
            />
          ) : userRole === 'livreur' ? (
            <DriverPhoneEmulator 
              restaurants={restaurants}
              menuItems={menuItems}
              orders={orders}
              onOrdersChange={(updated) => setOrders(updated)}
              driverScreenId={driverScreenId}
              setDriverScreenId={setDriverScreenId}
              onScreenChange={(screenId) => setDriverScreenId(screenId)}
            />
          ) : (
            <AdminPhoneEmulator 
              restaurants={restaurants}
              menuItems={menuItems}
              orders={orders}
              onOrdersChange={(updated) => setOrders(updated)}
              adminScreenId={adminScreenId}
              setAdminScreenId={setAdminScreenId}
              onScreenChange={(screenId) => setAdminScreenId(screenId)}
            />
          )}

        </div>

      </main>

      {/* Footer copyright */}
      <footer className="w-full py-8 text-center text-[11px] text-gray-600 border-t border-slate-900 mt-12 bg-slate-950 select-none shrink-0 italic flex items-center justify-center gap-1.5">
        <span>Fait avec passion au Burkina Faso</span>
        <Heart className="w-3.5 h-3.5 text-[#E52327] fill-[#E52327]" />
        <span>• Propulsé par React, Supabase & Tailwind CSS</span>
      </footer>

    </div>
  );
}
