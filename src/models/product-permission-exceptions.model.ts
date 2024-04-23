import { Column, Model, Table } from 'sequelize-typescript';

@Table({ modelName: 'product_permission_exceptions' })
export class ProductPermissionExceptions extends Model {
  declare id: number;

  @Column
  product_permission_id: number;

  @Column
  address_id: number;
}
