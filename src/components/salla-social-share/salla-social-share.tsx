import { Component, Prop, h, State, Method } from '@stencil/core';
import anime from 'animejs';
import facebook from '../../assets/svg/facebook.svg';
import twitter from '../../assets/svg/twitter.svg';
import copy_link from '../../assets/svg/link.svg';
import email from '../../assets/svg/mail.svg';
import whatsapp from '../../assets/svg/whatsapp.svg';
import { Socials } from './interfaces';
import Cancel from "../../assets/svg/cancel.svg";
import ShareAlt from "../../assets/svg/share-alt.svg";

/**
 * @slot widget - An action that can be used to activete or open the component by calling the `open` method.
 */
@Component({
  tag: 'salla-social-share',
  styleUrl: 'salla-social-share.css'
})

export class SallaSocialShare {

  private shareMenu?: HTMLUListElement;

  @State() opened: boolean = false;
  @State() allPlatforms: Array<string> = [Socials.WHATSAPP, Socials.FACEBOOK, Socials.TWITTER, Socials.EMAIL, Socials.COPY_LINK];
  @State() platformIcons: Array<object> = [{ icon: whatsapp, name: Socials.WHATSAPP }, {
    icon: facebook,
    name: Socials.FACEBOOK
  }, { icon: twitter, name: Socials.TWITTER }, { icon: email, name: Socials.EMAIL }, {
    icon: copy_link,
    name: Socials.COPY_LINK
  }];
  @State() convertedPlatforms: Array<string> = [];

  /**
   * page url that will be shared custom | current page url
   */
  @Prop({ reflect: true }) url: string = "";

  /**
   * page url name that will be shared custom | current page url
   */
  @Prop({ reflect: true }) urlName: string = ""

  /**
   * selected platforms to share | all platforms
   */
  @Prop({ reflect: true }) platforms: string = 'facebook,twitter,whatsapp,email,copy_link';

  componentWillLoad() {
    if (document.getElementById('a2a-script')) {
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://static.addtoany.com/menu/page.js';
    script.setAttribute('id', 'a2a-script');
    script.async = true;
    script.onload = function () {
      window.a2a_config.locale = salla.config.get('user.language_code', salla.lang.getLocale());
    };
    document.body.appendChild(script);
  }


  /**
   * Activate or open the share menu.
   */
  @Method()
  async open() {
    const animateList = new (anime as any).timeline().add({
      targets: this.shareMenu,
      translateY: [-50, 0],
      opacity: [0, 1],
      duration: 300,
      podding: '0',
      easing: 'easeInOutSine'
    })
    animateList.add({
      targets: this.shareMenu.children,
      translateZ: 0,
      translateY: [-30, 0],
      scaleY: [0, 1],
      opacity: [0, 1],
      duration: 1400,
      delay: anime.stagger(100)
    }, '-=200');

    this.opened = !this.opened;


    if (this.opened) {
      this.shareMenu.classList.add('opened');
    } else {
      animateList.pause();
      animateList.seek(0);
      this.shareMenu.classList.remove('opened');
    }

  }
  @Method()
  async refresh() {
    window.a2a?.init('page');
  }

  render() {
    return (
      <div class="s-social-share-wrapper">

        <slot name='widget'>

          <salla-button aria-label="Share" onClick={() => this.open()} class="s-social-share-btn" shape="icon"
            fill="outline" color="light"
          >
            <span innerHTML={this.opened ? Cancel : ShareAlt}></span>
          </salla-button>
        </slot>

        <ul ref={el => this.shareMenu = el as HTMLUListElement} class="s-social-share-list a2a_kit share" data-a2a-url={this.url ? this.url : window.location.href} data-a2a-title={this.urlName ? this.urlName : document.title}>
          {this.platforms.split(',').map(platform => {
            return (
              <li>
                <a class={`a2a_button_${platform}`} aria-label={`Share Via ${platform}`}>

                  {
                    this.platformIcons.map((icon: any) => {
                      if (icon.name === platform) {
                        return <span class="s-social-share-icon" innerHTML={icon.icon}></span>
                      }
                    })
                  }
                </a>
              </li>
            );
          })
          }
        </ul>
      </div>

    );
  }
}
