import { Injectable } from '@nestjs/common';
import { ChatMessageRepository } from './chat-message.repository';
import { ChatMessageDocument } from './schemas/chat-message.schema';

@Injectable()
export class ChatMessageService {
  constructor(private readonly chatMessageRepository: ChatMessageRepository) {}

  /**
   * Create a new message
   */
  async createMessage(
    shopId: number,
    sessionId: string,
    message: string,
    role: 'User' | 'AI',
    createdAt?: Date,
  ): Promise<ChatMessageDocument> {
    return this.chatMessageRepository.create({
      shop_id: shopId,
      session_id: sessionId,
      content: message,
      role,
      createdAt: createdAt || new Date(),
    });
  }

  /**
   * List messages with cursor-based pagination
   */
  async listMessage(
    shopId: number,
    sessionId: string,
    cursor: string | null,
    perPage: number = 15,
  ) {
    return this.chatMessageRepository.listMessages(
      shopId,
      sessionId,
      cursor,
      perPage,
    );
  }
}
