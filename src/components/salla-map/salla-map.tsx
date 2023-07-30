import { Component, Host, h, Prop, Method, State, Event, EventEmitter, Element } from '@stencil/core';
import Location from '../../assets/svg/location.svg';
import Edit from '../../assets/svg/edit.svg';
import CurrentLocation from '../../assets/svg/location-target.svg';
import LocationMarker from '../../assets/svg/location-marker.svg';
import styles from './map-styles';

// import google maps
import { Loader, LoaderOptions } from 'google-maps';

@Component({
  tag: 'salla-map',
  styleUrl: 'salla-map.css',
})
export class SallaMap {
  // private variables
  private map: google.maps.Map;
  private locationModal: HTMLSallaModalElement;
  private marker: google.maps.Marker;
  private defaultLat: number = 21.419421;//Mecca 🕋
  private defaultLng: number = 39.82553;//Mecca 🕋
  @Element() host: HTMLElement;
  // state variables
  @State() modalActivityTitle: string = salla.lang.get('pages.checkout.select_your_address_from_map');
  @State() confirmButtonTitle: string = salla.lang.get('pages.checkout.confirm_address');
  @State() locateButtonTitle: string = salla.lang.get('pages.cart.detect_location');
  @State() locateButtonEdit: string = salla.lang.get('common.elements.edit');
  @State() searchPlaceholder: string = salla.lang.get('pages.checkout.search_for_address');
  @State() searchInputValue: string = null;
  @State() formattedAddress: string = '';
  @State() geolocationError: boolean = false;
  @State() searchInput: HTMLInputElement;
  @State() mapInput: HTMLInputElement;
  @State() mapElement: HTMLElement;
  @State() selectedLat: number;
  @State() selectedLng: number;

  constructor() {
    salla.lang.onLoaded(() => {
      this.modalActivityTitle = salla.lang.get('pages.checkout.select_your_address_from_map');
      this.confirmButtonTitle = salla.lang.get('pages.checkout.confirm_address');
      this.locateButtonTitle = salla.lang.get('pages.cart.detect_location');
      this.locateButtonEdit = salla.lang.get('common.elements.edit');
      this.searchPlaceholder = salla.lang.get('pages.checkout.search_for_address');
    });

    salla.onReady(()=>{
      this.apiKey = salla.config.get('store.settings.keys.maps', 'AIzaSyBFgFISAizDP3YVWj0y5rF8JKKNQ2vohdc');
    })
  }

  private formatAddress(address: string) {
    return address.length > 25 ? address.substring(0, 25) + '...' : address;
  }

  private getLatLng(){
    return this.selectedLat && this.selectedLng ? `${this.selectedLat}, ${this.selectedLng}` : null
  }
  private getPositionAddress(location: google.maps.LatLng, submit: boolean = false) {
    // get address and set it to search input
    const Geocoder = new google.maps.Geocoder();
    Geocoder.geocode(
      {
        location,
      },
      (results, status) => {
        if (status === google.maps.GeocoderStatus.OK) {
          if (this.searchable) {
            this.searchInputValue = results[0].formatted_address;
            this.searchInput.value = results[0].formatted_address;
          }
          if (submit) {
            this.formattedAddress = results[0].formatted_address;
          }
        }
      }
    );
  }

