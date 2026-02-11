import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('root', () => {
    it('should return API bootstrap message', () => {
      expect(appController.getRoot()).toEqual({
        message: 'ChessTrainer API is running',
      });
    });

    it('should return health status', () => {
      expect(appController.getHealth()).toEqual({
        status: 'ok',
        service: 'api',
      });
    });
  });
});
