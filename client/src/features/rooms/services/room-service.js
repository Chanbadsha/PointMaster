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
