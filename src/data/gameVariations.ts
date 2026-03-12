// Placeholder for pre-generated game variations

interface GameSummaryVariation {
  summary: string;
}

interface CoachReportVariation {
  report: string;
  trainingFocus: string[];
}

interface PreDraftInterviewVariation {
  question: string;
  choices: { text: string; stockChange: number }[];
}

interface GameEventVariation {
  title: string;
  description: string;
  choices: {
    text: string;
    outcome: {
      description: string;
      effects: {
        momentum?: number;
        overall?: number;
        isClutch?: boolean;
        relationships?: { person: string; change: number }[];
      };
    };
  }[];
}

interface NewsHeadlineVariation {
  headline: string;
  source: string;
}

interface TweetVariation {
  author: string;
  handle: string;
  content: string;
  isVerified: boolean;
  gender: "male" | "female" | "neutral";
}

export const gameSummaryVariations: GameSummaryVariation[] = [
  { summary: "A performance eletrizante de [PlayerName] levou [TeamName] à vitória sobre [Opponent] com [Points] pontos!" },
  { summary: "[PlayerName] mostrou sua classe, orquestrando o ataque com [Assists] assistências e garantindo a vitória para [TeamName]." },
  { summary: "Mesmo com [Points] pontos de [PlayerName], [TeamName] não conseguiu segurar [Opponent] e sofreu uma derrota dolorosa." },
  { summary: "[PlayerName] dominou os rebotes com [Rebounds] e foi fundamental na defesa de [TeamName] contra [Opponent]." },
  { summary: "Um jogo de altos e baixos para [PlayerName], mas [TeamName] conseguiu a vitória apertada contra [Opponent]." },
];

export const coachReportVariations: CoachReportVariation[] = [
  { report: "Sua dedicação nesta temporada foi notável. Continue aprimorando sua defesa.", trainingFocus: ["defense", "athleticism"] },
  { report: "Precisamos ver mais consistência no ataque. Foque em seu arremesso e tomada de decisões.", trainingFocus: ["shooting", "playmaking"] },
  { report: "Você é um líder nato. Trabalhe sua força para dominar o garrafão.", trainingFocus: ["strength", "rebounding"] },
  { report: "Sua visão de jogo é excelente, mas o controle de bola precisa melhorar.", trainingFocus: ["ball_handle", "playmaking"] },
  { report: "Um ano sólido, mas há espaço para crescer. Concentre-se em sua finalização e defesa.", trainingFocus: ["finishing", "defense"] },
];

export const preDraftInterviewVariations: PreDraftInterviewVariation[] = [
  {
    question: "Como você lida com a pressão em momentos decisivos?",
    choices: [
      { text: "Eu prospero sob pressão, é onde eu brilho.", stockChange: 3 },
      { text: "Eu me preparo mentalmente e confio no meu treinamento.", stockChange: 1 },
      { text: "Às vezes me sinto sobrecarregado, mas tento focar.", stockChange: -2 },
    ],
  },
  {
    question: "Qual é o seu maior desafio ao se juntar a um novo time?",
    choices: [
      { text: "Aprender o sistema e me integrar rapidamente.", stockChange: 2 },
      { text: "Ganhar o respeito dos veteranos.", stockChange: 1 },
      { text: "Lidar com as expectativas da torcida.", stockChange: -1 },
    ],
  },
  {
    question: "Seu treinador te critica publicamente. Como você reage?",
    choices: [
      { text: "Aceito a crítica e trabalho para melhorar.", stockChange: 2 },
      { text: "Converso com ele em particular para entender.", stockChange: 1 },
      { text: "Fico chateado, mas tento não demonstrar.", stockChange: -3 },
    ],
  },
];

