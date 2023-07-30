import { Component, State, Prop, h, Event, Host, EventEmitter, Method, Element } from '@stencil/core';
import { Swiper as SwiperType } from 'swiper/types';

import ArrowRightIcon from "../../assets/svg/keyboard_arrow_right.svg";
import ArrowLeftIcon from "../../assets/svg/keyboard_arrow_left.svg";

/**
 * @slot items - Slider items.
 * @slot thumbs - Thumbs slider items.
 */
@Component({
  tag: 'salla-slider',
  styleUrl: 'salla-slider.css',
})
export class SallaSlider {
  @Element() host: HTMLElement;
  constructor() {
    this.direction = this.direction || document.documentElement.dir
  }

  /**
   * Show/hide slider block title
   */
  @Prop({ reflect: true }) blockTitle: string = '';

  /**
   * Enable call a specific slide by index from thumbnails option in `salla-slider-options` component, works only if `data-img-id` and `data-slid-index` attributes are set on each slide
   */
  @Prop({ reflect: true }) listenToThumbnailsOption: boolean = false;

  /**
   * Show/hide slider block sub title
   */
  @Prop({ reflect: true }) blockSubtitle: string = '';

  /**
   * Show/hide display all button beside arrows
   */
  @Prop({ reflect: true }) displayAllUrl: string = '';

  /**
   * Show/hide display all button beside arrows
   */
  @Prop({ reflect: true }) arrowsCentered: boolean = false;

  /**
   * Vertical or Horizontal thumbs slider
   */
  @Prop({ reflect: true }) verticalThumbs: boolean = false;

  /**
   * Disable thumbs slider and show it as a grid
   */
  @Prop({ reflect: true }) gridThumbs: boolean = false;

  /**
   * Vertical or Horizontal main slider
   */
  @Prop({ reflect: true }) vertical: boolean = false;

  /**
   * Auto Height slider
   */
  @Prop({ reflect: true }) autoHeight: boolean = false;

  /**
   * Show/hide arrows
   */
  @Prop({ reflect: true }) showControls: boolean = true;

  /**
   * Show/hide arrows
   */
  @Prop({ reflect: true }) controlsOuter: boolean = false;

  /**
   * Show/hide thumbs slider arrows
   */
  @Prop() showThumbsControls: boolean = true;

  /**
   * Enable autoplay  - working with `type="carousel" only`
   */
  @Prop() autoPlay: boolean = false;

  /**
   * slidesPerView
   */
  @Prop() slidesPerView: string = "auto";

  /**
   * Enable pagination
   */
  @Prop() pagination: boolean = false;

  /**
   * Enable center mode  - working with `type="carousel" only`
   */
  @Prop() centered: boolean = false;

  /**
   * Run slider in loop, Don't use it for slides with custom components inside it, because it may cause re-render issue
   */
  @Prop() loop: boolean = false;

  /**
   * Slider direction. Default: document.documentElement.dir
   */
  @Prop({ mutable: true, reflect: true }) direction: string;

  /**
   * Set the type of the slider
   * Default: ''
   */
  @Prop() type: 'carousel' | 'fullscreen' | 'thumbs' | 'default' | 'hero' | 'testimonials' | 'blog' | 'fullwidth' | '' = '';
  /**
   * Slider Configs refer to https://swiperjs.com/swiper-api#parameters and pass the entire config object
   * @example
   * let slider = document.querySelector('salla-slider');
   *  slider.sliderConfig = {
   *  slidesPerView: 1,
   *  spaceBetween : 30,
   *  lazy: true,
   * }
   *
   */
  @Prop({ reflect: true }) sliderConfig: any;
  /**
   * Thumbs Slider Configs refer to https://swiperjs.com/swiper-api#parameters and pass the entire config object
   * @example
   * let slider = document.querySelector('salla-slider');
   *  slider.thumbsConfig = {
   *  slidesPerView: 1,
   *  spaceBetween : 30,
   *  lazy: true,
   * }
   *
   */
  @Prop({ reflect: true }) thumbsConfig: any;

  // Events
  /**
   * Event will fired right after initialization.
   */
  @Event() afterInit: EventEmitter<any>;
  /**
   * Event will be fired when currently active slide is changed
   */
  @Event() slideChange: EventEmitter<any>;

