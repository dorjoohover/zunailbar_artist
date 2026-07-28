import { Api } from "@/utils/api";
import { Voucher } from "@/models/voucher.model";
import { User } from "@/models/user.model";
import { find, findOne, search } from "@/app/(api)";
import { VoucherPage } from "./components";
import { ROLE } from "@/lib/enum";

export default async function Page() {
  const [res, config, customers] = await Promise.all([
    find<Voucher>(Api.voucher),
    findOne(Api.voucher, "config"),
    search<User>(Api.user, { limit: 20, sort: false, role: ROLE.CLIENT }),
  ]);
  return (
    <section>
      <VoucherPage
        data={res.data}
        customers={customers.data}
        config={config?.payload ?? config}
      />
    </section>
  );
}
