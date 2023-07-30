import { Component, h, Prop, Host } from '@stencil/core';

@Component({
  tag: 'salla-skeleton',
  styleUrl: 'salla-skeleton.css',
})
export class SallaSkeleton {


  /**
 *  Set the shape type of the skeleton is it circle or normal
 */

  @Prop() type: 'circle' | 'normal' = 'normal';

  /**
 *  Set the skeleton width
 */

  @Prop() width: string = '100%';

  /**
 *  Set the skeleton height
 */

  @Prop() height: string = '100%';

  render() {
    const classes = {
      's-skeleton-item': true,
      's-skeleton-item-circular': this.type == 'circle',
    };
    return (
        <Host class="s-skeleton-wrapper" style={{ width: this.width, height: this.height }}>
          <div class={classes} >&nbsp;</div>
        </Host>
    );
  }

}
