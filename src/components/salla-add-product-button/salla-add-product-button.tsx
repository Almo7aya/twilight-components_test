import {Component, Element, State, Event, EventEmitter, Host, Prop, h} from '@stencil/core';
import Cart from '../../assets/svg/cart.svg';

@Component({
  tag: 'salla-add-product-button',
  styleUrl: 'salla-add-product-button.css'
})
export class SallaAddProductButton {

  private hostAttributes: any = {};
  private btn?: HTMLSallaButtonElement;
  private passedLabel: string;

  constructor() {
    salla.onReady(() => {
      this.showQuickBuy = this.quickBuy && !!salla.config.get('store.settings.buy_now') && this.productStatus == 'sale' && this.productType !== 'booking';
    });
  }

  /**
   * Channels.
   */
  @Prop({reflect: true}) channels: string;

  /**
   * Subscribed Options ex: "[[139487,2394739],[1212,1544]]"
   */
  @Prop() subscribedOptions: string;

  /**
   * Support Quick Pay Button
   */
  @Prop({reflect: true, mutable: true}) quickBuy: boolean;

  /**
   * Product Quantity
   */
  @Prop({reflect: true}) quantity: number;

  /**
   * Donating amount.
   */
  @Prop({reflect: true}) donatingAmount: number;

  /**
   * Listen to product options availability.
   */
  @Prop({reflect: true}) notifyOptionsAvailability: boolean;

  /**
   * Product id
   */
  @Prop({reflect: true}) productId;

  /**
   * Support themes that have a sticky bar
   */
  @Prop({reflect: true}) supportStickyBar: boolean;
  /**
   *  Product Status.Defaults to `sale`
   */
  @Prop({reflect: true}) productStatus: 'sale' | 'out' | 'out-and-notify' = 'sale';

  /**
   * Product type. Defaults to `product`
   */
  @Prop({reflect: true}) productType: 'product' | 'service' | 'codes' | 'digital' | 'food' | 'donating' | 'group_products' | 'booking' = 'product';

  /**
   * Custome DOM event emitter when product gets added to cart successfully.
   */
  @Event() success: EventEmitter;

  @State() hasOutOfStockOption: boolean;

  @State() hasSubscribedOptions: boolean;

  @State() selectedOptions: Array<any> = [];
  @State() showQuickBuy: boolean;

  /**
   * Custome DOM event emitter when product addition to cart fails.
   */
  @Event() failed: EventEmitter;

  @Element() host: HTMLElement;

  private getLabel() {
    if (this.productStatus === 'sale' && this.supportStickyBar && window.innerWidth <= 768 && this.showQuickBuy) {
      return Cart;
    }

    if (this.productStatus === 'sale' && this.productType === 'booking') {
      return salla.lang.get('pages.cart.book_now');
    }

    if (this.productStatus === 'sale') {
      return salla.lang.get('pages.cart.add_to_cart');
    }

    if (this.productType !== 'donating') {
      return salla.lang.get('pages.products.out_of_stock');
    }

    // donating
    return salla.lang.get('pages.products.donation_exceed');
  }

  private addProductToCart(event) {

    if (this.productType === 'booking') {
      event.preventDefault();
      return this.addBookingProduct();
    }

    // we want to ignore the click action when the type of button is submit a form
    if (this.hostAttributes.type === 'submit') {
      return false;
    }
    event.preventDefault();

    this.btn?.disable();
    /**
     * by default the quick add is just an alias for add item function
     * but its work only when the id is the only value is passed via the object
     * so we will filter the object entities to remove null and zero values in case we don't want the normal add item action
     */
    const data:any = Object.entries({
      id: this.productId,
      donation_amount: this.donatingAmount,
      quantity: this.quantity,
      endpoint: 'quickAdd'
    }).reduce((a, [k, v]) => (v ? (a[k] = v, a) : a), {})
    return salla.cart.addItem(data)
      .then(response => {
        this.selectedOptions = [];
        this.btn?.enable();
        this.success.emit(response);
      })
      .catch(error => {this.failed.emit(error); this.btn?.enable();});
  }

  private addBookingProduct() {
    if (salla.config.isGuest()) {
      salla.auth.api.setAfterLoginEvent('booking::add', this.productId);
      salla.event.dispatch('login::open');
      return;
    }
    return salla.booking.add(this.productId)
      .then(resp => this.success.emit(resp))
      .catch(error => this.failed.emit(error))
  }

