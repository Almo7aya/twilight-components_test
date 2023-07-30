import flatpickr from "flatpickr";
import {Component, h, Prop, Event, EventEmitter} from '@stencil/core';

import {DateOption, LocaleKey, DateLimit} from './interfaces';

@Component({
  tag: 'salla-datetime-picker',
  styleUrl: 'salla-datetime-picker.css',
})
export class SallaDatetimePicker {

  dateInput: HTMLInputElement;
  /**
   * Two way data binding to retrieve the selected date[time] value
   */
  @Prop({reflect: true, mutable: true}) value: string = null;

  /**
   * Whether this input i required or not
   */
  @Prop() required: boolean;
  /**
   * the name for the input
   */
  @Prop({reflect: true}) name: string;
  /**
   * Placeholder text to show on the input element
   */
  @Prop() placeholder: string = salla.lang.get('blocks.buy_as_gift.select_send_date_and_time')

  /**
   * Allows the user to enter a date directly into the input field. By default, direct entry is disabled.
   */
  @Prop() allowInput: boolean = true;

  /**
   * Allows the preloading of an invalid date. When disabled, the field will be cleared if the provided date is invalid
   */
  @Prop() allowInvalidPreload: boolean = false;

  /**
   * Exactly the same as date format, but for the altInput field.
   */
  @Prop() altFormat: string = "F j, Y";

  /**
   * Show the user a readable date (as per altFormat), but return something totally different to the server.
   */
  @Prop() altInput: boolean = false;

  /**
   * This class will be added to the input element created by the altInput option.
   * Note that altInput already inherits classes from the original input.
   */
  @Prop() altInputClass: string;

  /**
   * Instead of body, appends the calendar to the specified node instead.
   */
  @Prop() appendTo: HTMLElement = undefined;

  /**
   * Defines how the date will be formatted in the aria-label for calendar days,
   * using the same tokens as dateFormat. If you change this, you should choose a
   * value that will make sense if a screen reader reads it out loud.
   */
  @Prop() ariaDateFormat: string = "F j, Y";

  /**
   * Whether the default time should be auto-filled when the input is empty and gains or loses focus.
   */
  @Prop() autoFillDefaultTime: boolean = true;

  /**
   * Whether clicking on the input should open the picker.
   * Set it to false if you only want to open the calendar programmatically with [open()]
   */
  @Prop() clickOpens: boolean = true;

  /**
   * Whether calendar should close after date selection or not
   */
  @Prop() closeOnSelect: boolean = true;

  /**
   * When in "multiple" mode, conjunction is used to separate dates in the entry field.
   */
  @Prop() conjunction?: string;

  /**
   * A string of characters which are used to define how the date will be displayed in the input box.
   * The supported characters are defined in the table below.
   */
  @Prop() dateFormat: string = "Y-m-d";

  /**
   * Sets the initial selected date(s). If you're using mode: "multiple" or a range calendar supply an
   * Array of Date objects or an Array of date strings which follow your dateFormat. Otherwise, you can supply
   * a single Date object or a date string.
   */
  @Prop() defaultDate: DateOption | DateOption[];

  /**
   * Initial value of the hour element, when no date is selected
   */
  @Prop() defaultHour: number = 12;


  /**
   * Initial value of the minute element, when no date is selected
   */
  @Prop() defaultMinute: number = 0;

  /**
   * Initial value of the seconds element, when no date is selected
   */
  @Prop() defaultSeconds: number = 0;

  /**
   * Disables certain dates, preventing them from being selected.
   * See https://chmln.github.io/flatpickr/examples/#disabling-specific-dates
   */
  @Prop() disable: DateLimit<DateOption>[] = [];

  /**
   * Set this to true to always use the non-native picker on mobile devices.
   * By default, Flatpickr utilizes native datetime widgets unless certain options (e.g. disable) are used.
   */
  @Prop() disableMobile: boolean = false;

  /**
   * Disables all dates except these specified. See https://chmln.github.io/flatpickr/examples/#disabling-all-dates-except-select-few
   */
  @Prop() enable: DateLimit<DateOption>[] = [(_) => true];

  /**
   * Enables seconds selection in the time picker.
   */
  @Prop() enableSeconds: boolean = false;

  /**
   * Enables the time picker
   */
  @Prop() enableTime: boolean = false;

  /**
   * Allows using a custom date formatting function instead of the built-in handling for date formats using dateFormat, altFormat, etc.
   */
  @Prop() formatDate: (date: Date, format: string, locale: Object) => string;

  /**
   * Adjusts the step for the hour input (incl. scrolling)
   */
  @Prop() hourIncrement: number = 1;

  /**
   * Displays the calendar inline
   */
  @Prop() inline: boolean = false;

  /**
   * The locale, either as a string (e.g. "ar", "en") or as an object.
   * See https://chmln.github.io/flatpickr/localization/
   */
  @Prop() locale: LocaleKey = "en";

  /**
   * The maximum date that a user can pick to (inclusive).
   */
  @Prop() maxDate: DateOption = null;

  /**
   * The minimum date that a user can start picking from (inclusive).
   */
  @Prop() maxTime: DateOption = null;

  /**
   * The minimum date that a user can start picking from (inclusive).
   */
  @Prop() minDate: DateOption = null;

