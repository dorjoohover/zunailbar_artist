import { Api } from "@/utils/api";
import { Branch, Schedule, User } from "@/models";
import ContainerHeader from "@/components/containerHeader";
import { find } from "@/app/(api)";
import { ROLE, ScheduleStatus, UserStatus } from "@/lib/enum";
import { BranchLeavePage } from ".";
import { BranchLeave } from "@/models/branch.leaves.model";
import { DEFAULT_LIMIT, DEFAULT_PAGE } from "@/lib/constants";

export default async function Page() {
  const branch = await find<Branch>(Api.branch, {
    limit: -1,
    role: ROLE.E_M,
    user_status: UserStatus.ACTIVE,
  });
  const res = await find<BranchLeave>(Api.branch_leaves, {
    branch_id: branch.data.items?.[0]?.id,
  });
  return (
    <section>
      {/* <ContainerHeader group="Ажилчид" title="Ажилтны чөлөө авах хүсэлт" /> */}
      {/* <div className=""> */}
      <BranchLeavePage data={res.data} branches={branch.data} />
      {/* </div> */}
    </section>
  );
}
