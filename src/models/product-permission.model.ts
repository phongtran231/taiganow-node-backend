import { Column, DeletedAt, HasMany, Model, Table } from 'sequelize-typescript';
import { ProductPermissionExceptions } from './product-permission-exceptions.model';

@Table({ modelName: 'product_permissions' })
export class ProductPermission extends Model {
  declare id: number;

  @Column
  product_id: number;

  @Column
  global_allow: boolean;

  @DeletedAt
  deleted_at: Date;

  @HasMany(() => ProductPermissionExceptions, {
    foreignKey: 'product_permission_id',
  })
  exceptions: ProductPermissionExceptions[];
}
