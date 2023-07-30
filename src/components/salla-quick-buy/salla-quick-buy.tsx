import {Component, Host, h, Prop, State, Element} from '@stencil/core';
import FullWallet from '../../assets/svg/full-wallet.svg';
import "@salla.sa/applepay/src/index";

@Component({
  tag: 'salla-quick-buy',
  styleUrl: 'salla-quick-buy.css',
})
export class SallaQuickBuy {
  constructor() {
    salla.lang.onLoaded(() => {
      this.quickBuy = salla.lang.get('pages.products.buy_now');
    });
  }

  @Element() host: HTMLElement;

  /**
   * Button type.
   *
   * @type {string}
   * @default buy
   **/
  @Prop({mutable: true}) type: 'plain' | 'buy' | 'donate' | 'book' | 'pay' | 'order' = 'buy';

  /**
   * Product ID.
   *
   * @type {string}
   **/
  @Prop({mutable: true}) productId: string;

  /**
   * Product amount in base currency (SAR).
   *
   * @type {number}
   * @default 0
   **/
  @Prop({reflect: true, mutable: true}) amount: number;

  /**
   * base currency
   *
   * @type {string}
   * @default SAR
   */
  @Prop({mutable: true}) currency: string;

  /**
   * Product options, if is empty will get the data from the document.querySelector('salla-product-options[product-id="X"]')
   *
   * @type {object}
   * @default {}
   */
  @Prop() options = {};

  /**
   * To be passed to purchaseNow request
   * @type {boolean}
   **/
  @Prop({mutable: true}) isRequireShipping: boolean;

  @State() isApplePayActive: boolean;

  @State() quickBuy: string = salla.lang.get('pages.products.buy_now');

  private async quickBuyHandler() {
    if (salla.config.isGuest()) {
      // todo (low) :: find a way to re-fire the method after success
      return salla.auth.event.dispatch('login::open');
    }

    let optionsElement = document.querySelector(`salla-product-options[product-id="${this.productId}"]`) as HTMLSallaProductOptionsElement;

    //make sure all the required options are selected
    if (optionsElement && !await optionsElement.reportValidity()) {
      return salla.error(salla.lang.get('common.messages.required_fields'));
    }

    //use this way to get quantity too
    let data = (this.host as any).getElementSallaData();

    // if the store doesn't have Apple Pay , just create a cart and then redirect to check out page
    // @ts-ignore
    if (!this.isApplePayActive) {
      // return salla.product.buyNow(this.productId, data);
      return salla.api.request('checkout/quick-purchase/' + this.productId, data, 'post')
        .then(resp => {
          if (resp.data.redirect) {
            window.location.href = resp.data.redirect;
          }
          return resp;
        });
    }
    data.is_applepay = true;

    if ('append' in data) {
      data.append('is_applepay', true);
    }

    // noinspection TypeScriptValidateJSTypes
    salla.event.dispatch('payments::apple-pay.start-transaction', {
      amount: this.amount, // 1000
      currency: this.currency || 'SAR', // SAR
      requiredShippingContactFields: this.isRequireShipping ? ['postalAddress'] : null,
      shippingMethods: this.isRequireShipping ? [] : null,
      supportedNetworks: salla.config.get('store.settings.buy_now.networks'),
      supportedCountries: salla.config.get('store.settings.buy_now.countries'),
      validateMerchant: {
        url: salla.url.get('checkout/applepay/validate'),
        onSuccess: () => {
          return salla.api.request('checkout/quick-purchase/' + this.productId, typeof data == 'object' ? data : undefined, 'post', {}).then(response => {

            // if is redirect url returned for any reason, lets redirect the user to check out
            if (response?.data?.redirect) {
              salla.log('🍏 Pay: create checkout success: redirect exits, go to checkout page');
              window.location.href = response.data.redirect.url;
              return response;
            }

            // the cart is not ready to complete apply pay session
            if (!response?.data?.id) {
              salla.logger.warn('🍏 Pay: create checkout success: No id, or redirect');
              return response;
            }

            window.SallaApplePay.id = response.data.id || response.data.data.id;

            salla.log('🍏 Pay: create checkout success: with id #' + window.SallaApplePay.id);
          });
        }
      },
      authorized: {
        // submit checkout route
        url: salla.url.get('checkout/{id}/payments/submit'),
        onFailed: (response) => {
          window.SallaApplePay.onCancel({}, response?.data?.error?.message || response?.data?.error?.code || salla.lang.get('pages.checkout.payment_failed'));
        },
        onSuccess: (response) => {
          window.location.href = response.redirect.url;
          salla.log('🍏 Pay: authorized Success:: redirect to thank you page, order placed');
        }
      },
      shippingMethodSelected: this.isRequireShipping ? {
        url: salla.url.get('checkout/{id}/shipping/details'),
      } : null,
      shippingContactSelected: this.isRequireShipping ? {
        url: salla.url.get('checkout/{id}/address/add'),
      } : null,
      oncouponcodechanged: {
        url: salla.url.get('checkout/{id}/coupons')
      },
      recalculateTotal: {
        url: salla.url.get('checkout/{id}/payments/recalculate')
      },
      onError: function (message) {
        salla.log(message);
        salla.notify.error(message);
      }
    });
  }

