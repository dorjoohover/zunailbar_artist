import { Api } from "@/utils/api";
import { BranchServicePage } from "./components";
import { Branch, BranchService, Service } from "@/models";
import { find } from "@/app/(api)";
import { STATUS } from "@/lib/enum";

export default async function Page() {
  const branch = await find<Branch>(Api.branch, { limit: -1 });
  const [res, service] = await Promise.all([
    find<BranchService>(Api.branch_service, {
      branch_id: branch.data.items?.[0].id,
      status: STATUS.Active
    }),

    find<Service>(Api.service, { limit: -1, sort: false, }),
  ]);
  return (
    <section>
      <BranchServicePage
        data={res.data}
        branches={branch.data}
        services={service.data}
      />
    </section>
  );
}
