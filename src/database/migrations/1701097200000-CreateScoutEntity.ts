import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreateScoutEntity1701097200000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'scout',
        columns: [
          {
            name: 'id',
            type: 'varchar',
            length: '36',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'uuid',
          },
          {
            name: 'name',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'startUrl',
            type: 'varchar',
            length: '2048',
            isNullable: false,
          },
          {
            name: 'schedule',
            type: 'varchar',
            length: '100',
            isNullable: false,
          },
          {
            name: 'pageTypes',
            type: 'json',
            isNullable: false,
          },
          {
            name: 'active',
            type: 'boolean',
            default: true,
          },
          {
            name: 'maxPagesToVisit',
            type: 'int',
            isNullable: true,
          },
          {
            name: 'timeout',
            type: 'int',
            isNullable: true,
          },
          {
            name: 'lastRunAt',
            type: 'datetime',
            isNullable: true,
          },
          {
            name: 'nextRunAt',
            type: 'datetime',
            isNullable: true,
          },
          {
            name: 'createdAt',
            type: 'datetime',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updatedAt',
            type: 'datetime',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('scout');
  }
}
