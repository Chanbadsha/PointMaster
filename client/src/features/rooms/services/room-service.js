import { api } from '../../../lib/fetch.js';

export async function getRooms() {
  const { data } = await api.get('/rooms');
  return data.rooms;
}

export async function getRoom(id) {
  const { data } = await api.get(`/rooms/${id}`);
  return data.room;
}

export async function createRoom(roomData) {
  const { data } = await api.post('/rooms', roomData);
  return data.room;
}

export async function updateRoom(id, roomData) {
  const { data } = await api.patch(`/rooms/${id}`, roomData);
  return data.room;
}

export async function deleteRoom(id) {
  await api.delete(`/rooms/${id}`);
}

export async function getMembers(roomId) {
  const { data } = await api.get(`/rooms/${roomId}/members`);
  return data.members;
}

export async function addMember(roomId, playerId) {
  const { data } = await api.post(`/rooms/${roomId}/members`, { playerId });
  return data.member;
}

export async function removeMember(roomId, playerId) {
  await api.delete(`/rooms/${roomId}/members/${playerId}`);
}

export async function updateMemberRole(roomId, playerId, role) {
  const { data } = await api.patch(
    `/rooms/${roomId}/members/${playerId}/role`,
    { role }
  );
  return data.member;
}

export async function joinRoom(roomCode) {
  const { data } = await api.post('/rooms/join', { roomCode });
  return data;
}

export async function leaveRoom(roomId) {
  await api.delete(`/rooms/${roomId}/members/me`);
}
