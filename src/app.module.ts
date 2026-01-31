import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { ChatController } from './chat/chat.controller';
import { AppService } from './app.service';
import { JwtService } from '@nestjs/jwt';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [
    AuthModule
  ],
  controllers: [AppController, ChatController],
  providers: [AppService, JwtService],
})
export class AppModule { }
