import { Meteor } from "meteor/meteor";
import { ValidatedMethod } from "meteor/mdg:validated-method";
import { check, Match } from "meteor/check";

import RegEx from "/imports/lib/regex";
import { userHasCapabilities } from "/imports/lib/user";
import { escapeRegex, withoutUndefined } from "/imports/lib/utilities";
import { version } from "../version";

import { productsCollection } from "/imports/collections/products";

/**
 * products.create
 * creates a new product
 * @param {object} params - the parameters passed to the method
 * @param {string} params.code - the sku-like code of the product
 * @param {string} params.name - the name of the product
 * @param {string} [params.unit] - the unit of the product, pcs kg or l
 * @returns {Promise<string>} resolves in the id of the new product
 */
export const productsCreate = new ValidatedMethod({
  name: `${version}.products.create`,
  validate(params) {
    check(
      withoutUndefined(params),
      { code: String, name: String, unit: Match.Maybe(String) },
      { errorMessage: "invalid product" },
    );
  },
  async run({ code, name, unit }) {
    const { userId } = this;
    if (!userId)
      throw new Meteor.Error(
        "products.create.not-logged-in",
        "errors.not-logged-in",
      );

    if (
      !(await userHasCapabilities({
        userId,
        capabilities: ["c_products_create"],
      }))
    )
      throw new Meteor.Error(
        "products.create.no-permission",
        "errors.no-permission",
      );

    //make sure the code isn't taken yet
    const exists = await productsCollection.findOneAsync({ code });
    if (exists)
      throw new Meteor.Error("products.create.code-taken", "errors.code-taken");

    return productsCollection.insertAsync({
      code,
      name,
      unit,
      user_id: userId,
    });
  },
});

/**
 * products.update
 * updates an existing product
 * @param {object} params - the parameters passed to the method
 * @param {string} params.productId - the id of the product to update
 * @param {string} [params.name] - the new name of the product
 * @param {string} [params.unit] - the new unit of the product
 * @returns {Promise<number>} resolves in the number of modified documents
 */
export const productsUpdate = new ValidatedMethod({
  name: `${version}.products.update`,
  validate(params) {
    check(
      withoutUndefined(params),
      {
        productId: Match.Where((x) => RegEx.Id.test(x)),
        name: Match.Maybe(String),
        unit: Match.Maybe(String),
      },
      { errorMessage: "invalid product" },
    );
  },
  async run({ productId, name, unit }) {
    const { userId } = this;
    if (!userId)
      throw new Meteor.Error(
        "products.update.not-logged-in",
        "errors.not-logged-in",
      );

    if (
      !(await userHasCapabilities({
        userId,
        capabilities: ["c_products_update"],
      }))
    )
      throw new Meteor.Error(
        "products.update.no-permission",
        "errors.no-permission",
      );

    const product = await productsCollection.findOneAsync({
      _id: productId,
      trash: { $exists: false },
    });
    if (!product)
      throw new Meteor.Error("products.update.not-found", "errors.not-found");

    const set = { modified: new Date() };
    if (name != null) set.name = name;
    if (unit != null) set.unit = unit;

    return productsCollection.updateAsync(productId, { $set: set });
  },
});

/**
 * products.delete
 * soft deletes a product by setting trash
 * @param {object} params - the parameters passed to the method
 * @param {string} params.productId - the id of the product to delete
 * @returns {Promise<number>} resolves in the number of modified documents
 */
export const productsDelete = new ValidatedMethod({
  name: `${version}.products.delete`,
  validate(params) {
    check(
      withoutUndefined(params),
      { productId: Match.Where((x) => RegEx.Id.test(x)) },
      { errorMessage: "invalid product identifier" },
    );
  },
  async run({ productId }) {
    const { userId } = this;
    if (!userId)
      throw new Meteor.Error(
        "products.delete.not-logged-in",
        "errors.not-logged-in",
      );

    if (
      !(await userHasCapabilities({
        userId,
        capabilities: ["c_products_delete"],
      }))
    )
      throw new Meteor.Error(
        "products.delete.no-permission",
        "errors.no-permission",
      );

    const product = await productsCollection.findOneAsync({
      _id: productId,
      trash: { $exists: false },
    });
    if (!product)
      throw new Meteor.Error("products.delete.not-found", "errors.not-found");

    return productsCollection.updateAsync(productId, {
      $set: { trash: new Date(), modified: new Date() },
    });
  },
});

/**
 * products.lookup
 * searches products by code and name for autocomplete
 * @param {object} params - the parameters passed to the method
 * @param {string} params.query - the search query
 * @returns {Promise<object[]>} resolves in an array of product matches
 */
export const productsLookup = new ValidatedMethod({
  name: `${version}.products.lookup`,
  validate({ query }) {
    check({ query }, { query: String }, { errorMessage: "invalid query" });
  },
  async run({ query }) {
    const { userId } = this;
    if (!userId)
      throw new Meteor.Error(
        "products.lookup.not-logged-in",
        "errors.not-logged-in",
      );

    if (
      !(await userHasCapabilities({
        userId,
        capabilities: ["c_products_read"],
      }))
    )
      throw new Meteor.Error(
        "products.lookup.no-permission",
        "errors.no-permission",
      );

    //return the first 20 products when no query was given
    if (!query.trim())
      return productsCollection
        .find(
          {
            trash: { $exists: false },
          },
          {
            fields: { code: 1, name: 1 },
            sort: { code: 1 },
            limit: 20,
          },
        )
        .fetchAsync();

    const regex = new RegExp(escapeRegex(query.trim()), "i");

    //only return products for which the code or name matches the query
    return productsCollection
      .find(
        {
          trash: { $exists: false },
          $or: [{ code: regex }, { name: regex }],
        },
        {
          fields: { code: 1, name: 1 },
          sort: { code: 1 },
          limit: 20,
        },
      )
      .fetchAsync();
  },
});
