import {Component, Host, h, State, Prop} from '@stencil/core';
import Bullhorn from '../../assets/svg/bullhorn.svg';
import UserOff from '../../assets/svg/user-off.svg';

@Component({
  tag: 'salla-user-settings',
  styleUrl: 'salla-user-settings.css',
})
export class SallaUserSettings {
  constructor() {
    salla.lang.onLoaded(() => {
      this.deactivateAccount = salla.lang.get('pages.profile.deactivate_account');
      this.promotionalMsgs = salla.lang.get('pages.profile.promotional_messages');
      this.deactivateDesc = salla.lang.get('pages.profile.deactivate_account_description');
      this.promotionalMsgsDesc = salla.lang.get('pages.profile.promotional_messages_description');
      this.warningText = salla.lang.get('pages.profile.warning_for_deactivate');
      this.sorryForLeavingText = salla.lang.get('pages.profile.sorry_for_leaving');
      this.keepAccount = salla.lang.get('pages.profile.keep_account')
    });
  }

  private confirmationModal: HTMLSallaModalElement;


  // Texts
  @State() deactivateAccount: string = salla.lang.get('pages.profile.deactivate_account');
  @State() promotionalMsgs: string = salla.lang.get('pages.profile.promotional_messages');
  @State() deactivateDesc: string = salla.lang.get('pages.profile.deactivate_account_description');
  @State() promotionalMsgsDesc: string = salla.lang.get('pages.profile.promotional_messages_description');
  @State() sorryForLeavingText: string = salla.lang.get('pages.profile.warning_for_deactivate');
  @State() warningText: string = salla.lang.get('pages.profile.sorry_for_leaving');
  @State() keepAccount: string = salla.lang.get('pages.profile.keep_account');

  @State() buttonLoading: boolean = false;

  /**
   * Value used for handling notification toggle check box.
   */
  @Prop({reflect: true}) isNotifiable: boolean = false;

  private toggleNotification(event) {
    salla.profile.updateSettings({is_notifiable: event.target.checked})
  }

  private capitalizeText(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  private openDeactivateModal() {
    this.confirmationModal.setTitle(this.capitalizeText(this.deactivateAccount));
    this.confirmationModal.open()
  }

  private async deleteAccount() {
    await salla.profile.delete().finally(() => this.confirmationModal.close())
  }

  render() {
    return (
      <Host class="s-user-settings-wrapper">
        <div class="s-user-settings-section">
          <salla-list-tile>
            <div slot="icon" class="s-user-settings-section-icon">
              <span innerHTML={Bullhorn}></span>
            </div>

            <div slot="title" class="s-user-settings-section-title">
              {this.capitalizeText(this.promotionalMsgs)}
            </div>
            <div slot="subtitle" class="s-user-settings-section-subtitle">
              {this.capitalizeText(this.promotionalMsgsDesc)}
            </div>
            <div slot='action' class="s-user-settings-section-action">
              <label class="s-toggle">
                <input class="s-toggle-input"
                       checked={this.isNotifiable}
                       onChange={(e) => this.toggleNotification(e)}
                       type="checkbox"/>
                <div class="s-toggle-switcher"></div>
              </label>
            </div>
          </salla-list-tile>
        </div>
        <div class="s-user-settings-section s-user-settings-section-deactivate-user">
          <salla-list-tile>
            <div slot="icon" class="s-user-settings-section-icon">
              <span innerHTML={UserOff}></span>
            </div>
            <div slot="title" class="s-user-settings-section-title">
              {this.capitalizeText(this.deactivateAccount)}
            </div>
            <div slot="subtitle" class="s-user-settings-section-subtitle">
              {this.capitalizeText(this.deactivateDesc)}
            </div>
            <div slot='action' class="s-user-settings-section-action">
              <salla-button fill="outline" color="danger" shape="btn" size="medium" width="normal"
                            onClick={() => this.openDeactivateModal()}>{this.capitalizeText(this.deactivateAccount)}</salla-button>
            </div>
          </salla-list-tile>
        </div>
        <salla-modal width="sm" subTitle={this.capitalizeText(this.sorryForLeavingText)}
                     ref={modal => this.confirmationModal = modal}>
          <span slot='icon' class="s-user-settings-confirmation-icon" innerHTML={UserOff}></span>
          <div class="s-user-settings-confirmation">
            <div class="s-user-settings-confirmation-warning">
              {this.capitalizeText(this.warningText)}
            </div>
            <div class="s-user-settings-confirmation-actions">
              <salla-button width="wide" onClick={() => this.confirmationModal.close()}>
                {this.capitalizeText(this.keepAccount)}</salla-button>
              <salla-button fill='outline' loading={this.buttonLoading} width="wide"
                            onClick={() => this.deleteAccount()}>{this.capitalizeText(this.deactivateAccount)}</salla-button>
            </div>
          </div>
        </salla-modal>
      </Host>
    );
  }

}
