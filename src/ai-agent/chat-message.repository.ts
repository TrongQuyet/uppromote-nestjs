import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  ChatMessage,
  ChatMessageDocument,
} from './schemas/chat-message.schema';

@Injectable()
export class ChatMessageRepository {
  constructor(
    @InjectModel(ChatMessage.name, 'uppromote')
    private chatMessageModel: Model<ChatMessageDocument>,
  ) {}

  /**
   * Create a new message
   */
  async create(data: {
    shop_id: number;
    session_id: string;
    content: string;
    role: 'User' | 'AI';
    createdAt?: Date;
  }): Promise<ChatMessageDocument> {
    return this.chatMessageModel.create({
      shop_id: data.shop_id,
      session_id: data.session_id,
      content: data.content,
      role: data.role,
      createdAt: data.createdAt || new Date(),
    });
  }

  /**
   * List messages for a session with cursor-based pagination
   */
  async listMessages(
    shopId: number,
    sessionId: string,
    cursor: string | null,
    perPage: number = 15,
  ): Promise<{
    data: ChatMessageDocument[];
    nextCursor: string | null;
    perPage: number;
    existsMessage: boolean;
  }> {
    const query: Record<string, any> = {
      shop_id: shopId,
      session_id: sessionId,
    };

    // Check if any messages exist
    const existsMessage =
      (await this.chatMessageModel.countDocuments(query).exec()) > 0;

    // Apply cursor if provided
    if (cursor) {
      query.createdAt = { $lt: new Date(cursor) };
    }

    const messages = await this.chatMessageModel
      .find(query)
      .sort({ createdAt: -1 })
      .limit(perPage)
      .exec();

    // Reverse to get chronological order
    const reversedMessages = [...messages].reverse();

    // Get next cursor from the last message
    const nextCursor =
      messages.length > 0
        ? messages[messages.length - 1].createdAt?.toISOString() || null
        : null;

    return {
      data: reversedMessages,
      nextCursor,
      perPage,
      existsMessage,
    };
  }

  /**
   * Find messages by session
   */
  async findBySession(sessionId: string): Promise<ChatMessageDocument[]> {
    return this.chatMessageModel
      .find({ session_id: sessionId })
      .sort({ createdAt: 1 })
      .exec();
  }
}
