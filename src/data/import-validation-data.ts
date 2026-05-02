export const importErrors = [
  {
    row: 7,
    column: "barcode",
    value: "",
    issue: "Пустой штрихкод",
    severity: "error",
  },
  {
    row: 12,
    column: "purchase_price",
    value: "-500",
    issue: "Отрицательная закупочная цена",
    severity: "error",
  },
  {
    row: 18,
    column: "retail_price",
    value: "",
    issue: "Пустая розничная цена",
    severity: "error",
  },
];

export const importWarnings = [
  {
    row: 5,
    column: "promo_price",
    value: "0",
    issue: "Акционная цена не указана",
    severity: "warning",
  },
  {
    row: 14,
    column: "size",
    value: "",
    issue: "Размер не заполнен",
    severity: "warning",
  },
];

export const duplicateRows = [
  {
    row: 9,
    barcode: "2000000000012",
    article: "MR-JK-002",
    issue: "Дубликат штрихкода",
  },
  {
    row: 21,
    barcode: "2000000000014",
    article: "BP-CL-004",
    issue: "Повтор артикула",
  },
];