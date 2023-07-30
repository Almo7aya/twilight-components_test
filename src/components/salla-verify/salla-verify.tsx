import { Component, Host, Element, Event, EventEmitter, h, Method, Prop, State } from '@stencil/core';
import AndroidPhoneIcon from '../../assets/svg/android-phone.svg';
import MailIcon from '../../assets/svg/mail.svg';

/**
 * @slot footer - Replaces the footer, by default it contains: verify button, resend, and timer
 * @slot after-footer - placeholder position
 */
@Component({ tag: 'salla-verify', styleUrl: 'salla-verify.css' })

export class SallaVerify {
  constructor() {
    salla.lang.onLoaded(() => {
      this.translationLoaded = true;
      this.title = salla.lang.get('pages.profile.verify_title') + salla.lang.get('common.elements.' + this.type);
      this.modal?.setTitle(this.title);
    });

    if (this.display == 'inline') {
      this.modal = { open: () => '', close: () => '', setTitle: () => '' };
      return;
    }

    //todo:: change this way, now we fire the event from the backend, we should listen to salla.profile.event.onUpdated
    salla.event.on('profile::verification', data => {
      let payload = Array.isArray(data) ? data[0] : data;
      this.isProfileVerify = true;
      this.open(payload);
      this.title = salla.lang.get('pages.profile.verify_title') + salla.lang.get('common.elements.' + payload.type);
      this.modal?.setTitle(this.title);
    });

    salla.event.on('modalClosed', () => {
      this.resendAfter = 0;
      this.timer.innerHTML = '30 : 00';
    });

  }

  private modal: HTMLSallaModalElement | any;
  private body: HTMLDivElement;
  private code: HTMLInputElement;
  private btn: HTMLSallaButtonElement;
  private resendMessage: HTMLParagraphElement;
  private timer: HTMLElement;
  private resend: HTMLAnchorElement;
  private otpInputs: NodeListOf<HTMLInputElement>;
  private firstOtpInput: HTMLInputElement;
  private data: { type: 'mobile' | 'email', phone?: string, country_code?: string, email?: string };

  @State() translationLoaded: boolean = false;

  @Element() host: HTMLElement;
  /**
   * Should render component without modal
   */
  @Prop() display: 'inline' | 'modal' = 'modal';

  /**
   * Verifying method
   */
  @Prop({ mutable: true }) type: 'mobile' | 'email' = 'mobile';
  /**
   * should auto reloading the page after success verification
   */
  @Prop() autoReload: boolean = true;

  /**
   * Once the api verify success, it will be login the customer in web pages
   */
  @Prop() supportWebAuth: boolean = true;

  /**
   * Event when success verification
   */
  @Event() verified: EventEmitter;

  @State() title: string;

  @State() resendAfter: number = 30;
  /**
   * to use: `salla.api.auth.verify` or `salla.profile.verify`
   */
  @State() isProfileVerify: boolean = false;

  private splitNumber(e) {
    let data = e.data || e.target.value; // Chrome doesn't get the e.data, it's always empty, fallback to value then.
    if (!data) return; // Shouldn't happen, just in case.
    if (data.length === 1) return; // Here is a normal behavior, not a paste action.
    this.modifyNext(e.target, data);
  }

  private modifyNext(el, data) {
    el.value = data[0]; // Apply first item to first input
    data = data.substring(1); // remove the first char.
    if (el.nextElementSibling && data.length) {
      // Do the same with the next element and next data
      this.modifyNext(el.nextElementSibling, data);
    }
  };

  private checkAllInputs() {
    let allFilled = true;
    for (let i = 0; i < this.otpInputs.length; i++) {
      if (this.otpInputs[i].value === '') {
        allFilled = false;
      }
    }
    return allFilled;
  }

  private handleKeyUp(ev) {
    if (['Alt', 'Shift', 'Control', 'AltGraph', 'Ctrl'].includes(ev.key)) {
      return;
    }
    let key = ev.keyCode || ev.charCode;
    if (ev.target.value) {
      ev.target.nextElementSibling?.focus();
      ev.target.nextElementSibling?.select();
    } else if ([8, 46].includes(key)) {
      ev.target.previousElementSibling?.focus();
      ev.target.previousElementSibling?.select();
    }
    // If the target is populated to quickly, value length can be > 1
    if (ev.target.value.length > 1) {
      this.splitNumber(ev);
    }
  }

  private handlePaste(ev) {
    let text = salla.helpers.number(ev.clipboardData.getData('text'))
      .replace(/[^0-9.]/g, '')
      .replace('..', '.');
    this.otpInputs.forEach((input, i) => input.value = text[i] || '');
    // this.toggleOTPSubmit();
    setTimeout(() => this.otpInputs[3].focus(), 100);
  }

  private handleInput(ev) {
    salla.helpers.inputDigitsOnly(ev.target)
    // check if all otpInputs has values then send the request
    if (this.checkAllInputs()) {
      setTimeout(() => {
        this.toggleOTPSubmit();
      }, 100);
    }
  }

