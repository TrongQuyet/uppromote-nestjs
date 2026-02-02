import { Injectable } from '@nestjs/common';
import { ChatHistoryRepository } from '../repositories/chat-history.repository';
import { ChatHistoryDocument } from '../schemas/chat-history.schema';

@Injectable()
export class ChatHistoryService {
  constructor(private readonly chatHistoryRepository: ChatHistoryRepository) {}

  /**
   * Create a new conversation
   */
  async createNewConversation(shopId: number): Promise<string | null> {
    return this.chatHistoryRepository.createNewConversation(shopId);
  }

  /**
   * Find chat history by session and shop
   */
  async findBySessionAndShop(
    sessionId: string,
    shopId: number,
  ): Promise<ChatHistoryDocument | null> {
    return this.chatHistoryRepository.findBySessionAndShop(sessionId, shopId);
  }

  /**
   * Check if session exists for a shop
   */
  async sessionExists(sessionId: string, shopId: number): Promise<boolean> {
    return this.chatHistoryRepository.sessionExists(sessionId, shopId);
  }

  /**
   * Update history session with title and last_time_message
   */
  async updateHistorySessionId(
    shopId: number,
    sessionId: string,
    message: string,
    timeMessage: Date,
  ): Promise<void> {
    const chatHistory = await this.chatHistoryRepository.findBySessionAndShop(
      sessionId,
      shopId,
    );

    if (!chatHistory) {
      return;
    }

    const updateData: Record<string, any> = {
      last_time_message: timeMessage,
    };

    // Set title if it's null (first message)
    if (chatHistory.title === null) {
      updateData.title = message;
    }

    await this.chatHistoryRepository.updateHistory(
      sessionId,
      shopId,
      updateData,
    );
  }

  /**
   * List chat histories with pagination
   */
  async listHistory(shopId: number, perPage: number = 15) {
    return this.chatHistoryRepository.listHistory(shopId, 1, perPage);
  }
}
