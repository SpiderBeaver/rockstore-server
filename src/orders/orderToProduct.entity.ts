import { Product } from 'src/products/product.entity';
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Order } from './order.entity';

@Entity()
export class OrderToProduct {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  orderId!: number;

  @ManyToOne(() => Order, (order) => order.orderToProducts)
  order!: Order;

  @Column()
  productId!: number;

  @ManyToOne(() => Product, (product) => product.orderToProducts)
  product!: Product;
}
