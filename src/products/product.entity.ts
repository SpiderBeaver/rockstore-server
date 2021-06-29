import { OrderToProduct } from 'src/orders/orderToProduct.entity';
import { ColumnNumericTransformer } from 'src/utils/ColumnNumericTrnsformer';
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';

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

  @OneToMany(() => OrderToProduct, (orderToProduct) => orderToProduct.product)
  orderToProducts!: OrderToProduct[];

  @Column({ default: false })
  isDeleted!: boolean;
}
