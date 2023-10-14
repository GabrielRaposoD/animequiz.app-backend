import { AnimesController } from './animes.controller';
import { AnimesService } from './animes.service';
import { Module } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Module({
  controllers: [AnimesController],
  providers: [AnimesService, PrismaService],
})
export class AnimesModule {}