  /**
   * Event will be fired when Swiper reach its beginning (initial position)
   */
  @Event() reachBeginning: EventEmitter<any>;

  /**
   * Event will be fired when Swiper reach last slide
   */
  @Event() reachEnd: EventEmitter<any>;

  /**
   * Event will be fired after animation to other slide (next or previous).
   */
  @Event() slideChangeTransitionEnd: EventEmitter<any>;

  /**
   * Event will be fired in the beginning of animation to other slide (next or previous).
   */
  @Event() slideChangeTransitionStart: EventEmitter<any>;

  /**
   * Same as "slideChangeTransitionEnd" but for "forward" direction only
   */
  @Event() slideNextTransitionEnd: EventEmitter<any>;

  /**
   * Same as "slideChangeTransitionStart" but for "forward" direction only
   */
  @Event() slideNextTransitionStart: EventEmitter<any>;

  /**
   * Same as "slideChangeTransitionEnd" but for "backward" direction only
   */
  @Event() slidePrevTransitionEnd: EventEmitter<any>;

  /**
   * Same as "slideChangeTransitionStart" but for "backward" direction only
   */
  @Event() slidePrevTransitionStart: EventEmitter<any>;

  /**
   * Event will be fired when user touch and move finger over Swiper and move it.
   * Receives touchmove event as an arguments.
   */
  @Event() sliderMove: EventEmitter<any>;

  /**
   * Event will be fired when user release Swiper. Receives touchend event as an arguments.
   */
  @Event() touchSliderEnd: EventEmitter<any>;

  /**
   * Event will be fired when user touch and move finger over Swiper.
   * Receives touchmove event as an arguments.
   */
  @Event() touchSliderMove: EventEmitter<any>;

  /**
   * Event will be fired when user touch Swiper. Receives touchstart event as an arguments.
   */
  @Event() touchSliderStart: EventEmitter<any>;

  /**
   * Event will be fired after transition.
   */
  @Event() sliderTransitionEnd: EventEmitter<any>;

  /**
   * Event will be fired in the beginning of transition.
   */
  @Event() sliderTransitionStart: EventEmitter<any>;


  // Methods

  /**
   * Run transition to the slide with index number equal to 'index' parameter for the duration equal to 'speed' parameter.
   *
   * @param {number} index - Index number of slide.
   * @param {number} speed - Transition duration (in ms).
   * @param {boolean} runCallbacks - Set it to false (by default it is true) and transition will not produce transition events.
   * **/
  @Method()
  async slideTo(index: number, speed?: number, runCallbacks?: boolean) {

    return this.slider.slideTo(index, speed, runCallbacks);
  }

  /**
   * Run transition to the next slide.
   *
   * @param {number} speed - Transition duration (in ms).
   * @param {boolean} runCallbacks - Set it to false (by default it is true) and transition will not produce transition events.
   * **/
  @Method()
  async slideNext(speed?: number, runCallbacks?: boolean) {
    this.slider?.slideNext(speed, runCallbacks);
  }

  /**
   * Run transition to the previous slide.
   *
   * @param {number} speed - Transition duration (in ms).
   * @param {boolean} runCallbacks - Set it to false (by default it is true) and transition will not produce transition events.
   * **/
  @Method()
  async slidePrev(speed?: number, runCallbacks?: boolean) {
    this.slider?.slidePrev(speed, runCallbacks);
  }

  /**
   * Does the same as .slideTo but for the case when used with enabled loop. So this method will slide to slides with realIndex matching to passed index
   *
   * @param {number} speed - Transition duration (in ms).
   * @param {boolean} runCallbacks - Set it to false (by default it is true) and transition will not produce transition events.
   * **/
  @Method()
  async slideToLoop(index: number, speed?: number, runCallbacks?: boolean) {
    this.slider.slideToLoop(index, speed, runCallbacks);
  }

