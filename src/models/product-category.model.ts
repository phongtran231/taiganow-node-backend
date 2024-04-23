import { Column, Model, Table } from 'sequelize-typescript';

@Table({ modelName: 'product_categories' })
export class ProductCategory extends Model {
  declare id: number;

  @Column
  product_id: number;

  @Column
  category_id: number;
}
