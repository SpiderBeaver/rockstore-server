import { Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { OrderToProduct } from './orderToProduct.entity';

@Entity()
export class Order {
  @PrimaryGeneratedColumn()
  id!: number;

  @OneToMany(() => OrderToProduct, (orderToProduct) => orderToProduct.order)
  orderToProducts!: OrderToProduct[];
}
