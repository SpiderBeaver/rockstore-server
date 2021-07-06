import {
  Body,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Param,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Product } from '@prisma/client';
import crypto from 'crypto';
import { diskStorage } from 'multer';
import path from 'path';
import { PrismaService } from 'src/prisma.service';

export interface ProductDto {
  id: number;
  name: string;
  sku: string;
  description: string | null;
  pictureFilename: string | null;
  price: number;
  inStock: number;
}

function productToDto(product: Product): ProductDto {
  return {
    id: product.id,
    name: product.name,
    sku: product.sku,
    description: product.description,
    pictureFilename: product.pictureFilename,
    price: product.price.toNumber(),
    inStock: product.inStock,
  };
}

type ProductSortField = 'sku' | 'name' | 'price' | 'inStock';
type SortOrder = 'asc' | 'desc';

class CreateProductDto {
  product!: {
    name: string;
    sku: string;
    description: string | null;
    price: number;
    inStock: number;
  };
}

class EditProductDto {
  product!: {
    name?: string;
    sku?: string;
    description?: string | null;
    price?: number;
    inStock?: number;
  };
}

@Controller('products')
export class ProductsController {
  constructor(private readonly prismaService: PrismaService) {}

  @Get()
  async list(
    @Query('limit') limitString: string | undefined,
    @Query('offset') offsetString: string | undefined,
    @Query('sortField') sortField: ProductSortField | undefined,
    @Query('sortOrder') sortOrder: SortOrder | undefined,
    @Query('query') queryString: string | undefined,
  ): Promise<ProductDto[]> {
    const orderByParams = (
      sortField: ProductSortField,
      sortOrder?: SortOrder,
    ) => {
      const order = sortOrder ?? 'asc';
      switch (sortField) {
        case 'sku':
          return { sku: order };
        case 'name':
          return { name: order };
        case 'price':
          return { price: order };
        case 'inStock':
          return { inStock: order };
      }
    };

    const limit = limitString !== undefined ? parseInt(limitString) : undefined;
    const offset =
      offsetString !== undefined ? parseInt(offsetString) : undefined;

    const products = await this.prismaService.client.product.findMany({
      where:
        queryString !== undefined
          ? {
              OR: [
                { name: { contains: queryString } },
                { sku: { contains: queryString } },
              ],
            }
          : undefined,
      orderBy:
        sortField !== undefined
          ? orderByParams(sortField, sortOrder)
          : undefined,
      skip: offset,
      take: limit,
    });

    const productDtos = products.map((product) => productToDto(product));
    return productDtos;
  }

  @Get('/count')
  async count(): Promise<{ count: number }> {
    const count = await this.prismaService.client.product.count();
    return { count: count };
  }

  @Get(':id')
  async findById(@Param('id') idString: string): Promise<ProductDto> {
    const id = parseInt(idString);
    const product = await this.prismaService.client.product.findFirst({
      where: { id: id },
    });
    if (!product) {
      throw new HttpException('Product not found', HttpStatus.NOT_FOUND);
    }

    const productDto = productToDto(product);
    return productDto;
  }

  @Post()
  async create(@Body() dto: CreateProductDto): Promise<ProductDto> {
    const product = await this.prismaService.client.product.create({
      data: { ...dto.product },
    });
    const productDto = productToDto(product);
    return productDto;
  }

  @Post(':id/edit')
  async editProduct(
    @Param('id') idString: string,
    @Body() dto: EditProductDto,
  ): Promise<ProductDto> {
    const id = parseInt(idString);

    const product = await this.prismaService.client.product.update({
      data: { ...dto.product },
      where: { id: id },
    });

    const productDto = productToDto(product);
    return productDto;
  }

  @Post(':id/delete')
  async deleteProduct(@Param('id') idString: string): Promise<ProductDto> {
    const id = parseInt(idString);
    const product = await this.prismaService.client.product.update({
      where: { id: id },
      data: { deletedAt: new Date() },
    });
    const productDto = productToDto(product);
    return productDto;
  }

  @Post(':id/picture')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, callback) => {
          const name = crypto.randomBytes(16).toString('hex');
          const ext = path.extname(file.originalname);
          const fullname = name + ext;
          callback(null, fullname);
        },
      }),
      fileFilter: (req, file, callback) => {
        const ext = path.extname(file.originalname);
        const allowedExts = ['.png', '.jpg', '.jpeg'];
        if (!allowedExts.includes(ext)) {
          return callback(new Error('Only images are allowed!'), false);
        }
        return callback(null, true);
      },
    }),
  )
  async uploadPicture(
    @Param('id') idString: string,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<ProductDto> {
    const id = parseInt(idString);
    const product = await this.prismaService.client.product.update({
      where: { id: id },
      data: { pictureFilename: file.filename },
    });
    const productDto = productToDto(product);
    return productDto;
  }

  @Post(':id/picture/delete')
  async deletePicture(@Param('id') idString: string): Promise<ProductDto> {
    const id = parseInt(idString);

    const product = await this.prismaService.client.product.update({
      where: { id: id },
      data: { pictureFilename: null },
    });
    const productDto = productToDto(product);
    return productDto;
  }
}