  /**
   * The minimum time that a user can start picking from (inclusive).
   */
  @Prop() minTime: DateOption = null;

  /**
   * Adjusts the step for the minute input (incl. scrolling) Defaults to 5
   */
  @Prop() minuteIncrement: number = 5;

  /**
   * Date selection mode, defaults to "single"
   */
  @Prop() mode: "single" | "multiple" | "range" | "time" = "single";

  /**
   * How the month should be displayed in the header of the calendar.
   * If showMonths has a value greater than 1, the month is always shown as static.
   */
  @Prop() monthSelectorType: "dropdown" | "static" = "dropdown";

  /**
   * HTML for the arrow icon, used to switch months.
   */
  @Prop() nextArrow: string = '<span class="sicon-keyboard_arrow_right"></span>';

  /**
   * Hides the day selection in calendar. Use it along with enableTime to create a time picker.
   */
  @Prop() noCalendar: boolean = false;

  /**
   * A custom datestring parser
   */
  @Prop() dateParser: (date: string, format: string) => Date;

  /**
   * How the calendar should be positioned with regards to the input. Defaults to "auto"
   */
  @Prop() position: "auto" | "above" | "below" | "auto left" | "auto center" | "auto right" | "above left" | "above center" | "above right" | "below left" | "below center" | "below right" | ((self: any, customElement: HTMLElement | undefined) => void) = "auto";

  /**
   *  The element off of which the calendar will be positioned. Defaults to the date input
   */
  @Prop() positionElement: HTMLElement;

  /**
   * HTML for the left arrow icon, used to switch months.
   */
  @Prop() prevArrow: string = '<span class="sicon-keyboard_arrow_left"></span>';

  /**
   * Whether to display the current month name in shorthand mode, e.g. "Sep" instead "September"
   */
  @Prop() shorthandCurrentMonth: boolean = false;

  /**
   * Position the calendar inside the wrapper and next to the input element*.
   */
  @Prop() static: boolean = false;

  /**
   * The number of months to be shown at the same time when displaying the calendar.
   */
  @Prop() showMonths: number = 1;

  /**
   * Displays time picker in 24 hour mode without AM/PM selection when enabled.
   */
  @Prop() time_24hr: boolean = false;

  /**
   * Enables display of week numbers in calendar.
   */
  @Prop() weekNumbers: boolean = false;

  /**
   * See https://chmln.github.io/flatpickr/examples/#flatpickr-external-elements
   */
  @Prop() wrap: boolean = false;


  /**
   * Event emitted when the date input gets changed by the user when selecting file(s).
   */
  @Event() picked: EventEmitter<any>;

  /**
   * Event emitted when the input is invalid.
   */
  @Event() invalidInput: EventEmitter<any>;

  render() {
    return <div class="s-datetime-picker">
      <input type="datetime" name={this.name} value={this.value} required={this.required}
             placeholder={this.placeholder}
             class="s-datetime-picker-input" ref={(el) => this.dateInput = el as HTMLInputElement}/>
    </div>;
  }

  componentDidLoad() {
    let options = {
      allowInput: this.allowInput,
      allowInvalidPreload: this.allowInvalidPreload,
      altFormat: this.altFormat,
      altInput: this.altInput,
      altInputClass: this.altInputClass,
      appendTo: this.appendTo,
      ariaDateFormat: this.ariaDateFormat,
      autoFillDefaultTime: this.autoFillDefaultTime,
      clickOpens: this.clickOpens,
      closeOnSelect: this.closeOnSelect,
      conjunction: this.conjunction,
      dateFormat: this.dateFormat,
      defaultDate: !!this.value ? Date.parse(this.value) : this.defaultDate,
      defaultHour: this.defaultHour,
      defaultMinute: this.defaultMinute,
      defaultSeconds: this.defaultSeconds,
      disable: this.disable,
      disableMobile: this.disableMobile,
      enable: this.enable,
      enableSeconds: this.enableSeconds,
      enableTime: this.enableTime,
      formatDate: this.formatDate,
      hourIncrement: this.hourIncrement,
      inline: this.inline,
      locale: this.locale,
      maxDate: this.maxDate,
      maxTime: this.maxTime,
      minDate: this.minDate,
      minTime: this.minTime,
      minuteIncrement: this.minuteIncrement,
      mode: this.mode,
      monthSelectorType: this.monthSelectorType,
      nextArrow: this.nextArrow,
      noCalendar: this.noCalendar,
      parseDate: this.dateParser,
      position: this.position,
      positionElement: this.positionElement,
      prevArrow: this.prevArrow,
      shorthandCurrentMonth: this.shorthandCurrentMonth,
      static: this.static,
      showMonths: this.showMonths,
      time_24hr: this.time_24hr,
      weekNumbers: this.weekNumbers,
      wrap: this.wrap,
      // @ts-ignore
      onChange: (selectedDates, dateStr) => this.picked.emit(this.value = dateStr)
      // onOpen: this.handleOnOpen(selectedDates, dateStr, instance)
      // onClose: this.handleOnClose(selectedDates, dateStr, instance)
    }

    flatpickr(this.dateInput, options);
    this.dateInput.addEventListener('invalid', e => {
      this.invalidInput.emit(e);
    });
    this.dateInput.addEventListener('input', () => {
      this.dateInput.setCustomValidity('');
      this.dateInput.reportValidity();
    });
  }
}
