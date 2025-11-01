import { BaseApiClient } from './base';

export class DatabaseApi extends BaseApiClient {
  async initDatabase(): Promise<{ message: string }> {
    return this.post('/init-db');
  }
}