import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  ChatHistory,
  ChatHistoryDocument,
} from './schemas/chat-history.schema';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class ChatHistoryRepository {
  constructor(
    @InjectModel(ChatHistory.name, 'uppromote')
    private chatHistoryModel: Model<ChatHistoryDocument>,
  ) {}

  /**
   * Create a new conversation
   */
  async createNewConversation(shopId: number): Promise<string | null> {
    try {
      const sessionId = `chat-${uuidv4()}`;

      await this.chatHistoryModel.create({
        shop_id: shopId,
        session_id: sessionId,
        title: null,
        last_time_message: null,
      });

      // Destroy old empty conversations
      await this.destroyOldEmptyConversation(shopId, sessionId);

      return sessionId;
    } catch (error) {
      console.error('Error creating new conversation:', error);
      return null;
    }
  }

  /**
   * Destroy old empty conversations (older than 1 day, without title)
   */
  async destroyOldEmptyConversation(
    shopId: number,
    currentSessionId: string,
  ): Promise<void> {
    try {
      const oneDayAgo = new Date();
      oneDayAgo.setDate(oneDayAgo.getDate() - 1);

      await this.chatHistoryModel.deleteMany({
        shop_id: shopId,
        title: null,
        createdAt: { $lt: oneDayAgo },
        session_id: { $ne: currentSessionId },
      });
    } catch (error) {
      console.error('Error destroying old empty conversations:', error);
    }
  }

  /**
   * Find chat history by session_id and shop_id
   */
  async findBySessionAndShop(
    sessionId: string,
    shopId: number,
  ): Promise<ChatHistoryDocument | null> {
    return this.chatHistoryModel
      .findOne({
        session_id: sessionId,
        shop_id: shopId,
      })
      .exec();
  }

  /**
   * Check if session exists for a shop
   */
  async sessionExists(sessionId: string, shopId: number): Promise<boolean> {
    const count = await this.chatHistoryModel
      .countDocuments({
        session_id: sessionId,
        shop_id: shopId,
      })
      .exec();
    return count > 0;
  }

  /**
   * Update chat history
   */
  async updateHistory(
    sessionId: string,
    shopId: number,
    data: Partial<ChatHistory>,
  ): Promise<ChatHistoryDocument | null> {
    return this.chatHistoryModel
      .findOneAndUpdate(
        { session_id: sessionId, shop_id: shopId },
        { $set: data },
        { new: true },
      )
      .exec();
  }

  /**
   * List chat histories for a shop (with pagination)
   */
  async listHistory(
    shopId: number,
    page: number = 1,
    perPage: number = 15,
  ): Promise<{
    items: ChatHistoryDocument[];
    total: number;
    page: number;
    perPage: number;
    hasNextPage: boolean;
  }> {
    const skip = (page - 1) * perPage;

    const [items, total] = await Promise.all([
      this.chatHistoryModel
        .find({
          shop_id: shopId,
          title: { $ne: null },
        })
        .sort({ last_time_message: -1 })
        .skip(skip)
        .limit(perPage)
        .exec(),
      this.chatHistoryModel
        .countDocuments({
          shop_id: shopId,
          title: { $ne: null },
        })
        .exec(),
    ]);

    return {
      items,
      total,
      page,
      perPage,
      hasNextPage: skip + items.length < total,
    };
  }
}
