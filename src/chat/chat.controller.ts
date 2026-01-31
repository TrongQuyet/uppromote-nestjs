import { Controller, Get, Post, Body, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('chat')
@UseGuards(JwtAuthGuard)
export class ChatController {
    @Post('send')
    async sendMessage(@Body() content: string, @Request() req: any) {
        const userId = req.user.id;
        // Logic to save and broadcast message
        return { status: 'success', userId, content };
    }

    @Get('messages')
    async getMessages(@Request() req: any) {
        // Logic to retrieve chat history
        console.log(req);
        return req.user;
    }
}
