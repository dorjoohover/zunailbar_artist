declare module '@toast-ui/calendar' {
interface Schedule {
  id: string;
  calendarId: string;
  title: string;
  category: string;
  start: Date | string;  // allow both string and Date if your data has both
  end: Date | string;
}


  interface ScheduleEvent {
    schedule: Schedule;
    changes?: Partial<Schedule>;
    start?: Date;
    end?: Date;
    title?: string;
  }

  interface CreateScheduleEvent {
    start: Date;
    end: Date;
    title?: string;
    isAllDay?: boolean;
    isPrivate?: boolean;
    location?: string;
  }

  interface CalendarOptions {
    defaultView?: string;
    taskView?: boolean;
    scheduleView?: boolean;
    useCreationPopup?: boolean;
    useDetailPopup?: boolean;
    calendars?: Array<{ id: string; name: string; color?: string; bgColor?: string }>;
    schedules?: Schedule[];

    // Add these event handler typings
    onBeforeCreateSchedule?: (event: CreateScheduleEvent) => void;
    onClickSchedule?: (event: ScheduleEvent) => void;
    onBeforeUpdateSchedule?: (event: ScheduleEvent & { changes: Partial<Schedule> }) => void;
    onBeforeDeleteSchedule?: (event: ScheduleEvent) => void;
  }

  class Calendar {
    constructor(container: HTMLElement, options?: CalendarOptions);
    createSchedules(schedules: Schedule[]): void;
    updateSchedule(id: string, calendarId: string, changes: Partial<Schedule>): void;
    deleteSchedule(id: string, calendarId: string): void;
    clear(): void;
    destroy(): void;
  }

  export default Calendar;
}
