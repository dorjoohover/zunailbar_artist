"use client";
import React, { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { useModal } from "@/providers/modal-context";
import AddEventModal from "@/components/schedule/_modals/add-event-modal";
import {
  CalendarIcon,
  ClockIcon,
  Trash2,
  Clock,
  User as LUser,
  UserCircle,
  Phone,
} from "lucide-react";
import { cn } from "@/lib/utils";
import CustomModal from "@/components/ui/custom-modal";
import { getUserColor } from "@/lib/colors";
import {
  getTransactionTypeValue,
  getUserLevelValue,
  ListType,
  OrderStatusValues,
  SearchType,
} from "@/lib/constants";
import { OrderStatus, UserLevel } from "@/lib/enum";
import { Branch, IOrder, Service, User } from "@/models";
import { showToast } from "@/shared/components/showToast";
import AppDialog from "@/shared/components/appDialog";
import { mobileFormatter, parseDate, usernameFormatter } from "@/lib/functions";
import { CustomEventModal } from "@/types";

const FAMILIES = [
  "blue",
  "red",
  "green",
  "yellow",
  "purple",
  "pink",
  "indigo",
  "teal",
  "cyan",
  "sky",
  "rose",
  "orange",
  "amber",
  "lime",
  "emerald",
  "violet",
  "fuchsia",
  "slate",
  "gray",
  "zinc",
  "neutral",
  "stone",
];

// Нэмэлт сүүдэр сетүүд (1 өнгөнд 3 хувилбар = 60+ item)
const SHADE_SETS = [
  { bg: 50, border: 200, text: 800 },
  { bg: 100, border: 200, text: 800 },
  { bg: 200, border: 300, text: 900 },
];

export const PALETTE = FAMILIES.flatMap((c) =>
  SHADE_SETS.map((s) => ({
    bg: `bg-${c}-${s.bg}`,
    border: `border-${c}-${s.border}`,
    text: `text-${c}-${s.text}`,
  })),
);

interface EventStyledProps extends IOrder {
  minmized?: boolean;
  CustomEventComponent?: React.FC<IOrder>;
}

export default function EventStyled({
  event,
  onDelete,
  CustomEventModal,
  values,
  send,
  index = 1,
}: {
  values: {
    branch: SearchType<Branch>[];
    customer: SearchType<User>[];
    user: SearchType<User>[];
    service: ListType<Service>;
  };
  index?: number;
  send: (order: IOrder) => void;
  event: EventStyledProps;
  CustomEventModal?: CustomEventModal;
  onDelete: (id: string) => void;
}) {
  const { setOpen } = useModal();

  function handleEditEvent(event: IOrder) {
    setOpen(
      <CustomModal title="Захиалга засах">
        <AddEventModal
          send={send}
          items={values}
          values={{
            ...event,
            parallel: new Set(event.details?.map((d) => d.user_id)).size > 1,
            edit: event.id,
          }}
        />
      </CustomModal>,
      async () => {
        return {
          ...event,
        };
      },
    );
  }

  const getBackgroundColor = (color: number | undefined) => {
    const userColor = getUserColor(color ? color : 0);
    return userColor;
  };

  const color = event?.details?.[0]?.color;
  const secondColor = event?.details?.[1]?.color;
  const level =
    getUserLevelValue[(event.customer?.level as UserLevel) ?? UserLevel.BRONZE];
  const ref = useRef(null);
  const [hovered, setHovered] = useState(false);
  const hour = +(event.start_time?.slice(0, 2) ?? "0");
  const baseZ =
    Math.ceil(1 * hour) +
    index +
    ((event?.start_time?.slice(3, 4) ?? "0") == "0" ? 0 : 1);
  return (
    <div
      key={event?.id}
      ref={ref}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={cn(
        `w-full transaction-all duration-300 relative h-full cursor-pointer  group rounded-lg flex flex-col flex-grow hover:shadow-md transition-shadow duration-200  `,
        // max-w-[350px]
      )}
      style={{
        zIndex: hovered ? 50 : baseZ,
        borderTop: "2px #fff solid",
        borderBottom: "2px #fff solid",
        borderLeft: "1px #fff solid",
        borderRight: "1px #fff solid",
      }}
    >
      <AppDialog
        trigger={
          <Button
            variant="destructive"
            size="icon"
            className={cn(
              "absolute z-[100]  right-0  top-[-8px] h-6 w-6 p-0 shadow-md hover:bg-destructive/90 transition-all duration-200",
              "opacity-0 group-hover:opacity-100",
            )}
          >
            <Trash2 size={14} className="text-destructive-foreground" />
          </Button>
        }
        title="Захиалгыг устгах уу?"
        description="Энэ үйлдлийг хийсний дараа захиалга бүрмөсөн устах бөгөөд буцаах боломжгүй гэдгийг анхаарна уу!"
        onConfirm={() => {
          // handlers.handleDeleteEvent(event?.id);
          onDelete(event?.id!);
          showToast("deleted", "Захиалга устгагдлаа!");
        }}
      />
      <div
        className={cn(
          "absolute   right-0 top-[100%] min-w-[250px] left-0   px-3 py-4 shadow-md  transition-all duration-200 bg-white",
          hovered ? "block" : "hidden",
        )}
        // style={{
        //   maxWidth: maw,
        // }}
      >
        <div
          className="flex w-full "
          // style={{ maxWidth: maw }}
        >
          <div className="font-semibold w-full text-xs truncate">
            <div className="w-full">
              <div className="flex justify-between ">
                <div className="flex items-center gap-2">
                  <p>Хэрэглэгчийн нэр:</p>{" "}
                  <p className="font-bold">
                    {event?.customer?.nickname ?? "-"}{" "}
                  </p>
                </div>
                {event?.order_status &&
                  OrderStatusValues[event?.order_status as OrderStatus]}
              </div>
              <div className="flex items-center gap-2">
                <p>Хэрэглэгчийн дугаар:</p>{" "}
                <p className="font-bold">
                  {mobileFormatter(event?.customer?.mobile ?? "")}{" "}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <p>Хэрэглэгчийн эрэмбэ:</p>{" "}
                <p className={cn("font-bold flex gap-1", level.color)}>
                  {" "}
                  <level.Icon size={16} />
                  {level.name}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="font-semibold text-xs truncate my-1 w-full">
          {event?.details?.map((e, i) => {
            return (
              <div key={i} className=" my-1">
                <div className="flex items-center gap-1">
                  <div
                    className="w-3 rounded-full h-3"
                    style={{
                      backgroundColor: e.color ? getBackgroundColor(e.color) : '',
                    }}
                  ></div>
                  <div className="flex gap-2">
                    <p>Артист:</p>
                    <p className="font-bold">{e.nickname}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <p>Салбар:</p>
                  <p className="font-bold">{e.branch_name}</p>
                </div>
                <div className="flex gap-2 ">
                  <p>Үйлчилгээний нэр:</p>
                  <p className="font-bold text-wrap">{e.service_name ?? "-"}</p>
                </div>
                <div className="flex">
                  <div className="flex text-xs items-center gap-1">
                    <Clock size={12} />{" "}
                    <span> {e?.start_time?.slice(0, 5)} - </span>
                    <span> {e?.end_time?.slice(0, 5)} </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        {event.description && (
          <div className="my-2 text-xs ">
            <b>Tip message:</b> {event?.description}{" "}
          </div>
        )}
        {event.created_by && (
          <div className="flex items-center justify-left gap-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <LUser className="w-4 h-4 text-rose-500" />
              <span>Үүсгэсэн</span>
            </div>

            <div className="flex flex-col items-start ">
              <div className="flex items-center gap-2 text-sm text-gray-900">
                <UserCircle className="w-4 h-4 text-gray-400" />
                <span>{usernameFormatter(event.created_by as User)}</span>
              </div>

              <div className="flex items-center gap-2 text-xs text-gray-500">
                <Phone className="w-4 h-4" />
                <span>
                  {mobileFormatter((event.created_by as User).mobile ?? "")}
                </span>
              </div>
            </div>
            {event?.created_at && (
              <div className="my-1 text-xs">
                <b>Огноо: {parseDate(new Date(event.created_at), true)}</b>
              </div>
            )}
          </div>
        )}
        {event?.paid_at && (
          <div className="my-1 text-xs">
            <b>
              Төлбөр төлсөн огноо: {parseDate(new Date(event.paid_at), true)}
            </b>
          </div>
        )}
        {event.transaction_type && (
          <div className="mb-1 text-xs">
            <b>
              Төлбөрийн хэлбэр:{" "}
              {
                getTransactionTypeValue[
                  event.transaction_type as keyof typeof getTransactionTypeValue
                ]
              }
            </b>
          </div>
        )}
      </div>

      <div
        onClick={(e: React.MouseEvent<HTMLDivElement>) => {
          e.stopPropagation();
          handleEditEvent({
            ...event,
            id: event?.id,
            branch_id: event.branch_id,
            customer_id: event.customer_id,
            user_id: event.user_id,
            description: event.description,
            order_status: event.order_status,
            total_amount: event.total_amount ?? 0,
            order_date: event.order_date,
            start_time: event.start_time,
            end_time: event.end_time,
            details: event.details,
            paid_amount: event.paid_amount,
            pre_amount: event.pre_amount,
            duration: event.duration,
            is_pre_amount_paid: event.is_pre_amount_paid,
          });
        }}
        className="h-full"
      >
        {[...new Set(event.details?.map((d) => d.user_id))].length > 1 ? (
          <div
            className="flex bg-transparent h-full"
            style={{
              background: `linear-gradient(
    100deg,
    ${getBackgroundColor(color)} 50%,
    ${getBackgroundColor(secondColor)} 50%
  )`,
              borderRadius: 10,
              boxShadow: `0 1px 3px ${getBackgroundColor(secondColor)}`,
            }}
          >
            <div className={cn("w-full p-2 text-white rounded-lg h-full  ")}>
              <EventItem
                color={getBackgroundColor(color)}
                event={{ ...event, details: [event.details?.[0]] }}
                level={level}
                disableView={{
                  lvl: true,
                  status: true,
                }}
                parallel={true}
              />
            </div>
            <div
              className={cn(
                "w-full p-2 text-white rounded-lg h-full  ",
                event?.minmized ? "flex-grow overflow-hidden" : "min-h-fit",
              )}
            >
              <EventItem
                color={getBackgroundColor(secondColor)}
                event={{ ...event, details: [event.details?.[1]] }}
                level={level}
                disableView={{
                  name: true,
                }}
                parallel={true}
              />
            </div>
          </div>
        ) : (
          <div
            className={cn(
              "w-full p-2 text-white rounded-lg  h-full",
              event?.minmized ? "flex-grow overflow-hidden" : "min-h-fit",
            )}
            style={{
              background: getBackgroundColor(color),
              boxShadow: `0 1px 3px 0px ${getBackgroundColor(color)}`,
            }}
          >
            <EventItem
              color={getBackgroundColor(color)}
              event={event}
              level={level}
            />
          </div>
        )}
      </div>
    </div>
  );
}

const EventItem = ({
  event,
  level,
  color,
  parallel = false,
  disableView,
}: {
  event: EventStyledProps;
  level: any;
  color: string;
  disableView?: {
    name?: boolean;
    lvl?: boolean;
    status?: boolean;
  };
  parallel?: boolean;
}) => {
  const { name, lvl, status } = disableView ?? {};
  return (
    <div className="flex flex-col h-full">
      <div className="flex">
        <div className="font-semibold w-full text-xs truncate">
          <div className="flex justify-between w-full">
            {!name ? (
              <div className="flex items-center gap-2">
                <p>
                  {event?.customer?.nickname}{" "}
                  {mobileFormatter(event?.customer?.mobile ?? "")}
                </p>
                <level.Icon color={`${level.textColor}`} size={14} />
              </div>
            ) : (
              <div></div>
            )}
            {!status &&
              event?.order_status &&
              OrderStatusValues[event?.order_status as OrderStatus]}
          </div>
        </div>
      </div>
      <div className="font-semibold text-xs truncate mb-1 ">
        {event?.details?.map((e, i) => {
          return (
            <div
              key={i}
              className={cn(
                "flex justify-between gap-2 my-1",
                parallel && "flex-col ",
              )}
            >
              <div className="flex items-center gap-1">
                <p className="text-wrap">{e.service_name ?? "-"}</p>
              </div>
              <div className="flex">
                <div className="flex text-xs items-center gap-1">
                  <Clock size={12} />{" "}
                  <span> {e?.start_time?.slice(0, 5)} - </span>
                  <span> {e?.end_time?.slice(0, 5)} </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {event.description && (
        <div className="my-2 text-xs ">
          <b>Tip message:</b> {event?.description}{" "}
        </div>
      )}

      {event?.paid_at && (
        <div className="mb-1 text-xs">
          <b>Төлбөр төлсөн огноо: {parseDate(new Date(event.paid_at), true)}</b>
        </div>
      )}
      {event.transaction_type && (
        <div className="mb-1 text-xs">
          <b>
            Төлбөрийн хэлбэр:{" "}
            {
              getTransactionTypeValue[
                event.transaction_type as keyof typeof getTransactionTypeValue
              ]
            }
          </b>
        </div>
      )}
      {event?.minmized && !parallel && (
        <div className="flex flex-col">
          <div className="text-[10px] flex justify-between">
            <div className="flex text-xs items-center gap-1">
              <Clock size={12} />{" "}
              <span> {event?.start_time?.slice(0, 5)} - </span>
              <span> {event?.end_time?.slice(0, 5)} </span>
            </div>
            <span className="opacity-80"></span>
          </div>
        </div>
      )}
      {!event?.minmized && event?.description && (
        <div className="my-2 text-sm">{event?.description} </div>
      )}

      {!event?.minmized && (
        <div className="text-xs space-y-1 mt-2">
          <div className="flex items-center">
            <CalendarIcon className="mr-1 h-3 w-3" />
            {event.start_time}
          </div>
          <div className="flex items-center">
            <ClockIcon className="mr-1 h-3 w-3" />
            {event?.end_time}
          </div>
        </div>
      )}
    </div>
  );
};
