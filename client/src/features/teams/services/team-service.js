import { api } from '../../../lib/fetch.js';

export async function getTeams(matchId) {
  const { data } = await api.get(`/matches/${matchId}/teams`);
  return data.teams;
}

export async function createTeam(matchId, teamData) {
  const { data } = await api.post(`/matches/${matchId}/teams`, teamData);
  return data.team;
}

export async function updateTeam(matchId, teamId, teamData) {
  const { data } = await api.patch(`/matches/${matchId}/teams/${teamId}`, teamData);
  return data.team;
}

export async function deleteTeam(matchId, teamId) {
  await api.delete(`/matches/${matchId}/teams/${teamId}`);
}

export async function validateTeams(matchId) {
  const { data } = await api.post(`/matches/${matchId}/teams/validate`);
  return data;
}
