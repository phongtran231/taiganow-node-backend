import { Injectable } from '@nestjs/common';
import { SiteLocale } from './models/site-locale.model';
import { Category } from './models/category.model';
import { InjectModel } from '@nestjs/sequelize';
import { BranchSetting } from './models/branch-setting.model';
import { BranchSettingTranslation } from './models/branch-setting-translation.model';
import { compact, first, get, size } from 'lodash';
import { Op } from 'sequelize';
import { Product } from './models/product.model';
import { MultipleBranchInventory } from './models/multiple-branch-inventory.model';
import { MultipleBranchInventoryCategory } from './models/multiple-branch-inventory-category.model';
import { BranchInventory } from './models/branch-inventory.model';
import { Branch } from './models/branch.model';
import { BranchTranslation } from './models/branch-translation.model';

@Injectable()
export class AppService {
  constructor(
    @InjectModel(Category)
    private readonly categoryModel: typeof Category,
    @InjectModel(SiteLocale)
    private readonly siteLocaleModel: typeof SiteLocale,
    @InjectModel(MultipleBranchInventoryCategory)
    private readonly multipleBranchInventoryCategory: typeof MultipleBranchInventoryCategory,
    @InjectModel(BranchInventory)
    private readonly branchInventory: typeof BranchInventory,
  ) {}

  async getBranchSetting(
    siteLocale: SiteLocale,
    category: Category,
    branchId: number,
  ) {
    const [siteLocales, rootCategory] = await Promise.all([
      this.siteLocaleModel.findAll({
        where: {
          code: {
            [Op.in]: ['en_CA', 'fr_CA'],
          },
        },
      }),
      this.categoryModel.findOne({
        where: {
          code: 'menu_category',
        },
        include: [
          {
            model: BranchSetting,
            as: 'branchSettings',
            where: {
              branch_id: branchId,
              is_enabled: true,
            },
            include: [
              {
                model: BranchSettingTranslation,
                as: 'translations',
              },
            ],
          },
        ],
      }),
    ]);
    const result = {};
    const setting = first(category.branchSettings);
    if (setting) {
      const parentSetting = first(category.parent.branchSettings);
      const rootSetting = first(rootCategory.branchSettings);
      if (!setting.is_inherit_protected_inventory) {
        result['protected_inventory'] = setting.protected_inventory;
      } else if (!parentSetting.is_inherit_protected_inventory) {
        result['protected_inventory'] = parentSetting.protected_inventory;
      } else {
        result['protected_inventory'] = rootSetting.protected_inventory;
      }
      if (!setting.is_inherit_maximum_visible) {
        result['maximum_visible'] = setting.maximum_visible;
      } else if (!parentSetting.is_inherit_maximum_visible) {
        result['maximum_visible'] = parentSetting.maximum_visible;
      } else {
        result['maximum_visible'] = rootSetting.maximum_visible;
      }
      if (!setting.is_inherit_show_value) {
        result['show_value'] = setting.show_value;
      } else if (!parentSetting.is_inherit_show_value) {
        result['show_value'] = parentSetting.show_value;
      } else {
        result['show_value'] = rootSetting.show_value;
      }
      if (!setting.is_inherit_special_order_string) {
        let translation = setting.translations.find(
          (t) => t.site_locale_id === siteLocale.id,
        );
        if (!translation) {
          translation = first(setting.translations);
        }
        result['special_order_string'] = translation.special_order_string || '';
        result['special_order_string_en'] =
          setting.translations.find(
            (t) =>
              t.site_locale_id ===
              siteLocales.find((l) => l.code === 'en_CA').id,
          ).special_order_string || '';
        result['special_order_string_fr'] =
          setting.translations.find(
            (t) =>
              t.site_locale_id ===
              siteLocales.find((l) => l.code === 'fr_CA').id,
          ).special_order_string || '';
      } else if (!parentSetting.is_inherit_special_order_string) {
        let translation = parentSetting.translations.find(
          (t) => t.site_locale_id === siteLocale.id,
        );
        if (!translation) {
          translation = first(parentSetting.translations);
        }
        result['special_order_string'] = translation.special_order_string || '';
        result['special_order_string_en'] =
          parentSetting.translations.find(
            (t) =>
              t.site_locale_id ===
              siteLocales.find((l) => l.code === 'en_CA').id,
          ).special_order_string || '';
        result['special_order_string_fr'] =
          parentSetting.translations.find(
            (t) =>
              t.site_locale_id ===
              siteLocales.find((l) => l.code === 'fr_CA').id,
          ).special_order_string || '';
      } else {
        let translation = rootSetting.translations.find(
          (t) => t.site_locale_id === siteLocale.id,
        );
        if (!translation) {
          translation = first(rootSetting.translations);
        }
        result['special_order_string'] = translation.special_order_string || '';
        result['special_order_string_en'] =
          rootSetting.translations.find(
            (t) =>
              t.site_locale_id ===
              siteLocales.find((l) => l.code === 'en_CA').id,
          ).special_order_string || '';
        result['special_order_string_fr'] =
          rootSetting.translations.find(
            (t) =>
              t.site_locale_id ===
              siteLocales.find((l) => l.code === 'fr_CA').id,
          ).special_order_string || '';
      }
    }
    return result;
  }

