import { Api } from "@/utils/api";
import { find } from "../(api)";
import { Booking, Branch } from "@/models";
import { BookingPage } from "./components";

export default async function Page() {
  const branch = await find<Branch>(Api.branch, { limit: -1 });
  const res = await find<Booking>(
    Api.booking,
    {
      limit: 7,
      branch_id: branch.data.items[0].id,
      sort: false
    },
    "employee"
  );
  return (
    <section>
      <BookingPage data={res.data} branches={branch.data} />
    </section>
  );
}
