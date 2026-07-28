import { fetcher } from "@/hooks/fetcher";
import { ACTION, DEFAULT_PG, ListType, PG } from "@/lib/constants";
import { ROLE } from "@/lib/enum";
import { Branch } from "@/models";
import { Api, API } from "@/utils/api";
import { zodResolver } from "@hookform/resolvers/zod";
import { Dispatch, SetStateAction, useState } from "react";
import { useForm } from "react-hook-form";
import z from "zod";
const formSchema = z.object({
  firstname: z.string().min(1),
  lastname: z.string().min(1),
  branch_id: z.string().min(1),
  mobile: z.string().length(8, { message: "8 тэмдэгт байх ёстой" }),
  birthday: z.preprocess(
    (val) => (typeof val === "string" ? new Date(val) : val),
    z.date()
  ) as unknown as Date,
  password: z.string().min(6),
  role: z
    .preprocess(
      (val) => (typeof val === "string" ? parseInt(val, 10) : val),
      z.number().refine((val) => [ROLE.EMPLOYEE, ROLE.MANAGER].includes(val), {
        message: "Only EMPLOYEE and MANAGER roles are allowed",
      })
    )
    .optional() as unknown as number,
});
type UserType = z.infer<typeof formSchema>;
export const AddEmployee = ({
  action,
  setAction,
}: {
  action: ACTION;
  setAction: Dispatch<SetStateAction<ACTION>>;
}) => {
  const form = useForm<UserType>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      role: ROLE.EMPLOYEE,
      password: "string@123",
    },
  });
  const [branches, setBranches] = useState<ListType<Branch>>();
  const getBranches = async (pg: PG = DEFAULT_PG) => {
    const { page, limit, sort } = pg;
    await fetcher<Branch>(Api.branch, {
      page,
      limit,
      sort,
      isCost: false,
    }).then((d) => {
      setBranches(d);
      form.reset(undefined);
    });
    setAction(ACTION.DEFAULT);
  };
  return <></>
};
