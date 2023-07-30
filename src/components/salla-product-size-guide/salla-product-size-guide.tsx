import { Component, State, Method, Element, h } from '@stencil/core';
import PencilRuler from "../../assets/svg/pencil-ruler.svg";
export interface SizeGuide {
  name: string;
  description: string;
}

/**
 * @slot header - The upper section of the component.Empty by default.
 * @slot footer - The bottom section of the component.Empty by default.
 */
@Component({
  tag: 'salla-product-size-guide',
  styleUrl: 'salla-product-size-guide.css',
})
export class SallaProductSizeGuide {
  constructor() {
    salla.event.on('size-guide::open', (product_id) => this.open(product_id));
    salla.lang.onLoaded(() => {
      this.placeholder_title = salla.lang.get('pages.products.size_guide_placeholder')
      this.placeholder_description = salla.lang.get('pages.products.size_guide_placeholder_info')
      this.modal_title = salla.lang.get('pages.products.size_guides');
    })
  }
  private modal: HTMLSallaModalElement;
  @State() guides: Array<SizeGuide> | [];
  @State() productId: number;

  @State() placeholder_title: string;
  @State() placeholder_description: string;
  @State() modal_title: string;
  @State() hasError: boolean = false;

  @Element() host: HTMLElement;
  /**
   * Show the size-guide modal window
   */
  @Method()
  async open(product_id: number) {
    this.modal.setTitle(this.modal_title)
    this.modal.open()
    return await salla.api.withoutNotifier(() => salla.product.getSizeGuides(product_id))
      .then((response) => {
        this.guides = response.data;
      })
      .catch(e => {
        console.log(e)
        this.hasError = true;
        this.placeholder_description = e.response?.data?.error?.message || e.response?.data;
      })
      .finally(() => this.modal.stopLoading())
  }
  /**
   *
   * Hide the size-guide modal window
   */
  @Method()
  async close() {
    return this.modal.close();
  }
  private showPlaceholder() {
    return <salla-placeholder alignment="center" iconSize="xl">
      <div slot="title">
        {this.placeholder_title}
      </div>
      <div slot="description">
        {this.placeholder_description}
      </div>
    </salla-placeholder>
  }
  render() {
    return (
      <salla-modal class="s-product-size-guide-wrapper" id='salla-product-size-guide-modal' isLoading={true} has-skeleton width="md" ref={modal => this.modal = modal}>
        <span slot='icon' class="s-product-size-guide-header-icon" innerHTML={PencilRuler}></span>
        <div slot="loading">
          <div class="s-product-size-guide-skeleton">
            <salla-skeleton height='15px' width='25%'></salla-skeleton>

            <div class="s-product-size-guide-skeleton-header">
              <salla-skeleton height='40px'></salla-skeleton>
              <salla-skeleton height='40px'></salla-skeleton>
              <salla-skeleton height='40px'></salla-skeleton>
              <salla-skeleton height='40px'></salla-skeleton>
            </div>
            <div class="s-product-size-guide-skeleton-content">
              <salla-skeleton height='15px' width='25%'></salla-skeleton>
              <salla-skeleton height='10px' width='75%'></salla-skeleton>
              <salla-skeleton height='10px' width='50%'></salla-skeleton>
              <salla-skeleton height='10px' width='75%'></salla-skeleton>
              <salla-skeleton height='10px' width='100%'></salla-skeleton>
              <salla-skeleton height='10px' width='25%'></salla-skeleton>
              <salla-skeleton height='10px' width='60%'></salla-skeleton>
              <salla-skeleton height='10px' width='45%'></salla-skeleton>
              <salla-skeleton height='10px' width='30%'></salla-skeleton>
            </div>


          </div>
        </div>
        <slot name="header" />
        {!this.hasError && !!this.guides ?
          [
            <salla-tabs>
              {this.guides.map((guide: SizeGuide) =>
                <salla-tab-header slot="header" name={guide.name}>
                  <span>{guide.name}</span>
                </salla-tab-header>
              )}
              {this.guides.map((guide: SizeGuide) =>
                <salla-tab-content slot="content" name={guide.name}>
                  <div innerHTML={guide.description}></div>
                </salla-tab-content>
              )}
            </salla-tabs>
          ]
          : this.showPlaceholder()
        }
        <slot name="footer" />
      </salla-modal>
    );
  }
}
