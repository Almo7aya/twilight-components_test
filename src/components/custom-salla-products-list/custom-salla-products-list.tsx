import { Component, Host, h, Prop, State, Element, Method, Event, EventEmitter } from '@stencil/core';
import anime from 'animejs';
import ShoppingBag from '../../assets/svg/shopping-bag.svg';
import Helper from '../../Helpers/Helper';
@Component({
  tag: 'custom-salla-products-list',
  styleUrl: 'custom-salla-products-list.css'
})
export class CustomSallaProductsList {
  connectedCallback() {
    salla.onReady(() => {
      this.hasCustomComponent = !!customElements.get('custom-salla-product-card') || !!this.customCardsElementsTag;
      this.sourceValueIsValid = !!(this.getSourceValue() || this.isSourceWithoutValue());
      this.hasInfiniteScroll = !['json', 'selected', 'related', 'landing-page'].includes(this.getSource());
      try {
        let searchParams = new URLSearchParams(window.location.search);
        this.sortBy = this.sortBy || searchParams.get('sort') || searchParams.get('by');
        let filters = searchParams.get('filters')
        this.parsedFilters = filters ? JSON.parse(decodeURIComponent(filters)) : {};
      } catch (e) {
        salla.logger.warn('failed to get filters from url', e.message);
      }
      this.buildNextPageUrl();
      this.createStatusDom();

      this.isReady = true;
    });

    if (!this.sourceValueIsValid) {
      salla.logger.warn(`source-value prop is required for source [${this.getSource()}]`);
      return;
    }
    salla.event.on('salla-filters::changed', filters => this.setFilters(filters))


  }

