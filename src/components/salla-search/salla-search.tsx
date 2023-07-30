import { Component, Prop, h, State, Element, Listen, Watch } from '@stencil/core';
import { HTMLStencilElement } from '@stencil/core/internal';
import SearchProductsResponse from "./search-response";
import Search from "../../assets/svg/search.svg";
import Helper from '../../Helpers/Helper';

/**
 * @slot product - Replaces products card in the results, has replaceable props `{name}`, `{price}`, `{regular_price}`, `{image}`.
 */
@Component({ tag: 'salla-search', styleUrl: 'salla-search.css' })
export class SallaSearch {
  constructor() {
    this.productSlot = this.host.querySelector('[slot="product"]')?.innerHTML || this.getDefaultProductSlot();
    salla.event.on('search::open', () => this.open());

    salla.lang.onLoaded(() => {
      this.translationLoaded = true;
    });

    salla.event.on('modalClosed', () => this.onModalClose())
  }

  private readonly productSlot: string;
  private modal: HTMLSallaModalElement;
  private container: HTMLElement;
  private searchInput: HTMLInputElement;
  private noResults: HTMLElement;
  private inputValue: string = '';

  @Element() host: HTMLStencilElement;
  @State() translationLoaded: boolean = false;
  @State() results: SearchProductsResponse | undefined;
  @State() loading: boolean = false;
  @State() typing: boolean = false;
  @State() debounce: ReturnType<typeof setTimeout> = setTimeout(() => '', 1000);
  @State() search_term: string;

  /**
   * Set the component display without modal window. Defaults to `false`
   */
  @Prop() inline: boolean = false;

  /**
   * Adds a border radius to the input. Half of the height.
   */
  @Prop() oval: boolean = false;

  /**
   * Sets the height of the input
   */
  @Prop() height: number = 60;

  async open() {
    if (!this.inline) {
      await this.modal.open().then(() => setTimeout(() => this.searchInput.focus(), 300)
      );
    }
  }
  onModalClose() {
    this.searchInput.value = '';
    this.results = undefined;
    this.afterSearching();
    this.container.classList.remove('s-search-no-results')
  }

  @Listen('keydown')
  handleKeyDown(ev: KeyboardEvent) {
    if (ev.key === 'Enter' && this.search_term?.length) {
      window.location.href = salla.url.get('search?q=' + encodeURI(this.search_term))
    }
  }

  private getDefaultProductSlot() {
    return '<div class="s-search-product-image-container">' +
      '  <img class="s-search-product-image" src="{image}" alt="{name}"/>' +
      '</div>' +
      '<div class="s-search-product-details">' +
      '  <div class="s-search-product-title">{name}</div> <div class="s-search-product-price">{price} <span class="s-search-product-regular-price">{regular_price}</span></div>' +
      '</div>';
  }

  private debounceSearch(event) {
    this.typing = true;
    clearTimeout(this.debounce)
    this.debounce = setTimeout(() => {
      this.typing = false
      this.search_term = event.target.value
    }, 700)
  }

  @Watch('search_term')
  handleSearch(val: string) {
    this.inputValue = val;
    if (val.length > 2) {
      this.search(val);
    }
    else {
      this.results = undefined;
      this.afterSearching();
    }
  }

  search(val) {

    this.noResults.style.display = 'none';
    //run loading spinner or stop it
    this.loading = true;
    salla.product.fetch({source:"search", source_value:val})
      .then(response => this.results = response)
      .catch(err => err !== 'Query is same as previous one!' ? this.results = undefined : null)
      .finally(() => this.afterSearching(/*isEmpty*/ false));
  }

  private afterSearching(isEmpty = true) {
    this.noResults.style.display = isEmpty || this.results?.data.length > 0 ? 'none' : 'block';
    Helper.toggleElementClassIf(this.container, 's-search-container-open', 's-search-no-results', () => this.results?.data.length)
    this.loading = false
    salla.product.api.previousQuery = ''; //avoid having error 'Query is same as previous one!' after reopen modal;
    this.inputValue.length < 3 ? this.container.classList.remove('s-search-no-results') : '';
  }

  render() {
    const searchContent =
      <div class={{ 's-search-container': true, 's-search-inline': this.inline }} ref={container => this.container = container}>
        <input type="search"
          enterkeyhint="search"
          autocomplete="off"
          class="s-search-input"
          placeholder={salla.lang.get('blocks.header.search_placeholder')}
          onInput={e => this.debounceSearch(e)}
          onKeyDown={e => this.handleKeyDown(e)}
          ref={input => this.searchInput = input as HTMLInputElement}
          style={{ height: this.height + 'px', borderRadius: this.oval ? this.height / 2 + 'px' : '' }} />
        <span class="s-search-icon-wrap"><span class="s-search-icon" innerHTML={this.loading ? '<i class="s-search-spinner-loader"/>' : Search}/></span>
        <div class="s-search-results">
          {this.results?.data.map((product) =>
            <a href={product.url} class={{ "s-search-product": true, 's-search-product-not-available': !product.is_available }} innerHTML={this.productSlot
              .replace(/\{name\}/g, product.name)
              .replace(/\{price\}/g, salla.money(product.price))
              .replace(/\{regular_price\}/g, product.is_on_sale ? salla.money(product.regular_price) : '')
              .replace(/\{image\}/g, product.image.url)}/>
          )}
          <p ref={el => this.noResults = el} class="s-search-no-results-placeholder">{salla.lang.get('common.elements.no_options')}</p>
        </div>
      </div>

    return (
      this.inline ?
        <div class="s-search-modal">{searchContent}</div>
        :
        <salla-modal position="top" class="s-search-modal" ref={modal => this.modal = modal}>
          {searchContent}
        </salla-modal>
    );
  }

  /**
   * Run it one time after load
   */
  componentDidLoad() {
    this.afterSearching();
  }
}
