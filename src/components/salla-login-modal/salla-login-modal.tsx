import {Component, Element, h, Listen, Method, Prop, State} from '@stencil/core';
import UserIcon from "../../assets/svg/user.svg";
import PhoneIcon from "../../assets/svg/phone.svg";
import EmailIcon from "../../assets/svg/mail.svg";
import CameraIcon from '../../assets/svg/camera.svg';
import KeyboardArrowRightIcon from "../../assets/svg/keyboard_arrow_right.svg";
import ArrowRightIcon from "../../assets/svg/arrow-right.svg";
import Helper from '../../Helpers/Helper';
import {CustomField, CustomFieldType} from './intefaces';

/**
 * @slot footer - The footer of modal
 * @slot before-login-type - placeholder position
 * @slot after-login-type - placeholder position
 * @slot before-login-mobile - placeholder position
 * @slot after-login-mobile - placeholder position
 * @slot before-login-email - placeholder position
 * @slot after-login-email - placeholder position
 * @slot before-registration - placeholder position
 * @slot after-registration - placeholder position
 */
@Component({
  tag: 'salla-login-modal',
  styleUrl: 'salla-login-modal.css'
})


export class SallaLoginModal {
  constructor() {

    this.title = this.host.title || salla.lang.get('blocks.header.login');
    this.host.removeAttribute('title');

    this.emailErrorMsg = salla.lang.get('common.elements.email_is_valid');
    this.firstNameErrorMsg = salla.lang.get('common.errors.field_required', {attribute: salla.lang.get('pages.profile.first_name')});
    this.lastNameErrorMsg = salla.lang.get('common.errors.field_required', {attribute: salla.lang.get('pages.profile.last_name')});

    salla.lang.onLoaded(() => {
      this.translationLoaded = true;
      this.title = salla.lang.get('blocks.header.login');
      this.dragAndDrop = salla.lang.get('common.uploader.drag_and_drop');
      this.browseFromFiles = salla.lang.get('common.uploader.browse');
      this.updateTranslations();
    });

    salla.event.on('login::open', (event) => this.open(event));
    salla.onReady( () => {
      this.isEmailAllowed = salla.config.get('store.settings.auth.email_allowed', this.isEmailAllowed);
      this.isMobileAllowed = salla.config.get('store.settings.auth.mobile_allowed', this.isMobileAllowed);
      this.isEmailRequired = salla.config.get('store.settings.auth.is_email_required', this.isEmailRequired);
    });
  }

  @Element() host: HTMLElement;
  /**
   * Does the merchant allow to login using email
   */
  @Prop({mutable: true}) isEmailAllowed: boolean ;
  /**
   * Does the merchant/current location for visitor allow to login using mobile, By default outside KSA is `false`
   */
  @Prop({mutable: true}) isMobileAllowed: boolean = true;
  /**
   * Does the merchant require registration with email & mobile
   */
  @Prop({mutable: true}) isEmailRequired: boolean = false;

  /**
   * Once the api verify success, it will be login the customer in web pages
   */
  @Prop({reflect: true}) supportWebAuth: boolean = true;

  private modal: HTMLSallaModalElement;
  private homeTab: HTMLDivElement;
  private mobileTab: HTMLDivElement;
  private emailTab: HTMLDivElement;
  private verifyTab: HTMLSallaVerifyElement;
  private registrationTab: HTMLDivElement;
  private regTelInput: HTMLSallaTelInputElement;
  private regEmail: HTMLInputElement;
  private customFieldsWrapper: HTMLDivElement;
  private loginTelInput: HTMLSallaTelInputElement;
  private loginEmail: HTMLInputElement;
  private firstName: HTMLInputElement;
  private lastName: HTMLInputElement;
  private smsBtn: HTMLSallaButtonElement;
  private emailBtn: HTMLSallaButtonElement;
  private regBtn: HTMLSallaButtonElement;

  @State() currentTabName = 'home'
  @State() regType: 'phone' | 'email' = 'phone';


  @State() translationLoaded: boolean = false;
  @State() currentPhone: string = '';
  @State() currentEmail: string = '';
  @State() title: string;
  @State() emailErrorMsg: string;
  @State() firstNameErrorMsg: string;
  @State() lastNameErrorMsg: string;

