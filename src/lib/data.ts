import { Service, GameRank } from '@/types'

export const lolRanks: GameRank[] = [
  { id: '1', name: 'Iron', image: '/ranks/lol/Season_2022_-_Iron.png', tier: 'I-IV' },
  { id: '2', name: 'Bronze', image: '/ranks/lol/Season_2022_-_Bronze.png', tier: 'I-IV' },
  { id: '3', name: 'Silver', image: '/ranks/lol/Season_2022_-_Silver.png', tier: 'I-IV' },
  { id: '4', name: 'Gold', image: '/ranks/lol/Season_2022_-_Gold.png', tier: 'I-IV' },
  { id: '5', name: 'Platinum', image: '/ranks/lol/Season_2022_-_Platinum.png', tier: 'I-IV' },
  { id: '6', name: 'Diamond', image: '/ranks/lol/Season_2022_-_Diamond.png', tier: 'I-IV' },
  { id: '7', name: 'Master', image: '/ranks/lol/Season_2022_-_Master.png' },
  { id: '8', name: 'Grandmaster', image: '/ranks/lol/Season_2022_-_Grandmaster.png' },
  { id: '9', name: 'Challenger', image: '/ranks/lol/Season_2022_-_Challenger.png' },
];


export const valorantRanks: GameRank[] = [
  { id: '1', name: 'Iron', image: '/ranks/valorant/iron.png', tier: '1-3' },
  { id: '2', name: 'Bronze', image: '/ranks/valorant/bronze.png', tier: '1-3' },
  { id: '3', name: 'Silver', image: '/ranks/valorant/silver.png', tier: '1-3' },
  { id: '4', name: 'Gold', image: '/ranks/valorant/gold.png', tier: '1-3' },
  { id: '5', name: 'Platinum', image: '/ranks/valorant/platinum.png', tier: '1-3' },
  { id: '6', name: 'Diamond', image: '/ranks/valorant/diamond.png', tier: '1-3' },
  { id: '7', name: 'Ascendant', image: '/ranks/valorant/ascendant.png', tier: '1-3' },
  { id: '8', name: 'Immortal', image: '/ranks/valorant/immortal.png', tier: '1-3' },
  { id: '9', name: 'Radiant', image: '/ranks/valorant/radiant.png' },
]

export const cs2Ranks: GameRank[] = [
  { id: '1', name: 'Silver I', image: '/ranks/cs2/silver1.png' },
  { id: '2', name: 'Silver II', image: '/ranks/cs2/silver2.png' },
  { id: '3', name: 'Silver Elite', image: '/ranks/cs2/silverelite.png' },
  { id: '4', name: 'Gold Nova I', image: '/ranks/cs2/goldnova1.png' },
  { id: '5', name: 'Gold Nova II', image: '/ranks/cs2/goldnova2.png' },
  { id: '6', name: 'Gold Nova Master', image: '/ranks/cs2/goldnovamaster.png' },
  { id: '7', name: 'Master Guardian I', image: '/ranks/cs2/mg1.png' },
  { id: '8', name: 'Master Guardian II', image: '/ranks/cs2/mg2.png' },
  { id: '9', name: 'Distinguished Master Guardian', image: '/ranks/cs2/dmg.png' },
  { id: '10', name: 'Legendary Eagle', image: '/ranks/cs2/le.png' },
  { id: '11', name: 'Supreme Master First Class', image: '/ranks/cs2/smfc.png' },
  { id: '12', name: 'The Global Elite', image: '/ranks/cs2/global.png' },
]

export const services: Service[] = [
  // League of Legends
  {
    id: '1',
    game: 'LOL',
    type: 'RANK_BOOST',
    name: 'Boost de Elo',
    description: 'Subimos seu elo até o rank desejado com segurança total',
    price: 25.90,
    duration: '1-3 dias'
  },
  {
    id: '2',
    game: 'LOL',
    type: 'PLACEMENT',
    name: 'MD10 Placement',
    description: 'Fazemos suas partidas de classificatória',
    price: 89.90,
    duration: '1 dia'
  },
  {
    id: '3',
    game: 'LOL',
    type: 'COACHING',
    name: 'Coaching Individual',
    description: 'Aulas personalizadas com coaches experientes',
    price: 45.90,
    duration: '1 hora'
  },
  
  // Valorant
  {
    id: '4',
    game: 'VALORANT',
    type: 'RANK_BOOST',
    name: 'Boost de Rank',
    description: 'Boost profissional até o rank desejado',
    price: 35.90,
    duration: '2-4 dias'
  },
  {
    id: '5',
    game: 'VALORANT',
    type: 'PLACEMENT',
    name: 'Placement Matches',
    description: 'Partidas de classificatória com alto win rate',
    price: 99.90,
    duration: '1 dia'
  },
  
  // Counter Strike 2
  {
    id: '6',
    game: 'CS2',
    type: 'RANK_BOOST',
    name: 'Prime Boost',
    description: 'Boost no sistema Prime do CS2',
    price: 29.90,
    duration: '2-5 dias'
  },
  {
    id: '7',
    game: 'CS2',
    type: 'COACHING',
    name: 'Demo Review',
    description: 'Análise profissional das suas partidas',
    price: 39.90,
    duration: '1 hora'
  }
]