  private initGoogleMaps(options: LoaderOptions, mapDOM: Element) {
    const loader = new Loader(this.apiKey, options);

    loader.load().then(google => {
      this.map = new google.maps.Map(mapDOM, {
        center: (this.lat || this.lng) ? {
          lat: this.lat,
          lng: this.lng,
        } : {
          lat: this.defaultLat,
          lng: this.defaultLng,
        },
        zoom: this.zoom,
        zoomControl: true,
        mapTypeControl: false,
        scaleControl: false,
        streetViewControl: false,
        rotateControl: false,
        fullscreenControl: false,
        disableDefaultUI: false,
      });

      this.map.setOptions({
        styles: this.theme === 'light' ? styles.light : styles.dark,
      });

      this.marker = new google.maps.Marker({
        position: this.map.getCenter(),
        map: this.map,
        icon: {
          url: 'data:image/svg+xml;utf8,' + encodeURIComponent(LocationMarker),
          scaledSize: new google.maps.Size(30, 30),
        },
      });

      if (this.searchable) {
        const searchBox = new google.maps.places.SearchBox(this.searchInput);
        google.maps.event.addListener(searchBox, 'places_changed', () => {
          const places = searchBox.getPlaces();
          // goto first place
          if (places.length > 0 && this.map) {
            this.map.setCenter(places[0].geometry.location);
            this.lat = places[0].geometry.location.lat();
            this.lng = places[0].geometry.location.lng();
            // set marker
            this.marker.setPosition(places[0].geometry.location);
            this.searchInputValue = places[0].formatted_address;
            this.formattedAddress = places[0].formatted_address;
          }
        });
      }
      // add listener to map
      google.maps.event.addListener(this.map, 'click', e => {
        if (this.readonly) return;
        this.marker.setPosition(e.latLng);
        this.lat = e.latLng.lat();
        this.lng = e.latLng.lng();
        this.getPositionAddress(e.latLng);
        this.mapClicked.emit({
          lat: e.latLng.lat(),
          lng: e.latLng.lng(),
          address: this.formattedAddress ? this.formattedAddress : null,
        });
      });
      if (!this.lat && !this.lng) {
        this.getCurrentLocation();
        if (this.geolocationError) {
          this.map.setCenter({
            lat: this.lat,
            lng: this.lng,
          });
          this.marker.setPosition({
            lat: this.lat,
            lng: this.lng,
          });
        }
      }
    });
  }

  private getCurrentLocation() {
    if (navigator.geolocation && this.map) {
      navigator.geolocation.getCurrentPosition(position => {
        // set map to this location
        const mapOptions = {
          center: new google.maps.LatLng(position.coords.latitude, position.coords.longitude),
          zoom: 15,
        };
        this.map.setOptions(mapOptions);
        // set marker
        this.marker.setPosition(mapOptions.center);
        this.getPositionAddress(mapOptions.center);
        this.lat = position.coords.latitude;
        this.lng = position.coords.longitude;
        this.currentLocationChanged.emit({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          address: this.formattedAddress ? this.formattedAddress : null,
        });
      }, this.handleLocationError.bind(this));
    } else {
      salla.log('Geolocation is not supported by this browser.');
      this.geolocationError = true;
    }
  }

