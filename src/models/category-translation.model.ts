import {
  Column,
  CreatedAt,
  Model,
  Table,
  UpdatedAt,
} from 'sequelize-typescript';

@Table({ modelName: 'category_translations' })
export class CategoryTranslation extends Model {
  declare id: number;

  @Column
  category_id: number;

  @Column
  site_locale_id: number;

  @Column
  name: string;

  @Column
  description: string;

  @CreatedAt
  created_at: Date;

  @UpdatedAt
  updated_at: Date;
}
