import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  Unique,
} from 'typeorm';
import { Scout } from './scout.entity';

@Entity()
@Unique(['scoutId', 'date'])
export class ScoutHistory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @Index()
  scoutId: string;

  @ManyToOne(() => Scout, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'scoutId' })
  scout: Scout;

  @Column({ type: 'date' })
  @Index()
  date: Date;

  @Column({ default: 0 })
  totalSessions: number;

  @Column({ default: 0 })
  successfulSessions: number;

  @Column({ default: 0 })
  failedSessions: number;

  @Column({ type: 'float', default: 0 })
  avgPagesScanned: number;

  @Column({ type: 'float', default: 0 })
  avgProductCount: number;

  @Column({ default: 0 })
  maxProductCount: number;

  @Column({ nullable: true })
  minProductCount: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
} 