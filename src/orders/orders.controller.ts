import {
  Body,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import {
  Client,
  Order,
  OrderProduct,
  OrderStatus,
  Product,
} from '@prisma/client';
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
  client: {
    name: string;
    email: string;
    phoneNumber: string;
    address: string;
  };
  status: string;
  createdAt: Date;
}

function orderToDto(
  order: Order & {
    orderProducts: (OrderProduct & {
      product: Product;
    })[];
    client: Client;
  },
): OrderDto {
  const dto: OrderDto = {
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
    client: {
      name: order.client.name,
      email: order.client.email,
      phoneNumber: order.client.phoneNumber,
      address: order.client.address,
    },
    status: order.status,
    createdAt: order.createdAt,
  };
  return dto;
}

class CreateOrderDto {
  products!: {
    id: number;
    count: number;
  }[];
  client!: {
    name: string;
    email: string;
    phoneNumber: string;
    address: string;
  };
}

class EditOrderDto {
  products?: {
    id: number;
    count: number;
  }[];
  client?: {
    name: string;
    email: string;
    phoneNumber: string;
    address: string;
  };
  status?: OrderStatus;
}

@Controller('orders')
export class OrdersController {
  constructor(private readonly prismaService: PrismaService) {}

  @Get()
  async list(
    @Query('limit') limitString?: string,
    @Query('offset') offsetString?: string,
    @Query('status') status?: OrderStatus,
  ): Promise<OrderDto[]> {
    const limit = limitString !== undefined ? parseInt(limitString) : undefined;
    const offset =
      offsetString !== undefined ? parseInt(offsetString) : undefined;

    const orders = await this.prismaService.client.order.findMany({
      where: status !== undefined ? { status: status } : undefined,
      orderBy: { id: 'desc' },
      skip: offset,
      take: limit,
      include: { orderProducts: { include: { product: true } }, client: true },
    });

    const ordersDto = orders.map((order) => orderToDto(order));
    return ordersDto;
  }

  @Get('/count')
  async count(): Promise<{ count: number }> {
    const count = await this.prismaService.client.order.count();
    return { count: count };
  }

  @Get(':id')
  async findById(@Param('id') idString: string): Promise<OrderDto> {
    const id = parseInt(idString);
    const order = await this.prismaService.client.order.findFirst({
      where: { id: id },
      include: { orderProducts: { include: { product: true } }, client: true },
    });
    if (!order) {
      throw new HttpException('Order not found', HttpStatus.NOT_FOUND);
    }
    const orderDto = orderToDto(order);
    return orderDto;
  }

  @Post()
  async create(@Body() dto: CreateOrderDto): Promise<OrderDto> {
    const order = await this.prismaService.client.order.create({
      data: {
        orderProducts: {
          create: dto.products.map((product) => ({
            productId: product.id,
            count: product.count,
          })),
        },
        client: {
          create: {
            name: dto.client.name,
            email: dto.client.email,
            phoneNumber: dto.client.phoneNumber,
            address: dto.client.address,
          },
        },
      },
      include: {
        orderProducts: { include: { product: true } },
        client: true,
      },
    });

    const newOrderDto = orderToDto(order);
    return newOrderDto;
  }

  @Post(':id/edit')
  async editOrder(
    @Param('id') idString: string,
    @Body() dto: EditOrderDto,
  ): Promise<OrderDto> {
    const id = parseInt(idString);

    // Update client first
    if (dto.client) {
      await this.prismaService.client.order.update({
        where: { id: id },
        data: { client: { update: dto.client } },
      });
    }

    if (dto.products) {
      // Remove old order products
      await this.prismaService.client.orderProduct.deleteMany({
        where: { orderId: id },
      });

      // Insert updated order products
      await this.prismaService.client.orderProduct.createMany({
        data: dto.products.map((orderProduct) => ({
          orderId: id,
          productId: orderProduct.id,
          count: orderProduct.count,
        })),
      });
    }

    if (dto.status) {
      await this.prismaService.client.order.update({
        where: { id: id },
        data: { status: dto.status },
      });
    }

    const order = await this.prismaService.client.order.findFirst({
      where: { id: id },
      include: { orderProducts: { include: { product: true } }, client: true },
    });

    if (order) {
      const orderDto = orderToDto(order);
      return orderDto;
    } else {
      throw new HttpException('Order not found', HttpStatus.NOT_FOUND);
    }
  }

  @Post(':id/delete')
  async deleteOrder(@Param('id') idString: string): Promise<OrderDto> {
    const id = parseInt(idString);
    const order = await this.prismaService.client.order.update({
      where: { id: id },
      data: { deletedAt: new Date() },
      include: {
        orderProducts: { include: { product: true } },
        client: true,
      },
    });
    const orderDto = orderToDto(order);
    return orderDto;
  }
}
