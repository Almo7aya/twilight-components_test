# salla-quick-buy



<!-- Auto Generated Below -->


## Properties

| Property            | Attribute             | Description                                                                                                             | Type                                                         | Default     |
| ------------------- | --------------------- | ----------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------ | ----------- |
| `amount`            | `amount`              | Product amount in base currency (SAR).                                                                                  | `number`                                                     | `undefined` |
| `currency`          | `currency`            | base currency                                                                                                           | `string`                                                     | `undefined` |
| `isRequireShipping` | `is-require-shipping` | To be passed to purchaseNow request                                                                                     | `boolean`                                                    | `undefined` |
| `options`           | --                    | Product options, if is empty will get the data from the document.querySelector('salla-product-options[product-id="X"]') | `{}`                                                         | `{}`        |
| `productId`         | `product-id`          | Product ID.                                                                                                             | `string`                                                     | `undefined` |
| `type`              | `type`                | Button type.                                                                                                            | `"book" \| "buy" \| "donate" \| "order" \| "pay" \| "plain"` | `'buy'`     |


## Dependencies

### Used by

 - [salla-add-product-button](../salla-add-product-button)

### Depends on

- [salla-button](../salla-button)

### Graph
```mermaid
graph TD;
  salla-quick-buy --> salla-button
  salla-add-product-button --> salla-quick-buy
  style salla-quick-buy fill:#f9f,stroke:#333,stroke-width:4px
```

----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
