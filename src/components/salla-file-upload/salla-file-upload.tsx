import {Component, Prop, h, Element, Host, Event, EventEmitter, Method} from '@stencil/core';
import * as FilePond from 'filepond';
import FilePondPluginFileValidateSize from 'filepond-plugin-file-validate-size';
import FilePondPluginImageExifOrientation from 'filepond-plugin-image-exif-orientation';
import FilePondPluginImagePreview from 'filepond-plugin-image-preview';
import FilePondPluginImageEdit from 'filepond-plugin-image-edit';
import FilePondPluginFileValidateType from 'filepond-plugin-file-validate-type';
import FilePondPluginFilePoster from 'filepond-plugin-file-poster';

import {FilePondFile} from './interfaces'
import {FilePond as FilePondType, FilePondErrorDescription} from 'filepond/types/index'


@Component({
  tag: 'salla-file-upload',
  styleUrl: 'salla-file-upload.css',
})
export class SallaFileUpload {
  constructor() {
    FilePond.registerPlugin(
      FilePondPluginImagePreview,
      FilePondPluginImageExifOrientation,
      FilePondPluginFileValidateSize,
      FilePondPluginImageEdit,
      FilePondPluginFileValidateType,
      FilePondPluginFilePoster
    );
    //if cartItemIdIsPassed, we need to set the url
    if (!this.url && this.cartItemId) {
      this.url = salla.cart.getUploadImageEndpoint();
      this.instantUpload = true;
    }

    if (!this.url && this.profileImage) {
      this.url = salla.url.api('profile/update');
      this.instantUpload = true;
      this.host.hasAttribute('name') || (this.name = 'avatar');
    }

    if (!this.name) {
      this.name = 'file';
    }

    salla.lang.onLoaded(() => {
      this.host.querySelectorAll('.filepond--drop-label>label').forEach(label => label.innerHTML = this.getLabel())
      if (this.filepond) {
        this.filepond.labelFileTypeNotAllowed = salla.lang.get('common.uploader.invalid_type');
        this.filepond.labelMaxFileSizeExceeded = salla.lang.get('common.uploader.too_large');
        this.filepond.labelFileSizeNotAvailable = salla.lang.get('common.uploader.size_not_available');
        this.filepond.labelFileLoading = salla.lang.get('common.elements.loading');
        this.filepond.labelFileLoadError = salla.lang.get('common.uploader.failed_to_load');
        this.filepond.labelFileProcessing = salla.lang.get('common.uploader.uploading');
        this.filepond.labelFileProcessingComplete = salla.lang.get('common.uploader.upload_completed');
        this.filepond.labelFileProcessingAborted = salla.lang.get('common.uploader.upload_cancelled');
        this.filepond.labelFileProcessingError = salla.lang.get('common.uploader.error_uploading');
        this.filepond.labelTapToCancel = salla.lang.get("common.elements.cancel");
        this.filepond.labelTapToRetry = salla.lang.get("common.elements.retry");
        this.filepond.labelButtonRemoveItem = salla.lang.get("common.elements.remove");
        this.filepond.labelButtonUndoItemProcessing = salla.lang.get("common.elements.undo");
        this.filepond.labelButtonProcessItem = salla.lang.get("common.uploader.upload");
      }
    });
  }

  private fileUploader: HTMLInputElement;
  private hiddenInput: HTMLInputElement;
  public filepond: FilePondType;

  @Element() host: HTMLElement;

  /**
   * The uploaded image link or URL
   */
  @Prop({reflect: true, mutable: true}) value: string;

  /**
   * The uploaded files as json `[{url:"...", id:123}]` for delete possibility
   */
  @Prop({reflect: true}) files: string;

  /**
   * The original height of the uploader, will be used to reset the height after the image is removed.
   */
  @Prop({reflect: true}) height: string;

  /**
   *  to prepare the upload url automatically pass this prop, ex to upload attach file in cart Item.
   */
  @Prop() cartItemId?: string;

  /**
   * Set the component to be profile image uploader with a preview and a circular shape
   */
  @Prop({reflect: true}) profileImage: boolean = false;

  /**
   * File input name for the native formData
   */
  @Prop({mutable: true, reflect: true}) name?: string;

  /**
   * File input name in the request payload
   */
  @Prop() payloadName: string;

  /**
   * Accepted file types
   */
  @Prop({reflect: true, mutable: true}) accept: string = "image/png, image/jpeg, image/jpg, image/gif";

  /**
   * If current file has id, pass it here, to be passed back in the `removed` event
   */
  @Prop() fileId?: number;

  /**
   * The url to submit the image into.
   */
  @Prop({mutable: true}) url: string;
  /**
   * The submit request method.
   */
  @Prop() method: string = 'POST';

