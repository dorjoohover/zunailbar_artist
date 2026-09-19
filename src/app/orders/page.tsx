import { Api } from "@/utils/api";
import { search } from "../(api)";
import { Service } from "@/models/service.model";
import { OrderPage } from "./components";
import { Branch, User } from "@/models";
import { ROLE, STATUS, UserStatus } from "@/lib/enum";
import { find } from "../(api)";

type PageProps = {
  searchParams?: Promise<{
    date?: string | string[];
    to?: string | string[];
    list?: string | string[];
  }>;
};

const getValue = (value?: string | string[]) =>
  Array.isArray(value) ? value[0] : value;

export default async function Page({ searchParams }: PageProps) {
  // Сонгосон өдөр (?date=YYYY-MM-DD) — refresh хийхэд тухайн өдөр дээрээ үлдэнэ.
  const params = (await searchParams) ?? {};
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
        initialQuery={{
          date: getValue(params.date),
          to: getValue(params.to),
          list: getValue(params.list),
        }}
        showConfirmButton={false}
      />
    </section>
  );
}