  /**
   * Does the same as .slideNext but for the case when used with enabled loop. So this method will slide to next slide with realIndex matching to next index
   *
   * @param {number} speed - Transition duration (in ms).
   * @param {boolean} runCallbacks - Set it to false (by default it is true) and transition will not produce transition events.
   * **/
  @Method()
  async slideNextLoop(speed?: number, runCallbacks?: boolean) {
    this.slider.slideNextLoop(speed, runCallbacks);
  }

  /**
   * Does the same as .slidePrev but for the case when used with enabled loop. So this method will slide to previous slide with realIndex matching to previous index
   *
   * @param {number} speed - Transition duration (in ms).
   * @param {boolean} runCallbacks - Set it to false (by default it is true) and transition will not produce transition events.
   * **/
  @Method()
  async slidePrevLoop(speed?: number, runCallbacks?: boolean) {
    this.slider.slidePrevLoop(speed, runCallbacks);
  }

  /**
   * Reset slider position to currently active slide for the duration equal to 'speed' parameter.
   *
   * @param {number} speed - Transition duration (in ms).
   * @param {boolean} runCallbacks - Set it to false (by default it is true) and transition will not produce transition events.
   * **/
  @Method()
  async slideReset(speed?: number, runCallbacks?: boolean) {
    this.slider.slideReset(speed, runCallbacks);
  }

  /**
   * Reset slider position to closest slide/snap point for the duration equal to 'speed' parameter.
   * @param {number} speed - Transition duration (in ms).
   * @param {boolean} runCallbacks - Set it to false (by default it is true) and transition will not produce transition events.
   * **/
  @Method()
  async slideToClosest(speed?: number, runCallbacks?: boolean) {
    this.slider.slideToClosest(speed, runCallbacks);
  }

  /**
   *  You should call it after you add/remove slides manually, or after you hide/show it, or do any custom DOM modifications with Swiper This method also includes subcall of the following methods which you can use separately:
   * **/
  @Method()
  async update() {
    this.slider.update();
  }

  /**
   * Force slider to update its height (when autoHeight enabled) for the duration equal to 'speed' parameter
   * @param {number} speed - Transition duration (in ms).
   * **/
  @Method()
  async updateAutoHeight(speed?: number) {
    this.slider.updateAutoHeight(speed);
  }

  /**
   * recalculate number of slides and their offsets. Useful after you add/remove slides with JavaScript
   * **/
  @Method()
  async updateSlides() {
    this.slider.updateSlides();
  }

  /**
   * recalculate slider progress
   * **/
  @Method()
  async updateProgress() {
    this.slider.updateProgress();
  }

  /**
   * update active/prev/next classes on slides and bullets
   * **/
  @Method()
  async updateSlidesClasses() {
    this.slider.updateSlidesClasses();
  }


  /**
   * Get slider slides
   * **/
  @Method()
  async getSlides() {
    return await this.slider?.slides;
  }


  // States
  @State() currentIndex: number | undefined = undefined;
  @State() isEnd: boolean = false;
  @State() isBeginning: boolean = true;
  @State() swiperScript: any;
  @State() displayAllTitle: string;
  @State() windowWidth: number = window.innerWidth;

  private sliderContainer?: HTMLDivElement;
  private sliderWrapper?: HTMLDivElement;
  private thumbsSliderContainer?: HTMLDivElement;
  private thumbsSliderWrapper?: HTMLDivElement;
  private slider: any;
  private thumbsSlider: any;
  private hasThumbSlot: boolean = false;

  private pre_defined_config = {
    carousel: {
      speed: 300,
      slidesPerView: 'auto',
      spaceBetween: 0,
    },
    fullwidth: {
      speed: 750,
      parallax: true,
    },
    fullscreen: {
      speed: 1000,
      parallax: true,
      direction: "vertical",
      followFinger: false,
      touchReleaseOnEdges: true,
      lazy: true,
      mousewheel: {}
    },
    testimonials: {
      draggable: true,
      slidesPerView: 1,
      breakpoints: { 1024: { slidesPerView: 2 } }
    },
    blog: {
      parallax: true,
      speed: 800,
      loop: true,
      slidesPerView: 1,
      centeredSlides: true,
      spaceBetween: 30,
      breakpoints: {
        320: { spaceBetween: 10 },
        768: { spaceBetween: 15 },
        980: { paceBetween: 30 },
      }
    },
    thumbs: {
      slidesPerView: 1,
      spaceBetween: 30
    }
  }