  @State() dragAndDrop: string = salla.lang.get('common.uploader.drag_and_drop');
  @State() browseFromFiles: string = salla.lang.get('common.uploader.browse');
  @State() customFields: CustomField[] = [];

  private customFieldsValues: Object = {};
  @State() uploadedImage: string = undefined;

  @Listen('verified', {target: 'window'})
  /**
   * @param {CustomEvent|{details:{case:'new_customer'|'authenticated', redirect_url:string|null}}} event
   */
  onVerified(event) {
    salla.log('verified', event);
    //there is a case when force login is activated & is new user, it will return case inside error key., so cover it.
    let verifyCase = event.detail?.data.case || event.detail?.error.case;
    if (!verifyCase) {
      salla.log('verified but without case!');
      return;
    }

    if (verifyCase === "new_customer") {
      this.customFields = event.detail?.data?.custom_fields || [];
      return this.showTab(this.registrationTab);
    }

    if (!salla.auth.canRedirect()) {
      salla.log('Will not auto redirect or reload, due to `salla.auth.canRedirect()`');
      this.modal.close();
      return;
    }

    if (event.detail.data.redirect_url) {
      return window.location.href = event.detail.data.redirect_url;
    }

    /**
     * we don't want to reload the page if this is not web auth
     * because we'll need the token in the page itself and its there
     * todo :: store the user data in storage for non-web auth and set the config.user from it
     */
    if (this.supportWebAuth) {
      window.location.reload();
    } else {
      this.modal.close();
    }
  }

  updateTranslations() {
    this.emailErrorMsg = salla.lang.get('common.elements.email_is_valid');
    this.firstNameErrorMsg = salla.lang.get('common.errors.field_required', {attribute: salla.lang.get('pages.profile.first_name')});
    this.lastNameErrorMsg = salla.lang.get('common.errors.field_required', {attribute: salla.lang.get('pages.profile.last_name')});
    this.modal?.setTitle(this.title);
  }

  /**
   * Open login component
   */
  @Method()
  // @ts-ignore
  async open(event = null) {
    // todo :: support change the settings from event details
    // if(event && event.hasOwnProperty('isEmailAllowed')){
    //   this.isEmailAllowed = event?.isEmailAllowed;
    // }
    //
    // if(event && event.hasOwnProperty('isMobileAllowed')){
    //   this.isMobileAllowed = event?.isMobileAllowed;
    // }

    if (this.isEmailAllowed && this.isMobileAllowed) {
      this.showTab(this.homeTab);
    } else if (this.isEmailAllowed) {
      this.showTab(this.emailTab);
    } else if (this.isMobileAllowed) {
      this.showTab(this.mobileTab);
    }
    return this.modal.open();
  }

  private showTab(tab, evt?) {
    evt?.preventDefault();
    this.currentTabName = tab.getAttribute('data-name');

    // todo:: use better way for resize the modal
    // setTimeout(() => this.modal.querySelector('.s-login-modal-wrapper')?.setAttribute('style', 'height:' + tab?.scrollHeight + 'px'));

    if ([this.mobileTab, this.emailTab].includes(tab)) {
      this.regType = tab === this.mobileTab ? 'phone' : 'email';
    }

    const input = tab.querySelector('input[type="tel"], input[type="email"]');
    input && setTimeout(() => {
      input.focus();
    }, 100);

    this.modal?.setTitle(this.currentTabName === 'registration' ? salla.lang.get('common.titles.registration') : this.title);

    return this;
  }

  private typing = (e, submitMethod = null) => {
    const error = e.target.nextElementSibling;
    e.target.classList.remove('s-has-error');
    error?.classList.contains('s-login-modal-error-message') && (error.innerText = '');
    //it was sending two requests for send two verification requests
    submitMethod && e.key == 'Enter' && submitMethod();
  }

  private loginBySMS = async (event = null) => {
    event?.preventDefault();
    const {phone, countryCode, countryKey} = await this.loginTelInput.getValues();
    const isPhoneValid = await this.loginTelInput.isValid();
    if (!isPhoneValid) {
      return;
    }
    this.currentPhone = `${countryKey} ${phone}`;
    this.login(this.smsBtn, {type: 'mobile', phone: phone, country_code: countryCode});

    return false;
  }

