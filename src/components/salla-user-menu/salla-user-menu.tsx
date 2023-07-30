import {Component, Host, h, State, Element, Prop} from '@stencil/core';
// Icons
import ArrowDown from "../../assets/svg/keyboard_arrow_down.svg"
import BellRing from "../../assets/svg/bell-ring.svg"
import OrderIcon from "../../assets/svg/box-bankers.svg"
import PendingOrdersIcon from "../../assets/svg/cart.svg"
import WishListIcon from "../../assets/svg/star.svg"
import ProfileIcon from "../../assets/svg/user-circle.svg"
import LogoutIcon from "../../assets/svg/send-out.svg"
import Cancel from "../../assets/svg/cancel.svg"
import Rate from "../../assets/svg/star2.svg";
import UserCircle from "../../assets/svg/user-circle.svg";

/**
 * @slot trigger - Replaces trigger widget, has replaceable props `{avatar}`, `{hello}`, `{first_name}`, `{last_name}`, `{icon}`.
 * @slot login-btn - Replaces the login button, it must be used with `salla.event.dispatch('login::open')` to open the login modal.
 */
@Component({
  tag: 'salla-user-menu',
  styleUrl: 'salla-user-menu.css',
})
export class SallaUserMenu {
  constructor() {

    // salla.auth.event.onLoggedIn(() => {
    //   this.is_loggedIn = true
    // })

    salla.lang.onLoaded(() => {
      this.notifications = salla.lang.get("common.titles.notifications");
      this.orders = salla.lang.get("common.titles.orders");
      this.pending_orders = salla.lang.get("common.titles.pending_orders");
      this.wishlist = salla.lang.get("common.titles.wishlist");
      this.profile = salla.lang.get("common.titles.profile");
      this.hello = salla.lang.get("pages.checkout.hello");
      this.rating = salla.lang.get("common.titles.rating");
      this.logout = salla.lang.get("blocks.header.logout");
    });

    //we need it only in theme-y
    if (this.host.hasAttribute('with-rating')) {
      this.items.rating = Rate;
    }
    //we need it to be the last item
    this.items.logout = LogoutIcon;

    this.triggerSlot = this.host.querySelector('[slot="trigger"]')?.innerHTML || '<div class="s-user-menu-trigger"><div class="s-user-menu-avatar-wrap"><img class="s-user-menu-trigger-avatar" src="{avatar}" alt="{first_name}{last_name}" /></div><div class="s-user-menu-trigger-content"><span class="s-user-menu-trigger-hello">{hello}</span><p class="s-user-menu-trigger-name">{first_name} {last_name}</p></div> <i class="s-user-menu-trigger-icon">{icon}</i></div>';
    salla.onReady(() => {
      if (salla.config.isGuest()) {
        return;
      }

      this.is_loggedIn = true;
      /**
       * Get Fresh Notifications In These Cases:
       * - is notification page, if user already changed the status of his orders (to reset notification badge)
       * - is pending orders page, if user already changed the status of his orders (to reset orders badge)
       * - is profile page, in case user changed his name or avatar, we need to update it
       * - half hour is passed from the last user data fetched
       *
       * //todo:: update the data in the storage in customer pages
       * //todo:: cover two requests in customer pages
       * //todo:: make sure to run this only after token is set
       */
      const shouldFetchProfile = !this.inline && (
        salla.url.is_page('customer.notifications')
      || salla.url.is_page('customer.orders.index.pending')
      || salla.url.is_page('customer.profile')
      || ((Date.now() - (salla.storage.get('user.fetched_at') || 0)) / 1000 / 60) > 30
      );

      if(shouldFetchProfile){
        this.fetchFreshProfile()
      }else{
        salla.event.on('profile::info.fetched', res => {
          this.updateProfileState(res)
        });
      }

    });
  }

  private items: any = {
    notifications: BellRing,
    orders: OrderIcon,
    pending_orders: PendingOrdersIcon,
    wishlist: WishListIcon,
    profile: ProfileIcon,
  };

  @Element() host: HTMLElement;
  private readonly triggerSlot: string;
  @State() accountLoading: boolean = false;
  @State() opened: boolean = false;
  @State() notifications: string = salla.lang.get("common.titles.notifications");
  @State() orders: string = salla.lang.get("common.titles.orders");
  @State() pending_orders: string = salla.lang.get("common.titles.pending_orders");
  @State() wishlist: string = salla.lang.get("common.titles.wishlist");
  @State() profile: string = salla.lang.get("common.titles.profile");
  @State() rating: string = salla.lang.get("common.titles.rating");
  @State() logout: string = salla.lang.get("blocks.header.logout");
  @State() hello: string = salla.lang.get("pages.checkout.hello");
  @State() first_name: string = salla.storage.get('user.first_name') || '';
  @State() last_name: string = salla.storage.get('user.last_name') || '';
  @State() avatar: string = salla.storage.get('user.avatar') || salla.url.cdn('images/avatar.png');
  @State() is_loggedIn: boolean;
  @State() badges: any = {
    notifications: salla.helpers.number(salla.storage.get('user.notifications') || 0),
    pending_orders: salla.helpers.number(salla.storage.get('user.pending_orders') || 0)
  };

