import { CharactersController } from './characters.controller';
import { CharactersService } from './characters.service';
import { Module } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Module({
  controllers: [CharactersController],
  providers: [CharactersService, PrismaService],
})
export class CharactersModule {}
