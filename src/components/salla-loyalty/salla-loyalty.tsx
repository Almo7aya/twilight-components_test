import {Item, LoyaltyProgram, Prize} from './loyalty-schema';
import {Component, h, Method, Prop, State} from '@stencil/core';
import Star2 from '../../assets/svg/star2.svg';
import Star3 from '../../assets/svg/star3.svg';
import CancelIcon from '../../assets/svg/cancel.svg';
import GiftImg from '../../assets/svg/flat.svg';

/**
 * @slot widget - When used, will activate the component and needs to emit `loyalty::open` event to open the modal. If not provided the default value will be used.
 * @slot points-applied-widget -  Widget to show information about the already exchanged points. It should have it's own resetting action and call the `resetExchange` method. If not provided, it will use the default value.
 */
@Component({
  tag: 'salla-loyalty',
  styleUrl: 'salla-loyalty.css',
})
export class SallaLoyalty {

  constructor() {
    salla.event.on('loyalty::open', () => this.open());

    salla.auth.event.onLoggedIn(() => {
      this.is_loggedin = true
    })

    salla.onReady(() => {
      this.is_loggedin = salla.config.isUser()
    })

    salla.lang.onLoaded(() => {
      this.guestMessage = salla.lang.get('pages.loyalty_program.guest_message');
      this.translationLoaded = true;
    })

    salla.cart.event.onUpdated(cart => {
      this.prizePoints = cart.loyalty.prize?.points;
      this.prizeTitle = cart.loyalty.prize?.title;
      this.customerPoints = cart.loyalty.customer_points || this.customerPoints;
    })
  }

  private modal: HTMLSallaModalElement;
  private confirmationModal: HTMLSallaModalElement;

  @State() loyaltyProgram: LoyaltyProgram;
  @State() buttonLoading: boolean;
  @State() selectedItem: Item | undefined = undefined;
  @State() askConfirmation: boolean;
  @State() is_loggedin: boolean;
  @State() hasError: boolean;

  @State() errorMessage: string;

  //todo:: drop it
  @State() translationLoaded: boolean;

  /**
   * The exchanged prize point
   */
  @Prop({mutable: true, reflect: true}) prizePoints: string | number;

  /**
   * Available customer points with which they can exchange.
   */
  @Prop({mutable: true, reflect: true}) customerPoints: number;

  /**
   * The prize title
   */
  @Prop({mutable: true, reflect: true}) prizeTitle: string;

  /**
   * Does the merchant allow to login using email
   */
  @Prop() allowEmail: boolean = true;

  /**
   * Does the merchant/current location for visitor allow to login using mobile, By default outside KSA is `false`
   */
  @Prop() allowMobile: boolean = true;

  /**
   * Does the merchant require registration with email & mobile
   */
  @Prop() requireEmail: boolean = false;

  //todo:: change it to state
  /**
   * Message to show for guest users.
   */
  @Prop({mutable: true}) guestMessage: string


  private setSelectedPrizeItem(item) {
    if (!this.selectedItem || this.selectedItem?.id != item.id) {
      this.selectedItem = item;
    } else {
      this.selectedItem = undefined
    }
  }

  private handleLongText(text: string) {
    if (text.length > 150) {
      return text.substring(0, 150) + '...';
    }

    return text;
  }

  private prizeItem(item: Item) {
    let klass = {
      's-loyalty-prize-item-selected': !!this.selectedItem && this.selectedItem?.id == item.id,
      "s-loyalty-prize-item": true
    }
    return <div onClick={() => this.setSelectedPrizeItem(item)} class={klass}>
      <img class="s-loyalty-prize-item-image" src={item.image} alt={item.name}/>
      <div class="s-loyalty-prize-item-title">{item.name}</div>
      <div class="s-loyalty-prize-item-subtitle">{this.handleLongText(item.description)}</div>
      <div class="s-loyalty-prize-item-points">
        {item.cost_points} {salla.lang.get('pages.loyalty_program.point')}
        <div class="s-loyalty-prize-item-check">
          <div></div>
        </div>
      </div>
    </div>
  }

