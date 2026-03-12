import { Game, Player, CareerSeason, CoachReport, PreDraftInterview, GameEvent, NewsHeadline, Position, Tweet, Contact, Message, LanguageContextType, Translations, Language, DatingProfile } from "../types";
import { TEAMS, ATTRIBUTES } from "../constants";
import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";

declare const puter: any; // Declare puter global for TypeScript

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

const generateAvatar = (seed: string) => `https://api.dicebear.com/8.x/adventurer/svg?seed=${encodeURIComponent(seed)}`;

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

const convertSchema = (schema: any): any => {
    if (!schema) return undefined;
    
    const typeMap: { [key: string]: Type } = {
        "string": Type.STRING,
        "number": Type.NUMBER,
        "integer": Type.INTEGER,
        "boolean": Type.BOOLEAN,
        "array": Type.ARRAY,
        "object": Type.OBJECT,
        "null": Type.NULL
    };

    const newSchema: any = {
        type: typeMap[schema.type] || Type.TYPE_UNSPECIFIED
    };

    if (schema.properties) {
        newSchema.properties = {};
        for (const key in schema.properties) {
            newSchema.properties[key] = convertSchema(schema.properties[key]);
        }
    }

    if (schema.items) {
        newSchema.items = convertSchema(schema.items);
    }

    if (schema.required) {
        newSchema.required = schema.required;
    }

    if (schema.description) {
        newSchema.description = schema.description;
    }

    return newSchema;
};

const generateContentWithRetry = async (
    prompt: string,
    modelName: string = "gemini-3-flash-preview",
    schema?: any,
    maxRetries: number = 2
): Promise<any> => {
    let attempt = 0;
    
    // Ensure we use a valid Gemini model
    const geminiModel = "gemini-3-flash-preview";

    while (attempt <= maxRetries) {
        try {
            const config: any = {};
            if (schema) {
                config.responseMimeType = "application/json";
                config.responseSchema = convertSchema(schema);
            }

            const response: GenerateContentResponse = await ai.models.generateContent({
                model: geminiModel,
                contents: [{ parts: [{ text: prompt }] }],
                config
            });

            const text = response.text;
            
            if (!text) {
                throw new Error("Received empty response from AI.");
            }
            
            return schema ? JSON.parse(text) : text;
        } catch (error: any) {
            console.error(`Gemini API error (Attempt ${attempt + 1}):`, error);
            if (attempt < maxRetries) {
                attempt++;
                const delayTime = Math.pow(2, attempt) * 1000 + Math.random() * 1000;
                console.warn(`AI API error. Retrying in ${delayTime.toFixed(0)}ms... (Attempt ${attempt}/${maxRetries})`);
                await delay(delayTime);
            } else {
                throw error;
            }
        }
    }
    throw new Error("Exhausted all retries for content generation.");
};

const teamNameLogoMap = Object.values(TEAMS).reduce((acc, team) => {
    acc[team.name] = team.logo;
    return acc;
}, {} as { [key: string]: string });

const knownReporters: { [key: string]: { avatar: string; handle: string; } } = {
    'Adrian Wojnarowski': {
        avatar: generateAvatar('Adrian Wojnarowski'),
        handle: '@wojespn'
    },
    'Shams Charania': {
        avatar: generateAvatar('Shams Charania'),
        handle: '@ShamsCharania'
    }
};

const getAvatarUrl = (gender: 'male' | 'female' | 'neutral' | undefined, id: string): string => {
    const randomId = id.slice(-12);
    return generateAvatar(randomId);
};

export const generateGameSummary = async (game: Game, player: Player, language: Language): Promise<string> => {
    const { name: playerName, position, team } = player;
    const teamName = TEAMS[team].name;
    const { points, rebounds, assists, opponent, result } = game;
    const targetLanguage = language === 'pt-br' ? 'Brazilian Portuguese' : 'English';

    const prompt = `
    You are a creative TV sports analyst with a flair for dramatic storytelling.
    Generate a short, punchy, narrative summary (2-3 sentences) in ${targetLanguage}.

    Your tone should vary. Sometimes be analytical, sometimes be full of hype, sometimes focus on a narrative (e.g., a "quiet hero" or a "valiant effort in a loss"). Do NOT use the same phrases repeatedly across different summaries. Be highly creative and diverse in your responses.

    Game Context:
    - Player: ${playerName} (${position})
    - Player's Team: ${teamName}
    - Opponent: ${opponent}
    - Result: ${result === 'W' ? 'Win' : 'Loss'}
    - Player's Stats: ${points} PTS, ${rebounds} REB, ${assists} AST

    Highlight the player's performance in the context of the game's outcome.

    Example (Hype Tone): "It was the ${playerName} show tonight! He absolutely torched the ${opponent}, dropping ${points} points in a dominant performance that led the ${teamName} to a crucial victory."
    Example (Narrative Tone for a Loss): "Despite a heroic ${points}-point effort from ${playerName}, it was a heartbreaking loss for the ${teamName}. He left it all on the floor, but the ${opponent} proved to be too much in the end."
    Example (Analytical Tone): "${playerName} orchestrated the offense beautifully, notching ${assists} assists to go with his ${points} points. His efficient play was the key factor in the ${teamName}'s win over the ${opponent}."

    Do not use markdown. Generate the summary now.
  `;
  
    try {
        return await generateContentWithRetry(prompt, "deepseek-chat");
    } catch (error) {
        console.error("Error generating game summary:", error);
        return language === 'pt-br'
            ? "O serviço de IA está com alta demanda. O resumo do jogo não está disponível."
            : "The AI service is experiencing high demand. Game summary is unavailable.";
    }
};

export const generatePlayerBio = async (name: string, position: Position, language: Language): Promise<string> => {
  const targetLanguage = language === 'pt-br' ? 'Brazilian Portuguese' : 'English';

  const prompt = `
    You are a creative sports writer crafting a compelling backstory for a new NBA draft prospect.
    Player Name: ${name || 'A promising rookie'}
    Position: ${position}
    Generate a short, engaging biography (2-3 sentences) in ${targetLanguage}.
    The bio should describe the player's personality, background, and on-court mentality.
    Make it sound like a real scout's report or a sports documentary intro.
    Example: 'A quiet kid from a small town with a chip on his shoulder, known for his relentless work ethic and calm demeanor under pressure.'
    Do not use markdown.
  `;

  try {
    return await generateContentWithRetry(prompt, "deepseek-chat");
  } catch (error) {
    console.error("Error generating player bio after retries:", error);
    return language === 'pt-br'
      ? "O serviço de IA está com alta demanda. Por favor, escreva a bio manualmente."
      : "The AI service is experiencing high demand. Please write the bio manually.";
  }
};


