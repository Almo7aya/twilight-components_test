import { Component, h, Element, Method, State } from '@stencil/core';
import Offer from "./offer-schema";
import SpecialDiscountIcon from '../../assets/svg/special-discount.svg';
import Tag from "../../assets/svg/tag.svg";
import Cart2 from '../../assets/svg/cart2.svg';

/**
 * @slot header - The top of the popup, has replaceable props `{name}`, `{message}`.
 * @slot product - Replaces product card, has replaceable props `{name}`, `{url}`, `{image}`, `{price}`.
 * @slot category - Replaces Category badge, has replaceable props `{name}`, `{url}`.
 */
@Component({
  tag: 'salla-offer-modal',
  styleUrl: 'salla-offer-modal.css'
})

export class SallaOfferModal {
  private productSlot: string;
  private categorySlot: string;
  private modal: HTMLSallaModalElement;
  @Element() host: HTMLElement;
  @State() offer: null | Offer = null;
  @State() offer_name: string;
  @State() offer_message: string;
  @State() hasError: boolean = false;
  @State() errorMessage: string;
  @State() productID: number;
  @State() offer_type: string;

  constructor() {
    salla.event.on('offer-modal::open', product_id => this.open(product_id));

    salla.lang.onLoaded(() => {
      this.addToCartLabel = salla.lang.get("pages.cart.add_to_cart")
      this.translationLoaded = true;
    });

    this.categorySlot = this.host.querySelector('[slot="category"]')?.innerHTML || `<span class="s-offer-modal-badge-icon">{tagIcon}</span><span class="s-offer-modal-badge-text">{name}</span>`;
    this.productSlot = this.host.querySelector('[slot="product"]')?.innerHTML || this.defaultProductSlot();
    salla.event.on('offer-modal::open', product_id => this.open(product_id));
    salla.product.event.onOfferExisted(offer => {
      if (salla.storage.get('remember-offer-' + offer.id)) {
        salla.log('User selected to don\'t show this offer again.');
        return;
      }
      this.open(offer.product_id);
    });
  }

  @State() translationLoaded: boolean = false;
  @State() addToCartLabel: string = salla.lang.get("pages.cart.add_to_cart");

  /**
   * Show the available offers for the product
   * @param product_id
   */
  @Method()
  async open(product_id: number) {
    this.productID = product_id;
    //TODO:: make sure there is only one offer

    this.hasError = false;
    this.modal.open()
    return await salla.api.withoutNotifier(() => salla.product.offers(product_id))
      .then(response => this.showOffer(response.data[0]))
      .catch(e => {
        this.hasError = true;
        this.errorMessage = e.response?.data?.error?.message || e.response?.data;
      })
      .finally(() => setTimeout(() => this.modal.stopLoading(), 1000));
  }

  /**
   * Show offer details
   * @param {Offer} offer
   */
  @Method()
  async showOffer(offer) {
    this.offer = offer;
    this.offer_name = offer.name;
    this.offer_message = offer.message;
    if (this.offer.get.discounts_table) {
      this.offer_type = 'discounts-table'
    } else if (this.offer.get.products?.length) {
      this.offer_type = 'products'
    } else if (this.offer.get.categories?.length) {
      this.offer_type = 'categories'
    }
    this.modal.setTitle(this.offer_name);
  }

  private rememberMe(event) {
    salla.storage.set('remember-offer-' + this.offer.id, event.target.checked);
  }

  private addToCart(qty) {
    //todo:: add enhancement, to cover the previous quantity, because if the discount to add two, user already added one before.
    salla.api.withoutNotifier(() => salla.cart.quickAdd(this.productID, qty)).then(() => this.modal.close())
  }