  private handleFocus(ev) {
    // If the focus element is the first one, do nothing
    if (ev.target === this.firstOtpInput) return;
    // If value of input 1 is empty, focus it.
    if (this.firstOtpInput?.value == '') {
      this.firstOtpInput.focus();
    }
    // If value of a previous input is empty, focus it.
    // To remove if you don't wanna force user respecting the fields order.
    if (ev.target.previousElementSibling.value == '') {
      ev.target.previousElementSibling.focus();
    }
  }

  /**
   * Get current code
   * @return {string}
   */
  @Method()
  async getCode() {
    return this.code.value;
  }

  /**
   * Open verifying modal
   * @param data
   */
  @Method()
  async open(data) {
    this.data = data;
    this.data.type = this.data.type || this.type;
    this.type = this.data.type;
    this.resendTimer();
    this.otpInputs = this.body.querySelectorAll('.s-verify-input');
    this.firstOtpInput = this.body.querySelector('#otp-1');
    this.reset();
    this.display == 'modal' && this.modal?.setTitle(this.title);
    this.modal.open();
    this.firstOtpInput?.addEventListener('input', e => this.splitNumber(e));

    // focus the first input after opening the modal
    setTimeout(() => this.otpInputs[0].focus(), 100);
  }

  private toggleOTPSubmit() {
    let otp = []
    this.otpInputs.forEach(input => input.value && otp.push(input.value));

    this.code.value = otp.join('');

    if (otp.length === 4) {
      this.btn.disable()
      this.btn.click();
      return;
    }

    this.btn.enable()
  }

  private reset() {
    this.otpInputs.forEach((input) => input.value = '');
    this.code.value = '';
    this.otpInputs[0].focus();
  }

  private resendTimer() {
    this.resendMessage.style.display = 'block';
    this.resend.style.display = 'none';
    this.resendAfter = 30;

    let timerId = setInterval(() => {
      if (this.resendAfter <= 0) {
        clearInterval(timerId);
        this.resend.style.display = 'block';
        this.resendMessage.style.display = 'none';
      } else {
        this.timer.innerHTML = `${this.resendAfter >= 10 ? this.resendAfter : '0' + this.resendAfter} : 00`;
        this.resendAfter--;
      }
    }, 1000);
  }

  private resendCode() {
    return this.btn.stop()
      .then(() => this.btn.disable())
      .then(() => {
        this.otpInputs.forEach(input => input.value = '');
        this.otpInputs[0].focus();
      })
      .then(() => salla.api.auth.resend(this.data))
      .finally(() => this.resendTimer());
  }

  private submit() {
    //if code not 4 digits, focus on the after filled input,
    if (this.code.value.length < 4) {
      this.otpInputs[this.code.value.length].focus();
      salla.log('Trying to submit without 4 digits!');
      return;
    }

    let data = { code: this.code.value, ...this.data };

    return this.btn.load()
      .then(() => this.btn.disable())
      .then(() => this.isProfileVerify ? salla.profile.verify(data) : salla.auth.verify(data, this.supportWebAuth))
      .then(response => this.verified.emit(response))
      .then(() => this.btn.stop() && this.btn.disable())
      .then(() => this.modal.close())
      .then(() => this.autoReload && window.location.reload())
      .catch((error) => {
        salla.logger.error(error);
        this.btn.stop() && this.btn.enable() && this.reset()
      });
  }

  render() {
    return this.display == 'inline' ? <Host>{this.myBody()}</Host> :
      <salla-modal width="xs" class="s-verify" ref={modal => this.modal = modal}
        modal-title={this.title}>
        <span slot='icon' class="s-verify-header-icon" innerHTML={this.type == "mobile" ? AndroidPhoneIcon : MailIcon}></span>
        {this.myBody()}
      </salla-modal>;
  }


  private myBody() {
    return (
      <div class="s-verify-body" ref={body => this.body = body}>
        <div class="s-verify-message" innerHTML={salla.lang.get('pages.profile.verify_message')} />
        <slot name="mobile" />
        <slot name="email" />
        <input type="hidden" name="code" maxlength="4" required ref={code => this.code = code} />
        <div class="s-verify-codes" dir="ltr">
          {[1, 2, 3, 4].map((i) => <input type="number" autocomplete="one-time-code" pattern="[0-9]*" inputmode="numeric"
            maxlength="1" value="" id={`otp-${i}`} class="s-verify-input"
            onInput={e => this.handleInput(e)}
            onPaste={e => this.handlePaste(e)}
            onKeyUp={e => this.handleKeyUp(e)}
            onFocus={e => this.handleFocus(e)}
            required />)}
        </div>
        <div slot="footer" class="s-verify-footer">
          <salla-button class="s-verify-submit" loader-position='center' disabled={true}
            onClick={() => this.submit()}
            ref={b => this.btn = b}>
            {salla.lang.get('pages.profile.verify')}
          </salla-button>
          <p class="s-verify-resend-message" ref={el => this.resendMessage = el}>
            {salla.lang.get('blocks.header.resend_after')}
            <b class="s-verify-timer" ref={el => this.timer = el}></b></p>
          <a href="#" class="s-verify-resend" onClick={() => this.resendCode()}
            ref={el => this.resend = el}>{salla.lang.get('blocks.comments.submit')}</a>
        </div>
        <slot name="after-footer" />
      </div>
    );
  }
}
