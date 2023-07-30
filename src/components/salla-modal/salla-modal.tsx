import { Component, Element, h, Host, Method, Prop, State, Watch, Event, EventEmitter, Listen } from '@stencil/core';
import CancelIcon from '../../assets/svg/cancel.svg';
import AlertEngineIcon from '../../assets/svg/alert-engine.svg';
import CheckCircleIcon from '../../assets/svg/check-circle2.svg';
import Helper from '../../Helpers/Helper';

/**
 * @slot footer - The footer of modal
 */

@Component({ tag: 'salla-modal', styleUrl: 'salla-modal.css' })
export class SallaModal {
  constructor() {
    salla.event.on('modal::open', target => target == this.host.id && this.open());
    salla.event.on('modal::close', target => target == this.host.id && this.close());
    this.modalTitle = this.host.getAttribute('modal-title');
  }

  /**
   * Sets the modal to be closable. Defaults to `true`
   */
  @Prop({ mutable: true }) isClosable: boolean = true;//todo::rename unclude. Suggestion => persistent
  /**
   * The size of the modal
   */
  @Prop({ reflect: true }) width: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'full' = 'md';
  /**
   * The position of the modal
   */
  @Prop({ reflect: true }) position: 'top' | 'middle' | 'bottom' = 'middle';
  /**
   * open the modal on rendering
   */
  @Prop({ reflect: true }) visible: boolean = false;
  /**
   * open the modal on rendering
   */
  @Prop({ reflect: true }) hasSkeleton: boolean = false;
  /**
   * Show loading in the middle
   */
  @Prop({ reflect: true, mutable: true }) isLoading: boolean = false;

  /**
   * Show subtitle before the title or not, defaults to `false` (after the title)
   */
  @Prop() subTitleFirst: boolean = false;//todo:: choose better name

  /**
   * Avoid padding in the modal body or not, defaults to `false`
   */
  @Prop() noPadding: boolean = false;//todo:: choose better name

  /**
   * Set modal sub title.
   */
  @Prop() subTitle: string = '';

  /**
   * Align modal content to center, defaults to `false`
   */
  @Prop() centered: boolean = false;

  /**
   * Set the style of the header icon.
   */
  @Prop() iconStyle: 'error' | 'success' | 'primary' | 'normal' = undefined;

  @State() modalTitle: string;

  private overlay: HTMLElement;

  @Element() host: HTMLElement;

  /**
   * Event emitted when the modal visibilty is changed.
   */
  @Event() modalVisibilityChanged: EventEmitter<Boolean>;

  @Watch('visible')
  handleVisible(newValue: boolean) {
    if (!newValue) {
      this.modalVisibilityChanged.emit(false);
      this.toggleModal(false);
      return;
    }
    this.modalVisibilityChanged.emit(true);
    this.host.classList.remove('s-hidden');
    setTimeout(() => this.toggleModal(true)); //small amont of time to running toggle After adding hidden
  }

  @Listen('keyup')
  handleKeyUp(ev: KeyboardEvent) {
    if (ev.key === "KeyUp") {
      this.closeModal()
    }
  }

  /**
   * Open the modal
   */
  @Method()
  async open() {
    this.host.setAttribute('visible', '');
    this.handleAutoFocus();
    return this.host;
  }

  /**
   * close the modal
   */
  @Method()
  async close() {
    this.host.removeAttribute('visible');
    return this.host;
  }

  /**
   * Change the Modal Title
   * @param {string} modalTitle
   */
  @Method()
  async setTitle(modalTitle) {
    this.modalTitle = modalTitle;
    return this.host;
  }

  /**
   * Start loading
   */
  @Method()
  async loading() {
    this.isLoading = true;
    return this.host;
  }


  /**
   * Stop the loading
   */
  @Method()
  async stopLoading() {
    this.isLoading = false;
    return this.host;
  }

  private handleAutoFocus() {
    const firstFocusableElement = this.host.querySelector('input, textarea, select') as HTMLElement;
    if (!firstFocusableElement) {
      return;
    }
    setTimeout(() => {
      firstFocusableElement.focus();
    }, 100);
  }

