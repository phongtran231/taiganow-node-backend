import {
  BelongsTo,
  BelongsToMany,
  Column,
  CreatedAt,
  DeletedAt,
  HasMany,
  HasOne,
  Model,
  Table,
  UpdatedAt,
} from 'sequelize-typescript';
import { ProductPermission } from './product-permission.model';
import { ProductTranslation } from './product-translation.model';
import { Branch } from './branch.model';
import { BranchInventory } from './branch-inventory.model';
import { ProductCollectionAttribute } from './product-collection-attribute.model';
import { ProductImage } from './product-image.model';

@Table({ modelName: 'products' })
export class Product extends Model {
  declare id: number;

  @Column
  category_id: number;

  @Column
  erp_sku: string;

  @Column
  erp_product_id: number;

  @Column
  product_collection_id: number;

  @Column
  type: number;

  @Column
  missing_defining_attributes: boolean;

  @Column
  enabled: boolean;

  @Column
  uom_1_id: number;

  @Column
  uom_2_id: number;

  @Column
  uom_1_to_uom_2_conversion: number;

  @Column
  pricing_method: string;

  @Column
  is_override_attribute_position: boolean;

  @CreatedAt
  created_at: Date;

  @UpdatedAt
  updated_at: Date;

  @DeletedAt
  deleted_at: Date;

  @BelongsTo(() => Product, { foreignKey: 'product_collection_id' })
  collection: Product;

  @HasOne(() => ProductPermission, { foreignKey: 'product_id' })
  permission: ProductPermission;

  @HasMany(() => ProductTranslation, { foreignKey: 'product_id' })
  translations: ProductTranslation[];

  @BelongsToMany(() => Branch, {
    through: () => BranchInventory,
    foreignKey: 'product_id',
    otherKey: 'branch_id',
  })
  branches: Branch[];

  @HasMany(() => BranchInventory, { foreignKey: 'product_id' })
  branchInventories: BranchInventory[];

  @HasMany(() => ProductCollectionAttribute, { foreignKey: 'product_id' })
  productCollectionAttributes: ProductCollectionAttribute[];

  @HasMany(() => ProductImage, { foreignKey: 'product_id' })
  images: ProductImage[];
}
