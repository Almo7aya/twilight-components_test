import { Component, Host, h, State, Method, Element, Prop } from '@stencil/core';
import CartIcon from "../../assets/svg/cart.svg"
import anime from 'animejs';

@Component({
  tag: 'salla-cart-summary',
  styleUrl: 'salla-cart-summary.css',
})
export class SallaCartSummary {
  constructor() {
    salla.cart.event.onUpdated((response) => {
      this.cartSummaryCount = response.count || 0;
      this.cartSummaryTotal = response.total || 0;
    });
  }

  @Element() host: HTMLElement;
  @State() cartSummaryCount: number = salla.storage.get('cart.summary.count') || 0;
  @State() cartSummaryTotal: number = salla.storage.get('cart.summary.total') || 0;
  @State() cartLabel: string = salla.config.get('user.language_code') === 'ar' ? 'السلة' : 'Cart';

  /**
   * Show cart label
   * */
  @Prop() showCartLabel: boolean;


  /**
   * Animate product Image to cart summary
   * @param image the image element to animate
   */
  @Method()
  async animateToCart(image) {
    document.querySelectorAll('.s-cart-thumb').forEach(el => el.remove());
    if (!image?.src) {
      salla.log('Failed to get the img element');
      return;
    }
    let
      cartBtn = this.host.querySelector('#s-cart-icon'),
      btnOffset = cartBtn.getBoundingClientRect(),
      btnTop = btnOffset.top + window.scrollY,
      btnLeft = btnOffset.left + window.scrollX;

    // get thumb position ---
    let position = image.getBoundingClientRect(),
      width = image.offsetWidth + 'px',
      height = image.offsetHeight + 'px',
      top = position.top,
      left = position.left

    // create thumb img element ---
    let img = document.createElement("img") as HTMLImageElement;
    img.src = image.getAttribute('src');
    img.className = "s-cart-thumb";
    img.setAttribute("style", "object-fit:cover; width:" + width + '; height:' + height + '; top:' + top + 'px; left:' + left + 'px;z-index:99999999; ')
    document.body.append(img);

    let cartThumb = document.querySelector('.s-cart-thumb');
    cartBtn.classList.remove('animated', 'rubberBand');

    // start timeline ---
    let cartThumbAnime = new (anime as any).timeline();
    cartThumbAnime.add({
      targets: cartThumb,
      width: [150, 30],
      height: [150, 30],
      top: [top, window.scrollY > 0 ? btnTop - window.scrollY - 40 : btnTop - 40],
      left: [left, btnLeft],
      borderRadius: ['20%', '50%'],
      easing: 'easeOutExpo',
      duration: 1200,
    }, '+=200')
      .add({
        targets: cartThumb,
        width: [30, 0],
        height: [30, 0],
        opacity: [1, 0],
        easing: 'easeOutExpo',
        top: [window.scrollY > 0 ? btnTop - window.scrollY - 40 : btnTop - 40, window.scrollY > 0 ? btnTop - window.scrollY + 10 : btnTop + 10],
        left: [btnLeft, btnLeft + 10],
      }, '-=500')
      .add({
        complete: function () {
          cartBtn.classList.add('animated', 'rubberBand');
          cartThumb.remove();
        },
      }, '-=1700');
  }

  render() {
    return (
      <Host>
        <a class="s-cart-summary-wrapper" href={salla.url.get('cart')}>
          <div id="s-cart-icon">
            <slot name="icon"><i class="s-cart-summary-icon" innerHTML={CartIcon}/></slot>
          </div>
          <span class="s-cart-summary-count">{salla.helpers.number(this.cartSummaryCount)}</span>

          <p class="s-cart-summary-content">
            {this.showCartLabel && <span class="s-cart-summary-label">{this.cartLabel}</span>}
            <b class="s-cart-summary-total">{salla.money(this.cartSummaryTotal)}</b>
          </p>
        </a>
      </Host>
    );
  }

}
