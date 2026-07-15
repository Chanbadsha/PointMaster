import { api } from '../../../lib/fetch.js';

export async function getPlayers() {
  const { data } = await api.get('/players');
  return data.players;
}

export async function searchPlayers(query) {
  const { data } = await api.get(`/players/search?q=${encodeURIComponent(query)}`);
  return data.players;
}

export async function getPlayer(id) {
  const { data } = await api.get(`/players/${id}`);
  return data.player;
}

export async function createPlayer(playerData) {
  const { data } = await api.post('/players', playerData);
  return data.player;
}

export async function updatePlayer(id, playerData) {
  const { data } = await api.patch(`/players/${id}`, playerData);
  return data.player;
}

export async function deletePlayer(id) {
  await api.delete(`/players/${id}`);
}

export async function linkPlayer(id) {
  const { data } = await api.post(`/players/${id}/link`);
  return data.player;
}

export async function unlinkPlayer(id) {
  const { data } = await api.post(`/players/${id}/unlink`);
  return data.player;
}
