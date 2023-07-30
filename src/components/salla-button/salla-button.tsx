import {Component, Element, h, Method, Prop, Host} from '@stencil/core';

@Component({tag: 'salla-button', styleUrl: 'salla-button.css'})
export class SallaButton {
  private text: HTMLSpanElement;
  private hostAttributes: any = {};

  @Element() host: HTMLElement;

  /**
   * Button Type
   */
  @Prop({reflect: true}) shape: 'link' | 'icon' | 'btn' = 'btn';

  /**
   * Button Color
   */
  @Prop({reflect: true}) color: 'primary' | 'success' | 'warning' | 'danger' | 'light' | 'gray' | 'dark' = 'primary';

  /**
   * Button Fill
   */
  @Prop({reflect: true}) fill: 'solid' | 'outline' | 'none' = 'solid';

  /**
   * Button Size
   */
  @Prop({reflect: true}) size: 'small' | 'large' | 'medium' = 'medium';

  /**
   * Button Width
   */
  @Prop({reflect: true}) width: 'wide' | 'normal' = 'normal';

  /**
   * Is the button currently loading
   */
  @Prop({reflect: true}) loading: boolean = false;

  /**
   * Is the button currently disabled
   */
  @Prop({reflect: true}) disabled: boolean = false;

  /**
   * If there is need to change loader position, pass the position
   */
  @Prop() loaderPosition: 'start' | 'end' | 'center' | 'after' = 'after';

  /**
   * Button with href as normal link
   */
  @Prop() href: string;

  /**
   * Run loading animation
   */
  @Method()
  async load() {
    if (this.loaderPosition == 'center')
      this.text.classList.add('s-button-hide');

    this.host.setAttribute('loading', '');
    return this.host;
  }

  /**
   * Stop loading animation
   */
  @Method()
  async stop() {
    this.host.removeAttribute('loading');
    this.host.querySelector('button').removeAttribute('loading');

    if (this.loaderPosition == 'center')
      this.text.classList.remove('s-button-hide');

    return this.host;
  }

  /**
   * Changing the body of the button
   * @param html
   */
  @Method()
  async setText(html: string) {
    this.text.innerHTML = html;
    return this.host;
  }

  /**
   * Add `disabled` attribute
   */
  @Method()
  async disable() {
    this.host.setAttribute('disabled', '');
    return this.host;
  }

  /**
   * Remove `disabled` attribute
   */
  @Method()
  async enable() {
    this.host.removeAttribute('disabled');
    return this.host;
  }

  private getBtnAttributes() {
    for (let i = 0; i < this.host.attributes.length; i++) {
      if (!['color', 'fill', 'size', 'width', 'id'].includes(this.host.attributes[i].name)) {
        this.hostAttributes[this.host.attributes[i].name] = this.host.attributes[i].value;
      }
    }
    this.hostAttributes.type = this.hostAttributes.type || 'button';
    this.hostAttributes.class +=
      ' s-button-element s-button-' + this.shape
      + ' s-button-' + (this.fill == "none" ? 'fill-none' : this.fill)
      + (this.size != "medium" ? ' s-button-' + this.size : '')
      + (this.width != "normal" ? ' s-button-' + this.width : '')
      + (this.shape == "link" ? ' s-button-' + this.color + '-link' : '')
      + (this.shape != "link" && this.fill != 'outline' ? ' s-button-' + this.color : '')
      + (this.fill == 'outline' ? ' s-button-' + this.color + '-outline' : '')
      + (this.disabled ? ' s-button-disabled ' : '')
      + (this.shape == 'icon' ? ' s-button-loader-center' : ' s-button-loader-' + this.loaderPosition);
    return this.hostAttributes;
  }

  button() {
    return (
      <button {...this.getBtnAttributes()} disabled={this.disabled}>
        <span class="s-button-text" ref={el => this.text = el}><slot/></span>
        {this.loading ? <span class="s-button-loader"></span> : ''}
      </button>
    )
  }

  render() {
    //TODO:: find a better fix, this is a patch for issue that duplicates the buttons twice @see the screenshot inside this folder
    return this.host.closest('.swiper-slide')?.classList.contains('swiper-slide-duplicate')
      ? ''
      : (
      <Host class="s-button-wrap">
        {this.href ? <a href={this.href}>{this.button()}</a> : this.button() }
      </Host>
    );
  }
}
