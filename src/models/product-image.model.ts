import { Column, DeletedAt, Model, Table } from 'sequelize-typescript';

@Table({ tableName: 'product_images' })
export class ProductImage extends Model {
  declare id: number;

  @Column
  product_id: number;

  @Column
  path: string;

  @Column
  is_main: boolean;

  @DeletedAt
  deleted_at: Date;
}
