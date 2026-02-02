import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';

// Schemas
import { ChatHistory, ChatHistorySchema } from './schemas/chat-history.schema';
import { ChatMessage, ChatMessageSchema } from './schemas/chat-message.schema';

// Repositories
import { ChatHistoryRepository } from './repositories/chat-history.repository';
import { ChatMessageRepository } from './repositories/chat-message.repository';

// Services
import { ChatHistoryService } from './services/chat-history.service';
import { ChatMessageService } from './services/chat-message.service';
import { AiAgentService } from './services/ai-agent.service';

// Controllers
import { ChatController } from './chat.controller';

@Module({
  imports: [
    ConfigModule,
    MongooseModule.forFeature(
      [
        { name: ChatHistory.name, schema: ChatHistorySchema },
        { name: ChatMessage.name, schema: ChatMessageSchema },
      ],
      'uppromote', // Use named connection
    ),
  ],
  controllers: [ChatController],
  providers: [
    // Repositories
    ChatHistoryRepository,
    ChatMessageRepository,

    // Services
    ChatHistoryService,
    ChatMessageService,
    AiAgentService,
  ],
  exports: [
    ChatHistoryService,
    ChatMessageService,
    AiAgentService,
  ],
})
export class AiAgentModule {}