export const gameEventVariations: GameEventVariation[] = [
  {
    title: "Conflito no Vestiário",
    description: "Após uma derrota difícil, um companheiro de equipe mais velho critica abertamente seu desempenho.",
    choices: [
      {
        text: "Defendo-me e explico meu ponto de vista.",
        outcome: { description: "A discussão esquenta, mas vocês chegam a um entendimento. A química do time sofre um pouco, mas o respeito mútuo aumenta.", effects: { momentum: -1, relationships: [{ person: "[TeammateName]", change: 1 }] } },
      },
      {
        text: "Ouço em silêncio e prometo melhorar.",
        outcome: { description: "Seu companheiro de equipe aprecia sua humildade. A química do time melhora.", effects: { momentum: 1, relationships: [{ person: "[TeammateName]", change: 2 }] } },
      },
      {
        text: "Ignoro e saio do vestiário.",
        outcome: { description: "Seu companheiro de equipe fica irritado com sua falta de resposta. A química do time piora.", effects: { momentum: -2, relationships: [{ person: "[TeammateName]", change: -2 }] } },
      },
    ],
  },
  {
    title: "Proposta de Endosso",
    description: "Uma grande marca de tênis oferece um contrato de patrocínio lucrativo, mas exige que você use um modelo específico que não é o seu favorito.",
    choices: [
      {
        text: "Aceito o contrato e me adapto aos tênis.",
        outcome: { description: "Você ganha um grande contrato, mas sente um leve desconforto em quadra. Seu desempenho geral não é afetado, mas a mídia comenta sobre a mudança.", effects: { overall: 0 } },
      },
      {
        text: "Negocio para usar o modelo que prefiro.",
        outcome: { description: "A marca cede um pouco, mas o contrato é menos lucrativo. Você mantém seu conforto e desempenho.", effects: { overall: 0 } },
      },
      {
        text: "Recuso a oferta para manter meu conforto.",
        outcome: { description: "Você perde um grande contrato, mas sua integridade é elogiada. Sua confiança em quadra aumenta ligeiramente.", effects: { momentum: 1 } },
      },
    ],
  },
  {
    title: "Dilema Pessoal: Aniversário da Família",
    description: "O aniversário de um membro importante da sua família cai no mesmo dia de um jogo crucial fora de casa. Você prometeu estar lá.",
    choices: [
      {
        text: "Peço permissão para viajar e participar da festa.",
        outcome: { description: "O treinador não fica feliz, mas entende. Sua família fica muito feliz, mas a equipe sente sua falta no jogo, resultando em uma pequena queda na química.", effects: { relationships: [{ person: "[CoachName]", change: -1 }], overall: -1 } },
      },
      {
        text: "Explico à família que não poderei ir devido ao jogo.",
        outcome: { description: "Sua família fica um pouco desapontada, mas entende. O treinador e a equipe apreciam seu profissionalismo. A química do time melhora.", effects: { relationships: [{ person: "[FamilyMemberName]", change: -1 }], overall: 1 } },
      },
      {
        text: "Tento ir à festa e voltar a tempo, arriscando o cansaço.",
        outcome: { description: "Você consegue participar da festa e jogar, mas o cansaço afeta seu desempenho no jogo. Sua família fica feliz, mas o time percebe seu esforço extra.", effects: { momentum: -1, overall: -1 } },
      },
    ],
  },
];

export const newsHeadlineVariations: NewsHeadlineVariation[] = [
  { headline: "[PlayerName] Brilha em Vitória Crucial do [TeamName]", source: "ESPN" },
  { headline: "Rumores de Troca Envolvem [PlayerName] Após Início Lento", source: "The Athletic" },
  { headline: "[PlayerName] Lidera a Liga em [StatCategory]", source: "Bleacher Report" },
  { headline: "[TeamName] Busca Consistência, [PlayerName] É a Chave?", source: "Yahoo Sports" },
  { headline: "Análise: O Impacto de [PlayerName] no Desempenho do [TeamName]", source: "Sports Illustrated" },
];

export const socialMediaTweetVariations: TweetVariation[] = [
  { author: "FãBasquete", handle: "@BasqueteFan", content: "[PlayerName] é imparável! Que jogo incrível! #NBA #[TeamName]", isVerified: false, gender: "neutral" },
  { author: "AnalistaEsportivo", handle: "@AnaliseNBA", content: "A performance de [PlayerName] hoje foi de elite. Potencial de MVP. #NBA", isVerified: true, gender: "male" },
  { author: "HaterDaBola", handle: "@NaoGostoDeBasquete", content: "[PlayerName] só faz número quando o jogo não importa. Fraco na defesa. #Critica", isVerified: false, gender: "male" },
  { author: "NoticiasNBA", handle: "@NBANewsOficial", content: "[TeamName] anuncia nova contratação! O que isso significa para [PlayerName]?", isVerified: true, gender: "neutral" },
  { author: "FanaticaPelaNBA", handle: "@BballGirl", content: "Meu jogador favorito, [PlayerName], sempre entregando! #Go[TeamName]", isVerified: false, gender: "female" },
];

