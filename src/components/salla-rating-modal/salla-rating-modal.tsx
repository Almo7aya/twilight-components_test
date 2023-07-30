import { Component, h, Method, Element, Host, State, Prop } from '@stencil/core';
import OrderFeedbackResponse from "./order-feedback-response";
import Star from '../../assets/svg/star.svg';
import ShippingFast from "../../assets/svg/shipping-fast.svg";
import CheckCircle2 from "../../assets/svg/check-circle2.svg";
import Helper from '../../Helpers/Helper';

@Component({ tag: 'salla-rating-modal', styleUrl: 'salla-rating-modal.css' })

export class SallaRatingModal {
  constructor() {
    salla.event.on('rating::open', () => this.open());

    salla.lang.onLoaded(() => {
      this.translationLoaded = true;
    });

  }

  @State() order: OrderFeedbackResponse | undefined;
  @State() hasError: boolean = false;
  @State() errorMessage: string;

  private stepsCount: number = 0;
  private nextBtn: HTMLSallaButtonElement;
  private backBtn: HTMLButtonElement;
  private modal: HTMLSallaModalElement;
  private currentIndex: number = 0;
  private currentTab: HTMLDivElement | HTMLElement;
  private thanksTab: HTMLDivElement;
  private body: HTMLDivElement;
  private thanksTime: HTMLTimeElement;
  private steps: NodeListOf<HTMLDivElement>;
  private dots: NodeListOf<HTMLDivElement>;
  private submitted: Array<number> = [];

  /**
   * The order id, to rate on its products & shipping
   */
  @Prop() orderId: number = salla.config.get('page.id');

  @State() translationLoaded: boolean = false;

  @Element() host: HTMLElement;

  /**
   * Show the rating modal
   */
  @Method()
  async open() {
    return this.modal.open()
      .then(() => this.order || salla.api.withoutNotifier(() => salla.rating.api.order(this.orderId)).then(res => this.order = res.data))
      .then(() => this.modal.setTitle(salla.lang.get('pages.rating.rate_order') + ' <span class="unicode">(#' + this.order.id + ')</span>'))
      .then(() => this.modal.stopLoading())
      .then(() => this.stepsCount = [this.order.testimonials_enabled, this.order.products_enabled, this.order.shipping_enabled].filter(enabled => enabled).length)
      .then(() => setTimeout(() => this.handleWizard(), 100))
      .catch(e => {
        this.hasError = true;
        this.errorMessage = e.response?.data?.error?.message || e.response?.data;
        this.modal.stopLoading()
      })
  }

  /**
   * Show the rating modal
   */
  @Method()
  async close() {
    return this.modal.close();
  }


  // handle wizard
  private handleWizard() {
    this.steps = this.modal.querySelectorAll(".s-rating-modal-step");
    this.dots = this.modal.querySelectorAll(".s-rating-modal-step-dot");
    this.showActiveStep();
  }

  private showActiveStep(current = null) {
    this.currentTab = current || this.steps[this.currentIndex];
    Helper.toggleClassIf('.s-rating-modal-step-dot', 's-rating-modal-bg-gray', 's-rating-modal-bg-primary', dot => dot != this.dots[this.currentIndex])
      .toggleClassIf('.s-rating-modal-step', 's-rating-modal-active', 's-rating-modal-hidden', tab => tab == this.currentTab)

    if (this.currentIndex != 0) {
      // the animation
      Helper.toggleElementClassIf(this.currentTab, 's-rating-modal-unactive', 's-rating-modal-hidden', () => true);
      setTimeout(() => Helper.toggleElementClassIf(this.currentTab, 's-rating-modal-active', 's-rating-modal-unactive', () => true), 300);
    }

    // Btn text
    let nextType = this.steps[this.currentIndex + 1]?.dataset.type;
    this.nextBtn?.setText(nextType ? salla.lang.get('pages.rating.rate') + ' ' + salla.lang.get('pages.rating.' + nextType)
      : salla.lang.get('pages.rating.send_ratings'));

    setTimeout(() => this.body?.setAttribute('style', 'height:' + this.currentTab?.offsetHeight + 'px'));
  }

  private previousTab() {
    this.currentIndex > 0 && this.currentIndex--;
    Helper.toggleElementClassIf(this.backBtn, 's-rating-modal-unvisiable', 'block', () => this.currentIndex == 0);
    this.showActiveStep();
  }