  /**
   * Set parsed filters data from URI
   * @param filters
   */
  @Method()
  async setFilters(filters) {
    if (!!filters && JSON.stringify(this.parsedFilters) === JSON.stringify(filters)) {
      return;
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
    this.parsedFilters = filters;
    return this.reload();
  }

  /**
   * Reload the list of products (entire content of the component).
   */
  @Method()
  async reload() {
    salla.infiniteScroll.destroy(this.infiniteScroll);
    this.buildNextPageUrl();
    // TODO: this is problematic in testing, for the time being it's been resolved like this
    this.wrapper.innerHTML = '';
    this.init();
  }


  private status: HTMLDivElement;
  private btnLoader: HTMLAnchorElement;
  @Element() host: HTMLElement;
  private wrapper: any;
  private infiniteScroll: any;
  /**
   * The source of the products list
   * @type {string}
   * */
  @Prop({
    reflect: true,
    mutable: true
  }) source: 'categories' | 'latest' | 'related' | 'brands' | 'json' | 'search' | 'tags' | 'selected' | 'offers' | 'landing-page' | 'sales';

  /**
   * The source value, cloud be different values as following:
   * - array of ids when `source` in ['categories', 'brands', 'tags', 'selected']
   * - keyword when `source` = 'search'
   * - products payload when `source` = 'json'
   * - product_id when `source` = 'related'
   *
   * @type {string}
   * */
  @Prop({ mutable: true }) sourceValue: any;

  /**
   * Limit for number of products in the list.
   */
  @Prop({ mutable: true }) limit: number;

  /**
   * Sorting the list of products
   */
  @Prop({ mutable: true }) sortBy?: string | 'ourSuggest' | 'bestSell' | 'topRated' | 'priceFromTopToLow' | 'priceFromLowToTop';

  /**
   * should listen to filters events `salla-filters::changed` and re-render
   */
  @Prop({ reflect: true, mutable: true }) filtersResults: boolean;

  /**
   * Horizontal cards
   */
  @Prop({ reflect: true }) horizontalCards: boolean

  @Prop({ reflect: true }) customCardsElementsTag: string

  // State
  @State() page: number = 1;
  @State() nextPage: string;
  @State() hasInfiniteScroll: boolean;
  @State() hasCustomComponent: boolean;
  @State() sourceValueIsValid: boolean;
  @State() placeholderText: string;
  @State() isReady: boolean;
  @State() showPlaceholder: boolean;
  @State() parsedFilters: any;

  /**
   * Custom event fired when the the products fetched.
   */
  @Event() productsFetched: EventEmitter;

  private isFilterable() {
    return salla.config.get('store.settings.product.filters') && this.filtersResults;
  }

  private isSourceWithoutValue() {
    return ['offers', 'latest', 'sales'].includes(this.getSource());
  }

  private animateItems() {
    anime({
      targets: 'salla-products-list salla-product-card',
      opacity: [0, 1],
      duration: 1200,
      translateY: [20, 0],
      delay: function (_el, i) {
        return i * 100;
      },
    })
  }

  private createStatusDom() {
    this.status = document.createElement('div');
    this.status.className = 's-infinite-scroll-wrapper';
    this.status.innerHTML = `<div class="s-infinite-scroll-status">
        <p class="s-infinite-scroll-last infinite-scroll-last s-hidden" >${salla.lang.get('common.elements.end_of_content')}</p>
        <p class="s-infinite-scroll-error infinite-scroll-error s-hidden">${salla.lang.get('common.elements.failed_to_load_more')}</p>
      </div>
      <a href="#" class="s-infinite-scroll-btn s-button-btn">
        <span class="s-button-loader s-button-loader-center s-infinite-scroll-btn-loader" style="display: none"></span>
      </a>`;
    this.btnLoader = this.status.querySelector('.s-button-loader');
    salla.lang.onLoaded(() => {
      this.status.querySelector('.s-infinite-scroll-last').innerHTML = salla.lang.get('common.elements.end_of_content');
      this.status.querySelector('.s-infinite-scroll-error').innerHTML = salla.lang.get('common.elements.failed_to_load_more');
      this.placeholderText = salla.lang.get('pages.categories.no_products');
    });
  }

  private initBaseNextPageUrl(source: string) {

    this.nextPage = salla.url.api(`products?source=${source}`);

    if (this.limit) {
      this.nextPage += `&per_page=${this.limit > 32 ? 32 : this.limit}`;
    }
    if (this.sortBy) {
      this.nextPage += `&sort=${this.sortBy}`;
    }
    // if (!this.isFilterable()) {
    //   return this.nextPage;
    // }
    this.nextPage += '&filterable=1';
    for (const [key, value] of Object.entries(this.parsedFilters || {})) {
      if (["string", "number"].includes(typeof value)) {
        // @ts-ignore
        this.nextPage += `&filters[${encodeURIComponent(key)}]=${encodeURIComponent(value)}`;
      } else if (Array.isArray(value)) {
        value.forEach(item => this.nextPage += `&filters[${encodeURIComponent(key)}][]=${encodeURIComponent(item)}`);
      } else if (typeof value === 'object') {
        for (const [k, v] of Object.entries(value)) {
          this.nextPage += `&filters[${encodeURIComponent(key)}][${encodeURIComponent(k)}]=${encodeURIComponent(v)}`;
        }
      }
    }
  }

  private buildNextPageUrl() {
    let source = this.getSource();
    if (source === 'json') {
      return;
    }
    this.initBaseNextPageUrl(source);
    if (this.isSourceWithoutValue()) {
      return;
    }

    if (['search', 'related', 'landing-page'].includes(source)) {
      this.nextPage += `&source_value=${this.getSourceValue()}`;
      return;
    }

    try {
      this.nextPage += `&source_value[]=${this.getSourceValue().join('&source_value[]=')}`;
    } catch (e) {
      salla.logger.warn(`source-value prop should be array of ids ex source-value="[1,2,3]" for the source [${source}]`);
      this.sourceValueIsValid = false;
    }
  }


  private loading(isLoading = true) {
    this.btnLoader.style.display = isLoading ? 'inherit' : 'none';
  }

  private getItemHTML(product) {
    const customComponentTag = this.hasCustomComponent ? this.customCardsElementsTag : 'salla-product-card';
    const productCard = document.createElement(customComponentTag) as HTMLSallaProductCardElement;
    productCard.product = product;

    this.applyLandingPageStyles(productCard);
    this.applyHorizontalCardStyles(productCard);

    return productCard;
  }

  private applyLandingPageStyles(productCard) {
    if (this.getSource() === 'landing-page' && !this.hasCustomComponent) {
      productCard.toggleAttribute('hide-add-btn', true);
      productCard.classList.add('s-product-card-fit-height');
    }
  }

  private applyHorizontalCardStyles(productCard) {
    if (!this.horizontalCards) {
      return;
    }
    productCard.setAttribute('horizontal', true);
    if (!this.hasCustomComponent) {
      productCard.setAttribute('shadow-on-hover', true);
    }

  }

  private getSource() {
    return Helper.getProductsSource(this.source);
  }

  private getSourceValue() {
    return Helper.getProductsSourceValue(this.source, this.sourceValue);
  }

  private fetchProducts() {
    salla.product.api.fetch({
      source: this.getSource(),
      source_value: this.getSourceValue(),
      limit: this.limit
    })
      .then(res => {
        if (!res.data.length) {
          this.showPlaceholder = true;
          this.loading(false);
          return;
        }
        this.handleResponse(res).forEach(card => this.wrapper.append(card));
      })
  }

  private initiateInfiniteScroll() {
    if (!this.hasInfiniteScroll) {
      return;
    }

    this.host.insertAdjacentElement('beforeend', this.status);
    this.infiniteScroll = salla.infiniteScroll.initiate(this.wrapper, this.wrapper, {
      path: () => this.nextPage,
      history: false,
      nextPage: this.nextPage,
      scrollThreshold: 100,
    }, /* infinite via api*/true);
    this.infiniteScroll?.on('request', () => this.loading())
    this.infiniteScroll?.on('load', response => {
      if (!response.data?.length && this.infiniteScroll.pageIndex == 2) {
        this.showPlaceholder = true;
        salla.infiniteScroll.destroy(this.infiniteScroll);
        this.loading(false);
        return;
      } else {
        this.showPlaceholder = false;

      }
      this.infiniteScroll.appendItems(this.handleResponse(response))
      if (this.infiniteScroll.pageIndex == 2) {
        this.animateItems();
      }
    })
    this.infiniteScroll?.on('error', () => {
      this.status.querySelector('.s-infinite-scroll-error').classList.remove('s-hidden')
      this.loading(false);
    });
    salla.onReady(() => salla.infiniteScroll.loadNextPage(this.infiniteScroll))
  }

  private canRender() {
    return this.sourceValueIsValid && this.isReady;
  }

  render() {
    if (!this.canRender()) {
      return '';
    }
    if (this.showPlaceholder) {
      return <div class="s-products-list-placeholder">
        <span innerHTML={ShoppingBag} />
        <p>{this.placeholderText}</p>
      </div>;
    }
    return (
      <Host class="s-products-list">
        <div class={{
          "s-products-list-wrapper": true,
          's-products-list-horizontal-cards': this.horizontalCards && !this.filtersResults,
          's-products-list-vertical-cards': !this.horizontalCards && !this.filtersResults,
          's-products-list-filters-results': this.filtersResults,
        }}
          ref={wrapper => this.wrapper = wrapper} />
      </Host>
    );
  }

  componentDidLoad() {
    if (!this.canRender()) {
      return;
    }

    // Handle json source
    if (this.getSource() === 'json') {
      if (!this.getSourceValue().length) {
        this.showPlaceholder = true;
        return;
      }
      this.getSourceValue().map(product => this.wrapper.append(this.getItemHTML(product)));
      return;
    }
    // Handle selected source
    if (this.getSource() === 'selected' || this.getSource() === 'landing-page') {
      if (this.getSource() === 'selected' && !this.getSourceValue().length) {
        this.showPlaceholder = true;
        return;
      }
      this.fetchProducts()
      return;
    }
    this.init();
  }

  private init() {
    this.initiateInfiniteScroll();
    this.loading();
  }

  private handleResponse(response): Array<HTMLElement> {
    let source=this.getSource();
    let title = '';
    //help the developer to know the current page title
    if (response.cursor?.current === 1) {
        title = Helper.getPageTitleForSource(source);
        try {
            if (this.getSource() === 'search') {
                title = salla.lang.get('common.elements.search_about', {'word': this.getSourceValue()});
            } else if (!title) {
                let catId = this.parsedFilters.category_id || this.getSourceValue()[0];
                // get the first filter that its key is category_id, then get the value when filter.value.*.key==catId
                title = response.filters.find(filter => filter.key == 'category_id') ?. values ?. find(cat => cat.key == catId) ?. value || '';
            }
            title += (title ? ' - ' : '') + salla.lang.choice('blocks.header.products_count', response.data ?. length);
            if (response.data.length === 20) {
                title = title.replace(response.data.length, salla.lang.get('common.elements.more_than') + ' ' + response.data.length)
            }
            response.title = title;
        } catch (e) {}
    }

    salla.event.emit('salla-products-list::products.fetched', response);
    this.productsFetched.emit(response);
    //💡 when source is related, cursor will not be existed
    if (response.filters && this.isFilterable()) {
      this.filtersResults = true;
      salla.event.emit('filters::fetched', { filters: response.filters });
    } else if (this.isFilterable()) {
      salla.event.emit('filters::hidden');
    }
    this.nextPage = response.cursor ? response.cursor.next : this.nextPage;
    this.loading(false);
    if (this.hasInfiniteScroll && !this.nextPage) {
      this.infiniteScroll.option({ scrollThreshold: false, loadOnScroll: false });
      this.status.querySelector('.s-infinite-scroll-last').classList.remove('s-hidden');
    }
    return response.data?.map(product => this.getItemHTML(product)) || [];
  }
}
