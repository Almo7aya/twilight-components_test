import {Component, h, Host, Method, Prop, State} from "@stencil/core";
import StoreAlt from '../../assets/svg/store-alt.svg';
import Search from '../../assets/svg/search.svg';
import {ModeType, ProductAvailability, Scope} from './interfaces';


/**
 * @slot footer - The bottom section of the component, used for form action. Utilizes the `handleSubmit` method to submit the form.
 */
@Component({
  tag: 'salla-scopes',
  styleUrl: 'salla-scopes.css',
})
export class SallaScopees {

  constructor() {
    salla.event.on('scopes::open', ({mode = null, product_id = null}) => {
      this.open(mode, product_id)
    });

    salla.lang.onLoaded(() => {
      this.translationLoaded = true;
    });

  }

  private changeBtn: HTMLSallaButtonElement;
  private modal: HTMLSallaModalElement;
  //to avoid over loading scopes in each open call
  private loadedScopes: any = {
    [ModeType.DEFAULT]: null,
    [ModeType.AVAILABILITY]: null,
  };
  @State() translationLoaded: boolean = false;
  @State() mode: ModeType.AVAILABILITY | ModeType.DEFAULT = ModeType.DEFAULT;
  @State() current_scope: any;
  @State() scopes: Scope[] | ProductAvailability[] = [];
  @State() originalScopesList: Scope[] | ProductAvailability[] = [];
  @State() selected_scope: any;
  @State() isOpenedBefore: string = salla.storage.get("branch-choosed-before");
  @State() hasError: boolean = false;
  @State() loading: boolean = false;

  /**
   * Optionally open the modal or enforce the pop-up to the viewer
   */
  @Prop() selection: 'optional' | 'mandatory' = 'optional';

  /**
   * Dictates when to show the search field
   */
  @Prop() searchDisplayLimit: number = 6;


  /**
   * Closes the scope modal.
   */
  @Method()
  async close() {
    return await this.modal?.close();
  }

  /**
   * Opens the scope modal.
   */
  @Method()
  async open(mode: any = ModeType.DEFAULT, product_id: number = null) {
    this.hasError = false;
    this.mode = [ModeType.AVAILABILITY, ModeType.DEFAULT].includes(mode) ? mode : ModeType.DEFAULT;
    this.loading = !this.loadedScopes[this.mode];
    this.setScopeValues([]);


    salla.log('SallaScope:: opened');
    this.modal.open()
    if (!this.loading) {
      this.setScopeValues(this.loadedScopes[this.mode]);
      return this.modal.stopLoading();
    }

    let callback = () => mode == ModeType.AVAILABILITY ? salla.scope.getProductAvailability(product_id) : salla.scope.get();
    return await salla.api.withoutNotifier(callback)
      .then((resp) => {
        if (mode == ModeType.AVAILABILITY) {
          return this.setScopeValues(this.loadedScopes[ModeType.AVAILABILITY]=resp.data)
        }
        this.setScopeValues(this.loadedScopes[this.mode]=resp.data.scopes)
      }).catch(e => {
        console.log(e)
        this.hasError = true;
      })
      .finally(() => {
        this.modal.stopLoading()
        this.loading = false
      });
  }

  /**
   * Submit form to change exsiting scope.
   */
  @Method()
  async handleSubmit() {

    let payload = {'id': this.current_scope.id}
    this.changeBtn.load();
    return await salla.scope.change(payload)
      .then(() => {
        salla.storage.set("branch-choosed-before", true);
        salla.storage.set("scope", {
          'type': this.current_scope.type,
          'id': this.current_scope.id
        });
        window.location.replace(salla.helpers.addParamToUrl('scope', this.current_scope.id));
      }).catch(e => console.log(e))
      .finally(() => {
        this.changeBtn.stop()
      })
  }

  private setScopeValues(value: Scope[]) {
    this.scopes = value;
    this.originalScopesList = value;

    if (value?.length == 1) {
      this.current_scope = value[0]
      this.selected_scope = value[0]
    } else {
      this.current_scope = value?.find(scope => scope.selected)
      this.selected_scope = value?.find(scope => scope.selected)
    }
  }

  private handleSearchFieldTyping(e) {
    let value = e.target.value.toLocaleLowerCase()
    if (!!value) {
      this.scopes = (this.originalScopesList as any).filter(scope => scope.name.toLowerCase().includes(value))
    } else {
      this.scopes = this.originalScopesList
    }
  }

  private handleScopeSelection(event: any) {
    this.current_scope = (this.scopes as any)?.find(scope => scope.id == event.target.value)
  }

  private getFormTitle = () => {
    if (this.originalScopesList?.length < 2) return "";
    return this.mode === ModeType.DEFAULT ?
      salla.lang.get("blocks.scope.shopping_from_another_branch") :
      salla.lang.get('blocks.scope.search_for_availability_in_other_branches');
  }

  private placeholderContent() {
    return <salla-placeholder alignment="center" class="s-scopes-placeholder">
      <span slot="title">{salla.lang.get("blocks.scope.branch_looking_for_not_found")}</span>
      <span slot="description">{salla.lang.get("blocks.scope.our_services_not_available_in_this_branch")}</span>
    </salla-placeholder>
  }

