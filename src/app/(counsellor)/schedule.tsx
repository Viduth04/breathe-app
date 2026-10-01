// Counsellor Schedule - Muaath (Member 4). Supports FR08.
import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, typography, TOUCH_TARGET } from '@/theme';

type ViewMode = "week" | "month";

interface DayInfo {
  id: string;
  dayName: string;
  dateStr: string;
  dateNum: number;
  status: 'available' | 'partial' | 'unavailable';
}

interface TimeSlot {
  id: string;
  startTime: string;
  endTime: string;
  status: 'open' | 'booked' | 'closed';
  title: string;
  subtitle?: string;
}

interface SchedulePreference {
  id: string;
  title: string;
  subtitle: string;
  enabled: boolean;
}

const MOCK_WEEK_RANGE = "Aug 18 \u2013 Aug 24, 2025";

const MOCK_WEEK_DAYS: DayInfo[] = [
  { id: '1', dayName: 'Mon', dateStr: 'Aug 18', dateNum: 18, status: 'available' },
  { id: '2', dayName: 'Tue', dateStr: 'Aug 19', dateNum: 19, status: 'partial' },
  { id: '3', dayName: 'Wed', dateStr: 'Aug 20', dateNum: 20, status: 'unavailable' },
  { id: '4', dayName: 'Thu', dateStr: 'Aug 21', dateNum: 21, status: 'available' },
  { id: '5', dayName: 'Fri', dateStr: 'Aug 22', dateNum: 22, status: 'partial' },
  { id: '6', dayName: 'Sat', dateStr: 'Aug 23', dateNum: 23, status: 'unavailable' },
];

const MOCK_TIME_SLOTS: TimeSlot[] = [
  { id: 't1', startTime: '09:00', endTime: '09:50', status: 'open', title: 'Open for initial consults' },
  { id: 't2', startTime: '10:00', endTime: '10:50', status: 'booked', title: 'Confirmed \u2022 Student #4021' },
  { id: 't3', startTime: '11:00', endTime: '11:50', status: 'open', title: 'Open for booking' },
  { id: 't4', startTime: '01:00', endTime: '01:50', status: 'closed', title: 'Clinical break & paperwork' },
  { id: 't5', startTime: '02:00', endTime: '02:50', status: 'open', title: 'Open for booking' },
  { id: 't6', startTime: '03:00', endTime: '03:50', status: 'open', title: 'Open for booking' },
  { id: 't7', startTime: '04:00', endTime: '04:50', status: 'open', title: 'Open for booking' },
];

const MOCK_SCHEDULE_PREFERENCES: SchedulePreference[] = [
  { id: 'p1', title: '15-minute buffer between sessions', subtitle: 'Adds buffer time automatically', enabled: true },
  { id: 'p2', title: 'Accept same-day bookings (2 hr lead)', subtitle: 'Allow last minute appointments', enabled: true },
];

