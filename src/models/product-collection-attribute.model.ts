import { Column, Model, Table } from 'sequelize-typescript';

@Table({ modelName: 'product_collection_attributes' })
export class ProductCollectionAttribute extends Model {
  declare id: number;

  @Column
  product_id: number;

  @Column
  product_attribute_id: number;

  @Column
  product_attribute_option_id: number;

  @Column
  type: string;

  @Column
  is_specify: boolean;

  @Column
  position: number;
}
