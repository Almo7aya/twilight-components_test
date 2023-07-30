export interface GiftResponse {
    quantity: number;
    product: Product;
    sender_name: string;
    gift_images: GiftImage[];
    gift_texts: GiftText[];
}

export interface Product {
    id: number;
    name: string;
    type: string;
}

export interface GiftImage {
    id: number;
    url: string;
}

export interface GiftText {
    id: number;
    text: string;
}