  @State() hasBadges: boolean = Number(salla.storage.get('user.pending_orders')) > 0 || Number(salla.storage.get('user.notifications')) > 0;
  /**
   * To display only the list without the dropdown functionality
   */
  @Prop({reflect: true}) inline: boolean = false;

  /**
   * To display the trigger as an avatar only
   */
  @Prop({reflect: true}) avatarOnly: boolean = false;

  /**
   * To display the dropdown header in mobile sheet
   */
  @Prop({reflect: true}) showHeader: boolean = false;

  /**
   * To Make the dropdown menu relative to parent element or not
   */
  @Prop({reflect: true}) relativeDropdown: boolean = false;

  private onClickOutside = () => {
    this.opened = false;
  }

  @State() OrderUpdate: number = 0;

  private fetchFreshProfile() {
    //don't request fetchFreshProfile unless token is injected into the api
    if (!salla.api.token) {
      salla.log('trying to fetchFreshProfile before injected the token!!');
      return;
    }
    salla.profile.api.info()
      .then((res) => {
        this.updateProfileState(res);
      });
  }

  private updateProfileState(res) {
    this.badges = {
      notifications: salla.helpers.number(res.data.notifications || 0),
      pending_orders: salla.helpers.number(res.data.pending_orders || 0)
    }
    this.hasBadges = Number(res.data.pending_orders) > 0 || Number(res.data.notifications) > 0;
    this.first_name = res.data.first_name;
    this.last_name = res.data.last_name;
    this.avatar = res.data.avatar || salla.url.cdn('images/avatar.png');
  }

  async open(e) {
    this.opened = !this.opened;
    e.stopPropagation()
    if (this.opened) {
      window.addEventListener('click', this.onClickOutside);
    }
  }

  private menuItemClicked(event: Event, item: string[]) {
    if (item[0] !== 'logout') {
      return;
    }
    event.preventDefault();
    salla.auth.logout('sall-user-menu');
  }

  private getTheHeader() {
    return <div class={{
      's-user-menu-trigger-slot': true,
      's-user-menu-red-dot': this.hasBadges,
      's-user-menu-trigger-avatar-only': this.avatarOnly
    }}
                id='trigger-slot' onClick={(e) => this.open(e)} innerHTML={this.triggerSlot
      .replace(/\{hello\}/g, this.hello)
      .replace(/\{first_name\}/g, this.first_name)
      .replace(/\{last_name\}/g, this.last_name)
      .replace(/\{avatar\}/g, this.avatar)
      .replace(/\{icon\}/g, ArrowDown)}>
    </div>;
  }

  private getMenuItem(item: any[], i: number) {
    //todo:: enhancement support slot here
    return <li class={{
      's-user-menu-dropdown-item': true,
      's-user-menu-dropdown-item-logout': i + 1 == Object.entries(this.items).length
    }}>
      <a href={salla.url.get(item[0])} onClick={event => this.menuItemClicked(event, item)}>
        <i innerHTML={item[1]}> </i>
        <span class="s-user-menu-dropdown-item-title">{this[item[0]]}</span>
        {!['٠', '0', undefined].includes(this.badges[item[0]])
          ? <span class="s-user-menu-dropdown-item-badge">{this.badges[item[0]]}</span>
          : ""}
      </a>
    </li>;
  }

  componentShouldUpdate() {
    if (!this.opened) {
      window.removeEventListener('click', this.onClickOutside);
    }
  }

  render() {
    if (!this.is_loggedIn) {
      return <Host>
        <slot name='login-btn'>
          <button class="s-user-menu-login-btn" onClick={() => salla.event.dispatch('login::open')}
                  innerHTML={UserCircle}>
          </button>
        </slot>
      </Host>
    }

    if (this.inline) {
      return <Host>
        <ul class="s-user-menu-inline">
          {Object.entries(this.items).map((item, i) => this.getMenuItem(item, i))}
        </ul>
      </Host>
    }

    return (
      <Host>
        <div class={{'s-user-menu-wrapper': true, 's-user-menu-relative-dropdown': this.relativeDropdown}}>
          {this.getTheHeader()}
          <div class={{'s-user-menu-toggler': true, 'opened': this.opened}}>
            <div class="s-user-menu-dropdown" onClick={(e) => e.stopPropagation()}>
              {this.showHeader ? <div class="s-user-menu-dropdown-header">
                <img src={this.avatar} alt={`${this.first_name} ${this.last_name}`}/>
                <div class="s-user-menu-dropdown-header-content">
                  <span>{this.hello}</span>
                  <p>{this.first_name} {this.last_name}</p>
                </div>
                <button class="s-user-menu-dropdown-header-close" innerHTML={Cancel}
                        onClick={() => this.opened = false}>
                </button>
              </div> : ''}
              <ul class="s-user-menu-dropdown-list">
                {Object.entries(this.items).map((item, i) => this.getMenuItem(item, i))}
              </ul>
            </div>
          </div>
        </div>
      </Host>
    );
  }

  componentDidLoad() {
    //make sure to load the avatar if it's lazy, we use it in Y
    document.lazyLoadInstance?.update(this.host.querySelectorAll('.lazy'));
  }
}
