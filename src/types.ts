export enum Screen {
  LOGIN,
  USER_DASHBOARD,
  CREATE_PLAYER,
  PRE_DRAFT,
  DRAFT,
  DASHBOARD,
  AWARDS_CEREMONY,
  PLAYOFFS,
  RETIREMENT,
  TROPHY_GALLERY,
  FREE_AGENCY,
  END_SEASON_REPORT,
  OFF_SEASON_TRAINING,
  LEAGUE_STANDINGS,
  LEAGUE,
  LEAGUE_SCREEN,
}

export enum Position {
  PG = "PG",
  SG = "SG",
  SF = "SF",
  PF = "PF",
  C = "C",
}

export enum Language {
  EN = 'en',
  PT_BR = 'pt-br',
}

export interface Translations {
  [key: string]: string | Translations;
}

export interface LanguageContextType {
  language: Language;
  setLanguage: (language: Language) => void;
  // FIX: Allow `t` function to return a whole translation object, not just a string.
  t: (key: string, replacements?: { [key:string]: string | number }) => string | Translations;
}

export interface User {
  id: string;
  email: string;
}

export interface PlayerStats {
  shooting: number;
  midrange: number;
  threepoint: number;
  finishing: number;
  defense: number;
  perimeter_d: number;
  athleticism: number;
  speed: number;
  playmaking: number;
  ball_handle: number;
  rebounding: number;
  strength: number;
  [key:string]: number;
}

export interface Game {
  id: number;
  opponent: string;
  result: "W" | "L";
  points: number;
  assists: number;
  rebounds: number;
  summary?: string; 
}

export interface SeasonStats {
  gamesPlayed: number;
  points: number;
  assists: number;
  rebounds: number;
  games: Game[];
  playoffGames: number;
  playoffWins: number;
  playoffLosses: number;
  momentum: number;
  eventsThisSeason: number;
}

export interface CareerSeason {
  season: number;
  team: string;
  gamesPlayed: number;
  points: number;
  assists: number;
  rebounds: number;
  championship: boolean;
  fmvp?: boolean;
  awards: string[];
}

export interface CareerStats {
  seasons: CareerSeason[];
  totalPoints: number;
  totalGames: number;
  championships: number;
}

export interface PlayoffSeries {
    name: string;
    opponent: string | null;
    team1Wins: number;
    team2Wins: number;
    games: (("W" | "L") | null)[];
    completed: boolean;
    opponentArchetype?: 'offensive_juggernaut' | 'defensive_lockdown' | 'pace_and_space' | 'dominant_big';
    opponentStarOverall?: number;
    lastGameStrategyResult?: {
        choiceId: string;
        successRate: number;
        outcome: 'success' | 'failure';
    };
}

export interface StrategyEffects {
    playerPerformanceBoost?: {
        points?: number; // % boost
        rebounds?: number; // % boost
        assists?: number; // % boost
    };
    teamOffenseBoost?: number; // a modifier to team strength
    teamDefenseBoost?: number; // a modifier to team strength
    opponentOffenseNerf?: number; // a modifier to opponent strength
    opponentDefenseNerf?: number; // a modifier to opponent strength
}

export interface PlayoffChoice {
    id: string;
    category: 'offensive' | 'defensive' | 'team';
    risk: 'low' | 'medium' | 'high';
    primaryStat: keyof PlayerStats;
    secondaryStat: keyof PlayerStats;
    personalityTrait?: 'confident' | 'hardworking' | 'maverick' | 'team_player' | 'aggressive';
    minStats?: Partial<PlayerStats>;
    successEffects: StrategyEffects;
    failureEffects: StrategyEffects;
}

export interface CoachReport {
  report: string;
  trainingFocus: string[];
}

export interface CollegeGame {
  opponent: string;
  points: number;
  assists: number;
  rebounds: number;
}

export interface PreDraftInterviewChoice {
  text: string;
  stockChange: number;
}

export interface PreDraftInterview {
  question: string;
  choices: PreDraftInterviewChoice[];
}

export interface EventChoice {
    text: string;
    outcome: {
        description: string;
        effects: {
            momentum?: number;
            overall?: number;
            stats?: Partial<PlayerStats>;
            relationships?: Array<{ person: string; change: number }>;
            isClutch?: boolean;
        }
    };
}

export interface GameEvent {
    title: string;
    description: string;
    choices: EventChoice[];
}

export interface EventHistoryItem {
    title: string;
    choice: string;
    outcome: string;
}

export interface NewsHeadline {
    headline: string;
    source: string;
}

