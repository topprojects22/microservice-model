import { IsArray, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class PredictRequestDto {
    @ApiProperty({
        example: [[0.1, 0.2, 0.3], [0.4, 0.5, 0.6]],
        description: '2D array of input values'
    })
    @IsArray({ each: true })
    @IsNumber({}, { each: true })
    inputs: number[][];
}

export class PredictResponseDto {
    @ApiProperty({ example: [0.934, 0.875], description: 'Prediction results' })
    predictions: number[];

    @ApiProperty({ example: 142, description: 'Inference time in ms' })
    inferenceTime: number;

    @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000', description: 'Model ID' })
    modelId: string;
}