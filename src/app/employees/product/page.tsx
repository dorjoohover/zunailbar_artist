import { Branch, Brand, Product, User, UserProduct } from "@/models";
import ContainerHeader from "@/components/containerHeader";
import { Api } from "@/utils/api";
import { find, search } from "@/app/(api)";
import { EmployeeProductPage } from "./components";
import { ROLE, UserStatus } from "@/lib/enum";

export default async function EmployeesPage() {
  const [userProductRes, branch, product, user] = await Promise.all([
    find<UserProduct>(Api.user_product),
    find<Branch>(Api.branch, { limit: -1 }),
    search<Product>(Api.product, { limit: 20 }),
    search<User>(Api.user, { limit: 20, role: ROLE.E_M , user_status: UserStatus.ACTIVE}),
  ]);
  return (
    <section>
      <EmployeeProductPage
        data={userProductRes.data}
        branches={branch.data}
        users={user.data}
        products={product.data}
      />
    </section>
  );
}
