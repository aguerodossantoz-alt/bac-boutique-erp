export const sidebarItems = [
  { label: "Дашборд", href: "/", enabled: true },
  { label: "Каталог", href: "/catalog", enabled: true },
  { label: "Продажи", href: "/sales", enabled: false },
  { label: "Инвентаризация", href: "/inventory", enabled: false },
  { label: "Клиенты", href: "/customers", enabled: false },
  { label: "Скидки", href: "/discounts", enabled: false },
  { label: "Расходы", href: "/expenses", enabled: false },
  { label: "Отчеты", href: "/reports", enabled: false },
  { label: "Магазины", href: "/stores", enabled: false },
  { label: "Сотрудники", href: "/staff", enabled: false },
];

export const stats = [
  { label: "Выручка за месяц", value: "₽ 1 284 000", note: "+12.4%" },
  { label: "Чистая прибыль", value: "₽ 312 000", note: "+8.1%" },
  { label: "Расходы", value: "₽ 198 000", note: "2 магазина" },
  { label: "Остаток товара", value: "1 647", note: "единиц" },
];

export const quickActions = [
  "Продажа по штрихкоду",
  "Новая инвентаризация",
  "Импорт каталога",
  "Добавить расход",
];

export const recentSales = [
  { item: "Поло Tombolini", store: "Магазин 1", price: "₽ 18 900" },
  { item: "Куртка Moorer", store: "Магазин 2", price: "₽ 74 000" },
  { item: "Брюки Premium", store: "Магазин 1", price: "₽ 21 500" },
  { item: "Кардиган Fedeli", store: "Магазин 2", price: "₽ 39 900" },
];

export const lowStock = [
  { name: "Поло Tombolini", size: "52", left: 1 },
  { name: "Куртка Moorer", size: "50", left: 2 },
  { name: "Кардиган Fedeli", size: "L", left: 1 },
  { name: "Брюки классика", size: "54", left: 2 },
];

export const storeCards = [
  {
    title: "Магазин 1",
    revenue: "₽ 684 000",
    profit: "₽ 171 000",
    stock: "892",
  },
  {
    title: "Магазин 2",
    revenue: "₽ 600 000",
    profit: "₽ 141 000",
    stock: "755",
  },
];

export const launchSteps = [
  "Запуск базы и ролей",
  "Инвентаризация первого магазина",
  "Добавление фото товаров",
  "Подключение второго магазина",
];