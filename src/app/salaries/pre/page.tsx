import { Api } from "@/utils/api";
import { IntegrationPayment, SalaryLog, User } from "@/models";
import { find } from "@/app/(api)";
import { PrePage } from "./components";
import { ROLE, UserStatus } from "@/lib/enum";

export default async function Page() {
  const [res, user] = await Promise.all([
    find<IntegrationPayment>(Api.integration_payment),
    find<User>(Api.user, {
      role: ROLE.E_M,
      limit: -1,
      user_status: UserStatus.ACTIVE,
    }),
  ]);
  return (
    <section>
      <PrePage data={res.data} users={user.data} />
    </section>
  );
}
