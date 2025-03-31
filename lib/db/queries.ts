import 'server-only';

import { genSaltSync, hashSync, compare } from 'bcrypt-ts';
// Import from schema but we won't use the actual DB
import {
  user,
  chat,
  type User,
  document,
  type Suggestion,
  suggestion,
  type Message,
  message,
  vote,
} from './schema';
import { BlockKind } from '@/components/block';

// In-memory storage for mock data
const inMemoryUsers: User[] = [];
const inMemoryChats: any[] = [];
const inMemoryMessages: Message[] = [];
const inMemoryVotes: any[] = [];
const inMemoryDocuments: any[] = [];

// Mock implementation that doesn't require PostgreSQL
export async function getUser(email: string): Promise<Array<User>> {
  try {
    return inMemoryUsers.filter(u => u.email === email);
  } catch (error) {
    console.error('Failed to get user from in-memory database');
    throw error;
  }
}

export async function getUserById(id: string): Promise<User | null> {
  try {
    const user = inMemoryUsers.find(u => u.id === id);
    return user || null;
  } catch (error) {
    console.error('Failed to get user by ID from in-memory database');
    throw error;
  }
}

export async function ensureDefaultUserExists(userId: string, email: string, password: string) {
  try {
    // Check if user already exists with this email
    const existingUsers = await getUser(email);
    if (existingUsers.length > 0) {
      console.log('Default user already exists');
      return existingUsers[0];
    }
    
    // Create default user if it doesn't exist
    console.log('Creating default user');
    const salt = genSaltSync(10);
    const hash = hashSync(password, salt);
    const defaultUser = { 
      id: userId,
      email, 
      password: hash,
      createdAt: new Date()
    };
    
    inMemoryUsers.push(defaultUser as User);
    return defaultUser;
  } catch (error) {
    console.error('Failed to ensure default user exists:', error);
    throw error;
  }
}

export async function createUser(email: string, password: string) {
  const salt = genSaltSync(10);
  const hash = hashSync(password, salt);
  const newUser = { 
    id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    email, 
    password: hash,
    createdAt: new Date()
  };

  try {
    inMemoryUsers.push(newUser as User);
    return newUser;
  } catch (error) {
    console.error('Failed to create user in in-memory database');
    throw error;
  }
}

export async function saveChat({
  id,
  userId,
  title,
}: {
  id: string;
  userId: string;
  title: string;
}) {
  try {
    const newChat = {
      id,
      createdAt: new Date(),
      userId,
      title,
    };
    inMemoryChats.push(newChat);
    return newChat;
  } catch (error) {
    console.error('Failed to save chat in in-memory database');
    throw error;
  }
}

export async function deleteChatById({ id }: { id: string }) {
  try {
    // Remove related votes
    const voteIndex = inMemoryVotes.findIndex(v => v.chatId === id);
    if (voteIndex !== -1) {
      inMemoryVotes.splice(voteIndex, 1);
    }
    
    // Remove related messages
    const messageIndex = inMemoryMessages.findIndex(m => m.chatId === id);
    if (messageIndex !== -1) {
      inMemoryMessages.splice(messageIndex, 1);
    }
    
    // Remove the chat
    const chatIndex = inMemoryChats.findIndex(c => c.id === id);
    if (chatIndex !== -1) {
      inMemoryChats.splice(chatIndex, 1);
    }
    
    return { success: true };
  } catch (error) {
    console.error('Failed to delete chat by id from in-memory database');
    throw error;
  }
}

export async function getChatsByUserId({ id }: { id: string }) {
  try {
    return inMemoryChats
      .filter(c => c.userId === id)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  } catch (error) {
    console.error('Failed to get chats by user from in-memory database');
    throw error;
  }
}

export async function getChatById({ id }: { id: string }) {
  try {
    return inMemoryChats.find(c => c.id === id) || null;
  } catch (error) {
    console.error('Failed to get chat by id from in-memory database');
    throw error;
  }
}

export async function saveMessages({ messages }: { messages: Array<Message> }) {
  try {
    inMemoryMessages.push(...messages);
    return { success: true };
  } catch (error) {
    console.error('Failed to save messages in in-memory database', error);
    throw error;
  }
}

export async function getMessagesByChatId({ id }: { id: string }) {
  try {
    return inMemoryMessages
      .filter(m => m.chatId === id)
      .sort((a, b) => {
        const aTime = a.createdAt instanceof Date ? a.createdAt.getTime() : 0;
        const bTime = b.createdAt instanceof Date ? b.createdAt.getTime() : 0;
        return aTime - bTime;
      });
  } catch (error) {
    console.error('Failed to get messages by chat id from in-memory database', error);
    throw error;
  }
}

export async function voteMessage({
  chatId,
  messageId,
  type,
}: {
  chatId: string;
  messageId: string;
  type: 'up' | 'down';
}) {
  try {
    const existingVote = inMemoryVotes.find(v => v.messageId === messageId);

    if (existingVote) {
      existingVote.isUpvoted = type === 'up';
      return { success: true };
    }
    
    inMemoryVotes.push({
      chatId,
      messageId,
      isUpvoted: type === 'up',
    });
    
    return { success: true };
  } catch (error) {
    console.error('Failed to upvote message in in-memory database', error);
    throw error;
  }
}

