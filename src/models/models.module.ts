import { Module } from '@nestjs/common';
import {ModelsController} from "./models.controller";
import {ModelsService} from "./models.service";

import { ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import {StorageService} from "../storage/storage.service";
import {PrismaService} from "../prisma.service";
import {ConfigService} from "@nestjs/config";

@Module({
    imports: [],
    controllers: [ModelsController],
    providers: [ModelsService, StorageService, ConfigService, PrismaService, {
        provide: APP_GUARD,
        useClass: ThrottlerGuard,
    },],
})
export class ModelsModule {}