export const generateCoachFeedback = async (player: Player, season: CareerSeason, language: Language, coach: { name: string; personality: string; }, previousReport: CoachReport | undefined): Promise<CoachReport> => {
  const fallbackReport: CoachReport = {
      report: language === 'pt-br'
          ? "O Treinador IA está indisponível devido à alta demanda. Seu relatório de Fim de Temporada estará disponível mais tarde."
          : "The AI Coach is unavailable due to high demand. Your End of Season report will be available later.",
      trainingFocus: ['shooting', 'defense']
  };

    const coachPersonaInstructions: { [key: string]: string } = {
        old_school_disciplinarian: "You are an old-school, no-nonsense coach. Your feedback is brutally honest, direct, and you're not afraid to use strong, intense language—even some mild PG-13 swearing—to get your point across. You value toughness, discipline, and fundamentals above all else.",
        players_coach: "You are a players' coach. You're supportive, encouraging, and focus on building confidence. You connect with your players on a personal level, highlighting their their strengths while gently guiding them on their weaknesses. Your tone is positive and motivational.",
        tactical_genius: "You are a tactical genius, a master of X's and O's. Your feedback is analytical, data-driven, and highly specific. You break down the game in complex ways, focusing on efficiency, decision-making, and positioning. Your tone is intelligent and precise.",
        motivational_leader: "You are a great motivational leader. Your feedback is passionate, inspiring, and focuses on the bigger picture—heart, effort, and legacy. You use powerful stories and metaphors to challenge your player to be great. Your tone is charismatic and uplifting."
    };

    const persona = coachPersonaInstructions[coach.personality] || coachPersonaInstructions.players_coach;

  const targetLanguage = language === 'pt-br' ? 'Brazilian Portuguese' : 'English';
  const ppg = season.gamesPlayed > 0 ? (season.points / season.gamesPlayed).toFixed(1) : "0.0";
  const rpg = season.gamesPlayed > 0 ? (season.rebounds / season.gamesPlayed).toFixed(1) : "0.0";
  const apg = season.gamesPlayed > 0 ? (season.assists / season.gamesPlayed).toFixed(1) : "0.0";

  let playoffResult = "did not make the playoffs";
  if(player.playoffSeries.length > 0) {
      if(season.championship) {
        playoffResult = "won the NBA championship";
      } else {
        const round = player.currentPlayoffRound;
        if(round === 0) playoffResult = "was eliminated in the first round";
        if(round === 1) playoffResult = "was eliminated in the conference semifinals";
        if(round === 2) playoffResult = "was eliminated in the conference finals";
        if(round === 3) playoffResult = "lost in the NBA finals";
      }
  }

  const attributesString = ATTRIBUTES.map(a => a.id).join(', ');

  const prompt = `
    You are ${coach.name}, head coach for the ${TEAMS[player.team].name}. You are giving an end-of-season report for SEASON ${season.season} to your player, ${player.name}.
    Adopt this coaching persona: ${persona}
    
    Your task is to provide a NEW and UNIQUE JSON object with two keys: "report" (your analysis) and "trainingFocus" (an array of 2-3 attribute keys to improve).
    It is critical that this report is a fresh analysis for Season ${season.season} and does NOT repeat feedback from the previous season.

    In the "report" text:
    - Your tone and language must strictly follow your assigned coaching persona.
    - Reference the player's bio/personality when giving your feedback.
    - Keep it to 2-3 short paragraphs in ${targetLanguage}.
    - Address the player directly (e.g., "You had a great season...").

    ${previousReport ? `
    For context, here is the feedback you gave me after LAST season (Season ${season.season - 1}):
    Report: "${previousReport.report}"
    Last Season's Training Focus: ${previousReport.trainingFocus.join(', ')}.

    IMPORTANT: Start your new report by briefly reflecting on whether I addressed your previous feedback. Then, provide your new analysis and advice for the upcoming off-season based on my performance THIS season.
    ` : 'This is my first season playing for you. Give me your honest assessment and what I need to work on.'}

    In the "trainingFocus" array:
    - Select 2 or 3 attribute keys from the provided list that represent the player's clearest weaknesses based on their stats and profile THIS SEASON.
    - The keys must exactly match one of these options: [${attributesString}]

    Player Profile & THIS Season's Data (Season ${season.season}):
    - Name: ${player.name}, Position: ${player.position}, Overall: ${player.overall}
    - Bio / Personality: ${player.bio || 'Not provided. Focus on stats.'}
    - Key Attributes: Shooting(${player.stats.shooting}), Finishing(${player.stats.finishing}), Defense(${player.stats.defense}), Playmaking(${player.stats.playmaking}), Rebounding(${player.stats.rebounding})
    - Season Averages: ${ppg} PPG, ${rpg} RPG, ${apg} APG
    - Awards: ${season.awards.join(', ') || 'None'}
    - Playoff Result: ${playoffResult}

    Generate the JSON object now.
  `;

  const schema = {
    type: "object",
    properties: {
        report: { type: "string" },
        trainingFocus: {
            type: "array",
            items: { type: "string" }
        }
    }
  };

  try {
    return await generateContentWithRetry(prompt, "deepseek-chat", schema);
  } catch (error) {
    console.error("Error generating coach feedback after retries:", error);
    return fallbackReport;
  }
};


export const generatePreDraftInterview = async (player: Player, language: Language): Promise<PreDraftInterview[]> => {
    const fallbackInterview: PreDraftInterview[] = [
        {
            question: language === 'pt-br' ? "A IA está indisponível. Qual é a sua maior força?" : "AI is unavailable. What is your biggest strength?",
            choices: [
                { text: language === 'pt-br' ? "Pontuação" : "Scoring", stockChange: 2 },
                { text: language === 'pt-br' ? "Trabalho em equipe" : "Teamwork", stockChange: 1 },
                { text: language === 'pt-br' ? "Defesa" : "Defense", stockChange: 1 }
            ]
        }
    ];

    const targetLanguage = language === 'pt-br' ? 'Brazilian Portuguese' : 'English';

    const prompt = `
        You are a veteran NBA scout and media trainer known for asking tough, insightful questions to draft prospects.
        Your goal is to create a JSON array of 3 highly challenging and unique interview scenarios for a prospect who is a ${player.position}.

        Based on the player's provided bio, tailor the questions to probe their personality, background, and mindset.
        Player Bio: "${player.bio || 'No bio provided. Ask general challenging questions.'}"

        For each scenario:
        - The "question" should often be a dilemma, a question about handling failure, or a tricky situation that tests the player's character and media awareness. Avoid generic questions like "What are your strengths?".
        - Provide exactly 3 distinct answer choices ("text"). One of these choices should be a "trap" or a clearly poor answer that reflects a negative trait (e.g., arrogance, selfishness, poor attitude).
        - Assign a "stockChange" integer value to each choice, reflecting its impact on the player's draft projection. The range should be between -5 (a disastrous answer) and 5 (a perfect answer). Ensure a mix of high-risk/high-reward, safe, and negative options.

        The entire response must be in ${targetLanguage}.
    `;
    
    const schema = {
        type: "array",
        items: {
            type: "object",
            properties: {
                question: { type: "string" },
                choices: {
                    type: "array",
                    items: {
                        type: "object",
                        properties: {
                            text: { type: "string" },
                            stockChange: { type: "integer" }
                        },
                        required: ["text", "stockChange"]
                    }
                }
            },
            required: ["question", "choices"]
        }
    };

    try {
        return await generateContentWithRetry(prompt, "deepseek-chat", schema);
    } catch (error) {
        console.error("Error generating pre-draft interview after retries:", error);
        return fallbackInterview;
    }
};

