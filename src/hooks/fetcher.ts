import { find } from "@/app/(api)";
import { Pagination } from "@/base/query";
import { API } from "@/utils/api";

export const fetcher = <T>(
  uri: keyof typeof API,
  p?: Pagination,
  route?: string
) => find<T>(uri, p, route).then((res) => res.data);