  private getConfirmationModal() {
    return [
      <salla-placeholder alignment="center" icon={Star3} class="s-loyalty-confirmation-modal-content">
        <div slot="title" class="s-loyalty-confirmation-title">
          {salla.lang.get('pages.loyalty_program.exchange_points')}
        </div>
        <div slot="description">
          {salla.lang.get('pages.loyalty_program.are_you_sure_to_exchange')} ( <strong>{this.selectedItem?.cost_points}</strong> {salla.lang.get('pages.loyalty_program.point')} ) {salla.lang.get('pages.loyalty_program.for')} ( <strong>{this.selectedItem?.name}</strong> )
        </div>
      </salla-placeholder>,
      <div class="s-loyalty-confirmation-actions">
        <salla-button fill='outline' width="wide"
                      onClick={() => this.cancelProcess()}>{salla.lang.get('pages.loyalty_program.cancellation')}</salla-button>
        <salla-button loading={this.buttonLoading} width="wide"
                      onClick={() => this.exchangeLoyaltyPoint()}>{salla.lang.get('pages.loyalty_program.confirm')}</salla-button>
      </div>
    ]
  }

  private getAfterExchangeUI() {
    return <slot name='points-applied-widget'>
      <salla-list-tile class="s-loyalty-after-exchange">
        <div slot="title" class="s-loyalty-after-exchange-title">
          {this.prizeTitle} &nbsp; - &nbsp; {this.prizePoints} {salla.lang.get('pages.loyalty_program.point')}
        </div>
        <div slot='action' class="s-loyalty-after-exchange-action">
          <salla-button class="s-loyalty-after-exchange-reset" shape="icon" fill='outline' color="danger" size="small"
                        onClick={() => this.resetExchange()}>
            <span innerHTML={CancelIcon}/>
          </salla-button>
        </div>
      </salla-list-tile>
    </slot>
  }

  /**
   * Show loyalty modal
   */
  @Method()
  async open() {
    if (!this.is_loggedin) return salla.event.dispatch('login::open');
    this.modal?.open()
    return await salla.loyalty.getProgram()
      .then(response => {
        this.loyaltyProgram = response.data as LoyaltyProgram
      })
      .catch(e => {
        this.hasError = true;
        this.errorMessage = e.response?.data?.error?.message || e.response?.data;
      })
      .finally(() => this.modal?.stopLoading())

  }

  /**
   *
   * Hide loyalty modal
   */
  @Method()
  async close() {
    return this.modal.close();
  }

  /**
   *
   * Cancel Exchanged prizes
   */
  @Method()
  async resetExchange() {
    return await salla.loyalty.reset();
  }

  /**
   * Open Confirmation modal
   */
  private async openConfirmation() {
    return await this.modal.close()
      .then(() => this.confirmationModal?.open())
      .catch(e => console.log(e))
  }

  /**
   * Cancel process
   */
  private async cancelProcess() {
    return await this.confirmationModal.close()
      .then(() => this.selectedItem = null)
      .catch(e => console.log(e))
  }

  /**
   * Exchange loyalty points with the selected prize item
   * @param {number} loyalty_prize_id
   *
   */
  @Method()
  async exchangeLoyaltyPoint() {
    this.buttonLoading = true;
    return await salla.loyalty.exchange(this.selectedItem?.id)
      .then(() => this.selectedItem.key == "FREE_PRODUCT" && salla.url.is_page('cart') && window.location.reload())
      .finally(() => {
          this.buttonLoading = false;
          this.cancelProcess()
        }
      )
  }

