import { Api } from "@/utils/api";
import {
  Branch,
  Brand,
  Category,
  Product,
  ProductTransaction,
  User,
} from "@/models";
import { find, search } from "@/app/(api)";
import { ProductTransactionPage } from "./components";
import { CategoryType, ROLE, UserStatus } from "@/lib/enum";
import ContainerHeader from "@/components/containerHeader";

export default async function Page() {
  const [res, branch, product, users] = await Promise.all([
    find<ProductTransaction>(Api.product_transaction_admin, {}),
    find<Branch>(Api.branch, { limit: -1 }),
    search<Product>(Api.product, { type: CategoryType.DEFAULT, limit: 20 }),
    search<User>(Api.user, {
      limit: 20,
      role: ROLE.E_M,
      user_status: UserStatus.ACTIVE,
    }),
  ]);
  return (
    <section>
      {/* <ContainerHeader title="Барааны хэрэглээ" />
      <div className="admin-container"> */}
      <ProductTransactionPage
        data={res.data}
        branches={branch.data}
        products={product.data}
        users={users.data}
      />
      {/* </div> */}
    </section>
  );
}
