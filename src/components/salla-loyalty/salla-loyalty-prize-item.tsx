import { Component, h, Prop, Host, Event, EventEmitter } from '@stencil/core';
import { Item } from "./loyalty-schema"


@Component({
    tag: 'salla-loyalty-prize-item',
    styleUrl: 'salla-loyalty-prize-item.css',
})
export class SallaLoyaltyPrizeItem {

    /**
     * Prize item to be displayed in this component.
     */
    @Prop() item: Item;

    /**
     * Event emmited when the user select this item.
     */
    @Event() prizeItemSelected: EventEmitter<Item>

    onPrizeItemClick() {
        this.prizeItemSelected.emit(this.item)
    }

    render() {
        return (
            <Host>
                <div onClick={this.onPrizeItemClick.bind(this)}>
                    <img class="s-loyalty-prize-item-image" src={this.item.image} alt={this.item.name} />
                    <div class="s-loyalty-prize-item-title">{this.item.name}</div>
                    <div class="s-loyalty-prize-item-subtitle">{this.item.description}</div>
                    <div class="s-loyalty-prize-item-points">{this.item.cost_points} Points</div>
                </div>
            </Host>
        );
    }
}
