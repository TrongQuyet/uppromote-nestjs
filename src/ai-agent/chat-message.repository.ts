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
}
