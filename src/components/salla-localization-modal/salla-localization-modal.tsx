import { Component, Element, h, Method, Prop, State } from '@stencil/core';
/**
 * @slot header - The top of the modal.
 * @slot footer - Replaces the bottom button.
 * @slot language - Replaces language label, has replaceable props `{name}`, `{code}`, `{country_code}`.
 * @slot currency - Replaces currency label, has replaceable props `{name}`, `{code}`, `{country_code}`.
 */
@Component({ tag: 'salla-localization-modal', styleUrl: 'salla-localization-modal.css' })

export class SallaLocalizationModal {
  constructor() {
    salla.event.on('localization::open', () => this.open());

    salla.lang.onLoaded(() => {
      this.translationLoaded = true;
    });

    /**
     * letting developer to insert his own slot like:
     * <salla-localization>
     *   <div slot="language">...{name}....</div>
     *   <div slot="currency">...{name}....</div>
     * </salla-localization>
     * Because scoped templates not supported in stencil );
     * we made a workaround to pass language & currency attributes, then replace names in rendering
     */
    this.languageSlot = this.host.querySelector('[slot="language"]')?.innerHTML || '<label class="s-localization-modal-label" for="lang-{code}"><span>{name}</span><div class="s-localization-modal-flag flag iti__flag iti__{country_code}"></div></label>';
    this.currencySlot = this.host.querySelector('[slot="currency"]')?.innerHTML || '<label class="s-localization-modal-label" for="currency-{code}"><span>{name}</span><small class="s-localization-modal-currency">{code}</small></label>';
  }

  private modal: HTMLSallaModalElement;
  private btn: HTMLSallaButtonElement;
  private readonly languageSlot: string;
  private readonly currencySlot: string;

  @State() translationLoaded: boolean = false;
  @State() languages: Array<any> = [];
  @State() currencies: Array<any> = [];
  @State() hasError: boolean = false;
  @State() errorMessage: string;



  /**
   * Current language (existing or newly selected)
   */
  @Prop({ mutable: true, reflect: true }) language: string = salla.config.get('user.language_code');

  /**
   * Current currency (existing or newly selected)
   */
  @Prop({ mutable: true, reflect: true }) currency: string = salla.config.get('user.currency_code');

  @Element() host: HTMLElement;

  /**
   * open the component
   */
  @Method()
  async open() {
    this.modal.open()
    return await salla.api.withoutNotifier(() => this.getLanguages())
      .then(() => this.getCurrencies())
      .then(() => {
        if (this.languages.length < 2 && this.currencies.length < 2) {
          this.modal.close();
        }
      })
      .catch(e => {
        console.log(e)
        this.hasError = true;
        this.errorMessage = e.response?.data?.error?.message || e.response?.data;
      })
      .finally(() => this.modal.stopLoading());
  }

  /**
   * Hide the component
   */
  @Method()
  async close() {
    return this.modal.close();
  }

  private async getLanguages() {
    this.language = this.language || salla.config.get('user.language_code');
    return this.languages.length > 1 ? null : await salla.config.languages().then(data => this.languages = data);
  }

  private async getCurrencies() {
    this.currency = this.currency || salla.config.get('user.currency_code');
    return this.currencies.length > 1 ? null : await salla.config.currencies().then(data => this.currencies = Object.values(data || {}));
  }

  private onChangeCurrency(event) {
    this.currency = event.target.value;
  }

  private onChangeLanguage(event) {
    this.language = event.target.value;
  }

  /**
   * Change currency and language to the selected ones.
   */
  @Method()
  async submit() {
    let url: string;
    this.btn.load()
      .then(() => {
        if (!this.currency) {
          salla.log('There is no currency!');
          return;
        }
        if (this.currency === salla.config.get('user.currency_code', 'SAR')) {
          return;
        }
        url = window.location.href;
        return salla.currency.api.change(this.currency);
      })
      .then(() => {
        if (this.language !== salla.config.get('user.language_code', 'ar')) {
          url = salla.helpers.addParamToUrl('lang', this.language)
        }
      })
      .then(() => this.btn.stop())
      .then(() => this.close())
      .then(() => {
        if(url){
          window.location.href = url.replace(`/${salla.config.get('user.language_code')}/`,`/${this.language}/`);
        }
      });
  }

