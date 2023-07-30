import { Component, Element, h, Host, Prop, State } from '@stencil/core';
import Helper from '../../Helpers/Helper';
/**
 */
@Component({ tag: 'salla-infinite-scroll', styleUrl: 'salla-infinite-scroll.css' })
export class SallaInfiniteScroll {
  constructor() {
    this.status = document.createElement('div');
    this.status.className = 's-infinite-scroll-wrapper';
    this.status.innerHTML = `<div class="s-infinite-scroll-status" style="display:none">
        <p class="s-infinite-scroll-last infinite-scroll-last"></p>
        <p class="s-infinite-scroll-error infinite-scroll-error"></p>
      </div>
      <a href="${this.nextPage}" class="s-infinite-scroll-btn s-button-btn s-button-primary">
        <span class="s-button-text s-infinite-scroll-btn-text">${this.loadMoreText ? this.loadMoreText : salla.lang.get('common.elements.load_more')}</span>
        <span class="s-button-loader s-button-loader-center s-infinite-scroll-btn-loader" style="display: none"></span>
      </a>`;
    this.btnLoader = this.status.querySelector('.s-button-loader');
    salla.lang.onLoaded(() => {
      this.status.querySelector('.s-button-text').innerHTML = this.loadMoreText ? this.loadMoreText : salla.lang.get('common.elements.load_more');
      this.status.querySelector('.s-infinite-scroll-last').innerHTML = salla.lang.get('common.elements.end_of_content');
      this.status.querySelector('.s-infinite-scroll-error').innerHTML = salla.lang.get('common.elements.failed_to_load_more');
    });
  }


  /**
   * Next Page element
   */
  @Prop() nextPage: string = '';
  /**
   * Is there is need to autoload next page when scroll `next-page-autoload|next-page.autoload`
   */
  @Prop({ mutable: true }) autoload: boolean = false;
  /**
   * Class selector to know the container if it's not the host `<salla-infinite-scroll>`
   */
  @Prop() container: string = 'salla-infinite-scroll';

  /**
   * Load more text
   */
  @Prop() loadMoreText: string;
  /**
   * Class selector to know list items
   */
  @Prop() item: string = 'salla-infinite-scroll > *';
  @State() loadMore: string;
  @State() noMore: string;
  @State() failedToLoad: string;
  private readonly status: HTMLDivElement;
  private btnLoader: HTMLAnchorElement;

  @Element() host: HTMLElement;

  private loading(isLoading = true) {
    let btnText = this.status.querySelector('.s-button-text');
    Helper.toggleElementClassIf(btnText, 's-button-hide', 's-button-show', () => isLoading);
    this.btnLoader.style.display = isLoading ? 'inherit' : 'none';
  }

  render() {
    return this.nextPage.length > 1 ?
      <Host class="s-infinite-scroll-container">
        <slot />
      </Host> : '';
  }

  componentDidLoad() {
    if (this.nextPage.length === 0) {
      return;
    }
    this.host.insertAdjacentElement('afterend', this.status);
    let that = this;
    let infScroll = salla.infiniteScroll.initiate(this.container, {
      history: this.autoload ? 'push' : false,
      scrollThreshold: this.autoload ? 400 : false,
      nextPage: this.nextPage,
      checkLastPage: 'salla-infinite-scroll[next-page*=":"],salla-infinite-scroll[next-page*="."]',
      status: '.s-infinite-scroll-status',
      button: this.status.querySelector('.s-button-btn'),
      append: this.item,
      path: function () {
        return that.nextPage.replace(/page\=(\d)/g, 'page=' + (this.loadCount + 2));
      },
    })
      .on('request', () => this.loading())
      .on('load', () => {
        this.loading(false);

        if (infScroll.pageIndex == 2) {
          infScroll.option({ loadOnScroll: false });
        }

        if (infScroll.pageIndex == 3) {
          infScroll.option({ loadOnScroll: true });
        }
      })
      .on('error', () => this.loading(false));
  }
}
