import { api } from '../../../lib/fetch.js';

export async function getRoomMatches(roomId) {
  const { data } = await api.get(`/rooms/${roomId}/matches`);
  return data.matches;
}

export async function createMatch(roomId, matchData) {
  const { data } = await api.post(`/rooms/${roomId}/matches`, matchData);
  return data.match;
}

export async function getMatch(id) {
  const { data } = await api.get(`/matches/${id}`);
  return data.match;
}

export async function updateMatch(id, matchData) {
  const { data } = await api.patch(`/matches/${id}`, matchData);
  return data.match;
}

export async function deleteMatch(id) {
  await api.delete(`/matches/${id}`);
}

export async function startMatch(id) {
  const { data } = await api.patch(`/matches/${id}/start`);
  return data.match;
}

export async function pauseMatch(id) {
  const { data } = await api.patch(`/matches/${id}/pause`);
  return data.match;
}

export async function resumeMatch(id) {
  const { data } = await api.patch(`/matches/${id}/resume`);
  return data.match;
}

export async function finishMatch(id) {
  const { data } = await api.patch(`/matches/${id}/finish`);
  return data.match;
}