  private submit() {
    this.submittedBefore() || this.validate();
    salla.config.canLeave = false;
    this.nextBtn.load()
      .then(() => this.submittedBefore() || this.sendFeedback())
      .then(() => this.currentTab.querySelectorAll('[name],.s-rating-modal-btn-star').forEach(el => el.setAttribute('disabled', '')))
      .then(() => this.currentIndex < this.stepsCount && this.currentIndex++)
      .then(() => this.showActiveStep())
      .then(() => Helper.toggleClassIf('#prev-btn', 'block', 's-rating-modal-unvisiable', () => true))
      .finally(() => {
        this.nextBtn.stop();
        salla.config.canLeave = true;
        this.currentIndex == this.stepsCount && this.showThankYou();
        // this.modal.isClosable = false;
      });
  }

  private submittedBefore() {
    return this.submitted.includes(this.currentIndex);
  }

  private validate(rating = null, type = null) {
    if (!rating && this.currentTab.dataset.type == 'products') {
      return this.currentTab.querySelectorAll('.rating-outer-form').forEach(rating => this.validate(rating, 'product'));
    }
    rating = rating || this.currentTab;
    let stars = rating.querySelector('.rating_hidden_input').value;
    let comment: HTMLInputElement = rating.querySelector('.s-rating-modal-comment');
    let validationMessage = rating.querySelector('.s-rating-modal-validation-msg');
    if (stars && comment.value && comment.value.length > 3) {
      comment.classList.remove('s-has-error');
      validationMessage.innerHTML = '';
      return;
    }
    type = type || rating['dataset'].type;

    Helper.toggleElementClassIf(comment, 'save', 's-has-error', el => el.value.length > 3);

    throw validationMessage.innerHTML = stars
      ? (salla.lang.get('common.errors.not_less_than_chars', { chars: 4 }) + ' ' + comment.getAttribute('placeholder'))
      : salla.lang.get(`pages.rating.rate_${type}_stars`).replace(' (:item)', '');
  }

  private sendFeedback() {
    let data = {};
    this.currentTab.querySelectorAll('[name]').forEach((input: HTMLInputElement) => {
      //decode names like `<input name="jamal[inner]" value="hi">` to be {name:jamal, value: {inner:"hi"}}
      let inputData = salla.helpers.inputData(input.name, input.value, data);
      data[inputData.name] = inputData.value;
    });

    if (Object.keys(data).length == 0) {
      return;
    }
    data['order_id'] = this.orderId;
    data['type'] = this.currentTab.dataset.type;
    this.submitted.push(this.currentIndex);
    return salla.rating.api[this.currentTab.dataset.type](data);
  }

  private showThankYou() {
    let seconds = 10;
    let timeToClose = setInterval(() => {
      this.thanksTime.innerHTML = '00:0' + (seconds--);
      if (seconds > 0) {
        return
      }
      clearInterval(timeToClose);
      this.thanksTime.remove();
      this.close().then(() => window.location.reload());
    }, 1000);

    this.modal.querySelector('.s-rating-modal-footer').classList.add('s-rating-modal-unvisiable');
    this.showActiveStep(this.thanksTab);
  }

