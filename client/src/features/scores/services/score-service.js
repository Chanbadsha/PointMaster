import { api } from '../../../lib/fetch.js';

export async function getRounds(matchId) {
  const { data } = await api.get(`/matches/${matchId}/rounds`);
  return data.rounds;
}

export async function getScores(matchId) {
  const { data } = await api.get(`/matches/${matchId}/scores`);
  return data;
}

export async function createRound(matchId, roundData) {
  const { data } = await api.post(`/matches/${matchId}/rounds`, roundData);
  return data;
}

export async function updateRound(matchId, roundId, roundData) {
  const { data } = await api.patch(`/matches/${matchId}/rounds/${roundId}`, roundData);
  return data;
}

export async function undoRound(matchId, roundId) {
  const { data } = await api.delete(`/matches/${matchId}/rounds/${roundId}`);
  return data;
}
