import { Component, Host, h, Element, Prop, State } from '@stencil/core';
import infoIcon from '../../assets/svg/info.svg';
import shoppingBag from '../../assets/svg/shopping-bag2.svg';
@Component({
  tag: 'salla-bottom-alert',
  styleUrl: 'salla-bottom-alert.css',
})
export class SallaBottomAlert {
  constructor() {
    salla.lang.onLoaded(() => {
      this.defaultMessage = salla.lang.get('common.elements.experimental_and_available_store');
      this.defaultActionLabel = salla.lang.get('common.elements.know_more');
      this.storeFeatures = salla.lang.get('common.elements.store_features');
      this.storeDetails = salla.lang.get('common.elements.store_details');
      this.templateInformation = salla.lang.get('common.elements.template_information');
      this.buyTheTemplate = salla.lang.get('common.elements.buy_the_template');
    });
  }

  private modal: HTMLSallaModalElement;
  @Element() host: HTMLElement;

  @State() storeId: string = salla.config.get('store.id')
  @State() loading: boolean = false
  @State() templateData: any = {}
  @State() defaultMessage: string = salla.lang.get('common.elements.experimental_and_available_store');
  @State() defaultActionLabel: string = salla.lang.get('common.elements.know_more');
  @State() storeFeatures: string = salla.lang.get('common.elements.store_features');
  @State() storeDetails: string = salla.lang.get('common.elements.store_details');
  @State() templateInformation: string = salla.lang.get('common.elements.template_information');
  @State() buyTheTemplate: string = salla.lang.get('common.elements.buy_the_template');
  /**
   * Alert Type
   * */
  @Prop({ reflect: true }) type: 'link' | 'popup' | 'banner' = 'popup';

  /**
   * Alert Icon class from salla icons library - ex: sicon-user
   * */
  @Prop({ reflect: true }) icon: string;

  /**
   * Alert Message
   * */
  @Prop({ reflect: true }) message: string;

  /**
   * Button url - used when type is link
   * */
  @Prop({ reflect: true }) actionUrl: string;

  /**
   * Button label - used when type is link and popup
   * */
  @Prop({ reflect: true }) actionLabel: string;

  private open() {
    return this.modal.open()
      .then(() => this.handleTemplateRequest())
  }

  private handleTemplateRequest() {
    if (Object.keys(this.templateData).length) {
      return;
    }
    this.modal.loading()
    return salla.api.request(`/store/template`, {}, 'get', { 'Store-Identifier': this.storeId })
      .then((res) => {
        this.modal.setTitle(this.templateInformation)
        this.templateData = res.data
        this.modal.stopLoading()
      })
      .catch(() => {
        this.modal.close()
      })
  }

  private handleAction() {
    if (this.type === 'link') {
      window.location.href = this.actionUrl;
    }

    if (this.type === 'popup') {
      this.open()
    }
  }

  popup() {
    return (
      <salla-modal class="s-bottom-alert-modal" ref={modal => this.modal = modal} no-padding>
        {Object.keys(this.templateData).length ?
          [<div class="s-bottom-alert-modal-inner s-scrollbar">
            {Array.isArray(this.templateData?.screenshots) && this.templateData?.screenshots?.length ? <div class="s-bottom-alert-modal-cover">
              <img src={this.templateData?.screenshots[0]} alt="" />
            </div> : ''}
            <div class="s-bottom-alert-modal-content">
              {this.templateData?.description ?
                [<div class="s-bottom-alert-modal-content-title">
                  {this.storeDetails}
                </div>,
                <div class="s-bottom-alert-modal-content-description" innerHTML={this.templateData?.description}></div>,
                <hr />
                ] : ''}
              {this.templateData?.features ? [<div class="s-bottom-alert-modal-content-title">
                {this.storeFeatures}
              </div>,
              <div class="s-bottom-alert-modal-content-features" innerHTML={this.templateData?.features}></div>
              ] : ''}
              {Array.isArray(this.templateData?.screenshots) && this.templateData?.screenshots?.length > 1 ?
                <salla-slider id='template-screenshots' type='carousel' class="s-bottom-alert-modal-content-screenshots">
                  <div slot='items'>
                    {this.templateData?.screenshots.map((screenshot) => {
                      return <div class="s-bottom-alert-modal-content-screenshot">
                        <img src={screenshot} alt="" />
                      </div>
                    })}
                  </div>
                </salla-slider>
                : ''}

              {this.templateData?.extra_info ?
                <div class="s-bottom-alert-modal-content-description" innerHTML={this.templateData?.description}></div>
                : ''}

              {this.templateData?.link ?
                <div class="s-bottom-alert-modal-content-footer">
                  <salla-button
                    color='primary'
                    size="medium"
                    width='wide'
                    href={this.templateData?.link}
                  >
                    <i innerHTML={shoppingBag}></i>
                    {this.buyTheTemplate}
                  </salla-button>
                </div> : ''
              }

            </div>
          </div>] : ''
        }

      </salla-modal>
    )
  }
  render() {
    return (
      <Host class="s-bottom-alert-wrapper">
        <div class="s-bottom-alert-content">
          <div class="s-bottom-alert-icon">
            {this.icon ? <i class={this.icon}></i> : <i innerHTML={infoIcon}></i>}
          </div>
          <div class="s-bottom-alert-message">
            {this.message ? this.message : this.defaultMessage}
          </div>
          {this.type !== 'banner' ? (
            <div class="s-bottom-alert-action">
              <salla-button
                href={this.actionUrl}
                size="medium"
                onClick={() => this.handleAction()}
                width="normal"
              >
                {this.actionLabel ? this.actionLabel : this.defaultActionLabel}
              </salla-button>
            </div>
          ) : null}
          {
            this.type === 'popup' ? this.popup() : null
          }
        </div>
      </Host>
    );
  }

}