export interface PlayoffMatchup {
    id: string; // e.g., 'E-1v8' or 'W-SF1'
    team1: { code: string; seed: number; };
    team2: { code: string; seed: number; };
    team1Wins: number;
    team2Wins: number;
    winner: string | null; // team code
    isPlayerMatchup: boolean;
    nextMatchupId: string | null;
}

export interface PlayoffConferenceBracket {
    'First Round': PlayoffMatchup[];
    'Conference Semifinals': PlayoffMatchup[];
    'Conference Finals': PlayoffMatchup[];
    champion: string | null;
}

export interface PlayoffBracket {
    East: PlayoffConferenceBracket;
    West: PlayoffConferenceBracket;
    'NBA Finals': PlayoffMatchup | null;
    'NBA Champion': string | null;
}


// --- PHONE INTERFACE TYPES ---

export enum PhoneApp {
  HOME,
  SOCIAL,
  NEWS,
  CONTACTS,
  DATING,
}

export interface Tweet {
  id: string;
  author: string;
  handle: string;
  avatar: string;
  content: string;
  likes: number;
  retweets: number;
  isVerified: boolean;
  comments: Tweet[];
  retweetOf?: Tweet;
}

export interface SocialNotification {
  id: string;
  type: 'reply' | 'mention' | 'like';
  tweetId: string;
  fromUser: {
    author: string;
    handle: string;
    avatar: string;
  };
  textPreview: string;
}

export interface Message {
  id: string;
  sender: 'player' | string; // 'player' or contact's name
  text: string;
  timestamp: number;
}

export interface Contact {
  id: string;
  name: string;
  type: 'Agent' | 'Coach' | 'Teammate' | 'Celebrity' | 'Family' | 'Date';
  avatar: string;
  personality: string; // For AI context
  conversation: Message[];
}

export interface DatingProfile {
  id: string;
  name: string;
  occupation: string;
  bio: string;
  avatar: string;
  personality: string;
}

export interface Player {
  id: string;
  careerId: string;
  lastUpdated: number;
  name: string;
  position: Position;
  bio: string;
  team: string;
  stats: PlayerStats;
  seasonStats: SeasonStats;
  careerStats: CareerStats;
  achievements: string[];
  draftPick: number;
  overall: number;
  draftStock: number;
  currentSeason: number;
  trophyCounts: { [key: string]: number };
  teammates: RosterPlayer[];
  playoffSeries: PlayoffSeries[];
  currentPlayoffRound: number;
  endOfSeasonReport?: CoachReport;
  coachingHistory: { [teamCode: string]: CoachReport };
  preDraftGames?: CollegeGame[];
  relationships: { [key: string]: number };
  teamChemistry: number;
  currentEvent: GameEvent | null;
  eventHistory: EventHistoryItem[];
  news: NewsHeadline[];
  lastNewsUpdateGame: number;
  schedule: string[];
  playoffBracket: PlayoffBracket | null;
  isClutch?: boolean;

  // Phone state
  phone: {
    socialFeed: Tweet[];
    contacts: Contact[];
    datingProfiles: DatingProfile[];
    datingMatches: string[];
    currentPartner: string | null;
    socialProfile: {
      bio: string;
      avatarUrl: string;
    };
    socialNotifications: SocialNotification[];
    tweetReactionQueue: Tweet[];
    likedTweetIds: string[];
    retweetedTweetIds: string[];
    lastSocialUpdateGamesPlayed: number;
  };
}

export interface RosterPlayer {
  name: string;
  position: Position;
  secondaryPosition?: Position | "";
  overall: number;
  personality?: 'star_player' | 'veteran_leader' | 'young_prospect' | 'role_player' | 'locker_room_prankster' | 'defensive_anchor' | 'mercenary';
}

export interface Team {
  name: string;
  conference: "East" | "West";
  division: string;
  logo: string;
  roster: RosterPlayer[];
  coach: {
    name: string;
    personality: 'old_school_disciplinarian' | 'players_coach' | 'tactical_genius' | 'motivational_leader';
    avatar: string;
  };
  primaryColor: string;
  secondaryColor: string;
}

export interface AllTeams {
  [key: string]: Team;
}

export interface Trophy {
  id: string;
}

export interface Achievement {
  id: string;
}

export interface Notification {
  id: number;
  type: 'achievement' | 'trophy' | 'event';
  title: string;
  description: string;
}

export interface RetirementChoiceModalProps {
    season: number;
    onDecision: (retire: boolean) => void;
}

export type LeagueStandings = { [teamCode: string]: { wins: number; losses: number; } };

export interface League {
  id: string;
  name: string;
  commissionerId: string;
  players: string[];
  teams: Team[];
  schedule: Game[];
  standings: LeagueStandings;
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