import { GameId, ServiceType } from '@/lib/games-config'

export interface User {
    id: number;
    email: string;
    name?: string;
    role: 'CLIENT' | 'BOOSTER' | 'ADMIN';
  }

export interface Service {
    id: number;
    game: GameId;
    type: ServiceType;
    name: string;
    description: string;
    price: number;
    duration: string;
    image?: string;
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
    serviceId: number;
    boosterId?: number | null;
    status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
    total: number;
    createdAt: Date;
    updatedAt?: Date;
    service?: Service;
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
    serviceId?: number; // ID do serviço do banco (se existir)
    game: GameId;
    serviceName: string;
    description?: string;
    currentRank?: string;
    targetRank?: string;
    price: number;
    duration?: string;
    metadata?: Record<string, any>; // Dados adicionais específicos do jogo
  }
