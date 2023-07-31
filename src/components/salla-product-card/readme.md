# salla-product-card



<!-- Auto Generated Below -->


## Properties

| Property        | Attribute         | Description              | Type      | Default     |
| --------------- | ----------------- | ------------------------ | --------- | ----------- |
| `fullImage`     | `full-image`      | Full image card.         | `boolean` | `undefined` |
| `hideAddBtn`    | `hide-add-btn`    | Hide add to cart button. | `boolean` | `undefined` |
| `horizontal`    | `horizontal`      | Horizontal card.         | `boolean` | `undefined` |
| `isSpecial`     | `is-special`      | Special card.            | `boolean` | `undefined` |
| `minimal`       | `minimal`         | Minimal card.            | `boolean` | `undefined` |
| `product`       | `product`         | Product information.     | `string`  | `undefined` |
| `shadowOnHover` | `shadow-on-hover` | Support shadow on hover. | `boolean` | `undefined` |
| `showQuantity`  | `show-quantity`   | Show quantity.           | `boolean` | `undefined` |


## Slots

| Slot                  | Description        |
| --------------------- | ------------------ |
| `"add-to-cart-label"` | Add to cart label. |


## Dependencies

### Used by

 - [salla-products-slider](../salla-products-slider)

### Depends on

- [salla-button](../salla-button)
- [salla-progress-bar](../salla-progress-bar)
- [salla-count-down](../salla-count-down)
- [salla-add-product-button](../salla-add-product-button)

### Graph
```mermaid
graph TD;
  salla-product-card --> salla-button
  salla-product-card --> salla-progress-bar
  salla-product-card --> salla-count-down
  salla-product-card --> salla-add-product-button
  salla-add-product-button --> salla-product-availability
  salla-add-product-button --> salla-button
  salla-add-product-button --> salla-quick-buy
  salla-product-availability --> salla-button
  salla-product-availability --> salla-modal
  salla-product-availability --> salla-tel-input
  salla-modal --> salla-loading
  salla-quick-buy --> salla-button
  salla-products-slider --> salla-product-card
  style salla-product-card fill:#f9f,stroke:#333,stroke-width:4px
```

----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