  /**
   * json formData to be injected in the submit request
   */
  @Prop() formData: string = "{}";

  /**
   * Sets the required attribute to the output field
   */
  @Prop() required: boolean;

  /**
   * The maximum size of a file, for instance 2MB or 750KB
   */
  @Prop() maxFileSize: `${number}MB` | `${number}KB}` = '2MB'

  /**
   * Sets the disabled attribute to the output field
   */
  @Prop() disabled: boolean;

  /**
   * Enable or disable drag n' drop
   */
  @Prop() allowDrop: boolean = true;

  /**
   * Enable or disable file browser
   */
  @Prop() allowBrowse: boolean = true;

  /**
   * Enable or disable pasting of files. Pasting files is not supported on all browesrs.
   */
  @Prop() allowPaste: boolean;

  /**
   * Enable or disable adding multiple files
   */
  @Prop() allowMultiple: boolean;

  /**
   * Allow drop to replace a file, only works when allowMultiple is false
   */
  @Prop() allowReplace: boolean = true;

  /**
   * Enable or disable the revert processing button
   */
  @Prop() allowRevert: boolean = true;

  /**
   * When set to false the remove button is hidden and disabled
   */
  @Prop() allowRemove: boolean = true;

  /**
   * Enable or disable the process button
   */
  @Prop() allowProcess: boolean;

  /**
   * Allow users to reorder files with drag and drop interaction.
   * Note that this only works in single column mode.
   * It also only works on browsers that support pointer events.
   */
  @Prop() allowReorder: boolean;

  /**
   * Tells FilePond to store files in hidden file input elements so they can be posted along with normal form post.
   * This only works if the browser supports the DataTransfer constructor (https://caniuse.com/mdn-api_datatransfer_datatransfer),
   * this is the case on Firefox, Chrome, Chromium powered browsers and Safari version 14.1 and higher.
   */
  @Prop() storeAsFile: boolean;

  /**
   * Set to true to require the file to be successfully reverted before continuing.
   */
  @Prop() forceRevert: boolean;

  /**
   * The maximum number of files that the pond can handle
   */
  @Prop() maxFilesCount: number = null;

  /**
   * The maxmimum number of files that can be uploaded in parallel
   */
  @Prop() maxParallelUploads: number = 2;

  /**
   * Set to true to enable custom validity messages.
   * FilePond will throw an error when a parent form is submitted and it contains invalid files.
   */
  @Prop() checkValidity: boolean;

  /**
   * Set to 'after' to add files to end of list (when dropped at the top of the list or added using browse or paste),
   * set to 'before' to add files at start of list.
   * Set to a compare function to automatically sort items when added
   */
  @Prop() itemInsertLocation: 'before' | 'after' | ((a: FilePondFile, b: FilePondFile) => number) = 'after';

  /**
   * The interval to use before showing each item being added to the list
   */
  @Prop() itemInsertInterval: number = 75;

  /**
   * Show credits at the bottom of the upload element.
   * Structure is like [{label,url}]
   */
  @Prop() credits: false;

  /// DRAG and DROP Props

  /**
   * FilePond will catch all files dropped on the webpage
   */
  @Prop() dropOnPage: boolean;

  /**
   * Require drop on the FilePond element itself to catch the file.
   */
  @Prop() dropOnElement: boolean = true;

  /**
   * When enabled, files are validated before they are dropped. A file is not added when it's invalid.
   */

  @Prop() dropValidation: boolean;

  /**
   * Ignored file names when handling dropped directories. Dropping directories is not supported on all browsers.
   */
  @Prop() ignoredFiles: Array<any> = ['.ds_store', 'thumbs.db', 'desktop.ini'];

  /**
   * Immediately upload new files to the server
   */
  @Prop({mutable: true}) instantUpload: boolean;

  /**
   * Enable chunked uploads, when enabled will automatically cut up files in chunkSize chunks before upload.
   */
  @Prop() chunkUploads: boolean;

  /**
   * Force chunks even for files smaller than the set chunkSize
   */
  @Prop() chunkForce: boolean;

  /**
   * The size of a chunk in bytes
   */
  @Prop() chunkSize: number = 5000000;

  /**
   * Amount of times, and delayes, between retried uploading of a chunk
   */
  @Prop() chunkRetryDelays: Array<number> = [500, 1000, 3000];


  /// Labels Props

  /**
   * The decimal separator used to render numbers. By default this is determined automatically.
   */
  @Prop() labelDecimalSeparator: string = undefined;

  /**
   * The thousdands separator used to render numbers. By default this is determined automatically.
   */
  @Prop() labelThousandsSeparator: string = undefined;

