export interface Player {
  id: string;
  name: string;
  team: Team | null;
  // Atributos de RPG
  attributes: {
    strength: number;
    dexterity: number;
    intelligence: number;
    charisma: number;
  };
  // Estatísticas da temporada
  stats: {
    wins: number;
    losses: number;
  };
}

export interface Team {
  id: string;
  name: string;
  players: Player[];
}

export interface League {
  id: string;
  name: string;
  commissionerId: string;
  players: string[];
  teams: Team[];
  schedule: Game[];
  standings: LeagueStandings;
}

export interface Game {
  id: string;
  homeTeamId: string;
  awayTeamId: string;
  week: number;
  result: {
    homeScore: number;
    awayScore: number;
  } | null;
}

export interface LeagueStandings {
  [teamId: string]: {
    wins: number;
    losses: number;
  };
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  message: string;
  timestamp: number;
}

export interface GameState {
  players: { [id: string]: Player };
  leagues: { [id: string]: League };
}
