// Admin panel - Viduth (Member 1). Supports FR01, FR03, NFR01.
//
// Create, edit and delete counsellors/{uid} profiles that students browse
// when booking. Doc id = the counsellor's uid (the security rules check it).

import AdminHeader from "@/components/admin/AdminHeader";
import CounsellorForm from "@/components/admin/CounsellorForm";
import IconButton from "@/components/admin/IconButton";
import { displayName } from "@/components/admin/RoleSheet";
import {
  EmptyState,
  ErrorState,
  InlineError,
  LoadingState,
  SuccessNotice,
} from "@/components/admin/StateViews";
import ToggleRow from "@/components/admin/ToggleRow";
import Button from "@/components/common/Button";
import Card from "@/components/common/Card";
import Screen from "@/components/common/Screen";
import {
  deleteCounsellor,
  listCounsellors,
  listUsers,
  updateCounsellor,
} from "@/services/adminService";
import { getAuthErrorMessage, UserProfile } from "@/services/authService";
import { colors, radius, spacing, typography } from "@/theme";
import { CounsellorProfile } from "@/types/counsellor";
import { confirmAction } from "@/utils/confirm";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { FlatList, RefreshControl, StyleSheet, Text, View } from "react-native";

type FormState = { existing: CounsellorProfile | null; initialUid?: string };

const initials = (name: string) =>
  name
    .replace(/^(dr|mr|mrs|ms|prof)\.?\s+/i, "")
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

