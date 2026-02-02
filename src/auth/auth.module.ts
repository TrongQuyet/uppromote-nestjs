import { Module } from '@nestjs/common';
import { JwtStrategy } from './jwt.strategy';
import { JwtModule } from '@nestjs/jwt';
import { jwtConstants } from './constants';
import * as fs from 'fs';

@Module({
    imports: [
        JwtModule.register({
            publicKey: fs.readFileSync('oauth-public.key'),
            secret: jwtConstants.secret,
            signOptions: { expiresIn: '60s' },
        }),
    ],
    providers: [JwtStrategy]
})
export class AuthModule { }