export async function getVotesByChatId({ id }: { id: string }) {
  try {
    return inMemoryVotes.filter(v => v.chatId === id);
  } catch (error) {
    console.error('Failed to get votes by chat id from in-memory database', error);
    throw error;
  }
}

export async function saveDocument({
  id,
  title,
  kind,
  content,
  userId,
}: {
  id: string;
  title: string;
  kind: BlockKind;
  content: string;
  userId: string;
}) {
  try {
    const doc = {
      id,
      title,
      kind,
      content,
      userId,
      createdAt: new Date(),
    };
    inMemoryDocuments.push(doc);
    return { success: true };
  } catch (error) {
    console.error('Failed to save document in in-memory database');
    throw error;
  }
}

export async function getDocumentsById({ id }: { id: string }) {
  try {
    return inMemoryDocuments.filter(d => d.id === id);
  } catch (error) {
    console.error('Failed to get documents by id from in-memory database');
    throw error;
  }
}

export async function getDocumentsByUserId({ id }: { id: string }) {
  try {
    return inMemoryDocuments
      .filter(d => d.userId === id)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  } catch (error) {
    console.error('Failed to get documents by user id from in-memory database');
    throw error;
  }
}

export async function removeDocumentById({ id }: { id: string }) {
  try {
    const index = inMemoryDocuments.findIndex(d => d.id === id);
    if (index !== -1) {
      inMemoryDocuments.splice(index, 1);
    }
    return { success: true };
  } catch (error) {
    console.error('Failed to remove document by id from in-memory database');
    throw error;
  }
}

export async function getDocumentById({ id }: { id: string }) {
  try {
    return inMemoryDocuments.find(d => d.id === id) || null;
  } catch (error) {
    console.error('Failed to get document by id from in-memory database');
    throw error;
  }
}

export async function saveSuggestion({
  id,
  content,
  source,
}: {
  id: string;
  content: string;
  source: string;
}) {
  try {
    // Implementation not needed for basic operation
    return { success: true };
  } catch (error) {
    console.error('Failed to save suggestion in in-memory database');
    throw error;
  }
}

export async function getSuggestionById({ id }: { id: string }): Promise<Suggestion | null> {
  try {
    // Implementation not needed for basic operation
    return null;
  } catch (error) {
    console.error('Failed to get suggestion by id from in-memory database');
    throw error;
  }
}

export async function getSuggestionsByDocumentId({ id }: { id: string }) {
  try {
    // Implementation not needed for basic operation
    return [];
  } catch (error) {
    console.error('Failed to get suggestions by document id from in-memory database');
    throw error;
  }
}

export async function getMessageById({ id }: { id: string }) {
  try {
    return inMemoryMessages.filter(m => m.id === id);
  } catch (error) {
    console.error('Failed to get message by id from in-memory database');
    throw error;
  }
}

export async function deleteMessagesByChatIdAfterTimestamp({
  chatId,
  timestamp,
}: {
  chatId: string;
  timestamp: Date;
}) {
  try {
    const messagesToRemoveIndexes = [];
    for (let i = 0; i < inMemoryMessages.length; i++) {
      const message = inMemoryMessages[i];
      if (message.chatId === chatId && message.createdAt >= timestamp) {
        messagesToRemoveIndexes.push(i);
      }
    }
    
    // Remove from the end to avoid index shifting issues
    for (let i = messagesToRemoveIndexes.length - 1; i >= 0; i--) {
      inMemoryMessages.splice(messagesToRemoveIndexes[i], 1);
    }
    
    return { success: true };
  } catch (error) {
    console.error('Failed to delete messages by id after timestamp from in-memory database');
    throw error;
  }
}

export async function updateChatVisiblityById({
  chatId,
  visibility,
}: {
  chatId: string;
  visibility: 'private' | 'public';
}) {
  try {
    const chat = inMemoryChats.find(c => c.id === chatId);
    if (chat) {
      chat.visibility = visibility;
    }
    return { success: true };
  } catch (error) {
    console.error('Failed to update chat visibility in in-memory database');
    throw error;
  }
}

export async function deleteDocumentsByIdAfterTimestamp({
  id,
  timestamp,
}: {
  id: string;
  timestamp: Date;
}) {
  try {
    // First remove any suggestions related to the document
    const suggestionIndexesToRemove = [];
    // This would be implemented if we had suggestion storage
    
    // Then remove the document
    const documentIndexesToRemove = [];
    for (let i = 0; i < inMemoryDocuments.length; i++) {
      const doc = inMemoryDocuments[i];
      if (doc.id === id && doc.createdAt > timestamp) {
        documentIndexesToRemove.push(i);
      }
    }
    
    // Remove from the end to avoid index shifting issues
    for (let i = documentIndexesToRemove.length - 1; i >= 0; i--) {
      inMemoryDocuments.splice(documentIndexesToRemove[i], 1);
    }
    
    return { success: true };
  } catch (error) {
    console.error('Failed to delete documents by id after timestamp from database');
    throw error;
  }
}

export async function saveSuggestions({
  suggestions,
}: {
  suggestions: Array<Suggestion>;
}) {
  try {
    // Implementation not needed for basic operation
    return { success: true };
  } catch (error) {
    console.error('Failed to save suggestions in database');
    throw error;
  }
}