  private getBtnAttributes() {
    for (let i = 0; i < this.host.attributes.length; i++) {
      if (!['id', 'class'].includes(this.host.attributes[i].name)) {
        this.hostAttributes[this.host.attributes[i].name] = this.host.attributes[i].value;
      }
    }

    return this.hostAttributes;
  }

  private getQuickBuyBtnAttributes() {
    return {
      ...this.getBtnAttributes(),
      type: this.supportStickyBar && window.innerWidth <= 768 ? 'plain' : this.productType == 'donating' ? 'donate' : 'buy'
    }
  }


  componentWillLoad(): void {
    this.passedLabel = this.host.innerHTML.replace('<!---->', '').trim();
    if (!!this.passedLabel && window.innerWidth >= 768) {
      this.btn?.setText(this.passedLabel);
      return;
    }
    if (this.host.hasAttribute('type') && this.host.getAttribute('type') === 'submit' && this.supportStickyBar) {
      window.addEventListener('resize', () => {
        if (window.innerWidth >= 768 && !!this.passedLabel) {
          this.btn?.setText(this.passedLabel)
        } else {
          this.btn?.setText(this.getLabel())
        }
      });
    }
  }


  render() {
    //TODO:: find a better fix, this is a patch for issue that duplicates the buttons more than twice @see the screenshot inside this folder
    if (this.host.closest('.swiper-slide')?.classList.contains('swiper-slide-duplicate')) {
      return ''
    }
    if (this.hasSubscribedOptions) {
      return <Host>
        <salla-product-availability {...this.getBtnAttributes()} is-subscribed={true}>
          <span class="s-hidden"><slot/></span>
        </salla-product-availability>
      </Host>;
    }

    if ((this.productStatus === 'out-and-notify' && this.channels) || this.hasOutOfStockOption) {
      return <Host>
        <salla-product-availability {...this.getBtnAttributes()}>
          <span class="s-hidden"><slot/></span>
        </salla-product-availability>
      </Host>;
    }

    return <Host class={{
      's-add-product-button-with-quick-buy': this.showQuickBuy,
      's-add-product-button-with-sticky-bar': this.supportStickyBar
    }}>
      <salla-button color={this.productStatus === 'sale' ? 'primary' : 'light'}
                    type="button"
                    fill={this.productStatus === 'sale' ? 'solid' : 'outline'}
                    ref={el => this.btn = el as HTMLSallaButtonElement}
                    onClick={event => this.addProductToCart(event)}
                    disabled={this.productStatus !== 'sale'}
                    {...this.getBtnAttributes()}
                    loader-position="center"
      >
        <slot/>
      </salla-button>
      {this.showQuickBuy ? <salla-quick-buy {...this.getQuickBuyBtnAttributes()} /> : ''}
    </Host>;
  }

  componentDidLoad() {
    if (!this.notifyOptionsAvailability) {
      return;
    }

    salla.event.on('product-options::change', async data => {
      if (!['thumbnail', 'color', 'single-option'].includes(data.option.type)) {
        return;
      }
      this.hasSubscribedOptions = false;
      this.selectedOptions = await (document.querySelector(`salla-product-options[product-id="${this.productId}"]`) as any)?.getSelectedOptions();
      this.hasOutOfStockOption = await (document.querySelector(`salla-product-options[product-id="${this.productId}"]`) as any)?.hasOutOfStockOption();
      let subscribedDetails = salla.storage.get(`product-${this.productId}-subscribed-options`);

      if (!subscribedDetails && !this.subscribedOptions || !this.hasOutOfStockOption) {
        return;
      }

      if (salla.config.isGuest()) {
        const parsedSubscribedDetails = subscribedDetails ? subscribedDetails.map(ids => ids.split(',').map(id => parseInt(id))) : [];

        this.hasSubscribedOptions = parsedSubscribedDetails.length > 0 && parsedSubscribedDetails.some(ids =>
          ids.every(id => this.selectedOptions.some(option => option.id === id))
        );
      } else {
        this.hasSubscribedOptions = this.subscribedOptions && this.subscribedOptions !== 'null' && this.subscribedOptions !== '[]' ? JSON.parse(this.subscribedOptions).some(ids =>
          ids.every(id => this.selectedOptions.some(option => option.id === id))
        ) : false;
      }
    });


  }

  componentDidRender(): void {
    //if label not passed, get label
    if (!!this.passedLabel && (!this.supportStickyBar || window.innerWidth >= 768)) {
      // if passed label, set it
      this.btn?.setText(this.passedLabel)
      return;
    }
    this.btn?.setText(this.getLabel())

    salla.lang.onLoaded(() => this.btn?.setText(this.getLabel()));
  }
}
