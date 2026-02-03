import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ChatHistoryDocument = ChatHistory & Document;

@Schema({
  collection: 'chat_histories',
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
})
export class ChatHistory {
  @Prop({ required: true, type: Number })
  shop_id: number;

  @Prop({ type: String, default: null })
  title: string | null;

  @Prop({ required: true, type: String, unique: true })
  session_id: string;

  @Prop({ type: Date, default: null })
  last_time_message: Date | null;

  @Prop({ default: () => new Date() })
  created_at?: Date;

  @Prop({ default: () => new Date() })
  updated_at?: Date;
}

export const ChatHistorySchema = SchemaFactory.createForClass(ChatHistory);