  private handleLocationError(error) {
    this.geolocationError = true;
    switch (error.code) {
      case error.PERMISSION_DENIED:
        salla.log('User denied the request for Geolocation.');
        break;
      case error.POSITION_UNAVAILABLE:
        salla.log('Location information is unavailable.');
        break;
      case error.TIMEOUT:
        salla.log('The request to get user location timed out.');
        break;
      case error.UNKNOWN_ERROR:
        salla.log('An unknown error occurred.');
        break;
    }
  }
  componentDidLoad() {
    // if lat and lng provided then get the formatted address
    if (this.lat && this.lng) {
      // get address
      fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${this.lat},${this.lng}&key=${this.apiKey}&language=${salla.config.get('user.language_code') ||
        document.documentElement.lang ||
        'ar'}`
      )
        .then(res => res.json())
        .then(res => {
          if (res.status === 'OK') {
            this.formattedAddress = res.results[0].formatted_address;
            this.searchInputValue = res.results[0].formatted_address;
            this.searchInput.value = res.results[0].formatted_address;
            this.selectedLng = this.lng;
            this.selectedLat = this.lat;
          }
        }
        );
    }
    this.mapInput.addEventListener('invalid', e => {
      this.invalidInput.emit(e);
    });
    this.mapInput.addEventListener('input', () => {
      this.mapInput.setCustomValidity('');
      this.mapInput.reportValidity();
    });
  }
  /**
   * Open location component
   */
  @Method()
  async open() {
    // only init google maps on modal open :) to save resources
    if (!this.map)
      this.initGoogleMaps(
        {
          libraries: this.searchable ? ['places', 'search'] : [],
          language:
            salla.config.get('user.language_code') ||
            document.documentElement.lang ||
            'ar',
        },
        this.mapElement
      );
    return await (this.locationModal as HTMLSallaModalElement).open();
  }

  /**
   * File input name for the native formData
   */
  @Prop() name: string = 'location';

  /**
   * Set if the location input is required or not
   */
  @Prop() required: boolean = false;
  /**
   * Disable or enable actions
   */
  @Prop() readonly: boolean = false;

  /**
   * Sets the search bar visibility.
   */
  @Prop({ mutable: true }) searchable: boolean = false;

  /**
   * Latitude coordinate, defaults to current user location
   */
  @Prop({ mutable: true }) lat: number;

  /**
   * Longitude coordinate, defaults to current user location
   */
  @Prop({ mutable: true }) lng: number;

  /**
   * Sets google api key value, default Merchant key
   */
  @Prop({ mutable: true }) apiKey: string;

  /**
   * Modal Title
   */
  @Prop() modalTitle: string;

  /**
   * Sets start map zoom.
   */

  @Prop({ mutable: true }) zoom: number = 10;

  /**
   * Sets map style.
   */
  @Prop({ mutable: true }) theme: string = 'light';

  /**
   * Custom DOM event emitter when location is selected
   */
  @Event() selected: EventEmitter;

  /**
   * Custom DOM event emitter when map is clicked
   */
  @Event() mapClicked: EventEmitter;

  /**
   * Custom DOM event emitter when current location is selected
   */
  @Event() currentLocationChanged: EventEmitter;

  /**
   * Event emitted when the input is invalid.
   */
  @Event() invalidInput: EventEmitter<any>;

  // rendering functions
  private getLocationModal() {
    return (
      <div>
        <div class="s-map-modal-title">{!!this.modalTitle ? this.modalTitle : this.modalActivityTitle}</div>
        <div class="s-map-modal-body">
          <div class="s-map-element" ref={el => (this.mapElement = el)}></div>
          {this.readonly ? "" :
            [
              this.searchable && (
                <div class="s-map-search-wrapper">
                  <input class="s-map-search-input" ref={el => (this.searchInput = el)} placeholder={this.searchPlaceholder}></input>
                </div>
              ),
              <salla-button
                class="s-map-my-location-button"
                onClick={() => {
                  this.getCurrentLocation();
                }}
                shape="icon"
                color="primary"
              >
                <span innerHTML={CurrentLocation}></span>
              </salla-button>,
              <salla-button
                class="s-map-submit-button"
                color="primary"
                width="wide"
                onClick={() => {
                  let points = {
                    lat: this.lat,
                    lng: this.lng,
                    address: this.formattedAddress ? this.formattedAddress : null,
                  };
                  salla.event.emit('salla-map::selected', points)
                  this.selected.emit(points);
                  this.selectedLat = points.lat;
                  this.selectedLng = points.lng;
                  this.getPositionAddress(new google.maps.LatLng(points.lat, points.lng), true);
                  if (!this.selectedLat || !this.selectedLng) {
                    this.mapInput.value = null;
                  } else {
                    this.mapInput.value = `${this.selectedLat}, ${this.selectedLng}`;
                  }
                  this.mapInput.dispatchEvent(new window.Event('change', { bubbles: true }))
                  this.locationModal.close();
                }}
              >
                {this.confirmButtonTitle}
              </salla-button>]
          }
        </div>
      </div>
    );
  }

  // render
  render() {
    return (
      <Host class="s-map-wrapper">
        <salla-modal
          class="s-map-modal-wrapper"
          noPadding
          ref={modal => {
            this.locationModal = modal as HTMLSallaModalElement;
          }}
        >
          {this.getLocationModal()}
        </salla-modal>

        <slot name="button">
          <salla-button
            onClick={() => {
              this.open();
            }}
            color="primary"
            class="s-map-location-button"
          >
            <span class="s-map-location-icon" innerHTML={this.formattedAddress ? Edit : Location} />
            {this.formattedAddress ? (
              <div>
                {this.locateButtonEdit} | {this.formatAddress(this.formattedAddress)}
              </div>
            ) : (
              this.locateButtonTitle
            )}
          </salla-button>
        </slot>

        <input class="s-hidden" name={this.name} required={this.required} value={this.getLatLng()}
          ref={color => this.mapInput = color} />
      </Host>
    );
  }
}
