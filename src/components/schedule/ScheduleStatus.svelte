<script lang="ts">
  import { onMount } from 'svelte';

  interface TimeSlot {
    node: number;
    startTime: string;
    endTime: string;
    timeTable: number;
  }

  interface CourseSource {
    id: number;
    courseName: string;
    color: string;
    credit: number;
    note: string;
    tableId: number;
  }

  interface ScheduleItem {
    id: number;
    day: number;
    startWeek: number;
    endWeek: number;
    startNode: number;
    step: number;
    room: string;
    teacher: string;
    type: number;
    tableId: number;
    level: number;
    ownTime: boolean;
    startTime: string;
    endTime: string;
  }

  interface ScheduleConfig {
    startDate: string;
    maxWeek: number;
    nodes: number;
    showSat: boolean;
    showSun: boolean;
    tableName: string;
  }

  interface ScheduleData {
    config: ScheduleConfig;
    timeSlots: TimeSlot[];
    sources: CourseSource[];
    schedules: ScheduleItem[];
  }

  let scheduleData: ScheduleData | null = null;
  let loading = true;
  let currentWeek = 1;
  let currentDay = 1;
  let currentTimeMinutes = 0;

  // 计算当前是第几周第几天
  function calculateCurrentWeekAndDay() {
    if (!scheduleData) return;
    
    const now = new Date();
    const semesterStart = new Date(scheduleData.config.startDate.replace(/-/g, '/'));
    const diffTime = now.getTime() - semesterStart.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    currentWeek = Math.floor(diffDays / 7) + 1;
    if (currentWeek < 1) currentWeek = 1;
    if (currentWeek > scheduleData.config.maxWeek) currentWeek = scheduleData.config.maxWeek;
    
    currentDay = (now.getDay() + 6) % 7 + 1;
    currentTimeMinutes = now.getHours() * 60 + now.getMinutes();
  }

  // 获取时间槽信息
  function getTimeSlot(node: number): TimeSlot | undefined {
    return scheduleData?.timeSlots.find(t => t.node === node);
  }

  // 获取课程的开始和结束时间（分钟）
  function getCourseTimeRange(schedule: ScheduleItem): { start: number; end: number } {
    if (schedule.ownTime && schedule.startTime && schedule.endTime) {
      const [startHour, startMin] = schedule.startTime.split(':').map(Number);
      const [endHour, endMin] = schedule.endTime.split(':').map(Number);
      return {
        start: startHour * 60 + startMin,
        end: endHour * 60 + endMin
      };
    }
    
    const startSlot = getTimeSlot(schedule.startNode);
    const endSlot = getTimeSlot(schedule.startNode + schedule.step - 1);
    
    if (!startSlot || !endSlot) return { start: 0, end: 0 };
    
    const [startHour, startMin] = startSlot.startTime.split(':').map(Number);
    const [endHour, endMin] = endSlot.endTime.split(':').map(Number);
    
    return {
      start: startHour * 60 + startMin,
      end: endHour * 60 + endMin
    };
  }

  // 获取今日课程
  function getTodayCourses() {
    if (!scheduleData) return [];
    
    const result: Array<{
      course: CourseSource;
      schedule: ScheduleItem;
      isCurrent: boolean;
      isCompleted: boolean;
      startMinutes: number;
      endMinutes: number;
    }> = [];
    
    scheduleData.schedules.forEach(schedule => {
      if (schedule.day !== currentDay) return;
      if (currentWeek < schedule.startWeek || currentWeek > schedule.endWeek) return;
      
      const course = scheduleData!.sources.find(c => c.id === schedule.id);
      if (course) {
        const { start, end } = getCourseTimeRange(schedule);
        const isCurrent = currentTimeMinutes >= start && currentTimeMinutes < end;
        const isCompleted = currentTimeMinutes >= end;
        
        result.push({
          course,
          schedule,
          isCurrent,
          isCompleted,
          startMinutes: start,
          endMinutes: end
        });
      }
    });
    
    result.sort((a, b) => a.startMinutes - b.startMinutes);
    return result;
  }

  // 获取当前状态
  function getCurrentStatus() {
    const courses = getTodayCourses();
    const currentCourse = courses.find(c => c.isCurrent);
    
    if (currentCourse) {
      return {
        type: 'current' as const,
        course: currentCourse.course,
        schedule: currentCourse.schedule,
        progress: Math.round(((currentTimeMinutes - currentCourse.startMinutes) / (currentCourse.endMinutes - currentCourse.startMinutes)) * 100)
      };
    }
    
    // 找下一节课
    const upcomingCourses = courses.filter(c => !c.isCompleted && !c.isCurrent);
    if (upcomingCourses.length > 0) {
      const nextCourse = upcomingCourses[0];
      const minutesUntil = nextCourse.startMinutes - currentTimeMinutes;
      return {
        type: 'upcoming' as const,
        course: nextCourse.course,
        schedule: nextCourse.schedule,
        minutesUntil
      };
    }
    
    // 今天没课了
    if (courses.length === 0) {
      return { type: 'no-class' as const };
    }
    
    return { type: 'finished' as const };
  }

  // 格式化时间
  function formatTime(minutes: number): string {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  }

  // 加载数据
  async function loadScheduleData() {
    try {
      const [configRes, timeRes, sourcesRes, mainRes] = await Promise.all([
        fetch('/schedule/schedule_config.json'),
        fetch('/schedule/schedule_time.json'),
        fetch('/schedule/schedule_sources.json'),
        fetch('/schedule/schedule_main.json')
      ]);

      const [config, timeSlots, sources, schedules] = await Promise.all([
        configRes.json(),
        timeRes.json(),
        sourcesRes.json(),
        mainRes.json()
      ]);

      scheduleData = { config, timeSlots, sources, schedules };
      calculateCurrentWeekAndDay();
    } catch (error) {
      console.error('Failed to load schedule data:', error);
    } finally {
      loading = false;
    }
  }

  onMount(() => {
    loadScheduleData();
    const interval = setInterval(() => {
      calculateCurrentWeekAndDay();
    }, 60000);
    return () => clearInterval(interval);
  });
