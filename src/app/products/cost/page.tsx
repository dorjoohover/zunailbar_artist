import { Api } from "@/utils/api";
import { Branch, Category, Cost, Product } from "@/models";
import { find, search } from "@/app/(api)";
import { CostPage } from "./components";
import { CategoryType, ROLE } from "@/lib/enum";
import ContainerHeader from "@/components/containerHeader";

export default async function Page() {
  const [res, product, branch, category] = await Promise.all([
    find<Cost>(Api.cost),
    search<Product>(Api.product, { limit: 20, type: CategoryType.COST }),
    find<Branch>(Api.branch, { limit: -1 }),
    search<Category>(Api.category, { limit: 20 }),
  ]);
  return (
    <section>
      {/* <ContainerHeader title="Хэрэглээний зардал" />
      <div className="admin-container"> */}
      <CostPage
        data={res.data}
        products={product.data}
        branches={branch.data}
        categories={category.data}
      />
      {/* </div> */}
    </section>
  );
}