export const socialMediaInitialTweetVariations: TweetVariation[] = [
  { author: "Adrian Wojnarowski", handle: "@wojespn", content: "[PlayerName] é a escolha surpreendente do [TeamName] no Draft! Potencial enorme. #NBADraft", isVerified: true, gender: "male" },
  { author: "FãDoTime", handle: "@TimeFanatico", content: "Bem-vindo, [PlayerName]! Mal posso esperar para vê-lo em quadra! #[TeamName]", isVerified: false, gender: "neutral" },
  { author: "CéticoDaNBA", handle: "@CeticismoNBA", content: "[TeamName] arriscou demais com [PlayerName]. Não vejo o hype. #DraftFail", isVerified: false, gender: "male" },
  { author: "[TeamName] Oficial", handle: "@[TeamNameHandle]", content: "Bem-vindo à família, [PlayerName]! Estamos animados para o futuro! #[TeamName] #NBADraft", isVerified: true, gender: "neutral" },
  { author: "EntusiastaBasquete", handle: "@BballLover", content: "Que escolha interessante do [TeamName]! [PlayerName] pode ser um roubo no Draft. #NBADraft2024", isVerified: false, gender: "female" },
];

export const socialMediaCommentVariations: TweetVariation[] = [
  { author: "FãComenta", handle: "@ComentaNBA", content: "Concordo totalmente! [PlayerName] é o futuro!", isVerified: false, gender: "neutral" },
  { author: "Crítico", handle: "@CriticoDaBola", content: "Você deve estar brincando. Ele é superestimado.", isVerified: false, gender: "male" },
  { author: "Admiradora", handle: "@AdmiroBasquete", content: "Que jogador! [PlayerName] é demais!", isVerified: false, gender: "female" },
  { author: "AnalistaIndie", handle: "@AnaliseIndie", content: "Ainda é cedo para dizer, mas o potencial é inegável.", isVerified: false, gender: "neutral" },
  { author: "HaterOficial", handle: "@HaterOficial", content: "Ele não aguenta a pressão. Veremos no próximo jogo.", isVerified: false, gender: "male" },
];

export const celebrityTweetResponseVariations: TweetVariation[] = [
  { author: "[CelebrityName]", handle: "@[CelebrityHandle]", content: "Orgulhosa de você, [PlayerName]! Continue brilhando! ✨", isVerified: true, gender: "female" },
  { author: "[CelebrityName]", handle: "@[CelebrityHandle]", content: "Mandou bem, [PlayerName]! Próximo jogo é nosso!", isVerified: true, gender: "male" },
  { author: "[CelebrityName]", handle: "@[CelebrityHandle]", content: "Impressionante, como sempre. 😉", isVerified: true, gender: "female" },
  { author: "[CelebrityName]", handle: "@[CelebrityHandle]", content: "Isso aí, [PlayerName]! Foco no objetivo!", isVerified: true, gender: "male" },
];

export const contactResponseVariations: string[] = [
  "Entendido. Vou analisar isso e te retorno em breve.",
  "Deixe comigo. Falo com você assim que tiver novidades.",
  "Certo. Vou cuidar disso. Mantenho você atualizado.",
  "Recebido. Vou verificar e te dou um feedback.",
  "Ok. Vou dar uma olhada nisso. Te aviso qualquer coisa.",
];

export const conversationEventVariations: string[] = [
  "A conversa com [ContactName] parece estar indo bem. Você sente que a relação está se aprofundando.",
  "A conversa com [ContactName] foi um pouco tensa. Vocês não parecem estar na mesma página.",
  "Você e [ContactName] tiveram uma conversa divertida e leve. A relação parece estar em um bom caminho.",
  "A conversa com [ContactName] foi mais séria do que o esperado. Há alguns pontos a serem resolvidos.",
  "A conversa com [ContactName] foi breve, mas produtiva. Vocês se entenderam rapidamente.",
];
