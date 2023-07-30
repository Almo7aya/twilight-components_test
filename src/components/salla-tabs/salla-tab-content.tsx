import { Component, Prop, State, Method, h } from '@stencil/core';
/**
 * @slot The default slot.
 */
@Component({
    tag: 'salla-tab-content',
    styleUrl: 'salla-tab-content.css',
    shadow: false,
})

export class SallaTabContent {

    /**
     * Set name of the tab content. Mainly used as a key to s
     * ynchronize the content with it's respective header.
     */
    @Prop() name: string;

    @State() isSelected: boolean = false;

    /**
     * Expose self for the parent.
     */
    @Method() async getChild() {
        return {
            selected: this.selected.bind(this),
            unselect: this.unselect.bind(this),
            name: this.name
        };
    }

    unselect() {
        this.isSelected = false;
    }

    selected() {
        this.isSelected = true;
    }

    render() {

        const classes = {
            's-tabs-content': true,
            's-tabs-content-selected': this.isSelected
        };

        return (
            <div class={classes}>
                <slot />
            </div>
        );
    }
}
