import {
    Component, Prop, Event, EventEmitter, Method, State, h
} from '@stencil/core';

import { generateRandomId } from './utils';
/**
 * @slot The default slot.
 */
@Component({
    tag: 'salla-tab-header',
    styleUrl: 'salla-tab-header.css',
    shadow: false,
})

export class SallaTabHeader {

    id: string = generateRandomId();

    /**
     * Header identifier name to sync with the content.
     */
    @Prop() name: string;

    /**
   * The class applied to the currently active(selected) tab
   */
    @Prop() activeClass: string = undefined;

    /**
     * Set the height of the tab bar
     */
    @Prop() height: number | string = undefined;

    /**
     * Center tab items in the given flex.
     */
    @Prop() centered: boolean = false;

    /**
     * Emits event object when clicked or selected.
     */
    @Event() tabSelected: EventEmitter;

    @State() isSelected: boolean = false;

    /**
     * Expose self for the parent.
     */
    @Method() async getChild() {
        return {
            selected: this.selected.bind(this),
            unselect: this.unselect.bind(this),
            name: this.name,
            id: this.id
        }
    }

    unselect() {
        this.isSelected = false;
    }

    selected() {
        this.isSelected = true;
    }

    onClick() {
        this.getChild().then(child => {
            this.tabSelected.emit(child);
        })
    }

    render() {
        const classes = {
            's-tabs-header-item': true,
            's-tabs-bg-normal': true,
            's-tabs-active': this.isSelected,
        };

        return [
            <div class={classes} onClick={this.onClick.bind(this)} >
                <slot />
            </div>,
        ];
    }

}
