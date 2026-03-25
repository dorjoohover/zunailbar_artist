"use client";

import React, {
  useRef,
  useState,
  useCallback,
  useEffect,
  useMemo,
  Dispatch,
  SetStateAction,
} from "react";
import { AnimatePresence, motion } from "framer-motion";

import { ArrowLeft, ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";

import { useScheduler } from "@/providers/schedular-provider";
import { useModal } from "@/providers/modal-context";
import AddEventModal from "@/components/schedule/_modals/add-event-modal";
import EventStyled from "../event-component/event-styled";
import { CustomEventModal } from "@/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import CustomModal from "@/components/ui/custom-modal";
import {
  mnDate,
  mnDateFormat,
  mnDateFormatTitle,
  totalHours,
  toTimeString,
} from "@/lib/functions";
import { Branch, IOrder, Order, Service, User } from "@/models";
import { ListType, SearchType } from "@/lib/constants";
import { Api } from "@/utils/api";
import { DatePicker } from "@/shared/components/date.picker";
import { FilterType } from "@/app/orders/components";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// Generate hours in 12-hour format
const hours = Array.from({ length: totalHours }, (_, i) => {
  const hour = i + 7;
  return `${hour}:00`;
});

// Animation variants
const containerVariants = {
  hidden: { opacity: 1 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05, // Stagger effect between children
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 5 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.12 } },
};

const pageTransitionVariants = {
  enter: (direction: number) => ({
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    opacity: 0,
    transition: {
      opacity: { duration: 0.2, ease: "easeInOut" },
    },
  }),
};

// Precise time-based event grouping function
const groupEventsByTimePeriod = (events: Order[] | undefined) => {
  if (!events || events.length === 0) return [];

  // Sort events by start time
  const sortedEvents = [...events].sort((a, b) => {
    const start_date = new Date(a.order_date ?? new Date());
    start_date.setHours(+a.start_time?.slice(0, 2));
    const end_date = new Date(b.order_date ?? new Date());
    start_date.setHours(+b.start_time?.slice(0, 2));

    return start_date.getTime() - end_date.getTime();
  });

  const buildOverlapGraph = (events: IOrder[]) => {
    const graph: Record<string, string[]> = {};

    // Initialize graph
    events.forEach((event) => {
      if (event.id) graph[event.id] = [];
    });

    // Build connections
    for (let i = 0; i < events.length; i++) {
      for (let j = i + 1; j < events.length; j++) {
        // if (eventsOverlap(events[i], events[j])) {
        //   graph[events[i].id].push(events[j].id);
        //   graph[events[j].id].push(events[i].id);
        // }
      }
    }

    return graph;
  };

  // Find connected components using DFS
  const findConnectedComponents = (
    graph: Record<string, string[]>,
    events: IOrder[],
  ) => {
    const visited: Record<string, boolean> = {};
    const components: IOrder[][] = [];

    // DFS function to traverse the graph
    const dfs = (nodeId: string, component: string[]) => {
      visited[nodeId] = true;
      component.push(nodeId);

      for (const neighbor of graph[nodeId]) {
        if (!visited[neighbor]) {
          dfs(neighbor, component);
        }
      }
    };

    // Find all connected components
    for (const event of events) {
      if (event.id && !visited[event.id]) {
        const component: string[] = [];
        dfs(event.id, component);

        // Map IDs back to events
        const eventGroup = component.map(
          (id) => events.find((e) => e.id === id)!,
        );

        components.push(eventGroup);
      }
    }

    return components;
  };

  // Build the overlap graph
  const graph = buildOverlapGraph(sortedEvents as any);

  // Find connected components (groups of overlapping events)
  const timeGroups = findConnectedComponents(graph, sortedEvents as any);

  // Sort events within each group by start time
  return timeGroups.map((group) =>
    group.sort((a, b) => {
      const start_date = new Date(a.order_date ?? new Date());
      start_date.setHours(a.start_time ? +a.start_time?.slice(0, 2) : 5);
      const end_date = new Date(b.order_date ?? new Date());
      start_date.setHours(b.start_time ? +b.start_time?.slice(0, 2) : 5);

      return start_date.getTime() - end_date.getTime();
    }),
  );
};

