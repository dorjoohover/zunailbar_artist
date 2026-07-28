import { Api } from "@/utils/api";
import { find } from "@/app/(api)";
import { HomePage } from "./components";
import { Home } from "@/models/home.model";
import { TestHeroUploader } from "./components/test";

export default async function Page() {
  const res = await find<Home>(Api.home, {}, "web/home");
  return (
    <section>
      {/* <HomePage data={res.data} /> */}
      <TestHeroUploader data={res.data} />
    </section>
  );
}
