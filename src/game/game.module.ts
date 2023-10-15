import { GameController } from './game.controller';
import { GameService } from './game.service';
import { Module } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Module({
  controllers: [GameController],
  providers: [GameService, PrismaService],
})
export class GameModule {}
