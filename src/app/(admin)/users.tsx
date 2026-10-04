// Admin panel - Viduth (Member 1). Supports FR01, NFR01.

import AdminHeader from "@/components/admin/AdminHeader";
import RoleBadge from "@/components/admin/RoleBadge";
import RoleSheet, { displayName } from "@/components/admin/RoleSheet";
import StaffRequests, { RequestDecision } from "@/components/admin/StaffRequests";
import Button from "@/components/common/Button";
import Card from "@/components/common/Card";
import Input from "@/components/common/Input";
import Screen from "@/components/common/Screen";
import { useAuth } from "@/context/AuthContext";
import {
  AssignableRole,
  listCounsellors,
  listUsers,
  pendingStaffRequests,
} from "@/services/adminService";
import { getAuthErrorMessage, isStaffRequest, UserProfile } from "@/services/authService";
import { colors, radius, spacing, TOUCH_TARGET, typography } from "@/theme";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";

type Filter = "all" | AssignableRole;

const FILTERS: { key: Filter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "student", label: "Students" },
  { key: "counsellor", label: "Counsellors" },
  { key: "lecturer", label: "Lecturers" },
];

// Registered users by name first, guests last
const byName = (a: UserProfile, b: UserProfile) =>
  Number(a.isGuest) - Number(b.isGuest) ||
  displayName(a).localeCompare(displayName(b));

