import {Component, Host, State, h, Prop} from '@stencil/core';

@Component({
  tag: 'salla-comment-form',
  styleUrl: 'salla-comment-form.css',
})
export class SallaCommentForm {

  constructor() {
    salla.lang.onLoaded(() => {
      this.placeholder = salla.lang.get('blocks.comments.placeholder')
      this.submitText = salla.lang.get('blocks.comments.submit')
    });
    salla.onReady(() => {
      this.canComment = salla.config.get('user.can_comment');
      this.itemId = salla.config.get('page.id');
      this.type = salla.url.is_page('page-single') ? 'page' : 'product';
    });
  }

  /**
   * Type of entity the comment is being submitted for. Defaults to `salla.url.is_page('page-single') ? 'page' : 'product'`
   */
  @Prop({mutable: true, reflect: true}) type: 'product' | 'page';

  /**
   * To show the avatar or not in the comment form
   */
  @Prop() showAvatar: boolean;

  /**
   * The ID of the item(as defined in the type), where the comment is for. defaults to `salla.config.get('page.id')`
   */
  @Prop({mutable: true, reflect: true}) itemId?: string | number;

  @State() placeholder: string = salla.lang.get('blocks.comments.placeholder');
  @State() submitText: string = salla.lang.get('blocks.comments.submit');
  @State() canComment: boolean;

  private commentField: HTMLTextAreaElement;
  private submitBtn: HTMLSallaButtonElement;
  private commentForm: HTMLFormElement;


  private submit() {
    if (!this.commentForm.reportValidity()) {
      salla.log('CommentForm:: validation error!');
      return;
    }
    this.submitBtn.load()
      .then(() => salla.comment.add({id: this.itemId, comment: this.commentField.value, type: this.type}))
      .finally(() => this.submitBtn.stop);
  }

  render() {
    return (
      <Host>
        {!!this.canComment ? <form ref={frm => this.commentForm = frm}>
          <div class="s-comment-form-wrapper">
            {this.showAvatar ?
              <img class="s-comment-form-avatar" src={salla.config.get('user.avatar')} alt="user avatar"/> : ''}
            <div class="s-comment-form-content">
              <textarea cols={30} rows={5} minlength="4" maxlength="500"
                        ref={field => this.commentField = field}
                        placeholder={this.placeholder}
                        class="s-comment-form-input"
                        required/>
              <br/>
              <div class="s-comment-form-action">
                <salla-button ref={btn => this.submitBtn = btn} loader-position='center' onClick={() => this.submit()}>
                  {this.submitText}
                </salla-button>
              </div>
            </div>
          </div>
        </form> : ''}
      </Host>
    );
  }
}
