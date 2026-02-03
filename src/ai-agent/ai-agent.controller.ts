import {
  Controller,
  Post,
  Body,
  Req,
  Res,
  HttpStatus,
  HttpException,
  UsePipes,
  ValidationPipe,
  UseGuards,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { SendMessageDto } from './dto/send-message.dto';
import { ChatHistoryService } from './chat-history.service';
import { ChatMessageService } from './chat-message.service';
import { AiAgentService } from './ai-agent.service';
import { ShopifySessionGuard } from '@/auth/shopify-session.guard';
import { ShopId } from '@/common/decorators/shop.decorator';

interface AuthenticatedRequest extends Request {
  shop_id?: number;
  shop?: string;
  access_token?: string;
  shop_object?: any;
}

@Controller('ai-agent/chat')
@UseGuards(ShopifySessionGuard)
export class AiAgentController {
  constructor(
    private readonly chatHistoryService: ChatHistoryService,
    private readonly chatMessageService: ChatMessageService,
    private readonly aiAgentService: AiAgentService,
  ) {}

  /**
   * Send message to AI Agent
   * Route: POST /api/ai-agent/chat/send-message
   */
  @Post('send-message')
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async sendMessage(
    @Body() dto: SendMessageDto,
    @ShopId() shopId: number,
    @Req() req: AuthenticatedRequest,
    @Res() res: Response,
  ): Promise<void> {
    try {
      // Shop ID is now from ShopifySessionGuard via @ShopId() decorator
      if (!shopId) {
        throw new HttpException(
          {
            status: HttpStatus.UNAUTHORIZED,
            message: 'Shop ID is required',
            data: [],
          },
          HttpStatus.UNAUTHORIZED,
        );
      }

      const { session_id, message, run_id, first_message } = dto;

      // Validate session exists
      const sessionExists = await this.chatHistoryService.sessionExists(
        session_id,
        shopId,
      );

      if (!sessionExists) {
        res.status(HttpStatus.UNPROCESSABLE_ENTITY).json({
          status: HttpStatus.UNPROCESSABLE_ENTITY,
          message: 'Validation failed',
          errors: {
            session_id: ['Session ID not found'],
          },
          data: [],
        });
        return;
      }

      const timeMessage = new Date();
      const timeMessageDefault = new Date(timeMessage.getTime() - 1);

      // Handle history update based on first_message flag
      if (first_message) {
        // Update history immediately for first message
        await this.updateHistoryAndCreateDefaultMessage(
          shopId,
          session_id,
          message,
          timeMessage,
          timeMessageDefault,
        );
      } else {
        // Update history asynchronously (non-blocking)
        this.updateHistoryAndCreateDefaultMessage(
          shopId,
          session_id,
          message,
          timeMessage,
          timeMessageDefault,
        ).catch((error) => {
          console.error('Error updating history:', error);
        });
      }

      // Create user message
      await this.chatMessageService.createMessage(
        shopId,
        session_id,
        message,
        'User',
        timeMessage,
      );

      // Prepare data for AI Agent
      const chatData = {
        session_id,
        chat_input: message,
        shop_id: shopId,
        run_id: run_id || null,
      };

      // Get client IP
      const clientIp = this.getClientIp(req);

      // Stream response from AI Agent
      await this.aiAgentService.chatAgent(chatData, res, clientIp);
    } catch (error) {
      console.error('Error in sendMessage:', error);

      if (error instanceof HttpException) {
        throw error;
      }

      if (!res.headersSent) {
        res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Internal Server Error',
          data: [],
        });
      }
    }
  }

  /**
   * Update history session and create default AI message if first message
   */
  private async updateHistoryAndCreateDefaultMessage(
    shopId: number,
    sessionId: string,
    message: string,
    timeMessage: Date,
    timeMessageDefault: Date,
  ): Promise<void> {
    const chatHistory = await this.chatHistoryService.findBySessionAndShop(
      sessionId,
      shopId,
    );

    if (!chatHistory) {
      return;
    }

    // If title is null (first message), create default AI message
    if (chatHistory.title === null) {
      const messageDefault = this.getMessageDefault('Merchant'); // TODO: Get actual brand name from merchant settings
      await this.chatMessageService.createMessage(
        shopId,
        sessionId,
        messageDefault,
        'AI',
        timeMessageDefault,
      );
    }

    // Update history
    await this.chatHistoryService.updateHistorySessionId(
      shopId,
      sessionId,
      message,
      timeMessage,
    );
  }

  /**
   * Get default AI message
   */
  private getMessageDefault(brandName: string): string {
    return `Hello ${brandName}! 👋 I'm your UpPromote assistant. I'm here to help you set up your affiliate program, answer questions, or connect you with our support team. How can I assist you today?`;
  }

  /**
   * Get client IP from request
   */
  private getClientIp(req: Request): string {
    const forwarded = req.headers['x-forwarded-for'];
    if (typeof forwarded === 'string') {
      return forwarded.split(',')[0].trim();
    }
    if (Array.isArray(forwarded)) {
      return forwarded[0];
    }
    return req.ip || req.socket.remoteAddress || '';
  }
}
