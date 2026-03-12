import { GoogleGenAI, Type, HarmBlockThreshold, HarmCategory } from "@google/genai";
import { Game, Player, CareerSeason, CoachReport, PreDraftInterview, GameEvent, NewsHeadline, Position, Tweet, Language, Message } from "../types";
import { TEAMS, ATTRIBUTES } from "../constants";

const generateAvatar = (seed: string) => `https://api.dicebear.com/8.x/adventurer/svg?seed=${encodeURIComponent(seed)}`;

const getAiClient = (): GoogleGenAI | null => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        console.warn("Gemini API key not found in environment. AI features will be disabled.");
        return null;
    }
    return new GoogleGenAI({ apiKey });
};

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

const safetySettings = [
    { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
    { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
    { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
    { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
];

const generateContentWithRetry = async (
    prompt: string,
    schema?: any,
    maxRetries: number = 2
): Promise<any> => {
    const ai = getAiClient();
    if (!ai) {
        throw new Error("AI service is not available.");
    }

    let attempt = 0;
    while (attempt <= maxRetries) {
        try {
            const response = await ai.models.generateContent({
                model: 'gemini-3-flash-preview',
                contents: prompt,
                config: {
                    safetySettings,
                    ...(schema && {
                        responseMimeType: "application/json",
                        responseSchema: schema
                    })
                }
            });
            const text = response.text.trim();
            if (!text) {
                throw new Error("Received empty response from AI.");
            }
            return schema ? JSON.parse(text) : text;
        } catch (error: any) {
            const isRateLimitError = error.toString().includes('429');
            const isJsonError = error instanceof SyntaxError;
            
            if ((isRateLimitError || isJsonError) && attempt < maxRetries) {
                attempt++;
                const delayTime = Math.pow(2, attempt) * 1000 + Math.random() * 1000;
                console.warn(`${isRateLimitError ? 'Rate limit hit' : 'JSON parsing error'}. Retrying in ${delayTime.toFixed(0)}ms... (Attempt ${attempt}/${maxRetries})`);
                await delay(delayTime);
            } else {
                console.error(`Failed to generate content after ${attempt + 1} attempts:`, error);
                throw error;
            }
        }
    }
    throw new Error("Exhausted all retries for content generation.");
};

const getAvatarUrl = (gender: 'male' | 'female' | 'neutral' | undefined, id: string): string => {
    const randomId = id.slice(-12);
    return generateAvatar(randomId);
};

export const generateGameSummary = async (game: Game, player: Player, language: Language): Promise<string> => {
    const ai = getAiClient();
    if (!ai) return language === 'pt-br' ? "Resumos de IA indisponíveis." : "AI summaries unavailable.";
    const targetLanguage = language === 'pt-br' ? 'Brazilian Portuguese' : 'English';
    const prompt = `Summarize this NBA game for ${player.name} in ${targetLanguage}. Stats: ${game.points} PTS, ${game.rebounds} REB, ${game.assists} AST. Result: ${game.result}.`;
    return await generateContentWithRetry(prompt);
};

export const generatePlayerBio = async (name: string, position: Position, language: Language): Promise<string> => {
  const ai = getAiClient();
  if (!ai) return language === 'pt-br' ? "Bio indisponível." : "Bio unavailable.";
  const targetLanguage = language === 'pt-br' ? 'Brazilian Portuguese' : 'English';
  const prompt = `Generate a short NBA player bio for ${name} (${position}) in ${targetLanguage}.`;
  return await generateContentWithRetry(prompt);
};

export const generateCoachFeedback = async (player: Player, season: CareerSeason, language: Language, coach: { name: string; personality: string; }, previousReport: CoachReport | undefined): Promise<CoachReport> => {
  const ai = getAiClient();
  const fallback = { report: "AI Coach unavailable.", trainingFocus: ['shooting', 'defense'] };
  if (!ai) return fallback;
  const targetLanguage = language === 'pt-br' ? 'Brazilian Portuguese' : 'English';
  const prompt = `Coach ${coach.name} feedback for ${player.name} after season ${season.season} in ${targetLanguage}. Return JSON with report and trainingFocus.`;
  const schema = { type: Type.OBJECT, properties: { report: { type: Type.STRING }, trainingFocus: { type: Type.ARRAY, items: { type: Type.STRING } } } };
  return await generateContentWithRetry(prompt, schema);
};

export const generatePreDraftInterview = async (player: Player, language: Language): Promise<PreDraftInterview[]> => {
    const ai = getAiClient();
    if (!ai) return [];
    const targetLanguage = language === 'pt-br' ? 'Brazilian Portuguese' : 'English';
    const prompt = `Generate 3 NBA draft interview questions for ${player.name} in ${targetLanguage}. Return JSON array of objects with question and choices (text, stockChange).`;
    const schema = { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { question: { type: Type.STRING }, choices: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { text: { type: Type.STRING }, stockChange: { type: Type.INTEGER } } } } } } };
    return await generateContentWithRetry(prompt, schema);
};

export const generateGameEvent = async (player: Player, context: string, language: Language): Promise<GameEvent | null> => {
    const ai = getAiClient();
    if (!ai) return null;
    const targetLanguage = language === 'pt-br' ? 'Brazilian Portuguese' : 'English';
    const prompt = `Generate an NBA narrative event for ${player.name} in ${targetLanguage}. Context: ${context}. Return JSON with title, description, and choices.`;
    const schema = { type: Type.OBJECT, properties: { title: { type: Type.STRING }, description: { type: Type.STRING }, choices: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { text: { type: Type.STRING }, outcome: { type: Type.OBJECT, properties: { description: { type: Type.STRING }, effects: { type: Type.OBJECT } } } } } } } };
    return await generateContentWithRetry(prompt, schema);
};

