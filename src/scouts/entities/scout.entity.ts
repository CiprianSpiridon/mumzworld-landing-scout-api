import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export interface PageType {
  type: string;
  identifier: string;
  countSelector: string;
  fallbackProductSelectors?: string;
}

@Entity()
export class Scout {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 255 })
  name: string;

  @Column({ length: 2048 })
  startUrl: string;

  @Column({ length: 100 })
  schedule: string;

  @Column({ type: 'json' })
  pageTypes: PageType[];

  @Column({ default: true })
  active: boolean;

  @Column({ nullable: true })
  maxPagesToVisit: number;

  @Column({ nullable: true })
  timeout: number;

  @Column({ nullable: true })
  lastRunAt: Date;

  @Column({ nullable: true })
  nextRunAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
} 