import { Component, Host, h, Prop, State, Element } from '@stencil/core';
import Heart from '../../assets/svg/heart.svg';
import Star from '../../assets/svg/star2.svg';

/**
 * @slot add-to-cart-label - Add to cart label.
 */
@Component({
  tag: 'custom-salla-product-card2',
  styleUrl: 'custom-salla-product-card2.css',
  assetsDirs: ['assets']
})

export class CustomSallaProductCard2 {
  constructor() {
    // Store configs
    salla.onReady(() => {
      this.fitImageHeight = salla.config.get('store.settings.product.fit_type');
      salla.wishlist.event.onAdded((_res, id) => this.toggleFavoriteIcon(true, id));
      salla.wishlist.event.onRemoved((_res, id) => this.toggleFavoriteIcon(false, id));
      this.placeholder = salla.url.asset(salla.config.get('theme.settings.placeholder'));
    });

    // Language
    salla.lang.onLoaded(() => {
      this.remained = salla.lang.get('pages.products.remained');
      this.donationAmount = salla.lang.get('pages.products.donation_amount');
      this.startingPrice = salla.lang.get('pages.products.starting_price');
      this.addToCart = salla.lang.get('pages.cart.add_to_cart');
      this.outOfStock = salla.lang.get('pages.products.out_of_stock');
    })

    // Parse product data
    if (this.product) {
      try {
        this.productData = typeof this.product == 'object' ? this.product : JSON.parse(this.product);
        return;
      } catch (e) {
        // TODO: Don't you think it's better not to render the component in this case?
        salla.log('Bad json passed via product prop');
      }
    }
  }

  @Element() host: HTMLElement;
  // State
  @State() productData: any;
  @State() fitImageHeight: boolean;
  @State() remained: string;
  @State() outOfStock: string;
  @State() donationAmount: string;
  @State() startingPrice: string;
  @State() addToCart: string;
  @State() placeholder: string;


  // Refs
  private pie: any;
  private wishlistBtn: HTMLSallaButtonElement;
  private addBtn: HTMLSallaAddProductButtonElement;

  // Props


  /**
   *  Product information.
   */
  @Prop() product: string;

  /**
   *  Horizontal card.
   */
  @Prop() horizontal: boolean;

  /**
   *  Support shadow on hover.
   */
  @Prop() shadowOnHover: boolean;

  /**
   *  Hide add to cart button.
   */
  @Prop() hideAddBtn: boolean;

  /**
   *  Full image card.
   */
  @Prop() fullImage: boolean;

  /**
   *  Minimal card.
   */
  @Prop() minimal: boolean;

  /**
   *  Special card.
   */
  @Prop() isSpecial: boolean;

  /**
   *  Show quantity.
   */
  @Prop() showQuantity: boolean;


  // Private Methods
  private initCircleBar() {
    let qty = this.productData.quantity,
      total = this.productData.quantity > 100 ? this.productData.quantity * 2 : 100,
      roundPercent = (qty / total) * 100,
      bar = this.pie.querySelector('.s-product-card-content-pie-svg-bar'),
      strokeDashOffsetValue = 100 - roundPercent;
    bar.style.strokeDashoffset = strokeDashOffsetValue;
  }

  private toggleFavoriteIcon(isAdded = true, id = null) {
    if (id && id !== this.productData.id) {
      return;
    }
    this.wishlistBtn?.classList.toggle('s-product-card-wishlist-added', isAdded);
  }

  private formatDate(date) {
    let d = new Date(date);
    return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
  }

  private getProductBadge() {
    if (this.productData.promotion_title) {
      return <div class="s-product-card-promotion-title">{this.productData.promotion_title}</div>
    }
    if (this.showQuantity && this.productData?.quantity) {
      return <div
        class="s-product-card-quantity">{this.remained} {salla.helpers.number(this.productData?.quantity)}</div>
    }
    if (this.showQuantity && this.productData?.is_out_of_stock) {
      return <div class="s-product-card-out-badge">{this.outOfStock}</div>
    }
    return '';

  }

  getPriceFormat(price) {
    if (!price) {
      return;
    }

    return salla.money(price);
  }

  private getProductPrice() {
    if (this.productData.is_on_sale) {
      return <div class="s-product-card-sale-price">
        <h4>{this.getPriceFormat(this.productData.sale_price)}</h4>
        <span>{this.getPriceFormat(this.productData?.regular_price)}</span>
      </div>;
    }
    if (this.productData.starting_price) {
      return <div class="s-product-card-starting-price"><p>{this.startingPrice}</p>
        <h4> {this.getPriceFormat(this.productData?.starting_price)} </h4></div>
    }
    return <h4 class="s-product-card-price">{this.getPriceFormat(this.productData?.price)}</h4>
  }

