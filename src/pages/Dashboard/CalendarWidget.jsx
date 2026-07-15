import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Calendar, Clock, AlertTriangle, CheckSquare,
  ChevronLeft, ChevronRight,
} from 'lucide-react';
import Card, { CardHeader } from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'];

const STORAGE_KEY = 'optivian_calendar_view';

function loadSavedView() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch { /* ignore */ }
  return null;
}

function saveView(month, year) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ month, year }));
  } catch { /* ignore */ }
}

export default function CalendarWidget({ upcomingDeadlines = [], loading }) {
  const navigate = useNavigate();
  const today = new Date();
  const savedView = loadSavedView();
  const [viewMonth, setViewMonth] = useState(savedView?.month ?? today.getMonth());
  const [viewYear, setViewYear] = useState(savedView?.year ?? today.getFullYear());

  const currentMonth = viewMonth;
  const currentYear = viewYear;

  const navigateMonth = (delta) => {
    const newDate = new Date(currentYear, currentMonth + delta, 1);
    setViewMonth(newDate.getMonth());
    setViewYear(newDate.getFullYear());
    saveView(newDate.getMonth(), newDate.getFullYear());
  };

  // Generate calendar grid
  const calendarDays = useMemo(() => {
    const firstDay = new Date(currentYear, currentMonth, 1).getDay();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const days = [];

    // Empty cells before first day
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }

    // Day cells
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }

    return days;
  }, [currentMonth, currentYear]);

  // Get events for a specific day
  const getEventsForDay = (day) => {
    if (!day) return [];
    const dateStr = new Date(currentYear, currentMonth, day).toDateString();
    return upcomingDeadlines.filter(t => {
      if (!t.due_date) return false;
      return new Date(t.due_date).toDateString() === dateStr;
    });
  };

  // Get events for actual today's date
  const todayEvents = useMemo(() => {
    return upcomingDeadlines.filter(t => {
      if (!t.due_date) return false;
      return new Date(t.due_date).toDateString() === today.toDateString();
    });
  }, [upcomingDeadlines]);
  const urgentCount = upcomingDeadlines.filter(t => t.priority === 'urgent' && new Date(t.due_date) >= new Date()).length;

  if (loading) {
    return (
      <Card variant="default" padding="p-5">
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-slate-200 dark:bg-slate-700/50 rounded w-1/3" />
          <div className="grid grid-cols-7 gap-0.5">
            {Array.from({ length: 35 }).map((_, i) => (
              <div key={i} className="h-8 bg-slate-100 dark:bg-slate-800/50 rounded" />
            ))}
          </div>
          <div className="h-3 bg-slate-200 dark:bg-slate-700/50 rounded w-1/2" />
        </div>
      </Card>
    );
  }

  return (
    <Card variant="default" padding="p-5">
      <CardHeader title="Calendar" subtitle="Upcoming deadlines" icon={Calendar} color="primary" />

      {/* Month Header */}
      <div className="flex items-center justify-between mb-3">          <h4 className="text-sm font-semibold text-foreground dark:text-slate-100">
          {MONTHS[currentMonth]} {currentYear}
        </h4>          <div className="flex items-center gap-1">
          <button onClick={() => navigateMonth(-1)} className="p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800/80 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
            <ChevronLeft size={14} />
          </button>
          <button onClick={() => navigateMonth(1)} className="p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800/80 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
            <ChevronRight size={14} />
          </button>
        </div>
      </div>

      {/* Day Headers */}
      <div className="grid grid-cols-7 gap-0.5 mb-1">
        {DAYS.map(d => (
          <div key={d} className="text-center text-[10px] font-medium text-slate-400 py-1">
            {d}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-0.5 mb-4">
        {calendarDays.map((day, i) => {
          if (day === null) return <div key={`empty-${i}`} />;
          const events = getEventsForDay(day);
          const isToday = day === today.getDate() &&
            currentMonth === today.getMonth() &&
            currentYear === today.getFullYear();
          const hasUrgent = events.some(t => t.priority === 'urgent');
          const hasEvents = events.length > 0;

          return (
            <motion.button
              key={day}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}                className={`
                relative flex flex-col items-center justify-center py-1.5 rounded-lg text-xs
                transition-all duration-200
                ${isToday
                  ? 'bg-primary text-white font-bold shadow-sm'
                  : hasEvents
                    ? 'hover:bg-slate-100 dark:hover:bg-slate-800/50 text-foreground dark:text-slate-200'
                    : 'text-slate-400 dark:text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800/30'
                }
              `}
            >
              <span>{day}</span>
              {hasEvents && (
                <div className="flex gap-0.5 mt-0.5">
                  {hasUrgent && <span className="w-1 h-1 rounded-full bg-rose-500" />}
                  <span className={`w-1 h-1 rounded-full ${isToday ? 'bg-white/80' : 'bg-primary'}`} />
                </div>
              )}
            </motion.button>
          );
        })}
      </div>

      {/* Today's Events */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
            <Clock size={12} /> Today
          </h4>
          {todayEvents.length > 0 && (
            <Badge color={todayEvents.some(t => t.priority === 'urgent') ? 'rose' : 'primary'} size="xs">
              {todayEvents.length} event{todayEvents.length !== 1 ? 's' : ''}
            </Badge>
          )}
        </div>

        {todayEvents.length > 0 ? (
          <div className="space-y-1">
            {todayEvents.slice(0, 3).map((t, i) => (
              <motion.div
                key={t.id || i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors cursor-pointer"
                onClick={() => navigate('/app/tasks')}
              >
                <div className={`w-1.5 h-1.5 rounded-full ${
                  t.priority === 'urgent' ? 'bg-rose-500' :
                  t.priority === 'high' ? 'bg-orange-500' :
                  t.priority === 'medium' ? 'bg-amber-500' : 'bg-slate-400'
                }`} />
                <span className="text-xs text-slate-700 dark:text-slate-300 truncate flex-1">{t.title}</span>
                {t.priority === 'urgent' && <AlertTriangle size={10} className="text-rose-500 shrink-0" />}
              </motion.div>
            ))}
            {todayEvents.length > 3 && (
              <p className="text-[10px] text-slate-400 text-center">+{todayEvents.length - 3} more</p>
            )}
          </div>
        ) : (
          <p className="text-xs text-slate-400 text-center py-2">No events today</p>
        )}
      </div>

      {/* Urgent Count */}
      {urgentCount > 0 && (
        <div className="mt-3 pt-3 border-t border-border">
          <div className="flex items-center gap-2 p-2 rounded-lg bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800">
            <AlertTriangle size={14} className="text-rose-600 dark:text-rose-400 shrink-0" />
            <span className="text-xs text-rose-700 dark:text-rose-300">
              {urgentCount} urgent deadline{urgentCount !== 1 ? 's' : ''} ahead
            </span>
          </div>
        </div>
      )}
    </Card>
  );
}