  componentWillLoad() {
    salla.lang.onLoaded(() => {
      this.displayAllTitle = salla.lang.get('blocks.home.display_all');
    })
    this.hasThumbSlot = !!this.host.querySelector('[slot="thumbs"]');
    if (this.listenToThumbnailsOption) {
      salla.event.on('product-options::change', data => {
        if (data.option.type == 'thumbnail') {
          const slideIndex = this.sliderWrapper.querySelector(`[data-img-id="${data.detail.option_value}"]`)?.getAttribute('data-slid-index');
          slideIndex ? this.slideTo(parseInt(slideIndex), 300, false) : '';
        }
      });
    }
    return new Promise((resolve, reject) => {
      // @ts-ignore
      if (typeof Swiper !== 'undefined') {
        return resolve(true);
      }

      if (document.getElementById('swiper-script')) {
        let interval = setInterval(() => {
          // @ts-ignore
          if (typeof Swiper !== 'undefined') {
            clearInterval(interval);
            resolve(true);
          }
        }, 5);
      } else {
        // ? There is an issue with stencil bundling it breaks the swiper import, so we need to import it manually by swiperjs rerendered file
        // ! IT'S NOT A GOOD SOLUTION, BUT IT WORKS, WE NEED TO FIND A BETTER SOLUTION
        this.swiperScript = document.createElement('script');
        this.swiperScript.onload = () => {
          resolve(true)
          salla.event.emit('swiper::loaded');
        }
        this.swiperScript.onerror = (error) => {
          salla.logger.warn('failed load swiper bundle', error);
          reject(true)
        }
        this.swiperScript.src = 'https://cdn.salla.network/js/swiper@8.js';
        this.swiperScript.setAttribute('id', 'swiper-script');
        document.body.appendChild(this.swiperScript);
      }
    });
  }

  getSwiperConfig() {
    let pre_defined_config = {
      loop: this.loop,
      autoplay: this.type == 'fullwidth' && !!this.autoPlay ? { delay: 5000 } : this.autoPlay,
      centeredSlides: this.centered,
      slidesPerView: this.slidesPerView,
      autoHeight: this.autoHeight,
      lazy: true,
      on: {
        // todo:: find better way for this workaround to show lazyLoad for duplicated slides, because it clones the slide after it's already rendered,
        // then it re appended it as is,in this case the image is loaded but class not added.
        afterInit: (slider: SwiperType) => {
          this.afterInit.emit(slider);
          document.lazyLoadInstance?.update();
          this.loop && slider.slides.map(slide => {
            if (!slide.classList.contains('swiper-slide-duplicate')) {
              return;
            }
            slide.querySelectorAll('img.lazy:not(.loaded)').forEach(img => img.classList.add('loaded'));
          })
        },
      },
      pagination: this.pagination ? {
        el: this.host.id ? `#${this.host.id} .swiper-pagination` : '',
        clickable: true,
      } : false,
      navigation: this.showControls ? {
        nextEl: this.host.id ? `#${this.host.id} .s-slider-next` : '',
        prevEl: this.host.id ? `#${this.host.id} .s-slider-prev` : ''
      } : false,
      breakpoints: {
        768: {
          direction: this.vertical ? "vertical" : "horizontal",
        },
      },
    };
    let pre_defined_thumbs_config = {
      freeMode: false,
      watchSlidesProgress: true,
      slidesPerView: 4,
      spaceBetween: 10,
      watchOverflow: true,
      watchSlidesVisibility: true,
      breakpoints: {
        768: {
          direction: this.verticalThumbs ? "vertical" : "horizontal",
          spaceBetween: 16,
        },
      },
      navigation: this.showThumbsControls ? {
        nextEl: this.host.id ? `#${this.host.id} .s-slider-thumbs-next` : '',
        prevEl: this.host.id ? `#${this.host.id} .s-slider-thumbs-prev` : ''
      } : false,
    }
    this.pre_defined_config.fullscreen.mousewheel = {
      releaseOnEdges: this.host.querySelectorAll('.swiper-slide').length > 1 ? false : true
    },
      pre_defined_config = {
        ...pre_defined_config,
        ...(this.pre_defined_config[this.type] || {})
      };

    if (this.type == 'thumbs' && this.thumbsSliderWrapper) {
      for (const slide of this.thumbsSliderWrapper.children as any) {
        //todo:: use `s-slider-slide`
        slide.classList.add('swiper-slide')
      }

      if (this.hasThumbSlot && this.thumbsConfig) {
        try {
          pre_defined_thumbs_config = {
            ...pre_defined_thumbs_config,
            ...JSON.parse(this.thumbsConfig)
          }
        } catch (error) {
          salla.logger.warn('failed to parse thumbs slider config', error);
        }
      }
      // @ts-ignore
      this.thumbsSlider = new Swiper(this.thumbsSliderContainer, pre_defined_thumbs_config);

      // @ts-ignore
      pre_defined_config.thumbs = {
        swiper: this.thumbsSlider,
      };
    }

    pre_defined_config = {
      ...pre_defined_config,
    };
    if (this.sliderConfig) {
      try {
        pre_defined_config = {
          ...pre_defined_config,
          ...JSON.parse(this.sliderConfig)
        };
      } catch (error) {
        salla.logger.warn('failed to parse slider config', error);
      }
    }
    return pre_defined_config
  }