  /**
   * Default label shown to indicate this is a drop area.
   * FilePond will automatically bind browse file events to the element with CSS class .filepond--label-action
   * @default `${salla.lang.get('common.uploader.drag_and_drop')}<span class="filepond--label-action"> ${salla.lang.get('common.uploader.browse')} </span>`
   */
  @Prop({mutable: true}) labelIdle: string;

  /// SVG Icons

  /**
   * The icon used for remove actions
   */
  @Prop() iconRemove: string = '<svg>...</svg>';

  /**
   * The icon used for process actions
   */
  @Prop() iconProcess: string = '<svg>...</svg>';

  /**
   * The icon used for retry actions
   */
  @Prop() iconRetry: string = '<svg>...</svg>';

  /**
   * The icon used for undo actions
   */
  @Prop() iconUndo: string = '<svg>...</svg>';

  /// Hooks

  /**
   * Event emitted when the file has been added
   */
  @Event() added: EventEmitter<{ error: FilePondErrorDescription | null, file: FilePondFile }>;

  /**
   * Event emitted when the input is invalid
   */
  @Event() invalidInput: EventEmitter<any>;

  addedHandler(error: FilePondErrorDescription | null, file: FilePondFile) {
    this.added.emit({error: error, file: file});
    //if the file passed on initiate will not have type
    this.host.querySelector('.filepond--root').classList.remove('s-file-upload-has-error');
    if (error || !file.file.type) {
      this.host.querySelector('.filepond--root').classList.add('s-file-upload-has-error');
      return;
    }
    let container = new DataTransfer;
    let fileInput = this.getFormDataFileInput();
    // @ts-ignore
    container.items.add(file.file);
    fileInput.type = 'file';
    fileInput.files = container.files;
    fileInput.dispatchEvent(new window.Event('change', {bubbles: true}))
  }

  /**
   * Event emitted when the file has been uploaded and link to the file has been recieved from the server. Returns string value.
   */
  @Event() uploaded: EventEmitter<string>;

  uploadedHandler() {
    let fileInput = this.getFormDataFileInput();
    fileInput.type = 'hidden';
    fileInput.value = this.value;
    this.hiddenInput.value = this.value;
    fileInput.dispatchEvent(new window.Event('change', {bubbles: true}))
    return this.uploaded.emit(this.value);
  }

  /**
   * Event emitted when the file is about to be removed. Returns boolean value.
   */
  @Event() removed: EventEmitter<FilePondFile>;

  removedHandler(deletedFile: FilePondFile) {
    let fileInput = this.getFormDataFileInput();
    fileInput.type = 'hidden';
    fileInput.value = '';
    this.host.closest('.s-product-options-option')?.removeAttribute('data-has-value');
    if (deletedFile.getMetadata('id')) {
      salla.cart.api.deleteImage(deletedFile.getMetadata('id'));
    }
    if (this.height) {
      setTimeout(() => (this.host.querySelector('.filepond--root') as HTMLElement).style.height = this.height, 1000);
    }
    this.hiddenInput.value = '';
    fileInput.dispatchEvent(new window.Event('change', {bubbles: true}))
    return this.removed.emit(deletedFile);
  }

  /**
   *  Method to set option for filepond
   * */
  @Method()
  async setOption(key: string, value: string | number) {
    this.filepond[key] = value;
  }

  private getLabel() {
    if (this.labelIdle) {
      //some times we are passing label before translations is loaded, so here we will make sure that all translations are translated
      return this.labelIdle
        .replace('common.uploader.drag_and_drop', salla.lang.get('common.uploader.drag_and_drop'))
        .replace('common.uploader.browse', salla.lang.get('common.uploader.browse'));
    }
    return `${salla.lang.get('common.uploader.drag_and_drop')}<span class="filepond--label-action"> ${salla.lang.get('common.uploader.browse')} </span>`;
  }

  /**
   *
   * This method will fire head request to get the file size, it's head request,so it will be too fast.
   */
  private getFileSize(url: string) {
    let http = new XMLHttpRequest();
    http.open('HEAD', url, false); // false = Synchronous
    http.send(null); // it will stop here until this http request is complete

    return http.status === 200 ? http.getResponseHeader('content-length') : '';
  }

  private getFormDataFileInput(): HTMLInputElement {
    return this.host.querySelector('.filepond--data input');
  }

  private getFiles() {
    if (!this.value && !this.files) {
      return [];
    }
    try {
      let files = this.files
        ? JSON.parse(this.files)
        : this.value.split(',').map(file => ({url: file}));
      if (files.length) {
        this.host.closest('.s-product-options-option')?.setAttribute('data-has-value', 'true');
      }
      return files.map(file => ({
        source: file.id ? `${file.id}` : file.url,
        options: {
          type: 'local',
          file: {
            name: file.url.substring(file.url.lastIndexOf('/') + 1),
            size: this.getFileSize(file.url)
          },
          metadata: {poster: file.url, name: file.url, id: file.id},
        },
      }));
    } catch (e) {
      salla.log('failed To get files from: ' + (this.files || this.value));
    }
    return [];
  }

