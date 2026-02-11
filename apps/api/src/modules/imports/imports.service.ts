import { Injectable } from '@nestjs/common';
import { ChessComService } from '../../integrations/chess-com/chess-com.service';

@Injectable()
export class ImportsService {
  constructor(private readonly chessComService: ChessComService) {}

  async listCandidateGames(username: string, archivesCount?: number) {
    return this.chessComService.listCandidateGames(username, archivesCount);
  }
}