export const generateNewsHeadlines = async (player: Player, language: Language): Promise<NewsHeadline[] | null> => {
    const ai = getAiClient();
    if (!ai) return null;
    const targetLanguage = language === 'pt-br' ? 'Brazilian Portuguese' : 'English';
    const prompt = `Generate 3 NBA news headlines about ${player.name} in ${targetLanguage}. Return JSON array of objects with headline and source.`;
    const schema = { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { headline: { type: Type.STRING }, source: { type: Type.STRING } } } };
    return await generateContentWithRetry(prompt, schema);
};

export const generateSocialMediaFeed = async (player: Player, language: Language, gamesSinceUpdate: number): Promise<Tweet[] | null> => {
    const ai = getAiClient();
    if (!ai) return null;
    const targetLanguage = language === 'pt-br' ? 'Brazilian Portuguese' : 'English';
    const prompt = `Generate ${gamesSinceUpdate > 0 ? 3 : 2} tweets about ${player.name} in ${targetLanguage}. Return JSON array.`;
    const schema = { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { author: { type: Type.STRING }, handle: { type: Type.STRING }, content: { type: Type.STRING }, isVerified: { type: Type.BOOLEAN }, gender: { type: Type.STRING } } } };
    const tweets = await generateContentWithRetry(prompt, schema);
    return tweets.map((t: any) => ({ ...t, id: uuidv4(), avatar: getAvatarUrl(t.gender, t.handle), likes: 0, retweets: 0, comments: [] }));
};

export const generateInitialSocialMediaFeed = async (player: Player, language: Language): Promise<Tweet[] | null> => {
    return generateSocialMediaFeed(player, language, 1);
};

export const generatePlayoffGameSummary = async (player: Player, gameResult: any, strategyResult: any, opponentTeamName: string, language: Language): Promise<string> => {
    const targetLanguage = language === 'pt-br' ? 'Brazilian Portuguese' : 'English';
    const prompt = `Summarize playoff game for ${player.name} vs ${opponentTeamName} in ${targetLanguage}. Result: ${gameResult.didWin ? 'Win' : 'Loss'}. Strategy: ${strategyResult.strategyName}.`;
    return await generateContentWithRetry(prompt);
};

export const generateContactResponse = async (playerName: string, contact: any, history: Message[], message: string, language: Language): Promise<string> => {
    const targetLanguage = language === 'pt-br' ? 'Brazilian Portuguese' : 'English';
    const prompt = `Generate a response from ${contact.name} to ${playerName}'s message: "${message}" in ${targetLanguage}. Personality: ${contact.personality}. History: ${JSON.stringify(history.slice(-5))}`;
    return await generateContentWithRetry(prompt);
};

