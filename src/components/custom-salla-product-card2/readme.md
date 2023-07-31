# custom-salla-product-card2



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

### Depends on

- [salla-button](../salla-button)
- [salla-progress-bar](../salla-progress-bar)
- [salla-count-down](../salla-count-down)
- [salla-add-product-button](../salla-add-product-button)

### Graph
```mermaid
graph TD;
  custom-salla-product-card2 --> salla-button
  custom-salla-product-card2 --> salla-progress-bar
  custom-salla-product-card2 --> salla-count-down
  custom-salla-product-card2 --> salla-add-product-button
  salla-add-product-button --> salla-product-availability
  salla-add-product-button --> salla-button
  salla-add-product-button --> salla-quick-buy
  salla-product-availability --> salla-button
  salla-product-availability --> salla-modal
  salla-product-availability --> salla-tel-input
  salla-modal --> salla-loading
  salla-quick-buy --> salla-button
  style custom-salla-product-card2 fill:#f9f,stroke:#333,stroke-width:4px
```

----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
