import { Column, Table, Model } from 'sequelize-typescript';

@Table({ tableName: 'multiple_branch_inventory_categories' })
export class MultipleBranchInventoryCategory extends Model {
  declare id: number;

  @Column
  multiple_branch_inventory_id: number;

  @Column
  category_id: number;
}
