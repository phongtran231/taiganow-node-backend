import {
  Column,
  CreatedAt,
  HasMany,
  Model,
  Table,
  UpdatedAt,
} from 'sequelize-typescript';
import { BranchSettingTranslation } from './branch-setting-translation.model';

@Table({ modelName: 'branch_settings' })
export class BranchSetting extends Model {
  declare id: number;

  @Column
  category_id: number;

  @Column
  branch_id: number;

  @Column
  show_value: boolean;

  @Column
  protected_inventory: number;

  @Column
  maximum_visible: number;

  @Column
  is_inherit_show_value: boolean;

  @Column
  is_inherit_protected_inventory: boolean;

  @Column
  is_inherit_maximum_visible: boolean;

  @Column
  is_inherit_special_order_string: boolean;

  @Column
  is_enabled: boolean;

  @CreatedAt
  created_at: Date;

  @UpdatedAt
  updated_at: Date;

  @HasMany(() => BranchSettingTranslation, { foreignKey: 'branch_setting_id' })
  translations: BranchSettingTranslation[];
}