  async filterProductsPermission(products: Array<any>, addressId: number) {
    let buildProducts = JSON.parse(JSON.stringify(products));

    buildProducts = products.map((product) => {
      const productPermission = product.permission;
      if (!productPermission) {
        return product;
      } else {
        const productPermissionExceptions = productPermission.exceptions;
        if (size(productPermissionExceptions) > 0) {
          const exception: any = first(productPermissionExceptions);
          if (
            productPermission.global_allow &&
            exception.address_id === addressId
          ) {
            return null;
          } else if (
            !productPermission.global_allow &&
            exception.address_id === addressId
          ) {
            return product;
          }
        }
      }
      return null;
    });
    return compact(buildProducts);
  }

  async getNearbyHubsAndBranches(
    product: Product,
    category: Category,
    siteLocale: SiteLocale,
  ) {
    const branch = first(product.branches);
    const multipleBranchInventories = branch.multipleBranchInventories;
    const [nearbyHubs, nearbyBranches] = await Promise.all([
      this.getNearByProductHubs(
        product,
        multipleBranchInventories,
        category,
        siteLocale,
      ),
      this.getNearbyBranch(product, multipleBranchInventories, category),
    ]);
    return {
      nearbyHubs: size(nearbyHubs) > 0 ? nearbyHubs : [],
      nearbyBranches,
    };
  }

  async getNearByProductHubs(
    product: Product,
    multipleBranchInventories: Array<MultipleBranchInventory>,
    category: Category,
    siteLocale: SiteLocale,
  ) {
    let subBranchInventories = multipleBranchInventories.filter(
      (subBranchInventory) => subBranchInventory.type === 2,
    );
    let branchInventoryCategories =
      await this.multipleBranchInventoryCategory.findAll({
        where: {
          multiple_branch_inventory_id: {
            [Op.in]: compact(subBranchInventories.map((branch) => branch.id)),
          },
          category_id: category.id,
        },
        attributes: ['multiple_branch_inventory_id', 'category_id'],
      });
    if (size(branchInventoryCategories) === 0) {
      return [];
    }
    if (size(branchInventoryCategories) > 0) {
      subBranchInventories = subBranchInventories
        .map((subBranchInventory) => {
          if (
            branchInventoryCategories
              .map(
                (branchInventoryCategory) =>
                  branchInventoryCategory.multiple_branch_inventory_id,
              )
              .includes(subBranchInventory.id)
          ) {
            branchInventoryCategories = branchInventoryCategories.filter(
              (branchInventoryCategory) => {
                return (
                  branchInventoryCategory.multiple_branch_inventory_id ===
                  subBranchInventory.id
                );
              },
            );
            if (
              branchInventoryCategories
                .map(
                  (branchInventoryCategory) =>
                    branchInventoryCategory.category_id,
                )
                .includes(category.id)
            ) {
              return subBranchInventory;
            }
          }
          return null;
        })
        .filter((subBranchInventory) => subBranchInventory);
    }
    const nearByProductHubs = subBranchInventories.map(
      (subBranchInventory) => subBranchInventory.sub_branch_id,
    );

    if (size(nearByProductHubs) === 0) {
      return [];
    }
    const nearByProductHubsBranches = await this.branchInventory.findAll({
      where: {
        branch_id: {
          [Op.in]: nearByProductHubs,
        },
        product_id: product.id,
        on_hand: {
          [Op.gt]: 0,
        },
      },
      attributes: ['id', 'branch_id', 'on_hand'],
      include: [
        {
          model: Branch,
          as: 'branch',
          attributes: ['id', 'erp_Name'],
          include: [
            {
              model: BranchTranslation,
              as: 'translations',
              where: {
                site_locale_id: siteLocale.id,
              },
              attributes: ['name'],
              required: false,
            },
          ],
        },
      ],
    });
    if (size(nearByProductHubsBranches) === 0) {
      return [];
    }
    const response = [];
    nearByProductHubsBranches.forEach((nearByProductHubsBranch) => {
      const branchTranslation =
        nearByProductHubsBranch.branch.translations.find(
          (translation) => translation.site_locale_id === siteLocale.id,
        );
      const branchName = branchTranslation
        ? branchTranslation.name
        : nearByProductHubsBranch.branch.erp_Name;
      const subBranchInventory = subBranchInventories.find(
        (subBranchInventory) =>
          subBranchInventory.sub_branch_id ===
          nearByProductHubsBranch.branch_id,
      );
      response.push({
        branch_name: branchName,
        branch_id: nearByProductHubsBranch.branch_id,
        on_hand: Math.max(nearByProductHubsBranch.on_hand, 0),
        lead_time: Math.max(get(subBranchInventory, 'lead_time', 0), 0),
      });
    });
    return response;
  }