  componentWillLoad() {
    if (!this.labelIdle) {
      this.labelIdle = this.host.innerHTML;
      this.host.innerHTML = '';
    }
  }

  render() {
    return (
      <Host class={{
        "s-file-upload": true,
        "s-file-upload-profile-image": this.profileImage,
      }}>
        <input
          type="file"
          name={this.name}
          value={this.value}
          ref={ele => this.fileUploader = ele}
          required={this.required}
          class="s-file-upload-wrapper s-file-upload-input"
          accept={this.accept}/>

          {/* Workaround to handle native validation on the file input */}
          <input class="s-hidden" name={'hidden-'+this.name} required={this.required} value={this.value} ref={input => this.hiddenInput = input} />
      </Host>
    );
  }

  componentDidLoad() {
    let files = this.getFiles();
    this.filepond = FilePond.create(
      this.fileUploader,
      {
        name: this.payloadName || this.name,
        //@ts-ignore
        files: files,
        required: this.required,
        disabled: this.disabled,
        allowDrop: this.allowDrop,
        allowBrowse: this.allowBrowse,
        allowPaste: this.allowPaste,
        allowMultiple: this.allowMultiple,//||files.length,
        allowReplace: this.allowReplace,
        allowRevert: this.allowRevert,
        allowProcess: this.allowProcess,
        allowReorder: this.allowReorder,
        storeAsFile: this.storeAsFile,
        forceRevert: this.forceRevert,
        maxFiles: this.maxFilesCount,
        maxParallelUploads: this.maxParallelUploads,
        checkValidity: this.checkValidity,
        itemInsertLocation: this.itemInsertLocation,
        itemInsertInterval: this.itemInsertInterval,
        credits: this.credits,
        dropOnPage: this.dropOnPage,
        dropOnElement: this.dropOnElement,
        dropValidation: this.dropValidation,
        ignoredFiles: this.ignoredFiles,
        onaddfile: (error, file) => this.addedHandler(error, file),
        server: {
          url: this.url,
          method: this.method,
          // @ts-ignore
          process: {
            onload: response => {
              let url = JSON.parse(response).data;
              this.value = url.filePath || url.url;

              this.uploadedHandler();
              return this.value;
            },
            headers: salla.api.getHeaders(),
            onerror: response => {
              try {
                let field = JSON.parse(response).error.fields;
                field = field[this.payloadName || this.name]
                return (field && field[0]) || salla.lang.get('common.errors.error_occurred');
              } catch (e) {
                salla.log('FileUpload:: Error', e);
                return salla.lang.get('common.errors.error_occurred');
              }
            },
            ondata: formData => {
              if (this.payloadName && this.payloadName != this.name) {
                formData.append(this.payloadName, this.filepond.getFile(0).file);
                formData.delete(this.name);
              }
              if (this.cartItemId) {
                formData.append('cart_item_id', this.cartItemId);
              }
              try {
                Object.entries(JSON.parse(this.formData)).forEach((value: [string, string]) => value[1] && formData.append(value[0], value[1]));
              } catch (e) {
                salla.log('Error to inject formData', e);
              }
              return formData;
            }
          },
        },
        instantUpload: this.instantUpload,
        chunkUploads: this.chunkUploads,
        chunkForce: this.chunkForce,
        chunkSize: this.chunkSize,
        chunkRetryDelays: this.chunkRetryDelays,
        labelDecimalSeparator: this.labelDecimalSeparator,
        labelThousandsSeparator: this.labelThousandsSeparator,
        labelIdle: this.getLabel(),
        acceptedFileTypes: this.accept.replace(/\s+/g, '').split(','),
        labelFileTypeNotAllowed: salla.lang.get('common.uploader.invalid_type'),
        fileValidateTypeLabelExpectedTypes: '{allButLastType}, {lastType}',
        labelMaxFileSizeExceeded: salla.lang.get('common.uploader.too_large'),
        labelMaxFileSize: '{filesize}',
        maxFileSize: this.maxFileSize,
        // onprocessfile: (error, file) =>salla.log(error, JSON.parse(file.serverId)),
        beforeRemoveFile: (deletedFile: FilePondFile) =>
          new Promise((resolve) => {
            this.removedHandler(deletedFile);
            resolve(true);
          }),
      }
    );

    this.hiddenInput.addEventListener('invalid', e => {
      this.invalidInput.emit(e);
    });
    this.hiddenInput.addEventListener('change', () => {
      this.hiddenInput.setCustomValidity('');
      this.hiddenInput.reportValidity();
    });
  }
}
