<script lang="ts">
  import { onMount, onDestroy } from 'svelte';

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

  interface CurrentCourse {
    course: CourseSource;
    schedule: ScheduleItem;
    timeRange: string;
    progress: number;
  }

  const DAY_NAMES = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];

  let scheduleData: ScheduleData | null = null;
  let viewMode: 'today' | 'week' = 'today';
  let currentWeek = 1;
  let currentDay = 1;
  let semesterStart: Date;
  let loading = true;
  let currentCourse: CurrentCourse | null = null;
  let updateInterval: ReturnType<typeof setInterval>;

  // 计算当前是第几周第几天
  function calculateCurrentWeekAndDay() {
    if (!scheduleData) return;
    
    const now = new Date();
    semesterStart = new Date(scheduleData.config.startDate.replace(/-/g, '/'));
    const diffTime = now.getTime() - semesterStart.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    // 计算当前周 (从1开始)
    currentWeek = Math.floor(diffDays / 7) + 1;
    if (currentWeek < 1) currentWeek = 1;
    if (currentWeek > scheduleData.config.maxWeek) currentWeek = scheduleData.config.maxWeek;
    
    // 计算当前是周几 (1-7, 周一是1)
    currentDay = (now.getDay() + 6) % 7 + 1;
  }

  // 解析颜色
  function parseColor(color: string): string {
    // 处理 #ffxxxxxx 格式 (带alpha的hex)
    if (color.startsWith('#ff') && color.length === 9) {
      return '#' + color.slice(3);
    }
    return color;
  }

  // 获取时间槽信息
  function getTimeSlot(node: number): TimeSlot | undefined {
    return scheduleData?.timeSlots.find(t => t.node === node);
  }

  // 格式化时间范围
  function formatTimeRange(schedule: ScheduleItem): string {
    // 如果有自定义时间 (ownTime=true)，直接使用 startTime 和 endTime
    if (schedule.ownTime && schedule.startTime && schedule.endTime) {
      return `${schedule.startTime}-${schedule.endTime}`;
    }
    // 否则通过 node 查时间表
    const startSlot = getTimeSlot(schedule.startNode);
    const endSlot = getTimeSlot(schedule.startNode + schedule.step - 1);
    if (!startSlot || !endSlot) return '';
    return `${startSlot.startTime}-${endSlot.endTime}`;
  }

  // 检查当前是否有正在进行的课程
  function updateCurrentCourse() {
    if (!scheduleData) {
      currentCourse = null;
      return;
    }

    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();

    // 遍历今日课程，检查是否有正在进行的
    for (const schedule of scheduleData.schedules) {
      // 检查是否在今天
      if (schedule.day !== currentDay) continue;
      // 检查是否在本周
      if (currentWeek < schedule.startWeek || currentWeek > schedule.endWeek) continue;

      const startSlot = getTimeSlot(schedule.startNode);
      const endSlot = getTimeSlot(schedule.startNode + schedule.step - 1);
      
      if (!startSlot || !endSlot) continue;

      const [startHour, startMin] = startSlot.startTime.split(':').map(Number);
      const [endHour, endMin] = endSlot.endTime.split(':').map(Number);
      
      const courseStartTime = startHour * 60 + startMin;
      const courseEndTime = endHour * 60 + endMin;

      // 检查当前时间是否在课程时间内
      if (currentTime >= courseStartTime && currentTime < courseEndTime) {
        const course = scheduleData.sources.find(c => c.id === schedule.id);
        if (course) {
          const totalDuration = courseEndTime - courseStartTime;
          const elapsed = currentTime - courseStartTime;
          const progress = Math.round((elapsed / totalDuration) * 100);

          currentCourse = {
            course,
            schedule,
            timeRange: `${startSlot.startTime}-${endSlot.endTime}`,
            progress
          };
          return;
        }
      }
    }

    currentCourse = null;
  }

  // 获取今日课程
  function getTodayCourses(): Array<{ course: CourseSource; schedule: ScheduleItem; timeRange: string }> {
    if (!scheduleData) return [];
    
    const result: Array<{ course: CourseSource; schedule: ScheduleItem; timeRange: string }> = [];
    
    scheduleData.schedules.forEach(schedule => {
      // 检查是否在今天
      if (schedule.day !== currentDay) return;
      // 检查是否在本周
      if (currentWeek < schedule.startWeek || currentWeek > schedule.endWeek) return;
      
      const course = scheduleData!.sources.find(c => c.id === schedule.id);
      if (course) {
        result.push({
          course,
          schedule,
          timeRange: formatTimeRange(schedule)
        });
      }
    });
    
    // 按开始节次排序
    return result.sort((a, b) => a.schedule.startNode - b.schedule.startNode);
  }

  // 获取本周课程
  function getWeekCourses(): Array<{ day: number; dayName: string; courses: Array<{ course: CourseSource; schedule: ScheduleItem; timeRange: string }> }> {
    if (!scheduleData) return [];
    
    const weekDays: Array<{ day: number; dayName: string; courses: Array<{ course: CourseSource; schedule: ScheduleItem; timeRange: string }> }> = [];
    
    for (let day = 1; day <= 7; day++) {
      const dayCourses: Array<{ course: CourseSource; schedule: ScheduleItem; timeRange: string }> = [];
      
      scheduleData.schedules.forEach(schedule => {
        if (schedule.day !== day) return;
        if (currentWeek < schedule.startWeek || currentWeek > schedule.endWeek) return;
        
        const course = scheduleData!.sources.find(c => c.id === schedule.id);
        if (course) {
          dayCourses.push({
            course,
            schedule,
            timeRange: formatTimeRange(schedule)
          });
        }
      });
      
      // 按开始节次排序
      dayCourses.sort((a, b) => a.schedule.startNode - b.schedule.startNode);
      
      weekDays.push({
        day,
        dayName: DAY_NAMES[day - 1],
        courses: dayCourses
      });
    }
    
    return weekDays;
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

      scheduleData = {
        config,
        timeSlots,
        sources,
        schedules
      };

      calculateCurrentWeekAndDay();
      updateCurrentCourse();
      
      // 每分钟更新一次当前课程状态
      updateInterval = setInterval(() => {
        updateCurrentCourse();
      }, 60000);
    } catch (error) {
      console.error('Failed to load schedule data:', error);
    } finally {
      loading = false;
    }
  }

  onMount(() => {
    loadScheduleData();
  });

  onDestroy(() => {
    if (updateInterval) {
      clearInterval(updateInterval);
    }
  });
