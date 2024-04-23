import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SequelizeModule } from '@nestjs/sequelize';
import { Category } from './models/category.model';
import { Address } from './models/address.model';
import { BranchSetting } from './models/branch-setting.model';
import { SiteLocale } from './models/site-locale.model';
import { CategoryTranslation } from './models/category-translation.model';
import { BranchSettingTranslation } from './models/branch-setting-translation.model';
import { Product } from './models/product.model';
import { ProductPermission } from './models/product-permission.model';
import { ProductPermissionExceptions } from './models/product-permission-exceptions.model';
import { ProductCategory } from './models/product-category.model';
import { ProductTranslation } from './models/product-translation.model';
import { BranchInventory } from './models/branch-inventory.model';
import { Branch } from './models/branch.model';
import { MultipleBranchInventory } from './models/multiple-branch-inventory.model';
import { ProductCollectionAttribute } from './models/product-collection-attribute.model';
import { Uom } from './models/uom.model';
import { Pricing } from './models/pricing.model';
import { BranchTranslation } from './models/branch-translation.model';
import { MultipleBranchInventoryCategory } from './models/multiple-branch-inventory-category.model';
import { ProductImage } from './models/product-image.model';
import { UomTranslation } from './models/uom-translation.model';
import { ProductAttribute } from './models/product-attribute.model';
import { ConfigModule, ConfigService } from '@nestjs/config';

const models = [
  Category,
  Address,
  BranchSetting,
  SiteLocale,
  CategoryTranslation,
  BranchSettingTranslation,
  Product,
  ProductPermission,
  ProductPermissionExceptions,
  ProductCategory,
  ProductTranslation,
  BranchInventory,
  Branch,
  MultipleBranchInventory,
  ProductCollectionAttribute,
  Uom,
  Pricing,
  BranchTranslation,
  MultipleBranchInventoryCategory,
  ProductImage,
  UomTranslation,
  ProductAttribute,
];

@Module({
  imports: [
    SequelizeModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        dialect: 'mysql',
        host: configService.get('DB_HOST'),
        port: configService.get('DB_PORT'),
        username: configService.get('DB_USERNAME'),
        password: configService.get('DB_PASSWORD'),
        database: configService.get('DB_DATABASE'),
        autoLoadModels: true,
        synchronize: false,
        models,
        define: {
          createdAt: 'created_at',
          updatedAt: 'updated_at',
        },
      }),
    }),
    SequelizeModule.forFeature(models),
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
