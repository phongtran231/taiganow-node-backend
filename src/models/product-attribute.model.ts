import { Column, DeletedAt, Model, Table } from 'sequelize-typescript';

@Table({ tableName: 'product_attributes' })
export class ProductAttribute extends Model {
  declare id: number;

  @Column
  product_id: number;

  @Column
  code: string;

  @Column
  position: string;

  @Column
  is_filterable: boolean;

  @Column
  is_hide_from_spec: boolean;

  @Column
  type: string;

  @DeletedAt
  deleted_at: Date;
}
