import {
  Column,
  CreatedAt,
  DeletedAt,
  Model,
  Table,
  UpdatedAt,
} from 'sequelize-typescript';

@Table({ modelName: 'site_locales' })
export class SiteLocale extends Model {
  declare id: number;

  @Column
  code: string;

  @Column
  is_default: boolean;

  @CreatedAt
  created_at: Date;

  @UpdatedAt
  updated_at: Date;

  @DeletedAt
  deleted_at: Date;
}

export const DEFAULT_LOCALE_CODE = 'en_CA';
