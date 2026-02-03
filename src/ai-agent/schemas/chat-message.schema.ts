import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ChatMessageDocument = ChatMessage & Document;

@Schema({
  collection: 'chat_messages',
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
})
export class ChatMessage {
  @Prop({ required: true, type: Number })
  shop_id: number;

  @Prop({ required: true, type: String })
  session_id: string;

  @Prop({ required: true, type: String, enum: ['User', 'AI'] })
  role: string;

  @Prop({ required: true, type: String })
  content: string;

  @Prop({ default: () => new Date() })
  created_at?: Date;

  @Prop({ default: () => new Date() })
  updated_at?: Date;
}

export const ChatMessageSchema = SchemaFactory.createForClass(ChatMessage);
