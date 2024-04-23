import {
  Column,
  CreatedAt,
  Model,
  Table,
  UpdatedAt,
} from 'sequelize-typescript';

@Table({ modelName: 'branch_setting_translations' })
export class BranchSettingTranslation extends Model {
  declare id: number;

  @Column
  branch_setting_id: number;

  @Column
  site_locale_id: number;

  @Column
  special_order_string: string;

  @CreatedAt
  created_at: Date;

  @UpdatedAt
  updated_at: Date;
}
