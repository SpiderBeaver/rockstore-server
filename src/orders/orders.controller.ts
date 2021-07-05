import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';

interface OrderDto {
  id: number;
  items: {
    product: {
      id: number;
      name: string;
      pictureFilename: string | null;
      price: number;
    };
    count: number;
  }[];
  createdAt: Date;
}

class CreateOrderDto {
  products!: {
    id: number;
    count: number;
  }[];
}

@Controller('orders')
export class OrdersController {
  constructor(private readonly prismaService: PrismaService) {}

  @Get()
  async list(
    @Query('limit') limitString: string | undefined,
    @Query('offset') offsetString: string | undefined,
  ) {
    const limit = limitString !== undefined ? parseInt(limitString) : undefined;
    const offset =
      offsetString !== undefined ? parseInt(offsetString) : undefined;

    const orders = await this.prismaService.client.order.findMany({
      orderBy: { id: 'desc' },
      skip: offset,
      take: limit,
      include: { orderProducts: { include: { product: true } } },
    });

    const ordersDto = orders.map(
      (order): OrderDto => ({
        id: order.id,
        items: order.orderProducts.map((orderProduct) => ({
          product: {
            id: orderProduct.product.id,
            name: orderProduct.product.name,
            pictureFilename: orderProduct.product.pictureFilename,
            price: orderProduct.product.price.toNumber(),
          },
          count: orderProduct.count,
        })),
        createdAt: order.createdAt,
      }),
    );
    return ordersDto;
  }

  @Get('/count')
  async count() {
    const count = await this.prismaService.client.order.count();
    return { count: count };
  }

  @Post()
  async create(@Body() dto: CreateOrderDto) {
    const order = await this.prismaService.client.order.create({
      data: {
        orderProducts: {
          create: dto.products.map((product) => ({
            productId: product.id,
            count: 1,
          })),
        },
      },
      include: {
        orderProducts: { include: { product: true } },
      },
    });

    const newOrderDto: OrderDto = {
      id: order.id,
      items: order.orderProducts.map((orderProduct) => ({
        product: {
          id: orderProduct.product.id,
          name: orderProduct.product.name,
          pictureFilename: orderProduct.product.pictureFilename,
          price: orderProduct.product.price.toNumber(),
        },
        count: orderProduct.count,
      })),
      createdAt: order.createdAt,
    };
    return newOrderDto;
  }

  @Post(':id/delete')
  async deleteOrder(@Param('id') idString: string) {
    const id = parseInt(idString);
    const order = await this.prismaService.client.order.update({
      where: { id: id },
      data: { deletedAt: new Date() },
    });
    return order;
  }
}
