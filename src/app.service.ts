import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHealth() {
    return {
      status:'ok',
      application: 'rpg-tables-api',
    }
  }
}
