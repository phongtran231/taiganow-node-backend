import { Column, Model, Table } from 'sequelize-typescript';

@Table({ modelName: 'multiple_branch_inventories' })
export class MultipleBranchInventory extends Model {
  declare id: number;

  @Column
  branch_id: number;

  @Column
  type: number;

  @Column
  sub_branch_id: number;

  @Column
  lead_time: number;
}
