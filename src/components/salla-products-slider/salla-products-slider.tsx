import { Component, Host, h, Prop, Element, State } from '@stencil/core';
import Helper from '../../Helpers/Helper';
@Component({
  tag: 'salla-products-slider',
  styleUrl: 'salla-products-slider.css'
})

//todo:: extends this component from salla-products-list or the opposite
export class SallaProductsSlider {
  constructor() {
    salla.onReady(() => {
      this.sourceValueIsValid = !!(this.getSourceValue() || this.isSourceWithoutValue());
      if (!this.sourceValueIsValid) {
        salla.logger.warn(`source-value prop is required for source [${this.getSource()}]`);
        return;
      }
      this.hasCustomComponent = !!customElements.get('custom-salla-product-card');
    });
  }
  private isSourceWithoutValue() {
    return ['offers', 'latest', 'sales'].includes(this.getSource());
  }

  @Element() host: HTMLElement;
  //todo:: support limit, default =10, make sure that maximum is 32,

  /**
   * Title of the block - works only if slider is true
   * @type {string}
   * @default ''
   * */
  @Prop() blockTitle: string;

  /**
   * Sub title of the block - works only if slider is true
   * @type {string}
   * @default ''
   * */
  @Prop() subTitle: string;

  /**
   * Slider Id, if not provided will be generated automatically
   * @type {string}
   * @default ''
   * */
  @Prop() sliderId: string;

  /**
   * Display 'ALL' URL
   * @type {string}
   * @default ''
   * */
  @Prop() displayAllUrl: string;

  /**
  * autoplay option for products slider
  */
  @Prop({ mutable: true }) autoplay: boolean

  /**
   * Source of the products, if api will get the products from the API, if json will get the products from the products prop
   * @type {string}
   * @default ''
   * */
  @Prop({
    reflect: true,
    mutable: true
  }) source: 'categories' | 'latest' | 'related' | 'brands' | 'json' | 'tags' | 'selected' | 'offers' | 'landing-page';

  /**
   * The source value, cloud be different values as following:
   * - array of ids when `source` in ['categories', 'brands', 'tags', 'selected']
   * - products payload when `source` = 'json'
   * - product_id when `source` = 'related'
   *
   * @type {string}
   * */
  @Prop() sourceValue: string;

  /**
   * Limit for number of products in the list.
   */
  @Prop({ mutable: true }) limit: number;


  @State() productsData: any;
  @State() isReady: boolean;
  @State() sourceValueIsValid: boolean;
  @State() hasCustomComponent: boolean;
  @State() apiUrl: string = '';
  @State() parsedSourceValue: any;

  private getItemHTML(product) {
    if (this.hasCustomComponent) {
      return <div class="s-products-slider-card">
        <custom-salla-product-card product={product} source={this.getSource()} source-value={this.getSourceValue()} />
      </div>;
    }

    return <div class="s-products-slider-card">
      <salla-product-card
        show-quantity={this.getSource() == 'landing-page'}
        hide-add-btn={this.getSource() == 'landing-page'}
        shadow-on-hover={true}
        product={product} />
    </div>;
  }



  private canRender() {
    return this.sourceValueIsValid && this.isReady;
  }

  componentWillLoad() {
    if (this.source === 'json') {
      this.productsData = this.getSourceValue();
      this.isReady = true
      return;
    }
    return  salla.product.api.fetch({
      source: this.getSource(),
      source_value: this.getSourceValue(),
      limit: this.limit,
    }).then(res => {
      this.productsData = res.data
      this.isReady = true
      salla.event.emit('salla-products-slider::products.fetched', res.data);
    })
  }
  private getSource() {
    return Helper.getProductsSource(this.source);
  }

  private getSourceValue() {
    return Helper.getProductsSourceValue(this.source, this.sourceValue);
  }

  render() {
    if ((this.getSource() == 'related' && !salla.config.get('store.settings.product.related_products_enabled')) || !this.canRender()) {
      return;
    }
    return (
      <Host class="s-products-slider-wrapper">
        <salla-slider
          class="s-products-slider-slider"
          id={this.sliderId || `s-products-slider-${Math.random().toString(36).substr(2, 9)}`}
          auto-play={this.autoplay}
          type="carousel"
          block-title={this.blockTitle}
          block-subTitle={this.subTitle}
          display-all-url={this.displayAllUrl}
        >
          <div slot="items">
            {this.productsData?.map(product => this.getItemHTML(product))}
          </div>
        </salla-slider>
      </Host>
    );
  }

}