  private loginByEmail = (event = null) => {
    event?.preventDefault();
    if (!Helper.isValidEmail(this.loginEmail.value)) {
      this.validateField(this.loginEmail, this.emailErrorMsg);
      return;
    }
    this.currentEmail = this.loginEmail.value;
    this.login(this.emailBtn, {type: 'email', email: this.loginEmail.value});
  }

  private login(btn: HTMLSallaButtonElement, data) {
    btn.load()
      .then(() => btn.disable())
      .then(() => salla.auth.api.login(data))
      .then(() => this.showTab(this.verifyTab))
      .then(() => this.verifyTab.open(data))
      .finally(() => btn.stop() && btn.enable());
  }

  private newUser = async () => {
    const {
        phone: regPhone,
        countryCode
      } = this.regType == "email" ? await this.regTelInput.getValues() : await this.loginTelInput.getValues(),
      emailValue = this.regEmail.value || this.loginEmail?.value
    await this.newUserValidation();
    await this.regBtn.load();
    await this.regBtn.disable();

    let data: any = {
      first_name: this.firstName.value,
      last_name: this.lastName.value,
      phone: regPhone || this.loginTelInput.phone,
      country_code: countryCode,
      verified_by: this.regType,
      custom_fields: this.customFieldsValues,
    };
    emailValue && (data = {...data, email: emailValue});
    this.verifyTab.getCode()
      .then(code => salla.auth.api.register({...data, code}))
      .then(() => salla.auth.canRedirect && window.location.reload())
      .catch((error) => {
        salla.logger.error(error);
        this.regBtn.stop() && this.regBtn.enable()
      })
  }

  private async newUserValidation() {
    const isLogByPhone = this.regType == "phone",
      isLogByEmail = this.regType == "email",
      emailValue = this.regEmail.value || (isLogByEmail && this.loginEmail.value),
      isEmailValid = Helper.isValidEmail(emailValue),
      isFirstNameValid = this.firstName.value.length > 0,
      isLastNameValid = this.lastName.value.length > 0,
      isPhoneValid = await this.regTelInput.isValid() || isLogByPhone && await this.loginTelInput.isValid(),
      emailValidation = (emailValue && isEmailValid) || (!emailValue && !this.isEmailRequired);

    // Custom Fields Validation
    var isCustomFieldValid = true;
    //we should make sure that there is text nodes between children
    this.customFieldsWrapper.childNodes
      .forEach((field: HTMLSallaFileUploadElement | HTMLInputElement) => {
        this.customFieldsValues[field.id] = field['value'];
        if (!field.required || this.customFieldsValues[field.id].length) {
          return;
        }
        isCustomFieldValid = false;
        const errorMsg: string = salla.lang.get('common.errors.field_required', {attribute: field.title});
        this.validateField(field, errorMsg)
      });

    if (emailValidation && isPhoneValid && isFirstNameValid && isLastNameValid && isCustomFieldValid) return;
    !isEmailValid && this.validateField(this.regEmail, this.emailErrorMsg);
    !isFirstNameValid && this.validateField(this.firstName, this.firstNameErrorMsg);
    !isLastNameValid && this.validateField(this.lastName, this.lastNameErrorMsg);
    throw 'Please insert required fields';
  }

  private getFilepondPlaceholder() {
    return `<div class="s-login-modal-filepond-placeholder"><span class="s-login-modal-filepond-placeholder-icon">${CameraIcon}</span><p class="s-login-modal-filepond-placeholder-text">${this.dragAndDrop}</p> <span class="filepond--label-action">${this.browseFromFiles}</span></div>`
  }

  // eslint-disable-next-line @stencil/own-methods-must-be-private
  validateField(field: HTMLInputElement | HTMLSallaFileUploadElement, errorMsg: string) {
    field.classList.add('s-has-error');
    field.nextElementSibling['innerText'] = '* ' + errorMsg;
  }

