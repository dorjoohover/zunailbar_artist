import { Api } from "@/utils/api";
import { Branch, ServiceCategory } from "@/models";
import { find } from "@/app/(api)";
import { ServiceCategoryPage } from "./components";

export default async function Page() {
  const [res] = await Promise.all([
    find<ServiceCategory>(Api.service_category),
  ]);
  return (
    <section>
      <ServiceCategoryPage data={res.data} />
    </section>
  );
}
