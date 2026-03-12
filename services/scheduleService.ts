import { AllTeams } from '../types';
import { TEAMS } from '../constants';

const getTeamsByDivision = () => {
    const divisions: { [key: string]: string[] } = {};
    for (const teamCode in TEAMS) {
        const team = TEAMS[teamCode];
        if (!divisions[team.division]) {
            divisions[team.division] = [];
        }
        divisions[team.division].push(teamCode);
    }
    return divisions;
};

const getTeamsByConference = () => {
    const conferences: { [key: string]: string[] } = {};
    for (const teamCode in TEAMS) {
        const team = TEAMS[teamCode];
        if (!conferences[team.conference]) {
            conferences[team.conference] = [];
        }
        conferences[team.conference].push(teamCode);
    }
    return conferences;
};

// Simple shuffle function
const shuffle = (array: any[]) => {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
};

export const generateSeasonSchedule = (): { [teamCode: string]: string[] } => {
    const schedule: { [teamCode: string]: string[] } = {};
    const teamCodes = Object.keys(TEAMS);
    teamCodes.forEach(code => schedule[code] = []);

    const divisions = getTeamsByDivision();
    const conferences = getTeamsByConference();

    for (const teamCode of teamCodes) {
        const team = TEAMS[teamCode];
        const gameList: string[] = [];

        // 1. Other conference teams: 2 games each
        const otherConference = team.conference === 'East' ? 'West' : 'East';
        conferences[otherConference].forEach(opponentCode => {
            gameList.push(opponentCode);
            gameList.push(opponentCode);
        }); // 30 games

        // 2. Division opponents: 4 games each
        const divisionOpponents = divisions[team.division].filter(c => c !== teamCode);
        divisionOpponents.forEach(opponentCode => {
            gameList.push(opponentCode);
            gameList.push(opponentCode);
            gameList.push(opponentCode);
            gameList.push(opponentCode);
        }); // 16 games

        // 3. Non-division conference opponents: 36 games total
        const conferenceOpponents = conferences[team.conference].filter(c => c !== teamCode && !divisionOpponents.includes(c));
        
        const shuffledConferenceOpponents = shuffle([...conferenceOpponents]);
        const fourGameOpponents = shuffledConferenceOpponents.slice(0, 6);
        const threeGameOpponents = shuffledConferenceOpponents.slice(6);

        fourGameOpponents.forEach(opponentCode => {
            gameList.push(opponentCode);
            gameList.push(opponentCode);
            gameList.push(opponentCode);
            gameList.push(opponentCode);
        }); // 24 games

        threeGameOpponents.forEach(opponentCode => {
            gameList.push(opponentCode);
            gameList.push(opponentCode);
            gameList.push(opponentCode);
        }); // 12 games
        
        // Total: 30 + 16 + 24 + 12 = 82 games
        schedule[teamCode] = shuffle(gameList);
    }
    
    return schedule;
};