export default function CounsellorScheduleScreen() {
  const [viewMode, setViewMode] = useState<ViewMode>('week');
  const [selectedDay, setSelectedDay] = useState<number>(0);
  const [slots, setSlots] = useState<TimeSlot[]>(MOCK_TIME_SLOTS);
  const [preferences, setPreferences] = useState<SchedulePreference[]>(MOCK_SCHEDULE_PREFERENCES);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  const toggleSlotStatus = (index: number) => {
    setSlots(prev => prev.map((slot, i) => {
      if (i === index && slot.status !== 'booked') {
        return { ...slot, status: slot.status === 'open' ? 'closed' : 'open' };
      }
      return slot;
    }));
  };

  const togglePreference = (index: number) => {
    setPreferences(prev => prev.map((pref, i) => {
      if (i === index) {
        return { ...pref, enabled: !pref.enabled };
      }
      return pref;
    }));
  };

  const markAllOpen = () => {
    setSlots(prev => prev.map(slot => slot.status !== 'booked' ? { ...slot, status: 'open' } : slot));
  };

  const handleSave = () => {
    setFeedbackMessage('Availability saved successfully.');
    setTimeout(() => setFeedbackMessage(null), 3000);
  };

  const getStatusColor = (status: DayInfo['status']) => {
    switch (status) {
      case 'available': return colors.primary;
      case 'partial': return '#F59E0B'; // Amber
      case 'unavailable': return colors.textSecondary;
      default: return colors.border;
    }
  };

  const currentDay = MOCK_WEEK_DAYS[selectedDay];

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* 1. TOP HEADER */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.greenDot} />
          <Text style={styles.headerTitle}>Clinical Schedule</Text>
        </View>
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarText}>DR</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* 2. SUBHEADER */}
        <View style={styles.subHeader}>
          <Pressable 
            style={styles.backButton} 
            onPress={() => router.navigate('/(counsellor)/dashboard')}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Ionicons name="arrow-back" size={20} color={colors.text} accessibilityElementsHidden importantForAccessibility="no" />
          </Pressable>
          <View style={styles.autoSyncPill}>
            <Text style={styles.autoSyncText}>Auto-Sync On</Text>
          </View>
        </View>

        {/* 3. TITLE BLOCK */}
        <View style={styles.titleBlock}>
          <Text style={styles.mainTitle}>Manage your availability</Text>
          <Text style={styles.subTitle}>Students can only book the time slots you mark as available.</Text>
        </View>

        {/* 4. VIEW SWITCHER */}
        <View style={styles.viewSwitcherContainer}>
          <View style={styles.viewSwitcher}>
            <Pressable 
              style={[styles.viewSwitchBtn, viewMode === 'week' && styles.viewSwitchBtnActive]}
              onPress={() => setViewMode('week')}
              accessibilityRole="button"
              accessibilityLabel="Week view"
            >
              {viewMode === 'week' && <Ionicons name="calendar-outline" size={16} color={colors.text} style={styles.viewSwitchIcon} />}
              <Text style={[styles.viewSwitchText, viewMode === 'week' && styles.viewSwitchTextActive]}>Week View</Text>
            </Pressable>
            <Pressable 
              style={[styles.viewSwitchBtn, viewMode === 'month' && styles.viewSwitchBtnActive]}
              onPress={() => setViewMode('month')}
              accessibilityRole="button"
              accessibilityLabel="Month view"
            >
              <Text style={[styles.viewSwitchText, viewMode === 'month' && styles.viewSwitchTextActive]}>Month View</Text>
            </Pressable>
          </View>
        </View>

        {/* 5. DATE NAV */}
        <View style={styles.dateNav}>
          <View style={styles.dateNavArrows}>
            <Pressable accessibilityRole="button" accessibilityLabel="Previous week">
              <Ionicons name="chevron-back" size={24} color={colors.text} />
            </Pressable>
            <Text style={styles.dateNavText}>{MOCK_WEEK_RANGE}</Text>
            <Pressable accessibilityRole="button" accessibilityLabel="Next week">
              <Ionicons name="chevron-forward" size={24} color={colors.text} />
            </Pressable>
          </View>
          <Pressable 
            style={styles.todayBtn} 
            onPress={() => setSelectedDay(0)}
            accessibilityRole="button"
            accessibilityLabel="Go to today"
          >
            <Text style={styles.todayBtnText}>Today</Text>
          </Pressable>
        </View>

        {/* 6. QUICK RULES */}
        <View style={styles.quickRulesGrid}>
          <Pressable style={styles.quickRuleCard} accessibilityRole="button" accessibilityLabel="Set Recurring">
            <View style={[styles.quickRuleIconBg, { backgroundColor: colors.success }]}>
              <Ionicons name="refresh" size={20} color={colors.primary} />
            </View>
            <Text style={styles.quickRuleText}>Set Recurring</Text>
          </Pressable>
          <Pressable style={styles.quickRuleCard} accessibilityRole="button" accessibilityLabel="Block Time Off">
            <View style={[styles.quickRuleIconBg, { backgroundColor: '#FEF3C7' }]}>
              <Ionicons name="calendar" size={20} color="#D97706" />
            </View>
            <Text style={styles.quickRuleText}>Block Time Off</Text>
          </Pressable>
        </View>

        {/* 7. DAY SELECTOR */}
        <View style={styles.daySelectorSection}>
          <View style={styles.daySelectorHeader}>
            <Text style={styles.sectionTitle}>SELECT DAY</Text>
            <Text style={styles.sectionHint}>Tap slot to toggle state</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dayStrip}>
            {MOCK_WEEK_DAYS.map((day, idx) => {
              const isActive = idx === selectedDay;
              return (
                <Pressable
                  key={day.id}
                  style={[styles.dayItem, isActive && styles.dayItemActive]}
                  onPress={() => setSelectedDay(idx)}
                  accessibilityRole="button"
                  accessibilityLabel={`Select ${day.dayName}, ${day.dateStr}`}
                >
                  <Text style={[styles.dayItemName, isActive && styles.dayItemTextActive]}>{day.dayName}</Text>
                  <Text style={[styles.dayItemDate, isActive && styles.dayItemTextActive]}>{day.dateNum}</Text>
                  <View style={[styles.dayStatusDot, { backgroundColor: getStatusColor(day.status) }]} />
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {/* 8. ACTIVE DAY HEADER */}
        <View style={styles.activeDayHeader}>
          <View>
            <Text style={styles.activeDayTitle}>{currentDay?.dayName}, {currentDay?.dateStr}</Text>
            <View style={styles.activeDayStatsRow}>
              <Text style={[styles.activeDayStatText, { color: colors.primary }]}>5 available</Text>
              <Text style={styles.activeDayStatDot}> \u2022 </Text>
              <Text style={[styles.activeDayStatText, { color: colors.textSecondary }]}>1 confirmed</Text>
              <Text style={styles.activeDayStatDot}> \u2022 </Text>
              <Text style={[styles.activeDayStatText, { color: colors.textSecondary }]}>1 closed</Text>
            </View>
          </View>
          <Pressable 
            style={styles.markAllBtn}
            onPress={markAllOpen}
            accessibilityRole="button"
            accessibilityLabel="Mark all slots as open"
          >
            <Text style={styles.markAllBtnText}>Mark All</Text>
          </Pressable>
        </View>

        {/* 10. TIME SLOTS LIST */}
        <View style={styles.slotsList}>
          {slots.map((slot, index) => {
            const isOpen = slot.status === 'open';
            const isBooked = slot.status === 'booked';
            const isClosed = slot.status === 'closed';

            return (
              <View key={slot.id} style={[styles.slotItem, isClosed && styles.slotItemClosed]}>
                <View style={styles.slotTimeBlock}>
                  <Text style={[styles.slotTimeText, isClosed && styles.slotTimeStrikethrough]}>{slot.startTime}</Text>
                  <Text style={[styles.slotTimeTextEnd, isClosed && styles.slotTimeStrikethrough]}>{slot.endTime}</Text>
                </View>
                
                <View style={styles.slotDetails}>
                  <View style={styles.slotDetailsHeader}>
                    {isOpen && <Ionicons name="time" size={16} color={colors.primary} />}
                    {isBooked && <Ionicons name="calendar" size={16} color={colors.textSecondary} />}
                    {isClosed && <Ionicons name="ban" size={16} color={colors.textSecondary} />}
                    <Text style={[styles.slotTitle, isClosed && styles.slotTitleClosed]} numberOfLines={1}>
                      {slot.title}
                    </Text>
                  </View>
                </View>

                <Pressable
                  style={[
                    styles.slotActionBtn,
                    isOpen && styles.slotActionBtnOpen,
                    isBooked && styles.slotActionBtnBooked,
                    isClosed && styles.slotActionBtnClosed
                  ]}
                  onPress={() => !isBooked && toggleSlotStatus(index)}
                  accessibilityRole="button"
                  accessibilityLabel={`Toggle slot ${slot.startTime} to ${slot.endTime}. Currently ${slot.status}`}
                  disabled={isBooked}
                >
                  <Text style={[
                    styles.slotActionText,
                    isOpen && styles.slotActionTextOpen,
                    isBooked && styles.slotActionTextBooked,
                    isClosed && styles.slotActionTextClosed
                  ]}>
                    {isOpen ? 'Open' : isBooked ? 'Booked' : 'Closed'}
                  </Text>
                </Pressable>
              </View>
            );
          })}
        </View>

        {/* 11. SCHEDULING PREFERENCES */}
        <View style={styles.preferencesSection}>
          <View style={styles.preferencesHeader}>
            <Ionicons name="settings-outline" size={20} color={colors.text} />
            <Text style={styles.preferencesTitle}>Scheduling Preferences</Text>
          </View>
          
          {preferences.map((pref, idx) => (
            <View key={pref.id} style={styles.preferenceRow}>
              <View style={styles.preferenceTextCol}>
                <Text style={styles.preferenceTitle}>{pref.title}</Text>
                {pref.subtitle && <Text style={styles.preferenceSubtitle}>{pref.subtitle}</Text>}
              </View>
              <Switch
                value={pref.enabled}
                onValueChange={() => togglePreference(idx)}
                trackColor={{ false: colors.border, true: colors.success }}
                thumbColor={colors.white}
                ios_backgroundColor={colors.border}
              />
            </View>
          ))}
        </View>

        {/* 9. SAVE BUTTON */}
        <View style={styles.saveSection}>
          {feedbackMessage && <Text style={styles.feedbackText}>{feedbackMessage}</Text>}
          <Pressable 
            style={styles.saveBtn}
            onPress={handleSave}
            accessibilityRole="button"
            accessibilityLabel="Save Availability"
          >
            <Ionicons name="checkmark" size={20} color={colors.white} style={styles.saveBtnIcon} />
            <Text style={styles.saveBtnText}>Save Availability</Text>
          </Pressable>
          <Text style={styles.saveHintText}>Changes apply to future bookings only.</Text>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  greenDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  avatarCircle: {
    width: 32,
    height: 32,
    borderRadius: radius.full,
    backgroundColor: '#F5E6D3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.text,
  },
  subHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: TOUCH_TARGET,
    minWidth: TOUCH_TARGET,
  },
  autoSyncPill: {
    backgroundColor: colors.success,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
  },
  autoSyncText: {
    color: colors.primary,
    fontWeight: '600',
    fontSize: 12,
  },
  titleBlock: {
    marginTop: spacing.lg,
  },
  mainTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  subTitle: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  viewSwitcherContainer: {
    marginTop: spacing.lg,
    alignItems: 'center',
  },
  viewSwitcher: {
    flexDirection: 'row',
    backgroundColor: colors.border, // slightly muted bg
    borderRadius: radius.full,
    padding: 4,
  },
  viewSwitchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    minHeight: 40,
  },
  viewSwitchBtnActive: {
    backgroundColor: colors.white,
  },
  viewSwitchIcon: {
    marginRight: spacing.xs,
  },
  viewSwitchText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  viewSwitchTextActive: {
    color: colors.text,
  },
  dateNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  dateNavArrows: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  dateNavText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  todayBtn: {
    backgroundColor: colors.white,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    minHeight: TOUCH_TARGET,
    justifyContent: 'center',
  },
  todayBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  quickRulesGrid: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  quickRuleCard: {
    flex: 1,
    backgroundColor: colors.white,
    padding: spacing.md,
    borderRadius: radius.md,
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    minHeight: TOUCH_TARGET,
  },
  quickRuleIconBg: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickRuleText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  daySelectorSection: {
    marginTop: spacing.xl,
  },
  daySelectorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: colors.textSecondary,
    letterSpacing: 1,
  },
  sectionHint: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  dayStrip: {
    gap: spacing.sm,
    paddingBottom: spacing.xs,
  },
  dayItem: {
    backgroundColor: colors.white,
    width: 56,
    height: 72,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayItemActive: {
    backgroundColor: colors.primary,
  },
  dayItemName: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  dayItemDate: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 6,
  },
  dayItemTextActive: {
    color: colors.white,
  },
  dayStatusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  activeDayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.xl,
    marginBottom: spacing.md,
  },
  activeDayTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
  },
  activeDayStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  activeDayStatText: {
    fontSize: 12,
    fontWeight: '600',
  },
  activeDayStatDot: {
    fontSize: 12,
    color: colors.textSecondary,
    marginHorizontal: 4,
  },
  markAllBtn: {
    backgroundColor: colors.white,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: TOUCH_TARGET,
    justifyContent: 'center',
  },
  markAllBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  slotsList: {
    gap: spacing.sm,
  },
  slotItem: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    padding: spacing.md,
    borderRadius: radius.md,
    alignItems: 'center',
  },
  slotItemClosed: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
  },
  slotTimeBlock: {
    width: 60,
  },
  slotTimeText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.text,
  },
  slotTimeTextEnd: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  slotTimeStrikethrough: {
    textDecorationLine: 'line-through',
    color: colors.textSecondary,
  },
  slotDetails: {
    flex: 1,
    paddingHorizontal: spacing.md,
  },
  slotDetailsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  slotTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    flexShrink: 1,
  },
  slotTitleClosed: {
    color: colors.textSecondary,
  },
  slotActionBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    minHeight: 36,
    justifyContent: 'center',
  },
  slotActionBtnOpen: {
    backgroundColor: colors.success,
  },
  slotActionBtnBooked: {
    backgroundColor: '#333333',
  },
  slotActionBtnClosed: {
    backgroundColor: colors.border,
  },
  slotActionText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  slotActionTextOpen: {
    color: colors.primary,
  },
  slotActionTextBooked: {
    color: colors.white,
  },
  slotActionTextClosed: {
    color: colors.textSecondary,
  },
  preferencesSection: {
    marginTop: spacing.xl,
    backgroundColor: colors.white,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  preferencesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  preferencesTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
  },
  preferenceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  preferenceTextCol: {
    flex: 1,
    paddingRight: spacing.md,
  },
  preferenceTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  preferenceSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  saveSection: {
    marginTop: spacing.xl,
    alignItems: 'center',
  },
  feedbackText: {
    color: colors.primary,
    fontWeight: '600',
    marginBottom: spacing.md,
  },
  saveBtn: {
    flexDirection: 'row',
    backgroundColor: colors.primary,
    width: '100%',
    paddingVertical: spacing.md,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: TOUCH_TARGET,
  },
  saveBtnIcon: {
    marginRight: spacing.sm,
  },
  saveBtnText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  saveHintText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },
});
