import { Column, Model, Table } from 'sequelize-typescript';

@Table({ tableName: 'pricing' })
export class Pricing extends Model {
  declare id: number;

  @Column
  address_id: number;

  @Column
  product_id: number;

  @Column
  quantity: number;

  @Column
  delivery_price: number;

  @Column
  pickup_price: number;
}