export const generateGameEvent = async (player: Player, context: string, language: Language): Promise<GameEvent | null> => {
    const targetLanguage = language === 'pt-br' ? 'Brazilian Portuguese' : 'English';
    const coach = TEAMS[player.team].coach;
    const teammatesString = player.teammates.map(t => `${t.name} (${t.position}, Personality: ${t.personality || 'N/A'})`).join(', ');
    const datingMatchesString = player.phone.contacts
        .filter(c => c.type === 'Date')
        .map(c => `${c.name} (Relationship Score: ${player.relationships[c.name] || 'N/A'})`)
        .join(', ');

    const prompt = `
        You are a creative storyteller and RPG game master for an NBA career simulation game.
        Generate a unique, narrative event as a JSON object for the player, ${player.name}.

        CONTEXT:
        - Player Bio/Personality: "${player.bio}"
        - Player Traits: ${player.isClutch ? 'Clutch Performer' : 'None'}
        - Team Chemistry: ${player.teamChemistry} / 100
        - Current Game Situation: "${context}"
        - Key Teammates on the ${TEAMS[player.team].name}: ${teammatesString}
        - Personal Life:
            - Current Partner: ${player.phone.currentPartner || 'None'}
            - Recent Dating Matches: ${datingMatchesString || 'None'}
        - Recent Career Events (Player's past choices):
          ${player.eventHistory.length > 0 ? player.eventHistory.slice(-3).map(e => `- Chose '${e.choice}' which resulted in '${e.outcome}'`).join('\n') : 'No significant events have happened recently.'}

        TASK:
        Create a new event with a 'title', a 'description', and an array of 2-3 'choices'.
        The event MUST be a consequence of or related to the player's context (performance, personality, relationships, or past choices).
        
        Crucially, there is a 40% chance that this event should be about the player's personal life (relationships with partners, family, or friends). If you generate a personal event, it MUST involve someone from the 'Personal Life' context and be a direct consequence of those relationships.

        Otherwise, your generated event can be about on-court action or locker room dynamics. Consider these themes:
        *   On-Court: A conflict with an opponent, a challenge from a teammate, a moment to prove your clutch ability.
        *   Off-Court (Team): A conversation with the coach about your role, a team bonding event, a media controversy.
        *   Off-Court (Personal): An event involving family, old friends, or a romantic partner (either your current girlfriend or a new match from your contacts). This could be a public outing, a private conversation, a conflict arising from your fame, or a choice that affects your personal relationships.

        Each choice must have:
        1. 'text': The action the player takes.
        2. 'outcome': An object with:
           - 'description': A short, narrative result of the choice.
           - 'effects': A JSON object detailing game mechanic changes. Allowed keys are 'momentum', 'overall', 'relationships', 'isClutch'.
             For 'relationships', it must be an ARRAY of objects, where each object has a 'person' (string, e.g., "${coach.name}", a teammate's name, or a romantic partner's name) and a 'change' (integer, e.g., 2, -1).
             For 'isClutch', it must be a boolean (true to gain, false to lose).

        Example 'effects' object: { "momentum": 1, "relationships": [ { "person": "${player.teammates[0].name}", "change": 2 } ], "isClutch": true }

        The entire response must be in ${targetLanguage}. Do not use markdown.
    `;
    
    const schema = {
        type: "object",
        properties: {
            title: { type: "string" },
            description: { type: "string" },
            choices: {
                type: "array",
                items: {
                    type: "object",
                    properties: {
                        text: { type: "string" },
                        outcome: {
                            type: "object",
                            properties: {
                                description: { type: "string" },
                                effects: {
                                    type: "object",
                                    properties: {
                                        momentum: { type: "integer" },
                                        overall: { type: "integer" },
                                        isClutch: { type: "boolean" },
                                        relationships: {
                                            type: "array",
                                            items: {
                                                type: "object",
                                                properties: {
                                                    person: { type: "string" },
                                                    change: { type: "integer" }
                                                },
                                                required: ["person", "change"]
                                            }
                                        }
                                    }
                                }
                            },
                            required: ["description", "effects"]
                        }
                    },
                    required: ["text", "outcome"]
                }
            }
        },
        required: ["title", "description", "choices"]
    };

    try {
        return await generateContentWithRetry(prompt, "deepseek-chat", schema);
    } catch (error) {
        console.error("Error generating game event after retries:", error);
        return null;
    }
};

export const generateNewsHeadlines = async (player: Player, language: Language): Promise<NewsHeadline[] | null> => {
    const targetLanguage = language === 'pt-br' ? 'Brazilian Portuguese' : 'English';
    const ppg = player.seasonStats.gamesPlayed > 0 ? (player.seasonStats.points / player.seasonStats.gamesPlayed).toFixed(1) : "0.0";
    const rpg = player.seasonStats.gamesPlayed > 0 ? (player.seasonStats.rebounds / player.seasonStats.gamesPlayed).toFixed(1) : "0.0";
    const apg = player.seasonStats.gamesPlayed > 0 ? (player.seasonStats.assists / player.seasonStats.gamesPlayed).toFixed(1) : "0.0";
    const last5Games = player.seasonStats.games.slice(0, 5);
    const last5GamesSummary = last5Games.map(g => `${g.result} vs ${g.opponent} (${g.points}p/${g.rebounds}r/${g.assists}a)`).join('; ');

    const prompt = `
        You are a sports news headline generator for an NBA simulation game.
        Generate a JSON array of 3 distinct and engaging news headlines about the player, ${player.name}.
        The tone should range from factual reports to speculative rumors and analysis.

        CONTEXT:
        - Player: ${player.name} (${player.position}, OVR ${player.overall})
        - Team: ${TEAMS[player.team].name}
        - Season: ${player.currentSeason}
        - Season Averages: ${ppg} PPG, ${rpg} RPG, ${apg} APG
        - Recent Performance (last 5 games): ${last5Games.length > 0 ? last5GamesSummary : 'No recent games.'}
        - Player Bio/Personality: "${player.bio}"
        - Career Story So Far: ${player.eventHistory.length > 0 ? player.eventHistory.slice(-3).map(e => e.outcome).join('. ') : 'Rookie season start.'}

        TASK:
        Create headlines that cover different angles:
        1. A headline about the player's recent on-court performance (good or bad).
        2. A rumor or narrative angle based on their bio or career story (e.g., trade whispers, team chemistry, endorsement potential, locker room leader?).
        3. A preview of an upcoming challenge or a general league topic involving the player.

        Each headline object must have:
        1. 'headline': The news headline text (string, max 100 chars).
        2. 'source': A realistic sports media source (string, e.g., "ESPN", "The Athletic", "Bleacher Report", "Yahoo Sports").

        The entire response must be in ${targetLanguage}. Do not use markdown.
    `;

    const schema = {
        type: "array",
        items: {
            type: "object",
            properties: {
                headline: { type: "string" },
                source: { type: "string" }
            },
            required: ["headline", "source"]
        }
    };

    try {
        return await generateContentWithRetry(prompt, "deepseek-chat", schema);
    } catch (error) {
        console.error("Error generating news headlines after retries:", error);
        return null;
    }
};


