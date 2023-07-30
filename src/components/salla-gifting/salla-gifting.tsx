import anime from 'animejs';
import {GiftResponse, GiftImage, GiftText} from './gift-schema'
import {Component, h, Prop, State, Method} from '@stencil/core';
import Images from '../../assets/svg/images.svg';
import LeftArrow from '../../assets/svg/arrow-left.svg';
import Cancel from '../../assets/svg/cancel.svg';
import GiftSharing from '../../assets/svg/gift-sharing.svg';
import {GiftToCardDTO, Phone} from './intefaces';

/**
 * @slot widget-btn-content - Used to customize widget button content.
 */
@Component({
  tag: 'salla-gifting',
  styleUrl: 'salla-gifting.css',
})
export class SallaGifting {
  constructor() {
    salla.lang.onLoaded(() => {
      this.selectImageOrUpload = salla.lang.get('blocks.buy_as_gift.select_image_or_upload');
      this.selectImageForYourGift = salla.lang.get('blocks.buy_as_gift.select_image_for_your_gift');
      this.sectionTitle = salla.lang.get('blocks.buy_as_gift.gift_the_one_you_love');
      this.sectionSubtitle = salla.lang.get('blocks.buy_as_gift.gift_the_one_you_love_message')
      this.sectionBtnText = salla.lang.get('blocks.buy_as_gift.send_as_a_gift');
      this.giftDetails = salla.lang.get('blocks.buy_as_gift.gift_details');
      this.selectGiftMessage = salla.lang.get('blocks.buy_as_gift.select_gift_message');
      this.giftCustomText = salla.lang.get('blocks.buy_as_gift.gift_custom_text');
      this.textId = salla.lang.get('blocks.buy_as_gift.text_id');
      this.incorrectGiftText = salla.lang.get('blocks.buy_as_gift.incorrect_gift_text');
      this.nextStep = salla.lang.get('blocks.buy_as_gift.next_step');
      this.senderNameLabel = salla.lang.get('blocks.buy_as_gift.sender_name');
      this.receiverNameFieldLabel = salla.lang.get('blocks.buy_as_gift.receiver_name');
      this.receiverMobileFieldLabel = salla.lang.get('blocks.buy_as_gift.receiver_mobile');
      this.receiverEmailFieldLabel = salla.lang.get('blocks.buy_as_gift.receiver_email');
      this.emailPlaceholder = salla.lang.get('common.elements.email_placeholder');
      this.sendLater = salla.lang.get('blocks.buy_as_gift.send_later');
      this.selectSendDateAndTime = salla.lang.get('blocks.buy_as_gift.select_send_date_and_time');
      this.canNotEditOrderAfterSelectDate = salla.lang.get('blocks.buy_as_gift.can_not_edit_order_after_select_date');
      this.sendGift = salla.lang.get('blocks.buy_as_gift.send_gift');
      this.donationRequired = salla.lang.get('pages.products.donation_amount_required');
      this.currentLang = salla.lang.locale
    });
  }

  private modal: HTMLSallaModalElement;
  private uploader?: HTMLDivElement;
  private stepsWrapper?: HTMLDivElement;
  private textSelect?: HTMLDivElement;
  private customTextArea?: HTMLDivElement;
  private textArea?: HTMLTextAreaElement;
  private calendarFormGroup?: HTMLDivElement;
  private step1Elems?: HTMLDivElement;
  private step2Elems?: HTMLDivElement;