  getThumbsDirection() {
    const { verticalThumbs, windowWidth, direction } = this;

    if (verticalThumbs && windowWidth < 768 && direction === 'rtl') {
      return 'rtl';
    }

    if (verticalThumbs && windowWidth > 768 && direction === 'rtl') {
      return 'ltr';
    }

    return direction;
  }

  initSlider() {
    for (const slide of this.sliderWrapper.children as any) {
      slide.classList.add('swiper-slide')
    }

    // @ts-ignore
    this.slider = new Swiper(this.sliderContainer, this.getSwiperConfig())

    // Expose slider events
    this.slider.on('slideChange', (slider: SwiperType) => {
      //todo:: it doesn't change when loop is active, always will be false
      this.isBeginning = slider.isBeginning;
      this.isEnd = slider.isEnd;
      this.slideChange.emit(slider);
    });
    this.slider.on('reachBeginning', (slider: SwiperType) => this.reachBeginning.emit(slider));
    this.slider.on('reachEnd', (slider: SwiperType) => this.reachEnd.emit(slider));
    this.slider.on('slideChangeTransitionEnd', (slider: SwiperType) => {
      if (this.type == "fullscreen") {
        const activeIndex = slider.activeIndex;
        (slider.params.mousewheel as any).releaseOnEdges = activeIndex === 0 || (activeIndex === slider.slides.length - 1);
      }
      this.slideChangeTransitionEnd.emit(slider)
    });
    this.slider.on('slideChangeTransitionStart', (slider: SwiperType) => this.slideChangeTransitionStart.emit(slider));
    this.slider.on('slideNextTransitionEnd', (slider: SwiperType) => this.slideNextTransitionEnd.emit(slider));
    this.slider.on('slideNextTransitionStart', (slider: SwiperType) => this.slideNextTransitionStart.emit(slider));
    this.slider.on('slidePrevTransitionEnd', (slider: SwiperType) => this.slidePrevTransitionEnd.emit(slider));
    this.slider.on('slidePrevTransitionStart', (slider: SwiperType) => this.slidePrevTransitionStart.emit(slider));
    this.slider.on('sliderMove', (slider: SwiperType) => this.sliderMove.emit(slider));
    this.slider.on('touchEnd', (slider: SwiperType) => this.touchSliderEnd.emit(slider));
    this.slider.on('touchMove', (slider: SwiperType) => this.touchSliderMove.emit(slider));
    this.slider.on('touchStart', (slider: SwiperType) => this.touchSliderStart.emit(slider));
    this.slider.on('transitionEnd', (slider: SwiperType) => this.sliderTransitionEnd.emit(slider));
    this.slider.on('transitionStart', (slider: SwiperType) => this.sliderTransitionStart.emit(slider));
  }

