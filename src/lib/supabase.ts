/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { createClient } from '@supabase/supabase-js';
import { Restaurant, MenuItem, Order, ClientProfile, OrderStatus, MOCK_RESTAURANTS, MOCK_MENU_ITEMS, MOCK_PAST_ORDERS, MOCK_PROFILE } from '../types';

// Let's allow dynamic Supabase config from localStorage so that the user can test their real Supabase right in the browser!
const getSupabaseConfig = () => {
  const url = localStorage.getItem('DODO_SUPABASE_URL') || (import.meta as any).env?.VITE_SUPABASE_URL || '';
  const key = localStorage.getItem('DODO_SUPABASE_ANON_KEY') || (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || '';
  return { url, key };
};

export const isSupabaseConfigured = (): boolean => {
  const { url, key } = getSupabaseConfig();
  return url !== '' && key !== '';
};

// Lazy initialization of the Supabase Client
let cachedClient: ReturnType<typeof createClient> | null = null;

export const getSupabaseClient = () => {
  const { url, key } = getSupabaseConfig();
  if (!url || !key) return null;
  
  if (!cachedClient) {
    cachedClient = createClient(url, key);
  }
  return cachedClient;
};

// SQL Schema for the user to copy/paste directly inside their Supabase SQL Editor
export const SUPABASE_SQL_SCHEMA = `-- 1. Table des Restaurants
CREATE TABLE IF NOT EXISTS restaurants (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  rating NUMERIC DEFAULT 4.5,
  num_reviews INTEGER DEFAULT 0,
  prep_time TEXT,
  delivery_fee INTEGER DEFAULT 500,
  image_url TEXT,
  category TEXT NOT NULL
);

-- 2. Table du Menu
CREATE TABLE IF NOT EXISTS menu_items (
  id TEXT PRIMARY KEY,
  restaurant_id TEXT REFERENCES restaurants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price INTEGER NOT NULL,
  image_url TEXT,
  category TEXT NOT NULL
);

-- 3. Table des Profils
CREATE TABLE IF NOT EXISTS profiles (
  id TEXT PRIMARY KEY DEFAULT 'moussa_profile',
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  avatar_url TEXT,
  addresses TEXT[], -- Array of strings
  payment_methods TEXT[]
);

-- 4. Table des Commandes
CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  order_number TEXT NOT NULL,
  restaurant_id TEXT REFERENCES restaurants(id),
  subtotal INTEGER NOT NULL,
  delivery_fee INTEGER NOT NULL,
  total INTEGER NOT NULL,
  status TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  note TEXT,
  items JSONB NOT NULL, -- Stocker les plats au format JSON
  driver JSONB -- Stocker les infos du livreur
);

-- Insérer des données de test
INSERT INTO restaurants (id, name, description, rating, num_reviews, prep_time, delivery_fee, image_url, category)
VALUES 
('rest_fatou', 'Maquis Chez Fatou', 'Le meilleur de la cuisine traditionnelle du Faso dans un cadre chaleureux.', 4.6, 128, '20-30 min', 500, 'https://images.unsplash.com/photo-1544025162-d76694265947?w=600&auto=format&fit=crop&q=80', 'Plats principaux'),
('rest_gout', 'Le Bon Goût', 'Une explosion de saveurs africaines authentiques faites maison.', 4.4, 96, '25-35 min', 500, 'https://images.unsplash.com/photo-1604329760661-e71dc83f8f26?w=600&auto=format&fit=crop&q=80', 'Riz'),
('rest_saveurs', 'Saveurs d\\'Afrique', 'La diversité culinaire de la sous-région ouest-africaine à votre porte.', 4.7, 203, '20-30 min', 500, 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&auto=format&fit=crop&q=80', 'Grillades')
ON CONFLICT (id) DO NOTHING;

INSERT INTO menu_items (id, restaurant_id, name, description, price, image_url, category)
VALUES
('menu_fatou_1', 'rest_fatou', 'Riz gras au poulet', 'Riz gras parfumé avec poulet croustillant et légumes frais de saison.', 3000, 'https://images.unsplash.com/photo-1604329760661-e71dc83f8f26?w=500&auto=format&fit=crop&q=80', 'Riz'),
('menu_fatou_2', 'rest_fatou', 'Tô au sauce arachide', 'Pâte traditionnelle de mil ou maïs servie avec une sauce arachide onctueuse et boeuf.', 2500, 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=500&auto=format&fit=crop&q=80', 'Tô'),
('menu_fatou_3', 'rest_fatou', 'Soupe de légumes', 'Soupe traditionnelle aux légumes frais, légèrement pimentée.', 2000, 'https://images.unsplash.com/photo-1547592180-85f173990554?w=500&auto=format&fit=crop&q=80', 'Soupe'),
('menu_fatou_4', 'rest_fatou', 'Poulet braisé', 'Poulet braisé épicé, doré à la perfection, servi avec de l’attiéké.', 3500, 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=500&auto=format&fit=crop&q=80', 'Grillades')
ON CONFLICT (id) DO NOTHING;

INSERT INTO profiles (id, name, phone, email, avatar_url, addresses, payment_methods)
VALUES
('moussa_profile', 'Moussa Traoré', '+226 70 12 34 56', 'moussa.traore@gmail.com', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80', ARRAY['1200 Logements, Ouagadougou', 'Zone 1, Secteur 15, Ouagadougou'], ARRAY['Orange Money', 'Mobicash', 'Paiement à la livraison'])
ON CONFLICT (id) DO NOTHING;
`;

// Operations (Local storage Fallback + Live Supabase Sync)

// Initialize local storage with mock data if needed
const initLocalStorage = () => {
  if (!localStorage.getItem('DODO_RESTAURANTS')) {
    localStorage.setItem('DODO_RESTAURANTS', JSON.stringify(MOCK_RESTAURANTS));
  }
  if (!localStorage.getItem('DODO_MENU_ITEMS')) {
    localStorage.setItem('DODO_MENU_ITEMS', JSON.stringify(MOCK_MENU_ITEMS));
  }
  if (!localStorage.getItem('DODO_REVIEWS')) {
    localStorage.setItem('DODO_REVIEWS', JSON.stringify([] as any[]));
  }
  if (!localStorage.getItem('DODO_PROFILE')) {
    localStorage.setItem('DODO_PROFILE', JSON.stringify(MOCK_PROFILE));
  }
  if (!localStorage.getItem('DODO_ORDERS')) {
    localStorage.setItem('DODO_ORDERS', JSON.stringify(MOCK_PAST_ORDERS));
  }
};

initLocalStorage();

export async function fetchRestaurants(): Promise<Restaurant[]> {
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { data, error } = await (supabase as any).from('restaurants').select('*');
      if (error) throw error;
      if (data && data.length > 0) return data as Restaurant[];
    } catch (e) {
      console.warn('Supabase fetchRestaurants failed, falling back to local data:', e);
    }
  }
  return JSON.parse(localStorage.getItem('DODO_RESTAURANTS') || '[]');
}