export default function Counsellors() {
  const params = useLocalSearchParams<{ new?: string }>();
  const [profiles, setProfiles] = useState<CounsellorProfile[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState<string>();
  const [form, setForm] = useState<FormState | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busyUid, setBusyUid] = useState<string | null>(null);
  const [rowErrors, setRowErrors] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    setLoadError(undefined);
    try {
      const [p, u] = await Promise.all([listCounsellors(), listUsers()]);
      setProfiles(p);
      setUsers(u);
    } catch (e) {
      setLoadError(getAuthErrorMessage(e));
    }
  }, []);

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, [load]);

  // "Add counsellor profile" on Overview opens the form here
  useEffect(() => {
    if (params.new && !loading) {
      setForm({ existing: null });
      router.setParams({ new: undefined });
    }
  }, [params.new, loading]);

  const refresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  // Users with the counsellor role who don't have a profile yet
  const missing = useMemo(() => {
    const ids = new Set(profiles.map((p) => p.uid));
    return users.filter((u) => u.role === "counsellor" && !ids.has(u.uid));
  }, [profiles, users]);

  const hideNotice = useCallback(() => setNotice(null), []);

  const setRowError = (uid: string, message?: string) =>
    setRowErrors((prev) => {
      const next = { ...prev };
      if (message) next[uid] = message;
      else delete next[uid];
      return next;
    });

  // Optimistic: flip it now, undo if the save fails
  const toggleAvailable = async (profile: CounsellorProfile, isAvailable: boolean) => {
    setRowError(profile.uid);
    setBusyUid(profile.uid);
    setProfiles((prev) =>
      prev.map((p) => (p.uid === profile.uid ? { ...p, isAvailable } : p)),
    );
    try {
      await updateCounsellor(profile.uid, { isAvailable });
    } catch (e) {
      setProfiles((prev) =>
        prev.map((p) =>
          p.uid === profile.uid ? { ...p, isAvailable: !isAvailable } : p,
        ),
      );
      setRowError(profile.uid, getAuthErrorMessage(e));
    } finally {
      setBusyUid(null);
    }
  };

  const handleDelete = async (profile: CounsellorProfile) => {
    const ok = await confirmAction({
      title: `Delete ${profile.fullName}'s profile?`,
      message:
        "Students will no longer see or book this counsellor. Their account and role stay the same, and you can create a new profile later.",
      confirmText: "Delete",
    });
    if (!ok) return;
    setRowError(profile.uid);
    setBusyUid(profile.uid);
    try {
      await deleteCounsellor(profile.uid);
      setProfiles((prev) => prev.filter((p) => p.uid !== profile.uid));
      setNotice(`${profile.fullName}'s profile was deleted.`);
    } catch (e) {
      setRowError(profile.uid, getAuthErrorMessage(e));
    } finally {
      setBusyUid(null);
    }
  };

  const handleSaved = (message: string) => {
    setForm(null);
    setNotice(message);
    load();
  };

  const header = (
    <View>
      <AdminHeader title="Counsellors" subtitle="Profiles students see when booking">
        <Button
          title="Add Counsellor Profile"
          icon="person-add-outline"
          onPress={() => setForm({ existing: null })}
          style={styles.addButton}
        />
      </AdminHeader>
      <SuccessNotice message={notice} onHide={hideNotice} />

      {!loading && !loadError && missing.length > 0 ? (
        <Card style={styles.warning}>
          <View style={styles.warningTitle}>
            <Ionicons
              name="alert-circle"
              size={20}
              color={colors.danger}
              accessibilityElementsHidden
              importantForAccessibility="no"
            />
            <Text style={[typography.body, styles.bold]} accessibilityRole="header">
              {missing.length === 1
                ? "1 counsellor has no profile yet"
                : `${missing.length} counsellors have no profile yet`}
            </Text>
          </View>
          <Text style={typography.caption}>
            Students can't find or book them until a profile exists.
          </Text>
          {missing.map((user) => (
            <View key={user.uid} style={styles.missingRow}>
              <View style={styles.flex}>
                <Text style={styles.bold}>{displayName(user)}</Text>
                <Text style={typography.caption}>{user.email ?? "No email"}</Text>
              </View>
              <Button
                title="Create"
                variant="secondary"
                onPress={() => setForm({ existing: null, initialUid: user.uid })}
                style={styles.smallButton}
              />
            </View>
          ))}
        </Card>
      ) : null}
    </View>
  );

  const renderProfile = ({ item }: { item: CounsellorProfile }) => (
    <Card>
      <View style={styles.cardTop}>
        <View
          style={styles.avatar}
          accessibilityElementsHidden
          importantForAccessibility="no"
        >
          <Text style={styles.avatarText}>{initials(item.fullName)}</Text>
        </View>
        <View style={styles.flex}>
          <Text style={styles.name}>{item.fullName}</Text>
          <Text style={typography.caption}>{item.title}</Text>
          <Text style={typography.caption}>
            {item.experienceYears} {item.experienceYears === 1 ? "year" : "years"} ·{" "}
            {item.languages.join(", ")}
          </Text>
        </View>
        <IconButton
          icon="create-outline"
          label={`Edit ${item.fullName}'s profile`}
          onPress={() => setForm({ existing: item })}
          disabled={busyUid === item.uid}
        />
        <IconButton
          icon="trash-outline"
          label={`Delete ${item.fullName}'s profile`}
          onPress={() => handleDelete(item)}
          danger
          loading={busyUid === item.uid}
        />
      </View>

      <View style={styles.chips}>
        {item.specialties.map((s) => (
          <View key={s} style={styles.chip}>
            <Text style={styles.chipText}>{s}</Text>
          </View>
        ))}
      </View>

      <InlineError message={rowErrors[item.uid]} />
      <ToggleRow
        label="Available"
        description={
          item.isAvailable ? "Students can book this counsellor" : "Hidden from booking"
        }
        value={item.isAvailable}
        onValueChange={(value) => toggleAvailable(item, value)}
        disabled={busyUid === item.uid}
      />
    </Card>
  );

  const empty = loading ? (
    <LoadingState label="Loading counsellors" />
  ) : loadError ? (
    <ErrorState
      title="Couldn't load counsellors"
      message={loadError}
      onRetry={refresh}
      retrying={refreshing}
    />
  ) : (
    <EmptyState
      icon="id-card-outline"
      message="No counsellor profiles yet. Add one so students can book sessions."
    />
  );

  return (
    <Screen scroll={false}>
      <FlatList
        data={loadError ? [] : profiles}
        keyExtractor={(p) => p.uid}
        renderItem={renderProfile}
        ListHeaderComponent={header}
        ListEmptyComponent={empty}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      />
      {form ? (
        <CounsellorForm
          existing={form.existing}
          candidates={missing}
          initialUid={form.initialUid}
          onClose={() => setForm(null)}
          onSaved={handleSaved}
        />
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { padding: spacing.lg, flexGrow: 1 },
  addButton: { marginTop: spacing.md },
  warning: {
    backgroundColor: colors.dangerTint,
    gap: spacing.sm,
  },
  warningTitle: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  missingRow: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  smallButton: { paddingHorizontal: spacing.md },
  bold: { ...typography.body, fontWeight: "600" },
  flex: { flex: 1 },
  cardTop: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: radius.full,
    backgroundColor: colors.selected,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { fontSize: 16, fontWeight: "700", color: colors.primary },
  name: { ...typography.body, fontWeight: "600" },
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
    marginVertical: spacing.md,
  },
  chip: {
    backgroundColor: colors.success,
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  chipText: { fontSize: 12, fontWeight: "600", color: colors.primary },
});