  @State() sectionTitle: string;
  @State() sectionSubtitle: string;
  @State() sectionBtnText: string;
  @State() giftDetails: string;
  @State() selectImageForYourGift: string = salla.lang.get('blocks.buy_as_gift.select_image_or_upload');
  @State() selectImageOrUpload: string;
  @State() selectGiftMessage: string;
  @State() giftCustomText: string;
  @State() textId: string;
  @State() incorrectGiftText: string;
  @State() nextStep: string;
  @State() senderNameLabel: string;
  @State() receiverNameFieldLabel: string;
  @State() receiverMobileFieldLabel: string;
  @State() receiverEmailFieldLabel: string;
  @State() emailPlaceholder: string;
  @State() sendLater: string;
  @State() selectSendDateAndTime: string;
  @State() canNotEditOrderAfterSelectDate: string;
  @State() sendGift: string;
  @State() donationRequired: string;
  @State() currentStep: number = 1;
  @State() showCalendar: boolean = false;
  @State() showGiftText: boolean = false;
  @State() currentLang: string = '';
  @State() parentClass: string = "is-current-step-1";
  @State() errors: object = {};

  @State() gift: GiftResponse = undefined;
  @State() selectedGiftTextOption: string = undefined;

  @State() showTextArea: boolean = false;

  /// Gift Form Data
  @State() selectedImage: string = undefined;
  @State() uploadedImage: string = undefined;
  @State() selectedText: string = undefined;
  @State() senderName: string;
  @State() errorMessage: string;
  @State() hasError: boolean = false;
  @State() quantity: number;
  @State() deliveryDate: string;
  @State() timeZone?: string = null;
  // Receiver Data
  @State() receiverName: string;
  @State() receiverMobile: string;
  @State() receiverCountryCode: string;
  @State() receiverEmail: string;


  /**
   * The product id for which the gifting system is required.
   */
  @Prop() productId: number;

  /**
   * Widget title
   */
  @Prop() widgetTitle: string;

  /**
   * Widget subtitle
   */
  @Prop() widgetSubtitle: string;

  componentDidLoad() {
    salla.event.product.onPriceUpdated(() => {
      const quantityInput = document.querySelector('.s-quantity-input-input') as HTMLElement
      // @ts-ignore
      this.quantity = quantityInput?.value
    });
  }

  /**
   * Show / Open the gifting modal window
   */
  @Method()
  async open() {
    if (salla.config.isGuest()) {
      salla.event.dispatch('login::open');
      return;
    }
    await this.modal.open()
    return await salla.api.withoutNotifier(() => salla.product.getGiftDetails(this.productId))
      .then((response) => {
        this.gift = response.data;
        this.senderName = this.gift.sender_name;
      })
      .catch(e => {
        this.hasError = true;
        this.errorMessage = e.response?.data?.error?.message || e.response?.data;
      })
      .finally(() => this.modal.stopLoading());
  }

  /**
   *
   * Hide / close the gifting modal window
   */
  @Method()
  async close() {
    return this.modal.close();
  }


  /**
   * Update the modal height based on the changes on the inner elements height for a specific step OR just a pass a new fixed height
   */
  private async setWrapperHeight(asStep = 1, delay = 250, additionSpace = 0, newHeight = 0) {
    let currentStep: HTMLElement = document.querySelector(`.gift-step-${asStep}`) as HTMLElement;
    setTimeout(() => {
      let currentStepHeight: number = currentStep.offsetHeight;
      if (newHeight) {
        this.stepsWrapper.style.height = `${newHeight}px`;
      } else {
        this.stepsWrapper.style.height = currentStepHeight + additionSpace + 'px';
      }
    }, delay)
  }

  private toggleCalendar() {
    this.showCalendar = !this.showCalendar;
    this.setWrapperHeight(2, 150, 0);
  }

  private toggleGiftText(event) {
    this.textSelect?.classList.remove('s-form-has-error');
    let dataID = event.target.children[event.target.selectedIndex].getAttribute('data-id')
    let customID = dataID == "custom";
    this.showGiftText = customID;

    if (dataID) {
      this.selectedGiftTextOption = dataID
      customID ? this.selectedText = undefined : this.selectedText = event.target.value
      this.setWrapperHeight(1, 150, 5);
    } else {
      // empty textarea value
      this.textArea.value = '';
      this.selectedText = undefined
      this.selectedGiftTextOption = undefined
      this.setWrapperHeight(1, 150, -15);
    }

  }

