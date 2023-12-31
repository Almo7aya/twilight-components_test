export interface GiftToCardDTO {
    text: string;
    sender_name: string;
    receiver: Receiver;
    quantity: number;
    deliver_at: string;
    image_url: string;
    time_zone?: string;
    donation_amount?: number;
}

export interface Receiver {
    name: string;
    country_code?: string;
    mobile: string;
}


export interface Phone {
    country_code: string;
    number: string;
}
