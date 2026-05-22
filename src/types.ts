/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Restaurant {
  id: string;
  name: string;
  description: string;
  rating: number;
  num_reviews: number;
  prep_time: string;
  delivery_fee: number; // in FCFA
  image_url: string;
  category: string; // e.g., "Riz", "Tô", "Soupe", "Grillades"
}

export interface MenuItem {
  id: string;
  restaurant_id: string;
  name: string;
  description: string;
  price: number; // in FCFA
  image_url: string;
  category: string; // "Entrée", "Plat principal", "Dessert", "Boisson"
  is_available?: boolean; // availability toggle supporting Dodo Vendeur
}

export interface CartItem {
  menu_item: MenuItem;
  quantity: number;
  addedBy?: string;
}

export type OrderStatus = 'Confirmée' | 'En préparation' | 'Prête' | 'En route' | 'Livré' | 'Annulée' | 'En attente de paiement';

export interface Order {
  id: string;
  order_number: string;
  restaurant: Restaurant;
  items: CartItem[];
  status: OrderStatus;
  status_times: {
    confirmed: string;
    preparing: string;
    ready: string;
    on_the_way: string;
    delivered?: string;
  };
  subtotal: number;
  delivery_fee: number;
  total: number;
  note?: string;
  created_at: string;
  driver?: {
    name: string;
    avatar: string;
    rating: number;
    phone: string;
  };
  delivery_mode?: 'now' | 'scheduled';
  scheduled_time?: string;
  is_group_order?: boolean;
  payment_method?: string;
}

export interface ClientProfile {
  name: string;
  phone: string;
  email: string;
  avatar_url: string;
  addresses: string[];
  payment_methods: string[];
}

// Mock Data matching the mockups exactly
export const MOCK_RESTAURANTS: Restaurant[] = [
  {
    id: 'rest_fatou',
    name: 'Maquis Chez Fatou',
    description: 'Le meilleur de la cuisine traditionnelle du Faso dans un cadre chaleureux.',
    rating: 4.6,
    num_reviews: 128,
    prep_time: '20-30 min',
    delivery_fee: 500,
    image_url: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=600&auto=format&fit=crop&q=80',
    category: 'Plats principaux',
  },
  {
    id: 'rest_gout',
    name: 'Le Bon Goût',
    description: 'Une explosion de saveurs africaines authentiques faites maison.',
    rating: 4.4,
    num_reviews: 96,
    prep_time: '25-35 min',
    delivery_fee: 500,
    image_url: 'https://images.unsplash.com/photo-1604329760661-e71dc83f8f26?w=600&auto=format&fit=crop&q=80',
    category: 'Riz',
  },
  {
    id: 'rest_saveurs',
    name: "Saveurs d'Afrique",
    description: 'La diversité culinaire de la sous-région ouest-africaine à votre porte.',
    rating: 4.7,
    num_reviews: 203,
    prep_time: '20-30 min',
    delivery_fee: 500,
    image_url: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&auto=format&fit=crop&q=80',
    category: 'Grillades',
  }
];

export const MOCK_MENU_ITEMS: MenuItem[] = [
  // Maquis Chez Fatou
  {
    id: 'menu_fatou_1',
    restaurant_id: 'rest_fatou',
    name: 'Riz gras au poulet',
    description: 'Riz parfumé avec poulet croustillant et légumes frais de saison.',
    price: 3000,
    image_url: 'https://images.unsplash.com/photo-1604329760661-e71dc83f8f26?w=500&auto=format&fit=crop&q=80',
    category: 'Riz'
  },
  {
    id: 'menu_fatou_2',
    restaurant_id: 'rest_fatou',
    name: 'Tô au sauce arachide',
    description: 'Pâte traditionnelle de mil ou maïs servie avec une sauce arachide onctueuse et boeuf.',
    price: 2500,
    image_url: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=500&auto=format&fit=crop&q=80',
    category: 'Tô'
  },
  {
    id: 'menu_fatou_3',
    restaurant_id: 'rest_fatou',
    name: 'Soupe de légumes',
    description: 'Soupe traditionnelle aux légumes frais, légèrement pimentée avec sauce locale et viande.',
    price: 2000,
    image_url: 'https://images.unsplash.com/photo-1547592180-85f173990554?w=500&auto=format&fit=crop&q=80',
    category: 'Soupe'
  },
  {
    id: 'menu_fatou_4',
    restaurant_id: 'rest_fatou',
    name: 'Poulet braisé',
    description: 'Poulet braisé épicé, doré à la perfection, servi avec de l’attiéké et oignons.',
    price: 3500,
    image_url: 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=500&auto=format&fit=crop&q=80',
    category: 'Grillades'
  },

  // Le Bon Goût
  {
    id: 'menu_gout_1',
    restaurant_id: 'rest_gout',
    name: 'Alloco avec poisson frit',
    description: 'Bananes plantains frites dorées, servies avec un poisson frit mariné et sauce piment.',
    price: 2800,
    image_url: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=500&auto=format&fit=crop&q=80',
    category: 'Grillades'
  },
  {
    id: 'menu_gout_2',
    restaurant_id: 'rest_gout',
    name: 'Riz au gras de boeuf',
    description: 'Recette gourmande de riz gras parfumé avec de tendres morceaux de boeuf.',
    price: 3200,
    image_url: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=500&auto=format&fit=crop&q=80',
    category: 'Riz'
  },
  {
    id: 'menu_gout_3',
    restaurant_id: 'rest_gout',
    name: 'Kédjénou de poulet',
    description: 'Ragoût de poulet mijoté à l’étouffée avec légumes, oignons et piment frais.',
    price: 3400,
    image_url: 'https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?w=500&auto=format&fit=crop&q=80',
    category: 'Soupe'
  },

  // Saveurs d'Afrique
  {
    id: 'menu_saveurs_1',
    restaurant_id: 'rest_saveurs',
    name: 'Garba ivoirien',
    description: 'Attiéké traditionnel avec du thon frit mariné, piment vert frais et oignons hachés.',
    price: 1500,
    image_url: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=500&auto=format&fit=crop&q=80',
    category: 'Grillades'
  },
  {
    id: 'menu_saveurs_2',
    restaurant_id: 'rest_saveurs',
    name: 'Sauce Gombo avec Tô',
    description: 'Délicieuse pâte de mil tiède accompagnée d’une sauce gombo collante au boeuf tripes.',
    price: 2000,
    image_url: 'https://images.unsplash.com/photo-1547592180-85f173990554?w=500&auto=format&fit=crop&q=80',
    category: 'Tô'
  },
  {
    id: 'menu_saveurs_3',
    restaurant_id: 'rest_saveurs',
    name: 'Mafé de boeuf',
    description: 'Boeuf mijoté longuement dans une onctueuse sauce de pâte d’arachide parfumée.',
    price: 2900,
    image_url: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=500&auto=format&fit=crop&q=80',
    category: 'Riz'
  }
];