  componentWillLoad() {
    return new Promise((resolve, reject) => {
      salla.onReady(async () => {

        // if (!this.currency) {
        //   this.currency = salla.config.get('user.currency_code');
        // }

        if (!this.productId && salla.config.get('page.id')) {
          this.productId = salla.config.get('page.id');
        }

        if (!this.productId) {
          salla.logger.warn('🍏 Pay: Failed load the quick buy, the product id is missing')
          return reject()
        }

        /**
         * We should check the product if it's required shipping
         * in order for apple pay sdk to show the required Shipping Contact Fields
         * components..
         */
        if ((!this.amount || ! this.isRequireShipping) && this.productId) {
          await salla.product.getDetails(this.productId, []).then((response) => {
            this.amount = response.data.base_currency_price.amount;
            this.currency = response.data.base_currency_price.currency;
            this.isRequireShipping = response?.data?.is_require_shipping || false;
          }).catch((error) => {
            salla.logger.warn('🍏 Pay: Failed load the quick buy, get the product details failed: ', error)
            return reject()
          })
        }

        if (salla.url.is_page('product.single')) {
          salla.product.event?.onPriceUpdated(response => {
            this.amount = response.data.base_currency_price.amount;
            this.currency = response.data.base_currency_price.currency;
          });
        }

        let isNotIframe=window.self === window.top;
        this.isApplePayActive = isNotIframe && window.ApplePaySession?.canMakePayments()
          && salla.config.get('store.settings.payments')?.includes('apple_pay')
          && salla.config.get('store.settings.is_salla_gateway', false);

        let applePaySdk = document.getElementById('apple-pay-sdk');
        if (applePaySdk || !this.isApplePayActive) {
          salla.logger.warn('🍏 Pay: Skipped load apple pay because ' + (applePaySdk ? 'already loaded' : (isNotIframe?'is not available in the browser':'is iframe')))
          resolve(true);
          return;
        }

        const script = document.createElement('script');
        script.src = 'https://applepay.cdn-apple.com/jsapi/v1/apple-pay-sdk.js';
        script.setAttribute('id', 'apple-pay-sdk');
        script.async = true;

        document.body.appendChild(script);

        resolve(true);
      })
    })
  }

  render() {
    return <Host>{this.quickBuyButton()}</Host>
  }

  private quickBuyButton() {
    return this.isApplePayActive
      ? <apple-pay-button locale={salla.config.get('user.language_code')}
                          onClick={() => this.quickBuyHandler()}
                          data-quick-purchase="applepay"
                          class="s-quick-buy-apple-pay"
                          data-is-applepay="1"
                          buttonstyle="black"
                          type={this.type}/>
      :
      <salla-button onClick={() => this.quickBuyHandler()}
                    class="s-quick-buy-button"
                    color="primary"
                    fill="outline"
                    size="medium"
                    width="wide"
                    shape="btn">
        <span innerHTML={FullWallet}/>
        {this.quickBuy}
      </salla-button>;
  }
}
