import { Test, TestingModule } from '@nestjs/testing';

import { GameController } from './game.controller';
import { GameService } from './game.service';
import { PrismaService } from '../prisma.service';

describe('GameController', () => {
  let controller: GameController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GameController],
      providers: [GameService, PrismaService],
    }).compile();

    controller = module.get<GameController>(GameController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