</script>

<div class="schedule-viewer">
  <!-- 头部信息 -->
  <div class="flex items-start justify-between gap-3 mb-6">
    <div class="min-w-0">
      <h1 class="text-xl sm:text-2xl font-bold text-neutral-900 dark:text-neutral-100 mb-1">
        皮梦的课程表
      </h1>
      <p class="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400">
        第 {currentWeek} 周 · {DAY_NAMES[currentDay - 1]}
        {#if scheduleData}
          <span class="ml-1 sm:ml-2 text-xs opacity-75">({scheduleData.config.tableName})</span>
        {/if}
      </p>
    </div>
    
    <!-- 切换按钮 -->
    <div class="flex-shrink-0 flex bg-neutral-100 dark:bg-neutral-800 rounded-lg p-1">
      <button 
        class="px-2 sm:px-4 py-1.5 sm:py-2 rounded-md text-xs sm:text-sm font-medium transition-all"
        class:bg-white={viewMode === 'today'}
        class:dark:bg-neutral-700={viewMode === 'today'}
        class:shadow-sm={viewMode === 'today'}
        class:text-primary={viewMode === 'today'}
        class:text-neutral-600={viewMode !== 'today'}
        class:dark:text-neutral-400={viewMode !== 'today'}
        on:click={() => viewMode = 'today'}
      >
        今日
      </button>
      <button 
        class="px-2 sm:px-4 py-1.5 sm:py-2 rounded-md text-xs sm:text-sm font-medium transition-all"
        class:bg-white={viewMode === 'week'}
        class:dark:bg-neutral-700={viewMode === 'week'}
        class:shadow-sm={viewMode === 'week'}
        class:text-primary={viewMode === 'week'}
        class:text-neutral-600={viewMode !== 'week'}
        class:dark:text-neutral-400={viewMode !== 'week'}
        on:click={() => viewMode = 'week'}
      >
        本周
      </button>
    </div>
  </div>

  {#if loading}
    <div class="flex items-center justify-center py-12">
      <div class="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent"></div>
    </div>
  {:else if !scheduleData}
    <div class="text-center py-12 text-neutral-500 dark:text-neutral-400 bg-neutral-50 dark:bg-neutral-800/50 rounded-xl">
      <p class="text-lg">加载课程数据失败</p>
    </div>
  {:else}
    <!-- 正在上课模块 -->
    {#if currentCourse}
      <div 
        class="current-course-card rounded-2xl p-6 mb-6 border-2 border-white/20 dark:border-white/10 relative overflow-hidden"
        style="background: linear-gradient(135deg, {parseColor(currentCourse.course.color)}20, {parseColor(currentCourse.course.color)}08);"
      >
        <!-- 背景装饰 -->
        <div class="absolute -right-6 -top-6 w-32 h-32 rounded-full opacity-20" style="background: {parseColor(currentCourse.course.color)}"></div>
        <div class="absolute -right-4 -bottom-4 w-24 h-24 rounded-full opacity-10" style="background: {parseColor(currentCourse.course.color)}"></div>
        
        <div class="relative z-10">
          <!-- 标签 -->
          <div class="flex items-center gap-2 mb-3">
            <span class="px-3 py-1 rounded-full text-xs font-bold bg-white/80 dark:bg-black/30" style="color: {parseColor(currentCourse.course.color)}">
              正在上
            </span>
            <span class="text-xs text-neutral-500 dark:text-neutral-400">
              {currentCourse.timeRange}
            </span>
          </div>
          
          <!-- 课程名称 -->
          <h2 class="text-2xl md:text-3xl font-bold text-neutral-900 dark:text-neutral-100 mb-2">
            {currentCourse.course.courseName}
          </h2>
          
          <!-- 进度条 -->
          <div class="mt-4">
            <div class="flex items-center justify-between text-xs text-neutral-600 dark:text-neutral-400 mb-1">
              <span>课程进度</span>
              <span>{currentCourse.progress}%</span>
            </div>
            <div class="h-2 rounded-full bg-white/50 dark:bg-black/20 overflow-hidden">
              <div 
                class="h-full rounded-full transition-all duration-500"
                style="width: {currentCourse.progress}%; background: {parseColor(currentCourse.course.color)}"
              ></div>
            </div>
          </div>
        </div>
      </div>
    {/if}

    {#if viewMode === 'today'}
      <!-- 今日课程视图 -->
      {#if getTodayCourses().length === 0}
        <div class="text-center py-12 text-neutral-500 dark:text-neutral-400 bg-neutral-50 dark:bg-neutral-800/50 rounded-xl">
          <p class="text-lg font-medium">今天没有课</p>
          <p class="text-sm mt-1">好好休息吧！</p>
        </div>
      {:else}
        <div class="space-y-3">
          {#each getTodayCourses() as { course, schedule, timeRange }}
            <div 
              class="course-card rounded-xl p-4 border border-black/5 dark:border-white/5 transition-all hover:shadow-md"
              style="background: linear-gradient(135deg, {parseColor(course.color)}15, {parseColor(course.color)}08);"
            >
              <div class="flex items-center gap-6 py-2">
                <!-- 时间段 -->
                <div class="flex-shrink-0 w-24 text-base font-medium text-neutral-500 dark:text-neutral-400 whitespace-nowrap">
                  {timeRange}
                </div>
                
                <!-- 分隔线 -->
                <div class="w-px h-8 self-center" style="background: {parseColor(course.color)}40"></div>
                
                <!-- 课程名称 -->
                <div class="flex-1 min-w-0">
                  <h3 class="text-2xl font-bold text-neutral-900 dark:text-neutral-100 truncate">
                    {course.courseName}
                  </h3>
                </div>
              </div>
            </div>
          {/each}
        </div>
      {/if}
    {:else}
      <!-- 本周课程视图 -->
      <div class="space-y-6">
        {#each getWeekCourses() as { day, dayName, courses }}
          <div class="week-day">
            <h3 class="text-sm font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <span class="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs">
                {day}
              </span>
              {dayName}
              {#if day === currentDay}
                <span class="px-2 py-0.5 rounded-full bg-primary text-white text-xs">今天</span>
              {/if}
            </h3>
            
            {#if courses.length === 0}
              <div class="text-sm text-neutral-400 dark:text-neutral-500 py-2">
                无课程
              </div>
            {:else}
              <div class="space-y-2">
                {#each courses as { course, schedule, timeRange }}
                  <div 
                    class="course-card rounded-lg p-3 border border-black/5 dark:border-white/5 transition-all hover:shadow-sm"
                    style="background: {parseColor(course.color)}10;"
                  >
                    <div class="flex items-center gap-6 py-2">
                      <!-- 时间 -->
                      <div class="flex-shrink-0 w-24 text-base font-medium text-neutral-500 dark:text-neutral-400 whitespace-nowrap">
                        {timeRange}
                      </div>
                      
                      <!-- 分隔线 -->
                      <div class="w-px h-8 self-center" style="background: {parseColor(course.color)}30"></div>
                      
                      <!-- 课程名 -->
                      <div class="flex-1 min-w-0">
                        <div class="font-bold text-neutral-900 dark:text-neutral-100 truncate text-2xl">
                          {course.courseName}
                        </div>
                      </div>
                    </div>
                  </div>
                {/each}
              </div>
            {/if}
          </div>
        {/each}
      </div>
    {/if}
  {/if}
</div>

<style>
  .schedule-viewer {
    color: var(--text-color);
  }
  
  .course-card {
    backdrop-filter: blur(8px);
  }
  
  .current-course-card {
    backdrop-filter: blur(12px);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  }
  
  .text-primary {
    color: var(--primary);
  }
  
  .bg-primary {
    background-color: var(--primary);
  }
  
  .bg-primary\/10 {
    background-color: color-mix(in oklch, var(--primary) 10%, transparent);
  }
  
  .border-primary {
    border-color: var(--primary);
  }
</style>