export default function DailyView({
  prevButton,
  nextButton,
  CustomEventModal,
  loading,
  events,
  deleteOrder,
  classNames,
  values,
  send,
  filter,
  setFilter,
}: {
  prevButton?: React.ReactNode;
  deleteOrder: (id: string) => void;

  setFilter: (key: string, value: string | number | undefined) => void;
  filter?: FilterType;
  nextButton?: React.ReactNode;
  CustomEventComponent?: React.FC<IOrder>;
  events: Order[];
  loading: boolean;
  send: (order: IOrder) => void;
  values: {
    branch: SearchType<Branch>[];
    customer: SearchType<User>[];
    user: SearchType<User>[];
    service: ListType<Service>;
  };
  CustomEventModal?: CustomEventModal;
  stopDayEventSummary?: boolean;
  classNames?: { prev?: string; next?: string; addEvent?: string };
}) {
  const nextDate = filter?.date?.to ?? new Date();
  const currentDate = filter?.date?.from ?? new Date();
  const [direction, setDirection] = useState<number>(0);
  const { setOpen } = useModal();
  const { handlers } = useScheduler();
  const orderMap = useMemo(() => {
    const map = new Map<string, Order[]>();
    events.forEach((ev) => {
      const arr = map.get(ev.start_time) ?? [];
      arr.push(ev);
      map.set(ev.start_time, arr);
    });
    return map;
  }, [events]);

  const getFormattedDayTitle = useCallback(
    () => mnDateFormatTitle(mnDateFormat(currentDate)),
    [currentDate],
  );

  function handleAddEvent(event?: IOrder) {
    const orderDate = event?.order_date || new Date();

    setOpen(
      <CustomModal title="Захиалга нэмэх" contentClass="max-w-3xl">
        <AddEventModal
          items={values}
          values={{
            order_date: event?.order_date,
            start_time: event?.start_time?.slice(0, 2),
            paid_amount: 0,
            total_amount: 0,
            pre_amount: 0,
          }}
          send={send}
          loading={loading}
        />
      </CustomModal>,
      async () => {
        return {
          ...event,
          orderDate,
        };
      },
    );
  }

  function handleAddEventDay(detailedHour: number) {
    if (!detailedHour) {
      console.error("Detailed hour not provided.");
      return;
    }

    // Parse the 12-hour format time
    let hours = detailedHour;

    const chosenDay = currentDate.getDate();

    // Ensure day is valid
    if (chosenDay < 1 || chosenDay > 31) {
      console.error("Invalid day selected:", chosenDay);
      return;
    }

    const date = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      chosenDay,
      hours,
      0,
    );

    handleAddEvent({
      order_date: mnDateFormat(date),
      branch_id: "",
      user_id: "",
    });
  }

  const handleNextDay = useCallback(() => {
    setDirection(1);
    const nextDay = new Date(currentDate);
    nextDay.setDate(currentDate.getDate() + 1);
    setFilter("date", {
      from: nextDay,
      to: nextDate,
    } as any);
  }, [currentDate]);

  const handlePrevDay = useCallback(() => {
    setDirection(-1);
    const prevDay = new Date(currentDate);
    prevDay.setDate(currentDate.getDate() - 1);
    setFilter("date", {
      from: prevDay,
      to: nextDate,
    } as any);
  }, [currentDate]);

  return (
    <>
      <div className="flex justify-between gap-3  mb-5">
        <h1 className="text-xl md:text-3xl font-semibold mb-4">
          {/* title */}
          {getFormattedDayTitle()}
        </h1>

        <div className="flex flex-col gap-2 sm:gap-4">
          <div className="flex ml-auto gap-1">
            {prevButton ? (
              <div onClick={handlePrevDay}>{prevButton}</div>
            ) : (
              <Button
                variant={"outline"}
                className={classNames?.prev}
                onClick={handlePrevDay}
              >
                <ChevronLeft />
                Өмнөх
              </Button>
            )}
            {nextButton ? (
              <div onClick={handleNextDay}>{nextButton}</div>
            ) : (
              <Button
                variant={"outline"}
                className={classNames?.next}
                onClick={handleNextDay}
              >
                Дараах
                <ChevronRight />
              </Button>
            )}
          </div>
          <div className="flex justify-end">
            <Button onClick={() => handleAddEvent()} className="w-full ">
              Захиалга нэмэх
            </Button>
          </div>
        </div>
      </div>
      <AnimatePresence initial={false} custom={direction} mode="wait">
        <motion.div
          key={currentDate.toISOString()}
          custom={direction}
          className="flex flex-col gap-4"
        >
          <div className="relative rounded-md bg-default-50 hover:bg-default-100 transition duration-400">
            <motion.div className="relative rounded-xl flex ease-in-out">
              <div className="flex  flex-col">
                {hours.map((hour, index) => (
                  <motion.div
                    key={`hour-${index}`}
                    variants={itemVariants}
                    className="cursor-pointer   transition duration-300 pl-1 pr-2 md:p-4 h-[64px] text-left text-xs md:text-sm  text-muted-foreground border-default-200"
                  >
                    {hour}
                  </motion.div>
                ))}
              </div>
              <div className="flex relative flex-grow flex-col overflow-auto">
                {Array.from({ length: totalHours }, (_, i) => i + 7).map(
                  (_, index) => (
                    <div
                      onClick={() => {
                        handleAddEventDay(_);
                      }}
                      key={`hour-${index}`}
                      className="cursor-pointer w-full relative border-b  hover:bg-default-200/50  transition duration-300  p-4 h-[64px] text-left text-sm text-muted-foreground border-default-200"
                    >
                      <div className="absolute bg-accent flex items-center justify-center text-xs opacity-0 transition left-0 top-0 duration-250 hover:opacity-100 w-full h-full">
                        Захиалга нэмэх
                      </div>
                    </div>
                  ),
                )}

                <AnimatePresence initial={false}>
                  {events && events?.length
                    ? events.map((event, eventIndex) => {
                      
                        const group = orderMap.get(event.start_time) ?? []; // эсвэл orderMap[event.start_time]
                        const eventsInSamePeriod = group.length;
                        const periodIndex = group.findIndex(
                          (e) => e.id === event.id,
                        );

                        const { height, left, top, zIndex } =
                          handlers.handleEventStyling(event, events, {
                            eventsInSamePeriod,
                            periodIndex,
                            adjustForPeriod: true,
                          });
                        return (
                          <motion.div
                            key={event.id}
                            style={{
                              top: top,
                              width: `${Math.ceil(100 / group.length)}%`,
                              left: `${left}%`,
                              padding: "0px 0px",
                              height: height,
                              boxSizing: "border-box",
                            }}
                            className={` flex transition-all duration-1000 flex-grow flex-col absolute`}
                          >
                            <EventStyled
                              onDelete={deleteOrder}
                              send={send}
                              values={values}
                              index={zIndex}
                              event={{
                                ...event,
                                minmized: true,
                              }}
                              CustomEventModal={CustomEventModal}
                            />
                            {/* )} */}
                          </motion.div>
                        );
                      })
                    : ""}
                </AnimatePresence>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </AnimatePresence>
    </>
  );
}
