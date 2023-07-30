import {Component, Host, h, State, Element} from '@stencil/core';
import Cancel from '../../assets/svg/cancel.svg';

@Component({
  tag: 'salla-maintenance-alert',
  styleUrl: 'salla-maintenance-alert.css',
})
export class SallaMaintenanceAlert {

  @Element() host: HTMLElement;
  @State() title: string;
  @State() message: string;
  @State() buttonTitle: string;

  componentWillLoad() {
    this.title = salla.config.get('maintenance_details.title');
    this.message = salla.config.get('maintenance_details.message');
    this.buttonTitle = window.innerWidth <= 768 ? salla.config.get('maintenance_details.button_title') : salla.config.get('maintenance_details.button_full_title');
  }

  private closeAlert() {
    salla.storage.set('hide_salla-maintenance-alert_at', Date.now());
    this.host.style.display = 'none';
  }

  render() {
    return (
      <Host class="s-maintenance-alert-wrapper">
        <button class="s-maintenance-alert-close" innerHTML={Cancel} onClick={() => this.closeAlert()}/>
        <div class="s-maintenance-alert-content">
          <div class="s-maintenance-alert-container">
            <div class="s-maintenance-alert-icon">
              <img src={salla.url.cdn('images/alert.png')} alt="Alert"/>
            </div>
            <div class="s-maintenance-alert-text">
              <h2>{this.title}</h2>
              <p>{this.message}</p>
            </div>
          </div>
          <div>
            <a class="s-maintenance-alert-btn" href={salla.config.get('maintenance_details.button_url')}>
              {this.buttonTitle}
            </a>
          </div>
        </div>
      </Host>
    );
  }

  componentDidLoad() {
    //auto-hide the alert if close button is clicked before one hour
    let hidden_at = salla.storage.get('hide_salla-maintenance-alert_at');
    if (hidden_at && ((Date.now() - hidden_at) / 1000 / 60) < 60) {
      this.closeAlert();
    }
  }

}
