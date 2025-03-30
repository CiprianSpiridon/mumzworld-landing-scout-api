import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
  TableIndex,
} from 'typeorm';

export class CreateScoutHistoryEntity1701097200001
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'scout_history',
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
            name: 'scoutId',
            type: 'varchar',
            length: '36',
            isNullable: false,
          },
          {
            name: 'date',
            type: 'date',
            isNullable: false,
          },
          {
            name: 'totalSessions',
            type: 'int',
            default: 0,
          },
          {
            name: 'successfulSessions',
            type: 'int',
            default: 0,
          },
          {
            name: 'failedSessions',
            type: 'int',
            default: 0,
          },
          {
            name: 'avgPagesScanned',
            type: 'float',
            default: 0,
          },
          {
            name: 'avgProductCount',
            type: 'float',
            default: 0,
          },
          {
            name: 'maxProductCount',
            type: 'int',
            default: 0,
          },
          {
            name: 'minProductCount',
            type: 'int',
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

    // Create unique index on scoutId and date
    await queryRunner.createIndex(
      'scout_history',
      new TableIndex({
        name: 'IDX_scout_history_scoutId_date',
        columnNames: ['scoutId', 'date'],
        isUnique: true,
      }),
    );

    // Create index on scoutId
    await queryRunner.createIndex(
      'scout_history',
      new TableIndex({
        name: 'IDX_scout_history_scoutId',
        columnNames: ['scoutId'],
      }),
    );

    // Create index on date
    await queryRunner.createIndex(
      'scout_history',
      new TableIndex({
        name: 'IDX_scout_history_date',
        columnNames: ['date'],
      }),
    );

    // Create foreign key to Scout table
    await queryRunner.createForeignKey(
      'scout_history',
      new TableForeignKey({
        name: 'FK_scout_history_scout',
        columnNames: ['scoutId'],
        referencedTableName: 'scout',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropForeignKey('scout_history', 'FK_scout_history_scout');
    await queryRunner.dropIndex('scout_history', 'IDX_scout_history_date');
    await queryRunner.dropIndex('scout_history', 'IDX_scout_history_scoutId');
    await queryRunner.dropIndex(
      'scout_history',
      'IDX_scout_history_scoutId_date',
    );
    await queryRunner.dropTable('scout_history');
  }
}
