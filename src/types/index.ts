import { GameId } from '@/lib/games-config'

export interface User {
  id: number;
  email: string;
  name?: string;
  role: 'CLIENT' | 'BOOSTER' | 'ADMIN';
}

export interface GameRank {
  id: string;
  name: string;
  image: string;
  tier?: string;
  gameId?: GameId; // Jogo ao qual o rank pertence
}

export interface Order {
  id: number;
  userId: number;
  game: GameId;
  boosterId?: number | null;
  status: 'PENDING' | 'PAID' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  total: number;
  currentRank?: string | null;
  targetRank?: string | null;
  gameMode?: string | null;
  createdAt: Date;
  updatedAt?: Date;
  review?: {
    id: number;
    rating: number;
    comment?: string | null;
  } | null;
}

export interface Payment {
  id: number;
  orderId: number;
  total: number;
  pixCode: string;
  qrCode?: string;
  expiresAt: Date;
}

// Item do carrinho
export interface CartItem {
  game: GameId;
  serviceName: string;
  description?: string;
  currentRank?: string;
  targetRank?: string;
  price: number;
  duration?: string;
  metadata?: Record<string, any>; // Dados adicionais específicos do jogo
}
