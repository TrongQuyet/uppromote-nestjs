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
}
