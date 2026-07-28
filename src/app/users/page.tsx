import { Api } from "@/utils/api";
import { find } from "../(api)";
import { UserPage } from "./components";
import { Branch, User } from "@/models";
import ContainerHeader from "@/components/containerHeader";
import { ROLE, UserStatus } from "@/lib/enum";

export default async function Page() {
  const [res, level] = await Promise.all([
    find<User>(Api.user, { role: ROLE.CLIENT, user_status: UserStatus.ACTIVE }),
    find(Api.order, {}, "level"),
  ]);
  return (
    <section>
      <UserPage data={res.data} level={level.data.items as any} />
    </section>
  );
}
