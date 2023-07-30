import { Component, h, Prop } from '@stencil/core';
import { Donation } from "../salla-product-options/interfaces";

@Component({
  tag: 'salla-progress-bar',
  styleUrl: 'salla-progress-bar.css',
})
export class SallaProgressBar {

  constructor() {
    try {
      if (this.donation) {
        let donationJson = typeof this.donation == 'string' ? JSON.parse(this.donation) : this.donation;
        if (donationJson.can_donate && donationJson.target_amount) {
          donationJson.target_end_date = donationJson.target_end_date == '0000-00-00' ? null : donationJson.target_end_date;
          this.value = donationJson.collected_amount;
          this.target = donationJson.target_amount;
          this.header = salla.lang.get('pages.products.target');
          this.message = donationJson.target_end_date ? salla.lang.get('pages.products.donation_target_date') + ' ' + donationJson.target_end_date : '';
        } else {
          //in case the product is not enabled target campaign
          this.message = donationJson.target_amount
            ? donationJson.target_message
            : '';
        }
      }
    } catch (e) {
      salla.log('Wrong donation json');
    }

    salla.lang.onLoaded(() => {
      this.header = this.header?.replace('pages.products.target', salla.lang.get('pages.products.target'))
      this.message = this.message?.replace('pages.products.donation_target_date', salla.lang.get('pages.products.donation_target_date'))
    });

    salla.onReady(() => {
      this.color = this.color || salla.config.get('theme.color.primary', "#ffd5c4")
      if (!this.unit) {
        this.unit = salla.config.currency().symbol;
      }
    })
  }

  /**
   * You can just pass the donation as json string ex: `{"target_message":null,"target_date":"2023-04-18","target_end_date":"2023-04-18","target_amount":400,"collected_amount":380,"can_donate":true}`
   */
  @Prop() donation: string | Donation;
  /**
   * The goal of the progress bar
   */
  @Prop({ mutable: true }) target: number;

  /**
   * The progress so far as of the goal.
   */
  @Prop({ mutable: true }) value: number;


  /**
   * Set height for the wrapper.
   */
  @Prop({ mutable: true }) height: string = "10px";

  /**
   * Big Title, before the progress bar.
   */
  @Prop({ mutable: true }) header: string;

  /**
   * Stripped effect for tje progress bar.
   */
  @Prop({ mutable: true }) stripped: boolean;

  /**
   * Subtitle under the progress bar or instead of it if the target not being set.
   */
  @Prop({ mutable: true }) message: string;

  /**
   * The unite to be added after the numbers, defaults to: `salla.config.currency().symbol`
   */
  @Prop({ mutable: true }) unit: string;

  /**
   * Progress bar color, defaults to: `salla.config.get('theme.color.primary', "#ffd5c4")`
   */
  @Prop({ mutable: true }) color: string;

  private getPercentage(): number {
    return (this.value / this.target) * 100;
  }

  render() {
    if (!this.target && !this.message) {
      return '';
    }

    return (
      <div class="s-progress-bar-container">
        {this.header ? <div class="s-progress-bar-header">{this.header}</div> : ''}
        {this.getProgressBar()}
        {this.message ? <span class="s-progress-bar-message">{this.message}</span> : ''}
      </div>
    );
  }

  private getProgressBar() {
    return this.target ? [
      <div class="s-progress-bar-target-section">
        <span>{salla.helpers.number(this.value)} {this.unit}</span>
        <span>{salla.helpers.number(this.target)} {this.unit}</span>
      </div>,
      <div class="s-progress-bar-wrapper" style={{ 'height': this.height }}>
        <div class={{ "s-progress-bar-progress": true, 's-progress-bar-progress-stripped': this.stripped }}
          style={{ 'width': `${this.getPercentage()}%`, 'background-color': this.color }}>
        </div>
      </div>
    ] : '';
  }

}
