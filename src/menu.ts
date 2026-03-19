export interface MenuItem {
  itemId: string;
  name: string;
  unitPrice: number; // in cents
  priceFormatted: string;
}

export const MENU: MenuItem[] = [
  { itemId: 'flat-white', name: 'Flat White', unitPrice: 450, priceFormatted: 'KES 4.50' },
  { itemId: 'cappuccino', name: 'Cappuccino', unitPrice: 400, priceFormatted: 'KES 4.00' },
  { itemId: 'latte', name: 'Latte', unitPrice: 450, priceFormatted: 'KES 4.50' },
  { itemId: 'espresso', name: 'Espresso', unitPrice: 300, priceFormatted: 'KES 3.00' },
  { itemId: 'croissant', name: 'Croissant', unitPrice: 350, priceFormatted: 'KES 3.50' },
  { itemId: 'muffin', name: 'Muffin', unitPrice: 250, priceFormatted: 'KES 2.50' },
];