  /**
   *
   * Go to the step 2
   */
  @Method()
  async goToStep2() {
    if (!this.selectedGiftTextOption) {
      this.textSelect.classList.add('s-form-has-error');
      this.customTextArea.classList.remove('s-form-has-error');
      return;
    } else if (this.selectedGiftTextOption == 'custom' && !this.selectedText) {
      this.textSelect.classList.remove('s-form-has-error');
      this.customTextArea.classList.add('s-form-has-error');
      return;
    } else {
      this.textSelect.classList.remove('s-form-has-error');
      this.customTextArea.classList.remove('s-form-has-error');
    }
    this.setWrapperHeight(2, 600, 0);

    let stepNextAnime = new (anime as any).timeline();
    stepNextAnime.add({
      targets: this.step1Elems.querySelectorAll('.anime-item'),
      opacity: [1, 0],
      translateX: [0, 50],
      delay: anime.stagger(70),
      // easing: 'easeOutExpo',
      duration: 1200,
    })
      .add({
        targets: '.gift-step-2',
        translateX: ['-110%', 0],
        opacity: [0, 1],
      }, '-=1800')
      .add({
        targets: this.step2Elems.querySelectorAll('.anime-item'),
        opacity: [0, 1],
        translateX: [-50, 0],
        delay: anime.stagger(70),
        duration: 1200,
        complete: () => {
          this.step2Elems.querySelectorAll('.anime-item').forEach(item => {
            item.classList.remove('opacity-0')
            item.removeAttribute('style');
          })
        }
      }, '-=1200')
    this.currentStep = 2;
    this.parentClass = `is-current-step-${this.currentStep}`
  }

  /**
   *
   * Go to the step 1
   */
  goToStep1(e) {
    e.preventDefault();
    let stepBackAnime = new (anime as any).timeline({
      autoplay: false,
    });

    stepBackAnime.add({
      targets: this.step2Elems.querySelectorAll('.anime-item'),
      opacity: [1, 0],
      translateX: [0, -50],
      delay: anime.stagger(70),
      // easing: 'easeOutExpo',
      duration: 1200,
    })
      .add({
        targets: '.gift-step-1',
        translateX: ['110%', 0],
        opacity: [0, 1],
      }, '-=1800')
      .add({
        targets: this.step1Elems.querySelectorAll('.anime-item'),
        opacity: [0, 1],
        translateX: [50, 0],
        delay: anime.stagger(70),
        duration: 1200,
        complete: () => {
          this.step1Elems.querySelectorAll('.anime-item').forEach(item => {
            item.classList.remove('opacity-0')
            item.removeAttribute('style');
          })
        }
      }, '-=1200')

    stepBackAnime.play();
    this.setWrapperHeight(1, 600, 0);
    this.currentStep = 1;
    this.parentClass = `is-current-step-${this.currentStep}`
  }

  private getFilepondPlaceholder() {
    return `<div class="s-gifting-filepond-placeholder"><span class="s-gifting-filepond-placeholder-icon">${Images}</span><p class="s-gifting-filepond-placeholder-text">${this.selectImageOrUpload ? this.selectImageOrUpload : ''}</p></div>`
  }

  setPreview(image: GiftImage) {
    this.uploader?.classList.add('has-bg')
    var bg = document.querySelector('.filepond-bg') ? document.querySelector('.filepond-bg') as HTMLElement : document.createElement('div') as HTMLElement;
    bg.classList.add('filepond-bg')
    bg.classList.remove('s-hidden')
    bg.style.backgroundImage = "url('" + image.url + "')"
    this.uploader?.querySelector('.filepond--root')?.appendChild(bg);
    this.uploadedImage = image.url;
    if (!!this.gift && this.gift.gift_images.length) {
      this.setWrapperHeight(1, 150, 0);
    }
  }

  removePreview() {
    this.uploader.classList.remove('has-bg');
    let bg = document.querySelector('.filepond-bg') as HTMLElement;
    bg.removeAttribute('style');
    bg.classList.add('s-hidden');
    this.handleRemoveImage()
  }