</script>

<div class="card-base p-5 mb-6">
  <div class="flex items-center gap-2 mb-4">
    <div class="w-8 h-8 rounded-lg bg-(--primary)/10 flex items-center justify-center">
      <svg class="w-4 h-4 text-(--primary)" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path fill="currentColor" d="M5 22q-.825 0-1.412-.587T3 20V6q0-.825.588-1.412T5 4h1V3q0-.425.288-.712T7 2t.713.288T8 3v1h8V3q0-.425.288-.712T17 2t.713.288T18 3v1h1q.825 0 1.413.588T21 6v14q0 .825-.587 1.413T19 22zm0-2h14V10H5zM5 8h14V6H5zm0 0V6zm7 6q-.425 0-.712-.288T11 13t.288-.712T12 12t.713.288T13 13t-.288.713T12 14m-4.712-.288Q7 13.426 7 13t.288-.712T8 12t.713.288T9 13t-.288.713T8 14t-.712-.288M16 14q-.425 0-.712-.288T15 13t.288-.712T16 12t.713.288T17 13t-.288.713T16 14m-4 4q-.425 0-.712-.288T11 17t.288-.712T12 16t.713.288T13 17t-.288.713T12 18m-4.712-.288Q7 17.426 7 17t.288-.712T8 16t.713.288T9 17t-.288.713T8 18t-.712-.288M16 18q-.425 0-.712-.288T15 17t.288-.712T16 16t.713.288T17 17t-.288.713T16 18"></path>
      </svg>
    </div>
    <h2 class="text-base font-semibold text-(--btn-content)">上课状态</h2>
  </div>

  {#if loading}
    <div class="flex items-center justify-center py-8">
      <div class="animate-spin rounded-full h-6 w-6 border-2 border-(--primary) border-t-transparent"></div>
    </div>
  {:else}
    {@const status = getCurrentStatus()}
    
    <div class="text-center py-4">
      {#if status.type === 'current'}
        <!-- 正在上课 -->
        <div class="w-16 h-16 mx-auto mb-3 rounded-full bg-(--primary)/10 flex items-center justify-center">
          <svg class="w-8 h-8 text-(--primary)" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"></path>
          </svg>
        </div>
        <p class="text-lg font-semibold text-(--btn-content) mb-1">正在上课</p>
        <p class="text-sm text-neutral-500 dark:text-neutral-400">{status.course.courseName}</p>
        {#if status.schedule.room}
          <p class="text-xs text-neutral-400 dark:text-neutral-500 mt-1">{status.schedule.room}</p>
        {/if}
        <div class="mt-3 mx-auto max-w-[200px]">
          <div class="h-1.5 w-full bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
            <div class="h-full bg-(--primary) rounded-full transition-all duration-500" style="width: {status.progress}%"></div>
          </div>
          <p class="text-xs text-neutral-400 mt-1">已进行 {status.progress}%</p>
        </div>
        
      {:else if status.type === 'upcoming'}
        <!-- 即将上课 -->
        <div class="w-16 h-16 mx-auto mb-3 rounded-full bg-(--primary)/10 flex items-center justify-center">
          <svg class="w-8 h-8 text-(--primary)" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <polyline points="12 6 12 12 16 14"></polyline>
          </svg>
        </div>
        <p class="text-lg font-semibold text-(--btn-content) mb-1">距离上课还有 {status.minutesUntil} 分钟</p>
        <p class="text-sm text-neutral-500 dark:text-neutral-400">{status.course.courseName}</p>
        {#if status.schedule.room}
          <p class="text-xs text-neutral-400 dark:text-neutral-500 mt-1">{status.schedule.room}</p>
        {/if}
        
      {:else if status.type === 'no-class'}
        <!-- 今天没课 -->
        <div class="w-16 h-16 mx-auto mb-3 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
          <svg class="w-8 h-8 text-neutral-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
          </svg>
        </div>
        <p class="text-lg font-semibold text-(--btn-content) mb-1">今天没课啦</p>
        <p class="text-sm text-neutral-400">好好休息~</p>
        
      {:else}
        <!-- 今日课程已结束 -->
        <div class="w-16 h-16 mx-auto mb-3 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
          <svg class="w-8 h-8 text-neutral-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
            <polyline points="22 4 12 14.01 9 11.01"></polyline>
          </svg>
        </div>
        <p class="text-lg font-semibold text-(--btn-content) mb-1">今天的课上完啦</p>
        <p class="text-sm text-neutral-400">辛苦啦，好好休息~</p>
      {/if}
    </div>

    <div class="mt-4 pt-4 border-t border-neutral-100 dark:border-neutral-800 text-center">
      <a href="/schedule/" class="inline-flex items-center gap-1 text-sm text-(--primary) hover:opacity-80 transition-opacity">
        查看完整课表
        <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M5 12h14M12 5l7 7-7 7"></path>
        </svg>
      </a>
    </div>
  {/if}
</div>