export const analyzeConversationForEvent = async (contact: any, messages: Message[], player: Player, language: Language): Promise<GameEvent | null> => {
    return null;
};

export const analyzePlayerTweet = async (player: Player, content: string, celebrityNames: string[]): Promise<any> => {
    const ai = getAiClient();
    const fallback = { effects: { teamChemistry: 0, momentum: 0, relationships: [] } };
    if (!ai) return fallback;
    const prompt = `Analyze this tweet from NBA player ${player.name}: "${content}". Celebrity names: ${celebrityNames.join(', ')}. Return JSON with effects (teamChemistry, momentum, relationships, celebrityMention).`;
    const schema = { type: Type.OBJECT, properties: { effects: { type: Type.OBJECT, properties: { teamChemistry: { type: Type.INTEGER }, momentum: { type: Type.INTEGER }, celebrityMention: { type: Type.STRING }, relationships: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { person: { type: Type.STRING }, change: { type: Type.INTEGER } } } } } } } };
    try {
        return await generateContentWithRetry(prompt, schema);
    } catch {
        return fallback;
    }
};

export const generateTweetComments = async (tweetContent: string, player: Player, language: Language): Promise<Tweet[]> => {
    const ai = getAiClient();
    if (!ai) return [];
    const targetLanguage = language === 'pt-br' ? 'Brazilian Portuguese' : 'English';
    const prompt = `Generate 3-5 social media comments on ${player.name}'s tweet: "${tweetContent}" in ${targetLanguage}. Return JSON array of tweets.`;
    const schema = { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { author: { type: Type.STRING }, handle: { type: Type.STRING }, content: { type: Type.STRING }, isVerified: { type: Type.BOOLEAN }, gender: { type: Type.STRING } } } };
    try {
        const comments = await generateContentWithRetry(prompt, schema);
        return comments.map((c: any) => ({ ...c, id: uuidv4(), avatar: getAvatarUrl(c.gender, c.handle), likes: 0, retweets: 0, comments: [] }));
    } catch {
        return [];
    }
};

export const generateCelebrityTweetResponse = async (player: Player, tweetContent: string, celebrity: any, language: Language): Promise<any> => {
    const ai = getAiClient();
    if (!ai) return null;
    const targetLanguage = language === 'pt-br' ? 'Brazilian Portuguese' : 'English';
    const prompt = `Generate a tweet response from celebrity ${celebrity.name} to ${player.name}'s tweet: "${tweetContent}" in ${targetLanguage}. Return JSON with tweet (content) and specialAction ('addContact' or null) and firstMessage (if addContact).`;
    const schema = { type: Type.OBJECT, properties: { tweet: { type: Type.OBJECT, properties: { content: { type: Type.STRING } } }, specialAction: { type: Type.STRING }, firstMessage: { type: Type.STRING } } };
    try {
        return await generateContentWithRetry(prompt, schema);
    } catch {
        return null;
    }
};

export const generateSocialMediaReactionToPlayerComment = async (originalTweet: Tweet, playerComment: Tweet, player: Player, language: Language): Promise<any> => {
    const ai = getAiClient();
    if (!ai) return null;
    const targetLanguage = language === 'pt-br' ? 'Brazilian Portuguese' : 'English';
    const prompt = `Generate a social media reaction to ${player.name}'s comment: "${playerComment.content}" on ${originalTweet.author}'s tweet: "${originalTweet.content}" in ${targetLanguage}. Return JSON with tweet (author, handle, content, isVerified, gender) and reactionType ('reply' | 'quote_retweet' | 'new_tweet').`;
    const schema = { type: Type.OBJECT, properties: { tweet: { type: Type.OBJECT, properties: { author: { type: Type.STRING }, handle: { type: Type.STRING }, content: { type: Type.STRING }, isVerified: { type: Type.BOOLEAN }, gender: { type: Type.STRING } } }, reactionType: { type: Type.STRING } } };
    try {
        return await generateContentWithRetry(prompt, schema);
    } catch {
        return null;
    }
};

function uuidv4() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}
