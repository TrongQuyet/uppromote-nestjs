import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ChatMessageDocument = ChatMessage & Document;

@Schema({
  collection: 'chat_messages',
  timestamps: true,
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

  @Prop({ type: Date })
  createdAt?: Date;

  @Prop({ type: Date })
  updatedAt?: Date;
}

export const ChatMessageSchema = SchemaFactory.createForClass(ChatMessage);
