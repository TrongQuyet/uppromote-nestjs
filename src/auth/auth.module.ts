import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtStrategy } from './jwt.strategy';
import { JwtAuthGuard } from './jwt-auth.guard';
import { ShopifySessionGuard } from './shopify-session.guard';
import { Shop } from '@/entities/shop.entity';
import { User } from '@/entities/user.entity';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({}),
    TypeOrmModule.forFeature([Shop, User]),
  ],
  providers: [JwtStrategy, JwtAuthGuard, ShopifySessionGuard],
  exports: [JwtAuthGuard, ShopifySessionGuard, TypeOrmModule],
})
export class AuthModule {}