export async function fetchMenuItems(restaurantId?: string): Promise<MenuItem[]> {
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      let query = (supabase as any).from('menu_items').select('*');
      if (restaurantId) {
        query = query.eq('restaurant_id', restaurantId);
      }
      const { data, error } = await query;
      if (error) throw error;
      if (data && data.length > 0) return data as MenuItem[];
    } catch (e) {
      console.warn('Supabase fetchMenuItems failed, falling back to local data:', e);
    }
  }
  const allItems: MenuItem[] = JSON.parse(localStorage.getItem('DODO_MENU_ITEMS') || '[]');
  if (restaurantId) {
    return allItems.filter(item => item.restaurant_id === restaurantId);
  }
  return allItems;
}

export async function fetchProfile(): Promise<ClientProfile> {
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { data, error } = await (supabase as any).from('profiles').select('*').eq('id', 'moussa_profile').single();
      if (error) throw error;
      if (data) return data as ClientProfile;
    } catch (e) {
      console.warn('Supabase fetchProfile failed, falling back to local data:', e);
    }
  }
  return JSON.parse(localStorage.getItem('DODO_PROFILE') || '{}');
}

export async function saveProfile(profile: ClientProfile): Promise<void> {
  localStorage.setItem('DODO_PROFILE', JSON.stringify(profile));
  
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { error } = await (supabase as any).from('profiles').upsert({
        id: 'moussa_profile',
        name: profile.name,
        phone: profile.phone,
        email: profile.email,
        avatar_url: profile.avatar_url,
        addresses: profile.addresses,
        payment_methods: profile.payment_methods,
      });
      if (error) throw error;
    } catch (e) {
      console.error('Supabase saveProfile failed:', e);
    }
  }
}

