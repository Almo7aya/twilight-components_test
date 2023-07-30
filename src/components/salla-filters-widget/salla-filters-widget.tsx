import {Component, Host, h, Method, State, Prop, Event, Element} from '@stencil/core';
import Helper from '../../Helpers/Helper';
import {Filter, FilterOptionInputType, FilterOptionTypes} from "../salla-filters/interfaces";

@Component({
  tag: 'salla-filters-widget',
  styleUrl: 'salla-filters-widget.css',
})
export class SallaFiltersWidget {
  @Element() host: HTMLElement;

  /**
   * Show more or less filter options.
   */
  @Prop({mutable: true}) withLoadMore: boolean;

  /**
   * Selected filter options value.
   */
  @Prop({reflect: true}) filtersData: object;

  /**
   * Filter option along with possible values.
   */
  @Prop({reflect: true}) option: Filter;


  priceRange: HTMLSallaPriceRangeElement


  private widgetValues: HTMLElement;
  private widgetContent: HTMLDivElement;
  private initHeight: number = 195;

  @State() isOpen: boolean = true;
  @State() isShowMore: boolean = false;
  @State() showMoreLabel: string="عرض المزيد";
  @State() showLessLabel: string="عرض أقل";

  /**
   * Custom event emitted up on filter option selection changes.
   */
  @Event() changed: any;

  connectedCallback() {
    //lets be smart and don't show 5 and more link for 8 options
    this.withLoadMore = this.option.key!='price' && Array.isArray(this.option.values) && this.option.values.length > 8;
    salla.lang.onLoaded(() => {
      this.showMoreLabel=salla.lang.getWithDefault('common.titles.more', this.showMoreLabel)
      this.showLessLabel=salla.lang.getWithDefault('common.elements.show_less', this.showLessLabel)
    })
  }

  componentDidLoad() {
    this.widgetValues.scrollHeight < this.initHeight && (this.withLoadMore = false);
    (this.withLoadMore && this.widgetValues) && (this.widgetValues.style.maxHeight = `${this.initHeight}px`);
    this.widgetContent.style.height = `${this.widgetContent.scrollHeight}px`;
  }

  @Method()
  async setWidgetHeight(delay = 250) {
    this.widgetContent.removeAttribute('style');
    setTimeout(() => {
      let currentWidgetHeight: number = this.widgetContent.offsetHeight;
      this.widgetContent.style.height = currentWidgetHeight + 'px';
    }, delay)
  }

  /**
   * Reset selected filter options.
   */
  @Method()
  async reset() {
    if (this.option.type === FilterOptionTypes.RANGE) {
      this.priceRange.reset()
    }
    Array.from(this.host.querySelectorAll('input')).forEach(input => input.checked = false);
  }


  /**
   * Action to show more or less filter options.
   */
  @Method()
  async showMore() {
    this.isShowMore = !this.isShowMore
    this.widgetContent.style.height = 'auto';
    this.widgetValues.style.maxHeight = this.isShowMore ? `${this.widgetValues.scrollHeight}px` : `${this.initHeight}px`;
    setTimeout(() => {
      this.widgetContent.style.height = `${this.widgetContent.scrollHeight}px`;
    }, 400); // get height after time of collapse animtion (duration-300)
  }

  /**
   * Action to toggle widget open or closed (expand/ collapse).
   */
  @Method()
  async toggleWidget() {
    this.isOpen = !this.isOpen;
    Helper.toggleElementClassIf(this.widgetContent, 's-filters-widget-opened', 's-filters-widget-closed', () => this.isOpen);
  }

  renderFilterOption(option: Filter) {
    if (![FilterOptionTypes.VALUES, FilterOptionTypes.MINIMUM, FilterOptionTypes.VARIANTS].includes(option.type)) {
      return '';
    }
    //@ts-ignore
    return option.values.map((filterOption, index) => {
        let value = typeof filterOption == 'number' ? filterOption : (filterOption.key || filterOption.value);

        return <label class="s-filters-label" htmlFor={`${option.key}-option-${index}`}>
          <input
            id={`${option.key}-option-${index}`}
            name={option.key}
            type={option.inputType}
            //TODO:: debug more why sometimes it's not rendered as selected🤨
            checked={this.isSelectedOption(option, value)}
            class={`s-filters-${option.inputType}`}
            onChange={e => this.changed.emit({event: e, option: option, value: value})}
          />
          {this.getOptionLabel(option, filterOption)}
        </label>
      }
    )
  }

  private isSelectedOption(option: Filter, value) {
    if (!this.filtersData || !this.filtersData[option.key]) {
      return false
    }

    return option.inputType === FilterOptionInputType.CHECKBOX
      ? this.filtersData[option.key].includes(value)
      : this.filtersData[option.key] == value;
  }

  private getOptionLabel(option: Filter, filterOption) {
    if (option.key == 'rating') {
      //in amazon has stars & up, should we add it, to avoid those people who will come to say I selected 4 why I see 5 sars products
      return <salla-rating-stars size="small" value={filterOption}/>;
    }
    let label = filterOption.value || 'null';
    //label+=filterOption.count ? ` (${salla.helpers.number(filterOption.count)})` : '';
    return <span class="s-filters-option-name">{label}</span>;
  }

  render() {
    return (
      <Host class="s-filters-widget-container">
        <h3 class="s-filters-widget-title" onClick={() => this.toggleWidget()}>
          <span>{this.option.label}</span>
          <span class={`s-filters-widget-plusminus ${this.isOpen ? 's-filters-widget-plusminus-active' : ''}`}/>
        </h3>
        <div class="s-filters-widget-content" ref={(el) => this.widgetContent = el}>
          <div class="s-filters-widget-values" ref={(el) => this.widgetValues = el}>
            <slot/>
            {
              this.option.type !== FilterOptionTypes.RANGE
                ? this.renderFilterOption(this.option)
                : <salla-price-range onChanged={(event) => this.changed.emit(event.detail)}
                                     ref={price => this.priceRange = price}
                                     filtersData={this.filtersData}
                                     option={this.option}/>
            }
          </div>
          {this.withLoadMore &&
          <a class="s-filters-widget-more"
             onClick={() => this.showMore()}>{!this.isShowMore ?this.showMoreLabel : this.showLessLabel}</a>
          }
        </div>
      </Host>
    );
  }

}
