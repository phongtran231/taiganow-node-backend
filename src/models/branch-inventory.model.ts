import { BelongsTo, Column, Model, Table } from 'sequelize-typescript';
import { Branch } from './branch.model';

@Table({ tableName: 'branch_inventories', modelName: 'branch_inventories' })
export class BranchInventory extends Model {
  declare id: number;

  @Column
  branch_id: number;

  @Column
  product_id: number;

  @Column
  erp_product_id: number;

  @Column
  on_hand: number;

  @Column
  is_stocked: boolean;

  @Column
  is_available: boolean;

  @BelongsTo(() => Branch, { foreignKey: 'branch_id' })
  branch: Branch;
}
