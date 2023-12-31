export interface Color {
    rgba: number[];
    hsla: number[];
    rgbString: string;
    rgbaString: string;
    hslString: string;
    hslaString: string;
    hex: string;
}

export type ColorCallback = (color: Color) => void;

export interface Options {
    parent?: HTMLElement;
    popup?: 'top' | 'bottom' | 'left' | 'right' | false;
    template?: string;
    layout?: string;
    alpha?: boolean;
    editor?: boolean;
    editorFormat?: 'hex' | 'hsl' | 'rgb';
    cancelButton?: boolean;
    color?: string;
    onChange?: ColorCallback;
    onDone?: ColorCallback;
    onOpen?: ColorCallback;
    onClose?: ColorCallback;
}