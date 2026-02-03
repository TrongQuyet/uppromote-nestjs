import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('shops')
export class Shop {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255 })
  shop: string;

  @Column({ type: 'text', nullable: true })
  access_token: string | null;
}