  private defaultContent() {
    return [<div class="s-scopes-container s-scrollbar">
      {this.scopes?.map((scope) =>
        <div class="s-scopes-input-wrap" data-selection={this.selection}>
          <input
            id={`${this.selection} + '_scope_' + ${scope.id}`}
            name="lang" type="radio"
            value={scope.id}
            onChange={(event) => this.handleScopeSelection(event)}
            class="s-scopes-input"
            checked={!!this.current_scope && this.current_scope.id == scope.id}/>
          <label
            htmlFor={`${this.selection} + '_scope_' + ${scope.id}`}
            class="s-scopes-label s-scopes-clickable">
            <span>{scope.name}</span>
          </label>
        </div>
      )}
    </div>,
      this.footerContent()]
  }

  private availabilityContent() {
    return <div class="s-scopes-container">
      {this.scopes?.map((scope: any) =>
        <div class="s-scopes-input-wrap" data-selection={this.selection}>
          <h2
            class={{"s-scopes-label": true, "s-scopes-clickable": this.mode === ModeType.DEFAULT}}>
            <span>{scope.name}</span>
          </h2>
          <h2 style={{'color': (scope as ProductAvailability)?.availability?.color}}
              class={`s-scopes-${(scope as ProductAvailability)?.availability?.key}`}>{(scope as ProductAvailability)?.availability?.label}</h2>
        </div>
      )
      }
    </div>
  }

  private footerContent() {
    return <div class="s-scopes-footer">
      <slot name="footer">
        <salla-button ref={btn => this.changeBtn = btn} disabled={!this.current_scope}
                      onClick={() => this.handleSubmit()} class="s-scopes-submit" loader-position="center" width="wide">
          {salla.lang.get('common.elements.confirm')}
        </salla-button>
      </slot>
    </div>
  }

  render() {
    return (
      <Host>
        <salla-modal
          ref={modal => this.modal = modal}
          isClosable={!!(this.isOpenedBefore || (this.selection == 'optional'))}
          class="s-scopes-modal"
          isLoading={this.loading}
          has-skeleton>
          {this.loading ?
            <div slot="loading">
              <div class="s-scopes-skeleton">
                <salla-list-tile class="s-scopes-header">
                  <div slot="icon" class="s-scopes-header-icon">
                    <salla-skeleton type="circle"></salla-skeleton>
                  </div>

                  <div slot="title" class="s-scopes-header-title mb-5">
                    <salla-skeleton height='15px' width='50%'></salla-skeleton>
                  </div>
                  <div slot="subtitle" class="s-scopes-header-subtitle">
                    <salla-skeleton height='10px'></salla-skeleton>
                    <salla-skeleton height='10px' width='75%'></salla-skeleton>
                  </div>
                </salla-list-tile>
                <div class="s-scopes-skeleton-search">
                  <salla-skeleton height='10px' width='50%'></salla-skeleton>
                  <salla-skeleton height='30px' width='100%'></salla-skeleton>
                </div>
                <div class="s-scopes-skeleton-scopes">
                  <salla-skeleton height='10px' width='30%'></salla-skeleton>
                  <salla-skeleton height='10px' width='25%'></salla-skeleton>
                  <salla-skeleton height='10px' width='30%'></salla-skeleton>
                  <salla-skeleton height='10px' width='25%'></salla-skeleton>
                  <salla-skeleton height='10px' width='30%'></salla-skeleton>
                  <salla-skeleton height='10px' width='25%'></salla-skeleton>
                  <salla-skeleton height='10px' width='30%'></salla-skeleton>
                  <salla-skeleton height='10px' width='25%'></salla-skeleton>
                </div>
                <div class="s-scopes-skeleton-btn">
                  <salla-skeleton height='40px' width='100%'></salla-skeleton>
                </div>

              </div>
            </div>
            :
            [<salla-list-tile class={this.originalScopesList?.length ? "s-scopes-header block" : "s-hidden"}>
              <div slot="icon" class="s-scopes-header-icon" innerHTML={StoreAlt}/>
              <div slot="title" class="s-scopes-header-title">
                {salla.lang.get('blocks.scope.you_are_browse_store_from')}
              </div>
              <div slot="subtitle" class="s-scopes-header-subtitle">
                {!!this.selected_scope ? this.selected_scope.name : ""}
              </div>
            </salla-list-tile>,
              <div class="s-scopes-wrap">
                {!!this.originalScopesList?.length && <h4 class="s-scopes-title">{this.getFormTitle()}</h4>}
                {this.originalScopesList?.length > this.searchDisplayLimit ?
                  <div class="s-scopes-search-wrapper">
                    <div class="s-scopes-search-icon" innerHTML={Search}/>
                    <input type="text" class="s-scopes-search-input" onInput={e => this.handleSearchFieldTyping(e)}
                           enterkeyhint="search"
                           placeholder={salla.lang.get('blocks.scope.searching_for_a_branch')}/>
                  </div>
                  : ""
                }
                {this.hasError || this.originalScopesList?.length < 2 ?
                  this.placeholderContent()
                  : this.mode === ModeType.DEFAULT ? this.defaultContent() : this.availabilityContent()}
              </div>]
          }
        </salla-modal>
      </Host>
    );
  }

  componentDidLoad() {
    if (!this.isOpenedBefore && this.selection == 'mandatory') {
      this.open()
    }
  }
}
