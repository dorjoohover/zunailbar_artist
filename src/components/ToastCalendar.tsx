// "use client";

// import React, { useEffect, useRef, useState } from "react";
// import Calendar, { EventObject } from "@toast-ui/calendar";
// import "@toast-ui/calendar/dist/toastui-calendar.min.css";

// interface Schedule extends EventObject {}

// const ToastCalendar = () => {
//   const calendarRef = useRef<HTMLDivElement>(null);
//   const calendarInstance = useRef<Calendar | null>(null);
//   const [events, setEvents] = useState<Schedule[]>([]);

//   useEffect(() => {
//     if (calendarRef.current && !calendarInstance.current) {
//       const cal = new Calendar(calendarRef.current, {
//         defaultView: "week",
//         usageStatistics: true,
//         useDetailPopup: true,
//         calendars: [
//           {
//             id: "1",
//             name: "My Calendar",
//             color: "#ffffff",
//             bgColor: "#9e5fff",
//           },
//         ],
//       });

//       // Handle drag-to-create
//       cal.on("beforeCreateEvent", (ev) => {
//         const newEvent: Schedule = {
//           id: String(Date.now()),
//           calendarId: "1",
//           title: ev.title || "New Event",
//           start: ev.start,
//           end: ev.end,
//           isAllday: ev.isAllday,
//           category: ev.isAllday ? "allday" : "time",
//         };
//         setEvents((prev) => [...prev, newEvent]);
//       });

//       // Handle click
//       cal.on("clickEvent", ({ event }) => {
//         alert(`Clicked: ${event.title}`);
//       });

//       calendarInstance.current = cal;
//     }
//   }, []);

//   // Sync events to calendar whenever state changes
//   useEffect(() => {
//     if (calendarInstance.current) {
//       calendarInstance.current.clear();
//       calendarInstance.current.createEvents(events);
//     }
//   }, [events]);

//   return <div ref={calendarRef} style={{ height: "800px" }} />;
// };

// export default ToastCalendar;
