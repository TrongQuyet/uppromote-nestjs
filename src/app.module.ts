import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { JwtService } from '@nestjs/jwt';
import { AuthModule } from './auth/auth.module';
import { AiAgentModule } from './ai-agent/ai-agent.module';
import { DatabaseModule } from './database/database.module';
import aiAgentConfig from './ai-agent/ai-agent.config';

@Module({
  imports: [
    // Configuration module for environment variables
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      load: [aiAgentConfig],
    }),

    // MySQL connection for Shopify data
    DatabaseModule,

    // MongoDB connection for AI Agent chat data
    MongooseModule.forRoot(
      process.env.MONGODB_AI_AGENT_URI ||
        'mongodb://localhost:27017/uppromote_ai_agent',
      {
        connectionName: 'uppromote',
      },
    ),

    AuthModule,
    AiAgentModule,
  ],
  controllers: [AppController],
  providers: [AppService, JwtService],
})
export class AppModule {}
