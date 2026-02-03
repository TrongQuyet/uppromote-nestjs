import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ShopifySessionGuard } from './shopify-session.guard';
import { Shop } from '@/entities/shop.entity';
import { User } from '@/entities/user.entity';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    TypeOrmModule.forFeature([Shop, User]),
  ],
  providers: [ShopifySessionGuard],
  exports: [ShopifySessionGuard, TypeOrmModule],
})
export class AuthModule {}
