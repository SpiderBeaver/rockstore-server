import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindManyOptions, Repository } from 'typeorm';
import { Order } from './order.entity';
import { OrderToProduct } from './orderToProduct.entity';

interface OrderDto {
  id: number;
  items: {
    product: {
      id: number;
      name: string;
      pictureFilename: string | null;
      price: number;
    };
  }[];
}

class CreateOrderDto {
  products!: {
    id: number;
  }[];
}

@Controller('orders')
export class OrdersController {
  constructor(
    @InjectRepository(Order)
    private ordersRepository: Repository<Order>,
    @InjectRepository(OrderToProduct)
    private orderToProductsRepository: Repository<OrderToProduct>,
  ) {}

  @Get()
  async list(
    @Query('limit') limitString: string | undefined,
    @Query('offset') offsetString: string | undefined,
  ) {
    const options: FindManyOptions<Order> = {};

    options.order = { id: 'DESC' };

    const limit = limitString !== undefined ? parseInt(limitString) : null;
    if (limit !== null) {
      options.take = limit;
    }

    const offset = offsetString !== undefined ? parseInt(offsetString) : null;
    if (offset !== null) {
      options.skip = offset;
    }

    options.relations = ['orderToProducts', 'orderToProducts.product'];

    const orders = await this.ordersRepository.find(options);
    const ordersDto = orders.map(
      (order): OrderDto => ({
        id: order.id,
        items: order.orderToProducts.map((otp) => ({
          product: {
            id: otp.product.id,
            name: otp.product.name,
            pictureFilename: otp.product.pictureFilename,
            price: otp.product.price,
          },
        })),
      }),
    );
    return ordersDto;
  }

  @Get('/count')
  async count() {
    const count = await this.ordersRepository.count();
    return { count: count };
  }

  @Post()
  async create(@Body() dto: CreateOrderDto) {
    const order = this.ordersRepository.create();
    await this.ordersRepository.save(order);

    for (const product of dto.products) {
      const orderProduct = this.orderToProductsRepository.create({
        orderId: order.id,
        productId: product.id,
      });
      await this.orderToProductsRepository.save(orderProduct);
    }

    const newOrder = await this.ordersRepository.findOne(order.id, {
      relations: ['orderToProducts', 'orderToProducts.product'],
    });
    if (newOrder !== undefined) {
      const newOrderDto: OrderDto = {
        id: newOrder.id,
        items: newOrder.orderToProducts.map((otp) => ({
          product: {
            id: otp.product.id,
            name: otp.product.name,
            pictureFilename: otp.product.pictureFilename,
            price: otp.product.price,
          },
        })),
      };
      return newOrderDto;
    } else {
      throw Error();
    }
  }
}
