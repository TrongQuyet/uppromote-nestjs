import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull, Not } from 'typeorm';
import { Shop } from '@/entities/shop.entity';
import { User } from '@/entities/user.entity';
import * as jwt from 'jsonwebtoken';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { Request } from 'express';

interface ShopifySessionPayload {
  iss: string;
  dest: string;
  aud: string;
  sub: string;
  exp: number;
  nbf: number;
  iat: number;
  jti: string;
  sid: string;
}

interface OAuthPayload {
  aud: string;
  jti: string;
  iat: number;
  nbf: number;
  exp: number;
  sub: string;
  scopes: string[];
  shop_id?: number;
}

interface ShopData {
  id: number;
  shop: string;
  access_token: string | null;
}

interface UserData {
  id: number;
  shop_id: number;
}

interface ShopifyRequest extends Request {
  shop_id?: number;
  shop?: string;
  access_token?: string | null;
  shop_object?: ShopData;
}

@Injectable()
export class ShopifySessionGuard implements CanActivate {
  private readonly logger = new Logger(ShopifySessionGuard.name);
  private oauthPublicKey: string | null = null;

  constructor(
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    @InjectRepository(Shop)
    private readonly shopRepository: Repository<Shop>,
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {
    // Load OAuth public key for non-embedded auth
    this.loadOAuthPublicKey();
  }

  /**
   * Load OAuth public key from file
   */
  private loadOAuthPublicKey(): void {
    try {
      const keyPath = path.join(process.cwd(), 'oauth-public.key');
      if (fs.existsSync(keyPath)) {
        this.oauthPublicKey = fs.readFileSync(keyPath, 'utf8');
      }
    } catch (error) {
      this.logger.warn('Could not load OAuth public key:', error);
    }
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<ShopifyRequest>();

    try {
      const authHeaderRaw = request.headers['authorization'] as
        | string
        | string[]
        | undefined;
      const authHeader: string = Array.isArray(authHeaderRaw)
        ? (authHeaderRaw[0] ?? '')
        : (authHeaderRaw ?? '');

      // Check Bearer token format
      if (!authHeader.startsWith('Bearer ')) {
        throw new UnauthorizedException(
          'Missing or invalid authorization header',
        );
      }

      const token: string = authHeader.substring(7);
      if (!token || token === 'undefined') {
        throw new UnauthorizedException('Token is required');
      }

      // Check if request is from Shopify embedded app
      const isFromShopifyEmbedded = this.isFromShopifyEmbedded(token);

      if (isFromShopifyEmbedded) {
        return this.handleShopifyEmbeddedAuth(request, token);
      } else {
        return this.handleOAuthAuth(request, token);
      }
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }

      this.logger.error('ShopifySessionGuard error:', error);
      throw new UnauthorizedException('Authentication failed');
    }
  }

  /**
   * Check if token is from Shopify embedded app
   * by checking if issuer (iss) contains .myshopify.com
   */
  private isFromShopifyEmbedded(token: string): boolean {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return false;

      const payload = JSON.parse(
        Buffer.from(parts[1], 'base64').toString(),
      ) as Partial<ShopifySessionPayload>;
      return payload.iss?.includes('.myshopify.com') ?? false;
    } catch {
      return false;
    }
  }

  /**
   * Handle authentication for Shopify embedded app
   */
  private async handleShopifyEmbeddedAuth(
    request: ShopifyRequest,
    token: string,
  ): Promise<boolean> {
    const payload = this.decodeShopifyToken(token);

    // Validate expiration
    const now = Math.floor(Date.now() / 1000);
    if (!payload.exp || payload.exp < now) {
      throw new UnauthorizedException('Token expired');
    }

    // Extract shop domain from dest
    if (!payload.dest) {
      throw new UnauthorizedException('Invalid token payload');
    }

    const shopDomain = this.extractShopDomain(payload.dest);
    if (!shopDomain) {
      throw new UnauthorizedException('Invalid shop domain');
    }

    // Find shop in database
    const shop = (await this.shopRepository.findOne({
      where: {
        shop: shopDomain,
        access_token: Not(IsNull()),
      },
    })) as ShopData | null;
    console.log(shop);
    if (!shop) {
      throw new UnauthorizedException('Shop not found or not installed');
    }

    // Attach shop info to request
    request.shop_id = shop.id;
    request.shop = shop.shop;
    request.access_token = shop.access_token;
    request.shop_object = shop;

    return true;
  }

  /**
   * Handle authentication for non-embedded app (OAuth/Passport token)
   */
  private async handleOAuthAuth(
    request: ShopifyRequest,
    token: string,
  ): Promise<boolean> {
    if (!this.oauthPublicKey) {
      throw new UnauthorizedException('OAuth authentication not configured');
    }

    try {
      // Verify token with OAuth public key
      const payload = jwt.verify(token, this.oauthPublicKey, {
        algorithms: ['RS256'],
      }) as OAuthPayload;

      // Validate expiration
      const now = Math.floor(Date.now() / 1000);
      if (!payload.exp || payload.exp < now) {
        throw new UnauthorizedException('Token expired');
      }

      // Get shop_id from token's sub (user_id) or directly from payload
      let shopId: number | null = null;

      if (payload.shop_id) {
        shopId = payload.shop_id;
      } else if (payload.sub) {
        // sub is user_id, find shop_id from users table
        const userId = Number.parseInt(payload.sub, 10);
        if (!Number.isNaN(userId)) {
          const user = (await this.userRepository.findOne({
            where: { id: userId },
            select: ['shop_id'],
          })) as UserData | null;

          if (user) {
            shopId = user.shop_id;
          }
        }
      }

      if (!shopId) {
        throw new UnauthorizedException('Shop ID not found in token');
      }

      // Find shop in database
      const shop = (await this.shopRepository.findOne({
        where: {
          id: shopId,
          access_token: Not(IsNull()),
        },
      })) as ShopData | null;

      if (!shop) {
        throw new UnauthorizedException('Shop not found or not installed');
      }

      // Attach shop info to request
      request.shop_id = shop.id;
      request.shop = shop.shop;
      request.access_token = shop.access_token;
      request.shop_object = shop;

      return true;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }

      this.logger.error('OAuth token verification failed:', error);
      throw new UnauthorizedException('Invalid OAuth token');
    }
  }

  /**
   * Decode Shopify session token without verification
   * Shopify tokens are self-signed, so we just decode the payload
   */
  private decodeShopifyToken(token: string): ShopifySessionPayload {
    try {
      const decoded = jwt.decode(token) as ShopifySessionPayload;

      if (!decoded) {
        throw new Error('Failed to decode token');
      }

      return decoded;
    } catch (error) {
      this.logger.error('Token decode error:', error);
      throw new UnauthorizedException('Invalid token format');
    }
  }

  /**
   * Extract shop domain from dest URL
   */
  private extractShopDomain(dest: string): string | null {
    try {
      const url = new URL(dest);
      return url.hostname;
    } catch {
      return null;
    }
  }
}
