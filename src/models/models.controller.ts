import { Body, Controller, Post, Param } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ModelsService } from './models.service';
import { PredictRequestDto, PredictResponseDto } from './dto/predict.dto';
import { AuthGuard } from '@nestjs/passport';
import { UseGuards } from '@nestjs/common';

@ApiTags('Model Predictions')
@Controller('models')
export class ModelsController {
    constructor(private readonly modelsService: ModelsService) {}

    @Post(':id/predict')
    @UseGuards(AuthGuard('jwt'))
    @ApiOperation({ summary: 'Run model prediction' })
    @ApiResponse({
        status: 200,
        type: PredictResponseDto,
        description: 'Successful prediction'
    })
    async predict(
        @Param('id') modelId: string,
        @Body() predictDto: PredictRequestDto
    ): Promise<PredictResponseDto> {
        return this.modelsService.predict(modelId, predictDto);
    }
}