  async getNearbyBranch(
    product: Product,
    multipleBranchInventories: Array<MultipleBranchInventory>,
    category: Category,
  ) {
    let subBranchInventories = multipleBranchInventories.filter(
      (subBranchInventory) => subBranchInventory.type === 3,
    );
    let branchInventoryCategories =
      await this.multipleBranchInventoryCategory.findAll({
        where: {
          multiple_branch_inventory_id: {
            [Op.in]: compact(subBranchInventories.map((branch) => branch.id)),
          },
        },
        attributes: ['multiple_branch_inventory_id', 'category_id'],
      });
    if (size(branchInventoryCategories) === 0) {
      return {
        on_hand: 0,
      };
    }
    if (size(branchInventoryCategories) > 0) {
      subBranchInventories = subBranchInventories
        .map((subBranchInventory) => {
          if (
            branchInventoryCategories
              .map(
                (branchInventoryCategory) =>
                  branchInventoryCategory.multiple_branch_inventory_id,
              )
              .includes(subBranchInventory.id)
          ) {
            branchInventoryCategories = branchInventoryCategories.filter(
              (branchInventoryCategory) => {
                return (
                  branchInventoryCategory.multiple_branch_inventory_id ===
                  subBranchInventory.id
                );
              },
            );
            if (
              branchInventoryCategories
                .map(
                  (branchInventoryCategory) =>
                    branchInventoryCategory.category_id,
                )
                .includes(category.id)
            ) {
              return subBranchInventory;
            }
          }
          return null;
        })
        .filter((subBranchInventory) => subBranchInventory);
    }
    const nearbyProductBranchIds = subBranchInventories.map(
      (subBranchInventory) => subBranchInventory.sub_branch_id,
    );
    if (size(nearbyProductBranchIds) === 0) {
      return {
        on_hand: 0,
      };
    }
    const nearbyProductBranch = await this.branchInventory.findAll({
      where: {
        branch_id: {
          [Op.in]: nearbyProductBranchIds,
        },
        product_id: product.id,
        on_hand: {
          [Op.gt]: 0,
        },
      },
      attributes: ['on_hand'],
    });
    if (size(nearbyProductBranch) === 0) {
      return {
        on_hand: 0,
      };
    }
    return {
      on_hand: nearbyProductBranch.reduce(
        (acc, branchInventory) => acc + Math.max(branchInventory.on_hand, 0),
        0,
      ),
    };
  }