  render() {
    return (
      <salla-modal isLoading={true} class="s-hidden" ref={modal => this.modal = modal as HTMLSallaModalElement} width="xs">
        <div slot='loading'>
          <div class="s-localization-modal-skeleton">
            <salla-skeleton width='25%' height='15px'></salla-skeleton>
            <div class="s-localization-modal-skeleton-content">
              {[...Array(4)].map(() =>
                <div class="s-localization-modal-skeleton-item">
                  <div class="s-localization-modal-skeleton-item-flex">
                    <salla-skeleton type='circle' height='16px' width='16px'></salla-skeleton>
                    <salla-skeleton height='10px' width='100px'></salla-skeleton>
                  </div>
                  <salla-skeleton height='15px' width='20px'></salla-skeleton>
                </div>
              )}
            </div>
            <salla-skeleton width='25%' height='15px'></salla-skeleton>
            <div class="s-localization-modal-skeleton-content">
              {[...Array(4)].map(() =>
                <div class="s-localization-modal-skeleton-item">
                  <div class="s-localization-modal-skeleton-item-flex">
                    <salla-skeleton type='circle' height='16px' width='16px'></salla-skeleton>
                    <salla-skeleton height='10px' width='100px'></salla-skeleton>
                  </div>
                  <salla-skeleton height='15px' width='20px'></salla-skeleton>
                </div>
              )}
            </div>
            <salla-skeleton height='40px' width='100%'></salla-skeleton>
          </div>
        </div>
        {!!this.hasError ?
          <salla-placeholder alignment="center">
            <span slot="description">{this.errorMessage}</span>
          </salla-placeholder> :
          <div class="s-localization-modal-inner">
            {this.languages.length > 1 ?
              <div class="s-localization-modal-section">
                <label class="s-localization-modal-title">{salla.lang.get('common.titles.language')}</label>
                <div class="s-localization-modal-section-inner">
                  {this.languages.length < 6 || this.currencies.length == 1 ?
                    this.languages.map(lang =>
                      <div class="s-localization-modal-item">
                        <input class="s-localization-modal-input" type="radio"
                          checked={this.language == lang.iso_code}
                          onChange={() => this.language = lang.iso_code}
                          name="language"
                          id={'lang-' + lang.code.toLowerCase()}
                          value={lang.code} />
                        <div class="s-localization-modal-label-slot" id="language-slot" innerHTML={this.languageSlot
                          .replace(/\{name\}/g, lang.name)
                          .replace(/\{code\}/g, lang.code)
                          .replace(/\{country_code\}/g, lang.country_code)}></div>
                      </div>
                    ) :
                    <select class="s-localization-modal-select" name="language" onChange={e => this.onChangeLanguage(e)}>
                      {this.languages.map(lang =>
                        <option value={lang.code} selected={this.language == lang.code}>{lang.name}</option>
                      )}
                    </select>
                  }
                </div>
              </div>
              : ''
            }

            {this.currencies.length > 1 ?
              <div class="s-localization-modal-section">
                <label class="s-localization-modal-title">{salla.lang.get('common.titles.currency')}</label>
                <div class="s-localization-modal-section-inner">
                  {this.currencies.length < 6 || this.languages.length == 1 ?
                    this.currencies.map(currency =>
                      <div class="s-localization-modal-item">
                        <input class="s-localization-modal-input" type="radio"
                          name="currency"
                          checked={this.currency == currency.code}
                          onChange={() => this.currency = currency.code}
                          id={'currency-' + currency.code}
                          value={currency.code} />
                        <div class="s-localization-modal-label-slot" id="currency-slot" innerHTML={this.currencySlot
                          .replace(/\{name\}/g, currency.name)
                          .replace(/\{code\}/g, currency.code)
                          .replace(/\{country_code\}/g, currency.country_code)}></div>
                      </div>
                    ) :
                    <select class="s-localization-modal-select" name="currency" onChange={e => this.onChangeCurrency(e)}>
                      {this.currencies.map(currency =>
                        <option value={currency.code} selected={this.currency == currency.code}>{currency.name}</option>
                      )}
                    </select>
                  }
                </div>
              </div>
              : ''
            }
            <salla-button width="wide" ref={btn => this.btn = btn} onClick={() => this.submit()}>
              {salla.lang.get('common.elements.ok')}
            </salla-button>
          </div>
        }
      </salla-modal>
    );
  }

  /**
   * to reduce dom levels we will move slot data into the parent dom
   */
  componentDidRender() {
    this.host.querySelectorAll('#currency-slot').forEach(el => el.replaceWith(el.firstChild));
    this.host.querySelectorAll('#language-slot').forEach(el => el.replaceWith(el.firstChild));
  }
}