export const generatePlayoffGameSummary = async (
    player: Player,
    gameResult: { didWin: boolean; playerStats: { points: number; assists: number; rebounds: number }; finalScore: string },
    strategyResult: { choiceId: string; outcome: 'success' | 'failure'; strategyName: string },
    opponentTeamName: string,
    language: Language
): Promise<string> => {
    const targetLanguage = language === 'pt-br' ? 'Brazilian Portuguese' : 'English';
    const playerTeamName = TEAMS[player.team].name;
    
    const prompt = `
    You are a TV sports analyst breaking down a crucial NBA playoff game.
    Generate a short, punchy, narrative summary (2-3 sentences) in ${targetLanguage}.

    Your summary MUST explain how the chosen game plan directly impacted the final result. Be creative and insightful.

    Game Context:
    - Player: ${player.name}
    - Player Traits: ${player.isClutch ? 'Clutch Performer' : 'None'}
    - Player's Team: ${playerTeamName}
    - Opponent: ${opponentTeamName}
    - Game Result: ${gameResult.didWin ? 'Win' : 'Loss'}
    - Final Score: ${gameResult.finalScore}
    - Player's Stats: ${gameResult.playerStats.points} PTS, ${gameResult.playerStats.rebounds} REB, ${gameResult.playerStats.assists} AST

    Game Plan Analysis:
    - Strategy Chosen: "${strategyResult.strategyName}"
    - Strategy Outcome: ${strategyResult.outcome === 'success' ? 'SUCCESS' : 'FAILURE'}

    Example for successful strategy but a loss: "Despite ${player.name}'s brilliant execution of their game plan which kept them in the game, ${opponentTeamName}'s relentless attack proved too much in the end."
    Example for failed strategy and a loss: "${player.name}'s gamble on a risky strategy backfired spectacularly, leading to easy opportunities for ${opponentTeamName}, who capitalized for a comfortable victory."
    Example for successful strategy and a win: "A masterful game plan centered around ${player.name} paid off perfectly, as they controlled the tempo from start to finish, cruising to a decisive win over ${opponentTeamName}."

    Do not use markdown. Generate the summary now.
  `;

  try {
        return await generateContentWithRetry(prompt, "deepseek-chat");
    } catch (error) {
        console.error("Error generating playoff summary:", error);
        return language === 'pt-br'
            ? "O serviço de IA está com alta demanda. A análise do jogo não está disponível."
            : "The AI service is experiencing high demand. Game analysis is unavailable.";
    }
};

export const generateSocialMediaFeed = async (player: Player, language: Language, gamesSinceUpdate: number): Promise<Tweet[] | null> => {
    const targetLanguage = language === 'pt-br' ? 'Brazilian Portuguese' : 'English';
    
    let numTweets: number;
    let contextDescription = '';
    let taskDescription = '';
    const lastGame = player.seasonStats.games[0];

    if (gamesSinceUpdate === 0) { // Player just posted a tweet, generate ambient chatter
        numTweets = 2;
        contextDescription = `The player just engaged on social media.`;
        taskDescription = `
            Create ${numTweets} ambient tweets that might appear on a player's feed:
            - One general NBA news tweet (e.g., another star player's performance, a trade rumor).
            - One tweet from a fan about the player's team in general (not about a specific game).
        `;
    } else if (gamesSinceUpdate === 1) { // React to the single game just played
        if (!lastGame) return null;
        numTweets = 3;
        contextDescription = `The player just finished one game. It was a ${lastGame.result} vs ${lastGame.opponent}, where they scored ${lastGame.points} points, ${lastGame.rebounds} rebounds, and ${lastGame.assists} assists.`;
        taskDescription = `
            Create ${numTweets} tweets reacting specifically to this single game performance:
            - A tweet from an analyst about the player's performance in this game.
            - A tweet from a fan (either happy or disappointed).
            - A "hater" tweet or a tweet from a rival fan downplaying the performance.
        `;
    } else { // Catch-up for multiple games
        numTweets = 5;
        const recentGames = player.seasonStats.games.slice(0, gamesSinceUpdate);
        const wins = recentGames.filter(g => g.result === 'W').length;
        const losses = gamesSinceUpdate - wins;

        const totalPoints = recentGames.reduce((sum, game) => sum + game.points, 0);
        const totalRebounds = recentGames.reduce((sum, game) => sum + game.rebounds, 0);
        const totalAssists = recentGames.reduce((sum, game) => sum + game.assists, 0);
        const avgPoints = (totalPoints / gamesSinceUpdate).toFixed(1);
        const avgRebounds = (totalRebounds / gamesSinceUpdate).toFixed(1);
        const avgAssists = (totalAssists / gamesSinceUpdate).toFixed(1);

        contextDescription = `The player just played a stretch of ${gamesSinceUpdate} games. The team went ${wins}-${losses} during this period. Over these games, ${player.name} averaged ${avgPoints} points, ${avgRebounds} rebounds, and ${avgAssists} assists. The most recent game was a ${lastGame.result} vs ${lastGame.opponent}.`;
        taskDescription = `
            Create ${numTweets} "catch-up" tweets reflecting this multi-game stretch and the player's performance:
            - An analyst tweet about the team's recent trend (${wins}-${losses} record) and how ${player.name} has been contributing.
            - A tweet from a fan reacting to the player's recent form (averaging ${avgPoints} PPG). This could be positive if the stats are good, or negative if the team is losing.
            - A rumor about the player's off-court life or a potential trade, perhaps sparked by the team's recent performance.
            - A general NBA news tweet that is relevant to the player's team or division.
            - A "hater" tweet that has gained some traction, maybe focusing on a specific weakness despite the good stats, or blaming them for the losses.
        `;
    }

    const prompt = `
        You are a social media feed generator for an NBA simulation game.
        Generate a JSON array of ${numTweets} tweets about the player, ${player.name}.
        The tone should be realistic to social media, including fans, analysts, and haters.

        CONTEXT:
        - Player: ${player.name} (${player.position}, OVR ${player.overall})
        - Team: ${TEAMS[player.team].name}
        - Player Bio/Personality: "${player.bio}"
        - Game Context: ${contextDescription}

        TASK:
        ${taskDescription}

        Each tweet object must have:
        1. 'author': A realistic but fake name (e.g., "John S.", "LakerFan24"). Generate a mix of male and female names.
        2. 'handle': A realistic but fake social media handle (e.g., "johnsporttakes", "LakerNation4Life"). Do not include the '@' symbol. Make them unique.
        3. 'content': The tweet text (string, max 280 chars). Use modern internet slang, hashtags, and emojis appropriately.
        4. 'isVerified': A boolean, true only for analyst/official tweets.
        5. 'gender': A string ("male", "female", or "neutral") corresponding to the generated author name.

        The entire response must be in ${targetLanguage}. Do not use markdown.
    `;

    const schema = {
        type: "array",
        items: {
            type: "object",
            properties: {
                author: { type: "string" },
                handle: { type: "string" },
                content: { type: "string" },
                isVerified: { type: "boolean" },
                gender: { type: "string", enum: ["male", "female", "neutral"] },
            },
            required: ["author", "handle", "content", "isVerified", "gender"]
        }
    };

    try {
        const generatedTweets = await generateContentWithRetry(prompt, "deepseek-chat", schema);
        const cleanHandle = (handle: string) => `@${handle.replace(/@/g, '')}`;

        const hypeFactor = (player.overall / 100) + (player.seasonStats.momentum / 10); // e.g., 0.85 + 0.3 = 1.15
        const baseLikes = 200 + (player.overall * 50);
        const baseRetweets = 50 + (player.overall * 10);

        return generatedTweets.map((tweet: any) => {
            const id = `tweet-${Date.now()}-${Math.random().toString(36).substring(2)}`;
            const teamLogo = teamNameLogoMap[tweet.author];
            const reporterKey = Object.keys(knownReporters).find(key => tweet.author.includes(key));
            const reporter = reporterKey ? knownReporters[reporterKey] : null;

            return {
                ...tweet,
                id,
                handle: reporter ? reporter.handle : cleanHandle(tweet.handle),
                avatar: reporter ? reporter.avatar : (teamLogo || getAvatarUrl(tweet.gender, id)),
                likes: Math.floor((baseLikes + (Math.random() * 500)) * hypeFactor),
                retweets: Math.floor((baseRetweets + (Math.random() * 100)) * hypeFactor),
                comments: [],
            };
        });
    } catch (error) {
        console.error("Error generating social media feed after retries:", error);
        return null;
    }
};

