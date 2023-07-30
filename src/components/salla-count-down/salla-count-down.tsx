import {Component, Host, h, Prop, State, Method} from '@stencil/core';

@Component({
  tag: 'salla-count-down',
  styleUrl: 'salla-count-down.css',
})
export class SallaCountDown {
  constructor() {

    this.days = this.number(0);
    this.hours = this.number(0);
    this.minutes = this.number(0);
    this.seconds = this.number(0);
    salla.lang.onLoaded(() => {
      this.daysLabel = salla.lang.get('pages.checkout.day');
      this.hoursLabel = salla.lang.get('pages.checkout.hour');
      this.minutesLabel = salla.lang.get('pages.checkout.minute');
      this.invalidDate = salla.lang.get('blocks.buy_as_gift.incorrect_date');
      this.secondsLabel = salla.lang.get('pages.checkout.second');
      this.endLabel = salla.lang.get('pages.checkout.offer_ended');
    });

    if (this.date && this.isValidDate(this.date)) {
      this.startCountDown();
    }
  }

  /**
   * The date to count down to
   * Format: MMM DD, YYYY HH:mm:ss (e.g. Jan 2, 2023 16:37:52)
   * */
  @Prop() date: string;


  /**
   * If true, the count down numbers will be appear in a boxes
   * */
  @Prop() boxed: boolean;

  /**
   * The size of the count down
   * */
  @Prop() size: 'sm' | 'md' | 'lg' = 'md';

  /**
   * The color of the count down
   * */
  @Prop() color: 'primary' | 'light' | 'dark' = 'dark';

  /**
   * Show labels for each count down number
   * */
  @Prop() labeled: boolean;

  /**
   * The text to show when the count down ends
   * */
  @Prop() endText: string;


  /**
   * The digits lang to show in the count down
   * */
  @Prop() digits: 'en' | 'auto' = 'auto';

  /**
   * If true, the count down will end at the end of the day
   * */
  @Prop() endOfDay: boolean;

  @State() daysLabel: string;
  @State() hoursLabel: string;
  @State() minutesLabel: string;
  @State() secondsLabel: string;
  @State() endLabel: string;
  @State() invalidDate: string;
  @State() offerEnded: boolean = false;
  @State() countInterval: any;
  @State() days: string;
  @State() hours: string;
  @State() minutes: string;
  @State() seconds: string;


  /**
   * End the count down
   * */
  @Method()
  async endCountDown() {
    clearInterval(this.countInterval);
    this.offerEnded = true;
    this.days = this.number(0);
    this.hours = this.number(0);
    this.minutes = this.number(0);
    this.seconds = this.number(0);
  }

  private isValidDate(date: string) {
    let dateHasDashes = date.includes('-'),
        dateParts = date.split(' '),
        testedDate;
    if (dateHasDashes) {
      testedDate = dateParts[0].replace(/-/g, '/');
    } else {
      testedDate = dateParts[0];
    }
    return !isNaN(Date.parse(testedDate));
  }

  private number(digit: number) {
    return salla.helpers.number(digit, this.digits === 'en');
  }

  private startCountDown() {

    let countDownDate = new Date(this.date.replace(/-/g, "/"));
    if (this.endOfDay || this.date.split(' ').length === 1) {
      countDownDate.setHours(23, 59, 59, 999);
    }
    let countDownTime = countDownDate.getTime();

    this.countInterval = setInterval(() => {
      let now = new Date().getTime();
      let distance = countDownTime - now;

      this.days = this.number(Math.floor(distance / (1000 * 60 * 60 * 24)));
      this.hours = this.number(Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)));
      this.minutes = this.number(Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)));
      this.seconds = this.number(Math.floor((distance % (1000 * 60)) / 1000));

      if (distance < 0) {
        this.endCountDown();
      }
    }, 1000);
  }

  render() {
    if (!this.date) {
      return "";
    } else if (this.date && !this.isValidDate(this.date)) {
      return <div class="s-count-down-text-center">{this.invalidDate}</div>
    }
    return (
      <Host class="s-count-down-wrapper">
        <ul
          class={`s-count-down-list ${this.boxed ? 's-count-down-boxed' : ''} ${this.offerEnded ? 's-count-down-ended' : ''} s-count-down-${this.size} s-count-down-${this.color}`}>
          <li class="s-count-down-item">
            <div class="s-count-down-item-value">{this.seconds}</div>
            {this.labeled && <div class="s-count-down-item-label">{this.secondsLabel}</div>}
          </li>
          <li class="s-count-down-item">
            <div class="s-count-down-item-value">{this.minutes}</div>
            {this.labeled && <div class="s-count-down-item-label">{this.minutesLabel}</div>}
          </li>
          <li class="s-count-down-item">
            <div class="s-count-down-item-value">{this.hours}</div>
            {this.labeled && <div class="s-count-down-item-label">{this.hoursLabel}</div>}
          </li>
          <li class="s-count-down-item">
            <div class="s-count-down-item-value">{this.days}</div>
            {this.labeled && <div class="s-count-down-item-label">{this.daysLabel}</div>}
          </li>
        </ul>

        {this.offerEnded && <div class="s-count-down-end-text">{!!this.endText ? this.endText : this.endLabel}</div>}
      </Host>
    );
  }

}
