import {
  BelongsTo,
  Column,
  CreatedAt,
  DeletedAt,
  HasMany,
  HasOne,
  Model,
  Table,
  UpdatedAt,
} from 'sequelize-typescript';
import { BranchSetting } from './branch-setting.model';
import { CategoryTranslation } from './category-translation.model';

@Table({ modelName: 'categories' })
export class Category extends Model {
  declare id: number;

  @Column
  code: string;

  @Column
  price_filter: string;

  @Column
  min_value: number;

  @Column
  max_value: number;

  @Column
  step: number;

  @Column
  tree_root: number;

  @Column
  tree_level: number;

  @Column
  position: number;

  @Column
  parent_id: number;

  @Column
  is_enabled: boolean;

  @CreatedAt
  created_at: Date;

  @UpdatedAt
  updated_at: Date;

  @DeletedAt
  deleted_at: Date;

  @HasMany(() => Category, { foreignKey: 'parent_id' })
  children: Category[];

  @BelongsTo(() => Category, { foreignKey: 'parent_id' })
  parent: Category;

  @HasMany(() => BranchSetting, { foreignKey: 'category_id' })
  branchSettings: BranchSetting[];

  @HasMany(() => CategoryTranslation, { foreignKey: 'category_id' })
  translations: CategoryTranslation[];
}

export const DEFAULT_SITE_LOCALE = 'en_CA';