  render() {
    const classes = {
      's-product-card-entry': true,
      's-product-card-vertical': !this.horizontal && !this.fullImage && !this.minimal,
      's-product-card-horizontal': this.horizontal && !this.fullImage && !this.minimal,
      's-product-card-fit-height': this.fitImageHeight && !this.isSpecial && !this.fullImage && !this.minimal,
      's-product-card-special': this.isSpecial,
      's-product-card-full-image': this.fullImage,
      's-product-card-minimal': this.minimal,
      's-product-card-donation': this.productData?.donation,
      's-product-card-shadow': this.shadowOnHover,
      's-product-card-out-of-stock': this.productData?.is_out_of_stock,
    };
    return (
      <Host id={`product-${this.productData?.id}`} class={classes}>
        <h1>This is a test</h1>
        <div class={!this.fullImage ? 's-product-card-image' : 's-product-card-image-full'}>
          <a href={this.productData?.url}>
            <img class={`s-product-card-image-${salla.url.is_placeholder(this.productData?.image?.url)
              ? 'contain'
              : this.fitImageHeight
                ? this.fitImageHeight
                : 'cover'} lazy`}
              src={this.placeholder}
              alt={this.productData?.image?.alt}
              data-src={this.productData?.image?.url || this.productData?.thumbnail}
            />
            {!this.fullImage && !this.minimal ? this.getProductBadge() : ''}
          </a>
          {this.fullImage && <a href={this.productData?.url} class="s-product-card-overlay" />}
          {!this.horizontal && !this.fullImage ?
            <salla-button
              shape="icon"
              fill="none"
              color="light"
              aria-label="Add or remove to wishlist"
              ref={el => this.wishlistBtn = el}
              class="s-product-card-wishlist-btn animated"
              onClick={() => salla.wishlist.toggle(this.productData.id)}>
              <span innerHTML={Heart} />
            </salla-button> : ''
          }
        </div>
        <div class="s-product-card-content">
          {this.isSpecial && this.productData?.quantity ?
            <div class="s-product-card-content-pie" ref={pie => this.pie = pie}>
              <span>
                <b>{salla.helpers.number(this.productData?.quantity)}</b>
                {this.remained}
              </span>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="-2 -1 36 34" class="s-product-card-content-pie-svg">
                <circle cx="16" cy="16" r="15.9155" class="s-product-card-content-pie-svg-base" />
                <circle cx="16" cy="16" r="15.9155" class="s-product-card-content-pie-svg-bar" />
              </svg>
            </div>
            : ''}

          <div class={{ 's-product-card-content-main': true, 's-product-card-content-extra-padding': this.isSpecial }}>
            <h3 class="s-product-card-content-title">
              <a href={this.productData?.url}>{this.productData?.name}</a>
            </h3>

            {this.productData?.subtitle && !this.minimal ?
              <p class="s-product-card-content-subtitle">{this.productData?.subtitle}</p>
              : ''}
          </div>
          {this.productData?.donation && !this.minimal && !this.fullImage ?
            [<salla-progress-bar donation={this.productData?.donation} />,
            <div class="s-product-card-donation-input">
              {this.productData?.donation?.can_donate ?
                [<label htmlFor="donation-amount">{this.donationAmount} <span>*</span></label>,
                <input
                  type="text"
                  onInput={e => {
                    salla.helpers.inputDigitsOnly(e.target);
                    this.addBtn.donatingAmount = (e.target as any).value;
                  }}
                  id="donation-amount"
                  name="donating_amount"
                  class="s-form-control"
                  placeholder={this.donationAmount} />]
                : ''}
            </div>]
            : ''}
          <div class={{ 's-product-card-content-sub': true, 's-product-card-content-extra-padding': this.isSpecial }}>
            {this.getProductPrice()}
            {this.productData?.rating?.stars && !this.minimal ?
              <div class="s-product-card-rating">
                <span innerHTML={Star}/>
                <span>{this.productData.rating.stars}</span>
              </div>
               : ''}
          </div>

          {this.isSpecial && this.productData.discount_ends
            ? <salla-count-down date={this.formatDate(this.productData.discount_ends)} end-of-day={true} boxed={true}
              labeled={true} />
            : ''}


          {!this.hideAddBtn ?
            <div class="s-product-card-content-footer">
              {/* @ts-ignore */}
              <salla-add-product-button fill="outline" width="wide"
                ref={el => this.addBtn = el}
                product-id={this.productData.id}
                product-status={this.productData.status}
                product-type={this.productData.type}>
                <slot name="add-to-cart-label">{this.productData.add_to_cart_label}</slot>
              </salla-add-product-button>

              {this.horizontal || this.fullImage ?
                <salla-button
                  shape="icon"
                  fill="none"
                  color="light"
                  ref={el => this.wishlistBtn = el}
                  aria-label="Add or remove to wishlist"
                  class="s-product-card-wishlist-btn animated"
                  onClick={() => salla.wishlist.toggle(this.productData.id)}
                  data-id="{{ product.id }}">
                  <span class="text-xl" innerHTML={Heart} />
                </salla-button>
                : ''}
            </div>
            : ''}
        </div>
      </Host>
    );
  }

  componentDidLoad() {
    document.lazyLoadInstance?.update(this.host.querySelectorAll('.lazy'));
    if (this.productData?.quantity && this.isSpecial) {
      this.initCircleBar();
    }

    if (!salla.config.isGuest() && salla.storage.get('salla::wishlist', []).includes(this.productData.id)) {
      this.toggleFavoriteIcon();
    }
  }

}
