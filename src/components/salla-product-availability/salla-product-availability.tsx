import {Component, Element, Host, Prop, State, Watch, h} from '@stencil/core';
import BellRingIcon from '../../assets/svg/bell-ring.svg';
import Helper from '../../Helpers/Helper';

@Component({tag: 'salla-product-availability', styleUrl: 'salla-product-availability.css'})

export class SallaProductAvailability {
  constructor() {
    salla.lang.onLoaded(() => {
      this.translationLoaded = true;
      this.title_ = this.host.title || salla.lang.get('pages.products.notify_availability_title');
      this.modal?.setTitle(this.title_);
    });
    if (!this.productId) {
      this.productId = salla.config.get('page.id');
    }

    if (this.isUser) return;

    this.channelsWatcher(this.channels);
    this.title_ = this.host.title || salla.lang.get('pages.products.notify_availability_title');
    this.host.removeAttribute('title');

    //todo:: fix this to cover options too
    this.isVisitorSubscribed = !this.notifyOptionsAvailability ? salla.storage.get(`product-${this.productId}-subscribed`) : '';
  }


  private isUser: boolean = salla.config.isUser();
  private modal: HTMLSallaModalElement;
  private channels_: Array<string>;
  private email: HTMLInputElement;
  private btn: HTMLSallaButtonElement;
  private mobileInput: HTMLSallaTelInputElement;

  @Element() host: HTMLElement;

  @State() translationLoaded: boolean = false;
  @State() title_: string;
  @State() isVisitorSubscribed: string;


  /**
   * Notification channels
   */
  @Prop() channels: 'sms' | 'email' | 'sms,email';

  /**
   * Listen to product options availability.
   */
  @Prop() notifyOptionsAvailability: boolean = false;

  /**
   * product id that can visitor subscribe to its availability notification
   */
  @Prop() productId: number;
  /**
   * is current user already subscribed
   */
  @Prop({mutable: true}) isSubscribed: boolean = false;


  @Watch('channels')
  channelsWatcher(newValue) {
    this.channels_ = !!newValue ? newValue.split(',') : [];
  }

  private handleSubmitOptions = async () => {
    let payload: any = {id: this.productId};
    if (!this.notifyOptionsAvailability) {
      return payload;
    }
    let optionsElement: HTMLSallaProductOptionsElement = document.querySelector(`salla-product-options[product-id="${this.productId}"]`);
    let options: Array<any> = Object.values(await optionsElement?.getSelectedOptionsData() || {});
    //if all options not selected, show message && throw exception
    if (options.length && !await optionsElement?.reportValidity()) {
      let errorMessage = salla.lang.get('common.messages.required_fields');
      salla.error(errorMessage);
      throw errorMessage;
    }

    payload.options = [];
    options.forEach(option => {
      //inject numbers only, without zeros
      if (option && !isNaN(option)) {
        payload.options.push(Number(option));
      }
    })
    return payload;
  }

  private openModel() {
    this.handleSubmitOptions().then(isSuccess => isSuccess ? this.modal.open() : null)
  }

  private async submit() {
    let payload: any = await this.handleSubmitOptions();

    if (this.isUser) {
      return salla.api.product.availabilitySubscribe(payload)
        .then(() => this.isSubscribed = true);
    }

    if (this.channels_.includes('sms')) {
      let {phone, countryCode} = await this.mobileInput.getValues();
      payload['country_code'] = countryCode;
      payload['phone'] = phone;
    }

    if (this.channels_.includes('email')) {
      this.email.value !== '' && (payload['email'] = this.email.value);
    }

    await this.validateform();

    return this.btn.load()
      .then(() => this.btn.disable())
      .then(() => salla.api.product.availabilitySubscribe(payload))
      .then(() => {
        if (!this.notifyOptionsAvailability) {
          salla.storage.set(`product-${this.productId}-subscribed`, true);
          this.isSubscribed = true;
          return;
        }
        if (payload.options.length) {
          let options = salla.storage.get(`product-${this.productId}-subscribed-options`) || [];
          let selectedOptionsString = payload.options.join(',');
          if (!options.includes(selectedOptionsString)) {
            options.push(selectedOptionsString);
            salla.storage.set(`product-${this.productId}-subscribed-options`, options);
            this.isSubscribed = true;
          } else {
            salla.log('already subscribed to this options');
          }
        }
      })
      .then(() => this.btn.stop())
      .then(() => this.modal.close())
      .catch(() => this.btn.stop() && this.btn.enable());
  }

  private async validateform() {
    try {
      if (this.channels_.includes('email')) {
        const isEmailValid = Helper.isValidEmail(this.email.value);
        if (isEmailValid) return;
        !isEmailValid && this.validateField(this.email, salla.lang.get('common.elements.email_is_valid'));
      }
      if (this.channels_.includes('sms')) {
        const isPhoneValid = await this.mobileInput.isValid();
        if (isPhoneValid) return;
      }
    } catch (error) {
      throw ('Please insert required fields');
    }
  }


  // helpers
  private typing = (e) => {
    const error = e.target.nextElementSibling;
    e.target.classList.remove('s-has-error');
    error?.classList.contains('s-product-availability-error-msg') && (error.innerText = '');
    e.keyCode === 13 && this.submit();
  }

  validateField(field: HTMLInputElement, errorMsg: string) {
    field.classList.add('s-has-error');
    field.nextElementSibling['innerText'] = '* ' + errorMsg;
  }

  render() {
    return (
      <Host class="s-product-availability-wrap">{this.isSubscribed || this.isVisitorSubscribed
        ? <div class="s-product-availability-subscribed">
          <span innerHTML={BellRingIcon} class="s-product-availability-subs-icon"/>
          {salla.lang.get('pages.products.notify_availability_success')}
        </div>
        :
        <salla-button width="wide" onClick={() => this.isUser ? this.submit() : this.openModel()}>
          {salla.lang.get('pages.products.notify_availability')}
        </salla-button>

      }
        {this.isUser || this.isSubscribed || this.isVisitorSubscribed ? '' : this.renderModal()}
      </Host>
    );
  }

  private renderModal() {
    return (
      <salla-modal ref={modal => this.modal = modal} modal-title={this.title_}
                   subTitle={salla.lang.get('pages.products.notify_availability_subtitle')} width="sm">
        <span slot='icon' class="s-product-availability-header-icon" innerHTML={BellRingIcon}/>
        <div class="s-product-availability-body">
          {this.channels_.includes('email') ? [
            <label class="s-product-availability-label">{salla.lang.get('common.elements.email')}</label>,
            <input class="s-product-availability-input" onKeyDown={e => this.typing(e)}
            placeholder={salla.lang.get('common.elements.email_placeholder') || 'your@email.com'}
            ref={el => this.email = el}
            type="email" />,
            <span class="s-product-availability-error-msg"/>
          ] : ''}

          {this.channels_.includes('sms') ? [
            <label class="s-product-availability-label">{salla.lang.get('common.elements.mobile')}</label>,
            <salla-tel-input ref={el => this.mobileInput = el} onKeyDown={e => this.typing(e)} />
          ] : ''}
        </div>
        <div slot="footer" class="s-product-availability-footer">
          <salla-button class="modal-cancel-btn" width="wide" color="light" fill="outline"
                        onClick={() => this.modal.close()}>
            {salla.lang.get('common.elements.cancel')}
          </salla-button>
          <salla-button class="submit-btn" loader-position='center' width="wide" ref={btn => this.btn = btn}
                        onClick={() => this.submit()}>{salla.lang.get('common.elements.submit')}</salla-button>
        </div>
      </salla-modal>);
  }
}
