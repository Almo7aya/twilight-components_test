import { Component, Host, h } from '@stencil/core';

@Component({
  tag: 'salla-test',
  styleUrl: 'salla-test.css',
})
export class SallaTest {

  render() {
    return (
      <Host>
        <slot>
          <h1>SallaTest</h1>
        </slot>
      </Host>
    );
  }

}
