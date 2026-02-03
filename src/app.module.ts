import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { AiAgentModule } from './ai-agent/ai-agent.module';
import { DatabaseModule } from './database/database.module';
import { AppConfigModule } from './config/app-config.module';

@Module({
  imports: [AppConfigModule, DatabaseModule, AuthModule, AiAgentModule],
})
export class AppModule {}
