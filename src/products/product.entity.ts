import { ColumnNumericTransformer } from 'src/utils/ColumnNumericTrnsformer';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Product {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  name!: string;

  @Column({ type: 'character varying', nullable: true })
  pictureFilename!: string | null;

  @Column({ type: 'numeric', transformer: new ColumnNumericTransformer() })
  price!: number;

  @Column({ default: false })
  isDeleted!: boolean;
}
