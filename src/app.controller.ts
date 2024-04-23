import { BadRequestException, Controller, Get, Request } from '@nestjs/common';
import { Category } from './models/category.model';
import { InjectModel } from '@nestjs/sequelize';
import { BranchSetting } from './models/branch-setting.model';
import { Address } from './models/address.model';
import { DEFAULT_LOCALE_CODE, SiteLocale } from './models/site-locale.model';
import { AppService } from './app.service';
import { CategoryTranslation } from './models/category-translation.model';
import { BranchSettingTranslation } from './models/branch-setting-translation.model';
import {
  compact,
  first,
  flatten,
  get,
  orderBy,
  size,
  toLower,
  uniq,
} from 'lodash';
import { Product } from './models/product.model';
import { Op } from 'sequelize';
import { ProductPermission } from './models/product-permission.model';
import { ProductPermissionExceptions } from './models/product-permission-exceptions.model';
import { ProductCategory } from './models/product-category.model';
import { ProductTranslation } from './models/product-translation.model';
import { Branch } from './models/branch.model';
import { MultipleBranchInventory } from './models/multiple-branch-inventory.model';
import { ProductCollectionAttribute } from './models/product-collection-attribute.model';
import { BranchInventory } from './models/branch-inventory.model';
import { Uom } from './models/uom.model';
import { Pricing } from './models/pricing.model';
import { ProductImage } from './models/product-image.model';
import { UomTranslation } from './models/uom-translation.model';
import { ProductAttribute } from './models/product-attribute.model';
import { array_intersect, convertToSnakeCase, unique } from './libs/common';
import { ConfigService } from '@nestjs/config';
import { decamelizeKeys } from 'humps';

@Controller('/')
export class AppController {
  constructor(
    private readonly appService: AppService,
    @InjectModel(Category)
    private readonly categoryModel: typeof Category,
    @InjectModel(Address)
    private readonly addressModel: typeof Address,
    @InjectModel(SiteLocale)
    private readonly siteLocaleModel: typeof SiteLocale,
    @InjectModel(Product)
    private readonly productModel: typeof Product,
    @InjectModel(ProductCategory)
    private readonly productCategoryModel: typeof ProductCategory,
    @InjectModel(Uom)
    private readonly uomModel: typeof Uom,
    @InjectModel(Pricing)
    private readonly pricingModel: typeof Pricing,
    @InjectModel(ProductAttribute)
    private readonly productAttributeModel: typeof ProductAttribute,
    private readonly configService: ConfigService,
  ) {}

