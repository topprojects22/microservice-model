import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';

import {ModelsModule} from "./models/models.module";
import { PrismaService } from './prisma.service';

@Module({
    imports: [
        ConfigModule.forRoot(),
        ThrottlerModule.forRootAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (config: ConfigService) => [
                {
                  ttl: config.get('THROTTLE_TTL'),
                  limit: config.get('THROTTLE_LIMIT'),
                },
            ],
        }),
        ModelsModule,
    ],
    controllers: [],
    providers: [PrismaService],
})
export class AppModule {}
