import {Component, Host, h, State, Prop, Event, Method} from '@stencil/core';
import {Filter, FilterValue} from "../salla-filters/interfaces";

@Component({
  tag: 'salla-price-range',
  styleUrl: 'salla-price-range.css',
})
export class SallaPriceRange {
  /**
   * Minimum price threshold value
   */
  @Prop({mutable: true}) minPrice;

  /**
   * Maximum price threshold value
   */
  @Prop({mutable: true}) maxPrice;

  /**
   * Product price range filter option object instance
   */
  @Prop({reflect: true}) option: Filter;

  /**
   * Currently selected price filter data
   */
  @Prop({reflect: true}) filtersData: any;


  @State() min = 0;
  @State() max = 10000;
  @State() priceOptions: any;
  @State() moreThanLabel: string="أكثر من";
  @State() lessThanLabel: string="أقل من";
  @State() toLabel: string="الى";
  @State() fromLabel: string="من";

  /**
   * Custome event emitted when there is a change in price input.
   */
  @Event() changed: any;

  isReady: Boolean;
  minInput: HTMLInputElement;
  maxInput: HTMLInputElement;
  filterValues: Array<FilterValue> = [];


  connectedCallback() {
    if (this.filtersData && this.filtersData?.price) {
      this.minPrice = this.filtersData.price.min;
      this.maxPrice = this.filtersData.price.max;
    }
    salla.lang.onLoaded(() => {
      this.moreThanLabel=salla.lang.getWithDefault('common.elements.more_than', this.moreThanLabel)
      this.lessThanLabel=salla.lang.getWithDefault('common.elements.less_than', this.lessThanLabel)
      this.toLabel=salla.lang.getWithDefault('common.elements.to', this.toLabel)
      this.fromLabel=salla.lang.getWithDefault('common.elements.from', this.fromLabel)
    })

    //no need to show one option only
    if (this.option.values.length == 1) {
      return;
    }
    //here we may receive too many prices, we will group all inputs to
    if (this.option.values.length <= 5) {
      this.filterValues = this.option.values;
      return;
    }
    const chunkSize = Math.ceil(this.option.values.length / 5);
    for (let i = 0; i < this.option.values.length; i += chunkSize) {
      this.filterValues.push(
        this.option.values
          .slice(i, i + chunkSize)
          .reduce((final: FilterValue, currentValue: FilterValue) => {
            final.to = currentValue.to;
            final.count += currentValue.count;
            return final;
          })
      );
      // do whatever
    }
  }

  /**
   * reset the price range inputs
   */
  @Method()
  async reset() {
    //@ts-ignore
    this.minInput.value = null;
    this.maxInput.value = null;
  }

  private getPriceLabel(filterValue: FilterValue) {
    // @ts-ignore
    if (isNaN(filterValue.from) || filterValue.from < 1) {
      return `${this.lessThanLabel} ${salla.money(filterValue.to)}`;
    }
    // @ts-ignore
    if (isNaN(filterValue.to) || filterValue.to < 1) {
      return `${this.moreThanLabel} ${salla.money(filterValue.from)}`;
    }

    return `${salla.money(filterValue.from)} ${this.toLabel} ${salla.money(filterValue.to)}`;
  }

  private handleMinMaxPrice(event: Event, value: FilterValue): void {

    //todo:: cover when from is star
    this.minPrice = value.from;
    this.maxPrice = value.to != '*' ? value.to : null;

    this.changedEventHandler(event);
  }

  private async changedEventHandler(event, isMin = false) {
    salla.helpers.inputDigitsOnly(event.target)
    let value = event ? event.target.value * 1 : null
    if (isMin) {
      this.minInputValidation(value);
    } else {
      this.maxInputValidation(value)
    }


    this.isReady && this.changed.emit({
      event: event,
      option: this.option,
      value: {max: this.maxPrice, min: this.minPrice}
    })
  }


  minInputValidation(value) {
    if (value && (value > this.max || value > this.maxPrice)) {
      // this.minPrice = this.maxPrice;
      return;
    }

    if (value < this.min) {
      this.minPrice = this.min;
      return;
    }

    if (value) {
      this.minPrice = value;
    }
  }

  maxInputValidation(value) {
    if (value && (value < this.min || value < this.minPrice)) {
      // this.maxPrice = this.minPrice;
      return;
    }
    if (value > this.max) {
      this.maxPrice = this.max;
      return;
    }

    if (value) {
      this.maxPrice = value;
    }
  }

  private isChecked(filterValue: FilterValue) {
    if (!this.minPrice && !this.maxPrice) {
      return false;
    }

    //1 filterValue.from zero or * and this.minPrice not set or zero
    //2 filterValue.from == this.minPrice
    //@ts-ignore
    let isMinEqual = ((filterValue.from < 1 || filterValue.from == '*') && this.minPrice == 0) || filterValue.from == this.minPrice;

    //1 filterValue.to == "*" or null
    //2 filterValue.to == this.max
    let isMaxEqual = filterValue.to == '*' || !filterValue.to || filterValue.to == this.maxPrice;
    return isMinEqual && isMaxEqual;
  }


  render() {
    return (
      <Host>
        {
          this.filterValues.map((filterValue: FilterValue, index: number) => {
            return <label class="s-filters-label" htmlFor={`${this.option.key}-${index}`}>
              <input
                id={`${this.option.key}-${index}`}
                name="price"
                type="radio"
                checked={this.isChecked(filterValue)}
                class="s-filters-radio"
                onChange={e => this.handleMinMaxPrice(e, filterValue)}
              />
              {this.getPriceLabel(filterValue)}
            </label>
          })
        }


        <div class="flex justify-center items-center">
          <div class="relative max-w-xl w-full">
            <div class="s-price-range-inputs">
              <div class="s-price-range-relative">
                <div class="s-price-range-currency"> {salla.config.currency().symbol}</div>
                <input
                  type="number"
                  maxlength="5"
                  ref={el => this.minInput = el}
                  onInput={(event) => this.changedEventHandler(event, true)}
                  value={this.minPrice}
                  placeholder={this.fromLabel}
                  class="s-price-range-number-input"
                />
              </div>

              <div class="s-price-range-gray-text"> -</div>
              <div class="s-price-range-relative">
                <div class="s-price-range-currency"> {salla.config.currency().symbol}</div>
                <input type="number" maxlength="5"
                       placeholder={this.toLabel}
                       ref={el => this.maxInput = el}
                       onInput={(event) => this.changedEventHandler(event)}
                       value={this.maxPrice}
                       class="s-price-range-number-input" aria-describedby="price-currency"/>
              </div>
            </div>
          </div>
        </div>
      </Host>
    );
  }

  componentDidLoad() {
    this.isReady = true;
  }
}
