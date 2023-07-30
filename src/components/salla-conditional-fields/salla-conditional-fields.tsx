import { Component, Element, Host, Listen, h } from '@stencil/core';

/**
 * its to easy to use, currenlty its support select & checkbox input as trigger for show/hide the dom
 * the dom you can put it like this data-show-when="{name of the field} {= or !=} {value of the field}"
 */
@Component({
  tag: 'salla-conditional-fields'
})
export class SallaConditionalFields {

  @Element() host: HTMLElement;

  private hideAllOptions(optionId) {
    this.host.querySelectorAll(`[data-show-when^="options[${optionId}"]`).forEach((field: HTMLElement) => {
      field.classList.add('hidden');
      this.hideAllOptions(field.dataset.optionId);
      this.disableInputs(field);
    });
  }

  private disableInputs(field) {
    field.querySelectorAll('[name]').forEach((input) => {

      input.setAttribute('disabled', '');
      input.removeAttribute('required');
      if (input?.tagName?.toLowerCase() === 'select') {
        input.value = ''
      }
      if (['checkbox'].includes(input.getAttribute('type')) && input.hasOwnProperty('checked')) {
        // @ts-ignore
        input.checked = false;
      }
    });
  }
  
  @Listen('change')
  changeHandler(event) {
    salla.event.emit('salla-onditional-fields::change', event);
    salla.log('Received the change event: ', event);

    if (!event.target || !['SELECT'].includes(event.target.tagName) && !['checkbox'].includes(event.target.getAttribute('type'))) {
      salla.log('Ignore the change because is not support input: ' + (event?.target?.tagName || 'N/A'));
      return;
    }

    // to extract the option id from the input name, the supported names are name[*] and name[*][]
    let optionId = event.target.name.replace('[]', '');
    let isMultiple = event.target.getAttribute('type') === 'checkbox';


    salla.log('Trying to find all the element with condition:', `[data-show-when^="${optionId}"]`);

    this.host.querySelectorAll(`[data-show-when^="${optionId}"]`)
      .forEach((field: HTMLElement) => {
        let isEqual = !field?.dataset.showWhen.includes('!=');
        let value = field?.dataset.showWhen.replace(/(.*)(=|!=)(.*)/gm, '$3').trim();
        // let isSelected = isMultiple ? event.target?.checked : value === event.target.value;
        let isSelected;

        if (isMultiple) {
          // @ts-ignore
          let selectedValues = Array.from(this.host.querySelectorAll(`input[name="${event.target.name}"]:checked`), e => e?.value);
          isSelected = selectedValues.includes(value.toString());
        } else {
          isSelected = value === event.target.value;
        }

        salla.log('The input is ', (isMultiple ? 'Multiple' : 'Single'), ' value:', isSelected);

        let showTheInput = (isEqual && isSelected) || (!isEqual && !isSelected);
        if (showTheInput) {
          field.classList.remove('hidden');
          field.querySelectorAll('[name]').forEach((input) => {
            input.removeAttribute('disabled');


            // Return required attribute to the input if the option is required
            const closestProductOption = (input as HTMLInputElement).closest('.s-product-options-option') as HTMLElement;
            if (closestProductOption.dataset.optionRequired === 'true') {
              input.setAttribute('required', '');
            }


            // Handle multiple checkboxes with same name and required attribute 
            if (input.getAttribute('type') === 'checkbox') {
              const checkboxes = Array.from(document.querySelectorAll(`input[type="checkbox"][name="${input.getAttribute('name')}"]`)) as HTMLInputElement[];
              const isAnyChecked = checkboxes.some((checkbox) => checkbox.checked);      
              if (isAnyChecked) {
                checkboxes.forEach((checkbox) => {
                  checkbox.removeAttribute('required');
                });
              }
            }
            //To handle focus on hidden input error
            if (!['checkbox'].includes(input.getAttribute('type')) && field.getElementsByClassName('required').length) {
              input.setAttribute('required', '');
            }
          });
        } else {
          this.hideAllOptions(field.dataset.optionId);
          field.classList.add('hidden');
          this.disableInputs(field);
        }
      });
  }

  componentDidRender() {
    this.host.querySelectorAll(`[data-show-when]`).forEach((field) => {
      // @ts-ignore
      let optionName = field?.dataset?.showWhen.replace(/(.*)(=|!=)(.*)/gm, '$1').trim();
      if (!optionName) {
        return;
      }

      this.changeHandler({
        target: this.host.querySelector('[name^="' + optionName + '"]')
      })
    });
  }

  render() {
    return (
      <Host>
        <slot></slot>
      </Host>
    );
  }
}