  render() {
    return (
      <Host class="s-rating-modal">
        <salla-modal class="s-rating-modal-wrap" isLoading={true} width="md" ref={modal => this.modal = modal}>
          <div slot='loading'>
            <div class="s-rating-modal-skeleton">
              <salla-skeleton type='circle' height='80px' width='80px'></salla-skeleton>
              <salla-skeleton height='15px' width='60%'></salla-skeleton>
              <salla-skeleton height='10px' width='30%'></salla-skeleton>
              <div class="s-rating-modal-skeleton-stars">
                {[...Array(5)].map(() => <div innerHTML={Star}></div>)}
              </div>
              <salla-skeleton height='100px' width='100%'></salla-skeleton>
              <div class="s-rating-modal-skeleton-footer">
                <salla-skeleton height='40px' width='30%'></salla-skeleton>
              </div>
            </div>
          </div>
          {!this.hasError && this.order
            ? [<div class="s-rating-modal-wrapper" ref={el => this.body = el}>
              {/*Store Rating tab*/}
              {this.order?.testimonials_enabled ?
                <div class="rating-outer-form s-rating-modal-step-wrap s-rating-modal-step s-rating-modal-hidden"
                  data-type="store">
                  <div class="s-rating-modal-rounded-icon">
                    <img src={salla.config.get('store.logo', 'https://assets.salla.sa/cp/assets/images/logo-new.png')}
                      alt="store name" class="s-rating-modal-store-logo" />
                  </div>
                  <h2 class="s-rating-modal-title">{salla.lang.get('pages.rating.rate_the_store')}</h2>
                  <div class="s-rating-modal-stars-company">
                    <salla-rating-stars size="large"></salla-rating-stars>
                  </div>
                  <textarea name="comment" class="s-rating-modal-comment"
                    placeholder={salla.lang.get('pages.rating.write_store_rate')}></textarea>
                  <small class="s-rating-modal-validation-msg"></small>
                </div>
                : ''}

              {/*Products tab*/}
              {this.order.products_enabled
                ? <section class="s-rating-modal-step s-rating-modal-hidden" data-type="products">
                  {this.order.products.map((item, index) =>
                    <div class="rating-outer-form s-rating-modal-product"
                      data-stars-error={salla.lang.get('pages.rating.rate_product_stars')}>
                      <div class="s-rating-modal-product-img-wrap">
                        <img src={item.product.thumbnail} alt={item.product.name} class="s-rating-modal-product-img" />
                      </div>
                      <div class="s-rating-modal-product-details">
                        <h3 class="s-rating-modal-product-title"> {item.product.name}</h3>
                        <div class="s-rating-modal-stars-product">
                          <salla-rating-stars size="small" name={`products[${index}][rating]`}></salla-rating-stars>
                        </div>
                        <input type="hidden" name={`products[${index}][product_id]`} value={item.product.id} />
                        <textarea placeholder={salla.lang.get('pages.rating.write_product_rate')}
                          name={`products[${index}][comment]`} class="s-rating-modal-comment"></textarea>
                        <small class="s-rating-modal-validation-msg"></small>
                      </div>
                    </div>
                  )}
                </section>
                : ''}


              {/*Shipping tab*/}
              {this.order.shipping_enabled && this.order.shipping?.company
                ? <div class="rating-outer-form s-rating-modal-step-wrap s-rating-modal-step s-rating-modal-hidden"
                  data-type="shipping">
                  <input type="hidden" name="shipping_company_id" value={this.order.shipping.company.id} />
                  {this.order.shipping.company.logo
                    ? <div class="s-rating-modal-rounded-icon">
                      <img src={this.order.shipping.company.logo} class="s-rating-modal-shipping-logo"
                        alt={this.order.shipping.company.name} />
                    </div>
                    : <span class="s-rating-modal-icon" innerHTML={ShippingFast}></span>}
                  <div
                    class="s-rating-modal-title"> {salla.lang.get('pages.rating.rate_shipping') + ' ' + this.order.shipping.company.name}</div>
                  <div class="s-rating-modal-stars-company">
                    <salla-rating-stars size="large"></salla-rating-stars>
                  </div>
                  <textarea name="comment" class="s-rating-modal-comment"
                    placeholder={salla.lang.get('pages.rating.write_shipping_rate')}></textarea>
                  <small class="s-rating-modal-validation-msg"></small>
                </div>
                : ''}

              {/*Thank you tab*/}
              <div class="s-rating-modal-thanks s-rating-modal-hidden" ref={el => this.thanksTab = el}>
                <span class="s-rating-modal-icon" innerHTML={CheckCircle2}></span>
                <h3 class="s-rating-modal-thanks-title">{salla.lang.get('pages.rating.thanks')}</h3>
                <div class="s-rating-modal-thanks-msg" innerHTML={this.order.thanks_message}></div>
                <time class="s-rating-modal-thanks-time" ref={el => this.thanksTime = el}></time>
              </div>

            </div>,
            <div class="s-rating-modal-footer">
              <button ref={el => this.backBtn = el} onClick={() => this.previousTab()}
                class="s-rating-modal-btn s-rating-modal-unvisiable">
                {salla.lang.get('common.elements.back')}
              </button>
              {this.stepsCount > 1 ? <ul class="s-rating-modal-dots">{[0, 1, 2].slice(0, this.stepsCount).map(() =>
                <li class='s-rating-modal-bg-gray s-rating-modal-step-dot'></li>
              )}</ul> : ''}
              <salla-button loader-position='center' ref={el => this.nextBtn = el} onClick={() => this.submit()}>
                {salla.lang.get('common.elements.next')}
              </salla-button>
            </div>,]
            : <salla-placeholder alignment="center"></salla-placeholder>}
        </salla-modal>
      </Host>
    );
  }

  componentDidLoad() {
    salla.event.dispatch('rating::ready', this);
  }
}
