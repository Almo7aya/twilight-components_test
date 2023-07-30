import { Element, Component, Host, h, Prop, Method, Event, EventEmitter, State } from '@stencil/core';
import TelInput from "intl-tel-input";
import { Phone } from './interfaces';

@Component({ tag: 'salla-tel-input', styleUrl: 'salla-tel-input.css' })

export class SallaTelInput {
  constructor() {
    salla.lang.onLoaded(() => {
      this.mobileLabel = salla.lang.get('common.elements.mobile');
      this.countryCodeLabel = salla.lang.get('common.elements.country_code');
      this.invalidNumber = salla.lang.get('common.errors.invalid_value', { attribute: this.mobileLabel });
      this.invalidCountryCode = salla.lang.get('common.errors.invalid_value', { attribute: this.countryCodeLabel });
      this.tooShort = salla.lang.get('common.errors.too_short', { attribute: this.mobileLabel });
      this.tooLong = salla.lang.get('common.errors.too_long', { attribute: this.mobileLabel });
      this.mobileRequired = salla.lang.get('common.errors.field_required', { attribute: this.mobileLabel });
      this.errorMap = [this.invalidNumber, this.invalidCountryCode, this.tooShort, this.tooLong, this.invalidNumber];
    });
  }

  /**
   * Current mobile number
   */
  @Prop({ mutable: true }) phone: string;
  /**
   * input name
   */
  @Prop() name: string = 'phone';
  /**
   * Current country_code
   */
  @Prop({ mutable: true }) countryCode: string = salla.config.get('user.country_code', 'SA') || 'SA';

  /**
   * Event emmitted when user enters a phone number.
   */
  @Event() phoneEntered: EventEmitter<Phone>;


  @Element() host: HTMLElement;
  @State() mobileRequired: string;
  @State() countryCodeLabel: string = salla.lang.get('common.country_code');
  @State() mobileLabel: string = salla.lang.get('common.elements.mobile');
  @State() tooShort: string = salla.lang.get('common.errors.too_short', { attribute: this.mobileLabel });
  @State() tooLong: string = salla.lang.get('common.errors.too_long', { attribute: this.mobileLabel });
  @State() invalidCountryCode: string = salla.lang.get('common.errors.invalid_value', { attribute: this.countryCodeLabel });
  @State() invalidNumber: string = salla.lang.get('common.errors.invalid_value', { attribute: this.mobileLabel });
  @State() errorMap: string[] = [this.invalidNumber, this.invalidCountryCode, this.tooShort, this.tooLong, this.invalidNumber];

  private phoneInput: HTMLInputElement;
  private countryCodeInput: HTMLInputElement;
  private errorMsg: any;
  private iti: any;


  /**
   * Get current values
   * @return {{mobile:number,countryCode:'SA'|string}}
   */
  @Method()
  async getValues() {
    return {
      [this.name]: this.phone = this.phoneInput.value,
      countryCode: this.countryCode = this.countryCodeInput.value,
      countryKey: (this.host.querySelector('.iti__selected-dial-code') as any).innerText
    }
  }

  /**
   * Is current data valid or not
   * @return {boolean}
   */
  @Method()
  async isValid() {
    this.reset();
    if (this.iti.isValidNumber()) return true;

    if (!this.phoneInput.value.trim()) {
      this.phoneInput.classList.add("s-has-error");
      this.errorMsg.innerText = this.mobileRequired || 'The mobile is required';
      return;
    }

    this.phoneInput.classList.add("s-has-error");
    let errorCode = this.iti.getValidationError();
    this.errorMsg.innerText = this.errorMap[errorCode] || '';

    salla.logger.info('Phone number (' + this.countryCode + ' - ' + this.phone + ') is not valid, error code ' + errorCode);
    return false;
  }

  private initTelInput() {
    salla.helpers.inputDigitsOnly(this.phoneInput);
    this.iti = TelInput(this.phoneInput, {
      initialCountry: this.countryCode || 'sa',
      preferredCountries: ['sa', 'ae', 'kw', 'bh', 'qa', 'iq', 'om', 'ye', 'eg', 'jo', 'sy', 'ps', 'sd', 'lb', 'dz', 'tn', 'ma', 'ly'],
      formatOnDisplay: false,
      separateDialCode: true,
      autoPlaceholder: 'aggressive',
      utilsScript: 'https://cdnjs.cloudflare.com/ajax/libs/intl-tel-input/17.0.12/js/utils.min.js',
    });
    this.phoneInput.addEventListener("countrychange", () => {
      let data = this.iti.getSelectedCountryData();
      let value = data.iso2.toUpperCase();
      this.countryCodeInput.value = value
      this.countryCode = value;
      this.phoneEntered.emit({ number: this.phone, country_code: value })
    });

    // on blur: validate
    // this.phoneInput.addEventListener('blur', () => this.isValid());

    // on keyup / change flag: reset
    this.phoneInput.addEventListener('input', (e: Event) => {
      salla.helpers.inputDigitsOnly(e.target);
      this.reset();
      this.phoneEntered.emit({ number: (e.target as HTMLInputElement).value, country_code: this.countryCode })
    });

  }

  private reset() {
    this.phoneInput.classList.remove("s-has-error");
    this.errorMsg.innerHTML = "";
  };

  private handleCountryInput(event) {
    if (!!this.phone) {
      this.phoneEntered.emit({ number: event.target.value, country_code: this.countryCode })
    }
  }


  render() {
    return (
      <Host class="s-tel-input">
        <input type="tel" name={this.name} value={this.phone} onChange={(event) => this.handleCountryInput(event)} ref={el => this.phoneInput = el}
          enterkeyhint="next"
          autocomplete="tel"
          class="s-tel-input-control tel-input s-ltr" />
         <span class="s-tel-input-error-msg" ref={el => this.errorMsg = el}/>
        <input type="hidden" name="country_code" value={this.countryCode} ref={el => this.countryCodeInput = el}
          class="country_code" />
      </Host>
    );
  }

  componentDidLoad() {
    this.initTelInput();
  }
}