  private getOfferContent() {
    if (this.offer.get.discounts_table) {
      return <div class="s-offer-modal-discount-table">
        <table>
          <tbody>
            {this.offer.get.discounts_table?.map(discount =>
              <tr>
                <td>{discount.text}</td>
                <td class="s-offer-modal-discount-table-cell">
                  <salla-button fill="outline" shape="btn" color="primary" size="medium" width="normal"
                    onClick={() => this.addToCart(discount.quantity)}>{this.addToCartLabel}</salla-button>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    }
    else if (this.offer.get.products?.length) {
      return <salla-slider
        type="carousel"
        class={{"s-offer-modal-slider-centered": this.offer.get.products?.length <= 2, "s-offer-modal-slider": true}}
        id="offer-modal-slider"
        controls-outer
        show-controls={this.offer.get.products?.length <= 2 ? 'false' : 'true'}>
        <div slot='items'>
          {
            this.offer.get.products?.map(product =>
              <div class={{
                "s-offer-modal-product": true,
                "s-offer-modal-slider-item": true,
                "s-offer-modal-not-available": !product.is_available
              }} id={'product_' + product.id} innerHTML={this.productSlot
                .replace(/\{name\}/g, product.name)
                .replace(/\{url\}/g, product.url)
                .replace(/\{image\}/g, product.thumbnail)
                .replace(/\{price\}/g, product.has_special_price
                  ? '<span class="s-offer-modal-product-sale-price">' + salla.money(product.price) + '</span><span class="s-offer-modal-product-old-price">' + salla.money(product.regular_price) + '</span>'
                  : salla.money(product.price))}>
                <div class="s-offer-modal-btn-wrap">
                  <salla-button width="wide" fill='outline' data-id={product.id} disabled={!product.is_available}
                    loader-position="center" onClick={this.addItem}>
                    {product.is_available ? salla.lang.get('pages.cart.add_to_cart') : salla.lang.get('pages.products.out_of_stock')}
                  </salla-button>
                </div>
              </div>)
          }
       </div>
      </salla-slider>
    }
    else if (this.offer.get.categories?.length) {
      return <salla-slider
        type="carousel"
        class={{"s-offer-modal-slider-centered": this.offer.get.categories?.length <= 2, "s-offer-modal-slider": true}}
        id="offer-modal-slider"
        controls-outer
        show-controls={this.offer.get.categories?.length <= 2 ? 'false' : 'true'}>
        <div slot='items'>
          {
            this.offer.get.categories.map(category =>
              <a href={category.urls.customer} class="s-offer-modal-badge s-offer-modal-slider-item s-offer-modal-cat-item" innerHTML={
                this.categorySlot
                  .replace(/\{tagIcon\}/g, Tag)
                  .replace(/\{name\}/g, category.name)
                  .replace(/\{url\}/g, category.urls.customer)
              }>
              </a>
            )}
        </div>
      </salla-slider>
    }
  }

  //todo:: pass event then use sallaButton from it
  private addItem() {
    // this here, is sallaButton
    this['load']();
    return salla.cart.api
      .quickAdd(this['dataset'].id)
      .finally(() => this['stop']());
  }

  private defaultProductSlot() {
    return '<a href={url} class="s-offer-modal-product-image-wrap"><img class="s-offer-modal-product-image" src="{image}" /></a>' +
      '<div class="s-offer-modal-product-info">' +
      '   <a href={url} class="s-offer-modal-product-name">{name}</a>' +
      '   <div class="s-offer-modal-product-price">{price}</div>' +
      '</div>';
  }

  render() {
    return <salla-modal has-skeleton sub-title={this.offer_message} ref={modal => this.modal = modal}
      isLoading={true} class={`s-offer-modal-type-${this.offer_type ? this.offer_type : ''}`}>
      <div slot='loading'>
        <div class="s-offer-modal-skeleton">
          <div class="s-offer-modal-skeleton-header">
            <salla-skeleton type='circle' height='80px' width='80px'></salla-skeleton>
            <salla-skeleton height='15px' width='50%'></salla-skeleton>
            <salla-skeleton height='10px' width='30%'></salla-skeleton>
          </div>
          <div class="s-offer-modal-skeleton-items">
            {[...Array(3)].map(() =>
              <div class="s-offer-modal-skeleton-item">
                <salla-skeleton height='9rem'></salla-skeleton>
                <div class="s-offer-modal-skeleton-item-title">
                  <salla-skeleton height='15px' width='100%'></salla-skeleton>
                </div>
                <div class="s-offer-modal-skeleton-item-subtitle">
                  <salla-skeleton height='9px' width='50%'></salla-skeleton>
                  <div innerHTML={Cart2}></div>
                </div>
              </div>
            )}
          </div>
          <div class="s-offer-modal-skeleton-footer">
            <salla-skeleton height='15px' width='50%'></salla-skeleton>
            <salla-skeleton height='15px' width='30%'></salla-skeleton>
          </div>
        </div>
      </div>
      {!this.hasError && this.offer !== null

        ? [<span slot='icon' class="s-offer-modal-header-icon" innerHTML={SpecialDiscountIcon}></span>,
        this.getOfferContent(),
        <div class="s-offer-modal-footer" slot="footer">
          {this.offer.formatted_date ?
            <p
              class="s-offer-modal-expiry">{salla.lang.get('pages.products.offer_expires_in')} {this.offer.formatted_date}</p>
            : ''}
          <label class="s-offer-modal-remember-label">
            <input type="checkbox" onChange={e => this.rememberMe(e)} class="s-offer-modal-remember-input" />
            &nbsp; {salla.lang.get('common.elements.remember_my_choice')}
          </label>
        </div>,
        ] :
        <salla-placeholder class="s-loyalty-placeholder" alignment="center">
          {!!this.errorMessage ? <span slot="description">{this.errorMessage}</span> : ''}
        </salla-placeholder>
      }
    </salla-modal>
  }
}
