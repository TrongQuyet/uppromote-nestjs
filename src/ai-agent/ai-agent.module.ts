import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';

// Schemas
import { ChatHistory, ChatHistorySchema } from './schemas/chat-history.schema';
import { ChatMessage, ChatMessageSchema } from './schemas/chat-message.schema';

// Repositories
import { ChatHistoryRepository } from './chat-history.repository';
import { ChatMessageRepository } from './chat-message.repository';

// Services
import { ChatHistoryService } from './chat-history.service';
import { ChatMessageService } from './chat-message.service';
import { AiAgentService } from './ai-agent.service';

// Controllers
import { AiAgentController } from './ai-agent.controller';

// Auth module for guards
import { AuthModule } from '@/auth/auth.module';

@Module({
  imports: [
    ConfigModule,
    AuthModule,
    MongooseModule.forFeature(
      [
        { name: ChatHistory.name, schema: ChatHistorySchema },
        { name: ChatMessage.name, schema: ChatMessageSchema },
      ],
      'uppromote-ai-agent',
    ),
  ],
  controllers: [AiAgentController],
  providers: [
    // Repositories
    ChatHistoryRepository,
    ChatMessageRepository,

    // Services
    ChatHistoryService,
    ChatMessageService,
    AiAgentService,
  ],
  exports: [ChatHistoryService, ChatMessageService, AiAgentService],
})
export class AiAgentModule {}
