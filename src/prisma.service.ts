import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService {
  client: PrismaClient = new PrismaClient({
    log: ['query', 'info', `warn`, `error`],
  });
}
