import {Component, Host, h, Prop} from '@stencil/core';

/**
 * @slot icon - An icon to display before the title.
 * @slot title - The primary content of the list tile.
 * @slot subtitle - Additional content displayed below the title.
 * @slot action - An element to display after the title.
 */
@Component({
  tag: 'salla-list-tile',
  styleUrl: 'salla-list-tile.css',
  shadow: false,
})
export class SallaListTile {

  /**
   * Designates the component as anchor and applies the `href` attribute.
   */
  @Prop() href: string | undefined = undefined;

  /**
   * Designates the target attribute. This should only be applied when using the `href` prop.
   */
  @Prop() target: "_blank" | "_self" | "_parent" | "_top" | "framename" = "_self";

  private generateClass() {
    return {
      "s-list-tile-item": true,
      "s-list-tile-item-href": !!this.href
    }
  }

  render() {
    return (
      <Host>
        <a class={this.generateClass()} href={this.href} target={this.target}>
          <div class="s-list-tile-item-icon">
            <slot name='icon'/>
          </div>
          <div class="s-list-tile-item-content">
            <div class="s-list-tile-item-title">
              <slot name='title'/>
            </div>
            <div class="s-list-tile-item-subtitle">
              <slot name="subtitle"/>
            </div>
          </div>
          <div class="s-list-tile-item-action">
            <slot name='action'/>
          </div>
        </a>
      </Host>
    );
  }
}
