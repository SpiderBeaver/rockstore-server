import {
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Param,
} from '@nestjs/common';
import { Product } from './product.interface';

@Controller('products')
export class ProductsController {
  private products: Product[] = [
    { id: 0, name: 'Product 1' },
    { id: 1, name: 'Product 2' },
  ];

  @Get()
  findAll() {
    return this.products;
  }

  @Get(':id')
  findById(@Param('id') idString: string) {
    const id = parseInt(idString);
    const product = this.products.find((p) => p.id === id);
    if (!product) {
      throw new HttpException('Product not found', HttpStatus.NOT_FOUND);
    }
    return product;
  }
}