export const generateInitialSocialMediaFeed = async (player: Player, language: Language): Promise<Tweet[] | null> => {
    const targetLanguage = language === 'pt-br' ? 'Brazilian Portuguese' : 'English';
    const team = TEAMS[player.team];

    const prompt = `
        You are a social media feed generator for an NBA simulation game.
        A new player, ${player.name}, a ${player.position}, was just drafted by the ${team.name} with the #${player.draftPick} pick.

        Generate a JSON array of 4-5 tweets reacting to this draft pick. The tone should be realistic to social media.

        CONTEXT:
        - Player: ${player.name} (${player.position}, OVR ${player.overall})
        - Team: ${team.name}
        - Player Bio/Personality: "${player.bio}"

        TASK:
        Create a variety of tweets:
        - 1 tweet from a major sports analyst (isVerified: true), giving their take on the pick.
        - 1-2 tweets from excited fans of the ${team.name}. Make sure fan names are gender-diverse.
        - 1 tweet from a skeptical fan or a fan of a rival team.
        - 1 official "Welcome to the team" tweet from the team's account (author: ${team.name}, handle: ${team.name.replace(/\s/g, '')}, isVerified: true).

        Each tweet object must have:
        1. 'author': A realistic name.
        2. 'handle': A realistic social media handle (without '@').
        3. 'content': The tweet text (max 280 chars). Use hashtags and emojis.
        4. 'isVerified': A boolean.
        5. 'gender': A string ("male", "female", or "neutral") corresponding to the generated author name. For official team accounts, use "neutral".

        The entire response must be in ${targetLanguage}. Do not use markdown.
    `;

    const schema = {
        type: "array",
        items: {
            type: "object",
            properties: {
                author: { type: "string" },
                handle: { type: "string" },
                content: { type: "string" },
                isVerified: { type: "boolean" },
                gender: { type: "string", enum: ["male", "female", "neutral"] },
            },
            required: ["author", "handle", "content", "isVerified", "gender"]
        }
    };

    try {
        const generatedTweets = await generateContentWithRetry(prompt, "deepseek-chat", schema);
        const cleanHandle = (handle: string) => `@${handle.replace(/@/g, '')}`;
        
        const hypeFactor = player.draftPick <= 14 ? 1.5 : 1.0;
        const baseLikes = 500 + (30 - player.draftPick) * 100;
        const baseRetweets = 100 + (30 - player.draftPick) * 20;

        return generatedTweets.map((tweet: any) => {
            const id = `tweet-${Date.now()}-${Math.random().toString(36).substring(2)}`;
            const teamLogo = teamNameLogoMap[tweet.author];
            const reporterKey = Object.keys(knownReporters).find(key => tweet.author.includes(key));
            const reporter = reporterKey ? knownReporters[reporterKey] : null;
            return {
                ...tweet,
                id,
                handle: reporter ? reporter.handle : cleanHandle(tweet.handle),
                avatar: reporter ? reporter.avatar : (teamLogo || getAvatarUrl(tweet.gender, id)),
                likes: Math.floor((baseLikes + (Math.random() * 1000)) * hypeFactor),
                retweets: Math.floor((baseRetweets + (Math.random() * 200)) * hypeFactor),
                comments: [],
            }
        });
    } catch (error) {
        console.error("Error generating initial social media feed after retries:", error);
        return null;
    }
};


export const generateTweetComments = async (tweetContent: string, player: Player, language: Language): Promise<Tweet[]> => {
    const targetLanguage = language === 'pt-br' ? 'Brazilian Portuguese' : 'English';
    const celebrityContacts = player.phone.contacts
        .filter(c => c.type === 'Date')
        .map(c => ({
            name: c.name,
            personality: c.personality,
            relationshipScore: player.relationships[c.name] || 0
        }));

    const prompt = `
        You are a social media comment generator for an NBA simulation game.
        A user has posted the following tweet: "${tweetContent}"
        The player in this game is ${player.name}.
        
        CONTEXT:
        - Player's Dating Matches: ${JSON.stringify(celebrityContacts)}

        TASK:
        Generate a JSON array of a random number of realistic comments, between 3 and 6, replying to this tweet.
        The comments should represent a mix of fan reactions: positive, negative, analytical, or funny.
        For author names, ensure a mix of male and female names (e.g., 'David P.', 'Amanda').

        There is a ~15% chance that one of the player's 'Dating Matches' will comment. If you generate a comment from them, their name and handle must exactly match one from the context list. The tone of their comment should reflect their personality and their relationship score with the player (e.g., a high score leads to a supportive or flirty comment, a low score could be teasing or distant).

        Each tweet object must have:
        1. 'author': A realistic name.
        2. 'handle': A realistic social media handle (without '@').
        3. 'content': The comment text (string, max 280 chars). Use internet slang and emojis.
        4. 'isVerified': A boolean, should be true only for a celebrity contact.
        5. 'gender': A string ("male", "female", or "neutral") corresponding to the generated author name.

        The entire response must be in ${targetLanguage}. Do not use markdown.
    `;
    
    const schema = {
        type: "array",
        items: {
            type: "object",
            properties: {
                author: { type: "string" },
                handle: { type: "string" },
                content: { type: "string" },
                isVerified: { type: "boolean" },
                gender: { type: "string", enum: ["male", "female", "neutral"] },
            },
            required: ["author", "handle", "content", "isVerified", "gender"]
        }
    };

    try {
        const generatedComments = await generateContentWithRetry(prompt, "deepseek-chat", schema);
        const cleanHandle = (handle: string) => `@${handle.replace(/@/g, '')}`;

        return generatedComments.map((comment: any) => {
            const id = `comment-${Date.now()}-${Math.random().toString(36).substring(2)}`;
            const reporterKey = Object.keys(knownReporters).find(key => comment.author.includes(key));
            const reporter = reporterKey ? knownReporters[reporterKey] : null;

            return {
                ...comment,
                id,
                handle: reporter ? reporter.handle : cleanHandle(comment.handle),
                avatar: reporter ? reporter.avatar : getAvatarUrl(comment.gender, id),
                likes: Math.floor(Math.random() * 50),
                retweets: Math.floor(Math.random() * 10),
                comments: [], // Comments don't have nested comments in this simulation
            };
        });
    } catch (error) {
        console.error("Error generating tweet comments after retries:", error);
        return [];
    }
};