  generateTabClasses(tabName) {
    return {
      's-login-modal-tab': tabName !== 'registration' && tabName !== 'otp',
      "s-hidden": this.currentTabName !== tabName,
      "s-show": this.currentTabName === tabName,
      's-login-modal-unactive': tabName !== 'registration' && tabName !== 'otp' && this.currentTabName !== tabName,
      's-login-modal-active': tabName !== 'registration' && tabName !== 'otp' && this.currentTabName === tabName
    }
  }

  generateRegClasses(regType) {
    return {
      "mb-1.5": true,
      "s-hidden": this.regType === regType
    }
  }

  render() {
    // @ts-ignore
    // @ts-ignore
    return (
      <salla-modal class="s-login-modal" modal-title={this.title} ref={modal => this.modal = modal} width="xs">
        <span slot='icon' class="s-login-modal-header-icon" innerHTML={UserIcon}/>
        <div class="s-login-modal-wrapper">

          {/* Tab 1 (Select Login Type)*/}
          {this.isEmailAllowed && this.isMobileAllowed ?
            <div class={this.generateTabClasses('home')} data-name="home" ref={tab => this.homeTab = tab}>
              <p class="s-login-modal-sub-title">{salla.lang.get('blocks.header.select_login_way')}</p>
              <slot name="before-login-type"/>
              <a href="#" class="s-login-modal-main-btn" onClick={(evt) => this.showTab(this.mobileTab, evt)}>
                <span class="s-login-modal-main-btn-icon" innerHTML={PhoneIcon}/>
                <span class="s-login-modal-main-btn-text">{salla.lang.get('blocks.header.sms')}</span>
                <span class="s-login-modal-main-btn-arrow" innerHTML={KeyboardArrowRightIcon}/>
              </a>
              <a href="#" class="s-login-modal-main-btn" onClick={(evt) => this.showTab(this.emailTab, evt)}>
                <span class="s-login-modal-main-btn-icon" innerHTML={EmailIcon}/>
                <span class="s-login-modal-main-btn-text">{salla.lang.get('common.elements.email')}</span>
                <span class="s-login-modal-main-btn-arrow" innerHTML={KeyboardArrowRightIcon}/>
              </a>
              <slot name="after-login-type"/>
            </div>
            : ''}


          {/* Tab 2 (Login By Mobile)*/}
          {this.isMobileAllowed ?
            <div class={this.generateTabClasses('login-phone')} data-name="login-phone"
                 ref={tab => this.mobileTab = tab}>
              <slot name="before-login-mobile"/>
              <form onSubmit={(event) => this.loginBySMS(event)} method="POST">
                <label class="s-login-modal-label">{salla.lang.get('common.elements.mobile')}</label>
                <salla-tel-input tabindex="0" ref={el => this.loginTelInput = el}
                                 onKeyDown={e => this.typing(e)}></salla-tel-input>
                {/* @ts-ignore */}
                <salla-button class="s-login-modal-enter-button" type="submit" loader-position='center' width="wide" ref={b => this.smsBtn = b}>
                  {salla.lang.get('blocks.header.enter')}
                </salla-button>
              </form>
              {this.isEmailAllowed ?
                <a href="#" onClick={() => this.showTab(this.emailTab)}
                   class="s-login-modal-link">{salla.lang.get('blocks.header.login_by_email')}</a> : ''}
              <slot name="after-login-mobile"/>
            </div> : ''}


          {/* Tab 3 (Login By Email)*/}
          {this.isEmailAllowed ?
            <div class={this.generateTabClasses('login-email')} data-name="login-email"
                 ref={tab => this.emailTab = tab}>
              <slot name="before-login-email"/>
              <label class="s-login-modal-label">{salla.lang.get('common.elements.email')}</label>
              <form onSubmit={() => this.loginByEmail(event)} method="POST">
                <input type="email" ref={el => this.loginEmail = el} onKeyDown={e => this.typing(e)}
                       placeholder="your@email.com"
                       enterkeyhint="next"
                       class="s-login-modal-input s-ltr"/>
                <span class="s-login-modal-error-message"/>
                <salla-button loader-position='center' width="wide" onClick={() => this.loginByEmail()}
                              ref={b => this.emailBtn = b}>{salla.lang.get('blocks.header.enter')}</salla-button>
              </form>
              {this.isMobileAllowed ?
                <a href="#" onClick={() => this.showTab(this.mobileTab)}
                   class="s-login-modal-link">{salla.lang.get('blocks.header.login_by_sms')}</a>
                : ''
              }
              <slot name="after-login-email"/>
            </div> : ''}


          {/* Tab 4 (Verify OTP)*/}
          <salla-verify display="inline" support-web-auth={this.supportWebAuth ? 'true' : 'false'}
                        class={this.generateTabClasses('otp')} data-name="otp" ref={tab => this.verifyTab = tab}
                        autoReload={false}>
            <a onClick={() => this.showTab(this.regType == 'phone' ? this.mobileTab : this.emailTab)}
               class="s-verify-back"
               innerHTML={ArrowRightIcon}
               slot="after-footer"
               href="#"/>
               {this.isMobileAllowed && this.regType == 'phone' ? <div dir="ltr" class="s-login-modal-currentPhone" slot="mobile">{this.currentPhone}</div>:  ''}
                {this.isEmailAllowed && this.regType == 'email' ? <div dir="ltr" class="s-login-modal-currentEmail" slot="email">{this.currentEmail}</div>:  ''}
          </salla-verify>

          {/* Tab 5 (Register New User)*/}
          <div data-name="registration" class={this.generateTabClasses('registration')}
               ref={tab => this.registrationTab = tab}>
            <slot name="before-registration"/>
            <div>
              <label class="s-login-modal-label">{salla.lang.get('blocks.header.your_name')}</label>
              <input type="text" class="s-login-modal-input" ref={el => this.firstName = el}
                     onKeyDown={e => this.typing(e, this.newUser)}
                     placeholder={salla.lang.get('pages.profile.first_name')}/>
              <span class="s-login-modal-error-message"/>
            </div>

            <div>
              <label class="s-login-modal-label">{salla.lang.get('pages.profile.last_name')}</label>
              <input type="text" class="s-login-modal-input" ref={el => this.lastName = el}
                     onKeyDown={e => this.typing(e, this.newUser)}
                     placeholder={salla.lang.get('pages.profile.last_name')}/>
              <span class="s-login-modal-error-message"/>
            </div>

            <div class={this.generateRegClasses('phone')}>
              <label class="s-login-modal-label">{salla.lang.get('common.elements.mobile')}</label>
              <salla-tel-input ref={el => this.regTelInput = el}
                               onKeyDown={e => this.typing(e, this.newUser)}></salla-tel-input>
            </div>

            <div class={this.generateRegClasses('email')}>
              <label class="s-login-modal-label">{salla.lang.get('common.elements.email')}</label>
              <input type="email" ref={el => this.regEmail = el} onKeyDown={e => this.typing(e, this.newUser)}
                     placeholder="your@email.com"
                     class="s-login-modal-input s-ltr"/>
              <span class="s-login-modal-error-message"/>
            </div>
            <div class="s-login-modal-custom-fields" ref={el => this.customFieldsWrapper = el}>{
              this.customFields.map((field: CustomField) => [
                <label class="s-login-modal-label">{field.label}</label>,
                field.type === CustomFieldType.PHOTO
                  ? <salla-file-upload
                    name="image"
                    instant-upload={true}
                    id={`${field.id}`}
                    title={field.label}
                    required={field.required}
                    url={salla.url.get('upload-image')}
                    // onUploaded={}
                    labelIdle={this.getFilepondPlaceholder()}/>
                  : <input
                    onInput={el => field.type == CustomFieldType.NUMBER ? salla.helpers.inputDigitsOnly(el.target) : {}}
                    onKeyDown={e => this.typing(e, this.newUser)}
                    class="s-login-modal-input s-ltr"
                    maxlength={field.length || 1000}//todo:: support it by adding the maxlength or not, not setting static limit
                    placeholder={field.description}
                    required={field.required}
                    title={field.label}
                    id={`${field.id}`}
                    type="text"/>,
                <span class="s-login-modal-error-message"/>
              ])
            }</div>

            <salla-button loader-position='center' width="wide" onClick={() => this.newUser()}
                          ref={b => this.regBtn = b}>{salla.lang.get('blocks.header.register')}</salla-button>
            <slot name="after-registration"/>
          </div>
        </div>
      </salla-modal>
    );
  }
}