  async getBranchInventoryStatus(
    product: Product,
    branchSetting,
    mainInventory: BranchInventory,
    subBranchInventories: Array<MultipleBranchInventory>,
    siteLocale: SiteLocale,
  ) {
    const showValue = branchSetting.show_value;
    const protectedInventory = branchSetting.protected_inventory;
    const specialOrderString = branchSetting.special_order_string;
    const maximumVisible = branchSetting.maximum_visible;
    const mainBranches = subBranchInventories.filter(
      (subBranchInventory) => subBranchInventory.type === 1,
    );

    const mergedBranches = await this.branchInventory.findAll({
      where: {
        branch_id: {
          [Op.in]: mainBranches.map((mainBranch) => mainBranch.sub_branch_id),
        },
        product_id: product.id,
      },
      attributes: ['branch_id', 'on_hand', 'is_stocked'],
    });
    const onHandMergeBranch = mergedBranches.reduce(
      (acc, branchInventory) => acc + Math.max(branchInventory.on_hand, 0),
      0,
    );
    let isStocked = false;
    if (mergedBranches.length > 0) {
      mergedBranches.map((branchInventory) => {
        if (branchInventory.is_stocked) {
          isStocked = true;
        }
      });
    }
    isStocked = isStocked || mainInventory.is_stocked;
    const onHand = Math.max(mainInventory.on_hand, 0) + onHandMergeBranch;

    if (isStocked && onHand > 0) {
      return {
        origin: siteLocale.code === 'en_CA' ? 'In Stock' : 'En stock',
        unit: onHand - protectedInventory,
        status:
          siteLocale.code === 'en_CA'
            ? `In Stock ${onHand}`
            : `En Stock Seulement via ${onHand}`,
        status_en: `In Stock ${onHand}`,
        status_fr: `En Stock Seulement via ${onHand}`,
        waiting_on_stock: false,
        in_stock: true,
        special_order_string: false,
        origin_en: 'In Stock',
        origin_fr: 'En stock',
      };
    }
    if (product.id === 13182) {
      console.log(
        '====',
        showValue,
        onHand,
        protectedInventory,
        maximumVisible,
      );
    }
    if (!isStocked) {
      return {
        origin: specialOrderString,
        origin_en: branchSetting['special_order_string_en'],
        origin_fr: branchSetting['special_order_string_fr'],
        unit: null,
        status: specialOrderString,
        waiting_on_stock: false,
        in_stock: false,
        special_order_string: true,
      };
    }
    if (!showValue) {
      if (onHand <= protectedInventory) {
        return {
          origin:
            siteLocale.code === 'en_CA'
              ? 'Waiting On Stock'
              : 'En attente de stock',
          unit: null,
          status:
            siteLocale.code === 'en_CA'
              ? 'Waiting On Stock'
              : 'En attente de stock',
          status_en: 'Waiting On Stock',
          status_fr: 'En attente de stock',
          waiting_on_stock: true,
          in_stock: false,
          special_order_string: false,
          origin_en: 'Waiting On Stock',
          origin_fr: 'En attente de stock',
        };
      } else {
        return {
          origin: siteLocale.code === 'en_CA' ? 'In Stock' : 'En stock',
          unit: null,
          status:
            siteLocale.code === 'en_CA' ? `In Stock` : `En Stock Seulement via`,
          status_en: `In Stock`,
          status_fr: `En Stock Seulement via`,
          waiting_on_stock: false,
          in_stock: true,
          special_order_string: false,
          origin_en: 'In Stock',
          origin_fr: 'En stock',
        };
      }
    } else {
      if (onHand <= protectedInventory) {
        return {
          origin:
            siteLocale.code === 'en_CA'
              ? 'Waiting On Stock'
              : 'En attente de stock',
          unit: null,
          status:
            siteLocale.code === 'en_CA'
              ? 'Waiting On Stock'
              : 'En attente de stock',
          status_en: 'Waiting On Stock',
          status_fr: 'En attente de stock',
          waiting_on_stock: true,
          in_stock: false,
          special_order_string: false,
          origin_en: 'Waiting On Stock',
          origin_fr: 'En attente de stock',
        };
      } else if (onHand - protectedInventory <= maximumVisible) {
        return {
          origin: siteLocale.code === 'en_CA' ? 'In Stock' : 'En stock',
          unit: onHand - protectedInventory,
          status:
            siteLocale.code === 'en_CA'
              ? `In Stock ${onHand - protectedInventory}`
              : `En Stock Seulement via ${onHand - protectedInventory}`,
          status_en: `In Stock ${onHand - protectedInventory}`,
          status_fr: `En Stock Seulement via ${onHand - protectedInventory}`,
          waiting_on_stock: false,
          in_stock: true,
          special_order_string: false,
          origin_en: 'In Stock',
          origin_fr: 'En stock',
        };
      } else if (onHand > maximumVisible) {
        return {
          origin: siteLocale.code === 'en_CA' ? 'In Stock' : 'En stock',
          unit: onHand - protectedInventory,
          status:
            siteLocale.code === 'en_CA'
              ? `In Stock ${maximumVisible}+`
              : `En Stock Seulement via ${maximumVisible}+`,
          status_en: `In Stock ${maximumVisible}+`,
          status_fr: `En Stock Seulement via ${maximumVisible}+`,
          waiting_on_stock: false,
          in_stock: true,
          special_order_string: false,
          origin_en: 'In Stock',
          origin_fr: 'En stock',
        };
      }
    }

    return {
      origin: '',
      unit: null,
      status: '',
      status_en: '',
      status_fr: '',
      waiting_on_stock: false,
      in_stock: false,
      special_order_string: false,
      origin_en: '',
      origin_fr: '',
    };
  }
}