  render() {
    // A. when the exchange is done, and we have the final prize points to show it in cart page
    if (this.prizePoints) {
      return this.getAfterExchangeUI();

    }
    //todo:: change all translations to states
    return [
      <slot name='widget'>
        {/* B. he wants to use the default widget by pass the customer points . */}
        {
          this.customerPoints ?
            <salla-list-tile class='s-loyalty-widget'>
              <div slot="icon" class="s-loyalty-widget-icon" innerHTML={Star2}/>
              <div slot="subtitle">
                {this.customerPoints ? salla.lang.get('pages.loyalty_program.cart_total_point_summary', {"balance": this.customerPoints}) : this.guestMessage}
                <salla-button shape="link" color="primary" onClick={() => salla.event.dispatch("loyalty::open")}>
                  {this.customerPoints ? salla.lang.get('pages.loyalty_program.cart_point_exchange_now') : salla.lang.get('blocks.header.login')}
                </salla-button>
              </div>
            </salla-list-tile> :
            ''
        }
      </slot>,
      <salla-modal noPadding width="sm"
                   ref={modal => this.confirmationModal = modal}>
        {this.getConfirmationModal()}
      </salla-modal>,
      <salla-modal isLoading={true} has-skeleton={true} width="md" ref={modal => this.modal = modal}>
        <div slot="loading">
          <div class="s-loyalty-skeleton">
            <salla-list-tile class="s-loyalty-header">
              <div slot="icon" class="s-loyalty-header-icon">
                <salla-skeleton type="circle" height='6rem' width='6rem'/>
              </div>

              <div slot="title" class="s-loyalty-header-title mb-5">
                <salla-skeleton height='15px' width='50%'/>
              </div>
              <div slot="subtitle" class="s-loyalty-header-subtitle">
                <salla-skeleton height='10px'/>
                <salla-skeleton height='10px' width='75%'/>
              </div>

            </salla-list-tile>
            <div class="s-loyalty-skeleton-cards">
              {[...Array(3)].map(() =>
                <div class="s-loyalty-prize-item swiper-slide">
                  <salla-skeleton height='9rem'/>
                  <div class="s-loyalty-prize-item-title">
                    <salla-skeleton height='15px' width='75%'/>
                  </div>
                  <div class="s-loyalty-prize-item-subtitle">
                    <salla-skeleton height='10px' width='50%'/>
                    <salla-skeleton height='10px' width='25%'/>
                  </div>
                  <div class="s-loyalty-prize-item-points">
                    <salla-skeleton height='15px' width='100px'/>
                    <div class="s-loyalty-prize-item-check">
                      <salla-skeleton height='1rem' width='1rem' type='circle'/>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        {
          !this.hasError && !!this.loyaltyProgram ?
            [
              <salla-list-tile id='s-loyalty-header' class="s-loyalty-header">
                <div slot="icon" class="s-loyalty-header-icon" innerHTML={GiftImg}/>

                <div slot="title" class="s-loyalty-header-title">
                  {this.loyaltyProgram.prize_promotion_title}
                </div>

                <div slot="subtitle" class="s-loyalty-header-subtitle">
                  {this.loyaltyProgram.prize_promotion_description}
                </div>

              </salla-list-tile>,
              <salla-tabs>
                {this.loyaltyProgram.prizes.map((prize: Prize) =>
                  <salla-tab-header slot="header" name={prize.title}>
                    <span>{prize.title}</span>
                  </salla-tab-header>
                )}
                {this.loyaltyProgram.prizes.map((prize: Prize, index) =>
                  <salla-tab-content slot="content" name={prize.title}>
                    <salla-slider
                      class="s-loyalty-slider"
                      loop={false}
                      controls-outer={true}
                      id={'loyalty-popup-slider-' + index}
                      type="carousel">
                      <div slot='items'>
                        {prize.items.map((item: Item) =>
                          this.prizeItem(item)
                        )}
                      </div>
                    </salla-slider>
                  </salla-tab-content>
                )}
              </salla-tabs>,
              <salla-button disabled={!this.selectedItem} width="wide"
                            class="s-loyalty-program-redeem-btn"
                            onClick={() => this.openConfirmation()}>{salla.lang.get('pages.loyalty_program.exchange_points')}</salla-button>,

            ]
            : <salla-placeholder class="s-loyalty-placeholder" alignment="center">
              {!!this.errorMessage ? <span slot="description">{this.errorMessage}</span> : ''}
            </salla-placeholder>
        }
      </salla-modal>,
    ];
  }
}
