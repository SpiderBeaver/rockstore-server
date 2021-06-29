import { Controller, Get } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
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
  async list() {
    const orders = await this.ordersRepository.find({
      relations: ['orderToProducts', 'orderToProducts.product'],
    });
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
