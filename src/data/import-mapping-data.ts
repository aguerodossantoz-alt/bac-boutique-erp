export const importColumns = [
  { source: "Артикул", target: "article", required: true },
  { source: "Наименование", target: "name", required: true },
  { source: "Размер", target: "size", required: false },
  { source: "Цвет", target: "color", required: false },
  { source: "Штрихкод", target: "barcode", required: true },
  { source: "Закупка", target: "purchase_price", required: true },
  { source: "Акция", target: "promo_price", required: false },
  { source: "Розница", target: "retail_price", required: true },
  { source: "Остаток", target: "quantity", required: true },
  { source: "Магазин", target: "store", required: true },
];

export const systemFields = [
  "article",
  "name",
  "size",
  "color",
  "barcode",
  "purchase_price",
  "promo_price",
  "retail_price",
  "quantity",
  "store",
  "image_url",
  "skip",
];