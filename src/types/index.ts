export interface User {
    id: string;
    email: string;
    name?: string;
    role: 'CLIENT' | 'BOOSTER' | 'ADMIN';
  }
  
  export interface Service {
    id: string;
    game: 'LOL' | 'CS2' | 'VALORANT';
    type: 'RANK_BOOST' | 'PLACEMENT' | 'COACHING' | 'ACCOUNT_LEVELING';
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
  }
  
  export interface Order {
    id: string;
    userId: string;
    serviceId: string;
    status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
    total: number;
    createdAt: Date;
  }