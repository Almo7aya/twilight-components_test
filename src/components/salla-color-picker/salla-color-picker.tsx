import {Component, Prop, h, Host, Element, Event, EventEmitter, State, Method} from '@stencil/core';
import Picker from 'vanilla-picker';
import {Color, Options} from './interfaces'
import ArrowDown from "../../assets/svg/keyboard_arrow_down.svg"

@Component({
  tag: 'salla-color-picker',
  styleUrl: 'salla-color-picker.css',
})
export class SallaColorPicker {
  private picker: Picker;
  private colorInput: HTMLInputElement;
  @State() widgetColor: string;
  @Element() host: HTMLElement;
  private canvas: HTMLDivElement;

  /**
   * File input name for the native formData
   */
  @Prop() name: string = 'color';

  /**
   * Set if the color picker input is required or not
   */
  @Prop() required: boolean = false;

  /**
   * Initial color for the picker.
   */
  @Prop({reflect: true, mutable: true}) color: string

  /**
   * How to display the selected color in the text field
   * (the text field still supports input in any format).
   */
  @Prop() format: 'hex' | 'hsl' | 'rgb' = 'hex';

  /**
   * Whether to have a "Cancel" button which closes the popup.
   */
  @Prop() showCancelButton: boolean = false;

  /**
   * Whether to show a text field for color value editing.
   */
  @Prop() showTextField: boolean = true;

  /**
   * Whether to enable adjusting the alpha channel.
   */
  @Prop() enableAlpha: boolean = false;

  /** EVENTS */
  /**
   * Event whenever the color changes.
   */
  @Event() colorChanged: EventEmitter<Color>;

  /**
   * Event emitted when the input is invalid.
   */
  @Event() invalidInput: EventEmitter<any>;

  colorChangeHandler(color: Color) {
    this.colorInput.value = color.hex;
    this.colorChanged.emit(color);
  }

  /**
   * Event emitter when the user clicks "Ok".
   */
  @Event() submitted: EventEmitter<Color>;

  submittedHandler(color: Color) {
    this.setColorValue(color.rgbaString, true)
    this.canvas.style.backgroundColor = color.rgbString;
    this.colorInput.value = color.hex;
    this.colorInput.dispatchEvent(new window.Event('change', {bubbles: true}))
    this.submitted.emit(color);
  }

  /**
   * Event emitter when the popup opens.
   */
  @Event() popupOpened: EventEmitter<Color>;

  popupOpenedHandler(color: Color) {
    this.setPopInPosition()
    this.popupOpened.emit(color);
  }

  /**
   * Event emitter when the popup closes.
   */
  @Event() popupClosed: EventEmitter<Color>;

  popupClosedHandler(color: Color) {
    this.popupClosed.emit(color);
  }

  /** Methods */
  /**
   * Set the picker options.
   *
   * (Usually a new .parent and .color).
   * @param {Object} options
   */
  @Method()
  async setPickerOption(options: Options) {
    this.picker.setOptions(options)
  }

  /**
   * Move the popup to a different parent, optionally opening it at the same time.
   *
   * (Usually a new .parent and .color).
   * @param {Options} option
   *
   * Whether to open the popup immediately.
   * @param {boolean} openImmediately
   */
  @Method()
  async movePopUp(options: Options, openImmediately: boolean) {
    this.picker.movePopup(options, openImmediately)
  }

  /**
   * Set/initialize the picker's color.
   *
   * Color name, RGBA/HSLA/HEX string, or RGBA array.
   * @param {string} color
   *
   * If true, won't trigger onChange.
   * @param {boolean} triggerEvent
   */
  @Method()
  async setColorValue(color: string, triggerEvent: boolean) {
    this.picker.setColor(color, triggerEvent)
  }

  /**
   * Show/open the picker.
   */
  @Method()
  async openPicker() {
    this.picker.show()
  }

  /**
   * Close/Hide the picker.
   */
  @Method()
  async closePicker() {
    this.picker.hide()
  }

  /**
   * Release all resources used by this picker instance.
   */
  @Method()
  async destroyPicker() {
    this.picker.destroy()
  }

  componentWillLoad() {
    salla.onReady(() => {
      this.color = this.color ? this.color : salla.config.get('theme.color.primary', '#5dd5c4');
    })
  }

  private setPopInPosition() {
    const popup = this.host.querySelector('.picker_wrapper') as HTMLElement;
    const widgetPosition = (this.host.querySelector('.s-color-picker-widget') as HTMLElement).getBoundingClientRect();
    const widgetToWindowEq = window.innerWidth / 2 - widgetPosition.width / 2;
    const widgetInLeft = widgetToWindowEq > widgetPosition.x;
    const widgetInRight = widgetToWindowEq < widgetPosition.x;
    const widgetInCenter = widgetToWindowEq === widgetPosition.x;
    const isMobile = window.innerWidth < 768;
    if (isMobile && widgetInLeft) {
      popup.style.left = '0';
    }
    if (isMobile && (widgetInRight)) {
      popup.style.left = 'auto';
    }
    if (!isMobile || (isMobile && ((!widgetInRight && !widgetInLeft) || widgetInCenter))) {
      popup.style.left = `-95px`;
    }
  }


  private initColorPicker() {
    this.picker = new Picker({
      parent: this.host,
      color: this.color,
      popup: 'bottom',
      // template: string,
      // layout: string,
      alpha: this.enableAlpha,
      editor: this.showTextField,
      editorFormat: this.format,
      cancelButton: this.showCancelButton,
      onChange: (color: Color) => this.colorChangeHandler(color),
      onDone: (color: Color) => this.submittedHandler(color),
      onOpen: (color: Color) => this.popupOpenedHandler(color),
      onClose: (color: Color) => this.popupClosedHandler(color),
    });
  }

  render() {
    return (
      <Host class="s-color-picker-main">
        <slot name="widget">
          <div class="s-color-picker-widget">
            <div class="s-color-picker-widget-canvas" ref={dv => this.canvas = dv}/>
            <span innerHTML={ArrowDown}/>
          </div>
        </slot>
        <input class="s-hidden" name={this.name} required={this.required} value={this.color}
               ref={color => this.colorInput = color}/>
      </Host>
    );
  }

  componentDidLoad() {
    this.canvas.style.backgroundColor = this.color;
    this.initColorPicker()

    this.colorInput.addEventListener('invalid', e => {
      this.invalidInput.emit(e);
    });
    this.colorInput.addEventListener('input', () => {
      this.colorInput.setCustomValidity('');
      this.colorInput.reportValidity();
    });
  }
}
