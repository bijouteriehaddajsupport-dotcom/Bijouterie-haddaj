export type Collection = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  is_featured: boolean;
  sort_order: number;
  /** Choix de taille (5 à 10, facultatif) proposé pour les produits de la collection */
  requires_size?: boolean;
  created_at?: string;
};

export type Product = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  details: string | null;
  price: number;
  compare_at_price: number | null;
  category: string;
  material: string | null;
  collection_id: string | null;
  collection?: { name: string; slug: string; requires_size?: boolean } | null;
  images: string[];
  stock: number;
  is_featured: boolean;
  is_new: boolean;
  is_active: boolean;
  /** Hérité de la collection : le client peut choisir une taille */
  requires_size?: boolean;
  /** Livraison gratuite (par défaut) ; sinon 25 DH ajoutés à la commande */
  free_shipping?: boolean;
  created_at?: string;
};

export type OrderStatus = "pending" | "confirmed" | "postponed" | "shipped" | "delivered" | "cancelled";

export type OrderItem = {
  id?: string;
  product_id?: string | null;
  product_name: string;
  product_image: string | null;
  unit_price: number;
  quantity: number;
  line_total: number;
  size?: string | null;
};

export type Order = {
  id: string;
  order_number: string;
  user_id: string | null;
  customer_name: string;
  email: string | null;
  phone: string;
  address: string;
  city: string | null;
  postal_code: string | null;
  country: string;
  notes: string | null;
  subtotal: number;
  shipping: number;
  total: number;
  status: OrderStatus;
  payment_method: string;
  receipt_name?: string | null;
  show_price_on_receipt?: boolean;
  is_gift?: boolean;
  /** Date de livraison prévue (AAAA-MM-JJ), fixée par l'admin */
  delivery_date?: string | null;
  delivery_reminder_sent?: boolean;
  created_at: string;
  order_items?: OrderItem[];
};

export type AdminNotification = {
  id: string;
  type: string;
  title: string;
  message: string | null;
  order_id: string | null;
  is_read: boolean;
  created_at: string;
};

export type CartItem = {
  productId: string;
  slug: string;
  name: string;
  collection: string | null;
  image: string | null;
  price: number;
  /** Prix initial barré (promotion), si supérieur au prix de vente */
  compareAt?: number | null;
  /** Taille choisie (5 à 10) si la collection la propose */
  size?: string | null;
  /** Le produit appartient à une collection qui propose une taille */
  sizable?: boolean;
  /** Produit sans livraison gratuite : 25 DH de livraison */
  paidShipping?: boolean;
  quantity: number;
  stock: number;
};
