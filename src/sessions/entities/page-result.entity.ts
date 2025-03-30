import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ScoutingSession } from './scouting-session.entity';

export enum PageResultStatus {
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR',
  TIMEOUT = 'TIMEOUT',
  SKIPPED = 'SKIPPED',
}

@Entity()
export class PageResult {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  sessionId: string;

  @ManyToOne(() => ScoutingSession, (session) => session.pageResults, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'sessionId' })
  session: ScoutingSession;

  @Column({ length: 2048 })
  url: string;

  @Column({ nullable: true, length: 50 })
  pageType: string;

  @Column({ nullable: true })
  productCount: number;

  @Column()
  scanTime: Date;

  @Column({ nullable: true })
  processingTimeMs: number;

  @Column({
    type: 'enum',
    enum: PageResultStatus,
    default: PageResultStatus.SUCCESS,
  })
  status: PageResultStatus;

  @Column({ nullable: true, type: 'text' })
  errorMessage: string;

  @Column({ nullable: true, length: 1024, type: 'varchar' })
  screenshotPath: string;

  @Column({ nullable: true, type: 'longtext' })
  htmlSnapshot: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
} 