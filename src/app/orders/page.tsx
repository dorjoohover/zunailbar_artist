import { Api } from "@/utils/api";
import { search } from "../(api)";
import { Service } from "@/models/service.model";
import { OrderPage } from "./components";
import { Branch, User } from "@/models";
import { ROLE, STATUS, UserStatus } from "@/lib/enum";
import { find } from "../(api)";

export default async function Page() {
  const [branch, user, services] = await Promise.all([
    search<Branch>(Api.branch, { limit: -1 }),
    search<User>(Api.user, {
      limit: 20,
      role: ROLE.E_M,
      user_status: UserStatus.ACTIVE,
      // "Устгасан" (users.status=Hidden) ажилтан ч захиалга vvсгэх артистын
      // жагсаалтад гарч ирэхгvй байх ёстой.
      status: STATUS.Active,
    }),
    find<Service>(Api.service, { limit: 20, sort: false }),
  ]);

  const client = await search<User>(Api.user, { limit: 20, role: ROLE.CLIENT });
  // /order/level нь admin-only тул artist app-аас дуудахгүй —
  // SchedulerViewFilteration дотор LevelConfig undefined үед default нэрс ашиглана.
  return (
    <section>
      <OrderPage
        branches={branch.data}
        users={user.data}
        customers={client.data}
        services={services.data}
        showConfirmButton={false}
      />
    </section>
  );
}