  render() {
    let classes = this.type ? this.type + '-slider ' : '';
    classes += this.controlsOuter ? ' s-slider-controls-outer ' : '';
    classes += this.blockTitle == '' ? ' s-slider-has-notitle s-slider-v-centered ' : '';
    classes += this.verticalThumbs ? ' s-slider-vertical ' : ' s-slider-horizontal ';
    classes += this.arrowsCentered ? ' s-slider-v-centered ' : '';
    classes += this.gridThumbs ? ' s-slider-with-grid-thumbs ' : '';
    return (
      <Host class={'s-slider-wrapper ' + classes}>

        {/* Slider block Title */}
        {this.blockTitle || this.showControls ?
          <div class="s-slider-block__title">
            {this.blockTitle ?
              <div class="s-slider-block__title-right">
                <h2>{this.blockTitle}</h2>
                {this.blockSubtitle ? <p innerHTML={this.blockSubtitle} /> : ''}
              </div>
              : ''}

            <div class="s-slider-block__title-left">
              {this.displayAllUrl ?
                <a href={this.displayAllUrl} class="s-slider-block__display-all">{this.displayAllTitle}</a>
                : ''}
              {this.showControls ?
                <div class="s-slider-block__title-nav" dir="rtl">
                  <button aria-label="Previous Slide" class="s-slider-prev s-slider-nav-arrow">
                    <span class="s-slider-button-icon" innerHTML={this.direction == 'rtl' ? ArrowRightIcon : ArrowLeftIcon} />
                  </button>
                  <button aria-label="Next Slide" class="s-slider-next s-slider-nav-arrow">
                    <span class="s-slider-button-icon" innerHTML={this.direction == 'rtl' ? ArrowLeftIcon : ArrowRightIcon} />
                  </button>
                </div>
                : ''}
            </div>
          </div>
          : ''}

        <div class="swiper s-slider-container" ref={el => this.sliderContainer = el as HTMLDivElement} dir={this.vertical ? "ltr" : this.direction}>
          <slot />
          <div class="swiper-wrapper s-slider-swiper-wrapper" ref={el => this.sliderWrapper = el as HTMLDivElement}>
            <slot name='items' />
          </div>
          {this.pagination ? <div class="swiper-pagination"></div> : ''}
        </div>

        {this.type == 'thumbs' && this.hasThumbSlot ? <div class="s-slider-thumbs">
          <div class="swiper s-slider-thumbs-container" dir={this.getThumbsDirection()} ref={el => this.thumbsSliderContainer = el as HTMLDivElement}>
            <div class={{ "s-slider-swiper-wrapper swiper-wrapper": true, "s-slider-grid-thumbs": this.gridThumbs }} ref={el => this.thumbsSliderWrapper = el as HTMLDivElement}>
              <slot name="thumbs" />
            </div>
            {this.showThumbsControls ?
              <div class="s-slider-thumbs-nav" dir="rtl">
                <button aria-label="Previous Slide" class="s-slider-thumbs-prev s-slider-nav-arrow">
                  <span class="s-slider-button-icon" innerHTML={this.direction == 'rtl' ? ArrowRightIcon : ArrowLeftIcon} />
                </button>
                <button aria-label="Next Slide" class="s-slider-thumbs-next s-slider-nav-arrow">
                  <span class="s-slider-button-icon" innerHTML={this.direction == 'rtl' ? ArrowLeftIcon : ArrowRightIcon} />
                </button>
              </div>
              : null}
          </div>
        </div>
          : null}
      </Host>
    );
  }

  componentDidLoad() {
    let itemsSlot = this.sliderWrapper.querySelector('div[slot="items"]');
    !!itemsSlot ? itemsSlot.replaceWith(...itemsSlot.children as any) : null;
    if (this.type == 'thumbs' && this.hasThumbSlot) {
      let thumbsSlot = this.thumbsSliderWrapper.querySelector('div[slot="thumbs"]');
      !!thumbsSlot ? thumbsSlot.replaceWith(...thumbsSlot.children as any) : null;
    }

    // if swiper is not loaded, lets relay on event
    // @ts-ignore
    if (typeof Swiper === 'undefined') {
      salla.event.once('swiper::loaded', () => this.initSlider())
    } else { // if swiper is loaded lets init our slider
      this.initSlider();
    }
  }
}
