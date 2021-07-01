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
import { InjectRepository } from '@nestjs/typeorm';
import crypto from 'crypto';
import { diskStorage } from 'multer';
import path from 'path';
import { FindManyOptions, ILike, Repository } from 'typeorm';
import { Product } from './product.entity';

class CreateProductDto {
  product!: {
    name: string;
    price: number;
  };
}

class EditProductDto {
  product!: {
    name?: string;
    price?: number;
  };
}

@Controller('products')
export class ProductsController {
  constructor(
    @InjectRepository(Product)
    private productsRepository: Repository<Product>,
  ) {}

  @Get()
  async list(
    @Query('limit') limitString: string | undefined,
    @Query('offset') offsetString: string | undefined,
    @Query('query') queryString: string | undefined,
  ) {
    const options: FindManyOptions<Product> = {};

    options.where = {};
    if (queryString != undefined) {
      options.where.name = ILike(`%${queryString}%`);
    }

    options.order = { id: 'DESC' };

    const limit = limitString !== undefined ? parseInt(limitString) : null;
    if (limit !== null) {
      options.take = limit;
    }

    const offset = offsetString !== undefined ? parseInt(offsetString) : null;
    if (offset !== null) {
      options.skip = offset;
    }

    const products = await this.productsRepository.find(options);
    return products;
  }

  @Get('/count')
  async count() {
    const count = await this.productsRepository.count();
    return { count: count };
  }

  @Get(':id')
  async findById(@Param('id') idString: string) {
    const id = parseInt(idString);
    const product = await this.productsRepository.findOne(id);
    if (!product) {
      throw new HttpException('Product not found', HttpStatus.NOT_FOUND);
    }

    return product;
  }

  @Post()
  async create(@Body() dto: CreateProductDto) {
    const product = this.productsRepository.create(dto.product);
    await this.productsRepository.save(product);
    return product;
  }

  @Post(':id/edit')
  async editProduct(
    @Param('id') idString: string,
    @Body() dto: EditProductDto,
  ) {
    const id = parseInt(idString);
    const product = await this.productsRepository.findOne(id);
    if (!product) {
      throw new HttpException('Product not found', HttpStatus.NOT_FOUND);
    }

    if (dto.product.name !== undefined) {
      product.name = dto.product.name;
    }
    if (dto.product.price !== undefined) {
      product.price = dto.product.price;
    }
    await this.productsRepository.save(product);
    return product;
  }

  @Post(':id/delete')
  async deleteProduct(@Param('id') idString: string) {
    const id = parseInt(idString);
    const result = await this.productsRepository.softDelete(id);
    if (result.affected === 0) {
      throw new HttpException('Product not found', HttpStatus.NOT_FOUND);
    } else {
      return { status: 'ok' };
    }
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
  ) {
    const id = parseInt(idString);
    const product = await this.productsRepository.findOne(id);
    if (!product) {
      throw new HttpException('Product not found', HttpStatus.NOT_FOUND);
    }
    product.pictureFilename = file.filename;
    await this.productsRepository.save(product);
    return product;
  }

  @Post(':id/picture/delete')
  async deletePicture(@Param('id') idString: string) {
    const id = parseInt(idString);
    const product = await this.productsRepository.findOne(id);
    if (!product) {
      throw new HttpException('Product not found', HttpStatus.NOT_FOUND);
    }
    product.pictureFilename = null;
    const productUpdated = await this.productsRepository.save(product);
    return productUpdated;
  }
}
