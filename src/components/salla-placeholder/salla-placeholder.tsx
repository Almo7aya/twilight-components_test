import { Component, Prop, State, h, Host } from '@stencil/core';
import Inbox from '../../assets/svg/inbox.svg';

/**
 * @slot title - The primary content of the placeholder.
 * @slot description - Additional content displayed below the title.
 */
@Component({
  tag: 'salla-placeholder',
  styleUrl: 'salla-placeholder.css',
})
export class SallaPlaceholder {

  constructor() {
    salla.lang.onLoaded(() => {
      this.translationLoaded = true;
    });
  }

  @State() translationLoaded: boolean = false;

  /**
   * Custom icon to display, defaults to [`Inbox`], can be any valid svg icon or inline element with font icon
   */
  @Prop() icon: string = Inbox;

  /**
   * Defines the alignment of contents. Defaults to [`left`]
   */
  @Prop() alignment: 'left' | 'center' | 'right' = 'left';

  /**
    * The size of the icon. Defaults to [`md`] = 45px for font icon & width/height: 3.5rem for svg icon
    */
  @Prop() iconSize: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl' | 'xxxl' = 'md';


  private alignmentClass() {
    return {
      's-placeholder-wrapper': true,
      's-placeholder-align-left': this.alignment == 'left',
      's-placeholder-align-center': this.alignment == 'center',
      's-placeholder-align-right': this.alignment == 'right',
    }
  }


  render() {
    return (
      <Host class={this.alignmentClass()}>
        <div class={`s-placeholder-icon s-placeholder-icon-${this.iconSize}`} innerHTML={this.icon}></div>
        <div class="s-placeholder-title">
          <slot name='title'>
            <span>
              {salla.lang.get('common.elements.no_options')}
            </span>
          </slot>
        </div>

        <div class="s-placeholder-description">
          <slot name='description'>
            <span>
              {salla.lang.get('common.errors.empty_results')}
            </span>
          </slot>
        </div>
      </Host >
    );
  }

}
