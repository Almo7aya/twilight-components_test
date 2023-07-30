# salla-products-list



<!-- Auto Generated Below -->


## Properties

| Property          | Attribute          | Description                                                                                                                                                                                                                                                | Type                                                                                                                                       | Default     |
| ----------------- | ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ | ----------- |
| `filtersResults`  | `filters-results`  | should listen to filters events `salla-filters::changed` and re-render                                                                                                                                                                                     | `boolean`                                                                                                                                  | `undefined` |
| `horizontalCards` | `horizontal-cards` | Horizontal cards                                                                                                                                                                                                                                           | `boolean`                                                                                                                                  | `undefined` |
| `limit`           | `limit`            | Limit for number of products in the list.                                                                                                                                                                                                                  | `number`                                                                                                                                   | `undefined` |
| `sortBy`          | `sort-by`          | Sorting the list of products                                                                                                                                                                                                                               | `string`                                                                                                                                   | `undefined` |
| `source`          | `source`           | The source of the products list                                                                                                                                                                                                                            | `"brands" \| "categories" \| "json" \| "landing-page" \| "latest" \| "offers" \| "related" \| "sales" \| "search" \| "selected" \| "tags"` | `undefined` |
| `sourceValue`     | `source-value`     | The source value, cloud be different values as following: - array of ids when `source` in ['categories', 'brands', 'tags', 'selected'] - keyword when `source` = 'search' - products payload when `source` = 'json' - product_id when `source` = 'related' | `any`                                                                                                                                      | `undefined` |


## Events

| Event             | Description                                       | Type               |
| ----------------- | ------------------------------------------------- | ------------------ |
| `productsFetched` | Custom event fired when the the products fetched. | `CustomEvent<any>` |


## Methods

### `reload() => Promise<void>`

Reload the list of products (entire content of the component).

#### Returns

Type: `Promise<void>`



### `setFilters(filters: any) => Promise<void>`

Set parsed filters data from URI

#### Returns

Type: `Promise<void>`




----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
