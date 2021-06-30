import { Controller, Get, Query } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindManyOptions, Repository } from 'typeorm';
import { Order } from './order.entity';

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

@Controller('orders')
export class OrdersController {
  constructor(
    @InjectRepository(Order)
    private ordersRepository: Repository<Order>,
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
}
