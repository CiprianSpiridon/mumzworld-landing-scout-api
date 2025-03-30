import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
  TableIndex,
} from 'typeorm';

export class CreatePageResultEntity1701097200003
  implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'page_result',
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
            name: 'sessionId',
            type: 'varchar',
            length: '36',
            isNullable: false,
          },
          {
            name: 'url',
            type: 'varchar',
            length: '2048',
            isNullable: false,
          },
          {
            name: 'pageType',
            type: 'varchar',
            length: '50',
            isNullable: true,
          },
          {
            name: 'productCount',
            type: 'int',
            isNullable: true,
          },
          {
            name: 'scanTime',
            type: 'datetime',
            isNullable: false,
          },
          {
            name: 'processingTimeMs',
            type: 'int',
            isNullable: true,
          },
          {
            name: 'status',
            type: 'enum',
            enum: [
              'SUCCESS',
              'ERROR',
              'TIMEOUT',
              'SKIPPED',
            ],
            default: "'SUCCESS'",
          },
          {
            name: 'errorMessage',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'screenshotPath',
            type: 'varchar',
            length: '1024',
            isNullable: true,
          },
          {
            name: 'htmlSnapshot',
            type: 'longtext',
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

    // Create index on sessionId
    await queryRunner.createIndex(
      'page_result',
      new TableIndex({
        name: 'IDX_page_result_sessionId',
        columnNames: ['sessionId'],
      }),
    );

    // Create foreign key to ScoutingSession table
    await queryRunner.createForeignKey(
      'page_result',
      new TableForeignKey({
        name: 'FK_page_result_scouting_session',
        columnNames: ['sessionId'],
        referencedTableName: 'scouting_session',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropForeignKey(
      'page_result',
      'FK_page_result_scouting_session',
    );
    await queryRunner.dropIndex(
      'page_result',
      'IDX_page_result_sessionId',
    );
    await queryRunner.dropTable('page_result');
  }
}
