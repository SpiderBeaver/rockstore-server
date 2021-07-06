import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { Order, OrderProduct, Product } from '@prisma/client';
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

function orderToDto(
  order: Order & {
    orderProducts: (OrderProduct & {
      product: Product;
    })[];
  },
): OrderDto {
  const dto = {
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
  return dto;
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
  ): Promise<OrderDto[]> {
    const limit = limitString !== undefined ? parseInt(limitString) : undefined;
    const offset =
      offsetString !== undefined ? parseInt(offsetString) : undefined;

    const orders = await this.prismaService.client.order.findMany({
      orderBy: { id: 'desc' },
      skip: offset,
      take: limit,
      include: { orderProducts: { include: { product: true } } },
    });

    const ordersDto = orders.map((order) => orderToDto(order));
    return ordersDto;
  }

  @Get('/count')
  async count(): Promise<{ count: number }> {
    const count = await this.prismaService.client.order.count();
    return { count: count };
  }

  @Post()
  async create(@Body() dto: CreateOrderDto): Promise<OrderDto> {
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

    const newOrderDto = orderToDto(order);
    return newOrderDto;
  }

  @Post(':id/delete')
  async deleteOrder(@Param('id') idString: string): Promise<OrderDto> {
    const id = parseInt(idString);
    const order = await this.prismaService.client.order.update({
      where: { id: id },
      data: { deletedAt: new Date() },
      include: {
        orderProducts: { include: { product: true } },
      },
    });
    const orderDto = orderToDto(order);
    return orderDto;
  }
}
