import {ILazyLoadInstance} from "vanilla-lazyload";

declare global {
  interface Window {
    // @ts-ignore
    readonly document: documentWithLazyLoading;

    [key: string]: any;
  }

  interface Document {
    lazyLoadInstance?: ILazyLoadInstance
    lazyLoadBackgrounds?: ILazyLoadInstance
  }
  let salla: any;
  let Salla: any;
}
