import { Api } from "@/utils/api";
import {
  Product,
  ProductLog
} from "@/models";
import { find, search } from "@/app/(api)";
import { ProductHistoryPage } from "./components";
import ContainerHeader from "@/components/containerHeader";
import { CategoryType } from "@/lib/enum";
// import { ProductTransactionPage } from "./components";

export default async function Page() {
  const [res, product] = await Promise.all([
    find<ProductLog>(Api.product_log),
    search<Product>(Api.product, { type: CategoryType.DEFAULT, limit: 20 }),
  ]);
  return (
    <section>
      {/* <ContainerHeader title="Барааны түүх" />
      <div className="admin-container"> */}
        <ProductHistoryPage data={res.data} products={product.data} />
      {/* </div> */}
    </section>
  );
}
