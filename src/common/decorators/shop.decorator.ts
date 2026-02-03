import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * Decorator to get shop_id from request (set by ShopifySessionGuard)
 */
export const ShopId = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): number => {
    const request = ctx.switchToHttp().getRequest();
    return request.shop_id;
  },
);

/**
 * Decorator to get shop domain from request
 */
export const ShopDomain = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest();
    return request.shop;
  },
);

/**
 * Decorator to get full shop object from request
 */
export const ShopObject = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.shop_object;
  },
);
