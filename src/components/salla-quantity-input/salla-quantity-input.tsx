import { Component, Element, Host, State, Watch, h, Method , Prop } from '@stencil/core';
import Add from "../../assets/svg/add.svg";
import Minus from "../../assets/svg/minus.svg";
import Helper from '../../Helpers/Helper';

@Component({
  tag: 'salla-quantity-input',
  styleUrl: 'salla-quantity-input.css'
})
export class SallaQuantityInput {

  @Element() host: HTMLElement;

   /**
   * Cart Item Id
   */
  @Prop() cartItemId;

  private hostAttributes: any = {};
  private hasIncrementSlot: boolean = false;
  private hasDecrementSlot: boolean = false;
  private textInput: any;

  private didLoaded: boolean = false;

  @State() quantity: number = 1;
  @State() fireChangeEvent: boolean = true;

  /**
   * Workaround to fire change event for the input.
   */
  @Watch('quantity')
  watchPropHandler() {
    if (!this.didLoaded) {
      return;
    }

    if (!this.fireChangeEvent) {
      this.fireChangeEvent = true;
      return;
    }

    Helper.debounce(() => salla.document.event.fireEvent(this.textInput, 'change', { 'bubbles': true }));
  }

  componentWillLoad() {
    this.quantity = parseInt(this.host.getAttribute('value')) || 1;
    this.hasIncrementSlot = !!this.host.querySelector('[slot="increment-button"]');
    this.hasDecrementSlot = !!this.host.querySelector('[slot="decrement-button"]');
  }

  componentDidLoad() {
    this.didLoaded = true;
    this.textInput.addEventListener('input', (event) => salla.helpers.inputDigitsOnly(event.target));
    // handle quantity update from cart if exceeded the max quantity and cartItemId is provided
    this.cartItemId && salla.cart.event.onItemUpdatedFailed((data, itemId) => {
      if (!data.response?.data?.error?.fields?.quantity) { return }
      if (this.cartItemId != itemId) { return }
      return this.setValue(this.host.getAttribute('value'), false);
    })
  }

  private getInputAttributes() {
    for (let i = 0; i < this.host.attributes.length; i++) {
      if (!['id', 'value', 'min', 'class'].includes(this.host.attributes[i].name)) {
        this.hostAttributes[this.host.attributes[i].name] = this.host.attributes[i].value;
      }
    }

    return this.hostAttributes;
  }

  /**
   * decrease quantity by one.
   * @return HTMLSallaQuantityInputElement
   */
  @Method()
  async decrease() {
    return this.setValue(this.quantity - 1);
  }

  /**
   * increase quantity by one.
   * @return HTMLSallaQuantityInputElement
   */
  @Method()
  async increase() {
    return this.setValue(Number(this.quantity) + 1);
  }

  /**
   * set quantity by one.
   * @return HTMLSallaQuantityInputElement
   */
  @Method()
  async setValue(value, fireChangeEvent = true) {
    this.fireChangeEvent = fireChangeEvent;
    let maxQuantity = parseInt(this.host.getAttribute('max'));
    if (maxQuantity && value > maxQuantity) {
      value = maxQuantity;
    }
    if (value <= 1) {
      value = 1;
    }
    this.quantity = value;
    return this.host;
  }

  render() {
    return (
      <Host class="s-quantity-input">
        <div class="s-quantity-input-container">
          <button onClick={() => this.increase()} class="s-quantity-input-increase-button s-quantity-input-button" type="button">
            {!this.hasIncrementSlot ? <span innerHTML={Add}></span> : ''}
            <slot name="increment-button" />
          </button>
          <input class="s-quantity-input-input" {...this.getInputAttributes()}
            ref={(el) => this.textInput = el as HTMLInputElement}
            onInput={(event: any) => this.setValue(event.target.value)}
            min="1"
            value={this.quantity} />
          <button class="s-quantity-input-decrease-button s-quantity-input-button" onClick={() => this.decrease()} type="button">
            {!this.hasDecrementSlot ? <span innerHTML={Minus}></span> : ''}
            <slot name="decrement-button" />
          </button>
        </div>
      </Host>
    );
  }
}
