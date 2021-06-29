import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Product {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  name!: string;

  @Column({ type: 'character varying', nullable: true })
  pictureFilename!: string | null;

  @Column({ default: false })
  isDeleted!: boolean;
}
