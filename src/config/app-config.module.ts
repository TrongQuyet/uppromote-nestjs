import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import aiAgentConfig from '../ai-agent/ai-agent.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      load: [aiAgentConfig],
    }),
  ],
  exports: [ConfigModule],
})
export class AppConfigModule {}
