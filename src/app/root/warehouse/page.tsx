import { Api } from "@/utils/api";
import { Product, ProductLog, ProductWarehouse, Warehouse } from "@/models";
import { find } from "@/app/(api)";
import { ProductWarehousePage } from "./components";
import ContainerHeader from "@/components/containerHeader";

export default async function Page() {
  const [res] = await Promise.all([find<Warehouse>(Api.warehouse)]);
  return (
    <section>
      <ProductWarehousePage data={res.data} />
    </section>
  );
}
