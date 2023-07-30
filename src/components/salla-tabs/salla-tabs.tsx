import {Component, Element, Listen, Prop, h} from '@stencil/core';

import {ISallaTabContentData, ISallaTabHeaderData, ISallaTabGroup} from './interfaces';

/**
 * @slot header - The tab header section. `salla-tab-header` component is used for this purpose.
 * @slot content - The active tab content section. `salla-tab-content` component is used for this purpose.
 */
@Component({
  tag: 'salla-tabs',
  styleUrl: 'salla-tabs.css',
  shadow: false,
})
export class SallaTabs {

  tabsHeader: ISallaTabHeaderData[];
  tabsContent: ISallaTabContentData[];
  tabGroup: ISallaTabGroup[];

  /**
   * Background color
   */
  @Prop() backgroundColor: string = undefined;
  /**
   * Align tabs vertically.
   */
  @Prop() vertical: boolean = false


  @Element() host: HTMLElement;

  componentWillLoad() {
    this.createGroup().then(
      () => {
        const [group] = this.tabGroup;
        this.selectGroup(group);
      }
    )

  }

  @Listen('tabSelected')
  onSelectedTab(event: CustomEvent) {
    const group = this.tabGroup.find(group => group.header.id === event.detail.id);
    this.selectGroup(group);
  }

  async createGroup() {
    const tabsHeaderEl = Array.from(this.host.querySelectorAll('salla-tab-header')) as HTMLSallaTabHeaderElement[];
    this.tabsHeader = await Promise.all(tabsHeaderEl.map(async el => await (el as HTMLSallaTabHeaderElement).getChild()));


    const tabsContentEl = Array.from(this.host.querySelectorAll('salla-tab-content')) as HTMLSallaTabContentElement[];
    this.tabsContent = await Promise.all(tabsContentEl.map(async el => await (el as HTMLSallaTabContentElement).getChild()));


    this.tabGroup = this.tabsHeader.map(header => {
      const content = this.tabsContent.find(content => content.name === header.name);

      return {
        header: header,
        content: content
      };
    });
  }

  selectGroup(group: ISallaTabGroup) {

    this.tabGroup.map(g => {
      g.header.unselect();
      g.content.unselect();
    });

    group.header.selected();
    group.content.selected();
  }

  render() {
    return [
      <div class="s-tabs">
        <div class="s-tabs-header">
          <slot name="header"/>
        </div>
        <div class="s-tabs-content-wrapper">
          <slot name="content"/>
        </div>
      </div>
    ];
  }

}