export const generateDatingAppConversation = async (player: Player, contact: Contact, language: Language, currentConversation: Message[]): Promise<Message[]> => {
    const targetLanguage = language === 'pt-br' ? 'Brazilian Portuguese' : 'English';
    const datingProfile = player.phone.datingProfiles.find(p => p.id === contact.id);
    const relationshipScore = player.relationships[contact.name] || 0;

    const prompt = `
        You are a dating app conversation simulator for an NBA career game. You are simulating a conversation between the player, ${player.name}, and a dating contact, ${contact.name}.
        
        CONTEXT:
        - Player: ${player.name} (Bio: "${player.bio}", Personality: ${player.isClutch ? 'Clutch' : 'Normal'})
        - Contact: ${contact.name} (Personality: "${contact.personality}", Relationship Score: ${relationshipScore})
        - Contact's Dating Profile: ${datingProfile ? JSON.stringify(datingProfile) : 'Not available'}
        - Current Conversation History: ${JSON.stringify(currentConversation)}

        TASK:
        Generate the NEXT 1-2 messages in the conversation as a JSON array of Message objects. Each message should be from either the player or the contact, alternating turns naturally. The conversation should be realistic for a dating app.
        
        Consider:
        - The personalities of both the player and the contact.
        - The current relationship score (higher score = more flirtatious/comfortable, lower score = more guarded/casual).
        - The content of the 'Current Conversation History' to ensure continuity.
        - If the conversation is just starting, the first message should be a natural opener.
        - If the relationship score is very low (e.g., < -5), the contact might be less responsive or even ghost.

        Each message object must have:
        1. 'id': A unique string ID.
        2. 'sender': The name of the sender (either "${player.name}" or "${contact.name}").
        3. 'text': The message content (string, max 200 chars). Use emojis and casual language.
        4. 'timestamp': The current timestamp (Date.now()).

        The entire response must be in ${targetLanguage}. Do not use markdown.
    `;

    const schema = {
        type: "array",
        items: {
            type: "object",
            properties: {
                id: { type: "string" },
                sender: { type: "string" },
                text: { type: "string" },
                timestamp: { type: "number" }
            },
            required: ["id", "sender", "text", "timestamp"]
        }
    };

    try {
        return await generateContentWithRetry(prompt, "deepseek-chat", schema);
    } catch (error) {
        console.error("Error generating dating app conversation after retries:", error);
        return [];
    }
};

export const generateAgentConversation = async (player: Player, contact: Contact, language: Language, currentConversation: Message[]): Promise<Message[]> => {
    const targetLanguage = language === 'pt-br' ? 'Brazilian Portuguese' : 'English';
    const relationshipScore = player.relationships[contact.name] || 0;

    const prompt = `
        You are an agent conversation simulator for an NBA career game. You are simulating a conversation between the player, ${player.name}, and their agent, ${contact.name}.
        
        CONTEXT:
        - Player: ${player.name} (Bio: "${player.bio}", Overall: ${player.overall}, Season Averages: ${player.seasonStats.gamesPlayed > 0 ? (player.seasonStats.points / player.seasonStats.gamesPlayed).toFixed(1) + ' PPG' : 'N/A'})
        - Agent: ${contact.name} (Personality: "${contact.personality}", Relationship Score: ${relationshipScore})
        - Current Conversation History: ${JSON.stringify(currentConversation)}

        TASK:
        Generate the NEXT 1-2 messages in the conversation as a JSON array of Message objects. Each message should be from either the player or the agent, alternating turns naturally. The conversation should be realistic for a player-agent dynamic.
        
        Consider:
        - The personalities of both the player and the agent.
        - The current relationship score (higher score = more trust/openness, lower score = more formal/strained).
        - The content of the 'Current Conversation History' to ensure continuity.
        - If the conversation is just starting, the first message should be a natural opener.
        - The agent's personality often involves business jargon and a focus on career moves, contracts, endorsements, etc.

        Each message object must have:
        1. 'id': A unique string ID.
        2. 'sender': The name of the sender (either "${player.name}" or "${contact.name}").
        3. 'text': The message content (string, max 200 chars). Use professional but conversational language.
        4. 'timestamp': The current timestamp (Date.now()).

        The entire response must be in ${targetLanguage}. Do not use markdown.
    `;

    const schema = {
        type: "array",
        items: {
            type: "object",
            properties: {
                id: { type: "string" },
                sender: { type: "string" },
                text: { type: "string" },
                timestamp: { type: "number" }
            },
            required: ["id", "sender", "text", "timestamp"]
        }
    };

    try {
        return await generateContentWithRetry(prompt, "deepseek-chat", schema);
    } catch (error) {
        console.error("Error generating agent conversation after retries:", error);
        return [];
    }
};

export const generateCoachConversation = async (player: Player, contact: Contact, language: Language, currentConversation: Message[]): Promise<Message[]> => {
    const targetLanguage = language === 'pt-br' ? 'Brazilian Portuguese' : 'English';
    const relationshipScore = player.relationships[contact.name] || 0;

    const prompt = `
        You are a coach conversation simulator for an NBA career game. You are simulating a conversation between the player, ${player.name}, and their coach, ${contact.name}.
        
        CONTEXT:
        - Player: ${player.name} (Bio: "${player.bio}", Overall: ${player.overall}, Season Averages: ${player.seasonStats.gamesPlayed > 0 ? (player.seasonStats.points / player.seasonStats.gamesPlayed).toFixed(1) + ' PPG' : 'N/A'})
        - Coach: ${contact.name} (Personality: "${contact.personality}", Relationship Score: ${relationshipScore})
        - Current Conversation History: ${JSON.stringify(currentConversation)}

        TASK:
        Generate the NEXT 1-2 messages in the conversation as a JSON array of Message objects. Each message should be from either the player or the coach, alternating turns naturally. The conversation should be realistic for a player-coach dynamic.
        
        Consider:
        - The personalities of both the player and the coach.
        - The current relationship score (higher score = more trust/openness, lower score = more formal/strained).
        - The content of the 'Current Conversation History' to ensure continuity.
        - If the conversation is just starting, the first message should be a natural opener.
        - The coach's personality often involves feedback on performance, strategy, team dynamics, and player development.

        Each message object must have:
        1. 'id': A unique string ID.
        2. 'sender': The name of the sender (either "${player.name}" or "${contact.name}").
        3. 'text': The message content (string, max 200 chars). Use professional but conversational language.
        4. 'timestamp': The current timestamp (Date.now()).

        The entire response must be in ${targetLanguage}. Do not use markdown.
    `;

    const schema = {
        type: "array",
        items: {
            type: "object",
            properties: {
                id: { type: "string" },
                sender: { type: "string" },
                text: { type: "string" },
                timestamp: { type: "number" }
            },
            required: ["id", "sender", "text", "timestamp"]
        }
    };

    try {
        return await generateContentWithRetry(prompt, "deepseek-chat", schema);
    } catch (error) {
        console.error("Error generating coach conversation after retries:", error);
        return [];
    }
};

export const generatePlayerResponseToTweet = async (player: Player, tweet: Tweet, language: Language): Promise<string> => {
    const targetLanguage = language === 'pt-br' ? 'Brazilian Portuguese' : 'English';

    const prompt = `
        You are an NBA player, ${player.name}, known for your ${player.bio}. You are responding to a tweet on social media.
        The tweet you are responding to is: "${tweet.content}"

        TASK:
        Generate a short, authentic, and in-character tweet response (max 150 characters) from ${player.name}.
        Consider your personality (from your bio) and the content of the original tweet. Your response should be natural for a professional athlete on social media.
        It can be appreciative, dismissive, humorous, or confident, depending on the context.

        The entire response must be in ${targetLanguage}. Do not use markdown.
    `;

    try {
        return await generateContentWithRetry(prompt, "deepseek-chat");
    } catch (error) {
        console.error("Error generating player tweet response after retries:", error);
        return language === 'pt-br'
            ? "Não consigo gerar uma resposta agora." 
            : "Cannot generate a response right now.";
    }
};

