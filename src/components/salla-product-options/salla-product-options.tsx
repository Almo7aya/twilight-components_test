import { Component, Prop, h, State, Element, Host, Event, EventEmitter, Method } from '@stencil/core';
import { Option, DisplayType, Detail } from './interfaces';
import CheckCircleIcon from '../../assets/svg/check.svg';
import CameraIcon from '../../assets/svg/camera.svg';
import FileIcon from '../../assets/svg/file-upload.svg';


@Component({
  tag: 'salla-product-options',
  styleUrl: 'salla-product-options.css',
})
export class SallaProductOptions {

  constructor() {
    this.canDisabled = !salla.config.get('store.settings.products.notify_options_availability');
    salla.lang.onLoaded(() => {
      this.outOfStockText = salla.lang.get("pages.products.out_of_stock");
      this.donationAmount = salla.lang.get('pages.products.donation_amount');
      this.selectDonationAmount = salla.lang.getWithDefault('pages.products.select_donation_amount', 'تحديد مبلغ التبرع');
      this.selectAmount = salla.lang.getWithDefault('pages.products.select_amount', 'اختر المبلغ');
    });

    if (this.options) {
      try {
        this.setOptionsData(Array.isArray(this.options) ? this.options : JSON.parse(this.options));
        return;
      } catch (e) {
        salla.log('Bad json passed via options prop');
      }
    }
    if (!Array.isArray(this.optionsData)) {
      salla.log('Options is not an array[] ---> ', this.optionsData);
      this.setOptionsData([]);
    }

    if (this.productId && !salla.url.is_page('cart')) {
      salla.api.product.getDetails(this.productId, ['options']).then(resp => this.setOptionsData(resp.data.options));
    }
  }

  private setOptionsData(optionsData: Option[]) {
    this.optionsData = optionsData;
    let that = this
    this.optionsData[0]?.details?.forEach(function (detail) {
      Object.entries(detail.skus_availability || {})
        .filter(sku => !sku[1])
        .map(sku => that.outSkus.push(Number(sku[0])));
    });
  }

  @Element() host: HTMLElement;

  private fileTypes: Object = {
    pdf: 'application/pdf',
    png: 'image/png',
    jpg: 'image/jpeg',
    word: 'application/doc,application/ms-doc,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    exl: 'application/excel,application/vnd.ms-excel,application/x-excel,application/x-msexcel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    txt: 'text/plain',
  };

  @State() optionsData: Option[];
  @State() outOfStockText: string = ''
  @State() donationAmount: string = salla.lang.get('pages.products.donation_amount')
  @State() selectDonationAmount: string = salla.lang.getWithDefault('pages.products.select_donation_amount', 'تحديد مبلغ التبرع')
  @State() selectAmount: string = salla.lang.getWithDefault('pages.products.select_amount', 'اختر المبلغ')
  @State() isCustomDonation: boolean = false;
  @State() selectedOptions: Array<any> = [];
  @State() canDisabled: boolean;
  @State() selectedSkus?: Array<string | number>;
  @State() selectedOutSkus?: Array<string | number>;
  private outSkus: Array<string | number> = [];
  private donationInput?: HTMLInputElement;

  /**
   * The id of the product to which the options are going to be fetched for.
   */
  @Prop() productId: number = salla.config.get('page.id');

  /**
   * Product detail information.
   */
  @Prop() options: string;

  /**
   * Get the id's of the selected options.
   * */
  @Method()
  async getSelectedOptionsData() {
    let selectedOptions = {}
    let formData = (this.host as any).getElementSallaData();
    formData.forEach(function (value, key) {
      key.startsWith('options[') && (selectedOptions[key.replace('options[', '').replace(']', '')] = value);
    });
    return selectedOptions;
  }

  /**
   * Report options form validity.
   * */
  @Method()
  async reportValidity() {
    let requiredElements: Array<HTMLInputElement> = this.host.querySelectorAll('[required]') as any;
    let pass = true;
    for (let i = 0; i < requiredElements.length; i++) {
      //if there is only one invalid option, return false
      if ('reportValidity' in requiredElements[i] && !requiredElements[i].reportValidity()) {
        pass = false;
      }
    }
    return pass;
  }

