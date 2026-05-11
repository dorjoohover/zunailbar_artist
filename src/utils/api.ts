export enum METHOD {
  get = "GET",
  post = "POST",
  put = "PUT",
  patch = "PATCH",
  delete = "DELETE",
}
const BASE = "http://localhost:5050/api/v1/";
// const BASE = process.env.API
//   ? process.env.API?.endsWith("/")
//     ? process.env.API
//     : process.env.API + "/" :
//     "https://api.zunailbar.mn/api/v1/";

export enum Api {
  login = "login",
  order = "order",
  register = "register",
  user = "user",
  // dev
  customer = "customer",
  user_product = "user_product",
  branch = "branch",
  service_category = "service_category",
  discount = "discount",
  file = "file",
  category = "category",
  integration = "integration",
  integration_payment = "integration_payment",
  service = "service",
  schedule = "schedule",
  artist_leaves = "artist_leaves",
  branch_leaves = "branch_leaves",
  slots = "slots",
  booking = "booking",
  branch_service = "branch_service",
  voucher = "voucher",
  user_service = "user_service",
  user_salaries = "user_salaries",
  product = "product",
  home = "home",
  cost = "cost",
  product_transaction = "product_transaction",
  product_transaction_admin = "product_transaction_admin",
  product_log = "product_log",
  product_warehouse = "product_warehouse",
  warehouse = "warehouse",
  brand = "brand",
  upload = "upload",
}

export const API = {
  [Api.login]: BASE + "artist/login",
  [Api.order]: BASE + "order",
  [Api.discount]: BASE + "discount",
  [Api.register]: BASE + "register",
  [Api.warehouse]: BASE + "warehouse",
  [Api.artist_leaves]: BASE + "artist_leaves",
  [Api.branch_leaves]: BASE + "branch_leaves",
  [Api.slots]: BASE + "slots",
  [Api.integration]: BASE + "integration",
  [Api.integration_payment]: BASE + "integration_payment",
  [Api.product_warehouse]: BASE + "product_warehouse",
  [Api.cost]: BASE + "cost",
  [Api.user]: BASE + "user",
  [Api.branch_service]: BASE + "branch_service",
  [Api.product]: BASE + "product",
  [Api.service_category]: BASE + "service_category",
  [Api.booking]: BASE + "booking",
  [Api.home]: BASE + "home",
  [Api.voucher]: BASE + "voucher",
  [Api.service]: BASE + "service",
  [Api.file]: BASE + "file",
  [Api.schedule]: BASE + "schedule",
  [Api.user_service]: BASE + "user_service",
  [Api.brand]: BASE + "brand",
  [Api.user_product]: BASE + "user_product",
  [Api.product_transaction]: BASE + "product_transaction",
  [Api.product_transaction_admin]: BASE + "product_transaction" + "/admin",
  [Api.product_log]: BASE + "product_log",
  [Api.branch]: BASE + "branch",
  [Api.upload]: BASE + "upload",
  [Api.category]: BASE + "category",
  [Api.user_salaries]: BASE + "user_salaries",
};

// export const baseUrl =
//   process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
process.env.NEXT_PUBLIC_BASE_URL || "http://admin.zunailbar.mn/";