export const generateDatingProfileBio = async (profile: DatingProfile, player: Player, language: Language): Promise<string> => {
    const targetLanguage = language === 'pt-br' ? 'Brazilian Portuguese' : 'English';

    const prompt = `
        You are a dating app profile generator. Create a short, engaging, and realistic dating profile bio (2-3 sentences) for a celebrity named ${profile.name}.
        
        CONTEXT:
        - Celebrity Name: ${profile.name}
        - Celebrity Persona: "${profile.personality}"
        - Player (who is viewing the profile): ${player.name}

        TASK:
        Write a bio that reflects ${profile.name}'s personality and hints at their celebrity status without being overly explicit. Make it appealing to someone like ${player.name}.

        The entire response must be in ${targetLanguage}. Do not use markdown.
    `;

    try {
        return await generateContentWithRetry(prompt, "deepseek-chat");
    } catch (error) {
        console.error("Error generating dating profile bio after retries:", error);
        return language === 'pt-br'
            ? "Não consigo gerar uma biografia de perfil de namoro agora." 
            : "Cannot generate a dating profile bio right now.";
    }
};

export const analyzePlayerTweet = async (tweetContent: string, player: Player, language: Language): Promise<{ sentiment: 'positive' | 'negative' | 'neutral', keywords: string[]; effects?: { teamChemistry?: number; relationships?: { person: string; change: number; }[]; celebrityMention?: string; }; }> => {
    const targetLanguage = language === 'pt-br' ? 'Brazilian Portuguese' : 'English';

    const prompt = `
        You are an AI analyzing a social media tweet from an NBA player.
        The player, ${player.name}, has tweeted: "${tweetContent}"

        TASK:
        Analyze the tweet and provide a JSON object with three keys: "sentiment", "keywords", and "effects".
        - "sentiment": Determine if the tweet's sentiment is 'positive', 'negative', or 'neutral'.
        - "keywords": Extract 3-5 relevant keywords or phrases from the tweet.
        - "effects": (Optional) A JSON object detailing game mechanic changes. Allowed keys are 'teamChemistry', 'relationships', 'celebrityMention'.
          For 'relationships', it must be an ARRAY of objects, where each object has a 'person' (string, e.g., a teammate's name or a romantic partner's name) and a 'change' (integer, e.g., 2, -1).
          For 'celebrityMention', it must be a STRING (the name of the celebrity mentioned).

        The entire response must be in ${targetLanguage}. Do not use markdown.
    `;

    const schema = {
        type: "object",
        properties: {
            sentiment: { type: "string", enum: ['positive', 'negative', 'neutral'] },
            keywords: {
                type: "array",
                items: { type: "string" }
            },
            effects: {
                type: "object",
                properties: {
                    teamChemistry: { type: "integer" },
                    relationships: {
                        type: "array",
                        items: {
                            type: "object",
                            properties: {
                                person: { type: "string" },
                                change: { type: "integer" }
                            },
                            required: ["person", "change"]
                        }
                    },
                    celebrityMention: { type: "string" }
                }
            }
        },
        required: ["sentiment", "keywords"]
    };

    try {
        return await generateContentWithRetry(prompt, "deepseek-chat", schema);
    } catch (error) {
        console.error("Error analyzing player tweet after retries:", error);
        return { sentiment: 'neutral', keywords: [], effects: {} };
    }
};

export const generateDatingAppMatchMessage = async (player: Player, datingProfile: DatingProfile, language: Language): Promise<string> => {
    const targetLanguage = language === 'pt-br' ? 'Brazilian Portuguese' : 'English';

    const prompt = `
        You are a dating app message generator. The player, ${player.name}, has just matched with ${datingProfile.name} on a dating app.
        
        CONTEXT:
        - Player: ${player.name} (Bio: "${player.bio}")
        - Dating Profile: ${datingProfile.name} (Personality: "${datingProfile.personality}", Bio: "${datingProfile.bio}")

        TASK:
        Generate a short, engaging, and personalized first message (max 150 characters) from ${datingProfile.name} to ${player.name}.
        The message should reflect ${datingProfile.name}'s personality and reference something from the player's profile or general knowledge about an NBA player.

        The entire response must be in ${targetLanguage}. Do not use markdown.
    `;

    try {
        return await generateContentWithRetry(prompt, "deepseek-chat");
    } catch (error) {
        console.error("Error generating dating app match message after retries:", error);
        return language === 'pt-br'
            ? "Não consigo gerar uma mensagem de combinação agora." 
            : "Cannot generate a match message right now.";
    }
};

export const generateCelebrityTweetResponse = async (
    originalTweet: Tweet,
    player: Player,
    language: Language
): Promise<Tweet | null> => {
    const targetLanguage = language === 'pt-br' ? 'Brazilian Portuguese' : 'English';
    const celebrityContacts = player.phone.contacts
        .filter(c => c.type === 'Date')
        .map(c => ({
            name: c.name,
            personality: c.personality,
            relationshipScore: player.relationships[c.name] || 0
        }));

    const prompt = `
        You are an AI simulating a celebrity (dating contact) response to an NBA player's tweet.
        The player, ${player.name}, has tweeted: "${originalTweet.content}"

        CONTEXT:
        - Player's Dating Matches: ${JSON.stringify(celebrityContacts)}

        TASK:
        Generate a JSON object representing a tweet response from one of the player's 'Dating Matches'.
        The chosen contact's name and handle must exactly match one from the context list.
        The tone of their tweet should reflect their personality and their relationship score with the player (e.g., a high score leads to a supportive or flirty comment, a low score could be teasing or distant).

        The JSON object must have:
        1. 'author': The name of the celebrity contact.
        2. 'handle': The social media handle of the celebrity contact (without '@').
        3. 'content': The tweet text (string, max 280 chars). Use modern internet slang, hashtags, and emojis appropriately.
        4. 'isVerified': A boolean, must be true for a celebrity contact.
        5. 'gender': A string ("male", "female", or "neutral") corresponding to the generated author name.

        The entire response must be in ${targetLanguage}. Do not use markdown.
    `;

    const schema = {
        type: "object",
        properties: {
            author: { type: "string" },
            handle: { type: "string" },
            content: { type: "string" },
            isVerified: { type: "boolean" },
            gender: { type: "string", enum: ["male", "female", "neutral"] },
        },
        required: ["author", "handle", "content", "isVerified", "gender"]
    };

    try {
        const generatedTweet = await generateContentWithRetry(prompt, "deepseek-chat", schema);
        const cleanHandle = (handle: string) => `@${handle.replace(/@/g, '')}`;
        const id = `tweet-${Date.now()}-${Math.random().toString(36).substring(2)}`;

        return {
            ...generatedTweet,
            id,
            handle: cleanHandle(generatedTweet.handle),
            avatar: getAvatarUrl(generatedTweet.gender, id),
            likes: Math.floor(Math.random() * 500) + 100,
            retweets: Math.floor(Math.random() * 100) + 20,
            comments: [],
        };
    } catch (error) {
        console.error("Error generating celebrity tweet response after retries:", error);
        return null;
    }
};

