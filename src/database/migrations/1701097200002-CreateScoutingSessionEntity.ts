import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
  TableIndex,
} from 'typeorm';

export class CreateScoutingSessionEntity1701097200002
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'scouting_session',
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
            name: 'startTime',
            type: 'datetime',
            isNullable: false,
          },
          {
            name: 'endTime',
            type: 'datetime',
            isNullable: true,
          },
          {
            name: 'totalPagesScanned',
            type: 'int',
            default: 0,
          },
          {
            name: 'status',
            type: 'enum',
            enum: [
              'PENDING',
              'RUNNING',
              'COMPLETED',
              'FAILED',
              'TIMEOUT',
              'CANCELLED',
            ],
            default: "'PENDING'",
          },
          {
            name: 'errorMessage',
            type: 'text',
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

    // Create index on scoutId
    await queryRunner.createIndex(
      'scouting_session',
      new TableIndex({
        name: 'IDX_scouting_session_scoutId',
        columnNames: ['scoutId'],
      }),
    );

    // Create foreign key to Scout table
    await queryRunner.createForeignKey(
      'scouting_session',
      new TableForeignKey({
        name: 'FK_scouting_session_scout',
        columnNames: ['scoutId'],
        referencedTableName: 'scout',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropForeignKey(
      'scouting_session',
      'FK_scouting_session_scout',
    );
    await queryRunner.dropIndex(
      'scouting_session',
      'IDX_scouting_session_scoutId',
    );
    await queryRunner.dropTable('scouting_session');
  }
}
