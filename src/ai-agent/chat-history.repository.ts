import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  ChatHistory,
  ChatHistoryDocument,
} from './schemas/chat-history.schema';

@Injectable()
export class ChatHistoryRepository {
  constructor(
    @InjectModel(ChatHistory.name, 'uppromote')
    private chatHistoryModel: Model<ChatHistoryDocument>,
  ) {}

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
}
