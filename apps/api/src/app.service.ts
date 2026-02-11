import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getRoot() {
    return {
      message: 'ChessTrainer API is running',
    };
  }

  getHealth() {
    return {
      status: 'ok' as const,
      service: 'api' as const,
    };
  }
}
