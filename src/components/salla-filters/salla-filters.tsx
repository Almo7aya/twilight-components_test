import { Component, Element, h, Event, EventEmitter, Host, Method, Prop, State } from '@stencil/core';
import { Filter, FilterOptionInputType, FilterOptionTypes } from "./interfaces";

@Component({
  tag: 'salla-filters',
  styleUrl: 'salla-filters.css',
})
export class SallaFilters {

  constructor() {
    salla.event.on('filters::hidden', () => this.host.style.display = 'none');

    salla.lang.onLoaded(() => {
      this.apply = salla.lang.get('pages.checkout.apply');
      this.reset = salla.lang.get('pages.categories.filters_reset');
    });

    salla.event.on('filters::fetched', ({ filters }) => {
      this.host.style.display = '';
      let freshFilterData = {};
      this.filters = filters
        .map((filter: Filter) => {
          filter.label = {
            category_id: salla.lang.get('common.titles.categories'),
            brand_id: salla.lang.get('common.titles.brands'),
            rating: salla.lang.get('pages.categories.filter_rating'),
            price: salla.lang.get('pages.categories.filter_price'),
          }[filter.key] || filter.label;
          filter.inputType = FilterOptionInputType.RADIO;//todo:: support FilterOptionInputType.CHECKBOX
          if (filter.key == 'rating') {
            filter.inputType = FilterOptionInputType.RADIO;
            //@ts-ignore
            let { max, min } = filter.values;
            //@ts-ignore
            filter.values = [5, 4, 3, 2, 1].filter(stars => stars >= min || stars <= max)
          }

          //when getting new filters, maybe less than we had, so let's get from the old one, only what is existed now.
          if (this.filtersData[filter.key]) {
            freshFilterData[filter.key] = this.filtersData[filter.key];
          }

          return filter;
        });
      this.filtersData = freshFilterData;
      this.host.childNodes.forEach(async (widget: HTMLSallaFiltersWidgetElement) => widget.setWidgetHeight && await widget.setWidgetHeight())
    });
  }

  connectedCallback() {
    try {
      let filters = (new URLSearchParams(window.location.search)).get('filters')
      this.filtersData = filters ? JSON.parse(decodeURIComponent(filters)) : {};
    } catch (e) {
      salla.logger.warn('failed to get filters from url', e.message);
    }
  }

  @Element() host: HTMLElement;

  /**
   * Array of filter options
   */
  @Prop({ reflect: true, mutable: true }) filters?: Filter[];

  private isReady = false;//to avoid triggering the changed event

  @State() isSidebarOpen: boolean;
  @State() filtersData: object|any = {}
  @State() apply: string;
  @State() reset: string;

  /**
   * Custom event fired when the selected filters are changed.
   */
  @Event() changed: EventEmitter;

  /**
   * Method to get filter data.
   */
  @Method()
  async getFilters() {
    return this.filtersData;
  }

  /**
   * Apply filter action.
   */
  @Method()
  async applyFilters() {
    if (!this.isReady) {
      return;
    }
    let hasFilters = Object.keys(this.filtersData).length > 0;
    setTimeout(() => {
      if (hasFilters) {
        window.history.pushState({}, '', salla.url.addParamToUrl('filters', encodeURIComponent(JSON.stringify(this.filtersData))));
      } else {
        let url = new URL(window.location.href);
        url.searchParams?.delete('filters');
        window.history.pushState({}, '', url.toString());
      }
      salla.event.emit('salla-filters::changed', this.filtersData);
      this.changed.emit(this.filtersData);
    }, 300);
  }

  /**
   * Reset selected filters.
   */
  @Method()
  async resetFilters() {
    this.filtersData = {};
    this.host.childNodes.forEach((widget: HTMLSallaFiltersWidgetElement) => widget.reset && widget.reset())
    salla.event.emit('salla-filters::reset');
    return this.applyFilters();
  }


  /**
   * @param {{target:HTMLInputElement}} event
   * @param option
   * @param value
   * @private
   */
  private handleOptionChange(event, option: Filter, value) {
    if (option.type === FilterOptionTypes.RANGE) {
      this.filtersData[option.key] = value;
      return;
    }
    let isChecked = event.target.checked;

    if(option.type === FilterOptionTypes.VARIANTS){
      this.filtersData.variants=this.filtersData.variants||{};
      isChecked && (this.filtersData.variants[option.key] = value);
      isChecked || (delete this.filtersData.variants[option.key]);
      return;
    }

    if (event.target.type == FilterOptionInputType.RADIO) {
      isChecked && (this.filtersData[option.key] = value);
      isChecked || (delete this.filtersData[option.key]);
      return;
    }

    //it's checkbox
    this.filtersData[option.key] = this.filtersData[option.key] || [];
    if (isChecked) {
      this.filtersData[option.key].push(value);
      return;
    }
    this.filtersData[option.key] = this.filtersData[option.key].filter(val => val != value);
  }

  render() {
    return <Host>
      {this.filters?.map(option => <salla-filters-widget
        option={option}
        filtersData={this.filtersData}
        onChanged={({ detail: { event, option, value } }) => this.handleOptionChange(event, option, value)} />)}

      {this.filters?.length? <div class="s-filters-footer">
        <salla-button color='primary' onClick={() => this.applyFilters()}>{this.apply}</salla-button>
        <salla-button color='gray' fill='outline' onClick={() => this.resetFilters()}>{this.reset}</salla-button>
      </div>:''}
    </Host>;
  }

  componentDidLoad() {
    this.isReady = true;
  }
}
