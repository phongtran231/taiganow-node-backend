import { Column, DeletedAt, HasMany, Model, Table } from 'sequelize-typescript';
import { BranchInventory } from './branch-inventory.model';
import { MultipleBranchInventory } from './multiple-branch-inventory.model';
import { BranchTranslation } from './branch-translation.model';

@Table({ modelName: 'branches' })
export class Branch extends Model {
  declare id: number;

  @Column
  erp_Name: string;

  @Column
  erp_BranchCode: string;

  @Column
  erp_HomeBranchID: number;

  @Column
  address: string;

  @Column
  phone_numbers: string;

  @Column
  description: string;

  @Column
  type: string;

  @Column
  email: string;

  @Column
  timezone: string;

  @DeletedAt
  deleted_at: Date;

  @HasMany(() => BranchInventory, {
    foreignKey: 'branch_id',
  })
  branchInventories: BranchInventory[];

  @HasMany(() => MultipleBranchInventory, {
    foreignKey: 'branch_id',
  })
  multipleBranchInventories: MultipleBranchInventory[];

  @HasMany(() => BranchTranslation, {
    foreignKey: 'branch_id',
  })
  translations: BranchTranslation[];
}
