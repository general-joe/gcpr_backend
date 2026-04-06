/**
 * Socket.IO event handlers for community features
 * @param {Socket} socket - Socket.IO socket instance
 */
const setupCommunitySocketHandlers = (socket, io) => {
  const WRITE = global.WRITE;

  // Join community room
  socket.on('join-community-room', (communityId) => {
    socket.join(`community-${communityId}`);
    WRITE.info(`User ${socket.id} joined community room: community-${communityId}`);
  });

  // Join community group room
  socket.on('join-community-group-room', (groupId) => {
    socket.join(`community-group-${groupId}`);
    WRITE.info(`User ${socket.id} joined community group room: community-group-${groupId}`);
  });

  // Handle typing indicators for community messages
  socket.on('community-typing-start', ({ communityId, groupId, userId, isTyping }) => {
    const roomId = groupId ? `community-group-${groupId}` : `community-${communityId}`;
    socket.to(roomId).emit('community-typing-start', { userId, isTyping, communityId, groupId });
  });

  socket.on('community-typing-stop', ({ communityId, groupId, userId, isTyping }) => {
    const roomId = groupId ? `community-group-${groupId}` : `community-${communityId}`;
    socket.to(roomId).emit('community-typing-stop', { userId, isTyping, communityId, groupId });
  });

  // Handle new community message
  socket.on('new-community-message', (messageData) => {
    const { communityId, groupId } = messageData;
    const roomId = groupId ? `community-group-${groupId}` : `community-${communityId}`;
    io.to(roomId).emit('new-community-message', messageData);
  });

  // Handle new community announcement
  socket.on('new-community-announcement', (announcementData) => {
    const { communityId } = announcementData;
    io.to(`community-${communityId}`).emit('new-community-announcement', announcementData);
  });

  // Handle announcement updates
  socket.on('community-announcement-updated', (announcementData) => {
    const { communityId } = announcementData;
    io.to(`community-${communityId}`).emit('community-announcement-updated', announcementData);
  });

  // Handle announcement deletion
  socket.on('community-announcement-deleted', (data) => {
    const { communityId, announcementId } = data;
    io.to(`community-${communityId}`).emit('community-announcement-deleted', data);
  });

  // Handle announcement pin/unpin
  socket.on('community-announcement-pinned', (announcementData) => {
    const { communityId } = announcementData;
    io.to(`community-${communityId}`).emit('community-announcement-pinned', announcementData);
  });

  // Handle community member updates (when someone joins/leaves)
  socket.on('community-member-updated', (memberData) => {
    const { communityId } = memberData;
    io.to(`community-${communityId}`).emit('community-member-updated', memberData);
  });
};

module.exports = { setupCommunitySocketHandlers };