import {
  Body,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Param,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { InjectRepository } from '@nestjs/typeorm';
import crypto from 'crypto';
import { diskStorage } from 'multer';
import path from 'path';
import { Repository } from 'typeorm';
import { Product } from './product.entity';

class CreateProductDto {
  product!: {
    name: string;
  };
}

@Controller('products')
export class ProductsController {
  constructor(
    @InjectRepository(Product)
    private productsRepository: Repository<Product>,
  ) {}

  @Get()
  async findAll() {
    const products = await this.productsRepository.find();
    return products;
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
}
