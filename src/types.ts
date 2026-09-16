export interface Product {
  id: string;
  name: string;
  price: string;
  image: string;
  description: string;
  paymentLink: string;
  category?: string;
  comboWith?: string;
  createdAt?: string;
}

export interface Purchase {
  id: string;
  userId: string;
  userEmail?: string;
  userName?: string;
  productId: string;
  productName: string;
  price: string;
  status: 'Aguardando pagamento' | 'Comprovante enviado' | 'Em produção' | 'Entregue';
  date: string;
  comprovanteUrl?: string;
}

export interface Review {
  id: string;
  productId: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  date: string;
}

export interface UserProfile {
  uid: string;
  nome: string;
  sobrenome: string;
  email: string;
  vendedor?: boolean;
}

export const PRODUCTS: Product[] = [];