  /**
   * Return true if there is any out of stock options are selected and vise versa.
   * */
  @Method()
  async hasOutOfStockOption() {
    return this.selectedOptions.some(option => option.is_out) || (this.selectedSkus?.length && this.selectedSkus?.every(sku => this.outSkus.includes(sku)));
  }

  /**
   * Get selected options.
   * */
  @Method()
  async getSelectedOptions() {
    return this.selectedOptions;
  }

  /**
   * Get a specific option by its id.
   * */
  @Method()
  async getOption(option_id) {
    return this.optionsData.find(option => option.id === option_id);
  }

  /**
   * An event that emitted when any option is changed.
   */
  @Event() changed: EventEmitter;

  // @ts-ignore
  private invalidHandler(event, option: Option) {
    const closestProductOption = (event.target as HTMLInputElement).closest('.s-product-options-option') as HTMLElement;
    if (!salla.url.is_page('cart')) {
      closestProductOption.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    closestProductOption.classList.add('s-product-options-option-error');
  }

  private changedHandler(event, option) {
    let data = { event: event, option: option, detail: null };
    if (option.details) {
      let detail = option.details.find((detail) => {
        return Number(detail.id) === Number(event.target.value);
      });
      data.detail = detail
    }

    let optionElement = event.target.closest('.s-product-options-option');
    if (event.target.value
      || ((option.type == DisplayType.FILE || option.type == DisplayType.IMAGE) && event.type === 'added')
      || (option.type == DisplayType.MAP && event.type === 'selected' && (event.target.lat && event.target.lng))) {
      setTimeout(() => {
        optionElement.classList.remove('s-product-options-option-error');
      }, 200);
    }

    const index = this.selectedOptions.findIndex(option => option.option_id === data.option.id);
    index > -1 ? this.selectedOptions[index] = {
      ...data.detail,
      option_id: data.option.id
    } : this.selectedOptions.push({ ...data.detail, option_id: data.option.id })

    this.setSelectedSkus();
    this.handleRequiredMultipleOptions(option);
    this.changed.emit(data);
    salla.event.emit('product-options::change', data);
  }


  private handleDonationOptions = (event) => {
    event.preventDefault();
    event.stopPropagation();
    this.isCustomDonation = event.target.value === 'custom';
    if (this.donationInput) {
      if (event.target.value === 'custom') {
        this.donationInput.value = '';
        this.donationInput.focus()
      } else {
        this.donationInput.value = event.target.value;
      }
    }
  }

  private hideLabel = (option) => {
    if (option.type === DisplayType.DONATION && (option.donation && !option.donation.can_donate)) {
      return true;
    }
    return false;
  }

  private getExpireDonationMessage = (option) => {
    if(!option.donation){
      return;
    }
    let completed = option.donation.target_amount <= option.donation.collected_amount;
    return <div class={{"s-product-options-donation-message": true, "s-product-options-donation-completed": completed, "s-product-options-donation-expired": !completed}}>
      <p>{option.donation.target_message}</p>
      <span>{completed ? salla.money(option.donation.target_amount) : ''}</span>
    </div>
  }
  /**
   * loop throw all selected details, then get common sku, if it's only one, means we selected all of them;
   */
  private setSelectedSkus() {
    this.selectedSkus = this.selectedOptions.map(detail => Object.keys(detail.skus_availability || {}))
      .reduce((p, c) => p.filter(e => c.includes(e)))
      .map(sku => Number(sku));
  }

  private handleRequiredMultipleOptions(option) {
    if (option.type !== DisplayType.MULTIPLE_OPTIONS || !option.required) {
      return;
    }
    const optionContainer = this.host.querySelector(`[data-option-id="${option.id}"]`);
    const hasChecked = optionContainer.querySelectorAll('input:checked').length;
    optionContainer.querySelectorAll('input').forEach(input => input.toggleAttribute('required', !hasChecked));
  }

  private getLatLng(value, type: 'lat' | 'lng') {
    return value
      ? value.split(',')[type == 'lat' ? 0 : 1]
      : '';
  }

  private getDisplayForType(option: Option) {
    if (this[`${option.type}Option`]) {
      return this[`${option.type}Option`](option);
    }

    if (option.type === DisplayType.COLOR_PICKER) {
      return this.colorPickerOption(option)
    }

    if (option.type === DisplayType.MULTIPLE_OPTIONS) {
      return this.multipleOptions(option);
    }

    if (option.type === DisplayType.SINGLE_OPTION) {
      return this.singleOption(option);
    }
    salla.log(`Couldn't find options type(${option.type})😢`);
    return '';
  }

  protected getOptionShownWhen(option: Option) {
    return option.visibility_condition
      ? { "data-show-when": `options[${option.visibility_condition.option}] ${option.visibility_condition.operator} ${option.visibility_condition.value}` }
      : {};
  }

  //we need the cart Id for productOption Image
  componentWillLoad() {
    this.outOfStockText = salla.lang.get('pages.products.out_of_stock')
    return salla.api.cart.getCurrentCartId();
  }

  render() {
    if (this.optionsData?.length == 0) {
      return;
    }

    return (
      <Host class="s-product-options-wrapper">
        {/* TODO:: move salla-conditional-field logic to here, no need of another component*/}
        <salla-conditional-fields>
          {this.optionsData.map((option: Option) =>
            <div class={`s-product-options-option-container${option.visibility_condition ? ' hidden' : ''}`}
              data-option-id={option.id}
              {...this.getOptionShownWhen(option)}>
              {option.name == 'splitter' ?
                this.splitterOption()
                : <div class="s-product-options-option" data-option-type={option.type}
                  data-option-required={`${option.required}`}>
                  <label htmlFor={'options[' + option.id + ']'} class={`s-product-options-option-label ${this.hideLabel(option) ? 's-product-options-option-label-hidden' : ''}`}>
                    <b>
                      {option.name}
                      {option.required && <span> * </span>} </b>
                    <small>{option.placeholder}</small>
                  </label>
                  <div class={`s-product-options-option-content ${this.hideLabel(option) ? 's-product-options-option-content-full-width' : ''}`}>
                    {this.getDisplayForType(option)}
                  </div>
                </div>}
            </div>
          )}
        </salla-conditional-fields>
      </Host>
    );

  }

  //@ts-ignore
  private donationOption(option: Option, product: Product) {
    return <div class="s-product-options-donation-wrapper">

      {option.donation?.can_donate ? [
        option.donation ?
          <div class="s-product-options-donation-progress">
            <salla-progress-bar donation={option.donation}>
            </salla-progress-bar>
          </div>
          : '',
        option.details.length ?
          [<h4>{this.selectAmount}</h4>,
          <div class="s-product-options-donation-options">
            {option.details.map((detail, i) =>
              <div class="s-product-options-donation-options-item">
                <input id={`donation-option-${i}`} type="radio" name="donating_option" checked={detail.is_selected} value={detail.additional_price} onChange={e => this.handleDonationOptions(e)} />
                <label htmlFor={`donation-option-${i}`}>
                  <span>{salla.money(detail.name)}</span>
                </label>
              </div>
            )}
            {option.donation?.custom_amount_enabled ?
              <div class="s-product-options-donation-options-item">
                <input id={`donation-option-custom`} type="radio" name="donating_option" value="custom" onChange={e => this.handleDonationOptions(e)} />
                <label htmlFor={`donation-option-custom`}>
                  <span> {this.selectDonationAmount} </span>
                </label>
              </div>
              : ''
            }
          </div>] : '',

        <div class={{ "s-product-options-donation-input-group": true, "shown": !option.details.length || (option.details.length && this.isCustomDonation) }}>
          <input
            type="text"
            id="donating-amount"
            name="donation_amount"
            class="s-form-control"
            ref={el => this.donationInput = el as HTMLInputElement}
            value={
              option.details.length
                && option.details.some(detail => detail.is_selected)
                ? option.details.find(detail => detail.is_selected).additional_price
                : option.value}
            // required
            placeholder={option.placeholder}
            onInput={e => salla.helpers.inputDigitsOnly(e.target)}
            onBlur={e => this.changedHandler(e, option)}
            onInvalid={(e) => this.invalidHandler(e, option)}
          />
          {/* value={option.value} */}
          <span class="s-product-options-donation-amount-currency">
            {salla.config.currency(salla.config.get('user.currency_code')).symbol}
          </span>
        </div>
      ] :
      this.getExpireDonationMessage(option)
      }
    </div>
  }

  private fileUploader(option: Option, additions: Object | null = null) {
    return <salla-file-upload
      {...(additions || {})}
      payload-name="file"
      value={option.value}
      instant-upload={true}
      name={`options[${option.id}]`}
      required={!option.visibility_condition && option.required}
      height="120px"
      onAdded={(e) => this.changedHandler(e, option)}
      url={salla.cart.api.getUploadImageEndpoint()}
      form-data={{ cart_item_id: this.productId, product_id: this.productId }}
      onInvalidInput={(e) => this.invalidHandler(e, option)}
      class={{ "s-product-options-image-input": true, required: option.required }}
    >
      <div class="s-product-options-filepond-placeholder">
        <span class="s-product-options-filepond-placeholder-icon"
          innerHTML={(additions as any).accept && (additions as any).accept.split(',').every(type => type.includes('image'))
            ? CameraIcon
            : FileIcon}
        />
        <p class="s-product-options-filepond-placeholder-text">{salla.lang.get('common.uploader.drag_and_drop')}</p>
        <span class="filepond--label-action">{salla.lang.get('common.uploader.browse')}</span>
      </div>
    </salla-file-upload>
  }

  //@ts-ignore
  private imageOption(option: Option) {
    return this.fileUploader(option, { accept: 'image/png,image/jpeg,image/jpg,image/gif' });
  }

  //@ts-ignore
  private fileOption(option: Option) {
    let types = option.details.map(detail => this.fileTypes[detail.name]).filter(Boolean);
    return types?.length
      ? this.fileUploader(option, { accept: types.join(',') })
      : 'File types not selected.';
  }

  // TODO: (ONLY FOR TESTING!) find a better way to make it testable, e.g. wrap it with a unique class like textOption
  //@ts-ignore
  private numberOption(option: Option) {
    return <input
      type="text"
      value={option.value}
      class="s-form-control"
      required={!option.visibility_condition && option.required}
      name={`options[${option.id}]`}
      placeholder={option.placeholder}
      onBlur={e => this.changedHandler(e, option)}
      onInvalid={(e) => this.invalidHandler(e, option)}
      onInput={e => salla.helpers.inputDigitsOnly(e.target)} />
  }

  //@ts-ignore
  private splitterOption() {
    return <div class="s-product-options-splitter" />
  }

  //@ts-ignore
  private textOption(option: Option) {
    return <div class="s-product-options-text">
      <input
        type="text"
        value={option.value}
        class='s-form-control'
        required={!option.visibility_condition && option.required}
        name={`options[${option.id}]`}
        placeholder={option.placeholder}
        onInvalid={(e) => this.invalidHandler(e, option)}
        onInput={e => this.changedHandler(e, option)} />
    </div>
  }

  //@ts-ignore
  private textareaOption(option: Option) {
    //todo::remove mt-1 class, and if it's okay to remove the tag itself will be great
    return <div class="s-product-options-textarea">
      <div class="mt-1">
        <textarea
          rows={4}
          value={option.value}
          class="s-form-control"
          required={!option.visibility_condition && option.required}
          id={`options[${option.id}]`}
          name={`options[${option.id}]`}
          placeholder={option.placeholder}
          onInvalid={(e) => this.invalidHandler(e, option)}
          onInput={(e) => this.changedHandler(e, option)} />
      </div>
    </div>
  }

  //@ts-ignore
  private mapOption(option: Option) {
    return <salla-map
      zoom={15}
      lat={this.getLatLng(option.value, 'lat')}
      lng={this.getLatLng(option.value, 'lng')}
      name={`options[${option.id}]`}
      searchable={true}
      required={option.required}
      onInvalidInput={(e) => this.invalidHandler(e, option)}
      onSelected={e => this.changedHandler(e, option)} />
  }

  private colorPickerOption(option: Option) {
    return <salla-color-picker
      onSubmitted={e => this.changedHandler(e, option)}
      name={`options[${option.id}]`}
      required={!option.visibility_condition && option.required}
      onInvalidInput={(e) => this.invalidHandler(e, option)}
      color={option.value} />
  }

  /**
   * ============= Date Time options =============
   */
  //@ts-ignore
  private timeOption(option: Option) {
    return <salla-datetime-picker
      noCalendar={true}
      enableTime={true}
      dateFormat="h:i K"
      value={option.value}
      placeholder={option.name}
      required={!option.visibility_condition && option.required}
      name={`options[${option.id}]`}
      class="s-product-options-time-element"
      onInvalidInput={(e) => this.invalidHandler(e, option)}
      onPicked={e => this.changedHandler(e, option)} />
  }

  //@ts-ignore
  private dateOption(option: Option) {
    //todo:: consider date-range @see https://github.com/SallaApp/theme-raed/blob/master/src/assets/js/partials/product-options.js#L8-L23
    return <div class="s-product-options-date-element">
      <salla-datetime-picker
        value={option.value}
        placeholder={option.name}
        required={!option.visibility_condition && option.required}
        minDate={new Date()}
        name={`options[${option.id}]`}
        onInvalidInput={(e) => this.invalidHandler(e, option)}
        onPicked={e => this.changedHandler(e, option)} />
    </div>
  }

  //@ts-ignore
  private datetimeOption(option: Option) {
    //todo:: consider date-range @see https://github.com/SallaApp/theme-raed/blob/master/src/assets/js/partials/product-options.js#L8-L23
    return <div class="s-product-options-datetime-element">
      <salla-datetime-picker
        enableTime={true}
        value={option.value}
        dateFormat="Y-m-d G:i:K"
        placeholder={option.name}
        required={!option.visibility_condition && option.required}
        name={`options[${option.id}]`}
        maxDate={option.to_date_time}
        minDate={option.from_date_time}
        onInvalidInput={(e) => this.invalidHandler(e, option)}
        onPicked={e => this.changedHandler(e, option)} />
    </div>
  }

  /**
   * ============= Advanced options =============
   */
  protected getOptionDetailName(detail: Detail, outOfStock: boolean = true, optionType?: string) {
    if (optionType && optionType == DisplayType.COLOR) {
      return detail.name
        + ((outOfStock && this.isOptionDetailOut(detail)) ? ` <br/> <p> ${this.outOfStockText} </p>` : '')
        + (detail.additional_price ? ` <p> (${salla.money(detail.additional_price)}) </p>` : '');
    }

    return detail.name
      + ((outOfStock && this.isOptionDetailOut(detail)) ? ` - ${this.outOfStockText}` : '')
      + (detail.additional_price ? ` (${salla.money(detail.additional_price)})` : '');
  }


  protected isOptionDetailOut(detail: Detail) {
    if (detail.is_out || !detail.skus_availability || !this.selectedSkus?.length) {
      return detail.is_out;
    }

    let isDetailSelected = this.selectedOptions.filter(option => option.id == detail.id).length;
    //if the current options is the only selected option, so we are sure that it's not out, because there is no other options selected yet
    if (isDetailSelected && this.selectedOptions.length == 1) {
      return false;
    }

    //if current details has sku in the possible outSkus it's out for sure
    if (isDetailSelected) {
      //here we will get the possible outSkus for current selected options
      let outSelectableSkus = this.selectedSkus.filter(sku => this.outSkus.includes(sku));
      return Object.keys(detail.skus_availability).some(sku => outSelectableSkus.includes(Number(sku)))
    }

    return this.selectedOptions.some(option => option.is_out && option.option_id !== detail.option_id)

  }

  private singleOption(option: Option) {
    return <div>
      <select name={`options[${option.id}]`}
        required={!option.visibility_condition && option.required}
        class="s-form-control"
        onInvalid={(e) => this.invalidHandler(e, option)}
        onChange={e => this.changedHandler(e, option)}>
        <option value="">{option.placeholder}</option>
        {
          option?.details.map((detail: Detail) => {
            return <option value={detail.id} disabled={this.canDisabled && this.isOptionDetailOut(detail)}
              selected={detail.is_selected}>
              {this.getOptionDetailName(detail)}
            </option>
          })
        }
      </select>
    </div>
  }

  private multipleOptions(option: Option) {
    let is_required = option.required && !option.details.some(detail => detail.is_selected) && !option.visibility_condition;
    return <div class={{ "s-product-options-multiple-options-wrapper": true, 'required': option.required }}>
      {
        option?.details.map((detail: Detail) => {
          return <div>
            <input type="checkbox"
              value={detail.id}
              disabled={this.isOptionDetailOut(detail)}
              checked={detail.is_selected}
              required={is_required}
              name={`options[${option.id}][]`}
              id={`field-${option.id}-${detail.id}`}
              onChange={(e) => this.changedHandler(e, option)}
              onInvalid={(e) => this.invalidHandler(e, option)}
              aria-describedby={`options[${option.id}]-description`} />
            <label htmlFor={`field-${option.id}-${detail.id}`}>{this.getOptionDetailName(detail)}</label>
          </div>
        })
      }
    </div>
  }

  //@ts-ignore
  private colorOption(option: Option) {
    return <fieldset class="s-product-options-colors-wrapper">
      {
        option?.details.map((detail) =>
          <div class="s-product-options-colors-item">
            <input type="radio"
              value={detail.id}
              required={!option.visibility_condition && option.required}
              checked={detail.is_selected}
              name={`options[${option.id}]`}
              disabled={this.canDisabled && this.isOptionDetailOut(detail)}
              id={`color-${this.productId}-${option.id}-${detail.id}`}
              onInvalid={(e) => this.invalidHandler(e, option)}
              onChange={e => this.changedHandler(e, option)} />
            <label htmlFor={`color-${this.productId}-${option.id}-${detail.id}`}>
              <span style={{ "background-color": detail.color }} />
              <div innerHTML={this.getOptionDetailName(detail, true, option.type)}></div>
            </label>
          </div>
        )
      }
    </fieldset>
  }

  //@ts-ignore
  private thumbnailOption(option: Option) {
    return <div class="s-product-options-thumbnails-wrapper">
      {option.details.map((detail: Detail) => {
        return <div>
          <input type="radio"
            value={detail.id}
            data-itemid={detail.id} //todo:: why need this? it's already in the value!
            required={!option.visibility_condition && option.required}
            checked={detail.is_selected}
            name={`options[${option.id}]`}
            data-img-id={detail.option_value}
            disabled={this.canDisabled && this.isOptionDetailOut(detail)}
            id={`option_${this.productId}-${option.id}_${detail.id}`}
            onInvalid={(e) => this.invalidHandler(e, option)}
            onChange={(e) => this.changedHandler(e, option)} />
          <label htmlFor={`option_${this.productId}-${option.id}_${detail.id}`}
            data-img-id={detail.option_value}
            class="go-to-slide">
            <img data-src={detail.image} src={detail.image} title={detail.name} alt={detail.name} />
            <span innerHTML={CheckCircleIcon} class="s-product-options-thumbnails-icon" />
            {this.isOptionDetailOut(detail) ?
              [
                <small class="s-product-options-thumbnails-stock-badge">{this.outOfStockText}</small>,
                this.canDisabled ? <div class="s-product-options-thumbnails-badge-overlay" /> : '',
              ]
              : ''}
          </label>
          <p>{this.getOptionDetailName(detail, false)} </p>
        </div>
      })}
    </div>
  }
}
