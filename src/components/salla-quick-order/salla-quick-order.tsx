import {Component, Host, h, Prop, State, Event, EventEmitter, Element} from '@stencil/core';
import CelebrationIcon from '../../assets/svg/party-horn.svg';
import PortraitIcon from '../../assets/svg/portrait.svg';
import IphoneXIcon from '../../assets/svg/iphone-x.svg';
import MailIcon from '../../assets/svg/mail.svg';
import {CartRequest, QuickOrderSetting} from '@salla.sa/twilight/types/api/cart';
import quickOrderPayload = CartRequest.quickOrderPayload;
import CancelIcon from '../../assets/svg/cancel.svg';

@Component({
  tag: 'salla-quick-order',
  styleUrl: 'salla-quick-order.css',
})
export class SallaQuickOrder {

  @Element() host: HTMLElement;


  // modal refs
  private agreementModal: HTMLSallaModalElement;

  // input refs
  private nameInput: HTMLInputElement;
  private emailInput: HTMLInputElement;
  private phoneInput: HTMLSallaTelInputElement;
  private termsInput: HTMLInputElement;
  private submitBtn: HTMLSallaButtonElement;

  /**
   * quick order title
   */
  @Prop({mutable: true}) quickOrderTitle: string = 'ليش تنتظر؟';
  /**
   * quick order sub title
   */
  @Prop({mutable: true}) subTitle: string = 'احصل على المنتج مباشرة الآن';
  /**
   * quick order pay button text
   */
  @Prop({mutable: true}) payButtonTitle: string = 'اطلب المنتج';
  /**
   * quick order confirm pay button text
   */
  @Prop({mutable: true}) confirmPayButtonTitle: string = 'اشتر الآن';
  /**
   * agreement text from server or from props
   */
  @Prop({mutable: true}) agreementText: string = salla.lang.get(
    'pages.checkout.show_full_agreement'
  );
  /**
   * is email required
   */
  @Prop({mutable: true}) isEmailRequired: boolean = false;
  /**
   * product id local or from page
   */
  @Prop({mutable: true}) productId: string;

  /**
   * product id local or from page
   */
  @Prop({mutable: true}) thanksMessage: string;

  /**
   * Quick Order Style
   */
  @Prop({mutable: true}) quickOrderStyle: 'gray' | 'white' | 'default' = 'default';

  /*
   * states
   */

  @State() user: any;
  @State() isAvailable: boolean = false;
  @State() oneClick: boolean = false;
  @State() expanded: boolean = false;
  @State() isTermsRequired: boolean = false;
  @State() countryCode: string = salla.config.get('user.country_code', 'SA') || 'SA';
  @State() submitSucess: boolean = false;
  //Langugae states
  @State() placeHolderEmail: string = salla.lang.get('common.elements.email');
  @State() emailOptional: string = salla.lang.get('common.elements.optional');
  @State() agreementShowText: string = salla.lang.get('pages.checkout.show_full_agreement');
  @State() agreementModalHead: string = salla.lang.get('pages.checkout.full_agreement');
  @State() userNameLabel: string = salla.lang.get('pages.products.your_name');
  @State() termsChecked: boolean = false;

  /**
   * Custome DOM event emitter when order gets submitted successfully.
   */
  @Event() quickOrderSubmited: EventEmitter;

  constructor() {
    salla.onReady(() => {
      this.productId = this.productId || salla.config.get('page.id');
    })

    salla.lang.onLoaded(() => {
      this.placeHolderEmail = salla.lang.get('common.elements.email');
      this.emailOptional = salla.lang.get('common.elements.optional');
      this.agreementShowText = salla.lang.get('pages.checkout.show_full_agreement');
      this.agreementModalHead = salla.lang.get('pages.checkout.full_agreement');
      this.userNameLabel = salla.lang.get('pages.products.your_name');
    });
  }

  private getBtnColor() {
    return this.quickOrderStyle === 'default' ? 'light' : 'primary';
  }

  private getErrorMessage(type, name) {
    return name == 'terms'
      ? salla.lang.get('pages.checkout.check_agreement')
      : salla.lang.get(`common.errors.${type}`, {attribute: name == 'name' ? this.userNameLabel : this.placeHolderEmail});
  }