export async function fetchOrders(): Promise<Order[]> {
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      // Fetch orders from Supabase. Just select all orders
      const { data, error } = await (supabase as any).from('orders').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      if (data && data.length > 0) {
        // Parse metadata and transform items appropriately
        return data.map((d: any) => {
          const rest = MOCK_RESTAURANTS.find(r => r.id === d.restaurant_id) || MOCK_RESTAURANTS[0];
          return {
            id: d.id,
            order_number: d.order_number,
            restaurant: rest,
            items: typeof d.items === 'string' ? JSON.parse(d.items) : d.items,
            status: d.status as OrderStatus,
            status_times: {
              confirmed: '09:41',
              preparing: '09:45',
              ready: '09:55',
              on_the_way: '10:00',
            },
            subtotal: d.subtotal,
            delivery_fee: d.delivery_fee,
            total: d.total,
            note: d.note,
            created_at: new Date(d.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }),
            driver: d.driver
          };
        });
      }
    } catch (e) {
      console.warn('Supabase fetchOrders failed, falling back to local data:', e);
    }
  }
  return JSON.parse(localStorage.getItem('DODO_ORDERS') || '[]');
}

export async function insertOrder(order: Order): Promise<void> {
  const existingOrders = JSON.parse(localStorage.getItem('DODO_ORDERS') || '[]');
  existingOrders.unshift(order);
  localStorage.setItem('DODO_ORDERS', JSON.stringify(existingOrders));

  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { error } = await (supabase as any).from('orders').insert({
        id: order.id,
        order_number: order.order_number,
        restaurant_id: order.restaurant.id,
        subtotal: order.subtotal,
        delivery_fee: order.delivery_fee,
        total: order.total,
        status: order.status,
        note: order.note || '',
        items: JSON.stringify(order.items),
        driver: JSON.stringify(order.driver)
      });
      if (error) throw error;
      console.log('Order sync success to Supabase!');
    } catch (e) {
      console.error('Supabase insertOrder failed, only saved locally:', e);
    }
  }
}

export async function updateOrderStatus(orderId: string, status: OrderStatus): Promise<void> {
  const existingOrders = JSON.parse(localStorage.getItem('DODO_ORDERS') || '[]');
  const updatedOrders = existingOrders.map((order: any) => 
    order.id === orderId ? { ...order, status } : order
  );
  localStorage.setItem('DODO_ORDERS', JSON.stringify(updatedOrders));

  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { error } = await (supabase as any).from('orders').update({ status }).eq('id', orderId);
      if (error) throw error;
      console.log('Order status updated in Supabase!');
    } catch (e) {
      console.error('Supabase updateOrderStatus failed:', e);
    }
  }
}

export function resetLocalStorageDB() {
  localStorage.removeItem('DODO_RESTAURANTS');
  localStorage.removeItem('DODO_MENU_ITEMS');
  localStorage.removeItem('DODO_PROFILE');
  localStorage.removeItem('DODO_ORDERS');
  initLocalStorage();
}
