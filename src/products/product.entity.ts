import { OrderToProduct } from 'src/orders/orderToProduct.entity';
import { ColumnNumericTransformer } from 'src/utils/ColumnNumericTrnsformer';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity()
export class Product {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ unique: true })
  sku!: string;

  @Column()
  name!: string;

  @Column({ type: 'character varying', nullable: true })
  description!: string | null;

  @Column({ type: 'character varying', nullable: true })
  pictureFilename!: string | null;

  @Column({ type: 'numeric', transformer: new ColumnNumericTransformer() })
  price!: number;

  @Column({ default: 1 })
  inStock!: number;

  @OneToMany(() => OrderToProduct, (orderToProduct) => orderToProduct.product)
  orderToProducts!: OrderToProduct[];

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updatedAt!: Date;

  @DeleteDateColumn({ type: 'timestamp with time zone' })
  deletedAt!: Date;
}