  private handleInvalidInput(e) {
    let input = e.target;
    let validity = input.validity;
    let errorMessage;
    if (validity.valueMissing) {
      errorMessage = this.getErrorMessage('field_required', input.name);
      console.log(this.getErrorMessage('field_required', input.name));
    } else if (validity.typeMismatch) {
      errorMessage = this.getErrorMessage('invalid_value', input.name);
    }
    input.setCustomValidity(errorMessage);
  }


  private async setWrapperHeight() {
    let expandable: HTMLElement = this.host.querySelector('.s-quick-order-expandable') as HTMLElement;
    setTimeout(() => {
      if (expandable.style.maxHeight || this.oneClick) {
        expandable.style.maxHeight = null;
      } else {
        expandable.style.maxHeight = expandable.scrollHeight + "px";
      }
    }, 50);
  }

  private getDarkOrLight() {
    return this.quickOrderStyle === 'default' && salla.config.get('theme.color.is_dark') ? 'dark' : 'light';
  }

  private getStyleColor() {
    return {
      gray: '#f3f3f3',
      white: '#ffffff',
      default: salla.config.get('theme.color.primary'),
    }[this.quickOrderStyle] || '#f3f3f3';
  }

  async submit(e, checkOneClick: boolean = false) {
    e.preventDefault();
    if (checkOneClick && !this.oneClick) {
      this.expanded = !this.expanded;
      this.setWrapperHeight();
      return;
    }

    return this.submitBtn.load()
      .then(() => this.getPayload())
      .then((payload: quickOrderPayload) => salla.api.cart.createQuickOrder(payload))
      .then(() => {
        setTimeout(() => {
          this.submitBtn.stop();
          this.submitSucess = true;
          this.quickOrderSubmited.emit();
        }, 200);
      })
      .catch(error => error && (console.error(error), this.submitBtn.stop()));
  }

  private async getPayload(): Promise<CartRequest.quickOrderPayload | Object | false> {
    if (this.oneClick) {
      return {
        product_ids: [this.productId],
        agreement: true,
      };
    }

    return {
      product_ids: [this.productId],
      email: this.emailInput?.value,
      phone: Number((await this.phoneInput?.getValues())?.phone),
      country_code: (await this.phoneInput?.getValues())?.countryCode || this.countryCode,
      name: this.nameInput?.value,
      agreement: this.termsChecked,
    };
  }

  formatAgreementText(agreement_text, length = 150) {
    if (!agreement_text) return '';
    if (agreement_text.length <= length) return agreement_text;
    const parsedToDOM = new DOMParser().parseFromString(agreement_text, 'text/html');
    return parsedToDOM.documentElement.innerText.substring(0, length) + '...';
  }

  private loadQuickOrderSettings() {
    let data = salla.config.get('store.settings.product.quick_order');
    if (!data) {
      return Promise.resolve();
    }

    this.user = salla.config.get('user') || salla.storage.get('user') || {};
    this.countryCode = this.user?.country_code || this.countryCode;
    // make email required if user is gust or is required from server
    this.isEmailRequired = this.user?.email ? false : this.isEmailRequired;
    // check if one click is available
    this.oneClick = this.user?.email;
    this.initComponentData(data);
    return Promise.resolve();

    // return salla.api.withoutNotifier(() => salla.api.cart.getQuickOrderSettings().then(res => this.initComponentData(res.data)));
  }

  private initComponentData(data: QuickOrderSetting) {
    this.quickOrderTitle = data.title;
    this.subTitle = data.sub_title;
    this.payButtonTitle = data.order_now_button;
    this.isEmailRequired = data.is_email_required;
    this.isTermsRequired = data.show_agreement;
    this.agreementText = data.agreement;
    this.confirmPayButtonTitle = data.confirm_button;
    this.thanksMessage = data.thanks_message;
    this.quickOrderStyle = data.style;
    this.isAvailable = true;
    // toggle oneClick if true
    this.oneClick = this.oneClick && !this.isTermsRequired
  }

