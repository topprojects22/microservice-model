import { Get, Param, Res, StreamableFile, Controller,
    Post,
    UploadedFile,
    UseInterceptors,
    UseGuards,
    ParseFilePipe,
    MaxFileSizeValidator,
    FileTypeValidator, } from '@nestjs/common';
import { StorageService } from './storage.service';
import { Response } from 'express';
import { ApiTags, ApiOperation, ApiResponse, ApiConsumes, ApiBody  } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { AuthGuard } from '@nestjs/passport';

@ApiTags('Storage')
@Controller('storage')
export class StorageController {
    constructor(private readonly storageService: StorageService) {}

    @Get(':filename')
    @ApiOperation({ summary: 'Get stored file' })
    @ApiResponse({ status: 200, description: 'File content' })
    async getFile(
        @Param('filename') filename: string,
        @Res({ passthrough: true }) res: Response,
    ) {
        const stream = await this.storageService.getModelStream(filename);
        res.set({
            'Content-Type': 'application/octet-stream',
            'Content-Disposition': `attachment; filename="${filename}"`,
        });
        return new StreamableFile(stream);
    }

    @Post('upload')
    @UseGuards(AuthGuard('jwt'))
    @UseInterceptors(FileInterceptor('file'))
    @ApiOperation({ summary: 'Upload model file' })
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        description: 'Model weights file',
        schema: {
            type: 'object',
            properties: {
                file: {
                    type: 'string',
                    format: 'binary',
                },
            },
        },
    })
    async uploadModel(
        @UploadedFile(
            new ParseFilePipe({
                validators: [
                    new MaxFileSizeValidator({ maxSize: 1024 * 1024 * 5 }), // 5MB
                    new FileTypeValidator({ fileType: '.(h5|pth)' }),
                ],
            })
        )
        file
    ) {
        const fileName = await this.storageService.uploadModel(file);
        return {
            filename: fileName,
            message: 'File uploaded successfully',
            size: file.size,
            hash: file.buffer.toString('hex').slice(0, 32) + '...',
        };
    }
}