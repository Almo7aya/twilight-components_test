import {Component, Host, h, Prop, Element} from '@stencil/core';
import Star2 from "../../assets/svg/star2.svg";
import Helper from '../../Helpers/Helper';

@Component({
  tag: 'salla-rating-stars',
  styleUrl: 'salla-rating-stars.css'
})
export class SallaRatingStars {
  constructor() {
    salla.lang.onLoaded(() => {
      this.reviewsElement && (this.reviewsElement.innerText = `(${salla.helpers.number(salla.lang.choice('pages.rating.reviews', this.reviews))})`);
    });
  }

  /**
   * Sets input name.
   */
  @Prop() name: string = 'rating';

  /**
   * Sets the height and width of the component. Defaults to medium.
   */
  @Prop() size: "large" | "medium" | "small" | "mini" = 'medium';

  /**
   * The rating value.
   */
  @Prop() value: number;

  /**
   * Number of reviews to display.
   */
  @Prop() reviews: number = 0;


  @Element() host: HTMLElement;
  private startsElem: HTMLElement;
  private reviewsElement: HTMLElement;

  protected initiateRating() {
    this.host.addEventListener('click', () => {
      if (!this.startsElem) return

      // Get the selected star - activeElement is not supported in safari
      let activeStars = this.startsElem.querySelectorAll('.s-rating-stars-hovered');
      let selected = activeStars[activeStars.length - 1];
      if (!selected) return;

      let selectedIndex = selected.getAttribute('data-star');
      ((this.startsElem as Element).querySelector('.rating_hidden_input') as HTMLInputElement).value = selectedIndex;

      // Loop through each star, and add or remove the `.selected` class to toggle highlighting
      (this.startsElem as Element).querySelectorAll('.s-rating-stars-btn-star')
        .forEach((star, index) => Helper.toggleElementClassIf(star, 's-rating-stars-selected', 's-rating-stars-unselected', () => index < parseInt(selectedIndex)));

      // update aria-pressed attr status
      (this.startsElem as Element).querySelectorAll('[aria-pressed]').forEach(star => star.removeAttribute('aria-pressed'));
      selected.setAttribute('aria-pressed', 'true');
    });
  }

  private highlightSelectedStars() {
    let hoveredClass = 's-rating-stars-hovered',
      stars = this.startsElem?.querySelectorAll('.s-rating-stars-btn-star');
    stars?.forEach((star, index) => {
      star.addEventListener('mouseover', () => {
        for (let i = 0; i <= index; i++) {
          stars[i].classList.add(hoveredClass)
        }
      })
      star.addEventListener('mouseout', () => star.classList.remove(hoveredClass))
    })
    this.startsElem?.addEventListener('mouseout', () => stars.forEach(star => star.classList.remove(hoveredClass)));
  }

  private createStars(n) {
    let stars = [];
    for (let i = 0; i < 5; i++) {
      stars.push(<span class={{
        's-rating-stars-btn-star': true,
        ['s-rating-stars-' + this.size]: true,
        's-rating-stars-selected': i < n
      }} innerHTML={Star2}/>);
    }
    if (this.reviews > 0) {
      stars.push(<span class="s-rating-stars-reviews" ref={el => this.reviewsElement = el}>
        ({salla.helpers.number(salla.lang.choice('pages.rating.reviews', this.reviews))})
      </span>)
    }
    return stars;
  }

  render() {
    //TODO:: find a better fix, this is a patch for issue that duplicates the stars twice @see the screenshot inside this folder
    return this.host.closest('.swiper-slide')?.classList.contains('swiper-slide-duplicate')
      ? ''
      : (
        <Host>
          {this.value || this.value == 0 ?
            <div class="s-rating-stars-wrapper"> {this.createStars(this.value)} </div>
            :
            <div class="s-rating-stars-element" ref={(el) => this.startsElem = el as HTMLElement}>
              <input type="hidden" class="rating_hidden_input" name={this.name} value=""/>
              {[1, 2, 3, 4, 5].map(star =>
                <button class={`s-rating-stars-btn-star s-rating-stars-` + this.size} data-star={star}>
                  <span innerHTML={Star2}/>
                </button>
              )}
            </div>
          }
        </Host>
      );
  }

  componentDidLoad() {
    this.initiateRating();
    this.highlightSelectedStars();
  }
}
