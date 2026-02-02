import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { Response } from 'express';
import { ChatMessageService } from './chat-message.service';

interface ChatAgentData {
  session_id: string;
  chat_input: string;
  shop_id: number;
  run_id?: string | null;
}

interface StreamMetadata {
  nodeName?: string;
}

interface StreamChunk {
  type?: string;
  content?: string;
  metadata?: StreamMetadata;
}

@Injectable()
export class AiAgentService {
  private readonly logger = new Logger(AiAgentService.name);
  private readonly client: AxiosInstance;
  private readonly baseUrl: string;
  private readonly apiKey: string;
  private readonly errorMessage = 'Internal Server Error';

  constructor(
    private readonly configService: ConfigService,
    private readonly chatMessageService: ChatMessageService,
  ) {
    this.baseUrl = this.configService.get<string>('serviceApiUrl', '');
    this.apiKey = this.configService.get<string>('serviceApiKey', '');

    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: 300000, // 5 minutes
    });
  }

  /**
   * Chat with AI Agent - streaming response
   */
  async chatAgent(
    data: ChatAgentData,
    res: Response,
    clientIp: string,
  ): Promise<void> {
    await this.streamingRequest('POST', '/webhook/chat', data, res, clientIp);
  }

  /**
   * Streaming HTTP request to AI service
   */
  private async streamingRequest(
    method: string,
    url: string,
    data: Record<string, any>,
    res: Response,
    clientIp: string,
  ): Promise<void> {
    let fullResponse = '';
    let errorStreaming = false;
    const createdAtMessage = new Date(Date.now() + 1); // +1ms offset
    const shopId = data.shop_id;
    const sessionId = data.session_id;

    // Set SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');

    try {
      const headers = {
        'X-API-Key': this.apiKey,
        'X-Original-Client-IP': clientIp,
        'Content-Type': 'application/json',
        Accept: 'text/event-stream',
      };

      const response: AxiosResponse = await this.client.request({
        method,
        url,
        data,
        headers,
        responseType: 'stream',
      });

      const stream = response.data;
      let buffer = '';

      stream.on('data', (chunk: Buffer) => {
        buffer += chunk.toString();

        // Process complete lines
        let newlinePos: number;
        while ((newlinePos = buffer.indexOf('\n')) !== -1) {
          const line = buffer.slice(0, newlinePos + 1);
          buffer = buffer.slice(newlinePos + 1);

          const decoded = this.parseJsonLine(line);
          if (decoded) {
            // Check for error node
            if (decoded.metadata?.nodeName === 'return_error') {
              errorStreaming = true;
            } else if (decoded.type === 'item' && decoded.content) {
              fullResponse += decoded.content;
            }
          }

          // Forward the line to client
          if (!res.writableEnded) {
            res.write(line);
          }
        }
      });

      stream.on('end', async () => {
        // Process remaining buffer
        if (buffer !== '') {
          const decoded = this.parseJsonLine(buffer);
          if (
            decoded &&
            decoded.type === 'item' &&
            decoded.content
          ) {
            fullResponse += decoded.content;
          }

          if (!res.writableEnded) {
            res.write(buffer);
          }
        }

        // Save AI message if not error
        if (!errorStreaming && fullResponse !== '') {
          await this.saveAIMessage(
            shopId,
            sessionId,
            fullResponse,
            createdAtMessage,
          );
        }

        if (!res.writableEnded) {
          res.end();
        }
      });

      stream.on('error', (error: Error) => {
        this.logger.error('Stream error:', error);
        if (!res.writableEnded) {
          res.write(
            JSON.stringify({ error: this.errorMessage, status: 500 }) + '\n',
          );
          res.end();
        }
      });
    } catch (error: any) {
      this.logger.error('Request error:', error);

      const statusCode = error.response?.status || 500;
      const errorBody =
        error.response?.data || this.errorMessage;

      if (!res.headersSent) {
        res.status(statusCode);
      }
      if (!res.writableEnded) {
        res.write(
          typeof errorBody === 'string'
            ? errorBody
            : JSON.stringify(errorBody),
        );
        res.end();
      }
    }
  }

  /**
   * Parse JSON line safely
   */
  private parseJsonLine(line: string): StreamChunk | null {
    try {
      const trimmed = line.trim();
      if (!trimmed) return null;
      return JSON.parse(trimmed);
    } catch {
      return null;
    }
  }

  /**
   * Save AI message to database
   */
  private async saveAIMessage(
    shopId: number,
    sessionId: string,
    message: string,
    createdAt: Date,
  ): Promise<void> {
    try {
      if (shopId && sessionId) {
        await this.chatMessageService.createMessage(
          shopId,
          sessionId,
          message,
          'AI',
          createdAt,
        );
      }
    } catch (error) {
      this.logger.error('Error saving AI message:', error);
    }
  }

  /**
   * Scan Shopify store
   */
  async scanShopify(
    shopDomain: string,
    dataMetrics: Record<string, any>,
  ): Promise<{ status: number; data?: any; message?: string }> {
    try {
      const response = await this.client.post('/webhook/shopify-scan', {
        link: shopDomain,
        shop_metrics: dataMetrics,
      }, {
        headers: {
          'X-API-Key': this.apiKey,
          'Content-Type': 'application/json',
        },
      });

      const data = response.data?.data ?? null;
      return {
        status: response.status,
        data,
      };
    } catch (error: any) {
      const statusCode = error.response?.status || 500;
      const errorBody =
        error.response?.data?.message || this.errorMessage;
      return {
        status: statusCode,
        message: errorBody,
        data: [],
      };
    }
  }
}
