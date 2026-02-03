import { createParamDecorator, ExecutionContext } from '@nestjs/common';

interface ShopRequest {
  shop_id?: number;
  shop?: string;
  shop_object?: unknown;
}

/**
 * Decorator to get shop_id from request (set by ShopifySessionGuard)
 */
export const ShopId: () => ParameterDecorator = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): number | undefined => {
    const request = ctx.switchToHttp().getRequest<ShopRequest>();
    return request.shop_id;
  },
);

/**
 * Decorator to get shop domain from request
 */
export const ShopDomain: () => ParameterDecorator = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string | undefined => {
    const request = ctx.switchToHttp().getRequest<ShopRequest>();
    return request.shop;
  },
);

/**
 * Decorator to get full shop object from request
 */
export const ShopObject: () => ParameterDecorator = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): unknown => {
    const request = ctx.switchToHttp().getRequest<ShopRequest>();
    return request.shop_object;
  },
);
