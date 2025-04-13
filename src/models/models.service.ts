import { Injectable, InternalServerErrorException } from '@nestjs/common';
import * as tf from '@tensorflow/tfjs-node';
import { StorageService } from '../storage/storage.service';
import { PredictRequestDto, PredictResponseDto } from './dto/predict.dto';
import * as os from 'os';
import * as path from 'path';
import * as fs from 'fs/promises';

import {PrismaService} from "../prisma.service";

@Injectable()
export class ModelsService {
    private modelCache = new Map<string, tf.LayersModel>();
    private tmpDir = path.join(os.tmpdir(), 'model-cache');

    constructor(
        private readonly prisma: PrismaService,
        private storageService: StorageService
    ) {
        this.initializeTmpDir();
    }

    private async initializeTmpDir() {
        await fs.mkdir(this.tmpDir, { recursive: true });
    }

    private async loadModelWeights(modelId: string): Promise<Buffer> {
        const model =
            await this.prisma.neuralModel.findFirst({ where: { id: +modelId } });
        if (!model) throw new Error('Model not found');

        return this.storageService.getModelFile(model.filePath);
    }

    private async cacheModel(modelId: string): Promise<tf.LayersModel> {
        try {

            await this.cleanupCache()

            const weights = await this.loadModelWeights(modelId);
            const modelPath = path.join(this.tmpDir, `${modelId}.h5`);

            await fs.writeFile(modelPath, weights);
            const model = await tf.loadLayersModel(`file://${modelPath}`);

            this.modelCache.set(modelId, model);
            return model;

        } catch (error) {
            throw new InternalServerErrorException('Failed to load model: ' + error.message);
        }
    }

    private async cleanupCache() {
        if (this.modelCache.size > 10) {
            const oldestKey = this.modelCache.keys().next().value;
            this.modelCache.delete(oldestKey);
        }
    }

    async batchPredict(modelId: string, requests: PredictRequestDto[]) {
        const model = this.modelCache.get(modelId);
        const inputs = requests.flatMap(r => r.inputs);
        const tensor = tf.tensor2d(inputs);
        const output = model.predict(tensor) as tf.Tensor;
        return output.arraySync();
    }

    async predict(modelId: string, data: PredictRequestDto): Promise<PredictResponseDto> {
        const startTime = Date.now();

        try {
            let model = this.modelCache.get(modelId);
            if (!model) {
                model = await this.cacheModel(modelId);
            }

            const tensor = tf.tensor2d(data.inputs);
            const output = model.predict(tensor) as tf.Tensor;
            const predictions = Array.from(output.dataSync());

            return {
                predictions: predictions.map(Number),
                inferenceTime: Date.now() - startTime,
                modelId
            };
        } catch (error) {
            throw new InternalServerErrorException(`Prediction failed: ${error.message}`);
        }
    }
}