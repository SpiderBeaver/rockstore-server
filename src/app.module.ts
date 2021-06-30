import { Module } from '@nestjs/common';
import { ServeStaticModule } from '@nestjs/serve-static';
import { TypeOrmModule } from '@nestjs/typeorm';
import { join } from 'path';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { Order } from './orders/order.entity';
import { OrderToProduct } from './orders/orderToProduct.entity';
import { Product } from './products/product.entity';
import { ProductsController } from './products/products.controller';
import { OrdersController } from './orders/orders.controller';

@Module({
  // TODO: Move typeorm confing into .env file.
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'postgres',
      password: 'password',
      database: 'rockstore',
      entities: [Product, Order, OrderToProduct],
      synchronize: true,
      logging: true,
    }),
    TypeOrmModule.forFeature([Product, Order, OrderToProduct]),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'uploads'),
      serveRoot: '/uploads',
    }),
  ],
  controllers: [AppController, ProductsController, OrdersController],
  providers: [AppService],
})
export class AppModule {}
