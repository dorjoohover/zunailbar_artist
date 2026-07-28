import { Api } from "@/utils/api";
import { find } from "../(api)";
import { Service } from "@/models/service.model";
import { ServicePage } from "./components";
import { Branch, ServiceCategory } from "@/models";

export default async function Page() {
  const [res, serviceCategory] = await Promise.all([
    find<Service>(Api.service),
    find<ServiceCategory>(Api.service_category, { limit: -1 }),
  ]);
  return (
    <section>
      <ServicePage data={res.data} serviceCategories={serviceCategory.data} />
    </section>
  );
}