  private toggleModal(isOpen) {
    const body = this.host.querySelector('.s-modal-body');
    Helper.toggleElementClassIf(body, 's-modal-entering', 's-modal-leaving', () => isOpen)
      .toggleElementClassIf(this.overlay, 's-modal-entering', 's-modal-overlay-leaving', () => isOpen)
      .toggleElementClassIf(document.body, 'modal-is-open', 'modal-is-closed', () => isOpen);
    if (!isOpen) {
      setTimeout(() => this.host.classList.add('s-hidden'), 350);
    }
  }

  private closeModal() {
    if (!this.isClosable) {
      return;
    }
    this.host.removeAttribute('visible');
  }

  private iconBlockClasses() {
    return {
      's-modal-icon': true,
      's-modal-bg-error': this.iconStyle == 'error',
      's-modal-bg-success': this.iconStyle == 'success',
      's-modal-bg-normal': !this.iconStyle,
      's-modal-bg-primary': this.iconStyle == 'primary'
    };
  }

  private getWidth() {
    return this.isLoading ? (this.hasSkeleton ? 'md' : 'xs') : this.width
  }

  //todo:: pref for each modal
  render() {
    this.host.id = this.host.id || 'salla-modal';


    if (this.isLoading) {
      return (
        <Host class='salla-modal s-modal s-modal-container s-hidden' aria-modal="true" role="dialog" onKeyUp={e => this.handleKeyUp(e)}>
          <div class="s-modal-overlay" ref={el => this.overlay = el} onClick={() => this.closeModal()} />
          <div class="s-modal-wrapper">
            <span class={'s-modal-spacer s-modal-align-' + this.position}>&#8203;</span>
            <div class={'s-modal-body ' + 's-modal-align-' + this.position + ' s-modal-' + this.getWidth() + (this.noPadding ? ' s-modal-nopadding' : ' s-modal-padding')}>
              <slot name="loading">
                <salla-loading></salla-loading>
              </slot>
              {
                // we have a limitations with StencilJS, when the component is not shadow
                // all the dom of host append to component even if <slot /> is not in the render
                // So we'll use a workaround, render all the slot as hidden when is loading
                // @see https://github.com/ionic-team/stencil/issues/399
              }
              <div class="s-hidden">
                <slot />
              </div>
            </div>
          </div>
        </Host>
      );
    }


    return (
      <Host class='salla-modal s-modal s-modal-container s-hidden' aria-modal="true" role="dialog">
        <div class="s-modal-overlay" ref={el => this.overlay = el} onClick={() => this.closeModal()} />
        <div class="s-modal-wrapper">
          <span class={'s-modal-spacer s-modal-align-' + this.position}>&#8203;</span>
          <div
            class={'s-modal-body ' + 's-modal-align-' + this.position + ' s-modal-' + this.getWidth() + (this.noPadding ? ' s-modal-nopadding' : ' s-modal-padding')}>
            <div class={{ 's-modal-header': true, 's-modal-is-center': this.centered }}>
              {this.isClosable ?
                <button class="s-modal-close" onClick={() => this.closeModal()} type="button">
                  <span innerHTML={CancelIcon} />
                </button>
                : ''}

              {this.modalTitle || this.subTitle ?
                <div class="s-modal-header-inner">
                  <slot name='icon'>
                    {!!this.iconStyle ?
                      <div class={this.iconBlockClasses()} innerHTML={this.iconStyle == 'error' ? AlertEngineIcon : CheckCircleIcon} />
                      : ''
                    }
                  </slot>
                  <div class="s-modal-header-content">
                    {this.modalTitle ? <div class={{ 's-modal-title': true, 's-modal-title-below': this.subTitleFirst }}
                      innerHTML={this.modalTitle} /> : ''}
                    {this.subTitle ? <p class={{ 's-modal-sub-title': true }} innerHTML={this.subTitle} /> : ''}
                  </div>
                </div>
                : ''}
            </div>
            <slot />
            <slot name="footer" />

          </div>
        </div>
      </Host>
    );
  }
  //move the modal as root dom, because we need the model to be outside the forms
  componentDidLoad() {
    document.body.append(this.host);
  }
}
