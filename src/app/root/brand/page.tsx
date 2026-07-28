import { Api } from "@/utils/api";
import { Brand, Warehouse } from "@/models";
import { find } from "@/app/(api)";
import { BrandPage } from "./components";
import ContainerHeader from "@/components/containerHeader";

export default async function Page() {
  const [res] = await Promise.all([find<Brand>(Api.brand)]);
  return (
    <section>
      <BrandPage data={res.data} />
    </section>
  );
}
