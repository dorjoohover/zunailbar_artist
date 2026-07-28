import { Api } from "@/utils/api";
import { Service } from "@/models/service.model";
import { DiscountPage } from "./components";
import { Branch, Discount } from "@/models";
import ContainerHeader from "@/components/containerHeader";
import { find, search } from "@/app/(api)";

export default async function Page() {
  const [res, branch, service] = await Promise.all([
    find<Discount>(Api.discount),
    find<Branch>(Api.branch, { limit: -1 }),
    search<Service>(Api.service, { limit: 20, sort: false, }),
  ]);
  return (
    <section>
      <DiscountPage
        data={res.data}
        branches={branch.data}
        services={service.data}
      />
    </section>
  );
}