export const generateContactResponse = async (player: Player, contact: Contact, language: Language, currentConversation: Message[]): Promise<Message | null> => {
    const targetLanguage = language === 'pt-br' ? 'Brazilian Portuguese' : 'English';
    const datingProfile = player.phone.datingProfiles.find(p => p.id === contact.id);
    const relationshipScore = player.relationships[contact.name] || 0;

    const prompt = `
        You are a dating app conversation simulator. You are simulating a response from ${contact.name} to the player, ${player.name}.
        
        CONTEXT:
        - Player: ${player.name} (Bio: "${player.bio}", Personality: ${player.isClutch ? 'Clutch' : 'Normal'})
        - Contact: ${contact.name} (Personality: "${contact.personality}", Relationship Score: ${relationshipScore})
        - Contact's Dating Profile: ${datingProfile ? JSON.stringify(datingProfile) : 'Not available'}
        - Current Conversation History: ${JSON.stringify(currentConversation)}

        TASK:
        Generate the NEXT 1 message from ${contact.name} as a JSON object. The message should be realistic for a dating app.
        
        Consider:
        - The personalities of both the player and the contact.
        - The current relationship score (higher score = more flirtatious/comfortable, lower score = more guarded/casual).
        - The content of the 'Current Conversation History' to ensure continuity.
        - If the conversation is just starting, the first message should be a natural opener.
        - If the relationship score is very low (e.g., < -5), the contact might be less responsive or even ghost.

        The message object must have:
        1. 'id': A unique string ID.
        2. 'sender': The name of the sender ("${contact.name}").
        3. 'text': The message content (string, max 200 chars). Use emojis and casual language.
        4. 'timestamp': The current timestamp (Date.now()).

        The entire response must be in ${targetLanguage}. Do not use markdown.
    `;

    const schema = {
        type: "object",
        properties: {
            id: { type: "string" },
            sender: { type: "string" },
            text: { type: "string" },
            timestamp: { type: "number" }
        },
        required: ["id", "sender", "text", "timestamp"]
    };

    try {
        return await generateContentWithRetry(prompt, "deepseek-chat", schema);
    } catch (error) {
        console.error("Error generating contact response after retries:", error);
        return null;
    }
};

export const analyzeConversationForEvent = async (player: Player, contact: Contact, language: Language, currentConversation: Message[]): Promise<{ eventTriggered: boolean; eventDescription?: string; eventEffects?: any; } | null> => {
    const targetLanguage = language === 'pt-br' ? 'Brazilian Portuguese' : 'English';
    const datingProfile = player.phone.datingProfiles.find(p => p.id === contact.id);
    const relationshipScore = player.relationships[contact.name] || 0;

    const prompt = `
        You are an AI analyzing a dating app conversation to determine if a significant event should be triggered.
        The player, ${player.name}, is conversing with ${contact.name}.

        CONTEXT:
        - Player: ${player.name} (Bio: "${player.bio}", Personality: ${player.isClutch ? 'Clutch' : 'Normal'})
        - Contact: ${contact.name} (Personality: "${contact.personality}", Relationship Score: ${relationshipScore})
        - Contact's Dating Profile: ${datingProfile ? JSON.stringify(datingProfile) : 'Not available'}
        - Current Conversation History: ${JSON.stringify(currentConversation)}

        TASK:
        Analyze the 'Current Conversation History'. Determine if the conversation has reached a point where a significant event should be triggered. This could be:
        - A date invitation (by either party).
        - A conflict or misunderstanding.
        - A major relationship milestone (e.g., becoming exclusive, breaking up).
        - A request for help or a favor.

        If an event should be triggered (approximately 20% chance if the conversation is active and interesting):
        - Set 'eventTriggered' to true.
        - Provide a 'eventDescription' (string, max 200 chars) summarizing the event.
        - Provide 'eventEffects' (JSON object) detailing game mechanic changes. Allowed keys are 'relationships'.
          For 'relationships', it must be an ARRAY of objects, where each object has a 'person' (string, e.g., "${contact.name}") and a 'change' (integer, e.g., 5, -10).

        If no event should be triggered:
        - Set 'eventTriggered' to false.
        - Do NOT include 'eventDescription' or 'eventEffects'.

        The entire response must be in ${targetLanguage}. Do not use markdown.
    `;

    const schema = {
        type: "object",
        properties: {
            eventTriggered: { type: "boolean" },
            eventDescription: { type: "string" },
            eventEffects: {
                type: "object",
                properties: {
                    relationships: {
                        type: "array",
                        items: {
                            type: "object",
                            properties: {
                                person: { type: "string" },
                                change: { type: "integer" }
                            },
                            required: ["person", "change"]
                        }
                    }
                }
            }
        },
        required: ["eventTriggered"]
    };

    try {
        return await generateContentWithRetry(prompt, "deepseek-chat", schema);
    } catch (error) {
        console.error("Error analyzing conversation for event after retries:", error);
        return { eventTriggered: false };
    }
};

export const generateSocialMediaReactionToPlayerComment = async (
    originalTweet: Tweet,
    playerComment: Tweet,
    player: Player,
    language: Language
): Promise<{ reactionType: 'reply' | 'quote_retweet' | 'new_tweet'; tweet: { author: string; handle: string; content: string; isVerified: boolean; } } | null> => {
    const targetLanguage = language === 'pt-br' ? 'Brazilian Portuguese' : 'English';

    const prompt = `
        You are an AI simulating social media reactions to a player's comment in an NBA career game.
        The player, ${player.name}, just commented on a tweet.

        CONTEXT:
        - Original Tweet: "${originalTweet.content}" (by ${originalTweet.author} ${originalTweet.handle})
        - Player's Comment: "${playerComment.content}" (by ${player.name} ${playerComment.handle})
        - Player Personality: "${player.bio}"

        TASK:
        Generate a JSON object representing a social media reaction. There's a 60% chance it's a direct 'reply' to the player's comment, a 30% chance it's a 'quote_retweet' of the original tweet (mentioning the player's comment), and a 10% chance it's a completely 'new_tweet' inspired by the interaction.

        The reaction should come from a random, realistic social media user (fan, analyst, hater, or even a teammate/rival if relevant to the content).

        The JSON object must have:
        1. 'reactionType': A string ('reply', 'quote_retweet', or 'new_tweet').
        2. 'tweet': An object with:
           - 'author': A realistic name (e.g., "BasketballGuru", "FanOf${player.name}").
           - 'handle': A realistic social media handle (without '@').
           - 'content': The tweet/reply text (string, max 280 chars). Use modern internet slang, hashtags, and emojis appropriately. It should directly reference or react to the player's comment and/or the original tweet.
           - 'isVerified': A boolean, true for analysts/reporters, false for fans.

        The entire response must be in ${targetLanguage}. Do not use markdown.
    `;

    const schema = {
        type: "object",
        properties: {
            reactionType: { type: "string", enum: ['reply', 'quote_retweet', 'new_tweet'] },
            tweet: {
                type: "object",
                properties: {
                    author: { type: "string" },
                    handle: { type: "string" },
                    content: { type: "string" },
                    isVerified: { type: "boolean" }
                },
                required: ["author", "handle", "content", "isVerified"]
            }
        },
        required: ["reactionType", "tweet"]
    };

    try {
        return await generateContentWithRetry(prompt, "deepseek-chat", schema);
    } catch (error) {
        console.error("Error generating social media reaction after retries:", error);
        return null;
    }
};
