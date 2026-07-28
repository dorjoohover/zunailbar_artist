import { Api } from "@/utils/api";
import { find } from "@/app/(api)";
import { FeaturePage } from "./components";
import { Feature } from "@/models/home.model";

export default async function Page() {
  const res = await find<Feature>(Api.home, {}, "web/feature");
  return (
    <section>
      <FeaturePage data={res.data} />
    </section>
  );
}