export const MOCK_PROFILE: ClientProfile = {
  name: 'Moussa Traoré',
  phone: '+226 70 12 34 56',
  email: 'moussa.traore@gmail.com',
  avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
  addresses: ['1200 Logements, Ouagadougou', 'Zone 1, Secteur 15, Ouagadougou', 'Ouaga 2000, Villa 45'],
  payment_methods: ['Orange Money', 'Moov Money', 'Wave', 'Telecel Money', 'PayPal'],
};

export const MOCK_PAST_ORDERS: Order[] = [
  {
    id: 'order_1',
    order_number: '#DODO12345',
    restaurant: MOCK_RESTAURANTS[0], // Maquis Chez Fatou
    items: [
      { menu_item: MOCK_MENU_ITEMS[0], quantity: 1 }, // Riz gras au poulet (3000)
      { menu_item: MOCK_MENU_ITEMS[1], quantity: 1 }  // Tô sauce arachide (2500)
    ],
    status: 'En route',
    status_times: {
      confirmed: '09:41',
      preparing: '09:45',
      ready: '09:55',
      on_the_way: '10:00',
    },
    subtotal: 5500,
    delivery_fee: 500,
    total: 6000,
    note: 'Pas de piment, s\'il vous plaît.',
    created_at: '21 mai 2026',
    driver: {
      name: 'Blaise K.',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
      rating: 4.8,
      phone: '+226 76 89 90 22'
    }
  },
  {
    id: 'order_2',
    order_number: '#DODO12344',
    restaurant: MOCK_RESTAURANTS[1], // Le Bon Goût
    items: [
      { menu_item: MOCK_MENU_ITEMS[4], quantity: 1 }, // Alloco (2800)
      { menu_item: MOCK_MENU_ITEMS[5], quantity: 1 }  // Riz gras de boeuf (3200)
    ],
    status: 'Livré',
    status_times: {
      confirmed: '12:10',
      preparing: '12:20',
      ready: '12:35',
      on_the_way: '12:40',
      delivered: '13:02'
    },
    subtotal: 6000,
    delivery_fee: 500,
    total: 6500,
    created_at: '18 mai 2026'
  },
  {
    id: 'order_3',
    order_number: '#DODO12343',
    restaurant: MOCK_RESTAURANTS[2], // Saveurs d'Afrique
    items: [
      { menu_item: MOCK_MENU_ITEMS[7], quantity: 2 }, // Garba ivoirien (1500 * 2 = 3000)
      { menu_item: MOCK_MENU_ITEMS[8], quantity: 1 }  // Sauce gombo (2000)
    ],
    status: 'Livré',
    status_times: {
      confirmed: '19:05',
      preparing: '19:15',
      ready: '19:30',
      on_the_way: '19:35',
      delivered: '19:58'
    },
    subtotal: 5000,
    delivery_fee: 500,
    total: 5500,
    created_at: '15 mai 2026'
  },
  {
    id: 'order_4',
    order_number: '#DODO12342',
    restaurant: MOCK_RESTAURANTS[0], // Maquis Chez Fatou
    items: [
      { menu_item: MOCK_MENU_ITEMS[2], quantity: 1 }, // Soupe légumes (2000)
      { menu_item: MOCK_MENU_ITEMS[1], quantity: 1 }  // Tô arachide (2500)
    ],
    status: 'Livré',
    status_times: {
      confirmed: '11:00',
      preparing: '11:15',
      ready: '11:30',
      on_the_way: '11:35',
      delivered: '11:55'
    },
    subtotal: 4500,
    delivery_fee: 500,
    total: 5000,
    created_at: '10 mai 2026'
  }
];
