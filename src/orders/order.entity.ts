import {
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { OrderToProduct } from './orderToProduct.entity';

@Entity()
export class Order {
  @PrimaryGeneratedColumn()
  id!: number;

  @OneToMany(() => OrderToProduct, (orderToProduct) => orderToProduct.order)
  orderToProducts!: OrderToProduct[];

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updatedAt!: Date;

  @DeleteDateColumn({ type: 'timestamp with time zone' })
  deletedAt!: Date;
}