export default function Users() {
  const { user: me } = useAuth();
  const params = useLocalSearchParams<{ requests?: string }>();
  const listRef = useRef<FlatList<UserProfile>>(null);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState<string>();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [selected, setSelected] = useState<UserProfile | null>(null);
  // uids with a counsellors/{uid} profile (for the role-change warning)
  const [profileIds, setProfileIds] = useState<Set<string>>(new Set());

  const load = useCallback(async () => {
    setLoadError(undefined);
    try {
      const [list, profiles] = await Promise.all([listUsers(), listCounsellors()]);
      setUsers(list.sort(byName));
      setProfileIds(new Set(profiles.map((p) => p.uid)));
    } catch (e) {
      setLoadError(getAuthErrorMessage(e));
    }
  }, []);

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, [load]);

  // "Review request" (Counsellors form) opens Requests, which sit at the top
  // of the list. Reload first: this tab stays mounted, so a new sign-up
  // wouldn't be listed yet.
  useEffect(() => {
    if (params.requests && !loading) {
      router.setParams({ requests: undefined });
      listRef.current?.scrollToOffset({ offset: 0, animated: true });
      load();
    }
  }, [params.requests, loading, load]);

  const refresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  // Update the list in place so the change shows without a reload
  const handleRoleChanged = (uid: string, role: AssignableRole) =>
    setUsers((prev) => prev.map((u) => (u.uid === uid ? { ...u, role } : u)));

  // Approved: becomes the requested role, request fields gone. Rejected: stays.
  const handleDecision = (d: RequestDecision) =>
    setUsers((prev) =>
      prev.map((u) => {
        if (u.uid !== d.uid) return u;
        if (!d.approved) return { ...u, approvalStatus: "rejected" };
        const { requestedRole: _r, approvalStatus: _a, ...rest } = u;
        return { ...rest, role: d.role };
      }),
    );

  const requests = useMemo(() => pendingStaffRequests(users), [users]);

  const counts = useMemo(
    () => ({
      // Staff sign-ups have role "student" until approved; they're not students
      student: users.filter((u) => u.role === "student" && !isStaffRequest(u)).length,
      counsellor: users.filter((u) => u.role === "counsellor").length,
      lecturer: users.filter((u) => u.role === "lecturer").length,
    }),
    [users],
  );

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();
    return users.filter(
      (u) =>
        (filter === "all" || u.role === filter) &&
        (!term ||
          [displayName(u), u.email ?? "", u.anonId].some((field) =>
            field.toLowerCase().includes(term),
          )),
    );
  }, [users, search, filter]);

  // Passed as an element (not a component) so the search box keeps focus while typing
  const header = (
    <View>
      <AdminHeader title="User Management" />

      {loadError ? null : <StaffRequests requests={requests} onDecided={handleDecision} />}

      <View style={styles.summary}>
        {(
          [
            ["Students", counts.student],
            ["Counsellors", counts.counsellor],
            ["Lecturers", counts.lecturer],
          ] as const
        ).map(([label, count]) => (
          <Card
            key={label}
            style={styles.stat}
          >
            <View accessible accessibilityLabel={`${count} ${label}`}>
              <Text style={styles.statCount}>{count}</Text>
              <Text style={typography.caption}>{label}</Text>
            </View>
          </Card>
        ))}
      </View>

      <Input
        label="Search users"
        icon="search-outline"
        placeholder="Name, email or anon ID"
        value={search}
        onChangeText={setSearch}
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="search"
      />

      <View style={styles.chips}>
        {FILTERS.map(({ key, label }) => {
          const active = filter === key;
          return (
            <Pressable
              key={key}
              onPress={() => setFilter(key)}
              accessibilityRole="button"
              accessibilityLabel={`Show ${label.toLowerCase()}`}
              accessibilityState={{ selected: active }}
              style={[styles.chip, active && styles.chipActive]}
            >
              <Text style={[styles.chipText, active && styles.chipTextActive]}>
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );

  const renderUser = ({ item }: { item: UserProfile }) => {
    const isSelf = item.uid === me?.uid;
    // Admin roles (including your own) are only changed in the Firebase console
    const locked = isSelf || item.role === "admin";
    const name = displayName(item);
    const details = (
      <Card style={styles.userCard}>
        <View style={styles.userInfo}>
          <View style={styles.nameRow}>
            <Text style={styles.userName}>{name}</Text>
            {isSelf ? <Text style={typography.caption}>(You)</Text> : null}
          </View>
          <Text style={typography.caption}>{item.email ?? "No email"}</Text>
          {isStaffRequest(item) ? (
            <Text style={[typography.caption, styles.request]}>
              Requested {item.requestedRole ?? "staff"} ·{" "}
              {item.approvalStatus === "rejected" ? "rejected" : "waiting for approval"}
            </Text>
          ) : (
            <Text style={typography.caption}>{item.anonId}</Text>
          )}
        </View>
        <View style={styles.userSide}>
          <RoleBadge role={item.role} />
          {!locked ? (
            <Ionicons
              name="chevron-forward"
              size={18}
              color={colors.textSecondary}
              accessibilityElementsHidden
              importantForAccessibility="no"
            />
          ) : null}
        </View>
      </Card>
    );

    const summary = isStaffRequest(item)
      ? `${name}, requested ${item.requestedRole ?? "staff"}, ${item.approvalStatus}, ${item.email ?? "no email"}`
      : `${name}, ${item.role}, ${item.email ?? "no email"}, ${item.anonId}`;
    if (locked) {
      return (
        <View accessible accessibilityLabel={isSelf ? `${summary}, you` : summary}>
          {details}
        </View>
      );
    }
    return (
      <Pressable
        onPress={() => setSelected(item)}
        accessibilityRole="button"
        accessibilityLabel={summary}
        accessibilityHint="Opens role options"
        style={({ pressed }) => [pressed && styles.pressed]}
      >
        {details}
      </Pressable>
    );
  };

  const empty = loading ? (
    <ActivityIndicator
      size="large"
      color={colors.primary}
      style={styles.stateBox}
      accessibilityLabel="Loading users"
    />
  ) : loadError ? (
    <Card style={styles.stateBox}>
      <Text style={[typography.heading, styles.center]}>
        Couldn't load users
      </Text>
      <Text style={[typography.body, styles.center, styles.stateText]}>
        {loadError}
      </Text>
      <Button title="Try Again" onPress={refresh} loading={refreshing} />
    </Card>
  ) : (
    <View style={styles.stateBox}>
      <Ionicons
        name="people-outline"
        size={40}
        color={colors.textSecondary}
        style={styles.centerSelf}
        accessibilityElementsHidden
        importantForAccessibility="no"
      />
      <Text style={[typography.body, styles.center, styles.stateText]}>
        {users.length === 0
          ? "No users yet."
          : "No users match your search or filter."}
      </Text>
    </View>
  );

  return (
    <Screen scroll={false}>
      <FlatList
        ref={listRef}
        data={loadError ? [] : visible}
        keyExtractor={(u) => u.uid}
        renderItem={renderUser}
        ListHeaderComponent={header}
        ListEmptyComponent={empty}
        contentContainerStyle={styles.list}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      />
      <RoleSheet
        user={selected}
        hasCounsellorProfile={!!selected && profileIds.has(selected.uid)}
        onClose={() => setSelected(null)}
        onRoleChanged={handleRoleChanged}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { padding: spacing.lg, flexGrow: 1 },
  summary: { flexDirection: "row", gap: spacing.sm },
  stat: { flex: 1, alignItems: "center", paddingVertical: spacing.sm },
  statCount: { ...typography.heading, textAlign: "center" },
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  chip: {
    minHeight: TOUCH_TARGET,
    paddingHorizontal: spacing.md,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    justifyContent: "center",
  },
  chipActive: { backgroundColor: colors.selected, borderColor: colors.primary },
  chipText: { fontSize: 14, fontWeight: "600", color: colors.textSecondary },
  chipTextActive: { color: colors.primary },
  userCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    minHeight: TOUCH_TARGET,
    marginBottom: spacing.sm,
  },
  userInfo: { flex: 1, gap: 2 },
  nameRow: { flexDirection: "row", alignItems: "center", gap: spacing.xs },
  userName: { ...typography.body, fontWeight: "600", flexShrink: 1 },
  request: { color: colors.primary, fontWeight: "600" },
  userSide: { flexDirection: "row", alignItems: "center", gap: spacing.xs },
  pressed: { opacity: 0.7 },
  stateBox: { marginTop: spacing.xl },
  stateText: { marginVertical: spacing.sm },
  center: { textAlign: "center" },
  centerSelf: { alignSelf: "center" },
});
