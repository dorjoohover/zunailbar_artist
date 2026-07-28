import { ProductPage } from "./components";
import { Cost, Product } from "@/models";
import { find } from "../(api)";
import { Api } from "@/utils/api";

export default async function Page() {
  const { data } = await find<Product>(Api.product, {
    isCost: true,
  });

  return (
    <div className="w-full">
      <ProductPage data={data} />
    </div>
  );
}
