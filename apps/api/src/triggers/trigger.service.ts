import { Prisma, PrismaService } from '@lib/database';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
// import { lastValueFrom } from 'rxjs';

@Injectable()
export class TriggersService {
  private readonly logger = new Logger(TriggersService.name);
  private static readonly TRIGGER_CREATE_PATTERN = {
    cmd: 'ms.jobs.triggers.add',
  };
  private static readonly TRIGGER_ACTIVATE_PATTERN = {
    cmd: 'ms.jobs.triggers.activate',
  };
  private static readonly TRIGGERS_MICROSERVICE = 'TRIGGERS_MICROSERVICE';
  private static readonly ORACLE_MICROSERVICE = 'ORACLE_MICROSERVICE';

  constructor(
    private readonly prismaService: PrismaService,
    @Inject(TriggersService.TRIGGERS_MICROSERVICE)
    private readonly triggersClient: ClientProxy,
    @Inject(TriggersService.ORACLE_MICROSERVICE)
    private readonly oracleClient: ClientProxy,
  ) {}

  async findAll() {
    this.logger.log('Finding all triggers');
    return this.prismaService.trigger.findMany();
  }

  async findOne(id: number) {
    this.logger.log(`Finding trigger with id: ${id}`);
    return this.prismaService.trigger.findUnique({
      where: { id },
    });
  }

  async create(payload: Record<string, any>) {
    this.logger.log('Forwarding trigger creation request to microservice');
    return this.triggersClient.send(
      TriggersService.TRIGGER_CREATE_PATTERN,
      payload,
    );
  }

  async createSource(payload: Record<string, any>) {
    this.logger.log('Forwarding trigger creation request to microservice');
    return this.oracleClient.send(
      TriggersService.TRIGGER_CREATE_PATTERN,
      payload,
    );
  }

  async activateTrigger(payload: Record<string, any>) {
    this.logger.log('Forwarding trigger activation request to microservice');
    return this.triggersClient.send(
      TriggersService.TRIGGER_ACTIVATE_PATTERN,
      payload,
    );
  }

  async update(id: number, data: Prisma.TriggerUpdateInput) {
    this.logger.log(`Updating trigger with id: ${id}`, data);
    return this.prismaService.trigger.update({ where: { id }, data });
  }

  async delete(id: number) {
    this.logger.log(`Deleting trigger with id: ${id}`);
    return this.prismaService.trigger.delete({ where: { id } });
  }
}