  private handleTextAreaChange(event) {
    this.selectedText = event.target.value;
    this.customTextArea.classList.remove('s-form-has-error');
  }

  private handleSenderName(event) {
    this.senderName = event.target.value;
  }

  private handleReceiverName(event) {
    this.receiverName = event.target.value;
  }

  private handleUploadImage(img) {
    this.uploadedImage = img;
    if (!!this.gift && this.gift.gift_images.length) {
      this.setWrapperHeight(1, 150, 0);
    }
  }

  private handleRemoveImage() {
    this.uploadedImage = '';
    if (!!this.gift && this.gift.gift_images.length) {
      this.setWrapperHeight(1, 150, 0);
    }
  }

  // private handleReceiverEmail(event) {
  //   this.receiverEmail = event.target.value;
  // }

  private handlePhoneInputChange(event) {
    let phone: Phone = event.detail;
    this.receiverMobile = phone.number;
    this.receiverCountryCode = phone.country_code;
  }

  private handleDateTimePicker(event) {
    this.deliveryDate = event.detail;
  }

  private getCalendarClasses() {
    return {
      "s-form-group": true,
      "anime-item": true,
      "s-gifting-calendar": true,
      "shown": this.showCalendar,
      "hide": !this.showCalendar,
      "s-form-has-error": !!this.errors && this.errors['deliver_at']
    }
  }

  private async submitForm() {
    // @ts-ignore
    const donatingAmount = document.querySelector('#donating-amount')?.value
    this.calendarFormGroup.classList.remove('s-form-has-error');
    if (!!this.errors) {
      this.errors = {}
      this.setWrapperHeight(2, 150, 0);
    }
    if (this.showCalendar && !this.deliveryDate) {
      this.calendarFormGroup.classList.add('s-form-has-error');
      return;
    }
    let payload: GiftToCardDTO = {
      text: this.selectedText,
      sender_name: this.senderName,
      quantity: this.quantity,
      deliver_at: this.showCalendar ? this.deliveryDate : null,
      image_url: this.uploadedImage ?? this.selectedImage,
      donation_amount: donatingAmount ? donatingAmount : null,
      receiver: {
        name: this.receiverName,
        country_code: this.receiverCountryCode,
        mobile: this.receiverMobile
      }
    }
    return await salla.product.addGiftToCart(this.productId, payload, true)
    .then(() => this.modal.close())
    .catch((e) => {
      if (e.response.status == 422) {
        this.errors = e.response.data.error.fields
      } else {
        console.log(e);
      }
      this.setWrapperHeight(2, 150, 0);
    })
  }