  @Get('/product-lists')
  async productLists(@Request() req) {
    const language = req.query.locale || DEFAULT_LOCALE_CODE;
    const [siteLocale, defaultSiteLocale, address] = await Promise.all([
      this.siteLocaleModel.findOne({
        where: {
          code: language,
        },
        attributes: ['id', 'code'],
      }),
      this.siteLocaleModel.findOne({
        where: {
          code: DEFAULT_LOCALE_CODE,
        },
        attributes: ['id'],
      }),
      this.addressModel.findOne({
        where: {
          id: req.query.address_id,
        },
        attributes: ['id', 'branch_id'],
      }),
    ]);

    const category = await this.categoryModel.findOne({
      where: {
        code: req.query.category_code,
        is_enabled: true,
      },
      include: [
        {
          model: BranchSetting,
          as: 'branchSettings',
          where: {
            branch_id: address.branch_id,
            is_enabled: true,
          },
          attributes: [
            'id',
            'category_id',
            'is_inherit_protected_inventory',
            'protected_inventory',
            'is_inherit_maximum_visible',
            'maximum_visible',
            'is_inherit_show_value',
            'is_inherit_special_order_string',
            'show_value',
          ],
          required: true,
          include: [
            {
              model: BranchSettingTranslation,
              as: 'translations',
            },
          ],
        },
        {
          model: Category,
          as: 'children',
          where: {
            is_enabled: true,
          },
          attributes: ['id', 'parent_id'],
          required: false,
        },
        {
          model: Category,
          as: 'parent',
          where: {
            is_enabled: true,
          },
          attributes: ['id'],
          required: true,
          include: [
            {
              model: BranchSetting,
              as: 'branchSettings',
              where: {
                branch_id: address.branch_id,
                is_enabled: true,
              },
              attributes: [
                'id',
                'category_id',
                'is_inherit_protected_inventory',
                'protected_inventory',
                'is_inherit_maximum_visible',
                'maximum_visible',
                'is_inherit_show_value',
                'is_inherit_special_order_string',
                'show_value',
              ],
              include: [BranchSettingTranslation],
            },
            {
              model: CategoryTranslation,
              as: 'translations',
              where: {
                site_locale_id: siteLocale.id,
              },
            },
          ],
        },
      ],
    });
    if (!category || category.children.length > 0) {
      throw new BadRequestException('Category not found');
    }
    const branchSetting = await this.appService.getBranchSetting(
      siteLocale,
      category,
      address.branch_id,
    );
    if (size(branchSetting) === 0) {
      throw new BadRequestException('Branch setting empty');
    }
    let productCollectionIds: any = await this.productModel.findAll({
      where: {
        type: 1,
        category_id: category.id,
        [Op.or]: [
          {
            erp_sku: {
              [Op.ne]: '',
            },
          },
          {
            erp_sku: {
              [Op.ne]: null,
            },
          },
        ],
      },
      include: [
        {
          model: ProductPermission,
          as: 'permission',
          attributes: ['id', 'product_id', 'global_allow'],
          include: [
            {
              model: ProductPermissionExceptions,
              as: 'exceptions',
              where: {
                address_id: address.id,
              },
              attributes: ['id', 'product_permission_id', 'address_id'],
            },
          ],
        },
      ],
      attributes: ['id'],
    });
    const productCategories = await this.productCategoryModel.findAll({
      where: {
        category_id: category.id,
      },
      attributes: ['product_id'],
    });
    if (size(productCategories) > 0) {
      productCollectionIds = productCollectionIds.concat(
        productCategories.map((item) => item.product_id),
      );
    }
    productCollectionIds = await this.appService.filterProductsPermission(
      productCollectionIds,
      address.id,
    );
    let products: any = await this.productModel.findAll({
      where: {
        [Op.or]: [
          {
            product_collection_id: {
              [Op.in]: compact(productCollectionIds.map((p) => p.id)),
            },
          },
          { category_id: category.id },
        ],
        erp_product_id: { [Op.ne]: null },
        enabled: true,
        erp_sku: {
          [Op.and]: [
            { [Op.ne]: null }, // erp_sku != null
            { [Op.ne]: '' }, // erp_sku != ''
          ],
        },
        missing_defining_attributes: {
          [Op.or]: [{ [Op.eq]: null }, { [Op.eq]: false }],
        },
        type: 2,
      },
      include: [
        {
          model: BranchInventory,
          as: 'branchInventories',
          where: {
            branch_id: address.branch_id,
            is_available: true,
          },
          required: true,
          attributes: [
            'id',
            'branch_id',
            'product_id',
            'on_hand',
            'is_stocked',
          ],
        },
        {
          model: ProductPermission,
          as: 'permission',
          attributes: ['id', 'product_id', 'global_allow'],
          include: [
            {
              model: ProductPermissionExceptions,
              as: 'exceptions',
              where: {
                address_id: address.id,
              },
              attributes: ['id', 'product_permission_id', 'address_id'],
            },
          ],
        },
        {
          model: ProductTranslation,
          as: 'translations',
          attributes: [
            'site_locale_id',
            'product_id',
            'name',
            'description',
            'short_description',
          ],
        },
        {
          model: Branch,
          as: 'branches',
          attributes: ['id'],
          where: {
            id: address.branch_id,
          },
          include: [
            {
              model: MultipleBranchInventory,
              as: 'multipleBranchInventories',
              attributes: [
                'id',
                'branch_id',
                'type',
                'sub_branch_id',
                'lead_time',
              ],
            },
          ],
        },
        {
          model: ProductCollectionAttribute,
          as: 'productCollectionAttributes',
          attributes: [
            'product_attribute_id',
            'product_attribute_option_id',
            'product_id',
          ],
        },
        {
          model: BranchInventory,
          as: 'branchInventories',
          where: {
            branch_id: address.branch_id,
          },
        },
        {
          model: Product,
          as: 'collection',
          attributes: ['id', 'category_id'],
          include: [
            {
              model: ProductCollectionAttribute,
              as: 'productCollectionAttributes',
              attributes: [
                'id',
                'product_id',
                'product_attribute_id',
                'product_attribute_option_id',
              ],
            },
          ],
        },
        {
          model: ProductImage,
          as: 'images',
          attributes: ['id', 'product_id', 'path', 'is_main'],
        },
      ],
    });
    const productsFromCategory = await this.productModel.findAll({
      where: {
        id: {
          [Op.in]: compact(productCategories.map((item) => item.product_id)),
        },
        erp_product_id: { [Op.ne]: null },
        enabled: true,
        erp_sku: {
          [Op.and]: [
            { [Op.ne]: null }, // erp_sku != null
            { [Op.ne]: '' }, // erp_sku != ''
          ],
        },
        missing_defining_attributes: {
          [Op.or]: [{ [Op.eq]: null }, { [Op.eq]: false }],
        },
        type: 2,
      },
      include: [
        {
          model: BranchInventory,
          as: 'branchInventories',
          where: {
            branch_id: address.branch_id,
            is_available: true,
          },
          required: true,
          attributes: [
            'id',
            'branch_id',
            'product_id',
            'on_hand',
            'is_stocked',
            'is_available',
          ],
        },
        {
          model: ProductPermission,
          as: 'permission',
          attributes: ['id', 'product_id', 'global_allow'],
          include: [
            {
              model: ProductPermissionExceptions,
              as: 'exceptions',
              where: {
                address_id: address.id,
              },
              attributes: ['id', 'product_permission_id', 'address_id'],
            },
          ],
        },
        {
          model: ProductTranslation,
          as: 'translations',
          attributes: [
            'site_locale_id',
            'product_id',
            'name',
            'description',
            'short_description',
          ],
        },
        {
          model: Branch,
          as: 'branches',
          attributes: ['id'],
          where: {
            id: address.branch_id,
          },
          include: [
            {
              model: MultipleBranchInventory,
              as: 'multipleBranchInventories',
              where: {
                branch_id: address.branch_id,
              },
            },
          ],
        },
        {
          model: ProductCollectionAttribute,
          as: 'productCollectionAttributes',
        },
        {
          model: BranchInventory,
          as: 'branchInventories',
          where: {
            branch_id: address.branch_id,
          },
        },
        {
          model: Product,
          as: 'collection',
          attributes: ['id', 'category_id'],
          include: [
            {
              model: ProductCollectionAttribute,
              as: 'productCollectionAttributes',
            },
          ],
        },
        {
          model: ProductImage,
          as: 'images',
          attributes: ['id', 'product_id', 'path', 'is_main'],
        },
      ],
    });
    products = products.concat(productsFromCategory);
    products = await this.appService.filterProductsPermission(
      products,
      address.id,
    );
    products = uniq(compact(products));
    const listUom = [];
    products.map((product) => {
      if (product.uom_1_id) {
        listUom.push(product.uom_1_id);
      }
      if (product.uom_2_id) {
        listUom.push(product.uom_2_id);
      }
    });
    const [uomCollection, pricingCollection] = await Promise.all([
      this.uomModel.findAll({
        where: {
          id: {
            [Op.in]: uniq(listUom),
          },
        },
        include: {
          model: UomTranslation,
          as: 'translations',
          where: {
            site_locale_id: siteLocale.id,
          },
        },
      }),
      this.pricingModel.findAll({
        where: {
          product_id: {
            [Op.in]: products.map((product) => product.id),
          },
          address_id: address.id,
        },
      }),
    ]);
    const cloneCategory = JSON.parse(JSON.stringify(category));
    let buildProducts = JSON.parse(JSON.stringify(products));
    buildProducts = buildProducts.map(async (product) => {
      product['category'] = cloneCategory;
      const nearbyHubsAndBranches =
        await this.appService.getNearbyHubsAndBranches(
          product,
          category,
          siteLocale,
        );
      product['nearby_hubs'] = nearbyHubsAndBranches.nearbyHubs;
      product['nearby_branches'] = nearbyHubsAndBranches.nearbyBranches;
      if (size(product.translations) === 0) {
        product['name'] = product.erp_sku;
      } else {
        const translation = product.translations.find(
          (item) => item.site_locale_id === siteLocale.id,
        );
        product['name'] = translation ? translation.name : product.erp_sku;
        product['default_language'] = product.translations.find(
          (item) => item.site_locale_id === defaultSiteLocale.id,
        );
      }
      product['code'] = product.erp_product_id;
      const inventory: BranchInventory = first(product.branchInventories);
      const branch: Branch = first(product.branches);
      const multipleBranchInventory: any = branch.multipleBranchInventories;
      const inventoryStatus = await this.appService.getBranchInventoryStatus(
        product,
        branchSetting,
        inventory,
        multipleBranchInventory,
        siteLocale,
      );
      inventory['status'] = inventoryStatus;
      inventory['is_stocked'] = inventoryStatus.in_stock;
      inventory['on_hand'] = inventoryStatus.unit;
      product['inventory'] = inventory;
      let units = {
        per_code: 'ea',
        per_name: 'Each',
        uom_2_name: '',
        uom_2_conversion: null,
      };
      if (product.uom_1_id) {
        const mainUom = uomCollection.find(
          (item) => item.id === product.uom_1_id,
        );
        const secondaryUom = uomCollection.find(
          (item) => item.id === product.uom_2_id,
        );
        const secondaryUomTranslation = get(secondaryUom, 'translations.0');
        units = {
          per_code: mainUom.code,
          per_name: first(mainUom.translations).value,
          uom_2_name: secondaryUomTranslation?.value || '',
          uom_2_conversion: product.uom_1_to_uom_2_conversion
            ? parseFloat(String(1 / product.uom_1_to_uom_2_conversion))
            : 1,
        };
      }
      product['units'] = units;
      const productPricing = pricingCollection.filter(
        (item) => item.product_id === product.id,
      );
      const prices = [];
      if (size(productPricing) > 0) {
        const sortProductPricing = productPricing.sort(
          (a, b) => a.quantity - b.quantity,
        );
        sortProductPricing.map((price) => {
          prices.push({
            qty: Number(price.quantity),
            pickup: Number(price.pickup_price),
            delivery: Number(price.delivery_price),
          });
        });
        const price = first(productPricing);
        product['price'] =
          req.query.delivery_type === 'pickup'
            ? parseFloat(String(price.pickup_price))
            : parseFloat(String(price.delivery_price));
      }
      product['prices'] = prices;
      product['pricing_method'] =
        product.pricing_method === 'blended' ? 'blended' : 'standard';
      product['new_inventory'] = {
        on_hand: null,
        lead_time: null,
        branch_id: null,
      };
      if (
        (inventory.is_stocked && inventory.on_hand < 0) ||
        !inventory.is_stocked
      ) {
        if (size(product.nearby_hubs)) {
          let nearbyHub = product.nearby_hubs.filter(
            (item) => item.on_hand > 0,
          );
          if (size(nearbyHub) > 0 && size(nearbyHub) !== 1) {
            nearbyHub = nearbyHub.sort((a, b) => a.lead_time - b.lead_time);
          }
          product['new_inventory'] = {
            on_hand: size(nearbyHub) ? nearbyHub[0].on_hand : 0,
            lead_time: size(nearbyHub) ? nearbyHub[0].lead_time : 0,
            branch_id: size(nearbyHub) ? nearbyHub[0].branch_id : 0,
          };
        }
      }
      if (size(product.images)) {
        let productImage = product.images.find((item) => item.is_main);
        if (!productImage) {
          productImage = first(product.images);
        }
        product['url'] =
          this.configService.getOrThrow('IMAGEKIT_URL') + productImage.path;
      } else {
        product['url'] = null;
      }
      return product;
    });
    buildProducts = await Promise.all(buildProducts);
    const inStock = req.query.in_stock === 'true';
    if (inStock) {
      buildProducts = buildProducts
        .filter((product) => {
          if (product.inventory.status.in_stock) {
            return product;
          }
          if (size(product.nearby_hubs) === 0) {
            return null;
          } else {
            if (product.nearby_hubs.any((item) => item.on_hand > 0)) {
              return product;
            }
          }
          return null;
        })
        .filter((product) => product !== null);
    }
    const productAttributes = await this.productAttributeModel.findAll({
      where: {
        is_filterable: true,
      },
      attributes: ['id', 'code'],
    });
    const convertProductAttributes = productAttributes.map((item) => {
      item.code = toLower(item.code);
      return item;
    });
    let filters = req.query.filters;
    if (size(filters) > 0) {
      filters = Object.entries(filters).filter(([key]) => {
        return convertProductAttributes
          .map((attribute) => attribute.code)
          .includes(key);
      });
      const buildFilters: any = [];
      filters.map(([key, value]) => {
        buildFilters[key] = value;
      });
      if (Object.entries(buildFilters).length > 0) {
        Object.entries(buildFilters).map(([key, value]: any) => {
          buildProducts = buildProducts.map((product: any) => {
            const productAttribute = productAttributes.find(
              (attribute: any) => attribute.code === key,
            );
            if (!productAttribute) {
              return null;
            }
            const options: any = [];
            value.map((v: any) => {
              options.push(Number(v));
            });
            let compareAttributes = product.productCollectionAttributes.map(
              (attribute: any) => attribute.product_attribute_id,
            );
            if (product.collection) {
              compareAttributes.push(
                flatten(
                  product.collection.productCollectionAttributes.map(
                    (attribute: any) => attribute.product_attribute_id,
                  ),
                ),
              );
            }
            compareAttributes = unique(compareAttributes);
            let compareOptionAttributes =
              product.productCollectionAttributes.map(
                (attribute: any) => attribute.product_attribute_option_id,
              );
            if (product.collection) {
              compareOptionAttributes.push(
                flatten(
                  product.collection.productCollectionAttributes.map(
                    (attribute: any) => attribute.product_attribute_option_id,
                  ),
                ),
              );
            }
            compareOptionAttributes = unique(compareOptionAttributes);

            if (
              array_intersect(compareAttributes, [productAttribute.id])
                .length &&
              array_intersect(compareOptionAttributes, options).length
            ) {
              return product;
            }
            return null;
          });
          buildProducts = buildProducts.filter(
            (product: any) => product !== null,
          );
        });
      }
    }
    const orderPrice = get(req, 'query.filters.order.price');
    if (orderPrice && ['asc', 'desc'].includes(orderPrice)) {
      buildProducts = orderBy(buildProducts, 'price', orderPrice);
    }
    const orderName = get(req, 'query.filters.order.name');
    if (orderName && ['asc', 'desc'].includes(orderName)) {
      buildProducts = orderBy(buildProducts, 'name', orderName);
    }
    return decamelizeKeys(buildProducts.filter((product) => product !== null));
  }
}
