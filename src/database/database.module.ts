import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    // MySQL
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'mysql',
        host: configService.get<string>('DB_HOST', 'localhost'),
        port: configService.get<number>('DB_PORT', 3306),
        username: configService.get<string>('DB_USERNAME', 'root'),
        password: configService.get<string>('DB_PASSWORD', ''),
        database: configService.get<string>('DB_DATABASE', 'uppromote'),
        autoLoadEntities: true,
        synchronize: false,
      }),
    }),

    // MongoDB
    MongooseModule.forRootAsync({
      connectionName: 'uppromote',
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const host = configService.get<string>(
          'DB_MONGODB_AI_AGENT_HOST',
          '127.0.0.1',
        );
        const port = configService.get<number>(
          'DB_MONGODB_AI_AGENT_PORT',
          27017,
        );
        const database = configService.get<string>(
          'DB_MONGODB_AI_AGENT_DATABASE',
          'uppromote_ai_agent',
        );

        const username = configService.get<string>(
          'DB_MONGODB_AI_AGENT_USERNAME',
          '',
        );
        const password = configService.get<string>(
          'DB_MONGODB_AI_AGENT_PASSWORD',
          '',
        );

        const hasAuth = !!username && !!password;
        const auth = hasAuth
          ? `${encodeURIComponent(username)}:${encodeURIComponent(password)}@`
          : '';

        const uri = `mongodb://${auth}${host}:${port}/${database}`;

        const authSource = configService.get<string>(
          'DB_MONGODB_AI_AGENT_AUTH_SOURCE',
          '',
        );
        const finalUri = authSource
          ? `${uri}?authSource=${encodeURIComponent(authSource)}`
          : uri;

        return { uri: finalUri };
      },
    }),
  ],
  exports: [TypeOrmModule, MongooseModule],
})
export class DatabaseModule {}
