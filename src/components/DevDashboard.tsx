/**
 * @license
 * SPDX-License-Identifier: Apache-2.5
 */

import React, { useState } from 'react';
import { 
  Database, Code, Cpu, ExternalLink, RefreshCw, Key, Check, Info, Settings, Trash2, Rocket, Globe
} from 'lucide-react';
import { SUPABASE_SQL_SCHEMA, isSupabaseConfigured } from '../lib/supabase';
import { secureStorage } from '../lib/secureStorage';
import { Order, Restaurant } from '../types';
import DodoLogo from './DodoLogo';

interface DevDashboardProps {
  currentScreenId: number;
  setCurrentScreenId: (id: number) => void;
  vendorScreenId: number;
  setVendorScreenId: (id: number) => void;
  driverScreenId: number;
  setDriverScreenId: (id: number) => void;
  adminScreenId: number;
  setAdminScreenId: (id: number) => void;
  userRole: 'client' | 'vendor' | 'livreur' | 'admin';
  setUserRole: (role: 'client' | 'vendor' | 'livreur' | 'admin') => void;
  orders: Order[];
  onResetDB: () => void;
  onRefreshOrders?: () => void;
}

export default function DevDashboard({
  currentScreenId,
  setCurrentScreenId,
  vendorScreenId,
  setVendorScreenId,
  driverScreenId,
  setDriverScreenId,
  adminScreenId,
  setAdminScreenId,
  userRole,
  setUserRole,
  orders,
  onResetDB,
  onRefreshOrders,
}: DevDashboardProps) {
  const [copiedSql, setCopiedSql] = useState<boolean>(false);
  const [supabaseUrlInput, setSupabaseUrlInput] = useState<string>(() => secureStorage.getItem('DODO_SUPABASE_URL') || '');
  const [supabaseAnonKeyInput, setSupabaseAnonKeyInput] = useState<string>(() => secureStorage.getItem('DODO_SUPABASE_ANON_KEY') || '');
  const [isSuccessSave, setIsSuccessSave] = useState<boolean>(false);

  const [mapsKeyInput, setMapsKeyInput] = useState<string>(() => secureStorage.getItem('GOOGLE_MAPS_PLATFORM_KEY') || '');
  const [isSuccessSaveMaps, setIsSuccessSaveMaps] = useState<boolean>(false);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(SUPABASE_SQL_SCHEMA);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2000);
  };

  const handleSaveKeys = (e: React.FormEvent) => {
    e.preventDefault();
    secureStorage.setItem('DODO_SUPABASE_URL', supabaseUrlInput.trim());
    secureStorage.setItem('DODO_SUPABASE_ANON_KEY', supabaseAnonKeyInput.trim());
    setIsSuccessSave(true);
    if (onRefreshOrders) {
      onRefreshOrders();
    }
    setTimeout(() => {
      setIsSuccessSave(false);
      window.location.reload(); // Reload to re-initialize the supabase client with new keys
    }, 1500);
  };

  const handleClearKeys = () => {
    secureStorage.removeItem('DODO_SUPABASE_URL');
    secureStorage.removeItem('DODO_SUPABASE_ANON_KEY');
    setSupabaseUrlInput('');
    setSupabaseAnonKeyInput('');
    window.location.reload();
  };

  const handleSaveMapsKey = (e: React.FormEvent) => {
    e.preventDefault();
    secureStorage.setItem('GOOGLE_MAPS_PLATFORM_KEY', mapsKeyInput.trim());
    setIsSuccessSaveMaps(true);
    setTimeout(() => {
      setIsSuccessSaveMaps(false);
      window.location.reload();
    }, 1500);
  };

  const handleClearMapsKey = () => {
    secureStorage.removeItem('GOOGLE_MAPS_PLATFORM_KEY');
    setMapsKeyInput('');
    window.location.reload();
  };

  const isConfigured = isSupabaseConfigured();
  const isMapsConfigured = !!(process.env.GOOGLE_MAPS_PLATFORM_KEY || secureStorage.getItem('GOOGLE_MAPS_PLATFORM_KEY'));

  return (
    <div className="flex-1 bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col space-y-6 overflow-y-auto max-h-[844px] no-scrollbar text-gray-300 font-sans text-xs">
      
      {/* Title block */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <DodoLogo size={40} withText={true} withContainer={true} contourColor="#FFFFFF" />
          <div>
            <h2 className="text-[15px] font-black tracking-tight text-white leading-none">Console Dodo × Supabase</h2>
            <p className="text-[11px] text-gray-500 mt-1.5">Gérez le backend & pilotez les émulateurs</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 bg-rose-500/10 border border-rose-500/20 px-2.5 py-1 rounded-full text-[10px] text-rose-400 font-bold">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span>
          Burkina Faso v1.1
        </div>
      </div>

      {/* Role Switcher tabs at top of Dashboard */}
      <div className="space-y-2">
        <h3 className="font-extrabold text-white text-[11px] uppercase tracking-wider flex items-center gap-1.5">
          👤 Sélectionner l'Application à Tester
        </h3>
        <div className="grid grid-cols-4 gap-1.5 bg-slate-950 p-1 border border-slate-850 rounded-2xl">
          <button
            onClick={() => setUserRole('client')}
            className={`py-2 rounded-xl font-bold flex flex-col items-center justify-center gap-0.5 transition ${
              userRole === 'client'
                ? 'bg-[#E52327] text-white font-black'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <span className="text-sm">📱</span>
            <span className="text-[9.5px]">Client</span>
          </button>
          <button
            onClick={() => setUserRole('vendor')}
            className={`py-2 rounded-xl font-bold flex flex-col items-center justify-center gap-0.5 transition ${
              userRole === 'vendor'
                ? 'bg-rose-950 border border-rose-700 text-white font-black'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <span className="text-sm">🧑‍🍳</span>
            <span className="text-[9.5px]">Vendeur</span>
          </button>
          <button
            onClick={() => setUserRole('livreur')}
            className={`py-2 rounded-xl font-bold flex flex-col items-center justify-center gap-0.5 transition ${
              userRole === 'livreur'
                ? 'bg-emerald-950 border border-emerald-700 text-white font-black'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <span className="text-sm">🏍️</span>
            <span className="text-[9.5px]">Livreur</span>
          </button>
          <button
            onClick={() => setUserRole('admin')}
            className={`py-2 rounded-xl font-bold flex flex-col items-center justify-center gap-0.5 transition ${
              userRole === 'admin'
                ? 'bg-red-700 text-white font-black'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <span className="text-sm">👑</span>
            <span className="text-[9.5px]">Admin</span>
          </button>
        </div>
      </div>

      {/* Screen Controller Fast-jump Panels */}
      <div className="space-y-2.5">
        <h3 className="font-extrabold text-white text-[11px] uppercase tracking-wider flex items-center gap-1.5">
          <Cpu className="w-4 h-4 text-rose-500" /> Naviguer sur l'Émulateur ({userRole === 'client' ? 'Dodo Client' : userRole === 'vendor' ? 'Dodo Vendeur' : userRole === 'livreur' ? 'Dodo Livreur' : 'Dodo Admin'})
        </h3>
        
        {userRole === 'client' ? (
          <div className="grid grid-cols-2 gap-2 text-[11px] font-bold">
            {[
              { id: 1, label: '1. Splash Screen', emoji: '📱' },
              { id: 2, label: '2. Écran d\'accueil', emoji: '🏠' },
              { id: 3, label: '3. Page Restaurant', emoji: '🍳' },
              { id: 4, label: '4. Mon panier', emoji: '🛒' },
              { id: 5, label: '5. Suivi livraison', emoji: '🏍️' },
              { id: 6, label: '6. Mes commandes', emoji: '📋' },
              { id: 7, label: '7. Profil client', emoji: '👤' },
              { id: 8, label: '8. Recherche & Carte', emoji: '🔍' },
            ].map((sc) => (
              <button
                key={sc.id}
                onClick={() => {
                  setUserRole('client');
                  setCurrentScreenId(sc.id);
                }}
                className={`p-2.5 rounded-xl border text-left transition flex items-center gap-2 ${
                  currentScreenId === sc.id
                    ? 'bg-[#E52327] text-white border-[#E52327] shadow-md shadow-red-950/20'
                    : 'bg-slate-950 border-slate-800 hover:border-slate-700 text-gray-300'
                }`}
              >
                <span>{sc.emoji}</span>
                <span className="truncate">{sc.label}</span>
              </button>
            ))}
          </div>
        ) : userRole === 'vendor' ? (
          <div className="grid grid-cols-2 gap-2 text-[11px] font-bold">
            {[
              { id: 1, label: '1. Dashboard principal', emoji: '📊' },
              { id: 2, label: '2. Commandes temps réel', emoji: '📋' },
              { id: 3, label: '3. Gestion du menu', emoji: '🍲' },
              { id: 4, label: '4. Ajouter un plat', emoji: '➕' },
              { id: 5, label: '5. Statistiques', emoji: '📈' },
              { id: 6, label: '6. Profil restaurant', emoji: '👤' },
            ].map((sv) => (
              <button
                key={sv.id}
                onClick={() => {
                  setUserRole('vendor');
                  setVendorScreenId(sv.id);
                }}
                className={`p-2.5 rounded-xl border text-left transition flex items-center gap-2 ${
                  vendorScreenId === sv.id
                    ? 'bg-rose-900 border-rose-700 text-white shadow-md'
                    : 'bg-slate-950 border-slate-800 hover:border-slate-700 text-gray-300'
                }`}
              >
                <span>{sv.emoji}</span>
                <span className="truncate">{sv.label}</span>
              </button>
            ))}
          </div>
        ) : userRole === 'livreur' ? (
          <div className="grid grid-cols-2 gap-2 text-[11px] font-bold">
            {[
              { id: 1, label: '1. Écran principal', emoji: '🏠' },
              { id: 2, label: '2. Nouvelle mission', emoji: '📋' },
              { id: 3, label: '3. Navigation active', emoji: '🏍️' },
              { id: 4, label: '4. Mes gains', emoji: '💰' },
              { id: 5, label: '5. Profil livreur', emoji: '👤' },
            ].map((sd) => (
              <button
                key={sd.id}
                onClick={() => {
                  setUserRole('livreur');
                  setDriverScreenId(sd.id);
                }}
                className={`p-2.5 rounded-xl border text-left transition flex items-center gap-2 ${
                  driverScreenId === sd.id
                    ? 'bg-emerald-600 border-emerald-500 text-white shadow-md'
                    : 'bg-slate-950 border-slate-800 hover:border-slate-700 text-gray-300'
                }`}
              >
                <span>{sd.emoji}</span>
                <span className="truncate">{sd.label}</span>
              </button>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2 text-[11px] font-bold">
            {[
              { id: 1, label: '1. Dashboard principal', emoji: '📊' },
              { id: 2, label: '2. Gestion vendeurs', emoji: '🍲' },
              { id: 3, label: '3. Gestion livreurs', emoji: '🏍️' },
              { id: 4, label: '4. Gestion commandes', emoji: '📋' },
              { id: 5, label: '5. Gestion paiements', emoji: '💰' },
              { id: 6, label: '6. Gestion utilisateurs', emoji: '👤' },
              { id: 7, label: '7. Litiges et alertes', emoji: '🚨' },
            ].map((sa) => (
              <button
                key={sa.id}
                onClick={() => {
                  setUserRole('admin');
                  setAdminScreenId(sa.id);
                }}
                className={`p-2.5 rounded-xl border text-left transition flex items-center gap-2 ${
                  adminScreenId === sa.id
                    ? 'bg-red-700 border-red-500 text-white shadow-md'
                    : 'bg-slate-950 border-slate-800 hover:border-slate-700 text-gray-300'
                }`}
              >
                <span>{sa.emoji}</span>
                <span className="truncate">{sa.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Database State Monitoring Widget */}
      <div className="bg-slate-950 rounded-2xl border border-slate-800 p-4 space-y-4">
        <div className="flex justify-between items-center text-[11px]">
          <h4 className="font-black text-white uppercase tracking-wider flex items-center gap-1">
            🟢 État des tables de l'application
          </h4>
          <button 
            onClick={() => { onResetDB(); }}
            className="text-gray-400 hover:text-rose-500 flex items-center gap-1 font-bold"
            title="Réinitialiser la base locale"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Réinitialiser
          </button>
        </div>

        <div className="grid grid-cols-4 gap-2 text-center text-[11px]">
          <div className="bg-slate-900 border border-slate-800/60 rounded-xl p-2">
            <span className="text-gray-500 block text-[9px] uppercase font-bold">Maquis</span>
            <span className="text-sm font-extrabold text-white">3</span>
          </div>
          <div className="bg-slate-900 border border-slate-800/60 rounded-xl p-2">
            <span className="text-gray-500 block text-[9px] uppercase font-bold">Plats</span>
            <span className="text-sm font-extrabold text-white">10</span>
          </div>
          <div className="bg-slate-900 border border-slate-800/60 rounded-xl p-2">
            <span className="text-gray-500 block text-[9px] uppercase font-bold">Profils</span>
            <span className="text-sm font-extrabold text-white">1</span>
          </div>
          <div className="bg-slate-900 border border-slate-800/60 rounded-xl p-2">
            <span className="text-gray-500 block text-[9px] uppercase font-bold">Commandes</span>
            <span className="text-sm font-extrabold text-rose-500">{orders.length}</span>
          </div>
        </div>

        {/* Live mutation tracker console log emulator */}
        <div className="bg-slate-950 rounded-xl border border-rose-950/40 p-3 font-mono text-[9.5px]/1.4 text-rose-100 space-y-1">
          <div className="text-gray-500">// Journal de transactions de la session :</div>
          {orders.length > 0 ? (
            orders.slice(0, 3).map((ord, idx) => (
              <div key={ord.id} className="text-emerald-400 truncate">
                📥 INSERT INTO orders VALUES ({ord.order_number}, total {ord.total} FCFA) - OK (sync={isConfigured ? 'supabase' : 'locale'})
              </div>
            ))
          ) : (
            <div className="text-amber-500 animate-pulse">⏳ Prêt à intercepter les commandes client...</div>
          )}
          <div className="text-sky-400">⚡ Activé : SQLite Local Storage Fallback actif.</div>
        </div>
      </div>

      {/* Supabase Connection configuration fields */}
      <div className="space-y-3">
        <h3 className="font-extrabold text-white text-[11px] uppercase tracking-wider flex items-center gap-1.5">
          <Key className="w-4 h-4 text-rose-400" /> Configuration de l'API Supabase
        </h3>
        <form onSubmit={handleSaveKeys} className="bg-slate-950 border border-slate-800 rounded-2xl p-4.5 space-y-3">
          
          <div className="space-y-1">
            <label className="text-gray-400 font-bold block text-[10px] uppercase">URL de Projet Supabase</label>
            <input 
              type="text" 
              placeholder="https://your-project.supabase.co" 
              value={supabaseUrlInput}
              onChange={(e) => setSupabaseUrlInput(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-rose-500"
            />
          </div>

          <div className="space-y-1">
            <label className="text-gray-400 font-bold block text-[10px] uppercase">Clé Publique Anon (Key1)</label>
            <input 
              type="password" 
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." 
              value={supabaseAnonKeyInput}
              onChange={(e) => setSupabaseAnonKeyInput(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-[10.5px] text-white focus:outline-none focus:ring-1 focus:ring-rose-500"
            />
          </div>

          <div className="flex gap-2 pt-1 text-[11px]">
            <button
              type="submit"
              className="flex-1 bg-rose-600 hover:bg-rose-500 text-white font-bold py-2 rounded-lg transition text-center shadow-md shadow-rose-950/20 active:scale-95"
            >
              {isSuccessSave ? 'Enregistré ! 🔄' : 'Brancher Supabase'}
            </button>
            {isConfigured && (
              <button
                type="button"
                onClick={handleClearKeys}
                className="bg-slate-900 border border-slate-800 text-gray-400 hover:text-white px-3 py-2 rounded-lg font-bold transition flex items-center justify-center"
                title="Vider la configuration"
              >
                Déconnecter
              </button>
            )}
          </div>

          <div className="flex items-start gap-2 bg-slate-900/40 p-2.5 rounded-lg text-[9.5px]/1.4 text-gray-400">
            <Info className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
            <p>
              En connectant votre projet, les insertions se feront instantanément sur votre vraie base Supabase de production. Sinon, l'applette persiste tout localement de manière autonome.
            </p>
          </div>
        </form>
      </div>

      {/* Google Maps Configuration Form */}
      <div className="space-y-3">
        <h3 className="font-extrabold text-white text-[11px] uppercase tracking-wider flex items-center gap-1.5">
          <Globe className="w-4 h-4 text-emerald-400" /> Configuration de l'API Google Maps
        </h3>
        <form onSubmit={handleSaveMapsKey} className="bg-slate-950 border border-slate-800 rounded-2xl p-4.5 space-y-3">
          
          <div className="space-y-1">
            <label className="text-gray-400 font-bold block text-[10px] uppercase">Clé d'API Google Maps (GOOGLE_MAPS_PLATFORM_KEY)</label>
            <input 
              type="password" 
              placeholder="AIzaSy..." 
              value={mapsKeyInput}
              onChange={(e) => setMapsKeyInput(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-[10.5px] text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          <div className="flex gap-2 pt-1 text-[11px]">
            <button
              type="submit"
              className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 rounded-lg transition text-center shadow-md shadow-emerald-950/20 active:scale-95"
            >
              {isSuccessSaveMaps ? 'Clé Enregistrée ! 🔄' : 'Brancher Google Maps'}
            </button>
            {isMapsConfigured && (
              <button
                type="button"
                onClick={handleClearMapsKey}
                className="bg-slate-900 border border-slate-800 text-gray-400 hover:text-white px-3 py-2 rounded-lg font-bold transition flex items-center justify-center"
                title="Vider la clé"
              >
                Retirer Clé
              </button>
            )}
          </div>

          <div className="flex items-start gap-2 bg-slate-900/40 p-2.5 rounded-lg text-[9.5px]/1.4 text-gray-400">
            <Info className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
            <p>
              Remplacera les maquettes de cartes vectorielles par de vraies cartes Google Maps interactives dans l'application Client et Livreur.
            </p>
          </div>
        </form>
      </div>

      {/* SQL Script Generator schema copy box */}
      <div className="space-y-2.5">
        <div className="flex justify-between items-center text-[11px]">
          <h3 className="font-extrabold text-white uppercase tracking-wider flex items-center gap-1.5">
            <Code className="w-4 h-4 text-purple-400" /> Schéma SQL Supabase (Copier/Coller)
          </h3>
          <button 
            onClick={copyToClipboard}
            className="text-white hover:text-rose-500 bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded-md font-bold text-[9.5px]"
          >
            {copiedSql ? 'Copié !' : 'Copier'}
          </button>
        </div>

        <div className="relative">
          <pre className="w-full h-[150px] bg-slate-950 border border-slate-850 rounded-2xl p-3.5 overflow-auto font-mono text-[9px]/1.4 text-purple-300 no-scrollbar select-all">
            {SUPABASE_SQL_SCHEMA}
          </pre>
        </div>
      </div>

    </div>
  );
}