  render() {
    return [
      <div>
        <salla-list-tile class="s-gifting-widget">
          <div slot="title">
            <h3>{!!this.widgetTitle ? this.widgetTitle : this.sectionTitle}</h3>
          </div>
          <div slot="subtitle">
            <div>{!!this.widgetSubtitle ? this.widgetSubtitle : this.sectionSubtitle}</div>
          </div>
          <div slot="action">
            <salla-button class="s-gifting-widget-action" color="gray" onClick={() => this.open()}>
              <slot name="widget-btn-content">
                <div class="s-gifting-widget-action-content">
                  <span innerHTML={GiftSharing}></span> &nbsp;
                  <span>{this.sectionBtnText}</span>
                </div>
              </slot>
            </salla-button>
          </div>
        </salla-list-tile>

        <salla-modal id='salla-gifting-modal' isLoading={true} class="s-gifting-modal" width="sm"
                     ref={modal => this.modal = modal as HTMLSallaModalElement}>
          <div slot="loading">
            <div class="s-gifting-skeleton">
              <div class="s-gifting-modal-header">
                <salla-skeleton type='circle' height='5rem' width='5rem'></salla-skeleton>
                <h2 class="s-gifting-modal-title">
                  <div class="s-gifting-modal-badge-wrapper">
                    <salla-skeleton height='15px' width='150px'></salla-skeleton>
                  </div>
                </h2>
              </div>
              <div class="s-gifting-skeleton-content">
                <salla-skeleton height='10px' width='150px'></salla-skeleton>
                <salla-skeleton height='230px'></salla-skeleton>
                <salla-skeleton height='10px' width='150px'></salla-skeleton>
                <salla-skeleton height='30px'></salla-skeleton>
                <salla-skeleton height='40px'></salla-skeleton>
              </div>
            </div>
          </div>
          <slot name="header"/>
          {!!this.hasError ?
            <salla-placeholder alignment="center">
              <span slot="title">{this.errorMessage || salla.lang.get('common.errors.empty_results')}</span>
              <span slot="description"> </span>
            </salla-placeholder>
            :
            [
              <div class="s-gifting-modal-header">
                <span class="s-gifting-modal-icon">
                  <span innerHTML={GiftSharing}></span>
                </span>
                <h2 class="s-gifting-modal-title">
                  <div class="s-gifting-modal-badge-wrapper">
                    <div class="s-gifting-modal-badge">
                      <span><span>{this.currentStep}</span>/2</span>
                    </div>
                    <span>{this.giftDetails}</span>
                  </div>
                </h2>
              </div>,
              <div class={"s-gifting-steps-wrapper " + this.parentClass} ref={el => this.stepsWrapper = el}>
                <div class="s-gifting-step-one gift-step-1" ref={el => this.step1Elems = el}>
                  <div class="s-gifting-modal-uploader-title anime-item">
                    {this.selectImageForYourGift}
                  </div>
                  <div class="s-gifting-modal-uploader anime-item" ref={el => this.uploader = el as HTMLDivElement}>
                    <span class="s-gifting-remove-preview" onClick={() => this.removePreview()} innerHTML={Cancel}/>
                    {this.selectImageOrUpload && <salla-file-upload
                      instant-upload={true}
                      name="image_url"
                      url={salla.url.api(salla.product.api.getUrl('giftImage'))}
                      onUploaded={event => this.handleUploadImage(event.detail)}
                      labelIdle={this.getFilepondPlaceholder()}
                      onRemoved={() => this.handleRemoveImage()}/>}

                  </div>
                  <div class="anime-item">
                    {!this.uploadedImage && !!this.gift && !!this.gift.gift_images && this.gift.gift_images.length > 0 ?
                      <salla-slider
                        id="gifting-slider"
                        loop={false}
                        //todo:: it looks bad attribute
                        controls-outer={true}
                        class="s-gifting-slider"
                        type="carousel">
                        <div slot="items">
                          {
                            this.gift && this.gift.gift_images ?
                              this.gift?.gift_images.map((item: GiftImage) =>
                                <img class="s-gifting-image s-gifting-clickable" src={item.url}
                                     onClick={() => this.setPreview(item)} alt={`${item.id}`}/>
                              ) : ''
                          }
                        </div>
                      </salla-slider>
                      : ""}
                  </div>
                  <div class="anime-item">

                    <div class="s-form-group s-gifting-selectText" ref={el => this.textSelect = el as HTMLDivElement}>
                      <select id="gift-text-selection" name="gift-text-selection"
                              class="s-form-control s-gifting-select" onChange={e => this.toggleGiftText(e)}>
                        <option data-id={null} selected>{this.selectGiftMessage}</option>
                        {
                          this.gift && this.gift.gift_texts ?
                            this.gift?.gift_texts.map((txt: GiftText) =>
                              <option data-id={txt.id} value={txt.text} key={txt.id}>{txt.text}</option>
                            ) : ''
                        }
                        <option data-id="custom">{this.giftCustomText}</option>
                      </select>
                    </div>

                    <div
                      class={this.showGiftText ? "s-form-group s-gifting-textarea shown" : "s-form-group s-gifting-textarea hide"}
                      ref={(el) => this.customTextArea = el}>
                      <label htmlFor="gift-custom-text" class="s-form-label">{this.giftCustomText}</label>
                      <div class="mt-1">
                        <textarea onInput={(event) => this.handleTextAreaChange(event)} rows={4}
                                  ref={(el) => this.textArea = el} name="gift-custom-text" id="gift-custom-text"
                                  class="s-form-control"/>
                      </div>
                    </div>
                  </div>

                  <div class="anime-item">

                    <salla-button color="primary" width="wide" onClick={() => this.goToStep2()}>
                      <span>{this.nextStep}</span>
                    </salla-button>
                  </div>

                </div>
                <div class="s-gifting-step-two gift-step-2" ref={el => this.step2Elems = el}>
                  <div
                    class={this.errors && this.errors['sender_name'] ? "s-form-group s-form-has-error anime-item opacity-0" : "s-form-group anime-item opacity-0"}>
                    <label htmlFor="sender_name" class="s-form-label">{this.senderNameLabel}</label>
                    <input type="text"
                           class="s-form-control"
                           name="sender_name"
                           id="sender_name"
                           value={this.senderName}
                           onInput={(event) => this.handleSenderName(event)}
                           placeholder=""
                    />
                    {this.errors && this.errors['sender_name'] ?
                      <span class="text-danger text-xs">{this.errors['sender_name']}</span> : ''}
                  </div>
                  <div
                    class={this.errors && this.errors['receiver.name'] ? "s-form-group s-form-has-error anime-item opacity-0" : "s-form-group anime-item opacity-0"}>
                    <label htmlFor="receiver_name" class="s-form-label">{this.receiverNameFieldLabel}</label>
                    <input type="text"
                           class="s-form-control"
                           name="receiver_name"
                           id="receiver_name"
                           value=""
                           onInput={(event) => this.handleReceiverName(event)}
                           placeholder=""
                    />
                    {this.errors && this.errors['receiver.name'] ?
                      <span class="text-danger text-xs">{this.errors['receiver.name']}</span> : ''}
                  </div>
                  <div
                    class={this.errors && this.errors['receiver.mobile'] ? "s-form-group s-form-has-error anime-item opacity-0" : "s-form-group anime-item opacity-0"}>
                    <label class="s-form-label">{this.receiverMobileFieldLabel}</label>
                    <salla-tel-input class="s-gifting-tel-input" phone={this.receiverMobile}
                                     countryCode={this.receiverCountryCode}
                                     onPhoneEntered={(e) => this.handlePhoneInputChange(e)}/>
                    {this.errors && this.errors['receiver.mobile'] ?
                      <span class="text-danger text-xs">{this.errors['receiver.mobile']}</span> : ''}
                  </div>
                  <div class="anime-item opacity-0">
                    <label class="s-gifting-schedule s-gifting-clickable" htmlFor="schedule">
                      <input type="checkbox" name='schedule' id='schedule' onChange={() => this.toggleCalendar()}
                             class="s-checkbox"/>
                      <span class="s-form-label"> {this.sendLater} </span>
                    </label>

                  </div>
                  <div class={this.getCalendarClasses()} ref={(el) => this.calendarFormGroup = el}>
                    <label class="s-form-label">{this.selectSendDateAndTime}</label>
                    <salla-datetime-picker value={this.deliveryDate} placeholder={this.selectSendDateAndTime}
                                           enable-time date-format="Y-m-d h:i K"
                                           onPicked={(event) => this.handleDateTimePicker(event)}
                    >
                    </salla-datetime-picker>
                    <span class="s-gifting-calendar-hint">{this.canNotEditOrderAfterSelectDate}</span>
                  </div>
                  <div class="s-gifting-step-two-footer anime-item opacity-0">
                    <a href="#!" innerHTML={LeftArrow} onClick={(e) => this.goToStep1(e)}/>

                    <salla-button onClick={() => this.submitForm()} color="primary" width='wide'>
                      <span>{this.sendGift}</span>
                    </salla-button>
                  </div>
                </div>
              </div>]
          }
          <slot name="footer"/>
        </salla-modal>
      </div>

    ]
  }

}