  componentWillLoad() {
    return new Promise(resolve => salla.onReady(() => this.loadQuickOrderSettings().then(resolve)))
  }

  render() {
    if (!this.isAvailable) {
      return;
    }
    if (this.submitSucess) {
      return (
        <Host class="s-quick-order">
          <div class={'s-quick-order-confirm'} style={{
            backgroundColor: salla.config.get('theme.color.primary') + '10',
            borderColor: salla.config.get('theme.color.primary') + '10',
            color: salla.config.get('theme.color.primary')
          }}>
            <i innerHTML={CelebrationIcon}/>
            <span>{this.thanksMessage}</span>
          </div>
        </Host>
      );
    }
    return (
      <Host class={`s-quick-order s-quick-order-${this.getDarkOrLight()}`}>
        <div class={`s-quick-order-container s-quick-order-${this.quickOrderStyle}`}
             style={{backgroundColor: this.getStyleColor()}}>
          <div class="s-quick-order-button-cont">
            {/*todo:: if we can remove this dom, lets do it*/}
            <div>
              <h3>{this.quickOrderTitle}</h3>
              <p>{this.subTitle}</p>
            </div>

            <salla-button class={this.expanded ? "s-quick-order-btn-close" : ""} onClick={(e) => this.submit(e, true)}
                          color={this.getBtnColor()}>
              {this.oneClick
                ? this.confirmPayButtonTitle : this.expanded ? <i innerHTML={CancelIcon}/> : this.confirmPayButtonTitle}
            </salla-button>
          </div>
          <form onSubmit={(e) => this.submit(e)}
                class={'s-quick-order-expandable ' + (this.expanded ? 's-quick-order-shown' : '')}>
            {/*we don't need to show name & phone & email unless it's guest*/}
            {Salla.config.isGuest() &&
            [
              <div class="s-form-group">
                <span innerHTML={PortraitIcon}/>
                <input type="text"
                       required
                       class="s-form-control s-quick-order-phone-field"
                       name='name'
                       placeholder={this.userNameLabel}
                       ref={el => (this.nameInput = el)}
                />
              </div>
              ,
              <div class="s-quick-order-flex-input">
                <div class="s-form-group">
                  <span innerHTML={IphoneXIcon}/>
                  <salla-tel-input ref={el => (this.phoneInput = el)}/>
                </div>
                <div class="s-form-group">
                  <span innerHTML={MailIcon}/>
                  <input type="email"
                         class="s-form-control s-quick-order-email-field"
                         name='email'
                         required={this.isEmailRequired}
                         placeholder={this.placeHolderEmail + ' ' + (this.isEmailRequired ? '' : this.emailOptional)}
                         ref={el => (this.emailInput = el)}
                  />
                </div>
              </div>,
            ]
            }
            {this.isTermsRequired && (
              <label htmlFor="terms" class="s-quick-order-terms">
                <input type="checkbox" required name='terms' id='terms' ref={el => (this.termsInput = el)}
                       onChange={() => (this.termsChecked = this.termsInput.checked)} class="s-checkbox"/>
                <span class="s-form-label"> <div innerHTML={this.formatAgreementText(this.agreementText, 150)}>
                  {this.agreementText.length > 150 && (
                    <salla-button shape="link" onClick={() => this.agreementModal.open()}>
                      {this.agreementShowText}
                    </salla-button>
                  )}
                </div> </span>
              </label>
            )}
            {/* @ts-ignore */}
            <salla-button type="submit" color={this.getBtnColor()} width="wide" ref={el => (this.submitBtn = el)}>
              {this.payButtonTitle}
            </salla-button>
          </form>
          <salla-modal modal-title={this.agreementModalHead} ref={modal => (this.agreementModal = modal)}>
            <article innerHTML={this.agreementText}/>
          </salla-modal>
        </div>
      </Host>
    );
  }

  componentDidLoad() {
    this.host.querySelectorAll('input').forEach(input => {
      input.addEventListener('invalid', e => {
        this.handleInvalidInput(e);
      });
      input.addEventListener('input', () => {
          input.setCustomValidity('');
          input.reportValidity();
        }
      );
    });
  }
}
