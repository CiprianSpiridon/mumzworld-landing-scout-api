import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { Scout } from '../../scouts/entities/scout.entity';
import { PageResult } from './page-result.entity';

export enum SessionStatus {
  PENDING = 'PENDING',
  RUNNING = 'RUNNING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  TIMEOUT = 'TIMEOUT',
  CANCELLED = 'CANCELLED',
}

@Entity()
export class ScoutingSession {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  scoutId: string;

  @ManyToOne(() => Scout, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'scoutId' })
  scout: Scout;

  @OneToMany(() => PageResult, (pageResult) => pageResult.session)
  pageResults: PageResult[];

  @Column()
  startTime: Date;

  @Column({ nullable: true })
  endTime: Date;

  @Column({ default: 0 })
  totalPagesScanned: number;

  @Column({
    type: 'enum',
    enum: SessionStatus,
    default: SessionStatus.PENDING,
  })
  status: SessionStatus;

  @Column({ nullable: true, type: 'text' })
  errorMessage: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
} 