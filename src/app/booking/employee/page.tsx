import { Api } from "@/utils/api";
import { Schedule, User } from "@/models";
import { find } from "@/app/(api)";
import { ROLE, UserStatus } from "@/lib/enum";
import { SchedulePage } from "./components";

export default async function Page() {
  const user = await find<User>(Api.user, {
    limit: -1,
    role: ROLE.E_M,
    user_status: UserStatus.ACTIVE,
  });
  const res = await find<Schedule>(
    Api.schedule,
    {
      limit: 7,
      user_id: user.data?.items?.[0]?.id,
    },
    "employee"
  );
  return (
    <section>
      <SchedulePage data={res.data} users={user.data} />
    </section>
  );
}
