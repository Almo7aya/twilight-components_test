import { Component, Host, h, Prop, State, Element } from '@stencil/core';

@Component({
  tag: 'salla-installment',
  styleUrl: 'salla-installment.css',
})

export class SallaInstallment {
  private tabbyBorderRemoved: boolean = false;
  private tabbyRemoveBorderTries: number = 0;
  @Element() host: HTMLElement;
  constructor() {
    salla.lang.onLoaded(() => {
      const installment = salla.config.get('store.settings.installments');
      if (installment) {
        this.tamaraIsActive = installment.includes('tamara_installment');
        this.tabbyIsActive = installment.includes('tabby_installment');
        this.spotiiIsActive = installment.includes('spotii_pay');
      }
      this.renderInstallments();
    });

    salla.event.on('product::price.updated', ({ data }) => {
      if (!data.price || data.price == this.price) {
        return;
      }
      this.price = data.price;
      this.renderInstallments(true);
    });
  }

  /**
   * Current product price
   */
  @Prop() price: string;
  /**
   * Language code
   */
  @Prop() language: string = salla.config.get('user.language_code');
  /**
   * Currency code
   */
  @Prop() currency: string = salla.config.get('user.currency_code');

  @State() tamaraIsActive: boolean;
  @State() tabbyIsActive: boolean;
  @State() spotiiIsActive: boolean;

  render() {
    return (
      <Host>
        {this.tamaraIsActive ?
          <div class="tamara-product-widget"
            data-price={this.price}
            data-currency={this.currency}
            data-lang={this.language}
            data-payment-type="installment">
          </div>
          : ''}

        {this.tabbyIsActive ?
          <div id="tabbyPromoWrapper">
            <div id="tabbyPromo"></div>
          </div>
          : ''}

        {this.spotiiIsActive ?
          <div class="spotii-wrapper">
            {/*No need for the price, the price already in the page, and also tammara & tabby doesn't have price */}
            <div class="spotii-promo"></div>
          </div>
          : ''}
      </Host>
    );
  }

  renderInstallments(isUpdating: boolean = false) {
    // Tamara
    if (this.tamaraIsActive) {
      if (isUpdating) {
        var oldTamaraScript = document.querySelector('script[src="https://cdn.tamara.co/widget/product-widget.min.js"]');
        if (oldTamaraScript) {
          oldTamaraScript.remove();
        }
      }

      var tamaraScript = document.createElement('script');
      tamaraScript.setAttribute('src', 'https://cdn.tamara.co/widget/product-widget.min.js');
      document.head.appendChild(tamaraScript);
      tamaraScript.onload = () => {
        window.TamaraProductWidget.init({ lang: this.language });
        setTimeout(() => {
          window.TamaraProductWidget.render();
        }, 300);
      };
    }

    // tabby
    if (this.tabbyIsActive) {
      if (isUpdating) {

        // remove #tabbyPromoWrapper and re append it
        var oldTabbyWrapper = this.host.querySelector('#tabbyPromoWrapper');
        if (oldTabbyWrapper) {
          oldTabbyWrapper.remove();
        }

        var tabbyPromoWrapper = document.createElement('div');
        tabbyPromoWrapper.setAttribute('id', 'tabbyPromoWrapper');
        var tabbyPromo = document.createElement('div');
        tabbyPromo.setAttribute('id', 'tabbyPromo');
        tabbyPromoWrapper.appendChild(tabbyPromo);
        this.host.appendChild(tabbyPromoWrapper);

        var oldTabbyScript = document.querySelector('script[src="https://checkout.tabby.ai/tabby-promo.js"]');
        if (oldTabbyScript) {
          oldTabbyScript.remove();
        }
      }

      var tabbyScript = document.createElement('script');
      tabbyScript.setAttribute('src', 'https://checkout.tabby.ai/tabby-promo.js');
      document.head.appendChild(tabbyScript);
      tabbyScript.onload = () => {
        const TabbyPromo = window.TabbyPromo;
        new TabbyPromo({
          selector: '#tabbyPromo',
          currency: this.currency,
          price: this.price,
          lang: this.language,
        });
        document.querySelectorAll('.tabby-promo-snippet__logo').forEach(function (element) {
          element.setAttribute('aria-label', 'Tabby Logo');
        });
      }
      // this is a workaround to remove the default border and add margin
      this.removeTabbyBorder();
    }

    // Spotii
    if (this.spotiiIsActive) {
      if (isUpdating) {

        var oldSpotiiWrapper = this.host.querySelector('.spotii-wrapper');
        if (oldSpotiiWrapper) {
          oldSpotiiWrapper.remove();
        }

        var spotiiPromoWrapper = document.createElement('div');
        spotiiPromoWrapper.classList.add('spotii-wrapper');
        var spotiiPromo = document.createElement('div');
        spotiiPromo.classList.add('spotii-promo');
        spotiiPromoWrapper.appendChild(spotiiPromo);
        this.host.appendChild(spotiiPromoWrapper);
        var oldSpotiiScript = document.querySelector('script[src="' + salla.url.cdn('js/price-widget-ar-salla.js') + '"]');
        if (oldSpotiiScript) {
          oldSpotiiScript.remove();
        }
      }

      let amount = salla.money((Number(this.price) / 3).toFixed(2));
      let isRTL = salla.config.get('theme.is_rtl', true);
      window.spotiiConfig = {
        targetXPath: ['.spotii-wrapper'],
        renderToPath: ['.spotii-promo'],
        numberOfPayment: 3,
        currency: this.currency,
        templateLine: "${textOne} ${number} ${textTwo} " + amount + "${logo} ${info}",
        //todo:: translate these
        textOne: isRTL ? "جزء الدفع على" : "Split it into",
        textTwo: isRTL ? "أقساط متساوية بدون تكاليف اضافية بقيمة" : "payments of",
        textThree: "مع",
        price: this.price,
        // forcedShow: false,
        // merchantID: null,
      };

      var spotiiScript = document.createElement('script');
      spotiiScript.setAttribute('src', salla.url.cdn('js/price-widget-ar-salla.js'));
      document.head.appendChild(spotiiScript);
      // spotiiScript.onload = () => {
      //   // setTimeout()
      // }
    }
  }


  /**
   * this is workaround to remove the default border and add margin
   * we will try to remove tabby border 5 times for 7.5 seconds
   */
  removeTabbyBorder() {
    if (this.tabbyBorderRemoved || this.tabbyRemoveBorderTries > 5) {
      return;
    }
    this.tabbyRemoveBorderTries++;
    setTimeout(() => {
      let promo: any = document.querySelector('#tabbyPromo>div>div');
      promo = promo ? promo.shadowRoot.querySelector('div[class^="styles__tabby-promo-snippet--"]') : null;
      if (promo) {
        promo.style = 'border: none; margin: 15px 0!important;';
        this.tabbyBorderRemoved = true;
      } else {
        this.removeTabbyBorder();
      }
    }, this.tabbyRemoveBorderTries * 500)
  }
}
